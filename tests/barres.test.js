import { test } from 'node:test';
import assert from 'node:assert/strict';
import { hauteursBarres, libelleBarres, rendreBarres } from '../js/ui/barres.js';
import { formatEspace, formatMoisCourt, formatMois } from '../js/ui/format.js';
import { lignesHistorique } from '../js/domain/resume.js';
import { libelleLigne } from '../js/views/historique.js';

const espaces = (s) => s.replace(/[\u00a0\u202f]/g, ' ');
const totaux = [
  { mois: '2026-06', total: null, courant: false },
  { mois: '2026-07', total: 5000, courant: false },
  { mois: '2026-08', total: 0, courant: false },
  { mois: '2026-09', total: 10000, courant: false },
  { mois: '2026-10', total: 2500, courant: false },
  { mois: '2026-11', total: 7000, courant: true },
];
const libelles = totaux.map((t) => ({ court: formatMoisCourt(t.mois), long: formatMois(t.mois) }));

test('hauteurs en % du maximum, null et 0 à 0, max 0 → tout à 0', () => {
  assert.deepEqual(hauteursBarres(totaux), [0, 50, 0, 100, 25, 70]);
  assert.deepEqual(hauteursBarres(totaux.map((t) => ({ ...t, total: 0 }))), [0, 0, 0, 0, 0, 0]);
  assert.deepEqual(hauteursBarres(totaux.map((t) => ({ ...t, total: null }))), [0, 0, 0, 0, 0, 0]);
});

test('libellé : mois, valeurs et « aucune donnée »', () => {
  const l = espaces(libelleBarres(totaux, libelles));
  assert.ok(l.startsWith('Dépenses des 6 derniers mois : juin 2026 : aucune donnée, juillet 2026 : 50 €, août 2026 : 0 €,'));
  assert.ok(l.endsWith('novembre 2026 : 70 €.'));
});

test('rendu : 6 colonnes, courant en accent, valeurs, axe, role img', () => {
  const h = rendreBarres(totaux, libelles);
  assert.equal((h.match(/class="barre-col/g) || []).length, 6);
  assert.equal((h.match(/barre-courante/g) || []).length, 1);
  assert.match(h, /role="img"/);
  assert.match(h, /aria-label="Dépenses des 6 derniers mois/);
  assert.match(h, /height:70%/);
  assert.ok(h.includes('—'));
  assert.ok(h.includes('juil.'));
  assert.match(h, /barres-axe/);
});

test('formatEspace', () => {
  assert.equal(formatEspace(58 * 1024), 'Espace utilisé : 58 Ko sur ce téléphone');
  assert.equal(formatEspace(100), 'Espace utilisé : 1 Ko sur ce téléphone');
  assert.equal(espaces(formatEspace(1024 * 1024 * 2.5)), 'Espace utilisé : 2,5 Mo sur ce téléphone');
  assert.equal(formatEspace(1024 * 1024 + 1), 'Espace utilisé : 1 Mo sur ce téléphone');
  for (const v of [undefined, null, NaN, -1, 'x']) assert.equal(formatEspace(v), 'Espace utilisé : inconnu');
});

test('lignesHistorique : plus récent d’abord, détail supprimé, courant non supprimable', () => {
  const stats = [{ mois: '2026-11', nbDepenses: 3, taille: 600 }, { mois: '2026-10', nbDepenses: 23, taille: 4096 }];
  const resumes = [{ mois: '2026-10', total: 1 }, { mois: '2026-09', total: 2, detailSupprime: true }];
  const l = lignesHistorique(stats, resumes, '2026-11');
  assert.deepEqual(l.map((x) => x.mois), ['2026-11', '2026-10', '2026-09']);
  assert.deepEqual(l.map((x) => x.supprimable), [false, true, true]);
  assert.deepEqual(l.map((x) => x.detailSupprime), [false, false, true]);
  assert.equal(l[1].nbDepenses, 23);
  assert.equal(l[1].taille, 4096);
});

test('libelleLigne : taille affichée seulement si > 0', () => {
  assert.equal(espaces(libelleLigne({ mois: '2026-10', nbDepenses: 3, taille: 4096, detailSupprime: false })), 'octobre 2026 · 3 dépenses · environ 4 Ko');
  assert.equal(espaces(libelleLigne({ mois: '2026-10', nbDepenses: 0, taille: 0, detailSupprime: false })), 'octobre 2026 · 0 dépense');
  assert.equal(espaces(libelleLigne({ mois: '2026-10', nbDepenses: 0, taille: 0, detailSupprime: true })), 'octobre 2026 · totaux conservés');
});
