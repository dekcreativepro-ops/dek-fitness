import { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookmarkSimple, Clock, Fire } from '../DekIcons';
import { INITIAL_COACHS } from '../../data/mockData';
import {
  EXERCISES,
  FORM_COMPARE_DEMOS,
  type ExerciseDef,
  type WorkoutProgram,
  type WorkoutStep,
} from '../../data/workoutsData';
import type { MuscleGroup } from '../../types/dek';
import { MUSCLE_LABELS } from '../../utils/programsAndNutrition';
import { UserAvatar } from '../UserAvatar';
import { BottomSheet, Button, Card, CinematicImage, IconButton, ListRow, SectionHeader, StarRow, StatTiles } from '../ui/kit';
import { FormCompare } from '../ui/FormCompare';
import { MuscleMap } from '../ui/MuscleMap';
import { fadeUpItem, staggerContainer } from '../ui/motion';

function stepLabel(step: WorkoutStep) {
  return step.mode === 'reps' ? `${step.target} reps` : `${step.target} s`;
}

/** Détail d'un exercice : démo HD, carte musculaire, erreurs à éviter / bonne forme. */
export function ExerciseSheetContent({ exercise, step }: { exercise: ExerciseDef; step?: WorkoutStep }) {
  return (
    <div className="space-y-4">
      <div className="relative overflow-hidden rounded-[24px] bg-white">
        <img src={`/demos/${exercise.demo}.gif`} alt={exercise.name} className="mx-auto h-48 object-contain" />
        {step && (
          <span className="num absolute left-3 top-3 rounded-full bg-ink px-3 py-1 text-[12px] font-bold text-lime">
            {stepLabel(step)}
          </span>
        )}
      </div>
      <p className="text-[14px] font-medium leading-5 text-mute">{exercise.cue}</p>

      <div className="rounded-[24px] bg-tile p-4">
        <div className="mb-2 text-[13px] font-semibold text-mute">Muscles sollicités</div>
        <MuscleMap primary={exercise.primary} secondary={exercise.secondary} className="mx-auto h-40" />
        <div className="mt-2 flex flex-wrap justify-center gap-1.5">
          {exercise.primary.map((m) => (
            <span key={m} className="rounded-full bg-lime px-2.5 py-1 text-[12px] font-bold text-on-lime">
              {MUSCLE_LABELS[m]}
            </span>
          ))}
          {exercise.secondary.map((m) => (
            <span key={m} className="rounded-full bg-rim px-2.5 py-1 text-[12px] font-semibold text-mute">
              {MUSCLE_LABELS[m]}
            </span>
          ))}
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="text-[16px] font-bold text-fg">Erreurs à éviter</h3>
        {FORM_COMPARE_DEMOS.includes(exercise.demo) && <FormCompare demo={exercise.demo} />}
        {exercise.tips.map((t, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 * i }}
            className="grid grid-cols-2 gap-2"
          >
            <div className="rounded-[20px] border border-danger bg-card p-3">
              <div className="text-[12px] font-bold text-danger">Évite</div>
              <p className="mt-1 text-[13px] leading-[18px] text-fg">{t.bad}</p>
            </div>
            <div className="rounded-[20px] border border-lime bg-card p-3">
              <div className="text-[12px] font-bold text-lime">Fais</div>
              <p className="mt-1 text-[13px] leading-[18px] text-fg">{t.good}</p>
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
  const breakdown = coach.ratingBreakdown ?? [1, 0, 0, 0, 0];
  const breakdownTotal = breakdown.reduce((x, y) => x + y, 0);

  // Score par muscle (principal = 2, secondaire = 1) : seuls les plus sollicités ressortent en plein
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
    <div className="flex h-full flex-col bg-ink">
      <div className="no-scrollbar min-h-0 flex-1 overflow-y-auto">
        {/* Photo + retour / signet */}
        <CinematicImage src={program.image} position={program.imagePosition} className="h-[320px]" intensity={0.6}>
          <div className="absolute inset-0 bg-gradient-to-t from-ink via-black/10 to-black/30" />
          <div className="absolute inset-x-0 top-0 flex items-center justify-between p-4">
            <IconButton label="Retour" variant="glass" onClick={onBack}>
              <ArrowLeft className="h-5 w-5" />
            </IconButton>
            <button
              type="button"
              onClick={onToggleSave}
              aria-pressed={saved}
              aria-label={saved ? 'Retirer des favoris' : 'Ajouter aux favoris'}
              className={`flex h-11 w-11 items-center justify-center rounded-full transition active:scale-90 ${
                saved ? 'bg-lime text-on-lime' : 'bg-black/40 text-white'
              }`}
            >
              <BookmarkSimple className="h-5 w-5" />
            </button>
          </div>
        </CinematicImage>

        <motion.div variants={staggerContainer} initial="hidden" animate="show" className="space-y-4 px-5 pb-8">
          <motion.div variants={fadeUpItem} className="relative -mt-14">
            <h1 className="text-[26px] font-bold leading-8 text-fg">{program.title}</h1>
            <p className="text-[14px] font-medium text-mute">{program.subtitle}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-tile px-3 py-1.5 text-[13px] font-semibold text-fg">
                <Clock className="h-3.5 w-3.5" /> {program.durationMin} min
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-tile px-3 py-1.5 text-[13px] font-semibold text-fg">
                <Fire className="h-3.5 w-3.5" /> {program.kcal} kcal
              </span>
            </div>
          </motion.div>

          {/* À propos */}
          <motion.div variants={fadeUpItem}>
            <Card>
              <h2 className="text-[16px] font-bold text-fg">À propos</h2>
              <p className="mt-2 text-[14px] leading-5 text-mute">{program.about}</p>
              <StatTiles
                className="mt-4 border-t border-rim pt-4"
                items={[
                  { label: 'Niveau', value: <span className="text-[16px]">{program.level}</span> },
                  { label: 'Progression', value: `${doneCount}×` },
                  {
                    label: 'Zone',
                    value: <span className="text-[16px]">{muscles.primary[0] ? MUSCLE_LABELS[muscles.primary[0]] : program.equipment}</span>,
                  },
                ]}
              />
            </Card>
          </motion.div>

          {/* Zones ciblées */}
          <motion.div variants={fadeUpItem}>
            <Card>
              <h2 className="text-[16px] font-bold text-fg">Zones ciblées</h2>
              <MuscleMap primary={muscles.primary} secondary={muscles.secondary} className="mx-auto mt-2 h-52" />
              <div className="mt-2 flex flex-wrap justify-center gap-1.5">
                {muscles.primary.map((m) => (
                  <span key={m} className="rounded-full bg-lime px-2.5 py-1 text-[12px] font-bold text-on-lime">
                    {MUSCLE_LABELS[m]}
                  </span>
                ))}
                {muscles.secondary.map((m) => (
                  <span key={m} className="rounded-full bg-tile px-2.5 py-1 text-[12px] font-semibold text-mute">
                    {MUSCLE_LABELS[m]}
                  </span>
                ))}
              </div>
              <div className="mt-3 text-center text-[12px] text-mute">Matériel : {program.equipment}</div>
            </Card>
          </motion.div>

          {/* Coach */}
          <motion.div variants={fadeUpItem}>
            <SectionHeader title="Coach" />
            <ListRow
              onClick={() => onOpenCoach(coach.id)}
              leading={
                coach.avatarPreset && (
                  <UserAvatar
                    avatar={{ mode: 'preset', presetId: coach.avatarPreset, diceStyle: 'lorelei', seed: coach.name, bgColor: '0E0F12', auraColor: coach.accent }}
                    size="md"
                    ring={false}
                    className="!h-12 !w-12"
                  />
                )
              }
              title={coach.name}
              subtitle={coach.specialty}
              meta={`${coach.experienceYears ?? 5} ans d’expérience`}
            />
          </motion.div>

          {/* Note & avis */}
          <motion.div variants={fadeUpItem}>
            <Card>
              <div className="flex items-center gap-5">
                <div>
                  <div className="num text-[44px] font-extrabold leading-none text-fg">{program.rating.toFixed(1)}</div>
                  <StarRow rating={program.rating} className="mt-2 h-3.5 w-3.5" />
                  <div className="mt-1 text-[12px] text-mute">{program.ratingsCount} avis vérifiés</div>
                </div>
                <div className="flex-1 space-y-1.5">
                  {breakdown.map((n, i) => (
                    <div key={i} className="flex items-center gap-2 text-[12px] text-mute">
                      <span className="num w-2">{5 - i}</span>
                      <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-rim">
                        <div className="h-full rounded-full bg-lime" style={{ width: `${breakdownTotal ? (n / breakdownTotal) * 100 : 0}%` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              {review && (
                <div className="mt-4 rounded-[20px] bg-tile p-3">
                  <div className="flex items-center gap-2">
                    <UserAvatar
                      avatar={{ mode: 'preset', presetId: review.avatarPreset, diceStyle: 'lorelei', seed: review.author, bgColor: '0E0F12', auraColor: '#5BD6FF' }}
                      size="xs"
                      ring={false}
                    />
                    <span className="text-[14px] font-bold text-fg">{review.author}</span>
                    <span className="ml-auto text-[12px] text-faint">{review.timeAgo}</span>
                  </div>
                  <p className="mt-2 text-[13px] leading-[18px] text-mute">{review.text}</p>
                </div>
              )}
            </Card>
          </motion.div>

          {/* Exercices */}
          <motion.div variants={fadeUpItem}>
            <SectionHeader title={`Exercices · ${program.steps.length} étapes · ${program.rounds} tours`} />
            <div className="space-y-2">
              {program.steps.map((step, i) => {
                const ex = EXERCISES[step.exerciseId];
                return (
                  <ListRow
                    key={`${step.exerciseId}-${i}`}
                    onClick={() => setOpenStep(step)}
                    leading={<img src={`/demos/${ex.demo}.gif`} alt="" loading="lazy" className="h-full w-full bg-white object-contain" />}
                    title={ex.name}
                    subtitle={step.restSec > 0 ? `Repos ${step.restSec} s` : undefined}
                    meta={stepLabel(step)}
                  />
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      </div>

      {/* CTA collant */}
      <div className="safe-bottom shrink-0 bg-ink px-5 pb-4 pt-3">
        <Button fullWidth trailingArrow onClick={onStart}>
          Démarrer la séance · +{program.xp} XP
        </Button>
      </div>

      <BottomSheet open={!!openExercise} onClose={() => setOpenStep(null)} title={openExercise?.name}>
        {openExercise && openStep && <ExerciseSheetContent exercise={openExercise} step={openStep} />}
      </BottomSheet>
    </div>
  );
}
