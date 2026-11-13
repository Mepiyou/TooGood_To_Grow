import { moisDe, moisPrecedent, construireDate, dateValide, dernierJourDuMois, ecartJours } from './dates.js';
import { jourEffectif, validerNom, validerJour, chargesDuMois } from './charges.js';
import { totalDepenses } from './depenses.js';
import { parseMontant } from './montant.js';

// Date de réception qui finance `mois`, ou null. Avec « mois suivant », le
// revenu reçu le mois précédent finance `mois`.
export function datePourMois(revenu, mois) {
  const source = revenu.moisSuivant ? moisPrecedent(mois) : mois;
  if (revenu.recurrent) {
    if (revenu.actifDepuis > source) return null;
    return construireDate(source, jourEffectif(revenu.jour, source));
  }
  return moisDe(revenu.date) === source ? revenu.date : null;
}

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

export function calculerAccueil({ revenus, charges, depenses, aujourdhui }) {
  const mois = moisDe(aujourdhui);
  const recus = revenusRecus(revenus, aujourdhui);
  const totalCharges = chargesDuMois(charges, mois);
  const depensesMois = totalDepenses(depenses.filter((d) => (d.mois ?? moisDe(d.date)) === mois));
  const reste = resteAVivre({ revenusRecus: recus, charges: totalCharges, depenses: depensesMois });
  const rentree = prochaineRentree(revenus, aujourdhui);
  const jours = joursRestants(aujourdhui, rentree.date);
  return {
    revenusRecus: recus,
    charges: totalCharges,
    depensesMois,
    resteAVivre: reste,
    soldeQuotidien: soldeQuotidien(reste, jours),
    avertissement: reste < 0,
    prochaineRentree: rentree,
    joursRestants: jours,
  };
}
