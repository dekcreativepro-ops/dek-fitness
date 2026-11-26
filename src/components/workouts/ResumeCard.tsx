import { motion } from 'framer-motion';
import { Play } from '../DekIcons';
import { useDekNav } from '../../context/DekNav';
import { getProgram } from '../../data/workoutsData';
import { getWorkoutResume } from '../../utils/workoutResume';
import { MASCOT_FALLBACK, PROGRAM_MASCOT } from '../../data/mascots';
import { Mascot3D } from '../ui/Mascot3D';
import { ProgressBar } from '../ui/kit';

/** Carte « Continuer la séance » (progression en %), affichée s'il existe une séance interrompue. */
export function ResumeCard() {
  const nav = useDekNav();
  const resume = getWorkoutResume();
  const program = resume ? getProgram(resume.programId) : undefined;
  if (!resume || !program) return null;
  const { pose, tone } = PROGRAM_MASCOT[program.photoCat] ?? MASCOT_FALLBACK;
  const pct = Math.round((resume.done.length / Math.max(1, resume.total)) * 100);

  return (
    <motion.button
      type="button"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => nav.startWorkout(program.id)}
      className="flex w-full items-center gap-3 rounded-[24px] bg-card p-3 text-left"
    >
      <div className={`h-14 w-14 shrink-0 overflow-hidden rounded-[18px] ${tone === 'lime' ? 'bg-lime' : 'bg-white'}`}>
        <Mascot3D pose={pose} tone={tone} className="h-full w-full scale-125" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[12px] font-semibold text-lime">Continuer la séance</div>
        <div className="truncate text-[15px] font-bold leading-5 text-fg">{program.title}</div>
        <div className="mt-2 flex items-center gap-2">
          <ProgressBar value={pct} className="flex-1" />
          <span className="num text-[12px] font-bold text-fg">{pct} %</span>
        </div>
      </div>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-lime text-on-lime">
        <Play className="ml-0.5 h-5 w-5" />
      </span>
    </motion.button>
  );
}
