interface PublicPortraitProps {
  src?: string | null;
  alt?: string;
  className?: string;
}

export function PublicPortrait({
  src,
  alt = 'Retrato de Andrés Camilo Vidal Canchón',
  className = '',
}: PublicPortraitProps) {
  if (!src?.trim()) return null;

  return (
    <figure
      className={`w-full max-w-[15rem] aspect-[4/5] justify-self-center md:justify-self-end overflow-hidden rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] ${className}`}
    >
      <img
        src={src}
        alt={alt}
        loading="lazy"
        decoding="async"
        referrerPolicy="no-referrer"
        className="w-full h-full object-cover object-[center_22%]"
      />
    </figure>
  );
}
