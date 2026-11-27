import { useState } from 'react';
import { motion } from 'framer-motion';
import { Check } from './DekIcons';
import type { MuscleGroup } from '../types/dek';
import { BodyFigure } from './ui/BodyFigure';

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
          <BodyFigure view={side} level={(m) => (isSelected(m) ? 2 : 0)} onToggle={toggleMuscle} className="h-[270px] w-auto" />
        </div>
      </div>
    </div>
  );
}
