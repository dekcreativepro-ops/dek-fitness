# Coach IA

## Ce qui fonctionne déjà (sans serveur)
- **Écran Coach IA** (carte sur l'accueil + action rapide « + ») : conversation, brief du jour, boutons de suggestions.
- **Personnalisation** : prénom, genre (une coach / un coach), style (bienveillant, équilibré, hardcore) et voix. La voix de l'annonceur gamer suit le genre du coach.
- **Moteur local** (`src/utils/coachBrain.ts`) : il lit ton profil (objectifs, niveau, séances de la semaine, série, calories, eau, poids/taille/âge) et répond avec les connaissances de `src/data/coachKnowledge.ts` : programme du jour, bilan de semaine, plan 7 jours par objectif, nutrition avec aliments locaux et estimation de calories, hydratation, sommeil, récupération, échauffement, étirements, course, force, motivation, explication des bonus, consignes de sécurité en cas de douleur.
- **Coaching en direct** : pendant une course (25 %, 50 %, 75 %, arrivée) et un duel Défi House (mi-parcours, 10 dernières secondes, victoire), le coach affiche une bulle et parle en français avec sa voix. Il compare avec ta dernière performance : « tu fais mieux que la dernière fois », « un peu derrière ta dernière fois », « nouveau record, tu as monté tes performances ».

## Brancher un vrai modèle (IA connectée)
Une vraie IA conversationnelle a besoin d'un modèle côté serveur : la clé d'API ne doit jamais être dans l'app.
1. Récupère une clé API Claude sur le compte Anthropic (console).
2. Lance le petit serveur fourni : `ANTHROPIC_API_KEY=... node server/coach-proxy.mjs` (non testé avec une vraie clé).
3. Dans `.env.local` : `VITE_COACH_API_URL=http://localhost:8787`, puis relance `npm run dev`.
4. L'écran affiche « IA connectée » quand le modèle répond ; sinon il retombe sur le moteur local (« Mode hors-ligne »).

Les consignes envoyées au modèle sont dans `SYSTEM_PROMPT` (`src/data/coachKnowledge.ts`) : personnalité, règles de sécurité, progression raisonnable, ce que le coach sait faire. Plus tu l'enrichis (conseils, programmes, vocabulaire local), plus le coach est précis.

## Données gardées sur l'appareil
`dek_coach_profile_v1` (coach), `dek_coach_chat_v1` (conversation), `dek_perf_history_v1` (dernières performances pour les comparaisons).
