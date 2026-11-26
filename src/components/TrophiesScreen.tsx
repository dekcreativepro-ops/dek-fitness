import { useState } from 'react';
import { motion } from 'framer-motion';
import type { UserProfile } from '../types/dek';
import {
  ACHIEVEMENT_GROUPS,
  ACHIEVEMENTS,
  getAchievementStats,
  type AchievementDef,
} from '../utils/achievements';
import { BottomSheet, Card, CountUp, ProgressBar, ScreenHeader } from './ui/kit';
import { TrophyBadge } from './ui/TrophyBadge';

// Mur des trophées : écussons gagnés (couleur + reflet) et verrouillés (gris + progression).

export function TrophiesScreen({ user, onBack }: { user: UserProfile; onBack: () => void }) {
  const stats = getAchievementStats(user);
  const [open, setOpen] = useState<AchievementDef | null>(null);
  const earnedCount = ACHIEVEMENTS.filter((a) => a.metric(stats) >= a.target).length;
  const pct = Math.round((earnedCount / ACHIEVEMENTS.length) * 100);

  const openValue = open ? Math.min(open.target, open.metric(stats)) : 0;
  const openEarned = open ? open.metric(stats) >= open.target : false;

  return (
    <div className="no-scrollbar h-full overflow-y-auto bg-ink px-5 pb-8 pt-4">
      <ScreenHeader title="Trophées" onBack={onBack} />

      {/* Résumé */}
      <Card>
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[13px] font-medium text-mute">Écussons débloqués</div>
            <div className="num mt-1 text-[48px] font-extrabold leading-none text-fg">
              <CountUp value={earnedCount} />
              <span className="text-[22px] font-bold text-faint"> / {ACHIEVEMENTS.length}</span>
            </div>
          </div>
          <div className="flex -space-x-5">
            {ACHIEVEMENTS.filter((a) => a.metric(stats) >= a.target)
              .slice(-3)
              .map((a, i) => (
                <motion.div key={a.id} initial={{ y: 8, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 * i }}>
                  <TrophyBadge mark={a.mark} color={a.color} earned size={54} animated={false} />
                </motion.div>
              ))}
          </div>
        </div>
        <ProgressBar value={pct} className="mt-4" />
      </Card>

      {ACHIEVEMENT_GROUPS.map((g) => (
        <section key={g.id} className="mt-7">
          <h3 className="mb-3 text-[18px] font-bold leading-6 text-fg">{g.label}</h3>
          <div className="grid grid-cols-3 gap-2">
            {ACHIEVEMENTS.filter((a) => a.group === g.id).map((a, i) => {
              const value = a.metric(stats);
              const earned = value >= a.target;
              const progress = Math.min(1, value / a.target);
              return (
                <motion.button
                  key={a.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.03 * i, duration: 0.25, ease: 'easeOut' }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => setOpen(a)}
                  className="flex flex-col items-center rounded-[20px] bg-card px-1 pb-3 pt-3"
                >
                  <TrophyBadge mark={a.mark} color={a.color} earned={earned} size={64} animated={false} />
                  <span className={`mt-2 text-center text-[12px] font-semibold leading-4 ${earned ? 'text-fg' : 'text-faint'}`}>
                    {a.title}
                  </span>
                  {!earned && <ProgressBar value={progress * 100} className="mt-2 !h-1 w-14" />}
                </motion.button>
              );
            })}
          </div>
        </section>
      ))}

      <BottomSheet open={!!open} onClose={() => setOpen(null)}>
        {open && (
          <div className="flex flex-col items-center pb-2 text-center">
            <TrophyBadge mark={open.mark} color={open.color} earned={openEarned} size={128} animated={false} />
            <h3 className="mt-3 text-[20px] font-bold leading-6 text-fg">{open.title}</h3>
            <p className="mt-1 text-[14px] font-medium text-mute">{open.description}</p>
            <div className="mt-5 w-full rounded-[20px] bg-tile p-4">
              <div className="flex items-center justify-between text-[13px]">
                <span className="font-medium text-mute">{openEarned ? 'Débloqué' : 'Progression'}</span>
                <span className="num font-bold text-fg">
                  {openValue.toLocaleString('fr-FR')} / {open.target.toLocaleString('fr-FR')}
                </span>
              </div>
              <ProgressBar value={(openValue / open.target) * 100} className="mt-2" />
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
