import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { type LayoutContextType, type ItemOrden } from '../types';

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

  // Estados para el modal de alta de repuesto inexistente
  const [colaNuevos, setColaNuevos] = useState<NuevoRepuestoPendiente[]>([]);
  const [datosAltaMap, setDatosAltaMap] = useState<Record<string, DatosNuevoRepuesto>>({});
  const [nombreNuevo, setNombreNuevo] = useState('');
  const [ubicacionNueva, setUbicacionNueva] = useState('');
  const [errorModal, setErrorModal] = useState('');

  const ocActiva = ordenesCompra.find(oc => oc.id === ocSeleccionadaId);
  const nuevoActual = colaNuevos[0] || null;

  const ejecutarConfirmacionFinal = (datosConfirmados: Record<string, DatosNuevoRepuesto>) => {
    if (!ocActiva) return;

    const ocActualizada = { ...ocActiva };
    let todasCompletas = true;

    ocActualizada.items = ocActualizada.items.map(item => {
      const cantidadIngresada = cantidadARecibir[item.codigoRepuesto] || 0;
      const nuevaCantidad = item.cantidadYaRecibida + cantidadIngresada;

      if (nuevaCantidad < item.cantidadPedida) {
        todasCompletas = false; 
      }

      if (cantidadIngresada > 0) {
        const fechaActual = new Date();
        const horaNum = fechaActual.getHours();
        const turnoActual = (horaNum >= 6 && horaNum < 14) ? 'Mañana' 
                          : (horaNum >= 14 && horaNum < 22) ? 'Tarde' 
                          : 'Noche';

        const codigoNorm = item.codigoRepuesto.trim().toUpperCase();

        // 1. Generamos el remito de auditoría
        agregarMovimiento({
          id: Date.now() + Math.floor(Math.random() * 1000),
          fecha: fechaActual.toLocaleDateString('es-AR'),
          hora: fechaActual.toLocaleTimeString('es-AR', { hour12: false }),
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
    actualizarOrdenCompra(ocActualizada);
    setCantidadARecibir({});
    setColaNuevos([]);
    setDatosAltaMap({});
    
    if (todasCompletas) {
      setOcSeleccionadaId(''); 
      alert('¡Excelente! La orden fue recibida por completo y cerrada.');
    } else {
      alert('Recepción parcial guardada con éxito.');
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
          onChange={e => setOcSeleccionadaId(e.target.value)}
          style={{ width: '100%', padding: '10px', borderRadius: '6px', marginBottom: '20px', background: tema.fondoTarjeta, color: tema.textoPrincipal, border: `1px solid ${tema.borde}` }}
        >
          <option value="">Seleccione una Orden de Compra pendiente...</option>
          {ordenesCompra.filter(oc => oc.estado !== 'completada').map(oc => (
            <option key={oc.id} value={oc.id}>{oc.numeroOC} - {oc.proveedor} ({oc.estado})</option>
          ))}
        </select>

        {ocActiva && (
          <div style={{ background: tema.fondoTarjeta, padding: '20px', borderRadius: '8px', border: `1px solid ${tema.borde}` }}>
            <h3 style={{ marginTop: 0, color: tema.textoPrincipal }}>Detalle de {ocActiva.numeroOC}</h3>
            
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
                  <span style={{ color: tema.textoSecundario, flex: 1 }}>Pedida: {item.cantidadPedida} | Recibida: {item.cantidadYaRecibida}</span>
                  
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
                      style={{ padding: '8px', width: '90px', borderRadius: '4px', border: `1px solid ${tema.borde}` }}
                    />
                  ) : (
                    <span style={{ color: '#28a745', fontWeight: 'bold' }}>✓ Completo</span>
                  )}
                </div>
              )
            })}

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