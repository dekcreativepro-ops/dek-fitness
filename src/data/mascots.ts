// Mascottes 3D (illustrations vectorielles « argile ») utilisées à la place des photos sur les cartes de séance.
// Les photos restent réservées aux bannières. Pour changer un personnage : modifier `pose` / `tone` ici,
// ou la pose elle-même dans src/components/ui/Mascot3D.tsx.

import type { PhotoCategory } from './photos';

export type MascotPose = 'pecs' | 'legs' | 'cardio' | 'abs' | 'hiit' | 'fullbody';
/** white = fond blanc, tenue lime ; lime = fond vert de l'app, tenue blanche */
export type MascotTone = 'white' | 'lime';

export const PROGRAM_MASCOT: Partial<Record<PhotoCategory, { pose: MascotPose; tone: MascotTone }>> = {
  pecs: { pose: 'pecs', tone: 'white' },
  legs: { pose: 'legs', tone: 'lime' },
  cardio: { pose: 'cardio', tone: 'white' },
  abs: { pose: 'abs', tone: 'lime' },
  hiit: { pose: 'hiit', tone: 'white' },
  fullbody: { pose: 'fullbody', tone: 'lime' },
};

export const MASCOT_FALLBACK = { pose: 'fullbody', tone: 'white' } as const;
