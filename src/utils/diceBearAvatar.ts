// Générateur DiceBear chargé à la demande (seulement pour les avatars « custom »),
// afin de ne pas alourdir le démarrage de l'app.
import { createAvatar } from '@dicebear/core';
import * as adventurer from '@dicebear/adventurer';
import * as bottts from '@dicebear/bottts';
import * as lorelei from '@dicebear/lorelei';
import type { DiceBearStyleId } from '../types/dek';

export function buildDiceBearDataUri(
  diceStyle: DiceBearStyleId,
  seed: string,
  bgColor: string,
): string {
  const opts = {
    seed: seed.trim() || 'DEK_Hero',
    backgroundColor: [bgColor.replace('#', '')],
  };
  if (diceStyle === 'adventurer') {
    return createAvatar(adventurer, opts).toDataUri();
  }
  if (diceStyle === 'bottts') {
    return createAvatar(bottts, opts).toDataUri();
  }
  return createAvatar(lorelei, opts).toDataUri();
}
