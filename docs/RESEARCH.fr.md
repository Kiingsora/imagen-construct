# Veille technique initiale

**Date de vérification :** 27 août 2026
**Objectif :** identifier les briques crédibles pour un prototype local, sans choisir prématurément un modèle unique.

## Synthèse de décision

| Besoin | Première option recommandée | Option future | Décision MVP |
| --- | --- | --- | --- |
| Générer un objet transparent | LayerDiffuse + SDXL | Générateur moderne + alpha natif | Tester en premier |
| Détourer un objet | BiRefNet ou workflow équivalent | SAM 2 avec correction interactive | Solution de repli |
| Orchestrer les modèles | ComfyUI via adaptateur | Diffusers direct | Retenu |
| Décomposer une image en calques | Qwen-Image-Layered | Modèles futurs plus légers | Différé |
| Segmenter par clic/boîte | SAM 2.1 tiny/small | Autres modèles interactifs | Différé |
| Estimer la profondeur | Depth Anything V2 | Modèle de scène 3D | Différé |
| Contrôler une pose | ControlNet/OpenPose | Mannequin 3D simplifié | Différé |
| Générer un décor | SDXL pour limiter les modèles chargés | FLUX.1-schnell ou autre adaptateur | Choisir un seul modèle |

## 1. Qwen-Image-Layered

### Capacité utile

- décompose une image en plusieurs couches RGBA ;
- nombre de couches variable ;
- décomposition récursive ;
- déplacement, redimensionnement et recoloration des couches ;
- export possible vers des formats éditables dans la démonstration officielle.

### Limites déterminantes

- le dépôt précise que les poids publiés sont spécialisés dans la décomposition ;
- le texte ne contrôle pas précisément le contenu sémantique de chaque couche ;
- la génération texte-vers-plusieurs-couches est limitée ;
- le modèle est annoncé à 20 milliards de paramètres ;
- son coût mémoire en fait une mauvaise dépendance obligatoire pour un MVP visant une machine 16 Go VRAM / 16 Go RAM.

### Place dans Imagen Construct

Adaptateur futur d’import et de décomposition. Ne pas l’utiliser comme cœur du premier générateur par calques.

**Sources :**

- https://github.com/QwenLM/Qwen-Image-Layered
- https://huggingface.co/Qwen/Qwen-Image-Layered

## 2. LayerDiffuse

### Capacité utile

- génération avec transparence latente ;
- text-to-image transparent avec SDXL ;
- image-to-image transparent ;
- code sous Apache 2.0.

### Informations pratiques

L’implémentation Diffusers officielle indique qu’elle est en cours de développement, mais annonce un besoin de 8 Go de VRAM pour ses démonstrations. Cette indication est encourageante pour le matériel cible, sans constituer une garantie de performance pour l’application complète.

### Place dans Imagen Construct

Premier candidat pour produire un objet RGBA réellement généré avec transparence. Une preuve doit mesurer :

- qualité des contours ;
- stabilité sur objets, personnages et cheveux ;
- conservation de l’alpha en image-to-image ;
- temps de génération ;
- mémoire totale avec ComfyUI ou un service direct.

**Sources :**

- https://github.com/lllyasviel/LayerDiffuse
- https://github.com/lllyasviel/LayerDiffuse_DiffusersCLI

## 3. ComfyUI

### Capacité utile

ComfyUI fournit un serveur local avec :

- soumission de workflow à `/prompt` ;
- file et historique ;
- upload d’images et masques ;
- inventaire des modèles ;
- statistiques système ;
- progression temps réel via `/ws` ;
- interruption et libération de mémoire.

### Place dans Imagen Construct

Backend d’inférence du premier prototype. Imagen Construct ne doit pas exposer directement les graphes ComfyUI aux utilisateurs simples. Un adaptateur transforme une demande métier en workflow versionné.

**Source :** https://docs.comfy.org/development/comfyui-server/comms_routes

## 4. Krita AI Diffusion

### Enseignement produit

Le plugin propose déjà :

- remplissage génératif ;
- sélections ;
- régions associées à des zones et calques ;
- calques de contrôle ;
- édition par instruction ;
- connexion à une installation ComfyUI personnalisée.

### Conséquence

Imagen Construct ne doit pas se vendre comme « Krita avec une IA ». Sa différence doit être plus nette : chaque génération est une entité de scène indépendante, avec prompt, version, transformation et backend associés.

**Source :** https://github.com/Acly/krita-ai-diffusion

## 5. SAM 2

### Capacité utile

SAM 2.1 fournit des variantes tiny, small, base plus et large, ainsi qu’une API de segmentation d’image guidée par points ou boîte. Les checkpoints et le code principal sont sous Apache 2.0, avec quelques composants tiers sous leurs propres licences.

### Place dans Imagen Construct

- sélection d’un objet dans une image importée ;
- correction interactive d’un masque ;
- préparation d’un détourage ;
- création d’une zone d’édition.

La variante tiny ou small est la plus cohérente pour un outil local interactif. À intégrer après le MVP.

**Source :** https://github.com/facebookresearch/sam2

## 6. BiRefNet

### Capacité utile

Segmentation dichotomique haute résolution, adaptée aux workflows de détourage automatique.

### Place dans Imagen Construct

Solution de repli lorsqu’un générateur ne produit pas d’alpha. Le benchmark doit inclure : cheveux, fourrure, objets ajourés, transparence partielle, ombres et bords sur fond proche en couleur.

**Source :** https://github.com/lroy-stack/birefnet

## 7. Depth Anything V2

### Capacité utile

Estimation monoculaire de profondeur à partir d’une image unique.

### Place dans Imagen Construct

- suggestion d’ordre avant/arrière ;
- masque d’occlusion approximatif ;
- changement d’échelle assisté lorsqu’un objet est déplacé vers le fond ;
- condition de régénération future.

Une depth map ne suffit pas à reconstruire une géométrie complète ni les parties cachées.

**Source :** https://github.com/DepthAnything/Depth-Anything-V2

## 8. ControlNet et pose

### Capacité utile

ControlNet permet de conditionner la diffusion avec des structures telles que contours, profondeur et poses. Un squelette OpenPose peut guider un personnage.

### Place dans Imagen Construct

Brique future du mannequin facultatif : l’utilisateur ajuste une pose simple, puis l’adaptateur génère le personnage sur un calque transparent.

**Source :** https://github.com/lllyasviel/ControlNet

## 9. SDXL

### Avantages pour le premier prototype

- directement compatible avec l’implémentation LayerDiffuse étudiée ;
- écosystème ComfyUI mature ;
- poids et workflows largement disponibles ;
- peut servir au décor et aux objets afin de réduire le nombre de modèles chargés.

### Licence

Les poids officiels utilisent CreativeML Open RAIL++-M, qui inclut des restrictions d’usage. Le projet ne doit pas présenter cette licence comme équivalente à Apache 2.0.

**Source :** https://huggingface.co/stabilityai/stable-diffusion-xl-base-1.0

## 10. FLUX.1-schnell

### Capacité utile

- 12 milliards de paramètres ;
- génération en un à quatre pas ;
- licence Apache 2.0 ;
- intégration ComfyUI disponible.

### Limite pour le MVP

La carte officielle montre une consommation mémoire élevée pour le pipeline de référence. Des quantifications existent dans l’écosystème, mais elles ajouteraient une variable avant validation du workflow transparent.

### Place dans Imagen Construct

Adaptateur de décor ou générateur générique après que le pipeline de calques fonctionne avec un modèle plus simple à contrôler.

**Source :** https://huggingface.co/black-forest-labs/FLUX.1-schnell

## 11. Recommandation expérimentale

Ordre de test :

1. interface sans IA avec quatre PNG RGBA ;
2. ComfyUI mocké ;
3. LayerDiffuse/SDXL pour un seul objet ;
4. génération de décor avec le même environnement ;
5. test d’un détourage BiRefNet comme solution de repli ;
6. comparaison qualité, temps et mémoire ;
7. seulement ensuite, essai de Qwen-Image-Layered, SAM 2 ou profondeur.

## 12. Critères de benchmark

Chaque adaptateur devra documenter :

| Mesure | Description |
| --- | --- |
| VRAM maximale | Pic observé sur le matériel de référence |
| RAM maximale | Pic système |
| Temps preview | Résolution réduite |
| Temps final | Résolution cible |
| Alpha | Contours, trous, transparence partielle |
| Fidélité prompt | Respect de l’objet demandé |
| Stabilité | Taux d’échec sur vingt générations |
| Reproductibilité | Seed et workflow suffisent-ils ? |
| Licence | Code, poids et restrictions |
| Installation | Nombre d’étapes depuis une machine propre |

Aucun modèle ne doit être adopté uniquement sur la qualité d’une image de démonstration.
