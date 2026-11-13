import { echapper } from './dom.js';
import { formatMontant } from './format.js';

// Hauteur de chaque barre en % du plus grand total ; `null` et 0 donnent 0, et un maximum nul met tout à 0.
export function hauteursBarres(totaux) {
  const max = Math.max(0, ...totaux.map((t) => t.total ?? 0));
  if (max === 0) return totaux.map(() => 0);
  return totaux.map((t) => Math.round(((t.total ?? 0) / max) * 10000) / 100);
}

// `libelles` : un { court, long } par mois, dans l'ordre de `totaux`.
export function libelleBarres(totaux, libelles) {
  const parties = totaux.map((t, i) => `${libelles[i].long} : ${t.total === null ? 'aucune donnée' : formatMontant(t.total)}`);
  return `Dépenses des 6 derniers mois : ${parties.join(', ')}.`;
}

export function rendreBarres(totaux, libelles) {
  const hauteurs = hauteursBarres(totaux);
  const colonnes = totaux.map((t, i) => `<li class="barre-col${t.courant ? ' barre-courante' : ''}">
      <span class="barre-valeur">${t.total === null ? '—' : echapper(formatMontant(t.total))}</span>
      <span class="barre-zone barres-axe"><span class="barre" style="height:${hauteurs[i]}%"></span></span>
      <span class="barre-mois">${echapper(libelles[i].court)}</span>
    </li>`).join('');
  return `<div class="barres" role="img" aria-label="${echapper(libelleBarres(totaux, libelles))}">
    <ul class="barres-liste" aria-hidden="true">${colonnes}</ul>
  </div>`;
}
