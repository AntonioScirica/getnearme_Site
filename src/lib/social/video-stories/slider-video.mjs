// ─────────────────────────────────────────────────────────────────────────
//  CANONICAL "Slider Before/After" VIDEO template.
//  Approved design (locked) — DO NOT redesign from scratch. To change the look,
//  edit the CSS/markup here and it propagates to every generated video.
//
//  This is the single source of truth for the before/after slider REEL:
//  the HTML/CSS template IS the video. A headless browser renders it and a
//  deterministic, eased divider sweep is captured frame-by-frame, then ffmpeg
//  encodes the MP4. No hand-coded FFmpeg filtergraph → preview and video can
//  never drift.
//
//  Spec (approved):
//   - 1080×1920, 15s, 30fps
//   - before (left, desaturated) / after (right) with a vertical divider
//   - divider sweeps prima↔dopo with EASE-IN-OUT (cosine), continuous, no holds
//   - "AI STAGING" top badge, PRIMA/DOPO labels, white "Realizzato con
//     GetNearMe" box at the BOTTOM (no blue badge)
//   - safe-area aware (top elements ≥170px, brand box ≥420px from bottom)
// ─────────────────────────────────────────────────────────────────────────

import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const exec = promisify(execFile);
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '../../../..'); // getnearme_Site root

export const SLIDER_SPEC = { W: 1080, H: 1920, FPS: 30, SECONDS: 15, CYCLES: 1.5 };

// Divider position over normalized time t∈[0,1]: 90% (prima) ↔ 10% (dopo),
// cosine ease-in-out, CYCLES passes, continuous (never holds).
export function sliderSweep(t, cycles = SLIDER_SPEC.CYCLES) {
  return 50 + 40 * Math.cos(2 * Math.PI * cycles * t);
}

const CSS = (W, H) => `*{margin:0;padding:0;box-sizing:border-box}body{margin:0}
.slide-1{background:#0f0f0f;width:${W}px;height:${H}px;position:relative;overflow:hidden;font-family:'Helvetica Neue',Arial,sans-serif}
.split-container{position:absolute;inset:0;overflow:hidden}
.split-half{position:absolute;inset:0;overflow:hidden}
.split-before img{width:100%;height:100%;object-fit:cover}
.split-after{clip-path:inset(0 0 0 50%)}
.split-after img{width:100%;height:100%;object-fit:cover}
.divider{position:absolute;left:50%;top:0;bottom:0;width:4px;background:#fff;transform:translateX(-50%);z-index:10;box-shadow:0 0 16px rgba(0,0,0,.35)}
.divider-icon{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);width:76px;height:76px;background:#fff;border-radius:50%;z-index:11;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,.3)}
.divider-icon svg{width:38px;height:38px}
/* safe area: top elements below ~170px, bottom box above the reel UI zone (~420px) */
.top-badge{position:absolute;top:170px;left:50%;transform:translateX(-50%);z-index:12;background:rgba(0,0,0,.5);border:1px solid rgba(255,255,255,.12);padding:12px 36px;border-radius:40px;font-size:26px;font-weight:600;color:#fff;letter-spacing:3px;text-transform:uppercase}
.label-before,.label-after{position:absolute;top:250px;z-index:12;font-size:28px;font-weight:700;letter-spacing:3px;text-transform:uppercase}
.label-before{left:72px;color:rgba(255,255,255,.9)}
.label-after{right:72px;color:#fff}
.brand-box{position:absolute;bottom:420px;left:50%;transform:translateX(-50%);z-index:25;background:#fff;border-radius:20px;padding:28px 48px;display:flex;align-items:center;gap:22px;box-shadow:0 10px 44px rgba(0,0,0,0.35)}
.brand-box span{font-size:30px;font-weight:600;color:#1a1a2e;white-space:nowrap}
.brand-box svg{height:48px;width:auto}`;

/** Full HTML document for the slider reel. beforeUrl/afterUrl must be absolute. */
export function sliderVideoHtml({ beforeUrl, afterUrl, logoSvg, W = SLIDER_SPEC.W, H = SLIDER_SPEC.H }) {
  return `<!DOCTYPE html><html><head><meta charset="utf-8"><style>${CSS(W, H)}</style></head><body>
<div class="slide-1">
  <div class="split-container">
    <div class="split-half split-before"><img src="${beforeUrl}"></div>
    <div class="split-half split-after"><img src="${afterUrl}"></div>
  </div>
  <div class="divider"></div>
  <div class="divider-icon"><svg viewBox="0 0 24 24" fill="none" stroke="#3B83F6" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M7 16l-4-4 4-4"/><path d="M17 8l4 4-4 4"/></svg></div>
  <div class="top-badge">AI Staging</div>
  <div class="label-before">Prima</div>
  <div class="label-after">Dopo</div>
  <div class="brand-box"><span>Realizzato con</span>${logoSvg}</div>
</div></body></html>`;
}

/**
 * Render the slider reel to an MP4 file.
 * @param {object} o
 * @param {string} o.beforeUrl  absolute URL of the "before" photo
 * @param {string} o.afterUrl   absolute URL of the "after" photo
 * @param {string} o.outPath    output mp4 path
 * @param {string} [o.chromePath] chrome/chromium executable (default: local mac Chrome)
 * @param {string} [o.logoSvg]   inline logo svg (default: /public/logo_blu_nero.svg)
 * @param {string} [o.ffmpeg]    ffmpeg binary (default: 'ffmpeg' on PATH)
 * @returns {Promise<string>} outPath
 */
export async function renderSliderVideo({
  beforeUrl, afterUrl, outPath,
  chromePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  logoSvg,
  ffmpeg = 'ffmpeg',
} = {}) {
  const puppeteer = (await import('puppeteer-core')).default;
  const { W, H, FPS, SECONDS, CYCLES } = SLIDER_SPEC;
  const N = FPS * SECONDS;
  if (!logoSvg) logoSvg = await fs.readFile(path.join(REPO_ROOT, 'public/logo_blu_nero.svg'), 'utf8');

  const framesDir = path.join('/tmp', `slider_frames_${Date.now()}`);
  await fs.rm(framesDir, { recursive: true, force: true });
  await fs.mkdir(framesDir, { recursive: true });

  const html = sliderVideoHtml({ beforeUrl, afterUrl, logoSvg, W, H });
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--force-color-profile=srgb', '--hide-scrollbars'],
  });
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: W, height: H, deviceScaleFactor: 1 });
    await page.setContent(html, { waitUntil: 'networkidle0', timeout: 30000 });
    await page.evaluate(() => Promise.all([...document.images].map((i) => (i.complete ? 0 : new Promise((r) => { i.onload = i.onerror = r; })))));
    for (let i = 0; i < N; i++) {
      const x = sliderSweep(i / (N - 1), CYCLES);
      await page.evaluate((x) => {
        document.querySelector('.split-after').style.clipPath = `inset(0 0 0 ${x}%)`;
        document.querySelector('.divider').style.left = `${x}%`;
        document.querySelector('.divider-icon').style.left = `${x}%`;
      }, x);
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
