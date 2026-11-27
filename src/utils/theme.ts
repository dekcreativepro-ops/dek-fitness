// Couleur d'accent de l'app (le « lime » par défaut), choisie par l'utilisateur et appliquée via la variable CSS du thème.

export interface AccentOption {
  id: string;
  label: string;
  color: string;
}

export const ACCENTS: AccentOption[] = [
  { id: 'lime', label: 'Lime', color: '#C8FF00' },
  { id: 'aqua', label: 'Bleu glace', color: '#5BD6FF' },
  { id: 'orange', label: 'Orange', color: '#FF9F45' },
  { id: 'rose', label: 'Rose', color: '#FF5EA8' },
  { id: 'violet', label: 'Violet', color: '#B58CFF' },
  { id: 'or', label: 'Or', color: '#F5C542' },
];

const KEY = 'dek_accent_v1';

export function loadAccent(): string {
  try {
    const id = window.localStorage.getItem(KEY);
    return ACCENTS.some((a) => a.id === id) ? (id as string) : 'lime';
  } catch {
    return 'lime';
  }
}

export function applyAccent(id: string): void {
  const accent = ACCENTS.find((a) => a.id === id) ?? ACCENTS[0];
  document.documentElement.style.setProperty('--color-lime', accent.color);
}

export function saveAccent(id: string): void {
  try {
    window.localStorage.setItem(KEY, id);
  } catch {
    // choix non conservé
  }
  applyAccent(id);
}
