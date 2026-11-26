import type { WorkoutProgram } from '../../data/workoutsData';
import { usePhoto } from '../../utils/usePhoto';

/** Vignette d'une séance (utilisable dans une liste : le hook est dans ce composant). */
export function ProgramPhoto({ program, className = 'h-full w-full object-cover' }: { program: WorkoutProgram; className?: string }) {
  const src = usePhoto(program.photoCat, 'card');
  return <img src={src} alt="" loading="lazy" draggable={false} className={className} />;
}
