import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, readFileSync, existsSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { regrouper, construire } from '../tools/build.mjs';

test('regroupe sans collision de noms locaux', async () => {
  const code = regrouper('tests/fixtures/bundle/entree.js');
  assert.ok(!/^\s*(import|export)\s/m.test(code));
  await import('data:text/javascript,' + encodeURIComponent(code));
  assert.equal(globalThis.__res, 'AB');
});

test('refuse export default', () => {
  assert.throws(() => regrouper('tests/fixtures/bundle-invalide/entree.js'), /export default/);
});

test('refuse export let (la liaison vivante serait figée une fois regroupée)', () => {
  assert.throws(() => regrouper('tests/fixtures/bundle-let/entree.js'), /export let/);
});

test('commentaire de module relatif à la racine du projet, pas au dossier courant', () => {
  const entree = resolve('tests/fixtures/bundle/entree.js');
  const avant = process.cwd();
  process.chdir(tmpdir());
  try {
    const code = regrouper(entree);
    assert.match(code, /^\/\/ tests\/fixtures\/bundle\/entree\.js$/m);
    assert.match(code, /^\/\/ tests\/fixtures\/bundle\/a\.js$/m);
  } finally {
    process.chdir(avant);
  }
});

function projetTemporaire() {
  const racine = mkdtempSync(join(tmpdir(), 'toogood-build-'));
  mkdirSync(join(racine, 'js'));
  mkdirSync(join(racine, 'css'));
  mkdirSync(join(racine, 'icons'));
  mkdirSync(join(racine, 'tools'));
  writeFileSync(join(racine, 'js', 'app.js'), "const VERSION = '__VERSION__';\n");
  writeFileSync(join(racine, 'index.html'), '<!doctype html>\n');
  writeFileSync(join(racine, 'css', 'app.css'), 'body {}\n');
  writeFileSync(join(racine, 'css', 'desktop.ini'), 'x');
  writeFileSync(join(racine, 'css', '.cache'), 'x');
  writeFileSync(join(racine, 'icons', 'Thumbs.db'), 'x');
  writeFileSync(join(racine, 'icons', '.DS_Store'), 'x');
  writeFileSync(join(racine, 'icons', 'icone.png'), 'png');
  writeFileSync(join(racine, 'sw.js'), "const CACHE = 'toogood-' + '__VERSION__';\nconst FICHIERS = '__FICHIERS__';\n");
  writeFileSync(join(racine, 'tools', 'version.json'), '{ "version": 1, "empreinte": "" }\n');
  return racine;
}

test('construire : fichiers parasites exclus de dist/', () => {
  const racine = projetTemporaire();
  try {
    const { fichiers } = construire(racine);
    for (const f of ['css/desktop.ini', 'css/.cache', 'icons/Thumbs.db', 'icons/.DS_Store']) {
      assert.ok(!existsSync(join(racine, 'dist', f)), `${f} ne doit pas être copié`);
      assert.ok(!fichiers.includes(f));
    }
    assert.ok(existsSync(join(racine, 'dist', 'icons', 'icone.png')));
  } finally {
    rmSync(racine, { recursive: true, force: true });
  }
});

test('construire : version de cache liée au contenu, gabarit sw.js compris', () => {
  const racine = projetTemporaire();
  try {
    const { version } = construire(racine);
    assert.match(version, /^v\d+-[0-9a-f]{8}$/);
    const etat = JSON.parse(readFileSync(join(racine, 'tools', 'version.json'), 'utf8'));
    assert.equal(version, `v${etat.version}-${etat.empreinte.slice(0, 8)}`);
    assert.ok(readFileSync(join(racine, 'dist', 'sw.js'), 'utf8').includes(`'${version}'`));
    assert.ok(readFileSync(join(racine, 'dist', 'js', 'app.js'), 'utf8').includes(`'${version}'`));

    assert.equal(construire(racine).version, version, 'même contenu, même version');

    writeFileSync(join(racine, 'sw.js'), readFileSync(join(racine, 'sw.js'), 'utf8') + '// modifié\n');
    assert.notEqual(construire(racine).version.split('-')[1], version.split('-')[1]);
  } finally {
    rmSync(racine, { recursive: true, force: true });
  }
});
