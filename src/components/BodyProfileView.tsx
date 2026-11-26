import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, CaretLeft, GenderFemale, GenderMale } from './DekIcons';
import type { BodyProfile, Sex } from '../types/dek';
import { RulerPicker, WheelPicker } from './ui/Pickers';

// Profil physique en 4 écrans (sexe, âge, poids, taille), inspiré des onboardings fitness :
// sert à calibrer calories, hydratation et estimation des kcal brûlées.

const STEPS = [
  { title: 'Parle-nous de toi', sub: 'Pour adapter ton programme et tes calories' },
  { title: 'Quel âge as-tu ?', sub: 'Ton cœur et ta récupération en dépendent' },
  { title: 'Quel est ton poids ?', sub: 'Modifiable à tout moment dans ton profil' },
  { title: 'Quelle est ta taille ?', sub: 'Dernière étape avant ton test d’initiation' },
];

export function BodyProfileView({
  initial,
  onComplete,
  onSkip,
}: {
  initial?: BodyProfile;
  onComplete: (body: BodyProfile) => void;
  onSkip: () => void;
}) {
  const [step, setStep] = useState(0);
  const [sex, setSex] = useState<Sex | null>(initial?.sex ?? null);
  const [age, setAge] = useState(initial?.age ?? 26);
  const [weight, setWeight] = useState(initial?.weightKg ?? 72);
  const [height, setHeight] = useState(initial?.heightCm ?? 175);

  const canNext = step !== 0 || sex !== null;
  const next = () => {
    if (!canNext) return;
    if (step < STEPS.length - 1) setStep(step + 1);
    else onComplete({ sex: sex ?? 'homme', age, weightKg: weight, heightCm: height });
  };

  return (
    <div className="flex h-full w-full flex-col bg-[#080A0E] px-5 pb-6 pt-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full bg-[#C8FF00]"
                animate={{ width: i <= step ? '100%' : '0%' }}
                transition={{ duration: 0.35 }}
              />
            </div>
          ))}
        </div>
        <button onClick={onSkip} className="ml-3 text-[11px] font-semibold text-slate-400 hover:text-white">
          Passer
        </button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={step}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ type: 'spring', stiffness: 340, damping: 32 }}
          className="flex flex-1 flex-col"
        >
          <div className="mt-8 text-center">
            <h1 className="font-hud text-2xl font-bold text-white">{STEPS[step].title}</h1>
            <p className="mt-1 text-xs text-slate-400">{STEPS[step].sub}</p>
          </div>

          <div className="flex flex-1 flex-col items-center justify-center">
            {step === 0 && (
              <div className="flex flex-col items-center gap-5">
                {(
                  [
                    { id: 'homme', label: 'Homme', Icon: GenderMale },
                    { id: 'femme', label: 'Femme', Icon: GenderFemale },
                  ] as const
                ).map(({ id, label, Icon }) => {
                  const active = sex === id;
                  return (
                    <motion.button
                      key={id}
                      whileTap={{ scale: 0.92 }}
                      onClick={() => setSex(id)}
                      aria-pressed={active}
                      animate={{ scale: active ? 1.06 : 1 }}
                      className={`flex h-32 w-32 flex-col items-center justify-center rounded-full transition-colors ${
                        active
                          ? 'bg-[#C8FF00] text-black shadow-[0_0_40px_-6px_#C8FF00]'
                          : 'bg-[#1A1F2A] text-slate-300'
                      }`}
                    >
                      <Icon weight={active ? 'bold' : 'regular'} className="h-11 w-11" />
                      <span className="font-hud mt-1 text-xs font-bold">{label}</span>
                    </motion.button>
                  );
                })}
              </div>
            )}
            {step === 1 && <WheelPicker min={14} max={80} value={age} onChange={setAge} suffix="ans" />}
            {step === 2 && (
              <div className="w-full">
                <RulerPicker min={35} max={160} value={weight} onChange={setWeight} unit="kg" />
              </div>
            )}
            {step === 3 && (
              <div className="w-full">
                <RulerPicker min={130} max={215} value={height} onChange={setHeight} unit="cm" />
                <p className="mt-4 text-center text-[11px] text-slate-400">
                  IMC estimé :{' '}
                  <strong className="text-white">{(weight / (height / 100) ** 2).toFixed(1)}</strong>
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex items-center justify-between">
        <button
          onClick={() => setStep((s) => Math.max(0, s - 1))}
          disabled={step === 0}
          aria-label="Étape précédente"
          className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1A1F2A] text-white transition disabled:opacity-0"
        >
          <CaretLeft weight="bold" className="h-5 w-5" />
        </button>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={next}
          disabled={!canNext}
          className="font-hud flex items-center gap-2 rounded-full bg-[#C8FF00] px-6 py-3.5 text-xs font-bold text-black transition disabled:bg-white/10 disabled:text-slate-500"
        >
          {step === STEPS.length - 1 ? 'Valider' : 'Suivant'}
          <ArrowRight weight="bold" className="h-4 w-4" />
        </motion.button>
      </div>
    </div>
  );
}
