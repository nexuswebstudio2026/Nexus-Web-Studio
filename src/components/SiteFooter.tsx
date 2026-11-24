import { Link } from 'react-router-dom';
import type { AuthSessionState, SiteSettings } from '../../shared/types';
import { SocialLinksBar } from './SocialLinksBar';

interface SiteFooterProps {
  session: AuthSessionState;
  settings: SiteSettings | null;
  loading?: boolean;
  error?: string | null;
}

export function SiteFooter({ session, settings, loading = false, error = null }: SiteFooterProps) {
  return (
    <footer className="mt-4 border-t border-[var(--border-hairline)] bg-[var(--bg-surface)]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          <div className="space-y-2 max-w-md">
            <p className="font-editorial text-xl font-semibold text-[var(--text-ink)]">
              Andrés Camilo Vidal Canchón
            </p>
            <p className="text-sm text-[var(--text-muted)] leading-relaxed">
              Archivo biográfico, trayectoria comunitaria y proyecto cívico orientado a la Comuna 8 de Pasto. Información verificada y administrada desde el panel oficial.
            </p>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-medium tracking-wider uppercase text-[var(--text-muted)]">
              Canales públicos
            </p>
            {settings ? (
              <SocialLinksBar links={settings.socialLinks} />
            ) : loading ? (
              <p className="text-sm text-[var(--text-muted)]">Cargando canales...</p>
            ) : (
              <p className="text-sm text-[var(--text-muted)]" role={error ? 'status' : undefined}>
                No se pudieron cargar los canales públicos.
              </p>
            )}
          </div>
        </div>

        <div className="pt-6 border-t border-[var(--border-hairline)] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs text-[var(--text-muted)]">
          <p>© {new Date().getFullYear()} Andrés Camilo Vidal Canchón. Todos los derechos reservados.</p>
          <div className="flex items-center gap-4">
            <Link to="/historia" className="hover:text-[var(--text-ink)]">
              Biografía completa
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/vida-politica" className="hover:text-[var(--text-ink)]">
              Trayectoria comunitaria
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/vida-academica" className="hover:text-[var(--text-ink)]">
              Vida académica
            </Link>
            <span aria-hidden="true">·</span>
            <Link to="/vida-laboral" className="hover:text-[var(--text-ink)]">
              Vida laboral
            </Link>
            <span aria-hidden="true">·</span>
            <Link to={session.authenticated ? '/dashboard' : '/iniciar-sesion'} className="hover:text-[var(--text-ink)]">
              {session.authenticated ? 'Panel privado' : 'Acceso administrativo'}
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
