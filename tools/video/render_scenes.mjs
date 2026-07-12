#!/usr/bin/env node
/**
 * render_scenes.mjs — bundle once, render every manifest video, compress, prune.
 *
 * Node API (not the CLI) to avoid Windows --props JSON quoting hell and to bundle
 * a single time instead of once per scene. Incremental: content-hashed output
 * files that already exist are skipped; orphaned videos are pruned.
 *
 * Usage: node tools/video/render_scenes.mjs [--only s4b,s1]
 */
import { bundle } from '@remotion/bundler';
import { renderMedia, selectComposition } from '@remotion/renderer';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, '..', '..');
const videoOut = path.join(repo, 'phoenix', 'video');
const tmpDir = path.join(here, 'out');
const manifest = JSON.parse(fs.readFileSync(path.join(here, 'src', 'manifest.json'), 'utf8'));

const onlyArg = process.argv.find(a => a.startsWith('--only'));
const only = onlyArg ? (process.argv[process.argv.indexOf(onlyArg) + 1] || '').split(',') : null;

fs.mkdirSync(tmpDir, { recursive: true });
fs.mkdirSync(videoOut, { recursive: true });

// prune orphans no longer referenced by the manifest
const keep = new Set(manifest.videos.map(v => v.file));
for (const f of fs.readdirSync(videoOut)) {
  if (f.endsWith('.mp4') && !keep.has(f)) { fs.unlinkSync(path.join(videoOut, f)); console.log('pruned ' + f); }
}

console.log('Bundling (one time)…');
const serveUrl = await bundle({ entryPoint: path.join(here, 'src', 'index.jsx') });
console.log('Bundle ready.\n');

let rendered = 0, skipped = 0, failed = 0;
for (const v of manifest.videos) {
  const label = `${v.sceneId}${v.variant ? '_' + v.variant : ''}`;
  if (only && !only.includes(v.sceneId) && !only.includes(label)) continue;
  const final = path.join(videoOut, v.file);
  if (fs.existsSync(final) && !only) { skipped++; continue; }
  const compId = `Scene-${v.sceneId}${v.variant ? '-' + v.variant : ''}`;
  const tmp = path.join(tmpDir, `tmp_${label}.mp4`);
  try {
    const composition = await selectComposition({ serveUrl, id: compId, inputProps: { video: v } });
    await renderMedia({ composition, serveUrl, codec: 'h264', outputLocation: tmp, inputProps: { video: v } });
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', tmp,
      '-c:v', 'libx264', '-crf', '27', '-preset', 'slow', '-pix_fmt', 'yuv420p',
      '-c:a', 'aac', '-b:a', '96k', '-ac', '1', '-movflags', '+faststart', final]);
    fs.unlinkSync(tmp);
    const kb = Math.round(fs.statSync(final).size / 1024);
    rendered++;
    console.log(`  ✓ ${v.file}  (${kb} KB)`);
  } catch (e) {
    failed++;
    console.error(`  ✗ ${label}: ${e.message.split('\n')[0]}`);
  }
}
const totalMB = fs.readdirSync(videoOut).filter(f => f.endsWith('.mp4'))
  .reduce((a, f) => a + fs.statSync(path.join(videoOut, f)).size, 0) / 1048576;
console.log(`\nDone — ${rendered} rendered, ${skipped} skipped, ${failed} failed. phoenix/video = ${totalMB.toFixed(1)} MB`);
