// Casa 3D: la lettura dell'originale (read.ts) come VERITA' SEMANTICA sopra la geometria della pipeline. Niente AI qui,
// gira anche nel browser. La geometria (muri, contorni delle stanze) resta quella misurata; dalla lettura vengono:
//  - unioni: stanze della pipeline che cadono nella stessa stanza letta si uniscono (via i muri finti tra loro; con un
//    varco in mezzo restano i pilastrini e sparisce solo il varco);
//  - scale: il vano letto diventa una stanza "scala" (anche interna, ritagliata dalla stanza che la contiene), con verso,
//    stanze collegate e piano di arrivo non disegnato;
//  - nomi e tipi: nome scritto, tipo, mq e H scritti; esterni (resede, corte, giardino, terrazzo, "a comune") come
//    esterni; vani fuori da tutto quello che e' letto = fuori casa;
//  - porte: tipo dei collegamenti (ingresso, porta, varco, portafinestra) e porte a croce riaperte dove la lettura vede
//    un collegamento e la pipeline un muro; finestre mancanti sui muri esterni;
//  - dubbi della lettura (domande si'/no) e scala dai mq scritti.
import { addOpening, clone, frame, inPoly, mergeRooms, openAir, openingSides, polyDist, scaleFromWritten, splitRoom } from './build'
import { exteriorType, type Doubt, type OpType, type PlanRead, type PlanReadInfo, type Pt, type RawOpening, type RawPlan, type RawRoom } from './types'

const r3 = (v: number) => Math.round(v * 1000) / 1000
// tipi letti -> tipi del visore (cantina e garage come ripostiglio col nome scritto, loggia come balcone)
const TYPE: Record<string, string> = {
  soggiorno: 'soggiorno', salotto: 'soggiorno', pranzo: 'soggiorno', cucina: 'cucina', cucinotto: 'cucina', camera: 'camera', cameretta: 'cameretta',
  bagno: 'bagno', wc: 'bagno', ingresso: 'ingresso', corridoio: 'corridoio', disimpegno: 'corridoio', ripostiglio: 'ripostiglio', cantina: 'ripostiglio',
  garage: 'ripostiglio', lavanderia: 'lavanderia', studio: 'studio', scala: 'scala', balcone: 'balcone', loggia: 'balcone', terrazzo: 'terrazzo',
}
const NAME_OF: Record<string, string> = { cantina: 'Cantina', garage: 'Garage', loggia: 'Loggia', disimpegno: 'Disimpegno', lavanderia: 'Lavanderia' }

// punti di una griglia dentro il poligono (passo in metri)
function samples(P: Pt[], step = 0.15): Pt[] {
  const xs = P.map(q => q[0]), zs = P.map(q => q[1]), out: Pt[] = []
  for (let z = Math.min(...zs) + step / 2; z < Math.max(...zs); z += step) for (let x = Math.min(...xs) + step / 2; x < Math.max(...xs); x += step) if (inPoly(x, z, P)) out.push([x, z])
  return out.length ? out : [P[0]]
}
// quota di punti dentro Q (con 25 cm di tolleranza: i poligoni letti sono approssimati)
const share = (pts: Pt[], Q: Pt[], tol = 0.25) => pts.filter(q => inPoly(q[0], q[1], Q) || polyDist(q, Q) <= tol).length / pts.length
const bbox = (P: Pt[]) => { const xs = P.map(q => q[0]), zs = P.map(q => q[1]); return [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)] as [number, number, number, number] }
const segDist = (q: Pt, a: Pt, b: Pt) => { const { L, d } = frame(a, b), s = Math.max(0, Math.min(L, (q[0] - a[0]) * d[0] + (q[1] - a[1]) * d[1])); return Math.hypot(q[0] - a[0] - d[0] * s, q[1] - a[1] - d[1] * s) }

export function applySemantics(raw0: RawPlan, read: PlanRead, meta: { model: string; ms: number; usd: number }): RawPlan {
  let p = clone(raw0)
  const info: PlanReadInfo = { model: meta.model, ms: meta.ms, usd: meta.usd, rooms: read.rooms.length, matched: 0, merged: 0, typed: 0, reopened: 0, retyped: 0, windows: 0, stairs: 0, outdoor: 0 }
  const doubts: Doubt[] = read.doubts.map(d => ({ q: d.q, x: r3(d.x / 1000), y: r3(d.y / 1000), from: 'lettura' as const }))
  // 0-1000 sull'originale -> metri della pianta (inversa di toImage, come le scritte)
  const S = p.source, [a, b, c, d, e, f] = S.toImage, det = a * d - b * c, ppm = Math.sqrt(Math.abs(det))
  const toM = (gx: number, gy: number): Pt => { const px = gx / 1000 * S.imgW, py = gy / 1000 * S.imgH; return [(d * (px - e) - c * (py - f)) / det, (-b * (px - e) + a * (py - f)) / det] }
  const toImg01 = (q: Pt): [number, number] => [r3((a * q[0] + c * q[1] + e) / S.imgW), r3((b * q[0] + d * q[1] + f) / S.imgH)]
  const G = read.rooms.map(r => ({ ...r, P: r.poly.map(q => toM(q[0], q[1])) }))
  const OUT = read.outdoor.map(o => ({ ...o, P: o.poly.map(q => toM(q[0], q[1])) }))
  const STAIRS = read.stairs.map(s => ({ ...s, P: s.poly.map(q => toM(q[0], q[1])) }))
  const lenM = (w: number) => w / 1000 * Math.max(S.imgW, S.imgH) / ppm // lunghezza 0-1000 -> metri (circa: i lati dell'immagine sono simili)

  // stanza letta che contiene la stanza della pipeline (almeno meta' della sua superficie)
  const assign = () => {
    const m = new Map<number, string>()
    for (const r of p.rooms) {
      const pts = samples(r.poly)
      let best: { id: string; s: number } | null = null
      for (const g of G) { const s = share(pts, g.P); if (s >= 0.5 && (!best || s > best.s)) best = { id: g.id, s } }
      if (best) m.set(r.id, best.id)
    }
    return m
  }
  const between = (o: RawOpening) => openingSides(p, o).map(r => r?.id ?? -1)

  // 1. unioni: spezzoni della stessa stanza letta
  let own = assign()
  for (let pass = 0; pass < 2; pass++) {
    for (const g of G) {
      if (g.conf < 0.6 || g.type === 'scala') continue
      const ids = [...own].filter(([, gid]) => gid === g.id).map(([id]) => id)
      if (ids.length < 2) continue
      const byArea = ids.map(id => p.rooms.find(r => r.id === id)!).filter(Boolean).sort((u, v) => v.area - u.area)
      const base = byArea[0].id
      for (const o of byArea.slice(1)) {
        const ops = p.openings.filter(op => { const s = between(op); return s.includes(base) && s.includes(o.id) })
        // una porta in mezzo che anche la lettura vede: forse un vano che la lettura non ha separato (armadio,
        // ripostiglio), si chiede; una porta che la lettura non vede e' del ridisegno e va via con l'unione
        const seen = (op: RawOpening) => read.links.some(l => { const q = toM(l.x, l.y); return segDist(q, op.a, op.b) <= 0.8 })
        if (ops.some(op => (op.type === 'door' || op.type === 'entrance') && seen(op))) {
          const m = toImg01(o.center)
          if (!doubts.some(x => x.kind === `due-${base}-${o.id}`)) doubts.push({ q: `Qui ci sono due stanze separate da una porta (${g.name || NAME_OF[g.type] || g.type} e un vano di ${String(o.area).replace('.', ',')} m²)?`, x: m[0], y: m[1], from: 'lettura', kind: `due-${base}-${o.id}` })
          continue
        }
        const varchi = ops.filter(op => op.type === 'varco')
        // muro spesso tra i due senza varchi (portante): la lettura puo' sbagliare, si unisce solo il nome
        const thick = !varchi.length && p.walls.some(w => { if (w.t < 0.3) return false; const { L, d: dd, n } = frame(w.a, w.b), mid: Pt = [w.a[0] + dd[0] * L / 2, w.a[1] + dd[1] * L / 2], off = w.t / 2 + 0.2; const s = [1, -1].map(sg => p.rooms.find(r => inPoly(mid[0] + sg * n[0] * off, mid[1] + sg * n[1] * off, r.poly))?.id); return s.includes(base) && s.includes(o.id) })
        if (thick) continue
        const m = mergeRooms(p, base, o.id)
        if (m.rooms.length === p.rooms.length) continue // non si toccano
        // con un varco in mezzo i tratti di muro ai lati sono veri (pilastrini, mezze pareti): restano, va via il varco
        if (varchi.length) { m.walls = p.walls; m.openings = p.openings.filter(op => !varchi.includes(op)) }
        p = m; info.merged++
        own.delete(o.id)
      }
    }
    own = assign()
  }

  // 2. scale: il vano dei gradini letto diventa una stanza "scala" (ritagliata se sta dentro una stanza piu' grande)
  for (const s of STAIRS) {
    if (s.conf < 0.5) continue
    const sb = bbox(s.P), sArea = Math.max(0.3, (sb[2] - sb[0]) * (sb[3] - sb[1])), sc: Pt = [(sb[0] + sb[2]) / 2, (sb[1] + sb[3]) / 2]
    const spts = samples(s.P, 0.1)
    // vano della pipeline gia' fatto di soli gradini
    let room = p.rooms.find(r => r.type === 'scala' && share(samples(r.poly), s.P, 0.4) >= 0.4) ?? p.rooms.find(r => share(samples(r.poly), s.P, 0.15) >= 0.6 && r.area < sArea * 2.2)
    if (!room) {
      const host = p.rooms.map(r => ({ r, k: share(spts, r.poly, 0) })).filter(x => x.k >= 0.5).sort((u, v) => v.k - u.k)[0]?.r
      if (host && host.area > sArea * 1.3) { const cut = carve(p, host.id, sb, sc); if (cut) { p = cut.raw; room = p.rooms.find(r => r.id === cut.id) } }
      else if (host) room = host
    }
    if (!room) continue
    // scala fuori casa ma non in un esterno (resede, giardino, terrazzo): scala comune del palazzo, non e' della casa
    if (!s.inside && !OUT.some(o => share(spts, o.P, 0.5) >= 0.5)) { room.type = 'esterno'; delete room.label; delete room.stair; continue }
    room.type = 'scala'; delete room.label
    const hint = { ...(room.stair ?? {}) }
    if (s.goes) hint.goes = s.goes
    if (s.from) hint.from = nameOf(read, s.from)
    if (s.to) hint.to = nameOf(read, s.to)
    hint.to_missing = s.missing_floor
    if (!s.inside) hint.outdoor = true
    // freccia della salita: verso nei metri della pianta (asse e segno)
    if (s.arrow !== null) {
      const vx = Math.cos(s.arrow * Math.PI / 180), vy = Math.sin(s.arrow * Math.PI / 180), mx = (d * vx - c * vy) / det, mz = (-b * vx + a * vy) / det
      const ax: 'x' | 'z' = Math.abs(mx) >= Math.abs(mz) ? 'x' : 'z'
      if (!hint.axis || hint.axis === ax) { hint.axis = ax; hint.arrow = ((ax === 'x' ? mx : mz) > 0 ? 1 : -1) * (s.goes === 'giu' ? -1 : 1) as 1 | -1 }
    }
    // senza freccia: si sale verso la stanza di partenza se si scende (cucina -> cantina), verso quella d'arrivo se si sale
    else if (s.goes) {
      const gid = s.goes === 'giu' ? s.from : s.to, tr = gid ? p.rooms.find(r => r.id !== room!.id && own.get(r.id) === gid) : undefined
      if (tr) { const vx = tr.center[0] - sc[0], vz = tr.center[1] - sc[1], ax: 'x' | 'z' = Math.abs(vx) >= Math.abs(vz) ? 'x' : 'z'; if (!hint.axis || hint.axis === ax) { hint.axis = ax; hint.arrow = ((ax === 'x' ? vx : vz) > 0 ? 1 : -1) as 1 | -1 } }
    }
    room.stair = hint; info.stairs++
  }

  // 3. nomi, tipi, mq e H scritti; esterni; vani fuori da tutto = fuori casa
  own = assign()
  const hs: number[] = []
  const gmain = new Map<string, number>() // stanza letta -> stanza della pipeline piu' grande
  for (const [id, gid] of own) { const r = p.rooms.find(x => x.id === id)!, cur = gmain.get(gid); if (!cur || p.rooms.find(x => x.id === cur)!.area < r.area) gmain.set(gid, id) }
  for (const r of p.rooms) {
    const gid = own.get(r.id), g = gid ? G.find(x => x.id === gid) : undefined
    if (g) {
      info.matched++
      if (r.type === 'scala' && g.type !== 'scala') continue // la scala ritagliata resta scala
      const ext = exteriorType(g.name)
      const t = ext ?? TYPE[g.type] ?? (r.type === 'stanza' ? 'ripostiglio' : r.type)
      // spezzone non unito (porta in mezzo): prende il tipo solo se e' un passaggio, mai scala o stanza principale
      if (gmain.get(gid!) !== r.id && (t !== 'corridoio' || r.type !== 'stanza')) { if (t === 'corridoio' && r.type !== 'scala') r.type = t; continue }
      if (t !== r.type) info.typed++
      r.type = t
      const name = cleanName(g.name) || NAME_OF[g.type]
      if (name) r.label = name.slice(0, 40); else delete r.label
      if (g.mq && gmain.get(gid!) === r.id) r.written_mq = g.mq
      if (g.h && g.h >= 2.2 && g.h <= 4.5) hs.push(g.h)
      continue
    }
    if (r.type === 'scala') continue
    const pts = samples(r.poly)
    const o = OUT.map(x => ({ x, s: share(pts, x.P) })).filter(q => q.s >= 0.5).sort((u, v) => v.s - u.s)[0]?.x
    if (o) {
      const txt = `${o.label} ${o.type}${o.shared ? ' a comune' : ''}`
      const t = exteriorType(txt) ?? (['terrazzo'].includes(o.type) ? 'terrazzo' : ['balcone', 'loggia'].includes(o.type) ? 'balcone' : o.type === 'portico' ? 'cortile' : null)
      if (t) { r.type = t; if (o.label) r.label = o.label.slice(0, 40); info.outdoor++ }
      continue
    }
    // fuori da tutte le stanze lette: non e' della casa (pianerottolo comune, vani di altre unita', strada)
    const inAny = Math.max(0, ...G.map(g => share(pts, g.P, 0.1)), ...STAIRS.map(s => share(pts, s.P, 0.3)))
    if (inAny < 0.15 && !openAir(r) && G.length >= 2) { r.type = 'esterno'; delete r.label }
  }
  if (hs.length) { hs.sort((u, v) => u - v); p.height = Math.round(hs[Math.floor(hs.length / 2)] * 100) / 100 }

  // 4. collegamenti: tipo delle aperture e porte a croce riaperte
  own = assign()
  const roomsOf = (gid: string) => [...own].filter(([, x]) => x === gid).map(([id]) => id)
  const isOut = (id: number) => { if (id === -1) return true; const r = p.rooms.find(x => x.id === id); return !r || openAir(r) }
  const sideOk = (id: number, gid: string) => (gid === 'fuori' ? isOut(id) : roomsOf(gid).includes(id) || (!G.some(g => g.id === gid) && !isOut(id)))
  const used = new Set<RawOpening>()
  let k = 0
  for (const l of read.links) {
    if (l.conf < 0.5) continue
    const q = toM(l.x, l.y)
    const near = p.openings.filter(o => !used.has(o)).map(o => ({ o, dd: segDist(q, o.a, o.b) })).filter(x => x.dd <= 0.6).sort((u, v) => u.dd - v.dd)[0]?.o
    if (near) {
      used.add(near)
      const [s1, s2] = between(near), out1 = isOut(s1), out2 = isOut(s2)
      let t: OpType = near.type
      if (l.kind === 'ingresso' && (out1 || out2)) t = 'entrance'
      else if (l.kind === 'porta' && (near.type === 'varco' ? near.width <= 1.2 : near.type === 'entrance' ? !out1 && !out2 : near.type === 'window' ? !out1 && !out2 : false)) t = 'door'
      else if (l.kind === 'varco' && near.type === 'door' && (near.width >= 0.85 || (l.w !== null && lenM(l.w) >= 1))) t = 'varco'
      else if (l.kind === 'portafinestra' && near.type !== 'window' && (out1 || out2) && !(out1 && out2)) t = 'window'
      if (t !== near.type) { near.type = t; info.retyped++ }
      near.suspect = false
      continue
    }
    // nessuna apertura vicina: il muro piu' vicino che separa proprio quelle due stanze
    const want = l.between
    const cands = p.walls.map((w, wi) => ({ w, wi, dd: segDist(q, w.a, w.b) })).filter(x => x.dd <= Math.max(0.45, x.w.t / 2 + 0.3)).sort((u, v) => u.dd - v.dd)
    for (const { w, wi } of cands) {
      if (/^parapetto-/.test(w.label ?? '')) continue
      const { L, d: dd, n } = frame(w.a, w.b), s = Math.max(0, Math.min(L, (q[0] - w.a[0]) * dd[0] + (q[1] - w.a[1]) * dd[1])), m: Pt = [w.a[0] + dd[0] * s, w.a[1] + dd[1] * s]
      const off = w.t / 2 + 0.25, side = [1, -1].map(sg => p.rooms.find(r => inPoly(m[0] + sg * n[0] * off, m[1] + sg * n[1] * off, r.poly))?.id ?? -1)
      if (side[0] === side[1] || (isOut(side[0]) && isOut(side[1]))) continue
      const match = (sideOk(side[0], want[0]) && sideOk(side[1], want[1])) || (sideOk(side[0], want[1]) && sideOk(side[1], want[0]))
      if (!match) continue
      const type: OpType = l.kind === 'ingresso' ? 'entrance' : l.kind === 'varco' ? 'varco' : l.kind === 'portafinestra' ? 'window' : 'door'
      const width = type === 'varco' ? Math.min(2.4, Math.max(0.9, l.w ? lenM(l.w) : 1.2)) : type === 'entrance' ? 0.9 : type === 'window' ? 1.0 : 0.8
      if (L < width + 0.1) continue
      // niente sovrapposizioni con aperture gia' sul muro
      if (p.openings.some(o => segDist(m, o.a, o.b) < width / 2 + 0.15)) break
      p = addOpening(p, wi, m, type)
      const o = p.openings[p.openings.length - 1]
      const sc = Math.max(width / 2 + 0.05, Math.min(L - width / 2 - 0.05, s))
      o.a = [r3(w.a[0] + dd[0] * (sc - width / 2)), r3(w.a[1] + dd[1] * (sc - width / 2))]; o.b = [r3(w.a[0] + dd[0] * (sc + width / 2)), r3(w.a[1] + dd[1] * (sc + width / 2))]
      o.width = r3(width); o.rooms = side; o.label = `G${++k}`
      used.add(o); info.reopened++
      break
    }
  }

  // 5. finestre: porte verso fuori che la lettura vede come finestre; finestre mancanti sui muri esterni
  for (const wn of read.windows) {
    if (wn.conf < 0.6) continue
    const q = toM(wn.x, wn.y)
    const near = p.openings.map(o => ({ o, dd: segDist(q, o.a, o.b) })).filter(x => x.dd <= 0.7).sort((u, v) => u.dd - v.dd)[0]?.o
    if (near) {
      if (near.type !== 'window' && !used.has(near) && between(near).some(isOut) && !between(near).every(isOut)) { near.type = 'window'; info.retyped++ }
      continue
    }
    const w0 = p.walls.map((w, wi) => ({ w, wi, dd: segDist(q, w.a, w.b) })).filter(x => x.dd <= Math.max(0.4, x.w.t / 2 + 0.25) && !/^parapetto-/.test(x.w.label ?? '')).sort((u, v) => u.dd - v.dd)[0]
    if (!w0) continue
    const { L, d: dd, n } = frame(w0.w.a, w0.w.b), s = Math.max(0, Math.min(L, (q[0] - w0.w.a[0]) * dd[0] + (q[1] - w0.w.a[1]) * dd[1])), m: Pt = [w0.w.a[0] + dd[0] * s, w0.w.a[1] + dd[1] * s]
    const off = w0.w.t / 2 + 0.25, side = [1, -1].map(sg => p.rooms.find(r => inPoly(m[0] + sg * n[0] * off, m[1] + sg * n[1] * off, r.poly))?.id ?? -1)
    if (!(side.some(isOut) && !side.every(isOut)) || L < 0.8 || p.openings.some(o => segDist(m, o.a, o.b) < 0.75)) continue
    p = addOpening(p, w0.wi, m, 'window')
    const o = p.openings[p.openings.length - 1]; o.rooms = side; o.label = `GF${++k}`; info.windows++
  }

  // 6. dubbi e scala dai mq scritti
  p = scaleFromWritten(p)
  p.read = info
  p.doubts = [...(p.doubts ?? []).filter(x => x.from !== 'lettura'), ...doubts].slice(0, 12)
  return p
}

// nome scritto senza misure ne' a capo ("CORRIDOIO\n3.69m x 1.04m" -> "CORRIDOIO", "Camera 14,2 mq" -> "Camera")
export const cleanName = (t: string) => t.split(/\n/)[0].replace(/\b(h\s*=?\s*)?\d+([.,]\d+)?\s*(m²|mq|m2|m|cm)?(\s*x\s*\d+([.,]\d+)?\s*(m|cm)?)?/gi, ' ').replace(/[\s/(),:-]+$/, '').replace(/\s+/g, ' ').trim().slice(0, 40)
function nameOf(read: PlanRead, id: string) {
  if (id === 'fuori') return 'fuori'
  const g = read.rooms.find(r => r.id === id)
  return (g ? g.name || NAME_OF[g.type] || g.type : id).slice(0, 30)
}

// Ritaglio del vano scala dalla stanza che lo contiene: tagli dritti (senza muro) lungo i lati del rettangolo dei gradini,
// tenendo il pezzo piu' piccolo che contiene ancora tutta la scala. null se non si riesce.
function carve(raw: RawPlan, hostId: number, box: [number, number, number, number], c: Pt): { raw: RawPlan; id: number } | null {
  let p = raw, id = hostId
  const need = (box[2] - box[0]) * (box[3] - box[1])
  for (let round = 0; round < 2; round++) {
    const host = p.rooms.find(r => r.id === id)!
    let best: { raw: RawPlan; id: number; area: number } | null = null
    for (const [p1, p2] of [[[box[0] - 9, box[1]], [box[2] + 9, box[1]]], [[box[0] - 9, box[3]], [box[2] + 9, box[3]]], [[box[0], box[1] - 9], [box[0], box[3] + 9]], [[box[2], box[1] - 9], [box[2], box[3] + 9]]] as [Pt, Pt][]) {
      const s = splitRoom(p, id, p1, p2, 'passaggio', 0.3)
      if (s.rooms.length === p.rooms.length) continue
      const piece = s.rooms.find(r => (r.id === id || !p.rooms.some(x => x.id === r.id)) && inPoly(c[0], c[1], r.poly))
      if (!piece || piece.area < need * 0.7 || piece.area >= host.area - 0.2) continue
      if (!best || piece.area < best.area) best = { raw: s, id: piece.id, area: piece.area }
    }
    if (!best) break
    p = best.raw; id = best.id
    if (best.area < need * 1.8) break
  }
  if (id === hostId && p === raw) return null
  // i pezzi avanzati tornano un'unica stanza (tagli senza muro: si uniscono nell'aria, contorno chiuso di una cella)
  const rest = p.rooms.filter(r => r.id !== id && (r.id === hostId || !raw.rooms.some(x => x.id === r.id))).map(r => r.id)
  for (const x of rest.slice(1)) { const m = mergeRooms(p, rest[0], x, { close: 1 }); if (m.rooms.length < p.rooms.length) p = m }
  return { raw: p, id }
}
