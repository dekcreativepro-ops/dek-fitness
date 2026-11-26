import { useState } from 'react';
import { motion } from 'framer-motion';
import { Dumbbell, Sword } from './DekIcons';
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
    <div className="space-y-3">
      {/* Switcher Arène : Défi House IA vs Gym Buddy */}
      <div className="grid grid-cols-2 gap-1 rounded-2xl border border-white/10 bg-[#11151D] p-1">
        {(
          [
            { id: 'house', label: 'Défi House IA', Icon: Sword },
            { id: 'gym', label: 'Gym Buddy (Salle)', Icon: Dumbbell },
          ] as const
        ).map(({ id, label, Icon }) => {
          const active = subTab === id;
          return (
            <button
              key={id}
              onClick={() => setSubTab(id)}
              className={`font-hud relative flex items-center justify-center gap-1.5 rounded-xl py-2 text-[11px] font-bold transition ${
                active ? 'text-black' : 'text-slate-300'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="arenaSubTabPill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-[#C8FF00]"
                />
              )}
              <Icon weight="duotone" className="relative z-10 h-4 w-4" />
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
