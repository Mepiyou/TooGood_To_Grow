import { rendreNav } from './ui/nav.js';

// Table des routes (spec § 5). `motif` : segments séparés par « / », « :x » = paramètre.
// Les routes V2 sont présentes mais désactivées en V1 (D14) : elles retombent sur l'accueil.
export const ROUTES = [
  { motif: '/', nom: 'accueil', onglet: 'accueil', bouton: true },
  { motif: '/ajout', nom: 'ajout', onglet: null, bouton: false },
  { motif: '/ajout/:id', nom: 'ajout', onglet: null, bouton: false },
  { motif: '/depenses', nom: 'depenses', onglet: 'depenses', bouton: true },
  { motif: '/historique', nom: 'historique', onglet: 'depenses', bouton: true },
  { motif: '/historique/supprimer/:mois', nom: 'supprimer-mois', onglet: null, bouton: false },
  { motif: '/categories', nom: 'categories', onglet: null, bouton: false },
  { motif: '/mois/revenus', nom: 'revenus', onglet: 'mois', bouton: true },
  { motif: '/mois/charges', nom: 'charges', onglet: 'mois', bouton: true },
  { motif: '/mois/provisions', nom: 'provisions', onglet: 'mois', bouton: true, v2: true },
  { motif: '/enveloppes', nom: 'enveloppes', onglet: 'enveloppes', bouton: true, v2: true },
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

export function resoudreRoute(hash) {
  const chemin = (hash || '').replace(/^#/, '').split('?')[0];
  const segments = chemin.split('/').filter(Boolean);
  try {
    for (const route of ROUTES) {
      const params = correspond(route.motif, segments);
      if (params && (!route.v2 || V2_ACTIVE)) return resultat(route, params);
    }
  } catch {
    // encodage invalide dans l'URL : on retombe sur l'accueil
  }
  return resultat(ROUTES[0], {});
}

// Retourne { rafraichir } : relance le rendu de la route courante sans toucher au focus.
export function demarrerRouteur(container, vues, ctx) {
  let numeroRendu = 0;

  async function afficher(changementDeRoute) {
    const numero = ++numeroRendu;
    const route = resoudreRoute(window.location.hash);
    const existe = Boolean(vues[route.nom]);
    const vue = existe ? vues[route.nom] : vues.accueil;
    rendreNav(route.onglet, route.bouton);
    await vue.render(container, existe ? route.params : {}, ctx);
    if (numero !== numeroRendu || !changementDeRoute) return;
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
