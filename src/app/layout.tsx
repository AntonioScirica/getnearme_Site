import type { Metadata } from "next";
import { Inter, Old_Standard_TT } from "next/font/google";
import "./globals.css";
import LanguageWrapper from "@/components/LanguageWrapper";

const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700", "800", "900"],
  variable: "--font-inter"
});

const oldStandard = Old_Standard_TT({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-old-standard"
});

export const metadata: Metadata = {
  title: {
    default: "GetNearMe",
    template: "%s | GetNearMe"
  },
  description: "Estensione Chrome per l'analisi immobiliare. Confronta immobili, analizza quartieri, prezzi e servizi della zona direttamente dai portali immobiliari.",
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
  metadataBase: new URL("https://getnearme.it"),
  alternates: {
    canonical: "/",
    languages: {
      "it": "/",
      "en": "/",
      "es": "/",
      "fr": "/",
    }
  },
  openGraph: {
    type: "website",
    locale: "it_IT",
    alternateLocale: ["en_US", "es_ES", "fr_FR"],
    url: "https://getnearme.it",
    siteName: "GetNearMe",
    title: "GetNearMe - Analisi Immobiliare Intelligente",
    description: "Estensione Chrome per l'analisi immobiliare. Confronta immobili, analizza quartieri, prezzi e servizi della zona direttamente dai portali immobiliari.",
    images: [
      {
        url: "/assets/png/immobile.png",
        width: 1200,
        height: 630,
        alt: "GetNearMe - Anteprima Applicazione"
      }
    ]
  },
  twitter: {
    card: "summary_large_image",
    title: "GetNearMe - Analisi Immobiliare Intelligente",
    description: "Estensione Chrome per l'analisi immobiliare. Confronta immobili, analizza quartieri e prezzi della zona.",
    images: ["/assets/png/immobile.png"],
    creator: "@getnearme"
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1
    }
  },
  verification: {
    // Aggiungi qui i tuoi codici di verifica quando li avrai
    // google: "codice-google-search-console",
    // yandex: "codice-yandex",
  },
  category: "technology"
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="it">
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
        
        {/* Schema.org JSON-LD */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              "name": "GetNearMe",
              "applicationCategory": "BrowserApplication",
              "operatingSystem": "Chrome",
              "description": "Estensione Chrome per l'analisi immobiliare. Confronta immobili, analizza quartieri, prezzi e servizi della zona direttamente dai portali immobiliari.",
              "url": "https://getnearme.it",
              "author": {
                "@type": "Organization",
                "name": "GetNearMe",
                "url": "https://getnearme.it"
              },
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "EUR",
                "description": "Piano gratuito con 500 crediti"
              },
              "aggregateRating": {
                "@type": "AggregateRating",
                "ratingValue": "4.8",
                "ratingCount": "150"
              }
            })
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              "name": "GetNearMe",
              "url": "https://getnearme.it",
              "potentialAction": {
                "@type": "SearchAction",
                "target": "https://getnearme.it/?q={search_term_string}",
                "query-input": "required name=search_term_string"
              }
            })
          }}
        />
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
                "availableLanguage": ["Italian", "English", "Spanish", "French"]
              },
              "sameAs": []
            })
          }}
        />
      </head>
      <body className={`${inter.variable} ${oldStandard.variable} ${inter.className} antialiased`}>
        <LanguageWrapper>
          {children}
        </LanguageWrapper>
      </body>
    </html>
  );
}
