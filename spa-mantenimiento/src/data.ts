// CAPA DE ABSTRACCIÓN DE RED PARA LAS PETICIONES HTTP (PRISM MOCK)

import { type Repuesto } from './types/index';
import { CODIGOS_CONOCIDOS } from './constants/mock';

// Detecta automáticamente si estás en localhost, en Wi-Fi o en el Hotspot
const hostActual = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_BASE_URL = `http://${hostActual}:4010`;
//const API_BASE_URL = 'http://192.168.100.16:4010';

export async function fetchRepuestoPorCodigo(codigo: string): Promise<Repuesto> {
  const codLimpio = codigo.trim().toUpperCase();
  const existeEnCatalogo = (CODIGOS_CONOCIDOS as readonly string[]).includes(codLimpio);

  // Simulación dinámica de escenarios con cabeceras Prism OpenAPI
  const headersConfig: HeadersInit = existeEnCatalogo
    ? { Prefer: `code=200, example=${codLimpio}` }
    : { Prefer: 'code=404' };

  const res = await fetch(`${API_BASE_URL}/repuestos/${codLimpio}`, {
    headers: headersConfig,
    signal: AbortSignal.timeout(5000) // Evita que se quede colgado si la red falla
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.error || `Código "${codLimpio}" no registrado en el inventario`);
  }

  return res.json();
}

export async function registrarConsumoAPI(codigo: string, cantidad: number): Promise<void> {
  try {
    const res = await fetch(`${API_BASE_URL}/reparaciones/1/consumos`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Prefer: 'code=201'
      },
      body: JSON.stringify({
        codigo_repuesto: codigo,
        cantidad
      }),
      signal: AbortSignal.timeout(5000)
    });

    if (!res.ok) {
      console.warn(`[API] El mock respondió status ${res.status} al registrar consumo.`);
    }
  } catch (error) {
    // Tolerancia a fallos: advertencia en consola para no bloquear la demo si Prism está caído
    console.warn('[API] Mock Prism no disponible, continuando en modo offline:', error);
  }
}