import { ajouterJours } from './dates.js';
import { soldeQuotidien } from './budget.js';

// Moyenne en centimes par jour, sans arrondi intermédiaire.
export function calculerAlerte({ resteAVivre, depenses7Jours, joursRestants, aujourdhui, alerteVueLe }) {
  const moyenne = depenses7Jours / 7;
  if (moyenne === 0 || alerteVueLe === aujourdhui) return null;
  if (resteAVivre - moyenne * joursRestants >= 0) return null;
  return {
    // resteAVivre / (depenses7Jours / 7) en entiers, pour éviter un flottant juste sous l'entier ; jamais dans le passé.
    dateDecouvert: ajouterJours(aujourdhui, Math.max(0, Math.floor((resteAVivre * 7) / depenses7Jours))),
    soldeConseille: soldeQuotidien(resteAVivre, joursRestants),
  };
}

// Les 7 jours terminés aujourd'hui inclus : de aujourd'hui − 6 à aujourd'hui.
export function depensesDesSeptDerniersJours(depenses, aujourdhui) {
  const debut = ajouterJours(aujourdhui, -6);
  return depenses
    .filter((d) => d.date >= debut && d.date <= aujourdhui)
    .reduce((somme, d) => somme + d.montant, 0);
}
