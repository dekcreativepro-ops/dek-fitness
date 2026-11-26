import { motion } from 'framer-motion';
import { BookmarkSimple, Play } from '../DekIcons';
import type { WorkoutProgram } from '../../data/workoutsData';
import { MASCOT_FALLBACK, PROGRAM_MASCOT } from '../../data/mascots';
import { Mascot3D } from '../ui/Mascot3D';

/** Carte d'une séance guidée : mascotte 3D sur fond blanc ou vert (les photos sont réservées aux bannières). */
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
  const { pose, tone } = PROGRAM_MASCOT[program.photoCat] ?? MASCOT_FALLBACK;
  const lime = tone === 'lime';
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen();
      }}
      className={`relative cursor-pointer overflow-hidden rounded-[24px] ${lime ? 'bg-lime' : 'bg-card'} ${tall ? 'h-60' : 'h-52'} ${className}`}
    >
      <Mascot3D pose={pose} tone={tone} className="absolute inset-x-0 top-2 h-[62%] w-full" />

      {onToggleSave && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleSave();
          }}
          aria-pressed={saved}
          aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
          className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full transition active:scale-90 ${
            saved ? 'bg-ink text-lime' : lime ? 'bg-black/15 text-ink' : 'bg-white/10 text-fg'
          }`}
        >
          <BookmarkSimple className="h-4 w-4" />
        </button>
      )}

      {doneCount > 0 && (
        <span className="absolute left-2.5 top-2.5 rounded-full bg-ink px-2.5 py-1 text-[11px] font-semibold text-lime">
          Faite {doneCount}×
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className={`line-clamp-2 text-[15px] font-bold leading-5 ${lime ? 'text-[#0B0F00]' : 'text-fg'}`}>{program.title}</div>
        <div className={`mt-1 flex items-center gap-1 text-[12px] font-medium ${lime ? 'text-[#2B3300]' : 'text-mute'}`}>
          <Play className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {program.durationMin} min · {program.level}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
