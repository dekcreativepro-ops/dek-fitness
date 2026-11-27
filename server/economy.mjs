// Règles de l'économie DEK (voir docs/ECONOMIE-DEK.md). Fonctions pures : faciles à tester, aucune entrée/sortie.

export const PRICE_BASE_FCFA = 5000;
export const PERIOD_DAYS = 30;
export const XP_PER_HOUR = 500; // « on vend du temps » : 1 heure d'effort = 500 XP

/** Remise de fidélité : 10 % par tranche de 1 000 XP GAGNÉS dans les 30 derniers jours, plafonnée à 50 %. */
export const DISCOUNT_STEP_XP = 1000;
export const DISCOUNT_STEP_PCT = 10;
export const DISCOUNT_MAX_PCT = 50;

export function discountPct(earnedXp30) {
  const steps = Math.floor(Math.max(0, earnedXp30) / DISCOUNT_STEP_XP);
  return Math.min(DISCOUNT_MAX_PCT, steps * DISCOUNT_STEP_PCT);
}

/** Prix du prochain mois, en FCFA (jamais sous 2 500). */
export function priceFor(earnedXp30) {
  return Math.round((PRICE_BASE_FCFA * (100 - discountPct(earnedXp30))) / 100);
}

/** Tous les prix possibles (un produit Chariow par prix). */
export const PRICE_LEVELS = Array.from({ length: DISCOUNT_MAX_PCT / DISCOUNT_STEP_PCT + 1 }, (_, i) => priceFor(i * DISCOUNT_STEP_XP));

/**
 * Barème des XP gagnés par l'effort, avec un quota journalier par type d'activité (anti-farming)
 * et un quota total par jour (santé : pas plus de ~2 h 30 d'effort compté par jour).
 */
export const XP_RULES = {
  workout: { unit: 'minutes', perUnit: XP_PER_HOUR / 60, dailyCap: 600, maxPerClaim: 120 },
  outdoor: { unit: 'km', perUnit: 150, dailyCap: 750, maxPerClaim: 20 },
  pushups: { unit: 'répétitions', perUnit: 1.5, dailyCap: 450, maxPerClaim: 300 },
  duel: { unit: 'victoires', perUnit: 60, dailyCap: 360, maxPerClaim: 6 },
};
export const DAILY_TOTAL_CAP = 1250;

/**
 * XP accordés pour une activité déclarée, après quotas.
 * @param {string} kind    type d'activité (clé de XP_RULES)
 * @param {number} units   quantité déclarée (minutes, km, répétitions…)
 * @param {{ kind: number, total: number }} today  XP déjà gagnés aujourd'hui (pour ce type, et au total)
 */
export function xpForClaim(kind, units, today) {
  const rule = XP_RULES[kind];
  if (!rule) return { xp: 0, reason: 'unknown_kind' };
  if (!Number.isFinite(units) || units <= 0) return { xp: 0, reason: 'invalid_units' };
  const raw = Math.round(Math.min(units, rule.maxPerClaim) * rule.perUnit);
  const room = Math.max(0, Math.min(rule.dailyCap - today.kind, DAILY_TOTAL_CAP - today.total));
  const xp = Math.min(raw, room);
  return { xp, reason: xp === 0 ? 'daily_cap' : xp < raw ? 'capped' : 'ok' };
}

/** Jour (fuseau Cameroun, UTC+1) d'un horodatage, pour les quotas journaliers. */
export function dayKey(ts) {
  return new Date(ts + 3_600_000).toISOString().slice(0, 10);
}
