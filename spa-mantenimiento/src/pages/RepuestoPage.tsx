// PANTALLA DE GESTIÓN DE STOCK Y CONSULTA QR SIMULADA (CU-01)

import { useState, useEffect } from 'react';
import { useOutletContext } from 'react-router-dom';
import { type Repuesto, type MovimientoStock } from '../types/index';
import { RepuestoCard } from '../components/RepuestoCard';
import type { LayoutContextType } from '../types/index';
import { CODIGOS_CONOCIDOS } from '../constants/mock';
import { Html5Qrcode } from 'html5-qrcode';

export function RepuestosPage() {
  const { tema, esModoOscuro, agregarMovimiento, usuarioActual, repuestos, actualizarRepuesto } = useOutletContext<LayoutContextType>();

  const [codigoBuscado, setCodigoBuscado] = useState('FIL-001');
  const [repuesto, setRepuesto] = useState<Repuesto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [mensajeConsumo, setMensajeConsumo] = useState<string | null>(null);
  const [cantidadAConsumir, setCantidadAConsumir] = useState<number>(1);
  const [maquinaVinculada, setMaquinaVinculada] = useState<string>('');
  const [motivoUso, setMotivoUso] = useState<string>('');

  // Estados para el control de la cámara y el escáner
  const [scannerActivo, setScannerActivo] = useState(false);
  const [html5QrCode, setHtml5QrCode] = useState<Html5Qrcode | null>(null);

  const consultarRepuesto = (codigo: string) => {
    const codLimpio = codigo.trim().toUpperCase();
    if (!codLimpio) return;

    setError(null);
    setMensajeConsumo(null);
    
    
    const encontrado = repuestos.find(r => r.codigo === codLimpio);

    if (encontrado) {
      setRepuesto(encontrado);
    } else {
      setRepuesto(null);
      setError(`El código ${codLimpio} no existe en el sistema.`);
    }
  };
  
  const toggleScanner = async () => {
    if (scannerActivo) {
      // Apagar cámara
      if (html5QrCode && html5QrCode.isScanning) {
        try {
          await html5QrCode.stop();
        } catch (err) {
          console.error("Error al detener el escáner", err);
        }
      }
      setScannerActivo(false);
    } else {
      // Encender cámara
      setScannerActivo(true);
      setError(null);
      setTimeout(async () => {
        try {
          const qrCodeInstance = new Html5Qrcode("reader-container");
          setHtml5QrCode(qrCodeInstance);

          await qrCodeInstance.start(
            { facingMode: "environment" }, // Usa la cámara trasera por defecto
            {
              fps: 10,
              qrbox: { width: 250, height: 250 }
            },
            (decodedText: string) => {
              // Éxito al leer el código QR o de barras
              setCodigoBuscado(decodedText);
              consultarRepuesto(decodedText);
              
              // Apagar el escáner automáticamente tras una lectura exitosa
              qrCodeInstance.stop().then(() => {
                setScannerActivo(false);
              }).catch(() => {});
            },
            () => {
              // Ignora errores de cuadro por cuadro mientras busca
            }
          );
        } catch (err) {
          console.error("No se pudo iniciar la cámara", err);
          setError("No se pudo acceder a la cámara del dispositivo.");
          setScannerActivo(false);
        }
      }, 200);
    }
  };

  const registrarConsumo = () => {
    if (!repuesto) return;
    if (cantidadAConsumir <= 0 || cantidadAConsumir > repuesto.stock_disponible) return;

    if (!maquinaVinculada.trim() || !motivoUso.trim()) return;

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
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', flexWrap: 'wrap', gap: '8px' }}>
        <label
          htmlFor="input-qr"
          style={{ fontSize: '0.85rem', fontWeight: 700, color: tema.textoPrincipal }}
        >
          Código QR simulado:
        </label>
        
          {/* Botón para activar / desactivar la cámara */}
          <button
            onClick={toggleScanner}
            style={{
              background: scannerActivo ? '#dc2626' : '#0d9488',
              color: '#fff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontWeight: 600,
              fontSize: '0.8rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px'
            }}
          >
            {scannerActivo ? '❌ Cerrar Cámara' : '📷 Escanear con Cámara'}
          </button>
        </div>

        {/* Contenedor obligatorio para la visualización del streaming de la cámara */}
        <div 
          id="reader-container" 
          style={{ 
            width: '100%', 
            maxWidth: '360px', 
            margin: scannerActivo ? '12px auto' : '0 auto', 
            display: scannerActivo ? 'block' : 'none',
            borderRadius: '8px',
            overflow: 'hidden'
          }}
        ></div>
        
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
              onClick={() => {
                setCodigoBuscado(cod);
                consultarRepuesto(cod);
              }}
              style={{
                background: esModoOscuro ? '#061b24' : '#f1f5f9',
                color: tema.acento,
                padding: '2px 6px',
                borderRadius: '4px',
                fontSize: '0.78rem',
                border: `1px solid ${tema.borde}`,
                fontFamily: 'monospace',
                cursor: 'pointer'
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
        key={repuesto.codigo}
          repuesto={repuesto}
          tema={tema}
          esModoOscuro={esModoOscuro}
          cantidadAConsumir={cantidadAConsumir}
          mensajeConsumo={mensajeConsumo}
          maquinaVinculada={maquinaVinculada}
          motivoUso={motivoUso}
          onMaquinaChange={setMaquinaVinculada}
          onMotivoChange={setMotivoUso}
          onIncrementar={() => setCantidadAConsumir((c) => Math.min(repuesto.stock_disponible, c + 1))}
          onDecrementar={() => setCantidadAConsumir((c) => Math.max(1, c - 1))}
          onCambioCantidad={setCantidadAConsumir}
          onConfirmarConsumo={registrarConsumo}
        />
      )}
    </>
  );
}