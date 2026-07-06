// Cover images for blog posts, reusing existing marketing assets in public/ —
// the AI pipeline never generates or links images, only markdown text, so
// there's no risk of invented/broken image URLs. One curated pool per
// pillar; ai-staging additionally gets the real BeforeAfterSlider component
// (see blog [slug] page) instead of a flat cover.

const COVERS_BY_PILLAR: Record<string, string[]> = {
  'ai-staging': ['/staging/1.jpg', '/staging/2.jpg'],
  'ai-video': [
    '/reference/immagini-a-video-poster.jpg',
    '/reference/social-reel-poster.jpg',
    '/reference/montaggio-poster.jpg',
    '/reference/sottotitoli-poster.jpg',
  ],
  'social-media': [
    '/reference/social-post-feed.png',
    '/reference/social-reel-feed-poster.jpg',
    '/reference/social-post-square.png',
    '/reference/social-reel-square-poster.jpg',
  ],
  'reports-analytics': ['/report/appartamento.png'],
  'ai-avatar': ['/reference/primo-piano-poster.jpg'],
  'agency-productivity': ['/demo/foto_demo.jpg', '/demo/dopo_demo.jpg'],
  'comparison-geo': ['/reference/split-poster.jpg', '/reference/giorno-notte-poster.jpg'],
};

const FALLBACK_COVER = '/reference/social-post-feed.png';

function hashSlug(slug: string): number {
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h;
}

/** Deterministic pick so the same post always renders the same cover, but
 * different posts in the same pillar don't all show an identical image. */
export function getCoverImage(pillar: string, slug: string): string {
  const pool = COVERS_BY_PILLAR[pillar];
  if (!pool || pool.length === 0) return FALLBACK_COVER;
  return pool[hashSlug(slug) % pool.length];
}
