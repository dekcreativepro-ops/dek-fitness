# DEK FITNESS — Design System v3 « Studio »

Refonte complète de l'interface. Même fonctionnalités, nouvelle identité visuelle de niveau
« vrai designer / Figma ». Références à ouvrir (Read) avant de coder :

- `docs/design-refs/ref-2-lime-dashboard.png` → **référence principale** (dashboard « Hello Lester! »,
  Browse, détail séance, lecteur « 10 », « Get ready », « Congratulation », liste & profil coach).
- `docs/design-refs/ref-1-onboarding-trainers.png` → onboarding (photos plein cadre, sélecteurs sexe/âge/
  poids/objectif, login, vérification, liste & profil coach).
- Pinterest (décrits) : *Ronas IT* — lecteur avec gros chrono + barre « 27 % complété » + Préc. | ⏸ | Suiv.,
  bandeau de dates de la semaine ; *Train Effective* — titre héro énorme en capitales condensées ;
  *Run Tracker* — carte sombre + panneau verre « 8.2 km of 10 km » ; *Nike / Ladder* — murs de trophées.

> Objectif : on doit reconnaître la référence 2 dans chaque écran. Faire « presque pareil, en mieux ».

## 1. Interdits absolus

- **Aucun emoji** nulle part (texte, toasts, données, labels) : pas de 🔥 💧 ⚽ 👋 🏅 ★ ✓ ⏱ 🔔 💪 etc.
  Utiliser une icône ligne (`DekIcons`) ou rien. Le caractère « ✓ » est aussi interdit → icône `Check`.
- Pas d'icônes décoratives à côté de chaque titre/label. Une icône seulement si elle est **fonctionnelle**
  (navigation, retour, fermer, lecture/pause, favori, recherche, filtre, chevron de ligne).
- Pas de néon : aucun `drop-shadow`/`shadow-[0_0_..]` coloré, aucun `text-shadow`, pas d'`animate-pulse-volt`,
  pas de halo animé en boucle, pas de dégradé décoratif sur les cartes (dégradés autorisés uniquement
  comme voile noir sur les photos).
- Pas de MAJUSCULES pour les titres (sauf le héro condensé d'une séance et de minuscules « overlines »).
- Pas de texte < 11 px. Le texte courant fait 13–15 px.
- Pas de `position: fixed` (règle du projet). Overlays/feuilles via portail `#dek-overlay-root`.

## 2. Couleurs (tokens Tailwind v4 définis dans `src/index.css` → classes `bg-ink`, `text-mute`…)

| Token | Valeur | Usage |
|---|---|---|
| `ink` | `#0E0F12` | fond de l'app |
| `card` | `#1A1B1F` | cartes principales |
| `tile` | `#24252A` | tuiles internes, champs, chips inactifs, boutons secondaires |
| `rim` | `#2E2F35` | séparateurs, pistes de progression |
| `lime` | `#C8FF00` | CTA, onglet actif, chiffres clés, anneaux (la couleur de marque, utilisée avec parcimonie) |
| `on-lime` | `#0E0F12` | texte sur lime |
| `fg` | `#F4F4F5` | texte principal |
| `mute` | `#A1A1AA` | texte secondaire |
| `faint` | `#6B6C75` | texte tertiaire, icônes inactives |
| `danger` | `#FF4D5E` | erreurs, défaite, absence |
| `aqua` | `#5BD6FF` | hydratation uniquement (données) |
| `ember` | `#FF9F45` | calories uniquement (données) |

Règle : 90 % de gris neutres, lime seulement pour l'action principale et la donnée clé de l'écran.
Les couleurs de paliers (Amateur/Standard/Pro/Expert) restent pour les pastilles de niveau, en petit.

## 3. Typographie

- Police unique **Urbanist** (Google Fonts 400/500/600/700/800), `font-variant-numeric: tabular-nums` pour
  les chiffres. Chakra Petch est supprimée ; la classe `font-hud` est conservée en alias de Urbanist
  pour compatibilité mais **ne doit plus être utilisée** dans le code redessiné.
- Échelle : Display 34/38 800 (-0.02em) · Titre écran 26/32 700 · H2 20/26 700 · H3 16/22 700 ·
  Corps 14/20 500 · Petit 13/18 500 · Légende 12/16 500 · Overline 11/14 600 (+0.06em, rare).
- Grands chiffres (compteurs, chrono, reps) : 48–96 px, 800, tabulaires, couleur `lime` ou `fg`.
- Héro de séance (style *Train Effective*) : 34–40 px, 800, MAJUSCULES, interlignage 0.95.

## 4. Formes, espacements, profondeur

- Grille 4 pt. Marge écran 20 px. Espace entre sections 28 px. Padding carte 16–20 px.
- Rayons : carte 28 px, photo/carte média 24 px, tuile 20 px, champ 16 px, pilule/bouton `rounded-full`.
- Bordures : aucune par défaut. Si besoin `border border-white/[0.06]`.
- Ombres : aucune, sauf feuilles du bas (`shadow-2xl` noir). La profondeur vient des niveaux `ink → card → tile`.

## 5. Composants (dans `src/components/ui/kit.tsx`, à réutiliser partout)

- **Button** `variant: 'primary' | 'secondary' | 'ghost'`, hauteur 52 (`size="lg"`) ou 44 ; primaire = fond
  lime, texte `on-lime` 15/700 ; option `trailingArrow` = petit cercle sombre avec flèche (cf. « Next → »
  et « Start Now » des références).
- **IconButton** : cercle 44 px fond `tile`, icône 20 px `fg` (retour, favori, fermer, trophée en-tête).
- **Segmented / ChipTabs** : pilules h-36 px, actif = fond lime + texte on-lime, inactif = fond `tile` + `mute`
  (cf. « Workouts | Fitness | Plans »).
- **Card** : `bg-card rounded-[28px] p-5`. **Tile** : `bg-tile rounded-[20px] p-4`.
- **ListRow** (cf. liste coachs réf. 2) : carte `card` rayon 24, avatar rond 48, titre 15/700, sous-titre 12
  `mute`, méta 12 `lime`, à droite un cercle `tile` 32 px avec chevron.
- **StatTile** : label 12 `mute`, valeur 22–28/800, unité 12 `mute` ; en grille 3 colonnes avec séparateurs
  verticaux `rim` (cf. « Level | Progress | Focus Area », « Experience | Completed | Active Clients »).
- **ProgressBar** : piste `rim` h-8 px arrondie, remplissage lime, poignée ronde blanche optionnelle
  (cf. carte « Steps 11 000 / 16 000 »).
- **ActivityRings** : anneaux concentriques **lime uniquement** en 3 intensités (100 %, 65 %, 35 %) sur piste
  `rim` (cf. « Daily Activity »). Pas de glow.
- **SectionHeader** : titre 18/700 `fg` + lien « Voir tout » 13/600 `lime` à droite.
- **ScreenHeader** : retour (IconButton) + titre centré 17/700 + action droite optionnelle.
- **BottomSheet** : fond `card`, poignée `rim` 40×5, titre 18/700, rayon haut 32.
- **PhotoCard** (Browse) : rayon 24, photo `object-cover`, voile noir bas, signet (IconButton translucide
  noir/40 en haut à droite), titre 15/700 blanc, méta 12 « ▷ 45 min · Intermédiaire » (icône play ligne).
- **Avatar** : rond (`rounded-full`), sans anneau coloré lumineux ; anneau fin `rim` facultatif.

## 6. Navigation & en-têtes

- **Suppression de l'en-tête global** (barre XP / discipline en haut). Chaque écran porte son propre en-tête.
- En-tête Accueil (réf. 2) : avatar rond 44 + « Salut Karim ! » 20/700 + « Prêt pour ta séance ? » 13 `mute`,
  à droite IconButton (trophée) → classement.
- **Barre du bas** (réf. 2) : bande `card` pleine largeur, 4 onglets (Accueil, Outdoor, Arène, Réseau) icône
  ligne 22 px + label 11/600 ; actif = `fg`, inactif = `faint` ; **bouton central lime rond 56 px** avec « + »
  sombre (ouvre le menu d'actions rapides).
- Icônes : `DekIcons` en **style ligne uniquement** (stroke 1.75, aucun remplissage).

## 7. Mouvement

- Transitions 200–280 ms `easeOut`, feuilles et écrans poussés en ressort doux. Apparition de listes en
  fondu-montée léger (8 px). Pas d'animation infinie décorative (sauf indicateur de chargement).
- Ken Burns très lent autorisé uniquement sur la grande photo héro d'un écran. Pas de grain, pas de reflet qui balaie.
- Confettis + coche dessinée autorisés uniquement sur l'écran « Bravo » de fin de séance.

## 8. Correspondance écrans ↔ références

| Écran DEK | Inspiration |
|---|---|
| Carrousel d'accueil | réf. 1 ligne 1 : photo plein cadre en haut, texte centré « Rencontre ton coach, **commence ton aventure** », points de page (pilule lime), bouton « Commencer » |
| Profil physique / test | réf. 1 : « Tell us about yourself » (2 grands cercles sexe), roue d'âge entre deux traits lime, règle de poids, liste d'objectifs ; bas : cercle retour + pilule « Suivant » |
| Création de compte | réf. 1 « Welcome back » : photo en haut, onglets Gmail/WhatsApp/Email, champs soulignés, pilule lime |
| Accueil | réf. 2 haut droite : en-tête, carte progression hebdo avec barre à poignée, carte « Activité du jour » anneaux lime, liste « Activités récentes » (lignes), séance du jour photo, programmes |
| Bibliothèque séances | réf. 2 « Browse » : onglets, ligne Filtres / Tri / Recherche, grille 2 colonnes PhotoCard |
| Détail séance | réf. 2 centre : photo + retour, titre, pastilles durée/kcal, « À propos », Niveau / Progression / Zone, Coach, note 4.6 + barres, avis, liste d'exercices |
| Prépare-toi | réf. 2 : plein écran lime, « Prépare-toi » sombre centré + compte à rebours |
| Lecteur | réf. 2 « 10 » : média plein cadre arrondi, ÉNORME chiffre lime, nom de l'exercice, barre de progression, pilules « ← Précédent » (sombre) / « Suivant → » (lime), + barre Ronas IT |
| Bravo | réf. 2 « Congratulation » : carte lime, cercle sombre avec coche, titre, texte, bouton sombre « Fermer » |
| Coachs | réf. 2 bas droite : lignes coach ; profil = réf. 2 bas gauche (photo, About, 3 stats, lignes « Programmes en ligne › ») |
| Outdoor | Run Tracker : carte sombre, panneau verre « 0.85 km sur 3 km » |
| Classement / Trophées | Nike/Ladder : écussons gris verrouillés / colorés débloqués, sobres |

## 9. Règles techniques (inchangées)

- Garder **toute** la logique, les props, les callbacks, les états et les textes métier : refonte visuelle uniquement.
- `import * as maplibregl from 'maplibre-gl'` + worker (`setWorkerUrl`) : ne pas toucher.
- Icônes : uniquement via `src/components/DekIcons.tsx` (ajouter un wrapper si besoin, jamais lucide direct).
- Interface 100 % en français.
