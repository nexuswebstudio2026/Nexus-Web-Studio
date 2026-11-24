import { Pencil, Plus, RefreshCw, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { AcademicRecord, AcademicRecordType, RecordVisibility } from '../../../shared/types';
import { useAuth } from '../../context/AuthContext';

const TYPES: AcademicRecordType[] = ['Primaria', 'Bachillerato', 'Pregrado', 'Posgrado', 'Curso', 'Seminario', 'Diplomado', 'Área de conocimiento', 'Otro'];
const EMPTY = { type: 'Curso' as AcademicRecordType, title: '', institution: '', chronology_start: '', chronology_end: '', status: 'Finalizado', detail: '', support_url: '', visibility: 'publica' as RecordVisibility, sort_order: '10' };

export function AdminAcademicCrudTab() {
  const { authFetch } = useAuth();
  const [records, setRecords] = useState<AcademicRecord[]>([]);
  const [form, setForm] = useState(EMPTY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const response = await authFetch('/api/admin/academic-records');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los registros.');
      setRecords(data.records || []);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Error consultando Google Sheets.'); }
    finally { setLoading(false); }
  }, [authFetch]);

  useEffect(() => { void load(); }, [load]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setSaving(true); setError(''); setMessage('');
    try {
      const response = await authFetch(editingId ? `/api/admin/academic-records/${editingId}` : '/api/admin/academic-records', {
        method: editingId ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...form, sort_order: Number(form.sort_order) }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar.');
      setMessage(editingId ? 'Registro académico actualizado en Google Sheets.' : 'Registro académico añadido a Google Sheets.');
      setForm({ ...EMPTY, sort_order: String((records.at(-1)?.sort_order || 0) + 10) }); setEditingId(null);
      await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Error guardando el registro.'); }
    finally { setSaving(false); }
  };

  const edit = (record: AcademicRecord) => {
    setEditingId(record.id);
    setForm({ type: record.type, title: record.title, institution: record.institution, chronology_start: record.chronology_start, chronology_end: record.chronology_end, status: record.status, detail: record.detail, support_url: record.support_url, visibility: record.visibility, sort_order: String(record.sort_order) });
    setMessage(''); setError('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const remove = async (record: AcademicRecord) => {
    if (!window.confirm(`¿Eliminar “${record.title}” de Vida académica?`)) return;
    setError(''); setMessage('');
    try {
      const response = await authFetch(`/api/admin/academic-records/${record.id}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo eliminar el registro.');
      setMessage('Registro eliminado de Google Sheets.'); await load();
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Error eliminando el registro.'); }
  };

  const field = (name: keyof typeof EMPTY, label: string, type = 'text') => (
    <label className="block space-y-1 text-xs font-medium text-[var(--text-ink)]">{label}
      <input type={type} value={form[name]} onChange={(event) => setForm({ ...form, [name]: event.target.value })} className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)]" />
    </label>
  );

  return <div className="space-y-8">
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="space-y-2"><p className="text-xs uppercase tracking-widest text-[var(--accent-gold)]">Google Sheets · Vida académica</p><h1 className="font-editorial text-3xl sm:text-4xl font-semibold">Gestión académica</h1><p className="text-sm text-[var(--text-muted)]">Administra estudios, cursos, diplomados y áreas de conocimiento. Los cambios se guardan en la hoja “Vida académica”.</p></div>
      <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-md border border-[var(--border-hairline)] px-4 py-2 text-sm"><RefreshCw className="w-4 h-4"/>Actualizar</button>
    </header>
    {error && <p role="alert" className="p-4 rounded-lg border border-[var(--status-error)] text-sm text-[var(--status-error)]">{error}</p>}
    {message && <p role="status" className="p-4 rounded-lg border border-[var(--border-hairline)] text-sm">{message}</p>}
    <form onSubmit={submit} className="p-5 sm:p-7 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] space-y-5">
      <h2 className="font-editorial text-2xl font-semibold">{editingId ? 'Editar registro' : 'Nuevo registro académico'}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block space-y-1 text-xs font-medium">Tipo<select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value as AcademicRecordType })} className="w-full px-3 py-2 text-sm rounded-md border bg-[var(--bg-canvas)]">{TYPES.map((type) => <option key={type}>{type}</option>)}</select></label>
        {field('title', 'Título o programa')}{field('institution', 'Institución')}{field('chronology_start', 'Inicio')}{field('chronology_end', 'Finalización')}{field('status', 'Estado')}{field('sort_order', 'Orden de visualización', 'number')}
        <label className="block space-y-1 text-xs font-medium">Visibilidad<select value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value as RecordVisibility })} className="w-full px-3 py-2 text-sm rounded-md border bg-[var(--bg-canvas)]"><option value="publica">Pública</option><option value="privada">Privada</option></select></label>
        {field('support_url', 'URL del soporte', 'url')}
        <label className="md:col-span-2 block space-y-1 text-xs font-medium">Detalles<textarea required minLength={5} rows={4} value={form.detail} onChange={(e) => setForm({ ...form, detail: e.target.value })} className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)]" /></label>
      </div>
      <div className="flex gap-3 justify-end"><button disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-[var(--brand-green)] px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-60"><Plus className="w-4 h-4"/>{saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear registro'}</button>{editingId && <button type="button" onClick={() => { setEditingId(null); setForm(EMPTY); }} className="rounded-md border px-4 py-2 text-sm">Cancelar</button>}</div>
    </form>
    <section className="space-y-4"><h2 className="font-editorial text-2xl font-semibold">Registros almacenados ({records.length})</h2>{loading ? <p className="text-sm text-[var(--text-muted)]">Cargando registros de Google Sheets…</p> : records.length === 0 ? <p className="p-6 rounded-xl border text-sm text-[var(--text-muted)]">No hay registros académicos.</p> : <ul className="space-y-3">{records.map((record) => <li key={record.id} className="p-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] flex flex-col sm:flex-row justify-between gap-4"><div className="space-y-1"><p className="text-xs text-[var(--accent-gold)]">#{record.id} · {record.type} · {record.status} · {record.visibility} · Orden {record.sort_order}</p><h3 className="font-editorial text-xl font-semibold">{record.title}</h3><p className="text-sm text-[var(--text-muted)]">{record.institution} {[record.chronology_start, record.chronology_end].filter(Boolean).join(' – ')}</p><p className="text-sm text-[var(--text-muted)]">{record.detail}</p>{record.support_url && <a href={record.support_url} target="_blank" rel="noopener noreferrer" className="inline-flex text-sm font-medium text-[var(--brand-green)] underline underline-offset-4">Abrir soporte en Google Drive</a>}</div><div className="flex gap-2 shrink-0"><button type="button" onClick={() => edit(record)} className="inline-flex items-center gap-1 rounded-md border px-3 py-2 text-xs"><Pencil className="w-3.5 h-3.5"/>Editar</button><button type="button" onClick={() => void remove(record)} className="inline-flex items-center gap-1 rounded-md border border-[var(--status-error)] px-3 py-2 text-xs text-[var(--status-error)]"><Trash2 className="w-3.5 h-3.5"/>Eliminar</button></div></li>)}</ul>}</section>
  </div>;
}
