import test from 'node:test';
import assert from 'node:assert/strict';
import { appelsReseau } from '../tools/zero-requete.mjs';

test('code sans appel réseau : rien de détecté', () => {
  assert.deepEqual(appelsReseau('const a = 1; function prefetcher() {} // fetching'), []);
});

test('détecte chaque API réseau interdite', () => {
  assert.deepEqual(appelsReseau('fetch("x")'), ['fetch(']);
  assert.deepEqual(appelsReseau('window.fetch ("x")'), ['fetch(']);
  assert.deepEqual(appelsReseau('new XMLHttpRequest()'), ['XMLHttpRequest']);
  assert.deepEqual(appelsReseau('navigator.sendBeacon(u)'), ['sendBeacon']);
  assert.deepEqual(appelsReseau('new WebSocket(u)'), ['WebSocket']);
  assert.deepEqual(appelsReseau('new EventSource(u)'), ['EventSource']);
});

test("liste chaque API une seule fois, dans l'ordre de la liste", () => {
  assert.deepEqual(appelsReseau('fetch(a); fetch(b); new WebSocket(c)'), ['fetch(', 'WebSocket']);
});
