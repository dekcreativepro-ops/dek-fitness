import { motion } from 'framer-motion';
import { BookmarkSimple, Clock, Fire } from '../DekIcons';
import { LEVEL_COLORS, type WorkoutProgram } from '../../data/workoutsData';

/** Carte photo d'une séance guidée (grille, carrousel). */
export function WorkoutCard({
  program,
  saved,
  doneCount = 0,
  onOpen,
  onToggleSave,
  className = '',
  tall = false,
}: {
  program: WorkoutProgram;
  saved: boolean;
  doneCount?: number;
  onOpen: () => void;
  onToggleSave?: () => void;
  className?: string;
  tall?: boolean;
}) {
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen();
      }}
      className={`group relative cursor-pointer overflow-hidden rounded-[24px] border border-white/10 bg-[#0B0E14] ${
        tall ? 'h-56' : 'h-44'
      } ${className}`}
    >
      <img
        src={program.image}
        alt=""
        loading="lazy"
        decoding="async"
        className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        style={{ objectPosition: program.imagePosition }}
      />
      <div
        className="absolute inset-0 mix-blend-color"
        style={{ background: `linear-gradient(160deg, ${program.tint}50, transparent 60%)` }}
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/35 to-black/10" />

      {onToggleSave && (
        <motion.button
          whileTap={{ scale: 0.8 }}
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          aria-pressed={saved}
          aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-xl backdrop-blur-md transition ${
            saved ? 'bg-[#C8FF00] text-black' : 'bg-black/45 text-white'
          }`}
        >
          <motion.span key={String(saved)} initial={{ scale: 0.4 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 500, damping: 15 }}>
            <BookmarkSimple weight={saved ? 'duotone' : 'regular'} className="h-4 w-4" />
          </motion.span>
        </motion.button>
      )}

      {doneCount > 0 && (
        <span className="font-hud absolute left-2.5 top-2.5 rounded-lg bg-black/55 px-2 py-0.5 text-[9px] font-bold text-[#C8FF00] backdrop-blur">
          ✓ {doneCount}× FAITE
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="font-hud line-clamp-2 text-[13px] font-bold leading-tight text-white">{program.title}</div>
        <div className="mt-1.5 flex flex-wrap items-center gap-1.5 text-[10px] font-semibold text-slate-200">
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 backdrop-blur">
            <Clock weight="duotone" className="h-3 w-3" /> {program.durationMin} min
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 backdrop-blur">
            <Fire weight="duotone" className="h-3 w-3 text-orange-400" /> {program.kcal}
          </span>
          <span className="inline-flex items-center gap-1" style={{ color: LEVEL_COLORS[program.level] }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ backgroundColor: LEVEL_COLORS[program.level] }} />
            {program.level}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
