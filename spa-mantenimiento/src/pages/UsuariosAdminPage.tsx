import React, { useEffect, useState } from 'react';
import { API_BASE_URL, getAuthHeaders } from '../data';

interface UsuarioItem {
  username: string;
  apellido?: string;
  nombre?: string;
  email?: string;
  rol: string;
  area?: string;
  bloqueado: boolean;
  intentos_fallidos: number;
}

const ETIQUETAS_AREA: Record<string, string> = {
  produccion: 'Producción',
  mantenimiento: 'Mantenimiento',
  deposito: 'Depósito',
  direccion: 'Dirección',
};

export const UsuariosAdminPage: React.FC = () => {
  const [usuarios, setUsuarios] = useState<UsuarioItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const [usernameOriginal, setUsernameOriginal] = useState<string | null>(null);
  const [nuevoUsername, setNuevoUsername] = useState('');
  const [apellidoInput, setApellidoInput] = useState('');
  const [nombreInput, setNombreInput] = useState('');
  const [emailInput, setEmailInput] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [nuevoRol, setNuevoRol] = useState('Operario');
  const [nuevaArea, setNuevaArea] = useState('produccion');
  const [busqueda, setBusqueda] = useState('');

  const obtenerUsuarios = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/usuarios`, { headers: getAuthHeaders({ 'Content-Type': 'application/json' }) });

      if (!response.ok) {
        throw new Error("No tienes permisos o falló la carga de usuarios.");
      }

      const data = await response.json();
      setUsuarios(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    obtenerUsuarios();
  }, []);

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const endpoint = usernameOriginal ? `${API_BASE_URL}/usuarios/${usernameOriginal}` : `${API_BASE_URL}/usuarios`;
      const method = usernameOriginal ? 'PUT' : 'POST';

      const bodyData: any = {
        username: nuevoUsername,
        apellido: apellidoInput,
        nombre: nombreInput,
        email: emailInput,
        rol: nuevoRol,
        area: nuevoRol === 'Supervisor' ? 'direccion' : nuevaArea,
      };

      if (!usernameOriginal || nuevaPassword.trim() !== '') {
        bodyData.password = nuevaPassword;
      }

      const response = await fetch(endpoint, {
        method: method,
        headers: getAuthHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(bodyData)
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Error al procesar la operación");
      }

      alert(usernameOriginal ? "Usuario actualizado exitosamente" : "Usuario creado exitosamente");
      cancelarEdicion();
      obtenerUsuarios();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const iniciarEdicion = (user: UsuarioItem) => {
    setUsernameOriginal(user.username);
    setNuevoUsername(user.username);
    setApellidoInput(user.apellido || '');
    setNombreInput(user.nombre || '');
    setEmailInput(user.email || '');
    setNuevaPassword('');
    const rolNormalizado = user.rol === 'Mantenimiento' ? 'Operario' : user.rol;
    setNuevoRol(rolNormalizado);
    setNuevaArea(
      rolNormalizado === 'Supervisor'
        ? 'direccion'
        : user.area || (user.rol === 'Mantenimiento' ? 'mantenimiento' : 'produccion')
    );
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelarEdicion = () => {
    setUsernameOriginal(null);
    setNuevoUsername('');
    setApellidoInput('');
    setNombreInput('');
    setEmailInput('');
    setNuevaPassword('');
    setNuevoRol('Operario');
    setNuevaArea('produccion');
  };

  const handleEliminar = async (username: string) => {
    if (!window.confirm(`¿Estás segura de que deseas eliminar al usuario "${username}"?`)) {
      return;
    }

    try {
      const response = await fetch(`${API_BASE_URL}/usuarios/${username}`, {
        method: 'DELETE',
        headers: getAuthHeaders({ 'Content-Type': 'application/json' })
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.detail || "Error al eliminar el usuario");
      }

      setUsuarios(usuarios.filter(u => u.username !== username));
      alert("Usuario eliminado correctamente.");
    } catch (err: any) {
        alert(err.message);
    }
  };

  // Filtrado y ordenamiento alfabético impecable por Apellido y Nombre
  const usuariosFiltrados = usuarios
    .filter(u => {
      const apellidoStr = (u.apellido || "").toLowerCase();
      const nombreStr = (u.nombre || "").toLowerCase();
      const usernameStr = u.username.toLowerCase();
      const textoBusqueda = busqueda.toLowerCase();

      return (
        usernameStr.includes(textoBusqueda) || 
        apellidoStr.includes(textoBusqueda) || 
        nombreStr.includes(textoBusqueda)
      );
    })
    .sort((a, b) => {
      const apellidoA = (a.apellido || "").toLowerCase();
      const apellidoB = (b.apellido || "").toLowerCase();
      
      const comparacionApellido = apellidoA.localeCompare(apellidoB);
      if (comparacionApellido !== 0) {
        return comparacionApellido;
      }

      const nombreA = (a.nombre || "").toLowerCase();
      const nombreB = (b.nombre || "").toLowerCase();
      return nombreA.localeCompare(nombreB);
    });

  if (loading) return <div style={{ padding: '32px', textAlign: 'center', fontWeight: 'bold', color: '#111827' }}>Cargando panel de administración...</div>;
  if (error) return <div style={{ padding: '32px', textAlign: 'center', fontWeight: 'bold', color: '#dc2626' }}>Error: {error}</div>;

  return (
    <div style={{ padding: '28px', maxWidth: '100%', width: '100%', margin: '0 auto', background: '#ffffff', borderRadius: '16px', boxShadow: '0 10px 25px rgba(0,0,0,0.08)', marginTop: '20px', border: '1px solid #e5e7eb', boxSizing: 'border-box' }}>
      <div style={{ borderBottom: '2px solid #e5e7eb', paddingBottom: '16px', marginBottom: '24px' }}>
        <h2 style={{ fontSize: '1.7rem', fontWeight: '800', color: '#111827', margin: 0 }}>👥 Administración de Personal</h2>
      </div>

      {/* Formulario */}
      <div style={{ background: '#f9fafb', padding: '24px', borderRadius: '12px', borderLeft: `8px solid ${usernameOriginal ? '#d97706' : '#10b981'}`, boxShadow: '0 4px 6px rgba(0,0,0,0.04)', marginBottom: '28px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '700', color: '#111827', margin: 0 }}>
            {usernameOriginal ? `✏️ Editando Usuario: "${usernameOriginal}"` : '➕ Registrar Nuevo Usuario'}
          </h3>
          {usernameOriginal && (
            <button type="button" onClick={cancelarEdicion} style={{ fontSize: '0.85rem', color: '#374151', textDecoration: 'underline', fontWeight: 'bold', background: 'none', border: 'none', cursor: 'pointer' }}>
              Cancelar edición
            </button>
          )}
        </div>

        <form onSubmit={handleSubmitForm} style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '20px', alignItems: 'end' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>Usuario (Sistema)</label>
            <input type="text" value={nuevoUsername} onChange={(e) => setNuevoUsername(e.target.value)} required placeholder="Ej: cballarre" style={{ width: '100%', border: '2px solid #d1d5db', borderRadius: '8px', padding: '10px', fontSize: '0.9rem', color: '#111827', background: '#ffffff', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>Apellido</label>
            <input type="text" value={apellidoInput} onChange={(e) => setApellidoInput(e.target.value)} placeholder="Ej: Ballarre" style={{ width: '100%', border: '2px solid #d1d5db', borderRadius: '8px', padding: '10px', fontSize: '0.9rem', color: '#111827', background: '#ffffff', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>Nombre</label>
            <input type="text" value={nombreInput} onChange={(e) => setNombreInput(e.target.value)} placeholder="Ej: Cecilia" style={{ width: '100%', border: '2px solid #d1d5db', borderRadius: '8px', padding: '10px', fontSize: '0.9rem', color: '#111827', background: '#ffffff', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>Correo de recuperación</label>
            <input type="email" value={emailInput} onChange={(e) => setEmailInput(e.target.value)} placeholder="empleado@gmail.com" style={{ width: '100%', border: '2px solid #d1d5db', borderRadius: '8px', padding: '10px', fontSize: '0.9rem', color: '#111827', background: '#ffffff', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>{usernameOriginal ? 'Nueva Contraseña' : 'Contraseña'}</label>
            <input type="password" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} required={!usernameOriginal} placeholder={usernameOriginal ? "Dejar en blanco" : "••••••••"} style={{ width: '100%', border: '2px solid #d1d5db', borderRadius: '8px', padding: '10px', fontSize: '0.9rem', color: '#111827', background: '#ffffff', outline: 'none', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>Rol</label>
            <select
              value={nuevoRol}
              onChange={(e) => {
                const rolElegido = e.target.value;
                setNuevoRol(rolElegido);
                if (rolElegido === 'Supervisor') {
                  setNuevaArea('direccion');
                } else if (nuevaArea === 'direccion') {
                  setNuevaArea('produccion');
                }
              }}
              style={{ width: '100%', border: '2px solid #d1d5db', borderRadius: '8px', padding: '10px', fontSize: '0.9rem', color: '#111827', background: '#ffffff', outline: 'none', fontWeight: '600', boxSizing: 'border-box' }}
            >
              <option value="Operario">Operario</option>
              <option value="Mantenimiento">Mantenimiento</option>
              <option value="Encargado">Encargado</option>
              <option value="Supervisor">Supervisor</option>
            </select>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: '800', color: '#111827', marginBottom: '8px' }}>Área</label>
            <select
              value={nuevaArea}
              onChange={(e) => setNuevaArea(e.target.value)}
              disabled={nuevoRol === 'Supervisor'}
              style={{ width: '100%', border: '2px solid #d1d5db', borderRadius: '8px', padding: '10px', fontSize: '0.9rem', color: '#111827', background: nuevoRol === 'Supervisor' ? '#f3f4f6' : '#ffffff', outline: 'none', fontWeight: '600', boxSizing: 'border-box' }}
            >
              {nuevoRol === 'Supervisor' ? (
                <option value="direccion">Dirección (General)</option>
              ) : (
                <>
                  <option value="produccion">Producción</option>
                  <option value="mantenimiento">Mantenimiento</option>
                  <option value="deposito">Depósito</option>
                </>
              )}
            </select>
          </div>
          <div>
            <button type="submit" style={{ width: '100%', background: usernameOriginal ? '#d97706' : '#10b981', color: '#ffffff', fontWeight: '700', padding: '11px 16px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '0.9rem', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
              {usernameOriginal ? 'Guardar Cambios' : 'Crear Usuario'}
            </button>
          </div>
        </form>
      </div>

      {/* Tabla de Usuarios */}
      <div style={{ background: '#ffffff', borderRadius: '12px', border: '1px solid #e5e7eb', overflow: 'hidden', boxShadow: '0 4px 6px rgba(0,0,0,0.04)' }}>
        <div style={{ padding: '18px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f9fafb', flexWrap: 'wrap', gap: '16px' }}>
          <h3 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#111827', margin: 0 }}>📋 Usuarios Registrados ({usuariosFiltrados.length})</h3>
          <input type="text" value={busqueda} onChange={(e) => setBusqueda(e.target.value)} placeholder="🔍 Buscar por apellido, nombre o usuario..." style={{ width: '300px', border: '2px solid #d1d5db', borderRadius: '8px', padding: '9px 12px', fontSize: '0.9rem', color: '#111827', background: '#ffffff', outline: 'none' }} />
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ background: '#f3f4f6', borderBottom: '2px solid #e5e7eb' }}>
                <th style={{ padding: '14px 18px', fontSize: '0.82rem', fontWeight: '800', color: '#1f2937', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Apellido y Nombre</th>
                <th style={{ padding: '14px 18px', fontSize: '0.82rem', fontWeight: '800', color: '#1f2937', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Usuario</th>
                <th style={{ padding: '14px 18px', fontSize: '0.82rem', fontWeight: '800', color: '#1f2937', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Rol</th>
                <th style={{ padding: '14px 18px', fontSize: '0.82rem', fontWeight: '800', color: '#1f2937', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Área</th>
                <th style={{ padding: '14px 18px', fontSize: '0.82rem', fontWeight: '800', color: '#1f2937', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>Estado</th>
                <th style={{ padding: '14px 18px', fontSize: '0.82rem', fontWeight: '800', color: '#1f2937', textTransform: 'uppercase', textAlign: 'right', whiteSpace: 'nowrap' }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {usuariosFiltrados.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#4b5563', fontWeight: '600', fontSize: '0.95rem' }}>
                    No se encontraron usuarios que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                usuariosFiltrados.map((user, index) => (
                  <tr key={user.username} style={{ borderBottom: '1px solid #e5e7eb', background: index % 2 === 0 ? '#ffffff' : '#fafafa' }}>
                    <td style={{ padding: '16px 18px', fontSize: '0.92rem', fontWeight: '700', color: '#111827', whiteSpace: 'nowrap' }}>
                      {user.apellido || user.nombre ? `${user.apellido || ''} ${user.nombre || ''}`.trim() : user.username}
                    </td>
                    <td style={{ padding: '16px 18px', fontSize: '0.88rem', fontWeight: '600', color: '#374151', fontFamily: 'monospace', whiteSpace: 'nowrap' }}>
                      {user.username}
                    </td>
                    <td style={{ padding: '16px 18px', fontSize: '0.88rem', fontWeight: '700', color: '#111827', textTransform: 'capitalize', whiteSpace: 'nowrap' }}>
                      {user.rol}
                    </td>
                    <td style={{ padding: '16px 18px', fontSize: '0.88rem', fontWeight: '600', color: '#0f766e', whiteSpace: 'nowrap' }}>
                      {ETIQUETAS_AREA[(user.area || '').toLowerCase()] || user.area || 'Producción'}
                    </td>
                    <td style={{ padding: '16px 18px', fontSize: '0.88rem', whiteSpace: 'nowrap' }}>
                      {user.bloqueado ? (
                        <span style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: '700', borderRadius: '999px', background: '#fee2e2', color: '#991b1b' }}>Bloqueado</span>
                      ) : (
                        <span style={{ padding: '4px 10px', fontSize: '0.75rem', fontWeight: '700', borderRadius: '999px', background: '#dcfce7', color: '#166534' }}>Activo</span>
                      )}
                    </td>
                    <td style={{ padding: '16px 18px', textAlign: 'right', whiteSpace: 'nowrap' }}>
                      {/* Botón Editar */}
                      <button onClick={() => iniciarEdicion(user)} style={{ background: '#fef3c7', color: '#92400e', fontWeight: '700', padding: '7px 12px', borderRadius: '6px', border: '1px solid #fde68a', cursor: 'pointer', marginRight: '6px', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        ✏️ Editar
                      </button>
                      {/* Botón Eliminar */}
                      <button type="button" onClick={() => handleEliminar(user.username)} style={{ background: '#dc2626', color: '#ffffff', fontWeight: '700', padding: '7px 12px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '0.85rem', boxShadow: '0 1px 2px rgba(0,0,0,0.05)' }}>
                        🗑️ Eliminar
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
