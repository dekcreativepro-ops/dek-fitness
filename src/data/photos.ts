// Catalogue des photos : chaque photo n'est utilisée qu'à UN SEUL endroit de l'app (pas de doublons).
// Plusieurs photos dans une catégorie = rotation à chaque ouverture de l'écran (réservée aux écrans
// qui n'ont pas d'identité fixe : salle de sport, Défi House). Une séance garde toujours sa photo.
// Formats : card 4:5, detail 5:4, wide 2:1. Voir docs/PHOTOS.md.

export type PhotoFormat = 'card' | 'detail' | 'wide';

export const PHOTO_CATEGORIES = {
  hero: ['3d-accueil-rang'],
  // séances guidées (une photo fixe par séance)
  pecs: ['s-pecs'],
  legs: ['s-legs'],
  cardio: ['s-cardio'],
  abs: ['s-abs'],
  hiit: ['s-hiit'],
  fullbody: ['s-fullbody'],
  // terrains
  football: ['3d-terrain-bandeau'],
  matchfoot: ['3d-terrain-foot'],
  basket: ['3d-terrain-basket'],
  raids: ['3d-raids'],
  // Gym Buddy / Défi House
  gym: ['3d-gym-spot-1', '3d-gym-spot-2'],
  duo: ['3d-gym-duo'],
  house: ['3d-house-duel-1', '3d-house-duel-2'],
  // accueil de l'app
  coach: ['3d-onboarding-coach'],
  team: ['3d-onboarding-equipe'],
  action: ['3d-onboarding-action'],
  auth: ['3d-compte-auth'],
} as const;

export type PhotoCategory = keyof typeof PHOTO_CATEGORIES;

/** Catégories dont la photo a un fond clair (affichée plus opaque, voile sombre plus fort en bas). */
export const LIGHT_PHOTO_CATEGORIES: PhotoCategory[] = ['coach'];

export function photoUrl(id: string, format: PhotoFormat): string {
  // images 3D (préfixe 3d-) : public/images/3d ; séances (préfixe s-) : public/images/seance ; photos : public/images/ph
  if (id.startsWith('3d-')) return `/images/3d/${id.slice(3)}.jpg`;
  if (id.startsWith('s-')) return `/images/seance/${id.slice(2)}-${format}.jpg`;
  return `/images/ph/${id}-${format}.jpg`;
}
