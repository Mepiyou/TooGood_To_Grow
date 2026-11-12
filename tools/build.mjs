// Regroupe les modules ES de js/ en un seul js/app.js et produit dist/.
// Aucune dépendance : le graphe des imports est lu par expressions régulières,
// ce qui impose les seules formes de modules autorisées par les règles du projet.
import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync, existsSync, readdirSync, statSync } from 'node:fs';
import { dirname, resolve, relative, join, sep, basename } from 'node:path';
import { createHash } from 'node:crypto';
import { fileURLToPath, pathToFileURL } from 'node:url';

const RACINE_PROJET = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const RE_IMPORT = /^import\s*\{([^}]*)\}\s*from\s*'(\.{1,2}\/[^']+\.js)'\s*;?[ \t]*$/gm;
const RE_EXPORT = /^export\s+(?:async\s+function\s*\*?|function\s*\*?|const|class)\s+([A-Za-z_$][\w$]*)/gm;

const FORMES_INTERDITES = [
  [/^\s*export\s+default\b/m, 'export default'],
  // Une fois regroupé, l'importeur recevrait une copie figée au lieu de la liaison vivante.
  [/^\s*export\s+let\b/m, 'export let (utiliser export const et une fonction pour modifier la valeur)'],
  [/^\s*export\s*\{/m, 'export { … }'],
  [/^\s*export\s*\*/m, 'export * from'],
  [/^\s*import\s*\*/m, 'import * as'],
  [/^\s*import\s+[A-Za-z_$]/m, 'import x from'],
  [/^\s*import\s*['"]/m, "import 'x' (sans liaison)"],
  [/(^|[^\w$.])import\s*\(/m, 'import() dynamique'],
];

function nommer(fichier) {
  const rel = relative(RACINE_PROJET, fichier).split(sep).join('/');
  return rel && !rel.startsWith('..') ? rel : fichier;
}

function echouer(fichier, message) {
  throw new Error(`${nommer(fichier)} : ${message}`);
}

function lireModule(fichier) {
  const source = readFileSync(fichier, 'utf8');
  for (const [motif, forme] of FORMES_INTERDITES) {
    if (motif.test(source)) echouer(fichier, `forme interdite « ${forme} »`);
  }

  const imports = [];
  let corps = source.replace(RE_IMPORT, (_, liste, chemin) => {
    const liaisons = liste.split(',').map((s) => s.trim()).filter(Boolean).map((s) => {
      const m = /^([A-Za-z_$][\w$]*)(?:\s+as\s+([A-Za-z_$][\w$]*))?$/.exec(s);
      if (!m) echouer(fichier, `import illisible « ${s} »`);
      return { nom: m[1], local: m[2] || m[1] };
    });
    const index = imports.length;
    imports.push({ chemin: resolve(dirname(fichier), chemin), liaisons });
    return `\u0000IMPORT${index}\u0000`;
  });
  if (/^\s*import\b/m.test(corps)) echouer(fichier, "forme d'import non reconnue");

  const exports = [];
  corps = corps.replace(RE_EXPORT, (ligne, nom) => {
    exports.push(nom);
    return ligne.replace(/^export\s+/, '');
  });
  if (/^\s*export\b/m.test(corps)) echouer(fichier, "forme d'export non reconnue");

  return { fichier, corps, imports, exports };
}

export function regrouper(entree) {
  const modules = new Map();
  const ordre = [];
  const enCours = new Set();

  function visiter(fichier, pile) {
    if (modules.has(fichier)) return;
    if (enCours.has(fichier)) {
      const cycle = [...pile.slice(pile.indexOf(fichier)), fichier].map(nommer);
      throw new Error(`cycle d'imports : ${cycle.join(' -> ')}`);
    }
    if (!existsSync(fichier)) echouer(pile[pile.length - 1] || fichier, `module introuvable ${nommer(fichier)}`);
    enCours.add(fichier);
    const module = lireModule(fichier);
    for (const imp of module.imports) visiter(imp.chemin, [...pile, fichier]);
    enCours.delete(fichier);
    module.id = `__m${ordre.length}`;
    modules.set(fichier, module);
    ordre.push(module);
  }

  visiter(resolve(entree), []);

  const blocs = ordre.map((module) => {
    const corps = module.corps.replace(/\u0000IMPORT(\d+)\u0000/g, (_, i) => {
      const imp = module.imports[Number(i)];
      const cible = modules.get(imp.chemin);
      for (const { nom } of imp.liaisons) {
        if (!cible.exports.includes(nom)) {
          echouer(module.fichier, `« ${nom} » n'est pas exporté par ${nommer(imp.chemin)}`);
        }
      }
      const liste = imp.liaisons.map(({ nom, local }) => (nom === local ? nom : `${nom}: ${local}`)).join(', ');
      return `const { ${liste} } = ${cible.id};`;
    });
    return `// ${nommer(module.fichier)}\nconst ${module.id} = (() => {\n${corps.trimEnd()}\n;return { ${module.exports.join(', ')} };\n})();\n`;
  });
  return blocs.join('\n');
}

// Fichiers ajoutés par l'OS ou les outils (OneDrive, Windows, macOS) : jamais publiés.
const PARASITES = new Set(['desktop.ini', 'thumbs.db', '.ds_store']);

export function estParasite(nom) {
  return nom.startsWith('.') || PARASITES.has(nom.toLowerCase());
}

const sansParasites = (source) => !estParasite(basename(source));

function listerFichiers(dossier, base = dossier) {
  const fichiers = [];
  for (const nom of readdirSync(dossier).sort()) {
    const chemin = join(dossier, nom);
    if (statSync(chemin).isDirectory()) fichiers.push(...listerFichiers(chemin, base));
    else fichiers.push(relative(base, chemin).split(sep).join('/'));
  }
  return fichiers;
}

function remplacer(fichier, motif, valeur) {
  if (!existsSync(fichier)) return;
  const contenu = readFileSync(fichier, 'utf8');
  writeFileSync(fichier, contenu.replace(motif, () => valeur));
}

export function construire(racine = process.cwd()) {
  const dist = join(racine, 'dist');
  rmSync(dist, { recursive: true, force: true });
  mkdirSync(join(dist, 'js'), { recursive: true });

  writeFileSync(join(dist, 'js', 'app.js'), regrouper(join(racine, 'js', 'app.js')));
  cpSync(join(racine, 'index.html'), join(dist, 'index.html'));
  cpSync(join(racine, 'css'), join(dist, 'css'), { recursive: true, filter: sansParasites });
  // Créés à la tâche 0.5 : copiés seulement s'ils existent.
  for (const nom of ['manifest.webmanifest', 'icons', 'sw.js']) {
    if (existsSync(join(racine, nom))) cpSync(join(racine, nom), join(dist, nom), { recursive: true, filter: sansParasites });
  }

  // Empreinte calculée avant le remplacement de la version, sinon elle changerait à chaque build.
  // Le gabarit sw.js y entre tel quel : modifier le service worker change aussi le nom du cache.
  const fichiers = listerFichiers(dist).filter((f) => f !== 'sw.js');
  const hash = createHash('sha256');
  const empreindre = (nom, contenu) => {
    hash.update(nom + '\u0000');
    hash.update(contenu);
    hash.update('\u0000');
  };
  for (const f of fichiers) empreindre(f, readFileSync(join(dist, f)));
  if (existsSync(join(racine, 'sw.js'))) empreindre('sw.js', readFileSync(join(racine, 'sw.js')));
  const empreinte = hash.digest('hex');

  const cheminVersion = join(racine, 'tools', 'version.json');
  const etat = JSON.parse(readFileSync(cheminVersion, 'utf8'));
  if (etat.empreinte !== empreinte) {
    etat.version += 1;
    etat.empreinte = empreinte;
    writeFileSync(cheminVersion, JSON.stringify(etat, null, 2) + '\n');
  }
  // Le suffixe d'empreinte garantit un nom de cache différent pour tout contenu différent,
  // même si tools/version.json n'a pas été commité.
  const version = `v${etat.version}-${empreinte.slice(0, 8)}`;

  const motifVersion = /(['"])__VERSION__\1/g;
  remplacer(join(dist, 'js', 'app.js'), motifVersion, `'${version}'`);
  remplacer(join(dist, 'sw.js'), motifVersion, `'${version}'`);
  remplacer(join(dist, 'sw.js'), /(['"])__FICHIERS__\1/g, JSON.stringify(['./', ...fichiers]));

  return { version, fichiers };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const { version, fichiers } = construire(RACINE_PROJET);
    console.log(`dist/ construit (${version}) : ${fichiers.length} fichiers hors sw.js`);
  } catch (erreur) {
    console.error(`Échec du build : ${erreur.message}`);
    process.exit(1);
  }
}
