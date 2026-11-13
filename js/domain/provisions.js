import { moisEntre, moisSuivant } from './dates.js';
import { validerNom } from './charges.js';
import { parseMontant } from './montant.js';

export function partMensuelle(provision, mois, dejaReserve = 0) {
  const moisRestants = Math.max(1, moisEntre(mois, provision.moisEcheance));
  return Math.ceil((provision.montantTotal - dejaReserve) / moisRestants);
}

// Somme des parts des mois de debut (inclus) à mois (exclu), chaque part tenant compte du cumul précédent.
export function dejaReserve(provision, mois) {
  let cumul = 0;
  for (let m = provision.debut; m < mois && m < provision.moisEcheance; m = moisSuivant(m)) {
    cumul += partMensuelle(provision, m, cumul);
  }
  return cumul;
}

export function partDuMois(provision, mois) {
  if (mois < provision.debut || mois >= provision.moisEcheance) return 0;
  return partMensuelle(provision, mois, dejaReserve(provision, mois));
}

export function provisionsDuMois(provisions, mois) {
  return provisions.reduce((somme, p) => somme + partDuMois(p, mois), 0);
}

const FORMAT_MOIS = /^\d{4}-(0[1-9]|1[0-2])$/;

export function validerProvision({ nom, montantTexte, moisEcheance }, moisCourant) {
  const erreurs = {};
  const n = validerNom(nom);
  if (n.erreur) erreurs.nom = n.erreur;
  const montant = parseMontant(montantTexte);
  if (!montant.ok) erreurs.montant = montant.erreur;
  if (typeof moisEcheance !== 'string' || !FORMAT_MOIS.test(moisEcheance) || moisEcheance <= moisCourant) {
    erreurs.moisEcheance = "Choisis un mois d'échéance après ce mois-ci.";
  }
  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs };
  return { ok: true, erreurs, valeurs: { nom: n.valeur, montantTotal: montant.centimes, moisEcheance } };
}

export function provisionsAEcheance(provisions, moisCourant) {
  return provisions.filter((p) => p.moisEcheance <= moisCourant);
}

// D34, D44 : la dépense de solde garde `provisionId` et le montant déjà réservé (`reserve`),
// que le reste à vivre du mois réintègre pour ne pas compter deux fois l'argent mis de côté.
export function planSoldeProvision(provision, maintenant) {
  return {
    provisionId: provision.id,
    depense: {
      montant: provision.montantTotal,
      categorieId: 'autre',
      note: `Provision : ${provision.nom}`,
      date: `${provision.moisEcheance}-01`,
      mois: provision.moisEcheance,
      provisionId: provision.id,
      reserve: dejaReserve(provision, provision.moisEcheance),
      creeLe: maintenant,
    },
  };
}

// D44 : somme des montants déjà réservés libérés par les provisions soldées dans ces dépenses.
export function provisionsLiberees(depensesDuMois) {
  return depensesDuMois.reduce((somme, d) => somme + (d.provisionId ? (d.reserve ?? 0) : 0), 0);
}
