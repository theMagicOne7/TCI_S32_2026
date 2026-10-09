
// DATOS MOCK DE PLANTA Y REGLAS DE NEGOCIO

import type { UsuarioPlanta } from '../types';

// RN-02: Umbral de alerta de stock crítico
export const UMBRAL_MINIMO = 5;

// Códigos de prueba preconfigurados para simulación
export const CODIGOS_CONOCIDOS = ['FIL-001', 'MOT-005', 'PLA-104'] as const;

// Personal asignado al turno de planta (RBAC)
export const PERSONAL_PLANTA: readonly UsuarioPlanta[] = [
    { id: 'u1', nombre: 'Téc. Lucía Duran', legajo: '#22345', rol: 'tecnico' },
    { id: 'u2', nombre: 'Téc. Gabriel Michelli', legajo: '#22346', rol: 'tecnico' },
    { id: 'u3', nombre: 'Ing. Cecilia Ballarre', legajo: '#22344', rol: 'supervisor' }
];