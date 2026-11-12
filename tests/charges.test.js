import { test } from 'node:test';
import assert from 'node:assert/strict';
import { jourEffectif, creerCharge, montantCharge, chargesDuMois, modifierCharge, supprimerCharge, validerCharge } from '../js/domain/charges.js';

const loyer = { nom: 'Loyer CROUS', montant: 56000, jour: 3, actifDepuis: '2026-10', historique: [{ depuis: '2026-10', montant: 56000, jour: 3 }] };

test('T6 jour inexistant', () => { assert.equal(jourEffectif(31, '2027-02'), 28); assert.equal(jourEffectif(3, '2027-02'), 3); });
test('US3 report automatique', () => { assert.equal(montantCharge(loyer, '2026-11'), 56000); assert.equal(montantCharge(loyer, '2026-09'), 0); });
test('T7 modification au mois suivant', () => {
  const c = modifierCharge(loyer, { nom: 'Loyer CROUS', montant: 58000, jour: 3 }, '2026-11');
  assert.equal(montantCharge(c, '2026-11'), 56000); assert.equal(montantCharge(c, '2026-12'), 58000);
  assert.equal(montantCharge(c, '2026-10'), 56000); assert.equal(loyer.historique.length, 1);
  assert.equal(c.montant, 58000);
});
test('deux modifications dans le même mois', () => {
  const c = modifierCharge(modifierCharge(loyer, { nom: 'L', montant: 58000, jour: 3 }, '2026-11'), { nom: 'L', montant: 59000, jour: 3 }, '2026-11');
  assert.equal(c.historique.length, 2); assert.equal(montantCharge(c, '2026-12'), 59000);
  assert.equal(c.nom, 'L');
});
test('D6 correction le mois de création', () => {
  const neuve = creerCharge({ nom: 'Loyer', montant: 56000, jour: 3 }, '2026-11');
  const c = modifierCharge(neuve, { nom: 'Loyer', montant: 58000, jour: 3 }, '2026-11');
  assert.equal(montantCharge(c, '2026-11'), 58000); assert.equal(c.historique.length, 1);
});
test('D5 suppression', () => {
  const c = supprimerCharge(loyer, '2026-11');
  assert.equal(montantCharge(c, '2026-11'), 56000); assert.equal(montantCharge(c, '2026-12'), 0);
  assert.equal(loyer.actifJusqua, undefined);
});
test('total démo', () => {
  const ch = [['Transport', 2500, 1], ['Loyer CROUS', 56000, 3], ['Forfait', 1000, 12]].map(([nom, montant, jour]) => creerCharge({ nom, montant, jour }, '2026-10'));
  assert.equal(chargesDuMois(ch, '2026-11'), 59500);
});
test('validerCharge', () => {
  const ok = validerCharge({ nom: ' Loyer ', montantTexte: '560', jour: '3' });
  assert.equal(ok.ok, true); assert.deepEqual(ok.valeurs, { nom: 'Loyer', montant: 56000, jour: 3 });
  const ko = validerCharge({ nom: '', montantTexte: 'abc', jour: '32' });
  assert.equal(ko.ok, false);
  assert.equal(ko.erreurs.nom, 'Le nom est obligatoire.');
  assert.equal(ko.erreurs.jour, 'Choisis un jour entre 1 et 31.');
  assert.ok(ko.erreurs.montant);
  assert.equal(validerCharge({ nom: 'x'.repeat(41), montantTexte: '1', jour: 1 }).erreurs.nom, '40 caractères maximum.');
});
