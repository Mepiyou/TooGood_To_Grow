import { lireTout, lire, ecrire, supprimer } from '../db.js';

export function listerEnveloppes() {
  return lireTout('enveloppes');
}

async function lireExistante(id) {
  const existante = await lire('enveloppes', id);
  if (!existante) throw new Error(`Enveloppe introuvable : ${id}`);
  return existante;
}

// `valeurs` vient de validerEnveloppe. En modification, le cumul, la suspension et la date de création sont conservés.
export async function enregistrerEnveloppe(valeurs, { id, moisCourant }) {
  let enveloppe;
  if (id) {
    const { revenuSourceId, ...existante } = await lireExistante(id);
    enveloppe = { ...existante, ...valeurs };
  } else {
    enveloppe = {
      ...valeurs, id: crypto.randomUUID(), totalCumule: 0, suspendue: false, creeLe: new Date().toISOString(), actifDepuis: moisCourant,
    };
  }
  await ecrire('enveloppes', enveloppe);
  return enveloppe;
}

export async function suspendreEnveloppe(id, suspendue) {
  const enveloppe = { ...(await lireExistante(id)), suspendue: Boolean(suspendue) };
  await ecrire('enveloppes', enveloppe);
  return enveloppe;
}

export function supprimerEnveloppe(id) {
  return supprimer('enveloppes', id);
}
