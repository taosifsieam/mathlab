/* MathLab Phase 3 – XP, levels, badges, Daily Challenge extras, National and Course leaderboards, and the Gamification admin screen.
   Loaded before the main script. Uses page globals: $, $$, esc, rpc, sb, emsg, EM, ROLE, LH, toast, fmt, subName, showTab.
   All XP, ranks and badges are decided by the server (supabase-phase3-gamification.sql); this file only displays what the server returns. */
(function () {
  'use strict';
  const K = window.MLGame = {};
  let timers = [];

  const css = document.createElement('style');
  css.textContent = `
.gm-hero{display:flex;gap:16px;align-items:center;flex-wrap:wrap;border:1px solid var(--bd);border-radius:16px;padding:16px;background:linear-gradient(135deg,rgba(124,58,237,.14),rgba(11,99,206,.12))}
.gm-lv{width:76px;height:76px;border-radius:50%;display:grid;place-items:center;flex:none;background:linear-gradient(135deg,#7c3aed,#0b63ce);color:#fff;text-align:center;line-height:1}.gm-lv b{font-size:28px;display:block}.gm-lv span{font-size:11px;letter-spacing:.06em}
.gm-hero .gm-m{flex:1;min-width:200px}.gm-bar{height:10px;border-radius:99px;background:#dbe6fb;overflow:hidden;margin:8px 0 4px}.gm-bar i{display:block;height:100%;background:linear-gradient(90deg,#7c3aed,#22c55e);border-radius:99px;transition:width .5s}
.gm-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px;margin:12px 0}.gm-st{border:1px solid var(--bd);border-radius:14px;padding:12px;text-align:center;background:rgba(255,255,255,.92)}.gm-st b{display:block;font-size:24px;color:var(--navy)}.gm-st span{font-size:13px;color:var(--mut)}
.gm-bg{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:12px}.gm-b{border:1px solid var(--bd);border-radius:14px;padding:14px;text-align:center;background:rgba(255,255,255,.92)}.gm-b .i{font-size:38px;line-height:1.1}.gm-b h4{margin:6px 0 2px}.gm-b p{font-size:13px;margin:4px 0;color:var(--mut)}
.gm-b.lock{opacity:.55;filter:grayscale(1)}.gm-r{display:inline-block;font-size:11px;font-weight:700;padding:2px 9px;border-radius:99px;text-transform:uppercase;letter-spacing:.04em}
.gm-r.common{background:#e2e8f0;color:#334155}.gm-r.rare{background:#dbeafe;color:#1d4ed8}.gm-r.epic{background:#ede9fe;color:#6d28d9}.gm-r.legendary{background:#fef3c7;color:#b45309}
.gm-row{display:flex;gap:10px;align-items:center;border:1px solid var(--bd);border-radius:12px;padding:9px 12px;margin-bottom:8px;background:rgba(255,255,255,.92)}.gm-row.me{border-color:#7c3aed;box-shadow:0 0 0 2px rgba(124,58,237,.25)}
.gm-rk{width:38px;text-align:center;font-weight:800;font-size:17px;flex:none}.gm-nm{flex:1;min-width:0;overflow-wrap:anywhere}.gm-nm small{display:block;color:var(--mut);font-size:12px}.gm-sc{font-weight:800;text-align:right;flex:none}.gm-sc small{display:block;font-weight:400;color:var(--mut);font-size:11px}
.gm-av{width:34px;height:34px;border-radius:50%;background:linear-gradient(135deg,#0b63ce,#7c3aed);color:#fff;display:grid;place-items:center;font-weight:700;flex:none;font-size:14px}
.gm-f{display:flex;gap:10px;flex-wrap:wrap;margin:10px 0}.gm-f label{display:flex;flex-direction:column;gap:3px;font-size:13px;font-weight:600}
.gm-h{display:flex;justify-content:space-between;gap:8px;padding:7px 0;border-top:1px solid var(--bd);font-size:14px}.gm-h b{color:#16a34a;white-space:nowrap}.gm-h b.neg{color:#dc2626}
.gm-sub{display:flex;gap:8px;margin:10px 0;flex-wrap:wrap}.gm-sub button{border-radius:99px}.gm-sub button.on{background:var(--navy,#0a1838);color:#fff}
.gm-cd{font-variant-numeric:tabular-nums;font-weight:800}.gm-adm{border:1px solid var(--bd);border-radius:12px;padding:10px 12px;margin-bottom:8px;background:rgba(255,255,255,.92)}
.tabs button[data-t=xp]{--tc:#7c3aed}.tabs button[data-t=lb]{--tc:#f59e0b;--tt:#3b2300}.tabs button[data-t=gadmin]{--tc:#db2777}
html[data-theme=dark] .gm-st,html[data-theme=dark] .gm-b,html[data-theme=dark] .gm-row,html[data-theme=dark] .gm-adm{background:#0e162a}html[data-theme=dark] .gm-bar{background:#24365f}
html[data-theme=dark] .gm-r.common{background:#1e293b;color:#cbd5e1}html[data-theme=dark] .gm-r.rare{background:#1e3a8a;color:#bfdbfe}html[data-theme=dark] .gm-r.epic{background:#4c1d95;color:#ddd6fe}html[data-theme=dark] .gm-r.legendary{background:#78350f;color:#fde68a}
`;
  document.head.appendChild(css);

  let emDone = false;
  const ensureEM = () => {
    if (emDone) return; emDone = true;
    Object.assign(EM, {
      value_invalid: 'Please enter a valid number (0 or more).', setting_not_found: 'That setting does not exist.', badge_invalid: 'Please check the badge details (id uses a-z, 0-9 and _ only).',
      student_not_found: 'No student with that email was found.', adjust_invalid: 'Enter an XP amount (not 0, at most 10000) and a reason of at least 3 letters.',
      daily_has_submissions: 'Students have already answered this challenge, so it cannot be removed.', daily_not_deletable: 'Only future challenges can be removed.',
      bad_month: 'That month is not available.', bad_period: 'That period is not available.', bad_category: 'That category is not available.'
    });
  };
  K.leave = () => { timers.forEach(clearInterval); timers = []; };

  const EV = { daily_complete: 'Daily Challenge completed', daily_perfect: 'Correct Daily Challenge answer', exam_complete: 'Exam completed', exam_score_80: 'Scored 80% or more', exam_score_90: 'Scored 90% or more', streak_7: '7-day learning streak', admin_adjust: 'Adjustment by MathLab' };
  const RARE = { common: 'Common', rare: 'Rare', epic: 'Epic', legendary: 'Legendary' };
  const MED = ['🥇', '🥈', '🥉'];
  const ini = n => esc(String(n || '?').trim().charAt(0).toUpperCase());
  const num = n => Number(n || 0).toLocaleString('en-US');
  const bar = p => `<div class="gm-bar"><i style="width:${Math.max(0, Math.min(100, p || 0))}%"></i></div>`;
  const monthName = m => { try { const [y, mo] = m.split('-').map(Number); return new Date(Date.UTC(y, mo - 1, 1)).toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }); } catch (e) { return m; } };

  /* ================= Student: XP & Badges ================= */
  K.xp = async function () {
    ensureEM(); K.leave();
    const z = $('#lh'), d = await rpc('my_gamification'), lv = d.level, st = d.streaks;
    const earned = d.badges.filter(b => b.earned_at).length;
    z.innerHTML = `<div class="gm-hero"><div class="gm-lv"><div><span>LEVEL</span><b>${lv.level}</b></div></div><div class="gm-m"><b style="font-size:22px">${num(d.total_xp)} XP</b>${bar(lv.progress_pct)}<div class="ex">${num(lv.next_xp - d.total_xp)} XP to Level ${lv.level + 1}</div></div></div>
<div class="gm-grid"><div class="gm-st"><b>${num(d.today_xp)}${d.daily_cap > 0 ? ' / ' + num(d.daily_cap) : ''}</b><span>XP today</span></div><div class="gm-st"><b>${num(d.month_xp)}</b><span>XP this month</span></div>
<div class="gm-st"><b>${st.current} 🔥</b><span>Day streak (best ${st.best})</span></div><div class="gm-st"><b>${st.weekly_current}</b><span>Week streak (best ${st.weekly_best})</span></div></div>
<div class="card"><h3>Badges <span class="ex">${earned} of ${d.badges.length} earned</span></h3><div class="gm-bg">${d.badges.map(b => `<div class="gm-b ${b.earned_at ? '' : 'lock'}"><div class="i">${esc(b.icon)}</div><h4>${esc(b.name)}</h4><span class="gm-r ${esc(b.rarity)}">${RARE[b.rarity] || ''}</span><p>${esc(b.description)}</p><p>${b.earned_at ? 'Earned ' + esc(fmt(b.earned_at)) : 'Locked'}</p></div>`).join('')}</div></div>
<div class="card" style="margin-top:14px"><h3>Reward history</h3>${d.history.length ? d.history.map(h => `<div class="gm-h"><span>${esc(EV[h.event] || h.event)}${h.meta && h.meta.reason ? ' · ' + esc(h.meta.reason) : ''}<br><small class="ex">${esc(fmt(h.at))}</small></span><b class="${h.xp < 0 ? 'neg' : ''}">${h.xp > 0 ? '+' : ''}${h.xp} XP</b></div>`).join('') : '<p class="ex">No XP yet. Answer the Daily Challenge or finish an exam to start earning.</p>'}
<p class="ex">XP is added by the server only, once per activity. Practice is free of XP so it cannot be farmed; exams give XP on your first attempt of each exam.</p></div>
<div class="card" style="margin-top:14px"><label style="display:flex;gap:8px;align-items:center"><input type="checkbox" id="gmvis" ${d.leaderboard_visible ? 'checked' : ''}> Show me on leaderboards (as first name and last initial)</label></div>`;
    $('#gmvis').onchange = async e => { try { await rpc('set_leaderboard_visible', { p_visible: e.target.checked }); toast(e.target.checked ? 'You are visible on leaderboards.' : 'You are hidden from leaderboards.'); } catch (x) { toast(emsg(x)); e.target.checked = !e.target.checked; } };
  };

  /* ================= Student: Leaderboards ================= */
  const G = { mode: 'national', period: 'monthly', cat: 'all', month: '', course: '', cmonth: '', off: 0 };
  K.board = async function () {
    ensureEM(); K.leave();
    const z = $('#lh');
    z.innerHTML = `<div class="gm-sub"><button type="button" class="btn ${G.mode === 'national' ? 'on' : 'o'}" data-m="national">National</button><button type="button" class="btn ${G.mode === 'course' ? 'on' : 'o'}" data-m="course">My course</button></div><div id="gmb"><p class="ex">Loading…</p></div>`;
    $$('.gm-sub [data-m]').forEach(b => b.onclick = () => { G.mode = b.dataset.m; K.board(); });
    try { await (G.mode === 'national' ? national() : course()); } catch (e) { $('#gmb').innerHTML = '<p class="err">' + esc(emsg(e)) + '</p>'; }
  };

  async function national(append) {
    const z = $('#gmb'), off = append ? G.off : 0;
    const r = await rpc('leaderboard_national', { p_period: G.period, p_category: G.cat, p_month: G.period === 'monthly' && G.month ? G.month : null, p_limit: 25, p_offset: off });
    G.off = off + r.rows.length;
    const rowHtml = r.rows.map(x => `<div class="gm-row ${x.me ? 'me' : ''}"><div class="gm-rk">${MED[x.rank - 1] || x.rank}</div><div class="gm-av">${ini(x.name)}</div><div class="gm-nm">${esc(x.name)}${x.me ? ' (you)' : ''}<small>Level ${x.level}${x.badges.length ? ' · ' + x.badges.map(esc).join(' ') : ''}${x.badge_count > 3 ? ' +' + (x.badge_count - 3) : ''}</small></div><div class="gm-sc">${num(x.xp)}<small>XP</small></div></div>`).join('');
    if (append) { $('#gmlist').insertAdjacentHTML('beforeend', rowHtml); }
    else {
      const months = r.months.length ? r.months : [r.month || ''];
      z.innerHTML = `<div class="card"><div class="gm-f"><label>Period<select id="gp"><option value="daily">Today</option><option value="weekly">This week</option><option value="monthly">Month</option><option value="all">All time</option></select></label>
<label>Category<select id="gc"><option value="all">All XP</option><option value="daily">Daily Challenge</option><option value="exam">Exams</option><option value="streak">Streaks</option></select></label>
${G.period === 'monthly' ? `<label>Month<select id="gm">${months.map(m => `<option value="${esc(m)}">${esc(monthName(m))}</option>`).join('')}</select></label>` : ''}</div>
<p class="ex">Ranked by verified XP. Ties go to the student who reached that XP first. Days, weeks and months follow Bangladesh time.</p></div>
<div id="gmme" style="margin-top:12px"></div><div id="gmlist" style="margin-top:12px">${rowHtml}</div><div id="gmmore"></div>`;
      $('#gp').value = G.period; $('#gc').value = G.cat; if ($('#gm')) $('#gm').value = r.month;
      $('#gp').onchange = e => { G.period = e.target.value; G.off = 0; if (G.period !== 'monthly') G.month = ''; K.board(); };
      $('#gc').onchange = e => { G.cat = e.target.value; G.off = 0; K.board(); };
      if ($('#gm')) $('#gm').onchange = e => { G.month = e.target.value; G.off = 0; K.board(); };
      $('#gmme').innerHTML = r.me ? `<div class="gm-hero" style="padding:12px"><b>Your rank: #${r.me.rank}</b><span>${num(r.me.xp)} XP</span><span class="ex">of ${r.total} students</span></div>` : `<div class="card"><p class="ex">You have no XP in this view yet${r.total ? '' : ', and nobody else has either'}. Answer the Daily Challenge or finish an exam to appear here.</p></div>`;
      if (!r.rows.length) $('#gmlist').innerHTML = '<div class="card"><p class="ex">No one has earned XP in this view yet.</p></div>';
    }
    const more = $('#gmmore'); more.innerHTML = G.off < r.total ? '<button type="button" class="btn o" id="gmlm">Show more</button>' : '';
    if ($('#gmlm')) $('#gmlm').onclick = async () => { try { await national(true); } catch (e) { toast(emsg(e)); } };
  }

  async function course() {
    const z = $('#gmb'), cs = await rpc('my_lb_courses');
    if (!cs.length) { z.innerHTML = '<div class="card"><b>Course leaderboards are for enrolled students.</b><p class="ex">Enroll in a course to compete in its monthly leaderboard. Your national rank is always available in the National tab.</p></div>'; return; }
    if (!cs.some(c => c.id === G.course)) G.course = cs[0].id;
    let r;
    try { r = await rpc('leaderboard_course', { p_course: G.course, p_month: G.cmonth || null }); }
    catch (e) { if (String(e.message || '').includes('not_enrolled')) { z.innerHTML = '<div class="card"><p class="err">You need an active enrollment in this course to see its leaderboard.</p></div>'; return; } throw e; }
    const hist = await rpc('my_course_history', { p_course: G.course });
    z.innerHTML = `<div class="card"><div class="gm-f"><label>Course<select id="gcs">${cs.map(c => `<option value="${esc(c.id)}">${esc(c.title)}</option>`).join('')}</select></label>
<label>Month<select id="gcm">${r.months.map(m => `<option value="${esc(m)}">${esc(monthName(m))}</option>`).join('')}</select></label></div>
<p class="ex">Only enrolled students compete. Rank comes from your <b>first attempt of each exam</b> this month: chapter tests, model tests, accuracy and consistency (weights set by MathLab), adjusted so students with different numbers of exams are compared fairly. You need at least ${r.min_exams} exams in the month to be ranked. Ties go to higher accuracy, then more exams, then who started earlier.</p></div>
<div style="margin-top:12px">${r.me ? `<div class="gm-hero" style="padding:12px"><b>Your rank: #${r.me.rank}</b><span>Score ${r.me.score}</span><span class="ex">of ${r.total} ranked</span></div>` : `<div class="card"><p class="ex">You are not ranked yet for ${esc(monthName(r.month))}. You have taken ${r.my_exams} of the ${r.min_exams} exams needed this month.</p></div>`}</div>
<div style="margin-top:12px">${r.rows.length ? r.rows.map(x => `<div class="gm-row ${x.me ? 'me' : ''}"><div class="gm-rk">${MED[x.rank - 1] || x.rank}</div><div class="gm-av">${ini(x.name)}</div><div class="gm-nm">${esc(x.name)}${x.me ? ' (you)' : ''}<small>${x.exams} exams · accuracy ${x.accuracy == null ? '-' : x.accuracy + '%'}</small></div><div class="gm-sc">${x.score}<small>score</small></div></div>`).join('') : '<div class="card"><p class="ex">Nobody is ranked for this course and month yet.</p></div>'}</div>
${hist.length ? `<div class="card" style="margin-top:12px"><h3>My previous months</h3>${hist.map(h => `<div class="gm-h"><span>${esc(monthName(h.month))}</span><b>#${h.rank} of ${h.of} · score ${h.score}</b></div>`).join('')}</div>` : ''}`;
    $('#gcs').value = G.course; $('#gcm').value = r.month;
    $('#gcs').onchange = e => { G.course = e.target.value; G.cmonth = ''; K.board(); };
    $('#gcm').onchange = e => { G.cmonth = e.target.value; K.board(); };
  }

  /* ================= Daily Challenge extras (appended under the existing question) ================= */
  K.dailyExtra = async function (z) {
    try {
      ensureEM();
      const d = await rpc('daily_extras'); if (!d.challenge || !z) return;
      const diff = ['', 'Easy', 'Medium', 'Hard'][d.difficulty] || 'Medium', off = new Date(d.server_now).getTime() - Date.now(), end = new Date(d.ends_at).getTime();
      z.insertAdjacentHTML('beforeend', `<div class="card" style="margin-top:12px"><span class="tag">${diff}</span> <span class="tag">+${d.xp_complete} XP for answering</span> <span class="tag">+${d.xp_perfect} XP more if correct</span>
<p style="margin:8px 0">Time left to answer today: <span class="gm-cd" id="gmcd">--:--:--</span> <span class="ex">(new challenge at midnight, Bangladesh time)</span></p>
${d.xp_earned ? `<p><b>You earned ${d.xp_earned} XP from this challenge.</b></p>` : ''}</div>
<div class="card" style="margin-top:12px"><h3>Fastest correct answers today</h3>${d.leaderboard ? (d.leaderboard.length ? d.leaderboard.map(x => `<div class="gm-row ${x.me ? 'me' : ''}"><div class="gm-rk">${MED[x.rank - 1] || x.rank}</div><div class="gm-av">${ini(x.name)}</div><div class="gm-nm">${esc(x.name)}${x.me ? ' (you)' : ''}</div><div class="gm-sc"><small>${esc(new Date(x.at).toLocaleTimeString('en-GB', { timeZone: 'Asia/Dhaka', hour: '2-digit', minute: '2-digit' }))}</small></div></div>`).join('') : '<p class="ex">No correct answers yet.</p>') + `<p class="ex">${d.correct_total} correct so far. Ranked by who answered correctly first.</p>` : '<p class="ex">Answer today\'s question to see the leaderboard.</p>'}</div>`);
      const tick = () => { const el = $('#gmcd'); if (!el) return; const s = Math.max(0, Math.floor((end - (Date.now() + off)) / 1000)); el.textContent = [Math.floor(s / 3600), Math.floor(s % 3600 / 60), s % 60].map(n => String(n).padStart(2, '0')).join(':'); };
      tick(); timers.push(setInterval(tick, 1000));
    } catch (e) { }
  };

  /* ================= Dashboard strip ================= */
  K.dashCard = async function () {
    try {
      const d = await rpc('my_gamification'); if (!$('#lh')) return;
      $('#lh').insertAdjacentHTML('afterbegin', `<div class="gm-hero" style="margin-bottom:14px"><div class="gm-lv"><div><span>LEVEL</span><b>${d.level.level}</b></div></div><div class="gm-m"><b>${num(d.total_xp)} XP</b> · ${d.streaks.current} day streak 🔥${bar(d.level.progress_pct)}<div class="ex">${d.badges.filter(b => b.earned_at).length} badges earned</div></div><div><button type="button" id="gmgo">XP &amp; Badges</button> <button type="button" class="btn o" id="gmlb">Leaderboard</button></div></div>`);
      $('#gmgo').onclick = () => showTab('xp'); $('#gmlb').onclick = () => showTab('lb');
    } catch (e) { }
  };

  /* ================= Admin ================= */
  const RT = [['activities', 'Total activities (practice answers + exams)'], ['streak_days', 'Best streak (days)'], ['xp_total', 'Total XP'], ['perfect_exam', 'Perfect exam score'], ['accuracy', 'Accuracy % (100+ answers)'],
    ['speed_exam', 'Fast 80%+ exam (10+ questions)'], ['chapters_strong', 'Chapters with 80% accuracy'], ['chapters_practiced', 'Chapters practiced'], ['top_rank', 'National monthly rank (top N)'], ['manual', 'Manual only (awarded by admin)']];
  K.admin = async function () {
    ensureEM(); K.leave();
    const z = $('#lh'); if (ROLE !== 'admin') { z.innerHTML = ''; return; }
    const [st, bd, lc, dl] = await Promise.all([rpc('admin_xp_settings'), rpc('admin_list_badges'), rpc('admin_lb_courses'), rpc('admin_list_daily')]);
    let subs = LH.subjects && LH.subjects.length ? LH.subjects : ((await sb.from('subjects').select('*')).data || []);
    const GRP = { xp: 'XP rewards', limits: 'Limits and anti-abuse', leaderboard: 'Course leaderboard scoring' };
    const prev = new Date(Date.now() + 6 * 3600e3); prev.setUTCMonth(prev.getUTCMonth() - 1); const pm = prev.toISOString().slice(0, 7);
    z.innerHTML = `<div class="card"><h3>XP rules</h3><p class="ex">Changes apply to future activity only. Past XP is never rewritten.</p>${Object.keys(GRP).map(g => `<h4>${GRP[g]}</h4>${st.filter(s => s.grp === g).map(s => `<div class="gm-adm" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:200px">${esc(s.label)}</span><input type="number" min="0" step="any" value="${s.value}" data-k="${esc(s.key)}" style="width:110px"><button type="button" class="btn o" data-sk="${esc(s.key)}">Save</button></div>`).join('')}`).join('')}</div>
<div class="card" style="margin-top:14px"><h3>Badges</h3>${bd.map(b => `<div class="gm-adm" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span style="font-size:26px">${esc(b.icon)}</span><span style="flex:1;min-width:180px"><b>${esc(b.name)}</b> <span class="gm-r ${esc(b.rarity)}">${esc(b.rarity)}</span> ${b.active ? '' : '<span class="tag">Off</span>'}<br><small class="ex">${esc(b.rule_type)} ${b.rule_value} · ${b.earned} earned</small></span><button type="button" class="btn o" data-eb="${esc(b.id)}">Edit</button></div>`).join('')}
<h4 id="gbh">Add or edit a badge</h4><div class="grid"><label>Id (a-z, 0-9, _)<input id="gb_id" maxlength="40"></label><label>Name<input id="gb_n" maxlength="60"></label><label>Icon (emoji)<input id="gb_i" maxlength="8" value="🏅"></label>
<label>Rarity<select id="gb_r"><option>common</option><option>rare</option><option>epic</option><option>legendary</option></select></label><label>Unlock rule<select id="gb_t">${RT.map(r => `<option value="${r[0]}">${esc(r[1])}</option>`).join('')}</select></label><label>Rule value<input id="gb_v" type="number" min="0" value="1"></label>
<label>Show order<input id="gb_s" type="number" value="100"></label><label>Active<select id="gb_a"><option value="true">Yes</option><option value="false">No</option></select></label></div><label>Description<textarea id="gb_d" rows="2" maxlength="300"></textarea></label><p class="err" id="gb_e"></p><button type="button" id="gb_save">Save badge</button></div>
<div class="card" style="margin-top:14px"><h3>Award a badge or correct XP</h3><div class="grid"><label>Student email<input id="ga_e" type="email"></label><label>Badge<select id="ga_b">${bd.map(b => `<option value="${esc(b.id)}">${esc(b.icon + ' ' + b.name)}</option>`).join('')}</select></label></div><button type="button" id="ga_go">Award badge</button>
<div class="grid" style="margin-top:12px"><label>Student email<input id="gx_e" type="email"></label><label>XP (negative to remove)<input id="gx_x" type="number"></label><label>Reason<input id="gx_r" maxlength="120"></label></div><p class="err" id="gx_er"></p><button type="button" id="gx_go">Add correction to ledger</button><p class="ex">Corrections are added as new ledger rows with your reason; nothing is edited or deleted.</p></div>
<div class="card" style="margin-top:14px"><h3>Course leaderboards</h3><p class="ex">Choose which exams count for each course. Leave Subject and Batch on “All” for a combo course.</p>${lc.map(c => `<div class="gm-adm" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:200px"><b>${esc(c.title)}</b></span><select data-cs="${esc(c.id)}"><option value="">All subjects</option>${subs.map(s => `<option value="${esc(s.id)}" ${c.subject_id === s.id ? 'selected' : ''}>${esc(s.name_en || s.name_bn)}</option>`).join('')}</select><select data-cb="${esc(c.id)}"><option value="">All batches</option><option ${c.batch === 'SSC 2027' ? 'selected' : ''}>SSC 2027</option><option ${c.batch === 'SSC 2028' ? 'selected' : ''}>SSC 2028</option></select><button type="button" class="btn o" data-cl="${esc(c.id)}">Save</button></div>`).join('') || '<p class="ex">No courses yet.</p>'}
<div class="gm-f"><label>Freeze a finished month (YYYY-MM)<input id="gcl_m" value="${pm}" maxlength="7"></label><button type="button" id="gcl_go" class="btn o">Freeze rankings</button></div><p class="ex">A month is also frozen automatically the first time a student opens it after it ends.</p></div>
<div class="card" style="margin-top:14px"><h3>Daily Challenges</h3>${dl.length ? dl.map(c => `<div class="gm-adm" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:200px"><b>${esc(c.date)}</b>${c.batch ? ' · ' + esc(c.batch) : ''} · ${['', 'Easy', 'Medium', 'Hard'][c.difficulty] || ''}<br><small class="ex">${esc(c.question)} · ${c.participants} answered, ${c.correct} correct</small></span>${c.participants ? '' : `<button type="button" class="btn o" data-dd="${c.id}">Remove</button>`}</div>`).join('') : '<p class="ex">No challenges scheduled. Schedule one from the Admin tab.</p>'}</div>`;
    const err = (id, x) => { $('#' + id).textContent = x ? (typeof x === 'string' ? x : emsg(x)) : ''; };
    $$('#lh [data-sk]').forEach(b => b.onclick = async () => { try { const r = await rpc('admin_set_xp_setting', { p_key: b.dataset.sk, p_value: +$(`[data-k="${b.dataset.sk}"]`).value }); toast(r.ok ? 'Saved' : (EM[r.error] || r.error)); } catch (x) { toast(emsg(x)); } });
    $$('#lh [data-eb]').forEach(b => b.onclick = () => { const x = bd.find(y => y.id === b.dataset.eb); $('#gb_id').value = x.id; $('#gb_n').value = x.name; $('#gb_i').value = x.icon; $('#gb_r').value = x.rarity; $('#gb_t').value = x.rule_type; $('#gb_v').value = x.rule_value; $('#gb_s').value = x.sort; $('#gb_a').value = String(x.active); $('#gb_d').value = x.description; $('#gbh').scrollIntoView({ behavior: 'smooth' }); });
    $('#gb_save').onclick = async () => { err('gb_e', ''); try { const r = await rpc('admin_save_badge', { p: { id: $('#gb_id').value.trim(), name: $('#gb_n').value, description: $('#gb_d').value, icon: $('#gb_i').value, rarity: $('#gb_r').value, rule_type: $('#gb_t').value, rule_value: +$('#gb_v').value, sort: +$('#gb_s').value, active: $('#gb_a').value === 'true' } }); if (!r.ok) return err('gb_e', EM[r.error] || r.error); toast('Badge saved'); K.admin(); } catch (x) { err('gb_e', x); } };
    $('#ga_go').onclick = async () => { try { const r = await rpc('admin_award_badge', { p_email: $('#ga_e').value, p_badge: $('#ga_b').value }); toast(r.ok ? 'Badge awarded' : (EM[r.error] || r.error)); } catch (x) { toast(emsg(x)); } };
    $('#gx_go').onclick = async () => { err('gx_er', ''); try { const r = await rpc('admin_adjust_xp', { p_email: $('#gx_e').value, p_xp: +$('#gx_x').value, p_reason: $('#gx_r').value }); if (!r.ok) return err('gx_er', EM[r.error] || r.error); toast('XP correction recorded'); } catch (x) { err('gx_er', x); } };
    $$('#lh [data-cl]').forEach(b => b.onclick = async () => { try { const r = await rpc('admin_course_lb_set', { p_course: b.dataset.cl, p_subject: $(`[data-cs="${b.dataset.cl}"]`).value, p_batch: $(`[data-cb="${b.dataset.cl}"]`).value }); toast(r.ok ? 'Saved' : (EM[r.error] || r.error)); } catch (x) { toast(emsg(x)); } });
    $('#gcl_go').onclick = async () => { try { const r = await rpc('admin_close_month', { p_month: $('#gcl_m').value.trim() }); toast(r.ok ? 'Frozen for ' + r.courses + ' course(s)' : (EM[r.error] || r.error)); } catch (x) { toast(emsg(x)); } };
    $$('#lh [data-dd]').forEach(b => b.onclick = async () => { try { const r = await rpc('admin_delete_daily', { p_id: +b.dataset.dd }); if (!r.ok) toast(EM[r.error] || r.error); K.admin(); } catch (x) { toast(emsg(x)); } });
  };
})();
