import { echapper } from '../ui/dom.js';
import { formatMontant } from '../ui/format.js';
import { creerPanneau } from '../ui/panneau.js';
import { calculerAccueil } from '../domain/budget.js';
import { validerEnveloppe, epargneDuMois, restantPlaisir, MAX_EPARGNE } from '../domain/enveloppes.js';
import { centimesVersSaisie } from '../domain/montant.js';
import { moisDe } from '../domain/dates.js';
import { listerEnveloppes, enregistrerEnveloppe, supprimerEnveloppe } from '../store/enveloppes.js';
import { listerRevenus } from '../store/revenus.js';
import { listerCharges } from '../store/charges.js';
import { listerProvisions } from '../store/provisions.js';
import { depensesDuMois } from '../store/depenses.js';

const CHAMPS = ['nom', 'montant', 'revenuSourceId'];
const ERREUR_ENREGISTREMENT = "Impossible d'enregistrer cette enveloppe. Réessaie dans un instant.";
const ERREUR_SUPPRESSION = 'Impossible de supprimer cette enveloppe. Réessaie dans un instant.';
const LIBELLES_TYPE = { plaisir: 'Plaisir', epargne: 'Épargne' };

function depensePlaisir(enveloppe, depensesMois) {
  return enveloppe.montantMensuel - restantPlaisir(enveloppe, depensesMois);
}

// US6 : « Restant : 32 € sur 60 € », ou « Dépassé de 5 € sur 60 € » (D45 : le dépassement est permis).
export function textePlaisir(enveloppe, depensesMois) {
  const restant = restantPlaisir(enveloppe, depensesMois);
  const budget = formatMontant(enveloppe.montantMensuel);
  if (restant < 0) return { texte: `Dépassé de ${formatMontant(-restant)} sur ${budget}`, depasse: true };
  return { texte: `Restant : ${formatMontant(restant)} sur ${budget}`, depasse: false };
}

// Barre de la part dépensée, bornée au budget ; le texte lu donne le montant réel.
export function progressionPlaisir(enveloppe, depensesMois) {
  const depense = depensePlaisir(enveloppe, depensesMois);
  const max = enveloppe.montantMensuel;
  const valeur = Math.min(Math.max(depense, 0), max);
  return {
    valeur,
    max,
    pourcent: max > 0 ? Math.round((valeur / max) * 100) : 0,
    texteLu: `${formatMontant(depense)} dépensés sur ${formatMontant(max)}`,
  };
}

export function sousTitreEpargne(enveloppe, revenus) {
  const source = revenus.find((r) => r.id === enveloppe.revenuSourceId);
  const montant = `${formatMontant(enveloppe.montantMensuel)}/mois`;
  return source ? `${montant} sur ${source.nom}` : `${montant} · revenu supprimé`;
}

// US7 : cumul des mois clôturés (D42) plus l'épargne du mois en cours si elle est déjà déduite (D36).
export function totalEpargne(enveloppe, epargneMois) {
  return (enveloppe.totalCumule ?? 0) + (epargneMois.parEnveloppe[enveloppe.id] ?? 0);
}

// D37 : 1 Plaisir et 3 Épargne au plus.
export function typesDisponibles(enveloppes) {
  return {
    plaisir: !enveloppes.some((e) => e.type === 'plaisir'),
    epargne: enveloppes.filter((e) => e.type === 'epargne').length < MAX_EPARGNE,
  };
}

export function libelleLigneEnveloppe(enveloppe) {
  const parties = [enveloppe.nom, LIBELLES_TYPE[enveloppe.type].toLowerCase(), `${formatMontant(enveloppe.montantMensuel)} par mois`];
  if (enveloppe.type === 'epargne' && enveloppe.suspendue) parties.push('suspendue');
  return `Modifier : ${parties.join(', ')}`;
}

function boutonModifier(enveloppe, sousTitre) {
  return `<button type="button" class="ligne" data-id="${echapper(enveloppe.id)}" aria-label="${echapper(libelleLigneEnveloppe(enveloppe))}">
      <span class="ligne-texte"><span class="ligne-nom">${echapper(enveloppe.nom)}</span><span class="ligne-sous-titre">${echapper(sousTitre)}</span></span>
      <span class="ligne-modifier" aria-hidden="true">Modifier</span>
    </button>`;
}

function rendrePlaisir(enveloppe, depensesMois) {
  const { texte, depasse } = textePlaisir(enveloppe, depensesMois);
  const p = progressionPlaisir(enveloppe, depensesMois);
  return `<li class="carte-enveloppe${depasse ? ' carte-depassee' : ''}">
    <h2 class="carte-type">Plaisir</h2>
    ${boutonModifier(enveloppe, `${formatMontant(enveloppe.montantMensuel)}/mois`)}
    <p class="restant-plaisir">${echapper(texte)}</p>
    <div class="barre-progression" role="progressbar" aria-label="Budget plaisir dépensé" aria-valuemin="0" aria-valuemax="${p.max}" aria-valuenow="${p.valeur}" aria-valuetext="${echapper(p.texteLu)}">
      <div class="barre-remplie" style="width:${p.pourcent}%"></div>
    </div>
  </li>`;
}

function rendreEpargne(enveloppe, revenus, epargneMois) {
  return `<li class="carte-enveloppe">
    <h2 class="carte-type">Épargne</h2>
    ${boutonModifier(enveloppe, sousTitreEpargne(enveloppe, revenus))}
    ${enveloppe.suspendue ? '<p class="mention-suspendue">Suspendue</p>' : ''}
    <p class="total-epargne">Total épargné : <strong>${echapper(formatMontant(totalEpargne(enveloppe, epargneMois)))}</strong></p>
  </li>`;
}

function erreurChamp(champ) {
  return `<p class="erreur-champ" id="enveloppe-${champ}-erreur" hidden></p>`;
}

const DIALOG = `<dialog class="panneau" aria-labelledby="enveloppe-titre">
  <form class="formulaire" novalidate>
    <h2 id="enveloppe-titre">Créer une enveloppe</h2>
    <fieldset class="champ groupe-options">
      <legend>Type</legend>
      <label class="option"><input type="radio" name="type" value="plaisir"> Plaisir</label>
      <label class="option"><input type="radio" name="type" value="epargne"> Épargne</label>
      <p class="secondaire" id="enveloppe-type-aide" hidden></p>
      <p class="erreur-champ" id="enveloppe-type-erreur" hidden></p>
    </fieldset>
    <div class="champ">
      <label for="enveloppe-nom">Nom</label>
      <input id="enveloppe-nom" name="nom" type="text" maxlength="40" autocomplete="off">
      ${erreurChamp('nom')}
    </div>
    <div class="champ">
      <label for="enveloppe-montant">Montant mensuel</label>
      <input id="enveloppe-montant" name="montant" type="text" inputmode="decimal" autocomplete="off">
      ${erreurChamp('montant')}
    </div>
    <div class="champ" data-pour="epargne">
      <label for="enveloppe-revenuSourceId">Revenu source</label>
      <select id="enveloppe-revenuSourceId" name="revenuSourceId"></select>
      ${erreurChamp('revenuSourceId')}
    </div>
    <div class="champ" data-pour="suspension">
      <label class="option"><input type="checkbox" name="suspendue"> Suspendre l'épargne</label>
    </div>
    <p class="erreur-formulaire" role="alert" hidden></p>
    <div class="actions">
      <button type="submit" class="bouton bouton-principal">Enregistrer</button>
      <button type="button" class="bouton" data-action="annuler">Annuler</button>
      <button type="button" class="bouton bouton-danger" data-action="supprimer">Supprimer</button>
    </div>
  </form>
</dialog>`;

function optionsRevenus(revenus) {
  const tries = [...revenus].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'));
  const premiere = tries.length > 0 ? 'Choisis un revenu' : "Aucun revenu : ajoute d'abord un revenu";
  return `<option value="">${echapper(premiere)}</option>`
    + tries.map((r) => `<option value="${echapper(r.id)}">${echapper(r.nom)}</option>`).join('');
}

export async function render(container, params, ctx) {
  const aujourdhui = ctx.aujourdhui();
  const mois = moisDe(aujourdhui);
  const [enveloppes, revenus, charges, provisions, depensesMois] = await Promise.all([
    listerEnveloppes(), listerRevenus(), listerCharges(), listerProvisions(), depensesDuMois(mois),
  ]);
  if (!ctx.estActuel()) return;

  // Reste à vivre du moment, calculé comme sur l'accueil (D45 : plafond du budget plaisir).
  const { resteAVivre } = calculerAccueil({ revenus, charges, depenses: depensesMois, aujourdhui, enveloppes, provisions });
  const epargneMois = epargneDuMois(enveloppes, revenus, mois, aujourdhui);
  const plaisir = enveloppes.find((e) => e.type === 'plaisir');
  const epargnes = enveloppes.filter((e) => e.type === 'epargne')
    .sort((a, b) => (a.creeLe ?? '').localeCompare(b.creeLe ?? '') || a.nom.localeCompare(b.nom, 'fr'));
  const disponibles = typesDisponibles(enveloppes);
  const complet = !disponibles.plaisir && !disponibles.epargne;

  const cartes = [
    ...(plaisir ? [rendrePlaisir(plaisir, depensesMois)] : []),
    ...epargnes.map((e) => rendreEpargne(e, revenus, epargneMois)),
  ];

  container.innerHTML = `<div class="vue-enveloppes">
    <h1>Enveloppes</h1>
    ${cartes.length > 0
    ? `<ul class="liste-enveloppes">${cartes.join('')}</ul>`
    : '<p class="secondaire etat-vide">Aucune enveloppe pour l\'instant.</p>'}
    ${complet ? '<p class="secondaire aide-limite" id="enveloppes-limite">Tu as déjà 1 enveloppe Plaisir et 3 enveloppes Épargne, le maximum.</p>' : ''}
    <button type="button" class="bouton bouton-ajout" data-action="ajouter"${complet ? ' disabled aria-describedby="enveloppes-limite"' : ''}>Créer une enveloppe</button>
    ${DIALOG}
  </div>`;

  const parId = new Map(enveloppes.map((e) => [e.id, e]));
  const panneau = creerPanneau(container, {
    prefixe: 'enveloppe', champs: CHAMPS, selecteurVue: '.vue-enveloppes', rafraichir: ctx.rafraichir, moisAffiche: mois, aujourdhui: ctx.aujourdhui,
  });
  const { dialog, champs } = panneau;
  const form = dialog.querySelector('form');
  const titre = dialog.querySelector('#enveloppe-titre');
  const aideType = dialog.querySelector('#enveloppe-type-aide');
  const erreurType = dialog.querySelector('#enveloppe-type-erreur');
  const boutonSupprimer = dialog.querySelector('[data-action="supprimer"]');
  const radios = [...form.querySelectorAll('input[name="type"]')];
  champs.revenuSourceId.innerHTML = optionsRevenus(revenus);

  function afficherErreurType(texte) {
    erreurType.textContent = texte || '';
    erreurType.hidden = !texte;
  }

  function majType() {
    const type = champs.type.value;
    const enModification = Boolean(panneau.courant());
    for (const bloc of dialog.querySelectorAll('[data-pour]')) {
      bloc.hidden = bloc.dataset.pour === 'epargne' ? type !== 'epargne' : !(type === 'epargne' && enModification);
    }
  }

  // En modification, le type est figé ; en création, le type déjà au maximum est désactivé.
  function preparerTypes(enveloppe) {
    for (const radio of radios) {
      radio.disabled = enveloppe ? radio.value !== enveloppe.type : !disponibles[radio.value];
    }
    const type = enveloppe ? enveloppe.type : radios.find((r) => !r.disabled)?.value;
    champs.type.value = type ?? '';
    let aide = '';
    if (!enveloppe && !disponibles.plaisir) aide = 'Tu as déjà une enveloppe Plaisir.';
    else if (!enveloppe && !disponibles.epargne) aide = 'Tu as déjà 3 enveloppes Épargne, le maximum.';
    aideType.textContent = aide;
    aideType.hidden = aide === '';
  }

  function ouvrir(enveloppe, declencheur) {
    panneau.ouvrir(enveloppe, declencheur, () => {
      titre.textContent = enveloppe ? "Modifier l'enveloppe" : 'Créer une enveloppe';
      boutonSupprimer.hidden = !enveloppe;
      afficherErreurType('');
      preparerTypes(enveloppe);
      champs.nom.value = enveloppe ? enveloppe.nom : '';
      champs.montant.value = enveloppe ? centimesVersSaisie(enveloppe.montantMensuel) : '';
      const source = enveloppe && enveloppe.revenuSourceId;
      champs.revenuSourceId.value = source && revenus.some((r) => r.id === source) ? source : '';
      champs.suspendue.checked = Boolean(enveloppe && enveloppe.suspendue);
    });
    majType();
  }

  form.addEventListener('change', (e) => {
    if (e.target.name === 'type') majType();
  });

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const enveloppe = panneau.courant();
    if (panneau.estOccupe() || enveloppe === undefined) return;
    if (panneau.moisPerime()) return;
    panneau.masquerEchec();
    const type = champs.type.value;
    const resultat = validerEnveloppe(
      { type, nom: champs.nom.value, montantTexte: champs.montant.value, revenuSourceId: champs.revenuSourceId.value },
      { enveloppes, idEnCours: enveloppe ? enveloppe.id : null, resteAVivre },
    );
    // Les erreurs d'un champ masqué (revenu source pour Plaisir) ne sont jamais produites par la validation.
    panneau.afficherErreurs(resultat.erreurs);
    afficherErreurType(resultat.erreurs.type);
    if (resultat.erreurs.type && Object.keys(resultat.erreurs).length === 1) radios.find((r) => !r.disabled)?.focus();
    if (!resultat.ok) return;
    const valeurs = { ...resultat.valeurs };
    if (enveloppe && type === 'epargne') valeurs.suspendue = champs.suspendue.checked;
    panneau.executer(async () => {
      const enregistree = await enregistrerEnveloppe(valeurs, { id: enveloppe ? enveloppe.id : undefined, moisCourant: mois });
      return enregistree.id;
    }, ERREUR_ENREGISTREMENT);
  });

  boutonSupprimer.addEventListener('click', () => {
    const enveloppe = panneau.courant();
    if (!enveloppe) return;
    const question = enveloppe.type === 'epargne'
      ? `Supprimer l'enveloppe « ${enveloppe.nom} » ? Son total épargné (${formatMontant(totalEpargne(enveloppe, epargneMois))}) ne sera plus suivi.`
      : `Supprimer l'enveloppe « ${enveloppe.nom} » ?`;
    panneau.supprimer(question, () => supprimerEnveloppe(enveloppe.id), ERREUR_SUPPRESSION);
  });

  const boutonAjouter = container.querySelector('[data-action="ajouter"]');
  boutonAjouter.addEventListener('click', (e) => {
    if (!complet) ouvrir(null, e.currentTarget);
  });

  const liste = container.querySelector('.liste-enveloppes');
  if (liste) {
    liste.addEventListener('click', (e) => {
      const ligne = e.target.closest('button.ligne');
      if (ligne && parId.has(ligne.dataset.id)) ouvrir(parId.get(ligne.dataset.id), ligne);
    });
  }
}
