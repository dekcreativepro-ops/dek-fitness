import { useEffect, useRef, useState } from 'react';
// Type seulement : la librairie MediaPipe (lourde) est chargée à la demande
// quand l'athlète active la caméra, pas au démarrage de l'app.
import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import { AnimatePresence, motion } from 'framer-motion';
import { Check, CameraSlash, PlayCircle, X } from './DekIcons';
import { Button, ChipTabs, IconButton } from './ui/kit';
import type {
  HouseExercise,
  HouseGameMode,
  MissionDifficulty,
  UserAvatarConfig,
} from '../types/dek';
import { HOUSE_OPPONENTS_BY_TIER, TIER_COLORS } from '../utils/categorization';
import { usePhoto } from '../utils/usePhoto';
import { playGo, playHit, playTick, playVictory } from '../utils/soundFx';
import { ExerciseDemoCanvas } from './ExerciseDemoCanvas';
import { UserAvatar } from './UserAvatar';

import { AlertGlow, BestMedal, BonusPill, GameLegend, GameOptionsCard } from './ui/GameKit';
import { useAlertGlow, useChronoBonus, useGamePrefs } from './ui/gameHooks';
import { levelFromScore, loadGameRecord, saveGameRecord, vibrate } from '../utils/gameFx';

interface DefiHouseViewProps {
  userCategory: MissionDifficulty;
  userAvatar: UserAvatarConfig;
  onWinDuel: (
    xpEarned: number,
    exercise: string,
    reps: number,
    modeLabel?: string,
  ) => void;
}

interface FloatingHit {
  id: number;
  text: string;
  target: 'opp' | 'me';
}

const EXERCISES: { id: HouseExercise; label: string; tip: string }[] = [
  { id: 'pompes', label: 'Pompes', tip: 'Descends bas, garde le corps aligné.' },
  { id: 'squats', label: 'Squats', tip: 'Genoux dans l’axe, descends les hanches.' },
  { id: 'jumping_jacks', label: 'Jacks', tip: 'Bras hauts au-dessus de la tête.' },
  { id: 'corde', label: 'Corde', tip: 'Rebonds réguliers devant la caméra.' },
  { id: 'gainage', label: 'Gainage', tip: 'Corps droit, abdos serrés et respiration stable.' },
  { id: 'burpees', label: 'Burpees', tip: 'Descends en planche puis saut explosif.' },
];

const HOUSE_MODES: {
  id: HouseGameMode;
  label: string;
  shortDesc: string;
  xpReward: number;
}[] = [
  { id: 'ko_60s', label: '1v1 K.O. 60s', shortDesc: 'Mets l’adversaire K.O. en 60s', xpReward: 250 },
  { id: 'first_to_20', label: '1er à 20', shortDesc: 'Sprint technique jusqu’à 20 reps', xpReward: 260 },
  { id: 'survie_maison', label: 'Survie', shortDesc: 'Ne laisse pas ta jauge tomber (4.5s)', xpReward: 300 },
  { id: 'equipe_4v4', label: 'Équipe 4v4', shortDesc: 'DEK Squad vs Iron Crew (80 reps)', xpReward: 320 },
];

/** Difficulté d'un défi : mode + exercice + force de l'adversaire. */
const MODE_BASE: Record<HouseGameMode, number> = { ko_60s: 4.5, first_to_20: 5, survie_maison: 6.5, equipe_4v4: 6 };
const EXERCISE_LOAD: Record<HouseExercise, number> = { pompes: 1.5, squats: 1, jumping_jacks: 0, corde: 1.5, gainage: 1, burpees: 2.5 };
const BONUS_NEED: Record<MissionDifficulty, number> = { Amateur: 6, Standard: 8, Pro: 10, Expert: 12 };

const POSE_CONNECTIONS: [number, number][] = [
  [11, 12],
  [11, 13],
  [13, 15],
  [12, 14],
  [14, 16],
  [11, 23],
  [12, 24],
  [23, 24],
  [23, 25],
  [25, 27],
  [24, 26],
  [26, 28],
];

const OPPONENT_AVATARS: Record<MissionDifficulty, UserAvatarConfig> = {
  Amateur: {
    mode: 'preset',
    presetId: 'manga-fighter',
    diceStyle: 'lorelei',
    seed: 'Awa',
    bgColor: '0f172a',
    auraColor: '#38BDF8',
  },
  Standard: {
    mode: 'preset',
    presetId: 'fantasy-paladin',
    diceStyle: 'adventurer',
    seed: 'Moussa',
    bgColor: '0f172a',
    auraColor: '#C8FF00',
  },
  Pro: {
    mode: 'preset',
    presetId: 'manga-sprint',
    diceStyle: 'lorelei',
    seed: 'Koffi',
    bgColor: '0f172a',
    auraColor: '#FF8A00',
  },
  Expert: {
    mode: 'preset',
    presetId: 'fantasy-shadow',
    diceStyle: 'bottts',
    seed: 'Titan',
    bgColor: '0f172a',
    auraColor: '#FF2E54',
  },
};

function computeAngle(
  a: { x: number; y: number },
  b: { x: number; y: number },
  c: { x: number; y: number },
) {
  const rad = Math.atan2(c.y - b.y, c.x - b.x) - Math.atan2(a.y - b.y, a.x - b.x);
  let deg = Math.abs((rad * 180) / Math.PI);
  if (deg > 180) deg = 360 - deg;
  return deg;
}

/** Doit rester aligné avec la version de @mediapipe/tasks-vision du package.json. */
const MEDIAPIPE_VERSION = '1.2.3';
const MEDIAPIPE_WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const POSE_MODEL_URL =
  'https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task';

const SURVIVAL_MAX_MS = 4500;
const FIRST_TO_TARGET = 20;
const SQUAD_TARGET_REPS = 80;

export function DefiHouseView({
  userCategory,
  userAvatar,
  onWinDuel,
}: DefiHouseViewProps) {
  const housePhoto = usePhoto('house', 'card');
  const opponent = HOUSE_OPPONENTS_BY_TIER[userCategory];
  const oppAvatar = OPPONENT_AVATARS[userCategory];

  const [gameMode, setGameMode] = useState<HouseGameMode>('ko_60s');
  const [exercise, setExercise] = useState<HouseExercise>('pompes');
  const [showDemo, setShowDemo] = useState(false);
  const [matchState, setMatchState] = useState<'idle' | 'fighting' | 'win' | 'lose'>('idle');
  const [endReason, setEndReason] = useState<string>('');

  const [myHp, setMyHp] = useState(100);
  const [oppHp, setOppHp] = useState(100);
  const [oppTrailHp, setOppTrailHp] = useState(100);
  const [myReps, setMyReps] = useState(0);
  const [oppReps, setOppReps] = useState(0);
  const [mySquadReps, setMySquadReps] = useState(0);
  const [oppSquadReps, setOppSquadReps] = useState(0);
  const [staminaMs, setStaminaMs] = useState(SURVIVAL_MAX_MS);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [depthPct, setDepthPct] = useState(20);
  const [liveCue, setLiveCue] = useState('Prêt pour le duel');
  const [popups, setPopups] = useState<FloatingHit[]>([]);

  const [cameraActive, setCameraActive] = useState(false);
  const [aiStatus, setAiStatus] = useState('Caméra prête');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const landmarkerRef = useRef<PoseLandmarker | null>(null);
  const rafRef = useRef<number | null>(null);
  const stageRef = useRef<'up' | 'down'>('up');
  const lastPlankTickRef = useRef<number>(0);

  const matchStateRef = useRef(matchState);
  const exerciseRef = useRef(exercise);
  const gameModeRef = useRef(gameMode);
  const myHpRef = useRef(myHp);
  const oppHpRef = useRef(oppHp);
  const myRepsRef = useRef(myReps);
  const oppRepsRef = useRef(oppReps);
  const mySquadRef = useRef(mySquadReps);
  const oppSquadRef = useRef(oppSquadReps);
  const comboTimerRef = useRef<number | null>(null);
  // Jeton de session caméra : s'incrémente à chaque arrêt pour annuler un démarrage en cours
  const cameraSessionRef = useRef(0);
  const lastDepthRef = useRef(-1);
  const lastCueRef = useRef('');

  useEffect(() => {
    matchStateRef.current = matchState;
  }, [matchState]);

  useEffect(() => {
    exerciseRef.current = exercise;
  }, [exercise]);

  useEffect(() => {
    gameModeRef.current = gameMode;
  }, [gameMode]);

  useEffect(() => {
    myHpRef.current = myHp;
  }, [myHp]);

  useEffect(() => {
    myRepsRef.current = myReps;
  }, [myReps]);

  useEffect(() => {
    oppRepsRef.current = oppReps;
  }, [oppReps]);

  useEffect(() => {
    mySquadRef.current = mySquadReps;
  }, [mySquadReps]);

  useEffect(() => {
    oppSquadRef.current = oppSquadReps;
  }, [oppSquadReps]);

  useEffect(() => {
    oppHpRef.current = oppHp;
    const t = setTimeout(() => setOppTrailHp(oppHp), 280);
    return () => clearTimeout(t);
  }, [oppHp]);

  const spawnPopup = (text: string, target: 'opp' | 'me') => {
    const id = Date.now() + Math.random();
    setPopups((prev) => [...prev.slice(-3), { id, text, target }]);
    setTimeout(() => {
      setPopups((prev) => prev.filter((p) => p.id !== id));
    }, 620);
  };

  // Jeu : réglages, alertes (vibration + halo), bonus chrono et records
  const [prefs, setPrefs] = useGamePrefs('house');
  const { glowKey, glowOn, alert } = useAlertGlow(prefs.alerts);
  const alertFlagsRef = useRef({ win: false, time: false, stamina: false });
  const [recordTick, setRecordTick] = useState(0);
  const chrono = useChronoBonus({
    enabled: prefs.bonus,
    active: matchState === 'fighting',
    progress: myReps,
    need: BONUS_NEED[userCategory] ?? 8,
    base: 15,
    label: 'Défi chrono',
    onWin: (xp) => {
      spawnPopup(`Bonus +${xp} XP`, 'opp');
      if (prefs.alerts) vibrate(60);
    },
    onMiss: () => spawnPopup('Bonus raté', 'me'),
    onNear: () => alert('near'),
  });

  // Alertes : victoire proche, dernières secondes, jauge de survie presque vide
  useEffect(() => {
    if (matchState !== 'fighting') return;
    const f = alertFlagsRef.current;
    const nearWin =
      gameMode === 'ko_60s' || gameMode === 'survie_maison'
        ? oppHp <= 15
        : gameMode === 'first_to_20'
          ? myReps >= FIRST_TO_TARGET - 3
          : mySquadReps >= SQUAD_TARGET_REPS - 8;
    if (nearWin && !f.win) {
      f.win = true;
      alert('finish');
    }
    if (timeLeft <= 5 && timeLeft > 0 && !f.time) {
      f.time = true;
      alert('near');
    }
    if (gameMode === 'survie_maison') {
      if (staminaMs < 1200 && !f.stamina) {
        f.stamina = true;
        alert('near');
      } else if (staminaMs > 2500) {
        f.stamina = false;
      }
    }
  }, [matchState, gameMode, oppHp, myReps, mySquadReps, timeLeft, staminaMs, alert]);

  /** Limite les re-rendus : on ne met à jour la jauge / le conseil que s'ils changent. */
  const updateDepth = (pct: number) => {
    if (Math.abs(pct - lastDepthRef.current) < 3) return;
    lastDepthRef.current = pct;
    setDepthPct(pct);
  };
  const updateCue = (cue: string) => {
    if (cue === lastCueRef.current) return;
    lastCueRef.current = cue;
    setLiveCue(cue);
  };

  const registerMyRep = () => {
    if (matchStateRef.current !== 'fighting') return;
    playHit();
    const mode = gameModeRef.current;
    const step = exerciseRef.current === 'gainage' ? 2 : 1;

    setMyReps((prev) => {
      const next = prev + step;
      if (mode === 'first_to_20' && next >= FIRST_TO_TARGET) {
        setEndReason(`Premier à ${FIRST_TO_TARGET} reps !`);
        setMatchState('win');
      }
      return next;
    });

    updateDepth(88);
    updateCue(
      mode === 'survie_maison'
        ? 'Jauge rechargée ! Tiens la cadence'
        : exerciseRef.current === 'gainage'
          ? 'Gainage validé (+2s) !'
          : 'Rep validée ! Continue',
    );
    setTimeout(() => updateDepth(22), 200);

    setCombo((c) => {
      const next = c + 1;
      if (mode === 'equipe_4v4') {
        spawnPopup(`+${step} Squad`, 'opp');
      } else if (mode === 'survie_maison') {
        spawnPopup(`Survie +4.5s`, 'opp');
      } else if (mode === 'first_to_20') {
        spawnPopup(`+${step} rep`, 'opp');
      } else {
        spawnPopup(next >= 3 ? `-5 HP • x${next}` : '-5 HP', 'opp');
      }
      return next;
    });
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = window.setTimeout(() => setCombo(0), 2200);

    if (mode === 'survie_maison') {
      setStaminaMs(SURVIVAL_MAX_MS);
      setOppHp((hp) => {
        const next = Math.max(0, hp - 4);
        if (next === 0) {
          setEndReason('Adversaire épuisé en Survie !');
          setMatchState('win');
        }
        return next;
      });
    } else if (mode === 'equipe_4v4') {
      setMySquadReps((prev) => {
        const next = prev + step;
        if (next >= SQUAD_TARGET_REPS) {
          setEndReason(`DEK Squad atteint ${SQUAD_TARGET_REPS} reps !`);
          setMatchState('win');
        }
        return next;
      });
    } else if (mode === 'ko_60s') {
      setOppHp((hp) => {
        const next = Math.max(0, hp - 5);
        if (next === 0) {
          setEndReason('K.O. technique avant la fin !');
          setMatchState('win');
        }
        return next;
      });
    }
  };

  // Dernières valeurs lues au moment de la victoire (l'effet ne doit réagir qu'au passage en 'win')
  const winInfoRef = useRef({ exercise, gameMode, onWinDuel, getBonusXp: chrono.getTotalXp });
  useEffect(() => {
    winInfoRef.current = { exercise, gameMode, onWinDuel, getBonusXp: chrono.getTotalXp };
  });

  useEffect(() => {
    if (matchState !== 'win') return;
    const info = winInfoRef.current;
    playVictory();
    const exLabel = EXERCISES.find((e) => e.id === info.exercise)?.label ?? 'Pompes';
    const modeObj = HOUSE_MODES.find((m) => m.id === info.gameMode) ?? HOUSE_MODES[0];
    info.onWinDuel(modeObj.xpReward + info.getBonusXp(), exLabel, myRepsRef.current, modeObj.label);
    saveGameRecord(`house:${info.gameMode}:${info.exercise}`, myRepsRef.current);
    window.setTimeout(() => setRecordTick((t) => t + 1), 0);
  }, [matchState]);

  useEffect(() => {
    if (matchState !== 'fighting') return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 4 && t > 1) playTick();
        if (t <= 1) {
          clearInterval(timer);
          setMatchState((cur) => {
            if (cur !== 'fighting') return cur;
            const mode = gameModeRef.current;
            if (mode === 'survie_maison') {
              setEndReason('Tu as tenu les 45s de Survie !');
              return 'win';
            }
            if (mode === 'first_to_20') {
              const won = myRepsRef.current >= oppRepsRef.current;
              setEndReason(won ? 'En tête à la fin du chrono !' : 'Adversaire devant au chrono');
              return won ? 'win' : 'lose';
            }
            if (mode === 'equipe_4v4') {
              const won = mySquadRef.current >= oppSquadRef.current;
              setEndReason(
                won
                  ? `DEK Squad l’emporte (${mySquadRef.current} vs ${oppSquadRef.current})`
                  : `Iron Crew gagne (${oppSquadRef.current} vs ${mySquadRef.current})`,
              );
              return won ? 'win' : 'lose';
            }
            const won = oppHpRef.current <= myHpRef.current;
            setEndReason(won ? 'Victoire aux points !' : 'Adversaire plus endurant');
            return won ? 'win' : 'lose';
          });
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    // Opponent / teammates simulation depending on mode
    const oppInterval = setInterval(() => {
      if (matchStateRef.current !== 'fighting') return;
      const mode = gameModeRef.current;

      if (mode === 'equipe_4v4') {
        // 3 teammates help your squad
        const allyAdd = Math.random() < 0.72 ? 2 : 1;
        setMySquadReps((prev) => {
          const next = prev + allyAdd;
          if (next >= SQUAD_TARGET_REPS) {
            setEndReason(`DEK Squad atteint ${SQUAD_TARGET_REPS} reps !`);
            setMatchState('win');
          }
          return next;
        });
        // Iron Crew 4 bots score
        const oppAdd = Math.random() < opponent.hitChance ? 3 : 2;
        setOppSquadReps((prev) => {
          const next = prev + oppAdd;
          if (next >= SQUAD_TARGET_REPS) {
            setEndReason(`Iron Crew atteint ${SQUAD_TARGET_REPS} reps en premier`);
            setMatchState('lose');
          }
          return next;
        });
        return;
      }

      if (Math.random() < opponent.hitChance) {
        setOppReps((prev) => {
          const next = prev + 1;
          if (mode === 'first_to_20' && next >= FIRST_TO_TARGET) {
            setEndReason(`${opponent.name} atteint ${FIRST_TO_TARGET} reps en premier`);
            setMatchState('lose');
          }
          return next;
        });

        if (mode === 'ko_60s') {
          spawnPopup('-5 HP', 'me');
          setMyHp((hp) => {
            const next = Math.max(0, hp - 5);
            if (next === 0) {
              setEndReason('K.O. subi');
              setMatchState('lose');
            }
            return next;
          });
        }
      }
    }, opponent.intervalMs);

    // Survival stamina drain loop (100ms tick)
    const survivalInterval =
      gameMode === 'survie_maison'
        ? setInterval(() => {
            if (matchStateRef.current !== 'fighting') return;
            setStaminaMs((prev) => {
              const next = Math.max(0, prev - 100);
              if (next === 0) {
                setEndReason('Cadence rompue (jauge Survie vide)');
                setMatchState('lose');
              }
              return next;
            });
          }, 100)
        : null;

    return () => {
      clearInterval(timer);
      clearInterval(oppInterval);
      if (survivalInterval) clearInterval(survivalInterval);
    };
  }, [matchState, gameMode, opponent.hitChance, opponent.intervalMs, opponent.name]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && matchStateRef.current === 'fighting') {
        e.preventDefault();
        registerMyRep();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  const stopStream = (stream: MediaStream | null | undefined) => {
    stream?.getTracks().forEach((t) => t.stop());
  };

  const createLandmarker = async (): Promise<PoseLandmarker> => {
    const { FilesetResolver, PoseLandmarker: Landmarker } = await import('@mediapipe/tasks-vision');
    const vision = await FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
    try {
      return await Landmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'GPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
    } catch {
      // Certains téléphones Android n'ont pas de WebGL2 compatible : repli sur le CPU
      return Landmarker.createFromOptions(vision, {
        baseOptions: { modelAssetPath: POSE_MODEL_URL, delegate: 'CPU' },
        runningMode: 'VIDEO',
        numPoses: 1,
      });
    }
  };

  const startCameraAI = async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      setAiStatus('Caméra non supportée • Mode tactile');
      return;
    }
    const session = ++cameraSessionRef.current;
    let stream: MediaStream | null = null;
    try {
      setAiStatus('Accès caméra...');
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'user', width: 640, height: 480 },
        audio: false,
      });
      if (session !== cameraSessionRef.current || !videoRef.current) {
        // L'utilisateur a quitté l'écran ou coupé la caméra pendant la demande
        stopStream(stream);
        return;
      }

      videoRef.current.srcObject = stream;
      await videoRef.current.play();
      setCameraActive(true);

      if (!landmarkerRef.current) {
        setAiStatus('Chargement IA...');
        const landmarker = await createLandmarker();
        if (session !== cameraSessionRef.current) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
      }
      setAiStatus('IA Active');

      let lastVideoTime = -1;
      const detectLoop = () => {
        if (!videoRef.current || !canvasRef.current || !landmarkerRef.current) return;
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');

        if (video.readyState >= 2 && video.currentTime !== lastVideoTime) {
          lastVideoTime = video.currentTime;
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;

          const result = landmarkerRef.current.detectForVideo(video, performance.now());
          if (ctx) {
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            const lm = result.landmarks?.[0];
            if (lm && lm.length >= 29) {
              ctx.save();
              ctx.strokeStyle = '#C8FF00';
              ctx.lineWidth = 4;
              ctx.lineCap = 'round';
              for (const [i, j] of POSE_CONNECTIONS) {
                const a = lm[i];
                const b = lm[j];
                if (!a || !b) continue;
                ctx.beginPath();
                ctx.moveTo(a.x * canvas.width, a.y * canvas.height);
                ctx.lineTo(b.x * canvas.width, b.y * canvas.height);
                ctx.stroke();
              }
              ctx.restore();

              for (const idx of [11, 12, 13, 14, 15, 16, 23, 24, 25, 26, 27, 28]) {
                const p = lm[idx];
                ctx.beginPath();
                ctx.arc(p.x * canvas.width, p.y * canvas.height, 4.5, 0, Math.PI * 2);
                ctx.fillStyle = '#FFFFFF';
                ctx.fill();
                ctx.strokeStyle = '#C8FF00';
                ctx.lineWidth = 2;
                ctx.stroke();
              }

              const ex = exerciseRef.current;
              if (ex === 'pompes') {
                const angle = computeAngle(lm[11], lm[13], lm[15]);
                const ratio = Math.max(0, Math.min(100, Math.round(((170 - angle) / 85) * 100)));
                updateDepth(ratio);
                if (angle < 95 && stageRef.current === 'up') {
                  stageRef.current = 'down';
                  updateCue('Pousse vers le haut !');
                } else if (angle > 155 && stageRef.current === 'down') {
                  stageRef.current = 'up';
                  registerMyRep();
                } else if (stageRef.current === 'up') {
                  updateCue('Descends plus bas...');
                }
              } else if (ex === 'squats') {
                const angle = computeAngle(lm[23], lm[25], lm[27]);
                const ratio = Math.max(0, Math.min(100, Math.round(((170 - angle) / 75) * 100)));
                updateDepth(ratio);
                if (angle < 105 && stageRef.current === 'up') {
                  stageRef.current = 'down';
                  updateCue('Remonte fort !');
                } else if (angle > 160 && stageRef.current === 'down') {
                  stageRef.current = 'up';
                  registerMyRep();
                } else if (stageRef.current === 'up') {
                  updateCue('Fléchis les genoux...');
                }
              } else if (ex === 'gainage') {
                const aligned = Math.abs(lm[11].y - lm[23].y) < 0.16;
                updateDepth(aligned ? 85 : 30);
                if (aligned && matchStateRef.current === 'fighting') {
                  const now = performance.now();
                  if (now - lastPlankTickRef.current >= 1600) {
                    lastPlankTickRef.current = now;
                    registerMyRep();
                  }
                } else {
                  updateCue('Aligne épaules & hanches...');
                }
              } else if (ex === 'burpees') {
                const hipsLow = lm[23].y > 0.68;
                const handsUp = lm[15].y < lm[11].y - 0.06 && lm[16].y < lm[12].y - 0.06;
                updateDepth(hipsLow ? 92 : handsUp ? 12 : 48);
                if (hipsLow && stageRef.current === 'up') {
                  stageRef.current = 'down';
                  updateCue('Saute bras en l’air !');
                } else if (handsUp && stageRef.current === 'down') {
                  stageRef.current = 'up';
                  registerMyRep();
                }
              } else {
                const wristsHigh = lm[15].y < lm[11].y - 0.05 && lm[16].y < lm[12].y - 0.05;
                const wristsLow = lm[15].y > lm[11].y + 0.08 && lm[16].y > lm[12].y + 0.08;
                updateDepth(wristsHigh ? 90 : 20);
                if (wristsHigh && stageRef.current === 'up') {
                  stageRef.current = 'down';
                  updateCue('Redescends !');
                } else if (wristsLow && stageRef.current === 'down') {
                  stageRef.current = 'up';
                  registerMyRep();
                }
              }
            }
          }
        }
        rafRef.current = requestAnimationFrame(detectLoop);
      };
      rafRef.current = requestAnimationFrame(detectLoop);
    } catch (err) {
      if (session !== cameraSessionRef.current) return;
      // Toujours libérer la caméra si l'IA n'a pas pu démarrer
      stopStream(stream);
      if (videoRef.current) videoRef.current.srcObject = null;
      setCameraActive(false);
      const denied = err instanceof DOMException && err.name === 'NotAllowedError';
      setAiStatus(denied ? 'Caméra refusée • Mode tactile' : 'IA indisponible • Mode tactile');
    }
  };

  const stopCameraAI = () => {
    cameraSessionRef.current += 1;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (videoRef.current?.srcObject) {
      stopStream(videoRef.current.srcObject as MediaStream);
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
    setAiStatus('Caméra coupée');
  };

  useEffect(() => {
    const video = videoRef.current;
    return () => {
      // Démontage : coupe la caméra, la boucle IA et libère le modèle MediaPipe
      cameraSessionRef.current += 1;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      if (video?.srcObject) {
        (video.srcObject as MediaStream).getTracks().forEach((t) => t.stop());
        video.srcObject = null;
      }
      landmarkerRef.current?.close();
      landmarkerRef.current = null;
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    };
  }, []);

  const startDuel = () => {
    playGo();
    setShowDemo(false);
    setEndReason('');
    setMyHp(100);
    setOppHp(100);
    setOppTrailHp(100);
    setMyReps(0);
    setOppReps(0);
    setMySquadReps(0);
    setOppSquadReps(0);
    setStaminaMs(SURVIVAL_MAX_MS);
    setCombo(0);
    setTimeLeft(gameMode === 'survie_maison' ? 45 : 60);
    chrono.reset();
    alertFlagsRef.current = { win: false, time: false, stamina: false };
    updateCue('C’est parti !');
    setMatchState('fighting');
  };

  const activeEx = EXERCISES.find((e) => e.id === exercise) ?? EXERCISES[0];
  const activeMode = HOUSE_MODES.find((m) => m.id === gameMode) ?? HOUSE_MODES[0];
  const staminaPct = Math.round((staminaMs / SURVIVAL_MAX_MS) * 100);
  const levelScore = MODE_BASE[gameMode] + EXERCISE_LOAD[exercise] + opponent.hitChance * 4;
  const level = levelFromScore(levelScore, [6.5, 8.5, 10.5]);
  const recordKey = `house:${gameMode}:${exercise}`;
  // recordTick force la relecture du record après une victoire
  const record = recordTick >= 0 ? loadGameRecord(recordKey) : null;
  const fighting = matchState === 'fighting';

  // Deux lignes HUD (adversaire / toi) selon le mode actif
  const oppName = gameMode === 'equipe_4v4' ? 'Iron Crew (4)' : opponent.name;
  const hud: {
    opp: { sub: string; value: string; pct: number; trail?: number };
    me: { name: string; sub: string; value: string; pct: number; danger?: boolean };
  } =
    gameMode === 'ko_60s'
      ? {
          opp: { sub: `${oppReps} reps adv.`, value: `${oppHp}%`, pct: oppHp, trail: oppTrailHp },
          me: { name: 'Toi', sub: 'Ta vie', value: `${myHp}%`, pct: myHp },
        }
      : gameMode === 'first_to_20'
        ? {
            opp: {
              sub: `${oppReps} reps adv.`,
              value: `${oppReps}/${FIRST_TO_TARGET}`,
              pct: Math.min(100, (oppReps / FIRST_TO_TARGET) * 100),
            },
            me: {
              name: 'Toi',
              sub: `${myReps} reps`,
              value: `${myReps}/${FIRST_TO_TARGET}`,
              pct: Math.min(100, (myReps / FIRST_TO_TARGET) * 100),
            },
          }
        : gameMode === 'survie_maison'
          ? {
              opp: { sub: `${oppReps} reps adv.`, value: `${oppHp}%`, pct: oppHp, trail: oppTrailHp },
              me: {
                name: 'Jauge Survie',
                sub: 'Une rep avant 0 s',
                value: `${(staminaMs / 1000).toFixed(1)}s`,
                pct: staminaPct,
                danger: staminaPct < 35,
              },
            }
          : {
              opp: {
                sub: `${oppSquadReps}/${SQUAD_TARGET_REPS} reps équipe`,
                value: `${oppSquadReps}/${SQUAD_TARGET_REPS}`,
                pct: Math.min(100, (oppSquadReps / SQUAD_TARGET_REPS) * 100),
              },
              me: {
                name: 'DEK Squad',
                sub: `${mySquadReps}/${SQUAD_TARGET_REPS} reps équipe`,
                value: `${mySquadReps}/${SQUAD_TARGET_REPS}`,
                pct: Math.min(100, (mySquadReps / SQUAD_TARGET_REPS) * 100),
              },
            };

  return (
    <div className="space-y-4 pb-2">
      {/* Sélecteur de mode de combat (4 modes) */}
      <div className={fighting ? 'pointer-events-none opacity-50' : ''}>
        <ChipTabs
          items={HOUSE_MODES.map((m) => ({ id: m.id, label: m.label }))}
          value={gameMode}
          onChange={(id) => {
            if (!fighting) setGameMode(id);
          }}
          layoutId="houseModePill"
        />
      </div>

      {/* Pilules des 6 exercices + bouton Démo */}
      <div className="flex items-center gap-2">
        <div className="no-scrollbar flex flex-1 gap-2 overflow-x-auto">
          {EXERCISES.map((ex) => {
            const active = exercise === ex.id;
            return (
              <button
                key={ex.id}
                disabled={fighting}
                onClick={() => setExercise(ex.id)}
                className={`h-9 shrink-0 rounded-full px-4 text-[13px] font-semibold transition-colors disabled:opacity-50 ${
                  active ? 'bg-fg text-ink' : 'bg-tile text-mute'
                }`}
              >
                {ex.label}
              </button>
            );
          })}
        </div>
        <button
          onClick={() => setShowDemo((v) => !v)}
          className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold transition-colors ${
            showDemo ? 'bg-lime text-on-lime' : 'bg-tile text-fg'
          }`}
        >
          <PlayCircle className="h-4 w-4" /> Démo
        </button>
      </div>

      {/* Scène caméra : grande carte média */}
      <div className="relative flex h-[440px] w-full flex-col justify-between overflow-hidden rounded-[28px] bg-card">
        {!cameraActive && (
          <>
            <img
              src={housePhoto}
              alt="Studio Défi House"
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60" />
          </>
        )}

        <video
          ref={videoRef}
          playsInline
          muted
          className={`absolute inset-0 h-full w-full scale-x-[-1] object-cover ${
            cameraActive ? 'block' : 'hidden'
          }`}
        />
        <canvas
          ref={canvasRef}
          className={`pointer-events-none absolute inset-0 h-full w-full scale-x-[-1] ${
            cameraActive ? 'block' : 'hidden'
          }`}
        />
        {cameraActive && (
          <div className="pointer-events-none absolute inset-x-0 top-0 h-36 bg-linear-to-b from-black/60 to-transparent" />
        )}

        {/* HUD haut : adversaire puis toi */}
        <div className="relative z-20 space-y-3 p-4 pr-8">
          <div className="flex items-center gap-3">
            <UserAvatar avatar={oppAvatar} size="xs" />
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <span className="truncate text-[13px] font-bold leading-4 text-white">{oppName}</span>
                <span
                  className="rounded-full px-2 py-px text-[11px] font-semibold"
                  style={{
                    backgroundColor: `${TIER_COLORS[userCategory]}22`,
                    color: TIER_COLORS[userCategory],
                  }}
                >
                  {userCategory}
                </span>
              </div>
              <HudBar value={hud.opp.pct} trail={hud.opp.trail} tone="bg-white" />
            </div>
            <span className="num w-14 shrink-0 text-right text-[13px] font-bold text-white">{hud.opp.value}</span>
          </div>
          <div className="flex items-center gap-3">
            <UserAvatar avatar={userAvatar} size="xs" />
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="truncate text-[13px] font-bold leading-4 text-white">{hud.me.name}</span>
                <span className="truncate text-[11px] font-medium text-white/70">{hud.me.sub}</span>
              </div>
              <HudBar value={hud.me.pct} tone={hud.me.danger ? 'bg-danger' : 'bg-lime'} />
            </div>
            <span className="num w-14 shrink-0 text-right text-[13px] font-bold text-lime">{hud.me.value}</span>
          </div>
        </div>

        {/* Centre : démo GIF OU présentation + bouton caméra */}
        {showDemo ? (
          <div className="relative z-30 mx-4 my-auto">
            <div className="relative">
              <div className="absolute right-2 top-2 z-20">
                <IconButton label="Fermer la démo" variant="glass" size={32} onClick={() => setShowDemo(false)}>
                  <X className="h-4 w-4" />
                </IconButton>
              </div>
              <ExerciseDemoCanvas exercise={exercise} />
            </div>
          </div>
        ) : !cameraActive ? (
          <div className="relative z-10 mx-auto flex max-w-xs flex-col items-center px-4 text-center">
            <span className="rounded-full bg-black/50 px-3 py-1 text-[12px] font-semibold text-lime">
              {activeMode.label} • +{activeMode.xpReward} XP
            </span>
            <p className="mt-2 text-[20px] font-bold leading-6 text-white">{activeEx.label} • Arène IA</p>
            <p className="mt-1 text-[13px] font-medium text-white/80">{activeMode.shortDesc}</p>
            <p className="mt-0.5 text-[12px] font-medium text-white/60">{activeEx.tip}</p>
            <div className="mt-3">
              <Button variant="secondary" size="md" onClick={() => void startCameraAI()}>
                Activer la caméra
              </Button>
            </div>
          </div>
        ) : (
          <div className="absolute right-4 top-28 z-20">
            <IconButton label="Couper la caméra" variant="glass" size={36} onClick={stopCameraAI}>
              <CameraSlash className="h-[18px] w-[18px] text-danger" />
            </IconButton>
          </div>
        )}

        {/* Jauge DEPTH verticale, fine */}
        <div className="pointer-events-none absolute bottom-40 right-3 top-32 z-20 flex flex-col items-center gap-1.5">
          <span className="text-[11px] font-medium text-white/70">Depth</span>
          <div className="relative w-1 flex-1 rounded-full bg-white/20">
            <motion.div
              animate={{ top: `${Math.min(88, Math.max(4, depthPct))}%` }}
              transition={{ duration: 0.14 }}
              className="absolute -inset-x-0.5 h-2.5 rounded-full bg-white"
            />
          </div>
        </div>

        {/* Popups flottants */}
        <AnimatePresence>
          {popups.map((p) => (
            <motion.div
              key={p.id}
              initial={{ opacity: 0, y: 8, scale: 0.9 }}
              animate={{ opacity: 1, y: -26, scale: 1 }}
              exit={{ opacity: 0, y: -44 }}
              className={`pointer-events-none absolute top-32 z-30 rounded-full px-3 py-1 text-[13px] font-bold ${
                p.target === 'opp' ? 'right-12 bg-lime text-on-lime' : 'left-4 bg-danger text-white'
              }`}
            >
              {p.text}
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Bas de la scène : compteur de reps géant */}
        <div className="relative z-20 bg-linear-to-t from-black/85 via-black/45 to-transparent px-4 pb-4 pt-10 text-center">
          <div className="mb-1 flex items-center justify-center gap-2">
            <span className="num rounded-full bg-black/50 px-3 py-0.5 text-[13px] font-semibold text-white">
              {timeLeft}s
            </span>
            {combo >= 2 && fighting && (
              <span className="rounded-full bg-fg px-3 py-0.5 text-[13px] font-bold text-ink">Combo x{combo}</span>
            )}
          </div>
          <div className="num text-[88px] font-extrabold leading-none text-lime">
            {myReps}
            <span className="ml-2 text-[16px] font-semibold text-white/70">
              {exercise === 'gainage' ? 'sec' : 'reps'}
            </span>
          </div>
          <div className="mx-auto mt-3 flex w-full max-w-xs items-center justify-center rounded-full bg-black/55 px-4 py-1.5 text-[12px] font-medium text-white/90">
            <span className="truncate">{cameraActive ? liveCue : `${aiStatus} • ${liveCue}`}</span>
          </div>
        </div>

        {/* Victoire / Défaite */}
        <AnimatePresence>
          {(matchState === 'win' || matchState === 'lose') && (
            <motion.div
              initial={{ opacity: 0, scale: 1.04 }}
              animate={{ opacity: 1, scale: 1 }}
              className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 p-5"
            >
              {matchState === 'win' ? (
                <div className="w-full rounded-[28px] bg-lime p-6 text-center text-on-lime">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-ink text-lime">
                    <Check weight="bold" className="h-8 w-8" />
                  </div>
                  <h3 className="mt-3 text-[22px] font-extrabold leading-7">Victoire • {activeMode.label}</h3>
                  <p className="mt-1 text-[13px] font-medium">
                    {endReason || `${myReps} ${activeEx.label}`} •{' '}
                    <strong className="font-bold">+{activeMode.xpReward + chrono.totalXp} XP</strong>
                    {chrono.totalXp > 0 && ` (dont ${chrono.totalXp} de bonus)`}
                  </p>
                  <div className="mt-4">
                    <Button variant="secondary" fullWidth onClick={startDuel}>
                      Revanche immédiate
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="w-full rounded-[28px] bg-card p-6 text-center">
                  <h3 className="text-[22px] font-extrabold leading-7 text-danger">Défaite</h3>
                  <p className="mt-1 text-[13px] font-medium text-mute">
                    {endReason || `${opponent.name} gagne (${oppReps} vs ${myReps})`}
                  </p>
                  <div className="mt-4">
                    <Button fullWidth onClick={startDuel}>
                      Revanche immédiate
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Actions au pouce */}
      {matchState === 'idle' ? (
        <Button fullWidth onClick={startDuel}>
          Lancer • {activeMode.label}
        </Button>
      ) : fighting ? (
        <div className="space-y-2">
          {chrono.bonus && (
            <BonusPill
              label="Défi chrono"
              hint={`Encore ${Math.max(0, chrono.bonus.target - myReps)} reps avant la fin du chrono`}
              xp={15}
              secondsLeft={chrono.secondsLeft}
            />
          )}
        <div className="flex gap-3">
          <Button className="flex-1" onClick={registerMyRep}>
            {exercise === 'gainage' ? '+2s gainage' : `+1 rep (${activeEx.label})`}
          </Button>
          <Button variant="secondary" onClick={() => setMatchState('idle')}>
            Stop
          </Button>
        </div>
        </div>
      ) : (
        <p className="text-center text-[13px] font-medium text-mute">
          Duel ({activeMode.label}) enregistré sur ta Carte Athlète.
        </p>
      )}

      <GameLegend
        title={`${activeMode.label} · ${activeEx.label}`}
        description={`${activeMode.shortDesc}. ${activeEx.tip} Adversaire : ${opponent.name} (${userCategory}). Bonus : ${BONUS_NEED[userCategory] ?? 8} reps de plus en 30 s.`}
        level={level}
        stats={[
          { label: 'Durée', value: gameMode === 'survie_maison' ? 45 : 60, unit: 's' },
          { label: 'Récompense', value: `+${activeMode.xpReward}`, unit: 'XP' },
          { label: 'Bonus', value: BONUS_NEED[userCategory] ?? 8, unit: 'reps' },
        ]}
        extra={<BestMedal score={record ? record.best : null} goal={FIRST_TO_TARGET} unit="reps" runs={record?.runs} />}
      />
      <GameOptionsCard prefs={prefs} onChange={setPrefs} />
      <AlertGlow glowKey={glowKey} glowOn={glowOn} />
    </div>
  );
}

/** Jauge HUD fine, avec traînée optionnelle pour les PV adverses. */
function HudBar({ value, trail, tone }: { value: number; trail?: number; tone: string }) {
  return (
    <div className="relative mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/20">
      {trail !== undefined && (
        <div
          className="absolute inset-y-0 left-0 rounded-full bg-white/40 transition-all duration-500"
          style={{ width: `${trail}%` }}
        />
      )}
      <div
        className={`absolute inset-y-0 left-0 rounded-full transition-all duration-150 ${tone}`}
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}
