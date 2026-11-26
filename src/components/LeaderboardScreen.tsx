import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, TrendDown, TrendUp } from './DekIcons';
import type { AvatarPresetId, UserProfile } from '../types/dek';
import { currentWeekDays, getRankInfo, SEASON_RANKS } from '../utils/progression';
import { useDekNav } from '../context/DekNav';
import { TrophyShine } from './ui/AnimatedIcons';
import { ChipTabs, CountUp, ScreenHeader } from './ui/kit';
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
    <div className="no-scrollbar h-full overflow-y-auto bg-[#080A0E] px-3.5 pb-8 pt-3">
      <ScreenHeader
        title="CLASSEMENT"
        onBack={onBack}
        right={
          <button onClick={nav.openTrophies} aria-label="Voir mes trophées" className="rounded-xl p-1 active:scale-90">
            <TrophyShine className="h-6 w-6" />
          </button>
        }
      />

      <div className="space-y-2">
        <ChipTabs
          items={[
            { id: 'week', label: 'Cette semaine' },
            { id: 'season', label: 'Saison 1' },
          ]}
          value={period}
          onChange={setPeriod}
          layoutId="ladderPeriodPill"
        />
        <div className="grid grid-cols-2 gap-1 rounded-2xl bg-[#11151D] p-1">
          {(['world', 'city'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setScope(s)}
              className={`font-hud rounded-xl py-1.5 text-[11px] font-bold transition ${
                scope === s ? 'bg-white/15 text-white' : 'text-slate-400'
              }`}
            >
              {s === 'world' ? 'Monde DEK' : user.city}
            </button>
          ))}
        </div>
      </div>

      {/* Podium */}
      <div className="relative mt-5 flex items-end justify-center gap-2.5">
        {podiumOrder.map((a, col) => {
          const place = ranking.indexOf(a) + 1;
          const rank = getRankInfo(a.seasonXp).rank;
          const color = place === 1 ? '#F5C542' : place === 2 ? '#CBD5E1' : '#D97745';
          return (
            <motion.div
              key={`${period}-${scope}-${a.id}`}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 * col, type: 'spring', stiffness: 260, damping: 24 }}
              className="flex w-[30%] flex-col items-center"
            >
              {place === 1 && (
                <motion.div animate={{ y: [0, -4, 0], rotate: [-4, 4, -4] }} transition={{ duration: 2.4, repeat: Infinity }}>
                  <Crown weight="duotone" className="mb-1 h-6 w-6 text-[#F5C542]" />
                </motion.div>
              )}
              <div className="relative">
                <UserAvatar
                  avatar={{ mode: 'preset', presetId: a.preset, diceStyle: 'lorelei', seed: a.name, bgColor: '0f172a', auraColor: a.isMe ? '#C8FF00' : color }}
                  size={place === 1 ? 'lg' : 'md'}
                />
                <span
                  className="font-hud absolute -bottom-2 left-1/2 flex h-5 w-5 -translate-x-1/2 items-center justify-center rounded-full text-[10px] font-black text-black"
                  style={{ backgroundColor: color }}
                >
                  {place}
                </span>
              </div>
              <div className={`mt-3 max-w-full truncate text-[11px] font-bold ${a.isMe ? 'text-[#C8FF00]' : 'text-white'}`}>
                {a.isMe ? 'Toi' : a.name}
              </div>
              <RankEmblem rank={rank} size={22} animated={place === 1} />
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: heights[col] }}
                transition={{ duration: 0.7, delay: 0.2 + col * 0.1, ease: [0.22, 1, 0.36, 1] }}
                className="mt-1 flex w-full flex-col items-center justify-start rounded-t-2xl pt-2"
                style={{ background: `linear-gradient(180deg, ${color}55, ${color}0d)`, borderTop: `2px solid ${color}` }}
              >
                <span className="font-hud text-sm font-bold text-white">
                  <CountUp value={scoreOf(a)} />
                </span>
                <span className="text-[9px] text-slate-300">XP</span>
              </motion.div>
            </motion.div>
          );
        })}
      </div>

      {/* Échelle */}
      <div className="mt-1 space-y-1.5 rounded-t-[26px] border border-b-0 border-white/10 bg-[#11151D] p-2.5">
        {rest.map((a, i) => {
          const place = i + 4;
          const rank = getRankInfo(a.seasonXp).rank;
          return (
            <motion.div
              key={`${period}-${scope}-${a.id}`}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 + i * 0.03 }}
              className={`flex items-center gap-2.5 rounded-2xl px-2.5 py-2 ${
                a.isMe ? 'border border-[#C8FF00]/50 bg-[#C8FF00]/10' : 'bg-[#0B0E14]'
              }`}
            >
              <span className="font-hud w-5 text-center text-xs font-bold text-slate-400">{place}</span>
              <UserAvatar
                avatar={{ mode: 'preset', presetId: a.preset, diceStyle: 'lorelei', seed: a.name, bgColor: '0f172a', auraColor: RANK_STYLES[rank]?.color ?? '#94A3B8' }}
                size="xs"
              />
              <div className="min-w-0 flex-1">
                <div className={`truncate text-xs font-bold ${a.isMe ? 'text-[#C8FF00]' : 'text-white'}`}>
                  {a.isMe ? `${a.name} (toi)` : a.name}
                </div>
                <div className="text-[10px] text-slate-500">{a.city}</div>
              </div>
              <RankEmblem rank={rank} size={20} animated={false} />
              <span
                className={`flex w-7 items-center justify-end text-[10px] font-bold ${
                  a.trend > 0 ? 'text-emerald-400' : a.trend < 0 ? 'text-[#FF2E54]' : 'text-slate-500'
                }`}
              >
                {a.trend > 0 ? <TrendUp className="h-3 w-3" /> : a.trend < 0 ? <TrendDown className="h-3 w-3" /> : '–'}
                {a.trend !== 0 && Math.abs(a.trend)}
              </span>
              <span className="font-hud w-14 text-right text-xs font-bold text-white">{scoreOf(a).toLocaleString('fr-FR')}</span>
            </motion.div>
          );
        })}
      </div>

      {/* Ma carte de rang */}
      <div className="rounded-b-[26px] border border-t-0 border-white/10 bg-gradient-to-br from-[#171D28] to-[#0B0E14] p-3.5">
        <div className="flex items-center gap-3">
          <RankEmblem rank={myRank.rank} size={52} />
          <div className="min-w-0 flex-1">
            <div className="font-hud text-sm font-bold text-white">
              #{myIndex + 1} • {myRank.rank}
            </div>
            <div className="text-[10px] text-slate-400">
              {myRank.nextRank ? `${myRank.nextRankXp - user.xp} XP avant ${myRank.nextRank}` : 'Rang maximum atteint 👑'}
            </div>
            <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-black/60">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-[#00E5FF] to-[#C8FF00]"
                initial={{ width: 0 }}
                animate={{ width: `${myRank.pct}%` }}
                transition={{ duration: 0.9 }}
              />
            </div>
          </div>
        </div>
        <div className="no-scrollbar mt-3 flex justify-between gap-1 overflow-x-auto">
          {SEASON_RANKS.map((r) => (
            <div key={r.name} className={`flex shrink-0 flex-col items-center ${user.xp >= r.minXp ? '' : 'opacity-35 grayscale'}`}>
              <RankEmblem rank={r.name} size={30} animated={false} />
              <span className="font-hud mt-0.5 text-[8px] font-bold text-slate-300">{r.name}</span>
              <span className="text-[8px] text-slate-500">{r.minXp.toLocaleString('fr-FR')}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
