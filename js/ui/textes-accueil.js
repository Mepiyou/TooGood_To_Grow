// Textes de l'accueil (spec § 15 : B3, B4, D18). Purs : le HTML les échappe à l'injection.
import { formatMontant } from './format.js';
import { jourDe } from '../domain/dates.js';

function dansJours(n) {
  return `dans ${n} ${n > 1 ? 'jours' : 'jour'}`;
}

// « Reste à vivre : 185 € · prochaine rentrée dans 15 jours (APL, le 25) »
// ou, sans rentrée prévue ce mois-ci, « … · fin du mois dans 20 jours ».
export function ligneResteAVivre({ resteAVivre, prochaineRentree, joursRestants }) {
  const debut = `Reste à vivre : ${formatMontant(resteAVivre)} · `;
  const { revenu, date } = prochaineRentree;
  if (!revenu) return `${debut}fin du mois ${dansJours(joursRestants)}`;
  return `${debut}prochaine rentrée ${dansJours(joursRestants)} (${revenu.nom}, le ${jourDe(date)})`;
}

// Avertissement bienveillant, seulement si le reste à vivre est négatif (B3 : rien à 0 €).
export function texteAvertissement({ resteAVivre, prochaineRentree }) {
  if (resteAVivre >= 0) return null;
  return `Tu as dépassé ton budget de ${formatMontant(-resteAVivre)}. Pas de panique : limite tes dépenses jusqu'au ${jourDe(prochaineRentree.date)}.`;
}

// Premier lancement (D18) : aucun revenu saisi, quel qu'il soit.
export function estPremierLancement(revenus) {
  return revenus.length === 0;
}
