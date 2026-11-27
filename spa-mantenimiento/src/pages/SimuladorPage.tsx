import { useState } from 'react';
import { useLocation, useOutletContext } from 'react-router-dom';
import { type LayoutContextType, type OrdenCompra, type ItemOrden } from '../types';

export function SimuladorPage() {
  const { tema, agregarOrdenCompra, usuarioActual } = useOutletContext<LayoutContextType>();
  const location = useLocation();
  const itemsIniciales: ItemOrden[] = location.state?.itemsPreseleccionados || [];

  const [nuevoRepuesto, setNuevoRepuesto] = useState('');
  const [nuevaCantidad, setNuevaCantidad] = useState('');
  const [itemsTemporales, setItemsTemporales] = useState<ItemOrden[]>(itemsIniciales);

  // Función 1: Agrega
  const handleAgregarItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoRepuesto || !nuevaCantidad) return;

    const codigoNormalizado = nuevoRepuesto.trim().toUpperCase();
    const cantidadNum = Number(nuevaCantidad);

    setItemsTemporales((prev) => {
      const existente = prev.find((item) => item.codigoRepuesto === codigoNormalizado);
      if (existente) {
        return prev.map((item) =>
          item.codigoRepuesto === codigoNormalizado
            ? { ...item, cantidadPedida: item.cantidadPedida + cantidadNum }
            : item
        );
      }
      return [
        ...prev,
        {
          codigoRepuesto: codigoNormalizado,
          cantidadPedida: cantidadNum,
          cantidadYaRecibida: 0
        }
      ];
    });

    setNuevoRepuesto('');
    setNuevaCantidad('');
  };

  // Función 2: Quita (Ahora está correctamente AFUERA de la otra función)
  const handleQuitarItem = (indexABorrar: number) => {
    setItemsTemporales(itemsTemporales.filter((_, index) => index !== indexABorrar));
  };

  //Edita la cantidad pedida de un ítem ya agregado
  const handleActualizarCantidad = (indexAEditar: number, nuevaCant: number) => {
    const cantidadValida = Math.max(1, nuevaCant);
    setItemsTemporales((prev) =>
      prev.map((item, index) =>
        index === indexAEditar ? { ...item, cantidadPedida: cantidadValida } : item
      )
    );
  };


  // Función 3: Genera
  const handleGenerarOC = () => {
    if (itemsTemporales.length === 0) {
      alert('Debes agregar al menos un repuesto a la orden.');
      return;
    }

    const ahora = new Date();
    const nuevaOC: OrdenCompra = {
      id: `oc-${Date.now()}`,
      numeroOC: `OC-${Math.floor(Math.random() * 10000)}`,
      proveedor: 'Proveedor Simulado S.A.',
      fechaEmision: ahora.toLocaleDateString('es-AR'),
      horaEmision: ahora.toLocaleTimeString('es-AR', { hour12: false }),
      creadoPor: `${usuarioActual.nombre} (${usuarioActual.rol})`,
      estado: 'pendiente',
      items: itemsTemporales
    };
    
    agregarOrdenCompra(nuevaOC);
    setItemsTemporales([]);
    alert(`Orden ${nuevaOC.numeroOC} generada con ${itemsTemporales.length} ítems y enviada a depósito.`);
  };

  return (
    <div style={{ padding: '20px', maxWidth: '600px', margin: '0 auto' }}>
      <h2 style={{ color: tema.textoPrincipal, borderBottom: `2px solid ${tema.acento}`, paddingBottom: '10px' }}>
        ⚙️ Inyector de Datos (Simulador)
      </h2>
      <p style={{ color: tema.textoSecundario, marginBottom: '20px' }}>
        Agregá los repuestos uno por uno y luego generá la Orden de Compra.
      </p>

      <div style={{ background: tema.fondoTarjeta, padding: '20px', borderRadius: '8px', border: `1px solid ${tema.borde}` }}>
        
        <form onSubmit={handleAgregarItem} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', marginBottom: '20px' }}>
          <div style={{ flex: 1 }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: tema.textoSecundario, marginBottom: '5px' }}>Código (Ej: FIL-001)</label>
            <input 
              value={nuevoRepuesto}
              onChange={e => setNuevoRepuesto(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: `1px solid ${tema.borde}`, background: tema.fondoPagina, color: tema.textoPrincipal }} 
            />
          </div>
          <div style={{ width: '120px' }}>
            <label style={{ display: 'block', fontSize: '0.9rem', color: tema.textoSecundario, marginBottom: '5px' }}>Cantidad</label>
            <input 
              type="number" min="1" value={nuevaCantidad}
              onChange={e => setNuevaCantidad(e.target.value)}
              style={{ width: '100%', padding: '10px', borderRadius: '4px', border: `1px solid ${tema.borde}`, background: tema.fondoPagina, color: tema.textoPrincipal }} 
            />
          </div>
          <button type="submit" style={{ padding: '10px 15px', background: tema.fondoPagina, color: tema.textoPrincipal, border: `1px solid ${tema.borde}`, borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            + Agregar
          </button>
        </form>

        {itemsTemporales.length > 0 && (
          <div style={{ marginBottom: '20px', padding: '15px', background: tema.fondoPagina, borderRadius: '6px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: tema.textoPrincipal }}>Ítems en esta orden:</h4>
            
            {/* Lista nueva que incluye el botón de Quitar */}
            <ul style={{ margin: 0, paddingLeft: '0', listStyle: 'none', color: tema.textoSecundario }}>
              {itemsTemporales.map((item, index) => (
                <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', padding: '8px', borderBottom: `1px solid ${tema.borde}` }}>
                  <span>
                    <strong style={{ color: tema.acento }}>{item.codigoRepuesto}</strong> - {item.cantidadPedida} unidades
                  </span>

                   <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <button
                      type="button"
                      onClick={() => handleActualizarCantidad(index, item.cantidadPedida - 1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '4px',
                        border: `1px solid ${tema.borde}`,
                        background: tema.fondoTarjeta,
                        color: tema.textoPrincipal,
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      -
                    </button>

                    <input
                      type="number"
                      min="1"
                      value={item.cantidadPedida}
                      onChange={(e) => handleActualizarCantidad(index, Number(e.target.value))}
                      style={{
                        width: '60px',
                        textAlign: 'center',
                        padding: '4px',
                        borderRadius: '4px',
                        border: `1px solid ${tema.borde}`,
                        background: tema.fondoTarjeta,
                        color: tema.textoPrincipal,
                        fontWeight: 'bold'
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => handleActualizarCantidad(index, item.cantidadPedida + 1)}
                      style={{
                        width: '28px',
                        height: '28px',
                        borderRadius: '4px',
                        border: `1px solid ${tema.borde}`,
                        background: tema.fondoTarjeta,
                        color: tema.textoPrincipal,
                        cursor: 'pointer',
                        fontWeight: 'bold'
                      }}
                    >
                      +
                    </button>
                    <span style={{ fontSize: '0.85rem' }}>u.</span>
                  </div>
                  
                  <button 
                    type="button"
                    onClick={() => handleQuitarItem(index)}
                    style={{ background: 'transparent', border: 'none', color: '#dc3545', cursor: 'pointer', fontWeight: 'bold' }}
                    title="Quitar este repuesto"
                  >
                    ❌ Quitar
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        <button 
          onClick={handleGenerarOC}
          disabled={itemsTemporales.length === 0}
          style={{ width: '100%', padding: '12px', background: tema.acento, color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold', opacity: itemsTemporales.length === 0 ? 0.5 : 1 }}
        >
          Generar y Enviar a Depósito
        </button>
      </div>
    </div>
  );
}