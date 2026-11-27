import { useState, useSyncExternalStore } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { useDekNav } from '../context/DekNav';
import { ACHIEVEMENTS, getEarnedAchievementIds } from '../utils/achievements';
import { CaretRight, Fire, HandsClapping, Lightning, PaintBrush } from './DekIcons';
import type { FeedPost, FeedReaction, UserAvatarConfig, UserProfile } from '../types/dek';
import { CARDIO_LABELS, TIER_COLORS } from '../utils/categorization';
import { FITNESS_GOALS, MUSCLE_LABELS } from '../utils/programsAndNutrition';
import { formatTimeAgo, getRankInfo } from '../utils/progression';
import { isSoundEnabled, setSoundEnabled, subscribeSound } from '../utils/soundFx';
import { AvatarStudio } from './AvatarStudio';
import { BottomSheet, Button, Card, ProgressBar, StatTiles } from './ui/kit';
import { ImagePicker } from './ui/ImagePicker';
import { Crown } from './DekIcons';
import { PREMIUM_PRICE_FCFA, cancelPremium, openPaywall, usePremium } from '../utils/premium';
import { ACCENTS, loadAccent, saveAccent } from '../utils/theme';
import { getHeroImage, setHeroImage, subscribeHeroImage } from '../utils/customImage';
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
  name: string;
  label: string;
}[] = [
  { key: 'feu', Icon: Fire, name: 'Feu', label: 'Réaction feu' },
  { key: 'force', Icon: Lightning, name: 'Force', label: 'Réaction force' },
  { key: 'respect', Icon: HandsClapping, name: 'Respect', label: 'Réaction respect' },
];

const POST_BADGES = ['DÉFI COMMUNAUTÉ', 'RECHERCHE PARTENAIRE', 'MOTIVATION 5H'];

/** « DÉFI COMMUNAUTÉ » → « Défi communauté » (affichage seulement). */
function soft(label: string): string {
  const low = label.toLowerCase();
  return low.charAt(0).toUpperCase() + low.slice(1);
}

/** Ligne de réglage / navigation (carte, libellé, valeur, chevron). */
function SettingRow({
  title,
  value,
  onClick,
}: {
  title: string;
  value?: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 rounded-[24px] bg-card px-4 py-3.5 text-left transition active:scale-[0.99]"
    >
      <div className="min-w-0 flex-1">
        <div className="text-[15px] font-bold leading-5 text-fg">{title}</div>
        {value && <div className="truncate text-[12px] font-medium text-mute">{value}</div>}
      </div>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tile text-fg">
        <CaretRight className="h-4 w-4" />
      </span>
    </button>
  );
}

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
  const customHero = useSyncExternalStore(subscribeHeroImage, getHeroImage, getHeroImage);
  const [accent, setAccent] = useState(loadAccent);
  const premium = usePremium();
  const earnedCount = getEarnedAchievementIds(user).length;

  const handlePublish = (e: React.FormEvent) => {
    e.preventDefault();
    const text = newPostText.trim();
    if (!text) return;
    onCreatePost(text, newPostBadge);
    setNewPostText('');
  };

  const rankInfo = getRankInfo(user.xp);

  return (
    <div className="space-y-5 pb-2">
      {/* Carte athlète */}
      <Card className="flex flex-col items-center text-center">
        <div className="relative">
          <UserAvatar avatar={user.avatar} size="xl" ring={false} className="!h-[88px] !w-[88px]" />
          <button
            onClick={() => setShowAvatarEditor(true)}
            aria-label="Personnaliser mon avatar"
            title="Personnaliser mon avatar"
            className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full bg-lime text-on-lime transition active:scale-90"
          >
            <PaintBrush className="h-4 w-4" />
          </button>
        </div>
        <h2 className="mt-3 text-[24px] font-bold leading-8 text-fg">{user.name}</h2>
        <p className="text-[13px] font-medium text-mute">
          {user.handle} · {user.city}
        </p>
        <span
          className="mt-2 rounded-full bg-tile px-3 py-1 text-[12px] font-semibold"
          style={{ color: TIER_COLORS[user.category] }}
        >
          {user.category}
        </span>

        <StatTiles
          className="mt-5 w-full"
          items={[
            { label: 'XP', value: user.xp.toLocaleString('fr-FR') },
            { label: 'Discipline', value: user.disciplineScore, unit: '%' },
            { label: 'Rang', value: rankInfo.rank },
          ]}
        />

        <div className="mt-5 w-full text-left">
          <div className="mb-2 flex items-center justify-between text-[13px] font-medium">
            <span className="text-mute">
              Saison 1 · <span className="text-fg">{rankInfo.rank}</span>
            </span>
            <span className="num text-lime">
              {rankInfo.nextRank ? `${user.xp} / ${rankInfo.nextRankXp} XP` : `${user.xp} XP · Rang max`}
            </span>
          </div>
          <ProgressBar value={rankInfo.pct} />
          {rankInfo.nextRank && (
            <div className="mt-2 text-[12px] font-medium text-mute">
              Encore <span className="num text-fg">{rankInfo.nextRankXp - user.xp}</span> XP pour passer{' '}
              {rankInfo.nextRank} · Série <span className="num text-fg">{user.streakDays}</span> j
            </div>
          )}
        </div>
      </Card>

      {/* Abonnement */}
      <Card className="space-y-3">
        <div className="flex items-center gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full ${premium.active ? 'bg-lime text-on-lime' : 'bg-tile text-mute'}`}>
            <Crown className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[16px] font-bold leading-[22px] text-fg">{premium.paid ? 'DEK Premium actif' : premium.trial ? 'Essai gratuit en cours' : 'Formule gratuite'}</div>
            <div className="text-[12px] font-medium text-mute">
              {premium.paid
                ? `${premium.days} jour${premium.days > 1 ? 's' : ''} restant${premium.days > 1 ? 's' : ''}${premium.state.demo ? ' · mode démo' : ''}`
                : premium.trial
                  ? `Tout est ouvert encore ${premium.trialDays} jour${premium.trialDays > 1 ? 's' : ''}, puis ${PREMIUM_PRICE_FCFA.toLocaleString('fr-FR')} FCFA / mois`
                  : `Tournois, pistes illimitées, toutes les séances : ${PREMIUM_PRICE_FCFA.toLocaleString('fr-FR')} FCFA / mois`}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <Button fullWidth onClick={() => openPaywall(null)}>
            {premium.paid ? 'Prolonger d’un mois' : 'Passer Premium'}
          </Button>
          {premium.paid && premium.state.demo && (
            <Button variant="secondary" onClick={cancelPremium}>
              Quitter
            </Button>
          )}
        </div>
      </Card>

      {/* Personnaliser l'essentiel */}
      <Card className="space-y-4">
        <div>
          <div className="text-[16px] font-bold leading-[22px] text-fg">Personnaliser</div>
          <div className="text-[12px] font-medium text-mute">Ta photo d’accueil, ta couleur, ton avatar et ton coach.</div>
        </div>
        <div>
          <div className="mb-2 text-[13px] font-semibold text-fg">Photo de l’accueil</div>
          <div className="flex items-center gap-3">
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[16px] bg-tile">
              {customHero ? <img src={customHero} alt="" className="h-full w-full object-cover" /> : <span className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-mute">Défaut</span>}
            </div>
            <div className="flex flex-1 flex-wrap gap-2">
              <ImagePicker onPick={setHeroImage} maxWidth={1100} className="h-9 rounded-full bg-lime px-4 text-[13px] font-bold text-on-lime transition active:scale-95">
                Choisir une photo
              </ImagePicker>
              {customHero && (
                <button type="button" onClick={() => setHeroImage(null)} className="h-9 rounded-full bg-tile px-4 text-[13px] font-semibold text-mute transition active:scale-95">
                  Remettre par défaut
                </button>
              )}
            </div>
          </div>
        </div>
        <div>
          <div className="mb-2 text-[13px] font-semibold text-fg">Couleur de l’app</div>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Couleur d’accentuation">
            {ACCENTS.map((a) => (
              <button
                key={a.id}
                type="button"
                role="radio"
                aria-checked={accent === a.id}
                aria-label={a.label}
                onClick={() => {
                  saveAccent(a.id);
                  setAccent(a.id);
                }}
                className={`h-9 w-9 rounded-full border-2 transition active:scale-90 ${accent === a.id ? 'border-fg' : 'border-transparent'}`}
                style={{ backgroundColor: a.color }}
              />
            ))}
          </div>
        </div>
      </Card>

      {/* Lignes de navigation */}
      <div className="space-y-2">
        <SettingRow
          title="Profil physique"
          value={
            user.body
              ? `${user.body.age} ans · ${user.body.weightKg} kg · ${user.body.heightCm} cm`
              : 'À compléter pour calibrer tes calories'
          }
          onClick={nav.editBodyProfile}
        />
        <SettingRow
          title={`Trophées · ${earnedCount}/${ACHIEVEMENTS.length}`}
          value="Écussons débloqués"
          onClick={nav.openTrophies}
        />
        <SettingRow title="Classement" value={rankInfo.rank} onClick={nav.openLeaderboard} />

        {/* Réglage son */}
        <div className="flex items-center gap-3 rounded-[24px] bg-card px-4 py-3.5">
          <div className="min-w-0 flex-1">
            <div className="text-[15px] font-bold leading-5 text-fg">Sons et vibrations</div>
            <div className="text-[12px] font-medium text-mute">{soundOn ? 'Activés' : 'Coupés'}</div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={soundOn}
            aria-label={soundOn ? 'Couper sons & vibrations' : 'Activer sons & vibrations'}
            onClick={() => setSoundEnabled(!soundOn)}
            className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${soundOn ? 'bg-lime' : 'bg-rim'}`}
          >
            <span
              className={`absolute top-0.5 h-6 w-6 rounded-full transition-all ${
                soundOn ? 'left-[22px] bg-on-lime' : 'left-0.5 bg-fg'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Badges débloqués */}
      {user.badges && user.badges.length > 0 && (
        <Card>
          <h3 className="text-[16px] font-bold leading-[22px] text-fg">
            Badges débloqués <span className="num text-mute">({user.badges.length})</span>
          </h3>
          <div className="mt-3 flex flex-wrap gap-2">
            {user.badges.map((badge) => (
              <span key={badge} className="rounded-full bg-tile px-3 py-1.5 text-[12px] font-semibold text-fg">
                {badge}
              </span>
            ))}
          </div>
        </Card>
      )}

      {/* Bilan d'initiation */}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-[16px] font-bold leading-[22px] text-fg">Bilan Test d’Initiation</h3>
          <span className="text-[13px] font-semibold" style={{ color: TIER_COLORS[user.category] }}>
            {user.category}
          </span>
        </div>

        {user.initiationResult && (
          <div className="mt-2 text-[13px] font-medium text-mute">
            {user.initiationResult.pushups} pompes · {user.initiationResult.squats} squats ·{' '}
            {user.initiationResult.plankSec}s gainage · {CARDIO_LABELS[user.initiationResult.cardioLevel]}
          </div>
        )}

        {(user.goals.length > 0 || user.targetMuscles.length > 0) && (
          <div className="mt-3 flex flex-wrap gap-2">
            {user.goals.map((gId) => (
              <span key={gId} className="rounded-full bg-tile px-3 py-1 text-[12px] font-semibold text-lime">
                {FITNESS_GOALS.find((fg) => fg.id === gId)?.label ?? gId}
              </span>
            ))}
            {user.targetMuscles.map((m) => (
              <span key={m} className="rounded-full bg-tile px-3 py-1 text-[12px] font-medium text-mute">
                {MUSCLE_LABELS[m]}
              </span>
            ))}
          </div>
        )}

        <div className="mt-4 grid grid-cols-2 gap-2">
          <Button variant="secondary" size="md" onClick={onRetakeInitiation}>
            Repasser le test
          </Button>
          <Button variant="secondary" size="md" onClick={() => setConfirmLogout(true)}>
            Compte
          </Button>
        </div>

        <AnimatePresence>
          {confirmLogout && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 rounded-[20px] bg-tile p-4">
                <div className="text-[15px] font-bold text-danger">Se déconnecter ?</div>
                <p className="mt-1 text-[13px] font-medium text-mute">
                  Ton XP, tes badges et ton fil seront effacés de ce téléphone.
                </p>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <Button variant="ghost" size="md" onClick={() => setConfirmLogout(false)}>
                    Annuler
                  </Button>
                  <Button variant="secondary" size="md" onClick={onLogout} className="!text-danger">
                    Oui, effacer
                  </Button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>

      {/* Composer */}
      <form onSubmit={handlePublish}>
        <Card className="space-y-3">
          <div className="flex items-center gap-3">
            <UserAvatar avatar={user.avatar} size="md" ring={false} />
            <input
              type="text"
              placeholder="Partage une actu ou lance un défi (ex: 5 km à 05h00 ?)..."
              value={newPostText}
              onChange={(e) => setNewPostText(e.target.value)}
              className="h-11 min-w-0 flex-1 rounded-2xl bg-tile px-4 text-[14px] font-medium text-fg outline-none placeholder:text-faint focus:ring-1 focus:ring-lime"
            />
          </div>
          <div className="no-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
            {POST_BADGES.map((b) => (
              <button
                key={b}
                type="button"
                onClick={() => setNewPostBadge(b)}
                className={`h-8 shrink-0 rounded-full px-3 text-[12px] font-semibold ${
                  newPostBadge === b ? 'bg-lime text-on-lime' : 'bg-tile text-mute'
                }`}
              >
                {soft(b)}
              </button>
            ))}
          </div>
          <Button type="submit" size="md" fullWidth>
            Publier
          </Button>
        </Card>
      </form>

      {/* Fil du réseau */}
      <div>
        <div className="mb-3 flex items-baseline justify-between">
          <h3 className="text-[18px] font-bold leading-6 text-fg">Fil du réseau DEK</h3>
          <span className="text-[12px] font-medium text-mute">Communauté en direct</span>
        </div>

        <div className="space-y-4">
          {feed.map((post) => {
            const postAvatar: UserAvatarConfig = post.avatarPreset
              ? {
                  mode: 'preset',
                  presetId: post.avatarPreset,
                  diceStyle: 'lorelei',
                  seed: post.author,
                  bgColor: '0f172a',
                  auraColor: '#C8FF00',
                }
              : user.avatar;

            return (
              <Card key={post.id} className="!p-4">
                {post.bannerImage && (
                  <div className="relative mb-3 h-40 w-full overflow-hidden rounded-[24px]">
                    <img src={post.bannerImage} alt={post.badge} className="h-full w-full object-cover" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
                    <span className="absolute left-3 top-3 rounded-full bg-black/40 px-3 py-1 text-[12px] font-semibold text-white">
                      {soft(post.badge)}
                    </span>
                  </div>
                )}

                <div className="flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-3">
                    <UserAvatar avatar={postAvatar} size="md" ring={false} />
                    <div className="min-w-0">
                      <div className="truncate text-[15px] font-bold leading-5 text-fg">{post.author}</div>
                      <div className="text-[12px] font-medium text-mute">
                        {post.createdAt ? formatTimeAgo(post.createdAt) : post.timeAgo}
                      </div>
                    </div>
                  </div>
                  {!post.bannerImage && (
                    <span className="shrink-0 rounded-full bg-tile px-3 py-1 text-[12px] font-semibold text-mute">
                      {soft(post.badge)}
                    </span>
                  )}
                </div>

                <p className="mt-3 text-[14px] font-medium leading-5 text-fg">{post.content}</p>

                {post.stats.length > 0 && (
                  <div className="mt-3 rounded-[20px] bg-tile py-3">
                    <StatTiles items={post.stats.map((st) => ({ label: st.label, value: st.value }))} />
                  </div>
                )}

                <div className="mt-3 flex flex-wrap items-center gap-2">
                  {REACTIONS.map(({ key, Icon, name, label }) => {
                    const mine = post.myReaction === key;
                    return (
                      <motion.button
                        key={key}
                        whileTap={{ scale: 0.94 }}
                        onClick={() => onReact(post.id, key)}
                        aria-pressed={mine}
                        aria-label={label}
                        className={`flex h-9 items-center gap-1.5 rounded-full px-3.5 text-[13px] font-semibold ${
                          mine ? 'bg-lime text-on-lime' : 'bg-tile text-mute'
                        }`}
                      >
                        <Icon className="h-4 w-4" />
                        {name} <span className="num">{post.reactions[key]}</span>
                      </motion.button>
                    );
                  })}
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      <p className="text-center text-[12px] font-medium text-faint">
        Missions, House et Santé alimentent ce fil.
      </p>

      <BottomSheet open={showAvatarEditor} onClose={() => setShowAvatarEditor(false)} title="Personnaliser mon avatar">
        <div className="space-y-4">
          <AvatarStudio value={user.avatar} onChange={onUpdateAvatar} />
          <Button fullWidth onClick={() => setShowAvatarEditor(false)}>
            Valider mon avatar
          </Button>
        </div>
      </BottomSheet>
    </div>
  );
}
