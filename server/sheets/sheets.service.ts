import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { AcademicRecord, AcademicRecordType, CommunityManagementRecord, EmploymentRecord, EmploymentRecordType, EmploymentSector, ProjectRecord, ProjectRecordType, PoliticalRecord, SheetsStatusInfo, SiteSettings } from '../../shared/types';
import type { ServerConfig } from '../config/env';
import { INITIAL_RECORDS, INITIAL_SETTINGS } from '../data/seed-data.js';
import { compareRecordsById, inferEmploymentSector, sortRecordsById } from '../../shared/employment.js';
import { sortProjectRecords } from '../../shared/projects.js';
import {
  filterPublicRecords,
  recordToRowArray,
  rowArrayToRecord,
  SHEET_HEADERS,
  validateSheetHeaders,
} from './sheets-mapper.js';

const ACADEMIC_HEADERS = [
  'id', 'type', 'title', 'institution', 'chronology_start', 'chronology_end',
  'status', 'detail', 'visibility', 'sort_order', 'URL del soporte',
] as const;

const EMPLOYMENT_HEADERS = [
  'id', 'type', 'title', 'organization', 'chronology_start', 'chronology_end',
  'status', 'detail', 'visibility', 'sort_order', 'sector',
] as const;

const PROJECT_HEADERS = [
  'id', 'type', 'title', 'organization', 'chronology_start', 'chronology_end',
  'status', 'detail', 'visibility', 'sort_order',
] as const;

const COMMUNITY_MANAGEMENT_HEADERS = [
  'id', 'title', 'category', 'chronology', 'status', 'detail', 'visibility', 'sort_order',
] as const;

const INITIAL_ACADEMIC_ROWS: Omit<AcademicRecord, 'id'>[] = [
  {
    type: 'Primaria', title: 'Estudios de primaria', institution: 'Escuela Rafael Pombo de Girardot',
    chronology_start: '', chronology_end: '', status: 'Finalizado',
    detail: 'Cursó y terminó la primaria en la Escuela Rafael Pombo de Girardot, Cundinamarca.',
    support_url: '',
    visibility: 'publica', sort_order: 10,
  },
  {
    type: 'Bachillerato', title: 'Bachiller académico', institution: 'Colegio INEM de Pasto',
    chronology_start: '', chronology_end: '2012', status: 'Finalizado',
    detail: 'Se graduó como bachiller en 2012 en el colegio INEM de la ciudad de Pasto.',
    support_url: '',
    visibility: 'publica', sort_order: 20,
  },
  {
    type: 'Pregrado', title: 'Administración Pública', institution: 'Escuela Superior de Administración Pública (ESAP)',
    chronology_start: '', chronology_end: '', status: 'En curso · cuarto semestre',
    detail: 'Actualmente cursa cuarto semestre de Administración Pública en la ESAP. Este registro describe un programa en curso y no un título terminado.',
    support_url: '',
    visibility: 'publica', sort_order: 30,
  },
  {
    type: 'Área de conocimiento', title: 'Áreas de conocimiento declaradas', institution: '',
    chronology_start: '', chronology_end: '', status: 'Conocimientos amplios',
    detail: 'Contaduría, administración de empresas, mercadeo, derecho, programación web y administración pública. Esta ficha no afirma títulos ni certificaciones en esas áreas.',
    support_url: '',
    visibility: 'publica', sort_order: 40,
  },
];

interface LocalStoreData {
  records: PoliticalRecord[];
  settings: SiteSettings;
  lastSyncAt: string | null;
}

function normalizeStoredRecord(value: unknown): PoliticalRecord {
  const raw = (value || {}) as Record<string, unknown>;
  const legacyPeriod = typeof raw.period === 'string' ? raw.period.trim() : '';
  const legacyRange = legacyPeriod.split(/\s+[–—-]\s+/, 2);
  const remaining = { ...raw };
  delete remaining.category;
  delete remaining.period;
  return {
    ...remaining,
    chronology_start: typeof raw.chronology_start === 'string' && raw.chronology_start.trim()
      ? raw.chronology_start
      : legacyRange[0] || 'Pendiente de confirmar',
    chronology_end: typeof raw.chronology_end === 'string'
      ? raw.chronology_end
      : legacyRange[1] || '',
  } as PoliticalRecord;
}

export class SheetsRepositoryService {
  private readonly storePath: string;
  private cachedStore: LocalStoreData | null = null;
  private lastSheetsSyncAt: number = 0;
  private lastSocialSyncAt: number = 0;
  private lastSheetsError: string | null = null;
  private resolvedRecordsSheetName: string | null = null;
  private readonly cacheTtlMs = 60_000; // 60s cache to avoid hitting Google Sheets quota on every public read

  constructor(private readonly config: ServerConfig) {
    fs.mkdirSync(config.dataDir, { recursive: true });
    this.storePath = path.join(config.dataDir, 'store.json');
    this.ensureStoreInitialized();
  }

  private ensureStoreInitialized(): LocalStoreData {
    if (this.cachedStore) return this.cachedStore;
    if (fs.existsSync(this.storePath)) {
      try {
        const parsed = JSON.parse(fs.readFileSync(this.storePath, 'utf8')) as LocalStoreData;
        if (Array.isArray(parsed.records) && parsed.settings) {
          const migrated = {
            ...parsed,
            records: parsed.records.map(normalizeStoredRecord),
          };
          this.saveLocalStore(migrated);
          return migrated;
        }
      } catch {
        // Re-seed if local file was corrupted
      }
    }
    const seeded: LocalStoreData = {
      records: INITIAL_RECORDS,
      settings: INITIAL_SETTINGS,
      lastSyncAt: new Date().toISOString(),
    };
    this.saveLocalStore(seeded);
    return seeded;
  }

  private saveLocalStore(data: LocalStoreData): void {
    this.cachedStore = data;
    fs.writeFileSync(this.storePath, JSON.stringify(data, null, 2), 'utf8');
  }

  isSheetsConfigured(): boolean {
    const { spreadsheetId, serviceAccountEmail, privateKey } = this.config.googleSheets;
    return Boolean(spreadsheetId && serviceAccountEmail && privateKey);
  }

  async listSpreadsheetTabs(): Promise<string[]> {
    if (!this.isSheetsConfigured()) {
      throw new Error('Google Sheets no está configurado en este servidor.');
    }
    const { spreadsheetId } = this.config.googleSheets;
    const token = await this.getServiceAccountAccessToken();
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId!)}?fields=sheets.properties.title`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error(`No se pudieron consultar las pestañas (HTTP ${response.status}).`);
    const body = (await response.json()) as { sheets?: Array<{ properties?: { title?: string } }> };
    return (body.sheets || []).map((sheet) => sheet.properties?.title || '').filter(Boolean);
  }

  async readSpreadsheetTab(title: string): Promise<{ headers: string[]; rows: string[][] }> {
    if (!this.isSheetsConfigured()) {
      throw new Error('Google Sheets no está configurado en este servidor.');
    }
    const tabs = await this.listSpreadsheetTabs();
    if (!tabs.includes(title)) throw new Error('La pestaña seleccionada ya no existe en Google Sheets.');
    const { spreadsheetId } = this.config.googleSheets;
    const token = await this.getServiceAccountAccessToken();
    const escapedTitle = title.replace(/'/g, "''");
    const range = encodeURIComponent(`'${escapedTitle}'!A:ZZ`);
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId!)}/values/${range}?majorDimension=ROWS`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    if (!response.ok) throw new Error(`No se pudo leer la pestaña seleccionada (HTTP ${response.status}).`);
    const body = (await response.json()) as { values?: unknown[][] };
    const values = (body.values || []).map((row) => row.map((cell) => String(cell ?? '')));
    const headers = values[0] || [];
    const width = Math.max(headers.length, ...values.slice(1).map((row) => row.length), 0);
    while (headers.length < width) headers.push(`Columna ${headers.length + 1}`);
    return { headers, rows: values.slice(1).filter((row) => row.some((cell) => cell !== '')) };
  }

  private async getServiceAccountAccessToken(): Promise<string> {
    const { serviceAccountEmail, privateKey } = this.config.googleSheets;
    if (!serviceAccountEmail || !privateKey) {
      throw new Error('Credenciales de cuenta de servicio de Google Sheets no configuradas.');
    }

    const now = Math.floor(Date.now() / 1000);
    const header = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
    const claimSet = Buffer.from(
      JSON.stringify({
        iss: serviceAccountEmail,
        scope: 'https://www.googleapis.com/auth/spreadsheets',
        aud: 'https://oauth2.googleapis.com/token',
        exp: now + 3600,
        iat: now,
      })
    ).toString('base64url');

    const signingInput = `${header}.${claimSet}`;
    const signer = crypto.createSign('RSA-SHA256');
    signer.update(signingInput);
    const signature = signer.sign(privateKey, 'base64url');
    const jwt = `${signingInput}.${signature}`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
        assertion: jwt,
      }),
    });

    if (!tokenRes.ok) {
      const detail = await tokenRes.text();
      throw new Error(`Error autenticando cuenta de servicio (${tokenRes.status}): ${detail.slice(0, 160)}`);
    }
    const json = (await tokenRes.json()) as { access_token?: string };
    if (!json.access_token) {
      throw new Error('Google OAuth2 no devolvió access_token.');
    }
    return json.access_token;
  }

  private async ensureRecordsSheet(token: string): Promise<void> {
    const { spreadsheetId, sheetName } = this.config.googleSheets;
    if (!spreadsheetId) throw new Error('Falta GOOGLE_SHEETS_SPREADSHEET_ID.');
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`;
    const metadataRes = await fetch(`${baseUrl}?fields=sheets.properties(sheetId,title,gridProperties(columnCount))`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!metadataRes.ok) throw new Error(`No se pudieron consultar las pestañas de Google Sheets (HTTP ${metadataRes.status}).`);
    const metadata = (await metadataRes.json()) as { sheets?: Array<{ properties?: { title?: string } }> };
    const escapedSheetName = sheetName.replace(/'/g, "''");
    const exists = metadata.sheets?.some((sheet) => sheet.properties?.title === sheetName);
    if (!exists) {
      const createRes = await fetch(`${baseUrl}:batchUpdate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ addSheet: { properties: { title: sheetName, gridProperties: { frozenRowCount: 1 } } } }] }),
      });
      if (!createRes.ok) throw new Error(`No se pudo crear la pestaña ${sheetName} (HTTP ${createRes.status}).`);
      const initRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${escapedSheetName}'!A1`)}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [[...SHEET_HEADERS]] }),
      });
      if (!initRes.ok) throw new Error(`No se pudieron crear los encabezados de ${sheetName} (HTTP ${initRes.status}).`);
      return;
    }
    const headerRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${escapedSheetName}'!A1:H1`)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!headerRes.ok) throw new Error(`No se pudo leer la hoja ${sheetName} (HTTP ${headerRes.status}).`);
    const headerBody = (await headerRes.json()) as { values?: string[][] };
    if (!headerBody.values?.[0]?.length) {
      const initRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${escapedSheetName}'!A1`)}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [[...SHEET_HEADERS]] }),
      });
      if (!initRes.ok) throw new Error(`No se pudieron crear los encabezados de ${sheetName} (HTTP ${initRes.status}).`);
    }
  }

  private async readRecordsFromTab(spreadsheetId: string, tabName: string, token: string): Promise<PoliticalRecord[]> {
    const escapedSheetName = tabName.replace(/'/g, "''");
    const range = encodeURIComponent(`'${escapedSheetName}'!A1:I1000`);
    const url = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${range}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      throw new Error(`Google Sheets respondió con código HTTP ${res.status}.`);
    }
    const body = (await res.json()) as { values?: string[][] };
    const rows = body.values || [];
    if (rows.length === 0) {
      throw new Error('La hoja de Google Sheets está vacía; faltan los encabezados requeridos.');
    }
    const headers = rows[0];
    const headerCheck = validateSheetHeaders(headers);
    if (!headerCheck.valid) {
      throw new Error(`Faltan encabezados en Google Sheets: ${headerCheck.missing.join(', ')}`);
    }

    const parsed: PoliticalRecord[] = [];
    for (let i = 1; i < rows.length; i++) {
      const rec = rowArrayToRecord(rows[i], headers);
      if (rec) parsed.push(rec);
    }
    return parsed.sort((a, b) => a.sort_order - b.sort_order);
  }

  private async fetchRecordsFromGoogleSheets(): Promise<PoliticalRecord[]> {
    const { spreadsheetId, sheetName } = this.config.googleSheets;
    if (!spreadsheetId) throw new Error('Falta GOOGLE_SHEETS_SPREADSHEET_ID.');
    const token = await this.getServiceAccountAccessToken();
    await this.ensureRecordsSheet(token);

    const primary = await this.readRecordsFromTab(spreadsheetId, sheetName, token);
    if (primary.length > 0 || sheetName === 'VidaPolitica') {
      this.resolvedRecordsSheetName = sheetName;
      return primary;
    }

    // If the configured sheet tab has only headers and 0 rows, check VidaPolitica tab if present
    const tabs = await this.listSpreadsheetTabs();
    if (tabs.includes('VidaPolitica')) {
      const fallback = await this.readRecordsFromTab(spreadsheetId, 'VidaPolitica', token);
      if (fallback.length > 0) {
        this.resolvedRecordsSheetName = 'VidaPolitica';
        return fallback;
      }
    }

    this.resolvedRecordsSheetName = sheetName;
    return primary;
  }

  private async ensureSocialLinksSheet(token: string): Promise<void> {
    const { spreadsheetId, socialLinksSheetName } = this.config.googleSheets;
    if (!spreadsheetId) return;
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`;
    const metadataRes = await fetch(`${baseUrl}?fields=sheets.properties(sheetId,title,gridProperties(columnCount))`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!metadataRes.ok) throw new Error(`No se pudieron consultar las pestañas de Google Sheets (HTTP ${metadataRes.status}).`);
    const metadata = (await metadataRes.json()) as { sheets?: Array<{ properties?: { title?: string } }> };
    if (metadata.sheets?.some((sheet) => sheet.properties?.title === socialLinksSheetName)) return;

    const createRes = await fetch(`${baseUrl}:batchUpdate`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ requests: [{ addSheet: { properties: { title: socialLinksSheetName, gridProperties: { frozenRowCount: 1 } } } }] }),
    });
    if (!createRes.ok) throw new Error(`No se pudo crear la pestaña ${socialLinksSheetName} (HTTP ${createRes.status}).`);
    const initRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${socialLinksSheetName}'!A1:E1`)}?valueInputOption=RAW`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [['id', 'red', 'nombre', 'url', 'activo']] }),
    });
    if (!initRes.ok) throw new Error(`No se pudieron crear los encabezados de ${socialLinksSheetName} (HTTP ${initRes.status}).`);
  }

  private async fetchSocialLinksFromGoogleSheets(): Promise<SiteSettings['socialLinks']> {
    const { spreadsheetId, socialLinksSheetName } = this.config.googleSheets;
    if (!spreadsheetId) throw new Error('Falta GOOGLE_SHEETS_SPREADSHEET_ID.');
    const token = await this.getServiceAccountAccessToken();
    await this.ensureSocialLinksSheet(token);
    const range = encodeURIComponent(`'${socialLinksSheetName}'!A1:E1000`);
    const res = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error(`No se pudo leer ${socialLinksSheetName} (HTTP ${res.status}).`);
    const body = (await res.json()) as { values?: string[][] };
    const rows = body.values || [];
    const headers = (rows[0] || []).map((value) => String(value).trim().toLowerCase());
    const find = (...names: string[]) => headers.findIndex((header) => names.includes(header));
    const idIdx = find('id');
    const networkIdx = find('red', 'network', 'plataforma');
    const labelIdx = find('nombre', 'label', 'perfil');
    const urlIdx = find('url', 'enlace', 'link');
    const enabledIdx = find('activo', 'enabled', 'visible');
    if ([networkIdx, urlIdx].some((index) => index < 0)) {
      throw new Error(`La hoja ${socialLinksSheetName} requiere encabezados "red" y "url"; opcionalmente "id", "nombre" y "activo".`);
    }
    return rows.slice(1).flatMap((row, index) => {
      const network = String(row[networkIdx] || '').trim();
      const url = String(row[urlIdx] || '').trim();
      if (!network || !url) return [];
      const enabledValue = enabledIdx < 0 ? 'true' : String(row[enabledIdx] || '').trim().toLowerCase();
      return [{
        id: String((idIdx >= 0 ? row[idIdx] : '') || `social-${index + 1}`).trim(),
        network,
        label: String((labelIdx >= 0 ? row[labelIdx] : '') || 'Perfil oficial').trim(),
        url,
        enabled: ['true', '1', 'sí', 'si', 'activo', 'publico', 'público'].includes(enabledValue),
      }];
    });
  }

  private async writeSocialLinksToGoogleSheets(links: SiteSettings['socialLinks']): Promise<void> {
    const { spreadsheetId, socialLinksSheetName } = this.config.googleSheets;
    if (!spreadsheetId) return;
    const token = await this.getServiceAccountAccessToken();
    await this.ensureSocialLinksSheet(token);
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`;
    const clearRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${socialLinksSheetName}'!A1:E1000`)}:clear`, {
      method: 'POST', headers: { Authorization: `Bearer ${token}` },
    });
    if (!clearRes.ok) throw new Error(`No se pudo limpiar la hoja ${socialLinksSheetName} (HTTP ${clearRes.status}).`);
    const values = [
      ['id', 'red', 'nombre', 'url', 'activo'],
      ...links.map((item) => [item.id, item.network, item.label, item.url, item.enabled ? 'TRUE' : 'FALSE']),
    ];
    const writeRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${socialLinksSheetName}'!A1`)}?valueInputOption=RAW`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    });
    if (!writeRes.ok) throw new Error(`No se pudieron guardar las redes en Google Sheets (HTTP ${writeRes.status}).`);
  }

  private async writeAllRecordsToGoogleSheets(records: PoliticalRecord[]): Promise<void> {
    const { spreadsheetId, sheetName } = this.config.googleSheets;
    if (!spreadsheetId) return;
    const token = await this.getServiceAccountAccessToken();
    const activeSheetName = this.resolvedRecordsSheetName || sheetName;
    if (activeSheetName === sheetName) {
      await this.ensureRecordsSheet(token);
    }
    const escapedSheetName = activeSheetName.replace(/'/g, "''");

    const values: string[][] = [
      [...SHEET_HEADERS],
      ...records.slice().sort((a, b) => a.sort_order - b.sort_order).map(recordToRowArray),
    ];

    const clearRange = encodeURIComponent(`'${escapedSheetName}'!A1:H1000`);
    const clearUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${clearRange}:clear`;

    const clearRes = await fetch(clearUrl, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!clearRes.ok) {
      throw new Error(`No se pudo limpiar el rango en Google Sheets (HTTP ${clearRes.status}).`);
    }

    const updateRange = encodeURIComponent(`'${escapedSheetName}'!A1`);
    const updateUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(
      spreadsheetId
    )}/values/${updateRange}?valueInputOption=RAW`;

    const updateRes = await fetch(updateUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ values }),
    });
    if (!updateRes.ok) {
      throw new Error(`No se pudo escribir en Google Sheets (HTTP ${updateRes.status}).`);
    }
    this.lastSheetsSyncAt = Date.now();
    this.lastSheetsError = null;
  }

  async syncFromSheetsIfNeeded(force = false): Promise<void> {
    if (!this.isSheetsConfigured()) return;
    const now = Date.now();
    if (!force && now - this.lastSheetsSyncAt < this.cacheTtlMs) return;

    try {
      const remoteRecords = await this.fetchRecordsFromGoogleSheets();
      const store = this.ensureStoreInitialized();
      this.saveLocalStore({
        ...store,
        records: remoteRecords,
        lastSyncAt: new Date().toISOString(),
      });
      this.lastSheetsSyncAt = now;
      this.lastSheetsError = null;
    } catch (err) {
      this.lastSheetsError =
        err instanceof Error ? err.message : 'Error desconocido consultando Google Sheets.';
    }
  }

  async getAllRecords(forceSync = false): Promise<PoliticalRecord[]> {
    await this.syncFromSheetsIfNeeded(forceSync);
    const store = this.ensureStoreInitialized();
    return store.records.slice().sort((a, b) => a.sort_order - b.sort_order);
  }

  async getPublicRecords(): Promise<PoliticalRecord[]> {
    const all = await this.getAllRecords(false);
    return filterPublicRecords(all);
  }

  async createRecord(input: Omit<PoliticalRecord, 'id'>): Promise<{ record: PoliticalRecord; sheetsWarning?: string }> {
    const store = this.ensureStoreInitialized();
    const greatestNumericId = store.records.reduce((max, item) => {
      const numericId = Number(item.id);
      return Number.isSafeInteger(numericId) && numericId > max ? numericId : max;
    }, store.records.length);
    let nextId = greatestNumericId + 1;
    while (store.records.some((item) => item.id === String(nextId))) nextId += 1;
    const record: PoliticalRecord = {
      ...input,
      id: String(nextId),
    };
    const nextRecords = [...store.records, record].sort((a, b) => a.sort_order - b.sort_order);
    this.saveLocalStore({
      ...store,
      records: nextRecords,
      lastSyncAt: new Date().toISOString(),
    });

    let sheetsWarning: string | undefined;
    if (this.isSheetsConfigured()) {
      try {
        await this.writeAllRecordsToGoogleSheets(nextRecords);
      } catch (err) {
        sheetsWarning =
          err instanceof Error ? err.message : 'No se pudo reflejar el alta en Google Sheets.';
        this.lastSheetsError = sheetsWarning;
      }
    }
    return { record, sheetsWarning };
  }

  async updateRecord(
    id: string,
    input: Omit<PoliticalRecord, 'id'>
  ): Promise<{ record: PoliticalRecord | null; sheetsWarning?: string }> {
    const store = this.ensureStoreInitialized();
    const idx = store.records.findIndex((r) => r.id === id);
    if (idx === -1) return { record: null };

    const updated: PoliticalRecord = { ...input, id };
    const nextRecords = store.records
      .map((r) => (r.id === id ? updated : r))
      .sort((a, b) => a.sort_order - b.sort_order);

    this.saveLocalStore({
      ...store,
      records: nextRecords,
      lastSyncAt: new Date().toISOString(),
    });

    let sheetsWarning: string | undefined;
    if (this.isSheetsConfigured()) {
      try {
        await this.writeAllRecordsToGoogleSheets(nextRecords);
      } catch (err) {
        sheetsWarning =
          err instanceof Error ? err.message : 'No se pudo actualizar la fila en Google Sheets.';
        this.lastSheetsError = sheetsWarning;
      }
    }
    return { record: updated, sheetsWarning };
  }

  async deleteRecord(id: string): Promise<{ deleted: boolean; sheetsWarning?: string }> {
    const store = this.ensureStoreInitialized();
    const exists = store.records.some((r) => r.id === id);
    if (!exists) return { deleted: false };

    const nextRecords = store.records.filter((r) => r.id !== id);
    this.saveLocalStore({
      ...store,
      records: nextRecords,
      lastSyncAt: new Date().toISOString(),
    });

    let sheetsWarning: string | undefined;
    if (this.isSheetsConfigured()) {
      try {
        await this.writeAllRecordsToGoogleSheets(nextRecords);
      } catch (err) {
        sheetsWarning =
          err instanceof Error ? err.message : 'No se pudo eliminar la fila en Google Sheets.';
        this.lastSheetsError = sheetsWarning;
      }
    }
    return { deleted: true, sheetsWarning };
  }

  getSettings(): SiteSettings {
    return this.ensureStoreInitialized().settings;
  }

  async getPublicSettings(forceSync = false): Promise<SiteSettings> {
    if (this.isSheetsConfigured()) {
      const now = Date.now();
      if (forceSync || now - this.lastSocialSyncAt >= this.cacheTtlMs) {
        try {
          const socialLinks = await this.fetchSocialLinksFromGoogleSheets();
          const store = this.ensureStoreInitialized();
          this.saveLocalStore({ ...store, settings: { ...store.settings, socialLinks } });
          this.lastSocialSyncAt = now;
          this.lastSheetsError = null;
        } catch (err) {
          this.lastSheetsError = err instanceof Error ? err.message : 'Error consultando redes sociales en Google Sheets.';
        }
      }
    }
    return this.ensureStoreInitialized().settings;
  }

  async updateProfilePhotoUrlInInformationSheet(photoUrl: string): Promise<string | undefined> {
    if (!this.isSheetsConfigured()) {
      return 'Google Sheets no está configurado en este servidor; la foto quedó guardada localmente.';
    }

    const { spreadsheetId, informationSheetName } = this.config.googleSheets;
    if (!spreadsheetId) return 'Falta configurar el ID de Google Sheets.';

    try {
      const token = await this.getServiceAccountAccessToken();
      const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`;
      const metadataRes = await fetch(`${baseUrl}?fields=sheets.properties(sheetId,title)`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!metadataRes.ok) {
        throw new Error(`No se pudo consultar las pestañas de Google Sheets (HTTP ${metadataRes.status}).`);
      }

      const metadata = (await metadataRes.json()) as {
        sheets?: Array<{ properties?: { sheetId?: number; title?: string } }>;
      };
      let infoSheet = metadata.sheets?.find(
        (sheet) => sheet.properties?.title === informationSheetName
      )?.properties;

      if (!infoSheet?.sheetId) {
        const createRes = await fetch(`${baseUrl}:batchUpdate`, {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            requests: [{ addSheet: { properties: { title: informationSheetName, gridProperties: { frozenRowCount: 1 } } } }],
          }),
        });
        if (!createRes.ok) {
          throw new Error(`No se pudo crear la pestaña ${informationSheetName} (HTTP ${createRes.status}).`);
        }
        const created = (await createRes.json()) as {
          replies?: Array<{ addSheet?: { properties?: { sheetId?: number; title?: string } } }>;
        };
        infoSheet = created.replies?.[0]?.addSheet?.properties;
        if (!infoSheet?.sheetId) throw new Error('Google Sheets no devolvió el identificador de Información.');

        const initializeRes = await fetch(
          `${baseUrl}/values/${encodeURIComponent(`'${informationSheetName}'!A1:B2`)}?valueInputOption=RAW`,
          {
            method: 'PUT',
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              values: [
                ['Logo', 'URL de almacenamiento'],
                ['Foto de perfil', photoUrl],
              ],
            }),
          }
        );
        if (!initializeRes.ok) {
          throw new Error(`No se pudo inicializar la tabla de Información (HTTP ${initializeRes.status}).`);
        }
        return undefined;
      }

      const headerRes = await fetch(
        `${baseUrl}/values/${encodeURIComponent(`'${informationSheetName}'!A1:B2`)}?majorDimension=ROWS`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!headerRes.ok) {
        throw new Error(`No se pudo leer la tabla de Información (HTTP ${headerRes.status}).`);
      }
      const headerBody = (await headerRes.json()) as { values?: string[][] };
      const values = headerBody.values || [];
      if (values[0]?.[0] !== 'Logo' || values[0]?.[1] !== 'URL de almacenamiento') {
        return `La pestaña ${informationSheetName} existe, pero sus encabezados no coinciden con “Logo” y “URL de almacenamiento”; no se modificó.`;
      }

      const updateRes = await fetch(
        `${baseUrl}/values/${encodeURIComponent(`'${informationSheetName}'!B2`)}?valueInputOption=RAW`,
        {
          method: 'PUT',
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ values: [[photoUrl]] }),
        }
      );
      if (!updateRes.ok) {
        throw new Error(`No se pudo guardar la URL en Información (HTTP ${updateRes.status}).`);
      }
      return undefined;
    } catch (err) {
      return err instanceof Error ? err.message : 'No se pudo actualizar la pestaña Información.';
    }
  }

  async updateSettings(next: SiteSettings): Promise<{ settings: SiteSettings; sheetsWarning?: string }> {
    const store = this.ensureStoreInitialized();
    this.saveLocalStore({
      ...store,
      settings: next,
      lastSyncAt: new Date().toISOString(),
    });
    let sheetsWarning: string | undefined;
    if (this.isSheetsConfigured()) {
      try {
        await this.writeSocialLinksToGoogleSheets(next.socialLinks);
        this.lastSocialSyncAt = Date.now();
        this.lastSheetsError = null;
      } catch (err) {
        sheetsWarning = err instanceof Error ? err.message : 'No se pudieron guardar las redes en Google Sheets.';
        this.lastSheetsError = sheetsWarning;
      }
    } else {
      sheetsWarning = 'Google Sheets no está configurado en este servidor; las redes quedaron guardadas localmente.';
    }
    return { settings: next, sheetsWarning };
  }

  private async ensureAcademicSheet(token: string): Promise<void> {
    const { spreadsheetId, academicSheetName } = this.config.googleSheets;
    if (!spreadsheetId) throw new Error('Falta configurar GOOGLE_SHEETS_SPREADSHEET_ID.');
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`;
    const metadataRes = await fetch(`${baseUrl}?fields=sheets.properties(sheetId,title)`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!metadataRes.ok) throw new Error(`No se pudieron consultar las hojas (HTTP ${metadataRes.status}).`);
    const metadata = (await metadataRes.json()) as { sheets?: Array<{ properties?: { sheetId?: number; title?: string; gridProperties?: { columnCount?: number } } }> };
    const academicSheet = metadata.sheets?.find((sheet) => sheet.properties?.title === academicSheetName);
    const exists = Boolean(academicSheet);
    if (!exists) {
      const createRes = await fetch(`${baseUrl}:batchUpdate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ addSheet: { properties: { title: academicSheetName, gridProperties: { frozenRowCount: 1 } } } }] }),
      });
      if (!createRes.ok) throw new Error(`No se pudo crear la hoja ${academicSheetName} (HTTP ${createRes.status}).`);
      const seeded: string[][] = [
        [...ACADEMIC_HEADERS],
        ...INITIAL_ACADEMIC_ROWS.map((record, index) => this.academicRecordToRow({ ...record, id: String(index + 1) })),
      ];
      const initRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${academicSheetName}'!A1`)}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: seeded }),
      });
      if (!initRes.ok) throw new Error(`No se pudieron inicializar los registros académicos (HTTP ${initRes.status}).`);
      return;
    }
    const sheetId = academicSheet?.properties?.sheetId;
    if (sheetId !== undefined && (academicSheet?.properties?.gridProperties?.columnCount ?? 0) < ACADEMIC_HEADERS.length) {
      const resizeRes = await fetch(`${baseUrl}:batchUpdate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ updateSheetProperties: { properties: { sheetId, gridProperties: { columnCount: ACADEMIC_HEADERS.length } }, fields: 'gridProperties.columnCount' } }] }),
      });
      if (!resizeRes.ok) throw new Error(`No se pudo ampliar la hoja ${academicSheetName} para el enlace de soporte.`);
    }
    const headerRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${academicSheetName}'!A1:K1`)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!headerRes.ok) throw new Error(`No se pudo leer la hoja ${academicSheetName} (HTTP ${headerRes.status}).`);
    const headerBody = (await headerRes.json()) as { values?: string[][] };
    if (!headerBody.values?.[0]?.length) {
      const initRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${academicSheetName}'!A1`)}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [[...ACADEMIC_HEADERS]] }),
      });
      if (!initRes.ok) throw new Error(`No se pudieron crear los encabezados de ${academicSheetName}.`);
    } else {
      const existingHeaders = headerBody.values[0].map((value) => String(value || '').trim().toLowerCase());
      if (!existingHeaders.includes('url del soporte')) {
        const supportHeaderRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${academicSheetName}'!K1`)}?valueInputOption=RAW`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ values: [['URL del soporte']] }),
        });
        if (!supportHeaderRes.ok) throw new Error(`No se pudo añadir la columna de soporte a ${academicSheetName}.`);
      }
    }
  }

  private academicRecordToRow(record: AcademicRecord): string[] {
    return [record.id, record.type, record.title, record.institution, record.chronology_start,
      record.chronology_end, record.status, record.detail, record.visibility, String(record.sort_order), record.support_url];
  }

  private async readAcademicRecords(): Promise<AcademicRecord[]> {
    const { spreadsheetId, academicSheetName } = this.config.googleSheets;
    const token = await this.getServiceAccountAccessToken();
    await this.ensureAcademicSheet(token);
    const range = encodeURIComponent(`'${academicSheetName}'!A1:K1000`);
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId!)}/values/${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`No se pudieron leer los registros académicos (HTTP ${response.status}).`);
    const body = (await response.json()) as { values?: string[][] };
    const rows = body.values || [];
    const headers = (rows[0] || []).map((value) => value.trim().toLowerCase());
    const index = (name: string) => headers.indexOf(name);
    if (['id', 'type', 'title', 'institution', 'chronology_start', 'chronology_end', 'status', 'detail', 'visibility', 'sort_order'].some((name) => index(name) < 0)) {
      throw new Error(`La hoja ${academicSheetName} requiere las columnas académicas inicializadas por el sitio.`);
    }
    const read = (row: string[], name: string) => String(row[index(name)] ?? '').trim();
    const records = rows.slice(1).flatMap((row) => {
      const id = read(row, 'id');
      const title = read(row, 'title');
      if (!id || !title) return [];
      const rawType = read(row, 'type') as AcademicRecordType;
      const types: AcademicRecordType[] = ['Primaria', 'Bachillerato', 'Pregrado', 'Posgrado', 'Curso', 'Seminario', 'Diplomado', 'Área de conocimiento', 'Otro'];
      const sort = Number(read(row, 'sort_order'));
      const rawSupportUrl = read(row, 'url del soporte') || read(row, 'support_url');
      let supportUrl = '';
      if (rawSupportUrl) {
        try {
          const parsed = new URL(rawSupportUrl);
          if (parsed.protocol === 'https:' && ['drive.google.com', 'docs.google.com'].includes(parsed.hostname)) supportUrl = rawSupportUrl;
        } catch { /* Ignore malformed or non-Drive support URLs. */ }
      }
      return [{
        id, type: types.includes(rawType) ? rawType : 'Otro', title, institution: read(row, 'institution'),
        chronology_start: read(row, 'chronology_start'), chronology_end: read(row, 'chronology_end'),
        status: read(row, 'status') || 'Finalizado', detail: read(row, 'detail'),
        support_url: supportUrl,
        visibility: read(row, 'visibility').toLowerCase() === 'privada' ? 'privada' as const : 'publica' as const,
        sort_order: Number.isFinite(sort) ? sort : 100,
      }];
    }).sort((a, b) => a.sort_order - b.sort_order);
  }

  async getAcademicRecords(publicOnly = false): Promise<AcademicRecord[]> {
    const records = await this.readAcademicRecords();
    return publicOnly ? records.filter((record) => record.visibility === 'publica') : records;
  }

  private async writeAcademicRecords(records: AcademicRecord[]): Promise<void> {
    const { spreadsheetId, academicSheetName } = this.config.googleSheets;
    const token = await this.getServiceAccountAccessToken();
    await this.ensureAcademicSheet(token);
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId!)}`;
    const range = encodeURIComponent(`'${academicSheetName}'!A1:K1000`);
    const clearRes = await fetch(`${baseUrl}/values/${range}:clear`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (!clearRes.ok) throw new Error(`No se pudo limpiar la hoja académica (HTTP ${clearRes.status}).`);
    const orderedRecords = records.slice().sort((a, b) => a.sort_order - b.sort_order);
    const values = [[...ACADEMIC_HEADERS], ...orderedRecords.map((record) => this.academicRecordToRow(record))];
    const writeRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${academicSheetName}'!A1`)}?valueInputOption=RAW`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    });
    if (!writeRes.ok) throw new Error(`No se pudieron guardar los registros académicos (HTTP ${writeRes.status}).`);
    const linkedRows = orderedRecords.flatMap((record, index) => record.support_url ? [{
      updateCells: {
        range: { sheetId: 0, startRowIndex: index + 1, endRowIndex: index + 2, startColumnIndex: 10, endColumnIndex: 11 },
        rows: [{ values: [{ textFormatRuns: [{ startIndex: 0, format: { link: { uri: record.support_url } } }] }] }],
        fields: 'textFormatRuns',
      },
    }] : []);
    if (linkedRows.length) {
      const metadataRes = await fetch(`${baseUrl}?fields=sheets.properties(sheetId,title)`, { headers: { Authorization: `Bearer ${token}` } });
      if (!metadataRes.ok) throw new Error(`No se pudo vincular los soportes académicos (HTTP ${metadataRes.status}).`);
      const metadata = (await metadataRes.json()) as { sheets?: Array<{ properties?: { sheetId?: number; title?: string } }> };
      const sheetId = metadata.sheets?.find((sheet) => sheet.properties?.title === academicSheetName)?.properties?.sheetId;
      if (sheetId === undefined) throw new Error(`No se encontró la hoja ${academicSheetName} para enlazar los soportes.`);
      const linkRequests = linkedRows.map((request) => ({
        ...request,
        updateCells: { ...request.updateCells, range: { ...request.updateCells.range, sheetId } },
      }));
      const linkRes = await fetch(`${baseUrl}:batchUpdate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: linkRequests }),
      });
      if (!linkRes.ok) throw new Error(`No se pudieron aplicar los enlaces de soporte (HTTP ${linkRes.status}).`);
    }
  }

  async createAcademicRecord(input: Omit<AcademicRecord, 'id'>): Promise<AcademicRecord> {
    const records = await this.readAcademicRecords();
    const nextId = records.reduce((max, item) => Math.max(max, Number(item.id) || 0), records.length) + 1;
    const record = { ...input, id: String(nextId) };
    await this.writeAcademicRecords([...records, record]);
    return record;
  }

  async updateAcademicRecord(id: string, input: Omit<AcademicRecord, 'id'>): Promise<AcademicRecord | null> {
    const records = await this.readAcademicRecords();
    if (!records.some((record) => record.id === id)) return null;
    const updated = { ...input, id };
    await this.writeAcademicRecords(records.map((record) => record.id === id ? updated : record));
    return updated;
  }

  async deleteAcademicRecord(id: string): Promise<boolean> {
    const records = await this.readAcademicRecords();
    if (!records.some((record) => record.id === id)) return false;
    await this.writeAcademicRecords(records.filter((record) => record.id !== id));
    return true;
  }

  private async ensureEmploymentSheet(token: string): Promise<void> {
    const { spreadsheetId, employmentSheetName } = this.config.googleSheets;
    if (!spreadsheetId) throw new Error('Falta configurar GOOGLE_SHEETS_SPREADSHEET_ID.');
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`;
    const metadataRes = await fetch(`${baseUrl}?fields=sheets.properties(sheetId,title,gridProperties(columnCount))`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!metadataRes.ok) throw new Error(`No se pudieron consultar las hojas (HTTP ${metadataRes.status}).`);
    const metadata = (await metadataRes.json()) as { sheets?: Array<{ properties?: { sheetId?: number; title?: string; gridProperties?: { columnCount?: number } } }> };
    const employmentSheet = metadata.sheets?.find((sheet) => sheet.properties?.title === employmentSheetName);
    const exists = Boolean(employmentSheet);
    if (!exists) {
      const createRes = await fetch(`${baseUrl}:batchUpdate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ addSheet: { properties: { title: employmentSheetName, gridProperties: { frozenRowCount: 1 } } } }] }),
      });
      if (!createRes.ok) throw new Error(`No se pudo crear la hoja ${employmentSheetName} (HTTP ${createRes.status}).`);
      const initRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${employmentSheetName}'!A1`)}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [[...EMPLOYMENT_HEADERS]] }),
      });
      if (!initRes.ok) throw new Error(`No se pudieron crear los encabezados de ${employmentSheetName}.`);
      return;
    }
    const sheetId = employmentSheet?.properties?.sheetId;
    if (sheetId !== undefined && (employmentSheet?.properties?.gridProperties?.columnCount ?? 0) < EMPLOYMENT_HEADERS.length) {
      const resizeRes = await fetch(`${baseUrl}:batchUpdate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ updateSheetProperties: { properties: { sheetId, gridProperties: { columnCount: EMPLOYMENT_HEADERS.length } }, fields: 'gridProperties.columnCount' } }] }),
      });
      if (!resizeRes.ok) throw new Error(`No se pudo ampliar la hoja ${employmentSheetName} para la columna Sector.`);
    }
    const headerRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${employmentSheetName}'!A1:K1`)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!headerRes.ok) throw new Error(`No se pudo leer la hoja ${employmentSheetName} (HTTP ${headerRes.status}).`);
    const headerBody = (await headerRes.json()) as { values?: string[][] };
    if (!headerBody.values?.[0]?.length) {
      const initRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${employmentSheetName}'!A1`)}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [[...EMPLOYMENT_HEADERS]] }),
      });
      if (!initRes.ok) throw new Error(`No se pudieron crear los encabezados de ${employmentSheetName}.`);
    } else if (!(headerBody.values[0] || []).some((value) => String(value || '').trim().toLowerCase() === 'sector')) {
      const sectorHeaderRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${employmentSheetName}'!K1`)}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [['sector']] }),
      });
      if (!sectorHeaderRes.ok) throw new Error(`No se pudo añadir la columna Sector a ${employmentSheetName}.`);
    }
  }

  private employmentRecordToRow(record: EmploymentRecord): string[] {
    return [record.id, record.type, record.title, record.organization, record.chronology_start,
      record.chronology_end, record.status, record.detail, record.visibility, String(record.sort_order), record.sector];
  }

  private async readEmploymentRecords(): Promise<EmploymentRecord[]> {
    const { spreadsheetId, employmentSheetName } = this.config.googleSheets;
    const token = await this.getServiceAccountAccessToken();
    await this.ensureEmploymentSheet(token);
    const range = encodeURIComponent(`'${employmentSheetName}'!A1:K1000`);
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId!)}/values/${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`No se pudieron leer los registros laborales (HTTP ${response.status}).`);
    const body = (await response.json()) as { values?: string[][] };
    const rows = body.values || [];
    const headers = (rows[0] || []).map((value) => value.trim().toLowerCase());
    const index = (name: string) => headers.indexOf(name);
    if (['id', 'type', 'title', 'organization', 'chronology_start', 'chronology_end', 'status', 'detail', 'visibility', 'sort_order'].some((name) => index(name) < 0)) {
      throw new Error(`La hoja ${employmentSheetName} requiere las columnas laborales inicializadas por el sitio.`);
    }
    const read = (row: string[], name: string) => String(row[index(name)] ?? '').trim();
    const types: EmploymentRecordType[] = ['Empleado', 'Independiente', 'Contratista', 'Cargo público', 'Emprendimiento', 'Otro'];
    const sectors: EmploymentSector[] = ['Público', 'Privado', 'Comunitario', 'Sin clasificar'];
    const records = rows.slice(1).flatMap((row) => {
      const id = read(row, 'id');
      const title = read(row, 'title');
      if (!id || !title) return [];
      const rawType = read(row, 'type') as EmploymentRecordType;
      const type = types.includes(rawType) ? rawType : 'Otro';
      const organization = read(row, 'organization');
      const rawSector = read(row, 'sector') as EmploymentSector;
      const sort = Number(read(row, 'sort_order'));
      return [{
        id, type, title, organization,
        sector: sectors.includes(rawSector) ? rawSector : inferEmploymentSector({ type, title, organization }),
        chronology_start: read(row, 'chronology_start'), chronology_end: read(row, 'chronology_end'),
        status: read(row, 'status') || 'Finalizado', detail: read(row, 'detail'),
        visibility: read(row, 'visibility').toLowerCase() === 'privada' ? 'privada' as const : 'publica' as const,
        sort_order: Number.isFinite(sort) ? sort : 100,
      }];
    });
    const sectorValues = rows.slice(1).map((row) => {
      const id = read(row, 'id');
      const title = read(row, 'title');
      if (!id || !title) return [read(row, 'sector')];
      return [records.find((record) => record.id === id)?.sector || 'Sin clasificar'];
    });
    const missingSectorValues = rows.slice(1).some((row, offset) => {
      const id = read(row, 'id');
      const title = read(row, 'title');
      return Boolean(id && title && read(row, 'sector') !== sectorValues[offset][0]);
    });
    if (missingSectorValues && sectorValues.length) {
      const sectorRange = encodeURIComponent(`'${employmentSheetName}'!K2:K${sectorValues.length + 1}`);
      await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId!)}/values/${sectorRange}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: sectorValues }),
      });
    }
    return records.sort(compareRecordsById);
  }

  async getEmploymentRecords(publicOnly = false): Promise<EmploymentRecord[]> {
    const records = await this.readEmploymentRecords();
    const visibleRecords = publicOnly ? records.filter((record) => record.visibility === 'publica') : records;
    return sortRecordsById(visibleRecords);
  }

  private async writeEmploymentRecords(records: EmploymentRecord[]): Promise<void> {
    const { spreadsheetId, employmentSheetName } = this.config.googleSheets;
    const token = await this.getServiceAccountAccessToken();
    await this.ensureEmploymentSheet(token);
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId!)}`;
    const range = encodeURIComponent(`'${employmentSheetName}'!A1:K1000`);
    const clearRes = await fetch(`${baseUrl}/values/${range}:clear`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (!clearRes.ok) throw new Error(`No se pudo limpiar la hoja laboral (HTTP ${clearRes.status}).`);
    const values = [[...EMPLOYMENT_HEADERS], ...sortRecordsById(records).map((record) => this.employmentRecordToRow(record))];
    const writeRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${employmentSheetName}'!A1`)}?valueInputOption=RAW`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    });
    if (!writeRes.ok) throw new Error(`No se pudieron guardar los registros laborales (HTTP ${writeRes.status}).`);
  }

  async createEmploymentRecord(input: Omit<EmploymentRecord, 'id'>): Promise<EmploymentRecord> {
    const records = await this.readEmploymentRecords();
    const nextId = records.reduce((max, item) => Math.max(max, Number(item.id) || 0), records.length) + 1;
    const record = { ...input, id: String(nextId) };
    await this.writeEmploymentRecords([...records, record]);
    return record;
  }

  async updateEmploymentRecord(id: string, input: Omit<EmploymentRecord, 'id'>): Promise<EmploymentRecord | null> {
    const records = await this.readEmploymentRecords();
    if (!records.some((record) => record.id === id)) return null;
    const updated = { ...input, id };
    await this.writeEmploymentRecords(records.map((record) => record.id === id ? updated : record));
    return updated;
  }

  async deleteEmploymentRecord(id: string): Promise<boolean> {
    const records = await this.readEmploymentRecords();
    if (!records.some((record) => record.id === id)) return false;
    await this.writeEmploymentRecords(records.filter((record) => record.id !== id));
    return true;
  }

  private async ensureProjectsSheet(token: string): Promise<void> {
    const { spreadsheetId, projectsSheetName } = this.config.googleSheets;
    if (!spreadsheetId) throw new Error('Falta configurar GOOGLE_SHEETS_SPREADSHEET_ID.');
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`;
    const metadataRes = await fetch(`${baseUrl}?fields=sheets.properties(sheetId,title)`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!metadataRes.ok) throw new Error(`No se pudieron consultar las hojas (HTTP ${metadataRes.status}).`);
    const metadata = (await metadataRes.json()) as { sheets?: Array<{ properties?: { title?: string } }> };
    const exists = metadata.sheets?.some((sheet) => sheet.properties?.title === projectsSheetName);
    if (!exists) {
      const createRes = await fetch(`${baseUrl}:batchUpdate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ addSheet: { properties: { title: projectsSheetName, gridProperties: { frozenRowCount: 1 } } } }] }),
      });
      if (!createRes.ok) throw new Error(`No se pudo crear la hoja ${projectsSheetName} (HTTP ${createRes.status}).`);
    }

    const headerRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${projectsSheetName}'!A1:J1`)}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!headerRes.ok) throw new Error(`No se pudo leer la hoja ${projectsSheetName} (HTTP ${headerRes.status}).`);
    const headerBody = (await headerRes.json()) as { values?: string[][] };
    const headers = (headerBody.values?.[0] || []).map((value) => value.trim().toLowerCase());
    if (headers.length === 0) {
      const initRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${projectsSheetName}'!A1`)}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [[...PROJECT_HEADERS]] }),
      });
      if (!initRes.ok) throw new Error(`No se pudieron crear los encabezados de ${projectsSheetName}.`);
      return;
    }
    if (PROJECT_HEADERS.some((header) => !headers.includes(header))) {
      throw new Error(`La hoja ${projectsSheetName} debe tener los encabezados: ${PROJECT_HEADERS.join(', ')}.`);
    }
  }

  private projectRecordToRow(record: ProjectRecord): string[] {
    return [record.id, record.type, record.title, record.organization, record.chronology_start,
      record.chronology_end, record.status, record.detail, record.visibility, String(record.sort_order)];
  }

  private async readProjectRecords(): Promise<ProjectRecord[]> {
    const { spreadsheetId, projectsSheetName } = this.config.googleSheets;
    const token = await this.getServiceAccountAccessToken();
    await this.ensureProjectsSheet(token);
    const range = encodeURIComponent(`'${projectsSheetName}'!A1:J1000`);
    const response = await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId!)}/values/${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!response.ok) throw new Error(`No se pudieron leer los proyectos (HTTP ${response.status}).`);
    const body = (await response.json()) as { values?: string[][] };
    const rows = body.values || [];
    const headers = (rows[0] || []).map((value) => value.trim().toLowerCase());
    const index = (name: string) => headers.indexOf(name);
    if (PROJECT_HEADERS.some((name) => index(name) < 0)) {
      throw new Error(`La hoja ${projectsSheetName} requiere las columnas de proyectos inicializadas por el sitio.`);
    }
    const read = (row: string[], name: string) => String(row[index(name)] ?? '').trim();
    const types: ProjectRecordType[] = ['Junta de Acción Comunal', 'Nexus Web Studio', 'Campaña política como edil', 'Otro'];
    const records = rows.slice(1).flatMap((row) => {
      const id = read(row, 'id');
      const title = read(row, 'title');
      if (!id || !title) return [];
      const rawType = read(row, 'type') as ProjectRecordType;
      const sortOrder = Number(read(row, 'sort_order'));
      return [{
        id, type: types.includes(rawType) ? rawType : 'Otro', title, organization: read(row, 'organization'),
        chronology_start: read(row, 'chronology_start'), chronology_end: read(row, 'chronology_end'),
        status: read(row, 'status') || 'En curso', detail: read(row, 'detail'),
        visibility: read(row, 'visibility').toLowerCase() === 'privada' ? 'privada' as const : 'publica' as const,
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 100,
      }];
    });
    return sortProjectRecords(records);
  }

  async getProjectRecords(publicOnly = false): Promise<ProjectRecord[]> {
    const records = await this.readProjectRecords();
    return sortProjectRecords(publicOnly ? records.filter((record) => record.visibility === 'publica') : records);
  }

  async getCommunityManagementRecords(publicOnly = true): Promise<CommunityManagementRecord[]> {
    const { spreadsheetId, communityManagementsSheetName } = this.config.googleSheets;
    if (!this.isSheetsConfigured() || !spreadsheetId) {
      throw new Error('Google Sheets no está configurado en este servidor.');
    }

    const token = await this.getServiceAccountAccessToken();
    const escapedSheetName = communityManagementsSheetName.replace(/'/g, "''");
    const range = encodeURIComponent(`'${escapedSheetName}'!A1:H1000`);
    const response = await fetch(
      `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}/values/${range}`,
      { headers: { Authorization: `Bearer ${token}` } },
    );
    if (!response.ok) {
      throw new Error(`No se pudieron leer las gestiones realizadas (HTTP ${response.status}).`);
    }

    const body = (await response.json()) as { values?: string[][] };
    const rows = body.values || [];
    const headers = (rows[0] || []).map((value) => value.trim().toLowerCase());
    const index = (name: string) => headers.indexOf(name);
    if (COMMUNITY_MANAGEMENT_HEADERS.some((header) => index(header) < 0)) {
      throw new Error(`La hoja ${communityManagementsSheetName} requiere las columnas: ${COMMUNITY_MANAGEMENT_HEADERS.join(', ')}.`);
    }

    const read = (row: string[], name: string) => String(row[index(name)] ?? '').trim();
    const records = rows.slice(1).flatMap((row): CommunityManagementRecord[] => {
      const id = read(row, 'id');
      const title = read(row, 'title');
      if (!id || !title) return [];
      const sortOrder = Number(read(row, 'sort_order'));
      return [{
        id,
        title,
        category: read(row, 'category'),
        chronology: read(row, 'chronology'),
        status: read(row, 'status'),
        detail: read(row, 'detail'),
        visibility: read(row, 'visibility').toLowerCase() === 'privada' ? 'privada' : 'publica',
        sort_order: Number.isFinite(sortOrder) ? sortOrder : 100,
      }];
    });

    return records
      .filter((record) => !publicOnly || record.visibility === 'publica')
      .sort((a, b) => a.sort_order - b.sort_order);
  }

  private async writeProjectRecords(records: ProjectRecord[]): Promise<void> {
    const { spreadsheetId, projectsSheetName } = this.config.googleSheets;
    const token = await this.getServiceAccountAccessToken();
    await this.ensureProjectsSheet(token);
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId!)}`;
    const range = encodeURIComponent(`'${projectsSheetName}'!A1:J1000`);
    const clearRes = await fetch(`${baseUrl}/values/${range}:clear`, { method: 'POST', headers: { Authorization: `Bearer ${token}` } });
    if (!clearRes.ok) throw new Error(`No se pudo limpiar la hoja de proyectos (HTTP ${clearRes.status}).`);
    const values = [[...PROJECT_HEADERS], ...sortProjectRecords(records).map((record) => this.projectRecordToRow(record))];
    const writeRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${projectsSheetName}'!A1`)}?valueInputOption=RAW`, {
      method: 'PUT', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values }),
    });
    if (!writeRes.ok) throw new Error(`No se pudieron guardar los proyectos (HTTP ${writeRes.status}).`);
  }

  async createProjectRecord(input: Omit<ProjectRecord, 'id'>): Promise<ProjectRecord> {
    const records = await this.readProjectRecords();
    const nextId = records.reduce((max, item) => Math.max(max, Number(item.id) || 0), records.length) + 1;
    const record = { ...input, id: String(nextId) };
    await this.writeProjectRecords([...records, record]);
    return record;
  }

  async updateProjectRecord(id: string, input: Omit<ProjectRecord, 'id'>): Promise<ProjectRecord | null> {
    const records = await this.readProjectRecords();
    if (!records.some((record) => record.id === id)) return null;
    const updated = { ...input, id };
    await this.writeProjectRecords(records.map((record) => record.id === id ? updated : record));
    return updated;
  }

  async deleteProjectRecord(id: string): Promise<boolean> {
    const records = await this.readProjectRecords();
    if (!records.some((record) => record.id === id)) return false;
    await this.writeProjectRecords(records.filter((record) => record.id !== id));
    return true;
  }

  private async resolveUsersTabAndHeaders(token: string): Promise<{
    tabName: string;
    headers: string[];
    rows: string[][];
    userIdx: number;
    passIdx: number;
    urlIdx: number;
  }> {
    const { spreadsheetId, usersSheetName } = this.config.googleSheets;
    if (!spreadsheetId) throw new Error('Falta configurar GOOGLE_SHEETS_SPREADSHEET_ID.');

    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId)}`;
    const metadataRes = await fetch(`${baseUrl}?fields=sheets.properties(sheetId,title)`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!metadataRes.ok) throw new Error(`No se pudieron consultar las hojas (HTTP ${metadataRes.status}).`);
    const metadata = (await metadataRes.json()) as { sheets?: Array<{ properties?: { title?: string } }> };
    const allTabs = (metadata.sheets || []).map((s) => s.properties?.title || '').filter(Boolean);
    const matchedTab = allTabs.find((t) => t.toLowerCase() === usersSheetName.toLowerCase()) || usersSheetName;
    const escapedTab = matchedTab.replace(/'/g, "''");

    if (!allTabs.includes(matchedTab)) {
      const createRes = await fetch(`${baseUrl}:batchUpdate`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ requests: [{ addSheet: { properties: { title: matchedTab, gridProperties: { frozenRowCount: 1 } } } }] }),
      });
      if (!createRes.ok) throw new Error(`No se pudo crear la hoja ${matchedTab} (HTTP ${createRes.status}).`);
      const initHeaders = ['Usuario', 'Contraseña', 'Url Perfil'];
      const initRes = await fetch(`${baseUrl}/values/${encodeURIComponent(`'${escapedTab}'!A1`)}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [initHeaders] }),
      });
      if (!initRes.ok) throw new Error(`No se pudieron crear los encabezados de ${matchedTab}.`);
      return { tabName: matchedTab, headers: initHeaders, rows: [], userIdx: 0, passIdx: 1, urlIdx: 2 };
    }

    const range = encodeURIComponent(`'${escapedTab}'!A1:Z1000`);
    const valuesRes = await fetch(`${baseUrl}/values/${range}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!valuesRes.ok) throw new Error(`No se pudo leer la hoja ${matchedTab} (HTTP ${valuesRes.status}).`);
    const body = (await valuesRes.json()) as { values?: string[][] };
    const values = (body.values || []).map((r) => r.map((c) => String(c ?? '')));

    if (values.length === 0 || !values[0]?.some((c) => c.trim())) {
      const initHeaders = ['Usuario', 'Contraseña', 'Url Perfil'];
      await fetch(`${baseUrl}/values/${encodeURIComponent(`'${escapedTab}'!A1`)}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [initHeaders] }),
      });
      return { tabName: matchedTab, headers: initHeaders, rows: [], userIdx: 0, passIdx: 1, urlIdx: 2 };
    }

    const headers = values[0];
    const norm = (s: string) => s.trim().toLowerCase();
    const findIdx = (...candidates: string[]) => headers.findIndex((h) => candidates.includes(norm(h)));
    const userIdx = findIdx('usuario', 'user', 'username');
    const passIdx = findIdx('contraseña', 'contrasena', 'password', 'password_hash');
    const urlIdx = findIdx('url perfil', 'url del perfil', 'url_perfil', 'perfil', 'url');

    if (userIdx < 0 || passIdx < 0) {
      throw new Error(`La hoja ${matchedTab} debe contener los encabezados "Usuario" y "Contraseña".`);
    }

    return {
      tabName: matchedTab,
      headers,
      rows: values.slice(1),
      userIdx,
      passIdx,
      urlIdx,
    };
  }

  private columnIndexToLetter(index: number): string {
    let n = index;
    let letter = '';
    while (n >= 0) {
      letter = String.fromCharCode((n % 26) + 65) + letter;
      n = Math.floor(n / 26) - 1;
    }
    return letter;
  }

  async syncAdminUserToUsersSheet(
    username: string,
    passwordHash: string,
    profileUrl: string
  ): Promise<{ synced: boolean; action: 'created' | 'updated' | 'unchanged' }> {
    if (!this.isSheetsConfigured()) {
      throw new Error('Google Sheets no está configurado.');
    }
    const { spreadsheetId } = this.config.googleSheets;
    const token = await this.getServiceAccountAccessToken();
    const sheet = await this.resolveUsersTabAndHeaders(token);
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId!)}`;
    const escapedTab = sheet.tabName.replace(/'/g, "''");

    const existingIndex = sheet.rows.findIndex(
      (row) => (row[sheet.userIdx] || '').trim() === username.trim()
    );

    const width = Math.max(sheet.headers.length, sheet.userIdx + 1, sheet.passIdx + 1, sheet.urlIdx + 1);

    if (existingIndex === -1) {
      const newRow = new Array<string>(width).fill('');
      newRow[sheet.userIdx] = username.trim();
      newRow[sheet.passIdx] = passwordHash;
      if (sheet.urlIdx >= 0) newRow[sheet.urlIdx] = profileUrl;
      const targetRowNumber = sheet.rows.length + 2;
      const range = encodeURIComponent(`'${escapedTab}'!A${targetRowNumber}`);
      const writeRes = await fetch(`${baseUrl}/values/${range}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [newRow] }),
      });
      if (!writeRes.ok) throw new Error(`No se pudo registrar el usuario en ${sheet.tabName} (HTTP ${writeRes.status}).`);
      return { synced: true, action: 'created' };
    }

    const row = sheet.rows[existingIndex].slice();
    while (row.length < width) row.push('');
    let changed = false;
    if (!row[sheet.passIdx]?.trim()) {
      row[sheet.passIdx] = passwordHash;
      changed = true;
    }
    if (sheet.urlIdx >= 0 && (!row[sheet.urlIdx]?.trim() || row[sheet.urlIdx].includes('localhost:3010')) && profileUrl) {
      row[sheet.urlIdx] = profileUrl;
      changed = true;
    }
    if (!changed) return { synced: true, action: 'unchanged' };

    const targetRowNumber = existingIndex + 2;
    const range = encodeURIComponent(`'${escapedTab}'!A${targetRowNumber}`);
    const writeRes = await fetch(`${baseUrl}/values/${range}?valueInputOption=RAW`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [row] }),
    });
    if (!writeRes.ok) throw new Error(`No se pudo actualizar el usuario en ${sheet.tabName} (HTTP ${writeRes.status}).`);
    return { synced: true, action: 'updated' };
  }

  async updateUserProfileUrlInUsersSheet(username: string, profileUrl: string): Promise<void> {
    if (!this.isSheetsConfigured() || !username.trim()) return;
    const { spreadsheetId } = this.config.googleSheets;
    const token = await this.getServiceAccountAccessToken();
    const sheet = await this.resolveUsersTabAndHeaders(token);
    if (sheet.urlIdx < 0) return;
    const existingIndex = sheet.rows.findIndex(
      (row) => (row[sheet.userIdx] || '').trim() === username.trim()
    );
    if (existingIndex === -1) return;
    const colLetter = this.columnIndexToLetter(sheet.urlIdx);
    const rowNumber = existingIndex + 2;
    const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId!)}`;
    const escapedTab = sheet.tabName.replace(/'/g, "''");
    const range = encodeURIComponent(`'${escapedTab}'!${colLetter}${rowNumber}`);
    await fetch(`${baseUrl}/values/${range}?valueInputOption=RAW`, {
      method: 'PUT',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ values: [[profileUrl]] }),
    });
  }

  async verifyUserInUsersSheet(
    username: string,
    password: string,
    verifyHashFn: (pw: string, storedHash: string) => boolean,
    hashFn: (pw: string) => string
  ): Promise<'valid' | 'invalid' | 'not_found'> {
    if (!this.isSheetsConfigured()) return 'not_found';
    const { spreadsheetId } = this.config.googleSheets;
    const token = await this.getServiceAccountAccessToken();
    const sheet = await this.resolveUsersTabAndHeaders(token);
    const existingIndex = sheet.rows.findIndex(
      (row) => (row[sheet.userIdx] || '').trim() === username.trim()
    );
    if (existingIndex === -1) return 'not_found';

    const stored = String(sheet.rows[existingIndex][sheet.passIdx] ?? '').trim();
    if (!stored) return 'invalid';

    const isScryptHash = /^[0-9a-f]{32}:[0-9a-f]{128}$/i.test(stored);
    if (isScryptHash) {
      return verifyHashFn(password, stored) ? 'valid' : 'invalid';
    }

    const a = Buffer.from(password, 'utf8');
    const b = Buffer.from(stored, 'utf8');
    if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
      return 'invalid';
    }

    // Upgrade plaintext entry in sheet to scrypt hash immediately
    try {
      const colLetter = this.columnIndexToLetter(sheet.passIdx);
      const rowNumber = existingIndex + 2;
      const baseUrl = `https://sheets.googleapis.com/v4/spreadsheets/${encodeURIComponent(spreadsheetId!)}`;
      const escapedTab = sheet.tabName.replace(/'/g, "''");
      const range = encodeURIComponent(`'${escapedTab}'!${colLetter}${rowNumber}`);
      await fetch(`${baseUrl}/values/${range}?valueInputOption=RAW`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ values: [[hashFn(password)]] }),
      });
    } catch {
      // Non-fatal if upgrade write fails
    }
    return 'valid';
  }

  getSheetsStatus(): SheetsStatusInfo {
    const configured = this.isSheetsConfigured();
    const rawId = this.config.googleSheets.spreadsheetId;
    const masked =
      rawId && rawId.length > 10 ? `${rawId.slice(0, 5)}…${rawId.slice(-4)}` : rawId ? 'Configurado' : null;
    const store = this.ensureStoreInitialized();

    return {
      configured,
      source: configured && !this.lastSheetsError ? 'google-sheets' : 'local-store',
      spreadsheetIdMasked: masked,
      sheetName: this.resolvedRecordsSheetName || this.config.googleSheets.sheetName,
      lastSyncAt: store.lastSyncAt,
      cacheBehavior: configured
        ? 'Caché local en memoria y disco con revalidación cada 60 segundos y escritura inmediata al guardar cambios en el panel (no consulta la hoja en cada visita pública).'
        : 'Sin credenciales de Google Sheets configuradas: opera sobre almacenamiento local persistente (data/store.json) sin exponer filas privadas en rutas públicas.',
      lastError: this.lastSheetsError,
      headers: [...SHEET_HEADERS],
    };
  }
}
