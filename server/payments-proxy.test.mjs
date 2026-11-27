// Test du serveur de paiement avec un FAUX Chariow (aucun vrai appel, aucun argent) :  node server/payments-proxy.test.mjs
import assert from 'node:assert/strict';
import http from 'node:http';
import crypto from 'node:crypto';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const here = path.dirname(fileURLToPath(import.meta.url));
const FAKE_PORT = 8911;
const PROXY_PORT = 8912;
const SECRET = 'whsec_test_secret';

// Faux Chariow : mémorise la dernière demande et répond comme la documentation.
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
      return res.end(JSON.stringify({ data: { step: 'payment', purchase: { id: 'sal_test1', status: 'awaiting_payment' }, payment: { checkout_url: 'https://pay.chariow.test/abc', transaction_id: 'txn_1' } } }));
    }
    if (req.method === 'GET' && req.url === '/v1/sales/sal_test1') return res.end(JSON.stringify({ data: { id: 'sal_test1', status: saleStatus } }));
    res.writeHead(404).end('{}');
  });
});
await new Promise((r) => fake.listen(FAKE_PORT, r));

const proxy = spawn(process.execPath, [path.join(here, 'payments-proxy.mjs')], {
  env: { ...process.env, PORT: String(PROXY_PORT), PAYMENT_PROVIDER: 'chariow', CHARIOW_API_BASE: `http://localhost:${FAKE_PORT}/v1`, CHARIOW_API_KEY: 'sk_test_key', CHARIOW_PRODUCT_ID: 'prd_test', CHARIOW_PULSE_SECRET: SECRET },
  stdio: 'ignore',
});
await new Promise((r) => setTimeout(r, 1200));

const call = async (method, p, body, headers = {}) => {
  const raw = body === undefined ? undefined : typeof body === 'string' ? body : JSON.stringify(body);
  const r = await fetch(`http://localhost:${PROXY_PORT}${p}`, { method, headers: { 'Content-Type': 'application/json', ...headers }, body: raw });
  return { status: r.status, json: await r.json().catch(() => ({})) };
};
const sign = (raw) => `sha256=${crypto.createHmac('sha256', SECRET).update(raw).digest('hex')}`;
const pulse = (event, ref, extra = {}) => JSON.stringify({ event, sale: { id: 'sal_test1', custom_metadata: { dek_reference: ref }, ...extra } });

try {
  // configuration
  let r = await call('GET', '/config');
  assert.equal(r.json.hostedCheckout, true);

  // e-mail obligatoire, numéro valide
  r = await call('POST', '/pay', { phone: '670123456', operator: 'mtn' });
  assert.equal(r.status, 400, 'e-mail manquant refusé');
  r = await call('POST', '/pay', { phone: '12', email: 'a@b.cm' });
  assert.equal(r.status, 400, 'numéro invalide refusé');

  // création du paiement
  r = await call('POST', '/pay', { phone: '670123456', email: 'karim@example.com', firstName: 'Karim', lastName: 'DEK', amount: 1 });
  assert.equal(r.status, 200);
  assert.equal(r.json.checkoutUrl, 'https://pay.chariow.test/abc');
  const ref = r.json.reference;
  assert.equal(lastCheckout.product_id, 'prd_test');
  assert.deepEqual(lastCheckout.phone, { number: '670123456', country_code: 'CM' });
  assert.equal(lastCheckout.custom_metadata.dek_reference, ref);
  assert.equal(lastCheckout.amount, undefined, 'le prix du client est ignoré');

  // en attente tant que rien n'est confirmé
  r = await call('GET', `/status/${ref}`);
  assert.equal(r.json.status, 'pending');

  // webhook : mauvaise signature refusée, bonne signature acceptée
  const ok = pulse('successful.sale', ref);
  r = await call('POST', '/webhook/chariow', ok, { 'x-chariow-signature': 'sha256=deadbeef', 'x-pulse-delivery-id': 'd1' });
  assert.equal(r.status, 401);
  r = await call('POST', '/webhook/chariow', ok, { 'x-chariow-signature': sign(ok), 'x-pulse-delivery-id': 'd1' });
  assert.equal(r.status, 200);
  r = await call('GET', `/status/${ref}`);
  assert.equal(r.json.status, 'success');

  // livraison répétée ignorée ; un échec tardif ne défait pas un paiement réussi
  r = await call('POST', '/webhook/chariow', ok, { 'x-chariow-signature': sign(ok), 'x-pulse-delivery-id': 'd1' });
  assert.equal(r.json.duplicate, true);
  const failed = pulse('failed.sale', ref);
  await call('POST', '/webhook/chariow', failed, { 'x-chariow-signature': sign(failed), 'x-pulse-delivery-id': 'd2' });
  r = await call('GET', `/status/${ref}`);
  assert.equal(r.json.status, 'success');

  // rattrapage sans webhook : le serveur interroge la vente
  r = await call('POST', '/pay', { phone: '655123456', email: 'a@b.cm' });
  const ref2 = r.json.reference;
  saleStatus = 'completed';
  r = await call('GET', `/status/${ref2}`);
  assert.equal(r.json.status, 'success', 'état rattrapé via GET /sales');

  console.log('OK : tous les tests du serveur de paiement passent.');
} finally {
  proxy.kill();
  fake.close();
}
