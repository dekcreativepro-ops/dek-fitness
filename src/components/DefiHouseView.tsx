import { useEffect, useRef, useState } from 'react';
// Type seulement : la librairie MediaPipe (lourde) est chargée à la demande
// quand l'athlète active la caméra, pas au démarrage de l'app.
import type { PoseLandmarker } from '@mediapipe/tasks-vision';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ArrowsClockwise,
  Camera,
  CameraSlash,
  Fire,
  Lightning,
  Play,
  PlayCircle,
  ShieldWarning,
  Timer,
  Trophy,
  UsersThree,
  X,
} from './DekIcons';
import type {
  HouseExercise,
  HouseGameMode,
  MissionDifficulty,
  UserAvatarConfig,
} from '../types/dek';
import { HOUSE_OPPONENTS_BY_TIER, TIER_COLORS } from '../utils/categorization';
import { playGo, playHit, playTick, playVictory } from '../utils/soundFx';
import { ExerciseDemoCanvas } from './ExerciseDemoCanvas';
import { UserAvatar } from './UserAvatar';

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
        spawnPopup(`+${step} SQUAD`, 'opp');
      } else if (mode === 'survie_maison') {
        spawnPopup(`SURVIE +4.5s`, 'opp');
      } else if (mode === 'first_to_20') {
        spawnPopup(`+${step} REP`, 'opp');
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
  const winInfoRef = useRef({ exercise, gameMode, onWinDuel });
  useEffect(() => {
    winInfoRef.current = { exercise, gameMode, onWinDuel };
  });

  useEffect(() => {
    if (matchState !== 'win') return;
    const info = winInfoRef.current;
    playVictory();
    const exLabel = EXERCISES.find((e) => e.id === info.exercise)?.label ?? 'Pompes';
    const modeObj = HOUSE_MODES.find((m) => m.id === info.gameMode) ?? HOUSE_MODES[0];
    info.onWinDuel(modeObj.xpReward, exLabel, myRepsRef.current, modeObj.label);
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
              ctx.strokeStyle = '#A855F7';
              ctx.lineWidth = 4;
              ctx.lineCap = 'round';
              ctx.shadowColor = '#00E5FF';
              ctx.shadowBlur = 10;
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
                ctx.strokeStyle = '#A855F7';
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
    updateCue('C’est parti !');
    setMatchState('fighting');
  };

  const activeEx = EXERCISES.find((e) => e.id === exercise) ?? EXERCISES[0];
  const activeMode = HOUSE_MODES.find((m) => m.id === gameMode) ?? HOUSE_MODES[0];
  const staminaPct = Math.round((staminaMs / SURVIVAL_MAX_MS) * 100);

  return (
    <div className="space-y-2.5 pb-2">
      {/* Sélecteur de Mode de combat (4 modes) */}
      <div className="grid grid-cols-4 gap-1 rounded-2xl border border-white/10 bg-[#11151D] p-1">
        {HOUSE_MODES.map((m) => {
          const active = gameMode === m.id;
          return (
            <button
              key={m.id}
              disabled={matchState === 'fighting'}
              onClick={() => setGameMode(m.id)}
              className={`font-hud relative rounded-xl px-1 py-1.5 text-[10px] font-bold transition ${
                active ? 'text-black' : 'text-slate-300'
              }`}
            >
              {active && (
                <motion.div
                  layoutId="houseModePill"
                  transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                  className="absolute inset-0 rounded-xl bg-[#C8FF00]"
                />
              )}
              <span className="relative z-10 block truncate">{m.label}</span>
            </button>
          );
        })}
      </div>

      {/* Pilules des 6 exercices + bouton Démo */}
      <div className="flex items-center gap-1.5">
        <div className="flex flex-1 gap-1 overflow-x-auto rounded-2xl border border-white/10 bg-[#11151D] p-1">
          {EXERCISES.map((ex) => {
            const active = exercise === ex.id;
            return (
              <button
                key={ex.id}
                disabled={matchState === 'fighting'}
                onClick={() => setExercise(ex.id)}
                className={`font-hud relative shrink-0 rounded-xl px-2.5 py-1.5 text-[11px] font-bold transition ${
                  active ? 'text-black' : 'text-slate-300'
                }`}
              >
                {active && (
                  <motion.div
                    layoutId="houseExercisePill"
                    transition={{ type: 'spring', stiffness: 420, damping: 32 }}
                    className="absolute inset-0 rounded-xl bg-[#00E5FF]"
                  />
                )}
                <span className="relative z-10">{ex.label}</span>
              </button>
            );
          })}
        </div>

        <button
          onClick={() => setShowDemo((v) => !v)}
          className={`font-hud flex shrink-0 items-center gap-1 rounded-2xl border px-3 py-2 text-[11px] font-bold transition ${
            showDemo
              ? 'border-[#C8FF00] bg-[#C8FF00] text-black'
              : 'border-white/15 bg-[#11151D] text-[#C8FF00]'
          }`}
        >
          <PlayCircle weight="duotone" className="h-4 w-4" /> Démo
        </button>
      </div>

      {/* Arène Caméra Plein Cadre */}
      <div className="relative overflow-hidden rounded-3xl border border-white/15 bg-[#07090D] shadow-2xl">
        <div className="relative flex h-[392px] w-full flex-col justify-between bg-black">
          {!cameraActive && (
            <>
              <img
                src="/images/banner-house.jpg"
                alt="Studio Défi House"
                className="absolute inset-0 h-full w-full object-cover opacity-65"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#080A0E] via-[#080A0E]/55 to-[#080A0E]/85" />
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

          {/* Overlay Haut : HUD adapté au mode actif */}
          <div className="relative z-20 p-3.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <UserAvatar avatar={oppAvatar} size="xs" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className="font-hud text-xs font-bold text-white">
                      {gameMode === 'equipe_4v4' ? 'Iron Crew (4)' : opponent.name}
                    </span>
                    <span
                      className="rounded-md px-1.5 py-0.5 text-[9px] font-bold"
                      style={{
                        backgroundColor: `${TIER_COLORS[userCategory]}22`,
                        color: TIER_COLORS[userCategory],
                      }}
                    >
                      {userCategory}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {gameMode === 'equipe_4v4'
                      ? `${oppSquadReps}/${SQUAD_TARGET_REPS} reps équipe`
                      : `${oppReps} reps adv.`}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-hud rounded-lg bg-black/70 px-2 py-0.5 text-xs font-bold text-white backdrop-blur">
                  {timeLeft}s
                </span>
                <UserAvatar avatar={userAvatar} size="xs" />
              </div>
            </div>

            {/* Jauges selon le mode */}
            {gameMode === 'ko_60s' && (
              <>
                <div className="mt-2 flex items-center gap-2">
                  <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="absolute inset-y-0 left-0 rounded-full bg-amber-200/75 transition-all duration-500"
                      style={{ width: `${oppTrailHp}%` }}
                    />
                    <div
                      className="relative h-full rounded-full bg-gradient-to-r from-[#FF2E54] to-[#FB7185] transition-all duration-150"
                      style={{ width: `${oppHp}%` }}
                    />
                  </div>
                  <span className="font-hud text-[11px] font-bold text-white">{oppHp}%</span>
                </div>
                <div className="mt-1 text-[10px] text-slate-300">
                  Ta vie : <strong className="text-[#C8FF00]">{myHp}%</strong>
                </div>
              </>
            )}

            {gameMode === 'first_to_20' && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-8 text-[9px] font-bold text-[#C8FF00]">TOI</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-[#C8FF00] transition-all"
                      style={{ width: `${Math.min(100, (myReps / FIRST_TO_TARGET) * 100)}%` }}
                    />
                  </div>
                  <span className="font-hud text-[10px] font-bold text-[#C8FF00]">
                    {myReps}/{FIRST_TO_TARGET}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-8 text-[9px] font-bold text-[#FF2E54]">ADV</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-[#FF2E54] transition-all"
                      style={{ width: `${Math.min(100, (oppReps / FIRST_TO_TARGET) * 100)}%` }}
                    />
                  </div>
                  <span className="font-hud text-[10px] font-bold text-[#FF2E54]">
                    {oppReps}/{FIRST_TO_TARGET}
                  </span>
                </div>
              </div>
            )}

            {gameMode === 'survie_maison' && (
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between text-[10px]">
                  <span className="flex items-center gap-1 font-bold text-amber-300">
                    <Timer weight="duotone" className="h-3.5 w-3.5" /> Jauge Survie (rep avant 0s)
                  </span>
                  <span className="font-hud font-bold text-white">
                    {(staminaMs / 1000).toFixed(1)}s
                  </span>
                </div>
                <div className="h-2.5 overflow-hidden rounded-full bg-white/15">
                  <div
                    className={`h-full rounded-full transition-all duration-100 ${
                      staminaPct < 35 ? 'bg-[#FF2E54]' : 'bg-gradient-to-r from-[#FF8A00] to-[#C8FF00]'
                    }`}
                    style={{ width: `${staminaPct}%` }}
                  />
                </div>
              </div>
            )}

            {gameMode === 'equipe_4v4' && (
              <div className="mt-2 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 text-[9px] font-bold text-[#C8FF00]">
                    <UsersThree weight="duotone" className="h-3 w-3" /> DEK
                  </span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-[#C8FF00] transition-all"
                      style={{
                        width: `${Math.min(100, (mySquadReps / SQUAD_TARGET_REPS) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="font-hud text-[10px] font-bold text-[#C8FF00]">
                    {mySquadReps}/{SQUAD_TARGET_REPS}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[9px] font-bold text-[#FF2E54]">IRON</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/15">
                    <div
                      className="h-full rounded-full bg-[#FF2E54] transition-all"
                      style={{
                        width: `${Math.min(100, (oppSquadReps / SQUAD_TARGET_REPS) * 100)}%`,
                      }}
                    />
                  </div>
                  <span className="font-hud text-[10px] font-bold text-[#FF2E54]">
                    {oppSquadReps}/{SQUAD_TARGET_REPS}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Centre : Démo GIF HD OU Bouton Caméra IA */}
          {showDemo ? (
            <div className="relative z-30 mx-3 my-auto">
              <div className="relative">
                <button
                  onClick={() => setShowDemo(false)}
                  className="absolute right-2 top-2 z-20 rounded-full bg-black/75 p-1 text-slate-300"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
                <ExerciseDemoCanvas exercise={exercise} />
              </div>
            </div>
          ) : !cameraActive ? (
            <div className="relative z-10 mx-auto flex max-w-xs flex-col items-center px-4 text-center">
              <span className="font-hud mb-1 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-0.5 text-[10px] font-bold text-[#C8FF00] backdrop-blur">
                <Fire weight="duotone" className="h-3 w-3" /> {activeMode.label} • +{activeMode.xpReward} XP
              </span>
              <p className="font-hud text-base font-bold text-white drop-shadow">
                {activeEx.label.toUpperCase()} • ARÈNE IA
              </p>
              <p className="mt-0.5 text-[11px] text-slate-200 drop-shadow">{activeMode.shortDesc}</p>
              <p className="mt-0.5 text-[10px] text-slate-300">{activeEx.tip}</p>
              <button
                onClick={() => void startCameraAI()}
                className="font-hud mt-3 flex items-center gap-1.5 rounded-full border border-[#A855F7]/60 bg-black/70 px-4 py-2 text-[11px] font-bold text-white backdrop-blur"
              >
                <Camera weight="duotone" className="h-4 w-4 text-[#C8FF00]" /> Activer Caméra IA
              </button>
            </div>
          ) : (
            <button
              onClick={stopCameraAI}
              className="absolute right-12 top-28 z-20 rounded-full bg-black/65 p-1.5 text-[#FF2E54]"
              title="Couper caméra"
            >
              <CameraSlash weight="duotone" className="h-4 w-4" />
            </button>
          )}

          {/* Jauge verticale DEPTH à droite */}
          <div className="pointer-events-none absolute bottom-20 right-3 top-28 z-20 flex flex-col items-center gap-1">
            <span className="font-hud text-[8px] font-bold tracking-widest text-slate-300">
              DEPTH
            </span>
            <div className="relative w-2 flex-1 overflow-hidden rounded-full bg-white/15 backdrop-blur">
              <motion.div
                animate={{ top: `${Math.min(88, Math.max(4, depthPct))}%` }}
                transition={{ duration: 0.14 }}
                className="absolute inset-x-0 h-2.5 rounded-full bg-white shadow-[0_0_8px_#C8FF00]"
              />
            </div>
          </div>

          {/* Popups flottants */}
          <AnimatePresence>
            {popups.map((p) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, y: 8, scale: 0.85 }}
                animate={{ opacity: 1, y: -26, scale: 1.05 }}
                exit={{ opacity: 0, y: -44 }}
                className={`font-hud pointer-events-none absolute top-28 z-30 rounded-lg px-2.5 py-0.5 text-xs font-black ${
                  p.target === 'opp'
                    ? 'right-12 bg-[#C8FF00] text-black'
                    : 'left-4 bg-[#FF2E54] text-white'
                }`}
              >
                {p.text}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Bas de l'arène */}
          <div className="relative z-20 bg-gradient-to-t from-black/95 via-black/65 to-transparent px-4 pb-3.5 pt-5 text-center">
            {combo >= 2 && matchState === 'fighting' && (
              <span className="font-hud mb-1 inline-block rounded-full bg-amber-400 px-2.5 py-0.5 text-[10px] font-black text-black">
                COMBO x{combo}
              </span>
            )}
            <div className="font-hud text-4xl font-bold leading-none text-white">
              {myReps}{' '}
              <span className="text-base font-medium text-slate-300">
                {exercise === 'gainage' ? 'sec' : 'reps'}
              </span>
            </div>
            <div className="mx-auto mt-2 flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1.5 text-[11px] font-medium text-slate-200 backdrop-blur">
              <span
                className={`h-2 w-2 rounded-full ${
                  cameraActive ? 'bg-[#C8FF00]' : 'bg-[#00E5FF]'
                }`}
              />
              <span className="truncate">
                {cameraActive ? liveCue : `${aiStatus} • ${liveCue}`}
              </span>
            </div>
          </div>

          {/* Overlay Victoire / Défaite */}
          <AnimatePresence>
            {(matchState === 'win' || matchState === 'lose') && (
              <motion.div
                initial={{ opacity: 0, scale: 1.08 }}
                animate={{ opacity: 1, scale: 1 }}
                className="absolute inset-0 z-40 flex flex-col items-center justify-center bg-black/90 p-5 text-center backdrop-blur-xs"
              >
                {matchState === 'win' ? (
                  <>
                    <Trophy weight="duotone" className="h-12 w-12 text-[#C8FF00]" />
                    <h3 className="font-hud mt-2 text-2xl font-bold text-[#C8FF00]">
                      VICTOIRE • {activeMode.label.toUpperCase()}
                    </h3>
                    <p className="mt-1 text-xs text-white">
                      {endReason || `${myReps} ${activeEx.label}`} •{' '}
                      <strong className="text-[#C8FF00]">+{activeMode.xpReward} XP</strong>
                    </p>
                  </>
                ) : (
                  <>
                    <ShieldWarning weight="duotone" className="h-12 w-12 text-[#FF2E54]" />
                    <h3 className="font-hud mt-2 text-2xl font-bold text-[#FF2E54]">DÉFAITE</h3>
                    <p className="mt-1 text-xs text-slate-300">
                      {endReason || `${opponent.name} gagne (${oppReps} vs ${myReps})`}
                    </p>
                  </>
                )}
                <motion.button
                  whileTap={{ scale: 0.94 }}
                  onClick={startDuel}
                  className="font-hud mt-4 flex items-center gap-2 rounded-full bg-[#C8FF00] px-6 py-2.5 text-xs font-bold text-black"
                >
                  <ArrowsClockwise weight="duotone" className="h-4 w-4" /> Revanche immédiate
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bouton d'action au pouce */}
        <div className="border-t border-white/10 bg-[#11151D] p-3">
          {matchState === 'idle' ? (
            <motion.button
              whileTap={{ scale: 0.96 }}
              onClick={startDuel}
              className="font-hud flex w-full items-center justify-center gap-2 rounded-full bg-[#C8FF00] py-3.5 text-xs font-bold text-black"
            >
              <Play weight="duotone" className="h-4 w-4" /> Lancer • {activeMode.label}
            </motion.button>
          ) : matchState === 'fighting' ? (
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.93 }}
                onClick={registerMyRep}
                className="animate-pulse-volt font-hud flex flex-1 items-center justify-center gap-2 rounded-full bg-[#C8FF00] py-3.5 text-xs font-bold text-black"
              >
                <Lightning weight="duotone" className="h-4 w-4" />{' '}
                {exercise === 'gainage'
                  ? '+2s GAINAGE'
                  : `+1 REP (${activeEx.label.toUpperCase()})`}
              </motion.button>
              <button
                onClick={() => setMatchState('idle')}
                className="rounded-full border border-white/15 bg-white/5 px-4 py-3 text-xs font-bold text-slate-300"
              >
                Stop
              </button>
            </div>
          ) : (
            <div className="text-center text-[11px] text-slate-400">
              Duel ({activeMode.label}) enregistré sur ta Carte Athlète.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
