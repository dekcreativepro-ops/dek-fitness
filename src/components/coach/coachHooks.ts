import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from 'react';
import { coachSpeak, getCoach, subscribeCoach, type CoachProfile } from '../../utils/coachProfile';
import { liveLine, type LiveKind } from '../../utils/coachBrain';

/** Profil du coach (nom, genre, style), à jour partout dans l'app. */
export function useCoach(): CoachProfile {
  return useSyncExternalStore(subscribeCoach, getCoach, getCoach);
}

/** Coaching en direct : une bulle de quelques secondes + la voix du coach (selon son genre). */
export function useCoachLive() {
  const coach = useCoach();
  const [line, setLine] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const coachRef = useRef(coach);
  useEffect(() => {
    coachRef.current = coach;
  }, [coach]);
  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  const sayText = useCallback((text: string) => {
    setLine(text);
    coachSpeak(text, coachRef.current);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setLine(null), 5000);
  }, []);

  const say = useCallback(
    (kind: LiveKind, extra?: { name?: string }) => {
      sayText(liveLine(kind, coachRef.current, extra));
    },
    [sayText],
  );

  return { coach, line, say, sayText };
}
