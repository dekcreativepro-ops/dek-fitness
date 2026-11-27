// Règles de l'économie DEK (voir docs/ECONOMIE-DEK.md). Fonctions pures : faciles à tester, aucune entrée/sortie.

export const PRICE_BASE_FCFA = 5000;
export const PERIOD_DAYS = 30;
export const XP_PER_HOUR = 500; // « on vend du temps » : 1 heure d'effort = 500 XP

/**
 * Remise d'effort = SOMME des bonus de performance gagnés sur les 30 derniers jours, plafonnée à 50 %.
 * Les XP ne calculent pas le prix : ils sont la jauge qui mesure ces performances.
 * Chaque performance a une limite (par jour, semaine, mois, ou une seule fois) pour qu'on ne la répète pas cent fois.
 */
export const BONUS_MAX_PCT = 50;
export const DISCOUNT_STEP_PCT = 10; // un produit Chariow par palier de 10 %

export const PERFORMANCES = {
  seance: { label: 'Séance guidée terminée', pct: 0.5, per: 'day', max: 1 },
  pompes200: { label: '200 pompes dans la journée', pct: 2, per: 'day', max: 1 },
  pistes3: { label: '3 pistes dans la même soirée', pct: 2, per: 'day', max: 1 },
  duel: { label: 'Victoire au Défi House', pct: 0.5, per: 'day', max: 3 },
  semaine: { label: 'Semaine parfaite (5 séances)', pct: 3, per: 'week', max: 1 },
  serie7: { label: '7 jours d’entraînement d’affilée', pct: 4, per: 'month', max: 1 },
  palier: { label: 'Nouveau palier franchi', pct: 5, per: 'once', max: 1 },
};

/** Paliers de la catégorie du joueur (même liste que l'app). */
export const TIERS = ['Amateur', 'Standard', 'Pro', 'Expert'];

/** Semaine (lundi-dimanche) d'un jour « AAAA-MM-JJ » : identifiée par la date de son lundi. */
export function weekKey(day) {
  const d = new Date(`${day}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // lundi = 0
  d.setUTCDate(d.getUTCDate() - dow);
  return `W${d.toISOString().slice(0, 10)}`;
}

/** Identifiant de la période d'une limite : même clé = même jour / même semaine / même mois / même référence. */
export function periodKey(per, ts, ref = '') {
  const day = dayKey(ts);
  if (per === 'day') return day;
  if (per === 'week') return weekKey(day);
  if (per === 'month') return day.slice(0, 7);
  return `once:${ref}`;
}

/** Total des bonus des 30 derniers jours (en %), plafonné. */
export function totalBonusPct(bonuses, now) {
  const sum = bonuses.filter((b) => b.ts > now - PERIOD_DAYS * 86_400_000).reduce((s, b) => s + b.pct, 0);
  return Math.min(BONUS_MAX_PCT, Math.round(sum * 10) / 10);
}

/** Remise réellement appliquée : arrondie au palier de 10 % inférieur (un produit Chariow par palier). */
export function discountPct(bonusPct) {
  return Math.floor(Math.min(BONUS_MAX_PCT, Math.max(0, bonusPct)) / DISCOUNT_STEP_PCT) * DISCOUNT_STEP_PCT;
}

/** Prix du prochain mois, en FCFA (jamais sous 2 500). */
export function priceFor(bonusPct) {
  return Math.round((PRICE_BASE_FCFA * (100 - discountPct(bonusPct))) / 100);
}

/** Tous les prix possibles (un produit Chariow par prix). */
export const PRICE_LEVELS = Array.from({ length: BONUS_MAX_PCT / DISCOUNT_STEP_PCT + 1 }, (_, i) => priceFor(i * DISCOUNT_STEP_PCT));

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
