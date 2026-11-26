import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import { RANK_STYLES } from './rankStyles';

// Insignes de rang de saison (style écusson militaire / esport) dessinés en SVG.



const SHIELD = 'M32 4 54 12v18c0 14-9.5 24.5-22 30C19.5 54.5 10 44 10 30V12L32 4Z';

function Chevron({ y, color }: { y: number; color: string }) {
  return (
    <path
      d={`M20 ${y} 32 ${y + 7} 44 ${y}`}
      fill="none"
      stroke={color}
      strokeWidth={4.2}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  );
}

function StarShape({ cx, cy, r, color }: { cx: number; cy: number; r: number; color: string }) {
  const pts = Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2;
    const rr = i % 2 === 0 ? r : r * 0.45;
    return `${cx + Math.cos(a) * rr},${cy + Math.sin(a) * rr}`;
  }).join(' ');
  return <polygon points={pts} fill={color} />;
}

export function RankEmblem({
  rank,
  size = 36,
  animated = true,
  className = '',
}: {
  rank: string;
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const style = RANK_STYLES[rank] ?? RANK_STYLES.Recrue;
  const { color, glow, level } = style;
  const play = animated && !reduce;

  return (
    <motion.svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`Rang ${rank}`}
      animate={play && level >= 4 ? { filter: [`drop-shadow(0 0 2px ${glow}66)`, `drop-shadow(0 0 7px ${glow}aa)`, `drop-shadow(0 0 2px ${glow}66)`] } : undefined}
      transition={{ duration: 2.4, repeat: Infinity }}
    >
      <defs>
        <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity={0.38} />
          <stop offset="1" stopColor="#080A0E" stopOpacity={0.95} />
        </linearGradient>
        <clipPath id={`c-${uid}`}>
          <path d={SHIELD} />
        </clipPath>
      </defs>

      {/* Ailes (Élite & Légende) */}
      {level >= 4 && (
        <g fill={color} opacity={0.9}>
          <path d="M10 22 1 18l3 9-3 3 9 2Z" />
          <path d="M54 22l9-4-3 9 3 3-9 2Z" />
        </g>
      )}

      <path d={SHIELD} fill={`url(#g-${uid})`} stroke={color} strokeWidth={2.6} strokeLinejoin="round" />
      <path d="M32 9 49 15v15c0 11-7 19.5-17 24-10-4.5-17-13-17-24V15L32 9Z" fill="none" stroke={color} strokeOpacity={0.35} strokeWidth={1.2} />

      {level === 1 && <Chevron y={28} color={color} />}
      {level === 2 && (
        <>
          <Chevron y={22} color={color} />
          <Chevron y={32} color={color} />
        </>
      )}
      {level === 3 && (
        <>
          <StarShape cx={32} cy={19} r={5} color={color} />
          <Chevron y={27} color={color} />
          <Chevron y={36} color={color} />
        </>
      )}
      {level === 4 && (
        <>
          <StarShape cx={32} cy={24} r={9} color={color} />
          <Chevron y={36} color={color} />
        </>
      )}
      {level === 5 && (
        <>
          {/* Couronne dorée */}
          <path d="M20 26l4-9 8 6 8-6 4 9Z" fill="#F5C542" stroke="#F5C542" strokeWidth={1.5} strokeLinejoin="round" />
          <StarShape cx={24} cy={36} r={4} color={color} />
          <StarShape cx={32} cy={39} r={5} color={color} />
          <StarShape cx={40} cy={36} r={4} color={color} />
        </>
      )}

      {/* Reflet qui balaie l'écusson */}
      {play && (
        <g clipPath={`url(#c-${uid})`}>
          <motion.rect
            y={-10}
            width={10}
            height={90}
            fill="white"
            opacity={0.35}
            initial={{ x: -20 }}
            animate={{ x: [-20, 80] }}
            transition={{ duration: 1.3, repeat: Infinity, repeatDelay: 3.5, ease: 'easeInOut' }}
            style={{ skewX: -20 }}
          />
        </g>
      )}
    </motion.svg>
  );
}
