import { motion } from 'framer-motion';
import { Play } from '../DekIcons';
import { useDekNav } from '../../context/DekNav';
import { getProgram } from '../../data/workoutsData';
import { getWorkoutResume } from '../../utils/workoutResume';

/** Carte « Continuer la séance » (progression en %), affichée s'il existe une séance interrompue. */
export function ResumeCard() {
  const nav = useDekNav();
  const resume = getWorkoutResume();
  const program = resume ? getProgram(resume.programId) : undefined;
  if (!resume || !program) return null;
  const pct = Math.round((resume.done.length / Math.max(1, resume.total)) * 100);

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => nav.startWorkout(program.id)}
      className="flex w-full items-center gap-3 rounded-[24px] border border-[#C8FF00]/30 bg-[#11151D] p-2.5 text-left"
    >
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl">
        <img src={program.image} alt="" className="h-full w-full object-cover" style={{ objectPosition: program.imagePosition }} />
        <div className="absolute inset-0 bg-black/30" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="font-hud text-[9px] font-bold tracking-wider text-[#C8FF00]">CONTINUER LA SÉANCE</div>
        <div className="font-hud truncate text-[13px] font-bold text-white">{program.title}</div>
        <div className="mt-1 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              className="h-full rounded-full bg-[#C8FF00]"
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 0.8 }}
            />
          </div>
          <span className="font-hud text-[11px] font-bold text-white">{pct} %</span>
        </div>
      </div>
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#C8FF00] text-black">
        <Play weight="duotone" className="ml-0.5 h-4 w-4" />
      </span>
    </motion.button>
  );
}
