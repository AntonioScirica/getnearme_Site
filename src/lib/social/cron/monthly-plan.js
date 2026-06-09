import supabase from '../supabase.js';
import { generateMonthlyPlan } from '../ai/monthly-planner.js';
import { sendMessage } from '../telegram.js';

export const config = { maxDuration: 120 };

export default async function handler(req, res) {
  const { checkAuth } = await import('./discover.js');
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Async mode: respond immediately, self-invoke with ?sync=1
  if (!req.query.sync) {
    const qs = new URLSearchParams(req.query);
    qs.set('sync', '1');
    fetch(`https://${req.headers.host || 'getnearme.it'}/api/social/cron/monthly-plan?${qs}`).catch(() => {});
    return res.json({ ok: true, message: 'monthly-plan triggered async' });
  }

  const accountId = req.query.account || 'getnearme';
  const now = new Date();

  // Biweekly mode (default): plan next 14 days from today
  // Monthly mode: ?month=7&year=2026
  const isBiweekly = !req.query.month;
  let startDate, endDate, targetMonth, targetYear, planLabel;

  if (isBiweekly) {
    startDate = new Date(now);
    startDate.setDate(startDate.getDate() + 1); // start tomorrow
    endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + 13); // 14 days
    targetMonth = startDate.getMonth() + 1;
    targetYear = startDate.getFullYear();
    planLabel = `${startDate.toLocaleDateString('it-IT', {day:'numeric',month:'short'})} — ${endDate.toLocaleDateString('it-IT', {day:'numeric',month:'short',year:'numeric'})}`;
  } else {
    targetMonth = parseInt(req.query.month, 10);
    targetYear = parseInt(req.query.year, 10) || now.getFullYear();
    planLabel = new Date(targetYear, targetMonth - 1).toLocaleString('it-IT', { month: 'long', year: 'numeric' });
  }

  // Clean existing planned topics for this range
  const cleanStart = isBiweekly ? startDate.toISOString().split('T')[0] : `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
  const cleanEnd = isBiweekly ? endDate.toISOString().split('T')[0] : `${targetYear}-${String(targetMonth).padStart(2, '0')}-${new Date(targetYear, targetMonth, 0).getDate()}`;

  if (req.query.clean === '1') {
    await supabase
      .from('content_topics')
      .delete()
      .eq('account_id', accountId)
      .neq('rubric', 'news')
      .gte('plan_date', cleanStart)
      .lte('plan_date', cleanEnd);
    console.log(`Cleaned non-news topics for ${planLabel}`);
  }

  // Skip if topics already exist for this range
  const { count: existing } = await supabase
    .from('content_topics')
    .select('*', { count: 'exact', head: true })
    .eq('account_id', accountId)
    .neq('rubric', 'news')
    .gte('plan_date', cleanStart)
    .lte('plan_date', cleanEnd)
    .in('status', ['planned', 'proposed', 'approved']);

  if (existing > 5 && !req.query.clean) {
    return res.json({ message: `Plan already exists (${existing} topics)`, period: planLabel, account: accountId });
  }

  // Get past topics to avoid repeats
  const threeMonthsAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: pastData } = await supabase
    .from('content_topics')
    .select('title')
    .neq('rubric', 'news')
    .gte('plan_date', threeMonthsAgo);
  const pastTitles = (pastData || []).map(t => t.title);

  // Fetch recent news for context (last 30 days)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: recentNews } = await supabase
    .from('ai_news_raw')
    .select('title, summary, source')
    .gte('published_at', `${thirtyDaysAgo}T00:00:00Z`)
    .order('published_at', { ascending: false })
    .limit(100);

  // Generate plan
  const planOpts = isBiweekly ? { startDate: startDate.toISOString().split('T')[0], endDate: endDate.toISOString().split('T')[0] } : {};
  const topics = await generateMonthlyPlan(targetYear, targetMonth, pastTitles, recentNews || [], planOpts);

  if (!topics.length) {
    return res.json({ message: 'No topics generated', month: monthLabel });
  }

  // Save to DB
  // Check autopilot for status
  const { data: account } = await supabase.from('brand_accounts').select('autopilot').eq('id', accountId).single();
  const topicStatus = account?.autopilot ? 'approved' : 'proposed';

  const inserts = topics.map(t => ({
    plan_date: t.date,
    rubric: t.rubric,
    category: t.category,
    title: t.title,
    summary: t.summary,
    status: topicStatus,
    template: t.template,
    edition: null,
    account_id: accountId,
    slide_data: {
      ...(t.use_case ? { use_case: t.use_case } : {}),
      ...(t.video_type ? { video_type: t.video_type, hook: t.hook } : {}),
    },
  }));

  const { error } = await supabase.from('content_topics').insert(inserts);
  if (error) {
    console.error('Insert error:', error.message);
    return res.json({ month: monthLabel, topics: topics.length, db_error: error.message });
  }

  // Split rubrics, prompts, and videos
  const rubrics = topics.filter(t => t.rubric !== 'prompt' && t.rubric !== 'video');
  const prompts = topics.filter(t => t.rubric === 'prompt');
  const videos = topics.filter(t => t.rubric === 'video');

  // Send to Telegram
  const header = `📅 <b>PIANO EDITORIALE — ${planLabel.toUpperCase()}</b>\n\n${rubrics.length} rubriche + ${prompts.length} prompt + ${videos.length} video`;
  await sendMessage(header);

  // Group rubrics by week
  const weeks = {};
  for (const t of rubrics) {
    const d = new Date(t.date);
    const weekNum = Math.ceil(d.getDate() / 7);
    if (!weeks[weekNum]) weeks[weekNum] = [];
    weeks[weekNum].push(t);
  }

  for (const [weekNum, weekTopics] of Object.entries(weeks)) {
    const lines = weekTopics.map(t => {
      const dayName = new Date(t.date).toLocaleString('it-IT', { weekday: 'short' });
      const dayNum = t.date.split('-')[2];
      const emoji = {
        education: '📚', people: '👤', myths: '🔮',
        tools: '🛠', world: '🌍', question: '❓',
      }[t.rubric] || '📝';
      return `${emoji} <b>${dayName} ${dayNum}</b> [${t.rubric}]\n   ${t.title}`;
    }).join('\n\n');

    await sendMessage(`<b>📚 Rubriche — Settimana ${weekNum}</b>\n\n${lines}`);
  }

  // Send prompts summary (grouped by week, compact)
  const promptWeeks = {};
  for (const p of prompts) {
    const d = new Date(p.date);
    const weekNum = Math.ceil(d.getDate() / 7);
    if (!promptWeeks[weekNum]) promptWeeks[weekNum] = [];
    promptWeeks[weekNum].push(p);
  }

  for (const [weekNum, weekPrompts] of Object.entries(promptWeeks)) {
    const lines = weekPrompts.map(p => {
      const dayNum = p.date.split('-')[2];
      return `📝 <b>${dayNum}</b> ${p.title}`;
    }).join('\n');

    await sendMessage(`<b>💡 Prompt del Giorno — Settimana ${weekNum}</b>\n\n${lines}`);
  }

  // Send video topics by week
  const videoWeeks = {};
  for (const v of videos) {
    const d = new Date(v.date);
    const weekNum = Math.ceil(d.getDate() / 7);
    if (!videoWeeks[weekNum]) videoWeeks[weekNum] = [];
    videoWeeks[weekNum].push(v);
  }

  for (const [weekNum, weekVideos] of Object.entries(videoWeeks)) {
    const lines = weekVideos.map(v => {
      const dayNum = v.date.split('-')[2];
      return `🎬 <b>${dayNum}</b> ${v.title}`;
    }).join('\n');

    await sendMessage(`<b>🎬 Video Reel — Settimana ${weekNum}</b>\n\n${lines}`);
  }

  // Approval buttons
  const monthStart = `${targetYear}-${String(targetMonth).padStart(2, '0')}-01`;
  await sendMessage(
    `👆 Approvi il piano ${monthLabel}?`,
    {
      reply_markup: {
        inline_keyboard: [
          [
            { text: '✅ Approva Tutto', callback_data: `approve_monthly:${monthStart}` },
            { text: '🔄 Rigenera', callback_data: `regenerate_monthly:${monthStart}` },
          ],
        ],
      },
    }
  );

  return res.json({
    month: monthLabel,
    topics: topics.length,
    saved: true,
    plan: topics.map(t => ({ date: t.date, rubric: t.rubric, title: t.title })),
  });
}
