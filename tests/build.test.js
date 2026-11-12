import { test } from 'node:test';
import assert from 'node:assert/strict';
import { regrouper } from '../tools/build.mjs';

test('regroupe sans collision de noms locaux', async () => {
  const code = regrouper('tests/fixtures/bundle/entree.js');
  assert.ok(!/^\s*(import|export)\s/m.test(code));
  await import('data:text/javascript,' + encodeURIComponent(code));
  assert.equal(globalThis.__res, 'AB');
});

test('refuse export default', () => {
  assert.throws(() => regrouper('tests/fixtures/bundle-invalide/entree.js'), /export default/);
});
