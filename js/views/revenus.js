import { echapper } from '../ui/dom.js';
import { formatMontant, formatJourMois } from '../ui/format.js';
import { rendreOngletsMois } from '../ui/onglets.js';
import { revenusDuMois, totalRevenusAttendus, validerRevenu } from '../domain/budget.js';
import { centimesVersSaisie } from '../domain/montant.js';
import { moisDe } from '../domain/dates.js';
import { listerRevenus, enregistrerRevenu, supprimerRevenu } from '../store/revenus.js';

const MENTION_MOIS_SUIVANT = 'compte le mois suivant';
const CHAMPS = ['nom', 'montant', 'jour', 'date'];
const ERREUR_ENREGISTREMENT = "Impossible d'enregistrer ce revenu. Réessaie dans un instant.";
const ERREUR_SUPPRESSION = 'Impossible de supprimer ce revenu. Réessaie dans un instant.';

function quand(revenu) {
  return revenu.recurrent ? `le ${revenu.jour}` : `le ${formatJourMois(revenu.date)}`;
}

// « Récurrent · le 5 », « Ponctuel · le 12 nov. » (+ « · compte le mois suivant ») : D15.
export function sousTitreRevenu(revenu) {
  const parties = [revenu.recurrent ? 'Récurrent' : 'Ponctuel', quand(revenu)];
  if (revenu.moisSuivant) parties.push(MENTION_MOIS_SUIVANT);
  return parties.join(' · ');
}

export function libelleLigneRevenu(revenu) {
  const parties = [revenu.nom, formatMontant(revenu.montant), revenu.recurrent ? 'récurrent' : 'ponctuel', quand(revenu)];
  if (revenu.moisSuivant) parties.push(MENTION_MOIS_SUIVANT);
  return `Modifier : ${parties.join(', ')}`;
}

function rendreLigne(revenu) {
  return `<li><button type="button" class="ligne" data-id="${echapper(revenu.id)}" aria-label="${echapper(libelleLigneRevenu(revenu))}">
    <span class="ligne-texte"><span class="ligne-nom">${echapper(revenu.nom)}</span><span class="ligne-sous-titre">${echapper(sousTitreRevenu(revenu))}</span></span>
    <span class="ligne-montant">${echapper(formatMontant(revenu.montant))}</span>
  </button></li>`;
}

function erreurChamp(champ) {
  return `<p class="erreur-champ" id="revenu-${champ}-erreur" hidden></p>`;
}

const DIALOG = `<dialog class="panneau" aria-labelledby="revenu-titre">
  <form class="formulaire" novalidate>
    <h2 id="revenu-titre">Ajouter un revenu</h2>
    <div class="champ">
      <label for="revenu-nom">Nom</label>
      <input id="revenu-nom" name="nom" type="text" maxlength="40" autocomplete="off">
      ${erreurChamp('nom')}
    </div>
    <div class="champ">
      <label for="revenu-montant">Montant</label>
      <input id="revenu-montant" name="montant" type="text" inputmode="decimal" autocomplete="off">
      ${erreurChamp('montant')}
    </div>
    <fieldset class="champ groupe-options">
      <legend>Type</legend>
      <label class="option"><input type="radio" name="type" value="recurrent"> Récurrent (chaque mois)</label>
      <label class="option"><input type="radio" name="type" value="ponctuel"> Ponctuel</label>
    </fieldset>
    <div class="champ" data-pour="recurrent">
      <label for="revenu-jour">Jour de réception</label>
      <input id="revenu-jour" name="jour" type="number" min="1" max="31" step="1" inputmode="numeric" autocomplete="off">
      ${erreurChamp('jour')}
    </div>
    <div class="champ" data-pour="ponctuel">
      <label for="revenu-date">Date de réception</label>
      <input id="revenu-date" name="date" type="date">
      ${erreurChamp('date')}
    </div>
    <div class="champ">
      <label class="option"><input type="checkbox" name="moisSuivant"> Compte pour le mois suivant</label>
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
  const revenus = await listerRevenus();
  if (!ctx.estActuel()) return;
  const mois = moisDe(ctx.aujourdhui());
  const liste = revenusDuMois(revenus, mois);
  const total = totalRevenusAttendus(revenus, mois);

  container.innerHTML = `<div class="vue-revenus">
    <h1>Mon mois</h1>
    ${rendreOngletsMois('revenus')}
    <p class="total-mois">Total du mois : <strong>${echapper(formatMontant(total))}</strong></p>
    ${liste.length > 0
    ? `<ul class="liste-lignes">${liste.map(rendreLigne).join('')}</ul>`
    : '<p class="secondaire etat-vide">Aucun revenu pour l\'instant.</p>'}
    <button type="button" class="bouton bouton-ajout" data-action="ajouter">Ajouter un revenu</button>
    ${DIALOG}
  </div>`;

  const parId = new Map(liste.map((r) => [r.id, r]));
  const dialog = container.querySelector('dialog');
  const form = dialog.querySelector('form');
  const champs = form.elements;
  const titre = dialog.querySelector('#revenu-titre');
  const erreurFormulaire = dialog.querySelector('.erreur-formulaire');
  const boutonSupprimer = dialog.querySelector('[data-action="supprimer"]');
  const boutons = [...dialog.querySelectorAll('button')];

  let enCours = null; // { revenu (ou null en ajout), declencheur }
  let occupe = false;

  function majType() {
    const type = champs.type.value;
    for (const bloc of dialog.querySelectorAll('[data-pour]')) bloc.hidden = bloc.dataset.pour !== type;
  }

  function afficherErreurs(erreurs) {
    let premier = null;
    for (const champ of CHAMPS) {
      const input = champs[champ];
      const message = dialog.querySelector(`#revenu-${champ}-erreur`);
      const texte = erreurs[champ] || '';
      message.textContent = texte;
      message.hidden = texte === '';
      if (texte) {
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', message.id);
        if (!premier) premier = input;
      } else {
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
      }
    }
    if (premier) premier.focus();
  }

  function signalerEchec(texte) {
    erreurFormulaire.textContent = texte;
    erreurFormulaire.hidden = false;
  }

  function ouvrir(revenu, declencheur) {
    enCours = { revenu, declencheur };
    form.reset();
    afficherErreurs({});
    erreurFormulaire.hidden = true;
    titre.textContent = revenu ? 'Modifier le revenu' : 'Ajouter un revenu';
    boutonSupprimer.hidden = !revenu;
    champs.nom.value = revenu ? revenu.nom : '';
    champs.montant.value = revenu ? centimesVersSaisie(revenu.montant) : '';
    champs.type.value = !revenu || revenu.recurrent ? 'recurrent' : 'ponctuel';
    champs.jour.value = revenu && revenu.recurrent ? String(revenu.jour) : '';
    champs.date.value = revenu && !revenu.recurrent ? revenu.date : ctx.aujourdhui();
    champs.moisSuivant.checked = Boolean(revenu && revenu.moisSuivant);
    majType();
    dialog.showModal();
    champs.nom.focus();
  }

  function occuper(etat) {
    occupe = etat;
    for (const bouton of boutons) bouton.disabled = etat;
  }

  // Après rafraîchissement, le focus va à la ligne concernée, sinon au bouton d'ajout.
  async function terminer(idAFocaliser) {
    dialog.close();
    await ctx.rafraichir();
    const vue = document.querySelector('#app .vue-revenus');
    if (!vue) return;
    const ligne = idAFocaliser ? vue.querySelector(`.ligne[data-id="${CSS.escape(idAFocaliser)}"]`) : null;
    const cible = ligne || vue.querySelector('[data-action="ajouter"]');
    if (cible) cible.focus();
  }

  dialog.addEventListener('close', () => {
    const declencheur = enCours && enCours.declencheur;
    enCours = null;
    if (declencheur && declencheur.isConnected) declencheur.focus();
  });

  form.addEventListener('change', (e) => {
    if (e.target.name === 'type') majType();
  });

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (occupe || !enCours) return;
    erreurFormulaire.hidden = true;
    const resultat = validerRevenu({
      nom: champs.nom.value,
      montantTexte: champs.montant.value,
      recurrent: champs.type.value === 'recurrent',
      jour: champs.jour.value,
      date: champs.date.value,
      moisSuivant: champs.moisSuivant.checked,
    });
    afficherErreurs(resultat.erreurs);
    if (!resultat.ok) return;
    const { revenu } = enCours;
    occuper(true);
    try {
      const enregistre = await enregistrerRevenu(resultat.valeurs, { id: revenu ? revenu.id : undefined, moisCourant: mois });
      occuper(false);
      await terminer(enregistre.id);
    } catch (erreur) {
      console.error(erreur);
      occuper(false);
      signalerEchec(ERREUR_ENREGISTREMENT);
    }
  });

  dialog.querySelector('[data-action="annuler"]').addEventListener('click', () => dialog.close());

  boutonSupprimer.addEventListener('click', async () => {
    if (occupe || !enCours || !enCours.revenu) return;
    const { revenu } = enCours;
    if (!window.confirm(`Supprimer le revenu « ${revenu.nom} » ?`)) return;
    occuper(true);
    try {
      await supprimerRevenu(revenu.id);
      occuper(false);
      await terminer(null);
    } catch (erreur) {
      console.error(erreur);
      occuper(false);
      signalerEchec(ERREUR_SUPPRESSION);
    }
  });

  container.querySelector('[data-action="ajouter"]').addEventListener('click', (e) => ouvrir(null, e.currentTarget));

  const listeLignes = container.querySelector('.liste-lignes');
  if (listeLignes) {
    listeLignes.addEventListener('click', (e) => {
      const ligne = e.target.closest('.ligne');
      if (ligne && parId.has(ligne.dataset.id)) ouvrir(parId.get(ligne.dataset.id), ligne);
    });
  }
}
