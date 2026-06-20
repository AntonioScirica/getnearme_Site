import supabase from '../supabase.js';
import { fetchRSSFeeds } from '../sources/rss.js';

export const config = { maxDuration: 120 };

function checkAuth(req) {
  // Vercel crons add this header automatically
  if (req.headers['x-vercel-cron'] === '1') return true;
  // Fallback: manual secret for testing
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

function normalizeTitle(t) {
  return t.toLowerCase().replace(/[^a-zà-ú0-9 ]/g, '').replace(/\s+/g, ' ').trim();
}

function titleWords(t) {
  return new Set(normalizeTitle(t).split(' ').filter(w => w.length > 3));
}

function isSemanticallyDuplicate(newTitle, existingTitles) {
  const nw = titleWords(newTitle);
  if (nw.size < 3) return false;
  for (const existing of existingTitles) {
    const ew = titleWords(existing);
    const intersection = [...nw].filter(w => ew.has(w)).length;
    const similarity = intersection / Math.min(nw.size, ew.size);
    if (similarity >= 0.6) return true;
  }
  return false;
}

async function upsertItems(items, accountId = 'getnearme') {
  // Fetch existing titles for semantic dedup
  const { data: existing } = await supabase
    .from('ai_news_raw')
    .select('title')
    .eq('account_id', accountId)
    .order('discovered_at', { ascending: false })
    .limit(200);
  const existingTitles = (existing || []).map(r => r.title);

  let inserted = 0;
  let deduped = 0;
  for (const item of items) {
    if (!item.title || !item.url) continue;
    if (isSemanticallyDuplicate(item.title, existingTitles)) {
      deduped++;
      continue;
    }
    const { error } = await supabase
      .from('ai_news_raw')
      .upsert(
        {
          title: item.title.slice(0, 500),
          url: item.url,
          summary: (item.summary || '').slice(0, 1000),
          published_at: item.published_at,
          source: item.source,
          source_type: item.source_type,
          discovered_at: new Date().toISOString(),
          metadata: item.metadata || {},
          account_id: accountId,
        },
        { onConflict: 'url' }
      );
    if (!error) {
      inserted++;
      existingTitles.push(item.title);
    }
  }
  return { inserted, deduped };
}

export { checkAuth, upsertItems };

export default async function handler(req, res) {
  if (!checkAuth(req)) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // Async mode: respond immediately, self-invoke with ?sync=1
  if (!req.query.sync) {
    const qs = new URLSearchParams(req.query);
    qs.set('sync', '1');
    fetch(`https://${req.headers.host || 'getnearme.it'}/api/social/cron/discover?${qs}`).catch(() => {});
    return res.json({ ok: true, message: 'discover triggered async' });
  }

  const accountId = req.query.account || 'getnearme';

  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  await supabase
    .from('ai_news_raw')
    .delete()
    .eq('account_id', accountId)
    .lt('published_at', `${yesterday}T00:00:00Z`);

  // RSS feeds
  const rssItems = await fetchRSSFeeds(accountId);
  const { inserted: rssInserted, deduped: rssDeduped } = await upsertItems(rssItems, accountId);
  console.log(`RSS [${accountId}]: ${rssItems.length} fetched, ${rssInserted} inserted, ${rssDeduped} deduped`);

  return res.json({
    account: accountId,
    rss: { discovered: rssItems.length, inserted: rssInserted, deduped: rssDeduped },
  });
}
