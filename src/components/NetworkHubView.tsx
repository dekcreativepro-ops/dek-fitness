import { useState } from 'react';
import { motion } from 'framer-motion';
import type { FeedPost, FeedReaction, TabId, UserAvatarConfig, UserProfile } from '../types/dek';
import { getAdventurePlan } from '../utils/programsAndNutrition';
import { CoachsView } from './CoachsView';
import { ProfilFeedView } from './ProfilFeedView';
import { RaidsPactsView } from './RaidsPactsView';
import { SanteView } from './SanteView';
import { UserAvatar } from './UserAvatar';

export type NetworkSubTab = 'sante' | 'raids' | 'coachs' | 'profil';

interface NetworkHubViewProps {
  user: UserProfile;
  feed: FeedPost[];
  initialSubTab?: NetworkSubTab;
  onJoinSante: (matchTitle: string) => void;
  onCompleteThursday: (summaryText: string, mvpName: string) => boolean;
  onRaidCheckin: (raidTitle: string, badgeName: string) => void;
  onPactAction: (kind: 'checkin' | 'nudge' | 'create', label: string) => boolean;
  onBookSession: (coachName: string) => void;
  onRetakeInitiation: () => void;
  onUpdateAvatar: (avatar: UserAvatarConfig) => void;
  onCreatePost: (content: string, badge: string) => void;
  onReact: (postId: string, key: FeedReaction) => void;
  onNavigateTab: (tab: TabId) => void;
  onLogout: () => void;
}

const SUB_TABS: { id: NetworkSubTab; label: string }[] = [
  { id: 'sante', label: 'Jeudi & Santé' },
  { id: 'raids', label: 'Raids & Pactes' },
  { id: 'coachs', label: 'Coachs' },
  { id: 'profil', label: 'Profil' },
];

const ACTIVE_STORIES: {
  id: string;
  label: string;
  tag: string;
  target: NetworkSubTab | TabId;
  avatar: UserAvatarConfig;
}[] = [
  {
    id: 'st1',
    label: 'Koffi • 05:00',
    tag: 'LIVE',
    target: 'missions',
    avatar: {
      mode: 'preset',
      presetId: 'manga-sprint',
      diceStyle: 'lorelei',
      seed: 'Koffi',
      bgColor: '0f172a',
      auraColor: '#C8FF00',
    },
  },
  {
    id: 'st2',
    label: 'Akira • Duel',
    tag: 'KO',
    target: 'house',
    avatar: {
      mode: 'preset',
      presetId: 'manga-fighter',
      diceStyle: 'lorelei',
      seed: 'Akira',
      bgColor: '0f172a',
      auraColor: '#FF2E54',
    },
  },
  {
    id: 'st3',
    label: 'Jeudi 19h',
    tag: 'TERRAIN',
    target: 'sante',
    avatar: {
      mode: 'preset',
      presetId: 'fantasy-paladin',
      diceStyle: 'adventurer',
      seed: 'Warriors',
      bgColor: '0f172a',
      auraColor: '#00E5FF',
    },
  },
  {
    id: 'st4',
    label: 'Raid Dim.',
    tag: 'RAID',
    target: 'raids',
    avatar: {
      mode: 'preset',
      presetId: 'fantasy-shadow',
      diceStyle: 'adventurer',
      seed: 'Raid',
      bgColor: '0f172a',
      auraColor: '#F59E0B',
    },
  },
  {
    id: 'st5',
    label: 'Ibrahim',
    tag: 'COACH',
    target: 'coachs',
    avatar: {
      mode: 'preset',
      presetId: 'manga-sprint',
      diceStyle: 'adventurer',
      seed: 'Ibrahim',
      bgColor: '0f172a',
      auraColor: '#A855F7',
    },
  },
];

export function NetworkHubView({
  user,
  feed,
  initialSubTab = 'sante',
  onJoinSante,
  onCompleteThursday,
  onRaidCheckin,
  onPactAction,
  onBookSession,
  onRetakeInitiation,
  onUpdateAvatar,
  onCreatePost,
  onReact,
  onNavigateTab,
  onLogout,
}: NetworkHubViewProps) {
  // App remonte ce composant (clé) quand on demande un sous-onglet précis.
  const [subTab, setSubTab] = useState<NetworkSubTab>(initialSubTab);

  const adventure = getAdventurePlan(user.goals, user.category);

  const handleStoryTap = (target: NetworkSubTab | TabId) => {
    if (target === 'missions' || target === 'house') {
      onNavigateTab(target);
    } else if (
      target === 'sante' ||
      target === 'raids' ||
      target === 'coachs' ||
      target === 'profil'
    ) {
      setSubTab(target);
    }
  };

  return (
    <div className="space-y-3 pb-2">
      {/* Rangée Stories / Athlètes Actifs en direct */}
      <div className="rounded-2xl border border-white/10 bg-[#11151D] p-2.5">
        <div className="no-scrollbar flex items-center gap-3 overflow-x-auto px-1">
          {ACTIVE_STORIES.map((st) => (
            <motion.button
              key={st.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => handleStoryTap(st.target)}
              className="flex shrink-0 flex-col items-center gap-1"
            >
              <div className="relative">
                <UserAvatar avatar={st.avatar} size="md" />
                <span
                  className="font-hud absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full px-1.5 py-px text-[8px] font-black text-black"
                  style={{ backgroundColor: st.avatar.auraColor }}
                >
                  {st.tag}
                </span>
              </div>
              <span className="mt-0.5 max-w-[68px] truncate text-[10px] font-medium text-slate-300">
                {st.label}
              </span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Switch pilule 4 sous-onglets */}
      <div className="grid grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-[#11151D] p-1">
        {SUB_TABS.map((t) => {
          const active = subTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setSubTab(t.id)}
              className={`font-hud relative rounded-xl px-1 py-2 text-[10px] font-bold transition ${
                active ? 'text-black' : 'text-slate-300'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="networkHubSubTab"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-[#C8FF00]"
                />
              )}
              <span className="relative z-10 block truncate">{t.label}</span>
            </button>
          );
        })}
      </div>

      {subTab === 'sante' && (
        <SanteView
          onJoinSante={onJoinSante}
          onCompleteThursday={onCompleteThursday}
        />
      )}
      {subTab === 'raids' && (
        <RaidsPactsView
          onRaidCheckin={onRaidCheckin}
          onPactAction={onPactAction}
        />
      )}
      {subTab === 'coachs' && (
        <CoachsView
          recommendedCoachId={adventure.recommendedCoachId}
          onBookSession={onBookSession}
        />
      )}
      {subTab === 'profil' && (
        <ProfilFeedView
          user={user}
          feed={feed}
          onRetakeInitiation={onRetakeInitiation}
          onUpdateAvatar={onUpdateAvatar}
          onCreatePost={onCreatePost}
          onReact={onReact}
          onLogout={onLogout}
        />
      )}
    </div>
  );
}
