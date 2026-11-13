import { echapper, couleurSure, COULEUR_REPLI } from '../ui/dom.js';
import { formatMontant, formatSoldeQuotidien, formatDateLongue, formatJourMois } from '../ui/format.js';
import { ligneResteAVivre, texteAvertissement, estPremierLancement, texteAlerte } from '../ui/textes-accueil.js';
import { calculerAccueil } from '../domain/budget.js';
import { calculerAlerte, depensesDesSeptDerniersJours, moisDesSeptDerniersJours } from '../domain/alertes.js';
import { categorieDeRepli } from '../domain/categories.js';
import { trierParDateDesc } from '../domain/depenses.js';
import { moisDe } from '../domain/dates.js';
import { listerRevenus } from '../store/revenus.js';
import { listerCharges } from '../store/charges.js';
import { depensesDuMois } from '../store/depenses.js';
import { listerCategories } from '../store/categories.js';
import { listerEnveloppes } from '../store/enveloppes.js';
import { listerProvisions } from '../store/provisions.js';
import { lireMeta, ecrireMeta } from '../store/meta.js';

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

// Bandeau US5 : même principe que le solde (texte visible masqué aux lecteurs d'écran, version lue à côté).
function rendreAlerte(alerte, accueil) {
  const { texte, lu } = texteAlerte(alerte, accueil.prochaineRentree);
  return `<div class="banniere-alerte bandeau-decouvert" role="alert">
    <p><span aria-hidden="true">${echapper(texte)}</span><span class="visuellement-masque">${echapper(lu)}</span></p>
  </div>`;
}

export async function render(container, params, ctx) {
  const aujourdhui = ctx.aujourdhui();
  const mois = moisDe(aujourdhui);
  // D46 : du 1er au 6, les dépenses du mois précédent entrent dans la moyenne des 7 jours.
  const moisFenetre = moisDesSeptDerniersJours(aujourdhui).filter((m) => m !== mois);
  const [revenus, charges, depenses, categories, enveloppes, provisions, alerteVueLe, ...precedentes] = await Promise.all([
    listerRevenus(), listerCharges(), depensesDuMois(mois), listerCategories(), listerEnveloppes(), listerProvisions(),
    lireMeta('alerteVueLe'), ...moisFenetre.map((m) => depensesDuMois(m)),
  ]);
  if (!ctx.estActuel()) return;

  // Une seule lecture des dépenses du mois : elle sert au calcul et aux dernières dépenses.
  const dernieres = trierParDateDesc(depenses).slice(0, NB_DERNIERES);
  let carte;
  let bandeau = '';
  let alerte = null;
  if (estPremierLancement(revenus)) {
    carte = rendreInvitation();
  } else {
    const accueil = calculerAccueil({ revenus, charges, depenses, aujourdhui, enveloppes, provisions });
    carte = rendreCarte(accueil, aujourdhui);
    alerte = calculerAlerte({
      resteAVivre: accueil.resteAVivre,
      depenses7Jours: depensesDesSeptDerniersJours([...precedentes.flat(), ...depenses], aujourdhui),
      joursRestants: accueil.joursRestants,
      aujourdhui,
      alerteVueLe,
    });
    // Déjà à découvert (ou à 0 €) : l'encart D18 de la carte le dit déjà ; une prévision « vers aujourd'hui »
    // à « 0 €/jour » n'apporterait rien. L'alerte n'est alors ni affichée ni marquée comme vue.
    if (accueil.resteAVivre <= 0) alerte = null;
    if (alerte) bandeau = rendreAlerte(alerte, accueil);
  }

  container.innerHTML = `<div class="vue-accueil">
    <h1>TooGood To Grow</h1>
    <p class="secondaire">${echapper(formatDateLongue(aujourdhui))}</p>
    ${bandeau}
    ${carte}
    ${rendreDernieres(dernieres, categories)}
  </div>`;

  // Une seule alerte par jour : le rendu suivant du même jour ne l'affiche plus.
  // Un échec d'écriture n'empêche pas l'affichage (l'alerte reviendrait simplement au rendu suivant).
  if (alerte) ecrireMeta('alerteVueLe', aujourdhui).catch((erreur) => console.error(erreur));
}
