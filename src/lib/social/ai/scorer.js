/**
 * Deterministic scoring: source tier (0-20), engagement (0-10), freshness (0-10).
 * No AI calls — pure computation.
 */

// Source tier → 0-20 score
const SOURCE_TIERS = {
  // CEO / Founders → 20
  'sama': 20, 'DarioAmodei': 20, 'satyanadella': 20, 'sundarpichai': 20,
  'elonmusk': 20, 'tim_cook': 20, 'demaborin': 20, 'ilyasut': 20, 'arthurmensch': 20,

  // Official company accounts → 20
  'AnthropicAI': 20, 'OpenAI': 20, 'GoogleAI': 20, 'GoogleDeepMind': 20,
  'MetaAI': 20, 'MistralAI': 20, 'NVIDIAAl': 20, 'xaborin': 20,
  'OpenAI Blog': 20, 'Google AI Blog': 20, 'NVIDIA AI Blog': 20,

  // Top researchers → 16
  'ylecun': 16, 'karpathy': 16, 'AndrewYNg': 16,

  // Major press → 12
  'TechCrunch AI': 12, 'MIT Tech Review': 12, 'Wired AI': 12, 'The Verge AI': 12,
  'Ars Technica AI': 12, 'VentureBeat AI': 12, 'IEEE Spectrum Robotics': 12,
  'The Robot Report': 12, 'Hugging Face Blog': 12,

  // AI tools & platforms → 8
  'huggingface': 8, 'LangChainAI': 8, 'StabilityAI': 8,
  'perplexity_ai': 8, 'ElevenLabs': 8, 'runaborin': 8,
  'BostonDynamics': 8, 'Figure_robot': 8,

  // Media / newsletters → 4
  'TheAIGRID': 4, 'rowancheung': 4,
  'Towards AI': 4, 'Analytics Vidhya': 4,
};

const DEFAULT_SOURCE_SCORE = 6; // unknown sources get middle-low score

/**
 * Parse engagement from metadata. Handles both number and string formats ("2.4K", "42K").
 */
function parseEngagement(metadata) {
  if (!metadata?.raw_engagement) return 0;
  const e = metadata.raw_engagement;

  function parseNum(val) {
    if (typeof val === 'number') return val;
    if (typeof val !== 'string') return 0;
    const clean = val.replace(/,/g, '').trim();
    if (clean.endsWith('K') || clean.endsWith('k')) return parseFloat(clean) * 1000;
    if (clean.endsWith('M') || clean.endsWith('m')) return parseFloat(clean) * 1000000;
    return parseInt(clean, 10) || 0;
  }

  const likes = parseNum(e.likes);
  const retweets = parseNum(e.retweets);
  const replies = parseNum(e.replies);
  return likes + retweets * 2 + replies;
}

/**
 * Engagement → 0-10 (log scale).
 * 0=0, 1K=3, 10K=6, 50K+=10
 */
function scoreEngagement(metadata) {
  const total = parseEngagement(metadata);
  if (total <= 0) return 0;
  // log10(1000)=3 → 3, log10(10000)=4 → 6, log10(50000)=4.7 → 10
  const raw = Math.log10(total) * 2.5;
  return Math.min(10, Math.max(0, Math.round(raw * 10) / 10));
}

/**
 * Freshness → 0-10 based on hours since publication.
 */
function scoreFreshness(publishedAt) {
  if (!publishedAt) return 0;
  const hoursAgo = (Date.now() - new Date(publishedAt).getTime()) / 3600000;
  if (hoursAgo < 6) return 10;
  if (hoursAgo < 12) return 8;
  if (hoursAgo < 24) return 5;
  if (hoursAgo < 36) return 2;
  return 0;
}

/**
 * Compute all deterministic scores for a news item.
 * @returns {{ source: number, engagement: number, freshness: number, deterministicTotal: number }}
 */
export function computeDeterministicScores(item) {
  const source = SOURCE_TIERS[item.source] ?? DEFAULT_SOURCE_SCORE;
  const engagement = scoreEngagement(item.metadata);
  const freshness = scoreFreshness(item.published_at);
  return {
    source,
    engagement,
    freshness,
    deterministicTotal: source + engagement + freshness,
  };
}
