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
@limiter.limit("5/minute")
def login(request: Request, datos: dict, session: Session = Depends(get_session)):
    username = (datos.get("username") or "").strip()
    password = datos.get("password")
    codigo_2fa = datos.get("codigo_2fa")
    token_captcha = datos.get("token_captcha")

    if not token_captcha:
        raise HTTPException(status_code=400, detail="Falta validación Captcha")

    user = session.exec(select(Usuario).where(Usuario.username.ilike(username))).first()
    if not user:
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    if user.bloqueado:
        raise HTTPException(
            status_code=403,
            detail="Usuario bloqueado por múltiples intentos fallidos. Contacte al supervisor."
        )

    if not pwd_context.verify(password, user.hashed_password):
        user.intentos_fallidos += 1
        if user.intentos_fallidos >= 5:
            user.bloqueado = True
        session.commit()
        raise HTTPException(status_code=401, detail="Credenciales inválidas")

    if user.secreto_2fa:
        if not codigo_2fa:
            raise HTTPException(status_code=401, detail="Se requiere código de doble factor (2FA)")
        totp = pyotp.TOTP(user.secreto_2fa)
        if not totp.verify(codigo_2fa):
            raise HTTPException(status_code=401, detail="Código 2FA incorrecto")

    user.intentos_fallidos = 0
    session.commit()

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

    nuevo_username = (datos.get("username") or "").strip()
    nueva_password = datos.get("password")
    nuevo_rol = datos.get("rol")
    nombre = (datos.get("nombre") or datos.get("nombre_completo") or nuevo_username).strip()
    apellido = (datos.get("apellido") or "").strip()

    if not nuevo_username or not nueva_password or not nuevo_rol:
        raise HTTPException(status_code=400, detail="Faltan datos obligatorios (username, password, rol)")

    try:
        rol_enum = RolUsuario(nuevo_rol)
    except ValueError:
        roles_validos = [r.value for r in RolUsuario]
        raise HTTPException(status_code=400, detail=f"Rol inválido. Opciones: {roles_validos}")

    existente = session.exec(
        select(Usuario).where(Usuario.username.ilike(nuevo_username))
    ).first()
    if existente:
        raise HTTPException(status_code=400, detail="El nombre de usuario ya está en uso")

    clave_hasheada = pwd_context.hash(nueva_password)

    nuevo_usuario = Usuario(
        username=nuevo_username,
        apellido=apellido,
        nombre=nombre,
        hashed_password=clave_hasheada,
        rol=rol_enum
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

    if usuario_actual.username.lower() == username_a_eliminar.lower():
        raise HTTPException(
            status_code=400,
            detail="No puedes eliminar tu propia cuenta de usuario activa."
        )

    user_db = session.exec(
        select(Usuario).where(Usuario.username.ilike(username_a_eliminar))
    ).first()
    if not user_db:
        raise HTTPException(status_code=404, detail="El usuario no existe")

    session.delete(user_db)
    session.commit()

    return {"mensaje": f"Usuario '{username_a_eliminar}' eliminado exitosamente"}

@app.get("/usuarios")
def listar_usuarios(
    usuario_actual: Usuario = Depends(obtener_usuario_actual),
    session: Session = Depends(get_session)
):
    usuarios = session.exec(select(Usuario)).all()
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

    user_db = session.exec(
        select(Usuario).where(Usuario.username.ilike(username_a_editar))
    ).first()
    if not user_db:
        raise HTTPException(status_code=404, detail="El usuario no existe")

    nuevo_username = (datos.get("username") or "").strip()
    nueva_password = datos.get("password")
    nuevo_rol = datos.get("rol")
    nuevo_apellido = datos.get("apellido")
    nuevo_nombre = datos.get("nombre")

    if nuevo_username and nuevo_username.lower() != user_db.username.lower():
        existente = session.exec(
            select(Usuario).where(Usuario.username.ilike(nuevo_username))
        ).first()
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