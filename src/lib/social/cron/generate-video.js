// Generate social VIDEO content: forwards video topics to the
// `generate-social-video` Supabase Edge Function, which does the heavy AI work
// (Flux nano-banana → Kling/fal.ai video → Lambda FFmpeg compose) and writes
// the resulting MP4 into generated_content (type='reel'/'story', status='ready').
//
// The site does NOT have the AI keys (REPLICATE_API_TOKEN, FAL_API_KEY, AWS
// Lambda creds) — those live in the edge function. So this handler is a thin
// trigger that forwards with the BATCH_STAGING_CRON_SECRET.
//
// Query params:
//   ?secret=<CRON_SECRET>            auth (or x-cron-secret header)
//   ?sync=1                          run synchronously (otherwise self-invoke async)
//   ?topic_id=<uuid>                 process one specific topic (manual trigger)
//
// Cron-job.org kills at 30s and may retry on timeout → duplicate pipelines, so
// the default path responds immediately and self-invokes with ?sync=1 (same
// pattern as generate.js). The edge function is idempotent: it only touches
// content_topics with rubric='video' AND status='proposed', flipping them to
// 'generated', so a stray re-run finds nothing to do.
//
// Endpoint: /api/social/cron/generate-video?secret=<CRON_SECRET>

export const config = { maxDuration: 300 }; // sync pass can run up to 5 min

const EDGE_FUNCTION = 'generate-social-video';

function checkAuth(req) {
  if (req.headers['x-vercel-cron'] === '1') return true;
  const expected = (process.env.CRON_SECRET || '').trim();
  if (!expected) return true; // No secret = allow (dev mode)
  const received = (
    req.headers['x-cron-secret'] ||
    req.headers.authorization?.replace('Bearer ', '') ||
    req.query?.secret ||
    ''
  ).trim();
  return received === expected;
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate');

  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const isSync = req.query.sync === '1';
  const topicId = req.query.topic_id;

  // ── Async kickoff: respond immediately, self-invoke in background ──────
  if (!isSync) {
    const qs = new URLSearchParams();
    qs.set('secret', req.query.secret || '');
    qs.set('sync', '1');
    if (topicId) qs.set('topic_id', topicId);
    const selfUrl = `https://${req.headers.host || 'getnearme.it'}/api/social/cron/generate-video?${qs}`;
    fetch(selfUrl).catch(() => {});
    return res.json({
      ok: true,
      message: `generate-video triggered async${topicId ? ` (topic_id=${topicId})` : ''}`,
    });
  }

  // ── Sync pass: forward to the edge function and wait ───────────────────
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const cronSecret = process.env.BATCH_STAGING_CRON_SECRET;

  if (!supabaseUrl) {
    return res.status(500).json({ error: 'NEXT_PUBLIC_SUPABASE_URL not set' });
  }
  if (!cronSecret) {
    return res.status(500).json({
      error:
        'BATCH_STAGING_CRON_SECRET not set on the site. Add it to Vercel env ' +
        '(must match the edge function env) to enable video generation.',
    });
  }

  const edgeUrl = `${supabaseUrl}/functions/v1/${EDGE_FUNCTION}`;
  const edgeBody = topicId ? { topic_id: topicId } : {};

  try {
    const edgeRes = await fetch(edgeUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-cron-secret': cronSecret,
      },
      body: JSON.stringify(edgeBody),
    });

    const text = await edgeRes.text();
    let json;
    try {
      json = JSON.parse(text);
    } catch {
      json = { raw: text };
    }

    if (!edgeRes.ok) {
      console.error('[generate-video] edge function error:', edgeRes.status, text);
      return res.status(502).json({
        error: 'edge function failed',
        status: edgeRes.status,
        detail: json,
      });
    }

    return res.json({ ok: true, edge: EDGE_FUNCTION, ...json });
  } catch (err) {
    console.error('[generate-video] forward error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
