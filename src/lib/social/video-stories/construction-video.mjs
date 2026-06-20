// ─────────────────────────────────────────────────────────────────────────
//  CANONICAL "Costruzione / Timelapse" VIDEO template — APPROVED & LOCKED.
//  Do NOT redesign from scratch. To change the look, edit the CSS/markup here.
//  Same approach as slider/daynight: the HTML/CSS template IS the video.
//  Background = the REAL Kling construction clips (scavo→struttura→finito),
//  concatenated, NOT a fade. The headless browser plays the concatenated clip
//  in a <video>, composites the brand overlay, and captures it frame-by-frame.
//
//  Spec: 1080×1920, 10s, 30fps. "DA TERRENO A CASA" top badge, white
//  "Realizzato con GetNearMe" box at the bottom. Safe-area aware. One-way
//  (scavo→finito), no ping-pong — construction never reverses.
// ─────────────────────────────────────────────────────────────────────────

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..');

export const CON_SPEC = { W: 1080, H: 1920, FPS: 30, SECONDS: 10, HOLD_END: 0.12 };

const CSS = (W, H) => `*{margin:0;padding:0;box-sizing:border-box}body{margin:0;background:#000}
.slide-1{background:#0f0f0f;width:${W}px;height:${H}px;position:relative;overflow:hidden;font-family:'Helvetica Neue',Arial,sans-serif}
.con-vid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.top-badge{position:absolute;top:170px;left:50%;transform:translateX(-50%);z-index:12;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.12);padding:12px 36px;border-radius:40px;font-size:26px;font-weight:600;color:#fff;letter-spacing:3px;text-transform:uppercase}
.brand-box{position:absolute;bottom:420px;left:50%;transform:translateX(-50%);z-index:25;background:#fff;border-radius:20px;padding:28px 48px;display:flex;align-items:center;gap:22px;box-shadow:0 10px 44px rgba(0,0,0,0.35)}
.brand-box span{font-size:30px;font-weight:600;color:#1a1a2e;white-space:nowrap}
.brand-box svg{height:48px;width:auto}`;

export function constructionVideoHtml({ videoUrl, logoSvg, W = CON_SPEC.W, H = CON_SPEC.H }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS(W, H)}</style></head><body>
<div class="slide-1">
  <video class="con-vid" src="${videoUrl}" muted preload="auto" playsinline></video>
  <div class="top-badge">Da terreno a casa</div>
</div></body></html>`;
}

/**
 * Concatenate the Kling segments into a single base clip on disk.
 * Exported so the orchestrator can host the result (the headless render needs an
 * HTTP(S) URL — file:// videos don't load metadata in headless Chrome).
 * @param {string[]} segUrls  absolute URLs of the segments, in order
 * @param {string} outPath    output mp4 path for the concatenated clip
 * @returns {Promise<string>} outPath
 */
export async function concatSegments(segUrls, outPath, ffmpeg = 'ffmpeg') {
  const work = path.join('/tmp', `concat_${Date.now()}`);
  await fs.mkdir(work, { recursive: true });
  const inputs = [];
  for (let i = 0; i < segUrls.length; i++) {
    const p = path.join(work, `seg${i}.mp4`);
    const r = await fetch(segUrls[i]);
    if (!r.ok) throw new Error(`fetch segment ${i} ${r.status}`);
    await fs.writeFile(p, new Uint8Array(await r.arrayBuffer()));
    inputs.push(p);
  }
  // Re-encode concat (segments may differ in params) — video only, no audio.
  const args = ['-y'];
  inputs.forEach((p) => args.push('-i', p));
  const fc = inputs.map((_, i) => `[${i}:v]`).join('') + `concat=n=${inputs.length}:v=1:a=0[v]`;
  args.push('-filter_complex', fc, '-map', '[v]', '-r', String(CON_SPEC.FPS),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', outPath);
  await exec(ffmpeg, args);
  await fs.rm(work, { recursive: true, force: true });
  return outPath;
}

/**
 * Render the construction reel to MP4.
 * @param {object} o
 * @param {string} o.videoUrl  absolute HTTP(S) URL of the concatenated base clip
 *                             (use concatSegments + host it first)
 * @param {string} o.outPath   output mp4 path
 */
export async function renderConstructionVideo({
  videoUrl, outPath,
  chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  logoSvg, ffmpeg = 'ffmpeg',
} = {}) {
  const puppeteer = (await import('puppeteer-core')).default;
  const { W, H, FPS, SECONDS, HOLD_END } = CON_SPEC;
  const N = FPS * SECONDS;
  if (!logoSvg) logoSvg = await fs.readFile(path.join(REPO_ROOT, 'public/logo_blu_nero.svg'), 'utf8');

  const work = path.join('/tmp', `con_${Date.now()}`);
  await fs.rm(work, { recursive: true, force: true });
  await fs.mkdir(work, { recursive: true });
  const framesDir = path.join(work, 'frames');
  await fs.mkdir(framesDir, { recursive: true });

  const html = constructionVideoHtml({ videoUrl, logoSvg, W, H });
  const browser = await puppeteer.launch({
    executablePath: chromePath, headless: 'new', protocolTimeout: 120000,
    args: ['--no-sandbox', '--disable-setuid-sandbox',
      '--force-color-profile=srgb', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 45000 });
    const vidDur = await page.evaluate(() => new Promise((res) => {
      const v = document.querySelector('.con-vid');
      if (v.readyState >= 1 && v.duration) return res(v.duration);
      v.addEventListener('loadedmetadata', () => res(v.duration), { once: true });
    }));
    await page.evaluate(() => { document.querySelector('.con-vid').pause(); });

    const seekTo = (t) => page.evaluate((t) => new Promise((res) => {
      const v = document.querySelector('.con-vid');
      const done = () => res();
      v.addEventListener('seeked', done, { once: true });
      v.currentTime = t;
      if (Math.abs(v.currentTime - t) < 0.001) { v.removeEventListener('seeked', done); res(); }
    }), t);

    // One-way scavo→finito over the first (1-HOLD_END) of the reel, then hold
    // the finished house for the final HOLD_END so it lands on the result.
    const moveN = Math.round(N * (1 - HOLD_END));
    for (let i = 0; i < N; i++) {
      const pos = Math.min(1, i / (moveN - 1));            // 0..1 then clamp
      await seekTo(Math.min(vidDur - 0.05, pos * vidDur));
      const buf = await page.screenshot({ type: 'png' });
      await fs.writeFile(path.join(framesDir, `f${String(i).padStart(4, '0')}.png`), buf);
    }
  } finally {
    await browser.close();
  }

  await exec(ffmpeg, ['-y', '-framerate', String(FPS), '-i', path.join(framesDir, 'f%04d.png'),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outPath]);
  await fs.rm(work, { recursive: true, force: true });
  return outPath;
}
