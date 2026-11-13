import { lireTout, transaction } from './db.js';
import { construireExport, nomFichierExport, validerImport } from './domain/import.js';
import { moisDe } from './domain/dates.js';
import { initialiserCategories } from './store/categories.js';
import { cloturerMoisPasses } from './store/resumes.js';

const STORES = ['revenus', 'charges', 'depenses', 'categories', 'resumes', 'enveloppes', 'provisions'];
const CONFIRMATION = 'Remplacer toutes tes données par celles du fichier ?';

async function lireDonnees() {
  const listes = await Promise.all(STORES.map((s) => lireTout(s)));
  return Object.fromEntries(STORES.map((s, i) => [s, listes[i]]));
}

function telecharger(contenu, nom) {
  const url = URL.createObjectURL(new Blob([JSON.stringify(contenu, null, 2)], { type: 'application/json' }));
  const lien = document.createElement('a');
  lien.href = url;
  lien.download = nom;
  document.body.append(lien);
  lien.click();
  lien.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export async function exporterTout(aujourdhui) {
  const donnees = await lireDonnees();
  const contenu = construireExport(donnees, { maintenant: new Date().toISOString(), perimetre: 'tout' });
  telecharger(contenu, nomFichierExport(aujourdhui));
}

// Export d'un mois : ses dépenses et son résumé ; le reste est exporté en entier (revenus, charges, catégories…).
export async function exporterMois(mois, aujourdhui) {
  const donnees = await lireDonnees();
  donnees.depenses = donnees.depenses.filter((d) => (d.mois ?? moisDe(d.date)) === mois);
  donnees.resumes = donnees.resumes.filter((r) => r.mois === mois);
  const contenu = construireExport(donnees, { maintenant: new Date().toISOString(), perimetre: mois });
  telecharger(contenu, nomFichierExport(aujourdhui, mois));
}

// Efface et réécrit les 7 stores dans une seule transaction : en cas d'échec, rien ne change.
export async function importerFichier(fichier, aujourdhui) {
  let objet;
  try {
    objet = JSON.parse(await fichier.text());
  } catch {
    return { ok: false, erreur: 'Fichier illisible.' };
  }
  const validation = validerImport(objet);
  if (!validation.ok) return validation;
  if (!window.confirm(CONFIRMATION)) return { ok: false, annule: true };

  const { donnees } = validation;
  await transaction([...STORES, 'meta'], 'readwrite', (tx) => {
    for (const nom of STORES) {
      const store = tx.objectStore(nom);
      store.clear();
      for (const ligne of donnees[nom]) {
        store.put(nom === 'depenses' ? { ...ligne, mois: ligne.mois ?? moisDe(ligne.date) } : ligne);
      }
    }
    tx.objectStore('meta').delete('derniereCloture');
  });
  // Un fichier sans « Autre » laisserait l'app sans catégorie de repli : on re-sème les catégories par défaut.
  await initialiserCategories();
  await cloturerMoisPasses(moisDe(aujourdhui));
  return { ok: true };
}
