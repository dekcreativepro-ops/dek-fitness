import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Funnel, ListNumbers, MagnifyingGlass, Play, X } from '../DekIcons';
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
import { ChipTabs, CinematicImage, ScreenHeader } from '../ui/kit';
import { fadeUpItem, staggerContainer } from '../ui/motion';
import { ResumeCard } from './ResumeCard';
import { WorkoutCard } from './WorkoutCard';

type CategoryFilter = WorkoutCategory | 'all' | 'saved';
type LevelFilter = WorkoutLevel | 'all';
type SortMode = 'default' | 'duree' | 'kcal' | 'note';

const SORTS: { id: SortMode; label: string }[] = [
  { id: 'default', label: 'Tri' },
  { id: 'duree', label: 'Durée' },
  { id: 'kcal', label: 'Calories' },
  { id: 'note', label: 'Note' },
];

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
  const [sort, setSort] = useState<SortMode>('default');
  const [showFilters, setShowFilters] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

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
    }).sort((a, b) =>
      sort === 'duree' ? a.durationMin - b.durationMin : sort === 'kcal' ? b.kcal - a.kcal : sort === 'note' ? b.rating - a.rating : 0,
    );
  }, [category, level, query, sort, user.savedWorkouts]);

  const cycleSort = () => setSort((cur) => SORTS[(SORTS.findIndex((x) => x.id === cur) + 1) % SORTS.length].id);
  const sortLabel = SORTS.find((x) => x.id === sort)?.label ?? 'Tri';
  const toolBtn = (active: boolean) =>
    `flex h-11 flex-1 items-center justify-center gap-1.5 rounded-full text-[13px] font-semibold transition active:scale-95 ${
      active ? 'bg-lime text-on-lime' : 'bg-tile text-fg'
    }`;

  return (
    <div className="space-y-4 pb-2">
      <ScreenHeader title="Séances guidées" onBack={() => nav.goTab('home')} />

      <ResumeCard />

      <ChipTabs items={WORKOUT_CATEGORIES} value={category} onChange={setCategory} layoutId="workoutCategoryPill" />

      {/* Filtres | Tri | Rechercher */}
      <div className="flex gap-2">
        <button type="button" onClick={() => setShowFilters((v) => !v)} aria-expanded={showFilters} className={toolBtn(showFilters || level !== 'all')}>
          <Funnel className="h-4 w-4" /> Filtres
        </button>
        <button type="button" onClick={cycleSort} className={toolBtn(sort !== 'default')}>
          <ListNumbers className="h-4 w-4" /> {sortLabel}
        </button>
        <button type="button" onClick={() => setShowSearch((v) => !v)} aria-expanded={showSearch} className={toolBtn(showSearch || !!query)}>
          <MagnifyingGlass className="h-4 w-4" /> Rechercher
        </button>
      </div>

      {showFilters && <ChipTabs items={LEVELS} value={level} onChange={setLevel} layoutId="workoutLevelPill" />}

      {showSearch && (
        <div className="flex items-center gap-2 rounded-2xl bg-tile px-4 py-3 focus-within:ring-1 focus-within:ring-lime">
          <MagnifyingGlass className="h-4 w-4 text-mute" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher une séance (pompes, cardio…)"
            className="flex-1 bg-transparent text-[14px] text-fg outline-none placeholder:text-faint"
            aria-label="Rechercher une séance"
          />
          {query && (
            <button type="button" onClick={() => setQuery('')} aria-label="Effacer" className="text-mute">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      )}

      {/* Recommandation */}
      <motion.div whileTap={{ scale: 0.98 }} onClick={() => nav.openWorkout(recommended.id)} className="cursor-pointer">
        <CinematicImage src={recommended.image} position={recommended.imagePosition} className="h-44 rounded-[24px]">
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/25 to-transparent" />
          <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4">
            <div className="min-w-0">
              <span className="text-[12px] font-semibold text-lime">Recommandée pour toi</span>
              <h2 className="text-[18px] font-bold leading-6 text-white">{recommended.title}</h2>
              <p className="text-[12px] font-medium text-white/80">
                {recommended.durationMin} min · {recommended.kcal} kcal · {recommended.level}
              </p>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                nav.startWorkout(recommended.id);
              }}
              aria-label="Démarrer maintenant"
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-lime text-on-lime transition active:scale-90"
            >
              <Play className="ml-0.5 h-5 w-5" />
            </button>
          </div>
        </CinematicImage>
      </motion.div>

      <AnimatePresence mode="popLayout">
        {filtered.length === 0 ? (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="rounded-[24px] bg-card p-6 text-center text-[13px] text-mute">
            {category === 'saved'
              ? 'Aucun favori pour l’instant : touche le signet d’une séance pour la retrouver ici.'
              : 'Aucune séance ne correspond à ces filtres.'}
          </motion.div>
        ) : (
          <motion.div key={`${category}-${level}`} variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 gap-3">
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
