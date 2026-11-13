import { dateValide, moisDe, comparer } from './dates.js';
import { parseMontant } from './montant.js';

export function validerDateDepense(date, aujourdhui, moisDetailSupprime) {
  if (!dateValide(date)) return 'Date invalide.';
  if (comparer(date, aujourdhui) > 0) return 'La date ne peut pas être dans le futur.';
  if (moisDetailSupprime.includes(moisDe(date))) return 'Le détail de ce mois a été supprimé.';
  return null;
}

export function trierParDateDesc(depenses) {
  return [...depenses].sort((a, b) => comparer(b.date, a.date) || comparer(b.creeLe ?? '', a.creeLe ?? ''));
}

export function moisDetailSupprime(resumes) {
  return resumes.filter((r) => r.detailSupprime === true).map((r) => r.mois);
}

// Saisie de l'écran d'ajout : un message par champ en erreur (`montant`, `categorie`, `date`).
export function validerDepense({ montantTexte, categorieId, date }, { aujourdhui, moisDetailSupprime: moisSupprimes, categories }) {
  const erreurs = {};
  const montant = parseMontant(montantTexte);
  if (!montant.ok) erreurs.montant = montant.erreur;
  if (!categories.some((c) => c.id === categorieId)) erreurs.categorie = 'Choisis une catégorie.';
  const erreurDate = validerDateDepense(date, aujourdhui, moisSupprimes);
  if (erreurDate) erreurs.date = erreurDate;
  const ok = Object.keys(erreurs).length === 0;
  return { ok, erreurs, valeurs: ok ? { montant: montant.centimes, categorieId, date } : null };
}

// En modification, `creeLe` et la `note` éventuelle (D17, non affichée) sont conservés.
export function construireDepense({ id, montant, categorieId, date }, existant, maintenant) {
  return {
    ...existant,
    id,
    montant,
    categorieId,
    date,
    mois: moisDe(date),
    creeLe: existant ? existant.creeLe : maintenant,
    modifieLe: maintenant,
  };
}

export function totalDepenses(depenses) {
  return depenses.reduce((somme, d) => somme + d.montant, 0);
}

// Un groupe par jour, du plus récent au plus ancien ; les lignes du jour suivent l'ordre de trierParDateDesc.
export function groupesParJour(depenses) {
  const groupes = [];
  for (const depense of trierParDateDesc(depenses)) {
    const dernier = groupes[groupes.length - 1];
    if (dernier && dernier.date === depense.date) dernier.depenses.push(depense);
    else groupes.push({ date: depense.date, depenses: [depense] });
  }
  return groupes;
}

// Taille approximative d'un mois = longueur du JSON de ses dépenses (pas d'octets exacts sur disque).
export function statsParMois(depenses) {
  const parMois = new Map();
  for (const d of depenses) {
    const m = d.mois ?? moisDe(d.date);
    if (!parMois.has(m)) parMois.set(m, []);
    parMois.get(m).push(d);
  }
  return [...parMois].map(([mois, liste]) => ({ mois, nbDepenses: liste.length, taille: JSON.stringify(liste).length }));
}
