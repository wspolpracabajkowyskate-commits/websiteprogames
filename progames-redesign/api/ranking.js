/* MONSTER GAME – shared ranking (best score per nick), stored as one private JSON file in Vercel Blob.
   Scores cannot simply be posted: every cleared stage is checked against what that stage makes possible
   (maximum points, minimum time, real elapsed time) and the server signs the running total.
   GET            -> { top: [{ n, s, st }], count }
   POST start     -> { token }                     new run
   POST stage     -> { token }                     { token, stage, time, score } after a cleared stage
   POST submit    -> { total, place, best, top }   { token, nick, stage, extra } when the run ends */
const crypto = require('crypto');
const LEVELS = require('../games/monster-game-levels.js');

const BLOB = process.env.BLOB_READ_WRITE_TOKEN || '';
const STORE = BLOB.split('_')[3] || '';
const SECRET = crypto.createHash('sha256').update('monster-rank-v1:' + BLOB).digest();
const FILE = 'monster-game/ranking.json';
const ORIGINS = ['https://www.progamespoland.com', 'https://progamespoland.com', 'https://www.progames.pl', 'https://progames.pl', 'https://websiteprogames.vercel.app'];
const PREVIEW = /^https:\/\/websiteprogames(-[a-z0-9-]+)?-progames1\.vercel\.app$/;
const NICK_RE = /^[A-Z0-9ĄĆĘŁŃÓŚŹŻ_\-. ]{1,10}$/;
const MAX_AGE = 8 * 24 * 3600 * 1000;

/* what each stage can give at most, and the fastest it can be finished */
const CAPS = LEVELS.map(l => {
  let o = 0, B = 0, H = 0, h = 0, E = 0, X = 0, cols = 0;
  for (const chunk of l.chunks) {
    cols += Math.max(...chunk.map(r => r.length));
    for (const row of chunk) for (const ch of row) {
      if (ch === 'o') o++; else if (ch === 'B') B++; else if (ch === 'H') H++; else if (ch === 'h') h++;
      else if (ch === 'b' || ch === 's' || ch === 'g') E++; else if (ch === 'X') X++;
    }
  }
  let max = o * 10 + B * (50 + 30) + H * (50 + 500) + h * 500 + E * 1000 + X * 20 + l.par * 20 + 2000 + 1000 + 900;
  if (l.boss) max += 8 * 300 + 5000 + 12 * 10 + 20 * 100;
  return { max: Math.ceil(max * 1.02) + 100, minT: Math.max(12, Math.floor(cols * 16 / 150 * 0.8)) };
});

const b64 = b => Buffer.from(b).toString('base64url');
const sign = s => crypto.createHmac('sha256', SECRET).update(s).digest('base64url').slice(0, 32);
function makeToken(p) { const body = b64(JSON.stringify(p)); return body + '.' + sign(body); }
function readToken(t) {
  if (typeof t !== 'string' || t.length > 600) return null;
  const [body, sig] = t.split('.');
  if (!body || !sig) return null;
  const a = Buffer.from(sign(body)), b = Buffer.from(sig);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  try {
    const p = JSON.parse(Buffer.from(body, 'base64url').toString('utf8'));
    if (!p || typeof p.t0 !== 'number' || Date.now() - p.t0 > MAX_AGE) return null;
    return p;
  } catch { return null; }
}

/* blob storage over HTTP (same calls the @vercel/blob SDK makes) */
async function load() {
  const r = await fetch(`https://${STORE}.private.blob.vercel-storage.com/${FILE}?cache=0`, { headers: { authorization: 'Bearer ' + BLOB }, signal: AbortSignal.timeout(8000) });
  if (r.status === 404) return { data: { v: 1, p: {} }, etag: null };
  if (!r.ok) throw new Error('blob read ' + r.status);
  return { data: await r.json(), etag: r.headers.get('etag') };
}
async function store(data, etag) {
  const headers = {
    authorization: 'Bearer ' + BLOB, 'x-api-version': '13', 'x-vercel-blob-store-id': STORE, 'x-vercel-blob-access': 'private',
    'x-allow-overwrite': '1', 'x-add-random-suffix': '0', 'x-content-type': 'application/json', 'x-cache-control-max-age': '60'
  };
  if (etag) headers['x-if-match'] = etag;
  const r = await fetch('https://vercel.com/api/blob/?' + new URLSearchParams({ pathname: FILE }), { method: 'PUT', headers, body: JSON.stringify(data), signal: AbortSignal.timeout(8000) });
  if (r.status === 412) return false;
  if (!r.ok) throw new Error('blob write ' + r.status + ' ' + (await r.text()).slice(0, 200));
  return true;
}
function topList(data, n) {
  return Object.entries(data.p || {}).map(([k, v]) => ({ n: k, s: v.s, st: v.st })).sort((a, b) => b.s - a.s).slice(0, n);
}

const hits = new Map();
function limited(ip) {
  const now = Date.now();
  for (const [k, v] of hits) if (v.until < now) hits.delete(k);
  const h = hits.get(ip) || { c: 0, until: now + 60000 };
  h.c++; hits.set(ip, h);
  return h.c > 40;
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store'); res.setHeader('X-Robots-Tag', 'noindex');
  if (!BLOB || !STORE) return res.status(503).json({ ok: false });
  try {
    if (req.method === 'GET') {
      const { data } = await load();
      return res.status(200).json({ ok: true, top: topList(data, 20), count: Object.keys(data.p || {}).length });
    }
    if (req.method !== 'POST') { res.setHeader('Allow', 'GET, POST'); return res.status(405).json({ ok: false }); }
    const origin = req.headers.origin;
    if (!origin || !(ORIGINS.includes(origin) || PREVIEW.test(origin))) return res.status(403).json({ ok: false });
    const ip = req.headers['x-vercel-forwarded-for'] || req.headers['x-forwarded-for'] || 'unknown';
    if (limited(ip)) { res.setHeader('Retry-After', '60'); return res.status(429).json({ ok: false }); }
    let b = req.body; try { if (typeof b === 'string') b = JSON.parse(b); } catch { return res.status(400).json({ ok: false }); }
    if (!b || typeof b !== 'object' || JSON.stringify(b).length > 2000) return res.status(400).json({ ok: false });
    const now = Date.now();

    if (b.op === 'start') {
      return res.status(200).json({ ok: true, token: makeToken({ id: crypto.randomBytes(8).toString('hex'), t0: now, last: now, done: [], sc: 0 }) });
    }

    const p = readToken(b.token);
    if (!p) return res.status(400).json({ ok: false, error: 'token' });

    if (b.op === 'stage') {
      const i = b.stage, time = b.time, score = b.score;
      if (!Number.isInteger(i) || i < 0 || i >= CAPS.length || p.done.includes(i)) return res.status(400).json({ ok: false, error: 'stage' });
      if (!Number.isInteger(time) || !Number.isInteger(score) || score < 0) return res.status(400).json({ ok: false, error: 'data' });
      const cap = CAPS[i];
      // impossible: faster than the stage allows, more points than it holds, or less real time passed than claimed
      if (time < cap.minT || score > cap.max || (now - p.last) / 1000 < time * 0.9 - 3) return res.status(422).json({ ok: false, error: 'rejected' });
      return res.status(200).json({ ok: true, token: makeToken({ ...p, last: now, done: [...p.done, i], sc: p.sc + score }) });
    }

    if (b.op === 'submit') {
      const nick = typeof b.nick === 'string' ? b.nick.toUpperCase().trim() : '';
      if (!NICK_RE.test(nick)) return res.status(400).json({ ok: false, error: 'nick' });
      let extra = Number.isInteger(b.extra) && b.extra > 0 ? b.extra : 0;
      if (extra) { // points from the stage that was not finished: capped by the stage and by time actually played
        const i = b.stage;
        if (!Number.isInteger(i) || i < 0 || i >= CAPS.length || p.done.includes(i)) extra = 0;
        else extra = Math.min(extra, Math.floor(CAPS[i].max * 0.6), Math.floor((now - p.last) / 1000 * 120));
      }
      const total = p.sc + extra;
      const st = p.done.includes(CAPS.length - 1) ? 'END' : 'E' + (Number.isInteger(b.stage) && b.stage >= 0 ? b.stage + 1 : p.done.length ? Math.max(...p.done) + 1 : 1);
      let best = false, data;
      for (let attempt = 0; attempt < 5; attempt++) {
        const cur = await load(); data = cur.data; data.p = data.p || {}; data.u = data.u || {};
        // one submission per run, unless more stages were cleared since (continued run)
        if (data.u[p.id] !== undefined && data.u[p.id] >= p.done.length) return res.status(409).json({ ok: false, error: 'used', top: topList(data, 20) });
        data.u[p.id] = p.done.length;
        const ids = Object.keys(data.u); if (ids.length > 5000) for (const k of ids.slice(0, ids.length - 5000)) delete data.u[k];
        const e = data.p[nick];
        if (total > 0 && (!e || total > e.s)) {
          data.p[nick] = { s: total, st, d: now }; best = true;
          const keep = Object.entries(data.p).sort((x, y) => y[1].s - x[1].s).slice(0, 500);
          data.p = Object.fromEntries(keep);
        }
        if (await store(data, cur.etag)) break;
        best = false; // someone else wrote at the same moment: reload and retry
      }
      const all = topList(data, 500), place = all.findIndex(r => r.n === nick) + 1;
      return res.status(200).json({ ok: true, total, best, place, top: all.slice(0, 20) });
    }
    return res.status(400).json({ ok: false });
  } catch (e) {
    console.error('ranking', e && e.message);
    return res.status(502).json({ ok: false });
  }
};
