import { lireTout, lire, ecrire, supprimer } from '../db.js';
import { creerCharge, modifierCharge, supprimerCharge as marquerSupprimee } from '../domain/charges.js';

export function listerCharges() {
  return lireTout('charges');
}

async function lireExistante(id) {
  const existante = await lire('charges', id);
  if (!existante) throw new Error(`Charge introuvable : ${id}`);
  return existante;
}

// La modification relit l'enregistrement : l'historique stocké fait foi, pas la copie affichée.
export async function enregistrerCharge(valeurs, { id, moisCourant }) {
  const charge = id
    ? modifierCharge(await lireExistante(id), valeurs, moisCourant)
    : { ...creerCharge(valeurs, moisCourant), id: crypto.randomUUID(), creeLe: new Date().toISOString() };
  await ecrire('charges', charge);
  return charge;
}

// D28 : une charge créée ce mois-ci est effacée ; D5 sinon : conservée avec `actifJusqua`, déduite ce mois-ci.
export async function supprimerCharge(id, moisCourant) {
  const charge = marquerSupprimee(await lireExistante(id), moisCourant);
  if (charge === null) {
    await supprimer('charges', id);
    return null;
  }
  await ecrire('charges', charge);
  return charge;
}
