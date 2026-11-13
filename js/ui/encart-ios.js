import { lireMeta, ecrireMeta } from '../store/meta.js';

const TEXTE = "Installe l'app : touche Partager › Sur l'écran d'accueil. L'installation protège tes données.";

export function estIOS({ userAgent = '', platform = '', maxTouchPoints = 0 } = {}) {
  if (/iPhone|iPad|iPod/.test(userAgent)) return true;
  // iPadOS en mode « site pour ordinateur » se présente comme un Mac, mais tactile.
  return platform === 'MacIntel' && maxTouchPoints > 1;
}

export function encartAProposer(entrees = {}) {
  return estIOS(entrees) && entrees.standalone !== true;
}

// L'encart vit hors de #app : les rendus de vue ne l'effacent pas.
export async function afficherEncartIOS(_ctx) {
  const entrees = {
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    maxTouchPoints: navigator.maxTouchPoints,
    standalone: navigator.standalone,
  };
  if (!encartAProposer(entrees)) return null;
  if (await lireMeta('encartIosVu')) return null;

  const encart = document.createElement('div');
  encart.className = 'banniere banniere-ios';
  encart.id = 'encart-ios';
  const texte = document.createElement('p');
  texte.textContent = TEXTE;
  const bouton = document.createElement('button');
  bouton.type = 'button';
  bouton.className = 'bouton banniere-bouton';
  bouton.textContent = 'Compris';
  bouton.addEventListener('click', () => {
    encart.remove();
    ecrireMeta('encartIosVu', true).catch((erreur) => console.error(erreur));
  });
  encart.append(texte, bouton);
  document.body.prepend(encart);
  return encart;
}
