const ECHAPPEMENTS = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

export function echapper(texte) {
  return String(texte).replace(/[&<>"']/g, (c) => ECHAPPEMENTS[c]);
}
