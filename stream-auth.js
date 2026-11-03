// MediaMTX asks this endpoint to approve every publish / read / playback request (authMethod: http).
// 200 = allowed, 401 = denied.
const { env, verifyJwt, rpc, body, limited } = require('./_lib');

const UUID_PATH = /^live\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;
const isLoopback = (ip) => ip === '127.0.0.1' || ip === '::1';

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  const b = body(req);
  const action = b.action, path = b.path || '', ip = b.ip || '';
  const q = new URLSearchParams(b.query || '');
  try {
    if (action === 'publish') {
      // Only RTMP/RTMPS publishing, only to live/<session id>, only with that session's secret.
      if (!['rtmp', 'rtmps'].includes(b.protocol)) return res.status(401).end();
      const m = UUID_PATH.exec(path);
      if (!m) return res.status(401).end();
      if (limited('pub:' + ip, 20, 60000)) return res.status(429).end();
      const secret = b.password || q.get('pass');
      const ok = await rpc('live_verify_publish', { p_session: m[1], p_secret: secret || null });
      return ok === true ? res.status(200).end() : res.status(401).end();
    }
    if (action === 'read' || action === 'playback') {
      if (action === 'read' && isLoopback(ip)) return res.status(200).end();       // the server itself (recording / health checks)
      const token = q.get('token') || b.token || b.password;
      const c = verifyJwt(token, env('PLAYBACK_JWT_SECRET'));
      const want = action === 'read' ? 'read' : 'playback';
      return c && c.act === want && c.p === path ? res.status(200).end() : res.status(401).end();
    }
    return res.status(401).end();                                                  // api / metrics / pprof are never public
  } catch (e) {
    return res.status(500).end();                                                  // fail closed: MediaMTX treats non-200 as denied
  }
};
