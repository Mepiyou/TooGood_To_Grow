import { dateValide, moisDe, comparer } from './dates.js';

export function validerDateDepense(date, aujourdhui, moisDetailSupprime) {
  if (!dateValide(date)) return 'Date invalide.';
  if (comparer(date, aujourdhui) > 0) return 'La date ne peut pas être dans le futur.';
  if (moisDetailSupprime.includes(moisDe(date))) return 'Le détail de ce mois a été supprimé.';
  return null;
}

export function trierParDateDesc(depenses) {
  return [...depenses].sort((a, b) => comparer(b.date, a.date) || comparer(b.creeLe ?? '', a.creeLe ?? ''));
}
