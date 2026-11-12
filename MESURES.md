# Mesures de performance et d'accessibilité

| Étape | Date | Requêtes | Poids brut (Ko) | Poids gzip (Ko) | LCP 4G/3G | Lighthouse a11y | 320 px | Remarques |
|-------|------|----------|-----------------|-----------------|-----------|-----------------|--------|-----------|
| 0. Socle | 2026-11-12 | 8 | 26,5 | 9,6 | à mesurer par l'équipe | à mesurer par l'équipe | à vérifier par l'équipe | `node tools/mesurer.mjs dist` : 0 URL externe, budget respecté |

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
