/**
 * Constraint-based greedy selection. No AI calls.
 * Sorts by total score, picks top N respecting diversity constraints.
 */

const DEFAULT_CONSTRAINTS = {
  count: 5,
  maxPerTopic: 2,
  maxPerCompany: 2,
  maxOpinion: 1,
  minScore: 40,
  excludeSlugs: [],    // topic_slugs from other edition (cross-edition dedup)
};

/**
 * Select top N news from scored candidates with diversity constraints.
 * @param {Array} scoredItems - items with totalScore, topic_slug, company, is_opinion, is_tutorial
 * @param {object} constraints - override defaults
 * @returns {Array} selected items (up to constraints.count)
 */
export function selectTopN(scoredItems, constraints = {}) {
  const opts = { ...DEFAULT_CONSTRAINTS, ...constraints };
  const excludeSet = new Set(opts.excludeSlugs.map(s => s.toLowerCase()));

  // Sort by total score descending
  const sorted = [...scoredItems].sort((a, b) => b.totalScore - a.totalScore);

  const selected = [];
  const topicCounts = {};   // topic_slug → count
  const companyCounts = {}; // company → count
  let opinionCount = 0;

  for (const item of sorted) {
    if (selected.length >= opts.count) break;

    // Min score check
    if (item.totalScore < opts.minScore) continue;

    const slug = (item.topic_slug || 'unknown').toLowerCase();
    const company = (item.company || 'other').toLowerCase();

    // Cross-edition dedup
    if (excludeSet.has(slug)) {
      console.log(`Selector skip (cross-edition): "${item.title}" [${slug}]`);
      continue;
    }

    // Max per topic
    if ((topicCounts[slug] || 0) >= opts.maxPerTopic) {
      console.log(`Selector skip (max topic): "${item.title}" [${slug}]`);
      continue;
    }

    // Max per company
    if ((companyCounts[company] || 0) >= opts.maxPerCompany) {
      console.log(`Selector skip (max company): "${item.title}" [${company}]`);
      continue;
    }

    // Max opinion/tutorial
    if ((item.is_opinion || item.is_tutorial) && opinionCount >= opts.maxOpinion) {
      console.log(`Selector skip (max opinion): "${item.title}"`);
      continue;
    }

    // Accept
    selected.push(item);
    topicCounts[slug] = (topicCounts[slug] || 0) + 1;
    companyCounts[company] = (companyCounts[company] || 0) + 1;
    if (item.is_opinion || item.is_tutorial) opinionCount++;
  }

  // If we didn't get enough, relax minScore and try again with remaining
  if (selected.length < opts.count) {
    const selectedIds = new Set(selected.map(s => s.id || s.title));
    for (const item of sorted) {
      if (selected.length >= opts.count) break;
      if (selectedIds.has(item.id || item.title)) continue;
      if (item.totalScore < 20) continue; // relaxed floor

      const slug = (item.topic_slug || 'unknown').toLowerCase();
      const company = (item.company || 'other').toLowerCase();
      if (excludeSet.has(slug)) continue;
      if ((topicCounts[slug] || 0) >= opts.maxPerTopic) continue;
      if ((companyCounts[company] || 0) >= opts.maxPerCompany) continue;

      selected.push(item);
      topicCounts[slug] = (topicCounts[slug] || 0) + 1;
      companyCounts[company] = (companyCounts[company] || 0) + 1;
    }
  }

  // Emergency: minimum 3 news. Drop ALL score/diversity constraints.
  if (selected.length < 3) {
    console.log(`⚠️ Only ${selected.length} selected, emergency pass (no score floor)...`);
    const selectedIds = new Set(selected.map(s => s.id || s.title));
    for (const item of sorted) {
      if (selected.length >= 3) break;
      if (selectedIds.has(item.id || item.title)) continue;

      const slug = (item.topic_slug || 'unknown').toLowerCase();
      if (excludeSet.has(slug)) continue;

      console.log(`  Emergency pick: [${item.totalScore}] ${item.title}`);
      selected.push(item);
    }
  }

  return selected;
}
