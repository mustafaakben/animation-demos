#!/usr/bin/env node
/**
 * build_video_manifest.mjs — the single source of truth for scene videos.
 *
 * Imports phoenix/scenes.js (pure data), probes every dialogue mp3 with ffprobe,
 * expands each scene into one video entry (or one per flag-variant for the three
 * conditional scenes), lays out absolute frame offsets, content-hashes each entry
 * for cache-busting + incremental renders, syncs assets into public/, and writes
 * the manifest twice: src/manifest.json (Remotion import) + phoenix/video/manifest.json
 * (engine fetch).
 *
 * Usage: node tools/video/build_video_manifest.mjs
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const phoenix = path.join(repo, 'phoenix');
const audioDir = path.join(phoenix, 'audio');
const imgDir = path.join(phoenix, 'img');
const publicDir = path.join(here, 'public');
const videoOut = path.join(phoenix, 'video');

const { SCENES, CHARACTERS } = await import(pathToFileURL(path.join(phoenix, 'scenes.js')).href);

const FPS = 30;
const LAYOUT = { gapSec: 0.45, leadInSec: 0.8, tailSec: 1.2, minSegmentSec: 2.6 };
const COMPOSITION_VERSION = 3;          // bump to force a full re-render
const CAPTION_CHAR_BUDGET = 300;        // hard readability ceiling at min font

// The only conditional scenes. Each renders one video per variant.
const VARIANTS = {
  s5b: [{ variant: 'missed', flags: {} }, { variant: 'caught', flags: { statCaught: true } }],
  s9:  [{ variant: 'missed', flags: {} }, { variant: 'caught', flags: { statCaught: true } }],
  s10b:[{ variant: 'ontime', flags: {} }, { variant: 'late',   flags: { lateMiss: true } }],
};

const flagPass = (l, flags) => (!l.if || flags[l.if]) && (!l.ifNot || !flags[l.ifNot]);
const shotFor = who => who === 'narrator' ? 'kenburns' : who === 'nova' ? 'chat' : 'talkingCard';

/* ── audio duration: header probe + decode probe, prefer decode ── */
function probe(file) {
  let header = 0, decoded = 0;
  try {
    const out = execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'json', file], { encoding: 'utf8' });
    header = parseFloat(JSON.parse(out).format.duration) || 0;
  } catch (e) { /* fall through */ }
  try {
    const err = execFileSync('ffmpeg', ['-v', 'error', '-stats', '-i', file, '-f', 'null', '-'], { encoding: 'utf8', stdio: ['ignore', 'ignore', 'pipe'] });
    const m = [...err.matchAll(/time=(\d+):(\d+):(\d+\.\d+)/g)].pop();
    if (m) decoded = (+m[1]) * 3600 + (+m[2]) * 60 + parseFloat(m[3]);
  } catch (e) { /* ffmpeg writes stats to stderr; execFileSync throws only on non-zero exit */ }
  const dur = decoded || header || 0;
  if (header && decoded && Math.abs(header - decoded) > 0.1)
    console.warn(`  ⚠ ${path.basename(file)}: header ${header.toFixed(2)}s vs decoded ${decoded.toFixed(2)}s`);
  return dur;
}

/* ── gather every line + duration ── */
console.log('Probing audio…');
const lines = {};
for (const scene of Object.values(SCENES)) {
  for (const l of scene.lines || []) {
    const f = path.join(audioDir, l.id + '.mp3');
    const sec = fs.existsSync(f) ? probe(f) : 0;
    if (!sec) console.warn(`  ⚠ missing/empty audio: ${l.id}`);
    lines[l.id] = { sec: +sec.toFixed(3), frames: Math.ceil(sec * FPS) };
  }
}

/* ── expand scenes → video entries ── */
const gapF = Math.round(LAYOUT.gapSec * FPS);
const leadF = Math.round(LAYOUT.leadInSec * FPS);
const tailF = Math.round(LAYOUT.tailSec * FPS);
const minF = Math.round(LAYOUT.minSegmentSec * FPS);
const warnings = [];

function buildEntry(sceneId, scene, variant, flags) {
  const segs = [];
  let cursor = leadF;
  for (const l of (scene.lines || []).filter(x => flagPass(x, flags))) {
    const ch = CHARACTERS[l.who] || CHARACTERS.narrator;
    const audioFrames = (lines[l.id] || {}).frames || minF;
    const durationInFrames = Math.max(audioFrames + gapF, minF);
    if (l.text.length > CAPTION_CHAR_BUDGET)
      warnings.push(`${l.id} caption ${l.text.length} chars > ${CAPTION_CHAR_BUDGET}`);
    segs.push({
      lineId: l.id, who: l.who, name: ch.name || 'NARRATOR', role: ch.role || '',
      portrait: ch.img ? path.basename(ch.img) : null,
      text: l.text, shot: shotFor(l.who),
      from: cursor, audioFrames, durationInFrames,
    });
    cursor += durationInFrames;
  }
  const durationInFrames = cursor + tailF;
  const hashSrc = JSON.stringify({ v: COMPOSITION_VERSION, segs: segs.map(s => [s.lineId, s.from, s.durationInFrames, s.shot]) });
  const hash = createHash('sha1').update(hashSrc).digest('hex').slice(0, 8);
  const base = variant ? `${sceneId}_${variant}` : sceneId;
  return {
    sceneId, variant: variant || null, flagContext: flags,
    file: `${base}.${hash}.mp4`, bg: path.basename(scene.bg),
    title: scene.title, durationInFrames, segments: segs,
  };
}

const videos = [];
for (const [sceneId, scene] of Object.entries(SCENES)) {
  if (scene.isDebrief || !(scene.lines || []).length) continue;
  if (VARIANTS[sceneId]) {
    for (const { variant, flags } of VARIANTS[sceneId]) videos.push(buildEntry(sceneId, scene, variant, flags));
  } else {
    videos.push(buildEntry(sceneId, scene, null, {}));
  }
}

/* ── sync assets into public/ ── */
fs.mkdirSync(publicDir, { recursive: true });
let synced = 0;
for (const f of fs.readdirSync(audioDir)) if (f.endsWith('.mp3')) { fs.copyFileSync(path.join(audioDir, f), path.join(publicDir, f)); synced++; }
for (const f of fs.readdirSync(imgDir)) if (/\.(jpg|png)$/.test(f)) { fs.copyFileSync(path.join(imgDir, f), path.join(publicDir, f)); synced++; }

/* ── emit ── */
const manifest = {
  version: COMPOSITION_VERSION, fps: FPS, layout: LAYOUT,
  lines, videos,
};
const json = JSON.stringify(manifest, null, 2);
fs.mkdirSync(path.join(here, 'src'), { recursive: true });
fs.mkdirSync(videoOut, { recursive: true });
fs.writeFileSync(path.join(here, 'src', 'manifest.json'), json);
fs.writeFileSync(path.join(videoOut, 'manifest.json'), json);

console.log(`\nManifest: ${videos.length} videos, ${Object.keys(lines).length} lines, ${synced} assets synced.`);
const totalSec = videos.reduce((a, v) => a + v.durationInFrames / FPS, 0);
console.log(`Total footage: ${Math.round(totalSec)}s across ${videos.length} files.`);
videos.forEach(v => console.log(`  ${v.file.padEnd(28)} ${(v.durationInFrames / FPS).toFixed(1)}s  ${v.segments.length} segs`));
if (warnings.length) { console.warn('\n⚠ CAPTION WARNINGS:'); warnings.forEach(w => console.warn('  ' + w)); }
else console.log('\nCaption lint: clean.');
