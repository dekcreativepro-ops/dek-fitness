# DEK FITNESS — Application Mobile Sport Social Gamifié

Application mobile-first (**React 19 + TypeScript + Vite + Tailwind CSS v4 + MapLibre 3D + MediaPipe IA**) regroupant **5 univers sportifs**, un **Test d'Initiation santé sans quota**, un module **Nutrition**, des **Coachs**, un **Studio Avatars Manga/Fantaisie** et un **Réseau Social sportif**.

---

## Continuer ce projet avec n'importe quelle IA

Ce dépôt est prêt pour être repris immédiatement par n'importe quelle IA (Antigravity, Claude, ChatGPT, Gemini, Cursor, etc.) à partir de son lien GitHub :

1. **Guide complet de reprise IA (stack, pièges, carte des fichiers, roadmap)** : [`AI_HANDOFF.md`](./AI_HANDOFF.md)
2. **Architecture logique & technique des 5 univers (SQL/PostGIS, WebSockets, APK)** : [`ARCHITECTURE_DEK_FITNESS.md`](./ARCHITECTURE_DEK_FITNESS.md)
3. **Archive ZIP prête à télécharger (sans `node_modules`)** : [`dek-fitness-project.zip`](./dek-fitness-project.zip)

### Prompt rapide à coller dans une autre IA avec ce lien

```text
Analyse ce dépôt GitHub DEK FITNESS en lisant en priorité AI_HANDOFF.md et ARCHITECTURE_DEK_FITNESS.md.
Réponds en français et respecte toutes les règles techniques du projet (PhoneSimulatorFrame sans position: fixed, MapLibre v6, DekIcons).
Je veux continuer le projet sur : [précise ici : tests mobile / backend Supabase / génération APK Capacitor / nouvelle fonctionnalité].
```

---

## Les 5 Univers de Jeux inclus

1. **Outdoor & Checkpoints (`Outdoor`)** : 3 disciplines (`Course`, `Marche`, `Vélo`) × 5 modes sur carte 3D MapLibre (`Mission 05h`, `Survie Checkpoint`, `Relais Escouade`, `Conquête Territoire`, `Duel Fantôme`).
2. **Terrains du Jeudi, La Santé & Tournois (`Réseau → Jeudi & Santé`)** : workflow complet en 4 phases (`Équipes/Caisse/Remplaçants` → `Check-in QR/GPS` → `Match Live & Roi du Terrain` → `Double Validation Capitaines & Vote MVP`), matchs La Santé et Tournoi (Poules + Tableau + Top Buteurs).
3. **Défi House IA (`Arène → Défi House IA`)** : 4 modes (`1v1 K.O. 60s`, `1er à 20`, `Survie`, `Équipe 4v4`) et 6 exercices avec démos GIF HD (`Pompes`, `Squats`, `Jacks`, `Corde`, `Gainage`, `Burpees`) + suivi squelette caméra MediaPipe.
4. **Gym Buddy (`Arène → Gym Buddy`)** : check-in salle/street & appels `Spot Me`, séances `Duo Live` avec chrono de repos synchronisé, et entraide `Form Check`.
5. **Raids Week-end & Pactes Amis (`Réseau → Raids & Pactes`)** : Check-in QR sur les raids pour débloquer des badges, et pactes hebdomadaires entre amis avec bouton de relance.

---

## Lancer en local

```bash
npm install
npm run dev -- --port 5173 --host
```

Build de production :

```bash
npm run build
```

Ouvrir ensuite **http://localhost:5173** dans le navigateur (simulateur smartphone intégré sur PC, plein écran natif sur mobile).
