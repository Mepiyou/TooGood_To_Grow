import { test } from 'node:test';
import assert from 'node:assert/strict';
import { confirmationSuppression } from '../js/views/categories.js';
import { gabaritFormCategorie } from '../js/ui/form-categorie.js';

test('texte de confirmation de suppression', () => {
  assert.equal(confirmationSuppression('Café'), 'Supprimer « Café » ? Ses dépenses passeront dans « Autre ».');
});

test('gabarit du formulaire : ids préfixés, valeur échappée, Annuler seulement en dialog', () => {
  const integre = gabaritFormCategorie({ prefixe: 'cat-nouvelle', titre: 'Nouvelle catégorie' });
  const dialog = gabaritFormCategorie({ prefixe: 'form-categorie', categorie: { nom: '<b>"x"', couleur: '#2F6FB5' }, annulable: true });
  assert.ok(integre.includes('id="cat-nouvelle-nom"') && integre.includes('id="cat-nouvelle-couleurs"'));
  assert.ok(!integre.includes('form-categorie-') && !integre.includes('data-action="annuler"'));
  assert.ok(dialog.includes('data-action="annuler"') && dialog.includes('&lt;b&gt;&quot;x&quot;'));
  assert.ok(dialog.includes('value="#2F6FB5" aria-label="Bleu" checked'));
});
