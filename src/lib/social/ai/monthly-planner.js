/**
 * Monthly editorial planner. Claude generates topics for the month:
 * - 1 rubric per day (rotating schedule)
 * - 1 "Prompt del Giorno" per day (30/month)
 * News (morning + evening) are handled separately by cron.
 */

import Anthropic from '@anthropic-ai/sdk';
import { trackAnthropicCall } from '../cost-tracker.js';

const anthropic = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY || '').trim() });

// Rubric rotation: 6 rubrics across 7 days (Mon-Sun)
const RUBRIC_SCHEDULE = {
  1: { rubric: 'education', template: 'ped-carosello-edu' },    // Monday
  2: { rubric: 'people', template: 'ped-post-singolo' },        // Tuesday
  3: { rubric: 'myths', template: 'ped-post-singolo' },         // Wednesday
  4: { rubric: 'tools', template: 'ped-carosello-feature' },    // Thursday
  5: { rubric: 'world', template: 'ped-carosello-dati' },       // Friday
  6: { rubric: 'question', template: 'ped-post-singolo' },      // Saturday
  0: { rubric: 'education', template: 'ped-carosello-edu' },    // Sunday (rotation restart)
};

// GetNearMe (web) = suite AI che CREA i contenuti marketing degli immobili
// per gli agenti: staging AI (arreda stanze vuote), video AI (tour/reel da
// foto), template social pronti, avatar parlante, gestione team multi-seat.
// I contenuti editoriali parlano SOLO di questo. FUORI SCOPE: analisi zona,
// prezzi/OMI, mappa servizi, punteggio immobile, report PDF — quelle sono
// feature dell'estensione, NON del prodotto web promosso sui social.
const RUBRIC_DESCRIPTIONS = {
  education: 'Due modalita: "tips" (70%) = tutorial pratico per AGENTI IMMOBILIARI su come creare contenuti migliori con GetNearMe — arredare le foto di stanze vuote con lo staging AI, trasformare le foto in un video tour, creare post social che portano contatti, usare un avatar parlante per presentare un immobile in video. "topic" (30%) = concetto utile su marketing immobiliare digitale spiegato in modo pratico — perche il video converte piu delle foto, cos\'e il virtual staging, come funziona un avatar AI, social media per agenzie.',
  people: 'Storie di agenti — profili di agenti e agenzie che hanno rinnovato la propria presentazione degli immobili: chi e passato alle foto con staging AI, ai video tour, ai contenuti social. Come hanno cambiato il modo di mostrare gli immobili e i risultati ottenuti.',
  myths: 'Miti & Realta per Agenti — sfatare miti su marketing immobiliare e contenuti AI. "Lo staging AI si vede che e finto" "I video non servono, bastano le foto" "Le foto col telefono vanno bene" "I social non portano clienti a un\'agenzia". Risposte pratiche con esempi.',
  tools: 'GetNearMe Feature Spotlight — presenta UNA feature della suite contenuti con caso d\'uso CONCRETO per l\'agente. Non "esiste questa feature" ma "con questa feature pubblichi un annuncio molto piu attraente in 2 minuti". Step by step pratico. Features SOLO suite contenuti: staging AI (arredo virtuale stanze vuote), video AI (tour/reel da foto), template post social pronti, avatar parlante (presentazioni video), multi-seat (tutto il team con lo stesso brand). NON analisi/OMI/mappa/report PDF.',
  world: 'Marketing Immobiliare & Trend Digitali — come cambia la presentazione degli immobili, ruolo di video e social nel settore, cosa fanno le agenzie che comunicano meglio. Spunti che l\'agente puo usare nei propri contenuti, non analisi di mercato.',
  question: 'La Domanda per Agenti — domanda provocatoria su marketing, contenuti e AI nel lavoro dell\'agente. "Il video tour sostituira le foto?" "Staging AI: valorizzazione o inganno?" "I social servono davvero a un\'agenzia?" Collegata a fatti recenti.',
};

/**
 * Get all days in a given month with their rubric assignment.
 * Returns array of { date: 'YYYY-MM-DD', dayOfWeek: 0-6, rubric, template }
 */
function getMonthDays(year, month) {
  const days = [];
  const date = new Date(year, month - 1, 1);
  while (date.getMonth() === month - 1) {
    const dow = date.getDay();
    const sched = RUBRIC_SCHEDULE[dow];
    days.push({
      date: date.toISOString().split('T')[0],
      dayOfWeek: dow,
      rubric: sched.rubric,
      template: sched.template,
    });
    date.setDate(date.getDate() + 1);
  }
  return days;
}

const PROMPT_DESCRIPTION = `Tip per Agenti Immobiliari — un consiglio pratico e immediato per agenti che vogliono presentare meglio gli immobili e farsi scegliere con contenuti migliori. Regole:
- 70% operativo: come valorizzare le foto con lo staging AI, trasformare un annuncio in video, creare un post social efficace, usare un avatar per presentare un immobile, scegliere il template giusto
- 30% strategico: personal brand dell'agente, social media per agenzie, come distinguersi con contenuti curati, coerenza del brand nel team
- Alterna tra: staging foto, video, post social, avatar, presentazione immobile, brand agenzia
- Collega a trend di marketing/social recenti quando rilevante
- Consiglio specifico, actionable, che l'agente puo applicare OGGI
- Chiudi SEMPRE con CTA verso GetNearMe ("Arreda le foto con lo staging AI di GetNearMe", "Trasforma l'annuncio in video con GetNearMe")
- FUORI SCOPE: analisi zona, prezzi/OMI, mappa servizi, punteggio immobile, report PDF (sono estensione, non il prodotto social)
Esempi: "Come far sembrare nuova una stanza vuota in 1 minuto", "Perche il primo post di un immobile dovrebbe essere un video"
Esempi avanzati: "Come usare lo staging AI per ripubblicare un annuncio fermo", "Avatar parlante: presenta 10 immobili senza metterti davanti alla camera"`;

/**
 * Get days in a date range with rubric assignments.
 */
function getRangeDays(startDate, endDate) {
  const days = [];
  const d = new Date(startDate);
  const end = new Date(endDate);
  while (d <= end) {
    const dow = d.getDay();
    const sched = RUBRIC_SCHEDULE[dow];
    days.push({
      date: d.toISOString().split('T')[0],
      dayOfWeek: dow,
      rubric: sched.rubric,
      template: sched.template,
    });
    d.setDate(d.getDate() + 1);
  }
  return days;
}

/**
 * Generate editorial plan via Claude.
 * Supports both monthly (year+month) and biweekly (startDate+endDate) mode.
 * Produces 3 items per day: 1 rubric + 1 prompt + 1 video.
 * (News morning + evening are handled separately by cron.)
 *
 * @param {number} year
 * @param {number} month (1-12)
 * @param {Array} pastTopics - titles of recently published topics (to avoid repeats)
 * @param {Array} recentNews - recent news for context
 * @param {object} opts - { startDate, endDate } for biweekly mode
 * @returns {Array} topics with date, rubric, title, summary
 */
export async function generateMonthlyPlan(year, month, pastTopics = [], recentNews = [], opts = {}) {
  // Biweekly mode: use date range instead of full month
  const isBiweekly = opts.startDate && opts.endDate;
  const days = isBiweekly
    ? getRangeDays(opts.startDate, opts.endDate)
    : getMonthDays(year, month);
  const totalDays = days.length;
  const monthName = isBiweekly
    ? `${new Date(opts.startDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' })} — ${new Date(opts.endDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })}`
    : new Date(year, month - 1).toLocaleString('it-IT', { month: 'long' });

  const pastSection = pastTopics.length
    ? `\n== ARGOMENTI GIA TRATTATI (evita ripetizioni) ==\n${pastTopics.map(t => `- ${t}`).join('\n')}\n`
    : '';

  const newsSection = recentNews.length
    ? `\n== NEWS RECENTI (ultimi 30 giorni) ==
Usa queste notizie come base per contenuti PRATICI.
Per "education": se e uscito un nuovo modello/feature, fai tutorial su come usarlo concretamente.
Per "tools": se un tool ha rilasciato novita, mostra come usarlo step by step per un problema reale.
Per "people": se qualcuno e nelle news, racconta chi e e perche conta.
Per "myths": se le news generano panico o hype, sfata con fatti e esempi pratici.
Per "world": se un settore e impattato, mostra cosa cambia nella vita quotidiana delle persone.
Per "question": se una news apre dibattito, trasformala in domanda provocatoria.

${recentNews.slice(0, 60).map(n => `- [${n.source}] ${n.title}${n.summary ? ` — ${n.summary.slice(0, 150)}` : ''}`).join('\n')}\n`
    : '';

  // Load performance insights from last week (if available)
  let performanceSection = '';
  try {
    const { createClient } = await import('@supabase/supabase-js');
    const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
    const { data: latestInsight } = await sb.from('performance_insights')
      .select('insights')
      .eq('account_id', 'getnearme')
      .eq('applied', false)
      .order('week_end', { ascending: false })
      .limit(1)
      .single();

    if (latestInsight?.insights?.ai_analysis) {
      const ai = latestInsight.insights.ai_analysis;
      performanceSection = `\n== PERFORMANCE INSIGHTS (dalla settimana scorsa) ==
Le metriche mostrano:
${ai.rubric_ranking ? `- Ranking rubrica: ${ai.rubric_ranking.join(' > ')}` : ''}
${ai.best_hook_pattern ? `- Hook che funzionano: ${ai.best_hook_pattern}` : ''}
${ai.worst_pattern ? `- Da evitare: ${ai.worst_pattern}` : ''}
${ai.planner_adjustments?.increase_rubric ? `- Aumenta: ${ai.planner_adjustments.increase_rubric}` : ''}
${ai.planner_adjustments?.decrease_rubric ? `- Riduci: ${ai.planner_adjustments.decrease_rubric}` : ''}
${ai.planner_adjustments?.hook_style ? `- Stile hook: ${ai.planner_adjustments.hook_style}` : ''}
${ai.planner_adjustments?.tone_adjustment ? `- Tono: ${ai.planner_adjustments.tone_adjustment}` : ''}
USA QUESTE INFORMAZIONI per calibrare i topic di questo mese.\n`;

      // Mark as applied
      await sb.from('performance_insights')
        .update({ applied: true })
        .eq('account_id', 'getnearme')
        .eq('applied', false);
    }
  } catch (e) {
    // No insights available, continue without
  }

  const daysList = days.map(d => {
    const dayName = new Date(d.date).toLocaleString('it-IT', { weekday: 'long' });
    return `- ${d.date} (${dayName}): rubrica "${d.rubric}" — ${RUBRIC_DESCRIPTIONS[d.rubric]}`;
  }).join('\n');

  // Build list of all dates for prompts
  const allDates = days.map(d => d.date);

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-6',
    max_tokens: 16000,
    messages: [{
      role: 'user',
      content: `Sei il direttore editoriale di @getnearme_app, account Instagram/TikTok rivolto ad AGENTI IMMOBILIARI italiani. GetNearMe e una suite AI che CREA i contenuti marketing degli immobili al posto dell'agente: staging AI (arreda virtualmente le stanze vuote nelle foto), video AI (trasforma le foto in video tour/reel), template di post social pronti, avatar parlante (presenta gli immobili in video), gestione team multi-seat. Sostituisce Canva + editor video + lavoro manuale.

FUORI SCOPE (NON parlarne MAI): analisi zona, prezzi/€ al m², dati OMI, mappa servizi/trasporti/scuole, punteggio immobile, report PDF. Quelle sono feature dell'estensione Chrome, NON del prodotto promosso su questo account.

IL PUBBLICO SONO AGENTI IMMOBILIARI, NON COMPRATORI. Ogni contenuto deve parlare ALL'AGENTE: come presentare meglio gli immobili, farsi scegliere, distinguersi con contenuti curati creati in pochi minuti con l'AI.

Devi creare il piano editoriale per ${isBiweekly ? monthName : `${monthName} ${year}`}.

Ogni giorno pubblichiamo 3 post:
1. Rubrica del giorno (carosello tematico per agenti)
2. Tip per Agenti (consiglio pratico operativo)
3. Video Reel (30-45s, mascotte robot che spiega un concetto utile per agenti)

== PARTE 1: RUBRICHE (caroselli) ==
${daysList}

== DESCRIZIONE RUBRICHE ==
${Object.entries(RUBRIC_DESCRIPTIONS).map(([k, v]) => `- **${k}**: ${v}`).join('\n')}

== PARTE 2: TIP IMMOBILIARE DEL GIORNO ==
Per OGNI giorno del periodo (${totalDays} giorni: ${allDates[0]} → ${allDates[allDates.length - 1]}):
${PROMPT_DESCRIPTION}

== PARTE 3: VIDEO REEL ==
Per OGNI giorno del periodo, un video Reel/TikTok di 30-45 secondi. Una mascotte robot spiega un concetto utile per agenti immobiliari.
Tipi di video (ruota tra questi):
- Pillola: spiega un concetto che l'agente deve conoscere in 30 secondi ("Come funziona lo staging AI", "Perche il video converte piu delle foto")
- Tips rapido: trucco pratico per i contenuti dell'agente (foto, video, post social, avatar)
- Mito sfatato: sfata un mito che i clienti dicono agli agenti o che circola nel settore
- Feature GetNearMe: mostra una feature di GetNearMe utile per l'agente
- Fatto WOW: dato sorprendente sul settore immobiliare che l'agente puo usare con i clienti
- Confronto: metodi tradizionali vs digitali, portali vs social, foto normali vs staging AI
- Domanda: domanda provocatoria per agenti che genera commenti
${pastSection}${newsSection}${performanceSection}
== REGOLE ==
1. PRATICO SOPRA TUTTO. Ogni topic deve insegnare all'AGENTE a FARE qualcosa o dare info UTILE per il suo lavoro. Mai teoria astratta. L'agente deve pensare "questo lo uso domani in ufficio".
2. Per "education": regola 70/30 SETTIMANALE. ~70% "tips" (come arredare le foto con lo staging AI, come fare un video tour, come creare un post social efficace, come usare l'avatar) e ~30% "topic" (spiegazione concetto: virtual staging, video marketing immobiliare, avatar AI, social per agenzie). Specifica "difficulty" nel JSON solo per education.
3. Per "tools": UNA feature GetNearMe per post. Caso d'uso dell'agente + problema reale dell'agente + soluzione in 3 step. Features disponibili (SOLO suite contenuti): staging AI (arredo virtuale stanze vuote), video AI (tour/reel da foto), template post social pronti, avatar parlante (presentazioni video), multi-seat (team con stesso brand). MAI analisi/OMI/mappa/punteggio/report PDF.
4. Per "world": trend di marketing immobiliare e contenuti digitali che l'agente puo cavalcare nei propri post (video, social, presentazione immobili). NON analisi di mercato/prezzi.
5. Per "myths": miti che i clienti dicono agli agenti o che circolano nel settore. Risposte con dati che l'agente puo citare.
6. Per "people": storie di agenti innovativi, agenzie che usano tecnologia, figure proptech.
7. Per "question": domanda polarizzante PER AGENTI che genera commenti tra professionisti.
8. COLLEGATI ALLE NEWS RECENTI quando possibile.
9. ALMENO 30% topic collegati a news recenti.
10. VARIETA: non ripetere stessa feature GetNearMe o stessa citta in settimane consecutive.
11. Pubblico: AGENTI IMMOBILIARI italiani. Linguaggio professionale ma accessibile. Possono essere sia agenti tech-savvy che tradizionali.
12. Per i TIP: ogni tip deve essere diverso. Copri: acquisizione incarichi, presentazione immobile, gestione obiezioni, pricing, marketing, documentazione, tecnologia, social media per agenzie. Chiudi SEMPRE con CTA verso GetNearMe.
13. Per i VIDEO: ogni video e un concetto singolo utile per l'agente. Il video NON deve ripetere lo stesso argomento della rubrica o del tip dello stesso giorno.
14. CTA: ogni post deve avere un aggancio naturale a GetNearMe per l'agente ("Genera il report per il cliente con GetNearMe", "Usa lo staging AI di GetNearMe per valorizzare l'annuncio").

Rispondi SOLO con JSON valido con questa struttura:
{
  "rubrics": [
    {
      "date": "YYYY-MM-DD",
      "rubric": "education|people|myths|tools|world|question",
      "title": "Titolo specifico (max 80 char)",
      "summary": "Cosa trattare nel carosello (2-3 frasi, max 200 char)",
      "difficulty": "tips|topic (SOLO per rubric education — ometti per le altre)"
    }
  ],
  "prompts": [
    {
      "date": "YYYY-MM-DD",
      "title": "Titolo breve del tip (max 60 char)",
      "prompt_text": "Il consiglio completo (max 300 char)",
      "use_case": "Categoria: staging|video|post-social|avatar|presentazione|personal-brand|team",
      "tool": "GetNearMe"
    }
  ],
  "videos": [
    {
      "date": "YYYY-MM-DD",
      "title": "Titolo del video (max 60 char)",
      "hook": "Frase di apertura accattivante (max 80 char)",
      "summary": "Cosa spiegare nel video (2-3 frasi, max 200 char)",
      "video_type": "pillola|tips|mito|feature|fatto|confronto|domanda"
    }
  ]
}

IMPORTANTE:
- "rubrics": ${days.length} topic (uno per ogni data rubrica sopra)
- "prompts": ${totalDays} tip (uno per OGNI giorno del periodo)
- "videos": ${totalDays} video (uno per OGNI giorno del periodo)`,
    }],
  });

  await trackAnthropicCall('claude-sonnet-4-6', 'monthly_plan', response.usage);

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in monthly plan response');
  const sanitized = jsonMatch[0]
    .replace(/,\s*([}\]])/g, '$1')
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, "'");
  const plan = JSON.parse(sanitized);

  // Process rubric topics — generate slide_data matching PED template schema
  const rubricTopics = (plan.rubrics || []).map(t => {
    const dayInfo = days.find(d => d.date === t.date);
    const template = dayInfo?.template || 'ped-post-singolo';
    let slide_data;

    switch (template) {
      case 'ped-carosello-edu':
        slide_data = {
          difficulty: t.difficulty || 'tips',
          num: '5',
          title: t.title || '',
          titleHL: '',
        };
        break;
      case 'ped-carosello-feature':
        slide_data = {
          coverTitle: t.title || '',
          coverHL: '',
          noText: '', noSub: '',
          yesText: '', yesSub: '',
          cases: [],
        };
        break;
      case 'ped-carosello-dati':
        slide_data = {
          badge: 'Mercato',
          badgeColor: 'blue',
          stat: '', unit: '', delta: '',
          statLabel: '',
          title: t.title || '',
          titleHL: '',
        };
        break;
      case 'ped-post-singolo':
      default:
        slide_data = {
          badge: t.rubric === 'question' ? 'Domanda' : t.rubric === 'myths' ? 'Miti & Realtà' : 'Storie',
          badgeColor: t.rubric === 'question' ? 'amber' : 'blue',
          hook: t.title || '',
          hookHL: '',
          body: t.summary || '',
          ctaPill: 'PROVA',
          ctaHint: 'Scopri GetNearMe gratis',
        };
        break;
    }

    return {
      ...t,
      template,
      category: 'carousel',
      slide_data,
    };
  });

  // Process daily tips (was "prompts")
  const promptTopics = (plan.prompts || []).map((p, i) => ({
    date: p.date,
    rubric: 'prompt',
    title: p.title,
    summary: p.prompt_text,
    use_case: p.use_case,
    tool: p.tool,
    template: 'ped-tip',
    category: 'prompt',
    slide_data: {
      tipNum: String(i + 1),
      scenario: p.use_case || '',
      title: p.title || '',
      titleHL: '',
      body: p.prompt_text || '',
      how: 'Scopri di più su GetNearMe',
      tool: p.tool || 'GetNearMe',
      use_case: p.use_case,
      prompt_text: p.prompt_text,
    },
  }));

  // Process daily videos — rotate through specific video templates.
  // FOR NOW only the before/after slider is wired end-to-end (generate-social-video).
  // timelapse / day_night / stop_motion / particle exist as dashboard previews
  // but their video generation is not wired yet ("video gap"). Re-add them here
  // as each gets wired, so the auto-plan rotates for variety.
  // Wired video templates (generation end-to-end in generate-social-video) —
  //  one reel per day (7/week):
  //  - video_slider                  → before/after slider, Mon/Wed/Fri (3 variants)
  //  - video_timelapse               → Kling construction (scavo→casa), Tuesday
  //  - video_before_after_stopmotion → Kling stop-motion staging reveal, Thursday
  //  - video_day_night               → Kling day→night, Saturday
  //  - video_before_after_particle   → Kling particle staging reveal, Sunday
  const dow = (date) => new Date(`${date}T12:00:00`).getDay();
  const SLIDER_DOWS = new Set([1, 3, 5]);   // Mon, Wed, Fri
  const TIMELAPSE_DOW = 2;                   // Tuesday
  const STOPMOTION_DOW = 4;                  // Thursday
  const DAYNIGHT_DOW = 6;                    // Saturday
  const PARTICLE_DOW = 0;                    // Sunday
  // Before/after slider rotates through 3 transformation variants. These names
  // and the field `slider_variant` MUST match the generate-social-video edge
  // (it reads slide_data.slider_variant and generates fresh Flux photos per variant):
  //  empty_to_furnished — stanza vuota -> arredata
  //  furnished_to_empty — stanza piena -> svuotata
  //  old_to_modern      — stanza da ristrutturare -> nuovo stile moderno
  const SLIDER_VARIANTS = ['empty_to_furnished', 'furnished_to_empty', 'old_to_modern'];
  const allVideos = plan.videos || [];
  const sliderTopics = allVideos
    .filter((v) => SLIDER_DOWS.has(dow(v.date)))
    .map((v, i) => ({
      date: v.date,
      rubric: 'video',
      title: v.title,
      summary: v.summary,
      template: 'video_slider',
      category: 'video',
      video_type: v.video_type,
      hook: v.hook,
      slider_variant: SLIDER_VARIANTS[i % SLIDER_VARIANTS.length],
    }));
  const timelapseTopics = allVideos
    .filter((v) => dow(v.date) === TIMELAPSE_DOW)
    .map((v) => ({
      date: v.date,
      rubric: 'video',
      title: v.title,
      summary: v.summary,
      template: 'video_timelapse',
      category: 'video',
      video_type: v.video_type,
      hook: v.hook,
    }));
  const mkVideoTopics = (targetDow, template) => allVideos
    .filter((v) => dow(v.date) === targetDow)
    .map((v) => ({
      date: v.date,
      rubric: 'video',
      title: v.title,
      summary: v.summary,
      template,
      category: 'video',
      video_type: v.video_type,
      hook: v.hook,
    }));
  const dayNightTopics = mkVideoTopics(DAYNIGHT_DOW, 'video_day_night');
  const stopMotionTopics = mkVideoTopics(STOPMOTION_DOW, 'video_before_after_stopmotion');
  const particleTopics = mkVideoTopics(PARTICLE_DOW, 'video_before_after_particle');

  return [...rubricTopics, ...promptTopics, ...sliderTopics, ...timelapseTopics, ...stopMotionTopics, ...dayNightTopics, ...particleTopics];
}

export { RUBRIC_SCHEDULE, RUBRIC_DESCRIPTIONS, getMonthDays };
