// Briques communes des jeux (Défi House, Gym Buddy, Raids, Terrains) : difficulté, vibration, réglages et records.

export type GameLevel = 'Facile' | 'Moyen' | 'Difficile' | 'Extrême';

export const LEVEL_COLORS: Record<GameLevel, string> = {
  Facile: '#C8FF00',
  Moyen: '#F5C542',
  Difficile: '#FF9F45',
  Extrême: '#FF4D5E',
};

/** Transforme un score de difficulté en niveau (seuils par défaut calés sur les pistes Outdoor). */
export function levelFromScore(score: number, cuts: [number, number, number] = [5.5, 8.5, 13]): GameLevel {
  return score <= cuts[0] ? 'Facile' : score <= cuts[1] ? 'Moyen' : score <= cuts[2] ? 'Difficile' : 'Extrême';
}

/** Vibre si le téléphone le permet (Android) ; sans effet sur ordinateur et iPhone. */
export function vibrate(pattern: number | number[]): void {
  try {
    navigator.vibrate?.(pattern);
  } catch {
    // vibration indisponible
  }
}

/** Chrono des bonus : 30 s pour pousser ses limites ; le temps restant s'ajoute à l'XP. */
export const BONUS_LIMIT_SEC = 30;

// ---------- Réglages par jeu (vibration & lueur, bonus chrono) ----------
export interface GamePrefs {
  alerts: boolean; // vibration + lueur verte
  bonus: boolean; // bonus chrono
  hardcore: boolean; // chrono 20 s, XP +25 %
  streak: boolean; // multiplicateur de série de victoires
  adaptive: boolean; // le défi s'ajuste à ton record
  coach: boolean; // consignes motivantes en cours de partie
  rhythm: boolean; // bonus de rythme et de rapidité
  voice: boolean; // annonceur gamer (voix masculine ou féminine)
}
const PREFS_KEY = 'dek_game_prefs_v1';
const DEFAULT_PREFS: GamePrefs = { alerts: true, bonus: true, hardcore: false, streak: true, adaptive: true, coach: true, rhythm: true, voice: true };

export function loadGamePrefs(gameId: string): GamePrefs {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, Partial<GamePrefs>>) : {};
    return { ...DEFAULT_PREFS, ...(all[gameId] ?? {}) };
  } catch {
    return DEFAULT_PREFS;
  }
}

export function saveGamePrefs(gameId: string, prefs: GamePrefs): void {
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, GamePrefs>) : {};
    all[gameId] = prefs;
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(all));
  } catch {
    // réglages non conservés
  }
}

// ---------- Records (meilleur score par jeu) ----------
export interface GameRecord {
  best: number;
  runs: number;
}
const RECORDS_KEY = 'dek_game_records_v1';

export function loadGameRecord(key: string): GameRecord | null {
  try {
    const raw = window.localStorage.getItem(RECORDS_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, GameRecord>) : {};
    return all[key] ?? null;
  } catch {
    return null;
  }
}

/** Enregistre un score ; renvoie le record à jour et si c'est un nouveau record. */
export function saveGameRecord(key: string, score: number): { record: GameRecord; isNew: boolean } {
  let all: Record<string, GameRecord> = {};
  try {
    const raw = window.localStorage.getItem(RECORDS_KEY);
    all = raw ? (JSON.parse(raw) as Record<string, GameRecord>) : {};
  } catch {
    all = {};
  }
  const old = all[key];
  const record = { best: Math.max(old?.best ?? 0, score), runs: (old?.runs ?? 0) + 1 };
  all[key] = record;
  try {
    window.localStorage.setItem(RECORDS_KEY, JSON.stringify(all));
  } catch {
    // record non conservé
  }
  return { record, isNew: score > (old?.best ?? 0) };
}

// ---------- Série de victoires ----------
const STREAK_KEY = 'dek_game_streak_v1';

export function loadStreak(gameId: string): number {
  try {
    const raw = window.localStorage.getItem(STREAK_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    return all[gameId] ?? 0;
  } catch {
    return 0;
  }
}

export function saveStreak(gameId: string, n: number): void {
  try {
    const raw = window.localStorage.getItem(STREAK_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, number>) : {};
    all[gameId] = n;
    window.localStorage.setItem(STREAK_KEY, JSON.stringify(all));
  } catch {
    // série non conservée
  }
}

/** +10 % d'XP par victoire d'affilée, jusqu'à +50 %. */
export function streakMultiplier(streak: number): number {
  return 1 + 0.1 * Math.min(5, Math.max(0, streak));
}
