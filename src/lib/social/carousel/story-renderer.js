/**
 * Renders Instagram Story HTML → PNG Buffer (1080x1920)
 * Reuses Puppeteer setup from renderer.js
 */

import puppeteer from 'puppeteer-core';
import chromium from '@sparticuz/chromium';
import { buildStoryHTML } from './templates/story.js';

export async function renderStory(type, data) {
  const isLambda = !!process.env.AWS_LAMBDA_FUNCTION_NAME || !!process.env.VERCEL;
  const localChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
  const executablePath = isLambda ? await chromium.executablePath() : localChrome;

  const browser = await puppeteer.launch({
    args: isLambda
      ? [...chromium.args, '--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb', '--disable-features=VizDisplayCompositor']
      : ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage', '--force-color-profile=srgb'],
    defaultViewport: { width: 1080, height: 1920 },
    executablePath,
    headless: isLambda ? 'shell' : true,
  });

  try {
    const html = buildStoryHTML(type, data);
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'domcontentloaded', timeout: 15000 });
    const buffer = await page.screenshot({ type: 'jpeg', quality: 90 });
    await page.close();
    return buffer;
  } finally {
    await browser.close();
  }
}

/**
 * Renders all 5 daily stories given today's topics from Supabase.
 * Returns array of { type, label, buffer }
 */
export async function renderDailyStories(topics = []) {
  const newsM = topics.find(t => t.rubric === 'news' && t.edition === 'morning' && t.slide_data?.top5);
  const newsE = topics.find(t => t.rubric === 'news' && t.edition === 'evening' && t.slide_data?.top5);
  const rubrica = topics.find(t => t.category === 'carousel' && t.rubric !== 'news');
  const prompt = topics.find(t => t.category === 'prompt');
  const video = topics.find(t => t.category === 'video');

  const stories = [
    { type: 'news_morning', label: '☀️ News Mattina', data: { top5: newsM?.slide_data?.top5 || newsE?.slide_data?.top5 || [] } },
    { type: 'post',         label: '📚 Rubrica 12:00', data: { topic: rubrica || {} } },
    { type: 'video',        label: '🎬 Video 15:00',   data: { topic: video || {} } },
    { type: 'prompt',       label: '💡 Prompt 18:00',  data: { topic: prompt || {} } },
    { type: 'news_evening', label: '🌙 News Sera',     data: { top5: newsE?.slide_data?.top5 || newsM?.slide_data?.top5 || [] } },
  ];

  const results = [];
  for (const s of stories) {
    console.log(`  Rendering ${s.label}...`);
    const buffer = await renderStory(s.type, s.data);
    results.push({ ...s, buffer });
  }
  return results;
}
