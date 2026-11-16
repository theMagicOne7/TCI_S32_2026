// COMPONENTE RAÍZ: GESTIÓN DE TEMA GLOBAL Y PROVEEDOR DE ENRUTAMIENTO

import { useState, useMemo, useEffect } from 'react';
import { RouterProvider } from 'react-router-dom';
import { TEMA_CLARO, TEMA_OSCURO } from './theme/colors';
import { createAppRouter } from './router';
import { Login } from './Login';

export default function App() {
  const [esModoOscuro, setEsModoOscuro] = useState<boolean>(() => {
    return localStorage.getItem('tema_farmacia') === 'oscuro';
  });

  // Estado de sesión (JWT) para proteger el acceso al router
  const [token, setToken] = useState<string | null>(() => {
    return localStorage.getItem('token_acceso');
  });
  const [usuario, setUsuario] = useState<string | null>(() => {
    return localStorage.getItem('usuario_actual');
  });
  const [rol, setRol] = useState<string | null>(() => {
    return localStorage.getItem('rol_actual');
  });

  const toggleTema = () => {
    setEsModoOscuro((prev) => {
      const nuevoModo = !prev;
      localStorage.setItem('tema_farmacia', nuevoModo ? 'oscuro' : 'claro');
      return nuevoModo;
    });
  };

  const cerrarSesion = () => {
    localStorage.removeItem('token_acceso');
    localStorage.removeItem('usuario_actual');
    localStorage.removeItem('rol_actual');
    setToken(null);
    setUsuario(null);
    setRol(null);
  };

  const tema = esModoOscuro ? TEMA_OSCURO : TEMA_CLARO;

  // Sincroniza el fondo general del viewport con la paleta activa
  useEffect(() => {
    document.body.style.backgroundColor = tema.fondoPagina;
  }, [tema.fondoPagina]);

  const router = useMemo(
    () =>
      createAppRouter({
        tema,
        esModoOscuro,
        onToggleTema: toggleTema,
        usuario,
        rol,
        onCerrarSesion: cerrarSesion,
      }),
    [esModoOscuro, usuario, rol]
  );

  // Si no hay sesión iniciada, bloquea el router y muestra el Login
  if (!token) {
    return (
      <Login
        tema={tema}
        esModoOscuro={esModoOscuro}
        onToggleTema={toggleTema}
        onLoginExitoso={(nuevoToken, nuevoUsuario, nuevoRol) => {
          setToken(nuevoToken);
          setUsuario(nuevoUsuario);
          setRol(nuevoRol);
        }}
      />
    );
  }

  return <RouterProvider router={router} />;
}