import test from 'node:test';
import assert from 'node:assert/strict';
import { construireExport, nomFichierExport, validerImport } from '../js/domain/import.js';

const vide = { revenus: [], charges: [], depenses: [], categories: [], resumes: [], enveloppes: [], provisions: [] };
const PAS_UNE_SAUVEGARDE = "Ce fichier n'est pas une sauvegarde TooGood To Grow.";

test('T13 import invalide', () => {
  assert.equal(validerImport({ schemaVersion: 1, donnees: vide }).ok, false);
  assert.equal(validerImport({ app: 'toogood', schemaVersion: 2, donnees: vide }).erreur, 'Version de sauvegarde non prise en charge.');
  assert.equal(validerImport({ app: 'toogood', schemaVersion: 1, donnees: { ...vide, depenses: [{ id: 'a', montant: 12.5, date: '2026-11-01' }] } }).erreur, 'Fichier incomplet ou corrompu.');
  assert.equal(validerImport(null).ok, false);
});

test('valeurs non objet', () => {
  for (const v of [null, 'texte', [], 3, undefined]) assert.equal(validerImport(v).erreur, PAS_UNE_SAUVEGARDE);
  assert.equal(validerImport({ schemaVersion: 1, donnees: vide }).erreur, PAS_UNE_SAUVEGARDE);
});

test('contrôles de contenu', () => {
  const base = { app: 'toogood', schemaVersion: 1 };
  const erreur = (donnees) => validerImport({ ...base, donnees }).erreur;
  const KO = 'Fichier incomplet ou corrompu.';
  assert.equal(erreur(undefined), KO);
  assert.equal(erreur({ ...vide, charges: 'x' }), KO);
  const { provisions, ...sans } = vide;
  assert.equal(erreur(sans), KO);
  assert.equal(erreur({ ...vide, depenses: [{ id: '', montant: 100, date: '2026-11-01' }] }), KO);
  assert.equal(erreur({ ...vide, depenses: [{ id: 'a', montant: 0, date: '2026-11-01' }] }), KO);
  assert.equal(erreur({ ...vide, depenses: [{ id: 'a', montant: 100, date: '2026-02-30' }] }), KO);
  assert.equal(erreur({ ...vide, categories: [{ id: 'c' }] }), KO);
  assert.equal(erreur({ ...vide, categories: [{ nom: 'C' }] }), KO);
});

test('revenus et charges : id et montant entier > 0 exigés', () => {
  const base = { app: 'toogood', schemaVersion: 1 };
  const erreur = (donnees) => validerImport({ ...base, donnees }).erreur;
  const KO = 'Fichier incomplet ou corrompu.';
  for (const champ of ['revenus', 'charges']) {
    assert.equal(erreur({ ...vide, [champ]: [{ montant: 100 }] }), KO);
    assert.equal(erreur({ ...vide, [champ]: [{ id: '', montant: 100 }] }), KO);
    assert.equal(erreur({ ...vide, [champ]: [{ id: 'a', montant: 0 }] }), KO);
    assert.equal(erreur({ ...vide, [champ]: [{ id: 'a', montant: 10.5 }] }), KO);
    assert.equal(erreur({ ...vide, [champ]: [{ id: 'a' }] }), KO);
    assert.equal(erreur({ ...vide, [champ]: [null] }), KO);
    assert.equal(erreur({ ...vide, [champ]: [{ id: 'a', montant: 100 }] }), undefined);
  }
});

test('import valide : tableaux renvoyés tels quels', () => {
  const donnees = { ...vide, depenses: [{ id: 'a', montant: 100, date: '2026-11-01' }], categories: [{ id: 'c', nom: 'Café' }] };
  const r = validerImport({ app: 'toogood', schemaVersion: 1, donnees });
  assert.equal(r.ok, true);
  assert.equal(r.donnees.depenses, donnees.depenses);
});

test('aller-retour export → import', () => {
  const e = construireExport(vide, { maintenant: '2026-11-12T10:15:00' });
  assert.equal(e.app, 'toogood'); assert.equal(e.perimetre, 'tout'); assert.equal(validerImport(e).ok, true);
  assert.equal(e.exporteLe, '2026-11-12T10:15:00'); assert.equal(e.schemaVersion, 1);
  assert.equal(nomFichierExport('2026-11-12'), 'toogood-2026-11-12.json'); assert.equal(nomFichierExport('2026-11-12', '2026-10'), 'toogood-2026-10.json');
});

test('export : 7 tableaux toujours présents', () => {
  const e = construireExport({ depenses: [{ id: 'a' }] }, { maintenant: 'M', perimetre: '2026-10' });
  assert.deepEqual(Object.keys(e.donnees), ['revenus', 'charges', 'depenses', 'categories', 'resumes', 'enveloppes', 'provisions']);
  assert.deepEqual(e.donnees.depenses, [{ id: 'a' }]); assert.deepEqual(e.donnees.revenus, []);
  assert.equal(e.perimetre, '2026-10');
});
