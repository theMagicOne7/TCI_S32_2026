
// CONTRATOS DE DOMINIO, ROLES Y AUDITORÍA

export type RolPlanta = 
  | 'operario' 
  | 'tecnico' 
  | 'deposito' 
  | 'encargado' 
  | 'supervisor' 
  | 'gerente';

export type Turno = 'Mañana' | 'Tarde' | 'Noche';

export type AreaPlanta = 
  | 'produccion'
  | 'mantenimiento'
  | 'deposito'
  | 'direccion'; // Para el gerente general

export interface UsuarioPlanta {
    id: string;
    nombre: string;
    legajo: string;
    rol: RolPlanta;
    area: AreaPlanta; // 👇 Agregamos el área al usuario
}

export interface Repuesto {
    codigo: string;
    nombre: string;
    ubicacion: string;
    stock_disponible: number; // Vamos a usar este nombre en toda la app
}

// RN-06: Estructura inmutable del movimiento de stock
export interface MovimientoStock {
    id: number;
    fecha: string; //NUEVO
    hora: string;
    codigo: string;
    cantidad: number;
    operario: string;
    turno: 'Mañana' | 'Tarde' | 'Noche'; //NUEVO

    // Opcionales (con "?") para cuando agreguemos la funcionalidad de Incidencias:
    maquinaVinculada?: string; //NUEVO
    motivoUso?: string; //NUEVO
}

export interface TemaPaleta {
    fondoPagina: string;
    fondoTarjeta: string;
    textoPrincipal: string;
    textoSecundario: string;
    borde: string;
    fondoInput: string;
    acento: string;
    botonPrimario: string;
    botonTexto: string;
}


export interface RegistroAuditoria {
    id: string;
    fecha: string;         // Nuevo: ej. "2026-10-10"
    hora: string;
    codigoRepuesto: string;
    cantidad: number;
    operario: string;
    maquinaVinculada?: string; // Nuevo: ej. "CAL-01"
    motivoUso?: string;        // Nuevo: descripción
    turno: Turno;              // Nuevo
}

export interface ItemOrden {
    codigoRepuesto: string;
    cantidadPedida: number;
    cantidadYaRecibida: number; // Para saber si ya llegó una parte antes
}

export interface OrdenCompra {
    id: string;
    numeroOC: string;
    proveedor: string;
    fechaEmision: string;
    estado: 'pendiente' | 'parcial' | 'completada';
    items: ItemOrden[];
}

export interface LayoutContextType {
    tema: TemaPaleta;
    esModoOscuro: boolean;
    movimientos: MovimientoStock[];
    agregarMovimiento: (nuevo: MovimientoStock) => void;
    usuarioActual: UsuarioPlanta;
    ordenesCompra: OrdenCompra[];
    agregarOrdenCompra: (nueva: OrdenCompra) => void; //NUEVO
    actualizarOrdenCompra: (ocModificada: OrdenCompra) => void; //NUEVO
    repuestos: Repuesto[];
    actualizarRepuesto: (repueustoModificado: Repuesto) => void;
    incidencias: Incidencia[];
    agregarIncidencia: (inc: Incidencia) => void;
    actualizarIncidencia: (inc: Incidencia) => void;
}

export type EstadoIncidencia = 'pendiente' | 'en_progreso' | 'resuelta';

export interface RepuestoUtilizado {
  codigo: string;
  cantidad: number;
}

export interface Incidencia {
    id: number;
    timestampCreacion: number; // Clave para calcular el tiempo exacto (matemática de fechas)
    fecha: string;
    hora: string;
    maquina: string;
    descripcion: string;
    operario: string;
    estado: EstadoIncidencia;
    
    // 👇 NUEVOS CAMPOS PARA RESOLUCIÓN 👇
    repuestosUtilizados: RepuestoUtilizado[];
    fechaResolucion?: string;
    horaResolucion?: string;
    tiempoTotalStr?: string; // Ej: "1d 4h 30m"
}