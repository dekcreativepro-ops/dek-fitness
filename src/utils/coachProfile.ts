import { isSoundEnabled } from './soundFx';
import { SYNTH_VOICE } from './gameVoice';

// Profil du coach IA (nom, genre, style), conversation, historique de performances et voix en français.

export type CoachStyle = 'bienveillant' | 'equilibre' | 'hardcore';

export interface CoachProfile {
  name: string;
  gender: 'femme' | 'homme';
  style: CoachStyle;
  voice: boolean;
  setupDone: boolean;
}

const PROFILE_KEY = 'dek_coach_profile_v1';
const CHAT_KEY = 'dek_coach_chat_v1';
const PERF_KEY = 'dek_perf_history_v1';

export const DEFAULT_COACH: CoachProfile = { name: 'Max', gender: 'homme', style: 'equilibre', voice: true, setupDone: false };

// ---------- profil (avec abonnement pour useSyncExternalStore) ----------
let cached: CoachProfile | null = null;
const listeners = new Set<() => void>();

function readProfile(): CoachProfile {
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? { ...DEFAULT_COACH, ...(JSON.parse(raw) as Partial<CoachProfile>) } : DEFAULT_COACH;
  } catch {
    return DEFAULT_COACH;
  }
}

export function getCoach(): CoachProfile {
  if (!cached) cached = readProfile();
  return cached;
}

export function saveCoach(patch: Partial<CoachProfile>): void {
  cached = { ...getCoach(), ...patch };
  try {
    window.localStorage.setItem(PROFILE_KEY, JSON.stringify(cached));
  } catch {
    // profil non conservé
  }
  listeners.forEach((l) => l());
}

export function subscribeCoach(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

// ---------- conversation ----------
export interface ChatMsg {
  id: number;
  from: 'coach' | 'user';
  text: string;
}

export function loadChat(): ChatMsg[] {
  try {
    const raw = window.localStorage.getItem(CHAT_KEY);
    return raw ? (JSON.parse(raw) as ChatMsg[]) : [];
  } catch {
    return [];
  }
}

export function saveChat(list: ChatMsg[]): void {
  try {
    window.localStorage.setItem(CHAT_KEY, JSON.stringify(list.slice(-60)));
  } catch {
    // conversation non conservée
  }
}

// ---------- historique de performances (pour « tu as fait mieux que la dernière fois ») ----------
export interface PerfEntry {
  last: number;
  best: number;
  runs: number;
}

export function loadPerf(key: string): PerfEntry | null {
  try {
    const raw = window.localStorage.getItem(PERF_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, PerfEntry>) : {};
    return all[key] ?? null;
  } catch {
    return null;
  }
}

/** Enregistre une performance ; `better` dit si une valeur plus basse (temps) ou plus haute (reps) est meilleure. */
export function savePerf(key: string, value: number, better: 'lower' | 'higher'): { previous: PerfEntry | null; isRecord: boolean; improved: boolean } {
  let all: Record<string, PerfEntry> = {};
  try {
    const raw = window.localStorage.getItem(PERF_KEY);
    all = raw ? (JSON.parse(raw) as Record<string, PerfEntry>) : {};
  } catch {
    all = {};
  }
  const previous = all[key] ?? null;
  const beats = (a: number, b: number) => (better === 'lower' ? a < b : a > b);
  const isRecord = !previous || beats(value, previous.best);
  const improved = !previous || beats(value, previous.last);
  all[key] = { last: value, best: isRecord ? value : previous!.best, runs: (previous?.runs ?? 0) + 1 };
  try {
    window.localStorage.setItem(PERF_KEY, JSON.stringify(all));
  } catch {
    // historique non conservé
  }
  return { previous, isRecord, improved };
}

// ---------- voix du coach (français, selon le genre choisi) ----------
const FEMALE_FR = /(hortense|julie|denise|eloise|éloïse|marie|amelie|amélie|female|femme|audrey|celine|céline)/i;
const MALE_FR = /(paul|henri|claude|remy|rémy|male|homme|antoine|thomas|nicolas)/i;

export function coachSpeak(text: string, coach: CoachProfile): void {
  // voix de synthèse coupée (rendu robotique) : le coach s'exprime par écrit en attendant une vraie voix
  if (!SYNTH_VOICE || !coach.voice || !isSoundEnabled() || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'fr-FR';
    const fr = synth.getVoices().filter((v) => v.lang.toLowerCase().startsWith('fr'));
    const want = coach.gender === 'femme' ? FEMALE_FR : MALE_FR;
    const avoid = coach.gender === 'femme' ? MALE_FR : FEMALE_FR;
    const voice = fr.find((v) => want.test(v.name) && /natural|neural|online/i.test(v.name)) ?? fr.find((v) => want.test(v.name)) ?? fr.find((v) => !avoid.test(v.name)) ?? fr[0];
    if (voice) u.voice = voice;
    const female = coach.gender === 'femme';
    u.pitch = female ? 1.1 : 0.9;
    u.rate = coach.style === 'hardcore' ? 1.12 : coach.style === 'bienveillant' ? 0.98 : 1.05;
    synth.speak(u);
  } catch {
    // synthèse indisponible
  }
}
