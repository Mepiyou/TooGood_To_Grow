import { joursDansMois, moisSuivant } from './dates.js';
import { parseMontant } from './montant.js';

const NOM_MAX = 40;

// Un jour 31 tombe le dernier jour des mois plus courts.
export function jourEffectif(jour, mois) {
  return Math.min(jour, joursDansMois(mois));
}

// Validation commune aux revenus et aux charges : renvoie { valeur } ou { erreur }.
export function validerNom(nom) {
  const net = String(nom ?? '').trim();
  if (net === '') return { erreur: 'Le nom est obligatoire.' };
  if (net.length > NOM_MAX) return { erreur: '40 caractères maximum.' };
  return { valeur: net };
}

export function validerJour(jour) {
  const texte = String(jour ?? '').trim();
  const n = /^\d+$/.test(texte) ? Number(texte) : NaN;
  if (n >= 1 && n <= 31) return { valeur: n };
  return { erreur: 'Choisis un jour entre 1 et 31.' };
}

export function creerCharge({ nom, montant, jour }, moisCourant) {
  return { nom, montant, jour, actifDepuis: moisCourant, historique: [{ depuis: moisCourant, montant, jour }] };
}

// Dernière entrée d'historique en vigueur à `mois`, ou null si la charge n'est pas active.
function entreeEnVigueur(charge, mois) {
  if (mois < charge.actifDepuis) return null;
  if (charge.actifJusqua !== undefined && mois > charge.actifJusqua) return null;
  let retenue = null;
  for (const e of charge.historique) {
    if (e.depuis <= mois) retenue = e;
  }
  return retenue;
}

export function montantCharge(charge, mois) {
  return entreeEnVigueur(charge, mois)?.montant ?? 0;
}

export function chargesDuMois(charges, mois) {
  return charges.reduce((total, c) => total + montantCharge(c, mois), 0);
}

// Le changement vaut dès le mois suivant ; le mois de création, c'est une correction immédiate.
export function modifierCharge(charge, { nom, montant, jour }, moisCourant) {
  const depuis = charge.actifDepuis === moisCourant ? moisCourant : moisSuivant(moisCourant);
  const historique = charge.historique
    .filter((e) => e.depuis !== depuis)
    .concat({ depuis, montant, jour })
    .sort((a, b) => (a.depuis < b.depuis ? -1 : a.depuis > b.depuis ? 1 : 0));
  const derniere = historique[historique.length - 1];
  return { ...charge, nom, montant: derniere.montant, jour: derniere.jour, historique };
}

export function supprimerCharge(charge, moisCourant) {
  return { ...charge, actifJusqua: moisCourant };
}

export function validerCharge({ nom, montantTexte, jour }) {
  const erreurs = {};
  const n = validerNom(nom);
  if (n.erreur) erreurs.nom = n.erreur;
  const montant = parseMontant(montantTexte);
  if (!montant.ok) erreurs.montant = montant.erreur;
  const j = validerJour(jour);
  if (j.erreur) erreurs.jour = j.erreur;
  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs };
  return { ok: true, erreurs, valeurs: { nom: n.valeur, montant: montant.centimes, jour: j.valeur } };
}
