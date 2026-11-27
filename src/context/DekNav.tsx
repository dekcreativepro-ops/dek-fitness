import { createContext, useContext } from 'react';
import type { TabId } from '../types/dek';

// Navigation globale DEK : pile d'écrans plein cadre (détail séance, lecteur, coach,
// classement) synchronisée avec le bouton « retour » Android / navigateur.

export type OverlayEntry =
  | { kind: 'workout'; id: string }
  | { kind: 'player'; id: string }
  | { kind: 'coach'; id: string }
  | { kind: 'leaderboard' }
  | { kind: 'trophies' }
  | { kind: 'coachai' };

export interface DekNavValue {
  openWorkout: (id: string) => void;
  startWorkout: (id: string) => void;
  openCoach: (id: string) => void;
  openLeaderboard: () => void;
  openTrophies: () => void;
  openCoachAI: () => void;
  editBodyProfile: () => void;
  closeOverlay: () => void;
  closeAllOverlays: () => void;
  goTab: (tab: TabId) => void;
}

const noop = () => undefined;

export const DekNavContext = createContext<DekNavValue>({
  openWorkout: noop,
  startWorkout: noop,
  openCoach: noop,
  openLeaderboard: noop,
  openTrophies: noop,
  openCoachAI: noop,
  editBodyProfile: noop,
  closeOverlay: noop,
  closeAllOverlays: noop,
  goTab: noop,
});

export function useDekNav(): DekNavValue {
  return useContext(DekNavContext);
}
