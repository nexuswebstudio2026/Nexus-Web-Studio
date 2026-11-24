import type { EmploymentRecord, EmploymentSector } from './types.js';

export interface HasRecordId {
  id: string;
}

export function compareRecordsById(a: HasRecordId, b: HasRecordId): number {
  return a.id.localeCompare(b.id, undefined, { numeric: true, sensitivity: 'base' });
}

export function sortRecordsById<T extends HasRecordId>(records: readonly T[]): T[] {
  return [...records].sort(compareRecordsById);
}

export function inferEmploymentSector(record: Pick<EmploymentRecord, 'type' | 'title' | 'organization'>): EmploymentSector {
  const searchable = `${record.organization} ${record.title}`.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();

  if (/junta de accion comunal|\bjac\b/.test(searchable)) return 'Comunitario';
  if (/\binem\b|ser regionales|\bese\b|hospital|alcaldia|gobernacion|ministerio|entidad publica/.test(searchable)) return 'Público';
  if (/\bsas\b|racores|empresa privada|sector privado/.test(searchable)) return 'Privado';
  return record.type === 'Cargo público' ? 'Público' : 'Sin clasificar';
}
