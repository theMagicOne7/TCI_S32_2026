// DASHBOARD DE INICIO RESPONSIVE CON TARJETAS OPERATIVAS

import { useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContextType } from '../layout/AppLayout';

export function HomePage() {
  const navigate = useNavigate();
  const { tema, esModoOscuro } = useOutletContext<LayoutContextType>();

  const cardStyle = {
    flex: '1 1 280px',
    background: esModoOscuro ? '#061b24' : '#f8fafc',
    border: `1px solid ${tema.borde}`,
    borderRadius: '12px',
    padding: '20px',
    cursor: 'pointer',
    textAlign: 'left' as const,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '10px',
    transition: 'transform 0.15s ease, box-shadow 0.15s ease'
  };

  return (
    <section style={{ padding: '8px 0' }}>
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: tema.textoPrincipal, fontSize: '1.3rem', margin: '0 0 6px 0', fontWeight: 700 }}>
          Consola de Mantenimiento de Turno
        </h2>
        <p style={{ color: tema.textoSecundario, fontSize: '0.88rem', margin: 0 }}>
          Terminal operativo para registro de piezas mecánicas y trazabilidad conforme a normas sanitarias GMP.
        </p>
      </div>

      {/* Grilla autoajustable a 1 o 2 columnas */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        {/* Tarjeta CU-01 */}
        <div
          onClick={() => navigate('/repuestos')}
          style={cardStyle}
        >
          <div style={{ fontSize: '1.8rem' }}>🔍</div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: tema.textoPrincipal }}>
              Escanear y Consumir Repuesto (CU-01)
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: tema.textoSecundario, lineHeight: 1.4 }}>
              Consulta inmediata de stock, ubicación en estantería física y descuento de inventario con validación de saldos (RN-01).
            </p>
          </div>
          <button
            style={{
              marginTop: 'auto',
              background: tema.botonPrimario,
              color: tema.botonTexto,
              border: 'none',
              padding: '10px 14px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Abrir Escáner de Pieza →
          </button>
        </div>

        {/* Tarjeta RN-06 */}
        <div
          onClick={() => navigate('/historial')}
          style={cardStyle}
        >
          <div style={{ fontSize: '1.8rem' }}>📋</div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: tema.textoPrincipal }}>
              Registro de Auditoría (RN-06)
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: tema.textoSecundario, lineHeight: 1.4 }}>
              Historial de movimientos con firma de operario, timestamps militares y acceso exclusivo para roles de supervisión (RBAC).
            </p>
          </div>
          <button
            style={{
              marginTop: 'auto',
              background: tema.fondoTarjeta,
              color: tema.textoPrincipal,
              border: `1px solid ${tema.borde}`,
              padding: '10px 14px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            Ver Bitácora de Planta →
          </button>
        </div>
      </div>
    </section>
  );
}