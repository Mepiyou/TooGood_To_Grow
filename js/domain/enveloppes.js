import { datePourMois } from './reception.js';
import { validerNom } from './charges.js';
import { parseMontant } from './montant.js';
import { formatMontant } from '../ui/format.js';

const MAX_EPARGNE = 3;

// D37 : 1 Plaisir et 3 Épargne au plus ; l'enveloppe modifiée ne compte pas contre elle-même.
// D45 : le budget plaisir ne peut pas dépasser le reste à vivre du moment.
export function validerEnveloppe({ type, nom, montantTexte, revenuSourceId }, { enveloppes = [], idEnCours = null, resteAVivre } = {}) {
  const erreurs = {};
  const autres = enveloppes.filter((e) => e.id !== idEnCours);
  if (type === 'plaisir') {
    if (autres.some((e) => e.type === 'plaisir')) erreurs.type = 'Une seule enveloppe Plaisir.';
  } else if (type === 'epargne') {
    if (autres.filter((e) => e.type === 'epargne').length >= MAX_EPARGNE) erreurs.type = 'Trois enveloppes Épargne maximum.';
  } else {
    erreurs.type = "Choisis un type d'enveloppe.";
  }

  const n = validerNom(nom);
  if (n.erreur) erreurs.nom = n.erreur;

  const montant = parseMontant(montantTexte);
  if (!montant.ok) erreurs.montant = montant.erreur;
  else if (type === 'plaisir' && typeof resteAVivre === 'number' && montant.centimes > resteAVivre) {
    erreurs.montant = `Le budget plaisir ne peut pas dépasser ton reste à vivre (${formatMontant(resteAVivre)}).`;
  }

  const source = String(revenuSourceId ?? '');
  if (type === 'epargne' && source === '') erreurs.revenuSourceId = 'Choisis le revenu sur lequel épargner.';

  if (Object.keys(erreurs).length > 0) return { ok: false, erreurs };
  const valeurs = { type, nom: n.valeur, montantMensuel: montant.centimes };
  if (type === 'epargne') valeurs.revenuSourceId = source;
  return { ok: true, erreurs, valeurs };
}

// D36 : une épargne est déduite dès que son revenu source est reçu pour `mois` (au plus tard `jusquA`).
export function epargneDuMois(enveloppes, revenus, mois, jusquA) {
  const parEnveloppe = {};
  let total = 0;
  for (const e of enveloppes) {
    if (e.type !== 'epargne' || e.suspendue || e.actifDepuis > mois) continue;
    const source = revenus.find((r) => r.id === e.revenuSourceId);
    if (!source) continue;
    const date = datePourMois(source, mois);
    if (date === null || date > jusquA) continue;
    parEnveloppe[e.id] = e.montantMensuel;
    total += e.montantMensuel;
  }
  return { total, parEnveloppe };
}

export function restantPlaisir(enveloppe, depensesDuMois) {
  const depense = depensesDuMois
    .filter((d) => d.categorieId === 'plaisir')
    .reduce((somme, d) => somme + d.montant, 0);
  return enveloppe.montantMensuel - depense;
}

export function depassementPlaisir(enveloppe, depensesDuMois, montantAjoute) {
  return restantPlaisir(enveloppe, depensesDuMois) - montantAjoute < 0;
}

// D42 : recalculé depuis les résumés, jamais incrémenté (pas de double comptage après import ou recalcul).
export function totalCumuleDepuisResumes(enveloppeId, resumes) {
  return resumes.reduce((somme, r) => somme + (r.epargneParEnveloppe?.[enveloppeId] ?? 0), 0);
}

// Enveloppes Épargne dont le cumul stocké diffère des résumés, avec le cumul corrigé.
export function totauxCumules(enveloppes, resumes) {
  const maj = [];
  for (const e of enveloppes) {
    if (e.type !== 'epargne') continue;
    const total = totalCumuleDepuisResumes(e.id, resumes);
    if (e.totalCumule !== total) maj.push({ ...e, totalCumule: total });
  }
  return maj;
}
