import { useState } from 'react';
import type { CommunityManagementRecord } from '../../../shared/types';
import type { PoliticalRecord } from '../../../shared/types';
import { formatRecordChronology } from '../../../shared/records';
import { PublicPortrait } from '../../components/PublicPortrait';
import { usePublicData } from '../../context/PublicDataContext';

function RecordRow({ item }: { item: PoliticalRecord }) {
  return (
    <li className="py-5 border-b border-[var(--border-hairline)] last:border-b-0 space-y-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)]">
        <span className="font-mono-tabular font-medium text-[var(--accent-gold)]">
          {formatRecordChronology(item)}
        </span>
        <span aria-hidden="true">·</span>
        <span>{item.status}</span>
      </div>
      <h3 className="font-editorial text-2xl font-semibold text-[var(--text-ink)]">
        {item.title}
      </h3>
      <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-prose leading-relaxed">
        {item.detail}
      </p>
    </li>
  );
}

export function VidaPoliticaPage() {
  const { records, settings, loading, error } = usePublicData();
  const [showManagements, setShowManagements] = useState(false);
  const [managements, setManagements] = useState<CommunityManagementRecord[]>([]);
  const [managementsLoading, setManagementsLoading] = useState(false);
  const [managementsError, setManagementsError] = useState('');

  const toggleManagements = async () => {
    if (showManagements) {
      setShowManagements(false);
      return;
    }

    setShowManagements(true);
    setManagementsLoading(true);
    setManagementsError('');
    try {
      const response = await fetch('/api/public/community-managements', {
        headers: { Accept: 'application/json' },
      });
      if (!response.headers.get('content-type')?.toLowerCase().includes('application/json')) {
        throw new Error('El servidor no devolvió las gestiones de Google Sheets.');
      }
      const data = (await response.json()) as { records?: CommunityManagementRecord[]; error?: string };
      if (!response.ok) throw new Error(data.error || 'No fue posible cargar las gestiones realizadas.');
      setManagements(Array.isArray(data.records) ? data.records : []);
    } catch (reason) {
      setManagementsError(reason instanceof Error ? reason.message : 'No fue posible cargar las gestiones realizadas.');
    } finally {
      setManagementsLoading(false);
    }
  };

  const orderedRecords = [...records]
    .filter((r) => r.visibility === 'publica')
    .sort((a, b) => a.sort_order - b.sort_order);
  const secRecords = orderedRecords.filter((r) => r.section === 'secretario_jac');
  const presTimelineRecords = orderedRecords.filter(
    (r) => r.section === 'presidente_jac' && !/candidat|aspiraci|edil/i.test(`${r.title} ${r.detail}`)
  );
  const aspiracionRecords = orderedRecords.filter(
    (r) => r.section === 'aspiracion_edil' || /candidat|aspiraci|edil/i.test(`${r.title} ${r.detail}`)
  );

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-14">
      <header className="border-b border-[var(--border-hairline)] pb-8">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_15rem] gap-8 items-center">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-widest uppercase text-[var(--accent-gold)]">
              Vida política · Trayectoria comunitaria por etapas
            </p>
            <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[var(--text-ink)]">
              Del liderazgo comunal a la participación local
            </h1>
            <p className="text-base text-[var(--text-muted)] max-w-prose leading-relaxed">
              Recorrido documentado de Andrés Camilo Vidal Canchón en Juntas de Acción Comunal, su aspiración futura como edil de la Comuna 8 de Pasto y un espacio condicional preparado para una eventual gestión pública.
            </p>
          </div>
          <PublicPortrait src={settings?.authorizedPhotoUrl} />
        </div>
      </header>

      {loading && (
        <div className="p-8 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-sm text-[var(--text-muted)]">
          Cargando trayectoria comunitaria...
        </div>
      )}

      {error && (
        <div
          role="alert"
          className="p-6 rounded-xl border border-[var(--status-error)] bg-[var(--bg-elevated)] text-sm text-[var(--status-error)]"
        >
          {error}
        </div>
      )}

      {!loading && !error && (
        <div className="space-y-14">
          {/* Etapa 1 */}
          <section aria-labelledby="etapa-secretario" className="space-y-4">
            <div className="space-y-1">
              <p className="font-mono-tabular text-xs uppercase tracking-widest text-[var(--text-muted)]">
                Etapa 01 · 2017 – 2022
              </p>
              <h2 id="etapa-secretario" className="font-editorial text-3xl font-semibold text-[var(--text-ink)]">
                Secretario de Junta de Acción Comunal
              </h2>
            </div>
            {secRecords.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                No hay registros públicos disponibles en esta etapa.
              </p>
            ) : (
              <ul className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-6 divide-y divide-[var(--border-hairline)]">
                {secRecords.map((item) => (
                  <RecordRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </section>

          {/* Etapa 2 */}
          <section aria-labelledby="etapa-presidente" className="space-y-4">
            <div className="space-y-1">
              <p className="font-mono-tabular text-xs uppercase tracking-widest text-[var(--text-muted)]">
                Etapa 02 · 2022 – 13 de marzo de 2026
              </p>
              <h2 id="etapa-presidente" className="font-editorial text-3xl font-semibold text-[var(--text-ink)]">
                Presidente de Junta de Acción Comunal
              </h2>
              <p className="text-sm text-[var(--text-muted)] max-w-prose">
                Cronología editable con elección (abril de 2022), inicio del periodo (1 de julio de 2022), hitos comunitarios desarrollados y conclusión anticipada el 13 de marzo de 2026 por renuncia motivada por amenazas personales.
              </p>
            </div>
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] overflow-hidden">
              <button
                type="button"
                onClick={() => void toggleManagements()}
                aria-expanded={showManagements}
                aria-controls="gestiones-jac"
                className="w-full flex items-center justify-between gap-4 p-5 text-left hover:bg-[var(--bg-canvas)] transition-colors"
              >
                <span className="space-y-1">
                  <span className="block font-editorial text-xl font-semibold text-[var(--text-ink)]">
                    Junta de Acción Comunal
                  </span>
                  <span className="block text-sm text-[var(--text-muted)]">
                    {showManagements ? 'Ocultar gestiones realizadas' : 'Ver gestiones realizadas'}
                  </span>
                </span>
                <span aria-hidden="true" className="text-xl text-[var(--accent-gold)]">
                  {showManagements ? '−' : '+'}
                </span>
              </button>
              {showManagements && (
                <div id="gestiones-jac" className="border-t border-[var(--border-hairline)] px-5 sm:px-6">
                  {managementsLoading ? (
                    <p className="py-5 text-sm text-[var(--text-muted)]">Cargando gestiones desde Google Sheets…</p>
                  ) : managementsError ? (
                    <p role="alert" className="py-5 text-sm text-[var(--status-error)]">{managementsError}</p>
                  ) : managements.length === 0 ? (
                    <p className="py-5 text-sm text-[var(--text-muted)]">No hay gestiones públicas en la hoja “Gestiones realizadas”.</p>
                  ) : (
                    <ul className="divide-y divide-[var(--border-hairline)]">
                      {managements.map((item) => (
                        <li key={item.id} className="py-5 space-y-2">
                          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-[var(--text-muted)]">
                            {item.category && <span className="text-[var(--accent-gold)]">{item.category}</span>}
                            {item.category && (item.chronology || item.status) && <span aria-hidden="true">·</span>}
                            {(item.chronology || item.status) && <span>{item.chronology || item.status}</span>}
                          </div>
                          <h3 className="font-editorial text-xl font-semibold text-[var(--text-ink)]">{item.title}</h3>
                          <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-prose leading-relaxed">{item.detail}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}
            </div>
            {presTimelineRecords.length === 0 ? (
              <p className="text-sm text-[var(--text-muted)]">
                No hay actividades públicas registradas en esta etapa.
              </p>
            ) : (
              <ul className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-6">
                {presTimelineRecords.map((item) => (
                  <RecordRow key={item.id} item={item} />
                ))}
              </ul>
            )}
          </section>

          {/* Etapa 3 */}
          <section aria-labelledby="etapa-aspiracion" className="space-y-4">
            <div className="space-y-1">
              <p className="font-mono-tabular text-xs uppercase tracking-widest text-[var(--accent-gold)]">
                Etapa 03 · Proyecto hacia octubre de 2027
              </p>
              <h2 id="etapa-aspiracion" className="font-editorial text-3xl font-semibold text-[var(--text-ink)]">
                Aspiración a edil de la Comuna 8
              </h2>
            </div>
            <ul className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] px-6">
              {aspiracionRecords.map((item) => (
                <RecordRow key={item.id} item={item} />
              ))}
            </ul>
          </section>

        </div>
      )}
    </div>
  );
}
