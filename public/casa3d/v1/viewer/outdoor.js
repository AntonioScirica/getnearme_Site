// Esterni a terra della casa (giardini e cortili, dalle scritte resede/corte/giardino o scelti dall'agente):
// confini del lotto come siepe (giardino) o muretto basso con copertina (cortile), vialetto in ghiaia dalle porte verso
// il giardino, arbusti lungo i bordi e uno o due alberi dove c'e' spazio. Tutto procedurale e leggero: arbusti e chiome
// sono istanze della stessa sfera irregolare (una draw call), niente erba 3D. Prato e pietra sono i pavimenti delle
// stanze (house.js). Vasi e arredo da esterno dipendono dallo stile e stanno in furnish.js.
import * as THREE from 'three'
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js'
import pc from '../vendor/polygon-clipping.js'
import { worldUV } from './materials.js'
import { leafBlob } from './furniture.js'
import { GY, inPoly } from './house.js'

const ring = pts => { const r = pts.map(p => [p[0], p[1]]); r.push([...r[0]]); return r }
function boxAlong(a, b, t, y0, y1) { // parallelepipedo lungo il segmento a-b, spesso t, da y0 a y1
  const L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.05) return null
  const g = new THREE.BoxGeometry(L, y1 - y0, t)
  g.rotateY(-Math.atan2(b[1] - a[1], b[0] - a[0])); g.translate((a[0] + b[0]) / 2, (y0 + y1) / 2, (a[1] + b[1]) / 2)
  return worldUV(g)
}
// numero pseudo-casuale stabile (stessa casa = stesso giardino)
const rnd = (i, k = 1) => { const v = Math.sin(i * 127.1 + k * 311.7) * 43758.5453; return v - Math.floor(v) }

export function buildOutdoor(plan, house, M, { lowEnd = false } = {}) {
  const group = new THREE.Group(); group.name = 'esterni'
  const grid = house.grid
  const gardens = plan.rooms.filter(r => r.type === 'giardino')
  // cortile con il verde nelle foto: pavimentato, con aiuole a prato lungo i bordi lontani dalla casa (come nei resede)
  const greenYards = plan.lawn ? plan.rooms.filter(r => r.type === 'cortile') : []
  const yards = plan.rooms.filter(r => r.type === 'giardino' || r.type === 'cortile')
  if (!yards.length && !(plan.boundaries || []).length) return group

  const hedge = [], wall = [], cap = []
  const add = (list, mat, cast = true) => { if (!list.length) return; const m = new THREE.Mesh(mergeGeometries(list), mat); m.castShadow = cast; m.receiveShadow = true; group.add(m) }

  // aiuole: strisce di prato larghe 1 m lungo i lati del cortile lontani dai muri di casa, ritagliate sul cortile
  const beds = [], bedPolys = [], curbs = []
  for (const g of greenYards) {
    const P = g.poly
    let area = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; area += a[0] * b[1] - b[0] * a[1] }
    const o = area > 0 ? 1 : -1
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 2.5) continue
      const tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L, nx = -tz * o, nz = tx * o
      // lato verso un'altra stanza (scala esterna, terrazzo): niente aiuola
      if ([0.25, 0.5, 0.75].some(k => { const id = grid.roomAt(a[0] + tx * L * k - nx * 0.15, a[1] + tz * L * k - nz * 0.15); return id && id !== g.id })) continue
      // lato contro la casa (muro a pochi cm fuori): niente aiuola, li' si cammina
      const houseSide = [0.25, 0.5, 0.75].filter(k => grid.isWall(a[0] + tx * L * k - nx * 0.12, a[1] + tz * L * k - nz * 0.12) && grid.roomAt(a[0] + tx * L * k - nx * 0.12, a[1] + tz * L * k - nz * 0.12) === 0).length >= 2
      if (houseSide) continue
      const w = 1.0, q = [[a[0] + tx * 0.3, a[1] + tz * 0.3], [b[0] - tx * 0.3, b[1] - tz * 0.3], [b[0] - tx * 0.3 + nx * w, b[1] - tz * 0.3 + nz * w], [a[0] + tx * 0.3 + nx * w, a[1] + tz * 0.3 + nz * w]]
      const stairsCut = house.stairs.map(L => [ring([[L.hole[0] - 0.3, L.hole[1] - 0.3], [L.hole[2] + 0.3, L.hole[1] - 0.3], [L.hole[2] + 0.3, L.hole[3] + 0.3], [L.hole[0] - 0.3, L.hole[3] + 0.3]])])
      const bedArea = stairsCut.length ? pc.difference(pc.intersection([ring(q)], [ring(P)]), ...stairsCut) : pc.intersection([ring(q)], [ring(P)])
      for (const C of bedArea) {
        const pts = C[0].slice(0, -1)
        let ar = 0; for (let k = 0; k < pts.length; k++) { const u = pts[k], v = pts[(k + 1) % pts.length]; ar += u[0] * v[1] - v[0] * u[1] }
        if (Math.abs(ar) / 2 < 1.5) continue
        const sh = new THREE.Shape(pts.map(([x, z]) => new THREE.Vector2(x, -z)))
        const geo = new THREE.ShapeGeometry(sh); geo.rotateX(-Math.PI / 2); geo.translate(0, GY + 0.02, 0); beds.push(worldUV(geo)); bedPolys.push(pts)
        // cordolo in pietra attorno all'aiuola
        for (let k = 0; k < pts.length; k++) { const e = boxAlong(pts[k], pts[(k + 1) % pts.length], 0.08, GY, GY + 0.07); if (e) curbs.push(e) }
      }
    }
  }
  add(beds, M.mat('lawn'), false)
  add(curbs, M.sill)

  // vialetto: da ogni porta che da' sul giardino, dritto fino al bordo (largo 1 m, ritagliato sul giardino)
  const paths = [], pathPolys = []
  for (const g of gardens) {
    for (const d of plan.doors.filter(d => d.rooms.includes(g.id))) {
      const [x0, z0, x1, z1] = d.rect, c = [(x0 + x1) / 2, (z0 + z1) / 2], ax = d.axis === 'x'
      let n = ax ? [0, 1] : [1, 0]
      if (!inPoly(c[0] + n[0] * 0.5, c[1] + n[1] * 0.5, g.poly)) n = [-n[0], -n[1]]
      if (!inPoly(c[0] + n[0] * 0.5, c[1] + n[1] * 0.5, g.poly)) continue
      let len = 0.4
      while (len < 14 && inPoly(c[0] + n[0] * (len + 0.1), c[1] + n[1] * (len + 0.1), g.poly)) len += 0.1
      if (len < 1) continue
      const w = 0.5, t = [-n[1] * w, n[0] * w], e = [c[0] + n[0] * len, c[1] + n[1] * len]
      const quad = [[c[0] + t[0], c[1] + t[1]], [e[0] + t[0], e[1] + t[1]], [e[0] - t[0], e[1] - t[1]], [c[0] - t[0], c[1] - t[1]]]
      const clip = pc.intersection([ring(quad)], [ring(g.poly)])
      for (const P of clip) {
        const s = new THREE.Shape(P[0].slice(0, -1).map(([x, z]) => new THREE.Vector2(x, -z)))
        const geo = new THREE.ShapeGeometry(s); geo.rotateX(-Math.PI / 2); geo.translate(0, GY + 0.008, 0); paths.push(worldUV(geo))
      }
      pathPolys.push(quad)
    }
  }
  add(paths, M.mat('gravel'), false)
  const onPath = (x, z, m = 0.5) => pathPolys.some(q => [[0, 0], [m, 0], [-m, 0], [0, m], [0, -m]].some(([dx, dz]) => inPoly(x + dx, z + dz, q)))
  const nearDoor = (x, z, m = 1.1) => plan.doors.some(d => x > d.rect[0] - m && x < d.rect[2] + m && z > d.rect[1] - m && z < d.rect[3] + m)
  const nearBoundary = (x, z) => segs.some(b => { const L = Math.hypot(b.b[0] - b.a[0], b.b[1] - b.a[1]) || 1e-6, t = Math.max(0, Math.min(1, ((x - b.a[0]) * (b.b[0] - b.a[0]) + (z - b.a[1]) * (b.b[1] - b.a[1])) / (L * L))); return Math.hypot(x - b.a[0] - t * (b.b[0] - b.a[0]), z - b.a[1] - t * (b.b[1] - b.a[1])) < 0.7 })

  // confini del lotto: le linee lette sulla pianta (plan.boundaries) e i lati degli esterni che non toccano la casa ne'
  // altre stanze. Siepe alta 1,1 m per i giardini, muretto 60 cm intonacato con copertina per i cortili; varco dove arriva
  // il vialetto
  const segs = (plan.boundaries || []).map(b => ({ a: b.a, b: b.b, kind: b.kind }))
  const nearSeg = (x, z) => segs.some(q => { const L = Math.hypot(q.b[0] - q.a[0], q.b[1] - q.a[1]) || 1e-6, t = Math.max(0, Math.min(1, ((x - q.a[0]) * (q.b[0] - q.a[0]) + (z - q.a[1]) * (q.b[1] - q.a[1])) / (L * L))); return Math.hypot(x - q.a[0] - t * (q.b[0] - q.a[0]), z - q.a[1] - t * (q.b[1] - q.a[1])) < 0.4 })
  for (const g of yards) {
    const P = g.poly, kind = g.type === 'giardino' ? 'siepe' : 'muretto'
    let area = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; area += a[0] * b[1] - b[0] * a[1] }
    const o = area > 0 ? 1 : -1
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 0.6) continue
      const tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L, nx = -tz * o, nz = tx * o, inset = kind === 'siepe' ? 0.28 : 0.14
      let run = null
      const flush = t1 => { if (run === null) return; if (t1 - run > 0.5) segs.push({ a: [a[0] + tx * run + nx * inset, a[1] + tz * run + nz * inset], b: [a[0] + tx * t1 + nx * inset, a[1] + tz * t1 + nz * inset], kind }); run = null }
      for (let t = 0; t <= L + 1e-6; t += 0.1) {
        const ox = a[0] + tx * t - nx * 0.2, oz = a[1] + tz * t - nz * 0.2, ix = a[0] + tx * t + nx * inset, iz = a[1] + tz * t + nz * inset
        const free = t < L && !grid.isWall(ox, oz) && grid.roomAt(ox, oz) === 0 && !onPath(ix, iz, 0.3) && !nearSeg(ix, iz) && !nearDoor(ix, iz, 0.2)
        if (free && run === null) run = t
        if (!free && run !== null) flush(t)
      }
      flush(L)
    }
  }
  for (const q of segs) {
    if (q.kind === 'siepe') { const g = boxAlong(q.a, q.b, 0.5, GY, GY + 1.1); if (g) hedge.push(g) }
    else { const g = boxAlong(q.a, q.b, 0.24, GY, GY + 0.6), c = boxAlong(q.a, q.b, 0.3, GY + 0.6, GY + 0.65); if (g) wall.push(g); if (c) cap.push(c) }
    grid.blockSeg(q.a[0], q.a[1], q.b[0], q.b[1], q.kind === 'siepe' ? 0.25 : 0.12)
  }
  add(hedge, M.mat('hedge'))
  add(wall, new THREE.MeshStandardMaterial({ color: plan.materials?.facade?.color || 0xefe6d6, roughness: 0.95 }))
  add(cap, M.sill)
  const flat = (x, z) => { const h = grid.heightAt(x, z); return h <= 0.01 && h >= GY - 0.01 } // non sulle scale
  const clear = (x, z, r) => { for (let a = 0; a < 6.283; a += 0.785) { const px = x + Math.cos(a) * r, pz = z + Math.sin(a) * r; if (!grid.free(px, pz) || !flat(px, pz)) return false } return grid.free(x, z) && flat(x, z) }

  // arbusti lungo i bordi dei giardini (rientrati di 55 cm), non davanti alle porte ne' sul vialetto; sulle aiuole
  const bushes = []
  for (const [i, P] of bedPolys.entries()) {
    const xs = P.map(p => p[0]), zs = P.map(p => p[1]), long = Math.max(...xs) - Math.min(...xs) > Math.max(...zs) - Math.min(...zs)
    const cx = (Math.min(...xs) + Math.max(...xs)) / 2, cz = (Math.min(...zs) + Math.max(...zs)) / 2, L = long ? Math.max(...xs) - Math.min(...xs) : Math.max(...zs) - Math.min(...zs)
    for (let s = -L / 2 + 0.6; s <= L / 2 - 0.6; s += 1.6) { const x = long ? cx + s : cx, z = long ? cz : cz + s; if (inPoly(x, z, P) && !nearDoor(x, z, 0.8)) bushes.push([x, z, 0.65 + 0.4 * rnd(i * 13 + bushes.length, 3)]) }
  }
  for (const g of gardens) {
    const P = g.poly
    let area = 0; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length]; area += a[0] * b[1] - b[0] * a[1] }
    const o = area > 0 ? 1 : -1
    for (let i = 0; i < P.length; i++) {
      const a = P[i], b = P[(i + 1) % P.length], L = Math.hypot(b[0] - a[0], b[1] - a[1]); if (L < 1) continue
      const tx = (b[0] - a[0]) / L, tz = (b[1] - a[1]) / L, nx = -tz * o, nz = tx * o // verso l'interno
      for (let s = 0.8; s < L - 0.6; s += 1.7) {
        const x = a[0] + tx * s + nx * 0.55, z = a[1] + tz * s + nz * 0.55
        if (!inPoly(x, z, P) || onPath(x, z) || nearDoor(x, z) || nearBoundary(x, z) || !clear(x, z, 0.35)) continue
        bushes.push([x, z, 0.75 + 0.45 * rnd(bushes.length, 3)])
        if (bushes.length > (lowEnd ? 14 : 28)) break
      }
    }
  }
  // alberi: dove c'e' piu' spazio libero (almeno 1,8 m attorno), lontani dalla casa e tra loro
  const trees = []
  for (const g of gardens) {
    const xs = g.poly.map(p => p[0]), zs = g.poly.map(p => p[1]), cands = []
    for (let z = Math.min(...zs) + 1; z < Math.max(...zs) - 1; z += 0.5) for (let x = Math.min(...xs) + 1; x < Math.max(...xs) - 1; x += 0.5) {
      if (!inPoly(x, z, g.poly) || onPath(x, z, 1)) continue
      let r = 0; for (const rr of [1.2, 1.8, 2.4, 3]) { if (clear(x, z, rr)) r = rr; else break }
      if (r >= 1.8) cands.push([x, z, r])
    }
    cands.sort((a, b) => b[2] - a[2])
    for (const c of cands) { if (trees.length >= 2 || trees.some(t => Math.hypot(t[0] - c[0], t[1] - c[1]) < 4)) continue; trees.push(c) }
  }
  // istanze: arbusti e chiome con la stessa geometria, tono per istanza
  const blobs = [...bushes.flatMap(([x, z, s], i) => [[0, 0, 0.75], [0.22, 0.12, 0.6], [-0.2, 0.15, 0.55], [0.05, -0.2, 0.58]].map(([dx, dz, k]) => ({ x: x + dx * s, y: GY + 0.3 * s * k / 0.75 + 0.05, z: z + dz * s, s: s * k * (0.9 + 0.2 * rnd(i, dx * 10 + 3)), k: 0 }))), ...trees.flatMap(([x, z], i) => [[0, 2.9, 0, 1.25], [0.55, 2.5, 0.2, 0.95], [-0.4, 2.6, -0.35, 1.0], [0.1, 3.4, -0.1, 0.85]].map(([dx, y, dz, s]) => ({ x: x + dx, y: GY + y, z: z + dz, s: s * (0.9 + 0.2 * rnd(i, 7)), k: 1 })))]
  if (blobs.length) {
    const im = new THREE.InstancedMesh(leafBlob(0.5, 3), M.leaf, blobs.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), col = new THREE.Color()
    blobs.forEach((b, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd(i, 5) * 6.28)
      m4.compose(new THREE.Vector3(b.x, b.y, b.z), q, new THREE.Vector3(b.s, b.s * (b.k ? 0.8 : 0.9), b.s)); im.setMatrixAt(i, m4)
      im.setColorAt(i, col.setRGB(0.85 + 0.25 * rnd(i, 9), 0.9 + 0.2 * rnd(i, 11), 0.8 + 0.2 * rnd(i, 13)))
    })
    im.castShadow = true; im.receiveShadow = true; im.name = 'verde'; group.add(im)
  }
  if (trees.length) {
    const trunks = trees.map(([x, z]) => { const g = new THREE.CylinderGeometry(0.09, 0.14, 2.6, 10); g.translate(x, GY + 1.3, z); return worldUV(g) })
    add(trunks, M.bark)
  }
  // non si attraversano
  for (const [x, z, s] of bushes) grid.blockSeg(x, z, x, z, 0.3 * s)
  for (const [x, z] of trees) grid.blockSeg(x, z, x, z, 0.2)
  return group
}
