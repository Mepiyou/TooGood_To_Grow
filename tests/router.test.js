import test from 'node:test';
import assert from 'node:assert/strict';
import { resoudreRoute, ROUTES } from '../js/router.js';

test('routes', () => {
  assert.equal(resoudreRoute('').nom, 'accueil'); assert.equal(resoudreRoute('#/').nom, 'accueil');
  assert.deepEqual(resoudreRoute('#/ajout/abc').params, { id: 'abc' });
  assert.equal(resoudreRoute('#/ajout').bouton, false);
  assert.deepEqual(resoudreRoute('#/historique/supprimer/2026-10'), { nom: 'supprimer-mois', params: { mois: '2026-10' }, onglet: null, bouton: false });
  assert.equal(resoudreRoute('#/historique').onglet, 'depenses');
  assert.equal(resoudreRoute('#/mois/charges').onglet, 'mois');
  assert.equal(resoudreRoute('#/inconnue').nom, 'accueil');
  assert.equal(resoudreRoute('#/enveloppes').nom, 'accueil'); // V2 masquée (D14)
});

test('forme exacte et V2', () => {
  assert.deepEqual(resoudreRoute('#/'), { nom: 'accueil', params: {}, onglet: 'accueil', bouton: true });
  assert.deepEqual(resoudreRoute('#/mois/provisions'), resoudreRoute('#/'));
  assert.equal(ROUTES.filter((r) => r.v2).length, 2);
  assert.equal(resoudreRoute('#/categories').onglet, null);
});
