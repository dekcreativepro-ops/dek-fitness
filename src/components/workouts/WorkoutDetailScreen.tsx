import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BookmarkSimple,
  CaretLeft,
  CaretRight,
  CheckCircle,
  Clock,
  Fire,
  Play,
  Rounds,
  Warning,
} from '../DekIcons';
import { INITIAL_COACHS } from '../../data/mockData';
import {
  EXERCISES,
  LEVEL_COLORS,
  type ExerciseDef,
  type WorkoutProgram,
  type WorkoutStep,
} from '../../data/workoutsData';
import type { MuscleGroup } from '../../types/dek';
import { MUSCLE_LABELS } from '../../utils/programsAndNutrition';
import { UserAvatar } from '../UserAvatar';
import { BottomSheet, CinematicImage, SectionHeader, StarRow } from '../ui/kit';
import { MuscleMap } from '../ui/MuscleMap';
import { fadeUpItem, staggerContainer } from '../ui/motion';

function stepLabel(step: WorkoutStep) {
  return step.mode === 'reps' ? `${step.target} reps` : `${step.target} s`;
}

/** Détail d'un exercice : démo HD, carte musculaire, erreurs à éviter ✗ / bonne forme ✓. */
export function ExerciseSheetContent({ exercise, step }: { exercise: ExerciseDef; step?: WorkoutStep }) {
  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-[24px] bg-white">
        <img src={`/demos/${exercise.demo}.gif`} alt={exercise.name} className="mx-auto h-48 object-contain" />
        {step && (
          <span className="font-hud absolute left-3 top-3 rounded-lg bg-black/80 px-2 py-0.5 text-[10px] font-bold text-[#C8FF00]">
            {stepLabel(step)}
          </span>
        )}
      </div>
      <p className="text-[12px] leading-relaxed text-slate-200">{exercise.cue}</p>

      <div className="rounded-[22px] border border-white/10 bg-[#0B0E14] p-3">
        <div className="font-hud mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">Muscles sollicités</div>
        <MuscleMap primary={exercise.primary} secondary={exercise.secondary} className="mx-auto h-40" />
        <div className="mt-1 flex flex-wrap justify-center gap-1">
          {exercise.primary.map((m) => (
            <span key={m} className="rounded-full bg-[#C8FF00] px-2 py-0.5 text-[9px] font-bold text-black">
              {MUSCLE_LABELS[m]}
            </span>
          ))}
          {exercise.secondary.map((m) => (
            <span key={m} className="rounded-full bg-[#C8FF00]/15 px-2 py-0.5 text-[9px] font-semibold text-[#C8FF00]">
              {MUSCLE_LABELS[m]}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <div className="font-hud text-[11px] font-bold uppercase tracking-wider text-white">Erreurs à éviter</div>
        {exercise.tips.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.08 * i }}
            className="grid grid-cols-2 gap-1.5"
          >
            <div className="rounded-2xl border border-[#FF2E54]/40 bg-[#FF2E54]/10 p-2.5 shadow-[0_0_18px_-8px_#FF2E54]">
              <div className="flex items-center gap-1 text-[10px] font-black text-[#FF2E54]">
                <Warning weight="duotone" className="h-3.5 w-3.5" /> ÉVITE
              </div>
              <p className="mt-1 text-[11px] leading-snug text-slate-200">{t.bad}</p>
            </div>
            <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 p-2.5 shadow-[0_0_18px_-8px_#34D399]">
              <div className="flex items-center gap-1 text-[10px] font-black text-emerald-400">
                <CheckCircle weight="duotone" className="h-3.5 w-3.5" /> FAIS
              </div>
              <p className="mt-1 text-[11px] leading-snug text-slate-200">{t.good}</p>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export function WorkoutDetailScreen({
  program,
  saved,
  doneCount,
  onBack,
  onToggleSave,
  onStart,
  onOpenCoach,
}: {
  program: WorkoutProgram;
  saved: boolean;
  doneCount: number;
  onBack: () => void;
  onToggleSave: () => void;
  onStart: () => void;
  onOpenCoach: (id: string) => void;
}) {
  const [openStep, setOpenStep] = useState<WorkoutStep | null>(null);
  const coach = INITIAL_COACHS.find((c) => c.id === program.coachId) ?? INITIAL_COACHS[0];
  const review = coach.reviews?.[0];

  // Score par muscle (principal = 2, secondaire = 1) : seuls les plus sollicités brillent fort
  const muscles = useMemo(() => {
    const score = new Map<MuscleGroup, number>();
    program.steps.forEach((s) => {
      const ex = EXERCISES[s.exerciseId];
      ex.primary.forEach((m) => score.set(m, (score.get(m) ?? 0) + 2));
      ex.secondary.forEach((m) => score.set(m, (score.get(m) ?? 0) + 1));
    });
    const max = Math.max(...score.values());
    const primary: MuscleGroup[] = [];
    const secondary: MuscleGroup[] = [];
    score.forEach((v, m) => (v >= max * 0.75 ? primary : secondary).push(m));
    return { primary, secondary };
  }, [program]);

  const openExercise = openStep ? EXERCISES[openStep.exerciseId] : null;

  return (
    <div className="flex h-full flex-col bg-[#080A0E]">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        {/* Héro cinématique */}
        <CinematicImage src={program.image} position={program.imagePosition} tint={program.tint} className="h-[300px]">
          <div className="absolute inset-0 bg-gradient-to-t from-[#080A0E] via-[#080A0E]/40 to-black/30" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-3">
            <button
              onClick={onBack}
              aria-label="Retour"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-black/45 text-white backdrop-blur-md active:scale-90"
            >
              <CaretLeft weight="bold" className="h-5 w-5" />
            </button>
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={onToggleSave}
              aria-pressed={saved}
              aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              className={`flex h-10 w-10 items-center justify-center rounded-2xl backdrop-blur-md ${
                saved ? 'bg-[#C8FF00] text-black' : 'bg-black/45 text-white'
              }`}
            >
              <BookmarkSimple weight={saved ? 'duotone' : 'regular'} className="h-5 w-5" />
            </motion.button>
          </div>
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="show"
            className="absolute inset-x-0 bottom-0 p-4"
          >
            <motion.span
              variants={fadeUpItem}
              className="font-hud inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-black text-black"
              style={{ backgroundColor: LEVEL_COLORS[program.level] }}
            >
              {program.level.toUpperCase()}
            </motion.span>
            <motion.h1
              variants={fadeUpItem}
              className="font-hud mt-1.5 text-[32px] font-bold uppercase leading-[0.92] tracking-tight text-white drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]"
            >
              {program.title}
            </motion.h1>
            <motion.p variants={fadeUpItem} className="text-xs text-slate-300">
              {program.subtitle}
            </motion.p>
            <motion.div variants={fadeUpItem} className="mt-2.5 flex flex-wrap gap-1.5 text-[11px] font-semibold text-white">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 backdrop-blur">
                <Clock weight="duotone" className="h-3.5 w-3.5" /> {program.durationMin} min
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 backdrop-blur">
                <Fire weight="duotone" className="h-3.5 w-3.5 text-orange-400" /> {program.kcal} kcal
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-white/12 px-2.5 py-1 backdrop-blur">
                <Rounds weight="duotone" className="h-3.5 w-3.5" /> {program.rounds} tours
              </span>
            </motion.div>
          </motion.div>
        </CinematicImage>

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-3 px-3.5 pb-28">
          {/* À propos + stats */}
          <motion.section variants={fadeUpItem} className="rounded-[26px] border border-white/10 bg-[#11151D] p-4">
            <h2 className="font-hud text-sm font-bold text-white">À propos</h2>
            <p className="mt-1.5 text-[12px] leading-relaxed text-slate-300">{program.about}</p>
            <div className="mt-3 grid grid-cols-3 divide-x divide-white/10 rounded-2xl bg-[#0B0E14] py-2.5 text-center">
              <div>
                <div className="text-[9px] text-slate-400">Niveau</div>
                <div className="font-hud text-xs font-bold" style={{ color: LEVEL_COLORS[program.level] }}>
                  {program.level}
                </div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400">Terminée</div>
                <div className="font-hud text-xs font-bold text-white">{doneCount}×</div>
              </div>
              <div>
                <div className="text-[9px] text-slate-400">Matériel</div>
                <div className="font-hud truncate px-1 text-xs font-bold text-white">{program.equipment}</div>
              </div>
            </div>
          </motion.section>

          {/* Zones ciblées */}
          <motion.section variants={fadeUpItem} className="rounded-[26px] border border-white/10 bg-[#11151D] p-4">
            <SectionHeader title="Zones ciblées" />
            <MuscleMap primary={muscles.primary} secondary={muscles.secondary} className="mx-auto h-52" />
            <div className="mt-1 flex flex-wrap justify-center gap-1">
              {muscles.primary.map((m) => (
                <span key={m} className="rounded-full bg-[#C8FF00] px-2 py-0.5 text-[9px] font-bold text-black">
                  {MUSCLE_LABELS[m]}
                </span>
              ))}
              {muscles.secondary.map((m) => (
                <span key={m} className="rounded-full bg-[#C8FF00]/15 px-2 py-0.5 text-[9px] font-semibold text-[#C8FF00]">
                  {MUSCLE_LABELS[m]}
                </span>
              ))}
            </div>
          </motion.section>

          {/* Coach */}
          <motion.section variants={fadeUpItem}>
            <SectionHeader title="Coach" />
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => onOpenCoach(coach.id)}
              className="flex w-full items-center gap-3 rounded-[22px] border border-white/10 bg-[#11151D] p-3 text-left"
            >
              {coach.avatarPreset && (
                <UserAvatar
                  avatar={{ mode: 'preset', presetId: coach.avatarPreset, diceStyle: 'lorelei', seed: coach.name, bgColor: '0f172a', auraColor: coach.accent }}
                  size="md"
                />
              )}
              <div className="min-w-0 flex-1">
                <div className="font-hud truncate text-sm font-bold text-white">{coach.name}</div>
                <div className="truncate text-[11px] text-slate-400">{coach.specialty}</div>
                <div className="mt-0.5 text-[10px] font-semibold text-[#C8FF00]">
                  {coach.experienceYears ?? 5} ans d’expérience
                </div>
              </div>
              <CaretRight className="h-4 w-4 text-slate-400" />
            </motion.button>
          </motion.section>

          {/* Note & avis */}
          <motion.section variants={fadeUpItem} className="rounded-[26px] border border-white/10 bg-[#11151D] p-4">
            <div className="flex items-center gap-3">
              <div className="font-hud text-4xl font-bold text-white">{program.rating.toFixed(1)}</div>
              <div>
                <StarRow rating={program.rating} className="h-3.5 w-3.5" />
                <div className="text-[10px] text-slate-400">{program.ratingsCount} avis vérifiés</div>
              </div>
            </div>
            {review && (
              <div className="mt-3 rounded-2xl bg-[#0B0E14] p-3">
                <div className="flex items-center gap-2">
                  <UserAvatar
                    avatar={{ mode: 'preset', presetId: review.avatarPreset, diceStyle: 'lorelei', seed: review.author, bgColor: '0f172a', auraColor: '#00E5FF' }}
                    size="xs"
                    ring={false}
                  />
                  <span className="text-xs font-bold text-white">{review.author}</span>
                  <span className="ml-auto text-[10px] text-slate-500">{review.timeAgo}</span>
                </div>
                <p className="mt-1.5 text-[11px] leading-relaxed text-slate-300">{review.text}</p>
              </div>
            )}
          </motion.section>

          {/* Exercices */}
          <motion.section variants={fadeUpItem}>
            <SectionHeader title={`Exercices • ${program.steps.length} étapes • ${program.rounds} tours`} />
            <div className="space-y-2">
              {program.steps.map((step, i) => {
                const ex = EXERCISES[step.exerciseId];
                return (
                  <motion.button
                    key={`${step.exerciseId}-${i}`}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setOpenStep(step)}
                    className="flex w-full items-center gap-3 rounded-[20px] border border-white/10 bg-[#11151D] p-2 text-left"
                  >
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-white">
                      <img src={`/demos/${ex.demo}.gif`} alt="" loading="lazy" className="h-full w-full object-contain" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-hud truncate text-[13px] font-bold text-white">{ex.name}</div>
                      <div className="text-[11px] font-semibold text-[#C8FF00]">{stepLabel(step)}</div>
                      {step.restSec > 0 && <div className="text-[10px] text-slate-500">Repos {step.restSec} s</div>}
                    </div>
                    <CaretRight className="h-4 w-4 shrink-0 text-slate-400" />
                  </motion.button>
                );
              })}
            </div>
          </motion.section>
        </motion.div>
      </div>

      {/* Bouton d'action collant au pouce */}
      <div className="safe-bottom shrink-0 border-t border-white/10 bg-[#080A0E]/95 px-3.5 pb-3 pt-2.5 backdrop-blur">
        <motion.button
          whileTap={{ scale: 0.96 }}
          onClick={onStart}
          className="font-hud flex w-full items-center justify-center gap-2 rounded-full bg-[#C8FF00] py-3.5 text-sm font-bold text-black shadow-[0_10px_30px_-10px_#C8FF00]"
        >
          <Play weight="duotone" className="h-5 w-5" /> DÉMARRER LA SÉANCE
          <span className="rounded-full bg-black/15 px-2 py-0.5 text-[10px]">+{program.xp} XP</span>
        </motion.button>
      </div>

      <BottomSheet open={!!openExercise} onClose={() => setOpenStep(null)} title={openExercise?.name}>
        {openExercise && openStep && <ExerciseSheetContent exercise={openExercise} step={openStep} />}
      </BottomSheet>
    </div>
  );
}
