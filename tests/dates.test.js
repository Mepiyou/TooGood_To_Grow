import test from 'node:test';
import assert from 'node:assert/strict';
import {
  joursDansMois, moisDe, jourDe, moisSuivant, moisPrecedent, construireDate,
  dernierJourDuMois, ajouterJours, ecartJours, moisEntre, comparer, versISO, moisAChange, dateAJour,
} from '../js/domain/dates.js';

test('joursDansMois', () => {
  assert.equal(joursDansMois('2027-02'), 28); assert.equal(joursDansMois('2028-02'), 29);
  assert.equal(joursDansMois('2026-11'), 30); assert.equal(joursDansMois('2026-12'), 31);
});
test('moisDe / jourDe', () => { assert.equal(moisDe('2026-11-10'), '2026-11'); assert.equal(jourDe('2026-11-05'), 5); });
test('mois suivant / précédent passent l’année', () => {
  assert.equal(moisSuivant('2026-12'), '2027-01'); assert.equal(moisPrecedent('2027-01'), '2026-12');
});
test('construireDate / dernierJourDuMois', () => {
  assert.equal(construireDate('2026-11', 5), '2026-11-05'); assert.equal(dernierJourDuMois('2027-02'), '2027-02-28');
});
test('ajouterJours / ecartJours', () => {
  assert.equal(ajouterJours('2026-11-10', 10), '2026-11-20'); assert.equal(ajouterJours('2026-12-31', 1), '2027-01-01');
  assert.equal(ecartJours('2026-11-10', '2026-11-25'), 15); assert.equal(ecartJours('2026-03-28', '2026-03-30'), 2); // passage à l'heure d'été
});
test('moisEntre', () => { assert.equal(moisEntre('2026-11', '2027-03'), 4); assert.equal(moisEntre('2027-03', '2027-03'), 0); });
test('comparer', () => {
  assert.ok(comparer('2026-11-10', '2026-11-11') < 0); assert.ok(comparer('2027-01-01', '2026-12-31') > 0);
  assert.equal(comparer('2026-11-10', '2026-11-10'), 0);
});
test('versISO utilise la date locale', () => { assert.equal(versISO(new Date(2026, 10, 12, 23, 30)), '2026-11-12'); });

test('moisAChange : vrai quand le mois du jour n’est plus le mois affiché', () => {
  assert.equal(moisAChange('2026-11', '2026-11-30'), false);
  assert.equal(moisAChange('2026-11', '2026-12-01'), true);
  assert.equal(moisAChange('2026-12', '2027-01-01'), true);
});

test('dateAJour : suit le jour si le champ n\'a pas été modifié, sinon laisse la saisie', () => {
  assert.equal(dateAJour({ valeurChamp: '2026-11-12', ancienneDate: '2026-11-12', nouvelleDate: '2026-11-13' }), '2026-11-13');
  assert.equal(dateAJour({ valeurChamp: '2026-11-10', ancienneDate: '2026-11-12', nouvelleDate: '2026-11-13' }), '2026-11-10');
  assert.equal(dateAJour({ valeurChamp: '', ancienneDate: '2026-11-12', nouvelleDate: '2026-11-13' }), '');
  assert.equal(dateAJour({ valeurChamp: '2026-11-12', ancienneDate: '2026-11-12', nouvelleDate: '2026-11-12' }), '2026-11-12');
});
