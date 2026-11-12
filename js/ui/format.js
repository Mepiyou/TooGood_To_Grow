// Formatage fr-FR des montants (centimes entiers) et des dates (chaînes locales).

const deviseEntiere = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 0, maximumFractionDigits: 0 });
const deviseCentimes = new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR', minimumFractionDigits: 2, maximumFractionDigits: 2 });

// Centimes affichés seulement s'ils sont non nuls (D16). Découpage sur des entiers.
export function formatMontant(centimes) {
  const abs = Math.abs(centimes);
  const euros = Math.trunc(abs / 100);
  const reste = abs % 100;
  const signe = centimes < 0 ? -1 : 1;
  if (reste === 0) return deviseEntiere.format(signe * euros);
  return deviseCentimes.format(signe * (euros + reste / 100));
}

export function formatMontantLu(centimes) {
  const abs = Math.abs(centimes);
  const euros = Math.trunc(abs / 100);
  const reste = abs % 100;
  let texte = `${euros} ${euros > 1 ? 'euros' : 'euro'}`;
  if (reste !== 0) texte += ` ${reste}`;
  return centimes < 0 ? `moins ${texte}` : texte;
}

export function formatSoldeQuotidien(centimes) {
  return {
    texte: `${formatMontant(centimes)}/jour`,
    lu: `${formatMontantLu(centimes)} par jour`,
  };
}

// UTC + Date.UTC : le résultat ne dépend pas du fuseau de l'appareil.
function dateUTC(date) {
  const [a, m, j] = date.split('-').map(Number);
  return new Date(Date.UTC(a, m - 1, j));
}

const fmtLongue = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
const fmtJourMois = new Intl.DateTimeFormat('fr-FR', { day: 'numeric', month: 'short', timeZone: 'UTC' });
const fmtMois = new Intl.DateTimeFormat('fr-FR', { month: 'long', year: 'numeric', timeZone: 'UTC' });

export function formatDateLongue(date) {
  return fmtLongue.format(dateUTC(date));
}

export function formatJourMois(date) {
  return fmtJourMois.format(dateUTC(date));
}

export function formatMois(mois) {
  return fmtMois.format(dateUTC(`${mois}-01`));
}

const fmtNomMois = new Intl.DateTimeFormat('fr-FR', { month: 'long', timeZone: 'UTC' });

// « décembre » : mois seul, en minuscules (usage en milieu de phrase).
export function formatNomMois(mois) {
  return fmtNomMois.format(dateUTC(`${mois}-01`));
}

export function majuscule(texte) {
  return texte.charAt(0).toUpperCase() + texte.slice(1);
}

const fmtJourSemaine = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', timeZone: 'UTC' });

// « mardi 10 novembre » : titre de groupe, sans l'année.
export function formatJourSemaine(date) {
  return fmtJourSemaine.format(dateUTC(date));
}
