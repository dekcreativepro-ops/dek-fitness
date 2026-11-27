import { isSoundEnabled } from './soundFx';

// Annonceur « jeu vidéo » : phrases courtes en anglais (« Welcome to Gym Building », « Spot me », « Let's go »…).
// Voix masculine par défaut, voix féminine pour les joueuses, ton plus grave et sec en mode à fond.
//
// Qualité : on cherche d'abord un fichier de voix de studio `/voices/<male|female>/<phrase>.mp3` (dépose-les dans
// public/voices pour remplacer la synthèse), sinon on prend la meilleure voix du téléphone (voix « Natural/Neural »
// de préférence : Chrome et Edge en proposent d'excellentes).

export type VoiceGender = 'male' | 'female';
export type VoiceTone = 'hype' | 'hardcore' | 'calm';

export const VOICE_LINES = {
  welcome: 'Welcome to Gym Building!',
  spot: 'Spot me! Do your lift!',
  lift: 'Rest over. Do your lift!',
  go: "Let's go!",
  beast: 'Workout complete. Beast mode!',
  fight: 'Round one. Fight!',
  challenge: 'Challenge accepted!',
  victory: 'Victory! Flawless.',
  title: 'New champion!',
  defeat: 'Defeat. Get up and try again.',
  bonus: 'Bonus unlocked!',
  bonusAhead: 'Bonus ahead!',
  almost: 'Almost there! Finish him!',
  half: 'Halfway! Push harder!',
  ten: 'Ten seconds! Give everything!',
  rhythm: 'Perfect rhythm!',
  speed: 'Speed combo!',
  mission: 'Mission start. Go, go, go!',
  final: 'Final stretch! Finish strong!',
  complete: 'Mission complete!',
} as const;
export type VoiceKey = keyof typeof VOICE_LINES;

const profile: { gender: VoiceGender } = { gender: 'male' };

export function setVoiceGender(gender: VoiceGender): void {
  profile.gender = gender;
}

const FEMALE = /(female|woman|zira|aria|jenny|samantha|victoria|karen|susan|moira|tessa|fiona|libby|sonia|hazel|emma|ava|allison|amy|joanna|salli|kimberly|natasha)/i;
const MALE = /(\bmale\b|david|mark|guy|alex|daniel|fred|george|ryan|james|tom|brian|matthew|eric|davis|christopher|roger|steffan)/i;

let voices: SpeechSynthesisVoice[] = [];
function refreshVoices(): void {
  try {
    voices = window.speechSynthesis.getVoices();
  } catch {
    voices = [];
  }
}
if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
  refreshVoices();
  window.speechSynthesis.addEventListener?.('voiceschanged', refreshVoices);
}

/** Meilleure voix anglaise disponible pour le genre demandé (voix naturelles/neurales en priorité). */
function pickVoice(gender: VoiceGender): SpeechSynthesisVoice | undefined {
  let best: SpeechSynthesisVoice | undefined;
  let bestScore = -1;
  for (const v of voices) {
    if (!v.lang.toLowerCase().startsWith('en')) continue;
    let score = 0;
    if (/natural|neural|online/i.test(v.name)) score += 4;
    else if (/google/i.test(v.name)) score += 2;
    if (v.lang.toLowerCase() === 'en-us') score += 1;
    const isF = FEMALE.test(v.name);
    const isM = MALE.test(v.name);
    if (gender === 'female' ? isF : isM) score += 5;
    if (gender === 'female' ? isM : isF) score -= 5;
    if (score > bestScore) {
      bestScore = score;
      best = v;
    }
  }
  return best;
}

const fileOk = new Map<string, boolean>();
let current: HTMLAudioElement | null = null;

async function playStudioFile(key: VoiceKey): Promise<boolean> {
  const url = `/voices/${profile.gender}/${key}.mp3`;
  let ok = fileOk.get(url);
  if (ok === undefined) {
    try {
      const res = await fetch(url, { method: 'HEAD' });
      ok = res.ok && (res.headers.get('content-type') ?? '').startsWith('audio');
    } catch {
      ok = false;
    }
    fileOk.set(url, ok);
  }
  if (!ok) return false;
  try {
    current?.pause();
    current = new Audio(url);
    await current.play();
    return true;
  } catch {
    return false;
  }
}

function speakSynth(text: string, tone: VoiceTone): void {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'en-US';
    const voice = pickVoice(profile.gender);
    if (voice) u.voice = voice;
    const female = profile.gender === 'female';
    // Gamer : grave et sec pour les garçons en mode à fond, plus aiguë et énergique pour les filles
    u.pitch = female ? (tone === 'hardcore' ? 1.15 : tone === 'calm' ? 1.1 : 1.3) : tone === 'hardcore' ? 0.55 : tone === 'calm' ? 0.95 : 0.8;
    u.rate = tone === 'hardcore' ? 0.92 : tone === 'calm' ? 0.95 : 1.06;
    u.volume = 1;
    synth.speak(u);
  } catch {
    // synthèse vocale indisponible
  }
}

/** Annonce une phrase du jeu. `enabled` permet de respecter le réglage « Voix de jeu » du jeu en cours. */
export function say(key: VoiceKey, tone: VoiceTone = 'hype', enabled = true): void {
  if (!enabled || !isSoundEnabled()) return;
  void playStudioFile(key).then((played) => {
    if (!played) speakSynth(VOICE_LINES[key], tone);
  });
}
