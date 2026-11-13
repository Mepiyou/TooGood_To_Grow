import test from 'node:test';
import assert from 'node:assert/strict';
import {
  partMensuelle, dejaReserve, partDuMois, provisionsDuMois, validerProvision, provisionsAEcheance, planSoldeProvision,
} from '../js/domain/provisions.js';

test('T14 provision', () => { assert.equal(partMensuelle({ montantTotal: 60000, moisEcheance: '2027-03' }, '2026-11'), 15000); });
test('arrondi au supérieur, minimum 1 mois', () => {
  assert.equal(partMensuelle({ montantTotal: 100000, moisEcheance: '2027-02' }, '2026-11'), 33334);
  assert.equal(partMensuelle({ montantTotal: 60000, moisEcheance: '2026-11' }, '2026-11'), 60000);
});
test('T14 : part de novembre via partDuMois', () => {
  const p = { montantTotal: 60000, debut: '2026-11', moisEcheance: '2027-03' };
  assert.equal(partDuMois(p, '2026-11'), 15000);
});
test('enchaînement sur 4 mois : somme = montant total', () => {
  const p = { montantTotal: 60000, debut: '2026-11', moisEcheance: '2027-03' };
  const parts = ['2026-11', '2026-12', '2027-01', '2027-02'].map((m) => partDuMois(p, m));
  assert.deepEqual(parts, [15000, 15000, 15000, 15000]);
  assert.equal(parts.reduce((a, b) => a + b, 0), 60000);
});
test('le ceil ne provoque pas de dépassement (100000 sur 3 mois)', () => {
  const p = { montantTotal: 100000, debut: '2026-11', moisEcheance: '2027-02' };
  const parts = ['2026-11', '2026-12', '2027-01'].map((m) => partDuMois(p, m));
  assert.deepEqual(parts, [33334, 33333, 33333]);
  assert.equal(parts.reduce((a, b) => a + b, 0), 100000);
});
test('dejaReserve : 0 au début, montant total à l’échéance', () => {
  const p = { montantTotal: 100000, debut: '2026-11', moisEcheance: '2027-02' };
  assert.equal(dejaReserve(p, '2026-11'), 0);
  assert.equal(dejaReserve(p, '2026-10'), 0);
  assert.equal(dejaReserve(p, '2026-12'), 33334);
  assert.equal(dejaReserve(p, '2027-02'), 100000);
});
test('partDuMois : 0 avant debut et à partir de moisEcheance', () => {
  const p = { montantTotal: 60000, debut: '2026-11', moisEcheance: '2027-03' };
  assert.equal(partDuMois(p, '2026-10'), 0);
  assert.equal(partDuMois(p, '2027-03'), 0);
  assert.equal(partDuMois(p, '2027-04'), 0);
});
test('provisionsDuMois : somme des parts', () => {
  const a = { montantTotal: 60000, debut: '2026-11', moisEcheance: '2027-03' };
  const b = { montantTotal: 100000, debut: '2026-11', moisEcheance: '2027-02' };
  const c = { montantTotal: 5000, debut: '2027-01', moisEcheance: '2027-02' };
  assert.equal(provisionsDuMois([a, b, c], '2026-11'), 15000 + 33334);
  assert.equal(provisionsDuMois([a, b, c], '2027-01'), 15000 + 33333 + 5000);
  assert.equal(provisionsDuMois([], '2026-11'), 0);
});

test('validerProvision : valeurs', () => {
  const r = validerProvision({ nom: ' Assurance auto ', montantTexte: '600', moisEcheance: '2027-03' }, '2026-11');
  assert.equal(r.ok, true);
  assert.deepEqual(r.erreurs, {});
  assert.deepEqual(r.valeurs, { nom: 'Assurance auto', montantTotal: 60000, moisEcheance: '2027-03' });
});

test('validerProvision : erreurs', () => {
  const ECHEANCE = "Choisis un mois d'échéance après ce mois-ci.";
  const r = validerProvision({ nom: '', montantTexte: 'abc', moisEcheance: '2026-11' }, '2026-11');
  assert.equal(r.ok, false);
  assert.deepEqual(r.erreurs, { nom: 'Le nom est obligatoire.', montant: 'Montant invalide.', moisEcheance: ECHEANCE });
  const ok = { nom: 'A', montantTexte: '10' };
  for (const moisEcheance of ['2026-10', '', undefined, '2027-13', '2027-3', '2027-03-01']) {
    assert.equal(validerProvision({ ...ok, moisEcheance }, '2026-11').erreurs.moisEcheance, ECHEANCE);
  }
  assert.equal(validerProvision({ ...ok, moisEcheance: '2026-12' }, '2026-11').ok, true);
  assert.equal(validerProvision({ nom: 'x'.repeat(41), montantTexte: '1', moisEcheance: '2026-12' }, '2026-11').erreurs.nom, '40 caractères maximum.');
});

test('provisionsAEcheance', () => {
  const a = { id: 'a', moisEcheance: '2026-11' };
  const b = { id: 'b', moisEcheance: '2026-10' };
  const c = { id: 'c', moisEcheance: '2026-12' };
  assert.deepEqual(provisionsAEcheance([a, b, c], '2026-11'), [a, b]);
  assert.deepEqual(provisionsAEcheance([], '2026-11'), []);
});

test('D34 D44 planSoldeProvision', () => {
  const p = { id: 'p1', nom: 'Assurance auto', montantTotal: 100000, debut: '2026-11', moisEcheance: '2027-02' };
  assert.deepEqual(planSoldeProvision(p, '2027-02-03T08:00:00.000Z'), {
    provisionId: 'p1',
    depense: {
      montant: 100000,
      categorieId: 'autre',
      note: 'Provision : Assurance auto',
      date: '2027-02-01',
      mois: '2027-02',
      provisionId: 'p1',
      reserve: 100000,
      creeLe: '2027-02-03T08:00:00.000Z',
    },
  });
});

test('planSoldeProvision : reserve = déjà réservé à l’échéance (provision importée tardivement)', () => {
  const p = { id: 'p2', nom: 'X', montantTotal: 30000, debut: '2027-02', moisEcheance: '2027-02' };
  assert.equal(planSoldeProvision(p, 'T').depense.reserve, 0);
});
