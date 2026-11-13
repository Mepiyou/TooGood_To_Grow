import { test } from 'node:test';
import assert from 'node:assert/strict';
import { degradeDonut, libelleDonut, rendreDonut } from '../js/ui/donut.js';

const espaces = (s) => s.replace(/[  ]/g, ' ');
const repartition = [
  { id: 'transport', nom: 'Transport', couleur: '#2E86AB', montant: 2500, pourcentage: 36 },
  { id: 'courses', nom: 'Courses', couleur: '#0B6E4F', montant: 2000, pourcentage: 29 },
  { id: 'autre', nom: 'Autre', couleur: '#9AA0A6', montant: 2500, pourcentage: 35 },
];

test('degradeDonut : arrêts cumulés, dernier arrêt à 100 %', () => {
  const d = degradeDonut([
    { couleur: '#111111', montant: 2500 },
    { couleur: '#222222', montant: 5000 },
  ]);
  assert.equal(d, 'conic-gradient(#111111 0% 33.33%, #222222 33.33% 100%)');
});

test('degradeDonut : couleur douteuse remplacée, jamais injectée', () => {
  const d = degradeDonut([{ couleur: 'red;x:y', montant: 100 }]);
  assert.equal(d, 'conic-gradient(#9AA0A6 0% 100%)');
});

test('libelleDonut : total, puis chaque catégorie avec montant et pourcentage', () => {
  assert.equal(
    espaces(libelleDonut(repartition, 7000, 'novembre')),
    'Dépenses de novembre : 70 €. Transport 25 €, 36 %. Courses 20 €, 29 %. Autre 25 €, 35 %.',
  );
});

test('rendreDonut : role img, aria-label, légende, noms échappés', () => {
  const html = rendreDonut([{ id: 'x', nom: '<b>"A"</b>', couleur: '#123456', montant: 1000, pourcentage: 100 }], 1000, 'novembre');
  assert.match(html, /role="img"/);
  assert.match(html, /aria-label="Dépenses de novembre/);
  assert.match(html, /conic-gradient\(#123456 0% 100%\)/);
  assert.ok(!html.includes('<b>'));
  assert.match(html, /<ul class="legende-donut">/);
  assert.match(html, /100 %/);
});
