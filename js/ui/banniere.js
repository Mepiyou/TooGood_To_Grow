const TEXTE_HORS_LIGNE = 'Hors ligne · tes saisies sont enregistrées sur ce téléphone.';

export function initBanniereHorsLigne() {
  const banniere = document.createElement('div');
  banniere.className = 'banniere banniere-hors-ligne';
  banniere.setAttribute('role', 'status');
  const majVisibilite = () => {
    banniere.textContent = navigator.onLine === false ? TEXTE_HORS_LIGNE : '';
    banniere.hidden = navigator.onLine !== false;
  };
  majVisibilite();
  window.addEventListener('online', majVisibilite);
  window.addEventListener('offline', majVisibilite);
  document.body.prepend(banniere);
  return banniere;
}
