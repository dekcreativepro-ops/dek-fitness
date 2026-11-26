import type { CardioLevel, MissionDifficulty } from '../types/dek';

export const TIER_ORDER: MissionDifficulty[] = ['Amateur', 'Standard', 'Pro', 'Expert'];

export function getTierIndex(tier: MissionDifficulty): number {
  return TIER_ORDER.indexOf(tier);
}

export const TIER_COLORS: Record<MissionDifficulty, string> = {
  Amateur: '#38BDF8',
  Standard: '#C8FF00',
  Pro: '#FF8A00',
  Expert: '#FF2E54',
};

export const TIER_REQUIREMENTS: Record<
  MissionDifficulty,
  { title: string; missionRule: string; skillRule: string; healthReason: string }
> = {
  Amateur: {
    title: 'Amateur (3 km)',
    missionRule: 'Ouvert à tous dès l’inscription (palier d’entrée sécurisé).',
    skillRule: 'Aucun minimum requis — idéal pour prendre le rythme sans danger.',
    healthReason: 'Permet d’habituer le cœur, les articulations et la respiration.',
  },
  Standard: {
    title: 'Standard (5 km)',
    missionRule: 'Réussir 2 missions Amateur (3 km) à l’heure.',
    skillRule: 'Ou réussir le test d’initiation avec ≥ 12 pompes, ≥ 20 squats, ≥ 45s gainage et base cardio 3-5 km.',
    healthReason: 'Évite les claquages et l’essoufflement excessif sur 5 km synchronisés.',
  },
  Pro: {
    title: 'Pro (10 km)',
    missionRule: 'Réussir 2 missions Standard (5 km) à l’heure.',
    skillRule: 'Ou test avec ≥ 25 pompes, ≥ 35 squats, ≥ 75s gainage et base cardio 5-10 km.',
    healthReason: 'Exige une vraie endurance foncière pour tenir 10 km dès 05h00.',
  },
  Expert: {
    title: 'Expert (15 km)',
    missionRule: 'Réussir 2 missions Pro (10 km) à l’heure.',
    skillRule: 'Ou test avec ≥ 40 pompes, ≥ 55 squats, ≥ 110s gainage et endurance 10+ km.',
    healthReason: 'Réservé aux athlètes entraînés pour prévenir tout risque cardiaque ou blessure.',
  },
};

export const CARDIO_LABELS: Record<CardioLevel, string> = {
  marche: 'Débutant / Marche (< 2 km)',
  '3km': 'À l’aise sur 3 km',
  '5km': 'À l’aise sur 5 km',
  '10km_plus': 'Habitué 10 km et +',
};

export function evaluateInitiation(
  pushups: number,
  squats: number,
  plankSec: number,
  cardioLevel: CardioLevel,
): {
  category: MissionDifficulty;
  score: number;
  summary: string;
  safetyNote: string;
} {
  const cardioPoints: Record<CardioLevel, number> = {
    marche: 10,
    '3km': 25,
    '5km': 45,
    '10km_plus': 65,
  };

  const score = Math.min(
    100,
    Math.round(
      Math.min(pushups, 50) * 0.45 +
        Math.min(squats, 70) * 0.25 +
        Math.min(plankSec, 150) * 0.15 +
        cardioPoints[cardioLevel] * 0.55,
    ),
  );

  // Détermination par compétences + plafond strict de sécurité santé (cardio)
  let rawCategory: MissionDifficulty = 'Amateur';

  if (pushups >= 40 && squats >= 55 && plankSec >= 110 && cardioLevel === '10km_plus') {
    rawCategory = 'Expert';
  } else if (
    pushups >= 25 &&
    squats >= 35 &&
    plankSec >= 75 &&
    (cardioLevel === '5km' || cardioLevel === '10km_plus')
  ) {
    rawCategory = 'Pro';
  } else if (pushups >= 12 && squats >= 20 && plankSec >= 45 && cardioLevel !== 'marche') {
    rawCategory = 'Standard';
  }

  // Plafond de protection cardio-vasculaire
  const maxByCardio: Record<CardioLevel, MissionDifficulty> = {
    marche: 'Amateur',
    '3km': 'Standard',
    '5km': 'Pro',
    '10km_plus': 'Expert',
  };

  const cappedIdx = Math.min(getTierIndex(rawCategory), getTierIndex(maxByCardio[cardioLevel]));
  const category = TIER_ORDER[cappedIdx];

  const wasCapped = getTierIndex(rawCategory) > cappedIdx;

  let safetyNote =
    'Ton palier est calibré à ta forme du jour : tu affronteras uniquement des athlètes de ton niveau.';
  if (wasCapped || (cardioLevel === 'marche' && pushups >= 15)) {
    safetyNote =
      'Protection santé active : même avec une bonne force musculaire, ton cardio limite l’accès aux longues distances jusqu’à validation des premières missions.';
  } else if (category === 'Amateur') {
    safetyNote =
      'Démarrage en douceur en Amateur (3 km) : progresse à ton rythme et débloque le Standard après 2 missions réussies.';
  }

  const summary = `${pushups} pompes • ${squats} squats • ${plankSec}s gainage • ${CARDIO_LABELS[cardioLevel]}`;

  return { category, score, summary, safetyNote };
}

export const HOUSE_OPPONENTS_BY_TIER: Record<
  MissionDifficulty,
  { name: string; intervalMs: number; hitChance: number; label: string }
> = {
  Amateur: {
    name: 'Awa_Init',
    intervalMs: 3300,
    hitChance: 0.72,
    label: 'Rythme doux • Initiation',
  },
  Standard: {
    name: 'Moussa_Std',
    intervalMs: 2400,
    hitChance: 0.76,
    label: 'Rythme équilibré • Standard',
  },
  Pro: {
    name: 'Koffi_Pro',
    intervalMs: 1800,
    hitChance: 0.82,
    label: 'Rythme soutenu • Pro',
  },
  Expert: {
    name: 'Titan_Exp',
    intervalMs: 1350,
    hitChance: 0.88,
    label: 'Rythme élite • Expert',
  },
};
