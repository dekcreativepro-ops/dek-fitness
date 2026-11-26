import { motion } from 'framer-motion';
import type { MuscleGroup } from '../../types/dek';

// Carte musculaire (face + dos) en lecture seule : principaux en lime plein,
// secondaires en lime atténué, le reste en gris neutre. Sans halo ni pulsation.

interface MuscleMapProps {
  primary: MuscleGroup[];
  secondary?: MuscleGroup[];
  className?: string;
  color?: string;
}

const NEUTRAL = '#2E2F35';
const BODY = '#24252A';

export function MuscleMap({ primary, secondary = [], className = 'h-40', color = '#C8FF00' }: MuscleMapProps) {
  const level = (m: MuscleGroup) => (primary.includes(m) ? 2 : secondary.includes(m) ? 1 : 0);

  const part = (m: MuscleGroup, children: React.ReactNode) => {
    const l = level(m);
    return (
      <motion.g
        fill={l === 2 ? color : NEUTRAL}
        fillOpacity={1}
        stroke="#1A1B1F"
        strokeWidth={1}
        style={l === 1 ? { fill: color, fillOpacity: 0.4 } : undefined}
      >
        {children}
      </motion.g>
    );
  };

  const body = (side: 'front' | 'back', dx: number) => (
    <g key={side} transform={`translate(${dx} 0)`}>
      <circle cx="45" cy="16" r="10" fill={BODY} />
      <rect x="40" y="26" width="10" height="7" rx="3" fill={BODY} />
      {part('epaules', <>
        <ellipse cx="27" cy="41" rx="9" ry="7" />
        <ellipse cx="63" cy="41" rx="9" ry="7" />
      </>)}
      {part('bras', <>
        <path d="M19 47 12 76 20 78 26 51Z" />
        <path d="M71 47 78 76 70 78 64 51Z" />
        <path d="M12 80 7 102 14 104 20 82Z" />
        <path d="M78 80 83 102 76 104 70 82Z" />
      </>)}
      {side === 'front' ? (
        <>
          {part('pectoraux', <>
            <path d="M32 37q7-1 12 3v14q-9 1-13-6Z" />
            <path d="M58 37q-7-1-12 3v14q9 1 13-6Z" />
          </>)}
          {part('abdos', <>
            <rect x="37" y="57" width="7" height="7" rx="2" />
            <rect x="46" y="57" width="7" height="7" rx="2" />
            <rect x="37" y="66" width="7" height="7" rx="2" />
            <rect x="46" y="66" width="7" height="7" rx="2" />
            <rect x="38" y="75" width="6" height="8" rx="2" />
            <rect x="46" y="75" width="6" height="8" rx="2" />
          </>)}
        </>
      ) : (
        <>
          {part('dos', <>
            <path d="M31 36 45 32l14 4-3 26-11 22-11-22Z" />
          </>)}
          {part('abdos', <>
            <rect x="39" y="76" width="12" height="9" rx="3" />
          </>)}
        </>
      )}
      <path d="M33 88h24l-4 11H37Z" fill={BODY} />
      {part('jambes', <>
        <path d="M33 101h11l-1 38H31Z" />
        <path d="M46 101h11l2 38H47Z" />
        <path d="M32 143h11l-3 32h-8Z" />
        <path d="M47 143h11l1 32h-8Z" />
      </>)}
    </g>
  );

  return (
    <svg viewBox="0 0 190 180" className={className} role="img" aria-label="Muscles sollicités">
      {body('front', 0)}
      {body('back', 100)}
    </svg>
  );
}
