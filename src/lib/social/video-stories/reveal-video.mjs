// ─────────────────────────────────────────────────────────────────────────
//  CANONICAL "Reveal" VIDEO template — APPROVED & LOCKED.
//  Shared by STOP-MOTION and PARTICLE (both are a single Kling clip that
//  reveals an empty room becoming furnished). Same approach as the other reels:
//  the HTML/CSS template IS the video. The headless browser plays the Kling
//  reveal clip in a <video>, composites the brand overlay, captures it
//  frame-by-frame; ffmpeg encodes the MP4.
//
//  Unlike construction/day-night, the calendar modal shows these full-frame
//  (no centered brand box), so the brand box IS baked into the video here
//  (like the slider). One-way (empty→furnished), no ping-pong; holds the
//  furnished result at the end.
//
//  Spec: 1080×1920, 10s, 30fps. Configurable top badge + white "Realizzato
//  con GetNearMe" box at bottom. Safe-area aware.
// ─────────────────────────────────────────────────────────────────────────

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..');

// Play the Kling clip at NATIVE speed (1×) then hold the furnished result for
// HOLD_END_SEC. Output duration = clip duration + hold (no slow-motion stretch).
export const REVEAL_SPEC = { W: 1080, H: 1920, FPS: 30, HOLD_END_SEC: 1.5 };

// Badge text per template key.
export const REVEAL_BADGES = {
  video_before_after_stopmotion: 'Stop motion',
  video_before_after_particle: 'Effetto polvere',
};

const CSS = (W, H) => `*{margin:0;padding:0;box-sizing:border-box}body{margin:0;background:#000}
.slide-1{background:#0f0f0f;width:${W}px;height:${H}px;position:relative;overflow:hidden;font-family:'Helvetica Neue',Arial,sans-serif}
.rv-vid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.top-badge{position:absolute;top:170px;left:50%;transform:translateX(-50%);z-index:12;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.12);padding:12px 36px;border-radius:40px;font-size:26px;font-weight:600;color:#fff;letter-spacing:3px;text-transform:uppercase}
.brand-box{position:absolute;bottom:420px;left:50%;transform:translateX(-50%);z-index:25;background:#fff;border-radius:20px;padding:28px 48px;display:flex;align-items:center;gap:22px;box-shadow:0 10px 44px rgba(0,0,0,0.35)}
.brand-box span{font-size:30px;font-weight:600;color:#1a1a2e;white-space:nowrap}
.brand-box svg{height:48px;width:auto}`;

export function revealVideoHtml({ videoUrl, badge, logoSvg, W = REVEAL_SPEC.W, H = REVEAL_SPEC.H }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS(W, H)}</style></head><body>
<div class="slide-1">
  <video class="rv-vid" src="${videoUrl}" muted preload="auto" playsinline></video>
  <div class="top-badge">${badge}</div>
  <div class="brand-box"><span>Realizzato con</span>${logoSvg}</div>
</div></body></html>`;
}

/**
 * Render a reveal reel to MP4.
 * @param {object} o
 * @param {string} o.videoUrl  absolute HTTP(S) URL of the Kling reveal clip
 * @param {string} o.badge     top badge text (e.g. "Stop motion")
 * @param {string} o.outPath   output mp4 path
 */
export async function renderRevealVideo({
  videoUrl, badge = 'AI Staging', outPath,
  chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  logoSvg, ffmpeg = 'ffmpeg',
} = {}) {
  const puppeteer = (await import('puppeteer-core')).default;
  const { W, H, FPS, HOLD_END_SEC } = REVEAL_SPEC;
  if (!logoSvg) logoSvg = await fs.readFile(path.join(REPO_ROOT, 'public/logo_blu_nero.svg'), 'utf8');

  const framesDir = path.join('/tmp', `rv_frames_${Date.now()}`);
  await fs.rm(framesDir, { recursive: true, force: true });
  await fs.mkdir(framesDir, { recursive: true });

  const html = revealVideoHtml({ videoUrl, badge, logoSvg, W, H });
  const browser = await puppeteer.launch({
    executablePath: chromePath, headless: 'new', protocolTimeout: 120000,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 45000 });
    const vidDur = await page.evaluate(() => new Promise((res) => {
      const v = document.querySelector('.rv-vid');
      if (v.readyState >= 1 && v.duration) return res(v.duration);
      v.addEventListener('loadedmetadata', () => res(v.duration), { once: true });
    }));
    await page.evaluate(() => { document.querySelector('.rv-vid').pause(); });

    const seekTo = (t) => page.evaluate((t) => new Promise((res) => {
      const v = document.querySelector('.rv-vid');
      const done = () => res();
      v.addEventListener('seeked', done, { once: true });
      v.currentTime = t;
      if (Math.abs(v.currentTime - t) < 0.001) { v.removeEventListener('seeked', done); res(); }
    }), t);

    // Play the clip at native 1× speed (frame i → clip time i/FPS), then hold
    // the furnished result for HOLD_END_SEC. No slow-motion stretch.
    const playN = Math.round(vidDur * FPS);
    const holdN = Math.round(HOLD_END_SEC * FPS);
    const N = playN + holdN;
    for (let i = 0; i < N; i++) {
      const tSec = Math.min(vidDur - 0.05, i / FPS);
      await seekTo(tSec);
      const buf = await page.screenshot({ type: 'png' });
      await fs.writeFile(path.join(framesDir, `f${String(i).padStart(4, '0')}.png`), buf);
    }
  } finally {
    await browser.close();
  }

  await exec(ffmpeg, ['-y', '-framerate', String(FPS), '-i', path.join(framesDir, 'f%04d.png'),
    '-c:v', 'libx264', '-preset', 'medium', '-crf', '20', '-pix_fmt', 'yuv420p', '-movflags', '+faststart', outPath]);
  await fs.rm(framesDir, { recursive: true, force: true });
  return outPath;
}
