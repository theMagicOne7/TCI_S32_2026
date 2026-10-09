// CONSOLA CENTRAL DE AUDITORÍA Y TRAZABILIDAD GENERAL DE PLANTA (RN-06)

import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MovimientoList } from '../components/MovimientoList';
import { type UsuarioPlanta } from '../types/index';
import { PERSONAL_PLANTA } from '../constants/mock';
import type { LayoutContextType } from '../layout/AppLayout';

export function HistorialPage() {
  const { tema, esModoOscuro, movimientos, usuarioActual } = useOutletContext<LayoutContextType>();
  const [filtroOperario, setFiltroOperario] = useState<string>('todos');

  // CONTROL DE ACCESO (RBAC): Bloqueo estricto para perfiles no supervisores
  if (usuarioActual.rol !== 'supervisor') {
    return (
      <section
        style={{
          background: tema.fondoTarjeta,
          border: '1px solid #fecaca',
          borderRadius: '12px',
          padding: '24px',
          textAlign: 'center'
        }}
      >
        <div style={{ fontSize: '2rem', marginBottom: '8px' }}>🔒</div>
        <h2 style={{ fontSize: '1.1rem', margin: '0 0 6px 0', color: '#991b1b', fontWeight: 800 }}>
          Acceso Restringido - Nivel Auditoría
        </h2>
        <p style={{ fontSize: '0.85rem', color: '#b91c1c', margin: '0 0 14px 0' }}>
          La consulta consolidada de movimientos de planta (RN-06) requiere permisos de <b>Supervisor o Control de Calidad</b>.
        </p>
        <div
          style={{
            background: esModoOscuro ? '#1c1917' : '#fef2f2',
            padding: '10px',
            borderRadius: '8px',
            fontSize: '0.78rem',
            color: tema.textoSecundario
          }}
        >
          Usuario actual: <b>{usuarioActual.nombre}</b> ({usuarioActual.legajo}) — <i>Rol Técnico</i>.
          <br />
          Para inspeccionar registros, cambie la sesión a un perfil Supervisor.
        </div>
      </section>
    );
  }

  // Vista autorizada para Supervisores: filtrado reactivo
  const movimientosFiltrados = filtroOperario === 'todos'
    ? movimientos
    : movimientos.filter((m) => m.operario.includes(filtroOperario));

  return (
    <section
      style={{
        background: tema.fondoTarjeta,
        border: `1px solid ${tema.borde}`,
        borderRadius: '12px',
        padding: '20px'
      }}
    >
      {/* 1. Cabecera de auditoría y credencial de rol */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
        <div>
          <h2 style={{ fontSize: '1.05rem', margin: 0, color: tema.textoPrincipal, fontWeight: 700 }}>
            Auditoría General de Stock (RN-06)
          </h2>
          <p style={{ fontSize: '0.8rem', color: tema.textoSecundario, margin: '3px 0 0 0' }}>
            Consola central de trazabilidad inmutable de planta.
          </p>
        </div>
        <span
          style={{
            background: '#dbeafe',
            color: '#1e40af',
            fontSize: '0.7rem',
            fontWeight: 700,
            padding: '4px 8px',
            borderRadius: '12px',
            whiteSpace: 'nowrap'
          }}
        >
          🛡 Rol Supervisor
        </span>
      </div>

      {/* 2. Filtro de auditoría por operador */}
      <div
        style={{
          margin: '14px 0',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          background: esModoOscuro ? '#061b24' : '#f8fafc',
          padding: '8px 12px',
          borderRadius: '8px',
          border: `1px solid ${tema.borde}`
        }}
      >
        <label htmlFor="filtro-operario" style={{ fontSize: '0.75rem', fontWeight: 600, color: tema.textoSecundario }}>
          Filtrar por:
        </label>
        <select
          id="filtro-operario"
          value={filtroOperario}
          onChange={(e) => setFiltroOperario(e.target.value)}
          style={{
            flex: 1,
            background: tema.fondoTarjeta,
            color: tema.textoPrincipal,
            border: `1px solid ${tema.borde}`,
            borderRadius: '6px',
            padding: '4px 8px',
            fontSize: '0.78rem',
            fontWeight: 600,
            outline: 'none',
            cursor: 'pointer'
          }}
        >
          <option value="todos">Todos los técnicos y movimientos</option>
          {PERSONAL_PLANTA.filter((u: UsuarioPlanta) => u.rol === 'tecnico').map((u: UsuarioPlanta) => (
            <option key={u.id} value={u.nombre}>
              Solo {u.nombre} ({u.legajo})
            </option>
          ))}
        </select>
      </div>

      {/* 3. Listado consolidado o estado sin registros */}
      {movimientosFiltrados.length === 0 ? (
        <div
          style={{
            padding: '18px',
            borderRadius: '8px',
            background: esModoOscuro ? '#061b24' : '#f8fafc',
            border: `1px solid ${tema.borde}`,
            textAlign: 'center',
            color: tema.textoSecundario,
            fontSize: '0.85rem'
          }}
        >
          {movimientos.length === 0
            ? 'Sin movimientos registrados durante el turno activo.'
            : 'No hay transacciones registradas para el operario seleccionado.'}
        </div>
      ) : (
        <MovimientoList
          movimientos={movimientosFiltrados}
          tema={tema}
          esModoOscuro={esModoOscuro}
        />
      )}
    </section>
  );
}