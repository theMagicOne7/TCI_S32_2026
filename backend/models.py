from sqlmodel import SQLModel, Field
from typing import Optional
from enum import Enum
from datetime import datetime, timezone
from sqlalchemy import BigInteger, Column

def _utc_now() -> datetime:
    return datetime.now(timezone.utc)


class RolUsuario(str, Enum):
    OPERARIO = "Operario"
    MANTENIMIENTO = "Mantenimiento"
    ENCARGADO = "Encargado"
    SUPERVISOR = "Supervisor"

class AreaUsuario(str, Enum):
    PRODUCCION = "produccion"
    MANTENIMIENTO = "mantenimiento"
    DEPOSITO = "deposito"
    DIRECCION = "direccion"


class Usuario(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(unique=True, index=True)
    apellido: Optional[str] = Field(default=None)
    nombre: Optional[str] = Field(default=None)
    email: Optional[str] = Field(default=None, index=True)

    # OWASP: Jamás texto plano, solo el hash de bcrypt
    hashed_password: str
    hashed_pin: Optional[str] = Field(default=None)
    rol: RolUsuario
    area: AreaUsuario = Field(default=AreaUsuario.PRODUCCION)
    intentos_fallidos: int = Field(default=0)
    bloqueado: bool = Field(default=False)


class CodigoRecuperacion(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    username: str = Field(index=True)
    codigo_hash: str
    vence_en: datetime
    usado: bool = Field(default=False)

class UsuarioCreate(SQLModel):
    username: str
    password: str
    apellido: Optional[str] = None
    nombre: Optional[str] = None
    rol: RolUsuario
    area: AreaUsuario = AreaUsuario.PRODUCCION
    pin: Optional[str] = None

class UsuarioUpdate(SQLModel):
    apellido: Optional[str] = None
    nombre: Optional[str] = None
    rol: Optional[RolUsuario] = None
    area: Optional[AreaUsuario] = None
    bloqueado: Optional[bool] = None
    password: Optional[str] = None

class UsuarioPublic(SQLModel):
    id: int
    username: str
    apellido: Optional[str] = None
    nombre: Optional[str] = None
    rol: RolUsuario
    area: AreaUsuario
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
    nombre: Optional[str] = None
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
    SIN_SOLUCION = "sin_solucion"


class Incidencia(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    timestamp_creacion: int = Field(sa_column=Column(BigInteger, nullable=False))
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

class EstadoMaquina(str, Enum):
    ACTIVA = "activa"
    EN_REPARACION = "en_reparacion"
    FUERA_DE_SERVICIO = "fuera_de_servicio"
    
class Maquina(SQLModel, table=True):
    codigo: str = Field(primary_key=True, index=True)
    nombre: str
    sector: str = Field(default="")
    descripcion: Optional[str] = None
    estado: EstadoMaquina = Field(default=EstadoMaquina.ACTIVA)


class MaquinaCreate(SQLModel):
    codigo: str
    nombre: str
    sector: str = ""
    descripcion: Optional[str] = None
    estado: EstadoMaquina = EstadoMaquina.ACTIVA


class MaquinaUpdate(SQLModel):
    nombre: Optional[str] = None
    sector: Optional[str] = None
    descripcion: Optional[str] = None
    activa: Optional[bool] = None
    estado: Optional[EstadoMaquina] = None



class MovimientoStock(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    fecha: str
    hora: str
    codigo: str = Field(index=True)
    cantidad: int
    operario: str
    turno: str
    motivoUso: str
    maquinaVinculada: str = Field(default="N/A")
    area: Optional[str] = Field(default=None, index=True)  # 'deposito' | 'mantenimiento' | 'produccion'


class MovimientoStockCreate(SQLModel):
    fecha: str
    hora: str
    codigo: str
    cantidad: int
    operario: str
    turno: str
    motivoUso: str
    maquinaVinculada: str = "N/A"
    area: Optional[str] = None