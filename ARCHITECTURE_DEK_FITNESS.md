# DEK FITNESS — Architecture Logique & Technique des 5 Univers de Jeux

Ce document formalise l’organisation complète **de A à Z** de chaque jeu dans **DEK FITNESS**, ses règles de sécurité/équité, sa logique d’états et le modèle technique prêt pour le backend temps réel (PostgreSQL + PostGIS + WebSockets) et le packaging **APK Android (Capacitor)**.

---

## 1. Socle Transversal (Commun aux 5 Univers)

### 1.1 Parcours d’entrée & Sécurité Santé
1. **Authentification** : Gmail, WhatsApp (indicatif pays) ou Email + choix/création d’Avatar Manga/Fantaisie + **Engagement Santé obligatoire**.
2. **Registre d’Objectifs & Zones Musculaires** : 1 à 3 objectifs (*Perte de poids*, *Prise de muscle*, *Endurance 5h*, *Foot / La Santé*, *Remise en forme*) + sélection sur silhouette anatomique.
3. **Test d’Initiation sans quota** : 3 défis d’introduction (*Pompes*, *Squats*, *Gainage + Souffle*) sans minimum imposé → attribution de la **Catégorie officielle** (`Amateur`, `Standard`, `Pro`, `Expert`) avec **plafond cardio-vasculaire**.
4. **Verrouillage progressif** : les paliers supérieurs sont verrouillés pour protéger l’athlète et se débloquent après **2 missions réussies** dans son palier actuel ou via un **Test de montée de palier**.

### 1.2 Système de Réputation & Progression
* **Indice de Discipline (%)** : augmente à chaque session honorée à l’heure (`+1%`), diminue en cas de top départ manqué (`-2%`) ou d’absence non prévenue à un Terrain du Jeudi (`-5%`).
* **XP & Saisons** : chaque jeu alimente la barre d’XP de Saison, les rangs (*Recrue → Challenger → Pro → Élite → Légende DEK*) et le Fil Social certifié.
* **Badges d’événements** : débloqués via Check-in QR/GPS sur les Raids, conquêtes de territoires ou votes MVP du jeudi.

---

## 2. Logique Détaillée des 5 Univers de Jeux

### Univers 1 — Course & Cardio Outdoor (`Course`, `Marche`, `Vélo`)
Machine à états : `LOBBY → COUNTDOWN (5→1) → START_GATE (fenêtre stricte) → LIVE_RUN → COMPLETED | FAILED`

1. **Mission Synchronisée 05h00** : créneau fixe, boucle GPS 3D générée (OSRM/OpenStreetMap), mode *Global* ou *Proximité*, Salon Vocal ouvert à T-10 min. Départ manqué = **Mission Échouée**.
2. **Mode Survie « Checkpoint »** : parcours découpé en **4 Checkpoints** (`CP1..CP4`). Chaque checkpoint impose une fenêtre de temps (ex. 5 min). Si la distance du checkpoint n’est pas atteinte à temps → **Éliminé** en direct.
3. **Relais en Escouade (4 joueurs)** : le Joueur 1 court ; à son arrivée, une notification déclenche la fenêtre stricte du Joueur 2, puis 3 et 4. Si un seul échoue son départ, toute l’escouade rate la mission.
4. **Conquête de Territoire** : carte de la ville découpée en zones (quartiers/parcs). Chaque mission réussie dans une zone crédite `+150 pts` au Club du joueur ; le club leader contrôle la zone sur la carte.
5. **Contre-la-Montre & Fantôme** : double marqueur sur la carte 3D (Athlète + Fantôme du record) avec écart en mètres en temps réel.
* **Anti-triche** : contrôle vitesse max / cadence selon la discipline (`Course` < 24 km/h, `Marche` < 11 km/h, `Vélo` < 55 km/h) + continuité GPS.

### Univers 2 — Terrains Collectifs : « La Santé » du Jeudi & Tournois
Machine à états d’une Session du Jeudi : `OPEN_REGISTRATION → CHECKIN_QR_GPS → MATCH_LIVE → CLOSED_MVP`

1. **Phase 1 — Inscriptions, Équipes, Remplaçants & Caisse** :
   * Formats : **2 Équipes fixes (2×25 min)** ou **Roi du Terrain 3–4 Équipes « Vainqueur reste » (matchs de 8–10 min)**.
   * Équilibrage par catégorie DEK + **Liste d’attente automatique** (remplaçants).
   * **Suivi de Caisse / Cotisation** : statut *Payé ✓ / À régler* par joueur + total encaissé.
2. **Phase 2 — Avant-match & Check-in (T-15 min)** :
   * Validation présence par **Scan QR Code Capitaine** ou **Géolocalisation < 100 m**.
   * Absence non prévenue → `-5% Discipline` et promotion immédiate du 1er remplaçant.
3. **Phase 3 — Match Live & Rotations** :
   * Chrono officiel, score en direct, attribution des **Buteurs & Passeurs**.
   * En mode *Roi du Terrain* : à la fin du match, l’équipe gagnante reste (série de victoires incrémentée), la perdante passe en fin de file et l’équipe suivante entre.
4. **Phase 4 — Clôture & Après-match** :
   * **Double validation du score** par les deux capitaines (anti-litige).
   * **Vote MVP (Homme du Match)** parmi les présents (`+50 XP`) + publication automatique du bilan dans le Fil Social.
5. **Mode Tournoi** : Phases de **Poules** (Pts, J, Diff) + **Tableau à élimination directe** (Quarts, Demies, Finale) + Classement des buteurs.

### Univers 3 — Défi House (Combat Caméra IA)
Machine à états : `SETUP_DEMO → CALIBRATION → FIGHT_LIVE → KO_OR_VERDICT`
* **6 Exercices** : *Pompes*, *Squats*, *Jumping Jacks*, *Corde à sauter*, *Gainage*, *Burpees* (chacun avec sa **Démo GIF HD**).
* **4 Modes** :
  1. **1v1 KO (60s)** : barres de vie (HP), `-5 HP` par rep validée, combos.
  2. **Premier à 20** : course à 20 reps validées.
  3. **Survie Maison** : jauge de rythme qui se vide dès qu’on s’arrête ; chaque rep la recharge.
  4. **Équipe 4v4** : cumul en direct des reps de 4 coéquipiers contre 4 adversaires.
* **Anti-triche IA** : squelette MediaPipe + jauge verticale `DEPTH` qui ne valide que les amplitudes complètes. Matchmaking calibré à la catégorie de l’athlète (*à la régulière*).

### Univers 4 — Salle de Sport & Street Workout (« Gym Buddy »)
1. **Check-in Salle / Parc & Appel « Spot Me »** : voir qui s’entraîne dans sa salle/parc et publier un appel rapide par créneau/niveau.
2. **Séance en Duo Synchronisée** : routine partagée (séries, poids × reps) + **chronomètre de repos synchronisé** entre partenaires.
3. **Form Check** : partage d’exécution courte pour recevoir des retours techniques bienveillants des coachs et membres.

### Univers 5 — Raids du Week-end & Pactes entre Amis
1. **Raids / Réunions Physiques** : organisés par les Coachs et Capitaines, validés par **Check-in QR / GPS** sur place → Badge exclusif + XP.
2. **Pactes entre Amis (2 à 5 membres)** : contrat hebdomadaire partagé (ex. *3 séances avant 06h00*), barres d’avancement collectives et bouton de **relance/réveil** pour les retardataires.

---

## 3. Schéma Base de Données Cible (PostgreSQL + PostGIS / Supabase)

```sql
users (id, pseudo, auth_provider, contact, city, avatar_json, category, discipline_score, xp, badges_json)
initiation_tests (id, user_id, goals_json, muscles_json, pushups, squats, plank_sec, cardio_level, assigned_category, created_at)
outdoor_sessions (id, mode, discipline, start_time, tier, geo_mode, territory_zone_id, route_geojson, status)
outdoor_participants (session_id, user_id, checkpoints_passed, relay_order, progress_km, chrono_sec, status)
territory_zones (id, city, name, owner_club_id, points, polygon_geom)
thursday_sessions (id, sport, format, location_name, location_point, start_time, fee_amount, status, mvp_user_id)
thursday_players (session_id, user_id, team_name, role_status, paid, checked_in, goals, assists)
house_duels (id, mode, exercise, tier, team_a_json, team_b_json, score_a, score_b, winner_side, created_at)
gym_spot_calls (id, gym_name, user_id, muscle_focus, start_time, status)
weekend_raids (id, title, coach_id, location_point, start_time, badge_reward, qr_secret)
friend_pacts (id, title, target_sessions, week_start, members_progress_json)
feed_posts (id, author_id, type, badge, content, stats_json, banner_url, reactions_json, created_at)
```

### Canaux WebSockets Temps Réel
* `lobby:outdoor:{sessionId}` : top départ synchronisé, positions live, checkpoints et passage de témoin relais.
* `arena:house:{duelId}` : HP en direct, reps validées, combos et scores 4v4.
* `field:thursday:{sessionId}` : check-ins QR/GPS, chrono live, buts, rotations « Vainqueur reste » et votes MVP.
* `gym:duo:{duoId}` : synchronisation des séries cochées et du chrono de temps de repos.

---

## 4. Feuille de Route de Déploiement Mobile (APK Android)
1. **Validation UX & Logique** dans le prototype web mobile-first + tests sur vrai téléphone via `adb reverse tcp:5173 tcp:5173` + `scrcpy`.
2. **Backend Supabase** : Auth (Google / OTP WhatsApp), tables PostGIS ci-dessus, Realtime WebSockets.
3. **Packaging APK Android via Capacitor** (`@capacitor/core`, `@capacitor/android`, `@capacitor/geolocation`, `@capacitor/camera`, `@capacitor/push-notifications`) puis génération de l’APK signé pour test terrain.
