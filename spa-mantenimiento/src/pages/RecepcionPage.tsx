import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { type LayoutContextType, type ItemOrden } from '../types';

export function RecepcionPage() {
  // Sumamos repuestos y actualizarRepuesto al contexto
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

  const ocActiva = ordenesCompra.find(oc => oc.id === ocSeleccionadaId);

  const handleConfirmarRecepcion = () => {
    if (!ocActiva) return;

    const ocActualizada = { ...ocActiva };
    let todasCompletas = true;

    ocActualizada.items = ocActualizada.items.map(item => {
      const cantidadIngresada = cantidadARecibir[item.codigoRepuesto] || 0;
      const nuevaCantidad = item.cantidadYaRecibida + cantidadIngresada;

      if (nuevaCantidad < item.cantidadPedida) {
        todasCompletas = false; 
      }

      // 👇 LÓGICA DE INVENTARIO 👇
      if (cantidadIngresada > 0) {
        const fechaActual = new Date();
        const horaNum = fechaActual.getHours();
        const turnoActual = (horaNum >= 6 && horaNum < 14) ? 'Mañana' 
                          : (horaNum >= 14 && horaNum < 22) ? 'Tarde' 
                          : 'Noche';

        // 1. Generamos el remito de auditoría
        agregarMovimiento({
          id: Date.now() + Math.floor(Math.random() * 1000),
          fecha: fechaActual.toLocaleDateString('es-AR'),
          hora: fechaActual.toLocaleTimeString('es-AR', { hour12: false }),
          codigo: item.codigoRepuesto,  
          cantidad: cantidadIngresada,
          operario: usuarioActual.nombre, 
          turno: turnoActual,
          motivoUso: `Ingreso a depósito por ${ocActiva.numeroOC}`, 
          maquinaVinculada: 'N/A', 
        });

       // 2. Actualizamos el stock físico del repuesto
        const repuestoEnSistema = repuestos.find(r => r.codigo === item.codigoRepuesto);
        if (repuestoEnSistema) {
          actualizarRepuesto({
            ...repuestoEnSistema,
            // 👇 Esto tiene que decir stock_disponible de ambos lados
            stock_disponible: repuestoEnSistema.stock_disponible + cantidadIngresada
          });
        }
      }
      // 👆 FIN LÓGICA DE INVENTARIO 👆

      return {
        ...item,
        cantidadYaRecibida: nuevaCantidad
      };
    });

    ocActualizada.estado = todasCompletas ? 'completada' : 'parcial';
    actualizarOrdenCompra(ocActualizada);
    setCantidadARecibir({});
    
    if (todasCompletas) {
      setOcSeleccionadaId(''); 
      alert('¡Excelente! La orden fue recibida por completo y cerrada.');
    } else {
      alert('Recepción parcial guardada con éxito.');
    }
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
              return (
                <div key={index} style={{ display: 'flex', gap: '15px', alignItems: 'center', marginBottom: '15px', paddingBottom: '10px', borderBottom: `1px solid ${tema.borde}` }}>
                  <span style={{ fontWeight: 'bold', color: tema.acento, width: '80px' }}>{item.codigoRepuesto}</span>
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
                disabled={Object.keys(cantidadARecibir).length === 0}
                style={{ 
                  padding: '10px 20px', 
                  background: '#28a745', 
                  color: 'white', 
                  border: 'none', 
                  borderRadius: '6px', 
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  opacity: Object.keys(cantidadARecibir).length === 0 ? 0.5 : 1
                }}
              >
                Confirmar Ingreso a Depósito
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}