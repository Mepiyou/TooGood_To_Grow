import { echapper, couleurSure, COULEUR_REPLI } from '../ui/dom.js';
import { formatMontant, formatJourSemaine, formatNomMois } from '../ui/format.js';
import { rendreOngletsDepenses } from '../ui/onglets.js';
import { rendreDonut } from '../ui/donut.js';
import { calculerResume, repartitionDonut } from '../domain/resume.js';
import { categorieDeRepli } from '../domain/categories.js';
import { groupesParJour, totalDepenses } from '../domain/depenses.js';
import { moisDe, moisAChange } from '../domain/dates.js';
import { listerCategories } from '../store/categories.js';
import { depensesDuMois, supprimerDepense } from '../store/depenses.js';

const ERREUR_SUPPRESSION = 'Impossible de supprimer la dépense. Réessaie.';

// « Courses, 12 € » : suffixe des aria-label « Modifier : … » et « Supprimer : … ».
export function libelleDepense(nomCategorie, montant) {
  return `${nomCategorie}, ${formatMontant(montant)}`;
}

// Après une suppression : la ligne suivante, sinon la précédente, sinon rien (le focus va alors au titre).
export function idAFocaliser(ids, idSupprime) {
  const i = ids.indexOf(idSupprime);
  if (i === -1) return null;
  return ids[i + 1] ?? ids[i - 1] ?? null;
}

const ICONE_MODIFIER = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 20h4L19 9l-4-4L4 16z"/><path d="M13.5 6.5l4 4"/></svg>';
const ICONE_SUPPRIMER = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/></svg>';

function rendreLigne(depense, categorie) {
  const libelle = echapper(libelleDepense(categorie.nom, depense.montant));
  return `<li class="ligne-depense" data-id="${echapper(depense.id)}">
    <span class="pastille" style="background:${couleurSure(categorie.couleur)}" aria-hidden="true"></span>
    <span class="ligne-nom">${echapper(categorie.nom)}</span>
    <span class="ligne-montant">${echapper(formatMontant(depense.montant))}</span>
    <a class="bouton-icone" href="#/ajout/${encodeURIComponent(depense.id)}" aria-label="Modifier : ${libelle}">${ICONE_MODIFIER}</a>
    <button type="button" class="bouton-icone" data-action="supprimer" aria-label="Supprimer : ${libelle}">${ICONE_SUPPRIMER}</button>
  </li>`;
}

export async function render(container, params, ctx) {
  const mois = moisDe(ctx.aujourdhui());
  const [depenses, categories] = await Promise.all([depensesDuMois(mois), listerCategories()]);
  if (!ctx.estActuel()) return;

  const groupes = groupesParJour(depenses);
  const parId = new Map(depenses.map((d) => [d.id, d]));
  const categorieDe = (depense) => {
    const id = categorieDeRepli(depense.categorieId, categories);
    return categories.find((c) => c.id === id) ?? { nom: 'Autre', couleur: COULEUR_REPLI };
  };

  const total = totalDepenses(depenses);
  const repartition = repartitionDonut(calculerResume(mois, depenses).parCategorie, categories);
  const donut = repartition.length > 0 ? rendreDonut(repartition, total, formatNomMois(mois)) : '';

  container.innerHTML = `<div class="vue-depenses">
    <h1>Dépenses</h1>
    ${rendreOngletsDepenses('ce-mois')}
    ${donut}
    <p class="total-mois">Total du mois : <strong>${echapper(formatMontant(total))}</strong></p>
    ${groupes.length > 0
    ? groupes.map((g) => `<section class="groupe-jour">
      <h2>${echapper(formatJourSemaine(g.date))}</h2>
      <ul class="liste-lignes">${g.depenses.map((d) => rendreLigne(d, categorieDe(d))).join('')}</ul>
    </section>`).join('')
    : `<p class="secondaire etat-vide">Aucune dépense ce mois-ci.</p>
    <a class="bouton" href="#/ajout">Ajouter une dépense</a>`}
    <p class="lien-categories"><a href="#/categories">Gérer les catégories</a></p>
    <p class="erreur-formulaire" role="alert" hidden></p>
  </div>`;

  const vue = container.querySelector('.vue-depenses');
  const alerte = vue.querySelector('[role="alert"]');
  const ordre = groupes.flatMap((g) => g.depenses.map((d) => d.id));
  let occupe = false;

  vue.addEventListener('click', async (e) => {
    const bouton = e.target.closest('button[data-action="supprimer"]');
    if (!bouton || occupe) return;
    const id = bouton.closest('li').dataset.id;
    const depense = parId.get(id);
    if (!depense) return;
    const nom = categorieDe(depense).nom;
    if (!window.confirm(`Supprimer cette dépense de ${formatMontant(depense.montant)} (${nom}) ?`)) return;
    if (moisAChange(mois, ctx.aujourdhui())) {
      ctx.rafraichir();
      return;
    }
    occupe = true;
    alerte.hidden = true;
    const hote = container.parentNode;
    try {
      await supprimerDepense(id);
    } catch (erreur) {
      console.error(erreur);
      occupe = false;
      alerte.textContent = ERREUR_SUPPRESSION;
      alerte.hidden = false;
      return;
    }
    occupe = false;
    await ctx.rafraichir();
    // Le routeur a remplacé le conteneur : on cherche la nouvelle vue dans l'hôte de l'ancien.
    const nouvelle = hote ? hote.querySelector('.vue-depenses') : null;
    if (!nouvelle) return;
    const suivant = idAFocaliser(ordre, id);
    // Le lien « Modifier » est non destructif : un tap réflexe n'ouvre pas de confirmation de suppression.
    const lien = suivant ? nouvelle.querySelector(`li[data-id="${CSS.escape(suivant)}"] a.bouton-icone`) : null;
    if (lien) {
      lien.focus();
    } else {
      const titre = nouvelle.querySelector('h1');
      titre.setAttribute('tabindex', '-1');
      titre.focus();
    }
  });
}
