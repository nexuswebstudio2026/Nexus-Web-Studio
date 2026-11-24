import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export interface ServerConfig {
  port: number;
  nodeEnv: string;
  isProd: boolean;
  appUrl: string;
  sessionSecret: string;
  sessionSecretFromEnv: boolean;
  adminUsername: string | null;
  adminPasswordHash: string | null;
  adminPasswordPlainEnv: string | null;
  geminiApiKey: string | null;
  openAiApiKey: string | null;
  openAiModel: string;
  googleSheets: {
    spreadsheetId: string | null;
    sheetName: string;
    informationSheetName: string;
    socialLinksSheetName: string;
    academicSheetName: string;
    employmentSheetName: string;
    usersSheetName: string;
    projectsSheetName: string;
    communityManagementsSheetName: string;
    serviceAccountEmail: string | null;
    privateKey: string | null;
  };
  dataDir: string;
}

function resolveSessionSecret(dataDir: string): { secret: string; fromEnv: boolean } {
  const envSecret = process.env.SESSION_SECRET?.trim();
  if (envSecret && envSecret.length >= 16) {
    return { secret: envSecret, fromEnv: true };
  }

  fs.mkdirSync(dataDir, { recursive: true });
  const secretFile = path.join(dataDir, '.session-secret');
  if (fs.existsSync(secretFile)) {
    const saved = fs.readFileSync(secretFile, 'utf8').trim();
    if (saved.length >= 32) {
      return { secret: saved, fromEnv: false };
    }
  }
  const generated = crypto.randomBytes(32).toString('hex');
  fs.writeFileSync(secretFile, generated, { mode: 0o600 });
  return { secret: generated, fromEnv: false };
}

export function loadServerConfig(): ServerConfig {
  // Vercel's function bundle is read-only. Use its writable temporary area for
  // per-instance caches; Google Sheets remains the durable data source.
  const dataDir = process.env.VERCEL
    ? path.join(os.tmpdir(), 'camilo-vidal')
    : path.resolve(process.cwd(), 'data');
  const port = Number(process.env.PORT) || 3000;
  const session = resolveSessionSecret(dataDir);
  const vercelHostname = process.env.VERCEL
    ? process.env.VERCEL_ENV === 'production'
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL
      : process.env.VERCEL_URL || process.env.VERCEL_PROJECT_PRODUCTION_URL
    : null;

  const rawId = process.env.GOOGLE_SHEETS_SPREADSHEET_ID?.trim() || '';
  const urlMatch = rawId.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const spreadsheetId = (urlMatch ? urlMatch[1] : rawId) || null;

  const stripQuotes = (value: string) =>
    (value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))
      ? value.slice(1, -1)
      : value;

  let serviceAccountEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL?.trim() || null;
  let privateKey = process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY?.trim() || null;
  if (privateKey) privateKey = stripQuotes(privateKey);

  const rawJsonEnv = process.env.GOOGLE_SERVICE_ACCOUNT_JSON?.trim();
  if (rawJsonEnv && (!serviceAccountEmail || !privateKey)) {
    try {
      const cleanedJson = stripQuotes(rawJsonEnv);
      const jsonText = cleanedJson.startsWith('{')
        ? cleanedJson
        : Buffer.from(cleanedJson, 'base64').toString('utf8');
      const parsed = JSON.parse(jsonText) as { client_email?: string; private_key?: string };
      if (parsed.client_email && parsed.private_key) {
        serviceAccountEmail = parsed.client_email.trim();
        privateKey = parsed.private_key.trim();
      }
    } catch {
      // Ignore malformed env JSON; SheetsRepositoryService will report unconfigured/error cleanly
    }
  }

  return {
    port,
    nodeEnv: process.env.NODE_ENV || 'development',
    isProd: process.env.NODE_ENV === 'production',
    appUrl: vercelHostname
      ? `https://${vercelHostname}`
      : process.env.APP_URL?.trim() || `http://localhost:${port}`,
    sessionSecret: session.secret,
    sessionSecretFromEnv: session.fromEnv,
    adminUsername: process.env.ADMIN_USERNAME?.trim() || null,
    adminPasswordHash: process.env.ADMIN_PASSWORD_HASH?.trim() || null,
    adminPasswordPlainEnv: process.env.ADMIN_PASSWORD?.trim() || null,
    geminiApiKey: process.env.GEMINI_API_KEY?.trim() || null,
    openAiApiKey: process.env.OPENAI_API_KEY?.trim() || null,
    openAiModel: process.env.OPENAI_MODEL?.trim() || 'gpt-6-luna',
    googleSheets: {
      spreadsheetId,
      sheetName: process.env.GOOGLE_SHEETS_SHEET_NAME?.trim() || 'Registros',
      informationSheetName: process.env.GOOGLE_SHEETS_INFORMATION_SHEET_NAME?.trim() || 'Información',
      socialLinksSheetName: process.env.GOOGLE_SHEETS_SOCIAL_LINKS_SHEET_NAME?.trim() || 'Redes sociales',
      academicSheetName: process.env.GOOGLE_SHEETS_ACADEMIC_SHEET_NAME?.trim() || 'Vida académica',
      employmentSheetName: process.env.GOOGLE_SHEETS_EMPLOYMENT_SHEET_NAME?.trim() || 'Vida laboral',
      usersSheetName: process.env.GOOGLE_SHEETS_USERS_SHEET_NAME?.trim() || 'Usuarios',
      projectsSheetName: process.env.GOOGLE_SHEETS_PROJECTS_SHEET_NAME?.trim() || 'Proyectos',
      communityManagementsSheetName: process.env.GOOGLE_SHEETS_COMMUNITY_MANAGEMENTS_SHEET_NAME?.trim() || 'Gestiones realizadas',
      serviceAccountEmail,
      privateKey: privateKey ? privateKey.replace(/\\n/g, '\n') : null,
    },
    dataDir,
  };
}
