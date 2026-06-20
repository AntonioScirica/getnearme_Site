// PED content writer — fills FULL slide_data for planned PED topics.
//
// The planner (monthly-planner.js) decides the editorial plan (date, rubric,
// template, title, theme) calibrated on past performance. This writer turns
// each plan item into complete, publish-ready slide_data per the template
// schema: concise, in-scope, grammatically clean, with clean base/HL splits.
//
// Used by the biweekly cron (monthly-plan.js) so the automatic pipeline
// produces rich carousels, not empty skeletons.

import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({ apiKey: (process.env.ANTHROPIC_API_KEY || '').trim() });

// Templates the writer fills. Videos keep their light {hook,summary}.
const WRITABLE = new Set(['ped-carosello-edu', 'ped-carosello-feature', 'ped-carosello-dati', 'ped-post-singolo', 'ped-tip']);

const SCHEMAS = `
ped-carosello-edu: { "num":"5","title":"<inizio cover>","titleHL":"<fine evidenziata>","items":[{"title":"<2-3 parole>","text":"<max 12 parole>","tip":"<max 10 parole, azione con GetNearMe>"} x5],"ctaKicker":"<riga>","ctaTitle":"<max 9 parole>","ctaHL":"<2-3 parole>","badgeColor":"blue","ctaPill":"DEMO","ctaSub":"Commenta DEMO e ricevi il link per la prova gratuita.","storyHook":"<inizio>","storyHookHL":"<fine>","storySub":"<frase breve>" }
ped-carosello-feature: { "coverTitle":"<inizio, es 'Homestaging AI:'>","coverHL":"<fine>","noText":"<problema>","noSub":"<conseguenza breve>","yesText":"<con GetNearMe>","yesSub":"<beneficio breve>","cases":[{"title":"<quando>","text":"<max 9 parole>"} x3],"ctaKicker":"...","ctaTitle":"<max 9 parole>","ctaHL":"<2-3 parole>","badgeColor":"blue","ctaPill":"DEMO","ctaSub":"Commenta DEMO e ricevi il link per provare.","storyHook":"<inizio>","storyHookHL":"<fine>","storySub":"..." }
ped-carosello-dati: { "badge":"Social","badgeColor":"blue","stat":"<numero tondo>","unit":"<x o %>","delta":"<+ breve>","statLabel":"<max 10 parole>","title":"<inizio>","titleHL":"<fine>","kicker":"Perche conta","insight":"<max 16 parole, <strong>>","cardLabel":"In pratica","cardValue":"<azione breve>","valueTitle":"<inizio>","valueHL":"<fine>","actions":[{"text":"<azione>","sub":"<max 8 parole>"} x3],"ctaKicker":"...","ctaTitle":"<max 9 parole>","ctaHL":"<2-3 parole>","ctaPill":"DEMO","ctaSub":"Commenta DEMO e ricevi il link per provare.","storyHook":"<inizio>","storyHookHL":"<fine>","storySub":"..." }
ped-post-singolo: { "badge":"<Storie|Miti & Realta|Domanda|Per agenti>","badgeColor":"<blue o amber>","kicker":"<riga sopra>","hook":"<inizio frase>","hookHL":"<fine frase>","body":"<max 18 parole, <strong>>","ctaPill":"DEMO","ctaHint":"<max 9 parole>" }
ped-tip: { "tipNum":"1","scenario":"<2 parole>","title":"<inizio>","titleHL":"<fine>","body":"<max 16 parole, <strong>>","how":"<come fare, 1 frase breve>" }
`;

const RULES = `GetNearMe = suite AI che crea i contenuti marketing degli immobili: staging AI (arreda foto stanze vuote), video AI (foto -> video tour/reel), template post social, avatar parlante, gestione team multi-seat. Sostituisce Canva + editor video + lavoro manuale, costa meno della somma.
REGOLE:
- Pubblico = AGENTI immobiliari, non compratori. Parla all'agente: presentare meglio gli immobili, farsi scegliere, risparmiare tempo e soldi.
- FUORI SCOPE, NON nominare MAI: analisi zona, prezzi/OMI, mappa servizi, punteggio immobile, report PDF (sono dell'estensione).
- SINTESI: frasi corte, dritto al punto, ogni parola dà valore. Rispetta i limiti di parole degli schemi.
- GRAMMATICA italiana perfetta. Niente trattino lungo (usa virgole). Scrivi "starci davanti" non "startci".
- NIENTE RIPETIZIONI di parole o concetti dentro lo stesso post.
- MECCANICA base+HL: i campi in coppia (title/titleHL, hook/hookHL, coverTitle/coverHL, ctaTitle/ctaHL, valueTitle/valueHL, storyHook/storyHookHL) vengono concatenati "<base> <HL>". L'HL è la PARTE FINALE evidenziata della stessa frase, mai una ripetizione. La base NON deve finire con una preposizione/congiunzione/articolo (come, e, di, a, per, che, con, su, il, la...). Esempio giusto: hook="Smetti di pagare" hookHL="tre strumenti separati". La frase completa deve essere grammaticale e scorrevole.
- Numeri/percentuali plausibili e tondi, non inventare cifre troppo precise.`;

// ── base/HL split cleanup (move dangling connectors to the HL) ──
const CONN = new Set(['come', 'e', 'ed', 'o', 'oppure', 'di', 'del', 'della', 'dello', 'dei', 'degli', 'delle', 'a', 'ad', 'al', 'allo', 'alla', 'ai', 'agli', 'alle', 'per', 'che', 'con', 'su', 'in', 'nel', 'nella', 'da', 'dal', 'tra', 'fra', 'il', 'lo', 'la', 'le', 'i', 'gli', 'un', 'uno', 'una', 'ma', 'se', 'non', 'ne', 'ci', 'vi', 'si', 'anche', 'gia', 'ogni', 'tuo', 'tua', 'tuoi', 'tue', 'suo', 'sua']);
const PAIRS = [['title', 'titleHL'], ['hook', 'hookHL'], ['coverTitle', 'coverHL'], ['ctaTitle', 'ctaHL'], ['valueTitle', 'valueHL'], ['storyHook', 'storyHookHL']];
const norm = (w) => w.toLowerCase().replace(/[.,!?;:]/g, '');

function cleanSplits(sd) {
  for (const [a, h] of PAIRS) {
    if (!sd[a] || !sd[h]) continue;
    // never treat the acronym "AI" as the preposition "ai"
    let b = sd[a].trim().split(/\s+/);
    const moved = [];
    while (b.length > 1 && moved.length < 2) {
      const last = b[b.length - 1];
      if (last === 'AI' || last === 'AI:') break;
      if (!CONN.has(norm(last))) break;
      moved.unshift(b.pop());
    }
    if (moved.length) {
      sd[a] = b.join(' ');
      sd[h] = (moved.join(' ') + ' ' + sd[h].trim()).trim();
    }
  }
  return sd;
}

// ── auto coverArt for feature carousels, from theme keywords ──
function detectCoverArt(theme) {
  const t = (theme || '').toLowerCase();
  if (/staging|arreda|stanze vuote|home staging/.test(t)) return 'staging';
  if (/video|tour|reel|timelapse/.test(t)) return 'video';
  if (/avatar/.test(t)) return 'avatar';
  if (/post social|template|gallery|galleria/.test(t)) return 'post';
  if (/team|multi-seat|agenzia|agenti/.test(t)) return 'team';
  return null;
}

async function writeChunk(items) {
  const list = items.map((it, i) => `${i}) template=${it.template} | tema: ${it.theme}`).join('\n');
  const prompt = `Sei il copywriter di @getnearme_app, account per AGENTI IMMOBILIARI italiani.
${RULES}

Genera il contenuto per questi ${items.length} post, rispettando ESATTAMENTE lo schema JSON del template indicato.

${list}

SCHEMI:
${SCHEMAS}

Rispondi SOLO con JSON valido: { "posts": [ <slide_data nell'ordine 0..${items.length - 1}> ] }`;

  const res = await anthropic.messages.create({ model: 'claude-sonnet-4-6', max_tokens: 8000, messages: [{ role: 'user', content: prompt }] });
  const text = res.content[0].text;
  const m = text.match(/\{[\s\S]*\}/);
  if (!m) throw new Error('writer: no JSON');
  return JSON.parse(m[0].replace(/,\s*([}\]])/g, '$1').replace(/[‘’]/g, "'").replace(/[“”]/g, '"')).posts;
}

function chunk(arr, n) {
  const out = [];
  for (let i = 0; i < arr.length; i += n) out.push(arr.slice(i, i + n));
  return out;
}

/**
 * Fill full slide_data for an array of planner topics (in place + returned).
 * Each topic: { date, rubric, template, title, summary, ...existing slide fields }.
 * Writable templates get rich slide_data; videos/others are left as-is.
 */
export async function writePedContent(topics) {
  const writable = topics.map((t, i) => ({ i, t })).filter((x) => WRITABLE.has(x.t.template));
  for (const group of chunk(writable, 4)) {
    let slides;
    try {
      slides = await writeChunk(group.map((x) => ({ template: x.t.template, theme: `${x.t.title}. ${x.t.summary || ''}`.trim() })));
    } catch (e) {
      console.error('ped-writer chunk failed:', e.message);
      continue; // leave these topics with whatever slide_data they had
    }
    group.forEach((x, k) => {
      const sd = cleanSplits({ ...(slides[k] || {}) });
      if (x.t.template === 'ped-tip') sd.tipNum = sd.tipNum || '1';
      if (x.t.template === 'ped-carosello-feature') {
        const art = detectCoverArt(`${x.t.title} ${x.t.summary || ''}`);
        if (art) sd.coverArt = art;
      }
      // preserve planner-set fields (use_case, difficulty, video_type, etc.)
      topics[x.i].slide_data = { ...(topics[x.i].slide_data || {}), ...sd };
    });
  }
  return topics;
}
