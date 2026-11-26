// Progression de saison : rangs XP, série de jours actifs, activité hebdo et clés anti-farm.

export interface RankInfo {
  rank: string;
  /** XP de départ du rang actuel */
  rankFloorXp: number;
  /** XP à atteindre pour le rang suivant (= rankFloorXp pour le dernier rang) */
  nextRankXp: number;
  nextRank: string | null;
  /** Progression 0..100 dans le rang actuel */
  pct: number;
}

export const SEASON_RANKS: { name: string; minXp: number }[] = [
  { name: 'Recrue', minXp: 0 },
  { name: 'Challenger', minXp: 500 },
  { name: 'Pro', minXp: 1500 },
  { name: 'Élite', minXp: 3500 },
  { name: 'Légende DEK', minXp: 7000 },
];

export function getRankInfo(xp: number): RankInfo {
  let idx = 0;
  for (let i = 0; i < SEASON_RANKS.length; i++) {
    if (xp >= SEASON_RANKS[i].minXp) idx = i;
  }
  const current = SEASON_RANKS[idx];
  const next = SEASON_RANKS[idx + 1] ?? null;
  if (!next) {
    return { rank: current.name, rankFloorXp: current.minXp, nextRankXp: current.minXp, nextRank: null, pct: 100 };
  }
  const span = next.minXp - current.minXp;
  return {
    rank: current.name,
    rankFloorXp: current.minXp,
    nextRankXp: next.minXp,
    nextRank: next.name,
    pct: Math.max(0, Math.min(100, Math.round(((xp - current.minXp) / span) * 100))),
  };
}

/** Clé de jour locale AAAA-MM-JJ (pas d'UTC : le « jour » suit l'heure du téléphone). */
export function dayKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Lundi de la semaine courante (clé de jour), utilisé pour les récompenses hebdomadaires. */
export function weekKey(date: Date = new Date()): string {
  const monday = new Date(date);
  const offset = (date.getDay() + 6) % 7; // 0 = lundi
  monday.setDate(date.getDate() - offset);
  return dayKey(monday);
}

/** Les 7 jours (lundi → dimanche) de la semaine courante. */
export function currentWeekDays(date: Date = new Date()): { key: string; label: string; isToday: boolean }[] {
  const labels = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
  const offset = (date.getDay() + 6) % 7;
  const today = dayKey(date);
  return labels.map((label, i) => {
    const d = new Date(date);
    d.setDate(date.getDate() - offset + i);
    const key = dayKey(d);
    return { key, label, isToday: key === today };
  });
}

/** Nombre de jours consécutifs actifs se terminant aujourd'hui (ou hier si rien encore aujourd'hui). */
export function computeStreak(activityLog: Record<string, number>, date: Date = new Date()): number {
  const cursor = new Date(date);
  if (!activityLog[dayKey(cursor)]) {
    cursor.setDate(cursor.getDate() - 1);
  }
  let streak = 0;
  while (activityLog[dayKey(cursor)]) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

/** Garde seulement les 60 derniers jours du journal d'activité. */
export function pruneActivityLog(activityLog: Record<string, number>, date: Date = new Date()): Record<string, number> {
  const limit = new Date(date);
  limit.setDate(limit.getDate() - 60);
  const limitKey = dayKey(limit);
  const next: Record<string, number> = {};
  for (const [k, v] of Object.entries(activityLog)) {
    if (k >= limitKey) next[k] = v;
  }
  return next;
}

/** Temps relatif en français (« À l'instant », « Il y a 5 min »…). */
export function formatTimeAgo(timestamp: number, now: number = Date.now()): string {
  const diffSec = Math.max(0, Math.round((now - timestamp) / 1000));
  if (diffSec < 60) return 'À l’instant';
  const min = Math.round(diffSec / 60);
  if (min < 60) return `Il y a ${min} min`;
  const h = Math.round(min / 60);
  if (h < 24) return `Il y a ${h} h`;
  const d = Math.round(h / 24);
  return d === 1 ? 'Hier' : `Il y a ${d} j`;
}

/** Transforme un nom en pseudo (@koffi_sprint), accents retirés. */
export function toHandle(name: string): string {
  const clean = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9_]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 14);
  return clean ? `@${clean}` : '@dek_athlete';
}
