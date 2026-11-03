// The streaming server calls this when a stream starts or stops (runOnReady / runOnNotReady).
// Protected by a shared secret that only your server and this function know.
const { env, safeEqual, rpc, body } = require('./_lib');

const UUID_PATH = /^live\/([0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12})$/;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  if (!safeEqual(req.headers['x-hook-secret'], env('HOOK_SECRET'))) return res.status(401).json({ error: 'unauthorized' });
  const b = body(req);
  const m = UUID_PATH.exec(b.path || '');
  if (!m || !['ready', 'notready'].includes(b.event)) return res.status(400).json({ error: 'bad_request' });
  try {
    const r = await rpc('live_stream_event', { p_session: m[1], p_ready: b.event === 'ready' });
    return res.status(200).json(r || { ok: true });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
};
