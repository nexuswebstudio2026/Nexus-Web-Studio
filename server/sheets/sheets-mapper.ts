import type { PoliticalRecord, RecordSection, RecordVisibility } from '../../shared/types';
import { inferSectionFromText } from '../validation/records.js';

export const SHEET_HEADERS = [
  'id',
  'title',
  'chronology_start',
  'chronology_end',
  'detail',
  'status',
  'visibility',
  'sort_order',
] as const;

export function validateSheetHeaders(headers: string[]): { valid: boolean; missing: string[] } {
  const normalized = headers.map((h) => h.trim().toLowerCase());
  const missing = SHEET_HEADERS.filter((expected) => !normalized.includes(expected));
  return { valid: missing.length === 0, missing: [...missing] };
}

export function rowArrayToRecord(row: string[], headers: string[]): PoliticalRecord | null {
  const indexMap = new Map<string, number>();
  headers.forEach((h, i) => indexMap.set(h.trim().toLowerCase(), i));

  const get = (key: string): string => {
    const idx = indexMap.get(key);
    return idx !== undefined ? String(row[idx] ?? '').trim() : '';
  };

  const id = get('id');
  const title = get('title');
  if (!id || !title) return null;

  const section: RecordSection = inferSectionFromText(`${title} ${get('detail')}`);

  const rawVis = get('visibility').toLowerCase();
  const visibility: RecordVisibility = rawVis === 'privada' ? 'privada' : 'publica';
  const sortOrderRaw = Number(get('sort_order'));

  return {
    id,
    section,
    title,
    chronology_start: get('chronology_start') || 'Pendiente de confirmar',
    chronology_end: get('chronology_end'),
    detail: get('detail'),
    status: get('status') || 'Confirmado',
    visibility,
    sort_order: Number.isFinite(sortOrderRaw) ? sortOrderRaw : 100,
  };
}

export function recordToRowArray(record: PoliticalRecord): string[] {
  return [
    record.id,
    record.title,
    record.chronology_start,
    record.chronology_end,
    record.detail,
    record.status,
    record.visibility,
    String(record.sort_order),
  ];
}

export function filterPublicRecords(records: PoliticalRecord[]): PoliticalRecord[] {
  return records
    .filter((r) => r.visibility === 'publica')
    .slice()
    .sort((a, b) => a.sort_order - b.sort_order);
}
