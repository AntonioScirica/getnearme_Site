import { createClient } from "@supabase/supabase-js";
import type { Locale } from "./i18n";

// ============================================================================
// SUPABASE CLIENT
// ============================================================================

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// ============================================================================
// TIPI ARTICLES
// ============================================================================

export type ArticleStatus = "draft" | "published";

export interface Article {
  id: string;
  slug: string;
  locale: Locale;
  title: string;
  excerpt: string;
  content: string;
  tags: string[];
  image_url: string | null;
  image_alt: string | null;
  status: ArticleStatus;
  published_at: string | null;
  reading_time: number | null;
  author: string;
  created_at: string;
  updated_at: string;
}

// ============================================================================
// QUERY ARTICOLI
// ============================================================================

/**
 * Lista articoli pubblicati per una lingua.
 * Ordinati per data di pubblicazione (più recenti prima).
 * 
 * Query ottimizzata per indice idx_articles_published
 */
export async function getPublishedArticles(
  locale: Locale,
  limit?: number
): Promise<Article[]> {
  let query = supabase
    .from("articles")
    .select("*")
    .eq("locale", locale)
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .order("published_at", { ascending: false });

  if (limit) {
    query = query.limit(limit);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Errore fetch articoli:", error.message);
    return [];
  }

  return data || [];
}

/**
 * Singolo articolo per slug.
 * Ritorna null se non esiste o non è pubblicato.
 */
export async function getArticleBySlug(
  slug: string,
  locale: Locale
): Promise<Article | null> {
  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("slug", slug)
    .eq("locale", locale)
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

/**
 * Tutti gli slug pubblicati (tutte le lingue).
 * Per generateStaticParams e sitemap.
 */
export async function getAllPublishedSlugs(): Promise<
  { locale: Locale; slug: string; updated_at?: string }[]
> {
  const { data, error } = await supabase
    .from("articles")
    .select("slug, locale, updated_at")
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString());

  if (error || !data) {
    return [];
  }

  return data.map((item) => ({
    slug: item.slug,
    locale: item.locale as Locale,
    updated_at: item.updated_at,
  }));
}

/**
 * Articoli correlati (stesso tag).
 */
export async function getRelatedArticles(
  currentSlug: string,
  locale: Locale,
  tags: string[],
  limit: number = 3
): Promise<Article[]> {
  if (!tags || tags.length === 0) {
    return [];
  }

  const { data, error } = await supabase
    .from("articles")
    .select("*")
    .eq("locale", locale)
    .eq("status", "published")
    .not("published_at", "is", null)
    .lte("published_at", new Date().toISOString())
    .neq("slug", currentSlug)
    .overlaps("tags", tags)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (error) {
    return [];
  }

  return data || [];
}

// ============================================================================
// UTILITÀ MARKDOWN
// ============================================================================

/**
 * Estrae titoli H2 dal contenuto per Table of Contents.
 */
export function extractHeadings(content: string): { id: string; text: string }[] {
  const headingRegex = /^## (.+)$/gm;
  const headings: { id: string; text: string }[] = [];

  let match;
  while ((match = headingRegex.exec(content)) !== null) {
    const text = match[1];
    const id = text
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, "")
      .replace(/\s+/g, "-");
    headings.push({ id, text });
  }

  return headings;
}
