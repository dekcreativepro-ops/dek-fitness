import { useCallback, useEffect, useRef, useState } from 'react';
import { BONUS_LIMIT_SEC, loadGamePrefs, saveGamePrefs, vibrate, type GamePrefs } from '../../utils/gameFx';

/** Réglages d'un jeu (vibration & lueur, bonus chrono), conservés sur l'appareil. */
export function useGamePrefs(gameId: string): [GamePrefs, (patch: Partial<GamePrefs>) => void] {
  const [prefs, setPrefs] = useState<GamePrefs>(() => loadGamePrefs(gameId));
  const update = useCallback(
    (patch: Partial<GamePrefs>) => {
      setPrefs((prev) => {
        const next = { ...prev, ...patch };
        saveGamePrefs(gameId, next);
        return next;
      });
    },
    [gameId],
  );
  return [prefs, update];
}

/** Vibration + halo vert autour de l'écran (le halo s'affiche avec <AlertGlow />). */
export function useAlertGlow(enabled: boolean) {
  const [glowKey, setGlowKey] = useState(0);
  const [glowOn, setGlowOn] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const enabledRef = useRef(enabled);
  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const alert = useCallback((kind: 'near' | 'finish' = 'near') => {
    if (!enabledRef.current) return;
    vibrate(kind === 'finish' ? [200, 80, 200, 80, 450] : [140, 70, 140]);
    setGlowKey((k) => k + 1);
    setGlowOn(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setGlowOn(false), 1600);
  }, []);

  return { glowKey, glowOn, alert };
}

export interface ChronoBonus {
  id: number;
  target: number; // valeur de progression à atteindre
  expiresAt: number;
  nearFired: boolean;
}

interface ChronoBonusOptions {
  enabled: boolean;
  active: boolean; // la partie est en cours
  spawnOk?: boolean; // un nouveau bonus peut apparaître (par défaut oui)
  progress: number; // reps, séries… : la valeur qui monte
  need: number; // progression demandée pour le bonus
  base: number; // XP de base ; le temps restant (s) s'ajoute
  label: string;
  maxSpawns?: number;
  gapMs?: number;
  onWin: (xp: number, label: string) => void;
  onMiss: () => void;
  onNear: () => void;
}

/**
 * Bonus chrono : un défi « +need en 30 s » apparaît ; réussi à temps il rapporte base + secondes restantes,
 * sinon il disparaît. Un seul bonus à la fois.
 */
export function useChronoBonus(options: ChronoBonusOptions) {
  const optsRef = useRef(options);
  useEffect(() => {
    optsRef.current = options;
  });
  const bonusRef = useRef<ChronoBonus | null>(null);
  const spawnedRef = useRef(0);
  const seqRef = useRef(0);
  const lastEndRef = useRef(0);
  const totalXpRef = useRef(0);
  const [bonus, setBonus] = useState<ChronoBonus | null>(null);
  const [now, setNow] = useState(0);
  const [totalXp, setTotalXp] = useState(0);

  const { enabled, active } = options;
  useEffect(() => {
    if (!enabled || !active) return;
    lastEndRef.current = Date.now() - 400;
    const timer = setInterval(() => {
      const t = Date.now();
      const o = optsRef.current;
      const b = bonusRef.current;
      if (b) {
        if (o.progress >= b.target) {
          const left = Math.max(0, Math.ceil((b.expiresAt - t) / 1000));
          const xp = o.base + left;
          totalXpRef.current += xp;
          setTotalXp(totalXpRef.current);
          bonusRef.current = null;
          lastEndRef.current = t;
          o.onWin(xp, o.label);
        } else if (t >= b.expiresAt) {
          bonusRef.current = null;
          lastEndRef.current = t;
          o.onMiss();
        } else if (!b.nearFired && o.progress >= b.target - 1) {
          b.nearFired = true;
          o.onNear();
        }
      } else if (o.spawnOk !== false && spawnedRef.current < (o.maxSpawns ?? 3) && t - lastEndRef.current > (o.gapMs ?? 1500)) {
        seqRef.current += 1;
        spawnedRef.current += 1;
        bonusRef.current = { id: seqRef.current, target: o.progress + o.need, expiresAt: t + BONUS_LIMIT_SEC * 1000, nearFired: false };
      }
      setBonus(bonusRef.current ? { ...bonusRef.current } : null);
      setNow(t);
    }, 300);
    return () => clearInterval(timer);
  }, [enabled, active]);

  const reset = useCallback(() => {
    bonusRef.current = null;
    spawnedRef.current = 0;
    totalXpRef.current = 0;
    setBonus(null);
    setTotalXp(0);
  }, []);

  const secondsLeft = bonus ? Math.max(0, Math.ceil((bonus.expiresAt - now) / 1000)) : 0;
  /** XP de bonus gagnés pendant la partie (lecture sans re-rendu). */
  const getTotalXp = useCallback(() => totalXpRef.current, []);
  return { bonus, secondsLeft, totalXp, getTotalXp, reset };
}
