// Publish PED content to Instagram by time slot.
//
// Query params:
//   ?secret=<CRON_SECRET>     auth
//   ?slot=0900|1230|1730|1900 which slot to publish (required unless story mode)
//   ?story=1&slot=<slot>      publish the story teaser for an already-published post
//   ?date=YYYY-MM-DD          override publish_date (default: today, Europe/Rome)
//   ?dry=1                    dry run: select + log, NO Instagram calls
//   ?sync=1                   run synchronously
//
// Cron design (cron-job.org):
//   09:00 → ?slot=0900            12:30 → ?slot=1230
//   17:30 → ?slot=1730            19:00 → ?slot=1900
//   +10 min each → ?story=1&slot=<same>

import supabase from '../supabase.js';
import { publishImage, publishCarousel, publishStory, getRecentMedia } from '../ped/publish-ig.js';
import { sendMessage } from '../telegram.js';

export const config = { maxDuration: 120 };

const SLOT_TIMES = {
  '0900': '09:00',
  '1200': '12:00',
  '1800': '18:00',
  '2000': '20:00',
};

function romeToday() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Europe/Rome' }).format(new Date());
}

/**
 * Rate-limit recovery: check whether IG already has the post (caption prefix match).
 */
async function checkIfPublishedOnIG(post) {
  try {
    await new Promise((r) => setTimeout(r, 8000));
    const media = await getRecentMedia(5);
    const prefix = (post.content_data?.caption || '').slice(0, 50);
    if (!prefix) return null;
    const match = media.find((m) => m.caption?.startsWith(prefix));
    return match?.id || null;
  } catch {
    return null;
  }
}

async function markPublished(postId, fields) {
  for (let attempt = 1; attempt <= 2; attempt++) {
    const { data, error } = await supabase
      .from('generated_content')
      .update(fields)
      .eq('id', postId)
      .select('id, status');
    if (!error && data?.length === 1) return true;
    console.error(`markPublished attempt ${attempt} failed:`, error?.message || `rows=${data?.length || 0}`);
  }
  await sendMessage(`⚠️ <b>DB non aggiornato dopo publish PED</b> (id ${postId}). Controllare Supabase.`);
  return false;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');
  const { checkAuth } = await import('./discover.js');
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Run INLINE (no async self-invoke). On Vercel the fire-and-forget fetch after
  // res.json() is frequently killed when the function returns, so the real publish
  // never ran — that's why the cron answered 200 but nothing was posted. The route
  // (maxDuration 300) lets this finish even if cron-job.org's HTTP client times out;
  // the dedup check (checkIfPublishedOnIG) makes any cron retry a no-op.

  const slot = req.query.slot;
  const slotTime = SLOT_TIMES[slot];
  if (!slotTime) {
    return res.status(400).json({ error: 'Missing or invalid slot', valid_slots: Object.keys(SLOT_TIMES) });
  }

  const accountId = req.query.account || 'getnearme';
  const day = req.query.date || romeToday();
  const dry = req.query.dry === '1';

  // ── Story mode ──────────────────────────────────────────────────────
  if (req.query.story === '1') {
    const { data: posts } = await supabase
      .from('generated_content')
      .select('*')
      .eq('publish_date', day)
      .eq('account_id', accountId)
      .eq('type', 'ped')
      .eq('status', 'published')
      .eq('content_data->>slot_time', slotTime)
      .limit(1);

    const post = posts?.[0];
    if (!post) return res.json({ message: `No published PED post for slot ${slotTime} on ${day}` });
    if (post.ig_story_id) return res.json({ message: 'Story already published', storyId: post.ig_story_id });

    const storyUrl = post.content_data?.story_url;
    if (!storyUrl) return res.json({ message: 'No story rendered for this post' });

    if (dry) {
      return res.json({ dry: true, slot: slotTime, would_publish_story: storyUrl, post_id: post.post_id });
    }

    try {
      const storyId = await publishStory(storyUrl);
      await supabase.from('generated_content').update({ ig_story_id: storyId }).eq('id', post.id);
      await sendMessage(`📖 [PED ${slotTime}] Story pubblicata`);
      return res.json({ slot: slotTime, storyId });
    } catch (err) {
      await sendMessage(`⚠️ [PED ${slotTime}] Story fallita: <code>${(err.message || '').slice(0, 200)}</code>`);
      return res.status(500).json({ slot: slotTime, error: err.message });
    }
  }

  // Recovery: righe bloccate in 'publishing' (crash/timeout tra claim e
  // markPublished) non verrebbero mai più riprese. A inizio cron ogni
  // 'publishing' e' stale: se e' gia' su IG marca pubblicato, altrimenti torna
  // 'approved' (la dedup pre-publish ricontrolla IG, niente doppioni).
  {
    const { data: stuck } = await supabase
      .from('generated_content')
      .select('id, ig_post_id')
      .eq('account_id', accountId)
      .eq('type', 'ped')
      .eq('status', 'publishing')
      .lte('publish_date', day);
    for (const s of (stuck || [])) {
      await supabase.from('generated_content')
        .update(s.ig_post_id ? { status: 'published' } : { status: 'approved', error: 'recovered_from_publishing' })
        .eq('id', s.id);
    }
  }

  // ── Post mode ───────────────────────────────────────────────────────
  const { data: posts } = await supabase
    .from('generated_content')
    .select('*')
    .eq('publish_date', day)
    .eq('account_id', accountId)
    .eq('type', 'ped')
    .eq('status', 'approved')
    .eq('content_data->>slot_time', slotTime)
    .order('created_at', { ascending: true })
    .limit(1);

  const post = posts?.[0];
  if (!post) {
    return res.json({ message: `No approved PED content for slot ${slotTime} on ${day}` });
  }
  if (post.published_at) {
    return res.json({ message: `Slot ${slotTime} already published`, post_id: post.post_id });
  }

  if (dry) {
    return res.json({
      dry: true,
      slot: slotTime,
      would_publish: {
        post_id: post.post_id,
        title: post.content_data?.title,
        slides: post.image_urls?.length,
        caption_preview: (post.content_data?.caption || '').slice(0, 200),
        story_url: post.content_data?.story_url,
      },
    });
  }

  // Atomic claim: flip approved → publishing so a second concurrent invocation
  // (cron retry, double cron, manual run) can't double-post the same slot. Only
  // one update matches status='approved'; the loser exits without publishing.
  {
    const { data: claimed } = await supabase
      .from('generated_content')
      .update({ status: 'publishing' })
      .eq('id', post.id)
      .eq('status', 'approved')
      .select('id');
    if (!claimed?.length) {
      return res.json({ message: `Slot ${slotTime} already being published`, post_id: post.post_id });
    }
  }

  // Pre-publish dedup: if IG already has it, just mark published
  {
    const recoveredId = await checkIfPublishedOnIG(post);
    if (recoveredId) {
      await markPublished(post.id, {
        status: 'published',
        ig_post_id: recoveredId,
        published_at: new Date().toISOString(),
        error: null,
      });
      return res.json({ slot: slotTime, published: post.post_id, igId: recoveredId, recovered: true });
    }
  }

  try {
    const caption = post.content_data?.caption || '';
    const urls = post.image_urls || [];

    let igId;
    if (urls.length === 1) {
      igId = await publishImage(urls[0], caption);
    } else {
      igId = await publishCarousel(urls, caption);
    }

    await markPublished(post.id, {
      status: 'published',
      ig_post_id: igId,
      published_at: new Date().toISOString(),
    });

    await sendMessage(
      `✅ [PED ${slotTime}] Pubblicato: <b>${post.content_data?.title || post.post_id}</b>\nIG: ${igId}`
    );

    return res.json({ slot: slotTime, published: post.post_id, igId });
  } catch (err) {
    const isRateLimit = err.message?.includes('request limit') || err.message?.includes('rate');

    if (isRateLimit) {
      const recoveredId = await checkIfPublishedOnIG(post);
      if (recoveredId) {
        await markPublished(post.id, {
          status: 'published',
          ig_post_id: recoveredId,
          published_at: new Date().toISOString(),
          error: null,
        });
        return res.json({ slot: slotTime, published: post.post_id, igId: recoveredId, recovered: true });
      }
      await sendMessage(`⏳ [PED ${slotTime}] IG rate limit, resta approved per retry: <b>${post.post_id}</b>`);
      // Release the claim (publishing → approved) so a later cron can retry this slot.
      await supabase
        .from('generated_content')
        .update({ status: 'approved', error: `rate_limit: ${new Date().toISOString()}` })
        .eq('id', post.id);
    } else {
      await sendMessage(`❌ [PED ${slotTime}] Errore: <b>${post.post_id}</b> — ${err.message}`);
      await supabase
        .from('generated_content')
        .update({ status: 'failed', error: err.message })
        .eq('id', post.id);
    }

    return res.status(500).json({ slot: slotTime, error: err.message, willRetry: isRateLimit });
  }
}
