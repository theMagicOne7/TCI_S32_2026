
// TARJETA DE REPUESTO, ESTADO, ALERTA CRÍTICA (RN-02) Y SELECTOR DE CONSUMO (RN-01)

import { type Repuesto, type TemaPaleta } from '../types/index';
import { UMBRAL_MINIMO } from '../constants/mock';

interface RepuestoCardProps {
  repuesto: Repuesto;
  tema: TemaPaleta;
  esModoOscuro: boolean;
  cantidadAConsumir: number;
  mensajeConsumo: string | null;
  onIncrementar: () => void;
  onDecrementar: () => void;
  onCambioCantidad: (cant: number) => void;
  onConfirmarConsumo: () => void;
}

export function RepuestoCard({
  repuesto,
  tema,
  esModoOscuro,
  cantidadAConsumir,
  mensajeConsumo,
  onIncrementar,
  onDecrementar,
  onCambioCantidad,
  onConfirmarConsumo
}: RepuestoCardProps) {
  const stock = repuesto.stock_disponible;
  const sinStock = stock <= 0;
  const esStockCritico = stock > 0 && stock <= UMBRAL_MINIMO;
  const saldoInsuficiente = cantidadAConsumir > stock || cantidadAConsumir <= 0;

  // Cálculo consolidado de estado del semáforo
  const estadoBadge = stock > UMBRAL_MINIMO
    ? { texto: 'Stock Óptimo', bg: '#dcfce7', color: '#15803d' }
    : stock > 0
    ? { texto: 'Stock Bajo', bg: '#fef3c7', color: '#b45309' }
    : { texto: 'Sin Stock', bg: '#fee2e2', color: '#b91c1c' };

  const btnStepStyle: React.CSSProperties = {
    width: '32px',
    height: '32px',
    background: tema.fondoInput,
    color: tema.textoPrincipal,
    border: `1px solid ${tema.borde}`,
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '1rem'
  };

  return (
    <article style={{
      background: tema.fondoTarjeta,
      border: `1px solid ${tema.borde}`,
      borderRadius: '12px',
      padding: '20px',
      boxShadow: '0 4px 16px rgba(0, 0, 0, 0.04)'
    }}>
      {/* 1. Cabecera e Identificador */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
        <div>
          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: tema.textoSecundario, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            Código de Pieza
          </span>
          <p style={{ margin: '2px 0 0 0', fontWeight: 800, fontSize: '1.25rem', color: tema.textoPrincipal, fontFamily: 'monospace' }}>
            {repuesto.codigo}
          </p>
        </div>
        <span style={{
          background: estadoBadge.bg,
          color: estadoBadge.color,
          fontSize: '0.75rem',
          fontWeight: 800,
          padding: '4px 10px',
          borderRadius: '20px'
        }}>
          {estadoBadge.texto}
        </span>
      </div>

      {/* 2. Descripción */}
      <div style={{ marginBottom: '14px' }}>
        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: tema.textoSecundario }}>
          Descripción Técnica
        </span>
        <p style={{ margin: '2px 0 0 0', fontWeight: 600, color: tema.textoPrincipal }}>
          {repuesto.nombre}
        </p>
      </div>

      {/* 3. Ubicación y Balance Físico */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', borderTop: `1px solid ${tema.borde}`, paddingTop: '12px' }}>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: tema.textoSecundario }}>
            Ubicación en Depósito
          </span>
          <p style={{ margin: '2px 0 0 0', fontWeight: 700, color: tema.textoPrincipal }}>
            {repuesto.ubicacion}
          </p>
        </div>
        <div>
          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: tema.textoSecundario }}>
            Stock Disponible
          </span>
          <p style={{ margin: '2px 0 0 0', fontWeight: 800, fontSize: '1.25rem', color: tema.textoPrincipal }}>
            {stock} <span style={{ fontSize: '0.8rem', fontWeight: 500, color: tema.textoSecundario }}>u.</span>
          </p>
        </div>
      </div>

      {/* 4. RN-02: Banner de Alerta Crítica */}
      {esStockCritico && (
        <div style={{
          marginTop: '16px',
          padding: '16px',
          background: '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: '10px',
          textAlign: 'center'
        }}>
          <p style={{ color: '#dc2626', fontWeight: 900, fontSize: '1.15rem', margin: '0 0 6px 0', letterSpacing: '0.5px' }}>
            ⚠️ ¡ALERTA: STOCK CRÍTICO!
          </p>
          <p style={{ color: '#b91c1c', fontSize: '1.05rem', fontWeight: 800, margin: '0 0 4px 0' }}>
            STOCK ACTUAL: {stock} UNIDADES
          </p>
          <p style={{ color: '#7f1d1d', fontSize: '0.85rem', fontWeight: 700, margin: 0, textTransform: 'uppercase' }}>
            SOLICITAR REPONER CANTIDAD INMEDIATAMENTE A COMPRAS
          </p>
        </div>
      )}

      {/* Feedback de Transacción Exitosa */}
      {mensajeConsumo && (
        <div style={{ marginTop: '14px', background: '#ecfdf5', color: '#065f46', padding: '10px', borderRadius: '8px', fontSize: '0.85rem', textAlign: 'center', fontWeight: 700, border: '1px solid #a7f3d0' }}>
          {mensajeConsumo}
        </div>
      )}

      {/* 5. CU-01 & RN-01: Control de Registro o Bloqueo */}
      {!sinStock ? (
        <div style={{ marginTop: '18px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
            <label htmlFor="cant-consumo" style={{ fontSize: '0.85rem', fontWeight: 600, color: tema.textoPrincipal }}>
              Cantidad a utilizar:
            </label>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <button type="button" onClick={onDecrementar} style={btnStepStyle}>-</button>
              <input
                id="cant-consumo"
                type="number"
                min="1"
                max={stock}
                value={cantidadAConsumir}
                onChange={(e) => onCambioCantidad(Number(e.target.value))}
                style={{
                  width: '46px',
                  textAlign: 'center',
                  padding: '6px 4px',
                  borderRadius: '6px',
                  border: `1px solid ${saldoInsuficiente ? '#ef4444' : tema.borde}`,
                  background: tema.fondoInput,
                  color: tema.textoPrincipal,
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  outline: 'none'
                }}
              />
              <button type="button" onClick={onIncrementar} style={btnStepStyle}>+</button>
            </div>
          </div>

          {cantidadAConsumir > stock && (
            <p style={{ color: '#ef4444', fontSize: '0.78rem', fontWeight: 700, margin: '0 0 10px 0', textAlign: 'right' }}>
              ⚠️ Cantidad superior al stock disponible (RN-01).
            </p>
          )}

          <button
            onClick={onConfirmarConsumo}
            disabled={saldoInsuficiente}
            style={{
              width: '100%',
              padding: '12px',
              background: saldoInsuficiente
                ? (esModoOscuro ? '#1e293b' : '#cbd5e1')
                : tema.botonPrimario,
              color: saldoInsuficiente
                ? (esModoOscuro ? '#64748b' : '#94a3b8')
                : tema.botonTexto,
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: saldoInsuficiente ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s, opacity 0.2s',
              boxShadow: saldoInsuficiente ? 'none' : '0 4px 10px rgba(13, 148, 136, 0.2)'
            }}
          >
            Registrar Uso de Repuesto (-{cantidadAConsumir} u.)
          </button>
        </div>
      ) : (
        <div style={{
          marginTop: '18px',
          padding: '14px',
          background: esModoOscuro ? '#16232b' : '#f1f5f9',
          border: `1px dashed ${tema.borde}`,
          borderRadius: '8px',
          textAlign: 'center',
          color: tema.textoSecundario,
          fontSize: '0.88rem',
          fontWeight: 700
        }}>
          🚫 Sin stock disponible. Registro de uso deshabilitado.
        </div>
      )}
    </article>
  );
}