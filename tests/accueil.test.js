import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculerAccueil } from '../js/domain/budget.js';
import { ligneResteAVivre, texteAvertissement, estPremierLancement } from '../js/ui/textes-accueil.js';

const espaces = (s) => s.replace(/[\u00a0\u202f]/g, ' ');

// Données de démo (MESURES.md, étape 4).
const revenus = [
  { id: 'b', nom: 'Bourse', montant: 45000, recurrent: true, jour: 5, actifDepuis: '2026-01', moisSuivant: false },
  { id: 'a', nom: 'APL', montant: 20000, recurrent: true, jour: 25, actifDepuis: '2026-01', moisSuivant: false },
  { id: 'j', nom: 'Job', montant: 40000, recurrent: true, jour: 30, actifDepuis: '2026-01', moisSuivant: true },
];
const charge = (nom, montant, jour) => ({ id: nom, nom, actifDepuis: '2026-01', historique: [{ depuis: '2026-01', montant, jour }] });
const charges = [charge('Transport', 2500, 1), charge('Loyer CROUS', 56000, 3), charge('Forfait', 1000, 12)];
const depenses = [{ id: 'd', montant: 7000, categorieId: 'courses', date: '2026-11-08', mois: '2026-11' }];

test('ligne B4 : prochaine rentrée prévue (données de démo au 10 novembre)', () => {
  const accueil = calculerAccueil({ revenus, charges, depenses, aujourdhui: '2026-11-10' });
  assert.equal(accueil.resteAVivre, 18500);
  assert.equal(espaces(ligneResteAVivre(accueil)), 'Reste à vivre : 185 € · prochaine rentrée dans 15 jours (APL, le 25)');
});

test('ligne B4 : sans rentrée prévue, fin du mois', () => {
  const ligne = ligneResteAVivre({ resteAVivre: 28500, prochaineRentree: { date: '2026-11-30', revenu: null }, joursRestants: 20 });
  assert.equal(espaces(ligne), 'Reste à vivre : 285 € · fin du mois dans 20 jours');
});

test('ligne B4 : singulier « dans 1 jour »', () => {
  const rentree = { date: '2026-11-25', revenu: { nom: 'APL' } };
  assert.equal(espaces(ligneResteAVivre({ resteAVivre: 1000, prochaineRentree: rentree, joursRestants: 1 })),
    'Reste à vivre : 10 € · prochaine rentrée dans 1 jour (APL, le 25)');
  assert.equal(espaces(ligneResteAVivre({ resteAVivre: 1000, prochaineRentree: { date: '2026-11-30', revenu: null }, joursRestants: 1 })),
    'Reste à vivre : 10 € · fin du mois dans 1 jour');
});

test('ligne B4 : reste à vivre négatif affiché avec son signe', () => {
  const ligne = espaces(ligneResteAVivre({ resteAVivre: -2000, prochaineRentree: { date: '2026-11-25', revenu: { nom: 'APL' } }, joursRestants: 15 }));
  assert.match(ligne, /^Reste à vivre : [-−]20 € · prochaine rentrée dans 15 jours \(APL, le 25\)$/);
});

test('avertissement D18 seulement si le reste à vivre est négatif', () => {
  const rentree = { date: '2026-11-25', revenu: { nom: 'APL' } };
  assert.equal(espaces(texteAvertissement({ resteAVivre: -2000, prochaineRentree: rentree })),
    "Tu as dépassé ton budget de 20 €. Pas de panique : limite tes dépenses jusqu'au 25.");
  assert.equal(espaces(texteAvertissement({ resteAVivre: -1250, prochaineRentree: { date: '2026-11-30', revenu: null } })),
    "Tu as dépassé ton budget de 12,50 €. Pas de panique : limite tes dépenses jusqu'au 30.");
  assert.equal(texteAvertissement({ resteAVivre: 0, prochaineRentree: rentree }), null); // B3
  assert.equal(texteAvertissement({ resteAVivre: 500, prochaineRentree: rentree }), null);
});

test('cas négatif de bout en bout : 0 €/jour et avertissement', () => {
  const grosse = [...depenses, { id: 'e', montant: 20500, categorieId: 'plaisir', date: '2026-11-10', mois: '2026-11' }];
  const accueil = calculerAccueil({ revenus, charges, depenses: grosse, aujourdhui: '2026-11-10' });
  assert.equal(accueil.soldeQuotidien, 0);
  assert.equal(espaces(texteAvertissement(accueil)), "Tu as dépassé ton budget de 20 €. Pas de panique : limite tes dépenses jusqu'au 25.");
});

test('premier lancement : aucun revenu saisi', () => {
  assert.equal(estPremierLancement([]), true);
  assert.equal(estPremierLancement(revenus), false);
  assert.equal(estPremierLancement([revenus[2]]), false); // un revenu « mois suivant » compte comme saisi
});
