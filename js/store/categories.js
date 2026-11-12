import { lireTout, transaction } from '../db.js';
import { CATEGORIES_PAR_DEFAUT } from '../domain/categories.js';

// Idempotent : n'ajoute que les catégories par défaut absentes, ne touche pas aux existantes.
export async function initialiserCategories() {
  const existantes = await lireTout('categories');
  const ids = new Set(existantes.map((c) => c.id));
  const manquantes = CATEGORIES_PAR_DEFAUT.filter((c) => !ids.has(c.id));
  if (manquantes.length === 0) return;
  await transaction(['categories'], 'readwrite', (tx) => {
    const store = tx.objectStore('categories');
    for (const categorie of manquantes) store.add({ ...categorie });
  });
}

export async function listerCategories() {
  const toutes = await lireTout('categories');
  return toutes.sort((a, b) => (Number(b.parDefaut) - Number(a.parDefaut)) || (a.ordre - b.ordre));
}
