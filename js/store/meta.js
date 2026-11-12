import { lire, ecrire } from '../db.js';

export async function lireMeta(cle) {
  const enregistrement = await lire('meta', cle);
  return enregistrement ? enregistrement.valeur : undefined;
}

export function ecrireMeta(cle, valeur) {
  return ecrire('meta', { cle, valeur });
}
