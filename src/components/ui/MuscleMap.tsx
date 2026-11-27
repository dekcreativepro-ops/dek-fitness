import type { MuscleGroup } from '../../types/dek';
import { BodyFigure } from './BodyFigure';

// Carte musculaire (face + dos) en lecture seule : muscles principaux en lime, secondaires en lime atténué.

interface MuscleMapProps {
  primary: MuscleGroup[];
  secondary?: MuscleGroup[];
  className?: string;
}

export function MuscleMap({ primary, secondary = [], className = 'h-40' }: MuscleMapProps) {
  const level = (m: MuscleGroup): 0 | 1 | 2 => (primary.includes(m) ? 2 : secondary.includes(m) ? 1 : 0);
  return (
    <div className={`flex items-end justify-center gap-4 ${className}`}>
      <BodyFigure view="front" level={level} className="h-full w-auto" />
      <BodyFigure view="back" level={level} className="h-full w-auto" />
    </div>
  );
}
