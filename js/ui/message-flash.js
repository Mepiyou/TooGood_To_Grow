// Message à afficher une seule fois par l'écran suivant (ex. confirmation après une suppression).
let message = null;

export function deposerMessage(texte) {
  message = texte;
}

export function prendreMessage() {
  const texte = message;
  message = null;
  return texte;
}
