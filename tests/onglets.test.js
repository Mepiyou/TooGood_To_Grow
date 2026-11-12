import test from 'node:test';
import assert from 'node:assert/strict';
import { rendreOngletsMois } from '../js/ui/onglets.js';

test('onglets du mois : Revenus actif, Provisions masqué (D14)', () => {
  const html = rendreOngletsMois('revenus');
  assert.match(html, /<a class="onglet" href="#\/mois\/revenus" aria-current="page">Revenus<\/a>/);
  assert.match(html, /<a class="onglet" href="#\/mois\/charges">Charges fixes<\/a>/);
  assert.doesNotMatch(html, /Provisions/);
  assert.equal(html.match(/aria-current/g).length, 1);
});

test('onglets du mois : Charges actif', () => {
  const html = rendreOngletsMois('charges');
  assert.match(html, /href="#\/mois\/charges" aria-current="page"/);
  assert.doesNotMatch(html, /href="#\/mois\/revenus" aria-current/);
});
