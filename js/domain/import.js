import { dateValide, moisDe } from './dates.js';

const CHAMPS = ['revenus', 'charges', 'depenses', 'categories', 'resumes', 'enveloppes', 'provisions'];
const ERR_APP = "Ce fichier n'est pas une sauvegarde TooGood To Grow.";
const ERR_VERSION = 'Version de sauvegarde non prise en charge.';
const ERR_CORROMPU = 'Fichier incomplet ou corrompu.';

const estObjet = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);

export function construireExport(donnees, { maintenant, perimetre = 'tout' }) {
  const complet = {};
  for (const champ of CHAMPS) complet[champ] = donnees?.[champ] ?? [];
  return { app: 'toogood', schemaVersion: 1, exporteLe: maintenant, perimetre, donnees: complet };
}

// Le `mois` d'une dépense est un index dérivé : on ne fait pas confiance à celui du fichier.
export function ligneAImporter(nom, ligne) {
  return nom === 'depenses' ? { ...ligne, mois: moisDe(ligne.date) } : ligne;
}

export function nomFichierExport(aujourdhui, mois) {
  return `toogood-${mois ?? aujourdhui}.json`;
}

const depenseValide = (d) => estObjet(d)
  && typeof d.id === 'string' && d.id !== ''
  && Number.isInteger(d.montant) && d.montant > 0
  && dateValide(d.date);

const categorieValide = (c) => estObjet(c)
  && typeof c.id === 'string' && c.id !== ''
  && typeof c.nom === 'string' && c.nom !== '';

const ligneValide = (l) => estObjet(l)
  && typeof l.id === 'string' && l.id !== ''
  && Number.isInteger(l.montant) && l.montant > 0;

export function validerImport(objet) {
  if (!estObjet(objet) || objet.app !== 'toogood') return { ok: false, erreur: ERR_APP };
  if (objet.schemaVersion !== 1) return { ok: false, erreur: ERR_VERSION };
  const { donnees } = objet;
  if (!estObjet(donnees) || !CHAMPS.every((c) => Array.isArray(donnees[c]))
    || !donnees.depenses.every(depenseValide)
    || !donnees.revenus.every(ligneValide) || !donnees.charges.every(ligneValide) || !donnees.categories.every(categorieValide)) {
    return { ok: false, erreur: ERR_CORROMPU };
  }
  return { ok: true, donnees };
}
