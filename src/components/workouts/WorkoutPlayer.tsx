import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CaretLeft, CaretRight, Check, Pause, Play, X } from '../DekIcons';
import {
  EXERCISES,
  expandProgram,
  MIN_VALIDATED_RATIO,
  type WorkoutProgram,
  type WorkoutResult,
} from '../../data/workoutsData';
import { playGo, playHit, playTick, playVictory, speak, stopSpeaking } from '../../utils/soundFx';
import { clearWorkoutResume, getWorkoutResume, saveWorkoutResume } from '../../utils/workoutResume';
import { CheckDraw, ConfettiBurst } from '../ui/AnimatedIcons';
import { useWakeLock } from '../ui/hooks';
import { CountUp, IconButton, ProgressBar, TimerRing } from '../ui/kit';
import { ExerciseMedia } from './ExerciseMedia';

type Phase = 'ready' | 'work' | 'rest' | 'done';



const READY_SEC = 5;

function formatDuration(sec: number) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/**
 * Lecteur de séance guidée plein écran : « Prépare-toi » → exercices (reps ou chrono)
 * → repos → … → écran de félicitations. Voix coach, bips des 3 dernières secondes,
 * écran maintenu allumé.
 */
export function WorkoutPlayer({
  program,
  weightKg,
  onComplete,
  onExit,
}: {
  program: WorkoutProgram;
  weightKg?: number;
  /** Renvoie l'XP réellement accordée (0 si déjà gagnée aujourd'hui). */
  onComplete: (result: WorkoutResult) => number;
  onExit: () => void;
}) {
  const seq = useMemo(() => expandProgram(program), [program]);
  const [phase, setPhase] = useState<Phase>('ready');
  const [idx, setIdx] = useState(0);
  const [remaining, setRemaining] = useState(READY_SEC);
  const [paused, setPaused] = useState(false);
  const [confirmExit, setConfirmExit] = useState(false);
  const [result, setResult] = useState<(WorkoutResult & { xp: number }) | null>(null);
  const [elapsed, setElapsed] = useState(0);
  // Reprise d'une séance interrompue (même programme, moins de 24 h)
  const [resume, setResume] = useState(() => {
    const r = getWorkoutResume();
    return r && r.programId === program.id && r.idx < seq.length ? r : null;
  });
  const startIdx = resume?.idx ?? 0;

  const remainingRef = useRef(READY_SEC);
  const startedAtRef = useRef(0);
  const doneStepsRef = useRef<Set<number>>(new Set(resume?.done ?? []));
  const [doneSteps, setDoneSteps] = useState<Set<number>>(() => new Set(resume?.done ?? []));
  const finishedRef = useRef(false);

  useWakeLock(phase !== 'done');

  const step = seq[idx];
  const exercise = EXERCISES[step.exerciseId];
  const nextStep = seq[idx + 1];
  const nextExercise = nextStep ? EXERCISES[nextStep.exerciseId] : null;
  const weightFactor = weightKg ? weightKg / 70 : 1;

  const setRem = (v: number) => {
    remainingRef.current = v;
    setRemaining(v);
  };

  const announce = (i: number) => {
    const st = seq[i];
    const ex = EXERCISES[st.exerciseId];
    speak(`${ex.name}. ${st.mode === 'reps' ? `${st.target} répétitions` : `${st.target} secondes`}.`);
  };

  const goWork = (i: number) => {
    setIdx(i);
    setPhase('work');
    setRem(seq[i].mode === 'time' ? seq[i].target : 0);
    playGo();
    announce(i);
  };

  const finish = () => {
    if (finishedRef.current) return;
    finishedRef.current = true;
    const durationSec = Math.max(1, Math.round((Date.now() - startedAtRef.current) / 1000));
    let kcal = 0;
    doneStepsRef.current.forEach((i) => {
      const st = seq[i];
      kcal += st.target * EXERCISES[st.exerciseId].kcalPerUnit;
    });
    // Coût du repos actif + facteur de poids corporel
    kcal = Math.round((kcal + durationSec * 0.05) * weightFactor);
    const base: WorkoutResult = {
      durationSec,
      kcal,
      exercisesDone: doneStepsRef.current.size,
      totalSteps: seq.length,
    };
    clearWorkoutResume();
    const xp = onComplete(base);
    setResult({ ...base, xp });
    setPhase('done');
    playVictory();
    speak('Bravo ! Séance terminée. Tu peux être fier de toi.');
  };

  /**
   * Termine l'exercice en cours puis enchaîne repos ou exercice suivant.
   * `validated` = false quand l'athlète le passe (il ne compte alors ni pour l'XP ni pour les kcal).
   */
  const completeCurrent = (validated = true) => {
    if (validated) {
      const nextDone = new Set(doneStepsRef.current).add(idx);
      doneStepsRef.current = nextDone;
      setDoneSteps(nextDone);
      playHit();
    }
    if (idx >= seq.length - 1) {
      finish();
      return;
    }
    if (step.restSec > 0) {
      setIdx(idx + 1);
      setPhase('rest');
      setRem(step.restSec);
      speak(`Repos. Ensuite : ${EXERCISES[seq[idx + 1].exerciseId].name}.`);
    } else {
      goWork(idx + 1);
    }
  };

  const goPrevious = () => {
    if (phase === 'rest') {
      goWork(Math.max(0, idx - 1));
      return;
    }
    if (idx > 0) goWork(idx - 1);
  };

  const tick = () => {
    const r = remainingRef.current - 1;
    if (r > 0 && r <= 3) playTick();
    if (r > 0) {
      setRem(r);
      return;
    }
    if (phase === 'ready') goWork(startIdx);
    else if (phase === 'rest') goWork(idx);
    else completeCurrent();
  };

  // Toujours appeler la version la plus récente depuis l'intervalle
  const tickRef = useRef(tick);
  useEffect(() => {
    tickRef.current = tick;
  });

  const timed = phase === 'ready' || phase === 'rest' || (phase === 'work' && step.mode === 'time');
  useEffect(() => {
    if (!timed || paused || confirmExit) return;
    const t = setInterval(() => tickRef.current(), 1000);
    return () => clearInterval(t);
  }, [timed, paused, confirmExit, phase, idx]);

  /** Quitter : mémorise la progression pour pouvoir reprendre plus tard. */
  const handleExit = () => {
    if (phase !== 'done' && (doneStepsRef.current.size > 0 || idx > 0)) {
      saveWorkoutResume({ programId: program.id, idx, done: [...doneStepsRef.current], total: seq.length });
    }
    stopSpeaking();
    onExit();
  };

  // Chronomètre global de séance (hors pause)
  useEffect(() => {
    if (phase === 'ready' || phase === 'done' || paused || confirmExit) return;
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [phase, paused, confirmExit]);

  // Annonce de départ + nettoyage de la voix
  useEffect(() => {
    startedAtRef.current = Date.now();
    speak(`Prépare-toi. ${startIdx > 0 ? 'On reprend avec' : 'Premier exercice :'} ${EXERCISES[seq[startIdx].exerciseId].name}.`);
    return () => stopSpeaking();
  }, [seq, startIdx]);

  const progressPct = phase === 'done' ? 100 : Math.round((doneSteps.size / seq.length) * 100);

  return (
    <div className="relative flex h-full flex-col overflow-hidden bg-ink text-fg">
      {/* Barre supérieure */}
      {phase !== 'done' && phase !== 'ready' && (
        <div className="safe-top shrink-0 px-5 pt-4">
          <div className="flex items-center justify-between gap-3">
            <IconButton label="Quitter la séance" onClick={() => setConfirmExit(true)}>
              <X className="h-5 w-5" />
            </IconButton>
            <div className="min-w-0 text-center">
              <div className="text-[13px] font-medium text-mute">
                {phase === 'rest' ? 'Récupération' : `Exercice ${idx + 1}/${seq.length}`}
              </div>
              <div className="truncate text-[15px] font-bold text-fg">{program.title}</div>
            </div>
            <IconButton label={paused ? 'Reprendre' : 'Pause'} onClick={() => setPaused((p) => !p)}>
              {paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
            </IconButton>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {/* ============ PRÉPARE-TOI ============ */}
        {phase === 'ready' && (
          <motion.div
            key="ready"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="relative flex flex-1 flex-col items-center justify-center bg-lime px-6 text-center text-on-lime"
          >
            <button
              type="button"
              onClick={handleExit}
              aria-label="Annuler"
              className="absolute left-5 top-4 flex h-11 w-11 items-center justify-center rounded-full bg-on-lime/10 transition active:scale-90"
            >
              <CaretLeft className="h-5 w-5" />
            </button>
            <motion.p initial={{ y: 12, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="text-[34px] font-extrabold leading-[38px] tracking-tight">
              Prépare-toi
            </motion.p>
            <div className="relative mt-2 flex h-48 items-center justify-center">
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={remaining}
                  initial={{ scale: 1.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.6, opacity: 0 }}
                  transition={{ duration: 0.25, ease: 'easeOut' }}
                  className="num text-[160px] font-extrabold leading-none"
                >
                  {remaining}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="text-[13px] font-semibold text-on-lime/70">
              {resume ? `Reprise · exercice ${startIdx + 1}/${seq.length}` : 'Premier exercice'}
            </div>
            <div className="text-[20px] font-bold">{EXERCISES[seq[startIdx].exerciseId].name}</div>
            <button
              type="button"
              onClick={() => goWork(startIdx)}
              className="mt-6 h-[52px] rounded-full bg-on-lime px-8 text-[15px] font-bold text-lime transition active:scale-95"
            >
              Je suis prêt !
            </button>
            {resume && (
              <button
                type="button"
                onClick={() => {
                  clearWorkoutResume();
                  setResume(null);
                  doneStepsRef.current = new Set();
                  setDoneSteps(new Set());
                  setRem(READY_SEC);
                }}
                className="mt-3 text-[13px] font-semibold text-on-lime/70 underline"
              >
                Recommencer depuis le début
              </button>
            )}
          </motion.div>
        )}

        {/* ============ EXERCICE ============ */}
        {phase === 'work' && (
          <motion.div
            key={`work-${idx}`}
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -32 }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className="flex min-h-0 flex-1 flex-col px-5 pb-4 pt-4"
          >
            {/* Média + énorme chiffre */}
            <div className={`relative min-h-0 flex-1 overflow-hidden rounded-[28px] ${exercise.video ? 'bg-black' : 'bg-white'}`}>
              <ExerciseMedia exercise={exercise} fill />
              {exercise.video ? (
                // Vidéo : bandeau compact pour ne pas cacher l'exercice
                <div className="absolute inset-x-0 bottom-0 flex items-end gap-3 bg-gradient-to-t from-black/90 via-black/60 to-transparent px-5 pb-4 pt-12">
                  <motion.div
                    key={`${idx}-${step.mode === 'reps' ? step.target : remaining}`}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                    className="num shrink-0 text-[52px] font-extrabold leading-[0.9] text-lime"
                  >
                    {step.mode === 'reps' ? step.target : remaining}
                    <span className="ml-1.5 text-[13px] font-bold text-white/80">{step.mode === 'reps' ? 'reps' : 's'}</span>
                  </motion.div>
                  <div className="min-w-0 pb-0.5 text-[16px] font-bold leading-5 text-white">{exercise.name}</div>
                </div>
              ) : (
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 via-black/55 to-transparent px-5 pb-4 pt-16">
                <motion.div
                  key={`${idx}-${step.mode === 'reps' ? step.target : remaining}`}
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 22 }}
                  className="num text-[96px] font-extrabold leading-[0.9] text-lime"
                >
                  {step.mode === 'reps' ? step.target : remaining}
                  <span className="ml-2 text-[16px] font-bold text-white/80">{step.mode === 'reps' ? 'reps' : 'secondes'}</span>
                </motion.div>
                <div className="mt-2 text-[20px] font-bold leading-6 text-white">{exercise.name}</div>
                <p className="mt-0.5 line-clamp-2 text-[13px] text-white/75">{exercise.cue}</p>
              </div>
              )}
              {paused && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <span className="text-[26px] font-extrabold text-white">En pause</span>
                </div>
              )}
            </div>

            {nextExercise && (
              <div className="mt-3 flex items-center gap-2 rounded-[20px] bg-card px-4 py-2.5 text-[13px]">
                <span className="font-semibold text-mute">À suivre</span>
                <span className="truncate font-bold text-fg">{nextExercise.name}</span>
                <span className="num ml-auto shrink-0 font-semibold text-lime">
                  {nextStep.mode === 'reps' ? `${nextStep.target} reps` : `${nextStep.target} s`}
                </span>
              </div>
            )}

            {/* Progression + commandes */}
            <div className="mt-3">
              <ProgressBar value={progressPct} knob />
              <div className="mt-2 flex items-center justify-between text-[13px] font-medium">
                <span className="num text-fg">{progressPct} % terminé</span>
                <span className="num text-mute">
                  {formatDuration(elapsed)} / {program.durationMin}:00
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  onClick={goPrevious}
                  disabled={idx === 0}
                  aria-label="Exercice précédent"
                  className="flex h-[52px] flex-1 items-center justify-center gap-1 rounded-full bg-tile text-[15px] font-bold text-fg transition active:scale-95 disabled:opacity-40"
                >
                  <CaretLeft className="h-4 w-4" /> Précédent
                </button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  type="button"
                  onClick={step.mode === 'reps' ? () => completeCurrent(true) : () => setPaused((p) => !p)}
                  aria-label={step.mode === 'reps' ? 'Exercice terminé' : paused ? 'Reprendre' : 'Pause'}
                  className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-lime text-on-lime"
                >
                  {step.mode === 'reps' ? (
                    <Check weight="bold" className="h-7 w-7" />
                  ) : paused ? (
                    <Play className="ml-0.5 h-7 w-7" />
                  ) : (
                    <Pause className="h-7 w-7" />
                  )}
                </motion.button>
                <button
                  type="button"
                  onClick={() => completeCurrent(false)}
                  aria-label="Passer l'exercice"
                  className="flex h-[52px] flex-1 items-center justify-center gap-1 rounded-full bg-lime text-[15px] font-bold text-on-lime transition active:scale-95"
                >
                  Suivant <CaretRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============ REPOS ============ */}
        {phase === 'rest' && (
          <motion.div
            key={`rest-${idx}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 flex-col items-center px-5 pb-5 pt-6"
          >
            <span className="text-[20px] font-bold text-fg">Repos</span>
            <div className="mt-4">
              <TimerRing total={seq[idx - 1]?.restSec || 30} remaining={remaining} size={210}>
                <span className="num text-[64px] font-extrabold leading-none text-fg">{remaining}</span>
                <span className="mt-1 text-[13px] text-mute">respire profondément</span>
              </TimerRing>
            </div>
            <div className="mt-5 flex gap-2">
              <button
                type="button"
                onClick={() => setRem(remainingRef.current + 15)}
                className="h-11 rounded-full bg-tile px-5 text-[14px] font-bold text-fg transition active:scale-95"
              >
                +15 s
              </button>
              <button
                type="button"
                onClick={() => goWork(idx)}
                className="flex h-11 items-center gap-1 rounded-full bg-lime px-5 text-[14px] font-bold text-on-lime transition active:scale-95"
              >
                Passer <CaretRight className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-auto w-full rounded-[24px] bg-card p-3">
              <div className="mb-2 px-1 text-[13px] font-semibold text-mute">À suivre</div>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-[18px] bg-white">
                  {exercise.video ? <ExerciseMedia exercise={exercise} still /> : <img src={`/demos/${exercise.demo}.gif`} alt="" className="h-full w-full object-contain" />}
                </div>
                <div className="min-w-0">
                  <div className="truncate text-[15px] font-bold text-fg">{exercise.name}</div>
                  <div className="text-[13px] font-semibold text-lime">
                    {step.mode === 'reps' ? `${step.target} répétitions` : `${step.target} secondes`}
                  </div>
                  <div className="line-clamp-1 text-[12px] text-mute">{exercise.cue}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============ FÉLICITATIONS ============ */}
        {phase === 'done' && result && (
          <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="relative flex flex-1 flex-col items-center justify-center px-5">
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 24 }}
              className="relative w-full rounded-[32px] bg-lime p-6 text-center text-on-lime"
            >
              <ConfettiBurst colors={['#0E0F12', '#FFFFFF', '#A1A1AA', '#24252A']} />
              <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-on-lime">
                <CheckDraw className="h-14 w-14" color="#C8FF00" />
              </div>
              <h2 className="mt-4 text-[26px] font-bold leading-8">Félicitations</h2>
              <p className="mt-1 text-[14px] font-medium text-on-lime/70">« {program.title} » terminée</p>

              <div className="mt-5 grid grid-cols-3 divide-x divide-on-lime/15">
                <div>
                  <div className="num text-[22px] font-extrabold">{formatDuration(result.durationSec)}</div>
                  <div className="text-[12px] font-semibold text-on-lime/70">Durée</div>
                </div>
                <div>
                  <div className="text-[22px] font-extrabold">
                    <CountUp value={result.kcal} />
                  </div>
                  <div className="text-[12px] font-semibold text-on-lime/70">kcal</div>
                </div>
                <div className="px-1">
                  <div className="num text-[22px] font-extrabold">
                    {result.xp > 0 ? (
                      <>
                        +<CountUp value={result.xp} />
                      </>
                    ) : (
                      <Check weight="bold" className="mx-auto h-6 w-6" />
                    )}
                  </div>
                  <div className="text-[12px] font-semibold leading-4 text-on-lime/70">
                    {result.xp > 0
                      ? 'XP'
                      : result.exercisesDone < Math.ceil(result.totalSteps * MIN_VALIDATED_RATIO)
                        ? 'Trop d’exercices passés'
                        : 'XP du jour déjà gagnée'}
                  </div>
                </div>
              </div>
              <p className="mt-4 text-[13px] font-medium text-on-lime/70">
                {result.exercisesDone}/{seq.length} exercices validés
                {result.xp > 0 ? ' · publié sur ton fil DEK' : ` · valide-en ${Math.ceil(seq.length * MIN_VALIDATED_RATIO)} pour l’XP`}
              </p>
              <button
                type="button"
                onClick={onExit}
                className="mt-5 h-[52px] w-full rounded-full bg-on-lime text-[15px] font-bold text-fg transition active:scale-[0.97]"
              >
                Fermer
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirmation de sortie */}
      <AnimatePresence>
        {confirmExit && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-20 flex items-end bg-black/70 p-4"
            onClick={() => setConfirmExit(false)}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-[28px] bg-card p-5"
            >
              <h3 className="text-[18px] font-bold text-fg">Quitter la séance ?</h3>
              <p className="mt-1 text-[14px] leading-5 text-mute">
                Tu as validé {doneSteps.size}/{seq.length} exercices ({progressPct}%). Ta progression est
                gardée 24 h : tu pourras reprendre où tu t’es arrêté.
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmExit(false)}
                  className="h-[52px] rounded-full bg-lime text-[15px] font-bold text-on-lime transition active:scale-95"
                >
                  Continuer
                </button>
                <button
                  type="button"
                  onClick={handleExit}
                  className="h-[52px] rounded-full border border-danger text-[15px] font-bold text-danger transition active:scale-95"
                >
                  Quitter
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
