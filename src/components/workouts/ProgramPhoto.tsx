import type { WorkoutProgram } from '../../data/workoutsData';
import { Dumbbell, Footprints } from '../DekIcons';

/** Pastille d'une séance dans une liste : icône selon le type (pas de photo sur les petites vignettes). */
export function ProgramPhoto({ program }: { program: WorkoutProgram }) {
  const cardio = program.photoCat === 'cardio' || program.photoCat === 'hiit';
  return (
    <span className="flex h-full w-full items-center justify-center bg-white/10 text-fg">
      {cardio ? <Footprints className="h-5 w-5" /> : <Dumbbell className="h-5 w-5" />}
    </span>
  );
}
