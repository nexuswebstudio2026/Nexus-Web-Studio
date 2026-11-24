import { useEffect, useState } from 'react';
import type { EmploymentRecord, EmploymentRecordType, EmploymentSector } from '../../../shared/types';
import { sortRecordsById } from '../../../shared/employment';
import { PublicPortrait } from '../../components/PublicPortrait';
import { usePublicData } from '../../context/PublicDataContext';

function chronology(record: EmploymentRecord) {
  return [record.chronology_start, record.chronology_end].filter(Boolean).join(' – ') || 'Fecha no especificada';
}

export function VidaLaboralPage() {
  const { settings } = usePublicData();
  const [records, setRecords] = useState<EmploymentRecord[]>([]);
  const [selectedType, setSelectedType] = useState<EmploymentRecordType | 'Todos'>('Todos');
  const [selectedSector, setSelectedSector] = useState<EmploymentSector | 'Todos'>('Todos');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;
    fetch('/api/public/employment-records')
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'No fue posible cargar la vida laboral.');
        if (active) setRecords(sortRecordsById(data.records || []));
      })
      .catch((reason) => { if (active) setError(reason instanceof Error ? reason.message : 'Error de conexión.'); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);

  const typeOrder: EmploymentRecordType[] = ['Empleado', 'Independiente', 'Contratista', 'Cargo público', 'Emprendimiento', 'Otro'];
  const sectorOrder: EmploymentSector[] = ['Público', 'Privado', 'Comunitario', 'Sin clasificar'];
  const availableTypes = typeOrder.filter((type) => records.some((record) => record.type === type));
  const availableSectors = sectorOrder.filter((sector) => records.some((record) => record.sector === sector));
  const filteredRecords = records.filter((record) =>
    (selectedType === 'Todos' || record.type === selectedType) &&
    (selectedSector === 'Todos' || record.sector === selectedSector));
  const countForType = (type: EmploymentRecordType | 'Todos') => records.filter((record) =>
    (type === 'Todos' || record.type === type) &&
    (selectedSector === 'Todos' || record.sector === selectedSector)).length;
  const countForSector = (sector: EmploymentSector | 'Todos') => records.filter((record) =>
    (sector === 'Todos' || record.sector === sector) &&
    (selectedType === 'Todos' || record.type === selectedType)).length;

  const filterButtonClass = (selected: boolean) => `inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${selected ? 'border-[var(--brand-green)] bg-[var(--brand-green)] text-white' : 'border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-ink)] hover:border-[var(--brand-green)]'}`;

  return (
    <article className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-10">
      <header className="border-b border-[var(--border-hairline)] pb-8">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_15rem] gap-8 items-center">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-widest uppercase text-[var(--accent-gold)]">Experiencia · Trayectoria laboral</p>
            <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[var(--text-ink)]">Vida laboral</h1>
            <p className="text-base text-[var(--text-muted)] max-w-prose leading-relaxed">
              Experiencia, responsabilidades y actividades profesionales registradas por Andrés Camilo Vidal Canchón.
            </p>
          </div>
          <PublicPortrait src={settings?.authorizedPhotoUrl} />
        </div>
      </header>

      {loading && <p className="p-6 rounded-xl border border-[var(--border-hairline)] text-sm text-[var(--text-muted)]">Cargando registros desde Google Sheets…</p>}
      {error && <p role="alert" className="p-6 rounded-xl border border-[var(--status-error)] text-sm text-[var(--status-error)]">{error}</p>}
      {!loading && !error && (records.length ? (
        <>
        <div className="space-y-6" aria-label="Filtros de vida laboral">
          <section className="space-y-3" aria-label="Filtrar por tipo de experiencia">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Filtrar por tipo</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Tipo de experiencia">
              {(['Todos', ...availableTypes] as Array<EmploymentRecordType | 'Todos'>).map((type) => {
                const selected = selectedType === type;
                return <button key={type} type="button" aria-pressed={selected} onClick={() => setSelectedType(type)} className={filterButtonClass(selected)}>
                  <span>{type}</span><span className={selected ? 'text-white/75' : 'text-[var(--text-muted)]'}>{countForType(type)}</span>
                </button>;
              })}
            </div>
          </section>
          <section className="space-y-3" aria-label="Filtrar por sector">
            <p className="text-xs font-semibold uppercase tracking-widest text-[var(--text-muted)]">Filtrar por sector</p>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Sector de experiencia">
              {(['Todos', ...availableSectors] as Array<EmploymentSector | 'Todos'>).map((sector) => {
                const selected = selectedSector === sector;
                return <button key={sector} type="button" aria-pressed={selected} onClick={() => setSelectedSector(sector)} className={filterButtonClass(selected)}>
                  <span>{sector === 'Todos' ? 'Todos los sectores' : `Sector ${sector.toLowerCase()}`}</span>
                  <span className={selected ? 'text-white/75' : 'text-[var(--text-muted)]'}>{countForSector(sector)}</span>
                </button>;
              })}
            </div>
          </section>
        </div>
        {filteredRecords.length ? <ol className="space-y-4">
          {filteredRecords.map((record) => (
            <li key={record.id} className="p-6 sm:p-7 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] space-y-3">
              <div className="flex flex-wrap gap-2 items-center text-xs text-[var(--text-muted)]">
                <span className="text-[var(--accent-gold)] uppercase tracking-wider font-semibold">{record.type}</span>
                <span aria-hidden="true">·</span><span>Sector {record.sector.toLowerCase()}</span>
                <span aria-hidden="true">·</span><span>{chronology(record)}</span>
                <span aria-hidden="true">·</span><span>{record.status}</span>
              </div>
              <h2 className="font-editorial text-2xl font-semibold text-[var(--text-ink)]">{record.title}</h2>
              {record.organization && <p className="text-sm font-medium text-[var(--text-ink)]">{record.organization}</p>}
              <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-prose leading-relaxed">{record.detail}</p>
            </li>
          ))}
        </ol> : <p className="p-6 rounded-xl border border-[var(--border-hairline)] text-sm text-[var(--text-muted)]">No hay registros públicos para la combinación seleccionada.</p>}
        </>
      ) : <p className="p-6 rounded-xl border border-[var(--border-hairline)] text-sm text-[var(--text-muted)]">Aún no hay registros laborales públicos.</p>)}
    </article>
  );
}
