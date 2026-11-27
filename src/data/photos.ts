// Catalogue des photos : chaque photo n'est utilisée qu'à UN SEUL endroit de l'app (pas de doublons).
// Plusieurs photos dans une catégorie = rotation à chaque ouverture de l'écran (réservée aux écrans
// qui n'ont pas d'identité fixe : salle de sport, Défi House). Une séance garde toujours sa photo.
// Formats : card 4:5, detail 5:4, wide 2:1. Voir docs/PHOTOS.md.

export type PhotoFormat = 'card' | 'detail' | 'wide';

export const PHOTO_CATEGORIES = {
  hero: ['runner'],
  // séances guidées (une photo fixe par séance)
  pecs: ['s-pecs'],
  legs: ['s-legs'],
  cardio: ['s-cardio'],
  abs: ['s-abs'],
  hiit: ['s-hiit'],
  fullbody: ['s-fullbody'],
  // terrains
  football: ['match'],
  matchfoot: ['feet'],
  basket: ['basket'],
  raids: ['hand'],
  // Gym Buddy / Défi House
  gym: ['rack', 'handrack'],
  duo: ['curl'],
  house: ['pushup2', 'pushup'],
  // accueil de l'app
  coach: ['coach'],
  team: ['friends'],
  action: ['dunk'],
  auth: ['track'],
} as const;

export type PhotoCategory = keyof typeof PHOTO_CATEGORIES;

/** Catégories dont la photo a un fond clair (affichée plus opaque, voile sombre plus fort en bas). */
export const LIGHT_PHOTO_CATEGORIES: PhotoCategory[] = ['coach'];

export function photoUrl(id: string, format: PhotoFormat): string {
  // images 3D des séances (préfixe s-) : public/images/seance ; photos : public/images/ph
  if (id.startsWith('s-')) return `/images/seance/${id.slice(2)}-${format}.jpg`;
  return `/images/ph/${id}-${format}.jpg`;
}
