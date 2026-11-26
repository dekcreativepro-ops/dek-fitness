// Catalogue des photos : plusieurs photos par catégorie. Chaque fichier est déjà recadré autour du sujet
// et étalonné de la même façon (voir docs/PHOTOS.md). Les formats : card 4:5, detail 5:4, wide 2:1, tall 9:19.5.

export type PhotoFormat = 'card' | 'detail' | 'wide' | 'tall';

export const PHOTO_CATEGORIES = {
  hero: ['runner', 'back', 'squat', 'basket'],
  cardio: ['runner', 'marathon', 'duo'],
  mission: ['marathon', 'runner', 'duo'],
  legs: ['squat', 'dunk'],
  pecs: ['torso-pecs', 'pushup'],
  abs: ['torso-abs', 'back'],
  fullbody: ['back', 'squat', 'pushup2'],
  hiit: ['match', 'feet', 'duo'],
  football: ['match', 'feet'],
  basket: ['basket', 'dunk'],
  team: ['feet', 'marathon', 'duo'],
  gym: ['rack', 'handrack', 'curl'],
  duo: ['duo', 'marathon'],
  house: ['pushup2', 'pushup', 'dunk'],
} as const;

export type PhotoCategory = keyof typeof PHOTO_CATEGORIES;

export function photoUrl(id: string, format: PhotoFormat): string {
  return `/images/ph/${id}-${format}.jpg`;
}
