import 'dotenv/config';
import crypto from 'node:crypto';
import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { AuditorService } from './server/ai/auditor.service.js';
import { AiAgentsService } from './server/ai/agents.service.js';
import { AutomationsService } from './server/ai/automations.service.js';
import { AuthService, type AuthenticatedRequest } from './server/auth/auth.service.js';
import { loadServerConfig } from './server/config/env.js';
import { SheetsRepositoryService } from './server/sheets/sheets.service.js';
import type { AcademicRecord, AcademicRecordType, EmploymentRecord, EmploymentRecordType, EmploymentSector, ProjectRecord, ProjectRecordType, RecordVisibility } from './shared/types';
import {
  validatePoliticalRecordInput,
  validateSiteSettingsInput,
} from './server/validation/records.js';

const academicRecordTypes: AcademicRecordType[] = [
  'Primaria', 'Bachillerato', 'Pregrado', 'Posgrado', 'Curso', 'Seminario', 'Diplomado', 'Área de conocimiento', 'Otro',
];

function validateAcademicInput(raw: Record<string, unknown>): Omit<AcademicRecord, 'id'> | null {
  const clean = (value: unknown, max = 2000) => typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, max)
    : '';
  const type = clean(raw.type, 80) as AcademicRecordType;
  const title = clean(raw.title, 180);
  const status = clean(raw.status, 100);
  const detail = clean(raw.detail, 2500);
  const supportUrl = clean(raw.support_url, 500);
  const sortOrder = Number(raw.sort_order);
  const rawVisibility = clean(raw.visibility, 20).toLowerCase();
  if (!academicRecordTypes.includes(type) || title.length < 2 || !status || detail.length < 5 ||
      !Number.isFinite(sortOrder) || sortOrder < 0 || sortOrder > 9999 ||
      !['publica', 'privada'].includes(rawVisibility)) return null;
  if (supportUrl) {
    try {
      const parsed = new URL(supportUrl);
      if (parsed.protocol !== 'https:' || !['drive.google.com', 'docs.google.com'].includes(parsed.hostname)) return null;
    } catch { return null; }
  }
  return {
    type, title, institution: clean(raw.institution, 180),
    chronology_start: clean(raw.chronology_start, 120), chronology_end: clean(raw.chronology_end, 120),
    status, detail, support_url: supportUrl, visibility: rawVisibility as RecordVisibility, sort_order: Math.round(sortOrder),
  };
}

const employmentRecordTypes: EmploymentRecordType[] = [
  'Empleado', 'Independiente', 'Contratista', 'Cargo público', 'Emprendimiento', 'Otro',
];
const employmentSectors: EmploymentSector[] = ['Público', 'Privado', 'Comunitario', 'Sin clasificar'];

function validateEmploymentInput(raw: Record<string, unknown>): Omit<EmploymentRecord, 'id'> | null {
  const clean = (value: unknown, max = 2000) => typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, max)
    : '';
  const type = clean(raw.type, 80) as EmploymentRecordType;
  const sector = clean(raw.sector, 40) as EmploymentSector;
  const title = clean(raw.title, 180);
  const status = clean(raw.status, 100);
  const detail = clean(raw.detail, 2500);
  const sortOrder = Number(raw.sort_order);
  const rawVisibility = clean(raw.visibility, 20).toLowerCase();
  if (!employmentRecordTypes.includes(type) || !employmentSectors.includes(sector) || title.length < 2 || !status || detail.length < 5 ||
      !Number.isFinite(sortOrder) || sortOrder < 0 || sortOrder > 9999 ||
      !['publica', 'privada'].includes(rawVisibility)) return null;
  return {
    type, sector, title, organization: clean(raw.organization, 180),
    chronology_start: clean(raw.chronology_start, 120), chronology_end: clean(raw.chronology_end, 120),
    status, detail, visibility: rawVisibility as RecordVisibility, sort_order: Math.round(sortOrder),
  };
}

const projectRecordTypes: ProjectRecordType[] = [
  'Junta de Acción Comunal', 'Nexus Web Studio', 'Campaña política como edil', 'Otro',
];

function validateProjectInput(raw: Record<string, unknown>): Omit<ProjectRecord, 'id'> | null {
  const clean = (value: unknown, max = 2000) => typeof value === 'string'
    ? value.replace(/[\u0000-\u001f\u007f<>]/g, '').trim().slice(0, max)
    : '';
  const type = clean(raw.type, 80) as ProjectRecordType;
  const title = clean(raw.title, 180);
  const status = clean(raw.status, 100);
  const detail = clean(raw.detail, 2500);
  const sortOrder = Number(raw.sort_order);
  const rawVisibility = clean(raw.visibility, 20).toLowerCase();
  if (!projectRecordTypes.includes(type) || title.length < 2 || !status || detail.length < 5 ||
      !Number.isFinite(sortOrder) || sortOrder < 0 || sortOrder > 9999 ||
      !['publica', 'privada'].includes(rawVisibility)) return null;
  return {
    type, title, organization: clean(raw.organization, 180),
    chronology_start: clean(raw.chronology_start, 120), chronology_end: clean(raw.chronology_end, 120),
    status, detail, visibility: rawVisibility as RecordVisibility, sort_order: Math.round(sortOrder),
  };
}

export async function createApp(options: { includeFrontend?: boolean } = {}) {
  const includeFrontend = options.includeFrontend ?? true;
  const config = loadServerConfig();
  const authService = new AuthService(config);
  const sheetsService = new SheetsRepositoryService(config);
  const auditorService = new AuditorService(config);
  const aiAgentsService = new AiAgentsService(config);
  const automationsService = new AutomationsService(config, sheetsService, auditorService);

  const envAdmin = authService.getEnvAdminForSheetSync();
  if (envAdmin && sheetsService.isSheetsConfigured()) {
    const rawPhotoUrl = sheetsService.getSettings().authorizedPhotoUrl || '/profile-photo.png';
    let resolvedPhotoUrl = rawPhotoUrl;
    try {
      resolvedPhotoUrl = new URL(rawPhotoUrl, config.appUrl).toString();
    } catch {
      resolvedPhotoUrl = rawPhotoUrl;
    }
    void sheetsService
      .syncAdminUserToUsersSheet(envAdmin.username, envAdmin.passwordHash, resolvedPhotoUrl)
      .catch(() => {
        // Non-fatal on startup; sheet status reports connectivity errors if any
      });
  }

  const app = express();
  app.set('trust proxy', 1);
  app.disable('x-powered-by');
  app.use(express.json({ limit: '7mb' }));

  // Basic security headers
  app.use((_req, res, next) => {
    res.setHeader('X-Content-Type-Options', 'nosniff');
    res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
    next();
  });

  // Origin check on mutating API calls
  app.use('/api', authService.requireSameOriginOnWrite);

  // Health endpoint
  app.get('/api/health', (_req, res) => {
    res.json({ ok: true, service: 'camilo-vidal-web' });
  });

  // Public data endpoints (ONLY visibility === 'publica')
  app.get('/api/public/content', async (_req, res) => {
    try {
      const [records, settings] = await Promise.all([
        sheetsService.getPublicRecords(),
        sheetsService.getPublicSettings(),
      ]);
      res.json({ records, settings });
    } catch {
      res.status(500).json({ error: 'No fue posible cargar la información pública.' });
    }
  });

  app.get('/api/public/academic-records', async (_req, res) => {
    try {
      res.json({ records: await sheetsService.getAcademicRecords(true) });
    } catch {
      res.status(503).json({ error: 'No fue posible cargar la vida académica desde Google Sheets.' });
    }
  });

  app.get('/api/public/employment-records', async (_req, res) => {
    try {
      res.json({ records: await sheetsService.getEmploymentRecords(true) });
    } catch {
      res.status(503).json({ error: 'No fue posible cargar la vida laboral desde Google Sheets.' });
    }
  });

  app.get('/api/public/project-records', async (_req, res) => {
    try {
      res.json({ records: await sheetsService.getProjectRecords(true) });
    } catch {
      res.status(503).json({ error: 'No fue posible cargar los proyectos desde Google Sheets.' });
    }
  });

  app.get('/api/public/community-managements', async (_req, res) => {
    try {
      res.json({ records: await sheetsService.getCommunityManagementRecords(true) });
    } catch (error) {
      res.status(503).json({
        error: error instanceof Error ? error.message : 'No fue posible cargar las gestiones desde Google Sheets.',
      });
    }
  });

  // Auth endpoints
  app.get('/api/auth/session', (req, res) => {
    res.json(authService.getSessionState(req));
  });

  app.post('/api/auth/recovery/request', (req, res) => {
    const result = authService.createLocalPasswordRecovery(req.socket.remoteAddress);
    if (!result.ok || !result.code || !result.username) {
      res.status(403).json({ error: result.error || 'No se pudo iniciar la recuperación.' });
      return;
    }
    res.status(201).json({ code: result.code, username: result.username, expiresInSeconds: 600 });
  });

  app.post('/api/auth/recovery/reset', (req, res) => {
    const code = typeof req.body?.code === 'string' ? req.body.code : '';
    const newPassword = typeof req.body?.newPassword === 'string' ? req.body.newPassword : '';
    const result = authService.resetLocalPassword(req.socket.remoteAddress, code, newPassword);
    if (!result.ok || !result.username) {
      res.status(400).json({ error: result.error || 'No se pudo restablecer la contraseña.' });
      return;
    }
    res.json({ ok: true, username: result.username });
  });

  app.post('/api/auth/setup', (req, res) => {
    const username = typeof req.body?.username === 'string' ? req.body.username : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const result = authService.setupInitialAdmin(username, password);
    if (!result.ok || !result.username) {
      res.status(400).json({ error: result.error || 'No se pudo configurar el acceso inicial.' });
      return;
    }
    const sessionToken = authService.issueSessionCookie(req, res, result.username);
    res.status(201).json({
      authenticated: true,
      username: result.username,
      needsInitialSetup: false,
      envConfigured: false,
      sessionToken,
    });
  });

  app.post('/api/auth/login', async (req, res) => {
    const username = typeof req.body?.username === 'string' ? req.body.username : '';
    const password = typeof req.body?.password === 'string' ? req.body.password : '';
    const result = await authService.verifyCredentialsWithSheet(
      username,
      password,
      sheetsService.verifyUserInUsersSheet.bind(sheetsService)
    );
    if (!result.ok || !result.username) {
      res.status(401).json({ error: result.error || 'Credenciales inválidas.' });
      return;
    }
    const sessionToken = authService.issueSessionCookie(req, res, result.username);
    res.json({
      authenticated: true,
      username: result.username,
      needsInitialSetup: false,
      envConfigured: authService.isEnvConfigured(),
      sessionToken,
    });
  });

  app.post('/api/auth/logout', (req, res) => {
    authService.clearSessionCookie(req, res);
    res.json({ ok: true });
  });

  // Protected Admin API routes
  const adminRouter = express.Router();
  adminRouter.use(authService.requireAuth);

  adminRouter.get('/records', async (req, res) => {
    const forceSync = req.query.sync === '1';
    try {
      const records = await sheetsService.getAllRecords(forceSync);
      const sheetsStatus = sheetsService.getSheetsStatus();
      const settings = await sheetsService.getPublicSettings();
      res.json({ records, sheetsStatus, settings });
    } catch {
      res.status(500).json({ error: 'No fue posible consultar los registros administrativos.' });
    }
  });

  adminRouter.get('/academic-records', async (_req, res) => {
    try {
      res.json({ records: await sheetsService.getAcademicRecords(false) });
    } catch (error) {
      res.status(503).json({ error: error instanceof Error ? error.message : 'No fue posible consultar los registros académicos.' });
    }
  });

  adminRouter.post('/academic-records', async (req, res) => {
    const input = validateAcademicInput(req.body || {});
    if (!input) { res.status(400).json({ error: 'Revisa los campos del registro académico.' }); return; }
    try { res.status(201).json({ record: await sheetsService.createAcademicRecord(input) }); }
    catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo crear el registro académico.' }); }
  });

  adminRouter.put('/academic-records/:id', async (req, res) => {
    const input = validateAcademicInput(req.body || {});
    if (!input) { res.status(400).json({ error: 'Revisa los campos del registro académico.' }); return; }
    try {
      const record = await sheetsService.updateAcademicRecord(req.params.id, input);
      if (!record) { res.status(404).json({ error: 'Registro académico no encontrado.' }); return; }
      res.json({ record });
    } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo actualizar el registro académico.' }); }
  });

  adminRouter.delete('/academic-records/:id', async (req, res) => {
    try {
      const deleted = await sheetsService.deleteAcademicRecord(req.params.id);
      if (!deleted) { res.status(404).json({ error: 'Registro académico no encontrado.' }); return; }
      res.json({ ok: true });
    } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo eliminar el registro académico.' }); }
  });

  adminRouter.get('/employment-records', async (_req, res) => {
    try {
      res.json({ records: await sheetsService.getEmploymentRecords(false) });
    } catch (error) {
      res.status(503).json({ error: error instanceof Error ? error.message : 'No fue posible consultar los registros laborales.' });
    }
  });

  adminRouter.post('/employment-records', async (req, res) => {
    const input = validateEmploymentInput(req.body || {});
    if (!input) { res.status(400).json({ error: 'Revisa los campos del registro laboral.' }); return; }
    try { res.status(201).json({ record: await sheetsService.createEmploymentRecord(input) }); }
    catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo crear el registro laboral.' }); }
  });

  adminRouter.put('/employment-records/:id', async (req, res) => {
    const input = validateEmploymentInput(req.body || {});
    if (!input) { res.status(400).json({ error: 'Revisa los campos del registro laboral.' }); return; }
    try {
      const record = await sheetsService.updateEmploymentRecord(req.params.id, input);
      if (!record) { res.status(404).json({ error: 'Registro laboral no encontrado.' }); return; }
      res.json({ record });
    } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo actualizar el registro laboral.' }); }
  });

  adminRouter.delete('/employment-records/:id', async (req, res) => {
    try {
      const deleted = await sheetsService.deleteEmploymentRecord(req.params.id);
      if (!deleted) { res.status(404).json({ error: 'Registro laboral no encontrado.' }); return; }
      res.json({ ok: true });
    } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo eliminar el registro laboral.' }); }
  });

  adminRouter.get('/project-records', async (_req, res) => {
    try {
      res.json({ records: await sheetsService.getProjectRecords(false) });
    } catch (error) {
      res.status(503).json({ error: error instanceof Error ? error.message : 'No fue posible consultar los proyectos.' });
    }
  });

  adminRouter.post('/project-records', async (req, res) => {
    const input = validateProjectInput(req.body || {});
    if (!input) { res.status(400).json({ error: 'Revisa los campos del proyecto.' }); return; }
    try { res.status(201).json({ record: await sheetsService.createProjectRecord(input) }); }
    catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo crear el proyecto.' }); }
  });

  adminRouter.put('/project-records/:id', async (req, res) => {
    const input = validateProjectInput(req.body || {});
    if (!input) { res.status(400).json({ error: 'Revisa los campos del proyecto.' }); return; }
    try {
      const record = await sheetsService.updateProjectRecord(req.params.id, input);
      if (!record) { res.status(404).json({ error: 'Proyecto no encontrado.' }); return; }
      res.json({ record });
    } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo actualizar el proyecto.' }); }
  });

  adminRouter.delete('/project-records/:id', async (req, res) => {
    try {
      const deleted = await sheetsService.deleteProjectRecord(req.params.id);
      if (!deleted) { res.status(404).json({ error: 'Proyecto no encontrado.' }); return; }
      res.json({ ok: true });
    } catch (error) { res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo eliminar el proyecto.' }); }
  });

  adminRouter.get('/sheets/tabs', async (_req, res) => {
    try {
      const tabs = await sheetsService.listSpreadsheetTabs();
      res.json({ tabs });
    } catch (error) {
      res.status(503).json({ error: error instanceof Error ? error.message : 'No fue posible consultar las hojas.' });
    }
  });

  adminRouter.get('/sheets/tab', async (req, res) => {
    const title = typeof req.query.name === 'string' ? req.query.name : '';
    if (!title || title.length > 100) {
      res.status(400).json({ error: 'Selecciona una pestaña válida de Google Sheets.' });
      return;
    }
    try {
      const table = await sheetsService.readSpreadsheetTab(title);
      res.json({ title, ...table });
    } catch (error) {
      res.status(503).json({ error: error instanceof Error ? error.message : 'No fue posible leer la pestaña.' });
    }
  });

  adminRouter.post('/profile-photo', async (req: AuthenticatedRequest, res) => {
    const rawDataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
    const match = /^data:(image\/(?:jpeg|png|webp));base64,([A-Za-z0-9+/]+={0,2})$/i.exec(rawDataUrl);
    if (!match) {
      res.status(400).json({ error: 'Selecciona una imagen JPG, PNG o WebP válida.' });
      return;
    }

    const mimeType = match[1].toLowerCase();
    const image = Buffer.from(match[2], 'base64');
    if (!image.length || image.length > 5 * 1024 * 1024) {
      res.status(413).json({ error: 'La foto debe pesar como máximo 5 MB.' });
      return;
    }

    const isJpeg = mimeType === 'image/jpeg' && image.length >= 3 && image[0] === 0xff && image[1] === 0xd8 && image[2] === 0xff;
    const isPng = mimeType === 'image/png' && image.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    const isWebp = mimeType === 'image/webp' && image.length >= 12 && image.toString('ascii', 0, 4) === 'RIFF' && image.toString('ascii', 8, 12) === 'WEBP';
    if (!isJpeg && !isPng && !isWebp) {
      res.status(400).json({ error: 'El contenido del archivo no coincide con una imagen JPG, PNG o WebP.' });
      return;
    }

    const extension = mimeType === 'image/jpeg' ? 'jpg' : mimeType === 'image/png' ? 'png' : 'webp';
    const uploadsDir = path.join(config.dataDir, 'uploads');
    fs.mkdirSync(uploadsDir, { recursive: true });
    const filename = `profile-${crypto.randomUUID()}.${extension}`;
    const photoUrl = `${config.appUrl.replace(/\/+$/, '')}/uploads/${filename}`;
    const currentSettings = sheetsService.getSettings();

    try {
      fs.writeFileSync(path.join(uploadsDir, filename), image, { flag: 'wx', mode: 0o644 });
      const { settings: savedSettings } = await sheetsService.updateSettings({
        ...currentSettings,
        authorizedPhotoUrl: photoUrl,
      });
      const sheetsWarning = await sheetsService.updateProfilePhotoUrlInInformationSheet(photoUrl);
      if (req.adminUser) {
        await sheetsService.updateUserProfileUrlInUsersSheet(req.adminUser, photoUrl).catch(() => undefined);
      }

      let oldUploadPath = '';
      try {
        oldUploadPath = new URL(currentSettings.authorizedPhotoUrl, config.appUrl).pathname;
      } catch {
        oldUploadPath = '';
      }
      const oldFile = /^\/uploads\/profile-[0-9a-f-]+\.(?:jpg|png|webp)$/i.exec(oldUploadPath);
      if (oldFile) {
        const oldPath = path.join(uploadsDir, path.basename(oldUploadPath));
        if (oldPath !== path.join(uploadsDir, filename) && fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      res.status(201).json({ settings: savedSettings, sheetsWarning });
    } catch {
      const savedPath = path.join(uploadsDir, filename);
      if (fs.existsSync(savedPath)) fs.unlinkSync(savedPath);
      res.status(500).json({ error: 'No se pudo guardar la fotografía de perfil.' });
    }
  });

  adminRouter.post('/records', async (req, res) => {
    const validation = validatePoliticalRecordInput(req.body || {});
    if (!validation.ok || !validation.data) {
      res.status(400).json({ error: 'Validación fallida.', fields: validation.errors });
      return;
    }
    try {
      const created = await sheetsService.createRecord(validation.data);
      res.status(201).json(created);
    } catch {
      res.status(500).json({ error: 'No se pudo crear el registro.' });
    }
  });

  adminRouter.put('/records/:id', async (req, res) => {
    const validation = validatePoliticalRecordInput(req.body || {});
    if (!validation.ok || !validation.data) {
      res.status(400).json({ error: 'Validación fallida.', fields: validation.errors });
      return;
    }
    try {
      const updated = await sheetsService.updateRecord(req.params.id, validation.data);
      if (!updated.record) {
        res.status(404).json({ error: 'Registro no encontrado.' });
        return;
      }
      res.json(updated);
    } catch {
      res.status(500).json({ error: 'No se pudo actualizar el registro.' });
    }
  });

  adminRouter.delete('/records/:id', async (req, res) => {
    try {
      const result = await sheetsService.deleteRecord(req.params.id);
      if (!result.deleted) {
        res.status(404).json({ error: 'Registro no encontrado.' });
        return;
      }
      res.json(result);
    } catch {
      res.status(500).json({ error: 'No se pudo eliminar el registro.' });
    }
  });

  adminRouter.put('/settings', async (req, res) => {
    const validation = validateSiteSettingsInput(req.body || {});
    if (!validation.ok || !validation.data) {
      res.status(400).json({ error: 'Configuración inválida.', fields: validation.errors });
      return;
    }
    const { settings: saved, sheetsWarning } = await sheetsService.updateSettings(validation.data);
    res.json({ settings: saved, sheetsWarning });
  });

  // AI Auditor routes
  adminRouter.get('/ai/manifest', (_req, res) => {
    res.json({
      manifest: auditorService.getManifestPreview(),
      reports: auditorService.listReports(),
    });
  });

  adminRouter.post('/ai/audit', async (_req, res) => {
    const result = await auditorService.runReadOnlyAudit();
    if (!result.ok) {
      res.status(502).json({ error: result.error });
      return;
    }
    res.status(201).json({ report: result.report });
  });

  adminRouter.get('/ai/agents', (_req, res) => {
    res.json({ agents: aiAgentsService.listAgents(), openAiAvailable: aiAgentsService.isProviderConfigured(), provider: 'OpenAI', model: aiAgentsService.getModel() });
  });

  adminRouter.post('/ai/agents', (req, res) => {
    const agent = aiAgentsService.saveAgent({
      name: String(req.body?.name || ''),
      description: String(req.body?.description || ''),
      instructions: String(req.body?.instructions || ''),
      trainingMaterial: String(req.body?.trainingMaterial || ''),
    });
    if (!agent) { res.status(400).json({ error: 'Revisa el nombre, la descripción y las instrucciones del agente.' }); return; }
    res.status(201).json({ agent });
  });

  adminRouter.put('/ai/agents/:id', (req, res) => {
    const agent = aiAgentsService.saveAgent({
      name: String(req.body?.name || ''),
      description: String(req.body?.description || ''),
      instructions: String(req.body?.instructions || ''),
      trainingMaterial: String(req.body?.trainingMaterial || ''),
    }, req.params.id);
    if (!agent) { res.status(400).json({ error: 'No se encontró el agente o faltan datos requeridos.' }); return; }
    res.json({ agent });
  });

  adminRouter.delete('/ai/agents/:id', (req, res) => {
    if (!aiAgentsService.deleteAgent(req.params.id)) { res.status(404).json({ error: 'Agente no encontrado.' }); return; }
    res.json({ ok: true });
  });

  adminRouter.post('/ai/agents/:id/run', async (req, res) => {
    try {
      const result = await aiAgentsService.runAgent(req.params.id, String(req.body?.task || ''));
      res.json(result);
    } catch (error) {
      res.status(503).json({ error: error instanceof Error ? error.message : 'No se pudo ejecutar el agente.' });
    }
  });

  adminRouter.post('/ai/agents/:id/apply', (req, res) => {
    const proposalId = typeof req.body?.proposalId === 'string' ? req.body.proposalId : '';
    if (!proposalId) { res.status(400).json({ error: 'Selecciona una propuesta de código válida.' }); return; }
    const result = aiAgentsService.applyCodeProposal(req.params.id, proposalId);
    if (!result.ok) { res.status(400).json({ error: result.error || 'No se pudo aplicar la propuesta.' }); return; }
    res.json({ ok: true, files: result.files || [] });
  });

  // Automations routes
  adminRouter.get('/automations', (_req, res) => {
    res.json({
      tasks: automationsService.listTasks(),
      runtimeNotice:
        'Las tareas programadas se ejecutan únicamente mientras el servidor de la aplicación permanezca activo en ejecución. No se ejecutan con el equipo apagado salvo despliegue continuo en la nube.',
    });
  });

  adminRouter.post('/automations', (req, res) => {
    const result = automationsService.createTask({
      name: String(req.body?.name || ''),
      type: req.body?.type,
      intervalMinutes: Number(req.body?.intervalMinutes),
      timezone: String(req.body?.timezone || 'America/Bogota'),
    });
    if (!result.ok || !result.task) {
      res.status(400).json({ error: result.error });
      return;
    }
    res.status(201).json({ task: result.task });
  });

  adminRouter.post('/automations/:id/toggle', (req, res) => {
    const updated = automationsService.togglePause(req.params.id);
    if (!updated) {
      res.status(404).json({ error: 'Automatización no encontrada.' });
      return;
    }
    res.json({ task: updated });
  });

  adminRouter.post('/automations/:id/run', async (req, res) => {
    const result = await automationsService.executeTask(req.params.id);
    if (!result.task) {
      res.status(404).json({ error: result.error || 'Automatización no encontrada.' });
      return;
    }
    res.status(result.ok ? 200 : 502).json(result);
  });

  adminRouter.delete('/automations/:id', (req, res) => {
    const deleted = automationsService.deleteTask(req.params.id);
    if (!deleted) {
      res.status(404).json({ error: 'Automatización no encontrada.' });
      return;
    }
    res.json({ ok: true });
  });

  app.use('/api/admin', adminRouter);

  const uploadsDir = path.join(config.dataDir, 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  app.use('/uploads', express.static(uploadsDir, { immutable: true, maxAge: '1d' }));

  // Vite/static serving is for the local server. Vercel serves the built SPA
  // separately and invokes this Express app through its /api function.
  if (includeFrontend) {
    if (!config.isProd) {
      const { createServer: createViteServer } = await import('vite');
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: 'spa',
      });
      app.use(vite.middlewares);
    } else {
      const distDir = path.resolve(process.cwd(), 'dist');
      app.use(express.static(distDir));
      app.get('*', (_req, res) => {
        const indexFile = path.join(distDir, 'index.html');
        if (fs.existsSync(indexFile)) {
          res.sendFile(indexFile);
        } else {
          res.status(404).send('Compila el frontend con npm run build antes de iniciar en producción.');
        }
      });
    }
  }

  return app;
}
