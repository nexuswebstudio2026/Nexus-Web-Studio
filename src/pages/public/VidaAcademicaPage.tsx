import { useEffect, useState } from 'react';
import type { AcademicRecord, AcademicRecordType } from '../../../shared/types';
import { PublicPortrait } from '../../components/PublicPortrait';
import { usePublicData } from '../../context/PublicDataContext';

function chronology(record: AcademicRecord) {
  return [record.chronology_start, record.chronology_end].filter(Boolean).join(' – ') || 'Fecha no especificada';
}

function drivePreviewUrl(url: string) {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !['drive.google.com', 'docs.google.com'].includes(parsed.hostname)) return '';
    const fileId = parsed.pathname.match(/\/file\/d\/([^/]+)/)?.[1] || parsed.searchParams.get('id');
    return fileId ? `https://drive.google.com/file/d/${encodeURIComponent(fileId)}/preview` : url;
  } catch {
    return '';
  }
}

export function VidaAcademicaPage() {
  const { settings } = usePublicData();
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [selectedType, setSelectedType] = useState<AcademicRecordType | 'Todos'>('Todos');
  const [previewRecord, setPreviewRecord] = useState<AcademicRecord | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/public/academic-records')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No fue posible cargar la vida académica.');
        if (active) setRecords(data.records || []);
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Error de conexión.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const typeOrder: AcademicRecordType[] = ['Pregrado', 'Posgrado', 'Curso', 'Seminario', 'Diplomado', 'Bachillerato', 'Primaria', 'Área de conocimiento', 'Otro'];
  const availableTypes = typeOrder.filter((type) => records.some((record) => record.type === type));
  const filteredRecords = selectedType === 'Todos'
    ? records
    : records.filter((record) => record.type === selectedType);
  const countForType = (type: AcademicRecordType | 'Todos') => type === 'Todos'
    ? records.length
    : records.filter((record) => record.type === type).length;

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      <header className="border-b border-[var(--border-hairline)] pb-8">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_15rem] gap-8 items-center">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-widest uppercase text-[var(--accent-gold)]">Formación · Registro académico</p>
            <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[var(--text-ink)]">Vida académica</h1>
            <p className="text-base text-[var(--text-muted)] max-w-prose leading-relaxed">
              Estudios, programas en curso, cursos, diplomados y áreas de conocimiento registrados por Andrés Camilo Vidal Canchón.
            </p>
          </div>
          <PublicPortrait src={settings?.authorizedPhotoUrl} />
        </div>
      </header>

      {loading && <p className="p-6 rounded-xl border border-[var(--border-hairline)] text-sm text-[var(--text-muted)]">Cargando registros desde Google Sheets…</p>}
      {error && <p role="alert" className="p-6 rounded-xl border border-[var(--status-error)] text-sm text-[var(--status-error)]">{error}</p>}
      {!loading && !error && (records.length ? (
        <>
        <section className="space-y-3" aria-label="Filtrar registros por tipo">
          <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Filtrar por tipo</p>
          <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de formación">
            {(['Todos', ...availableTypes] as Array<AcademicRecordType | 'Todos'>).map((type) => {
              const selected = selectedType === type;
              return <button
                key={type}
                type="button"
                aria-pressed={selected}
                onClick={() => setSelectedType(type)}
                className={`inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${selected ? 'border-[var(--brand-green)] bg-[var(--brand-green)] text-white' : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-ink)] hover:border-[var(--brand-green)]'}`}
              >
                <span>{type}</span><span className={selected ? 'text-white/75' : 'text-[var(--text-muted)]'}>{countForType(type)}</span>
              </button>;
            })}
          </div>
        </section>
        {filteredRecords.length ? <ol className="space-y-4">
          {filteredRecords.map((record) => (
            <li key={record.id} className="p-6 sm:p-7 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] space-y-3">
              <div className="flex flex-wrap gap-2 items-center text-xs text-[var(--text-muted)]">
                <span className="text-[var(--accent-gold)] uppercase tracking-wider font-semibold">{record.type}</span>
                <span aria-hidden="true">·</span><span>{chronology(record)}</span>
                <span aria-hidden="true">·</span><span>{record.status}</span>
              </div>
              <h2 className="font-editorial text-2xl font-semibold text-[var(--text-ink)]">{record.title}</h2>
              {record.institution && <p className="text-sm font-medium text-[var(--text-ink)]">{record.institution}</p>}
              <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-prose leading-relaxed">{record.detail}</p>
              {record.support_url && <button type="button" onClick={() => setPreviewRecord(record)} className="inline-flex items-center rounded-md border border-[var(--brand-green)] px-4 py-2 text-sm font-medium text-[var(--brand-green)] hover:bg-[var(--brand-green)] hover:text-white transition-colors">Ver certificado PDF</button>}
            </li>
          ))}
        </ol> : <p className="p-6 rounded-xl border border-[var(--border-hairline)] text-sm text-[var(--text-muted)]">No hay registros públicos para el tipo {selectedType}.</p>}
        </>
      ) : <p className="p-6 rounded-xl border border-[var(--border-hairline)] text-sm text-[var(--text-muted)]">Aún no hay registros académicos públicos.</p>)}
      {previewRecord && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-3 sm:p-6" onMouseDown={(event) => { if (event.target === event.currentTarget) setPreviewRecord(null); }} onKeyDown={(event) => { if (event.key === 'Escape') setPreviewRecord(null); }}>
        <section role="dialog" aria-modal="true" aria-labelledby="academic-pdf-title" className="flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-canvas)] shadow-2xl">
          <header className="flex items-start justify-between gap-4 border-b border-[var(--border-hairline)] p-4 sm:p-5">
            <div><p className="text-xs font-semibold uppercase tracking-widest text-[var(--accent-gold)]">Soporte académico</p><h2 id="academic-pdf-title" className="mt-1 font-editorial text-xl font-semibold text-[var(--text-ink)]">{previewRecord.title}</h2></div>
            <button type="button" onClick={() => setPreviewRecord(null)} aria-label="Cerrar visor del certificado" className="rounded-md border border-[var(--border-hairline)] px-3 py-2 text-sm">Cerrar</button>
          </header>
          {drivePreviewUrl(previewRecord.support_url) ? <iframe src={drivePreviewUrl(previewRecord.support_url)} title={`Certificado PDF: ${previewRecord.title}`} className="min-h-[55vh] flex-1 bg-white" allow="autoplay" /> : <p className="p-6 text-sm text-[var(--text-muted)]">El enlace de soporte no es una URL válida de Google Drive.</p>}
          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-hairline)] p-4 text-xs text-[var(--text-muted)]">
            <span>Google Drive conserva los permisos actuales del archivo. Si solicita acceso, ábrelo con una cuenta autorizada.</span>
            <a href={previewRecord.support_url} target="_blank" rel="noreferrer" className="font-semibold text-[var(--brand-green)] underline">Abrir en Google Drive</a>
          </footer>
        </section>
      </div>}
    </article>
  );
}
