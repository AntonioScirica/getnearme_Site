import { logUsage } from '@/lib/ai'

// Stile da una foto di riferimento, letto e scritto a parole (Gemini Flash, ~0,001 $): cosi' lo stile passa a qualsiasi
// modello di foto (GPT Image non sa usare un riferimento senza copiarne la stanza) e della foto si prende solo lo stile,
// mai la pianta o l'architettura. null se non risponde: chi chiama usa il riferimento come immagine (Nano Banana).
const MODEL = 'gemini-flash-latest' // 2.5 non e' piu' disponibile per le chiavi nuove (28/09)

export async function styleFromPhoto(image: string, userId: string): Promise<string | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  const t0 = Date.now()
  let ok = false
  try {
    const src = image.startsWith('data:') ? { mime_type: image.slice(5, image.indexOf(';')), data: image.split(',')[1] ?? '' }
      : await fetch(image, { signal: AbortSignal.timeout(20_000) }).then(async r => ({ mime_type: r.headers.get('content-type') || 'image/jpeg', data: Buffer.from(await r.arrayBuffer()).toString('base64') }))
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, signal: AbortSignal.timeout(30_000),
      body: JSON.stringify({
        contents: [{ parts: [{ inline_data: src }, { text: 'Describe only the interior design style of this photo so that a designer can furnish a different room in the same style: style name, furniture types and shapes, materials and finishes, color palette, fabrics, lighting fixtures, decor and mood. Do not describe the room layout, walls, windows, floor plan or camera. One paragraph, max 90 words, English, no preamble.' }] }],
        generationConfig: { maxOutputTokens: 2000, temperature: 0.2 },
      }),
    })
    const j = await r.json() as { candidates?: { content?: { parts?: { text?: string }[] } }[] }
    const txt = j.candidates?.[0]?.content?.parts?.map(p => p.text ?? '').join('').trim()
    ok = !!txt
    return txt || null
  } catch (e) {
    console.error('stile da foto', e)
    return null
  } finally {
    await logUsage({ userId, kind: 'stile_da_foto' }, false, Date.now() - t0, {}, ok, MODEL).catch(() => {})
  }
}
