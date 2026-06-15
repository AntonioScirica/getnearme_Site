// Puppeteer renderer for PED slides (server-side).
// Renders HTML strings (from ped/templates.js) to PNG buffers.

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { wrapHtml } from './templates.js';

chromium.setHeadlessMode = 'shell';
chromium.setGraphicsMode = false;

/**
 * Render a list of slides to PNG buffers.
 * Uses a fresh page per slide + retry to avoid "frame was detached" errors.
 * @param {Array<{html: string, label?: string}>} slides — inner HTML per slide
 * @param {string} css — stylesheet (PED_CSS or STORY_CSS)
 * @param {{width: number, height: number}} viewport
 * @param {(msg: string) => void} [log] — optional progress logger
 * @returns {Promise<Buffer[]>}
 */
export async function renderPedSlides(slides, css, viewport = { width: 1080, height: 1350 }, log = () => {}) {
  const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL;
  const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const executablePath = isLambda ? await chromium.executablePath() : localChrome;

  log(`renderer: launching chrome (${isLambda ? 'lambda' : 'local'}), ${slides.length} slide`);

  const browser = await puppeteer.launch({
    args: isLambda
      ? [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process']
      : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    defaultViewport: viewport,
    executablePath,
    headless: true,
  });

  try {
    const images = [];

    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const doc = wrapHtml(slide.html, css);
      let lastErr = null;

      // Retry up to 2 times per slide, fresh page each attempt
      for (let attempt = 1; attempt <= 2; attempt++) {
        let page = null;
        try {
          page = await browser.newPage();
          await page.setViewport(viewport);
          await page.setContent(doc, { waitUntil: 'load', timeout: 30000 });
          // Wait for Satoshi webfont; don't fail the slide if fonts hang
          try {
            await Promise.race([
              page.evaluate(() => document.fonts.ready),
              new Promise((r) => setTimeout(r, 8000)),
            ]);
          } catch { /* fonts not critical */ }
          // Small settle delay for layout
          await new Promise((r) => setTimeout(r, 300));
          // JPEG: IG Graph API accetta solo JPEG per i post immagine (PNG rifiutato).
          const buffer = await page.screenshot({ type: 'jpeg', quality: 90 });
          images.push(buffer);
          log(`renderer: slide ${i + 1}/${slides.length} (${slide.label || ''}) ok${attempt > 1 ? ` al tentativo ${attempt}` : ''}`);
          lastErr = null;
          break;
        } catch (err) {
          lastErr = err;
          log(`renderer: slide ${i + 1} tentativo ${attempt} FALLITO: ${err.message}`);
        } finally {
          if (page) { try { await page.close(); } catch { /* already gone */ } }
        }
      }

      if (lastErr) throw new Error(`Slide ${i + 1} (${slide.label || '?'}): ${lastErr.message}`);
    }

    return images;
  } finally {
    try { await browser.close(); } catch { /* already closed */ }
  }
}
