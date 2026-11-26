import { motion, useReducedMotion } from 'framer-motion';

// Icônes animées dessinées à la main (SVG + Framer Motion), dans l'esprit « grille 24 px »
// des références : traits arrondis 2 px, remplissage duotone, micro-animation en boucle.

interface AnimIconProps {
  className?: string;
  /** Joue l'animation en boucle (sinon une seule fois au montage) */
  loop?: boolean;
  color?: string;
}

/** Flamme qui vacille (séries, calories). */
export function FlameAnimated({ className = 'h-5 w-5', loop = true, color = '#FF8A00' }: AnimIconProps) {
  const reduce = useReducedMotion();
  return (
    <motion.svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <motion.path
        d="M12 2.5c.8 3.2 4.8 5.2 4.8 10.1A4.8 4.8 0 0 1 12 17.4a4.8 4.8 0 0 1-4.8-4.8c0-2.2 1.2-3.6 2.2-4.6.2 1.6 1 2.6 2 2.9-.3-2.9-.3-5.6.6-8.4Z"
        fill={color}
        fillOpacity={0.28}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
        style={{ originX: '50%', originY: '100%' }}
        animate={reduce || !loop ? undefined : { scaleY: [1, 1.08, 0.96, 1.05, 1], rotate: [0, -2, 2, -1, 0] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.path
        d="M12 21.5a3 3 0 0 1-3-3c0-1.6 1.5-2.4 3-4.4 1.5 2 3 2.8 3 4.4a3 3 0 0 1-3 3Z"
        fill="#FDE68A"
        animate={reduce || !loop ? undefined : { opacity: [0.7, 1, 0.75, 1, 0.7], scale: [0.95, 1.05, 1] }}
        transition={{ duration: 1.1, repeat: Infinity, ease: 'easeInOut' }}
        style={{ originX: '50%', originY: '100%' }}
      />
    </motion.svg>
  );
}

/** Cœur qui bat (cardio). */
export function HeartBeat({ className = 'h-5 w-5', loop = true, color = '#FF2E54' }: AnimIconProps) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden
      animate={reduce || !loop ? undefined : { scale: [1, 1.18, 1, 1.12, 1] }}
      transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 0.3 }}
    >
      <path
        d="M12 20.5s-7.5-4.6-7.5-10.2A4.3 4.3 0 0 1 12 7.6a4.3 4.3 0 0 1 7.5 2.7c0 5.6-7.5 10.2-7.5 10.2Z"
        fill={color}
        fillOpacity={0.25}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
      <motion.path
        d="M4.5 12.5h4l1.5-3 2.5 6 1.6-3h5.4"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 1.2, repeat: loop ? Infinity : 0, repeatDelay: 0.4, ease: 'easeInOut' }}
      />
    </motion.svg>
  );
}

/** Coche qui se dessine (succès, validation). */
export function CheckDraw({ className = 'h-12 w-12', color = '#080A0E' }: AnimIconProps) {
  return (
    <svg viewBox="0 0 52 52" className={className} fill="none" aria-hidden>
      <motion.circle
        cx="26"
        cy="26"
        r="23"
        stroke={color}
        strokeWidth={3}
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.55, ease: 'easeOut' }}
      />
      <motion.path
        d="M15 27l7.5 7.5L38 18"
        stroke={color}
        strokeWidth={4.5}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.4, delay: 0.45, ease: 'easeOut' }}
      />
    </svg>
  );
}

/** Éclair qui pulse (énergie, XP). */
export function BoltPulse({ className = 'h-5 w-5', loop = true, color = '#C8FF00' }: AnimIconProps) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden
      animate={reduce || !loop ? undefined : { rotate: [0, -8, 6, 0], scale: [1, 1.12, 1] }}
      transition={{ duration: 0.9, repeat: Infinity, repeatDelay: 1.6 }}
    >
      <path
        d="M13.5 2.5 5 13.5h6l-1 8 8.5-11h-6l1-8Z"
        fill={color}
        fillOpacity={0.3}
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </motion.svg>
  );
}

/** Goutte qui ondule (hydratation). */
export function DropWave({ className = 'h-5 w-5', loop = true, color = '#00E5FF' }: AnimIconProps) {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <defs>
        <clipPath id="dek-drop-clip">
          <path d="M12 2.8s6.5 7 6.5 11.4A6.5 6.5 0 0 1 12 20.7a6.5 6.5 0 0 1-6.5-6.5C5.5 9.8 12 2.8 12 2.8Z" />
        </clipPath>
      </defs>
      <g clipPath="url(#dek-drop-clip)">
        <motion.path
          d="M-6 14c3-1.5 6 1.5 9 0s6-1.5 9 0 6 1.5 9 0 6-1.5 9 0V24H-6Z"
          fill={color}
          fillOpacity={0.45}
          animate={reduce || !loop ? undefined : { x: [0, -12] }}
          transition={{ duration: 1.8, repeat: Infinity, ease: 'linear' }}
        />
      </g>
      <path
        d="M12 2.8s6.5 7 6.5 11.4A6.5 6.5 0 0 1 12 20.7a6.5 6.5 0 0 1-6.5-6.5C5.5 9.8 12 2.8 12 2.8Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Haltère qui se soulève (force, séances). */
export function DumbbellLift({ className = 'h-5 w-5', loop = true, color = '#C8FF00' }: AnimIconProps) {
  const reduce = useReducedMotion();
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden
      animate={reduce || !loop ? undefined : { y: [1.5, -1.5, 1.5], rotate: [-6, 6, -6] }}
      transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
    >
      <rect x="2.5" y="8.5" width="3.5" height="7" rx="1.2" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={2} />
      <rect x="18" y="8.5" width="3.5" height="7" rx="1.2" fill={color} fillOpacity={0.3} stroke={color} strokeWidth={2} />
      <path d="M6 12h12" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
      <path d="M1.5 12h1M21.5 12h1" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </motion.svg>
  );
}

/** Trophée avec reflet qui balaie (récompenses, classement). */
export function TrophyShine({ className = 'h-5 w-5', loop = true, color = '#F5C542' }: AnimIconProps) {
  const reduce = useReducedMotion();
  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden>
      <defs>
        <clipPath id="dek-trophy-clip">
          <path d="M7 3.5h10v5.5a5 5 0 0 1-10 0V3.5Z" />
        </clipPath>
      </defs>
      <path d="M7 3.5h10v5.5a5 5 0 0 1-10 0V3.5Z" fill={color} fillOpacity={0.28} stroke={color} strokeWidth={2} strokeLinejoin="round" />
      <path d="M7 5.5H4.5a2.5 2.5 0 0 0 2.6 3.7M17 5.5h2.5a2.5 2.5 0 0 1-2.6 3.7" stroke={color} strokeWidth={1.8} strokeLinecap="round" />
      <path d="M12 14v3.5M8.5 20.5h7M9.5 17.5h5" stroke={color} strokeWidth={2} strokeLinecap="round" />
      <g clipPath="url(#dek-trophy-clip)">
        <motion.rect
          x="-6"
          y="0"
          width="4"
          height="16"
          fill="white"
          opacity={0.75}
          animate={reduce || !loop ? undefined : { x: [-6, 26] }}
          transition={{ duration: 1.1, repeat: Infinity, repeatDelay: 2.2, ease: 'easeInOut' }}
        />
      </g>
    </svg>
  );
}

/** « + » qui pivote en « × » (bouton d'action central). */
export function PlusMorph({ open, className = 'h-6 w-6', color = '#080A0E' }: { open: boolean; className?: string; color?: string }) {
  return (
    <motion.svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      aria-hidden
      animate={{ rotate: open ? 135 : 0 }}
      transition={{ type: 'spring', stiffness: 420, damping: 22 }}
    >
      <path d="M12 4.5v15M4.5 12h15" stroke={color} strokeWidth={3} strokeLinecap="round" />
    </motion.svg>
  );
}

/** Point « LIVE » avec onde. */
export function LiveDot({ color = '#C8FF00', className = '' }: { color?: string; className?: string }) {
  return (
    <span className={`relative inline-flex h-2 w-2 ${className}`}>
      <motion.span
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color }}
        animate={{ scale: [1, 2.6], opacity: [0.6, 0] }}
        transition={{ duration: 1.4, repeat: Infinity, ease: 'easeOut' }}
      />
      <span className="relative inline-flex h-2 w-2 rounded-full" style={{ backgroundColor: color }} />
    </span>
  );
}

/** Explosion de confettis (victoires, séance terminée). */
export function ConfettiBurst({ count = 26, colors = ['#C8FF00', '#00E5FF', '#FF2E54', '#FF8A00', '#FFFFFF'] }: { count?: number; colors?: string[] }) {
  const reduce = useReducedMotion();
  if (reduce) return null;
  const pieces = Array.from({ length: count }, (_, i) => {
    const angle = (i / count) * Math.PI * 2 + (i % 3) * 0.2;
    const dist = 90 + (i % 5) * 26;
    return {
      i,
      x: Math.cos(angle) * dist,
      y: Math.sin(angle) * dist - 40,
      rotate: (i * 47) % 360,
      color: colors[i % colors.length],
      w: i % 2 === 0 ? 8 : 5,
      h: i % 2 === 0 ? 4 : 9,
    };
  });
  return (
    <div className="pointer-events-none absolute left-1/2 top-1/2 h-0 w-0" aria-hidden>
      {pieces.map((p) => (
        <motion.span
          key={p.i}
          className="absolute rounded-[2px]"
          style={{ backgroundColor: p.color, width: p.w, height: p.h }}
          initial={{ x: 0, y: 0, opacity: 1, rotate: 0, scale: 0.4 }}
          animate={{ x: p.x, y: [0, p.y, p.y + 140], opacity: [1, 1, 0], rotate: p.rotate + 360, scale: 1 }}
          transition={{ duration: 1.5, ease: 'easeOut', times: [0, 0.45, 1] }}
        />
      ))}
    </div>
  );
}
