import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import type { LayoutContextType, Incidencia, MovimientoStock } from '../types';

// SUB-COMPONENTE: Tarjeta individual para manejar el estado (inputs) de cada ticket
function IncidenciaCard({ inc, esAuditorMantenimiento, tema }: { inc: Incidencia, esAuditorMantenimiento: boolean, tema: any }) {
  const { actualizarIncidencia, repuestos, actualizarRepuesto, agregarMovimiento, usuarioActual } = useOutletContext<LayoutContextType>();
  
  const [codigoRepuesto, setCodigoRepuesto] = useState('');
  const [cantidadUsar, setCantidadUsar] = useState(1);
  const [errorStock, setErrorStock] = useState<string | null>(null);

  // LOGICA 1: Cambio de estado simple
  const cambiarEstado = (nuevoEstado: 'en_progreso') => {
    actualizarIncidencia({ ...inc, estado: nuevoEstado });
  };

  // LOGICA 2: Consumo integrado de repuestos (CU-01 desde el ticket)
  const vincularRepuesto = () => {
    const codLimpio = codigoRepuesto.trim().toUpperCase();
    if (!codLimpio) return;

    const repuestoFisico = repuestos.find(r => r.codigo === codLimpio);
    
    if (!repuestoFisico) {
      setErrorStock(`El código ${codLimpio} no existe.`);
      return;
    }
    if (repuestoFisico.stock_disponible < cantidadUsar) {
      setErrorStock(`Stock insuficiente. Solo quedan ${repuestoFisico.stock_disponible} u.`);
      return;
    }

    // 1. Descontamos stock global
    actualizarRepuesto({
      ...repuestoFisico,
      stock_disponible: repuestoFisico.stock_disponible - cantidadUsar
    });

    // 2. Generamos auditoría inmutable
    const fechaActual = new Date();
    const horaNum = fechaActual.getHours();
    const turno = (horaNum >= 6 && horaNum < 14) ? 'Mañana' : (horaNum >= 14 && horaNum < 22) ? 'Tarde' : 'Noche';
    
    const nuevoMovimiento: MovimientoStock = {
      id: Date.now(),
      fecha: fechaActual.toLocaleDateString('es-AR'),
      hora: fechaActual.toLocaleTimeString('es-AR', { hour12: false }),
      codigo: repuestoFisico.codigo,
      cantidad: cantidadUsar,
      operario: `${usuarioActual.nombre} (${usuarioActual.legajo})`,
      turno: turno,
      maquinaVinculada: inc.maquina,
      motivoUso: `Reparación Ticket #${inc.id}`
    };
    agregarMovimiento(nuevoMovimiento);

    // 3. Vinculamos al ticket
    actualizarIncidencia({
      ...inc,
      repuestosUtilizados: [...inc.repuestosUtilizados, { codigo: repuestoFisico.codigo, cantidad: cantidadUsar }]
    });

    // Limpiamos
    setCodigoRepuesto('');
    setCantidadUsar(1);
    setErrorStock(null);
  };

  // LOGICA 3: Cierre de ticket y cálculo de tiempos
  const resolverIncidencia = () => {
    const ahoraMs = Date.now();
    const difMs = ahoraMs - inc.timestampCreacion; // Diferencia en milisegundos

    // Matemáticas de conversión de tiempo
    const difMinutos = Math.floor(difMs / 60000);
    const dias = Math.floor(difMinutos / 1440);
    const horas = Math.floor((difMinutos % 1440) / 60);
    const minutos = difMinutos % 60;

    let tiempoStr = '';
    if (dias > 0) tiempoStr += `${dias}d `;
    if (horas > 0 || dias > 0) tiempoStr += `${horas}h `;
    tiempoStr += `${minutos}m`;

    actualizarIncidencia({
      ...inc,
      estado: 'resuelta',
      fechaResolucion: new Date().toLocaleDateString('es-AR'),
      horaResolucion: new Date().toLocaleTimeString('es-AR', { hour12: false }),
      tiempoTotalStr: tiempoStr === '0m' ? '< 1m' : tiempoStr.trim() // Manejo de cierres ultrarrápidos
    });
  };

  const colorEstado = { pendiente: '#fee2e2', en_progreso: '#fef3c7', resuelta: '#dcfce3' };
  const textoEstado = { pendiente: '🔴 Pendiente', en_progreso: '🟡 En Progreso', resuelta: '🟢 Resuelta' };

  return (
    <div style={{ border: `1px solid ${tema.borde}`, borderRadius: '8px', padding: '16px', background: tema.fondoInput }}>
      {/* CABECERA DEL TICKET */}
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', flexWrap: 'wrap', gap: '10px' }}>
        <strong style={{ color: tema.acento, fontSize: '1.1rem' }}>{inc.maquina}</strong>
        <span style={{ background: colorEstado[inc.estado], color: '#1f2937', padding: '4px 12px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 'bold' }}>
          {textoEstado[inc.estado]}
        </span>
      </div>
      
      <p style={{ margin: '0 0 12px 0', color: tema.textoPrincipal }}>{inc.descripcion}</p>
      
      <div style={{ fontSize: '0.85rem', color: tema.textoSecundario, display: 'flex', justifyContent: 'space-between', borderTop: `1px solid ${tema.borde}`, paddingTop: '10px', flexWrap: 'wrap', gap: '10px' }}>
        <span>Reportó: <b>{inc.operario}</b></span>
        <span>Apertura: {inc.fecha} - {inc.hora}</span>
      </div>

      {/* SECCIÓN DE REPUESTOS VINCULADOS (Visible siempre que haya repuestos) */}
      {inc.repuestosUtilizados.length > 0 && (
        <div style={{ marginTop: '16px', padding: '10px', background: tema.fondoTarjeta, borderRadius: '6px', border: `1px dashed ${tema.borde}` }}>
          <strong style={{ fontSize: '0.85rem', color: tema.textoPrincipal }}>Repuestos aplicados en esta reparación:</strong>
          <ul style={{ margin: '6px 0 0 0', paddingLeft: '20px', fontSize: '0.85rem', color: tema.textoSecundario }}>
            {inc.repuestosUtilizados.map((rep, idx) => (
              <li key={idx}><b>{rep.cantidad}x</b> {rep.codigo}</li>
            ))}
          </ul>
        </div>
      )}

      {/* PANEL DE CONTROL TÉCNICO (Solo para mantenimiento en tickets activos) */}
      {esAuditorMantenimiento && inc.estado !== 'resuelta' && (
        <div style={{ marginTop: '20px', borderTop: `2px solid ${tema.borde}`, paddingTop: '16px' }}>
          
          {inc.estado === 'pendiente' ? (
            <button onClick={() => cambiarEstado('en_progreso')} style={{ padding: '8px 16px', background: '#d97706', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
              Tomar Tarea (Pasar a En Progreso)
            </button>
          ) : (
            <>
              {/* Formulario de consumo de repuestos */}
              <div style={{ display: 'flex', gap: '8px', marginBottom: '16px', flexWrap: 'wrap' }}>
                <input 
                  type="text" 
                  placeholder="Cód. Repuesto (ej: FIL-001)" 
                  value={codigoRepuesto} 
                  onChange={e => setCodigoRepuesto(e.target.value)}
                  style={{ flex: 1, padding: '8px', borderRadius: '6px', border: `1px solid ${tema.borde}` }} 
                />
                <input 
                  type="number" 
                  min="1" 
                  value={cantidadUsar} 
                  onChange={e => setCantidadUsar(Number(e.target.value))}
                  style={{ width: '70px', padding: '8px', borderRadius: '6px', border: `1px solid ${tema.borde}` }} 
                />
                <button onClick={vincularRepuesto} style={{ background: tema.botonPrimario, color: 'white', border: 'none', borderRadius: '6px', padding: '0 16px', cursor: 'pointer', fontWeight: 'bold' }}>
                  Añadir Pieza
                </button>
              </div>
              
              {errorStock && <div style={{ color: '#dc2626', fontSize: '0.85rem', marginBottom: '16px', fontWeight: 'bold' }}>⚠️ {errorStock}</div>}

              {/* Botón de cierre */}
              <button onClick={resolverIncidencia} style={{ padding: '10px 16px', background: '#16a34a', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
                Cerrar Ticket como Resuelto
              </button>
            </>
          )}
        </div>
      )}

      {/* METRICAS DE RESOLUCIÓN (Visible al cerrar) */}
      {inc.estado === 'resuelta' && (
        <div style={{ marginTop: '16px', padding: '12px', background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '6px', color: '#166534', fontSize: '0.9rem' }}>
          <strong>✅ Reparación Finalizada</strong>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', flexWrap: 'wrap' }}>
            <span>Cierre: {inc.fechaResolucion} - {inc.horaResolucion}</span>
            <span>⏱️ Tiempo de resolución: <b>{inc.tiempoTotalStr}</b></span>
          </div>
        </div>
      )}
    </div>
  );
}

// COMPONENTE PRINCIPAL (La Página)
export function AuditoriaIncidenciasPage() {
  const { tema, incidencias, usuarioActual } = useOutletContext<LayoutContextType>();

  const esAuditorMantenimiento = usuarioActual.area === 'mantenimiento' || usuarioActual.area === 'direccion';
  const incidenciasVisibles = esAuditorMantenimiento ? incidencias : incidencias.filter(inc => inc.operario.includes(usuarioActual.nombre));

  return (
    <section style={{ background: tema.fondoTarjeta, padding: '24px', borderRadius: '12px', border: `1px solid ${tema.borde}` }}>
      <h2 style={{ color: tema.textoPrincipal, marginTop: 0 }}>📋 Consola de Mantenimiento</h2>
      <p style={{ color: tema.textoSecundario, marginBottom: '20px' }}>
        {esAuditorMantenimiento ? 'Gestión técnica y asignación de repuestos a tickets activos.' : 'Seguimiento de sus reportes personales.'}
      </p>

      {incidenciasVisibles.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '40px', background: tema.fondoInput, borderRadius: '8px', color: tema.textoSecundario }}>
          No hay tickets de falla registrados en el sistema.
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {incidenciasVisibles.map((inc) => (
            <IncidenciaCard key={inc.id} inc={inc} esAuditorMantenimiento={esAuditorMantenimiento} tema={tema} />
          ))}
        </div>
      )}
    </section>
  );
}