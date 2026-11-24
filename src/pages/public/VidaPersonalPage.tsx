import { Link } from 'react-router-dom';
import { PublicPortrait } from '../../components/PublicPortrait';
import { usePublicData } from '../../context/PublicDataContext';

const KNOWLEDGE_AREAS = [
  'Contaduría',
  'Administración de empresas',
  'Mercadeo',
  'Derecho',
  'Programación web',
  'Administración pública',
];

export function VidaPersonalPage() {
  const { settings } = usePublicData();

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <header className="border-b border-[var(--border-hairline)] pb-8">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_15rem] gap-8 items-center">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-widest uppercase text-[var(--accent-gold)]">
              Vida personal · Información autorizada
            </p>
            <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[var(--text-ink)]">
              Orígenes, formación y vocación de servicio
            </h1>
            <p className="text-base text-[var(--text-muted)] max-w-prose leading-relaxed">
              Esta sección reúne únicamente datos confirmados y autorizados por Andrés Camilo Vidal Canchón sobre su infancia, formación académica e intereses cívicos. No incluye especulaciones ni información familiar no publicada.
            </p>
          </div>
          <PublicPortrait src={settings?.authorizedPhotoUrl} />
        </div>
      </header>

      <section className="space-y-5">
        <h2 className="font-editorial text-3xl font-semibold text-[var(--text-ink)]">
          Infancia y educación básica
        </h2>
        <div className="space-y-4 text-[var(--text-muted)] max-w-prose leading-relaxed">
          <p>
            Andrés Camilo Vidal Canchón nació en Girardot, Cundinamarca, el 17 de abril de 1994. Su etapa escolar primaria transcurrió en la Escuela Rafael Pombo de Girardot.
          </p>
          <p>
            Posteriormente se trasladó a San Juan de Pasto, donde culminó sus estudios secundarios y se graduó como bachiller en el año 2012 en el colegio INEM de Pasto.
          </p>
        </div>
      </section>

      <section className="border-t border-[var(--border-hairline)] pt-10 space-y-6">
        <div className="space-y-2">
          <h2 className="font-editorial text-3xl font-semibold text-[var(--text-ink)]">
            Formación en curso y áreas de conocimiento
          </h2>
          <p className="text-sm text-[var(--text-muted)]">
            Información académica actualizada con distinción clara entre estudios en curso y saberes adquiridos.
          </p>
        </div>

        <div className="p-6 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] space-y-2">
          <p className="text-xs font-mono-tabular uppercase tracking-wider text-[var(--accent-gold)]">
            Estudio universitario en curso · No es título terminado
          </p>
          <h3 className="font-editorial text-2xl font-semibold text-[var(--text-ink)]">
            Administración Pública — ESAP
          </h3>
          <p className="text-sm text-[var(--text-muted)] leading-relaxed">
            Actualmente cursa cuarto semestre de Administración Pública en la Escuela Superior de Administración Pública (ESAP), fortaleciendo su preparación técnica en gestión territorial y normativa pública.
          </p>
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-[var(--text-ink)]">
            Áreas de conocimiento y estudio
          </h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {KNOWLEDGE_AREAS.map((area, index) => (
              <div
                key={area}
                className="p-4 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)]"
              >
                <dt className="font-mono-tabular text-xs text-[var(--text-muted)]">
                  0{index + 1}
                </dt>
                <dd className="text-sm font-semibold text-[var(--text-ink)] mt-1">{area}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      <section className="border-t border-[var(--border-hairline)] pt-10 space-y-4">
        <h2 className="font-editorial text-3xl font-semibold text-[var(--text-ink)]">
          Nota biográfica autorizada
        </h2>
        <p className="text-[var(--text-muted)] max-w-prose leading-relaxed">
          {settings?.personalNote ||
            'Apasionado por el servicio comunitario y la participación local. Toda actualización de carácter personal se incorpora únicamente bajo autorización expresa desde el panel administrativo.'}
        </p>
        <div className="pt-4">
          <Link
            to="/vida-politica"
            className="text-sm font-semibold text-[var(--brand-green)] hover:underline"
          >
            Continuar hacia Vida política y trayectoria comunitaria →
          </Link>
        </div>
      </section>
    </article>
  );
}
