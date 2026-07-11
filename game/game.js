// THE NIGHT SHIFT — Three.js scene + game logic
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.js';
import { SCENARIOS, SUPERVISOR_LETTER, COPY, FAILURE_CLASSES } from './scenarios.js';

/* ============================== state ============================== */
const RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const WAIT_SLOTS = 5;
const TOTAL = SCENARIOS.length; // 12

const state = {
  phase: 'title',            // title | shift | report
  order: [],                 // scenario indices in play order
  deliveredCount: 0,
  waiting: [],               // parcel groups on belt
  active: null,              // parcel group at desk
  decisions: [],             // {id,title,call,inspected,correct,flawed}
  sourceOpened: new Set(),   // scenario ids whose source was read
  eff: 0, outcome: 0,
  blindStreak: 0, maxBlindStreak: 0, mult: 1,
  falseFlags: 0, autoClears: 0,
  clock: 23 * 60,
  arrivalTimer: 8,           // s until next arrival
  lettersPending: [],        // {from,body,afterCount,reportOnly}
  lettersUnread: [],         // {from,body}
  lettersShown: 0,
  reportLetters: [],         // letters listed in debrief
  muted: false,
  ended: false,
  firstDoc: true,
};

// play order: P-01 first, rest shuffled
state.order = [0, ...shuffle([...Array(TOTAL).keys()].slice(1))];
function shuffle(a){ for (let i=a.length-1;i>0;i--){ const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }

/* ============================== three scene ============================== */
const container = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.15;
container.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0e20);
scene.fog = new THREE.FogExp2(0x0a0e20, 0.05);

const camera = new THREE.PerspectiveCamera(52, window.innerWidth / window.innerHeight, 0.1, 60);
const CAM_BASE = new THREE.Vector3(0.3, 3.3, 6.35);
const LOOK = new THREE.Vector3(0.6, 1.35, -0.55);
camera.position.copy(CAM_BASE);
camera.lookAt(LOOK);

/* lights */
scene.add(new THREE.HemisphereLight(0x28325e, 0x07090f, 0.65));
const rim = new THREE.DirectionalLight(0x6a9bcc, 0.35);
rim.position.set(-6, 6, -8);
scene.add(rim);
const fill = new THREE.PointLight(0xffd9a0, 11, 9, 2);
fill.position.set(0.4, 2.7, 2.3);
scene.add(fill);
const spot = new THREE.SpotLight(0xeebb4d, 380, 30, 0.56, 0.45, 1.7);
spot.position.set(-1.4, 3.35, 1.15);
spot.target.position.set(0.1, 1.6, 0.5);
spot.castShadow = true;
spot.shadow.mapSize.set(1024, 1024);
spot.shadow.bias = -0.002;
scene.add(spot, spot.target);
const trayLight = new THREE.PointLight(0xc25048, 0, 4, 2); // pulses when red mail waits
trayLight.position.set(1.9, 2.0, 1.15);
scene.add(trayLight);

/* materials */
const M = {
  floor: new THREE.MeshStandardMaterial({ color: 0x0d1126, roughness: 1 }),
  wood:  new THREE.MeshStandardMaterial({ color: 0x4a3a30, roughness: 0.8 }),
  woodD: new THREE.MeshStandardMaterial({ color: 0x36291f, roughness: 0.85 }),
  belt:  new THREE.MeshStandardMaterial({ color: 0x10142a, roughness: 0.9 }),
  kraft: new THREE.MeshStandardMaterial({ color: 0xc08a4c, roughness: 0.75 }),
  kraftD:new THREE.MeshStandardMaterial({ color: 0x9c6c38, roughness: 0.8 }),
  tape:  new THREE.MeshStandardMaterial({ color: 0xe8e2d2, roughness: 0.6 }),
  metal: new THREE.MeshStandardMaterial({ color: 0x2a3152, roughness: 0.5, metalness: 0.6 }),
  paper: new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.9 }),
  red:   new THREE.MeshStandardMaterial({ color: 0xc25048, roughness: 0.6 }),
};

/* floor */
const floor = new THREE.Mesh(new THREE.PlaneGeometry(70, 70), M.floor);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

/* desk */
const desk = new THREE.Group();
const deskTop = new THREE.Mesh(new THREE.BoxGeometry(5.8, 0.16, 2.5), M.wood);
deskTop.position.set(0, 1.42, 0.7);
deskTop.castShadow = deskTop.receiveShadow = true;
desk.add(deskTop);
for (const [lx, lz] of [[-2.7, -0.35], [2.7, -0.35], [-2.7, 1.75], [2.7, 1.75]]) {
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.34, 0.14), M.woodD);
  leg.position.set(lx, 0.67, lz);
  desk.add(leg);
}
const modesty = new THREE.Mesh(new THREE.BoxGeometry(5.5, 0.9, 0.06), M.woodD);
modesty.position.set(0, 0.85, -0.3);
desk.add(modesty);
scene.add(desk);

/* desk dressing: paper stack, stamp, mug */
const stack = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.09, 0.75), M.paper);
stack.position.set(-2.1, 1.55, 0.9); stack.rotation.y = 0.2; stack.castShadow = true;
scene.add(stack);
const stampProp = new THREE.Group();
const sBase = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.07, 0.16), M.metal);
const sHandle = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.06, 0.2, 10), M.wood);
sHandle.position.y = 0.13;
stampProp.add(sBase, sHandle);
stampProp.position.set(1.1, 1.55, 1.15); stampProp.rotation.y = -0.4;
scene.add(stampProp);
const mug = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.1, 0.24, 14), M.red);
mug.position.set(2.4, 1.63, 0.9);
scene.add(mug);

/* desk lamp (prop matching the spot light) */
const lamp = new THREE.Group();
const lBase = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.26, 0.06, 16), M.metal);
lBase.position.set(-2.2, 1.55, 0.15);
const lArm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.7, 8), M.metal);
lArm.position.set(-1.98, 2.35, 0.15); lArm.rotation.z = 0.32;
const lShade = new THREE.Mesh(new THREE.ConeGeometry(0.34, 0.42, 16, 1, true), M.metal);
lShade.position.set(-1.7, 3.12, 0.15); lShade.rotation.z = 0.7;
const lBulb = new THREE.Mesh(new THREE.SphereGeometry(0.09, 10, 10),
  new THREE.MeshBasicMaterial({ color: 0xffe6a8 }));
lBulb.position.set(-1.62, 3.05, 0.15);
lamp.add(lBase, lArm, lShade, lBulb);
scene.add(lamp);

/* conveyor belt */
const beltG = new THREE.Group();
const beltBody = new THREE.Mesh(new THREE.BoxGeometry(15, 0.16, 1.05), M.belt);
beltBody.position.set(5.6, 1.3, -1.35);
beltBody.receiveShadow = true;
beltG.add(beltBody);
// striped moving surface
const stripeCanvas = document.createElement('canvas');
stripeCanvas.width = 256; stripeCanvas.height = 32;
const sc = stripeCanvas.getContext('2d');
sc.fillStyle = '#171d38'; sc.fillRect(0, 0, 256, 32);
sc.fillStyle = '#1f2748';
for (let x = 0; x < 256; x += 32) sc.fillRect(x, 0, 16, 32);
const stripeTex = new THREE.CanvasTexture(stripeCanvas);
stripeTex.wrapS = THREE.RepeatWrapping; stripeTex.repeat.set(10, 1);
stripeTex.colorSpace = THREE.SRGBColorSpace;
const beltTopM = new THREE.Mesh(new THREE.PlaneGeometry(15, 0.95),
  new THREE.MeshStandardMaterial({ map: stripeTex, roughness: 0.9 }));
beltTopM.rotation.x = -Math.PI / 2;
beltTopM.position.set(5.6, 1.385, -1.35);
beltG.add(beltTopM);
for (let x = -1; x <= 12.5; x += 2.6) {
  const leg = new THREE.Mesh(new THREE.BoxGeometry(0.12, 1.3, 0.12), M.metal);
  leg.position.set(x, 0.65, -1.35);
  beltG.add(leg);
}
scene.add(beltG);

/* flag chute */
const chute = new THREE.Group();
const chuteBody = new THREE.Mesh(new THREE.BoxGeometry(0.95, 0.7, 0.95),
  new THREE.MeshStandardMaterial({ color: 0x131731, roughness: 0.9 }));
chuteBody.position.set(-2.75, 0.35, 1.55);
const chuteRim = new THREE.Mesh(new THREE.BoxGeometry(1.02, 0.06, 1.02),
  new THREE.MeshStandardMaterial({ color: 0x8c3a34, roughness: 0.5, emissive: 0x551f1b, emissiveIntensity: 0.7 }));
chuteRim.position.set(-2.75, 0.72, 1.55);
chute.add(chuteBody, chuteRim);
scene.add(chute);

/* CRT terminal on desk */
const crtCanvas = document.createElement('canvas');
crtCanvas.width = 256; crtCanvas.height = 192;
const crtTex = new THREE.CanvasTexture(crtCanvas);
crtTex.colorSpace = THREE.SRGBColorSpace;
const crt = new THREE.Group();
const crtBody = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.62, 0.5), M.metal);
const crtFace = new THREE.Mesh(new THREE.PlaneGeometry(0.68, 0.5),
  new THREE.MeshBasicMaterial({ map: crtTex }));
crtFace.position.z = 0.251;
crt.add(crtBody, crtFace);
crt.position.set(-1.62, 1.86, -0.05);
crt.rotation.y = 0.42; crt.rotation.x = -0.05;
scene.add(crt);
function drawCRT() {
  const c = crtCanvas.getContext('2d');
  c.fillStyle = '#04130c'; c.fillRect(0, 0, 256, 192);
  c.fillStyle = 'rgba(126,240,160,0.08)';
  for (let y = 0; y < 192; y += 4) c.fillRect(0, y, 256, 1);
  c.fillStyle = '#7ef0a0';
  c.font = '700 20px monospace';
  c.fillText('M-6 REVIEW', 18, 36);
  c.font = '16px monospace';
  c.fillText(`BELT  ${state.waiting.length + (state.active ? 1 : 0)}/6`, 18, 76);
  c.fillText(`CLOCK ${clockStr()}`, 18, 104);
  c.fillText(`EFF   ${state.eff}`, 18, 132);
  c.fillText(state.mult > 1 ? `THRU  x${state.mult}` : 'THRU  --', 18, 160);
  crtTex.needsUpdate = true;
}

/* dust in the lamplight */
const dustGeo = new THREE.BufferGeometry();
const dustN = 220, dustPos = new Float32Array(dustN * 3);
for (let i = 0; i < dustN; i++) {
  dustPos[i*3] = -2.4 + Math.random() * 4.4;
  dustPos[i*3+1] = 1.3 + Math.random() * 2.1;
  dustPos[i*3+2] = -1.2 + Math.random() * 2.6;
}
dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
  color: 0xeebb4d, size: 0.028, transparent: true, opacity: 0.35,
  blending: THREE.AdditiveBlending, depthWrite: false,
}));
scene.add(dust);

/* filing cabinets, background silhouettes */
for (const [x, z] of [[-5.5, -3.2], [-4.3, -3.4], [5.2, -3.0], [6.4, -3.3]]) {
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1, 2.4 + Math.random(), 0.8), M.woodD);
  cab.position.set(x, 1.3, z);
  scene.add(cab);
}

/* ============================== parcels & letters ============================== */
const ACTIVE_POS = new THREE.Vector3(0, 1.76, 0.55);
const slotPos = i => new THREE.Vector3(1.7 + i * 1.62, 1.64, -1.35);

function labelTexture(id, kind) {
  const cv = document.createElement('canvas');
  cv.width = 256; cv.height = 128;
  const c = cv.getContext('2d');
  c.fillStyle = '#b5813f'; c.fillRect(0, 0, 256, 128);
  c.fillStyle = '#e8e2d2'; c.fillRect(14, 14, 228, 100);
  c.fillStyle = '#232946';
  c.font = '700 34px monospace';
  c.fillText(id, 28, 60);
  c.font = '15px monospace';
  c.fillText(kind.slice(0, 20), 28, 92);
  const t = new THREE.CanvasTexture(cv);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

function makeParcel(scn) {
  const g = new THREE.Group();
  const body = new THREE.Mesh(new THREE.BoxGeometry(0.66, 0.52, 0.52), M.kraft);
  body.castShadow = true; body.receiveShadow = true;
  const tape = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.525, 0.525), M.tape);
  const label = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2),
    new THREE.MeshStandardMaterial({ map: labelTexture(scn.id, scn.kind), roughness: 0.8 }));
  label.position.set(0.12, -0.02, 0.262);
  g.add(body, tape, label);
  g.userData.scn = scn;
  g.userData.kind = 'parcel';
  const s = 0.94 + Math.random() * 0.14;
  g.scale.set(s, s, s);
  g.rotation.y = (Math.random() - 0.5) * 0.16;
  return g;
}

let letterMesh = null;
function showLetterMesh() {
  if (letterMesh) return;
  letterMesh = new THREE.Group();
  const env = new THREE.Mesh(new THREE.BoxGeometry(0.52, 0.045, 0.36), M.paper);
  const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.53, 0.05, 0.08), M.red);
  letterMesh.add(env, stripe);
  letterMesh.position.set(1.9, 2.6, 1.15);
  letterMesh.rotation.y = -0.35;
  letterMesh.userData.kind = 'letter';
  scene.add(letterMesh);
  const m = letterMesh;
  tween(650, k => { if (m.parent) m.position.y = 2.6 - (2.6 - 1.57) * ease(k); });
}
function hideLetterMesh() {
  if (!letterMesh) return;
  scene.remove(letterMesh);
  letterMesh = null;
}

/* ============================== tweens ============================== */
const tweens = [];
function tween(ms, fn, done) { tweens.push({ ms, t: 0, fn, done }); }
const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;

/* ============================== audio ============================== */
let AC = null, master = null, humOsc = null;
function initAudio() {
  try {
    AC = new (window.AudioContext || window.webkitAudioContext)();
    master = AC.createGain(); master.gain.value = 0.14; master.connect(AC.destination);
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 130;
    const g = AC.createGain(); g.gain.value = 0.05;
    humOsc = AC.createOscillator(); humOsc.type = 'sawtooth'; humOsc.frequency.value = 46;
    humOsc.connect(lp); lp.connect(g); g.connect(master); humOsc.start();
  } catch (e) { AC = null; }
}
function blip(freq, dur, type = 'sine', vol = 0.5, delay = 0) {
  if (!AC || state.muted) return;
  try {
    const o = AC.createOscillator(), g = AC.createGain();
    o.type = type; o.frequency.value = freq;
    const t0 = AC.currentTime + delay;
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    o.connect(g); g.connect(master);
    o.start(t0); o.stop(t0 + dur + 0.02);
  } catch (e) {}
}
function noiseBurst(dur, freq, vol = 0.5) {
  if (!AC || state.muted) return;
  try {
    const len = Math.floor(AC.sampleRate * dur);
    const buf = AC.createBuffer(1, len, AC.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = AC.createBufferSource(); src.buffer = buf;
    const f = AC.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq;
    const g = AC.createGain(); g.gain.value = vol;
    src.connect(f); f.connect(g); g.connect(master); src.start();
  } catch (e) {}
}
const sfx = {
  thunk: () => noiseBurst(0.14, 220, 0.9),
  stamp: () => { blip(72, 0.1, 'square', 0.6); noiseBurst(0.05, 900, 0.3); },
  paper: () => noiseBurst(0.16, 1400, 0.18),
  alarm: () => { blip(640, 0.13, 'sine', 0.4); blip(470, 0.16, 'sine', 0.4, 0.16); },
  chime: () => { blip(523, 0.4, 'sine', 0.3); blip(659, 0.4, 'sine', 0.3, 0.12); blip(784, 0.55, 'sine', 0.3, 0.24); },
  klaxon: () => { blip(300, 0.2, 'sawtooth', 0.35); blip(240, 0.3, 'sawtooth', 0.35, 0.2); noiseBurst(0.2, 300, 0.4); },
};

/* ============================== UI helpers ============================== */
const $ = id => document.getElementById(id);
const toastBox = $('toasts');
function toast(msg, warn = false, ms = 3000) {
  const t = document.createElement('div');
  t.className = 'toast' + (warn ? ' warn' : '');
  t.textContent = msg;
  toastBox.appendChild(t);
  setTimeout(() => t.remove(), ms);
  while (toastBox.children.length > 3) toastBox.firstChild.remove();
}
function clockStr() {
  const m = state.clock % (24 * 60);
  return `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
}
function updateHUD() {
  $('clock').textContent = clockStr();
  $('eff').textContent = state.eff;
  $('mult').textContent = state.mult > 1 ? ` ×${state.mult}` : '';
  const total = state.waiting.length + (state.active ? 1 : 0);
  const dots = [];
  for (let i = 0; i < 6; i++) {
    const cls = i < total ? (total >= 6 ? 'hot' : 'on') : '';
    dots.push(`<i class="${cls}"></i>`);
  }
  $('queueDots').innerHTML = dots.join('');
  $('inspectBtn').style.display = (state.phase === 'shift' && state.active && !overlayOpen()) ? 'block' : 'none';
  $('letterBtn').style.display = (state.phase === 'shift' && state.lettersUnread.length && !overlayOpen()) ? 'block' : 'none';
  $('letterBtn').textContent = state.lettersUnread.length > 1 ? `✉ RED MAIL (${state.lettersUnread.length})` : '✉ RED MAIL';
  drawCRT();
}
function overlayOpen() {
  return ['docBack', 'letterBack', 'helpBack', 'reportBack', 'titleBack']
    .some(id => $(id).classList.contains('open'));
}
function openSheet(id) { $(id).classList.add('open'); updateHUD(); }
function closeSheet(id) { $(id).classList.remove('open'); updateHUD(); }

/* ============================== game flow ============================== */
function arrivalInterval() { return Math.max(14, 26 - state.deliveredCount * 1.1); }

function deliverNext() {
  if (state.deliveredCount >= TOTAL) return;
  // overflow check
  if (state.waiting.length >= WAIT_SLOTS) autoClear(state.waiting.shift());
  const scn = SCENARIOS[state.order[state.deliveredCount]];
  state.deliveredCount++;
  const p = makeParcel(scn);
  p.position.set(13.5, 1.64, -1.35);
  scene.add(p);
  state.waiting.push(p);
  reflowQueue();
  sfx.thunk();
  state.arrivalTimer = arrivalInterval();
  if (!state.active) setTimeout(promoteNext, 450);
  if (state.waiting.length + (state.active ? 1 : 0) >= 6)
    toast('BELT AT CAPACITY — NEXT ARRIVAL AUTO-CLEARS THE OLDEST PARCEL', true, 4200);
  updateHUD();
}

function reflowQueue() {
  state.waiting.forEach((p, i) => {
    const from = p.position.clone(), to = slotPos(i);
    if (from.distanceTo(to) < 0.01) return;
    tween(RM ? 200 : 700, k => p.position.lerpVectors(from, to, ease(k)));
  });
}

function promoteNext() {
  if (state.active || !state.waiting.length || state.phase !== 'shift') return;
  const p = state.waiting.shift();
  state.active = p;
  p.userData.activeSince = performance.now();
  const from = p.position.clone(), to = ACTIVE_POS;
  tween(RM ? 220 : 800, k => {
    const e = ease(k);
    p.position.lerpVectors(from, to, e);
    p.position.y += Math.sin(e * Math.PI) * 0.5;
    p.rotation.y = (1 - e) * p.rotation.y;
  });
  reflowQueue();
  if (state.deliveredCount === 1) setTimeout(() => toast('TAP “INSPECT PARCEL” TO READ THE DRAFT'), 900);
  updateHUD();
}

function stampAndRemove(p, approve) {
  const mark = new THREE.Mesh(
    new THREE.PlaneGeometry(0.34, 0.34),
    new THREE.MeshBasicMaterial({ color: approve ? 0xeebb4d : 0xc25048, transparent: true, opacity: 0.95 })
  );
  mark.rotation.x = -Math.PI / 2;
  mark.position.y = 0.28;
  p.add(mark);
  const from = p.position.clone();
  if (approve) {
    const mid = new THREE.Vector3(0.4, 1.7, -1.35), end = new THREE.Vector3(-9, 1.7, -1.35);
    tween(RM ? 300 : 1300, k => {
      const e = ease(k);
      if (e < 0.35) p.position.lerpVectors(from, mid, e / 0.35);
      else p.position.lerpVectors(mid, end, (e - 0.35) / 0.65);
    }, () => disposeParcel(p));
  } else {
    const over = new THREE.Vector3(-2.75, 1.9, 1.55);
    tween(RM ? 300 : 1100, k => {
      const e = ease(k);
      if (e < 0.55) p.position.lerpVectors(from, over, e / 0.55);
      else {
        p.position.y = 1.9 - (e - 0.55) / 0.45 * 1.6;
        const s = 1 - (e - 0.55) / 0.45 * 0.4;
        p.scale.set(s, s, s);
      }
    }, () => disposeParcel(p));
  }
}
function disposeParcel(p) {
  scene.remove(p);
  p.traverse(o => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map) o.material.map.dispose(); });
}

function autoClear(p) {
  const scn = p.userData.scn;
  state.autoClears++;
  state.decisions.push({ id: scn.id, title: scn.title, call: 'auto', inspected: state.sourceOpened.has(scn.id), correct: !scn.flawed, flawed: scn.flawed });
  state.outcome += scn.flawed ? -400 : -100;
  state.clock += 40;
  sfx.klaxon();
  toast(`BELT OVERFLOW — ${scn.id} AUTO-CLEARED AS APPROVED`, true, 4200);
  const from = p.position.clone(), end = new THREE.Vector3(-9, 1.64, -1.35);
  tween(RM ? 250 : 900, k => p.position.lerpVectors(from, end, k), () => disposeParcel(p));
  if (scn.flawed && scn.letter) queueLetter(scn.letter, 2);
  afterDecision();
}

function queueLetter(letter, delay) {
  state.lettersPending.push({ ...letter, afterCount: state.decisions.length + delay });
}

function checkLetters(immediate = false) {
  const due = state.lettersPending.filter(l => immediate || l.afterCount <= state.decisions.length);
  for (const l of due) {
    state.lettersPending.splice(state.lettersPending.indexOf(l), 1);
    if (state.lettersShown >= 3 && !immediate) {
      state.reportLetters.push({ ...l, late: true });
      continue;
    }
    state.lettersShown++;
    state.lettersUnread.push(l);
    state.reportLetters.push(l);
    showLetterMesh();
    sfx.alarm();
    toast('RED MAIL ON YOUR DESK', true, 3600);
  }
  updateHUD();
}

function decide(call) {
  const p = state.active;
  if (!p) return;
  const scn = p.userData.scn;
  const inspected = state.sourceOpened.has(scn.id);
  const correct = call === 'approve' ? !scn.flawed : scn.flawed;
  state.decisions.push({ id: scn.id, title: scn.title, call, inspected, correct, flawed: scn.flawed });

  // efficiency: blind streak seduction
  if (!inspected) {
    state.blindStreak++;
    state.maxBlindStreak = Math.max(state.maxBlindStreak, state.blindStreak);
    state.mult = Math.min(5, 1 + Math.floor(state.blindStreak / 2));
    if (state.mult > 1 && state.blindStreak % 2 === 0) toast(`THROUGHPUT ×${state.mult} — KEEP IT MOVING`);
  } else {
    state.blindStreak = 0;
    state.mult = 1;
  }
  state.eff += 100 * state.mult;

  // outcome (hidden until debrief)
  state.outcome += correct ? 250 : (call === 'flag' ? -150 : -400);

  if (call === 'approve' && scn.flawed && scn.letter) queueLetter(scn.letter, 2);
  if (call === 'flag' && !scn.flawed) {
    state.falseFlags++;
    if (state.falseFlags === 2) queueLetter(SUPERVISOR_LETTER, 1);
  }

  state.clock += 40;
  sfx.stamp();
  closeSheet('docBack');
  stampAndRemove(p, call === 'approve');
  state.active = null;
  afterDecision();
}

function afterDecision() {
  checkLetters();
  updateHUD();
  if (state.decisions.length >= TOTAL) { endShift(); return; }
  setTimeout(promoteNext, 550);
  if (!state.waiting.length && state.deliveredCount < TOTAL) state.arrivalTimer = Math.min(state.arrivalTimer, 1.2);
}

function endShift() {
  if (state.ended) return;
  state.ended = true;
  checkLetters(true); // deliver anything pending
  const waitForMail = () => {
    if (state.lettersUnread.length) { setTimeout(waitForMail, 600); toast('READ THE RED MAIL BEFORE YOU CLOCK OUT', true, 2600); return; }
    setTimeout(showReport, RM ? 300 : 1400);
  };
  waitForMail();
}

/* ============================== report ============================== */
function showReport() {
  state.phase = 'report';
  sfx.chime();
  const d = state.decisions;
  const misses = d.filter(x => x.flawed && (x.call === 'approve' || x.call === 'auto'));
  const hits = d.filter(x => x.flawed && x.call === 'flag');
  const fas = d.filter(x => !x.flawed && x.call === 'flag');
  const inspectedCount = d.filter(x => x.inspected).length;

  let rank;
  if (misses.length === 0 && fas.length <= 1) rank = COPY.ranks.calibrated;
  else if (misses.length === 0) rank = COPY.ranks.paranoid;
  else if (misses.length >= 3) rank = COPY.ranks.rubberStamp;
  else rank = COPY.ranks.learner;

  // counterfactual: first miss
  let counterHTML = '';
  const firstMiss = misses[0];
  if (firstMiss) {
    const scn = SCENARIOS.find(s => s.id === firstMiss.id);
    const head = firstMiss.inspected ? 'THE LINE YOU READ PAST' : 'THE LINE YOU NEVER OPENED';
    counterHTML = `<div class="r-count"><b>${head}</b> — ${scn.title}${firstMiss.call === 'auto' ? ' (auto-cleared by the belt)' : ''}<span class="q">${scn.tellQuote}</span>${scn.tell}</div>`;
  } else {
    counterHTML = `<div class="r-count" style="border-left-color:var(--verdigris)"><b>NOTHING FALSE LEFT THE BUILDING.</b> Every flawed document died at your desk. ${fas.length ? `It cost ${fas.length} clean document${fas.length > 1 ? 's' : ''} a trip to Legal — calibration cuts both ways.` : 'And you didn’t bill Legal a single ghost hunt. That’s the whole job, done.'}</div>`;
  }

  const rows = d.map(x => {
    const scn = SCENARIOS.find(s => s.id === x.id);
    const callLabel = x.call === 'approve' ? '✓ APPROVED' : x.call === 'flag' ? '✕ FLAGGED' : '◌ AUTO-CLEARED';
    const verdict = x.correct ? `<span class="verdict-ok">${x.flawed ? 'FLAWED — CAUGHT' : 'SOUND — SHIPPED'}</span>`
                              : `<span class="verdict-bad">${x.flawed ? 'FLAWED — SHIPPED' : 'SOUND — ESCALATED'}</span>`;
    const why = x.flawed ? scn.tell : scn.bait;
    return `<div class="r-row"><div class="top"><span>${x.id} · ${callLabel}${x.inspected ? '' : ' · unverified'}</span>${verdict}</div><div class="why">${why}</div></div>`;
  }).join('');

  const lateLetters = state.reportLetters.filter(l => l.late)
    .map(l => `<div class="r-row"><div class="top"><span>ARRIVED AFTER SHIFT · ${l.from}</span></div><div class="why">${l.body.split('\n')[0]}</div></div>`).join('');

  const fclasses = Object.entries(FAILURE_CLASSES).map(([k, v]) => {
    const scn = SCENARIOS.find(s => s.flawClass === k);
    return `<div class="fclass"><b>${scn.id}</b> — ${v}</div>`;
  }).join('');

  $('reportBody').innerHTML = `
    <div class="t-eyebrow">SHIFT REPORT · ${clockStr()}</div>
    <div class="t-title" style="font-size:clamp(28px,6vw,40px)">Clock out.</div>
    <div class="r-scores">
      <div class="r-score eff"><div class="lab">THE NUMBER YOU WATCHED</div><div class="val">${state.eff}</div></div>
      <div class="r-score out"><div class="lab">THE NUMBER THAT MATTERED</div><div class="val">${state.outcome}</div></div>
    </div>
    <div class="r-rank"><div class="name">${rank.name}</div><div class="text">${rank.text}</div></div>
    ${counterHTML}
    <div class="r-stat"><span>Flawed documents caught</span><b>${hits.length} of ${misses.length + hits.length}</b></div>
    <div class="r-stat"><span>Clean documents wrongly escalated</span><b>${fas.length}</b></div>
    <div class="r-stat"><span>Source files opened</span><b>${inspectedCount} of ${TOTAL}</b></div>
    <div class="r-stat"><span>Longest unverified stamping streak</span><b>${state.maxBlindStreak}</b></div>
    <div class="r-stat"><span>Parcels the belt decided for you</span><b>${state.autoClears}</b></div>
    <h4 class="r-h">THE FIVE WAYS IT LIED (OR DIDN’T)</h4>
    ${fclasses}
    <h4 class="r-h">DECISION LOG</h4>
    ${rows}
    ${lateLetters ? `<h4 class="r-h">LATE MAIL</h4>${lateLetters}` : ''}
    <p class="r-close">${COPY.closing}</p>
    <div class="r-course">${COPY.courseLine}</div>
    <button class="bigbtn" id="againBtn" style="margin-top:18px">↻ WORK ANOTHER SHIFT</button>
    <button class="bigbtn quiet" id="galleryBtn">← BACK TO THE REELS</button>
  `;
  openSheet('reportBack');
  $('againBtn').onclick = () => location.reload();
  $('galleryBtn').onclick = () => location.href = '../index.html';
}

/* ============================== doc & letter sheets ============================== */
let docTab = 'draft';
function openDoc() {
  const p = state.active;
  if (!p) return;
  const scn = p.userData.scn;
  $('docKind').textContent = `${scn.kind} · ${scn.id}`;
  $('docTitle').textContent = scn.title;
  $('docTo').textContent = `TO: ${scn.to}`;
  $('docHint').style.display = state.firstDoc ? 'block' : 'none';
  setTab('draft');
  sfx.paper();
  openSheet('docBack');
  state.firstDoc = false;
}
function setTab(which) {
  docTab = which;
  const scn = state.active && state.active.userData.scn;
  if (!scn) return;
  $('tabDraft').classList.toggle('on', which === 'draft');
  $('tabSource').classList.toggle('on', which === 'source');
  const body = $('docBody');
  if (which === 'draft') {
    body.classList.remove('mono');
    body.textContent = scn.draft;
  } else {
    body.classList.add('mono');
    body.textContent = `${scn.sourceLabel}\n\n${scn.source}`;
    if (!state.sourceOpened.has(scn.id)) {
      state.sourceOpened.add(scn.id);
      if (state.mult > 1) toast('VERIFICATION OVERHEAD LOGGED — MULTIPLIER RESET');
      state.blindStreak = 0; state.mult = 1;
      updateHUD();
    }
  }
  body.scrollTop = 0;
}
function openLetter() {
  const l = state.lettersUnread[0];
  if (!l) return;
  $('letterFrom').textContent = l.from;
  $('letterBody').textContent = l.body;
  sfx.paper();
  openSheet('letterBack');
}
function closeLetter() {
  state.lettersUnread.shift();
  if (!state.lettersUnread.length) hideLetterMesh();
  closeSheet('letterBack');
}

/* ============================== wiring ============================== */
$('fiction').innerHTML = COPY.fiction.map(p =>
  '<p>' + p
    .replace('94.2% accurate', '<b>94.2% accurate</b>')
    .replace('the signature is yours', '<b>the signature is yours</b>')
    .replace('the oldest parcel ships itself', '<b>the oldest parcel ships itself</b>') + '</p>'
).join('');

$('clockIn').addEventListener('click', () => {
  initAudio();
  closeSheet('titleBack');
  state.phase = 'shift';
  state.arrivalTimer = 1.2;
  toast('SHIFT START — MERIDIAN-6 IS DRAFTING');
  updateHUD();
});
$('inspectBtn').addEventListener('click', openDoc);
$('letterBtn').addEventListener('click', openLetter);
$('btnApprove').addEventListener('click', () => decide('approve'));
$('btnFlag').addEventListener('click', () => decide('flag'));
$('btnBack').addEventListener('click', () => { closeSheet('docBack'); sfx.paper(); });
$('btnLetterClose').addEventListener('click', closeLetter);
$('tabDraft').addEventListener('click', () => setTab('draft'));
$('tabSource').addEventListener('click', () => setTab('source'));
$('helpBtn').addEventListener('click', () => openSheet('helpBack'));
$('helpClose').addEventListener('click', () => closeSheet('helpBack'));
$('muteBtn').addEventListener('click', () => {
  state.muted = !state.muted;
  if (master) master.gain.value = state.muted ? 0 : 0.14;
  $('muteBtn').textContent = state.muted ? '𝄽' : '♪';
});

/* tap the 3D world */
const ray = new THREE.Raycaster();
const pointer = new THREE.Vector2();
renderer.domElement.addEventListener('pointerdown', e => {
  if (state.phase !== 'shift' || overlayOpen()) return;
  pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
  pointer.y = -(e.clientY / window.innerHeight) * 2 + 1;
  ray.setFromCamera(pointer, camera);
  const targets = [...state.waiting, state.active, letterMesh].filter(Boolean);
  const hit = ray.intersectObjects(targets, true)[0];
  if (!hit) return;
  let g = hit.object;
  while (g && !g.userData.kind) g = g.parent;
  if (!g) return;
  if (g.userData.kind === 'letter') openLetter();
  else if (g === state.active) openDoc();
  else toast('IN THE QUEUE — THE DESK PARCEL COMES FIRST');
});

/* parallax */
let parX = 0, parY = 0;
if (!RM) window.addEventListener('pointermove', e => {
  parX = (e.clientX / window.innerWidth - 0.5);
  parY = (e.clientY / window.innerHeight - 0.5);
});

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

/* ============================== main loop ============================== */
let last = performance.now();
function loop(now) {
  requestAnimationFrame(loop);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;

  // belt scroll
  stripeTex.offset.x -= dt * 0.25;

  // arrivals
  if (state.phase === 'shift' && state.deliveredCount < TOTAL) {
    state.arrivalTimer -= dt;
    if (state.arrivalTimer <= 0) deliverNext();
  }

  // tweens (exception-proof: a bad tween must never kill the frame)
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt * 1000;
    const k = Math.min(1, tw.t / tw.ms);
    try { tw.fn(k); } catch (e) { tweens.splice(i, 1); continue; }
    if (k >= 1) { tweens.splice(i, 1); if (tw.done) try { tw.done(); } catch (e) {} }
  }

  // ambience
  if (!RM) {
    const t = now / 1000;
    camera.position.x = CAM_BASE.x + Math.sin(t * 0.28) * 0.05 + parX * 0.35;
    camera.position.y = CAM_BASE.y + Math.sin(t * 0.4) * 0.03 - parY * 0.2;
    camera.lookAt(LOOK);
    dust.rotation.y = Math.sin(t * 0.05) * 0.15;
    const dp = dust.geometry.attributes.position;
    for (let i = 0; i < dustN; i += 7) {
      dp.array[i * 3 + 1] += Math.sin(t * 0.6 + i) * 0.0006;
    }
    dp.needsUpdate = true;
    lBulb.material.color.setHSL(0.11, 0.85, 0.78 + Math.sin(t * 1.1) * 0.03);
  }
  trayLight.intensity = state.lettersUnread.length ? (2.4 + Math.sin(now / 180) * 1.6) : 0;

  renderer.render(scene, camera);
}
drawCRT();
updateHUD();
requestAnimationFrame(loop);

// test hook for automated playthroughs (harmless in production)
window.__NS = { state, decide, openDoc, deliverNext, openLetter, closeLetter, setTab };
