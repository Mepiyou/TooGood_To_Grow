import { echapper } from './dom.js';
import { PALETTE, validerCategorie } from '../domain/categories.js';
import { creerCategorie, modifierCategorie } from '../store/categories.js';

// Noms lus par les lecteurs d'écran, dans l'ordre de PALETTE.
export const NOMS_COULEURS = ['Framboise', 'Vert', 'Bleu', 'Orange', 'Violet', 'Gris'];

const ERREUR_ENREGISTREMENT = "Impossible d'enregistrer la catégorie. Réessaie dans un instant.";

// `prefixe` préfixe les ids : le formulaire intégré et le dialog peuvent coexister dans la page.
// `titre` ajoute un h2 (le dialog s'y réfère), `annulable` ajoute le bouton Annuler.
export function gabaritFormCategorie({ prefixe, categorie = null, titre = null, annulable = false }) {
  const couleurCochee = categorie ? categorie.couleur : PALETTE[0];
  const pastilles = PALETTE.map((couleur, i) => `<label class="choix-couleur">
      <input type="radio" name="couleur" value="${couleur}" aria-label="${NOMS_COULEURS[i]}"${couleur === couleurCochee ? ' checked' : ''}>
      <span class="pastille-couleur" style="background:${couleur}" aria-hidden="true"></span>
    </label>`).join('');
  return `<form class="formulaire" novalidate>
    ${titre ? `<h2 id="${prefixe}-titre">${echapper(titre)}</h2>` : ''}
    <div class="champ">
      <label for="${prefixe}-nom">Nom</label>
      <input id="${prefixe}-nom" name="nom" type="text" maxlength="30" autocomplete="off" value="${categorie ? echapper(categorie.nom) : ''}">
      <p class="erreur-champ" id="${prefixe}-nom-erreur" hidden></p>
    </div>
    <fieldset class="champ" id="${prefixe}-couleurs">
      <legend>Couleur</legend>
      <div class="grille-couleurs">${pastilles}</div>
      <p class="erreur-champ" id="${prefixe}-couleur-erreur" hidden></p>
    </fieldset>
    <p class="erreur-formulaire" role="alert" hidden></p>
    <div class="actions">
      <button type="submit" class="bouton bouton-principal">${categorie ? 'Enregistrer' : 'Créer la catégorie'}</button>
      ${annulable ? '<button type="button" class="bouton" data-action="annuler">Annuler</button>' : ''}
    </div>
  </form>`;
}

// Branche validation et écriture sur un formulaire issu de `gabaritFormCategorie`.
// `onEnregistre(categorie)` est appelé une fois l'écriture faite et les boutons réactivés.
// `message` remplace le message d'échec par défaut. Renvoie `estOccupe()` (écriture en cours).
export function brancherFormCategorie({ form, prefixe, categorie = null, categories, onEnregistre, message = ERREUR_ENREGISTREMENT }) {
  const nom = form.elements.nom;
  const fieldsetCouleurs = form.querySelector(`#${prefixe}-couleurs`);
  const radios = [...form.querySelectorAll('input[name="couleur"]')];
  const erreurFormulaire = form.querySelector('.erreur-formulaire');
  const boutons = [...form.querySelectorAll('button')];
  let occupe = false;

  function marquer(element, texte, cibles) {
    element.textContent = texte;
    element.hidden = texte === '';
    for (const cible of cibles) {
      // aria-invalid n'est pas permis sur un fieldset (rôle group) : le message y est seulement relié.
      if (texte) {
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
    marquer(form.querySelector(`#${prefixe}-nom-erreur`), champ === 'nom' ? erreur.message : '', [nom]);
    marquer(form.querySelector(`#${prefixe}-couleur-erreur`), champ === 'couleur' ? erreur.message : '', [fieldsetCouleurs]);
    if (champ === 'nom') nom.focus();
    if (champ === 'couleur') radios[0].focus();
  }

  function occuper(etat) {
    occupe = etat;
    for (const bouton of boutons) bouton.disabled = etat;
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
    let enregistree;
    try {
      enregistree = categorie ? await modifierCategorie(categorie.id, valeurs) : await creerCategorie(valeurs);
    } catch (erreurEcriture) {
      console.error(erreurEcriture);
      occuper(false);
      erreurFormulaire.textContent = message;
      erreurFormulaire.hidden = false;
      return;
    }
    occuper(false);
    onEnregistre(enregistree);
  });

  return { estOccupe: () => occupe };
}

// Formulaire de création (ou de modification si `categorie`) d'une catégorie, dans un dialog créé à l'ouverture
// et retiré à la fermeture. `categories` sert au contrôle d'unicité du nom.
// Après l'écriture, le dialog se ferme puis `onEnregistre(categorie)` est appelé : c'est lui qui pose le focus.
// Sur Annuler ou Échap, le focus revient sur `declencheur` (par défaut l'élément qui avait le focus à l'ouverture) :
// Safari iOS ne donne pas le focus au bouton touché, d'où l'option explicite.
// Pas de `creerPanneau` ici : il rafraîchit l'écran après l'écriture, ce qui viderait la saisie de dépense en cours.
export function ouvrirFormCategorie({ categorie = null, categories, onEnregistre, declencheur = document.activeElement }) {
  const prefixe = 'form-categorie';
  const dialog = document.createElement('dialog');
  dialog.className = 'panneau';
  dialog.setAttribute('aria-labelledby', `${prefixe}-titre`);
  dialog.innerHTML = gabaritFormCategorie({
    prefixe,
    categorie,
    titre: categorie ? 'Modifier la catégorie' : 'Nouvelle catégorie',
    annulable: true,
  });
  document.body.append(dialog);

  const form = dialog.querySelector('form');
  let enregistree = null;

  const { estOccupe } = brancherFormCategorie({
    form,
    prefixe,
    categorie,
    categories,
    onEnregistre: (c) => {
      enregistree = c;
      dialog.close();
    },
  });

  function fermerSurNavigation() {
    if (dialog.open && !estOccupe()) dialog.close();
  }

  // Échap ne ferme pas pendant l'écriture : l'éventuelle erreur s'afficherait dans un dialog fermé.
  dialog.addEventListener('cancel', (e) => {
    if (estOccupe()) e.preventDefault();
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
  form.elements.nom.focus();
}
