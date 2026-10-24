import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContextType, Incidencia } from '../types';

// Simulamos algunas máquinas de la planta
const MAQUINAS_PLANTA = ['CAL-01 (Caldera)', 'MIX-03 (Mezcladora)', 'FIL-02 (Filtro Principal)', 'CINTA-01 (Cinta Transportadora)'];

export function NuevaIncidenciaPage() {
  const { tema, agregarIncidencia, usuarioActual } = useOutletContext<LayoutContextType>();
  
  const [maquina, setMaquina] = useState('');
  const [descripcion, setDescripcion] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!maquina || !descripcion) return;

    const fechaActual = new Date();
    
    const nuevaIncidencia: Incidencia = {
      id: Date.now(),
      // 👇 Estos son los dos campos nuevos necesarios para el Panel Técnico 👇
      timestampCreacion: Date.now(),
      repuestosUtilizados: [],
      // 👆 --------------------------------------------------------------- 👆
      fecha: fechaActual.toLocaleDateString('es-AR'),
      hora: fechaActual.toLocaleTimeString('es-AR', { hour12: false }),
      maquina,
      descripcion,
      operario: `${usuarioActual.nombre} (${usuarioActual.legajo})`,
      estado: 'pendiente'
    };

    agregarIncidencia(nuevaIncidencia);
    alert('✅ Incidencia reportada exitosamente. Se ha notificado a Mantenimiento.');
    
    setMaquina('');
    setDescripcion('');
  };

  return (
    <section style={{ maxWidth: '600px', margin: '0 auto', background: tema.fondoTarjeta, padding: '24px', borderRadius: '12px', border: `1px solid ${tema.borde}` }}>
      <h2 style={{ color: tema.textoPrincipal, marginTop: 0 }}>🚨 Reportar Incidencia (Fallo de Máquina)</h2>
      <p style={{ color: tema.textoSecundario, fontSize: '0.9rem', marginBottom: '20px' }}>
        Complete los datos. La fecha, hora y su usuario se registrarán automáticamente.
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: tema.textoPrincipal }}>Máquina Afectada:</label>
          <select 
            value={maquina} 
            onChange={e => setMaquina(e.target.value)}
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${tema.borde}`, background: tema.fondoInput, color: tema.textoPrincipal }}
            required
          >
            <option value="">Seleccione una máquina...</option>
            {MAQUINAS_PLANTA.map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '8px', fontWeight: 'bold', color: tema.textoPrincipal }}>Descripción del Problema:</label>
          <textarea 
            value={descripcion} 
            onChange={e => setDescripcion(e.target.value)}
            rows={4}
            placeholder="Ej: El motor hace ruido metálico y recalienta..."
            style={{ width: '100%', padding: '10px', borderRadius: '8px', border: `1px solid ${tema.borde}`, background: tema.fondoInput, color: tema.textoPrincipal, resize: 'vertical' }}
            required
          />
        </div>

        <button 
          type="submit" 
          style={{ background: '#dc2626', color: 'white', padding: '12px', borderRadius: '8px', border: 'none', fontWeight: 'bold', cursor: 'pointer', marginTop: '10px' }}
        >
          Confirmar y Enviar a Mantenimiento
        </button>
      </form>
    </section>
  );
}