import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CalendarCheck, CaretLeft, CheckCircle, Medal, Users, VideoCamera } from '../DekIcons';
import { WORKOUT_PROGRAMS } from '../../data/workoutsData';
import type { CoachProfile } from '../../types/dek';
import { CheckDraw, ConfettiBurst } from '../ui/AnimatedIcons';
import { BottomSheet, CinematicImage, CountUp, SectionHeader, StarRow } from '../ui/kit';
import { fadeUpItem, staggerContainer } from '../ui/motion';
import { UserAvatar } from '../UserAvatar';
import { WorkoutCard } from '../workouts/WorkoutCard';

const SLOTS = ['07:00', '08:30', '12:30', '18:00', '19:30'];

function nextDays(count: number) {
  const fmt = new Intl.DateTimeFormat('fr-FR', { weekday: 'short', day: 'numeric' });
  return Array.from({ length: count }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() + i + 1);
    return { key: d.toISOString().slice(0, 10), label: fmt.format(d).replace('.', ''), date: d };
  });
}

export function CoachProfileScreen({
  coach,
  onBack,
  onOpenWorkout,
  onBook,
}: {
  coach: CoachProfile;
  onBack: () => void;
  onOpenWorkout: (id: string) => void;
  onBook: (coachName: string) => void;
}) {
  const [bookingOpen, setBookingOpen] = useState(false);
  const [dayKey, setDayKey] = useState<string | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [mode, setMode] = useState<'presentiel' | 'visio'>('presentiel');
  const [confirmed, setConfirmed] = useState<string | null>(null);

  const days = useMemo(() => nextDays(7), []);
  const programs = WORKOUT_PROGRAMS.filter((p) => p.coachId === coach.id);
  const breakdown = coach.ratingBreakdown ?? [1, 0, 0, 0, 0];
  const totalRatings = breakdown.reduce((a, b) => a + b, 0);
  const preset = coach.avatarPreset ?? 'manga-sprint';

  const confirmBooking = () => {
    const day = days.find((d) => d.key === dayKey);
    if (!day || !slot) return;
    const label = new Intl.DateTimeFormat('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }).format(day.date);
    setBookingOpen(false);
    setConfirmed(`${label} • ${slot} • ${mode === 'visio' ? 'Visio' : 'Présentiel'}`);
    onBook(coach.name);
  };

  return (
    <div className="flex h-full flex-col bg-[#080A0E]">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        <CinematicImage src={`/avatars/${preset}.jpg`} position="50% 25%" tint={coach.accent} className="h-[330px]" intensity={0.6}>
          <div className="absolute inset-0 bg-gradient-to-t from-[#080A0E] via-[#080A0E]/30 to-black/30" />
          <button
            onClick={onBack}
            aria-label="Retour"
            className="absolute left-3 top-3 flex h-10 w-10 items-center justify-center rounded-2xl bg-black/45 text-white backdrop-blur-md active:scale-90"
          >
            <CaretLeft weight="bold" className="h-5 w-5" />
          </button>
          <motion.div variants={staggerContainer} initial="hidden" animate="show" className="absolute inset-x-0 bottom-0 p-4">
            <motion.div variants={fadeUpItem} className="flex items-center gap-1.5">
              <h1 className="font-hud text-2xl font-bold text-white">{coach.name}</h1>
              {coach.verified && <CheckCircle weight="duotone" className="h-5 w-5 text-[#00E5FF]" />}
            </motion.div>
            <motion.p variants={fadeUpItem} className="text-xs font-semibold" style={{ color: coach.accent }}>
              {coach.specialty}
            </motion.p>
            <motion.div variants={fadeUpItem} className="mt-2 flex flex-wrap gap-1.5">
              {coach.tags.map((t) => (
                <span key={t} className="rounded-full bg-white/10 px-2.5 py-0.5 text-[10px] font-semibold text-white backdrop-blur">
                  {t}
                </span>
              ))}
            </motion.div>
          </motion.div>
        </CinematicImage>

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3 px-3.5 pb-28">
          {/* Statistiques */}
          <motion.section variants={fadeUpItem} className="grid grid-cols-3 divide-x divide-white/10 rounded-[24px] border border-white/10 bg-[#11151D] py-3 text-center">
            <div>
              <Medal weight="duotone" className="mx-auto h-4 w-4 text-[#C8FF00]" />
              <div className="font-hud mt-0.5 text-lg font-bold text-white">
                <CountUp value={coach.experienceYears ?? 5} /> ans
              </div>
              <div className="text-[9px] text-slate-400">Expérience</div>
            </div>
            <div>
              <CalendarCheck weight="duotone" className="mx-auto h-4 w-4 text-[#00E5FF]" />
              <div className="font-hud mt-0.5 text-lg font-bold text-white">
                <CountUp value={coach.completedSessions ?? 300} />
              </div>
              <div className="text-[9px] text-slate-400">Séances</div>
            </div>
            <div>
              <Users weight="duotone" className="mx-auto h-4 w-4 text-[#FF8A00]" />
              <div className="font-hud mt-0.5 text-lg font-bold text-white">
                <CountUp value={coach.studentsCount} />
              </div>
              <div className="text-[9px] text-slate-400">Élèves actifs</div>
            </div>
          </motion.section>

          <motion.section variants={fadeUpItem} className="rounded-[24px] border border-white/10 bg-[#11151D] p-4">
            <h2 className="font-hud text-sm font-bold text-white">À propos</h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-slate-300">{coach.bio}</p>
            <div className="mt-3 flex items-center gap-2 rounded-2xl bg-[#0B0E14] px-3 py-2 text-[11px] text-slate-300">
              <VideoCamera weight="duotone" className="h-4 w-4 text-[#C8FF00]" />
              Prochain live : <strong className="text-white">{coach.nextSession}</strong>
            </div>
          </motion.section>

          {programs.length > 0 && (
            <motion.section variants={fadeUpItem}>
              <SectionHeader title="Ses programmes" />
              <div className="no-scrollbar snap-x-mandatory -mx-3.5 flex gap-2.5 overflow-x-auto px-3.5">
                {programs.map((p) => (
                  <div key={p.id} className="w-[200px] shrink-0 snap-start">
                    <WorkoutCard program={p} saved={false} onOpen={() => onOpenWorkout(p.id)} />
                  </div>
                ))}
              </div>
            </motion.section>
          )}

          {/* Avis */}
          <motion.section variants={fadeUpItem} className="rounded-[24px] border border-white/10 bg-[#11151D] p-4">
            <SectionHeader title="Avis des athlètes" />
            <div className="flex items-center gap-4">
              <div className="text-center">
                <div className="font-hud text-5xl font-bold leading-none text-white">{coach.rating.toFixed(1)}</div>
                <StarRow rating={coach.rating} className="h-3 w-3" />
                <div className="mt-0.5 text-[10px] text-slate-400">{totalRatings} avis</div>
              </div>
              <div className="flex-1 space-y-1">
                {breakdown.map((n, i) => (
                  <div key={i} className="flex items-center gap-1.5 text-[10px] text-slate-400">
                    <span className="w-2">{5 - i}</span>
                    <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        className="h-full rounded-full bg-[#F5C542]"
                        initial={{ width: 0 }}
                        animate={{ width: `${totalRatings ? (n / totalRatings) * 100 : 0}%` }}
                        transition={{ duration: 0.8, delay: 0.2 + i * 0.07, ease: 'easeOut' }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {(coach.reviews ?? []).map((r) => (
                <div key={r.id} className="rounded-2xl bg-[#0B0E14] p-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      avatar={{ mode: 'preset', presetId: r.avatarPreset, diceStyle: 'lorelei', seed: r.author, bgColor: '0f172a', auraColor: '#00E5FF' }}
                      size="xs"
                      ring={false}
                    />
                    <div className="min-w-0">
                      <div className="truncate text-xs font-bold text-white">{r.author}</div>
                      <StarRow rating={r.rating} className="h-2.5 w-2.5" />
                    </div>
                    <span className="ml-auto text-[10px] text-slate-500">{r.timeAgo}</span>
                  </div>
                  <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">{r.text}</p>
                </div>
              ))}
            </div>
          </motion.section>
        </motion.div>
      </div>

      <div className="safe-bottom shrink-0 border-t border-white/10 bg-[#080A0E]/95 px-3.5 pb-3 pt-2.5 backdrop-blur">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={() => setBookingOpen(true)}
          className="font-hud flex w-full items-center justify-center gap-2 rounded-full bg-[#C8FF00] py-3.5 text-sm font-bold text-black shadow-[0_10px_30px_-10px_#C8FF00]"
        >
          <CalendarCheck weight="duotone" className="h-5 w-5" /> RÉSERVER UNE SÉANCE
          <span className="rounded-full bg-black/15 px-2 py-0.5 text-[10px]">{coach.priceMonth}</span>
        </motion.button>
      </div>

      {/* Réservation */}
      <BottomSheet open={bookingOpen} onClose={() => setBookingOpen(false)} title={`Réserver avec ${coach.name}`}>
        <div className="space-y-3.5">
          <div>
            <div className="mb-1.5 text-[11px] font-semibold text-slate-300">Jour</div>
            <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
              {days.map((d) => (
                <button
                  key={d.key}
                  onClick={() => setDayKey(d.key)}
                  className={`font-hud flex w-14 shrink-0 flex-col items-center rounded-2xl border py-2 text-[11px] font-bold capitalize transition ${
                    dayKey === d.key ? 'border-[#C8FF00] bg-[#C8FF00] text-black' : 'border-white/10 bg-[#0B0E14] text-slate-300'
                  }`}
                >
                  {d.label.split(' ')[0]}
                  <span className="text-base">{d.date.getDate()}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-1.5 text-[11px] font-semibold text-slate-300">Créneau</div>
            <div className="grid grid-cols-3 gap-1.5">
              {SLOTS.map((s) => (
                <button
                  key={s}
                  onClick={() => setSlot(s)}
                  className={`font-hud rounded-xl border py-2 text-xs font-bold transition ${
                    slot === s ? 'border-[#C8FF00] bg-[#C8FF00]/15 text-[#C8FF00]' : 'border-white/10 bg-[#0B0E14] text-slate-300'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1.5 rounded-2xl bg-[#0B0E14] p-1">
            {(['presentiel', 'visio'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`font-hud rounded-xl py-2 text-[11px] font-bold transition ${
                  mode === m ? 'bg-white/15 text-white' : 'text-slate-400'
                }`}
              >
                {m === 'presentiel' ? 'Présentiel' : 'Visio caméra'}
              </button>
            ))}
          </div>
          <button
            disabled={!dayKey || !slot}
            onClick={confirmBooking}
            className="font-hud w-full rounded-full bg-[#C8FF00] py-3.5 text-sm font-bold text-black transition disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-slate-500"
          >
            {dayKey && slot ? 'CONFIRMER LA RÉSERVATION' : 'Choisis un jour et un créneau'}
          </button>
        </div>
      </BottomSheet>

      {/* Confirmation façon « Congratulation » */}
      <AnimatePresence>
        {confirmed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-5 backdrop-blur-sm"
            onClick={() => setConfirmed(null)}
          >
            <motion.div
              initial={{ scale: 0.8, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 22 }}
              onClick={(e) => e.stopPropagation()}
              className="relative w-full rounded-[32px] bg-[#C8FF00] p-5 text-center text-black"
            >
              <ConfettiBurst count={20} />
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-black/10 ring-8 ring-black/5">
                <CheckDraw className="h-14 w-14" />
              </div>
              <h2 className="font-hud mt-3 text-xl font-bold">Réservation confirmée</h2>
              <p className="mt-1 text-xs font-medium text-black/70 first-letter:uppercase">{confirmed}</p>
              <p className="mt-1 text-[11px] text-black/60">Un rappel te sera envoyé la veille.</p>
              <button
                onClick={() => setConfirmed(null)}
                className="font-hud mt-4 w-full rounded-full bg-[#080A0E] py-3 text-xs font-bold text-[#C8FF00]"
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
