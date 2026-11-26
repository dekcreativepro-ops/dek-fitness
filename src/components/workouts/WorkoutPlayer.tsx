import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { CaretLeft, Clock, Fire, Pause, Play, SkipBackward, SkipForward, X } from '../DekIcons';
import {
  EXERCISES,
  expandProgram,
  MIN_VALIDATED_RATIO,
  type WorkoutProgram,
  type WorkoutResult,
} from '../../data/workoutsData';
import { playGo, playHit, playTick, playVictory, speak, stopSpeaking } from '../../utils/soundFx';
import { clearWorkoutResume, getWorkoutResume, saveWorkoutResume } from '../../utils/workoutResume';
import { BoltPulse, CheckDraw, ConfettiBurst } from '../ui/AnimatedIcons';
import { useWakeLock } from '../ui/hooks';
import { CountUp, TimerRing } from '../ui/kit';

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
    <div className="relative flex h-full flex-col overflow-hidden bg-[#080A0E] text-white">
      {/* Barre supérieure */}
      {phase !== 'done' && phase !== 'ready' && (
        <div className="safe-top shrink-0 px-3.5 pt-3">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setConfirmExit(true)}
              aria-label="Quitter la séance"
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8 text-white active:scale-90"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="text-center">
              <div className="font-hud text-[10px] font-bold tracking-[0.2em] text-slate-400">
                {phase === 'rest' ? 'RÉCUPÉRATION' : `EXERCICE ${idx + 1}/${seq.length}`}
              </div>
              <div className="font-hud text-xs font-bold text-white">{program.title}</div>
            </div>
            <button
              onClick={() => setPaused((p) => !p)}
              aria-label={paused ? 'Reprendre' : 'Pause'}
              className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/8 text-white active:scale-90"
            >
              {paused ? <Play weight="duotone" className="h-5 w-5" /> : <Pause weight="duotone" className="h-5 w-5" />}
            </button>
          </div>
          {/* Progression segmentée */}
          <div className="mt-3 flex gap-1">
            {seq.map((_, i) => (
              <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/10">
                <motion.div
                  className="h-full rounded-full bg-[#C8FF00]"
                  initial={false}
                  animate={{ width: doneSteps.has(i) ? '100%' : i === idx && phase === 'work' ? '45%' : '0%' }}
                  transition={{ duration: 0.35 }}
                />
              </div>
            ))}
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
            exit={{ opacity: 0, scale: 1.05 }}
            className="relative flex flex-1 flex-col items-center justify-center bg-[#C8FF00] px-6 text-center text-black"
          >
            <button
              onClick={handleExit}
              aria-label="Annuler"
              className="absolute left-3.5 top-3.5 flex h-10 w-10 items-center justify-center rounded-2xl bg-black/10"
            >
              <CaretLeft weight="bold" className="h-5 w-5" />
            </button>
            <motion.p
              initial={{ y: 12, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="font-hud text-sm font-bold tracking-[0.3em]"
            >
              PRÉPARE-TOI
            </motion.p>
            <div className="relative mt-4 flex h-44 w-44 items-center justify-center">
              <motion.span
                className="absolute inset-0 rounded-full border-[6px] border-black/15"
                animate={{ scale: [1, 1.12, 1] }}
                transition={{ duration: 1, repeat: Infinity }}
              />
              <AnimatePresence mode="popLayout">
                <motion.span
                  key={remaining}
                  initial={{ scale: 1.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  transition={{ type: 'spring', stiffness: 420, damping: 20 }}
                  className="font-hud text-8xl font-bold"
                >
                  {remaining}
                </motion.span>
              </AnimatePresence>
            </div>
            <div className="mt-5 text-xs font-semibold text-black/70">
              {resume ? `Reprise • exercice ${startIdx + 1}/${seq.length}` : 'Premier exercice'}
            </div>
            <div className="font-hud text-lg font-bold">{EXERCISES[seq[startIdx].exerciseId].name}</div>
            <button
              onClick={() => goWork(startIdx)}
              className="font-hud mt-6 rounded-full bg-black px-6 py-3 text-xs font-bold text-[#C8FF00]"
            >
              Je suis prêt !
            </button>
            {resume && (
              <button
                onClick={() => {
                  clearWorkoutResume();
                  setResume(null);
                  doneStepsRef.current = new Set();
                  setDoneSteps(new Set());
                  setRem(READY_SEC);
                }}
                className="mt-3 text-[11px] font-semibold text-black/60 underline"
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
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -40 }}
            transition={{ type: 'spring', stiffness: 360, damping: 34 }}
            className="flex min-h-0 flex-1 flex-col px-3.5 pb-3 pt-3"
          >
            {/* Démo */}
            <div className="relative min-h-0 flex-1 overflow-hidden rounded-[30px] bg-white">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_60%,#ffffff_0%,#e9ffe0_70%,#d6f5c4_100%)]" />
              <img
                src={`/demos/${exercise.demo}.gif`}
                alt={exercise.name}
                className="relative h-full w-full object-contain p-3 mix-blend-multiply"
              />
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent p-4 pt-10">
                <div className="font-hud text-lg font-bold text-white">{exercise.name}</div>
                <p className="mt-0.5 line-clamp-2 text-[11px] text-slate-200">{exercise.cue}</p>
              </div>
              {/* Grand compteur façon référence (« 10 ») */}
              {step.mode === 'reps' && (
                <motion.div
                  initial={{ scale: 0.6, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 18, delay: 0.1 }}
                  className="font-hud absolute right-4 top-3 text-right leading-none"
                >
                  <span className="text-7xl font-bold text-[#080A0E]">×{step.target}</span>
                  <div className="text-[10px] font-bold tracking-widest text-black/60">RÉPÉTITIONS</div>
                </motion.div>
              )}
              {paused && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm">
                  <span className="font-hud text-2xl font-bold tracking-widest text-white">EN PAUSE</span>
                </div>
              )}
            </div>

            {step.mode === 'time' && (
              <div className="mt-3 flex items-center justify-center">
                <TimerRing total={step.target} remaining={remaining} size={132} stroke={10}>
                  <span className="font-hud dek-neon-text text-4xl font-bold text-white">{remaining}</span>
                  <span className="text-[10px] font-semibold text-slate-400">secondes</span>
                </TimerRing>
              </div>
            )}

            {nextExercise && (
              <div className="mt-2.5 flex items-center gap-2 rounded-2xl bg-white/5 px-3 py-2 text-[11px] text-slate-300">
                <span className="font-hud text-[10px] font-bold text-slate-500">À SUIVRE</span>
                <span className="truncate font-semibold text-white">{nextExercise.name}</span>
                <span className="ml-auto shrink-0 text-[#C8FF00]">
                  {nextStep.mode === 'reps' ? `${nextStep.target} reps` : `${nextStep.target} s`}
                </span>
              </div>
            )}

            {/* Barre de contrôle au pouce : progression + Préc. | action | Suiv. */}
            <div className="mt-3 rounded-[26px] border border-white/10 bg-[#11151D] px-4 pb-3 pt-2.5">
              <div className="flex items-center justify-between text-[10px] font-semibold">
                <span className="text-[#C8FF00]">{progressPct} % terminé</span>
                <span className="font-hud text-slate-400">
                  {formatDuration(elapsed)} / ~{program.durationMin}:00
                </span>
              </div>
              <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
                <motion.div className="h-full rounded-full bg-[#C8FF00]" animate={{ width: `${progressPct}%` }} />
              </div>
              <div className="mt-2.5 flex items-center justify-between">
                <button
                  onClick={goPrevious}
                  disabled={idx === 0}
                  aria-label="Exercice précédent"
                  className="flex w-16 flex-col items-center gap-0.5 text-[10px] font-semibold text-slate-300 disabled:opacity-30"
                >
                  <SkipBackward weight="duotone" className="h-5 w-5" /> Préc.
                </button>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={step.mode === 'reps' ? () => completeCurrent(true) : () => setPaused((p) => !p)}
                  aria-label={step.mode === 'reps' ? 'Exercice terminé' : paused ? 'Reprendre' : 'Pause'}
                  className="relative flex h-16 w-16 items-center justify-center rounded-full bg-[#C8FF00] text-black shadow-[0_10px_30px_-8px_#C8FF00]"
                >
                  {step.mode === 'reps' ? (
                    <span className="font-hud text-[11px] font-black leading-tight">FAIT<br />✓</span>
                  ) : paused ? (
                    <Play weight="duotone" className="ml-0.5 h-7 w-7" />
                  ) : (
                    <Pause weight="duotone" className="h-7 w-7" />
                  )}
                </motion.button>
                <button
                  onClick={() => completeCurrent(false)}
                  aria-label="Passer l'exercice"
                  className="flex w-16 flex-col items-center gap-0.5 text-[10px] font-semibold text-slate-300"
                >
                  <SkipForward weight="duotone" className="h-5 w-5" /> Suiv.
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============ REPOS ============ */}
        {phase === 'rest' && (
          <motion.div
            key={`rest-${idx}`}
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-1 flex-col items-center px-4 pb-4 pt-6"
          >
            <span className="font-hud text-xs font-bold tracking-[0.35em] text-[#00E5FF]">REPOS</span>
            <div className="mt-4">
              <TimerRing total={seq[idx - 1]?.restSec || 30} remaining={remaining} color="#00E5FF" size={200}>
                <span className="font-hud text-6xl font-bold text-white">{remaining}</span>
                <span className="text-[11px] text-slate-400">respire profondément</span>
              </TimerRing>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setRem(remainingRef.current + 15)}
                className="font-hud rounded-full border border-white/15 bg-white/5 px-4 py-2 text-xs font-bold text-white"
              >
                +15 s
              </button>
              <button
                onClick={() => goWork(idx)}
                className="font-hud flex items-center gap-1 rounded-full bg-[#00E5FF] px-4 py-2 text-xs font-bold text-black"
              >
                Passer <SkipForward weight="duotone" className="h-3.5 w-3.5" />
              </button>
            </div>

            <div className="mt-auto w-full rounded-[24px] border border-white/10 bg-[#11151D] p-3">
              <div className="font-hud mb-2 text-[10px] font-bold tracking-widest text-slate-400">À SUIVRE</div>
              <div className="flex items-center gap-3">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl bg-white">
                  <img src={`/demos/${exercise.demo}.gif`} alt="" className="h-full w-full object-contain" />
                </div>
                <div className="min-w-0">
                  <div className="font-hud truncate text-sm font-bold text-white">{exercise.name}</div>
                  <div className="text-xs font-semibold text-[#C8FF00]">
                    {step.mode === 'reps' ? `${step.target} répétitions` : `${step.target} secondes`}
                  </div>
                  <div className="mt-0.5 line-clamp-1 text-[10px] text-slate-400">{exercise.cue}</div>
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* ============ FÉLICITATIONS ============ */}
        {phase === 'done' && result && (
          <motion.div
            key="done"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="relative flex flex-1 flex-col items-center justify-center bg-[radial-gradient(circle_at_50%_30%,#1a2410_0%,#080A0E_60%)] px-5"
          >
            <motion.div
              initial={{ y: 60, scale: 0.9, opacity: 0 }}
              animate={{ y: 0, scale: 1, opacity: 1 }}
              transition={{ type: 'spring', stiffness: 260, damping: 22 }}
              className="relative w-full rounded-[34px] bg-[#C8FF00] p-5 text-center text-black shadow-[0_30px_80px_-20px_#C8FF00]"
            >
              <ConfettiBurst />
              <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-black/10 ring-8 ring-black/5">
                <CheckDraw className="h-14 w-14" color="#080A0E" />
              </div>
              <h2 className="font-hud mt-3 text-2xl font-bold">Bravo !</h2>
              <p className="text-xs font-medium text-black/70">« {program.title} » terminée</p>

              <div className="mt-4 grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-black/10 py-2.5">
                  <Clock weight="duotone" className="mx-auto h-4 w-4" />
                  <div className="font-hud mt-0.5 text-base font-bold">{formatDuration(result.durationSec)}</div>
                  <div className="text-[9px] font-semibold text-black/60">Durée</div>
                </div>
                <div className="rounded-2xl bg-black/10 py-2.5">
                  <Fire weight="duotone" className="mx-auto h-4 w-4" />
                  <div className="font-hud mt-0.5 text-base font-bold">
                    <CountUp value={result.kcal} />
                  </div>
                  <div className="text-[9px] font-semibold text-black/60">kcal</div>
                </div>
                <div className="rounded-2xl bg-black/10 py-2.5">
                  <BoltPulse className="mx-auto h-4 w-4" color="#080A0E" />
                  <div className="font-hud mt-0.5 text-base font-bold">
                    {result.xp > 0 ? (
                      <>
                        +<CountUp value={result.xp} />
                      </>
                    ) : (
                      '✓'
                    )}
                  </div>
                  <div className="text-[9px] font-semibold text-black/60">
                    {result.xp > 0
                      ? 'XP'
                      : result.exercisesDone < Math.ceil(result.totalSteps * MIN_VALIDATED_RATIO)
                        ? 'Trop d’exercices passés'
                        : 'XP du jour déjà gagnée'}
                  </div>
                </div>
              </div>
              <p className="mt-3 text-[11px] font-medium text-black/70">
                {result.exercisesDone}/{seq.length} exercices validés
                {result.xp > 0 ? ' • publié sur ton fil DEK' : ` • valide-en ${Math.ceil(seq.length * MIN_VALIDATED_RATIO)} pour l’XP`}
              </p>
            </motion.div>

            <motion.button
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileTap={{ scale: 0.96 }}
              onClick={onExit}
              className="font-hud mt-5 w-full rounded-full bg-white py-3.5 text-sm font-bold text-black"
            >
              Terminer
            </motion.button>
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
            className="absolute inset-0 z-20 flex items-end bg-black/70 p-3 backdrop-blur-sm"
            onClick={() => setConfirmExit(false)}
          >
            <motion.div
              initial={{ y: 40 }}
              animate={{ y: 0 }}
              exit={{ y: 40 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full rounded-[28px] border border-white/10 bg-[#121722] p-4"
            >
              <h3 className="font-hud text-base font-bold text-white">Quitter la séance ?</h3>
              <p className="mt-1 text-xs text-slate-400">
                Tu as validé {doneSteps.size}/{seq.length} exercices ({progressPct}%). Ta progression est
                gardée 24 h : tu pourras reprendre où tu t’es arrêté.
              </p>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <button
                  onClick={() => setConfirmExit(false)}
                  className="font-hud rounded-full bg-[#C8FF00] py-3 text-xs font-bold text-black"
                >
                  Continuer
                </button>
                <button
                  onClick={handleExit}
                  className="font-hud rounded-full border border-[#FF2E54]/50 bg-[#FF2E54]/10 py-3 text-xs font-bold text-[#FF2E54]"
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
