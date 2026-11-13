import { lireTout, lire, ecrire, supprimer, transaction, parIndex } from '../db.js';
import { calculerResume, clotureAJour, decisionResume, moisACloturer, planSuppressionMois, premierMoisACloturer } from '../domain/resume.js';
import { moisDetailSupprime as moisAvecDetailSupprime } from '../domain/depenses.js';
import { epargneDuMois, totauxCumules } from '../domain/enveloppes.js';
import { dernierJourDuMois } from '../domain/dates.js';
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

// D42 : seul `totalCumule` est réécrit, sur l'enregistrement relu dans la transaction
// (une modification de l'enveloppe faite entre-temps n'est pas écrasée).
function ecrireCumuls(tx, enveloppes) {
  const store = tx.objectStore('enveloppes');
  for (const { id, totalCumule } of enveloppes) {
    const demande = store.get(id);
    demande.onsuccess = () => {
      if (demande.result) store.put({ ...demande.result, totalCumule });
    };
  }
}

function resumesApres(resumes, aEcrire, aSupprimer) {
  const parMois = new Map(resumes.map((r) => [r.mois, r]));
  for (const r of aEcrire) parMois.set(r.mois, r);
  for (const m of aSupprimer) parMois.delete(m);
  return [...parMois.values()];
}

// Recalcule les résumés des mois passés non encore clôturés (dépenses et épargne), avance `derniereCloture`
// et réécrit le cumul des enveloppes Épargne (D42), en une transaction. La plage commence à la première
// dépense ou à la première enveloppe Épargne (D43). Un mois sans dépense ni épargne n'a pas de résumé ;
// un résumé dont le détail a été supprimé n'est jamais recalculé.
export async function cloturerMoisPasses(moisCourant) {
  const derniereCloture = await lireMeta('derniereCloture');
  if (clotureAJour(derniereCloture, moisCourant)) return [];
  const [depenses, resumes, enveloppes, revenus] = await Promise.all([
    lireTout('depenses'), lireTout('resumes'), lireTout('enveloppes'), lireTout('revenus'),
  ]);
  const mois = moisACloturer(derniereCloture, moisCourant, premierMoisACloturer(depenses, enveloppes));
  if (mois.length === 0) return [];

  const existants = new Map(resumes.map((r) => [r.mois, r]));
  const maintenant = new Date().toISOString();
  const aEcrire = [];
  const aSupprimer = [];
  for (const m of mois) {
    const existant = existants.get(m);
    // D42 : l'épargne d'un mois passé suit l'état actuel des enveloppes.
    const { parEnveloppe } = epargneDuMois(enveloppes, revenus, m, dernierJourDuMois(m));
    const resume = calculerResume(m, depenses, { epargneParEnveloppe: parEnveloppe, maintenant });
    const decision = decisionResume(existant, resume);
    if (decision === 'ecrire') aEcrire.push(resume);
    else if (decision === 'supprimer') aSupprimer.push(m);
  }
  const cumuls = totauxCumules(enveloppes, resumesApres(resumes, aEcrire, aSupprimer));

  await transaction(['resumes', 'meta', 'enveloppes'], 'readwrite', (tx) => {
    const store = tx.objectStore('resumes');
    for (const resume of aEcrire) store.put(resume);
    for (const m of aSupprimer) store.delete(m);
    tx.objectStore('meta').put({ cle: 'derniereCloture', valeur: mois[mois.length - 1] });
    ecrireCumuls(tx, cumuls);
  });
  return aEcrire.map((r) => r.mois);
}

// Supprime le détail d'un mois passé (et son résumé si `garderTotaux` est faux) en une seule transaction.
// Renvoie la taille estimée libérée (octets), calculée avant suppression comme dans `statsParMois`.
export async function supprimerMois({ mois, moisCourant, garderTotaux, maintenant }) {
  const [depenses, resume, resumes, enveloppes] = await Promise.all([
    parIndex('depenses', 'mois', mois), lire('resumes', mois), lireTout('resumes'), lireTout('enveloppes'),
  ]);
  const plan = planSuppressionMois({ mois, moisCourant, garderTotaux, depenses, resume, maintenant });
  // D42 : supprimer entièrement un mois retire aussi son épargne du cumul.
  const cumuls = plan.supprimerResume ? totauxCumules(enveloppes, resumesApres(resumes, [], [mois])) : [];
  await transaction(['depenses', 'resumes', 'enveloppes'], 'readwrite', (tx) => {
    const magasinDepenses = tx.objectStore('depenses');
    for (const id of plan.idsDepenses) magasinDepenses.delete(id);
    const magasinResumes = tx.objectStore('resumes');
    if (plan.supprimerResume) magasinResumes.delete(mois);
    else if (plan.resume && plan.resume !== resume) magasinResumes.put(plan.resume);
    ecrireCumuls(tx, cumuls);
  });
  return depenses.length === 0 ? 0 : JSON.stringify(depenses).length;
}

// L'épargne d'un résumé existant est conservée : seule la clôture la calcule.
export async function recalculerResumes(moisListe) {
  for (const mois of moisListe) {
    const existant = await lire('resumes', mois);
    if (existant?.detailSupprime === true) continue;
    const depenses = await parIndex('depenses', 'mois', mois);
    const resume = calculerResume(mois, depenses, {
      epargne: existant?.epargne ?? 0,
      epargneParEnveloppe: existant?.epargneParEnveloppe ?? {},
      maintenant: new Date().toISOString(),
    });
    const decision = decisionResume(existant, resume);
    if (decision === 'ecrire') await ecrire('resumes', resume);
    else if (decision === 'supprimer') await supprimer('resumes', mois);
  }
}
