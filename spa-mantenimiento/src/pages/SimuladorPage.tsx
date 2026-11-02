import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { type LayoutContextType, type OrdenCompra, type ItemOrden } from '../types';

export function SimuladorPage() {
  const { tema, agregarOrdenCompra } = useOutletContext<LayoutContextType>();
  
  const [nuevoRepuesto, setNuevoRepuesto] = useState('');
  const [nuevaCantidad, setNuevaCantidad] = useState('');
  const [itemsTemporales, setItemsTemporales] = useState<ItemOrden[]>([]);

  // Función 1: Agrega
  const handleAgregarItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nuevoRepuesto || !nuevaCantidad) return;

    const nuevoItem: ItemOrden = {
      codigoRepuesto: nuevoRepuesto.toUpperCase(),
      cantidadPedida: Number(nuevaCantidad),
      cantidadYaRecibida: 0
    };

    setItemsTemporales([...itemsTemporales, nuevoItem]);
    setNuevoRepuesto('');
    setNuevaCantidad('');
  };

  // Función 2: Quita (Ahora está correctamente AFUERA de la otra función)
  const handleQuitarItem = (indexABorrar: number) => {
    setItemsTemporales(itemsTemporales.filter((_, index) => index !== indexABorrar));
  };

  // Función 3: Genera
  const handleGenerarOC = () => {
    if (itemsTemporales.length === 0) {
      alert('Debes agregar al menos un repuesto a la orden.');
      return;
    }

    const nuevaOC: OrdenCompra = {
      id: `oc-${Date.now()}`,
      numeroOC: `OC-${Math.floor(Math.random() * 10000)}`,
      proveedor: 'Proveedor Simulado S.A.',
      fechaEmision: new Date().toLocaleDateString(),
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
                <li key={index} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', borderBottom: `1px solid ${tema.borde}` }}>
                  <span>
                    <strong style={{ color: tema.acento }}>{item.codigoRepuesto}</strong> - {item.cantidadPedida} unidades
                  </span>
                  
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