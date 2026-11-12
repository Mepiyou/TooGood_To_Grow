import { lireTout, lire, ecrire } from '../db.js';
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

// D5 : l'enregistrement est conservé avec `actifJusqua`, la charge reste déduite ce mois-ci.
export async function supprimerCharge(id, moisCourant) {
  const charge = marquerSupprimee(await lireExistante(id), moisCourant);
  await ecrire('charges', charge);
  return charge;
}
