// Fotogrammi presi nel browser dal video che l'agente ha appena scelto (Con te in video): niente attesa del caricamento.
// La rotazione del telefono la applica gia' il browser (videoWidth/videoHeight sono quelli che si vedono).

async function open(url: string): Promise<HTMLVideoElement> {
  const v = document.createElement('video')
  v.muted = true; v.playsInline = true; v.preload = 'auto'; v.src = url
  await new Promise<void>((ok, ko) => { v.onloadeddata = () => ok(); v.onerror = () => ko(new Error('video')) })
  return v
}
const seek = (v: HTMLVideoElement, t: number) => new Promise<void>(ok => { v.onseeked = () => ok(); v.currentTime = t })

// griglia di fotogrammi piccoli, uno ogni `step` secondi (max 40 s), per trovare il momento in cui l'agente esce
export async function videoGrid(url: string, step = 0.5): Promise<{ grid: string; n: number; cols: number; tw: number; th: number; duration: number }> {
  const v = await open(url)
  const duration = Math.min(v.duration || 0, 40)
  const n = Math.max(1, Math.floor(duration / step))
  const portrait = v.videoHeight >= v.videoWidth
  // riquadri grandi abbastanza da vedere una persona scura in una stanza scura (prova del 29/09: a 320 px Sonnet trova l'uscita al riquadro)
  const th = portrait ? 320 : 180, tw = Math.round(th * v.videoWidth / v.videoHeight), cols = 6
  const c = document.createElement('canvas')
  c.width = tw * cols; c.height = th * Math.ceil(n / cols)
  const g = c.getContext('2d')!
  for (let k = 0; k < n; k++) { await seek(v, k * step); g.drawImage(v, (k % cols) * tw, Math.floor(k / cols) * th, tw, th) }
  return { grid: c.toDataURL('image/jpeg', 0.8), n, cols, tw, th, duration }
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
