import { echapper } from '../ui/dom.js';
import { formatMontant, formatMois } from '../ui/format.js';
import { rendreOngletsMois } from '../ui/onglets.js';
import { creerPanneau } from '../ui/panneau.js';
import { partDuMois, dejaReserve, provisionsDuMois, validerProvision } from '../domain/provisions.js';
import { centimesVersSaisie } from '../domain/montant.js';
import { moisDe, moisSuivant } from '../domain/dates.js';
import { listerProvisions, enregistrerProvision, supprimerProvision } from '../store/provisions.js';

const CHAMPS = ['nom', 'montant', 'moisEcheance'];
const ERREUR_ENREGISTREMENT = "Impossible d'enregistrer cette provision. Réessaie dans un instant.";
const ERREUR_SUPPRESSION = 'Impossible de supprimer cette provision. Réessaie dans un instant.';

export function trierProvisions(provisions) {
  return [...provisions].sort((a, b) => a.moisEcheance.localeCompare(b.moisEcheance) || a.nom.localeCompare(b.nom, 'fr'));
}

// US8 : « 600 € pour mars 2027 » puis « 150 €/mois réservés · déjà 300 € de côté » (D35 : déjà réservé calculé).
// Le premier mois, rien n'est encore de côté : la mention est omise.
export function lignesProvision(provision, mois) {
  const deja = dejaReserve(provision, mois);
  const part = `${formatMontant(partDuMois(provision, mois))}/mois réservés`;
  return [
    `${formatMontant(provision.montantTotal)} pour ${formatMois(provision.moisEcheance)}`,
    deja > 0 ? `${part} · déjà ${formatMontant(deja)} de côté` : part,
  ];
}

export function libelleLigneProvision(provision, mois) {
  const deja = dejaReserve(provision, mois);
  const parties = [
    provision.nom,
    `${formatMontant(provision.montantTotal)} pour ${formatMois(provision.moisEcheance)}`,
    `${formatMontant(partDuMois(provision, mois))} par mois réservés`,
  ];
  if (deja > 0) parties.push(`déjà ${formatMontant(deja)} de côté`);
  return `Modifier : ${parties.join(', ')}`;
}

function rendreLigne(provision, mois) {
  const [echeance, reserve] = lignesProvision(provision, mois);
  return `<li><button type="button" class="ligne" data-id="${echapper(provision.id)}" aria-label="${echapper(libelleLigneProvision(provision, mois))}">
    <span class="ligne-texte">
      <span class="ligne-nom">${echapper(provision.nom)}</span>
      <span class="ligne-sous-titre">${echapper(echeance)}</span>
      <span class="ligne-sous-titre">${echapper(reserve)}</span>
    </span>
  </button></li>`;
}

function erreurChamp(champ) {
  return `<p class="erreur-champ" id="provision-${champ}-erreur" hidden></p>`;
}

const DIALOG = `<dialog class="panneau" aria-labelledby="provision-titre">
  <form class="formulaire" novalidate>
    <h2 id="provision-titre">Ajouter une provision</h2>
    <div class="champ">
      <label for="provision-nom">Nom</label>
      <input id="provision-nom" name="nom" type="text" maxlength="40" autocomplete="off">
      ${erreurChamp('nom')}
    </div>
    <div class="champ">
      <label for="provision-montant">Montant total</label>
      <input id="provision-montant" name="montant" type="text" inputmode="decimal" autocomplete="off">
      ${erreurChamp('montant')}
    </div>
    <div class="champ">
      <label for="provision-moisEcheance">Mois d'échéance</label>
      <input id="provision-moisEcheance" name="moisEcheance" type="month" autocomplete="off">
      ${erreurChamp('moisEcheance')}
    </div>
    <p class="erreur-formulaire" role="alert" hidden></p>
    <div class="actions">
      <button type="submit" class="bouton bouton-principal">Enregistrer</button>
      <button type="button" class="bouton" data-action="annuler">Annuler</button>
      <button type="button" class="bouton bouton-danger" data-action="supprimer">Supprimer</button>
    </div>
  </form>
</dialog>`;

export async function render(container, params, ctx) {
  const provisions = await listerProvisions();
  if (!ctx.estActuel()) return;
  const mois = moisDe(ctx.aujourdhui());
  const liste = trierProvisions(provisions);

  container.innerHTML = `<div class="vue-provisions">
    <h1>Mon mois</h1>
    ${rendreOngletsMois('provisions')}
    <p class="secondaire mention-mois">Répartis tes dépenses annuelles sur chaque mois</p>
    <p class="total-mois">Réservé ce mois : <strong>${echapper(formatMontant(provisionsDuMois(provisions, mois)))}</strong></p>
    ${liste.length > 0
    ? `<ul class="liste-lignes">${liste.map((p) => rendreLigne(p, mois)).join('')}</ul>`
    : '<p class="secondaire etat-vide">Aucune provision pour l\'instant.</p>'}
    <button type="button" class="bouton bouton-ajout" data-action="ajouter">Ajouter une provision</button>
    ${DIALOG}
  </div>`;

  const parId = new Map(liste.map((p) => [p.id, p]));
  const panneau = creerPanneau(container, {
    prefixe: 'provision', champs: CHAMPS, selecteurVue: '.vue-provisions', rafraichir: ctx.rafraichir, moisAffiche: mois, aujourdhui: ctx.aujourdhui,
  });
  const { dialog, champs } = panneau;
  const form = dialog.querySelector('form');
  const titre = dialog.querySelector('#provision-titre');
  const boutonSupprimer = dialog.querySelector('[data-action="supprimer"]');

  // Aide de saisie seulement : validerProvision reste la référence. Sans `type="month"` (Firefox, Safari
  // de bureau), le champ retombe en texte : le format attendu est alors indiqué.
  champs.moisEcheance.min = moisSuivant(mois);
  if (champs.moisEcheance.type !== 'month') {
    champs.moisEcheance.placeholder = 'AAAA-MM';
    champs.moisEcheance.inputMode = 'numeric';
    dialog.querySelector('label[for="provision-moisEcheance"]').textContent = "Mois d'échéance (AAAA-MM)";
  }

  function ouvrir(provision, declencheur) {
    panneau.ouvrir(provision, declencheur, () => {
      titre.textContent = provision ? 'Modifier la provision' : 'Ajouter une provision';
      boutonSupprimer.hidden = !provision;
      champs.nom.value = provision ? provision.nom : '';
      champs.montant.value = provision ? centimesVersSaisie(provision.montantTotal) : '';
      champs.moisEcheance.value = provision ? provision.moisEcheance : '';
    });
  }

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const provision = panneau.courant();
    if (panneau.estOccupe() || provision === undefined) return;
    if (panneau.moisPerime()) return;
    panneau.masquerEchec();
    const resultat = validerProvision(
      { nom: champs.nom.value, montantTexte: champs.montant.value, moisEcheance: champs.moisEcheance.value.trim() },
      mois,
    );
    panneau.afficherErreurs(resultat.erreurs);
    if (!resultat.ok) return;
    panneau.executer(async () => {
      const enregistree = await enregistrerProvision(resultat.valeurs, { id: provision ? provision.id : undefined, moisCourant: mois });
      return enregistree.id;
    }, ERREUR_ENREGISTREMENT);
  });

  boutonSupprimer.addEventListener('click', () => {
    const provision = panneau.courant();
    if (!provision) return;
    panneau.supprimer(
      `Supprimer la provision « ${provision.nom} » ?`,
      () => supprimerProvision(provision.id),
      ERREUR_SUPPRESSION,
    );
  });

  container.querySelector('[data-action="ajouter"]').addEventListener('click', (e) => ouvrir(null, e.currentTarget));

  const listeLignes = container.querySelector('.liste-lignes');
  if (listeLignes) {
    listeLignes.addEventListener('click', (e) => {
      const ligne = e.target.closest('button.ligne');
      if (ligne && parId.has(ligne.dataset.id)) ouvrir(parId.get(ligne.dataset.id), ligne);
    });
  }
}
