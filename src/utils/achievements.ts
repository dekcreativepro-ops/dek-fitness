import type { UserProfile } from '../types/dek';
import { dayKey } from './progression';

// Mur des trophées : jalons calculés à partir des statistiques réelles du profil.

export type AchievementGroup = 'jalons' | 'series' | 'speciaux';

export interface AchievementDef {
  id: string;
  group: AchievementGroup;
  title: string;
  description: string;
  /** Texte gravé au centre de l'écusson */
  mark: string;
  color: string;
  target: number;
  metric: (s: AchievementStats) => number;
}

export interface AchievementStats {
  sessions: number;
  bestStreak: number;
  kcal: number;
  houseWins: number;
  missions: number;
  guided: number;
  xp: number;
  thursdayKing: boolean;
  discipline: number;
}

/** Plus longue série de jours actifs consécutifs dans le journal (60 derniers jours). */
function bestStreakOf(log: Record<string, number>): number {
  const days = Object.keys(log)
    .filter((k) => log[k] > 0)
    .sort();
  let best = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const k of days) {
    const d = new Date(`${k}T12:00:00`);
    if (prev) {
      const expected = new Date(prev);
      expected.setDate(expected.getDate() + 1);
      run = dayKey(expected) === k ? run + 1 : 1;
    } else {
      run = 1;
    }
    best = Math.max(best, run);
    prev = d;
  }
  return best;
}

export function getAchievementStats(user: UserProfile): AchievementStats {
  const guided = Object.values(user.workoutsDone).reduce((a, b) => a + b, 0);
  return {
    sessions: user.missionsCompleted + user.houseWins + user.santePlayed + guided,
    bestStreak: Math.max(bestStreakOf(user.activityLog), user.streakDays),
    kcal: Object.values(user.kcalLog).reduce((a, b) => a + b, 0),
    houseWins: user.houseWins,
    missions: user.missionsCompleted,
    guided,
    xp: user.xp,
    thursdayKing: user.badges.includes('Roi du Jeudi'),
    discipline: user.disciplineScore,
  };
}

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: 'first', group: 'jalons', title: 'Premier pas', description: 'Valide ta toute première séance.', mark: '01', color: '#38BDF8', target: 1, metric: (s) => s.sessions },
  { id: 'regular', group: 'jalons', title: 'Régulier', description: '10 séances validées, tous univers confondus.', mark: '10', color: '#C8FF00', target: 10, metric: (s) => s.sessions },
  { id: 'machine', group: 'jalons', title: 'Machine', description: '50 séances validées. Rien ne t’arrête.', mark: '50', color: '#FF8A00', target: 50, metric: (s) => s.sessions },
  { id: 'kcal1k', group: 'jalons', title: 'Brûleur', description: '1 000 kcal actives brûlées.', mark: '1K', color: '#FF8A00', target: 1000, metric: (s) => s.kcal },
  { id: 'kcal5k', group: 'jalons', title: 'Fournaise', description: '5 000 kcal actives brûlées.', mark: '5K', color: '#FF2E54', target: 5000, metric: (s) => s.kcal },
  { id: 'streak3', group: 'series', title: 'Série 3 jours', description: '3 jours actifs d’affilée.', mark: '3J', color: '#00E5FF', target: 3, metric: (s) => s.bestStreak },
  { id: 'streak7', group: 'series', title: 'Semaine parfaite', description: '7 jours actifs d’affilée.', mark: '7J', color: '#C8FF00', target: 7, metric: (s) => s.bestStreak },
  { id: 'streak30', group: 'series', title: 'Mois de fer', description: '30 jours actifs d’affilée.', mark: '30J', color: '#F5C542', target: 30, metric: (s) => s.bestStreak },
  { id: 'ko', group: 'speciaux', title: 'Premier K.O.', description: 'Gagne un duel Défi House IA.', mark: 'KO', color: '#FF2E54', target: 1, metric: (s) => s.houseWins },
  { id: 'gps', group: 'speciaux', title: 'Éclaireur GPS', description: '5 missions Outdoor réussies.', mark: 'GPS', color: '#00E5FF', target: 5, metric: (s) => s.missions },
  { id: 'guided', group: 'speciaux', title: 'Élève modèle', description: '3 séances guidées terminées.', mark: '×3', color: '#A855F7', target: 3, metric: (s) => s.guided },
  { id: 'mvp', group: 'speciaux', title: 'Roi du Jeudi', description: 'Clôture un Terrain du Jeudi officiel.', mark: 'MVP', color: '#F5C542', target: 1, metric: (s) => (s.thursdayKing ? 1 : 0) },
  { id: 'elite', group: 'speciaux', title: 'Élite', description: 'Atteins le rang de saison Élite (3 500 XP).', mark: 'ÉL', color: '#FF8A00', target: 3500, metric: (s) => s.xp },
];

export const ACHIEVEMENT_GROUPS: { id: AchievementGroup; label: string }[] = [
  { id: 'jalons', label: 'Jalons d’entraînement' },
  { id: 'series', label: 'Séries' },
  { id: 'speciaux', label: 'Exploits spéciaux' },
];

export function getEarnedAchievementIds(user: UserProfile): string[] {
  const stats = getAchievementStats(user);
  return ACHIEVEMENTS.filter((a) => a.metric(stats) >= a.target).map((a) => a.id);
}
