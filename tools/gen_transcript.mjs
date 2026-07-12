#!/usr/bin/env node
/**
 * gen_transcript.mjs — build phoenix/transcript.html from scenes.js.
 * Accessibility + instructor reference: every line of dialogue and every piece
 * of evidence text, scene by scene. Run after editing scenes.js.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const phoenix = path.resolve(here, '..', 'phoenix');
const { SCENES, EVIDENCE, CHARACTERS, COPY } = await import(pathToFileURL(path.join(phoenix, 'scenes.js')).href);

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
const who = k => (CHARACTERS[k] && CHARACTERS[k].name) || (k === 'narrator' ? 'Narrator' : k);

let scenes = '';
for (const [id, s] of Object.entries(SCENES)) {
  if (s.isDebrief) continue;
  scenes += `<section><h2>${esc(s.title)} <span class="id">${id}</span></h2>`;
  for (const l of s.lines || []) {
    const cond = l.if ? ` <em>(if ${l.if})</em>` : l.ifNot ? ` <em>(if not ${l.ifNot})</em>` : '';
    scenes += `<p class="line"><b class="${l.who}">${esc(who(l.who))}:</b> ${esc(l.text)}${cond}</p>`;
  }
  if (s.choice && s.choice.prompt) {
    scenes += `<p class="q">❓ ${esc(s.choice.prompt)}</p><ul>`;
    for (const o of s.choice.options) scenes += `<li>${esc(o.label)} <span class="to">→ ${o.to}</span></li>`;
    scenes += `</ul>`;
  }
  if ((s.evidence || []).length) {
    scenes += `<div class="ev"><b>Evidence available:</b> ${s.evidence.map(k => esc(EVIDENCE[k] ? EVIDENCE[k].title : k)).join(' · ')}</div>`;
  }
  scenes += `</section>`;
}

let evidence = '<section><h2>Evidence — full text</h2>';
for (const [k, e] of Object.entries(EVIDENCE)) {
  evidence += `<div class="evfull"><h3>${e.icon} ${esc(e.title)}</h3><p class="sub">${esc(e.sub)}</p><pre>${esc(e.body || '')}</pre></div>`;
}
evidence += '</section>';

const html = `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>The Phoenix Brief — Transcript</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,600&family=Karla:wght@400;600;700&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
:root{--ink:#232946;--deep:#151a30;--chalk:#f4f4f0;--amber:#eebb4d;--maroon:#73000A}
*{margin:0;padding:0;box-sizing:border-box}
body{background:var(--deep);color:#d8dae6;font-family:'Karla',sans-serif;line-height:1.6;padding:40px 20px 90px}
.wrap{max-width:760px;margin:0 auto}
.eyebrow{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:.24em;color:var(--amber)}
h1{font-family:'Fraunces',serif;font-weight:600;font-size:clamp(30px,6vw,46px);margin:10px 0 6px;color:var(--chalk)}
.lead{color:#9ba1c0;margin-bottom:30px}
section{border-top:1px solid #2b3357;padding:22px 0}
h2{font-family:'Fraunces',serif;font-weight:600;font-size:22px;color:var(--chalk)}
h2 .id{font-family:'IBM Plex Mono',monospace;font-size:11px;color:#6d7392;letter-spacing:.1em}
.line{margin:8px 0}
.line b{color:var(--amber)}
.line b.narrator{color:#9ba1c0;font-style:italic;font-weight:400}
.line b.nova{color:#e2b455}.line b.jordan{color:#9fd0c6}.line b.sam{color:#9db9e0}
.line em{color:#6d7392;font-size:13px}
.q{margin:14px 0 6px;font-weight:600;color:var(--chalk)}
ul{margin:0 0 8px 22px}li{margin:4px 0;color:#c9cde0}
.to{font-family:'IBM Plex Mono',monospace;font-size:11px;color:#6d7392}
.ev{margin-top:10px;font-size:13px;color:#8a90b8}
h3{font-family:'Fraunces',serif;font-weight:600;font-size:17px;color:var(--chalk);margin-top:16px}
.sub{font-family:'IBM Plex Mono',monospace;font-size:11px;color:#6d7392;margin:2px 0 6px}
pre{white-space:pre-wrap;font-family:'IBM Plex Mono',monospace;font-size:12.5px;line-height:1.7;color:#b9bdd0;
  background:#0f1330;border:1px solid #2b3357;border-radius:10px;padding:14px;margin-bottom:8px}
a{color:var(--amber)}
</style></head><body><div class="wrap">
<div class="eyebrow">${esc(COPY.eyebrow)} · TRANSCRIPT</div>
<h1>${esc(COPY.title)}</h1>
<p class="lead">Full dialogue and evidence for accessibility and instructor review. <a href="index.html">▸ Play the interactive version</a></p>
${scenes}
${evidence}
<section><p style="color:#6d7392;font-size:12px">${esc(COPY.courseLine)}</p></section>
</div></body></html>`;

fs.writeFileSync(path.join(phoenix, 'transcript.html'), html);
console.log('[transcript] wrote phoenix/transcript.html');
