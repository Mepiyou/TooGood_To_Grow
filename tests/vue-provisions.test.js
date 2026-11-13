import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lignesProvision, libelleLigneProvision, trierProvisions } from '../js/views/provisions.js';

const n = (s) => s.replace(/[  ]/g, ' ');
const assurance = { id: 'a', nom: 'Assurance', montantTotal: 60000, moisEcheance: '2027-03', debut: '2026-11' };

test('US8 : premier mois, part mensuelle sans « déjà de côté »', () => {
  assert.deepEqual(lignesProvision(assurance, '2026-11').map(n), ['600 € pour mars 2027', '150 €/mois réservés']);
});

test('US8 : mois suivants, montant déjà réservé', () => {
  assert.deepEqual(lignesProvision(assurance, '2027-01').map(n), ['600 € pour mars 2027', '150 €/mois réservés · déjà 300 € de côté']);
});

test('US8 : arrondi au centime supérieur (D35)', () => {
  const p = { id: 'b', nom: 'Ordi', montantTotal: 10000, moisEcheance: '2027-02', debut: '2026-11' };
  assert.deepEqual(lignesProvision(p, '2026-11').map(n), ['100 € pour février 2027', '33,34 €/mois réservés']);
});

test('libellé du bouton de modification', () => {
  assert.equal(n(libelleLigneProvision(assurance, '2027-01')),
    'Modifier : Assurance, 600 € pour mars 2027, 150 € par mois réservés, déjà 300 € de côté');
  assert.equal(n(libelleLigneProvision(assurance, '2026-11')), 'Modifier : Assurance, 600 € pour mars 2027, 150 € par mois réservés');
});

test('tri : échéance la plus proche d\'abord, puis nom', () => {
  const liste = [
    { ...assurance, id: '1', nom: 'Zèbre', moisEcheance: '2027-05' },
    { ...assurance, id: '2', nom: 'Bus', moisEcheance: '2027-03' },
    { ...assurance, id: '3', nom: 'Assurance', moisEcheance: '2027-03' },
  ];
  assert.deepEqual(trierProvisions(liste).map((p) => p.id), ['3', '2', '1']);
});
