import { ouvrirDB } from './db.js';
import { initialiserCategories } from './store/categories.js';
import { versISO } from './domain/dates.js';
import { demarrerRouteur } from './router.js';
import { initBanniereHorsLigne } from './ui/banniere.js';
import { render as renderAccueil } from './views/accueil.js';

// Vues des étapes suivantes : le routeur affiche l'accueil tant qu'elles n'existent pas.
const vues = { accueil: { render: renderAccueil } };

const MESSAGE_ERREUR = "Impossible d'ouvrir les données de l'application sur ce téléphone. Si tu es en navigation privée, ouvre l'app dans un onglet normal.";

// Le routeur n'est démarré (et ses écouteurs branchés) qu'après un démarrage réussi :
// un échec ne laisse donc aucun écouteur à dédoubler lors d'un nouvel essai.
async function demarrer() {
  await ouvrirDB();
  await initialiserCategories();

  let routeur = null;
  const ctx = {
    aujourdhui: () => versISO(new Date()),
    naviguer: (hash) => { window.location.hash = hash; },
    rafraichir: () => (routeur ? routeur.rafraichir() : undefined),
  };
  routeur = demarrerRouteur(document.getElementById('app'), vues, ctx);
}

function afficherErreurDemarrage(erreur) {
  console.error(erreur);
  const app = document.getElementById('app');
  app.innerHTML = '<div role="alert" class="banniere-alerte bloc-erreur"><p></p><button type="button" class="bouton">Réessayer</button></div>';
  app.querySelector('p').textContent = MESSAGE_ERREUR;
  app.querySelector('button').addEventListener('click', lancer);
}

function lancer() {
  demarrer().catch(afficherErreurDemarrage);
}

initBanniereHorsLigne();
lancer();
