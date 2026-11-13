import { echapper, couleurSure } from '../ui/dom.js';
import { formatMontant } from '../ui/format.js';
import { ICONE_MODIFIER, ICONE_SUPPRIMER } from '../ui/icones-actions.js';
import { gabaritFormCategorie, brancherFormCategorie, ouvrirFormCategorie } from '../ui/form-categorie.js';
import { montantsParCategorie } from '../domain/categories.js';
import { moisDe } from '../domain/dates.js';
import { listerCategories, supprimerCategorie } from '../store/categories.js';
import { depensesDuMois } from '../store/depenses.js';

const ERREUR_SUPPRESSION = 'Impossible de supprimer la catégorie. Réessaie.';
const ERREUR_ENREGISTREMENT = "Impossible d'enregistrer la catégorie. Réessaie.";

export function confirmationSuppression(nom) {
  return `Supprimer « ${nom} » ? Ses dépenses passeront dans « Autre ».`;
}

function rendreLigne(categorie, montant) {
  const nom = echapper(categorie.nom);
  const actions = categorie.parDefaut
    ? '<span class="ligne-mention">Par défaut</span>'
    : `<button type="button" class="bouton-icone" data-action="modifier" aria-label="Modifier : ${nom}">${ICONE_MODIFIER}</button>
    <button type="button" class="bouton-icone" data-action="supprimer" aria-label="Supprimer : ${nom}">${ICONE_SUPPRIMER}</button>`;
  return `<li class="ligne-depense ligne-categorie" data-id="${echapper(categorie.id)}">
    <span class="pastille" style="background:${couleurSure(categorie.couleur)}" aria-hidden="true"></span>
    <span class="ligne-nom">${nom}</span>
    <span class="ligne-montant">${echapper(formatMontant(montant))}</span>
    ${actions}
  </li>`;
}

export async function render(container, params, ctx) {
  const mois = moisDe(ctx.aujourdhui());
  const [categories, depenses] = await Promise.all([listerCategories(), depensesDuMois(mois)]);
  if (!ctx.estActuel()) return;
  const montants = montantsParCategorie(depenses, categories);

  container.innerHTML = `<div class="vue-categories">
    <a class="lien-retour" href="#/depenses"><span aria-hidden="true">←</span> Retour</a>
    <h1>Catégories</h1>
    <ul class="liste-lignes">${categories.map((c) => rendreLigne(c, montants[c.id] ?? 0)).join('')}</ul>
    <p class="erreur-formulaire" role="alert" id="categories-alerte" hidden></p>
    <section class="section-nouvelle-categorie">
      ${gabaritFormCategorie({ prefixe: 'cat-nouvelle', titre: 'Nouvelle catégorie' })}
    </section>
  </div>`;

  const vue = container.querySelector('.vue-categories');
  const alerte = vue.querySelector('#categories-alerte');
  let occupe = false;

  // Le rendu est asynchrone et remplace la vue : le focus se pose sur le nouveau DOM une fois le rendu fini.
  async function rafraichirPuisFocus(idLigne) {
    await ctx.rafraichir();
    const cible = idLigne
      ? document.querySelector(`.vue-categories li[data-id="${CSS.escape(idLigne)}"] [data-action="modifier"]`)
      : document.querySelector('.vue-categories h1');
    if (!cible) return;
    if (!idLigne) cible.setAttribute('tabindex', '-1');
    cible.focus();
  }

  vue.querySelector('.lien-retour').addEventListener('click', (e) => {
    if (!ctx.peutRevenir || !ctx.peutRevenir()) return; // sinon le lien mène à #/depenses
    e.preventDefault();
    window.history.back();
  });

  brancherFormCategorie({
    form: vue.querySelector('form'),
    prefixe: 'cat-nouvelle',
    categories,
    message: ERREUR_ENREGISTREMENT,
    onEnregistre: (categorie) => rafraichirPuisFocus(categorie.id),
  });

  vue.addEventListener('click', async (e) => {
    const bouton = e.target.closest('button[data-action]');
    if (!bouton || !bouton.closest('li') || occupe) return;
    const categorie = categories.find((c) => c.id === bouton.closest('li').dataset.id);
    if (!categorie || categorie.parDefaut) return;

    if (bouton.dataset.action === 'modifier') {
      ouvrirFormCategorie({
        categorie,
        categories,
        declencheur: bouton,
        onEnregistre: (modifiee) => rafraichirPuisFocus(modifiee.id),
      });
      return;
    }

    if (!window.confirm(confirmationSuppression(categorie.nom))) return;
    occupe = true;
    alerte.hidden = true;
    try {
      await supprimerCategorie(categorie.id);
    } catch (erreur) {
      console.error(erreur);
      occupe = false;
      alerte.textContent = ERREUR_SUPPRESSION;
      alerte.hidden = false;
      return;
    }
    occupe = false;
    await rafraichirPuisFocus(null);
  });
}
