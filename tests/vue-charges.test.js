import { test } from 'node:test';
import assert from 'node:assert/strict';
import { creerCharge, modifierCharge, supprimerCharge, chargesActives, entreeEnVigueur, prochainChangement } from '../js/domain/charges.js';
import { formatNomMois } from '../js/ui/format.js';
import { sousTitreCharge, libelleLigneCharge } from '../js/views/charges.js';

const espaces = (s) => s.replace(/[  ]/g, ' ');
const charge = (nom, montant, jour, mois = '2026-10') => ({ id: nom, ...creerCharge({ nom, montant, jour }, mois) });

test('formatNomMois : mois en toutes lettres, minuscules', () => {
  assert.equal(formatNomMois('2026-12'), 'décembre');
  assert.equal(formatNomMois('2027-01'), 'janvier');
});

test('entreeEnVigueur et prochainChangement', () => {
  const c = modifierCharge(charge('Loyer', 56000, 3), { nom: 'Loyer', montant: 58000, jour: 3 }, '2026-11');
  assert.equal(entreeEnVigueur(c, '2026-11').montant, 56000);
  assert.equal(entreeEnVigueur(c, '2026-09'), null);
  assert.deepEqual(prochainChangement(c, '2026-11'), { depuis: '2026-12', montant: 58000, jour: 3 });
  assert.equal(prochainChangement(c, '2026-12'), null);
  assert.equal(prochainChangement(supprimerCharge(c, '2026-11'), '2026-11'), null);
});

test('chargesActives : actives ce mois-ci, triées par jour puis nom', () => {
  const liste = [
    charge('Forfait', 1000, 12), charge('Transport', 2500, 1), charge('Loyer CROUS', 56000, 3),
    charge('Futur', 500, 2, '2026-12'),
    supprimerCharge(charge('Ancienne', 900, 5, '2026-09'), '2026-10'),
    supprimerCharge(charge('Gym', 2000, 3), '2026-11'),
  ];
  assert.deepEqual(chargesActives(liste, '2026-11').map((c) => c.nom), ['Transport', 'Gym', 'Loyer CROUS', 'Forfait']);
  assert.equal(liste[0].nom, 'Forfait');
});

test('sous-titre : jour, changement prévu, suppression', () => {
  const loyer = charge('Loyer CROUS', 56000, 3);
  assert.equal(sousTitreCharge(loyer, '2026-11'), 'le 3');
  const hausse = modifierCharge(loyer, { nom: 'Loyer CROUS', montant: 58000, jour: 3 }, '2026-11');
  assert.equal(espaces(sousTitreCharge(hausse, '2026-11')), 'le 3 · 580 € à partir de décembre');
  const jour = modifierCharge(loyer, { nom: 'Loyer CROUS', montant: 56000, jour: 5 }, '2026-11');
  assert.equal(sousTitreCharge(jour, '2026-11'), 'le 3 · le 5 à partir de décembre');
  const renomme = modifierCharge(loyer, { nom: 'Loyer', montant: 56000, jour: 3 }, '2026-11');
  assert.equal(sousTitreCharge(renomme, '2026-11'), 'le 3');
  assert.equal(sousTitreCharge(supprimerCharge(hausse, '2026-11'), '2026-11'), 'le 3 · supprimée à partir de décembre');
});

test('libellé accessible d\'une ligne de charge', () => {
  const loyer = charge('Loyer CROUS', 56000, 3);
  assert.equal(espaces(libelleLigneCharge(loyer, '2026-11')), 'Modifier : Loyer CROUS, 560 €, le 3');
  const hausse = modifierCharge(loyer, { nom: 'Loyer CROUS', montant: 58000, jour: 3 }, '2026-11');
  assert.equal(espaces(libelleLigneCharge(hausse, '2026-11')), 'Modifier : Loyer CROUS, 560 €, le 3, 580 € à partir de décembre');
});
