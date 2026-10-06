// Architettura dal plan.json: muri estrusi (2,70 m), pavimenti per stanza, soffitto, architravi, porte con
// stipiti e anta, finestre con davanzale, infissi e vetri, battiscopa, rivestimento del bagno, griglia per collisioni.
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import { worldUV } from './materials.js'
import pc from '../vendor/polygon-clipping.js'
import { layoutStair, buildStair, buildShaft, stairHeight } from './stairs.js'

export const OUTDOOR = new Set(['balcone', 'terrazzo', 'giardino', 'cortile']) // all'aperto: niente soffitto
export const GROUND = new Set(['giardino', 'cortile']) // esterni a terra: 10 cm sotto il pavimento di casa, prato o pietra
export const GY = -0.1
export const isOpenRoom = r => OUTDOOR.has(r.type) || !!r.stair?.outdoor
export const isGroundRoom = r => GROUND.has(r.type) || !!r.stair?.outdoor
// pavimenti letti dalle foto (plan.rooms[].floor) -> materiali
const FLOOR_MAT = { parquet_chiaro: 'parquetLight', parquet_medio: 'parquet', parquet_scuro: 'parquetDark', gres_chiaro: 'tiles', gres_scuro: 'tilesDark', marmo: 'marble', cotto: 'cotto', graniglia: 'graniglia' }
const WALL_BASE = 0xf1ece4, FACADE_BASE = 0xefe6d6 // all'aperto: niente soffitto, parapetti bassi
export const FLOOR_OF = { cucina: 'tiles', bagno: 'marble', balcone: 'tiles', terrazzo: 'tiles', lavanderia: 'tiles', scala: 'marble' }
// pavimento di una stanza: scelto dall'agente o letto dalle foto (fisso), poi quello consigliato dallo stile
export const floorKey = (r, style) => r.type === 'giardino' ? 'lawn' : r.type === 'cortile' || r.stair?.outdoor ? 'paving' : FLOOR_MAT[r.floor] || style?.floors?.[r.type] || FLOOR_OF[r.type] || 'parquet'
const SILL = 0.9, HEAD = 2.25, DOOR_H = 2.1

const shapeOf = (pts, holes = []) => {
  const s = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)))
  for (const h of holes) s.holes.push(new THREE.Path(h.map(([x, z]) => new THREE.Vector2(x, -z))))
  return s
}
// box asse-allineato in metri, con UV in metri
export function boxGeo(x0, y0, z0, x1, y1, z1) {
  const g = new THREE.BoxGeometry(x1 - x0, y1 - y0, z1 - z0)
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2)
  return worldUV(g)
}
function mesh(geo, mat, { cast = true, receive = true } = {}) {
  const m = new THREE.Mesh(geo, mat); m.castShadow = cast; m.receiveShadow = receive; return m
}
function merged(list, mat, opt) { return list.length ? mesh(mergeGeometries(list), mat, opt) : null }

// griglia 5 cm: muri/finestre (1), stanza (id), mobili (2) per le collisioni
export class Grid {
  constructor(plan, solid, cell = 0.05) {
    const xs = plan.outline.map(p => p[0]), zs = plan.outline.map(p => p[1])
    this.cell = cell; this.x0 = Math.min(...xs) - 1; this.z0 = Math.min(...zs) - 1
    this.w = Math.ceil((Math.max(...xs) + 1 - this.x0) / cell); this.h = Math.ceil((Math.max(...zs) + 1 - this.z0) / cell)
    this.wall = new Uint8Array(this.w * this.h); this.room = new Uint8Array(this.w * this.h); this.furn = new Uint8Array(this.w * this.h)
    this.block = new Uint8Array(this.w * this.h); this.hgt = new Float32Array(this.w * this.h) // ringhiere e quota del calpestio (scale, esterni)
    const cv = document.createElement('canvas'); cv.width = this.w; cv.height = this.h
    const ctx = cv.getContext('2d', { willReadFrequently: true })
    ctx.setTransform(1 / cell, 0, 0, 1 / cell, -this.x0 / cell, -this.z0 / cell)
    const poly = pts => { ctx.moveTo(pts[0][0], pts[0][1]); for (const p of pts.slice(1)) ctx.lineTo(p[0], p[1]); ctx.closePath() }
    const read = (fn, target, val) => {
      ctx.clearRect(this.x0, this.z0, this.w * cell, this.h * cell); ctx.fillStyle = '#fff'; fn()
      const d = ctx.getImageData(0, 0, this.w, this.h).data
      for (let i = 0; i < target.length; i++) if (d[i * 4 + 3] > 127) target[i] = val
    }
    // pieno = muri all'altezza delle gambe (porte aperte, finestre chiuse) + portoncino chiuso
    read(() => { for (const P of solid) { ctx.beginPath(); P.forEach(poly); ctx.fill('evenodd') }
      for (const d of plan.doors) if (d.entrance) { const r = d.rect; ctx.fillRect(r[0], r[1], r[2] - r[0], r[3] - r[1]) } }, this.wall, 1)
    for (const r of plan.rooms) read(() => { ctx.beginPath(); poly(r.poly); ctx.fill() }, this.room, r.id)
    // esterni a terra: quota piu' bassa del pavimento di casa
    const gm = new Uint8Array(this.w * this.h)
    for (const r of plan.rooms) if (isGroundRoom(r)) read(() => { ctx.beginPath(); poly(r.poly); ctx.fill() }, gm, 1)
    for (let i = 0; i < gm.length; i++) if (gm[i]) this.hgt[i] = GY
    // le soglie delle porte appartengono alla casa
    for (const d of plan.doors) if (!d.entrance) read(() => { const r = d.rect; ctx.fillRect(r[0], r[1], r[2] - r[0], r[3] - r[1]) }, this.room, d.rooms[0])
    // fessure di una o due celle (5-10 cm) tra soglie e stanze: si chiudono, se no la camminata si incastra nei varchi
    for (let pass = 0; pass < 2; pass++) for (let j = 1; j < this.h - 1; j++) for (let i = 1; i < this.w - 1; i++) {
      const k = j * this.w + i; if (this.room[k] || this.wall[k]) continue
      const l = this.room[k - 1], r = this.room[k + 1], u = this.room[k - this.w], d = this.room[k + this.w]
      if (l && r) this.room[k] = l; else if (u && d) this.room[k] = u
      else if (pass === 0 && i < this.w - 2 && l && this.room[k + 2] && !this.wall[k + 1]) this.room[k] = l
      else if (pass === 0 && j < this.h - 2 && u && this.room[k + 2 * this.w] && !this.wall[k + this.w]) this.room[k] = u
    }
  }
  idx(x, z) { const i = Math.floor((x - this.x0) / this.cell), j = Math.floor((z - this.z0) / this.cell); return i < 0 || j < 0 || i >= this.w || j >= this.h ? -1 : j * this.w + i }
  isWall(x, z) { const i = this.idx(x, z); return i < 0 || this.wall[i] === 1 }
  roomAt(x, z) { const i = this.idx(x, z); return i < 0 ? 0 : this.room[i] }
  free(x, z) { const i = this.idx(x, z); return i >= 0 && !this.wall[i] && !this.furn[i] && !this.block[i] && this.room[i] > 0 }
  heightAt(x, z) { const i = this.idx(x, z); return i < 0 ? 0 : this.hgt[i] }
  // segmento (ringhiera, siepe) che non si attraversa camminando
  blockSeg(x0, z0, x1, z1, r = 0.06) {
    const L = Math.hypot(x1 - x0, z1 - z0), n = Math.max(1, Math.ceil(L / (this.cell / 2)))
    for (let k = 0; k <= n; k++) { const x = x0 + (x1 - x0) * k / n, z = z0 + (z1 - z0) * k / n
      for (let dz = -r; dz <= r + 1e-6; dz += this.cell) for (let dx = -r; dx <= r + 1e-6; dx += this.cell) { const i = this.idx(x + dx, z + dz); if (i >= 0) this.block[i] = 1 } }
  }
  // ingombro di un mobile (rettangolo ruotato) nella griglia
  markFurniture(cx, cz, w, d, rot) {
    const c = Math.cos(rot), s = Math.sin(rot), hw = w / 2, hd = d / 2, r = Math.hypot(hw, hd)
    for (let z = cz - r; z <= cz + r; z += this.cell) for (let x = cx - r; x <= cx + r; x += this.cell) {
      const dx = x - cx, dz = z - cz, lx = dx * c - dz * s, lz = dx * s + dz * c
      if (Math.abs(lx) <= hw && Math.abs(lz) <= hd) { const i = this.idx(x, z); if (i >= 0) this.furn[i] = 1 }
    }
  }
}

const inPoly = (x, z, pts) => {
  let ins = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, zi] = pts[i], [xj, zj] = pts[j]
    if ((zi > z) !== (zj > z) && x < ((xj - xi) * (z - zi)) / (zj - zi) + xi) ins = !ins
  }
  return ins
}

// rettangolo [x0,z0,x1,z1] come poligono; grow allarga solo nello spessore (per tagliare i muri da parte a parte)
const rectRing = (r, ax, grow = 0) => {
  const [x0, z0, x1, z1] = r, gx = ax === 'z' ? grow : 0, gz = ax === 'x' ? grow : 0
  return [[[x0 - gx, z0 - gz], [x1 + gx, z0 - gz], [x1 + gx, z1 + gz], [x0 - gx, z1 + gz], [x0 - gx, z0 - gz]]]
}
const closeRing = pts => { const r = pts.map(p => [p[0], p[1]]); r.push([...r[0]]); return r }
// poligono allargato di e (unione con le strisce dei lati): chiude le fessure tra esterni vicini
const grow = (pts, e) => [[closeRing(pts)], ...pts.map((a, i) => { const b = pts[(i + 1) % pts.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1e-6, nx = -(b[1] - a[1]) / L * e, nz = (b[0] - a[0]) / L * e, tx = (b[0] - a[0]) / L * e, tz = (b[1] - a[1]) / L * e
  return [closeRing([[a[0] - tx + nx, a[1] - tz + nz], [b[0] + tx + nx, b[1] + tz + nz], [b[0] + tx - nx, b[1] + tz - nz], [a[0] - tx - nx, a[1] - tz - nz]])] })]
const U = list => list.length ? pc.union(...list) : []
const D = (a, b) => (a.length && b.length) ? pc.difference(a, b) : a
// multipoligono (anelli in [x,z]) -> shape three.js
const shapesOf = mp => mp.map(P => shapeOf(P[0].slice(0, -1), P.slice(1).map(h => h.slice(0, -1))))

// Arco a tutto sesto (raggio = meta' luce, imposta tra 1,90 e 2,10 m); se la chiave non sta sotto il soffitto (14 cm di
// margine) arco ribassato: stessa imposta, freccia piu' bassa. top: fin dove si taglia il vano (10 cm sopra la chiave)
function archOf(d, H) {
  const ax = d.axis === 'x', w = ax ? d.rect[2] - d.rect[0] : d.rect[3] - d.rect[1], r = w / 2
  const spring = Math.min(DOOR_H, Math.max(1.9, H - 0.14 - r))
  let key = spring + r
  if (key > H - 0.14) key = Math.max(spring + 0.12, H - 0.14)
  return { w, spring, key, top: Math.min(H - 0.02, key + 0.1) }
}
// muro sopra l'intradosso nel vano dell'arco: profilo (lungo il vano, quota) estruso per lo spessore del muro. Due
// geometrie: le due facce (colorate come i muri) e i fianchi con l'intradosso
function archMasonry({ d, w, spring, key, top }) {
  const f = key - spring, R = f >= w / 2 - 1e-6 ? w / 2 : (w * w / 4 + f * f) / (2 * f), cy = key - R
  const t0 = Math.atan2(spring - cy, w / 2), N = 32
  const pts = [new THREE.Vector2(0, top), new THREE.Vector2(w, top), new THREE.Vector2(w, spring)]
  for (let i = 1; i < N; i++) { const t = t0 + (Math.PI - 2 * t0) * i / N; pts.push(new THREE.Vector2(w / 2 + R * Math.cos(t), cy + R * Math.sin(t))) }
  pts.push(new THREE.Vector2(0, spring))
  const [x0, z0, x1, z1] = d.rect, ax = d.axis === 'x', th = ax ? z1 - z0 : x1 - x0
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(pts), { depth: th, bevelEnabled: false, curveSegments: 1 })
  // (lungo, quota, spessore) -> mondo, senza specchiare (le normali restano fuori)
  const m = ax ? new THREE.Matrix4().set(1, 0, 0, x0, 0, 1, 0, 0, 0, 0, 1, z0, 0, 0, 0, 1) : new THREE.Matrix4().set(0, 0, 1, x0, 0, 1, 0, 0, -1, 0, 0, z1, 0, 0, 0, 1)
  g.applyMatrix4(m)
  const part = grp => { const out = new THREE.BufferGeometry(); for (const k of ['position', 'normal']) { const at = g.attributes[k]; out.setAttribute(k, new THREE.Float32BufferAttribute(at.array.slice(grp.start * 3, (grp.start + grp.count) * 3), 3)) } return worldUV(out) }
  return [part(g.groups[0]), part(g.groups[1])]
}

export function buildHouse(plan, M, { style = null, level = null, name = '' } = {}) {
  const H = plan.height || 2.7
  const group = new THREE.Group(); group.name = 'casa'
  const rooms = new Map(plan.rooms.map(r => [r.id, r]))
  const floors = [], hideInTop = [], lampAnchors = []

  // MURI: un'unica pianta 2D (unione booleana di muri e vani) per fascia di altezza, con i vani sottratti in 2D.
  // Fasce: 0-0,90 (porte aperte, finestre piene: il muretto), 0,90-2,10 (porte e finestre aperte), 2,10-2,25
  // (architrave delle porte, finestre aperte), 2,25-2,70 (tutto pieno). Fasce che si toccano senza sovrapporsi.
  const wallP = plan.walls.map(w => [closeRing(w.outer), ...w.holes.map(closeRing)])
  const openFill = [...plan.doors, ...plan.windows].map(o => rectRing(o.rect, o.axis))
  // scale disegnate dentro casa: i tramezzi che attraversano i gradini (inventati dal ridisegno) si tagliano; i muri
  // esterni (fascia di 35 cm lungo il contorno) e quelli che toccano solo il bordo della scala restano
  const stairFoot = []
  for (const r of plan.rooms) {
    if (r.type !== 'scala' || r.stair?.outdoor || !r.stair?.path) continue
    for (const q of r.stair.path) {
      if (q.k === 'fan') for (const w of q.wedges) { const cx = w.reduce((t, v) => t + v[0], 0) / w.length, cz = w.reduce((t, v) => t + v[1], 0) / w.length; stairFoot.push([closeRing(w.map(([x, z]) => [cx + (x - cx) * 0.94, cz + (z - cz) * 0.94]))]) }
      else { const [x0, z0, x1, z1] = q.box; stairFoot.push(rectRing([x0 + 0.05, z0 + 0.05, x1 - 0.05, z1 - 0.05])) }
    }
  }
  const stairCut = stairFoot.length && plan.outline?.length >= 3 ? pc.intersection(U(stairFoot), D([closeRing(plan.outline)], U(grow(plan.outline, 0.35).slice(1)))) : []
  const full = D(U([...wallP, ...openFill]), stairCut)
  // archi: il vano si taglia fino a sopra la chiave, poi si riempie col muro sopra l'intradosso (archMasonry)
  const arches = plan.doors.filter(d => d.arch && !d.entrance).map(d => ({ d, ...archOf(d, H) }))
  const cutDoors = U(plan.doors.filter(d => !d.arch || d.entrance).map(o => rectRing(o.rect, o.axis, 0.03)))
  const cutWins = U(plan.windows.map(o => rectRing(o.rect, o.axis, 0.03)))
  // pianta dei muri a terra (porte e archi aperti): pavimenti, griglia della camminata
  const band0 = D(full, U([cutDoors, ...arches.map(a => rectRing(a.d.rect, a.d.axis, 0.03))].filter(c => c.length)))
  // fasce di altezza: porte fino all'architrave, finestre tra davanzale e architrave, archi fino alla loro cima
  const ys = [...new Set([0, SILL, DOOR_H, HEAD, H, ...arches.map(a => a.top)].filter(y => y >= 0 && y <= H))].sort((a, b) => a - b)
  for (let k = 0; k + 1 < ys.length; k++) {
    const y0 = ys[k], y1 = ys[k + 1]
    const cuts = [...(y1 <= DOOR_H + 1e-6 ? [cutDoors] : []), ...(y0 >= SILL - 1e-6 && y1 <= HEAD + 1e-6 ? [cutWins] : []), ...arches.filter(a => y1 <= a.top + 1e-6).map(a => rectRing(a.d.rect, a.d.axis, 0.03))].filter(c => c.length)
    const mp = cuts.length ? D(full, U(cuts)) : full
    if (!mp.length) continue
    const g = new THREE.ExtrudeGeometry(shapesOf(mp), { depth: y1 - y0, bevelEnabled: false })
    g.rotateX(-Math.PI / 2); g.translate(0, y0, 0)
    const m = mesh(g, M.wall); m.name = `muri-${y0}`; group.add(m)
  }
  // muro sopra l'arco: facce col colore delle stanze (come i muri), intradosso intonacato bianco
  const archFaces = [], archSoffit = []
  for (const a of arches) { const [f, s2] = archMasonry(a); archFaces.push(f); archSoffit.push(s2) }
  if (archFaces.length) {
    const m = mesh(mergeGeometries(archFaces), M.wall); m.name = 'archi'; group.add(m)
    const sm = mesh(mergeGeometries(archSoffit), M.archPlaster || (M.archPlaster = new THREE.MeshStandardMaterial({ color: 0xf6f3ec, roughness: 0.95 }))); sm.name = 'archi-intradosso'; group.add(sm)
  }
  // SCALE: disposizione prima di soffitti e pavimenti (servono i buchi). Piu' piani: sale fino al penultimo, l'ultimo
  // scende. Un piano solo: sale (scende se il piano e' chiaramente alto: primo, secondo, mansarda)
  const count = level?.count || 1, idx = level?.index || 0
  const upper = /\b(primo|secondo|terzo|quarto|1\s*°|2\s*°|superiore|mansard|sottotett|attico|first|second|upper|attic)\b/i.test(name || plan.name || '')
  const indoorRooms = plan.rooms.filter(r => !isOpenRoom(r))
  const hc = indoorRooms.length ? [indoorRooms.reduce((a, r) => a + r.center[0], 0) / indoorRooms.length, indoorRooms.reduce((a, r) => a + r.center[1], 0) / indoorRooms.length] : null
  const stairs = []
  // dove una rampa che sale non puo' proseguire: dentro un muro o in una stanza della casa (non la sua)
  const wallPolys = plan.walls.map(w => w.outer)
  const blockedFor = r => (x, z) => wallPolys.some(P => inPoly(x, z, P)) || plan.rooms.some(q => q.id !== r.id && !isOpenRoom(q) && inPoly(x, z, q.poly))
  for (const r of plan.rooms.filter(x => x.type === 'scala')) {
    const open = !!r.stair?.outdoor
    let dir = open ? 'up' : count > 1 ? (idx < count - 1 ? 'up' : 'down') : (upper ? 'down' : 'up')
    // casa a un piano: il verso letto sulla planimetria (es. dalla cucina si scende in cantina) vince sull'ipotesi
    if (!open && count === 1 && (r.stair?.goes === 'giu' || r.stair?.goes === 'su')) dir = r.stair.goes === 'giu' ? 'down' : 'up'
    // nessun piano sopra nel modello: la scala esterna che sale e' tagliata come i muri, senza pianerottolo nel vuoto
    const cut = open && dir === 'up' && !(count > 1 && idx < count - 1) ? H : null
    const linked = count > 1 && !open && !(dir === 'up' && idx === count - 1)
    const L = layoutStair(r, plan, { dir, R: H + 0.27, base: open ? GY : 0, center: open ? hc : null, cut, blocked: cut !== null ? blockedFor(r) : null, linked })
    if (!L) continue
    L.open = open; L.linked = count > 1 && !open // si cambia piano camminando
    // scala disegnata verso un piano che non e' nel modello: i gradini disegnati e basta, tagliati ai muri se arrivano
    // piu' su; niente buco nel soffitto se non ci arrivano
    L.cutTop = L.path && !L.linked ? H : cut
    L.noHole = !!L.path && !L.linked && L.dir === 'up' && L.top < H - 0.05
    stairs.push(L)
  }
  const holeRing = L => { const [x0, z0, x1, z1] = L.hole; return [[[x0, z0], [x1, z0], [x1, z1], [x0, z1], [x0, z0]]] }
  const upHoles = stairs.filter(L => !L.open && L.dir === 'up' && !L.noHole).map(holeRing), downHoles = stairs.filter(L => !L.open && L.dir === 'down').map(holeRing)
  // sezione scura del muro vista dall'alto: un solo tappo 3 mm sopra la cima dei muri
  const capG = new THREE.ShapeGeometry(shapesOf(full)); capG.rotateX(-Math.PI / 2); capG.translate(0, H + 0.003, 0)
  group.add(mesh(capG, M.wallCut, { cast: false, receive: false }))

  // impronta della casa (muri + stanze): solaio sotto, soffitto, e solaio sopra che fa ombra al sole
  // la casa (stanze interne, terrazzi, muri) separata dagli esterni a terra (giardini, cortili, scale esterne)
  const roomP = plan.rooms.filter(r => !isGroundRoom(r)).map(r => [closeRing(r.poly)])
  const groundP = plan.rooms.filter(isGroundRoom).map(r => [closeRing(r.poly)])
  const downCut = downHoles.length ? U(downHoles) : []
  const foot = D(U([full, ...roomP]), downCut)
  const slab = new THREE.ExtrudeGeometry(shapesOf(foot), { depth: 0.25, bevelEnabled: false })
  slab.rotateX(-Math.PI / 2); slab.translate(0, -0.26, 0)
  group.add(mesh(slab, M.slab, { cast: false }))
  // sottofondo appena sotto i pavimenti: copre eventuali fessure tra pavimento e muro
  const sub = new THREE.ShapeGeometry(shapesOf(D(foot, band0))); sub.rotateX(-Math.PI / 2); sub.translate(0, -0.004, 0)
  const subMesh = mesh(sub, M.mat(floorKey({ type: 'soggiorno' }, style)), { cast: false }); group.add(subMesh)
  // terra sotto giardini e cortili: dal fondo del plastico al prato (si vede il taglio sul bordo)
  const groundFoot = groundP.length ? D(U(plan.rooms.filter(isGroundRoom).flatMap(r => grow(r.poly, 0.08))), U([full, ...roomP])) : []
  if (groundFoot.length) {
    const soil = new THREE.ExtrudeGeometry(shapesOf(groundFoot), { depth: 0.26 + GY - 0.006, bevelEnabled: false })
    soil.rotateX(-Math.PI / 2); soil.translate(0, -0.27, 0); group.add(mesh(soil, M.soil, { cast: false }))
  }
  // soffitto e solaio solo sopra le stanze interne (terrazzi e balconi all'aperto); buco sopra le scale che salgono
  const outR = plan.rooms.filter(r => OUTDOOR.has(r.type) && !GROUND.has(r.type)).map(r => [closeRing(r.poly)])
  const roofCut = [...outR, ...upHoles]
  const houseFoot = U([full, ...roomP]), roofFoot = roofCut.length ? D(houseFoot, U(roofCut)) : houseFoot
  const ceilGeo = new THREE.ShapeGeometry(shapesOf(roofFoot)); ceilGeo.rotateX(-Math.PI / 2); ceilGeo.translate(0, H, 0)
  const ceiling = mesh(ceilGeo, M.ceiling, { cast: false }); ceiling.name = 'soffitto'
  const roofGeo = new THREE.ExtrudeGeometry(shapesOf(roofFoot), { depth: 0.3, bevelEnabled: false })
  roofGeo.rotateX(-Math.PI / 2); roofGeo.translate(0, H + 0.01, 0)
  const roof = mesh(roofGeo, new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: false }), { cast: true, receive: false })
  roof.name = 'solaio'
  group.add(ceiling, roof); hideInTop.push(ceiling, roof)
  // gronda del tetto: cornice di 30 cm fuori dal filo dei muri, col colore di coppi o tegole; si vede solo da sotto
  // (nella vista dall'alto e' nascosta come il solaio, dentro casa e' sopra il soffitto)
  const ROOF_COL = { coppi: 0xb5562f, tegole: 0x9a4b30, piano: 0x8f8a84 }
  if (ROOF_COL[plan.materials?.roof]) {
    const quads = []
    for (const P of roofFoot) {
      const ring = P[0].slice(0, -1)
      let ar = 0; for (let i = 0; i < ring.length; i++) { const a = ring[i], b = ring[(i + 1) % ring.length]; ar += a[0] * b[1] - b[0] * a[1] }
      const o = ar > 0 ? 1 : -1 // normale verso fuori
      for (let i = 0; i < ring.length; i++) {
        const a = ring[i], b = ring[(i + 1) % ring.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.05) continue
        const nx = (b[1] - a[1]) / L * o * 0.3, nz = -(b[0] - a[0]) / L * o * 0.3
        quads.push([[a, b, [b[0] + nx, b[1] + nz], [a[0] + nx, a[1] + nz], a]])
      }
    }
    const band = quads.length ? D(U(quads), roofFoot) : []
    if (band.length) {
      const g = new THREE.ExtrudeGeometry(shapesOf(band), { depth: 0.16, bevelEnabled: false })
      g.rotateX(-Math.PI / 2); g.translate(0, H + 0.12, 0)
      const eave = mesh(g, new THREE.MeshStandardMaterial({ color: ROOF_COL[plan.materials.roof], roughness: 0.85 }), { cast: false })
      eave.name = 'gronda'; group.add(eave); hideInTop.push(eave)
    }
  }

  // PAVIMENTI: poligono della stanza + soglie delle sue porte, meno i muri, meno le stanze gia' fatte (niente sovrapposizioni)
  let used = []
  const floorPolys = new Map()
  for (const r of plan.rooms) {
    const thr = plan.doors.filter(d => !d.entrance && d.rooms[0] === r.id).map(d => rectRing(d.rect, d.axis, 0.03))
    const fill = (plan.fills || []).filter(f => f.room === r.id).map(f => [closeRing(f.poly)])
    // esterni a terra allargati di 8 cm (niente fessure verdi tra cortile e scala esterna), mai dentro la casa
    let fp = isGroundRoom(r) ? D(U([...grow(r.poly, 0.08), ...thr, ...fill]), U([band0, ...roomP])) : D(U([[closeRing(r.poly)], ...thr, ...fill]), band0)
    if (used.length) fp = D(fp, used)
    used = used.length ? U([used, fp]) : fp
    floorPolys.set(r.id, fp)
    const fpDraw = downCut.length ? D(fp, downCut) : fp // il buco della scala che scende
    if (!fpDraw.length) continue
    const g = new THREE.ShapeGeometry(shapesOf(fpDraw)); g.rotateX(-Math.PI / 2)
    if (isGroundRoom(r)) g.translate(0, GY, 0)
    const m = mesh(g, M.mat(floorKey(r, style)), { cast: false }); m.userData.roomId = r.id; m.userData.room = r; m.name = `pavimento-${r.id}`
    group.add(m); floors.push(m)
  }
  // parapetti dei terrazzi e balconi: muretto alto 1,05 m (si vede fuori, non si attraversa)
  const parP = U((plan.parapets || []).map(w => [closeRing(w.outer)]))
  const cutsP = [cutDoors, cutWins].filter(x => x.length)
  const parFree = cutsP.length ? D(parP, U(cutsP)) : parP
  if (parFree.length) {
    const g = new THREE.ExtrudeGeometry(shapesOf(parFree), { depth: 1.05, bevelEnabled: false })
    g.rotateX(-Math.PI / 2); group.add(mesh(g, M.wall))
    const capP = new THREE.ShapeGeometry(shapesOf(parFree)); capP.rotateX(-Math.PI / 2); capP.translate(0, 1.053, 0)
    group.add(mesh(capP, M.sill, { cast: false }))
  }
  // confini di giardini e cortili (siepe o muretto, fatti in outdoor.js): non si attraversano
  const bndP = (plan.boundaries || []).map(b => { const L = Math.hypot(b.b[0] - b.a[0], b.b[1] - b.a[1]) || 1e-6, t = b.kind === 'siepe' ? 0.25 : 0.12, nx = -(b.b[1] - b.a[1]) / L * t, nz = (b.b[0] - b.a[0]) / L * t
    return [closeRing([[b.a[0] + nx, b.a[1] + nz], [b.b[0] + nx, b.b[1] + nz], [b.b[0] - nx, b.b[1] - nz], [b.a[0] - nx, b.a[1] - nz]])] })
  const grid = new Grid(plan, U([band0, ...(parFree.length ? [parFree] : []), ...bndP]))

  // colori dei muri per stanza (letti dalle foto o scelti dall'agente) e facciata fuori: colore per vertice, guardando
  // la stanza che sta davanti a ogni faccia (5 cm verso la normale)
  // base: colore dello stile per le stanze senza colore letto dalle foto o scelto (si cambia dal vivo, setWallBase)
  const base = new THREE.Color(style?.wall ?? WALL_BASE)
  const wallColor = new Map(plan.rooms.map(r => [r.id, r.wall ? new THREE.Color(r.wall) : base]))
  const facade = new THREE.Color(plan.materials?.facade?.color || FACADE_BASE)
  for (const r of plan.rooms) if (isOpenRoom(r)) wallColor.set(r.id, facade) // dal terrazzo e dal giardino si vede la facciata
  const wallMeshes = []
  const facadeMat = M.facade?.(plan.materials?.facade?.kind, plan.materials?.facade?.color) // pietra o mattone
  const facadeParts = []
  group.traverse(o => {
    if (!o.isMesh || o.material !== M.wall) return
    // per triangolo (geometria non indicizzata): dal baricentro, lungo la normale da entrambe le parti (il verso dipende dal
    // giro del poligono e una parte e' dentro il muro), fino a 18 cm: la stanza davanti alla faccia, se no la facciata
    const g = o.geometry.index ? o.geometry.toNonIndexed() : o.geometry
    if (g !== o.geometry) o.geometry = g
    const pos = g.attributes.position, nor = g.attributes.normal, col = new Float32Array(pos.count * 3), fl = new Uint8Array(pos.count / 3), ext = new Uint8Array(pos.count / 3)
    for (let t = 0; t + 2 < pos.count; t += 3) {
      const x = (pos.getX(t) + pos.getX(t + 1) + pos.getX(t + 2)) / 3, z = (pos.getZ(t) + pos.getZ(t + 1) + pos.getZ(t + 2)) / 3
      const nx = nor.getX(t), ny = nor.getY(t), nz = nor.getZ(t)
      let c = base, b = 1
      if (Math.abs(ny) < 0.5) {
        let id = 0
        for (const k of [0.04, 0.09, 0.14, 0.18]) { id = grid.roomAt(x + nx * k, z + nz * k) || grid.roomAt(x - nx * k, z - nz * k); if (id) break }
        c = id ? (wallColor.get(id) || base) : facade
        b = id && c === base ? 1 : 0
        if (c === facade) ext[t / 3] = 1
      }
      fl[t / 3] = b
      for (let q = t; q < t + 3; q++) { col[q * 3] = c.r; col[q * 3 + 1] = c.g; col[q * 3 + 2] = c.b }
    }
    if (facadeMat) {
      // i triangoli della facciata passano su una mesh a parte con la texture di pietra o mattone (UV in metri)
      const inP = [], inN = [], inC = [], inF = [], exP = [], exN = []
      for (let t = 0; t + 2 < pos.count; t += 3) {
        const e = ext[t / 3]
        if (!e) inF.push(fl[t / 3])
        for (let q = t; q < t + 3; q++) {
          const P = [pos.getX(q), pos.getY(q), pos.getZ(q)], Nn = [nor.getX(q), nor.getY(q), nor.getZ(q)]
          if (e) { exP.push(...P); exN.push(...Nn) } else { inP.push(...P); inN.push(...Nn); inC.push(col[q * 3], col[q * 3 + 1], col[q * 3 + 2]) }
        }
      }
      const gi = new THREE.BufferGeometry(); gi.setAttribute('position', new THREE.Float32BufferAttribute(inP, 3)); gi.setAttribute('normal', new THREE.Float32BufferAttribute(inN, 3)); gi.setAttribute('color', new THREE.Float32BufferAttribute(inC, 3))
      worldUV(gi); o.geometry = gi; o.userData.baseTris = Uint8Array.from(inF); wallMeshes.push(o)
      if (exP.length) { const ge = new THREE.BufferGeometry(); ge.setAttribute('position', new THREE.Float32BufferAttribute(exP, 3)); ge.setAttribute('normal', new THREE.Float32BufferAttribute(exN, 3)); worldUV(ge); facadeParts.push(ge) }
      return
    }
    o.geometry.setAttribute('color', new THREE.BufferAttribute(col, 3)); o.userData.baseTris = fl; wallMeshes.push(o)
  })
  // colore di base dei muri (stile): solo i triangoli delle stanze senza colore proprio
  const setWallBase = hex => {
    base.set(hex)
    for (const o of wallMeshes) {
      const c = o.geometry.attributes.color, f = o.userData.baseTris
      for (let t = 0; t < f.length; t++) if (f[t]) for (let q = t * 3; q < t * 3 + 3; q++) c.setXYZ(q, base.r, base.g, base.b)
      c.needsUpdate = true
    }
  }
  if (facadeParts.length) { const fm = mesh(mergeGeometries(facadeParts), facadeMat); fm.name = 'facciata'; group.add(fm) }
  if (plan.materials?.frames) M.windowFrame.color.set(plan.materials.frames)
  const doorMat = plan.materials?.doors ? M.lacquer.clone() : M.lacquer
  if (plan.materials?.doors) doorMat.color.set(plan.materials.doors)
  const shutters = []
  const wallBits = [], frames = [], glass = [], sills = [], doorWood = [], entranceLeaf = [], handles = [], radiators = []
  const bx = (xa, ya, za, xb, yb, zb) => boxGeo(Math.min(xa, xb), Math.min(ya, yb), Math.min(za, zb), Math.max(xa, xb), Math.max(ya, yb), Math.max(za, zb))
  const sideRoom = (cx, cz, nx, nz, o) => grid.roomAt(cx + nx * o, cz + nz * o)

  // porte: architrave, imbotte, coprifili, anta aperta verso la stanza
  const doors = []
  for (const d of plan.doors) {
    const [x0, z0, x1, z1] = d.rect, ax = d.axis === 'x'
    const len = ax ? x1 - x0 : z1 - z0, th = ax ? z1 - z0 : x1 - x0
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2
    const J = 0.035, C = 0.07, CT = 0.012 // imbotte e coprifili
    // arco: niente telaio ne' anta (vano intonacato); passaggio senza porta: telaio si', anta no
    if (d.arch && !d.entrance) { doors.push({ ...d, center: [cx, cz], len, sgn: 1, normal: ax ? [0, 1] : [1, 0] }); continue }
    for (const e of [0, 1]) {
      const a0 = (ax ? x0 : z0) + (e ? len - J : 0)
      frames.push(ax ? boxGeo(a0, 0, z0 - CT, a0 + J, DOOR_H, z1 + CT) : boxGeo(x0 - CT, 0, a0, x1 + CT, DOOR_H, a0 + J))
    }
    frames.push(ax ? boxGeo(x0, DOOR_H - J, z0 - CT, x1, DOOR_H, z1 + CT) : boxGeo(x0 - CT, DOOR_H - J, z0, x1 + CT, DOOR_H, z1))
    for (const s of [-1, 1]) { // coprifili sulle due facce
      const f = s < 0 ? (ax ? z0 : x0) - CT : (ax ? z1 : x1), g = f + CT
      const a0 = ax ? x0 : z0, a1 = ax ? x1 : z1
      for (const [p0, p1, y0, y1] of [[a0 - C, a0, 0, DOOR_H + C], [a1, a1 + C, 0, DOOR_H + C], [a0 - C, a1 + C, DOOR_H, DOOR_H + C]])
        frames.push(ax ? boxGeo(p0, y0, f, p1, y1, g) : boxGeo(f, y0, p0, g, y1, p1))
    }
    // anta: chiusa nel piano del muro per il portoncino, aperta a 90 gradi verso la stanza "swing" per le altre
    const leafW = len - 2 * J, T = 0.042
    const n = ax ? [0, 1] : [1, 0]
    const sgn = sideRoom(cx, cz, n[0], n[1], th / 2 + 0.3) === d.swing ? 1 : -1
    const A0 = (ax ? x0 : z0) + J, C0 = ax ? cz : cx
    const put = (a0, a1, c0, c1, y0, y1, list) => list.push(ax ? bx(a0, y0, c0, a1, y1, c1) : bx(c0, y0, a0, c1, y1, a1))
    if (d.entrance) {
      put(A0, A0 + leafW, C0 - T / 2, C0 + T / 2, 0, DOOR_H - 0.01, entranceLeaf)
      put(A0 + leafW - 0.1, A0 + leafW - 0.06, C0 - 0.07, C0 + 0.07, 0.99, 1.01, handles)
    } else if (!d.varco) {
      const face = C0 + sgn * th / 2
      const leaves = leafW > 1.05 ? [[A0, 1, leafW / 2], [A0 + leafW, -1, leafW / 2]] : [[A0, 1, leafW]]
      for (const [h, dir, w] of leaves) {
        put(h, h + dir * T, face, face + sgn * w, 0, DOOR_H - 0.01, doorWood)
        const hc = h + dir * T / 2, tip = face + sgn * (w - 0.07)
        put(hc - 0.08, hc + 0.08, tip - 0.012, tip + 0.012, 0.99, 1.01, handles)
      }
    }
    doors.push({ ...d, center: [cx, cz], len, sgn, normal: n })
  }

  // finestre: muretto sotto, architrave sopra, telaio con ante, vetro, davanzale in marmo, termosifone
  const windows = []
  for (const w of plan.windows) {
    const [x0, z0, x1, z1] = w.rect, ax = w.axis === 'x'
    const len = ax ? x1 - x0 : z1 - z0, th = ax ? z1 - z0 : x1 - x0
    const cx = (x0 + x1) / 2, cz = (z0 + z1) / 2
    const inn = w.in // verso l'interno
    // piano del telaio: a 1/3 dello spessore verso l'esterno
    const fc = (ax ? cz : cx) - (ax ? inn[1] : inn[0]) * th * 0.18
    const FW = 0.065, FD = 0.07
    const a0 = ax ? x0 : z0, a1 = ax ? x1 : z1
    const bar = (p0, p1, y0, y1, d = FD) => ax ? boxGeo(p0, y0, fc - d / 2, p1, y1, fc + d / 2) : boxGeo(fc - d / 2, y0, p0, fc + d / 2, y1, p1)
    frames.push(bar(a0, a1, SILL, SILL + FW), bar(a0, a1, HEAD - FW, HEAD), bar(a0, a0 + FW, SILL, HEAD), bar(a1 - FW, a1, SILL, HEAD))
    const nS = len > 2.6 ? 3 : len > 0.95 ? 2 : 1
    const sw = (len - 2 * FW) / nS
    for (let i = 0; i < nS; i++) {
      const s0 = a0 + FW + i * sw, s1 = s0 + sw, SF = 0.055
      // telaio dell'anta
      frames.push(bar(s0, s1, SILL + FW, SILL + FW + SF, 0.06), bar(s0, s1, HEAD - FW - SF, HEAD - FW, 0.06), bar(s0, s0 + SF, SILL + FW, HEAD - FW, 0.06), bar(s1 - SF, s1, SILL + FW, HEAD - FW, 0.06))
      // maniglia dell'anta (lato interno)
      if (nS > 1 && i % 2 === 0 || nS === 1) {
        const hp = i % 2 === 0 ? s1 - SF / 2 : s0 + SF / 2, f = fc + (ax ? inn[1] : inn[0]) * 0.045
        handles.push(ax ? boxGeo(hp - 0.012, 1.35, f - 0.012, hp + 0.012, 1.5, f + 0.012) : boxGeo(f - 0.012, 1.35, hp - 0.012, f + 0.012, 1.5, hp + 0.012))
      }
      glass.push(bar(s0 + SF, s1 - SF, SILL + FW + SF, HEAD - FW - SF, 0.008))
    }
    // davanzale interno
    const face = (ax ? (inn[1] > 0 ? z1 : z0) : (inn[0] > 0 ? x1 : x0))
    const sIn = face + (ax ? inn[1] : inn[0]) * 0.035, sOut = fc
    const sa = Math.min(sIn, sOut), sb = Math.max(sIn, sOut)
    sills.push(ax ? boxGeo(a0 - 0.03, SILL, sa, a1 + 0.03, SILL + 0.03, sb) : boxGeo(sa, SILL, a0 - 0.03, sb, SILL + 0.03, a1 + 0.03)) // appoggiato sopra il muretto, non dentro
    const room = rooms.get(w.room)
    // termosifone in ghisa/alluminio sotto la finestra (non in bagno e cucina)
    if (room && !['bagno', 'cucina'].includes(room.type) && len > 0.7) {
      const rl = Math.min(len - 0.3, 1.2), n = Math.floor(rl / 0.08), r0 = (ax ? cx : cz) - (n * 0.08) / 2
      const rf = face + (ax ? inn[1] : inn[0]) * 0.05
      for (let i = 0; i < n; i++) {
        const p0 = r0 + i * 0.08 + 0.005, p1 = p0 + 0.07
        const q0 = Math.min(rf, rf + (ax ? inn[1] : inn[0]) * 0.08), q1 = Math.max(rf, rf + (ax ? inn[1] : inn[0]) * 0.08)
        radiators.push(ax ? boxGeo(p0, 0.14, q0, p1, 0.72, q1) : boxGeo(q0, 0.14, p0, q1, 0.72, p1))
      }
    }
    // persiane (scuri) aperte, accostate al muro fuori, col colore letto dalle foto: due ante ai lati della finestra
    if (plan.materials?.shutters && len > 0.4) {
      const out = ax ? (inn[1] > 0 ? z0 : z1) : (inn[0] > 0 ? x0 : x1), sg = -(ax ? inn[1] : inn[0]) // faccia esterna e verso fuori
      const lw = Math.min(0.75, len / 2), f0 = out + sg * 0.012, f1 = out + sg * 0.045
      for (const [p0, p1] of [[a0 - lw - 0.02, a0 - 0.02], [a1 + 0.02, a1 + lw + 0.02]]) {
        const box3 = (q0, q1, y0, y1, d0, d1) => shutters.push(ax ? bx(q0, y0, d0, q1, y1, d1) : bx(d0, y0, q0, d1, y1, q1))
        box3(p0, p1, SILL - 0.02, HEAD + 0.02, f0, f1)
        for (let y = SILL + 0.08; y < HEAD - 0.05; y += 0.075) box3(p0 + 0.04, p1 - 0.04, y, y + 0.03, f1, f1 + sg * 0.012) // lamelle
      }
    }
    windows.push({ ...w, center: [cx, cz], len, face, sillTop: SILL, head: HEAD })
  }
  const fr = merged(frames, M.windowFrame); if (fr) group.add(fr)
  const gl = merged(glass, M.glass, { cast: false, receive: false }); if (gl) { gl.renderOrder = 2; gl.name = 'vetri'; group.add(gl) }
  const si = merged(sills, M.sill); if (si) group.add(si)
  const ha = merged(handles, M.chrome, { cast: false }); if (ha) group.add(ha)
  const dw = merged(doorWood, doorMat); if (dw) group.add(dw)
  const el = merged(entranceLeaf, M.oakDark); if (el) group.add(el)
  const ra = merged(radiators, M.radiator); if (ra) group.add(ra)
  if (shutters.length) { const sm = new THREE.MeshStandardMaterial({ color: plan.materials.shutters, roughness: 0.55 }); const sh = merged(shutters, sm); if (sh) { sh.name = 'persiane'; group.add(sh) } }

  // battiscopa e rivestimenti: lungo i lati delle stanze che toccano un muro (non sulle soglie)
  const skirt = [], cladding = []
  const doorHit = (x, z) => plan.doors.some(d => !d.entrance && x > d.rect[0] - 0.06 && x < d.rect[2] + 0.06 && z > d.rect[1] - 0.06 && z < d.rect[3] + 0.06)
  // lungo i bordi del pavimento gia' ritagliato: coincidono con le facce dei muri
  let edgeN = 0
  for (const r of plan.rooms) for (const FP of floorPolys.get(r.id) || []) for (const [ri, ring] of FP.entries()) {
    const P = ring.slice(0, -1)
    let area = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; area += a[0] * b[1] - b[0] * a[1] }
    const o = (area > 0 ? 1 : -1) * (ri ? -1 : 1) // verso dell'anello (i buchi hanno il pavimento fuori)
    for (let i = 0; i < P.length; i++) {
      const hb = (edgeN++ % 2) * 0.002 // altezze alternate di 2 mm: niente facce sovrapposte negli angoli
      const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1])
      if (L < 0.1) continue
      const tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L
      const nx = tz * o, nz = -tx * o // normale verso l'esterno della stanza
      // tratti di 10 cm: battiscopa dove fuori c'e' muro e non c'e' una porta
      let run = null
      const flush = (t1) => {
        if (!run) return
        const t0 = run, p0 = [a[0] + tx * t0, a[1] + tz * t0], p1 = [a[0] + tx * t1, a[1] + tz * t1]
        const mk2 = (h, d) => { // profondita' verso l'interno della stanza
          const geo = new THREE.BoxGeometry(1, 1, 1)
          const m = new THREE.Matrix4().makeBasis(new THREE.Vector3(o * tx, 0, o * tz), new THREE.Vector3(0, 1, 0), new THREE.Vector3(-nx, 0, -nz))
          geo.scale(t1 - t0, h, d); geo.translate(0, h / 2, d / 2); geo.applyMatrix4(m)
          geo.translate((p0[0] + p1[0]) / 2, 0, (p0[1] + p1[1]) / 2)
          return worldUV(geo)
        }
        if (r.type === 'bagno') cladding.push(mk2(2.05 + hb, 0.008))
        else skirt.push(mk2(0.08 + hb, 0.012))
        run = null
      }
      for (let t = 0; t <= L + 1e-6; t += 0.05) {
        const x = a[0] + tx * t, z = a[1] + tz * t
        const ok = t < L && grid.isWall(x + nx * 0.07, z + nz * 0.07) && !doorHit(x, z) && !doorHit(x + nx * 0.07, z + nz * 0.07)
        if (ok && run === null) run = t
        if (!ok && run !== null) flush(t)
      }
      flush(L)
    }
  }
  for (const r of plan.rooms) {
    const [rx0, rz0, rx1, rz1] = r.rect
    lampAnchors.push({ room: r.id, type: r.type, x: (rx0 + rx1) / 2, z: (rz0 + rz1) / 2, rect: r.rect })
  }
  const sk = merged(skirt, M.lacquer, { cast: false }); if (sk) group.add(sk)
  const cl = merged(cladding, M.wallTiles, { cast: false }); if (cl) group.add(cl)

  // corpo delle scale esterne: intonaco del colore della facciata, o la sua pietra o il suo mattone
  let outBodyM = null
  const outBody = () => outBodyM || (outBodyM = facadeMat || new THREE.MeshStandardMaterial({ color: facade.clone(), roughness: 0.95 }))
  // scale: geometria, quote del calpestio e ringhiere nella griglia della camminata
  for (const L of stairs) {
    const indoor = !L.open
    const clipTop = (indoor && L.dir === 'up') || L.cutTop != null ? H : Infinity
    // scala disegnata che scende: il fondo del buco e' il piano di sotto, all'ultima alzata
    const depth = L.path && L.dir === 'down' ? Math.max(0.45, L.base - L.pathBottom + L.r) : Math.min(L.R - 0.2, Math.max(1.4, L.parts.find(p => p.kind === 'landing') ? -L.parts.find(p => p.kind === 'landing').y + 0.25 : 1.6))
    const st = buildStair(L, M, { clipTop, floorBase: L.dir === 'down' ? -depth : L.base, cutDepth: L.dir === 'down' ? -depth : -Infinity, wallAt: (x, z) => grid.isWall(x, z) && grid.roomAt(x, z) === 0, bodyMat: L.open ? outBody() : null })
    group.add(st.below)
    // la parte sopra il taglio c'e' solo se la scala continua dentro casa (al piano di sopra); quella esterna tagliata no
    if (st.above.children.length && L.cutTop == null) { group.add(st.above); hideInTop.push(st.above) }
    if (indoor && !L.noHole) { const sh = buildShaft(L, M, { H, depth, up: L.dir === 'up', floorMat: L.path ? M.stairTread : null }); group.add(sh); if (L.dir === 'up') hideInTop.push(sh) }
    // quote: celle della scala; nel buco senza rampa (non dovrebbe succedere) non si cammina
    const [hx0, hz0, hx1, hz1] = L.hole
    for (let z = hz0 + grid.cell / 2; z < hz1; z += grid.cell) for (let x = hx0 + grid.cell / 2; x < hx1; x += grid.cell) {
      const i = grid.idx(x, z); if (i < 0) continue
      const h = stairHeight(L, x, z)
      if (h === null) { if (L.dir === 'down') grid.block[i] = 1 } else grid.hgt[i] = h
    }
    for (const [x0, z0, x1, z1] of st.railSegs) grid.blockSeg(x0, z0, x1, z1)
    L.depth = depth
  }

  group.traverse(o => { if (o.isMesh && o.receiveShadow === undefined) o.receiveShadow = true })
  const xs = plan.outline.map(p => p[0]), zs = plan.outline.map(p => p[1])
  const bounds = { x0: Math.min(...xs), x1: Math.max(...xs), z0: Math.min(...zs), z1: Math.max(...zs) }
  return { group, grid, floors, hideInTop, ceiling, roof, rooms, doors, windows, lampAnchors, bounds, H, inPoly, stairs, setWallBase, subMesh }
}
export { inPoly }
