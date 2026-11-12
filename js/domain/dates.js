// Dates AAAA-MM-JJ et mois AAAA-MM, calculés en UTC pour ignorer l'heure d'été.

const MS_PAR_JOUR = 86400000;

const deux = (n) => String(n).padStart(2, '0');
const quatre = (n) => String(n).padStart(4, '0');

function composer(annee, mois, jour) {
  return `${quatre(annee)}-${deux(mois)}-${deux(jour)}`;
}

function utcDepuisDate(date) {
  const [a, m, j] = date.split('-').map(Number);
  return Date.UTC(a, m - 1, j);
}

export function joursDansMois(mois) {
  const [a, m] = mois.split('-').map(Number);
  return new Date(Date.UTC(a, m, 0)).getUTCDate();
}

export function moisDe(date) {
  return date.slice(0, 7);
}

export function jourDe(date) {
  return Number(date.slice(8, 10));
}

function decalerMois(mois, n) {
  const [a, m] = mois.split('-').map(Number);
  const total = a * 12 + (m - 1) + n;
  return `${quatre(Math.floor(total / 12))}-${deux((total % 12) + 1)}`;
}

export function moisSuivant(mois) {
  return decalerMois(mois, 1);
}

export function moisPrecedent(mois) {
  return decalerMois(mois, -1);
}

// Vrai si le mois du jour n'est plus celui de l'écran (appli restée ouverte au-delà d'une fin de mois).
export function moisAChange(moisAffiche, aujourdhui) {
  return moisDe(aujourdhui) !== moisAffiche;
}

export function construireDate(mois, jour) {
  return `${mois}-${deux(jour)}`;
}

export function dernierJourDuMois(mois) {
  return construireDate(mois, joursDansMois(mois));
}

export function ajouterJours(date, n) {
  const d = new Date(utcDepuisDate(date) + n * MS_PAR_JOUR);
  return composer(d.getUTCFullYear(), d.getUTCMonth() + 1, d.getUTCDate());
}

export function ecartJours(de, a) {
  return Math.round((utcDepuisDate(a) - utcDepuisDate(de)) / MS_PAR_JOUR);
}

export function moisEntre(debut, fin) {
  const [a1, m1] = debut.split('-').map(Number);
  const [a2, m2] = fin.split('-').map(Number);
  return (a2 - a1) * 12 + (m2 - m1);
}

export function comparer(a, b) {
  return a < b ? -1 : a > b ? 1 : 0;
}

// Seule fonction recevant un objet Date, fourni par l'appelant : date locale.
export function versISO(d) {
  return composer(d.getFullYear(), d.getMonth() + 1, d.getDate());
}
