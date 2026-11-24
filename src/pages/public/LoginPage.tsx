import React, { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export function LoginPage() {
  const { session, loading, login, setupInitialAdmin, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const fromState = (location.state as { from?: { pathname?: string; search?: string } } | null)?.from;
  const redirectTarget =
    fromState?.pathname && fromState.pathname.startsWith('/dashboard')
      ? `${fromState.pathname}${fromState.search ?? ''}`
      : '/dashboard';

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryCode, setRecoveryCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [error, setError] = useState<string | null>(() =>
    searchParams.get('motivo') === 'sesion'
      ? 'Tu sesión administrativa expiró o no pudo validarse. Inicia sesión nuevamente para ingresar al panel.'
      : null
  );

  const isSetupMode = !loading && session.needsInitialSetup;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!username.trim() || !password) {
      setError('Completa tu usuario y contraseña.');
      return;
    }

    if (isSetupMode) {
      if (password.length < 8) {
        setError('La contraseña inicial debe tener al menos 8 caracteres.');
        return;
      }
      if (password !== confirmPassword) {
        setError('Las contraseñas no coinciden.');
        return;
      }
    }

    setSubmitting(true);
    const res = isSetupMode
      ? await setupInitialAdmin(username, password)
      : await login(username, password);
    setSubmitting(false);

    if (!res.ok) {
      setError(res.error || 'No fue posible autenticar.');
      return;
    }
    navigate(redirectTarget, { replace: true });
  };

  const beginRecovery = async () => {
    setError(null);
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/recovery/request', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: '{}',
      });
      const data = await response.json() as { code?: string; username?: string; error?: string };
      if (!response.ok || !data.code) {
        setError(data.error || 'No fue posible iniciar la recuperación local.');
        return;
      }
      setRecoveryCode(data.code);
      setUsername(data.username || '');
      setRecoveryMode(true);
    } catch {
      setError('No se pudo conectar con el servidor local.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRecoverySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (newPassword.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    setSubmitting(true);
    try {
      const response = await fetch('/api/auth/recovery/reset', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: recoveryCode, newPassword }),
      });
      const data = await response.json() as { username?: string; error?: string };
      if (!response.ok || !data.username) {
        setError(data.error || 'No se pudo restablecer la contraseña.');
        setSubmitting(false);
        return;
      }
      const loginResult = await login(data.username, newPassword);
      if (loginResult.ok) {
        navigate(redirectTarget, { replace: true });
        return;
      }
      setRecoveryMode(false);
      setPassword('');
      setError('La contraseña se restableció. Inicia sesión con la nueva clave.');
    } catch {
      setError('No se pudo conectar con el servidor local.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-sm text-[var(--text-muted)]">
        Verificando estado de sesión...
      </div>
    );
  }

  if (session.authenticated) {
    return (
      <div className="max-w-lg mx-auto px-4 py-16">
        <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-8 space-y-5">
          <p className="text-xs uppercase tracking-widest text-[var(--accent-gold)] font-medium">
            Sesión activa
          </p>
          <h1 className="font-editorial text-3xl font-semibold text-[var(--text-ink)]">
            Bienvenido, {session.username}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Tu sesión administrativa está activa mediante cookie segura HttpOnly. Puedes ingresar al panel privado o cerrar sesión.
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <Link
              to="/dashboard"
              className="px-5 py-2.5 rounded-md text-sm font-semibold bg-[var(--brand-green)] text-white dark:text-[#0b140f] hover:bg-[var(--brand-green-hover)]"
            >
              Ir al panel privado
            </Link>
            <button
              type="button"
              onClick={() => void logout()}
              className="px-5 py-2.5 rounded-md text-sm font-semibold border border-[var(--border-hairline)] text-[var(--text-ink)] hover:bg-[var(--bg-surface)] cursor-pointer"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-14 sm:py-20">
      <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-6 sm:p-8 space-y-6">
        <header className="space-y-2">
          <p className="text-xs uppercase tracking-widest text-[var(--accent-gold)] font-medium">
            {isSetupMode ? 'Configuración inicial' : 'Panel privado'}
          </p>
          <h1 className="font-editorial text-3xl font-semibold text-[var(--text-ink)]">
            {isSetupMode ? 'Crear acceso de administrador' : 'Iniciar sesión'}
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            {isSetupMode
              ? 'Define el usuario y contraseña iniciales para administrar el panel.'
              : 'Ingresa con las credenciales administrativas configuradas para gestionar trayectoria, base de datos y auditorías.'}
          </p>
        </header>

        {error && (
          <div
            role="alert"
            className="p-3.5 rounded-lg border border-[var(--status-error)] text-xs text-[var(--status-error)] bg-[var(--bg-canvas)]"
          >
            {error}
          </div>
        )}

        {recoveryMode ? (
          <div className="space-y-5">
            <div className="rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4 space-y-2">
              <p className="text-sm font-semibold text-[var(--text-ink)]">Código temporal de recuperación</p>
              <code className="block break-all rounded bg-[var(--bg-elevated)] p-3 text-xs text-[var(--accent-gold)] select-all">{recoveryCode}</code>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">Vence en 10 minutos y solo sirve desde este equipo. No lo compartas.</p>
            </div>
            <form onSubmit={handleRecoverySubmit} className="space-y-4" noValidate>
              <div className="space-y-1.5">
                <label htmlFor="recovery-new-password" className="block text-xs font-semibold text-[var(--text-ink)]">Nueva contraseña</label>
                <div className="relative">
                  <input id="recovery-new-password" type={showNewPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full px-3.5 pr-10 py-2.5 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-ink)]" />
                  <button type="button" onClick={() => setShowNewPassword((shown) => !shown)} aria-label={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} title={showNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-ink)] cursor-pointer">
                    {showNewPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <div className="space-y-1.5">
                <label htmlFor="recovery-confirm-password" className="block text-xs font-semibold text-[var(--text-ink)]">Confirmar nueva contraseña</label>
                <div className="relative">
                  <input id="recovery-confirm-password" type={showConfirmNewPassword ? 'text' : 'password'} autoComplete="new-password" required minLength={8} value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} className="w-full px-3.5 pr-10 py-2.5 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-ink)]" />
                  <button type="button" onClick={() => setShowConfirmNewPassword((shown) => !shown)} aria-label={showConfirmNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} title={showConfirmNewPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-ink)] cursor-pointer">
                    {showConfirmNewPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                  </button>
                </div>
              </div>
              <button type="submit" disabled={submitting} className="w-full py-2.5 px-4 rounded-md text-sm font-semibold bg-[var(--brand-green)] text-white dark:text-[#0b140f] hover:bg-[var(--brand-green-hover)] disabled:opacity-60 transition-colors cursor-pointer">
                {submitting ? 'Restableciendo...' : 'Restablecer contraseña y entrar'}
              </button>
              <button type="button" onClick={() => { setRecoveryMode(false); setError(null); }} className="w-full py-2 text-sm text-[var(--text-muted)] hover:text-[var(--text-ink)] cursor-pointer">Volver al inicio de sesión</button>
            </form>
          </div>
        ) : (
        <>
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          <div className="space-y-1.5">
            <label htmlFor="login-username" className="block text-xs font-semibold text-[var(--text-ink)]">
              Usuario administrador
            </label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-ink)]"
              placeholder="Usuario"
            />
          </div>

          <div className="space-y-1.5">
            <label htmlFor="login-password" className="block text-xs font-semibold text-[var(--text-ink)]">
              Contraseña
            </label>
            <div className="relative">
              <input
                id="login-password"
                type={showPassword ? 'text' : 'password'}
                autoComplete={isSetupMode ? 'new-password' : 'current-password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3.5 pr-10 py-2.5 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-ink)]"
                placeholder="Contraseña"
              />
              <button type="button" onClick={() => setShowPassword((shown) => !shown)} aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} title={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-ink)] cursor-pointer">
                {showPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
              </button>
            </div>
          </div>

          {isSetupMode && (
            <div className="space-y-1.5">
              <label
                htmlFor="login-confirm-password"
                className="block text-xs font-semibold text-[var(--text-ink)]"
              >
                Confirmar contraseña
              </label>
              <div className="relative">
                <input
                  id="login-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-3.5 pr-10 py-2.5 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-ink)]"
                />
                <button type="button" onClick={() => setShowConfirmPassword((shown) => !shown)} aria-label={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} title={showConfirmPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'} className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-ink)] cursor-pointer">
                  {showConfirmPassword ? <EyeOff size={17} aria-hidden="true" /> : <Eye size={17} aria-hidden="true" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full py-2.5 px-4 rounded-md text-sm font-semibold bg-[var(--brand-green)] text-white dark:text-[#0b140f] hover:bg-[var(--brand-green-hover)] disabled:opacity-60 transition-colors cursor-pointer"
          >
            {submitting
              ? 'Verificando...'
              : isSetupMode
                ? 'Registrar y entrar al panel'
                : 'Ingresar al panel'}
          </button>
        </form>
        {!isSetupMode && !session.envConfigured && (
          <button type="button" onClick={() => void beginRecovery()} disabled={submitting} className="w-full text-sm text-[var(--text-muted)] hover:text-[var(--accent-gold)] disabled:opacity-60 cursor-pointer">
            {submitting ? 'Preparando recuperación...' : '¿Olvidaste tu contraseña?'}
          </button>
        )}
        </>
        )}
      </div>
    </div>
  );
}
