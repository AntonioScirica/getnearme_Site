import type { Metadata } from 'next';
import { loadSite, siteUrl } from '@/lib/portfolio';

// Metadati di base del sito di un agente: sostituiscono quelli di Agente Immo ereditati dal layout della lingua
// (nome del sito, anteprima social, autore). Le pagine aggiungono titolo, descrizione e canonical.
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await loadSite(locale, slug);
  if (!s) return {};
  const image = s.cfg.heroImage || s.properties[0]?.cover;
  const description = s.cfg.heroSubtitle || `${s.cfg.agentRole}${s.cfg.city ? ` a ${s.cfg.city}` : ''}`;
  return {
    title: { default: s.name, template: `%s | ${s.name}` },
    applicationName: s.name, appleWebApp: { title: s.name }, manifest: null,
    description, keywords: [], authors: [{ name: s.name }], creator: s.name, publisher: s.name,
    alternates: { canonical: siteUrl(slug) },
    openGraph: { type: 'website', locale: 'it_IT', siteName: s.name, url: siteUrl(slug), title: s.name, description, images: image ? [image] : [] },
    twitter: { card: 'summary_large_image', title: s.name, description, images: image ? [image] : [] },
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
