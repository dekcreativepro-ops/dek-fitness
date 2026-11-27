// Serveur de paiement DEK (modèle à compléter) — Mobile Money pour l'abonnement Premium.
//
//   PAYMENT_PROVIDER=demo node server/payments-proxy.mjs        -> simule les paiements (test de l'app)
//   PAYMENT_PROVIDER=chariow ... (ou mesomb, flutterwave)        -> à compléter dans `providers` ci-dessous
//
// L'app appelle :   POST /pay            { operator, phone, amount, currency, plan }  -> { reference }
//                   GET  /status/:ref    -> { status: 'pending' | 'success' | 'failed' }
// Le fournisseur appelle : POST /webhook (protégé par WEBHOOK_SECRET) pour confirmer un paiement.
//
// ⚠ Les clés secrètes restent ICI, jamais dans l'app. Les paiements sont gardés en mémoire :
//    en production, utilise une vraie base de données (et associe chaque paiement à un compte utilisateur).
//    Les fonctions `providers.*.charge` ci-dessous sont des gabarits : elles n'ont PAS été testées avec un vrai fournisseur.

import http from 'node:http';
import crypto from 'node:crypto';

const PORT = Number(process.env.PORT ?? 8788);
const PROVIDER = process.env.PAYMENT_PROVIDER ?? 'demo';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET ?? '';
const ALLOWED_ORIGIN = process.env.ALLOWED_ORIGIN ?? '*';
const PRICE = Number(process.env.PREMIUM_PRICE_FCFA ?? 2500);

/** @type {Map<string, {status: 'pending'|'success'|'failed', operator: string, phone: string, amount: number, createdAt: number}>} */
const payments = new Map();

const providers = {
  // Simulation : le paiement réussit 4 s après la demande.
  demo: {
    async charge(ref) {
      setTimeout(() => {
        const p = payments.get(ref);
        if (p) p.status = 'success';
      }, 4000);
    },
  },
  // À compléter avec la documentation du fournisseur choisi (clé API, URL, format de la requête).
  chariow: {
    async charge() {
      throw new Error('Fournisseur « chariow » non configuré : voir docs/ABONNEMENT.md');
    },
  },
  mesomb: {
    async charge() {
      throw new Error('Fournisseur « mesomb » non configuré : voir docs/ABONNEMENT.md');
    },
  },
  flutterwave: {
    async charge() {
      throw new Error('Fournisseur « flutterwave » non configuré : voir docs/ABONNEMENT.md');
    },
  },
};

function send(res, code, body) {
  res.writeHead(code, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
  });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', (c) => {
      data += c;
      if (data.length > 20_000) reject(new Error('Requête trop grande'));
    });
    req.on('end', () => {
      try {
        resolve(data ? JSON.parse(data) : {});
      } catch {
        reject(new Error('JSON invalide'));
      }
    });
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === 'OPTIONS') return send(res, 204, {});
  const url = new URL(req.url ?? '/', 'http://localhost');

  try {
    if (req.method === 'POST' && url.pathname === '/pay') {
      const b = await readJson(req);
      const phone = String(b.phone ?? '');
      if (!/^6\d{8}$/.test(phone)) return send(res, 400, { error: 'Numéro invalide' });
      if (b.operator !== 'mtn' && b.operator !== 'orange') return send(res, 400, { error: 'Opérateur invalide' });
      // Le prix est décidé par le serveur, jamais par l'app.
      const reference = `DEK-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
      payments.set(reference, { status: 'pending', operator: b.operator, phone, amount: PRICE, createdAt: Date.now() });
      await (providers[PROVIDER] ?? providers.demo).charge(reference, { operator: b.operator, phone, amount: PRICE });
      return send(res, 200, { reference });
    }

    if (req.method === 'GET' && url.pathname.startsWith('/status/')) {
      const p = payments.get(decodeURIComponent(url.pathname.slice('/status/'.length)));
      return send(res, p ? 200 : 404, p ? { status: p.status } : { error: 'Inconnu' });
    }

    if (req.method === 'POST' && url.pathname === '/webhook') {
      const given = req.headers['x-webhook-secret'];
      if (!WEBHOOK_SECRET || given !== WEBHOOK_SECRET) return send(res, 401, { error: 'Non autorisé' });
      const b = await readJson(req);
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

server.listen(PORT, () => console.log(`Paiements DEK (${PROVIDER}) sur http://localhost:${PORT}`));
