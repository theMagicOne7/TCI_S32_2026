
// DATOS MOCK DE PLANTA Y REGLAS DE NEGOCIO

import type { UsuarioPlanta, Repuesto } from '../types';

// RN-02: Umbral de alerta de stock crítico
export const UMBRAL_MINIMO = 5;

// Códigos de prueba preconfigurados para simulación
export const CODIGOS_CONOCIDOS = ['FIL-001', 'MOT-005', 'PLA-104'] as const;

// Personal asignado a la planta (RBAC)
export const PERSONAL_PLANTA: readonly UsuarioPlanta[] = [
    // --- ÁREA DE PRODUCCIÓN ---
    { id: 'u1', nombre: 'Op. Martín Gómez', legajo: 'PROD-1001', rol: 'operario', area: 'produccion' },
    { id: 'u2', nombre: 'Op. Sofía Ríos', legajo: 'PROD-1002', rol: 'operario', area: 'produccion' },
    { id: 'u3', nombre: 'Enc. Marcos Vega', legajo: 'PROD-9000', rol: 'encargado', area: 'produccion' },

    // --- ÁREA DE MANTENIMIENTO ---
    { id: 'u4', nombre: 'Téc. Lucía Durán', legajo: 'MANT-2001', rol: 'tecnico', area: 'mantenimiento' },
    { id: 'u5', nombre: 'Téc. Gabriel Michelli', legajo: 'MANT-2002', rol: 'tecnico', area: 'mantenimiento' },
    { id: 'u6', nombre: 'Enc. Laura Silva', legajo: 'MANT-9000', rol: 'encargado', area: 'mantenimiento' },

    // --- ÁREA DE DEPÓSITO / PAÑOL ---
    { id: 'u7', nombre: 'Alm. Diego Torres', legajo: 'DEP-3001', rol: 'deposito', area: 'deposito' },
    { id: 'u8', nombre: 'Alm. Valeria Campos', legajo: 'DEP-3002', rol: 'deposito', area: 'deposito' },
    { id: 'u9', nombre: 'Enc. Hugo Santoro', legajo: 'DEP-9000', rol: 'encargado', area: 'deposito' },

    // --- DIRECCIÓN Y CONTROL GENERAL ---
    { id: 'u10', nombre: 'Ing. Cecilia Ballarre', legajo: 'SUP-9998', rol: 'supervisor', area: 'direccion' }, 
    { id: 'u11', nombre: 'Ger. Alejandro Montes', legajo: 'DIR-9999', rol: 'gerente', area: 'direccion' } 
];

// CATALOGO INICIAL DE REPUESTOS EN MEMORIA
export const CATALOGO_REPUESTOS: Repuesto[] = [
  {
    codigo: 'FIL-001',
    nombre: 'Filtro de aire industrial', // Cambiado de 'descripcion' a 'nombre'
    ubicacion: 'Sector Livianos: Estante A-4',
    stock_disponible: 12
  },
  {
    codigo: 'MOT-005',
    nombre: 'Motor trifásico 2HP', // Cambiado de 'descripcion' a 'nombre'
    ubicacion: 'Sector Pesados: Pallet 3',
    stock_disponible: 3
  },
  {
    codigo: 'PLA-104',
    nombre: 'Placa de control PLC principal', // Cambiado de 'descripcion' a 'nombre'
    ubicacion: 'Pañol Central: Armario Eléctrico 1',
    stock_disponible: 8
  }
];