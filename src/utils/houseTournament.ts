import type { HouseExercise } from '../types/dek';
import { dayKey } from './progression';

// Tournoi Défi House : un champion par défi (zone ou national). On peut venir relever le défi à tout moment ;
// battre le champion donne son titre, puis un nouveau challenger revient plus fort le lendemain.

export interface HouseChallenge {
  id: string;
  zone: string;
  exercise: HouseExercise;
  champion: string;
  score: number; // reps du champion en 60 s
  rewardXp: number;
  level: number; // monte à chaque titre conquis : le défi devient plus dur
  wins: number; // titres conquis par toi sur ce défi
  mine: boolean; // tu détiens le titre
  sinceDay: string;
}

const KEY = 'dek_house_tournament_v1';

const SEED: Pick<HouseChallenge, 'id' | 'zone' | 'exercise' | 'champion' | 'score' | 'rewardXp'>[] = [
  { id: 'national-pompes', zone: 'Cameroun · national', exercise: 'pompes', champion: 'Ngando_Sprint', score: 34, rewardXp: 420 },
  { id: 'national-burpees', zone: 'Cameroun · national', exercise: 'burpees', champion: 'Estelle_5h', score: 22, rewardXp: 420 },
  { id: 'akwa-squats', zone: 'Zone Akwa', exercise: 'squats', champion: 'Mbarga_Iron', score: 30, rewardXp: 300 },
  { id: 'bonanjo-jacks', zone: 'Zone Bonanjo', exercise: 'jumping_jacks', champion: 'Nkeng_Pace', score: 48, rewardXp: 300 },
  { id: 'bonapriso-gainage', zone: 'Zone Bonapriso', exercise: 'gainage', champion: 'Tchoua_Pace', score: 40, rewardXp: 300 },
  { id: 'bonamoussadi-corde', zone: 'Zone Bonamoussadi', exercise: 'corde', champion: 'Mireille_Speed', score: 56, rewardXp: 300 },
];

const CHALLENGERS = ['Bekolo_9', 'Fonkam_Goal', 'Atangana_7', 'Ousmane_W', 'Abdou_Cap', 'Cédric_K', 'Eto_Jr', 'Franck_R'];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

interface Saved {
  day: string;
  items: Record<string, Pick<HouseChallenge, 'champion' | 'score' | 'level' | 'wins' | 'mine' | 'sinceDay'>>;
}

function readSaved(): Saved | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function toSaved(list: HouseChallenge[], day: string): Saved {
  const items: Saved['items'] = {};
  for (const c of list) items[c.id] = { champion: c.champion, score: c.score, level: c.level, wins: c.wins, mine: c.mine, sinceDay: c.sinceDay };
  return { day, items };
}

export function saveChallenges(list: HouseChallenge[]): void {
  try {
    window.localStorage.setItem(KEY, JSON.stringify(toSaved(list, dayKey())));
  } catch {
    // tournoi non conservé
  }
}

/** Charge le tournoi et le fait évoluer d'un jour : les champions progressent, tes titres sont contestés. */
export function loadChallenges(): HouseChallenge[] {
  const today = dayKey();
  const saved = readSaved();
  const list: HouseChallenge[] = SEED.map((s) => {
    const sv = saved?.items[s.id];
    return { ...s, champion: sv?.champion ?? s.champion, score: sv?.score ?? s.score, level: sv?.level ?? 0, wins: sv?.wins ?? 0, mine: sv?.mine ?? false, sinceDay: sv?.sinceDay ?? today };
  });
  if (saved && saved.day !== today) {
    for (const c of list) {
      if (c.mine && c.sinceDay !== today) {
        // un challenger veut reprendre ton titre, plus fort que toi
        c.champion = CHALLENGERS[hash(c.id + today) % CHALLENGERS.length];
        c.score = c.score + 1 + c.level;
        c.mine = false;
      } else if (!c.mine) {
        c.score += 1 + (hash(c.id + today) % 2); // le champion s'entraîne
      }
    }
    saveChallenges(list);
  }
  return list;
}

/** Tu bats le champion : tu prends le titre, le défi monte d'un niveau. */
export function winChallenge(list: HouseChallenge[], id: string, reps: number, myName: string): HouseChallenge[] {
  const next = list.map((c) =>
    c.id === id ? { ...c, champion: myName, score: Math.max(reps, c.score + 1), level: c.level + 1, wins: c.wins + 1, mine: true, sinceDay: dayKey() } : c,
  );
  saveChallenges(next);
  return next;
}
