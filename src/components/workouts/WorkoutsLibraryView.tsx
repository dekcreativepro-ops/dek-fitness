import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MagnifyingGlass, Play, X } from '../DekIcons';
import { useDekNav } from '../../context/DekNav';
import {
  getRecommendedProgram,
  WORKOUT_CATEGORIES,
  WORKOUT_PROGRAMS,
  type WorkoutCategory,
  type WorkoutLevel,
} from '../../data/workoutsData';
import type { UserProfile } from '../../types/dek';
import { getTierIndex } from '../../utils/categorization';
import { DumbbellLift } from '../ui/AnimatedIcons';
import { ChipTabs, CinematicImage, ScreenHeader, SectionHeader } from '../ui/kit';
import { fadeUpItem, staggerContainer } from '../ui/motion';
import { ResumeCard } from './ResumeCard';
import { WorkoutCard } from './WorkoutCard';

type CategoryFilter = WorkoutCategory | 'all' | 'saved';
type LevelFilter = WorkoutLevel | 'all';

const LEVELS: { id: LevelFilter; label: string }[] = [
  { id: 'all', label: 'Tous niveaux' },
  { id: 'Débutant', label: 'Débutant' },
  { id: 'Intermédiaire', label: 'Intermédiaire' },
  { id: 'Avancé', label: 'Avancé' },
];

export function WorkoutsLibraryView({
  user,
  onToggleSave,
}: {
  user: UserProfile;
  onToggleSave: (id: string) => void;
}) {
  const nav = useDekNav();
  const [category, setCategory] = useState<CategoryFilter>('all');
  const [level, setLevel] = useState<LevelFilter>('all');
  const [query, setQuery] = useState('');

  const recommended = getRecommendedProgram(user.goals[0], getTierIndex(user.category));

  const filtered = useMemo(() => {
    const q = query
      .trim()
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
    return WORKOUT_PROGRAMS.filter((p) => {
      if (category === 'saved' && !user.savedWorkouts.includes(p.id)) return false;
      if (category !== 'all' && category !== 'saved' && p.category !== category) return false;
      if (level !== 'all' && p.level !== level) return false;
      if (q) {
        const hay = `${p.title} ${p.subtitle}`
          .toLowerCase()
          .normalize('NFD')
          .replace(/[̀-ͯ]/g, '');
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [category, level, query, user.savedWorkouts]);

  return (
    <div className="space-y-3.5 pb-2">
      <ScreenHeader
        title="SÉANCES GUIDÉES"
        onBack={() => nav.goTab('home')}
        right={<DumbbellLift className="h-6 w-6" />}
      />

      <ResumeCard />

      {/* Recommandation cinématique */}
      <motion.div whileTap={{ scale: 0.98 }} onClick={() => nav.openWorkout(recommended.id)} className="cursor-pointer">
        <CinematicImage
          src={recommended.image}
          position={recommended.imagePosition}
          tint={recommended.tint}
          className="h-48 rounded-[28px] border border-white/10"
        >
          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-4">
            <div className="min-w-0">
              <span className="font-hud rounded-full bg-[#C8FF00] px-2 py-0.5 text-[9px] font-black text-black">
                RECOMMANDÉE POUR TOI
              </span>
              <h2 className="font-hud mt-1.5 text-lg font-bold leading-tight text-white">{recommended.title}</h2>
              <p className="text-[11px] text-slate-300">
                {recommended.durationMin} min • {recommended.kcal} kcal • {recommended.level}
              </p>
            </div>
            <motion.button
              whileTap={{ scale: 0.88 }}
              onClick={(e) => {
                e.stopPropagation();
                nav.startWorkout(recommended.id);
              }}
              aria-label="Démarrer maintenant"
              className="animate-pulse-volt flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#C8FF00] text-black"
            >
              <Play weight="duotone" className="ml-0.5 h-5 w-5" />
            </motion.button>
          </div>
        </CinematicImage>
      </motion.div>

      {/* Recherche */}
      <div className="flex items-center gap-2 rounded-2xl border border-white/10 bg-[#11151D] px-3 py-2.5 focus-within:border-[#C8FF00]/60">
        <MagnifyingGlass weight="regular" className="h-4 w-4 text-slate-400" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Rechercher une séance (pompes, cardio…)"
          className="flex-1 bg-transparent text-xs text-white outline-none placeholder:text-slate-500"
          aria-label="Rechercher une séance"
        />
        {query && (
          <button onClick={() => setQuery('')} aria-label="Effacer" className="text-slate-400">
            <X className="h-3.5 w-3.5" />
          </button>
        )}
      </div>

      <ChipTabs items={WORKOUT_CATEGORIES} value={category} onChange={setCategory} layoutId="workoutCategoryPill" />

      <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
        {LEVELS.map((l) => (
          <button
            key={l.id}
            onClick={() => setLevel(l.id)}
            className={`shrink-0 rounded-lg px-2.5 py-1 text-[10px] font-semibold transition ${
              level === l.id ? 'bg-white/15 text-white' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            {l.label}
          </button>
        ))}
      </div>

      <SectionHeader title={`${filtered.length} séance${filtered.length > 1 ? 's' : ''}`} />

      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="rounded-3xl border border-dashed border-white/15 p-6 text-center text-xs text-slate-400"
          >
            {category === 'saved'
              ? 'Aucun favori pour l’instant : touche le signet d’une séance pour la retrouver ici.'
              : 'Aucune séance ne correspond à ces filtres.'}
          </motion.div>
        ) : (
          <motion.div
            key={`${category}-${level}`}
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="grid grid-cols-2 gap-2.5"
          >
            {filtered.map((p) => (
              <motion.div key={p.id} variants={fadeUpItem} layout>
                <WorkoutCard
                  program={p}
                  saved={user.savedWorkouts.includes(p.id)}
                  doneCount={user.workoutsDone[p.id] ?? 0}
                  onOpen={() => nav.openWorkout(p.id)}
                  onToggleSave={() => onToggleSave(p.id)}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
