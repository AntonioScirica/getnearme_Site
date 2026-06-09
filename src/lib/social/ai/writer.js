import Anthropic from '@anthropic-ai/sdk';
import { generateSlideImages } from './image.js';
import { trackAnthropicCall } from '../cost-tracker.js';

let _anthropic = null;
function getAnthropicClient() {
  if (!_anthropic) {
    const apiKey = (process.env.ANTHROPIC_API_KEY || '').trim();
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY not set');
    _anthropic = new Anthropic({ apiKey });
  }
  return _anthropic;
}

let _cachedInsights = null;
let _insightsFetchedAt = 0;

async function getWriterInsights() {
  if (_cachedInsights && Date.now() - _insightsFetchedAt < 3600000) return _cachedInsights;
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data } = await sb.from('performance_insights')
      .select('insights')
      .eq('account_id', 'getnearme')
      .order('week_end', { ascending: false })
      .limit(1)
      .single();
    const ai = data?.insights?.ai_analysis;
    if (!ai) return '';
    _cachedInsights = `
STILE (da metriche reali):
${ai.best_hook_pattern ? `- Hook: ${ai.best_hook_pattern}` : ''}
${ai.worst_pattern ? `- Evita: ${ai.worst_pattern}` : ''}
${ai.planner_adjustments?.hook_style ? `- ${ai.planner_adjustments.hook_style}` : ''}
${ai.planner_adjustments?.tone_adjustment ? `- Tono: ${ai.planner_adjustments.tone_adjustment}` : ''}`.trim();
    _insightsFetchedAt = Date.now();
    return _cachedInsights;
  } catch (e) {
    return '';
  }
}

const CTA_CONFIG = {
  news_morning: {
    goal: 'share/reach',
    primary: 'Invia a chi lavora nel tech',
    secondary: 'Seguimi per le news AI ogni mattina',
    caption_cta: 'Manda a chi dovrebbe saperlo 👆 Seguimi per non perderti niente.',
  },
  news_evening: {
    goal: 'comment/engagement',
    primary: 'Qual è la news più assurda?',
    secondary: 'Scrivi nei commenti',
    caption_cta: 'Scrivi nei commenti quale ti ha colpito di più.',
  },
  carousel_rubric: {
    goal: 'save/valore',
    primary: 'Salvalo per quando ti serve',
    secondary: 'Torna quando ti blocchi',
    caption_cta: 'Salva e torna quando ti blocchi. Tagga chi dovrebbe saperlo.',
  },
  video: {
    goal: 'follower/discovery',
    primary: "Seguimi per altre informazioni sull'intelligenza artificiale",
    secondary: '',
    caption_cta: 'Seguimi per non perderti il prossimo.',
  },
  prompt: {
    goal: 'action/ugc',
    primary: 'Copialo e provalo ora',
    secondary: 'Scrivi nei commenti com\'è andata',
    caption_cta: 'Provalo e scrivi nei commenti com\'è andata.',
  },
};

function getCTAForTopic(topic) {
  if (topic.category === 'video') return CTA_CONFIG.video;
  if (topic.category === 'prompt') return CTA_CONFIG.prompt;
  if (topic.template === 'news') {
    return topic.edition === 'morning' ? CTA_CONFIG.news_morning : CTA_CONFIG.news_evening;
  }
  return CTA_CONFIG.carousel_rubric;
}

export async function generateCarouselContent(topic, sourceNews) {
  const isNews = topic.template === 'news';
  const meta = sourceNews?.metadata || {};
  const cta = getCTAForTopic(topic);

  let prompt;

  if (isNews) {
    // News: build slides directly from planner data, only ask Claude for cover + comments + CTA
    const edition = topic.edition || 'evening';
    const isMorning = edition === 'morning';
    const newsDigest = topic.slide_data?.news_digest || [];

    const digestList = newsDigest
      .map((n, i) => `${i + 1}. ${n.headline}: ${n.summary}`)
      .join('\n');

    const coverHint = isMorning
      ? `tipo "Stanotte nell'AI" o "Mentre dormivi, l'AI..."`
      : `tipo "Le 5 news AI della giornata" o "Oggi nell'AI"`;

    const styleHints = await getWriterInsights();
    prompt = `Sei il copywriter per @getnearme_app, account IG che spiega l'AI in modo ironico e diretto.
DATA: ${topic.plan_date}
${styleHints ? `\n${styleHints}\n` : ''}

NOTIZIE DEL CAROSELLO:
${digestList}

Genera SOLO questi elementi:
1. COVER: titolo accattivante ${coverHint} + commento ironico sottotitolo
2. Per OGNI notizia (5 totali): un COMMENTO ironico/pungente (max 15 parole)
3. CAPTION per Instagram
4. HASHTAGS

REGOLE COMMENTI:
- Battuta secca o osservazione pungente
- Vai DRITTO, zero preamboli (MAI iniziare con "in pratica", "tradotto", "cioe", "insomma")
- Pubblico GENERALISTA. Parla come al bar con un amico. Niente gergo (no "deploy", "framework", "API")
- Esempio buono: "Il tuo telefono tra 2 anni costera meno e pensera meglio di te."

Rispondi SOLO con JSON:
{
  "cover_headline": "Titolo accattivante (max 10 parole)",
  "cover_subtitle": "Commento ironico @getnearme_app (max 20 parole, **grassetto** per enfasi)",
  "comments": ["commento notizia 1", "commento notizia 2", "commento notizia 3", "commento notizia 4", "commento notizia 5"],
  "caption": "Caption IG con hook, riassunto delle 5 news. Max 200 parole.",
  "hashtags": ["ai", "tech", "...max 15"]
}`;

    // Build the slides structure directly from planner data
    const writerResult = await callWriter(prompt);

    const slides = [
      {
        type: 'cover',
        headline: writerResult.cover_headline,
        subtitle: writerResult.cover_subtitle,
        source: 'AI News',
      },
      ...newsDigest.map((n, i) => {
        // Format published_at to readable Italian date
        let dateStr = 'oggi';
        if (n.published_at) {
          const d = new Date(n.published_at);
          const today = new Date();
          const yesterday = new Date(today); yesterday.setDate(today.getDate() - 1);
          if (d.toDateString() === today.toDateString()) dateStr = 'oggi';
          else if (d.toDateString() === yesterday.toDateString()) dateStr = 'ieri';
          else {
            const months = ['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
            dateStr = `${d.getDate()} ${months[d.getMonth()]}`;
          }
        }
        return {
          type: 'news_item',
          number: i + 1,
          title: n.headline,
          source: n.source,
          date: dateStr,
          body: n.summary,
          comment: writerResult.comments?.[i] || '',
          image_url: n.image_url || '',
        };
      }),
      {
        type: 'cta',
        headline: cta.primary,
        subtitle: cta.secondary,
      },
    ];

    // Generate AI images for slides missing image_url
    await generateSlideImages(slides);

    return {
      slides,
      caption: writerResult.caption,
      hashtags: writerResult.hashtags,
    };
  } else {
    const isEducation = topic.rubric === 'education';
    const difficulty = topic.slide_data?.difficulty || 'nabbo';
    const isTech = isEducation && difficulty === 'tech';

    const toneInstruction = isEducation
      ? `Tono: ironico e diretto. Come spiegare al bar a un amico. Zero frasi motivazionali. Battute ok ma il lettore deve imparare qualcosa di concreto.`
      : `Tono: amichevole, chiaro, zero gergo tecnico. Come spiegare a un amico curioso.`;

    const educationInstruction = isEducation ? `
TIPO: Tutorial pratico${isTech ? ' — livello TECH (developer/power user)' : ' — livello NABBO (sa cos\'è ChatGPT ma lo usa poco)'}

${isTech
  ? `STILE TECH: Entra subito nel tecnico. Puoi usare termini come "system prompt", "temperature", "API", "chain of thought", "few-shot". Mostra esempi avanzati con codice o prompt engineering. Il lettore è uno sviluppatore o power user che vuole estrarre il massimo dall'AI.`
  : `STILE NABBO: Usa esempi di vita quotidiana (email, lavoro, studio, social). Niente gergo tecnico. Il lettore sa cos'è ChatGPT ma lo usa per cose banali — insegnagli qualcosa di pratico che può usare OGGI.`}

STRUTTURA OBBLIGATORIA per education:
- Slide 1 (cover): titolo trick/tutorial diretto + sottotitolo
- Slide 2-4 (content): step numerati (Passo 1 / Passo 2 / Passo 3) o trick specifici. Ogni slide = UNA azione concreta.
- Slide 5 (cta): invita a salvare e provare
` : '';

    const styleHints = await getWriterInsights();
    prompt = `Sei il copywriter per @getnearme_app, account IG che spiega l'AI in modo semplice e pop.
${toneInstruction}
${styleHints ? `\n${styleHints}\n` : ''}
TOPIC: ${topic.title}
RUBRICA: ${topic.rubric}
${topic.summary ? `CONTESTO: ${topic.summary}` : ''}
${educationInstruction}
Genera un carosello di 5 slide per Instagram (1080x1350).

REGOLA FONDAMENTALE: ogni slide content deve contenere DETTAGLI CONCRETI. Nomi specifici, numeri, esempi reali. MAI frasi generiche tipo "e molto potente" o "ha tante funzionalita". Scrivi QUALI funzionalita, QUANTO e potente (benchmark), CHI lo usa. Chi legge deve imparare qualcosa di preciso.

Rispondi SOLO con JSON:
{
  "slides": [
    {
      "type": "cover",
      "headline": "Titolo accattivante (max 8 parole)",
      "subtitle": "Sottotitolo breve opzionale"
    },
    {
      "type": "content",
      "title": "Titolo slide (max 5 parole)",
      "body": "Testo SPECIFICO con dettagli concreti (max 80 parole, **grassetto** per enfasi)"
    },
    ...altre slide content...
    {
      "type": "cta",
      "headline": "${cta.primary}",
      "subtitle": "${cta.secondary}"
    }
  ],
  "caption": "Caption IG con hook, valore. Chiudi con: ${cta.caption_cta}. Max 300 parole.",
  "hashtags": ["hashtag1", "hashtag2", "...max 15"]
}`;
  }

  let result = await callWriter(prompt);

  // Quality check: validate content slides have specific details
  const vagueSlides = findVagueSlides(result);
  if (vagueSlides.length > 0) {
    result = await rewriteVagueSlides(result, vagueSlides, topic, sourceNews);
  }

  // Inject image_url into content/news_item slides
  // For digest: each news_item gets its own image from news_digest array
  // For other: all content slides share the source image
  if (result.slides) {
    const newsDigest = topic.slide_data?.news_digest || [];
    for (const slide of result.slides) {
      if (slide.type === 'news_item' && !slide.image_url) {
        // Match by number (1-indexed) to news_digest array (0-indexed)
        const digestEntry = newsDigest[slide.number - 1];
        if (digestEntry?.image_url) {
          slide.image_url = digestEntry.image_url;
        }
      } else if (slide.type === 'content' && !slide.image_url) {
        const imageUrl = meta.image_url || sourceNews?.image_url;
        if (imageUrl) slide.image_url = imageUrl;
      }
    }

    // Generate AI images (Flux via Replicate) for slides still missing image_url
    await generateSlideImages(result.slides);
  }

  return result;
}

async function callWriter(prompt) {
  const response = await getAnthropicClient().messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4000,
    messages: [{ role: 'user', content: prompt }],
  });
  await trackAnthropicCall('claude-sonnet-4-20250514', 'writer', response.usage);
  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in writer response');
  return JSON.parse(jsonMatch[0]);
}

// Detect vague, low-value content slides
const VAGUE_PATTERNS = [
  /ha (lanciato|rilasciato|aggiunto|introdotto|presentato) (nuov[eio]|diverse|vari[eio]) (funzionalit|strument|feature)/i,
  /molto (potente|veloce|avanzat|important|interessant)/i,
  /tante (funzionalit|possibilit|novit)/i,
  /cambi(a|er) (tutto|il mondo|le regole)/i,
  /rivoluzion(a|er|ario)/i,
  /il futuro (dell|è qui|è adesso)/i,
  /non (sara|sarà) piu (lo stesso|come prima)/i,
  /un (grande|enorme|significativo) passo avanti/i,
  /migliora (notevolmente|significativamente|molto)/i,
  /nuove (capacita|capacità|possibilita|possibilità)/i,
];

function isVagueText(text) {
  if (!text) return false;
  const matches = VAGUE_PATTERNS.filter(p => p.test(text));
  // Also flag if no numbers, no proper nouns (capitalized words mid-sentence), no specific terms
  const hasNumbers = /\d/.test(text);
  const hasSpecificTerms = /(?:API|GPU|TPU|VRAM|token|benchmark|parametr|miliard|milion|percent|%|x più|GB|TB|MB|ms|fps)/i.test(text);
  const tooGeneric = !hasNumbers && !hasSpecificTerms && text.length > 50;
  return matches.length >= 1 || tooGeneric;
}

function findVagueSlides(result) {
  if (!result.slides) return [];
  return result.slides
    .map((slide, i) => ({ slide, index: i }))
    .filter(({ slide }) =>
      (slide.type === 'content' || slide.type === 'news_item') &&
      (isVagueText(slide.body) || isVagueText(slide.comment))
    );
}

async function rewriteVagueSlides(result, vagueSlides, topic, sourceNews) {
  const slideDescriptions = vagueSlides.map(({ slide, index }) => {
    const text = slide.body || slide.comment || '';
    return `Slide ${index + 1} (title: "${slide.title || slide.headline}"): "${text}"`;
  }).join('\n');

  const context = sourceNews
    ? `FONTE: ${sourceNews.source}\nARTICOLO: ${sourceNews.title}\nRIASSUNTO: ${sourceNews.summary?.slice(0, 500) || ''}`
    : `TOPIC: ${topic.title}\n${topic.summary ? `CONTESTO: ${topic.summary}` : ''}`;

  const rewritePrompt = `Queste slide di un carosello Instagram sono troppo vaghe e generiche. Chi legge non impara nulla di concreto.

${context}

SLIDE DA RISCRIVERE (troppo vaghe):
${slideDescriptions}

Riscrivi SOLO queste slide con DETTAGLI CONCRETI: nomi specifici di feature/modelli/API, numeri (benchmark, parametri, velocita, utenti), esempi reali. Ogni slide deve insegnare qualcosa di preciso.

Rispondi SOLO con JSON array:
[
  { "index": numero_slide, "title": "...", "body": "testo specifico con dettagli concreti" }
]`;

  try {
    const rewriteResponse = await getAnthropicClient().messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [{ role: 'user', content: rewritePrompt }],
    });
    await trackAnthropicCall('claude-haiku-4-5-20251001', 'writer_rewrite', rewriteResponse.usage);
    const rewriteText = rewriteResponse.content[0].text;
    const jsonMatch = rewriteText.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const rewrites = JSON.parse(jsonMatch[0]);
      for (const rw of rewrites) {
        const slide = result.slides[rw.index];
        if (slide) {
          if (rw.title) slide.title = rw.title;
          if (rw.headline) slide.headline = rw.headline;
          if (rw.body) slide.body = rw.body;
          if (rw.comment) slide.comment = rw.comment;
        }
      }
    }
  } catch {
    // Rewrite failed, keep originals — better than crashing
  }
  return result;
}

export async function generateVideoScript(topic, sourceNews) {
  const cta = CTA_CONFIG.video;
  const newsContext = sourceNews
    ? `CONTESTO NEWS: ${sourceNews.title}: ${sourceNews.summary?.slice(0, 300)}`
    : '';

  const videoData = topic.slide_data || {};
  const hookText = videoData.hook || '';

  const response = await getAnthropicClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    messages: [
      {
        role: 'user',
        content: `Sei lo scriptwriter per @getnearme_app. Scrivi script per video reel di circa 30 secondi.
Una mascotte robot (senza bocca, con occhi LED) spiega notizie AI.
Lingua: italiano. Il video parte SUBITO con il parlato, niente titoli o intro.

TONO DI VOCE (FONDAMENTALE):
- Friendly, scherzoso, ironico. Come un amico furbo che ti racconta le cose al bar.
- Battute leggere, osservazioni argute. Non cattivo, ma neanche serio.
- Vai DRITTO, zero preamboli (MAI "in pratica", "tradotto", "cioe", "insomma", "sai cos'e").
- Pubblico GENERALISTA. Zero gergo tech. Se usi un termine tecnico, spiegalo con ironia.

Chiudi il video con: "${cta.primary}"

TOPIC: ${topic.title}
TIPO VIDEO: ${videoData.video_type || 'pillola'}
${hookText ? `HOOK SUGGERITO: ${hookText}` : ''}
${topic.summary ? `CONTESTO: ${topic.summary}` : ''}
${newsContext}

SEGMENTI B-ROLL:
Dividi lo script in 4-5 SEGMENTI. Per ogni segmento, scrivi una keyword di ricerca YouTube MOLTO SPECIFICA per trovare un video B-roll pertinente a ESATTAMENTE cosa si dice in quel pezzo.

Rispondi SOLO con JSON:
{
  "script": "Testo completo voiceover ~90-110 parole. ~30 secondi. Friendly e scherzoso. Parte subito, chiudi con CTA.",
  "segments": [
    { "text": "parte esatta dello script", "broll_keyword": "specific YouTube search keyword" },
    { "text": "...", "broll_keyword": "..." }
  ],
  "caption": "Caption IG/TikTok con hook. Chiudi con: ${cta.caption_cta}. Max 200 parole.",
  "hashtags": ["hashtag1", "hashtag2", "...max 15"],
  "duration_estimate_seconds": 30
}`,
      },
    ],
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in script response');
  return JSON.parse(jsonMatch[0]);
}

export async function generatePromptContent(topic) {
  const cta = CTA_CONFIG.prompt;
  // Support both old format (slide_data.prompt_data) and new format (slide_data directly)
  const promptData = topic.slide_data?.prompt_data || topic.slide_data || {};

  const response = await getAnthropicClient().messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: `Sei il copywriter per @getnearme_app. Tono: ironico e diretto, come spiegare a un amico al bar. Zero frasi motivazionali.
${await getWriterInsights() ? '\n' + await getWriterInsights() + '\n' : ''}
Crei post "Prompt del Giorno" — prompt AI pratici che risolvono problemi reali.

TITOLO: ${topic.title}
TOOL: ${promptData.tool || 'ChatGPT'}
PROMPT PROPOSTO: ${promptData.prompt_text || topic.summary}
USE CASE: ${promptData.use_case || 'produttivita'}

Genera un carosello di 7 slide per Instagram (1080x1350):
- Slide 1 (cover): titolo beneficio diretto + sottotitolo ironico
- Slide 2 (prompt): il prompt base, monospace, con [placeholder] chiari
- Slide 3 (explanation): perché funziona — 2-3 frasi concrete e dirette
- Slide 4 (example): esempio reale input → output
- Slide 5 (variant, Variante 1): stesso prompt per use case diverso #1
- Slide 6 (variant, Variante 2): stesso prompt per use case diverso #2
- Slide 7 (cta): call to action

REGOLE:
- Cover headline: beneficio immediato (es: "Riscrivi email difficili in 10 sec")
- Prompt: specifico, con [placeholder] per parti personalizzabili
- Explanation: spiega IL MECCANISMO — perché queste parole funzionano con l'AI, non solo "è utile"
- Varianti: stesso schema del prompt base ma adattato a use case DIVERSI e CONCRETI
- Tono: ironico ma sostanzioso. Battute ok ma il lettore deve imparare qualcosa.

Rispondi SOLO con JSON:
{
  "slides": [
    {
      "type": "cover",
      "headline": "Beneficio diretto (max 8 parole)",
      "subtitle": "Sottotitolo ironico — con ${promptData.tool || 'ChatGPT'}"
    },
    {
      "type": "prompt",
      "tool": "${promptData.tool || 'ChatGPT'}",
      "prompt_text": "Prompt completo con [placeholder] per parti personalizzabili",
      "tip": "Tip breve su come usarlo (max 15 parole)"
    },
    {
      "type": "explanation",
      "body": "Perché funziona: [meccanismo concreto, 2-3 frasi, ironico]"
    },
    {
      "type": "example",
      "title": "Esempio",
      "input": "Input concreto (cosa l'utente scrive/incolla)",
      "output": "Output realistico (2-4 righe)"
    },
    {
      "type": "variant",
      "label": "Variante 1",
      "context": "Use case: [nome use case]",
      "prompt_text": "Versione adattata del prompt per use case diverso #1"
    },
    {
      "type": "variant",
      "label": "Variante 2",
      "context": "Use case: [nome use case]",
      "prompt_text": "Versione adattata del prompt per use case diverso #2"
    },
    {
      "type": "cta",
      "headline": "${cta.primary}",
      "subtitle": "${cta.secondary}"
    }
  ],
  "caption": "Caption IG con hook pratico. Cosa fa il prompt, quando usarlo, perché vale la pena. Chiudi con: ${cta.caption_cta}. Max 200 parole.",
  "hashtags": ["prompt", "ai", "chatgpt", "...max 15"]
}`,
      },
    ],
  });

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in prompt response');
  const result = JSON.parse(jsonMatch[0]);

  // Force correct slide types — Haiku sometimes returns 'content' for all
  const PROMPT_SLIDE_TYPES = ['cover', 'prompt', 'explanation', 'example', 'variant', 'variant', 'cta'];
  if (result.slides) {
    for (let i = 0; i < result.slides.length && i < PROMPT_SLIDE_TYPES.length; i++) {
      result.slides[i].type = PROMPT_SLIDE_TYPES[i];
    }
  }

  return result;
}
