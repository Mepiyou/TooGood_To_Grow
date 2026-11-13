import { comparer, moisDe, moisEntre, moisPrecedent, moisSuivant } from './dates.js';
import { totalDepenses } from './depenses.js';
import { categorieDeRepli } from './categories.js';

const MAX_PARTS_DONUT = 5;

const somme = (valeurs) => Object.values(valeurs).reduce((s, v) => s + v, 0);

// D42 : l'épargne est stockée par enveloppe pour que le cumul se recalcule depuis les résumés.
export function calculerResume(mois, depenses, { epargneParEnveloppe = {}, epargne = somme(epargneParEnveloppe), maintenant } = {}) {
  const duMois = depenses.filter((d) => (d.mois ?? moisDe(d.date)) === mois);
  const parCategorie = {};
  for (const d of duMois) {
    parCategorie[d.categorieId] = (parCategorie[d.categorieId] ?? 0) + d.montant;
  }
  return {
    mois,
    total: totalDepenses(duMois),
    parCategorie,
    epargne,
    epargneParEnveloppe,
    nbDepenses: duMois.length,
    detailSupprime: false,
    calculeLe: maintenant,
  };
}

// Que faire du résumé stocké `existant` face au résumé recalculé : 'ecrire', 'supprimer' ou 'garder'.
// Un mois sans dépense ni épargne n'a pas de résumé ; un détail supprimé n'est jamais touché.
export function decisionResume(existant, recalcule) {
  if (existant?.detailSupprime === true) return 'garder';
  if (recalcule.nbDepenses > 0 || recalcule.epargne > 0) return 'ecrire';
  return existant ? 'supprimer' : 'garder';
}

// Vrai si le mois précédent est déjà clôturé : la clôture n'a alors rien à lire.
export function clotureAJour(derniereCloture, moisCourant) {
  return Boolean(derniereCloture) && comparer(derniereCloture, moisPrecedent(moisCourant)) >= 0;
}

// D43 : la clôture commence à la première dépense ou à la première enveloppe Épargne, au plus ancien.
export function premierMoisACloturer(depenses, enveloppes) {
  let premier = null;
  const retenir = (m) => { if (premier === null || comparer(m, premier) < 0) premier = m; };
  for (const d of depenses) retenir(d.mois ?? moisDe(d.date));
  for (const e of enveloppes) if (e.type === 'epargne' && e.actifDepuis) retenir(e.actifDepuis);
  return premier;
}

export function moisACloturer(derniereCloture, moisCourant, premierMois) {
  if (premierMois === null || premierMois === undefined) return [];
  let debut = derniereCloture ? moisSuivant(derniereCloture) : premierMois;
  if (comparer(premierMois, debut) > 0) debut = premierMois;
  const fin = moisPrecedent(moisCourant);
  const mois = [];
  for (let m = debut; comparer(m, fin) <= 0; m = moisSuivant(m)) mois.push(m);
  return mois;
}

export function moisImpactes(ancienne, nouvelle, moisCourant) {
  const touches = [ancienne, nouvelle]
    .filter(Boolean)
    .map((d) => d.mois ?? moisDe(d.date))
    .filter((m) => comparer(m, moisCourant) < 0);
  return [...new Set(touches)];
}

export function planSuppressionMois({ mois, moisCourant, garderTotaux, depenses, resume, maintenant }) {
  if (comparer(mois, moisCourant) >= 0) throw new Error('Impossible de supprimer le mois en cours.');
  const duMois = depenses.filter((d) => (d.mois ?? moisDe(d.date)) === mois);
  const idsDepenses = duMois.map((d) => d.id);
  if (!garderTotaux) return { idsDepenses, resume: null, supprimerResume: true };
  // Un total périmé deviendrait définitif : on recalcule tant qu'il reste des dépenses.
  // Seul un résumé déjà détaillé-supprimé et sans dépenses restantes est fiable tel quel.
  if (duMois.length === 0 && !resume) return { idsDepenses, resume: null, supprimerResume: false };
  if (duMois.length === 0 && resume.detailSupprime === true) return { idsDepenses, resume, supprimerResume: false };
  const recalcule = calculerResume(mois, duMois, {
    epargne: resume?.epargne ?? 0, epargneParEnveloppe: resume?.epargneParEnveloppe ?? {}, maintenant,
  });
  return { idsDepenses, resume: { ...recalcule, detailSupprime: true }, supprimerResume: false };
}

// Paramètre d'URL : un vrai AAAA-MM, strictement avant le mois en cours.
export function moisSupprimable(mois, moisCourant) {
  if (typeof mois !== 'string' || !/^\d{4}-(0[1-9]|1[0-2])$/.test(mois)) return false;
  return comparer(mois, moisCourant) < 0;
}

export function repartitionDonut(parCategorie, categories) {
  // Les catégories inconnues (supprimées) retombent dans « autre ».
  const montants = new Map();
  for (const [id, montant] of Object.entries(parCategorie)) {
    if (!(montant > 0)) continue;
    const cible = categorieDeRepli(id, categories);
    montants.set(cible, (montants.get(cible) ?? 0) + montant);
  }
  const total = [...montants.values()].reduce((s, m) => s + m, 0);
  if (total === 0) return [];

  let entrees = [...montants].map(([id, montant]) => ({ id, montant }));
  entrees.sort((a, b) => b.montant - a.montant);
  if (entrees.length > MAX_PARTS_DONUT) {
    const gardees = entrees.filter((e) => e.id !== 'autre').slice(0, MAX_PARTS_DONUT - 1);
    const reste = total - gardees.reduce((s, e) => s + e.montant, 0);
    entrees = [...gardees, { id: 'autre', montant: reste }];
    entrees.sort((a, b) => b.montant - a.montant);
  }
  return entrees.map(({ id, montant }) => {
    const cat = categories.find((c) => c.id === id);
    return {
      id,
      nom: cat ? cat.nom : 'Autre',
      couleur: cat ? cat.couleur : '#9AA0A6',
      montant,
      pourcentage: Math.round((montant / total) * 100),
    };
  });
}

export function totauxSixMois(resumes, moisCourant, totalCourant) {
  const parMois = new Map(resumes.map((r) => [r.mois, r.total]));
  const mois = [];
  let m = moisCourant;
  for (let i = 0; i < 6; i++) {
    mois.unshift(m);
    m = moisPrecedent(m);
  }
  return mois.map((mm) => (moisEntre(mm, moisCourant) === 0
    ? { mois: mm, total: totalCourant, courant: true }
    : { mois: mm, total: parMois.has(mm) ? parMois.get(mm) : null, courant: false }));
}

// Un mois apparaît s'il a des dépenses ou un résumé ; seuls les mois passés sont supprimables.
export function lignesHistorique(stats, resumes, moisCourant) {
  const parMois = new Map();
  for (const s of stats) parMois.set(s.mois, { nbDepenses: s.nbDepenses, taille: s.taille });
  const detailSupprime = new Map(resumes.map((r) => [r.mois, r.detailSupprime === true]));
  const mois = new Set([...parMois.keys(), ...detailSupprime.keys()]);
  return [...mois].sort((a, b) => comparer(b, a)).map((m) => ({
    mois: m,
    nbDepenses: parMois.get(m)?.nbDepenses ?? 0,
    taille: parMois.get(m)?.taille ?? 0,
    detailSupprime: detailSupprime.get(m) === true,
    supprimable: comparer(m, moisCourant) < 0,
  }));
}
