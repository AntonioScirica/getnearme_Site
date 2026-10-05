// Catalogo mobili: modelli glTF CC0 Poly Haven (realistici, scala reale) + pezzi procedurali per cio' che Poly Haven
// non ha in stile contemporaneo (divano, letto, armadio, cucina, sanitari, scrivania, tv, tappeto, lampade, tende).
// Convenzione: oggetto centrato in x/z, appoggiato a y=0, schiena verso -z, fronte verso +z.
import * as THREE from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { worldUV } from './materials.js'

// modelli Poly Haven: file, rotazione per avere il fronte su +z, misure (w x d x h) dopo la rotazione
export const MODELS = {
  armchair: { file: 'modern_arm_chair_01', rot: 0 },
  lounge: { file: 'mid_century_lounge_chair', rot: 0 },
  coffee: { file: 'modern_coffee_table_01', rot: Math.PI / 2 },
  coffeeRound: { file: 'coffee_table_round_01', rot: 0 },
  tvunit: { file: 'modern_wooden_cabinet', rot: 0 },
  pendant: { file: 'modern_ceiling_lamp_01', rot: 0 },
  plantBig: { file: 'potted_plant_01', rot: 0 },
  plantMid: { file: 'potted_plant_02', rot: 0 },
  plantSmall: { file: 'potted_plant_04', rot: 0 },
  nightstand: { file: 'side_table_01', rot: 0 },
  chest: { file: 'drawer_cabinet', rot: 0 },
  shelves: { file: 'wooden_display_shelves_01', rot: Math.PI / 2 },
  picture1: { file: 'hanging_picture_frame_01', rot: 0 },
  picture2: { file: 'hanging_picture_frame_02', rot: 0 },
  photo: { file: 'standing_picture_frame_01', rot: -Math.PI / 2 },
  vase: { file: 'ceramic_vase_01', rot: 0 },
  vaseTall: { file: 'ceramic_vase_03', rot: 0 },
  chair: { file: 'dining_chair_02', rot: 0 },
  deskLamp: { file: 'desk_lamp_arm_01', rot: 0 },
  pillows: { file: 'throw_pillows_01', rot: 0 },
  basket: { file: 'wicker_basket_01', rot: 0 },
}

export function createCatalog(assetsBase, M, { lowEnd = false } = {}) {
  const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder)
  const proto = new Map()
  async function loadModel(kind) {
    const def = MODELS[kind]
    if (!proto.has(kind)) proto.set(kind, loader.loadAsync(`${assetsBase}/models/${def.file}.glb`).then(g => {
      const root = new THREE.Group(); const s = g.scene
      s.rotation.y = def.rot; root.add(s); root.updateMatrixWorld(true)
      const b = new THREE.Box3().setFromObject(root)
      s.position.x -= (b.min.x + b.max.x) / 2; s.position.z -= (b.min.z + b.max.z) / 2; s.position.y -= b.min.y
      root.traverse(o => { if (o.isMesh && /glass/i.test(o.material.name)) { Object.assign(o.material, { metalness: 0, roughness: 0.05, transparent: true, opacity: 0.1, depthWrite: false, map: null, metalnessMap: null, color: new THREE.Color(0) }); o.material.needsUpdate = true; o.castShadow = false }
        if (o.isMesh && o.material.transmission > 0) { o.material.transmission = 0; o.material.transparent = true; o.material.opacity = 0.15; o.material.depthWrite = false; o.castShadow = false }
        if (o.isMesh) { o.castShadow = !lowEnd || b.max.y - b.min.y > 0.5; o.receiveShadow = true; if (o.material.map) o.material.map.anisotropy = 4 } })
      root.userData.size = [b.max.x - b.min.x, b.max.z - b.min.z, b.max.y - b.min.y]
      return root
    }))
    const p = await proto.get(kind)
    const c = p.clone(); c.userData.size = p.userData.size; return c
  }
  const box = (w, h, d, mat, x = 0, y = 0, z = 0, r = 0) => {
    const g = r > 0 ? new RoundedBoxGeometry(w, h, d, 3, Math.min(r, w / 2, h / 2, d / 2) - 1e-4) : new THREE.BoxGeometry(w, h, d)
    worldUV(g, [x, y, z])
    const m = new THREE.Mesh(g, mat); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; return m
  }
  const cyl = (rt, rb, h, mat, x = 0, y = 0, z = 0, seg = 32, open = false) => {
    const g = new THREE.CylinderGeometry(rt, rb, h, seg, 1, open); worldUV(g)
    const m = new THREE.Mesh(g, mat); m.position.set(x, y + h / 2, z); m.castShadow = true; m.receiveShadow = true; return m
  }
  const grp = (...ch) => { const g = new THREE.Group(); ch.flat().forEach(c => c && g.add(c)); return g }

  const P = {
    // divano 3 posti in tessuto, cuscini morbidi, piedini neri
    sofa({ w = 2.1 } = {}) {
      const d = 0.95, arm = 0.16, f = M.sofaFabric, g = []
      g.push(box(w, 0.22, d, f, 0, 0.06, 0, 0.03))
      g.push(box(arm, 0.6, d, f, -w / 2 + arm / 2, 0.06, 0, 0.06), box(arm, 0.6, d, f, w / 2 - arm / 2, 0.06, 0, 0.06))
      g.push(box(w - 2 * arm + 0.02, 0.5, 0.2, f, 0, 0.28, -d / 2 + 0.1, 0.06))
      const n = w > 1.9 ? 3 : 2, cw = (w - 2 * arm) / n
      for (let i = 0; i < n; i++) {
        const x = -w / 2 + arm + cw * (i + 0.5)
        g.push(box(cw - 0.01, 0.14, d - 0.22, f, x, 0.28, 0.1, 0.05))
        const back = box(cw - 0.02, 0.42, 0.17, f, x, 0.42, -d / 2 + 0.27, 0.07); back.rotation.x = -0.12; g.push(back)
      }
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.push(cyl(0.018, 0.014, 0.06, M.metalBlack, sx * (w / 2 - 0.08), 0, sz * (d / 2 - 0.08)))
      for (const sx of [-1, 1]) { // cuscini decorativi
        const c = box(0.44, 0.42, 0.13, sx < 0 ? M.pillowAccent : M.throwGrey, sx * (w / 2 - arm - 0.3), 0.4, -d / 2 + 0.38, 0.06)
        c.rotation.set(-0.28, sx * 0.18, sx * 0.04); g.push(c)
      }
      const throwB = box(0.5, 0.025, 0.75, M.blanket, w / 2 - arm - 0.3, 0.42, 0.05, 0.01); throwB.rotation.y = 0.08; g.push(throwB)
      return grp(g)
    },
    // letto: base imbottita, testiera, materasso, piumone, cuscini, plaid
    bed({ w = 1.6, l = 2.0 } = {}) {
      const g = [], head = 0.08
      g.push(box(w + 0.08, 0.3, l + 0.06, M.headboard, 0, 0.04, 0.03, 0.03)) // giroletto imbottito
      g.push(box(w + 0.12, 1.08, head, M.headboard, 0, 0.04, -l / 2 - head / 2 + 0.03, 0.035)) // testiera
      g.push(box(w, 0.2, l - 0.04, M.linenWhite, 0, 0.33, 0.02, 0.05)) // materasso
      const dz0 = -l / 2 + 0.5, dz1 = l / 2 + 0.06 // piumone che scende sui lati
      g.push(box(w + 0.07, 0.33, dz1 - dz0, M.duvet, 0, 0.28, (dz0 + dz1) / 2, 0.05))
      g.push(box(w + 0.08, 0.07, 0.24, M.duvet, 0, 0.58, dz0 + 0.1, 0.035)) // risvolto
      g.push(box(w + 0.1, 0.3, 0.55, M.blanket, 0, 0.33, l / 2 - 0.26, 0.04)) // plaid ai piedi
      const np = w > 1.2 ? 2 : 1, pw = w > 1.2 ? (w - 0.12) / 2 : w - 0.16
      for (let i = 0; i < np; i++) {
        const x = np === 1 ? 0 : (i ? 1 : -1) * (pw / 2 + 0.02)
        const p = box(pw, 0.17, 0.46, M.pillow, x, 0.5, -l / 2 + 0.3, 0.075); p.rotation.x = -0.22; g.push(p)
      }
      const pa = box(w > 1.2 ? 0.5 : 0.42, 0.34, 0.13, M.pillowAccent, 0, 0.55, -l / 2 + 0.52, 0.06); pa.rotation.x = -0.3; g.push(pa)
      return grp(g)
    },
    // armadio laccato con ante e maniglie a barra
    wardrobe({ w = 2.0, h = 2.36 } = {}) {
      const d = 0.6, g = [box(w, h - 0.08, d - 0.02, M.lacquer, 0, 0.08, -0.01), box(w - 0.04, 0.08, d - 0.08, M.metalBlack, 0, 0, -0.03)]
      const n = Math.max(2, Math.round(w / 0.5)), dw = w / n
      for (let i = 0; i < n; i++) {
        g.push(box(dw - 0.004, h - 0.085, 0.02, M.lacquer, -w / 2 + dw * (i + 0.5), 0.082, d / 2 - 0.01, 0.002))
        const hx = -w / 2 + dw * (i + 0.5) + (i % 2 ? -1 : 1) * (dw / 2 - 0.05)
        g.push(box(0.012, 0.32, 0.02, M.metalBlack, hx, 1.0, d / 2 + 0.01))
      }
      return grp(g)
    },
    // cucina lineare: basi, top, pensili, colonna frigo, lavello, piano cottura, forno, alzatina
    kitchen({ w = 3.0 } = {}) {
      const g = [], D = 0.6, colW = w > 2.4 ? 0.6 : 0
      const baseW = w - colW, bx0 = -w / 2 + colW
      g.push(box(baseW, 0.1, D - 0.06, M.metalBlack, bx0 + baseW / 2, 0, -0.03))
      const n = Math.max(2, Math.round(baseW / 0.6)), dw = baseW / n
      for (let i = 0; i < n; i++) {
        const x = bx0 + dw * (i + 0.5)
        g.push(box(dw - 0.004, 0.76, 0.02, M.lacquerWarm, x, 0.1, D / 2 - 0.01, 0.002))
        g.push(box(dw * 0.5, 0.012, 0.02, M.metalBlack, x, 0.8, D / 2 + 0.008))
      }
      g.push(box(baseW, 0.76, D - 0.02, M.lacquerWarm, bx0 + baseW / 2, 0.1, -0.02))
      g.push(box(baseW + 0.01, 0.04, D + 0.02, M.oak, bx0 + baseW / 2, 0.86, 0.01))
      // lavello in acciaio e rubinetto
      const sx = bx0 + baseW * 0.7
      g.push(box(0.5, 0.012, 0.4, M.steel, sx, 0.895, 0.02))
      const sinkIn = box(0.44, 0.005, 0.34, M.metalBlack, sx, 0.902, 0.02); sinkIn.material = M.steel; g.push(sinkIn)
      g.push(cyl(0.015, 0.018, 0.3, M.chrome, sx, 0.9, -0.2))
      const spout = cyl(0.01, 0.01, 0.2, M.chrome, sx, 1.13, -0.13); spout.rotation.x = Math.PI / 2; g.push(spout)
      // piano cottura a induzione e forno
      const hx = bx0 + baseW * 0.28
      g.push(box(0.6, 0.006, 0.5, M.hob, hx, 0.9, 0.0))
      g.push(box(0.58, 0.58, 0.022, M.hob, hx, 0.17, D / 2 + 0.001))
      g.push(box(0.5, 0.015, 0.02, M.steel, hx, 0.68, D / 2 + 0.02))
      // alzatina in piastrelle e pensili
      g.push(box(baseW, 0.6, 0.01, M.wallTiles, bx0 + baseW / 2, 0.9, -D / 2 + 0.005))
      const ud = 0.35, uy = 1.5, uh = 0.72
      g.push(box(baseW, uh, ud - 0.02, M.lacquerWarm, bx0 + baseW / 2, uy, -D / 2 + ud / 2 - 0.01))
      for (let i = 0; i < n; i++) g.push(box(dw - 0.004, uh - 0.005, 0.02, M.lacquerWarm, bx0 + dw * (i + 0.5), uy + 0.003, -D / 2 + ud - 0.01, 0.002))
      // cappa integrata e luce sotto pensile
      const led = box(baseW - 0.1, 0.01, 0.03, M.bulb, bx0 + baseW / 2, uy - 0.012, -D / 2 + ud - 0.06); led.castShadow = false; led.userData.lamp = true; g.push(led)
      if (colW) { // colonna frigo
        g.push(box(colW, 2.2, D, M.lacquerWarm, -w / 2 + colW / 2, 0, 0))
        g.push(box(colW - 0.004, 1.3, 0.02, M.lacquerWarm, -w / 2 + colW / 2, 0.1, D / 2 + 0.01, 0.002), box(colW - 0.004, 0.76, 0.02, M.lacquerWarm, -w / 2 + colW / 2, 1.42, D / 2 + 0.01, 0.002))
        g.push(box(0.012, 0.4, 0.02, M.metalBlack, -w / 2 + colW - 0.05, 0.95, D / 2 + 0.025))
      }
      // utensili sul piano: tagliere e barattoli
      g.push(box(0.4, 0.02, 0.28, M.oak, bx0 + baseW * 0.5, 0.9, -0.12, 0.005))
      for (let i = 0; i < 3; i++) g.push(cyl(0.05, 0.05, 0.16 - i * 0.03, M.ceramic, bx0 + 0.15 + i * 0.12, 0.9, -0.2))
      return grp(g)
    },
    wc() {
      const g = []
      g.push(box(0.36, 0.38, 0.5, M.ceramic, 0, 0.0, 0.04, 0.12))
      g.push(box(0.37, 0.025, 0.47, M.ceramic, 0, 0.38, 0.06, 0.01))
      g.push(box(0.36, 0.4, 0.14, M.ceramic, 0, 0.36, -0.2, 0.04))
      g.push(box(0.16, 0.09, 0.012, M.chrome, 0, 0.62, -0.13))
      return grp(g)
    },
    sink() { // mobile lavabo sospeso, lavabo in ceramica, rubinetto, specchio con luce
      const g = [box(0.6, 0.45, 0.45, M.oak, 0, 0.4, 0.0, 0.01), box(0.62, 0.12, 0.47, M.ceramic, 0, 0.85, 0.01, 0.02)]
      g.push(cyl(0.015, 0.02, 0.18, M.chrome, 0, 0.97, -0.15))
      const sp = cyl(0.01, 0.01, 0.12, M.chrome, 0, 1.12, -0.1); sp.rotation.x = Math.PI / 2; g.push(sp)
      g.push(box(0.6, 0.8, 0.02, M.mirror, 0, 1.15, -0.215))
      const l = box(0.5, 0.03, 0.06, M.bulb, 0, 1.98, -0.19); l.userData.lamp = true; l.castShadow = false; g.push(l)
      return grp(g)
    },
    shower({ w = 0.9, d = 0.8 } = {}) {
      const g = [box(w, 0.04, d, M.ceramic, 0, 0, 0, 0.01)]
      const gl = box(0.008, 2.0, d * 0.55, M.showerGlass, w / 2 - 0.01, 0.04, d / 2 - d * 0.275); gl.castShadow = false; g.push(gl)
      const gl2 = box(w * 0.98, 2.0, 0.008, M.showerGlass, 0, 0.04, d / 2 - 0.005); gl2.castShadow = false; g.push(gl2)
      g.push(box(0.02, 0.02, 0.4, M.chrome, 0, 2.05, -d / 2 + 0.2), cyl(0.11, 0.11, 0.01, M.chrome, 0, 2.03, -d / 2 + 0.38))
      g.push(box(0.03, 1.0, 0.03, M.chrome, 0, 0.9, -d / 2 + 0.03))
      return grp(g)
    },
    bathtub({ w = 1.7, d = 0.75 } = {}) { // vasca rettangolare in ceramica: fondo, quattro sponde, bordo, rubinetto a un'estremita'
      const t = 0.07, h = 0.56, g = [box(w, 0.06, d, M.ceramic, 0, 0, 0, 0.01)]
      g.push(box(w, h, t, M.ceramic, 0, 0, -d / 2 + t / 2, 0.02), box(w, h, t, M.ceramic, 0, 0, d / 2 - t / 2, 0.02))
      g.push(box(t, h, d - 2 * t, M.ceramic, -w / 2 + t / 2, 0, 0, 0.02), box(t, h, d - 2 * t, M.ceramic, w / 2 - t / 2, 0, 0, 0.02))
      g.push(cyl(0.02, 0.025, 0.2, M.chrome, -w / 2 + 0.12, h, -d / 2 + 0.12))
      const sp = cyl(0.012, 0.012, 0.14, M.chrome, -w / 2 + 0.12, h + 0.18, -d / 2 + 0.18); sp.rotation.x = Math.PI / 2; g.push(sp)
      return grp(g)
    },
    desk({ w = 1.3, d = 0.65 } = {}) {
      const g = [box(w, 0.03, d, M.oak, 0, 0.72, 0, 0.004)]
      for (const s of [-1, 1]) { g.push(box(0.03, 0.72, 0.03, M.metalBlack, s * (w / 2 - 0.05), 0, d / 2 - 0.05), box(0.03, 0.72, 0.03, M.metalBlack, s * (w / 2 - 0.05), 0, -d / 2 + 0.05), box(0.03, 0.03, d - 0.1, M.metalBlack, s * (w / 2 - 0.05), 0.08, 0)) }
      g.push(box(0.32, 0.015, 0.23, M.metalBlack, -0.1, 0.75, 0.05, 0.004)) // portatile chiuso
      return grp(g)
    },
    table({ w = 1.4, d = 0.85 } = {}) {
      const g = [box(w, 0.035, d, M.oak, 0, 0.715, 0, 0.005)]
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) g.push(box(0.045, 0.715, 0.045, M.oak, sx * (w / 2 - 0.08), 0, sz * (d / 2 - 0.08)))
      return grp(g)
    },
    tv() {
      const g = [box(1.23, 0.71, 0.03, M.screen, 0, 0.1, 0, 0.004), box(0.3, 0.012, 0.2, M.metalBlack, 0, 0, 0), box(0.06, 0.1, 0.03, M.metalBlack, 0, 0.0, -0.02)]
      return grp(g)
    },
    tvcab({ w = 1.6 } = {}) {
      const g = [box(w, 0.42, 0.42, M.lacquer, 0, 0.12, 0, 0.004)]
      for (const sx of [-1, 1]) g.push(box(0.03, 0.12, 0.03, M.metalBlack, sx * (w / 2 - 0.08), 0, 0.12), box(0.03, 0.12, 0.03, M.metalBlack, sx * (w / 2 - 0.08), 0, -0.12))
      for (let i = 0; i < 3; i++) g.push(box(w / 3 - 0.004, 0.41, 0.01, M.lacquer, -w / 2 + w / 6 + i * w / 3, 0.125, 0.212, 0.002))
      return grp(g)
    },
    rug({ w = 2.0, d = 1.4 } = {}) {
      const r = box(w, 0.012, d, M.rug, 0, 0, 0, 0.004); r.castShadow = false; return grp(r)
    },
    floorLamp() {
      const g = [cyl(0.15, 0.15, 0.02, M.metalBlack), cyl(0.012, 0.012, 1.45, M.metalBlack, 0, 0.02, 0)]
      const sh = cyl(0.2, 0.24, 0.32, M.shade, 0, 1.38, 0, 48, true); sh.userData.shade = true; sh.castShadow = false; g.push(sh)
      return grp(g)
    },
    tableLamp() {
      const g = [cyl(0.07, 0.08, 0.26, M.ceramic, 0, 0, 0)]
      const sh = cyl(0.11, 0.14, 0.2, M.shade, 0, 0.26, 0, 40, true); sh.userData.shade = true; sh.castShadow = false; g.push(sh)
      return grp(g)
    },
    ceilingLight() { // plafoniera
      const b = cyl(0.17, 0.19, 0.06, M.bulb, 0, -0.06, 0); b.userData.lamp = true; b.castShadow = false; return grp(b)
    },
    curtain({ w = 0.5, h = 2.6 } = {}) { // tenda di lino con pieghe
      // sezione ondulata (pieghe) estrusa in altezza: un solido sottile, ombreggiatura pulita
      const n = Math.max(24, Math.round(w / 0.012)), T = 0.008, pts = [], back = []
      for (let i = 0; i <= n; i++) { const x = -w / 2 + (w * i) / n, z = Math.sin(x * Math.PI * 2 / 0.16) * 0.028; pts.push(new THREE.Vector2(x, z)); back.push(new THREE.Vector2(x, z - T)) }
      const shape = new THREE.Shape([...pts, ...back.reverse()])
      const geo = new THREE.ExtrudeGeometry(shape, { depth: h, bevelEnabled: false, curveSegments: 1 })
      geo.rotateX(-Math.PI / 2); geo.translate(0, 0, 0.04); geo.computeVertexNormals(); worldUV(geo)
      const m = new THREE.Mesh(geo, M.curtain); m.castShadow = false; m.receiveShadow = false
      return grp(m)
    },
    towel() { const g = [box(0.5, 0.02, 0.02, M.chrome, 0, 1.2, 0), box(0.45, 0.5, 0.03, M.linenSand, 0, 0.72, 0.02, 0.01)]; return grp(g) },
  }

  async function make(kind, opts = {}) {
    if (P[kind]) return P[kind](opts)
    if (MODELS[kind]) return loadModel(kind)
    console.warn('mobile sconosciuto', kind); return new THREE.Group()
  }
  return { make, preload: kinds => Promise.all([...new Set(kinds)].filter(k => MODELS[k]).map(loadModel)) }
}
