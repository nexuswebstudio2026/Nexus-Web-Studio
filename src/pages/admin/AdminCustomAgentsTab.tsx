import { Bot, Plus, Save, Send, Trash2 } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import type { AiAgentProfile } from '../../../shared/types';
import { useAuth } from '../../context/AuthContext';

type AgentForm = Pick<AiAgentProfile, 'name' | 'description' | 'instructions' | 'trainingMaterial'>;

const EMPTY_FORM: AgentForm = { name: '', description: '', instructions: '', trainingMaterial: '' };

function toForm(agent: AiAgentProfile): AgentForm {
  return {
    name: agent.name,
    description: agent.description,
    instructions: agent.instructions,
    trainingMaterial: agent.trainingMaterial,
  };
}

export function AdminCustomAgentsTab() {
  const { authFetch } = useAuth();
  const [agents, setAgents] = useState<AiAgentProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [form, setForm] = useState<AgentForm>(EMPTY_FORM);
  const [openAiAvailable, setOpenAiAvailable] = useState(false);
  const [providerModel, setProviderModel] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState('');
  const [task, setTask] = useState('');
  const [consentToSend, setConsentToSend] = useState(false);
  const [answer, setAnswer] = useState('');
  const [answerModel, setAnswerModel] = useState('');
  const [proposalId, setProposalId] = useState('');
  const [proposalPatch, setProposalPatch] = useState('');
  const [approveChanges, setApproveChanges] = useState(false);
  const [applyingChanges, setApplyingChanges] = useState(false);
  const isCodeAgent = selectedId === 'agent-fullstack-developer';

  const loadAgents = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await authFetch('/api/admin/ai/agents');
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudieron cargar los agentes.');
      const loaded = (data.agents || []) as AiAgentProfile[];
      setAgents(loaded);
      setOpenAiAvailable(Boolean(data.openAiAvailable));
      setProviderModel(typeof data.model === 'string' ? data.model : '');
      if (loaded.length) {
        const selected = loaded.find((agent) => agent.id === selectedId) || loaded[0];
        setSelectedId(selected.id);
        setForm(toForm(selected));
      } else {
        setSelectedId(null);
        setForm(EMPTY_FORM);
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Error cargando agentes.');
    } finally {
      setLoading(false);
    }
  }, [authFetch, selectedId]);

  useEffect(() => { void loadAgents(); }, [loadAgents]);

  const selectAgent = (agent: AiAgentProfile) => {
    setSelectedId(agent.id);
    setForm(toForm(agent));
    setTask('');
    setConsentToSend(false);
    setAnswer('');
    setProposalId('');
    setProposalPatch('');
    setApproveChanges(false);
    setError('');
    setFeedback('');
  };

  const startNewAgent = () => {
    setSelectedId(null);
    setForm(EMPTY_FORM);
    setTask('');
    setConsentToSend(false);
    setAnswer('');
    setProposalId('');
    setProposalPatch('');
    setApproveChanges(false);
    setError('');
    setFeedback('');
  };

  const saveAgent = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    setFeedback('');
    try {
      const response = await authFetch(selectedId ? `/api/admin/ai/agents/${selectedId}` : '/api/admin/ai/agents', {
        method: selectedId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo guardar el agente.');
      const saved = data.agent as AiAgentProfile;
      setAgents((current) => selectedId
        ? current.map((agent) => agent.id === saved.id ? saved : agent)
        : [saved, ...current]);
      setSelectedId(saved.id);
      setForm(toForm(saved));
      setFeedback(selectedId ? 'Instrucciones y material de entrenamiento guardados.' : 'Agente creado y guardado en este servidor.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Error guardando el agente.');
    } finally {
      setSaving(false);
    }
  };

  const deleteAgent = async () => {
    if (!selectedId || !window.confirm(`¿Eliminar el agente “${form.name}” y su material de entrenamiento?`)) return;
    setError('');
    setFeedback('');
    try {
      const response = await authFetch(`/api/admin/ai/agents/${selectedId}`, { method: 'DELETE' });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo eliminar el agente.');
      const remaining = agents.filter((agent) => agent.id !== selectedId);
      setAgents(remaining);
      if (remaining.length) selectAgent(remaining[0]);
      else startNewAgent();
      setFeedback('Agente eliminado del almacenamiento local.');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Error eliminando el agente.');
    }
  };

  const runAgent = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setFeedback('');
    setAnswer('');
    setProposalId('');
    setProposalPatch('');
    setApproveChanges(false);
    if (!selectedId) {
      setError('Guarda el agente antes de probarlo.');
      return;
    }
    if (!consentToSend) {
      setError(isCodeAgent
        ? 'Confirma que autorizas el envío de la solicitud, el material guardado y los archivos de código permitidos a OpenAI.'
        : 'Confirma que autorizas el envío de la solicitud y del material guardado a OpenAI.');
      return;
    }
    setRunning(true);
    try {
      const response = await authFetch(`/api/admin/ai/agents/${selectedId}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ task }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo generar una respuesta.');
      setAnswer(data.text || 'El agente no devolvió contenido.');
      setAnswerModel(data.model || '');
      setProposalId(typeof data.proposalId === 'string' ? data.proposalId : '');
      setProposalPatch(typeof data.proposalPatch === 'string' ? data.proposalPatch : '');
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'Error al comunicarse con OpenAI.');
    } finally {
      setRunning(false);
      setConsentToSend(false);
    }
  };

  const applyProposal = async () => {
    if (!selectedId || !proposalId || !approveChanges) return;
    setApplyingChanges(true);
    setError('');
    setFeedback('');
    try {
      const response = await authFetch(`/api/admin/ai/agents/${selectedId}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ proposalId }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'No se pudo aplicar el diff.');
      const files = Array.isArray(data.files) ? data.files.join(', ') : '';
      setFeedback(`Diff aplicado al código local${files ? `: ${files}` : ''}. Revisa los cambios y reinicia el servidor si modifican el backend.`);
      setProposalId('');
      setProposalPatch('');
      setApproveChanges(false);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo aplicar el diff.');
    } finally {
      setApplyingChanges(false);
    }
  };

  const fieldClass = 'w-full rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] px-3 py-2.5 text-sm text-[var(--text-ink)]';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="font-editorial text-2xl font-semibold text-[var(--text-ink)]">Agentes personalizados</h2>
          <p className="mt-1 text-sm text-[var(--text-muted)]">Crea perfiles, guarda instrucciones y agrega material de referencia para cada agente.</p>
        </div>
        <button type="button" onClick={startNewAgent} className="inline-flex items-center gap-2 rounded-md bg-[var(--brand-green)] px-4 py-2.5 text-sm font-semibold text-white">
          <Plus className="h-4 w-4" aria-hidden="true" /> Nuevo agente
        </button>
      </div>

      <div className="rounded-lg border border-[var(--accent-gold)]/40 bg-[var(--accent-gold-soft)] p-4 text-xs leading-relaxed text-[var(--text-ink)]">
        “Entrenar” aquí significa guardar instrucciones y referencias que se adjuntan a cada consulta; no cambia los pesos del modelo ni realiza ajuste fino. Los agentes generan borradores y análisis, pero no publican en las redes.
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-[17rem_minmax(0,1fr)] gap-5">
        <aside className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[var(--text-ink)]">Tus agentes</h3>
            <span className="text-xs text-[var(--text-muted)]">{agents.length}</span>
          </div>
          {loading ? <p className="text-sm text-[var(--text-muted)]">Cargando…</p> : agents.length === 0 ? (
            <div className="rounded-xl border border-[var(--border-hairline)] p-4 text-sm text-[var(--text-muted)]">Crea tu primer agente.</div>
          ) : agents.map((agent) => (
            <button key={agent.id} type="button" onClick={() => selectAgent(agent)} className={`w-full rounded-xl border p-4 text-left transition-colors ${selectedId === agent.id ? 'border-[var(--accent-gold)] bg-[var(--bg-elevated)]' : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]'}`}>
              <span className="mb-2 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-[var(--accent-gold-soft)] text-[var(--accent-gold)]"><Bot className="h-4 w-4" aria-hidden="true" /></span>
              <span className="block text-sm font-semibold text-[var(--text-ink)]">{agent.name}</span>
              <span className="mt-1 block line-clamp-2 text-xs text-[var(--text-muted)]">{agent.description}</span>
            </button>
          ))}
        </aside>

        <div className="space-y-5">
          <form onSubmit={saveAgent} className="space-y-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 sm:p-6">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-editorial text-xl font-semibold text-[var(--text-ink)]">{selectedId ? 'Configurar y entrenar' : 'Crear agente'}</h3>
                <p className="mt-1 text-xs text-[var(--text-muted)]">La configuración se guarda localmente en el servidor.</p>
              </div>
              {selectedId && <button type="button" onClick={() => void deleteAgent()} aria-label={`Eliminar agente ${form.name}`} className="inline-flex items-center gap-1 rounded-md border border-[var(--status-error)] px-3 py-2 text-xs text-[var(--status-error)]"><Trash2 className="h-3.5 w-3.5" aria-hidden="true" /> Eliminar</button>}
            </div>

            <label className="block space-y-1.5 text-xs font-semibold text-[var(--text-ink)]">Nombre del agente
              <input required minLength={3} maxLength={100} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} placeholder="Ej. Estratega de Redes y Marketing Digital" className={fieldClass} />
            </label>
            <label className="block space-y-1.5 text-xs font-semibold text-[var(--text-ink)]">Funciones principales
              <textarea required minLength={5} maxLength={500} rows={2} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Qué tareas debe ayudar a realizar" className={fieldClass} />
            </label>
            <label className="block space-y-1.5 text-xs font-semibold text-[var(--text-ink)]">Instrucciones del agente
              <textarea required minLength={30} maxLength={8000} rows={8} value={form.instructions} onChange={(event) => setForm({ ...form, instructions: event.target.value })} placeholder="Define el rol, el tono, las tareas permitidas y los límites" className={fieldClass} />
            </label>
            <label className="block space-y-1.5 text-xs font-semibold text-[var(--text-ink)]">Material para entrenar (referencias aprobadas)
              <textarea maxLength={24000} rows={7} value={form.trainingMaterial} onChange={(event) => setForm({ ...form, trainingMaterial: event.target.value })} placeholder="Pega pautas de marca, información confirmada, servicios, enlaces y ejemplos aprobados. No agregues contraseñas ni datos sensibles." className={fieldClass} />
            </label>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--border-hairline)] pt-4">
              <p className={`text-xs font-medium ${openAiAvailable ? 'text-[var(--status-success)]' : 'text-[var(--status-warning)]'}`}>
                {openAiAvailable ? `OpenAI está configurado${providerModel ? ` · ${providerModel}` : ''}; se valida al generar.` : 'Puedes guardar agentes; falta configurar OPENAI_API_KEY para generar respuestas.'}
              </p>
              <button type="submit" disabled={saving} className="inline-flex items-center gap-2 rounded-md bg-[var(--brand-green)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
                <Save className="h-4 w-4" aria-hidden="true" /> {saving ? 'Guardando…' : selectedId ? 'Guardar y entrenar' : 'Crear agente'}
              </button>
            </div>
          </form>

          {selectedId && <form onSubmit={runAgent} className="space-y-4 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-5 sm:p-6">
            <div>
              <h3 className="font-editorial text-xl font-semibold text-[var(--text-ink)]">Probar agente</h3>
              <p className="mt-1 text-xs text-[var(--text-muted)]">La respuesta se genera con OpenAI y queda para revisión; no se publica automáticamente.</p>
            </div>
            <div className="rounded-lg border border-[var(--accent-gold)]/50 bg-[var(--accent-gold-soft)] p-3.5">
              <label className="flex items-start gap-2.5 text-xs leading-relaxed text-[var(--text-ink)]">
                <input type="checkbox" checked={consentToSend} onChange={(event) => setConsentToSend(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand-green)]" />
                <span><strong className="block">Antes de generar, autoriza el envío a OpenAI.</strong> {isCodeAgent ? 'Se compartirán tu solicitud, el material guardado y los archivos de código permitidos del sitio; se excluyen .env, secretos y datos locales.' : 'Se compartirán tu solicitud y el material de referencia guardado.'} No incluyas contraseñas ni datos confidenciales.</span>
              </label>
              {!consentToSend && <p className="ml-6 mt-1.5 text-[11px] text-[var(--text-muted)]">Marca esta casilla para habilitar “Generar respuesta”.</p>}
            </div>
            <label className="block space-y-1.5 text-xs font-semibold text-[var(--text-ink)]">¿Qué tarea quieres pedirle?
              <textarea required minLength={3} maxLength={6000} rows={3} value={task} onChange={(event) => setTask(event.target.value)} placeholder="Ej. Propón un calendario informativo de publicaciones para esta semana con los datos aprobados." className={fieldClass} />
            </label>
            <div className="flex justify-end">
              <button type="submit" disabled={running || !openAiAvailable || !consentToSend || task.trim().length < 3} className="inline-flex items-center gap-2 rounded-md bg-[var(--brand-green)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                <Send className="h-4 w-4" aria-hidden="true" /> {running ? 'Generando…' : 'Generar respuesta'}
              </button>
            </div>
            {answer && <section aria-live="polite" className="space-y-2 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-[var(--accent-gold)]">Borrador generado{answerModel ? ` · ${answerModel}` : ''}</p>
              <div className="whitespace-pre-wrap text-sm leading-relaxed text-[var(--text-ink)]">{answer}</div>
            </section>}
            {proposalId && proposalPatch && <section className="space-y-3 rounded-lg border border-[var(--accent-gold)]/60 bg-[var(--bg-canvas)] p-4">
              <h4 className="text-sm font-semibold text-[var(--text-ink)]">Cambios de código propuestos</h4>
              <p className="text-xs leading-relaxed text-[var(--text-muted)]">Revisa el diff. Sólo se aplicarán archivos de código permitidos; no se despliega ni publica el sitio.</p>
              <details>
                <summary className="cursor-pointer text-xs font-semibold text-[var(--brand-green)]">Ver diff completo</summary>
                <pre className="mt-2 max-h-80 overflow-auto rounded-md border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-3 text-[11px] leading-relaxed text-[var(--text-ink)]">{proposalPatch}</pre>
              </details>
              <label className="flex items-start gap-2 text-xs leading-relaxed text-[var(--text-ink)]">
                <input type="checkbox" checked={approveChanges} onChange={(event) => setApproveChanges(event.target.checked)} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--brand-green)]" />
                <span>He revisado este diff y autorizo aplicarlo al código local.</span>
              </label>
              <div className="flex justify-end">
                <button type="button" onClick={() => void applyProposal()} disabled={!approveChanges || applyingChanges} className="rounded-md bg-[var(--brand-green)] px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50">
                  {applyingChanges ? 'Aplicando…' : 'Aprobar y aplicar cambios'}
                </button>
              </div>
            </section>}
          </form>}

          {error && <p role="alert" className="rounded-lg border border-[var(--status-error)] p-4 text-sm text-[var(--status-error)]">{error}</p>}
          {feedback && <p role="status" className="rounded-lg border border-[var(--status-success)] p-4 text-sm text-[var(--status-success)]">{feedback}</p>}
        </div>
      </div>
    </div>
  );
}
