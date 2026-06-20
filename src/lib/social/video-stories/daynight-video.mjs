// ─────────────────────────────────────────────────────────────────────────
//  CANONICAL "Giorno / Notte" VIDEO template — APPROVED & LOCKED.
//  Do NOT redesign from scratch. To change the look, edit the CSS/markup here.
//  Same approach as slider-video.mjs: the HTML/CSS template IS the video, so
//  preview and output never drift. But here the background is the REAL Kling
//  AI clip (the sun sets, interior lights switch on) — not a CSS fade.
//
//  The headless browser loads the Kling day→night clip in a <video>, ping-pongs
//  it over 15s (day→night→day…, smooth), composites the brand overlay on top,
//  and captures it frame-by-frame; ffmpeg encodes the MP4.
//
//  Spec: 1080×1920, 15s, 30fps. "DA GIORNO A NOTTE" top badge, white
//  "Realizzato con GetNearMe" box at the bottom. Safe-area aware.
// ─────────────────────────────────────────────────────────────────────────

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..');

// TRIM_START: Kling clips hold on the day frame for the first ~fifth before the
// transition kicks in — skip that dead intro so the day→night change starts
// immediately and the ping-pong never returns to a fully static daytime.
export const DN_SPEC = { W: 1080, H: 1920, FPS: 30, SECONDS: 10, CYCLES: 1.5, TRIM_START: 0.22 };

// Ping-pong 0→1→0 over `cycles` there-and-back passes (smooth, eased ends).
// Maps normalized reel time t∈[0,1] → normalized video position ∈[0,1].
export function dnPingPong(t, cycles = DN_SPEC.CYCLES) {
  const p = (t * cycles) % 2;            // 0..2 saw
  const tri = p < 1 ? p : 2 - p;         // 0→1→0 triangle
  return 0.5 - 0.5 * Math.cos(Math.PI * tri); // cosine ease the triangle
}

const CSS = (W, H) => `*{margin:0;padding:0;box-sizing:border-box}body{margin:0;background:#000}
.slide-1{background:#0f0f0f;width:${W}px;height:${H}px;position:relative;overflow:hidden;font-family:'Helvetica Neue',Arial,sans-serif}
.dn-vid{position:absolute;inset:0;width:100%;height:100%;object-fit:cover}
.top-badge{position:absolute;top:170px;left:50%;transform:translateX(-50%);z-index:12;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.12);padding:12px 36px;border-radius:40px;font-size:26px;font-weight:600;color:#fff;letter-spacing:3px;text-transform:uppercase}
.brand-box{position:absolute;bottom:420px;left:50%;transform:translateX(-50%);z-index:25;background:#fff;border-radius:20px;padding:28px 48px;display:flex;align-items:center;gap:22px;box-shadow:0 10px 44px rgba(0,0,0,0.35)}
.brand-box span{font-size:30px;font-weight:600;color:#1a1a2e;white-space:nowrap}
.brand-box svg{height:48px;width:auto}`;

export function dayNightVideoHtml({ videoUrl, logoSvg, W = DN_SPEC.W, H = DN_SPEC.H }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS(W, H)}</style></head><body>
<div class="slide-1">
  <video class="dn-vid" src="${videoUrl}" muted preload="auto" playsinline></video>
  <div class="top-badge">Da giorno a notte</div>
</div></body></html>`;
}

/**
 * Render the day/night reel to MP4.
 * @param {object} o
 * @param {string} o.videoUrl  absolute URL of the Kling day→night clip (re-hosted)
 * @param {string} o.outPath   output mp4 path
 */
export async function renderDayNightVideo({
  videoUrl, outPath,
  chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  logoSvg, ffmpeg = 'ffmpeg',
} = {}) {
  const puppeteer = (await import('puppeteer-core')).default;
  const { W, H, FPS, SECONDS, CYCLES, TRIM_START } = DN_SPEC;
  const N = FPS * SECONDS;
  if (!logoSvg) logoSvg = await fs.readFile(path.join(REPO_ROOT, 'public/logo_blu_nero.svg'), 'utf8');

  const framesDir = path.join('/tmp', `dn_frames_${Date.now()}`);
  await fs.rm(framesDir, { recursive: true, force: true });
  await fs.mkdir(framesDir, { recursive: true });

  const html = dayNightVideoHtml({ videoUrl, logoSvg, W, H });
  const browser = await puppeteer.launch({
    executablePath: chromePath, headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 45000 });
    // Wait for video metadata, then read its real duration.
    const vidDur = await page.evaluate(() => new Promise((res) => {
      const v = document.querySelector('.dn-vid');
      if (v.readyState >= 1 && v.duration) return res(v.duration);
      v.addEventListener('loadedmetadata', () => res(v.duration), { once: true });
    }));
    await page.evaluate(() => { document.querySelector('.dn-vid').pause(); });

    const seekTo = (t) => page.evaluate((t) => new Promise((res) => {
      const v = document.querySelector('.dn-vid');
      const done = () => res();
      v.addEventListener('seeked', done, { once: true });
      v.currentTime = t;
      // some encoders fire no 'seeked' if already at t
      if (Math.abs(v.currentTime - t) < 0.001) { v.removeEventListener('seeked', done); res(); }
    }), t);

    const startSec = vidDur * TRIM_START;                    // skip static day intro
    for (let i = 0; i < N; i++) {
      const pos = dnPingPong(i / (N - 1), CYCLES);          // 0..1
      const tSec = startSec + pos * (vidDur - startSec);     // map into [startSec, vidDur]
      await seekTo(Math.min(vidDur - 0.05, tSec));
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
