const ECHAPPEMENTS = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function echapper(texte) {
  return String(texte).replace(/[&<>"']/g, (c) => ECHAPPEMENTS[c]);
}

export const COULEUR_REPLI = '#9AA0A6';

// La couleur est injectée dans un attribut style : seule une couleur hexadécimale est acceptée.
export function couleurSure(couleur) {
  return /^#[0-9A-Fa-f]{6}$/.test(couleur) ? couleur : COULEUR_REPLI;
}
