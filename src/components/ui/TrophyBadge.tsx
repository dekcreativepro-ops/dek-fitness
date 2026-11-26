import { useId } from 'react';

// Écusson hexagonal de trophée (inspiré des murs de succès des apps running) :
// coloré (sobre, sans reflet) quand il est gagné, gris avec cadenas quand il est verrouillé.

const HEX = 'M50 4 90 27v46L50 96 10 73V27Z';
const HEX_INNER = 'M50 13 82 31.5v37L50 87 18 68.5v-37Z';

export function TrophyBadge({
  mark,
  color,
  earned,
  size = 84,
  animated: _animated = true,
}: {
  mark: string;
  color: string;
  earned: boolean;
  size?: number;
  animated?: boolean;
}) {
  const uid = useId().replace(/:/g, '');

  return (
    <svg viewBox="0 0 100 100" width={size} height={size} role="img" aria-label={earned ? `Trophée ${mark} débloqué` : `Trophée ${mark} verrouillé`}>
      <defs>
        <linearGradient id={`m-${uid}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={earned ? color : '#24252A'} />
          <stop offset="0.55" stopColor={earned ? '#0E0F12' : '#1A1B1F'} />
          <stop offset="1" stopColor={earned ? color : '#24252A'} stopOpacity={earned ? 0.7 : 1} />
        </linearGradient>
      </defs>
      <path d={HEX} fill={`url(#m-${uid})`} stroke={earned ? color : '#2E2F35'} strokeWidth={3} strokeLinejoin="round" />
      <path
        d={HEX_INNER}
        fill="none"
        stroke={earned ? color : '#2E2F35'}
        strokeOpacity={earned ? 0.55 : 0.6}
        strokeWidth={1.5}
        strokeDasharray={earned ? undefined : '3 3'}
      />
      <text
        x="50"
        y={mark.length > 2 ? 57 : 59}
        textAnchor="middle"
        fontFamily="Urbanist, sans-serif"
        fontWeight={800}
        fontSize={mark.length > 2 ? 22 : 28}
        fill={earned ? '#FFFFFF' : '#6B6C75'}
      >
        {mark}
      </text>
      {!earned && (
        <g transform="translate(41 68)" fill="#6B6C75">
          <rect x="1" y="6" width="16" height="11" rx="2.5" />
          <path d="M4.5 6V4a4.5 4.5 0 0 1 9 0v2" fill="none" stroke="#6B6C75" strokeWidth={2.2} />
        </g>
      )}
    </svg>
  );
}
