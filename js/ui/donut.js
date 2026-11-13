import { echapper, couleurSure } from './dom.js';
import { formatMontant } from './format.js';

const arrondi = (n) => Math.round(n * 100) / 100;

// Arrêts du dégradé calculés sur les montants cumulés : pas de dérive due aux pourcentages arrondis.
export function degradeDonut(repartition) {
  const total = repartition.reduce((s, p) => s + p.montant, 0);
  let cumul = 0;
  const arrets = repartition.map((p, i) => {
    const debut = arrondi((cumul / total) * 100);
    cumul += p.montant;
    const fin = i === repartition.length - 1 ? 100 : arrondi((cumul / total) * 100);
    return `${couleurSure(p.couleur)} ${debut}% ${fin}%`;
  });
  return `conic-gradient(${arrets.join(', ')})`;
}

export function libelleDonut(repartition, total, libelleMois) {
  const parts = repartition.map((p) => `${p.nom} ${formatMontant(p.montant)}, ${p.pourcentage} %.`);
  return `Dépenses de ${libelleMois} : ${formatMontant(total)}. ${parts.join(' ')}`;
}

export function rendreDonut(repartition, total, libelleMois) {
  const legende = repartition.map((p) => `<li>
      <span class="pastille" style="background:${couleurSure(p.couleur)}" aria-hidden="true"></span>
      <span class="legende-nom">${echapper(p.nom)}</span>
      <span class="legende-montant">${echapper(formatMontant(p.montant))}</span>
      <span class="legende-pourcent">${p.pourcentage} %</span>
    </li>`).join('');
  return `<div class="donut-bloc">
    <div class="donut" role="img" aria-label="${echapper(libelleDonut(repartition, total, libelleMois))}" style="background:${degradeDonut(repartition)}">
      <div class="donut-trou" aria-hidden="true"><span class="donut-total">${echapper(formatMontant(total))}</span></div>
    </div>
    <ul class="legende-donut">${legende}</ul>
  </div>`;
}
