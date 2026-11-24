import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import type { PoliticalRecord, SiteSettings } from '../../shared/types';

interface PublicDataContextValue {
  records: PoliticalRecord[];
  settings: SiteSettings | null;
  loading: boolean;
  error: string | null;
  refreshPublicData: () => Promise<void>;
}

const PublicDataContext = createContext<PublicDataContextValue | null>(null);

export function PublicDataProvider({ children }: { children: React.ReactNode }) {
  const [records, setRecords] = useState<PoliticalRecord[]>([]);
  const [settings, setSettings] = useState<SiteSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshPublicData = useCallback(async () => {
    setError(null);
    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 20_000);
    try {
      const res = await fetch('/api/public/content', {
        headers: { Accept: 'application/json' },
        signal: controller.signal,
      });
      if (!res.ok) {
        throw new Error(`No fue posible cargar la información pública (HTTP ${res.status}).`);
      }
      if (!res.headers.get('content-type')?.toLowerCase().includes('application/json')) {
        throw new Error('El servidor respondió con una página web en lugar de los datos públicos.');
      }
      const data = (await res.json()) as { records: PoliticalRecord[]; settings: SiteSettings };
      if (!data || !Array.isArray(data.records) || !data.settings) {
        throw new Error('La respuesta del servidor no contiene los datos públicos esperados.');
      }
      setRecords(data.records || []);
      setSettings(data.settings || null);
    } catch (err) {
      setError(
        controller.signal.aborted
          ? 'El servidor tardó demasiado en responder. Intenta actualizar la página.'
          : err instanceof Error ? err.message : 'Error cargando información.',
      );
    } finally {
      window.clearTimeout(timeoutId);
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshPublicData();
  }, [refreshPublicData]);

  return (
    <PublicDataContext.Provider value={{ records, settings, loading, error, refreshPublicData }}>
      {children}
    </PublicDataContext.Provider>
  );
}

export function usePublicData(): PublicDataContextValue {
  const ctx = useContext(PublicDataContext);
  if (!ctx) throw new Error('usePublicData debe usarse dentro de PublicDataProvider.');
  return ctx;
}
