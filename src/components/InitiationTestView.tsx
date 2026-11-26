import { useEffect, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowRight,
  Award,
  Check,
  CheckCircle2,
  ChevronLeft,
  Dumbbell,
  Flame,
  Heart,
  Lock,
  Minus,
  Play,
  Plus,
  ShieldCheck,
  Square,
  Sunrise,
  Trophy,
  Unlock,
} from 'lucide-react';
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

interface InitiationTestViewProps {
  userName: string;
  isRetake?: boolean;
  onCancelRetake?: () => void;
  onComplete: (result: InitiationResult) => void;
}

const CARDIO_OPTIONS: { id: CardioLevel; title: string; subtitle: string }[] = [
  { id: 'marche', title: 'Débutant', subtitle: '< 2 km' },
  { id: '3km', title: '3 km', subtitle: 'Amateur' },
  { id: '5km', title: '5 km', subtitle: 'Standard' },
  { id: '10km_plus', title: '10 km+', subtitle: 'Pro / Expert' },
];

function GoalIcon({ name }: { name: 'flame' | 'dumbbell' | 'sunrise' | 'trophy' | 'heart' }) {
  if (name === 'flame') return <Flame className="h-4 w-4" />;
  if (name === 'dumbbell') return <Dumbbell className="h-4 w-4" />;
  if (name === 'sunrise') return <Sunrise className="h-4 w-4" />;
  if (name === 'trophy') return <Trophy className="h-4 w-4" />;
  return <Heart className="h-4 w-4" />;
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

  return (
    <div className="flex h-full w-full flex-col overflow-hidden bg-[#080A0E] text-slate-100">
      {/* En-tête épuré */}
      <div className="shrink-0 border-b border-white/10 bg-[#0B0E14] px-4 pb-2.5 pt-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            {(step > 1 && step < 6) || (isRetake && onCancelRetake && step < 6) ? (
              <button
                onClick={() => {
                  if (step > 1) {
                    goToStep((step - 1) as 1 | 2 | 3 | 4 | 5);
                  } else if (onCancelRetake) {
                    onCancelRetake();
                  }
                }}
                className="rounded-lg border border-white/10 bg-white/5 p-1 text-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
            ) : null}
            <span className="font-hud text-xs font-bold tracking-wider text-white">
              INITIATION DEK • {userName.toUpperCase()}
            </span>
          </div>

          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
            <ShieldCheck className="h-3 w-3" /> SANS QUOTA
          </span>
        </div>

        <div className="mt-2 flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/10">
            <motion.div
              animate={{ width: `${stepProgress}%` }}
              transition={{ duration: 0.3 }}
              className="h-full rounded-full bg-[#C8FF00]"
            />
          </div>
          <span className="font-hud text-[10px] font-bold text-slate-400">
            {step === 6 ? 'BILAN' : `${step}/5`}
          </span>
        </div>
      </div>

      {/* Contenu */}
      <div className="no-scrollbar flex-1 overflow-y-auto px-4 pb-6 pt-3.5">
        <AnimatePresence mode="wait">
          {/* ÉTAPE 1 : REGISTRE D'OBJECTIFS */}
          {step === 1 && (
            <motion.div
              key="init-goals"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              className="space-y-3"
            >
              <div>
                <h2 className="font-hud text-xl font-bold text-white">TES OBJECTIFS</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Coche 1 à 3 objectifs : DEK adapte ton aventure, ta nutrition et ton coach.
                </p>
              </div>

              <div className="space-y-2">
                {FITNESS_GOALS.map((g) => {
                  const active = goals.includes(g.id);
                  return (
                    <motion.button
                      key={g.id}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => toggleGoal(g.id)}
                      className={`flex w-full items-center justify-between rounded-2xl border p-3 text-left transition ${
                        active
                          ? 'border-[#C8FF00] bg-[#C8FF00]/10'
                          : 'border-white/10 bg-[#11151D]'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${
                            active
                              ? 'bg-[#C8FF00] text-black'
                              : 'bg-white/5 text-slate-300'
                          }`}
                        >
                          <GoalIcon name={g.iconName} />
                        </div>
                        <div>
                          <div className="font-hud text-xs font-bold text-white">{g.label}</div>
                          <div className="text-[11px] text-slate-400">{g.subtitle}</div>
                        </div>
                      </div>
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                          active
                            ? 'border-[#C8FF00] bg-[#C8FF00] text-black'
                            : 'border-white/25 text-transparent'
                        }`}
                      >
                        <Check className="h-3 w-3 stroke-[3]" />
                      </span>
                    </motion.button>
                  );
                })}
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => goToStep(2)}
                className="font-hud flex w-full items-center justify-center gap-2 rounded-full bg-[#C8FF00] py-3.5 text-xs font-bold text-black"
              >
                CONTINUER • ZONES CIBLES
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          )}

          {/* ÉTAPE 2 : SÉLECTEUR DE ZONES MUSCULAIRES (IMAGE 1) */}
          {step === 2 && (
            <motion.div
              key="init-muscles"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              className="space-y-3"
            >
              <div>
                <h2 className="font-hud text-xl font-bold text-white">ZONES À RENFORCER</h2>
                <p className="mt-0.5 text-xs text-slate-400">
                  Sélectionne tes priorités directement sur la silhouette.
                </p>
              </div>

              <TargetMuscleSelector selected={targetMuscles} onChange={setTargetMuscles} />

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => goToStep(3)}
                className="font-hud flex w-full items-center justify-center gap-2 rounded-full bg-[#C8FF00] py-3.5 text-xs font-bold text-black"
              >
                LANCER LES DÉFIS D’INTRO (SANS QUOTA)
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          )}

          {/* ÉTAPE 3 : DÉFI INTRO 1 - POMPES + DÉMO ANIMÉE */}
          {step === 3 && (
            <motion.div
              key="init-pompes"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              className="space-y-3"
            >
              <ExerciseDemoCanvas exercise="pompes" compact />

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-[11px] text-emerald-200">
                <strong>Sécurité :</strong> Genoux au sol acceptés. Stoppe si le dos se creuse (aucun
                minimum).
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#11151D] p-3.5 text-center">
                <div className="font-hud text-5xl font-bold text-[#C8FF00]">{pushups}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  pompes réalisées
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={() => setPushups((p) => Math.max(0, p - 1))}
                    className="flex h-11 w-14 items-center justify-center rounded-2xl border border-white/15 bg-[#181E29] text-slate-200"
                  >
                    <Minus className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    onClick={() => {
                      playHit();
                      setPushups((p) => Math.min(60, p + 1));
                    }}
                    className="font-hud flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#C8FF00] text-sm font-bold text-black"
                  >
                    <Plus className="h-4 w-4" /> +1 POMPE
                  </motion.button>
                </div>

                <input
                  type="range"
                  min={0}
                  max={60}
                  value={pushups}
                  onChange={(e) => setPushups(Number(e.target.value))}
                  className="mt-3 w-full accent-[#C8FF00]"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => goToStep(4)}
                className="font-hud flex w-full items-center justify-center gap-2 rounded-full bg-[#C8FF00] py-3.5 text-xs font-bold text-black"
              >
                SUIVANT • SQUATS
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          )}

          {/* ÉTAPE 4 : DÉFI INTRO 2 - SQUATS + DÉMO ANIMÉE */}
          {step === 4 && (
            <motion.div
              key="init-squats"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              className="space-y-3"
            >
              <ExerciseDemoCanvas exercise="squats" compact />

              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/8 px-3 py-2 text-[11px] text-emerald-200">
                <strong>Sécurité :</strong> Talons au sol, genoux dans l’axe des pieds. Respire à
                chaque montée.
              </div>

              <div className="rounded-3xl border border-white/10 bg-[#11151D] p-3.5 text-center">
                <div className="font-hud text-5xl font-bold text-[#C8FF00]">{squats}</div>
                <div className="text-[10px] uppercase tracking-wider text-slate-400">
                  squats réalisés
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <motion.button
                    whileTap={{ scale: 0.92 }}
                    type="button"
                    onClick={() => setSquats((s) => Math.max(0, s - 1))}
                    className="flex h-11 w-14 items-center justify-center rounded-2xl border border-white/15 bg-[#181E29] text-slate-200"
                  >
                    <Minus className="h-4 w-4" />
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    onClick={() => {
                      playHit();
                      setSquats((s) => Math.min(80, s + 1));
                    }}
                    className="font-hud flex h-11 flex-1 items-center justify-center gap-1.5 rounded-2xl bg-[#C8FF00] text-sm font-bold text-black"
                  >
                    <Plus className="h-4 w-4" /> +1 SQUAT
                  </motion.button>
                </div>

                <input
                  type="range"
                  min={0}
                  max={80}
                  value={squats}
                  onChange={(e) => setSquats(Number(e.target.value))}
                  className="mt-3 w-full accent-[#C8FF00]"
                />
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => goToStep(5)}
                className="font-hud flex w-full items-center justify-center gap-2 rounded-full bg-[#C8FF00] py-3.5 text-xs font-bold text-black"
              >
                SUIVANT • GAINAGE & SOUFFLE
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          )}

          {/* ÉTAPE 5 : GAINAGE + ENDURANCE */}
          {step === 5 && (
            <motion.div
              key="init-gainage"
              initial={{ opacity: 0, x: 14 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -14 }}
              className="space-y-3"
            >
              <ExerciseDemoCanvas exercise="gainage" compact />

              <div className="rounded-2xl border border-white/10 bg-[#11151D] p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] text-slate-400">Gainage tenu</div>
                    <div className="font-hud text-2xl font-bold text-[#C8FF00]">
                      {String(Math.floor(plankSec / 60)).padStart(2, '0')}:
                      {String(plankSec % 60).padStart(2, '0')}
                    </div>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    type="button"
                    onClick={() => setPlankRunning((r) => !r)}
                    className={`font-hud flex items-center gap-1.5 rounded-xl px-3.5 py-2 text-xs font-bold ${
                      plankRunning ? 'bg-[#FF2E54] text-white' : 'bg-[#C8FF00] text-black'
                    }`}
                  >
                    {plankRunning ? (
                      <>
                        <Square className="h-3.5 w-3.5 fill-white" /> Stop
                      </>
                    ) : (
                      <>
                        <Play className="h-3.5 w-3.5 fill-black" /> Chrono
                      </>
                    )}
                  </motion.button>
                </div>
                <input
                  type="range"
                  min={0}
                  max={180}
                  value={plankSec}
                  onChange={(e) => setPlankSec(Number(e.target.value))}
                  className="mt-2.5 w-full accent-[#C8FF00]"
                />
              </div>

              <div className="rounded-2xl border border-white/10 bg-[#11151D] p-3">
                <div className="mb-2 text-[11px] font-bold text-white">
                  Ton niveau d’endurance course sans souffrir :
                </div>
                <div className="grid grid-cols-4 gap-1.5">
                  {CARDIO_OPTIONS.map((opt) => {
                    const active = cardioLevel === opt.id;
                    return (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setCardioLevel(opt.id)}
                        className={`rounded-xl border p-2 text-center transition ${
                          active
                            ? 'border-[#C8FF00] bg-[#C8FF00]/15'
                            : 'border-white/10 bg-[#0B0E14]'
                        }`}
                      >
                        <div
                          className={`font-hud text-[11px] font-bold ${
                            active ? 'text-[#C8FF00]' : 'text-white'
                          }`}
                        >
                          {opt.title}
                        </div>
                        <div className="text-[9px] text-slate-400">{opt.subtitle}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={() => goToStep(6)}
                className="font-hud flex w-full items-center justify-center gap-2 rounded-full bg-[#C8FF00] py-3.5 text-xs font-bold text-black"
              >
                VOIR MON PROGRAMME & MON COACH
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          )}

          {/* ÉTAPE 6 : BILAN + AVENTURE + VRAI COACH + PALIERS */}
          {step === 6 && (
            <motion.div
              key="init-result"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-3"
            >
              {/* Catégorie officielle */}
              <div className="rounded-3xl border border-white/15 bg-gradient-to-br from-[#182030] to-[#0B0E14] p-4 text-center">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">
                  Catégorie officielle DEK
                </span>
                <div
                  className="font-hud mt-1 text-3xl font-black uppercase"
                  style={{ color: TIER_COLORS[evaluation.category] }}
                >
                  {evaluation.category}
                </div>
                <p className="mt-1 text-[11px] text-slate-300">{evaluation.safetyNote}</p>
              </div>

              {/* Aventure & Vrai Coach assigné */}
              <div className="rounded-2xl border border-[#C8FF00]/30 bg-[#11151D] p-3.5">
                <div className="flex items-center justify-between">
                  <span className="font-hud text-xs font-bold text-[#C8FF00]">
                    {adventure.title}
                  </span>
                  <span className="text-[10px] text-slate-400">{adventure.durationLabel}</span>
                </div>

                <div className="mt-2.5 flex items-center gap-3 rounded-xl border border-white/5 bg-[#0B0E14] p-2.5">
                  <div
                    className="font-hud flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-xs font-bold text-black"
                    style={{ backgroundColor: recommendedCoach.accent }}
                  >
                    {recommendedCoach.avatarInitials}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <Award className="h-3.5 w-3.5 text-[#00E5FF]" />
                      <span className="font-hud truncate text-xs font-bold text-white">
                        {recommendedCoach.name}
                      </span>
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-[#00E5FF]" />
                    </div>
                    <p className="truncate text-[10px] text-slate-400">
                      {recommendedCoach.specialty}
                    </p>
                  </div>
                </div>
                <p className="mt-2 text-[11px] leading-relaxed text-slate-300">
                  « {adventure.coachAdvice} »
                </p>
              </div>

              {/* Paliers débloqués / verrouillés compact */}
              <div className="grid grid-cols-4 gap-1.5">
                {TIER_ORDER.map((tier) => {
                  const unlocked = getTierIndex(tier) <= getTierIndex(evaluation.category);
                  return (
                    <div
                      key={tier}
                      className={`rounded-xl border p-2 text-center ${
                        unlocked
                          ? 'border-emerald-500/30 bg-emerald-500/10'
                          : 'border-white/5 bg-[#0B0E14] opacity-65'
                      }`}
                    >
                      <div
                        className="font-hud text-[10px] font-bold"
                        style={{ color: TIER_COLORS[tier] }}
                      >
                        {tier}
                      </div>
                      <div className="mt-1 flex justify-center">
                        {unlocked ? (
                          <Unlock className="h-3.5 w-3.5 text-emerald-400" />
                        ) : (
                          <Lock className="h-3.5 w-3.5 text-slate-500" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="text-[10px] text-center text-slate-400">
                Pour débloquer {TIER_ORDER[Math.min(3, getTierIndex(evaluation.category) + 1)]} :{' '}
                {TIER_REQUIREMENTS[TIER_ORDER[Math.min(3, getTierIndex(evaluation.category) + 1)]].missionRule}
              </div>

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleFinish}
                className="font-hud flex w-full items-center justify-center gap-2 rounded-full bg-[#C8FF00] py-3.5 text-xs font-bold tracking-wider text-black"
              >
                ENTRER DANS MON AVENTURE DEK
                <ArrowRight className="h-4 w-4" />
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
