import type { Metadata } from 'next';
import { permanentRedirect } from 'next/navigation';
import { locales } from '@/lib/i18n';
import { platformFontVars } from '@/lib/platformFonts';
import { FAQ } from '@/lib/landingFaq';
import AgenteImmoLanding from '@/components/landing/AgenteImmoLanding';

// Home di agenteimmo.me: landing di Agente Immo. Esiste solo in italiano: le altre lingue rimandano a /it
// (niente pagine duplicate con hreflang falsi).
// ponytail: la vecchia landing GetNearMe (estensione) e' nella storia git, prima del commit che l'ha sostituita.
const URL = 'https://agenteimmo.me/it';
const TITLE = 'Software per agenti immobiliari: più incarichi, case vendute prima | Agente Immo';
const DESC = 'Il software per agenti immobiliari che ti fa vincere più incarichi: foto arredate con l\'AI, video per i social e il tuo sito, senza fotografo né web agency. Prova gratis.';

export const metadata: Metadata = {
  title: { absolute: TITLE },
  description: DESC,
  alternates: { canonical: URL, languages: { it: URL, 'x-default': URL } },
  openGraph: { type: 'website', url: URL, siteName: 'Agente Immo', locale: 'it_IT', title: 'Agente Immo, il software per agenti immobiliari', description: 'Più incarichi, case vendute prima. Senza spendere di più.', images: ['/immo/home/staging-after.webp'] },
  twitter: { card: 'summary_large_image', title: 'Agente Immo, il software per agenti immobiliari', description: DESC, images: ['/immo/home/staging-after.webp'] },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    { '@type': 'Organization', '@id': 'https://agenteimmo.me/#org', name: 'Agente Immo', url: URL, logo: 'https://agenteimmo.me/immo/logo-mark.png', email: 'info@agenteimmo.me' },
    { '@type': 'WebSite', '@id': 'https://agenteimmo.me/#site', name: 'Agente Immo', url: URL, inLanguage: 'it-IT', publisher: { '@id': 'https://agenteimmo.me/#org' } },
    {
      '@type': 'SoftwareApplication', name: 'Agente Immo', applicationCategory: 'BusinessApplication', operatingSystem: 'Web',
      url: URL, description: DESC, inLanguage: 'it-IT', audience: { '@type': 'BusinessAudience', audienceType: 'Agenti immobiliari e agenzie immobiliari' },
      featureList: ['Home staging virtuale con AI', 'Video immobiliari per i social', 'Sito personale per agente immobiliare', 'Annunci e report per ogni immobile'],
      publisher: { '@id': 'https://agenteimmo.me/#org' },
    },
    { '@type': 'FAQPage', mainEntity: FAQ.map(([q, a]) => ({ '@type': 'Question', name: q, acceptedAnswer: { '@type': 'Answer', text: a } })) },
  ],
};

export default async function Home({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  if (locale !== 'it') permanentRedirect('/it');
  return (
    <div className={platformFontVars}>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <AgenteImmoLanding />
    </div>
  );
}
