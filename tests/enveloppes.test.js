import test from 'node:test';
import assert from 'node:assert/strict';
import {
  validerEnveloppe, epargneDuMois, restantPlaisir, depassementPlaisir, totalCumuleDepuisResumes, totauxCumules,
} from '../js/domain/enveloppes.js';

const bourse = { id: 'bourse', nom: 'Bourse', montant: 45000, recurrent: true, jour: 5, moisSuivant: false, actifDepuis: '2026-10' };
const apl = { id: 'apl', nom: 'APL', montant: 20000, recurrent: true, jour: 25, moisSuivant: false, actifDepuis: '2026-10' };
const epargne = (id, euros, extra = {}) => ({
  id, type: 'epargne', nom: id, montantMensuel: euros * 100, revenuSourceId: 'bourse', totalCumule: 0, suspendue: false, actifDepuis: '2026-10', ...extra,
});
const plaisir = (euros, extra = {}) => ({ id: 'p', type: 'plaisir', nom: 'Plaisir', montantMensuel: euros * 100, suspendue: false, actifDepuis: '2026-10', ...extra });
const dep = (euros, categorieId, extra = {}) => ({ id: `${euros}-${categorieId}`, montant: euros * 100, categorieId, date: '2026-11-10', mois: '2026-11', ...extra });

// formatMontant sépare le montant et « € » par une espace insécable.
const n = (s) => s?.replace(/[\u00a0\u202f]/g, ' ');
const ctx = (extra = {}) => ({ enveloppes: [], idEnCours: null, resteAVivre: 18500, ...extra });

test('validerEnveloppe : épargne valide', () => {
  const r = validerEnveloppe({ type: 'epargne', nom: ' Vacances ', montantTexte: '50', revenuSourceId: 'bourse' }, ctx());
  assert.equal(r.ok, true);
  assert.deepEqual(r.erreurs, {});
  assert.deepEqual(r.valeurs, { type: 'epargne', nom: 'Vacances', montantMensuel: 5000, revenuSourceId: 'bourse' });
});

test('validerEnveloppe : plaisir valide, sans revenu source', () => {
  const r = validerEnveloppe({ type: 'plaisir', nom: 'Sorties', montantTexte: '60', revenuSourceId: 'bourse' }, ctx());
  assert.equal(r.ok, true);
  assert.deepEqual(r.valeurs, { type: 'plaisir', nom: 'Sorties', montantMensuel: 6000 });
});

test('validerEnveloppe : nom, montant et revenu source', () => {
  const r = validerEnveloppe({ type: 'epargne', nom: '  ', montantTexte: '0', revenuSourceId: '' }, ctx());
  assert.equal(r.ok, false);
  assert.deepEqual(r.erreurs, {
    nom: 'Le nom est obligatoire.',
    montant: 'Le montant doit être supérieur à 0 €.',
    revenuSourceId: 'Choisis le revenu sur lequel épargner.',
  });
  assert.equal(validerEnveloppe({ type: 'epargne', nom: 'x'.repeat(41), montantTexte: '5', revenuSourceId: 'bourse' }, ctx()).erreurs.nom, '40 caractères maximum.');
  assert.equal(validerEnveloppe({ type: 'epargne', nom: 'A', montantTexte: '', revenuSourceId: 'bourse' }, ctx()).erreurs.montant, 'Saisis un montant.');
  assert.equal(validerEnveloppe({ type: 'epargne', nom: 'A', montantTexte: '5' }, ctx()).erreurs.revenuSourceId, 'Choisis le revenu sur lequel épargner.');
});

test('validerEnveloppe : type inconnu refusé', () => {
  const r = validerEnveloppe({ type: 'autre', nom: 'A', montantTexte: '5' }, ctx());
  assert.equal(r.ok, false);
  assert.equal(r.erreurs.type, "Choisis un type d'enveloppe.");
});

test('D37 une seule enveloppe Plaisir (hors idEnCours)', () => {
  const enveloppes = [plaisir(50)];
  const saisie = { type: 'plaisir', nom: 'Autre plaisir', montantTexte: '10' };
  assert.equal(validerEnveloppe(saisie, ctx({ enveloppes })).erreurs.type, 'Une seule enveloppe Plaisir.');
  assert.equal(validerEnveloppe(saisie, ctx({ enveloppes, idEnCours: 'p' })).ok, true);
});

test('D37 trois enveloppes Épargne maximum (hors idEnCours)', () => {
  const enveloppes = [epargne('a', 10), epargne('b', 10), epargne('c', 10), plaisir(50)];
  const saisie = { type: 'epargne', nom: 'D', montantTexte: '10', revenuSourceId: 'bourse' };
  assert.equal(validerEnveloppe(saisie, ctx({ enveloppes })).erreurs.type, 'Trois enveloppes Épargne maximum.');
  assert.equal(validerEnveloppe(saisie, ctx({ enveloppes, idEnCours: 'b' })).ok, true);
  assert.equal(validerEnveloppe(saisie, ctx({ enveloppes: enveloppes.slice(1) })).ok, true);
});

test('D45 budget plaisir plafonné au reste à vivre', () => {
  const saisie = (montantTexte) => ({ type: 'plaisir', nom: 'Plaisir', montantTexte });
  assert.equal(n(validerEnveloppe(saisie('185,01'), ctx()).erreurs.montant), 'Le budget plaisir ne peut pas dépasser ton reste à vivre (185 €).');
  assert.equal(validerEnveloppe(saisie('185'), ctx()).ok, true);
  assert.equal(n(validerEnveloppe(saisie('10'), ctx({ resteAVivre: 950 })).erreurs.montant), 'Le budget plaisir ne peut pas dépasser ton reste à vivre (9,50 €).');
  // L'épargne n'est pas plafonnée par cette règle.
  assert.equal(validerEnveloppe({ type: 'epargne', nom: 'E', montantTexte: '500', revenuSourceId: 'bourse' }, ctx()).ok, true);
});

test('epargneDuMois : D36 déduite dès réception du revenu source', () => {
  const env = [epargne('e1', 50)];
  assert.deepEqual(epargneDuMois(env, [bourse], '2026-11', '2026-11-04'), { total: 0, parEnveloppe: {} });
  assert.deepEqual(epargneDuMois(env, [bourse], '2026-11', '2026-11-05'), { total: 5000, parEnveloppe: { e1: 5000 } });
});

test('epargneDuMois : suspendue, inactive, source absente ou non reçue ce mois-là', () => {
  const revenus = [bourse, apl, { id: 'prime', nom: 'Prime', montant: 10000, recurrent: false, date: '2026-10-12', moisSuivant: false }];
  const env = [
    epargne('suspendue', 10, { suspendue: true }),
    epargne('future', 10, { actifDepuis: '2026-12' }),
    epargne('orpheline', 10, { revenuSourceId: 'disparu' }),
    epargne('surApl', 20, { revenuSourceId: 'apl' }),
    epargne('surPrime', 30, { revenuSourceId: 'prime' }),
    epargne('ok', 40),
    plaisir(50),
  ];
  assert.deepEqual(epargneDuMois(env, revenus, '2026-11', '2026-11-20'), { total: 4000, parEnveloppe: { ok: 4000 } });
  assert.deepEqual(epargneDuMois(env, revenus, '2026-11', '2026-11-30'), { total: 6000, parEnveloppe: { surApl: 2000, ok: 4000 } });
  assert.deepEqual(epargneDuMois(env, revenus, '2026-10', '2026-10-31'), { total: 9000, parEnveloppe: { surApl: 2000, surPrime: 3000, ok: 4000 } });
});

test('epargneDuMois : liste vide', () => {
  assert.deepEqual(epargneDuMois([], [bourse], '2026-11', '2026-11-30'), { total: 0, parEnveloppe: {} });
});

test('restantPlaisir : budget moins dépenses Plaisir, peut être négatif', () => {
  const depenses = [dep(20, 'plaisir'), dep(15, 'plaisir'), dep(100, 'courses')];
  assert.equal(restantPlaisir(plaisir(50), depenses), 1500);
  assert.equal(restantPlaisir(plaisir(30), depenses), -500);
  assert.equal(restantPlaisir(plaisir(30), []), 3000);
});

test('depassementPlaisir : avertit sans bloquer quand le montant ajouté dépasse le restant', () => {
  const depenses = [dep(20, 'plaisir')];
  assert.equal(depassementPlaisir(plaisir(50), depenses, 3000), false);
  assert.equal(depassementPlaisir(plaisir(50), depenses, 3001), true);
});

test('D42 totalCumuleDepuisResumes : somme des résumés', () => {
  const resumes = [
    { mois: '2026-09', epargneParEnveloppe: { e1: 5000, e2: 1000 } },
    { mois: '2026-10', epargneParEnveloppe: { e1: 5000 } },
    { mois: '2026-08', epargne: 0 },
  ];
  assert.equal(totalCumuleDepuisResumes('e1', resumes), 10000);
  assert.equal(totalCumuleDepuisResumes('e2', resumes), 1000);
  assert.equal(totalCumuleDepuisResumes('e3', resumes), 0);
  assert.equal(totalCumuleDepuisResumes('e1', []), 0);
});

test('totauxCumules : enveloppes Épargne dont le cumul change, idempotent', () => {
  const resumes = [{ mois: '2026-10', epargneParEnveloppe: { e1: 5000 } }];
  const env = [epargne('e1', 50), epargne('e2', 10), plaisir(50)];
  const maj = totauxCumules(env, resumes);
  assert.deepEqual(maj.map((e) => [e.id, e.totalCumule]), [['e1', 5000]]);
  assert.equal(env[0].totalCumule, 0, 'pas de mutation');
  assert.deepEqual(totauxCumules([{ ...env[0], totalCumule: 5000 }, env[1]], resumes), []);
});
