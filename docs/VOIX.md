# Voix de jeu (annonceur gamer)

L'app annonce des phrases courtes en anglais pendant les jeux (Défi House, Gym Buddy). Elle utilise la voix du téléphone
par défaut : voix masculine, voix féminine pour les joueuses (profil corporel « femme »), ton plus grave en mode à fond.
Le réglage « Voix de jeu » (réglages du jeu) la coupe ; le bouton « Son » général coupe tout.

## Remplacer par des voix de studio (la meilleure qualité)

Génère les phrases avec un outil de voix IA (voix gamer grave pour `male`, voix énergique pour `female`) et dépose les fichiers
dans `public/voices/male/` et `public/voices/female/`, avec exactement ces noms (MP3). Si un fichier existe, l'app le joue ;
sinon elle retombe sur la voix du téléphone. Aucun changement de code nécessaire.

| Fichier | Phrase | Quand |
|---|---|---|
| `welcome.mp3` | Welcome to Gym Building! | Ouverture de Gym Buddy (une fois par session) |
| `spot.mp3` | Spot me! Do your lift! | Rejoindre un appel Spot Me |
| `lift.mp3` | Rest over. Do your lift! | Fin du repos en duo |
| `go.mp3` | Let's go! | Série validée |
| `beast.mp3` | Workout complete. Beast mode! | Séance duo clôturée |
| `fight.mp3` | Round one. Fight! | Début d'un duel Défi House |
| `challenge.mp3` | Challenge accepted! | Début d'un défi du Tournoi |
| `victory.mp3` | Victory! Flawless. | Victoire |
| `title.mp3` | New champion! | Titre du Tournoi conquis |
| `defeat.mp3` | Defeat. Get up and try again. | Défaite |
| `bonus.mp3` | Bonus unlocked! | Bonus chrono réussi |
| `almost.mp3` | Almost there! Finish him! | Victoire proche |
| `half.mp3` | Halfway! Push harder! | Mi-parcours (coach) |
| `ten.mp3` | Ten seconds! Give everything! | 10 dernières secondes (coach) |
| `rhythm.mp3` | Perfect rhythm! | Bonus de rythme |
| `speed.mp3` | Speed combo! | Bonus de rapidité |
| `bonusAhead.mp3` | Bonus ahead! | Outdoor : un bonus approche |
| `mission.mp3` | Mission start. Go, go, go! | Outdoor : départ de la course |
| `final.mp3` | Final stretch! Finish strong! | Outdoor : approche de l arrivée |
| `complete.mp3` | Mission complete! | Outdoor : mission réussie |

Les phrases sont définies dans `src/utils/gameVoice.ts` (`VOICE_LINES`) : on peut les changer sans toucher au reste.

## État : synthèse vocale coupée
La voix de synthèse du téléphone sonnait robotique : elle est désactivée (`SYNTH_VOICE = false` dans `src/utils/gameVoice.ts`).
L'annonceur ne joue plus que les MP3 de studio ci-dessus ; sans fichier, il reste silencieux. Le coach affiche ses conseils par écrit.
