import { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { fetchMaquinas } from '../data';
import type { LayoutContextType, Incidencia, Maquina } from '../types';


export function NuevaIncidenciaPage() {
  const { tema, agregarIncidencia, usuarioActual } = useOutletContext<LayoutContextType>();
  
  const [maquina, setMaquina] = useState('');
  const [descripcion, setDescripcion] = useState('');
  const [maquinas, setMaquinas] = useState<Maquina[]>([]);
  const [cargandoMaquinas, setCargandoMaquinas] = useState(true);
  const [errorMaquinas, setErrorMaquinas] = useState('');

  useEffect(() => {
    let activa = true;
    fetchMaquinas()
      .then((lista) => { if (activa) { setMaquinas(lista); setErrorMaquinas(''); } })
      .catch((error: unknown) => {
        if (activa) setErrorMaquinas(error instanceof Error ? error.message : 'No se pudieron cargar las máquinas.');
      })
      .finally(() => { if (activa) setCargandoMaquinas(false); });
    return () => { activa = false; };
  }, []);

  const etiquetaMaquina = (m: Maquina) => `${m.codigo} (${m.nombre})`;

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
            disabled={cargandoMaquinas || Boolean(errorMaquinas) || maquinas.length === 0}
          >
            <option value="">Seleccione una máquina...</option>
            {maquinas.map(m => { const etiqueta = etiquetaMaquina(m); return <option key={m.codigo} value={etiqueta}>{etiqueta}</option>; })}
          </select>
          {cargandoMaquinas && <p role="status" style={{ color: tema.textoSecundario, margin: '6px 0 0' }}>Cargando máquinas…</p>}
          {errorMaquinas && <p role="alert" style={{ color: '#dc2626', margin: '6px 0 0' }}>{errorMaquinas}</p>}
          {!cargandoMaquinas && !errorMaquinas && maquinas.length === 0 && <p style={{ color: tema.textoSecundario, margin: '6px 0 0' }}>Todavía no hay máquinas registradas.</p>}
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