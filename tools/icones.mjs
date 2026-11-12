// Génère les icônes PWA (PNG) sans dépendance : node tools/icones.mjs
import { deflateSync } from 'node:zlib';
import { writeFileSync, mkdirSync } from 'node:fs';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const VERT = [0x0B, 0x6E, 0x4F];
const BLANC = [0xFF, 0xFF, 0xFF];

// Lettres pixelisées 5 × 7 : « # » = rectangle blanc.
const LETTRES = {
  T: ['#####', '..#..', '..#..', '..#..', '..#..', '..#..', '..#..'],
  G: ['.####', '#....', '#....', '#.###', '#...#', '#...#', '.###.'],
};

let TABLE_CRC = null;
export function crc32(octets) {
  if (!TABLE_CRC) {
    TABLE_CRC = new Uint32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xEDB88320 ^ (c >>> 1) : c >>> 1;
      TABLE_CRC[n] = c >>> 0;
    }
  }
  let c = 0xFFFFFFFF;
  for (const o of octets) c = TABLE_CRC[(c ^ o) & 0xFF] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}

function bloc(type, donnees) {
  const t = Buffer.from(type, 'ascii');
  const longueur = Buffer.alloc(4);
  longueur.writeUInt32BE(donnees.length);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([t, donnees])));
  return Buffer.concat([longueur, t, donnees, crc]);
}

// pixel(x, y) renvoie [r, g, b] ; image RVB 8 bits, sans entrelacement.
export function encoderPNG(largeur, hauteur, pixel) {
  const ligne = 1 + largeur * 3;
  const brut = Buffer.alloc(ligne * hauteur);
  for (let y = 0; y < hauteur; y++) {
    brut[y * ligne] = 0;
    for (let x = 0; x < largeur; x++) {
      const [r, g, b] = pixel(x, y);
      brut.set([r, g, b], y * ligne + 1 + x * 3);
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(largeur, 0);
  ihdr.writeUInt32BE(hauteur, 4);
  ihdr[8] = 8; // profondeur
  ihdr[9] = 2; // RVB
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]),
    bloc('IHDR', ihdr),
    bloc('IDAT', deflateSync(brut, { level: 9 })),
    bloc('IEND', Buffer.alloc(0)),
  ]);
}

// marge : part du côté laissée libre de chaque côté (0,2 = zone de sécurité maskable).
export function genererIcone(taille, marge) {
  const colonnes = 11; // 5 + 1 + 5
  const cellule = Math.max(1, Math.floor((taille * (1 - 2 * marge)) / colonnes));
  const largeurTexte = colonnes * cellule;
  const hauteurTexte = 7 * cellule;
  const x0 = Math.floor((taille - largeurTexte) / 2);
  const y0 = Math.floor((taille - hauteurTexte) / 2);
  return encoderPNG(taille, taille, (x, y) => {
    if (x < x0 || y < y0) return VERT;
    const cx = Math.floor((x - x0) / cellule);
    const cy = Math.floor((y - y0) / cellule);
    if (cy > 6 || cx > 10 || cx === 5) return VERT;
    const lettre = cx < 5 ? LETTRES.T : LETTRES.G;
    const col = cx < 5 ? cx : cx - 6;
    return lettre[cy][col] === '#' ? BLANC : VERT;
  });
}

function ecrire() {
  const dossier = join(resolve(dirname(fileURLToPath(import.meta.url)), '..'), 'icons');
  mkdirSync(dossier, { recursive: true });
  writeFileSync(join(dossier, 'icon-192.png'), genererIcone(192, 0.15));
  writeFileSync(join(dossier, 'icon-512.png'), genererIcone(512, 0.15));
  writeFileSync(join(dossier, 'icon-maskable.png'), genererIcone(512, 0.2));
  console.log('icons/ : icon-192.png, icon-512.png, icon-maskable.png');
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) ecrire();
