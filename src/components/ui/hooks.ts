import { useEffect, useRef } from 'react';

/** Garde l'écran allumé pendant une séance (API Wake Lock, ignorée si absente). */
export function useWakeLock(active: boolean) {
  const lockRef = useRef<{ release: () => Promise<void> } | null>(null);
  useEffect(() => {
    if (!active) return;
    const nav = navigator as Navigator & {
      wakeLock?: { request: (type: 'screen') => Promise<{ release: () => Promise<void> }> };
    };
    let cancelled = false;
    const request = () => {
      nav.wakeLock
        ?.request('screen')
        .then((lock) => {
          if (cancelled) void lock.release();
          else lockRef.current = lock;
        })
        .catch(() => {
          // Refusé (batterie faible, onglet caché…) : sans conséquence
        });
    };
    request();
    const onVisible = () => {
      if (document.visibilityState === 'visible') request();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      cancelled = true;
      document.removeEventListener('visibilitychange', onVisible);
      void lockRef.current?.release().catch(() => undefined);
      lockRef.current = null;
    };
  }, [active]);
}
