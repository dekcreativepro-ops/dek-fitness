// Comptes utilisateurs, sessions, registre d'XP et abonnement. Stockage : un fichier JSON (voir ci-dessous).
//
// ⚠ MVP : un fichier JSON suffit pour démarrer (quelques centaines d'utilisateurs, un seul serveur).
//    Avant de grandir : passer à une vraie base (PostgreSQL / SQLite) et sauvegarder régulièrement.

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { DAILY_TOTAL_CAP, PERFORMANCES, PERIOD_DAYS, TIERS, dayKey, discountPct, periodKey, priceFor, totalBonusPct, weekKey, xpForClaim } from './economy.mjs';

const DAY = 86_400_000;

export function createStore(file) {
  /** @type {{accounts: Record<string, any>, sessions: Record<string, string>, payments: Record<string, any>}} */
  let db = { accounts: {}, sessions: {}, payments: {} };
  if (file && fs.existsSync(file)) {
    try {
      db = { ...db, ...JSON.parse(fs.readFileSync(file, 'utf8')) };
    } catch {
      throw new Error(`Base illisible : ${file} (ne rien écraser, la réparer d'abord)`);
    }
  }
  let timer = null;
  const flush = () => {
    if (!file) return;
    fs.mkdirSync(path.dirname(file), { recursive: true });
    const tmp = `${file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(db));
    fs.renameSync(tmp, file); // écriture atomique : jamais de fichier à moitié écrit
  };
  const save = () => {
    if (!file) return;
    clearTimeout(timer);
    timer = setTimeout(flush, 200);
  };
  return { db, save, flush };
}

const sha = (s) => crypto.createHash('sha256').update(s).digest('hex');
const hashPassword = (pw, salt) => crypto.scryptSync(pw, salt, 32).toString('hex');

/** Numéro camerounais à 9 chiffres commençant par 6 (accepte +237 / espaces). */
export function normalizePhone(input) {
  const digits = String(input ?? '').replace(/\D/g, '');
  const local = digits.startsWith('237') ? digits.slice(3) : digits;
  return /^6\d{8}$/.test(local) ? local : null;
}

export function createAccounts(store, { now = () => Date.now() } = {}) {
  const { db, save } = store;
  const failures = new Map(); // phone -> {count, until}

  const byPhone = (phone) => Object.values(db.accounts).find((a) => a.phone === phone);

  /** Accorde un bonus de performance si sa limite (jour / semaine / mois / une fois) n'est pas atteinte. */
  function grant(acc, id, ref = '') {
    const rule = PERFORMANCES[id];
    if (!rule) return null;
    const t = now();
    const period = periodKey(rule.per, t, ref);
    if (acc.bonuses.filter((b) => b.id === id && b.period === period).length >= rule.max) return null;
    acc.bonuses.push({ id, pct: rule.pct, ts: t, period });
    return { id, pct: rule.pct };
  }

  /** Performances déduites des efforts déclarés : le client ne réclame jamais un bonus lui-même. */
  function derive(acc, kind) {
    const t = now();
    const today = dayKey(t);
    const got = [];
    const add = (r) => r && got.push(r);
    const todays = (k) => acc.ledger.filter((e) => e.type === 'earn' && e.kind === k && dayKey(e.ts) === today);
    if (kind === 'workout') {
      add(grant(acc, 'seance'));
      const wk = weekKey(today);
      const days = new Set(acc.ledger.filter((e) => e.type === 'earn' && e.kind === 'workout' && weekKey(dayKey(e.ts)) === wk).map((e) => dayKey(e.ts)));
      if (days.size >= 5) add(grant(acc, 'semaine'));
    }
    if (kind === 'pushups' && todays('pushups').reduce((s, e) => s + e.units, 0) >= 200) add(grant(acc, 'pompes200'));
    if (kind === 'outdoor' && todays('outdoor').length >= 3) add(grant(acc, 'pistes3'));
    if (kind === 'duel') add(grant(acc, 'duel'));
    // 7 jours d'affilée avec au moins un effort compté
    const active = new Set(acc.ledger.filter((e) => e.type === 'earn').map((e) => dayKey(e.ts)));
    let streak = true;
    for (let i = 0; i < 7; i++) if (!active.has(dayKey(t - i * DAY))) streak = false;
    if (streak) add(grant(acc, 'serie7'));
    return got;
  }

  function earned30(acc, ts = now()) {
    return acc.ledger.filter((e) => e.type === 'earn' && e.ts > ts - PERIOD_DAYS * DAY).reduce((s, e) => s + e.xp, 0);
  }
  function earnedToday(acc, kind, ts = now()) {
    const d = dayKey(ts);
    let k = 0;
    let total = 0;
    for (const e of acc.ledger) {
      if (e.type !== 'earn' || dayKey(e.ts) !== d) continue;
      total += e.xp;
      if (e.kind === kind) k += e.xp;
    }
    return { kind: k, total };
  }

  function view(acc) {
    const t = now();
    const last30 = earned30(acc, t);
    const bonusPct = totalBonusPct(acc.bonuses, t);
    const recent = acc.bonuses.filter((b) => b.ts > t - PERIOD_DAYS * DAY);
    const bonuses = Object.entries(PERFORMANCES)
      .map(([id, r]) => {
        const mine = recent.filter((b) => b.id === id);
        return { id, label: r.label, count: mine.length, pct: Math.round(mine.reduce((s, b) => s + b.pct, 0) * 10) / 10 };
      })
      .filter((b) => b.count > 0);
    return {
      id: acc.id,
      name: acc.name,
      phone: acc.phone,
      role: acc.role,
      createdAt: acc.createdAt,
      paidUntil: acc.paidUntil,
      subscribed: acc.paidUntil !== null && acc.paidUntil > t,
      xp: {
        last30,
        total: acc.ledger.filter((e) => e.type === 'earn').reduce((s, e) => s + e.xp, 0),
        purchased: acc.ledger.filter((e) => e.type === 'purchase').reduce((s, e) => s + e.xp, 0), // phase 2 : tournois
        today: earnedToday(acc, '', t).total,
        dailyCap: DAILY_TOTAL_CAP,
      },
      bonusPct, // somme des bonus de performance des 30 derniers jours
      discountPct: discountPct(bonusPct), // remise appliquée (palier de 10 %)
      nextPrice: priceFor(bonusPct),
      bonuses,
    };
  }

  function newSession(acc) {
    const token = crypto.randomBytes(32).toString('hex');
    db.sessions[sha(token)] = acc.id;
    save();
    return token;
  }

  return {
    view,
    earned30,

    register({ phone, name, password }) {
      const p = normalizePhone(phone);
      if (!p) return { error: 'Numéro invalide : 9 chiffres commençant par 6.' };
      if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 40) return { error: 'Nom : 2 à 40 caractères.' };
      if (typeof password !== 'string' || password.length < 6 || password.length > 100) return { error: 'Mot de passe : 6 caractères minimum.' };
      if (byPhone(p)) return { error: 'Ce numéro a déjà un compte : connecte-toi.' };
      const salt = crypto.randomBytes(16).toString('hex');
      const acc = {
        id: `acc_${crypto.randomBytes(6).toString('hex')}`,
        phone: p,
        name: name.trim(),
        role: 'member',
        salt,
        hash: hashPassword(password, salt),
        createdAt: now(),
        paidUntil: null,
        ledger: [],
        bonuses: [],
        claims: [],
      };
      db.accounts[acc.id] = acc;
      return { token: newSession(acc), account: view(acc) };
    },

    login({ phone, password }) {
      const p = normalizePhone(phone);
      if (!p) return { error: 'Numéro invalide.' };
      const f = failures.get(p);
      if (f && f.until > now()) return { error: 'Trop d’essais : réessaie dans quelques minutes.' };
      const acc = byPhone(p);
      const ok = acc && typeof password === 'string' && crypto.timingSafeEqual(Buffer.from(hashPassword(password, acc.salt), 'hex'), Buffer.from(acc.hash, 'hex'));
      if (!ok) {
        const count = (f?.count ?? 0) + 1;
        failures.set(p, { count, until: count >= 5 ? now() + 10 * 60_000 : 0 });
        return { error: 'Numéro ou mot de passe incorrect.' };
      }
      failures.delete(p);
      return { token: newSession(acc), account: view(acc) };
    },

    /** Retrouve le compte d'un jeton « Bearer ». */
    authenticate(header) {
      const m = /^Bearer ([0-9a-f]{64})$/.exec(String(header ?? ''));
      if (!m) return null;
      const id = db.sessions[sha(m[1])];
      return id ? db.accounts[id] ?? null : null;
    },

    logout(header) {
      const m = /^Bearer ([0-9a-f]{64})$/.exec(String(header ?? ''));
      if (m) {
        delete db.sessions[sha(m[1])];
        save();
      }
    },

    /** Déclare un effort : le SERVEUR calcule les XP (quotas inclus). `claimId` évite de compter deux fois la même déclaration. */
    earn(acc, { kind, units, claimId }) {
      if (claimId !== undefined && (typeof claimId !== 'string' || claimId.length > 64)) return { error: 'claimId invalide' };
      if (claimId && acc.claims.includes(claimId)) return { xp: 0, reason: 'duplicate', account: view(acc) };
      const t = now();
      const res = xpForClaim(kind, Number(units), earnedToday(acc, kind, t));
      if (res.reason === 'unknown_kind' || res.reason === 'invalid_units') return { error: res.reason };
      let granted = [];
      if (res.xp > 0) {
        acc.ledger.push({ type: 'earn', kind, xp: res.xp, units: Number(units), ts: t });
        granted = derive(acc, kind);
      }
      if (claimId) acc.claims = [...acc.claims.slice(-499), claimId];
      save();
      return { xp: res.xp, reason: res.reason, bonuses: granted, account: view(acc) };
    },

    /** Passage de palier (Amateur, Standard…) : bonus unique par palier. */
    palier(acc, { tier }) {
      if (!TIERS.includes(tier) || tier === TIERS[0]) return { error: 'Palier invalide' };
      const g = grant(acc, 'palier', tier);
      save();
      return { bonuses: g ? [g] : [], account: view(acc) };
    },

    /** Prolonge l'abonnement de 30 jours (une seule fois par référence de paiement). */
    activate(accountId, reference) {
      const acc = db.accounts[accountId];
      if (!acc) return false;
      const pay = db.payments[reference];
      if (pay?.applied) return true;
      const base = acc.paidUntil !== null && acc.paidUntil > now() ? acc.paidUntil : now();
      acc.paidUntil = base + PERIOD_DAYS * DAY;
      if (pay) pay.applied = true;
      save();
      return true;
    },
  };
}
