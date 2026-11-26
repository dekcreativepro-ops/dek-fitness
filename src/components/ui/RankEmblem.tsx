import { useId } from 'react';
import { RANK_STYLES } from './rankStyles';

// Insignes de rang de saison : écusson sobre dessiné en SVG (aucun halo, aucune animation).


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
  animated: _animated = true,
  className = '',
}: {
  rank: string;
  size?: number;
  animated?: boolean;
  className?: string;
}) {
  const uid = useId().replace(/:/g, '');
  const style = RANK_STYLES[rank] ?? RANK_STYLES.Recrue;
  const { color, level } = style;

  return (
    <svg
      viewBox="0 0 64 64"
      width={size}
      height={size}
      className={className}
      role="img"
      aria-label={`Rang ${rank}`}
    >
      <defs>
        <linearGradient id={`g-${uid}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={color} stopOpacity={0.38} />
          <stop offset="1" stopColor="#0E0F12" stopOpacity={0.95} />
        </linearGradient>
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

    </svg>
  );
}
