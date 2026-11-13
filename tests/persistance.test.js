import test from 'node:test';
import assert from 'node:assert/strict';
import { doitDemanderPersistance } from '../js/domain/persistance.js';

test('déjà persistant : on ne demande rien', () => {
  assert.equal(doitDemanderPersistance({ dejaPersistant: true, demande: undefined, installe: true }), false);
  assert.equal(doitDemanderPersistance({ dejaPersistant: true, demande: { accorde: false }, installe: true }), false);
});

test('jamais demandé : on demande', () => {
  assert.equal(doitDemanderPersistance({ dejaPersistant: false, demande: undefined, installe: false }), true);
  assert.equal(doitDemanderPersistance({ dejaPersistant: undefined, demande: undefined, installe: false }), true);
});

test("refusé hors installation : pas de nouvelle demande tant que l'app n'est pas installée", () => {
  assert.equal(doitDemanderPersistance({ dejaPersistant: false, demande: { accorde: false, installe: false }, installe: false }), false);
});

test('refusé hors installation puis app installée : on redemande', () => {
  assert.equal(doitDemanderPersistance({ dejaPersistant: false, demande: { accorde: false, installe: false }, installe: true }), true);
  // ancien enregistrement sans le champ installe
  assert.equal(doitDemanderPersistance({ dejaPersistant: false, demande: { accorde: false }, installe: true }), true);
});

test('déjà redemandé en mode installé : pas à chaque lancement', () => {
  assert.equal(doitDemanderPersistance({ dejaPersistant: false, demande: { accorde: false, installe: true }, installe: true }), false);
});

test('accordé : on ne redemande pas', () => {
  assert.equal(doitDemanderPersistance({ dejaPersistant: undefined, demande: { accorde: true, installe: false }, installe: true }), false);
});
