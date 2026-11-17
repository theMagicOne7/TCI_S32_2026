from sqlmodel import SQLModel, Field
from typing import Optional
from enum import Enum

class RolUsuario(str, Enum):
    OPERARIO = "Operario"
    MANTENIMIENTO = "Mantenimiento"
    ENCARGADO = "Encargado"
    SUPERVISOR = "Supervisor" # El rol de Ema

class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    
    # 👈 Reemplazamos nombre_completo por apellido y nombre separados
    apellido: Optional[str] = Field(default=None)
    nombre: Optional[str] = Field(default=None)
    
    # OWASP: Jamás texto plano, solo el hash de bcrypt
    hashed_password: str 
    
    rol: RolUsuario
    
    # Seguridad adicional (Requerimientos de Ceci)
    intentos_fallidos: int = Field(default=0)
    bloqueado: bool = Field(default=False)
    secreto_2fa: Optional[str] = Field(default=None)