import type { DemoExercise, MuscleGroup } from '../types/dek';
import type { PhotoCategory } from './photos';

// Catalogue des Séances Guidées (lecteur pas-à-pas avec démos HD, chrono et repos).

export type WorkoutLevel = 'Débutant' | 'Intermédiaire' | 'Avancé';
export type WorkoutCategory = 'force' | 'cardio' | 'core' | 'mobilite';

export interface FormTip {
  /** Erreur fréquente (affichée en rouge) */
  bad: string;
  /** Bonne exécution (affichée en vert) */
  good: string;
}

export interface ExerciseDef {
  id: string;
  name: string;
  demo: DemoExercise;
  /** Muscles principaux (lime plein) puis secondaires (lime transparent) */
  primary: MuscleGroup[];
  secondary: MuscleGroup[];
  cue: string;
  tips: FormTip[];
  /** Estimation kcal par répétition ou par seconde */
  kcalPerUnit: number;
}

export interface WorkoutStep {
  exerciseId: string;
  mode: 'reps' | 'time';
  /** Nombre de répétitions ou durée en secondes */
  target: number;
  restSec: number;
}

export interface WorkoutProgram {
  id: string;
  title: string;
  subtitle: string;
  category: WorkoutCategory;
  level: WorkoutLevel;
  durationMin: number;
  kcal: number;
  xp: number;
  /** Photo par défaut (publications du fil) ; l'affichage tourne parmi les photos de `photoCat`. */
  image: string;
  photoCat: PhotoCategory;
  /** Cadrage de la photo (object-position) pour varier les visuels */
  imagePosition: string;
  /** Teinte duotone appliquée sur la photo */
  tint: string;
  coachId: string;
  rating: number;
  ratingsCount: number;
  equipment: string;
  about: string;
  rounds: number;
  steps: WorkoutStep[];
}

export interface WorkoutResult {
  durationSec: number;
  kcal: number;
  /** Exercices réellement validés (« Fait » ou chrono allé au bout) */
  exercisesDone: number;
  totalSteps: number;
}

/** Part minimale d'exercices validés pour gagner l'XP (les exercices passés ne comptent pas). */
export const MIN_VALIDATED_RATIO = 0.6;

export const WORKOUT_CATEGORIES: { id: WorkoutCategory | 'all' | 'saved'; label: string }[] = [
  { id: 'all', label: 'Tout' },
  { id: 'force', label: 'Force' },
  { id: 'cardio', label: 'Cardio' },
  { id: 'core', label: 'Abdos' },
  { id: 'mobilite', label: 'Mobilité' },
  { id: 'saved', label: 'Favoris' },
];

export const LEVEL_COLORS: Record<WorkoutLevel, string> = {
  Débutant: '#38BDF8',
  Intermédiaire: '#C8FF00',
  Avancé: '#FF2E54',
};

export const EXERCISES: Record<string, ExerciseDef> = {
  pompes: {
    id: 'pompes',
    name: 'Pompes classiques',
    demo: 'pompes',
    primary: ['pectoraux'],
    secondary: ['bras', 'epaules', 'abdos'],
    cue: 'Mains sous les épaules, corps gainé, poitrine jusqu’à 5 cm du sol.',
    tips: [
      { bad: 'Hanches qui s’affaissent vers le sol', good: 'Fessiers & abdos serrés : une planche rigide' },
      { bad: 'Coudes écartés à 90° du corps', good: 'Coudes à 45° pour protéger les épaules' },
      { bad: 'Demi-amplitude rapide', good: 'Descente contrôlée, poitrine proche du sol' },
    ],
    kcalPerUnit: 0.45,
  },
  pompes_lentes: {
    id: 'pompes_lentes',
    name: 'Pompes tempo 3-1-3',
    demo: 'pompes',
    primary: ['pectoraux', 'bras'],
    secondary: ['epaules', 'abdos'],
    cue: '3 s pour descendre, 1 s en bas, 3 s pour remonter. Zéro élan.',
    tips: [
      { bad: 'Accélérer quand ça brûle', good: 'Compter le tempo à voix haute' },
      { bad: 'Tête qui pique vers le sol', good: 'Regard 30 cm devant les mains' },
    ],
    kcalPerUnit: 0.6,
  },
  squats: {
    id: 'squats',
    name: 'Squats',
    demo: 'squats',
    primary: ['jambes'],
    secondary: ['abdos', 'dos'],
    cue: 'Pieds largeur d’épaules, hanches en arrière, cuisses parallèles au sol.',
    tips: [
      { bad: 'Genoux qui rentrent vers l’intérieur', good: 'Genoux dans l’axe des pieds' },
      { bad: 'Talons qui décollent', good: 'Poids sur les talons, orteils libres' },
      { bad: 'Dos arrondi en bas', good: 'Poitrine fière, dos neutre' },
    ],
    kcalPerUnit: 0.4,
  },
  squat_iso: {
    id: 'squat_iso',
    name: 'Squat isométrique',
    demo: 'squats',
    primary: ['jambes'],
    secondary: ['abdos'],
    cue: 'Descends à la parallèle et tiens la position, souffle long.',
    tips: [{ bad: 'Remonter petit à petit', good: 'Cuisses parallèles jusqu’au bip' }],
    kcalPerUnit: 0.12,
  },
  gainage: {
    id: 'gainage',
    name: 'Gainage latéral',
    demo: 'gainage',
    primary: ['abdos'],
    secondary: ['epaules', 'dos'],
    cue: 'Coude sous l’épaule, bassin haut, ligne droite des chevilles à la tête.',
    tips: [
      { bad: 'Bassin qui tombe', good: 'Pousse la hanche vers le plafond' },
      { bad: 'Respiration bloquée', good: 'Souffle court et régulier' },
    ],
    kcalPerUnit: 0.08,
  },
  jumping_jacks: {
    id: 'jumping_jacks',
    name: 'Jumping jacks',
    demo: 'jumping_jacks',
    primary: ['jambes'],
    secondary: ['epaules'],
    cue: 'Bras au-dessus de la tête, réception souple sur l’avant du pied.',
    tips: [{ bad: 'Atterrir talons tendus', good: 'Genoux légèrement fléchis à chaque saut' }],
    kcalPerUnit: 0.2,
  },
  corde: {
    id: 'corde',
    name: 'Corde à sauter',
    demo: 'corde',
    primary: ['jambes'],
    secondary: ['epaules', 'bras'],
    cue: 'Petits rebonds, poignets qui tournent, coudes près du corps.',
    tips: [{ bad: 'Grands sauts avec les bras', good: 'Rebonds de 2-3 cm, rotation des poignets' }],
    kcalPerUnit: 0.22,
  },
  burpees: {
    id: 'burpees',
    name: 'Burpees',
    demo: 'burpees',
    primary: ['jambes', 'pectoraux'],
    secondary: ['bras', 'abdos', 'epaules'],
    cue: 'Planche solide, poitrine au sol, puis saut explosif bras tendus.',
    tips: [
      { bad: 'Dos creusé en planche', good: 'Gainage complet avant de remonter' },
      { bad: 'Saut mou', good: 'Extension complète, bras au ciel' },
    ],
    kcalPerUnit: 1.2,
  },
};

export const WORKOUT_PROGRAMS: WorkoutProgram[] = [
  {
    id: 'pecs-maison',
    title: 'Pecs maison sans matériel',
    subtitle: 'Pompes progressives & tempo',
    category: 'force',
    level: 'Intermédiaire',
    durationMin: 18,
    kcal: 165,
    xp: 140,
    image: '/images/ph/torso-pecs-card.jpg',
    photoCat: 'pecs',
    imagePosition: '50% 40%',
    tint: '#C8FF00',
    coachId: 'c2',
    rating: 4.8,
    ratingsCount: 174,
    equipment: 'Aucun',
    about:
      'Construire des pectoraux solides n’exige pas de salle. Cette séance enchaîne pompes classiques, tempo lent et gainage pour un maximum de tension mécanique, avec des repos courts pour garder le cœur haut.',
    rounds: 2,
    steps: [
      { exerciseId: 'jumping_jacks', mode: 'time', target: 30, restSec: 15 },
      { exerciseId: 'pompes', mode: 'reps', target: 12, restSec: 30 },
      { exerciseId: 'pompes_lentes', mode: 'reps', target: 6, restSec: 30 },
      { exerciseId: 'gainage', mode: 'time', target: 30, restSec: 20 },
      { exerciseId: 'pompes', mode: 'reps', target: 10, restSec: 0 },
    ],
  },
  {
    id: 'jambes-explosives',
    title: 'Jambes explosives',
    subtitle: 'Squats, isométrie & sauts',
    category: 'force',
    level: 'Intermédiaire',
    durationMin: 20,
    kcal: 210,
    xp: 150,
    image: '/images/ph/squat-card.jpg',
    photoCat: 'legs',
    imagePosition: '55% 50%',
    tint: '#FF8A00',
    coachId: 'c3',
    rating: 4.9,
    ratingsCount: 221,
    equipment: 'Aucun',
    about:
      'Le moteur des missions 05h00 : des cuisses capables d’encaisser les côtes et les relances. Squats contrôlés, chaise isométrique et pliométrie légère pour gagner en puissance sans traumatiser les genoux.',
    rounds: 2,
    steps: [
      { exerciseId: 'corde', mode: 'time', target: 40, restSec: 15 },
      { exerciseId: 'squats', mode: 'reps', target: 15, restSec: 30 },
      { exerciseId: 'squat_iso', mode: 'time', target: 35, restSec: 30 },
      { exerciseId: 'burpees', mode: 'reps', target: 8, restSec: 40 },
      { exerciseId: 'squats', mode: 'reps', target: 15, restSec: 0 },
    ],
  },
  {
    id: 'cardio-5am',
    title: 'Cardio brûle-graisse 5AM',
    subtitle: 'Réveil métabolique en 15 min',
    category: 'cardio',
    level: 'Débutant',
    durationMin: 15,
    kcal: 185,
    xp: 120,
    image: '/images/ph/runner-card.jpg',
    photoCat: 'cardio',
    imagePosition: '50% 35%',
    tint: '#A855F7',
    coachId: 'c1',
    rating: 4.7,
    ratingsCount: 132,
    equipment: 'Corde (optionnel)',
    about:
      'Idéal avant une mission 05h00 ou au réveil : intervalles courts, impact maîtrisé et montée progressive du cardio. Parfait pour démarrer la perte de poids sans se blesser.',
    rounds: 3,
    steps: [
      { exerciseId: 'jumping_jacks', mode: 'time', target: 30, restSec: 15 },
      { exerciseId: 'corde', mode: 'time', target: 30, restSec: 15 },
      { exerciseId: 'squats', mode: 'reps', target: 12, restSec: 20 },
    ],
  },
  {
    id: 'abdos-beton',
    title: 'Abdos béton 10 min',
    subtitle: 'Gainage & ceinture abdominale',
    category: 'core',
    level: 'Débutant',
    durationMin: 10,
    kcal: 80,
    xp: 90,
    image: '/images/ph/torso-abs-card.jpg',
    photoCat: 'abs',
    imagePosition: '50% 50%',
    tint: '#00E5FF',
    coachId: 'c2',
    rating: 4.6,
    ratingsCount: 98,
    equipment: 'Tapis',
    about:
      'Une ceinture abdominale forte protège le dos à la course comme au foot. 10 minutes de gainage statique et dynamique, à faire 3 fois par semaine.',
    rounds: 3,
    steps: [
      { exerciseId: 'gainage', mode: 'time', target: 30, restSec: 15 },
      { exerciseId: 'pompes_lentes', mode: 'reps', target: 5, restSec: 15 },
      { exerciseId: 'gainage', mode: 'time', target: 25, restSec: 20 },
    ],
  },
  {
    id: 'hiit-terrain',
    title: 'HIIT Terrain du Jeudi',
    subtitle: 'Cardio de match & relances',
    category: 'cardio',
    level: 'Avancé',
    durationMin: 22,
    kcal: 290,
    xp: 190,
    image: '/images/ph/match-card.jpg',
    photoCat: 'hiit',
    imagePosition: '45% 58%',
    tint: '#FF2E54',
    coachId: 'c1',
    rating: 4.9,
    ratingsCount: 143,
    equipment: 'Aucun',
    about:
      'Pensé par Coach Ibrahim pour tenir 2 × 25 min à haute intensité : burpees, sauts et squats en intervalles courts. Réservé aux athlètes à l’aise sur 5 km.',
    rounds: 3,
    steps: [
      { exerciseId: 'burpees', mode: 'reps', target: 10, restSec: 30 },
      { exerciseId: 'jumping_jacks', mode: 'time', target: 40, restSec: 20 },
      { exerciseId: 'squats', mode: 'reps', target: 20, restSec: 30 },
      { exerciseId: 'corde', mode: 'time', target: 45, restSec: 30 },
    ],
  },
  {
    id: 'full-body-starter',
    title: 'Full body starter',
    subtitle: 'Reprise en douceur, corps complet',
    category: 'mobilite',
    level: 'Débutant',
    durationMin: 14,
    kcal: 120,
    xp: 100,
    image: '/images/ph/back-card.jpg',
    photoCat: 'fullbody',
    imagePosition: '50% 36%',
    tint: '#38BDF8',
    coachId: 'c3',
    rating: 4.8,
    ratingsCount: 256,
    equipment: 'Aucun',
    about:
      'La séance parfaite pour reprendre : mouvements de base, amplitude confortable et repos généreux. Ton cœur, tes articulations et ta respiration s’habituent sans danger.',
    rounds: 2,
    steps: [
      { exerciseId: 'jumping_jacks', mode: 'time', target: 25, restSec: 20 },
      { exerciseId: 'squats', mode: 'reps', target: 10, restSec: 30 },
      { exerciseId: 'pompes', mode: 'reps', target: 6, restSec: 30 },
      { exerciseId: 'gainage', mode: 'time', target: 20, restSec: 0 },
    ],
  },
];

export function getProgram(id: string): WorkoutProgram | undefined {
  return WORKOUT_PROGRAMS.find((p) => p.id === id);
}

/** Séquence complète déroulée (tours × étapes) pour le lecteur. */
export function expandProgram(program: WorkoutProgram): WorkoutStep[] {
  const seq: WorkoutStep[] = [];
  for (let r = 0; r < program.rounds; r++) {
    program.steps.forEach((step, i) => {
      const isLast = r === program.rounds - 1 && i === program.steps.length - 1;
      // Repos plus long entre deux tours
      const restSec = isLast ? 0 : i === program.steps.length - 1 ? 45 : step.restSec;
      seq.push({ ...step, restSec });
    });
  }
  return seq;
}

/** Séance du jour recommandée selon l'objectif principal et le palier. */
export function getRecommendedProgram(goal: string | undefined, tierIdx: number): WorkoutProgram {
  const byGoal: Record<string, string> = {
    perte_poids: 'cardio-5am',
    prise_muscle: 'pecs-maison',
    endurance_5am: 'jambes-explosives',
    foot_sante: 'hiit-terrain',
    remise_forme: 'full-body-starter',
  };
  let id = (goal && byGoal[goal]) || 'full-body-starter';
  // Sécurité santé : pas de séance Avancé pour un palier Amateur
  if (id === 'hiit-terrain' && tierIdx < 1) id = 'cardio-5am';
  return getProgram(id) ?? WORKOUT_PROGRAMS[0];
}

/** Exercices disposant d'une démo animée « erreur / bonne forme » (voir ui/FormCompare). */
export const FORM_COMPARE_DEMOS: DemoExercise[] = ['pompes', 'squats', 'gainage'];
