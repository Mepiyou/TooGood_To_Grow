import test from 'node:test';
import assert from 'node:assert/strict';
import { resoudreRoute, ROUTES, creerSuiviRendus, titreDocument, doitRafraichir } from '../js/router.js';

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

test('titre du document par route', () => {
  assert.equal(titreDocument('#/'), 'TooGood To Grow');
  assert.equal(titreDocument('#/inconnue'), 'TooGood To Grow');
  assert.equal(titreDocument('#/mois/revenus'), 'Mon mois – Revenus · TooGood To Grow');
  assert.equal(titreDocument('#/ajout'), 'Ajouter une dépense · TooGood To Grow');
  assert.equal(titreDocument('#/ajout/abc'), 'Modifier la dépense · TooGood To Grow');
  assert.equal(titreDocument('#/historique/supprimer/2026-10'), 'Supprimer un mois · TooGood To Grow');
  assert.equal(titreDocument('#/enveloppes'), 'TooGood To Grow'); // V2 masquée : titre de l'accueil
  assert.ok(ROUTES.every((r) => typeof r.titre === 'string' && r.titre !== ''));
});

test('cas limites du hash', () => {
  assert.equal(resoudreRoute('#/depenses/').nom, 'depenses');
  assert.deepEqual(resoudreRoute('#/ajout/a%20b').params, { id: 'a b' });
  assert.deepEqual(resoudreRoute('#/ajout/%E0%A4'), resoudreRoute('#/'));
  assert.equal(resoudreRoute('#/depenses?x=1').nom, 'depenses');
});

test('suivi des rendus : seul le plus récent est actuel', () => {
  const suivi = creerSuiviRendus();
  const a = suivi.demarrer(true);
  assert.equal(suivi.estActuel(a), true);
  const b = suivi.demarrer(true);
  assert.equal(suivi.estActuel(a), false);
  assert.equal(suivi.estActuel(b), true);
  assert.equal(suivi.terminer(a), false); // rendu périmé : ni affichage ni focus
  assert.equal(suivi.terminer(b), true);
});

test('suivi des rendus : le focus dû survit à un rafraîchissement', () => {
  const suivi = creerSuiviRendus();
  suivi.demarrer(true); // navigation
  const r = suivi.demarrer(false); // rafraichir() pendant le rendu
  assert.equal(suivi.terminer(r), true);
  const r2 = suivi.demarrer(false);
  assert.equal(suivi.terminer(r2), false); // focus déjà posé, pas de nouveau focus
});

test('suivi des rendus : un rafraîchissement seul ne déplace pas le focus', () => {
  const suivi = creerSuiviRendus();
  assert.equal(suivi.terminer(suivi.demarrer(false)), false);
});

test('doitRafraichir : seulement si la date a changé, jamais sur l\'écran d\'ajout', () => {
  assert.equal(doitRafraichir({ dateRendu: '2026-11-10', aujourdhui: '2026-11-10', route: 'accueil' }), false);
  assert.equal(doitRafraichir({ dateRendu: '2026-11-10', aujourdhui: '2026-11-11', route: 'accueil' }), true);
  assert.equal(doitRafraichir({ dateRendu: '2026-11-30', aujourdhui: '2026-12-01', route: 'depenses' }), true);
  assert.equal(doitRafraichir({ dateRendu: '2026-11-10', aujourdhui: '2026-11-11', route: 'ajout' }), false);
  assert.equal(doitRafraichir({ dateRendu: null, aujourdhui: '2026-11-11', route: 'accueil' }), false);
});
