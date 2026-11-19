// DASHBOARD DE INICIO CON FILTRADO DINÁMICO POR ROL (RBAC)

import { useNavigate, useOutletContext } from 'react-router-dom';
import type { LayoutContextType } from '../types';

export function HomePage() {
  const navigate = useNavigate();
  const context = useOutletContext<LayoutContextType>() as any;

  // Extraemos el usuario actual y los repuestos del contexto global
  const { tema, esModoOscuro, repuestos = [], usuarioActual } = context || {};
  
  // Obtenemos el rol del usuario (normalizado a minúsculas o texto plano para comparar con seguridad)
  const rolUsuario = usuarioActual?.rol?.toLowerCase() || '';

    // Detección automática de alertas basadas en stock crítico (RN-02)
  const repuestosSinStock = repuestos.filter((r: any) => r.stock_disponible <= 0);
  const repuestosCriticos = repuestos.filter((r: any) => r.stock_disponible > 0 && r.stock_disponible <= 5);

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

      {/* ── 1. PANEL DE ALERTAS CRÍTICAS DE PLANTA (GMP / RN-02) ── */}
      {(repuestosSinStock.length > 0 || repuestosCriticos.length > 0) && (
        <div style={{
          background: esModoOscuro ? '#2a1215' : '#fef2f2',
          border: '2px solid #ef4444',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '24px',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.1)'
        }}>
          <h3 style={{ color: '#dc2626', margin: '0 0 8px 0', fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
            ⚠️ Alertas Activas de Pañol y Stock
          </h3>
          <ul style={{ margin: 0, paddingLeft: '20px', color: esModoOscuro ? '#fca5a5' : '#7f1d1d', fontSize: '0.9rem' }}>
            {repuestosSinStock.length > 0 && (
              <li>Hay <strong>{repuestosSinStock.length} repuesto(s) sin stock</strong> que bloquean operaciones.</li>
            )}
            {repuestosCriticos.length > 0 && (
              <li>Hay <strong>{repuestosCriticos.length} repuesto(s) en stock crítico</strong> requiriendo solicitud a compras.</li>
            )}
          </ul>
        </div>
      )}

      {/* ── 2. CABECERA DE LA CONSOLA ── */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ color: tema.textoPrincipal, fontSize: '1.3rem', margin: '0 0 6px 0', fontWeight: 700 }}>
          Consola de Mantenimiento de Turno
        </h2>
        <p style={{ color: tema.textoSecundario, fontSize: '0.88rem', margin: 0 }}>
          Terminal operativo para registro de piezas mecánicas y trazabilidad conforme a normas sanitarias GMP.
          {usuarioActual && (
            <span> Sesión iniciada como: <strong>{usuarioActual.nombre}</strong> ({usuarioActual.rol})</span>
          )}
        </p>
      </div>

      {/* Grilla condicionada por rol */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px' }}>
        
        {/* OP1: Si es OPERARIO -> Botón rápido para Reportar Falla */}
        {(rolUsuario.includes('operario') || !rolUsuario) && (
          <div onClick={() => navigate('/nueva-incidencia')} style={cardStyle}>
            <div style={{ fontSize: '1.8rem' }}>🚨</div>
            <div>
              <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: tema.textoPrincipal }}>
                Reportar Falla en Línea
              </h3>
              <p style={{ margin: 0, fontSize: '0.82rem', color: tema.textoSecundario, lineHeight: 1.4 }}>
                Registro rápido de anomalías mecánicas o eléctricas detectadas durante la producción.
              </p>
            </div>
            <button
              style={{
                marginTop: 'auto',
                background: '#f59e0b',
                color: '#fff',
                border: 'none',
                padding: '10px 14px',
                borderRadius: '8px',
                fontWeight: 700,
                fontSize: '0.85rem',
                cursor: 'pointer'
              }}
            >
              Reportar Incidencia →
            </button>
          </div>
        )}

        {/* OP2: Si es TÉCNICO o SUPERVISOR -> Módulo de Repuestos (CU-01) */}
        {(rolUsuario.includes('técnico') || rolUsuario.includes('tecnico') || rolUsuario.includes('supervisor') || !rolUsuario) && (
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
            Abrir Modulo de Repuestos →
          </button>
        </div>
        )}

        // {/* OP3: Si es DEPÓSITO o SUPERVISOR -> Recepción de Materiales */}
        {(rolUsuario.includes('depósito') || rolUsuario.includes('deposito') || rolUsuario.includes('supervisor') || !rolUsuario) && (
          <div
            onClick={() => navigate('/recepcion')}
            style={cardStyle}
          >
          <div style={{ fontSize: '1.8rem' }}>📦</div>
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: '1.05rem', color: tema.textoPrincipal }}>
              Recepción de Materiales
            </h3>
            <p style={{ margin: 0, fontSize: '0.82rem', color: tema.textoSecundario, lineHeight: 1.4 }}>
              Ingreso de nuevos insumos y componentes mecánicos al pañol de planta para reposición de inventario.
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
            Ver Recepcion →
          </button>
        </div>
        )}
      </div>
    </section>
  );
}
