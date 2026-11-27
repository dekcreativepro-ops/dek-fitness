import { useId, type ReactNode } from 'react';
import type { MuscleGroup } from '../../types/dek';

// Silhouette musculaire (face ou dos) : formes anatomiques lissées, dégradés doux, séparations musculaires.
// Les muscles actifs passent en lime ; les muscles secondaires en lime atténué. Une moitié est dessinée puis
// reflétée pour garder une symétrie parfaite.

interface BodyFigureProps {
  view: 'front' | 'back';
  /** 2 = ciblé (lime), 1 = secondaire (lime atténué), 0 = neutre */
  level: (m: MuscleGroup) => 0 | 1 | 2;
  onToggle?: (m: MuscleGroup) => void;
  className?: string;
}

interface Part {
  m: MuscleGroup;
  d: string;
}

const DELTOID = 'M73 64 C62 62 52 68 50 82 C48 94 51 103 56 108 C62 102 68 94 72 84 C75 77 75 70 73 64Z';
const ARM_UPPER = 'M56 108 C52 124 49 140 49 154 L62 158 C64 143 68 128 71 111 C65 112 60 111 56 108Z';
const ARM_LOWER = 'M48 160 C45 178 43 192 43 206 L55 210 C58 194 60 177 63 162Z';

const FRONT: Part[] = [
  { m: 'epaules', d: DELTOID },
  { m: 'pectoraux', d: 'M75 70 C83 65 92 67 99 73 L99 112 C90 119 78 117 71 107 C66 96 69 80 75 70Z' },
  { m: 'bras', d: ARM_UPPER },
  { m: 'bras', d: ARM_LOWER },
  { m: 'abdos', d: 'M83 122 H93 Q99 122 99 128 V134 Q99 139 93 139 H83 Q77 139 77 134 V128 Q77 122 83 122Z' },
  { m: 'abdos', d: 'M83 143 H93 Q99 143 99 149 V155 Q99 160 93 160 H83 Q77 160 77 155 V149 Q77 143 83 143Z' },
  { m: 'abdos', d: 'M83 164 H93 Q99 164 99 170 V176 Q99 181 93 181 H83 Q78 181 78 176 V170 Q78 164 83 164Z' },
  { m: 'abdos', d: 'M85 185 H93 Q99 185 99 190 V196 Q99 200 94 200 H86 Q81 200 81 195 V190 Q81 185 85 185Z' },
  { m: 'jambes', d: 'M70 240 C63 266 61 296 66 326 L96 328 C99 296 100 266 99 244Z' },
  { m: 'jambes', d: 'M67 342 C64 368 66 392 71 412 L90 412 C94 392 95 368 96 342Z' },
];

const BACK: Part[] = [
  { m: 'epaules', d: DELTOID },
  { m: 'dos', d: 'M99 60 C88 62 78 66 73 72 C70 90 72 112 78 134 C84 154 92 172 99 190Z' },
  { m: 'bras', d: ARM_UPPER },
  { m: 'bras', d: ARM_LOWER },
  { m: 'jambes', d: 'M70 204 C66 224 68 246 82 254 C92 257 98 250 99 244 L99 204Z' },
  { m: 'jambes', d: 'M68 258 C63 282 62 306 67 326 L96 328 C99 306 99 282 99 256Z' },
  { m: 'jambes', d: 'M67 342 C62 360 64 384 72 412 L90 412 C97 384 98 360 96 342Z' },
];

// Éléments neutres (tête, cou, mains, bassin, genoux, pieds) et traits de séparation des muscles
const NEUTRAL_HALF = [
  'M73 64 L75 70 C84 66 92 64 99 66 L99 58 C92 60 84 62 73 64Z',
  'M74 198 C72 214 70 226 70 238 L99 242 L99 202Z',
  'M43 208 C40 218 41 228 47 232 C53 232 57 224 55 212Z',
  'M68 414 L92 414 C96 420 98 426 94 430 L62 430 C60 424 62 418 68 414Z',
];
const KNEE = 'M67 326 C70 340 92 340 96 326 L96 342 C92 350 70 350 67 342Z';
const LINES_FRONT = ['M99 74 L99 200', 'M71 106 C80 112 90 112 99 108', 'M84 258 C86 280 86 300 84 322', 'M72 118 C68 140 70 168 76 192'];
const LINES_BACK = ['M99 60 L99 204', 'M80 88 C86 100 92 112 98 122', 'M84 270 C86 290 86 308 84 324', 'M78 214 C86 222 94 224 99 222'];

export function BodyFigure({ view, level, onToggle, className = 'h-56' }: BodyFigureProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const parts = view === 'front' ? FRONT : BACK;
  const lines = view === 'front' ? LINES_FRONT : LINES_BACK;

  const fillOf = (m: MuscleGroup) => (level(m) === 2 ? `url(#${uid}-on)` : level(m) === 1 ? `url(#${uid}-mid)` : `url(#${uid}-off)`);

  const half = (mirror: boolean): ReactNode => (
    <g key={mirror ? 'r' : 'l'} transform={mirror ? 'translate(200 0) scale(-1 1)' : undefined}>
      {NEUTRAL_HALF.map((d) => (
        <path key={d} d={d} fill={`url(#${uid}-off)`} stroke="#0F1013" strokeWidth={0.8} />
      ))}
      <path d={KNEE} fill={`url(#${uid}-off)`} stroke="#0F1013" strokeWidth={0.8} />
      {parts.map((p) => (
        <path
          key={p.d}
          d={p.d}
          fill={fillOf(p.m)}
          stroke="#0F1013"
          strokeWidth={0.9}
          strokeLinejoin="round"
          className={onToggle ? 'cursor-pointer transition-opacity hover:opacity-90' : undefined}
          onClick={onToggle ? () => onToggle(p.m) : undefined}
        />
      ))}
      {lines.map((d) => (
        <path key={d} d={d} fill="none" stroke="#0F1013" strokeOpacity={0.45} strokeWidth={0.9} strokeLinecap="round" pointerEvents="none" />
      ))}
    </g>
  );

  return (
    <svg viewBox="0 0 200 440" className={className} role="img" aria-label={view === 'front' ? 'Silhouette vue de face' : 'Silhouette vue de dos'}>
      <defs>
        <linearGradient id={`${uid}-off`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#40424B" />
          <stop offset="1" stopColor="#2A2B31" />
        </linearGradient>
        <linearGradient id={`${uid}-on`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DBFF4D" />
          <stop offset="1" stopColor="#A5D400" />
        </linearGradient>
        <linearGradient id={`${uid}-mid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#8FA83A" />
          <stop offset="1" stopColor="#5A6B1C" />
        </linearGradient>
      </defs>
      <ellipse cx="100" cy="435" rx="52" ry="4.5" fill="#000" opacity="0.28" />
      {/* tête et cou */}
      <ellipse cx="100" cy="26" rx="15" ry="18" fill={`url(#${uid}-off)`} stroke="#0F1013" strokeWidth={0.8} />
      <path d="M92 42 L92 58 C95 62 105 62 108 58 L108 42Z" fill={`url(#${uid}-off)`} stroke="#0F1013" strokeWidth={0.8} />
      {half(false)}
      {half(true)}
    </svg>
  );
}
