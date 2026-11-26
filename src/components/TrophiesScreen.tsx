import { useState } from 'react';
import { motion } from 'framer-motion';
import type { UserProfile } from '../types/dek';
import {
  ACHIEVEMENT_GROUPS,
  ACHIEVEMENTS,
  getAchievementStats,
  type AchievementDef,
} from '../utils/achievements';
import { TrophyShine } from './ui/AnimatedIcons';
import { BottomSheet, CountUp, ScreenHeader } from './ui/kit';
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
    <div className="no-scrollbar h-full overflow-y-auto bg-[#080A0E] px-3.5 pb-8 pt-3">
      <ScreenHeader title="TROPHÉES" onBack={onBack} right={<TrophyShine className="h-6 w-6" />} />

      {/* Résumé */}
      <div className="relative overflow-hidden rounded-[26px] border border-white/10 bg-gradient-to-br from-[#1A2212] via-[#11151D] to-[#0B0E14] p-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="font-hud text-[10px] font-bold tracking-widest text-slate-400">COLLECTION</div>
            <div className="font-hud text-3xl font-bold text-white">
              <CountUp value={earnedCount} />
              <span className="text-base text-slate-500"> / {ACHIEVEMENTS.length}</span>
            </div>
            <div className="text-[11px] text-slate-400">écussons débloqués</div>
          </div>
          <div className="flex -space-x-5">
            {ACHIEVEMENTS.filter((a) => a.metric(stats) >= a.target)
              .slice(-3)
              .map((a, i) => (
                <motion.div key={a.id} initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.1 * i }}>
                  <TrophyBadge mark={a.mark} color={a.color} earned size={54} animated={false} />
                </motion.div>
              ))}
          </div>
        </div>
        <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-black/60">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[#00E5FF] to-[#C8FF00]"
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.9 }}
          />
        </div>
      </div>

      {ACHIEVEMENT_GROUPS.map((g) => (
        <section key={g.id} className="mt-5">
          <h3 className="font-hud mb-2 px-0.5 text-[13px] font-bold text-white">{g.label}</h3>
          <div className="grid grid-cols-3 gap-2">
            {ACHIEVEMENTS.filter((a) => a.group === g.id).map((a, i) => {
              const value = a.metric(stats);
              const earned = value >= a.target;
              const progress = Math.min(1, value / a.target);
              return (
                <motion.button
                  key={a.id}
                  initial={{ opacity: 0, scale: 0.85 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.04 * i, type: 'spring', stiffness: 320, damping: 22 }}
                  whileTap={{ scale: 0.93 }}
                  onClick={() => setOpen(a)}
                  className="flex flex-col items-center rounded-[22px] bg-[#11151D] px-1 pb-2.5 pt-2"
                >
                  <TrophyBadge mark={a.mark} color={a.color} earned={earned} size={70} />
                  <span className={`font-hud mt-1 text-center text-[10px] font-bold leading-tight ${earned ? 'text-white' : 'text-slate-500'}`}>
                    {a.title}
                  </span>
                  {!earned && (
                    <div className="mt-1.5 h-1 w-14 overflow-hidden rounded-full bg-white/10">
                      <div className="h-full rounded-full" style={{ width: `${progress * 100}%`, backgroundColor: a.color }} />
                    </div>
                  )}
                </motion.button>
              );
            })}
          </div>
        </section>
      ))}

      <BottomSheet open={!!open} onClose={() => setOpen(null)} accent={open?.color}>
        {open && (
          <div className="flex flex-col items-center pb-2 text-center">
            <motion.div
              initial={{ rotateY: 180, scale: 0.6 }}
              animate={{ rotateY: 0, scale: 1 }}
              transition={{ type: 'spring', stiffness: 200, damping: 16 }}
              style={{ perspective: 600 }}
            >
              <TrophyBadge mark={open.mark} color={open.color} earned={openEarned} size={140} />
            </motion.div>
            <h3 className="font-hud mt-2 text-xl font-bold text-white">{open.title}</h3>
            <p className="mt-1 text-xs text-slate-400">{open.description}</p>
            <div className="mt-4 w-full rounded-2xl bg-[#0B0E14] p-3">
              <div className="flex justify-between text-[11px]">
                <span className="text-slate-400">{openEarned ? 'Débloqué ✓' : 'Progression'}</span>
                <span className="font-hud font-bold text-white">
                  {openValue.toLocaleString('fr-FR')} / {open.target.toLocaleString('fr-FR')}
                </span>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full"
                  style={{ backgroundColor: open.color }}
                  initial={{ width: 0 }}
                  animate={{ width: `${(openValue / open.target) * 100}%` }}
                  transition={{ duration: 0.8 }}
                />
              </div>
            </div>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
