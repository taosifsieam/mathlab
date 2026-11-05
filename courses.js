/* MathLab Phase 1 – Courses, YouTube lessons, lesson progress, and the admin Course Manager.
   Loaded before the main script. Uses page globals: $, $$, esc, rpc, sb, emsg, EM, U, ROLE, LH, wa, toast, uploadFig, showTab.
   Access is decided by the server (supabase-courses.sql); this file only displays what the server returns. */
(function () {
  'use strict';
  const K = window.MLCourses = {};
  let timers = [], player = null, cur = null, emDone = false;

  const css = document.createElement('style');
  css.textContent = `
.cr-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(290px,1fr));gap:14px}
.cr-card{border:1px solid var(--bd);border-radius:14px;overflow:hidden;background:rgba(255,255,255,.92);display:flex;flex-direction:column}
.cr-th{aspect-ratio:16/9;background:var(--grad);display:flex;align-items:center;justify-content:center;color:#fff;font-weight:700;font-size:20px;text-align:center;padding:10px;overflow:hidden}.cr-th img{width:100%;height:100%;object-fit:cover;display:block}
.cr-body{padding:14px;display:flex;flex-direction:column;gap:7px;flex:1}.cr-body h4{margin:0;font-size:17px}.cr-m{font-size:13px;color:var(--mut)}
.cr-d{font-size:14px;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.cr-bar{height:8px;border-radius:99px;background:#e2e8f0;overflow:hidden}.cr-bar i{display:block;height:100%;background:linear-gradient(90deg,#0b63ce,#22c55e);border-radius:99px;transition:width .4s}
.cr-pill{display:inline-block;font-size:12px;font-weight:700;padding:2px 10px;border-radius:99px}
.cr-pill.on{background:#dcfce7;color:#166534}.cr-pill.off{background:#e2e8f0;color:#475569}.cr-pill.exp{background:#fee2e2;color:#991b1b}.cr-pill.free{background:#dbeafe;color:#1d4ed8}
.cr-ch{border:1px solid var(--bd);border-radius:12px;margin-bottom:10px;background:rgba(255,255,255,.92)}.cr-ch>summary{cursor:pointer;padding:12px 14px;font-weight:700;display:flex;gap:8px;justify-content:space-between;align-items:center}
.cr-ls{padding:0 8px 8px}.cr-l{display:flex;gap:10px;align-items:center;padding:9px 8px;border-radius:10px;cursor:pointer}.cr-l:hover{background:rgba(11,99,206,.08)}.cr-l.lock{opacity:.7}
.cr-l .t{flex:1;min-width:0;overflow-wrap:anywhere}.cr-l .ic{width:22px;text-align:center;flex:none}
.cr-vid{position:relative;aspect-ratio:16/9;background:#000;border-radius:14px;overflow:hidden}.cr-vid iframe,.cr-vid>div{position:absolute;inset:0;width:100%;height:100%}
.cr-lay{display:grid;grid-template-columns:minmax(0,1fr) 320px;gap:14px;align-items:start}@media(max-width:900px){.cr-lay{grid-template-columns:1fr}}
.cr-cont{border:1px solid var(--bd);border-radius:14px;padding:14px;background:linear-gradient(135deg,rgba(11,99,206,.10),rgba(34,197,94,.10));margin-bottom:16px;display:flex;gap:12px;align-items:center;flex-wrap:wrap;justify-content:space-between}
.cr-warn{background:#fef9c3;color:#713f12;border-radius:12px;padding:12px 14px;font-size:14px;margin-bottom:14px}
.cr-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center;margin:10px 0}
.cr-adm{border:1px solid var(--bd);border-radius:12px;padding:12px;margin-bottom:10px;background:rgba(255,255,255,.92)}
.tabs button[data-t=courses]{--tc:#2563eb}.tabs button[data-t=cms]{--tc:#7c3aed}
html[data-theme=dark] .cr-card,html[data-theme=dark] .cr-ch,html[data-theme=dark] .cr-adm{background:#0e162a}html[data-theme=dark] .cr-bar{background:#1e293b}
html[data-theme=dark] .cr-warn{background:#422006;color:#fde68a}html[data-theme=dark] .cr-pill.on{background:#14532d;color:#bbf7d0}html[data-theme=dark] .cr-pill.off{background:#1e293b;color:#cbd5e1}
html[data-theme=dark] .cr-pill.exp{background:#7f1d1d;color:#fecaca}html[data-theme=dark] .cr-pill.free{background:#1e3a8a;color:#bfdbfe}
`;
  document.head.appendChild(css);

  const ensureEM = () => {
    if (emDone) return; emDone = true;
    Object.assign(EM, {
      not_enrolled: 'This lesson is for enrolled students. Contact MathLab to enroll in the course.', lesson_not_found: 'Lesson not found.', course_not_found: 'Course not found.',
      course_invalid: 'Please check the course details (names need at least 3 letters).', video_invalid: 'The YouTube link is not valid. Paste a link like https://youtu.be/XXXXXXXXXXX',
      lesson_invalid: 'Please check the lesson details.', course_not_draft: 'Set the course to “Draft” first, then delete it.'
    });
  };
  const mins = s => { if (!s) return ''; const m = Math.round(s / 60); return m >= 60 ? Math.floor(m / 60) + 'h ' + String(m % 60).padStart(2, '0') + 'm' : m + ' min'; };
  const cname = c => (c.title_bn && c.title_en) ? c.title_bn + ' (' + c.title_en + ')' : (c.title_bn || c.title_en || '');
  const dt = d => new Date(d).toLocaleDateString('en-GB', { timeZone: 'Asia/Dhaka', day: '2-digit', month: 'short', year: 'numeric' });
  const pct = (a, b) => b ? Math.round(100 * a / b) : 0;

  async function stop(save) {
    timers.forEach(clearInterval); timers = [];
    if (player) {
      try { if (save && cur) { const t = Math.floor(player.getCurrentTime()); if (t > 0) await rpc('lesson_progress_save', { p_lesson: cur.id, p_position: t, p_completed: null, p_duration: null }).catch(() => { }); } } catch (e) { }
      try { player.destroy(); } catch (e) { } player = null;
    }
    cur = null;
  }
  const thumb = c => (window.MLThumb && (MLThumb(c.title) || MLThumb(c.enroll_name))) || '';
  K.leave = () => { stop(true); };

  /* ================= Student ================= */
  K.student = async function () {
    ensureEM(); await stop(true);
    const z = $('#lh');
    const [cs, cont] = await Promise.all([rpc('my_courses'), rpc('continue_learning')]);
    const contHtml = cont.length ? cont.map(c => `<div class="cr-cont"><div><b>Continue learning</b><div class="cr-m">${esc(c.course_title)}</div><div>${esc(c.lesson_title)}${c.position_sec > 5 ? ' · resume at ' + Math.floor(c.position_sec / 60) + ':' + String(c.position_sec % 60).padStart(2, '0') : ''}</div></div>
      <button type="button" data-lesson="${c.lesson_id}">Resume lesson</button></div>`).join('') : '';
    z.innerHTML = contHtml + (cs.length ? `<div class="cr-grid">${cs.map(c => {
      const p = pct(c.lessons_done, c.lessons_total);
      return `<div class="cr-card"><div class="cr-th">${(c.thumbnail_url || thumb(c)) ? `<img alt="" loading="lazy" src="${esc(c.thumbnail_url || thumb(c))}">` : esc(c.title)}</div><div class="cr-body">
        <div><span class="cr-pill ${c.enrolled ? 'on' : c.expired ? 'exp' : 'off'}">${c.enrolled ? 'Enrolled' : c.expired ? 'Access expired' : 'Not enrolled'}</span>${c.status === 'draft' ? ' <span class="cr-pill off">Draft</span>' : ''}</div>
        <h4>${esc(c.title)}</h4><div class="cr-m">${esc(c.instructor || '')}${c.duration_text ? ' · ' + esc(c.duration_text) : ''}</div>
        ${c.description ? `<div class="cr-d">${esc(c.description)}</div>` : ''}
        ${c.enrolled && c.lessons_total ? `<div class="cr-bar"><i style="width:${p}%"></i></div><div class="cr-m">${c.lessons_done}/${c.lessons_total} lessons · ${p}% complete${c.expires_at ? ' · access until ' + esc(dt(c.expires_at)) : ''}</div>` : `<div class="cr-m">${c.lessons_total} lessons</div>`}
        <div class="cr-row" style="margin-top:auto"><button type="button" data-course="${c.id}">${c.enrolled ? 'Open course' : 'View course'}</button>
        ${c.enrolled ? '' : `<a class="btn o" target="_blank" rel="noopener" href="${esc(wa({ t: c.title }))}">${c.expired ? 'Renew' : 'Enroll'} on WhatsApp</a>`}</div></div></div>`;
    }).join('')}</div>` : '<p class="ex">No courses are published yet.</p>');
    $$('[data-course]').forEach(b => b.onclick = () => K.course(b.dataset.course));
    $$('[data-lesson]').forEach(b => b.onclick = () => K.lesson(b.dataset.lesson));
  };

  K.course = async function (id) {
    ensureEM(); await stop(true);
    const z = $('#lh'), c = await rpc('course_outline', { p_course: id });
    const tot = c.chapters.reduce((a, x) => a + x.total, 0), done = c.chapters.reduce((a, x) => a + x.done, 0), p = pct(done, tot);
    z.innerHTML = `<button type="button" class="btn o" id="crb">← My Courses</button>
    <div class="card" style="margin:10px 0"><h3>${esc(c.title)}</h3><div class="cr-m">${esc(c.instructor || '')}${c.duration_text ? ' · ' + esc(c.duration_text) : ''}</div>
      ${c.description ? `<p>${esc(c.description)}</p>` : ''}
      ${c.enrolled ? `<div class="cr-bar"><i style="width:${p}%"></i></div><div class="cr-m">${done}/${tot} lessons · ${p}% complete${c.expires_at ? ' · access until ' + esc(dt(c.expires_at)) : ''}</div>` :
        `<p class="cr-warn" style="margin:8px 0 0">You are not enrolled in this course. Lessons marked <b>Free preview</b> are open to you. <a target="_blank" rel="noopener" href="${esc(wa({ t: c.title }))}">Enroll on WhatsApp</a></p>`}</div>
    <div id="crnote" class="err"></div>
    ${c.chapters.length ? c.chapters.map(ch => `<details class="cr-ch" ${ch.done < ch.total || !ch.total ? 'open' : ''}><summary><span>${ch.number}. ${esc(cname(ch))}</span>
      <span class="cr-m">${ch.total && ch.done === ch.total ? '✓ Completed' : ch.done + '/' + ch.total}</span></summary><div class="cr-ls">
      ${ch.lessons.map(l => `<div class="cr-l ${l.locked ? 'lock' : ''}" data-l="${l.id}" data-lock="${l.locked ? 1 : 0}"><span class="ic">${l.done ? '✅' : l.locked ? '🔒' : '▶'}</span><span class="t">${esc(l.title)}</span>
        ${l.is_free_preview && !c.enrolled ? '<span class="cr-pill free">Free preview</span>' : ''}<span class="cr-m">${esc(mins(l.duration_sec))}</span></div>`).join('') || '<p class="ex" style="padding:6px 8px">Lessons coming soon.</p>'}
      ${ch.practice_chapter_id ? `<div class="cr-row"><button type="button" class="btn o" data-prac="1">Practice this chapter</button></div>` : ''}</div></details>`).join('') : '<p class="ex">Chapters will be added soon.</p>'}`;
    $('#crb').onclick = () => K.student();
    $$('.cr-l').forEach(r => r.onclick = () => r.dataset.lock === '1' ? ($('#crnote').textContent = EM.not_enrolled) : K.lesson(r.dataset.l));
    $$('[data-prac]').forEach(b => b.onclick = () => showTab('practice'));
  };

  const loadYT = () => new Promise((res, rej) => {
    if (window.YT && YT.Player) return res();
    const to = setTimeout(() => rej(new Error('yt')), 12000);
    window.onYouTubeIframeAPIReady = () => { clearTimeout(to); res(); };
    const s = document.createElement('script'); s.src = 'https://www.youtube.com/iframe_api'; s.onerror = () => rej(new Error('yt')); document.head.appendChild(s);
  });

  K.lesson = async function (id) {
    ensureEM(); await stop(true);
    const z = $('#lh');
    let d;
    try { d = await rpc('lesson_get', { p_lesson: id }); } catch (e) { z.innerHTML = `<button type="button" class="btn o" id="crb">← My Courses</button><p class="err" style="margin-top:10px">${esc(emsg(e))}</p>`; $('#crb').onclick = () => K.student(); return; }
    cur = d;
    const isAdmin = ROLE === 'admin';
    z.innerHTML = `<button type="button" class="btn o" id="crb">← Back to course</button>
    <div class="cr-lay" style="margin-top:10px"><div>
      <div class="cr-vid"><div id="crp"></div></div>
      <div class="card" style="margin-top:10px"><h3 style="margin-top:0">${esc(d.title)}</h3><div class="cr-m">Chapter ${d.chapter.number}: ${esc(cname(d.chapter))}${d.duration_sec ? ' · ' + esc(mins(d.duration_sec)) : ''}</div>
        ${d.description ? `<p style="white-space:pre-line">${esc(d.description)}</p>` : ''}
        <div class="cr-row"><button type="button" class="btn o" id="crprev" ${d.prev ? '' : 'disabled'}>‹ Previous</button><button type="button" id="crdone"></button><button type="button" class="btn o" id="crnext" ${d.next ? '' : 'disabled'}>Next ›</button></div>
        <p class="err" id="crerr"></p></div></div>
      <div><div class="card"><b>Course progress</b><div class="cr-bar" style="margin:8px 0"><i id="crbar" style="width:${pct(d.course_done, d.course_total)}%"></i></div><div class="cr-m" id="crtxt">${d.course_done}/${d.course_total} lessons completed</div></div>
        ${d.resources.length ? `<div class="card" style="margin-top:10px"><b>Notes &amp; PDFs</b>${d.resources.map(r => `<div style="margin-top:6px"><a target="_blank" rel="noopener noreferrer" href="${esc(r.url)}">📄 ${esc(r.title)}</a></div>`).join('')}</div>` : ''}
        ${d.chapter.practice_chapter_id ? `<div class="card" style="margin-top:10px"><b>Related practice</b><p class="cr-m">Practice questions for this chapter.</p><button type="button" class="btn o" id="crprac">Open Practice</button></div>` : ''}
      </div></div>`;
    $('#crb').onclick = () => K.course(d.course_id);
    const paint = () => { const b = $('#crdone'); b.textContent = cur.completed ? '✓ Completed (tap to undo)' : 'Mark as completed'; b.className = cur.completed ? 'btn o' : ''; };
    const save = async (pos, comp) => {
      const r = await rpc('lesson_progress_save', { p_lesson: d.id, p_position: pos, p_completed: comp, p_duration: isAdmin && player && player.getDuration ? Math.floor(player.getDuration()) || null : null });
      if (cur && cur.id === d.id) { cur.completed = r.completed; $('#crbar').style.width = pct(r.course_done, r.course_total) + '%'; $('#crtxt').textContent = r.course_done + '/' + r.course_total + ' lessons completed'; paint(); }
      return r;
    };
    paint();
    const pos = () => { try { return Math.floor(player.getCurrentTime()) || 0; } catch (e) { return d.position_sec; } };
    $('#crdone').onclick = async () => { try { await save(pos(), !cur.completed); } catch (e) { $('#crerr').textContent = emsg(e); } };
    const go = n => async () => { if (n.locked) { $('#crerr').textContent = EM.not_enrolled; return; } await K.lesson(n.id); };
    if (d.prev) $('#crprev').onclick = go(d.prev); if (d.next) $('#crnext').onclick = go(d.next);
    if ($('#crprac')) $('#crprac').onclick = () => showTab('practice');
    try {
      await loadYT();
      const dur0 = d.duration_sec || 0, start = (!d.completed && d.position_sec > 5 && (!dur0 || d.position_sec < dur0 - 10)) ? d.position_sec : 0;
      player = new YT.Player('crp', {
        host: 'https://www.youtube-nocookie.com', videoId: d.video_ref, width: '100%', height: '100%',
        playerVars: { start, rel: 0, modestbranding: 1, playsinline: 1, origin: location.origin },
        events: {
          onReady: () => { if (isAdmin) { const x = Math.floor(player.getDuration() || 0); if (x > 0 && !d.duration_sec) save(0, null).catch(() => { }); } },
          onStateChange: ev => {
            if (!window.YT) return;
            if (ev.data === YT.PlayerState.PLAYING) {
              if (!timers.length) timers.push(setInterval(async () => {
                try { const t = pos(), du = Math.floor(player.getDuration() || 0); await save(t, (!cur.completed && du > 60 && t / du >= 0.9) ? true : null); } catch (e) { }
              }, 15000));
            } else {
              timers.forEach(clearInterval); timers = [];
              if (ev.data === YT.PlayerState.ENDED) save(pos(), true).catch(() => { });
              else if (ev.data === YT.PlayerState.PAUSED) save(pos(), null).catch(() => { });
            }
          }
        }
      });
    } catch (e) { $('#crp').innerHTML = '<div style="display:flex;align-items:center;justify-content:center;color:#fff;text-align:center;padding:20px">The video player could not load. Check your internet connection and try again.</div>'; }
  };

  K.dashCard = async function () {
    try {
      const c = await rpc('continue_learning'); if (!c.length || !$('#lh')) return;
      const x = c[0];
      $('#lh').insertAdjacentHTML('afterbegin', `<div class="cr-cont"><div><b>Continue learning</b><div class="cr-m">${esc(x.course_title)}</div><div>${esc(x.lesson_title)}</div></div><button type="button" id="crdc">Resume lesson</button></div>`);
      $('#crdc').onclick = () => { LH.tab = 'courses'; try { sessionStorage.setItem('lhTab', 'courses'); } catch (e) { } tabs(); K.lesson(x.lesson_id); };
    } catch (e) { }
  };

  /* ================= Admin: Course Manager ================= */
  const M = { course: null };
  K.admin = async function () {
    ensureEM(); await stop(false);
    const z = $('#lh'); if (ROLE !== 'admin') { z.innerHTML = ''; return; }
    const list = await rpc('admin_course_list');
    z.innerHTML = `<div class="cr-warn"><b>About YouTube videos.</b> “Unlisted” videos are hidden from search, but anyone who has the link can watch them. MathLab only gives a video to enrolled students and never shows the link publicly, but this is <b>not</b> DRM or full protection: a student can still share the link or record the screen. The video provider is configurable, so a protected video host can be added later.</div>
    <div class="card"><h3>Courses</h3>${list.map(c => `<div class="cr-adm"><div class="cr-row" style="justify-content:space-between;margin:0"><div><b>${esc(c.title)}</b> <span class="cr-pill ${c.status === 'published' ? 'on' : 'off'}">${c.status}</span>
      <div class="cr-m">${c.chapters} chapters · ${c.lessons} lessons · ${c.students} enrolled${c.access_days ? ' · ' + c.access_days + ' days access' : ' · no expiry'}</div></div>
      <div class="cr-row" style="margin:0"><button type="button" data-content="${c.id}">Chapters &amp; lessons</button><button type="button" class="btn o" data-edit="${c.id}">Edit course</button></div></div></div>`).join('') || '<p class="ex">No courses yet.</p>'}
      <div class="cr-row"><button type="button" id="crnew">+ New course</button></div><div id="crform"></div></div>
    <div id="crcontent"></div>`;
    $('#crnew').onclick = () => courseForm(null);
    $$('[data-edit]').forEach(b => b.onclick = () => courseForm(list.find(c => c.id === b.dataset.edit)));
    $$('[data-content]').forEach(b => b.onclick = () => content(b.dataset.content, list.find(c => c.id === b.dataset.content)));
    if (M.course && list.find(c => c.id === M.course)) content(M.course, list.find(c => c.id === M.course));
  };

  function courseForm(c) {
    const f = $('#crform'); c = c || {};
    f.innerHTML = `<div class="cr-adm" style="margin-top:10px"><h4 style="margin:0 0 8px">${c.id ? 'Edit course' : 'New course'}</h4><div class="grid">
      <label>Course title<input id="cft" maxlength="150" value="${esc(c.title || '')}"></label>
      <label>Enrollment name <span class="cr-m">(must match exactly what you grant students)</span><input id="cfe" maxlength="150" value="${esc(c.enroll_name || '')}"></label>
      <label>Instructor<input id="cfi" maxlength="100" value="${esc(c.instructor || 'Taosif Sieam')}"></label><label>Duration text (e.g. 60+ hours)<input id="cfd" maxlength="60" value="${esc(c.duration_text || '')}"></label>
      <label>Default access (days, empty = no expiry)<input id="cfa" type="number" min="1" max="3650" value="${c.access_days || ''}"></label><label>Order number<input id="cfs" type="number" value="${c.sort ?? 100}"></label>
      <label>Status<select id="cfst"><option value="draft" ${c.status !== 'published' ? 'selected' : ''}>Draft (hidden from students)</option><option value="published" ${c.status === 'published' ? 'selected' : ''}>Published</option></select></label>
      <label>Thumbnail link (https://…) <input id="cfth" value="${esc(c.thumbnail_url || '')}"></label></div>
      <label>Or upload a thumbnail (PNG/JPG/WebP, up to 2 MB)<input type="file" id="cff" accept="image/png,image/jpeg,image/webp"></label>
      <label>Description<textarea id="cfde" rows="3" maxlength="2000">${esc(c.description || '')}</textarea></label><p class="err" id="cfe2"></p>
      <div class="cr-row"><button type="button" id="cfsave">Save course</button><button type="button" class="btn o" id="cfx">Close</button>${c.id && c.status !== 'published' ? '<button type="button" class="btn o" id="cfdel">Delete course</button>' : ''}</div></div>`;
    $('#cfx').onclick = () => f.innerHTML = '';
    $('#cfsave').onclick = async () => {
      const er = $('#cfe2'); er.textContent = ''; $('#cfsave').disabled = true;
      try {
        let th = $('#cfth').value.trim(); const file = $('#cff').files[0]; if (file) th = await uploadFig(file);
        const r = await rpc('admin_course_save', { p: { id: c.id || null, title: $('#cft').value, enroll_name: $('#cfe').value, instructor: $('#cfi').value, duration_text: $('#cfd').value, access_days: $('#cfa').value, sort: $('#cfs').value, status: $('#cfst').value, thumbnail_url: th, description: $('#cfde').value } });
        if (!r.ok) throw new Error(r.error); toast('Course saved.'); K.admin();
      } catch (e) { er.textContent = emsg(e); $('#cfsave').disabled = false; }
    };
    if ($('#cfdel')) $('#cfdel').onclick = async () => { if (!confirm('Delete this draft course and all its lessons?')) return; try { const r = await rpc('admin_cms_delete', { p_kind: 'course', p_id: c.id }); if (!r.ok) throw new Error(r.error); M.course = null; K.admin(); } catch (e) { $('#cfe2').textContent = emsg(e); } };
    f.scrollIntoView({ behavior: 'smooth' });
  }

  async function content(cid, course) {
    M.course = cid;
    const box = $('#crcontent'), chs = await rpc('admin_course_content', { p_course: cid });
    const pcOpts = '<option value="">No linked practice chapter</option>' + LH.chapters.map(x => `<option value="${x.id}">${esc(subName(x.subject_id))} · ${x.number}. ${esc(nm(x.title_bn, x.title_en))}</option>`).join('');
    box.innerHTML = `<div class="card" style="margin-top:14px"><h3>${esc(course.title)} – chapters &amp; lessons</h3>
      ${chs.map(ch => `<div class="cr-adm"><div class="cr-row" style="justify-content:space-between;margin:0"><b>${ch.number}. ${esc(cname(ch))}</b>
        <div class="cr-row" style="margin:0"><button type="button" class="btn o" data-ech="${ch.id}">Edit chapter</button><button type="button" class="btn o" data-dch="${ch.id}">Delete</button><button type="button" data-nl="${ch.id}">+ Lesson</button></div></div>
        ${ch.lessons.map(l => `<div class="cr-l" style="cursor:default"><span class="t">${esc(l.title)} <span class="cr-m">${esc(mins(l.duration_sec))}</span> ${l.is_free_preview ? '<span class="cr-pill free">Free preview</span>' : ''}${l.published ? '' : ' <span class="cr-pill off">Hidden</span>'}</span>
          <button type="button" class="btn o" data-el="${l.id}">Edit</button><button type="button" class="btn o" data-dl="${l.id}">Delete</button></div>`).join('')}</div>`).join('') || '<p class="ex">No chapters yet.</p>'}
      <div class="cr-row"><button type="button" id="crnch">+ New chapter</button></div><div id="crcf"></div></div>`;
    const reload = () => content(cid, course);
    const form = html => { $('#crcf').innerHTML = `<div class="cr-adm" style="margin-top:10px">${html}</div>`; $('#crcf').scrollIntoView({ behavior: 'smooth' }); };
    const chForm = ch => {
      ch = ch || {}; form(`<h4 style="margin:0 0 8px">${ch.id ? 'Edit chapter' : 'New chapter'}</h4><div class="grid"><label>Number<input id="chn" type="number" min="1" value="${ch.number || chs.length + 1}"></label>
        <label>Title (Bangla)<input id="chb" maxlength="150" value="${esc(ch.title_bn || '')}"></label><label>Title (English)<input id="che" maxlength="150" value="${esc(ch.title_en || '')}"></label>
        <label>Linked practice chapter<select id="chp">${pcOpts}</select></label></div><p class="err" id="cher"></p><div class="cr-row"><button type="button" id="chs">Save chapter</button><button type="button" class="btn o" id="chx">Close</button></div>`);
      $('#chp').value = ch.practice_chapter_id || ''; $('#chx').onclick = () => $('#crcf').innerHTML = '';
      $('#chs').onclick = async () => { try { const r = await rpc('admin_chapter_save', { p: { id: ch.id || null, course_id: cid, number: $('#chn').value, title_bn: $('#chb').value, title_en: $('#che').value, practice_chapter_id: $('#chp').value } }); if (!r.ok) throw new Error(r.error === 'duplicate' ? 'That chapter number already exists in this course.' : r.error); toast('Chapter saved.'); reload(); } catch (e) { $('#cher').textContent = emsg(e); } };
    };
    const lForm = (chid, l) => {
      l = l || {}; form(`<h4 style="margin:0 0 8px">${l.id ? 'Edit lesson' : 'New lesson'}</h4><div class="grid"><label>Lesson title<input id="clt" maxlength="200" value="${esc(l.title || '')}"></label>
        <label>YouTube link<input id="clv" placeholder="https://youtu.be/…" value="${l.video_ref ? 'https://youtu.be/' + esc(l.video_ref) : ''}"></label>
        <label>Length in minutes <span class="cr-m">(auto-filled when you play it once)</span><input id="cld" type="number" min="1" step="0.5" value="${l.duration_sec ? Math.round(l.duration_sec / 6) / 10 : ''}"></label>
        <label>Order number<input id="cls" type="number" value="${l.sort ?? 1}"></label></div>
        <label>Description<textarea id="clde" rows="3" maxlength="2000">${esc(l.description || '')}</textarea></label>
        <label>PDF notes / links, one per line: <code>Title | https://link</code><textarea id="clr" rows="3">${(l.resources || []).map(r => esc(r.title + ' | ' + r.url)).join('\n')}</textarea></label>
        <div class="cr-row"><label><input type="checkbox" id="clf" ${l.is_free_preview ? 'checked' : ''}> Free preview (anyone logged in can watch)</label><label><input type="checkbox" id="clp" ${l.published === false ? '' : 'checked'}> Published</label></div>
        <p class="err" id="cler"></p><div class="cr-row"><button type="button" id="clsv">Save lesson</button><button type="button" class="btn o" id="clx">Close</button></div>`);
      $('#clx').onclick = () => $('#crcf').innerHTML = '';
      $('#clsv').onclick = async () => {
        const res = $('#clr').value.split('\n').map(s => s.split('|')).filter(a => a.length >= 2).map(a => ({ title: a[0].trim(), url: a.slice(1).join('|').trim() }));
        try { const r = await rpc('admin_lesson_save', { p: { id: l.id || null, chapter_id: chid, title: $('#clt').value, video: $('#clv').value, duration_min: $('#cld').value, sort: $('#cls').value, description: $('#clde').value, resources: res, is_free_preview: $('#clf').checked, published: $('#clp').checked } }); if (!r.ok) throw new Error(r.error); toast('Lesson saved.'); reload(); } catch (e) { $('#cler').textContent = emsg(e); }
      };
    };
    $('#crnch').onclick = () => chForm(null);
    $$('[data-ech]').forEach(b => b.onclick = () => chForm(chs.find(x => x.id === b.dataset.ech)));
    $$('[data-nl]').forEach(b => b.onclick = () => lForm(b.dataset.nl, null));
    $$('[data-el]').forEach(b => b.onclick = () => { const ch = chs.find(c => c.lessons.some(l => l.id === b.dataset.el)); lForm(ch.id, ch.lessons.find(l => l.id === b.dataset.el)); });
    const del = (kind, id, msg) => async () => { if (!confirm(msg)) return; try { const r = await rpc('admin_cms_delete', { p_kind: kind, p_id: id }); if (!r.ok) throw new Error(r.error); reload(); } catch (e) { toast(emsg(e)); } };
    $$('[data-dch]').forEach(b => b.onclick = del('chapter', b.dataset.dch, 'Delete this chapter and all its lessons? Students’ progress on them is removed too.'));
    $$('[data-dl]').forEach(b => b.onclick = del('lesson', b.dataset.dl, 'Delete this lesson?'));
  }
})();
