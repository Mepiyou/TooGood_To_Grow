import test from 'node:test';
import assert from 'node:assert/strict';
import { calculerAlerte, depensesDesSeptDerniersJours } from '../js/domain/alertes.js';

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
