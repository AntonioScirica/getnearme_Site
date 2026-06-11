/**
 * Generate Italian copy for weekly market stats post.
 * Reads latest data from market_stats table, sends to Claude for copy generation.
 */

import Anthropic from '@anthropic-ai/sdk';
import { trackAnthropicCall } from '../cost-tracker.js';

const anthropic = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY || '').trim() });

/**
 * Generate stats post copy from market data.
 * @param {object} data - { ipab, compravendite, mortgage } latest values
 * @returns {object} { headline, stat_value, stat_unit, trend_dir, trend_label, title, description, breakdown, cta_text }
 */
export async function generateStatsCopy(data) {
  const dataBlock = JSON.stringify(data, null, 2);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 1500,
    messages: [{
      role: 'user',
      content: `Sei il copywriter di @getnearme_app, account Instagram per agenti immobiliari italiani.
Devi creare il copy per un post settimanale "Statistiche Mercato Immobiliare" con design neobrutalist.

== DATI DISPONIBILI ==
${dataBlock}

== REGOLE ==
- Target: agenti immobiliari italiani, professionisti
- Tono: professionale ma accessibile, dati concreti
- MAI menzionare "dati OMI" o "Osservatorio del Mercato Immobiliare"
- Fonti ammesse: ISTAT, Nomisma, Banca d'Italia, ECB
- Scegli il dato piu interessante/impattante come hero stat
- Il post deve dare valore informativo reale, non solo promozione

== OUTPUT ==
Rispondi SOLO con un JSON valido (niente markdown):
{
  "hero_number": "+3,2",
  "hero_unit": "%",
  "hero_trend": "up",
  "hero_trend_label": "+3,2% YoY",
  "hero_vs": "vs Q1 2025",
  "source_tag": "ISTAT",
  "period_tag": "Q1 2026",
  "category": "Mercato Immobiliare",
  "title": "Compravendite in <highlight>crescita</highlight> nel primo trimestre",
  "description": "Breve descrizione (max 180 char) del dato principale con contesto.",
  "breakdown": [
    { "label": "Milano", "sublabel": "Prezzo medio al mq", "trend": "+4,1%", "dir": "up" },
    { "label": "Roma", "sublabel": "Prezzo medio al mq", "trend": "+2,8%", "dir": "up" }
  ],
  "breakdown_title": "Dettaglio per zona",
  "breakdown_source": "Fonte: ISTAT, Nomisma — Q1 2026",
  "story_title": "Il mercato <highlight>cresce</highlight>",
  "story_subtitle": "Scopri i dati della tua zona con l'analisi gratuita di GetNearMe.",
  "reel_title": "Compravendite in crescita nel primo trimestre 2026",
  "reel_desc": "Breve per il reel (max 120 char)",
  "caption": "Caption Instagram completa con emoji e hashtag (max 2200 char)",
  "hashtags": ["#immobiliare", "#mercatoimmobiliare", "#agenteimmobiliare"]
}`
    }],
  });

  const text = response.content[0]?.text || '';
  trackAnthropicCall('stats-writer', response);

  try {
    const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch (err) {
    console.error('[stats-writer] Failed to parse Claude response:', text.slice(0, 200));
    throw new Error(`Stats copy generation failed: ${err.message}`);
  }
}
