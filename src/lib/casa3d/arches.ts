// Casa 3D: archi tra le stanze. In planimetria non si vedono, vengono dalle FOTO dell'immobile: UNA chiamata Gemini Flash
// (~0,005-0,01 $) con la pianta originale con i passaggi interni numerati e al massimo 5 foto interne della zona giorno.
// Domanda: ci sono aperture ad arco? quali numeri della pianta? Il risultato va sui passaggi (opening.shape = 'arch',
// tipo varco: un arco non ha porta). Archi visti ma numeri non indicati: arco su tutti i passaggi senza porta larghi
// almeno 90 cm della zona giorno (guessed). L'agente li cambia uno per uno nella correzione.
import sharp from 'sharp'
import { logUsage } from '@/lib/ai'
import { openingSides } from './build'
import type { RawOpening, RawPlan } from './types'

const MODEL = process.env.CASA3D_READ_MODEL || 'gemini-3.8-flash'
const USD = { input: 0.5, output: 3 }
const DAY = new Set(['soggiorno', 'ingresso', 'corridoio', 'cucina', 'studio'])
const NIGHT = new Set(['bagno', 'ripostiglio', 'scala', 'balcone', 'terrazzo', 'giardino', 'cortile', 'esterno'])

// foto interne della zona giorno (classificazione gia' fatta in import_data.rooms), al massimo 5
export function archPhotos(photos: string[], cls: Record<string, { scene?: string; room?: string }>, max = 5): string[] {
  const rank = (u: string) => { const r = cls[u]?.room ?? ''; return ['soggiorno', 'sala', 'openspace', 'ingresso', 'corridoio'].includes(r) ? 0 : r === 'cucina' || r === 'studio' ? 1 : r ? 3 : 2 }
  return photos.filter(u => cls[u]?.scene === 'interno' && !/planimetri/i.test(u)).sort((a, b) => rank(a) - rank(b)).filter(u => rank(u) < 3).slice(0, max)
}

// passaggi interni candidati: porte e varchi tra due stanze di casa (non bagni, ripostigli, scale), almeno 60 cm
export function candidates(raw: RawPlan) {
  return raw.openings.map((o, i) => ({ o, i, s: openingSides(raw, o) })).filter(({ o, s }) => (o.type === 'door' || o.type === 'varco') && o.width >= 0.6 && s[0] && s[1] && s[0].id !== s[1].id && !NIGHT.has(s[0].type) && !NIGHT.has(s[1].type))
}

// answer: risposta gia' avuta (prove senza rifare la chiamata)
type Answer = { arches_seen?: boolean; openings?: unknown[]; conf?: number }
export async function readArches(raw0: RawPlan, original: Buffer, photos: string[], userId: string, answer?: Answer): Promise<RawPlan> {
  const key = process.env.GEMINI_API_KEY
  const cands = candidates(raw0)
  if ((!key || !photos.length) && !answer) return raw0
  if (!cands.length) return raw0
  const t0 = Date.now()
  let ok = false, tk = { input: 0, output: 0 }
  try {
    // pianta con i numeri dei passaggi (stessa misura della pianta: toImage)
    const { imgW: W, imgH: H, toImage: T } = raw0.source
    const marks = cands.map(({ o }, k) => {
      const mx = (o.a[0] + o.b[0]) / 2, mz = (o.a[1] + o.b[1]) / 2, x = T[0] * mx + T[2] * mz + T[4], y = T[1] * mx + T[3] * mz + T[5]
      return `<circle cx="${x}" cy="${y}" r="${W / 45}" fill="#e5484d"/><text x="${x}" y="${y + W / 110}" font-size="${W / 32}" font-family="Arial" font-weight="bold" fill="#fff" text-anchor="middle">${k + 1}</text>`
    }).join('')
    const base = await sharp(original).rotate().flatten({ background: '#ffffff' }).resize(W, H, { fit: 'fill' }).png().toBuffer()
    const marked = await sharp(base).composite([{ input: Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${marks}</svg>`) }]).png().toBuffer()
    const plan = await sharp(marked).resize(1200, 1200, { fit: 'inside' }).jpeg({ quality: 85 }).toBuffer()
    let a: Answer
    if (answer) a = answer
    else {
      if (!key) return raw0
      const imgs = (await Promise.all(photos.slice(0, 5).map(async u => {
        try { const b = Buffer.from(await (await fetch(u, { signal: AbortSignal.timeout(15000) })).arrayBuffer()); return (await sharp(b).rotate().resize(768, 768, { fit: 'inside' }).jpeg({ quality: 78 }).toBuffer()).toString('base64') } catch { return null }
      }))).filter((x): x is string => !!x)
      if (!imgs.length) return raw0
      const text = `Image 1 is the floor plan of an Italian home, with the interior passages between rooms marked by red numbered dots (1-${cands.length}). The other images are photos of the same home.
Look at the photos: are there ARCHED openings between rooms (passages with a round or segmental arched top, no door)? Doors with a rectangular frame are not arches.
If yes, using the room layout, the photos and the plan, say which numbered passages are arches.
Reply only with JSON: {"arches_seen": true|false, "openings": [numbers of the arched passages, empty if you cannot tell], "rooms": [["room","room"], ...] (Italian room names joined by each arch you see), "conf": 0-1}`
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, signal: AbortSignal.timeout(90_000),
        body: JSON.stringify({
          contents: [{ parts: [{ inline_data: { mime_type: 'image/jpeg', data: plan.toString('base64') } }, ...imgs.map(data => ({ inline_data: { mime_type: 'image/jpeg', data } })), { text }] }],
          generationConfig: { responseMimeType: 'application/json', temperature: 0.1 },
        }),
      })
      if (!r.ok) { console.error('casa3d archi', r.status, (await r.text()).slice(0, 300)); return raw0 }
      const j = await r.json() as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[]; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number } }
      const u = j.usageMetadata ?? {}
      tk = { input: u.promptTokenCount ?? 0, output: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0) }
      const txt = (j.candidates?.[0]?.content?.parts ?? []).filter(p => !p.thought).map(p => p.text ?? '').join('')
      a = JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)) as Answer
    }
    ok = true
    const usd = usdOf(tk)
    const raw: RawPlan = JSON.parse(JSON.stringify(raw0))
    if (!a.arches_seen || (a.conf ?? 1) < 0.5) { raw.arches = { seen: false, set: 0, guessed: false, usd }; return raw }
    const nums = (a.openings ?? []).map(Number).filter(n => Number.isInteger(n) && n >= 1 && n <= cands.length)
    let pick: number[] = nums.map(n => cands[n - 1].i), guessed = false
    if (!pick.length) {
      // archi visti ma non mappati: i passaggi senza porta larghi della zona giorno
      pick = cands.filter(({ o, s }) => o.type === 'varco' && o.width >= 0.9 && (DAY.has(s[0]!.type) || DAY.has(s[1]!.type))).map(c => c.i)
      guessed = true
    }
    // il varco disegnato e' spesso piu' largo della porta riconosciuta: l'arco prende la luce vera del disegno
    const { data: gray } = await sharp(base).grayscale().raw().toBuffer({ resolveWithObject: true })
    const ink = (x: number, z: number) => { const px = Math.round(T[0] * x + T[2] * z + T[4]), py = Math.round(T[1] * x + T[3] * z + T[5]); return px >= 0 && py >= 0 && px < W && py < H && gray[py * W + px] < 90 } // nero pieno: le linee sottili e grigie del varco non sono muro
    for (const i of pick) { setArch(raw.openings[i], true); widen(raw.openings[i], ink) }
    raw.arches = { seen: true, set: pick.length, guessed, usd }
    return raw
  } catch (e) {
    console.error('casa3d archi', e)
    return raw0
  } finally {
    if (!answer) await logUsage({ userId, kind: 'casa3d_archi' }, false, Date.now() - t0, { ...tk, usd: usdOf(tk) }, ok, MODEL).catch(() => {})
  }
}

// luce del varco sul disegno: dal centro verso i due lati finche' tornano le due facce del muro (3 punti di fila);
// almeno la larghezza riconosciuta, al massimo 2,2 m
function widen(o: RawOpening, ink: (x: number, z: number) => boolean) {
  const L = Math.hypot(o.b[0] - o.a[0], o.b[1] - o.a[1]); if (!L) return
  const d = [(o.b[0] - o.a[0]) / L, (o.b[1] - o.a[1]) / L], n = [-d[1], d[0]], c = [(o.a[0] + o.b[0]) / 2, (o.a[1] + o.b[1]) / 2], h = Math.max(0.03, o.t / 2 - 0.03)
  const wallAt = (s: number) => [h, -h].every(k => [-0.01, 0, 0.01].some(e => ink(c[0] + d[0] * s + n[0] * (k + e), c[1] + d[1] * s + n[1] * (k + e))))
  const reach = (sg: number) => { let run = 0; for (let s = 0.2; s <= 1.1; s += 0.02) { if (wallAt(sg * s)) { if (++run >= 3) return s - 0.04 } else run = 0 } return null }
  const r1 = reach(1), r0 = reach(-1)
  if (r0 === null || r1 === null) return
  const w = r0 + r1
  if (w <= o.width + 0.05 || w > 2.2) return
  const mid = (r1 - r0) / 2, r3 = (v: number) => Math.round(v * 1000) / 1000
  o.a = [r3(c[0] + d[0] * (mid - w / 2)), r3(c[1] + d[1] * (mid - w / 2))]; o.b = [r3(c[0] + d[0] * (mid + w / 2)), r3(c[1] + d[1] * (mid + w / 2))]; o.width = r3(w)
}

// arco si'/no su un passaggio: un arco non ha porta (varco); tolto l'arco resta un passaggio senza porta
export function setArch(o: RawOpening, on: boolean) {
  if (on) { o.shape = 'arch'; o.type = 'varco'; o.suspect = false } else delete o.shape
}
const usdOf = (tk: { input: number; output: number }) => Math.round((tk.input * USD.input + tk.output * USD.output) / 1e6 * 1e4) / 1e4
