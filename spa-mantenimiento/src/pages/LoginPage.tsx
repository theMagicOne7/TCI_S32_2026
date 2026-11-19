import { useState } from 'react';
import { type TemaPaleta } from '../types/index';
import { loginAPI, type LoginRespuesta } from '../data';

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

  const inputStyle: React.CSSProperties = { width: '100%', boxSizing: 'border-box', padding: '11px 12px', borderRadius: '8px', border: `1px solid ${tema.borde}`, background: tema.fondoInput, color: tema.textoPrincipal, fontSize: '0.95rem' };
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '20px', background: tema.fondoPagina }}>
      <section style={{ width: '100%', maxWidth: '400px', padding: '28px', borderRadius: '16px', border: `1px solid ${tema.borde}`, background: tema.fondoTarjeta, boxShadow: esModoOscuro ? '0 14px 35px rgba(0,0,0,.5)' : '0 10px 28px rgba(13,148,136,.12)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '16px', marginBottom: '20px' }}>
          <div><span style={{ color: tema.acento, fontWeight: 700, fontSize: '.75rem', letterSpacing: '1px' }}>CLG · PLANTA FARMACÉUTICA</span><h1 style={{ margin: '4px 0 0', color: tema.textoPrincipal, fontSize: '1.35rem' }}>Acceso al sistema</h1></div>
          <button type="button" onClick={onToggleTema} style={{ border: `1px solid ${tema.borde}`, borderRadius: '8px', padding: '7px 10px', cursor: 'pointer', background: tema.fondoInput, color: tema.textoPrincipal }}>{esModoOscuro ? '☀ Claro' : '🌙 Oscuro'}</button>
        </div>
        {error && <p style={{ margin: '0 0 14px', padding: '10px', borderRadius: '8px', color: '#991b1b', background: '#fee2e2' }}>{error}</p>}
        <form onSubmit={ingresar} style={{ display: 'grid', gap: '14px' }}>
          <label style={{ color: tema.textoPrincipal, fontWeight: 700, fontSize: '.85rem' }}>Usuario<input value={username} onChange={(e) => setUsername(e.target.value)} required autoFocus style={{ ...inputStyle, marginTop: '6px' }} placeholder="Ej: ceci" /></label>
          <label style={{ color: tema.textoPrincipal, fontWeight: 700, fontSize: '.85rem' }}>Contraseña<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required style={{ ...inputStyle, marginTop: '6px' }} /></label>
          <button disabled={cargando} type="submit" style={{ border: 0, borderRadius: '8px', padding: '12px', cursor: cargando ? 'wait' : 'pointer', fontWeight: 700, fontSize: '.95rem', background: tema.botonPrimario, color: tema.botonTexto }}>{cargando ? 'Verificando…' : 'Ingresar a planta'}</button>
        </form>
      </section>
    </main>
  );
}
