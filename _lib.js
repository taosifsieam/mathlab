// Shared helpers for the live-class server functions (Vercel Node functions). Files starting with "_" are not public endpoints.
const crypto = require('crypto');

const env = (k) => process.env[k] || '';

const b64u = (x) => Buffer.from(x).toString('base64url');

function signJwt(claims, secret) {
  const h = b64u(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const p = b64u(JSON.stringify(claims));
  const s = crypto.createHmac('sha256', secret).update(h + '.' + p).digest('base64url');
  return h + '.' + p + '.' + s;
}

function verifyJwt(token, secret) {
  if (!token || !secret || typeof token !== 'string') return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const expect = crypto.createHmac('sha256', secret).update(parts[0] + '.' + parts[1]).digest();
  let got;
  try { got = Buffer.from(parts[2], 'base64url'); } catch (e) { return null; }
  if (got.length !== expect.length || !crypto.timingSafeEqual(got, expect)) return null;
  let claims;
  try { claims = JSON.parse(Buffer.from(parts[1], 'base64url').toString()); } catch (e) { return null; }
  if (!claims.exp || claims.exp < Math.floor(Date.now() / 1000)) return null;
  return claims;
}

function safeEqual(a, b) {
  const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || ''));
  return x.length === y.length && x.length > 0 && crypto.timingSafeEqual(x, y);
}

// Calls a Postgres function in Supabase with the SERVICE ROLE key. This key exists only in the server environment.
async function rpc(name, args) {
  const r = await fetch(env('SUPABASE_URL') + '/rest/v1/rpc/' + name, {
    method: 'POST',
    headers: { apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: 'Bearer ' + env('SUPABASE_SERVICE_ROLE_KEY'), 'Content-Type': 'application/json' },
    body: JSON.stringify(args || {})
  });
  if (!r.ok) throw new Error('rpc_' + name + '_' + r.status);
  const t = await r.text();
  return t ? JSON.parse(t) : null;
}

// Who is calling? Ask Supabase to validate the student's login token.
async function userFromBearer(authHeader) {
  const m = /^Bearer (.+)$/.exec(authHeader || '');
  if (!m) return null;
  const r = await fetch(env('SUPABASE_URL') + '/auth/v1/user', { headers: { apikey: env('SUPABASE_SERVICE_ROLE_KEY'), Authorization: 'Bearer ' + m[1] } });
  if (!r.ok) return null;
  const u = await r.json();
  return u && u.id ? { id: u.id } : null;
}

function body(req) {
  if (req.body && typeof req.body === 'object') return req.body;
  try { return JSON.parse(req.body || '{}'); } catch (e) { return {}; }
}

// best-effort limiter (resets when the serverless instance restarts); real limits belong in Vercel Firewall / Cloudflare
const hits = new Map();
function limited(key, max, windowMs) {
  const now = Date.now();
  const rec = (hits.get(key) || []).filter((t) => now - t < windowMs);
  rec.push(now); hits.set(key, rec);
  if (hits.size > 5000) hits.clear();
  return rec.length > max;
}

module.exports = { env, signJwt, verifyJwt, safeEqual, rpc, userFromBearer, body, limited };
