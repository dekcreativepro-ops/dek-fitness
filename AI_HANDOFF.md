# DEK FITNESS — Guide de Reprise Complet pour IA (`AI_HANDOFF.md`)

> **Note à l'IA qui reprend ce projet** :
> Tu reprends le développement de **DEK FITNESS**, une application mobile-first (React + Vite + TypeScript + Tailwind CSS v4, prévue pour être empaquetée en **APK Android via Capacitor**) de **sport social gamifié** organisée autour de **5 univers de jeux**, d'un **Test d'Initiation santé sans quota**, d'un module **Nutrition**, de **Coachs**, d'un **Studio Avatars Manga/Fantaisie** et d'un **Réseau Social sportif**.
>
> - **Langue obligatoire avec l'utilisateur** : **Français**.
> - **Architecture détaillée des règles métier, SQL/PostGIS & WebSockets** : voir [`ARCHITECTURE_DEK_FITNESS.md`](./ARCHITECTURE_DEK_FITNESS.md).
> - **Archive complète téléchargeable** : [`dek-fitness-project.zip`](./dek-fitness-project.zip) (sources + médias locaux, sans `node_modules` ni `dist`).

---

## 1. Démarrage Rapide (Local)

```bash
npm install
npm run dev -- --port 5173 --host
```

Vérification TypeScript + Build production :
```bash
npm run build   # exécute : tsc -b && vite build
npm run lint    # exécute : oxlint
```

Pour tester sur un téléphone Android relié en USB (avec `scrcpy` + `adb`) :
```bash
adb reverse tcp:5173 tcp:5173
# Puis ouvrir http://localhost:5173 sur le téléphone ou lancer scrcpy
```

---

## 2. Stack Technique Exacte

| Couche | Technologies & versions (`package.json`) |
|---|---|
| Core UI | `react` `^19.3.1`, `react-dom` `^19.3.1`, `typescript` `~7.0.2`, `vite` `^8.3.6` |
| Styles & Animations | `tailwindcss` `^4.3.5`, `@tailwindcss/vite` `^4.3.5`, `framer-motion` `^14.14.0` |
| Carte 3D Outdoor | `maplibre-gl` `^6.19.0` (style sombre gratuit OpenFreeMap) |
| Vision IA Caméra | `@mediapipe/tasks-vision` `^1.2.3` (`PoseLandmarker` pour squelette + comptage reps) |
| Avatars Custom | `@dicebear/core`, `@dicebear/lorelei`, `@dicebear/adventurer`, `@dicebear/bottts` (`^9.2.2`) |
| Icônes Duotone | `lucide-react` `^1.80.0` encapsulé dans `src/components/DekIcons.tsx` |
| Audio FX | Web Audio API pur (`src/utils/soundFx.ts` — aucun fichier MP3 externe requis) |
| Linter | `oxlint` `^1.90.0` |

---

## 3. Règles Techniques CRITIQUES & Pièges à Éviter

> **À lire absolument avant toute modification du code :**

1. **Confinement Simulateur Téléphone (`PhoneSimulatorFrame.tsx`)** :
   - Sur desktop (`>= 768px`), l'application s'affiche dans un châssis smartphone réaliste ; sur vrai mobile (`< 768px`), elle occupe `h-[100dvh]`.
   - **NE JAMAIS utiliser `position: fixed`** dans les vues internes (sinon les modales/headers sortent du cadre téléphone).
   - Toujours structurer avec `flex`, `shrink-0`, `min-h-0 flex-1` et utiliser un portail React vers `#dek-overlay-root` (`createPortal(..., document.getElementById('dek-overlay-root'))`) avec `absolute inset-0 pointer-events-auto` pour les Bottom Sheets et overlays.

2. **MapLibre GL JS v6.19 (`MissionsView.tsx`)** :
   - **Pas d'export par défaut** : toujours écrire `import * as maplibregl from 'maplibre-gl';`.
   - Les coordonnées MapLibre sont **`[lng, lat]`** (attention : `src/utils/routeGenerator.ts` génère des points `[lat, lng]`, donc toujours inverser lors du passage à MapLibre).
   - Ne pas annoter avec `GeoJSON.Feature` (le namespace global n'est pas installé sans `@types/geojson`) : utiliser des littéraux typés `as const`.
   - Style de carte gratuit vérifié : `'https://tiles.openfreemap.org/styles/dark'`.
   - Conserver un `ResizeObserver` appelant `map.resize()`.

3. **Dépendances interdites sous Windows (piège `npm install`)** :
   - **NE PAS installer `@phosphor-icons/react` ni `@dicebear/collection`** : ils contiennent des dizaines de milliers de petits fichiers qui bloquent `npm install` sous Windows Defender.
   - Pour toute nouvelle icône, ajouter un wrapper duotone dans `src/components/DekIcons.tsx` à partir de `lucide-react`.
   - Pour DiceBear, utiliser uniquement les 3 styles déjà installés (`lorelei`, `adventurer`, `bottts`) via `.toDataUri()` (pas de `dangerouslySetInnerHTML`).

4. **Assets locaux vérifiés (`public/`)** :
   - Avatars illustrés : `public/avatars/{manga-sprint,manga-fighter,fantasy-paladin,fantasy-shadow}.jpg` (**extension `.jpg`**).
   - Bannières & repas : `public/images/{banner-home,banner-house,banner-nutrition,banner-sante,banner-coach,meal-breakfast,meal-lunch,meal-snack,meal-dinner}.jpg` (**extension `.jpg`**).
   - Démos exercices HD animées : `public/demos/{pompes,squats,gainage,jumping_jacks,corde,burpees}.gif` (**extension `.gif`**).

5. **Persistance `localStorage`** :
   - Clé actuelle : `dek_fitness_user_v3` dans `src/App.tsx`.
   - Si tu ajoutes un nouveau champ à `UserProfile` (`src/types/dek.ts`), pense à mettre une valeur par défaut dans `INITIAL_USER` (`src/data/mockData.ts`) ET dans `loadSavedUser()` (`src/App.tsx`) pour ne pas casser les comptes existants.

6. **Règles métier Santé & Équité** :
   - Le **Test d'Initiation** est obligatoire à la première connexion et **sans quota minimum** (sécurité santé).
   - Catégories officielles : `Amateur` → `Standard` → `Pro` → `Expert` (avec plafond cardio-vasculaire).
   - Les paliers supérieurs sont verrouillés jusqu'à **2 missions réussies** dans le palier courant ou un nouveau test.

---

## 4. Design System & Identité Visuelle

- **Fond principal** : `#080A0E` (Obsidian Dark)
- **Cartes / Surfaces** : `#11151D` / `#0B0E14`, bordures `border-white/10`
- **Accent principal (Action / Succès)** : `#C8FF00` (Electric Volt Lime)
- **Accent secondaire (Tech / GPS / Duo)** : `#00E5FF` (Neon Cyan)
- **Accent Combat / Alerte / Élimination** : `#FF2E54` (Crimson Pulse)
- **Accent Survie / Raid / Série** : `#FF8A00` / `#F59E0B`
- **Typographie HUD** : classe utilitaire `.font-hud` définie dans `src/index.css`
- **Ergonomie** : écrans mobiles aérés, contrôles accessibles au pouce, transitions fluides Framer Motion (`layoutId` pour tous les onglets/pilules).

---

## 5. Cartographie Complète du Code (`src/`)

### Point d'entrée & Navigation
- `src/App.tsx` : Orchestrateur principal (Splash screen, Auth → Test d'Initiation → App principale 5 onglets : `Accueil`, `Outdoor`, `Arène`, `Nutrition`, `Réseau`), persistance `localStorage`, gestion XP / Discipline / Badges / Feed / Toasts, `#dek-overlay-root`.
- `src/components/PhoneSimulatorFrame.tsx` : Cadre smartphone desktop + plein écran mobile natif.
- `src/components/HomeView.tsx` : Dashboard Accueil (Hero bannière, carte **Prochain Terrain du Jeudi • 19h00**, grille rapide `3×2` vers les 5 univers + Nutrition, progression semaine, coach recommandé).

### Parcours Entrée, Avatars & Santé
- `src/components/OnboardingAuthView.tsx` : Création de compte (Gmail / WhatsApp / Email), studio avatar intégré, engagement santé obligatoire.
- `src/components/InitiationTestView.tsx` : Registre d'objectifs, sélection musculaire, 3 tests sans quota avec démos GIF HD, calcul de catégorie.
- `src/components/TargetMuscleSelector.tsx` : Silhouette anatomique interactive face/dos pour choisir les groupes musculaires.
- `src/components/AvatarStudio.tsx` & `src/components/UserAvatar.tsx` : Sélection d'avatars Manga/Fantaisie ou générateur DiceBear personnalisé (style, graine, fond, aura).
- `src/utils/categorization.ts` : Algorithme de catégorisation santé (`Amateur..Expert`), couleurs de paliers, calibrage des adversaires IA.

### Les 5 Univers de Jeux
- **Univers 1 — Outdoor (`src/components/MissionsView.tsx`)** :
  - Carte 3D MapLibre + générateur d'itinéraires (`src/utils/routeGenerator.ts`).
  - 3 disciplines (`Course`, `Marche`, `Vélo`) × 5 modes (`Mission 05h`, `Survie Checkpoint` 4 CP chronométrés + Sprint, `Relais Escouade` 4 coureurs, `Conquête Territoire` 4 quartiers, `Duel Fantôme`).
- **Univers 2 — Terrains du Jeudi, La Santé & Tournois (`src/components/SanteView.tsx`)** :
  - `Jeudi Live` en 4 phases cliquables : `1. Équipes & Caisse & Remplaçants` → `2. Check-in QR/GPS & Anti-absence (-5% Disc.)` → `3. Match Live, Buteurs & Rotation Roi du Terrain (Vainqueur reste)` → `4. Double validation Capitaines, Vote MVP & Publication`.
  - `Matchs` (liste La Santé + Bottom Sheet création) et `Tournoi` (Poules, tableau élimination directe `Quarts→Finale`, Top Buteurs).
- **Univers 3 — Défi House IA (`src/components/DefiHouseView.tsx` + `src/components/ExerciseDemoCanvas.tsx`)** :
  - 4 modes : `1v1 K.O. 60s`, `1er à 20`, `Survie` (jauge 4,5 s rechargée par rep), `Équipe 4v4` (`DEK Squad` vs `Iron Crew`).
  - 6 exercices avec démos GIF HD (`pompes`, `squats`, `jumping_jacks`, `corde`, `gainage`, `burpees`), détection pose MediaPipe + jauge `DEPTH`.
- **Univers 4 — Gym Buddy (`src/components/GymBuddyView.tsx` + `src/components/ArenaHubView.tsx`)** :
  - `Spot Me` (check-in salle/parc + publication/adhésion appels partenaires).
  - `Duo Live` (routines Salle & Street Workout + chrono de repos synchronisé `45s/60s/75s` avec bips sonores).
  - `Form Check` (demandes d'avis techniques + conseils en 1 tap).
- **Univers 5 — Raids Week-end & Pactes Amis (`src/components/RaidsPactsView.tsx`)** :
  - `Raids Week-end` (inscription + Check-in QR sur place débloquant badges & `+120 XP`).
  - `Pactes Amis` (barres hebdo collectives, validation `+1`, bouton `Réveiller` les retardataires, création via Bottom Sheet).

### Nutrition, Réseau, Coachs & Données
- `src/components/NutritionView.tsx` & `src/utils/programsAndNutrition.ts` : Programmes sur mesure selon objectifs, repas illustrés cochables (`+15 XP`), compteur d'hydratation.
- `src/components/NetworkHubView.tsx` : Hub 4 sous-onglets (`Jeudi & Santé`, `Raids & Pactes`, `Coachs`, `Profil`) + barre Stories actives.
- `src/components/CoachsView.tsx` : Catalogue coachs vérifiés + réservation.
- `src/components/ProfilFeedView.tsx` : Carte Athlète (XP, Discipline, **Badges débloqués**, Bilan Initiation, Éditeur Avatar) + Fil Social DEK + créateur de post.
- `src/types/dek.ts` : Tous les types TypeScript du domaine.
- `src/data/mockData.ts` & `src/data/gamesData.ts` : Données initiales réalistes de tous les univers.
- `src/components/DekIcons.tsx` : Bibliothèque centralisée d'icônes Duotone.
- `src/utils/soundFx.ts` : Effets sonores synthétisés (`playTick`, `playGo`, `playHit`, `playVictory`).

---

## 6. État Actuel & Feuille de Route (Prochaines Étapes)

### Déjà terminé et vérifié
- [x] Prototype complet mobile-first des **5 univers de jeux** + Onboarding + Test d'Initiation + Avatars + Nutrition + Coachs + Réseau Social.
- [x] Compilation TypeScript + build production Vite vérifiés sans erreur (`npm run build` → exit `0`).
- [x] Tous les médias locaux (`public/avatars/`, `public/images/`, `public/demos/`) présents et chargés en local.

### À faire pour la suite (ordre recommandé)
1. **Tests terrain & UX sur vrai smartphone** :
   - Brancher le téléphone Android, lancer `adb reverse tcp:5173 tcp:5173` + `scrcpy`, tester tous les parcours (en particulier la caméra MediaPipe dans `DefiHouseView.tsx` et la carte 3D dans `MissionsView.tsx`) et ajuster l'ergonomie selon les retours utilisateur.
2. **Backend Temps Réel (Supabase + PostGIS)** :
   - Implémenter les tables SQL/PostGIS et les 4 canaux WebSockets documentés dans [`ARCHITECTURE_DEK_FITNESS.md`](./ARCHITECTURE_DEK_FITNESS.md).
   - Remplacer les données locales (`mockData.ts` / `gamesData.ts` / `localStorage`) par des appels API/Realtime authentifiés (Google OAuth + OTP WhatsApp).
   - Ajouter la validation serveur anti-triche GPS (vitesse max par discipline) et QR codes signés pour les Terrains du Jeudi et les Raids.
3. **Packaging APK Android (Capacitor)** :
   - Ajouter `@capacitor/core`, `@capacitor/cli`, `@capacitor/android` + plugins natifs (`@capacitor/geolocation`, `@capacitor/camera`, `@capacitor/push-notifications`, `@capacitor/haptics`).
   - Configurer les permissions `AndroidManifest.xml` (caméra, localisation précise, notifications), générer et tester l'APK sur téléphone.
4. **Optimisation Performance** :
   - Mettre en place le code-splitting (`React.lazy` / `vite.config.ts`) pour séparer les gros chunks (`maplibre-gl` et `@mediapipe/tasks-vision`) et accélérer le chargement initial.

---

## 7. Prompt Prêt à Copier pour Continuer avec N'importe Quelle IA

```text
Lis les fichiers AI_HANDOFF.md et ARCHITECTURE_DEK_FITNESS.md de ce dépôt GitHub (DEK FITNESS).
Respecte strictement toutes les règles techniques indiquées (français uniquement, pas de position: fixed dans les vues, MapLibre v6 sans export par défaut, pas de @phosphor-icons/react).
Voici la prochaine étape que je veux développer maintenant : [décris ton objectif ici, ex: "Empaqueter l'app en APK Android avec Capacitor" ou "Connecter le backend Supabase pour les Terrains du Jeudi"].
```
