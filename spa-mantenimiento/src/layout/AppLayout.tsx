// CONTENEDOR GENERAL RESPONSIVE PARA PLANTA INDUSTRIAL

import { useState } from 'react';
import { Outlet } from 'react-router-dom';
// 👇 IMPORTAMOS LOS TIPOS ACTUALIZADOS (Incluyendo Incidencia)
import { 
  type TemaPaleta, 
  type MovimientoStock, 
  type UsuarioPlanta, 
  type OrdenCompra, 
  type LayoutContextType, 
  type Repuesto,
  type Incidencia // <-- Nuevo tipo importado
} from '../types/index';
import { PERSONAL_PLANTA, CATALOGO_REPUESTOS } from '../constants/mock'; 
import { NavBar } from '../components/NavBar';

interface AppLayoutProps {
  tema: TemaPaleta;
  esModoOscuro: boolean;
  onToggleTema: () => void;
  usuario: string | null;
  rol: string | null;
  onCerrarSesion: () => void;
}

export function AppLayout({
  tema,
  esModoOscuro,
  onToggleTema,
  usuario,
  rol,
  onCerrarSesion
}: AppLayoutProps) {
  const [movimientos, setMovimientos] = useState<MovimientoStock[]>([]);
  
  // Sincroniza el usuario autenticado del Login (ej: "CeciliaBallarre" o "ceciliaballarre")
  // con su perfil real en PERSONAL_PLANTA ("Ing. Cecilia Ballarre")
  const [usuarioActual, setUsuarioActual] = useState<UsuarioPlanta>(() => {
    const userLimpio = (usuario || '').toLowerCase().replace(/\s+/g, '').trim();
    const rolLogin = (rol || '').toLowerCase().trim();

    // 1. Coincidencia por nombre y apellido sin importar mayúsculas ni espacios
    const encontradoPorNombre = PERSONAL_PLANTA.find((p) =>
      p.nombre.toLowerCase().replace(/\s+/g, '').includes(userLimpio)
    );
    if (encontradoPorNombre) return encontradoPorNombre;

    // 2. Si es un usuario nuevo creado desde el panel (ej: "ema"), buscamos por rol
    const encontradoPorRol = PERSONAL_PLANTA.find(
      (p) => p.rol.toLowerCase() === rolLogin
    );
    if (encontradoPorRol) {
      return {
        ...encontradoPorRol,
        nombre: usuario || encontradoPorRol.nombre
      };
    }

    // 3. Respaldo general
    return {
      ...PERSONAL_PLANTA[0],
      nombre: usuario || 'Usuario',
      rol: (rolLogin as any) || 'operario'
    };
  });

    const [ordenesCompra, setOrdenesCompra] = useState<OrdenCompra[]>([]);
  const [repuestos, setRepuestos] = useState<Repuesto[]>(CATALOGO_REPUESTOS);
  
  // 👇 NUEVO: Estado Global para Incidencias 👇
  const [incidencias, setIncidencias] = useState<Incidencia[]>([]);


  // Estados para el alta de nuevos usuarios (Solo Supervisor o Cecilia Ballarre)
  const [mostrarAltaUsuario, setMostrarAltaUsuario] = useState(false);
  const [nuevoUser, setNuevoUser] = useState('');
  const [nuevaPass, setNuevaPass] = useState('');
  const [nuevoRol, setNuevoRol] = useState('Operario');
  const [mensajeAlta, setMensajeAlta] = useState<{ tipo: 'ok' | 'err'; texto: string } | null>(null);

  const userNormalizado = (usuario || '').toLowerCase().replace(/\s+/g, '').trim();
  const rolNormalizado = (rol || '').toLowerCase().trim();
  const esCecilia = ['ceci', 'ceciliaballarre'].includes(userNormalizado);

  const puedeAdministrarUsuarios =
    rolNormalizado === 'supervisor' || esCecilia;

  // Permiso para ver y usar el selector de simulación de empleados (solo jerárquicos)
  const rolesConSelector = ['supervisor', 'encargado', 'gerente'];
  const puedeCambiarUsuario =
    rolesConSelector.includes(rolNormalizado) || esCecilia;

  const handleCrearUsuario = async (e: React.FormEvent) => {
    e.preventDefault();
    setMensajeAlta(null);
    const token = localStorage.getItem('token_acceso');

    try {
      const res = await fetch('/usuarios', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          username: nuevoUser,
          password: nuevaPass,
          rol: nuevoRol
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Error al registrar usuario');
      }

      setMensajeAlta({ tipo: 'ok', texto: `✅ ${data.mensaje}` });
      setNuevoUser('');
      setNuevaPass('');
    } catch (err: any) {
      setMensajeAlta({ tipo: 'err', texto: `⚠️ ${err.message}` });
    }
  };

  const actualizarRepuesto = (repuestoModificado: Repuesto) => {
    setRepuestos((prev) => 
      prev.map(r => r.codigo === repuestoModificado.codigo ? repuestoModificado : r)
    );
  };

  const agregarMovimiento = (nuevo: MovimientoStock) => {
    setMovimientos((prev) => [nuevo, ...prev]);
  };
  
  const agregarOrdenCompra = (nueva: OrdenCompra) => {
    setOrdenesCompra((prev) => [...prev, nueva]);
  };

  const actualizarOrdenCompra = (ocModificada: OrdenCompra) => {
    setOrdenesCompra((prev) => prev.map(oc => oc.id === ocModificada.id ? ocModificada : oc));
  };

  // 👇 NUEVO: Funciones de Control para Incidencias 👇
  const agregarIncidencia = (nueva: Incidencia) => {
    setIncidencias((prev) => [nueva, ...prev]);
  };

  const actualizarIncidencia = (incModificada: Incidencia) => {
    setIncidencias((prev) => prev.map(inc => inc.id === incModificada.id ? incModificada : inc));
  };
  // 👆 FIN NUEVO 👆

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
          maxWidth: '960px',
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
        {/* Barra Superior de Sesión Autenticada (JWT) */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '10px',
            padding: '10px 14px',
            borderRadius: '10px',
            background: esModoOscuro ? '#061b24' : '#f0fdfa',
            border: `1px solid ${tema.borde}`
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '0.9rem', fontWeight: 700, color: tema.textoPrincipal }}>
              👤 {usuario}
            </span>
            <span
              style={{
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: '2px 10px',
                borderRadius: '20px',
                background: '#0d9488',
                color: '#ffffff'
              }}
            >
              {rol}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {puedeAdministrarUsuarios && (
              <button
                type="button"
                onClick={() => setMostrarAltaUsuario(!mostrarAltaUsuario)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '8px',
                  border: `1px solid ${tema.borde}`,
                  background: tema.fondoTarjeta,
                  color: tema.textoPrincipal,
                  fontSize: '0.8rem',
                  fontWeight: 600,
                  cursor: 'pointer'
                }}
              >
                {mostrarAltaUsuario ? '✖ Cerrar Gestión' : '🛡️ Nuevo Usuario'}
              </button>
            )}

            <button
              type="button"
              onClick={onCerrarSesion}
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: '#ef4444',
                color: '#ffffff',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer'
              }}
            >
              Cerrar Sesión
            </button>
          </div>
        </div>

        {/* Panel desplegable de Creación de Usuarios (Exclusivo Supervisor / Cecilia) */}
        {puedeAdministrarUsuarios && mostrarAltaUsuario && (
          <section
            style={{
              padding: '16px',
              borderRadius: '12px',
              border: '1.5px solid #0d9488',
              background: esModoOscuro ? '#08262e' : '#f0fdfa'
            }}
          >
            <h3 style={{ margin: '0 0 12px 0', fontSize: '0.95rem', color: tema.textoPrincipal }}>
              Registrar Nuevo Usuario en Planta
            </h3>

            {mensajeAlta && (
              <div
                style={{
                  marginBottom: '12px',
                  padding: '10px',
                  borderRadius: '8px',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  background: mensajeAlta.tipo === 'ok' ? '#dcfce7' : '#fee2e2',
                  color: mensajeAlta.tipo === 'ok' ? '#166534' : '#991b1b'
                }}
              >
                {mensajeAlta.texto}
              </div>
            )}

            <form
              onSubmit={handleCrearUsuario}
              style={{ display: 'flex', flexWrap: 'wrap', gap: '10px', alignItems: 'center' }}
            >
              <input
                type="text"
                placeholder="Nombre de usuario (ej: JuanPerez)"
                value={nuevoUser}
                onChange={(e) => setNuevoUser(e.target.value)}
                required
                style={{
                  flex: '1 1 160px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${tema.borde}`,
                  background: tema.fondoInput,
                  color: tema.textoPrincipal
                }}
              />
              <input
                type="password"
                placeholder="Contraseña inicial"
                value={nuevaPass}
                onChange={(e) => setNuevaPass(e.target.value)}
                required
                style={{
                  flex: '1 1 160px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${tema.borde}`,
                  background: tema.fondoInput,
                  color: tema.textoPrincipal
                }}
              />
              <select
                value={nuevoRol}
                onChange={(e) => setNuevoRol(e.target.value)}
                style={{
                  flex: '1 1 140px',
                  padding: '8px 12px',
                  borderRadius: '6px',
                  border: `1px solid ${tema.borde}`,
                  background: tema.fondoInput,
                  color: tema.textoPrincipal
                }}
              >
                <option value="Operario">Operario</option>
                <option value="Mantenimiento">Mantenimiento</option>
                <option value="Encargado">Encargado</option>
                <option value="Supervisor">Supervisor</option>
              </select>
              <button
                type="submit"
                style={{
                  padding: '8px 16px',
                  borderRadius: '6px',
                  border: 'none',
                  background: '#0f766e',
                  color: '#ffffff',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                Crear Usuario
              </button>
            </form>
          </section>
        )}

        <NavBar
          tema={tema}
          esModoOscuro={esModoOscuro}
          onToggleTema={onToggleTema}
          usuarioActual={usuarioActual}
          rol={usuarioActual.rol}
          onCambiarUsuario={setUsuarioActual}
          puedeCambiarUsuario={puedeCambiarUsuario}
          incidencias={incidencias}
        />

        <div style={{ width: '100%' }}>
          <Outlet
            context={{
              tema,
              esModoOscuro,
              movimientos,
              agregarMovimiento,
              usuarioActual,
              ordenesCompra,
              agregarOrdenCompra,
              actualizarOrdenCompra,
              repuestos,
              actualizarRepuesto,
              // 👇 REPARTIMOS LAS INCIDENCIAS AL RESTO DE LA APP 👇
              incidencias,
              agregarIncidencia,
              actualizarIncidencia
            } satisfies LayoutContextType}
          />
        </div>
      </main>
    </div>
  );
}