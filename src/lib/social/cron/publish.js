import supabase from '../supabase.js';
import { publishCarousel, publishReel, publishStory } from '../publish/instagram.js';
import { publishVideo as publishTikTok } from '../publish/tiktok.js';
import { renderStory } from '../carousel/story-renderer.js';
import { sendMessage } from '../telegram.js';
// Reel story = the calendar slider-story template (before/after card), rendered
// from the reel's before/after photos at publish time. Bundled by Next (TS ok).
import { storyStagingHtmlDynamic, VIDEO_STORIES_CSS } from '../video-stories/builders';
import { renderPedSlides } from '../ped/renderer.js';

export const config = { maxDuration: 120 };

/**
 * After a rate limit error, check if IG published the post anyway.
 * Fetches recent IG media and matches by caption prefix (first 50 chars).
 * Returns the IG post ID if found, null otherwise.
 */
async function checkIfPublishedOnIG(post) {
  try {
    const { data: cfg } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'instagram_tokens')
      .single();
    const token = cfg?.value?.access_token || process.env.META_ACCESS_TOKEN;
    const userId = cfg?.value?.ig_user_id || process.env.META_IG_USER_ID;
    if (!token || !userId) return null;

    // Wait a few seconds for IG to process
    await new Promise(r => setTimeout(r, 8000));

    const res = await fetch(
      `https://graph.instagram.com/v21.0/${userId}/media?fields=id,caption,timestamp&limit=5&access_token=${token}`
    );
    if (!res.ok) return null;
    const data = await res.json();

    // Match by caption prefix (first 50 chars)
    const postCaption = (post.content_data?.caption || '').slice(0, 50);
    if (!postCaption) return null;

    const match = (data.data || []).find(m => m.caption?.startsWith(postCaption));
    if (match) {
      console.log(`Rate limit recovery: found IG post ${match.id} for "${postCaption.slice(0, 30)}..."`);
      return match.id;
    }
    return null;
  } catch (e) {
    console.error('Rate limit recovery check failed:', e.message);
    return null;
  }
}

/**
 * Update a generated_content row to published and VERIFY the write landed.
 * Supabase updates can fail silently (0 rows, no error) — when that happens
 * the post stays 'approved' and the next trigger re-publishes/re-notifies.
 * Retries once; returns true only if the row is really updated.
 */
async function markPublished(postId, fields) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const { data, error } = await supabase
      .from('generated_content')
      .update(fields)
      .eq('id', postId)
      .select('id, status');
    if (!error && data?.length === 1 && data[0].status === fields.status) return true;
    console.error(`markPublished attempt ${attempt} failed:`, error?.message || `rows=${data?.length || 0}`);
  }
  await sendMessage(`⚠️ <b>DB non aggiornato dopo publish</b> (post id ${postId}). Status resta 'approved': rischio doppia notifica al prossimo trigger. Controllare Supabase.`);
  return false;
}

/**
 * Daily publishing schedule (Rome timezone, UTC+1/+2 DST).
 * Each slot is triggered by a separate cron call with ?slot=<name>.
 *
 * 09:00 → news_morning    (carousel)
 * 12:00 → post            (carousel - rubric)
 * 15:00 → video_1         (reel)
 * 18:00 → prompt          (carousel - prompt del giorno)
 * 20:00 → news_evening    (carousel)
 * 23:00 → video_2         (reel)
 *
 * Story mode: ?story=1&slot=<name> — publishes story for already-published post.
 * Called ~10 min after the main publish cron to avoid IG rate limits.
 */
const SCHEDULE = {
  news_morning: { type: 'carousel', rubric: 'news', edition: 'morning' },
  post:         { type: 'carousel', excludeRubrics: ['news', 'prompt'] },
  video_1:      { type: 'reel' },
  prompt:       { type: 'prompt', rubric: 'prompt' },
  news_evening: { type: 'carousel', rubric: 'news', edition: 'evening' },
  video_2:      { type: 'reel' },
};

const STORY_TYPE_MAP = {
  news_morning: 'news_morning',
  news_evening: 'news_evening',
  post: 'post',
  prompt: 'prompt',
  video_1: 'video',
  video_2: 'video',
};

/**
 * Delete the heavy MP4 files of videos published more than 2h ago, to keep
 * storage small. Keeps the generated_content row (insights need ig_post_id) and
 * the .jpg frames (calendar thumbnails) — only the .mp4 files go. The 2h delay
 * guarantees the story teaser (+10 min) already used the video_url. Idempotent:
 * nulls video_url once cleaned so each video is processed once.
 */
async function cleanupOldVideoFiles() {
  const cutoff = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
  const { data, error } = await supabase
    .from('generated_content')
    .select('id, topic_id, video_url')
    .eq('status', 'published')
    .lt('published_at', cutoff)
    .not('video_url', 'is', null)
    .like('video_url', '%/storage/v1/object/public/content/%')
    .limit(50);
  if (error || !data?.length) return 0;

  let removed = 0;
  for (const row of data) {
    const paths = [];
    const finalPath = row.video_url.split('/storage/v1/object/public/content/')[1];
    if (finalPath) paths.push(finalPath.split('?')[0]);
    // Intermediate render artifacts (seg1/seg2/base/daynight/reveal .mp4).
    if (row.topic_id) {
      const { data: files } = await supabase.storage.from('content').list(`social-frames/${row.topic_id}`);
      for (const f of files || []) {
        if (f.name.endsWith('.mp4')) paths.push(`social-frames/${row.topic_id}/${f.name}`);
      }
    }
    if (paths.length) {
      try { await supabase.storage.from('content').remove(paths); removed += paths.length; } catch { /* best effort */ }
    }
    // Drop the now-dead link so the row isn't re-scanned (insights keep ig id).
    await supabase.from('generated_content').update({ video_url: null }).eq('id', row.id);
  }
  if (removed) console.log(`cleanupOldVideoFiles: removed ${removed} mp4 file(s)`);
  return removed;
}

export default async function handler(req, res) {
  const { checkAuth } = await import('./discover.js');
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Run INLINE (no async self-invoke): on Vercel the fire-and-forget fetch after
  // res.json() is often killed when the function returns, so the publish never ran.
  // Dedup (checkIfPublishedOnIG) keeps any cron retry a no-op.

  // Housekeeping: clean MP4s published >2h ago (storage hygiene). Best-effort.
  try { await cleanupOldVideoFiles(); } catch (e) { console.error('video cleanup error:', e.message); }

  // Route: ?story=1 → story publishing mode
  if (req.query.story === '1') {
    return handleStoryPublish(req, res);
  }

  const slot = req.query.slot;
  const accountId = req.query.account || 'getnearme';
  const today = new Date().toISOString().split('T')[0];

  if (!slot || !SCHEDULE[slot]) {
    return res.status(400).json({
      error: 'Missing or invalid slot param',
      valid_slots: Object.keys(SCHEDULE),
    });
  }

  const slotConfig = SCHEDULE[slot];


  // No IG credentials configured yet → skip cleanly, don't mark content as failed
  if (!process.env.META_ACCESS_TOKEN) {
    const { data: cfg } = await supabase
      .from('app_config')
      .select('value')
      .eq('key', 'instagram_tokens')
      .single();
    if (!cfg?.value?.access_token) {
      return res.json({
        message: `Publishing not configured (slot=${slot}): missing META_ACCESS_TOKEN or app_config.instagram_tokens. Content stays approved.`,
      });
    }
  }

  // Build query for this slot's content
  let query = supabase
    .from('generated_content')
    .select('*')
    // I reel sono salvati con status 'ready' (pipeline video), i caroselli con
    // 'approved'. Entrambi sono pronti da pubblicare.
    .in('status', ['approved', 'ready'])
    .eq('publish_date', today)
    .eq('account_id', accountId)
    .eq('type', slotConfig.type);

  // Filter by rubric/edition if specified
  if (slotConfig.rubric) {
    query = query.eq('content_data->>rubric', slotConfig.rubric);
  }
  if (slotConfig.edition) {
    query = query.eq('content_data->>edition', slotConfig.edition);
  }
  // Exclude specific rubrics (for 'post' slot: any carousel except news/prompt)
  if (slotConfig.excludeRubrics) {
    for (const r of slotConfig.excludeRubrics) {
      query = query.neq('content_data->>rubric', r);
    }
  }

  const { data: posts } = await query
    .order('created_at', { ascending: false })
    .limit(1);

  const post = posts?.[0];
  if (!post) {
    return res.json({ message: `No approved content for slot "${slot}" on ${today}` });
  }

  // Check if already published (idempotency)
  if (post.published_at) {
    return res.json({ message: `Slot "${slot}" already published`, post_id: post.post_id });
  }

  // Pre-publish dedup: ALWAYS check IG for a caption match before publishing.
  // Covers every stale-state case (silent DB write failures, rate-limit-but-published,
  // manual re-triggers): if the post is already on IG, never publish again.
  {
    const recoveredId = await checkIfPublishedOnIG(post);
    if (recoveredId) {
      await markPublished(post.id, {
        status: 'published',
        ig_post_id: recoveredId,
        published_at: new Date().toISOString(),
        error: null,
      });
      await sendMessage(
        `✅ [${slot}] Recovered (5min check): <b>${post.content_data.slides?.[0]?.headline || post.post_id}</b>\nIG: ${recoveredId}`
      );
      return res.json({ slot, published: post.post_id, igId: recoveredId, recovered: true });
    }
    // Not found on IG — proceed with re-publish attempt below
  }

  let igId, tiktokId;

  try {
    const caption = `${post.content_data.caption || ''}\n\n${(post.content_data.hashtags || []).map(h => `#${h}`).join(' ')}`;

    if (post.type === 'carousel') {
      igId = await publishCarousel(post.image_urls, caption);
    } else if ((post.type === 'video' || post.type === 'reel') && post.video_url) {
      igId = await publishReel(post.video_url, caption);
      try {
        tiktokId = await publishTikTok(post.video_url, caption);
      } catch (ttErr) {
        console.error('TikTok publish failed:', ttErr.message);
      }
    }

    await markPublished(post.id, {
      status: 'published',
      ig_post_id: igId,
      tiktok_publish_id: tiktokId,
      published_at: new Date().toISOString(),
    });

    // NB: MP4 files are NOT deleted here — the story teaser (+10 min) still
    // needs the video_url. Cleanup happens 2h after publish via
    // cleanupOldVideoFiles() (run at the start of every publish invocation).

    await sendMessage(
      `✅ [${slot}] Pubblicato: <b>${post.content_data.slides?.[0]?.headline || post.post_id}</b>\n` +
      `IG Post: ${igId || 'N/A'} | TikTok: ${tiktokId || 'N/A'}`
    );

    return res.json({ slot, published: post.post_id, igId, tiktokId });
  } catch (err) {
    const isRateLimit = err.message?.includes('request limit') || err.message?.includes('rate');

    if (isRateLimit) {
      // IG sometimes publishes despite rate limit error — check recent media
      const recoveredId = await checkIfPublishedOnIG(post);
      if (recoveredId) {
        await markPublished(post.id, {
          status: 'published',
          ig_post_id: recoveredId,
          published_at: new Date().toISOString(),
          error: null,
        });
        await sendMessage(
          `✅ [${slot}] Pubblicato (recovered post rate limit): <b>${post.content_data.slides?.[0]?.headline || post.post_id}</b>\nIG: ${recoveredId}`
        );
        return res.json({ slot, published: post.post_id, igId: recoveredId, recovered: true });
      }

      // Genuinely not published — keep approved for retry
      await sendMessage(`⏳ [${slot}] IG rate limit, retry automatico: <b>${post.post_id}</b>`);
      await supabase
        .from('generated_content')
        .update({ error: `rate_limit: ${new Date().toISOString()}` })
        .eq('id', post.id);
    } else {
      await sendMessage(`❌ [${slot}] Errore: <b>${post.post_id}</b> — ${err.message}`);
      await supabase
        .from('generated_content')
        .update({ status: 'failed', error: err.message })
        .eq('id', post.id);
    }

    return res.status(500).json({ slot, error: err.message, willRetry: isRateLimit });
  }
}

/**
 * Story publishing handler — called with ?story=1&slot=<name>
 * Finds today's PUBLISHED post for the slot, renders story, publishes to IG.
 */
async function handleStoryPublish(req, res) {
  const slot = req.query.slot;
  const accountId = req.query.account || 'getnearme';
  const today = new Date().toISOString().split('T')[0];

  if (!slot || !SCHEDULE[slot]) {
    return res.status(400).json({
      error: 'Missing or invalid slot',
      valid_slots: Object.keys(SCHEDULE),
    });
  }

  const slotConfig = SCHEDULE[slot];

  // Find today's PUBLISHED post for this slot
  let query = supabase
    .from('generated_content')
    .select('*')
    .eq('publish_date', today)
    .eq('status', 'published')
    .eq('account_id', accountId)
    .eq('type', slotConfig.type);

  if (slotConfig.rubric) {
    query = query.eq('content_data->>rubric', slotConfig.rubric);
  }
  if (slotConfig.edition) {
    query = query.eq('content_data->>edition', slotConfig.edition);
  }
  if (slotConfig.excludeRubrics) {
    for (const r of slotConfig.excludeRubrics) {
      query = query.neq('content_data->>rubric', r);
    }
  }

  const { data: posts } = await query.order('created_at', { ascending: true }).limit(1);
  let post = posts?.[0];

  // No published post found — check if there's a rate-limited post we can recover
  if (!post) {
    let rlQuery = supabase
      .from('generated_content')
      .select('*')
      .eq('publish_date', today)
      .eq('status', 'approved')
      .eq('account_id', accountId)
      .eq('type', slotConfig.type)
      .like('error', 'rate_limit%');

    if (slotConfig.rubric) rlQuery = rlQuery.eq('content_data->>rubric', slotConfig.rubric);
    if (slotConfig.edition) rlQuery = rlQuery.eq('content_data->>edition', slotConfig.edition);
    if (slotConfig.excludeRubrics) {
      for (const r of slotConfig.excludeRubrics) rlQuery = rlQuery.neq('content_data->>rubric', r);
    }

    const { data: rlPosts } = await rlQuery.limit(1);
    const rlPost = rlPosts?.[0];

    if (rlPost) {
      const recoveredId = await checkIfPublishedOnIG(rlPost);
      if (recoveredId) {
        await markPublished(rlPost.id, { status: 'published', ig_post_id: recoveredId, published_at: new Date().toISOString(), error: null });
        await sendMessage(`✅ [${slot}] Recovered (story-cron check): <b>${rlPost.content_data?.slides?.[0]?.headline || rlPost.post_id}</b>\nIG: ${recoveredId}`);
        post = { ...rlPost, status: 'published', ig_post_id: recoveredId };
      }
    }

    if (!post) {
      return res.json({ message: `No published post for slot "${slot}" on ${today}` });
    }
  }

  // Skip if story already published
  if (post.ig_story_id) {
    return res.json({ message: `Story already published for ${slot}`, storyId: post.ig_story_id });
  }

  try {
    const storyType = STORY_TYPE_MAP[slot] || 'post';

    // Reel slots (video_1/video_2): the story is the calendar slider template
    // (storyStagingHtmlDynamic) rendered from the reel's before/after photos —
    // NOT the reel video. Keeps calendar preview == published story.
    if (slotConfig.type === 'reel') {
      const imgs = post.image_urls || [];
      if (imgs.length < 1) return res.json({ message: `Reel ${slot} has no before/after photos for the story` });
      const html = storyStagingHtmlDynamic(imgs[0], imgs[1] || imgs[0]);
      const [storyImg] = await renderPedSlides([{ html, label: 'story' }], VIDEO_STORIES_CSS, { width: 1080, height: 1920 });
      const storyPath = `stories/${post.publish_date}/${slot}.jpg`;
      await supabase.storage.from('content').upload(storyPath, storyImg, { contentType: 'image/jpeg', upsert: true });
      const { data: storyUrl } = supabase.storage.from('content').getPublicUrl(storyPath);
      const storyId = await publishStory(storyUrl.publicUrl);
      await supabase.from('generated_content').update({ ig_story_id: storyId }).eq('id', post.id);
      await sendMessage(`📖 [${slot}] Story (slider) pubblicata`);
      return res.json({ slot, storyId });
    }

    // Get full topic data for richer story content
    let topic = null;
    if (post.topic_id) {
      const { data: topicData } = await supabase
        .from('content_topics')
        .select('*')
        .eq('id', post.topic_id)
        .single();
      topic = topicData;
    }

    // Build story data from topic + post content
    const storyData = {};
    if (slot.startsWith('news')) {
      storyData.top5 = topic?.slide_data?.top5
        || post.content_data?.slides
          ?.filter(s => s.type === 'news_item')
          ?.map(s => ({ headline: s.title, source: s.source }))
        || [];
    } else {
      storyData.topic = {
        title: topic?.title || post.content_data?.slides?.[0]?.headline || post.content_data?.caption?.split('\n')[0] || '',
        rubric: topic?.rubric || post.content_data?.rubric || post.type,
        slide_data: topic?.slide_data || {},
        summary: topic?.summary || '',
        video_type: topic?.slide_data?.video_type || topic?.video_type || '',
      };
    }

    const storyBuffer = await renderStory(storyType, storyData);
    const storyPath = `stories/${post.publish_date}/${slot}.png`;
    await supabase.storage.from('content').upload(storyPath, storyBuffer, { contentType: 'image/png', upsert: true });
    const { data: storyUrl } = supabase.storage.from('content').getPublicUrl(storyPath);
    const storyId = await publishStory(storyUrl.publicUrl);

    // Save story ID
    await supabase
      .from('generated_content')
      .update({ ig_story_id: storyId })
      .eq('id', post.id);

    await sendMessage(`📖 [${slot}] Story pubblicata`);

    return res.json({ slot, storyId });
  } catch (err) {
    await sendMessage(`⚠️ [${slot}] Story fallita: <code>${err.message?.slice(0, 200)}</code>`);
    return res.status(500).json({ slot, error: err.message });
  }
}
