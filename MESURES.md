# Mesures de performance et d'accessibilité

| Étape | Date | Requêtes | Poids brut (Ko) | Poids gzip (Ko) | LCP 4G/3G | Lighthouse a11y | 320 px | Remarques |
|-------|------|----------|-----------------|-----------------|-----------|-----------------|--------|-----------|
| 0. Socle | 2026-11-12 | 8 | 29,1 | 10,5 | à mesurer par l'équipe | à mesurer par l'équipe | à vérifier par l'équipe | `node tools/mesurer.mjs dist` (build v5-b2e1d431) : 0 URL externe, budget respecté |
| 1. Revenus (US1) | 2026-11-12 | 8 | 50,3 | 16,3 | à mesurer par l'équipe | à mesurer par l'équipe | à vérifier par l'équipe | US1 revenus. `node tools/mesurer.mjs dist` (build v7-065a78a0) : 0 URL externe, budget respecté |
| 2. Charges fixes (US3) | 2026-11-12 | 8 | 66,8 | 19,9 | à mesurer par l'équipe | à mesurer par l'équipe | à vérifier par l'équipe | US3 charges, panneau de formulaire commun. `node tools/mesurer.mjs dist` (build v11-8f275940) : 0 URL externe, budget respecté |

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
9. **iPhone 8 (Safari iOS 16)** : le champ date s'affiche en pleine largeur et aligné à gauche ; avec le clavier ouvert, le formulaire reste visible et le bouton Enregistrer accessible.
10. **Date d'un revenu ponctuel** : daté du mois prochain → message « Choisis une date de ce mois-ci. » ; daté du mois dernier avec « Compte pour le mois suivant » coché → accepté et visible.

### Checklist manuelle « Étape 2 »

Base vide au départ (DevTools › Application › Storage › Clear site data), `npm run build && npm run serve`, ouvrir http://localhost:8081/#/mois/charges.

1. **Gherkin US3** : l'écran affiche « Mon mois », l'onglet « Charges fixes » actif, « Déduites automatiquement chaque mois », « Total du mois : 0 € » et « Aucune charge pour l'instant. ». « Ajouter une charge » → « Loyer CROUS », 560, jour 3 → « Enregistrer » : le dialog se ferme, la ligne affiche « Loyer CROUS », « le 3 », « 560 € », le total « 560 € », et le focus est sur la ligne.
2. **Report automatique (chaque mois)** : pour simuler une charge créée le mois dernier, créer d'abord « Loyer CROUS » (point 1), puis coller ceci dans la console DevTools (onglet sur l'app) :

   ```js
   (async () => {
     const db = await new Promise((ok, ko) => { const r = indexedDB.open('toogood'); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
     const store = db.transaction('charges', 'readwrite').objectStore('charges');
     const charge = await new Promise((ok, ko) => { const r = store.getAll(); r.onsuccess = () => ok(r.result[0]); r.onerror = () => ko(r.error); });
     const [a, m] = new Date().toISOString().slice(0, 7).split('-').map(Number);
     const precedent = m === 1 ? `${a - 1}-12` : `${a}-${String(m - 1).padStart(2, '0')}`;
     charge.actifDepuis = precedent;
     charge.historique[0].depuis = precedent;
     store.put(charge);
     store.transaction.oncomplete = () => console.log('Charge antidatée à', precedent, ': recharger la page.');
   })();
   ```

   Recharger la page : la ligne et le total 560 € sont toujours là. Variante : avancer la date système d'un mois et recharger → le total du nouveau mois inclut 560 € sans nouvelle saisie (remettre la date ensuite).
3. **Modification d'une charge ancienne** (créée un mois précédent, cf. point 2) : toucher la ligne → « Modifier la charge » avec « Le nouveau montant et le nouveau jour s'appliqueront à partir du mois prochain. » sous le titre ; passer le montant à 580 → la ligne garde « 560 € », le sous-titre devient « le 3 · 580 € à partir de décembre » (mois suivant en toutes lettres), le total du mois reste 560 €. Un changement de nom s'affiche tout de suite.
4. **Correction le mois de création** : sur une charge ajoutée ce mois-ci, pas de texte d'aide ; passer de 560 à 570 → la ligne et le total affichent 570 € immédiatement (D6).
5. **Suppression d'une charge créée un mois précédent** (cf. point 2, extrait console) : rouvrir une charge → « Supprimer » → confirmation « Supprimer la charge « Loyer CROUS » ? Elle reste déduite ce mois-ci. » ; « Annuler » ne change rien ; « OK » : la ligne reste listée ce mois-ci avec « le 3 · supprimée à partir de décembre », le total est inchangé, et la ligne n'est plus un bouton (ni focusable ni modifiable). L'enregistrement reste dans IndexedDB avec `actifJusqua`.
6. **Charge créée aujourd'hui puis supprimée** (D28) : confirmation « Supprimer la charge « X » ? », elle disparaît de la liste et du total immédiatement.
7. **Erreurs** : jour 0 et montant vide → « Choisis un jour entre 1 et 31. » sous le jour et un message sous le montant, focus sur le montant (premier champ en erreur) ; nom vide → « Le nom est obligatoire. ». Échap ferme le dialog et rend le focus au bouton ou à la ligne d'origine. L'onglet du navigateur s'intitule « Mon mois – Charges fixes · TooGood To Grow ».
8. **320 px** : liste, total, mention et dialog ouvert tiennent sans défilement horizontal ; boutons ≥ 44 px.
9. **Non-régression Revenus (panneau commun)** : sur #/mois/revenus, refaire les points 1 (ajout « Bourse »), 3 (modification à 460), 6 (erreurs : focus sur le premier champ en erreur) et 7 (Échap rend le focus au déclencheur) de la checklist « Étape 1 » : comportement identique.
10. **Formulaire d'une charge avec un changement prévu** : il affiche la valeur à venir (580 €) alors que la ligne affiche la valeur du mois (560 €) — comportement voulu.

### Checklist manuelle « Étape 3 »

Base vide au départ (DevTools › Application › Storage › Clear site data), `npm run build && npm run serve`, ouvrir http://localhost:8081.

1. **Gherkin US4 (partie 1)** : depuis l'accueil, « + Ajouter une dépense » → l'écran « Ajouter une dépense » s'ouvre sans barre du bas, curseur dans « Montant » ; saisir 12, toucher « Courses » (bouton pressé), « Valider » → retour à l'accueil. DevTools › Application › IndexedDB › `toogood` › `depenses` : un enregistrement `montant: 1200`, `categorieId: "courses"`, `date` = date du jour, `mois` = mois en cours, `creeLe` = `modifieLe`.
2. **Zéro requête** : DevTools › Réseau ouvert (filtre « Tout »), vider la liste puis refaire le point 1 : aucune requête pendant la saisie et la validation.
3. **« + Nouvelle »** : sur l'écran d'ajout, saisir un montant puis « + Nouvelle » → dialog « Nouvelle catégorie » ; nom « Café », couleur Framboise → « Créer la catégorie » : le dialog se ferme, « Café » apparaît après « Autre » et avant « + Nouvelle », pressé, avec le focus ; le montant saisi est conservé. Recréer « café » → « Cette catégorie existe déjà. ». Échap ou « Annuler » rend le focus à « + Nouvelle ».
4. **Erreurs** : « Valider » sans rien saisir → « Saisis un montant. » sous le montant, « Choisis une catégorie. » sous les catégories, focus sur le montant ; avec un montant mais sans catégorie → focus sur le premier bouton de catégorie ; date de demain (saisie au clavier) → « La date ne peut pas être dans le futur. ». Un lecteur d'écran lit le message avec le champ.
5. **Modification** : copier l'`id` d'une dépense dans IndexedDB, ouvrir `#/ajout/<id>` → « Modifier la dépense », montant (« 12 »), catégorie et date pré-remplis ; passer à 9,50 et « Transport » → « Valider » mène à `#/depenses` ; l'enregistrement garde son `creeLe` et a un nouveau `modifieLe`. `#/ajout/inexistant` → « Cette dépense n'existe plus. » et un lien vers les dépenses.
6. **Double tap** : saisir une dépense et toucher deux fois très vite « Valider » → une seule dépense dans IndexedDB.
7. **320 px** (mode responsive) : grille de 3 catégories sans défilement horizontal, noms entiers (« Transport ») ; dialog « Nouvelle catégorie » lisible, 6 pastilles ≥ 44 px ; « ← Retour » ramène à l'écran précédent (ou à l'accueil si l'écran a été ouvert directement).
8. **iPhone 8 (Safari iOS 16)** : le champ montant ouvre le clavier décimal (virgule disponible) ; le champ date ouvre le sélecteur natif ; après une longue période en arrière-plan, rouvrir l'app et saisir une dépense : elle s'enregistre (reconnexion IndexedDB).
