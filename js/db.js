const NOM_BASE = 'toogood';
const VERSION = 1;

let promesseDB = null;

// Migrations par version : chaque bloc ne s'exécute que si la base est plus ancienne.
// Ne jamais supprimer un store sans migrer ses données.
function migrer(db, tx, ancienneVersion) {
  if (ancienneVersion < 1) {
    for (const nom of ['revenus', 'charges', 'categories', 'enveloppes', 'provisions']) {
      db.createObjectStore(nom, { keyPath: 'id' });
    }
    const depenses = db.createObjectStore('depenses', { keyPath: 'id' });
    depenses.createIndex('mois', 'mois');
    db.createObjectStore('resumes', { keyPath: 'mois' });
    db.createObjectStore('meta', { keyPath: 'cle' });
  }
}

export function ouvrirDB() {
  if (!promesseDB) {
    promesseDB = new Promise((resolve, reject) => {
      const demande = indexedDB.open(NOM_BASE, VERSION);
      demande.onupgradeneeded = (e) => migrer(demande.result, demande.transaction, e.oldVersion);
      demande.onsuccess = () => {
        const db = demande.result;
        // Safari iOS ferme la connexion d'une PWA restée en arrière-plan : la promesse en cache
        // serait morte, on la libère pour rouvrir la base au prochain appel.
        db.onclose = () => { promesseDB = null; };
        db.onversionchange = () => { db.close(); promesseDB = null; };
        resolve(db);
      };
      demande.onerror = () => reject(demande.error);
      demande.onblocked = () => reject(new Error('Ouverture de la base bloquée'));
    }).catch((erreur) => {
      promesseDB = null; // permet une nouvelle tentative
      throw erreur;
    });
  }
  return promesseDB;
}

function requete(store, mode, action) {
  return ouvrirDB().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(store, mode);
    const demande = action(tx.objectStore(store));
    tx.oncomplete = () => resolve(demande.result);
    tx.onabort = () => reject(tx.error || new Error('Transaction annulée'));
  }));
}

export function lireTout(store) {
  return requete(store, 'readonly', (s) => s.getAll());
}

export function lire(store, cle) {
  return requete(store, 'readonly', (s) => s.get(cle));
}

export function ecrire(store, objet) {
  return requete(store, 'readwrite', (s) => s.put(objet));
}

export function supprimer(store, cle) {
  return requete(store, 'readwrite', (s) => s.delete(cle));
}

export function parIndex(store, index, valeur) {
  return requete(store, 'readonly', (s) => s.index(index).getAll(valeur));
}

// Tout ou rien : résolue quand la transaction est validée, rejetée sur erreur ou abandon.
export function transaction(stores, mode, fn) {
  return ouvrirDB().then((db) => new Promise((resolve, reject) => {
    const tx = db.transaction(stores, mode);
    tx.oncomplete = () => resolve();
    tx.onabort = () => reject(tx.error || new Error('Transaction annulée'));
    try {
      fn(tx);
    } catch (erreur) {
      tx.abort();
      reject(erreur);
    }
  }));
}
