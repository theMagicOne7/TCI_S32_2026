// COMPONENTE RAÍZ: GESTIÓN DE TEMA GLOBAL Y PROVEEDOR DE ENRUTAMIENTO

import { useState, useMemo, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { TEMA_CLARO, TEMA_OSCURO } from './theme/colors';
import { createAppRouter } from './router';

export default function App() {
  const [esModoOscuro, setEsModoOscuro] = useState<boolean>(() => {
    return localStorage.getItem('tema_farmacia') === 'oscuro';
  });

  const toggleTema = () => {
    setEsModoOscuro((prev) => {
      const nuevoModo = !prev;
      localStorage.setItem('tema_farmacia', nuevoModo ? 'oscuro' : 'claro');
      return nuevoModo;
    });
  };

  const tema = esModoOscuro ? TEMA_OSCURO : TEMA_CLARO;

  // Sincroniza el fondo general del viewport con la paleta activa
  useEffect(() => {
    document.body.style.backgroundColor = tema.fondoPagina;
  }, [tema.fondoPagina]);

  const router = useMemo(
    () => createAppRouter({ tema, esModoOscuro, onToggleTema: toggleTema }),
    [esModoOscuro]
  );

  return <RouterProvider router={router} />;
}