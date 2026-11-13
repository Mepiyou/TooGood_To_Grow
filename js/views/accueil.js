import { echapper, couleurSure, COULEUR_REPLI } from '../ui/dom.js';
import { formatMontant, formatSoldeQuotidien, formatDateLongue, formatJourMois } from '../ui/format.js';
import { ligneResteAVivre, texteAvertissement, estPremierLancement } from '../ui/textes-accueil.js';
import { calculerAccueil } from '../domain/budget.js';
import { categorieDeRepli } from '../domain/categories.js';
import { trierParDateDesc } from '../domain/depenses.js';
import { moisDe } from '../domain/dates.js';
import { listerRevenus } from '../store/revenus.js';
import { listerCharges } from '../store/charges.js';
import { depensesDuMois } from '../store/depenses.js';
import { listerCategories } from '../store/categories.js';
import { listerEnveloppes } from '../store/enveloppes.js';
import { listerProvisions } from '../store/provisions.js';

const NB_DERNIERES = 3;

function rendreInvitation() {
  return `<section class="carte-accueil" aria-labelledby="titre-carte">
    <h2 id="titre-carte" class="carte-invitation">Commence par ajouter tes revenus</h2>
    <a class="bouton bouton-principal" href="#/mois/revenus">Ajouter mon premier revenu</a>
  </section>`;
}

// Texte visible masqué aux lecteurs d'écran, remplacé par un texte masqué visuellement (« 12 euros par jour ») :
// « 12 €/jour » serait lu « barre jour ». La coupure n'est permise qu'entre le montant et « /jour ».
function rendreCarte(accueil, aujourdhui) {
  const solde = formatSoldeQuotidien(accueil.soldeQuotidien);
  const avertissement = texteAvertissement(accueil);
  return `<section class="carte-accueil" aria-labelledby="titre-carte">
    <h2 id="titre-carte" class="carte-titre">Tu peux dépenser</h2>
    <p class="solde-quotidien"><span aria-hidden="true">${echapper(formatMontant(accueil.soldeQuotidien))}<wbr><span class="solde-unite">/jour</span></span><span class="visuellement-masque">${echapper(solde.lu)}</span></p>
    <p class="reste-a-vivre">${echapper(ligneResteAVivre({ ...accueil, aujourdhui }))}</p>
    ${avertissement ? `<p class="avertissement-budget">${echapper(avertissement)}</p>` : ''}
  </section>`;
}

function rendreLigne(depense, categorie) {
  return `<li class="ligne-depense">
    <span class="pastille" style="background:${couleurSure(categorie.couleur)}" aria-hidden="true"></span>
    <span class="ligne-texte">
      <span class="ligne-nom">${echapper(categorie.nom)}</span>
      <span class="ligne-sous-titre">${echapper(formatJourMois(depense.date))}</span>
    </span>
    <span class="ligne-montant">${echapper(formatMontant(depense.montant))}</span>
  </li>`;
}

function rendreDernieres(dernieres, categories) {
  const categorieDe = (depense) => {
    const id = categorieDeRepli(depense.categorieId, categories);
    return categories.find((c) => c.id === id) ?? { nom: 'Autre', couleur: COULEUR_REPLI };
  };
  return `<section class="dernieres-depenses" aria-labelledby="titre-dernieres">
    <div class="entete-section">
      <h2 id="titre-dernieres">Dernières dépenses</h2>
      ${dernieres.length > 0 ? '<a class="lien-tout-voir" href="#/depenses" aria-label="Tout voir : dépenses du mois">Tout voir</a>' : ''}
    </div>
    ${dernieres.length > 0
    ? `<ul class="liste-lignes">${dernieres.map((d) => rendreLigne(d, categorieDe(d))).join('')}</ul>`
    : '<p class="secondaire etat-vide">Aucune dépense pour l\'instant.</p>'}
  </section>`;
}

export async function render(container, params, ctx) {
  const aujourdhui = ctx.aujourdhui();
  const mois = moisDe(aujourdhui);
  const [revenus, charges, depenses, categories, enveloppes, provisions] = await Promise.all([
    listerRevenus(), listerCharges(), depensesDuMois(mois), listerCategories(), listerEnveloppes(), listerProvisions(),
  ]);
  if (!ctx.estActuel()) return;

  // Une seule lecture des dépenses du mois : elle sert au calcul et aux dernières dépenses.
  const dernieres = trierParDateDesc(depenses).slice(0, NB_DERNIERES);
  const carte = estPremierLancement(revenus)
    ? rendreInvitation()
    : rendreCarte(calculerAccueil({ revenus, charges, depenses, aujourdhui, enveloppes, provisions }), aujourdhui);

  container.innerHTML = `<div class="vue-accueil">
    <h1>TooGood To Grow</h1>
    <p class="secondaire">${echapper(formatDateLongue(aujourdhui))}</p>
    ${carte}
    ${rendreDernieres(dernieres, categories)}
  </div>`;
}
