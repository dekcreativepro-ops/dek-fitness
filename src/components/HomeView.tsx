import { useSyncExternalStore } from 'react';
import { motion } from 'framer-motion';
import { coachPortrait } from '../data/coachPortraits';
import { BowlFood, CameraIcon, Compass, Sparkle, Dumbbell, Flag, NavigationArrow, Play, SlidersHorizontal, SoccerBall, Sword, Trophy } from './DekIcons';
import { useDekNav } from '../context/DekNav';
import { INITIAL_COACHS } from '../data/mockData';
import { getProgram, getRecommendedProgram, WORKOUT_PROGRAMS } from '../data/workoutsData';
import type { TabId, UserProfile } from '../types/dek';
import { getTierIndex } from '../utils/categorization';
import { getAdventurePlan, getNutritionPlan } from '../utils/programsAndNutrition';
import { currentWeekDays, dayKey, getRankInfo } from '../utils/progression';
import { ActivityRings, Card, CinematicImage, CountUp, IconBadge, IconButton, ListRow, ProgressBar, SectionHeader, StatTiles } from './ui/kit';
import { BoltPulse, DropWave, FlameAnimated } from './ui/AnimatedIcons';
import { fadeUpItem, staggerContainer } from './ui/motion';
import { UserAvatar } from './UserAvatar';
import { usePhoto } from '../utils/usePhoto';
import { ProgramPhoto } from './workouts/ProgramPhoto';
import { useCoach } from './coach/coachHooks';
import { ImagePicker } from './ui/ImagePicker';
import { getHeroImage, setHeroImage, subscribeHeroImage } from '../utils/customImage';
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
/** Objectif quotidien de séances. */
const DAILY_SESSION_GOAL = 1;
/** Objectif quotidien de calories actives. */
const DAILY_KCAL_GOAL = 400;

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
  const coachName = useCoach().name;
  const adventure = getAdventurePlan(user.goals, user.category);
  const coach = INITIAL_COACHS.find((c) => c.id === adventure.recommendedCoachId) ?? INITIAL_COACHS[0];
  const defaultHero = usePhoto('hero', 'card');
  const customHero = useSyncExternalStore(subscribeHeroImage, getHeroImage, getHeroImage);
  const heroPhoto = customHero ?? defaultHero;
  const today = getRecommendedProgram(user.goals[0], getTierIndex(user.category));
  const todayPhoto = usePhoto(today.photoCat, 'detail');
  const plan = getNutritionPlan(user.goals, user.category, user.body);
  const rankInfo = getRankInfo(user.xp);

  const weekSessions = currentWeekDays().reduce((acc, d) => acc + (user.activityLog[d.key] ?? 0), 0);
  const sessionsToday = user.activityLog[dayKey()] ?? 0;
  const kcalToday = user.kcalLog[dayKey()] ?? 0;

  const rings = [
    { pct: (sessionsToday / DAILY_SESSION_GOAL) * 100 },
    { pct: (kcalToday / DAILY_KCAL_GOAL) * 100 },
    { pct: (user.waterGlasses / plan.waterTargetGlasses) * 100 },
  ];
  const globalPct = Math.round(rings.reduce((a, r) => a + Math.min(100, r.pct), 0) / rings.length);
  const weekPct = Math.min(100, (weekSessions / WEEKLY_SESSION_GOAL) * 100);

  const firstName = user.name.split(/[\s_]/)[0] || user.name;
  const doneWorkouts = Object.entries(user.workoutsDone)
    .filter(([, n]) => n > 0)
    .map(([id, n]) => ({ program: getProgram(id), n }))
    .filter((w): w is { program: NonNullable<ReturnType<typeof getProgram>>; n: number } => !!w.program)
    .slice(0, 3);

  const universes = [
    { label: 'Outdoor', sub: '5 modes GPS', icon: <Compass className="h-5 w-5" />, onClick: () => onNavigate('missions') },
    { label: 'Défi House', sub: 'Caméra IA', icon: <Sword className="h-5 w-5" />, onClick: () => onOpenArena('house') },
    { label: 'Terrains', sub: 'Matchs & Tournoi', icon: <SoccerBall className="h-5 w-5" />, onClick: onOpenThursday },
    { label: 'Gym Buddy', sub: 'Salle & Duo', icon: <Dumbbell className="h-5 w-5" />, onClick: () => onOpenArena('gym') },
    { label: 'Raids', sub: 'Badges & Pactes', icon: <Flag className="h-5 w-5" />, onClick: onOpenRaids },
    { label: 'Nutrition', sub: 'Repas & Eau', icon: <BowlFood className="h-5 w-5" />, onClick: () => onNavigate('nutrition') },
  ];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-5 pb-3">
      {/* En-tête */}
      <motion.div variants={fadeUpItem} className="flex items-center gap-3">
        <UserAvatar avatar={user.avatar} size="md" ring={false} className="!h-11 !w-11" />
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-[20px] font-bold leading-6 text-fg">Salut {firstName} !</h1>
          <p className="text-[13px] font-medium text-mute">Prêt pour ta séance ?</p>
        </div>
        <IconButton label="Modifier mes objectifs" onClick={onRetakeInitiation}>
          <SlidersHorizontal className="h-5 w-5" />
        </IconButton>
        <IconButton label="Classement" onClick={() => nav.openLeaderboard()}>
          <Trophy className="h-5 w-5" />
        </IconButton>
      </motion.div>

      {/* Statut de saison */}
      <motion.div variants={fadeUpItem} className="relative h-[430px] overflow-hidden rounded-[28px] bg-card">
        {/* Photo d'athlète plein cadre (fixe), comme dans les maquettes */}
        <img
          src={heroPhoto}
          alt=""
          draggable={false}
          className="absolute inset-0 h-full w-full select-none object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/35 via-transparent to-transparent" />
        <div className="absolute right-4 top-4 z-10 flex gap-2">
          <ImagePicker
            onPick={setHeroImage}
            maxWidth={1100}
            className="flex h-9 items-center gap-1.5 rounded-full bg-black/45 px-3 text-[12px] font-semibold text-white backdrop-blur-md transition active:scale-95"
          >
            <CameraIcon className="h-4 w-4" /> Ma photo
          </ImagePicker>
          {customHero && (
            <button
              type="button"
              onClick={() => setHeroImage(null)}
              className="flex h-9 items-center rounded-full bg-black/45 px-3 text-[12px] font-semibold text-white backdrop-blur-md transition active:scale-95"
            >
              Par défaut
            </button>
          )}
        </div>
        <div className="absolute left-5 top-5">
          <div className="text-[13px] font-medium text-white/80">Rang de saison</div>
          <div className="text-[34px] font-extrabold leading-9 text-white">{rankInfo.rank}</div>
        </div>
        {/* Panneau en verre sur la photo */}
        <button
          type="button"
          onClick={() => nav.openLeaderboard()}
          className="glass sheen absolute inset-x-3 bottom-3 rounded-[24px] p-4 text-left transition active:scale-[0.99]"
        >
          <div className="flex items-end justify-between gap-3">
            <div className="text-[13px] font-medium text-fg">XP de la saison</div>
            <div className="text-right text-[12px] font-medium text-mute">
              {rankInfo.nextRank ? `${rankInfo.nextRankXp - user.xp} XP avant ${rankInfo.nextRank}` : 'Rang maximum'}
            </div>
          </div>
          <ProgressBar value={rankInfo.pct} knob className="mt-2.5" />
          <StatTiles
            className="mt-3.5 border-t border-white/10 pt-3.5"
            items={[
              { label: 'XP', value: <CountUp value={user.xp} /> },
              { label: 'Discipline', value: user.disciplineScore, unit: '%' },
              { label: 'Série', value: user.streakDays, unit: 'j' },
            ]}
          />
        </button>
      </motion.div>

      {/* Séances cette semaine */}
      <motion.div variants={fadeUpItem}>
        <Card>
          <div className="flex items-baseline justify-between">
            <h2 className="text-[16px] font-bold text-fg">Séances cette semaine</h2>
            <span className="num text-[13px] font-semibold text-mute">{Math.round(weekPct)} %</span>
          </div>
          <div className="num mt-2 text-[34px] font-extrabold leading-9 text-fg">
            <CountUp value={weekSessions} />
            <span className="text-[16px] font-medium text-mute"> / {WEEKLY_SESSION_GOAL}</span>
          </div>
          <ProgressBar value={weekPct} knob className="mt-3" />
        </Card>
      </motion.div>

      {/* Activité du jour */}
      <motion.div variants={fadeUpItem}>
        <Card glass className="sheen">
          <SectionHeader title="Activité du jour" action="Nutrition" onAction={() => onNavigate('nutrition')} />
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-[13px] font-medium text-mute"><BoltPulse className="h-4 w-4" />Séances</div>
                <div className="num text-[22px] font-extrabold leading-7 text-lime">
                  {sessionsToday}
                  <span className="text-[13px] font-medium text-mute"> / {DAILY_SESSION_GOAL}</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[13px] font-medium text-mute"><FlameAnimated className="h-4 w-4" />Calories</div>
                <div className="num text-[22px] font-extrabold leading-7 text-ember">
                  <CountUp value={kcalToday} />
                  <span className="text-[13px] font-medium text-mute"> / {DAILY_KCAL_GOAL} kcal</span>
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5 text-[13px] font-medium text-mute"><DropWave className="h-4 w-4" />Eau</div>
                <div className="num text-[22px] font-extrabold leading-7 text-aqua">
                  {(user.waterGlasses * 0.25).toFixed(2).replace('.', ',')}
                  <span className="text-[13px] font-medium text-mute"> / {(plan.waterTargetGlasses * 0.25).toFixed(1).replace('.', ',')} L</span>
                </div>
              </div>
            </div>
            <ActivityRings rings={rings} size={128} stroke={12}>
              <div className="num text-[20px] font-extrabold text-fg">
                <CountUp value={globalPct} />%
              </div>
            </ActivityRings>
          </div>
        </Card>
      </motion.div>

      <ResumeCard />

      {/* Séance du jour */}
      <motion.div variants={fadeUpItem} whileTap={{ scale: 0.985 }} onClick={() => nav.openWorkout(today.id)} className="cursor-pointer">
        <CinematicImage src={todayPhoto} position="50% 40%" className="h-60 rounded-[24px]">
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-black/10" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
            <div className="min-w-0">
              <div className="text-[12px] font-semibold text-lime">Séance du jour</div>
              <h2 className="text-[20px] font-bold leading-6 text-white">{today.title}</h2>
              <p className="mt-0.5 text-[13px] font-medium text-white/80">
                {today.durationMin} min · {today.kcal} kcal · {today.level}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nav.startWorkout(today.id);
              }}
              aria-label="Démarrer la séance du jour"
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-lime text-on-lime transition active:scale-90"
            >
              <Play className="ml-0.5 h-6 w-6" />
            </button>
          </div>
        </CinematicImage>
      </motion.div>

      {/* Programmes */}
      <motion.section variants={fadeUpItem}>
        <SectionHeader title="Programmes" action="Voir tout" onAction={() => onNavigate('workouts')} />
        <div className="no-scrollbar snap-x-mandatory -mx-5 flex gap-3 overflow-x-auto px-5">
          {WORKOUT_PROGRAMS.filter((p) => p.id !== today.id).map((p) => (
            <div key={p.id} className="w-[170px] shrink-0 snap-start">
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

      {/* Coach IA */}
      <motion.section variants={fadeUpItem}>
        <ListRow
          onClick={nav.openCoachAI}
          leading={
            <IconBadge tone="lime">
              <Sparkle className="h-5 w-5" />
            </IconBadge>
          }
          title={`Coach IA · ${coachName}`}
          subtitle="Programme, conseils, bilan et motivation, à tout moment"
        />
      </motion.section>

      {/* Activités */}
      <motion.section variants={fadeUpItem}>
        <SectionHeader title="Activités" />
        <div className="space-y-2">
          {doneWorkouts.map(({ program, n }) => (
            <ListRow
              key={program.id}
              onClick={() => nav.openWorkout(program.id)}
              leading={<ProgramPhoto program={program} />}
              title={program.title}
              subtitle={`${program.durationMin} min · ${program.level}`}
              meta={`Faite ${n}×`}
            />
          ))}
          <ListRow
            onClick={() => onNavigate('missions')}
            leading={<IconBadge tone="lime"><NavigationArrow className="h-5 w-5" /></IconBadge>}
            title="Missions"
            subtitle={`${user.missionsCompleted} réussies · ${user.houseWins} victoires House`}
          />
          {universes.map((u) => (
            <ListRow key={u.label} onClick={u.onClick} leading={<IconBadge>{u.icon}</IconBadge>} title={u.label} subtitle={u.sub} />
          ))}
        </div>
      </motion.section>

      {/* Terrain du jour */}
      <motion.button
        type="button"
        variants={fadeUpItem}
        whileTap={{ scale: 0.98 }}
        onClick={onOpenThursday}
        className="relative flex w-full items-center gap-3 overflow-hidden rounded-[24px] bg-card p-4 text-left"
      >
        <div className="relative min-w-0 flex-1">
          <div className="text-[12px] font-semibold text-lime">Rendez-vous hebdo · Check-in QR</div>
          <div className="truncate text-[17px] font-bold text-white">Terrain du jour · 19h00</div>
          <div className="truncate text-[13px] text-white/75">Roi du Terrain · Caisse & vote MVP</div>
        </div>
      </motion.button>

      {/* Coach recommandé */}
      <motion.section variants={fadeUpItem}>
        <SectionHeader title="Ton coach recommandé" />
        <ListRow
          onClick={() => nav.openCoach(coach.id)}
          leading={
            coachPortrait(coach.id) ? (
              <img src={coachPortrait(coach.id)} alt="" className="h-12 w-12 rounded-full object-cover" />
            ) : (
              coach.avatarPreset && (
              <UserAvatar
                avatar={{ mode: 'preset', presetId: coach.avatarPreset, diceStyle: 'lorelei', seed: coach.name, bgColor: '0E0F12', auraColor: coach.accent }}
                size="md"
                ring={false}
                className="!h-12 !w-12"
              />
              )
            )
          }
          title={coach.name}
          subtitle={coach.specialty}
          meta={`${coach.experienceYears ?? 5} ans d’expérience · ${coach.rating.toFixed(1)}`}
        />
        <p className="mt-2 px-2 text-[13px] leading-[18px] text-mute">« {adventure.coachAdvice} »</p>
      </motion.section>
    </motion.div>
  );
}
