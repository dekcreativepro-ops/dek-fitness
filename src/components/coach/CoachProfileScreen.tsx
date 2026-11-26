import { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft } from '../DekIcons';
import { WORKOUT_PROGRAMS } from '../../data/workoutsData';
import type { CoachProfile } from '../../types/dek';
import { CheckDraw } from '../ui/AnimatedIcons';
import { BottomSheet, Button, Card, CinematicImage, CountUp, IconButton, ListRow, SectionHeader, StarRow, StatTiles } from '../ui/kit';
import { fadeUpItem, staggerContainer } from '../ui/motion';
import { UserAvatar } from '../UserAvatar';
import { ProgramPhoto } from '../workouts/ProgramPhoto';

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
    <div className="flex h-full flex-col bg-ink">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        <CinematicImage src={`/avatars/${preset}.jpg`} position="50% 25%" className="h-[340px]" intensity={0.6}>
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-black/10 to-black/30" />
          <div className="absolute left-4 top-4">
            <IconButton label="Retour" variant="glass" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </IconButton>
          </div>
        </CinematicImage>

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 px-5 pb-8">
          <motion.div variants={fadeUpItem} className="relative -mt-12">
            <h1 className="text-[26px] font-bold leading-8 text-fg">{coach.name}</h1>
            <p className="text-[14px] font-semibold text-lime">{coach.specialty}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {coach.tags.map((t) => (
                <span key={t} className="rounded-full bg-tile px-3 py-1.5 text-[13px] font-semibold text-fg">
                  {t}
                </span>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUpItem}>
            <Card>
              <h2 className="text-[16px] font-bold text-fg">À propos</h2>
              <p className="mt-2 text-[14px] leading-5 text-mute">{coach.bio}</p>
              <div className="mt-3 text-[13px] text-mute">
                Prochain live : <strong className="font-bold text-fg">{coach.nextSession}</strong>
              </div>
              <StatTiles
                className="mt-4 border-t border-rim pt-4"
                items={[
                  { label: 'Expérience', value: <><CountUp value={coach.experienceYears ?? 5} /><span className="ml-1 text-[12px] font-medium text-mute">ans</span></> },
                  { label: 'Séances', value: <CountUp value={coach.completedSessions ?? 300} /> },
                  { label: 'Élèves', value: <CountUp value={coach.studentsCount} /> },
                ]}
              />
            </Card>
          </motion.div>

          {programs.length > 0 && (
            <motion.div variants={fadeUpItem}>
              <SectionHeader title="Programmes en ligne" />
              <div className="space-y-2">
                {programs.map((p) => (
                  <ListRow
                    key={p.id}
                    onClick={() => onOpenWorkout(p.id)}
                    leading={<ProgramPhoto program={p} />}
                    title={p.title}
                    subtitle={`${p.durationMin} min · ${p.level}`}
                  />
                ))}
              </div>
            </motion.div>
          )}

          {/* Avis */}
          <motion.div variants={fadeUpItem}>
            <Card>
              <h2 className="mb-3 text-[16px] font-bold text-fg">Avis des athlètes</h2>
              <div className="flex items-center gap-5">
                <div>
                  <div className="num text-[44px] font-extrabold leading-none text-fg">{coach.rating.toFixed(1)}</div>
                  <StarRow rating={coach.rating} className="mt-2 h-3.5 w-3.5" />
                  <div className="mt-1 text-[12px] text-mute">{totalRatings} avis</div>
                </div>
                <div className="flex-1 space-y-1.5">
                  {breakdown.map((n, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px] text-mute">
                      <span className="num w-2">{5 - i}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-rim">
                        <motion.div
                          className="h-full rounded-full bg-lime"
                          initial={{ width: 0 }}
                          animate={{ width: `${totalRatings ? (n / totalRatings) * 100 : 0}%` }}
                          transition={{ duration: 0.6, delay: 0.15 + i * 0.05, ease: 'easeOut' }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                {(coach.reviews ?? []).map((r) => (
                  <div key={r.id} className="rounded-[20px] bg-tile p-3">
                    <div className="flex items-center gap-2">
                      <UserAvatar
                        avatar={{ mode: 'preset', presetId: r.avatarPreset, diceStyle: 'lorelei', seed: r.author, bgColor: '0E0F12', auraColor: '#5BD6FF' }}
                        size="xs"
                        ring={false}
                      />
                      <div className="min-w-0">
                        <div className="truncate text-[14px] font-bold text-fg">{r.author}</div>
                        <StarRow rating={r.rating} className="h-3 w-3" />
                      </div>
                      <span className="ml-auto text-[12px] text-faint">{r.timeAgo}</span>
                    </div>
                    <p className="mt-2 text-[13px] leading-[18px] text-mute">{r.text}</p>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </motion.div>
      </div>

      <div className="safe-bottom shrink-0 bg-ink px-5 pb-4 pt-3">
        <Button fullWidth trailingArrow onClick={() => setBookingOpen(true)}>
          Réserver une séance · {coach.priceMonth}
        </Button>
      </div>

      {/* Réservation */}
      <BottomSheet open={bookingOpen} onClose={() => setBookingOpen(false)} title={`Réserver avec ${coach.name}`}>
        <div className="space-y-4">
          <div>
            <div className="mb-2 text-[13px] font-semibold text-mute">Jour</div>
            <div className="no-scrollbar flex gap-2 overflow-x-auto">
              {days.map((d) => (
                <button
                  type="button"
                  key={d.key}
                  onClick={() => setDayKey(d.key)}
                  className={`flex h-16 w-14 shrink-0 flex-col items-center justify-center rounded-[18px] text-[12px] font-semibold capitalize transition ${
                    dayKey === d.key ? 'bg-lime text-on-lime' : 'bg-tile text-mute'
                  }`}
                >
                  {d.label.split(' ')[0]}
                  <span className="num text-[18px] font-extrabold">{d.date.getDate()}</span>
                </button>
              ))}
            </div>
          </div>
          <div>
            <div className="mb-2 text-[13px] font-semibold text-mute">Créneau</div>
            <div className="grid grid-cols-3 gap-2">
              {SLOTS.map((s) => (
                <button
                  type="button"
                  key={s}
                  onClick={() => setSlot(s)}
                  className={`num h-11 rounded-full text-[14px] font-bold transition ${
                    slot === s ? 'bg-lime text-on-lime' : 'bg-tile text-fg'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-1 rounded-full bg-tile p-1">
            {(['presentiel', 'visio'] as const).map((m) => (
              <button
                type="button"
                key={m}
                onClick={() => setMode(m)}
                className={`h-10 rounded-full text-[13px] font-bold transition ${mode === m ? 'bg-rim text-fg' : 'text-mute'}`}
              >
                {m === 'presentiel' ? 'Présentiel' : 'Visio caméra'}
              </button>
            ))}
          </div>
          <Button fullWidth disabled={!dayKey || !slot} onClick={confirmBooking}>
            {dayKey && slot ? 'Confirmer la réservation' : 'Choisis un jour et un créneau'}
          </Button>
        </div>
      </BottomSheet>

      {/* Confirmation façon « Congratulation » */}
      <AnimatePresence>
        {confirmed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-30 flex items-center justify-center bg-black/80 p-5"
            onClick={() => setConfirmed(null)}
          >
            <motion.div
              initial={{ scale: 0.92, y: 24 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 26 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-[32px] bg-lime p-6 text-center text-on-lime"
            >
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-on-lime">
                <CheckDraw className="h-14 w-14" color="#C8FF00" />
              </div>
              <h2 className="mt-4 text-[26px] font-bold leading-8">Réservation confirmée</h2>
              <p className="mt-1 text-[14px] font-medium text-on-lime/70 first-letter:uppercase">{confirmed}</p>
              <p className="mt-1 text-[13px] text-on-lime/70">Un rappel te sera envoyé la veille.</p>
              <button
                type="button"
                onClick={() => setConfirmed(null)}
                className="mt-5 h-[52px] w-full rounded-full bg-on-lime text-[15px] font-bold text-fg transition active:scale-[0.97]"
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
