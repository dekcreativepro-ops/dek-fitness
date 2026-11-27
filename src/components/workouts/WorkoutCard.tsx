import { motion } from 'framer-motion';
import { BookmarkSimple, Play } from '../DekIcons';
import type { WorkoutProgram } from '../../data/workoutsData';
import { usePhoto } from '../../utils/usePhoto';

/** Carte d'une séance guidée : image 3D de la séance + dégradé sombre pour le texte. */
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
  const photo = usePhoto(program.photoCat, 'card');
  return (
    <motion.div
      whileTap={{ scale: 0.97 }}
      onClick={onOpen}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter') onOpen();
      }}
      className={`relative cursor-pointer overflow-hidden rounded-[24px] bg-card ${tall ? 'h-60' : 'h-52'} ${className}`}
    >
      <img src={photo} alt="" loading="lazy" decoding="async" className="absolute inset-0 h-full w-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-t from-ink/90 via-ink/30 to-transparent" />

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
            saved ? 'bg-lime text-on-lime' : 'bg-black/45 text-white'
          }`}
        >
          <BookmarkSimple className="h-4 w-4" />
        </button>
      )}

      {doneCount > 0 && (
        <span className="absolute left-2.5 top-2.5 rounded-full bg-black/55 px-2.5 py-1 text-[11px] font-semibold text-lime">
          Faite {doneCount}×
        </span>
      )}

      <div className="absolute inset-x-0 bottom-0 p-3">
        <div className="line-clamp-2 text-[15px] font-bold leading-5 text-white">{program.title}</div>
        <div className="mt-1 flex items-center gap-1 text-[12px] font-medium text-white/80">
          <Play className="h-3 w-3 shrink-0" />
          <span className="truncate">
            {program.durationMin} min · {program.level}
          </span>
        </div>
      </div>
    </motion.div>
  );
}
