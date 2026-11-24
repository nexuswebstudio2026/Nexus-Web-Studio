import { Menu, X } from 'lucide-react';
import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePublicData } from '../context/PublicDataContext';
import { SiteFooter } from './SiteFooter';

export function PublicLayout({ children }: { children: React.ReactNode }) {
  const { session, logout } = useAuth();
  const { settings, loading, error } = usePublicData();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    setMobileMenuOpen(false);
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
      isActive
        ? 'border-[var(--accent-gold)] text-[var(--text-ink)]'
        : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-ink)] hover:border-[var(--border-hairline)]'
    }`;

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-canvas)] text-[var(--text-ink)]">
      <a
        href="#contenido-principal"
        className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-50 focus:px-4 focus:py-2 focus:bg-[var(--brand-green)] focus:text-white focus:rounded"
      >
        Ir al contenido principal
      </a>

      <header className="border-b border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand wordmark (single line, no descriptor) */}
          <Link
            to="/"
            className="font-editorial text-xl sm:text-2xl font-semibold tracking-tight text-[var(--text-ink)] whitespace-nowrap shrink-0"
          >
            Andrés Camilo Vidal
          </Link>

          {/* Zone 2: Concise navigation links */}
          <nav
            aria-label="Navegación principal"
            className="hidden lg:flex items-center gap-6"
          >
            <NavLink to="/" end className={navLinkClass}>
              Inicio
            </NavLink>
            <NavLink to="/vida-academica" className={navLinkClass}>
              Vida académica
            </NavLink>
            <NavLink to="/vida-laboral" className={navLinkClass}>
              Vida laboral
            </NavLink>
            <NavLink to="/vida-politica" className={navLinkClass}>
              Vida política
            </NavLink>
            <NavLink to="/proyectos" className={navLinkClass}>
              Proyectos
            </NavLink>
            <NavLink to="/historia" className={navLinkClass}>
              Biografía
            </NavLink>
            {session.authenticated && (
              <NavLink to="/dashboard" className={navLinkClass}>
                Panel
              </NavLink>
            )}
          </nav>

          {/* Zone 3: 1 primary action + mobile menu trigger */}
          <div className="flex items-center gap-3 shrink-0">
            {session.authenticated ? (
              <button
                type="button"
                onClick={handleLogout}
                className="hidden lg:inline-flex items-center px-4 py-2 text-xs font-semibold rounded-md border border-[var(--border-hairline)] text-[var(--text-ink)] hover:bg-[var(--bg-surface)] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                Cerrar sesión
              </button>
            ) : (
              <Link
                to="/iniciar-sesion"
                className="hidden lg:inline-flex items-center px-4 py-2 text-xs font-semibold rounded-md bg-[var(--brand-green)] text-white dark:text-[#0b140f] hover:bg-[var(--brand-green-hover)] transition-colors whitespace-nowrap shrink-0"
              >
                Iniciar sesión
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((v) => !v)}
              aria-expanded={mobileMenuOpen}
              aria-controls="menu-movil"
              aria-label={mobileMenuOpen ? 'Cerrar menú de navegación' : 'Abrir menú de navegación'}
              className="lg:hidden inline-flex items-center justify-center w-11 h-11 rounded-md border border-[var(--border-hairline)] text-[var(--text-ink)] hover:bg-[var(--bg-surface)] cursor-pointer"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {mobileMenuOpen && (
          <nav
            id="menu-movil"
            aria-label="Navegación móvil"
            className="lg:hidden border-t border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-4 py-4 space-y-2"
          >
            {[
              { to: '/', label: 'Inicio' },
              { to: '/vida-academica', label: 'Vida académica' },
              { to: '/vida-laboral', label: 'Vida laboral' },
              { to: '/vida-politica', label: 'Vida política' },
              { to: '/proyectos', label: 'Proyectos' },
              { to: '/historia', label: 'Biografía' },
            ].map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.to === '/'}
                onClick={() => setMobileMenuOpen(false)}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-md text-sm font-medium ${
                    isActive
                      ? 'bg-[var(--brand-green-soft)] text-[var(--text-ink)]'
                      : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface)]'
                  }`
                }
              >
                {item.label}
              </NavLink>
            ))}

            {session.authenticated ? (
              <>
                <NavLink
                  to="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-md text-sm font-medium text-[var(--brand-green)] hover:bg-[var(--bg-surface)]"
                >
                  Panel administrativo
                </NavLink>
                <button
                  type="button"
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2.5 rounded-md text-sm font-semibold text-[var(--text-ink)] border border-[var(--border-hairline)] hover:bg-[var(--bg-surface)] cursor-pointer"
                >
                  Cerrar sesión
                </button>
              </>
            ) : (
              <Link
                to="/iniciar-sesion"
                onClick={() => setMobileMenuOpen(false)}
                className="block text-center px-4 py-2.5 rounded-md text-sm font-semibold bg-[var(--brand-green)] text-white dark:text-[#0b140f]"
              >
                Iniciar sesión
              </Link>
            )}
          </nav>
        )}
      </header>

      <main id="contenido-principal">
        {children}
      </main>

      <SiteFooter session={session} settings={settings} loading={loading} error={error} />
    </div>
  );
}
