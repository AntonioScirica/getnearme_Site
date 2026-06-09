import supabase from '../supabase.js';
import { rankNewsForDigest } from '../ai/planner.js';
import { sendMessage } from '../telegram.js';

export const config = { maxDuration: 120 };

export default async function handler(req, res) {
  const { checkAuth } = await import('./discover.js');
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const accountId = req.query.account || 'getnearme';
  // Edition: morning (default) or evening
  const edition = req.query.edition === 'evening' ? 'evening' : 'morning';
  const today = new Date().toISOString().split('T')[0];

  // If called by cron (no ?sync=1), respond immediately and run in background
  // This prevents cron-job.org 30s timeout from killing the request
  if (!req.query.sync) {
    // Fire-and-forget: call ourselves with sync=1
    const selfUrl = `https://${req.headers.host || 'getnearme.it'}/api/social/cron/plan?sync=1&edition=${edition}&account=${accountId}&secret=${req.query.secret || ''}`;
    fetch(selfUrl).catch(() => {});
    return res.json({ ok: true, message: `Plan ${edition} triggered async`, date: today });
  }

  // Clean mode: wipe proposals (useful after testing)
  // clean=1 → delete this edition's news, clean=all → delete ALL today's topics
  // clean=week → delete ALL topics from last 7 days (full test reset, clears excludeIds pool)
  if (req.query.clean === 'week') {
    const weekAgoClean = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    const { data: delData, error: delErr, count: delCount } = await supabase.from('content_topics').delete({ count: 'exact' }).eq('account_id', accountId).gte('plan_date', weekAgoClean);
    console.log(`Week clean: deleted ${delCount} topics since ${weekAgoClean} [${accountId}] err=${delErr?.message || 'none'}`);
  } else if (req.query.clean === 'all') {
    await supabase.from('content_topics').delete().eq('plan_date', today).eq('account_id', accountId);
    console.log(`Full clean: all topics for ${today} [${accountId}]`);
  } else if (req.query.clean === '1') {
    await supabase.from('content_topics').delete().eq('plan_date', today).eq('rubric', 'news').eq('account_id', accountId);
    console.log(`Cleaned news proposals for ${today} [${accountId}]`);
  }

  // Idempotency: skip if already planned for this edition today (unless clean mode).
  // Only count REAL planned topics (slide_data.top5 set) — monthly-plan placeholder
  // topics ("09:00 — News Mattina") must not block fresh daily planning.
  if (!req.query.clean) {
    const { count: alreadyPlanned } = await supabase
      .from('content_topics')
      .select('*', { count: 'exact', head: true })
      .eq('plan_date', today)
      .eq('rubric', 'news')
      .eq('edition', edition)
      .eq('account_id', accountId)
      .not('slide_data->top5', 'is', null);

    if (alreadyPlanned > 0) {
      return res.json({ message: `Already planned ${edition} for ${today}`, skipped: true });
    }
  }

  // Fetch news from last 48h
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString().split('T')[0];
  const { data: newsItems } = await supabase
    .from('ai_news_raw')
    .select('*')
    .eq('account_id', accountId)
    .gte('published_at', `${twoDaysAgo}T00:00:00Z`)
    .order('published_at', { ascending: false })
    .limit(300);

  if (!newsItems?.length) {
    return res.json({ message: 'No news to rank', edition });
  }

  // Exclude news already used in previous digests (last 7 days) + collect slugs from today's other edition
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  let excludeIds = [];
  let excludeSlugs = [];       // topic_slugs from today's other edition
  let alreadyPublished = [];   // full news from other edition (shown to Claude scorer)
  let excludeVideoNewsIds = [];
  let excludeVideoSlugs = [];

  // Skip dedup when clean=week (full test reset)
  if (req.query.clean !== 'week') {
    const { data: pastTopics } = await supabase
      .from('content_topics')
      .select('slide_data, plan_date, edition')
      .eq('rubric', 'news')
      .eq('account_id', accountId)
      .gte('plan_date', weekAgo);

    // Slugs from last 3 days count as "already covered" (cross-day dedup)
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    if (pastTopics?.length) {
      for (const t of pastTopics) {
        const top = t.slide_data?.top5 || [];
        excludeIds.push(...top.map(n => n.news_id).filter(Boolean));

        // Cross-day: block slugs from last 3 days
        if (t.plan_date >= threeDaysAgo) {
          for (const n of top) {
            if (n.topic_slug) excludeSlugs.push(n.topic_slug);
          }
        }

        // Recent editions: show headlines to Claude scorer so it assigns matching slugs
        if (t.plan_date >= threeDaysAgo && !(t.plan_date === today && t.edition === edition)) {
          for (const n of top) {
            if (n.headline && n.topic_slug) {
              alreadyPublished.push({ headline: n.headline, topic_slug: n.topic_slug });
            }
          }
        }
      }
    }

    // Also exclude news already used as video topics (last 7 days)
    const { data: pastVideoTopics } = await supabase
      .from('content_topics')
      .select('slide_data')
      .eq('category', 'video')
      .eq('account_id', accountId)
      .gte('plan_date', weekAgo);

    if (pastVideoTopics?.length) {
      for (const vt of pastVideoTopics) {
        if (vt.slide_data?.source_news_id) excludeVideoNewsIds.push(vt.slide_data.source_news_id);
        if (vt.slide_data?.topic_slug) excludeVideoSlugs.push(vt.slide_data.topic_slug);
      }
    }
  }

  const debugPool = { raw: newsItems.length, excludeIds: excludeIds.length, excludeSlugs: excludeSlugs.length };
  console.log(`Pool: ${newsItems.length} raw | Exclude: ${excludeIds.length} IDs, ${excludeSlugs.length} slugs, ${alreadyPublished.length} published | Video: ${excludeVideoNewsIds.length} IDs, ${excludeVideoSlugs.length} slugs`);

  const { top5, videoCandidate } = await rankNewsForDigest(newsItems, {
    edition, excludeIds, excludeSlugs, alreadyPublished,
    excludeVideoNewsIds, excludeVideoSlugs,
  });

  const editionEmoji = edition === 'morning' ? '☀️' : '🌙';
  const editionLabel = edition === 'morning' ? 'MATTINA' : 'SERA';

  // Notify Telegram (always autopilot, no approval needed)
  const headlines = top5.map((n, i) => `${i + 1}. ${n.headline}`).join('\n');
  await sendMessage(`${editionEmoji} <b>NEWS ${editionLabel}</b>\n\n${headlines}`);

  // Remove old proposal for same date+edition+account
  await supabase
    .from('content_topics')
    .delete()
    .eq('plan_date', today)
    .eq('rubric', 'news')
    .eq('edition', edition)
    .eq('account_id', accountId);

  const { error } = await supabase
    .from('content_topics')
    .insert({
      plan_date: today,
      rubric: 'news',
      category: 'carousel',
      account_id: accountId,
      title: `News ${editionLabel} — ${today}`,
      summary: `Top 5 AI news (${edition})`,
      status: 'approved',
      template: 'news',
      edition,
      slide_data: { top5 },
    });

  if (error) {
    console.error('Insert topic error:', error.message, error.details);
    return res.json({ date: today, edition, top5: top5.length, db_error: error.message });
  }

  // === VIDEO TOPIC from unused news (morning only, one per day) ===
  let videoTopicSaved = false;
  console.log(`Video candidate: ${videoCandidate ? `${videoCandidate.title?.slice(0, 60)} [media:${videoCandidate.metadata?.media_type}]` : 'NONE'}`);
  if (edition === 'morning' && videoCandidate) {
    // Check if a news-sourced video topic already exists for today
    const { count: existingVideo } = await supabase
      .from('content_topics')
      .select('*', { count: 'exact', head: true })
      .eq('plan_date', today)
      .eq('category', 'video')
      .eq('account_id', accountId)
      .like('summary', 'News-sourced:%');

    console.log(`Existing video topics for today: ${existingVideo}`);
    if (!existingVideo) {
      const mediaType = videoCandidate.metadata?.media_type || 'none';
      const mediaUrls = videoCandidate.metadata?.media_urls || [];
      const videoTitle = videoCandidate.summary?.slice(0, 200) || videoCandidate.title?.replace(/^@\w+:\s*/, '') || 'AI news del giorno';

      const { error: vErr } = await supabase
        .from('content_topics')
        .insert({
          plan_date: today,
          rubric: 'video',
          category: 'video',
          account_id: accountId,
          title: videoTitle,
          summary: `News-sourced: ${videoCandidate.source} — ${videoCandidate.topic_slug || 'ai'}`,
          status: 'approved',
          template: 'video_pillola',
          edition: edition,
          slide_data: {
            video_type: 'pillola',
            source_news_id: videoCandidate.id,
            source_url: videoCandidate.url,
            source_media_type: mediaType,
            source_media_urls: mediaUrls,
            topic_slug: videoCandidate.topic_slug,
            company: videoCandidate.company,
            source_title: videoCandidate.title || '',
            source_summary: videoCandidate.summary || '',
            source_name: videoCandidate.source || '',
          },
        });

      if (!vErr) {
        videoTopicSaved = true;
        const mediaEmoji = mediaType === 'video' ? '🎥' : mediaType === 'image' ? '📷' : '📝';
        await sendMessage(
          `🎬 <b>VIDEO TOPIC (da news)</b>\n${mediaEmoji} ${videoTitle.slice(0, 150)}\n<i>${videoCandidate.source}</i> [${videoCandidate.topic_slug}]`
        );
        console.log(`Video topic created from news: ${videoTitle.slice(0, 80)}`);
      } else {
        console.error('Video topic insert error:', vErr.message, vErr.details, vErr.hint);
      }
    } else {
      console.log('Video topic from news already exists for today');
    }
  }

  return res.json({
    v: 5,
    date: today,
    edition,
    top5: top5.length,
    saved: true,
    videoTopicSaved,
    ...(req.query.debug === '1' ? {
      debugPool,
      videoCandidate: videoCandidate ? {
        title: videoCandidate.title?.slice(0, 100),
        source: videoCandidate.source,
        media_type: videoCandidate.metadata?.media_type,
        score: videoCandidate.totalScore,
        videoScore: videoCandidate.videoScore,
      } : null,
    } : {}),
    news: top5.map(n => ({ headline: n.headline, source: n.source, summary: n.summary, topic_slug: n.topic_slug, score: n.totalScore })),
  });
}
