from contextlib import asynccontextmanager
from fastapi import FastAPI, HTTPException, Request, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import SQLModel, Session, create_engine, select, delete, or_, text
from passlib.context import CryptContext
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from typing import List
import jwt
import os
import hashlib
import secrets
import smtplib
from email.message import EmailMessage
from datetime import datetime, timedelta, timezone

from models import (
    RolUsuario,
    Usuario,
    Repuesto,
    RepuestoCreate,
    RepuestoUpdate,
    Reparacion,
    ConsumoRepuesto,
    ConsumoRequest,
    ConsumoResponse,
    ErrorResponse,
    EstadoIncidencia,
    Incidencia,
    IncidenciaCreate,
    IncidenciaUpdate,
    EstadoMaquina,
    Maquina,
    MaquinaCreate,
    MaquinaUpdate,
    CodigoRecuperacion,
    MovimientoStock,
    MovimientoStockCreate,)

# ==========================================
# 1. CONFIGURACIÓN DE BASE DE DATOS Y SEGURIDAD
# ==========================================

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+pg8000://postgres:postgres@db-mantenimiento:5432/mantenimiento_db"
)
engine = create_engine(DATABASE_URL)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
SECRET_KEY = "clave_super_secreta_tci_2026"
ALGORITHM = "HS256"

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="login")

# ==========================================
# 2. LIFESPAN: CREACIÓN DE TABLAS Y ÚNICO SUPERVISOR INICIAL
# ==========================================

def seed_initial_data() -> None:
    with Session(engine) as session:
        # Usuario administrador inicial si la base está vacía.
        if not session.exec(select(Usuario.id)).first():
            usuario_principal = Usuario(
                username="ceci",
                nombre="Cecilia",
                apellido="Ballarre",
                hashed_password=pwd_context.hash("admin123"),
                rol=RolUsuario.SUPERVISOR,
            )
            session.add(usuario_principal)

        # Catálogo mínimo para que el circuito de consulta y consumo pueda
        # demostrarse desde el primer arranque sin cargar datos manualmente.
        if not session.exec(select(Repuesto.codigo)).first():
            for repuesto in (
                Repuesto(codigo="FIL-001", nombre="Filtro de aire industrial", stock_disponible=12, ubicacion="Estante A-4"),
                Repuesto(codigo="MOT-005", nombre="Motor trifásico de cinta transportadora", stock_disponible=3, ubicacion="Depósito B-12"),
                Repuesto(codigo="PLA-104", nombre="Placa de control PLC principal", stock_disponible=8, ubicacion="Armario eléctrico 1"),
            ):
                session.add(repuesto)

        session.commit()


def preparar_columnas_existentes() -> None:
    """Actualiza instalaciones ya creadas sin perder los usuarios existentes."""
    if engine.dialect.name != "postgresql":
        return
    with engine.begin() as conexion:
        conexion.execute(text("ALTER TABLE usuario ADD COLUMN IF NOT EXISTS email VARCHAR"))
        conexion.execute(text("ALTER TABLE incidencia ALTER COLUMN timestamp_creacion TYPE BIGINT"))


@asynccontextmanager
async def lifespan(app: FastAPI):
    SQLModel.metadata.create_all(engine)
    preparar_columnas_existentes()
    seed_initial_data()
    yield


# ==========================================
# 3. INICIALIZACIÓN DE FASTAPI, CORS Y RATE LIMIT
# ==========================================
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(
    title="API Gestión Planta Farmacéutica - Auth, RBAC e Inventario",
    lifespan=lifespan,
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_session():
    with Session(engine) as session:
        yield session


def enviar_codigo_recuperacion(destinatario: str, codigo: str) -> None:
    usuario_smtp = os.getenv("SMTP_USER")
    clave_smtp = os.getenv("SMTP_PASSWORD")
    if not usuario_smtp or not clave_smtp:
        raise HTTPException(status_code=503, detail="El correo de recuperación todavía no está configurado.")

    mensaje = EmailMessage()
    mensaje["Subject"] = "CLG Planta - código de recuperación"
    mensaje["From"] = usuario_smtp
    mensaje["To"] = destinatario
    mensaje.set_content(
        "Solicitaste recuperar o desbloquear tu acceso a CLG Planta.\n\n"
        f"Tu código es: {codigo}\n\n"
        "Vence en 15 minutos. Si no solicitaste este código, ignorá este correo."
    )

    host = os.getenv("SMTP_HOST", "smtp.gmail.com")
    puerto = int(os.getenv("SMTP_PORT", "465"))
    try:
        with smtplib.SMTP_SSL(host, puerto, timeout=10) as smtp:
            smtp.login(usuario_smtp, clave_smtp)
            smtp.send_message(mensaje)
    except OSError as error:
        raise HTTPException(status_code=502, detail="No se pudo enviar el correo de recuperación.") from error

# ==========================================
# 4. DEPENDENCIA DE VALIDACIÓN DE SESIÓN (JWT)
# ==========================================
def obtener_usuario_actual(
    token: str = Depends(oauth2_scheme),
    session: Session = Depends(get_session)
) -> Usuario:

    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if not username:
            raise HTTPException(status_code=401, detail="Token inválido")
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Token expirado o inválido")

    user = session.exec(select(Usuario).where(Usuario.username == username)).first()
    if not user or user.bloqueado:
        raise HTTPException(status_code=401, detail="Usuario no autorizado o bloqueado")
    return user

def verificar_supervisor(usuario_actual: Usuario) -> None:
    if usuario_actual.rol != RolUsuario.SUPERVISOR:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Se requiere rol de Supervisor para gestionar personal.",
        )

def buscar_maquina_por_referencia(session: Session, referencia: str) -> Maquina | None:
    """Busca una única máquina en SQL por código o nombre sin traer toda la tabla."""
    texto = referencia.strip()
    if not texto:
        return None
    return session.exec(
        select(Maquina).where(
            or_(
                Maquina.codigo.ilike(texto),
                Maquina.nombre.ilike(f"%{texto}%"),
            )
        )
    ).first()


# ==========================================
# 5. ENDPOINTS DE AUTENTICACIÓN Y GESTIÓN DE PERSONAL
# ==========================================
@app.get("/health")
def health_check():
    """Walking skeleton para verificar estado de la API (M3)"""
    return {"status": "ok", "servicio": "auth-backend"}

@app.post("/login")
@limiter.limit("5/minute") # OWASP: Protección contra fuerza bruta (máx 5 intentos/min por IP)
def login(request: Request, datos: dict, session: Session = Depends(get_session)):
    username = datos.get("username")
    password = datos.get("password")
    token_captcha = datos.get("token_captcha")

    # 1. Verificación de humano (Captcha)
    if not token_captcha:
        raise HTTPException(status_code=400, detail="Falta validación Captcha")

    # 2. Buscar usuario en PostgreSQL
    user = session.exec(select(Usuario).where(Usuario.username == username)).first()
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    # 3. Verificar bloqueo por errores repetidos
    if user.bloqueado:
        raise HTTPException(
            status_code=403,
            detail="Usuario bloqueado por múltiples intentos fallidos. Contacte al supervisor."
        )

    # 4. Verificar contraseña hasheada con bcrypt (jamás texto plano)
    if not pwd_context.verify(password, user.hashed_password):
        user.intentos_fallidos += 1
        if user.intentos_fallidos >= 5:
            user.bloqueado = True
        session.commit()
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    # 5. Login exitoso: resetear contador de errores
    if user.intentos_fallidos != 0:
        user.intentos_fallidos = 0
        session.commit()

    # 6. Emitir JWT para mantener la sesión entre requests
    payload = {
        "sub": user.username,
        "rol": user.rol.value,
        "exp": datetime.now(timezone.utc) + timedelta(hours=2)
    }
    token = jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)

    return {
        "access_token": token,
        "token_type": "bearer",
        "usuario": user.username,
        "nombre": user.nombre,
        "apellido": user.apellido,
        "rol": user.rol.value
    }


@app.post("/auth/recuperacion/solicitar")
@limiter.limit("3/minute")
def solicitar_recuperacion(request: Request, datos: dict, session: Session = Depends(get_session)):
    username = (datos.get("username") or "").strip()
    user = session.exec(select(Usuario).where(Usuario.username == username)).first()

    # La misma respuesta evita revelar qué nombres de usuario existen.
    respuesta = {"mensaje": "Si el usuario tiene un correo registrado, enviamos un código de recuperación."}
    if not user or not user.email:
        return respuesta

    codigo = f"{secrets.randbelow(1_000_000):06d}"
    registro = CodigoRecuperacion(
        username=user.username,
        codigo_hash=hashlib.sha256(codigo.encode()).hexdigest(),
        vence_en=datetime.now(timezone.utc) + timedelta(minutes=15),
    )
    session.add(registro)
    session.commit()
    enviar_codigo_recuperacion(user.email, codigo)
    return respuesta


@app.post("/auth/recuperacion/verificar")
@limiter.limit("5/minute")
def confirmar_recuperacion(request: Request, datos: dict, session: Session = Depends(get_session)):
    username = (datos.get("username") or "").strip()
    codigo = (datos.get("codigo") or "").strip()
    nueva_password = datos.get("nueva_password") or ""
    if len(nueva_password) < 6:
        raise HTTPException(status_code=400, detail="La nueva contraseña debe tener al menos 6 caracteres.")

    registro = session.exec(
        select(CodigoRecuperacion)
        .where(CodigoRecuperacion.username == username)
        .where(CodigoRecuperacion.usado == False)
        .order_by(CodigoRecuperacion.id.desc())
    ).first()
    if not registro or registro.vence_en < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="El código no es válido o venció.")
    if not secrets.compare_digest(registro.codigo_hash, hashlib.sha256(codigo.encode()).hexdigest()):
        raise HTTPException(status_code=400, detail="El código no es válido o venció.")

    user = session.exec(select(Usuario).where(Usuario.username == username)).first()
    if not user:
        raise HTTPException(status_code=400, detail="El código no es válido o venció.")
    user.hashed_password = pwd_context.hash(nueva_password)
    user.bloqueado = False
    user.intentos_fallidos = 0
    registro.usado = True
    session.add(user)
    session.add(registro)
    session.commit()
    return {"mensaje": "Contraseña actualizada y usuario desbloqueado. Ya podés iniciar sesión."}

@app.post("/usuarios", status_code=201)
def crear_nuevo_usuario(
    datos: dict,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session)
):
    """Permite únicamente a usuarios con rol Supervisor registrar nuevos usuarios"""
    verificar_supervisor(usuario_actual)

    nuevo_username = (datos.get("username") or "").strip()
    nueva_password = datos.get("password")
    nuevo_rol = datos.get("rol")
    nombre = (datos.get("nombre") or datos.get("nombre_completo") or nuevo_username).strip()
    apellido = (datos.get("apellido") or "").strip()
    email = (datos.get("email") or "").strip().lower() or None

    if not nuevo_username or not nueva_password or not nuevo_rol:
        raise HTTPException(status_code=400, detail="Faltan datos obligatorios (username, password, rol)")

    # Validar que el rol enviado exista en el Enum
    try:
        rol_enum = RolUsuario(nuevo_rol)
    except ValueError:
        roles_validos = [r.value for r in RolUsuario]
        raise HTTPException(status_code=400, detail=f"Rol inválido. Opciones: {roles_validos}")

    # Verificar que no exista un usuario duplicado
    existente = session.exec(
        select(Usuario.id).where(Usuario.username.ilike(nuevo_username))).first()
    if existente:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")

    nuevo_usuario = Usuario(
        username=nuevo_username,
        apellido=apellido,
        nombre=nombre,
        email=email,
        hashed_password=pwd_context.hash(nueva_password),
        rol=rol_enum
    )
    session.add(nuevo_usuario)
    session.commit()
    session.refresh(nuevo_usuario)

    return {
        "mensaje": f"Usuario '{nuevo_usuario.username}' creado exitosamente por {usuario_actual.username}",
        "usuario": {
            "id": nuevo_usuario.id,
            "username": nuevo_usuario.username,
            "apellido": nuevo_usuario.apellido,
            "nombre": nuevo_usuario.nombre,
            "email": nuevo_usuario.email,
            "rol": nuevo_usuario.rol.value,
            "bloqueado": nuevo_usuario.bloqueado,
            "intentos_fallidos": nuevo_usuario.intentos_fallidos,
        },
        "rol": nuevo_usuario.rol.value
    }

@app.delete("/usuarios/{username_a_eliminar}", status_code=200)
def eliminar_usuario(
    username_a_eliminar: str,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session)
):

    verificar_supervisor(usuario_actual)

    # Evitar que el usuario se elimine a sí mismo por accidente
    if usuario_actual.username.lower() == username_a_eliminar.lower():
        raise HTTPException(
            status_code=400,
            detail="No puedes eliminar tu propia cuenta de usuario activa."
        )

    # Buscar el usuario a eliminar en la base de datos
    stmt = (
        delete(Usuario)
        .where(Usuario.username == username_a_eliminar)
        .returning(Usuario.id)
    )
    eliminado = session.exec(stmt).first()
    if not eliminado:
        raise HTTPException(status_code=404, detail="El usuario no existe")

    session.commit()
    return {"mensaje": f"Usuario '{username_a_eliminar}' eliminado exitosamente"}

@app.get("/usuarios")
def listar_usuarios(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session)
):
    usuarios = session.exec(select(Usuario).order_by(Usuario.id)).all()
    return [
        {
            "id": u.id,
            "username": u.username,
            "apellido": u.apellido,
            "nombre": u.nombre,
            "email": u.email,
            "rol": u.rol.value if hasattr(u.rol, "value") else u.rol,
            "bloqueado": u.bloqueado,
            "intentos_fallidos": u.intentos_fallidos
        }
        for u in usuarios
    ]

@app.put("/usuarios/{username_a_editar}")
def editar_usuario(
    username_a_editar: str,
    datos: dict,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session)
):

    verificar_supervisor(usuario_actual)

    nuevo_username = (datos.get("username") or "").strip() or None
    nueva_password = datos.get("password")
    nuevo_rol = datos.get("rol")
    nuevo_apellido = datos.get("apellido")
    nuevo_nombre = datos.get("nombre")
    nuevo_email = datos.get("email")
    nuevo_bloqueado = datos.get("bloqueado")

    if nuevo_username and nuevo_username.lower() != username_a_editar.lower():
        candidatos = session.exec(
            select(Usuario).where(
                or_(
                    Usuario.username == username_a_editar,
                    Usuario.username.ilike(nuevo_username),
            )
        )
        ).all()
        user_db = next((u for u in candidatos if u.username == username_a_editar), None)
        if not user_db:
            raise HTTPException(status_code=404, detail="El usuario no existe")
        if any(u.id != user_db.id for u in candidatos):
            raise HTTPException(status_code=400, detail="El nuevo nombre de usuario ya está en uso")
        user_db.username = nuevo_username
    else:
        user_db = session.exec(
            select(Usuario).where(Usuario.username == username_a_editar)
        ).first()
        if not user_db:
            raise HTTPException(status_code=404, detail="El usuario no existe")

    if nuevo_apellido is not None:
        user_db.apellido = nuevo_apellido

    if nuevo_nombre is not None:
        user_db.nombre = nuevo_nombre

    if nuevo_email is not None:
        user_db.email = nuevo_email.strip().lower() or None

    if nuevo_bloqueado is not None:
        user_db.bloqueado = bool(nuevo_bloqueado)
        if not user_db.bloqueado:
            user_db.intentos_fallidos = 0

    if nueva_password:
        user_db.hashed_password = pwd_context.hash(nueva_password)

    if nuevo_rol:
        try:
            user_db.rol = RolUsuario(nuevo_rol)
        except ValueError:
            roles_validos = [r.value for r in RolUsuario]
            raise HTTPException(status_code=400, detail=f"Rol inválido. Opciones: {roles_validos}")

    session.commit()
    session.refresh(user_db)

    return {
        "mensaje": f"Usuario '{user_db.username}' actualizado exitosamente",
        "usuario": user_db.username,
        "rol": user_db.rol.value,
        "apellido": user_db.apellido,
        "nombre": user_db.nombre,
        "email": user_db.email,
        "bloqueado": user_db.bloqueado,
    }

# ==========================================
# 6. CRUD DE MÁQUINAS DE PLANTA
# ==========================================

@app.get("/maquinas", response_model=List[Maquina])
def listar_maquinas(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session),
):
    return session.exec(select(Maquina).order_by(Maquina.codigo)).all()


@app.post("/maquinas", response_model=Maquina, status_code=status.HTTP_201_CREATED)
def crear_maquina(
    datos: MaquinaCreate,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session),
):
    codigo_norm = datos.codigo.strip().upper()
    if session.get(Maquina, codigo_norm):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Ya existe una máquina con código '{codigo_norm}'.",
        )

    nueva = Maquina(
        codigo=codigo_norm,
        nombre=datos.nombre.strip(),
        sector=datos.sector.strip(),
        estado=datos.estado,
    )
    session.add(nueva)
    session.commit()
    session.refresh(nueva)
    return nueva


@app.patch("/maquinas/{codigo}", response_model=Maquina)
def actualizar_maquina(
    codigo: str,
    datos: MaquinaUpdate,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session),
):
    maquina = session.get(Maquina, codigo.strip().upper())
    if not maquina:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Máquina no encontrada.")

    if datos.nombre is not None:
        maquina.nombre = datos.nombre.strip()
    if datos.sector is not None:
        maquina.sector = datos.sector.strip()
    if datos.estado is not None:
        maquina.estado = datos.estado

    session.add(maquina)
    session.commit()
    session.refresh(maquina)
    return maquina


# ==========================================
# 7. INVENTARIO DE REPUESTOS Y CONSUMOS (OPENAPI)
# ==========================================

@app.get("/repuestos", response_model=List[Repuesto])
def listar_repuestos(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session),
):
    return session.exec(select(Repuesto).order_by(Repuesto.codigo)).all()


@app.get(
    "/repuestos/{codigo}",
    response_model=Repuesto,
    responses={404: {"model": ErrorResponse}},
)
def obtener_repuesto(
    codigo: str,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session),
):
    repuesto = session.get(Repuesto, codigo)
    if not repuesto:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"error": f"Repuesto '{codigo}' no encontrado."},
        )
    return repuesto


@app.post("/repuestos", response_model=Repuesto, status_code=status.HTTP_201_CREATED)
def crear_repuesto(
    datos: RepuestoCreate,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session),
):
    codigo_norm = datos.codigo.strip().upper()
    if session.get(Repuesto, codigo_norm):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"El repuesto '{codigo_norm}' ya existe en el inventario.",
        )

    nuevo = Repuesto(
        codigo=codigo_norm,
        nombre=datos.nombre.strip(),
        stock_disponible=datos.stock_disponible,
        ubicacion=datos.ubicacion.strip(),
    )
    session.add(nuevo)
    session.commit()
    session.refresh(nuevo)
    return nuevo


@app.patch(
    "/repuestos/{codigo}",
    response_model=Repuesto,
    responses={404: {"model": ErrorResponse}},
)
def actualizar_repuesto(
    codigo: str,
    datos: RepuestoUpdate,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session),
):
    repuesto = session.get(Repuesto, codigo)
    if not repuesto:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"error": f"Repuesto '{codigo}' no encontrado."},
        )

    if datos.ubicacion is not None:
        repuesto.ubicacion = datos.ubicacion.strip()
    if datos.stock_disponible is not None:
        repuesto.stock_disponible = datos.stock_disponible

    session.add(repuesto)
    session.commit()
    session.refresh(repuesto)
    return repuesto


@app.post(
    "/reparaciones/{reparacion_id}/consumos",
    response_model=ConsumoResponse,
    status_code=status.HTTP_201_CREATED,
    responses={
        404: {"model": ErrorResponse},
        409: {"model": ErrorResponse},
    },
)
def registrar_consumo_repuesto(
    reparacion_id: int,
    datos: ConsumoRequest,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session),
):
    reparacion = session.get(Reparacion, reparacion_id)
    if not reparacion:
        reparacion = Reparacion(
            id=reparacion_id,
            equipo="Desconocido",
            descripcion="Reparación creada automáticamente al registrar consumo.",
            estado="ACTIVA",
        )
        session.add(reparacion)
        session.flush()

    repuesto = session.get(Repuesto, datos.codigo_repuesto)
    if not repuesto:
        return JSONResponse(
            status_code=status.HTTP_404_NOT_FOUND,
            content={"error": f"Repuesto '{datos.codigo_repuesto}' no encontrado."},
        )

    if repuesto.stock_disponible < datos.cantidad:
        return JSONResponse(
            status_code=status.HTTP_409_CONFLICT,
            content={
                "error": f"Stock insuficiente para '{repuesto.codigo}'. Disponible: {repuesto.stock_disponible}, solicitado: {datos.cantidad}."
            },
        )

    repuesto.stock_disponible -= datos.cantidad
    consumo = ConsumoRepuesto(
        reparacion_id=reparacion_id,
        codigo_repuesto=repuesto.codigo,
        cantidad_consumida=datos.cantidad,
        stock_remanente=repuesto.stock_disponible,
    )

    session.add(repuesto)
    session.add(consumo)
    session.commit()
    session.refresh(consumo)

    return ConsumoResponse(
        id_consumo=consumo.id,
        reparacion_id=consumo.reparacion_id,
        codigo_repuesto=consumo.codigo_repuesto,
        cantidad_consumida=consumo.cantidad_consumida,
        stock_remanente=consumo.stock_remanente,
        timestamp=consumo.timestamp,
    )


# ==========================================
# 8. CRUD DE INCIDENCIAS (FALLAS DE PLANTA)
# ==========================================

@app.get("/incidencias", response_model=List[Incidencia])
def listar_incidencias(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session),
):
    return session.exec(select(Incidencia).order_by(Incidencia.id.desc())).all()


@app.post("/incidencias", response_model=Incidencia, status_code=status.HTTP_201_CREATED)
def crear_incidencia(
    datos: IncidenciaCreate,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session),
):
    nueva = Incidencia(
        timestamp_creacion=datos.timestamp_creacion,
        fecha=datos.fecha,
        hora=datos.hora,
        maquina=datos.maquina.strip(),
        descripcion=datos.descripcion.strip(),
        operario=datos.operario.strip(),
        estado=EstadoIncidencia.PENDIENTE,
    )
    session.add(nueva)

    # Pasar la máquina asociada a EN_REPARACION con búsqueda puntual en SQL
    maq = buscar_maquina_por_referencia(session, datos.maquina)
    if maq:
        maq.estado = EstadoMaquina.EN_REPARACION
        session.add(maq)

    session.commit()
    session.refresh(nueva)
    return nueva


@app.patch("/incidencias/{incidencia_id}", response_model=Incidencia)
def actualizar_incidencia(
    incidencia_id: int,
    datos: IncidenciaUpdate,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session),
):
    incidencia = session.get(Incidencia, incidencia_id)
    if not incidencia:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Incidencia no encontrada.")

    if datos.estado is not None:
        incidencia.estado = datos.estado
    if datos.repuestos_utilizados_json is not None:
        incidencia.repuestos_utilizados_json = datos.repuestos_utilizados_json
    if datos.fecha_resolucion is not None:
        incidencia.fecha_resolucion = datos.fecha_resolucion
    if datos.hora_resolucion is not None:
        incidencia.hora_resolucion = datos.hora_resolucion
    if datos.tiempo_total_str is not None:
        incidencia.tiempo_total_str = datos.tiempo_total_str

    # Cuando el técnico (Mantenimiento) toma la falla en progreso, abre la Reparación real
    if datos.estado == EstadoIncidencia.EN_PROGRESO:
        reparacion = session.get(Reparacion, incidencia.id)
        if not reparacion:
            session.add(
                Reparacion(
                    id=incidencia.id,
                    equipo=incidencia.maquina,
                    descripcion=incidencia.descripcion,
                    estado="ACTIVA",
                )
            )

    # Cuando el técnico resuelve la falla, cierra la Reparación y devuelve la máquina a ACTIVA
    elif datos.estado == EstadoIncidencia.RESUELTA:
        reparacion = session.get(Reparacion, incidencia.id)
        if reparacion:
            reparacion.estado = "FINALIZADA"
            session.add(reparacion)

        maq = buscar_maquina_por_referencia(session, incidencia.maquina)
        if maq:
            maq.estado = EstadoMaquina.ACTIVA
            session.add(maq)

    # Cuando la reparación no tiene solución, cierra la Reparación y deja la máquina FUERA_DE_SERVICIO
    elif datos.estado == EstadoIncidencia.SIN_SOLUCION:
        reparacion = session.get(Reparacion, incidencia.id)
        if reparacion:
            reparacion.estado = "SIN_SOLUCION"
            session.add(reparacion)

        maq = buscar_maquina_por_referencia(session, incidencia.maquina)
        if maq:
            maq.estado = EstadoMaquina.FUERA_DE_SERVICIO
            session.add(maq)

    session.add(incidencia)
    session.commit()
    session.refresh(incidencia)
    return incidencia
# ==========================================
# 9. AUDITORÍAS Y MOVIMIENTOS DE STOCK
# ==========================================

@app.get("/movimientos", response_model=List[MovimientoStock])
def listar_movimientos(
    area: str | None = None,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session),
):
    query = select(MovimientoStock).order_by(MovimientoStock.id.desc())
    if area:
        query = query.where(MovimientoStock.area == area)
    return session.exec(query).all()


@app.post("/movimientos", response_model=MovimientoStock, status_code=status.HTTP_201_CREATED)
def registrar_movimiento(
    datos: MovimientoStockCreate,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session),
):
    nuevo = MovimientoStock(
        fecha=datos.fecha,
        hora=datos.hora,
        codigo=datos.codigo.strip().upper(),
        cantidad=datos.cantidad,
        operario=datos.operario.strip(),
        turno=datos.turno.strip(),
        motivoUso=datos.motivoUso.strip(),
        maquinaVinculada=datos.maquinaVinculada.strip(),
        area=datos.area,
    )
    session.add(nuevo)
    session.commit()
    session.refresh(nuevo)
    return nuevo

