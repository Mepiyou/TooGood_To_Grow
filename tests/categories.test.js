import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES_PAR_DEFAUT, PALETTE, normaliserNom, validerCategorie } from '../js/domain/categories.js';

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

test('normaliserNom', () => {
  assert.equal(normaliserNom('  Café   Noir '), 'café noir');
});

test('nom de catégorie', () => {
  const cats = CATEGORIES_PAR_DEFAUT;
  assert.equal(validerCategorie({ nom: '  courses ', couleur: PALETTE[0] }, cats).message, 'Cette catégorie existe déjà.');
  assert.equal(validerCategorie({ nom: 'x'.repeat(31), couleur: PALETTE[0] }, cats).message, '30 caractères maximum.');
  assert.equal(validerCategorie({ nom: 'Café', couleur: '#000000' }, cats).message, 'Choisis une couleur.');
  assert.equal(validerCategorie({ nom: 'Café', couleur: PALETTE[0] }, cats), null);
  assert.equal(validerCategorie({ nom: 'Café', couleur: PALETTE[1] }, [...cats, { id: 'c1', nom: 'Café' }], 'c1'), null);
  assert.deepEqual(validerCategorie({ nom: '  ', couleur: PALETTE[0] }, cats), { champ: 'nom', message: 'Le nom est obligatoire.' });
  assert.equal(validerCategorie({ nom: 'Café', couleur: '#000000' }, cats).champ, 'couleur');
});
