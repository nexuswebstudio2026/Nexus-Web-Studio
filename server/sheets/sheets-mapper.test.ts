import test from 'node:test';
import assert from 'node:assert/strict';
import {
  filterPublicRecords,
  recordToRowArray,
  rowArrayToRecord,
  SHEET_HEADERS,
  validateSheetHeaders,
} from './sheets-mapper';

test('validateSheetHeaders verifies the political timeline headers', () => {
  assert.equal(validateSheetHeaders([...SHEET_HEADERS]).valid, true);
  const missing = validateSheetHeaders(['id', 'title']);
  assert.equal(missing.valid, false);
  assert.ok(missing.missing.includes('visibility'));
});

test('rowArrayToRecord and recordToRowArray round-trip cleanly', () => {
  const sample = {
    id: 'rec-01',
    section: 'actividad_jac' as const,
    title: 'Jornada de siembra',
    chronology_start: '2024',
    chronology_end: '2025',
    detail: 'Siembra vecinal de árboles en el sector.',
    status: 'Confirmado',
    visibility: 'publica' as const,
    sort_order: 50,
  };
  const row = recordToRowArray(sample);
  const parsed = rowArrayToRecord(row, [...SHEET_HEADERS]);
  assert.deepEqual(parsed, sample);
});

test('filterPublicRecords excludes private records and sorts by sort_order', () => {
  const filtered = filterPublicRecords([
    {
      id: '2',
      section: 'actividad_jac',
      title: 'Segundo público',
      chronology_start: '2024',
      chronology_end: '',
      detail: 'Detalle público dos.',
      status: 'Confirmado',
      visibility: 'publica',
      sort_order: 20,
    },
    {
      id: 'priv',
      section: 'actividad_jac',
      title: 'Borrador privado',
      chronology_start: '2025',
      chronology_end: '',
      detail: 'No debe aparecer en público.',
      status: 'Pendiente de confirmación',
      visibility: 'privada',
      sort_order: 5,
    },
    {
      id: '1',
      section: 'secretario_jac',
      title: 'Primero público',
      chronology_start: '2018',
      chronology_end: '',
      detail: 'Detalle público uno.',
      status: 'Confirmado',
      visibility: 'publica',
      sort_order: 10,
    },
  ]);

  assert.equal(filtered.length, 2);
  assert.equal(filtered[0].id, '1');
  assert.equal(filtered[1].id, '2');
});
