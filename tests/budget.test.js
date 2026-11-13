import test from 'node:test';
import assert from 'node:assert/strict';
import { revenusRecus, totalRevenusAttendus, validerRevenu, datePourMois, resteAVivre, prochaineRentree, joursRestants, soldeQuotidien, calculerAccueil } from '../js/domain/budget.js';
import { jourEffectif, creerCharge } from '../js/domain/charges.js';

const base = { moisSuivant: false, actifDepuis: '2026-10' };
const rec = (nom, euros, jour, extra = {}) =>
  ({ id: nom, nom, montant: euros * 100, recurrent: true, jour, ...base, ...extra });
const ponc = (nom, euros, date, extra = {}) =>
  ({ id: nom, nom, montant: euros * 100, recurrent: false, date, ...base, ...extra });

test('jourEffectif', () => {
  assert.equal(jourEffectif(31, '2027-02'), 28);
  assert.equal(jourEffectif(5, '2026-11'), 5);
});

test('T1 revenu pas encore reçu', () => { assert.equal(revenusRecus([rec('APL', 200, 25)], '2026-11-10'), 0); });
test('revenu récurrent déjà reçu', () => { assert.equal(revenusRecus([rec('Bourse', 450, 5)], '2026-11-10'), 45000); });
test('ponctuel : seulement dans le mois et passé', () => {
  assert.equal(revenusRecus([ponc('Aide', 100, '2026-11-08')], '2026-11-10'), 10000);
  assert.equal(revenusRecus([ponc('Aide', 100, '2026-11-12')], '2026-11-10'), 0);
  assert.equal(revenusRecus([ponc('Aide', 100, '2026-10-08')], '2026-11-10'), 0);
});
test('actifDepuis futur ignoré', () => { assert.equal(revenusRecus([rec('B', 450, 5, { actifDepuis: '2026-12' })], '2026-11-10'), 0); });
test('jour 31 en février reçu le 28', () => { assert.equal(revenusRecus([rec('J', 400, 31)], '2027-02-28'), 40000); });
test('T16 moisSuivant compte au 1er du mois suivant', () => {
  const job = rec('Job', 400, 30, { moisSuivant: true });
  assert.equal(revenusRecus([job], '2026-11-01'), 40000);
  assert.equal(revenusRecus([job], '2026-10-31'), 0);
});
test('moisSuivant ponctuel', () => {
  assert.equal(revenusRecus([ponc('Prime', 400, '2026-10-30', { moisSuivant: true })], '2026-11-01'), 40000);
});
test('moisSuivant créé ce mois-ci : ne finance que le mois suivant', () => {
  assert.equal(revenusRecus([rec('Job', 400, 30, { moisSuivant: true, actifDepuis: '2026-11' })], '2026-11-15'), 0);
});
test('datePourMois', () => {
  assert.equal(datePourMois(rec('J', 400, 31), '2027-02'), '2027-02-28');
  assert.equal(datePourMois(rec('J', 400, 30, { moisSuivant: true }), '2026-11'), '2026-10-30');
  assert.equal(datePourMois(ponc('A', 1, '2026-11-08'), '2026-12'), null);
});
test('total attendu (démo)', () => {
  assert.equal(totalRevenusAttendus([rec('Bourse', 450, 5), rec('APL', 200, 25), rec('Job', 400, 30)], '2026-11'), 105000);
});
test('US1 : Bourse seule → total 450 €', () => {
  assert.equal(totalRevenusAttendus([rec('Bourse', 450, 5, { actifDepuis: '2026-11' })], '2026-11'), 45000);
});
test('validerRevenu', () => {
  assert.equal(validerRevenu({ nom: ' ', montantTexte: '450', recurrent: true, jour: 5 }).erreurs.nom, 'Le nom est obligatoire.');
  assert.equal(validerRevenu({ nom: 'B', montantTexte: '450', recurrent: true, jour: 32 }).erreurs.jour, 'Choisis un jour entre 1 et 31.');
  assert.equal(validerRevenu({ nom: 'B', montantTexte: '450', recurrent: false, date: '' }).erreurs.date, 'Choisis une date.');
  assert.deepEqual(validerRevenu({ nom: ' Bourse ', montantTexte: '450', recurrent: true, jour: 5, moisSuivant: false }).valeurs,
    { nom: 'Bourse', montant: 45000, recurrent: true, jour: 5, moisSuivant: false });
});
test('validerRevenu : cas limites', () => {
  assert.equal(validerRevenu({ nom: 'x'.repeat(41), montantTexte: '1', recurrent: true, jour: 5 }).erreurs.nom, '40 caractères maximum.');
  assert.equal(validerRevenu({ nom: 'B', montantTexte: '0', recurrent: true, jour: 5 }).erreurs.montant, 'Le montant doit être supérieur à 0 €.');
  assert.equal(validerRevenu({ nom: 'B', montantTexte: '1', recurrent: true, jour: '12' }).valeurs.jour, 12);
  assert.equal(validerRevenu({ nom: 'B', montantTexte: '1', recurrent: true, jour: '1.5' }).erreurs.jour, 'Choisis un jour entre 1 et 31.');
  assert.equal(validerRevenu({ nom: 'B', montantTexte: '1', recurrent: true, jour: 0 }).erreurs.jour, 'Choisis un jour entre 1 et 31.');
  assert.equal(validerRevenu({ nom: 'B', montantTexte: '1', recurrent: false, date: '2026-02-30' }).erreurs.date, 'Choisis une date.');
  assert.deepEqual(validerRevenu({ nom: 'B', montantTexte: '1', recurrent: false, date: '2026-11-08', mois: '2026-11', jour: 5, moisSuivant: true }).valeurs,
    { nom: 'B', montant: 100, recurrent: false, date: '2026-11-08', moisSuivant: true });
});
test('validerRevenu : date d\'un ponctuel limitée au mois affiché (D27)', () => {
  const v = (date, moisSuivant = false, mois = '2026-11') =>
    validerRevenu({ nom: 'B', montantTexte: '1', recurrent: false, date, mois, moisSuivant });
  const MSG = 'Choisis une date de ce mois-ci.';
  assert.equal(v('2026-11-20').ok, true);
  assert.equal(v('2026-12-02').erreurs.date, MSG);
  assert.equal(v('2026-12-02', true).erreurs.date, MSG);
  assert.equal(v('2026-10-30').erreurs.date, MSG);
  assert.equal(v('2026-10-30', true).ok, true);
  assert.equal(v('2026-09-30', true).erreurs.date, MSG);
  assert.equal(v('2026-12-30', true, '2027-01').ok, true);
  assert.equal(v('', true).erreurs.date, 'Choisis une date.');
  assert.equal(validerRevenu({ nom: 'B', montantTexte: '1', recurrent: true, jour: 5, mois: '2026-11' }).ok, true);
});

test('T2 reste à vivre', () => { assert.equal(resteAVivre({ revenusRecus: 85000, charges: 59500, depenses: 7000 }), 18500); });
test('T3 solde quotidien', () => {
  const j = joursRestants('2026-11-10', '2026-11-25'); assert.equal(j, 15); assert.equal(soldeQuotidien(18500, j), 1200);
});
test('T4 négatif', () => { assert.equal(soldeQuotidien(-2000, 15), 0); });
test('T5 aucune rentrée ce mois', () => {
  const p = prochaineRentree([rec('Bourse', 450, 5)], '2026-11-10');
  assert.deepEqual(p, { date: '2026-11-30', revenu: null }); assert.equal(joursRestants('2026-11-10', p.date), 20);
});
const demo = [rec('Bourse', 450, 5), rec('APL', 200, 25), rec('Job', 400, 30)];
test('prochaine rentrée = APL le 25', () => { assert.equal(prochaineRentree(demo, '2026-11-10').revenu.nom, 'APL'); });
test('strictement après aujourd\u2019hui', () => { assert.equal(prochaineRentree(demo, '2026-11-25').revenu.nom, 'Job'); });
test('D1b : moisSuivant ignoré', () => {
  const d = [rec('APL', 200, 25), rec('Job', 400, 30, { moisSuivant: true })];
  assert.deepEqual(prochaineRentree(d, '2026-11-26'), { date: '2026-11-30', revenu: null });
});
test('dernier jour du mois : 1 jour minimum', () => { assert.equal(joursRestants('2026-11-30', '2026-11-30'), 1); });
test('ponctuel futur du mois', () => { assert.equal(prochaineRentree([ponc('Prime', 50, '2026-11-18')], '2026-11-10').date, '2026-11-18'); });
test('accueil démo, job en mois suivant', () => {
  const revenus = [rec('Bourse', 450, 5), rec('APL', 200, 25), rec('Job', 400, 30, { moisSuivant: true })];
  const charges = [['T', 2500, 1], ['L', 56000, 3], ['F', 1000, 12]].map(([nom, montant, jour]) => creerCharge({ nom, montant, jour }, '2026-10'));
  const depenses = [{ montant: 7000, date: '2026-11-04', mois: '2026-11' }, { montant: 999, date: '2026-10-28', mois: '2026-10' }];
  const a = calculerAccueil({ revenus, charges, depenses, aujourdhui: '2026-11-10' });
  assert.equal(a.resteAVivre, 18500); assert.equal(a.soldeQuotidien, 1200); assert.equal(a.joursRestants, 15);
  assert.equal(a.prochaineRentree.revenu.nom, 'APL'); assert.equal(a.avertissement, false);
});
test('avertissement si négatif seulement (B3)', () => {
  assert.equal(calculerAccueil({ revenus: [], charges: [], depenses: [{ montant: 2000, date: '2026-11-02', mois: '2026-11' }], aujourdhui: '2026-11-10' }).avertissement, true);
  assert.equal(calculerAccueil({ revenus: [], charges: [], depenses: [], aujourdhui: '2026-11-10' }).avertissement, false);
});

test('calculerAccueil compte une dépense du mois sans champ mois', () => {
  const r = calculerAccueil({ revenus: [], charges: [], depenses: [{ montant: 2000, date: '2026-11-02' }, { montant: 500, date: '2026-10-02' }], aujourdhui: '2026-11-10' });
  assert.equal(r.depensesMois, 2000);
});
