import { lireTout } from '../db.js';
import { echapper, couleurSure } from '../ui/dom.js';
import { ouvrirFormCategorie } from '../ui/form-categorie.js';
import { categorieDeRepli } from '../domain/categories.js';
import { dateAJour } from '../domain/dates.js';
import { validerDepense, moisDetailSupprime } from '../domain/depenses.js';
import { centimesVersSaisie } from '../domain/montant.js';
import { listerCategories } from '../store/categories.js';
import { lireDepense, enregistrerDepense } from '../store/depenses.js';

const ERREUR_ENREGISTREMENT = "Impossible d'enregistrer la dépense. Réessaie.";

export function rendreBoutonCategorie(categorie, choisie) {
  return `<button type="button" class="categorie" data-id="${echapper(categorie.id)}" aria-pressed="${choisie ? 'true' : 'false'}">`
    + `<span class="pastille" style="background:${couleurSure(categorie.couleur)}" aria-hidden="true"></span>`
    + `<span class="categorie-nom">${echapper(categorie.nom)}</span></button>`;
}

function erreurChamp(champ) {
  return `<p class="erreur-champ" id="ajout-${champ}-erreur" hidden></p>`;
}

function rendreIntrouvable(container) {
  container.innerHTML = `<div class="vue-ajout">
    <h1>Modifier la dépense</h1>
    <p class="etat-vide">Cette dépense n'existe plus.</p>
    <a class="bouton" href="#/depenses">Voir les dépenses</a>
  </div>`;
}

export async function render(container, params, ctx) {
  const enModification = Boolean(params.id);
  const [categoriesLues, depense] = await Promise.all([
    listerCategories(),
    enModification ? lireDepense(params.id) : Promise.resolve(undefined),
  ]);
  if (!ctx.estActuel()) return;
  if (enModification && !depense) {
    rendreIntrouvable(container);
    return;
  }

  const categories = [...categoriesLues];
  let choisie = depense ? categorieDeRepli(depense.categorieId, categories) : null;
  let aujourdhui = ctx.aujourdhui();

  container.innerHTML = `<div class="vue-ajout">
    <a class="lien-retour" href="#/"><span aria-hidden="true">←</span> Retour</a>
    <h1>${enModification ? 'Modifier la dépense' : 'Ajouter une dépense'}</h1>
    <form class="formulaire" novalidate>
      <div class="champ champ-montant">
        <label for="ajout-montant">Montant</label>
        <div class="saisie-montant">
          <input id="ajout-montant" name="montant" type="text" inputmode="decimal" autocomplete="off" enterkeyhint="done" autofocus value="${depense ? echapper(centimesVersSaisie(depense.montant)) : ''}">
          <span class="suffixe-euro" aria-hidden="true">€</span>
        </div>
        ${erreurChamp('montant')}
      </div>
      <fieldset class="champ" id="ajout-categories">
        <legend>Catégorie</legend>
        <div class="grille-categories">
          ${categories.map((c) => rendreBoutonCategorie(c, c.id === choisie)).join('')}
          <button type="button" class="categorie categorie-nouvelle" data-action="nouvelle" aria-label="Nouvelle catégorie"><span aria-hidden="true">+ Nouvelle</span></button>
        </div>
        ${erreurChamp('categorie')}
      </fieldset>
      <div class="champ">
        <label for="ajout-date">Date</label>
        <input id="ajout-date" name="date" type="date" max="${echapper(aujourdhui)}" value="${echapper(depense ? depense.date : aujourdhui)}">
        ${erreurChamp('date')}
      </div>
      <p class="erreur-formulaire" role="alert" hidden></p>
      <button type="submit" class="bouton bouton-principal">Valider</button>
    </form>
  </div>`;

  const form = container.querySelector('form');
  const { montant, date } = form.elements;
  const grille = container.querySelector('.grille-categories');
  const fieldset = container.querySelector('#ajout-categories');
  const boutonNouvelle = grille.querySelector('[data-action="nouvelle"]');
  const boutonValider = form.querySelector('button[type="submit"]');
  const erreurFormulaire = form.querySelector('.erreur-formulaire');
  const messageCategorie = container.querySelector('#ajout-categorie-erreur');
  let occupe = false;

  const boutonsCategories = () => [...grille.querySelectorAll('button.categorie[data-id]')];

  function marquerChamp(input, message, element) {
    if (message) {
      input.setAttribute('aria-invalid', 'true');
      input.setAttribute('aria-describedby', element.id);
    } else {
      input.removeAttribute('aria-invalid');
      input.removeAttribute('aria-describedby');
    }
  }

  // Le message de catégorie est relié au groupe et à chaque bouton : c'est un bouton qui reçoit le focus.
  function marquerCategorie(message) {
    messageCategorie.textContent = message;
    messageCategorie.hidden = message === '';
    for (const element of [fieldset, ...boutonsCategories()]) {
      if (message) element.setAttribute('aria-describedby', messageCategorie.id);
      else element.removeAttribute('aria-describedby');
    }
  }

  function afficherErreurs(erreurs) {
    for (const [champ, input] of [['montant', montant], ['date', date]]) {
      const element = container.querySelector(`#ajout-${champ}-erreur`);
      const texte = erreurs[champ] || '';
      element.textContent = texte;
      element.hidden = texte === '';
      marquerChamp(input, texte, element);
    }
    marquerCategorie(erreurs.categorie || '');
    if (erreurs.montant) montant.focus();
    else if (erreurs.categorie) boutonsCategories()[0].focus();
    else if (erreurs.date) date.focus();
  }

  function choisir(id) {
    choisie = id;
    for (const bouton of boutonsCategories()) bouton.setAttribute('aria-pressed', String(bouton.dataset.id === id));
    if (!messageCategorie.hidden) marquerCategorie('');
  }

  function occuper(etat) {
    occupe = etat;
    boutonValider.disabled = etat;
  }

  function signalerEchec() {
    erreurFormulaire.textContent = ERREUR_ENREGISTREMENT;
    erreurFormulaire.hidden = false;
  }

  container.querySelector('.lien-retour').addEventListener('click', (e) => {
    if (!ctx.peutRevenir || !ctx.peutRevenir()) return; // sinon le lien mène à l'accueil
    e.preventDefault();
    window.history.back();
  });

  grille.addEventListener('click', (e) => {
    const bouton = e.target.closest('button.categorie[data-id]');
    if (bouton) choisir(bouton.dataset.id);
  });

  boutonNouvelle.addEventListener('click', () => {
    ouvrirFormCategorie({
      categories,
      onEnregistre: (categorie) => {
        if (!grille.isConnected) return;
        categories.push(categorie);
        boutonNouvelle.insertAdjacentHTML('beforebegin', rendreBoutonCategorie(categorie, false));
        choisir(categorie.id);
        grille.querySelector(`button.categorie[data-id="${CSS.escape(categorie.id)}"]`).focus();
      },
    });
  });

  // Appli restée ouverte après minuit : au retour, le jour de référence et la date par défaut suivent.
  function synchroniserDate() {
    if (!form.isConnected) {
      document.removeEventListener('visibilitychange', auRetour);
      window.removeEventListener('focus', auRetour);
      return;
    }
    const nouvelle = ctx.aujourdhui();
    if (nouvelle === aujourdhui) return;
    // En modification, la date d'une dépense existante ne change jamais toute seule.
    if (!depense) date.value = dateAJour({ valeurChamp: date.value, ancienneDate: aujourdhui, nouvelleDate: nouvelle });
    date.max = nouvelle;
    aujourdhui = nouvelle;
  }
  function auRetour() {
    if (document.visibilityState === 'hidden') return;
    synchroniserDate();
  }
  document.addEventListener('visibilitychange', auRetour);
  window.addEventListener('focus', auRetour);

  // Le bouton est désactivé dès le premier tap : un double tap n'enregistre qu'une dépense.
  // La date du jour est relue à la validation (appli restée ouverte après minuit).
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (occupe) return;
    occuper(true);
    erreurFormulaire.hidden = true;
    let resultat;
    try {
      const moisSupprimes = moisDetailSupprime(await lireTout('resumes'));
      resultat = validerDepense(
        { montantTexte: montant.value, categorieId: choisie, date: date.value },
        { aujourdhui: ctx.aujourdhui(), moisDetailSupprime: moisSupprimes, categories },
      );
      if (resultat.ok) await enregistrerDepense({ id: depense ? depense.id : undefined, ...resultat.valeurs });
    } catch (erreur) {
      console.error(erreur);
      occuper(false);
      signalerEchec();
      return;
    }
    if (!resultat.ok) {
      occuper(false);
      afficherErreurs(resultat.erreurs);
      return;
    }
    afficherErreurs({});
    // Si l'utilisateur a quitté l'écran pendant l'écriture, on ne le ramène pas en arrière.
    if (ctx.estActuel()) ctx.naviguer(enModification ? '#/depenses' : '#/');
  });
}
