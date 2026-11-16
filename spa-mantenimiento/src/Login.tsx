import { useState } from 'react';
import { type TemaPaleta } from './types/index';

interface LoginProps {
  tema: TemaPaleta;
  esModoOscuro: boolean;
  onToggleTema: () => void;
  onLoginExitoso: (token: string, usuario: string, rol: string) => void;
}

export function Login({
  tema,
  esModoOscuro,
  onToggleTema,
  onLoginExitoso
}: LoginProps) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [codigo2fa, setCodigo2fa] = useState('');
  const [captchaOk, setCaptchaOk] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  const manejarSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!captchaOk) {
      setError('Completá la verificación de humano (Captcha).');
      return;
    }

    setCargando(true);
    try {
      const res = await fetch('http://localhost:8001/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username,
          password,
          codigo_2fa: codigo2fa || null,
          token_captcha: 'captcha-validado'
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || 'Credenciales inválidas');
      }

      // Guardamos la sesión en el navegador
      localStorage.setItem('token_acceso', data.access_token);
      localStorage.setItem('usuario_actual', data.usuario);
      localStorage.setItem('rol_actual', data.rol);

      // Le avisamos a App.tsx para que abra la aplicación
      onLoginExitoso(data.access_token, data.usuario, data.rol);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
        background: tema.fondoPagina,
        fontFamily: 'system-ui, -apple-system, sans-serif',
        transition: 'background-color 0.3s ease'
      }}
    >
      <main
        style={{
          width: '100%',
          maxWidth: '400px',
          padding: '24px',
          border: `1px solid ${tema.borde}`,
          borderRadius: '16px',
          background: tema.fondoTarjeta,
          color: tema.textoPrincipal,
          boxShadow: esModoOscuro
            ? '0 10px 30px rgba(0, 0, 0, 0.45)'
            : '0 8px 24px rgba(13, 148, 136, 0.08)'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '18px'
          }}
        >
          <div>
            <span
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                letterSpacing: '1px',
                textTransform: 'uppercase',
                color: '#0d9488'
              }}
            >
              Control de Acceso
            </span>
            <h2
              style={{
                margin: '2px 0 0 0',
                fontSize: '1.25rem',
                color: tema.textoPrincipal
              }}
            >
              Planta Farmacéutica
            </h2>
          </div>

          <button
            type="button"
            onClick={onToggleTema}
            style={{
              background: tema.fondoInput,
              color: tema.textoPrincipal,
              border: `1px solid ${tema.borde}`,
              padding: '6px 10px',
              borderRadius: '20px',
              cursor: 'pointer',
              fontSize: '0.75rem',
              fontWeight: 600
            }}
          >
            {esModoOscuro ? '☀️ Claro' : '🌙 Oscuro'}
          </button>
        </div>

        {error && (
          <div
            style={{
              background: esModoOscuro ? '#2a1215' : '#fee2e2',
              color: esModoOscuro ? '#fecaca' : '#991b1b',
              border: '1px solid #ef4444',
              padding: '10px',
              borderRadius: '8px',
              marginBottom: '14px',
              fontSize: '0.85rem',
              fontWeight: 600
            }}
          >
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={manejarSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <input
            type="text"
            placeholder="Usuario"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: `1px solid ${tema.borde}`,
              background: tema.fondoInput,
              color: tema.textoPrincipal,
              outline: 'none'
            }}
          />

          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: `1px solid ${tema.borde}`,
              background: tema.fondoInput,
              color: tema.textoPrincipal,
              outline: 'none'
            }}
          />

          <input
            type="text"
            placeholder="Código 2FA (opcional)"
            value={codigo2fa}
            onChange={(e) => setCodigo2fa(e.target.value)}
            style={{
              padding: '10px 12px',
              borderRadius: '8px',
              border: `1px solid ${tema.borde}`,
              background: tema.fondoInput,
              color: tema.textoPrincipal,
              outline: 'none'
            }}
          />

          <label
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '10px',
              borderRadius: '8px',
              border: `1px solid ${tema.borde}`,
              background: tema.fondoInput,
              color: tema.textoSecundario,
              fontSize: '0.85rem',
              cursor: 'pointer'
            }}
          >
            <input
              type="checkbox"
              checked={captchaOk}
              onChange={(e) => setCaptchaOk(e.target.checked)}
            />
            <span>No soy un robot (Captcha)</span>
          </label>

          <button
            type="submit"
            disabled={cargando}
            style={{
              padding: '12px',
              background: '#0f766e',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontWeight: 700,
              cursor: cargando ? 'not-allowed' : 'pointer',
              marginTop: '4px'
            }}
          >
            {cargando ? 'Validando...' : 'Ingresar'}
          </button>
        </form>
      </main>
    </div>
  );
}