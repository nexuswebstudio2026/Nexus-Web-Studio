import test from 'node:test';
import assert from 'node:assert/strict';
import { getThemeForHour, isDaytimeHour } from './theme';

test('day mode applies from 6:00 a.m. to 5:59 p.m.', () => {
  assert.equal(isDaytimeHour(6), true);
  assert.equal(isDaytimeHour(12), true);
  assert.equal(isDaytimeHour(17), true);
  assert.equal(getThemeForHour(6), 'light');
  assert.equal(getThemeForHour(17), 'light');
});

test('night mode applies from 6:00 p.m. to 5:59 a.m.', () => {
  assert.equal(isDaytimeHour(18), false);
  assert.equal(isDaytimeHour(23), false);
  assert.equal(isDaytimeHour(0), false);
  assert.equal(isDaytimeHour(5), false);
  assert.equal(getThemeForHour(18), 'dark');
  assert.equal(getThemeForHour(5), 'dark');
});
