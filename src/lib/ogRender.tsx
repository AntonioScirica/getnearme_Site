/* eslint-disable @next/next/no-img-element -- next/og disegna <img>, non next/image */
import { ImageResponse } from 'next/og'
import { readFile } from 'fs/promises'
import { join } from 'path'
import sharp from 'sharp'
import { OG_H, OG_W } from './ogMeta'

// Disegno delle anteprime dei link (1200x630 PNG) con next/og. Le immagini passano tutte da sharp -> JPEG/PNG in data URL:
// next/og non legge webp/avif (le foto su R2 e quelle della home sono webp).

const BRAND = '#537EEC'
const INK = '#0B1020'

// Plus Jakarta Sans (il carattere dei titoli del sito), istanze statiche in TTF: next/og non legge woff2 ne' font variabili
let fontsP: Promise<{ name: string; data: Buffer; weight: 500 | 800; style: 'normal' }[]> | null = null
const fonts = () => (fontsP ??= Promise.all(([500, 800] as const).map(async weight => ({
  name: 'Jakarta', weight, style: 'normal' as const, data: await readFile(join(process.cwd(), `src/fonts/og/PlusJakartaSans-${weight}.ttf`)),
}))))

type Fit = { w: number; h: number; fit: 'cover' | 'inside'; png?: boolean }
const toData = async (input: Buffer, { w, h, fit, png }: Fit) => {
  const img = sharp(input, { failOn: 'none' }).rotate().resize(w, h, { fit, withoutEnlargement: fit === 'inside' })
  const { data, info } = png ? await img.png().toBuffer({ resolveWithObject: true }) : await img.jpeg({ quality: 84, mozjpeg: true }).toBuffer({ resolveWithObject: true })
  return { src: `data:image/${png ? 'png' : 'jpeg'};base64,${data.toString('base64')}`, width: info.width, height: info.height }
}
type Img = Awaited<ReturnType<typeof toData>>

// file della cartella public, convertiti una volta sola per processo
const local = new Map<string, Promise<Img>>()
const localImg = (path: string, f: Fit) => {
  const k = `${path}|${f.w}x${f.h}`
  if (!local.has(k)) local.set(k, readFile(join(process.cwd(), 'public', path)).then(b => toData(b, f)))
  return local.get(k)!
}

// immagine remota (R2, Supabase): solo https, 8 s e 15 MB al massimo; se non si legge si disegna senza
async function remoteImg(url: string | null | undefined, f: Fit): Promise<Img | null> {
  if (!url || !/^https:\/\//i.test(url)) return null
  try {
    const r = await fetch(url, { signal: AbortSignal.timeout(8000) })
    if (!r.ok || Number(r.headers.get('content-length') ?? 0) > 15e6) return null
    const buf = Buffer.from(await r.arrayBuffer())
    return buf.length > 15e6 ? null : await toData(buf, f)
  } catch { return null }
}

const render = async (el: React.ReactElement, maxAge: number) => new ImageResponse(el, {
  width: OG_W, height: OG_H, fonts: await fonts(),
  headers: { 'Cache-Control': `public, max-age=${maxAge}, s-maxage=31536000, stale-while-revalidate=604800` },
})

// testo su sfondo colorato: bianco o quasi nero secondo la luminosita' del colore
export function onColor(hex: string) {
  const m = /^#?([0-9a-f]{6})$/i.exec(hex)
  if (!m) return '#fff'
  const n = parseInt(m[1], 16), [r, g, b] = [n >> 16, (n >> 8) & 255, n & 255].map(c => { const x = c / 255; return x <= 0.03928 ? x / 12.92 : ((x + 0.055) / 1.055) ** 2.4 })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.45 ? INK : '#fff'
}

const cut = (s: string, n: number) => (s.length > n ? `${s.slice(0, n - 1).trimEnd()}…` : s)
const sizeFor = (s: string, steps: [number, number][]) => steps.find(([len]) => s.length <= len)?.[1] ?? steps[steps.length - 1][1]

// ---------- Agente Immo: titolo della pagina + foto prima/dopo dell'home staging ----------
export async function immoCard(title: string, subtitle: string) {
  const PW = 500, PH = 550
  const [logo, before, after] = await Promise.all([
    localImg('immo/logo-mark.svg', { w: 120, h: 120, fit: 'inside', png: true }),
    localImg('immo/home/staging-before.webp', { w: PW, h: PH, fit: 'cover' }),
    localImg('immo/home/staging-after.webp', { w: PW, h: PH, fit: 'cover' }),
  ])
  const t = cut(title, 90), s = cut(subtitle, 120)
  const pill = { display: 'flex', position: 'absolute' as const, top: 20, padding: '8px 18px', borderRadius: 999, background: 'rgba(255,255,255,.92)', color: INK, fontSize: 22, fontWeight: 800 }
  return render(
    <div style={{ width: OG_W, height: OG_H, display: 'flex', background: '#F4F6FC', fontFamily: 'Jakarta', color: INK }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: 660, padding: '56px 48px 56px 64px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <img src={logo.src} width={60} height={58} style={{ objectFit: 'contain' }} alt="" />
          <span style={{ fontSize: 34, fontWeight: 800, letterSpacing: -0.5 }}>Agente Immo</span>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'center' }}>
          <div style={{ display: 'flex', fontSize: sizeFor(t, [[34, 60], [56, 52], [999, 44]]), fontWeight: 800, lineHeight: 1.08, letterSpacing: -1.5 }}>{t}</div>
          {s && <div style={{ display: 'flex', marginTop: 24, fontSize: 26, fontWeight: 500, lineHeight: 1.35, color: '#4B5168' }}>{s}</div>}
        </div>
        <div style={{ display: 'flex' }}>
          <span style={{ display: 'flex', padding: '10px 22px', borderRadius: 999, background: BRAND, color: '#fff', fontSize: 22, fontWeight: 800 }}>agenteimmo.me</span>
        </div>
      </div>
      {/* prima/dopo: la stessa stanza, a sinistra vuota e a destra arredata, con la maniglia dello slider in mezzo */}
      <div style={{ display: 'flex', position: 'relative', width: PW, height: PH, marginTop: 40, borderRadius: 32, overflow: 'hidden' }}>
        <img src={after.src} width={PW} height={PH} style={{ position: 'absolute', left: 0, top: 0 }} alt="" />
        <div style={{ display: 'flex', position: 'absolute', left: 0, top: 0, width: PW / 2, height: PH, overflow: 'hidden' }}>
          <img src={before.src} width={PW} height={PH} alt="" />
        </div>
        <div style={{ display: 'flex', position: 'absolute', left: PW / 2 - 3, top: 0, width: 6, height: PH, background: '#fff' }} />
        <div style={{ display: 'flex', position: 'absolute', left: PW / 2 - 28, top: PH / 2 - 28, width: 56, height: 56, borderRadius: 999, background: '#fff', alignItems: 'center', justifyContent: 'center', color: BRAND, fontSize: 26, fontWeight: 800 }}>‹ ›</div>
        <span style={{ ...pill, left: 20 }}>Prima</span>
        <span style={{ ...pill, right: 20, background: BRAND, color: '#fff' }}>Dopo</span>
      </div>
    </div>,
    86400,
  )
}

// ---------- Sito dell'agente: logo, nome agenzia, zona, colore e foto di copertina ----------
type AgentInfo = { name: string; logo: string | null; primary: string; place: string; domain: string }

// logo dentro un riquadro bianco (i loghi sono spesso scuri o colorati): alto h, largo al massimo maxW
const fitLogo = (l: Img, h: number, maxW: number) => { const k = Math.min(h / l.height, maxW / l.width); return { width: Math.round(l.width * k), height: Math.round(l.height * k) } }
const LogoTile = ({ logo, h = 72, maxW = 320 }: { logo: Img; h?: number; maxW?: number }) => (
  <div style={{ display: 'flex', alignSelf: 'flex-start', alignItems: 'center', padding: '14px 20px', borderRadius: 20, background: '#fff' }}>
    <img src={logo.src} {...fitLogo(logo, h, maxW)} alt="" />
  </div>
)

export async function siteCard(a: AgentInfo, cover: string | null) {
  const LW = 480
  const [logo, photo] = await Promise.all([
    remoteImg(a.logo, { w: 640, h: 160, fit: 'inside', png: true }),
    remoteImg(cover, { w: OG_W - LW, h: OG_H, fit: 'cover' }),
  ])
  const fg = onColor(a.primary), name = cut(a.name, 60)
  const full = !photo // senza foto: tutta la card nel colore dell'agente
  return render(
    <div style={{ width: OG_W, height: OG_H, display: 'flex', background: a.primary, fontFamily: 'Jakarta', color: fg }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: full ? OG_W : LW, height: OG_H, padding: full ? '64px 80px' : '56px 48px' }}>
        {logo ? <LogoTile logo={logo} /> : <div style={{ display: 'flex', height: 1 }} />}
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, justifyContent: 'flex-end' }}>
          <div style={{ display: 'flex', fontSize: sizeFor(name, full ? [[24, 76], [40, 64], [999, 52]] : [[16, 56], [30, 48], [999, 40]]), fontWeight: 800, lineHeight: 1.08, letterSpacing: -1 }}>{name}</div>
          {a.place && <div style={{ display: 'flex', marginTop: 16, fontSize: full ? 32 : 26, fontWeight: 500, opacity: 0.88 }}>{cut(a.place, 60)}</div>}
          <div style={{ display: 'flex', marginTop: 36, fontSize: 21, fontWeight: 500, opacity: 0.72 }}>{cut(a.domain, 44)}</div>
        </div>
      </div>
      {photo && <img src={photo.src} width={OG_W - LW} height={OG_H} alt="" />}
    </div>,
    3600,
  )
}

// ---------- Immobile: foto grande, titolo, prezzo, mq/locali, marchio dell'agenzia, timbro Venduto/Affittato ----------
export async function propertyCard(a: AgentInfo, p: { title: string; price: string; facts: string; photo: string | null; stamp: string | null }) {
  const [logo, photo] = await Promise.all([
    remoteImg(a.logo, { w: 400, h: 100, fit: 'inside', png: true }),
    remoteImg(p.photo, { w: OG_W, h: OG_H, fit: 'cover' }),
  ])
  const title = cut(p.title, 80)
  return render(
    <div style={{ width: OG_W, height: OG_H, display: 'flex', position: 'relative', background: a.primary, fontFamily: 'Jakarta', color: '#fff' }}>
      {photo && <img src={photo.src} width={OG_W} height={OG_H} style={{ position: 'absolute', left: 0, top: 0 }} alt="" />}
      <div style={{ display: 'flex', position: 'absolute', left: 0, top: 0, width: OG_W, height: OG_H, backgroundImage: 'linear-gradient(to top, rgba(0,0,0,.82) 0%, rgba(0,0,0,.45) 38%, rgba(0,0,0,0) 62%)' }} />
      {/* marchio in alto a sinistra */}
      <div style={{ display: 'flex', position: 'absolute', left: 48, top: 44, alignItems: 'center', gap: 14, padding: logo ? '12px 22px 12px 16px' : '14px 24px', borderRadius: 20, background: '#fff', color: INK }}>
        {logo && <img src={logo.src} {...fitLogo(logo, 44, 220)} alt="" />}
        <span style={{ display: 'flex', fontSize: 24, fontWeight: 800 }}>{cut(a.name, logo ? 28 : 40)}</span>
      </div>
      {p.stamp && (
        <div style={{ display: 'flex', position: 'absolute', right: 70, top: 64, padding: '10px 30px', border: '7px solid #fff', borderRadius: 14, background: 'rgba(220,38,38,.92)', color: '#fff', fontSize: 58, fontWeight: 800, letterSpacing: 4, transform: 'rotate(-10deg)' }}>{p.stamp.toUpperCase()}</div>
      )}
      <div style={{ display: 'flex', position: 'absolute', left: 48, right: 48, bottom: 44, alignItems: 'flex-end', gap: 32 }}>
        <div style={{ display: 'flex', flexDirection: 'column', flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', fontSize: sizeFor(title, [[34, 54], [60, 46], [999, 40]]), fontWeight: 800, lineHeight: 1.1, letterSpacing: -1 }}>{title}</div>
          {p.facts && <div style={{ display: 'flex', marginTop: 14, fontSize: 27, fontWeight: 500, opacity: 0.92 }}>{p.facts}</div>}
        </div>
        {p.price && <div style={{ display: 'flex', flexShrink: 0, padding: '14px 28px', borderRadius: 22, background: a.primary, color: onColor(a.primary), fontSize: 44, fontWeight: 800, letterSpacing: -1 }}>{p.price}</div>}
      </div>
    </div>,
    3600,
  )
}
