// Petit serveur pour brancher le coach IA sur un vrai modèle (API Claude), sans exposer la clé dans l'app.
// Non testé avec une vraie clé : à lancer chez toi ou à déployer (Render, Railway, VPS…).
//
//   ANTHROPIC_API_KEY=ta_cle node server/coach-proxy.mjs
//   puis, dans l'app : VITE_COACH_API_URL=http://localhost:8787 (fichier .env.local) et relancer `npm run dev`.
//
// Corps reçu : { system, context, messages: [{ role: 'user' | 'assistant', content }] }  →  réponse : { text }

import http from 'node:http';

const PORT = Number(process.env.PORT ?? 8787);
const KEY = process.env.ANTHROPIC_API_KEY;
const MODEL = process.env.COACH_MODEL ?? 'claude-sonnet-5-5';
const ORIGIN = process.env.ALLOWED_ORIGIN ?? '*';

if (!KEY) {
  console.error('ANTHROPIC_API_KEY manquante.');
  process.exit(1);
}

function send(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': ORIGIN,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  });
  res.end(JSON.stringify(body));
}

http
  .createServer(async (req, res) => {
    if (req.method === 'OPTIONS') return send(res, 204, {});
    if (req.method !== 'POST') return send(res, 405, { error: 'POST uniquement' });
    try {
      let raw = '';
      for await (const chunk of req) {
        raw += chunk;
        if (raw.length > 100_000) return send(res, 413, { error: 'Message trop gros' });
      }
      const { system, context, messages } = JSON.parse(raw);
      const safeMessages = (Array.isArray(messages) ? messages : [])
        .slice(-16)
        .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content ?? '').slice(0, 2000) }));
      if (!safeMessages.length || safeMessages[safeMessages.length - 1].role !== 'user') return send(res, 400, { error: 'Dernier message utilisateur requis' });

      const api = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': KEY, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: MODEL,
          max_tokens: 500,
          system: `${String(system ?? '').slice(0, 6000)}\n\nContexte de l'utilisateur (JSON) : ${JSON.stringify(context ?? {}).slice(0, 2000)}`,
          messages: safeMessages,
        }),
      });
      if (!api.ok) return send(res, 502, { error: `Modèle indisponible (${api.status})` });
      const data = await api.json();
      const text = (data.content ?? []).filter((b) => b.type === 'text').map((b) => b.text).join('\n').trim();
      return send(res, 200, { text });
    } catch {
      return send(res, 500, { error: 'Erreur serveur' });
    }
  })
  .listen(PORT, () => console.log(`Coach IA prêt sur http://localhost:${PORT}`));
