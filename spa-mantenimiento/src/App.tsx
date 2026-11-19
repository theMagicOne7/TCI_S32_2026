// COMPONENTE RAÍZ: GESTIÓN DE TEMA GLOBAL Y PROVEEDOR DE ENRUTAMIENTO

import { useState, useMemo, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { TEMA_CLARO, TEMA_OSCURO } from './theme/colors';
import { createAppRouter } from './router';
import { LoginPage } from './pages/LoginPage';
import { type UsuarioPlanta } from './types/index';
import {
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
  mapearRespuestaAUsuarioPlanta,
  type LoginRespuesta,
} from './data';

export default function App() {
  const [esModoOscuro, setEsModoOscuro] = useState<boolean>(() => {
    return localStorage.getItem('tema_farmacia') === 'oscuro';
  });

  const [usuarioActual, setUsuarioActual] = useState<UsuarioPlanta | null>(() => {
    const token = localStorage.getItem(TOKEN_STORAGE_KEY);
    const usuarioGuardado = localStorage.getItem(USER_STORAGE_KEY);
    if (!token || !usuarioGuardado) return null;
    try {
      return JSON.parse(usuarioGuardado) as UsuarioPlanta;
    } catch {
      return null;
    }
  });

  const toggleTema = () => {
    setEsModoOscuro((prev) => {
      const nuevoModo = !prev;
      localStorage.setItem('tema_farmacia', nuevoModo ? 'oscuro' : 'claro');
      return nuevoModo;
    });
  };

  const tema = esModoOscuro ? TEMA_OSCURO : TEMA_CLARO;

  const iniciarSesion = (respuesta: LoginRespuesta) => {
    const usuario = mapearRespuestaAUsuarioPlanta(respuesta);
    localStorage.setItem(TOKEN_STORAGE_KEY, respuesta.access_token);
    localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(usuario));
    setUsuarioActual(usuario);
  };

  const cerrarSesion = () => {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    setUsuarioActual(null);
  };

  // Sincroniza el fondo general del viewport con la paleta activa
  useEffect(() => {
    document.body.style.backgroundColor = tema.fondoPagina;
  }, [tema.fondoPagina]);

  const router = useMemo(() => usuarioActual
    ? createAppRouter({ tema, esModoOscuro, onToggleTema: toggleTema, usuarioActual, onCerrarSesion: cerrarSesion })
    : null,
  [tema, esModoOscuro, usuarioActual]);

  if (!usuarioActual || !router) {
    return <LoginPage tema={tema} esModoOscuro={esModoOscuro} onToggleTema={toggleTema} onLoginExitoso={iniciarSesion} />;
  }

  return <RouterProvider router={router} />;
}
