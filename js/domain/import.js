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

const FORMAT_MOIS = /^\d{4}-(0[1-9]|1[0-2])$/;
const idValide = (o) => typeof o.id === 'string' && o.id !== '';
const entierPositif = (n) => Number.isInteger(n) && n > 0;
const moisValide = (m) => typeof m === 'string' && FORMAT_MOIS.test(m);
const facultatif = (v, test) => v === undefined || test(v);

const depenseValide = (d) => estObjet(d)
  && idValide(d)
  && entierPositif(d.montant)
  && dateValide(d.date)
  && facultatif(d.note, (v) => typeof v === 'string')
  && facultatif(d.provisionId, (v) => typeof v === 'string')
  && facultatif(d.reserve, (v) => Number.isInteger(v) && v >= 0);

const resumeValide = (r) => estObjet(r)
  && moisValide(r.mois)
  && Number.isInteger(r.total) && r.total >= 0;

const enveloppeValide = (e) => estObjet(e)
  && idValide(e)
  && (e.type === 'plaisir' || e.type === 'epargne')
  && entierPositif(e.montantMensuel);

const provisionValide = (p) => estObjet(p)
  && idValide(p)
  && entierPositif(p.montantTotal)
  && moisValide(p.moisEcheance);

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
    || !donnees.revenus.every(ligneValide) || !donnees.charges.every(ligneValide) || !donnees.categories.every(categorieValide)
    || !donnees.resumes.every(resumeValide) || !donnees.enveloppes.every(enveloppeValide) || !donnees.provisions.every(provisionValide)) {
    return { ok: false, erreur: ERR_CORROMPU };
  }
  return { ok: true, donnees };
}
