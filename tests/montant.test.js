import test from 'node:test';
import assert from 'node:assert/strict';
import { parseMontant } from '../js/domain/montant.js';

test('T12 refusés', () => {
  for (const s of ['0', '-5', '12,345', 'abc', '', '12,', '1e3', '0,00'])
    assert.equal(parseMontant(s).ok, false, s);
  assert.equal(parseMontant('12,345').erreur, 'Deux décimales maximum.');
  assert.equal(parseMontant('-5').erreur, 'Le montant doit être supérieur à 0 €.');
});

test('acceptés', () => {
  const c = s => parseMontant(s).centimes;
  assert.equal(c('12'), 1200); assert.equal(c('12,5'), 1250); assert.equal(c('12.50'), 1250);
  assert.equal(c(' 7,05 '), 705); assert.equal(c('0,1'), 10); assert.equal(c('1 000'), 100000); assert.equal(c('0.29'), 29);
  assert.equal(c('1 000'), 100000);
});

test('messages selon la cause', () => {
  const e = s => parseMontant(s).erreur;
  assert.equal(e(''), 'Saisis un montant.');
  assert.equal(e('    '), 'Saisis un montant.');
  assert.equal(e('0,00'), 'Le montant doit être supérieur à 0 €.');
  assert.equal(e('0'), 'Le montant doit être supérieur à 0 €.');
  assert.equal(e('12,'), 'Montant invalide.');
  assert.equal(e('1e3'), 'Montant invalide.');
  assert.equal(e('abc'), 'Montant invalide.');
});

test('plafond 99 999 999 centimes inclus', () => {
  assert.equal(parseMontant('999999,99').centimes, 99999999);
  assert.equal(parseMontant('1000000').ok, false);
  assert.equal(parseMontant('1000000').erreur, 'Montant invalide.');
  assert.equal(parseMontant('999999,991').erreur, 'Deux décimales maximum.');
});
