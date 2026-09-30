import type { Metadata } from "next";
import Script from "next/script";
import Trackers from "@/components/Trackers";
import CookieBanner from "@/components/CookieBanner";
import ProfanityGuard from "@/components/ProfanityGuard";
import { notFound } from "next/navigation";
import {
  locales,
  type Locale,
  defaultLocale,
  hreflangMap,
  ogLocaleMap,
  seoTitles,
  seoDescriptions
} from "@/lib/i18n";
import { translations } from "@/lib/translations";
import "../globals.css";

type Props = {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  
  if (!locales.includes(locale as Locale)) {
    return {};
  }
  
  const baseUrl = "https://agenteimmo.me";
  
  // Genera alternate languages con x-default
  const languages: Record<string, string> = {};
  // solo le lingue che esistono davvero (le altre rimandano a /en)
  (['it', 'en'] as const).forEach((loc) => {
    languages[hreflangMap[loc]] = `${baseUrl}/${loc}`;
  });
  languages["x-default"] = `${baseUrl}/${defaultLocale}`;
  
  return {
    title: {
      default: seoTitles[locale as Locale],
      template: `%s | Agente Immo`,
    },
    description: seoDescriptions[locale as Locale],
    keywords: [
      "agente immobiliare",
      "agenti immobiliari",
      "software per agenti immobiliari",
      "sito per agente immobiliare",
      "home staging virtuale",
      "video immobiliari",
      "come trovare incarichi immobiliari",
      "Agente Immo"
    ],
    authors: [{ name: "Agente Immo" }],
    creator: "Agente Immo",
    publisher: "Agente Immo",
    alternates: {
      canonical: `${baseUrl}/${locale}`,
      languages,
    },
    openGraph: {
      type: "website",
      locale: ogLocaleMap[locale as Locale],
      alternateLocale: locales
        .filter((l) => l !== locale)
        .map((l) => ogLocaleMap[l]),
      url: `${baseUrl}/${locale}`,
      siteName: "Agente Immo",
      title: seoTitles[locale as Locale],
      description: seoDescriptions[locale as Locale],
      images: [
        {
          url: `${baseUrl}/assets/png/immobile.png`,
          width: 1200,
          height: 630,
          alt: seoTitles[locale as Locale],
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: seoTitles[locale as Locale],
      description: seoDescriptions[locale as Locale],
      images: [`${baseUrl}/assets/png/immobile.png`],
      creator: "@getnearme",
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      // Aggiungi qui i tuoi codici di verifica quando li avrai
      // google: "codice-google-search-console",
      // yandex: "codice-yandex",
    },
    category: "technology",
    applicationName: "Agente Immo",
    manifest: "/manifest.json",
    appleWebApp: { title: "Agente Immo" },
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  
  // Valida locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }
  
  
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="facebook-domain-verification" content="3el76s85o30orscaoxt1ceryo0tbki" />
        <link rel="preconnect" href="https://ecrnpyksnfyykqwnutwa.supabase.co" crossOrigin="anonymous" />
        {/* Satoshi servito da noi (niente IP dei visitatori a fontshare, vale anche per i siti degli agenti) */}
        <link href="/fonts/satoshi/satoshi.css" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
      </head>
      <body
        className="antialiased"
        style={{ fontFamily: "'Satoshi', system-ui, -apple-system, sans-serif" }}
        suppressHydrationWarning
      >
        {children}
        <CookieBanner />
        <ProfanityGuard />
        {/* Analytics + embed deferiti (lazyOnload): non competono col primo paint. */}
        <Trackers kind="stats">
        <Script id="ms-clarity" strategy="lazyOnload">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "vlznalklsj");`}
        </Script>
        <Script id="cal-embed" strategy="lazyOnload">
          {/* Cal.com solo dove c'e' un bottone di prenotazione (blog, reference): altrove e' peso e cookie inutili */}
          {`if (document.querySelector("[data-cal-link]")) { (function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");Cal("init", {origin:"https://cal.com"});Cal("ui", {"hideEventTypeDetails":false,"layout":"month_view"}); }`}
        </Script>
        </Trackers>
      </body>
    </html>
  );
}

