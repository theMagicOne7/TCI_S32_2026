import { useState } from 'react';
import { type TemaPaleta } from '../types/index';
import { API_BASE_URL, loginAPI, type LoginRespuesta } from '../data';

interface LoginPageProps {
  tema: TemaPaleta;
  esModoOscuro: boolean;
  onToggleTema: () => void;
  onLoginExitoso: (respuesta: LoginRespuesta) => void;
}

export function LoginPage({ tema, esModoOscuro, onToggleTema, onLoginExitoso }: LoginPageProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [modoRecuperacion, setModoRecuperacion] = useState(false);
  const [codigo, setCodigo] = useState('');
  const [nuevaPassword, setNuevaPassword] = useState('');
  const [codigoEnviado, setCodigoEnviado] = useState(false);
  const [mensaje, setMensaje] = useState<string | null>(null);

  const ingresar = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError(null);
    setCargando(true);
    try {
      onLoginExitoso(await loginAPI(username, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible iniciar sesión.');
    } finally {
      setCargando(false);
    }
  };

  const solicitarCodigo = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError(null);
    setMensaje(null);
    setCargando(true);
    try {
      const respuesta = await fetch(`${API_BASE_URL}/auth/recuperacion/solicitar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username }),
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(datos.detail || 'No fue posible enviar el código.');
      setCodigoEnviado(true);
      setMensaje(datos.mensaje);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible enviar el código.');
    } finally { setCargando(false); }
  };

  const confirmarRecuperacion = async (evento: React.FormEvent) => {
    evento.preventDefault();
    setError(null);
    setMensaje(null);
    setCargando(true);
    try {
      const respuesta = await fetch(`${API_BASE_URL}/auth/recuperacion/verificar`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, codigo, nueva_password: nuevaPassword }),
      });
      const datos = await respuesta.json().catch(() => ({}));
      if (!respuesta.ok) throw new Error(datos.detail || 'No fue posible validar el código.');
      setMensaje(datos.mensaje);
      setCodigoEnviado(false);
      setCodigo('');
      setNuevaPassword('');
      setModoRecuperacion(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No fue posible validar el código.');
    } finally { setCargando(false); }
  };

  const abrirRecuperacion = () => {
    setError(null); setMensaje(null); setCodigoEnviado(false); setModoRecuperacion(true);
  };

  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: '8px', border: `1px solid ${tema.borde}`, background: tema.fondoInput, color: tema.textoPrincipal, fontSize: '0.95rem' };
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '20px', background: tema.fondoPagina }}>
      <section style={{ width: '100%', maxWidth: '400px', padding: '28px', borderRadius: '16px', border: `1px solid ${tema.borde}`, background: tema.fondoTarjeta, boxShadow: esModoOscuro ? '0 14px 35px rgba(0,0,0,.5)' : '0 10px 28px rgba(13,148,136,.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div><span style={{ color: tema.acento, fontWeight: 700, fontSize: '.75rem', letterSpacing: '1px' }}>CLG · PLANTA FARMACÉUTICA</span><h1 style={{ margin: '4px 0 0', color: tema.textoPrincipal, fontSize: '1.35rem' }}>Acceso al sistema</h1></div>
          <button type="button" onClick={onToggleTema} style={{ border: `1px solid ${tema.borde}`, borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', background: tema.fondoInput, color: tema.textoPrincipal }}>{esModoOscuro ? '☀ Claro' : '🌙 Oscuro'}</button>
        </div>
        {error && <p style={{ margin: '0 0 14px', padding: '10px', borderRadius: '8px', color: '#991b1b', background: '#fee2e2' }}>{error}</p>}
        {mensaje && <p style={{ margin: '0 0 14px', padding: '10px', borderRadius: '8px', color: '#166534', background: '#dcfce7' }}>{mensaje}</p>}
        {!modoRecuperacion ? <form onSubmit={ingresar} style={{ display: 'grid', gap: '14px' }}>
          <label style={{ color: tema.textoPrincipal, fontWeight: 700, fontSize: '.85rem' }}>Usuario<input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus style={{ ...inputStyle, marginTop: '6px' }} placeholder="Ej: ceci" /></label>
          <label style={{ color: tema.textoPrincipal, fontWeight: 700, fontSize: '.85rem' }}>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ ...inputStyle, marginTop: '6px' }} /></label>
          <button disabled={cargando} type="submit" style={{ border: 0, borderRadius: '8px', padding: '12px', cursor: cargando ? 'wait' : 'pointer', fontWeight: 700, fontSize: '.95rem', background: tema.botonPrimario, color: tema.botonTexto }}>{cargando ? 'Verificando…' : 'Ingresar a planta'}</button>
          <button type="button" onClick={abrirRecuperacion} style={{ border: 0, background: 'transparent', color: tema.acento, cursor: 'pointer', fontWeight: 700, padding: '4px' }}>¿Olvidaste tu contraseña o se bloqueó tu usuario?</button>
        </form>
        : !codigoEnviado ? <form onSubmit={solicitarCodigo} style={{ display: 'grid', gap: '14px' }}>
          <p style={{ margin: 0, color: tema.textoSecundario, fontSize: '.9rem' }}>Ingresá tu usuario y enviaremos un código al correo que registró el supervisor.</p>
          <label style={{ color: tema.textoPrincipal, fontWeight: 700, fontSize: '.85rem' }}>Usuario<input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus style={{ ...inputStyle, marginTop: '6px' }} /></label>
          <button disabled={cargando} type="submit" style={{ border: 0, borderRadius: '8px', padding: '12px', fontWeight: 700, background: tema.botonPrimario, color: tema.botonTexto }}>{cargando ? 'Enviando…' : 'Enviar código al correo'}</button>
          <button type="button" onClick={() => setModoRecuperacion(false)} style={{ border: 0, background: 'transparent', color: tema.acento, cursor: 'pointer', fontWeight: 700 }}>Volver a iniciar sesión</button>
        </form>
        : <form onSubmit={confirmarRecuperacion} style={{ display: 'grid', gap: '14px' }}>
          <p style={{ margin: 0, color: tema.textoSecundario, fontSize: '.9rem' }}>Ingresá el código de seis dígitos recibido por correo y tu nueva contraseña.</p>
          <label style={{ color: tema.textoPrincipal, fontWeight: 700, fontSize: '.85rem' }}>Código<input value={codigo} onChange={(e) => setCodigo(e.target.value)} required inputMode="numeric" maxLength={6} style={{ ...inputStyle, marginTop: '6px' }} /></label>
          <label style={{ color: tema.textoPrincipal, fontWeight: 700, fontSize: '.85rem' }}>Nueva contraseña<input type="password" value={nuevaPassword} onChange={(e) => setNuevaPassword(e.target.value)} required minLength={6} style={{ ...inputStyle, marginTop: '6px' }} /></label>
          <button disabled={cargando} type="submit" style={{ border: 0, borderRadius: '8px', padding: '12px', fontWeight: 700, background: tema.botonPrimario, color: tema.botonTexto }}>{cargando ? 'Actualizando…' : 'Restablecer acceso'}</button>
        </form>}
      </section>
    </main>
  );
}
