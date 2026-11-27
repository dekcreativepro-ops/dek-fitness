// Serveur DEK : comptes, XP, abonnement et paiements Mobile Money.
//
//   node server/payments-proxy.mjs                                  -> paiements simulés (PAYMENT_PROVIDER=demo, par défaut)
//   PAYMENT_PROVIDER=chariow ... node server/payments-proxy.mjs     -> vrai paiement via Chariow (voir docs/ABONNEMENT.md)
//
// Comptes et XP (le téléphone ne décide JAMAIS de son solde ni de son abonnement) :
//   POST /auth/register {phone, name, password}  -> { token, account }
//   POST /auth/login    {phone, password}        -> { token, account }
//   POST /auth/logout
//   GET  /me                                     -> { account }  (abonnement, XP du mois, remise, prix du prochain mois)
//   POST /xp/earn {kind, units, claimId}         -> { xp, reason, account }  (XP calculés ici, quotas journaliers)
// Paiement (jeton obligatoire) :
//   GET  /config           -> { provider, hostedCheckout, priceBase, priceLevels }
//   POST /pay              -> { reference, price, checkoutUrl? }   (prix = prix remisé du compte, décidé ici)
//   GET  /status/:ref      -> { status: 'pending' | 'success' | 'failed' }
// Le fournisseur appelle :
//   POST /webhook/chariow  -> confirmation de vente (signature HMAC vérifiée)
//   POST /webhook          -> confirmation générique (en-tête x-webhook-secret), pour les tests
//
// ⚠ Les clés secrètes restent ICI, jamais dans l'app. Les données sont dans un fichier JSON (DEK_DB, par défaut
//    server/data/db.json) : sauvegarde-le, et passe à une vraie base avant de grandir.
//
// Variables Chariow : CHARIOW_API_KEY (sk_…), CHARIOW_PULSE_SECRET (whsec_…), PUBLIC_APP_URL (facultatif),
//   CHARIOW_PRODUCT_ID (un seul produit) ou CHARIOW_PRODUCT_IDS = {"5000":"prd_…","4500":"prd_…",…} (un produit par prix).

import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { PRICE_BASE_FCFA, PRICE_LEVELS } from './economy.mjs';
import { createAccounts, createStore, normalizePhone } from './accounts.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT ?? 8788);
const PROVIDER = process.env.PAYMENT_PROVIDER ?? 'demo';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? '*';

const CHARIOW_BASE = (process.env.CHARIOW_API_BASE ?? 'https://api.chariow.com/v1').replace(/\/$/, '');
const CHARIOW_KEY = process.env.CHARIOW_API_KEY ?? '';
const CHARIOW_SECRET = process.env.CHARIOW_PULSE_SECRET ?? '';
const PUBLIC_APP_URL = process.env.PUBLIC_APP_URL ?? '';
const PRODUCT_IDS = (() => {
  try {
    return JSON.parse(process.env.CHARIOW_PRODUCT_IDS ?? '{}');
  } catch {
    return {};
  }
})();
const productFor = (price) => PRODUCT_IDS[String(price)] ?? process.env.CHARIOW_PRODUCT_ID ?? '';

const store = createStore(process.env.DEK_DB ?? path.join(here, 'data', 'db.json'));
const accounts = createAccounts(store);
const { payments } = store.db;
/** Livraisons de webhook déjà traitées (x-pulse-delivery-id) : évite de traiter deux fois la même. */
const seenDeliveries = new Set();

/** Un paiement réussi n'est jamais défait ; l'abonnement du compte est prolongé une seule fois. */
function markSuccess(ref, p) {
  p.status = 'success';
  if (p.accountId) accounts.activate(p.accountId, ref);
  store.save();
}

// ---------- fournisseurs ----------
const providers = {
  // Simulation : le paiement réussit 4 s après la demande.
  demo: {
    hostedCheckout: false,
    async charge(ref) {
      setTimeout(() => {
        const p = payments[ref];
        if (p) markSuccess(ref, p);
      }, 4000);
      return {};
    },
  },

  // Chariow : page de paiement hébergée. On crée une vente (POST /checkout) puis on envoie le client sur checkout_url.
  chariow: {
    hostedCheckout: true,
    async charge(ref, { phone, email, firstName, lastName, price }) {
      const productId = productFor(price);
      if (!CHARIOW_KEY || !productId) throw new Error(`Chariow non configuré pour ${price} FCFA (CHARIOW_API_KEY, CHARIOW_PRODUCT_IDS).`);
      const res = await fetch(`${CHARIOW_BASE}/checkout`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${CHARIOW_KEY}`, 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          product_id: productId,
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
      if (data.purchase?.id) payments[ref].saleId = data.purchase.id;
      if (data.step === 'completed') markSuccess(ref, payments[ref]);
      if (data.step === 'already_purchased') throw new Error('Ce compte possède déjà ce produit : utilise un produit de type « licence » (achat répétable).');
      return { checkoutUrl: data.payment?.checkout_url ?? null };
    },
    /** Vérifie l'état d'une vente auprès de Chariow (au cas où le webhook n'est pas arrivé). */
    async reconcile(ref, payment) {
      if (!payment.saleId || !CHARIOW_KEY) return;
      const res = await fetch(`${CHARIOW_BASE}/sales/${encodeURIComponent(payment.saleId)}`, { headers: { Authorization: `Bearer ${CHARIOW_KEY}` } });
      if (!res.ok) return;
      const sale = (await res.json().catch(() => ({}))).data;
      if (sale?.status === 'completed' || sale?.status === 'settled') markSuccess(ref, payment);
    },
  },
};

// ---------- utilitaires HTTP ----------
function send(res, code, body) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
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
    // ----- comptes -----
    if (req.method === 'POST' && url.pathname === '/auth/register') {
      const out = accounts.register(parseJson(await readBody(req)));
      return send(res, out.error ? 400 : 200, out);
    }
    if (req.method === 'POST' && url.pathname === '/auth/login') {
      const out = accounts.login(parseJson(await readBody(req)));
      return send(res, out.error ? 401 : 200, out);
    }
    if (req.method === 'POST' && url.pathname === '/auth/logout') {
      accounts.logout(req.headers.authorization);
      return send(res, 200, { ok: true });
    }

    if (req.method === 'GET' && url.pathname === '/config') {
      return send(res, 200, { provider: PROVIDER, hostedCheckout: provider.hostedCheckout, priceBase: PRICE_BASE_FCFA, priceLevels: PRICE_LEVELS });
    }

    // Tout ce qui suit demande d'être connecté.
    const acc = accounts.authenticate(req.headers.authorization);

    if (req.method === 'GET' && url.pathname === '/me') {
      if (!acc) return send(res, 401, { error: 'Connecte-toi.' });
      return send(res, 200, { account: accounts.view(acc) });
    }

    if (req.method === 'POST' && url.pathname === '/xp/earn') {
      if (!acc) return send(res, 401, { error: 'Connecte-toi.' });
      const out = accounts.earn(acc, parseJson(await readBody(req)));
      return send(res, out.error ? 400 : 200, out);
    }

    if (req.method === 'POST' && url.pathname === '/pay') {
      if (!acc) return send(res, 401, { error: 'Connecte-toi pour payer.' });
      const b = parseJson(await readBody(req));
      const phone = normalizePhone(b.phone);
      if (!phone) return send(res, 400, { error: 'Numéro invalide' });
      if (provider.hostedCheckout && !validEmail(b.email)) return send(res, 400, { error: 'Adresse e-mail invalide' });
      // Le prix est décidé ici (prix de base moins la remise gagnée par l'effort), jamais par l'app.
      const price = accounts.view(acc).nextPrice;
      const reference = `DEK-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      payments[reference] = { status: 'pending', accountId: acc.id, phone, amount: price, createdAt: Date.now() };
      try {
        const out = await provider.charge(reference, { phone, email: b.email, firstName: cleanName(b.firstName, acc.name.split(' ')[0]), lastName: cleanName(b.lastName, 'DEK'), price });
        store.save();
        return send(res, 200, { reference, price, checkoutUrl: out.checkoutUrl ?? null });
      } catch (err) {
        delete payments[reference];
        return send(res, 502, { error: err instanceof Error ? err.message : 'Fournisseur indisponible' });
      }
    }

    if (req.method === 'GET' && url.pathname.startsWith('/status/')) {
      const ref = decodeURIComponent(url.pathname.slice('/status/'.length));
      const p = payments[ref];
      if (!p) return send(res, 404, { error: 'Inconnu' });
      if (p.status === 'pending' && provider.reconcile) await provider.reconcile(ref, p).catch(() => undefined);
      return send(res, 200, { status: p.status });
    }

    if (req.method === 'POST' && url.pathname === '/webhook/chariow') {
      const raw = await readBody(req);
      if (!chariowSignatureOk(raw, req.headers['x-chariow-signature'], CHARIOW_SECRET)) return send(res, 401, { error: 'Signature invalide' });
      const delivery = String(req.headers['x-pulse-delivery-id'] ?? '');
      if (delivery && seenDeliveries.has(delivery)) return send(res, 200, { ok: true, duplicate: true });
      const evt = parseJson(raw);
      const ref = String(evt?.sale?.custom_metadata?.dek_reference ?? evt?.checkout?.custom_metadata?.dek_reference ?? '');
      const p = payments[ref];
      if (p) {
        // Un paiement réussi n'est jamais repassé en échec ; un échec peut encore être rattrapé par une confirmation tardive.
        if (evt.event === 'successful.sale') markSuccess(ref, p);
        else if ((evt.event === 'failed.sale' || evt.event === 'abandoned.sale') && p.status !== 'success') p.status = 'failed';
        if (evt?.sale?.id) p.saleId = evt.sale.id;
        store.save();
      }
      if (delivery) seenDeliveries.add(delivery);
      return send(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/webhook') {
      const given = req.headers['x-webhook-secret'];
      if (!WEBHOOK_SECRET || given !== WEBHOOK_SECRET) return send(res, 401, { error: 'Non autorisé' });
      const b = parseJson(await readBody(req));
      const p = payments[String(b.reference ?? '')];
      if (!p) return send(res, 404, { error: 'Inconnu' });
      if (b.status === 'success') markSuccess(String(b.reference), p);
      else if (p.status !== 'success') p.status = 'failed';
      store.save();
      return send(res, 200, { ok: true });
    }

    return send(res, 404, { error: 'Introuvable' });
  } catch (err) {
    return send(res, 500, { error: err instanceof Error ? err.message : 'Erreur serveur' });
  }
});

// Ne démarre que lancé directement (pas quand un test l'importe).
if (process.argv[1]?.endsWith('payments-proxy.mjs')) {
  server.listen(PORT, () => console.log(`Serveur DEK (${PROVIDER}) sur http://localhost:${PORT}`));
  const bye = () => {
    store.flush();
    process.exit(0);
  };
  process.on('SIGINT', bye);
  process.on('SIGTERM', bye);
}
