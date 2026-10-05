import { GUIDES, guideBySlug } from '@/lib/guides';
import { AGENT_TOPICS, OWNER_STEPS, PILLAR } from '@/lib/guides/related';
import { CITIES, OMI_SEMESTRE } from '@/lib/omiCitta';
import { BASE, ORG_DESCRIPTION } from '@/lib/seo';

// /llms.txt e /llms-full.txt (formato llmstxt.org): mappa del sito per i modelli linguistici, generata dalle stesse
// liste delle pagine (guide, gruppi, città), cosi' resta aggiornata da sola.
const link = (slug: string) => { const g = guideBySlug(slug); return g ? `- [${g.label}](${BASE}/it/${g.slug}): ${g.description}` : ''; };

export function llmsTxt() {
  const pillar = guideBySlug(PILLAR)!;
  return [
    '# Agente Immo',
    '',
    `> ${ORG_DESCRIPTION}`,
    '',
    'Sito in italiano (agenteimmo.me/it), con la home anche in inglese (agenteimmo.me/en). Le guide citano le norme (Legge 39/1989, Codice civile, D.Lgs. 192/2005 e altre) e le fonti dei dati con la data. I prezzi delle case vengono dalle quotazioni OMI dell\'Agenzia delle Entrate (licenza CC BY 4.0). Agente Immo è il nome commerciale di Antonio Scirica, Roma, P.IVA 16096461005.',
    '',
    '## Pagine principali',
    '',
    `- [Agente Immo, software per agenti immobiliari](${BASE}/it): foto arredate con l'AI, video per i social e sito personale per ogni immobile; prezzi e prova gratuita.`,
    `- [${pillar.label}: cosa fa, requisiti e guadagni](${BASE}/it/${pillar.slug}): guida pilastro sul mestiere di agente immobiliare in Italia.`,
    `- [Guide per agenti immobiliari](${BASE}/it/guide): tutte le guide per agenti, divise per argomento.`,
    `- [Vendere casa](${BASE}/it/vendere-casa): guide per i proprietari che vendono casa, in ordine di percorso.`,
    `- [Quanto vale la mia casa?](${BASE}/it/quanto-vale-la-mia-casa): valutazione gratuita della casa dalle quotazioni OMI della zona, risultato via email.`,
    `- [Prezzi delle case al metro quadro](${BASE}/it/prezzi-case): quotazioni OMI zona per zona in ${CITIES.length} città italiane, ${OMI_SEMESTRE}.`,
    `- [Blog](${BASE}/it/blog): articoli per agenti immobiliari su staging, video, social, report e strumenti AI.`,
    `- [Chi siamo](${BASE}/it/chi-siamo): chi c'è dietro Agente Immo e dati aziendali.`,
    '',
    ...AGENT_TOPICS.flatMap(t => [`## Guide per agenti: ${t.title}`, '', ...t.slugs.map(link).filter(Boolean), '']),
    '## Guide per chi vende casa',
    '',
    ...OWNER_STEPS.flatMap(([, slugs]) => slugs.map(link)).filter(Boolean),
    '',
    '## Prezzi delle case per città',
    '',
    ...CITIES.map(c => `- [Prezzo case ${c.nome} al metro quadro](${BASE}/it/prezzi-case/${c.slug}): quotazioni OMI per zona, ${c.regione}.`),
    '',
    '## Optional',
    '',
    `- [Testo completo delle guide](${BASE}/llms-full.txt): tutte le guide in testo semplice.`,
    `- [Termini di servizio](${BASE}/it/termini)`,
    `- [Privacy](${BASE}/it/privacy)`,
    '',
  ].join('\n');
}

const text = (html: string) => html
  .replace(/<li>/g, '- ').replace(/<\/(p|li|ul|ol|tr|h3)>/g, '\n').replace(/<\/t[dh]>/g, ' | ')
  .replace(/<a href="(\/[^"]*)"[^>]*>(.*?)<\/a>/g, (_, h, t) => `[${t}](${BASE}${h})`)
  .replace(/<a href="(http[^"]*)"[^>]*>(.*?)<\/a>/g, '[$2]($1)')
  .replace(/<[^>]+>/g, '').replace(/&nbsp;/g, ' ').replace(/^[ \t]+|[ \t]+$/gm, '').replace(/\n{2,}(?=- )/g, '\n').replace(/\n{3,}/g, '\n\n').trim();

export function llmsFullTxt() {
  return [
    '# Agente Immo: guide complete',
    '',
    `> ${ORG_DESCRIPTION}`,
    '',
    ...GUIDES.flatMap(g => [
      `## ${g.h1}`,
      '',
      `URL: ${BASE}/it/${g.slug}`,
      `Aggiornata: ${g.updated}`,
      '',
      g.intro,
      '',
      ...(g.summary ? [`In breve: ${g.summary}`, ''] : []),
      ...g.sections.flatMap(s => [`### ${s.title}`, '', text(s.html), '']),
      '### Domande frequenti',
      '',
      ...g.faq.flatMap(([q, a]) => [`**${q}** ${a}`, '']),
    ]),
  ].join('\n');
}
