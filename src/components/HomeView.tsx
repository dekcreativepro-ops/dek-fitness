import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  BowlFood,
  CaretRight,
  CheckCircle,
  Compass,
  Crown,
  Dumbbell,
  Flag,
  Play,
  SlidersHorizontal,
  SoccerBall,
  Sword,
} from './DekIcons';
import { useDekNav } from '../context/DekNav';
import { INITIAL_COACHS } from '../data/mockData';
import { getRecommendedProgram, WORKOUT_PROGRAMS } from '../data/workoutsData';
import type { TabId, UserProfile } from '../types/dek';
import { getTierIndex, TIER_COLORS } from '../utils/categorization';
import { getAdventurePlan, getNutritionPlan } from '../utils/programsAndNutrition';
import { currentWeekDays, dayKey, getRankInfo } from '../utils/progression';
import { BoltPulse, DropWave, FlameAnimated, LiveDot } from './ui/AnimatedIcons';
import { ActivityRings, CinematicImage, CountUp, SectionHeader } from './ui/kit';
import { fadeUpItem, staggerContainer } from './ui/motion';
import { RankEmblem } from './ui/RankEmblem';
import { UserAvatar } from './UserAvatar';
import { ResumeCard } from './workouts/ResumeCard';
import { WorkoutCard } from './workouts/WorkoutCard';

interface HomeViewProps {
  user: UserProfile;
  onNavigate: (tab: TabId) => void;
  onOpenArena: (subTab: 'house' | 'gym') => void;
  onOpenThursday: () => void;
  onOpenRaids: () => void;
  onRetakeInitiation: () => void;
  onToggleSaveWorkout: (id: string) => void;
}

/** Objectif hebdomadaire de séances validées (missions, duels, séances guidées, terrains…). */
const WEEKLY_SESSION_GOAL = 5;
/** Objectif quotidien de calories actives. */
const DAILY_KCAL_GOAL = 400;

function greeting(): string {
  const h = new Date().getHours();
  if (h < 5) return 'Bonne nuit';
  if (h < 12) return 'Bonjour';
  if (h < 18) return 'Salut';
  return 'Bonsoir';
}

export function HomeView({
  user,
  onNavigate,
  onOpenArena,
  onOpenThursday,
  onOpenRaids,
  onRetakeInitiation,
  onToggleSaveWorkout,
}: HomeViewProps) {
  const nav = useDekNav();
  const adventure = getAdventurePlan(user.goals, user.category);
  const coach = INITIAL_COACHS.find((c) => c.id === adventure.recommendedCoachId) ?? INITIAL_COACHS[0];
  const today = getRecommendedProgram(user.goals[0], getTierIndex(user.category));
  const plan = getNutritionPlan(user.goals, user.category, user.body);
  const rankInfo = getRankInfo(user.xp);

  const weekDays = currentWeekDays().map((d) => ({ ...d, count: user.activityLog[d.key] ?? 0 }));
  const weekSessions = weekDays.reduce((acc, d) => acc + d.count, 0);
  const maxDayCount = Math.max(3, ...weekDays.map((d) => d.count));
  const kcalToday = user.kcalLog[dayKey()] ?? 0;

  const rings = [
    { pct: (weekSessions / WEEKLY_SESSION_GOAL) * 100, color: '#C8FF00' },
    { pct: (kcalToday / DAILY_KCAL_GOAL) * 100, color: '#FF8A00' },
    { pct: (user.waterGlasses / plan.waterTargetGlasses) * 100, color: '#00E5FF' },
  ];
  const globalPct = Math.round(rings.reduce((a, r) => a + Math.min(100, r.pct), 0) / rings.length);

  const firstName = user.name.split(/[\s_]/)[0] || user.name;
  const [dateLabel] = useState(() =>
    new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(new Date()),
  );

  const universes = [
    { label: 'Outdoor', sub: '5 modes GPS', Icon: Compass, color: '#C8FF00', onClick: () => onNavigate('missions') },
    { label: 'Défi House', sub: 'Caméra IA', Icon: Sword, color: '#FF2E54', onClick: () => onOpenArena('house') },
    { label: 'Terrains', sub: 'Jeudi & Tournoi', Icon: SoccerBall, color: '#34D399', onClick: onOpenThursday },
    { label: 'Gym Buddy', sub: 'Salle & Duo', Icon: Dumbbell, color: '#00E5FF', onClick: () => onOpenArena('gym') },
    { label: 'Raids', sub: 'Badges & Pactes', Icon: Flag, color: '#F59E0B', onClick: onOpenRaids },
    { label: 'Nutrition', sub: 'Repas & Eau', Icon: BowlFood, color: '#6EE7B7', onClick: () => onNavigate('nutrition') },
  ];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 pb-3">
      {/* Salutation */}
      <motion.div variants={fadeUpItem} className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[11px] text-slate-400 first-letter:uppercase">{dateLabel}</p>
          <h1 className="truncate text-xl font-light text-white">
            {greeting()}, <span className="font-hud font-bold">{firstName}</span>{' '}
            <motion.span
              className="inline-block origin-[70%_70%]"
              animate={{ rotate: [0, 18, -8, 18, 0] }}
              transition={{ duration: 1.4, delay: 0.6, repeat: Infinity, repeatDelay: 4 }}
            >
              👋
            </motion.span>
          </h1>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <div
            className="flex items-center gap-1 rounded-2xl border border-orange-400/30 bg-orange-500/10 px-2 py-1.5"
            title="Série de jours actifs"
          >
            <FlameAnimated className="h-4 w-4" />
            <span className="font-hud text-xs font-bold text-orange-300">{user.streakDays} j</span>
          </div>
          <button
            onClick={onRetakeInitiation}
            aria-label="Modifier mes objectifs"
            className="flex h-9 w-9 items-center justify-center rounded-2xl border border-white/10 bg-[#11151D] text-slate-300"
          >
            <SlidersHorizontal weight="duotone" className="h-4 w-4" />
          </button>
        </div>
      </motion.div>

      <ResumeCard />

      {/* Séance du jour (héro cinématique) */}
      <motion.div variants={fadeUpItem} whileTap={{ scale: 0.985 }} onClick={() => nav.openWorkout(today.id)} className="cursor-pointer">
        <CinematicImage src={today.image} position={today.imagePosition} tint={today.tint} className="h-56 rounded-[30px] border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-black/10" />
          <div className="absolute left-4 top-4 flex items-center gap-1.5 rounded-full bg-black/55 px-2.5 py-1 backdrop-blur">
            <LiveDot />
            <span className="font-hud text-[9px] font-bold tracking-wider text-[#C8FF00]">SÉANCE DU JOUR</span>
          </div>
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
            <div className="min-w-0">
              <h2 className="font-hud text-[22px] font-bold leading-tight text-white">{today.title}</h2>
              <div className="mt-1.5 flex flex-wrap gap-1.5 text-[10px] font-semibold text-white">
                <span className="rounded-full bg-white/12 px-2 py-0.5 backdrop-blur">⏱ {today.durationMin} min</span>
                <span className="rounded-full bg-white/12 px-2 py-0.5 backdrop-blur">🔥 {today.kcal} kcal</span>
                <span className="rounded-full bg-white/12 px-2 py-0.5 backdrop-blur">{today.level}</span>
              </div>
            </div>
            <motion.button
              whileTap={{ scale: 0.85 }}
              onClick={(e) => {
                e.stopPropagation();
                nav.startWorkout(today.id);
              }}
              aria-label="Démarrer la séance du jour"
              className="relative flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#C8FF00] text-black"
            >
              <motion.span
                className="absolute inset-0 rounded-full border-2 border-[#C8FF00]"
                animate={{ scale: [1, 1.45], opacity: [0.7, 0] }}
                transition={{ duration: 1.6, repeat: Infinity }}
              />
              <Play weight="duotone" className="ml-0.5 h-6 w-6" />
            </motion.button>
          </div>
        </CinematicImage>
      </motion.div>

      {/* Activité du jour : anneaux */}
      <motion.section variants={fadeUpItem} className="rounded-[28px] border border-white/10 bg-[#11151D] p-4">
        <SectionHeader title="Activité du jour" action="Nutrition" onAction={() => onNavigate('nutrition')} />
        <div className="flex items-center gap-4">
          <ActivityRings rings={rings} size={116} stroke={11}>
            <div className="text-center leading-none">
              <div className="font-hud text-lg font-bold text-white">
                <CountUp value={globalPct} />%
              </div>
              <div className="text-[8px] uppercase tracking-wider text-slate-400">global</div>
            </div>
          </ActivityRings>
          <div className="flex-1 space-y-2.5">
            <div className="flex items-center gap-2">
              <BoltPulse className="h-4 w-4" />
              <div className="flex-1">
                <div className="text-[10px] text-slate-400">Séances semaine</div>
                <div className="font-hud text-sm font-bold text-[#C8FF00]">
                  <CountUp value={weekSessions} />
                  <span className="text-[11px] text-slate-500"> / {WEEKLY_SESSION_GOAL}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <FlameAnimated className="h-4 w-4" />
              <div className="flex-1">
                <div className="text-[10px] text-slate-400">Calories actives</div>
                <div className="font-hud text-sm font-bold text-orange-300">
                  <CountUp value={kcalToday} />
                  <span className="text-[11px] text-slate-500"> / {DAILY_KCAL_GOAL} kcal</span>
                </div>
              </div>
            </div>
            <button onClick={() => onNavigate('nutrition')} className="flex w-full items-center gap-2 text-left">
              <DropWave className="h-4 w-4" />
              <div className="flex-1">
                <div className="text-[10px] text-slate-400">Hydratation</div>
                <div className="font-hud text-sm font-bold text-[#00E5FF]">
                  {(user.waterGlasses * 0.25).toFixed(2).replace('.', ',')}
                  <span className="text-[11px] text-slate-500"> / {(plan.waterTargetGlasses * 0.25).toFixed(1).replace('.', ',')} L</span>
                </div>
              </div>
              <CaretRight className="h-3.5 w-3.5 text-slate-500" />
            </button>
          </div>
        </div>

        {/* Semaine */}
        <div className="mt-3.5 flex h-14 items-end justify-between gap-2 rounded-2xl bg-[#0B0E14] px-3 pb-1.5 pt-2">
          {weekDays.map((d, i) => (
            <div key={d.key} className="flex flex-1 flex-col items-center gap-1" title={`${d.count} séance(s)`}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${Math.max(3, Math.round((d.count / maxDayCount) * 26))}px` }}
                transition={{ duration: 0.5, delay: 0.3 + i * 0.04 }}
                className={`w-full max-w-[14px] rounded-full ${
                  d.count > 0 ? 'bg-[#C8FF00] shadow-[0_0_8px_-2px_#C8FF00]' : 'bg-white/10'
                }`}
              />
              <span className={`font-hud text-[9px] font-bold ${d.isToday ? 'text-[#C8FF00]' : 'text-slate-500'}`}>{d.label}</span>
            </div>
          ))}
        </div>
      </motion.section>

      {/* Programmes */}
      <motion.section variants={fadeUpItem}>
        <SectionHeader title="Programmes pour toi" action="Voir tout" onAction={() => onNavigate('workouts')} />
        <div className="no-scrollbar snap-x-mandatory -mx-3.5 flex gap-2.5 overflow-x-auto px-3.5 pb-1">
          {WORKOUT_PROGRAMS.filter((p) => p.id !== today.id).map((p) => (
            <div key={p.id} className="w-[210px] shrink-0 snap-start">
              <WorkoutCard
                program={p}
                saved={user.savedWorkouts.includes(p.id)}
                doneCount={user.workoutsDone[p.id] ?? 0}
                onOpen={() => nav.openWorkout(p.id)}
                onToggleSave={() => onToggleSaveWorkout(p.id)}
              />
            </div>
          ))}
        </div>
      </motion.section>

      {/* Rang de saison */}
      <motion.button
        variants={fadeUpItem}
        whileTap={{ scale: 0.98 }}
        onClick={() => nav.openLeaderboard()}
        className="flex w-full items-center gap-3 rounded-[26px] border border-white/10 bg-gradient-to-r from-[#171D28] to-[#0E1219] p-3.5 text-left"
      >
        <RankEmblem rank={rankInfo.rank} size={50} />
        <div className="min-w-0 flex-1">
          <div className="font-hud text-[10px] font-bold tracking-wider text-slate-400">RANG DE SAISON</div>
          <div className="font-hud text-base font-bold text-white">{rankInfo.rank}</div>
          <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-black/60">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-[#00E5FF] to-[#C8FF00]"
              initial={{ width: 0 }}
              animate={{ width: `${rankInfo.pct}%` }}
              transition={{ duration: 0.9, delay: 0.3 }}
            />
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            {rankInfo.nextRank ? `${rankInfo.nextRankXp - user.xp} XP avant ${rankInfo.nextRank}` : 'Rang maximum'}
          </div>
        </div>
        <span className="font-hud shrink-0 rounded-full bg-white/8 px-2.5 py-1.5 text-[10px] font-bold text-[#C8FF00]">
          Classement
        </span>
      </motion.button>

      {/* Terrain du Jeudi */}
      <motion.button
        variants={fadeUpItem}
        whileTap={{ scale: 0.98 }}
        onClick={onOpenThursday}
        className="relative flex w-full items-center gap-3 overflow-hidden rounded-[26px] border border-[#C8FF00]/30 p-3.5 text-left"
      >
        <img src="/images/banner-sante.jpg" alt="" className="absolute inset-0 h-full w-full object-cover opacity-30" style={{ objectPosition: '60% 40%' }} />
        <div className="absolute inset-0 bg-gradient-to-r from-[#080A0E] via-[#080A0E]/85 to-transparent" />
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#C8FF00]/15 text-[#C8FF00]">
          <Crown weight="duotone" className="h-6 w-6" />
        </div>
        <div className="relative min-w-0 flex-1">
          <span className="font-hud flex items-center gap-1.5 text-[9px] font-bold uppercase tracking-wider text-[#C8FF00]">
            <LiveDot /> Rendez-vous hebdo • Check-in QR
          </span>
          <div className="font-hud truncate text-sm font-bold text-white">Terrain du Jeudi • 19h00</div>
          <div className="truncate text-[10px] text-slate-300">Roi du Terrain • Caisse & vote MVP</div>
        </div>
        <CaretRight className="relative h-4 w-4 shrink-0 text-[#C8FF00]" />
      </motion.button>

      {/* 6 univers */}
      <motion.section variants={fadeUpItem}>
        <SectionHeader title="Tes univers" />
        <div className="grid grid-cols-3 gap-2">
          {universes.map(({ label, sub, Icon, color, onClick }) => (
            <motion.button
              key={label}
              whileTap={{ scale: 0.93 }}
              whileHover={{ y: -2 }}
              onClick={onClick}
              className="flex flex-col items-center rounded-[22px] border border-white/10 bg-[#11151D] px-1.5 py-3 text-center"
            >
              <motion.div
                whileHover={{ rotate: [0, -10, 10, 0] }}
                className="flex h-10 w-10 items-center justify-center rounded-2xl"
                style={{ backgroundColor: `${color}1f`, color }}
              >
                <Icon weight="duotone" className="h-5 w-5" />
              </motion.div>
              <span className="font-hud mt-1.5 text-[11px] font-bold text-white">{label}</span>
              <span className="text-[9px] text-slate-400">{sub}</span>
            </motion.button>
          ))}
        </div>
      </motion.section>

      {/* Coach recommandé */}
      <motion.button
        variants={fadeUpItem}
        whileTap={{ scale: 0.98 }}
        onClick={() => nav.openCoach(coach.id)}
        className="w-full rounded-[26px] border border-white/10 bg-[#11151D] p-3.5 text-left"
      >
        <div className="flex items-center gap-3">
          {coach.avatarPreset && (
            <UserAvatar
              avatar={{ mode: 'preset', presetId: coach.avatarPreset, diceStyle: 'lorelei', seed: coach.name, bgColor: '0f172a', auraColor: coach.accent }}
              size="md"
            />
          )}
          <div className="min-w-0 flex-1">
            <div className="font-hud text-[9px] font-bold tracking-wider" style={{ color: TIER_COLORS[user.category] }}>
              TON COACH RECOMMANDÉ
            </div>
            <div className="flex items-center gap-1">
              <span className="font-hud truncate text-sm font-bold text-white">{coach.name}</span>
              <CheckCircle weight="duotone" className="h-3.5 w-3.5 shrink-0 text-[#00E5FF]" />
            </div>
            <p className="truncate text-[10px] text-slate-400">{coach.specialty}</p>
          </div>
          <span className="font-hud shrink-0 rounded-full bg-[#C8FF00] px-3 py-1.5 text-[10px] font-bold text-black">
            ★ {coach.rating.toFixed(1)}
          </span>
        </div>
        <p className="mt-2.5 rounded-2xl bg-[#0B0E14] px-3 py-2 text-[11px] leading-relaxed text-slate-300">
          « {adventure.coachAdvice} »
        </p>
      </motion.button>
    </motion.div>
  );
}
