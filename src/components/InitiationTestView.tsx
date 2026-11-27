import { useEffect, useState, type ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, Lock, Minus, Pause, Play, Plus } from './DekIcons';
import { INITIAL_COACHS } from '../data/mockData';
import type { CardioLevel, FitnessGoal, InitiationResult, MuscleGroup } from '../types/dek';
import {
  evaluateInitiation,
  getTierIndex,
  TIER_COLORS,
  TIER_ORDER,
  TIER_REQUIREMENTS,
} from '../utils/categorization';
import { FITNESS_GOALS, getAdventurePlan } from '../utils/programsAndNutrition';
import { playGo, playHit, playVictory } from '../utils/soundFx';
import { ExerciseDemoCanvas } from './ExerciseDemoCanvas';
import { TargetMuscleSelector } from './TargetMuscleSelector';
import { StepFooter } from './ui/Pickers';
import { Button, Card, StatTiles } from './ui/kit';

interface InitiationTestViewProps {
  userName: string;
  isRetake?: boolean;
  onCancelRetake?: () => void;
  onComplete: (result: InitiationResult) => void;
}

import { Slot3D } from './ui/Slot3D';
import { Dumbbell, Fire, Heart, Sunrise, Trophy } from './DekIcons';

const GOAL_IMG: Record<string, string> = {
  perte_poids: 'objectif-perte',
  prise_muscle: 'objectif-muscle',
  endurance_5am: 'objectif-endurance',
  foot_sante: 'objectif-foot',
  remise_forme: 'objectif-forme',
};

const GOAL_ICONS: Record<string, React.ReactNode> = {
  perte_poids: <Fire />,
  prise_muscle: <Dumbbell />,
  endurance_5am: <Sunrise />,
  foot_sante: <Trophy />,
  remise_forme: <Heart />,
};

const CARDIO_OPTIONS: { id: CardioLevel; title: string; subtitle: string }[] = [
  { id: 'marche', title: 'Débutant', subtitle: '< 2 km' },
  { id: '3km', title: '3 km', subtitle: 'Amateur' },
  { id: '5km', title: '5 km', subtitle: 'Standard' },
  { id: '10km_plus', title: '10 km+', subtitle: 'Pro / Expert' },
];

const STEP_ANIM = {
  initial: { opacity: 0, x: 24 },
  animate: { opacity: 1, x: 0 },
  exit: { opacity: 0, x: -24 },
  transition: { type: 'spring' as const, stiffness: 340, damping: 32 },
};

function StepTitle({ title, sub }: { title: string; sub?: ReactNode }) {
  return (
    <div className="text-center">
      <h2 className="text-[26px] font-bold leading-8 text-fg">{title}</h2>
      {sub && <p className="mt-1 text-[14px] font-medium leading-5 text-mute">{sub}</p>}
    </div>
  );
}

/** Compteur géant avec boutons −/+ ronds. */
function BigCounter({
  value,
  label,
  onMinus,
  onPlus,
  unitLabel,
}: {
  value: number;
  label: string;
  onMinus: () => void;
  onPlus: () => void;
  unitLabel: string;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <motion.button
        whileTap={{ scale: 0.9 }}
        type="button"
        onClick={onMinus}
        aria-label={`Retirer ${unitLabel}`}
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-tile text-fg"
      >
        <Minus weight="bold" className="h-6 w-6" />
      </motion.button>
      <div className="min-w-0 text-center">
        <div className="num text-[88px] font-extrabold leading-none text-lime">{value}</div>
        <div className="mt-2 text-[14px] font-medium text-mute">{label}</div>
      </div>
      <motion.button
        whileTap={{ scale: 0.9 }}
        type="button"
        onClick={onPlus}
        aria-label={`Ajouter ${unitLabel}`}
        className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-tile text-fg"
      >
        <Plus weight="bold" className="h-6 w-6" />
      </motion.button>
    </div>
  );
}

export function InitiationTestView({
  userName,
  isRetake = false,
  onCancelRetake,
  onComplete,
}: InitiationTestViewProps) {
  // 1: Objectifs, 2: Muscles, 3: Pompes, 4: Squats, 5: Gainage+Cardio, 6: Bilan
  const [step, setStep] = useState<1 | 2 | 3 | 4 | 5 | 6>(1);

  const [goals, setGoals] = useState<FitnessGoal[]>(['endurance_5am']);
  const [targetMuscles, setTargetMuscles] = useState<MuscleGroup[]>(['pectoraux', 'abdos', 'jambes']);

  const [pushups, setPushups] = useState(8);
  const [squats, setSquats] = useState(14);
  const [plankSec, setPlankSec] = useState(30);
  const [plankRunning, setPlankRunning] = useState(false);
  const [cardioLevel, setCardioLevel] = useState<CardioLevel>('3km');

  useEffect(() => {
    if (!plankRunning) return;
    const id = setInterval(() => {
      setPlankSec((s) => Math.min(300, s + 1));
    }, 1000);
    return () => clearInterval(id);
  }, [plankRunning]);

  const toggleGoal = (id: FitnessGoal) => {
    setGoals((prev) => {
      if (prev.includes(id)) {
        return prev.length > 1 ? prev.filter((g) => g !== id) : prev;
      }
      if (prev.length >= 3) {
        return [...prev.slice(1), id];
      }
      return [...prev, id];
    });
  };

  const evaluation = evaluateInitiation(pushups, squats, plankSec, cardioLevel);
  const adventure = getAdventurePlan(goals, evaluation.category);
  const recommendedCoach =
    INITIAL_COACHS.find((c) => c.id === adventure.recommendedCoachId) ?? INITIAL_COACHS[0];

  const goToStep = (next: 1 | 2 | 3 | 4 | 5 | 6) => {
    setPlankRunning(false);
    if (next === 3) playGo();
    if (next === 6) playVictory();
    setStep(next);
  };

  const handleFinish = () => {
    onComplete({
      pushups,
      squats,
      plankSec,
      cardioLevel,
      assignedCategory: evaluation.category,
      goals,
      targetMuscles,
      completedAt: new Date().toISOString(),
    });
  };

  const stepProgress = step === 6 ? 100 : Math.round((step / 5) * 100);
  const showBack = step < 6 && (step > 1 || (isRetake && !!onCancelRetake));
  const goBack = () => {
    if (step > 1) goToStep((step - 1) as 1 | 2 | 3 | 4 | 5);
    else if (onCancelRetake) onCancelRetake();
  };

  const footers: Record<1 | 2 | 3 | 4 | 5, { label: string; to: 2 | 3 | 4 | 5 | 6 }> = {
    1: { label: 'Continuer · zones cibles', to: 2 },
    2: { label: 'Lancer les défis d’intro (sans quota)', to: 3 },
    3: { label: 'Suivant · squats', to: 4 },
    4: { label: 'Suivant · gainage & souffle', to: 5 },
    5: { label: 'Voir mon programme & mon coach', to: 6 },
  };

  const nextTier = TIER_ORDER[Math.min(3, getTierIndex(evaluation.category) + 1)];

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-ink text-fg">
      {/* En-tête : progression fine */}
      <div className="shrink-0 px-5 pb-1 pt-4">
        <div className="h-1 overflow-hidden rounded-full bg-rim">
          <motion.div
            animate={{ width: `${stepProgress}%` }}
            transition={{ duration: 0.3 }}
            className="h-full rounded-full bg-lime"
          />
        </div>
        <div className="mt-2.5 flex items-center justify-between text-[12px] font-medium">
          <span className="truncate text-mute">Initiation DEK · {userName}</span>
          <span className="flex shrink-0 items-center gap-3">
            <span className="text-lime">Sans quota</span>
            <span className="num text-faint">{step === 6 ? 'Bilan' : `${step}/5`}</span>
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto px-5 pb-4 pt-5">
        <AnimatePresence mode="wait">
          {/* ÉTAPE 1 : OBJECTIFS */}
          {step === 1 && (
            <motion.div key="init-goals" {...STEP_ANIM}>
              <StepTitle
                title="Quels sont tes objectifs ?"
                sub="Choisis 1 à 3 objectifs : DEK adapte ton aventure, ta nutrition et ton coach."
              />
              <div className="mt-6 flex flex-col items-stretch">
                {FITNESS_GOALS.map((g) => {
                  const active = goals.includes(g.id);
                  return (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => toggleGoal(g.id)}
                      aria-pressed={active}
                      className={`flex items-center gap-4 rounded-[24px] border-2 px-3 py-3 text-left transition-colors ${
                        active ? 'border-lime bg-card' : 'border-transparent'
                      }`}
                    >
                      <Slot3D name={GOAL_IMG[g.id]} icon={GOAL_ICONS[g.id]} tone={active ? 'lime' : 'dark'} className="h-16 w-16" />
                      <div className="min-w-0 flex-1">
                        <div className={`font-bold transition-all ${active ? 'text-[20px] leading-6 text-fg' : 'text-[17px] leading-6 text-faint'}`}>
                          {g.label}
                        </div>
                        <div className={`text-[13px] font-medium leading-[18px] ${active ? 'text-mute' : 'text-faint'}`}>
                          {g.subtitle}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          )}

          {/* ÉTAPE 2 : ZONES MUSCULAIRES */}
          {step === 2 && (
            <motion.div key="init-muscles" {...STEP_ANIM} className="space-y-5">
              <StepTitle title="Zones à renforcer" sub="Sélectionne tes priorités directement sur la silhouette." />
              <TargetMuscleSelector selected={targetMuscles} onChange={setTargetMuscles} />
            </motion.div>
          )}

          {/* ÉTAPE 3 : POMPES */}
          {step === 3 && (
            <motion.div key="init-pompes" {...STEP_ANIM} className="space-y-5">
              <StepTitle
                title="Combien de pompes ?"
                sub="Sécurité : genoux au sol acceptés. Stoppe si le dos se creuse (aucun minimum)."
              />
              <ExerciseDemoCanvas exercise="pompes" compact />
              <BigCounter
                value={pushups}
                label="pompes réalisées"
                unitLabel="une pompe"
                onMinus={() => setPushups((p) => Math.max(0, p - 1))}
                onPlus={() => {
                  playHit();
                  setPushups((p) => Math.min(60, p + 1));
                }}
              />
              <input
                type="range"
                min={0}
                max={60}
                value={pushups}
                onChange={(e) => setPushups(Number(e.target.value))}
                aria-label="Nombre de pompes"
                className="w-full accent-lime"
              />
            </motion.div>
          )}

          {/* ÉTAPE 4 : SQUATS */}
          {step === 4 && (
            <motion.div key="init-squats" {...STEP_ANIM} className="space-y-5">
              <StepTitle
                title="Combien de squats ?"
                sub="Sécurité : talons au sol, genoux dans l’axe des pieds. Respire à chaque montée."
              />
              <ExerciseDemoCanvas exercise="squats" compact />
              <BigCounter
                value={squats}
                label="squats réalisés"
                unitLabel="un squat"
                onMinus={() => setSquats((s) => Math.max(0, s - 1))}
                onPlus={() => {
                  playHit();
                  setSquats((s) => Math.min(80, s + 1));
                }}
              />
              <input
                type="range"
                min={0}
                max={80}
                value={squats}
                onChange={(e) => setSquats(Number(e.target.value))}
                aria-label="Nombre de squats"
                className="w-full accent-lime"
              />
            </motion.div>
          )}

          {/* ÉTAPE 5 : GAINAGE + ENDURANCE */}
          {step === 5 && (
            <motion.div key="init-gainage" {...STEP_ANIM} className="space-y-5">
              <StepTitle title="Gainage & souffle" sub="Tiens la planche le plus longtemps possible." />
              <ExerciseDemoCanvas exercise="gainage" compact />

              <div className="text-center">
                <div className="text-[13px] font-medium text-mute">Gainage tenu</div>
                <div className="num text-[72px] font-extrabold leading-none text-lime">
                  {String(Math.floor(plankSec / 60)).padStart(2, '0')}:{String(plankSec % 60).padStart(2, '0')}
                </div>
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  type="button"
                  onClick={() => setPlankRunning((r) => !r)}
                  className={`mt-4 inline-flex h-11 items-center gap-2 rounded-full px-6 text-[15px] font-bold ${
                    plankRunning ? 'bg-danger text-fg' : 'bg-tile text-fg'
                  }`}
                >
                  {plankRunning ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  {plankRunning ? 'Stop' : 'Chrono'}
                </motion.button>
                <input
                  type="range"
                  min={0}
                  max={180}
                  value={plankSec}
                  onChange={(e) => setPlankSec(Number(e.target.value))}
                  aria-label="Durée du gainage"
                  className="mt-4 w-full accent-lime"
                />
              </div>

              <Card>
                <div className="mb-3 text-center text-[15px] font-bold leading-5 text-fg">
                  Ton niveau d’endurance course sans souffrir :
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {CARDIO_OPTIONS.map((opt) => {
                    const active = cardioLevel === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCardioLevel(opt.id)}
                        aria-pressed={active}
                        className={`rounded-[20px] px-1 py-3 text-center transition-colors ${
                          active ? 'bg-lime text-on-lime' : 'bg-tile text-fg'
                        }`}
                      >
                        <div className="text-[13px] font-bold leading-4">{opt.title}</div>
                        <div className={`mt-0.5 text-[11px] font-medium leading-4 ${active ? 'text-on-lime' : 'text-mute'}`}>
                          {opt.subtitle}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </Card>
            </motion.div>
          )}

          {/* ÉTAPE 6 : BILAN */}
          {step === 6 && (
            <motion.div
              key="init-result"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <StepTitle title="Ton bilan" sub={evaluation.safetyNote} />

              <Card className="text-center">
                <span className="text-[12px] font-medium text-mute">Catégorie officielle DEK</span>
                <div className="mt-1 flex items-center justify-center gap-3">
                  <span
                    className="h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: TIER_COLORS[evaluation.category] }}
                    aria-hidden="true"
                  />
                  <span className="text-[34px] font-extrabold leading-10 tracking-tight text-fg">
                    {evaluation.category}
                  </span>
                </div>
                <StatTiles
                  className="mt-4"
                  items={[
                    { label: 'Pompes', value: pushups },
                    { label: 'Squats', value: squats },
                    { label: 'Gainage', value: plankSec, unit: 's' },
                  ]}
                />
              </Card>

              <Card>
                <div className="flex items-baseline justify-between gap-3">
                  <span className="text-[16px] font-bold leading-6 text-fg">{adventure.title}</span>
                  <span className="shrink-0 text-[12px] font-medium text-mute">{adventure.durationLabel}</span>
                </div>

                <div className="mt-3 flex items-center gap-3 rounded-[20px] bg-tile p-3">
                  <div
                    className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-[14px] font-bold text-on-lime"
                    style={{ backgroundColor: recommendedCoach.accent }}
                  >
                    {recommendedCoach.avatarInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-[15px] font-bold leading-5 text-fg">{recommendedCoach.name}</div>
                    <p className="truncate text-[12px] font-medium text-mute">{recommendedCoach.specialty}</p>
                  </div>
                </div>
                <p className="mt-3 text-[13px] font-medium leading-5 text-mute">« {adventure.coachAdvice} »</p>
              </Card>

              <div className="grid grid-cols-4 gap-2">
                {TIER_ORDER.map((tier) => {
                  const unlocked = getTierIndex(tier) <= getTierIndex(evaluation.category);
                  return (
                    <div
                      key={tier}
                      className={`rounded-[20px] py-3 text-center ${unlocked ? 'bg-tile' : 'bg-card'}`}
                    >
                      <div
                        className="text-[12px] font-bold"
                        style={{ color: unlocked ? TIER_COLORS[tier] : undefined }}
                      >
                        <span className={unlocked ? '' : 'text-faint'}>{tier}</span>
                      </div>
                      <div className="mt-1.5 flex justify-center">
                        {unlocked ? <Check className="h-4 w-4 text-fg" /> : <Lock className="h-4 w-4 text-faint" />}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-center text-[12px] font-medium leading-4 text-mute">
                Pour débloquer {nextTier} : {TIER_REQUIREMENTS[nextTier].missionRule}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Pied : retour + action */}
      <div className="shrink-0 px-5 pb-6 pt-2">
        {step === 6 ? (
          <Button fullWidth trailingArrow onClick={handleFinish}>
            Entrer dans mon aventure DEK
          </Button>
        ) : (
          <StepFooter
            showBack={showBack}
            onBack={goBack}
            onNext={() => goToStep(footers[step].to)}
            nextLabel={footers[step].label}
          />
        )}
      </div>
    </div>
  );
}
