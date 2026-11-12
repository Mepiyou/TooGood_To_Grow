import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES_PAR_DEFAUT, PALETTE } from '../js/domain/categories.js';

test('5 catégories par défaut exactes', () => {
  assert.deepEqual(CATEGORIES_PAR_DEFAUT.map(c => [c.id, c.nom, c.couleur]), [
    ['courses','Courses','#0B6E4F'], ['transport','Transport','#2F6FB5'], ['sorties','Sorties','#7A5AA6'],
    ['plaisir','Plaisir','#D9822B'], ['autre','Autre','#9AA0A6']]);
  assert.ok(CATEGORIES_PAR_DEFAUT.every(c => c.parDefaut));
});

test('ordre de 0 à 4', () => {
  assert.deepEqual(CATEGORIES_PAR_DEFAUT.map(c => c.ordre), [0, 1, 2, 3, 4]);
});

test('palette de 6 couleurs', () => {
  assert.deepEqual(PALETTE, ['#B5446E','#0B6E4F','#2F6FB5','#D9822B','#7A5AA6','#9AA0A6']);
});
