import { echapper } from '../ui/dom.js';

// Vue provisoire : sera remplacée à l'étape 4.
export async function render(container, params, ctx) {
  const [annee, mois, jour] = ctx.aujourdhui().split('-').map(Number);
  const date = new Date(annee, mois - 1, jour).toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  container.innerHTML = `<h1>TooGood To Grow</h1><p class="secondaire">${echapper(date)}</p>`;
}
