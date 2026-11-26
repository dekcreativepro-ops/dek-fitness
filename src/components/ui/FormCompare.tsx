import { useId } from 'react';
import { motion, useReducedMotion } from 'framer-motion';
import type { DemoExercise } from '../../types/dek';
import { Check, X } from '../DekIcons';

// Démo « erreur / bonne forme » animée en vectoriel : mannequin sombre en vue de profil,
// articulation qui s'illumine en rouge (erreur) ou en vert (bonne exécution).
// Inspiré des vidéos pédagogiques de posture (pompes, squats, gainage).

interface Frame {
  /** Ligne principale : cheville → (genou) → hanche → épaule */
  body: string;
  /** Bras : épaule → (coude) → main */
  arm: string;
  head: [number, number];
}

interface Variant {
  frames: [Frame, Frame];
  legend: string;
}

const FLOOR = 112;

const POSES: Partial<Record<DemoExercise, { bad: Variant; good: Variant }>> = {
  pompes: {
    good: {
      legend: 'Corps gainé, coudes à 45°',
      frames: [
        { body: 'M36 98 L120 84 L205 70', arm: 'M205 70 L212 90 L218 108', head: [226, 60] },
        { body: 'M36 100 L120 97 L205 93', arm: 'M205 93 L192 104 L218 108', head: [227, 85] },
      ],
    },
    bad: {
      legend: 'Hanches qui s’affaissent',
      frames: [
        { body: 'M36 98 L120 106 L205 70', arm: 'M205 70 L212 90 L218 108', head: [226, 60] },
        { body: 'M36 100 L120 109 L205 93', arm: 'M205 93 L192 104 L218 108', head: [227, 85] },
      ],
    },
  },
  squats: {
    good: {
      legend: 'Dos droit, talons au sol',
      frames: [
        { body: 'M150 108 L152 84 L140 60 L138 34', arm: 'M138 34 L172 42', head: [140, 20] },
        { body: 'M150 108 L176 86 L120 86 L126 54', arm: 'M126 54 L162 62', head: [130, 40] },
      ],
    },
    bad: {
      legend: 'Dos arrondi, genoux trop avancés',
      frames: [
        { body: 'M150 108 L152 84 L140 60 L138 34', arm: 'M138 34 L172 42', head: [140, 20] },
        { body: 'M152 104 L192 88 L118 92 L96 70', arm: 'M96 70 L130 82', head: [88, 60] },
      ],
    },
  },
  gainage: {
    good: {
      legend: 'Ligne droite épaules–hanches',
      frames: [
        { body: 'M36 100 L120 88 L200 84', arm: 'M200 84 L200 104 L224 104', head: [218, 76] },
        { body: 'M36 100 L120 87 L200 83', arm: 'M200 83 L200 104 L224 104', head: [218, 75] },
      ],
    },
    bad: {
      legend: 'Bassin trop bas',
      frames: [
        { body: 'M36 100 L120 104 L200 84', arm: 'M200 84 L200 104 L224 104', head: [218, 76] },
        { body: 'M36 100 L120 106 L200 83', arm: 'M200 83 L200 104 L224 104', head: [218, 75] },
      ],
    },
  },
};

const BAD = '#FF4D5E';
const GOOD = '#4ADE80';

function Panel({ variant, tone }: { variant: Variant; tone: 'bad' | 'good' }) {
  const uid = useId().replace(/:/g, '');
  const reduce = useReducedMotion();
  const color = tone === 'bad' ? BAD : GOOD;
  const [a, b] = variant.frames;
  const loop = (key: 'body' | 'arm') => (reduce ? a[key] : [a[key], b[key], a[key]]);
  const t = { duration: 2.6, repeat: Infinity, ease: 'easeInOut' as const };

  return (
    <div className="relative overflow-hidden rounded-[20px] bg-[#16171b]">
      <svg viewBox="0 0 300 130" className="block w-full" role="img" aria-label={variant.legend}>
        <defs>
          <filter id={`g-${uid}`} x="-30%" y="-30%" width="160%" height="160%">
            <feGaussianBlur stdDeviation="3.5" result="b" />
            <feMerge>
              <feMergeNode in="b" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>
        <rect x="0" y={FLOOR} width="300" height={130 - FLOOR} fill="#101114" />
        <line x1="0" y1={FLOOR} x2="300" y2={FLOOR} stroke="#2a2b31" strokeWidth="2" />

        {/* Corps (mannequin clair) */}
        <motion.path
          fill="none"
          stroke="#c9ccd6"
          strokeWidth="11"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ d: a.body }}
          animate={{ d: loop('body') }}
          transition={t}
        />
        <motion.path
          fill="none"
          stroke="#aeb1bd"
          strokeWidth="8"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={{ d: a.arm }}
          animate={{ d: loop('arm') }}
          transition={t}
        />
        <motion.circle
          r="10"
          fill="#d8dbe3"
          initial={{ cx: a.head[0], cy: a.head[1] }}
          animate={reduce ? undefined : { cx: [a.head[0], b.head[0], a.head[0]], cy: [a.head[1], b.head[1], a.head[1]] }}
          transition={t}
        />

        {/* Ligne lumineuse sur l'articulation */}
        <motion.path
          fill="none"
          stroke={color}
          strokeWidth="3.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          filter={`url(#g-${uid})`}
          initial={{ d: a.body }}
          animate={{ d: loop('body') }}
          transition={t}
        />
      </svg>

      <span
        className="absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full"
        style={{ backgroundColor: `${color}26`, color }}
      >
        {tone === 'bad' ? <X className="h-4 w-4" /> : <Check className="h-4 w-4" />}
      </span>
      <span className="absolute bottom-2.5 left-3 text-[12px] font-semibold text-white/80">{variant.legend}</span>
    </div>
  );
}

/** Deux panneaux empilés « Mauvaise forme » / « Bonne forme », comme les vidéos pédagogiques. */
export function FormCompare({ demo }: { demo: DemoExercise }) {
  const poses = POSES[demo];
  if (!poses) return null;
  return (
    <div className="space-y-2">
      <Panel variant={poses.bad} tone="bad" />
      <Panel variant={poses.good} tone="good" />
    </div>
  );
}
