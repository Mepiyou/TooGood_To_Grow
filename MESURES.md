# Mesures de performance et d'accessibilité

| Étape | Date | Requêtes | Poids brut (Ko) | Poids gzip (Ko) | LCP 4G/3G | Lighthouse a11y | 320 px | Remarques |
|-------|------|----------|-----------------|-----------------|-----------|-----------------|--------|-----------|
| 0. Socle | 2026-11-12 | 8 | 29,1 | 10,5 | à mesurer par l'équipe | à mesurer par l'équipe | à vérifier par l'équipe | `node tools/mesurer.mjs dist` (build v5-b2e1d431) : 0 URL externe, budget respecté |
| 1. Revenus (US1) | 2026-11-12 | 8 | 50,3 | 16,3 | à mesurer par l'équipe | à mesurer par l'équipe | à vérifier par l'équipe | US1 revenus. `node tools/mesurer.mjs dist` (build v7-065a78a0) : 0 URL externe, budget respecté |
| 2. Charges fixes (US3) | 2026-11-12 | 8 | 66,8 | 19,9 | à mesurer par l'équipe | à mesurer par l'équipe | à vérifier par l'équipe | US3 charges, panneau de formulaire commun. `node tools/mesurer.mjs dist` (build v11-8f275940) : 0 URL externe, budget respecté |
| 3. Dépenses (US4) | 2026-11-12 | 8 | 96,9 | 27,2 | à mesurer par l'équipe | à mesurer par l'équipe | à vérifier par l'équipe | US4 saisie, modification, suppression, liste du mois. `node tools/mesurer.mjs dist` (build v15-01312683) : 0 URL externe, budget respecté |
| 4. Accueil (US2) | 2026-11-13 | 8 | 106,4 | 29,5 | à mesurer par l'équipe | à mesurer par l'équipe | à vérifier par l'équipe | US2 solde quotidien, reste à vivre, dernières dépenses ; rafraîchissement au retour après un changement de date (focus fenêtre, formulaire ouvert préservé) ; libellés D29 (fin du mois aujourd'hui) et D30 (début de mois sans dépense). `node tools/mesurer.mjs dist` (build v19-659df82c) : 0 URL externe, budget respecté |
| 5. Hors ligne (US9) | 2026-11-13 | 8 | 111,4 | 31,1 | 1,8 s / 3,5 s (Lighthouse local) | 100 (Lighthouse local) | à vérifier par l'équipe | US9 persistance du stockage, encart d'installation iOS (Safari seulement), persistance redemandée une fois installée, bandeau hors ligne annoncé, zone sûre en bas d'écran. `node tools/mesurer.mjs dist` (build v21-45f7c168) : 0 URL externe, aucune API réseau dans js/app.js, budget respecté |
| 6. Graphiques et stockage | 2026-11-13 | 8 | 155,7 | 41,9 | à mesurer sur la version déployée | à mesurer sur la version déployée | à vérifier par l'équipe | Donut et légende, clôture mensuelle et résumés (pas de résumé pour un mois vide, D41), histogramme 6 mois, espace utilisé, export/import JSON (avertissement pour un fichier mensuel, D39), suppression d'un mois, gestion des catégories. `node tools/mesurer.mjs dist` (build v31-7e62cecd) : 0 URL externe, aucune API réseau dans js/app.js, budget respecté |
| 7. V2 (US5 à US8) | 2026-11-13 | 8 | 200,3 | 52,4 | à mesurer sur la version déployée | à mesurer sur la version déployée | vérifié en Chrome headless (Accueil, Enveloppes, Provisions : aucun débordement à 320 px) ; à confirmer sur appareil | Alerte de découvert (bandeau `role="alert"`, une par jour, D46), écran Enveloppes (plaisir avec barre de progression et dépassement, épargne avec total cumulé et suspension, limites D37), avertissement non bloquant à la saisie d'une dépense Plaisir (D45), onglet Provisions ; routes et navigation V2 activées. `node tools/mesurer.mjs dist` (build v38-3e210b69) : 0 URL externe, aucune API réseau dans js/app.js, budget respecté |

Limite de l'outil : les requêtes d'installation du service worker (précache) ne sont pas comptées en plus du premier chargement.

## Mesures Lighthouse après l'étape 5 (2026-11-13)

Lighthouse 12.2.1, profil mobile, Chrome Windows sans interface, build v22-9a547c94 servi en local par `python3 -m http.server` (**sans compression** : le poids transféré mesuré est le poids brut ; sur un hébergeur qui compresse, comme GitHub Pages, il tombe à ~31 Ko gzip et les temps baissent). Page mesurée : accueil, base vide (premier lancement).

| Indicateur | 4G simulée (défaut Lighthouse : RTT 150 ms, 1,6 Mbit/s, CPU ×4) | 3G simulée (RTT 300 ms, 700 kbit/s, CPU ×4) | Cible |
|---|---|---|---|
| Lighthouse performance | 99 | 84 | — |
| Lighthouse accessibilité | 100 | 100 | ≥ 95 |
| First Contentful Paint | 1,6 s | 3,2 s | — |
| Largest Contentful Paint | 1,8 s | 3,5 s | < 2,5 s (4G), < 4 s (3G) |
| Total Blocking Time | 30 ms | 30 ms | — |
| Cumulative Layout Shift | 0 | 0 | — |
| Requêtes (vues par Lighthouse) | 6 | 6 | ≤ 15 |
| Poids transféré (sans compression) | 106,7 Ko | 106,7 Ko | < 500 Ko |
| Taille du DOM | 40 éléments | 40 éléments | — |

`tools/mesurer.mjs dist` (compte aussi le manifest, les icônes et le précache du service worker) : 8 requêtes, 111,4 Ko brut, 31,1 Ko gzip, 0 URL externe, aucune API réseau dans le bundle.

### Version déployée (https://mepiyou.github.io/TooGood_To_Grow/, compression gzip de GitHub Pages)

| Indicateur | 4G simulée | 3G simulée | Cible |
|---|---|---|---|
| Lighthouse performance | 98 | 97 | — |
| Lighthouse accessibilité | 100 | 100 | ≥ 95 |
| First Contentful Paint | 1,2 s | 2,1 s | — |
| Largest Contentful Paint | 1,4 s | 2,2 s | < 2,5 s (4G), < 4 s (3G) |
| Total Blocking Time | 140 ms | 10 ms | — |
| Cumulative Layout Shift | 0 | 0 | — |
| Requêtes (vues par Lighthouse) | 6 | 6 | ≤ 15 |
| Poids transféré au premier chargement | 36,3 Ko | 36,1 Ko | < 500 Ko (objectif < 150 Ko) |
| Taille du DOM | 40 éléments | 40 éléments | — |

## À faire par l'équipe

- **US9 en mode avion sur un vrai iPhone 8 (Safari iOS 16)** : condition de fin de l'étape 5 (checklist « Étape 5 », points 1 à 8 sur l'appareil).
- **EcoIndex** (ecoindex.fr / GreenIT-Analysis).
- Test chronométré de saisie d'une dépense.
- Sur iOS, l'app installée sur l'écran d'accueil a un stockage séparé de Safari : des données saisies dans Safari avant l'installation ne sont pas reprises dans l'app installée (l'export/import JSON de l'étape 6 permettra de les transférer). À vérifier sur iPhone.

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

1. **Gherkin US4 (partie 1)** : depuis l'accueil, « + Ajouter une dépense » → l'écran « Ajouter une dépense » s'ouvre sans barre du bas, curseur dans « Montant » (sur Safari iOS le clavier ne s'ouvre pas tout seul, le focus étant programmatique : toucher le champ montant) ; saisir 12, toucher « Courses » (bouton pressé), « Valider » → retour à l'accueil. DevTools › Application › IndexedDB › `toogood` › `depenses` : un enregistrement `montant: 1200`, `categorieId: "courses"`, `date` = date du jour, `mois` = mois en cours, `creeLe` = `modifieLe`.
2. **Zéro requête** : DevTools › Réseau ouvert (filtre « Tout »), vider la liste puis refaire le point 1 : aucune requête pendant la saisie et la validation.
3. **« + Nouvelle »** : sur l'écran d'ajout, saisir un montant puis « + Nouvelle » → dialog « Nouvelle catégorie » ; nom « Café », couleur Framboise → « Créer la catégorie » : le dialog se ferme, « Café » apparaît après « Autre » et avant « + Nouvelle », pressé, avec le focus ; le montant saisi est conservé. Recréer « café » → « Cette catégorie existe déjà. ». Échap ou « Annuler » rend le focus à « + Nouvelle ».
4. **Erreurs** : « Valider » sans rien saisir → « Saisis un montant. » sous le montant, « Choisis une catégorie. » sous les catégories, focus sur le montant ; avec un montant mais sans catégorie → focus sur le premier bouton de catégorie ; date de demain (saisie au clavier) → « La date ne peut pas être dans le futur. ». Un lecteur d'écran lit le message avec le champ.
5. **Modification** : copier l'`id` d'une dépense dans IndexedDB, ouvrir `#/ajout/<id>` → « Modifier la dépense », montant (« 12 »), catégorie et date pré-remplis ; passer à 9,50 et « Transport » → « Valider » mène à `#/depenses` ; l'enregistrement garde son `creeLe` et a un nouveau `modifieLe`. `#/ajout/inexistant` → « Cette dépense n'existe plus. » et un lien vers les dépenses.
6. **Double tap** : saisir une dépense et toucher deux fois très vite « Valider » → une seule dépense dans IndexedDB.
7. **320 px** (mode responsive) : grille de 3 catégories sans défilement horizontal, noms entiers (« Transport ») ; dialog « Nouvelle catégorie » lisible, 6 pastilles ≥ 44 px ; « ← Retour » ramène à l'écran précédent (ou à l'accueil si l'écran a été ouvert directement).
8. **iPhone 8 (Safari iOS 16)** : le champ montant ouvre le clavier décimal (virgule disponible) ; le champ date ouvre le sélecteur natif ; après une longue période en arrière-plan, rouvrir l'app et saisir une dépense : elle s'enregistre (reconnexion IndexedDB).
9. **Liste des dépenses** : `#/depenses` (onglet « Dépenses ») affiche « Dépenses », « Total du mois : … », puis un titre par jour (« mardi 10 novembre ») du plus récent au plus ancien ; chaque ligne montre pastille, catégorie, montant, et les contrôles Modifier (crayon) et Supprimer (corbeille) de 44 px. Sans dépense : « Aucune dépense ce mois-ci. » et le lien « Ajouter une dépense ».
10. **Modifier depuis la liste** : toucher le crayon d'une ligne → « Modifier la dépense » pré-rempli ; changer le montant et « Valider » → retour à la liste, la ligne et le total sont à jour.
11. **Supprimer** : la corbeille demande « Supprimer cette dépense de 12 € (Courses) ? » ; « Annuler » ne change rien ; « OK » retire la ligne, le total baisse, le focus passe au lien « Modifier » de la ligne suivante (sinon la précédente, sinon le titre). Un lecteur d'écran annonce « Supprimer : Courses, 12 € ». 320 px : lignes sans défilement horizontal.
12. **Minuit** : laisser #/ajout ouvert, passer la date système au lendemain (ou attendre minuit), revenir dans l'app : le champ date et sa date max passent à aujourd'hui si on ne les avait pas modifiés.

### Checklist manuelle « Étape 4 »

Base vide au départ (DevTools › Application › Storage › Clear site data), `npm run build && npm run serve`, ouvrir http://localhost:8081.

**Données de démo** (à saisir via l'interface, pour reproduire T2/T3) :
- `#/mois/revenus` : « Bourse », 450, Récurrent, jour 5 ; « APL », 200, Récurrent, jour 25 ; « Job », 400, **Ponctuel**, date = le 30 du mois dernier, case « Compte pour le mois suivant » cochée (un Job récurrent créé ce mois-ci ne financerait que le mois prochain).
- `#/mois/charges` : « Transport », 25, jour 1 ; « Loyer CROUS », 560, jour 3 ; « Forfait », 10, jour 12.
- Dépenses : 70 € au total ce mois-ci, datées d'aujourd'hui ou avant (par exemple 70 € « Courses »).

Les chiffres attendus **dépendent du jour du test** : reste à vivre = 400 (Job) + 450 si on est le 5 ou après + 200 si on est le 25 ou après − 595 (charges) − 70 (dépenses) ; solde = reste ÷ jours jusqu'à la prochaine rentrée, arrondi à l'euro inférieur. Au 10 novembre : « 12 €/jour » et « Reste à vivre : 185 € · prochaine rentrée dans 15 jours (APL, le 25) ». Pour tester à cette date exacte, régler l'horloge système au 10 du mois.

1. **Premier lancement** : base vide → l'accueil affiche « TooGood To Grow », la date du jour en toutes lettres, la carte « Commence par ajouter tes revenus » et le bouton « Ajouter mon premier revenu », qui mène à « Mon mois – Revenus ». Sous la carte : « Dernières dépenses » et « Aucune dépense pour l'instant. ».
2. **Gherkin US2** (données de démo, au 10 du mois) : carte « Tu peux dépenser », « 12 €/jour » en très gros et en vert, dessous « Reste à vivre : 185 € · prochaine rentrée dans 15 jours (APL, le 25) » ; aucun avertissement.
3. **Fin du mois** : supprimer temporairement l'APL (ou tester après le 25) → la ligne devient « Reste à vivre : … · fin du mois dans N jours » ; la veille du dernier jour du mois : « dans 1 jour » (singulier).
4. **Gherkin US4 (fin)** : « + Ajouter une dépense » → 12, « Courses », « Valider » → retour à l'accueil ; la dépense est en tête de « Dernières dépenses » avec la date du jour (« 10 nov. ») et 12 € ; le solde est recalculé (au 10 : reste 173 € → « 11 €/jour »).
5. **Dernières dépenses** : au plus 3 lignes (pastille, catégorie, date courte, montant), de la plus récente à la plus ancienne ; « Tout voir » mène à « Dépenses ». Une catégorie supprimée s'affiche « Autre ».
6. **Cas négatif** : ajouter une grosse dépense (par exemple 300 € « Plaisir ») → « 0 €/jour », « Reste à vivre : -… € · … » avec le signe, et dans la carte l'encart orangé « Tu as dépassé ton budget de … €. Pas de panique : limite tes dépenses jusqu'au 25. ». Reste à vivre exactement à 0 € : « 0 €/jour » sans message (B3).
7. **Lecteur d'écran** (VoiceOver ou NVDA) : le solde est lu « 12 euros par jour », sans le mot « image » (et non « 12 euros barre jour ») ; la carte se lit dans l'ordre titre, solde, reste à vivre, avertissement ; l'avertissement n'est pas annoncé comme une alerte.
8. **Reprise après changement de date** : laisser l'accueil ouvert, passer à un autre onglet ou une autre appli, avancer l'horloge système d'un jour (ou attendre minuit), revenir (sur ordinateur, on peut revenir par un autre onglet ou une autre fenêtre : événement focus) : la date sous le titre, le solde et les jours restants sont à jour sans recharger. Sur `#/ajout` avec un montant saisi, même manipulation : la saisie est conservée (seule la date du champ suit). Avec un formulaire Revenus ou Charges ouvert, le retour ne le ferme pas (la saisie en cours est conservée).
9. **320 px** (mode responsive) : le solde en très gros tient dans la carte sans défilement horizontal (essayer aussi un solde à 3 chiffres) ; la ligne reste à vivre passe à la ligne ; « Tout voir » et le bouton du premier lancement font au moins 44 px de haut.
10. **Zéro requête** : DevTools › Réseau ouvert, recharger puis naviguer Accueil → Dépenses → Accueil : aucune requête hors premier chargement (servi par le service worker).
11. **Dernier jour du mois sans rentrée** (D29) : sans rentrée prévue après aujourd'hui, le dernier jour du mois (simulable en changeant la date système) → « Reste à vivre : … · fin du mois aujourd'hui » ; la veille : « fin du mois dans 1 jour ».
12. **Début de mois avant la première rentrée, sans dépense** (D30) : reste à vivre négatif (charges déjà dues, aucune dépense, rentrée prévue plus tard dans le mois) → l'encart affiche « Ta prochaine rentrée arrive le … : limite tes dépenses d'ici là. » ; après une dépense, retour au texte « Tu as dépassé ton budget de … € … ».

### Checklist manuelle « Étape 5 »

Base vide au départ (DevTools › Application › Storage › Clear site data), `npm run build && npm run serve`, ouvrir http://localhost:8081 (une fois, en ligne).

1. **Gherkin US9, simulé dans Chrome** : après un premier chargement en ligne, DevTools › Réseau › Hors ligne, recharger : l'app s'ouvre. « + Ajouter une dépense », 5, « Courses », « Valider » → dépense enregistrée, solde mis à jour sur l'accueil, et le bandeau gris affiche « Hors ligne · tes saisies sont enregistrées sur ce téléphone. ».
2. **Retour en ligne** : décocher « Hors ligne » : le texte du bandeau disparaît (le bandeau n'occupe plus de place) ; les dépenses saisies hors ligne sont toujours là après rechargement.
3. **Annonce du lecteur d'écran** (VoiceOver ou NVDA) : passer hors ligne, puis en ligne, sans bouger le focus : le lecteur annonce le texte du bandeau au passage hors ligne (le conteneur `role="status"` est toujours dans la page, seul son texte change).
4. **Encart iOS** (Safari sur iPhone, app non installée) : en haut de l'écran, « Installe l'app : touche Partager › Sur l'écran d'accueil. L'installation protège tes données. Installe-la avant de saisir tes données. » et un bouton « Compris » (≥ 44 px). La barre du bas et « + Ajouter une dépense » restent visibles ; naviguer entre les écrans ne fait pas disparaître l'encart ; à 320 px, il tient sans défilement horizontal.
5. **« Compris »** : l'encart disparaît ; recharger et rouvrir l'app : il ne revient pas (`meta.encartIosVu` dans IndexedDB › `toogood` › `meta`).
6. **Installée sur l'écran d'accueil** (Partager › Sur l'écran d'accueil, lancer depuis l'icône) : aucun encart, même base vide. Chrome desktop ou Android : jamais d'encart.
7. **Persistance** : DevTools › Application › IndexedDB › `toogood` › `meta` contient `persistDemande` (`date` et `accorde`), réécrit au plus une fois de plus après l'installation (avec `installe`) si le premier refus a eu lieu hors installation ; DevTools › Application › Storage indique « Persistent storage » si le navigateur l'accorde (un refus est normal et silencieux). Aucune erreur visible dans l'interface.
8. **Zéro requête** : DevTools › Réseau (filtre « Tout »), vider la liste, puis utiliser l'app (ajout, modification, navigation) : liste vide. `node tools/mesurer.mjs dist` indique « API réseau dans js/app.js : aucune ».
9. **iPhone à encoche, installé** : sur Accueil, Dépenses et l'écran d'ajout, rien ne passe sous la barre du bas ni sous le bouton « + Ajouter une dépense » (faire défiler jusqu'en bas) ; la barre du bas ne touche pas l'indicateur de l'écran d'accueil.
10. **Navigateur sans installation** : Chrome iOS ou navigateur d'Instagram : pas d'encart d'installation.
11. **Android installé** : après installation, DevTools › Application › Storage indique un stockage persistant.
12. **iPhone 8 réel, mode avion** : refaire les points 1, 2 et 5 avec le mode avion activé (app installée ou ouverte dans Safari après un premier chargement en ligne).

### Checklist manuelle « Étape 6 »

Base avec quelques dépenses du mois (catégories variées), `npm run build && npm run serve`.

1. **Donut et légende** : `#/depenses` affiche le donut au-dessus de la liste, avec le total du mois au centre ; chaque ligne de la légende (pastille, nom, montant, %) correspond aux dépenses de la liste (somme des montants = total, pourcentages cohérents) ; à 320 px, pas de défilement horizontal, légende sous le donut si besoin ; sans dépense ce mois-ci, aucun donut.
2. **Lecteur d'écran** (VoiceOver ou NVDA) : le donut est lu une seule fois, « Dépenses de novembre : 70 €. Courses 20 €, 29 %. … » (le trou central est masqué au lecteur d'écran).
3. **Clôture mensuelle** : simuler un mois passé (console : ouvrir `indexedDB.open('toogood')`, écrire une dépense datée du mois précédent avec son `mois`, supprimer `meta.derniereCloture`), recharger : un résumé du mois passé apparaît dans DevTools › Application › IndexedDB › `toogood` › `resumes` (`total`, `parCategorie`, `nbDepenses`) et `meta.derniereCloture` vaut ce mois ; un nouveau rechargement ne le réécrit pas.
4. **Histogramme** : `#/historique` affiche 6 barres cohérentes avec les mois (valeur au-dessus, mois abrégé dessous, « — » sans donnée), le mois en cours en vert, les autres en gris, ligne d'axe à zéro ; lisible à 320 px sans défilement horizontal ; lu une seule fois au lecteur d'écran (« Dépenses des 6 derniers mois : … »).
5. **Espace utilisé** : le bandeau affiche « Espace utilisé : N Ko sur ce téléphone » (ou « inconnu » si l'API manque) ; la liste des mois donne « octobre 2026 · 23 dépenses · environ 4 Ko », le mois en cours n'a pas de bouton « Supprimer ».
6. **Export** : « Exporter » télécharge `toogood-AAAA-MM-JJ.json` (date du jour) contenant `"app": "toogood"` et les 7 listes.
7. **Import** : « Importer » ce même fichier puis confirmer → « Données importées. » et données identiques (revenus, charges, dépenses, catégories) ; annuler la confirmation ne change rien.
8. **Import invalide** : importer une copie du fichier dont la clé `"app"` est retirée → message d'erreur « Ce fichier n'est pas une sauvegarde TooGood To Grow. » et aucune donnée modifiée ; un fichier non JSON → « Fichier illisible. ».
9. **Réseau** : onglet Réseau de DevTools vide (aucune requête) pendant l'export et l'import.
10. **Suppression, totaux gardés** : sur un mois passé, `Supprimer` → écran « Supprimer octobre 2026 », case « Garder les totaux du mois » cochée par défaut, puis confirmer : retour à l'historique avec « Octobre 2026 supprimé — X Ko libérés » ; le mois reste dans l'histogramme avec son total et la liste affiche « totaux conservés ».
11. **Suppression complète** : même parcours avec la case décochée : le mois disparaît de l'histogramme (« — ») et de la liste.
12. **Exporter avant** : « Exporter ce mois avant » télécharge `toogood-AAAA-MM.json` (mois concerné) sans supprimer quoi que ce soit.
13. **Mois au détail déjà supprimé** : sur un mois « totaux conservés », l'écran affiche « Détail déjà supprimé · X € », sans case à cocher, avec « Les totaux d'octobre disparaîtront des graphiques. » et le bouton « Supprimer les totaux d'octobre 2026 » ; après confirmation, message « Octobre 2026 supprimé » (sans taille), le mois disparaît de l'histogramme et de la liste.
14. **Mois en cours** : ouvrir `#/historique/supprimer/<mois courant>` (ou un mois futur, ou `2026-13`) affiche « Ce mois ne peut pas être supprimé. » et le lien « Retour à l'historique ».
15. **Créer une catégorie** : depuis « Gérer les catégories » (`#/categories`), créer « Café » (nom + pastille + « Créer la catégorie ») : la ligne apparaît avec 0 € et le focus est sur son bouton « Modifier : Café » ; un nom déjà pris affiche « Cette catégorie existe déjà. ».
16. **Renommer** : « Modifier : Café » ouvre le dialog, renommer en « Cafés » : la ligne est mise à jour, le focus revient sur son bouton « Modifier » ; `#/ajout` affiche « Cafés » dans la grille. Annuler ou Échap rend le focus au bouton « Modifier ».
17. **Supprimer vers « Autre » (T11)** : affecter 4 dépenses à « Café », puis « Supprimer : Café » → confirmation « Supprimer « Café » ? Ses dépenses passeront dans « Autre ». » ; après confirmation, les 4 dépenses sont en « Autre » dans `#/depenses`, le donut et la liste sont à jour, le focus est sur le titre « Catégories » ; annuler la confirmation ne change rien.
18. **Catégories par défaut** : Courses, Transport, Sorties, Plaisir et Autre affichent « Par défaut » sans bouton Modifier ni Supprimer ; l'écran est utilisable à 320 px (cibles de 44 px, pas de défilement horizontal) et « ← Retour » ramène à l'écran précédent.
19. **Mois sans dépense (D41)** : avec une dépense en septembre et une en novembre (mois courant), supprimer `meta.derniereCloture` et recharger : `resumes` contient septembre mais pas octobre, et la liste de l'historique n'affiche pas « octobre 2026 · 0 dépense ». Déplacer la seule dépense de septembre au mois courant (`#/ajout/<id>`, nouvelle date, « Valider ») : le résumé de septembre disparaît de `resumes`. Supprimer un mois entièrement (case décochée), puis exporter et réimporter : le mois ne réapparaît pas dans l'histogramme (« — »).
20. **Import d'un fichier mensuel (D39)** : importer un fichier produit par « Exporter ce mois avant » → confirmation « Ce fichier ne contient que les dépenses d'octobre 2026. Remplacer toutes tes données par celles-ci ? » (« de novembre » pour novembre) ; « Annuler » ne change rien ; un export complet garde « Remplacer toutes tes données par celles du fichier ? ».
21. **Clôture rappelée par l'historique (D40)** : app ouverte (ou laissée en arrière-plan), avancer l'horloge système au mois suivant puis ouvrir `#/historique` sans recharger : le mois qui vient de se terminer a sa barre (pas « — ») et un résumé dans `resumes` ; `meta.derniereCloture` vaut ce mois.

### Checklist manuelle « Étape 7 »

Données de démo de l'étape 4 (Bourse 450 € le 5, APL 200 € le 25, Job 400 € le 30 « mois suivant », charges 595 €), au 10 du mois ou après le 5, `npm run build && npm run serve`. La barre du bas affiche « Accueil · Dépenses · Mon mois · Enveloppes » et « Mon mois » les onglets « Revenus · Charges fixes · Provisions ».

1. **Gherkin US5, déclencher l'alerte** : ajouter dans les 7 derniers jours des dépenses dont la moyenne quotidienne × jours restants dépasse le reste à vivre, sans le rendre négatif (au 10, données de démo : reste 185 € avec 70 € de dépenses datées des 7 derniers jours ; ajouter 60 € « Courses » datés d'aujourd'hui → reste 125 €, moyenne 130 ÷ 7 ≈ 18,57 €/jour × 15 jours > 125 €). Revenir à l'accueil : au-dessus de la carte, bandeau orange « Attention : à ce rythme, tu seras à découvert vers le 16 novembre. Il te reste 8 €/jour jusqu'au 25. » (date et montants selon le jour). DevTools › IndexedDB › `toogood` › `meta` contient `alerteVueLe` = date du jour.
2. **Une seule alerte par jour** : aller sur « Dépenses » puis revenir à l'accueil (ou recharger) : plus de bandeau le même jour. Supprimer `meta.alerteVueLe` (ou avancer l'horloge d'un jour) et recharger : le bandeau revient. Reste à vivre déjà négatif : pas de bandeau, seul l'encart « Tu as dépassé ton budget… » de la carte s'affiche.
3. **Début de mois (D46)** : le 1er ou le 2 du mois, des dépenses de la fin du mois précédent comptent dans la moyenne des 7 jours (l'alerte peut apparaître alors qu'aucune dépense du mois n'existe encore).
4. **Lecteur d'écran sur le bandeau** (VoiceOver ou NVDA) : à l'arrivée sur l'accueil, le bandeau est annoncé comme une alerte, « … Il te reste 8 euros par jour jusqu'au 25. » (et non « 8 euros barre jour »), une seule fois.
5. **Gherkin US6, restant** : `#/enveloppes` → « Aucune enveloppe pour l'instant. » ; « Créer une enveloppe » → Type « Plaisir », « Sorties », 60 → « Enregistrer » : carte « Plaisir » avec « Restant : 60 € sur 60 € » et une barre vide ; après une dépense « Plaisir » de 28 € : « Restant : 32 € sur 60 € », barre à moitié environ. Un montant supérieur au reste à vivre est refusé (« Le budget plaisir ne peut pas dépasser ton reste à vivre (… €). ») ; reste à vivre nul ou négatif : « Ton reste à vivre ne permet pas de budget plaisir pour l'instant. ».
6. **Dépassement non bloquant (D45)** : « + Ajouter une dépense », 40, catégorie « Plaisir » : sous le formulaire, « Attention : cette dépense dépasse ton enveloppe plaisir (restant : 32 €). » ; « Valider » enregistre quand même (toujours 2 actions : montant, catégorie, Valider). La carte affiche alors « Dépassé de 8 € sur 60 € » en rouge, barre pleine en rouge. En modification d'une dépense Plaisir, son ancienne valeur ne compte pas.
7. **Gherkin US7, épargne** : « Créer une enveloppe » → « Épargne », « Vacances », 50, revenu source « Bourse » → carte « Épargne » : « 50 €/mois sur Bourse », « Total épargné : 50 € » si la Bourse est déjà reçue ce mois-ci (le 5 ou après), sinon « 0 € » ; le reste à vivre de l'accueil baisse de 50 € seulement une fois la Bourse reçue.
8. **Total cumulé** : avec une enveloppe Épargne créée le mois dernier (console : antidater `actifDepuis` et `creeLe`, supprimer `meta.derniereCloture`, recharger), le total épargné inclut le mois clôturé (`epargneParEnveloppe` dans `resumes`) plus le mois en cours.
9. **Suspension** : ouvrir « Vacances » (ligne « Modifier »), cocher « Suspendre l'épargne », « Enregistrer » : la carte affiche « Suspendue », l'épargne du mois n'est plus déduite (reste à vivre de l'accueil +50 €) et le total épargné ne compte plus le mois en cours. Décocher : retour à l'état précédent.
10. **Limites (D37)** : avec 1 Plaisir, le formulaire de création désactive « Plaisir » (« Tu as déjà une enveloppe Plaisir. ») ; avec 1 Plaisir et 3 Épargne, « Créer une enveloppe » est désactivé avec « Tu as déjà 1 enveloppe Plaisir et 3 enveloppes Épargne, le maximum. ». En modification, le type ne change pas. « Supprimer » demande une confirmation.
11. **Gherkin US8, part mensuelle** : `#/mois/provisions` → « Ajouter une provision » → « Assurance », 600, échéance 4 mois plus tard (champ mois, ce mois-ci et avant refusés : « Choisis un mois d'échéance après ce mois-ci. ») : ligne « Assurance », « 600 € pour mars 2027 », « 150 €/mois réservés » ; « Réservé ce mois : 150 € » ; le reste à vivre de l'accueil baisse de 150 €. Les mois suivants s'ajoute « · déjà 300 € de côté ».
12. **Solde à l'échéance simulé** : avec la provision du point 11, coller dans la console puis recharger :

    ```js
    (async () => {
      const db = await new Promise((ok, ko) => { const r = indexedDB.open('toogood'); r.onsuccess = () => ok(r.result); r.onerror = () => ko(r.error); });
      const store = db.transaction('provisions', 'readwrite').objectStore('provisions');
      const p = await new Promise((ok, ko) => { const r = store.getAll(); r.onsuccess = () => ok(r.result[0]); r.onerror = () => ko(r.error); });
      const [a, m] = new Date().toISOString().slice(0, 7).split('-').map(Number);
      const recul = (n) => { const t = a * 12 + (m - 1) - n; return `${Math.floor(t / 12)}-${String((t % 12) + 1).padStart(2, '0')}`; };
      p.debut = recul(3); p.moisEcheance = recul(0);
      store.put(p);
      store.transaction.oncomplete = () => console.log('Provision échue ce mois-ci (début', p.debut, ') : recharger la page.');
    })();
    ```

    Après rechargement : la provision a disparu de l'onglet, `#/depenses` contient une dépense de 600 € « Autre » datée du 1er (note « Provision : Assurance » dans IndexedDB, avec `provisionId` et `reserve` = 60000, soit les 3 parts de 200 € des mois précédents), « Réservé ce mois » vaut 0 € et le reste à vivre de l'accueil ne baisse pas (les 600 € déjà mis de côté sont réintégrés, D44) ; cette dépense ne déclenche pas l'alerte de découvert (elle compte pour 600 − 600 = 0 € dans la moyenne des 7 jours).
13. **320 px** : Accueil avec bandeau, Enveloppes (4 cartes) et Provisions sans défilement horizontal ; la barre du bas à 4 entrées reste lisible ; boutons, radios et lignes « Modifier » font au moins 44 px de haut.
14. **Plafond Plaisir en modification (D48)** : renommer ou baisser l'enveloppe Plaisir quand le reste à vivre est plus bas que son budget → accepté ; l'augmenter au-delà → refusé.
