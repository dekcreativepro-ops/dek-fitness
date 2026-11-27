# DEK FITNESS — Liste complète des images à générer

Document de travail : chaque image dont l'app a besoin, avec **l'action / la pose** du personnage.
Les prompts sont en anglais (les générateurs d'images comprennent mieux), les descriptions en français.

## 1. Règles communes (à appliquer à TOUTES les images)

- **Pas de blanc.** Aucun fond blanc, aucune tenue blanche dominante. L'app est sombre + vert lime.
- **Palette de fond** (au choix, à varier d'une image à l'autre) :
  - noir doux `#0E0F12` / anthracite `#1A1B1F`
  - vert lime `#C8FF00` (fond plein ou dégradé lime → vert profond `#1F3300`)
  - vert foncé profond `#0F2A12`
  - accents rares : bleu glace `#5BD6FF`, orange braise `#FF9F45`
- **Style** : personnage 3D caricaturé (type argile / pixar), grosse tête, gros poings, expressions fortes, muscles
  exagérés mais sympathiques, matière soyeuse avec reflets doux, éclairage studio, ombre douce au sol.
- **Un seul personnage « DEK »** pour la cohérence : même visage, même coupe, mêmes tenues (haut lime ou noir,
  short noir, baskets noires/lime). Variantes autorisées : une athlète femme, un coach plus âgé, mais même style 3D.
- **Cadrage** : personnage centré, **grandes marges** autour (je recadre en 4:5, 5:4 et 2:1 selon l'écran).
  Pas de texte, pas de logo, pas de marque, pas de filigrane dans l'image.
- **Format de sortie** : carré 1:1, **1536 × 1536 px** minimum, PNG ou JPG. Si le générateur sait faire un fond
  transparent (PNG), c'est encore mieux : le fond sera alors modifiable dans l'app.
- **Nom de fichier** : celui indiqué dans la colonne « Fichier ». Dépose-les dans un dossier `images-source/`
  à la racine du projet, je m'occupe du redimensionnement et de l'intégration.

### Bloc de style à coller au début de chaque prompt

```
3D caricature character render, soft clay / Pixar-like material, oversized head and fists,
exaggerated friendly athletic proportions, silky skin with soft highlights, studio lighting,
subtle ground shadow, centered with generous empty margins, no text, no logo, no watermark,
NO white background. Background: <COULEUR>.
Character: young athletic man, short black hair, determined expression, lime-green (#C8FF00)
sport top, black shorts, black and lime sneakers.
```

---

## 2. Séances guidées — 6 images (REÇUES ET INTÉGRÉES le 27/11)

Sources dans `images-source/seance-*.png` ; recadrages générés par un script en `public/images/seance/` (card 4:5, detail 5:4).

Utilisées sur les cartes de séance (4:5), sur les bannières de détail (5:4) et sur « Continuer la séance ».
Une image différente par séance, jamais répétée ailleurs.

| # | Fichier | Séance | Action / pose | Fond |
|---|---|---|---|---|
| 1 | `seance-pecs.png` | Pecs maison sans matériel | Pompes : corps gainé en diagonale, bras tendus en haut du mouvement, visage concentré, petites gouttes de sueur, pectoraux exagérés | noir doux + halo lime |
| 2 | `seance-jambes.png` | Jambes explosives | Squat profond avec barre sur les épaules (ou ballon lesté), cuisses énormes caricaturées, grimace d'effort | vert lime plein |
| 3 | `seance-cardio.png` | Cardio brûle-graisse 5h | Course en pleine foulée, vue de profil, bras pliés, lignes de vitesse derrière, petit soleil levant en arrière-plan | vert foncé → lime |
| 4 | `seance-abdos.png` | Abdos béton 10 min | Crunch allongé sur un tapis : buste relevé, mains derrière la tête, tablettes de chocolat très marquées | vert lime plein |
| 5 | `seance-hiit.png` | HIIT Terrain | Jumping jack en l'air : bras levés, jambes écartées, onde de choc sous les pieds, expression explosive | noir doux + éclats lime |
| 6 | `seance-fullbody.png` | Full body starter | Développé épaules : un haltère dans chaque main au-dessus de la tête, jambes stables, grand sourire | anthracite + halo vert |

Prompt type : `<bloc de style>` + `Action: <colonne Action / pose>`.

---

## 3. Accueil, onboarding et compte — 5 images (OBLIGATOIRES)

| # | Fichier | Où | Action / pose | Format final |
|---|---|---|---|---|
| 7 | `accueil-rang.png` | Carte « Rang de saison » (haut de l'accueil, grande carte 4:5 avec panneau de stats par-dessus) | Athlète en position de sprinteur au départ, ou mi-course sur piste d'athlétisme stylisée, regard vers l'horizon ; **laisser le tiers bas vide** (un panneau y est posé) | 4:5 |
| 8 | `onboarding-coach.png` | Slide 1 de l'accueil : le coach | Coach (homme ou femme, plus mûr, polo sombre, sifflet) donne une consigne à un athlète : pouce levé, geste d'encouragement | 4:5 |
| 9 | `onboarding-equipe.png` | Slide 2 : l'équipe / les amis | 3 amis qui courent côte à côte, mains qui se tapent, sourires | 4:5 |
| 10 | `onboarding-action.png` | Slide 3 : l'action | Basketteur qui claque un dunk, une jambe repliée, ballon au-dessus du panier stylisé | 4:5 |
| 11 | `compte-auth.png` | Écran « Créer mon compte » (bandeau en haut) | Athlète sur la ligne de départ d'une piste, bras croisés, prêt ; fond de couloirs de piste stylisés | 5:4 |

---

## 4. Terrains & matchs (Santé) et Raids — 5 images (OBLIGATOIRES)

| # | Fichier | Où | Action / pose | Format final |
|---|---|---|---|---|
| 12 | `terrain-bandeau.png` | Bandeau « Terrains & Santé » (haut de l'écran) | Joueur de foot qui frappe un ballon, vue 3/4, projecteurs de stade de nuit stylisés | 2:1 |
| 13 | `terrain-foot.png` | Cartes des matchs de foot (7v7, 5v5) | Gros plan sur des crampons et un ballon au moment de la frappe, gazon qui vole | 2:1 |
| 14 | `terrain-basket.png` | Cartes des matchs de basket 3v3 | Basketteur qui dribble bas, ballon orange (braise), regard défensif | 2:1 |
| 15 | `raids.png` | Écran Raids & Pactes (cartes d'équipe) | 4 coureurs en formation en V, mains liées ou poings levés, esprit d'escouade | 2:1 |
| 16 | `terrain-mvp.png` | Vote MVP / bilan du match | Joueur qui lève un trophée doré au-dessus de la tête, confettis lime | 1:1 |

---

## 5. Salle de sport (Gym Buddy) et Défi House — 5 images (OBLIGATOIRES)

| # | Fichier | Où | Action / pose | Format final |
|---|---|---|---|---|
| 17 | `gym-duo.png` | Onglet « Duo Live » | Deux athlètes face à face qui font des curls avec haltères en miroir, complicité | 2:1 |
| 18 | `gym-spot-1.png` | Onglet « Spot Me » (version 1) | Athlète au développé couché, un partenaire derrière la tête qui assure (« spotter »), bras tendus vers la barre | 2:1 |
| 19 | `gym-spot-2.png` | Onglet « Spot Me » (version 2, alterne à chaque visite) | Râtelier d'haltères avec un athlète qui en saisit un, regard fier | 2:1 |
| 20 | `house-duel-1.png` | Fond de scène du Défi House (caméra IA) | Deux boxeurs / athlètes face à face, poings levés, étincelles lime entre eux (duel) | 4:5 |
| 21 | `house-duel-2.png` | Défi House, version 2 (alterne) | Athlète en position de pompes contre un adversaire en ombre, chrono stylisé | 4:5 |

---

## 6. Démos d'exercices — 8 images « poster » (OBLIGATOIRES)

Une image par exercice, affichée avant la lecture de la vidéo/GIF et en secours si la vidéo ne charge pas.
Ce sont aussi les poses de départ si tu fais des vidéos animées (boucle 3–4 s, 720 × 720, fond de la même couleur).

| # | Fichier | Exercice | Pose à montrer |
|---|---|---|---|
| 22 | `exo-pompes.png` | Pompes classiques | En bas du mouvement, poitrine proche du sol, corps aligné, vue de profil |
| 23 | `exo-pompes-tempo.png` | Pompes tempo 3-1-3 | À mi-hauteur, bras à 90°, avec un petit chronomètre « 3 » stylisé sans texte lisible |
| 24 | `exo-squats.png` | Squats | Position basse, cuisses parallèles au sol, bras tendus devant, dos droit, vue de profil |
| 25 | `exo-squat-iso.png` | Squat isométrique | Assis contre un mur invisible, cuisses à 90°, bras croisés, grimace de tenue |
| 26 | `exo-gainage.png` | Gainage latéral | Planche latérale sur un avant-bras, hanches hautes, bras libre vers le ciel |
| 27 | `exo-jumping-jacks.png` | Jumping jacks | En l'air, bras et jambes écartés en étoile |
| 28 | `exo-corde.png` | Corde à sauter | En l'air, corde au-dessus de la tête qui forme une boucle, pieds joints |
| 29 | `exo-burpees.png` | Burpees | Position de planche basse avec les jambes en arrière juste avant le saut (ou saut final bras levés) |

---

## 7. Objectifs de l'onboarding — 5 images (RECOMMANDÉES)

Illustrent les 5 objectifs proposés au choix du profil (format carré 1:1 pour des cartes de choix).

| # | Fichier | Objectif | Action / pose |
|---|---|---|---|
| 30 | `objectif-perte.png` | Perte de poids | Athlète qui tient un pantalon devenu trop grand, grand sourire, ceinture serrée |
| 31 | `objectif-muscle.png` | Prise de muscle | Athlète qui fait une pose de bodybuilder (double biceps), muscles exagérés |
| 32 | `objectif-endurance.png` | Endurance & Missions 5h | Coureur à l'aube avec lampe frontale, montre au poignet, soleil qui se lève |
| 33 | `objectif-foot.png` | Prépa Foot / La Santé | Joueur qui jongle avec un ballon, genou levé, énergie explosive |
| 34 | `objectif-forme.png` | Remise en forme | Athlète qui s'étire les bras au-dessus de la tête, détendu, sourire serein |

---

## 8. Nutrition — 5 images (OBLIGATOIRES : 1 bandeau + 4 repas)

Style « 3D caricature » aussi pour les plats (assiettes rondes, aliments gonflés et brillants, personnage facultatif).

| # | Fichier | Où | Contenu |
|---|---|---|---|
| 35 | `nutrition-bandeau.png` | Bandeau de l'écran Nutrition (2:1) | Athlète qui tient un bol coloré de légumes/protéines, fond vert foncé |
| 36 | `repas-petit-dej.png` | Petit-déjeuner | Œufs, flocons d'avoine, banane, verre de lait, ambiance matin dorée |
| 37 | `repas-dejeuner.png` | Déjeuner | Poulet grillé, riz, légumes verts dans une assiette ronde |
| 38 | `repas-collation.png` | Collation | Yaourt grec, fruits rouges, poignée d'amandes ; ou shaker protéiné |
| 39 | `repas-diner.png` | Dîner | Poisson, patate douce, brocoli, éclairage plus chaud et sombre |

Option : 8 repas supplémentaires distincts (le plan « Force » et le plan « Terrain » utilisent aujourd'hui les mêmes
4 images). Dis-moi si tu veux la liste détaillée.

---

## 9. Missions Outdoor — 8 images (RECOMMANDÉES)

Illustrent les modes de l'écran Outdoor (format carré 1:1, carte de choix).

| # | Fichier | Mode | Action / pose |
|---|---|---|---|
| 40 | `outdoor-course.png` | Course | Coureur en foulée, lunettes de sport, vue de 3/4 |
| 41 | `outdoor-marche.png` | Marche | Marcheur dynamique en marche rapide, bâtons ou sac léger, bras balancés |
| 42 | `outdoor-velo.png` | Vélo | Cycliste en danseuse, casque lime, roues avec traînée de vitesse |
| 43 | `mission-5h.png` | Mission 05h | Coureur sous un ciel nocturne qui s'éclaircit, lampe frontale, lune encore visible |
| 44 | `mission-survie.png` | Survie Checkpoint | Coureur qui franchit une porte-balise lumineuse (checkpoint), chrono lime flottant |
| 45 | `mission-relais.png` | Relais Escouade | Passage de témoin entre deux coureurs, bâton lime |
| 46 | `mission-territoire.png` | Conquête Territoire | Athlète qui plante un drapeau lime sur une zone d'une carte stylisée en relief |
| 47 | `mission-fantome.png` | Duel Fantôme | Coureur poursuivi par sa propre silhouette translucide (fantôme), effet halo |

---

## 10. Coachs et avatars — 7 images (RECOMMANDÉES)

| # | Fichier | Où | Action / pose |
|---|---|---|---|
| 48 | `coach-ibrahim.png` | Profil « Coach Ibrahim D. » (grand portrait 4:5, demi-corps) | Homme d'environ 40 ans, barbe courte, polo sombre, bras croisés, sourire rassurant |
| 49 | `coach-melissa.png` | Profil « Coach Mélissa K. » | Femme athlétique, queue-de-cheval, chronomètre autour du cou, poing fermé motivant |
| 50 | `coach-yannick.png` | Profil « Coach Yannick T. » | Homme costaud, casquette, sifflet, doigt pointé vers la caméra (« à toi ! ») |
| 51 | `avatar-paladin.png` | Avatar profil (aujourd'hui `fantasy-paladin.jpg`) | Guerrier en armure légère et cape, épée plantée au sol |
| 52 | `avatar-shadow.png` | Avatar (aujourd'hui `fantasy-shadow.jpg`) | Ninja / assassin à capuche, deux lames, posture furtive |
| 53 | `avatar-fighter.png` | Avatar (aujourd'hui `manga-fighter.jpg`) | Combattant style manga en garde de boxe, bandeau, aura lime |
| 54 | `avatar-sprint.png` | Avatar (aujourd'hui `manga-sprint.jpg`) | Sprinteur style manga en pleine accélération, mèches au vent |

Avatars : portrait carré 1:1, visage et épaules bien lisibles (affichés très petits dans les listes).

---

## 11. Marque et partage — 3 images (OPTIONNELLES)

| # | Fichier | Où | Contenu |
|---|---|---|---|
| 55 | `icone-app.png` | Icône d'app (1024 × 1024, carrés arrondis sans transparence) | Haltère ou silhouette d'athlète minimaliste sur fond lime `#C8FF00`, pas de texte |
| 56 | `ecran-demarrage.png` | Écran d'accueil / chargement (4:5) | Personnage DEK en pose de héros, fond noir doux + halo lime ; **laisser de la place pour le logo** |
| 57 | `partage.png` | Aperçu quand on partage l'app (1200 × 630) | Trio d'athlètes en action (course, squat, pompes), fond sombre + lime |

---

## 12. Récapitulatif

| Groupe | Images | Priorité |
|---|---|---|
| Séances guidées | 6 | Obligatoire |
| Accueil / onboarding / compte | 5 | Obligatoire |
| Terrains, matchs, raids | 5 | Obligatoire |
| Gym Buddy et Défi House | 5 | Obligatoire |
| Démos d'exercices (posters) | 8 | Obligatoire |
| Nutrition | 5 | Obligatoire |
| **Sous-total obligatoire** | **34** (6 déjà reçues, 28 restantes) | |
| Objectifs onboarding | 5 | Recommandé |
| Missions Outdoor | 8 | Recommandé |
| Coachs et avatars | 7 | Recommandé |
| Marque et partage | 3 | Optionnel |
| **Total complet** | **57** | |

Pas besoin d'image pour : les icônes (déjà vectorielles), les emblèmes de rang et trophées (vectoriels), la carte
(MapLibre), les graphiques d'activité, et les démos « bonne/mauvaise posture » (animées en SVG dans l'app).

## 13. Ce que je ferai à la réception

1. Je recadre chaque image dans les formats nécessaires (4:5, 5:4, 2:1, 1:1) et je les compresse (JPG/WebP léger).
2. Je supprime les anciennes photos et mascottes SVG, et je branche chaque image à sa place (une image = un endroit).
3. Si tu fournis des fonds transparents, je peux changer la couleur de fond depuis le code (vert, noir, dégradé).
4. Pour les vidéos d'exercices : dépose-les dans `videos-source/`, ffmpeg est installé, je les convertis en MP4 léger
   avec image de poster.

## Emplacements prêts (visuel provisoire)
Les cartes d'objectifs de l'onboarding (section 7) utilisent `Slot3D` : tant que l'image n'existe pas, un visuel provisoire
(dégradé + icône) s'affiche ; dès que `public/images/3d/objectif-<id>.jpg` existe, il le remplace. Identifiants :
`objectif-perte_poids`, `objectif-prise_muscle`, `objectif-endurance_5am`, `objectif-foot_sante`, `objectif-remise_forme`.

### Disciplines de « Terrains & Santé » (visuel provisoire déjà en place)
Bannière 2:1 par discipline, à déposer dans `public/images/3d/` : `sport-volley.jpg`, `sport-hand.jpg`, `sport-padel.jpg`,
`sport-natation.jpg`, `sport-boxe.jpg`, `sport-yoga.jpg` (le foot et le basket gardent leurs photos). Actions : smash au filet,
tir en suspension, volée au padel, crawl dans un bassin, enchaînement de boxe sur sac, posture de yoga au lever du jour.

Autres disciplines (même principe, bannières 2:1 dans `public/images/3d/`) : `sport-danse.jpg` (pas de danse afro), `sport-zumba.jpg`,
`sport-tabata.jpg` (fente sautée chronomètre en main), `sport-crossfit.jpg` (soulevé de barre), `sport-spinning.jpg`,
`sport-street.jpg` (traction aux barres), `sport-pilates.jpg` (gainage sur tapis).

## État au 27/11 : les 57 images sont reçues et intégrées
Sources dans `images-source/` (noms du document) ; l'import se fait avec le script de la session vers `public/images/3d/`.
**Attention : les 51 nouvelles sources font 250 × 199 px** (elles viennent de planches d'aperçu). L'app les agrandit en douceur,
ce qui suffit sur téléphone mais reste un peu flou sur les grandes bannières. Pour une netteté parfaite, dépose les versions
d'origine (≥ 1024 px de large) avec les mêmes noms et je régénère. Les 6 images de séances sont restées en haute définition.

Où elles servent : accueil (rang de saison), compte et onboarding (coach, équipe, action), terrains (bandeau, foot, basket, MVP),
raids, Gym Buddy (duo, spot 1 et 2), Défi House (duel 1 et 2), tournoi et bonus, missions et Outdoor (course, marche, vélo,
5h, fantôme, relais, survie, territoire), nutrition (bandeau et 4 repas), objectifs, portraits des 3 coachs, avatars,
posters d'exercices (6 sur 8), écran de démarrage, icône d'application et image de partage.
Pas encore utilisées : `exo-pompes-tempo`, `exo-squat-iso`, `bonus-shaker`, `repas-*` doublon, les 13 bannières `sport-*` (à générer).

Mise à jour : les 51 images de 250 px ont été agrandies x4 par IA locale (Real-ESRGAN anime 6B), puis importées en 1000 px de large.
C'est bien plus net, mais l'IA lisse un peu les détails : des originaux en grande taille restent préférables si tu les as.

Street (sport en groupe dans la rue) : `sport-street-fitness.jpg` (circuit de groupe sur un boulevard), `sport-street-dance.jpg`,
`sport-run-crew.jpg` (groupe qui court dans une rue), `sport-parkour.jpg` (saut de muret). Même format 2:1.
