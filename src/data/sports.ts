import type { SanteMatch } from '../types/dek';

// Disciplines proposées dans « Terrains & Santé » : sports collectifs, raquette, eau, combat et bien-être.

export type SportGroup = 'Foot' | 'Basket' | 'Volley' | 'Hand' | 'Padel' | 'Natation' | 'Combat' | 'Danse' | 'Cardio' | 'Vélo' | 'Street' | 'Bien-être';

export interface SportMeta {
  id: SanteMatch['sport'];
  label: string;
  group: SportGroup;
  max: number;
  /** poids dans la difficulté : 0 très doux, 3 très physique */
  intensity: number;
  unit: 'joueurs' | 'participants';
  place: string;
  slug: string;
}

export const SPORTS: SportMeta[] = [
  { id: 'Football 5v5', label: 'Foot 5v5', group: 'Foot', max: 10, intensity: 0.5, unit: 'joueurs', place: 'terrain réduit', slug: 'foot5' },
  { id: 'Football 7v7', label: 'Foot 7v7', group: 'Foot', max: 14, intensity: 1.5, unit: 'joueurs', place: 'terrain moyen', slug: 'foot7' },
  { id: 'Football 11v11', label: 'Foot 11v11', group: 'Foot', max: 22, intensity: 3, unit: 'joueurs', place: 'grand terrain', slug: 'foot11' },
  { id: 'Basket 3v3', label: 'Basket 3v3', group: 'Basket', max: 6, intensity: 0.5, unit: 'joueurs', place: 'demi-terrain', slug: 'basket' },
  { id: 'Volley-ball 6v6', label: 'Volley-ball', group: 'Volley', max: 12, intensity: 1, unit: 'joueurs', place: 'terrain de volley', slug: 'volley' },
  { id: 'Handball 7v7', label: 'Handball', group: 'Hand', max: 14, intensity: 2, unit: 'joueurs', place: 'salle ou terrain', slug: 'hand' },
  { id: 'Padel 2v2', label: 'Padel', group: 'Padel', max: 4, intensity: 1, unit: 'joueurs', place: 'court de padel', slug: 'padel' },
  { id: 'Natation', label: 'Natation', group: 'Natation', max: 12, intensity: 1.5, unit: 'participants', place: 'bassin encadré', slug: 'natation' },
  { id: 'Boxe fitness', label: 'Boxe fitness', group: 'Combat', max: 12, intensity: 2.5, unit: 'participants', place: 'salle avec sacs', slug: 'boxe' },
  { id: 'Danse afro', label: 'Danse afro', group: 'Danse', max: 20, intensity: 1.5, unit: 'participants', place: 'studio ou esplanade', slug: 'danse' },
  { id: 'Zumba', label: 'Zumba', group: 'Danse', max: 25, intensity: 1.5, unit: 'participants', place: 'salle de danse', slug: 'zumba' },
  { id: 'Tabata', label: 'Tabata', group: 'Cardio', max: 15, intensity: 2.5, unit: 'participants', place: 'salle ou plein air, 20 s d’effort / 10 s de repos', slug: 'tabata' },
  { id: 'Crossfit', label: 'Crossfit', group: 'Cardio', max: 12, intensity: 3, unit: 'participants', place: 'box de crossfit', slug: 'crossfit' },
  { id: 'Spinning', label: 'Spinning', group: 'Vélo', max: 14, intensity: 2, unit: 'participants', place: 'salle de vélos', slug: 'spinning' },
  { id: 'Street fitness', label: 'Street fitness', group: 'Street', max: 30, intensity: 1.5, unit: 'participants', place: 'rue ou place publique, circuit en groupe', slug: 'street-fitness' },
  { id: 'Street workout', label: 'Street workout', group: 'Street', max: 12, intensity: 2, unit: 'participants', place: 'parc à barres', slug: 'street' },
  { id: 'Street dance', label: 'Street dance', group: 'Street', max: 20, intensity: 1.5, unit: 'participants', place: 'rue ou esplanade', slug: 'street-dance' },
  { id: 'Run crew', label: 'Run crew', group: 'Street', max: 40, intensity: 1.5, unit: 'participants', place: 'rues du quartier, parcours en groupe', slug: 'run-crew' },
  { id: 'Parkour', label: 'Parkour', group: 'Street', max: 10, intensity: 2.5, unit: 'participants', place: 'spot urbain encadré', slug: 'parkour' },
  { id: 'Pilates', label: 'Pilates', group: 'Bien-être', max: 12, intensity: 0.5, unit: 'participants', place: 'studio calme', slug: 'pilates' },
  { id: 'Yoga & mobilité', label: 'Yoga & mobilité', group: 'Bien-être', max: 15, intensity: 0, unit: 'participants', place: 'studio calme', slug: 'yoga' },
];

export const SPORT_GROUPS: ('Tous' | SportGroup)[] = ['Tous', 'Foot', 'Basket', 'Volley', 'Hand', 'Padel', 'Natation', 'Combat', 'Danse', 'Cardio', 'Vélo', 'Street', 'Bien-être'];

export const sportMeta = (id: SanteMatch['sport']): SportMeta => SPORTS.find((s) => s.id === id) ?? SPORTS[0];
