// Casa 3D: controlli automatici sulla pianta, senza AI, con un punteggio 0-100. Servono a capire quanto fidarsi della
// lettura e a fare domande si'/no all'agente (salvate in raw.doubts; la schermata con le domande arriva dopo).
//  - minimi del DM 5/7/1975 (camera 9 m2, soggiorno 14 m2): tante stanze sotto i minimi = scala probabilmente piccola
//  - somma dei mq contro i mq scritti sulle stanze e contro i mq dell'annuncio
//  - porte larghe 60-120 cm e dentro un muro (stipiti attaccati a muri allineati)
//  - scala che arriva su un'apertura (o a un piano non disegnato), non contro un muro
import { frame, inPoly, openAir, openingSides, totalArea } from './build'
import type { Doubt, PlanChecks, Pt, RawPlan } from './types'

const MIN: Record<string, number> = { camera: 9, soggiorno: 14 }
const fmt = (v: number, n = 1) => v.toFixed(n).replace('.', ',')

export function planChecks(raw: RawPlan, o: { areaM2?: number } = {}): { checks: PlanChecks; doubts: Doubt[] } {
  const items: PlanChecks['items'] = [], doubts: Doubt[] = []
  const S = raw.source, [a, b, c, d, e, f] = S.toImage
  const at01 = (q: Pt) => [Math.round((a * q[0] + c * q[1] + e) / S.imgW * 1000) / 1000, Math.round((b * q[0] + d * q[1] + f) / S.imgH * 1000) / 1000] as [number, number]
  let scaleHint: number | undefined

  // 1. minimi del DM 5/7/1975
  const main = raw.rooms.filter(r => MIN[r.type])
  const small = main.filter(r => r.area < MIN[r.type] * 0.92)
  if (main.length) {
    const ok = small.length <= main.length / 3
    if (!ok) {
      // fattore d'area che porterebbe la mediana delle stanze principali ai minimi
      const k = main.map(r => MIN[r.type] / r.area).sort((u, v) => u - v)[Math.floor(main.length / 2)]
      if (k > 1.1) scaleHint = Math.round(k * 100) / 100
      const r0 = small.sort((u, v) => u.area - v.area)[0], m = at01(r0.center)
      doubts.push({ q: `${small.length} stanze su ${main.length} sono sotto i minimi di legge (es. ${r0.label || r0.type} ${fmt(r0.area)} m²): la casa e' piu' grande di come l'abbiamo misurata?`, x: m[0], y: m[1], from: 'controlli', kind: 'scala' })
    }
    items.push({ id: 'dm_minimi', ok, weight: 25, msg: ok ? `stanze principali sopra i minimi del DM 5/7/1975 (${main.length - small.length} su ${main.length})` : `${small.length} stanze su ${main.length} sotto i minimi (camera 9 m², soggiorno 14 m²): scala forse piccola${scaleHint ? `, area x${fmt(scaleHint, 2)}` : ''}` })
  }

  // 2. mq: scritti sulle stanze e dell'annuncio
  const wr = raw.rooms.filter(r => r.written_mq && r.area > 0.5)
  if (wr.length) {
    const sw = wr.reduce((s, r) => s + r.written_mq!, 0), sa = wr.reduce((s, r) => s + r.area, 0), k = sa / sw
    const ok = Math.abs(k - 1) <= 0.15
    items.push({ id: 'mq_scritti', ok, weight: 20, msg: `mq delle stanze con la misura scritta: ${fmt(sa)} contro ${fmt(sw)} scritti (${k >= 1 ? '+' : ''}${Math.round((k - 1) * 100)}%)` })
  }
  const tot = totalArea(raw)
  if (o.areaM2) {
    // superficie commerciale dell'annuncio: muri, balconi in quota e altri piani inclusi, quindi la netta e' di solito il 60-95%
    const k = tot / o.areaM2, ok = k >= 0.45 && k <= 1.05
    items.push({ id: 'mq_annuncio', ok, weight: 10, msg: `superficie interna ${fmt(tot)} m² su ${o.areaM2} m² dell'annuncio (${Math.round(k * 100)}%)` })
  }

  // 3. porte 60-120 cm dentro un muro
  const doors = raw.openings.filter(x => x.type === 'door' || x.type === 'entrance')
  const bad = doors.filter(op => {
    if (op.width < 0.6 || op.width > 1.2) return true
    const { d: dd } = frame(op.a, op.b)
    // ai due stipiti un muro (o un'altra apertura) sulla stessa linea entro 15 cm
    const jamb = (q: Pt) => [...raw.walls, ...raw.openings].some(w => {
      if (w === op) return false
      const fw = frame(w.a, w.b); if (Math.abs(fw.d[0] * dd[0] + fw.d[1] * dd[1]) < 0.9) return false
      const s = (q[0] - w.a[0]) * fw.d[0] + (q[1] - w.a[1]) * fw.d[1], off = Math.abs((q[0] - w.a[0]) * fw.n[0] + (q[1] - w.a[1]) * fw.n[1])
      return off <= Math.max(w.t, op.t) / 2 + 0.08 && s >= -0.15 && s <= fw.L + 0.15
    })
    return !jamb(op.a) || !jamb(op.b)
  })
  if (doors.length) items.push({ id: 'porte', ok: bad.length <= Math.max(1, doors.length * 0.15), weight: 15, msg: bad.length ? `${bad.length} porte su ${doors.length} fuori misura (60-120 cm) o non dentro un muro` : `porte nella misura e dentro i muri (${doors.length})` })

  // 4. scale: arrivo su un'apertura (o piano non disegnato)
  for (const s of raw.rooms.filter(r => r.type === 'scala')) {
    const st = s.stair ?? {}
    if (st.to_missing || st.outdoor) { items.push({ id: `scala_${s.id}`, ok: true, weight: 10, msg: st.to_missing ? `scala verso ${st.to || 'un piano'} non disegnato: rampa tagliata` : 'scala esterna' }); continue }
    const links = raw.openings.filter(op => op.type !== 'window').map(op => openingSides(raw, op)).filter(([x, y]) => x?.id === s.id || y?.id === s.id)
    // vano senza muri attorno (ritagliato da una stanza): si arriva dalla stanza accanto
    const open = s.poly.some((q, i) => { const n = s.poly[(i + 1) % s.poly.length], m: Pt = [(q[0] + n[0]) / 2, (q[1] + n[1]) / 2]; return !raw.walls.some(w => { const fw = frame(w.a, w.b), off = Math.abs((m[0] - w.a[0]) * fw.n[0] + (m[1] - w.a[1]) * fw.n[1]), t = (m[0] - w.a[0]) * fw.d[0] + (m[1] - w.a[1]) * fw.d[1]; return off <= w.t / 2 + 0.15 && t >= 0 && t <= fw.L }) && raw.rooms.some(r => r.id !== s.id && !openAir(r) && inPoly(m[0] + (n[1] - q[1]) * 0.05, m[1] - (n[0] - q[0]) * 0.05, r.poly)) })
    const ok = links.length > 0 || open
    items.push({ id: `scala_${s.id}`, ok, weight: 10, msg: ok ? `scala collegata (${links.length} aperture${open ? ', lato aperto' : ''})` : 'scala senza aperture: arriva contro un muro' })
    if (!ok) { const m = at01(s.center); doubts.push({ q: 'La scala arriva contro un muro: c\'e\' una porta che non abbiamo visto?', x: m[0], y: m[1], from: 'controlli', kind: 'scala_muro' }) }
  }

  const W = items.reduce((s, x) => s + x.weight, 0)
  const score = W ? Math.round(items.reduce((s, x) => s + (x.ok ? x.weight : 0), 0) / W * 100) : 100
  return { checks: { score, items, ...(scaleHint ? { scale_hint: scaleHint } : {}) }, doubts }
}

// controlli e dubbi nella pianta (i dubbi dei controlli si rifanno, quelli della lettura restano)
export function withChecks(raw: RawPlan, o: { areaM2?: number } = {}): RawPlan {
  const { checks, doubts } = planChecks(raw, o)
  return { ...raw, checks, doubts: [...(raw.doubts ?? []).filter(x => x.from !== 'controlli'), ...doubts].slice(0, 14) }
}
