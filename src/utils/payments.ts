// Paiement Mobile Money (MTN MoMo / Orange Money) pour l'abonnement Premium.
//
// Deux modes :
//  - Réel : VITE_PAYMENT_API_URL pointe vers notre serveur (server/payments-proxy.mjs). Le serveur parle au
//    fournisseur (Chariow, MeSomb, Flutterwave…), garde les clés secrètes et confirme le paiement.
//  - Démo : sans serveur, le paiement est simulé (aucun argent réel). Utile pour tester l'écran.

import { getToken } from './account';
import { API } from './api';

export type Operator = 'mtn' | 'orange';

export const OPERATORS: { id: Operator; label: string; hint: string }[] = [
  { id: 'mtn', label: 'MTN MoMo', hint: 'Numéros 67, 650–654, 680–683…' },
  { id: 'orange', label: 'Orange Money', hint: 'Numéros 69, 655–659, 640…' },
];

export interface PaymentConfig {
  /** true : le fournisseur a sa propre page de paiement (Chariow) ; false : demande envoyée directement au téléphone */
  hostedCheckout: boolean;
  provider: string;
}

export interface PaymentResult {
  ok: boolean;
  reference: string;
  demo: boolean;
  message?: string;
}


export const PAYMENTS_LIVE = Boolean(API);

/** Numéro camerounais à 9 chiffres commençant par 6 (on accepte +237 / 237 / espaces). */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, '');
  const local = digits.startsWith('237') ? digits.slice(3) : digits;
  return /^6\d{8}$/.test(local) ? local : null;
}

/** Devine le réseau d'après le préfixe (indicatif seulement : un numéro peut avoir changé d'opérateur). */
export function guessOperator(local: string): Operator | null {
  const p2 = local.slice(0, 2);
  const p3 = local.slice(0, 3);
  if (p2 === '67' || (p3 >= '650' && p3 <= '654') || (p3 >= '680' && p3 <= '683')) return 'mtn';
  if (p2 === '69' || (p3 >= '655' && p3 <= '659') || p3 === '640') return 'orange';
  return null;
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Demande au serveur comment il encaisse (page hébergée ou non). Sans serveur : mode démo. */
export async function getPaymentConfig(): Promise<PaymentConfig> {
  if (!API) return { hostedCheckout: false, provider: 'demo' };
  try {
    const res = await fetch(`${API}/config`);
    if (!res.ok) throw new Error('config');
    const c = (await res.json()) as Partial<PaymentConfig>;
    return { hostedCheckout: c.hostedCheckout === true, provider: String(c.provider ?? 'inconnu') };
  } catch {
    return { hostedCheckout: false, provider: 'inconnu' };
  }
}

/** Ouvre la page de paiement : navigateur intégré dans l'application mobile, nouvel onglet sur le web. */
async function openCheckout(url: string): Promise<void> {
  try {
    const { Capacitor } = await import('@capacitor/core');
    if (Capacitor.isNativePlatform()) {
      const { Browser } = await import('@capacitor/browser');
      await Browser.open({ url });
      return;
    }
  } catch {
    // on retombe sur l'ouverture classique
  }
  window.open(url, '_blank', 'noopener');
}

export async function payPremium(opts: {
  operator: Operator;
  phone: string;
  amount: number;
  email?: string;
  firstName?: string;
  lastName?: string;
}): Promise<PaymentResult> {
  const phone = normalizePhone(opts.phone);
  if (!phone) return { ok: false, reference: '', demo: !API, message: 'Numéro invalide : 9 chiffres commençant par 6.' };

  if (!API) {
    // Mode démo : on simule l'attente de la validation sur le téléphone.
    await sleep(2200);
    return { ok: true, reference: `DEMO-${Date.now().toString(36).toUpperCase()}`, demo: true };
  }

  try {
    const res = await fetch(`${API}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(getToken() ? { Authorization: `Bearer ${getToken()}` } : {}) },
      body: JSON.stringify({ operator: opts.operator, phone, email: opts.email, firstName: opts.firstName, lastName: opts.lastName, plan: 'premium-monthly' }),
    });
    const out = (await res.json().catch(() => ({}))) as { reference?: string; checkoutUrl?: string | null; error?: string };
    if (res.status === 401) throw new Error('Connecte-toi (ou crée ton compte) pour payer.');
    if (!res.ok || !out.reference) throw new Error(out.error ?? 'Paiement refusé par le serveur.');
    const { reference } = out as { reference: string };
    if (out.checkoutUrl) await openCheckout(out.checkoutUrl);

    // Le client valide (page de paiement ou code secret sur son téléphone) : on interroge le serveur jusqu'à 10 minutes.
    for (let i = 0; i < 200; i++) {
      await sleep(3000);
      const st = await fetch(`${API}/status/${encodeURIComponent(reference)}`);
      if (!st.ok) continue;
      const { status } = (await st.json()) as { status: 'pending' | 'success' | 'failed' };
      if (status === 'success') return { ok: true, reference, demo: false };
      if (status === 'failed') return { ok: false, reference, demo: false, message: 'Paiement refusé ou annulé.' };
    }
    return { ok: false, reference, demo: false, message: 'Délai dépassé : si tu as payé, rouvre cet écran dans quelques minutes ; sinon réessaie.' };
  } catch (err) {
    return { ok: false, reference: '', demo: false, message: err instanceof Error ? err.message : 'Paiement impossible pour le moment.' };
  }
}
