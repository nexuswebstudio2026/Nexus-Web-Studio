import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { AutomationTask } from '../../shared/types';
import type { ServerConfig } from '../config/env';
import type { SheetsRepositoryService } from '../sheets/sheets.service';
import type { AuditorService } from './auditor.service';

export class AutomationsService {
  private readonly filePath: string;
  private readonly timers = new Map<string, NodeJS.Timeout>();

  constructor(
    private readonly config: ServerConfig,
    private readonly sheetsService: SheetsRepositoryService,
    private readonly auditorService: AuditorService
  ) {
    fs.mkdirSync(config.dataDir, { recursive: true });
    this.filePath = path.join(config.dataDir, 'automations.json');
    this.bootstrapActiveTimers();
  }

  private readAll(): AutomationTask[] {
    if (!fs.existsSync(this.filePath)) return [];
    try {
      const parsed = JSON.parse(fs.readFileSync(this.filePath, 'utf8')) as AutomationTask[];
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  private writeAll(tasks: AutomationTask[]): void {
    fs.writeFileSync(this.filePath, JSON.stringify(tasks, null, 2), 'utf8');
  }

  private scheduleTimer(task: AutomationTask): void {
    const existing = this.timers.get(task.id);
    if (existing) {
      clearInterval(existing);
      this.timers.delete(task.id);
    }
    if (task.status !== 'activa') return;

    const ms = Math.max(5, task.intervalMinutes) * 60_000;
    const handle = setInterval(() => {
      void this.executeTask(task.id);
    }, ms);
    handle.unref?.();
    this.timers.set(task.id, handle);
  }

  private bootstrapActiveTimers(): void {
    const tasks = this.readAll();
    for (const t of tasks) {
      if (t.status === 'activa') {
        this.scheduleTimer(t);
      }
    }
  }

  listTasks(): AutomationTask[] {
    return this.readAll();
  }

  createTask(input: {
    name: string;
    type: 'auditoria_sitio' | 'sincronizacion_sheets';
    intervalMinutes: number;
    timezone: string;
  }): { ok: boolean; task?: AutomationTask; error?: string } {
    const cleanName = input.name.replace(/[<>]/g, '').trim().slice(0, 120);
    if (cleanName.length < 3) {
      return { ok: false, error: 'El nombre de la automatización debe tener al menos 3 caracteres.' };
    }
    const mins = Number(input.intervalMinutes);
    if (!Number.isFinite(mins) || mins < 15 || mins > 10080) {
      return { ok: false, error: 'El intervalo debe estar entre 15 minutos y 7 días (10080 minutos).' };
    }
    const tz = input.timezone.trim() || 'America/Bogota';
    const cronLabel =
      mins === 60
        ? 'Cada hora'
        : mins === 1440
          ? 'Diaria (cada 24 horas)'
          : mins === 10080
            ? 'Semanal (cada 7 días)'
            : `Cada ${mins} minutos`;

    const nextRun = new Date(Date.now() + mins * 60_000).toISOString();
    const task: AutomationTask = {
      id: `auto-${crypto.randomUUID().slice(0, 8)}`,
      name: cleanName,
      type: input.type === 'auditoria_sitio' ? 'auditoria_sitio' : 'sincronizacion_sheets',
      cronLabel,
      intervalMinutes: mins,
      timezone: tz,
      status: 'activa',
      lastRunAt: null,
      nextRunAt: nextRun,
      lastResult: null,
      lastError: null,
    };

    const all = [task, ...this.readAll()];
    this.writeAll(all);
    this.scheduleTimer(task);
    return { ok: true, task };
  }

  togglePause(id: string): AutomationTask | null {
    const all = this.readAll();
    const target = all.find((t) => t.id === id);
    if (!target) return null;

    const nextStatus = target.status === 'activa' ? 'pausada' : 'activa';
    const updated: AutomationTask = {
      ...target,
      status: nextStatus,
      nextRunAt:
        nextStatus === 'activa'
          ? new Date(Date.now() + target.intervalMinutes * 60_000).toISOString()
          : null,
    };

    this.writeAll(all.map((t) => (t.id === id ? updated : t)));
    this.scheduleTimer(updated);
    return updated;
  }

  deleteTask(id: string): boolean {
    const existing = this.timers.get(id);
    if (existing) {
      clearInterval(existing);
      this.timers.delete(id);
    }
    const all = this.readAll();
    const next = all.filter((t) => t.id !== id);
    if (next.length === all.length) return false;
    this.writeAll(next);
    return true;
  }

  async executeTask(id: string): Promise<{ ok: boolean; task?: AutomationTask; error?: string }> {
    const all = this.readAll();
    const target = all.find((t) => t.id === id);
    if (!target) return { ok: false, error: 'Automatización no encontrada.' };

    const nowIso = new Date().toISOString();
    const nextRunIso =
      target.status === 'activa'
        ? new Date(Date.now() + target.intervalMinutes * 60_000).toISOString()
        : null;

    let lastResult: string | null = null;
    let lastError: string | null = null;

    if (target.type === 'auditoria_sitio') {
      const res = await this.auditorService.runReadOnlyAudit();
      if (res.ok && res.report) {
        lastResult = `Auditoría generada (${res.report.id}).`;
      } else {
        lastError = res.error || 'Error ejecutando auditoría.';
      }
    } else {
      await this.sheetsService.syncFromSheetsIfNeeded(true);
      const status = this.sheetsService.getSheetsStatus();
      if (status.lastError) {
        lastError = status.lastError;
      } else if (!status.configured) {
        lastResult = 'Revisión completada sobre almacenamiento local (Google Sheets sin credenciales).';
      } else {
        lastResult = 'Sincronización con Google Sheets completada.';
      }
    }

    const updated: AutomationTask = {
      ...target,
      lastRunAt: nowIso,
      nextRunAt: nextRunIso,
      lastResult,
      lastError,
    };

    const latestAll = this.readAll();
    this.writeAll(latestAll.map((t) => (t.id === id ? updated : t)));

    return lastError
      ? { ok: false, task: updated, error: lastError }
      : { ok: true, task: updated };
  }
}
