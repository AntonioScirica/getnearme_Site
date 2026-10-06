import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { locales } from '@/lib/i18n';
import { platformFontVars } from '@/lib/platformFonts';
import { FAQ, FAQ_EN } from '@/lib/landingFaq';
import { PRICING } from '@/lib/pricing';
import AgenteImmoLanding from '@/components/landing/AgenteImmoLanding';
import { ORGANIZATION, ORG_ID, WEBSITE } from '@/lib/seo';
import { immoMeta } from '@/lib/ogMeta';

// Home di agenteimmo.me: landing di Agente Immo in italiano (/it) e inglese (/en). Le altre lingue rimandano a /en
// (niente pagine duplicate con hreflang falsi). La piattaforma dietro, per ora, e' solo in italiano.
// ponytail: la vecchia landing GetNearMe (estensione) e' nella storia git, prima del commit che l'ha sostituita.
const IT_URL = 'https://agenteimmo.me/it';
const EN_URL = 'https://agenteimmo.me/en';
const COPY = {
  it: { url: IT_URL, og: 'it_IT', title: 'Software per agenti immobiliari: più incarichi | Agente Immo', share: 'Agente Immo, il software per agenti immobiliari', short: 'Più incarichi, case vendute prima. Senza spendere di più.', desc: 'Il software per agenti immobiliari che ti fa vincere più incarichi: foto arredate con l\'AI, video per i social e il tuo sito, senza fotografo né web agency.', faq: FAQ, lang: 'it-IT', features: ['Home staging virtuale con AI', 'Video immobiliari per i social', 'Sito personale per agente immobiliare', 'Annunci e report per ogni immobile'], audience: 'Agenti immobiliari e agenzie immobiliari', offer: 'Prezzo mensile: Starter mensile, Pro annuale o trimestrale', card: { title: 'Il software per agenti immobiliari', subtitle: 'Foto arredate con l\'AI, video per i social e il tuo sito. Più incarichi, case vendute prima.' } },
  en: { url: EN_URL, og: 'en_US', title: 'Real estate agent software: win more listings | Agente Immo', share: 'Agente Immo, the software for real estate agents', short: 'Win more listings, sell homes faster. Without spending more.', desc: 'The real estate agent software that helps you win more listings: AI-staged photos, social media videos and your own website, no photographer or web agency.', faq: FAQ_EN, lang: 'en', features: ['AI virtual staging', 'Real estate videos for social media', 'Personal website for real estate agents', 'Listings and reports for every property'], audience: 'Real estate agents and agencies', offer: 'Monthly price: Starter monthly, Pro yearly or quarterly', card: { title: 'The software for real estate agents', subtitle: 'AI-staged photos, social videos and your own website. Win more listings, sell homes faster.' } },
} as const;
const langOf = (locale: string) => (locale === 'en' ? 'en' : 'it') as keyof typeof COPY;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const c = COPY[langOf((await params).locale)];
  return {
    title: { absolute: c.title },
    description: c.desc,
    alternates: { canonical: c.url, languages: { it: IT_URL, en: EN_URL, 'x-default': IT_URL } },
    ...immoMeta({ title: c.share, description: c.short, url: c.url, locale: langOf((await params).locale), card: c.card }),
  };
}

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const jsonLd = (c: (typeof COPY)[keyof typeof COPY]) => ({
  '@context': 'https://schema.org',
  '@graph': [
    // niente SearchAction: il sito non ha una ricerca interna
    ORGANIZATION,
    WEBSITE,
    {
      '@type': 'SoftwareApplication', name: 'Agente Immo', applicationCategory: 'BusinessApplication', operatingSystem: 'Web',
      url: c.url, description: c.desc, inLanguage: c.lang, audience: { '@type': 'BusinessAudience', audienceType: c.audience },
      featureList: c.features,
      offers: { '@type': 'AggregateOffer', priceCurrency: 'EUR', lowPrice: PRICING.starter, highPrice: PRICING.quarterly, offerCount: 3, description: c.offer },
      publisher: { '@id': ORG_ID },
    },
    { '@type': 'FAQPage', mainEntity: c.faq.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ],
});

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'it' && locale !== 'en') permanentRedirect('/en');
  const lang = langOf(locale);
  const c = COPY[lang];
  return (
    <div className={platformFontVars} lang={c.lang}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd(c)) }} />
      <AgenteImmoLanding lang={lang} faq={[...c.faq]} />
    </div>
  );
}
