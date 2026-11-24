import type { PoliticalRecord } from './types';

export function formatRecordChronology(
  record: Pick<PoliticalRecord, 'chronology_start' | 'chronology_end'>
): string {
  const start = record.chronology_start.trim();
  const end = record.chronology_end.trim();
  if (start && end) return `${start} – ${end}`;
  return start || end || 'Pendiente de confirmar';
}
