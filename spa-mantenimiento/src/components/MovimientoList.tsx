

// LISTA DE AUDITORÍA Y TRAZABILIDAD DE MOVIMIENTOS (RN-06)

import { type MovimientoStock, type TemaPaleta } from '../types/index';

interface MovimientoItemProps {
    movimiento: MovimientoStock;
    tema: TemaPaleta;
    esModoOscuro: boolean;
}

// Subcomponente atómico para cada registro inmutable
function MovimientoItem({ movimiento, tema, esModoOscuro }: MovimientoItemProps) {
    const { hora, codigo, operario, cantidad } = movimiento;

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                background: esModoOscuro ? '#061b24' : '#f8fafc',
                padding: '10px 12px',
                borderRadius: '8px',
                fontSize: '0.8rem',
                border: `1px solid ${tema.borde}`
      }}
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <span style={{ color: tema.textoSecundario, fontFamily: 'monospace', fontSize: '0.82rem' }}>
              {hora}
            </span>
            <b style={{ color: tema.textoPrincipal, fontFamily: 'monospace', fontSize: '0.88rem' }}>
              {codigo}
            </b>
          </div>
          <span style={{ color: tema.textoSecundario, fontSize: '0.75rem', fontWeight: 500 }}>
            👤 {operario || 'Sin operario asignado'}
          </span>
      </div>

      <span
        style={{
          color: '#ef4444',
          fontWeight: 800,
          fontSize: '0.9rem',
          fontFamily: 'monospace'
        }}
      >
        -{cantidad} u.
      </span>
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