import { lire, lireTout, ecrire, supprimer, parIndex } from '../db.js';
import { construireDepense, statsParMois as calculerStats } from '../domain/depenses.js';
import { moisDe, versISO } from '../domain/dates.js';
import { moisImpactes } from '../domain/resume.js';
import { recalculerResumes } from './resumes.js';

export function depensesDuMois(mois) {
  return parIndex('depenses', 'mois', mois);
}

export async function statsParMois() {
  return calculerStats(await lireTout('depenses'));
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
  await majResumes(existant, depense);
  return depense;
}

export async function supprimerDepense(id) {
  const existant = await lire('depenses', id);
  await supprimer('depenses', id);
  await majResumes(existant, null);
}

// La dépense est déjà écrite : un échec ici ne doit pas la faire passer pour non enregistrée.
async function majResumes(ancienne, nouvelle) {
  try {
    await recalculerResumes(moisImpactes(ancienne, nouvelle, moisDe(versISO(new Date()))));
  } catch (erreur) {
    console.error(erreur);
  }
}
