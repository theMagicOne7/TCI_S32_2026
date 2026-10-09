
// CONTRATOS DE DOMINIO, ROLES Y AUDITORÍA

export type RolUsuario = 'tecnico' | 'supervisor';

export interface UsuarioPlanta {
    id: string;
    nombre: string;
    legajo: string;
    rol: RolUsuario;
}

export interface Repuesto {
    codigo: string;
    nombre: string;
    ubicacion: string;
    stock_disponible: number;
}

// RN-06: Estructura inmutable del movimiento de stock
export interface MovimientoStock {
    id: number;
    hora: string;
    codigo: string;
    cantidad: number;
    operario: string;
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