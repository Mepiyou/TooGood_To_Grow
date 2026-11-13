import { echapper } from '../ui/dom.js';
import { formatMois, formatNomMois, formatMontant, formatTaille, majuscule } from '../ui/format.js';
import { deposerMessage } from '../ui/message-flash.js';
import { moisDe, moisAChange } from '../domain/dates.js';
import { moisSupprimable } from '../domain/resume.js';
import { totalDepenses } from '../domain/depenses.js';
import { depensesDuMois } from '../store/depenses.js';
import { lireResume, supprimerMois } from '../store/resumes.js';
import { exporterMois } from '../export.js';

const ERREUR_SUPPRESSION = 'Impossible de supprimer ce mois. Réessaie.';
const ERREUR_EXPORT = "Impossible d'exporter ce mois. Réessaie.";

export function messageSuppression(mois, taille) {
  return `${majuscule(formatMois(mois))} supprimé — ${formatTaille(taille)} libérés`;
}

export function libelleRecap({ nbDepenses, total, taille, detailSupprime }) {
  if (detailSupprime) return `Détail déjà supprimé · ${formatMontant(total)}`;
  return `${nbDepenses} ${nbDepenses > 1 ? 'dépenses' : 'dépense'} · ${formatMontant(total)} · environ ${formatTaille(taille)}`;
}

function rendreRefus(container) {
  container.innerHTML = `<div class="vue-supprimer-mois">
    <h1>Supprimer un mois</h1>
    <p>Ce mois ne peut pas être supprimé.</p>
    <a class="bouton" href="#/historique">Retour à l'historique</a>
  </div>`;
}

export async function render(container, params, ctx) {
  const moisCourant = moisDe(ctx.aujourdhui());
  const mois = params.mois;
  if (!moisSupprimable(mois, moisCourant)) {
    rendreRefus(container);
    return;
  }
  const [depenses, resume] = await Promise.all([depensesDuMois(mois), lireResume(mois)]);
  if (!ctx.estActuel()) return;
  if (depenses.length === 0 && !resume) {
    rendreRefus(container);
    return;
  }

  const recap = {
    nbDepenses: depenses.length,
    total: depenses.length > 0 ? totalDepenses(depenses) : resume.total,
    taille: depenses.length > 0 ? JSON.stringify(depenses).length : 0,
    detailSupprime: depenses.length === 0,
  };
  const nom = formatMois(mois);

  container.innerHTML = `<div class="vue-supprimer-mois">
    <h1>Supprimer ${echapper(nom)}</h1>
    <p class="recap-mois">${echapper(libelleRecap(recap))}</p>
    <p class="avertissement-suppression">La suppression est définitive.</p>
    <div class="champ-case">
      <input type="checkbox" id="garder-totaux" checked aria-describedby="aide-garder-totaux">
      <label for="garder-totaux">Garder les totaux du mois</label>
      <p id="aide-garder-totaux" class="secondaire aide-case">Les graphiques garderont le total d'${echapper(formatNomMois(mois))}.</p>
    </div>
    <p class="erreur-formulaire" role="alert" hidden></p>
    <button type="button" class="bouton bouton-lien" data-action="exporter">Exporter ce mois avant</button>
    <button type="button" class="bouton bouton-danger" data-action="supprimer">Supprimer ${echapper(nom)}</button>
    <a class="bouton" href="#/historique">Annuler</a>
  </div>`;

  const vue = container.querySelector('.vue-supprimer-mois');
  const alerte = vue.querySelector('[role="alert"]');
  const caseTotaux = vue.querySelector('#garder-totaux');
  const boutonSupprimer = vue.querySelector('[data-action="supprimer"]');
  const erreur = (texte) => { alerte.textContent = texte; alerte.hidden = false; };

  vue.querySelector('[data-action="exporter"]').addEventListener('click', async () => {
    alerte.hidden = true;
    try {
      await exporterMois(mois, ctx.aujourdhui());
    } catch (e) {
      console.error(e);
      erreur(ERREUR_EXPORT);
    }
  });

  boutonSupprimer.addEventListener('click', async () => {
    boutonSupprimer.disabled = true;
    alerte.hidden = true;
    if (moisAChange(moisCourant, ctx.aujourdhui())) {
      ctx.rafraichir();
      return;
    }
    try {
      const taille = await supprimerMois({
        mois, moisCourant, garderTotaux: caseTotaux.checked, maintenant: new Date().toISOString(),
      });
      deposerMessage(messageSuppression(mois, taille));
      ctx.naviguer('#/historique');
    } catch (e) {
      console.error(e);
      erreur(ERREUR_SUPPRESSION);
      boutonSupprimer.disabled = false;
    }
  });
}
