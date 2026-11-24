import React, { useEffect, useState } from 'react';
import type { PoliticalRecord, SheetsStatusInfo, SiteSettings } from '../../../shared/types';
import { useAuth } from '../../context/AuthContext';

interface Props {
  records: PoliticalRecord[];
  sheetsStatus: SheetsStatusInfo | null;
  settings: SiteSettings;
  onSettingsSaved: (next: SiteSettings) => Promise<void>;
}

const DEFAULT_SOCIAL_LINKS = [
  'Facebook',
  'Instagram',
  'X',
  'TikTok',
  'Threads',
  'YouTube',
  'WhatsApp',
].map((network) => ({
  id: `social-${network.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`,
  network,
  label: 'Perfil oficial',
  url: '',
  enabled: false,
}));

function withDefaultSocialLinks(links: SiteSettings['socialLinks']): SiteSettings['socialLinks'] {
  const defaults = DEFAULT_SOCIAL_LINKS.map((item) => {
    const saved = links.find((link) => link.network.toLowerCase() === item.network.toLowerCase());
    return saved ? { ...item, ...saved, enabled: Boolean(saved.url.trim()) } : item;
  });
  const custom = links.filter(
    (link) => !link.network.toLowerCase().includes('messenger') &&
      !DEFAULT_SOCIAL_LINKS.some((item) => item.network.toLowerCase() === link.network.toLowerCase())
  ).map((link) => ({ ...link, enabled: Boolean(link.url.trim()) }));
  return [...defaults, ...custom];
}

export function AdminOverviewTab({ records, sheetsStatus, settings, onSettingsSaved }: Props) {
  const { authFetch } = useAuth();
  const [form, setForm] = useState<SiteSettings>(() => ({
    ...settings,
    socialLinks: withDefaultSocialLinks(settings.socialLinks),
  }));
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    setForm({ ...settings, socialLinks: withDefaultSocialLinks(settings.socialLinks) });
  }, [settings]);

  const publicCount = records.filter((r) => r.visibility === 'publica').length;
  const privateCount = records.filter((r) => r.visibility === 'privada').length;
  const pendingCount = records.filter((r) =>
    r.status.toLowerCase().includes('pendiente')
  ).length;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setFeedback(null);
    try {
      const res = await authFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        const firstErr = data.fields ? Object.values(data.fields)[0] : data.error;
        setFeedback({ type: 'error', text: String(firstErr || 'No se pudo guardar.') });
        return;
      }
      await onSettingsSaved(data.settings as SiteSettings);
      setFeedback({
        type: data.sheetsWarning ? 'error' : 'success',
        text: data.sheetsWarning
          ? `La configuración quedó guardada localmente, pero Google Sheets no se actualizó: ${String(data.sheetsWarning)}`
          : 'Configuración guardada y redes sincronizadas con Google Sheets.',
      });
    } catch {
      setFeedback({ type: 'error', text: 'Error de red al guardar la configuración.' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="space-y-1">
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[var(--text-ink)]">
          Inicio / Panel administrativo
        </h1>
        <p className="text-sm text-[var(--text-muted)]">
          Resumen real de registros publicados y configuración editable del sitio público.
        </p>
      </header>

      {/* Metrics grid (real counts only, tabular numerals) */}
      <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
          <dt className="text-xs text-[var(--text-muted)]">Registros públicos</dt>
          <dd className="font-mono-tabular text-2xl font-semibold text-[var(--text-ink)] mt-1">
            {publicCount}
          </dd>
        </div>
        <div className="p-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
          <dt className="text-xs text-[var(--text-muted)]">Registros privados</dt>
          <dd className="font-mono-tabular text-2xl font-semibold text-[var(--text-ink)] mt-1">
            {privateCount}
          </dd>
        </div>
        <div className="p-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
          <dt className="text-xs text-[var(--text-muted)]">Pendientes de confirmar</dt>
          <dd className="font-mono-tabular text-2xl font-semibold text-[var(--accent-gold)] mt-1">
            {pendingCount}
          </dd>
        </div>
        <div className="p-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)]">
          <dt className="text-xs text-[var(--text-muted)]">Origen de datos</dt>
          <dd className="text-sm font-semibold text-[var(--text-ink)] mt-2">
            {sheetsStatus?.source === 'google-sheets' ? 'Google Sheets activo' : 'Almacenamiento local'}
          </dd>
        </div>
      </dl>

      {/* Editable settings form */}
      <form
        onSubmit={handleSaveSettings}
        className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-6 space-y-6"
      >
        <div className="border-b border-[var(--border-hairline)] pb-4">
          <h2 className="font-editorial text-2xl font-semibold text-[var(--text-ink)]">
            Configuración de proyectos, redes sociales y medios autorizados
          </h2>
          <p className="text-xs text-[var(--text-muted)] mt-1">
            Los cambios se reflejan en Inicio, Vida académica, Proyectos y el pie de página.
          </p>
        </div>

        {feedback && (
          <div
            role="status"
            className={`p-3.5 rounded-lg border text-xs ${
              feedback.type === 'success'
                ? 'border-[var(--status-success)] text-[var(--status-success)]'
                : 'border-[var(--status-error)] text-[var(--status-error)]'
            }`}
          >
            {feedback.text}
          </div>
        )}

        <div className="space-y-3 border-t border-[var(--border-hairline)] pt-5">
          <h3 className="text-sm font-semibold text-[var(--text-ink)]">
            Enlaces editables a redes sociales
          </h3>
          <div className="space-y-3">
            {form.socialLinks.map((link, idx) => (
              <div
                key={link.id}
                className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center p-3 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)]"
              >
                <div className="md:col-span-3 flex items-center">
                  <span className="text-xs font-semibold text-[var(--text-ink)]">
                    {link.network}
                  </span>
                </div>
                <div className="md:col-span-9">
                  <label htmlFor={`social-url-${link.id}`} className="sr-only">
                    URL de {link.network}
                  </label>
                  <input
                    id={`social-url-${link.id}`}
                    type="url"
                    value={link.url}
                    onChange={(e) => {
                      const next = form.socialLinks.slice();
                      next[idx] = { ...link, url: e.target.value, enabled: Boolean(e.target.value.trim()) };
                      setForm({ ...form, socialLinks: next });
                    }}
                    placeholder={link.network === 'WhatsApp' ? 'https://wa.me/573...' : 'https://...'}
                    className="w-full px-3 py-1.5 text-xs font-mono-tabular rounded border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-ink)]"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-3 border-t border-[var(--border-hairline)] pt-5">
          <h3 className="text-sm font-semibold text-[var(--text-ink)]">
            Fotografía autorizada
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1">
              <label htmlFor="auth-photo-url" className="block text-xs font-medium text-[var(--text-ink)]">
                URL de fotografía autorizada (opcional)
              </label>
              <input
                id="auth-photo-url"
                type="text"
                value={form.authorizedPhotoUrl}
                onChange={(e) => setForm({ ...form, authorizedPhotoUrl: e.target.value })}
                placeholder="https://… o /profile-photo.png"
                className="w-full px-3 py-2 text-xs rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-ink)]"
              />
            </div>
            <div className="space-y-1">
              <label htmlFor="auth-photo-caption" className="block text-xs font-medium text-[var(--text-ink)]">
                Pie de imagen o leyenda
              </label>
              <input
                id="auth-photo-caption"
                type="text"
                value={form.authorizedPhotoCaption}
                onChange={(e) => setForm({ ...form, authorizedPhotoCaption: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-ink)]"
              />
            </div>
          </div>

        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={saving}
            className="px-5 py-2.5 rounded-md text-sm font-semibold bg-[var(--brand-green)] text-white dark:text-[#0b140f] hover:bg-[var(--brand-green-hover)] disabled:opacity-60 cursor-pointer"
          >
            {saving ? 'Guardando...' : 'Guardar configuración'}
          </button>
        </div>
      </form>
    </div>
  );
}
