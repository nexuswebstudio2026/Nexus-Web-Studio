import { Globe, MessageCircle, Share2 } from 'lucide-react';
import type { SocialLinkItem } from '../../shared/types';

function NetworkIcon({ network }: { network: string }) {
  const lower = network.toLowerCase();
  if (lower.includes('facebook')) {
    return <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M13.5 21v-8h2.7l.4-3.1h-3.1v-2c0-.9.3-1.5 1.6-1.5h1.7V3.6c-.3 0-1.3-.1-2.4-.1-2.4 0-4 1.5-4 4.2v2.3H7.7V13h2.7v8z" /></svg>;
  }
  if (lower.includes('instagram')) {
    return <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r=".8" fill="currentColor"/></svg>;
  }
  if (lower === 'x') return <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M18.9 2H22l-6.8 7.8L23.2 22h-6.3l-5-7.2L5.6 22H2.4l7.3-8.4L1.9 2h6.5l4.5 6.7L18.9 2Zm-1.1 18h1.7L7.4 3.9H5.6L17.8 20Z"/></svg>;
  if (lower.includes('tiktok')) return <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M19.6 7.2a6.7 6.7 0 0 1-4.1-1.4v8.1a6.1 6.1 0 1 1-5.3-6v3.5a2.7 2.7 0 1 0 1.9 2.6V2.5h3.4c.3 2.3 1.7 3.8 4.1 4.2v.5Z"/></svg>;
  if (lower.includes('threads')) return <Share2 aria-hidden="true" className="h-5 w-5" />;
  if (lower.includes('whatsapp')) return <MessageCircle aria-hidden="true" className="h-5 w-5" />;
  if (lower.includes('youtube')) return <svg aria-hidden="true" className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor"><path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.6 12 3.6 12 3.6s-7.5 0-9.4.5A3 3 0 0 0 .5 6.2 31 31 0 0 0 0 12a31 31 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.5 9.4.5 9.4.5s7.5 0 9.4-.5a3 3 0 0 0 2.1-2.1A31 31 0 0 0 24 12a31 31 0 0 0-.5-5.8ZM9.6 15.6V8.4l6.2 3.6-6.2 3.6Z"/></svg>;
  return <Globe aria-hidden="true" className="h-5 w-5" />;
}

function profileUrl(item: SocialLinkItem) {
  const source = item.url.trim();
  if (/^https?:\/\//i.test(source)) return source;
  if (item.network.toLowerCase().includes('whatsapp')) {
    const number = source.replace(/\D/g, '');
    return number ? `https://wa.me/${number}` : '';
  }
  return source ? `https://${source}` : '';
}

export function SocialLinksBar({ links }: { links: SocialLinkItem[] }) {
  const active = links.filter((item) => profileUrl(item));
  if (active.length === 0) {
    return <p className="text-sm text-[var(--text-muted)]">Los enlaces aparecerán aquí cuando estén configurados y activados.</p>;
  }

  return (
    <ul className="flex flex-wrap items-center gap-3" aria-label="Redes sociales oficiales">
      {active.map((item) => (
        <li key={item.id}>
          <a
            href={profileUrl(item)}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Abrir perfil de ${item.network} en una pestaña nueva`}
            title={`Ir a ${item.network}`}
            className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-ink)] transition-colors hover:border-[var(--accent-gold)] hover:text-[var(--brand-green)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--brand-green)]"
          >
            <NetworkIcon network={item.network} />
          </a>
        </li>
      ))}
    </ul>
  );
}
