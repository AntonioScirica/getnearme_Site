import Parser from 'rss-parser';

const parser = new Parser({
  timeout: 10000,
  headers: { 'User-Agent': 'AIForDumbs/1.0' },
  customFields: {
    item: [
      ['media:content', 'mediaContent', { keepArray: true }],
      ['media:thumbnail', 'mediaThumbnail'],
      ['content:encoded', 'contentEncoded'],
    ],
  },
});

function extractImageUrl(item) {
  if (item.enclosure?.url && /\.(jpg|jpeg|png|webp|gif)/i.test(item.enclosure.url)) {
    return item.enclosure.url;
  }
  if (item.mediaThumbnail?.$?.url) return item.mediaThumbnail.$.url;
  if (item.mediaContent) {
    const media = Array.isArray(item.mediaContent) ? item.mediaContent : [item.mediaContent];
    for (const m of media) {
      const url = m.$?.url || m.url;
      if (url && /image/i.test(m.$?.medium || m.$?.type || 'image')) return url;
    }
  }
  const html = item.contentEncoded || item.content || '';
  const imgMatch = html.match(/<img[^>]+src=["']([^"']+\.(jpg|jpeg|png|webp))[^"']*["']/i);
  if (imgMatch) return imgMatch[1];
  return '';
}

// Feeds per account
const ACCOUNT_FEEDS = {
  getnearme: [
    // Italian real estate — verified working 2026-06-18
    { name: 'Confedilizia', url: 'https://www.confedilizia.it/feed/' },
    { name: 'Scenari Immobiliari', url: 'https://www.scenari-immobiliari.it/feed/' },
    { name: 'BuildNews', url: 'https://www.buildnews.it/feed/' },
    // Broader Italian real estate (may 404 — gracefully skipped)
    { name: 'Idealista News', url: 'https://www.idealista.it/news/feed' },
    { name: 'Immobiliare.it News', url: 'https://www.immobiliare.it/news/feed/' },
    { name: 'Il Sole 24 Ore Casa', url: 'https://www.ilsole24ore.com/rss/notizie/casa.xml' },
  ],
};

const RE_RELEVANCE = /\b(immobil|casa|appartament|affitt|mutuo|catast|compravend|locazione|condomini|edilizia|urbanistic|rigenerazion|superbonus|bonus.*casa|ecobonus|sismabonus|ristrutturazion|mercato.*residenzial|prezzi.*case|proptech|agenz.*immobiliar|notai|rogito|ipoteca|certificat.*energetic|ape\b|classe.*energetic|nuda.*propriet|rent.*to.*buy|coworking|co-living|logistic|real.*estate|housing|costruzion|cantier|infrastruttur|smart.*building|domotica|efficien.*energetic|sostenibil|green.*building|bim\b|facility|property|tenant|landlord|investiment.*immobiliar|fondi.*immobiliar|reit\b|asta.*giudiziari|esecuzion.*immobiliar|cedolar.*secca|imu\b|tasi\b|tari\b|agenzia.*entrate|visur|planimetr|voltur)\b/i;

const ALWAYS_CORE = ['Confedilizia', 'Scenari Immobiliari', 'BuildNews'];

function isRelevant(title, summary, source) {
  if (ALWAYS_CORE.includes(source)) return true;
  return RE_RELEVANCE.test(title + ' ' + summary);
}

export function getFeedsForAccount(accountId) {
  return ACCOUNT_FEEDS[accountId] || ACCOUNT_FEEDS.getnearme;
}

export async function fetchRSSFeeds(accountId = 'getnearme') {
  const feeds = getFeedsForAccount(accountId);
  const results = [];

  for (const feed of feeds) {
    try {
      const parsed = await parser.parseURL(feed.url);
      const items = (parsed.items || []).slice(0, 10)
        .map(item => ({
          title: item.title?.trim() || '',
          url: item.link || '',
          summary: (item.contentSnippet || item.content || '').slice(0, 500),
          published_at: item.isoDate || item.pubDate || new Date().toISOString(),
          source: feed.name,
          source_type: 'rss',
          metadata: {
            source_name: feed.name,
            source_url: feed.url,
            image_url: extractImageUrl(item),
            author: item.creator || item.author || '',
          },
        }))
        .filter(item => isRelevant(item.title, item.summary, item.source));
      results.push(...items);
    } catch (err) {
      console.error(`RSS fetch failed for ${feed.name}:`, err.message);
    }
  }

  return results;
}
