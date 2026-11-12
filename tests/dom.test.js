import test from 'node:test';
import assert from 'node:assert/strict';
import { echapper } from '../js/ui/dom.js';

test('echapper neutralise le HTML', () => {
  assert.equal(echapper('<img src=x onerror="a">&\''), '&lt;img src=x onerror=&quot;a&quot;&gt;&amp;&#39;');
});
