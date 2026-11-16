from fastapi import FastAPI, HTTPException, Request, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer
from sqlmodel import Session, create_engine, select
from passlib.context import CryptContext
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import jwt
import pyotp
import os
from datetime import datetime, timedelta, timezone

from models import Usuario, RolUsuario

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
# 2. INICIALIZACIÓN DE FASTAPI, CORS Y RATE LIMIT
# ==========================================
limiter = Limiter(key_func=get_remote_address)
app = FastAPI(title="API Gestión Planta Farmacéutica - Auth & RBAC")

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Permitir peticiones desde el frontend en React (Vite / Docker)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite cualquier origen temporalmente
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_session():
    with Session(engine) as session:
        yield session

# ==========================================
# 3. DEPENDENCIA DE VALIDACIÓN DE SESIÓN (JWT)
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

# ==========================================
# 4. ENDPOINTS DE AUTENTICACIÓN Y GESTIÓN
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
    codigo_2fa = datos.get("codigo_2fa")
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

    # 5. Verificación de doble factor (2FA con TOTP) si el usuario lo tiene activo
    if user.secreto_2fa:
        if not codigo_2fa:
            raise HTTPException(status_code=401, detail="Se requiere código de doble factor (2FA)")
        totp = pyotp.TOTP(user.secreto_2fa)
        if not totp.verify(codigo_2fa):
            raise HTTPException(status_code=401, detail="Código 2FA incorrecto")

    # 6. Login exitoso: resetear contador de errores
    user.intentos_fallidos = 0
    session.commit()

    # 7. Emitir JWT para mantener la sesión entre requests
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
        "rol": user.rol.value
    }

@app.post("/usuarios", status_code=201)
def crear_nuevo_usuario(
    datos: dict,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session)
):
    """Permite únicamente a Ema (Supervisor) o a Cecilia Ballarre registrar nuevos usuarios"""
    es_ema_supervisor = usuario_actual.rol == RolUsuario.SUPERVISOR
    es_ceci = usuario_actual.username.lower() in ["ceci", "ceciliaballarre"]

    if not (es_ema_supervisor or es_ceci):
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado: Solo Ema (Supervisor) o Cecilia Ballarre pueden registrar nuevos usuarios."
        )

    nuevo_username = datos.get("username")
    nombre_completo = datos.get("nombre_completo", nuevo_username) # 👈 Si no se envía, toma el username por defecto
    nueva_password = datos.get("password")
    nuevo_rol = datos.get("rol")

    if not nuevo_username or not nueva_password or not nuevo_rol:
        raise HTTPException(status_code=400, detail="Faltan datos obligatorios (username, password, rol)")

    # Validar que el rol enviado exista en el Enum
    try:
        rol_enum = RolUsuario(nuevo_rol)
    except ValueError:
        roles_validos = [r.value for r in RolUsuario]
        raise HTTPException(status_code=400, detail=f"Rol inválido. Opciones: {roles_validos}")

    # Verificar que no exista un usuario duplicado
    existente = session.exec(select(Usuario).where(Usuario.username == nuevo_username)).first()
    if existente:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")

    # Hashear la nueva contraseña antes de guardar
    clave_hasheada = pwd_context.hash(nueva_password)

    nuevo_usuario = Usuario(
        username=datos.username,
        apellido=datos.apellido,
        nombre=datos.nombre,
        hashed_password=pwd_context.hash(datos.password),
        rol=datos.rol
    )
    session.add(nuevo_usuario)
    session.commit()
    session.refresh(nuevo_usuario)

    return {
        "mensaje": f"Usuario '{nuevo_usuario.username}' creado exitosamente por {usuario_actual.username}",
        "rol": nuevo_usuario.rol.value
    }

@app.delete("/usuarios/{username_a_eliminar}", status_code=200)
def eliminar_usuario(
    username_a_eliminar: str,
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session)
):
    """Permite únicamente a Ema (Supervisor) o a Cecilia Ballarre eliminar usuarios"""
    es_ema_supervisor = usuario_actual.rol == RolUsuario.SUPERVISOR
    es_ceci = usuario_actual.username.lower() in ["ceci", "ceciliaballarre"]

    if not (es_ema_supervisor or es_ceci):
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado: Solo Ema (Supervisor) o Cecilia Ballarre pueden eliminar usuarios."
        )

    # Evitar que el usuario se elimine a sí mismo por accidente
    if usuario_actual.username.lower() == username_a_eliminar.lower():
        raise HTTPException(
            status_code=400,
            detail="No puedes eliminar tu propia cuenta de usuario activa."
        )

    # Buscar el usuario a eliminar en la base de datos
    user_db = session.exec(select(Usuario).where(Usuario.username == username_a_eliminar)).first()
    if not user_db:
        raise HTTPException(status_code=404, detail="El usuario no existe")

    # Eliminar de la base de datos
    session.delete(user_db)
    session.commit()

    return {"mensaje": f"Usuario '{username_a_eliminar}' eliminado exitosamente"}

@app.get("/usuarios")
def listar_usuarios(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session)
):
    usuarios = session.exec(select(Usuario)).all()
    # Mapeamos los campos correctamente por separado
    return [
        {
            "username": u.username,
            "apellido": u.apellido,
            "nombre": u.nombre,
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
    es_ema_supervisor = usuario_actual.rol == RolUsuario.SUPERVISOR
    es_ceci = usuario_actual.username.lower() in ["ceci", "ceciliaballarre"]

    if not (es_ema_supervisor or es_ceci):
        raise HTTPException(
            status_code=403,
            detail="Acceso denegado: Solo Ema (Supervisor) o Cecilia Ballarre pueden editar usuarios."
        )

    user_db = session.exec(select(Usuario).where(Usuario.username == username_a_editar)).first()
    if not user_db:
        raise HTTPException(status_code=404, detail="El usuario no existe")

    nuevo_username = datos.get("username")
    nueva_password = datos.get("password")
    nuevo_rol = datos.get("rol")
    nuevo_apellido = datos.get("apellido")
    nuevo_nombre = datos.get("nombre")

    if nuevo_username and nuevo_username != user_db.username:
        existente = session.exec(select(Usuario).where(Usuario.username == nuevo_username)).first()
        if existente:
            raise HTTPException(status_code=400, detail="El nuevo nombre de usuario ya está en uso")
        user_db.username = nuevo_username

    if nuevo_apellido is not None:
        user_db.apellido = nuevo_apellido
        
    if nuevo_nombre is not None:
        user_db.nombre = nuevo_nombre

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
        "nombre": user_db.nombre
    }