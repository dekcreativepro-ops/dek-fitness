// Compte DEK : connexion, XP déclarés au serveur et abonnement lu depuis le serveur (la vérité n'est pas dans le téléphone).
import { useSyncExternalStore } from 'react';
import { API } from './api';
import { setServerPaidUntil } from './premium';

export interface DekAccount {
  id: string;
  name: string;
  phone: string;
  role: 'member' | 'coach';
  paidUntil: number | null;
  subscribed: boolean;
  xp: { last30: number; total: number; purchased: number; today: number; dailyCap: number };
  /** somme des bonus de performance des 30 derniers jours (%) */
  bonusPct: number;
  /** remise appliquée au prochain mois (palier de 10 %) */
  discountPct: number;
  nextPrice: number;
  bonuses: { id: string; label: string; count: number; pct: number }[];
}

interface Session {
  token: string;
  account: DekAccount;
}

const KEY = 'dek_account_v1';
let cache: Session | null | undefined;
const listeners = new Set<() => void>();

function read(): Session | null {
  try {
    const raw = window.localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as Session) : null;
  } catch {
    return null;
  }
}
function commit(s: Session | null): void {
  cache = s;
  try {
    if (s) window.localStorage.setItem(KEY, JSON.stringify(s));
    else window.localStorage.removeItem(KEY);
  } catch {
    // stockage plein
  }
  if (s) setServerPaidUntil(s.account.paidUntil);
  listeners.forEach((l) => l());
}

export function getSession(): Session | null {
  if (cache === undefined) cache = read();
  return cache;
}
export const getToken = (): string | null => getSession()?.token ?? null;

export function useAccount(): DekAccount | null {
  const s = useSyncExternalStore(
    (l) => {
      listeners.add(l);
      return () => {
        listeners.delete(l);
      };
    },
    getSession,
    getSession,
  );
  return s?.account ?? null;
}

type AuthResult = { ok: true } | { ok: false; error: string };

async function post(path: string, body: unknown, token?: string | null): Promise<{ status: number; json: Record<string, unknown> }> {
  const res = await fetch(`${API}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: JSON.stringify(body),
  });
  return { status: res.status, json: (await res.json().catch(() => ({}))) as Record<string, unknown> };
}

async function authenticate(path: string, body: unknown): Promise<AuthResult> {
  if (!API) return { ok: false, error: 'Serveur non configuré.' };
  try {
    const { status, json } = await post(path, body);
    if (status !== 200) return { ok: false, error: String(json.error ?? 'Connexion impossible.') };
    commit({ token: String(json.token), account: json.account as DekAccount });
    return { ok: true };
  } catch {
    return { ok: false, error: 'Serveur injoignable : vérifie ta connexion.' };
  }
}

export const registerAccount = (phone: string, name: string, password: string) => authenticate('/auth/register', { phone, name, password });
export const loginAccount = (phone: string, password: string) => authenticate('/auth/login', { phone, password });

export async function logoutAccount(): Promise<void> {
  const t = getToken();
  commit(null);
  if (API && t) await post('/auth/logout', {}, t).catch(() => undefined);
}

/** Relit le compte sur le serveur (abonnement, XP du mois, remise). Appelé au démarrage et après un paiement. */
export async function refreshAccount(): Promise<void> {
  const s = getSession();
  if (!API || !s) return;
  try {
    const res = await fetch(`${API}/me`, { headers: { Authorization: `Bearer ${s.token}` } });
    if (res.status === 401) return commit(null); // session expirée
    if (!res.ok) return;
    const { account } = (await res.json()) as { account: DekAccount };
    commit({ token: s.token, account });
  } catch {
    // hors ligne : on garde le dernier état connu
  }
}

/** Passage de palier : bonus unique par palier. */
export async function claimPalier(tier: string): Promise<void> {
  const s = getSession();
  if (!API || !s) return;
  try {
    const { status, json } = await post('/perf/palier', { tier }, s.token);
    if (status === 200 && json.account) commit({ token: s.token, account: json.account as DekAccount });
  } catch {
    // hors ligne : bonus non compté
  }
}

/** Déclare un effort au serveur, qui calcule lui-même les XP et les bonus de performance (quotas inclus). Sans compte : rien. */
export async function claimXp(kind: 'workout' | 'outdoor' | 'pushups' | 'duel', units: number, claimId: string): Promise<void> {
  const s = getSession();
  if (!API || !s || !(units > 0)) return;
  try {
    const { status, json } = await post('/xp/earn', { kind, units, claimId }, s.token);
    if (status === 200 && json.account) commit({ token: s.token, account: json.account as DekAccount });
  } catch {
    // hors ligne : cet effort ne sera pas compté pour la remise
  }
}
