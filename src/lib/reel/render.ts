import { spawn } from 'child_process'
import { mkdtemp, readFile, rm, writeFile } from 'fs/promises'
import { tmpdir } from 'os'
import { join } from 'path'
import sharp from 'sharp'
import ffmpegPath from 'ffmpeg-static'
import { clean, fit, measure, text, wrap, type Weight } from './text'

// Video dell'annuncio e Video Venduto o Affittato (05/10/2026): niente AI, solo montaggio.
// Ogni foto diventa una scena 1080x1920 con un movimento lento (zoom o panoramica) fatto con il filtro perspective
// di FFmpeg: coordinate con i decimali e interpolazione cubica, quindi niente tremolio (zoompan arrotonda ai pixel).
// Le scritte sono PNG trasparenti (SVG con le lettere come contorni, vedi text.ts) che entrano con una dissolvenza.
// Le scene si fanno in parallelo, poi una sola passata le unisce con le dissolvenze e la musica.

export type ReelStyle = 'vivace' | 'elegante'
export type Contract = 'vendita' | 'affitto'
export type AgentInfo = { name: string; agency: string; phone: string; site: string; color: string; logo: Buffer | null }
export type Photo = { buf: Buffer; staged: boolean }
export type ReelJob = { kind: 'reel'; photos: Photo[]; title: string; place: string; price: string; mq: string; rooms: string; contract: Contract; style: ReelStyle; enhance: boolean; agent: AgentInfo }
export type SoldJob = { kind: 'venduto'; photo: Photo; place: string; days: string; contract: Contract; style: ReelStyle; enhance: boolean; agent: AgentInfo }
export type Job = ReelJob | SoldJob

const W = 1080, H = 1920, M = 80, FPS = 30, X = 0.6 // dissolvenza tra le scene
const INK = '#1d1d1f', BRAND = '#537eec', RED = '#d92d20'
const svg = (body: string, defs = '') => Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs}</defs>${body}</svg>`)
const png = (body: string, defs = '') => sharp(svg(body, defs)).png().toBuffer()
// icone (lucide, 24x24, a tratto)
const PIN = 'M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0 M12 7a3 3 0 1 0 0 6 3 3 0 1 0 0-6'
const PHONE = 'M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z'
const icon = (d: string, x: number, y: number, size: number, color: string) => `<path d="${d}" transform="translate(${x} ${y}) scale(${size / 24})" fill="none" stroke="${color}" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>`
// colore dell'agente: luminanza (WCAG) per scegliere testo bianco o scuro sopra il colore, e il colore come testo su bianco
const lum = (hex: string) => { const v = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(c => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4)); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2] }
const light = (c: string) => lum(c) > 0.4 // sopra serve testo scuro
const onColor = (c: string) => (light(c) ? INK : '#fff')
const onWhite = (c: string) => (lum(c) > 0.3 ? INK : c) // colore come testo su fondo bianco, se si legge
const onDark = (c: string) => (lum(c) > 0.1 ? c : '#fff') // linea sottile su fondo scuro (Elegante)
const shade = (from: number, to: number, a: number) => [`<rect x="0" y="${from}" width="${W}" height="${H - from}" fill="url(#g)"/>`, `<linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#000" stop-opacity="0"/><stop offset="${((to - from) / (H - from)).toFixed(3)}" stop-color="#000" stop-opacity="${a}"/><stop offset="1" stop-color="#000" stop-opacity="${a}"/></linearGradient>`] as const

// prezzo come lo scrive l'agente: "320000", "320.000 €", "Trattativa riservata"
export function priceText(p: string, contract: Contract): string {
  const s = clean(p).slice(0, 40)
  if (!s) return ''
  const digits = s.replace(/[^\d]/g, '')
  const n = /^[€\s\d.,']+(€|eur|euro)?$/i.test(s) && digits ? Number(s.replace(/[.,'\s€a-z]/gi, '').slice(0, 10)) : NaN
  const v = Number.isFinite(n) && n > 0 ? `€ ${n.toLocaleString('it-IT')}` : s
  return contract === 'affitto' && Number.isFinite(n) && n > 0 ? `${v}/mese` : v
}
const num = (s: string) => clean(s).replace(/[^\d.,]/g, '').slice(0, 6)
export const contractWord = (c: Contract, done = false) => (done ? (c === 'affitto' ? 'AFFITTATO' : 'VENDUTO') : c === 'affitto' ? 'IN AFFITTO' : 'IN VENDITA')

// ---- foto ------------------------------------------------------------------------------------------------
// Foto pronta per la scena: alta 1920; verticale = 1080 di larghezza (solo zoom), orizzontale fino a 1620 (panoramica).
// enhance: luce migliore senza AI (livelli automatici leggeri, un filo di contrasto e colore)
async function prepPhoto(buf: Buffer, enhance: boolean): Promise<{ img: Buffer; wi: number }> {
  const base = sharp(buf, { failOn: 'none' }).rotate()
  const { width = 1, height = 1 } = await base.metadata().then(m => (m.orientation && m.orientation >= 5 ? { width: m.height, height: m.width } : m))
  const r = width / height
  const wi = r <= 0.75 ? W : Math.min(1620, Math.round((H * r) / 2) * 2)
  let p = sharp(await base.toBuffer()).resize(wi, H, { fit: 'cover', kernel: 'lanczos3' })
  if (enhance) p = p.normalise({ lower: 0.5, upper: 99.5 }).linear(1.04, -4).modulate({ brightness: 1.03, saturation: 1.06 })
  return { img: await p.sharpen({ sigma: 0.6 }).jpeg({ quality: 92 }).toBuffer(), wi }
}
// sfondo del finale: l'ultima foto sfocata e coperta dal colore (Vivace) o dal nero (Elegante)
async function endBackground(buf: Buffer, color: string, a: number): Promise<Buffer> {
  const blurred = await sharp(buf, { failOn: 'none' }).rotate().resize(W / 4, H / 4, { fit: 'cover' }).blur(12).resize(W, H).toBuffer()
  return sharp(blurred).composite([{ input: svg(`<rect width="${W}" height="${H}" fill="${color}" fill-opacity="${a}"/>`) }]).jpeg({ quality: 92 }).toBuffer()
}

// ---- scritte (PNG 1080x1920 trasparenti) ------------------------------------------------------------------
function pill(label: string, o: { x: number; y: number; h: number; size: number; w: Weight; bg: string; bgA?: number; fg: string; track?: number; anchor?: 'start' | 'middle'; icon?: string; stroke?: string }) {
  const pad = o.h * 0.42, ic = o.icon ? o.size * 1.05 : 0, gap = o.icon ? o.size * 0.4 : 0
  const tw = measure(label, o.size, o.w, o.track ?? 0), bw = tw + pad * 2 + ic + gap
  const x = o.anchor === 'middle' ? o.x - bw / 2 : o.x
  const base = o.y + o.h / 2 + o.size * 0.36
  return {
    w: bw,
    svg: `<rect x="${x}" y="${o.y}" width="${bw}" height="${o.h}" rx="${o.h / 2}" fill="${o.bg}"${o.bgA !== undefined ? ` fill-opacity="${o.bgA}"` : ''}${o.stroke ? ` stroke="${o.stroke}" stroke-width="3"` : ''}/>`
      + (o.icon ? icon(o.icon, x + pad, o.y + (o.h - ic) / 2, ic, o.fg) : '')
      + text(label, { x: x + pad + ic + gap, y: base, size: o.size, w: o.w, fill: o.fg, track: o.track }),
  }
}

// apertura dell'annuncio: tipo di contratto, titolo, zona
async function titleOverlay(j: ReelJob): Promise<Buffer> {
  const viv = j.style === 'vivace', color = j.agent.color
  const tSize = viv ? 82 : 70, lh = viv ? 94 : 82
  const lines = j.title ? wrap(j.title, tSize, viv ? 800 : 700, W - 2 * M, 3) : []
  const place = j.place ? fit(clean(j.place), viv ? 42 : 38, 500, W - 2 * M - 60) : ''
  let y = 1520 // linea di base della zona
  let body = ''
  if (place) {
    body += viv
      ? icon(PIN, M - 4, y - 38, 46, '#fff') + text(place, { x: M + 54, y, size: 42, w: 500, fill: '#fff', opacity: 0.92 })
      : text(place, { x: M, y, size: 38, w: 500, fill: '#fff', opacity: 0.88 })
    y -= viv ? 76 : 70
  }
  if (!viv && lines.length) { body += `<rect x="${M}" y="${y - 6}" width="72" height="3" fill="${onDark(color)}"/>`; y -= 46 }
  for (const l of [...lines].reverse()) { body += text(l, { x: M, y, size: tSize, w: viv ? 800 : 700, fill: '#fff' }); y -= lh }
  const top = y + lh - tSize - (viv ? 34 : 30)
  body += viv
    ? pill(contractWord(j.contract), { x: M, y: top - 66, h: 66, size: 28, w: 800, bg: color, fg: onColor(color), track: 3 }).svg
    : text(contractWord(j.contract), { x: M, y: top - 12, size: 28, w: 500, fill: '#fff', track: 7, opacity: 0.85 })
  const [rect, grad] = shade(Math.max(0, top - 380), top - 60, viv ? 0.72 : 0.62)
  return png(rect + body, grad)
}

// seconda scena: prezzo e dati (mq, locali). null se non c'e' niente da dire
async function priceOverlay(j: ReelJob): Promise<Buffer | null> {
  const viv = j.style === 'vivace', color = j.agent.color
  const price = priceText(j.price, j.contract)
  const facts = [num(j.mq) && `${num(j.mq)} m²`, num(j.rooms) && `${num(j.rooms)} ${num(j.rooms) === '1' ? 'locale' : 'locali'}`].filter(Boolean) as string[]
  if (!price && !facts.length) return null
  const maxW = W - 2 * M - (viv ? 96 : 0)
  let pSize = viv ? 92 : 84
  while (price && pSize > 48 && measure(price, pSize, viv ? 800 : 700) > maxW) pSize -= 4
  if (viv) {
    // card bianca in basso: prezzo grande, sotto i dati in pillole del colore dell'agente
    const pad = 48, chipH = 70, gap = 20
    const h = pad * 2 + (price ? pSize : 0) + (price && facts.length ? 36 : 0) + (facts.length ? chipH : 0)
    const top = 1560 - h
    let body = `<rect x="${M}" y="${top}" width="${W - 2 * M}" height="${h}" rx="48" fill="#fff"/>`
    let y = top + pad
    if (price) { body += text(price, { x: M + pad, y: y + pSize * 0.8, size: pSize, w: 800, fill: INK }); y += pSize + 36 }
    let x = M + pad
    for (const f of facts) { const c = pill(f, { x, y, h: chipH, size: 34, w: 700, bg: color, bgA: 0.12, fg: onWhite(color) }); body += c.svg; x += c.w + gap }
    const [rect, grad] = shade(top - 200, top + 100, 0.45)
    return png(rect + body, grad)
  }
  // Elegante: solo testo bianco, una riga sottile sopra il prezzo
  let y = 1530, body = ''
  if (facts.length) { body += text(facts.join('   ·   '), { x: M, y, size: 40, w: 500, fill: '#fff', opacity: 0.88 }); y -= price ? 70 : 0 }
  if (price) { body += text(price, { x: M, y, size: pSize, w: 700, fill: '#fff' }); y -= pSize + 34 }
  body += `<rect x="${M}" y="${y}" width="72" height="3" fill="${onDark(color)}"/>`
  const [rect, grad] = shade(y - 260, y + 40, 0.6)
  return png(rect + body, grad)
}

// foto arredata con l'AI: scritta piccola in basso, sempre
const stagedOverlay = () => png(pill('Immagine arredata virtualmente', { x: W / 2, y: 1612, h: 52, size: 24, w: 500, bg: '#000', bgA: 0.45, fg: '#fff', anchor: 'middle' }).svg)

// finale con l'agente: logo, nome, agenzia, telefono, sito. headline: righe in alto (Venduto: "Hai una casa da vendere?")
async function endOverlay(a: AgentInfo, style: ReelStyle, headline: string[]): Promise<Buffer> {
  const viv = style === 'vivace'
  // Vivace: fondo del colore dell'agente, testo bianco o scuro secondo il colore; Elegante: fondo scuro, una linea nel colore
  const fg = viv ? onColor(a.color) : '#fff', dark = viv && light(a.color)
  const parts: { h: number; logo?: boolean; draw: (y: number) => string }[] = []
  let logo: { buf: Buffer; w: number; h: number } | null = null
  if (a.logo) {
    const l = await sharp(a.logo).resize(440, 150, { fit: 'inside', withoutEnlargement: false }).png().toBuffer({ resolveWithObject: true }).catch(() => null)
    if (l) logo = { buf: l.data, w: l.info.width, h: l.info.height }
  }
  if (headline.length) {
    const size = viv ? 84 : 72
    parts.push({ h: headline.length * (size + 14) + 30, draw: y => headline.map((l, k) => text(fit(l, size, viv ? 800 : 700, W - 2 * M), { x: W / 2, y: y + size * 0.82 + k * (size + 14), size, w: viv ? 800 : 700, fill: fg, anchor: 'middle' })).join('') + (viv ? '' : `<rect x="${W / 2 - 40}" y="${y + headline.length * (size + 14) + 6}" width="80" height="3" fill="${onDark(a.color)}"/>`) })
  }
  if (logo) parts.push({ h: logo.h + 56 + 40, logo: true, draw: () => '' })
  const name = a.name || a.agency
  if (name) parts.push({ h: 86, draw: y => text(fit(name, viv ? 66 : 60, viv ? 800 : 700, W - 2 * M), { x: W / 2, y: y + 56, size: viv ? 66 : 60, w: viv ? 800 : 700, fill: fg, anchor: 'middle' }) })
  if (a.agency && a.agency !== name) parts.push({ h: 58, draw: y => text(fit(a.agency, 38, 500, W - 2 * M), { x: W / 2, y: y + 36, size: 38, w: 500, fill: fg, anchor: 'middle', opacity: 0.85 }) })
  if (a.phone) parts.push({ h: 150, draw: y => pill(a.phone, { x: W / 2, y: y + 30, h: 104, size: 50, w: 800, bg: dark ? INK : '#fff', bgA: viv ? 1 : 0.08, fg: dark ? '#fff' : viv ? onWhite(a.color) : '#fff', anchor: 'middle', icon: PHONE, stroke: viv ? undefined : '#fff' }).svg })
  if (a.site) parts.push({ h: 70, draw: y => text(fit(a.site, 36, 500, W - 2 * M), { x: W / 2, y: y + 50, size: 36, w: 500, fill: fg, anchor: 'middle', opacity: 0.9 }) })
  const total = parts.reduce((s, p) => s + p.h, 0)
  let y = Math.round(980 - total / 2), body = '', logoAt = 0
  for (const p of parts) {
    if (logo && p.logo) { logoAt = y; body += `<rect x="${(W - logo.w) / 2 - 28}" y="${y}" width="${logo.w + 56}" height="${logo.h + 56}" rx="40" fill="#fff"/>` }
    body += p.draw(y); y += p.h
  }
  const out = await png(body)
  return logo ? sharp(out).composite([{ input: logo.buf, left: Math.round((W - logo.w) / 2), top: logoAt + 28 }]).png().toBuffer() : out
}

// timbro VENDUTO / AFFITTATO (Vivace): rosso, inclinato; PNG della sua misura (si ingrandisce nell'animazione)
async function stampPng(word: string): Promise<Buffer> {
  let size = 150
  while (measure(word, size, 800, 8) + 140 > 840) size -= 4
  const tw = measure(word, size, 800, 8)
  const bw = Math.round(tw + 140), bh = Math.round(size + 120), pad = 60
  const cw = bw + pad * 2, ch = bh + pad * 2
  const body = `<g transform="rotate(-8 ${cw / 2} ${ch / 2})"><rect x="${pad}" y="${pad}" width="${bw}" height="${bh}" rx="30" fill="#fff" fill-opacity="0.94" stroke="${RED}" stroke-width="14"/>`
    + `<rect x="${pad + 22}" y="${pad + 22}" width="${bw - 44}" height="${bh - 44}" rx="16" fill="none" stroke="${RED}" stroke-width="4"/>`
    + text(word, { x: cw / 2, y: ch / 2 + size * 0.36, size, w: 800, fill: RED, anchor: 'middle', track: 8 }) + '</g>'
  return sharp(Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${cw}" height="${ch}">${body}</svg>`)).png().toBuffer()
}
// Elegante: scritta sobria al centro, righe sottili sopra e sotto
async function soberOverlay(word: string): Promise<Buffer> {
  const size = word.length > 8 ? 104 : 120, y = 900
  const body = `<rect width="${W}" height="${H}" fill="#000" fill-opacity="0.36"/>`
    + `<rect x="${W / 2 - 90}" y="${y - size - 50}" width="180" height="3" fill="#fff" fill-opacity="0.9"/>`
    + text(word, { x: W / 2, y, size, w: 700, fill: '#fff', anchor: 'middle', track: 16 })
    + `<rect x="${W / 2 - 90}" y="${y + 50}" width="180" height="3" fill="#fff" fill-opacity="0.9"/>`
  return png(body)
}
// sotto il timbro: zona e "in N giorni"
async function soldCaption(j: SoldJob): Promise<Buffer | null> {
  const viv = j.style === 'vivace'
  const n = Number(j.days.replace(/[^\d]/g, '').slice(0, 4))
  const days = n > 0 ? `in ${n} ${n === 1 ? 'giorno' : 'giorni'}` : ''
  const place = j.place ? fit(clean(j.place), viv ? 56 : 44, viv ? 800 : 500, W - 2 * M - 70) : ''
  if (!place && !days) return null
  if (!viv) {
    let body = ''
    if (place) body += text(place, { x: W / 2, y: 1080, size: 44, w: 500, fill: '#fff', anchor: 'middle', opacity: 0.92 })
    if (days) body += text(days, { x: W / 2, y: place ? 1150 : 1080, size: 36, w: 500, fill: '#fff', anchor: 'middle', opacity: 0.8, track: 2 })
    return png(body)
  }
  let y = 1500, body = ''
  if (days) { body += pill(days, { x: W / 2, y: y - 74, h: 82, size: 38, w: 700, bg: '#fff', fg: RED, anchor: 'middle' }).svg; y -= 120 }
  if (place) { const pw = measure(place, 56, 800) + 62; body += icon(PIN, W / 2 - pw / 2, y - 48, 52, '#fff') + text(place, { x: W / 2 - pw / 2 + 62, y, size: 56, w: 800, fill: '#fff' }) }
  const [rect, grad] = shade(1080, 1300, 0.7)
  return png(rect + body, grad)
}

// ---- scene -----------------------------------------------------------------------------------------------
type Overlay = { png: Buffer; at: number; until?: number; fade?: number }
type Scene = { img: Buffer; wi: number; dur: number; z: [number, number]; cx: [number, number]; overlays: Overlay[]; stamp?: { png: Buffer; at: number } }
const SCENE = 3.4, END = 3.2

async function scenesOf(j: Job): Promise<Scene[]> {
  const a = j.agent
  if (j.kind === 'reel') {
    const photos = await Promise.all(j.photos.map(p => prepPhoto(p.buf, j.enhance)))
    const [title, price, staged] = await Promise.all([titleOverlay(j), priceOverlay(j), j.photos.some(p => p.staged) ? stagedOverlay() : null])
    const one = photos.length === 1
    const scenes: Scene[] = photos.map((p, k) => {
      const dur = one ? 6 : k === 0 ? SCENE + 0.6 : SCENE
      const d = (p.wi - W) / 2 * 0.75, dir = k % 2 ? -1 : 1
      const ov: Overlay[] = []
      if (k === 0) ov.push({ png: title, at: 0.35, ...(one && price ? { until: 2.9 } : {}) })
      if (price && (k === 1 || one)) ov.push({ png: price, at: one ? 3.3 : 0.35 })
      if (staged && j.photos[k].staged) ov.push({ png: staged, at: 0.2 })
      return { img: p.img, wi: p.wi, dur, z: p.wi > W ? [1, 1.04] : k % 2 ? [1.08, 1] : [1, 1.08], cx: [p.wi / 2 - d * dir, p.wi / 2 + d * dir], overlays: ov }
    })
    const last = j.photos[j.photos.length - 1].buf
    const viv = j.style === 'vivace'
    const [bg, end] = await Promise.all([endBackground(last, viv ? a.color : INK, viv ? 0.86 : 0.8), endOverlay(a, j.style, ['Prenota una visita'])])
    scenes.push({ img: bg, wi: W, dur: END, z: [1, 1.03], cx: [W / 2, W / 2], overlays: [{ png: end, at: 0.25 }] })
    return scenes
  }
  // Venduto / Affittato: una foto, il timbro (o la scritta sobria), poi il finale "Hai una casa da vendere?"
  const viv = j.style === 'vivace', word = contractWord(j.contract, true)
  const p = await prepPhoto(j.photo.buf, j.enhance)
  const [mark, caption, staged] = await Promise.all([viv ? stampPng(word) : soberOverlay(word), soldCaption(j), j.photo.staged ? stagedOverlay() : null])
  const d = (p.wi - W) / 2 * 0.6
  const first: Scene = { img: p.img, wi: p.wi, dur: 5.6, z: [1, 1.1], cx: [p.wi / 2 - d, p.wi / 2 + d], overlays: [...(caption ? [{ png: caption, at: 2.3, fade: 0.7 }] : []), ...(staged ? [{ png: staged, at: 0.2 }] : [])], ...(viv ? { stamp: { png: mark, at: 1.5 } } : {}) }
  if (!viv) first.overlays.unshift({ png: mark, at: 1.5, fade: 0.9 })
  const [bg, end] = await Promise.all([endBackground(j.photo.buf, viv ? a.color : INK, viv ? 0.86 : 0.8), endOverlay(a, j.style, ['Hai una casa', j.contract === 'affitto' ? 'da affittare?' : 'da vendere?', 'Chiamami'])])
  return [first, { img: bg, wi: W, dur: 3, z: [1, 1.03], cx: [W / 2, W / 2], overlays: [{ png: end, at: 0.25 }] }]
}

// un fotogramma della scena (copertina in Galleria): finestra all'inizio del movimento, scritte gia' entrate
async function still(s: Scene, extra?: Buffer): Promise<Buffer> {
  const z = s.z[0], cx = s.cx[0], ww = W / z, wh = H / z
  const frame = await sharp(s.img).extract({ left: Math.max(0, Math.round(cx - ww / 2)), top: Math.round(H / 2 - wh / 2), width: Math.round(ww), height: Math.round(wh) }).resize(W, H).toBuffer()
  const layers = [...s.overlays.filter(o => o.at < 3).map(o => o.png), ...(extra ? [extra] : [])]
  return sharp(frame).composite(layers.map(input => ({ input }))).jpeg({ quality: 82 }).toBuffer()
}
const STAMP_Y = 820
async function placeStamp(p: Buffer): Promise<Buffer> {
  const { width = 0, height = 0 } = await sharp(p).metadata()
  return sharp({ create: { width: W, height: H, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }).composite([{ input: p, left: Math.round((W - width) / 2), top: Math.round(STAMP_Y - height / 2) }]).png().toBuffer()
}

function ff(args: string[]): Promise<void> {
  return new Promise((ok, ko) => {
    const p = spawn(ffmpegPath as unknown as string, ['-v', 'error', '-y', ...args])
    const err: Buffer[] = []
    p.stderr.on('data', c => err.push(c))
    p.on('error', ko)
    p.on('close', code => (code === 0 ? ok() : ko(new Error(Buffer.concat(err).toString().slice(-800)))))
  })
}

async function renderScene(s: Scene, dir: string, k: number): Promise<string> {
  const n = Math.round(s.dur * FPS), N = n - 1
  const img = join(dir, `s${k}.jpg`), out = join(dir, `s${k}.mp4`)
  await writeFile(img, s.img)
  const inputs = ['-loop', '1', '-framerate', String(FPS), '-t', s.dur.toFixed(3), '-i', img]
  const lin = (a: number, b: number) => `(${a}+(${(b - a).toFixed(4)})*in/${N})`
  const z = lin(s.z[0], s.z[1]), cx = lin(s.cx[0], s.cx[1])
  const L = `${cx}-${W / 2}/${z}`, R = `${cx}+${W / 2}/${z}`, T = `${H / 2}-${H / 2}/${z}`, B = `${H / 2}+${H / 2}/${z}`
  let g = `[0:v]perspective=x0='${L}':y0='${T}':x1='${R}':y1='${T}':x2='${L}':y2='${B}':x3='${R}':y3='${B}':interpolation=cubic:eval=frame${s.wi !== W ? `,scale=${W}:${H}:flags=bicubic` : ''},setsar=1,format=yuv420p[v0];`
  let last = 'v0', i = 1
  for (const o of s.overlays) {
    const f = join(dir, `s${k}o${i}.png`)
    await writeFile(f, o.png)
    inputs.push('-loop', '1', '-framerate', String(FPS), '-t', s.dur.toFixed(3), '-i', f)
    const fd = o.fade ?? 0.6
    g += `[${i}:v]format=rgba,fade=t=in:st=${o.at}:d=${fd}:alpha=1${o.until ? `,fade=t=out:st=${o.until}:d=0.5:alpha=1` : ''}[o${i}];[${last}][o${i}]overlay=0:0:format=auto[v${i}];`
    last = `v${i}`; i++
  }
  if (s.stamp) {
    // timbro: entra grande e si posa con un piccolo rimbalzo (ease-out-back, 0,5 s), poi resta fermo
    const f = join(dir, `s${k}stamp.png`)
    await writeFile(f, s.stamp.png)
    const { width: sw = 800 } = await sharp(s.stamp.png).metadata()
    inputs.push('-loop', '1', '-framerate', String(FPS), '-t', s.dur.toFixed(3), '-i', f)
    const u = `clip((t-${s.stamp.at})/0.5,0,1)`
    const e = `(1+2.70158*pow(${u}-1,3)+1.70158*pow(${u}-1,2))`
    g += `[${i}:v]format=rgba,scale=w='2*trunc(${sw}*(1.5-0.5*${e})/2)':h=-2:eval=frame,fade=t=in:st=${s.stamp.at}:d=0.12:alpha=1[st];[${last}][st]overlay=x='(W-w)/2':y='${STAMP_Y}-h/2':format=auto[v${i}];`
    last = `v${i}`
  }
  g += `[${last}]format=yuv420p[out]`
  await ff([...inputs, '-filter_complex', g, '-map', '[out]', '-frames:v', String(n), '-r', String(FPS), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '14', '-pix_fmt', 'yuv420p', out])
  return out
}

// video finito: { mp4, cover } (cover = prima scena con il titolo, per la Galleria). music: file mp3 o null (silenzio)
export async function renderVideo(j: Job, music: Buffer | null): Promise<{ mp4: Buffer; cover: Buffer; seconds: number }> {
  const dir = await mkdtemp(join(tmpdir(), 'reel-'))
  try {
    const sc = await scenesOf(j)
    // al massimo 3 scene alla volta (Vercel ha pochi core)
    const parts: string[] = new Array(sc.length)
    let next = 0
    await Promise.all(Array.from({ length: Math.min(3, sc.length) }, async () => { while (next < sc.length) { const k = next++; parts[k] = await renderScene(sc[k], dir, k) } }))
    const total = sc.reduce((s, x) => s + x.dur, 0) - X * (sc.length - 1)
    const mp3 = join(dir, 'music.mp3'), out = join(dir, 'out.mp4')
    if (music) await writeFile(mp3, music)
    const ins = parts.flatMap(p => ['-i', p])
    let g = '', prev = '0:v', off = 0
    for (let k = 1; k < sc.length; k++) {
      off += sc[k - 1].dur - X
      g += `[${prev}][${k}:v]xfade=transition=fade:duration=${X}:offset=${off.toFixed(3)}[x${k}];`
      prev = `x${k}`
    }
    g += `[${prev}]format=yuv420p[v];`
    const audio = music ? ['-i', mp3] : ['-f', 'lavfi', '-t', String(Math.ceil(total) + 1), '-i', 'anullsrc=r=48000:cl=stereo']
    g += `[${sc.length}:a]atrim=end=${total.toFixed(2)},afade=t=in:d=0.4,afade=t=out:st=${(total - 1.5).toFixed(2)}:d=1.5,volume=0.85[a]`
    await ff([...ins, ...audio, '-filter_complex', g, '-map', '[v]', '-map', '[a]', '-t', total.toFixed(2), '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '20', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', out])
    const stamp = sc[0].stamp ? await placeStamp(sc[0].stamp.png) : undefined
    return { mp4: await readFile(out), cover: await still(sc[0], stamp), seconds: total }
  } finally {
    rm(dir, { recursive: true, force: true }).catch(() => {})
  }
}

// musica: Vivace allegra, Elegante calma (catalogo dei video, R2 pubblico)
export const MUSIC_MOOD: Record<ReelStyle, string[]> = { vivace: ['open-house-vibes', 'property-reveal'], elegante: ['luxury-showcase', 'ambient-walkthrough'] }
export const DEFAULT_COLOR = BRAND
