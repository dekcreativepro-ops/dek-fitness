# Suivi du projet DEK FITNESS : où on en est (à lire en premier)

> **Pour une IA qui reprend le projet** (autre session ou autre compte Claude) : lis ce fichier, puis `AI_HANDOFF.md` (règles techniques du code) et `docs/ECONOMIE-DEK.md` (modèle de prix). Parle **français** avec l'utilisateur. Dernière mise à jour : **28/11/2026**. Branche de travail : **`design/refonte-studio`** (dépôt `dekcreativepro-ops/dek-fitness`).

## 1. Le produit en une phrase
Application mobile de sport social (Cameroun, FCFA) : séances guidées, Outdoor (carte 3D, pistes, zones), Défi House (duels caméra IA), Gym Buddy, Terrains & Santé (matchs et tournois par discipline), coach IA, réseau social. React 19 + Vite + Tailwind + MapLibre, empaquetée en APK avec Capacitor. Le fondateur (pas développeur) pilote en français et valide chaque étape par « Oui, pousse ».

## 2. Ce qui est fait
**Application (front)** : refonte visuelle « Figma » (vert lime sur sombre, effets verre), images 3D (générées par le fondateur, agrandies par IA locale), carte Outdoor riche (zones NO RUN, médailles, guidage, recherche, bonus 30 s, vibration), Défi House (tournoi évolutif, bonus animaux), Gym Buddy, coach IA (nom, genre, style, coaching en direct), nombreuses disciplines dont Street sport, silhouette musculaire anatomique, personnalisation (photo d'accueil, image des matchs créés, couleur de l'app), **10 vidéos d'exercices** (voir §6) et 10 séances guidées, voix coupée (seules des voix de studio MP3 seront jouées, absentes pour l'instant).

**Mobile** : projets `android/` et `ios/` (Capacitor, identifiant `com.dek.fitness`). **Un APK de test a été compilé sur le PC du fondateur** (avant les comptes et le paiement réel : à recompiler). Voir `docs/APPLICATION-MOBILE.md`.

**Abonnement et économie** (nouveau, `docs/ECONOMIE-DEK.md`) :
- Abonnement **5 000 FCFA / 30 jours**, essai gratuit de **7 jours** (stocké dans le téléphone pour l'instant), puis version gratuite limitée : **3 pistes Outdoor, 3 séances, Défi House mode KO 60 s seulement, 5 questions de coach IA par jour** (`src/utils/premium.ts`).
- **La remise (0 à 50 %, prix minimum 2 500 FCFA) vient des bonus de performance additionnés sur 30 jours** (séance, 200 pompes, 3 pistes, duel, semaine parfaite, série de 7 jours, palier). **Les XP ne calculent pas le prix : ils sont la jauge.** Barème dans `server/economy.mjs` (`PERFORMANCES`).
- **Serveur** (`server/`, Node sans dépendance) : comptes (numéro + mot de passe), sessions, registre d'XP et de bonus calculés côté serveur avec quotas, prix remisé, abonnement activé uniquement par une confirmation de paiement, base JSON (`DEK_DB`). Tests : `npm run pay-test` (doivent tous passer).
- **Paiement via Chariow** (page de paiement hébergée, Orange Money et MTN Mobile Money confirmés pour le Cameroun, devise XAF). Chariow n'a pas de prélèvement récurrent : le client repaie chaque mois. Voir `docs/ABONNEMENT.md`.
- **Chariow, compte du fondateur** (boutique « DEK GROUPE », `store_jilg7dui9hmc`) : produit **« DEK Premium - abonnement mensuel » `prd_6jdmeofl`**, type licence, 30 jours, 5 000 FCFA (une promo à 2 500 y est saisie : **à retirer** quand les 6 produits par prix existeront) ; une **clé API** existe et est dans `.env.local` du PC du fondateur (**jamais dans git**, ne jamais la recopier ici).

## 3. Ce qui reste (ordre conseillé pour la bêta)
1. **Chariow** : créer les 5 produits manquants (**4 500 / 4 000 / 3 500 / 3 000 / 2 500 FCFA**, type licence, 30 jours), mettre le principal à 5 000 sans promo ; renseigner `CHARIOW_PRODUCT_IDS` (`{"5000":"prd_6jdmeofl","4500":"prd_…",…}`).
2. **Héberger le serveur** (guide `docs/DEPLOIEMENT.md`, `render.yaml` et `server/Dockerfile` prêts, **Dockerfile non testé**, Docker absent du PC) : compte Render à créer par le fondateur ; ensuite créer le **Pulse** Chariow (webhook `/webhook/chariow`, secret `whsec_…`) et lancer **un vrai paiement de test** (par exemple produit à 100 FCFA).
3. **Recompiler l'APK** avec `VITE_PAYMENT_API_URL=<adresse du serveur>` (guide dans `docs/APPLICATION-MOBILE.md`).
4. **Mot de passe oublié** (aujourd'hui aucune réinitialisation), **essai gratuit lié au compte** (réinstaller redonne l'essai de 7 jours), petit **panneau d'administration** (comptes, paiements, offrir un abonnement), **suivi des paliers côté serveur** (le bonus « palier » est déclaré par l'app : triche possible, 15 % maximum), **rapport d'erreurs**.
5. **Pages légales** (confidentialité, conditions, avertissement santé), **marquer « démo »** les données simulées (tournois, classements, matchs, fil, coachs : tout est factice).
6. **Tester sur de vrais téléphones Android** (GPS en mouvement, caméra Défi House, vibration, carte en paysage, vidéos) : **rien n'a été testé sur un appareil**.
7. Plus tard : **espace coaching** (coach : 1er mois gratuit puis 5 000 FCFA/mois ; le coach est payé **sur place** par ses élèves, rien dans l'app), **XP achetables** pour accéder à des tournois (solde séparé, jamais dans la remise, jamais retirable), rappels d'expiration, iOS (Mac + compte Apple Developer requis), 13 bannières de disciplines, voix de studio.

**Décisions en attente du fondateur** : essai gratuit : 7 jours (le fondateur a hésité entre 5, 7 et 10) ? quels paliers sont d'accès libre ? barème exact des bonus.

## 3 bis. Retours du fondateur après le premier test sur téléphone (28/11/2026)
Le fondateur a installé l'APK de test sur son téléphone. Ses remarques, dans l'ordre :

**Déjà traité**
- **Version déverrouillée** demandée pour tester tout l'abonnement : `scripts/build-apks.ps1` compile **deux** applications installables ensemble : `DEK-FITNESS-verrouille.apk` (`com.dek.fitness`, comme un vrai utilisateur) et `DEK-TEST-deverrouille.apk` (`com.dek.fitness.test`, nom « DEK TEST », tout ouvert, build avec `VITE_UNLOCKED=true`). Sans serveur, le paiement de la version verrouillée est **simulé** (mode démo).
- **Essai gratuit réduit de 15 à 7 jours** (« une semaine gratuite »).
- **Défi House** : seul l'exercice **Pompes** est gratuit ; squats, jumping jacks, corde, gainage et burpees demandent Premium (en plus du verrou des modes autres que KO 60 s).
- Il trouve que la **limitation des pistes Outdoor** est bien.

**À faire (rien n'est construit)**
1. **Images floues** : les images agrandies par IA (parties de sources très petites) donnent un rendu « bizarre ». Solution réelle : regénérer ou redemander les images en **haute résolution (1024 px ou plus)**, surtout les cartes de séance et les mascottes ; lister celles qui posent problème sur téléphone.
2. **Défis en attente (Défi House asynchrone)** : si personne n'est en ligne, un joueur **publie un défi** (« qui fait des pompes ? ») ; quand un autre ouvre l'application, il voit la **notification**, accepte, et le défi **se lance en synchronisé** pour les deux. Demande : serveur de défis (comptes déjà là), notifications push (Firebase Cloud Messaging), synchronisation en temps réel (WebSocket) ; version simple possible d'abord : duel **différé** (chacun fait son score, comparaison).
3. **Programmes et horaires** : les joueurs **planifient des défis à une date et une heure** ; ceux qui choisissent le même créneau peuvent le rejoindre. (Le fondateur a aussi dit « normalement on doit acheter les programmes » : **à clarifier**, programmes payants ou simple planning ?)
4. **Lieux de gym** : ajout des salles de sport par **un espace administrateur** (une fiche par salle).
5. **« Bio Live »** (probablement **« Match live »** de Terrains & Santé) : à **verrouiller derrière Premium**. À confirmer le nom exact avant de coder.
6. **Street workout / sport de rue en groupe** : « pas bien développé ». Le fondateur veut : un groupe de personnes se retrouve **dans la rue** et fait du sport ensemble. À construire : créer / rejoindre un groupe de rue, point de rendez-vous sur la carte, séance collective, progression et classement du groupe. (Les disciplines « Street » existent déjà dans Terrains & Santé, mais pas cette fonction de groupe.)

## 3 ter. Retours du fondateur, suite (28/11/2026) : à construire plus tard
Le fondateur a confirmé que le **rendu Street / week-end** convient. Nouvelles demandes, **rien n'est construit** :

1. **Images : très mauvaise impression sur téléphone** (« elles font peur »). Les originaux sont beaux, c'est l'**agrandissement par IA d'images trop petites** qui les abîme. Priorité haute : redemander / regénérer les images en haute résolution (1024 px ou plus) et **ne plus agrandir des sources minuscules** ; en attendant, mieux vaut un visuel net plus petit qu'un agrandissement flou. Lister les images concernées après un test sur téléphone.
2. **« Scan d'événements »** : un bouton qui **scanne tous les événements** (tournois, matchs, séances collectives, défis, sorties de rue, pas seulement les terrains) **programmés ou en cours**, et propose un **programme complet avec les horaires**. L'utilisateur qui n'a pas le temps de chercher voit ce qui lui plaît et **s'y inscrit à l'heure voulue**.
3. **Renommer « Match live »** (le nom est trop étroit : plusieurs familles de sports sont concernées) et **réorganiser l'onglet Réseau en 3 ou 4 interfaces** : *Terrains & Santé*, *Street fitness*, *Danse*, puis un onglet « Sport live » en bas. Même fonctionnement qu'aujourd'hui, avec **3 exemples** par interface ; le bouton **« Créer » devient « Sport select »** (ou un nom qui dit qu'on y choisit parmi plusieurs sports). **Mise en avant automatique** : plus une activité est programmée, plus elle apparaît en haut ; moins elle l'est, moins elle s'affiche. **3 bannières** pour ces mises en avant.
4. **Profil : niveaux (« levels »)** pour que les XP soient compris tout de suite : *Level 1 = 100 XP* (exemple de seuil), etc. Les XP existent déjà ; il faut les présenter en niveaux.
5. **Bouton « Prochaine étape »** : donne un **programme propre pour monter de niveau**. Quand l'utilisateur appuie sur « Let's go », il remplit chaque discipline comme prévu : il **programme les heures de chaque discipline** et reçoit **un quota et une limite** (par exemple à faire en une semaine ou en deux jours). Tout remonte dans la progression.

**Ordre conseillé** (après la bêta de paiement) : images nettes → niveaux dans le Profil (simple) → « Prochaine étape » → réorganisation Réseau → scan d'événements (demande un serveur d'événements) → défis en attente → groupes de rue.

## 4. Pièges et règles à connaître
- **Droit** : pas de retrait d'argent des XP, pas de pari (licence LONACAM), pas de séquestre : abandonné volontairement. Un concours avec prix en argent demande un juriste. Sur Google Play / App Store, l'abonnement doit passer par leur paiement intégré ; l'APK direct permet le Mobile Money.
- **Droit d'auteur** : les 10 vidéos d'exercices (`public/videos/exo/`) viennent d'une autre application (cartes « YOU CAN / App Store » retirées, mais « DEMIC » visible sur des vêtements). **À remplacer ou à faire autoriser avant toute publication.**
- `docs/PROMPTS-57-IMAGES.md` : fichier présent dans le dépôt, origine inconnue, jamais tranché.
- Le « mode démo » du paiement (sans `VITE_PAYMENT_API_URL`) simule un paiement réussi : **ne jamais l'activer en production**.
- Le projet est sensible au `position: fixed` (voir `AI_HANDOFF.md`).

## 5. Environnement du PC du fondateur (Windows)
- **Dossier du projet** (court, nécessaire à Gradle) : `C:\dekapp` (raccourci vers le vrai dossier de la session). Java 21 et Android SDK : `C:\dektools` (raccourci vers `C:\Users\DEK Creative Pro\dek-tools`, **le chemin avec espaces casse `sdkmanager`**). FFmpeg est installé (winget).
- **Compiler l'APK** : `$env:JAVA_HOME='C:\dektools\jdk21'; $env:ANDROID_HOME='C:\dektools\android-sdk'; cd C:\dekapp; npm run cap:sync; cd android; .\gradlew.bat assembleDebug` — à lancer **dans le terminal de l'utilisateur** (l'outil Bash en bac à sable bloque le réseau local de Java : « Unable to establish loopback connection »). Première compilation : environ 12 minutes. Résultat : `android\app\build\outputs\apk\debug\app-debug.apk`.
- **GitHub** : le push se fait **depuis le terminal de l'utilisateur** (compte `dekcreativepro-ops`) ; l'outil Bash de l'IA utilise un autre compte (erreur 403). **Le réseau IPv6 du PC bloque git** ; contournement : `git -c http.curloptResolve=github.com:443:140.82.112.3 push origin design/refonte-studio`. Le jeton a maintenant le droit « workflow » (les fichiers `.github/workflows/build-android.yml` et `build-ios.yml` sont poussés, **leur exécution sur GitHub n'a jamais été vérifiée**).
- **Commits** : `git -c user.name="DEK Creative Pro" -c user.email="dek.creative.pro@users.noreply.github.com" commit ...` avec la ligne `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- **Aperçu navigateur** : le panneau « Browser » de l'app Claude doit être **affiché** pour que les pages se chargent ; ouvrir un nouvel onglet avec `preview_start`. `localStorage` est propre à chaque port (5173 ≠ 5174).
- Scripts utiles : `npm run dev`, `npm run build`, `npm run lint`, `npm run pay-server`, `npm run pay-test`, `npm run cap:sync`.

## 6. Vidéos d'exercices (rappel)
10 vidéos du fondateur (compilations 3D de plusieurs exercices chacune) encodées dans `public/videos/exo/*.mp4` + affiche `.jpg`, branchées via `video` / `variants` dans `src/data/workoutsData.ts`, affichées par `src/components/workouts/ExerciseMedia.tsx` (fiche : cadre 4:5 avec fond flouté ; lecteur : plein cadre). 4 séances ont été ajoutées pour les utiliser. Pas découpées par exercice (il faudrait des repères de temps).

## 7. Préférences du fondateur (à respecter)
Réponses en français, courtes et concrètes ; il aime qu'on **fasse** plutôt qu'on demande (« fais-le toi-même ») ; il a rejeté : la voix robotique, la silhouette musculaire en blocs, les pièces de médaille qui bougent (seule la double flèche bouge), les photos sur les cartes (images 3D à la place). Il veut garder le contrôle du prix, des paliers et des bonus. Il consomme beaucoup de jetons : éviter les tests longs inutiles.
