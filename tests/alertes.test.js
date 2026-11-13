import test from 'node:test';
import assert from 'node:assert/strict';
import { calculerAlerte, depensesDesSeptDerniersJours, moisDesSeptDerniersJours } from '../js/domain/alertes.js';

test('T15 alerte', () => {
  assert.deepEqual(calculerAlerte({ resteAVivre: 12000, depenses7Jours: 8400, joursRestants: 15, aujourdhui: '2026-11-10', alerteVueLe: null }),
    { dateDecouvert: '2026-11-20', soldeConseille: 800 });
});
test('une alerte par jour', () => {
  assert.equal(calculerAlerte({ resteAVivre: 12000, depenses7Jours: 8400, joursRestants: 15, aujourdhui: '2026-11-10', alerteVueLe: '2026-11-10' }), null);
});
test('pas d’alerte si la projection est positive', () => {
  assert.equal(calculerAlerte({ resteAVivre: 30000, depenses7Jours: 8400, joursRestants: 15, aujourdhui: '2026-11-10', alerteVueLe: null }), null);
});
test('pas d’alerte sans dépense sur 7 jours', () => {
  assert.equal(calculerAlerte({ resteAVivre: 100, depenses7Jours: 0, joursRestants: 15, aujourdhui: '2026-11-10', alerteVueLe: null }), null);
});
test('alerte vue la veille : réapparaît le lendemain', () => {
  assert.notEqual(calculerAlerte({ resteAVivre: 12000, depenses7Jours: 8400, joursRestants: 15, aujourdhui: '2026-11-11', alerteVueLe: '2026-11-10' }), null);
});
test('moyenne sans arrondi intermédiaire', () => {
  // moyenne = 1000/7 c/j ; 1000 / (1000/7) = 7 jours exactement
  assert.deepEqual(calculerAlerte({ resteAVivre: 1000, depenses7Jours: 1000, joursRestants: 8, aujourdhui: '2026-11-10', alerteVueLe: null }),
    { dateDecouvert: '2026-11-17', soldeConseille: 100 });
});
test('déjà à découvert : la date de découvert est aujourd’hui, solde conseillé 0', () => {
  assert.deepEqual(calculerAlerte({ resteAVivre: -500, depenses7Jours: 700, joursRestants: 10, aujourdhui: '2026-11-10', alerteVueLe: null }),
    { dateDecouvert: '2026-11-10', soldeConseille: 0 });
});
test('joursRestants = 1', () => {
  assert.deepEqual(calculerAlerte({ resteAVivre: 500, depenses7Jours: 7000, joursRestants: 1, aujourdhui: '2026-11-10', alerteVueLe: null }),
    { dateDecouvert: '2026-11-10', soldeConseille: 500 });
});
test('calcul entier exact : 9/(9/7) ne retombe pas à 6,999…', () => {
  assert.deepEqual(calculerAlerte({ resteAVivre: 9, depenses7Jours: 9, joursRestants: 8, aujourdhui: '2026-11-10', alerteVueLe: null }),
    { dateDecouvert: '2026-11-17', soldeConseille: 0 });
});
test('depensesDesSeptDerniersJours : fenêtre de 7 jours, aujourd’hui inclus', () => {
  const d = (date, montant) => ({ date, montant });
  const depenses = [d('2026-11-03', 999), d('2026-11-04', 100), d('2026-11-10', 200), d('2026-11-11', 999)];
  assert.equal(depensesDesSeptDerniersJours(depenses, '2026-11-10'), 300);
  assert.equal(depensesDesSeptDerniersJours([], '2026-11-10'), 0);
});
test('D46 : solde de provision compté pour montant − reserve dans la moyenne des 7 jours', () => {
  const solde = { date: '2026-03-01', montant: 60000, provisionId: 'p', reserve: 45000 };
  const autre = { date: '2026-03-02', montant: 1000 };
  assert.equal(depensesDesSeptDerniersJours([solde, autre], '2026-03-03'), 16000);
  // Sans `reserve` (donnée ancienne ou importée) : montant entier.
  assert.equal(depensesDesSeptDerniersJours([{ date: '2026-03-01', montant: 600, provisionId: 'p' }], '2026-03-03'), 600);
});
test('D46 : mois à lire pour les 7 derniers jours (mois précédent du 1er au 6)', () => {
  assert.deepEqual(moisDesSeptDerniersJours('2026-11-10'), ['2026-11']);
  assert.deepEqual(moisDesSeptDerniersJours('2026-11-07'), ['2026-11']);
  assert.deepEqual(moisDesSeptDerniersJours('2026-11-06'), ['2026-10', '2026-11']);
  assert.deepEqual(moisDesSeptDerniersJours('2027-01-01'), ['2026-12', '2027-01']);
});
test('D46 : dépenses du mois précédent comptées en début de mois', () => {
  const depenses = [{ date: '2026-10-31', montant: 700 }, { date: '2026-10-26', montant: 999 }, { date: '2026-11-02', montant: 300 }];
  assert.equal(depensesDesSeptDerniersJours(depenses, '2026-11-02'), 1000);
});
