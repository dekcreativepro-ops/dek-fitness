import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
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

  const muscleFill = (m: MuscleGroup) =>
    isSelected(m) ? '#C8FF00' : 'rgba(148, 163, 184, 0.28)';

  const muscleStroke = (m: MuscleGroup) =>
    isSelected(m) ? '#E8FF7A' : 'rgba(255,255,255,0.16)';

  return (
    <div className="rounded-3xl border border-white/10 bg-[#050608] p-3.5">
      {/* Switch Face / Dos inspiré Image 1 */}
      <div className="mb-3 flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium text-slate-400">
          Touche les zones à cibler
        </span>
        <div className="flex rounded-xl border border-white/10 bg-[#11151D] p-0.5">
          {(['front', 'back'] as const).map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSide(s)}
              className={`rounded-lg px-2.5 py-1 text-[10px] font-semibold transition ${
                side === s ? 'bg-white/20 text-white' : 'text-slate-400'
              }`}
            >
              {s === 'front' ? 'Face' : 'Dos'}
            </button>
          ))}
        </div>
      </div>

      {/* Colonne gauche pilules + Colonne droite silhouette anatomique SVG */}
      <div className="grid grid-cols-[1fr_1.15fr] items-center gap-2">
        {/* Pilules arrondies inspirées Image 1 */}
        <div className="space-y-1.5">
          {MUSCLE_LIST.map((m) => {
            const active = isSelected(m.id);
            return (
              <motion.button
                key={m.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  toggleMuscle(m.id);
                  if (m.side === 'back') setSide('back');
                  if (m.side === 'front') setSide('front');
                }}
                className={`flex w-full items-center gap-2 rounded-full border px-2.5 py-1.5 text-left text-xs font-medium transition ${
                  active
                    ? 'border-[#C8FF00] bg-[#C8FF00]/10 text-white'
                    : 'border-white/15 bg-[#0D1016] text-slate-300'
                }`}
              >
                <span
                  className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full border ${
                    active
                      ? 'border-[#C8FF00] bg-[#C8FF00] text-black'
                      : 'border-white/30 text-transparent'
                  }`}
                >
                  <Check className="h-2.5 w-2.5 stroke-[3]" />
                </span>
                <span className="truncate text-[11px] font-semibold">{m.label}</span>
              </motion.button>
            );
          })}
        </div>

        {/* Silhouette anatomique interactive SVG */}
        <div className="flex items-center justify-center">
          <svg viewBox="0 0 180 290" className="h-[245px] w-full">
            {/* Ombre / halo discret */}
            <defs>
              <filter id="voltGlow" x="-30%" y="-30%" width="160%" height="160%">
                <feGaussianBlur stdDeviation="3.5" result="blur" />
                <feMerge>
                  <feMergeNode in="blur" />
                  <feMergeNode in="SourceGraphic" />
                </feMerge>
              </filter>
            </defs>

            {/* Tête & Cou */}
            <circle cx="90" cy="24" r="14" fill="#1F2633" stroke="rgba(255,255,255,0.18)" />
            <rect x="83" y="38" width="14" height="12" rx="4" fill="#1F2633" />

            {/* Épaules (gauche & droite) */}
            <g
              onClick={() => toggleMuscle('epaules')}
              className="cursor-pointer"
              filter={isSelected('epaules') ? 'url(#voltGlow)' : undefined}
            >
              <ellipse
                cx="56"
                cy="62"
                rx="14"
                ry="11"
                fill={muscleFill('epaules')}
                stroke={muscleStroke('epaules')}
                strokeWidth="1.5"
              />
              <ellipse
                cx="124"
                cy="62"
                rx="14"
                ry="11"
                fill={muscleFill('epaules')}
                stroke={muscleStroke('epaules')}
                strokeWidth="1.5"
              />
            </g>

            {/* Bras (biceps/triceps/avant-bras) */}
            <g
              onClick={() => toggleMuscle('bras')}
              className="cursor-pointer"
              filter={isSelected('bras') ? 'url(#voltGlow)' : undefined}
            >
              <path
                d="M44 72 L34 112 L46 116 L54 78 Z"
                fill={muscleFill('bras')}
                stroke={muscleStroke('bras')}
                strokeWidth="1.3"
              />
              <path
                d="M136 72 L146 112 L134 116 L126 78 Z"
                fill={muscleFill('bras')}
                stroke={muscleStroke('bras')}
                strokeWidth="1.3"
              />
              <path
                d="M33 116 L24 148 L36 151 L45 119 Z"
                fill={muscleFill('bras')}
                stroke={muscleStroke('bras')}
                strokeWidth="1.2"
              />
              <path
                d="M147 116 L156 148 L144 151 L135 119 Z"
                fill={muscleFill('bras')}
                stroke={muscleStroke('bras')}
                strokeWidth="1.2"
              />
            </g>

            {side === 'front' ? (
              <>
                {/* Pectoraux */}
                <g
                  onClick={() => toggleMuscle('pectoraux')}
                  className="cursor-pointer"
                  filter={isSelected('pectoraux') ? 'url(#voltGlow)' : undefined}
                >
                  <path
                    d="M64 56 Q77 54 88 60 L88 82 Q70 84 62 72 Z"
                    fill={muscleFill('pectoraux')}
                    stroke={muscleStroke('pectoraux')}
                    strokeWidth="1.5"
                  />
                  <path
                    d="M116 56 Q103 54 92 60 L92 82 Q110 84 118 72 Z"
                    fill={muscleFill('pectoraux')}
                    stroke={muscleStroke('pectoraux')}
                    strokeWidth="1.5"
                  />
                </g>

                {/* Abdos */}
                <g
                  onClick={() => toggleMuscle('abdos')}
                  className="cursor-pointer"
                  filter={isSelected('abdos') ? 'url(#voltGlow)' : undefined}
                >
                  <rect
                    x="74"
                    y="86"
                    width="14"
                    height="12"
                    rx="3"
                    fill={muscleFill('abdos')}
                    stroke={muscleStroke('abdos')}
                  />
                  <rect
                    x="92"
                    y="86"
                    width="14"
                    height="12"
                    rx="3"
                    fill={muscleFill('abdos')}
                    stroke={muscleStroke('abdos')}
                  />
                  <rect
                    x="74"
                    y="101"
                    width="14"
                    height="12"
                    rx="3"
                    fill={muscleFill('abdos')}
                    stroke={muscleStroke('abdos')}
                  />
                  <rect
                    x="92"
                    y="101"
                    width="14"
                    height="12"
                    rx="3"
                    fill={muscleFill('abdos')}
                    stroke={muscleStroke('abdos')}
                  />
                  <rect
                    x="76"
                    y="116"
                    width="12"
                    height="13"
                    rx="3"
                    fill={muscleFill('abdos')}
                    stroke={muscleStroke('abdos')}
                  />
                  <rect
                    x="92"
                    y="116"
                    width="12"
                    height="13"
                    rx="3"
                    fill={muscleFill('abdos')}
                    stroke={muscleStroke('abdos')}
                  />
                </g>
              </>
            ) : (
              /* Vue Dos : Trapèzes / Dorsaux / Lombaires */
              <g
                onClick={() => toggleMuscle('dos')}
                className="cursor-pointer"
                filter={isSelected('dos') ? 'url(#voltGlow)' : undefined}
              >
                <path
                  d="M64 54 L90 48 L116 54 L110 92 L90 126 L70 92 Z"
                  fill={muscleFill('dos')}
                  stroke={muscleStroke('dos')}
                  strokeWidth="1.6"
                />
                <line x1="90" y1="54" x2="90" y2="122" stroke="#050608" strokeWidth="2" />
              </g>
            )}

            {/* Bassin neutre */}
            <path d="M68 134 L112 134 L106 152 L74 152 Z" fill="#1F2633" />

            {/* Jambes (quadriceps / ischios / mollets) */}
            <g
              onClick={() => toggleMuscle('jambes')}
              className="cursor-pointer"
              filter={isSelected('jambes') ? 'url(#voltGlow)' : undefined}
            >
              <path
                d="M68 154 L86 154 L84 214 L64 214 Z"
                fill={muscleFill('jambes')}
                stroke={muscleStroke('jambes')}
                strokeWidth="1.5"
              />
              <path
                d="M94 154 L112 154 L116 214 L96 214 Z"
                fill={muscleFill('jambes')}
                stroke={muscleStroke('jambes')}
                strokeWidth="1.5"
              />
              <path
                d="M65 220 L83 220 L78 268 L64 268 Z"
                fill={muscleFill('jambes')}
                stroke={muscleStroke('jambes')}
                strokeWidth="1.4"
              />
              <path
                d="M97 220 L115 220 L116 268 L102 268 Z"
                fill={muscleFill('jambes')}
                stroke={muscleStroke('jambes')}
                strokeWidth="1.4"
              />
            </g>

            {/* Pieds */}
            <ellipse cx="70" cy="276" rx="10" ry="5" fill="#1F2633" />
            <ellipse cx="110" cy="276" rx="10" ry="5" fill="#1F2633" />
          </svg>
        </div>
      </div>
    </div>
  );
}
