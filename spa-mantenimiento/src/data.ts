// CAPA DE ABSTRACCIÓN DE RED PARA LAS PETICIONES HTTP

import { type Repuesto } from './types/index';
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

function getAuthHeaders(extraHeaders: Record<string, string> = {}): HeadersInit {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem('token') || localStorage.getItem('access_token')
      : null;

  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function fetchRepuestos(): Promise<Repuesto[]> {
  const res = await fetch(`${API_BASE_URL}/repuestos`, {
    headers: getAuthHeaders(),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.detail || errData?.error || 'Error al obtener el catálogo de repuestos');
  }

  return res.json();
}

export async function fetchRepuestoPorCodigo(codigo: string): Promise<Repuesto> {
  const codLimpio = codigo.trim().toUpperCase();
  const res = await fetch(`${API_BASE_URL}/repuestos/${encodeURIComponent(codLimpio)}`, {
    headers: getAuthHeaders(),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.error || errData?.detail || `Código "${codLimpio}" no registrado en el inventario`);
  }

  return res.json();
}

export async function registrarConsumoAPI(codigo: string, cantidad: number, reparacionId = 1): Promise<void> {
  const res = await fetch(`${API_BASE_URL}/reparaciones/${reparacionId}/consumos`, {
    method: 'POST',
    headers: getAuthHeaders({
      'Content-Type': 'application/json',
    }),
    body: JSON.stringify({
      codigo_repuesto: codigo.trim().toUpperCase(),
      cantidad,
    }),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(
      errData?.error || errData?.detail || `Error al registrar consumo del repuesto "${codigo}"`
    );
  }
}