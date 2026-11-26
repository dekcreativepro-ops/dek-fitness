import type { FitnessGoal, MissionDifficulty, MuscleGroup } from '../types/dek';

export interface FitnessGoalMeta {
  id: FitnessGoal;
  label: string;
  subtitle: string;
  iconName: 'flame' | 'dumbbell' | 'sunrise' | 'trophy' | 'heart';
}

export const FITNESS_GOALS: FitnessGoalMeta[] = [
  {
    id: 'perte_poids',
    label: 'Perte de poids',
    subtitle: 'Brûler des graisses & affiner',
    iconName: 'flame',
  },
  {
    id: 'prise_muscle',
    label: 'Prise de muscle',
    subtitle: 'Force & volume musculaire',
    iconName: 'dumbbell',
  },
  {
    id: 'endurance_5am',
    label: 'Endurance & Missions 5h',
    subtitle: 'Souffle, discipline & chrono',
    iconName: 'sunrise',
  },
  {
    id: 'foot_sante',
    label: 'Prépa Foot / La Santé',
    subtitle: 'Explosivité & matchs terrain',
    iconName: 'trophy',
  },
  {
    id: 'remise_forme',
    label: 'Remise en forme',
    subtitle: 'Énergie & régularité sans stress',
    iconName: 'heart',
  },
];

export const MUSCLE_LABELS: Record<MuscleGroup, string> = {
  epaules: 'Épaules',
  pectoraux: 'Pectoraux',
  bras: 'Bras',
  abdos: 'Abdos',
  dos: 'Dos',
  jambes: 'Jambes',
};

export interface AdventurePlan {
  title: string;
  durationLabel: string;
  todayWorkoutTitle: string;
  todayWorkoutMeta: string;
  launchTab: 'missions' | 'house';
  recommendedCoachId: 'c1' | 'c2' | 'c3';
  coachAdvice: string;
}

export function getAdventurePlan(
  goals: FitnessGoal[],
  category: MissionDifficulty,
): AdventurePlan {
  const primary: FitnessGoal = goals[0] ?? 'remise_forme';
  const distByTier: Record<MissionDifficulty, string> = {
    Amateur: '3 km',
    Standard: '5 km',
    Pro: '10 km',
    Expert: '15 km',
  };

  if (primary === 'foot_sante') {
    return {
      title: 'Aventure Terrain & Explosivité',
      durationLabel: 'Semaine 1 sur 6 • Foot & Cardio',
      todayWorkoutTitle: `Mission Sprint ${distByTier[category]} + Gainage`,
      todayWorkoutMeta: `Catégorie ${category} • Prépa match La Santé`,
      launchTab: 'missions',
      recommendedCoachId: 'c1',
      coachAdvice:
        'Travaille tes appuis et ton explosivité avant la Santé du week-end. Hydrate-toi bien.',
    };
  }

  if (primary === 'perte_poids') {
    return {
      title: 'Aventure Brûle-Graisse & Tonus',
      durationLabel: 'Semaine 1 sur 6 • Défi House + Cardio',
      todayWorkoutTitle: 'Duel Défi House • Sauts & Squats',
      todayWorkoutMeta: `60s intensif • Catégorie ${category}`,
      launchTab: 'house',
      recommendedCoachId: 'c2',
      coachAdvice:
        'Enchaîne les combats Défi House sans sauter tes repas protéinés : régularité avant tout.',
    };
  }

  if (primary === 'prise_muscle') {
    return {
      title: 'Aventure Force & Volume Maison',
      durationLabel: 'Semaine 1 sur 8 • Poids du corps',
      todayWorkoutTitle: 'Duel Défi House • Pompes & Squats',
      todayWorkoutMeta: `Amplitude contrôlée • Catégorie ${category}`,
      launchTab: 'house',
      recommendedCoachId: 'c2',
      coachAdvice:
        'Privilégie une descente lente sur tes pompes et atteins ton quota de protéines ce soir.',
    };
  }

  if (primary === 'endurance_5am') {
    return {
      title: 'Aventure Club 05h00 & Chrono',
      durationLabel: 'Semaine 1 sur 6 • Missions GPS',
      todayWorkoutTitle: `Mission Synchronisée ${distByTier[category]}`,
      todayWorkoutMeta: `Départ 05:00 • Palier ${category}`,
      launchTab: 'missions',
      recommendedCoachId: 'c3',
      coachAdvice:
        'Pars à allure régulière sur les 500 premiers mètres et garde ton rythme jusqu’à l’arrivée.',
    };
  }

  return {
    title: 'Aventure Équilibre & Régularité',
    durationLabel: 'Semaine 1 sur 4 • Multisport doux',
    todayWorkoutTitle: `Boucle Découverte ${distByTier[category]}`,
    todayWorkoutMeta: `À ton rythme • Catégorie ${category}`,
    launchTab: 'missions',
    recommendedCoachId: 'c3',
    coachAdvice:
      'Vise 3 séances simples cette semaine. C’est la régularité qui débloque les paliers.',
  };
}

export interface NutritionMeal {
  id: string;
  time: string;
  title: string;
  detail: string;
  kcal: number;
  protein: number;
  imageUrl: string;
}

export interface NutritionPlan {
  goalLabel: string;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  waterTargetGlasses: number;
  preMissionTip: string;
  meals: NutritionMeal[];
}

export function getNutritionPlan(
  goals: FitnessGoal[],
  category: MissionDifficulty,
): NutritionPlan {
  const primary: FitnessGoal = goals[0] ?? 'remise_forme';
  const tierBonus =
    category === 'Expert' ? 350 : category === 'Pro' ? 200 : category === 'Standard' ? 100 : 0;

  if (primary === 'perte_poids') {
    return {
      goalLabel: 'Déficit propre • Brûle-graisse',
      targetCalories: 1950 + tierBonus,
      proteinG: 140,
      carbsG: 170,
      waterTargetGlasses: 9,
      preMissionTip:
        'Avant 05h00 : 1 grand verre d’eau + 1/2 banane ou café noir sans sucre (digestion légère).',
      meals: [
        {
          id: 'm1',
          time: '07:30',
          title: 'Petit-déjeuner protéiné',
          detail: '2 œufs brouillés, 1/2 avocat, pain complet & baies',
          kcal: 420,
          protein: 24,
          imageUrl: '/images/meal-breakfast.jpg',
        },
        {
          id: 'm2',
          time: '13:00',
          title: 'Déjeuner équilibré',
          detail: 'Poulet grillé, légumes verts & petite portion riz',
          kcal: 620,
          protein: 48,
          imageUrl: '/images/meal-lunch.jpg',
        },
        {
          id: 'm3',
          time: '16:30',
          title: 'Collation coupe-faim',
          detail: 'Yaourt grec sans sucre + amandes & rondelles de banane',
          kcal: 240,
          protein: 14,
          imageUrl: '/images/meal-snack.jpg',
        },
        {
          id: 'm4',
          time: '20:00',
          title: 'Dîner léger récup',
          detail: 'Filet de poisson aux herbes, salade fraîche & patate douce',
          kcal: 510,
          protein: 42,
          imageUrl: '/images/meal-dinner.jpg',
        },
      ],
    };
  }

  if (primary === 'prise_muscle') {
    return {
      goalLabel: 'Construction musculaire • Surplus maîtrisé',
      targetCalories: 2650 + tierBonus,
      proteinG: 165,
      carbsG: 310,
      waterTargetGlasses: 10,
      preMissionTip:
        '30 min avant le duel ou la course : 1 banane + 1 cuillère de beurre de cacahuète.',
      meals: [
        {
          id: 'm1',
          time: '07:30',
          title: 'Matin Force',
          detail: '3 œufs complets, avocat, pain complet & fruits rouges',
          kcal: 650,
          protein: 32,
          imageUrl: '/images/meal-breakfast.jpg',
        },
        {
          id: 'm2',
          time: '13:00',
          title: 'Déjeuner Masse Propre',
          detail: 'Poulet grillé, attiéké ou riz basmati + haricots verts',
          kcal: 820,
          protein: 52,
          imageUrl: '/images/meal-lunch.jpg',
        },
        {
          id: 'm3',
          time: '17:00',
          title: 'Collation Post-Séance',
          detail: 'Yaourt grec + banane fraîche, amandes & filet de miel',
          kcal: 420,
          protein: 28,
          imageUrl: '/images/meal-snack.jpg',
        },
        {
          id: 'm4',
          time: '20:30',
          title: 'Dîner Récupération',
          detail: 'Poisson grillé, patate douce rôtie & salade croquante',
          kcal: 710,
          protein: 46,
          imageUrl: '/images/meal-dinner.jpg',
        },
      ],
    };
  }

  return {
    goalLabel:
      primary === 'foot_sante' || primary === 'endurance_5am'
        ? 'Énergie Cardio & Endurance'
        : 'Équilibre & Vitalité',
    targetCalories: 2250 + tierBonus,
    proteinG: 135,
    carbsG: 260,
    waterTargetGlasses: 8,
    preMissionTip:
      'Avant une mission 05h00 : 1 verre d’eau + 2 dattes ou 1 banane pour éviter le coup de fatigue.',
    meals: [
      {
        id: 'm1',
        time: '07:30',
        title: 'Réveil Énergie',
        detail: '2 œufs, avocat, pain complet & baies fraîches',
        kcal: 490,
        protein: 24,
        imageUrl: '/images/meal-breakfast.jpg',
      },
      {
        id: 'm2',
        time: '13:00',
        title: 'Assiette Terrain',
        detail: 'Poulet grillé, attiéké ou riz basmati + haricots verts',
        kcal: 730,
        protein: 46,
        imageUrl: '/images/meal-lunch.jpg',
      },
      {
        id: 'm3',
        time: '16:30',
        title: 'Collation Hydratante',
        detail: 'Yaourt grec + banane, amandes & miel',
        kcal: 270,
        protein: 12,
        imageUrl: '/images/meal-snack.jpg',
      },
      {
        id: 'm4',
        time: '20:00',
        title: 'Dîner Récupération',
        detail: 'Filet de poisson aux herbes, patate douce & salade',
        kcal: 580,
        protein: 40,
        imageUrl: '/images/meal-dinner.jpg',
      },
    ],
  };
}
