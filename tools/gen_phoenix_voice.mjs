#!/usr/bin/env node
/**
 * gen_phoenix_voice.mjs — build-time dialogue audio for The Phoenix Brief.
 *
 * Renders every line in phoenix/scenes.js to WAV via the author's `speaky`
 * skill (Gemini TTS), then compresses to MP3 with ffmpeg. Idempotent: lines
 * that already have an MP3 are skipped, so re-runs only render new/edited ids.
 *
 * Usage: node tools/gen_phoenix_voice.mjs [--free] [--only s1_01,s2_03]
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const { SCENES, VOICES } = await import(pathToFileURL(path.join(here, "..", "phoenix", "scenes.js")).href);

const SPEAK = "C:\\Users\\musta\\Dropbox\\AI-Agent-Library\\skills\\speaky\\scripts\\speak.py";
const outDir = path.join(here, "..", "phoenix", "audio");
fs.mkdirSync(outDir, { recursive: true });

const useFree = process.argv.includes("--free");
const onlyArg = process.argv.find(a => a.startsWith("--only"));
const only = onlyArg ? (onlyArg.split("=")[1] || process.argv[process.argv.indexOf(onlyArg) + 1]).split(",") : null;

const lines = [];
for (const scene of Object.values(SCENES)) {
  for (const l of scene.lines || []) lines.push(l);
}

let ok = 0, skip = 0, fail = 0;
for (const line of lines) {
  if (only && !only.includes(line.id)) continue;
  const mp3 = path.join(outDir, line.id + ".mp3");
  if (fs.existsSync(mp3) && !only) { skip++; continue; }
  const wav = path.join(outDir, line.id + ".wav");
  const v = VOICES[line.who] || VOICES.narrator;
  const args = [SPEAK, line.text, "--no-play", "--out", wav, "--voice", v.voice, "--style", v.style];
  try {
    execFileSync("python", useFree ? args.concat(["--free"]) : args, { stdio: "pipe", timeout: 120000 });
  } catch (e) {
    console.error(`[voice] ${line.id} failed, retrying on free tier…`);
    try { execFileSync("python", args.concat(["--free"]), { stdio: "pipe", timeout: 120000 }); }
    catch (e2) { console.error(`[voice] gave up on ${line.id}`); fail++; continue; }
  }
  try {
    execFileSync("ffmpeg", ["-y", "-loglevel", "error", "-i", wav, "-ac", "1", "-b:a", "40k", mp3], { stdio: "pipe" });
    fs.unlinkSync(wav);
    ok++;
    console.log(`[voice] ${line.id} ✓ (${VOICES[line.who].voice})`);
  } catch (e) { console.error(`[voice] mp3 conversion failed for ${line.id}`); fail++; }
}
console.log(`[voice] done — ${ok} rendered, ${skip} already present, ${fail} failed.`);
