// Abonnement DEK Premium : essai gratuit, état payé, quotas de la version gratuite et petit « store » React.
// L'état est gardé sur l'appareil. En production, l'activation doit venir du serveur de paiement
// (voir server/payments-proxy.mjs et docs/ABONNEMENT.md), jamais d'un simple clic dans l'app.

import { useSyncExternalStore } from 'react';

export const PREMIUM_PRICE_FCFA = 5000;
export const PREMIUM_PERIOD_DAYS = 30;
export const TRIAL_DAYS = 15;

/** Ce que la version gratuite (après l'essai) permet encore. */
export const FREE_PISTES = 3;
export const FREE_COACH_MESSAGES_PER_DAY = 5;
export const FREE_PROGRAM_IDS = ['pecs-maison', 'jambes-explosives', 'cardio-5am'];
export const FREE_HOUSE_MODE = 'ko_60s';

export type PremiumFeature = 'tournois' | 'pistes' | 'modes' | 'defi_tournoi' | 'defi_modes' | 'seances' | 'coach';

/** Ce que le Premium débloque (texte affiché sur l'écran d'abonnement). */
export const PREMIUM_BENEFITS: { id: PremiumFeature; title: string; desc: string }[] = [
  { id: 'tournois', title: 'Tournois de Terrains & Santé', desc: 'Poules, tableau final et classements dans chaque discipline.' },
  { id: 'defi_tournoi', title: 'Défi House complet', desc: 'Tournoi, 1er à 20, Survie, Équipe 4v4 : tous les modes de combat.' },
  { id: 'pistes', title: 'Pistes Outdoor illimitées', desc: `Gratuit : ${FREE_PISTES} pistes seulement. Premium : autant de tracés et de villes que tu veux, recherche de lieu.` },
  { id: 'modes', title: 'Modes Outdoor spéciaux', desc: 'Survie Checkpoint, Relais Escouade, Conquête Territoire et Duel Fantôme.' },
  { id: 'seances', title: 'Toutes les séances guidées', desc: `Gratuit : ${FREE_PROGRAM_IDS.length} séances. Premium : les 10 programmes avec démos vidéo.` },
  { id: 'coach', title: 'Coach IA sans limite', desc: `Gratuit : ${FREE_COACH_MESSAGES_PER_DAY} questions par jour. Premium : conversation illimitée.` },
];

export const FEATURE_LABEL: Record<PremiumFeature, string> = {
  tournois: 'Les tournois',
  defi_tournoi: 'Le tournoi Défi House',
  defi_modes: 'Les autres modes Défi House',
  pistes: `Les pistes au-delà de ${FREE_PISTES} gratuites`,
  modes: 'Les modes Outdoor spéciaux',
  seances: 'Cette séance',
  coach: `Les questions au-delà de ${FREE_COACH_MESSAGES_PER_DAY} par jour`,
};

export interface PremiumState {
  expiresAt: number | null;
  operator: 'mtn' | 'orange' | null;
  reference: string | null;
  /** true si le paiement venait du mode démo (aucun argent réel) */
  demo: boolean;
  /** début de l'essai gratuit (premier lancement) */
  trialStartedAt: number | null;
}

const KEY = 'dek_premium_v1';
const QUOTA_KEY = 'dek_quota_v1';
const FREE: PremiumState = { expiresAt: null, operator: null, reference: null, demo: false, trialStartedAt: null };

let cache: PremiumState | undefined;
const listeners = new Set<() => void>();
const emit = () => listeners.forEach((l) => l());

function read(): PremiumState {
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return FREE;
    const p = JSON.parse(raw) as Partial<PremiumState>;
    return {
      expiresAt: typeof p.expiresAt === 'number' ? p.expiresAt : null,
      operator: p.operator === 'mtn' || p.operator === 'orange' ? p.operator : null,
      reference: typeof p.reference === 'string' ? p.reference : null,
      demo: p.demo === true,
      trialStartedAt: typeof p.trialStartedAt === 'number' ? p.trialStartedAt : null,
    };
  } catch {
    return FREE;
  }
}

export function getPremium(): PremiumState {
  if (cache === undefined) cache = read();
  return cache;
}

function commit(next: PremiumState): void {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // stockage plein : l'état reste actif jusqu'au rechargement
  }
  emit();
}

const DAY = 86_400_000;

/** Abonnement payé en cours ? */
export function isPaidActive(state: PremiumState = getPremium()): boolean {
  return state.expiresAt !== null && state.expiresAt > Date.now();
}

/** Essai gratuit en cours ? */
export function isTrialActive(state: PremiumState = getPremium()): boolean {
  return state.trialStartedAt !== null && state.trialStartedAt + TRIAL_DAYS * DAY > Date.now();
}

/** Accès complet : abonnement payé OU essai gratuit. */
export function isPremiumActive(state: PremiumState = getPremium()): boolean {
  return isPaidActive(state) || isTrialActive(state);
}

export function daysLeft(state: PremiumState = getPremium()): number {
  if (!isPaidActive(state) || state.expiresAt === null) return 0;
  return Math.max(1, Math.ceil((state.expiresAt - Date.now()) / DAY));
}

export function trialDaysLeft(state: PremiumState = getPremium()): number {
  if (!isTrialActive(state) || state.trialStartedAt === null) return 0;
  return Math.max(1, Math.ceil((state.trialStartedAt + TRIAL_DAYS * DAY - Date.now()) / DAY));
}

/** Lance l'essai gratuit au tout premier lancement (une seule fois par appareil). */
export function startTrialIfNeeded(): void {
  const s = getPremium();
  if (s.trialStartedAt === null) commit({ ...s, trialStartedAt: Date.now() });
}

/** Active (ou prolonge) l'abonnement d'une période de 30 jours. */
export function activatePremium(info: { operator: 'mtn' | 'orange'; reference: string; demo: boolean }): void {
  const current = getPremium();
  const base = isPaidActive(current) && current.expiresAt !== null ? current.expiresAt : Date.now();
  commit({ ...current, expiresAt: base + PREMIUM_PERIOD_DAYS * DAY, operator: info.operator, reference: info.reference, demo: info.demo });
}

/** Le serveur est la source de vérité de l'abonnement : on recopie sa date de fin (sans toucher à l'essai gratuit). */
export function setServerPaidUntil(paidUntil: number | null): void {
  const s = getPremium();
  if (s.expiresAt === paidUntil) return;
  commit({ ...s, expiresAt: paidUntil, demo: false });
}

export function cancelPremium(): void {
  commit({ ...FREE, trialStartedAt: getPremium().trialStartedAt });
}

export function subscribePremium(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePremium(): { active: boolean; paid: boolean; trial: boolean; days: number; trialDays: number; state: PremiumState } {
  const state = useSyncExternalStore(subscribePremium, getPremium, getPremium);
  return { active: isPremiumActive(state), paid: isPaidActive(state), trial: !isPaidActive(state) && isTrialActive(state), days: daysLeft(state), trialDays: trialDaysLeft(state), state };
}

// ---------- quotas de la version gratuite ----------
interface Quota {
  pistes: number;
  coachDay: string;
  coachCount: number;
}
const today = () => new Date().toISOString().slice(0, 10);

function readQuota(): Quota {
  try {
    const p = JSON.parse(window.localStorage.getItem(QUOTA_KEY) ?? '{}') as Partial<Quota>;
    return { pistes: Number(p.pistes) || 0, coachDay: String(p.coachDay ?? ''), coachCount: Number(p.coachCount) || 0 };
  } catch {
    return { pistes: 0, coachDay: '', coachCount: 0 };
  }
}
function writeQuota(q: Quota): void {
  try {
    window.localStorage.setItem(QUOTA_KEY, JSON.stringify(q));
  } catch {
    // quota non enregistré
  }
  emit();
}

export function pistesLeft(): number {
  return Math.max(0, FREE_PISTES - readQuota().pistes);
}

/** Utilise une piste. Premium/essai : toujours oui. Sinon oui tant qu'il reste des pistes gratuites, sinon on ouvre l'abonnement. */
export function consumePiste(): boolean {
  if (isPremiumActive()) return true;
  const q = readQuota();
  if (q.pistes >= FREE_PISTES) {
    openPaywall('pistes');
    return false;
  }
  writeQuota({ ...q, pistes: q.pistes + 1 });
  return true;
}

export function coachMessagesLeft(): number {
  const q = readQuota();
  return Math.max(0, FREE_COACH_MESSAGES_PER_DAY - (q.coachDay === today() ? q.coachCount : 0));
}

/** Compte une question au coach IA (limite par jour hors Premium/essai). */
export function consumeCoachMessage(): boolean {
  if (isPremiumActive()) return true;
  const q = readQuota();
  const count = q.coachDay === today() ? q.coachCount : 0;
  if (count >= FREE_COACH_MESSAGES_PER_DAY) {
    openPaywall('coach');
    return false;
  }
  writeQuota({ ...q, coachDay: today(), coachCount: count + 1 });
  return true;
}

/** Une séance est-elle ouverte à tous ? */
export function canOpenProgram(id: string): boolean {
  return isPremiumActive() || FREE_PROGRAM_IDS.includes(id);
}

// ---------- ouverture de l'écran d'abonnement depuis n'importe où ----------
export interface PaywallRequest {
  feature: PremiumFeature | null;
}
let paywall: PaywallRequest | null = null;
const paywallListeners = new Set<() => void>();

export function openPaywall(feature: PremiumFeature | null = null): void {
  paywall = { feature };
  paywallListeners.forEach((l) => l());
}

export function closePaywall(): void {
  paywall = null;
  paywallListeners.forEach((l) => l());
}

export function usePaywall(): PaywallRequest | null {
  return useSyncExternalStore(
    (l) => {
      paywallListeners.add(l);
      return () => {
        paywallListeners.delete(l);
      };
    },
    () => paywall,
    () => paywall,
  );
}
