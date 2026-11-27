// Abonnement DEK Premium : état (gratuit / premium), fonctions verrouillées et petit « store » React.
// L'état est gardé sur l'appareil. En production, l'activation doit venir du serveur de paiement
// (voir server/payments-proxy.mjs et docs/ABONNEMENT.md), jamais d'un simple clic dans l'app.

import { useSyncExternalStore } from 'react';

export const PREMIUM_PRICE_FCFA = 2500;
export const PREMIUM_PERIOD_DAYS = 30;

export type PremiumFeature = 'tournois' | 'pistes' | 'modes' | 'defi_tournoi';

/** Ce que le Premium débloque (texte affiché sur l'écran d'abonnement). */
export const PREMIUM_BENEFITS: { id: PremiumFeature; title: string; desc: string }[] = [
  { id: 'tournois', title: 'Tournois de Terrains & Santé', desc: 'Poules, tableau final et classements dans chaque discipline.' },
  { id: 'defi_tournoi', title: 'Tournoi Défi House', desc: 'Affronte le champion de chaque zone et monte de niveau.' },
  { id: 'pistes', title: 'Nouvelles pistes Outdoor', desc: 'Génère d’autres tracés sur les vraies rues et cherche ta destination.' },
  { id: 'modes', title: 'Modes Outdoor spéciaux', desc: 'Survie Checkpoint, Relais Escouade, Conquête Territoire et Duel Fantôme.' },
];

export const FEATURE_LABEL: Record<PremiumFeature, string> = {
  tournois: 'Les tournois',
  defi_tournoi: 'Le tournoi Défi House',
  pistes: 'Les nouvelles pistes',
  modes: 'Les modes Outdoor spéciaux',
};

export interface PremiumState {
  expiresAt: number | null;
  operator: 'mtn' | 'orange' | null;
  reference: string | null;
  /** true si le paiement venait du mode démo (aucun argent réel) */
  demo: boolean;
}

const KEY = 'dek_premium_v1';
const FREE: PremiumState = { expiresAt: null, operator: null, reference: null, demo: false };

let cache: PremiumState | undefined;
const listeners = new Set<() => void>();

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
    };
  } catch {
    return FREE;
  }
}

export function getPremium(): PremiumState {
  if (cache === undefined) cache = read();
  return cache;
}

export function isPremiumActive(state: PremiumState = getPremium()): boolean {
  return state.expiresAt !== null && state.expiresAt > Date.now();
}

export function daysLeft(state: PremiumState = getPremium()): number {
  if (!isPremiumActive(state) || state.expiresAt === null) return 0;
  return Math.max(1, Math.ceil((state.expiresAt - Date.now()) / 86_400_000));
}

function commit(next: PremiumState): void {
  cache = next;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // stockage plein : l'abonnement reste actif jusqu'au rechargement
  }
  listeners.forEach((l) => l());
}

/** Active (ou prolonge) l'abonnement d'une période de 30 jours. */
export function activatePremium(info: { operator: 'mtn' | 'orange'; reference: string; demo: boolean }): void {
  const current = getPremium();
  const base = isPremiumActive(current) && current.expiresAt !== null ? current.expiresAt : Date.now();
  commit({
    expiresAt: base + PREMIUM_PERIOD_DAYS * 86_400_000,
    operator: info.operator,
    reference: info.reference,
    demo: info.demo,
  });
}

export function cancelPremium(): void {
  commit(FREE);
}

export function subscribePremium(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function usePremium(): { active: boolean; days: number; state: PremiumState } {
  const state = useSyncExternalStore(subscribePremium, getPremium, getPremium);
  return { active: isPremiumActive(state), days: daysLeft(state), state };
}

// ---- ouverture de l'écran d'abonnement depuis n'importe où
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
