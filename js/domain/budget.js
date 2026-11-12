import { moisDe, moisPrecedent, construireDate, joursDansMois } from './dates.js';
import { jourEffectif } from './charges.js';
import { parseMontant } from './montant.js';

const NOM_MAX = 40;

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

function dateValide(date) {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(String(date ?? ''));
  if (!m) return false;
  const mois = Number(m[2]);
  return mois >= 1 && mois <= 12 && Number(m[3]) >= 1 && Number(m[3]) <= joursDansMois(`${m[1]}-${m[2]}`);
}

export function validerRevenu({ nom, montantTexte, recurrent, jour, date, moisSuivant }) {
  const erreurs = {};
  const nomNet = String(nom ?? '').trim();
  if (nomNet === '') erreurs.nom = 'Le nom est obligatoire.';
  else if (nomNet.length > NOM_MAX) erreurs.nom = '40 caractères maximum.';

  const montant = parseMontant(montantTexte);
  if (!montant.ok) erreurs.montant = montant.erreur;

  const valeurs = {};
  if (recurrent) {
    const texte = String(jour ?? '').trim();
    const n = /^\d+$/.test(texte) ? Number(texte) : NaN;
    if (n >= 1 && n <= 31) valeurs.jour = n;
    else erreurs.jour = 'Choisis un jour entre 1 et 31.';
  } else if (dateValide(date)) {
    valeurs.date = date;
  } else {
    erreurs.date = 'Choisis une date.';
  }

  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs };
  return {
    ok: true,
    erreurs,
    valeurs: { nom: nomNet, montant: montant.centimes, recurrent: Boolean(recurrent), ...valeurs, moisSuivant: Boolean(moisSuivant) },
  };
}
