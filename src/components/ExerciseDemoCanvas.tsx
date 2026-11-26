import { motion } from 'framer-motion';
import type { DemoExercise } from '../types/dek';

interface ExerciseDemoCanvasProps {
  exercise: DemoExercise;
  compact?: boolean;
}

const DEMO_META: Record<
  DemoExercise,
  { gifUrl: string; title: string; target: string; cue: string; loopSec: number }
> = {
  pompes: {
    gifUrl: '/demos/pompes.gif',
    title: 'Démo HD • Pompes',
    target: 'Pectoraux • Bras',
    cue: 'Descends contrôlé jusqu’en bas • Pousse fort',
    loopSec: 1.8,
  },
  squats: {
    gifUrl: '/demos/squats.gif',
    title: 'Démo HD • Squats',
    target: 'Jambes • Fessiers',
    cue: 'Talons collés au sol • Dos droit à la montée',
    loopSec: 2.0,
  },
  gainage: {
    gifUrl: '/demos/gainage.gif',
    title: 'Démo HD • Gainage',
    target: 'Abdos • Ceinture',
    cue: 'Coudes sous les épaules • Garde la ligne droite',
    loopSec: 2.4,
  },
  jumping_jacks: {
    gifUrl: '/demos/jumping_jacks.gif',
    title: 'Démo HD • Jumping Jacks',
    target: 'Cardio • Épaules',
    cue: 'Bras hauts au-dessus de la tête • Réception souple',
    loopSec: 1.2,
  },
  corde: {
    gifUrl: '/demos/corde.gif',
    title: 'Démo HD • Corde à sauter',
    target: 'Cardio • Mollets',
    cue: 'Petits rebonds sur l’avant-pied • Poignets fluides',
    loopSec: 1.0,
  },
  burpees: {
    gifUrl: '/demos/burpees.gif',
    title: 'Démo HD • Burpees',
    target: 'Full Body • Cardio',
    cue: 'Planche solide au sol • Saut explosif vers le haut',
    loopSec: 1.6,
  },
};

export function ExerciseDemoCanvas({ exercise, compact = false }: ExerciseDemoCanvasProps) {
  const meta = DEMO_META[exercise];
  const heightClass = compact ? 'h-[170px]' : 'h-[220px]';

  return (
    <div className="rounded-[28px] bg-card p-4">
      <div className="mb-3">
        <div className="text-[15px] font-bold leading-5 text-fg">{meta.title}</div>
        <div className="text-[12px] font-medium leading-4 text-mute">{meta.target}</div>
      </div>

      {/* GIF animé + jauge DEPTH fine */}
      <div className={`flex w-full items-stretch gap-3 ${heightClass}`}>
        <div className="flex min-w-0 flex-1 items-center justify-center overflow-hidden rounded-[20px] bg-white">
          <img src={meta.gifUrl} alt={meta.title} className="h-full w-full object-contain" />
        </div>
        <div className="flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-medium text-mute">Depth</span>
          <div className="relative w-1 flex-1 rounded-full bg-rim">
            <motion.div
              animate={{ top: ['6%', '80%', '6%'] }}
              transition={{ duration: meta.loopSec, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute -inset-x-0.5 h-2.5 rounded-full bg-lime"
            />
          </div>
        </div>
      </div>

      <p className="mt-3 text-[13px] font-medium leading-[18px] text-mute">{meta.cue}</p>
    </div>
  );
}
