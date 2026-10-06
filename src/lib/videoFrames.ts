// Fotogrammi presi nel browser dal video che l'agente ha appena scelto (Con te in video): niente attesa del caricamento.
// La rotazione del telefono la applica gia' il browser (videoWidth/videoHeight sono quelli che si vedono).

async function open(url: string): Promise<HTMLVideoElement> {
  const v = document.createElement('video')
  // crossOrigin: anche il video su R2 (CORS aperto) si puo' disegnare nel canvas
  v.muted = true; v.playsInline = true; v.preload = 'auto'; if (!url.startsWith('blob:')) v.crossOrigin = 'anonymous'; v.src = url
  await new Promise<void>((ok, ko) => { v.onloadeddata = () => ok(); v.onerror = () => ko(new Error('video')) })
  return v
}
const seek = (v: HTMLVideoElement, t: number) => new Promise<void>(ok => { v.onseeked = () => ok(); v.currentTime = t })

// griglia di fotogrammi piccoli, uno ogni `step` secondi (max 40 s), per trovare il momento in cui l'agente esce.
// Piu' l'ultimo fotogramma del video (end): col telefono in mano si smette di girare appena usciti e la stanza vuota
// dura mezzo secondo; senza l'ultimo fotogramma non la si vedeva mai (06/10, video reale in terrazza: "non vedo l'uscita")
export async function videoGrid(url: string, step = 0.5): Promise<{ grid: string; n: number; cols: number; tw: number; th: number; duration: number; end?: number }> {
  const v = await open(url)
  const duration = Math.min(v.duration || 0, 40)
  const regular = Math.max(1, Math.floor(duration / step))
  const last = Math.max(0, (v.duration || 0) - 0.05)
  const end = v.duration && v.duration <= 40 && last - (regular - 1) * step > 0.15 ? Math.round(last * 100) / 100 : undefined
  const n = regular + (end === undefined ? 0 : 1)
  const portrait = v.videoHeight >= v.videoWidth
  // riquadri grandi abbastanza da vedere una persona scura in una stanza scura (prova del 29/09: a 320 px Sonnet trova l'uscita al riquadro)
  const th = portrait ? 320 : 180, tw = Math.round(th * v.videoWidth / v.videoHeight), cols = 6
  const c = document.createElement('canvas')
  c.width = tw * cols; c.height = th * Math.ceil(n / cols)
  const g = c.getContext('2d')!
  for (let k = 0; k < n; k++) { await seek(v, k === regular ? end! : k * step); g.drawImage(v, (k % cols) * tw, Math.floor(k / cols) * th, tw, th) }
  return { grid: c.toDataURL('image/jpeg', 0.8), n, cols, tw, th, duration, ...(end === undefined ? {} : { end }) }
}

// nitidezza di un fotogramma (energia dei bordi su grigi): col telefono in mano molti fotogrammi sono mossi
export function sharpness(d: ArrayLike<number>, w: number, h: number, ch = 4): number {
  let e = 0
  for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
    const i = (y * w + x) * ch, l = d[i - ch] + d[i - ch + 1], r = d[i + ch] + d[i + ch + 1], u = d[i - w * ch] + d[i - w * ch + 1], b = d[i + w * ch] + d[i + w * ch + 1]
    e += (r - l) * (r - l) + (b - u) * (b - u)
  }
  return e / ((w - 2) * (h - 2))
}

// istante piu' nitido tra from e to (stanza vuota appena uscito): da li' partono la foto della stanza e il taglio
export async function sharpestAt(url: string, from: number, to: number): Promise<number> {
  if (!(to - from > 0.03)) return from
  const v = await open(url)
  const tw = 160, th = Math.round(tw * v.videoHeight / v.videoWidth) || 284
  const c = document.createElement('canvas')
  c.width = tw; c.height = th
  const g = c.getContext('2d', { willReadFrequently: true })!
  let best = { t: from, s: -1 }
  for (let t = from; t <= to + 1e-6; t += 1 / 15) {
    await seek(v, t); g.drawImage(v, 0, 0, tw, th)
    const s = sharpness(g.getImageData(0, 0, tw, th).data, tw, th)
    if (s > best.s * 1.05) best = { t, s } // a parita' (5%) resta il primo: il taglio piu' vicino all'uscita
  }
  return Math.round(best.t * 100) / 100
}

// fotogramma all'istante `at`, ritagliato come il video del montaggio (720x1280 o 1280x720)
export async function videoFrame(url: string, at: number): Promise<string> {
  const v = await open(url)
  await seek(v, Math.min(at, Math.max(0, (v.duration || at) - 0.05)))
  const portrait = v.videoHeight >= v.videoWidth
  const [W, H] = portrait ? [720, 1280] : [1280, 720]
  const k = Math.max(W / v.videoWidth, H / v.videoHeight)
  const c = document.createElement('canvas')
  c.width = W; c.height = H
  c.getContext('2d')!.drawImage(v, (W - v.videoWidth * k) / 2, (H - v.videoHeight * k) / 2, v.videoWidth * k, v.videoHeight * k)
  return c.toDataURL('image/jpeg', 0.92)
}

// miniature per la striscia del cursore (n fotogrammi a distanza uguale), piccole
export async function videoThumbs(url: string, n = 10): Promise<string[]> {
  const v = await open(url)
  const d = v.duration || 1, th = 120, tw = Math.round(th * v.videoWidth / v.videoHeight)
  const c = document.createElement('canvas')
  c.width = tw; c.height = th
  const g = c.getContext('2d')!
  const out: string[] = []
  for (let i = 0; i < n; i++) { await seek(v, Math.min(d - 0.05, (i + 0.5) * d / n)); g.drawImage(v, 0, 0, tw, th); out.push(c.toDataURL('image/jpeg', 0.7)) }
  return out
}

// durata del video (per prendere la stanza a meta' della camminata)
export async function videoDuration(url: string): Promise<number> {
  const v = await open(url)
  return v.duration || 0
}
