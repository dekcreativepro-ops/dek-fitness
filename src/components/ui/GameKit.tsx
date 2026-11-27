import { useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CaretRight, Lightning, SlidersHorizontal } from '../DekIcons';
import { LEVEL_COLORS, type GameLevel, type GamePrefs } from '../../utils/gameFx';
import { Card, StatTiles } from './kit';

/** Halo vert autour de l'écran (portail sur #dek-overlay-root). */
export function AlertGlow({ glowKey, glowOn }: { glowKey: number; glowOn: boolean }) {
  const root = typeof document !== 'undefined' ? document.getElementById('dek-overlay-root') : null;
  if (!glowOn || !root) return null;
  return createPortal(<div key={glowKey} className="dek-glow" />, root);
}

/** Légende d'un jeu : nom, petite description, difficulté et chiffres clés. */
export function GameLegend({
  title,
  description,
  level,
  stats,
  extra,
}: {
  title: string;
  description: string;
  level: GameLevel;
  stats: { label: string; value: string | number; unit?: string }[];
  extra?: ReactNode;
}) {
  return (
    <Card className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[12px] font-semibold text-mute">Légende</div>
          <div className="truncate text-[17px] font-bold leading-6 text-fg">{title}</div>
        </div>
        <span className="flex h-7 shrink-0 items-center rounded-full bg-tile px-3 text-[12px] font-bold" style={{ color: LEVEL_COLORS[level] }}>
          {level}
        </span>
      </div>
      <p className="text-[13px] font-medium leading-5 text-mute">{description}</p>
      <StatTiles items={stats} />
      {extra}
    </Card>
  );
}

/** Pastille de bonus en cours : défi, XP potentiel et chrono. */
export function BonusPill({ label, hint, xp, secondsLeft }: { label: string; hint: string; xp: number; secondsLeft: number }) {
  return (
    <div className="flex items-center gap-2 rounded-full bg-lime px-3 py-1.5 text-on-lime shadow-lg">
      <Lightning className="h-4 w-4 shrink-0" />
      <div className="min-w-0 leading-4">
        <div className="truncate text-[12px] font-extrabold">
          {label} · +{xp + secondsLeft} XP
        </div>
        <div className="truncate text-[11px] font-semibold opacity-80">{hint}</div>
      </div>
      <span className="num ml-auto rounded-full bg-black/80 px-2 text-[12px] font-bold leading-5 text-lime">{secondsLeft}s</span>
    </div>
  );
}

/** Médaille animée du meilleur score (bronze, argent, or selon l'objectif) ou « NO RECORD ». */
export function BestMedal({ score, goal, unit, runs }: { score: number | null; goal: number; unit: string; runs?: number }) {
  if (score === null) {
    return (
      <div className="flex items-center gap-3 rounded-[18px] border border-dashed border-faint bg-tile/60 px-4 py-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-full border border-dashed border-faint text-[10px] font-bold text-faint">?</span>
        <div>
          <div className="text-[13px] font-bold text-mute">NO RECORD</div>
          <div className="text-[12px] font-medium text-faint">Jamais joué ici : pose le premier score.</div>
        </div>
      </div>
    );
  }
  const ratio = score / Math.max(1, goal);
  const c = ratio >= 1 ? { rim: '#B8860B', face: '#F5C542' } : ratio >= 0.6 ? { rim: '#7C8594', face: '#D5DAE3' } : { rim: '#8A4F1D', face: '#D58A4A' };
  return (
    <div className="flex items-center gap-3 rounded-[18px] bg-tile px-4 py-3">
      <div className="dek-medal">
        <svg viewBox="0 0 48 60" width="34" height="42" aria-hidden="true">
          <path d="M14 0 L24 22 L34 0 Z" fill="#C8FF00" />
          <path d="M14 0 L20 0 L28 20 L24 22Z" fill="#8DB800" />
          <circle cx="24" cy="36" r="17" fill={c.rim} />
          <circle cx="24" cy="36" r="14" fill={c.face} />
          <path d="M24 26 l3 6.4 7 .8-5.2 4.8 1.4 6.9-6.2-3.5-6.2 3.5 1.4-6.9-5.2-4.8 7-.8z" fill={c.rim} opacity=".85" />
          <ellipse cx="18.5" cy="29.5" rx="4" ry="2.4" fill="#fff" opacity=".45" transform="rotate(-35 18.5 29.5)" />
        </svg>
      </div>
      <div>
        <div className="text-[13px] font-bold text-fg">
          Record · {score} {unit}
        </div>
        <div className="text-[12px] font-medium text-mute">
          {runs ?? 1} partie{(runs ?? 1) > 1 ? 's' : ''} sur ce défi
        </div>
      </div>
    </div>
  );
}

/** Réglages dépliables d'un jeu : vibration & lueur, bonus chrono. */
const ALL_TOGGLES: { key: keyof GamePrefs; label: string; hint: string }[] = [
  { key: 'bonus', label: 'Bonus chrono', hint: '30 s pour relever le défi, le temps restant ajoute de l’XP' },
  { key: 'alerts', label: 'Vibration & lueur verte', hint: 'Quand un bonus ou la victoire approche' },
  { key: 'hardcore', label: 'Mode à fond', hint: 'Chrono de 20 s au lieu de 30 s, XP +25 %' },
  { key: 'rhythm', label: 'Rythme & rapidité', hint: 'Bonus XP si tu enchaînes vite et régulier' },
  { key: 'streak', label: 'Série de victoires', hint: '+10 % d’XP par victoire d’affilée (jusqu’à +50 %)' },
  { key: 'adaptive', label: 'Défi adaptatif', hint: 'Les bonus montent avec ton record pour te pousser' },
  { key: 'coach', label: 'Coach motivation', hint: 'Consignes et alertes à mi-parcours et dans le dur' },
];

export function GameOptionsCard({
  prefs,
  onChange,
  show = ['bonus', 'alerts'],
}: {
  prefs: GamePrefs;
  onChange: (patch: Partial<GamePrefs>) => void;
  show?: (keyof GamePrefs)[];
}) {
  const [open, setOpen] = useState(false);
  const toggles = ALL_TOGGLES.filter((t) => show.includes(t.key));
  return (
    <Card>
      <button type="button" onClick={() => setOpen((o) => !o)} aria-expanded={open} className="flex w-full items-center justify-between gap-3 text-left">
        <div className="flex items-center gap-3">
          <SlidersHorizontal className="h-5 w-5 text-lime" />
          <div>
            <div className="text-[15px] font-bold text-fg">Réglages du jeu</div>
            <div className="text-[12px] font-medium text-mute">
              {toggles.filter((t) => prefs[t.key]).length}/{toggles.length} réglages actifs
            </div>
          </div>
        </div>
        <CaretRight className={`h-5 w-5 shrink-0 text-mute transition-transform duration-200 ${open ? 'rotate-90' : ''}`} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.22, ease: 'easeOut' }} className="overflow-hidden">
            <div className="flex flex-col gap-1.5 pt-4">
              {toggles.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  role="switch"
                  aria-checked={prefs[t.key]}
                  onClick={() => onChange({ [t.key]: !prefs[t.key] })}
                  className="flex items-center justify-between gap-3 rounded-[18px] bg-tile px-4 py-2.5 text-left transition active:scale-[0.98]"
                >
                  <span>
                    <span className="block text-[14px] font-semibold text-fg">{t.label}</span>
                    <span className="block text-[12px] font-medium text-mute">{t.hint}</span>
                  </span>
                  <span className={`flex h-6 w-11 shrink-0 items-center rounded-full p-0.5 transition-colors ${prefs[t.key] ? 'bg-lime' : 'bg-rim'}`}>
                    <span className={`h-5 w-5 rounded-full bg-ink transition-transform ${prefs[t.key] ? 'translate-x-5' : 'translate-x-0'}`} />
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </Card>
  );
}
