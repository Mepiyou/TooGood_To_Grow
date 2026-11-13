import { test } from 'node:test';
import assert from 'node:assert/strict';
import { moisSupprimable } from '../js/domain/resume.js';
import { messageSuppression, libelleRecap } from '../js/views/supprimer-mois.js';

const espaces = (s) => s.replace(/[  ]/g, ' ');

test('moisSupprimable : AAAA-MM réel et strictement passé', () => {
  assert.equal(moisSupprimable('2026-10', '2026-11'), true);
  assert.equal(moisSupprimable('2025-01', '2026-11'), true);
  assert.equal(moisSupprimable('2026-11', '2026-11'), false);
  assert.equal(moisSupprimable('2026-12', '2026-11'), false);
  for (const m of ['2026-13', '2026-00', '2026-1', '26-10', 'abc', '', '2026-10-01', ' 2026-10', undefined, null, 202610]) {
    assert.equal(moisSupprimable(m, '2026-11'), false, String(m));
  }
});

test('messageSuppression : majuscule au mois, taille libérée', () => {
  assert.equal(espaces(messageSuppression('2026-10', 4096)), 'Octobre 2026 supprimé — 4 Ko libérés');
  assert.equal(espaces(messageSuppression('2026-10', 0)), 'Octobre 2026 supprimé');
});

test('libelleRecap : détail présent ou déjà supprimé', () => {
  assert.equal(espaces(libelleRecap({ nbDepenses: 23, total: 31200, taille: 4096, detailSupprime: false })), '23 dépenses · 312 € · environ 4 Ko');
  assert.equal(espaces(libelleRecap({ nbDepenses: 1, total: 500, taille: 100, detailSupprime: false })), '1 dépense · 5 € · environ 1 Ko');
  assert.equal(espaces(libelleRecap({ nbDepenses: 0, total: 31200, taille: 0, detailSupprime: true })), 'Détail déjà supprimé · 312 €');
});
