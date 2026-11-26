// Reprise d'une séance guidée interrompue (stockée localement 24 h).

const RESUME_KEY = 'dek_fitness_resume_v1';
const MAX_AGE_MS = 24 * 60 * 60 * 1000;

export interface WorkoutResume {
  programId: string;
  idx: number;
  done: number[];
  total: number;
  savedAt: number;
}

export function getWorkoutResume(): WorkoutResume | null {
  try {
    const raw = window.localStorage.getItem(RESUME_KEY);
    if (!raw) return null;
    const r = JSON.parse(raw) as WorkoutResume;
    if (!r || typeof r.programId !== 'string' || !Array.isArray(r.done)) return null;
    if (Date.now() - r.savedAt > MAX_AGE_MS) return null;
    return r;
  } catch {
    return null;
  }
}

export function saveWorkoutResume(r: Omit<WorkoutResume, 'savedAt'>) {
  try {
    window.localStorage.setItem(RESUME_KEY, JSON.stringify({ ...r, savedAt: Date.now() }));
  } catch {
    // Ignore
  }
}

export function clearWorkoutResume() {
  try {
    window.localStorage.removeItem(RESUME_KEY);
  } catch {
    // Ignore
  }
}
