import { useState } from 'react';
import { motion } from 'framer-motion';
import type { MissionDifficulty, UserAvatarConfig } from '../types/dek';
import { DefiHouseView } from './DefiHouseView';
import { GymBuddyView } from './GymBuddyView';

interface ArenaHubViewProps {
  initialSubTab?: 'house' | 'gym';
  userCategory: MissionDifficulty;
  userAvatar: UserAvatarConfig;
  userName: string;
  onWinDuel: (
    xpEarned: number,
    exercise: string,
    reps: number,
    modeLabel?: string,
  ) => void;
  onDuoComplete: (routineTitle: string, totalSets: number) => boolean;
  onSpotJoin?: (author: string, gymName: string) => void;
}

export function ArenaHubView({
  initialSubTab = 'house',
  userCategory,
  userAvatar,
  userName,
  onWinDuel,
  onDuoComplete,
  onSpotJoin,
}: ArenaHubViewProps) {
  // App remonte ce composant (clé) quand on demande un sous-onglet précis depuis l'accueil.
  const [subTab, setSubTab] = useState<'house' | 'gym'>(initialSubTab);

  return (
    <div className="space-y-5 pb-2">
      <header>
        <h1 className="text-[26px] font-bold leading-8 text-fg">Arène</h1>
        <p className="text-[13px] font-medium leading-[18px] text-mute">Défis caméra IA et salle</p>
      </header>

      {/* Segmented : Défi House IA vs Gym Buddy */}
      <div role="tablist" className="grid grid-cols-2 gap-1 rounded-full bg-card p-1">
        {(
          [
            { id: 'house', label: 'Défi House IA' },
            { id: 'gym', label: 'Gym Buddy' },
          ] as const
        ).map(({ id, label }) => {
          const active = subTab === id;
          return (
            <button
              key={id}
              role="tab"
              aria-selected={active}
              onClick={() => setSubTab(id)}
              className={`relative h-10 rounded-full text-[14px] font-semibold transition-colors ${
                active ? 'text-on-lime' : 'text-mute'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="arenaSubTabPill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-full bg-lime"
                />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          );
        })}
      </div>

      {subTab === 'house' ? (
        <DefiHouseView
          userCategory={userCategory}
          userAvatar={userAvatar}
          onWinDuel={onWinDuel}
        />
      ) : (
        <GymBuddyView
          userCategory={userCategory}
          userName={userName}
          onDuoComplete={onDuoComplete}
          onSpotJoin={onSpotJoin}
        />
      )}
    </div>
  );
}
