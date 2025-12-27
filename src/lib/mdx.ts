import fs from "fs";
import path from "path";
import matter from "gray-matter";
import { type Locale, locales } from "./i18n";

// ============================================================================
// TIPI FRONTMATTER
// ============================================================================

/**
 * Frontmatter obbligatorio per ogni articolo MDX.
 * Tutti i campi sono richiesti per garantire SEO-safety.
 */
export interface BlogFrontmatter {
  /** Titolo dell'articolo (H1 e meta title) */
  title: string;
  /** Descrizione per meta description (max 160 caratteri consigliati) */
  description: string;
  /** Data di pubblicazione in formato ISO 8601 (es. 2025-01-15) */
  date: string;
  /** Data di ultimo aggiornamento (opzionale, formato ISO 8601) */
  updatedAt?: string;
  /** Autore dell'articolo */
  author: {
    name: string;
    url?: string;
  };
  /** Immagine di copertina */
  image: {
    src: string;
    alt: string;
  };
  /** Se true, l'articolo NON viene pubblicato */
  draft: boolean;
  /** Tags per categorizzazione (opzionale) */
  tags?: string[];
  /** Tempo di lettura in minuti (opzionale, calcolato se non fornito) */
  readingTime?: number;
}

/**
 * Articolo completo con frontmatter validato e contenuto.
 */
export interface BlogPost {
  /** Slug derivato dal nome file (senza .mdx) */
  slug: string;
  /** Locale dell'articolo */
  locale: Locale;
  /** Frontmatter validato */
  frontmatter: BlogFrontmatter;
  /** Contenuto MDX grezzo */
  content: string;
}

// ============================================================================
// PATHS
// ============================================================================

const CONTENT_DIR = path.join(process.cwd(), "src/content/blog");

function getLocalePath(locale: Locale): string {
  return path.join(CONTENT_DIR, locale);
}

// ============================================================================
// VALIDAZIONE FRONTMATTER
// ============================================================================

/**
 * Valida il frontmatter di un articolo.
 * Lancia un errore se manca un campo obbligatorio.
 */
function validateFrontmatter(
  data: Record<string, unknown>,
  filePath: string
): BlogFrontmatter {
  const errors: string[] = [];

  // Campi obbligatori stringa
  if (typeof data.title !== "string" || !data.title.trim()) {
    errors.push("title (string) è obbligatorio");
  }
  if (typeof data.description !== "string" || !data.description.trim()) {
    errors.push("description (string) è obbligatorio");
  }
  if (typeof data.date !== "string" || !data.date.trim()) {
    errors.push("date (string ISO 8601) è obbligatorio");
  }

  // Author
  if (!data.author || typeof data.author !== "object") {
    errors.push("author (object con name) è obbligatorio");
  } else {
    const author = data.author as Record<string, unknown>;
    if (typeof author.name !== "string" || !author.name.trim()) {
      errors.push("author.name (string) è obbligatorio");
    }
  }

  // Image
  if (!data.image || typeof data.image !== "object") {
    errors.push("image (object con src e alt) è obbligatorio");
  } else {
    const image = data.image as Record<string, unknown>;
    if (typeof image.src !== "string" || !image.src.trim()) {
      errors.push("image.src (string) è obbligatorio");
    }
    if (typeof image.alt !== "string" || !image.alt.trim()) {
      errors.push("image.alt (string) è obbligatorio");
    }
  }

  // Draft (deve essere esplicitamente boolean)
  if (typeof data.draft !== "boolean") {
    errors.push("draft (boolean) è obbligatorio");
  }

  if (errors.length > 0) {
    throw new Error(
      `Frontmatter non valido in ${filePath}:\n- ${errors.join("\n- ")}`
    );
  }

  return {
    title: data.title as string,
    description: data.description as string,
    date: data.date as string,
    updatedAt: data.updatedAt as string | undefined,
    author: data.author as { name: string; url?: string },
    image: data.image as { src: string; alt: string },
    draft: data.draft as boolean,
    tags: Array.isArray(data.tags) ? data.tags : undefined,
    readingTime: typeof data.readingTime === "number" ? data.readingTime : undefined,
  };
}

// ============================================================================
// CALCOLO TEMPO DI LETTURA
// ============================================================================

/**
 * Calcola il tempo di lettura stimato in minuti.
 */
function calculateReadingTime(content: string): number {
  const wordsPerMinute = 200;
  const words = content.trim().split(/\s+/).length;
  return Math.max(1, Math.ceil(words / wordsPerMinute));
}

// ============================================================================
// LOADER FUNZIONI
// ============================================================================

/**
 * Ottiene tutti gli articoli pubblicati per una lingua.
 * Esclude automaticamente i draft.
 */
export function getAllPosts(locale: Locale): BlogPost[] {
  const localePath = getLocalePath(locale);

  // Se la cartella non esiste o è vuota, ritorna array vuoto
  if (!fs.existsSync(localePath)) {
    return [];
  }

  const files = fs.readdirSync(localePath).filter((f) => f.endsWith(".mdx"));

  const posts: BlogPost[] = [];

  for (const file of files) {
    const filePath = path.join(localePath, file);
    const fileContent = fs.readFileSync(filePath, "utf-8");
    const { data, content } = matter(fileContent);

    try {
      const frontmatter = validateFrontmatter(data, filePath);

      // Salta i draft
      if (frontmatter.draft) {
        continue;
      }

      // Calcola reading time se non fornito
      if (!frontmatter.readingTime) {
        frontmatter.readingTime = calculateReadingTime(content);
      }

      const slug = file.replace(/\.mdx$/, "");

      posts.push({
        slug,
        locale,
        frontmatter,
        content,
      });
    } catch (error) {
      // In development, mostra l'errore ma non blocca
      if (process.env.NODE_ENV === "development") {
        console.error(error);
      }
      // In production, salta file con frontmatter non valido
      continue;
    }
  }

  // Ordina per data (più recenti prima)
  return posts.sort(
    (a, b) =>
      new Date(b.frontmatter.date).getTime() -
      new Date(a.frontmatter.date).getTime()
  );
}

/**
 * Ottiene un singolo articolo per slug e lingua.
 * Ritorna null se non esiste o è draft.
 */
export function getPostBySlug(slug: string, locale: Locale): BlogPost | null {
  const filePath = path.join(getLocalePath(locale), `${slug}.mdx`);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  const fileContent = fs.readFileSync(filePath, "utf-8");
  const { data, content } = matter(fileContent);

  try {
    const frontmatter = validateFrontmatter(data, filePath);

    // Non ritornare draft
    if (frontmatter.draft) {
      return null;
    }

    if (!frontmatter.readingTime) {
      frontmatter.readingTime = calculateReadingTime(content);
    }

    return {
      slug,
      locale,
      frontmatter,
      content,
    };
  } catch {
    return null;
  }
}

/**
 * Ottiene tutti gli slug pubblicati per tutte le lingue.
 * Usato per generateStaticParams.
 */
export function getAllPublishedSlugs(): { locale: Locale; slug: string }[] {
  const result: { locale: Locale; slug: string }[] = [];

  for (const locale of locales) {
    const posts = getAllPosts(locale);
    for (const post of posts) {
      result.push({ locale, slug: post.slug });
    }
  }

  return result;
}

/**
 * Verifica se un articolo esiste e non è draft.
 */
export function postExists(slug: string, locale: Locale): boolean {
  return getPostBySlug(slug, locale) !== null;
}

/**
 * Ottiene articoli correlati (stesso tag).
 */
export function getRelatedPosts(
  slug: string,
  locale: Locale,
  limit: number = 3
): BlogPost[] {
  const currentPost = getPostBySlug(slug, locale);
  if (!currentPost || !currentPost.frontmatter.tags) {
    return [];
  }

  return getAllPosts(locale)
    .filter((post) => post.slug !== slug)
    .filter((post) =>
      post.frontmatter.tags?.some((tag) =>
        currentPost.frontmatter.tags?.includes(tag)
      )
    )
    .slice(0, limit);
}

// ============================================================================
// UTILITÀ PER CONTENUTO
// ============================================================================

/**
 * Estrae i titoli H2 dal contenuto per Table of Contents.
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


