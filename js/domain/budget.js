import { moisDe, moisPrecedent, dateValide, dernierJourDuMois, ecartJours } from './dates.js';
import { validerNom, validerJour, chargesDuMois } from './charges.js';
import { datePourMois as datePourMoisReception } from './reception.js';
import { epargneDuMois } from './enveloppes.js';
import { provisionsDuMois, provisionsLiberees } from './provisions.js';
import { totalDepenses } from './depenses.js';
import { parseMontant } from './montant.js';

// Défini dans reception.js pour qu'enveloppes.js l'utilise sans cycle d'imports.
export const datePourMois = datePourMoisReception;

export function revenusRecus(revenus, aujourdhui) {
  const mois = moisDe(aujourdhui);
  let total = 0;
  for (const r of revenus) {
    const date = datePourMois(r, mois);
    if (date !== null && date <= aujourdhui) total += r.montant;
  }
  return total;
}

export function totalRevenusAttendus(revenus, mois) {
  let total = 0;
  for (const r of revenus) {
    if (datePourMois(r, mois) !== null) total += r.montant;
  }
  return total;
}

// Revenus affichés pour `mois` : récurrents (par jour) puis ponctuels (par date).
// Un ponctuel apparaît dans son mois de réception et, s'il compte pour le mois
// suivant, aussi dans le mois qu'il finance (pour que la liste explique le total).
export function revenusDuMois(revenus, mois) {
  const parNom = (a, b) => a.nom.localeCompare(b.nom, 'fr');
  const recurrents = revenus.filter((r) => r.recurrent)
    .sort((a, b) => (a.jour - b.jour) || parNom(a, b));
  const ponctuels = revenus.filter((r) => !r.recurrent && (moisDe(r.date) === mois || datePourMois(r, mois) !== null))
    .sort((a, b) => (a.date < b.date ? -1 : a.date > b.date ? 1 : parNom(a, b)));
  return [...recurrents, ...ponctuels];
}

export function validerRevenu({ nom, montantTexte, recurrent, jour, date, moisSuivant, mois }) {
  const erreurs = {};
  const nomVerifie = validerNom(nom);
  if (nomVerifie.erreur) erreurs.nom = nomVerifie.erreur;

  const montant = parseMontant(montantTexte);
  if (!montant.ok) erreurs.montant = montant.erreur;

  const valeurs = {};
  if (recurrent) {
    const jourVerifie = validerJour(jour);
    if (jourVerifie.erreur) erreurs.jour = jourVerifie.erreur;
    else valeurs.jour = jourVerifie.valeur;
  } else if (dateValide(date)) {
    // Une date hors du mois affiché ferait disparaître le revenu de la liste, sans moyen de le corriger.
    const mDate = moisDe(date);
    if (mDate === mois || (moisSuivant && mDate === moisPrecedent(mois))) valeurs.date = date;
    else erreurs.date = 'Choisis une date de ce mois-ci.';
  } else {
    erreurs.date = 'Choisis une date.';
  }

  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs };
  return {
    ok: true,
    erreurs,
    valeurs: { nom: nomVerifie.valeur, montant: montant.centimes, recurrent: Boolean(recurrent), ...valeurs, moisSuivant: Boolean(moisSuivant) },
  };
}

export function resteAVivre({ revenusRecus: recus, charges, epargne = 0, provisions = 0, depenses }) {
  return recus - charges - epargne - provisions - depenses;
}

// Prochaine rentrée du mois courant, strictement après aujourd'hui (D3). Les revenus
// « mois suivant » financent le mois d'après : ils sont ignorés ici (D1b).
export function prochaineRentree(revenus, aujourdhui) {
  const mois = moisDe(aujourdhui);
  let meilleur = { date: dernierJourDuMois(mois), revenu: null };
  for (const r of revenus) {
    if (r.moisSuivant) continue;
    const date = datePourMois(r, mois);
    if (date === null || date <= aujourdhui) continue;
    if (meilleur.revenu === null || date < meilleur.date) meilleur = { date, revenu: r };
  }
  return meilleur;
}

export function joursRestants(aujourdhui, dateRentree) {
  return Math.max(1, ecartJours(aujourdhui, dateRentree));
}

export function soldeQuotidien(reste, jours) {
  return reste > 0 ? Math.floor(reste / jours / 100) * 100 : 0;
}

// D44 : le montant déjà réservé d'une provision soldée ce mois-ci (`liberees`) est réintégré.
export function calculerAccueil({ revenus, charges, depenses, aujourdhui, enveloppes = [], provisions = [] }) {
  const mois = moisDe(aujourdhui);
  const recus = revenusRecus(revenus, aujourdhui);
  const totalCharges = chargesDuMois(charges, mois);
  const duMois = depenses.filter((d) => (d.mois ?? moisDe(d.date)) === mois);
  const depensesMois = totalDepenses(duMois);
  const epargne = epargneDuMois(enveloppes, revenus, mois, aujourdhui).total;
  const totalProvisions = provisionsDuMois(provisions, mois);
  const liberees = provisionsLiberees(duMois);
  const reste = resteAVivre({ revenusRecus: recus, charges: totalCharges, epargne, provisions: totalProvisions, depenses: depensesMois }) + liberees;
  const rentree = prochaineRentree(revenus, aujourdhui);
  const jours = joursRestants(aujourdhui, rentree.date);
  return {
    revenusRecus: recus,
    charges: totalCharges,
    depensesMois,
    epargne,
    provisions: totalProvisions,
    liberees,
    resteAVivre: reste,
    soldeQuotidien: soldeQuotidien(reste, jours),
    avertissement: reste < 0,
    prochaineRentree: rentree,
    joursRestants: jours,
  };
}
