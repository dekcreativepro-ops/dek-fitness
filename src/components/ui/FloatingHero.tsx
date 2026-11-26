import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

/**
 * Silhouette vectorielle de sprinteur qui « flotte » : elle déborde de la carte, oscille doucement,
 * laisse des traînées de vitesse et suit le doigt / l'inclinaison du téléphone (variables CSS
 * --dek-px / --dek-py). Placée derrière une carte en verre, elle s'y reflète.
 */
export function FloatingHero({ className = '' }: { className?: string }) {
  const reduce = useReducedMotion();
  const uid = useId().replace(/:/g, '');
  const limb = (d: string, w: number, opacity = 1) => (
    <path d={d} fill="none" stroke={`url(#fill-${uid})`} strokeWidth={w} strokeLinecap="round" strokeLinejoin="round" opacity={opacity} />
  );

  return (
    <div
      className={`pointer-events-none absolute ${className}`}
      style={{ transform: 'translate(calc(var(--dek-px, 0) * -14px), calc(var(--dek-py, 0) * 10px))', transition: 'transform 0.5s cubic-bezier(0.22,1,0.36,1)' }}
      aria-hidden
    >
      {/* Lueur lime derrière la silhouette */}
      <div className="absolute left-[58%] top-1/2 h-40 w-40 -translate-x-1/2 -translate-y-1/2 rounded-full bg-lime/25 blur-3xl" />

      <motion.svg
        viewBox="0 0 250 250"
        className="relative h-full w-full overflow-visible"
        animate={reduce ? undefined : { y: [0, -12, 0], rotate: [-2, 1.5, -2] }}
        transition={{ duration: 6.5, repeat: Infinity, ease: 'easeInOut' }}
        style={{ transformOrigin: '60% 60%' }}
      >
        <defs>
          <linearGradient id={`fill-${uid}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#E6FF66" />
            <stop offset="1" stopColor="#C8FF00" />
          </linearGradient>
          <linearGradient id={`streak-${uid}`} x1="1" y1="0" x2="0" y2="0">
            <stop offset="0" stopColor="#C8FF00" stopOpacity="0.8" />
            <stop offset="1" stopColor="#C8FF00" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Traînées de vitesse */}
        {[
          { y: 96, x1: 6, x2: 78, d: 0 },
          { y: 128, x1: 0, x2: 66, d: 0.25 },
          { y: 160, x1: 14, x2: 74, d: 0.5 },
        ].map((l) => (
          <motion.line
            key={l.y}
            x1={l.x1}
            x2={l.x2}
            y1={l.y}
            y2={l.y}
            stroke={`url(#streak-${uid})`}
            strokeWidth="4"
            strokeLinecap="round"
            animate={reduce ? undefined : { x: [10, -8, 10], opacity: [0.35, 1, 0.35] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut', delay: l.d }}
          />
        ))}

        {/* Ombre au sol */}
        <ellipse cx="128" cy="226" rx="62" ry="6" fill="#000" opacity="0.35" />

        {/* Membres du côté éloigné (plus sombres) */}
        {limb('M150 74 L112 92 L98 124', 13, 0.5)}
        {limb('M120 132 L158 160 L146 206', 22, 0.5)}
        {limb('M146 206 L170 214', 12, 0.5)}

        {/* Tronc */}
        <path
          d="M126 62 L158 72 L134 136 L104 128 Z"
          fill={`url(#fill-${uid})`}
          stroke={`url(#fill-${uid})`}
          strokeWidth="14"
          strokeLinejoin="round"
        />
        {/* Tête */}
        <circle cx="156" cy="42" r="16" fill={`url(#fill-${uid})`} />

        {/* Membres du côté proche : bras avant plié, jambe arrière en extension */}
        {limb('M146 76 L184 100 L206 76', 14)}
        {limb('M112 130 L78 172 L36 154', 22)}
        {limb('M36 154 L22 146', 12)}
      </motion.svg>
    </div>
  );
}
