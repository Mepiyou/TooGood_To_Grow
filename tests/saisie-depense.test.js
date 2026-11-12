import test from 'node:test';
import assert from 'node:assert/strict';
import { CATEGORIES_PAR_DEFAUT, PALETTE, trierCategories, categorieDeRepli, prochainOrdre } from '../js/domain/categories.js';
import { validerDepense, construireDepense, moisDetailSupprime } from '../js/domain/depenses.js';
import { rendreBoutonCategorie } from '../js/views/ajout.js';
import { NOMS_COULEURS } from '../js/ui/form-categorie.js';

const cafe = { id: 'c1', nom: 'Café', couleur: '#B5446E', parDefaut: false, ordre: 6 };
const livres = { id: 'c2', nom: 'Livres', couleur: '#2F6FB5', parDefaut: false, ordre: 5 };

test('ordre d\'affichage : catégories par défaut (par ordre) puis créées (par ordre), sans mutation', () => {
  const melange = [cafe, CATEGORIES_PAR_DEFAUT[4], livres, ...CATEGORIES_PAR_DEFAUT.slice(0, 4).reverse()];
  const copie = [...melange];
  assert.deepEqual(trierCategories(melange).map((c) => c.id), ['courses', 'transport', 'sorties', 'plaisir', 'autre', 'c2', 'c1']);
  assert.deepEqual(melange, copie);
});

test('catégorie de repli : « Autre » si la catégorie n\'existe plus', () => {
  const categories = [...CATEGORIES_PAR_DEFAUT, cafe];
  assert.equal(categorieDeRepli('c1', categories), 'c1');
  assert.equal(categorieDeRepli('supprimee', categories), 'autre');
  assert.equal(categorieDeRepli(undefined, categories), 'autre');
});

test('ordre d\'une nouvelle catégorie : max + 1', () => {
  assert.equal(prochainOrdre([...CATEGORIES_PAR_DEFAUT, cafe, livres]), 7);
  assert.equal(prochainOrdre(CATEGORIES_PAR_DEFAUT), 5);
  assert.equal(prochainOrdre([]), 0);
});

test('mois dont le détail a été supprimé', () => {
  const resumes = [
    { mois: '2026-08', detailSupprime: true },
    { mois: '2026-09', detailSupprime: false },
    { mois: '2026-10' },
  ];
  assert.deepEqual(moisDetailSupprime(resumes), ['2026-08']);
  assert.deepEqual(moisDetailSupprime([]), []);
});

const contexte = { aujourdhui: '2026-11-12', moisDetailSupprime: ['2026-08'], categories: CATEGORIES_PAR_DEFAUT };

test('saisie valide : 12, Courses, date du jour', () => {
  const r = validerDepense({ montantTexte: '12', categorieId: 'courses', date: '2026-11-12' }, contexte);
  assert.deepEqual(r, { ok: true, erreurs: {}, valeurs: { montant: 1200, categorieId: 'courses', date: '2026-11-12' } });
});

test('saisie : une erreur par champ', () => {
  const r = validerDepense({ montantTexte: '', categorieId: null, date: '2026-11-13' }, contexte);
  assert.equal(r.ok, false);
  assert.deepEqual(r.erreurs, { montant: 'Saisis un montant.', categorie: 'Choisis une catégorie.', date: 'La date ne peut pas être dans le futur.' });
});

test('saisie : catégorie inconnue refusée, mois supprimé refusé', () => {
  const r = validerDepense({ montantTexte: '3,5', categorieId: 'inconnue', date: '2026-08-02' }, contexte);
  assert.deepEqual(r.erreurs, { categorie: 'Choisis une catégorie.', date: 'Le détail de ce mois a été supprimé.' });
});

test('construction d\'une nouvelle dépense : mois dérivé, creeLe = modifieLe', () => {
  const d = construireDepense({ id: 'd1', montant: 1200, categorieId: 'courses', date: '2026-11-12' }, undefined, '2026-11-12T08:00:00.000Z');
  assert.deepEqual(d, {
    id: 'd1', montant: 1200, categorieId: 'courses', date: '2026-11-12', mois: '2026-11',
    creeLe: '2026-11-12T08:00:00.000Z', modifieLe: '2026-11-12T08:00:00.000Z',
  });
});

test('construction en modification : creeLe et note conservés, mois recalculé', () => {
  const existant = {
    id: 'd1', montant: 1200, categorieId: 'courses', date: '2026-11-12', mois: '2026-11', note: 'marché',
    creeLe: '2026-11-12T08:00:00.000Z', modifieLe: '2026-11-12T08:00:00.000Z',
  };
  const d = construireDepense({ id: 'd1', montant: 950, categorieId: 'sorties', date: '2026-10-31' }, existant, '2026-11-13T09:00:00.000Z');
  assert.deepEqual(d, {
    id: 'd1', montant: 950, categorieId: 'sorties', date: '2026-10-31', mois: '2026-10', note: 'marché',
    creeLe: '2026-11-12T08:00:00.000Z', modifieLe: '2026-11-13T09:00:00.000Z',
  });
});

test('bouton de catégorie : nom échappé, aria-pressed, couleur non hexadécimale neutralisée', () => {
  const html = rendreBoutonCategorie({ id: 'x"1', nom: '<b>Café</b>', couleur: 'red;background:url(x)' }, true);
  assert.match(html, /aria-pressed="true"/);
  assert.match(html, /data-id="x&quot;1"/);
  assert.match(html, /&lt;b&gt;Café&lt;\/b&gt;/);
  assert.match(html, /background:#9AA0A6/);
  assert.match(rendreBoutonCategorie(CATEGORIES_PAR_DEFAUT[0], false), /aria-pressed="false".*background:#0B6E4F.*Courses/);
});

test('noms des 6 couleurs dans l\'ordre de la palette', () => {
  assert.deepEqual(NOMS_COULEURS, ['Framboise', 'Vert', 'Bleu', 'Orange', 'Violet', 'Gris']);
  assert.equal(NOMS_COULEURS.length, PALETTE.length);
});
