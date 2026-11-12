import { test } from 'node:test';
import assert from 'node:assert/strict';
import { groupesParJour, totalDepenses } from '../js/domain/depenses.js';
import { formatJourSemaine } from '../js/ui/format.js';
import { libelleDepense, idAFocaliser } from '../js/views/depenses.js';

const espaces = (s) => s.replace(/[\u00a0\u202f]/g, ' ');
const dep = (id, date, montant, creeLe = '2026-11-01T10:00:00.000Z') => ({ id, date, montant, creeLe });

test('totalDepenses : somme en centimes, 0 si vide', () => {
  assert.equal(totalDepenses([]), 0);
  assert.equal(totalDepenses([dep('a', '2026-11-10', 1200), dep('b', '2026-11-09', 5800)]), 7000);
});

test('groupesParJour : un groupe par date décroissante, lignes triées', () => {
  const liste = [
    dep('a', '2026-11-09', 500),
    dep('b', '2026-11-10', 1200, '2026-11-10T08:00:00.000Z'),
    dep('c', '2026-11-10', 300, '2026-11-10T09:00:00.000Z'),
  ];
  const copie = JSON.stringify(liste);
  const groupes = groupesParJour(liste);
  assert.equal(JSON.stringify(liste), copie);
  assert.deepEqual(groupes.map((g) => g.date), ['2026-11-10', '2026-11-09']);
  assert.deepEqual(groupes[0].depenses.map((d) => d.id), ['c', 'b']);
  assert.deepEqual(groupesParJour([]), []);
});

test('formatJourSemaine : sans l\'année', () => {
  assert.equal(formatJourSemaine('2026-11-10'), 'mardi 10 novembre');
  assert.equal(formatJourSemaine('2026-11-01'), 'dimanche 1 novembre');
});

test('libellé accessible d\'une dépense', () => {
  assert.equal(espaces(libelleDepense('Courses', 1200)), 'Courses, 12 €');
});

test('idAFocaliser : la ligne suivante, sinon la précédente, sinon null', () => {
  const ids = ['a', 'b', 'c'];
  assert.equal(idAFocaliser(ids, 'a'), 'b');
  assert.equal(idAFocaliser(ids, 'b'), 'c');
  assert.equal(idAFocaliser(ids, 'c'), 'b');
  assert.equal(idAFocaliser(['a'], 'a'), null);
});
