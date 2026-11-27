import { useId } from 'react';
import type { MuscleGroup } from '../../types/dek';
import { BODY_BACK, BODY_FRONT, BODY_VIEWBOX } from './bodyData';

// Silhouette musculaire (face ou dos) façon planche d'anatomie : le corps est composé de ses vrais muscles
// (polygones anatomiques, voir bodyData.ts). Muscle ciblé = lime, secondaire = lime atténué, sinon gris.

interface BodyFigureProps {
  view: 'front' | 'back';
  /** 2 = ciblé (lime), 1 = secondaire (lime atténué), 0 = neutre */
  level: (m: MuscleGroup) => 0 | 1 | 2;
  onToggle?: (m: MuscleGroup) => void;
  className?: string;
}

export function BodyFigure({ view, level, onToggle, className = 'h-56' }: BodyFigureProps) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const polys = view === 'front' ? BODY_FRONT : BODY_BACK;
  const fillOf = (g: MuscleGroup | null) => {
    if (!g) return `url(#${uid}-body)`;
    const l = level(g);
    return l === 2 ? `url(#${uid}-on)` : l === 1 ? `url(#${uid}-mid)` : `url(#${uid}-off)`;
  };

  return (
    <svg viewBox={BODY_VIEWBOX} className={className} role="img" aria-label={view === 'front' ? 'Silhouette vue de face' : 'Silhouette vue de dos'}>
      <defs>
        <linearGradient id={`${uid}-body`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#3A3C44" />
          <stop offset="1" stopColor="#2A2B31" />
        </linearGradient>
        <linearGradient id={`${uid}-off`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4A4C56" />
          <stop offset="1" stopColor="#363740" />
        </linearGradient>
        <linearGradient id={`${uid}-on`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#DFFF5A" />
          <stop offset="1" stopColor="#A9D800" />
        </linearGradient>
        <linearGradient id={`${uid}-mid`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#93AD3C" />
          <stop offset="1" stopColor="#5E6F1E" />
        </linearGradient>
      </defs>
      {polys.map((poly) => (
        <polygon
          key={poly.p}
          points={poly.p}
          fill={fillOf(poly.g)}
          stroke="#17181C"
          strokeWidth={6}
          strokeLinejoin="round"
          className={onToggle && poly.g ? 'cursor-pointer transition-opacity hover:opacity-90' : undefined}
          onClick={onToggle && poly.g ? () => onToggle(poly.g as MuscleGroup) : undefined}
        />
      ))}
    </svg>
  );
}
