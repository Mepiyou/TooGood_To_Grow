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

// Suppression d'une catégorie : ne renvoie que les dépenses à réécrire.
// « autre » reçoit les dépenses des catégories supprimées : il n'a jamais rien à réaffecter.
export function reaffecterDepenses(depenses, categorieId, maintenant) {
  if (categorieId === 'autre') return [];
  return depenses
    .filter((d) => d.categorieId === categorieId)
    .map((d) => ({ ...d, categorieId: 'autre', modifieLe: maintenant }));
}

// Le montant de la catégorie supprimée passe dans `autre` ; seuls les résumés concernés sont renvoyés.
export function reaffecterResumes(resumes, categorieId) {
  if (categorieId === 'autre') return [];
  return resumes
    .filter((r) => r.parCategorie && categorieId in r.parCategorie)
    .map((r) => {
      const parCategorie = { ...r.parCategorie };
      parCategorie.autre = (parCategorie.autre ?? 0) + parCategorie[categorieId];
      delete parCategorie[categorieId];
      return { ...r, parCategorie };
    });
}

// Ce que la suppression doit écrire. Lève une erreur pour une catégorie absente, par défaut ou « autre ».
export function planSuppressionCategorie({ categorie, depenses, resumes, maintenant }) {
  if (!categorie) throw new Error('Catégorie introuvable');
  if (categorie.parDefaut || categorie.id === 'autre') throw new Error('Une catégorie par défaut ne se supprime pas');
  return {
    depenses: reaffecterDepenses(depenses, categorie.id, maintenant),
    resumes: reaffecterResumes(resumes, categorie.id),
  };
}

// Montant par catégorie : une catégorie inconnue est rattachée à « autre ».
export function montantsParCategorie(depenses, categories) {
  const montants = {};
  for (const d of depenses) {
    const id = categorieDeRepli(d.categorieId, categories);
    montants[id] = (montants[id] ?? 0) + d.montant;
  }
  return montants;
}
