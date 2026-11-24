import { Database, RefreshCw } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

interface Props {
  authFetch: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>;
}

interface SheetTable {
  title: string;
  headers: string[];
  rows: string[][];
}

async function readApiResponse(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    throw new Error('El servidor local aún no cargó las rutas nuevas. Reinicia el servidor y vuelve a actualizar la lectura.');
  }
}

export function AdminDatabaseTab({ authFetch }: Props) {
  const [tabs, setTabs] = useState<string[]>([]);
  const [selectedTab, setSelectedTab] = useState('');
  const [table, setTable] = useState<SheetTable | null>(null);
  const [loadingTabs, setLoadingTabs] = useState(true);
  const [loadingTable, setLoadingTable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTabs = useCallback(async (preferredTab?: string) => {
    setLoadingTabs(true);
    setError(null);
    try {
      const response = await authFetch('/api/admin/sheets/tabs');
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'No fue posible consultar las hojas.');
      const nextTabs = Array.isArray(data.tabs) ? data.tabs as string[] : [];
      setTabs(nextTabs);
      const nextSelected = preferredTab && nextTabs.includes(preferredTab)
        ? preferredTab
        : nextTabs[0] || '';
      setSelectedTab(nextSelected);
      if (!nextSelected) setTable(null);
      return nextSelected;
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'No fue posible consultar las hojas.');
      setTabs([]);
      setTable(null);
      return '';
    } finally {
      setLoadingTabs(false);
    }
  }, [authFetch]);

  const loadTable = useCallback(async (title: string) => {
    if (!title) return;
    setLoadingTable(true);
    setError(null);
    try {
      const response = await authFetch(`/api/admin/sheets/tab?name=${encodeURIComponent(title)}`);
      const data = await readApiResponse(response);
      if (!response.ok) throw new Error(typeof data.error === 'string' ? data.error : 'No fue posible leer la pestaña.');
      setTable({
        title: String(data.title || title),
        headers: Array.isArray(data.headers) ? data.headers.map(String) : [],
        rows: Array.isArray(data.rows) ? data.rows as string[][] : [],
      });
    } catch (cause) {
      setTable(null);
      setError(cause instanceof Error ? cause.message : 'No fue posible leer la pestaña.');
    } finally {
      setLoadingTable(false);
    }
  }, [authFetch]);

  useEffect(() => {
    void loadTabs();
  }, [loadTabs]);

  useEffect(() => {
    if (selectedTab) void loadTable(selectedTab);
  }, [selectedTab, loadTable]);

  const refresh = async () => {
    const tab = await loadTabs(selectedTab);
    if (tab) await loadTable(tab);
  };

  return (
    <div className="space-y-6">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[var(--text-ink)]">
            Base de datos
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Consulta las pestañas de Google Sheets y sus datos en modo de solo lectura.
          </p>
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loadingTabs || loadingTable}
          className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-[var(--text-ink)] hover:bg-[var(--bg-surface)] disabled:opacity-60 whitespace-nowrap cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loadingTabs || loadingTable ? 'animate-spin' : ''}`} aria-hidden="true" />
          Actualizar lectura
        </button>
      </header>

      {error && (
        <div role="alert" className="rounded-xl border border-[var(--status-error)] bg-[var(--bg-elevated)] p-4 text-sm text-[var(--status-error)]">
          {error}
        </div>
      )}

      <section aria-label="Pestañas de Google Sheets" className="space-y-3">
        <h2 className="text-sm font-semibold text-[var(--text-ink)]">Hojas disponibles</h2>
        {loadingTabs && <p className="text-sm text-[var(--text-muted)]">Consultando pestañas…</p>}
        {!loadingTabs && tabs.length > 0 && (
          <div role="tablist" aria-label="Hojas del archivo" className="flex flex-wrap gap-2">
            {tabs.map((tab) => (
              <button
                key={tab}
                type="button"
                role="tab"
                aria-selected={selectedTab === tab}
                onClick={() => setSelectedTab(tab)}
                className={`inline-flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-colors cursor-pointer ${selectedTab === tab
                  ? 'border-[var(--accent-gold)] bg-[var(--bg-elevated)] text-[var(--text-ink)]'
                  : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] text-[var(--text-muted)] hover:text-[var(--text-ink)]'}`}
              >
                <Database className="h-3.5 w-3.5" aria-hidden="true" />
                {tab}
              </button>
            ))}
          </div>
        )}
        {!loadingTabs && tabs.length === 0 && !error && (
          <p className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 text-sm text-[var(--text-muted)]">
            No se encontraron pestañas en el archivo de Google Sheets.
          </p>
        )}
      </section>

      {selectedTab && (
        <section aria-label={`Contenido de ${selectedTab}`} className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-editorial text-2xl font-semibold text-[var(--text-ink)]">{selectedTab}</h2>
            {!loadingTable && table && <span className="text-xs text-[var(--text-muted)]">{table.rows.length} filas</span>}
          </div>
          <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] overflow-auto max-h-[65vh]">
            {loadingTable ? (
              <p className="p-6 text-sm text-[var(--text-muted)]">Cargando datos…</p>
            ) : table && table.headers.length > 0 ? (
              <table className="w-full text-left border-collapse text-xs">
                <thead className="sticky top-0 z-10">
                  <tr className="border-b border-[var(--border-hairline)] bg-[var(--bg-surface)] font-mono-tabular text-[var(--text-muted)]">
                    {table.headers.map((header, index) => (
                      <th key={`${header}-${index}`} scope="col" className="py-3 px-3 whitespace-nowrap">{header || `Columna ${index + 1}`}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-hairline)]">
                  {table.rows.length === 0 ? (
                    <tr><td colSpan={table.headers.length} className="py-8 px-4 text-center text-[var(--text-muted)]">Esta hoja no tiene filas con datos.</td></tr>
                  ) : table.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-[var(--bg-surface)]/60">
                      {table.headers.map((_, columnIndex) => (
                        <td key={columnIndex} className="py-3 px-3 min-w-24 max-w-sm whitespace-pre-wrap break-words text-[var(--text-ink)]">
                          {row[columnIndex] || <span className="text-[var(--text-muted)]">—</span>}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <p className="p-6 text-sm text-[var(--text-muted)]">La hoja seleccionada está vacía.</p>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
