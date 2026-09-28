import { logUsage } from '@/lib/ai'

// Gemini a quota gratuita, per i lavori di solo testo (riscrittura dell'annuncio, lettura dei dati da una pagina).
// Serve una chiave di un progetto Google SENZA fatturazione (GEMINI_FREE_API_KEY): su un progetto con fatturazione
// (quello di Nano Banana) tutto si paga. Nel SEE i termini valgono anche per la quota gratuita come per il pagamento:
// Google non usa i dati per addestrare (verificato su ai.google.dev/gemini-api/terms il 28/09/2026).
// Senza chiave, quota finita (429) o errore: null, e chi chiama passa al ripiego.
const MODEL = process.env.GEMINI_FREE_MODEL || 'gemini-2.5-flash'

export async function geminiFreeJson<T>(o: { system: string; text: string; userId: string; kind: string; maxTokens?: number }): Promise<T | null> {
  const key = process.env.GEMINI_FREE_API_KEY
  if (!key) return null
  const t0 = Date.now()
  let ok = false
  try {
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: o.system }] },
        contents: [{ role: 'user', parts: [{ text: o.text }] }],
        generationConfig: { responseMimeType: 'application/json', maxOutputTokens: o.maxTokens ?? 4000, temperature: 0.4 },
      }),
      signal: AbortSignal.timeout(60_000),
    })
    if (!r.ok) { console.error('gemini free', r.status, (await r.text()).slice(0, 300)); return null }
    const j = await r.json()
    const txt: string | undefined = j.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('')
    if (!txt) return null
    const data = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)) as T
    ok = true
    return data
  } catch (e) {
    console.error('gemini free', e)
    return null
  } finally {
    // costo 0: quota gratuita (il log serve a vedere quante chiamate e quanto ci mettono)
    await logUsage({ userId: o.userId, kind: o.kind }, false, Date.now() - t0, {}, ok, `${MODEL}-free`).catch(() => {})
  }
}
