# Spécification technique — TooGood To Grow

> Complément de `Brief.md`. Le brief dit **quoi** et **pourquoi** ; cette spec dit **comment**.
> En cas de contradiction : les règles métier de `Brief.md` priment, puis cette spec. Toute décision non couverte ici doit être demandée avant d'être inventée.

---

## 1. Principes d'architecture

| Principe | Décision |
|---|---|
| Type d'application | PWA statique, installable, 100 % hors ligne après la première visite |
| Backend | **Aucun.** Pas de serveur, pas de compte, pas d'API |
| Stockage | IndexedDB, sur le téléphone de l'utilisateur |
| Langages | HTML, CSS, JavaScript (modules ES natifs) |
| Framework | **Aucun.** Pas de React/Vue/Angular. Pas de bibliothèque de graphiques ni d'icônes |
| Build | Aucun build obligatoire. Les fichiers sont servis tels quels |
| Dépendances runtime | **Zéro.** Aucune ressource chargée depuis un CDN ou un domaine tiers |
| Dépendances de dev | Uniquement des outils sans impact sur le bundle (tests avec `node:test`, Lighthouse) |
| Hébergement | Site statique gratuit (GitHub Pages, Netlify, Cloudflare Pages) en HTTPS |
| Navigateurs cibles | Safari iOS 16 (iPhone 8), Chrome Android 10+, navigateurs desktop récents |

---

## 2. Arborescence

```
/
├── index.html              # coquille unique de l'app (SPA)
├── manifest.webmanifest
├── sw.js                   # service worker
├── icons/                  # icon-192.png, icon-512.png, icon-maskable.png (seules images autorisées)
├── css/
│   └── app.css             # un seul fichier CSS
├── js/
│   ├── app.js              # point d'entrée : init DB, router, enregistrement du SW
│   ├── router.js           # routeur par hash
│   ├── db.js               # accès IndexedDB (promesses)
│   ├── store/              # une fonction CRUD par entité
│   │   ├── revenus.js
│   │   ├── charges.js
│   │   ├── depenses.js
│   │   ├── categories.js
│   │   ├── resumes.js
│   │   ├── enveloppes.js   # V2
│   │   └── provisions.js   # V2
│   ├── domain/             # logique métier PURE (aucun accès DOM ni DB) → testée unitairement
│   │   ├── dates.js
│   │   ├── budget.js       # reste à vivre, solde quotidien, prochaine rentrée
│   │   ├── charges.js      # jour de prélèvement effectif
│   │   ├── resume.js       # résumés mensuels
│   │   ├── alertes.js      # V2
│   │   └── provisions.js   # V2
│   ├── views/              # une fonction de rendu par écran
│   │   ├── accueil.js
│   │   ├── ajout.js
│   │   ├── depenses.js
│   │   ├── historique.js
│   │   ├── supprimer-mois.js
│   │   ├── categories.js
│   │   ├── revenus.js
│   │   ├── charges.js
│   │   ├── enveloppes.js   # V2
│   │   └── provisions.js   # V2
│   ├── ui/                 # petits composants réutilisables
│   │   ├── nav.js          # barre du bas + bouton « + Ajouter une dépense »
│   │   ├── donut.js        # camembert en CSS conic-gradient
│   │   ├── barres.js       # histogramme en CSS
│   │   ├── format.js       # formatage des montants et dates (Intl)
│   │   └── banniere.js     # hors ligne / alerte
│   └── export.js           # export / import JSON
└── tests/
    ├── budget.test.js
    ├── charges.test.js
    ├── resume.test.js
    └── provisions.test.js
```

Règle : `domain/` ne dépend de rien. `store/` dépend de `db.js`. `views/` dépendent de `store/`, `domain/` et `ui/`.

---

## 3. Modèle de données (IndexedDB)

Base : `toogood`, version `1`. Tous les montants sont des **entiers en centimes**. Toutes les dates sont des chaînes ISO locales `AAAA-MM-JJ` ; les mois sont `AAAA-MM`. Les identifiants sont générés avec `crypto.randomUUID()`.

| Store | keyPath | Index | Champs |
|---|---|---|---|
| `revenus` | `id` | — | `id`, `nom` (string ≤ 40), `montant` (int > 0), `recurrent` (bool), `jour` (1–31, si récurrent), `date` (AAAA-MM-JJ, si ponctuel), `actifDepuis` (AAAA-MM), `creeLe` |
| `charges` | `id` | — | `id`, `nom`, `montant` (int > 0), `jour` (1–31), `actifDepuis` (AAAA-MM), `historique` (tableau `{ depuis: AAAA-MM, montant, jour }`), `creeLe` |
| `depenses` | `id` | `mois` | `id`, `montant` (int > 0), `categorieId`, `date` (AAAA-MM-JJ), `mois` (AAAA-MM, dérivé de `date`), `note` (string ≤ 60, optionnel), `creeLe`, `modifieLe` |
| `categories` | `id` | — | `id`, `nom` (unique, ≤ 30), `couleur` (hex de la palette), `parDefaut` (bool), `ordre` (int) |
| `resumes` | `mois` | — | `mois`, `total`, `parCategorie` (`{ [categorieId]: centimes }`), `epargne`, `nbDepenses`, `detailSupprime` (bool), `calculeLe` |
| `enveloppes` (V2) | `id` | — | `id`, `type` (`plaisir` \| `epargne`), `nom`, `montantMensuel`, `revenuSourceId` (épargne), `totalCumule`, `suspendue` |
| `provisions` (V2) | `id` | — | `id`, `nom`, `montantTotal`, `moisEcheance` (AAAA-MM), `debut` (AAAA-MM) |
| `meta` | `cle` | — | `schemaVersion`, `installeLe`, `derniereCloture` (AAAA-MM), `alerteVueLe` (V2) |

**Catégories par défaut** (créées au premier lancement, `parDefaut: true`, non supprimables) :

| id | nom | couleur |
|---|---|---|
| `courses` | Courses | `#0B6E4F` |
| `transport` | Transport | `#2F6FB5` |
| `sorties` | Sorties | `#7A5AA6` |
| `plaisir` | Plaisir | `#D9822B` |
| `autre` | Autre | `#9AA0A6` |

**Palette pour les catégories créées** : `#B5446E`, `#0B6E4F`, `#2F6FB5`, `#D9822B`, `#7A5AA6`, `#9AA0A6`.

**Migrations** : gérées dans `onupgradeneeded` selon `oldVersion`. Ne jamais supprimer un store sans migrer ses données.

---

## 4. Logique métier (`js/domain/`)

Toutes les fonctions sont **pures** : elles reçoivent les données et la date du jour (`aujourdhui`) en paramètre, ne lisent jamais `new Date()` elles-mêmes. Cela rend les tests déterministes.

### 4.1 Jour effectif (charges et revenus récurrents)

```
jourEffectif(jour, mois) = min(jour, nombreDeJoursDans(mois))
```
Exemple : jour 31 en février 2027 → 28.

### 4.2 Revenus reçus du mois

Un revenu est **reçu** pour le mois `M` si :
- récurrent, `actifDepuis ≤ M`, et `jourEffectif(jour, M) ≤ jour d'aujourd'hui` (quand `M` est le mois en cours) ;
- ponctuel, `date` est dans `M` et `date ≤ aujourdhui`.

### 4.3 Charges du mois

Toutes les charges actives sur `M` sont déduites **en totalité dès le 1er du mois**, qu'elles soient déjà prélevées ou non : c'est l'argent déjà réservé que le solde bancaire ne montre pas. Le montant utilisé est celui de l'`historique` en vigueur pour `M`. Une modification s'applique à partir du mois suivant (on ajoute une entrée `{ depuis: M+1, ... }`).

### 4.4 Reste à vivre

```
resteAVivre(M) = revenusRecus(M)
               − chargesDuMois(M)
               − epargneDuMois(M)        // V2, 0 en V1
               − provisionsDuMois(M)     // V2, 0 en V1
               − depensesDuMois(M)
```

### 4.5 Prochaine rentrée d'argent

- Parmi les revenus récurrents actifs et les revenus ponctuels, prendre la plus proche date de réception **strictement après** `aujourdhui`, en regardant le mois en cours puis le mois suivant.
- Si aucune rentrée n'est prévue avant la fin du mois en cours : échéance = **dernier jour du mois** (décision Q3 du brief).

### 4.6 Solde quotidien

```
joursRestants = max(1, nombreDeJours(aujourdhui → prochaineRentree))   // aujourd'hui non compris
soldeQuotidien = resteAVivre > 0 ? floor(resteAVivre / joursRestants / 100) * 100 : 0
```
- Arrondi **à l'euro inférieur** pour ne jamais surestimer.
- Si `resteAVivre ≤ 0` : afficher `0 €/jour` et le message d'avertissement.

### 4.7 Résumé mensuel et clôture

- Au lancement de l'app, pour chaque mois passé sans résumé (depuis `meta.derniereCloture`), calculer et stocker un `resume` : `total`, `parCategorie`, `nbDepenses`, `epargne`.
- Le résumé du mois en cours est calculé à la volée, jamais stocké.
- Si une dépense d'un mois passé est modifiée ou supprimée, recalculer son résumé (sauf si `detailSupprime: true`).

### 4.8 Alertes (V2)

```
moyenne7j = dépenses des 7 derniers jours ÷ 7
projection = resteAVivre − moyenne7j × joursRestants
```
Si `projection < 0` et `meta.alerteVueLe ≠ aujourdhui` : afficher l'alerte avec la date estimée du découvert (`aujourdhui + floor(resteAVivre / moyenne7j)` jours) et le solde conseillé. Une seule alerte par jour.

### 4.9 Provisions (V2)

```
moisRestants = nombre de mois de M (inclus) à moisEcheance (exclu), minimum 1
partMensuelle = ceil((montantTotal − dejaReserve) / moisRestants)
```
Le mois de l'échéance, la provision repasse à 0 et une dépense du montant total est créée.

---

## 5. Écrans et routes

Routeur par hash (`#/…`), une seule page HTML. Chaque vue est une fonction `render(container, params)` qui écrit du HTML dans `container` puis branche ses écouteurs.

| Route | Écran | Stories | Barre du bas | Bouton « + » |
|---|---|---|---|---|
| `#/` | Accueil (solde du jour) | US2, US9 | Accueil | oui |
| `#/ajout` | Ajouter une dépense | US4 | non | non |
| `#/ajout/:id` | Modifier une dépense | US4 | non | non |
| `#/depenses` | Dépenses du mois (camembert + liste) | — | Dépenses | oui |
| `#/historique` | Historique et stockage | — | Dépenses | oui |
| `#/historique/supprimer/:mois` | Supprimer un mois | — | non | non |
| `#/categories` | Catégories | — | non | non |
| `#/mois/revenus` | Mon mois – Revenus | US1 | Mon mois | oui |
| `#/mois/charges` | Mon mois – Charges fixes | US3 | Mon mois | oui |
| `#/mois/provisions` | Mon mois – Provisions | US8 (V2) | Mon mois | oui |
| `#/enveloppes` | Enveloppes | US6, US7 (V2) | Enveloppes | oui |

**Premier lancement** : si aucun revenu n'existe, l'accueil remplace la carte du solde par une invitation « Commence par ajouter tes revenus » → `#/mois/revenus`.

**Formulaires** : ajout et modification de revenus, charges, catégories et provisions dans un panneau `<dialog>` natif ouvert depuis l'écran concerné (pas de route dédiée).

**Bannière hors ligne** : affichée quand `navigator.onLine === false`, mise à jour sur les événements `online` / `offline`. Rôle `status`.

Les textes, l'ordre des éléments et la hiérarchie visuelle suivent la maquette décrite dans `Brief.md` (section `<maquette>`).

---

## 6. Interface

- **Format** : mobile first, conçu à 375 px, utilisable dès 320 px. Au-delà de 600 px, contenu centré, largeur max 480 px.
- **CSS** : un seul fichier, variables CSS pour les couleurs, pas de préprocesseur. Polices système uniquement.
- **Icônes** : SVG inline au trait, `aria-hidden="true"`, `stroke="currentColor"`.
- **Montants** : `Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' })`. Saisie au clavier décimal (`inputmode="decimal"`), virgule et point acceptés, 2 décimales max.
- **Camembert** (`ui/donut.js`) : `div` en `conic-gradient`, trou central avec le total, légende à côté (pastille, nom, montant, %). Catégories triées par montant décroissant ; au-delà de 5 catégories, regrouper le reste dans « Autres ». `role="img"` + `aria-label` listant les valeurs.
- **Histogramme** (`ui/barres.js`) : 6 barres en flex, hauteurs en % du max, valeurs affichées au-dessus, mois en cours en couleur d'accent, axe à zéro. `role="img"` + `aria-label`.
- **Animations** : aucune, sauf une transition ≤ 150 ms sur les états de boutons, désactivée si `prefers-reduced-motion`.

---

## 7. Hors ligne (Service Worker)

- **Précache** à l'installation de toutes les ressources de l'app (HTML, CSS, JS, manifest, icônes), listées en dur dans `sw.js` avec un numéro de version `CACHE = 'toogood-v1'`.
- **Stratégie** : cache-first pour ces ressources. Aucune autre requête n'existe.
- **Mise à jour** : à chaque déploiement, incrémenter `CACHE` ; à l'activation, supprimer les anciens caches. Afficher « Nouvelle version disponible — Recharger » plutôt que de forcer le rechargement.
- **Persistance** : au premier lancement, appeler `navigator.storage.persist()` (si disponible) pour limiter le risque d'effacement des données par le navigateur.
- **Installation** : sur iOS, si l'app n'est pas installée (`navigator.standalone !== true`), afficher une fois un encart expliquant « Partager › Sur l'écran d'accueil », en précisant que l'installation protège les données.

---

## 8. Stockage, suppression de mois et sauvegarde

### 8.1 Espace utilisé

- Total : `navigator.storage.estimate()` → `usage`, affiché en Ko/Mo.
- Par mois : estimation = `JSON.stringify(dépenses du mois).length` octets (approximation suffisante, à libeller « environ »).

### 8.2 Supprimer un mois (`#/historique/supprimer/:mois`)

- Interdit pour le mois en cours (pas de bouton).
- Écran de confirmation : nom du mois, nombre de dépenses, total, taille.
- Case **« Garder les totaux du mois »** cochée par défaut :
    - cochée → s'assurer que le `resume` du mois est à jour, supprimer toutes les dépenses du mois (index `mois`), passer `resume.detailSupprime = true` ;
    - décochée → supprimer les dépenses **et** le `resume` du mois.
- Lien « Exporter ce mois avant » → export JSON limité à ce mois.
- Suppression dans **une seule transaction** IndexedDB : tout ou rien.
- Après suppression : retour à `#/historique` et message « Octobre 2026 supprimé — X Ko libérés ».

### 8.3 Export / import JSON

Format du fichier `toogood-AAAA-MM-JJ.json` :
```json
{
  "app": "toogood",
  "schemaVersion": 1,
  "exporteLe": "2026-11-12T10:15:00",
  "perimetre": "tout",
  "donnees": {
    "revenus": [], "charges": [], "depenses": [], "categories": [],
    "resumes": [], "enveloppes": [], "provisions": []
  }
}
```
- Export : `Blob` + lien de téléchargement, aucune requête réseau.
- Import : `<input type="file" accept="application/json">`, validation du champ `app` et de `schemaVersion`, puis choix « Remplacer mes données » (avec confirmation). Rejeter tout fichier invalide avec un message clair, sans rien modifier.

---

## 9. Catégories

- Création : nom obligatoire, unique sans tenir compte de la casse et des espaces, ≤ 30 caractères ; couleur obligatoire dans la palette.
- Modification : nom et couleur.
- Suppression (catégories créées uniquement) : confirmation, puis réaffectation de toutes les dépenses vers `autre` et mise à jour des résumés concernés, dans une seule transaction.
- Ordre d'affichage dans l'écran d'ajout : catégories par défaut puis créées, suivies du bouton « + Nouvelle ».

---

## 10. Accessibilité

- Éléments natifs : `<button>`, `<a href>`, `<input>` + `<label>`, `<dialog>`, `<fieldset>` / `<legend>` pour les groupes de catégories et de couleurs.
- Boutons de catégorie : `aria-pressed`. Boutons icônes : `aria-label` explicite (« Supprimer : Courses, 12 € »).
- Contraste AA, zones tactiles ≥ 44 × 44 px, focus visible.
- Montant principal lisible : `aria-label="19 euros par jour"`.
- Erreurs de formulaire : message sous le champ, relié par `aria-describedby`, focus déplacé sur le premier champ en erreur.

---

## 11. Budget de performance et vérifications

| Indicateur | Cible | Comment vérifier |
|---|---|---|
| Poids total transféré au premier chargement | < 500 Ko (objectif : < 150 Ko) | DevTools › Réseau, cache désactivé |
| Nombre de requêtes au premier chargement | ≤ 15 | DevTools › Réseau |
| Affichage du contenu principal (LCP) | < 2,5 s en 4G, < 4 s en 3G simulée | Lighthouse, profil mobile |
| Requêtes réseau pendant l'usage | 0 | DevTools › Réseau après le premier chargement |
| EcoIndex | A ou B | ecoindex.fr / GreenIT-Analysis |
| Lighthouse Accessibilité | ≥ 95 | Lighthouse |
| Saisie d'une dépense | 2 actions, < 1 min | Test chronométré |
| Compatibilité | iPhone 8 (iOS 16), Android de 6 ans | Test sur appareil réel |

Mesurer après chaque story et noter les résultats dans `MESURES.md`.

---

## 12. Tests

Lancer avec `node --test tests/`. Aucune dépendance.

Cas obligatoires (`aujourdhui = 2026-11-10` sauf mention contraire) :

| # | Cas | Données | Résultat attendu |
|---|---|---|---|
| T1 | Revenu pas encore reçu | APL 200 €, récurrent, le 25 | non compté dans les revenus reçus |
| T2 | Reste à vivre | reçus 850 €, charges 595 €, dépenses 70 € | 185 € |
| T3 | Solde quotidien | reste à vivre 185 €, prochaine rentrée le 25 | 15 jours → 12 €/jour (12,33 arrondi à l'inférieur) |
| T4 | Reste à vivre négatif | reste à vivre −20 € | solde quotidien 0 € + avertissement |
| T5 | Aucune rentrée prévue ce mois | aucun revenu après le 10 | échéance = 30 nov., 20 jours |
| T6 | Jour inexistant | charge le 31, mois = 2027-02 | prélevée le 28 |
| T7 | Modification d'une charge | loyer 560 € → 580 € modifié en novembre | novembre : 560 €, décembre : 580 € |
| T8 | Résumé mensuel | 5 dépenses d'octobre | total et `parCategorie` exacts |
| T9 | Suppression avec totaux | octobre, case cochée | 0 dépense en octobre, résumé conservé, `detailSupprime: true` |
| T10 | Suppression complète | octobre, case décochée | 0 dépense, aucun résumé |
| T11 | Suppression d'une catégorie | « Café » avec 4 dépenses | 4 dépenses passent en `autre` |
| T12 | Montant invalide | « 0 », « -5 », « 12,345 », « abc » | refusé |
| T13 | Import invalide | fichier sans `app: "toogood"` | refusé, données inchangées |
| T14 (V2) | Provision | 600 € échéance mars, en novembre, rien réservé | 4 mois → 150 €/mois |
| T15 (V2) | Alerte | reste à vivre 120 €, moyenne 7 j 12 €/j, 15 jours | alerte, découvert estimé le 20 nov. |

Note : les chiffres de la maquette (19 €/jour, 285 €) sont illustratifs. Les tests ci-dessus font foi pour les calculs.

---

## 13. Plan de livraison

Une story = une branche = une vérification du budget de performance.

| Étape | Contenu | Terminé quand |
|---|---|---|
| 0. Socle | `index.html`, CSS, routeur, `db.js`, manifest, SW, catégories par défaut, bannière hors ligne | L'app s'installe et s'ouvre en mode avion |
| 1. US1 | Revenus : liste, ajout, modification, suppression | Scénario Gherkin US1 + T1 |
| 2. US3 | Charges fixes | Scénario US3 + T6, T7 |
| 3. US4 | Ajout / modification d'une dépense, catégories | Scénario US4 + T12 |
| 4. US2 | Accueil : reste à vivre, solde quotidien, dernières dépenses | Scénario US2 + T2 à T5 |
| 5. US9 | Vérification complète du hors ligne, encart d'installation iOS, `storage.persist()` | Scénario US9 en mode avion sur un vrai téléphone |
| 6. Graphiques et stockage | Camembert, historique, résumés, suppression de mois, export/import, gestion des catégories | T8 à T11, T13 |
| 7. V2 | Alertes, enveloppes, provisions | Scénarios V2 + T14, T15 |

---

## 14. Definition of Done (toutes les stories)

- [ ] Scénarios Gherkin de la story vérifiés.
- [ ] Tests unitaires du domaine concerné au vert.
- [ ] Aucune requête réseau pendant l'usage ; aucune ressource tierce.
- [ ] Budget de performance respecté (section 11), mesures ajoutées à `MESURES.md`.
- [ ] Testé en 3G simulée, à 320 px de large et en mode avion.
- [ ] Contrôles d'accessibilité de la section 10 respectés.
- [ ] Grille RGESN mise à jour si la story touche un critère.
---

## 15. Décisions (validées le 2026-11-12)

Ces décisions complètent ou précisent les sections ci-dessus. En cas de contradiction avec une section antérieure de cette spec, **cette section prime** (les règles métier de `Brief.md` restent au-dessus).

### Calculs

| # | Sujet | Décision |
|---|---|---|
| D1 | Période budgétaire | Mois calendaire. Chaque revenu a une option **« Compte pour le mois suivant »** (champ `moisSuivant`, booléen, `false` par défaut, store `revenus`). Si elle est cochée, un revenu reçu le jour J du mois M compte dans les revenus reçus de M+1, **dès le 1er du mois**, et pas dans ceux de M. Dans le formulaire de revenu : case à cocher sous la date. Les tests T1 à T15 passent les montants reçus directement. |
| D1b | Prochaine rentrée et `moisSuivant` | Un revenu `moisSuivant` n'alimente pas le mois en cours : il est **ignoré** dans le calcul de la prochaine rentrée (§4.5). (confirmé) |
| D2 | Report de solde | Aucun report d'un mois sur l'autre en V1 (ni excédent ni déficit). |
| D3 | Prochaine rentrée | Recherche **uniquement dans le mois en cours** (strictement après `aujourdhui`) ; sinon dernier jour du mois. On ne regarde pas le mois suivant (remplace §4.5, 1er point). |
| D4 | Modification / suppression d'un revenu | Effet immédiat, y compris sur le mois en cours. Pas d'historique. |
| D5 | Suppression d'une charge | Champ `actifJusqua` (AAAA-MM) = mois en cours : la charge reste déduite ce mois-ci et disparaît le mois suivant. |
| D6 | Correction d'une charge le mois de sa création | Si `actifDepuis` = mois en cours, la modification s'applique **immédiatement** (on remplace l'entrée d'historique du mois au lieu d'ajouter `{ depuis: M+1 }`). |
| D7 | « Total du mois » (écran Revenus) | Somme des revenus **attendus** sur le mois (récurrents actifs + ponctuels du mois), reçus ou non. Les revenus **reçus** ne servent qu'au reste à vivre. |
| D28 | Suppression d'une charge créée ce mois-ci | Si actifDepuis = mois courant, la charge est supprimée définitivement (plus déduite ce mois-ci) ; sinon D5 s'applique (décision utilisateur du 2026-11-12, option A). |
| D21 | Validation des montants revenus / charges | Même analyseur que les dépenses : > 0, 2 décimales max, virgule ou point. |
| D27 | Date d'un revenu ponctuel | Limitée au mois courant, ou au mois précédent si « Compte pour le mois suivant » est coché ; sinon erreur « Choisis une date de ce mois-ci. » (décision utilisateur du 2026-11-12, option A). |

### Tests et organisation

| # | Sujet | Décision |
|---|---|---|
| D8 | Tests touchant IndexedDB / import (T9, T10, T11, T13) | Écrits comme **fonctions pures** dans `domain/` (plan de suppression d'un mois, réaffectation de catégorie, `validerImport`). La transaction IndexedDB est vérifiée manuellement. |
| D9 | Fichiers supplémentaires | `js/domain/montant.js` + `tests/montant.test.js` (T12), `js/domain/import.js` + `tests/import.test.js` (T13), `tests/alertes.test.js` (T15). |
| D10 | TDD | Pour chaque étape : écrire ses tests, constater l'échec, implémenter. |
| D11 | Branches et Git | Une branche par étape, créée depuis `master` à jour : `etape-0-socle`, `etape-1-revenus`, `etape-2-charges`, `etape-3-depenses`, `etape-4-accueil`, `etape-5-hors-ligne`, `etape-6-graphiques-stockage`, `etape-7-v2`. Un commit par tâche (français, `type(portée): description`), poussé aussitôt. En fin d'étape, après validation : PR vers `master` (titre « Étape N – … »), merge, tag `etape-N` poussé. Jamais de `--force`, jamais de réécriture d'historique poussé. Aucune mention d'attribution à Claude dans les commits et PR. |
| T16 | Nouveau test | Job 400 €, reçu le 30 octobre 2026, `moisSuivant = true`, `aujourdhui = 2026-11-01` → compté dans les revenus reçus de novembre (et pas dans ceux d'octobre). Fichier `tests/budget.test.js`, étape 1. |

### Découpage des étapes

| # | Sujet | Décision |
|---|---|---|
| D12 | Gherkin US4 | Vérifié partiellement à l'étape 3, complètement à l'étape 4 (« Dernières dépenses » et solde recalculé). |
| D13 | Catégories et liste des dépenses | Étape 3 : catégories par défaut, bouton « + Nouvelle », liste `#/depenses` avec Modifier / Supprimer. Étape 6 : camembert et écran « Gérer les catégories » (renommer, supprimer, T11). |
| D14 | Éléments V2 | Onglet « Provisions » et entrée « Enveloppes » de la barre du bas **masqués** jusqu'à l'étape 7. |

### Interface et textes

| # | Sujet | Décision |
|---|---|---|
| D15 | Ligne de revenu | Nom ; sous-titre « Récurrent · le 5 » (ou « Ponctuel · le 12 nov. ») ; montant à droite. |
| D16 | Format des montants | Centimes affichés seulement s'ils sont non nuls : « 450 € », « 12,50 € ». |
| D17 | Champ `note` des dépenses | Non affiché en V1 (le champ reste optionnel dans le modèle). |
| D18 | Textes | Avertissement reste à vivre négatif : « Tu as dépassé ton budget de 20 €. Pas de panique : limite tes dépenses jusqu'au 25. » — Bandeau hors ligne : « Hors ligne · tes saisies sont enregistrées sur ce téléphone. » — Premier lancement : « Commence par ajouter tes revenus » + bouton « Ajouter mon premier revenu » → `#/mois/revenus`. |
| D19 | Regroupement du camembert | Au-delà de 5 catégories, le surplus est fusionné dans « Autre » (pas de libellé « Autres »). |
| D20 | Date d'une dépense | Interdite dans le futur et dans un mois dont le détail a été supprimé (`detailSupprime: true`). |
| D29 | Dernier jour du mois sans rentrée | Ligne « Reste à vivre : … · fin du mois aujourd'hui » (le calcul garde 1 jour minimum) — décision utilisateur du 2026-11-13. |
| D30 | Avertissement en début de mois | Reste à vivre négatif, aucune dépense du mois et une rentrée prévue : « Ta prochaine rentrée arrive le {jour} : limite tes dépenses d'ici là. » ; sinon texte D18 — décision utilisateur du 2026-11-13. |

### Pratique

| # | Sujet | Décision |
|---|---|---|
| D22 | Brief | Fichier renommé `Brief.md`. |
| D23 | Dépôt | Commit initial sur `master` (Brief, spec, `.gitignore` excluant `.idea/` et `*.iml`). |
| D24 | Icônes PWA | PNG générés par un script Node (zlib, sans dépendance) : carré `#0B6E4F`, « TG » en blanc. |
| D25 | Mesures non automatisables | Test sur iPhone 8 réel (mode avion) et EcoIndex : notés « à faire par l'équipe » dans `MESURES.md`. |
| D26 | Maquette | Le lien Claude Design n'est pas consulté : la section `<maquette>` de `Brief.md` fait foi. |

### Décisions du plan (validées le 2026-11-12)

| # | Sujet | Décision |
|---|---|---|
| B1 | Requêtes vs modules ES | Sources en modules ES natifs (utilisables sans build pour développer et tester). `node tools/build.mjs` produit `dist/` avec **un seul** `js/app.js` et **un seul** `css/app.css`, génère la liste de précache du service worker et **incrémente la version du cache** (`toogood-vN`) quand le contenu change. Seul `dist/` est déployé. |
| B2 | Total du mois et `moisSuivant` | Le total des revenus attendus du mois M compte les revenus qui financent M (un revenu `moisSuivant` du 30 octobre compte dans le total de novembre). |
| B3 | Reste à vivre à 0 € | « 0 €/jour » sans message ; l'avertissement n'apparaît que si le reste à vivre est négatif. |
| B4 | Accueil sans rentrée prévue | « Reste à vivre : 285 € · fin du mois dans 20 jours » ; sinon « … · prochaine rentrée dans 15 jours (APL, le 25) » ; singulier « dans 1 jour ». |
| B5 | Après « Valider » | Ajout → `#/` ; modification → `#/depenses`. |
| B6 | Bouton rouge | `--danger: #B3261E`. |
| B7 | Suppressions | `confirm()` natif pour revenus, charges et dépenses. La suppression d'un mois garde son écran de confirmation dédié (§ 8.2). |

### Décisions des étapes 5 à 7

| # | Sujet | Décision |
|---|---|---|
| D31 | Encart d'installation iOS | Stockage séparé Safari / app installée ; le texte se termine par « Installe-la avant de saisir tes données. » ; l'encart n'est proposé que dans Safari iOS non installé (pas Chrome iOS, Firefox iOS, Edge iOS ni navigateurs intégrés aux apps) (décision du 2026-11-13). |
| D32 | Persistance du stockage | `navigator.storage.persist()` demandé hors du chemin critique, une fois, puis une seconde fois après installation si la première demande a été refusée (décision du 2026-11-13). |
| D33 | Déploiement | GitHub Pages par un workflow GitHub Actions qui lance les tests puis `node tools/build.mjs` et publie `dist/` ; seul `dist/` est publié (décision du 2026-11-13). |
| D34 | Provision à échéance | La dépense créée a la catégorie « Autre » et la note « Provision : <nom> » (ex. « Provision : Assurance auto ») (décision utilisateur du 2026-11-13). |
| D35 | Montant déjà réservé d'une provision | Somme des parts mensuelles des mois écoulés depuis `debut`, calculée à la volée (pas de champ stocké) ; part du mois = ceil((montantTotal − dejaReserve) ÷ moisRestants) (décision utilisateur du 2026-11-13). |
| D36 | Épargne | Déduite du reste à vivre du mois dès que le revenu source est reçu (avant, rien n'est déduit) ; le montant épargné du mois est ajouté à `totalCumule` à la clôture du mois et stocké dans le résumé mensuel (`epargne`) ; une épargne suspendue n'est pas déduite (décision utilisateur du 2026-11-13). |
| D37 | Enveloppes | Au maximum 1 enveloppe Plaisir et 3 enveloppes Épargne (décision utilisateur du 2026-11-13). |
| D38 | Import « Remplacer » | Les catégories par défaut absentes du fichier sont recréées après l'import (une app sans « Autre » serait inutilisable) ; `derniereCloture` est effacée et la clôture relancée (décision du 2026-11-13). |
| D39 | Import d'un fichier mensuel | Fichier dont le `perimetre` ≠ `tout` : confirmation spécifique « Ce fichier ne contient que les dépenses d'octobre 2026. Remplacer toutes tes données par celles-ci ? », puis remplacement de toutes les données (pas de fusion, conforme à § 8.3) (décision du 2026-11-13). |
| D40 | Moment de la clôture | Lancée au démarrage hors du chemin critique (après le premier rendu) et rappelée avant l'affichage de l'historique ; sortie immédiate, sans lire les dépenses, si le mois précédent est déjà clôturé (décision du 2026-11-13). |
| D41 | Résumés vides | Un mois sans dépense (et sans épargne) n'a pas de résumé : la clôture n'en écrit pas, et le recalcul supprime un résumé retombé à 0 ; la clôture recalcule les résumés non `detailSupprime` de la plage (écart assumé avec § 4.7 « mois sans résumé » : résultat identique ou plus frais) (décision du 2026-11-13). |
| D42 | Épargne cumulée | Le résumé mensuel stocke l'épargne par enveloppe (`epargneParEnveloppe`, `epargne` = somme) ; `totalCumule` est recalculé à chaque clôture comme la somme des résumés (jamais incrémenté, donc sans double comptage après un import ou un recalcul) ; l'épargne d'un mois passé utilise l'état actuel des enveloppes ; supprimer entièrement un mois retire aussi son épargne du cumul (décision du 2026-11-13). |
| D43 | Clôture | La plage commence à la première dépense ou à la création de la première enveloppe Épargne, au plus ancien (décision du 2026-11-13). |
| D44 | Provision à échéance | Au premier lancement du mois d'échéance, une dépense du montant total (« Autre », note « Provision : <nom> », datée du 1er du mois) est créée et la provision supprimée, dans une seule transaction ; le reste à vivre de ce mois réintègre le montant déjà réservé les mois précédents (champ `reserve` de la dépense, avec `provisionId`), pour ne pas compter deux fois l'argent mis de côté (décision du 2026-11-13). |
| D45 | Enveloppe Plaisir | Non déduite du reste à vivre (c'est une part des dépenses) ; restant = budget − dépenses « Plaisir » du mois ; budget refusé s'il dépasse le reste à vivre du moment ; dépassement signalé à la saisie sans bloquer (décision du 2026-11-13). |
| D46 | Alerte (V2) | La moyenne des 7 derniers jours lit aussi le mois précédent du 1er au 6 ; une seule alerte par jour (`meta.alerteVueLe` écrit à l'affichage) ; une dépense de solde de provision compte pour son montant moins le montant déjà réservé dans la moyenne des 7 jours (pas de fausse alerte au mois d'échéance) (décision du 2026-11-13). |
| D47 | Alerte : reste à vivre nul | Pas de bandeau d'alerte quand le reste à vivre est déjà nul ou négatif (l'encart de la carte « Tu as dépassé ton budget… » ou D30 le dit déjà) ; rien n'est marqué comme vu dans ce cas (décision du 2026-11-13). |
| D48 | Enveloppe Plaisir en modification | Le plafond « budget ≤ reste à vivre » ne s'applique que si le budget augmente ; renommer ou baisser reste toujours possible (décision du 2026-11-13). |
| D49 | Limites connues (import) | Après un import, la clôture relancée recrée le résumé d'un mois supprimé entièrement si une épargne y était active (son épargne revient dans le cumul, conformément à « état actuel des enveloppes » de D42) ; la validation d'import ne contrôle pas `epargneParEnveloppe`, `debut` ni `actifDepuis` (fichiers produits par l'export de l'app). |
