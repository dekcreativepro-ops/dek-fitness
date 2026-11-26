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
  const heightClass = compact ? 'h-[170px]' : 'h-[230px]';

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#0A0D13] shadow-xl">
      {/* En-tête lecteur */}
      <div className="flex items-center justify-between border-b border-white/10 bg-[#0F141D] px-3 py-2">
        <div className="flex items-center gap-2">
          <span className="h-2 w-2 animate-pulse rounded-full bg-[#C8FF00]" />
          <span className="font-hud text-[11px] font-bold text-white">{meta.title}</span>
        </div>
        <span className="rounded-full bg-[#C8FF00]/15 px-2 py-0.5 text-[10px] font-semibold text-[#C8FF00]">
          {meta.target}
        </span>
      </div>

      {/* Zone GIF animé réel haute lisibilité + Jauge DEPTH */}
      <div className={`relative flex w-full items-center justify-center bg-[#090B10] p-2.5 pr-10 ${heightClass}`}>
        <div className="relative flex h-full w-full items-center justify-center overflow-hidden rounded-xl bg-white shadow-inner">
          <img
            src={meta.gifUrl}
            alt={meta.title}
            className="h-full w-full object-contain"
          />
          <span className="font-hud absolute left-2 top-2 rounded-md bg-black/75 px-1.5 py-0.5 text-[9px] font-bold text-[#C8FF00] backdrop-blur">
            DÉMO ANIMÉE HD
          </span>
        </div>

        {/* Jauge DEPTH animée à droite */}
        <div className="absolute right-2.5 top-3 bottom-3 flex flex-col items-center gap-1">
          <span className="font-hud text-[8px] font-bold tracking-wider text-slate-400">
            DEPTH
          </span>
          <div className="relative w-2 flex-1 overflow-hidden rounded-full bg-white/15">
            <motion.div
              animate={{ top: ['10%', '76%', '10%'] }}
              transition={{ duration: meta.loopSec, repeat: Infinity, ease: 'easeInOut' }}
              className="absolute inset-x-0 h-3 rounded-full bg-[#C8FF00] shadow-[0_0_8px_#C8FF00]"
            />
          </div>
        </div>
      </div>

      {/* Consigne courte */}
      <div className="border-t border-white/10 bg-black/65 px-3 py-1.5 text-[11px] font-medium text-slate-200">
        <span className="mr-1.5 inline-block h-2 w-2 rounded-full bg-[#C8FF00]" />
        {meta.cue}
      </div>
    </div>
  );
}
