# Photos de l'app

## Règles
- **Une photo = un seul endroit** : aucune photo n'est répétée ailleurs dans l'app. Une séance garde toujours sa photo.
- Couleurs normales, avec un léger dégradé vert en bas à gauche pour s'accorder au thème.
- Photos sur fond blanc : le fond est prolongé (le sujet n'est jamais coupé).
- Les photos servent aux bannières et grands formats ; sur les cartes elles restent en fond discret (opacité réduite),
  et les petites vignettes de liste sont des icônes.

## Catalogue (`src/data/photos.ts`)
`usePhoto(catégorie, format)` choisit la photo à l'ouverture de l'écran. Les catégories à plusieurs photos
(salle de sport, Défi House) en montrent une autre à chaque entrée dans l'écran. Formats : `card` 4:5, `detail` 5:4, `wide` 2:1
(dans `public/images/ph/`).

| Emplacement | Photo |
|---|---|
| Accueil (rang de saison) | coureur sur piste |
| Pecs maison | pompes sur fond blanc (Pexels) |
| Jambes explosives | squat au ballon lesté |
| Cardio brûle-graisse 5h | course populaire |
| Abdos béton | planche de torse |
| HIIT Terrain | deux coureurs |
| Full body starter | vue de dos |
| Bandeau Terrains / matchs de foot | match de nuit / cercle de crampons |
| Matchs de basket | joueur de basket |
| Raids | amis qui courent (Pexels) |
| Gym Buddy (salle) | râtelier d'haltères ×2 (Pexels, rotation) ; duo : curl (Pexels) |
| Défi House | pompes (Pexels, rotation) |
| Carrousel d'accueil | coach avec cliente (Pexels), amis qui courent (Pexels), dunk |
| Création de compte | athlètes sur piste (Pexels) |

## Sources Pexels (licence Pexels : usage commercial libre)
pompes [3926953](https://www.pexels.com/photo/man-in-black-tank-top-doing-push-ups-3926953/),
[4162487](https://pexels.com/photo/man-doing-push-ups-4162487/),
[176782](https://www.pexels.com/photo/adult-athlete-body-exercise-176782/) ;
haltères [260352](https://www.pexels.com/photo/black-dumbbell-lot-260352/),
[4164849](https://www.pexels.com/photo/person-taking-dumbbells-from-a-rack-4164849/),
[17210042](https://www.pexels.com/photo/bodybuilder-training-with-dumbbell-17210042/) ;
coach [4587402](https://www.pexels.com/photo/woman-doing-pelvic-floor-exercise-lying-on-purple-yoga-mat-with-personal-trainer-4587402/) ;
amis [8381747](https://www.pexels.com/photo/group-of-people-running-together-8381747/),
[8598318](https://www.pexels.com/photo/a-group-of-friends-running-together-while-holding-hands-8598318/) ;
piste [5961848](https://www.pexels.com/photo/athletes-running-on-running-track-5961848/).

> Les photos fournies par le propriétaire montrent de vraies personnes et des marques : vérifier les droits avant publication.

## Mascottes 3D (cartes de séance)
Les cartes de séance n'utilisent plus de photo : ce sont des personnages « argile 3D » en SVG
(`src/components/ui/Mascot3D.tsx`), sur fond blanc ou vert. Pose et fond par catégorie dans `src/data/mascots.ts`
(`pose` : pecs, legs, cardio, abs, hiit, fullbody ; `tone` : white ou lime). Les photos restent pour les bannières.
