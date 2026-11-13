import { echapper } from '../ui/dom.js';
import { formatMois, formatMoisCourt, formatEspace, formatTaille, formatMontant } from '../ui/format.js';
import { rendreOngletsDepenses } from '../ui/onglets.js';
import { rendreBarres } from '../ui/barres.js';
import { totauxSixMois, lignesHistorique } from '../domain/resume.js';
import { totalDepenses } from '../domain/depenses.js';
import { moisDe } from '../domain/dates.js';
import { listerResumes } from '../store/resumes.js';
import { depensesDuMois, statsParMois } from '../store/depenses.js';
import { prendreMessage } from '../ui/message-flash.js';
import { exporterTout, importerFichier } from '../export.js';

const ERREUR_EXPORT = "Impossible d'exporter les données. Réessaie.";
const ERREUR_IMPORT = "Impossible d'importer le fichier. Tes données n'ont pas été modifiées.";

async function lireUsage() {
  try {
    if (!navigator.storage || typeof navigator.storage.estimate !== 'function') return undefined;
    return (await navigator.storage.estimate()).usage;
  } catch {
    return undefined;
  }
}

export function libelleLigne(ligne) {
  const mois = formatMois(ligne.mois);
  if (ligne.detailSupprime) return `${mois} · totaux conservés`;
  const n = ligne.nbDepenses;
  return `${mois} · ${n} ${n > 1 ? 'dépenses' : 'dépense'} · environ ${formatTaille(ligne.taille)}`;
}

function rendreLigne(ligne) {
  const mois = formatMois(ligne.mois);
  const supprimer = ligne.supprimable
    ? `<a class="bouton bouton-compact" href="#/historique/supprimer/${encodeURIComponent(ligne.mois)}" aria-label="Supprimer ${echapper(mois)}">Supprimer</a>`
    : '';
  return `<li class="ligne-mois"><span class="ligne-mois-texte">${echapper(libelleLigne(ligne))}</span>${supprimer}</li>`;
}

export async function render(container, params, ctx) {
  const moisCourant = moisDe(ctx.aujourdhui());
  const [resumes, depensesCourantes, stats, usage] = await Promise.all([
    listerResumes(), depensesDuMois(moisCourant), statsParMois(), lireUsage(),
  ]);
  if (!ctx.estActuel()) return;

  const totaux = totauxSixMois(resumes, moisCourant, totalDepenses(depensesCourantes));
  const libelles = totaux.map((t) => ({ court: formatMoisCourt(t.mois), long: formatMois(t.mois) }));
  const lignes = lignesHistorique(stats, resumes, moisCourant);

  container.innerHTML = `<div class="vue-historique">
    <h1>Dépenses</h1>
    ${rendreOngletsDepenses('historique')}
    <h2 class="titre-section">6 derniers mois</h2>
    ${rendreBarres(totaux, libelles)}
    <div class="bandeau-stockage">
      <p class="espace-utilise">${echapper(formatEspace(usage))}</p>
      <div class="actions-stockage">
        <button type="button" class="bouton" data-action="exporter">Exporter</button>
        <label class="bouton bouton-fichier">Importer<input type="file" class="visuellement-masque" accept="application/json"></label>
      </div>
    </div>
    <p class="message-stockage" role="status" hidden></p>
    <p class="erreur-formulaire" role="alert" hidden></p>
    ${lignes.length > 0
    ? `<ul class="liste-mois">${lignes.map(rendreLigne).join('')}</ul>`
    : '<p class="secondaire etat-vide">Aucune dépense enregistrée.</p>'}
  </div>`;

  const vue = container.querySelector('.vue-historique');
  const confirmation = prendreMessage();
  if (confirmation) {
    const statut = vue.querySelector('[role="status"]');
    statut.textContent = confirmation;
    statut.hidden = false;
  }
  const alerte = vue.querySelector('[role="alert"]');
  const entree = vue.querySelector('input[type="file"]');
  const effacer = () => { alerte.hidden = true; };
  const erreur = (texte) => { alerte.textContent = texte; alerte.hidden = false; };

  vue.querySelector('[data-action="exporter"]').addEventListener('click', async () => {
    effacer();
    try {
      await exporterTout(ctx.aujourdhui());
    } catch (e) {
      console.error(e);
      erreur(ERREUR_EXPORT);
    }
  });

  entree.addEventListener('change', async () => {
    const fichier = entree.files[0];
    if (!fichier) return;
    effacer();
    let resultat;
    try {
      resultat = await importerFichier(fichier, ctx.aujourdhui());
    } catch (e) {
      console.error(e);
      resultat = { ok: false, erreur: ERREUR_IMPORT };
    }
    entree.value = '';
    if (resultat.annule) return;
    if (!resultat.ok) {
      erreur(resultat.erreur);
      return;
    }
    // Le routeur remplace la vue par une vue rechargée : le message est posé dans la nouvelle.
    const hote = container.parentNode;
    await ctx.rafraichir();
    const nouveau = hote ? hote.querySelector('.vue-historique [role="status"]') : null;
    if (!nouveau) return;
    nouveau.textContent = 'Données importées.';
    nouveau.hidden = false;
  });
}
