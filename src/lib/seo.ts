// Entità per i dati strutturati (JSON-LD) di agenteimmo.me: la stessa Organization e lo stesso WebSite su tutte le pagine,
// richiamati per @id. Solo fatti veri (vedi anche le note legali in legalContent.ts e la pagina /it/chi-siamo).

export const BASE = 'https://agenteimmo.me';
export const ORG_ID = `${BASE}/#org`;
export const SITE_ID = `${BASE}/#site`;

// la frase con cui ci presentiamo ovunque (pagine, llms.txt, dati strutturati): stesso nome, stessa descrizione
export const ORG_DESCRIPTION = 'Agente Immo è la piattaforma per agenti immobiliari italiani su agenteimmo.me: foto arredate con l\'intelligenza artificiale, video per i social e il sito personale dell\'agente, per ogni immobile. Pubblica anche guide gratuite e la valutazione online della casa per i proprietari.';

export const ORGANIZATION = {
  '@type': 'Organization',
  '@id': ORG_ID,
  name: 'Agente Immo',
  url: `${BASE}/it`,
  logo: { '@type': 'ImageObject', url: `${BASE}/immo/logo-mark.png` },
  email: 'info@agenteimmo.me',
  description: ORG_DESCRIPTION,
  founder: { '@type': 'Person', name: 'Antonio Scirica' },
  address: { '@type': 'PostalAddress', streetAddress: 'Viale Pretoriano 3', addressLocality: 'Roma', addressRegion: 'RM', addressCountry: 'IT' },
  vatID: 'IT16096461005',
  areaServed: { '@type': 'Country', name: 'Italia' },
  knowsLanguage: ['it', 'en'],
} as const;

export const WEBSITE = {
  '@type': 'WebSite',
  '@id': SITE_ID,
  name: 'Agente Immo',
  url: BASE,
  inLanguage: ['it-IT', 'en'],
  publisher: { '@id': ORG_ID },
} as const;

export const breadcrumbs = (items: [string, string][]) => ({
  '@type': 'BreadcrumbList',
  itemListElement: items.map(([name, item], i) => ({ '@type': 'ListItem', position: i + 1, name, item })),
});
