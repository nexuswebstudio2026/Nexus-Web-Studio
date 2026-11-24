import test from 'node:test';
import assert from 'node:assert/strict';
import { inferSectionFromText, validatePoliticalRecordInput } from './records';

test('validatePoliticalRecordInput accepts valid record and sanitizes angle brackets', () => {
  const res = validatePoliticalRecordInput({
    title: 'Presidencia: gestión comunitaria <script>',
    chronology_start: 'Julio de 2022',
    chronology_end: '',
    status: 'Confirmado',
    detail: 'Detalle válido con más de diez caracteres.',
    visibility: 'publica',
    sort_order: 45,
  });

  assert.equal(res.ok, true);
  assert.equal(res.data?.title, 'Presidencia: gestión comunitaria script');
  assert.equal(res.data?.section, 'presidente_jac');
  assert.equal(res.data?.visibility, 'publica');
});

test('validatePoliticalRecordInput rejects missing required fields', () => {
  const res = validatePoliticalRecordInput({
    title: 'ab',
    chronology_start: '',
    chronology_end: '',
    status: '',
    detail: 'corto',
    visibility: 'otra',
    sort_order: -1,
  });

  assert.equal(res.ok, false);
  assert.ok(res.errors?.title);
  assert.ok(res.errors?.chronology_start);
  assert.ok(res.errors?.detail);
  assert.ok(res.errors?.visibility);
  assert.ok(res.errors?.sort_order);
});

test('inferSectionFromText maps political record titles into page sections', () => {
  assert.equal(inferSectionFromText('Secretario de Junta'), 'secretario_jac');
  assert.equal(inferSectionFromText('Proyecto Nexus Web Studio'), 'proyecto_nexus');
  assert.equal(inferSectionFromText('Aspiración futura como edil'), 'aspiracion_edil');
});
