import { ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

const PUBLIC_ROUTES = [
  { path: '/', title: 'Inicio', desc: 'Portada institucional, biografía breve y marco visual autorizado.' },
  { path: '/vida-academica', title: 'Vida académica', desc: 'Estudios, programas, cursos, diplomados y conocimientos registrados.' },
  { path: '/vida-laboral', title: 'Vida laboral', desc: 'Experiencia profesional, cargos y actividades registradas.' },
  { path: '/vida-politica', title: 'Vida política', desc: 'Etapas en la JAC, hitos comunitarios, aspiración 2027 y proyección condicional.' },
  { path: '/proyectos', title: 'Proyectos', desc: 'Junta de Acción Comunal, Nexus Web Studio y proyecto hacia edil.' },
  { path: '/historia', title: 'Biografía', desc: 'Línea temporal completa y verificada.' },
];

export function AdminPublicSiteTab() {
  return (
    <div className="space-y-6">
      <header className="space-y-1">
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[var(--text-ink)]">
          Sitio público
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Navegación directa hacia todas las rutas públicas. Solo se muestran los registros marcados con visibilidad pública.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {PUBLIC_ROUTES.map((route) => (
          <Link
            key={route.path}
            to={route.path}
            className="p-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] hover:border-[var(--accent-gold)] transition-colors flex items-start justify-between gap-4"
          >
            <div className="space-y-1">
              <p className="font-mono-tabular text-xs text-[var(--accent-gold)]">{route.path}</p>
              <h2 className="font-editorial text-2xl font-semibold text-[var(--text-ink)]">
                {route.title}
              </h2>
              <p className="text-xs text-[var(--text-muted)] leading-relaxed">{route.desc}</p>
            </div>
            <ExternalLink className="w-4 h-4 text-[var(--brand-green)] shrink-0 mt-1" aria-hidden="true" />
          </Link>
        ))}
      </div>
    </div>
  );
}
