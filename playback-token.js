// A logged-in student asks for permission to watch. We check login + enrolment + class code (done earlier by join_live)
// on the server, then hand out a token that expires in 5 minutes. The player refreshes it while the class runs.
const { env, signJwt, rpc, userFromBearer, body, limited } = require('./_lib');

const TTL = 300;

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).end();
  try {
    const user = await userFromBearer(req.headers.authorization);
    if (!user) return res.status(401).json({ error: 'not_authenticated' });
    if (limited('tok:' + user.id, 40, 60000)) return res.status(429).json({ error: 'slow_down' });
    const b = body(req);
    const now = Math.floor(Date.now() / 1000);

    if (b.session) {
      const r = await rpc('live_check_access', { p_user: user.id, p_session: b.session });
      if (!r || r.ok !== true) return res.status(403).json({ error: (r && r.reason) || 'live_denied' });
      const token = signJwt({ sub: user.id, p: r.path, act: 'read', exp: now + TTL }, env('PLAYBACK_JWT_SECRET'));
      return res.status(200).json({ hls: env('LIVE_HLS_BASE') + '/' + r.path + '/index.m3u8', token, expires_in: TTL });
    }
    if (b.recording) {
      const r = await rpc('recording_check_access', { p_user: user.id, p_recording: b.recording });
      if (!r || r.ok !== true) return res.status(403).json({ error: (r && r.reason) || 'live_denied' });
      const token = signJwt({ sub: user.id, p: r.path, act: 'playback', exp: now + 6 * 3600 }, env('PLAYBACK_JWT_SECRET'));
      const u = env('LIVE_PLAYBACK_BASE') + '/get?path=' + encodeURIComponent(r.path) + '&start=' + encodeURIComponent(new Date(r.start).toISOString()) +
        '&duration=' + encodeURIComponent(r.duration) + '&format=mp4&token=' + encodeURIComponent(token);
      return res.status(200).json({ url: u, expires_in: 6 * 3600 });
    }
    return res.status(400).json({ error: 'bad_request' });
  } catch (e) {
    return res.status(500).json({ error: 'server_error' });
  }
};
