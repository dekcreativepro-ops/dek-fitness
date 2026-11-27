import { useState } from 'react';
import { coachPortrait } from '../data/coachPortraits';
import { useDekNav } from '../context/DekNav';
import { INITIAL_COACHS } from '../data/mockData';
import { ChipTabs, ListRow } from './ui/kit';
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
      : INITIAL_COACHS.filter((c) => c.tags.some((t) => t.toLowerCase().includes(filter.toLowerCase())));

  const filteredCoachs = [...baseCoachs].sort((a, b) => {
    if (a.id === recommendedCoachId) return -1;
    if (b.id === recommendedCoachId) return 1;
    return 0;
  });

  return (
    <div className="space-y-4 pb-2">
      <div>
        <h1 className="text-[26px] font-bold leading-8 text-fg">Coachs</h1>
        <p className="text-[14px] font-medium text-mute">Encadrement certifié et séances en groupe</p>
      </div>

      <ChipTabs
        items={FILTERS.map((f) => ({ id: f, label: f }))}
        value={filter}
        onChange={setFilter}
        layoutId="coachFilterPill"
      />

      <div className="space-y-3">
        {filteredCoachs.map((coach) => {
          const isBooked = bookedIds.includes(coach.id);
          const isRecommended = coach.id === recommendedCoachId;
          return (
            <div key={coach.id} className="space-y-1.5">
              {isRecommended && <div className="px-1 text-[12px] font-semibold text-lime">Conseillé pour ton objectif</div>}
              <ListRow
                onClick={() => nav.openCoach(coach.id)}
                leading={
                  coachPortrait(coach.id) ? (
                    <img src={coachPortrait(coach.id)} alt="" className="h-12 w-12 rounded-full object-cover" />
                  ) : coach.avatarPreset ? (
                    <UserAvatar
                      avatar={{ mode: 'preset', presetId: coach.avatarPreset, diceStyle: 'lorelei', seed: coach.name, bgColor: '0E0F12', auraColor: coach.accent }}
                      size="md"
                      ring={false}
                      className="!h-12 !w-12"
                    />
                  ) : (
                    <span className="flex h-12 w-12 items-center justify-center bg-tile text-[15px] font-bold text-lime">
                      {coach.avatarInitials}
                    </span>
                  )
                }
                title={coach.name}
                subtitle={coach.specialty}
                meta={`${coach.experienceYears ?? 5} ans d’expérience · ${coach.rating}`}
              />
              <div className="flex items-center justify-between gap-3 px-2">
                <span className="truncate text-[12px] font-medium text-mute">{coach.nextSession}</span>
                <button
                  type="button"
                  onClick={() => handleBook(coach.id, coach.name)}
                  className={`h-8 shrink-0 rounded-full px-4 text-[12px] font-bold transition active:scale-95 ${
                    isBooked ? 'bg-tile text-lime' : 'bg-lime text-on-lime'
                  }`}
                >
                  {isBooked ? 'Réservé' : 'Rejoindre la séance'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
