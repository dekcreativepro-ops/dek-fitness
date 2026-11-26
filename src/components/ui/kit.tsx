import { useEffect, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { animate, AnimatePresence, motion, useMotionValue, useReducedMotion, useTransform } from 'framer-motion';
import { ArrowLeft, ArrowRight, CaretRight, Star, X } from '../DekIcons';
import { SPRING_SNAPPY } from './motion';

// Kit UI DEK v3 « Studio » : briques réutilisables (voir docs/DESIGN.md §5).
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
  maxHeight = '86%',
}: {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  children: ReactNode;
  /** Conservé pour compatibilité (ignoré dans le style Studio). */
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
          transition={{ duration: 0.2, ease: 'easeOut' }}
          onClick={onClose}
          className="pointer-events-auto absolute inset-0 flex flex-col justify-end bg-black/70"
        >
          <motion.div
            role="dialog"
            aria-modal="true"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', stiffness: 380, damping: 38 }}
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.6 }}
            onDragEnd={(_, info) => {
              if (info.offset.y > 110 || info.velocity.y > 600) onClose();
            }}
            onClick={(e) => e.stopPropagation()}
            style={{ maxHeight }}
            className="no-scrollbar flex flex-col overflow-hidden rounded-t-[32px] bg-card shadow-2xl"
          >
            <div className="flex shrink-0 cursor-grab flex-col items-center px-5 pb-2 pt-3 active:cursor-grabbing">
              <div className="h-[5px] w-10 rounded-full bg-rim" />
            </div>
            {title && (
              <div className="flex shrink-0 items-center justify-between px-5 pb-3">
                <div className="text-[18px] font-bold leading-6 text-fg">{title}</div>
                <button
                  onClick={onClose}
                  aria-label="Fermer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-tile text-fg transition active:scale-90"
                >
                  <X className="h-[18px] w-[18px]" />
                </button>
              </div>
            )}
            <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-6">{children}</div>
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
    <div className="mb-3 flex items-center justify-between">
      <h3 className="flex items-center gap-2 text-[18px] font-bold leading-6 text-fg">
        {icon}
        {title}
      </h3>
      {action && (
        <button onClick={onAction} className="text-[13px] font-semibold text-lime transition active:opacity-70">
          {action}
        </button>
      )}
    </div>
  );
}

/** Onglets pilule défilants (segmented) : actif lime, inactif tile. */
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
    <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5" role="tablist">
      {items.map((it) => {
        const active = it.id === value;
        return (
          <button
            key={it.id}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(it.id)}
            className={`relative h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors ${
              active ? 'text-on-lime' : 'bg-tile text-mute'
            }`}
          >
            {active && (
              <motion.span
                layoutId={layoutId}
                transition={SPRING_SNAPPY}
                className="absolute inset-0 rounded-full bg-lime"
              />
            )}
            <span className="relative z-10 whitespace-nowrap">{it.label}</span>
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
  return <motion.span className={`num ${className ?? ''}`}>{rounded}</motion.span>;
}

export interface RingSpec {
  pct: number;
  /** Conservé pour compatibilité : ignoré, les anneaux sont lime en 3 intensités. */
  color?: string;
}

const RING_OPACITY = [1, 0.65, 0.35];

/** Anneaux d'activité concentriques : lime uniquement, 3 intensités, piste `rim`. */
export function ActivityRings({ rings, size = 112, stroke = 10, children }: { rings: RingSpec[]; size?: number; stroke?: number; children?: ReactNode }) {
  const gap = 4;
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        {rings.map((r, i) => {
          const radius = size / 2 - stroke / 2 - i * (stroke + gap);
          const c = 2 * Math.PI * radius;
          const pct = Math.max(0, Math.min(100, r.pct));
          return (
            <g key={i}>
              <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#2E2F35" strokeWidth={stroke} />
              <motion.circle
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="none"
                stroke="#C8FF00"
                strokeOpacity={RING_OPACITY[Math.min(i, RING_OPACITY.length - 1)]}
                strokeWidth={stroke}
                strokeLinecap="round"
                strokeDasharray={c}
                initial={{ strokeDashoffset: c }}
                animate={{ strokeDashoffset: c - (pct / 100) * c }}
                transition={{ duration: 1, delay: 0.1 + i * 0.1, ease: 'easeOut' }}
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
 * Photo plein cadre avec Ken Burns très lent et subtil (à réserver à la grande photo héro).
 * Pas de grain ni de reflet.
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
    <motion.div layoutId={layoutId} className={`relative overflow-hidden bg-card ${className}`}>
      <motion.img
        src={src}
        alt=""
        draggable={false}
        decoding="async"
        className="absolute inset-0 h-full w-full select-none object-cover"
        style={{ objectPosition: position }}
        initial={{ scale: 1.03 }}
        animate={reduce ? { scale: 1.03 } : { scale: [1.03, 1.03 + 0.04 * Math.min(intensity, 1.5), 1.03] }}
        transition={reduce ? undefined : { duration: 40, repeat: Infinity, ease: 'easeInOut' }}
      />
      {tint && (
        <div
          className="absolute inset-0 mix-blend-color"
          style={{ background: `linear-gradient(160deg, ${tint}33 0%, transparent 60%)` }}
        />
      )}
      {children}
    </motion.div>
  );
}

/** Bouton rond 44 px (retour, favori, fermer…). `label` = nom accessible obligatoire. */
export function IconButton({
  label,
  onClick,
  children,
  variant = 'tile',
  size = 44,
  className = '',
  disabled,
}: {
  label: string;
  onClick?: () => void;
  children: ReactNode;
  /** `tile` = fond tile · `glass` = noir translucide (sur photo) · `lime` = fond lime */
  variant?: 'tile' | 'glass' | 'lime';
  size?: number;
  className?: string;
  disabled?: boolean;
}) {
  const tone = variant === 'glass' ? 'bg-black/40 text-white' : variant === 'lime' ? 'bg-lime text-on-lime' : 'bg-tile text-fg';
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      style={{ width: size, height: size }}
      className={`flex shrink-0 items-center justify-center rounded-full transition active:scale-90 disabled:opacity-40 ${tone} ${className}`}
    >
      {children}
    </button>
  );
}

/** En-tête d'écran secondaire : retour (IconButton) + titre centré 17/700 + action droite. */
export function ScreenHeader({ title, onBack, right }: { title: string; onBack: () => void; right?: ReactNode }) {
  return (
    <div className="mb-4 flex items-center justify-between gap-3">
      <IconButton label="Retour" onClick={onBack}>
        <ArrowLeft className="h-5 w-5" />
      </IconButton>
      <h2 className="flex-1 truncate text-center text-[17px] font-bold leading-6 text-fg">{title}</h2>
      <div className="flex h-11 min-w-11 items-center justify-end">{right}</div>
    </div>
  );
}

/** Étoiles de note (lecture seule) : lime pleines, gris `rim` vides. */
export function StarRow({ rating, className = 'h-3.5 w-3.5' }: { rating: number; className?: string }) {
  return (
    <span className="inline-flex items-center gap-0.5" aria-label={`${rating} sur 5`}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Star key={i} className={`${className} ${i <= Math.round(rating) ? 'text-lime' : 'text-rim'}`} />
      ))}
    </span>
  );
}

/** Minuteur circulaire (repos, exercices chronométrés), sans halo. */
export function TimerRing({ total, remaining, size = 190, stroke = 10, color = '#C8FF00', children }: { total: number; remaining: number; size?: number; stroke?: number; color?: string; children?: ReactNode }) {
  const radius = size / 2 - stroke / 2;
  const c = 2 * Math.PI * radius;
  const pct = total > 0 ? Math.max(0, Math.min(1, remaining / total)) : 0;
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg viewBox={`0 0 ${size} ${size}`} className="h-full w-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#2E2F35" strokeWidth={stroke} />
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
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

/** Bouton : primary (lime) · secondary (tile) · ghost (transparent). `lg` = 52 px, `md` = 44 px. */
export function Button({
  variant = 'primary',
  size = 'lg',
  trailingArrow = false,
  fullWidth = false,
  disabled = false,
  onClick,
  children,
  className = '',
  type = 'button',
}: {
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'lg' | 'md';
  trailingArrow?: boolean;
  fullWidth?: boolean;
  disabled?: boolean;
  onClick?: () => void;
  children: ReactNode;
  className?: string;
  type?: 'button' | 'submit';
}) {
  const tone =
    variant === 'primary'
      ? 'bg-lime text-on-lime'
      : variant === 'secondary'
        ? 'bg-tile text-fg'
        : 'bg-transparent text-mute';
  const dot = variant === 'primary' ? 'bg-on-lime text-lime' : 'bg-lime text-on-lime';
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex shrink-0 items-center justify-center gap-2 rounded-full text-[15px] font-bold transition active:scale-[0.97] disabled:pointer-events-none disabled:opacity-40 ${
        size === 'lg' ? 'h-[52px] px-6' : 'h-11 px-5'
      } ${fullWidth ? 'w-full' : ''} ${tone} ${className}`}
    >
      <span className="truncate">{children}</span>
      {trailingArrow && (
        <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${dot}`}>
          <ArrowRight weight="bold" className="h-4 w-4" />
        </span>
      )}
    </button>
  );
}

/** Carte principale : `bg-card`, rayon 28, padding 20. */
export function Card({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const cls = `rounded-[28px] bg-card p-5 ${className}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`block w-full text-left transition active:scale-[0.99] ${cls}`}>
      {children}
    </button>
  ) : (
    <div className={cls}>{children}</div>
  );
}

/** Tuile interne : `bg-tile`, rayon 20, padding 16. */
export function Tile({ children, className = '', onClick }: { children: ReactNode; className?: string; onClick?: () => void }) {
  const cls = `rounded-[20px] bg-tile p-4 ${className}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`block w-full text-left transition active:scale-[0.99] ${cls}`}>
      {children}
    </button>
  ) : (
    <div className={cls}>{children}</div>
  );
}

/** Ligne de liste (coachs, activités…) : leading (avatar 48), titre, sous-titre, méta lime, chevron. */
export function ListRow({
  leading,
  title,
  subtitle,
  meta,
  onClick,
  chevron = true,
  className = '',
}: {
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  meta?: ReactNode;
  onClick?: () => void;
  chevron?: boolean;
  className?: string;
}) {
  const body = (
    <>
      {leading && <div className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-full">{leading}</div>}
      <div className="min-w-0 flex-1 text-left">
        <div className="truncate text-[15px] font-bold leading-5 text-fg">{title}</div>
        {subtitle && <div className="truncate text-[12px] font-medium leading-4 text-mute">{subtitle}</div>}
        {meta && <div className="truncate text-[12px] font-medium leading-4 text-lime">{meta}</div>}
      </div>
      {chevron && (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-tile text-fg">
          <CaretRight className="h-4 w-4" />
        </span>
      )}
    </>
  );
  const cls = `flex w-full items-center gap-3 rounded-[24px] bg-card p-3 ${className}`;
  return onClick ? (
    <button type="button" onClick={onClick} className={`${cls} transition active:scale-[0.99]`}>
      {body}
    </button>
  ) : (
    <div className={cls}>{body}</div>
  );
}

/** Grille de statistiques en 3 colonnes séparées par des filets `rim`. */
export function StatTiles({ items, className = '' }: { items: { label: string; value: ReactNode; unit?: string }[]; className?: string }) {
  return (
    <div className={`grid items-stretch ${className}`} style={{ gridTemplateColumns: `repeat(${Math.min(Math.max(items.length, 1), 3)}, minmax(0, 1fr))` }}>
      {items.map((it, i) => (
        <div key={it.label} className={`flex min-w-0 flex-col items-center px-2 text-center ${i % 3 > 0 ? 'border-l border-rim' : ''}`}>
          <div className="truncate text-[12px] font-medium leading-4 text-mute">{it.label}</div>
          <div className="num mt-1 truncate text-[22px] font-extrabold leading-7 text-fg">
            {it.value}
            {it.unit && <span className="ml-1 text-[12px] font-medium text-mute">{it.unit}</span>}
          </div>
        </div>
      ))}
    </div>
  );
}

/** Barre de progression : piste `rim` 8 px, remplissage lime, poignée blanche optionnelle. */
export function ProgressBar({ value, knob = false, className = '' }: { value: number; knob?: boolean; className?: string }) {
  const pct = Math.max(0, Math.min(100, value));
  return (
    <div
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(pct)}
      className={`relative h-2 w-full rounded-full bg-rim ${className}`}
    >
      <motion.div
        className="absolute inset-y-0 left-0 rounded-full bg-lime"
        initial={false}
        animate={{ width: `${pct}%` }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
      />
      {knob && (
        <motion.span
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white"
          initial={false}
          animate={{ left: `${pct}%` }}
          transition={{ duration: 0.4, ease: 'easeOut' }}
        />
      )}
    </div>
  );
}
