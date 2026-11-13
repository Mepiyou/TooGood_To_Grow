const ICONES = {
  accueil: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
  depenses: '<path d="M8 6h13"/><path d="M8 12h13"/><path d="M8 18h13"/><path d="M3 6h.01"/><path d="M3 12h.01"/><path d="M3 18h.01"/>',
  mois: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18"/><path d="M8 3v4"/><path d="M16 3v4"/>',
  enveloppes: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
};

// « Enveloppes », masqué en V1 (D14), est visible depuis l'étape 7.
const ONGLETS = [
  { id: 'accueil', libelle: 'Accueil', href: '#/' },
  { id: 'depenses', libelle: 'Dépenses', href: '#/depenses' },
  { id: 'mois', libelle: 'Mon mois', href: '#/mois/revenus' },
  { id: 'enveloppes', libelle: 'Enveloppes', href: '#/enveloppes' },
];

function icone(id) {
  return `<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONES[id]}</svg>`;
}

// Écrit dans #zone-actions (bouton « + ») et #nav-bas, définis dans index.html.
export function rendreNav(onglet, afficherBouton) {
  const zone = document.getElementById('zone-actions');
  const nav = document.getElementById('nav-bas');
  zone.hidden = !afficherBouton;
  zone.innerHTML = afficherBouton ? '<a class="bouton bouton-principal" href="#/ajout">+ Ajouter une dépense</a>' : '';
  nav.hidden = onglet === null;
  document.body.classList.toggle('sans-nav', onglet === null);
  document.body.classList.toggle('avec-bouton', afficherBouton);
  nav.innerHTML = ONGLETS.map((o) =>
    `<a class="nav-lien" href="${o.href}"${o.id === onglet ? ' aria-current="page"' : ''}>${icone(o.id)}<span>${o.libelle}</span></a>`
  ).join('');
}
