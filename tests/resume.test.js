import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculerResume, moisACloturer, moisImpactes, planSuppressionMois, repartitionDonut, totauxSixMois,
} from '../js/domain/resume.js';

const oct = [['d1','courses',1200,'2026-10-02'],['d2','courses',800,'2026-10-09'],['d3','transport',2500,'2026-10-01'],['d4','sorties',1500,'2026-10-17'],['d5','plaisir',1000,'2026-10-25']]
  .map(([id, categorieId, montant, date]) => ({ id, categorieId, montant, date, mois: '2026-10' }));
const nov = { id: 'n1', categorieId: 'courses', montant: 500, date: '2026-11-02', mois: '2026-11' };
test('T8 résumé mensuel', () => {
  const r = calculerResume('2026-10', [...oct, nov], { maintenant: 'X' });
  assert.equal(r.total, 7000); assert.equal(r.nbDepenses, 5);
  assert.deepEqual(r.parCategorie, { courses: 2000, transport: 2500, sorties: 1500, plaisir: 1000 });
  assert.equal(r.detailSupprime, false);
  assert.equal(r.epargne, 0); assert.equal(r.calculeLe, 'X');
});
test('T9 suppression avec totaux', () => {
  const p = planSuppressionMois({ mois: '2026-10', moisCourant: '2026-11', garderTotaux: true, depenses: [...oct, nov], resume: null, maintenant: 'X' });
  assert.deepEqual(p.idsDepenses, ['d1','d2','d3','d4','d5']); assert.equal(p.resume.total, 7000);
  assert.equal(p.resume.detailSupprime, true); assert.equal(p.supprimerResume, false);
});
test('T9 suppression avec totaux : résumé existant conservé', () => {
  const existant = { mois: '2026-10', total: 7000, parCategorie: {}, epargne: 300, nbDepenses: 5, detailSupprime: false, calculeLe: 'A' };
  const p = planSuppressionMois({ mois: '2026-10', moisCourant: '2026-11', garderTotaux: true, depenses: oct, resume: existant, maintenant: 'X' });
  assert.equal(p.resume.epargne, 300); assert.equal(p.resume.detailSupprime, true);
  assert.equal(existant.detailSupprime, false);
});
test('T10 suppression complète', () => {
  const p = planSuppressionMois({ mois: '2026-10', moisCourant: '2026-11', garderTotaux: false, depenses: [...oct, nov], resume: null, maintenant: 'X' });
  assert.equal(p.idsDepenses.length, 5); assert.equal(p.resume, null); assert.equal(p.supprimerResume, true);
});
test('mois en cours non supprimable', () => {
  assert.throws(() => planSuppressionMois({ mois: '2026-11', moisCourant: '2026-11', garderTotaux: true, depenses: [], resume: null }), /mois en cours/);
});
test('moisACloturer', () => {
  assert.deepEqual(moisACloturer('2026-09', '2026-11', '2026-08'), ['2026-10']);
  assert.deepEqual(moisACloturer(null, '2026-11', '2026-09'), ['2026-09', '2026-10']);
  assert.deepEqual(moisACloturer('2026-10', '2026-11', '2026-09'), []);
  assert.deepEqual(moisACloturer(null, '2026-11', null), []);
});
test('moisImpactes : changement de mois', () => {
  assert.deepEqual(moisImpactes(oct[0], { ...oct[0], date: '2026-09-30', mois: '2026-09' }, '2026-11').sort(), ['2026-09', '2026-10']);
  assert.deepEqual(moisImpactes(null, nov, '2026-11'), []);
  assert.deepEqual(moisImpactes(oct[0], null, '2026-11'), ['2026-10']);
});
test('donut : regroupement dans Autre au-delà de 5', () => {
  const cats = ['a','b','c','d','e','f','autre'].map(id => ({ id, nom: id, couleur: '#000' }));
  const r = repartitionDonut({ a: 5000, b: 3000, c: 1000, d: 500, e: 300, f: 200 }, cats);
  assert.deepEqual(r.map(x => [x.id, x.montant, x.pourcentage]), [['a',5000,50],['b',3000,30],['c',1000,10],['d',500,5],['autre',500,5]]);
});
test('donut : total 0 et au plus 5 entrées', () => {
  const cats = [{ id: 'a', nom: 'A', couleur: '#111' }, { id: 'autre', nom: 'Autre', couleur: '#222' }];
  assert.deepEqual(repartitionDonut({}, cats), []);
  const r = repartitionDonut({ a: 100, autre: 300 }, cats);
  assert.deepEqual(r.map(x => x.id), ['autre', 'a']);
});
test('six mois', () => {
  const t = totauxSixMois([{ mois: '2026-10', total: 7000 }], '2026-11', 1200);
  assert.equal(t.length, 6); assert.deepEqual(t.at(-1), { mois: '2026-11', total: 1200, courant: true });
  assert.equal(t.at(-2).total, 7000); assert.equal(t[0].mois, '2026-06'); assert.equal(t[0].total, null);
});
test('six mois : détail supprimé garde son total', () => {
  const t = totauxSixMois([{ mois: '2026-10', total: 7000, detailSupprime: true }], '2026-11', 0);
  assert.equal(t.at(-2).total, 7000);
});
