import type { Metadata } from 'next';
import { loadSite, siteUrl } from '@/lib/portfolio';
import { siteMeta, siteOgImage } from '@/lib/ogMeta';

// Metadati di base del sito di un agente: sostituiscono quelli di Agente Immo ereditati dal layout della lingua
// (nome del sito, anteprima social, autore). Le pagine aggiungono titolo, descrizione e canonical.
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await loadSite(locale, slug);
  if (!s) return {};
  const description = s.cfg.heroSubtitle || `${s.cfg.agentRole}${s.cfg.city ? ` a ${s.cfg.city}` : ''}`;
  return {
    title: { default: s.name, template: `%s | ${s.name}` },
    applicationName: s.name, appleWebApp: { title: s.name }, manifest: null,
    description, keywords: [], authors: [{ name: s.name }], creator: s.name, publisher: s.name,
    alternates: { canonical: siteUrl(slug) },
    ...(s.test ? { robots: { index: false, follow: false } } : {}), // account di prova: fuori da Google
    // anteprima dei link: copertina caricata dall'agente o card col suo marchio (vale per tutte le pagine del sito)
    ...siteMeta({ name: s.name, title: s.name, description, url: siteUrl(slug), image: siteOgImage(slug, s) }),
  };
}

export default async function AgentSiteLayout({ children, params }: LayoutProps<'/[locale]/a/[slug]'>) {
  const { locale, slug } = await params as { locale: string; slug: string };
  const s = await loadSite(locale, slug);
  // agente per Google (scheda locale): nome, contatti, zona servita
  const ld = s && {
    '@context': 'https://schema.org', '@type': 'RealEstateAgent', name: s.name, url: siteUrl(slug),
    ...(s.logo ? { logo: s.logo, image: s.logo } : {}), ...(s.cfg.phone ? { telephone: s.cfg.phone } : {}), ...(s.cfg.email ? { email: s.cfg.email } : {}),
    ...(s.cfg.address ? { address: { '@type': 'PostalAddress', streetAddress: s.cfg.address, addressLocality: s.cfg.city || undefined, addressCountry: 'IT' } } : {}),
    ...(s.cfg.city || s.cfg.zones.length ? { areaServed: [s.cfg.city, ...s.cfg.zones.map(z => z.name)].filter(Boolean) } : {}),
    sameAs: [s.cfg.instagram, s.cfg.facebook].filter(Boolean),
  };
  return <>{ld && <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, '\\u003c') }} />}{children}</>;
}
