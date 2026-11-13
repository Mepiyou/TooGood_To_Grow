const TEXTE_HORS_LIGNE = 'Hors ligne · tes saisies sont enregistrées sur ce téléphone.';

export function afficherBanniereMaj(surRecharger) {
  const banniere = document.createElement('div');
  banniere.className = 'banniere banniere-maj';
  banniere.setAttribute('role', 'status');
  const texte = document.createElement('span');
  texte.textContent = 'Nouvelle version disponible — ';
  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.className = 'bouton banniere-bouton';
  bouton.textContent = 'Recharger';
  bouton.addEventListener('click', () => {
    bouton.disabled = true;
    surRecharger();
  });
  banniere.append(texte, bouton);
  document.body.prepend(banniere);
  return banniere;
}

export function initBanniereHorsLigne() {
  const banniere = document.createElement('div');
  banniere.className = 'banniere banniere-hors-ligne';
  banniere.setAttribute('role', 'status');
  // Le conteneur reste dans l'arbre d'accessibilité : changer son texte suffit à l'annoncer.
  const majVisibilite = () => {
    banniere.textContent = navigator.onLine === false ? TEXTE_HORS_LIGNE : '';
  };
  majVisibilite();
  window.addEventListener('online', majVisibilite);
  window.addEventListener('offline', majVisibilite);
  document.body.prepend(banniere);
  return banniere;
}
