import { echapper } from '../ui/dom.js';
import { formatMontant, formatNomMois } from '../ui/format.js';
import { rendreOngletsMois } from '../ui/onglets.js';
import { creerPanneau } from '../ui/panneau.js';
import { chargesActives, chargesDuMois, entreeEnVigueur, prochainChangement, validerCharge } from '../domain/charges.js';
import { centimesVersSaisie } from '../domain/montant.js';
import { moisDe, moisSuivant } from '../domain/dates.js';
import { listerCharges, enregistrerCharge, supprimerCharge } from '../store/charges.js';

const CHAMPS = ['nom', 'montant', 'jour'];
const ERREUR_ENREGISTREMENT = "Impossible d'enregistrer cette charge. Réessaie dans un instant.";
const ERREUR_SUPPRESSION = 'Impossible de supprimer cette charge. Réessaie dans un instant.';

function estSupprimee(charge, mois) {
  return charge.actifJusqua === mois;
}

// « 580 € à partir de décembre », « le 5 à partir de décembre » ; null si rien ne change.
function mentionChangement(charge, mois) {
  const actuelle = entreeEnVigueur(charge, mois);
  const futur = prochainChangement(charge, mois);
  if (!actuelle || !futur) return null;
  const parties = [];
  if (futur.montant !== actuelle.montant) parties.push(formatMontant(futur.montant));
  if (futur.jour !== actuelle.jour) parties.push(`le ${futur.jour}`);
  if (parties.length === 0) return null;
  return `${parties.join(', ')} à partir de ${formatNomMois(futur.depuis)}`;
}

// Jour enregistré tel quel (« le 31 ») : le report au dernier jour du mois relève du calcul (T6).
export function sousTitreCharge(charge, mois) {
  const parties = [`le ${entreeEnVigueur(charge, mois).jour}`];
  if (estSupprimee(charge, mois)) {
    parties.push(`supprimée à partir de ${formatNomMois(moisSuivant(mois))}`);
  } else {
    const changement = mentionChangement(charge, mois);
    if (changement) parties.push(changement);
  }
  return parties.join(' · ');
}

export function libelleLigneCharge(charge, mois) {
  const actuelle = entreeEnVigueur(charge, mois);
  const parties = [charge.nom, formatMontant(actuelle.montant), `le ${actuelle.jour}`];
  const changement = mentionChangement(charge, mois);
  if (changement) parties.push(changement);
  return `Modifier : ${parties.join(', ')}`;
}

// Une charge supprimée ce mois-ci reste affichée mais n'est plus modifiable :
// la ligne n'est alors pas un bouton, son texte se lit normalement.
function rendreLigne(charge, mois) {
  const contenu = `<span class="ligne-texte"><span class="ligne-nom">${echapper(charge.nom)}</span><span class="ligne-sous-titre">${echapper(sousTitreCharge(charge, mois))}</span></span>
    <span class="ligne-montant">${echapper(formatMontant(entreeEnVigueur(charge, mois).montant))}</span>`;
  if (estSupprimee(charge, mois)) return `<li><div class="ligne ligne-inactive">${contenu}</div></li>`;
  return `<li><button type="button" class="ligne" data-id="${echapper(charge.id)}" aria-label="${echapper(libelleLigneCharge(charge, mois))}">
    ${contenu}
  </button></li>`;
}

function erreurChamp(champ) {
  return `<p class="erreur-champ" id="charge-${champ}-erreur" hidden></p>`;
}

const DIALOG = `<dialog class="panneau" aria-labelledby="charge-titre">
  <form class="formulaire" novalidate>
    <h2 id="charge-titre">Ajouter une charge</h2>
    <p class="secondaire aide-formulaire" id="charge-aide" hidden>La modification s'appliquera à partir du mois prochain.</p>
    <div class="champ">
      <label for="charge-nom">Nom</label>
      <input id="charge-nom" name="nom" type="text" maxlength="40" autocomplete="off">
      ${erreurChamp('nom')}
    </div>
    <div class="champ">
      <label for="charge-montant">Montant</label>
      <input id="charge-montant" name="montant" type="text" inputmode="decimal" autocomplete="off">
      ${erreurChamp('montant')}
    </div>
    <div class="champ">
      <label for="charge-jour">Jour de prélèvement</label>
      <input id="charge-jour" name="jour" type="number" min="1" max="31" step="1" inputmode="numeric" autocomplete="off">
      ${erreurChamp('jour')}
    </div>
    <p class="erreur-formulaire" role="alert" hidden></p>
    <div class="actions">
      <button type="submit" class="bouton bouton-principal">Enregistrer</button>
      <button type="button" class="bouton" data-action="annuler">Annuler</button>
      <button type="button" class="bouton bouton-danger" data-action="supprimer">Supprimer</button>
    </div>
  </form>
</dialog>`;

export async function render(container, params, ctx) {
  const charges = await listerCharges();
  if (!ctx.estActuel()) return;
  const mois = moisDe(ctx.aujourdhui());
  const liste = chargesActives(charges, mois);
  const total = chargesDuMois(charges, mois);

  container.innerHTML = `<div class="vue-charges">
    <h1>Mon mois</h1>
    ${rendreOngletsMois('charges')}
    <p class="secondaire mention-mois">Déduites automatiquement chaque mois</p>
    <p class="total-mois">Total du mois : <strong>${echapper(formatMontant(total))}</strong></p>
    ${liste.length > 0
    ? `<ul class="liste-lignes">${liste.map((c) => rendreLigne(c, mois)).join('')}</ul>`
    : '<p class="secondaire etat-vide">Aucune charge pour l\'instant.</p>'}
    <button type="button" class="bouton bouton-ajout" data-action="ajouter">Ajouter une charge</button>
    ${DIALOG}
  </div>`;

  const parId = new Map(liste.filter((c) => !estSupprimee(c, mois)).map((c) => [c.id, c]));
  const panneau = creerPanneau(container, {
    prefixe: 'charge', champs: CHAMPS, selecteurVue: '.vue-charges', rafraichir: ctx.rafraichir,
  });
  const { dialog, champs } = panneau;
  const form = dialog.querySelector('form');
  const titre = dialog.querySelector('#charge-titre');
  const aide = dialog.querySelector('#charge-aide');
  const boutonSupprimer = dialog.querySelector('[data-action="supprimer"]');

  function ouvrir(charge, declencheur) {
    panneau.ouvrir(charge, declencheur, () => {
      titre.textContent = charge ? 'Modifier la charge' : 'Ajouter une charge';
      // D6 : le mois de sa création, une charge se corrige immédiatement, sans texte d'aide.
      aide.hidden = !(charge && charge.actifDepuis < mois);
      if (aide.hidden) dialog.removeAttribute('aria-describedby');
      else dialog.setAttribute('aria-describedby', aide.id);
      boutonSupprimer.hidden = !charge;
      // Montant et jour les plus récents : ceux qui s'appliqueront après la modification.
      champs.nom.value = charge ? charge.nom : '';
      champs.montant.value = charge ? centimesVersSaisie(charge.montant) : '';
      champs.jour.value = charge ? String(charge.jour) : '';
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const charge = panneau.courant();
    if (panneau.estOccupe() || charge === undefined) return;
    panneau.masquerEchec();
    const resultat = validerCharge({ nom: champs.nom.value, montantTexte: champs.montant.value, jour: champs.jour.value });
    panneau.afficherErreurs(resultat.erreurs);
    if (!resultat.ok) return;
    panneau.executer(async () => {
      const enregistree = await enregistrerCharge(resultat.valeurs, { id: charge ? charge.id : undefined, moisCourant: mois });
      return enregistree.id;
    }, ERREUR_ENREGISTREMENT);
  });

  boutonSupprimer.addEventListener('click', () => {
    const charge = panneau.courant();
    if (!charge) return;
    panneau.supprimer(
      `Supprimer la charge « ${charge.nom} » ? Elle reste déduite ce mois-ci.`,
      () => supprimerCharge(charge.id, mois),
      ERREUR_SUPPRESSION,
    );
  });

  container.querySelector('[data-action="ajouter"]').addEventListener('click', (e) => ouvrir(null, e.currentTarget));

  const listeLignes = container.querySelector('.liste-lignes');
  if (listeLignes) {
    listeLignes.addEventListener('click', (e) => {
      const ligne = e.target.closest('button.ligne');
      if (ligne && parId.has(ligne.dataset.id)) ouvrir(parId.get(ligne.dataset.id), ligne);
    });
  }
}
