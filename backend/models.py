from sqlmodel import SQLModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime, timezone

def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class RolUsuario(str, Enum):
    OPERARIO = "Operario"
    MANTENIMIENTO = "Mantenimiento"
    ENCARGADO = "Encargado"
    SUPERVISOR = "Supervisor"

class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    apellido: Optional[str] = Field(default=None)
    nombre: Optional[str] = Field(default=None)

    # OWASP: Jamás texto plano, solo el hash de bcrypt
    hashed_password: str
    rol: RolUsuario
    intentos_fallidos: int = Field(default=0)
    bloqueado: bool = Field(default=False)
    secreto_2fa: Optional[str] = Field(default=None)


class Repuesto(SQLModel, table=True):
    codigo: str = Field(primary_key=True, index=True)
    nombre: str
    stock_disponible: int = Field(default=0, ge=0)
    ubicacion: str

class Reparacion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    equipo: str
    descripcion: str
    estado: str = Field(default="ACTIVA")
    fecha_creacion: datetime = Field(default_factory=_utc_now)

class ConsumoRepuesto(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    reparacion_id: int = Field(foreign_key="reparacion.id", index=True)
    codigo_repuesto: str = Field(foreign_key="repuesto.codigo", index=True)
    cantidad_consumida: int = Field(gt=0)
    stock_remanente: int = Field(ge=0)
    timestamp: datetime = Field(default_factory=_utc_now)

class ConsumoRequest(SQLModel):
    codigo_repuesto: str
    cantidad: int = Field(ge=1)

class ConsumoResponse(SQLModel):
    id_consumo: int
    reparacion_id: int
    codigo_repuesto: str
    cantidad_consumida: int
    stock_remanente: int
    timestamp: datetime

class ErrorResponse(SQLModel):
    error: str

class RepuestoUpdate(SQLModel):
    ubicacion: Optional[str] = None
    stock_disponible: Optional[int] = Field(default=None, ge=0)