import { useEffect, useState } from 'react';
import { AnimatePresence, motion, MotionConfig } from 'framer-motion';
import {
  BowlFood,
  Compass,
  Fire,
  House,
  ShieldCheck,
  Sword,
  UsersThree,
} from './components/DekIcons';
import { ArenaHubView } from './components/ArenaHubView';
import { HomeView } from './components/HomeView';
import { InitiationTestView } from './components/InitiationTestView';
import { MissionsView } from './components/MissionsView';
import { NetworkHubView, type NetworkSubTab } from './components/NetworkHubView';
import { NutritionView } from './components/NutritionView';
import { OnboardingAuthView } from './components/OnboardingAuthView';
import { PhoneSimulatorFrame } from './components/PhoneSimulatorFrame';
import { UserAvatar } from './components/UserAvatar';
import { INITIAL_FEED, INITIAL_USER } from './data/mockData';
import type {
  AuthProvider,
  FeedPost,
  InitiationResult,
  MissionDifficulty,
  TabId,
  UserAvatarConfig,
  UserProfile,
} from './types/dek';
import { getTierIndex, TIER_COLORS, TIER_ORDER } from './utils/categorization';

const STORAGE_KEY = 'dek_fitness_user_v3';

const NAV_ITEMS: { id: TabId; label: string; icon: typeof Compass }[] = [
  { id: 'home', label: 'Accueil', icon: House },
  { id: 'missions', label: 'Outdoor', icon: Compass },
  { id: 'house', label: 'Arène', icon: Sword },
  { id: 'nutrition', label: 'Nutrition', icon: BowlFood },
  { id: 'network', label: 'Réseau', icon: UsersThree },
];

function loadSavedUser(): UserProfile {
  if (typeof window === 'undefined') return INITIAL_USER;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_USER;
    const parsed = JSON.parse(raw) as Partial<UserProfile>;
    return {
      ...INITIAL_USER,
      ...parsed,
      badges: Array.isArray(parsed.badges) ? parsed.badges : INITIAL_USER.badges,
      avatar: { ...INITIAL_USER.avatar, ...(parsed.avatar ?? {}) },
    };
  } catch {
    return INITIAL_USER;
  }
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>('home');
  const [arenaSubTab, setArenaSubTab] = useState<'house' | 'gym'>('house');
  const [networkSubTab, setNetworkSubTab] = useState<NetworkSubTab>('sante');
  const [user, setUser] = useState<UserProfile>(loadSavedUser);
  const [isRetakingInitiation, setIsRetakingInitiation] = useState(false);
  const [feed, setFeed] = useState<FeedPost[]>(INITIAL_FEED);
  const [toast, setToast] = useState<string | null>(null);

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

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3400);
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
    const cleanHandle =
      '@' +
      payload.name
        .toLowerCase()
        .replace(/[^a-z0-9_]/g, '_')
        .slice(0, 14);

    setUser((u) => ({
      ...u,
      isAuthenticated: true,
      name: payload.name,
      handle: cleanHandle || '@dek_athlete',
      city: payload.city,
      authProvider: payload.authProvider,
      contactValue: payload.contactValue,
      avatar: payload.avatar,
    }));
  };

  const handleInitiationComplete = (result: InitiationResult) => {
    const isFirstTime = !user.initiationCompleted;
    setUser((u) => ({
      ...u,
      initiationCompleted: true,
      category: result.assignedCategory,
      missionsInCurrentTier: 0,
      goals: result.goals,
      targetMuscles: result.targetMuscles,
      initiationResult: result,
      xp: isFirstTime ? u.xp + 100 : u.xp,
    }));
    setIsRetakingInitiation(false);
    setActiveTab('home');
    showToast(
      `Programme & catégorie ${result.assignedCategory} prêts !${isFirstTime ? ' (+100 XP)' : ''}`,
    );
  };

  const handleLogout = () => {
    try {
      window.localStorage.removeItem(STORAGE_KEY);
    } catch {
      // Ignore
    }
    setIsRetakingInitiation(false);
    setUser(INITIAL_USER);
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
    let promotedTo: MissionDifficulty | null = null;

    setUser((u) => {
      const sameTier = tier === u.category;
      const nextCount = sameTier ? u.missionsInCurrentTier + 1 : u.missionsInCurrentTier;
      const currentIdx = getTierIndex(u.category);
      const canPromote = sameTier && nextCount >= 2 && currentIdx < TIER_ORDER.length - 1;

      const nextCategory = canPromote ? TIER_ORDER[currentIdx + 1] : u.category;
      if (canPromote) promotedTo = nextCategory;

      return {
        ...u,
        xp: u.xp + xpEarned,
        missionsCompleted: u.missionsCompleted + 1,
        disciplineScore: Math.min(100, u.disciplineScore + 1),
        category: nextCategory,
        missionsInCurrentTier: canPromote ? 0 : nextCount,
      };
    });

    const initials = user.name.slice(0, 2).toUpperCase() || 'DK';
    setFeed((prev) => [
      {
        id: 'f_' + Date.now(),
        author: user.name,
        initials,
        avatarPreset: user.avatar.mode === 'preset' ? user.avatar.presetId : undefined,
        bannerImage: '/images/banner-home.jpg',
        timeAgo: 'À l’instant',
        type: 'mission',
        badge: `${modeLabel.toUpperCase()} • ${tier.toUpperCase()}`,
        content: `Sortie ${modeLabel} validée ! Parcours de ${distanceKm} km terminé à la position #${rankPos}.`,
        stats: [
          { label: 'Distance', value: `${distanceKm} km` },
          { label: 'Classement', value: `#${rankPos}` },
          { label: 'Gain', value: `+${xpEarned} XP` },
        ],
        reactions: { feu: 1, force: 1, respect: 1 },
      },
      ...prev,
    ]);

    if (promotedTo) {
      showToast(`PALIER DÉBLOQUÉ ! Tu passes en catégorie ${promotedTo} !`);
    } else {
      showToast(`${modeLabel} réussie ! +${xpEarned} XP ajoutés.`);
    }
  };

  const handleMissionFail = (reason?: string) => {
    setUser((u) => ({
      ...u,
      missionsFailed: u.missionsFailed + 1,
      disciplineScore: Math.max(0, u.disciplineScore - 2),
    }));
    showToast(reason ? `${reason} • Discipline -2%` : 'Mission échouée : Discipline -2%.');
  };

  const handleTerritoryCapture = (zoneName: string) => {
    const badgeName = `Conquérant ${zoneName}`;
    setUser((u) => ({
      ...u,
      xp: u.xp + 150,
      badges: addBadgeUnique(u.badges, badgeName),
    }));
    const initials = user.name.slice(0, 2).toUpperCase() || 'DK';
    setFeed((prev) => [
      {
        id: 'f_' + Date.now(),
        author: user.name,
        initials,
        avatarPreset: user.avatar.mode === 'preset' ? user.avatar.presetId : undefined,
        bannerImage: '/images/banner-home.jpg',
        timeAgo: 'À l’instant',
        type: 'mission',
        badge: `TERRITOIRE CONQUIS`,
        content: `Prise de contrôle de ${zoneName} pour DEK Warriors ! Badge « ${badgeName} » débloqué.`,
        stats: [
          { label: 'Zone', value: zoneName },
          { label: 'Bonus', value: '+150 pts' },
          { label: 'Gain', value: '+150 XP' },
        ],
        reactions: { feu: 2, force: 2, respect: 1 },
      },
      ...prev,
    ]);
    showToast(`Badge débloqué : ${badgeName} (+150 XP) !`);
  };

  // --- UNIVERS 3 & 4 : ARÈNE (DÉFI HOUSE & GYM BUDDY) ---
  const handleWinDuel = (
    xpEarned: number,
    exercise: string,
    reps: number,
    modeLabel = '1v1 K.O. 60s',
  ) => {
    setUser((u) => ({
      ...u,
      xp: u.xp + xpEarned,
      houseWins: u.houseWins + 1,
    }));
    const initials = user.name.slice(0, 2).toUpperCase() || 'DK';
    setFeed((prev) => [
      {
        id: 'f_' + Date.now(),
        author: user.name,
        initials,
        avatarPreset: user.avatar.mode === 'preset' ? user.avatar.presetId : undefined,
        bannerImage: '/images/banner-house.jpg',
        timeAgo: 'À l’instant',
        type: 'house',
        badge: `DÉFI HOUSE • ${modeLabel.toUpperCase()}`,
        content: `Victoire en mode ${modeLabel} sur ${exercise} ! ${reps} validées devant l'IA DEK.`,
        stats: [
          { label: 'Mode', value: modeLabel },
          { label: 'Score', value: `${reps} ${exercise}` },
          { label: 'Gain', value: `+${xpEarned} XP` },
        ],
        reactions: { feu: 2, force: 1, respect: 0 },
      },
      ...prev,
    ]);
    showToast(`Victoire Défi House (${modeLabel}) ! +${xpEarned} XP.`);
  };

  const handleGymDuoComplete = (routineTitle: string, totalSets: number) => {
    setUser((u) => ({
      ...u,
      xp: u.xp + 120,
      disciplineScore: Math.min(100, u.disciplineScore + 1),
    }));
    const initials = user.name.slice(0, 2).toUpperCase() || 'DK';
    setFeed((prev) => [
      {
        id: 'f_' + Date.now(),
        author: user.name,
        initials,
        avatarPreset: user.avatar.mode === 'preset' ? user.avatar.presetId : undefined,
        bannerImage: '/images/banner-house.jpg',
        timeAgo: 'À l’instant',
        type: 'house',
        badge: 'GYM BUDDY • DUO LIVE',
        content: `Séance synchronisée « ${routineTitle} » bouclée en duo (${totalSets} séries validées).`,
        stats: [
          { label: 'Séries', value: String(totalSets) },
          { label: 'Duo', value: 'Synchro ✓' },
          { label: 'Gain', value: '+120 XP' },
        ],
        reactions: { feu: 1, force: 2, respect: 1 },
      },
      ...prev,
    ]);
    showToast(`Séance Gym Buddy validée (+120 XP) !`);
  };

  const handleSpotJoin = (author: string, gymName: string) => {
    setUser((u) => ({ ...u, xp: u.xp + 25 }));
    showToast(`Partenaire confirmé avec ${author} à ${gymName} (+25 XP) !`);
  };

  // --- UNIVERS 2 : JEUDI TERRAIN & LA SANTÉ ---
  const handleJoinSante = (matchTitle: string) => {
    setUser((u) => ({
      ...u,
      xp: u.xp + 50,
      santePlayed: u.santePlayed + 1,
    }));
    showToast(`Inscrit à « ${matchTitle} » (+50 XP).`);
  };

  const handleCompleteThursday = (summaryText: string, mvpName: string) => {
    setUser((u) => ({
      ...u,
      xp: u.xp + 150,
      santePlayed: u.santePlayed + 1,
      disciplineScore: Math.min(100, u.disciplineScore + 2),
      badges: addBadgeUnique(u.badges, 'Roi du Jeudi'),
    }));
    const initials = user.name.slice(0, 2).toUpperCase() || 'DK';
    setFeed((prev) => [
      {
        id: 'f_' + Date.now(),
        author: user.name,
        initials,
        avatarPreset: user.avatar.mode === 'preset' ? user.avatar.presetId : undefined,
        bannerImage: '/images/banner-sante.jpg',
        timeAgo: 'À l’instant',
        type: 'sante',
        badge: 'TERRAIN DU JEUDI • OFFICIEL',
        content: `${summaryText} MVP élu : ${mvpName} (+50 XP).`,
        stats: [
          { label: 'MVP', value: mvpName },
          { label: 'Check-in', value: 'Certifié ✓' },
          { label: 'Gain', value: '+150 XP' },
        ],
        reactions: { feu: 3, force: 2, respect: 2 },
      },
      ...prev,
    ]);
    showToast(`Terrain du Jeudi clôturé ! MVP : ${mvpName} (+150 XP).`);
  };

  // --- UNIVERS 5 : RAIDS & PACTES ---
  const handleRaidCheckin = (raidTitle: string, badgeName: string) => {
    setUser((u) => ({
      ...u,
      xp: u.xp + 120,
      disciplineScore: Math.min(100, u.disciplineScore + 2),
      badges: addBadgeUnique(u.badges, badgeName),
    }));
    const initials = user.name.slice(0, 2).toUpperCase() || 'DK';
    setFeed((prev) => [
      {
        id: 'f_' + Date.now(),
        author: user.name,
        initials,
        avatarPreset: user.avatar.mode === 'preset' ? user.avatar.presetId : undefined,
        bannerImage: '/images/banner-home.jpg',
        timeAgo: 'À l’instant',
        type: 'mission',
        badge: `RAID WEEK-END • ${badgeName.toUpperCase()}`,
        content: `Check-in QR validé sur place pour « ${raidTitle} » ! Badge exclusif débloqué.`,
        stats: [
          { label: 'Badge', value: badgeName },
          { label: 'Discipline', value: '+2%' },
          { label: 'Gain', value: '+120 XP' },
        ],
        reactions: { feu: 2, force: 2, respect: 1 },
      },
      ...prev,
    ]);
    showToast(`Raid validé ! Badge « ${badgeName} » débloqué (+120 XP).`);
  };

  const handlePactAction = (kind: 'checkin' | 'nudge' | 'create', label: string) => {
    if (kind === 'checkin') {
      setUser((u) => ({ ...u, xp: u.xp + 40 }));
      showToast(`Séance de pacte validée (+40 XP) !`);
    } else if (kind === 'nudge') {
      showToast(`Relance envoyée à ${label} 🔔`);
    } else {
      setUser((u) => ({ ...u, xp: u.xp + 50 }));
      showToast(`Nouveau pacte scellé : « ${label} » (+50 XP) !`);
    }
  };

  // --- COACHS, NUTRITION, PROFIL ---
  const handleBookSession = (coachName: string) => {
    setUser((u) => ({ ...u, xp: u.xp + 75 }));
    showToast(`Séance réservée avec ${coachName} (+75 XP).`);
  };

  const handleUpdateWater = (delta: number) => {
    setUser((u) => ({
      ...u,
      waterGlasses: Math.max(0, Math.min(16, u.waterGlasses + delta)),
    }));
  };

  const handleToggleMeal = (mealId: string) => {
    setUser((u) => {
      const exists = u.mealsChecked.includes(mealId);
      const nextMeals = exists
        ? u.mealsChecked.filter((id) => id !== mealId)
        : [...u.mealsChecked, mealId];
      return {
        ...u,
        mealsChecked: nextMeals,
        xp: !exists ? u.xp + 15 : u.xp,
      };
    });
  };

  const handleUpdateAvatar = (avatar: UserAvatarConfig) => {
    setUser((u) => ({ ...u, avatar }));
    showToast('Avatar mis à jour !');
  };

  const handleCreatePost = (content: string, badge: string) => {
    const initials = user.name.slice(0, 2).toUpperCase() || 'DK';
    setFeed((prev) => [
      {
        id: 'f_' + Date.now(),
        author: user.name,
        initials,
        avatarPreset: user.avatar.mode === 'preset' ? user.avatar.presetId : undefined,
        timeAgo: 'À l’instant',
        type: 'coach',
        badge,
        content,
        stats: [],
        reactions: { feu: 1, force: 0, respect: 0 },
      },
      ...prev,
    ]);
    showToast('Publication partagée sur le réseau DEK !');
  };

  const handleOpenArenaFromHome = (sub: 'house' | 'gym') => {
    setArenaSubTab(sub);
    setActiveTab('house');
  };

  const handleOpenThursdayFromHome = () => {
    setNetworkSubTab('sante');
    setActiveTab('network');
  };

  const handleOpenRaidsFromHome = () => {
    setNetworkSubTab('raids');
    setActiveTab('network');
  };

  const handleOpenCoachsFromHome = () => {
    setNetworkSubTab('coachs');
    setActiveTab('network');
  };

  return (
    <MotionConfig reducedMotion="user">
      <PhoneSimulatorFrame>
        <div className="relative flex h-full w-full flex-col overflow-hidden bg-[#080A0E] text-slate-100">
          {/* Splash Screen animé */}
          <AnimatePresence>
            {showSplash && (
              <motion.div
                key="dek-splash"
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.04 }}
                transition={{ duration: 0.25, ease: 'easeOut' }}
                onClick={() => setShowSplash(false)}
                className="absolute inset-0 z-[800] flex cursor-pointer flex-col items-center justify-center bg-[#080A0E]"
              >
                <motion.div
                  initial={{ scale: 0.72, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 360, damping: 22 }}
                  className="flex flex-col items-center"
                >
                  <div className="font-hud flex h-20 w-20 items-center justify-center rounded-3xl bg-[#C8FF00] text-3xl font-black tracking-tighter text-black shadow-[0_0_40px_rgba(200,255,0,0.35)]">
                    DEK
                  </div>
                  <h1 className="font-hud mt-4 text-2xl font-bold tracking-[0.2em] text-white">
                    DEK <span className="text-[#C8FF00]">FITNESS</span>
                  </h1>
                  <p className="mt-1 text-xs text-slate-400">5 Univers Sportifs &amp; Réseau</p>
                </motion.div>

                <div className="mt-8 h-1 w-40 overflow-hidden rounded-full bg-white/10">
                  <motion.div
                    initial={{ x: '-100%' }}
                    animate={{ x: '0%' }}
                    transition={{ duration: 0.9, ease: 'easeInOut' }}
                    className="h-full w-full rounded-full bg-gradient-to-r from-[#00E5FF] to-[#C8FF00]"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {!user.isAuthenticated ? (
            <OnboardingAuthView onAuthComplete={handleAuthComplete} />
          ) : !user.initiationCompleted || isRetakingInitiation ? (
            <InitiationTestView
              userName={user.name}
              isRetake={isRetakingInitiation}
              onCancelRetake={() => setIsRetakingInitiation(false)}
              onComplete={handleInitiationComplete}
            />
          ) : (
            <>
              {/* Header compact */}
              <header className="safe-top shrink-0 border-b border-white/10 bg-[#080A0E]/95 px-3 py-2 backdrop-blur-md">
                <div className="flex items-center justify-between gap-1.5">
                  <button
                    onClick={() => {
                      setNetworkSubTab('profil');
                      setActiveTab('network');
                    }}
                    className="flex items-center gap-2 text-left"
                  >
                    <UserAvatar avatar={user.avatar} size="xs" />
                    <div>
                      <h1 className="font-hud text-sm font-bold leading-none tracking-wider text-white">
                        DEK <span className="text-[#C8FF00]">FITNESS</span>
                      </h1>
                      <span
                        className="font-hud text-[10px] font-bold uppercase"
                        style={{ color: TIER_COLORS[user.category] }}
                      >
                        {user.category}
                      </span>
                    </div>
                  </button>

                  <div className="flex items-center gap-1.5">
                    <motion.div
                      key={`disc-${user.disciplineScore}`}
                      initial={{ scale: 1.15 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 450, damping: 20 }}
                      className="flex items-center gap-1 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-2 py-1 text-[11px] font-bold text-emerald-400"
                    >
                      <ShieldCheck weight="duotone" className="h-3.5 w-3.5" />
                      <span className="font-hud">{user.disciplineScore}%</span>
                    </motion.div>

                    <motion.div
                      key={`xp-${user.xp}`}
                      initial={{ scale: 1.2, backgroundColor: 'rgba(200, 255, 0, 0.3)' }}
                      animate={{ scale: 1, backgroundColor: 'rgba(200, 255, 0, 0.1)' }}
                      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
                      className="flex items-center gap-1 rounded-xl border border-[#C8FF00]/30 px-2 py-1 text-[11px] font-bold text-[#C8FF00]"
                    >
                      <Fire weight="duotone" className="h-3.5 w-3.5" />
                      <span className="font-hud">{user.xp} XP</span>
                    </motion.div>
                  </div>
                </div>
              </header>

              {/* Notification Toast */}
              <AnimatePresence>
                {toast && (
                  <motion.div
                    key={toast}
                    initial={{ opacity: 0, y: -20, scale: 0.94 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -16, scale: 0.94 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    className="pointer-events-none absolute left-3 right-3 top-14 z-[700] flex items-center justify-center"
                  >
                    <div className="rounded-2xl border border-[#C8FF00]/45 bg-[#121821]/95 px-4 py-2 text-center text-xs font-semibold text-[#C8FF00] shadow-2xl backdrop-blur-md">
                      {toast}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div id="dek-overlay-root" className="pointer-events-none absolute inset-0 z-[750]" />

              <main className="relative min-h-0 flex-1 overflow-y-auto no-scrollbar px-3.5 pt-3 pb-4">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeTab}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.16, ease: 'easeOut' }}
                    className="h-full"
                  >
                    {activeTab === 'home' && (
                      <HomeView
                        user={user}
                        onNavigate={(t) => setActiveTab(t)}
                        onOpenArena={handleOpenArenaFromHome}
                        onOpenThursday={handleOpenThursdayFromHome}
                        onOpenRaids={handleOpenRaidsFromHome}
                        onOpenCoachs={handleOpenCoachsFromHome}
                        onRetakeInitiation={() => setIsRetakingInitiation(true)}
                      />
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
                        initialSubTab={arenaSubTab}
                        userCategory={user.category}
                        userAvatar={user.avatar}
                        userName={user.name}
                        onWinDuel={handleWinDuel}
                        onDuoComplete={handleGymDuoComplete}
                        onSpotJoin={handleSpotJoin}
                      />
                    )}
                    {activeTab === 'nutrition' && (
                      <NutritionView
                        user={user}
                        onUpdateWater={handleUpdateWater}
                        onToggleMeal={handleToggleMeal}
                      />
                    )}
                    {activeTab === 'network' && (
                      <NetworkHubView
                        user={user}
                        feed={feed}
                        initialSubTab={networkSubTab}
                        onJoinSante={handleJoinSante}
                        onCompleteThursday={handleCompleteThursday}
                        onRaidCheckin={handleRaidCheckin}
                        onPactAction={handlePactAction}
                        onBookSession={handleBookSession}
                        onRetakeInitiation={() => setIsRetakingInitiation(true)}
                        onUpdateAvatar={handleUpdateAvatar}
                        onCreatePost={handleCreatePost}
                        onNavigateTab={(t) => setActiveTab(t)}
                        onLogout={handleLogout}
                      />
                    )}
                  </motion.div>
                </AnimatePresence>
              </main>

              {/* Bottom Navigation 5 onglets */}
              <nav className="safe-bottom shrink-0 border-t border-white/10 bg-[#0B0E14]/95 px-1.5 py-1.5 backdrop-blur-lg">
                <div className="grid grid-cols-5 gap-0.5">
                  {NAV_ITEMS.map((item) => {
                    const Icon = item.icon;
                    const active = activeTab === item.id;
                    return (
                      <motion.button
                        key={item.id}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setActiveTab(item.id)}
                        className={`relative flex flex-col items-center justify-center gap-0.5 rounded-xl py-1.5 transition-colors ${
                          active ? 'text-[#C8FF00]' : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        {active && (
                          <motion.div
                            layoutId="dekActiveTabPill"
                            transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                            className="absolute inset-x-1.5 inset-y-0.5 rounded-xl bg-[#C8FF00]/12 ring-1 ring-[#C8FF00]/25"
                          />
                        )}
                        <Icon weight="duotone" className="relative z-10 h-5 w-5" />
                        <span className="font-hud relative z-10 text-[10px] font-bold tracking-wide">
                          {item.label}
                        </span>
                      </motion.button>
                    );
                  })}
                </div>
              </nav>
            </>
          )}
        </div>
      </PhoneSimulatorFrame>
    </MotionConfig>
  );
}
