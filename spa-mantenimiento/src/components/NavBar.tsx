// ENCABEZADO Y BARRA DE NAVEGACIÓN RESPONSIVE

import { NavLink } from 'react-router-dom';
// 👇 1. Asegurarse de importar Incidencia
import { type TemaPaleta, type UsuarioPlanta, type Incidencia } from '../types/index';
import { PERSONAL_PLANTA } from '../constants/mock';

interface NavBarProps {
  tema: TemaPaleta;
  esModoOscuro: boolean;
  onToggleTema: () => void;
  usuarioActual: UsuarioPlanta;
  onCambiarUsuario: (usuario: UsuarioPlanta) => void;
    // 👇 2. Agregamos la propiedad incidencias
  incidencias: Incidencia[]; 
}

export function NavBar({
  tema,
  esModoOscuro,
  onToggleTema,
  usuarioActual,
  onCambiarUsuario,
  // 👇 3. Recibimos incidencias
  incidencias 
}: NavBarProps) {
  const getLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    textDecoration: 'none',
    fontSize: '0.88rem',
    fontWeight: 700,
    color: isActive ? tema.acento : tema.textoSecundario,
    borderBottom: isActive ? `2px solid ${tema.acento}` : '2px solid transparent',
    paddingBottom: '6px',
    transition: 'all 0.2s ease',
        display: 'flex', // Necesario para alinear texto y globito
    alignItems: 'center',
    gap: '6px'
  });

    // LÓGICA DE PERMISOS PARA LA BARRA DE NAVEGACIÓN
  const esDireccion = usuarioActual.area === 'direccion';
  const esAuditorMantenimiento = usuarioActual.area === 'mantenimiento' || esDireccion;

  // 👇 4. LÓGICA DEL GLOBITO: Contamos solo las "pendientes" según el rol
  const incidenciasPendientes = (incidencias || []).filter(inc => {
    if (inc.estado !== 'pendiente') return false; 
    if (esAuditorMantenimiento) return true; // Mantenimiento ve todas
    return inc.operario.includes(usuarioActual.nombre); // Operario ve solo las suyas
  }).length;

  return (
    <header style={{ borderBottom: `1px solid ${tema.borde}`, paddingBottom: '16px' }}>
      {/* 1. Nivel superior: Título corporativo con Logo e Identificación */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '16px'
        }}
      >
        {/* Isotipo de Cápsula + Textos de Encabezado */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <img
            src="/logo.svg"
            alt="Logo Cápsula Planta"
            style={{
              width: '44px',
              height: '44px',
              objectFit: 'contain',
              flexShrink: 0
            }}
          />

          <div>
            <span
              style={{
                fontSize: '0.72rem',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: tema.acento
              }}
            >
              CLG - Módulo de Mantenimiento de Planta
            </span>
            <h1
              style={{
                fontSize: '1.45rem',
                fontWeight: 700,
                margin: '2px 0 0 0',
                color: tema.textoPrincipal
              }}
            >
              Control de Líneas Farmacéuticas
            </h1>
          </div>
        </div>

        {/* Controles de Sesión / Turno y Tema */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              background: esModoOscuro ? '#061b24' : '#f8fafc',
              padding: '6px 10px',
              borderRadius: '8px',
              border: `1px solid ${tema.borde}`
            }}
          >
            <span style={{ fontSize: '0.75rem', color: tema.textoSecundario }}>👤</span>
            <select
              value={usuarioActual.id}
              onChange={(e) => {
                const seleccionado = PERSONAL_PLANTA.find((u) => u.id === e.target.value);
                if (seleccionado) onCambiarUsuario(seleccionado);
              }}
              style={{
                background: tema.fondoTarjeta,
                color: tema.textoPrincipal,
                border: `1px solid ${tema.borde}`,
                borderRadius: '6px',
                padding: '4px 6px',
                fontSize: '0.78rem',
                fontWeight: 700,
                cursor: 'pointer',
                outline: 'none'
              }}
            >
                            {['produccion', 'mantenimiento', 'deposito', 'direccion'].map((areaStr) => {
                const empleadosArea = PERSONAL_PLANTA.filter((u) => u.area === areaStr);
                if (empleadosArea.length === 0) return null;

                return (
                  <optgroup key={areaStr} label={`📍 ÁREA: ${areaStr.toUpperCase()}`}>
                    {empleadosArea.map((u) => {
                      const textoRol = u.rol === 'encargado' 
                        ? `encargado de ${areaStr}` 
                        : u.rol;
                      
                      return (
                        <option key={u.id} value={u.id}>
                          {u.nombre} ({textoRol})
                        </option>
                      );
                    })}
                  </optgroup>
                );
              })}
            </select>
          </div>

          <button
            onClick={onToggleTema}
            style={{
              background: esModoOscuro ? '#061b24' : '#f8fafc',
              color: tema.textoPrincipal,
              border: `1px solid ${tema.borde}`,
              padding: '6px 12px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.8rem',
              fontWeight: 600
            }}
          >
            {esModoOscuro ? '☀ Claro' : '🌙 Oscuro'}
          </button>
        </div>
      </div>

      {/* 2. Nivel inferior: Enlaces principales de navegación */}
      <nav style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        <NavLink to="/" style={getLinkStyle}>
          Inicio
        </NavLink>
        <NavLink to="/repuestos" style={getLinkStyle}>
          Repuestos (CU-01)
        </NavLink>
        <NavLink to="/recepcion" style={getLinkStyle}>
           🚚 Recepción 
        </NavLink>

        {/* BOTONES DE AUDITORÍA DINÁMICOS POR ÁREA */}
        {(esDireccion || usuarioActual.area === 'deposito') && (
          <NavLink to="/auditoria/deposito" style={getLinkStyle}>
            📦 Auditoría Depósito 
          </NavLink>
        )}

        {(esDireccion || usuarioActual.area === 'mantenimiento') && (
          <NavLink to="/auditoria/mantenimiento" style={getLinkStyle}>
            🛠️ Auditoría Mantenimiento 
          </NavLink>
        )}

        {(esDireccion || usuarioActual.area === 'produccion') && (
          <NavLink to="/auditoria/produccion" style={getLinkStyle}>
            ⚙️ Auditoría Producción 
          </NavLink>
        )}

        <NavLink style={getLinkStyle} to="/simulador">
          📘 Cargar Datos 
        </NavLink>

        <NavLink to="/nueva-incidencia" style={getLinkStyle}>
          🚨 Reportar Falla 
        </NavLink>
        
        {/* 👇 5. EL ENLACE DE TICKETS AHORA INCLUYE EL GLOBITO 👇 */}
        <NavLink to="/auditoria-incidencias" style={getLinkStyle}>
          {esAuditorMantenimiento ? '🔧 Panel de Mantenimiento' : '📋 Mis Tickets de Falla'}
          
          {incidenciasPendientes > 0 && (
            <span style={{
              background: '#ef4444', // Rojo brillante
              color: 'white',
              fontSize: '0.7rem',
              fontWeight: 'bold',
              padding: '2px 7px',
              borderRadius: '999px',
              lineHeight: 1,
              marginLeft: '2px'
            }}>
              {incidenciasPendientes}
            </span>
          )}
        </NavLink>
      </nav>
    </header>
  );
}