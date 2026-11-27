// Paiement Mobile Money (MTN MoMo / Orange Money) pour l'abonnement Premium.
//
// Deux modes :
//  - Réel : VITE_PAYMENT_API_URL pointe vers notre serveur (server/payments-proxy.mjs). Le serveur parle au
//    fournisseur (Chariow, MeSomb, Flutterwave…), garde les clés secrètes et confirme le paiement.
//  - Démo : sans serveur, le paiement est simulé (aucun argent réel). Utile pour tester l'écran.

export type Operator = 'mtn' | 'orange';

export const OPERATORS: { id: Operator; label: string; hint: string }[] = [
  { id: 'mtn', label: 'MTN MoMo', hint: 'Numéros 67, 650–654, 680–683…' },
  { id: 'orange', label: 'Orange Money', hint: 'Numéros 69, 655–659, 640…' },
];

export interface PaymentResult {
  ok: boolean;
  reference: string;
  demo: boolean;
  message?: string;
}

const API = (import.meta.env.VITE_PAYMENT_API_URL as string | undefined)?.replace(/\/$/, '');

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

export async function payPremium(opts: { operator: Operator; phone: string; amount: number }): Promise<PaymentResult> {
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
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ operator: opts.operator, phone, amount: opts.amount, currency: 'XAF', plan: 'premium-monthly' }),
    });
    if (!res.ok) throw new Error('Paiement refusé par le serveur.');
    const { reference } = (await res.json()) as { reference: string };

    // Le client valide sur son téléphone (code secret) : on interroge le serveur jusqu'à 2 minutes.
    for (let i = 0; i < 40; i++) {
      await sleep(3000);
      const st = await fetch(`${API}/status/${encodeURIComponent(reference)}`);
      if (!st.ok) continue;
      const { status } = (await st.json()) as { status: 'pending' | 'success' | 'failed' };
      if (status === 'success') return { ok: true, reference, demo: false };
      if (status === 'failed') return { ok: false, reference, demo: false, message: 'Paiement refusé ou annulé.' };
    }
    return { ok: false, reference, demo: false, message: 'Délai dépassé : valide le paiement sur ton téléphone puis réessaie.' };
  } catch (err) {
    return { ok: false, reference: '', demo: false, message: err instanceof Error ? err.message : 'Paiement impossible pour le moment.' };
  }
}
