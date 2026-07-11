// THE PHOENIX BRIEF — branching engine (tap-only, voiced, phone-first)
import { SCENES, EVIDENCE, CHARACTERS, ENDINGS, CAPACITIES, COPY } from './scenes.js';

const $ = id => document.getElementById(id);

const state = {
  sceneId: null,
  queue: [], lineIdx: 0,
  flags: {},
  fx: { judgment: 0, curiosity: 0, ethics: 0, empathy: 0 },
  timeSpent: 0,
  unlocked: [],           // evidence keys available so far
  opened: new Set(),      // evidence actually opened
  hotspotsFound: new Set(),
  clock: 8 * 60 + 10,
  muted: false,
  audio: null,
  choicesShowing: false,
  log: [],
};

/* ─────────────── helpers ─────────────── */
const flagPass = l => (!l.if || state.flags[l.if]) && (!l.ifNot || !state.flags[l.ifNot]);
const clockStr = () => {
  const h = Math.floor(state.clock / 60), m = state.clock % 60;
  return `${((h - 1) % 12) + 1}:${String(m).padStart(2, '0')}`;
};
function updateHUD() {
  $('clock').textContent = clockStr();
  $('evCount').textContent = state.unlocked.length;
  $('evBtn').classList.toggle('has', state.unlocked.length > 0);
  $('muteBtn').textContent = state.muted ? '𝄽' : '♪';
}

/* ─────────────── audio ─────────────── */
function playLine(id) {
  stopAudio();
  if (state.muted) return;
  try {
    const a = new Audio(`audio/${id}.mp3`);
    a.play().catch(() => {});
    state.audio = a;
    $('btnPause').textContent = '⏸';
  } catch (e) { /* captions carry the scene */ }
}
function stopAudio() {
  if (state.audio) { try { state.audio.pause(); } catch (e) {} state.audio = null; }
}

/* ─────────────── background ─────────────── */
let bgCurrent = '';
function setBg(src) {
  if (src === bgCurrent) return;
  bgCurrent = src;
  const bg = $('bg'), bg2 = $('bg2');
  bg2.src = src;
  bg2.style.opacity = 1;
  setTimeout(() => { bg.src = src; bg2.style.opacity = 0; }, 1000);
}

/* ─────────────── scenes & lines ─────────────── */
function startScene(id) {
  const scene = SCENES[id];
  state.sceneId = id;
  state.choicesShowing = false;
  if (scene.isDebrief) { showDebrief(); return; }
  state.clock += 10;
  setBg(scene.bg);
  $('sceneTitle').textContent = scene.title.toUpperCase();
  for (const k of scene.evidence || []) if (!state.unlocked.includes(k)) state.unlocked.push(k);
  state.queue = (scene.lines || []).filter(flagPass);
  state.lineIdx = 0;
  $('choices').style.display = 'none';
  $('dlgCard').style.display = 'block';
  updateHUD();
  showLine();
}

function showLine() {
  if (state.lineIdx >= state.queue.length) { showChoices(); return; }
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
  if (state.choicesShowing) return;
  state.lineIdx++;
  showLine();
}

/* ─────────────── choices ─────────────── */
function showChoices() {
  const scene = SCENES[state.sceneId];
  const choice = scene.choice;
  if (!choice) return;
  // conditional question (e.g. s5b): if condition fails, route straight on
  if (choice.showIf && choice.showIf.not && state.flags[choice.showIf.not]) {
    startScene(choice.elseTo);
    return;
  }
  state.choicesShowing = true;
  stopAudio();
  const box = $('choices');
  const prompt = $('choicePrompt');
  prompt.style.display = choice.prompt ? 'block' : 'none';
  prompt.textContent = choice.prompt || '';
  const wrap = $('optWrap');
  wrap.innerHTML = '';
  choice.options.forEach((opt, i) => {
    const b = document.createElement('button');
    b.className = 'opt';
    const locked = opt.requires && !state.flags[opt.requires];
    b.innerHTML = opt.label
      + (locked ? `<span class="t">🔒 ${opt.lockNote || 'CHECK THE EVIDENCE FIRST'}</span>`
                : (opt.time ? '<span class="t">TAKES TIME</span>' : ''));
    if (locked) {
      b.style.opacity = '.55';
      b.onclick = () => openDrawer();   // answers live in the materials
    } else {
      b.onclick = () => pick(opt);
    }
    b.dataset.opt = i;
    b.dataset.locked = locked ? '1' : '0';
    wrap.appendChild(b);
  });
  box.style.display = 'flex';
  $('tapHint').textContent = 'CHOOSE ▴';
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

/* ─────────────── evidence ─────────────── */
function refreshChoiceLocks() {
  // re-render gated options after evidence gets opened
  if (state.choicesShowing) showChoices();
}

function openDrawer() {
  const grid = $('evGrid');
  grid.innerHTML = '';
  for (const key of state.unlocked) {
    const ev = EVIDENCE[key];
    const d = document.createElement('button');
    d.className = 'evItem' + (state.opened.has(key) ? ' seen' : '');
    d.innerHTML = `<div class="ic">${ev.icon}</div><div class="tt">${ev.title}</div><div class="st">${state.opened.has(key) ? 'REVIEWED' : 'UNREAD'}</div>`;
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
  }
  if (ev.kind === 'image') {
    $('imgTitle').textContent = ev.title;
    $('imgSub').textContent = ev.sub;
    $('imgEl').src = ev.src;
    const wrap = $('imgWrap');
    wrap.querySelectorAll('.hs').forEach(n => n.remove());
    for (const [i, hs] of (ev.hotspots || []).entries()) {
      const dot = document.createElement('button');
      dot.className = 'hs' + (state.hotspotsFound.has(key + i) ? ' found' : '');
      dot.style.left = hs.x + '%';
      dot.style.top = hs.y + '%';
      dot.setAttribute('aria-label', hs.label);
      dot.onclick = () => {
        if (!state.hotspotsFound.has(key + i)) { state.hotspotsFound.add(key + i); state.fx.curiosity += 1; }
        dot.classList.add('found');
        $('hsNote').textContent = `${hs.label.toUpperCase()} — ${hs.note}`;
      };
      wrap.appendChild(dot);
    }
    $('hsNote').textContent = 'Tap the glowing rings to inspect the marked areas.';
    openSheet('imgBack');
  } else {
    $('docKind').textContent = ev.kind === 'email' ? 'EMAIL' : 'DOCUMENT';
    $('docTitle').textContent = ev.title;
    $('docSub').textContent = ev.sub;
    const body = $('docBody');
    body.textContent = ev.body;
    body.classList.toggle('mono', ev.kind === 'email');
    openSheet('docBack');
  }
}

function openSheet(id) { $(id).classList.add('open'); }
function closeSheet(id) { $(id).classList.remove('open'); }

/* ─────────────── debrief ─────────────── */
function showDebrief() {
  stopAudio();
  setBg(SCENES.s12.bg);
  const f = state.flags, fx = state.fx;
  const wrongStat = !f.statCaught;
  let endKey;
  if (wrongStat) endKey = f.corrPublic ? 'recovery' : 'servant';
  else endKey = state.timeSpent >= 4 ? 'perfectionist' : 'calibrated';
  const end = ENDINGS[endKey];
  const aster = f.phishSent ? ' — WITH AN ASTERISK FROM IT SECURITY' : '';

  const maxes = { judgment: 8, curiosity: 8, ethics: 6, empathy: 5 };
  const dots = k => {
    const n = Math.max(0, Math.min(5, Math.round((fx[k] / maxes[k]) * 5)));
    return '●'.repeat(n) + '○'.repeat(5 - n);
  };

  const cf = [];
  const add = (good, text) => cf.push(`<div class="cf${good ? ' good' : ''}">${text}</div>`);
  if (f.citationFound) add(true, 'You ran the citation check. The “Journal of American College Health” paper never existed — NOVA invented it, and you knew.');
  else add(false, '<b>The check you never ran:</b> the draft cited “Nguyen &amp; Park (2025).” That paper does not exist. NOVA invented a journal citation and nobody looked.');
  const hsFound = [...state.hotspotsFound].filter(k => k.startsWith('photo_ai')).length;
  if (f.photoReal) add(true, 'You asked a real person for a real photograph. The AI image — Harvard shirt, gibberish poster, four students instead of five — never ran.');
  else if (hsFound >= 2) add(true, `You inspected the photo and found ${hsFound} of its tells. Generated images fail at text, logos, and counting.`);
  else if (f.photoUsed) add(false, '<b>The photo you ran</b> showed a student in a HARVARD shirt, a poster with meltwater text, and four students where NOVA promised five. It was never a photograph of anyone.');
  if (f.phishVerified) add(true, 'One phone call to a directory number unmasked “VP Merrick.” Urgent + secret + flattering — you refused all three.');
  else if (f.phishSent) add(false, '<b>The email was a costume.</b> The real Dana Merrick was on a plane; the donor list went to a nine-day-old domain. Verification would have cost ninety seconds.');
  else if (f.phishIgnored) add(false, 'You deleted the phish. Safe for you — but IT never heard about it, and the same costume knocks on the next intern’s door tonight.');
  if (f.quoteCall) add(true, 'You called Jordan. Two minutes of a real voice produced a better quote than any model — and a warning that saved the release, if you listened.');
  else if (f.quoteFab) add(false, '<b>The quote wearing Jordan’s name</b> was written by software. She reads it in the paper like everyone else. Consent isn’t retroactive.');
  if (f.openedComments) add(true, 'You read the beta testers. One of them said it plainly: “the 40% is literally just us opening the app.” Real people are a primary source too.');

  $('debriefBody').innerHTML = `
    <div class="t-eyebrow">SHIFT REPORT · COLLEGE COFFEE EDITION</div>
    <div class="t-title" style="font-size:clamp(26px,6vw,38px)">${end.name}${aster}</div>
    <div class="r-rank"><div class="text">${end.text}</div></div>
    <h4 class="rh">THE FOUR CAPACITIES — SCORED ON BEHAVIOR, NOT ANSWERS</h4>
    ${Object.entries(CAPACITIES).map(([k, c]) => `
      <div class="cap"><span><span class="cn">${c.name}</span><span class="cd" style="display:block">${c.desc}</span></span>
      <span class="dots">${dots(k)}</span></div>`).join('')}
    <h4 class="rh">WHAT THE MORNING REMEMBERS</h4>
    ${cf.join('')}
    <p class="r-close">${COPY.closing}</p>
    <div class="code">PHX-${endKey[0].toUpperCase()}${['judgment','curiosity','ethics','empathy'].map(k => Math.max(0, Math.min(5, Math.round((fx[k] / maxes[k]) * 5)))).join('')}-${checksum(endKey)}</div>
    <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.1em;color:#6d7392;text-align:center">YOUR COMPLETION CODE — SUBMIT IT WITH YOUR REFLECTION</div>
    <div class="r-course">${COPY.courseLine}</div>
    <button class="bigbtn" id="againBtn">↻ RELIVE THE MORNING</button>
    <button class="bigbtn quiet" id="galleryBtn">← ALL REELS</button>
  `;
  openSheet('debriefBack');
  $('againBtn').onclick = () => location.reload();
  $('galleryBtn').onclick = () => location.href = '../index.html';
}
function checksum(endKey) {
  const s = endKey + Object.values(state.fx).join('') + state.timeSpent;
  let n = 0;
  for (const c of s) n = (n * 31 + c.charCodeAt(0)) % 89;
  return String(n + 10);
}

/* ─────────────── title & wiring ─────────────── */
$('titleBody').innerHTML = `
  <div class="t-eyebrow">${COPY.eyebrow}</div>
  <div class="t-title">${COPY.title}</div>
  <div class="t-sub">${COPY.subtitle}</div>
  <div class="t-fiction">${COPY.fiction.map(p => `<p>${p}</p>`).join('')}</div>
  <button class="bigbtn" id="beginBtn">▸ CLOCK IN — 8:10 AM</button>
  <button class="bigbtn quiet" id="watchBtn">▶ WATCH THE BRIEFING · 26s</button>
  <div style="font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:.12em;color:#6d7392;margin-top:14px;line-height:1.8">
  VOICED · ILLUSTRATED · ~12 MINUTES · HEADPHONES NICE, CAPTIONS ALWAYS ON</div>
`;
$('beginBtn').onclick = () => { closeSheet('titleBack'); startScene('s1'); };
$('watchBtn').onclick = () => {
  openSheet('videoBack');
  try { $('introVid').play().catch(() => {}); } catch (e) {}
};
$('videoClose').addEventListener('click', () => {
  try { $('introVid').pause(); } catch (e) {}
  closeSheet('videoBack');
});

$('dlgCard').addEventListener('click', advance);
$('evBtn').addEventListener('click', openDrawer);
$('drawerClose').addEventListener('click', () => { closeSheet('drawerBack'); refreshChoiceLocks(); });
$('docClose').addEventListener('click', () => { closeSheet('docBack'); refreshChoiceLocks(); });
$('imgClose').addEventListener('click', () => { closeSheet('imgBack'); refreshChoiceLocks(); });
$('muteBtn').addEventListener('click', () => {
  state.muted = !state.muted;
  if (state.muted) stopAudio();
  updateHUD();
});
$('btnReplay').addEventListener('click', e => {
  e.stopPropagation();
  const line = state.queue[state.lineIdx];
  if (line) playLine(line.id);
});
$('btnPause').addEventListener('click', e => {
  e.stopPropagation();
  if (!state.audio) return;
  if (state.audio.paused) { state.audio.play().catch(() => {}); $('btnPause').textContent = '⏸'; }
  else { state.audio.pause(); $('btnPause').textContent = '▶'; }
});

/* preload art */
window.addEventListener('load', () => {
  for (const s of Object.values(SCENES)) if (s.bg) new Image().src = s.bg;
  for (const c of Object.values(CHARACTERS)) if (c.img) new Image().src = c.img;
});
updateHUD();

/* test hook for scripted playthroughs */
window.__PHX = {
  state, startScene, openEvidence,
  advance,
  choose: i => { const b = document.querySelector(`[data-opt="${i}"]`); if (b) b.click(); },
  begin: () => $('beginBtn').click(),
};
