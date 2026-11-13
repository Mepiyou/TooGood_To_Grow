import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES_PAR_DEFAUT, PALETTE, normaliserNom, validerCategorie, reaffecterDepenses, reaffecterResumes } from '../js/domain/categories.js';

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

test('T11 suppression de catégorie', () => {
  const deps = [1,2,3,4].map(i => ({ id: 'd'+i, categorieId: 'cafe', montant: 300, date: '2026-11-0'+i })).concat({ id: 'x', categorieId: 'courses', montant: 100, date: '2026-11-01' });
  const copie = JSON.parse(JSON.stringify(deps));
  const r = reaffecterDepenses(deps, 'cafe', 'X');
  assert.equal(r.length, 4); assert.ok(r.every(d => d.categorieId === 'autre' && d.modifieLe === 'X'));
  assert.deepEqual(deps, copie);
});

test('résumés réaffectés', () => {
  const entree = [{ mois: '2026-10', parCategorie: { cafe: 1200, autre: 300 } }];
  const [r] = reaffecterResumes(entree, 'cafe');
  assert.deepEqual(r.parCategorie, { autre: 1500 });
  assert.deepEqual(entree[0].parCategorie, { cafe: 1200, autre: 300 });
});

test('résumés : autre créé, résumé sans la catégorie ignoré', () => {
  const r = reaffecterResumes([{ mois: '2026-10', parCategorie: { cafe: 500 } }, { mois: '2026-09', parCategorie: { courses: 900 } }], 'cafe');
  assert.equal(r.length, 1);
  assert.deepEqual(r[0].parCategorie, { autre: 500 });
});
