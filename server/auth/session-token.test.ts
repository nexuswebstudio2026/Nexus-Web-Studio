import test from 'node:test';
import assert from 'node:assert/strict';
import {
  hashPassword,
  parseCookieHeader,
  signSessionToken,
  verifyPassword,
  verifySessionToken,
} from './session-token';

test('scrypt password hashing verifies matching password and rejects wrong password', () => {
  const hash = hashPassword('ClaveSegura2026!');
  assert.equal(verifyPassword('ClaveSegura2026!', hash), true);
  assert.equal(verifyPassword('ClaveIncorrecta', hash), false);
  assert.equal(verifyPassword('ClaveSegura2026!', 'invalid-hash'), false);
});

test('signed session token validates signature and expiration', () => {
  const secret = 'test-secret-key-minimum-length-32-chars';
  const now = 1_700_000_000;
  const token = signSessionToken('camilo', secret, now, 3600);

  const valid = verifySessionToken(token, secret, now + 100);
  assert.equal(valid?.sub, 'camilo');

  const expired = verifySessionToken(token, secret, now + 3601);
  assert.equal(expired, null);

  const tampered = verifySessionToken(`${token}x`, secret, now + 10);
  assert.equal(tampered, null);
});

test('parseCookieHeader extracts cookies safely', () => {
  const cookies = parseCookieHeader('foo=bar; acv_session=abc.def; theme=auto');
  assert.equal(cookies.acv_session, 'abc.def');
  assert.equal(cookies.foo, 'bar');
});
