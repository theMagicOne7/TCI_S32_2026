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

class UsuarioCreate(SQLModel):
    username: str
    password: str
    apellido: Optional[str] = None
    nombre: Optional[str] = None
    rol: RolUsuario

class UsuarioUpdate(SQLModel):
    apellido: Optional[str] = None
    nombre: Optional[str] = None
    rol: Optional[RolUsuario] = None
    bloqueado: Optional[bool] = None
    password: Optional[str] = None

class UsuarioPublic(SQLModel):
    id: int
    username: str
    apellido: Optional[str] = None
    nombre: Optional[str] = None
    rol: RolUsuario
    bloqueado: bool

class RepuestoCreate(SQLModel):
    codigo: str
    nombre: str
    stock_disponible: int = Field(default=0, ge=0)
    ubicacion: str

class Repuesto(SQLModel, table=True):
    codigo: str = Field(primary_key=True, index=True)
    nombre: str
    stock_disponible: int = Field(default=0, ge=0)
    ubicacion: str

class RepuestoUpdate(SQLModel):
    ubicacion: Optional[str] = None
    stock_disponible: Optional[int] = Field(default=None, ge=0)

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

class EstadoIncidencia(str, Enum):
    PENDIENTE = "pendiente"
    EN_PROGRESO = "en_progreso"
    RESUELTA = "resuelta"


class Incidencia(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp_creacion: int  # Epoch ms para cálculo de duración en frontend
    fecha: str
    hora: str
    maquina: str
    descripcion: str
    operario: str
    estado: EstadoIncidencia = Field(default=EstadoIncidencia.PENDIENTE)
    repuestos_utilizados_json: str = Field(default="[]")
    fecha_resolucion: Optional[str] = Field(default=None)
    hora_resolucion: Optional[str] = Field(default=None)
    tiempo_total_str: Optional[str] = Field(default=None)


class IncidenciaCreate(SQLModel):
    timestamp_creacion: int
    fecha: str
    hora: str
    maquina: str
    descripcion: str
    operario: str


class IncidenciaUpdate(SQLModel):
    estado: Optional[EstadoIncidencia] = None
    repuestos_utilizados_json: Optional[str] = None
    fecha_resolucion: Optional[str] = None
    hora_resolucion: Optional[str] = None
    tiempo_total_str: Optional[str] = None

# ==========================================
# MODELOS Y ESQUEMAS DE MÁQUINAS Y ALTA DE REPUESTOS
# ==========================================

class Maquina(SQLModel, table=True):
    codigo: str = Field(primary_key=True, index=True)  # Ej: "CAL-01", "ENV-02"
    nombre: str                                        # Ej: "Caldera Principal"
    sector: str                                        # Ej: "Producción"
    activa: bool = Field(default=True)


class MaquinaCreate(SQLModel):
    codigo: str
    nombre: str
    sector: str

class MaquinaUpdate(SQLModel):
    nombre: Optional[str] = None
    sector: Optional[str] = None
    activa: Optional[bool] = None

