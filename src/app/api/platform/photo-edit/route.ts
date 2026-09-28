import { NextRequest, NextResponse } from 'next/server'
import { buildStagingPrompt, roomKey, variantText, isRestyle, isFurnishing, roomLabel, STYLE_LOOK, type SceneType } from '@/lib/stagingPrompts'
import { gptImage } from '@/lib/gptImage'
import { stagePrompt, markedCopy, zonePrompt } from '@/lib/nanoBanana'
import { canAfford, spend, type Action } from '@/lib/credits'
import { CREDIT_COST, FREE_EDITS } from '@/lib/pricing'
import { brighten } from '@/lib/brighten'
import { finish } from '@/lib/finish'
import { createClient } from '@supabase/supabase-js'
import { uploadJpeg, uploadMarker } from '@/lib/r2'
import { alignTo } from '@/lib/align'
import { styleFromPhoto } from '@/lib/styleFromPhoto'
import sharp from 'sharp'
import { AI_MOCK, mockDelay } from '@/lib/aiMock'
import { allowedUrl } from '@/lib/runpodImage'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export const runtime = 'nodejs'
export const maxDuration = 300

// "Sistema con AI": modifica una foto con GPT Image 2.5 Sunburst (OpenAI diretto, lib/gptImage).
// Risultato salvato su R2, costo in ai_usage.
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  const userId = data.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  // Foto: URL (annunci, R2) oppure caricata dal computer (imageBase64, data URL gia' ridimensionata).
  // Modifica: testo libero e/o i preset di home staging (stile, vista, scena, planimetria).
  let body: { edits?: number; imageUrl?: string; imageBase64?: string; prompt?: string; style?: string; angle?: string; scene?: SceneType; planimetria?: boolean; seed?: number; region?: { x: number; y: number; w: number; h: number; poly?: { x: number; y: number }[] }; projectId?: string; room?: string; variant?: number; preview?: boolean; reference?: string; styleRef?: string; points?: { x: number; y: number }[]; density?: string }
  try { body = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const imageUrl = typeof body.imageUrl === 'string' ? body.imageUrl : ''
  const imageBase64 = typeof body.imageBase64 === 'string' && /^data:image\/(jpeg|png|webp);base64,/.test(body.imageBase64) && body.imageBase64.length < 8_000_000 ? body.imageBase64 : ''
  const custom = typeof body.prompt === 'string' ? body.prompt.trim().slice(0, 1000) : ''
  const scene: SceneType = body.scene === 'esterno' || body.scene === 'giardino' ? body.scene : 'interno'
  const hasPreset = !!(body.style || body.angle || body.planimetria)
  if ((!custom && !hasPreset) || (!imageBase64 && !allowedUrl(imageUrl))) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  // Altra versione: una combinazione di palette e materiali diversa (solo stili e richieste di arredo, non viste)
  // -1 = scegli tu una variante a caso
  // ogni arredo e' una versione nuova (combinazione di materiali e colori a caso), anche dal chip dello stile o dal testo:
  // prima solo "Altra versione" cambiava davvero, cliccando di nuovo lo stile veniva simile
  const imgOk = (x: unknown): x is string => typeof x === 'string' && ((/^data:image\/(jpeg|png|webp);base64,/.test(x) && x.length < 8_000_000) || allowedUrl(x))
  // foto di stile: ogni richiesta diventa arredo nello stile di quella foto (chip, testo o solo la foto)
  const styleRef = imgOk(body.styleRef) ? body.styleRef : undefined
  const furnishReq = !!styleRef && (body.scene ?? 'interno') === 'interno' && !body.angle && !body.planimetria && body.style !== 'empty' || isFurnishing({ style: body.style, customPrompt: custom, angle: body.angle, planimetria: body.planimetria, scene: body.scene === 'esterno' || body.scene === 'giardino' ? body.scene : 'interno', restyle: isRestyle(custom) })
  const variantN = typeof body.variant === 'number' && body.variant > 0 ? body.variant : body.variant === -1 || furnishReq ? 1 + Math.floor(Math.random() * 100000) : 0
  const vary = variantN > 0 && !body.angle ? ` ${variantText(body.style, variantN)}` : ''
  const roomK = roomKey(typeof body.room === 'string' ? body.room : '')
  const restyle = isRestyle(custom) // "balcone stile moderno": si arreda come uno stile, non "cambia solo quello che chiedo"
  const prompt = buildStagingPrompt({ customPrompt: custom, style: body.style, angle: body.angle, planimetria: !!body.planimetria, scene, room: roomK, restyle }) + vary
  const usesText = !!custom && !body.angle && !body.planimetria
  // Zona selezionata dall'agente (0..1): al modello va anche una copia della foto con la zona segnata in rosso.
  const r = body.region
  // Forma libera (lazo): poligono in 0..1, max 300 punti; senza, e' un rettangolo
  const poly = Array.isArray(r?.poly) ? r.poly.filter(p => p && [p.x, p.y].every(v => typeof v === 'number' && v >= 0 && v <= 1)).slice(0, 300).map(p => ({ x: p.x, y: p.y })) : []
  const drawn = r && [r.x, r.y, r.w, r.h].every(v => typeof v === 'number' && v >= 0 && v <= 1) && r.w > 0.02 && r.h > 0.02 ? { x: r.x, y: r.y, w: r.w, h: r.h, ...(poly.length >= 3 ? { poly } : {}) } : null
  // togliere qualcosa dentro una zona: si lavora su TUTTA la foto dicendo dov'e' l'oggetto (niente "mark", che fuori dalla
  // zona rimette la foto): luce e ombra di una lampada vanno oltre la zona e lasciavano un rettangolo scuro (27/09)
  const removing = /\b(togli|rimuovi|elimina|cancella|leva)\b/i.test(custom)
  const region: { x: number; y: number; w: number; h: number; poly?: { x: number; y: number }[] } | null = drawn && removing ? null : drawn
  // Clic sugli oggetti: punti segnati sulla copia
  const points = Array.isArray(body.points) ? body.points.filter(p => p && [p.x, p.y].every(v => typeof v === 'number' && v >= 0 && v <= 1)).slice(0, 10) : []
  // Senza zona ne' clic: se la richiesta parla di pareti, pavimento o soffitto si modifica solo quell'elemento
  // cosi' "pareti bianche" non tocca i mobili bianchi.
  const labels = !region && !points.length && usesText ? [
    ...(/\b(pareti|parete|muri|muro|muratura)\b/i.test(custom) ? ['wall'] : []),
    ...(/\b(pavimento|pavimenti|parquet)\b/i.test(custom) ? ['floor'] : []),
    ...(/\b(soffitto|soffitti)\b/i.test(custom) ? ['ceiling'] : []),
  ] : []
  // Modalita' finta: nessuna GPU, torna la stessa foto.
  // Crediti: si controlla prima di generare, si scalano solo a foto riuscita (src/lib/credits.ts)
  // modifiche: le prime FREE_EDITS su una foto gratis (conteggio dalla chat), poi 1 credito
  const edits = typeof body.edits === 'number' && body.edits >= 0 ? body.edits : 0
  const action: Action = body.angle === 'day' ? 'luminoso' : body.style === 'empty' ? 'svuota' : furnishReq ? 'arreda' : edits >= FREE_EDITS ? 'modifica_extra' : 'modifica'
  if (!(await canAfford(userId, action))) return NextResponse.json({ error: 'no_credits', cost: CREDIT_COST[action] }, { status: 402 })
  // Modifiche gratis: tetto giornaliero per utente contro gli abusi (EDIT_DAILY_LIMIT, predefinito 300), contato su ai_usage
  if (action === 'modifica') {
    const { count } = await admin.from('ai_usage').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('kind', ['zona', 'modifica', 'photo_edit']).gte('created_at', new Date(Date.now() - 86_400_000).toISOString())
    if ((count ?? 0) >= (Number(process.env.EDIT_DAILY_LIMIT) || 300)) return NextResponse.json({ error: 'daily_limit' }, { status: 429 })
  }
  if (AI_MOCK) { await mockDelay(2000); return NextResponse.json({ url: imageUrl || imageBase64, mock: true }) }
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: 'not_configured' }, { status: 503 })

  const t0 = Date.now()
  let b64: string | null = null
  let used = prompt // prompt usato, per il debug
  const src = imageBase64 || imageUrl
  try {
    // Luminoso: correzione dell'esposizione senza AI (istantanea, gratis, non brucia i bianchi, la stanza non cambia)
    if (body.angle === 'day') {
      const buf = imageBase64 ? Buffer.from(imageBase64.split(',')[1] ?? '', 'base64') : Buffer.from(await (await fetch(imageUrl, { signal: AbortSignal.timeout(20_000) })).arrayBuffer())
      b64 = (await brighten(buf)).toString('base64')
      used = 'brighten (curva esposizione, niente AI)'
    } else {
    // Tutto il resto: GPT Image 2.5 Sunburst (OpenAI diretto), sempre e solo lui per le foto (scelta del 28/09).
    // Qualita' bassa per modifiche, zone, luce e planimetrie (0,014 $); arredo con la qualita' predefinita (GPT_IMAGE_QUALITY).
    const guided = scene === 'interno' && !drawn && !points.length && !labels.length && !body.angle && !body.planimetria && (furnishReq || body.style === 'empty' || !!custom)
    const density = (['poco', 'ricco'] as const).find(d => d === body.density)
    let req: { image: string; prompt: string; extra?: string[] }
    let kind: string
    if (guided) {
      // arredo, Svuota e ogni richiesta scritta sugli interni: i prompt della piattaforma (lib/nanoBanana.stagePrompt).
      // Svuota senza maschera: tiene pilastri, muretti e pavimento da solo.
      // Stile da una foto: lo stile del riferimento si legge e si scrive a parole (styleFromPhoto), la foto non gli si passa
      const task = body.style === 'empty' ? 'empty' : furnishReq ? 'furnish' : 'edit'
      const style = task === 'edit' ? custom : (body.style && STYLE_LOOK[body.style] ? STYLE_LOOK[body.style] : `as requested by the agent (in Italian): "${custom}"`) + vary
      const refStyle = styleRef && task === 'furnish' ? await styleFromPhoto(styleRef, userId) : null
      if (styleRef && task === 'furnish' && !refStyle) throw new Error('styleFromPhoto')
      req = { image: src, prompt: stagePrompt({ task, room: roomLabel(roomK), style: refStyle ?? style, density }) }
      kind = task === 'furnish' ? 'arreda' : task === 'empty' ? 'svuota' : 'modifica'
    } else if (usesText && (drawn || points.length)) {
      // zona o clic con una richiesta scritta: la foto e una copia con la zona segnata in rosso
      req = { image: src, prompt: zonePrompt(custom, roomLabel(roomK), drawn ? 'zone' : 'points'), extra: [await markedCopy(src, drawn, points)] }
      kind = 'zona'
    } else if (usesText) {
      // pareti, pavimento o soffitto nominati nel testo: richiesta scritta sull'elemento
      req = { image: src, prompt: stagePrompt({ task: 'edit', room: roomLabel(roomK), style: custom }) }
      kind = 'modifica'
    } else if (drawn || points.length) {
      // preset (stile, vista) dentro una zona: il prompt della piattaforma limitato alla zona segnata in rosso
      req = { image: src, prompt: `${prompt} Apply this only inside the area marked in red in the second image; everything outside it stays exactly the same, same framing and perspective. The result must not contain any red mark.`, extra: [await markedCopy(src, drawn, points)] }
      kind = 'zona'
    } else {
      // luce (vista), planimetria, esterni e giardini, stili senza testo: il prompt classico della piattaforma (lib/stagingPrompts)
      req = { image: src, prompt }
      kind = body.angle ? 'luce' : body.planimetria ? 'planimetria' : furnishReq ? 'arreda' : 'modifica'
    }
    used = req.prompt
    b64 = await gptImage({ userId, ...req, kind, ...(kind !== 'arreda' ? { quality: process.env.GPT_EDIT_QUALITY || 'low' } : {}) })
    }
  } catch (e) {
    console.error('photo-edit error:', e)
    return NextResponse.json({ error: 'ai_failed' }, { status: 502 })
  }
  const creditsLeft = b64 ? await spend(userId, action, { preview: !!body.preview }) : null
  if (!b64) { console.error('photo-edit failed: nessuna immagine'); return NextResponse.json({ error: 'ai_failed' }, { status: 502 }) }
  if (process.env.NODE_ENV !== 'production') await debugDump({ imageBase64, imageUrl, region, prompt: used, request: custom, outB64: b64 })
  // risultato alle proporzioni dell'originale + finitura fotografica (grana, contrasto locale: meno "piatto");
  // Luminoso no: e' gia' la foto vera con l'esposizione corretta
  let shapedBuf: Buffer | null = null
  const shaped = async () => (shapedBuf ??= body.angle === 'day' ? await matchInputShape(Buffer.from(b64, 'base64'), imageBase64, imageUrl) : await finish(await matchInputShape(Buffer.from(b64, 'base64'), imageBase64, imageUrl, !body.planimetria && (!body.angle || body.angle === 'day'))))
  // foto di un immobile (scelta dalla vetrina): cartella casa-<id>, la Galleria le raggruppa per casa
  const projectId = typeof body.projectId === 'string' && /^[\w-]{1,64}$/.test(body.projectId) ? body.projectId : ''
  // anteprime per il video (tre proposte tra cui scegliere): cartella a parte, non vanno in Galleria
  if (body.preview === true) {
    const url = await uploadJpeg(await shaped(), `previews/${userId}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.jpg`)
    return NextResponse.json({ url, seconds: Math.round((Date.now() - t0) / 1000), credits: creditsLeft })
  }
  const key = `edits/${userId}/${projectId ? `casa-${projectId}/` : ''}${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const url = await uploadJpeg(await shaped(), `${key}.jpg`)
  // Media: accanto al risultato si salva anche il "prima" (<chiave>-prima.jpg), cosi' la pagina Media
  // mostra ogni modifica con prima e dopo leggendo solo la cartella su R2 (niente tabella).
  await savePrima(imageBase64, imageUrl, `${key}-prima.jpg`)
  // Dati per la Galleria (richiesta, stanza, foto di partenza) nel NOME di un file vuoto accanto al risultato:
  // un file per modifica, quindi nessun conflitto anche con piu' foto generate insieme, e la Galleria li legge
  // tutti con il solo elenco della cartella.
  const room = typeof body.room === 'string' ? body.room.slice(0, 40) : ''
  const what = custom || [body.style, body.angle, body.planimetria ? 'planimetria' : ''].filter(Boolean).join(' ')
  const mine = `${process.env.R2_PUBLIC_URL}/edits/${userId}/`
  const from = imageUrl.startsWith(mine) ? imageUrl.slice(`${process.env.R2_PUBLIC_URL}/`.length) : undefined
  const meta = Buffer.from(JSON.stringify({ t: what.slice(0, 160), r: room, ...(from ? { f: from } : {}) })).toString('base64url')
  await uploadMarker(`${key}.meta.${meta}`).catch(e => console.error('media meta', e))
  return NextResponse.json({ url, seconds: Math.round((Date.now() - t0) / 1000), credits: creditsLeft })
}

async function savePrima(imageBase64: string, imageUrl: string, key: string) {
  try {
    const src = imageBase64
      ? Buffer.from(imageBase64.split(',')[1] ?? '', 'base64')
      : Buffer.from(await (await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) })).arrayBuffer())
    await uploadJpeg(await sharp(src).rotate().resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true }).jpeg({ quality: 85 }).toBuffer(), key)
  } catch (e) { console.error('savePrima', e) } // senza "prima" il risultato resta comunque nei Media
}

// Il modello genera a ~1 MP con lati multipli di 32: le proporzioni cambiano di poco (es. 1920x1440 ->
// 1184x896) e nel prima/dopo la foto sembra spostata. Riporto il risultato alle proporzioni esatte
// dell'originale (lato lungo max 1600 px). Se l'originale non si legge, resta com'e'.
async function matchInputShape(out: Buffer, imageBase64: string, imageUrl: string, align = true): Promise<Buffer> {
  try {
    const src = imageBase64
      ? Buffer.from(imageBase64.split(',')[1] ?? '', 'base64')
      : Buffer.from(await (await fetch(imageUrl, { signal: AbortSignal.timeout(15_000) })).arrayBuffer())
    const { width = 0, height = 0 } = await sharp(src).metadata()
    if (!width || !height) return out
    const k = Math.min(1, 1600 / Math.max(width, height))
    const shaped = await sharp(out).resize(Math.round(width * k), Math.round(height * k), { fit: 'fill' }).jpeg({ quality: 90 }).toBuffer()
    // stessa stanza rimessa esattamente sopra l'originale (i modelli la spostano di qualche pixel), vedi align.ts
    return align ? await alignTo(src, shaped) : shaped
  } catch {
    return out
  }
}

// Solo in sviluppo: salva in /tmp/gnm-debug cosa e' stato mandato al modello (foto, foto con il rettangolo
// rosso, prompt, traduzione, risultato) per controllare le modifiche di una zona.
async function debugDump(d: { imageBase64: string; imageUrl: string; region: { x: number; y: number; w: number; h: number } | null; prompt: string; request?: string; outB64: string; translated?: string; worker?: string }) {
  try {
    const { mkdir, writeFile } = await import('fs/promises')
    const dir = `/tmp/gnm-debug/${Date.now()}`
    await mkdir(dir, { recursive: true })
    const src = d.imageBase64 ? Buffer.from(d.imageBase64.split(',')[1] ?? '', 'base64') : Buffer.from(await (await fetch(d.imageUrl)).arrayBuffer())
    const { width = 0, height = 0 } = await sharp(src).metadata()
    await writeFile(`${dir}/1-foto.jpg`, await sharp(src).jpeg().toBuffer())
    if (d.region && width && height) {
      const r = d.region
      const svg = `<svg width="${width}" height="${height}"><rect x="${r.x * width}" y="${r.y * height}" width="${r.w * width}" height="${r.h * height}" fill="none" stroke="red" stroke-width="${Math.max(4, Math.floor(width / 200))}"/></svg>`
      // zona segnata: rettangolo rosso
      await writeFile(`${dir}/2-foto-con-rettangolo.jpg`, await sharp(src).composite([{ input: Buffer.from(svg) }]).jpeg().toBuffer())
    }
    await writeFile(`${dir}/3-risultato.jpg`, Buffer.from(d.outB64, 'base64'))
    await writeFile(`${dir}/prompt.txt`, `richiesta: ${d.request ?? ''}\nzona: ${JSON.stringify(d.region)}\n\nprompt:\n${d.prompt}\n`)
  } catch (e) { console.error('debugDump', e) }
}
