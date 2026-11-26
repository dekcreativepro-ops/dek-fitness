import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';

// Écusson hexagonal de trophée (inspiré des murs de succès des apps running) :
// métal coloré + reflet quand il est gagné, gris gravé avec cadenas quand il est verrouillé.

const HEX = 'M50 4 90 27v46L50 96 10 73V27Z';
const HEX_INNER = 'M50 13 82 31.5v37L50 87 18 68.5v-37Z';

export function TrophyBadge({
  mark,
  color,
  earned,
  size = 84,
  animated = true,
}: {
  mark: string;
  color: string;
  earned: boolean;
  size?: number;
  animated?: boolean;
}) {
  const uid = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const play = earned && animated && !reduce;

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={earned ? `Trophée ${mark} débloqué` : `Trophée ${mark} verrouillé`}>
      <defs>
        <linearGradient id={`m-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={earned ? color : '#2A303C'} />
          <stop offset="0.55" stopColor={earned ? '#0B0E14' : '#161A22'} />
          <stop offset="1" stopColor={earned ? color : '#2A303C'} stopOpacity={earned ? 0.7 : 1} />
        </linearGradient>
        <clipPath id={`c-${uid}`}>
          <path d={HEX} />
        </clipPath>
      </defs>
      {earned && <path d={HEX} fill={color} opacity={0.25} transform="translate(0 3)" />}
      <path d={HEX} fill={`url(#m-${uid})`} stroke={earned ? color : '#3A4150'} strokeWidth={3} strokeLinejoin="round" />
      <path
        d={HEX_INNER}
        fill="none"
        stroke={earned ? color : '#3A4150'}
        strokeOpacity={earned ? 0.55 : 0.6}
        strokeWidth={1.5}
        strokeDasharray={earned ? undefined : '3 3'}
      />
      <text
        x="50"
        y={mark.length > 2 ? 57 : 59}
        textAnchor="middle"
        fontFamily="Chakra Petch, sans-serif"
        fontWeight={700}
        fontSize={mark.length > 2 ? 22 : 28}
        fill={earned ? '#FFFFFF' : '#4B5363'}
        style={earned ? { filter: `drop-shadow(0 0 6px ${color})` } : undefined}
      >
        {mark}
      </text>
      {!earned && (
        <g transform="translate(41 68)" fill="#4B5363">
          <rect x="1" y="6" width="16" height="11" rx="2.5" />
          <path d="M4.5 6V4a4.5 4.5 0 0 1 9 0v2" fill="none" stroke="#4B5363" strokeWidth={2.2} />
        </g>
      )}
      {play && (
        <g clipPath={`url(#c-${uid})`}>
          <motion.rect
            y={-20}
            width={14}
            height={140}
            fill="white"
            opacity={0.3}
            initial={{ x: -40 }}
            animate={{ x: [-40, 130] }}
            transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 3.2, ease: 'easeInOut' }}
            style={{ skewX: -20 }}
          />
        </g>
      )}
    </svg>
  );
}
