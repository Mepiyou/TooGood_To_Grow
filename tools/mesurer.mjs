// Mesure le premier chargement de dist/ : requêtes, poids brut et gzip, URL externes.
// Usage : node tools/mesurer.mjs dist
import { readFileSync, existsSync, readdirSync, statSync } from 'node:fs';
import { join, relative, sep, posix } from 'node:path';
import { gzipSync } from 'node:zlib';

const MAX_REQUETES = 15;
const MAX_OCTETS = 500 * 1024;
// Fichiers créés à la tâche 0.5 : leur absence est signalée sans faire échouer la mesure.
const FACULTATIF = /^(manifest\.webmanifest|sw\.js|icons\/.*)$/;
const IGNOREES = new Set(['http://www.w3.org/2000/svg']);

const dossier = process.argv[2] || 'dist';
if (!existsSync(join(dossier, 'index.html'))) {
  console.error(`${dossier}/index.html introuvable : lance d'abord npm run build.`);
  process.exit(1);
}

function normaliser(chemin, base = '') {
  const nu = chemin.split(/[?#]/)[0];
  const n = posix.normalize(posix.join(base, nu)).replace(/^\.\//, '');
  return n === '.' || n === '' ? 'index.html' : n;
}

function estLocal(ref) {
  return !/^([a-z]+:|\/\/|#)/i.test(ref);
}

const premierChargement = new Map(); // chemin -> origine
function ajouter(chemin, origine) {
  if (!premierChargement.has(chemin)) premierChargement.set(chemin, origine);
}

ajouter('index.html', 'page');
const html = readFileSync(join(dossier, 'index.html'), 'utf8');
for (const m of html.matchAll(/\b(?:href|src)\s*=\s*["']([^"']+)["']/g)) {
  if (estLocal(m[1])) ajouter(normaliser(m[1]), 'index.html');
}

for (const m of html.matchAll(/<link[^>]*rel=["']manifest["'][^>]*>/g)) {
  const href = /href=["']([^"']+)["']/.exec(m[0]);
  if (!href) continue;
  const manifeste = normaliser(href[1]);
  if (!existsSync(join(dossier, manifeste))) continue;
  const json = JSON.parse(readFileSync(join(dossier, manifeste), 'utf8'));
  for (const icone of json.icons || []) {
    if (estLocal(icone.src)) ajouter(normaliser(icone.src, posix.dirname(manifeste)), manifeste);
  }
}

// Le build remplace '__FICHIERS__' par un tableau JSON qui commence par "./".
const cheminSW = join(dossier, 'sw.js');
ajouter('sw.js', 'service worker');
if (existsSync(cheminSW)) {
  const liste = /\[\s*"\.\/"[^\]]*\]/.exec(readFileSync(cheminSW, 'utf8'));
  if (liste) for (const f of JSON.parse(liste[0])) ajouter(normaliser(f), 'précache sw.js');
}

let brut = 0;
let gzip = 0;
let absentBloquant = false;
const lignes = [];
for (const [chemin, origine] of premierChargement) {
  const complet = join(dossier, chemin);
  if (!existsSync(complet)) {
    const facultatif = FACULTATIF.test(chemin);
    if (!facultatif) absentBloquant = true;
    lignes.push(`  ${chemin.padEnd(28)} absent${facultatif ? ' (attendu à la tâche 0.5)' : ' (ERREUR)'}  [${origine}]`);
    continue;
  }
  const contenu = readFileSync(complet);
  const g = gzipSync(contenu).length;
  brut += contenu.length;
  gzip += g;
  lignes.push(`  ${chemin.padEnd(28)} ${ko(contenu.length).padStart(9)} brut ${ko(g).padStart(9)} gzip  [${origine}]`);
}
const requetes = [...premierChargement.keys()].filter((c) => existsSync(join(dossier, c))).length;

function ko(octets) {
  return `${(octets / 1024).toFixed(1)} Ko`;
}

function listerFichiers(d) {
  return readdirSync(d).flatMap((nom) => {
    const c = join(d, nom);
    return statSync(c).isDirectory() ? listerFichiers(c) : [c];
  });
}

const externes = [];
for (const fichier of listerFichiers(dossier)) {
  if (!/\.(html|css|js|mjs|json|webmanifest|svg|txt|xml)$/i.test(fichier)) continue;
  const texte = readFileSync(fichier, 'utf8');
  for (const m of texte.matchAll(/https?:\/\/[^\s'"`<>)\\]+/g)) {
    const url = m[0];
    if (IGNOREES.has(url)) continue;
    if (/^https?:\/\/(localhost|127\.0\.0\.1)([:/]|$)/.test(url)) continue;
    externes.push(`  ${relative(dossier, fichier).split(sep).join('/')} : ${url}`);
  }
}

console.log(`Premier chargement (${dossier}) :`);
console.log(lignes.join('\n'));
console.log(`Requêtes : ${requetes} (max ${MAX_REQUETES})`);
console.log(`Poids : ${ko(brut)} brut, ${ko(gzip)} gzip (max ${ko(MAX_OCTETS)} brut)`);
console.log(`URL externes : ${externes.length}`);
if (externes.length) console.log(externes.join('\n'));

const echecs = [];
if (requetes > MAX_REQUETES) echecs.push('trop de requêtes');
if (brut > MAX_OCTETS) echecs.push('trop lourd');
if (externes.length) echecs.push('URL externe');
if (absentBloquant) echecs.push('fichier référencé absent');
console.log(echecs.length ? `ÉCHEC : ${echecs.join(', ')}` : 'OK : budget respecté');
process.exit(echecs.length ? 1 : 0);
