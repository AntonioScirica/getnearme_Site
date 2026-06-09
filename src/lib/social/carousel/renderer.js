import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { buildSlideHTML } from './templates/pop.js';
import { buildNewsSlideHTML } from './templates/news.js';
import { generateNewsImage } from '../ai/image.js';

chromium.setHeadlessMode = 'shell';
chromium.setGraphicsMode = false;

/**
 * Download image and convert to base64 data URL.
 * Returns empty string on failure. Resizes to max 800px width via canvas would
 * require sharp — for now we inline the full image (most article images are <500KB).
 */
async function fetchImageAsBase64(url) {
  if (!url) return '';
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'AIForDumbs/1.0' },
    });
    clearTimeout(timeout);
    if (!res.ok) return '';
    const contentType = res.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await res.arrayBuffer());
    // Skip if too large (>2MB)
    if (buffer.length > 2 * 1024 * 1024) return '';
    return `data:${contentType};base64,${buffer.toString('base64')}`;
  } catch {
    return '';
  }
}

/**
 * Generate a gradient placeholder as SVG data URL.
 * Used when article has no image and Flux generation failed.
 */
function gradientPlaceholder(index = 0) {
  const palettes = [
    ['#7C3AED', '#4F46E5'],
    ['#2563EB', '#0EA5E9'],
    ['#7C3AED', '#EC4899'],
    ['#059669', '#0D9488'],
    ['#DC2626', '#F59E0B'],
  ];
  const [c1, c2] = palettes[index % palettes.length];
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="590">
    <defs>
      <linearGradient id="g" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stop-color="${c1}" stop-opacity="0.85"/>
        <stop offset="100%" stop-color="${c2}" stop-opacity="0.85"/>
      </linearGradient>
      <radialGradient id="glow" cx="30%" cy="40%">
        <stop offset="0%" stop-color="#fff" stop-opacity="0.15"/>
        <stop offset="100%" stop-color="#fff" stop-opacity="0"/>
      </radialGradient>
    </defs>
    <rect width="1024" height="590" fill="url(#g)"/>
    <rect width="1024" height="590" fill="url(#glow)"/>
    <circle cx="200" cy="150" r="180" fill="#fff" fill-opacity="0.04"/>
    <circle cx="800" cy="400" r="120" fill="#fff" fill-opacity="0.03"/>
  </svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

/**
 * Pre-fetch images for all slides that have image_url.
 * If article image fails to download, generate with Flux.
 * If Flux also fails, use gradient placeholder as last resort.
 */
async function prefetchSlideImages(slides) {
  // Step 1: Try fetching article images
  await Promise.allSettled(slides.map(async (slide) => {
    if (slide.image_url && !slide.image_base64) {
      try {
        slide.image_base64 = await fetchImageAsBase64(slide.image_url);
        if (!slide.image_base64) {
          console.log(`  ⚠ Article image failed: ${slide.image_url?.slice(0, 80)}`);
        }
      } catch (err) {
        console.error(`  ✗ Image fetch crashed: ${err.message}`);
      }
    }
  }));

  // Step 2: Generate Flux images for content slides still missing images
  const needsFlux = slides.filter(
    s => (s.type === 'news_item' || s.type === 'content') && !s.image_base64
  );

  if (needsFlux.length > 0) {
    console.log(`Generating Flux images for ${needsFlux.length} slides with broken/missing article images...`);
    await Promise.allSettled(needsFlux.map(async (slide) => {
      try {
        const fluxUrl = await generateNewsImage(slide.title || slide.headline, slide.body);
        if (fluxUrl) {
          slide.image_base64 = await fetchImageAsBase64(fluxUrl);
          if (slide.image_base64) {
            console.log(`  ✓ Flux image for: ${slide.title || slide.headline}`);
          }
        }
      } catch (err) {
        console.error(`  ✗ Flux crashed for: ${slide.title || slide.headline}: ${err.message}`);
      }
    }));
  }

  // Step 3: Last-chance retry for any still missing (one at a time, no parallel)
  for (const slide of slides) {
    if ((slide.type === 'news_item' || slide.type === 'content') && !slide.image_base64) {
      console.log(`  ⚠ Last-chance Flux retry for: ${slide.title || slide.headline}`);
      try {
        const fluxUrl = await generateNewsImage(slide.title || slide.headline, slide.body);
        if (fluxUrl) {
          slide.image_base64 = await fetchImageAsBase64(fluxUrl);
        }
      } catch (err) {
        console.error(`  ✗ Last-chance failed: ${err.message}`);
      }
      // Absolute last resort: gradient (should never happen with 5 Flux retries)
      if (!slide.image_base64) {
        console.error(`  ✗✗ ALL image methods failed for: ${slide.title || slide.headline}. Using gradient.`);
        slide.image_base64 = gradientPlaceholder(slides.indexOf(slide));
      }
    }
  }
}

export async function renderCarousel(carouselContent, template = 'pop', rubric = 'news') {
  // Pre-fetch images before launching browser (parallel downloads)
  await prefetchSlideImages(carouselContent.slides);

  // Use system Chrome on local (macOS), Lambda Chromium on Vercel
  const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL;
  const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const executablePath = isLambda ? await chromium.executablePath() : localChrome;
  const browser = await puppeteer.launch({
    args: isLambda
      ? [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu', '--single-process']
      : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
    defaultViewport: { width: 1080, height: 1350 },
    executablePath,
    headless: true,
  });

  const page = await browser.newPage();
  const images = [];
  const totalSlides = carouselContent.slides.length;

  for (let i = 0; i < totalSlides; i++) {
    const slide = carouselContent.slides[i];
    const html = template === 'news'
      ? buildNewsSlideHTML(slide, i + 1, totalSlides)
      : buildSlideHTML(slide, i + 1, totalSlides, rubric);

    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const buffer = await page.screenshot({ type: 'png' });
    images.push(buffer);
  }

  await browser.close();
  return images;
}
