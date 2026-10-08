// CONTENEDOR GENERAL RESPONSIVE PARA PLANTA INDUSTRIAL

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { type TemaPaleta, type MovimientoStock, type UsuarioPlanta } from '../types/index';
import { PERSONAL_PLANTA } from '../constants/mock';
import { NavBar } from '../components/NavBar';

interface AppLayoutProps {
  tema: TemaPaleta;
  esModoOscuro: boolean;
  onToggleTema: () => void;
}

export interface LayoutContextType {
  tema: TemaPaleta;
  esModoOscuro: boolean;
  movimientos: MovimientoStock[];
  agregarMovimiento: (nuevo: MovimientoStock) => void;
  usuarioActual: UsuarioPlanta;
}

export function AppLayout({ tema, esModoOscuro, onToggleTema }: AppLayoutProps) {
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  const [usuarioActual, setUsuarioActual] = useState<UsuarioPlanta>(PERSONAL_PLANTA[0]);

  const agregarMovimiento = (nuevo: MovimientoStock) => {
    setMovimientos((prev) => [nuevo, ...prev]);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        width: '100%',
        boxSizing: 'border-box',
        padding: '20px 16px',
        display: 'flex',
        justifyContent: 'center',
        background: tema.fondoPagina,
        transition: 'background-color 0.3s ease'
      }}
    >
      <main
        style={{
          width: '100%',
          maxWidth: '960px', // Se expande de forma elegante en escritorio
          background: tema.fondoTarjeta,
          borderRadius: '16px',
          border: `1px solid ${tema.borde}`,
          padding: '24px',
          boxShadow: esModoOscuro
            ? '0 10px 30px rgba(0, 0, 0, 0.45)'
            : '0 8px 24px rgba(13, 148, 136, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
          transition: 'all 0.3s ease'
        }}
      >
        <NavBar
          tema={tema}
          esModoOscuro={esModoOscuro}
          onToggleTema={onToggleTema}
          usuarioActual={usuarioActual}
          onCambiarUsuario={setUsuarioActual}
        />

        <div style={{ width: '100%' }}>
          <Outlet
            context={{
              tema,
              esModoOscuro,
              movimientos,
              agregarMovimiento,
              usuarioActual
            } satisfies LayoutContextType}
          />
        </div>
      </main>
    </div>
  );
}