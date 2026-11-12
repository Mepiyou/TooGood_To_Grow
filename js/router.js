import { rendreNav } from './ui/nav.js';

// Table des routes (spec § 5). `motif` : segments séparés par « / », « :x » = paramètre.
// Les routes V2 sont présentes mais désactivées en V1 (D14) : elles retombent sur l'accueil.
export const ROUTES = [
  { motif: '/', nom: 'accueil', onglet: 'accueil', bouton: true, titre: 'Accueil' },
  { motif: '/ajout', nom: 'ajout', onglet: null, bouton: false, titre: 'Ajouter une dépense' },
  { motif: '/ajout/:id', nom: 'ajout', onglet: null, bouton: false, titre: 'Modifier la dépense' },
  { motif: '/depenses', nom: 'depenses', onglet: 'depenses', bouton: true, titre: 'Dépenses' },
  { motif: '/historique', nom: 'historique', onglet: 'depenses', bouton: true, titre: 'Historique' },
  { motif: '/historique/supprimer/:mois', nom: 'supprimer-mois', onglet: null, bouton: false, titre: 'Supprimer un mois' },
  { motif: '/categories', nom: 'categories', onglet: null, bouton: false, titre: 'Catégories' },
  { motif: '/mois/revenus', nom: 'revenus', onglet: 'mois', bouton: true, titre: 'Mon mois – Revenus' },
  { motif: '/mois/charges', nom: 'charges', onglet: 'mois', bouton: true, titre: 'Mon mois – Charges fixes' },
  { motif: '/mois/provisions', nom: 'provisions', onglet: 'mois', bouton: true, v2: true, titre: 'Mon mois – Provisions' },
  { motif: '/enveloppes', nom: 'enveloppes', onglet: 'enveloppes', bouton: true, v2: true, titre: 'Enveloppes' },
];

const V2_ACTIVE = false;

function correspond(motif, segments) {
  const modele = motif.split('/').filter(Boolean);
  if (modele.length !== segments.length) return null;
  const params = {};
  for (let i = 0; i < modele.length; i++) {
    if (modele[i].startsWith(':')) params[modele[i].slice(1)] = decodeURIComponent(segments[i]);
    else if (modele[i] !== segments[i]) return null;
  }
  return params;
}

function resultat(route, params) {
  return { nom: route.nom, params, onglet: route.onglet, bouton: route.bouton };
}

function trouverRoute(hash) {
  const chemin = (hash || '').replace(/^#/, '').split('?')[0];
  const segments = chemin.split('/').filter(Boolean);
  try {
    for (const route of ROUTES) {
      const params = correspond(route.motif, segments);
      if (params && (!route.v2 || V2_ACTIVE)) return { route, params };
    }
  } catch {
    // encodage invalide dans l'URL : on retombe sur l'accueil
  }
  return { route: ROUTES[0], params: {} };
}

export function resoudreRoute(hash) {
  const { route, params } = trouverRoute(hash);
  return resultat(route, params);
}

const NOM_APP = 'TooGood To Grow';

// Titre de l'onglet du navigateur, lu aussi par les lecteurs d'écran au changement de page.
export function titreDocument(hash) {
  const { route } = trouverRoute(hash);
  return route === ROUTES[0] ? NOM_APP : `${route.titre} · ${NOM_APP}`;
}

const MESSAGE_ERREUR_VUE = "Impossible d'afficher cet écran. Réessaie dans un instant.";

// Jetons de rendu : seul le rendu démarré en dernier est « actuel ».
// Le focus dû à une navigation est conservé jusqu'au premier rendu actuel qui aboutit,
// même si un rafraîchissement a démarré entre-temps.
export function creerSuiviRendus() {
  let dernier = 0;
  let focusDu = false;
  return {
    demarrer(changementDeRoute) {
      focusDu = focusDu || changementDeRoute;
      return ++dernier;
    },
    estActuel(jeton) {
      return jeton === dernier;
    },
    // Rendu abouti : renvoie true s'il faut poser le focus maintenant (le focus dû est alors consommé).
    terminer(jeton) {
      if (jeton !== dernier) return false;
      const focus = focusDu;
      focusDu = false;
      return focus;
    },
  };
}

function afficherErreurVue(container) {
  const alerte = document.createElement('div');
  alerte.setAttribute('role', 'alert');
  alerte.className = 'banniere-alerte bloc-erreur';
  const texte = document.createElement('p');
  texte.textContent = MESSAGE_ERREUR_VUE;
  alerte.append(texte);
  container.replaceChildren(alerte);
}

// Retourne { rafraichir } : relance le rendu de la route courante sans déplacer le focus.
// Chaque vue rend dans un conteneur détaché, posé dans `container` seulement s'il est encore le plus récent :
// une vue lente d'une route précédente ne peut donc pas écraser la plus récente.
// `ctx.estActuel()` indique à une vue, après un await, si son rendu compte encore.
export function demarrerRouteur(container, vues, ctx) {
  const suivi = creerSuiviRendus();

  async function afficher(changementDeRoute) {
    const jeton = suivi.demarrer(changementDeRoute);
    const route = resoudreRoute(window.location.hash);
    const existe = Boolean(vues[route.nom]);
    const vue = existe ? vues[route.nom] : vues.accueil;
    rendreNav(route.onglet, route.bouton);
    document.title = titreDocument(existe ? window.location.hash : '#/');
    const cible = document.createElement('div');
    const ctxVue = { ...ctx, estActuel: () => suivi.estActuel(jeton) };
    try {
      await vue.render(cible, existe ? route.params : {}, ctxVue);
    } catch (erreur) {
      console.error(erreur);
      if (suivi.estActuel(jeton)) afficherErreurVue(container);
      return;
    }
    if (!suivi.estActuel(jeton)) return;
    container.replaceChildren(cible);
    if (!suivi.terminer(jeton)) return;
    const titre = container.querySelector('h1');
    if (titre) {
      titre.setAttribute('tabindex', '-1');
      titre.focus({ preventScroll: true });
    }
    window.scrollTo(0, 0);
  }

  window.addEventListener('hashchange', () => afficher(true));
  afficher(true);
  return { rafraichir: () => afficher(false) };
}
