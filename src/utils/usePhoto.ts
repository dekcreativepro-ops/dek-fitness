import { useState } from 'react';
import { PHOTO_CATEGORIES, photoUrl, type PhotoCategory, type PhotoFormat } from '../data/photos';

const CURSOR_KEY = 'dek_photo_cursor_v1';

/** Avance le curseur de la catégorie : à chaque entrée dans un écran, la photo suivante apparaît. */
function nextPhotoId(category: PhotoCategory): string {
  const list = PHOTO_CATEGORIES[category];
  let cursors: Record<string, number> = {};
  try {
    cursors = JSON.parse(window.localStorage.getItem(CURSOR_KEY) ?? '{}') as Record<string, number>;
  } catch {
    cursors = {};
  }
  const n = (cursors[category] ?? -1) + 1;
  cursors[category] = n;
  try {
    window.localStorage.setItem(CURSOR_KEY, JSON.stringify(cursors));
  } catch {
    // stockage indisponible : on affiche simplement la première photo
  }
  return list[n % list.length];
}

/**
 * Photo d'une catégorie. Le choix est fait une seule fois à l'ouverture de l'écran (aucune animation,
 * aucun minuteur) : en revenant sur l'écran, une autre photo de la même catégorie s'affiche.
 */
export function usePhoto(category: PhotoCategory, format: PhotoFormat): string {
  const [id] = useState(() => nextPhotoId(category));
  return photoUrl(id, format);
}
