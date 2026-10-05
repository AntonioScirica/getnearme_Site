// Disposizione automatica dei mobili per tipo di stanza (funzione pura: plan + griglia -> elenco di pezzi).
// Regole: mobili contro i muri, mai davanti a porte (zona di passaggio della porta sempre libera), mobili alti
// mai davanti alle finestre, misure reali, verifica d'ingombro su griglia 5 cm. Puo' girare anche sul server.

const SIDES = ['N', 'S', 'W', 'E']
const INWARD = { N: [0, 1], S: [0, -1], W: [1, 0], E: [-1, 0] }
const rotFor = ([ix, iz]) => Math.atan2(ix, iz) // ruota il fronte (+z locale) verso l'interno

export function planFurniture(plan, house) {
  const { grid } = house
  const H = plan.height || 2.7
  const items = [], lights = []
  const clear = new Uint8Array(grid.wall.length)
  const C = grid.cell

  // zone di passaggio delle porte (anta + spazio per entrare): nessun mobile
  for (const d of plan.doors) {
    const [x0, z0, x1, z1] = d.rect, ax = d.axis === 'x'
    const len = ax ? x1 - x0 : z1 - z0, depth = Math.max(0.95, len + 0.1)
    for (const s of [-1, 1]) {
      const zx0 = ax ? x0 - 0.12 : (s < 0 ? x0 - depth : x1), zx1 = ax ? x1 + 0.12 : (s < 0 ? x0 : x1 + depth)
      const zz0 = ax ? (s < 0 ? z0 - depth : z1) : z0 - 0.12, zz1 = ax ? (s < 0 ? z0 : z1 + depth) : z1 + 0.12
      for (let z = zz0; z <= zz1; z += C) for (let x = zx0; x <= zx1; x += C) { const i = grid.idx(x, z); if (i >= 0) clear[i] = 1 }
    }
  }
  const nearWin = (x, z, r = 0.45) => plan.windows.some(w => x > w.rect[0] - r && x < w.rect[2] + r && z > w.rect[1] - r && z < w.rect[3] + r)

  // controlla che un rettangolo ruotato stia tutto nella stanza, libero da muri, mobili e zone porta
  function fits(room, x, z, w, d, rot, { ignoreClear = false, shrink = 0.03 } = {}) {
    const c = Math.cos(rot), s = Math.sin(rot), hw = w / 2 - shrink, hd = d / 2 - shrink
    for (let lz = -hd; lz <= hd + 1e-6; lz += C) for (let lx = -hw; lx <= hw + 1e-6; lx += C) {
      const px = x + lx * c + lz * s, pz = z - lx * s + lz * c
      const i = grid.idx(px, pz)
      if (i < 0 || grid.wall[i] || grid.furn[i] || (!ignoreClear && clear[i])) return false
      if (grid.room[i] !== room.id) return false
    }
    return true
  }
  // skip: per stanza, tipi di mobile gia' disegnati sulla planimetria (l'arredo automatico completa senza doppioni)
  const skip = new Map()
  function add(room, kind, x, z, rot, { w = 0, d = 0, y = 0, opts = {}, block = true } = {}) {
    if (skip.get(room.id)?.has(kind)) return false
    items.push({ kind, x, z, y, rot, room: room.id, opts })
    if (block && w && d) grid.markFurniture(x, z, w, d, rot)
    return true
  }
  // distanza dal lato del rettangolo utile al muro vero (il rettangolo e' eroso di qualche cm)
  function wallGap(side, x, z) {
    const [ix, iz] = INWARD[side]
    for (let t = 0; t <= 0.35; t += 0.01) if (grid.isWall(x - ix * t, z - iz * t)) return t
    return null
  }
  function sideInfo(room, side) {
    const [x0, z0, x1, z1] = room.rect
    const along = side === 'N' || side === 'S'
    const a0 = along ? x0 : z0, a1 = along ? x1 : z1
    const pt = a => side === 'N' ? [a, z0] : side === 'S' ? [a, z1] : side === 'W' ? [x0, a] : [x1, a]
    const samples = []
    for (let a = a0; a <= a1 + 1e-6; a += 0.05) {
      const [x, z] = pt(a), g = wallGap(side, x, z)
      const [ix, iz] = INWARD[side]
      const fx = g == null ? x : x - ix * g, fz = g == null ? z : z - iz * g
      samples.push({ a, wall: g != null && !grid.isWall(x + ix * 0.02, z + iz * 0.02), gap: g ?? 0, win: g != null && nearWin(fx - ix * 0.1, fz - iz * 0.1, 0.05), clear: !!clear[grid.idx(x + ix * 0.1, z + iz * 0.1)] })
    }
    return { side, a0, a1, pt, samples, len: a1 - a0, along }
  }
  // intervalli liberi di un lato per un mobile (alto: niente finestre)
  function intervals(info, { tall = false, allowWin = false } = {}) {
    const out = []; let st = null
    for (const s of info.samples) {
      const ok = s.wall && !s.clear && (allowWin || !s.win || (!tall && false))
      if (ok && st === null) st = s.a
      if (!ok && st !== null) { out.push([st, s.a - 0.05]); st = null }
    }
    if (st !== null) out.push([st, info.samples.at(-1).a])
    return out.filter(([a, b]) => b - a > 0.3)
  }
  function placeAt(room, info, a, w, d) {
    const [x, z] = info.pt(a), [ix, iz] = INWARD[info.side]
    const near = info.samples.reduce((m, s) => Math.abs(s.a - a) < Math.abs(m.a - a) ? s : m, info.samples[0])
    const back = near.gap - 0.012 // la schiena tocca il muro (meno un centimetro)
    return [x - ix * back + ix * d / 2, z - iz * back + iz * d / 2, rotFor(INWARD[info.side])]
  }
  // prova i lati in ordine di preferenza; sul lato prova il centro dell'intervallo, gli angoli, poi scorre
  function againstWall(room, kind, w, d, { sides, tall = false, allowWin = false, align = 'center', margin = 0.05, h = 0, opts = {}, block = true, dry = false } = {}) {
    const infos = (sides || SIDES).map(s => sideInfo(room, s))
    for (const info of infos) {
      for (const [ia, ib] of intervals(info, { tall, allowWin }).sort((p, q) => (q[1] - q[0]) - (p[1] - p[0]))) {
        if (ib - ia < w + 2 * margin - 0.1) continue
        const mid = (ia + ib) / 2, cands = align === 'corner' ? [ia + margin + w / 2, ib - margin - w / 2, mid] : [mid, ia + margin + w / 2, ib - margin - w / 2]
        for (let k = 1; k < 20; k++) cands.push(mid + k * 0.1, mid - k * 0.1)
        for (const a of cands) {
          if (a - w / 2 < ia - 0.05 || a + w / 2 > ib + 0.05) continue
          const [x, z, rot] = placeAt(room, info, a, w, d)
          if (!fits(room, x, z, w, d, rot)) continue
          const res = { x, z, rot, side: info.side, a, info }
          if (!dry) add(room, kind, x, z, rot, { w, d, y: h, opts, block })
          return res
        }
      }
    }
    return null
  }
  const sideScore = (room, s, { tall = false, preferNoWin = true } = {}) => {
    const info = sideInfo(room, s), n = info.samples.length
    const wall = info.samples.filter(x => x.wall && !x.clear && !(tall && x.win)).length / n
    const win = info.samples.filter(x => x.win).length / n
    return info.len * wall - (preferNoWin ? win * 1.5 : 0)
  }
  const bySides = (room, opt) => [...SIDES].sort((a, b) => sideScore(room, b, opt) - sideScore(room, a, opt))
  const opposite = { N: 'S', S: 'N', W: 'E', E: 'W' }
  const perp = s => (s === 'N' || s === 'S') ? ['W', 'E'] : ['N', 'S']
  // vettori del mobile: destra e fronte in coordinate mondo
  const axes = rot => ({ r: [Math.cos(rot), -Math.sin(rot)], f: [Math.sin(rot), Math.cos(rot)] })
  const at = (p, rot, dx, dz) => { const { r, f } = axes(rot); return [p.x + r[0] * dx + f[0] * dz, p.z + r[1] * dx + f[1] * dz] }
  function freeCorner(room, size) {
    const [x0, z0, x1, z1] = room.rect, m = size / 2 + 0.06
    for (const [x, z, rot] of [[x0 + m, z0 + m, Math.PI / 4], [x1 - m, z0 + m, -Math.PI / 4], [x0 + m, z1 - m, Math.PI * 0.75], [x1 - m, z1 - m, -Math.PI * 0.75]])
      if (fits(room, x, z, size, size, 0)) return { x, z, rot }
    return null
  }
  const mainLight = (room, x, z, kind = 'pendant') => {
    if (add(room, kind, x, z, 0, { y: kind === 'pendant' ? H - 0.95 : H, block: false }) === false) return
    lights.push({ room: room.id, x, y: kind === 'pendant' ? H - 0.75 : H - 0.2, z, role: 'main' })
  }
  const center = r => [(r.rect[0] + r.rect[2]) / 2, (r.rect[1] + r.rect[3]) / 2]

  const recipes = {
    soggiorno(room) {
      const [cx, cz] = center(room)
      const sides = bySides(room, { preferNoWin: true })
      // divano contro il muro migliore, mobile tv di fronte
      let sofaW = 2.1, sofa = null
      for (const s of sides) { for (const w of [2.1, 1.8]) { sofa = againstWall(room, 'sofa', w, 0.95, { sides: [s], allowWin: true, dry: true }); if (sofa) { sofaW = w; break } } if (sofa) break }
      if (!sofa) return
      const tvSide = opposite[sofa.side]
      const tvW = 1.6
      const tvP = againstWall(room, 'tvcab', tvW, 0.42, { sides: [tvSide], allowWin: false, dry: true })
      add(room, 'sofa', sofa.x, sofa.z, sofa.rot, { w: sofaW, d: 0.95, opts: { w: sofaW } })
      add(room, 'picture2', ...at(sofa, sofa.rot, 0, -0.475 + 0.015), sofa.rot, { y: 1.55 - 0.25, block: false })
      if (tvP) {
        add(room, 'tvcab', tvP.x, tvP.z, tvP.rot, { w: tvW, d: 0.42, opts: { w: tvW } })
        add(room, 'tv', ...at(tvP, tvP.rot, 0, -0.05), tvP.rot, { y: 0.54, block: false })
        add(room, 'vaseTall', ...at(tvP, tvP.rot, tvW / 2 - 0.15, 0), 0, { y: 0.54, block: false })
        add(room, 'plantSmall', ...at(tvP, tvP.rot, -tvW / 2 + 0.15, 0.02), 0, { y: 0.54, block: false })
      }
      // tappeto e tavolino tra divano e tv
      const dist = tvP ? Math.hypot(tvP.x - sofa.x, tvP.z - sofa.z) : 2.4
      const mid = at(sofa, sofa.rot, 0, Math.min(dist / 2, 1.25))
      add(room, 'rug', mid[0], mid[1], sofa.rot, { opts: { w: Math.min(2.3, sofaW + 0.3), d: 1.6 }, block: false, y: 0.001 })
      const ct = at(sofa, sofa.rot, 0, 0.475 + 0.45 + 0.3)
      if (fits(room, ct[0], ct[1], 1.2, 0.6, sofa.rot)) add(room, 'coffee', ct[0], ct[1], sofa.rot, { w: 1.2, d: 0.6, y: 0.012 })
      // poltrona di lato, girata verso il centro
      for (const s of [1, -1]) {
        const p = at(sofa, sofa.rot, s * (sofaW / 2 + 0.55), 0.95)
        const rot = sofa.rot - s * Math.PI / 2 + s * 0.45
        if (fits(room, p[0], p[1], 0.85, 0.95, rot)) { add(room, 'armchair', p[0], p[1], rot, { w: 0.85, d: 0.95 }); break }
      }
      // lampada da terra all'angolo del divano
      for (const s of [-1, 1]) {
        const p = at(sofa, sofa.rot, s * (sofaW / 2 + 0.22), -0.22)
        if (fits(room, p[0], p[1], 0.32, 0.32, 0)) { add(room, 'floorLamp', p[0], p[1], 0, { w: 0.32, d: 0.32 }); lights.push({ room: room.id, x: p[0], y: 1.5, z: p[1], role: 'accent' }); break }
      }
      // libreria su un altro muro, pianta in un angolo libero
      againstWall(room, 'shelves', 1.08, 0.37, { sides: perp(sofa.side), tall: true })
      const pc = freeCorner(room, 0.62); if (pc) add(room, 'plantBig', pc.x, pc.z, pc.rot, { w: 0.6, d: 0.6 })
      mainLight(room, ...ct)
    },
    camera(room, { single = false } = {}) {
      const bw = single ? 0.9 : 1.6, bl = 2.0
      const sides = bySides(room, { tall: true, preferNoWin: true })
      let bed = null, nsW = 0.5
      for (const s of sides) {
        for (const need of single ? [bw] : [bw + 2 * 0.5, bw + 2 * 0.42, bw]) {
          bed = againstWall(room, 'bed', need, bl + 0.08, { sides: [s], allowWin: false, align: single ? 'corner' : 'center', dry: true, margin: 0.02 })
          if (bed) { nsW = (need - bw) / 2; break }
        }
        if (bed) break
      }
      if (bed) {
        const p = at(bed, bed.rot, 0, 0)
        add(room, 'bed', p[0], p[1], bed.rot, { w: bw + 0.12, d: bl + 0.08, opts: { w: bw, l: bl } })
        add(room, 'picture1', ...at(bed, bed.rot, 0, -(bl + 0.08) / 2 + 0.015), bed.rot, { y: 1.62 - 0.42, block: false })
        if (!single) add(room, 'rug', ...at(bed, bed.rot, 0, 0.45), bed.rot, { opts: { w: bw + 0.9, d: 1.7 }, block: false, y: 0.001 })
        for (const s of single ? [1] : [-1, 1]) {
          if (nsW < 0.4 && !single) break
          const q = at(bed, bed.rot, s * (bw / 2 + 0.06 + 0.26), -(bl + 0.08) / 2 + 0.24)
          if (fits(room, q[0], q[1], 0.5, 0.45, bed.rot)) {
            add(room, 'nightstand', q[0], q[1], bed.rot, { w: 0.5, d: 0.45 })
            add(room, 'tableLamp', ...at({ x: q[0], z: q[1] }, bed.rot, 0.06, -0.05), 0, { y: 0.55, block: false })
            lights.push({ room: room.id, x: q[0], y: 0.95, z: q[1], role: 'accent' })
            if (s === 1) add(room, 'photo', ...at({ x: q[0], z: q[1] }, bed.rot, -0.14, 0.08), bed.rot, { y: 0.55, block: false })
          }
        }
        // armadio: su un lato libero, lasciando 70 cm davanti
        for (const w of [2.2, 1.8, 1.4, 1.0]) {
          const ws = [opposite[bed.side], ...perp(bed.side)]
          if (againstWall(room, 'wardrobe', w, 0.6, { sides: ws, tall: true, align: 'corner', opts: { w } })) break
        }
        if (single) againstWall(room, 'desk', 1.2, 0.6, { sides: SIDES, allowWin: true, opts: { w: 1.2, d: 0.6 } })
        else againstWall(room, 'chest', 1.14, 0.49, { sides: SIDES, tall: true })
      }
      const pc = freeCorner(room, 0.55); if (pc) add(room, 'plantMid', pc.x, pc.z, pc.rot, { w: 0.55, d: 0.55 })
      mainLight(room, ...center(room))
    },
    cameretta(room) { return recipes.camera(room, { single: true }) },
    studio(room) {
      const sides = bySides(room, { preferNoWin: false })
      // scrivania davanti alla finestra se c'e', altrimenti sul muro migliore
      const winSide = SIDES.find(s => sideInfo(room, s).samples.some(x => x.win))
      const desk = againstWall(room, 'desk', 1.3, 0.65, { sides: winSide ? [winSide, ...sides] : sides, allowWin: true, opts: { w: 1.3, d: 0.65 } })
      if (desk) {
        const ch = at(desk, desk.rot, 0.05, 0.55)
        add(room, 'chair', ch[0], ch[1], desk.rot + Math.PI, { w: 0.5, d: 0.55 })
        add(room, 'deskLamp', ...at(desk, desk.rot, 0.48, -0.12), desk.rot + 0.4, { y: 0.75, block: false })
        lights.push({ room: room.id, ...Object.fromEntries([['x', at(desk, desk.rot, 0.4, 0)[0]], ['z', at(desk, desk.rot, 0.4, 0)[1]]]), y: 1.2, role: 'accent' })
      }
      againstWall(room, 'shelves', 1.08, 0.37, { sides: desk ? [opposite[desk.side], ...perp(desk.side)] : SIDES, tall: true })
      againstWall(room, 'chest', 1.14, 0.49, { sides: desk ? perp(desk.side) : SIDES, tall: true })
      const pc = freeCorner(room, 0.9)
      if (pc) { add(room, 'lounge', pc.x, pc.z, pc.rot + Math.PI, { w: 0.9, d: 0.9 }) }
      const pc2 = freeCorner(room, 0.55); if (pc2) add(room, 'plantMid', pc2.x, pc2.z, 0, { w: 0.55, d: 0.55 })
      const [cx, cz] = center(room)
      add(room, 'rug', cx, cz, desk ? desk.rot : 0, { opts: { w: 1.6, d: 1.2 }, block: false, y: 0.001 })
      mainLight(room, cx, cz)
    },
    cucina(room) {
      const sides = bySides(room, { tall: true, preferNoWin: true })
      for (const s of sides) {
        const info = sideInfo(room, s)
        const iv = intervals(info, { tall: true, allowWin: false }).sort((p, q) => (q[1] - q[0]) - (p[1] - p[0]))[0]
        if (!iv) continue
        const w = Math.min(3.6, Math.floor((iv[1] - iv[0] - 0.02) * 10) / 10)
        if (w < 1.5) continue
        if (againstWall(room, 'kitchen', w, 0.6, { sides: [s], tall: true, opts: { w }, margin: 0.0 })) break
      }
      const [cx, cz] = center(room)
      mainLight(room, cx, cz, 'ceilingLight')
      lights.push({ room: room.id, x: cx, y: 1.45, z: cz, role: 'accent', dim: 0.4 })
    },
    bagno(room) {
      const [x0, z0, x1, z1] = room.rect, wide = x1 - x0 >= z1 - z0
      const narrow = Math.min(x1 - x0, z1 - z0)
      // doccia in fondo (lato corto lontano dalla porta), poi lavabo e wc sul lato lungo
      const ends = wide ? ['E', 'W'] : ['S', 'N']
      const sw = Math.min(0.9, narrow - 0.02)
      let sh = null
      for (const e of ends) { sh = againstWall(room, 'shower', sw, 0.8, { sides: [e], tall: true, align: 'center', opts: { w: sw, d: 0.8 }, margin: 0 }); if (sh) break }
      const longs = wide ? ['N', 'S'] : ['W', 'E']
      for (const l of longs) { if (againstWall(room, 'sink', 0.62, 0.47, { sides: [l], tall: true, align: 'corner' })) break }
      for (const l of longs) { if (againstWall(room, 'wc', 0.38, 0.55, { sides: [l], tall: true, align: 'corner' })) break }
      againstWall(room, 'towel', 0.5, 0.06, { sides: longs, tall: true, block: true })
      const [cx, cz] = center(room)
      mainLight(room, cx, cz, 'ceilingLight')
    },
    ingresso(room) {
      againstWall(room, 'chest', 1.14, 0.49, { sides: bySides(room, { tall: true }), tall: true })
      const pc = freeCorner(room, 0.62); if (pc) add(room, 'plantBig', pc.x, pc.z, 0, { w: 0.6, d: 0.6 })
      const [cx, cz] = center(room)
      mainLight(room, cx, cz, 'ceilingLight')
    },
  }
  recipes.corridoio = recipes.ingresso

  // tende ai lati delle finestre (stanze abitabili)
  function curtains() {
    for (const w of house.windows) {
      const room = plan.rooms.find(r => r.id === w.room)
      if (!room || ['bagno', 'cucina'].includes(room.type)) continue
      const ax = w.axis === 'x', [x0, z0, x1, z1] = w.rect, inn = w.in
      const off = w.face + (ax ? inn[1] : inn[0]) * 0.13
      const rot = rotFor(inn)
      for (const e of [0, 1]) {
        const a = e ? (ax ? x1 : z1) + 0.1 - 0.22 : (ax ? x0 : z0) - 0.1 + 0.22
        add(room, 'curtain', ax ? a : off, ax ? off : a, rot, { block: false, opts: { w: 0.48, h: H - 0.06 } })
      }
    }
  }

  return {
    // drawn: mobili disegnati sulla planimetria (plan.furniture): in quelle stanze si mettono loro, al loro posto
    furnish({ drawn } = {}) {
      // mobili disegnati al loro posto; poi l'arredo automatico della stanza completa nei punti liberi (fits() vede i mobili
      // letti e le zone porta), senza rifare i tipi gia' disegnati (e senza i pezzi che dipendono da loro)
      const SKIP = { bed: ['bed', 'nightstand', 'tableLamp', 'picture1', 'rug'], sofa: ['sofa', 'coffee', 'coffeeRound', 'rug', 'picture2', 'pillows'], table: ['table', 'chair'], desk: ['desk', 'deskLamp'], wardrobe: ['wardrobe', 'chest'],
        kitchen: ['kitchen'], wc: ['wc'], sink: ['sink'], shower: ['shower', 'bathtub'], bathtub: ['shower', 'bathtub'], tvcab: ['tvcab', 'tv'], armchair: [] }
      const drawnRooms = new Set((drawn || []).map(i => i.room))
      for (const it of drawn || []) {
        const room = plan.rooms.find(r => r.id === it.room)
        if (!room) continue
        add(room, it.kind, it.x, it.z, it.rot, { w: it.w, d: it.d, opts: it.opts })
        if (it.kind === 'tvcab') add(room, 'tv', it.x, it.z, it.rot, { y: 0.5, block: false })
        const sk = skip.get(room.id) ?? new Set(); for (const k of SKIP[it.kind] ?? [it.kind]) sk.add(k); skip.set(room.id, sk)
      }
      for (const r of plan.rooms) recipes[r.type]?.(r)
      skip.clear()
      curtains()
      return { items, lights }
    },
    lightsOnly() { // casa vuota: solo le luci principali
      for (const r of plan.rooms) { if (['balcone', 'terrazzo'].includes(r.type)) continue; const [cx, cz] = center(r); mainLight(r, cx, cz, 'ceilingLight') } // all'aperto niente plafoniera
      return { items, lights }
    },
  }
}
