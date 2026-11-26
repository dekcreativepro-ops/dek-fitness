import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { GenderFemale, GenderMale } from './DekIcons';
import type { BodyProfile, Sex } from '../types/dek';
import { RulerPicker, StepFooter, WheelPicker } from './ui/Pickers';

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
    <div className="flex h-full w-full flex-col bg-ink px-5 pb-6 pt-5">
      <div className="flex items-center justify-between">
        <div className="flex flex-1 gap-1">
          {STEPS.map((_, i) => (
            <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-rim">
              <motion.div
                className="h-full rounded-full bg-lime"
                animate={{ width: i <= step ? '100%' : '0%' }}
                transition={{ duration: 0.35 }}
              />
            </div>
          ))}
        </div>
        <button onClick={onSkip} className="ml-4 text-[13px] font-semibold text-mute transition active:opacity-70">
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
          className="flex min-h-0 flex-1 flex-col"
        >
          <div className="mt-8 text-center">
            <h1 className="text-[26px] font-bold leading-8 text-fg">{STEPS[step].title}</h1>
            <p className="mt-1 text-[14px] font-medium leading-5 text-mute">{STEPS[step].sub}</p>
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
                      type="button"
                      whileTap={{ scale: 0.94 }}
                      onClick={() => setSex(id)}
                      aria-pressed={active}
                      className={`flex h-36 w-36 flex-col items-center justify-center gap-1 rounded-full transition-colors ${
                        active ? 'bg-lime text-on-lime' : 'bg-tile text-mute'
                      }`}
                    >
                      <Icon weight={active ? 'bold' : 'regular'} className="h-14 w-14" />
                      <span className="text-[14px] font-bold">{label}</span>
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
                <p className="mt-5 text-center text-[13px] font-medium text-mute">
                  IMC estimé :{' '}
                  <strong className="num font-bold text-fg">{(weight / (height / 100) ** 2).toFixed(1)}</strong>
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <StepFooter
        showBack={step > 0}
        onBack={() => setStep((s) => Math.max(0, s - 1))}
        onNext={next}
        nextDisabled={!canNext}
        nextLabel={step === STEPS.length - 1 ? 'Valider' : 'Suivant'}
      />
    </div>
  );
}
