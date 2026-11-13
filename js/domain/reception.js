import { moisDe, moisPrecedent, construireDate } from './dates.js';
import { jourEffectif } from './charges.js';

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
