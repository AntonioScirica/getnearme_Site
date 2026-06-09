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
    // Core AI news
    { name: 'TechCrunch AI', url: 'https://techcrunch.com/category/artificial-intelligence/feed/' },
    { name: 'The Verge AI', url: 'https://www.theverge.com/rss/ai-artificial-intelligence/index.xml' },
    { name: 'Wired AI', url: 'https://www.wired.com/feed/tag/ai/latest/rss' },
    { name: 'VentureBeat AI', url: 'https://venturebeat.com/category/ai/feed/' },
    // Company blogs
    { name: 'OpenAI Blog', url: 'https://openai.com/blog/rss.xml' },
    { name: 'Google AI Blog', url: 'https://blog.google/technology/ai/rss/' },
    { name: 'Anthropic Blog', url: 'https://www.anthropic.com/rss.xml' },
    { name: 'Hugging Face Blog', url: 'https://huggingface.co/blog/feed.xml' },
    { name: 'NVIDIA AI Blog', url: 'https://blogs.nvidia.com/feed/' },
    { name: 'Meta AI Blog', url: 'https://ai.meta.com/blog/rss/' },
    // AI research & tools
    { name: 'Towards AI', url: 'https://pub.towardsai.net/feed' },
    { name: 'The Rundown AI', url: 'https://www.therundown.ai/feed' },
    { name: 'AI News', url: 'https://buttondown.com/ainews/rss' },
    { name: 'Product Hunt AI', url: 'https://www.producthunt.com/feed?category=ai' },
    // Robotics
    { name: 'IEEE Spectrum Robotics', url: 'https://spectrum.ieee.org/feeds/topic/robotics.rss' },
    { name: 'The Robot Report', url: 'https://www.therobotreport.com/feed/' },
  ],
  // Real estate feeds for when GetNearMe switches to its own topics.
  // Most return 404/403 right now (checked 2026-06-10) — fix URLs before enabling.
  getnearme_immobiliare: [
    { name: 'Idealista News', url: 'https://www.idealista.it/news/feed' },
    { name: 'Immobiliare.it News', url: 'https://www.immobiliare.it/news/feed/' },
    { name: 'Il Sole 24 Ore Casa', url: 'https://www.ilsole24ore.com/rss/notizie/casa.xml' },
    { name: 'Casa.it Blog', url: 'https://www.casa.it/blog/feed/' },
    { name: 'MutuiOnline', url: 'https://www.mutuionline.it/rss/news.xml' },
    { name: 'Confedilizia', url: 'https://www.confedilizia.it/feed/' },
    { name: 'Scenari Immobiliari', url: 'https://www.scenari-immobiliari.it/feed/' },
  ],
};

// Backwards compat
const RSS_FEEDS = ACCOUNT_FEEDS.getnearme;

const AI_RELEVANCE = /\b(claude|gemini|gpt|openai|anthropic|chatgpt|llm|copilot|midjourney|dall-e|sora|mistral|llama|ai model|language model|neural|deep learning|machine learning|transformer|diffusion|generative ai|artificial intelligence|robot|autonomous|self-driving|computer vision|nlp|rag|fine-tun|embedding|token|benchmark|reasoning|multimodal|agent|foundation model|chatbot|text-to|image gen|voice ai|ai chip|gpu|tensor|inference|training data|prompt|hallucination|alignment|safety ai|ai regulation|ai act|superintelligence|agi)\b/i;

const ALWAYS_CORE = ['OpenAI Blog', 'Anthropic Blog', 'Google AI Blog', 'Meta AI Blog', 'Hugging Face Blog', 'The Robot Report'];

function isAIRelevant(title, summary, source) {
  if (ALWAYS_CORE.includes(source)) return true;
  return AI_RELEVANCE.test(title + ' ' + summary);
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
        .filter(item => isAIRelevant(item.title, item.summary, item.source));
      results.push(...items);
    } catch (err) {
      console.error(`RSS fetch failed for ${feed.name}:`, err.message);
    }
  }

  return results;
}
