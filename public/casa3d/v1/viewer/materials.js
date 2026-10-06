// Materiali PBR della casa. Texture CC0 Poly Haven (webp 1k/2k) caricate da assetsBase (R2).
// Tutte le geometrie generate hanno UV in metri: repeat = 1 / lato reale della texture.
// Pavimenti ed esterni si creano solo quando servono (M.mat): con uno stile si scarica solo quello che si vede.
// Gli "slot" dei mobili (legno, laccato, tessuti, metalli, scala, esterni) si ritingono dal vivo con applyStyle.
import * as THREE from 'three'

const TEX_SIZE = { // lato reale in metri (dall'API Poly Haven)
  laminate_floor_02: 1.7, interior_tiles: 1.9, marble_01: 1.5, long_white_tiles: 1.27, plastered_wall_04: 3.2,
  cotton_jersey: 0.264, poly_wool_herringbone: 0.27, oak_veneer_01: 1.83, hessian_230: 0.27, stretch_poplin: 0.29,
  rough_linen: 0.27, leather_white: 0.3,
  stone_wall: 2.0, red_brick_03: 1.0, // facciate (caricate solo se la casa e' in pietra o mattone)
  herringbone_parquet: 3.4, leafy_grass: 2.0, rectangular_paving: 2.0, gravel_floor: 2.25, // stili ed esterni (al bisogno)
}
// slot dei mobili -> materiale (nomi storici del catalogo)
export const SLOT = {
  wood: 'oak', cabinet: 'cabinet', kitchen: 'lacquerWarm', top: 'top', metal: 'metalBlack', sofa: 'sofaFabric', accent: 'pillowAccent', accent2: 'throwGrey',
  blanket: 'blanket', headboard: 'headboard', rug: 'rug', curtain: 'curtain', shade: 'shade', duvet: 'duvet', pillow: 'pillow', linen: 'linenWhite',
  stairTread: 'stairTread', stairRiser: 'stairRiser', stairBody: 'stairBody', rail: 'rail', handrail: 'handrail', outMetal: 'outMetal', outWood: 'outWood', outFabric: 'outFabric',
}

export function createMaterials(assetsBase, renderer, { lowEnd = false } = {}) {
  const loader = new THREE.TextureLoader()
  const aniso = Math.min(lowEnd ? 4 : 8, renderer.capabilities.getMaxAnisotropy())
  const cache = new Map()
  const pending = []
  function tex(name, kind, scale = 1) {
    const key = `${name}/${kind}/${scale}`
    if (cache.has(key)) return cache.get(key)
    let t
    pending.push(new Promise(r => { t = loader.load(`${assetsBase}/tex/${name}/${kind}.webp`, r, undefined, r) }))
    t.wrapS = t.wrapT = THREE.RepeatWrapping
    t.anisotropy = aniso
    const rep = 1 / (TEX_SIZE[name] * scale)
    t.repeat.set(rep, rep)
    if (kind === 'Diffuse') t.colorSpace = THREE.SRGBColorSpace
    cache.set(key, t)
    return t
  }
  // set PBR completo: colore, normali, ruvidita'/occlusione (arm: R=ao, G=roughness)
  function pbr(name, { scale = 1, color = 0xffffff, map = true, normalScale = 1, roughness = 1, ao = true, side, ...rest } = {}) {
    return new THREE.MeshStandardMaterial({
      color, roughness, metalness: 0,
      map: map ? tex(name, 'Diffuse', scale) : null,
      normalMap: tex(name, 'nor_gl', scale),
      normalScale: new THREE.Vector2(normalScale, normalScale),
      roughnessMap: tex(name, 'arm', scale),
      aoMap: ao ? tex(name, 'arm', scale) : null, aoMapIntensity: 0.8,
      ...(side ? { side } : {}), ...rest,
    })
  }
  const std = o => new THREE.MeshStandardMaterial({ roughness: 0.45, ...o })
  const M = {
    // muri: intonaco, colore per vertice (stanza per stanza, facciata fuori: vedi house.js), solo rilievo dalla texture
    wall: pbr('plastered_wall_04', { map: false, color: 0xffffff, normalScale: 0.25, roughness: 1, ao: false, vertexColors: true }),
    wallCut: std({ color: 0x2f2d2b, roughness: 0.9 }),
    ceiling: std({ color: 0xf6f3ee, roughness: 0.95, side: THREE.BackSide }),
    shaft: std({ color: 0xf1ede6, roughness: 0.95 }), // pareti del vano scala sopra e sotto il buco nel solaio
    wallTiles: pbr('long_white_tiles', { roughness: 0.35, normalScale: 0.6 }),
    slab: std({ color: 0x8a857e, roughness: 1 }),
    soil: std({ color: 0x5b4a3a, roughness: 1 }), // terra sotto giardini e cortili (bordo del plastico)
    lacquer: std({ color: 0xf3f1ec, roughness: 0.38 }), // battiscopa e porte (architettura, non cambia con lo stile)
    oakDark: pbr('oak_veneer_01', { roughness: 0.55, normalScale: 0.4, color: 0x8a6f58 }), // portoncino
    steel: std({ color: 0xcfd2d4, roughness: 0.25, metalness: 1 }),
    chrome: std({ color: 0xffffff, roughness: 0.08, metalness: 1 }),
    ceramic: new THREE.MeshPhysicalMaterial({ color: 0xfbfbf9, roughness: 0.12, clearcoat: 0.8, clearcoatRoughness: 0.08 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.1, envMapIntensity: 1.0, depthWrite: false }),
    showerGlass: new THREE.MeshPhysicalMaterial({ color: 0xeef4f3, roughness: 0.05, transparent: true, opacity: 0.18, depthWrite: false }),
    mirror: std({ color: 0xe9eef0, roughness: 0.02, metalness: 1 }),
    screen: std({ color: 0x050505, roughness: 0.15, metalness: 0.2 }),
    hob: std({ color: 0x0b0b0b, roughness: 0.1, metalness: 0.1 }),
    windowFrame: std({ color: 0xf7f6f3, roughness: 0.4 }),
    sill: pbr('marble_01', { scale: 0.6, roughness: 0.35 }),
    radiator: std({ color: 0xf5f4f0, roughness: 0.32, metalness: 0.1 }),
    bulb: std({ color: 0xffffff, emissive: 0xffd7a8, emissiveIntensity: 0 }),
    leaf: std({ color: 0xffffff, roughness: 0.85, vertexColors: true }), // siepi, arbusti e chiome (colore per istanza o vertice)
    bark: std({ color: 0x5a4636, roughness: 0.95 }),
    pot: std({ color: 0xb9653f, roughness: 0.8 }), // vasi in cotto degli esterni
  }
  // slot dei mobili: materiali propri (si ritingono con lo stile senza toccare porte, battiscopa e casa)
  for (const k of Object.values(SLOT)) if (!M[k]) M[k] = std({ color: 0xffffff, roughness: 0.6 })
  M.curtain.side = THREE.DoubleSide; M.shade.side = THREE.DoubleSide
  M.shade.emissive = new THREE.Color(0xffc98f); M.shade.emissiveIntensity = 0

  // pavimenti ed esterni: creati alla prima richiesta (texture scaricate solo se servono)
  const LAZY = {
    parquet: () => pbr('laminate_floor_02', { roughness: 0.62, normalScale: 0.6 }),
    parquetLight: () => pbr('laminate_floor_02', { roughness: 0.62, normalScale: 0.6, color: 0xfff1dc }),
    parquetDark: () => pbr('laminate_floor_02', { roughness: 0.58, normalScale: 0.6, color: 0x7a5a42 }),
    parquetPale: () => { const m = pbr('laminate_floor_02', { roughness: 0.66, normalScale: 0.5 }); m.color.setRGB(1.32, 1.24, 1.12); return m }, // rovere sbiancato (Nordico)
    herringbone: () => pbr('herringbone_parquet', { roughness: 0.55, normalScale: 0.6 }),
    tiles: () => pbr('interior_tiles', { roughness: 0.7, normalScale: 0.7 }),
    tilesLight: () => pbr('long_white_tiles', { roughness: 0.4, normalScale: 0.5, color: 0xf4f2ee }),
    tilesDark: () => pbr('interior_tiles', { roughness: 0.6, normalScale: 0.7, color: 0x8d8984 }),
    cotto: () => pbr('interior_tiles', { roughness: 0.85, normalScale: 0.8, color: 0xc77b55 }),
    graniglia: () => pbr('marble_01', { roughness: 0.45, normalScale: 0.5, color: 0xd8cdbf }),
    marble: () => pbr('marble_01', { roughness: 0.5, normalScale: 0.5 }),
    resina: () => pbr('plastered_wall_04', { map: false, roughness: 0.55, normalScale: 0.15, color: 0x9d9a95, ao: false }), // microcemento
    lawn: () => pbr('leafy_grass', { roughness: 1, normalScale: 0.8, color: 0x9fbf6a }),
    paving: () => pbr('rectangular_paving', { roughness: 0.85, normalScale: 0.8, color: 0xd9d2c6 }),
    gravel: () => pbr('gravel_floor', { roughness: 1, normalScale: 0.9, color: 0xe6ddcc }),
    hedge: () => pbr('leafy_grass', { roughness: 1, normalScale: 1.4, color: 0x4f7a3a, scale: 0.5 }),
  }
  M.mat = key => M[key] || (LAZY[key] ? (M[key] = LAZY[key]()) : M.parquet || (M.parquet = LAZY.parquet()))

  // spec di stile -> materiale (texture al bisogno; ricompilazione solo se cambia la presenza delle mappe)
  M.applySpec = (mat, s) => {
    if (!mat || !s) return
    const had = [!!mat.map, !!mat.normalMap, !!mat.roughnessMap, !!mat.aoMap]
    const sc = s.scale ?? 1
    mat.map = s.tex ? tex(s.tex, 'Diffuse', sc) : null
    const nor = s.tex || s.nor
    mat.normalMap = nor ? tex(nor, 'nor_gl', sc) : null
    mat.roughnessMap = nor ? tex(nor, 'arm', sc) : null
    mat.aoMap = s.tex ? tex(s.tex, 'arm', sc) : null
    mat.aoMapIntensity = 0.8
    mat.normalScale.set(s.normal ?? 1, s.normal ?? 1)
    if (Array.isArray(s.color)) mat.color.setRGB(...s.color); else mat.color.set(s.color ?? 0xffffff)
    mat.roughness = s.rough ?? 0.6; mat.metalness = s.metal ?? 0
    if (had.join() !== [!!mat.map, !!mat.normalMap, !!mat.roughnessMap, !!mat.aoMap].join()) mat.needsUpdate = true
  }
  M.applyStyle = st => { for (const [slot, key] of Object.entries(SLOT)) M.applySpec(M[key], st.mats[slot]) }

  // facciata vera dalle foto: pietra o mattone CC0 tinti col colore letto (texture caricate solo quando servono)
  M.facade = (kind, color) => {
    const name = kind === 'pietra' ? 'stone_wall' : kind === 'mattone' ? 'red_brick_03' : null
    if (!name) return null
    const tint = new THREE.Color(color || 0xffffff).lerp(new THREE.Color(0xffffff), 0.45) // tinta leggera: la texture ha gia' il suo colore
    return pbr(name, { roughness: 0.95, normalScale: 1, color: tint })
  }
  M.ready = () => Promise.all(pending)
  return M
}

// UV in metri su qualsiasi geometria (proiezione triplanare sull'asse dominante della normale).
export function worldUV(geo, offset = [0, 0, 0]) {
  const p = geo.attributes.position, n = geo.attributes.normal
  const uv = new Float32Array(p.count * 2)
  for (let i = 0; i < p.count; i++) {
    const x = p.getX(i) + offset[0], y = p.getY(i) + offset[1], z = p.getZ(i) + offset[2]
    const ax = Math.abs(n.getX(i)), ay = Math.abs(n.getY(i)), az = Math.abs(n.getZ(i))
    if (ay >= ax && ay >= az) { uv[i * 2] = x; uv[i * 2 + 1] = z }
    else if (ax >= az) { uv[i * 2] = z; uv[i * 2 + 1] = y }
    else { uv[i * 2] = x; uv[i * 2 + 1] = y }
  }
  geo.setAttribute('uv', new THREE.BufferAttribute(uv, 2))
  return geo
}
