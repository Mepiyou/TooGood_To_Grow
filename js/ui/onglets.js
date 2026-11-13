// Onglets segmentés de « Mon mois ». « Provisions » est masqué en V1 (D14).
const ONGLETS_MOIS = [
  { id: 'revenus', libelle: 'Revenus', href: '#/mois/revenus' },
  { id: 'charges', libelle: 'Charges fixes', href: '#/mois/charges' },
];

export function rendreOngletsMois(actif) {
  const liens = ONGLETS_MOIS.map((o) =>
    `<a class="onglet" href="${o.href}"${o.id === actif ? ' aria-current="page"' : ''}>${o.libelle}</a>`
  ).join('');
  return `<nav class="onglets" aria-label="Sections de Mon mois">${liens}</nav>`;
}

// Onglets de l'écran Dépenses : « Ce mois » (cet écran) et « Historique ».
const ONGLETS_DEPENSES = [
  { id: 'ce-mois', libelle: 'Ce mois', href: '#/depenses' },
  { id: 'historique', libelle: 'Historique', href: '#/historique' },
];

export function rendreOngletsDepenses(actif) {
  const liens = ONGLETS_DEPENSES.map((o) =>
    `<a class="onglet" href="${o.href}"${o.id === actif ? ' aria-current="page"' : ''}>${o.libelle}</a>`
  ).join('');
  return `<nav class="onglets" aria-label="Sections de Dépenses">${liens}</nav>`;
}
