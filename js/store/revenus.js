import { lireTout, lire, ecrire, supprimer } from '../db.js';

export function listerRevenus() {
  return lireTout('revenus');
}

// Modification à effet immédiat (D4) : `id`, `creeLe` et `actifDepuis` sont conservés.
export async function enregistrerRevenu(valeurs, { id, moisCourant }) {
  const existant = id ? await lire('revenus', id) : undefined;
  const revenu = {
    ...valeurs,
    id: existant ? existant.id : (id || crypto.randomUUID()),
    actifDepuis: existant ? existant.actifDepuis : moisCourant,
    creeLe: existant ? existant.creeLe : new Date().toISOString(),
  };
  await ecrire('revenus', revenu);
  return revenu;
}

export function supprimerRevenu(id) {
  return supprimer('revenus', id);
}
