// Casa 3D: lettura semantica della planimetria ORIGINALE con Gemini Flash (una chiamata, ~0,01-0,02 $). Niente ridisegno:
// il modello guarda la pianta vera e restituisce stanze con il nome scritto, mq e H scritti, collegamenti tra stanze
// (porte, varchi, ingresso), finestre, scale con verso e piano di arrivo, esterni (resede, corte, giardino, terrazzo,
// "a comune") e dubbi come domande si'/no. Prove del 06/10 (spike-plan-read): nomi, porte e scale buoni; misure in metri
// e poligoni su piante ruotate o sbiadite imprecisi, quindi la geometria resta della pipeline (semantic.ts).
import sharp from 'sharp'
import { logUsage } from '@/lib/ai'
import type { PlanRead, Pt, ReadLink } from './types'

const MODEL = process.env.CASA3D_READ_MODEL || 'gemini-3.8-flash'
// listino Gemini Flash (stima per milione di token, i token di ragionamento si pagano come uscita)
const USD = { input: 0.5, output: 3 }

export const READ_PROMPT = `You are reading an Italian floor plan of ONE dwelling (often a cadastral "planimetria catastale", scanned, black and white; sometimes an agency plan). Coordinates: integers 0-1000, x from the left edge, y from the top edge of THIS image (not of the paper sheet).
Return JSON only, with these keys:
- kind: "catastale" | "agenzia" | "altro"
- floor: floor name as written (e.g. "PIANO TERRA", "P.1") or null
- rooms: every enclosed space of the dwelling, also tiny ones (disimpegno, ripostiglio, W.C., cantina). Never split one room in two because of furniture or text; a kitchen with a pier or a half wall is still one room. For each: id (short, "r1", "r2"...), name (exact text written inside it, "" if none), type (soggiorno|cucina|camera|cameretta|bagno|ingresso|corridoio|ripostiglio|cantina|lavanderia|studio|scala|balcone|terrazzo|loggia|garage|altro), poly [[x,y],...] following the INNER face of its walls, mq (area written for it, number, or null), h (ceiling height written like H=2,70 or h 2.50, or null), conf 0-1.
- links: every door or opening between two spaces. In cadastral plans an interior door is a GAP in the wall, often with small thin cross ticks at the jambs, sometimes closed by a thin line: it is a door, never a wall. For each: x, y (centre of the gap), w (gap length, same 0-1000 units, or null), between [room id or "fuori", room id or "fuori"], kind ("ingresso" = main entrance of the dwelling from outside or the common stairs | "porta" | "varco" = wide opening without door | "portafinestra" = glazed door to a balcony, terrace or garden), conf.
- windows: gap in an EXTERIOR wall closed by thin line(s): x, y, room (room id), conf.
- stairs: every flight of steps drawn, inside or outside the dwelling: poly (the drawn steps and landing), inside (true if inside the dwelling walls), arrow (direction in degrees of the "up" arrow or of the walking line if drawn, 0 = right, 90 = down; null if none), goes ("su" | "giu" | null: up or down from the floor shown), from (room id or "fuori" where it starts on this floor), to (room id, "fuori", or the name of a floor/space that is NOT drawn here, e.g. "primo piano", "cantina"), missing_floor (true if it leads to a floor or space not drawn on this image), conf.
- outdoor: resede / corte / cortile / giardino / terrazzo / balcone / loggia / portico areas: label (as written, "" if none), type (resede|corte|cortile|giardino|terrazzo|balcone|loggia|portico|altro), poly, shared (true if written "a comune", "comune", "condominiale" or BCNC; false if "esclusivo"/"privato"; null if not written), ours (true/false/null: part of this dwelling).
- doubts: up to 6 short questions IN ITALIAN, each answerable with yes or no, about things a person should confirm (e.g. "Questa apertura tra cucina e cantina e' una porta?", "La scala porta a un piano non disegnato?"): {q, x, y}.`

const num = (v: unknown, lo = -1e9, hi = 1e9): number | null => (typeof v === 'number' && Number.isFinite(v) && v >= lo && v <= hi ? v : null)
const str = (v: unknown, n = 60) => (typeof v === 'string' ? v.trim().slice(0, n) : '')
const poly = (v: unknown): Pt[] => (Array.isArray(v) ? v.filter(q => Array.isArray(q) && q.length >= 2 && num(q[0], -50, 1050) !== null && num(q[1], -50, 1050) !== null).map(q => [q[0], q[1]] as Pt).slice(0, 80) : [])
const arr = (v: unknown): Record<string, unknown>[] => (Array.isArray(v) ? v.filter(x => x && typeof x === 'object') as Record<string, unknown>[] : [])
const LINK_KINDS = new Set(['ingresso', 'porta', 'varco', 'portafinestra'])

// risposta del modello -> lettura pulita (valori fuori scala o tipi strani si scartano)
export function cleanRead(j: Record<string, unknown>): PlanRead {
  const rooms = arr(j.rooms).map((r, i) => ({ id: str(r.id, 12) || `r${i + 1}`, name: str(r.name ?? r.name_as_written), type: str(r.type, 20).toLowerCase() || 'altro', poly: poly(r.poly ?? r.polygon), mq: num(r.mq ?? r.written_mq, 0.5, 500), h: num(r.h ?? r.written_h, 1.8, 6), conf: num(r.conf ?? r.confidence, 0, 1) ?? 0.5 })).filter(r => r.poly.length >= 3).slice(0, 60)
  const links = arr(j.links ?? j.doors).map(d => {
    const b = Array.isArray(d.between) ? d.between.map(x => (x === 'outside' ? 'fuori' : String(x).slice(0, 12))) : []
    return { x: num(d.x, 0, 1000), y: num(d.y, 0, 1000), w: num(d.w ?? d.width_px_0_1000, 1, 400), between: [b[0] ?? 'fuori', b[1] ?? 'fuori'] as [string, string], kind: (LINK_KINDS.has(String(d.kind)) ? d.kind : 'porta') as ReadLink['kind'], conf: num(d.conf ?? d.confidence, 0, 1) ?? 0.5 }
  }).filter((d): d is ReadLink => d.x !== null && d.y !== null).slice(0, 80)
  const windows = arr(j.windows).map(w => ({ x: num(w.x, 0, 1000), y: num(w.y, 0, 1000), room: str(w.room ?? w.room_id, 12), conf: num(w.conf ?? w.confidence, 0, 1) ?? 0.5 })).filter((w): w is { x: number; y: number; room: string; conf: number } => w.x !== null && w.y !== null).slice(0, 80)
  const stairs = arr(j.stairs).map(s => ({ poly: poly(s.poly ?? s.polygon), inside: s.inside === true || s.inside_dwelling === true, arrow: num(s.arrow ?? s.arrow_direction_deg, -360, 360), goes: (s.goes === 'su' || s.goes === 'giu' ? s.goes : null) as 'su' | 'giu' | null, from: str(s.from, 30) || null, to: str(s.to, 30) || null, missing_floor: s.missing_floor === true, conf: num(s.conf ?? s.confidence, 0, 1) ?? 0.5 })).filter(s => s.poly.length >= 3).slice(0, 10)
  const outdoor = arr(j.outdoor ?? j.outdoor_areas).map(o => ({ label: str(o.label ?? o.label_as_written), type: str(o.type, 20).toLowerCase() || 'altro', poly: poly(o.poly ?? o.polygon), shared: typeof o.shared === 'boolean' ? o.shared : null, ours: typeof (o.ours ?? o.belongs_to_dwelling) === 'boolean' ? (o.ours ?? o.belongs_to_dwelling) as boolean : null })).filter(o => o.poly.length >= 3).slice(0, 12)
  const doubts = arr(j.doubts).map(d => ({ q: str(d.q ?? d.question, 160), x: num(d.x, 0, 1000) ?? 500, y: num(d.y, 0, 1000) ?? 500 })).filter(d => d.q).slice(0, 8)
  return { kind: str(j.kind, 20) || 'altro', floor: str(j.floor, 40) || null, rooms, links, windows, stairs, outdoor, doubts }
}

// Una chiamata sull'immagine originale (ritagliata, la stessa delle coordinate toImage della pianta). null se manca la
// chiave, il modello non risponde o il JSON non si legge: la pipeline va avanti come prima.
export async function readPlan(image: Buffer, userId: string): Promise<{ read: PlanRead; ms: number; usd: number; model: string } | null> {
  const key = process.env.GEMINI_API_KEY
  if (!key) return null
  const t0 = Date.now()
  let ok = false, tk = { input: 0, output: 0 }
  try {
    const img = await sharp(image).rotate().flatten({ background: '#ffffff' }).resize(1600, 1600, { fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 90 }).toBuffer()
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key }, signal: AbortSignal.timeout(120_000),
      body: JSON.stringify({
        contents: [{ parts: [{ inline_data: { mime_type: 'image/jpeg', data: img.toString('base64') } }, { text: READ_PROMPT }] }],
        generationConfig: { responseMimeType: 'application/json', temperature: 0.2, mediaResolution: 'MEDIA_RESOLUTION_HIGH' },
      }),
    })
    if (!r.ok) { console.error('casa3d lettura', r.status, (await r.text()).slice(0, 300)); return null }
    const j = await r.json() as { candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] } }[]; usageMetadata?: { promptTokenCount?: number; candidatesTokenCount?: number; thoughtsTokenCount?: number } }
    const u = j.usageMetadata ?? {}
    tk = { input: u.promptTokenCount ?? 0, output: (u.candidatesTokenCount ?? 0) + (u.thoughtsTokenCount ?? 0) }
    const txt = (j.candidates?.[0]?.content?.parts ?? []).filter(p => !p.thought).map(p => p.text ?? '').join('')
    const read = cleanRead(JSON.parse(txt.slice(txt.indexOf('{'), txt.lastIndexOf('}') + 1)))
    ok = read.rooms.length > 0
    return ok ? { read, ms: Date.now() - t0, usd: usdOf(tk), model: MODEL } : null
  } catch (e) {
    console.error('casa3d lettura', e)
    return null
  } finally {
    await logUsage({ userId, kind: 'casa3d_lettura' }, false, Date.now() - t0, { ...tk, usd: usdOf(tk) }, ok, MODEL).catch(() => {})
  }
}
const usdOf = (tk: { input: number; output: number }) => Math.round((tk.input * USD.input + tk.output * USD.output) / 1e6 * 1e4) / 1e4
