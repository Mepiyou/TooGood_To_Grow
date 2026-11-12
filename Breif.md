# Brief projet — TooGood To Grow

> Ce document est le brief de référence pour développer l'application. Il est écrit pour être lu par Claude Code.
> Les sections XML sont la source de vérité : en cas de doute, appliquer les règles de `<regles_metier>` et les contraintes de `<contraintes_eco>` avant toute autre considération.

## Description

TooGood To Grow est une **application web légère (PWA), installable et fonctionnant hors ligne**, qui aide les étudiants et alternants à gérer leur budget mensuel.

Le problème : les étudiants pilotent leur budget avec le solde affiché par leur banque, qui inclut de l'argent déjà réservé (loyer, abonnements pas encore prélevés). Ils dépensent donc plus que ce dont ils disposent réellement et se retrouvent à découvert avant la fin du mois.

La réponse : l'utilisateur saisit une seule fois ses revenus et ses charges fixes. L'écran d'accueil affiche **combien il peut dépenser par jour** jusqu'à sa prochaine rentrée d'argent, et son **reste à vivre**. Une dépense se saisit en quelques secondes. Aucune connexion bancaire, aucun compte, les données restent sur le téléphone.

Projet réalisé dans le cadre d'un module d'écoconception (Coda Orléans, B3, novembre 2026) : **la sobriété numérique est une exigence, pas une option**.

---

<projet>
  <nom>TooGood To Grow</nom>
  <type>Application web progressive (PWA), mobile first, installable, hors ligne</type>
  <langue_interface>Français</langue_interface>
  <phrase_vision>
    Pour les étudiants et alternants qui gèrent seuls leur budget pour la première fois, TooGood To Grow est une application
    qui leur permet de savoir chaque mois combien ils peuvent dépenser, épargner et se faire plaisir. Contrairement aux
    applications bancaires et de budget, elle ne demande ni compte ni accès aux données bancaires, tout en pesant moins
    de 10 Mo et en fonctionnant sur des téléphones de 6 à 7 ans.
  </phrase_vision>
</projet>

<objectifs>
  <objectif id="O1" type="produit">30 % des utilisateurs remplissent encore leur budget 3 mois après leur première utilisation.</objectif>
  <objectif id="O2" type="produit">Toucher au moins 5 % des alternants de l'école la première année.</objectif>
  <objectif id="O3" type="usage">Saisir une dépense en moins d'1 minute (cible design : 2 actions).</objectif>
  <objectif id="O4" type="environnement">Application de moins de 10 Mo, utilisable sur un iPhone 8 ou un Android de 6 ans.</objectif>
  <objectif id="O5" type="environnement">Pages classées A ou B à l'EcoIndex.</objectif>
</objectifs>

<utilisateurs>
  <persona id="karim" contraint="true">
    <profil>Karim, 21 ans, licence 3, boursier. Job étudiant le week-end, bourse et APL. Vit en résidence CROUS.</profil>
    <equipement>iPhone 8 d'occasion (6 ans), stockage presque plein. Wi-Fi public instable, petit forfait 10 Go.</equipement>
    <usage>Tous les jours, saisie rapide après chaque dépense.</usage>
    <frustration>Ses revenus arrivent à des dates différentes et changent chaque mois. Il ne sait jamais combien il lui reste vraiment.</frustration>
    <note>Persona de référence : toute décision de conception doit fonctionner pour lui.</note>
  </persona>
  <persona id="lea">
    <profil>Léa, 19 ans, BTS en alternance, 850 € net. Premier appartement.</profil>
    <equipement>Samsung de 3 ans, forfait 4G 40 Go + Wi-Fi.</equipement>
    <usage>Le jour de la paie, puis 2 à 3 consultations rapides par semaine.</usage>
    <objectif>Payer ses charges sans stress et mettre 50 €/mois de côté pour son permis.</objectif>
  </persona>
  <persona id="manon">
    <profil>Manon, 24 ans, master en alternance, 1 350 € net. Appartement et voiture.</profil>
    <equipement>iPhone de 2 ans + PC portable, fibre et 5G illimitée.</equipement>
    <usage>Bilan de 15 min le dimanche, planification en début de mois.</usage>
    <frustration>A abandonné son tableur Excel au bout de 2 semaines. L'assurance auto annuelle (600 €) a fait exploser son budget.</frustration>
  </persona>
</utilisateurs>

<perimetre>
  <version id="V1" nom="MVP" points="21">
    <story ref="US1"/><story ref="US3"/><story ref="US4"/><story ref="US2"/><story ref="US9"/>
  </version>
  <version id="V2" points="16">
    <story ref="US5"/><story ref="US7"/><story ref="US6"/><story ref="US8"/>
  </version>
  <hors_perimetre>
    <exclu nom="Connexion bancaire automatique">API payantes, données bancaires sensibles, connexion permanente. Incompatible avec le hors ligne.</exclu>
    <exclu nom="Création de compte / synchronisation cloud">Contredit la promesse « sans compte ». Aucun serveur nécessaire pour la fiche budget.</exclu>
    <exclu nom="Assistant IA">Calcul serveur lourd, sans valeur pour le besoin principal.</exclu>
    <exclu nom="Conseils d'investissement">Hors cible : les personas n'ont rien à investir.</exclu>
  </hors_perimetre>
  <ordre_de_developpement>US1 → US3 → US4 → US2 → US9, puis V2. US2 dépend de US1, US3 et US4 (le calcul a besoin des revenus, des charges et des dépenses).</ordre_de_developpement>
</perimetre>

<user_stories>
<story id="US1" priorite="Must" points="3" version="V1">
<titre>Enregistrer ses revenus</titre>
<enonce>En tant qu'étudiant, je veux enregistrer tous mes revenus afin de savoir combien je touche dans le mois.</enonce>
<done>L'utilisateur peut ajouter un revenu avec un montant et une date, et le total du mois s'affiche.</done>
<gherkin>
Scénario: Ajouter un revenu récurrent
Étant donné que Karim n'a aucun revenu enregistré
Quand il ajoute « Bourse », 450 €, reçu le 5, récurrent
Alors la liste des revenus affiche « Bourse · 450 € · le 5 »
Et le total des revenus du mois affiche 450 €
</gherkin>
</story>
<story id="US3" priorite="Must" points="3" version="V1">
<titre>Enregistrer ses charges fixes</titre>
<enonce>En tant qu'étudiant, je veux enregistrer mes charges fixes une seule fois afin qu'elles soient déduites chaque mois.</enonce>
<done>L'utilisateur peut ajouter une charge avec un nom, un montant et une date, et elle est déduite automatiquement chaque mois.</done>
<gherkin>
Scénario: Report automatique d'une charge
Étant donné que Karim a enregistré « Loyer CROUS », 560 €, prélevé le 3, en octobre
Quand le mois de novembre commence
Alors le loyer de 560 € est déduit du budget de novembre sans nouvelle saisie
</gherkin>
</story>
<story id="US4" priorite="Must" points="2" version="V1">
<titre>Ajouter une dépense rapidement</titre>
<enonce>En tant qu'étudiant, je veux ajouter une dépense rapidement afin de suivre mon budget sans effort.</enonce>
<done>Le bouton « + Ajouter une dépense » est visible sur tous les écrans principaux et seuls le montant et la catégorie sont demandés.</done>
<gherkin>
Scénario: Saisie en 2 actions
Étant donné que Karim est sur l'écran d'accueil
Quand il touche « + Ajouter une dépense », saisit 12 €, choisit « Courses » et valide
Alors la dépense apparaît dans « Dernières dépenses » avec la date du jour
Et le solde quotidien est recalculé
</gherkin>
<critere_environnemental>La saisie d'une dépense n'envoie aucune requête réseau (0 requête dans l'onglet Réseau des DevTools).</critere_environnemental>
</story>
<story id="US2" priorite="Must" points="5" version="V1">
<titre>Voir son solde quotidien</titre>
<enonce>En tant qu'étudiant, je veux voir combien je peux dépenser par jour afin de tenir jusqu'à la fin du mois.</enonce>
<done>Le montant s'affiche sur l'écran d'accueil et se met à jour après chaque dépense.</done>
<gherkin>
Scénario: Afficher le solde quotidien
Étant donné un reste à vivre de 285 €
Et une prochaine rentrée d'argent dans 15 jours
Quand Karim ouvre l'application
Alors l'accueil affiche « 19 €/jour »
Et « Reste à vivre : 285 € »

      Scénario: Reste à vivre négatif
        Étant donné un reste à vivre de −20 €
        Quand Karim ouvre l'application
        Alors l'accueil affiche « 0 €/jour » et un message d'avertissement bienveillant
    </gherkin>
    <critere_environnemental>La page d'accueil pèse moins de 500 Ko et son contenu principal s'affiche en moins de 2,5 s en 4G (Lighthouse).</critere_environnemental>
  </story>
  <story id="US9" priorite="Must" points="8" version="V1">
    <titre>Utiliser l'appli hors ligne</titre>
    <enonce>En tant qu'étudiant peu équipé, je veux utiliser l'appli sans connexion afin de noter mes dépenses partout.</enonce>
    <done>L'utilisateur peut consulter son solde et saisir une dépense sans réseau.</done>
    <gherkin>
      Scénario: Saisie en mode avion
        Étant donné que l'application a déjà été ouverte une fois
        Et que le téléphone est en mode avion
        Quand Karim ouvre l'application et ajoute une dépense de 5 €
        Alors la dépense est enregistrée sur le téléphone
        Et le solde quotidien est mis à jour
        Et un bandeau discret indique « Hors ligne »
    </gherkin>
  </story>
  <story id="US5" priorite="Should" points="5" version="V2">
    <titre>Être alerté avant le découvert</titre>
    <enonce>En tant qu'étudiant, je veux être alerté avant d'être à découvert afin de réduire mes dépenses à temps.</enonce>
    <done>Une alerte s'affiche si la projection passe sous 0 €, avec la date estimée du découvert.</done>
  </story>
  <story id="US7" priorite="Should" points="3" version="V2">
    <titre>Épargner chaque mois</titre>
    <enonce>En tant qu'étudiant, je veux mettre de côté une somme chaque mois afin d'épargner facilement.</enonce>
    <done>Le montant choisi est déduit du reste à vivre et le total épargné est affiché.</done>
  </story>
  <story id="US6" priorite="Should" points="3" version="V2">
    <titre>Avoir un budget plaisir</titre>
    <enonce>En tant qu'étudiant, je veux un budget plaisir afin de me faire plaisir sans culpabiliser.</enonce>
    <done>L'utilisateur peut fixer un montant mensuel et voir ce qu'il reste dans l'enveloppe.</done>
  </story>
  <story id="US8" priorite="Should" points="5" version="V2">
    <titre>Répartir ses dépenses annuelles</titre>
    <enonce>En tant qu'étudiant, je veux répartir mes dépenses annuelles sur chaque mois afin d'éviter les mauvaises surprises.</enonce>
    <done>L'utilisateur peut saisir le montant et le mois d'échéance, et la part mensuelle est calculée et réservée automatiquement.</done>
  </story>
</user_stories>

<regles_metier>
<regle domaine="revenus">
<item>Un revenu a un nom, un montant et une date de réception.</item>
<item>Le montant est strictement supérieur à 0 €.</item>
<item>Un revenu est ponctuel ou récurrent (chaque mois).</item>
<item>Un revenu n'est compté dans le reste à vivre qu'à partir de sa date de réception.</item>
</regle>
<regle domaine="charges_fixes">
<item>Une charge a un nom, un montant et un jour de prélèvement (entier de 1 à 31).</item>
<item>Une charge est déduite automatiquement chaque mois, sans nouvelle saisie.</item>
<item>Si le jour n'existe pas dans le mois (ex. 31 février), la charge est prélevée le dernier jour du mois.</item>
<item>La modification d'une charge s'applique à partir du mois suivant, jamais sur les mois passés.</item>
</regle>
<regle domaine="depenses">
<item>Seuls le montant et la catégorie sont obligatoires.</item>
<item>La date est remplie automatiquement avec la date du jour et reste modifiable.</item>
<item>Le montant est strictement supérieur à 0 € et a au maximum 2 décimales.</item>
<item>Une dépense peut être modifiée ou supprimée après sa saisie.</item>
<item>Catégories V1 : Courses, Transport, Sorties, Plaisir, Autre.</item>
</regle>
<regle domaine="solde">
<formule nom="reste_a_vivre">revenus reçus − charges fixes − épargne − provisions − dépenses du mois</formule>
<formule nom="solde_quotidien">reste_a_vivre ÷ nombre de jours restants avant la prochaine rentrée d'argent</formule>
<item>Le solde est recalculé après chaque ajout, modification ou suppression.</item>
<item>Si le reste à vivre est négatif, le solde quotidien affiche 0 € et un message d'avertissement.</item>
<item>Arrondir l'affichage du solde quotidien à l'euro inférieur (pour ne jamais surestimer ce qui est disponible).</item>
</regle>
<regle domaine="hors_ligne">
<item>La consultation et la saisie fonctionnent sans connexion.</item>
<item>Les données sont stockées sur le téléphone.</item>
<item>Aucune donnée bancaire n'est demandée ni stockée.</item>
</regle>
<regle domaine="categories">
<item>Catégories par défaut : Courses, Transport, Sorties, Plaisir, Autre. Elles ne peuvent pas être supprimées.</item>
<item>L'utilisateur peut créer ses propres catégories : un nom (obligatoire, unique, 30 caractères max) et une couleur choisie dans une palette fixe de 6 couleurs.</item>
<item>Une catégorie créée peut être renommée ou supprimée. À la suppression, ses dépenses passent dans « Autre ».</item>
<item>La création est accessible depuis l'écran d'ajout de dépense (bouton « + Nouvelle ») et depuis « Gérer les catégories ».</item>
</regle>
<regle domaine="graphiques">
<item>Camembert (donut) de répartition des dépenses du mois par catégorie, avec le total au centre et une légende (montant + pourcentage).</item>
<item>Histogramme des dépenses des 6 derniers mois, mois en cours en couleur d'accent, axe à zéro, valeurs affichées.</item>
<item>Graphiques dessinés en CSS ou SVG inline, sans bibliothèque de graphiques. Chaque graphique a un aria-label qui donne les valeurs.</item>
<item>Les graphiques des mois passés utilisent les totaux mensuels stockés, pas le détail des dépenses.</item>
</regle>
<regle domaine="stockage_et_suppression">
<item>Aucun backend : toutes les données restent sur le téléphone.</item>
<item>L'écran Historique affiche l'espace utilisé sur le téléphone et, pour chaque mois, le nombre de dépenses et sa taille.</item>
<item>L'utilisateur peut supprimer un mois passé (jamais le mois en cours) pour libérer de l'espace, après un écran de confirmation.</item>
<item>Option cochée par défaut : « Garder les totaux du mois ». Seul le détail des dépenses est supprimé ; le résumé mensuel (total, total par catégorie) reste pour les graphiques.</item>
<item>Option décochée : le mois est supprimé entièrement et disparaît des graphiques.</item>
<item>La suppression est définitive. L'écran propose d'exporter le mois en JSON avant.</item>
<item>Export et import de toutes les données en fichier JSON, en guise de sauvegarde sans compte.</item>
<item>À la clôture d'un mois, un résumé mensuel est calculé et stocké (total, total par catégorie, épargne).</item>
</regle>
<regle domaine="alertes" version="V2">
<item>Une alerte se déclenche si la projection de fin de période passe sous 0 €.</item>
<item>La projection se base sur la moyenne des dépenses des 7 derniers jours.</item>
<item>Une seule alerte maximum par jour.</item>
<item>Message bienveillant qui propose une action (ex. « Il te reste 8 €/jour jusqu'au 25 »).</item>
</regle>
<regle domaine="enveloppe_plaisir" version="V2">
<item>Le budget de l'enveloppe ne peut pas dépasser le reste à vivre disponible.</item>
<item>Une dépense de catégorie « Plaisir » est déduite de l'enveloppe.</item>
<item>Si l'enveloppe est dépassée, l'utilisateur est prévenu, mais la dépense reste possible.</item>
</regle>
<regle domaine="enveloppe_epargne" version="V2">
<item>Le montant épargné est déduit du reste à vivre dès la réception du revenu choisi.</item>
<item>L'utilisateur peut modifier ou suspendre son épargne à tout moment.</item>
<item>Le total épargné est cumulé d'un mois sur l'autre.</item>
</regle>
<regle domaine="provisions" version="V2">
<item>Une provision a un nom, un montant total et un mois d'échéance.</item>
<item>Part mensuelle = montant total ÷ nombre de mois restants avant l'échéance.</item>
<item>Le mois de l'échéance, la provision est remise à 0 et la dépense est enregistrée.</item>
</regle>
</regles_metier>

<modele_de_donnees note="Proposition : à adapter si besoin, en gardant les champs obligatoires des règles.">
<entite nom="Revenu">id, nom, montant (centimes, entier), jourReception (1-31) ou dateReception, recurrent (bool), creeLe</entite>
<entite nom="Charge">id, nom, montant (centimes), jourPrelevement (1-31), actifDepuis (mois AAAA-MM), creeLe</entite>
<entite nom="Depense">id, montant (centimes), categorie, date (AAAA-MM-JJ), creeLe, modifieLe</entite>
<entite nom="Enveloppe" version="V2">id, type (plaisir | epargne), nom, montantMensuel (centimes), revenuSourceId, totalCumule, suspendue (bool)</entite>
<entite nom="Provision" version="V2">id, nom, montantTotal (centimes), moisEcheance (AAAA-MM)</entite>
<entite nom="Categorie">id, nom, couleur (hex), parDefaut (bool)</entite>
<entite nom="ResumeMensuel">mois (AAAA-MM), total (centimes), parCategorie { categorieId: centimes }, epargne (centimes), detailSupprime (bool)</entite>
<regle_technique>Indexer les dépenses par mois (champ mois AAAA-MM) pour ne charger que le mois affiché.</regle_technique>
<regle_technique>Stocker tous les montants en centimes (entiers) pour éviter les erreurs d'arrondi.</regle_technique>
</modele_de_donnees>

<maquette source="Claude Design – TooGood To Grow – Wireframes" url="https://claude.ai/artifact/CwP1mZqkBcePJicJEcgyJu">
  <format>iPhone 8 : 375 × 667 px, mobile first. Doit rester utilisable jusqu'à 320 px de large.</format>
  <style>
    <couleur role="fond">#FFFFFF</couleur>
    <couleur role="texte">#1A1A1A</couleur>
    <couleur role="texte_secondaire">#5F6368</couleur>
    <couleur role="bordure">#D0D4D9</couleur>
    <couleur role="accent">#0B6E4F</couleur>
    <couleur role="alerte_fond">#FFF4E5</couleur>
    <couleur role="alerte_texte">#7A4300</couleur>
    <police>system-ui, -apple-system, "Segoe UI", Roboto, sans-serif (aucune police téléchargée)</police>
    <icones>SVG inline au trait, aucune bibliothèque d'icônes</icones>
  </style>
  <navigation>
    <barre_bas>Accueil · Dépenses · Mon mois · Enveloppes</barre_bas>
    <action_globale>Bouton « + Ajouter une dépense » au-dessus de la barre du bas, sur tous les écrans principaux.</action_globale>
  </navigation>
  <ecran id="1" nom="Accueil" stories="US2">Titre de l'app + date. Carte « Tu peux dépenser » : solde quotidien en très gros (« 19 €/jour ») en vert, dessous « Reste à vivre : 285 € · prochaine rentrée dans 15 jours (APL, le 25) ». Liste des 3 dernières dépenses + lien « Tout voir ».</ecran>
  <ecran id="2" nom="Ajouter une dépense" stories="US4">Lien « ← Retour ». Champ montant en grand (clavier décimal). Catégories en boutons (grille de 3). Date pré-remplie modifiable. Bouton « Valider » qui ramène à l'accueil. Pas de barre de navigation sur cet écran.</ecran>
  <ecran id="3" nom="Dépenses du mois">Onglets segmentés « Ce mois » / « Historique ». Camembert (donut) des dépenses par catégorie avec total au centre et légende. Lien « Gérer les catégories ». Liste par date, chaque ligne avec boutons Modifier et Supprimer (aria-label).</ecran>
  <ecran id="3b" nom="Historique et stockage">Histogramme des 6 derniers mois. Bandeau « Espace utilisé : 58 Ko sur ce téléphone » + bouton « Exporter ». Liste des mois (nombre de dépenses, taille) avec un bouton Supprimer sur chaque mois passé.</ecran>
  <ecran id="3c" nom="Supprimer un mois">Récapitulatif du mois (dépenses, total, taille). Avertissement : suppression définitive. Case cochée « Garder les totaux du mois ». Lien « Exporter ce mois avant ». Bouton rouge « Supprimer octobre 2026 » + « Annuler ».</ecran>
  <ecran id="3d" nom="Catégories">Liste des catégories (pastille de couleur, montant du mois ; « Par défaut » ou boutons Modifier/Supprimer pour les catégories créées). Formulaire : nom + choix de couleur (6 pastilles). Bouton « Créer la catégorie ».</ecran>
  <ecran id="4" nom="Mon mois – Revenus" stories="US1">Onglets segmentés Revenus / Charges fixes / Provisions. Total mensuel. Liste nom + « Récurrent · le 5 » + montant. Bouton secondaire « Ajouter un revenu ».</ecran>
  <ecran id="5" nom="Mon mois – Charges fixes" stories="US3">Même structure. Mention « Déduites automatiquement chaque mois ». Bouton « Ajouter une charge ».</ecran>
  <ecran id="6" nom="Mode hors ligne" stories="US9">Accueil + bandeau gris discret « Hors ligne · tes saisies sont enregistrées sur ce téléphone… ». Tout reste utilisable.</ecran>
  <ecran id="7" nom="Alerte découvert" stories="US5" version="V2">Accueil + bandeau orange (role="alert") avec la date estimée et le solde par jour conseillé.</ecran>
  <ecran id="8" nom="Enveloppes" stories="US6,US7" version="V2">Carte « Plaisir » (restant + barre de progression), carte « Épargne » (total cumulé). Bouton « Créer une enveloppe ».</ecran>
  <ecran id="9" nom="Mon mois – Provisions" stories="US8" version="V2">Carte par provision : nom, montant total, échéance, part mensuelle réservée.</ecran>
  <donnees_de_demo>Revenus : Bourse 450 € (le 5), APL 200 € (le 25), Job week-end 400 € (le 30). Charges : Transport 25 € (le 1), Loyer CROUS 560 € (le 3), Forfait 10 € (le 12). Dépenses de novembre : 70 € au total.</donnees_de_demo>
</maquette>

<contraintes_eco reference="RGESN 2024">
<budget_performance>
<indicateur nom="Poids de la page d'accueil" cible="&lt; 500 Ko" outil="Onglet Réseau des DevTools"/>
<indicateur nom="Temps de saisie d'une dépense" cible="&lt; 1 min" outil="Test utilisateur chronométré"/>
<indicateur nom="Affichage du contenu principal" cible="&lt; 2,5 s en 4G" outil="Lighthouse"/>
<indicateur nom="EcoIndex" cible="A ou B" outil="ecoindex.fr / GreenIT-Analysis"/>
<indicateur nom="Compatibilité" cible="iPhone 8 / Android de 6 ans" outil="Test sur un vrai vieux téléphone"/>
<indicateur nom="Taille de l'application" cible="&lt; 10 Mo"/>
</budget_performance>
<reflexes>
<reflexe rgesn="2.3">Tester en bas débit (3G simulée) dès le début.</reflexe>
<reflexe rgesn="4.2">Pas de défilement infini : listes paginées ou limitées au mois en cours.</reflexe>
<reflexe rgesn="4.1">Rien en lecture automatique, aucune animation décorative.</reflexe>
<reflexe rgesn="4.8">Polices système uniquement.</reflexe>
<reflexe rgesn="4.9">Pas de requête pendant la saisie.</reflexe>
<reflexe rgesn="4.13">Notifications rares, choisies et réglables : 1 par mois maximum (rappel de bilan), désactivée par défaut.</reflexe>
</reflexes>
<interdits>
<item>Aucune image, photo ou illustration décorative.</item>
<item>Aucun tracker, aucune analytics tierce, aucun CDN externe : toutes les ressources sont servies par l'app.</item>
<item>Aucun framework UI lourd si une solution plus légère rend le même service.</item>
</interdits>
</contraintes_eco>

<accessibilite>
  <item>Contraste AA minimum (4,5:1 pour le texte).</item>
  <item>Zones tactiles d'au moins 44 × 44 px.</item>
  <item>Vrais éléments HTML : button, a, input avec label. aria-label sur les boutons icônes.</item>
  <item>Bandeaux hors ligne en role="status", alertes en role="alert".</item>
  <item>Montants lisibles par un lecteur d'écran (ex. « 19 euros par jour »).</item>
</accessibilite>

<stack_recommandee note="Recommandation : à valider par l'équipe avant de commencer.">
<item>HTML, CSS et JavaScript sans framework, ou un framework très léger (Preact, Svelte) si le besoin le justifie.</item>
<item>Service Worker pour le cache hors ligne (stratégie cache-first pour les ressources de l'app).</item>
<item>IndexedDB pour stocker les données sur le téléphone (localStorage acceptable pour un prototype).</item>
<item>Manifest PWA pour l'installation sur l'écran d'accueil.</item>
<item>Aucun backend en V1.</item>
<item>Tests unitaires sur les calculs (reste à vivre, solde quotidien, report des charges, cas du 31 février).</item>
</stack_recommandee>

<definition_of_done note="Proposition : la DoD verte de l'équipe (TP 2.6) n'est pas encore rédigée.">
<item>Les scénarios Gherkin de la story passent.</item>
<item>Le budget de performance est respecté (poids, temps d'affichage).</item>
<item>Testé en 3G simulée et sur petit écran (320 px).</item>
<item>Aucune requête vers un service tiers.</item>
<item>Fonctionne hors ligne après la première visite.</item>
<item>Grille RGESN mise à jour si la story touche un critère.</item>
</definition_of_done>

<questions_ouvertes>
<question id="Q1" statut="tranchée">Pas de backend ni de synchronisation : stockage 100 % local (IndexedDB), avec export/import JSON et suppression de mois pour gérer l'espace.</question>
<question id="Q2">Premier lancement : aucun écran d'accueil (onboarding) n'est défini. Proposition : si aucun revenu n'est enregistré, l'accueil invite à « Ajouter mon premier revenu ».</question>
<question id="Q3">Prochaine rentrée d'argent : quand aucun revenu n'est prévu avant la fin du mois, utiliser le dernier jour du mois comme échéance.</question>
<question id="Q4">Export de la fiche en tableur et rappel mensuel : hors V1 et V2 pour l'instant.</question>
</questions_ouvertes>

<consignes_pour_claude_code>
<item>Développer dans l'ordre de `<ordre_de_developpement>`, une story à la fois, en vérifiant ses scénarios Gherkin.</item>
<item>Respecter strictement `<regles_metier>` et `<contraintes_eco>`. Si une règle est ambiguë, consulter `<questions_ouvertes>` puis demander avant d'inventer.</item>
<item>Reproduire la structure et les textes de `<maquette>` (écrans, libellés, navigation).</item>
<item>Ne jamais ajouter de dépendance externe chargée depuis un CDN, ni de tracker.</item>
<item>Mesurer le poids de la page d'accueil après chaque story et signaler tout dépassement du budget.</item>
</consignes_pour_claude_code>