const SUBREDDITS = ['artificial', 'MachineLearning', 'ChatGPT', 'singularity'];

export async function fetchRedditPosts() {
  const results = [];

  for (const sub of SUBREDDITS) {
    try {
      const res = await fetch(`https://www.reddit.com/r/${sub}/hot.json?limit=15&raw_json=1`, {
        headers: {
          'User-Agent': 'AIForDumbs/1.0 (by /u/aifordumbs)',
          'Accept': 'application/json',
        },
      });

      if (!res.ok) continue;

      const data = await res.json();
      const posts = (data?.data?.children || [])
        .filter(p => !p.data.stickied && p.data.score > 10)
        .map(p => ({
          title: p.data.title,
          url: `https://reddit.com${p.data.permalink}`,
          summary: (p.data.selftext || '').slice(0, 500),
          published_at: new Date(p.data.created_utc * 1000).toISOString(),
          source: `r/${sub}`,
          source_type: 'reddit',
          metadata: {
            subreddit: sub,
            author: p.data.author,
            score: p.data.score,
            num_comments: p.data.num_comments,
            thumbnail: p.data.thumbnail !== 'self' ? p.data.thumbnail : '',
            url_dest: p.data.url_overridden_by_dest || '',
          },
        }));

      results.push(...posts);
    } catch (err) {
      console.error(`Reddit fetch failed for r/${sub}:`, err.message);
    }
  }

  return results;
}
