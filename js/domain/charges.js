import { joursDansMois } from './dates.js';

// Un jour 31 tombe le dernier jour des mois plus courts.
export function jourEffectif(jour, mois) {
  return Math.min(jour, joursDansMois(mois));
}
