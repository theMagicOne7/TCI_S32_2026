// ENCABEZADO Y BARRA DE NAVEGACIÓN RESPONSIVE

import { NavLink } from 'react-router-dom';
import { type TemaPaleta, type UsuarioPlanta } from '../types/index';
import { PERSONAL_PLANTA } from '../constants/mock';

interface NavBarProps {
  tema: TemaPaleta;
  esModoOscuro: boolean;
  onToggleTema: () => void;
  usuarioActual: UsuarioPlanta;
  onCambiarUsuario: (usuario: UsuarioPlanta) => void;
}

export function NavBar({
  tema,
  esModoOscuro,
  onToggleTema,
  usuarioActual,
  onCambiarUsuario
}: NavBarProps) {
  const getLinkStyle = ({ isActive }: { isActive: boolean }) => ({
    textDecoration: 'none',
    fontSize: '0.88rem',
    fontWeight: 700,
    color: isActive ? tema.acento : tema.textoSecundario,
    borderBottom: isActive ? `2px solid ${tema.acento}` : '2px solid transparent',
    paddingBottom: '6px',
    transition: 'all 0.2s ease'
  });

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
              {PERSONAL_PLANTA.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.nombre} ({u.rol === 'supervisor' ? 'Supervisor' : 'Técnico'})
                </option>
              ))}
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
      <nav style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <NavLink to="/" style={getLinkStyle}>Inicio</NavLink>
        <NavLink to="/repuestos" style={getLinkStyle}>Repuestos (CU-01)</NavLink>
        <NavLink to="/historial" style={getLinkStyle}>
          {usuarioActual.rol === 'supervisor' ? 'Auditoría (RN-06)' : 'Auditoría 🔒'}
        </NavLink>
      </nav>
    </header>
  );
}