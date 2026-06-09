/**
 * Generate Italian headlines, summaries, and "why" for selected news.
 * Single Claude call for all 5 items.
 */

import Anthropic from '@anthropic-ai/sdk';
import { trackAnthropicCall } from '../cost-tracker.js';

const anthropic = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY || '').trim() });

/**
 * Generate Italian headlines + summaries for selected news items.
 * @param {Array} selectedItems - the 5 selected news (with title, summary, source)
 * @param {string} edition - 'morning' | 'evening'
 * @returns {Array} items enriched with headline, summary (IT), why
 */
export async function generateHeadlines(selectedItems, edition = 'morning') {
  const editionContext = edition === 'morning'
    ? 'Edizione mattina: il pubblico si e appena svegliato, vuole sapere cosa si e perso stanotte.'
    : 'Edizione sera: recap della giornata, il pubblico vuole un riassunto prima di cena.';

  const newsList = selectedItems.map((n, i) =>
    `${i + 1}. [${n.source}] ${n.title}\n   CONTENUTO ORIGINALE: ${(n.summary || '').slice(0, 1000)}`
  ).join('\n\n');

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 3000,
    messages: [{
      role: 'user',
      content: `Sei il copywriter di @getnearme_app, account Instagram/TikTok di divulgazione AI in italiano.
${editionContext}

== NOTIZIE SELEZIONATE ==
${newsList}

== COMPITO ==
Per OGNUNA delle ${selectedItems.length} notizie, scrivi:
1. **headline**: titolo accattivante in italiano, max 60 caratteri. Chiaro, diretto, senza clickbait.
2. **summary**: massimo 280 caratteri (spazi inclusi). 2 frasi complete, dense di informazioni. NON troncare MAI con "..." o frasi incomplete.
   - Usa SOLO fatti presenti nel CONTENUTO ORIGINALE dell'articolo. NON inventare dettagli.
   - Prima frase: COSA e successo (il fatto concreto). Seconda frase: dettaglio chiave o perche conta.
   - NO frasi vaghe ("sta costruendo", "per soddisfare la domanda"). SI fatti concreti.
   - VIETATO ripetere il titolo. Il summary AGGIUNGE informazioni.
3. **why**: max 120 caratteri. Perche conta per chi segue AI. Frase concreta, basata sui fatti.

Rispondi SOLO con JSON valido:
[
  {
    "index": 1,
    "headline": "titolo italiano max 60 char",
    "summary": "2 frasi complete max 280 caratteri, mai troncare",
    "why": "impatto pratico max 120 char"
  }
]`,
    }],
  });

  await trackAnthropicCall('claude-sonnet-4-20250514', 'headline_generation', response.usage);

  const text = response.content[0].text;
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array in headline response');
  const headlines = JSON.parse(jsonMatch[0]);

  // Merge headlines onto selected items
  return selectedItems.map((item, i) => {
    const h = headlines.find(x => x.index === i + 1) || {};
    const summary = h.summary || '';

    return {
      ...item,
      headline: h.headline || item.title,
      summary,
      why: h.why || '',
    };
  });
}
