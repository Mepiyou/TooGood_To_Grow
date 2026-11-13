import { moisEntre, moisSuivant } from './dates.js';

export function partMensuelle(provision, mois, dejaReserve = 0) {
  const moisRestants = Math.max(1, moisEntre(mois, provision.moisEcheance));
  return Math.ceil((provision.montantTotal - dejaReserve) / moisRestants);
}

// Somme des parts des mois de debut (inclus) à mois (exclu), chaque part tenant compte du cumul précédent.
export function dejaReserve(provision, mois) {
  let cumul = 0;
  for (let m = provision.debut; m < mois && m < provision.moisEcheance; m = moisSuivant(m)) {
    cumul += partMensuelle(provision, m, cumul);
  }
  return cumul;
}

export function partDuMois(provision, mois) {
  if (mois < provision.debut || mois >= provision.moisEcheance) return 0;
  return partMensuelle(provision, mois, dejaReserve(provision, mois));
}

export function provisionsDuMois(provisions, mois) {
  return provisions.reduce((somme, p) => somme + partDuMois(p, mois), 0);
}
