import test from 'node:test';
import assert from 'node:assert/strict';
import { isAllowlistedRelativePath } from './audit-allowlist';

test('allowlist excludes secrets, env files, service accounts, data, and node_modules', () => {
  assert.equal(isAllowlistedRelativePath('.env'), false);
  assert.equal(isAllowlistedRelativePath('.env.local'), false);
  assert.equal(isAllowlistedRelativePath('data/store.json'), false);
  assert.equal(isAllowlistedRelativePath('data/admin-auth.json'), false);
  assert.equal(isAllowlistedRelativePath('node_modules/express/index.js'), false);
  assert.equal(isAllowlistedRelativePath('google-service-account.json'), false);
  assert.equal(isAllowlistedRelativePath('private.pem'), false);
});

test('allowlist permits source files for static read-only inspection', () => {
  assert.equal(isAllowlistedRelativePath('server.ts'), true);
  assert.equal(isAllowlistedRelativePath('src/App.tsx'), true);
  assert.equal(isAllowlistedRelativePath('server/auth/auth.service.ts'), true);
  assert.equal(isAllowlistedRelativePath('package.json'), true);
});
