import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  CalendarCheck,
  CheckCircle,
  Medal,
  Star,
  Users,
  VideoCamera,
} from './DekIcons';
import { useDekNav } from '../context/DekNav';
import { INITIAL_COACHS } from '../data/mockData';
import { UserAvatar } from './UserAvatar';

interface CoachsViewProps {
  recommendedCoachId?: string;
  onBookSession: (coachName: string) => void;
}

const FILTERS = ['Tous', 'Football', 'Défi House', 'Running'] as const;
type CoachFilter = (typeof FILTERS)[number];

export function CoachsView({ recommendedCoachId, onBookSession }: CoachsViewProps) {
  const [bookedIds, setBookedIds] = useState<string[]>([]);
  const [filter, setFilter] = useState<CoachFilter>('Tous');
  const nav = useDekNav();

  const handleBook = (id: string, name: string) => {
    if (bookedIds.includes(id)) return;
    setBookedIds((prev) => [...prev, id]);
    onBookSession(name);
  };

  const baseCoachs =
    filter === 'Tous'
      ? INITIAL_COACHS
      : INITIAL_COACHS.filter((c) =>
          c.tags.some((t) => t.toLowerCase().includes(filter.toLowerCase())),
        );

  const filteredCoachs = [...baseCoachs].sort((a, b) => {
    if (a.id === recommendedCoachId) return -1;
    if (b.id === recommendedCoachId) return 1;
    return 0;
  });

  return (
    <div className="space-y-3 pb-2">
      {/* Bannière Tête d'affiche Coachs */}
      <div className="overflow-hidden rounded-3xl border border-white/15 bg-[#11151D]">
        <div className="relative h-28 w-full">
          <img
            src="/images/banner-coach.jpg"
            alt="Coachs Certifiés DEK"
            className="h-full w-full object-cover opacity-80"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#11151D] via-[#080A0E]/55 to-transparent" />

          <div className="absolute inset-x-0 bottom-0 p-3.5">
            <span className="inline-flex items-center gap-1 rounded-full bg-[#00E5FF]/20 px-2 py-0.5 text-[10px] font-bold text-[#00E5FF] backdrop-blur">
              <Medal weight="duotone" className="h-3.5 w-3.5" /> COACHS & RÉUNIONS
            </span>
            <h2 className="font-hud mt-0.5 text-lg font-bold text-white">
              ENCADREMENT & RAIDS ORGANISÉS
            </h2>
          </div>
        </div>

        <div className="p-3 pt-1">
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto pb-0.5">
            {FILTERS.map((f) => {
              const active = filter === f;
              return (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={`font-hud relative shrink-0 rounded-xl px-3 py-1.5 text-[11px] font-bold transition ${
                    active ? 'text-black' : 'border border-white/10 bg-[#181E29] text-slate-300'
                  }`}
                >
                  {active && (
                    <motion.div
                      layoutId="coachFilterPill"
                      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                      className="absolute inset-0 rounded-xl bg-[#C8FF00]"
                    />
                  )}
                  <span className="relative z-10">{f}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Liste des Coachs */}
      <div className="space-y-2.5">
        {filteredCoachs.map((coach) => {
          const isBooked = bookedIds.includes(coach.id);
          const isRecommended = coach.id === recommendedCoachId;
          return (
            <div
              key={coach.id}
              className={`rounded-2xl border p-3.5 ${
                isRecommended
                  ? 'border-[#C8FF00]/45 bg-[#131922]'
                  : 'border-white/10 bg-[#11151D]'
              }`}
            >
              {isRecommended && (
                <div className="mb-2 inline-flex items-center gap-1 rounded-full bg-[#C8FF00]/15 px-2.5 py-0.5 text-[10px] font-bold text-[#C8FF00]">
                  Conseillé pour ton objectif
                </div>
              )}
              <div className="flex items-start gap-3">
                <button onClick={() => nav.openCoach(coach.id)} aria-label={`Profil de ${coach.name}`} className="shrink-0">
                  {coach.avatarPreset ? (
                    <UserAvatar
                      avatar={{ mode: 'preset', presetId: coach.avatarPreset, diceStyle: 'lorelei', seed: coach.name, bgColor: '0f172a', auraColor: coach.accent }}
                      size="md"
                    />
                  ) : (
                    <span
                      className="font-hud flex h-11 w-11 items-center justify-center rounded-2xl text-sm font-bold text-black"
                      style={{ backgroundColor: coach.accent }}
                    >
                      {coach.avatarInitials}
                    </span>
                  )}
                </button>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1">
                      <h3 className="font-hud truncate text-sm font-bold text-white">
                        {coach.name}
                      </h3>
                      {coach.verified && (
                        <CheckCircle
                          weight="duotone"
                          className="h-4 w-4 shrink-0 text-[#00E5FF]"
                        />
                      )}
                    </div>
                    <span className="flex shrink-0 items-center gap-1 rounded-lg bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-400">
                      <Star weight="duotone" className="h-3.5 w-3.5" /> {coach.rating}
                    </span>
                  </div>

                  <p className="mt-0.5 text-[11px] font-medium text-slate-300">{coach.specialty}</p>
                  <div className="mt-1 flex flex-wrap items-center gap-2.5 text-[10px] text-slate-400">
                    <span className="flex items-center gap-1">
                      <Users weight="duotone" className="h-3.5 w-3.5 text-[#C8FF00]" />{' '}
                      {coach.studentsCount} élèves
                    </span>
                    <span className="flex items-center gap-1">
                      <VideoCamera weight="duotone" className="h-3.5 w-3.5 text-[#00E5FF]" />{' '}
                      {coach.city}
                    </span>
                  </div>
                </div>
              </div>

              <div className="mt-2.5 flex items-center gap-2 rounded-xl border border-white/5 bg-[#0B0E14] px-2.5 py-2 text-[11px] text-slate-200">
                <CalendarCheck weight="duotone" className="h-4 w-4 shrink-0 text-[#C8FF00]" />
                <span className="truncate">{coach.nextSession}</span>
              </div>

              <div className="mt-2.5 flex items-center justify-between gap-2">
                <button
                  onClick={() => nav.openCoach(coach.id)}
                  className="font-hud rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-[11px] font-bold text-white"
                >
                  Voir le profil • {coach.priceMonth}
                </button>
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={() => handleBook(coach.id, coach.name)}
                  className={`font-hud rounded-xl px-3.5 py-2 text-[11px] font-bold transition ${
                    isBooked
                      ? 'border border-[#C8FF00]/40 bg-[#C8FF00]/15 text-[#C8FF00]'
                      : 'bg-[#C8FF00] text-black'
                  }`}
                >
                  {isBooked ? 'RÉSERVÉ ✓' : 'REJOINDRE LA SÉANCE'}
                </motion.button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
