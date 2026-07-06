import type { Metadata } from "next";
import Script from "next/script";
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
  
  const baseUrl = "https://www.getnearme.it";
  
  // Genera alternate languages con x-default
  const languages: Record<string, string> = {};
  locales.forEach((loc) => {
    languages[hreflangMap[loc]] = `${baseUrl}/${loc}`;
  });
  languages["x-default"] = `${baseUrl}/${defaultLocale}`;
  
  return {
    title: {
      default: seoTitles[locale as Locale],
      template: `%s | GetNearMe`,
    },
    description: seoDescriptions[locale as Locale],
    keywords: [
      "analisi immobiliare",
      "confronto immobili",
      "assistente ai immobiliare",
      "software agente immobiliare",
      "prezzi immobili",
      "valutazione casa",
      "quartieri",
      "mercato immobiliare",
      "real estate analysis",
      "property comparison",
      "GetNearMe"
    ],
    authors: [{ name: "GetNearMe" }],
    creator: "GetNearMe",
    publisher: "GetNearMe",
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
      siteName: "GetNearMe",
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
  };
}

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  
  // Valida locale
  if (!locales.includes(locale as Locale)) {
    notFound();
  }
  
  const t = translations[locale as Locale];
  
  return (
    <html lang={locale} suppressHydrationWarning>
      <head>
        <meta name="facebook-domain-verification" content="3el76s85o30orscaoxt1ceryo0tbki" />
        <link href="https://api.fontshare.com/v2/css?f[]=satoshi@400,500,700,900&display=swap" rel="stylesheet" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="theme-color" content="#3B82F6" />
        <meta name="application-name" content="GetNearMe" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="GetNearMe" />
        <meta name="format-detection" content="telephone=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        
        {/* 
          Schema.org JSON-LD - SoftwareApplication
          NOTA: AggregateRating rimosso - aggiungere solo quando disponibili
          recensioni verificabili da Chrome Web Store o altra fonte attendibile
        */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "GetNearMe",
              "applicationCategory": "BrowserApplication",
              "operatingSystem": "Chrome",
              "description": t.hero.description,
              "url": `https://www.getnearme.it/${locale}`,
              "inLanguage": locale,
              "author": {
                "@type": "Organization",
                "name": "GetNearMe",
                "url": "https://www.getnearme.it",
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR",
                "description": t.pricing.plans[0].desc,
              },
            }),
          }}
        />
        
        {/* Schema.org JSON-LD - WebSite */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "GetNearMe",
              "url": "https://www.getnearme.it",
              "inLanguage": locale,
            }),
          }}
        />
        
        {/* Schema.org JSON-LD - Organization */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Organization",
              "name": "GetNearMe",
              "url": "https://www.getnearme.it",
              "logo": "https://www.getnearme.it/favicon.ico",
              "contactPoint": {
                "@type": "ContactPoint",
                "email": "info@getnearme.it",
                "contactType": "customer service",
                "availableLanguage": ["Italian", "English", "Spanish", "French", "Russian", "Ukrainian"],
              },
              "sameAs": [
                // Aggiungi i tuoi social qui quando disponibili
                // "https://twitter.com/getnearme",
                // "https://www.linkedin.com/company/getnearme",
              ],
            }),
          }}
        />
      </head>
      <body
        className="antialiased"
        style={{ fontFamily: "'Satoshi', system-ui, -apple-system, sans-serif" }}
        suppressHydrationWarning
      >
        {children}
        {/* Analytics + embed deferiti (lazyOnload): non competono col primo paint. */}
        <Script id="ms-clarity" strategy="lazyOnload">
          {`(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "vlznalklsj");`}
        </Script>
        <Script id="cal-embed" strategy="lazyOnload">
          {`(function (C, A, L) { let p = function (a, ar) { a.q.push(ar); }; let d = C.document; C.Cal = C.Cal || function () { let cal = C.Cal; let ar = arguments; if (!cal.loaded) { cal.ns = {}; cal.q = cal.q || []; d.head.appendChild(d.createElement("script")).src = A; cal.loaded = true; } if (ar[0] === L) { const api = function () { p(api, arguments); }; const namespace = ar[1]; api.q = api.q || []; if(typeof namespace === "string"){cal.ns[namespace] = cal.ns[namespace] || api;p(cal.ns[namespace], ar);p(cal, ["initNamespace", namespace]);} else p(cal, ar); return;} p(cal, ar); }; })(window, "https://app.cal.com/embed/embed.js", "init");Cal("init", {origin:"https://cal.com"});Cal("ui", {"hideEventTypeDetails":false,"layout":"month_view"});`}
        </Script>
      </body>
    </html>
  );
}

