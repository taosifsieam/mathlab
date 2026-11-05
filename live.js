/* MathLab Live Classes – student classroom + admin Live Control Center.
   Loaded by index.html before the main script. Uses the page's globals: $, $$, esc, rpc, sb, emsg, EM, U, ROLE, LH, C, sopts, nm, subName, mathify, toast.
   Every access decision is made by the server (Supabase functions + /api/*); nothing here grants access. */
(function () {
  'use strict';
  const L = window.MLLive = {};
  const TZ = 'Asia/Dhaka';
  let timers = [], room = null, chan = null, hls = null, bellT = null, lastUnread = -1;

  const addEM = () => Object.assign(EM, {
    bad_code: 'That class code is not correct. Check the code your teacher gave you.', not_live: 'This class is not live right now.',
    live_denied: 'You do not have access to this class.', join_first: 'Please enter the class code first.',
    muted: 'The teacher has muted you for a while.', slow_down: 'Please wait a moment before sending again.',
    bad_message: 'Write a message of up to 500 characters.', live_invalid: 'Please check the class details.',
    live_not_found: 'Class not found.', live_closed: 'This class is already finished.', student_not_found: 'No student has that email.',
    server_error: 'The server could not answer. Please try again.'
  });
  let emDone = false; const ensureEM = () => { if (!emDone) { addEM(); emDone = true; } };

  const css = document.createElement('style');
  css.textContent = `
.lv-sec{margin:0 0 22px}.lv-sec h3{margin:0 0 10px;display:flex;align-items:center;gap:8px}
.lv-cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px}
.lv-card{border:1px solid var(--bd);border-radius:14px;padding:16px;background:rgba(255,255,255,.92);display:flex;flex-direction:column;gap:6px}
.lv-card h4{margin:0;font-size:17px}.lv-meta{font-size:13px;color:var(--mut)}
.lv-pill{display:inline-block;font-size:12px;font-weight:700;padding:2px 10px;border-radius:99px;background:#e2e8f0;color:#334155}
.lv-pill.live{background:#fee2e2;color:#b91c1c}.lv-pill.scheduled{background:#dbeafe;color:#1d4ed8}.lv-pill.ended{background:#e2e8f0;color:#475569}.lv-pill.cancelled{background:#fef3c7;color:#92400e}
.lv-dot{display:inline-block;width:9px;height:9px;border-radius:50%;background:#dc2626;margin-right:6px;animation:lvp 1.4s infinite}@keyframes lvp{50%{opacity:.3}}
.lv-join{background:#dc2626;color:#fff;font-weight:700;border:0;padding:11px 14px;border-radius:10px;cursor:pointer}
.lv-cd{font-weight:700;color:var(--pri);font-variant-numeric:tabular-nums}
.lv-code{display:flex;gap:8px;margin-top:6px}.lv-code input{flex:1;text-transform:uppercase;letter-spacing:.12em;min-width:0}
.lv-main{display:grid;grid-template-columns:minmax(0,1fr) 360px;gap:14px;align-items:start}
@media(max-width:900px){.lv-main{grid-template-columns:1fr}}
.lv-video{position:relative;background:#000;border-radius:14px;overflow:hidden;aspect-ratio:16/9}.lv-video video{width:100%;height:100%;background:#000}
.lv-ov{position:absolute;inset:0;display:none;align-items:center;justify-content:center;text-align:center;color:#fff;background:rgba(5,10,25,.72);padding:20px;font-weight:600}
.lv-badge{position:absolute;top:10px;left:10px;background:#dc2626;color:#fff;font-size:12px;font-weight:700;padding:3px 10px;border-radius:99px}
.lv-bar{display:flex;gap:14px;flex-wrap:wrap;align-items:center;margin:8px 0;font-size:14px}.lv-bar select{width:auto}
.lv-chat{display:flex;flex-direction:column;height:560px;padding:12px}
.lv-chat .tabs{margin-bottom:8px}.lv-list{flex:1;overflow-y:auto;display:flex;flex-direction:column;gap:6px;padding:4px 2px}
.lv-msg{font-size:14px;padding:6px 9px;border-radius:10px;background:rgba(11,99,206,.06);overflow-wrap:anywhere}.lv-msg.t{background:rgba(11,99,206,.16)}.lv-msg.ans{opacity:.65}
.lv-msg small{color:var(--mut);margin-left:6px}.lv-msg b{color:var(--pri)}.lv-act{display:flex;gap:4px;flex-wrap:wrap;margin-top:4px}.lv-act button{padding:2px 8px;font-size:12px}
.lv-pin{background:#fef9c3;color:#713f12;border-radius:10px;padding:6px 9px;font-size:14px;margin-bottom:6px;overflow-wrap:anywhere}
.lv-send{display:flex;gap:6px;margin-top:8px}.lv-send input{flex:1;min-width:0}
.lv-adm{border:1px solid var(--bd);border-radius:14px;padding:14px;margin-bottom:10px;background:rgba(255,255,255,.92)}
.lv-key{font-family:ui-monospace,monospace;font-size:13px;word-break:break-all;background:#f1f5f9;padding:6px 8px;border-radius:8px;color:#0f172a}
.lv-bell{position:relative;padding:7px 10px!important}.lv-bell i{position:absolute;top:-6px;right:-6px;background:#dc2626;color:#fff;font:700 11px/1 sans-serif;border-radius:99px;padding:3px 5px;font-style:normal}
.lv-nl{position:fixed;top:70px;right:12px;width:min(340px,calc(100vw - 24px));max-height:60vh;overflow:auto;background:#fff;border:1px solid var(--bd);border-radius:14px;box-shadow:0 12px 30px rgba(10,24,56,.25);padding:10px;z-index:90}
.lv-nl div{padding:8px;border-bottom:1px solid var(--bd);font-size:14px}.lv-nl .u{background:rgba(11,99,206,.08)}
.tabs button[data-t=live]{--tc:#dc2626}.tabs button[data-t=livectl]{--tc:#0891b2}
html[data-theme=dark] .lv-card,html[data-theme=dark] .lv-adm{background:#0e162a}html[data-theme=dark] .lv-key{background:#1e293b;color:#e2e8f0}
html[data-theme=dark] .lv-nl{background:#0e162a}html[data-theme=dark] .lv-msg{background:rgba(120,170,255,.12)}html[data-theme=dark] .lv-pin{background:#422006;color:#fde68a}
`;
  document.head.appendChild(css);

  const fmt = (d, o) => new Date(d).toLocaleString('en-GB', Object.assign({ timeZone: TZ }, o || { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: true }));
  const clk = d => new Date(d).toLocaleTimeString('en-GB', { timeZone: TZ, hour: '2-digit', minute: '2-digit', hour12: true });
  const hms = s => { s = Math.max(0, Math.floor(s)); const h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(s % 60).padStart(2, '0'); };
  const cd = s => { s = Math.max(0, Math.floor(s)); const d = Math.floor(s / 86400); return (d ? d + 'd ' : '') + hms(s % 86400); };
  const copy = async (t, b) => { try { await navigator.clipboard.writeText(t); const o = b.textContent; b.textContent = 'Copied'; setTimeout(() => b.textContent = o, 1200); } catch (e) { prompt('Copy this:', t); } };
  const where = s => [s.subject_id ? subName(s.subject_id) : '', s.chapter || ''].filter(Boolean).join(' · ');
  const every = (f, ms) => { const t = setInterval(f, ms); timers.push(t); return t; };

  async function api(path, body) {
    const ss = (await sb.auth.getSession()).data.session;
    if (!ss) throw new Error('not_authenticated');
    const r = await fetch(path, { method: 'POST', headers: { 'content-type': 'application/json', authorization: 'Bearer ' + ss.access_token }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(r.status === 429 ? 'slow_down' : (j.error || 'server_error'));
    return j;
  }

  function stopAll() {
    timers.forEach(clearInterval); timers = [];
    if (hls) { try { hls.destroy(); } catch (e) { } hls = null; }
    if (chan) { try { sb.removeChannel(chan); } catch (e) { } chan = null; }
    room = null;
  }
  L.leave = stopAll;

  /* ================= Student: Live Classes tab ================= */
  L.student = async function () {
    ensureEM(); stopAll();
    const z = $('#lh');
    const draw = async first => {
      const [d, rec] = await Promise.all([rpc('my_live_sessions'), rpc('my_live_recordings')]);
      if (!document.body.contains($('#lvroot')) && !first) return;
      const live = d.live.map(s => `<div class="lv-card"><span class="lv-pill live"><span class="lv-dot"></span>LIVE NOW</span><h4>${esc(s.title)}</h4>
        <div class="lv-meta">${esc(s.course)}</div><div class="lv-meta">${esc(where(s))}</div><div class="lv-meta">${s.viewers} watching</div>
        <button type="button" class="lv-join" data-join="${s.id}">JOIN LIVE CLASS</button>
        <div class="lv-code" data-codebox="${s.id}" style="display:none"><input maxlength="12" placeholder="Class code" autocomplete="off"><button type="button" data-go="${s.id}">Enter</button></div>
        <p class="err" data-err="${s.id}"></p></div>`).join('');
      const up = d.upcoming.map(s => `<div class="lv-card"><span class="lv-pill scheduled">Scheduled</span><h4>${esc(s.title)}</h4><div class="lv-meta">${esc(s.course)}</div>
        <div class="lv-meta">${esc(where(s))}</div><div class="lv-meta">${esc(fmt(s.scheduled_at))} (Dhaka) · ${s.duration_min} min</div>
        <div>Starts in <span class="lv-cd" data-cd="${new Date(s.scheduled_at).getTime()}"></span></div></div>`).join('');
      const rc = d.recent.map(s => `<div class="lv-card"><span class="lv-pill ${s.status}">${s.status === 'cancelled' ? 'Cancelled' : 'Ended'}</span><h4>${esc(s.title)}</h4>
        <div class="lv-meta">${esc(s.course)}</div><div class="lv-meta">${esc(where(s))}</div><div class="lv-meta">${esc(fmt(s.scheduled_at))}</div>
        ${s.has_recording ? '<div class="lv-meta">Recording available below</div>' : ''}</div>`).join('');
      const rl = rec.map(r => `<div class="lv-card"><span class="lv-pill">Recording</span><h4>${esc(r.title)}</h4><div class="lv-meta">${esc(r.course)}</div>
        <div class="lv-meta">${esc(where(r))}</div><div class="lv-meta">${r.date ? esc(fmt(r.date)) : ''}${r.duration_sec ? ' · ' + Math.round(r.duration_sec / 60) + ' min' : ''}</div>
        <button type="button" data-play="${r.id}">Watch recording</button><p class="err" data-rerr="${r.id}"></p></div>`).join('');
      const sec = (t, h, empty) => `<div class="lv-sec"><h3>${t}</h3>${h ? `<div class="lv-cards">${h}</div>` : `<p class="ex">${empty}</p>`}</div>`;
      z.innerHTML = `<div id="lvroot">${sec('Live Now', live, 'No class is live right now.')}${sec('Upcoming Classes', up, 'No upcoming classes for your courses yet.')}
        ${sec('Recently Completed', rc, 'Nothing in the last 14 days.')}${sec('Recorded Classes', rl, 'Published recordings will appear here.')}</div>`;
      tick();
      $$('[data-join]').forEach(b => b.onclick = () => { const bx = $(`[data-codebox="${b.dataset.join}"]`); bx.style.display = 'flex'; bx.querySelector('input').focus(); b.style.display = 'none'; });
      $$('[data-go]').forEach(b => {
        const go = async () => {
          const id = b.dataset.go, code = $(`[data-codebox="${id}"] input`).value.trim(), er = $(`[data-err="${id}"]`);
          er.textContent = ''; b.disabled = true;
          try { await openRoom(id, code); } catch (e) { er.textContent = emsg(e); b.disabled = false; }
        };
        b.onclick = go; $(`[data-codebox="${b.dataset.go}"] input`).onkeydown = e => { if (e.key === 'Enter') go(); };
      });
      $$('[data-play]').forEach(b => b.onclick = async () => {
        const er = $(`[data-rerr="${b.dataset.play}"]`); er.textContent = ''; b.disabled = true;
        try { const t = await api('/api/playback-token', { recording: b.dataset.play }); playRecording(t.url); } catch (e) { er.textContent = emsg(e); }
        b.disabled = false;
      });
    };
    const tick = () => $$('[data-cd]').forEach(e => { const s = (+e.dataset.cd - Date.now()) / 1000; e.textContent = s > 0 ? cd(s) : 'any moment'; });
    await draw(true);
    every(tick, 1000);
    every(() => { if (LH.tab !== 'live' || room) return; if ($('#lvroot') && !$('.lv-code input:focus')) draw(false).catch(() => { }); }, 30000);
  };

  function playRecording(url) {
    const m = document.createElement('div');
    m.style.cssText = 'position:fixed;inset:0;background:rgba(5,10,25,.85);z-index:120;display:flex;align-items:center;justify-content:center;padding:14px';
    m.innerHTML = '<div style="width:min(960px,100%)"><div style="text-align:right;margin-bottom:6px"><button type="button" class="btn o" id="lvx">Close</button></div><video controls autoplay playsinline style="width:100%;background:#000;border-radius:12px"></video></div>';
    document.body.appendChild(m);
    const v = m.querySelector('video'); v.src = url;
    const close = () => { v.pause(); v.removeAttribute('src'); v.load(); m.remove(); };
    m.querySelector('#lvx').onclick = close; m.onclick = e => { if (e.target === m) close(); };
  }

  /* ================= Classroom ================= */
  async function openRoom(id, code) {
    const info = await rpc('join_live', { p_session: id, p_code: code });   // server checks login + enrolment + code + live status
    stopAll();
    room = { id, info, tab: 'chat', msgs: new Map(), tok: null, adm: ROLE === 'admin' };
    drawRoom();
  }
  L.openAdmin = async id => { stopAll(); const info = await rpc('join_live', { p_session: id, p_code: '' }); room = { id, info, tab: 'chat', msgs: new Map(), tok: null, adm: true }; $('#lh').scrollIntoView(); drawRoom(); };

  function drawRoom() {
    const R = room, z = $('#lh'), i = R.info;
    z.innerHTML = `<div class="lv-room"><button type="button" class="btn o" id="lvback">← Back to Live Classes</button>
    <div class="lv-main" style="margin-top:10px"><div>
      <div class="lv-video"><video id="lvv" playsinline controls></video><span class="lv-badge" id="lvbadge">LIVE</span><div class="lv-ov" id="lvov"></div></div>
      <div class="lv-bar"><span id="lvconn">Connecting…</span><span id="lvview">${i.viewers} watching</span><label>Quality <select id="lvq"><option value="-1">Auto</option></select></label></div>
      <div class="card"><h3>${esc(i.title)}</h3><p class="lv-meta">${esc(i.course)} · ${esc(where(i))}</p><p class="lv-meta">Teacher: Taosif Sieam</p>${i.description ? `<p>${esc(i.description)}</p>` : ''}</div>
    </div>
    <div class="card lv-chat"><div class="tabs"><button type="button" class="on" data-ct="chat">Live chat</button><button type="button" data-ct="question">Questions</button></div>
      <div id="lvpin"></div><div class="lv-list" id="lvl" aria-live="polite"></div>
      <form class="lv-send" id="lvf"><input id="lvi" maxlength="500" placeholder="Write a message… (math: $x^2$)" autocomplete="off"><button type="submit">Send</button></form><p class="err" id="lve"></p></div></div></div>`;
    $('#lvback').onclick = () => { stopAll(); L.student(); };
    $$('[data-ct]').forEach(b => b.onclick = () => { R.tab = b.dataset.ct; $$('[data-ct]').forEach(x => x.classList.toggle('on', x === b)); $('#lvi').placeholder = R.tab === 'chat' ? 'Write a message… (math: $x^2$)' : 'Ask your question…'; renderMsgs(); });
    $('#lvf').onsubmit = async e => {
      e.preventDefault(); const inp = $('#lvi'), t = inp.value.trim(); if (!t) return; $('#lve').textContent = '';
      try { await rpc('live_send_message', { p_session: R.id, p_body: t, p_kind: R.tab }); inp.value = ''; } catch (x) { $('#lve').textContent = emsg(x); }
    };
    startPlayer(); startChat();
    every(heartbeat, 60000);
  }

  function overlay(t) { const o = $('#lvov'); if (!o) return; o.style.display = t ? 'flex' : 'none'; o.textContent = t || ''; }
  function conn(t) { const c = $('#lvconn'); if (c) c.textContent = t; }

  async function startPlayer() {
    const R = room, v = $('#lvv');
    if (!(window.Hls && Hls.isSupported())) { overlay('This browser cannot play the live stream. Please use a recent Chrome, Edge, Firefox or Safari.'); conn('Not supported'); return; }
    const sep = u => u + (u.includes('?') ? '&' : '?') + 'token=' + encodeURIComponent(R.tok);
    const getTok = async () => { const t = await api('/api/playback-token', { session: R.id }); R.tok = t.token; return t; };
    let t;
    try { t = await getTok(); } catch (e) { overlay(emsg(e)); conn('No access'); return; }
    hls = new Hls({
      lowLatencyMode: true, backBufferLength: 30,
      xhrSetup: (x, u) => { x.open('GET', sep(u), true); },
      fetchSetup: (c, init) => new Request(sep(c.url), init)
    });
    const h = hls;
    h.attachMedia(v); h.loadSource(t.hls);
    h.on(Hls.Events.MANIFEST_PARSED, (_, d) => {
      const q = $('#lvq'); if (!q) return;
      q.innerHTML = '<option value="-1">Auto</option>' + d.levels.map((l, k) => `<option value="${k}">${l.height ? l.height + 'p' : Math.round(l.bitrate / 1000) + ' kbps'}</option>`).join('');
      q.onchange = () => { h.currentLevel = +q.value; };
      overlay(''); conn('Connected'); v.play().catch(() => { });
    });
    v.addEventListener('playing', () => { overlay(''); conn('Connected'); });
    v.addEventListener('waiting', () => conn('Buffering…'));
    h.on(Hls.Events.ERROR, (_, e) => {
      if (!e.fatal) return;
      const code = e.response && e.response.code;
      if (code === 401 || code === 403) { conn('Refreshing access…'); getTok().then(() => h.startLoad()).catch(x => { overlay(emsg(x)); conn('No access'); }); return; }
      if (e.type === Hls.ErrorTypes.NETWORK_ERROR) {
        conn('Reconnecting…'); overlay(code === 404 ? 'Waiting for the teacher’s stream…' : 'Connection problem. Reconnecting…');
        setTimeout(() => { if (hls === h) h.loadSource(t.hls); }, 4000);
      } else if (e.type === Hls.ErrorTypes.MEDIA_ERROR) { h.recoverMediaError(); }
      else { overlay('Playback error. Please go back and join again.'); conn('Error'); }
    });
    every(async () => { try { await getTok(); } catch (e) { if (/live_denied|not_live/.test(e.message)) endRoom(); } }, 240000);   // tokens last 5 min
  }

  function endRoom() { if (hls) { try { hls.destroy(); } catch (e) { } hls = null; } const b = $('#lvbadge'); if (b) { b.textContent = 'ENDED'; b.style.background = '#475569'; } overlay('This class has ended. A recording may appear in “Recorded Classes” later.'); conn('Ended'); }

  async function heartbeat() {
    if (!room) return;
    try {
      const d = await rpc('live_heartbeat', { p_session: room.id });
      const vw = $('#lvview'); if (vw) vw.textContent = d.viewers + ' watching';
      if (d.status === 'ended' || d.status === 'cancelled') endRoom();
      else if (d.offline_since) { overlay('The teacher’s connection dropped. Waiting for them to reconnect…'); conn('Teacher offline'); }
    } catch (e) { if (/live_denied|not_live|join_first/.test(e.message)) endRoom(); }
  }

  /* ---- chat (Supabase Realtime pushes new messages; no polling) ---- */
  async function startChat() {
    const R = room;
    try { (await rpc('live_chat_history', { p_session: R.id, p_limit: 100 })).forEach(m => R.msgs.set(m.id, m)); } catch (e) { $('#lve').textContent = emsg(e); }
    renderMsgs();
    chan = sb.channel('live-' + R.id).on('postgres_changes', { event: '*', schema: 'public', table: 'live_chat_messages', filter: 'session_id=eq.' + R.id }, p => {
      const m = p.new; if (!m || !m.id) return;
      if (m.deleted) R.msgs.delete(m.id); else R.msgs.set(m.id, m);
      renderMsgs();
    }).subscribe();
  }

  function renderMsgs() {
    const R = room, box = $('#lvl'); if (!R || !box) return;
    const all = [...R.msgs.values()].sort((a, b) => a.id - b.id), shown = all.filter(m => (R.tab === 'question' ? m.kind === 'question' : m.kind === 'chat'));
    const near = box.scrollHeight - box.scrollTop - box.clientHeight < 80;
    const pins = all.filter(m => m.pinned);
    $('#lvpin').innerHTML = pins.length ? pins.slice(-2).map(m => `<div class="lv-pin">📌 <b>${esc(m.author)}:</b> ${esc(m.body)}</div>`).join('') : '';
    box.innerHTML = '';
    shown.forEach(m => {
      const d = document.createElement('div'); d.className = 'lv-msg' + (m.is_teacher ? ' t' : '') + (m.answered ? ' ans' : '');
      const b = document.createElement('b'); b.textContent = m.author + (m.is_teacher ? ' (Teacher)' : '');
      const s = document.createElement('small'); s.textContent = clk(m.created_at) + (m.answered ? ' · answered' : '');
      const t = document.createElement('div'); t.textContent = m.body;   // textContent: never HTML
      d.append(b, s, t);
      if (R.adm) {
        const a = document.createElement('div'); a.className = 'lv-act';
        const mk = (label, fn) => { const x = document.createElement('button'); x.type = 'button'; x.className = 'btn o'; x.textContent = label; x.onclick = async () => { try { await fn(); } catch (e) { $('#lve').textContent = emsg(e); } }; a.appendChild(x); };
        mk(m.pinned ? 'Unpin' : 'Pin', () => rpc('admin_chat_action', { p_message: m.id, p_action: m.pinned ? 'unpin' : 'pin' }));
        mk('Delete', () => rpc('admin_chat_action', { p_message: m.id, p_action: 'delete' }));
        if (!m.is_teacher) mk('Mute 10 min', async () => { await rpc('admin_mute_from_message', { p_message: m.id, p_minutes: 10 }); toast('Muted for 10 minutes.'); });
        if (m.kind === 'question') mk(m.answered ? 'Not answered' : 'Answered', () => rpc('admin_chat_action', { p_message: m.id, p_action: m.answered ? 'unanswered' : 'answered' }));
        d.appendChild(a);
      }
      box.appendChild(d);
    });
    if (!shown.length) box.innerHTML = '<p class="ex">' + (R.tab === 'chat' ? 'No messages yet.' : 'No questions yet. Ask one below.') + '</p>';
    if (window.renderMathInElement) try { renderMathInElement(box, { delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }], throwOnError: false }); } catch (e) { }
    if (near || R.first === undefined) box.scrollTop = box.scrollHeight; R.first = false;
  }

  /* ================= Admin: Live Control Center ================= */
  L.admin = async function () {
    ensureEM(); stopAll();
    const z = $('#lh'); if (ROLE !== 'admin') { z.innerHTML = ''; return; }
    const st = await rpc('admin_live_settings', null);
    const courses = (typeof C !== 'undefined' ? C : []).map(c => c.t).filter(Boolean);
    z.innerHTML = `<div id="lvadm">
    <div class="card"><h3>Create / edit live class</h3><input type="hidden" id="lid">
      <div class="grid"><label>Course<input id="lcourse" list="lvcl" maxlength="120" placeholder="Choose or type the course name"><datalist id="lvcl">${courses.map(c => `<option value="${esc(c)}">`).join('')}</datalist></label>
      <label>Subject<select id="lsub">${sopts(true).replace('All subjects', '—')}</select></label>
      <label>Class title<input id="ltitle" maxlength="150"></label><label>Chapter / topic<input id="lchap" maxlength="150"></label>
      <label>Date &amp; time (your device time)<input id="lwhen" type="datetime-local"></label><label>Expected duration (minutes)<input id="ldur" type="number" min="5" max="480" value="60"></label>
      <label>Who can join<select id="laud"><option value="enrolled">All students enrolled in the course</option><option value="selected">Only selected students</option></select></label></div>
      <label>Short description<textarea id="ldesc" rows="2" maxlength="1000"></textarea></label>
      <label id="lselbox" style="display:none">Selected students’ emails (one per line)<textarea id="lsel" rows="3"></textarea></label>
      <p class="err" id="lerr"></p><div class="row"><button type="button" id="lsave">Save class</button><button type="button" class="btn o" id="lclear">Clear form</button></div></div>
    <div class="card" style="margin-top:14px"><h3>Sessions</h3><p class="ex">Times are in Dhaka time. The class turns LIVE automatically when OBS starts streaming.</p><div id="lvlist"></div></div>
    <div class="card" style="margin-top:14px"><h3>Recordings</h3><div id="lvrec"></div></div>
    <div class="card" style="margin-top:14px"><h3>Course access (enrolments)</h3><p class="ex">Give a registered student access to a course (for example after a bKash payment you have checked).</p>
      <div class="grid"><label>Student email<input id="eem" type="email"></label><label>Course<input id="ecr" list="lvcl" maxlength="120"></label><label>Access days (empty = course default)<input id="eda" type="number" min="1" max="3650"></label></div><p class="err" id="eer"></p><button type="button" id="egrant">Grant access</button><div id="elist" style="margin-top:12px;overflow-x:auto"></div></div>
    <div class="card" style="margin-top:14px"><h3>Streaming configuration</h3><p class="ex">The address OBS connects to. Your streaming server’s address goes here after you set it up (see LIVE-GUIDE.md).</p>
      <div class="grid"><label>RTMP server URL (for OBS)<input id="srtmp" placeholder="rtmp://stream.yourdomain.com/live" value="${esc(st.rtmp_url || '')}"></label>
      <label>Reconnect grace period (seconds, 30–900)<input id="sgr" type="number" min="30" max="900" value="${st.grace_seconds || 120}"></label></div><p class="err" id="ser"></p><button type="button" id="ssave">Save configuration</button></div></div>`;
    $('#laud').onchange = () => $('#lselbox').style.display = $('#laud').value === 'selected' ? 'block' : 'none';
    $('#lclear').onclick = clearForm;
    $('#lsave').onclick = async () => {
      const er = $('#lerr'); er.textContent = '';
      const when = $('#lwhen').value; if (!when) { er.textContent = 'Choose the date and time.'; return; }
      const aud = $('#laud').value, emails = $('#lsel').value.split(/[\s,;]+/).filter(Boolean);
      if (aud === 'selected' && !emails.length) { er.textContent = 'Enter the selected students’ emails (the list is replaced each time you save).'; return; }
      $('#lsave').disabled = true;
      try {
        const r = await rpc('admin_live_save', { p: { id: $('#lid').value || null, course: $('#lcourse').value, subject_id: $('#lsub').value, title: $('#ltitle').value, chapter: $('#lchap').value, description: $('#ldesc').value, scheduled_at: new Date(when).toISOString(), duration_min: +$('#ldur').value, audience: aud, selected_emails: emails } });
        if (!r.ok) throw new Error(r.error); toast('Saved. Class code: ' + r.class_code); clearForm(); await drawList();
      } catch (e) { er.textContent = emsg(e); }
      $('#lsave').disabled = false;
    };
    $('#ssave').onclick = async () => {
      const er = $('#ser'); er.textContent = '';
      try { await rpc('admin_live_settings', { p: { rtmp_url: $('#srtmp').value, hls_base: st.hls_base, playback_base: st.playback_base, grace_seconds: +$('#sgr').value } }); toast('Configuration saved.'); } catch (e) { er.textContent = emsg(e); }
    };
    $('#egrant').onclick = async () => {
      const er = $('#eer'); er.textContent = '';
      try { const r = await rpc('admin_enrollment_grant', { p_email: $('#eem').value, p_course: $('#ecr').value, p_days: $('#eda').value ? +$('#eda').value : null }); if (!r.ok) throw new Error(r.error); toast('Access granted.'); $('#eem').value = ''; await drawEnr(); } catch (e) { er.textContent = emsg(e); }
    };
    await Promise.all([drawList(), drawRec(), drawEnr()]);
    every(() => { if (LH.tab === 'livectl' && !room) pollList(); }, 15000);
    every(() => $$('[data-since]').forEach(e => e.textContent = hms((Date.now() - (+e.dataset.since)) / 1000)), 1000);
  };

  const toInput = d => { const x = new Date(new Date(d).getTime() - new Date(d).getTimezoneOffset() * 60000); return x.toISOString().slice(0, 16); };
  function clearForm() { ['lid', 'lcourse', 'ltitle', 'lchap', 'lwhen', 'ldesc', 'lsel'].forEach(k => { const e = $('#' + k); if (e) e.value = ''; }); $('#ldur').value = 60; $('#laud').value = 'enrolled'; $('#lsub').value = ''; $('#lselbox').style.display = 'none'; $('#lerr').textContent = ''; }

  let SES = [];
  async function pollList() {
    try {
      const n = await rpc('admin_live_list'), changed = n.length !== SES.length || n.some((s, k) => s.id !== SES[k].id || s.status !== SES[k].status || !!s.offline_since !== !!SES[k].offline_since);
      SES = n; if (changed) { if (!document.activeElement || !/INPUT|TEXTAREA/.test(document.activeElement.tagName) || !document.activeElement.closest('#lvlist')) drawListHtml(); }
      else n.forEach(s => { const e = $(`[data-viewers="${s.id}"]`); if (e) e.textContent = s.viewers; });
    } catch (e) { }
  }
  async function drawList() { SES = await rpc('admin_live_list'); drawListHtml(); }
  const health = s => s.status === 'live' ? (s.offline_since ? 'Stream dropped – waiting for OBS to reconnect' : 'Receiving stream from OBS') : s.status === 'scheduled' ? 'Waiting for OBS to start streaming' : '—';
  function drawListHtml() {
    const box = $('#lvlist'); if (!box) return;
    box.innerHTML = SES.length ? SES.map(s => `<div class="lv-adm" data-sid="${s.id}"><div class="row" style="margin:0;justify-content:space-between"><div>
      <span class="lv-pill ${s.status}">${s.status === 'live' ? '<span class="lv-dot"></span>' : ''}${s.status.toUpperCase()}</span> <b>${esc(s.title)}</b>
      <div class="lv-meta">${esc(s.course)} · ${esc(where(s))} · ${esc(fmt(s.scheduled_at))} · ${s.duration_min} min · ${s.audience === 'selected' ? 'selected students' : 'all enrolled'}</div>
      <div class="lv-meta">Class code: <b>${esc(s.class_code)}</b> · Stream: ${esc(health(s))}</div>
      <div class="lv-meta">Viewers now: <b data-viewers="${s.id}">${s.viewers}</b> · Joined so far: ${s.attended}${s.status === 'live' && s.live_started_at ? ` · On air: <b data-since="${new Date(s.live_started_at).getTime()}"></b>` : ''}</div></div></div>
      <div class="row" style="margin-top:8px">
      ${s.status === 'scheduled' || s.status === 'live' ? `<button type="button" class="btn o" data-a="obs">OBS &amp; stream key</button><button type="button" class="btn o" data-a="code">New class code</button><button type="button" class="btn o" data-a="preview">Preview stream</button><button type="button" class="btn o" data-a="edit">Edit</button>` : ''}
      ${s.status === 'live' ? '<button type="button" data-a="end" style="background:#dc2626">End session</button>' : ''}${s.status === 'scheduled' ? '<button type="button" class="btn o" data-a="cancel">Cancel class</button>' : ''}</div>
      <div data-obs style="display:none"></div><p class="err" data-e></p></div>`).join('') : '<p class="ex">No classes yet. Create the first one above.</p>';
    $$('[data-a]').forEach(b => b.onclick = () => act(b));
  }

  async function act(b) {
    const card = b.closest('[data-sid]'), id = card.dataset.sid, er = card.querySelector('[data-e]'), s = SES.find(x => x.id === id), a = b.dataset.a; er.textContent = '';
    try {
      if (a === 'edit') {
        $('#lid').value = id; $('#lcourse').value = s.course; $('#lsub').value = s.subject_id || ''; $('#ltitle').value = s.title; $('#lchap').value = s.chapter || '';
        $('#lwhen').value = toInput(s.scheduled_at); $('#ldur').value = s.duration_min; $('#ldesc').value = s.description || ''; $('#laud').value = s.audience;
        $('#lselbox').style.display = s.audience === 'selected' ? 'block' : 'none'; $('#lvadm').scrollIntoView({ behavior: 'smooth' }); toast('Editing: change the details and press Save class.');
      } else if (a === 'preview') await L.openAdmin(id);
      else if (a === 'code') { if (confirm('Create a new class code? The old code stops working for students who have not joined yet.')) { await rpc('admin_live_rotate', { p_session: id, p_what: 'code' }); await drawList(); } }
      else if (a === 'end') { if (confirm('End this live class now? Students will be disconnected and the recording will be prepared.')) { const r = await rpc('admin_live_status', { p_session: id, p_status: 'ended' }); if (!r.ok) throw new Error(r.error); await drawList(); await drawRec(); } }
      else if (a === 'cancel') { if (confirm('Cancel this class? Enrolled students will be notified.')) { const r = await rpc('admin_live_status', { p_session: id, p_status: 'cancelled' }); if (!r.ok) throw new Error(r.error); await drawList(); } }
      else if (a === 'obs') obsPanel(card, id);
    } catch (e) { er.textContent = emsg(e); }
  }

  async function obsPanel(card, id) {
    const p = card.querySelector('[data-obs]');
    if (p.style.display === 'block') { p.style.display = 'none'; p.innerHTML = ''; return; }   // closing also drops the key from the page
    const o = await rpc('admin_live_obs', { p_session: id });
    p.style.display = 'block';
    p.innerHTML = `<div class="obj"><b>OBS Studio → Settings → Stream</b><p class="ex">Service: Custom · keep the key private. Never show this screen to students.</p>
      <p>Server</p><div class="lv-key">${esc(o.rtmp_url || '(set the RTMP server URL under Streaming configuration)')}</div><button type="button" class="btn o" data-c="s">Copy server</button>
      <p>Stream key</p><div class="lv-key" id="kk">••••••••••••••••</div><div class="row" style="margin-top:6px"><button type="button" class="btn o" data-c="k">Copy key</button><button type="button" class="btn o" data-c="v">Show / hide</button><button type="button" class="btn o" data-c="r">Generate new key</button></div></div>`;
    let shown = false, key = o.stream_key;
    p.querySelector('[data-c=s]').onclick = e => copy(o.rtmp_url || '', e.target);
    p.querySelector('[data-c=k]').onclick = e => copy(key, e.target);
    p.querySelector('[data-c=v]').onclick = () => { shown = !shown; p.querySelector('#kk').textContent = shown ? key : '••••••••••••••••'; };
    p.querySelector('[data-c=r]').onclick = async () => {
      if (!confirm('Generate a new stream key? The old key stops working immediately. Update OBS with the new key.')) return;
      await rpc('admin_live_rotate', { p_session: id, p_what: 'key' }); key = (await rpc('admin_live_obs', { p_session: id })).stream_key; shown = true; p.querySelector('#kk').textContent = key; toast('New stream key created.');
    };
  }

  async function drawRec() {
    const r = await rpc('admin_recording_list'), b = $('#lvrec'); if (!b) return;
    b.innerHTML = r.length ? r.map(x => `<div class="lv-adm"><b>${esc(x.title)}</b> <span class="lv-pill">${esc(x.status)}</span>
      <div class="lv-meta">${esc(x.course)} · ${x.date ? esc(fmt(x.date)) : ''}${x.duration_sec ? ' · ' + Math.round(x.duration_sec / 60) + ' min' : ''}</div>
      <div class="row" style="margin-top:6px">${x.status !== 'published' ? `<button type="button" data-rs="published" data-id="${x.id}">Publish to students</button>` : `<button type="button" class="btn o" data-rs="hidden" data-id="${x.id}">Hide from students</button>`}</div></div>`).join('') : '<p class="ex">Recordings appear here after a class ends. Review one, then publish it.</p>';
    $$('[data-rs]').forEach(x => x.onclick = async () => { try { await rpc('admin_recording_set', { p_id: x.dataset.id, p_status: x.dataset.rs }); await drawRec(); } catch (e) { toast(emsg(e)); } });
  }

  async function drawEnr() {
    const r = await rpc('admin_enrollment_list', { p_limit: 50 }), b = $('#elist'); if (!b) return;
    b.innerHTML = `<table><thead><tr><th>Student</th><th>Email</th><th>Course</th><th>Status</th><th>Access until</th><th></th></tr></thead><tbody>${r.map(e => `<tr><td>${esc(e.name || '')}</td><td>${esc(e.email || '')}</td><td>${esc(e.course)}</td><td>${esc(e.status)}</td><td>${e.expires_at ? esc(fmt(e.expires_at, { day: '2-digit', month: 'short', year: 'numeric' })) : 'No expiry'}</td><td>${e.status === 'cancelled' ? '' : `<button type="button" class="btn o" data-rv="${e.id}">Revoke</button>`}</td></tr>`).join('')}</tbody></table>`;
    $$('[data-rv]').forEach(x => x.onclick = async () => { if (confirm('Remove this student’s access to the course?')) { await rpc('admin_enrollment_revoke', { p_id: +x.dataset.rv }); await drawEnr(); } });
  }

  /* ================= Notification bell ================= */
  L.bell = function () {
    clearInterval(bellT); const old = $('#lvbell'); if (old) old.remove(); const nl = $('#lvnl'); if (nl) nl.remove();
    if (!U || !sb) return;
    const b = document.createElement('button'); b.type = 'button'; b.id = 'lvbell'; b.className = 'btn o lv-bell'; b.setAttribute('aria-label', 'Notifications'); b.innerHTML = '🔔<i style="display:none"></i>';
    $('#ab').prepend(b);
    const load = async open => {
      try {
        const d = await rpc('my_notifications', { p_limit: 20 }), badge = b.querySelector('i');
        badge.style.display = d.unread ? 'inline' : 'none'; badge.textContent = d.unread > 9 ? '9+' : d.unread;
        if (lastUnread >= 0 && d.unread > lastUnread && d.items[0]) toast(d.items[0].title);
        lastUnread = d.unread;
        if (open) {
          let p = $('#lvnl'); if (!p) { p = document.createElement('div'); p.id = 'lvnl'; p.className = 'lv-nl'; document.body.appendChild(p); }
          p.innerHTML = d.items.length ? d.items.map(n => `<div class="${n.read_at ? '' : 'u'}" data-nid="${n.id}" style="cursor:pointer"><b>${esc(n.title)}</b><br>${esc(n.body || '')}<br><small>${esc(fmt(n.created_at))}</small></div>`).join('') : '<div>No notifications yet.</div>';
          p.onclick = () => { p.remove(); try { sessionStorage.setItem('lhTab', 'live'); } catch (e) { } LH.tab = 'live'; if (location.hash === '#practice') showTab('live'); else location.hash = '#practice'; };
          if (d.unread) { await rpc('mark_notifications_read'); badge.style.display = 'none'; lastUnread = 0; }
        }
      } catch (e) { }
    };
    b.onclick = e => { e.stopPropagation(); const p = $('#lvnl'); if (p) p.remove(); else load(true); };
    if (!L.bound) { L.bound = true; document.addEventListener('click', e => { const p = $('#lvnl'); const bb = $('#lvbell'); if (p && !p.contains(e.target) && !(bb && bb.contains(e.target))) p.remove(); }); }
    load(false); bellT = setInterval(() => { if (!document.hidden) load(false); }, 60000);
  };
})();
