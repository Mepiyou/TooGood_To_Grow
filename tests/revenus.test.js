import test from 'node:test';
import assert from 'node:assert/strict';
import { revenusDuMois } from '../js/domain/budget.js';
import { centimesVersSaisie } from '../js/domain/montant.js';
import { sousTitreRevenu, libelleLigneRevenu } from '../js/views/revenus.js';

const rec = (nom, jour, extra = {}) => ({ id: nom, nom, montant: 1000, recurrent: true, jour, actifDepuis: '2026-11', moisSuivant: false, ...extra });
const ponc = (nom, date, extra = {}) => ({ id: nom, nom, montant: 1000, recurrent: false, date, actifDepuis: '2026-11', moisSuivant: false, ...extra });

test('revenusDuMois : récurrents par jour puis ponctuels du mois par date', () => {
  const liste = [ponc('P2', '2026-11-20'), rec('R25', 25), ponc('Autre', '2026-12-02'), rec('R5', 5), ponc('P1', '2026-11-03'), ponc('Vieux', '2026-10-15')];
  assert.deepEqual(revenusDuMois(liste, '2026-11').map((r) => r.nom), ['R5', 'R25', 'P1', 'P2']);
});

test('revenusDuMois : ponctuel « mois suivant » listé dans son mois et dans le mois qu\'il finance', () => {
  const job = ponc('Job', '2026-10-30', { moisSuivant: true });
  assert.deepEqual(revenusDuMois([job], '2026-10').map((r) => r.nom), ['Job']);
  assert.deepEqual(revenusDuMois([job], '2026-11').map((r) => r.nom), ['Job']);
  assert.deepEqual(revenusDuMois([job], '2026-12'), []);
});

test('revenusDuMois : même jour trié par nom, liste d\'origine intacte', () => {
  const liste = [rec('b', 5), rec('A', 5)];
  assert.deepEqual(revenusDuMois(liste, '2026-11').map((r) => r.nom), ['A', 'b']);
  assert.deepEqual(liste.map((r) => r.nom), ['b', 'A']);
});

test('centimesVersSaisie', () => {
  assert.equal(centimesVersSaisie(45000), '450');
  assert.equal(centimesVersSaisie(1250), '12,50');
  assert.equal(centimesVersSaisie(5), '0,05');
});

test('sous-titre d\'une ligne de revenu (D15)', () => {
  assert.equal(sousTitreRevenu(rec('Bourse', 5)), 'Récurrent · le 5');
  assert.equal(sousTitreRevenu(ponc('Prime', '2026-11-12')), 'Ponctuel · le 12 nov.');
  assert.equal(sousTitreRevenu(rec('Job', 30, { moisSuivant: true })), 'Récurrent · le 30 · compte le mois suivant');
});

test('libellé accessible d\'une ligne de revenu', () => {
  const espaces = (s) => s.replace(/[  ]/g, ' ');
  assert.equal(espaces(libelleLigneRevenu({ ...rec('Bourse', 5), montant: 45000 })), 'Modifier : Bourse, 450 €, récurrent, le 5');
  assert.equal(espaces(libelleLigneRevenu({ ...ponc('Prime', '2026-11-12'), montant: 1250, moisSuivant: true })), 'Modifier : Prime, 12,50 €, ponctuel, le 12 nov., compte le mois suivant');
});
