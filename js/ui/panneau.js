import { moisAChange } from '../domain/dates.js';

// Panneau de formulaire (dialog natif) commun aux écrans de « Mon mois ».
// Le dialog doit contenir un `form` avec un champ par nom de `champs`, un message d'erreur
// `#<prefixe>-<champ>-erreur` sous chaque champ, un `.erreur-formulaire` et un bouton `[data-action="annuler"]`.
// `selecteurVue` désigne la racine de la vue, retrouvée après rafraîchissement pour y poser le focus.
// `moisAffiche` est le mois de l'écran, `aujourdhui` renvoie la date du jour : si le mois a changé depuis le rendu,
// rien n'est écrit, le panneau se ferme et l'écran est rafraîchi.
export function creerPanneau(container, { prefixe, champs, selecteurVue, rafraichir, moisAffiche, aujourdhui }) {
  const dialog = container.querySelector('dialog');
  const form = dialog.querySelector('form');
  const erreurFormulaire = dialog.querySelector('.erreur-formulaire');
  const boutons = [...dialog.querySelectorAll('button')];

  let enCours = null; // { element (null en ajout), declencheur }
  let occupe = false;

  function afficherErreurs(erreurs) {
    let premier = null;
    for (const champ of champs) {
      const input = form.elements[champ];
      const message = dialog.querySelector(`#${prefixe}-${champ}-erreur`);
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

  function masquerEchec() {
    erreurFormulaire.hidden = true;
  }

  function occuper(etat) {
    occupe = etat;
    for (const bouton of boutons) bouton.disabled = etat;
  }

  // `remplir` renseigne les champs après la remise à zéro du formulaire.
  function ouvrir(element, declencheur, remplir) {
    enCours = { element, declencheur };
    form.reset();
    afficherErreurs({});
    masquerEchec();
    remplir();
    dialog.showModal();
    form.elements[champs[0]].focus();
  }

  // Après rafraîchissement, le focus va à la ligne concernée, sinon au bouton d'ajout.
  // Le routeur remplace le conteneur de la vue : on cherche la nouvelle vue dans l'hôte de l'ancien.
  async function terminer(idAFocaliser) {
    const hote = container.parentNode;
    dialog.close();
    await rafraichir();
    const vue = hote ? hote.querySelector(selecteurVue) : null;
    if (!vue) return;
    const ligne = idAFocaliser ? vue.querySelector(`.ligne[data-id="${CSS.escape(idAFocaliser)}"]`) : null;
    const cible = ligne || vue.querySelector('[data-action="ajouter"]');
    if (cible) cible.focus();
  }

  // Vrai (et écran rafraîchi) si le mois a changé : l'appelant ne doit alors rien écrire.
  function moisPerime() {
    if (!moisAChange(moisAffiche, aujourdhui())) return false;
    terminer(null);
    return true;
  }

  // `action` écrit puis renvoie l'id à focaliser (ou null) ; en cas d'échec, le message reste dans le dialog.
  async function executer(action, messageEchec) {
    if (occupe || !enCours) return;
    if (moisPerime()) return;
    occuper(true);
    try {
      const id = await action();
      occuper(false);
      await terminer(id);
    } catch (erreur) {
      console.error(erreur);
      occuper(false);
      signalerEchec(messageEchec);
    }
  }

  async function supprimer(question, action, messageEchec) {
    if (occupe || !enCours || !enCours.element) return;
    if (!window.confirm(question)) return;
    if (moisPerime()) return;
    await executer(async () => {
      await action();
      return null;
    }, messageEchec);
  }

  // Échap ne doit pas fermer le formulaire pendant l'écriture : une erreur serait affichée dans un dialog fermé.
  dialog.addEventListener('cancel', (e) => {
    if (occupe) e.preventDefault();
  });

  dialog.addEventListener('close', () => {
    const declencheur = enCours && enCours.declencheur;
    enCours = null;
    if (declencheur && declencheur.isConnected) declencheur.focus();
  });

  dialog.querySelector('[data-action="annuler"]').addEventListener('click', () => dialog.close());

  return {
    dialog,
    champs: form.elements,
    ouvrir,
    afficherErreurs,
    signalerEchec,
    masquerEchec,
    moisPerime,
    executer,
    supprimer,
    // Élément en cours de modification : undefined si le dialog est fermé, null en ajout.
    courant: () => (enCours ? enCours.element : undefined),
    estOccupe: () => occupe,
  };
}
