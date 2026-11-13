import { lireTout, lire, ecrire, transaction } from '../db.js';
import { CATEGORIES_PAR_DEFAUT, trierCategories, prochainOrdre, planSuppressionCategorie } from '../domain/categories.js';

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
  return trierCategories(await lireTout('categories'));
}

function nettoyerNom(nom) {
  return String(nom).trim().replace(/\s+/g, ' ');
}

// `ordre` lu et écrit dans la même transaction : deux créations simultanées ne partagent pas le même rang.
export async function creerCategorie({ nom, couleur }) {
  const categorie = { id: crypto.randomUUID(), nom: nettoyerNom(nom), couleur, parDefaut: false, ordre: 0 };
  await transaction(['categories'], 'readwrite', (tx) => {
    const store = tx.objectStore('categories');
    store.getAll().onsuccess = (e) => {
      categorie.ordre = prochainOrdre(e.target.result);
      store.add(categorie);
    };
  });
  return categorie;
}

// Catégorie, dépenses et résumés sont lus puis écrits dans la même transaction readwrite : une dépense
// ajoutée entre-temps ne peut pas échapper à la réaffectation, et tout est annulé en cas d'échec.
// Une exception levée dans un callback de requête (catégorie par défaut ou absente) annule la transaction.
export function supprimerCategorie(id) {
  const maintenant = new Date().toISOString();
  return transaction(['categories', 'depenses', 'resumes'], 'readwrite', (tx) => {
    const lectures = {};
    const quandPret = (cle) => (e) => {
      lectures[cle] = e.target.result;
      if (!('categorie' in lectures && 'depenses' in lectures && 'resumes' in lectures)) return;
      const plan = planSuppressionCategorie({ ...lectures, maintenant });
      tx.objectStore('categories').delete(id);
      for (const depense of plan.depenses) tx.objectStore('depenses').put(depense);
      for (const resume of plan.resumes) tx.objectStore('resumes').put(resume);
    };
    tx.objectStore('categories').get(id).onsuccess = quandPret('categorie');
    tx.objectStore('depenses').getAll().onsuccess = quandPret('depenses');
    tx.objectStore('resumes').getAll().onsuccess = quandPret('resumes');
  });
}

export async function modifierCategorie(id, { nom, couleur }) {
  const existante = await lire('categories', id);
  if (!existante) throw new Error('Catégorie introuvable');
  const categorie = { ...existante, nom: nettoyerNom(nom), couleur };
  await ecrire('categories', categorie);
  return categorie;
}
