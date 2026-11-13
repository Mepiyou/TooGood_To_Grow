import { lireTout, lire, ecrire, supprimer, transaction } from '../db.js';
import { provisionsAEcheance, planSoldeProvision } from '../domain/provisions.js';

export function listerProvisions() {
  return lireTout('provisions');
}

// `valeurs` vient de validerProvision. En modification, `debut` est conservé : le déjà réservé se recalcule (D35).
export async function enregistrerProvision(valeurs, { id, moisCourant }) {
  let provision;
  if (id) {
    const existante = await lire('provisions', id);
    if (!existante) throw new Error(`Provision introuvable : ${id}`);
    provision = { ...existante, ...valeurs };
  } else {
    provision = { ...valeurs, id: crypto.randomUUID(), debut: moisCourant, creeLe: new Date().toISOString() };
  }
  await ecrire('provisions', provision);
  return provision;
}

export function supprimerProvision(id) {
  return supprimer('provisions', id);
}

// D44 : dépense de solde ajoutée et provision supprimée dans la même transaction (jamais l'une sans l'autre).
// La provision est relue dans la transaction : un second onglet lancé en même temps ne la solde pas deux fois.
// Renvoie les dépenses créées.
export async function solderProvisionsEchues(moisCourant, maintenant) {
  const echues = provisionsAEcheance(await lireTout('provisions'), moisCourant);
  if (echues.length === 0) return [];
  const creees = [];
  await transaction(['provisions', 'depenses'], 'readwrite', (tx) => {
    const magasinDepenses = tx.objectStore('depenses');
    const magasinProvisions = tx.objectStore('provisions');
    for (const { id } of echues) {
      const demande = magasinProvisions.get(id);
      demande.onsuccess = () => {
        if (!demande.result) return;
        const depense = { ...planSoldeProvision(demande.result, maintenant).depense, id: crypto.randomUUID() };
        magasinDepenses.put(depense);
        magasinProvisions.delete(id);
        creees.push(depense);
      };
    }
  });
  return creees;
}
