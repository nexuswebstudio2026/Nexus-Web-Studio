import { PublicPortrait } from '../../components/PublicPortrait';
import { usePublicData } from '../../context/PublicDataContext';

const BIO_TIMELINE = [
  {
    date: '17 de abril de 1994',
    title: 'Nacimiento en Girardot, Cundinamarca',
    text: 'Nació en el municipio de Girardot, departamento de Cundinamarca.',
  },
  {
    date: 'Educación primaria',
    title: 'Escuela Rafael Pombo de Girardot',
    text: 'Completó sus estudios de educación básica primaria en la Escuela Rafael Pombo de Girardot.',
  },
  {
    date: '2012',
    title: 'Grado de bachiller en el colegio INEM de Pasto',
    text: 'Se graduó como bachiller en 2012 en el colegio INEM de San Juan de Pasto.',
  },
  {
    date: 'Formación multidisciplinaria',
    title: 'Saberes complementarios y estudios actuales en ESAP',
    text: 'Ha adquirido conocimientos en contaduría, administración de empresas, mercadeo, derecho, programación web y administración pública. Actualmente cursa cuarto semestre de Administración Pública en la ESAP (estudio en curso).',
  },
  {
    date: 'Octubre de 2017',
    title: 'Regreso a Girardot',
    text: 'Regresó a Girardot en octubre de 2017 y fortaleció su participación en el trabajo barrial.',
  },
  {
    date: 'Marzo de 2018 – 2022',
    title: 'Secretario de Junta de Acción Comunal',
    text: 'Elegido secretario de la Junta de Acción Comunal de su barrio en marzo de 2018; desempeñó esta labor hasta 2022.',
  },
  {
    date: 'Abril de 2022 – 13 de marzo de 2026',
    title: 'Presidente de Junta de Acción Comunal',
    text: 'Elegido presidente en abril de 2022 con inicio de periodo el 1 de julio de 2022. Su mandato concluyó anticipadamente el 13 de marzo de 2026 al presentar su renuncia por amenazas personales.',
  },
  {
    date: 'Horizonte octubre de 2027',
    title: 'Aspiración a edil de la Comuna 8 de Pasto',
    text: 'Proyecta una aspiración futura para postularse como edil de la Comuna 8 de Pasto en las elecciones locales previstas para octubre de 2027. Se presenta como aspiración en construcción.',
  },
];

export function HistoriaPage() {
  const { settings } = usePublicData();

  return (
    <article className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12 lg:py-16 space-y-12">
      <header className="border-b border-[var(--border-hairline)] pb-8">
        <div className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_15rem] gap-8 items-center">
          <div className="space-y-4">
            <p className="text-xs font-medium tracking-widest uppercase text-[var(--accent-gold)]">
              Biografía completa · Datos confirmados
            </p>
            <h1 className="font-editorial text-4xl sm:text-5xl font-semibold text-[var(--text-ink)]">
              Historia de Andrés Camilo Vidal Canchón
            </h1>
            <p className="text-base text-[var(--text-muted)] max-w-prose leading-relaxed">
              Relato cronológico fiel a los hitos educativos y comunitarios confirmados, redactado sin agregar cargos, títulos, cifras ni circunstancias externas no verificadas.
            </p>
          </div>
          <PublicPortrait src={settings?.authorizedPhotoUrl} />
        </div>
      </header>

      <ol className="space-y-6">
        {BIO_TIMELINE.map((entry, idx) => (
          <li
            key={entry.title}
            className="p-6 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] space-y-2"
          >
            <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
              <span className="font-mono-tabular font-semibold text-[var(--accent-gold)]">
                0{idx + 1}
              </span>
              <span aria-hidden="true">·</span>
              <span className="font-mono-tabular">{entry.date}</span>
            </div>
            <h2 className="font-editorial text-2xl font-semibold text-[var(--text-ink)]">
              {entry.title}
            </h2>
            <p className="text-sm sm:text-base text-[var(--text-muted)] max-w-prose leading-relaxed">
              {entry.text}
            </p>
          </li>
        ))}
      </ol>
    </article>
  );
}
