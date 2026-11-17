import os
from sqlmodel import SQLModel, Session, create_engine, select, func
from passlib.context import CryptContext
from models import Usuario, RolUsuario

DATABASE_URL = os.getenv(
    "DATABASE_URL",
    "postgresql+pg8000://postgres:postgres@db-mantenimiento:5432/mantenimiento_db"
)
engine = create_engine(DATABASE_URL)
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

USUARIOS_INICIALES = [
    # Dirección / Supervisión
    ("CeciliaBallarre", "Ceci2026", RolUsuario.SUPERVISOR),
    ("ema", "Ema2026", RolUsuario.SUPERVISOR),

    # Producción
    ("MartinGomez", "Martin2026", RolUsuario.OPERARIO),
    ("SofiaRios", "Sofia2026", RolUsuario.OPERARIO),
    ("MarcosVega", "Marcos2026", RolUsuario.ENCARGADO),

    # Mantenimiento
    ("LuciaDuran", "Lucia2026", RolUsuario.MANTENIMIENTO),
    ("GabrielMichelli", "Gabriel2026", RolUsuario.MANTENIMIENTO),
    ("LauraSilva", "Laura2026", RolUsuario.ENCARGADO),

    # Depósito
    ("DiegoTorres", "Diego2026", RolUsuario.OPERARIO),
    ("ValeriaCampos", "Valeria2026", RolUsuario.OPERARIO),
    ("HugoSantoro", "Hugo2026", RolUsuario.ENCARGADO),
]

def cargar_usuarios():
    SQLModel.metadata.create_all(engine)
    with Session(engine) as session:
        for username, password, rol in USUARIOS_INICIALES:
            existente = session.exec(
                select(Usuario).where(func.lower(Usuario.username) == username.lower())
            ).first()
            if not existente:
                nuevo = Usuario(
                    username=username,
                    hashed_password=pwd_context.hash(password),
                    rol=rol
                )
                session.add(nuevo)
                print(f"✅ Usuario creado: {username} ({rol.value})")
            else:
                print(f"ℹ️ Usuario ya existente: {username}")
        session.commit()

if __name__ == "__main__":
    cargar_usuarios()