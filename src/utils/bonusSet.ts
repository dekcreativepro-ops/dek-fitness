// Les 5 bonus de l'app : chacun a un animal, une capacité, un niveau et une médaille.
// À la fin d'une partie on montre ceux qui ont été ramassés et ce qu'ils ont rapporté.

export type BonusId = 'guepard' | 'faucon' | 'lion' | 'elephant' | 'panthere';

export interface BonusMeta {
  animal: string;
  capacity: string;
  color: string;
  desc: string;
}

export const BONUS_SET: Record<BonusId, BonusMeta> = {
  guepard: { animal: 'Guépard', capacity: 'Vitesse', color: '#FF9F45', desc: 'Réflexes et enchaînements rapides' },
  faucon: { animal: 'Faucon', capacity: 'Précision', color: '#5BD6FF', desc: 'Rythme régulier et geste propre' },
  lion: { animal: 'Lion', capacity: 'Puissance', color: '#F5C542', desc: 'Défis chrono relevés' },
  elephant: { animal: 'Éléphant', capacity: 'Endurance', color: '#7DDC6B', desc: 'Aller au bout de l’effort' },
  panthere: { animal: 'Panthère', capacity: 'Dynamisme', color: '#FF4D5E', desc: 'Combos et victoires enchaînées' },
};

export const BONUS_ORDER: BonusId[] = ['guepard', 'faucon', 'lion', 'elephant', 'panthere'];

export interface BonusEntry {
  count: number;
  xp: number;
}
export type BonusLedger = Partial<Record<BonusId, BonusEntry>>;

export function addBonus(ledger: BonusLedger, id: BonusId, xp: number): BonusLedger {
  const old = ledger[id];
  return { ...ledger, [id]: { count: (old?.count ?? 0) + 1, xp: (old?.xp ?? 0) + xp } };
}

/** Niveau du bonus de 1 à 5 selon l'XP cumulé. */
export function bonusLevel(xp: number): number {
  return Math.min(5, 1 + Math.floor(xp / 25));
}

export type BonusMedal = 'bronze' | 'argent' | 'or';
export function bonusMedal(xp: number): BonusMedal {
  return xp >= 70 ? 'or' : xp >= 35 ? 'argent' : 'bronze';
}

export function ledgerTotal(ledger: BonusLedger): number {
  return BONUS_ORDER.reduce((sum, id) => sum + (ledger[id]?.xp ?? 0), 0);
}
