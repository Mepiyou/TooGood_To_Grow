# Mesures de performance et d'accessibilité

| Étape | Date | Requêtes | Poids brut (Ko) | Poids gzip (Ko) | LCP 4G/3G | Lighthouse a11y | 320 px | Remarques |
|-------|------|----------|-----------------|-----------------|-----------|-----------------|--------|-----------|
| 0. Socle | 2026-11-12 | 8 | 29,1 | 10,5 | à mesurer par l'équipe | à mesurer par l'équipe | à vérifier par l'équipe | `node tools/mesurer.mjs dist` (build v5-b2e1d431) : 0 URL externe, budget respecté |

Limite de l'outil : les requêtes d'installation du service worker (précache) ne sont pas comptées en plus du premier chargement.

## À faire par l'équipe

- Test sur iPhone 8 réel en mode avion (US9).
- EcoIndex (ecoindex.fr / GreenIT-Analysis).
- Test chronométré de saisie d'une dépense.

### Checklist manuelle « Étape 0 »

1. `npm run build && npm run serve`, ouvrir http://localhost:8081 dans Chrome.
2. L'accueil affiche « TooGood To Grow » et la date du jour, la barre du bas « Accueil · Dépenses · Mon mois » et le bouton « + Ajouter une dépense ».
3. DevTools › Application › Service workers : `sw.js` actif ; Manifest sans erreur, installable ; IndexedDB `toogood` contient les 5 catégories.
4. DevTools › Réseau › Hors ligne, recharger : l'app s'ouvre et le bandeau « Hors ligne · tes saisies sont enregistrées sur ce téléphone. » s'affiche.
5. Mode responsive à 320 px : rien ne déborde.
6. Rebuild après une modification + recharger : la bannière « Nouvelle version disponible — Recharger » apparaît.

### Checklist manuelle « Étape 1 »

Base vide au départ (DevTools › Application › Storage › Clear site data), `npm run build && npm run serve`, ouvrir http://localhost:8081/#/mois/revenus.

1. **Gherkin US1** : l'écran affiche « Mon mois », les onglets « Revenus · Charges fixes » (pas de « Provisions »), « Total du mois : 0 € » et « Aucun revenu pour l'instant. ». « Ajouter un revenu » → « Bourse », 450, « Récurrent (chaque mois) », jour 5 → « Enregistrer » : le dialog se ferme, la ligne affiche « Bourse », « Récurrent · le 5 », « 450 € » et le total « 450 € ».
2. **Persistance** : recharger la page (et une fois en mode hors ligne) → la ligne « Bourse » et le total 450 € sont toujours là.
3. **Modification** : toucher la ligne « Bourse » → « Modifier le revenu », champs préremplis ; passer à 460 → la ligne et le total affichent 460 € tout de suite (D4).
4. **Suppression** : rouvrir la ligne → « Supprimer » → une confirmation native s'affiche ; « Annuler » ne change rien, « OK » retire la ligne et remet le total à 0 €.
5. **Mois suivant** : ajouter « Job », 400, « Ponctuel », date du jour, case « Compte pour le mois suivant » cochée (sous la date) → sous-titre « Ponctuel · le … · compte le mois suivant » ; le total du mois n'inclut pas ces 400 €.
6. **Erreurs** : montant « abc » et jour 32 → « Montant invalide. » sous le montant, « Choisis un jour entre 1 et 31. » sous le jour, focus sur le montant (premier champ en erreur) ; nom vide → « Le nom est obligatoire. ». Un lecteur d'écran lit le message avec le champ.
7. **Clavier** : Tab jusqu'à « Ajouter un revenu », Entrée → focus sur « Nom », Tab parcourt les champs sans sortir du dialog, Échap ferme le dialog et rend le focus au bouton ; même chose depuis une ligne (le focus revient sur la ligne). L'onglet du navigateur s'intitule « Mon mois – Revenus · TooGood To Grow ».
8. **320 px** (mode responsive) : liste, total et dialog ouvert tiennent sans défilement horizontal ; les noms longs passent à la ligne, le montant reste sur une ligne ; boutons et cases ≥ 44 px.
