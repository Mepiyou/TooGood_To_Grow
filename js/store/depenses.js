import { lire, ecrire, supprimer, parIndex } from '../db.js';
import { construireDepense, trierParDateDesc } from '../domain/depenses.js';

export function depensesDuMois(mois) {
  return parIndex('depenses', 'mois', mois);
}

export function lireDepense(id) {
  return lire('depenses', id);
}

// Avec `id` : modification d'une dépense existante (refusée si elle a été supprimée entre-temps).
export async function enregistrerDepense({ id, montant, categorieId, date }) {
  const existant = id ? await lire('depenses', id) : undefined;
  if (id && !existant) throw new Error('Dépense introuvable');
  const depense = construireDepense(
    { id: id || crypto.randomUUID(), montant, categorieId, date },
    existant,
    new Date().toISOString(),
  );
  await ecrire('depenses', depense);
  return depense;
}

export function supprimerDepense(id) {
  return supprimer('depenses', id);
}

export async function dernieresDepenses(mois, n) {
  return trierParDateDesc(await depensesDuMois(mois)).slice(0, n);
}
