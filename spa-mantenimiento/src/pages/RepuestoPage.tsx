// PANTALLA DE GESTIÓN DE STOCK Y CONSULTA QR SIMULADA (CU-01)

import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { type Repuesto, type MovimientoStock } from '../types/index';
import { RepuestoCard } from '../components/RepuestoCard';
import type { LayoutContextType } from '../types/index';
import { CODIGOS_CONOCIDOS } from '../constants/mock';

export function RepuestosPage() {
  // 👇 1. Ahora traemos 'repuestos' y 'actualizarRepuesto' del estado global 👇
  const { tema, esModoOscuro, agregarMovimiento, usuarioActual, repuestos, actualizarRepuesto } = useOutletContext<LayoutContextType>();

  const [codigoBuscado, setCodigoBuscado] = useState('FIL-001');
  const [repuesto, setRepuesto] = useState<Repuesto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensajeConsumo, setMensajeConsumo] = useState<string | null>(null);
  const [cantidadAConsumir, setCantidadAConsumir] = useState<number>(1);
    // (Nota: Estos estados deberías pasárselos como props a tu RepuestoCard para que los inputs funcionen)
  const [maquinaVinculada, setMaquinaVinculada] = useState<string>('');
  const [motivoUso, setMotivoUso] = useState<string>('');

  // 👇 2. La consulta ahora busca en memoria, no en internet 👇
  const consultarRepuesto = (codigo: string) => {
    const codLimpio = codigo.trim().toUpperCase();
    if (!codLimpio) return;

    setError(null);
    setMensajeConsumo(null);
    
    // Buscamos en el array global que provee AppLayout
    const encontrado = repuestos.find(r => r.codigo === codLimpio);

    if (encontrado) {
      setRepuesto(encontrado);
    } else {
      setRepuesto(null);
      setError(`El código ${codLimpio} no existe en el sistema.`);
    }
  };

  const registrarConsumo = () => {
    if (!repuesto) return;
    if (cantidadAConsumir <= 0 || cantidadAConsumir > repuesto.stock_disponible) return;

    // 👇 3. Actualizamos el stock usando la función global 👇
    const repuestoActualizado = {
      ...repuesto,
      stock_disponible: repuesto.stock_disponible - cantidadAConsumir
    };
    
    // Le avisamos a toda la app que cambió el stock
    actualizarRepuesto(repuestoActualizado);
    
    // Actualizamos nuestra vista local
    setRepuesto(repuestoActualizado);

    // 4. Registro inmutable (Auditoría)
    const fechaActual = new Date();
    const horaNum = fechaActual.getHours();
    
    const turnoActual = (horaNum >= 6 && horaNum < 14) ? 'Mañana' 
                      : (horaNum >= 14 && horaNum < 22) ? 'Tarde' 
                      : 'Noche';

    const nuevoMovimiento: MovimientoStock = {
      id: Date.now(),
      fecha: fechaActual.toLocaleDateString('es-AR'), 
      hora: fechaActual.toLocaleTimeString('es-AR', { hour12: false }), 
      codigo: repuesto.codigo,
      cantidad: cantidadAConsumir,
      operario: `${usuarioActual.nombre} (${usuarioActual.legajo})`,
      turno: turnoActual,
      maquinaVinculada: maquinaVinculada,
      motivoUso: motivoUso,
    };
    
    agregarMovimiento(nuevoMovimiento);

    // 5. Feedback visual y reseteo
    setMensajeConsumo(`✅ Registrado consumo de ${cantidadAConsumir} u. para ${repuesto.codigo}.`);
    setCantidadAConsumir(1);
    setMaquinaVinculada(''); 
    setMotivoUso('');
  };

  // Carga inicial por defecto (como ya no es asíncrona, no necesitamos useEffect)
  useEffect(() => {
    consultarRepuesto(codigoBuscado);
  }, []); // Se ejecuta solo al montar el componente

  // Limpieza automática del mensaje de éxito
  useEffect(() => {
    if (!mensajeConsumo) return;
    const timer = setTimeout(() => setMensajeConsumo(null), 3000);
    return () => clearTimeout(timer);
  }, [mensajeConsumo]);

  return (
    <>
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
          style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '8px', color: tema.textoPrincipal }}
        >
          Código QR simulado:
        </label>
        
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', width: '100%', boxSizing: 'border-box' }}>
          <input
            id="input-qr"
            type="text"
            value={codigoBuscado}
            onChange={(e) => setCodigoBuscado(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && consultarRepuesto(codigoBuscado)}
            placeholder="Ingrese código (ej: FIL-001)"
            style={{
              flex: '1 1 180px',
              minWidth: 0, 
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
            style={{
              background: tema.botonPrimario,
              color: tema.botonTexto,
              border: 'none',
              padding: '10px 16px',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.9rem',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0
            }}
          >
            Consultar
          </button>
        </div>

        <p style={{ margin: '12px 0 0 0', fontSize: '0.8rem', color: tema.textoSecundario, display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
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

      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', padding: '16px', borderRadius: '12px', color: '#991b1b', textAlign: 'center', marginBottom: '16px' }}>
          <p style={{ fontWeight: 800, margin: '0 0 4px 0' }}>⚠️ Repuesto No Encontrado</p>
          <p style={{ margin: 0, fontSize: '0.85rem', color: '#b91c1c' }}>{error}</p>
        </div>
      )}

      {repuesto && !error && (
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