/**
 * News planner orchestrator. Thin wrapper that calls:
 * 1. scorer.js (deterministic scores)
 * 2. scorer-prompt.js (Claude semantic scores)
 * 3. selector.js (constraint-based pick)
 * 4. headline-generator.js (Italian headlines for final 5)
 */

import { computeDeterministicScores } from './scorer.js';
import { scoreWithClaude } from './scorer-prompt.js';
import { selectTopN } from './selector.js';
import { generateHeadlines } from './headline-generator.js';

/**
 * Rank news for a specific edition.
 * @param {Array} newsItems - all news from DB (up to 300)
 * @param {object} opts
 * @param {'morning'|'evening'} opts.edition
 * @param {string[]} opts.excludeIds - news IDs already used (last 7 days)
 * @param {string[]} opts.excludeSlugs - topic_slugs from other edition today
 * @param {Array} opts.alreadyPublished - [{headline, topic_slug}] from other edition (shown to Claude)
 * @param {string[]} opts.excludeVideoNewsIds - news IDs already used as video topics (last 7 days)
 * @param {string[]} opts.excludeVideoSlugs - topic_slugs from past video topics (last 7 days)
 */
export async function rankNewsForDigest(newsItems, opts = {}) {
  const edition = opts.edition || 'morning';
  const excludeIds = new Set(opts.excludeIds || []);
  const excludeSlugs = opts.excludeSlugs || [];
  const alreadyPublished = opts.alreadyPublished || [];
  const excludeVideoNewsIds = new Set(opts.excludeVideoNewsIds || []);
  const excludeVideoSlugs = new Set((opts.excludeVideoSlugs || []).map(s => s.toLowerCase()));

  // === PHASE 1: PREFILTER ===
  console.log(`=== RAW: ${newsItems.length} items, excludeIds: ${excludeIds.size}`);
  let available = newsItems.filter(n => !excludeIds.has(n.id));
  console.log(`=== AFTER ID FILTER: ${available.length}`);

  // Exclude news with no real content (empty or too short summary)
  // If too few pass strict filter, relax to title-only (MIN 10 chars)
  const MIN_SUMMARY_STRICT = 50;
  const MIN_SUMMARY_RELAXED = 10;
  const strict = available.filter(n => (n.summary || '').trim().length >= MIN_SUMMARY_STRICT);
  const relaxed = available.filter(n => {
    const len = (n.summary || '').trim().length;
    return len >= MIN_SUMMARY_RELAXED && len < MIN_SUMMARY_STRICT;
  });

  if (strict.length >= 10) {
    // Enough quality candidates, skip low-content ones
    const skipped = available.filter(n => (n.summary || '').trim().length < MIN_SUMMARY_STRICT);
    skipped.forEach(n => console.log(`Prefilter skip (${(n.summary || '').trim().length} chars): "${n.title}"`));
    available = strict;
  } else {
    // Few candidates: include relaxed (short summary) to guarantee minimum 3
    console.log(`⚠️ Only ${strict.length} strict candidates, including ${relaxed.length} relaxed (10-49 chars)`);
    const tooShort = available.filter(n => (n.summary || '').trim().length < MIN_SUMMARY_RELAXED);
    tooShort.forEach(n => console.log(`Prefilter skip (${(n.summary || '').trim().length} chars): "${n.title}"`));
    available = [...strict, ...relaxed];
  }

  const now = new Date();
  const maxAge = new Date(now.getTime() - 36 * 60 * 60 * 1000);

  // Time window filter — if too few after strict window, expand to 48h
  let timeFiltered;
  if (edition === 'morning') {
    const cutoffStart = new Date(now);
    cutoffStart.setDate(cutoffStart.getDate() - 1);
    cutoffStart.setHours(0, 0, 0, 0);
    const cutoffEnd = new Date(now);
    cutoffEnd.setHours(8, 0, 0, 0);

    const primary = available.filter(n => {
      const pub = new Date(n.published_at);
      return pub >= cutoffStart && pub <= cutoffEnd;
    });
    const secondary = available.filter(n => {
      const pub = new Date(n.published_at);
      return pub < cutoffStart && pub >= maxAge;
    });
    timeFiltered = [...primary, ...secondary];
  } else {
    const cutoffStart = new Date(now);
    cutoffStart.setHours(8, 0, 0, 0);
    const cutoffEnd = new Date(now);
    cutoffEnd.setHours(19, 0, 0, 0);

    const primary = available.filter(n => {
      const pub = new Date(n.published_at);
      return pub >= cutoffStart && pub <= cutoffEnd;
    });
    const secondary = available.filter(n => {
      const pub = new Date(n.published_at);
      return pub < cutoffStart && pub >= maxAge;
    });
    timeFiltered = [...primary, ...secondary];
  }

  // If time window too restrictive, expand to full 48h
  if (timeFiltered.length < 10) {
    const fullWindow = available.filter(n => new Date(n.published_at) >= new Date(now.getTime() - 48 * 60 * 60 * 1000));
    if (fullWindow.length > timeFiltered.length) {
      console.log(`⚠️ Time window too tight (${timeFiltered.length}), expanding to full 48h (${fullWindow.length})`);
      available = fullWindow;
    } else {
      available = timeFiltered;
    }
  } else {
    available = timeFiltered;
  }

  if (!available.length) {
    console.log('No news available after prefilter');
    return { top5: [] };
  }

  // Sort by deterministic score to pick top ~50 candidates for Claude
  const withDetScores = available.map(item => ({
    ...item,
    det: computeDeterministicScores(item),
  }));
  withDetScores.sort((a, b) => b.det.deterministicTotal - a.det.deterministicTotal);
  const candidates = withDetScores.slice(0, 50);

  console.log(`=== PREFILTER: ${newsItems.length} raw → ${available.length} available → ${candidates.length} candidates for Claude ===`);
  candidates.slice(0, 10).forEach((n, i) => {
    console.log(`${i + 1}. [det:${n.det.deterministicTotal}] [${n.source}] ${n.title}`);
  });

  // === PHASE 2: CLAUDE SCORING ===
  const claudeScored = await scoreWithClaude(candidates, alreadyPublished);

  // Merge deterministic + semantic → totalScore
  const fullyScored = claudeScored.map((item, i) => {
    const det = candidates[i].det;
    const sem = item.semanticScores;
    const totalScore = det.deterministicTotal + sem.market_impact + sem.novelty + sem.audience_utility + sem.risk;
    return {
      ...item,
      det,
      totalScore,
    };
  });

  console.log('=== SCORED (top 15) ===');
  [...fullyScored].sort((a, b) => b.totalScore - a.totalScore).slice(0, 15).forEach((n, i) => {
    const d = n.det;
    const s = n.semanticScores;
    console.log(`${i + 1}. [${n.totalScore}] src:${d.source} eng:${d.engagement} fresh:${d.freshness} | imp:${s.market_impact} nov:${s.novelty} util:${s.audience_utility} risk:${s.risk} | [${n.topic_slug}] [${n.source}] ${n.title}`);
  });

  // === PHASE 3: SELECT ===
  const selected = selectTopN(fullyScored, {
    count: 5,
    excludeSlugs,
  });

  console.log(`=== SELECTED ${selected.length} ===`);
  selected.forEach((n, i) => {
    console.log(`${i + 1}. [${n.totalScore}] [${n.topic_slug}] [${n.company}] ${n.title}`);
  });

  if (!selected.length) {
    console.log('No news passed selection constraints');
    return { top5: [], videoCandidate: null };
  }

  // === PHASE 3b: VIDEO CANDIDATE (6th news, prefer media) ===
  const selectedIds = new Set(selected.map(s => s.id || s.title));
  const excludeSlugSet = new Set((excludeSlugs || []).map(s => s.toLowerCase()));

  const afterSelected = fullyScored.filter(n => !selectedIds.has(n.id || n.title));
  // Quality bar: video deserves a strong news, not leftovers (was 20).
  // High bar on BASE score so media boost can't promote weak tweets over real news.
  const afterScore = afterSelected.filter(n => n.totalScore >= 50);
  // Video candidate: only dedup against past VIDEO topics, NOT carousel slugs
  // (a news topic can appear in carousel AND as video — different format)
  const remaining = afterScore
    .filter(n => !excludeVideoNewsIds.has(n.id))
    .filter(n => !excludeVideoSlugs.has((n.topic_slug || '').toLowerCase()));

  console.log(`=== VIDEO POOL: ${afterSelected.length} after top5 → ${afterScore.length} score≥50 → ${remaining.length} after video dedup`);

  // Score boost for media: video +20, image +10, twitter source +5
  const mediaBoost = (n) => {
    const mt = n.metadata?.media_type || 'none';
    let boost = 0;
    if (mt === 'video') boost += 20;
    else if (mt === 'image') boost += 10;
    if (n.source_type === 'twitter') boost += 5;
    return { ...n, videoScore: n.totalScore + boost };
  };
  const withMediaBoost = remaining.map(mediaBoost);
  withMediaBoost.sort((a, b) => b.videoScore - a.videoScore);

  let videoCandidate = withMediaBoost[0] || null;

  // Fallback: no strong unused news → reuse the best top5 news.
  // Better a video on a great already-published news (different format) than a weak one.
  if (!videoCandidate && selected.length) {
    const top5Pool = selected
      .filter(n => !excludeVideoNewsIds.has(n.id))
      .filter(n => !excludeVideoSlugs.has((n.topic_slug || '').toLowerCase()))
      .map(mediaBoost);
    top5Pool.sort((a, b) => b.videoScore - a.videoScore);
    videoCandidate = top5Pool[0] || null;
    if (videoCandidate) console.log(`=== VIDEO FALLBACK: reusing top5 news [${videoCandidate.videoScore}] ${videoCandidate.title}`);
  }
  if (videoCandidate) {
    const mt = videoCandidate.metadata?.media_type || 'none';
    console.log(`=== VIDEO CANDIDATE: [${videoCandidate.videoScore}] [media:${mt}] ${videoCandidate.title}`);
  } else {
    console.log('=== NO VIDEO CANDIDATE (pool empty) ===');
    if (afterSelected.length) console.log(`  Top remaining scores: ${afterSelected.slice(0, 3).map(n => `[${n.totalScore}] ${n.topic_slug}`).join(', ')}`);
  }

  // === PHASE 4: HEADLINE GENERATION ===
  const withHeadlines = await generateHeadlines(selected, edition);

  // Map to output format (compatible with plan.js expectations)
  const top5 = withHeadlines.map(item => ({
    headline: item.headline,
    source: item.source,
    summary: item.summary,
    why: item.why,
    news_id: item.id || null,
    original_title: item.title || '',
    original_source: item.source || '',
    published_at: item.published_at || '',
    image_url: item.metadata?.image_url || item.metadata?.media_urls?.[0] || '',
    article_url: item.url || '',
    topic_slug: item.topic_slug,
    company: item.company,
    totalScore: item.totalScore,
    entities: [], // kept for backward compat, not used for dedup anymore
  }));

  return { top5, videoCandidate };
}
