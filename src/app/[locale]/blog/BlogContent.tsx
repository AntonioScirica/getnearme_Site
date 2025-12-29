"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { type Locale } from "@/lib/i18n";
import { type Article } from "@/lib/supabase";
import { tagCategories, blogTexts } from "./blogData";

const ARTICLES_PER_BATCH = 9;

type Props = {
  articles: Article[];
  allArticles: Article[];
  locale: Locale;
  activeTag: string | null;
  categoriesWithTags: Record<string, string[]>;
  tagCounts: Record<string, number>;
  texts: (typeof blogTexts)[Locale];
};

// Find category for a tag
function findCategoryForTag(tag: string): string | null {
  for (const [categoryKey, category] of Object.entries(tagCategories)) {
    if (category.tags.includes(tag)) {
      return categoryKey;
    }
  }
  return null;
}

export default function BlogContent({
  articles,
  allArticles,
  locale,
  activeTag,
  categoriesWithTags,
  tagCounts,
  texts,
}: Props) {
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(ARTICLES_PER_BATCH);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const loaderRef = useRef<HTMLDivElement>(null);

  // Collapsible categories: first one open, rest closed
  const categoryKeys = Object.keys(categoriesWithTags);
  const activeCategory = activeTag ? findCategoryForTag(activeTag) : null;
  
  const [openCategories, setOpenCategories] = useState<Set<string>>(() => {
    const initial = new Set<string>();
    // Open the first category by default
    if (categoryKeys.length > 0) {
      initial.add(categoryKeys[0]);
    }
    // Also open the category of the active tag
    if (activeCategory) {
      initial.add(activeCategory);
    }
    return initial;
  });

  // Filter articles by search query
  const filteredArticles = searchQuery.trim()
    ? articles.filter((article) => {
        const query = searchQuery.toLowerCase();
        return (
          article.title.toLowerCase().includes(query) ||
          article.excerpt.toLowerCase().includes(query) ||
          article.tags?.some((tag) => tag.toLowerCase().includes(query))
        );
      })
    : articles;

  // Reset visible count when articles change (tag filter or search)
  useEffect(() => {
    setVisibleCount(ARTICLES_PER_BATCH);
  }, [activeTag, searchQuery]);

  // Infinite scroll observer
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && visibleCount < filteredArticles.length) {
          setIsLoading(true);
          // Small delay for UX
          setTimeout(() => {
            setVisibleCount((prev) =>
              Math.min(prev + ARTICLES_PER_BATCH, filteredArticles.length)
            );
            setIsLoading(false);
          }, 300);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loaderRef.current) {
      observer.observe(loaderRef.current);
    }

    return () => observer.disconnect();
  }, [visibleCount, filteredArticles.length]);

  const toggleCategory = (categoryKey: string) => {
    setOpenCategories((prev) => {
      const next = new Set(prev);
      if (next.has(categoryKey)) {
        next.delete(categoryKey);
      } else {
        next.add(categoryKey);
      }
      return next;
    });
  };

  const handleTagClick = useCallback(
    (tag: string | null) => {
      if (tag) {
        router.push(`/${locale}/blog?tag=${encodeURIComponent(tag)}`, {
          scroll: false,
        });
      } else {
        router.push(`/${locale}/blog`, { scroll: false });
      }
    },
    [locale, router]
  );

  const visibleArticles = filteredArticles.slice(0, visibleCount);
  const hasMore = visibleCount < filteredArticles.length;

  return (
    <>
      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative max-w-2xl mx-auto">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <svg
              className="w-5 h-5 text-slate-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={texts.searchPlaceholder}
            className="w-full pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-slate-900 placeholder-slate-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 hover:text-slate-600"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-2 text-center text-sm text-slate-500">
            {filteredArticles.length} {texts.searchResults}
          </div>
        )}
      </div>

      {/* Active Filter Banner */}
      {activeTag && !searchQuery && (
        <div className="mb-6 flex items-center justify-center gap-3 flex-wrap">
          <span className="text-sm text-slate-500">
            {articles.length} {texts.articlesCount}:
          </span>
          <span className="inline-flex items-center gap-2 px-3 py-1.5 bg-blue-500 text-white text-sm font-medium rounded-full">
            {activeTag}
            <button
              onClick={() => handleTagClick(null)}
              className="hover:bg-blue-600 rounded-full p-0.5 transition-colors"
              title={texts.clearFilter}
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </span>
        </div>
      )}

      {/* Layout: Filters + Articles */}
      <div className="flex flex-col lg:flex-row gap-8">
        {/* Filters Sidebar - LEFT, STICKY */}
        <aside className="w-full lg:w-56 shrink-0">
          <div className="lg:sticky lg:top-24 lg:max-h-[calc(100vh-120px)] lg:overflow-y-auto lg:scrollbar-thin">
            {/* Mobile: horizontal scroll */}
            <div className="lg:hidden mb-4">
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                <button
                  onClick={() => handleTagClick(null)}
                  className={`shrink-0 text-sm px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                    !activeTag
                      ? "bg-blue-500 text-white"
                      : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                  }`}
                >
                  {texts.allArticles}
                </button>
                {Object.values(categoriesWithTags)
                  .flat()
                  .slice(0, 8)
                  .map((tagName) => (
                    <button
                      key={tagName}
                      onClick={() => handleTagClick(tagName)}
                      className={`shrink-0 text-sm px-3 py-1.5 rounded-full transition-colors whitespace-nowrap ${
                        activeTag === tagName
                          ? "bg-blue-500 text-white"
                          : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
                      }`}
                    >
                      {tagName}
                    </button>
                  ))}
              </div>
            </div>

            {/* Desktop: collapsible categories */}
            <div className="hidden lg:block bg-white rounded-xl p-4 border border-slate-200 shadow-sm">
              <h3 className="text-xs font-semibold text-slate-400 mb-3 uppercase tracking-wider px-2">
                {texts.filterByTag}
              </h3>

              {/* All articles */}
              <button
                onClick={() => handleTagClick(null)}
                className={`w-full text-left text-sm px-3 py-2 rounded-lg mb-3 transition-colors flex items-center justify-between ${
                  !activeTag
                    ? "bg-blue-500 text-white font-medium"
                    : "text-slate-700 hover:bg-slate-100"
                }`}
              >
                <span>{texts.allArticles}</span>
                <span
                  className={`text-xs ${
                    !activeTag ? "text-blue-100" : "text-slate-400"
                  }`}
                >
                  {allArticles.length}
                </span>
              </button>

              {/* Collapsible Categories */}
              <div className="space-y-1">
                {categoryKeys.map((categoryKey, index) => {
                  const category = tagCategories[categoryKey];
                  const tags = categoriesWithTags[categoryKey];
                  const isOpen = openCategories.has(categoryKey);
                  const hasActiveTag =
                    activeCategory === categoryKey && activeTag;

                  return (
                    <div key={categoryKey} className="border-t border-slate-100 pt-2 first:border-0 first:pt-0">
                      {/* Category Header */}
                      <button
                        onClick={() => toggleCategory(categoryKey)}
                        className={`w-full flex items-center justify-between px-2 py-2 text-left rounded-lg transition-colors hover:bg-slate-50 ${
                          hasActiveTag ? "bg-blue-50" : ""
                        }`}
                      >
                        <span
                          className={`text-xs font-semibold uppercase tracking-wider ${
                            hasActiveTag ? "text-blue-600" : "text-slate-500"
                          }`}
                        >
                          {category.label[locale]}
                        </span>
                        <svg
                          className={`w-4 h-4 text-slate-400 transition-transform ${
                            isOpen ? "rotate-180" : ""
                          }`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </button>

                      {/* Category Tags */}
                      {isOpen && (
                        <div className="mt-1 space-y-0.5 pl-1">
                          {tags.map((tagName) => (
                            <button
                              key={tagName}
                              onClick={() => handleTagClick(tagName)}
                              className={`w-full flex items-center justify-between text-sm px-3 py-1.5 rounded-lg transition-colors text-left ${
                                activeTag === tagName
                                  ? "bg-blue-500 text-white font-medium"
                                  : "text-slate-600 hover:bg-slate-100"
                              }`}
                            >
                              <span className="truncate">{tagName}</span>
                              <span
                                className={`text-xs ml-2 ${
                                  activeTag === tagName
                                    ? "text-blue-100"
                                    : "text-slate-400"
                                }`}
                              >
                                {tagCounts[tagName] || 0}
                              </span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </aside>

        {/* Articles Grid - RIGHT */}
        <div className="flex-1">
          {visibleArticles.length > 0 ? (
            <>
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {visibleArticles.map((article) => {
                  const formattedDate = article.published_at
                    ? new Date(article.published_at).toLocaleDateString(
                        locale,
                        {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        }
                      )
                    : "";

                  return (
                    <article
                      key={article.slug}
                      className="bg-white rounded-xl border border-slate-200 overflow-hidden hover:shadow-md hover:border-slate-300 transition-all"
                    >
                      {/* Image */}
                      {article.image_url && (
                        <Link
                          href={`/${locale}/blog/${article.slug}`}
                          className="block"
                        >
                          <div className="aspect-[16/10] relative overflow-hidden">
                            <Image
                              src={article.image_url}
                              alt={article.image_alt || article.title}
                              fill
                              className="object-cover hover:scale-105 transition-transform duration-300"
                              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                              loading="lazy"
                            />
                          </div>
                        </Link>
                      )}

                      <div className="p-4">
                        {/* Tags */}
                        {article.tags && article.tags.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 mb-2">
                            {article.tags.slice(0, 2).map((articleTag) => (
                              <button
                                key={articleTag}
                                onClick={() => handleTagClick(articleTag)}
                                className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                                  activeTag === articleTag
                                    ? "bg-blue-500 text-white"
                                    : "text-blue-600 bg-blue-50 hover:bg-blue-100"
                                }`}
                              >
                                {articleTag}
                              </button>
                            ))}
                          </div>
                        )}

                        {/* Title */}
                        <h2 className="text-base font-bold text-slate-900 mb-2 leading-snug font-inter line-clamp-2">
                          <Link
                            href={`/${locale}/blog/${article.slug}`}
                            className="hover:text-blue-600 transition-colors"
                          >
                            {article.title}
                          </Link>
                        </h2>

                        {/* Excerpt */}
                        <p className="text-slate-500 text-sm leading-relaxed mb-3 line-clamp-2">
                          {article.excerpt}
                        </p>

                        {/* Meta */}
                        <div className="flex items-center justify-between text-xs text-slate-400">
                          <time dateTime={article.published_at || ""}>
                            {formattedDate}
                          </time>
                          {article.reading_time && (
                            <span>{article.reading_time} min</span>
                          )}
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>

              {/* Infinite Scroll Loader */}
              {hasMore && (
                <div
                  ref={loaderRef}
                  className="mt-8 flex justify-center py-8"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2 text-slate-500">
                      <svg
                        className="animate-spin w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                      >
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                        />
                      </svg>
                      <span className="text-sm">{texts.loading}</span>
                    </div>
                  ) : (
                    <button
                      onClick={() =>
                        setVisibleCount((prev) =>
                          Math.min(prev + ARTICLES_PER_BATCH, filteredArticles.length)
                        )
                      }
                      className="px-6 py-2 text-sm font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
                    >
                      {texts.loadMore}
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-16 bg-white rounded-xl border border-slate-200">
              <p className="text-slate-500 mb-4">
                {searchQuery ? texts.noResults : texts.empty}
              </p>
              {(activeTag || searchQuery) && (
                <button
                  onClick={() => {
                    handleTagClick(null);
                    setSearchQuery("");
                  }}
                  className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 19l-7-7m0 0l7-7m-7 7h18"
                    />
                  </svg>
                  {texts.allArticles}
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

