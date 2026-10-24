import { useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { MovimientoList } from '../components/MovimientoList'; // Asumo que tenés este componente
import type { LayoutContextType } from '../types/index';

interface Props {
  areaObjetivo: 'deposito' | 'mantenimiento' | 'produccion';
  titulo: string;
}

export function AuditoriaAreaPage({ areaObjetivo, titulo }: Props) {
  const { tema, esModoOscuro, movimientos, usuarioActual } = useOutletContext<LayoutContextType>();
  const [filtroTurno, setFiltroTurno] = useState<string>('todos');

  // 1. REGLA DE SEGURIDAD ABSOLUTA: Si no es de esta área, y no es de dirección, lo echamos.
  const tieneAcceso = usuarioActual.area === areaObjetivo || usuarioActual.area === 'direccion';
  
  if (!tieneAcceso) {
    // Si alguien intenta escribir la URL a mano, lo redirigimos o le mostramos error
    return (
      <div style={{ textAlign: 'center', padding: '40px', color: '#991b1b', background: '#fef2f2', borderRadius: '12px' }}>
        <h2>⛔ Acceso Denegado</h2>
        <p>Tu usuario ({usuarioActual.area}) no tiene permisos para ver la auditoría de {areaObjetivo}.</p>
      </div>
    );
  }

  // 2. FILTRO DE DOMINIO: Separamos los movimientos usando el Legajo (PROD-, MANT-, DEP-)
  let movimientosDelArea = movimientos.filter(m => {
    if (areaObjetivo === 'deposito') return m.maquinaVinculada === 'N/A' || m.operario.includes('DEP-');
    if (areaObjetivo === 'mantenimiento') return m.operario.includes('MANT-');
    if (areaObjetivo === 'produccion') return m.operario.includes('PROD-');
    return false;
  });

  // 3. FILTRO DE ROL: ¿Es Encargado/Director o es un Operario base?
  const esJefe = usuarioActual.rol === 'encargado' || usuarioActual.area === 'direccion';
  
  if (!esJefe) {
    // Si es un empleado normal, SOBREESCRIBIMOS la lista para que solo queden sus propios movimientos
    movimientosDelArea = movimientosDelArea.filter(m => m.operario.includes(usuarioActual.nombre));
  }

  // 4. Filtro visual por turno de la interfaz
  const movimientosVisibles = movimientosDelArea.filter(m => 
    filtroTurno === 'todos' || m.turno === filtroTurno
  );

  return (
    <section style={{ background: tema.fondoTarjeta, border: `1px solid ${tema.borde}`, borderRadius: '12px', padding: '20px' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h2 style={{ margin: '0 0 5px 0', color: tema.textoPrincipal }}>{titulo}</h2>
          <p style={{ margin: 0, color: tema.textoSecundario, fontSize: '0.85rem' }}>
            {esJefe ? '✅ Viendo todos los registros del sector.' : '👁️ Viendo únicamente tus registros personales.'}
          </p>
        </div>
        <span style={{ background: esJefe ? '#dbeafe' : '#fef3c7', color: esJefe ? '#1e40af' : '#b45309', padding: '4px 10px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 'bold' }}>
          Rol: {usuarioActual.rol.toUpperCase()}
        </span>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <select value={filtroTurno} onChange={(e) => setFiltroTurno(e.target.value)} style={{ padding: '8px', borderRadius: '6px' }}>
          <option value="todos">Todos los turnos</option>
          <option value="Mañana">Mañana</option>
          <option value="Tarde">Tarde</option>
          <option value="Noche">Noche</option>
        </select>
      </div>

      {movimientosVisibles.length === 0 ? (
        <p style={{ textAlign: 'center', color: tema.textoSecundario, padding: '20px' }}>No hay movimientos para mostrar.</p>
      ) : (
        <MovimientoList movimientos={movimientosVisibles} tema={tema} esModoOscuro={esModoOscuro} />
      )}
    </section>
  );
}