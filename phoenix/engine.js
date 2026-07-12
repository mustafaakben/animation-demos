// THE PHOENIX BRIEF — engine 2.0 (voiced scene videos + designed evidence, phone-first)
import { SCENES, EVIDENCE, CHARACTERS, ENDINGS, CAPACITIES, FX_MAX, COPY } from './scenes.js';

const $ = id => document.getElementById(id);
const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const params = new URLSearchParams(location.search);

const state = {
  sceneId: null,
  queue: [], lineIdx: 0,
  flags: {},
  fx: { judgment: 0, curiosity: 0, ethics: 0, empathy: 0 },
  timeSpent: 0,
  unlocked: [],
  opened: new Set(),
  hotspotsFound: new Set(),
  clock: 8 * 60 + 10,
  muted: false,
  audio: null,
  choicesShowing: false,
  log: [],
  // video 2.0
  manifest: null,
  videoDisabled: params.has('novideo'),
  lite: params.has('novideo'),
  mode: null,            // 'video' | 'tap' | null
  awaitingAnswer: false,
  drawerReturn: 'choices',
  vidWatchdog: null,
};

/* variant resolvers mirror the manifest's flag contexts */
const VARIANT = {
  s5b: f => f.statCaught ? 'caught' : 'missed',
  s9:  f => f.statCaught ? 'caught' : 'missed',
  s10b:f => f.lateMiss   ? 'late'   : 'ontime',
};
function resolveVideo(sceneId) {
  if (!state.manifest) return null;
  const variant = VARIANT[sceneId] ? VARIANT[sceneId](state.flags) : null;
  return state.manifest.videos.find(v => v.sceneId === sceneId && v.variant === variant) || null;
}

/* ─────────────── helpers ─────────────── */
const flagPass = l => (!l.if || state.flags[l.if]) && (!l.ifNot || !state.flags[l.ifNot]);
const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const clockStr = () => {
  const h = Math.floor(state.clock / 60), m = state.clock % 60;
  return `${((h - 1) % 12) + 1}:${String(m).padStart(2, '0')}`;
};
const unreadKeys = () => state.unlocked.filter(k => !state.opened.has(k));

function updateHUD() {
  $('clock').textContent = clockStr();
  $('evCount').textContent = state.unlocked.length;
  const nUnread = unreadKeys().length;
  $('evBtn').classList.toggle('radiate', nUnread > 0);
  const badge = $('evNew');
  badge.textContent = nUnread;
  badge.classList.toggle('show', nUnread > 0);
  $('muteBtn').textContent = state.muted ? '𝄽' : '♪';
}

/* ─────────────── fallback audio (tap-through mode) ─────────────── */
function playLine(id) {
  stopAudio();
  if (state.muted) return;
  try { const a = new Audio(`audio/${id}.mp3`); a.play().catch(() => {}); state.audio = a; $('btnPause').textContent = '⏸'; }
  catch (e) {}
}
function stopAudio() { if (state.audio) { try { state.audio.pause(); } catch (e) {} state.audio = null; } }

/* ─────────────── background ─────────────── */
let bgCurrent = '';
function setBg(src) {
  if (src === bgCurrent) return;
  bgCurrent = src;
  const bg = $('bg'), bg2 = $('bg2');
  bg2.src = src; bg2.style.opacity = 1;
  setTimeout(() => { bg.src = src; bg2.style.opacity = 0; }, 1000);
}

/* ═══════════════ scene entry & dispatch ═══════════════ */
function startScene(id) {
  const scene = SCENES[id];
  state.sceneId = id;
  state.choicesShowing = false;
  state.awaitingAnswer = false;
  if (scene.isDebrief) { showDebrief(); return; }
  // scene-level skip (e.g. s4b when the photo was used blindly)
  if (scene.skipIf && state.flags[scene.skipIf.flag]) { startScene(scene.skipIf.to); return; }
  state.clock += 10;
  setBg(scene.bg);
  $('sceneTitle').textContent = scene.title.toUpperCase();
  // unlock evidence (radiate for the new ones)
  for (const k of scene.evidence || []) if (!state.unlocked.includes(k)) state.unlocked.push(k);
  updateHUD();
  hideChoices();
  hideInvite();

  const video = (state.lite || state.videoDisabled) ? null : resolveVideo(id);
  if (video) playSceneVideo(video, scene);
  else runTapThrough(scene);
}

/* ─────────────── video mode ─────────────── */
function playSceneVideo(video, scene) {
  state.mode = 'video';
  $('dlg').style.display = 'none';
  const vid = $('sceneVid');
  $('vidPoster').style.backgroundImage = `url(${scene.bg})`;
  $('vidPoster').classList.add('show');
  $('vidTapPlay').classList.remove('show');
  $('videoLayer').classList.add('show');
  vid.muted = state.muted;
  vid.src = `video/${video.file}`;
  $('vidPause').textContent = '⏸';

  clearTimeout(state.vidWatchdog);
  state.vidWatchdog = setTimeout(() => {
    if (vid.readyState === 0) fallbackToTap(scene);
  }, 8000);

  try {
    const p = vid.play();
    if (p && p.catch) p.catch(() => $('vidTapPlay').classList.add('show'));
  } catch (e) { $('vidTapPlay').classList.add('show'); }
}
function onVidPlaying() { $('vidPoster').classList.remove('show'); $('vidTapPlay').classList.remove('show'); clearTimeout(state.vidWatchdog); }
function onVidEnded() { if (state.mode === 'video') afterSceneMedia(); }
function onVidError() { const scene = SCENES[state.sceneId]; if (state.mode === 'video') fallbackToTap(scene); }

function fallbackToTap(scene) {
  clearTimeout(state.vidWatchdog);
  state.videoDisabled = true;              // stop retrying for the rest of the session
  $('videoLayer').classList.remove('show');
  const vid = $('sceneVid'); try { vid.pause(); vid.removeAttribute('src'); } catch (e) {}
  runTapThrough(scene);
}

/* ─────────────── tap-through mode (fallback / lite) ─────────────── */
function runTapThrough(scene) {
  state.mode = 'tap';
  $('videoLayer').classList.remove('show');
  $('dlg').style.display = 'flex';
  $('dlgCard').style.display = 'block';
  state.queue = (scene.lines || []).filter(flagPass);
  state.lineIdx = 0;
  showLine();
}
function showLine() {
  if (state.lineIdx >= state.queue.length) { afterSceneMedia(); return; }
  const line = state.queue[state.lineIdx];
  const ch = CHARACTERS[line.who] || CHARACTERS.narrator;
  const img = $('spImg');
  if (ch.img) { img.src = ch.img; img.style.display = 'block'; } else img.style.display = 'none';
  $('spName').textContent = ch.name || 'NARRATOR';
  $('spRole').textContent = ch.role || '';
  $('spRole').style.display = ch.role ? 'block' : 'none';
  const t = $('lineText');
  t.textContent = line.text;
  t.classList.toggle('narr', line.who === 'narrator');
  $('tapHint').textContent = 'TAP TO CONTINUE ▸';
  playLine(line.id);
}
function advance() {
  if (state.mode !== 'tap' || state.choicesShowing) return;
  state.lineIdx++;
  showLine();
}

/* ─────────────── after the scene's media (video or lines) ─────────────── */
function afterSceneMedia() {
  state.mode = null;
  stopAudio();
  $('videoLayer').classList.remove('show');
  const scene = SCENES[state.sceneId];
  // conditional question that resolves without asking (e.g. s5b when already caught)
  const c = scene.choice;
  if (c && c.showIf && c.showIf.not && state.flags[c.showIf.not]) { startScene(c.elseTo); return; }
  if (unreadKeys().length > 0) showInvite();
  else showChoices();
}

/* ─────────────── evidence invitation ─────────────── */
function showInvite() {
  state.awaitingAnswer = true;
  $('dlg').style.display = 'none';
  const n = unreadKeys().length;
  $('inviteText').textContent = n === 1
    ? 'There’s a new item on your desk. Want to look before you decide?'
    : `You’ve got ${n} new materials on your desk. Want to review them before you decide?`;
  // re-trigger the rise animation
  const card = $('inviteCard'); card.style.animation = 'none'; void card.offsetWidth; card.style.animation = '';
  $('invite').classList.add('show');
}
function hideInvite() { $('invite').classList.remove('show'); }

/* ─────────────── choices ─────────────── */
function hideChoices() { $('choices').style.display = 'none'; state.choicesShowing = false; }
function showChoices() {
  state.awaitingAnswer = false;
  hideInvite();
  const scene = SCENES[state.sceneId];
  const choice = scene.choice;
  $('dlg').style.display = 'flex';
  $('dlgCard').style.display = 'none';
  if (!choice) return;
  if (choice.showIf && choice.showIf.not && state.flags[choice.showIf.not]) { startScene(choice.elseTo); return; }
  state.choicesShowing = true;
  stopAudio();
  $('choicePrompt').style.display = choice.prompt ? 'block' : 'none';
  $('choicePrompt').textContent = choice.prompt || '';
  const wrap = $('optWrap'); wrap.innerHTML = '';
  choice.options.forEach((opt, i) => {
    const b = document.createElement('button');
    b.className = 'opt';
    const locked = opt.requires && !state.flags[opt.requires];
    b.innerHTML = esc(opt.label)
      + (locked ? `<span class="t">🔒 ${esc(opt.lockNote || 'CHECK THE EVIDENCE FIRST')}</span>`
                : (opt.time ? '<span class="t">TAKES TIME</span>' : ''));
    b.onclick = locked ? () => openDrawer('choices') : () => pick(opt);
    if (locked) b.style.opacity = '.55';
    b.dataset.opt = i; b.dataset.locked = locked ? '1' : '0';
    wrap.appendChild(b);
  });
  $('choices').style.display = 'flex';
  $('dlgCard').style.display = 'none';
}
function pick(opt) {
  Object.assign(state.flags, opt.flags || {});
  for (const [k, v] of Object.entries(opt.fx || {})) state.fx[k] += v;
  if (opt.time) { state.timeSpent++; state.clock += 8; }
  state.log.push({ scene: state.sceneId, choice: opt.label });
  let to = opt.to;
  if (to === 'auto_fallout') {
    if (!state.flags.statCaught) to = 's10a';
    else { if (state.timeSpent >= 4) state.flags.lateMiss = true; to = 's10b'; }
  }
  startScene(to);
}

/* ═══════════════ evidence ═══════════════ */
function openDrawer(returnCtx) {
  if (returnCtx) state.drawerReturn = returnCtx;
  const grid = $('evGrid'); grid.innerHTML = '';
  for (const key of state.unlocked) {
    const ev = EVIDENCE[key];
    const unread = !state.opened.has(key);
    const d = document.createElement('button');
    d.className = 'evItem' + (unread ? '' : ' seen');
    d.innerHTML = `<div class="ic">${ev.icon}</div><div class="tt">${esc(ev.title)}${unread ? '<span class="newtag">NEW</span>' : ''}</div>`
      + `<div class="st">${unread ? 'UNREAD' : 'REVIEWED'}</div>`;
    d.onclick = () => { closeSheet('drawerBack'); openEvidence(key); };
    grid.appendChild(d);
  }
  openSheet('drawerBack');
}

function openEvidence(key) {
  const ev = EVIDENCE[key];
  if (!state.opened.has(key)) {
    state.opened.add(key);
    state.fx.curiosity += 1;
    if (ev.setsFlag) state.flags[ev.setsFlag] = true;
    updateHUD();
  }
  if (ev.render === 'photo') return openPhoto(key, ev);
  $('docKind').textContent = ev.render === 'mail' ? 'EMAIL' : ev.render === 'dashboard' ? 'DASHBOARD'
    : ev.render === 'poster' ? 'RESEARCH POSTER' : ev.render === 'chatlog' ? 'CHAT' : ev.render === 'directory' ? 'DIRECTORY' : 'DOCUMENT';
  $('docTitle').textContent = ev.title;
  $('docSub').textContent = ev.sub;
  const body = $('docBody');
  body.classList.remove('mono'); body.classList.add('rich');
  body.innerHTML = renderEvidence(ev);
  if (ev.render === 'mail') wireMailReveal(ev);
  body.scrollTop = 0;
  openSheet('docBack');
}

function openPhoto(key, ev) {
  $('imgTitle').textContent = ev.title;
  $('imgSub').textContent = ev.sub;
  $('imgEl').src = ev.src;
  const wrap = $('imgWrap');
  wrap.querySelectorAll('.hs').forEach(n => n.remove());
  (ev.hotspots || []).forEach((hs, i) => {
    const dot = document.createElement('button');
    dot.className = 'hs' + (state.hotspotsFound.has(key + i) ? ' found' : '');
    dot.style.left = hs.x + '%'; dot.style.top = hs.y + '%';
    dot.setAttribute('aria-label', hs.label);
    dot.onclick = () => {
      if (!state.hotspotsFound.has(key + i)) { state.hotspotsFound.add(key + i); state.fx.curiosity += 1; }
      dot.classList.add('found');
      $('hsNote').textContent = `${hs.label.toUpperCase()} — ${hs.note}`;
    };
    wrap.appendChild(dot);
  });
  $('hsNote').textContent = 'Tap the glowing rings to inspect the marked areas.';
  openSheet('imgBack');
}

/* ── renderers ── */
function renderEvidence(ev) {
  switch (ev.render) {
    case 'mail': return renderMail(ev.mail);
    case 'doc': return renderDoc(ev.doc);
    case 'poster': return renderPoster(ev.poster);
    case 'dashboard': return renderDashboard(ev.dashboard);
    case 'chatlog': return renderChat(ev.chatlog);
    case 'directory': return renderDirectory(ev.directory);
    default: return `<div class="ev">${esc(ev.body || '')}</div>`;
  }
}
function renderMail(m) {
  return `<div class="mail">
    <div class="mail-bar"><span class="logo">🔥 PhoenixMail</span><span class="grow"></span><span class="chip">INBOX</span></div>
    ${m.external ? `<div class="mail-ext">⚠ EXTERNAL SENDER — this message came from outside Elon</div>` : ''}
    <div class="mail-head">
      <div class="mail-av" style="background:${m.avatarColor}">${esc(m.avatar)}</div>
      <div><div class="mail-fromname">${esc(m.fromName)}</div>
        <button class="mail-addr" id="mailReveal"><span class="revealbtn">▸ reveal sender address</span></button></div>
      <div class="mail-time">${esc(m.time)}</div>
    </div>
    <div class="mail-subj">${esc(m.subject)}</div>
    <div class="mail-body">${m.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}</div>
    <div class="mail-sig">${m.signoff.map(esc).join('<br>')}</div>
  </div>`;
}
function wireMailReveal(ev) {
  const btn = $('mailReveal'); if (!btn) return;
  const m = ev.mail;
  const at = m.fromAddr.indexOf('@');
  const local = m.fromAddr.slice(0, at), domain = m.fromAddr.slice(at + 1);
  btn.onclick = () => {
    btn.innerHTML = `${esc(local)}@<span class="dom${m.external ? '' : ' ok'}">${esc(domain)}</span>`
      + (m.external ? ' &nbsp;⚠' : ' &nbsp;✓');
    btn.style.cursor = 'default'; btn.onclick = null;
  };
}
function renderDoc(d) {
  return `<div class="doc-lh">
    <div class="doc-lh-org">${esc(d.org)}</div>
    <div class="doc-lh-tag">${esc(d.tag)}</div>
    <div class="doc-lh-headline">${esc(d.headline)}</div>
    ${d.paragraphs.map(p => `<p>${esc(p)}</p>`).join('')}
    ${d.placeholder ? `<div class="doc-lh-ph">${esc(d.placeholder)}</div>` : ''}
    ${d.footer ? `<div class="doc-lh-footer">${esc(d.footer)}</div>` : ''}
  </div>`;
}
function renderPoster(p) {
  const charts = EVIDENCE.chart.dashboard.charts;
  const chartBlock = `<div style="display:flex;gap:8px;margin-top:8px">
    ${charts.map(c => `<div style="flex:1"><div style="font-size:10px;color:#6d6d75;margin-bottom:2px">${esc(c.title.split(' ').slice(-1)[0] === '(PSS)' ? 'Stress' : 'Retention')}</div>${lineChartSVG(c, 120, 70)}</div>`).join('')}
  </div>`;
  return `<div class="poster">
    <div class="poster-title">${esc(p.title)}</div>
    <div class="poster-authors">${esc(p.authors)}</div>
    ${p.columns.map(c => `<div class="poster-col"><h5>${esc(c.h)}</h5><p>${esc(c.body)}</p>${c.chart ? chartBlock : ''}</div>`).join('')}
    <div class="poster-funding">${esc(p.funding)}</div>
  </div>`;
}
function renderDashboard(d) {
  return `<div class="dash">
    <div class="dash-app">${esc(d.app)}</div>
    <div class="dash-cards">
      ${d.charts.map(c => {
        const col = c.color === 'amber' ? '#eebb4d' : '#6a9bcc';
        return `<div class="dash-card"><div class="ct">${esc(c.title)}</div>${lineChartSVG(c, 240, 120)}
          <div class="ce" style="color:${col}">${esc(c.endLabel)}</div></div>`;
      }).join('')}
    </div>
    <div class="dash-cap">${esc(d.caption)}</div>
  </div>`;
}
function renderChat(cl) {
  return `<div class="chat">
    <div class="chat-ch"># ${esc(cl.channel.replace(/^#/, ''))}</div>
    ${cl.messages.map(m => `<div class="chat-msg${m.reply ? ' reply' : ''}">
      <div class="chat-av" style="background:${m.color}">${esc(m.handle.slice(0, 2).toUpperCase())}</div>
      <div><div class="chat-meta"><b>${esc(m.handle)}</b><span class="tm">${esc(m.time)}</span></div>
      <div class="chat-text">${esc(m.text)}</div></div></div>`).join('')}
  </div>`;
}
function renderDirectory(d) {
  return `<div class="dir">
    <div class="dir-card">
      <div class="dir-name">${esc(d.name)}</div>
      <div class="dir-title">${esc(d.title)}</div>
      <div class="dir-row"><span class="k">EMAIL</span> ${esc(d.email)}</div>
      <div class="dir-row"><span class="k">PHONE</span> ${esc(d.phone)}</div>
      <div class="dir-row"><span class="k">ASSISTANT</span> ${esc(d.assistant)}</div>
    </div>
    <div class="dir-banner">🛈 ${esc(d.banner)}</div>
  </div>`;
}
function lineChartSVG(c, w, h) {
  const [min, max] = c.domain, n = c.y.length, pad = 10, padB = 16;
  const col = c.color === 'amber' ? '#eebb4d' : '#6a9bcc';
  const X = i => pad + i * (w - 2 * pad) / (n - 1);
  const Y = v => (h - padB) - (v - min) / (max - min) * (h - pad - padB);
  const pts = c.y.map((v, i) => [X(i), Y(v)]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ',' + p[1].toFixed(1)).join(' ');
  const area = `M${X(0).toFixed(1)},${(h - padB).toFixed(1)} ` + pts.map(p => `L${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(' ') + ` L${X(n - 1).toFixed(1)},${(h - padB).toFixed(1)} Z`;
  const last = pts[n - 1];
  return `<svg viewBox="0 0 ${w} ${h}" class="chart-svg">
    <line x1="${pad}" y1="${h - padB}" x2="${w - pad}" y2="${h - padB}" stroke="#2b3357" stroke-width="1"/>
    <path d="${area}" fill="${col}" opacity="0.12"/>
    <path d="${line}" fill="none" stroke="${col}" stroke-width="2.5" stroke-linejoin="round"/>
    <circle cx="${last[0].toFixed(1)}" cy="${last[1].toFixed(1)}" r="3.5" fill="${col}"/>
  </svg>`;
}

function openSheet(id) { $(id).classList.add('open'); }
function closeSheet(id) { $(id).classList.remove('open'); }

function onDrawerClose() {
  closeSheet('drawerBack');
  finishEvidenceReturn();
}
function finishEvidenceReturn() {
  if (state.drawerReturn === 'invite' || state.awaitingAnswer) { showInvite(); }
  else if (state.drawerReturn === 'video' && state.mode === 'video') { try { $('sceneVid').play(); } catch (e) {} }
  else refreshChoiceLocks();
}
function refreshChoiceLocks() { if (state.choicesShowing) showChoices(); }

/* ═══════════════ debrief ═══════════════ */
function showDebrief() {
  state.mode = null; stopAudio();
  $('videoLayer').classList.remove('show'); $('dlg').style.display = 'none'; hideInvite();
  setBg(SCENES.s12.bg);
  const f = state.flags, fx = state.fx;
  const wrongStat = !f.statCaught;
  let endKey;
  if (wrongStat) endKey = f.corrPublic ? 'recovery' : 'servant';
  else endKey = state.timeSpent >= 4 ? 'perfectionist' : 'calibrated';
  const end = ENDINGS[endKey];
  const aster = f.phishSent ? ' — WITH AN ASTERISK FROM IT SECURITY' : '';

  const norm = k => Math.max(0, Math.min(5, Math.round((fx[k] / FX_MAX[k]) * 5)));
  const dots = k => '●'.repeat(norm(k)) + '○'.repeat(5 - norm(k));

  const cf = [];
  const add = (good, text) => cf.push(`<div class="cf${good ? ' good' : ''}">${text}</div>`);
  // stat / dashboard
  if (f.statCaught && f.chartRead) add(true, 'You read the dashboard and named it: the 40% was the amber <b>retention</b> curve, not stress. The headline never got to lie.');
  else if (f.chartMiss || f.chartConflate) add(false, '<b>The dashboard you misread:</b> the 40% was retention — the amber line. Stress moved 12%, and it wasn’t even significant. Two curves, two very different claims.');
  else if (!f.statCaught) add(false, '<b>The number you never pinned down:</b> 40% was the app’s retention rate, not a drop in stress. The dashboard said so in two colors.');
  // citation
  if (f.citationFound) add(true, 'You ran the citation check. “Nguyen &amp; Park (2025)” never existed — NOVA invented a journal, and you knew.');
  else add(false, '<b>The check you never ran:</b> the draft cited a paper that doesn’t exist. NOVA fabricated the journal and nobody looked.');
  // photo
  const hsN = [...state.hotspotsFound].filter(k => k.startsWith('photo_ai')).length;
  if (f.photoReal) add(true, 'You asked a real person for a real photo. The AI image — HARVARD shirt, melted poster, four faces where NOVA promised five — never ran.');
  else if (f.photoForensics) add(true, `You named the tell (${hsN >= 2 ? hsN + ' of them, actually' : 'the shirt or the gibberish poster'}). “It felt off” is a hunch; “the shirt says Harvard” is evidence.`);
  else if (f.photoVibes) add(false, '<b>You knew it was off — but couldn’t say why.</b> A hunch doesn’t survive a provost, or an editor. The shirt said HARVARD; that’s the sentence you needed.');
  else if (f.photoUsed) add(false, '<b>The photo you ran</b> had a HARVARD shirt, a gibberish poster, and four students where NOVA claimed five. It photographed no one.');
  // phish
  if (f.phishVerified) add(true, 'One directory check unmasked “VP Merrick.” Urgent + secret + flattering — you refused all three.');
  else if (f.phishSent) add(false, '<b>The email was a costume.</b> The real Dana Merrick was on a plane; the donor list went to a nine-day-old domain. Ninety seconds of checking would have caught it.');
  else if (f.phishIgnored) add(false, 'You deleted the phish. Safe for you — but IT never heard, and the same costume knocks on the next intern’s door tonight.');
  // quote
  if (f.quoteCall) add(true, 'You called Jordan. Two minutes of a real voice beat any generated quote — and carried a warning, if you listened.');
  else if (f.quoteFab) add(false, '<b>The quote wearing Jordan’s name</b> was written by software. She reads it in the paper like everyone else. Consent isn’t retroactive.');
  // comments
  if (f.openedComments) add(true, 'You read the beta testers. One said it outright: “the 40% is literally just us opening the app.” People are a primary source too.');

  const digits = ['judgment', 'curiosity', 'ethics', 'empathy'].map(norm).join('');
  $('debriefBody').innerHTML = `
    <div class="t-eyebrow">SHIFT REPORT · COLLEGE COFFEE EDITION</div>
    <div class="t-title" style="font-size:clamp(26px,6vw,38px)">${esc(end.name)}${aster}</div>
    <div class="r-rank"><div class="text">${esc(end.text)}</div></div>
    <h4 class="rh">THE FOUR CAPACITIES — SCORED ON BEHAVIOR, NOT ANSWERS</h4>
    ${Object.entries(CAPACITIES).map(([k, c]) => `
      <div class="cap"><span><span class="cn">${c.name}</span><span class="cd" style="display:block">${c.desc}</span></span>
      <span class="dots">${dots(k)}</span></div>`).join('')}
    <h4 class="rh">WHAT THE MORNING REMEMBERS</h4>
    ${cf.join('')}
    <p class="r-close">${esc(COPY.closing)}</p>
    <div class="code">PHX-${endKey[0].toUpperCase()}${digits}-${checksum(endKey)}</div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.1em;color:#6d7392;text-align:center">YOUR COMPLETION CODE — SUBMIT IT WITH YOUR REFLECTION</div>
    <div class="r-course">${esc(COPY.courseLine)}</div>
    <button class="bigbtn" id="againBtn">↻ RELIVE THE MORNING</button>
    <a class="bigbtn quiet" href="transcript.html" style="display:block;text-align:center;text-decoration:none">📄 READ THE FULL TRANSCRIPT</a>
    <button class="bigbtn quiet" id="galleryBtn">← ALL REELS</button>
  `;
  openSheet('debriefBack');
  $('againBtn').onclick = () => location.reload();
  $('galleryBtn').onclick = () => location.href = '../index.html';
}
function checksum(endKey) {
  const s = endKey + Object.values(state.fx).join('') + state.timeSpent;
  let n = 0; for (const c of s) n = (n * 31 + c.charCodeAt(0)) % 89;
  return String(n + 10);
}

/* ═══════════════ title & wiring ═══════════════ */
$('titleBody').innerHTML = `
  <div class="t-eyebrow">${COPY.eyebrow}</div>
  <div class="t-title">${COPY.title}</div>
  <div class="t-sub">${COPY.subtitle}</div>
  <div class="t-fiction">${COPY.fiction.map(p => `<p>${esc(p)}</p>`).join('')}</div>
  <button class="bigbtn" id="beginBtn">▸ CLOCK IN — 8:10 AM</button>
  <label id="liteToggle" style="display:flex;align-items:center;gap:9px;justify-content:center;margin-top:14px;
    font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.08em;color:#8a90b8;cursor:pointer">
    <input type="checkbox" id="liteChk" style="accent-color:var(--amber);width:16px;height:16px"> LITE MODE — skip videos, save data</label>
  <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.12em;color:#6d7392;margin-top:12px;line-height:1.8">
  VOICED · ILLUSTRATED · ~14 MINUTES · HEADPHONES NICE, CAPTIONS ALWAYS ON</div>
`;
$('beginBtn').onclick = () => { closeSheet('titleBack'); startScene('s1'); };
$('liteChk').addEventListener('change', e => { state.lite = e.target.checked; });

// dialogue tap-through
$('dlgCard').addEventListener('click', advance);

// evidence button — context-aware (pauses video / returns to invite)
$('evBtn').addEventListener('click', () => {
  if ($('invite').classList.contains('show')) { hideInvite(); openDrawer('invite'); }
  else if (state.mode === 'video') { try { $('sceneVid').pause(); } catch (e) {} openDrawer('video'); }
  else openDrawer('choices');
});
$('drawerClose').addEventListener('click', onDrawerClose);
$('docClose').addEventListener('click', () => { closeSheet('docBack'); finishEvidenceReturn(); });
$('imgClose').addEventListener('click', () => { closeSheet('imgBack'); finishEvidenceReturn(); });

// invite pane
$('inviteReview').addEventListener('click', () => { hideInvite(); openDrawer('invite'); });
$('inviteReady').addEventListener('click', () => { showChoices(); });

// mute controls both video + fallback audio
$('muteBtn').addEventListener('click', () => {
  state.muted = !state.muted;
  $('sceneVid').muted = state.muted;
  if (state.muted) stopAudio();
  updateHUD();
});

// video controls
$('sceneVid').addEventListener('playing', onVidPlaying);
$('sceneVid').addEventListener('ended', onVidEnded);
$('sceneVid').addEventListener('error', onVidError);
$('vidSkip').addEventListener('click', () => { try { $('sceneVid').pause(); } catch (e) {} afterSceneMedia(); });
$('vidReplay').addEventListener('click', () => { const v = $('sceneVid'); v.currentTime = 0; v.play().catch(() => {}); });
$('vidPause').addEventListener('click', () => {
  const v = $('sceneVid');
  if (v.paused) { v.play().catch(() => {}); $('vidPause').textContent = '⏸'; }
  else { v.pause(); $('vidPause').textContent = '▶'; }
});
$('vidTapPlay').addEventListener('click', () => { $('sceneVid').play().then(() => $('vidTapPlay').classList.remove('show')).catch(() => {}); });

// fallback-mode audio controls (tap-through)
$('btnReplay').addEventListener('click', e => { e.stopPropagation(); const l = state.queue[state.lineIdx]; if (l) playLine(l.id); });
$('btnPause').addEventListener('click', e => {
  e.stopPropagation();
  if (!state.audio) return;
  if (state.audio.paused) { state.audio.play().catch(() => {}); $('btnPause').textContent = '⏸'; }
  else { state.audio.pause(); $('btnPause').textContent = '▶'; }
});

/* ─────────────── boot ─────────────── */
async function boot() {
  updateHUD();
  // preload art
  for (const s of Object.values(SCENES)) if (s.bg) new Image().src = s.bg;
  for (const c of Object.values(CHARACTERS)) if (c.img) new Image().src = c.img;
  // load video manifest (fetch failure => tap-through everywhere)
  if (!state.videoDisabled) {
    try {
      const r = await fetch('video/manifest.json', { cache: 'no-cache' });
      if (r.ok) state.manifest = await r.json();
      else state.videoDisabled = true;
    } catch (e) { state.videoDisabled = true; }
  }
}
boot();

/* test hooks */
window.__PHX = {
  state, startScene, openEvidence, advance,
  choose: i => { const b = document.querySelector(`[data-opt="${i}"]`); if (b) b.click(); },
  begin: () => $('beginBtn').click(),
  video: {
    skip: () => $('vidSkip').click(),
    el: () => $('sceneVid'),
    inviteReview: () => $('inviteReview').click(),
    inviteReady: () => $('inviteReady').click(),
  },
};
