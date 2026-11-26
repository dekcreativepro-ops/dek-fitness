import { useState } from 'react';
import { motion } from 'framer-motion';
import type { FeedPost, FeedReaction, TabId, UserAvatarConfig, UserProfile } from '../types/dek';
import { getAdventurePlan } from '../utils/programsAndNutrition';
import { CoachsView } from './CoachsView';
import { ProfilFeedView } from './ProfilFeedView';
import { RaidsPactsView } from './RaidsPactsView';
import { SanteView } from './SanteView';
import { UserAvatar } from './UserAvatar';
import { ChipTabs } from './ui/kit';

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
    <div className="space-y-5 pb-2">
      {/* En-tête de page */}
      <header>
        <h1 className="text-[26px] font-bold leading-8 text-fg">Réseau</h1>
        <p className="text-[14px] font-medium leading-5 text-mute">
          Ta communauté, tes rendez-vous et tes coachs.
        </p>
      </header>

      {/* Stories : avatars ronds, anneau lime si live */}
      <div className="no-scrollbar -mx-5 flex items-start gap-4 overflow-x-auto px-5">
        {ACTIVE_STORIES.map((st) => {
          const live = st.tag === 'LIVE';
          return (
            <motion.button
              key={st.id}
              whileTap={{ scale: 0.94 }}
              onClick={() => handleStoryTap(st.target)}
              title={st.label}
              aria-label={st.label}
              className="flex w-14 shrink-0 flex-col items-center gap-1.5"
            >
              <span className={`flex h-[62px] w-[62px] items-center justify-center rounded-full border-2 ${live ? 'border-lime' : 'border-rim'}`}>
                <UserAvatar avatar={st.avatar} size="lg" ring={false} />
              </span>
              <span className="w-full truncate text-center text-[12px] font-medium leading-4 text-mute">
                {st.label.split(' • ')[0]}
              </span>
            </motion.button>
          );
        })}
      </div>

      {/* Segmented en pilules défilantes */}
      <ChipTabs items={SUB_TABS} value={subTab} onChange={setSubTab} layoutId="networkHubSubTab" />

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
