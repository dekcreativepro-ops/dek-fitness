import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import { BodyProfileView } from './components/BodyProfileView';
import { ArrowRight, Compass, House, PaperPlaneRight, Play, SoccerBall, Sword, UsersThree } from './components/DekIcons';
import { HomeView } from './components/HomeView';
import type { NetworkSubTab } from './components/NetworkHubView';
import { OnboardingAuthView } from './components/OnboardingAuthView';
import { OnboardingIntro } from './components/OnboardingIntro';
import { PhoneSimulatorFrame } from './components/PhoneSimulatorFrame';
import { DropWave, DumbbellLift, PlusMorph, TrophyShine } from './components/ui/AnimatedIcons';
import { BottomSheet, ScreenHeader } from './components/ui/kit';
import { pushScreen, riseScreen } from './components/ui/motion';
import { ViewBoundary } from './components/ViewBoundary';
import { DekNavContext, type DekNavValue, type OverlayEntry } from './context/DekNav';
import { INITIAL_COACHS, INITIAL_FEED, INITIAL_USER } from './data/mockData';
import {
  getProgram,
  getRecommendedProgram,
  MIN_VALIDATED_RATIO,
  type WorkoutResult,
} from './data/workoutsData';
import type {
  AuthProvider,
  BodyProfile,
  FeedPost,
  FeedReaction,
  InitiationResult,
  MissionDifficulty,
  TabId,
  UserAvatarConfig,
  UserProfile,
} from './types/dek';
import { ACHIEVEMENTS, getEarnedAchievementIds } from './utils/achievements';
import { getTierIndex, TIER_ORDER } from './utils/categorization';
import { getNutritionPlan } from './utils/programsAndNutrition';
import {
  computeStreak,
  dayKey,
  getRankInfo,
  pruneActivityLog,
  SEASON_RANKS,
  toHandle,
  weekKey,
} from './utils/progression';

// Chargement différé des gros modules : MapLibre (Outdoor) et la caméra IA (Arène)
// ne sont plus téléchargés au démarrage, ce qui accélère fortement l'ouverture de l'app.
const loadMissions = () => import('./components/MissionsView');
const loadArena = () => import('./components/ArenaHubView');
const loadNetwork = () => import('./components/NetworkHubView');
const loadNutrition = () => import('./components/NutritionView');
const loadInitiation = () => import('./components/InitiationTestView');

const MissionsView = lazy(() => loadMissions().then((m) => ({ default: m.MissionsView })));
const ArenaHubView = lazy(() => loadArena().then((m) => ({ default: m.ArenaHubView })));
const NetworkHubView = lazy(() => loadNetwork().then((m) => ({ default: m.NetworkHubView })));
const NutritionView = lazy(() => loadNutrition().then((m) => ({ default: m.NutritionView })));
const InitiationTestView = lazy(() =>
  loadInitiation().then((m) => ({ default: m.InitiationTestView })),
);
// Écrans plein cadre (séances guidées, coach, classement)
const loadWorkouts = () => import('./components/workouts/WorkoutsLibraryView');
const loadWorkoutDetail = () => import('./components/workouts/WorkoutDetailScreen');
const loadPlayer = () => import('./components/workouts/WorkoutPlayer');
const WorkoutsLibraryView = lazy(() => loadWorkouts().then((m) => ({ default: m.WorkoutsLibraryView })));
const WorkoutDetailScreen = lazy(() =>
  loadWorkoutDetail().then((m) => ({ default: m.WorkoutDetailScreen })),
);
const WorkoutPlayer = lazy(() => loadPlayer().then((m) => ({ default: m.WorkoutPlayer })));
const CoachProfileScreen = lazy(() =>
  import('./components/coach/CoachProfileScreen').then((m) => ({ default: m.CoachProfileScreen })),
);
const TrophiesScreen = lazy(() =>
  import('./components/TrophiesScreen').then((m) => ({ default: m.TrophiesScreen })),
);
const LeaderboardScreen = lazy(() =>
  import('./components/LeaderboardScreen').then((m) => ({ default: m.LeaderboardScreen })),
);

const STORAGE_KEY = 'dek_fitness_user_v3';
const INTRO_STORAGE_KEY = 'dek_fitness_intro_v1';
const FEED_STORAGE_KEY = 'dek_fitness_feed_v1';
const MAX_FEED_POSTS = 40;
const MAX_CLAIMED_REWARDS = 400;

// Barre du bas : 4 onglets + bouton d'action central « + » (Nutrition et Séances guidées
// sont accessibles depuis l'accueil et le bouton +).
const NAV_LEFT: { id: TabId; label: string; icon: typeof Compass }[] = [
  { id: 'home', label: 'Accueil', icon: House },
  { id: 'missions', label: 'Outdoor', icon: Compass },
];
const NAV_RIGHT: { id: TabId; label: string; icon: typeof Compass }[] = [
  { id: 'house', label: 'Arène', icon: Sword },
  { id: 'network', label: 'Réseau', icon: UsersThree },
];

/** Remise à zéro quotidienne (eau & repas) + nettoyage du journal d'activité. */
function normalizeUser(u: UserProfile, today: string = dayKey()): UserProfile {
  if (u.lastActiveDay === today) return u;
  return {
    ...u,
    lastActiveDay: today,
    waterGlasses: 0,
    mealsChecked: [],
    activityLog: pruneActivityLog(u.activityLog),
    xpLog: pruneActivityLog(u.xpLog),
    kcalLog: pruneActivityLog(u.kcalLog),
  };
}

function isValidBody(v: unknown): v is BodyProfile {
  if (!v || typeof v !== 'object') return false;
  const b = v as Partial<BodyProfile>;
  return (
    (b.sex === 'homme' || b.sex === 'femme') &&
    typeof b.age === 'number' &&
    typeof b.weightKg === 'number' &&
    typeof b.heightCm === 'number'
  );
}

function loadSavedUser(): UserProfile {
  if (typeof window === 'undefined') return normalizeUser(INITIAL_USER);
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return normalizeUser(INITIAL_USER);
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    const isRecord = (v: unknown): v is Record<string, number> =>
      !!v && typeof v === 'object' && !Array.isArray(v);
    return normalizeUser({
      ...INITIAL_USER,
      ...parsed,
      badges: Array.isArray(parsed.badges) ? parsed.badges : INITIAL_USER.badges,
      goals: Array.isArray(parsed.goals) ? parsed.goals : INITIAL_USER.goals,
      targetMuscles: Array.isArray(parsed.targetMuscles)
        ? parsed.targetMuscles
        : INITIAL_USER.targetMuscles,
      mealsChecked: Array.isArray(parsed.mealsChecked) ? parsed.mealsChecked : [],
      claimedRewards: Array.isArray(parsed.claimedRewards) ? parsed.claimedRewards : [],
      activityLog: isRecord(parsed.activityLog) ? parsed.activityLog : {},
      xpLog: isRecord(parsed.xpLog) ? parsed.xpLog : {},
      kcalLog: isRecord(parsed.kcalLog) ? parsed.kcalLog : {},
      workoutsDone: isRecord(parsed.workoutsDone) ? parsed.workoutsDone : {},
      savedWorkouts: Array.isArray(parsed.savedWorkouts) ? parsed.savedWorkouts : [],
      body: isValidBody(parsed.body) ? parsed.body : undefined,
      bodyAsked: parsed.bodyAsked === true,
      lastActiveDay: typeof parsed.lastActiveDay === 'string' ? parsed.lastActiveDay : '',
      avatar: { ...INITIAL_USER.avatar, ...(parsed.avatar ?? {}) },
    });
  } catch {
    return normalizeUser(INITIAL_USER);
  }
}

function loadSavedFeed(): FeedPost[] {
  if (typeof window === 'undefined') return INITIAL_FEED;
  try {
    const raw = window.localStorage.getItem(FEED_STORAGE_KEY);
    if (!raw) return INITIAL_FEED;
    const parsed = JSON.parse(raw) as FeedPost[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : INITIAL_FEED;
  } catch {
    return INITIAL_FEED;
  }
}

type NewPost = Pick<FeedPost, 'type' | 'badge' | 'content' | 'stats'> &
  Partial<Pick<FeedPost, 'bannerImage' | 'reactions'>>;

function ViewLoader() {
  return (
    <div className="flex h-48 flex-col items-center justify-center gap-3 text-[13px] font-medium text-mute">
      <span className="h-7 w-7 animate-spin rounded-full border-2 border-rim border-t-lime" />
      Chargement…
    </div>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  // Le compteur `n` force l'ouverture du bon sous-onglet même si on y était déjà passé avant.
  const [arenaNav, setArenaNav] = useState<{ sub: 'house' | 'gym'; n: number }>({ sub: 'house', n: 0 });
  const [networkNav, setNetworkNav] = useState<{ sub: NetworkSubTab; n: number }>({
    sub: 'sante',
    n: 0,
  });
  const [user, setUser] = useState<UserProfile>(loadSavedUser);
  const [isRetakingInitiation, setIsRetakingInitiation] = useState(false);
  const [feed, setFeed] = useState<FeedPost[]>(loadSavedFeed);
  const [toast, setToast] = useState<string | null>(null);
  const [introSeen, setIntroSeen] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(INTRO_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [quickOpen, setQuickOpen] = useState(false);
  const [isEditingBody, setIsEditingBody] = useState(false);
  const [overlays, setOverlays] = useState<OverlayEntry[]>([]);
  const overlaysRef = useRef<OverlayEntry[]>([]);

  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const feedSeqRef = useRef(0);
  // Copie synchrone des récompenses encaissées : bloque les double-taps avant le re-render.
  const claimedRef = useRef<Set<string> | null>(null);
  if (claimedRef.current === null) claimedRef.current = new Set(user.claimedRewards);

  const rankInfo = getRankInfo(user.xp);
  const streakDays = computeStreak(user.activityLog);
  const userView = useMemo<UserProfile>(
    () => ({ ...user, rank: rankInfo.rank, nextRankXp: rankInfo.nextRankXp, streakDays }),
    [user, rankInfo.rank, rankInfo.nextRankXp, streakDays],
  );

  // Fond « verre » dynamique : la lumière suit le doigt, le défilement et l'inclinaison du téléphone
  useEffect(() => {
    const root = document.documentElement;
    let frame = 0;
    const next = { x: 0, y: 0 };
    const apply = () => {
      frame = 0;
      root.style.setProperty('--dek-px', next.x.toFixed(3));
      root.style.setProperty('--dek-py', next.y.toFixed(3));
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(apply);
    };
    const onPointer = (e: PointerEvent) => {
      next.x = (e.clientX / window.innerWidth - 0.5) * 2;
      schedule();
    };
    const onScroll = (e: Event) => {
      const el = e.target as HTMLElement | null;
      if (el && typeof el.scrollTop === 'number') {
        next.y = Math.max(-1, Math.min(1, el.scrollTop / 700 - 0.2));
        schedule();
      }
    };
    const onTilt = (e: DeviceOrientationEvent) => {
      if (e.gamma == null) return;
      next.x = Math.max(-1, Math.min(1, e.gamma / 35));
      schedule();
    };
    window.addEventListener('pointermove', onPointer, { passive: true });
    document.addEventListener('scroll', onScroll, { capture: true, passive: true });
    window.addEventListener('deviceorientation', onTilt);
    return () => {
      window.removeEventListener('pointermove', onPointer);
      document.removeEventListener('scroll', onScroll, true);
      window.removeEventListener('deviceorientation', onTilt);
      if (frame) cancelAnimationFrame(frame);
    };
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 1050);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
    } catch {
      // Ignore les erreurs de stockage privé
    }
  }, [user]);

  useEffect(() => {
    try {
      window.localStorage.setItem(FEED_STORAGE_KEY, JSON.stringify(feed.slice(0, MAX_FEED_POSTS)));
    } catch {
      // Ignore
    }
  }, [feed]);

  // Si l'app reste ouverte après minuit (ou revient au premier plan le lendemain)
  useEffect(() => {
    const refreshDay = () => setUser((u) => normalizeUser(u));
    const onVisible = () => {
      if (document.visibilityState === 'visible') refreshDay();
    };
    document.addEventListener('visibilitychange', onVisible);
    const interval = setInterval(refreshDay, 60_000);
    return () => {
      document.removeEventListener('visibilitychange', onVisible);
      clearInterval(interval);
    };
  }, []);

  // Précharge les modules lourds en arrière-plan une fois l'accueil affiché
  useEffect(() => {
    if (!user.isAuthenticated || !user.initiationCompleted) return;
    const preload = () => {
      void loadMissions();
      void loadArena();
      void loadNetwork();
      void loadNutrition();
    };
    const w = window as Window & {
      requestIdleCallback?: (cb: () => void) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (w.requestIdleCallback) {
      const id = w.requestIdleCallback(preload);
      return () => w.cancelIdleCallback?.(id);
    }
    const t = setTimeout(preload, 2500);
    return () => clearTimeout(t);
  }, [user.isAuthenticated, user.initiationCompleted]);

  const showToast = useCallback((msg: string) => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast(msg);
    toastTimerRef.current = setTimeout(() => setToast(null), 3400);
  }, []);

  useEffect(
    () => () => {
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    },
    [],
  );

  // --- PILE D'ÉCRANS (synchronisée avec le bouton retour Android / navigateur) ---
  const pushOverlay = useCallback((entry: OverlayEntry) => {
    const next = [...overlaysRef.current, entry];
    overlaysRef.current = next;
    setOverlays(next);
    setQuickOpen(false);
    window.history.pushState({ dekDepth: next.length }, '');
  }, []);

  const closeOverlay = useCallback(() => {
    if (overlaysRef.current.length > 0) window.history.back();
  }, []);

  const closeAllOverlays = useCallback(() => {
    const n = overlaysRef.current.length;
    if (n > 0) window.history.go(-n);
  }, []);

  useEffect(() => {
    const onPop = (e: PopStateEvent) => {
      const state = e.state as { dekDepth?: number } | null;
      const depth = typeof state?.dekDepth === 'number' ? state.dekDepth : 0;
      overlaysRef.current = overlaysRef.current.slice(0, depth);
      setOverlays(overlaysRef.current);
    };
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const goTab = useCallback(
    (tab: TabId) => {
      closeAllOverlays();
      setQuickOpen(false);
      setActiveTab(tab);
    },
    [closeAllOverlays],
  );

  // Notification de nouveaux trophées (après le toast de l'action, pour ne pas l'écraser)
  const earnedKey = user.isAuthenticated ? getEarnedAchievementIds(userView).join('|') : '';
  const prevEarnedRef = useRef<string | null>(null);
  useEffect(() => {
    const prev = prevEarnedRef.current;
    prevEarnedRef.current = earnedKey;
    if (prev === null || !earnedKey) return;
    const before = new Set(prev.split('|').filter(Boolean));
    const fresh = earnedKey.split('|').filter((id) => id && !before.has(id));
    if (fresh.length === 0) return;
    const title = ACHIEVEMENTS.find((a) => a.id === fresh[0])?.title ?? '';
    const t = setTimeout(
      () =>
        showToast(
          fresh.length === 1
            ? `Nouveau trophée débloqué : ${title}`
            : `${fresh.length} nouveaux trophées débloqués`,
        ),
      1800,
    );
    return () => clearTimeout(t);
  }, [earnedKey, showToast]);

  // Toast de montée de rang de saison (Recrue → Challenger → …)
  const prevRankRef = useRef(rankInfo.rank);
  useEffect(() => {
    const prev = prevRankRef.current;
    prevRankRef.current = rankInfo.rank;
    if (prev === rankInfo.rank) return;
    const prevIdx = SEASON_RANKS.findIndex((r) => r.name === prev);
    const nextIdx = SEASON_RANKS.findIndex((r) => r.name === rankInfo.rank);
    if (nextIdx > prevIdx) showToast(`Nouveau rang de saison : ${rankInfo.rank}`);
  }, [rankInfo.rank, showToast]);

  /**
   * Point d'entrée unique pour faire évoluer le profil.
   * - claimKey : récompense unique (par jour/semaine) → empêche de « farmer » l'XP
   *   en ré-ouvrant un onglet ou en cochant/décochant.
   * - session : compte comme séance du jour (série & graphique hebdo).
   * Retourne false si la récompense avait déjà été encaissée.
   */
  const commitProgress = useCallback(
    (
      update: (u: UserProfile) => UserProfile,
      opts: { claimKey?: string; session?: boolean; kcal?: number } = {},
    ): boolean => {
      const claims = claimedRef.current!;
      if (opts.claimKey) {
        if (claims.has(opts.claimKey)) return false;
        claims.add(opts.claimKey);
      }
      const today = dayKey();
      setUser((prev) => {
        const base = normalizeUser(prev, today);
        let u = update(base);
        // Journal XP du jour (classement hebdo) & calories actives (anneaux)
        const xpDelta = u.xp - base.xp;
        if (xpDelta > 0) {
          u = { ...u, xpLog: { ...u.xpLog, [today]: (u.xpLog[today] ?? 0) + xpDelta } };
        }
        if (opts.kcal && opts.kcal > 0) {
          u = { ...u, kcalLog: { ...u.kcalLog, [today]: (u.kcalLog[today] ?? 0) + Math.round(opts.kcal) } };
        }
        if (opts.session) {
          u = { ...u, activityLog: { ...u.activityLog, [today]: (u.activityLog[today] ?? 0) + 1 } };
        }
        if (opts.claimKey && !u.claimedRewards.includes(opts.claimKey)) {
          u = {
            ...u,
            claimedRewards: [...u.claimedRewards, opts.claimKey].slice(-MAX_CLAIMED_REWARDS),
          };
        }
        return u;
      });
      return true;
    },
    [],
  );

  const pushFeedPost = (post: NewPost) => {
    feedSeqRef.current += 1;
    const now = Date.now();
    const created: FeedPost = {
      id: `f_${now}_${feedSeqRef.current}`,
      author: user.name,
      initials: user.name.slice(0, 2).toUpperCase() || 'DK',
      avatarPreset: user.avatar.mode === 'preset' ? user.avatar.presetId : undefined,
      timeAgo: 'À l’instant',
      createdAt: now,
      reactions: { feu: 0, force: 0, respect: 0 },
      ...post,
    };
    setFeed((prev) => [created, ...prev].slice(0, MAX_FEED_POSTS));
  };

  const addBadgeUnique = (badges: string[], badgeName: string) =>
    badges.includes(badgeName) ? badges : [...badges, badgeName];

  const handleAuthComplete = (payload: {
    name: string;
    city: string;
    authProvider: AuthProvider;
    contactValue: string;
    avatar: UserAvatarConfig;
  }) => {
    setUser((u) => ({
      ...u,
      isAuthenticated: true,
      name: payload.name,
      handle: toHandle(payload.name),
      city: payload.city,
      authProvider: payload.authProvider,
      contactValue: payload.contactValue,
      avatar: payload.avatar,
    }));
  };

  const handleInitiationComplete = (result: InitiationResult) => {
    const isFirstTime = !user.initiationCompleted;
    commitProgress(
      (u) => ({
        ...u,
        initiationCompleted: true,
        category: result.assignedCategory,
        missionsInCurrentTier: 0,
        goals: result.goals,
        targetMuscles: result.targetMuscles,
        initiationResult: result,
        xp: isFirstTime ? u.xp + 100 : u.xp,
      }),
      { session: true },
    );
    setIsRetakingInitiation(false);
    setActiveTab('home');
    showToast(
      `Programme & catégorie ${result.assignedCategory} prêts !${isFirstTime ? ' (+100 XP)' : ''}`,
    );
  };

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
      window.localStorage.removeItem(FEED_STORAGE_KEY);
    } catch {
      // Ignore
    }
    claimedRef.current = new Set();
    closeAllOverlays();
    setIsRetakingInitiation(false);
    setUser(normalizeUser(INITIAL_USER));
    setFeed(INITIAL_FEED);
    setActiveTab('home');
  };

  // --- UNIVERS 1 : OUTDOOR ---
  const handleMissionComplete = (
    xpEarned: number,
    distanceKm: number,
    rankPos: number,
    tier: MissionDifficulty,
    modeLabel: string,
  ) => {
    // Calcul de la promotion à partir de l'état courant (et non dans l'updater,
    // qui peut s'exécuter plus tard : le toast de palier ne s'affichait jamais).
    const sameTier = tier === user.category;
    const nextCount = sameTier ? user.missionsInCurrentTier + 1 : user.missionsInCurrentTier;
    const currentIdx = getTierIndex(user.category);
    const canPromote = sameTier && nextCount >= 2 && currentIdx < TIER_ORDER.length - 1;
    const promotedTo = canPromote ? TIER_ORDER[currentIdx + 1] : null;

    commitProgress(
      (u) => ({
        ...u,
        xp: u.xp + xpEarned,
        missionsCompleted: u.missionsCompleted + 1,
        disciplineScore: Math.min(100, u.disciplineScore + 1),
        category: promotedTo ?? u.category,
        missionsInCurrentTier: promotedTo ? 0 : nextCount,
      }),
      { session: true, kcal: distanceKm * 55 },
    );

    pushFeedPost({
      bannerImage: '/images/w-cardio.jpg',
      type: 'mission',
      badge: `${modeLabel.toUpperCase()} • ${tier.toUpperCase()}`,
      content: `Sortie ${modeLabel} validée ! Parcours de ${distanceKm} km terminé à la position #${rankPos}.`,
      stats: [
        { label: 'Distance', value: `${distanceKm} km` },
        { label: 'Classement', value: `#${rankPos}` },
        { label: 'Gain', value: `+${xpEarned} XP` },
      ],
      reactions: { feu: 1, force: 1, respect: 1 },
    });

    if (promotedTo) {
      showToast(`Palier débloqué : tu passes en catégorie ${promotedTo}`);
    } else {
      showToast(`${modeLabel} réussie ! +${xpEarned} XP ajoutés.`);
    }
  };

  const handleMissionFail = (reason?: string) => {
    commitProgress((u) => ({
      ...u,
      missionsFailed: u.missionsFailed + 1,
      disciplineScore: Math.max(0, u.disciplineScore - 2),
    }));
    showToast(reason ? `${reason} • Discipline -2%` : 'Mission échouée : Discipline -2%.');
  };

  const handleTerritoryCapture = (zoneName: string) => {
    const badgeName = `Conquérant ${zoneName}`;
    const rewarded = commitProgress(
      (u) => ({ ...u, xp: u.xp + 150, badges: addBadgeUnique(u.badges, badgeName) }),
      { claimKey: `territory:${zoneName}:${weekKey()}` },
    );
    if (!rewarded) {
      showToast(`${zoneName} déjà conquise cette semaine : pas de bonus en double.`);
      return;
    }
    pushFeedPost({
      bannerImage: '/images/w-cardio.jpg',
      type: 'mission',
      badge: 'TERRITOIRE CONQUIS',
      content: `Prise de contrôle de ${zoneName} pour DEK Warriors ! Badge « ${badgeName} » débloqué.`,
      stats: [
        { label: 'Zone', value: zoneName },
        { label: 'Bonus', value: '+150 pts' },
        { label: 'Gain', value: '+150 XP' },
      ],
      reactions: { feu: 2, force: 2, respect: 1 },
    });
    showToast(`Badge débloqué : ${badgeName} (+150 XP) !`);
  };

  // --- UNIVERS 3 & 4 : ARÈNE (DÉFI HOUSE & GYM BUDDY) ---
  const handleWinDuel = (
    xpEarned: number,
    exercise: string,
    reps: number,
    modeLabel = '1v1 K.O. 60s',
  ) => {
    commitProgress((u) => ({ ...u, xp: u.xp + xpEarned, houseWins: u.houseWins + 1 }), {
      session: true,
      kcal: 60,
    });
    pushFeedPost({
      bannerImage: '/images/w-legs.jpg',
      type: 'house',
      badge: `DÉFI HOUSE • ${modeLabel.toUpperCase()}`,
      content: `Victoire en mode ${modeLabel} sur ${exercise} ! ${reps} validées devant l'IA DEK.`,
      stats: [
        { label: 'Mode', value: modeLabel },
        { label: 'Score', value: `${reps} ${exercise}` },
        { label: 'Gain', value: `+${xpEarned} XP` },
      ],
      reactions: { feu: 2, force: 1, respect: 0 },
    });
    showToast(`Victoire Défi House (${modeLabel}) ! +${xpEarned} XP.`);
  };

  const handleGymDuoComplete = (routineTitle: string, totalSets: number): boolean => {
    const rewarded = commitProgress(
      (u) => ({ ...u, xp: u.xp + 120, disciplineScore: Math.min(100, u.disciplineScore + 1) }),
      { claimKey: `duo:${routineTitle}:${dayKey()}`, session: true },
    );
    if (!rewarded) {
      showToast('Séance Duo déjà validée aujourd’hui pour cette routine.');
      return false;
    }
    pushFeedPost({
      bannerImage: '/images/duo.jpg',
      type: 'house',
      badge: 'GYM BUDDY • DUO LIVE',
      content: `Séance synchronisée « ${routineTitle} » bouclée en duo (${totalSets} séries validées).`,
      stats: [
        { label: 'Séries', value: String(totalSets) },
        { label: 'Duo', value: 'Synchro' },
        { label: 'Gain', value: '+120 XP' },
      ],
      reactions: { feu: 1, force: 2, respect: 1 },
    });
    showToast('Séance Gym Buddy validée (+120 XP) !');
    return true;
  };

  const handleSpotJoin = (author: string, gymName: string) => {
    const rewarded = commitProgress((u) => ({ ...u, xp: u.xp + 25 }), {
      claimKey: `spot:${author}:${gymName}:${dayKey()}`,
    });
    showToast(
      rewarded
        ? `Partenaire confirmé avec ${author} à ${gymName} (+25 XP) !`
        : `Partenaire confirmé avec ${author} à ${gymName}.`,
    );
  };

  // --- UNIVERS 2 : JEUDI TERRAIN & LA SANTÉ ---
  const handleJoinSante = (matchTitle: string) => {
    const rewarded = commitProgress(
      (u) => ({ ...u, xp: u.xp + 50, santePlayed: u.santePlayed + 1 }),
      { claimKey: `sante-join:${matchTitle}` },
    );
    showToast(
      rewarded ? `Inscrit à « ${matchTitle} » (+50 XP).` : `Inscription confirmée à « ${matchTitle} ».`,
    );
  };

  const handleCompleteThursday = (summaryText: string, mvpName: string): boolean => {
    const rewarded = commitProgress(
      (u) => ({
        ...u,
        xp: u.xp + 150,
        santePlayed: u.santePlayed + 1,
        disciplineScore: Math.min(100, u.disciplineScore + 2),
        badges: addBadgeUnique(u.badges, 'Roi du Jeudi'),
      }),
      { claimKey: `thursday:${weekKey()}`, session: true },
    );
    if (!rewarded) {
      showToast('Le bilan du Jeudi est déjà publié cette semaine.');
      return false;
    }
    pushFeedPost({
      bannerImage: '/images/match.jpg',
      type: 'sante',
      badge: 'TERRAIN DU JEUDI • OFFICIEL',
      content: `${summaryText} MVP élu : ${mvpName} (+50 XP).`,
      stats: [
        { label: 'MVP', value: mvpName },
        { label: 'Check-in', value: 'Certifié' },
        { label: 'Gain', value: '+150 XP' },
      ],
      reactions: { feu: 3, force: 2, respect: 2 },
    });
    showToast(`Terrain du Jeudi clôturé ! MVP : ${mvpName} (+150 XP).`);
    return true;
  };

  // --- UNIVERS 5 : RAIDS & PACTES ---
  const handleRaidCheckin = (raidTitle: string, badgeName: string) => {
    const rewarded = commitProgress(
      (u) => ({
        ...u,
        xp: u.xp + 120,
        disciplineScore: Math.min(100, u.disciplineScore + 2),
        badges: addBadgeUnique(u.badges, badgeName),
      }),
      { claimKey: `raid:${raidTitle}`, session: true },
    );
    if (!rewarded) {
      showToast(`Check-in déjà validé pour « ${raidTitle} ».`);
      return;
    }
    pushFeedPost({
      bannerImage: '/images/team.jpg',
      type: 'mission',
      badge: `RAID WEEK-END • ${badgeName.toUpperCase()}`,
      content: `Check-in QR validé sur place pour « ${raidTitle} » ! Badge exclusif débloqué.`,
      stats: [
        { label: 'Badge', value: badgeName },
        { label: 'Discipline', value: '+2%' },
        { label: 'Gain', value: '+120 XP' },
      ],
      reactions: { feu: 2, force: 2, respect: 1 },
    });
    showToast(`Raid validé ! Badge « ${badgeName} » débloqué (+120 XP).`);
  };

  const handlePactAction = (kind: 'checkin' | 'nudge' | 'create', label: string): boolean => {
    if (kind === 'checkin') {
      const rewarded = commitProgress((u) => ({ ...u, xp: u.xp + 40 }), {
        claimKey: `pact:${label}:${dayKey()}`,
        session: true,
      });
      showToast(
        rewarded
          ? 'Séance de pacte validée (+40 XP) !'
          : 'Déjà validé aujourd’hui pour ce pacte : reviens demain',
      );
      return rewarded;
    }
    if (kind === 'nudge') {
      showToast(`Relance envoyée à ${label}`);
      return true;
    }
    const rewarded = commitProgress((u) => ({ ...u, xp: u.xp + 50 }), {
      claimKey: `pact-create:${dayKey()}`,
    });
    showToast(
      rewarded
        ? `Nouveau pacte scellé : « ${label} » (+50 XP) !`
        : `Nouveau pacte scellé : « ${label} » !`,
    );
    return true;
  };

  // --- COACHS, NUTRITION, PROFIL ---
  const handleBookSession = (coachName: string) => {
    const rewarded = commitProgress((u) => ({ ...u, xp: u.xp + 75 }), {
      claimKey: `coach:${coachName}:${weekKey()}`,
    });
    showToast(
      rewarded ? `Séance réservée avec ${coachName} (+75 XP).` : `Séance réservée avec ${coachName}.`,
    );
  };

  const waterTarget = getNutritionPlan(user.goals, user.category).waterTargetGlasses;

  const handleUpdateWater = (delta: number) => {
    const nextGlasses = Math.max(0, Math.min(16, user.waterGlasses + delta));
    commitProgress((u) => ({ ...u, waterGlasses: Math.max(0, Math.min(16, u.waterGlasses + delta)) }));
    if (delta > 0 && nextGlasses >= waterTarget) {
      const rewarded = commitProgress((u) => ({ ...u, xp: u.xp + 20 }), {
        claimKey: `water:${dayKey()}`,
      });
      if (rewarded) showToast('Objectif hydratation atteint ! (+20 XP)');
    }
  };

  const handleToggleMeal = (mealId: string) => {
    const wasChecked = user.mealsChecked.includes(mealId);
    commitProgress((u) => {
      const exists = u.mealsChecked.includes(mealId);
      return {
        ...u,
        mealsChecked: exists ? u.mealsChecked.filter((id) => id !== mealId) : [...u.mealsChecked, mealId],
      };
    });
    if (!wasChecked) {
      // +15 XP une seule fois par repas et par jour (décocher/recocher ne rapporte plus rien)
      commitProgress((u) => ({ ...u, xp: u.xp + 15 }), { claimKey: `meal:${dayKey()}:${mealId}` });
    }
  };

  const handleUpdateAvatar = (avatar: UserAvatarConfig) => {
    setUser((u) => ({ ...u, avatar }));
    showToast('Avatar mis à jour !');
  };

  const handleCreatePost = (content: string, badge: string) => {
    pushFeedPost({ type: 'coach', badge, content, stats: [], reactions: { feu: 0, force: 0, respect: 0 } });
    showToast('Publication partagée sur le réseau DEK !');
  };

  const handleReact = (postId: string, key: FeedReaction) => {
    setFeed((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p;
        const reactions = { ...p.reactions };
        if (p.myReaction) reactions[p.myReaction] = Math.max(0, reactions[p.myReaction] - 1);
        if (p.myReaction === key) return { ...p, reactions, myReaction: undefined };
        reactions[key] += 1;
        return { ...p, reactions, myReaction: key };
      }),
    );
  };

  // --- SÉANCES GUIDÉES & PROFIL PHYSIQUE ---
  const handleToggleSaveWorkout = (id: string) => {
    const saved = user.savedWorkouts.includes(id);
    setUser((u) => ({
      ...u,
      savedWorkouts: u.savedWorkouts.includes(id)
        ? u.savedWorkouts.filter((w) => w !== id)
        : [...u.savedWorkouts, id],
    }));
    showToast(saved ? 'Retirée des favoris' : 'Ajoutée à tes favoris');
  };

  /** Fin de séance guidée : stats + XP (une fois par séance et par jour). Retourne l'XP accordée. */
  const handleWorkoutComplete = (programId: string, result: WorkoutResult): number => {
    const program = getProgram(programId);
    if (!program) return 0;
    // Anti-triche : il faut avoir validé au moins 60 % des exercices (pas seulement les passer)
    const enoughDone = result.exercisesDone >= Math.ceil(result.totalSteps * MIN_VALIDATED_RATIO);
    if (!enoughDone) {
      showToast('Trop d’exercices passés : séance non comptée, retente-la en entier');
      return 0;
    }
    commitProgress(
      (u) => ({
        ...u,
        workoutsDone: { ...u.workoutsDone, [programId]: (u.workoutsDone[programId] ?? 0) + 1 },
      }),
      { session: true, kcal: result.kcal },
    );
    const rewarded = commitProgress(
      (u) => ({ ...u, xp: u.xp + program.xp, disciplineScore: Math.min(100, u.disciplineScore + 1) }),
      { claimKey: `workout:${programId}:${dayKey()}` },
    );
    if (rewarded) {
      pushFeedPost({
        bannerImage: program.image,
        type: 'house',
        badge: `SÉANCE GUIDÉE • ${program.level.toUpperCase()}`,
        content: `« ${program.title} » bouclée en ${Math.round(result.durationSec / 60)} min : ${result.exercisesDone} exercices validés.`,
        stats: [
          { label: 'Durée', value: `${Math.round(result.durationSec / 60)} min` },
          { label: 'Calories', value: `${result.kcal} kcal` },
          { label: 'Gain', value: `+${program.xp} XP` },
        ],
        reactions: { feu: 1, force: 1, respect: 0 },
      });
    }
    return rewarded ? program.xp : 0;
  };

  const handleBodyComplete = (body: BodyProfile) => {
    setIsEditingBody(false);
    setUser((u) => ({ ...u, body, bodyAsked: true }));
    showToast('Profil physique enregistré : calories & hydratation calibrées !');
  };

  const handleIntroDone = () => {
    try {
      window.localStorage.setItem(INTRO_STORAGE_KEY, '1');
    } catch {
      // Ignore
    }
    setIntroSeen(true);
  };

  const navValue: DekNavValue = {
    openWorkout: (id) => pushOverlay({ kind: 'workout', id }),
    startWorkout: (id) => pushOverlay({ kind: 'player', id }),
    openCoach: (id) => pushOverlay({ kind: 'coach', id }),
    openLeaderboard: () => pushOverlay({ kind: 'leaderboard' }),
    openTrophies: () => pushOverlay({ kind: 'trophies' }),
    editBodyProfile: () => setIsEditingBody(true),
    closeOverlay,
    closeAllOverlays,
    goTab,
  };

  const renderOverlay = (entry: OverlayEntry) => {
    if (entry.kind === 'workout' || entry.kind === 'player') {
      const program = getProgram(entry.id);
      if (!program) return null;
      if (entry.kind === 'player') {
        return (
          <WorkoutPlayer
            program={program}
            weightKg={user.body?.weightKg}
            onComplete={(result) => handleWorkoutComplete(program.id, result)}
            onExit={closeOverlay}
          />
        );
      }
      return (
        <WorkoutDetailScreen
          program={program}
          saved={user.savedWorkouts.includes(program.id)}
          doneCount={user.workoutsDone[program.id] ?? 0}
          onBack={closeOverlay}
          onToggleSave={() => handleToggleSaveWorkout(program.id)}
          onStart={() => pushOverlay({ kind: 'player', id: program.id })}
          onOpenCoach={(id) => pushOverlay({ kind: 'coach', id })}
        />
      );
    }
    if (entry.kind === 'coach') {
      const coach = INITIAL_COACHS.find((c) => c.id === entry.id);
      if (!coach) return null;
      return (
        <CoachProfileScreen
          coach={coach}
          onBack={closeOverlay}
          onOpenWorkout={(id) => pushOverlay({ kind: 'workout', id })}
          onBook={handleBookSession}
        />
      );
    }
    if (entry.kind === 'trophies') return <TrophiesScreen user={userView} onBack={closeOverlay} />;
    return <LeaderboardScreen user={userView} onBack={closeOverlay} />;
  };

  const todayProgram = getRecommendedProgram(user.goals[0], getTierIndex(user.category));
  type QuickId = 'today' | 'library' | 'outdoor' | 'house' | 'water' | 'thursday' | 'ladder' | 'post';
  const QUICK_ACTIONS: { id: QuickId; label: string; sub: string; icon: React.ReactNode }[] = [
    { id: 'today', label: 'Séance du jour', sub: `${todayProgram.durationMin} min • ${todayProgram.level}`, icon: <Play className="h-5 w-5" /> },
    { id: 'library', label: 'Séances guidées', sub: '6 programmes', icon: <DumbbellLift className="h-5 w-5" /> },
    { id: 'outdoor', label: 'Mission Outdoor', sub: 'Carte 3D & GPS', icon: <Compass className="h-5 w-5" /> },
    { id: 'house', label: 'Défi House IA', sub: 'Duel caméra', icon: <Sword className="h-5 w-5" /> },
    { id: 'water', label: '+250 ml d’eau', sub: `${user.waterGlasses} verre(s) aujourd’hui`, icon: <DropWave className="h-5 w-5" /> },
    { id: 'thursday', label: 'Terrain du Jeudi', sub: 'Check-in & live', icon: <SoccerBall className="h-5 w-5" /> },
    { id: 'ladder', label: 'Classement', sub: 'Podium de la semaine', icon: <TrophyShine className="h-5 w-5" /> },
    { id: 'post', label: 'Publier', sub: 'Actu ou défi', icon: <PaperPlaneRight className="h-5 w-5" /> },
  ];

  const runQuickAction = (id: QuickId) => {
    switch (id) {
      case 'today':
        pushOverlay({ kind: 'player', id: todayProgram.id });
        break;
      case 'library':
        goTab('workouts');
        break;
      case 'outdoor':
        goTab('missions');
        break;
      case 'house':
        setArenaNav((prev) => ({ sub: 'house', n: prev.n + 1 }));
        goTab('house');
        break;
      case 'water':
        handleUpdateWater(1);
        setQuickOpen(false);
        if (user.waterGlasses + 1 < waterTarget) {
          showToast(`Hydratation : ${user.waterGlasses + 1}/${waterTarget} verres`);
        }
        break;
      case 'thursday':
        setNetworkNav((prev) => ({ sub: 'sante', n: prev.n + 1 }));
        goTab('network');
        break;
      case 'ladder':
        pushOverlay({ kind: 'leaderboard' });
        break;
      case 'post':
        setNetworkNav((prev) => ({ sub: 'profil', n: prev.n + 1 }));
        goTab('network');
        break;
    }
  };

  const handleOpenArenaFromHome = (sub: 'house' | 'gym') => {
    setArenaNav((prev) => ({ sub, n: prev.n + 1 }));
    setActiveTab('house');
  };

  const openNetwork = (sub: NetworkSubTab) => {
    setNetworkNav((prev) => ({ sub, n: prev.n + 1 }));
    goTab('network');
  };

  return (
    <MotionConfig reducedMotion="user">
      <PhoneSimulatorFrame>
        <div className="dek-ambient relative flex h-full w-full flex-col overflow-hidden bg-ink text-fg">
          <div className="dek-aurora" aria-hidden>
            <span className="b1"><i /></span>
            <span className="b2"><i /></span>
            <span className="b3"><i /></span>
          </div>
          {/* Splash Screen animé */}
          <AnimatePresence>
            {showSplash && (
              <motion.div
                key="dek-splash"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={() => setShowSplash(false)}
                className="absolute inset-0 z-[800] flex cursor-pointer flex-col items-center justify-center bg-ink"
              >
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: 'easeOut' }}
                  className="flex flex-col items-center"
                >
                  <h1 className="text-[56px] font-extrabold leading-none tracking-[-0.02em] text-fg">DEK</h1>
                  <p className="mt-2 text-[15px] font-semibold tracking-[0.32em] text-mute">FITNESS</p>
                </motion.div>

                <div className="mt-10 h-[3px] w-32 overflow-hidden rounded-full bg-rim">
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '0%' }}
                    transition={{ duration: 0.9, ease: 'easeInOut' }}
                    className="h-full w-full rounded-full bg-lime"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!user.isAuthenticated ? (
            introSeen ? (
              <OnboardingAuthView onAuthComplete={handleAuthComplete} />
            ) : (
              <OnboardingIntro onDone={handleIntroDone} />
            )
          ) : !user.bodyAsked || isEditingBody ? (
            <BodyProfileView
              initial={user.body}
              onComplete={handleBodyComplete}
              onSkip={() => {
                setIsEditingBody(false);
                setUser((u) => ({ ...u, bodyAsked: true }));
              }}
            />
          ) : !user.initiationCompleted || isRetakingInitiation ? (
            <ViewBoundary resetKey="initiation">
              <Suspense fallback={<ViewLoader />}>
                <InitiationTestView
                  userName={user.name}
                  isRetake={isRetakingInitiation}
                  onCancelRetake={() => setIsRetakingInitiation(false)}
                  onComplete={handleInitiationComplete}
                />
              </Suspense>
            </ViewBoundary>
          ) : (
            <DekNavContext.Provider value={navValue}>
              <div id="dek-overlay-root" className="pointer-events-none absolute inset-0 z-[750]" />

              <main className="safe-top relative min-h-0 flex-1 overflow-y-auto no-scrollbar bg-transparent px-5 pb-6 pt-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="h-full"
                  >
                    <ViewBoundary resetKey={activeTab}>
                      <Suspense fallback={<ViewLoader />}>
                        {activeTab === 'home' && (
                          <HomeView
                            user={userView}
                            onNavigate={(t) => setActiveTab(t)}
                            onOpenArena={handleOpenArenaFromHome}
                            onOpenThursday={() => openNetwork('sante')}
                            onOpenRaids={() => openNetwork('raids')}
                            onRetakeInitiation={() => setIsRetakingInitiation(true)}
                            onToggleSaveWorkout={handleToggleSaveWorkout}
                          />
                        )}
                        {activeTab === 'workouts' && (
                          <WorkoutsLibraryView user={userView} onToggleSave={handleToggleSaveWorkout} />
                        )}
                        {activeTab === 'missions' && (
                          <MissionsView
                            userCategory={user.category}
                            missionsInCurrentTier={user.missionsInCurrentTier}
                            onRequestRetakeTest={() => setIsRetakingInitiation(true)}
                            onMissionComplete={handleMissionComplete}
                            onMissionFail={handleMissionFail}
                            onTerritoryCapture={handleTerritoryCapture}
                          />
                        )}
                        {activeTab === 'house' && (
                          <ArenaHubView
                            key={`arena-${arenaNav.n}`}
                            initialSubTab={arenaNav.sub}
                            userCategory={user.category}
                            userAvatar={user.avatar}
                            userName={user.name}
                            onWinDuel={handleWinDuel}
                            onDuoComplete={handleGymDuoComplete}
                            onSpotJoin={handleSpotJoin}
                          />
                        )}
                        {activeTab === 'nutrition' && (
                          <ScreenHeader title="Nutrition" onBack={() => setActiveTab('home')} />
                        )}
                        {activeTab === 'nutrition' && (
                          <NutritionView
                            user={userView}
                            onUpdateWater={handleUpdateWater}
                            onToggleMeal={handleToggleMeal}
                          />
                        )}
                        {activeTab === 'network' && (
                          <NetworkHubView
                            key={`network-${networkNav.n}`}
                            user={userView}
                            feed={feed}
                            initialSubTab={networkNav.sub}
                            onJoinSante={handleJoinSante}
                            onCompleteThursday={handleCompleteThursday}
                            onRaidCheckin={handleRaidCheckin}
                            onPactAction={handlePactAction}
                            onBookSession={handleBookSession}
                            onRetakeInitiation={() => setIsRetakingInitiation(true)}
                            onUpdateAvatar={handleUpdateAvatar}
                            onCreatePost={handleCreatePost}
                            onReact={handleReact}
                            onNavigateTab={(t) => setActiveTab(t)}
                            onLogout={handleLogout}
                          />
                        )}
                      </Suspense>
                    </ViewBoundary>
                  </motion.div>
                </AnimatePresence>
              </main>

              {/* Barre du bas : bande card, 4 onglets + bouton « + » central surélevé */}
              <nav className="safe-bottom relative shrink-0 rounded-t-[28px] glass-strong px-3 pb-3 pt-2" aria-label="Navigation principale">
                <div className="grid grid-cols-5 items-end">
                  {[...NAV_LEFT, null, ...NAV_RIGHT].map((item) => {
                    if (!item) {
                      return (
                        <div key="fab" className="flex justify-center">
                          <motion.button
                            whileTap={{ scale: 0.92 }}
                            onClick={() => setQuickOpen((o) => !o)}
                            aria-label={quickOpen ? 'Fermer le menu rapide' : 'Démarrer une activité'}
                            aria-expanded={quickOpen}
                            className="-mt-7 flex h-14 w-14 items-center justify-center rounded-full bg-lime ring-[6px] ring-ink"
                          >
                            <PlusMorph open={quickOpen} className="h-6 w-6" />
                          </motion.button>
                        </div>
                      );
                    }
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        whileTap={{ scale: 0.92 }}
                        onClick={() => goTab(item.id)}
                        aria-current={active ? 'page' : undefined}
                        className={`relative flex flex-col items-center justify-center gap-1 py-1.5 transition-colors ${
                          active ? 'text-fg' : 'text-faint'
                        }`}
                      >
                        <motion.span
                          key={`${item.id}-${active}`}
                          initial={active ? { y: 6, scale: 0.8 } : false}
                          animate={{ y: 0, scale: 1 }}
                          transition={{ type: 'spring', stiffness: 520, damping: 16 }}
                        >
                          <Icon className="h-[22px] w-[22px]" />
                        </motion.span>
                        <span className="text-[11px] font-semibold leading-none">{item.label}</span>
                        <span className="flex h-1 items-center justify-center">
                          {active && (
                            <motion.span
                              layoutId="dekActiveTabDot"
                              transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                              className="h-1 w-1 rounded-full bg-lime"
                            />
                          )}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </nav>

              {/* Menu d'actions rapides (bouton ＋) */}
              <BottomSheet open={quickOpen} onClose={() => setQuickOpen(false)} title="Démarrer une activité">
                <motion.div
                  className="flex flex-col gap-3"
                  initial="hidden"
                  animate="show"
                  variants={{ hidden: {}, show: { transition: { staggerChildren: 0.03 } } }}
                >
                  {QUICK_ACTIONS.filter((a) => a.id === 'today').map((a) => (
                    <motion.div
                      key={a.id}
                      variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                    >
                      <button
                        onClick={() => runQuickAction(a.id)}
                        className="flex w-full items-center justify-between gap-3 rounded-full bg-lime px-6 py-3 text-left text-on-lime transition active:scale-[0.98]"
                      >
                        <span className="min-w-0">
                          <span className="block truncate text-[15px] font-bold leading-5">{a.label}</span>
                          <span className="block truncate text-[12px] font-medium leading-4 opacity-70">{a.sub}</span>
                        </span>
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-on-lime text-lime">
                          <ArrowRight weight="bold" className="h-4 w-4" />
                        </span>
                      </button>
                    </motion.div>
                  ))}
                  <div className="grid grid-cols-2 gap-3">
                    {QUICK_ACTIONS.filter((a) => a.id !== 'today').map((a) => (
                      <motion.button
                        key={a.id}
                        variants={{ hidden: { opacity: 0, y: 8 }, show: { opacity: 1, y: 0 } }}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => runQuickAction(a.id)}
                        className="min-w-0 rounded-[20px] bg-tile p-4 text-left"
                      >
                        <span className="mb-3 flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-lime">{a.icon}</span>
                        <span className="block truncate text-[14px] font-bold leading-5 text-fg">{a.label}</span>
                        <span className="mt-0.5 block truncate text-[12px] font-medium leading-4 text-mute">{a.sub}</span>
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              </BottomSheet>

              {/* Pile d'écrans plein cadre */}
              <div className="pointer-events-none absolute inset-0 z-[740]">
                <AnimatePresence>
                  {overlays.map((entry, i) => (
                    <motion.div
                      key={`${i}-${entry.kind}-${'id' in entry ? entry.id : ''}`}
                      variants={entry.kind === 'player' ? riseScreen : pushScreen}
                      initial="initial"
                      animate="animate"
                      exit="exit"
                      className="pointer-events-auto absolute inset-0 overflow-hidden bg-ink"
                    >
                      <ViewBoundary resetKey={`${entry.kind}-${i}`}>
                        <Suspense fallback={<ViewLoader />}>{renderOverlay(entry)}</Suspense>
                      </ViewBoundary>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </DekNavContext.Provider>
          )}

          {/* Notification Toast (visible aussi pendant le test d'initiation) */}
          <AnimatePresence>
            {toast && (
              <motion.div
                key={toast}
                role="status"
                aria-live="polite"
                initial={{ opacity: 0, y: -12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: 'easeOut' }}
                className="pointer-events-none absolute left-5 right-5 top-12 z-[760] flex items-center justify-center"
              >
                <div className="glass-strong rounded-full px-4 py-2.5 text-center text-[13px] font-semibold leading-[18px] text-fg">
                  {toast}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </PhoneSimulatorFrame>
    </MotionConfig>
  );
}
