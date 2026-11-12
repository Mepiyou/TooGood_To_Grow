import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  formatMontant, formatMontantLu, formatSoldeQuotidien,
  formatDateLongue, formatJourMois, formatMois, majuscule,
} from '../js/ui/format.js';

const n = (s) => s.replace(/[  ]/g, ' ');

test('montants', () => {
  assert.equal(n(formatMontant(45000)), '450 €');
  assert.equal(n(formatMontant(1250)), '12,50 €');
  assert.equal(n(formatMontant(105000)), '1 050 €');
  assert.equal(n(formatMontant(705)), '7,05 €');
  assert.equal(n(formatMontant(0)), '0 €');
  assert.equal(n(formatMontant(-2050)), '-20,50 €');
});

test('montants lus', () => {
  assert.equal(formatMontantLu(1900), '19 euros');
  assert.equal(formatMontantLu(100), '1 euro');
  assert.equal(formatMontantLu(1250), '12 euros 50');
  assert.equal(formatMontantLu(-2000), 'moins 20 euros');
  assert.equal(formatMontantLu(0), '0 euro');
  assert.equal(formatMontantLu(705), '7 euros 5');
});

test('solde quotidien', () => {
  const r = formatSoldeQuotidien(1900);
  assert.deepEqual({ texte: n(r.texte), lu: r.lu }, { texte: '19 €/jour', lu: '19 euros par jour' });
});

test('dates', () => {
  assert.equal(formatDateLongue('2026-11-12'), 'jeudi 12 novembre 2026');
  assert.equal(formatJourMois('2026-11-25'), '25 nov.');
  assert.equal(formatMois('2026-10'), 'octobre 2026');
});

test('majuscule', () => {
  assert.equal(majuscule('octobre 2026'), 'Octobre 2026');
  assert.equal(majuscule(''), '');
});
