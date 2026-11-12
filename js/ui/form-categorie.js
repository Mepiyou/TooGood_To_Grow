import { echapper } from './dom.js';
import { PALETTE, validerCategorie } from '../domain/categories.js';
import { creerCategorie, modifierCategorie } from '../store/categories.js';

// Noms lus par les lecteurs d'écran, dans l'ordre de PALETTE.
export const NOMS_COULEURS = ['Framboise', 'Vert', 'Bleu', 'Orange', 'Violet', 'Gris'];

const ERREUR_ENREGISTREMENT = "Impossible d'enregistrer la catégorie. Réessaie dans un instant.";

function gabarit(categorie) {
  const couleurCochee = categorie ? categorie.couleur : PALETTE[0];
  const pastilles = PALETTE.map((couleur, i) => `<label class="choix-couleur">
      <input type="radio" name="couleur" value="${couleur}" aria-label="${NOMS_COULEURS[i]}"${couleur === couleurCochee ? ' checked' : ''}>
      <span class="pastille-couleur" style="background:${couleur}" aria-hidden="true"></span>
    </label>`).join('');
  return `<form class="formulaire" novalidate>
    <h2 id="form-categorie-titre">${categorie ? 'Modifier la catégorie' : 'Nouvelle catégorie'}</h2>
    <div class="champ">
      <label for="form-categorie-nom">Nom</label>
      <input id="form-categorie-nom" name="nom" type="text" maxlength="30" autocomplete="off" value="${categorie ? echapper(categorie.nom) : ''}">
      <p class="erreur-champ" id="form-categorie-nom-erreur" hidden></p>
    </div>
    <fieldset class="champ" id="form-categorie-couleurs">
      <legend>Couleur</legend>
      <div class="grille-couleurs">${pastilles}</div>
      <p class="erreur-champ" id="form-categorie-couleur-erreur" hidden></p>
    </fieldset>
    <p class="erreur-formulaire" role="alert" hidden></p>
    <div class="actions">
      <button type="submit" class="bouton bouton-principal">${categorie ? 'Enregistrer' : 'Créer la catégorie'}</button>
      <button type="button" class="bouton" data-action="annuler">Annuler</button>
    </div>
  </form>`;
}

// Formulaire de création (ou de modification si `categorie`) d'une catégorie, dans un dialog créé à l'ouverture
// et retiré à la fermeture. `categories` sert au contrôle d'unicité du nom.
// Après l'écriture, le dialog se ferme puis `onEnregistre(categorie)` est appelé : c'est lui qui pose le focus.
// Sur Annuler ou Échap, le focus revient à l'élément qui avait le focus à l'ouverture.
// Pas de `creerPanneau` ici : il rafraîchit l'écran après l'écriture, ce qui viderait la saisie de dépense en cours.
export function ouvrirFormCategorie({ categorie = null, categories, onEnregistre }) {
  const declencheur = document.activeElement;
  const dialog = document.createElement('dialog');
  dialog.className = 'panneau';
  dialog.setAttribute('aria-labelledby', 'form-categorie-titre');
  dialog.innerHTML = gabarit(categorie);
  document.body.append(dialog);

  const form = dialog.querySelector('form');
  const nom = form.elements.nom;
  const fieldsetCouleurs = dialog.querySelector('#form-categorie-couleurs');
  const radios = [...form.querySelectorAll('input[name="couleur"]')];
  const erreurFormulaire = dialog.querySelector('.erreur-formulaire');
  const boutons = [...dialog.querySelectorAll('button')];
  let occupe = false;
  let enregistree = null;

  function marquer(element, message, cibles) {
    element.textContent = message;
    element.hidden = message === '';
    for (const cible of cibles) {
      // aria-invalid n'est pas permis sur un fieldset (rôle group) : le message y est seulement relié.
      if (message) {
        if (cible.tagName !== 'FIELDSET') cible.setAttribute('aria-invalid', 'true');
        cible.setAttribute('aria-describedby', element.id);
      } else {
        cible.removeAttribute('aria-invalid');
        cible.removeAttribute('aria-describedby');
      }
    }
  }

  function afficherErreur(erreur) {
    const champ = erreur ? erreur.champ : null;
    marquer(dialog.querySelector('#form-categorie-nom-erreur'), champ === 'nom' ? erreur.message : '', [nom]);
    marquer(dialog.querySelector('#form-categorie-couleur-erreur'), champ === 'couleur' ? erreur.message : '', [fieldsetCouleurs]);
    if (champ === 'nom') nom.focus();
    if (champ === 'couleur') radios[0].focus();
  }

  function occuper(etat) {
    occupe = etat;
    for (const bouton of boutons) bouton.disabled = etat;
  }

  function fermerSurNavigation() {
    if (dialog.open && !occupe) dialog.close();
  }

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (occupe) return;
    erreurFormulaire.hidden = true;
    const coche = radios.find((r) => r.checked);
    const valeurs = { nom: nom.value, couleur: coche ? coche.value : null };
    const erreur = validerCategorie(valeurs, categories, categorie ? categorie.id : undefined);
    afficherErreur(erreur);
    if (erreur) return;
    occuper(true);
    try {
      enregistree = categorie ? await modifierCategorie(categorie.id, valeurs) : await creerCategorie(valeurs);
    } catch (erreurEcriture) {
      console.error(erreurEcriture);
      occuper(false);
      erreurFormulaire.textContent = ERREUR_ENREGISTREMENT;
      erreurFormulaire.hidden = false;
      return;
    }
    occuper(false);
    dialog.close();
  });

  // Échap ne ferme pas pendant l'écriture : l'éventuelle erreur s'afficherait dans un dialog fermé.
  dialog.addEventListener('cancel', (e) => {
    if (occupe) e.preventDefault();
  });

  dialog.querySelector('[data-action="annuler"]').addEventListener('click', () => dialog.close());

  // Le dialog est hors de la vue : un retour arrière pendant la saisie ne doit pas le laisser ouvert sur un autre écran.
  window.addEventListener('hashchange', fermerSurNavigation);

  dialog.addEventListener('close', () => {
    window.removeEventListener('hashchange', fermerSurNavigation);
    dialog.remove();
    if (enregistree) onEnregistre(enregistree);
    else if (declencheur && declencheur.isConnected) declencheur.focus();
  });

  dialog.showModal();
  nom.focus();
}
