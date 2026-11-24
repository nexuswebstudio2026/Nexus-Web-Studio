import assert from 'node:assert/strict';
import test from 'node:test';
import { formatAiErrorSpanish, isTransientAiError, parseAiError } from './auditor-helpers';

test('parseAiError extracts 503 UNAVAILABLE JSON details from Gemini SDK error', () => {
  const err = new Error(
    '{"error":{"code":503,"message":"This model is currently experiencing high demand. Spikes in demand are usually temporary. Please try again later.","status":"UNAVAILABLE"}}'
  );
  const parsed = parseAiError(err);
  assert.equal(parsed.code, 503);
  assert.equal(parsed.status, 'UNAVAILABLE');
  assert.match(parsed.message, /high demand/);
  assert.equal(isTransientAiError(err), true);
  assert.match(formatAiErrorSpanish(err), /alta demanda temporal/i);
});

test('isTransientAiError returns false for 403/400 key errors and formats clearly', () => {
  const err = new Error('{"error":{"code":403,"message":"API key invalid","status":"PERMISSION_DENIED"}}');
  assert.equal(isTransientAiError(err), false);
  assert.match(formatAiErrorSpanish(err), /GEMINI_API_KEY/);
});
