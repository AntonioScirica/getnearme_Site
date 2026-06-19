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
  1: { rubric: 'education', template: 'pop' },    // Monday
  2: { rubric: 'people', template: 'pop' },        // Tuesday
  3: { rubric: 'myths', template: 'pop' },         // Wednesday
  4: { rubric: 'tools', template: 'pop' },          // Thursday
  5: { rubric: 'world', template: 'pop' },          // Friday
  6: { rubric: 'question', template: 'pop' },       // Saturday
  0: { rubric: 'education', template: 'pop' },      // Sunday (rotation restart)
};

const RUBRIC_DESCRIPTIONS = {
  education: 'Due modalita: "tips" (70%) = tutorial pratico su COME usare AI — email, lavoro, studio, creativita con ChatGPT/Claude/Gemini, step-by-step immediato. "topic" (30%) = spiegazione di un concetto AI — cosa sono gli agenti, come funziona il RAG, physical AI, LLM, cobot, ecc. — spiegato in modo semplice.',
  people: 'Chi c\'e Dietro — profili di persone chiave nell\'AI collegati a fatti recenti. La loro storia, cosa hanno fatto, perche conta ORA.',
  myths: 'Miti & Realta — sfatare miti pratici sull\'AI. "ChatGPT ti spia?" "L\'AI capisce davvero quello che scrivi?" Risposte concrete con esempi.',
  tools: 'Tool del Giorno — presenta un tool AI con caso d\'uso CONCRETO. Non "esiste questo tool" ma "con questo tool fai X in 2 minuti". Screenshot mentali, step by step.',
  world: 'AI nella Vita Reale — come l\'AI cambia cose pratiche: come cerchi lavoro, come studi, come risparmi, come crei contenuti. Esempi reali, non teoria.',
  question: 'La Domanda — domanda provocatoria che genera dibattito nei commenti. Collegata a fatti recenti quando possibile.',
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

const PROMPT_DESCRIPTION = `Prompt del Giorno — un prompt pronto da copiare per risolvere un problema reale. Regole:
- 70% nabbo: email, lavoro, studio, creatività, produttività quotidiana
- 30% tech: prompt engineering avanzato, API, automazioni, tool nuovi
- Ruota i tool: ChatGPT, Claude, Gemini, Perplexity (non solo ChatGPT!)
- Collega a news recenti quando c'è un tool nuovo o feature rilevante
- Prompt completo, specifico, con [placeholder] chiari
Esempi nabbo: "Riscrivi email difficile in tono professionale", "Schema studio per esame di [materia]"
Esempi tech: "System prompt per assistente specializzato in [dominio]", "Chain of thought per analisi dati"`;

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
    model: 'claude-sonnet-4-20250514',
    max_tokens: 16000,
    messages: [{
      role: 'user',
      content: `Sei il direttore editoriale di @getnearme_app, account Instagram/TikTok di divulgazione AI in italiano per un pubblico non tecnico.

Devi creare il piano editoriale per ${isBiweekly ? monthName : `${monthName} ${year}`}.

Ogni giorno pubblichiamo 5 post:
1. News Mattina (automatico, non devi generarlo)
2. News Sera (automatico, non devi generarlo)
3. Rubrica del giorno (carosello tematico)
4. Prompt del Giorno (un prompt pronto da copiare)
5. Video Reel (30-45s, mascotte robot che spiega un concetto AI)

Tu devi generare i punti 3, 4 e 5.

== PARTE 1: RUBRICHE (caroselli) ==
${daysList}

== DESCRIZIONE RUBRICHE ==
${Object.entries(RUBRIC_DESCRIPTIONS).map(([k, v]) => `- **${k}**: ${v}`).join('\n')}

== PARTE 2: PROMPT DEL GIORNO ==
Per OGNI giorno del periodo (${totalDays} giorni: ${allDates[0]} → ${allDates[allDates.length - 1]}):
${PROMPT_DESCRIPTION}

== PARTE 3: VIDEO REEL ==
Per OGNI giorno del periodo, un video Reel/TikTok di 30-45 secondi. Una mascotte robot spiega un concetto AI in modo semplice.
Tipi di video (ruota tra questi):
- Pillola AI: spiega un concetto in 30 secondi ("Cos'e un LLM", "Come funziona il training")
- Tips rapido: trucco pratico per usare ChatGPT/Claude/Midjourney
- Mito sfatato: sfata un mito comune sull'AI in modo rapido
- Tool in 30s: presenta un tool AI con un caso d'uso pratico
- Fatto WOW: fatto sorprendente sull'AI
- Confronto: ChatGPT vs Claude, Midjourney vs DALL-E, ecc.
- Domanda: domanda provocatoria che genera commenti
${pastSection}${newsSection}${performanceSection}
== REGOLE ==
1. PRATICO SOPRA TUTTO. Ogni topic deve insegnare a FARE qualcosa o dare info UTILE subito. Mai teoria astratta. Il lettore deve pensare "questo lo provo subito".
2. Per "education": regola 70/30 SETTIMANALE. In una settimana tipo: 1-2 giorni education, di cui ~70% "tips" (come fare X con AI, tutorial pratico passo-passo) e ~30% "topic" (spiegazione concetto AI: cosa sono gli agenti, physical AI, cobot, RAG, ecc.). Usa difficulty "tips" o "topic". Mai theory pura senza applicazione pratica. Specifica "difficulty" nel JSON solo per education.
3. Per "tools": caso d'uso specifico. Tool reale + problema reale + soluzione in 3 step.
4. Per "world": impatto pratico sulla vita quotidiana.
5. Per "myths": risposta pratica con fatti e esempi.
6. Per "people": collegato a fatti recenti.
7. Per "question": domanda che genera commenti.
8. COLLEGATI ALLE NEWS RECENTI quando possibile.
9. ALMENO 50% topic collegati a news recenti.
10. VARIETA: non ripetere stesso tool/azienda/persona in settimane consecutive.
11. Pubblico: italiano, non tecnico, curioso. Zero paroloni.
12. Per i PROMPT: ogni prompt deve essere diverso. Copri: email, studio, lavoro, social, scrittura, coding, analisi, creativita, produttivita, salute. Il prompt deve essere COMPLETO e pronto da incollare in ChatGPT/Claude.
13. Per i VIDEO: ogni video e un concetto singolo, spiegato in modo ultra-semplice. Il video NON deve ripetere lo stesso argomento della rubrica o del prompt dello stesso giorno.

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
      "title": "Titolo breve del prompt (max 60 char)",
      "prompt_text": "Il prompt completo pronto da copiare (max 300 char)",
      "use_case": "Categoria: email|studio|lavoro|social|scrittura|coding|analisi|creativita|produttivita",
      "tool": "ChatGPT|Claude|Gemini|Perplexity (ruota equamente)"
    }
  ],
  "videos": [
    {
      "date": "YYYY-MM-DD",
      "title": "Titolo del video (max 60 char)",
      "hook": "Frase di apertura accattivante (max 80 char)",
      "summary": "Cosa spiegare nel video (2-3 frasi, max 200 char)",
      "video_type": "pillola|tips|mito|tool|fatto|confronto|domanda"
    }
  ]
}

IMPORTANTE:
- "rubrics": ${days.length} topic (uno per ogni data rubrica sopra)
- "prompts": ${totalDays} prompt (uno per OGNI giorno del periodo)
- "videos": ${totalDays} video (uno per OGNI giorno del periodo)`,
    }],
  });

  await trackAnthropicCall('claude-sonnet-4-20250514', 'monthly_plan', response.usage);

  const text = response.content[0].text;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON in monthly plan response');
  const plan = JSON.parse(jsonMatch[0]);

  // Process rubric topics
  const rubricTopics = (plan.rubrics || []).map(t => {
    const dayInfo = days.find(d => d.date === t.date);
    return {
      ...t,
      template: dayInfo?.template || 'pop',
      category: 'carousel',
      slide_data: t.rubric === 'education' && t.difficulty
        ? { difficulty: t.difficulty }
        : undefined,
    };
  });

  // Process daily prompts
  const promptTopics = (plan.prompts || []).map(p => ({
    date: p.date,
    rubric: 'prompt',
    title: p.title,
    summary: p.prompt_text,
    use_case: p.use_case,
    tool: p.tool,
    template: 'pop',
    category: 'prompt',
    slide_data: { tool: p.tool || 'ChatGPT', use_case: p.use_case, prompt_text: p.prompt_text },
  }));

  // Process daily videos — rotate through specific video templates
  const VIDEO_TEMPLATES = [
    'video_slider',
    'video_timelapse',
    'video_day_night',
    'video_before_after_stopmotion',
    'video_before_after_particle',
  ];
  const videoTopics = (plan.videos || []).map((v, i) => ({
    date: v.date,
    rubric: 'video',
    title: v.title,
    summary: v.summary,
    template: VIDEO_TEMPLATES[i % VIDEO_TEMPLATES.length],
    category: 'video',
    video_type: v.video_type,
    hook: v.hook,
  }));

  return [...rubricTopics, ...promptTopics, ...videoTopics];
}

export { RUBRIC_SCHEDULE, RUBRIC_DESCRIPTIONS, getMonthDays };
