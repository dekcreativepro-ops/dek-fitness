import { motion } from 'framer-motion';
import {
  BowlFood,
  CheckCircle,
  Compass,
  Crown,
  Dumbbell,
  Flag,
  Medal,
  Play,
  SlidersHorizontal,
  SoccerBall,
  Sword,
} from './DekIcons';
import { INITIAL_COACHS } from '../data/mockData';
import type { TabId, UserProfile } from '../types/dek';
import { getAdventurePlan } from '../utils/programsAndNutrition';
import { UserAvatar } from './UserAvatar';

interface HomeViewProps {
  user: UserProfile;
  onNavigate: (tab: TabId) => void;
  onOpenArena: (subTab: 'house' | 'gym') => void;
  onOpenThursday: () => void;
  onOpenRaids: () => void;
  onOpenCoachs: () => void;
  onRetakeInitiation: () => void;
}

const WEEK_BARS = [
  { day: 'L', h: 35 },
  { day: 'M', h: 62 },
  { day: 'M', h: 48 },
  { day: 'J', h: 85 },
  { day: 'V', h: 72 },
  { day: 'S', h: 95 },
  { day: 'D', h: 55 },
];

export function HomeView({
  user,
  onNavigate,
  onOpenArena,
  onOpenThursday,
  onOpenRaids,
  onOpenCoachs,
  onRetakeInitiation,
}: HomeViewProps) {
  const adventure = getAdventurePlan(user.goals, user.category);
  const coach =
    INITIAL_COACHS.find((c) => c.id === adventure.recommendedCoachId) ?? INITIAL_COACHS[0];

  const totalSessions = user.missionsCompleted + user.houseWins + user.santePlayed;
  const weekPct = Math.min(100, Math.max(18, Math.min(6, totalSessions + 2) * 16));
  const radius = 26;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (weekPct / 100) * circumference;

  return (
    <div className="space-y-3.5 pb-2">
      {/* Carte Hero Bannière Photo */}
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#0B0E14]">
        <img
          src="/images/banner-home.jpg"
          alt="Athlète DEK Fitness"
          className="h-44 w-full object-cover object-center opacity-85"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#080A0E] via-[#080A0E]/60 to-transparent" />

        <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <UserAvatar avatar={user.avatar} size="md" />
            <div>
              <p className="text-[10px] font-medium text-slate-300">Bonjour, {user.name}</p>
              <span className="font-hud text-xs font-bold text-[#C8FF00]">{user.category}</span>
            </div>
          </div>

          <button
            onClick={onRetakeInitiation}
            className="flex items-center gap-1 rounded-xl border border-white/15 bg-black/60 px-2.5 py-1.5 text-[10px] font-semibold text-slate-200 backdrop-blur hover:border-[#C8FF00]/50"
          >
            <SlidersHorizontal weight="duotone" className="h-3.5 w-3.5 text-[#C8FF00]" />
            Objectifs
          </button>
        </div>

        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3.5">
          <div>
            <h2 className="font-hud text-xl font-bold leading-tight text-white">
              TON AVENTURE <span className="text-[#C8FF00]">COMMENCE</span>
            </h2>
            <p className="mt-0.5 text-[11px] text-slate-300">{adventure.todayWorkoutTitle}</p>
          </div>
          <motion.button
            whileTap={{ scale: 0.92 }}
            onClick={() => onNavigate(adventure.launchTab)}
            className="font-hud flex shrink-0 items-center gap-1.5 rounded-full bg-[#C8FF00] px-4 py-2 text-xs font-bold text-black shadow-lg shadow-[#C8FF00]/25"
          >
            <Play weight="duotone" className="h-4 w-4" /> Go
          </motion.button>
        </div>
      </div>

      {/* Carte « Prochain Terrain du Jeudi • 19h00 » */}
      <motion.button
        whileTap={{ scale: 0.98 }}
        onClick={onOpenThursday}
        className="flex w-full items-center justify-between gap-3 rounded-3xl border border-[#C8FF00]/35 bg-gradient-to-r from-[#141A24] via-[#111720] to-[#0D1219] p-3.5 text-left"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-[#C8FF00]/15 text-[#C8FF00]">
            <Crown weight="duotone" className="h-6 w-6" />
          </div>
          <div className="min-w-0">
            <span className="font-hud text-[9px] font-bold uppercase tracking-wider text-[#C8FF00]">
              ● RENDEZ-VOUS HEBDO • CHECK-IN QR
            </span>
            <div className="font-hud truncate text-sm font-bold text-white">
              Prochain Terrain du Jeudi • 19h00
            </div>
            <div className="truncate text-[10px] text-slate-400">
              Roi du Terrain (3 Équipes) • Caisse &amp; Vote MVP
            </div>
          </div>
        </div>
        <span className="font-hud shrink-0 rounded-full bg-[#C8FF00] px-3 py-1.5 text-[10px] font-bold text-black">
          Ouvrir
        </span>
      </motion.button>

      {/* Grille 3 × 2 des 5 Univers Sportifs + Nutrition */}
      <div className="grid grid-cols-3 gap-2">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate('missions')}
          className="flex flex-col items-center rounded-2xl border border-white/10 bg-[#11151D] p-2.5 text-center transition hover:border-[#C8FF00]/40"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#C8FF00]/12 text-[#C8FF00]">
            <Compass weight="duotone" className="h-5 w-5" />
          </div>
          <span className="font-hud mt-1.5 text-[11px] font-bold text-white">Outdoor</span>
          <span className="text-[9px] text-slate-400">5 Modes GPS</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onOpenArena('house')}
          className="flex flex-col items-center rounded-2xl border border-white/10 bg-[#11151D] p-2.5 text-center transition hover:border-[#FF2E54]/40"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#FF2E54]/15 text-[#FF2E54]">
            <Sword weight="duotone" className="h-5 w-5" />
          </div>
          <span className="font-hud mt-1.5 text-[11px] font-bold text-white">Défi House</span>
          <span className="text-[9px] text-slate-400">IA 6 Exos</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onOpenThursday}
          className="flex flex-col items-center rounded-2xl border border-white/10 bg-[#11151D] p-2.5 text-center transition hover:border-emerald-400/40"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-400">
            <SoccerBall weight="duotone" className="h-5 w-5" />
          </div>
          <span className="font-hud mt-1.5 text-[11px] font-bold text-white">Terrains Jeudi</span>
          <span className="text-[9px] text-slate-400">Santé &amp; Tournoi</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onOpenArena('gym')}
          className="flex flex-col items-center rounded-2xl border border-white/10 bg-[#11151D] p-2.5 text-center transition hover:border-[#00E5FF]/40"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#00E5FF]/15 text-[#00E5FF]">
            <Dumbbell weight="duotone" className="h-5 w-5" />
          </div>
          <span className="font-hud mt-1.5 text-[11px] font-bold text-white">Gym Buddy</span>
          <span className="text-[9px] text-slate-400">Salle &amp; Duo</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onOpenRaids}
          className="flex flex-col items-center rounded-2xl border border-white/10 bg-[#11151D] p-2.5 text-center transition hover:border-amber-400/40"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-400/15 text-amber-300">
            <Flag weight="duotone" className="h-5 w-5" />
          </div>
          <span className="font-hud mt-1.5 text-[11px] font-bold text-white">Raids &amp; Pactes</span>
          <span className="text-[9px] text-slate-400">Badges &amp; Amis</span>
        </motion.button>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={() => onNavigate('nutrition')}
          className="flex flex-col items-center rounded-2xl border border-white/10 bg-[#11151D] p-2.5 text-center transition hover:border-emerald-400/40"
        >
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-300">
            <BowlFood weight="duotone" className="h-5 w-5" />
          </div>
          <span className="font-hud mt-1.5 text-[11px] font-bold text-white">Nutrition</span>
          <span className="text-[9px] text-slate-400">Repas &amp; Eau</span>
        </motion.button>
      </div>

      {/* Carte Progression Semaine */}
      <div className="rounded-3xl border border-white/10 bg-[#11151D] p-3.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-200">Progression semaine</span>
          <span className="text-[10px] text-slate-400">{adventure.durationLabel}</span>
        </div>

        <div className="mt-3 flex items-center gap-3.5">
          <div className="relative flex h-18 w-18 shrink-0 items-center justify-center">
            <svg className="h-18 w-18 -rotate-90" viewBox="0 0 68 68">
              <circle
                cx="34"
                cy="34"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.08)"
                strokeWidth="6"
              />
              <motion.circle
                cx="34"
                cy="34"
                r={radius}
                fill="none"
                stroke="#C8FF00"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 0.85, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center leading-none">
              <span className="font-hud text-base font-bold text-white">{weekPct}%</span>
              <span className="text-[8px] text-slate-400">Objectif</span>
            </div>
          </div>

          <div className="grid flex-1 grid-cols-3 gap-1.5 text-center">
            <div className="rounded-2xl bg-[#0B0E14] px-2 py-2">
              <div className="font-hud text-base font-bold text-white">{totalSessions}</div>
              <div className="text-[9px] text-slate-400">Séances</div>
            </div>
            <div className="rounded-2xl bg-[#0B0E14] px-2 py-2">
              <div className="font-hud text-base font-bold text-[#C8FF00]">
                {user.disciplineScore}%
              </div>
              <div className="text-[9px] text-slate-400">Discipline</div>
            </div>
            <div className="rounded-2xl bg-[#0B0E14] px-2 py-2">
              <div className="font-hud text-base font-bold text-[#00E5FF]">{user.streakDays}j</div>
              <div className="text-[9px] text-slate-400">Série</div>
            </div>
          </div>
        </div>

        {/* Mini-graphique en barres vert lime */}
        <div className="mt-3 rounded-2xl bg-[#C8FF00] px-3.5 py-2.5 text-black">
          <div className="mb-1.5 flex items-center justify-between text-[10px] font-bold">
            <span>ACTIVITÉ HEBDO</span>
            <span>{adventure.title}</span>
          </div>
          <div className="flex h-11 items-end justify-between gap-2">
            {WEEK_BARS.map((b, i) => (
              <div key={i} className="flex flex-1 flex-col items-center gap-0.5">
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.round((b.h / 100) * 28)}px` }}
                  transition={{ duration: 0.45, delay: i * 0.04 }}
                  className="w-full max-w-[16px] rounded-t-md bg-[#080A0E]"
                />
                <span className="font-hud text-[9px] font-bold text-black/75">{b.day}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Carte « Ton Coach DEK » */}
      <div className="rounded-3xl border border-white/10 bg-[#11151D] p-3.5">
        <div className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-2.5">
            <div
              className="font-hud flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-black"
              style={{ backgroundColor: coach.accent }}
            >
              {coach.avatarInitials}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1">
                <Medal weight="duotone" className="h-4 w-4 shrink-0 text-[#00E5FF]" />
                <span className="font-hud truncate text-xs font-bold text-white">
                  {coach.name}
                </span>
                <CheckCircle weight="duotone" className="h-3.5 w-3.5 shrink-0 text-[#00E5FF]" />
              </div>
              <p className="truncate text-[10px] text-slate-400">{coach.specialty}</p>
            </div>
          </div>

          <button
            onClick={onOpenCoachs}
            className="font-hud shrink-0 rounded-xl border border-[#C8FF00]/35 bg-[#C8FF00]/12 px-3 py-1.5 text-[10px] font-bold text-[#C8FF00]"
          >
            Voir coach
          </button>
        </div>
        <p className="mt-2 text-[11px] leading-relaxed text-slate-300">
          « {adventure.coachAdvice} »
        </p>
      </div>
    </div>
  );
}
