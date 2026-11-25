// CAPA DE ABSTRACCIÓN DE RED PARA LAS PETICIONES HTTP
import { type Incidencia } from './types/index'; // (sumá Incidencia al import de arriba en data.ts)
import { type AreaPlanta,type MovimientoStock, type Repuesto, type RolPlanta, type UsuarioPlanta } from './types/index';
export const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';
export const TOKEN_STORAGE_KEY = 'token_acceso';
export const USER_STORAGE_KEY = 'usuario_sesion_planta';

export interface LoginRespuesta {
  access_token: string;
  token_type: string;
  usuario: string;
  nombre: string;
  apellido: string;
  rol: string;
}

export function mapearRespuestaAUsuarioPlanta(respuesta: LoginRespuesta): UsuarioPlanta {
  const rolBackend = respuesta.rol.toLowerCase();
  let rol: RolPlanta = 'operario';
  let area: AreaPlanta = 'produccion';

  if (rolBackend === 'supervisor') {
    rol = 'supervisor';
    area = 'direccion';
  } else if (rolBackend === 'mantenimiento') {
    rol = 'tecnico';
    area = 'mantenimiento';
  } else if (rolBackend === 'encargado') {
    rol = 'encargado';
    area = 'deposito';
  }

  const nombre = `${respuesta.nombre || ''} ${respuesta.apellido || ''}`.trim() || respuesta.usuario;
  return { id: respuesta.usuario, nombre, legajo: respuesta.usuario.toUpperCase(), rol, area };
}

export function getAuthHeaders(extraHeaders: Record<string, string> = {}): HeadersInit {
  const token =
    typeof window !== 'undefined'
      ? localStorage.getItem(TOKEN_STORAGE_KEY)
      : null;

  return {
    ...extraHeaders,
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

export async function loginAPI(username: string, password: string): Promise<LoginRespuesta> {
  const res = await fetch(`${API_BASE_URL}/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: username.trim(), password, token_captcha: 'humano-verificado' }),
    signal: AbortSignal.timeout(6000),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data?.detail || 'Credenciales inválidas o error al iniciar sesión.');
  return data as LoginRespuesta;
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
export async function crearRepuestoAPI(nuevo: Repuesto): Promise<Repuesto> {
  const res = await fetch(`${API_BASE_URL}/repuestos`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      codigo: nuevo.codigo.trim().toUpperCase(),
      nombre: nuevo.nombre.trim(),
      stock_disponible: nuevo.stock_disponible,
      ubicacion: nuevo.ubicacion.trim(),
    }),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.detail || errData?.error || `Error al crear el repuesto "${nuevo.codigo}"`);
  }

  return res.json();
}

export async function actualizarRepuestoAPI(repuesto: Repuesto): Promise<Repuesto> {
  const codLimpio = repuesto.codigo.trim().toUpperCase();
  const res = await fetch(`${API_BASE_URL}/repuestos/${encodeURIComponent(codLimpio)}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      ubicacion: repuesto.ubicacion,
      stock_disponible: repuesto.stock_disponible,
    }),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.detail || errData?.error || `Error al actualizar el repuesto "${codLimpio}"`);
  }

  return res.json();
}

export async function fetchMovimientos(area?: string): Promise<MovimientoStock[]> {
  const query = area ? `?area=${encodeURIComponent(area)}` : '';
  const res = await fetch(`${API_BASE_URL}/movimientos${query}`, {
    headers: getAuthHeaders(),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.detail || 'Error al obtener el historial de auditorías');
  }

  return res.json();
}

export async function crearMovimientoAPI(
  movimiento: Omit<MovimientoStock, 'id'> & { area?: string }
): Promise<MovimientoStock> {
  const res = await fetch(`${API_BASE_URL}/movimientos`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify(movimiento),
    signal: AbortSignal.timeout(5000),
  });

  if (!res.ok) {
    const errData = await res.json().catch(() => null);
    throw new Error(errData?.detail || 'Error al guardar el registro de auditoría');
  }

  return res.json();
}

interface IncidenciaBackend {
  id: number;
  timestamp_creacion: number;
  fecha: string;
  hora: string;
  maquina: string;
  descripcion: string;
  operario: string;
  estado: 'pendiente' | 'en_progreso' | 'resuelta' | 'sin_solucion';
  repuestos_utilizados_json?: string;
  fecha_resolucion?: string | null;
  hora_resolucion?: string | null;
  tiempo_total_str?: string | null;
}

function mapearIncidenciaDesdeAPI(item: IncidenciaBackend): Incidencia {
  let repuestosUtilizados: { codigo: string; cantidad: number }[] = [];
  if (item.repuestos_utilizados_json) {
    try {
      repuestosUtilizados = JSON.parse(item.repuestos_utilizados_json);
    } catch {
      repuestosUtilizados = [];
    }
  }
  return {
    id: item.id,
    timestampCreacion: item.timestamp_creacion,
    fecha: item.fecha,
    hora: item.hora,
    maquina: item.maquina,
    descripcion: item.descripcion,
    operario: item.operario,
    estado: item.estado === 'sin_solucion' ? 'resuelta' : item.estado,
    repuestosUtilizados,
    fechaResolucion: item.fecha_resolucion ?? undefined,
    horaResolucion: item.hora_resolucion ?? undefined,
    tiempoTotalStr: item.tiempo_total_str ?? undefined,
  };
}

export async function fetchIncidencias(): Promise<Incidencia[]> {
  const res = await fetch(`${API_BASE_URL}/incidencias`, {
    headers: getAuthHeaders(),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error('Error al obtener las incidencias desde PostgreSQL');
  const lista: IncidenciaBackend[] = await res.json();
  return lista.map(mapearIncidenciaDesdeAPI);
}

export async function crearIncidenciaAPI(nueva: Incidencia): Promise<Incidencia> {
  const res = await fetch(`${API_BASE_URL}/incidencias`, {
    method: 'POST',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      timestamp_creacion: nueva.timestampCreacion,
      fecha: nueva.fecha,
      hora: nueva.hora,
      maquina: nueva.maquina,
      descripcion: nueva.descripcion,
      operario: nueva.operario,
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error('Error al guardar la incidencia en PostgreSQL');
  return mapearIncidenciaDesdeAPI(await res.json());
}

export async function actualizarIncidenciaAPI(inc: Incidencia): Promise<Incidencia> {
  const res = await fetch(`${API_BASE_URL}/incidencias/${inc.id}`, {
    method: 'PATCH',
    headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
    body: JSON.stringify({
      estado: inc.estado,
      repuestos_utilizados_json: JSON.stringify(inc.repuestosUtilizados || []),
      fecha_resolucion: inc.fechaResolucion ?? null,
      hora_resolucion: inc.horaResolucion ?? null,
      tiempo_total_str: inc.tiempoTotalStr ?? null,
    }),
    signal: AbortSignal.timeout(5000),
  });
  if (!res.ok) throw new Error('Error al actualizar la incidencia en PostgreSQL');
  return mapearIncidenciaDesdeAPI(await res.json());
}