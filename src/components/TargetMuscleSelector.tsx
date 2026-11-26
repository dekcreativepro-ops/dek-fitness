import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from './DekIcons';
import type { MuscleGroup } from '../types/dek';

interface TargetMuscleSelectorProps {
  selected: MuscleGroup[];
  onChange: (muscles: MuscleGroup[]) => void;
}

const MUSCLE_LIST: { id: MuscleGroup; label: string; side: 'front' | 'back' | 'both' }[] = [
  { id: 'epaules', label: 'Épaules', side: 'both' },
  { id: 'pectoraux', label: 'Pectoraux', side: 'front' },
  { id: 'bras', label: 'Bras', side: 'both' },
  { id: 'abdos', label: 'Abdos', side: 'front' },
  { id: 'dos', label: 'Dos', side: 'back' },
  { id: 'jambes', label: 'Jambes', side: 'both' },
];

export function TargetMuscleSelector({ selected, onChange }: TargetMuscleSelectorProps) {
  const [side, setSide] = useState<'front' | 'back'>('front');

  const toggleMuscle = (m: MuscleGroup) => {
    if (selected.includes(m)) {
      onChange(selected.filter((x) => x !== m));
    } else {
      onChange([...selected, m]);
    }
  };

  const isSelected = (m: MuscleGroup) => selected.includes(m);

  // Classes SVG aux tokens : zone choisie = lime, sinon `tile` bordée `rim`.
  const zone = (m: MuscleGroup) =>
    `transition-colors ${isSelected(m) ? 'fill-lime stroke-lime' : 'fill-tile stroke-rim'}`;

  return (
    <div className="rounded-[28px] bg-card p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <span className="text-[13px] font-medium text-mute">Touche les zones à cibler</span>
        <div className="flex rounded-full bg-tile p-1">
          {(['front', 'back'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className={`h-8 rounded-full px-3.5 text-[13px] font-semibold transition-colors ${
                side === s ? 'bg-lime text-on-lime' : 'text-mute'
              }`}
            >
              {s === 'front' ? 'Face' : 'Dos'}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-[1fr_1.15fr] items-center gap-3">
        <div className="space-y-2">
          {MUSCLE_LIST.map((m) => {
            const active = isSelected(m.id);
            return (
              <motion.button
                key={m.id}
                type="button"
                whileTap={{ scale: 0.96 }}
                aria-pressed={active}
                onClick={() => {
                  toggleMuscle(m.id);
                  if (m.side === 'back') setSide('back');
                  if (m.side === 'front') setSide('front');
                }}
                className={`flex h-10 w-full items-center justify-between rounded-full px-4 text-left text-[14px] font-semibold transition-colors ${
                  active ? 'bg-lime text-on-lime' : 'bg-tile text-mute'
                }`}
              >
                <span className="truncate">{m.label}</span>
                {active && <Check weight="bold" className="h-4 w-4 shrink-0" />}
              </motion.button>
            );
          })}
        </div>

        {/* Silhouette interactive */}
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 180 290" className="h-[245px] w-full">
            <circle cx="90" cy="24" r="14" className="fill-tile stroke-rim" />
            <rect x="83" y="38" width="14" height="12" rx="4" className="fill-tile" />

            {/* Épaules */}
            <g onClick={() => toggleMuscle('epaules')} className="cursor-pointer">
              <ellipse cx="56" cy="62" rx="14" ry="11" strokeWidth="1.5" className={zone('epaules')} />
              <ellipse cx="124" cy="62" rx="14" ry="11" strokeWidth="1.5" className={zone('epaules')} />
            </g>

            {/* Bras */}
            <g onClick={() => toggleMuscle('bras')} className="cursor-pointer">
              <path d="M44 72 L34 112 L46 116 L54 78 Z" strokeWidth="1.3" className={zone('bras')} />
              <path d="M136 72 L146 112 L134 116 L126 78 Z" strokeWidth="1.3" className={zone('bras')} />
              <path d="M33 116 L24 148 L36 151 L45 119 Z" strokeWidth="1.2" className={zone('bras')} />
              <path d="M147 116 L156 148 L144 151 L135 119 Z" strokeWidth="1.2" className={zone('bras')} />
            </g>

            {side === 'front' ? (
              <>
                <g onClick={() => toggleMuscle('pectoraux')} className="cursor-pointer">
                  <path d="M64 56 Q77 54 88 60 L88 82 Q70 84 62 72 Z" strokeWidth="1.5" className={zone('pectoraux')} />
                  <path d="M116 56 Q103 54 92 60 L92 82 Q110 84 118 72 Z" strokeWidth="1.5" className={zone('pectoraux')} />
                </g>

                <g onClick={() => toggleMuscle('abdos')} className="cursor-pointer">
                  {[
                    { x: 74, y: 86, w: 14, h: 12 },
                    { x: 92, y: 86, w: 14, h: 12 },
                    { x: 74, y: 101, w: 14, h: 12 },
                    { x: 92, y: 101, w: 14, h: 12 },
                    { x: 76, y: 116, w: 12, h: 13 },
                    { x: 92, y: 116, w: 12, h: 13 },
                  ].map((r) => (
                    <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={r.h} rx="3" className={zone('abdos')} />
                  ))}
                </g>
              </>
            ) : (
              <g onClick={() => toggleMuscle('dos')} className="cursor-pointer">
                <path d="M64 54 L90 48 L116 54 L110 92 L90 126 L70 92 Z" strokeWidth="1.6" className={zone('dos')} />
                <line x1="90" y1="54" x2="90" y2="122" strokeWidth="2" className="stroke-card" />
              </g>
            )}

            {/* Bassin neutre */}
            <path d="M68 134 L112 134 L106 152 L74 152 Z" className="fill-tile" />

            {/* Jambes */}
            <g onClick={() => toggleMuscle('jambes')} className="cursor-pointer">
              <path d="M68 154 L86 154 L84 214 L64 214 Z" strokeWidth="1.5" className={zone('jambes')} />
              <path d="M94 154 L112 154 L116 214 L96 214 Z" strokeWidth="1.5" className={zone('jambes')} />
              <path d="M65 220 L83 220 L78 268 L64 268 Z" strokeWidth="1.4" className={zone('jambes')} />
              <path d="M97 220 L115 220 L116 268 L102 268 Z" strokeWidth="1.4" className={zone('jambes')} />
            </g>

            {/* Pieds */}
            <ellipse cx="70" cy="276" rx="10" ry="5" className="fill-tile" />
            <ellipse cx="110" cy="276" rx="10" ry="5" className="fill-tile" />
          </svg>
        </div>
      </div>
    </div>
  );
}
