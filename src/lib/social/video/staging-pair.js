// Generate a before/after staging pair for marketing videos.
// Before: real empty-room photo from Unsplash (free, no repeats).
// After: nano-banana (standard) edit with the SAME staging prompts the
// extension uses (sidepanel/ai-video-wizard-app.js AI_STAGING_STYLES) — verbatim.

import supabase from '../supabase.js';

const UNSPLASH_API = 'https://api.unsplash.com';
const REPLICATE_API = 'https://api.replicate.com/v1';

// Verbatim from extension AI_STAGING_STYLES (do not edit).
export const STAGING_STYLES = [
  {
    id: 'modern',
    label: 'Moderno',
    prompt: "Identifica il tipo di ambiente nella foto (soggiorno, camera, bagno, cucina, ecc.) e sostituisci OGNI mobile, oggetto e complemento con una versione moderna contemporanea dello stesso tipo. Se c'è un tavolo, metti un tavolo moderno. Se ci sono armadi, metti armadi moderni. Stile: linee pulite, palette neutra con accenti di colore, pezzi di design, illuminazione elegante. NON modificare muri, porte, finestre, soffitto, pavimento o elementi architettonici. NON cambiare il layout o aggiungere tipologie di mobili diverse. Risultato fotorealistico, 8k.",
  },
  {
    id: 'nordic',
    label: 'Nordico',
    prompt: "Identifica il tipo di ambiente nella foto (soggiorno, camera, bagno, cucina, ecc.) e sostituisci OGNI mobile, oggetto e complemento con una versione scandinava nordica dello stesso tipo. Se c'è un tavolo, metti un tavolo nordico. Se ci sono armadi, metti armadi nordici. Stile: legno chiaro di quercia/betulla, palette bianca e grigia, pezzi funzionali e minimali, tessuti in lana/lino, aspetto pulito e ordinato. NON modificare muri, porte, finestre, soffitto, pavimento o elementi architettonici. NON cambiare il layout o aggiungere tipologie di mobili diverse. Risultato fotorealistico, 8k.",
  },
  {
    id: 'industrial',
    label: 'Luxury',
    prompt: "Identifica il tipo di ambiente nella foto (soggiorno, camera, bagno, cucina, ecc.) e sostituisci OGNI mobile, oggetto e complemento con una versione luxury contemporanea di alta gamma dello stesso tipo. Se c'è un tavolo, metti un tavolo luxury. Se ci sono armadi, metti armadi luxury. Stile: marmo pregiato, travertino, ottone spazzolato, vetro fumé, noce scuro, finiture in rovere, illuminazione ambientale soffusa, texture eleganti, palette neutra di lusso, mobili minimalisti sofisticati. NON modificare muri, porte, finestre, soffitto, pavimento o elementi architettonici. NON cambiare il layout o aggiungere tipologie di mobili diverse. Risultato fotorealistico, 8k.",
  },
  {
    id: 'boho',
    label: 'Boho',
    prompt: "Identifica il tipo di ambiente nella foto (soggiorno, camera, bagno, cucina, ecc.) e sostituisci OGNI mobile, oggetto e complemento con una versione bohemian dello stesso tipo. Se c'è un tavolo, metti un tavolo boho. Se ci sono armadi, metti armadi boho. Stile: rattan, vimini, macramè, legno naturale, piante da interno, toni terrosi, juta, bambù, pattern eclettici. NON modificare muri, porte, finestre, soffitto, pavimento o elementi architettonici. NON cambiare il layout o aggiungere tipologie di mobili diverse. Risultato fotorealistico, 8k.",
  },
];

const UNSPLASH_QUERIES = [
  'empty room apartment interior',
  'empty living room interior',
  'empty bedroom interior',
  'unfurnished apartment room',
  'empty modern apartment interior',
];

/**
 * Track used Unsplash photo IDs in app_config so videos never repeat a room.
 */
async function getUsedIds() {
  const { data } = await supabase
    .from('app_config')
    .select('value')
    .eq('key', 'slider_used_photos')
    .maybeSingle();
  return new Set(data?.value?.ids || []);
}

async function markUsed(id) {
  const used = await getUsedIds();
  used.add(id);
  await supabase.from('app_config').upsert({
    key: 'slider_used_photos',
    value: { ids: [...used].slice(-500) },
  }, { onConflict: 'key' });
}

/**
 * Pick a fresh empty-room photo from Unsplash (landscape, >=1500px, unused).
 * Returns { id, url, description }.
 */
export async function pickEmptyRoomPhoto({ queryIndex = null } = {}) {
  const used = await getUsedIds();
  const query = UNSPLASH_QUERIES[queryIndex ?? Math.floor(Math.random() * UNSPLASH_QUERIES.length)];

  for (let page = 1; page <= 5; page++) {
    const res = await fetch(
      `${UNSPLASH_API}/search/photos?query=${encodeURIComponent(query)}&orientation=landscape&per_page=30&page=${page}`,
      { headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` } }
    );
    if (!res.ok) throw new Error(`Unsplash error: ${res.status}`);
    const data = await res.json();
    const photo = (data.results || []).find((p) => p.width >= 1500 && !used.has(p.id));
    if (photo) {
      // Unsplash API guidelines: trigger the download event
      fetch(`${photo.links.download_location}`, {
        headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
      }).catch(() => {});
      return {
        id: photo.id,
        url: `${photo.urls.raw}&fm=jpg&q=85&w=1600`,
        description: photo.alt_description || query,
      };
    }
    if (!data.results?.length) break;
  }
  throw new Error(`No unused Unsplash photo for "${query}"`);
}

/**
 * Run nano-banana (standard) staging edit on an image URL.
 * Returns the output image URL (replicate.delivery).
 */
export async function stageImage(imageUrl, stylePrompt) {
  const res = await fetch(`${REPLICATE_API}/models/google/nano-banana/predictions`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}`,
      'Content-Type': 'application/json',
      Prefer: 'wait=60',
    },
    body: JSON.stringify({
      input: {
        prompt: stylePrompt,
        image_input: [imageUrl],
        aspect_ratio: 'match_input_image',
        output_format: 'jpg',
      },
    }),
  });
  let pred = await res.json();

  let tries = 0;
  while (pred.status && !['succeeded', 'failed', 'canceled'].includes(pred.status) && tries < 60) {
    await new Promise((r) => setTimeout(r, 3000));
    const p = await fetch(`${REPLICATE_API}/predictions/${pred.id}`, {
      headers: { Authorization: `Bearer ${process.env.REPLICATE_API_TOKEN}` },
    });
    pred = await p.json();
    tries++;
  }
  if (pred.status !== 'succeeded') {
    throw new Error(`nano-banana ${pred.status}: ${JSON.stringify(pred.error || '').slice(0, 200)}`);
  }
  return Array.isArray(pred.output) ? pred.output[0] : pred.output;
}

/**
 * Generate a complete staging pair, uploaded to Supabase storage for stable URLs.
 * styleIndex: rotate styles deterministically (e.g. by date) or random when null.
 * Returns { beforeUrl, afterUrl, style, unsplashId, description }.
 */
export async function generateStagingPair({ styleIndex = null, datePath = 'test' } = {}) {
  const style = STAGING_STYLES[styleIndex ?? Math.floor(Math.random() * STAGING_STYLES.length)];

  // nano-banana occasionally rejects a specific photo ("Failed to generate
  // image") — retry with a different one up to 3 times.
  let photo = null;
  let afterReplicateUrl = null;
  let lastErr = null;
  for (let attempt = 0; attempt < 3 && !afterReplicateUrl; attempt++) {
    photo = await pickEmptyRoomPhoto({ queryIndex: attempt % UNSPLASH_QUERIES.length });
    try {
      afterReplicateUrl = await stageImage(photo.url, style.prompt);
    } catch (err) {
      lastErr = err;
      await markUsed(photo.id); // don't retry this photo in future runs either
    }
  }
  if (!afterReplicateUrl) throw lastErr || new Error('staging failed after 3 attempts');

  // Persist both to Supabase storage (replicate.delivery URLs expire)
  const upload = async (url, name) => {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`download ${name}: ${res.status}`);
    const buf = Buffer.from(await res.arrayBuffer());
    const path = `slider/${datePath}/${photo.id}_${name}.jpg`;
    const { error } = await supabase.storage
      .from('content')
      .upload(path, buf, { contentType: 'image/jpeg', upsert: true });
    if (error) throw new Error(`upload ${name}: ${error.message}`);
    const { data } = supabase.storage.from('content').getPublicUrl(path);
    return data.publicUrl;
  };

  const [beforeUrl, afterUrl] = await Promise.all([
    upload(photo.url, 'before'),
    upload(afterReplicateUrl, 'after'),
  ]);

  await markUsed(photo.id);

  return { beforeUrl, afterUrl, style: style.label, styleId: style.id, unsplashId: photo.id, description: photo.description };
}
