# Photos de l'app

## Traitement unique
Toutes les photos passent par le même étalonnage (script de génération hors dépôt) : noirs profonds,
fort contraste, couleurs atténuées (ou noir et blanc), hautes lumières à peine citronnées, vignette et
grain léger. Chaque photo existe en 4 recadrages autour du sujet dans `public/images/ph/` :
`card` (4:5), `detail` (5:4), `wide` (2:1), `tall` (9:19,5).

## Rotation
Le catalogue `src/data/photos.ts` regroupe plusieurs photos par catégorie. `usePhoto(catégorie, format)`
choisit la photo à l'ouverture de l'écran (curseur gardé dans le localStorage) : en revenant sur l'écran,
la photo suivante de la même catégorie s'affiche. Aucune animation, aucun minuteur.

## Origines
- Fournies par le propriétaire du projet : coureur sur piste, deux coureurs, cercle de crampons, match de nuit,
  basket (2), planche de torse, vue de dos, squat au ballon lesté, course populaire.
- Pexels (licence Pexels : usage commercial libre, attribution non requise) :
  pompes [3926953](https://www.pexels.com/photo/man-in-black-tank-top-doing-push-ups-3926953/),
  pompes [4162487](https://pexels.com/photo/man-doing-push-ups-4162487/),
  râtelier d'haltères [260352](https://www.pexels.com/photo/black-dumbbell-lot-260352/),
  haltère au râtelier [4164849](https://www.pexels.com/photo/person-taking-dumbbells-from-a-rack-4164849/),
  curl [17210042](https://www.pexels.com/photo/bodybuilder-training-with-dumbbell-17210042/).

> Les photos fournies montrent de vraies personnes et des marques : vérifier les droits avant toute publication.
