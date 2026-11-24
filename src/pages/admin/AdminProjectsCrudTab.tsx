import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { ProjectRecord, ProjectRecordType, RecordVisibility } from '../../../shared/types';
import { sortProjectRecords } from '../../../shared/projects';
import { useAuth } from '../../context/AuthContext';

const TYPES: ProjectRecordType[] = ['Junta de Acción Comunal', 'Nexus Web Studio', 'Campaña política como edil', 'Otro'];
const EMPTY = {
  type: 'Junta de Acción Comunal' as ProjectRecordType,
  title: '',
  organization: '',
  chronology_start: '',
  chronology_end: '',
  status: 'En curso',
  detail: '',
  visibility: 'publica' as RecordVisibility,
  sort_order: '10',
};

export function AdminProjectsCrudTab() {
  const { authFetch } = useAuth();
  const [records, setRecords] = useState<ProjectRecord[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authFetch('/api/admin/project-records');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los proyectos.');
      setRecords(sortProjectRecords(data.records || []));
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Error consultando Google Sheets.');
    } finally {
      setLoading(false);
    }
  }, [authFetch]);

  useEffect(() => { void load(); }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setMessage('');
    try {
      const response = await authFetch(editingId ? `/api/admin/project-records/${editingId}` : '/api/admin/project-records', {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, sort_order: Number(form.sort_order) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar el proyecto.');
      setMessage(editingId ? 'Proyecto actualizado en Google Sheets.' : 'Proyecto añadido a Google Sheets.');
      setForm({ ...EMPTY, sort_order: String((records.reduce((max, record) => Math.max(max, record.sort_order), 0) || 0) + 10) });
      setEditingId(null);
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Error guardando el proyecto.');
    } finally {
      setSaving(false);
    }
  };

  const edit = (record: ProjectRecord) => {
    setEditingId(record.id);
    setForm({
      type: record.type,
      title: record.title,
      organization: record.organization,
      chronology_start: record.chronology_start,
      chronology_end: record.chronology_end,
      status: record.status,
      detail: record.detail,
      visibility: record.visibility,
      sort_order: String(record.sort_order),
    });
    setMessage('');
    setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (record: ProjectRecord) => {
    if (!window.confirm(`¿Eliminar “${record.title}” de Proyectos?`)) return;
    setError('');
    setMessage('');
    try {
      const response = await authFetch(`/api/admin/project-records/${record.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo eliminar el proyecto.');
      setMessage('Proyecto eliminado de Google Sheets.');
      if (editingId === record.id) {
        setEditingId(null);
        setForm(EMPTY);
      }
      await load();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Error eliminando el proyecto.');
    }
  };

  return <div className="space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2">
        <p className="text-xs uppercase tracking-widest text-[var(--accent-gold)]">Google Sheets · Proyectos</p>
        <h1 className="font-editorial text-3xl sm:text-4xl font-semibold">Gestión de proyectos</h1>
        <p className="text-sm text-[var(--text-muted)]">Administra proyectos de la Junta de Acción Comunal, Nexus Web Studio y la campaña cívica. Los cambios se guardan en la hoja “Proyectos”.</p>
      </div>
      <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] px-4 py-2 text-sm"><RefreshCw className="w-4 h-4"/>Actualizar</button>
    </header>

    {error && <p role="alert" className="p-4 rounded-lg border border-[var(--status-error)] text-sm text-[var(--status-error)]">{error}</p>}
    {message && <p role="status" className="p-4 rounded-lg border border-[var(--border-hairline)] text-sm">{message}</p>}

    <form onSubmit={submit} className="p-5 sm:p-7 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] space-y-5">
      <h2 className="font-editorial text-2xl font-semibold">{editingId ? 'Editar proyecto' : 'Nuevo proyecto'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block space-y-1 text-xs font-medium">Tipo de proyecto
          <select value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value as ProjectRecordType })} className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
            {TYPES.map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label className="block space-y-1 text-xs font-medium">Título
          <input required minLength={2} maxLength={180} value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)]" />
        </label>
        <label className="block space-y-1 text-xs font-medium">Organización o entidad
          <input value={form.organization} onChange={(event) => setForm({ ...form, organization: event.target.value })} className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)]" />
        </label>
        <label className="block space-y-1 text-xs font-medium">Cronología de inicio
          <input value={form.chronology_start} onChange={(event) => setForm({ ...form, chronology_start: event.target.value })} className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)]" />
        </label>
        <label className="block space-y-1 text-xs font-medium">Cronología final
          <input value={form.chronology_end} onChange={(event) => setForm({ ...form, chronology_end: event.target.value })} className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)]" />
        </label>
        <label className="block space-y-1 text-xs font-medium">Estado
          <input required maxLength={100} value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value })} className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)]" />
        </label>
        <label className="block space-y-1 text-xs font-medium">Orden de visualización
          <input required type="number" min="0" max="9999" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)]" />
        </label>
        <label className="block space-y-1 text-xs font-medium">Visibilidad
          <select value={form.visibility} onChange={(event) => setForm({ ...form, visibility: event.target.value as RecordVisibility })} className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)]">
            <option value="publica">Pública</option><option value="privada">Privada</option>
          </select>
        </label>
        <label className="md:col-span-2 block space-y-1 text-xs font-medium">Detalles
          <textarea required minLength={5} maxLength={2500} rows={4} value={form.detail} onChange={(event) => setForm({ ...form, detail: event.target.value })} className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)]" />
        </label>
      </div>
      <div className="flex gap-3 justify-end">
        <button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-[var(--brand-green)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Plus className="w-4 h-4"/>{saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear proyecto'}</button>
        {editingId && <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY); }} className="rounded-md border border-[var(--border-hairline)] px-4 py-2 text-sm">Cancelar</button>}
      </div>
    </form>

    <section className="space-y-4">
      <h2 className="font-editorial text-2xl font-semibold">Proyectos almacenados ({records.length})</h2>
      {loading ? <p className="text-sm text-[var(--text-muted)]">Cargando registros de Google Sheets…</p> : records.length === 0 ? <p className="p-6 rounded-xl border border-[var(--border-hairline)] text-sm text-[var(--text-muted)]">Aún no hay proyectos registrados.</p> : <ul className="space-y-3">{records.map((record) => <li key={record.id} className="p-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] flex flex-col sm:flex-row justify-between gap-4">
        <div className="space-y-1"><p className="text-xs text-[var(--accent-gold)]">#{record.id} · {record.type} · {record.status} · {record.visibility} · Orden {record.sort_order}</p><h3 className="font-editorial text-xl font-semibold">{record.title}</h3><p className="text-sm text-[var(--text-muted)]">{[record.organization, record.chronology_start, record.chronology_end].filter(Boolean).join(' · ')}</p><p className="text-sm text-[var(--text-muted)]">{record.detail}</p></div>
        <div className="flex gap-2 shrink-0"><button type="button" onClick={() => edit(record)} className="inline-flex items-center gap-1 rounded-md border border-[var(--border-hairline)] px-3 py-2 text-xs"><Pencil className="w-3.5 h-3.5"/>Editar</button><button type="button" onClick={() => void remove(record)} className="inline-flex items-center gap-1 rounded-md border border-[var(--status-error)] px-3 py-2 text-xs text-[var(--status-error)]"><Trash2 className="w-3.5 h-3.5"/>Eliminar</button></div>
      </li>)}</ul>}
    </section>
  </div>;
}
