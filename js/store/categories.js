import { lireTout, transaction } from '../db.js';
import { CATEGORIES_PAR_DEFAUT } from '../domain/categories.js';

// Idempotent, même en cas d'appels concurrents : la lecture et l'ajout se font dans
// une seule transaction readwrite, donc sérialisée par IndexedDB.
export function initialiserCategories() {
  return transaction(['categories'], 'readwrite', (tx) => {
    const store = tx.objectStore('categories');
    for (const categorie of CATEGORIES_PAR_DEFAUT) {
      store.get(categorie.id).onsuccess = (e) => {
        if (e.target.result === undefined) store.add({ ...categorie });
      };
    }
  });
}

export async function listerCategories() {
  const toutes = await lireTout('categories');
  return toutes.sort((a, b) => (Number(b.parDefaut) - Number(a.parDefaut)) || (a.ordre - b.ordre));
}
