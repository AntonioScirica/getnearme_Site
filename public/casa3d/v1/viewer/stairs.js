// Scale vere nei vani "scala": rampe con gradini (alzata ~17 cm, pedata ~28 cm) nella direzione letta dalla
// planimetria (room.stair.axis) o lungo il lato lungo, pianerottolo nelle scale a due rampe, ringhiera semplice sui
// lati aperti, buco nel solaio (sopra la rampa che sale, nel pavimento per quella che scende) con le pareti del vano.
// Case su piu' piani: la scala dei piani bassi sale, quella dell'ultimo piano scende (si cambia piano camminando).
// Casa a un piano: la scala sale fino al soffitto e li' e' tagliata come i muri (sezione scura): continua sopra.
// Scale esterne (nel resede, room.stair.outdoor): rampa all'aperto, niente soffitto ne' muri attorno.
// Scala verso un piano che non e' nel modello (cut = quota del taglio dei muri): niente pianerottolo in cima; la rampa
// prosegue oltre i gradini disegnati finche' c'e' spazio e si taglia alla quota dei muri, con la sezione scura.
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { worldUV } from './materials.js'

const RISE = 0.175, TREAD = 0.28, TMIN = 0.25, TMAX = 0.31, MAXR = 0.2
const OPEN_T = new Set(['balcone', 'terrazzo', 'giardino', 'cortile'])

// punto (lungo l'asse, di traverso) -> (x, z)
const xz = (axis, a, p) => (axis === 'x' ? [a, p] : [p, a])
const yawOf = (dx, dz) => Math.atan2(dx, -dz) // verso dello sguardo nella camminata (avanti = sin, -cos)

// Disposizione della scala nel rettangolo utile della stanza. dir 'up' | 'down', R dislivello tra i piani, base quota
// del pavimento (esterni a -10 cm), center = centro della casa (le scale esterne salgono verso la casa)
export function layoutStair(room, plan, { dir = 'up', R = 2.97, base = 0, center = null, cut = null, blocked = null, linked = false } = {}) {
  const [X0, Z0, X1, Z1] = room.rect
  const byId = new Map(plan.rooms.map(r => [r.id, r]))
  const doors = plan.doors.filter(d => d.rooms.includes(room.id))
  const other = d => (d.rooms[0] === room.id ? d.rooms[1] : d.rooms[0])
  const isMain = d => { const o = byId.get(other(d)); return !!o && !OPEN_T.has(o.type) && o.type !== 'scala' && !d.entrance }
  const main = doors.filter(isMain).sort((a, b) => (byId.get(other(b))?.area || 0) - (byId.get(other(a))?.area || 0))[0] || doors[0] || null
  const dc = d => [(d.rect[0] + d.rect[2]) / 2, (d.rect[1] + d.rect[3]) / 2]
  const sideOf = d => { const [cx, cz] = dc(d); return [['N', Math.abs(cz - Z0)], ['S', Math.abs(cz - Z1)], ['W', Math.abs(cx - X0)], ['E', Math.abs(cx - X1)]].sort((a, b) => a[1] - b[1])[0][0] }
  const Nfull = Math.max(3, Math.round(R / RISE)), Nsteep = Math.max(3, Math.ceil(R / MAXR))
  const hint = room.stair?.axis
  // rampa e pianerottolo disegnati sulla planimetria (scale esterne): si fanno dove sono, come sono. La scala arriva
  // sempre a un pianerottolo: quello disegnato, o uno largo quanto la rampa e profondo almeno quanto e' larga
  // scala interna che scende (letta sulla planimetria, es. cucina -> cantina): anche lei come disegnata
  // scala com'e' disegnata, pezzo per pezzo (rampe, ventagli, pianerottolo): stairs.ts sul server
  if (room.stair?.path?.length) { const P = fromPath(room, { dir, R, base, linked }); if (P) return finish(P) }
  const drawn = room.stair?.flight && room.stair?.treads >= 2 && (room.stair.outdoor || dir === 'up' || room.stair.goes === 'giu') ? fromDrawing(room, { dir, R, base, center, cut, blocked }) : null
  if (drawn) return finish(drawn)
  const cands = []
  for (const axis of ['x', 'z']) {
    const A0 = axis === 'x' ? X0 : Z0, A1 = axis === 'x' ? X1 : Z1, P0 = axis === 'x' ? Z0 : X0, P1 = axis === 'x' ? Z1 : X1
    const L = A1 - A0, W = P1 - P0
    if (W < 0.7 || L < 0.75) continue
    for (const nearLo of [true, false]) {
      const s = nearLo ? 1 : -1, near = nearLo ? A0 : A1, far = nearLo ? A1 : A0
      const endName = lo => (axis === 'x' ? (lo ? 'W' : 'E') : (lo ? 'N' : 'S'))
      const nearSide = endName(nearLo), farSide = endName(!nearLo)
      const alongOf = d => { const a0 = axis === 'x' ? d.rect[0] : d.rect[1], a1 = axis === 'x' ? d.rect[2] : d.rect[3]; return nearLo ? [a0 - A0, a1 - A0] : [A1 - a1, A1 - a0] }
      // spazio libero davanti alla porta principale prima del primo gradino
      let pad = 0
      // porta sul lato corto di partenza: si entra dritti sul primo gradino; porta su un lato lungo: la rampa parte dopo
      if (main) { const sd = sideOf(main); if (sd !== nearSide && sd !== farSide) pad = Math.max(0, Math.min(L - 0.6, alongOf(main)[1] + 0.06)) }
      // numero di gradini: pieno (alzata 17,5), piu' ripido (fino a 20), o scala tagliata (non ci sta)
      const treads = (run, perFlight) => {
        const need = perFlight ? Math.ceil((Nfull - 2) / 2) : Nfull - 1, steep = perFlight ? Math.ceil((Nsteep - 2) / 2) : Nsteep - 1
        if (run / need >= TMIN) return { n: need, N: perFlight ? Nfull : Nfull, t: Math.min(TMAX, run / need), full: true }
        if (run / steep >= TMIN) return { n: steep, N: perFlight ? 2 * steep + 2 : Nsteep, t: Math.min(TMAX, run / steep), full: true }
        const n = Math.max(2, Math.floor(run / 0.26 + 1e-6)); return { n, N: perFlight ? 2 * n + 2 : n + 1, t: Math.min(TREAD, run / n), full: false } // tagliata: piu' gradini possibili
      }
      // rampa unica, contro uno dei lati lunghi se il vano e' largo (resta un passaggio accanto)
      {
        // scala esterna senza disegno: arriva sempre a un pianerottolo (largo come la rampa, profondo almeno 80 cm)
        const w = W < 1.9 ? Math.min(W, 1.25) : 1.1, landD = room.stair?.outdoor && dir === 'up' && cut === null ? Math.max(0.8, Math.min(1.2, w)) : 0
        const run = L - pad - landD
        if (run >= 2 * TMIN) {
          const T = treads(run, false), r = T.full ? R / T.N : RISE
          for (const lat of W - w > 0.05 ? [0, 1] : [0]) {
            const p0 = lat ? P1 - w : P0, p1 = p0 + w
            let a0, a1, yLow, rs
            if (dir === 'up') { a1 = far - s * landD; a0 = a1 - s * T.n * T.t; yLow = base; rs = s } // sale verso il fondo: in fondo il buco nel soffitto
            else { a0 = near + s * pad; a1 = a0 + s * T.n * T.t; yLow = base - (T.n + 1) * r; rs = -s } // scende dal lato della porta
            const f = { kind: 'flight', axis, rs, a: [Math.min(a0, a1), Math.max(a0, a1)], p: [p0, p1], yLow, n: T.n, r, t: T.t }
            const parts = [f]
            if (landD) parts.push({ kind: 'landing', axis, a: [Math.min(far - s * landD, far), Math.max(far - s * landD, far)], p: [p0, p1], y: yLow + (T.n + 1) * r })
            cands.push({ shape: 'dritta', axis, parts, N: T.N, full: T.full, nearLo, s, near, far, pad, W, P0, P1 })
          }
        }
      }
      // due rampe affiancate con pianerottolo in fondo (a U)
      {
        const wf = Math.min(1.15, (W - 0.06) / 2), landD = Math.max(0.85, wf), run = L - pad - landD
        if (wf >= 0.72 && run >= 2 * TMIN) {
          const T = treads(run, true), r = T.full ? R / T.N : RISE, n1 = T.n, n2 = T.full ? T.N - 2 - n1 : T.n
          if (n2 >= 1) {
            const off = dir === 'up' ? 0 : -(n1 + n2 + 2) * r // dall'alto: tutto spostato in basso, il ritorno arriva al piano
            const la = [far - s * landD, far], aEnd = far - s * landD
            for (const first of [0, 1]) {
              const pA = first ? [P1 - wf, P1] : [P0, P0 + wf], pB = first ? [P0, P0 + wf] : [P1 - wf, P1]
              const f1 = { kind: 'flight', axis, rs: s, a: [Math.min(aEnd - s * n1 * T.t, aEnd), Math.max(aEnd - s * n1 * T.t, aEnd)], p: pA, yLow: base + off, n: n1, r, t: T.t }
              const yL = base + off + (n1 + 1) * r
              const land = { kind: 'landing', axis, a: [Math.min(...la), Math.max(...la)], p: [P0, P1], y: yL }
              const f2 = { kind: 'flight', axis, rs: -s, a: [Math.min(aEnd - s * n2 * T.t, aEnd), Math.max(aEnd - s * n2 * T.t, aEnd)], p: pB, yLow: yL, n: n2, r, t: T.t }
              cands.push({ shape: 'U', axis, parts: [f1, land, f2], N: T.N, full: T.full, nearLo, s, near, far, pad, W, P0, P1 })
            }
          }
        }
      }
    }
  }
  if (!cands.length) return null
  // punteggio: piu' gradini (fino al dislivello), nessuna porta chiusa dalla rampa, verso letto sulla planimetria
  const score = c => {
    let sc = Math.min(c.N, Nfull) * 10 - (c.full ? 0 : 25) - (c.shape === 'U' ? 4 : 0) + (hint && c.axis === hint ? 30 : 0)
    for (const d of doors) {
      const [cx, cz] = dc(d), sd = sideOf(d), q = [cx + (sd === 'W' ? 0.35 : sd === 'E' ? -0.35 : 0), cz + (sd === 'N' ? 0.35 : sd === 'S' ? -0.35 : 0)] // davanti alla porta
      const h = heightIn(c.parts, q[0], q[1])
      if (h !== null && Math.abs(h - base) > 0.2) sc -= d === main ? 60 : 35
    }
    // la cima (pianerottolo o ultimo gradino) mai davanti a una finestra
    const topPart = c.parts.find(x => x.kind === 'landing') || c.parts.filter(x => x.kind === 'flight').at(-1)
    const tb = (() => { const [x0, z0] = xz(topPart.axis, topPart.a[0], topPart.p[0]), [x1, z1] = xz(topPart.axis, topPart.a[1], topPart.p[1]); return [Math.min(x0, x1) - 0.35, Math.min(z0, z1) - 0.35, Math.max(x0, x1) + 0.35, Math.max(z0, z1) + 0.35] })()
    if (plan.windows.some(wn => wn.rect[0] < tb[2] && wn.rect[2] > tb[0] && wn.rect[1] < tb[3] && wn.rect[3] > tb[1])) sc -= 40
    if (center && c.parts.length) { // scala esterna: la parte alta verso la casa
      const top = topEnd(c), low = lowEnd(c)
      if (Math.hypot(top[0] - center[0], top[1] - center[1]) < Math.hypot(low[0] - center[0], low[1] - center[1])) sc += 8
    }
    return sc
  }
  cands.sort((a, b) => score(b) - score(a))
  return finish(cands[0])
  function finish(c) {
  const xs = [], zs = []
  for (const p of c.parts) {
    if (p.kind === 'wedge') { for (const [x, z] of p.poly) { xs.push(x); zs.push(z) } continue }
    for (const a of p.a) for (const q of p.p) { const [x, z] = xz(p.axis, a, q); xs.push(x); zs.push(z) }
  }
  const hole = [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)]
  const top = c.parts.reduce((m, p) => Math.max(m, p.kind === 'landing' || p.kind === 'wedge' ? p.y : p.yLow + (p.n + 1) * p.r), -99)
  const bottom = c.parts.reduce((m, p) => Math.min(m, p.kind === 'landing' || p.kind === 'wedge' ? p.y : p.yLow), 99)
  return { ...c, dir, R, base, hole, top, bottom, room: room.id, rect: room.rect, poseLow: endPose(c, 'low'), poseHigh: endPose(c, 'high') }
  }
}

// Scala come disegnata (room.stair.path, dall'ingresso al piano della pianta verso l'altro capo): rampe dritte, gradini
// a ventaglio (uno spicchio per gradino), pianerottolo. Alzata ~17 cm; tra due piani del modello l'alzata divide il
// dislivello se il conto torna (14-22 cm). Niente rampa inventata: i gradini sono quelli disegnati, poi il pianerottolo
// disegnato (o niente). Sale (o scende, dir 'down', dentro un'apertura nel pavimento) dall'ingresso.
function fromPath(room, { dir, R, base, linked }) {
  const path = room.stair.path
  const steps = path.reduce((t, q) => t + (q.k === 'land' ? 0 : q.n), 0)
  if (!steps) return null
  const N = steps + 1, rr = R / N
  const r = linked && rr >= 0.14 && rr <= 0.22 ? rr : RISE, sg = dir === 'down' ? -1 : 1
  const parts = []
  let h = base, first = null, last = null // capi: punto e verso di marcia (dall'ingresso)
  path.forEach((q, i) => {
    if (q.k === 'run') {
      const [x0, z0, x1, z1] = q.box, axis = q.axis
      const a = axis === 'x' ? [x0, x1] : [z0, z1], p = axis === 'x' ? [z0, z1] : [x0, x1], t = (a[1] - a[0]) / q.n
      // salendo i gradini crescono nel verso di marcia; scendendo crescono verso l'ingresso
      if (sg > 0) parts.push({ kind: 'flight', axis, rs: q.dir, a, p, yLow: h, n: q.n, r, t })
      else parts.push({ kind: 'flight', axis, rs: -q.dir, a, p, yLow: h - (q.n + 1) * r, n: q.n, r, t })
      h += sg * q.n * r
      const pm = (p[0] + p[1]) / 2, aIn = q.dir > 0 ? a[0] : a[1], aOut = q.dir > 0 ? a[1] : a[0], d = xz(axis, q.dir, 0)
      if (!first) first = { pt: xz(axis, aIn, pm), d }
      last = { pt: xz(axis, aOut, pm), d }
    } else if (q.k === 'fan') {
      q.wedges.forEach(poly => { h += sg * r; parts.push({ kind: 'wedge', poly, y: h }) })
      // capi: lato d'ingresso del primo spicchio e d'uscita dell'ultimo (verso = dal centro del primo al secondo)
      const cen = P => [P.reduce((t, v) => t + v[0], 0) / P.length, P.reduce((t, v) => t + v[1], 0) / P.length]
      const c0 = cen(q.wedges[0]), c1 = cen(q.wedges[Math.min(1, q.wedges.length - 1)]), cl = cen(q.wedges.at(-1)), cp = cen(q.wedges.at(-2) || q.wedges[0])
      const nrm = (u, v) => { const L = Math.hypot(v[0] - u[0], v[1] - u[1]) || 1; return [(v[0] - u[0]) / L, (v[1] - u[1]) / L] }
      if (!first) first = { pt: c0, d: nrm(c0, c1) }
      last = { pt: cl, d: nrm(cp, cl) }
    } else {
      const [x0, z0, x1, z1] = q.box
      // pianerottolo in cima (dopo i gradini) o all'ingresso (alla quota del piano)
      const y = i === 0 ? base : h + sg * r
      parts.push({ kind: 'landing', axis: 'x', a: [x0, x1], p: [z0, z1], y })
      if (i > 0) { h = y; if (last) last = { pt: [(x0 + x1) / 2, (z0 + z1) / 2], d: last.d } }
    }
  })
  if (!first) return null
  const top = sg > 0 ? h : base, bottom = sg > 0 ? base : h
  return { shape: 'disegnata', dir, axis: room.stair.axis || 'x', parts, N, full: linked && r === rr, nearLo: true, s: 1, pad: 0, W: 0, P0: -1e9, P1: 1e9, drawn: true, path: true, ends: { first, last }, pathTop: top, pathBottom: bottom, r }
}

function fromDrawing(room, { dir, R, base, center, cut = null, blocked = null }) {
  const st = room.stair, axis = st.axis || ((st.flight[2] - st.flight[0]) >= (st.flight[3] - st.flight[1]) ? 'x' : 'z')
  const [fx0, fz0, fx1, fz1] = st.flight
  const a = axis === 'x' ? [fx0, fx1] : [fz0, fz1], p = axis === 'x' ? [fz0, fz1] : [fx0, fx1]
  const n = st.treads, t = (a[1] - a[0]) / n, w = p[1] - p[0]
  // verso: verso il pianerottolo disegnato; se manca, verso la casa
  let rs = st.up
  if (!rs) { const mid = (p[0] + p[1]) / 2, [lx, lz] = xz(axis, a[0], mid), [hx, hz] = xz(axis, a[1], mid); rs = center && Math.hypot(hx - center[0], hz - center[1]) > Math.hypot(lx - center[0], lz - center[1]) ? -1 : 1 }
  if (cut !== null && dir === 'up') {
    // piano di arrivo non nel modello: dal piede la rampa sale con l'alzata vera finche' arriva al taglio dei muri o trova
    // un muro (o una stanza della casa); niente pianerottolo. Sotto i gradini disegnati non si scende mai.
    const tt = Math.max(0.22, Math.min(TMAX, t)), need = Math.max(n, Math.ceil((cut - base) / RISE) - 1), start = rs > 0 ? a[0] : a[1]
    const free = k => { const am = start + rs * (k + 0.5) * tt; return !blocked || ![0.15, 0.5, 0.85].some(f => { const [x, z] = xz(axis, am, p[0] + (p[1] - p[0]) * f); return blocked(x, z) }) }
    let m = 0
    while (m < need && (m < n || free(m))) m++
    const a2 = rs > 0 ? [start, start + m * tt] : [start - m * tt, start]
    const parts = [{ kind: 'flight', axis, rs, a: a2, p: [...p], yLow: base, n: m, r: RISE, t: tt }]
    return { shape: 'disegnata', axis, parts, N: m + 1, full: false, nearLo: rs > 0, s: rs, pad: 0, W: w, P0: -1e9, P1: 1e9, drawn: true, cut: true, cutAt: cut }
  }
  const N = n + 1, full = N * RISE >= R - 0.05, r = full ? R / N : RISE
  const down = dir === 'down'
  const yLow = down ? base - N * r : base
  const parts = [{ kind: 'flight', axis, rs, a: [...a], p: [...p], yLow, n, r, t }]
  const top = yLow + N * r, endA = rs > 0 ? a[1] : a[0]
  // scendendo il piano di partenza e' gia' in cima: niente pianerottolo
  if (!down) {
    let land
    if (st.landing) {
      const [lx0, lz0, lx1, lz1] = st.landing
      land = { kind: 'landing', axis, a: axis === 'x' ? [lx0, lx1] : [lz0, lz1], p: axis === 'x' ? [Math.min(lz0, p[0]), Math.max(lz1, p[1])] : [Math.min(lx0, p[0]), Math.max(lx1, p[1])], y: top }
    } else { const d = Math.max(w, 0.9); land = { kind: 'landing', axis, a: rs > 0 ? [endA, endA + d] : [endA - d, endA], p: [...p], y: top } }
    parts.push(land)
  }
  return { shape: 'disegnata', axis, parts, N, full, nearLo: rs > 0, s: rs, pad: 0, W: w, P0: -1e9, P1: 1e9, drawn: true, cut: !full }
}

// quota del piano di calpestio in (x, z) dentro le parti della scala (null = fuori)
const inPolyXZ = (x, z, P) => { let c = false; for (let i = 0, j = P.length - 1; i < P.length; j = i++) { const [xi, zi] = P[i], [xj, zj] = P[j]; if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) c = !c } return c }
function heightIn(parts, x, z) {
  for (const p of parts) {
    if (p.kind === 'wedge') { if (inPolyXZ(x, z, p.poly)) return p.y; continue }
    const [a, q] = p.axis === 'x' ? [x, z] : [z, x]
    if (a < p.a[0] - 1e-6 || a > p.a[1] + 1e-6 || q < p.p[0] - 1e-6 || q > p.p[1] + 1e-6) continue
    if (p.kind === 'landing') return p.y
    const dist = p.rs > 0 ? a - p.a[0] : p.a[1] - a
    const k = Math.max(0, Math.min(p.n - 1, Math.floor(dist / p.t)))
    return p.yLow + (k + 1) * p.r
  }
  return null
}
export const stairHeight = (L, x, z) => heightIn(L.parts, x, z)
// estremi della scala: piede (prima rampa, lato basso) e testa (ultima rampa, lato alto)
const flights = c => c.parts.filter(p => p.kind === 'flight')
function lowEnd(c) { const f = flights(c)[0], a = f.rs > 0 ? f.a[0] : f.a[1]; return xz(f.axis, a, (f.p[0] + f.p[1]) / 2) }
function topEnd(c) { const f = flights(c).at(-1), a = f.rs > 0 ? f.a[1] : f.a[0]; return xz(f.axis, a, (f.p[0] + f.p[1]) / 2) }
// posa di chi arriva: al piede si guarda lontano dalla scala (si e' appena scesi), in testa si continua nel verso di salita
function endPose(c, which) {
  if (c.ends) {
    // scala disegnata: in salita il piede e' l'ingresso, in discesa il piede e' l'altro capo
    const foot = c.dir === 'down' ? c.ends.last : c.ends.first, head = c.dir === 'down' ? c.ends.first : c.ends.last
    if (which === 'low') { const o = c.dir === 'down' ? foot.d : [-foot.d[0], -foot.d[1]]; return { x: foot.pt[0] + o[0] * 0.4, z: foot.pt[1] + o[1] * 0.4, yaw: yawOf(o[0], o[1]) } }
    const o = c.dir === 'down' ? [-head.d[0], -head.d[1]] : head.d
    return { x: head.pt[0] + o[0] * 0.4, z: head.pt[1] + o[1] * 0.4, yaw: yawOf(o[0], o[1]) }
  }
  const f = which === 'low' ? flights(c)[0] : flights(c).at(-1)
  const sg = which === 'low' ? -f.rs : f.rs, aEnd = which === 'low' ? (f.rs > 0 ? f.a[0] : f.a[1]) : (f.rs > 0 ? f.a[1] : f.a[0])
  const pm = (f.p[0] + f.p[1]) / 2, [x, z] = xz(f.axis, aEnd + sg * 0.4, pm), [dx, dz] = xz(f.axis, sg, 0)
  return { x, z, yaw: yawOf(dx, dz) }
}

// Geometria: corpo in muratura (intonaco) sotto ogni gradino, pedata con il naso di 2,5 cm, alzata rivestita, ringhiere.
// clipTop: sopra questa quota i pezzi vanno nel gruppo "sopra" (nascosto dall'alto) e il taglio e' una sezione scura.
// floorBase: fondo dei corpi (pavimento o fondo del vano che scende).
export function buildStair(L, M, { clipTop = Infinity, floorBase = 0, cutDepth = -Infinity, wallAt = null, bodyMat = null } = {}) {
  const below = { body: [], tread: [], riser: [], cut: [], nose: [] }, above = { body: [], tread: [], riser: [], nose: [] }, rails = [], hands = []
  const box = (x0, y0, z0, x1, y1, z1) => { const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0); g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2); return worldUV(g) }
  // pezzo asse-allineato in coordinate (lungo, traverso): diviso tra sotto/sopra il taglio
  const put = (axis, a0, a1, p0, p1, y0, y1, kind) => {
    y0 = Math.max(y0, cutDepth); if (y1 <= y0 + 1e-4) return
    const [xa, za] = xz(axis, a0, p0), [xb, zb] = xz(axis, a1, p1)
    const X0 = Math.min(xa, xb), X1 = Math.max(xa, xb), Z0 = Math.min(za, zb), Z1 = Math.max(za, zb)
    if (y1 <= clipTop) below[kind].push(box(X0, y0, Z0, X1, y1, Z1))
    else if (y0 >= clipTop) above[kind].push(box(X0, y0, Z0, X1, y1, Z1))
    else { below[kind].push(box(X0, y0, Z0, X1, clipTop, Z1)); above[kind].push(box(X0, clipTop, Z0, X1, y1, Z1)); below.cut.push(box(X0, clipTop, Z0, X1, clipTop + 0.004, Z1)) }
  }
  const TT = 0.04, NOSE = 0.025
  // spicchio (gradino a ventaglio): prisma del poligono tra y0 e y1, diviso al taglio come gli altri pezzi
  const prism = (poly, y0, y1) => { const sh = new THREE.Shape(poly.map(([x, z]) => new THREE.Vector2(x, -z))); const g = new THREE.ExtrudeGeometry(sh, { depth: y1 - y0, bevelEnabled: false }); g.rotateX(-Math.PI / 2); g.translate(0, y0, 0); return worldUV(g) }
  const putPoly = (poly, y0, y1, kind) => {
    y0 = Math.max(y0, cutDepth); if (y1 <= y0 + 1e-4) return
    if (y1 <= clipTop) below[kind].push(prism(poly, y0, y1))
    else if (y0 >= clipTop) above[kind].push(prism(poly, y0, y1))
    else { below[kind].push(prism(poly, y0, clipTop)); above[kind].push(prism(poly, clipTop, y1)); below.cut.push(prism(poly, clipTop, clipTop + 0.004)) }
  }
  // scale disegnate: filo scuro sul bordo di ogni gradino (dall'alto i gradini si leggono come le righe del disegno)
  const wedges = L.parts.filter(p => p.kind === 'wedge')
  const shared = (P, Q) => { if (!P || !Q) return null; const s = P.filter(a => Q.some(b => Math.hypot(a[0] - b[0], a[1] - b[1]) < 0.01)); return s.length >= 2 ? [s[0], s[1]] : null }
  for (const p of L.parts) {
    if (p.kind === 'wedge') {
      putPoly(p.poly, floorBase, p.y - TT, 'body')
      putPoly(p.poly, p.y - TT, p.y, 'tread')
      if (L.path) {
        // bordo verso il gradino piu' basso: il vicino nel verso di discesa
        const i = wedges.indexOf(p), lower = L.dir === 'down' ? wedges[i + 1] : wedges[i - 1], e = shared(p.poly, lower?.poly)
        if (e) {
          const cx = p.poly.reduce((t, q) => t + q[0], 0) / p.poly.length, cz = p.poly.reduce((t, q) => t + q[1], 0) / p.poly.length
          const [A, B] = e, dx = B[0] - A[0], dz = B[1] - A[1], Ln = Math.hypot(dx, dz) || 1
          let nx = -dz / Ln, nz = dx / Ln; if ((cx - A[0]) * nx + (cz - A[1]) * nz < 0) { nx = -nx; nz = -nz }
          putPoly([A, B, [B[0] + nx * 0.035, B[1] + nz * 0.035], [A[0] + nx * 0.035, A[1] + nz * 0.035]], p.y, p.y + 0.003, 'nose')
        }
      }
      continue
    }
    if (p.kind === 'landing') {
      put(p.axis, p.a[0], p.a[1], p.p[0], p.p[1], floorBase, p.y - TT, 'body')
      put(p.axis, p.a[0], p.a[1], p.p[0], p.p[1], p.y - TT, p.y, 'tread')
      continue
    }
    for (let k = 0; k < p.n; k++) {
      const top = p.yLow + (k + 1) * p.r
      const lo = p.rs > 0 ? p.a[0] + k * p.t : p.a[1] - (k + 1) * p.t, hi = lo + p.t
      put(p.axis, lo, hi, p.p[0], p.p[1], floorBase, top - TT, 'body')
      // pedata: sporge verso il basso della rampa (naso)
      const n0 = p.rs > 0 ? lo - NOSE : lo, n1 = p.rs > 0 ? hi : hi + NOSE
      put(p.axis, n0, n1, p.p[0], p.p[1], top - TT, top, 'tread')
      if (L.path) { const e0 = p.rs > 0 ? n0 : n1 - 0.035; put(p.axis, e0, e0 + 0.035, p.p[0], p.p[1], top, top + 0.003, 'nose') }
      // alzata rivestita sulla faccia verso il basso
      const f = p.rs > 0 ? lo : hi
      put(p.axis, Math.min(f, f - p.rs * 0.012), Math.max(f, f - p.rs * 0.012), p.p[0] + 0.004, p.p[1] - 0.004, top - p.r, top - TT, 'riser')
    }
  }
  // rampa tagliata sotto la quota dei muri (finito lo spazio): sezione scura sull'ultimo gradino, come i muri tagliati
  if (L.cutAt != null) {
    const f = L.parts.at(-1), top = f.yLow + f.n * f.r
    if (top < Math.min(clipTop, L.cutAt) - 0.01) { const lo = f.rs > 0 ? f.a[0] + (f.n - 1) * f.t : f.a[1] - f.n * f.t; put(f.axis, lo, lo + f.t, f.p[0], f.p[1], top, top + 0.004, 'cut') }
  }
  // ringhiere sui lati aperti delle rampe: montanti a ogni gradino, corrimano inclinato a 90 cm
  const R0 = L.P0, R1 = L.P1
  const railSegs = [] // per la griglia della camminata: [x0, z0, x1, z1]
  const bar = (x, y0, y1, z, w = 0.018) => rails.push(box(x - w / 2, y0, z - w / 2, x + w / 2, y1, z + w / 2))
  const hand = (A, B) => { // cilindro da A a B
    const a = new THREE.Vector3(...A), b = new THREE.Vector3(...B), len = a.distanceTo(b)
    const g = new THREE.CylinderGeometry(0.022, 0.022, len, 10); g.translate(0, len / 2, 0)
    g.applyMatrix4(new THREE.Matrix4().makeRotationFromQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize())))
    g.translate(a.x, a.y, a.z); hands.push(worldUV(g))
  }
  for (const p of L.parts) {
    if (p.kind !== 'flight') continue
    for (const e of [0, 1]) {
      const pe = p.p[e]
      // lato contro un muro: niente ringhiera (le scale esterne guardano la griglia: contro la facciata si', nel vuoto no)
      const wallSide = L.open || L.path ? !!wallAt && [0.25, 0.5, 0.75].filter(k => { const [x, z] = xz(p.axis, p.a[0] + (p.a[1] - p.a[0]) * k, pe + (e ? 0.15 : -0.15)); return wallAt(x, z) }).length >= 2 : Math.abs(pe - (e ? R1 : R0)) < 0.08
      if (wallSide) continue
      // scala che scende: il bordo del buco ha gia' la ringhiera a quota pavimento
      const hb = L.axis === 'x' ? [L.hole[1], L.hole[3]] : [L.hole[0], L.hole[2]]
      if (L.dir === 'down' && Math.min(Math.abs(pe - hb[0]), Math.abs(pe - hb[1])) < 0.02) continue
      const pin = pe + (e ? -0.05 : 0.05)
      const pts = []
      for (let k = 0; k < p.n; k++) {
        const top = p.yLow + (k + 1) * p.r, lo = p.rs > 0 ? p.a[0] + k * p.t : p.a[1] - (k + 1) * p.t, am = lo + p.t / 2
        const [x, z] = xz(p.axis, am, pin)
        if (top - 0.05 < clipTop) bar(x, top, Math.min(top + 0.9, clipTop), z)
        pts.push([x, top + 0.9, z])
      }
      if (pts.length >= 2) {
        const A = pts[0], B = pts.at(-1)
        if (B[1] <= clipTop && A[1] <= clipTop) hand(A, B)
        else if (A[1] < clipTop) { const t = (clipTop - A[1]) / (B[1] - A[1]); hand(A, [A[0] + (B[0] - A[0]) * t, clipTop, A[2] + (B[2] - A[2]) * t]) }
        else if (B[1] < clipTop) { const t = (clipTop - B[1]) / (A[1] - B[1]); hand(B, [B[0] + (A[0] - B[0]) * t, clipTop, B[2] + (A[2] - B[2]) * t]) }
      }
      const [xa, za] = xz(p.axis, p.a[0], pin), [xb, zb] = xz(p.axis, p.a[1], pin)
      railSegs.push([xa, za, xb, zb])
    }
  }
  // pianerottoli all'aperto (scale esterne): ringhiera sui lati liberi, che prosegue quella della rampa; niente
  // ringhiera dove arriva la rampa e contro i muri
  if (L.open) for (const q of L.parts.filter(x => x.kind === 'landing')) {
    const f = L.parts.find(x => x.kind === 'flight' && Math.abs((x.rs > 0 ? x.a[1] : x.a[0]) - (x.rs > 0 ? q.a[0] : q.a[1])) < 0.05)
    const corners = [[q.a[0], q.p[0]], [q.a[1], q.p[0]], [q.a[1], q.p[1]], [q.a[0], q.p[1]]]
    for (let e = 0; e < 4; e++) {
      const [a0, p0] = corners[e], [a1, p1] = corners[(e + 1) % 4], na = e === 1 ? 1 : e === 3 ? -1 : 0, np = e === 0 ? -1 : e === 2 ? 1 : 0
      const len = Math.hypot(a1 - a0, p1 - p0), steps = Math.max(1, Math.round(len / 0.1))
      let run = null
      const flush = i => {
        if (run === null) return
        const P = k => { const t = k / steps; const [x, z] = xz(q.axis, a0 + (a1 - a0) * t - na * 0.04, p0 + (p1 - p0) * t - np * 0.04); return [x, z] }
        const A = P(run), B = P(i)
        if (Math.hypot(B[0] - A[0], B[1] - A[1]) > 0.15) {
          hand([A[0], q.y + 0.95, A[1]], [B[0], q.y + 0.95, B[1]])
          const nb = Math.max(2, Math.round(Math.hypot(B[0] - A[0], B[1] - A[1]) / 0.12))
          for (let j = 0; j <= nb; j++) bar(A[0] + (B[0] - A[0]) * j / nb, q.y, q.y + 0.95, A[1] + (B[1] - A[1]) * j / nb)
          railSegs.push([A[0], A[1], B[0], B[1]])
        }
        run = null
      }
      for (let i = 0; i <= steps; i++) {
        const t = i / steps, aa = a0 + (a1 - a0) * t, pp = p0 + (p1 - p0) * t
        const [ox, oz] = xz(q.axis, aa + na * 0.15, pp + np * 0.15)
        const arrive = f && na && Math.abs(aa - (f.rs > 0 ? f.a[1] : f.a[0])) < 0.05 && pp > f.p[0] - 0.02 && pp < f.p[1] + 0.02
        const free = i < steps && !arrive && !(wallAt && wallAt(ox, oz))
        if (free && run === null) run = i
        if (!free && run !== null) flush(i)
      }
      flush(steps)
    }
  }
  // scala che scende: ringhiera attorno al buco, tranne dove la rampa arriva al piano
  if (L.dir === 'down') {
    const [hx0, hz0, hx1, hz1] = L.hole, edges = [[[hx0, hz0], [hx1, hz0], [0, -1]], [[hx1, hz0], [hx1, hz1], [1, 0]], [[hx1, hz1], [hx0, hz1], [0, 1]], [[hx0, hz1], [hx0, hz0], [-1, 0]]]
    for (const [a, b, n] of edges) {
      const len = Math.hypot(b[0] - a[0], b[1] - a[1]), steps = Math.max(1, Math.round(len / 0.1))
      let run = null
      const flush = (i) => {
        if (run === null) return
        const t0 = run / steps, t1 = i / steps, P = t => [a[0] + (b[0] - a[0]) * t - n[0] * 0.04, a[1] + (b[1] - a[1]) * t - n[1] * 0.04]
        const A = P(t0), B = P(t1), segL = Math.hypot(B[0] - A[0], B[1] - A[1])
        if (segL > 0.15) {
          // scala disegnata: parapetto basso e rado (si leggono i gradini dall'alto)
          const RH = L.path ? 0.9 : 1.0, gap = L.path ? 0.3 : 0.12
          hand([A[0], L.base + RH, A[1]], [B[0], L.base + RH, B[1]])
          const nb = Math.max(2, Math.round(segL / gap))
          for (let j = 0; j <= nb; j++) { const x = A[0] + (B[0] - A[0]) * j / nb, z = A[1] + (B[1] - A[1]) * j / nb; bar(x, L.base, L.base + RH, z) }
          railSegs.push([A[0], A[1], B[0], B[1]])
        }
        run = null
      }
      for (let i = 0; i <= steps; i++) {
        const t = i / steps, x = a[0] + (b[0] - a[0]) * t - n[0] * 0.06, z = a[1] + (b[1] - a[1]) * t - n[1] * 0.06
        // lato contro un muro: niente parapetto (scala disegnata: il muro si guarda sulla griglia, appena fuori dal buco)
        const onWall = L.path && wallAt ? wallAt(a[0] + (b[0] - a[0]) * t + n[0] * 0.12, a[1] + (b[1] - a[1]) * t + n[1] * 0.12) || wallAt(x, z)
          : (n[0] && Math.abs(a[0] - (n[0] > 0 ? L.rect[2] : L.rect[0])) < 0.08) || (n[1] && Math.abs(a[1] - (n[1] > 0 ? L.rect[3] : L.rect[1])) < 0.08)
        const h = heightIn(L.parts, x, z)
        const drop = !onWall && i < steps && (h === null || h < L.base - 0.25)
        if (drop && run === null) run = i
        if (!drop && run !== null) flush(i)
      }
      flush(steps)
    }
  }
  const mk = (list, mat, cast = true) => { if (!list.length) return null; const mixed = list.some(g => g.index) && list.some(g => !g.index); const m = new THREE.Mesh(mergeGeometries(mixed ? list.map(g => (g.index ? g.toNonIndexed() : g)) : list), mat); m.castShadow = cast; m.receiveShadow = true; return m }
  const gBelow = new THREE.Group(), gAbove = new THREE.Group()
  const bodyM = bodyMat || M.stairBody // scale esterne: il corpo in muratura come la facciata
  const noseM = M.stairNose || (M.stairNose = new THREE.MeshStandardMaterial({ color: 0x8f877d, roughness: 0.7 }))
  for (const [list, mat] of [[below.body, bodyM], [below.tread, M.stairTread], [below.riser, M.stairRiser], [below.cut, M.wallCut], [below.nose, noseM]]) { const m = mk(list, mat, mat !== M.wallCut && mat !== noseM); if (m) gBelow.add(m) }
  for (const [list, mat] of [[above.body, bodyM], [above.tread, M.stairTread], [above.riser, M.stairRiser], [above.nose, noseM]]) { const m = mk(list, mat, mat !== noseM); if (m) gAbove.add(m) }
  const r = mk(rails, M.rail); if (r) gBelow.add(r)
  const h = mk(hands, M.handrail); if (h) gBelow.add(h)
  gBelow.name = 'scala'; gAbove.name = 'scala-sopra'
  return { below: gBelow, above: gAbove, railSegs }
}

// Pareti del vano attorno al buco: sopra il soffitto (rampa che sale, coperchio in alto) o sotto il pavimento
// (rampa che scende, fondo scuro come la sezione dei muri; scala disegnata: il fondo e' il piano di sotto, floorMat)
export function buildShaft(L, M, { H, depth = 1.7, up = true, floorMat = null }) {
  const [x0, z0, x1, z1] = L.hole, T = 0.1, e = 0.004, g = [] // facce interne 4 mm dentro il buco: niente sfarfallio col taglio del solaio
  const box = (a, b, c, d, e, f) => { const q = new THREE.BoxGeometry(d - a, e - b, f - c); q.translate((a + d) / 2, (b + e) / 2, (c + f) / 2); return worldUV(q) }
  const y0 = up ? H : L.base - depth, y1 = up ? H + 2.2 : L.base - 0.005
  g.push(box(x0 - T, y0, z0 - T, x1 + T, y1, z0 + e), box(x0 - T, y0, z1 - e, x1 + T, y1, z1 + T), box(x0 - T, y0, z0, x0 + e, y1, z1), box(x1 - e, y0, z0, x1 + T, y1, z1))
  const walls = new THREE.Mesh(mergeGeometries(g), M.shaft); walls.receiveShadow = true
  const cap = new THREE.Mesh(box(x0 - T, up ? y1 : y0 - 0.02, z0 - T, x1 + T, up ? y1 + 0.02 : y0, z1 + T), up ? M.shaft : floorMat || M.wallCut)
  const grp = new THREE.Group(); grp.add(walls, cap); grp.name = 'vano-scala'
  return grp
}
