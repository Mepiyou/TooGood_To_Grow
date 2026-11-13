// Textes de l'accueil (spec § 15 : B3, B4, D18, D29, D30). Purs : le HTML les échappe à l'injection.
import { formatMontant, formatSoldeQuotidien, formatJourMoisLong } from './format.js';
import { jourDe } from '../domain/dates.js';

function dansJours(n) {
  return `dans ${n} ${n > 1 ? 'jours' : 'jour'}`;
}

// « Reste à vivre : 185 € · prochaine rentrée dans 15 jours (APL, le 25) »
// ou, sans rentrée prévue ce mois-ci, « … · fin du mois dans 20 jours » (D29 : « … · fin du mois aujourd'hui »
// le dernier jour ; joursRestants garde 1 jour minimum pour le calcul, d'où le test sur la date).
export function ligneResteAVivre({ resteAVivre, prochaineRentree, joursRestants, aujourdhui }) {
  const debut = `Reste à vivre : ${formatMontant(resteAVivre)} · `;
  const { revenu, date } = prochaineRentree;
  if (!revenu && date === aujourdhui) return `${debut}fin du mois aujourd'hui`;
  if (!revenu) return `${debut}fin du mois ${dansJours(joursRestants)}`;
  return `${debut}prochaine rentrée ${dansJours(joursRestants)} (${revenu.nom}, le ${jourDe(date)})`;
}

// Avertissement bienveillant, seulement si le reste à vivre est négatif (B3 : rien à 0 €).
// D30 : en début de mois, sans dépense et avec une rentrée prévue, on renvoie à cette rentrée.
export function texteAvertissement({ resteAVivre, depensesMois, prochaineRentree }) {
  if (resteAVivre >= 0) return null;
  if (depensesMois === 0 && prochaineRentree.revenu) {
    return `Ta prochaine rentrée arrive le ${jourDe(prochaineRentree.date)} : limite tes dépenses d'ici là.`;
  }
  return `Tu as dépassé ton budget de ${formatMontant(-resteAVivre)}. Pas de panique : limite tes dépenses jusqu'au ${jourDe(prochaineRentree.date)}.`;
}

// US5 : bandeau d'alerte de découvert. `lu` remplace « 8 €/jour » (lu « barre jour ») pour les lecteurs d'écran.
export function texteAlerte({ dateDecouvert, soldeConseille }, prochaineRentree) {
  const debut = `Attention : à ce rythme, tu seras à découvert vers le ${formatJourMoisLong(dateDecouvert)}. Il te reste `;
  const fin = ` jusqu'au ${jourDe(prochaineRentree.date)}.`;
  const solde = formatSoldeQuotidien(soldeConseille);
  return { texte: `${debut}${solde.texte}${fin}`, lu: `${debut}${solde.lu}${fin}` };
}

// Premier lancement (D18) : aucun revenu saisi, quel qu'il soit.
export function estPremierLancement(revenus) {
  return revenus.length === 0;
}
