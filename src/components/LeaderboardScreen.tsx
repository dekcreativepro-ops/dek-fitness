import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { TrendDown, TrendUp, Trophy } from './DekIcons';
import type { AvatarPresetId, UserProfile } from '../types/dek';
import { currentWeekDays, getRankInfo, SEASON_RANKS } from '../utils/progression';
import { useDekNav } from '../context/DekNav';
import { Card, ChipTabs, CountUp, IconButton, ProgressBar, ScreenHeader } from './ui/kit';
import { RankEmblem } from './ui/RankEmblem';
import { RANK_STYLES } from './ui/rankStyles';
import { UserAvatar } from './UserAvatar';

// Classement « Ladder » : podium animé + échelle des athlètes, semaine ou saison.

interface Athlete {
  id: string;
  name: string;
  city: string;
  preset: AvatarPresetId;
  seasonXp: number;
  weekXp: number;
  trend: number;
  isMe?: boolean;
}

const ATHLETES: Athlete[] = [
  { id: 'a1', name: 'Koffi_Sprint', city: 'Abidjan', preset: 'manga-sprint', seasonXp: 7420, weekXp: 1340, trend: 0 },
  { id: 'a2', name: 'Sarah_5AM', city: 'Paris', preset: 'manga-fighter', seasonXp: 6150, weekXp: 1180, trend: 2 },
  { id: 'a3', name: 'Moussa_Iron', city: 'Dakar', preset: 'fantasy-paladin', seasonXp: 5480, weekXp: 990, trend: -1 },
  { id: 'a4', name: 'Titan_Exp', city: 'Abidjan', preset: 'fantasy-shadow', seasonXp: 4210, weekXp: 860, trend: 1 },
  { id: 'a5', name: 'Awa_Speed', city: 'Abidjan', preset: 'manga-fighter', seasonXp: 3380, weekXp: 720, trend: 3 },
  { id: 'a6', name: 'Lucas_Pace', city: 'Lyon', preset: 'fantasy-shadow', seasonXp: 2890, weekXp: 610, trend: -2 },
  { id: 'a7', name: 'Ibrahim_Cap', city: 'Abidjan', preset: 'fantasy-paladin', seasonXp: 2240, weekXp: 540, trend: 0 },
  { id: 'a8', name: 'Yann_Pace', city: 'Paris', preset: 'manga-sprint', seasonXp: 1710, weekXp: 430, trend: 1 },
  { id: 'a9', name: 'Cédric_K', city: 'Dakar', preset: 'fantasy-shadow', seasonXp: 1180, weekXp: 310, trend: -1 },
  { id: 'a10', name: 'Oumar_W', city: 'Abidjan', preset: 'manga-sprint', seasonXp: 760, weekXp: 220, trend: 2 },
  { id: 'a11', name: 'Franck_R', city: 'Lyon', preset: 'fantasy-paladin', seasonXp: 420, weekXp: 140, trend: 0 },
];

type Period = 'week' | 'season';
type Scope = 'city' | 'world';

export function LeaderboardScreen({ user, onBack }: { user: UserProfile; onBack: () => void }) {
  const nav = useDekNav();
  const [period, setPeriod] = useState<Period>('week');
  const [scope, setScope] = useState<Scope>('world');

  const myWeekXp = currentWeekDays().reduce((acc, d) => acc + (user.xpLog[d.key] ?? 0), 0);

  const ranking = useMemo(() => {
    const me: Athlete = {
      id: 'me',
      name: user.name,
      city: user.city,
      preset: user.avatar.mode === 'preset' ? user.avatar.presetId : 'manga-sprint',
      seasonXp: user.xp,
      weekXp: myWeekXp,
      trend: 1,
      isMe: true,
    };
    const pool: Athlete[] = [...ATHLETES, me].filter((a) => scope === 'world' || a.isMe || a.city === user.city);
    const key = period === 'week' ? 'weekXp' : 'seasonXp';
    return pool.sort((a, b) => b[key] - a[key]);
  }, [period, scope, user, myWeekXp]);

  const scoreOf = (a: Athlete) => (period === 'week' ? a.weekXp : a.seasonXp);
  const myIndex = ranking.findIndex((a) => a.isMe);
  const podium = ranking.slice(0, 3);
  const rest = ranking.slice(3);
  // Ordre visuel du podium : 2e, 1er, 3e
  const podiumOrder = [podium[1], podium[0], podium[2]].filter(Boolean);
  const heights = [92, 124, 74];
  const myRank = getRankInfo(user.xp);

  return (
    <div className="no-scrollbar h-full overflow-y-auto bg-ink px-5 pb-8 pt-4">
      <ScreenHeader
        title="Classement"
        onBack={onBack}
        right={
          <IconButton label="Voir mes trophées" onClick={nav.openTrophies}>
            <Trophy className="h-5 w-5" />
          </IconButton>
        }
      />

      <div className="space-y-3">
        <ChipTabs
          items={[
            { id: 'week', label: 'Cette semaine' },
            { id: 'season', label: 'Saison 1' },
          ]}
          value={period}
          onChange={setPeriod}
          layoutId="ladderPeriodPill"
        />
        <ChipTabs
          items={[
            { id: 'world', label: 'Monde DEK' },
            { id: 'city', label: user.city },
          ]}
          value={scope}
          onChange={setScope}
          layoutId="ladderScopePill"
        />
      </div>

      {/* Podium */}
      <div className="mt-6 flex items-end justify-center gap-2">
        {podiumOrder.map((a, col) => {
          const place = ranking.indexOf(a) + 1;
          const first = place === 1;
          return (
            <motion.div
              key={`${period}-${scope}-${a.id}`}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 * col, duration: 0.3, ease: 'easeOut' }}
              className="flex w-[31%] flex-col items-center"
            >
              <UserAvatar
                avatar={{ mode: 'preset', presetId: a.preset, diceStyle: 'lorelei', seed: a.name, bgColor: '0f172a', auraColor: '#C8FF00' }}
                size={first ? 'xl' : 'lg'}
                ring={false}
              />
              <div className={`mt-2 max-w-full truncate text-[13px] font-bold ${a.isMe ? 'text-lime' : 'text-fg'}`}>
                {a.isMe ? 'Toi' : a.name}
              </div>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: heights[col] }}
                transition={{ duration: 0.5, delay: 0.15 + col * 0.08, ease: 'easeOut' }}
                className={`mt-2 flex w-full flex-col items-center justify-start overflow-hidden rounded-t-[20px] pt-3 ${
                  first ? 'bg-lime/15' : 'bg-card'
                }`}
              >
                <span className={`num text-[28px] font-extrabold leading-none ${first ? 'text-lime' : 'text-fg'}`}>{place}</span>
                <span className="num mt-1 text-[13px] font-bold text-fg">
                  <CountUp value={scoreOf(a)} />
                </span>
                <span className="text-[11px] font-medium text-mute">XP</span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Échelle */}
      <div className="mt-4 space-y-2">
        {rest.map((a, i) => {
          const place = i + 4;
          const rank = getRankInfo(a.seasonXp).rank;
          return (
            <motion.div
              key={`${period}-${scope}-${a.id}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.03, duration: 0.25 }}
              className={`flex items-center gap-3 rounded-[24px] p-3 ${a.isMe ? 'bg-lime/15' : 'bg-card'}`}
            >
              <span className="num w-6 text-center text-[16px] font-extrabold text-mute">{place}</span>
              <UserAvatar
                avatar={{ mode: 'preset', presetId: a.preset, diceStyle: 'lorelei', seed: a.name, bgColor: '0f172a', auraColor: RANK_STYLES[rank]?.color ?? '#94A3B8' }}
                size="md"
                ring={false}
              />
              <div className="min-w-0 flex-1">
                <div className={`truncate text-[15px] font-bold leading-5 ${a.isMe ? 'text-lime' : 'text-fg'}`}>
                  {a.isMe ? `${a.name} (toi)` : a.name}
                </div>
                <div className="truncate text-[12px] font-medium text-mute">{a.city} · {rank}</div>
              </div>
              <span
                className={`flex w-8 items-center justify-end gap-0.5 text-[12px] font-bold ${
                  a.trend > 0 ? 'text-lime' : a.trend < 0 ? 'text-danger' : 'text-faint'
                }`}
              >
                {a.trend > 0 ? <TrendUp className="h-3.5 w-3.5" /> : a.trend < 0 ? <TrendDown className="h-3.5 w-3.5" /> : '–'}
                {a.trend !== 0 && Math.abs(a.trend)}
              </span>
              <span className="num w-14 text-right text-[15px] font-extrabold text-fg">{scoreOf(a).toLocaleString('fr-FR')}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Ma carte de rang */}
      <Card className="mt-4">
        <div className="flex items-center gap-4">
          <RankEmblem rank={myRank.rank} size={52} animated={false} />
          <div className="min-w-0 flex-1">
            <div className="text-[18px] font-bold leading-6 text-fg">
              <span className="num">#{myIndex + 1}</span> · {myRank.rank}
            </div>
            <div className="text-[13px] font-medium text-mute">
              {myRank.nextRank ? `${myRank.nextRankXp - user.xp} XP avant ${myRank.nextRank}` : 'Rang maximum atteint'}
            </div>
          </div>
        </div>
        <ProgressBar value={myRank.pct} knob className="mt-4" />
        <div className="no-scrollbar mt-4 flex justify-between gap-2 overflow-x-auto">
          {SEASON_RANKS.map((r) => (
            <div key={r.name} className={`flex shrink-0 flex-col items-center ${user.xp >= r.minXp ? '' : 'opacity-35 grayscale'}`}>
              <RankEmblem rank={r.name} size={30} animated={false} />
              <span className="mt-1 text-[11px] font-semibold text-fg">{r.name}</span>
              <span className="num text-[11px] text-mute">{r.minXp.toLocaleString('fr-FR')}</span>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
