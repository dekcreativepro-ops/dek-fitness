import { useState, useSyncExternalStore } from 'react';
import { useDekNav } from '../context/DekNav';
import { ACHIEVEMENTS, getEarnedAchievementIds } from '../utils/achievements';
import { RankEmblem } from './ui/RankEmblem';
import { TrophyShine } from './ui/AnimatedIcons';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowsClockwise,
  Fire,
  HandsClapping,
  Lightning,
  PaintBrush,
  PaperPlaneRight,
  ShieldCheck,
  SignOut,
  Sparkle,
  SpeakerHigh,
  SpeakerSlash,
  Trophy,
  X,
} from './DekIcons';
import type { FeedPost, FeedReaction, UserAvatarConfig, UserProfile } from '../types/dek';
import { CARDIO_LABELS, TIER_COLORS } from '../utils/categorization';
import { FITNESS_GOALS, MUSCLE_LABELS } from '../utils/programsAndNutrition';
import { formatTimeAgo, getRankInfo } from '../utils/progression';
import { isSoundEnabled, setSoundEnabled, subscribeSound } from '../utils/soundFx';
import { AvatarStudio } from './AvatarStudio';
import { UserAvatar } from './UserAvatar';

interface ProfilFeedViewProps {
  user: UserProfile;
  feed: FeedPost[];
  onRetakeInitiation: () => void;
  onUpdateAvatar: (avatar: UserAvatarConfig) => void;
  onCreatePost: (content: string, badge: string) => void;
  onReact: (postId: string, key: FeedReaction) => void;
  onLogout: () => void;
}

const REACTIONS: {
  key: FeedReaction;
  Icon: typeof Fire;
  color: string;
  label: string;
}[] = [
  { key: 'feu', Icon: Fire, color: 'text-orange-400', label: 'Réaction feu' },
  { key: 'force', Icon: Lightning, color: 'text-[#C8FF00]', label: 'Réaction force' },
  { key: 'respect', Icon: HandsClapping, color: 'text-[#00E5FF]', label: 'Réaction respect' },
];

export function ProfilFeedView({
  user,
  feed,
  onRetakeInitiation,
  onUpdateAvatar,
  onCreatePost,
  onReact,
  onLogout,
}: ProfilFeedViewProps) {
  const [showAvatarEditor, setShowAvatarEditor] = useState(false);
  const [confirmLogout, setConfirmLogout] = useState(false);
  const [newPostText, setNewPostText] = useState('');
  const [newPostBadge, setNewPostBadge] = useState('DÉFI COMMUNAUTÉ');
  const soundOn = useSyncExternalStore(subscribeSound, isSoundEnabled);
  const nav = useDekNav();
  const earnedCount = getEarnedAchievementIds(user).length;

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newPostText.trim();
    if (!text) return;
    onCreatePost(text, newPostBadge);
    setNewPostText('');
  };

  const rankInfo = getRankInfo(user.xp);
  const radius = 24;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (user.disciplineScore / 100) * circumference;

  const overlayRoot =
    typeof document !== 'undefined' ? document.getElementById('dek-overlay-root') : null;

  const avatarSheet = (
    <AnimatePresence>
      {showAvatarEditor && (
        <motion.div
          key="avatar-editor-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => setShowAvatarEditor(false)}
          className="pointer-events-auto absolute inset-0 flex flex-col justify-end bg-black/75 backdrop-blur-xs"
        >
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 360, damping: 32 }}
            onClick={(e) => e.stopPropagation()}
            className="max-h-[82%] space-y-3 overflow-y-auto rounded-t-3xl border-t border-[#C8FF00]/35 bg-[#121722] p-4 pb-6 shadow-2xl no-scrollbar"
          >
            <div className="mx-auto h-1 w-10 rounded-full bg-white/20" />
            <div className="flex items-center justify-between">
              <h3 className="font-hud text-sm font-bold text-white">
                PERSONNALISER MON AVATAR
              </h3>
              <button
                onClick={() => setShowAvatarEditor(false)}
                className="rounded-xl bg-white/5 p-1.5 text-slate-400"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <AvatarStudio value={user.avatar} onChange={onUpdateAvatar} />
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowAvatarEditor(false)}
              className="font-hud w-full rounded-full bg-[#C8FF00] py-3 text-xs font-bold text-black"
            >
              VALIDER MON AVATAR
            </motion.button>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="space-y-3 pb-2">
      {/* Carte Athlète DEK */}
      <div className="rounded-3xl border border-[#C8FF00]/30 bg-gradient-to-br from-[#171D28] via-[#11151D] to-[#0B0E14] p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAvatarEditor(true)}
              className="group relative"
              title="Personnaliser mon avatar"
            >
              <UserAvatar avatar={user.avatar} size="lg" />
              <span className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#C8FF00] text-black shadow">
                <PaintBrush weight="bold" className="h-3 w-3" />
              </span>
            </button>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-1.5">
                <h2 className="font-hud text-base font-bold text-white">{user.name}</h2>
                <span
                  className="rounded-md px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    backgroundColor: `${TIER_COLORS[user.category]}22`,
                    color: TIER_COLORS[user.category],
                  }}
                >
                  {user.category}
                </span>
              </div>
              <p className="truncate text-[11px] text-slate-400">
                {user.handle} • {user.city}
              </p>
              <button
                onClick={() => setShowAvatarEditor(true)}
                className="mt-1 inline-flex items-center gap-1 text-[10px] font-semibold text-[#C8FF00]"
              >
                <PaintBrush weight="duotone" className="h-3 w-3" /> Personnaliser mon avatar
              </button>
            </div>
          </div>

          <div className="relative flex h-15 w-15 shrink-0 items-center justify-center">
            <svg className="h-15 w-15 -rotate-90" viewBox="0 0 60 60">
              <circle
                cx="30"
                cy="30"
                r={radius}
                fill="none"
                stroke="rgba(255,255,255,0.1)"
                strokeWidth="5"
              />
              <motion.circle
                cx="30"
                cy="30"
                r={radius}
                fill="none"
                stroke="#34D399"
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset: dashOffset }}
                transition={{ duration: 0.85, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute flex flex-col items-center leading-none">
              <span className="font-hud text-xs font-bold text-white">
                {user.disciplineScore}%
              </span>
              <span className="text-[8px] font-semibold uppercase text-emerald-400">Disc.</span>
            </div>
          </div>
        </div>

        {/* Barre XP */}
        <div className="mt-3">
          <div className="flex justify-between text-[10px] font-semibold">
            <span className="text-slate-300">
              SAISON 1 • <span className="font-hud text-white">{rankInfo.rank.toUpperCase()}</span>
            </span>
            <span className="font-hud text-[#C8FF00]">
              {rankInfo.nextRank
                ? `${user.xp} / ${rankInfo.nextRankXp} XP`
                : `${user.xp} XP • RANG MAX`}
            </span>
          </div>
          <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-black/60">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${rankInfo.pct}%` }}
              transition={{ duration: 0.7, ease: 'easeOut' }}
              className="h-full rounded-full bg-gradient-to-r from-[#00E5FF] to-[#C8FF00]"
            />
          </div>
          {rankInfo.nextRank && (
            <div className="mt-1 text-[9px] text-slate-400">
              Encore {rankInfo.nextRankXp - user.xp} XP pour passer{' '}
              <strong className="text-slate-200">{rankInfo.nextRank}</strong> • Série{' '}
              <strong className="text-[#00E5FF]">{user.streakDays} j</strong>
            </div>
          )}
        </div>

        {/* Profil physique */}
        <button
          onClick={nav.editBodyProfile}
          className="mt-3 flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#0B0E14]/90 px-3 py-2 text-left"
        >
          <span className="text-[11px] text-slate-300">
            <span className="font-hud font-bold text-white">Profil physique</span>
            {' • '}
            {user.body
              ? `${user.body.age} ans • ${user.body.weightKg} kg • ${user.body.heightCm} cm`
              : 'À compléter pour calibrer tes calories'}
          </span>
          <span className="text-[10px] font-bold text-[#C8FF00]">Modifier</span>
        </button>

        {/* Raccourcis Trophées & Classement */}
        <div className="mt-3 grid grid-cols-2 gap-2">
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={nav.openTrophies}
            className="flex items-center gap-2 rounded-2xl border border-[#F5C542]/30 bg-[#F5C542]/10 px-3 py-2.5 text-left"
          >
            <TrophyShine className="h-6 w-6" />
            <span>
              <span className="font-hud block text-[11px] font-bold text-white">Trophées</span>
              <span className="block text-[10px] text-[#F5C542]">
                {earnedCount}/{ACHIEVEMENTS.length} débloqués
              </span>
            </span>
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={nav.openLeaderboard}
            className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-left"
          >
            <RankEmblem rank={rankInfo.rank} size={26} animated={false} />
            <span>
              <span className="font-hud block text-[11px] font-bold text-white">Classement</span>
              <span className="block text-[10px] text-slate-400">{rankInfo.rank}</span>
            </span>
          </motion.button>
        </div>

        {/* Badges débloqués (Territoires, Raids, Jeudi) */}
        {user.badges && user.badges.length > 0 && (
          <div className="mt-3 rounded-2xl border border-[#C8FF00]/25 bg-[#0B0E14]/90 p-2.5">
            <div className="font-hud mb-1.5 flex items-center gap-1 text-[10px] font-bold uppercase text-[#C8FF00]">
              <Trophy weight="duotone" className="h-3.5 w-3.5" /> Badges Débloqués (
              {user.badges.length})
            </div>
            <div className="flex flex-wrap gap-1.5">
              {user.badges.map((badge) => (
                <span
                  key={badge}
                  className="font-hud inline-flex items-center gap-1 rounded-full border border-[#C8FF00]/35 bg-[#C8FF00]/12 px-2.5 py-0.5 text-[10px] font-bold text-[#C8FF00]"
                >
                  <Sparkle weight="duotone" className="h-3 w-3" /> {badge}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bilan Test d'Initiation + Boutons */}
        <div className="mt-3 rounded-2xl border border-white/10 bg-[#0B0E14]/90 p-3">
          <div className="flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 font-bold text-emerald-400">
              <ShieldCheck weight="duotone" className="h-4 w-4" /> Bilan Test d’Initiation
            </span>
            <span className="font-hud font-bold" style={{ color: TIER_COLORS[user.category] }}>
              {user.category}
            </span>
          </div>

          {user.initiationResult && (
            <div className="mt-1 text-[11px] text-slate-300">
              {user.initiationResult.pushups} pompes • {user.initiationResult.squats} squats •{' '}
              {user.initiationResult.plankSec}s gainage •{' '}
              <span className="text-slate-400">
                {CARDIO_LABELS[user.initiationResult.cardioLevel]}
              </span>
            </div>
          )}

          {(user.goals.length > 0 || user.targetMuscles.length > 0) && (
            <div className="mt-2 flex flex-wrap gap-1">
              {user.goals.map((gId) => (
                <span
                  key={gId}
                  className="rounded-md bg-[#C8FF00]/12 px-1.5 py-0.5 text-[9px] font-semibold text-[#C8FF00]"
                >
                  {FITNESS_GOALS.find((fg) => fg.id === gId)?.label ?? gId}
                </span>
              ))}
              {user.targetMuscles.map((m) => (
                <span
                  key={m}
                  className="rounded-md bg-white/8 px-1.5 py-0.5 text-[9px] font-medium text-slate-300"
                >
                  {MUSCLE_LABELS[m]}
                </span>
              ))}
            </div>
          )}

          <div className="mt-2.5 flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={onRetakeInitiation}
              className="font-hud flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-[#C8FF00]/35 bg-[#C8FF00]/10 py-2 text-[11px] font-bold text-[#C8FF00]"
            >
              <ArrowsClockwise weight="duotone" className="h-3.5 w-3.5" /> Repasser Test
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setSoundEnabled(!soundOn)}
              aria-pressed={soundOn}
              title={soundOn ? 'Couper sons & vibrations' : 'Activer sons & vibrations'}
              className={`flex items-center justify-center rounded-xl border px-2.5 py-2 ${
                soundOn
                  ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                  : 'border-white/10 bg-white/5 text-slate-400'
              }`}
            >
              {soundOn ? (
                <SpeakerHigh weight="duotone" className="h-3.5 w-3.5" />
              ) : (
                <SpeakerSlash weight="duotone" className="h-3.5 w-3.5" />
              )}
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={() => setConfirmLogout(true)}
              className="font-hud flex items-center justify-center gap-1.5 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-[11px] font-bold text-slate-300 hover:text-[#FF2E54]"
            >
              <SignOut weight="duotone" className="h-3.5 w-3.5" /> Compte
            </motion.button>
          </div>

          <AnimatePresence>
            {confirmLogout && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="overflow-hidden"
              >
                <div className="mt-2.5 rounded-xl border border-[#FF2E54]/40 bg-[#FF2E54]/10 p-2.5 text-[11px] text-slate-200">
                  <strong className="text-[#FF2E54]">Se déconnecter ?</strong> Ton XP, tes badges et
                  ton fil seront effacés de ce téléphone.
                  <div className="mt-2 flex gap-2">
                    <button
                      onClick={() => setConfirmLogout(false)}
                      className="font-hud flex-1 rounded-lg border border-white/15 bg-white/5 py-1.5 text-[11px] font-bold text-slate-200"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={onLogout}
                      className="font-hud flex-1 rounded-lg bg-[#FF2E54] py-1.5 text-[11px] font-bold text-white"
                    >
                      Oui, effacer
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Barre rapide « Partager une actu / Lancer un défi » */}
      <form
        onSubmit={handlePublish}
        className="rounded-2xl border border-white/10 bg-[#11151D] p-3 space-y-2"
      >
        <div className="flex items-center gap-2">
          <UserAvatar avatar={user.avatar} size="xs" />
          <input
            type="text"
            placeholder="Partage une actu ou lance un défi (ex: 5 km à 05h00 ?)..."
            value={newPostText}
            onChange={(e) => setNewPostText(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-[#080A0E] px-3 py-2 text-xs text-white outline-none focus:border-[#C8FF00]"
          />
        </div>

        <div className="flex items-center justify-between gap-2">
          <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
            {['DÉFI COMMUNAUTÉ', 'RECHERCHE PARTENAIRE', 'MOTIVATION 5AM'].map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setNewPostBadge(b)}
                className={`shrink-0 rounded-lg px-2 py-1 text-[9px] font-bold ${
                  newPostBadge === b
                    ? 'bg-[#00E5FF]/20 text-[#00E5FF]'
                    : 'bg-white/5 text-slate-400'
                }`}
              >
                {b}
              </button>
            ))}
          </div>

          <motion.button
            whileTap={{ scale: 0.94 }}
            type="submit"
            className="font-hud flex shrink-0 items-center gap-1 rounded-xl bg-[#C8FF00] px-3 py-1.5 text-[11px] font-bold text-black"
          >
            <PaperPlaneRight weight="duotone" className="h-3.5 w-3.5" /> Publier
          </motion.button>
        </div>
      </form>

      {/* Feed Réseau Social DEK illustré */}
      <div>
        <div className="mb-2 flex items-center justify-between px-0.5">
          <h3 className="font-hud flex items-center gap-1.5 text-xs font-bold text-white">
            <Sparkle weight="duotone" className="h-4 w-4 text-[#C8FF00]" /> FIL DU RÉSEAU DEK
          </h3>
          <span className="text-[10px] text-slate-400">Communauté en direct</span>
        </div>

        <div className="space-y-2.5">
          {feed.map((post) => {
            const postAvatar: UserAvatarConfig = post.avatarPreset
              ? {
                  mode: 'preset',
                  presetId: post.avatarPreset,
                  diceStyle: 'lorelei',
                  seed: post.author,
                  bgColor: '0f172a',
                  auraColor: '#00E5FF',
                }
              : user.avatar;

            return (
              <div
                key={post.id}
                className="overflow-hidden rounded-2xl border border-white/10 bg-[#11151D]"
              >
                {post.bannerImage && (
                  <div className="relative h-24 w-full">
                    <img
                      src={post.bannerImage}
                      alt={post.badge}
                      className="h-full w-full object-cover opacity-80"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-[#11151D] via-transparent to-black/30" />
                    <span className="font-hud absolute right-2.5 top-2.5 rounded-lg bg-black/75 px-2 py-0.5 text-[9px] font-bold text-[#C8FF00] backdrop-blur">
                      {post.badge}
                    </span>
                  </div>
                )}

                <div className="p-3.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar avatar={postAvatar} size="sm" />
                      <div>
                        <div className="text-xs font-bold text-white">{post.author}</div>
                        <div className="text-[10px] text-slate-400">
                          {post.createdAt ? formatTimeAgo(post.createdAt) : post.timeAgo}
                        </div>
                      </div>
                    </div>
                    {!post.bannerImage && (
                      <span className="font-hud rounded-lg bg-white/5 px-2 py-0.5 text-[9px] font-bold text-[#00E5FF]">
                        {post.badge}
                      </span>
                    )}
                  </div>

                  <p className="mt-2.5 text-xs leading-relaxed text-slate-200">{post.content}</p>

                  {post.stats.length > 0 && (
                    <div className="mt-2.5 grid grid-cols-3 gap-1.5 rounded-xl border border-white/5 bg-[#0B0E14] p-2">
                      {post.stats.map((st) => (
                        <div key={st.label} className="text-center">
                          <div className="text-[9px] text-slate-400">{st.label}</div>
                          <div className="font-hud text-xs font-bold text-white">{st.value}</div>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="mt-2.5 flex items-center gap-2">
                    {REACTIONS.map(({ key, Icon, color, label }) => {
                      const mine = post.myReaction === key;
                      return (
                        <motion.button
                          key={key}
                          whileTap={{ scale: 1.25 }}
                          onClick={() => onReact(post.id, key)}
                          aria-pressed={mine}
                          aria-label={label}
                          className={`flex items-center gap-1 rounded-lg border px-2.5 py-1 text-[11px] ${
                            mine
                              ? 'border-[#C8FF00]/50 bg-[#C8FF00]/12 text-white'
                              : 'border-white/10 bg-white/5 text-slate-200'
                          }`}
                        >
                          <Icon weight="duotone" className={`h-4 w-4 ${color}`} />{' '}
                          {post.reactions[key]}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/5 bg-[#11151D] px-3 py-2.5 text-[11px] text-slate-400">
        <span className="flex items-center gap-1.5">
          <Trophy weight="duotone" className="h-4 w-4 shrink-0 text-[#C8FF00]" /> Missions, House
          et Santé alimentent ce fil.
        </span>
      </div>

      {overlayRoot ? createPortal(avatarSheet, overlayRoot) : avatarSheet}
    </div>
  );
}
