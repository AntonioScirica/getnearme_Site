// PED analytics: collect IG insights for published posts + weekly report.
//
// Collect mode (default): fetch insights for PED posts published in the last
// 7 days (metrics keep evolving) + today's stories (they die after 24h),
// merge into generated_content.content_data.insights.
//
// Report mode (?report=1): aggregate last N days by template and slot,
// send Telegram report with top/flop posts. Used to re-tune the PED.
//
// Query params:
//   ?secret=<CRON_SECRET>   auth
//   ?report=1               report mode (default: collect)
//   ?days=14                report window in days (default 14)
//   ?sync=1                 run synchronously

import supabase from '../supabase.js';
import { getMediaInsights, getFollowersCount } from '../ped/publish-ig.js';
import { sendMessage } from '../telegram.js';

export const config = { maxDuration: 120 };

function romeToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date());
}

function daysAgo(n) {
  const d = new Date(Date.now() - n * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(d);
}

const fmt = (n) => (n == null ? '–' : Math.round(n).toLocaleString('it-IT'));
const pct = (n) => (n == null ? '–' : `${(n * 100).toFixed(1)}%`);

// ── Collect ───────────────────────────────────────────────────────────

async function collect(res) {
  const { data: posts, error } = await supabase
    .from('generated_content')
    .select('id, ig_post_id, ig_story_id, publish_date, content_data')
    .eq('type', 'ped')
    .eq('status', 'published')
    .gte('publish_date', daysAgo(7))
    .not('ig_post_id', 'is', null);

  if (error) {
    await sendMessage(`❌ <b>PED insights: query fallita</b>\n<code>${error.message}</code>`);
    return res.status(500).json({ error: error.message });
  }

  const today = romeToday();
  let updated = 0;
  const errors = [];

  for (const post of posts || []) {
    try {
      const insights = await getMediaInsights(post.ig_post_id, false);

      // Story insights only on publish day (stories expire after 24h)
      let storyInsights = post.content_data?.insights?.story || null;
      if (post.ig_story_id && post.publish_date === today && !storyInsights) {
        try {
          storyInsights = await getMediaInsights(post.ig_story_id, true);
        } catch {
          // story may already be gone; keep null
        }
      }

      const { error: updErr } = await supabase
        .from('generated_content')
        .update({
          content_data: {
            ...post.content_data,
            insights: { ...insights, story: storyInsights, fetched_at: new Date().toISOString() },
          },
        })
        .eq('id', post.id);
      if (updErr) throw new Error(updErr.message);
      updated++;
    } catch (err) {
      errors.push(`${post.content_data?.title || post.id}: ${err.message?.slice(0, 100)}`);
    }
  }

  if (errors.length) {
    await sendMessage(`⚠️ <b>PED insights: ${errors.length} errori</b>\n<code>${errors.join('\n').slice(0, 1000)}</code>`);
  }

  console.log(`[ped-insights] updated ${updated}/${posts?.length || 0}`);
  return res.json({ collected: updated, total: posts?.length || 0, errors: errors.length });
}

// ── Report ────────────────────────────────────────────────────────────

function aggregate(posts, keyFn) {
  const groups = {};
  for (const p of posts) {
    const ins = p.content_data?.insights;
    if (!ins?.reach) continue;
    const key = keyFn(p);
    const g = (groups[key] ||= { n: 0, reach: 0, views: 0, likes: 0, saved: 0, shares: 0, comments: 0, interactions: 0 });
    g.n++;
    g.reach += ins.reach || 0;
    g.views += ins.views || 0;
    g.likes += ins.likes || 0;
    g.saved += ins.saved || 0;
    g.shares += ins.shares || 0;
    g.comments += ins.comments || 0;
    g.interactions += ins.total_interactions || (ins.likes || 0) + (ins.comments || 0) + (ins.saved || 0) + (ins.shares || 0);
  }
  return groups;
}

async function report(req, res) {
  const days = Math.max(1, parseInt(req.query.days, 10) || 14);

  const { data: posts, error } = await supabase
    .from('generated_content')
    .select('id, publish_date, content_data')
    .eq('type', 'ped')
    .eq('status', 'published')
    .gte('publish_date', daysAgo(days));

  if (error) {
    await sendMessage(`❌ <b>PED report: query fallita</b>\n<code>${error.message}</code>`);
    return res.status(500).json({ error: error.message });
  }

  const withInsights = (posts || []).filter((p) => p.content_data?.insights?.reach);
  if (!withInsights.length) {
    await sendMessage(`📊 <b>PED report (${days}gg)</b>\nNessun post con insights ancora. La raccolta gira ogni sera alle 23.`);
    return res.json({ message: 'No insights yet', posts: posts?.length || 0 });
  }

  let followers = null;
  try { followers = await getFollowersCount(); } catch { /* report still useful without */ }

  const byTemplate = aggregate(withInsights, (p) => p.content_data?.template || '?');
  const bySlot = aggregate(withInsights, (p) => p.content_data?.slot_time || '?');

  const lines = [];
  lines.push(`📊 <b>PED report ultimi ${days} giorni</b>`);
  lines.push(`Post analizzati: ${withInsights.length}/${posts.length}${followers ? ` | Follower: ${fmt(followers)}` : ''}`);

  lines.push(`\n<b>Per template</b> (media/post)`);
  for (const [tpl, g] of Object.entries(byTemplate).sort((a, b) => b[1].reach / b[1].n - a[1].reach / a[1].n)) {
    const er = g.reach ? g.interactions / g.reach : null;
    lines.push(`• <code>${tpl.replace('ped-', '')}</code> ×${g.n}: reach ${fmt(g.reach / g.n)}, ER ${pct(er)}, save ${fmt(g.saved / g.n)}, share ${fmt(g.shares / g.n)}`);
  }

  lines.push(`\n<b>Per slot</b> (media/post)`);
  for (const [slot, g] of Object.entries(bySlot).sort()) {
    const er = g.reach ? g.interactions / g.reach : null;
    lines.push(`• ${slot} ×${g.n}: reach ${fmt(g.reach / g.n)}, ER ${pct(er)}`);
  }

  const ranked = [...withInsights].sort(
    (a, b) => (b.content_data.insights.reach || 0) - (a.content_data.insights.reach || 0)
  );
  const fmtPost = (p) => {
    const i = p.content_data.insights;
    return `${p.content_data.title || '?'} (${p.publish_date}, ${p.content_data.slot_time}): reach ${fmt(i.reach)}, save ${fmt(i.saved)}`;
  };
  lines.push(`\n<b>Top 3</b>`);
  ranked.slice(0, 3).forEach((p, i) => lines.push(`${i + 1}. ${fmtPost(p)}`));
  if (ranked.length > 3) {
    lines.push(`\n<b>Flop 3</b>`);
    ranked.slice(-3).reverse().forEach((p, i) => lines.push(`${i + 1}. ${fmtPost(p)}`));
  }

  // Story performance (where collected)
  const stories = withInsights.filter((p) => p.content_data.insights.story?.reach);
  if (stories.length) {
    const sReach = stories.reduce((s, p) => s + (p.content_data.insights.story.reach || 0), 0);
    lines.push(`\n<b>Story</b>: ${stories.length} tracciate, reach medio ${fmt(sReach / stories.length)}`);
  }

  await sendMessage(lines.join('\n').slice(0, 4000));
  return res.json({ posts: withInsights.length, templates: Object.keys(byTemplate), slots: Object.keys(bySlot) });
}

// ── Handler ───────────────────────────────────────────────────────────

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const { checkAuth } = await import('./discover.js');
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (!req.query.sync) {
    const qs = new URLSearchParams(req.query);
    qs.set('sync', '1');
    fetch(`https://${req.headers.host || 'getnearme.it'}/api/social/cron/ped-insights?${qs}`).catch(() => {});
    return res.json({ ok: true, message: `ped-insights triggered async (report=${req.query.report || '0'})` });
  }

  return req.query.report === '1' ? report(req, res) : collect(res);
}
