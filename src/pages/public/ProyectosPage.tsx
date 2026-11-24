import { Building2, Code2, FolderKanban, Landmark } from 'lucide-react';
import { useEffect, useState } from 'react';
import type { ProjectRecord } from '../../../shared/types';
import { sortProjectRecords } from '../../../shared/projects';
import { PublicPortrait } from '../../components/PublicPortrait';
import { usePublicData } from '../../context/PublicDataContext';

const TYPE_ICONS = {
  'Junta de Acción Comunal': Building2,
  'Nexus Web Studio': Code2,
  'Campaña política como edil': Landmark,
  Otro: FolderKanban,
} as const;

function chronology(record: ProjectRecord) {
  return [record.chronology_start, record.chronology_end].filter(Boolean).join(' – ') || 'Fecha no especificada';
}

export function ProyectosPage() {
  const { settings } = usePublicData();
  const [records, setRecords] = useState<ProjectRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/public/project-records', { headers: { Accept: 'application/json' } })
      .then(async (response) => {
        if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) {
          throw new Error('El servidor respondió con una página web en lugar de los proyectos.');
        }
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No fue posible cargar los proyectos.');
        if (active) setRecords(sortProjectRecords(data.records || []));
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Error de conexión.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      <header className="border-b border-[var(--border-hairline)] pb-8">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_15rem] gap-8 items-center">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-widest uppercase text-[var(--accent-gold)]">Iniciativas · Gestión y desarrollo</p>
            <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[var(--text-ink)]">Proyectos</h1>
            <p className="text-base text-[var(--text-muted)] max-w-prose leading-relaxed">
              Proyectos de la Junta de Acción Comunal, Nexus Web Studio y la campaña cívica registrados por Andrés Camilo Vidal Canchón. Esta sección se actualiza con la información publicada desde el panel administrativo.
            </p>
          </div>
          <PublicPortrait src={settings?.authorizedPhotoUrl} />
        </div>
      </header>

      {loading && <p className="p-6 rounded-xl border border-[var(--border-hairline)] text-sm text-[var(--text-muted)]">Cargando proyectos desde Google Sheets…</p>}
      {error && <p role="alert" className="p-6 rounded-xl border border-[var(--status-error)] text-sm text-[var(--status-error)]">{error}</p>}
      {!loading && !error && (records.length ? (
        <ol className="space-y-4">
          {records.map((record) => {
            const Icon = TYPE_ICONS[record.type] || FolderKanban;
            return (
              <li key={record.id} className="p-6 sm:p-7 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] space-y-3">
                <div className="flex flex-wrap gap-2 items-center text-xs text-[var(--text-muted)]">
                  <Icon className="w-4 h-4 text-[var(--brand-green)]" aria-hidden="true" />
                  <span className="text-[var(--accent-gold)] uppercase tracking-wider font-semibold">{record.type}</span>
                  <span aria-hidden="true">·</span><span>{chronology(record)}</span>
                  <span aria-hidden="true">·</span><span>{record.status}</span>
                </div>
                <h2 className="font-editorial text-2xl font-semibold text-[var(--text-ink)]">{record.title}</h2>
                {record.organization && <p className="text-sm font-medium text-[var(--text-ink)]">{record.organization}</p>}
                <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-prose leading-relaxed">{record.detail}</p>
              </li>
            );
          })}
        </ol>
      ) : <p className="p-6 rounded-xl border border-[var(--border-hairline)] text-sm text-[var(--text-muted)]">Aún no hay proyectos públicos registrados.</p>)}
    </article>
  );
}
