export const CATEGORIES_PAR_DEFAUT = [
  { id: 'courses', nom: 'Courses', couleur: '#0B6E4F', parDefaut: true, ordre: 0 },
  { id: 'transport', nom: 'Transport', couleur: '#2F6FB5', parDefaut: true, ordre: 1 },
  { id: 'sorties', nom: 'Sorties', couleur: '#7A5AA6', parDefaut: true, ordre: 2 },
  { id: 'plaisir', nom: 'Plaisir', couleur: '#D9822B', parDefaut: true, ordre: 3 },
  { id: 'autre', nom: 'Autre', couleur: '#9AA0A6', parDefaut: true, ordre: 4 },
];

export const PALETTE = ['#B5446E', '#0B6E4F', '#2F6FB5', '#D9822B', '#7A5AA6', '#9AA0A6'];

export function normaliserNom(nom) {
  return String(nom ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
}

export function validerCategorie({ nom, couleur }, categories, idEnCours) {
  const net = String(nom ?? '').trim();
  if (net === '') return { champ: 'nom', message: 'Le nom est obligatoire.' };
  if (net.length > 30) return { champ: 'nom', message: '30 caractères maximum.' };
  const cle = normaliserNom(net);
  if (categories.some((c) => c.id !== idEnCours && normaliserNom(c.nom) === cle)) {
    return { champ: 'nom', message: 'Cette catégorie existe déjà.' };
  }
  if (!PALETTE.includes(couleur)) return { champ: 'couleur', message: 'Choisis une couleur.' };
  return null;
}

// Écran d'ajout (spec § 9) : catégories par défaut, puis créées, chacune par `ordre`.
export function trierCategories(categories) {
  return [...categories].sort((a, b) => (Number(b.parDefaut) - Number(a.parDefaut)) || (a.ordre - b.ordre));
}

// Une dépense dont la catégorie n'existe plus est rattachée à « Autre ».
export function categorieDeRepli(categorieId, categories) {
  return categories.some((c) => c.id === categorieId) ? categorieId : 'autre';
}

export function prochainOrdre(categories) {
  return categories.reduce((max, c) => Math.max(max, c.ordre + 1), 0);
}
