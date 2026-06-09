/**
 * Claude batch scoring: market_impact (0-20), novelty (0-15), audience_utility (0-15), risk (0 to -10).
 * Also assigns topic_slug, company, is_opinion, is_tutorial per news.
 */

import Anthropic from '@anthropic-ai/sdk';
import { trackAnthropicCall } from '../cost-tracker.js';

const anthropic = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY || '').trim() });

/**
 * Build prompt for Claude to score all candidate news at once.
 * @param {Array} newsList - candidate news
 * @param {Array} alreadyPublished - news from today's other edition (headline + topic_slug)
 */
function buildScoringPrompt(newsList, alreadyPublished = []) {
  const newsStr = newsList.map((n, i) => {
    const pubTime = n.published_at ? new Date(n.published_at).toISOString().slice(0, 16).replace('T', ' ') : '?';
    return `${i + 1}. [${n.source}] [${pubTime}] ${n.title}\n   ${(n.summary || '').slice(0, 300)}`;
  }).join('\n\n');

  const alreadySection = alreadyPublished.length
    ? `\n== NOTIZIE GIA PUBBLICATE OGGI (altra edizione) ==
Le seguenti notizie sono GIA state selezionate nell'altra edizione di oggi. Se una notizia nella lista da valutare parla dello STESSO argomento, DEVI assegnarle lo STESSO topic_slug indicato qui sotto. Questo serve per evitare duplicati tra mattina e sera.
${alreadyPublished.map(n => `- [slug: ${n.topic_slug}] ${n.headline}`).join('\n')}
\nATTENZIONE: qualsiasi notizia che tratta lo stesso tema di quelle sopra DEVE avere lo stesso slug, anche se l'angolo e diverso.\n`
    : '';

  return `Sei un news analyst AI. Valuta OGNI notizia nella lista secondo 4 criteri semantici. Assegna anche metadati per dedup.

== NOTIZIE DA VALUTARE ==
${newsStr}
${alreadySection}

== CRITERI DI SCORING ==

1. **market_impact** (0-20): quanto e impattante per il mercato AI?
   - 18-20: lancio prodotto major (nuovo modello, nuova piattaforma)
   - 13-17: update significativo, partnership importante, acquisizione
   - 8-12: feature update, benchmark, integrazione
   - 3-7: rumor, leak, opinione di rilievo
   - 0-2: notizia minore, locale, di nicchia

2. **novelty** (0-15): quanto e nuova questa informazione?
   - 13-15: prima copertura assoluta, breaking news
   - 8-12: angolo nuovo su storia nota, dettagli esclusivi
   - 3-7: coverage standard di evento noto
   - 0-2: rehash, rimasticatura di notizia vecchia

3. **audience_utility** (0-15): quanto interessa al pubblico italiano non-tecnico che segue AI?
   - 13-15: "tutti devono saperlo", cambia come usano AI
   - 8-12: interessante, impara qualcosa di utile
   - 3-7: rilevante solo per addetti ai lavori
   - 0-2: troppo tecnico o irrilevante per il pubblico target

4. **risk** (da 0 a -10): penalita per contenuto non-news o off-topic
   - 0: notizia pura, fatto accaduto nel mondo AI
   - -3: leggermente opinionated ma con fatti AI concreti
   - -5: opinione mascherata da news
   - -7: opinion piece, editoriale, commento
   - -8: listicle ("Top 10...", "Best 5...")
   - -10: tutorial ("How to...", "Guide"), contenuto didattico
   - **-10: OFF-TOPIC** — notizie che NON riguardano AI/machine learning/tech. Crypto, cannabis, finanza, sport, gossip, hardware generico senza AI = SEMPRE -10. Se il titolo menziona "AI" ma il contenuto e su altro (es. "vape AI che paga Bitcoin") = -10.

== METADATI DA ASSEGNARE ==

Per ogni notizia assegna anche:
- **topic_slug**: identificatore normalizzato del TOPIC (lowercase, hyphen-separated). REGOLE CRITICHE:
  - Notizie sullo STESSO PRODOTTO/EVENTO = STESSO slug, anche se angoli diversi. Esempio: "Claude Opus 4.8 piu onesto" e "Claude Opus 4.8 usa troppa memoria" e "Anthropic rilascia Opus 4.8" → TUTTE "claude-opus-4-8-release" perche parlano dello stesso rilascio.
  - "Claude Code subagenti" e "Claude Code comandi autonomi" → TUTTE "claude-code-new-features" perche sono novita dello stesso prodotto nello stesso periodo.
  - "NVIDIA FOX per fabbriche" e "NVIDIA Cosmos per AI fisico" → TUTTE "nvidia-physical-ai-platform" perche per il pubblico non-tecnico e la stessa storia (NVIDIA fa AI per il mondo reale).
  - Sii SPECIFICO ma RAGGRUPPA: lo slug identifica IL TEMA, non l'angolo giornalistico. Se due articoli finirebbero nello stesso post Instagram, DEVONO avere lo stesso slug.
  - NON creare slug diversi solo perche il titolo e diverso. Chiediti: "un follower direbbe che sono la stessa notizia?" Se si, stesso slug.
- **company**: azienda principale (lowercase): "anthropic", "openai", "google", "nvidia", "meta", "microsoft", "apple", "mistral", "other"
- **is_opinion**: true se e un opinion piece, editoriale, commento personale
- **is_tutorial**: true se e tutorial, guida, how-to, listicle

== OUTPUT ==
Rispondi SOLO con JSON valido. Array con un oggetto per OGNI notizia, stesso ordine della lista:
[
  {
    "index": 1,
    "market_impact": 18,
    "novelty": 12,
    "audience_utility": 14,
    "risk": 0,
    "topic_slug": "claude-opus-4-launch",
    "company": "anthropic",
    "is_opinion": false,
    "is_tutorial": false
  }
]

IMPORTANTE: valuta TUTTE le ${newsList.length} notizie. Non saltarne nessuna.`;
}

/**
 * Parse Claude's scoring response into structured array.
 */
function parseScoringResponse(text) {
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) throw new Error('No JSON array in scoring response');
  return JSON.parse(jsonMatch[0]);
}

/**
 * Score all candidate news via Claude in a single batch call.
 * @param {Array} newsList - pre-filtered news items
 * @param {Array} alreadyPublished - news from today's other edition [{headline, topic_slug}]
 * @returns {Array} scored items with semantic scores + metadata
 */
export async function scoreWithClaude(newsList, alreadyPublished = []) {
  const prompt = buildScoringPrompt(newsList, alreadyPublished);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 8000,
    messages: [{ role: 'user', content: prompt }],
  });

  await trackAnthropicCall('claude-sonnet-4-20250514', 'news_scoring', response.usage);

  const text = response.content[0].text;
  const scores = parseScoringResponse(text);

  // Merge Claude scores back onto news items
  return newsList.map((item, i) => {
    const claudeScore = scores.find(s => s.index === i + 1) || {};
    return {
      ...item,
      semanticScores: {
        market_impact: claudeScore.market_impact ?? 0,
        novelty: claudeScore.novelty ?? 0,
        audience_utility: claudeScore.audience_utility ?? 0,
        risk: claudeScore.risk ?? 0,
      },
      topic_slug: claudeScore.topic_slug || 'unknown',
      company: claudeScore.company || 'other',
      is_opinion: claudeScore.is_opinion || false,
      is_tutorial: claudeScore.is_tutorial || false,
    };
  });
}
