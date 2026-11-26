import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { CaretLeft, Star, X } from '../DekIcons';
import { SPRING_SNAPPY } from './motion';

// Kit UI DEK v2 : briques réutilisables (feuilles, anneaux, onglets, photos cinématiques…).
// Rappel : jamais de `position: fixed` — tout reste confiné dans le cadre du téléphone.

function getOverlayRoot(): HTMLElement | null {
  return typeof document !== 'undefined' ? document.getElementById('dek-overlay-root') : null;
}

/** Feuille du bas (portail #dek-overlay-root) avec glisser-pour-fermer. */
export function BottomSheet({
  open,
  onClose,
  title,
  children,
  accent = '#C8FF00',
  maxHeight = '86%',
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  accent?: string;
  maxHeight?: string;
}) {
  const sheet = (
    <AnimatePresence>
      {open && (
        <motion.div
          key="dek-sheet-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="pointer-events-auto absolute inset-0 flex flex-col justify-end bg-black/70 backdrop-blur-[2px]"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 36 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight, borderTopColor: `${accent}55` }}
            className="no-scrollbar flex flex-col overflow-hidden rounded-t-[30px] border-t bg-[#121722] shadow-2xl"
          >
            <div className="flex shrink-0 cursor-grab flex-col items-center px-4 pb-1 pt-2.5 active:cursor-grabbing">
              <div className="h-1.5 w-11 rounded-full bg-white/20" />
            </div>
            {title && (
              <div className="flex shrink-0 items-center justify-between px-4 pb-2">
                <div className="font-hud text-sm font-bold text-white">{title}</div>
                <button
                  onClick={onClose}
                  aria-label="Fermer"
                  className="rounded-xl bg-white/5 p-1.5 text-slate-400 transition hover:text-white"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-4 pb-6">{children}</div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
  const root = getOverlayRoot();
  return root ? createPortal(sheet, root) : sheet;
}

/** Titre de section + lien « Voir tout ». */
export function SectionHeader({
  title,
  action,
  onAction,
  icon,
}: {
  title: string;
  action?: string;
  onAction?: () => void;
  icon?: ReactNode;
}) {
  return (
    <div className="mb-2 flex items-center justify-between px-0.5">
      <h3 className="font-hud flex items-center gap-1.5 text-[13px] font-bold tracking-wide text-white">
        {icon}
        {title}
      </h3>
      {action && (
        <button onClick={onAction} className="text-[11px] font-semibold text-[#C8FF00] hover:underline">
          {action}
        </button>
      )}
    </div>
  );
}

/** Onglets pilule défilants avec indicateur animé partagé. */
export function ChipTabs<T extends string>({
  items,
  value,
  onChange,
  layoutId,
}: {
  items: { id: T; label: string }[];
  value: T;
  onChange: (id: T) => void;
  layoutId: string;
}) {
  return (
    <div className="no-scrollbar -mx-0.5 flex gap-1.5 overflow-x-auto px-0.5 pb-0.5" role="tablist">
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.id)}
            className={`font-hud relative shrink-0 rounded-full px-3.5 py-1.5 text-[11px] font-bold transition-colors ${
              active ? 'text-black' : 'border border-white/10 bg-[#11151D] text-slate-300'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={SPRING_SNAPPY}
                className="absolute inset-0 rounded-full bg-[#C8FF00]"
              />
            )}
            <span className="relative z-10">{it.label}</span>
          </button>
        );
      })}
    </div>
  );
}

/** Nombre qui défile jusqu'à sa valeur (compteurs XP, kcal…). */
export function CountUp({ value, duration = 0.8, className }: { value: number; duration?: number; className?: string }) {
  const reduce = useReducedMotion();
  const mv = useMotionValue(reduce ? value : 0);
  const rounded = useTransform(mv, (v) => Math.round(v).toLocaleString('fr-FR'));
  useEffect(() => {
    const controls = animate(mv, value, { duration: reduce ? 0 : duration, ease: 'easeOut' });
    return () => controls.stop();
  }, [value, duration, mv, reduce]);
  return <motion.span className={className}>{rounded}</motion.span>;
}

export interface RingSpec {
  pct: number;
  color: string;
}

/** Anneaux d'activité concentriques (style montre connectée). */
export function ActivityRings({ rings, size = 112, stroke = 10, children }: { rings: RingSpec[]; size?: number; stroke?: number; children?: ReactNode }) {
  const gap = 3;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        {rings.map((r, i) => {
          const radius = size / 2 - stroke / 2 - i * (stroke + gap);
          const c = 2 * Math.PI * radius;
          const pct = Math.max(0, Math.min(100, r.pct));
          return (
            <g key={i}>
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={r.color} strokeOpacity={0.14} strokeWidth={stroke} />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke={r.color}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={c}
                initial={{ strokeDashoffset: c }}
                animate={{ strokeDashoffset: c - (pct / 100) * c }}
                transition={{ duration: 1.1, delay: 0.15 + i * 0.12, ease: [0.22, 1, 0.36, 1] }}
                style={{ filter: pct >= 100 ? `drop-shadow(0 0 4px ${r.color})` : undefined }}
              />
            </g>
          );
        })}
      </svg>
      {children && <div className="absolute inset-0 flex items-center justify-center">{children}</div>}
    </div>
  );
}

/**
 * Photo « cinématique » : lent zoom Ken Burns, teinte duotone, grain et reflet.
 * Donne l'impression d'une vidéo de fond sans télécharger de vidéo lourde.
 */
export function CinematicImage({
  src,
  position = 'center',
  tint,
  className = '',
  layoutId,
  intensity = 1,
  children,
}: {
  src: string;
  position?: string;
  tint?: string;
  className?: string;
  layoutId?: string;
  intensity?: number;
  children?: ReactNode;
}) {
  const reduce = useReducedMotion();
  return (
    <motion.div layoutId={layoutId} className={`relative overflow-hidden bg-[#0B0E14] ${className}`}>
      <motion.img
        src={src}
        alt=""
        draggable={false}
        decoding="async"
        className="absolute inset-0 h-full w-full select-none object-cover"
        style={{ objectPosition: position }}
        initial={{ scale: 1.08 }}
        animate={reduce ? { scale: 1.04 } : { scale: [1.08, 1.08 + 0.1 * intensity, 1.08], x: ['0%', '-2.5%', '0%'] }}
        transition={reduce ? undefined : { duration: 18, repeat: Infinity, ease: 'easeInOut' }}
      />
      {tint && (
        <div
          className="absolute inset-0 mix-blend-color"
          style={{ background: `linear-gradient(160deg, ${tint}55 0%, transparent 55%, ${tint}22 100%)` }}
        />
      )}
      {/* Grain argentique */}
      <div className="dek-grain pointer-events-none absolute inset-0 opacity-[0.16] mix-blend-overlay" />
      {/* Reflet lumineux qui traverse */}
      {!reduce && (
        <motion.div
          className="pointer-events-none absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/10 to-transparent"
          initial={{ x: '-120%' }}
          animate={{ x: '420%' }}
          transition={{ duration: 2.6, repeat: Infinity, repeatDelay: 6, ease: 'easeInOut' }}
          style={{ skewX: -18 }}
        />
      )}
      {children}
    </motion.div>
  );
}

/** En-tête d'écran secondaire avec bouton retour. */
export function ScreenHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-2">
      <button
        onClick={onBack}
        aria-label="Retour"
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-[#11151D] text-white transition active:scale-90"
      >
        <CaretLeft weight="bold" className="h-4 w-4" />
      </button>
      <h2 className="font-hud flex-1 truncate text-center text-sm font-bold tracking-wide text-white">{title}</h2>
      <div className="flex h-9 min-w-9 items-center justify-end">{right}</div>
    </div>
  );
}

/** Étoiles de note (lecture seule). */
export function StarRow({ rating, className = 'h-3 w-3' }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          weight={i <= Math.round(rating) ? 'duotone' : 'regular'}
          className={`${className} ${i <= Math.round(rating) ? 'text-[#F5C542]' : 'text-slate-600'}`}
        />
      ))}
    </span>
  );
}

/** Minuteur circulaire (repos, exercices chronométrés). */
export function TimerRing({ total, remaining, size = 190, stroke = 12, color = '#C8FF00', children }: { total: number; remaining: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const radius = size / 2 - stroke / 2;
  const c = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="white" strokeOpacity={0.08} strokeWidth={stroke} />
        <motion.circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          animate={{ strokeDashoffset: c - pct * c }}
          transition={{ duration: 0.95, ease: 'linear' }}
          style={{ filter: `drop-shadow(0 0 8px ${color}88)` }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}
