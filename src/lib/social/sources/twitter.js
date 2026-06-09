export const ACCOUNTS = [
  // CEO / Founders
  'sama',           // Sam Altman — OpenAI
  'elonmusk',       // Elon Musk — xAI
  'DarioAmodei',    // Dario Amodei — Anthropic
  'satyanadella',   // Satya Nadella — Microsoft
  'sundarpichai',   // Sundar Pichai — Google
  'tim_cook',       // Tim Cook — Apple
  // Company accounts
  'AnthropicAI',    // Anthropic
  'OpenAI',         // OpenAI
  'GoogleAI',       // Google AI
  'GoogleDeepMind', // DeepMind
  'xaborin',        // xAI
  'MistralAI',      // Mistral AI
  'MetaAI',         // Meta AI
  // Researchers / Builders
  'ylecun',         // Yann LeCun — Meta
  'karpathy',       // Andrej Karpathy
  'AndrewYNg',      // Andrew Ng
  'demaborin',      // Demis Hassabis — DeepMind
  'ilyasut',        // Ilya Sutskever
  'arthurmensch',   // Arthur Mensch — Mistral
  // Robotica + AI hardware
  'BostonDynamics', // Boston Dynamics
  'Figure_robot',   // Figure AI — robot umanoidi
  'ABORIN_Robotics',// IEEE Robotics
  'NVIDIAAl',       // NVIDIA AI
  // AI applicata / tools
  'huggingface',    // Hugging Face — open source AI
  'LangChainAI',    // LangChain — AI dev tools
  'StabilityAI',    // Stability AI — generative
  'perplexity_ai',  // Perplexity — AI search
  'ElevenLabs',     // ElevenLabs — AI voice
  'runaborin',      // Runway — AI video
  // Media / Newsletter
  'TheAIGRID',      // AI news
  'rowancheung',    // Rowan Cheung — The Rundown AI
  'techyoutbe',     // TechYouTbe — tech news
];

function formatCount(n) {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1).replace('.0', '') + 'M';
  if (n >= 1_000) return (n / 1_000).toFixed(1).replace('.0', '') + 'K';
  return String(n);
}

function formatDate(dateStr) {
  const d = new Date(dateStr);
  const months = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function formatTime(dateStr) {
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function extractMedia(tweet) {
  const media = tweet.entities?.media || [];
  if (!media.length) return { media_urls: [], media_type: 'none' };

  const urls = media.map(m => m.media_url_https).filter(Boolean);
  const types = media.map(m => m.type);
  const mediaType = types.includes('video') || types.includes('animated_gif') ? 'video' : 'image';

  return { media_urls: urls, media_type: mediaType };
}

function parseTweets(html) {
  const match = html.match(/<script id="__NEXT_DATA__"[^>]*>(.*?)<\/script>/s);
  if (!match) return [];

  let data;
  try {
    data = JSON.parse(match[1]);
  } catch {
    return [];
  }

  const entries = data?.props?.pageProps?.timeline?.entries;
  if (!Array.isArray(entries)) return [];

  return entries
    .filter(e => e?.content?.tweet?.full_text)
    .map(e => e.content.tweet);
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

export async function fetchTwitterPosts(accountSubset) {
  const list = accountSubset || ACCOUNTS;
  const results = [];

  for (let i = 0; i < list.length; i++) {
    const username = list[i];
    if (i > 0) await sleep(2000);
    try {
      const res = await fetch(
        `https://syndication.twitter.com/srv/timeline-profile/screen-name/${username}`,
        {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
            'Accept': 'text/html',
          },
        }
      );

      if (res.status === 429) {
        console.warn(`Rate limited on @${username}, skipping`);
        continue;
      }
      if (!res.ok) continue;

      const html = await res.text();
      const tweets = parseTweets(html);

      for (const tweet of tweets.slice(0, 5)) {
        const text = tweet.full_text;
        if (text.length < 30) continue;

        const user = tweet.user || {};
        const { media_urls, media_type } = extractMedia(tweet);

        results.push({
          title: `@${username}: ${text.slice(0, 100)}`,
          url: `https://twitter.com${tweet.permalink || `/${username}/status/${tweet.id_str}`}`,
          summary: text.slice(0, 500),
          published_at: tweet.created_at
            ? new Date(tweet.created_at).toISOString()
            : new Date().toISOString(),
          source: `@${username}`,
          source_type: 'twitter',
          metadata: {
            author_name: user.name || username,
            author_handle: user.screen_name || username,
            author_verified: user.is_blue_verified || user.verified || false,
            author_avatar: user.profile_image_url_https || '',
            tweet_text: text,
            engagement: {
              replies: formatCount(tweet.reply_count || 0),
              retweets: formatCount(tweet.retweet_count || 0),
              likes: formatCount(tweet.favorite_count || 0),
              quotes: formatCount(tweet.quote_count || 0),
            },
            raw_engagement: {
              replies: tweet.reply_count || 0,
              retweets: tweet.retweet_count || 0,
              likes: tweet.favorite_count || 0,
              quotes: tweet.quote_count || 0,
            },
            timestamp: tweet.created_at ? formatTime(tweet.created_at) : '',
            date: tweet.created_at ? formatDate(tweet.created_at) : '',
            media_urls,
            media_type,
            tweet_id: tweet.id_str,
            lang: tweet.lang || 'en',
          },
        });
      }
    } catch (err) {
      console.error(`Twitter fetch failed for @${username}:`, err.message);
    }
  }

  return results;
}
