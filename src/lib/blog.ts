import { getSupabaseServerClient } from './supabase-server';

export type BlogPost = {
  id: string;
  slug: string;
  locale: string;
  title: string;
  seo_title: string;
  seo_description: string;
  content_markdown: string;
  faq_items: { question: string; answer: string }[];
  pillar: string;
  product_hook: string;
  published_at: string;
  updated_at: string;
};

const SELECT_FIELDS =
  'id, slug, locale, title, seo_title, seo_description, content_markdown, faq_items, pillar, product_hook, published_at, updated_at';

export async function getPublishedPosts(locale: string): Promise<BlogPost[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select(SELECT_FIELDS)
    .eq('locale', locale)
    .eq('status', 'published')
    .order('published_at', { ascending: false });

  if (error) {
    console.error('getPublishedPosts error:', error);
    return [];
  }
  return (data as BlogPost[]) ?? [];
}

export async function getPostBySlug(locale: string, slug: string): Promise<BlogPost | null> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select(SELECT_FIELDS)
    .eq('locale', locale)
    .eq('slug', slug)
    .eq('status', 'published')
    .maybeSingle();

  if (error) {
    console.error('getPostBySlug error:', error);
    return null;
  }
  return (data as BlogPost) ?? null;
}

export async function getRelatedPosts(locale: string, pillar: string, excludeSlug: string, limit = 3): Promise<BlogPost[]> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select(SELECT_FIELDS)
    .eq('locale', locale)
    .eq('status', 'published')
    .eq('pillar', pillar)
    .neq('slug', excludeSlug)
    .order('published_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getRelatedPosts error:', error);
    return [];
  }
  return (data as BlogPost[]) ?? [];
}

// articolo precedente e successivo (per data): ogni articolo riceve link da almeno due altri, oltre che dall'indice
export async function getAdjacentPosts(locale: string, slug: string): Promise<{ prev: Pick<BlogPost, 'slug' | 'title'> | null; next: Pick<BlogPost, 'slug' | 'title'> | null }> {
  const supabase = getSupabaseServerClient();
  const { data, error } = await supabase
    .from('blog_posts')
    .select('slug, title, published_at')
    .eq('locale', locale)
    .eq('status', 'published')
    .order('published_at', { ascending: false });
  if (error || !data?.length) return { prev: null, next: null };
  const i = data.findIndex(p => p.slug === slug);
  if (i < 0 || data.length < 2) return { prev: null, next: null };
  // a giro: il piu' vecchio rimanda al piu' recente e viceversa
  const at = (k: number) => data[(k + data.length) % data.length];
  return { prev: at(i + 1), next: at(i - 1) };
}
