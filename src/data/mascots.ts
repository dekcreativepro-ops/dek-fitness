// Mascottes 3D (illustrations vectorielles « argile ») utilisées à la place des photos sur les cartes de séance.
// Les photos restent réservées aux bannières. Pour changer un personnage : modifier `pose` / `tone` ici,
// ou la pose elle-même dans src/components/ui/Mascot3D.tsx.

import type { PhotoCategory } from './photos';

export type MascotPose = 'pecs' | 'legs' | 'cardio' | 'abs' | 'hiit' | 'fullbody';
/** dark = fond sombre de l'app, tenue lime ; lime = fond vert de l'app, tenue blanche */
export type MascotTone = 'dark' | 'lime';

export const PROGRAM_MASCOT: Partial<Record<PhotoCategory, { pose: MascotPose; tone: MascotTone }>> = {
  pecs: { pose: 'pecs', tone: 'dark' },
  legs: { pose: 'legs', tone: 'lime' },
  cardio: { pose: 'cardio', tone: 'dark' },
  abs: { pose: 'abs', tone: 'lime' },
  hiit: { pose: 'hiit', tone: 'dark' },
  fullbody: { pose: 'fullbody', tone: 'lime' },
};

export const MASCOT_FALLBACK = { pose: 'fullbody', tone: 'dark' } as const;
