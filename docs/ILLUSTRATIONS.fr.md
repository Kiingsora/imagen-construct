# Plan des illustrations

Ces dix visuels sont destinés au futur site de documentation et au rapport. Pour le premier dépôt, les diagrammes Mermaid restent prioritaires : ils représentent le produit honnêtement sans simuler une interface qui n’existe pas encore.

## Direction visuelle commune

- fond blanc ou gris très clair ;
- traits fins gris foncé ;
- accent unique discret ;
- style de schéma de recherche ou de prototype produit ;
- beaucoup d’espace vide ;
- textes courts ;
- format paysage 16:9 ou 3:2 ;
- pas d’effet publicitaire excessif ;
- calques représentés avec une légère profondeur isométrique ;
- damier de transparence lorsque nécessaire.

## Illustration 1 — Vue éclatée du concept

**Emplacement :** haut du README et introduction du rapport.
**But :** faire comprendre le projet en trois secondes.

Une scène de salon est séparée en quatre plaques transparentes flottant l’une au-dessus de l’autre : décor, canapé, personnage, table. À droite, une petite composition finale montre le résultat superposé. Chaque plaque possède un nom et une courte étiquette « prompt », « position », « version ».

## Illustration 2 — Interface desktop complète

**Emplacement :** section interface.
**But :** présenter l’organisation générale.

Maquette sobre d’une application : outils à gauche, canevas central avec salon, calques à droite, prompt et file de génération en bas. Le calque canapé est sélectionné et entouré de poignées de transformation.

## Illustration 3 — Ajout progressif

**Emplacement :** parcours utilisateur.
**But :** montrer le bouton `+` et la construction par étapes.

Quatre vignettes horizontales : salon vide, ajout du canapé, ajout du personnage, ajout de la table. Sous chaque vignette, une nouvelle ligne apparaît dans le panneau de calques.

## Illustration 4 — Régénération sélective

**Emplacement :** proposition de valeur.
**But :** illustrer « ne changer que ce qui est faux ».

Avant/après avec la même scène. À gauche, canapé rouge sélectionné. Au centre, instruction « bleu foncé ». À droite, seul le canapé est bleu ; le personnage, le décor et la table sont rigoureusement identiques.

## Illustration 5 — Carte d’identité d’un calque

**Emplacement :** architecture et données.
**But :** expliquer qu’un calque est plus qu’un PNG.

Carte technique montrant : vignette RGBA, prompt, seed, adaptateur, modèle, position X/Y, échelle, rotation, visibilité, verrouillage et trois versions miniatures.

## Illustration 6 — Transformation rapide contre régénération contextuelle

**Emplacement :** limites techniques.
**But :** éviter une promesse trompeuse.

Visuel divisé en deux :

- à gauche, déplacement instantané d’un PNG avec mention « transform 2D » ;
- à droite, pipeline plus lent avec composite, masque, profondeur, éclairage et mention « contextual regenerate ».

## Illustration 7 — Architecture locale

**Emplacement :** architecture technique.
**But :** rassurer les développeurs.

Schéma : éditeur React → API locale Python → registre d’adaptateurs → ComfyUI → modèles. Une branche revient vers le stockage de projet et les fichiers RGBA. Les données restent dans un ordinateur représenté par un grand contour.

## Illustration 8 — Import et décomposition

**Emplacement :** fonctions futures.
**But :** situer Qwen-Image-Layered.

Une image aplatie entre dans un module « decomposition ». Elle ressort en plusieurs couches transparentes : ciel, sujet, texte, premier plan. Une étiquette précise « future adapter, not MVP ».

## Illustration 9 — Profondeur et pose

**Emplacement :** vision long terme.
**But :** montrer les options avancées sans les confondre avec le MVP.

À gauche, carte de profondeur d’un salon avec plans colorés en niveaux de gris. À droite, mannequin simple articulé guidant un personnage. Les deux blocs sont reliés à un calque généré, avec mention « optional controls ».

## Illustration 10 — Roadmap open source

**Emplacement :** conclusion et page contribution.
**But :** donner envie de participer.

Une ligne en six étapes : documentation, éditeur sans IA, génération locale, édition, contexte, intelligence de scène. Sous chaque étape, de petites icônes représentent les contributions possibles. La phase actuelle est clairement surlignée.

## Noms de fichiers prévus

```text
docs/assets/01-layer-stack-concept.webp
docs/assets/02-desktop-editor-overview.webp
docs/assets/03-progressive-build.webp
docs/assets/04-selective-regeneration.webp
docs/assets/05-layer-metadata-card.webp
docs/assets/06-transform-vs-regenerate.webp
docs/assets/07-local-architecture.webp
docs/assets/08-image-decomposition.webp
docs/assets/09-depth-and-pose.webp
docs/assets/10-open-source-roadmap.webp
```

## Règle de publication

Les images de maquette doivent porter la mention « concept » tant que l’interface correspondante n’est pas implémentée. Dès qu’un prototype réel existe, les captures ou animations du produit doivent remplacer les maquettes dans le README principal.
