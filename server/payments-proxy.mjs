// Serveur de paiement DEK — abonnement Premium (Mobile Money).
//
//   PAYMENT_PROVIDER=demo    node server/payments-proxy.mjs   -> paiements simulés (test de l'app)
//   PAYMENT_PROVIDER=chariow node server/payments-proxy.mjs   -> vrai paiement via Chariow (voir docs/ABONNEMENT.md)
//
// L'app appelle :
//   GET  /config           -> { provider, hostedCheckout, price }
//   POST /pay              -> { reference, checkoutUrl? }   (checkoutUrl = page de paiement à ouvrir, si le fournisseur en a une)
//   GET  /status/:ref      -> { status: 'pending' | 'success' | 'failed' }
// Le fournisseur appelle :
//   POST /webhook/chariow  -> confirmation de vente (signature HMAC vérifiée)
//   POST /webhook          -> confirmation générique (en-tête x-webhook-secret), pour les tests
//
// ⚠ Les clés secrètes restent ICI, jamais dans l'app. Les paiements sont gardés en mémoire : en production, utilise une
//    base de données et associe chaque paiement à un compte utilisateur (sinon un redémarrage efface tout).
//
// Variables d'environnement Chariow :
//   CHARIOW_API_KEY        clé « sk_… » (Paramètres → Clés API), avec les droits checkout.write et sales.read
//   CHARIOW_PRODUCT_ID     identifiant « prd_… » du produit « DEK Premium » créé dans le tableau de bord Chariow
//   CHARIOW_PULSE_SECRET   secret « whsec_… » du Pulse (Automatisation → Pulses)
//   CHARIOW_API_BASE       (facultatif) par défaut https://api.chariow.com/v1
//   PUBLIC_APP_URL         (facultatif) adresse où renvoyer le client après paiement

import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT ?? 8788);
const PROVIDER = process.env.PAYMENT_PROVIDER ?? 'demo';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? '*';
const PRICE = Number(process.env.PREMIUM_PRICE_FCFA ?? 2500);

const CHARIOW_BASE = (process.env.CHARIOW_API_BASE ?? 'https://api.chariow.com/v1').replace(/\/$/, '');
const CHARIOW_KEY = process.env.CHARIOW_API_KEY ?? '';
const CHARIOW_PRODUCT = process.env.CHARIOW_PRODUCT_ID ?? '';
const CHARIOW_SECRET = process.env.CHARIOW_PULSE_SECRET ?? '';
const PUBLIC_APP_URL = process.env.PUBLIC_APP_URL ?? '';

/** @type {Map<string, {status: 'pending'|'success'|'failed', operator?: string, phone: string, amount: number, createdAt: number, saleId?: string}>} */
const payments = new Map();
/** Livraisons de webhook déjà traitées (x-pulse-delivery-id) : évite de traiter deux fois la même. */
const seenDeliveries = new Set();

// ---------- fournisseurs ----------
const providers = {
  // Simulation : le paiement réussit 4 s après la demande.
  demo: {
    hostedCheckout: false,
    async charge(ref) {
      setTimeout(() => {
        const p = payments.get(ref);
        if (p) p.status = 'success';
      }, 4000);
      return {};
    },
  },

  // Chariow : page de paiement hébergée. On crée une vente (POST /checkout) puis on envoie le client sur checkout_url.
  chariow: {
    hostedCheckout: true,
    async charge(ref, { phone, email, firstName, lastName }) {
      if (!CHARIOW_KEY || !CHARIOW_PRODUCT) throw new Error('Chariow non configuré (CHARIOW_API_KEY, CHARIOW_PRODUCT_ID).');
      const res = await fetch(`${CHARIOW_BASE}/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${CHARIOW_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          product_id: CHARIOW_PRODUCT,
          email,
          first_name: firstName,
          last_name: lastName,
          phone: { number: phone, country_code: 'CM' },
          // Notre référence revient dans le webhook : c'est elle qui relie la vente au paiement attendu.
          custom_metadata: { dek_reference: ref },
          ...(PUBLIC_APP_URL ? { redirect_url: PUBLIC_APP_URL } : {}),
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(`Chariow a refusé la demande (${res.status}) : ${json?.message ?? 'erreur inconnue'}`);
      const data = json.data ?? {};
      const saleId = data.purchase?.id;
      if (saleId) payments.get(ref).saleId = saleId;
      if (data.step === 'completed') payments.get(ref).status = 'success';
      if (data.step === 'already_purchased') throw new Error('Ce compte possède déjà ce produit : utilise un produit de type « licence » (achat répétable).');
      return { checkoutUrl: data.payment?.checkout_url ?? null };
    },
    /** Vérifie l'état d'une vente auprès de Chariow (au cas où le webhook n'est pas arrivé). */
    async reconcile(payment) {
      if (!payment.saleId || !CHARIOW_KEY) return;
      const res = await fetch(`${CHARIOW_BASE}/sales/${encodeURIComponent(payment.saleId)}`, { headers: { Authorization: `Bearer ${CHARIOW_KEY}` } });
      if (!res.ok) return;
      const sale = (await res.json().catch(() => ({}))).data;
      if (sale?.status === 'completed' || sale?.status === 'settled') payment.status = 'success';
    },
  },
};

// ---------- utilitaires HTTP ----------
function send(res, code, body) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on('data', (c) => {
      size += c.length;
      if (size > 100_000) reject(new Error('Requête trop grande'));
      chunks.push(c);
    });
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

const parseJson = (buf) => {
  try {
    return buf.length ? JSON.parse(buf.toString('utf8')) : {};
  } catch {
    throw new Error('JSON invalide');
  }
};

/** Signature Chariow : « sha256= » + HMAC-SHA256 du corps brut avec le secret du Pulse, comparée à temps constant. */
export function chariowSignatureOk(rawBody, header, secret) {
  if (!secret || typeof header !== 'string') return false;
  const expected = `sha256=${crypto.createHmac('sha256', secret).update(rawBody).digest('hex')}`;
  const a = Buffer.from(header);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

const cleanName = (s, fallback) => (typeof s === 'string' && s.trim() ? s.trim().slice(0, 50) : fallback);
const validEmail = (s) => typeof s === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);

export const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = new URL(req.url ?? '/', 'http://localhost');
  const provider = providers[PROVIDER] ?? providers.demo;

  try {
    if (req.method === 'GET' && url.pathname === '/config') {
      return send(res, 200, { provider: PROVIDER, hostedCheckout: provider.hostedCheckout, price: PRICE });
    }

    if (req.method === 'POST' && url.pathname === '/pay') {
      const b = parseJson(await readBody(req));
      const phone = String(b.phone ?? '');
      if (!/^6\d{8}$/.test(phone)) return send(res, 400, { error: 'Numéro invalide' });
      if (provider.hostedCheckout && !validEmail(b.email)) return send(res, 400, { error: 'Adresse e-mail invalide' });
      // Le prix est décidé par le serveur (ici : celui du produit Chariow), jamais par l'app.
      const reference = `DEK-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      payments.set(reference, { status: 'pending', operator: b.operator, phone, amount: PRICE, createdAt: Date.now() });
      try {
        const out = await provider.charge(reference, {
          phone,
          operator: b.operator,
          email: b.email,
          firstName: cleanName(b.firstName, 'Membre'),
          lastName: cleanName(b.lastName, 'DEK'),
        });
        return send(res, 200, { reference, checkoutUrl: out.checkoutUrl ?? null });
      } catch (err) {
        payments.delete(reference);
        return send(res, 502, { error: err instanceof Error ? err.message : 'Fournisseur indisponible' });
      }
    }

    if (req.method === 'GET' && url.pathname.startsWith('/status/')) {
      const p = payments.get(decodeURIComponent(url.pathname.slice('/status/'.length)));
      if (!p) return send(res, 404, { error: 'Inconnu' });
      if (p.status === 'pending' && provider.reconcile) await provider.reconcile(p).catch(() => undefined);
      return send(res, 200, { status: p.status });
    }

    if (req.method === 'POST' && url.pathname === '/webhook/chariow') {
      const raw = await readBody(req);
      if (!chariowSignatureOk(raw, req.headers['x-chariow-signature'], CHARIOW_SECRET)) return send(res, 401, { error: 'Signature invalide' });
      const delivery = String(req.headers['x-pulse-delivery-id'] ?? '');
      if (delivery && seenDeliveries.has(delivery)) return send(res, 200, { ok: true, duplicate: true });
      const evt = parseJson(raw);
      const ref = evt?.sale?.custom_metadata?.dek_reference ?? evt?.checkout?.custom_metadata?.dek_reference;
      const p = payments.get(String(ref ?? ''));
      if (p) {
        // Un paiement réussi n'est jamais repassé en échec ; un échec peut encore être rattrapé par une confirmation tardive.
        if (evt.event === 'successful.sale') p.status = 'success';
        else if ((evt.event === 'failed.sale' || evt.event === 'abandoned.sale') && p.status !== 'success') p.status = 'failed';
        if (evt?.sale?.id) p.saleId = evt.sale.id;
      }
      if (delivery) seenDeliveries.add(delivery);
      return send(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/webhook') {
      const given = req.headers['x-webhook-secret'];
      if (!WEBHOOK_SECRET || given !== WEBHOOK_SECRET) return send(res, 401, { error: 'Non autorisé' });
      const b = parseJson(await readBody(req));
      const p = payments.get(String(b.reference ?? ''));
      if (!p) return send(res, 404, { error: 'Inconnu' });
      p.status = b.status === 'success' ? 'success' : 'failed';
      return send(res, 200, { ok: true });
    }

    return send(res, 404, { error: 'Introuvable' });
  } catch (err) {
    return send(res, 500, { error: err instanceof Error ? err.message : 'Erreur serveur' });
  }
});

// Ne démarre que lancé directement (pas quand un test l'importe).
if (import.meta.url === `file:///${process.argv[1]?.replace(/\\/g, '/')}` || process.argv[1]?.endsWith('payments-proxy.mjs')) {
  server.listen(PORT, () => console.log(`Paiements DEK (${PROVIDER}) sur http://localhost:${PORT}`));
}
