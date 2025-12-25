import type { Metadata } from "next";
import { Inter, Old_Standard_TT } from "next/font/google";
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

const inter = Inter({
  subsets: ["latin", "cyrillic"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter",
  display: "swap",
});

const oldStandard = Old_Standard_TT({
  subsets: ["latin", "cyrillic"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-old-standard",
  display: "swap",
});

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
  
  const baseUrl = "https://getnearme.it";
  
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
      "estensione chrome immobiliare",
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
              "url": `https://getnearme.it/${locale}`,
              "inLanguage": locale,
              "author": {
                "@type": "Organization",
                "name": "GetNearMe",
                "url": "https://getnearme.it",
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
              "url": "https://getnearme.it",
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
              "url": "https://getnearme.it",
              "logo": "https://getnearme.it/favicon.ico",
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
        className={`${inter.variable} ${oldStandard.variable} ${inter.className} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}

