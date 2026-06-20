// ─────────────────────────────────────────────────────────────────────────
//  Cloud render worker — renders the branded social video reels off the local
//  machine. Run on a small VM via cron (e.g. every 10 min). One-shot: it picks
//  up every `proposed` video topic, drives the edge (Flux/Kling) to produce the
//  raw frames/clips, runs the LOCKED headless templates to composite the final
//  MP4, uploads it, sets video_url, and marks the topic approved. Then exits.
//
//  This is the productionization of the video step: with this + the scheduled
//  monthly-plan + the publish crons, the whole pipeline runs unattended.
//
//  Env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY,
//       BATCH_STAGING_CRON_SECRET, CHROME_PATH (default /usr/bin/chromium),
//       LOGO_PATH (default ./assets/logo_blu_nero.svg).
// ─────────────────────────────────────────────────────────────────────────

import 'dotenv/config';
import fs from 'node:fs/promises';
import { createClient } from '@supabase/supabase-js';
import { renderSliderVideo } from '../src/lib/social/video-stories/slider-video.mjs';
import { renderDayNightVideo } from '../src/lib/social/video-stories/daynight-video.mjs';
import { concatSegments, renderConstructionVideo } from '../src/lib/social/video-stories/construction-video.mjs';
import { renderRevealVideo, REVEAL_BADGES } from '../src/lib/social/video-stories/reveal-video.mjs';
import { muxMusic } from '../src/lib/social/video-stories/video-music.mjs';

const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabase = createClient(SUPA, process.env.SUPABASE_SERVICE_ROLE_KEY);
const CRON = (process.env.BATCH_STAGING_CRON_SECRET || '').trim();
const CHROME = process.env.CHROME_PATH || '/usr/bin/chromium';
const FFMPEG = process.env.FFMPEG_PATH || 'ffmpeg';
const ACCOUNT = 'getnearme';
const MAX_PER_RUN = Number(process.env.MAX_PER_RUN || 8);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const pub = (p) => supabase.storage.from('content').getPublicUrl(p).data.publicUrl;
let logoSvg = '';

async function triggerEdge(body) {
  const r = await fetch(`${SUPA}/functions/v1/generate-social-video`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-cron-secret': CRON }, body: JSON.stringify(body),
  });
  try { return await r.json(); } catch { return { status: r.status }; }
}
async function waitFor(fn, { tries = 40, gap = 15000, label = '' } = {}) {
  for (let i = 0; i < tries; i++) { if (await fn()) return true; await sleep(gap); }
  throw new Error(`timeout waiting for ${label}`);
}
async function listFrames(id) { const { data } = await supabase.storage.from('content').list(`social-frames/${id}`); return (data || []).map((f) => f.name); }
async function uploadFinal(localPath, storagePath) {
  await supabase.storage.from('content').upload(storagePath, await fs.readFile(localPath), { contentType: 'video/mp4', upsert: true, cacheControl: 'no-cache' });
  return pub(storagePath);
}
async function setVideoUrl(id, url) {
  for (let i = 0; i < 12; i++) {
    const { data } = await supabase.from('generated_content').update({ video_url: url }).eq('topic_id', id).select('id');
    if (data && data.length) return;
    await sleep(5000);
  }
}

// Mux DIFFERENT random music for the reel vs the story, upload both, set each
// video_url separately. Returns the reel url.
async function finalizeMusic(out, baseName, topicId) {
  const reel = await muxMusic(out, { ffmpeg: FFMPEG });
  const story = await muxMusic(out, { ffmpeg: FFMPEG, exclude: reel.track ? [reel.track] : [], suffix: '_s' });
  const reelUrl = await uploadFinal(reel.path, `social-videos/${baseName}.mp4`);
  const storyUrl = await uploadFinal(story.path, `social-videos/${baseName}_story.mp4`);
  for (const [type, url] of [['reel', reelUrl], ['story', storyUrl]]) {
    for (let i = 0; i < 12; i++) {
      const { data } = await supabase.from('generated_content').update({ video_url: url }).eq('topic_id', topicId).eq('type', type).select('id');
      if (data && data.length) break;
      await sleep(5000);
    }
  }
  return reelUrl;
}

// ── Per-template drivers (mirror gen-week-posts.mjs) ──
async function driveSlider(t) {
  await triggerEdge({ topic_id: t.id });
  await waitFor(async () => { const n = await listFrames(t.id); return n.includes('before.jpg') && n.includes('after.jpg'); }, { label: 'slider frames' });
  const out = `/tmp/wk_${t.id}.mp4`;
  await renderSliderVideo({ beforeUrl: pub(`social-frames/${t.id}/before.jpg`), afterUrl: pub(`social-frames/${t.id}/after.jpg`), outPath: out, chromePath: CHROME, ffmpeg: FFMPEG, logoSvg });
  return finalizeMusic(out, `${t.plan_date}_slider_${t.slide_data?.slider_variant || 'x'}`, t.id);
}
async function driveDayNight(t) {
  await triggerEdge({ topic_id: t.id });
  await waitFor(async () => { await triggerEdge({ topic_id: t.id }); const n = await listFrames(t.id); return n.includes('daynight.mp4'); }, { gap: 20000, label: 'daynight kling' });
  const out = `/tmp/wk_${t.id}.mp4`;
  await renderDayNightVideo({ videoUrl: pub(`social-frames/${t.id}/daynight.mp4`), outPath: out, chromePath: CHROME, ffmpeg: FFMPEG, logoSvg });
  return finalizeMusic(out, `${t.plan_date}_daynight`, t.id);
}
async function driveConstruction(t) {
  await triggerEdge({ topic_id: t.id });
  await waitFor(async () => { await triggerEdge({ topic_id: t.id }); const n = await listFrames(t.id); return n.includes('seg1.mp4') && n.includes('seg2.mp4'); }, { gap: 25000, label: 'construction segments' });
  await concatSegments([pub(`social-frames/${t.id}/seg1.mp4`), pub(`social-frames/${t.id}/seg2.mp4`)], `/tmp/wk_${t.id}_base.mp4`, FFMPEG);
  const baseUrl = await uploadFinal(`/tmp/wk_${t.id}_base.mp4`, `social-frames/${t.id}/base.mp4`);
  const out = `/tmp/wk_${t.id}.mp4`;
  await renderConstructionVideo({ videoUrl: baseUrl, outPath: out, chromePath: CHROME, ffmpeg: FFMPEG, logoSvg });
  return finalizeMusic(out, `${t.plan_date}_construction`, t.id);
}
async function driveReveal(t) {
  await triggerEdge({ topic_id: t.id });
  await waitFor(async () => { await triggerEdge({ topic_id: t.id }); const n = await listFrames(t.id); return n.includes('reveal.mp4'); }, { gap: 20000, label: 'reveal kling' });
  const out = `/tmp/wk_${t.id}.mp4`;
  await renderRevealVideo({ videoUrl: pub(`social-frames/${t.id}/reveal.mp4`), badge: REVEAL_BADGES[t.template] || 'AI Staging', outPath: out, chromePath: CHROME, ffmpeg: FFMPEG, logoSvg });
  const kind = t.template === 'video_before_after_particle' ? 'particle' : 'stopmotion';
  return finalizeMusic(out, `${t.plan_date}_${kind}`, t.id);
}
function driveOne(t) {
  if (t.template === 'video_slider') return driveSlider(t);
  if (t.template === 'video_day_night') return driveDayNight(t);
  if (t.template === 'video_timelapse') return driveConstruction(t);
  if (t.template === 'video_before_after_stopmotion' || t.template === 'video_before_after_particle') return driveReveal(t);
  throw new Error(`unknown video template ${t.template}`);
}

async function main() {
  if (!CRON) { console.error('BATCH_STAGING_CRON_SECRET missing'); process.exit(1); }
  logoSvg = await fs.readFile(process.env.LOGO_PATH || new URL('./assets/logo_blu_nero.svg', import.meta.url), 'utf8');

  // Render the near horizon so we never fall behind: today .. +21 days.
  const today = new Date().toISOString().slice(0, 10);
  const horizon = new Date(Date.now() + 21 * 86400000).toISOString().slice(0, 10);
  const { data: topics, error } = await supabase
    .from('content_topics')
    .select('id, plan_date, template, slide_data')
    .eq('account_id', ACCOUNT).eq('rubric', 'video').eq('status', 'proposed')
    .gte('plan_date', today).lte('plan_date', horizon)
    .order('plan_date').limit(MAX_PER_RUN);
  if (error) { console.error('query error', error.message); process.exit(1); }
  if (!topics?.length) { console.log('no pending video topics'); return; }

  console.log(`rendering ${topics.length} video topic(s)`);
  // Sequential — concurrent Kling STARTs are unreliable (they die under load).
  for (const t of topics) {
    try {
      console.log(`→ ${t.template} ${t.plan_date} (${t.id.slice(0, 8)})`);
      await driveOne(t);
      await supabase.from('content_topics').update({ status: 'approved' }).eq('id', t.id);
      console.log(`  ✓ ${url}`);
    } catch (e) { console.error(`  ✗ ${t.template} ${t.plan_date}: ${e.message}`); }
  }
  console.log('done');
}

main().then(() => process.exit(0)).catch((e) => { console.error('fatal', e); process.exit(1); });
