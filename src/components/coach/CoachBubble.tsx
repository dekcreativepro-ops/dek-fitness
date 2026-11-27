import { AnimatePresence, motion } from 'framer-motion';
import type { CoachProfile } from '../../utils/coachProfile';

/** Bulle du coach en direct (course, duel) : prénom + consigne courte. */
export function CoachBubble({ coach, line }: { coach: CoachProfile; line: string | null }) {
  return (
    <AnimatePresence>
      {line && (
        <motion.div
          key={line}
          initial={{ opacity: 0, y: -8, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none flex items-start gap-2 rounded-[20px] bg-ink/90 px-3 py-2 shadow-lg backdrop-blur-md"
          role="status"
        >
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-lime text-[13px] font-extrabold text-on-lime">
            {coach.name.slice(0, 1).toUpperCase()}
          </span>
          <span className="min-w-0 text-[13px] font-semibold leading-[18px] text-fg">
            <span className="block text-[11px] font-bold text-lime">{coach.name} · coach</span>
            {line}
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
