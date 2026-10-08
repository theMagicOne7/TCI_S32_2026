// PANTALLA DE GESTIÓN DE STOCK Y CONSULTA QR SIMULADA (CU-01)

import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { type Repuesto, type MovimientoStock } from '../types/index';
import { fetchRepuestoPorCodigo, registrarConsumoAPI } from '../data';
import { RepuestoCard } from '../components/RepuestoCard';
import type { LayoutContextType } from '../layout/AppLayout';
import { CODIGOS_CONOCIDOS } from '../constants/mock';

export function RepuestosPage() {
  const { tema, esModoOscuro, agregarMovimiento, usuarioActual } = useOutletContext<LayoutContextType>();

  const [codigoBuscado, setCodigoBuscado] = useState('FIL-001');
  const [repuesto, setRepuesto] = useState<Repuesto | null>(null);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mensajeConsumo, setMensajeConsumo] = useState<string | null>(null);
  const [cantidadAConsumir, setCantidadAConsumir] = useState<number>(1);

  const consultarRepuesto = async (codigo: string) => {
    const codLimpio = codigo.trim().toUpperCase();
    if (!codLimpio) return;

    setCargando(true);
    setError(null);
    setMensajeConsumo(null);

    try {
      const datos = await fetchRepuestoPorCodigo(codLimpio);
      setRepuesto(datos);
    } catch (err: unknown) {
      setRepuesto(null);

      // Detección y traducción del timeout / error de conexión
      if (err instanceof DOMException && (err.name === 'TimeoutError' || err.name === 'AbortError')) {
        setError('Tiempo de espera agotado (5s). El servidor de inventario no responde.');
      } else if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('Error de conexión. Verifique el enlace de red con la central.');
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Error inesperado al consultar inventario');
      }
    } finally {
      setCargando(false);
    }
  };

  const registrarConsumo = async () => {
    if (!repuesto) return;
    if (cantidadAConsumir <= 0 || cantidadAConsumir > repuesto.stock_disponible) return;

    try {
      // 1. Llamada HTTP al servidor mock Prism
      await registrarConsumoAPI(repuesto.codigo, cantidadAConsumir);

      // 2. RN-01: Descuento atómico del stock físico en memoria
      setRepuesto((prev) => prev ? {
        ...prev,
        stock_disponible: prev.stock_disponible - cantidadAConsumir
      } : null);

      // 3. RN-06: Registro inmutable con hora militar (24 hs) y firma del operario
      const nuevoMovimiento: MovimientoStock = {
        id: Date.now(),
        hora: new Date().toLocaleTimeString('es-AR', { hour12: false }),
        codigo: repuesto.codigo,
        cantidad: cantidadAConsumir,
        operario: `${usuarioActual.nombre} (${usuarioActual.legajo})`
      };
      agregarMovimiento(nuevoMovimiento);

      // 4. Feedback visual y reseteo
      setMensajeConsumo(`✅ Registrado consumo de ${cantidadAConsumir} u. para ${repuesto.codigo}.`);
      setCantidadAConsumir(1);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'No se pudo registrar el consumo');
    }
  };

  // Carga inicial por defecto
  useEffect(() => {
    consultarRepuesto(codigoBuscado);
  }, []);

  // Limpieza automática del mensaje de éxito a los 3 segundos
  useEffect(() => {
    if (!mensajeConsumo) return;
    const timer = setTimeout(() => setMensajeConsumo(null), 3000);
    return () => clearTimeout(timer);
  }, [mensajeConsumo]);

  return (
    <>
      {/* Buscador de código QR */}
      <section
        style={{
          background: tema.fondoTarjeta,
          border: `1px solid ${tema.borde}`,
          borderRadius: '12px',
          padding: '18px',
          marginBottom: '20px',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)'
        }}
      >
        <label
          htmlFor="input-qr"
          style={{
            display: 'block',
            fontSize: '0.85rem',
            fontWeight: 700,
            marginBottom: '8px',
            color: tema.textoPrincipal
          }}
        >
          Código QR simulado:
        </label>
        
       {/* ✅ CÓDIGO CORREGIDO (responsive y contenido): */}
<div 
  style={{ 
    display: 'flex', 
    gap: '8px', 
    flexWrap: 'wrap', // Permite acomodarse si la pantalla es muy angosta
    width: '100%',
    boxSizing: 'border-box'
  }}
>
  <input
    id="input-qr"
    type="text"
    value={codigoBuscado}
    onChange={(e) => setCodigoBuscado(e.target.value)}
    onKeyDown={(e) => e.key === 'Enter' && consultarRepuesto(codigoBuscado)}
    placeholder="Ingrese código (ej: FIL-001)"
    style={{
      flex: '1 1 180px', // Crece si hay lugar, pero no desborda
      minWidth: 0,       // Evita que el input empuje hacia afuera en flexbox
      padding: '10px 12px',
      borderRadius: '8px',
      border: `1px solid ${tema.borde}`,
      fontSize: '0.95rem',
      color: tema.textoPrincipal,
      background: tema.fondoInput,
      outline: 'none',
      boxSizing: 'border-box'
    }}
  />
  <button
    onClick={() => consultarRepuesto(codigoBuscado)}
    disabled={cargando}
    style={{
      background: tema.botonPrimario,
      color: tema.botonTexto,
      border: 'none',
      padding: '10px 16px',
      borderRadius: '8px',
      fontWeight: 700,
      fontSize: '0.9rem',
      cursor: cargando ? 'wait' : 'pointer',
      whiteSpace: 'nowrap',
      flexShrink: 0
    }}
  >
    {cargando ? 'Buscando...' : 'Consultar'}
  </button>
</div>

        {/* Códigos de ejemplo integrados en el flujo visual */}
        <p
          style={{
            margin: '12px 0 0 0',
            fontSize: '0.8rem',
            color: tema.textoSecundario,
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            flexWrap: 'wrap'
          }}
        >
          <span>Códigos de ejemplo:</span>
          {CODIGOS_CONOCIDOS.map((cod) => (
            <code
              key={cod}
              style={{
                background: esModoOscuro ? '#061b24' : '#f1f5f9',
                color: tema.acento,
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.78rem',
                border: `1px solid ${tema.borde}`,
                fontFamily: 'monospace'
              }}
            >
              {cod}
            </code>
          ))}
        </p>
      </section>

      {/* Estados de carga y error */}
      {cargando && (
        <p style={{ textAlign: 'center', color: tema.textoSecundario, fontSize: '0.9rem' }}>
          Consultando inventario en planta...
        </p>
      )}

      {error && !cargando && (
        <div
          style={{
            background: '#fef2f2',
            border: '1px solid #fecaca',
            padding: '16px',
            borderRadius: '12px',
            color: '#991b1b',
            textAlign: 'center',
            marginBottom: '16px'
          }}
        >
          <p style={{ fontWeight: 800, margin: '0 0 4px 0' }}>⚠️ Repuesto No Encontrado</p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#b91c1c' }}>{error}</p>
        </div>
      )}

      {/* Ficha técnica y formulario de consumo */}
      {repuesto && !cargando && (
        <RepuestoCard
          repuesto={repuesto}
          tema={tema}
          esModoOscuro={esModoOscuro}
          cantidadAConsumir={cantidadAConsumir}
          mensajeConsumo={mensajeConsumo}
          onIncrementar={() => setCantidadAConsumir((c) => Math.min(repuesto.stock_disponible, c + 1))}
          onDecrementar={() => setCantidadAConsumir((c) => Math.max(1, c - 1))}
          onCambioCantidad={setCantidadAConsumir}
          onConfirmarConsumo={registrarConsumo}
        />
      )}
    </>
  );
}