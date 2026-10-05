// Materiali PBR della casa. Texture CC0 Poly Haven (webp 1k/2k) caricate da assetsBase (in futuro R2).
// Tutte le geometrie generate hanno UV in metri: repeat = 1 / lato reale della texture.
import * as THREE from 'three'

const TEX_SIZE = { // lato reale in metri (dall'API Poly Haven)
  laminate_floor_02: 1.7, interior_tiles: 1.9, marble_01: 1.5, long_white_tiles: 1.27, plastered_wall_04: 3.2,
  cotton_jersey: 0.264, poly_wool_herringbone: 0.27, oak_veneer_01: 1.83, hessian_230: 0.27, stretch_poplin: 0.29,
  rough_linen: 0.27, leather_white: 0.3,
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
    const m = new THREE.MeshStandardMaterial({
      color, roughness, metalness: 0,
      map: map ? tex(name, 'Diffuse', scale) : null,
      normalMap: tex(name, 'nor_gl', scale),
      normalScale: new THREE.Vector2(normalScale, normalScale),
      roughnessMap: tex(name, 'arm', scale),
      aoMap: ao ? tex(name, 'arm', scale) : null, aoMapIntensity: 0.8,
      ...(side ? { side } : {}), ...rest,
    })
    return m
  }
  const M = {
    // muri: intonaco bianco caldo, solo rilievo e ruvidita' dalla texture (niente macchie)
    // muri: intonaco, colore per vertice (stanza per stanza, facciata fuori: vedi house.js), bianco caldo di base
    wall: pbr('plastered_wall_04', { map: false, color: 0xffffff, normalScale: 0.25, roughness: 1, ao: false, vertexColors: true }),
    wallCut: new THREE.MeshStandardMaterial({ color: 0x2f2d2b, roughness: 0.9 }),
    ceiling: new THREE.MeshStandardMaterial({ color: 0xf6f3ee, roughness: 0.95, side: THREE.BackSide }),
    parquet: pbr('laminate_floor_02', { roughness: 0.62, normalScale: 0.6 }),
    tiles: pbr('interior_tiles', { roughness: 0.7, normalScale: 0.7 }),
    // varianti dei pavimenti letti dalle foto dell'immobile (stesse texture CC0, tinte)
    parquetLight: pbr('laminate_floor_02', { roughness: 0.62, normalScale: 0.6, color: 0xfff1dc }),
    parquetDark: pbr('laminate_floor_02', { roughness: 0.58, normalScale: 0.6, color: 0x7a5a42 }),
    tilesDark: pbr('interior_tiles', { roughness: 0.6, normalScale: 0.7, color: 0x8d8984 }),
    cotto: pbr('interior_tiles', { roughness: 0.85, normalScale: 0.8, color: 0xc77b55 }),
    graniglia: pbr('marble_01', { roughness: 0.45, normalScale: 0.5, color: 0xd8cdbf }),
    marble: pbr('marble_01', { roughness: 0.5, normalScale: 0.5 }),
    wallTiles: pbr('long_white_tiles', { roughness: 0.35, normalScale: 0.6 }),
    slab: new THREE.MeshStandardMaterial({ color: 0x8a857e, roughness: 1 }),
    lacquer: new THREE.MeshStandardMaterial({ color: 0xf3f1ec, roughness: 0.38 }),
    lacquerWarm: new THREE.MeshStandardMaterial({ color: 0xe9e3d8, roughness: 0.45 }),
    sage: new THREE.MeshStandardMaterial({ color: 0x8f9a86, roughness: 0.55 }),
    oak: pbr('oak_veneer_01', { roughness: 0.6, normalScale: 0.4 }),
    oakDark: pbr('oak_veneer_01', { roughness: 0.55, normalScale: 0.4, color: 0x8a6f58 }),
    sofaFabric: pbr('cotton_jersey', { scale: 1.6, roughness: 1, color: 0xd8d2c8, normalScale: 0.8 }),
    sofaFabricDark: pbr('poly_wool_herringbone', { scale: 1.6, roughness: 1, color: 0x9da3a8 }),
    linenWhite: pbr('stretch_poplin', { scale: 1.6, map: false, color: 0xf2efe9, roughness: 1, normalScale: 0.7 }),
    linenSand: pbr('rough_linen', { scale: 1.6, map: false, color: 0xcdbfa9, roughness: 1, normalScale: 0.8 }),
    throwGrey: pbr('poly_wool_herringbone', { scale: 1.2, roughness: 1, color: 0xb9b2a8 }),
    headboard: pbr('poly_wool_herringbone', { scale: 1.6, roughness: 1, color: 0xc8c0b4 }),
    rug: pbr('hessian_230', { scale: 2.5, roughness: 1, color: 0xe0d6c4, normalScale: 1.2 }),
    curtain: pbr('rough_linen', { scale: 1.5, map: false, color: 0xf2eee6, roughness: 1, normalScale: 0.6, side: THREE.DoubleSide }),
    shade: pbr('rough_linen', { scale: 0.8, map: false, color: 0xf1e8da, roughness: 1, side: THREE.DoubleSide, emissive: 0xffc98f, emissiveIntensity: 0 }),
    metalBlack: new THREE.MeshStandardMaterial({ color: 0x1d1d1d, roughness: 0.45, metalness: 0.7 }),
    steel: new THREE.MeshStandardMaterial({ color: 0xcfd2d4, roughness: 0.25, metalness: 1 }),
    chrome: new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.08, metalness: 1 }),
    ceramic: new THREE.MeshPhysicalMaterial({ color: 0xfbfbf9, roughness: 0.12, clearcoat: 0.8, clearcoatRoughness: 0.08 }),
    glass: new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.03, metalness: 0, transparent: true, opacity: 0.1, envMapIntensity: 1.0, depthWrite: false }),
    showerGlass: new THREE.MeshPhysicalMaterial({ color: 0xeef4f3, roughness: 0.05, transparent: true, opacity: 0.18, depthWrite: false }),
    mirror: new THREE.MeshStandardMaterial({ color: 0xe9eef0, roughness: 0.02, metalness: 1 }),
    screen: new THREE.MeshStandardMaterial({ color: 0x050505, roughness: 0.15, metalness: 0.2 }),
    countertop: new THREE.MeshStandardMaterial({ color: 0x3b3936, roughness: 0.35 }),
    hob: new THREE.MeshStandardMaterial({ color: 0x0b0b0b, roughness: 0.1, metalness: 0.1 }),
    windowFrame: new THREE.MeshStandardMaterial({ color: 0xf7f6f3, roughness: 0.4 }),
    sill: pbr('marble_01', { scale: 0.6, roughness: 0.35 }),
    radiator: new THREE.MeshStandardMaterial({ color: 0xf5f4f0, roughness: 0.32, metalness: 0.1 }),
    bulb: new THREE.MeshStandardMaterial({ color: 0xffffff, emissive: 0xffd7a8, emissiveIntensity: 0 }),
    duvet: pbr('stretch_poplin', { scale: 1.3, map: false, color: 0xf3f1ec, roughness: 1, normalScale: 0.9 }),
    blanket: pbr('cotton_jersey', { scale: 1.3, roughness: 1, color: 0xb7a58e, normalScale: 0.9 }),
    pillow: pbr('stretch_poplin', { scale: 1.3, map: false, color: 0xeeeae2, roughness: 1 }),
    pillowAccent: pbr('poly_wool_herringbone', { scale: 1.3, roughness: 1, color: 0x9a8f7f }),
    leather: pbr('leather_white', { roughness: 0.6, color: 0x7a5a42 }),
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
