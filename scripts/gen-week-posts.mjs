// Reusable generator: a full week of social content for the calendar.
//  - POSTS: per day 3 feed posts (rubric-driven) + 1 tip, written by Claude.
//  - VIDEOS: 5 reels/week, fully generated + rendered end-to-end:
//      Mon/Wed/Fri = before/after SLIDER (variants empty→furnished / furnished→
//      empty / old→modern), Tue = CONSTRUCTION (scavo→casa), Sat = DAY/NIGHT.
//    Each: edge generate-social-video makes the AI frames/clips (Flux/Kling) and
//    re-hosts them, then the locked headless templates (slider/daynight/
//    construction-video.mjs) render the final branded MP4 + set video_url.
//
// Usage:
//   node scripts/gen-week-posts.mjs                 # week AFTER the latest existing week
//   node scripts/gen-week-posts.mjs 2026-06-29      # week starting on this Monday
//   node scripts/gen-week-posts.mjs 2026-06-29 --replace   # wipe that week's non-news topics first
//   node scripts/gen-week-posts.mjs --no-video      # posts only (skip the 5 videos)
//
// Requires (for videos): BATCH_STAGING_CRON_SECRET in env, local Chrome + ffmpeg.
// In-scope = GetNearMe web AI content suite (staging/video/post/avatar/team).
// NEVER analysis/OMI/mappa/report (extension-only). Concise, grammar, clean splits.

import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import fs from 'node:fs/promises';
import Anthropic from '@anthropic-ai/sdk';
import { createClient } from '@supabase/supabase-js';
import { renderSliderVideo } from '../src/lib/social/video-stories/slider-video.mjs';
import { renderDayNightVideo } from '../src/lib/social/video-stories/daynight-video.mjs';
import { concatSegments, renderConstructionVideo } from '../src/lib/social/video-stories/construction-video.mjs';
import { renderRevealVideo, REVEAL_BADGES } from '../src/lib/social/video-stories/reveal-video.mjs';
import { muxMusic } from '../src/lib/social/video-stories/video-music.mjs';

const anthropic = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY || '').trim() });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const accountId = 'getnearme';

// Log a Claude call to api_usage so the realtime costs page reflects it.
// Inline (the shared cost-tracker imports a supabase client with different env).
async function trackAnthropic(operation, usage) {
  try {
    const cost = (usage?.input_tokens || 0) * 3 / 1e6 + (usage?.output_tokens || 0) * 15 / 1e6;
    await supabase.from('api_usage').insert({
      service: 'anthropic', model: 'claude-sonnet-4-6', operation,
      input_tokens: usage?.input_tokens || 0, output_tokens: usage?.output_tokens || 0, cost_usd: cost,
    });
  } catch { /* non-blocking */ }
}

// ── Rubric per weekday (mirrors monthly-planner RUBRIC_SCHEDULE) ──
const RUBRIC_BY_DOW = {
  1: { rubric: 'education', main: 'ped-carosello-edu' },   // Mon
  2: { rubric: 'people', main: 'ped-post-singolo' },        // Tue
  3: { rubric: 'myths', main: 'ped-post-singolo' },         // Wed
  4: { rubric: 'tools', main: 'ped-carosello-feature' },    // Thu
  5: { rubric: 'world', main: 'ped-carosello-dati' },       // Fri
  6: { rubric: 'question', main: 'ped-post-singolo' },       // Sat
  0: { rubric: 'education', main: 'ped-carosello-edu' },     // Sun
};

// Extra feed templates to rotate for variety (besides the day's main).
const EXTRA_FEEDS = ['ped-post-singolo', 'ped-carosello-dati', 'ped-carosello-feature'];
// Themes/features to cover across the week (suite + save-money + occasional team).
const ANGLES = [
  'risparmio di tempo: creare i contenuti in minuti invece di ore',
  'staging AI: arredare le foto di stanze vuote',
  'video AI: trasformare le foto in video tour',
  'post social: template pronti per ogni immobile',
  'avatar parlante: presentare gli immobili senza telecamera',
  'risparmio di soldi: una suite sola al posto di Canva + editor + fotografo',
  'team multi-seat: tutta l\'agenzia con lo stesso brand',
  'prima impressione online: foto e annunci che si fanno notare',
  'coerenza del brand: ogni post con lo stesso stile dell\'agenzia',
  'velocita di risposta: pubblicare l\'immobile appena acquisito',
  'differenziarsi dai colleghi con contenuti curati senza agenzia esterna',
  'rivalutare immobili difficili da vendere con una presentazione nuova',
  'caroselli e reel pronti: dal listing al post in pochi clic',
  'autorevolezza: l\'agente che comunica come un professionista del marketing',
  'meno strumenti, piu risultati: tutto in un unico posto',
];

const SCHEMAS = `
ped-carosello-edu: { "num":"5","title":"<inizio cover>","titleHL":"<fine evidenziata>","items":[{"title":"<2-3 parole>","text":"<max 12 parole>","tip":"<max 10 parole, azione con GetNearMe>"} x5],"ctaKicker":"<riga>","ctaTitle":"<max 9 parole>","ctaHL":"<2-3 parole>","badgeColor":"blue","ctaPill":"DEMO","ctaSub":"Commenta DEMO e ricevi il link per la prova gratuita.","storyHook":"<inizio>","storyHookHL":"<fine>","storySub":"<frase breve>" }
ped-carosello-feature: { "coverTitle":"<inizio, es 'Homestaging AI:'>","coverHL":"<fine>","noText":"<problema>","noSub":"<conseguenza breve>","yesText":"<con GetNearMe>","yesSub":"<beneficio breve>","cases":[{"title":"<quando>","text":"<max 9 parole>"} x3],"ctaKicker":"...","ctaTitle":"<max 9 parole>","ctaHL":"<2-3 parole>","badgeColor":"blue","ctaPill":"DEMO","ctaSub":"Commenta DEMO e ricevi il link per provare.","storyHook":"<inizio>","storyHookHL":"<fine>","storySub":"..." }
ped-carosello-dati: { "badge":"Social","badgeColor":"blue","stat":"<numero tondo>","unit":"<x o %>","delta":"<+ breve>","statLabel":"<max 10 parole>","title":"<inizio>","titleHL":"<fine>","kicker":"Perche conta","insight":"<max 16 parole, <strong>>","cardLabel":"In pratica","cardValue":"<azione breve>","valueTitle":"<inizio>","valueHL":"<fine>","actions":[{"text":"<azione>","sub":"<max 8 parole>"} x3],"ctaKicker":"...","ctaTitle":"<max 9 parole>","ctaHL":"<2-3 parole>","ctaPill":"DEMO","ctaSub":"Commenta DEMO e ricevi il link per provare.","storyHook":"<inizio>","storyHookHL":"<fine>","storySub":"..." }
ped-post-singolo: { "badge":"<Storie|Miti & Realta|Domanda|Per agenti>","badgeColor":"<blue o amber>","kicker":"<riga sopra>","hook":"<inizio frase>","hookHL":"<fine frase>","body":"<max 18 parole, <strong>>","ctaPill":"DEMO","ctaHint":"<max 9 parole>","storyHook":"<inizio>","storyHookHL":"<fine>","storySub":"<frase breve>" }
ped-tip: { "tipNum":"1","scenario":"<2 parole>","title":"<inizio>","titleHL":"<fine>","body":"<max 16 parole, <strong>>","how":"<come fare, 1 frase breve>" }
`;

const RULES = `GetNearMe = suite AI che crea i contenuti marketing degli immobili: staging AI (arreda foto stanze vuote), video AI (foto -> video tour/reel), template post social, avatar parlante, gestione team multi-seat. Sostituisce Canva + editor video + lavoro manuale, costa meno della somma.
REGOLE:
- Pubblico = AGENTI immobiliari, non compratori. Parla all'agente: presentare meglio gli immobili, farsi scegliere, risparmiare tempo e soldi.
- FUORI SCOPE, NON nominare MAI: analisi zona, prezzi/OMI, mappa servizi, punteggio immobile, report PDF (sono dell'estensione).
- SINTESI: frasi corte, dritto al punto. Rispetta i limiti di parole degli schemi.
- GRAMMATICA italiana perfetta. Niente trattino lungo (virgole). "starci davanti" non "startci".
- NIENTE RIPETIZIONI dentro lo stesso post.
- MECCANICA base+HL: i campi in coppia (title/titleHL, hook/hookHL, coverTitle/coverHL, ctaTitle/ctaHL, valueTitle/valueHL, storyHook/storyHookHL) vengono concatenati "<base> <HL>". L'HL e la PARTE FINALE della frase, mai ripetuta. La base NON finisce con preposizione/congiunzione/articolo. La frase completa deve essere grammaticale.`;

// ── base/HL split cleanup ──
const CONN = new Set(['come','e','ed','o','di','del','della','dei','delle','a','al','alla','ai','agli','alle','per','che','con','su','in','da','il','lo','la','le','i','gli','un','una','ma','se','non','ne','anche','gia','ogni','tuo','tua','tuoi','tue']);
const PAIRS = [['title','titleHL'],['hook','hookHL'],['coverTitle','coverHL'],['ctaTitle','ctaHL'],['valueTitle','valueHL'],['storyHook','storyHookHL']];
const norm = (w) => w.toLowerCase().replace(/[.,!?;:]/g, '');
function cleanSplits(sd) {
  for (const [a, h] of PAIRS) {
    if (!sd[a] || !sd[h]) continue;
    let b = sd[a].trim().split(/\s+/); const moved = [];
    while (b.length > 1 && moved.length < 2) {
      const last = b[b.length - 1];
      if (last === 'AI' || last === 'AI:' || !CONN.has(norm(last))) break;
      moved.unshift(b.pop());
    }
    if (moved.length) { sd[a] = b.join(' '); sd[h] = (moved.join(' ') + ' ' + sd[h].trim()).trim(); }
  }
  return sd;
}
function detectCoverArt(theme) {
  const t = (theme || '').toLowerCase();
  if (/staging|arreda|stanze vuote/.test(t)) return 'staging';
  if (/video|tour|reel/.test(t)) return 'video';
  if (/avatar/.test(t)) return 'avatar';
  if (/post social|template|social/.test(t)) return 'post';
  if (/team|multi-seat|agenzia/.test(t)) return 'team';
  return null;
}
function titleOf(template, sd) {
  if (template === 'ped-carosello-edu' || template === 'ped-carosello-dati' || template === 'ped-tip') return `${sd.title || ''} ${sd.titleHL || ''}`.trim();
  if (template === 'ped-carosello-feature') return `${sd.coverTitle || ''} ${sd.coverHL || ''}`.trim();
  if (template === 'ped-post-singolo') return `${sd.hook || ''} ${sd.hookHL || ''}`.trim();
  return 'Post';
}

const RUBRIC_DESC = {
  education: 'tutorial pratico per agenti su come creare contenuti migliori con l\'AI (staging foto, video, post, avatar)',
  people: 'storia di un agente/agenzia che ha rinnovato la presentazione degli immobili con contenuti AI',
  myths: 'sfata un mito su marketing immobiliare e contenuti AI',
  tools: 'spotlight su UNA feature della suite (staging/video/post/avatar/team) con caso d\'uso concreto',
  world: 'dato sul marketing immobiliare video-first / contenuti digitali, utile all\'agente',
  question: 'domanda provocatoria per agenti su marketing, contenuti, AI',
};

// Pull the titles + hooks already used in the recent past so Claude can avoid
// repeating them. Looks back ~6 weeks of non-news/non-video topics.
async function fetchRecentContext(beforeDate) {
  const since = new Date(`${beforeDate}T12:00:00`);
  since.setDate(since.getDate() - 42);
  const sinceStr = since.toISOString().split('T')[0];
  const { data } = await supabase
    .from('content_topics')
    .select('title, slide_data, plan_date')
    .eq('account_id', accountId)
    .not('rubric', 'in', '(news,video)')
    .gte('plan_date', sinceStr)
    .lt('plan_date', beforeDate)
    .order('plan_date', { ascending: false })
    .limit(150);
  const lines = [];
  for (const t of data || []) {
    const sd = t.slide_data || {};
    const hook = [sd.hook, sd.hookHL].filter(Boolean).join(' ') ||
      [sd.title, sd.titleHL].filter(Boolean).join(' ') ||
      [sd.coverTitle, sd.coverHL].filter(Boolean).join(' ') || t.title;
    if (hook) lines.push(`- ${hook.replace(/<[^>]+>/g, '').trim()}`);
  }
  return lines.slice(0, 120).join('\n');
}

// Read the latest performance analysis (produced by ped-analyze) so the
// copywriter calibrates on what actually performed. Empty until ped-analyze runs.
async function fetchInsightCalibration() {
  const { data } = await supabase
    .from('performance_insights')
    .select('insights')
    .eq('account_id', accountId)
    .order('week_end', { ascending: false })
    .limit(1)
    .maybeSingle();
  const ai = data?.insights?.ai_analysis;
  if (!ai) return '';
  const adj = ai.planner_adjustments || {};
  return [
    Array.isArray(ai.rubric_ranking) && ai.rubric_ranking.length ? `Rubriche che performano (meglio→peggio): ${ai.rubric_ranking.join(' > ')}` : '',
    ai.best_hook_pattern ? `Ganci che funzionano: ${ai.best_hook_pattern}` : '',
    ai.worst_pattern ? `Da evitare: ${ai.worst_pattern}` : '',
    adj.increase_rubric ? `Dai più spazio a: ${adj.increase_rubric}` : '',
    adj.hook_style ? `Stile ganci consigliato: ${adj.hook_style}` : '',
    adj.tone_adjustment ? `Tono: ${adj.tone_adjustment}` : '',
  ].filter(Boolean).join('\n');
}

async function genDay(date, dow, weekIdx, avoidList, calib) {
  const { rubric, main } = RUBRIC_BY_DOW[dow];
  // 3 feed: main (rubric) + 2 extra rotated, + 1 tip
  const e1 = EXTRA_FEEDS[(dow + weekIdx) % EXTRA_FEEDS.length];
  const e2 = EXTRA_FEEDS[(dow + weekIdx + 1) % EXTRA_FEEDS.length];
  const a1 = ANGLES[(dow + weekIdx) % ANGLES.length];
  const a2 = ANGLES[(dow + weekIdx + 3) % ANGLES.length];
  const slots = [
    { t: main, r: rubric, theme: `Rubrica del giorno (${rubric}): ${RUBRIC_DESC[rubric]}` },
    { t: e1, r: 'education', theme: a1 },
    { t: e2, r: 'education', theme: a2 },
    { t: 'ped-tip', r: 'tip', theme: `consiglio pratico per agenti su ${a1}` },
  ];
  const list = slots.map((s, i) => `${i}) template=${s.t} | tema: ${s.theme}`).join('\n');
  const avoidBlock = avoidList
    ? `\nGIÀ PUBBLICATI nelle settimane scorse (NON ripetere questi ganci, titoli, esempi o concetti — proponi angolazioni, esempi e formulazioni NUOVE e diverse):\n${avoidList}\n`
    : '';
  const calibBlock = calib
    ? `\nCALIBRAZIONE DAI DATI (cosa ha funzionato sui post già pubblicati — seguila per migliorare i risultati):\n${calib}\n`
    : '';
  const prompt = `Sei il copywriter di @getnearme_app per AGENTI IMMOBILIARI italiani.
${RULES}

Genera il contenuto per questi ${slots.length} post del ${date}, rispettando ESATTAMENTE lo schema del template indicato. Varia gli argomenti, non ripetere concetti tra i post.
${calibBlock}${avoidBlock}
${list}

SCHEMI:
${SCHEMAS}

Rispondi SOLO con JSON valido: { "posts": [ <slide_data nell'ordine 0..${slots.length - 1}> ] }`;

  const res = await anthropic.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 8000, messages: [{ role: 'user', content: prompt }] });
  await trackAnthropic('gen-week-posts', res.usage);
  const m = res.content[0].text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('no JSON for ' + date);
  const posts = JSON.parse(m[0].replace(/,\s*([}\]])/g, '$1').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')).posts;
  return slots.map((s, i) => ({ slot: s, sd: posts[i] || {} }));
}

// ── Resolve start date ──
function dateStr(d) { return d.toISOString().split('T')[0]; }
async function resolveStart(arg) {
  if (arg && /^\d{4}-\d{2}-\d{2}$/.test(arg)) return arg;
  // default: Monday after the latest existing non-news plan_date
  const { data } = await supabase.from('content_topics').select('plan_date').eq('account_id', accountId).neq('rubric', 'news').order('plan_date', { ascending: false }).limit(1);
  const last = data?.[0]?.plan_date ? new Date(`${data[0].plan_date}T12:00:00`) : new Date();
  // go to the Monday after the last date's week
  const d = new Date(last);
  const dow = d.getDay();
  const daysToNextMon = ((8 - dow) % 7) || 7;
  d.setDate(d.getDate() + daysToNextMon);
  return dateStr(d);
}

const args = process.argv.slice(2);
const startArg = args.find((a) => /^\d{4}-\d{2}-\d{2}$/.test(a));
const replace = args.includes('--replace');
const noVideo = args.includes('--no-video');
const start = await resolveStart(startArg);
const startDate = new Date(`${start}T12:00:00`);
const dates = Array.from({ length: 7 }, (_, i) => { const d = new Date(startDate); d.setDate(d.getDate() + i); return dateStr(d); });
const weekIdx = Math.floor(startDate.getTime() / (7 * 864e5)); // for angle rotation variety

console.log(`Generating posts (no video) for week ${dates[0]} → ${dates[6]}${replace ? ' [replace]' : ''}`);

if (replace) {
  const { count } = await supabase.from('content_topics').delete({ count: 'exact' }).eq('account_id', accountId).neq('rubric', 'news').in('plan_date', dates);
  console.log(`replaced: removed ${count ?? 0} existing topics`);
}

// Fetch what was already published recently → fed to Claude to avoid repeats.
const avoidList = await fetchRecentContext(dates[0]);
console.log(`anti-repeat: ${avoidList ? avoidList.split('\n').length : 0} ganci recenti passati al copywriter per non ripeterli`);
// Fetch the latest performance analysis → calibrate the copy on what worked.
const calib = await fetchInsightCalibration();
console.log(`calibrazione dai dati: ${calib ? 'attiva' : 'nessuna (ped-analyze non ha ancora prodotto analisi)'}`);

let total = 0;
for (const date of dates) {
  const dow = new Date(`${date}T12:00:00`).getDay();
  process.stdout.write(`${date}... `);
  let day;
  try { day = await genDay(date, dow, weekIdx, avoidList, calib); } catch (e) { console.log('FAIL', e.message); continue; }
  const rows = day.map(({ slot, sd }) => {
    const s = cleanSplits({ ...sd });
    if (slot.t === 'ped-tip') s.tipNum = s.tipNum || '1';
    if (slot.t === 'ped-carosello-feature') { const art = detectCoverArt(slot.theme); if (art) s.coverArt = art; }
    return {
      plan_date: date, rubric: slot.r,
      category: slot.t === 'ped-tip' ? 'prompt' : 'carousel',
      template: slot.t,
      title: titleOf(slot.t, s).slice(0, 120),
      summary: (s.body || s.insight || s.ctaTitle || '').replace(/<[^>]+>/g, '').slice(0, 200),
      status: 'approved', edition: null, account_id: accountId, slide_data: s,
    };
  });
  const { error } = await supabase.from('content_topics').insert(rows);
  if (error) { console.log('insert err', error.message); continue; }
  total += rows.length; console.log(`ok (${rows.length})`);
}
console.log(`\nPosts done: ${total} across ${dates.length} days.`);

// ─────────────────────────────────────────────────────────────────────────
//  VIDEOS — 7 reels/week (one per day), generated by the edge (Flux/Kling) +
//  rendered by the locked headless templates. Fully automatic from this command.
// ─────────────────────────────────────────────────────────────────────────
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const SUPA = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CRON = (process.env.BATCH_STAGING_CRON_SECRET || '').trim();
const pub = (p) => supabase.storage.from('content').getPublicUrl(p).data.publicUrl;
const dateForDow = (targetDow) => dates.find((d) => new Date(`${d}T12:00:00`).getDay() === targetDow);

// dow → reel. One per day. Slider is Flux-only (sync); the others are Kling
// (queue→finalize). Reveals (stop-motion/particle) share reveal-video.mjs.
const VIDEO_PLAN = [
  { dow: 1, template: 'video_slider', variant: 'empty_to_furnished', label: 'Slider vuoto→arredato' },
  { dow: 2, template: 'video_timelapse', label: 'Costruzione scavo→casa' },
  { dow: 3, template: 'video_slider', variant: 'furnished_to_empty', label: 'Slider pieno→vuoto' },
  { dow: 4, template: 'video_before_after_stopmotion', label: 'Stop motion' },
  { dow: 5, template: 'video_slider', variant: 'old_to_modern', label: 'Slider vecchio→stile nuovo' },
  { dow: 6, template: 'video_day_night', label: 'Giorno→notte' },
  { dow: 0, template: 'video_before_after_particle', label: 'Effetto polvere' },
];

async function triggerEdge(body) {
  const r = await fetch(`${SUPA}/functions/v1/generate-social-video`, {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'x-cron-secret': CRON }, body: JSON.stringify(body),
  });
  try { return await r.json(); } catch { return { status: r.status }; }
}
async function waitFor(fn, { tries = 45, gap = 10000, label = '' } = {}) {
  for (let i = 0; i < tries; i++) { const v = await fn(); if (v) return v; await sleep(gap); }
  throw new Error(`timeout waiting for ${label}`);
}
async function listFrames(id) { const { data } = await supabase.storage.from('content').list(`social-frames/${id}`); return (data || []).map((f) => f.name); }
async function uploadFinal(localPath, storagePath) {
  await supabase.storage.from('content').upload(storagePath, await fs.readFile(localPath), { contentType: 'video/mp4', upsert: true, cacheControl: 'no-cache' });
  return pub(storagePath);
}
async function setVideoUrl(id, url) {
  // The edge inserts the reel/story rows in the background; retry until they
  // exist so the update never silently matches 0 rows.
  for (let i = 0; i < 12; i++) {
    const { data } = await supabase.from('generated_content').update({ video_url: url }).eq('topic_id', id).select('id');
    if (data && data.length) return data.length;
    await sleep(5000);
  }
  console.log(`  warn: no generated_content rows to set video_url for ${id}`);
  return 0;
}

// Short in-scope captions for the 5 videos (one Claude call).
async function genVideoCaptions(plan) {
  const list = plan.map((p, i) => `${i}) ${p.label}`).join('\n');
  const prompt = `Sei il copywriter di @getnearme_app per AGENTI immobiliari.
${RULES}
Per ognuno di questi ${plan.length} REEL video, scrivi una caption breve.
${list}
Ogni reel mostra una trasformazione AI fatta con GetNearMe (foto/immobile). Parla all'agente: presenta meglio gli immobili, risparmia tempo.
Rispondi SOLO JSON: { "caps": [ { "hook":"<gancio max 8 parole>", "body":"<max 20 parole>", "caption":"<caption IG max 30 parole + 1 CTA 'Commenta DEMO'>" } x${plan.length} ] }`;
  try {
    const res = await anthropic.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 2000, messages: [{ role: 'user', content: prompt }] });
    await trackAnthropic('gen-week-video-captions', res.usage);
    const m = res.content[0].text.match(/\{[\s\S]*\}/);
    return JSON.parse(m[0].replace(/,\s*([}\]])/g, '$1')).caps;
  } catch { return plan.map((p) => ({ hook: p.label, body: '', caption: 'Realizzato con GetNearMe. Commenta DEMO per la prova gratuita.' })); }
}

// Mux DIFFERENT random music for the reel vs the story, upload both, set each
// video_url separately. Returns the reel url (for logging).
async function finalizeMusic(out, baseName, topicId) {
  const reel = await muxMusic(out);
  const story = await muxMusic(out, { exclude: reel.track ? [reel.track] : [], suffix: '_s' });
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

// ── Per-template drivers: each renders + returns the final hosted MP4 url ──
// Slider is Flux-only (sync): it triggers its own generation then renders.
async function driveSlider(t) {
  await triggerEdge({ topic_id: t.id });
  await waitFor(async () => { const n = await listFrames(t.id); return n.includes('before.jpg') && n.includes('after.jpg'); }, { label: `${t.label} frames` });
  const out = `/tmp/wk_${t.id}.mp4`;
  await renderSliderVideo({ beforeUrl: pub(`social-frames/${t.id}/before.jpg`), afterUrl: pub(`social-frames/${t.id}/after.jpg`), outPath: out });
  return finalizeMusic(out, `${t.date}_slider_${t.variant}`, t.id);
}
// Kling drivers assume START was already kicked (queue→finalize). They poll-
// trigger finalize until the clip(s) are re-hosted, then render the overlay.
async function driveDayNight(t) {
  await waitFor(async () => { await triggerEdge({ topic_id: t.id }); const n = await listFrames(t.id); return n.includes('daynight.mp4'); }, { gap: 20000, tries: 30, label: `${t.label} kling` });
  const out = `/tmp/wk_${t.id}.mp4`;
  await renderDayNightVideo({ videoUrl: pub(`social-frames/${t.id}/daynight.mp4`), outPath: out });
  return finalizeMusic(out, `${t.date}_daynight`, t.id);
}
async function driveConstruction(t) {
  await waitFor(async () => { await triggerEdge({ topic_id: t.id }); const n = await listFrames(t.id); return n.includes('seg1.mp4') && n.includes('seg2.mp4'); }, { gap: 25000, tries: 30, label: `${t.label} segments` });
  await concatSegments([pub(`social-frames/${t.id}/seg1.mp4`), pub(`social-frames/${t.id}/seg2.mp4`)], `/tmp/wk_${t.id}_base.mp4`);
  const baseUrl = await uploadFinal(`/tmp/wk_${t.id}_base.mp4`, `social-frames/${t.id}/base.mp4`);
  const out = `/tmp/wk_${t.id}.mp4`;
  await renderConstructionVideo({ videoUrl: baseUrl, outPath: out });
  return finalizeMusic(out, `${t.date}_construction`, t.id);
}
// Stop-motion + particle: single Kling reveal clip → reveal.mp4 → overlay.
async function driveReveal(t) {
  await waitFor(async () => { await triggerEdge({ topic_id: t.id }); const n = await listFrames(t.id); return n.includes('reveal.mp4'); }, { gap: 20000, tries: 30, label: `${t.label} kling` });
  const out = `/tmp/wk_${t.id}.mp4`;
  await renderRevealVideo({ videoUrl: pub(`social-frames/${t.id}/reveal.mp4`), badge: REVEAL_BADGES[t.template] || 'AI Staging', outPath: out });
  const kind = t.template === 'video_before_after_particle' ? 'particle' : 'stopmotion';
  return finalizeMusic(out, `${t.date}_${kind}`, t.id);
}

function driveOne(t) {
  if (t.template === 'video_slider') return driveSlider(t);
  if (t.template === 'video_day_night') return driveDayNight(t);
  if (t.template === 'video_timelapse') return driveConstruction(t);
  return driveReveal(t); // stop-motion / particle
}

if (noVideo) {
  console.log('\n--no-video: skipping the 7 reels.');
} else if (!CRON) {
  console.log('\n⚠ BATCH_STAGING_CRON_SECRET not set — skipping videos. Set it in env to enable automatic video generation.');
} else {
  console.log('\nGenerating 7 videos (this takes ~10-15 min: AI generation + render)...');
  const caps = await genVideoCaptions(VIDEO_PLAN);

  // 1. Insert the video topics (status=proposed; edge picks them by topic_id).
  const videoTopics = [];
  for (let i = 0; i < VIDEO_PLAN.length; i++) {
    const p = VIDEO_PLAN[i];
    const date = dateForDow(p.dow);
    if (!date) continue;
    const cap = caps[i] || {};
    const slide_data = { hook: cap.hook || p.label, body: cap.body || '', caption: cap.caption || '', ...(p.variant ? { slider_variant: p.variant } : {}) };
    if (replace) await supabase.from('content_topics').delete().eq('account_id', accountId).eq('rubric', 'video').eq('plan_date', date).eq('template', p.template);
    const { data, error } = await supabase.from('content_topics').insert({
      plan_date: date, rubric: 'video', category: 'video', template: p.template,
      title: p.label, summary: cap.body || p.label, status: 'proposed', account_id: accountId, slide_data,
    }).select('id').single();
    if (error) { console.log(`  ${p.label}: insert err ${error.message}`); continue; }
    videoTopics.push({ id: data.id, date, ...p });
  }

  // 2. Pre-kick START for every Kling reel (timelapse/day-night/stop-motion/
  //    particle) so they render in parallel while the sliders run. Slider is sync.
  const klingTopics = videoTopics.filter((t) => t.template !== 'video_slider');
  for (const t of klingTopics) { console.log(`  ${t.label}: queueing Kling...`); await triggerEdge({ topic_id: t.id }); }

  // 3. Drive sliders (sync, fast) first.
  for (const t of videoTopics.filter((t) => t.template === 'video_slider')) {
    try {
      process.stdout.write(`  ${t.label} (${t.date})... `);
      await driveSlider(t);
      await supabase.from('content_topics').update({ status: 'approved' }).eq('id', t.id);
      console.log('ok (approved)');
    } catch (e) { console.log('FAIL', e.message); }
  }

  // 4. Finalize + render the Kling reels (their Kling is likely done by now).
  for (const t of klingTopics) {
    try {
      process.stdout.write(`  ${t.label} (${t.date})... `);
      await driveOne(t);
      await supabase.from('content_topics').update({ status: 'approved' }).eq('id', t.id);
      console.log('ok (approved)');
    } catch (e) { console.log('FAIL', e.message); }
  }
  console.log(`\nVideos done: ${videoTopics.length} reels for week ${dates[0]} → ${dates[6]}.`);
}

console.log(`\nDONE. Week ${dates[0]} → ${dates[6]}: ${total} posts${noVideo ? '' : ' + 7 videos'}.`);
