// LISTA DE AUDITORÍA Y TRAZABILIDAD DE MOVIMIENTOS (RN-06)

import { useState } from 'react';
import { type MovimientoStock, type TemaPaleta } from '../types/index';

interface MovimientoItemProps {
    movimiento: MovimientoStock;
    tema: TemaPaleta;
    esModoOscuro: boolean;
}

// Subcomponente atómico para cada registro inmutable
function MovimientoItem({ movimiento, tema, esModoOscuro }: MovimientoItemProps) {
  const { hora, fecha, codigo, operario, cantidad, maquinaVinculada, motivoUso } = movimiento;
  
  const [verMotivo, setVerMotivo] = useState(false);

  // 👇 LÓGICA INTELIGENTE: Diferenciar ingreso de depósito vs retiro técnico 👇
  const esIngreso = maquinaVinculada === 'N/A';
  const colorOperacion = esIngreso ? '#16a34a' : '#ef4444'; // Verde para ingreso, Rojo para retiro
  const signoOperacion = esIngreso ? '+' : '-';

    return (
        <div
            style={{
                display: 'flex',
                background: esModoOscuro ? '#061b24' : '#f8fafc',
                padding: '12px',
                borderRadius: '8px',
                border: `1px solid ${tema.borde}`,
                flexDirection: 'column',
                gap: '8px'
      }}
    >
            {/* Fila principal del registro */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: tema.textoSecundario, fontFamily: 'monospace', fontSize: '0.75rem' }}>
              {fecha} {hora}
            </span>
            <b style={{ color: tema.textoPrincipal, fontFamily: 'monospace', fontSize: '0.88rem' }}>
              {codigo}
            </b>
          </div>
          <span style={{ color: tema.textoSecundario, fontSize: '0.75rem', fontWeight: 500 }}>
            👤 {operario} {maquinaVinculada !== 'N/A' ? ` | ⚙️ Máquina: ${maquinaVinculada}` : ''}
          </span>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '6px' }}>
      <span
        style={{
          color: colorOperacion,
          fontWeight: 800,
          fontSize: '0.9rem',
          fontFamily: 'monospace'
        }}
      >
        {signoOperacion}{cantidad} u.
      </span>
                
          {/* Botón para desplegar el motivo */}
          {motivoUso && (
            <button
              onClick={() => setVerMotivo(!verMotivo)}
              style={{
                background: 'transparent',
                color: '#0ea5e9',
                border: '1px solid #0ea5e9',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '0.65rem',
                cursor: 'pointer',
                fontWeight: 700
              }}
            >
              {verMotivo ? 'Ocultar' : 'Ver Motivo'}
            </button>
          )}
        </div>
      </div>

      {/* Caja desplegable con el motivo de uso */}
      {verMotivo && motivoUso && (
        <div style={{
          marginTop: '4px',
          padding: '8px',
          background: esModoOscuro ? '#16232b' : '#f1f5f9',
          borderRadius: '6px',
          fontSize: '0.75rem',
          color: tema.textoPrincipal,
          borderLeft: `3px solid ${colorOperacion}`
        }}>
          <b>Motivo de {esIngreso ? 'ingreso' : 'retiro'}:</b> {motivoUso}
        </div>
      )}
    </div>
  );
}

interface MovimientoListProps {
  movimientos: MovimientoStock[];
  tema: TemaPaleta;
  esModoOscuro: boolean;
}

export function MovimientoList({ movimientos, tema, esModoOscuro }: MovimientoListProps) {
  if (movimientos.length === 0) return null;

  const totalTexto = `${movimientos.length} ${movimientos.length === 1 ? 'registro' : 'registros'}`;

  return (
    <section
      style={{
        marginTop: '16px',
        background: tema.fondoTarjeta,
        border: `1px solid ${tema.borde}`,
        borderRadius: '12px',
        padding: '16px'
      }}
    >
      <header
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px'
        }}
      >
        <h2 style={{ fontSize: '0.9rem', margin: 0, fontWeight: 700, color: tema.textoPrincipal }}>
          Movimientos del Turno (RN-06)
        </h2>
        <span style={{ fontSize: '0.75rem', color: tema.textoSecundario }}>
          {totalTexto}
        </span>
      </header>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {movimientos.map((mov) => (
          <MovimientoItem
            key={mov.id}
            movimiento={mov}
            tema={tema}
            esModoOscuro={esModoOscuro}
          />
        ))}
      </div>
    </section>
  );
}