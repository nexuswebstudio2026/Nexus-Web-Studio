import { Clock, Pause, Play, ShieldCheck, Trash2 } from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import type { AuditReport, AutomationTask } from '../../../shared/types';
import { useAuth } from '../../context/AuthContext';
import { AdminCustomAgentsTab } from './AdminCustomAgentsTab';

interface ManifestData {
  agentName: string;
  role: string;
  mode: string;
  model: string;
  includedFiles: string[];
  excludedPatterns: string[];
  providerNotice: string;
}

export function AdminAiAgentsTab() {
  const { authFetch } = useAuth();
  const [subView, setSubView] = useState<'agentes' | 'auditoria' | 'automatizaciones'>('agentes');

  // Auditor state
  const [manifest, setManifest] = useState<ManifestData | null>(null);
  const [reports, setReports] = useState<AuditReport[]>([]);
  const [selectedReport, setSelectedReport] = useState<AuditReport | null>(null);
  const [loadingAudit, setLoadingAudit] = useState(true);
  const [runningAudit, setRunningAudit] = useState(false);
  const [auditError, setAuditError] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);

  // Automations state
  const [tasks, setTasks] = useState<AutomationTask[]>([]);
  const [runtimeNotice, setRuntimeNotice] = useState('');
  const [loadingTasks, setLoadingTasks] = useState(true);
  const [taskError, setTaskError] = useState<string | null>(null);
  const [taskFeedback, setTaskFeedback] = useState<string | null>(null);
  const [newTaskName, setNewTaskName] = useState('');
  const [newTaskType, setNewTaskType] = useState<'auditoria_sitio' | 'sincronizacion_sheets'>(
    'sincronizacion_sheets'
  );
  const [newTaskInterval, setNewTaskInterval] = useState('1440');
  const [newTaskTz, setNewTaskTz] = useState('America/Bogota');
  const [creatingTask, setCreatingTask] = useState(false);
  const [runningTaskId, setRunningTaskId] = useState<string | null>(null);

  const loadAuditData = useCallback(async () => {
    setLoadingAudit(true);
    try {
      const res = await authFetch('/api/admin/ai/manifest');
      if (res.ok) {
        const data = await res.json();
        setManifest(data.manifest);
        const list = (data.reports || []) as AuditReport[];
        setReports(list);
        if (list.length > 0 && !selectedReport) {
          setSelectedReport(list[0]);
        }
      }
    } finally {
      setLoadingAudit(false);
    }
  }, [authFetch, selectedReport]);

  const loadAutomations = useCallback(async () => {
    setLoadingTasks(true);
    try {
      const res = await authFetch('/api/admin/automations');
      if (res.ok) {
        const data = await res.json();
        setTasks(data.tasks || []);
        setRuntimeNotice(data.runtimeNotice || '');
      }
    } finally {
      setLoadingTasks(false);
    }
  }, [authFetch]);

  useEffect(() => {
    void loadAuditData();
    void loadAutomations();
  }, [loadAuditData, loadAutomations]);

  const handleRunAudit = async () => {
    setAuditError(null);
    if (!consentChecked) {
      setAuditError(
        'Debes confirmar la revisión de la lista de archivos permitidos y la advertencia de privacidad antes de enviar código al proveedor de IA.'
      );
      return;
    }
    setRunningAudit(true);
    try {
      const res = await authFetch('/api/admin/ai/audit', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setAuditError(data.error || 'No se pudo completar la auditoría.');
        await loadAuditData();
        return;
      }
      const created = data.report as AuditReport;
      setSelectedReport(created);
      await loadAuditData();
    } catch {
      setAuditError('Error de red al comunicarse con el endpoint de auditoría.');
    } finally {
      setRunningAudit(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    setTaskError(null);
    setTaskFeedback(null);
    if (newTaskName.trim().length < 3) {
      setTaskError('Ingresa un nombre descriptivo de al menos 3 caracteres.');
      return;
    }
    setCreatingTask(true);
    try {
      const res = await authFetch('/api/admin/automations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newTaskName,
          type: newTaskType,
          intervalMinutes: Number(newTaskInterval),
          timezone: newTaskTz,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setTaskError(data.error || 'No se pudo crear la automatización.');
        return;
      }
      setNewTaskName('');
      setTaskFeedback('Automatización programada correctamente.');
      await loadAutomations();
    } catch {
      setTaskError('Error de red al crear la automatización.');
    } finally {
      setCreatingTask(false);
    }
  };

  const handleToggleTask = async (id: string) => {
    setTaskError(null);
    setTaskFeedback(null);
    const res = await authFetch(`/api/admin/automations/${id}/toggle`, {
      method: 'POST',
    });
    if (res.ok) {
      await loadAutomations();
    }
  };

  const handleRunTaskNow = async (id: string) => {
    setRunningTaskId(id);
    setTaskError(null);
    setTaskFeedback(null);
    try {
      const res = await authFetch(`/api/admin/automations/${id}/run`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) {
        setTaskError(data.error || 'Falló la ejecución manual de la tarea.');
      } else {
        setTaskFeedback('Ejecución manual completada.');
      }
      await loadAutomations();
    } finally {
      setRunningTaskId(null);
    }
  };

  const handleDeleteTask = async (id: string) => {
    setTaskError(null);
    setTaskFeedback(null);
    const res = await authFetch(`/api/admin/automations/${id}`, {
      method: 'DELETE',
    });
    if (res.ok) {
      setTaskFeedback('Automatización eliminada.');
      await loadAutomations();
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="font-editorial text-3xl sm:text-4xl font-semibold text-[var(--text-ink)]">
            Agentes de IA y automatizaciones
          </h1>
          <p className="text-sm text-[var(--text-muted)]">
            Separación estricta entre auditoría puntual de solo lectura y tareas programadas recurrentes.
          </p>
        </div>

        <div
          role="tablist"
          aria-label="Tipo de operación de agentes"
          className="flex items-center gap-1 p-1 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-surface)]"
        >
          <button
            role="tab"
            type="button"
            aria-selected={subView === 'agentes'}
            onClick={() => setSubView('agentes')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              subView === 'agentes'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-ink)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-ink)]'
            }`}
          >
            Mis agentes
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={subView === 'auditoria'}
            onClick={() => setSubView('auditoria')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              subView === 'auditoria'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-ink)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-ink)]'
            }`}
          >
            Auditoría puntual
          </button>
          <button
            role="tab"
            type="button"
            aria-selected={subView === 'automatizaciones'}
            onClick={() => setSubView('automatizaciones')}
            className={`px-3.5 py-2 text-xs font-semibold rounded-md transition-colors cursor-pointer whitespace-nowrap ${
              subView === 'automatizaciones'
                ? 'bg-[var(--bg-elevated)] text-[var(--text-ink)]'
                : 'text-[var(--text-muted)] hover:text-[var(--text-ink)]'
            }`}
          >
            Automatizaciones recurrentes
          </button>
        </div>
      </header>

      {subView === 'agentes' && <AdminCustomAgentsTab />}

      {subView === 'auditoria' && (
        <div className="space-y-6">
          {loadingAudit || !manifest ? (
            <div className="p-6 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-sm text-[var(--text-muted)]">
              Cargando manifiesto de archivos permitidos...
            </div>
          ) : (
            <div className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-6 space-y-5">
              <div className="flex items-start gap-3 border-b border-[var(--border-hairline)] pb-4">
                <ShieldCheck className="w-5 h-5 text-[var(--brand-green)] shrink-0 mt-0.5" aria-hidden="true" />
                <div className="space-y-1">
                  <h2 className="font-editorial text-2xl font-semibold text-[var(--text-ink)]">
                    {manifest.agentName}
                  </h2>
                  <p className="text-xs text-[var(--text-muted)]">
                    {manifest.role} · Modelo configurado: <span className="font-mono-tabular">{manifest.model}</span>
                  </p>
                  <p className="text-xs font-medium text-[var(--accent-gold)]">{manifest.mode}</p>
                </div>
              </div>

              {/* Explicit allowlist & exclusion disclosure before sending */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs">
                <div className="p-4 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] space-y-2">
                  <p className="font-semibold text-[var(--text-ink)]">
                    Archivos fuente que se enviarán ({manifest.includedFiles.length})
                  </p>
                  <ul className="max-h-40 overflow-y-auto space-y-1 font-mono-tabular text-[var(--text-muted)]">
                    {manifest.includedFiles.map((f) => (
                      <li key={f}>{f}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-4 rounded-lg border border-[var(--border-hairline)] bg-[var(--bg-canvas)] space-y-2">
                  <p className="font-semibold text-[var(--text-ink)]">
                    Excluidos estrictamente (nunca se envían)
                  </p>
                  <ul className="space-y-1 text-[var(--text-muted)]">
                    {manifest.excludedPatterns.map((ex) => (
                      <li key={ex}>· {ex}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div className="p-4 rounded-lg border border-[var(--accent-gold)]/40 bg-[var(--accent-gold-soft)] text-xs text-[var(--text-ink)] space-y-3">
                <p className="leading-relaxed">{manifest.providerNotice}</p>
                <label className="flex items-start gap-2.5 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={consentChecked}
                    onChange={(e) => setConsentChecked(e.target.checked)}
                    className="mt-0.5 w-4 h-4 accent-[var(--brand-green)]"
                  />
                  <span>
                    He verificado la lista de archivos fuente permitidos y autorizo esta inspección puntual de solo lectura (sin editar archivos ni desplegar).
                  </span>
                </label>
              </div>

              {auditError && (
                <div
                  role="alert"
                  className="p-4 rounded-lg border border-[var(--status-error)] text-xs text-[var(--status-error)] bg-[var(--bg-canvas)]"
                >
                  {auditError}
                </div>
              )}

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleRunAudit}
                  disabled={runningAudit}
                  className="px-5 py-2.5 rounded-md text-sm font-semibold bg-[var(--brand-green)] text-white dark:text-[#0b140f] hover:bg-[var(--brand-green-hover)] disabled:opacity-60 cursor-pointer"
                >
                  {runningAudit ? 'Ejecutando auditoría de solo lectura...' : 'Ejecutar auditoría ahora'}
                </button>
              </div>
            </div>
          )}

          {/* Saved Reports */}
          <section className="space-y-4">
            <h3 className="font-editorial text-2xl font-semibold text-[var(--text-ink)]">
              Informes guardados ({reports.length})
            </h3>

            {reports.length === 0 ? (
              <div className="p-6 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-sm text-[var(--text-muted)]">
                Aún no se ha ejecutado ninguna auditoría. Cuando generes una, podrás consultarla aquí.
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <ul className="lg:col-span-4 space-y-2">
                  {reports.map((rep) => (
                    <li key={rep.id}>
                      <button
                        type="button"
                        onClick={() => setSelectedReport(rep)}
                        className={`w-full text-left p-4 rounded-xl border transition-colors cursor-pointer ${
                          selectedReport?.id === rep.id
                            ? 'border-[var(--accent-gold)] bg-[var(--bg-elevated)]'
                            : 'border-[var(--border-hairline)] bg-[var(--bg-surface)] hover:bg-[var(--bg-elevated)]'
                        }`}
                      >
                        <p className="font-mono-tabular text-xs text-[var(--accent-gold)]">
                          {new Date(rep.createdAt).toLocaleString('es-CO')}
                        </p>
                        <p className="text-sm font-semibold text-[var(--text-ink)] mt-1">
                          Informe {rep.id}
                        </p>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5">
                          Estado: {rep.status === 'completado' ? 'Completado' : 'Error reportado'} ·{' '}
                          {rep.includedFiles.length} archivos
                        </p>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className="lg:col-span-8 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-6">
                  {selectedReport ? (
                    selectedReport.status === 'error' ? (
                      <div className="space-y-2 text-sm text-[var(--status-error)]">
                        <p className="font-semibold">La ejecución presentó un error:</p>
                        <p>{selectedReport.errorMessage}</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[var(--border-hairline)] pb-3 text-xs text-[var(--text-muted)]">
                          <span className="font-mono-tabular">
                            {selectedReport.id} · Modelo {selectedReport.model}
                          </span>
                          <span>Modo solo lectura · No se aplicaron cambios</span>
                        </div>
                        <pre className="whitespace-pre-wrap font-sans text-sm text-[var(--text-ink)] leading-relaxed">
                          {selectedReport.markdownReport}
                        </pre>
                      </div>
                    )
                  ) : (
                    <p className="text-sm text-[var(--text-muted)]">
                      Selecciona un informe para leer su contenido.
                    </p>
                  )}
                </div>
              </div>
            )}
          </section>
        </div>
      )}

      {subView === 'automatizaciones' && (
        <div className="space-y-6">
          <div className="p-4 rounded-xl border border-[var(--accent-gold)]/40 bg-[var(--accent-gold-soft)] text-xs text-[var(--text-ink)] space-y-1.5">
            <p className="font-semibold">Advertencia de consumo y alcance de ejecución</p>
            <p>
              Cada ejecución automática del auditor de IA puede consumir cuota del proveedor o generar cargos según tu plan de facturación.
            </p>
            <p>{runtimeNotice}</p>
          </div>

          {taskError && (
            <div
              role="alert"
              className="p-3.5 rounded-lg border border-[var(--status-error)] text-xs text-[var(--status-error)] bg-[var(--bg-elevated)]"
            >
              {taskError}
            </div>
          )}

          {taskFeedback && (
            <div
              role="status"
              className="p-3.5 rounded-lg border border-[var(--status-success)] text-xs text-[var(--status-success)] bg-[var(--bg-elevated)]"
            >
              {taskFeedback}
            </div>
          )}

          <form
            onSubmit={handleCreateTask}
            className="rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] p-6 space-y-4"
          >
            <h2 className="font-editorial text-2xl font-semibold text-[var(--text-ink)]">
              Programar nueva tarea recurrente
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="space-y-1">
                <label htmlFor="auto-name" className="block text-xs font-semibold text-[var(--text-ink)]">
                  Nombre de la tarea
                </label>
                <input
                  id="auto-name"
                  type="text"
                  value={newTaskName}
                  onChange={(e) => setNewTaskName(e.target.value)}
                  placeholder="Ej. Verificación diaria Sheets"
                  className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-ink)]"
                />
              </div>

              <div className="space-y-1">
                <label htmlFor="auto-type" className="block text-xs font-semibold text-[var(--text-ink)]">
                  Acción
                </label>
                <select
                  id="auto-type"
                  value={newTaskType}
                  onChange={(e) =>
                    setNewTaskType(
                      e.target.value as 'auditoria_sitio' | 'sincronizacion_sheets'
                    )
                  }
                  className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-ink)]"
                >
                  <option value="sincronizacion_sheets">Sincronizar lectura Google Sheets</option>
                  <option value="auditoria_sitio">Auditoría solo lectura con IA (consume cuota)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="auto-interval" className="block text-xs font-semibold text-[var(--text-ink)]">
                  Frecuencia
                </label>
                <select
                  id="auto-interval"
                  value={newTaskInterval}
                  onChange={(e) => setNewTaskInterval(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-ink)]"
                >
                  <option value="60">Cada hora</option>
                  <option value="1440">Diaria (cada 24 horas)</option>
                  <option value="10080">Semanal (cada 7 días)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label htmlFor="auto-tz" className="block text-xs font-semibold text-[var(--text-ink)]">
                  Zona horaria
                </label>
                <input
                  id="auto-tz"
                  type="text"
                  value={newTaskTz}
                  onChange={(e) => setNewTaskTz(e.target.value)}
                  className="w-full px-3 py-2 text-sm font-mono-tabular rounded-md border border-[var(--border-hairline)] bg-[var(--bg-canvas)] text-[var(--text-ink)]"
                />
              </div>
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={creatingTask}
                className="px-5 py-2 rounded-md text-xs font-semibold bg-[var(--brand-green)] text-white dark:text-[#0b140f] hover:bg-[var(--brand-green-hover)] disabled:opacity-60 cursor-pointer"
              >
                {creatingTask ? 'Guardando...' : 'Crear automatización'}
              </button>
            </div>
          </form>

          {loadingTasks ? (
            <p className="text-sm text-[var(--text-muted)]">Cargando automatizaciones...</p>
          ) : tasks.length === 0 ? (
            <div className="p-6 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] text-sm text-[var(--text-muted)]">
              No hay tareas programadas actualmente.
            </div>
          ) : (
            <ul className="space-y-3">
              {tasks.map((task) => (
                <li
                  key={task.id}
                  className="p-5 rounded-xl border border-[var(--border-hairline)] bg-[var(--bg-elevated)] flex flex-col lg:flex-row lg:items-center justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[var(--text-muted)]">
                      <Clock className="w-3.5 h-3.5 text-[var(--accent-gold)]" aria-hidden="true" />
                      <span>{task.cronLabel}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono-tabular">{task.timezone}</span>
                      <span aria-hidden="true">·</span>
                      <span
                        className={
                          task.status === 'activa'
                            ? 'text-[var(--status-success)] font-semibold'
                            : 'text-[var(--status-warning)] font-semibold'
                        }
                      >
                        Estado: {task.status}
                      </span>
                    </div>
                    <h3 className="text-base font-semibold text-[var(--text-ink)]">{task.name}</h3>
                    <p className="text-xs text-[var(--text-muted)]">
                      Última ejecución:{' '}
                      {task.lastRunAt ? new Date(task.lastRunAt).toLocaleString('es-CO') : 'Nunca'}{' '}
                      {task.lastResult ? `· ${task.lastResult}` : ''}
                      {task.lastError ? `· Error: ${task.lastError}` : ''}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => void handleRunTaskNow(task.id)}
                      disabled={runningTaskId === task.id}
                      className="px-3 py-1.5 text-xs font-semibold rounded-md border border-[var(--border-hairline)] text-[var(--text-ink)] hover:bg-[var(--bg-surface)] cursor-pointer"
                    >
                      {runningTaskId === task.id ? 'Ejecutando...' : 'Ejecutar ahora'}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleToggleTask(task.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border border-[var(--border-hairline)] text-[var(--text-ink)] hover:bg-[var(--bg-surface)] cursor-pointer"
                    >
                      {task.status === 'activa' ? (
                        <>
                          <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Pausar</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5" aria-hidden="true" />
                          <span>Reanudar</span>
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteTask(task.id)}
                      aria-label={`Eliminar automatización "${task.name}"`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold rounded-md border border-[var(--status-error)] text-[var(--status-error)] hover:bg-[var(--bg-surface)] cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      <span>Eliminar</span>
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
