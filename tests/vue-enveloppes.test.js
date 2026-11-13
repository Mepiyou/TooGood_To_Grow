import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  textePlaisir, progressionPlaisir, sousTitreEpargne, totalEpargne, typesDisponibles, libelleLigneEnveloppe,
} from '../js/views/enveloppes.js';
import { avertissementPlaisir } from '../js/views/ajout.js';

const n = (s) => s?.replace(/[  ]/g, ' ');
const plaisir = { id: 'p', type: 'plaisir', nom: 'Sorties & ciné', montantMensuel: 6000, suspendue: false };
const epargne = (id, extra = {}) => ({
  id, type: 'epargne', nom: id, montantMensuel: 5000, revenuSourceId: 'bourse', totalCumule: 10000, suspendue: false, ...extra,
});
const dep = (euros, categorieId = 'plaisir', id = `${euros}`) => ({ id, montant: euros * 100, categorieId, date: '2026-11-10', mois: '2026-11' });
const revenus = [{ id: 'bourse', nom: 'Bourse', montant: 45000 }];

test('US6 : restant de l\'enveloppe plaisir', () => {
  const r = textePlaisir(plaisir, [dep(20), dep(8), dep(50, 'courses')]);
  assert.equal(n(r.texte), 'Restant : 32 € sur 60 €');
  assert.equal(r.depasse, false);
});

test('US6 : enveloppe dépassée', () => {
  const r = textePlaisir(plaisir, [dep(65)]);
  assert.equal(n(r.texte), 'Dépassé de 5 € sur 60 €');
  assert.equal(r.depasse, true);
});

test('US6 : barre de progression bornée au budget, texte lu', () => {
  assert.deepEqual(
    { ...progressionPlaisir(plaisir, [dep(15)]), texteLu: n(progressionPlaisir(plaisir, [dep(15)]).texteLu) },
    { valeur: 1500, max: 6000, pourcent: 25, texteLu: '15 € dépensés sur 60 €' },
  );
  const depasse = progressionPlaisir(plaisir, [dep(65)]);
  assert.equal(depasse.valeur, 6000);
  assert.equal(depasse.pourcent, 100);
  assert.equal(n(depasse.texteLu), '65 € dépensés sur 60 €');
  assert.equal(progressionPlaisir(plaisir, []).pourcent, 0);
});

test('US7 : sous-titre de l\'épargne', () => {
  assert.equal(n(sousTitreEpargne(epargne('Vacances'), revenus)), '50 €/mois sur Bourse');
  assert.equal(n(sousTitreEpargne(epargne('Vacances', { revenuSourceId: 'disparu' }), revenus)), '50 €/mois · revenu supprimé');
});

test('US7 : total épargné = cumul + épargne du mois déjà déduite', () => {
  const e = epargne('Vacances');
  assert.equal(totalEpargne(e, { parEnveloppe: { Vacances: 5000 } }), 15000);
  assert.equal(totalEpargne(e, { parEnveloppe: {} }), 10000);
  assert.equal(totalEpargne({ ...e, totalCumule: undefined }, { parEnveloppe: {} }), 0);
});

test('D37 : types disponibles (1 Plaisir, 3 Épargne)', () => {
  assert.deepEqual(typesDisponibles([]), { plaisir: true, epargne: true });
  assert.deepEqual(typesDisponibles([plaisir]), { plaisir: false, epargne: true });
  const trois = [epargne('a'), epargne('b'), epargne('c')];
  assert.deepEqual(typesDisponibles(trois), { plaisir: true, epargne: false });
  assert.deepEqual(typesDisponibles([plaisir, ...trois]), { plaisir: false, epargne: false });
});

test('libellé du bouton de modification', () => {
  assert.equal(n(libelleLigneEnveloppe(plaisir)), 'Modifier : Sorties & ciné, plaisir, 60 € par mois');
  assert.equal(n(libelleLigneEnveloppe(epargne('Vacances', { suspendue: true }))), 'Modifier : Vacances, épargne, 50 € par mois, suspendue');
});

test('D45 : avertissement de dépassement à la saisie, sans bloquer', () => {
  const base = { enveloppes: [plaisir], depensesMois: [dep(48)], categorieId: 'plaisir', montantTexte: '15', idEnCours: null };
  assert.equal(n(avertissementPlaisir(base)), 'Attention : cette dépense dépasse ton enveloppe plaisir (restant : 12 €).');
  assert.equal(avertissementPlaisir({ ...base, montantTexte: '12' }), null); // tout juste dans le budget
  assert.equal(avertissementPlaisir({ ...base, categorieId: 'courses' }), null);
  assert.equal(avertissementPlaisir({ ...base, enveloppes: [] }), null);
  assert.equal(avertissementPlaisir({ ...base, montantTexte: 'abc' }), null);
  assert.equal(avertissementPlaisir({ ...base, montantTexte: '' }), null);
});

test('D45 : en modification, l\'ancienne valeur de la dépense ne compte pas', () => {
  const base = { enveloppes: [plaisir], depensesMois: [dep(48, 'plaisir', 'x')], categorieId: 'plaisir', montantTexte: '50', idEnCours: 'x' };
  assert.equal(avertissementPlaisir(base), null);
  assert.equal(n(avertissementPlaisir({ ...base, montantTexte: '61' })), 'Attention : cette dépense dépasse ton enveloppe plaisir (restant : 60 €).');
});

test('D45 : enveloppe déjà dépassée, restant affiché à 0 €', () => {
  const base = { enveloppes: [plaisir], depensesMois: [dep(70)], categorieId: 'plaisir', montantTexte: '1', idEnCours: null };
  assert.equal(n(avertissementPlaisir(base)), 'Attention : cette dépense dépasse ton enveloppe plaisir (restant : 0 €).');
});
