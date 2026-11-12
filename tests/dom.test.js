import test from 'node:test';
import assert from 'node:assert/strict';
import { echapper, couleurSure, COULEUR_REPLI } from '../js/ui/dom.js';

test('echapper neutralise le HTML', () => {
  assert.equal(echapper('<img src=x onerror="a">&\''), '&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;');
});

test('couleurSure : seule une couleur hexadécimale à 6 chiffres passe', () => {
  assert.equal(couleurSure('#B5446E'), '#B5446E');
  assert.equal(couleurSure('#b5446e'), '#b5446e');
  for (const mauvaise of ['red', '#FFF', 'url(x)', '#B5446E;x:y', undefined, null]) {
    assert.equal(couleurSure(mauvaise), COULEUR_REPLI);
  }
});
