import test from 'node:test';
import assert from 'node:assert/strict';
import { validerDateDepense, trierParDateDesc } from '../js/domain/depenses.js';

test('date de dépense', () => {
  assert.equal(validerDateDepense('2026-11-10', '2026-11-10', []), null);
  assert.equal(validerDateDepense('2026-11-11', '2026-11-10', []), 'La date ne peut pas être dans le futur.');
  assert.equal(validerDateDepense('2026-10-03', '2026-11-10', ['2026-10']), 'Le détail de ce mois a été supprimé.');
  assert.equal(validerDateDepense('2026-13-01', '2026-11-10', []), 'Date invalide.');
  assert.equal(validerDateDepense('2026-02-30', '2026-11-10', []), 'Date invalide.');
  assert.equal(validerDateDepense('', '2026-11-10', []), 'Date invalide.');
});

test('tri par date décroissante puis création décroissante, sans mutation', () => {
  const l = [
    { id: 'a', date: '2026-11-01', creeLe: 1 },
    { id: 'b', date: '2026-11-03', creeLe: 1 },
    { id: 'c', date: '2026-11-03', creeLe: 2 },
  ];
  const copie = [...l];
  assert.deepEqual(trierParDateDesc(l).map((d) => d.id), ['c', 'b', 'a']);
  assert.deepEqual(l, copie);
});
