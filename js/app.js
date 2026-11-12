import { ouvrirDB } from './db.js';
import { initialiserCategories } from './store/categories.js';
import { versISO } from './domain/dates.js';
import { demarrerRouteur } from './router.js';
import { initBanniereHorsLigne } from './ui/banniere.js';
import { render as renderAccueil } from './views/accueil.js';

// Vues des étapes suivantes : le routeur affiche l'accueil tant qu'elles n'existent pas.
const vues = { accueil: { render: renderAccueil } };

async function demarrer() {
  await ouvrirDB();
  await initialiserCategories();
  initBanniereHorsLigne();

  let routeur = null;
  const ctx = {
    aujourdhui: () => versISO(new Date()),
    naviguer: (hash) => { window.location.hash = hash; },
    rafraichir: () => (routeur ? routeur.rafraichir() : undefined),
  };
  routeur = demarrerRouteur(document.getElementById('app'), vues, ctx);
}

demarrer();
