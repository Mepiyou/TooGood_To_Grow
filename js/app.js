import { ouvrirDB } from './db.js';
import { initialiserCategories } from './store/categories.js';
import { versISO, moisDe } from './domain/dates.js';
import { demarrerRouteur } from './router.js';
import { initBanniereHorsLigne, afficherBanniereMaj } from './ui/banniere.js';
import { afficherEncartIOS } from './ui/encart-ios.js';
import { doitDemanderPersistance } from './domain/persistance.js';
import { lireMeta, ecrireMeta } from './store/meta.js';
import { cloturerMoisPasses } from './store/resumes.js';
import { render as renderAccueil } from './views/accueil.js';
import { render as renderRevenus } from './views/revenus.js';
import { render as renderCharges } from './views/charges.js';
import { render as renderAjout } from './views/ajout.js';
import { render as renderDepenses } from './views/depenses.js';
import { render as renderHistorique } from './views/historique.js';
import { render as renderSupprimerMois } from './views/supprimer-mois.js';
import { render as renderCategories } from './views/categories.js';

// Vues des étapes suivantes : le routeur affiche l'accueil tant qu'elles n'existent pas.
const vues = {
  accueil: { render: renderAccueil },
  revenus: { render: renderRevenus },
  charges: { render: renderCharges },
  ajout: { render: renderAjout },
  depenses: { render: renderDepenses },
  historique: { render: renderHistorique },
  'supprimer-mois': { render: renderSupprimerMois },
  categories: { render: renderCategories },
};

const MESSAGE_ERREUR = "Impossible d'ouvrir les données de l'application sur ce téléphone. Si tu es en navigation privée, ouvre l'app dans un onglet normal.";

// Le routeur n'est démarré (et ses écouteurs branchés) qu'après un démarrage réussi :
// un échec ne laisse donc aucun écouteur à dédoubler lors d'un nouvel essai.
async function demarrer() {
  await ouvrirDB();
  await initialiserCategories();

  let routeur = null;
  // Nombre de navigations internes depuis le chargement : « ← Retour » n'utilise history.back()
  // que si l'entrée précédente appartient à l'app (sinon ouverture directe sur l'écran).
  let navigationsInternes = 0;
  window.addEventListener('hashchange', () => { navigationsInternes += 1; });
  const ctx = {
    aujourdhui: () => versISO(new Date()),
    naviguer: (hash) => { window.location.hash = hash; },
    rafraichir: () => (routeur ? routeur.rafraichir() : undefined),
    peutRevenir: () => navigationsInternes > 0,
  };
  routeur = demarrerRouteur(document.getElementById('app'), vues, ctx);
  // Après le premier rendu, sans attendre : ni la persistance ni l'encart ne retardent l'affichage.
  demanderPersistance().catch((erreur) => console.error(erreur));
  cloturerMoisPasses(moisDe(ctx.aujourdhui())).catch((erreur) => console.error(erreur));
  afficherEncartIOS(ctx).catch((erreur) => console.error(erreur));
}

// Un refus ou une erreur n'a aucune conséquence visible ; la demande est retentée une fois installée.
async function demanderPersistance() {
  if (!navigator.storage || typeof navigator.storage.persist !== 'function') return;
  const dejaPersistant = typeof navigator.storage.persisted === 'function'
    ? await navigator.storage.persisted()
    : undefined;
  const demande = await lireMeta('persistDemande');
  const installe = (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches)
    || navigator.standalone === true;
  if (!doitDemanderPersistance({ dejaPersistant, demande, installe })) return;
  const accorde = await navigator.storage.persist();
  await ecrireMeta('persistDemande', { date: new Date().toISOString(), accorde, installe });
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

// Remplacé par le build ; tel quel (sources), aucun service worker n'est enregistré.
const VERSION = '__VERSION__';

function enregistrerServiceWorker() {
  if (!/^v\d+-[0-9a-f]{8}$/.test(VERSION) || !('serviceWorker' in navigator)) return;
  // controllerchange survient aussi à la première installation (clients.claim()) :
  // on ne recharge que si l'utilisateur a demandé la mise à jour, et une seule fois.
  let rechargementDemande = false;
  let rechargementFait = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!rechargementDemande || rechargementFait) return;
    rechargementFait = true;
    window.location.reload();
  });
  // Une seule bannière ; elle active le worker en attente le plus récent.
  let workerEnAttente = null;
  let banniereAffichee = false;
  navigator.serviceWorker.register('sw.js').then((inscription) => {
    const signaler = (worker) => {
      if (!navigator.serviceWorker.controller) return;
      workerEnAttente = worker;
      if (banniereAffichee) return;
      banniereAffichee = true;
      afficherBanniereMaj(() => {
        rechargementDemande = true;
        workerEnAttente.postMessage('SKIP_WAITING');
      });
    };
    if (inscription.waiting) signaler(inscription.waiting);
    inscription.addEventListener('updatefound', () => {
      const worker = inscription.installing;
      if (!worker) return;
      worker.addEventListener('statechange', () => {
        if (worker.state === 'installed') signaler(worker);
      });
    });
  }).catch((erreur) => console.error(erreur));
}

initBanniereHorsLigne();
enregistrerServiceWorker();
lancer();
