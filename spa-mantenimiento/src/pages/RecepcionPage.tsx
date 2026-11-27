import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { type LayoutContextType, type ItemOrden, type OrdenCompra } from '../types';

interface NuevoRepuestoPendiente {
  codigo: string;
  cantidadIngresada: number;
}

interface DatosNuevoRepuesto {
  nombre: string;
  ubicacion: string;
}

export function RecepcionPage() {
  const { 
    tema, 
    ordenesCompra, 
    actualizarOrdenCompra, 
    usuarioActual, 
    agregarMovimiento, 
    repuestos, 
    actualizarRepuesto 
  } = useOutletContext<LayoutContextType>();
  
  const [ocSeleccionadaId, setOcSeleccionadaId] = useState('');
  const [cantidadARecibir, setCantidadARecibir] = useState<Record<string, number>>({});
  const [observacionRecepcion, setObservacionRecepcion] = useState('');

  // Estados para el modal de alta de repuesto inexistente
  const [colaNuevos, setColaNuevos] = useState<NuevoRepuestoPendiente[]>([]);
  const [datosAltaMap, setDatosAltaMap] = useState<Record<string, DatosNuevoRepuesto>>({});
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [ubicacionNueva, setUbicacionNueva] = useState('');
  const [errorModal, setErrorModal] = useState('');

  const [mostrarModalAnular, setMostrarModalAnular] = useState(false);
  const [observacionAnulacion, setObservacionAnulacion] = useState('');

    // Control de acceso y visibilidad por rol y área (RBAC)
  const rolNorm = (usuarioActual.rol || '').toLowerCase();
  const puedeVerTodasLasOC =
    rolNorm === 'encargado' ||
    rolNorm === 'supervisor';

  const tienePermisoRecepcion =
    usuarioActual.area === 'deposito' || puedeVerTodasLasOC;

  if (!tienePermisoRecepcion) {
    return (
      <div
        style={{
          maxWidth: '600px',
          margin: '40px auto',
          padding: '24px',
          background: tema.fondoTarjeta,
          border: '2px solid #ef4444',
          borderRadius: '12px',
          textAlign: 'center',
          color: tema.textoPrincipal
        }}
      >
        <h2 style={{ color: '#dc2626', marginTop: 0 }}>🚫 Acceso Restringido</h2>
        <p style={{ color: tema.textoSecundario, marginBottom: 0 }}>
          El módulo de <strong>Recepción de Materiales</strong> está habilitado únicamente para personal de <strong>Depósito</strong>, <strong>Encargados</strong> y <strong>Supervisión</strong>.
        </p>
      </div>
    );
  }

  const ocActiva = ordenesCompra.find(oc => oc.id === ocSeleccionadaId);
  const nuevoActual = colaNuevos[0] || null;

  const ejecutarConfirmacionFinal = (datosConfirmados: Record<string, DatosNuevoRepuesto>) => {
    if (!ocActiva) return;

    const fechaRecepcionObj = new Date();
    const ocActualizada = { ...ocActiva };
    let todasCompletas = true;

    ocActualizada.items = ocActualizada.items.map(item => {
      const cantidadIngresada = cantidadARecibir[item.codigoRepuesto] || 0;
      const nuevaCantidad = item.cantidadYaRecibida + cantidadIngresada;

      if (nuevaCantidad < item.cantidadPedida) {
        todasCompletas = false; 
      }

      if (cantidadIngresada > 0) {
        const horaNum = fechaRecepcionObj.getHours();
        const turnoActual = (horaNum >= 6 && horaNum < 14) ? 'Mañana' 
                          : (horaNum >= 14 && horaNum < 22) ? 'Tarde' 
                          : 'Noche';

        const codigoNorm = item.codigoRepuesto.trim().toUpperCase();

        // 1. Generamos el remito de auditoría
        agregarMovimiento({
          id: Date.now() + Math.floor(Math.random() * 1000),
          fecha: fechaRecepcionObj.toLocaleDateString('es-AR'),
          hora: fechaRecepcionObj.toLocaleTimeString('es-AR', { hour12: false }),
          codigo: codigoNorm,  
          cantidad: cantidadIngresada,
          operario: usuarioActual.nombre, 
          turno: turnoActual,
          motivoUso: `Ingreso a depósito por ${ocActiva.numeroOC}`, 
          maquinaVinculada: 'N/A', 
        });

        // 2. Actualizamos stock o damos de alta con descripción y ubicación cargadas
        const repuestoEnSistema = repuestos.find(
          (r) => r.codigo.trim().toUpperCase() === codigoNorm
        );

        if (repuestoEnSistema) {
          actualizarRepuesto({
            ...repuestoEnSistema,
            stock_disponible: repuestoEnSistema.stock_disponible + cantidadIngresada,
          });
        } else {
          const datosModal = datosConfirmados[codigoNorm];
          actualizarRepuesto({
            codigo: codigoNorm,
            nombre: datosModal?.nombre || `Repuesto ${codigoNorm}`,
            stock_disponible: cantidadIngresada,
            ubicacion: datosModal?.ubicacion || 'Depósito Central',
          });
        }
      }

      return {
        ...item,
        cantidadYaRecibida: nuevaCantidad
      };
    });

    ocActualizada.estado = todasCompletas ? 'completada' : 'parcial';
    ocActualizada.fechaRecepcion = fechaRecepcionObj.toLocaleDateString('es-AR');
    ocActualizada.horaRecepcion = fechaRecepcionObj.toLocaleTimeString('es-AR', { hour12: false });
    ocActualizada.recibidoPor = `${usuarioActual.nombre} (${usuarioActual.rol})`;

    if (observacionRecepcion.trim()) {
      ocActualizada.observacion = observacionRecepcion.trim();
    }

    actualizarOrdenCompra(ocActualizada);
    setCantidadARecibir({});
    setObservacionRecepcion('');
    setColaNuevos([]);
    setDatosAltaMap({});
    
    if (todasCompletas) {
      setOcSeleccionadaId(''); 
      alert('¡Excelente! La orden fue recibida por completo y cerrada.');
    } else {
      alert('Recepción parcial guardada con éxito. Podrás completar el remanente cuando llegue el resto del pedido.');
    }
  };

  const handleConfirmarRecepcion = () => {
    if (!ocActiva) return;

    // Detectar qué ítems con cantidad > 0 NO existen todavía en el inventario
    const faltantes: NuevoRepuestoPendiente[] = [];
    for (const item of ocActiva.items) {
      const cantidadIngresada = cantidadARecibir[item.codigoRepuesto] || 0;
      if (cantidadIngresada > 0) {
        const codigoNorm = item.codigoRepuesto.trim().toUpperCase();
        const existe = repuestos.some(
          (r) => r.codigo.trim().toUpperCase() === codigoNorm
        );
        if (!existe && !faltantes.some((f) => f.codigo === codigoNorm)) {
          faltantes.push({ codigo: codigoNorm, cantidadIngresada });
        }
      }
    }

    if (faltantes.length > 0) {
      setDatosAltaMap({});
      setColaNuevos(faltantes);
      setNombreNuevo('');
      setUbicacionNueva('');
      setErrorModal('');
      return;
    }

    ejecutarConfirmacionFinal({});
  };

  const handleConfirmarNuevoEnModal = () => {
    if (!nuevoActual) return;

    if (!nombreNuevo.trim() || !ubicacionNueva.trim()) {
      setErrorModal('Completá tanto la descripción técnica como la ubicación en depósito.');
      return;
    }

    const actualizado = {
      ...datosAltaMap,
      [nuevoActual.codigo]: {
        nombre: nombreNuevo.trim(),
        ubicacion: ubicacionNueva.trim(),
      },
    };

    const restantes = colaNuevos.slice(1);
    if (restantes.length > 0) {
      setDatosAltaMap(actualizado);
      setColaNuevos(restantes);
      setNombreNuevo('');
      setUbicacionNueva('');
      setErrorModal('');
    } else {
      ejecutarConfirmacionFinal(actualizado);
    }
  };

  const handleCancelarCargaModal = () => {
    // Cancela toda la operación sin guardar nada ni modificar la OC
    setColaNuevos([]);
    setDatosAltaMap({});
    setNombreNuevo('');
    setUbicacionNueva('');
    setErrorModal('');
  };

  
  const handleConfirmarAnulacionOC = () => {
    if (!ocActiva) return;
    const obsLimpia = observacionAnulacion.trim() || 'Orden anulada por error de tipeo';
    const ahora = new Date();

    const ocAnulada: OrdenCompra = {
      ...ocActiva,
      estado: 'anulada',
      observacion: obsLimpia,
      recibidoPor: `${usuarioActual.nombre} (${usuarioActual.rol})`,
      fechaRecepcion: ahora.toLocaleDateString('es-AR'),
      horaRecepcion: ahora.toLocaleTimeString('es-AR', { hour12: false }),
    };

    actualizarOrdenCompra(ocAnulada);
    setMostrarModalAnular(false);
    setObservacionAnulacion('');
    setObservacionRecepcion('');
    setCantidadARecibir({});
    setOcSeleccionadaId('');
  };

  const getBadgeEstado = (estado: OrdenCompra['estado']) => {
    switch (estado) {
      case 'completada':
        return { bg: '#dcfce7', color: '#15803d', label: '✓ Completada' };
      case 'parcial':
        return { bg: '#fef3c7', color: '#b45309', label: '◐ Recepción Parcial' };
      case 'anulada':
        return { bg: '#fee2e2', color: '#b91c1c', label: '✕ Anulada' };
      default:
        return { bg: '#e0f2fe', color: '#0369a1', label: '⏳ Pendiente' };
    }
  };
  
  const ordenesVisibles = puedeVerTodasLasOC
    ? ordenesCompra
    : ordenesCompra.filter(
        (oc) =>
          oc.recibidoPor &&
          oc.recibidoPor.toLowerCase().includes(usuarioActual.nombre.toLowerCase())
      );

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      <section>
        <h2 style={{ margin: '0 0 16px 0', color: tema.textoPrincipal }}>📦 Recepción de Repuestos (Depósito)</h2>
        
        {usuarioActual.area !== 'deposito' && (
          <p style={{ color: '#d97706', background: '#fef3c7', padding: '10px', borderRadius: '6px', fontSize: '0.9rem' }}>
            ⚠️ Atención: Tu usuario ({usuarioActual.nombre}) no pertenece a depósito.
          </p>
        )}

        <select 
          value={ocSeleccionadaId} 
          onChange={e => {
            setOcSeleccionadaId(e.target.value);
            setCantidadARecibir({});
            const ocElegida = ordenesCompra.find(o => o.id === e.target.value);
            setObservacionRecepcion(ocElegida?.observacion || '');
          }}
          style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '20px', background: tema.fondoTarjeta, color: tema.textoPrincipal, border: `1px solid ${tema.borde}` }}
        >
          <option value="">Seleccione una Orden de Compra pendiente...</option>
          {ordenesCompra
            .filter(oc => oc.estado !== 'completada' && oc.estado !== 'anulada')
            .map(oc => (
              <option key={oc.id} value={oc.id}>
                {oc.numeroOC} - {oc.proveedor} ({oc.estado})
              </option>
            ))}
        </select>

        {ocActiva && (
          <div style={{ background: tema.fondoTarjeta, padding: '20px', borderRadius: '8px', border: `1px solid ${tema.borde}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
              <div>
                <h3 style={{ margin: 0, color: tema.textoPrincipal }}>Detalle de {ocActiva.numeroOC}</h3>
                <span style={{ fontSize: '0.8rem', color: tema.textoSecundario }}>
                  Emitida por: <strong>{ocActiva.creadoPor || 'No registrado'}</strong> • {ocActiva.fechaEmision} {ocActiva.horaEmision || ''}
                </span>
              </div>

              {ocActiva.estado === 'pendiente' && (
                <button
                  type="button"
                  onClick={() => {
                    setObservacionAnulacion('');
                    setMostrarModalAnular(true);
                  }}
                  style={{
                    padding: '6px 12px',
                    background: 'transparent',
                    color: '#dc2626',
                    border: '1px solid #dc2626',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 'bold'
                  }}
                >
                  🚫 Anular OC
                </button>
              )}
            </div>
            
            {ocActiva.items.map((item: ItemOrden, index: number) => {
              const pendiente = item.cantidadPedida - item.cantidadYaRecibida;
              const existeEnCatalogo = repuestos.some(
                (r) => r.codigo.trim().toUpperCase() === item.codigoRepuesto.trim().toUpperCase()
              );

              return (
                <div key={index} style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: `1px solid ${tema.borde}` }}>
                  <div style={{ width: '115px', display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 'bold', color: tema.acento }}>{item.codigoRepuesto}</span>
                    {!existeEnCatalogo && (
                      <span style={{ fontSize: '0.72rem', color: '#d97706', fontWeight: 'bold' }}>
                        • Código nuevo
                      </span>
                    )}
                  </div>
                  <span style={{ color: tema.textoSecundario, flex: 1 }}>
                    Pedida: <strong>{item.cantidadPedida}</strong> | Recibida: <strong>{item.cantidadYaRecibida}</strong>{' '}
                    {pendiente > 0 && <span style={{ color: '#d97706' }}>(Faltan {pendiente})</span>}
                  </span>
                  
                  {pendiente > 0 ? (
                    <input 
                      type="number"
                      min="0"
                      max={pendiente}
                      placeholder={`Máx ${pendiente}`}
                      value={cantidadARecibir[item.codigoRepuesto] || ''}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        if (val > pendiente) {
                          alert(`¡Cuidado! No podés recibir más de ${pendiente} unidades.`);
                          return;
                        }
                        setCantidadARecibir({...cantidadARecibir, [item.codigoRepuesto]: val});
                      }}
                      style={{ padding: '8px', width: '90px', borderRadius: '4px', border: `1px solid ${tema.borde}`, background: tema.fondoPagina, color: tema.textoPrincipal }}
                    />
                  ) : (
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Completo</span>
                  )}
                </div>
              );
            })}

            {/* Campo general de observación */}
            <div style={{ marginTop: '14px' }}>
              <label style={{ display: 'block', fontSize: '0.85rem', color: tema.textoSecundario, marginBottom: '6px', fontWeight: 600 }}>
                Observación (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej: Entrega parcial por faltante de proveedor / Remito N° 4521..."
                value={observacionRecepcion}
                onChange={(e) => setObservacionRecepcion(e.target.value)}
                style={{
                  width: '100%',
                  boxSizing: 'border-box',
                  padding: '9px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${tema.borde}`,
                  background: tema.fondoPagina,
                  color: tema.textoPrincipal,
                  fontSize: '0.88rem'
                }}
              />
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={handleConfirmarRecepcion}
                disabled={Object.values(cantidadARecibir).every((v) => !v || v <= 0)}
                style={{ 
                  padding: '10px 20px', 
                  background: '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  opacity: Object.values(cantidadARecibir).every((v) => !v || v <= 0) ? 0.5 : 1
                }}
              >
                Confirmar Ingreso a Depósito
              </button>
            </div>
          </div>
        )}
      </section>


      {/* ── SECCIÓN 2: HISTORIAL COMPLETO DE ÓRDENES DE COMPRA ── */}
      <section style={{ borderTop: `2px solid ${tema.borde}`, paddingTop: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h3 style={{ margin: 0, color: tema.textoPrincipal }}>
            📋 {puedeVerTodasLasOC ? 'Historial Completo de Órdenes de Compra' : 'Mis Órdenes de Compra Recibidas'} ({ordenesVisibles.length})
          </h3>
        </div>

        {ordenesVisibles.length === 0 ? (
          <p style={{ color: tema.textoSecundario, fontSize: '0.9rem', fontStyle: 'italic' }}>
            {puedeVerTodasLasOC
              ? 'Todavía no se emitieron Órdenes de Compra en el sistema.'
              : 'Todavía no registraste ninguna recepción de Orden de Compra.'}
          </p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {[...ordenesVisibles].reverse().map((oc) => {
              const badge = getBadgeEstado(oc.estado);
              return (
                <div
                  key={oc.id}
                  style={{
                    background: tema.fondoPagina,
                    border: `1px solid ${tema.borde}`,
                    borderRadius: '10px',
                    padding: '14px 16px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '10px'
                  }}
                >
                  {/* Cabecera de la OC */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <strong style={{ color: tema.acento, fontSize: '1rem' }}>{oc.numeroOC}</strong>{' '}
                      <span style={{ color: tema.textoSecundario, fontSize: '0.85rem' }}>— {oc.proveedor}</span>
                    </div>

                    <span
                      style={{
                        background: badge.bg,
                        color: badge.color,
                        fontWeight: 700,
                        fontSize: '0.78rem',
                        padding: '4px 10px',
                        borderRadius: '999px'
                      }}
                    >
                      {badge.label}
                    </span>
                  </div>

                  {/* Trazabilidad de quién y cuándo */}
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '8px', fontSize: '0.82rem', color: tema.textoSecundario }}>
                    <div>
                      <strong>📤 Pedido realizado por:</strong> {oc.creadoPor || 'No registrado'}
                      <br />
                      <strong>🕒 Fecha y hora pedido:</strong> {oc.fechaEmision} {oc.horaEmision ? `a las ${oc.horaEmision}` : ''}
                    </div>

                    <div>
                      <strong>{oc.estado === 'anulada' ? '🚫 Anulada por:' : '📥 Recepcionado por:'}</strong>{' '}
                      {oc.recibidoPor || 'Pendiente'}
                      <br />
                      <strong>{oc.estado === 'anulada' ? '🕒 Fecha y hora anulación:' : '🕒 Fecha y hora recepción:'}</strong>{' '}
                      {oc.fechaRecepcion
                        ? `${oc.fechaRecepcion} ${oc.horaRecepcion ? `a las ${oc.horaRecepcion}` : ''}`
                        : '—'}
                    </div>
                  </div>

                  {/* Observación general (si existe) */}
                  {oc.observacion && (
                    <div
                      style={{
                        fontSize: '0.82rem',
                        color: tema.textoPrincipal,
                        background: tema.fondoTarjeta,
                        borderLeft: `3px solid ${oc.estado === 'anulada' ? '#dc2626' : tema.acento}`,
                        padding: '6px 10px',
                        borderRadius: '4px'
                      }}
                    >
                      <strong>📝 Observación:</strong> {oc.observacion}
                    </div>
                  )}

                  {/* Ítems incluidos en la OC */}
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', paddingTop: '6px', borderTop: `1px dashed ${tema.borde}` }}>
                    {oc.items.map((it, i) => (
                      <span
                        key={i}
                        style={{
                          fontSize: '0.78rem',
                          background: tema.fondoTarjeta,
                          border: `1px solid ${tema.borde}`,
                          borderRadius: '6px',
                          padding: '4px 8px',
                          color: tema.textoPrincipal
                        }}
                      >
                        <strong>{it.codigoRepuesto}</strong>: {it.cantidadYaRecibida}/{it.cantidadPedida} u.
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* MODAL PARA ANULAR OC */}
      {mostrarModalAnular && ocActiva && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: tema.fondoTarjeta,
              color: tema.textoPrincipal,
              border: `1px solid ${tema.borde}`,
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '440px',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <h3 style={{ margin: 0, color: '#dc2626' }}>🚫 Anular {ocActiva.numeroOC}</h3>
            <p style={{ margin: 0, fontSize: '0.88rem', color: tema.textoSecundario }}>
              La orden pasará a estado <strong>Anulada</strong> en el historial sin modificar el inventario. Podés dejar una observación:
            </p>
            <input
              type="text"
              placeholder="Ej: Error de tipeo en código de repuesto..."
              value={observacionAnulacion}
              onChange={(e) => setObservacionAnulacion(e.target.value)}
              style={{
                padding: '10px',
                borderRadius: '6px',
                border: `1px solid ${tema.borde}`,
                background: tema.fondoPagina,
                color: tema.textoPrincipal,
              }}
            />
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px' }}>
              <button
                type="button"
                onClick={() => setMostrarModalAnular(false)}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: `1px solid ${tema.borde}`,
                  background: 'transparent',
                  color: tema.textoPrincipal,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Volver
              </button>
              <button
                type="button"
                onClick={handleConfirmarAnulacionOC}
                style={{
                  padding: '8px 14px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#dc2626',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Confirmar Anulación
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PARA REPUESTO NUEVO NO REGISTRADO */}
      {nuevoActual && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: '16px',
          }}
        >
          <div
            style={{
              background: tema.fondoTarjeta,
              color: tema.textoPrincipal,
              border: `1px solid ${tema.borde}`,
              borderRadius: '12px',
              padding: '24px',
              width: '100%',
              maxWidth: '460px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.35)',
              display: 'flex',
              flexDirection: 'column',
              gap: '14px',
            }}
          >
            <h3 style={{ margin: 0, color: tema.acento }}>
              🆕 Repuesto no registrado: {nuevoActual.codigo}
            </h3>
            <p style={{ margin: 0, fontSize: '0.9rem', color: tema.textoSecundario }}>
              El código <strong>{nuevoActual.codigo}</strong> (ingreso de{' '}
              <strong>{nuevoActual.cantidadIngresada}</strong> u.) no existe en el inventario.
              Completá sus datos técnicos para darlo de alta o cancelá si hubo un error de tipeo.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                Descripción técnica *
              </label>
              <input
                type="text"
                placeholder="Ej: Rodamiento rígido de bolas 6205-2RS"
                value={nombreNuevo}
                onChange={(e) => {
                  setNombreNuevo(e.target.value);
                  setErrorModal('');
                }}
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: `1px solid ${tema.borde}`,
                  background: tema.fondoPagina,
                  color: tema.textoPrincipal,
                }}
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 'bold' }}>
                Ubicación en depósito *
              </label>
              <input
                type="text"
                placeholder="Ej: Estantería B - Nivel 2"
                value={ubicacionNueva}
                onChange={(e) => {
                  setUbicacionNueva(e.target.value);
                  setErrorModal('');
                }}
                style={{
                  padding: '10px',
                  borderRadius: '6px',
                  border: `1px solid ${tema.borde}`,
                  background: tema.fondoPagina,
                  color: tema.textoPrincipal,
                }}
              />
            </div>

            {errorModal && (
              <p style={{ margin: 0, color: '#dc2626', fontSize: '0.85rem', fontWeight: 'bold' }}>
                ⚠️ {errorModal}
              </p>
            )}

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '8px' }}>
              <button
                type="button"
                onClick={handleCancelarCargaModal}
                style={{
                  padding: '9px 14px',
                  borderRadius: '6px',
                  border: `1px solid ${tema.borde}`,
                  background: 'transparent',
                  color: tema.textoPrincipal,
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                Cancelar carga
              </button>
              <button
                type="button"
                onClick={handleConfirmarNuevoEnModal}
                style={{
                  padding: '9px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#28a745',
                  color: '#fff',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                }}
              >
                {colaNuevos.length > 1 ? 'Guardar y siguiente' : 'Dar de alta y confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}