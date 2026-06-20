// PED analyzer: turn the collected IG metrics into an actionable ai_analysis
// and store it in performance_insights, so the planner + weekly command can
// calibrate the next weeks on what actually performed.
//
// Reads generated_content.content_data.insights (populated by ped-insights
// collect) over the last N days, aggregates by rubric/template/slot, asks Claude
// to rank what works, and inserts a performance_insights row (applied=false).
// The biweekly monthly-planner consumes ai_analysis automatically; the weekly
// command (gen-week-posts) reads the latest one too.
//
// Query params:
//   ?secret=<CRON_SECRET>   auth
//   ?days=14                analysis window (default 14)
//   ?sync=1                 run synchronously

import supabase from '../supabase.js';
import { sendMessage } from '../telegram.js';
import Anthropic from '@anthropic-ai/sdk';

export const config = { maxDuration: 120 };

const anthropic = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY || '').trim() });
const ACCOUNT = 'getnearme';

function daysAgo(n) {
  const d = new Date(Date.now() - n * 86400000);
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(d);
}
function romeToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date());
}
const eng = (i) => (i.likes || 0) + (i.comments || 0) + (i.saves || 0) + (i.shares || 0);

export default async function handler(req, res) {
  const { checkAuth } = await import('./discover.js');
  if (!checkAuth(req)) return res.status(401).json({ error: 'Unauthorized' });

  // Async mode: respond immediately, self-invoke with ?sync=1
  if (!req.query.sync) {
    const qs = new URLSearchParams(req.query);
    qs.set('sync', '1');
    fetch(`https://${req.headers.host || 'getnearme.it'}/api/social/cron/ped-analyze?${qs}`).catch(() => {});
    return res.json({ ok: true, message: 'ped-analyze triggered async' });
  }

  const days = Math.max(7, parseInt(req.query.days, 10) || 14);
  const since = daysAgo(days);

  // 1. Pull published posts with collected insights in the window.
  const { data: rows, error } = await supabase
    .from('generated_content')
    .select('id, type, topic_id, publish_date, content_data')
    .eq('account_id', ACCOUNT)
    .gte('publish_date', since)
    .not('content_data->insights', 'is', null)
    .limit(400);
  if (error) {
    await sendMessage(`❌ <b>PED analyze: query fallita</b>\n<code>${error.message}</code>`);
    return res.status(500).json({ error: error.message });
  }

  const withMetrics = (rows || []).filter((r) => r.content_data?.insights?.reach != null);
  if (withMetrics.length < 4) {
    return res.json({ ok: true, message: `Too few posts with insights (${withMetrics.length}) — need ≥4. Skipping.`, posts: withMetrics.length });
  }

  // 2. Map topic_id → rubric.
  const topicIds = [...new Set(withMetrics.map((r) => r.topic_id).filter(Boolean))];
  const { data: topics } = await supabase
    .from('content_topics')
    .select('id, rubric, template')
    .in('id', topicIds);
  const rubricOf = Object.fromEntries((topics || []).map((t) => [t.id, t.rubric]));

  // 3. Build per-post rows + rubric aggregates for the prompt.
  const items = withMetrics.map((r) => {
    const i = r.content_data.insights;
    const cd = r.content_data;
    const hook = (cd.caption || '').replace(/\n/g, ' ').replace(/#\S+/g, '').trim().slice(0, 90);
    return {
      rubric: rubricOf[r.topic_id] || 'n/d',
      template: cd.template || r.type,
      slot: cd.slot_time || '',
      reach: i.reach || 0,
      eng: eng(i),
      saves: i.saves || 0,
      hook,
    };
  });
  const aggByRubric = {};
  for (const it of items) {
    const a = (aggByRubric[it.rubric] ||= { n: 0, reach: 0, eng: 0 });
    a.n++; a.reach += it.reach; a.eng += it.eng;
  }
  const rubricSummary = Object.entries(aggByRubric)
    .map(([r, a]) => `${r}: ${a.n} post, reach medio ${Math.round(a.reach / a.n)}, engagement medio ${Math.round(a.eng / a.n)}`)
    .join('\n');
  const topPosts = [...items].sort((a, b) => b.eng - a.eng).slice(0, 8)
    .map((p) => `[${p.rubric}] reach ${p.reach}, eng ${p.eng} — "${p.hook}"`).join('\n');
  const flopPosts = [...items].sort((a, b) => a.eng - b.eng).slice(0, 5)
    .map((p) => `[${p.rubric}] reach ${p.reach}, eng ${p.eng} — "${p.hook}"`).join('\n');

  // 4. Ask Claude to produce the ai_analysis the planner expects.
  const prompt = `Sei l'analista social di @getnearme_app (account per AGENTI immobiliari, promuove una suite AI di creazione contenuti).
Analizza la performance degli ultimi ${days} giorni e dimmi come calibrare i prossimi contenuti.

PERFORMANCE PER RUBRICA:
${rubricSummary}

TOP POST (per engagement):
${topPosts}

POST DEBOLI:
${flopPosts}

Rubriche disponibili: education, people, myths, tools, world, question.
Rispondi SOLO con JSON valido:
{
  "rubric_ranking": ["<rubrica migliore>", ...],  // dalla migliore alla peggiore, solo quelle con dati
  "best_hook_pattern": "<cosa accomuna i ganci che funzionano, 1 frase>",
  "worst_pattern": "<cosa accomuna i post deboli, da evitare, 1 frase>",
  "planner_adjustments": {
    "increase_rubric": "<rubrica da aumentare>",
    "decrease_rubric": "<rubrica da ridurre>",
    "hook_style": "<indicazione concreta sullo stile dei ganci>",
    "tone_adjustment": "<aggiustamento di tono se serve>"
  }
}`;

  let aiAnalysis;
  try {
    const resp = await anthropic.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 1500, messages: [{ role: 'user', content: prompt }] });
    const m = resp.content[0].text.match(/\{[\s\S]*\}/);
    aiAnalysis = JSON.parse(m[0].replace(/,\s*([}\]])/g, '$1'));
  } catch (e) {
    await sendMessage(`❌ <b>PED analyze: analisi Claude fallita</b>\n<code>${e.message}</code>`);
    return res.status(500).json({ error: `claude: ${e.message}` });
  }

  // 5. Store in performance_insights (applied=false → planner/command consume it).
  const week_end = romeToday();
  const week_start = since;
  const { error: insErr } = await supabase.from('performance_insights').insert({
    account_id: ACCOUNT,
    week_start,
    week_end,
    insights: { ai_analysis: aiAnalysis, posts_analyzed: items.length, by_rubric: aggByRubric },
    applied: false,
  });
  if (insErr) {
    await sendMessage(`❌ <b>PED analyze: insert fallito</b>\n<code>${insErr.message}</code>`);
    return res.status(500).json({ error: insErr.message });
  }

  await sendMessage(
    `📈 <b>PED analyze (${days}gg, ${items.length} post)</b>\n` +
    `Ranking: ${(aiAnalysis.rubric_ranking || []).join(' > ')}\n` +
    `↑ ${aiAnalysis.planner_adjustments?.increase_rubric || '–'} · ↓ ${aiAnalysis.planner_adjustments?.decrease_rubric || '–'}\n` +
    `Hook: ${aiAnalysis.best_hook_pattern || '–'}`
  );
  return res.json({ ok: true, posts: items.length, ai_analysis: aiAnalysis });
}
