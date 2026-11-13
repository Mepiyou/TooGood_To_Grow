import { lireTout, lire, ecrire, transaction, parIndex } from '../db.js';
import { calculerResume, moisACloturer, planSuppressionMois } from '../domain/resume.js';
import { moisDetailSupprime as moisAvecDetailSupprime } from '../domain/depenses.js';
import { comparer, moisDe } from '../domain/dates.js';
import { lireMeta } from './meta.js';

export function listerResumes() {
  return lireTout('resumes');
}

export function lireResume(mois) {
  return lire('resumes', mois);
}

export async function moisDetailSupprime() {
  return moisAvecDetailSupprime(await lireTout('resumes'));
}

// Écrit un résumé par mois passé non encore clôturé, puis avance `derniereCloture`, en une transaction.
// Un résumé dont le détail a été supprimé n'est jamais recalculé (ses dépenses n'existent plus).
export async function cloturerMoisPasses(moisCourant) {
  const [derniereCloture, depenses, resumes] = await Promise.all([
    lireMeta('derniereCloture'),
    lireTout('depenses'),
    lireTout('resumes'),
  ]);
  const premierMois = depenses.reduce((min, d) => {
    const m = d.mois ?? moisDe(d.date);
    return min === null || comparer(m, min) < 0 ? m : min;
  }, null);
  const mois = moisACloturer(derniereCloture, moisCourant, premierMois);
  if (mois.length === 0) return [];

  const existants = new Map(resumes.map((r) => [r.mois, r]));
  const maintenant = new Date().toISOString();
  const aEcrire = mois
    .filter((m) => existants.get(m)?.detailSupprime !== true)
    .map((m) => calculerResume(m, depenses, { epargne: existants.get(m)?.epargne ?? 0, maintenant }));

  await transaction(['resumes', 'meta'], 'readwrite', (tx) => {
    const store = tx.objectStore('resumes');
    for (const resume of aEcrire) store.put(resume);
    tx.objectStore('meta').put({ cle: 'derniereCloture', valeur: mois[mois.length - 1] });
  });
  return aEcrire.map((r) => r.mois);
}

// Supprime le détail d'un mois passé (et son résumé si `garderTotaux` est faux) en une seule transaction.
// Renvoie la taille estimée libérée (octets), calculée avant suppression comme dans `statsParMois`.
export async function supprimerMois({ mois, moisCourant, garderTotaux, maintenant }) {
  const [depenses, resume] = await Promise.all([parIndex('depenses', 'mois', mois), lire('resumes', mois)]);
  const plan = planSuppressionMois({ mois, moisCourant, garderTotaux, depenses, resume, maintenant });
  await transaction(['depenses', 'resumes'], 'readwrite', (tx) => {
    const magasinDepenses = tx.objectStore('depenses');
    for (const id of plan.idsDepenses) magasinDepenses.delete(id);
    const magasinResumes = tx.objectStore('resumes');
    if (plan.supprimerResume) magasinResumes.delete(mois);
    else if (plan.resume && plan.resume !== resume) magasinResumes.put(plan.resume);
  });
  return depenses.length === 0 ? 0 : JSON.stringify(depenses).length;
}

export async function recalculerResumes(moisListe) {
  for (const mois of moisListe) {
    const existant = await lire('resumes', mois);
    if (existant?.detailSupprime === true) continue;
    const depenses = await parIndex('depenses', 'mois', mois);
    const resume = calculerResume(mois, depenses, {
      epargne: existant?.epargne ?? 0,
      maintenant: new Date().toISOString(),
    });
    await ecrire('resumes', resume);
  }
}
