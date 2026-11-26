// Synthétiseur d'effets sonores Web Audio API (aucun fichier audio externe requis)

let audioCtx: AudioContext | null = null;

const SOUND_STORAGE_KEY = 'dek_fitness_sound_v1';
const listeners = new Set<() => void>();

function readSavedPreference(): boolean {
  try {
    return typeof window === 'undefined' || window.localStorage.getItem(SOUND_STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

let soundEnabled = readSavedPreference();

/** Vibration courte (Android) en complément du son — ignorée si non supportée. */
function vibrate(pattern: number | number[]) {
  if (!soundEnabled || typeof navigator === 'undefined' || !('vibrate' in navigator)) return;
  try {
    navigator.vibrate(pattern);
  } catch {
    // Ignore
  }
}

function getContext(): AudioContext | null {
  if (!soundEnabled || typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const Ctx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctx) return null;
      audioCtx = new Ctx();
    }
    if (audioCtx.state === 'suspended') {
      void audioCtx.resume();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

export function setSoundEnabled(enabled: boolean) {
  soundEnabled = enabled;
  try {
    window.localStorage.setItem(SOUND_STORAGE_KEY, enabled ? 'on' : 'off');
  } catch {
    // Ignore
  }
  listeners.forEach((l) => l());
}

/** Abonnement pour `useSyncExternalStore` (garde le bouton Son synchronisé partout). */
export function subscribeSound(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function isSoundEnabled(): boolean {
  return soundEnabled;
}

/** Bip sec pour chaque seconde du compte à rebours (5, 4, 3, 2, 1) */
export function playTick() {
  const ctx = getContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(660, now);
    osc.frequency.exponentialRampToValueAtTime(440, now + 0.08);
    gain.gain.setValueAtTime(0.14, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.09);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.095);
  } catch {
    // Silencieux si AudioContext bloqué
  }
}

/** Double bip énergique pour le Top Départ / Début de duel */
export function playGo() {
  vibrate(40);
  const ctx = getContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    [880, 1320].forEach((freq, idx) => {
      const start = now + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.14, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.16);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.17);
    });
  } catch {
    // Silencieux
  }
}

/** Impact percussif léger quand une répétition valide des dégâts (-5 HP) */
export function playHit() {
  vibrate(15);
  const ctx = getContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(210, now);
    osc.frequency.exponentialRampToValueAtTime(58, now + 0.11);
    gain.gain.setValueAtTime(0.24, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.13);
  } catch {
    // Silencieux
  }
}

/** Accord ascendant court en cas de Mission réussie ou K.O. */
export function playVictory() {
  vibrate([40, 50, 80]);
  const ctx = getContext();
  if (!ctx) return;
  try {
    const now = ctx.currentTime;
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const start = now + idx * 0.075;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.15, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.28);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  } catch {
    // Silencieux
  }
}

/** Voix du coach (synthèse vocale du téléphone, en français). Respecte le réglage Son. */
export function speak(text: string) {
  if (!soundEnabled || typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  try {
    const synth = window.speechSynthesis;
    synth.cancel();
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'fr-FR';
    utter.rate = 1.05;
    utter.pitch = 1;
    const frVoice = synth.getVoices().find((v) => v.lang.toLowerCase().startsWith('fr'));
    if (frVoice) utter.voice = frVoice;
    synth.speak(utter);
  } catch {
    // Synthèse vocale indisponible
  }
}

export function stopSpeaking() {
  try {
    window.speechSynthesis?.cancel();
  } catch {
    // Ignore
  }
}
