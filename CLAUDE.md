# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # Start dev server
npm run build    # Production build
npm run start    # Start production server
npm run lint     # ESLint (eslint@9 with next core-web-vitals + TypeScript)
```

## Architecture

**GetNearMe** is a marketing/landing site for a Chrome extension (real estate analysis tool), built with **Next.js 16.1.0**, **React 19**, **TypeScript 5**, and **Tailwind CSS v4**.

### Routing & i18n

All public pages are under `src/app/[locale]/` with 6 supported locales: `it` (default), `en`, `es`, `fr`, `ru`, `uk`. The proxy (`src/proxy.ts` — Next.js 16 convention, replaces middleware) detects the browser's `Accept-Language` header and redirects unlocalized paths to the appropriate `/:locale/` prefix.

- **Translations:** `src/lib/translations.ts` (~1,800 lines) — single nested object keyed by locale with all UI strings.
- **Locale config:** `src/lib/i18n.ts` — locale names, flags, hreflang codes, OG locale codes, SEO titles/descriptions.
- Every page uses `generateStaticParams()` to pre-render all locale variants.

### Content System (Blog)

Blog posts come from two sources:
1. **Supabase database** — primary source via `src/lib/supabase.ts` (`getPublishedArticles`, `getArticleBySlug`, `getAllPublishedSlugs`, `getRelatedArticles`).
2. **MDX files** in `src/content/blog/[locale]/` — parsed with `gray-matter` via `src/lib/mdx.ts`. Frontmatter requires `title`, `description`, `date`, `author`, `image`, `draft`.

### Key Directories

- `src/app/[locale]/` — public pages (homepage, features, blog, tutorial, legal, checkout flows)
- `src/app/api/metrics/` — analytics API endpoint (auth via `x-metrics-key` header)
- `src/app/metrics/` — internal analytics dashboard (client-side app)
- `src/components/` — shared components (`Navbar`, `LanguageSwitcher`, `HeroVideoPlayer`, `HeroFloatingIcons`)
- `src/components/metrics/` — metrics dashboard components (charts, tables, pages)
- `src/lib/` — utilities (`i18n.ts`, `translations.ts`, `supabase.ts`, `mdx.ts`, `legalContent.ts`)

### Styling

Tailwind CSS v4 with CSS-first config (PostCSS via `@tailwindcss/postcss`). No CSS modules. Custom theme tokens in `src/app/globals.css`. Two font families loaded via `next/font/google`:
- **Inter** (sans, body text)
- **Old Standard TT** (serif, headings)

### Server/Client Boundary

Most pages and layouts are server components. Client components (`"use client"`) are: `LanguageSwitcher`, `HeroVideoPlayer`, `HeroFloatingIcons`, and the entire metrics dashboard.

### Environment Variables

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Supabase client (browser)
- `SUPABASE_SERVICE_ROLE_KEY` — Supabase admin (server only)
- `UNSPLASH_ACCESS_KEY` — Unsplash API

### SEO

Every locale layout generates: JSON-LD (`SoftwareApplication`, `WebSite`, `Organization`), OpenGraph, Twitter cards, canonical URLs, and hreflang alternate links. Sitemap generated in `src/app/sitemap.ts`.

### Path Alias

`@/*` maps to `./src/*` (tsconfig).

## Second Brain

**Vault note progetto:** `/Users/antonioscirica/Obsidian-SecondBrain/10-Projects/GetNearMe/site/`

**Index:** `10-Projects/GetNearMe/index.md` (sezione "Sito").

### Note chiave
- `site/architecture.md` — stack, routing, blog dual-source
- `site/pages.md` — tutte le pagine
- `site/components.md` — Navbar, LanguageSwitcher, Hero…
- `site/blog-system.md` — Supabase + MDX
- `site/i18n.md` — 6 locali, proxy detection
- `site/seo.md` — JSON-LD, OG, hreflang
- `site/api.md` — endpoint metrics
- `site/metrics-dashboard.md` — dashboard analytics interno

### Workflow
- Bug strano → append a vault `learnings` o `20-Knowledge/`
- Decisione → append a `decisions.md`
