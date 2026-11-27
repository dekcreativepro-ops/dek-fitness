// Tests du serveur (comptes, XP, remise, paiement) avec un FAUX Chariow : aucun vrai appel, aucun argent.
//   node server/payments-proxy.test.mjs
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { PRICE_LEVELS, discountPct, priceFor, xpForClaim } from './economy.mjs';

// ---------- règles pures ----------
assert.equal(discountPct(0), 0);
assert.equal(discountPct(999), 0);
assert.equal(discountPct(1000), 10);
assert.equal(discountPct(4999), 40);
assert.equal(discountPct(5000), 50);
assert.equal(discountPct(99999), 50, 'plafond à 50 %');
assert.equal(priceFor(0), 5000);
assert.equal(priceFor(5000), 2500);
assert.equal(priceFor(123456), 2500, 'jamais sous 2 500');
assert.deepEqual(PRICE_LEVELS, [5000, 4500, 4000, 3500, 3000, 2500]);
assert.equal(xpForClaim('workout', 60, { kind: 0, total: 0 }).xp, 500, '1 heure = 500 XP');
assert.equal(xpForClaim('workout', 60, { kind: 400, total: 400 }).xp, 200, 'quota journalier par type');
assert.equal(xpForClaim('workout', 60, { kind: 0, total: 1250 }).reason, 'daily_cap', 'quota total par jour');
assert.equal(xpForClaim('pushups', 100000, { kind: 0, total: 0 }).xp, 450, 'une déclaration est plafonnée');
assert.equal(xpForClaim('inconnu', 5, { kind: 0, total: 0 }).reason, 'unknown_kind');
assert.equal(xpForClaim('workout', -5, { kind: 0, total: 0 }).reason, 'invalid_units');

// ---------- serveur ----------
const here = path.dirname(fileURLToPath(import.meta.url));
const FAKE_PORT = 8911;
const PROXY_PORT = 8912;
const SECRET = 'whsec_test_secret';
const dbFile = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'dek-test-')), 'db.json');

let lastCheckout = null;
let saleStatus = 'awaiting_payment';
const fake = http.createServer((req, res) => {
  let data = '';
  req.on('data', (c) => (data += c));
  req.on('end', () => {
    res.setHeader('Content-Type', 'application/json');
    if (req.headers.authorization !== 'Bearer sk_test_key') return res.writeHead(401).end('{}');
    if (req.method === 'POST' && req.url === '/v1/checkout') {
      lastCheckout = JSON.parse(data);
      return res.end(JSON.stringify({ data: { step: 'payment', purchase: { id: `sal_${lastCheckout.custom_metadata.dek_reference}` }, payment: { checkout_url: 'https://pay.chariow.test/abc' } } }));
    }
    if (req.method === 'GET' && req.url.startsWith('/v1/sales/')) return res.end(JSON.stringify({ data: { status: saleStatus } }));
    res.writeHead(404).end('{}');
  });
});
await new Promise((r) => fake.listen(FAKE_PORT, r));

const env = {
  ...process.env,
  PORT: String(PROXY_PORT),
  PAYMENT_PROVIDER: 'chariow',
  CHARIOW_API_BASE: `http://localhost:${FAKE_PORT}/v1`,
  CHARIOW_API_KEY: 'sk_test_key',
  CHARIOW_PRODUCT_IDS: JSON.stringify({ 5000: 'prd_5000', 4500: 'prd_4500', 4000: 'prd_4000', 3500: 'prd_3500', 3000: 'prd_3000', 2500: 'prd_2500' }),
  CHARIOW_PULSE_SECRET: SECRET,
  DEK_DB: dbFile,
};
const start = async () => {
  const p = spawn(process.execPath, [path.join(here, 'payments-proxy.mjs')], { env, stdio: 'ignore' });
  await new Promise((r) => setTimeout(r, 1200));
  return p;
};
let proxy = await start();

const call = async (method, p, body, headers = {}) => {
  const raw = body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body);
  const r = await fetch(`http://localhost:${PROXY_PORT}${p}`, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: raw });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};
const auth = (t) => ({ Authorization: `Bearer ${t}` });
const sign = (raw) => `sha256=${crypto.createHmac('sha256', SECRET).update(raw).digest('hex')}`;
const pulse = (event, ref) => JSON.stringify({ event, sale: { id: `sal_${ref}`, custom_metadata: { dek_reference: ref } } });

try {
  // ----- comptes -----
  let r = await call('POST', '/auth/register', { phone: '12', name: 'Karim', password: 'secret1' });
  assert.equal(r.status, 400, 'numéro invalide');
  r = await call('POST', '/auth/register', { phone: '670123456', name: 'Karim', password: 'abc' });
  assert.equal(r.status, 400, 'mot de passe trop court');
  r = await call('POST', '/auth/register', { phone: '+237 670 12 34 56', name: 'Karim Test', password: 'secret1' });
  assert.equal(r.status, 200);
  const token = r.json.token;
  assert.match(token, /^[0-9a-f]{64}$/);
  assert.equal(r.json.account.subscribed, false);
  assert.equal(r.json.account.nextPrice, 5000);
  assert.equal(r.json.account.hash, undefined, 'le mot de passe ne sort jamais');
  r = await call('POST', '/auth/register', { phone: '670123456', name: 'Autre', password: 'secret1' });
  assert.equal(r.status, 400, 'numéro déjà inscrit');

  r = await call('GET', '/me');
  assert.equal(r.status, 401, 'sans jeton');
  r = await call('GET', '/me', undefined, auth('0'.repeat(64)));
  assert.equal(r.status, 401, 'faux jeton');
  r = await call('GET', '/me', undefined, auth(token));
  assert.equal(r.json.account.name, 'Karim Test');

  // connexion et blocage après 5 échecs
  r = await call('POST', '/auth/login', { phone: '670123456', password: 'mauvais' });
  assert.equal(r.status, 401);
  r = await call('POST', '/auth/login', { phone: '670123456', password: 'secret1' });
  assert.equal(r.status, 200);
  for (let i = 0; i < 5; i++) await call('POST', '/auth/login', { phone: '670123456', password: 'faux' + i });
  r = await call('POST', '/auth/login', { phone: '670123456', password: 'secret1' });
  assert.equal(r.status, 401, 'compte bloqué quelques minutes après trop d’essais');

  // ----- XP : calculés par le serveur, avec quotas -----
  r = await call('POST', '/xp/earn', { kind: 'workout', units: 60, claimId: 'c1' }, auth(token));
  assert.equal(r.json.xp, 500);
  r = await call('POST', '/xp/earn', { kind: 'workout', units: 60, claimId: 'c1' }, auth(token));
  assert.equal(r.json.xp, 0, 'même déclaration : comptée une seule fois');
  assert.equal(r.json.reason, 'duplicate');
  r = await call('POST', '/xp/earn', { kind: 'workout', units: 60, claimId: 'c2' }, auth(token));
  assert.equal(r.json.xp, 100, 'quota de 600 XP/jour pour les séances');
  r = await call('POST', '/xp/earn', { kind: 'workout', units: 60, claimId: 'c3' }, auth(token));
  assert.equal(r.json.xp, 0);
  assert.equal(r.json.reason, 'daily_cap');
  r = await call('POST', '/xp/earn', { xp: 99999, kind: 'workout', units: 0 }, auth(token));
  assert.equal(r.status, 400, 'le client ne peut pas imposer un nombre d’XP');
  r = await call('POST', '/xp/earn', { kind: 'outdoor', units: 5 }, auth(token));
  assert.equal(r.json.xp, 650, 'plafond total de 1 250 XP par jour');
  assert.equal(r.json.account.xp.last30, 1250);
  assert.equal(r.json.account.discountPct, 10);
  assert.equal(r.json.account.nextPrice, 4500, '1 250 XP ce mois = 10 % de remise');

  // ----- paiement : jeton obligatoire, prix décidé par le serveur -----
  r = await call('POST', '/pay', { phone: '670123456', email: 'a@b.cm' });
  assert.equal(r.status, 401, 'payer demande un compte');
  r = await call('POST', '/pay', { phone: '670123456' }, auth(token));
  assert.equal(r.status, 400, 'e-mail obligatoire');
  r = await call('POST', '/pay', { phone: '670123456', email: 'karim@example.cm', price: 1 }, auth(token));
  assert.equal(r.status, 200);
  assert.equal(r.json.price, 4500);
  assert.equal(lastCheckout.product_id, 'prd_4500', 'le produit correspond au prix remisé');
  assert.equal(lastCheckout.price, undefined);
  const ref = r.json.reference;
  r = await call('GET', '/me', undefined, auth(token));
  assert.equal(r.json.account.subscribed, false, 'pas d’abonnement tant que rien n’est confirmé');

  // webhook : mauvaise signature refusée, bonne acceptée -> abonnement actif 30 jours
  const ok = pulse('successful.sale', ref);
  r = await call('POST', '/webhook/chariow', ok, { 'x-chariow-signature': 'sha256=deadbeef' });
  assert.equal(r.status, 401);
  r = await call('POST', '/webhook/chariow', ok, { 'x-chariow-signature': sign(ok), 'x-pulse-delivery-id': 'd1' });
  assert.equal(r.status, 200);
  r = await call('GET', '/me', undefined, auth(token));
  assert.equal(r.json.account.subscribed, true);
  const days = (r.json.account.paidUntil - Date.now()) / 86_400_000;
  assert.ok(days > 29.9 && days <= 30, `30 jours d'abonnement (${days})`);
  const until1 = r.json.account.paidUntil;

  // livraison répétée : l'abonnement n'est pas prolongé deux fois
  await call('POST', '/webhook/chariow', ok, { 'x-chariow-signature': sign(ok), 'x-pulse-delivery-id': 'd2' });
  r = await call('GET', '/me', undefined, auth(token));
  assert.equal(r.json.account.paidUntil, until1, 'une référence ne prolonge qu’une fois');

  // un échec tardif ne défait pas un paiement réussi
  const failed = pulse('failed.sale', ref);
  await call('POST', '/webhook/chariow', failed, { 'x-chariow-signature': sign(failed), 'x-pulse-delivery-id': 'd3' });
  r = await call('GET', `/status/${ref}`);
  assert.equal(r.json.status, 'success');

  // rattrapage sans webhook : le serveur interroge Chariow, et le mois suivant s'ajoute à la fin du premier
  r = await call('POST', '/pay', { phone: '670123456', email: 'a@b.cm' }, auth(token));
  const ref2 = r.json.reference;
  saleStatus = 'completed';
  r = await call('GET', `/status/${ref2}`);
  assert.equal(r.json.status, 'success');
  r = await call('GET', '/me', undefined, auth(token));
  assert.equal(r.json.account.paidUntil, until1 + 30 * 86_400_000, 'le renouvellement s’ajoute à la fin de l’abonnement en cours');

  // ----- données conservées après un redémarrage -----
  await new Promise((r) => setTimeout(r, 500)); // laisse l'écriture du fichier se faire
  proxy.kill();
  await new Promise((r) => setTimeout(r, 500));
  proxy = await start();
  r = await call('GET', '/me', undefined, auth(token));
  assert.equal(r.status, 200, 'la session survit au redémarrage');
  assert.equal(r.json.account.xp.last30, 1250, 'les XP aussi');
  assert.equal(r.json.account.subscribed, true, 'et l’abonnement');

  r = await call('POST', '/auth/logout', {}, auth(token));
  r = await call('GET', '/me', undefined, auth(token));
  assert.equal(r.status, 401, 'déconnexion');

  console.log('OK : tous les tests (règles XP, comptes, quotas, paiement, redémarrage) passent.');
} finally {
  proxy.kill();
  fake.close();
}
