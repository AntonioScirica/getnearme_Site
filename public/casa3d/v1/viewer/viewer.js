// Visore 3D della casa: modulo indipendente, embeddabile. Riceve plan.json + opzioni, carica gli asset da assetsBase.
//   const v = await createViewer(el, { plan, assetsBase, view: 'top'|'walk', time: 'day'|'night', furnished: true, style: 'moderno',
//     level: { index, count }, start: { from: 'below'|'above' }, onStair: dir => ..., onStyle: id => ... })
//   v.setView('walk'), v.setTime('night'), v.setFurnished(false), v.setStyle('nordico'), v.enterRoom(id), v.dispose()
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { createMaterials, worldUV } from './materials.js'
import { buildHouse, floorKey, isGroundRoom } from './house.js'
import { createCatalog } from './furniture.js'
import { planFurniture } from './furnish.js'
import { WalkControls } from './walk.js'
import { buildOutdoor } from './outdoor.js'
import { styleOf, validStyle } from './styles.js'

export const ROOM_LABEL = { soggiorno: 'Soggiorno', cucina: 'Cucina', camera: 'Camera', cameretta: 'Cameretta', studio: 'Studio', bagno: 'Bagno', ingresso: 'Ingresso', corridoio: 'Corridoio', ripostiglio: 'Ripostiglio', balcone: 'Balcone', terrazzo: 'Terrazzo', scala: 'Scala', lavanderia: 'Lavanderia', stanza: 'Stanza', giardino: 'Giardino', cortile: 'Cortile' }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const DAYFILL = new THREE.Color(0xfff6ec), WARM = new THREE.Color(0xffd3a3) // tono delle luci: dallo stile (setStyle)
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
const lerp = (a, b, t) => a + (b - a) * t

export async function createViewer(container, opts = {}) {
  const o = { view: 'top', time: 'day', furnished: true, quality: 'auto', labels: true, style: 'moderno', onProgress: () => {}, ...opts }
  if (!validStyle(o.style)) o.style = 'moderno'
  if (o.style === 'vuota') o.furnished = false
  let ST = styleOf(o.style)
  const plan = o.plan || await (await fetch(o.planUrl)).json()
  const lowEnd = o.quality === 'low' || (o.quality === 'auto' && (/Mobi|Android|iPhone|iPad/i.test(navigator.userAgent) || Math.min(innerWidth, innerHeight) < 600))
  const H = plan.height || 2.7

  // renderer: PBR, ACES, ombre morbide
  const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: 'high-performance', preserveDrawingBuffer: !!o.preserveDrawingBuffer })
  renderer.setPixelRatio(Math.min(devicePixelRatio, lowEnd ? 1.5 : 2))
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  container.appendChild(renderer.domElement)
  renderer.domElement.style.touchAction = 'none'

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(55, container.clientWidth / container.clientHeight, 0.05, 600)

  o.onProgress(0.1, 'Materiali')
  const M = createMaterials(o.assetsBase, renderer, { lowEnd })
  M.applyStyle(ST)
  const house = buildHouse(plan, M, { style: ST, level: o.level, name: plan.name })
  scene.add(house.group)
  scene.add(buildOutdoor(plan, house, M, { lowEnd, assetsBase: o.assetsBase }))

  // cielo: sfera con le due foto HDRI (giorno/notte) mescolate (camminata), piu' il fondo della vista dall'alto
  // ("studio"): di giorno sfumatura verticale sullo schermo, azzurro tenue in alto e bianco caldo in basso; di notte
  // blu profondo con poche stelle tenui ferme. Tutto nello shader, niente immagini in piu'.
  const texL = new THREE.TextureLoader()
  const bgDay = texL.load(`${o.assetsBase}/hdri/castel_st_angelo_roof_bg.webp`), bgNight = texL.load(`${o.assetsBase}/hdri/rooftop_night_bg.webp`)
  // niente mipmap sul cielo: alla cucitura della sfera (u da 1 a 0) la mipmap sbagliata disegnava una riga tratteggiata
  for (const t of [bgDay, bgNight]) { t.colorSpace = THREE.SRGBColorSpace; t.generateMipmaps = false; t.minFilter = THREE.LinearFilter }
  const skyU = { day: { value: bgDay }, night: { value: bgNight }, mixN: { value: 0 }, studio: { value: 0 }, bright: { value: 1 }, rotY: { value: 0.9 }, vpH: { value: 1 }, pr: { value: 1 } }
  const sky = new THREE.Mesh(new THREE.SphereGeometry(70, 48, 24), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, toneMapped: false,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D day; uniform sampler2D night; uniform float mixN; uniform float studio; uniform float bright; uniform float rotY; uniform float vpH; uniform float pr; varying vec3 vDir;
      float hash(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
      void main(){ vec3 d = normalize(vDir); float u = fract(atan(d.z, d.x) / 6.2831853 + 0.5 + rotY); float v = asin(clamp(d.y,-1.,1.)) / 3.1415926 + 0.5;
        vec3 c = mix(texture2D(day, vec2(u, v)).rgb, texture2D(night, vec2(u, v)).rgb * 0.75, mixN) * bright;
        float t = clamp(gl_FragCoord.y / vpH, 0., 1.);
        vec3 sd = mix(vec3(1.0, 0.93, 0.83), vec3(0.42, 0.64, 0.93), smoothstep(0.0, 1.0, t));
        vec3 sn = mix(vec3(0.030, 0.045, 0.110), vec3(0.008, 0.014, 0.045), smoothstep(0.0, 1.0, t));
        float cs = 34.0 * pr; vec2 cell = floor(gl_FragCoord.xy / cs);
        float h = hash(cell), on = step(0.86, h);
        vec2 sp = (cell + 0.5 + (vec2(hash(cell + 7.1), hash(cell + 3.7)) - 0.5) * 0.7) * cs;
        float star = on * smoothstep(1.3 * pr, 0.0, length(gl_FragCoord.xy - sp)) * (0.25 + 0.55 * hash(cell + 1.3)) * smoothstep(0.15, 0.6, t);
        vec3 s = mix(sd, sn + vec3(0.85, 0.88, 1.0) * star, mixN);
        gl_FragColor = vec4(mix(c, s, studio), 1.0);
        #include <colorspace_fragment>
      }`,
  }))
  sky.renderOrder = -1; sky.frustumCulled = false; scene.add(sky)

  // HDRI per i riflessi e la luce ambiente
  o.onProgress(0.25, 'Luce')
  const pmrem = new THREE.PMREMGenerator(renderer)
  const hdr = new HDRLoader()
  const [envDay, envNight] = await Promise.all(['castel_st_angelo_roof', 'rooftop_night'].map(n => hdr.loadAsync(`${o.assetsBase}/hdri/${n}_256.hdr`).then(t => { const e = pmrem.fromEquirectangular(t).texture; t.dispose(); return e })))
  scene.environment = envDay
  scene.environmentRotation.y = 0.9

  // sole: direzionale con ombre, entra dalle finestre (il solaio fa ombra)
  const B = house.bounds, cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2, R = Math.hypot(B.x1 - B.x0, B.z1 - B.z0) / 2 + 1
  const sun = new THREE.DirectionalLight(0xfff0dc, 4.2)
  const sunDir = new THREE.Vector3(0.38, 0.52, 0.76).normalize()
  const SD = 2 * R + 8
  sun.position.set(cx + sunDir.x * SD, sunDir.y * SD, cz + sunDir.z * SD); sun.target.position.set(cx, 0, cz)
  sun.castShadow = true
  sun.shadow.mapSize.set(lowEnd ? 2048 : 4096, lowEnd ? 2048 : 4096)
  Object.assign(sun.shadow.camera, { left: -R, right: R, top: R, bottom: -R, near: 1, far: 2 * SD })
  sun.shadow.bias = -0.0003; sun.shadow.normalBias = 0.012; sun.shadow.radius = 3
  scene.add(sun, sun.target)

  // plastico: base morbida poco piu' grande della casa (verde prato se ci sono esterni, se no sabbia calda) con il
  // bordo sfumato, e ombra di contatto cotta dalla pianta (stanze e muri). Due piani e due canvas piccoli: si vedono
  // solo nella vista dall'alto, in camminata restano il cielo HDRI e le sue luci.
  const garden = plan.garden ?? plan.rooms.some(r => ['balcone', 'terrazzo'].includes(r.type))
  const PAD = Math.max(1.6, 0.14 * 2 * R), BW = B.x1 - B.x0 + 2 * PAD, BD = B.z1 - B.z0 + 2 * PAD
  const bake = (draw, blur) => {
    const S = lowEnd ? 256 : 512, k = S / Math.max(BW, BD), cv = document.createElement('canvas'); cv.width = Math.ceil(BW * k); cv.height = Math.ceil(BD * k)
    const g = cv.getContext('2d'), toC = p => [(p[0] - B.x0 + PAD) * k, (p[1] - B.z0 + PAD) * k]
    // sfocatura con shadowBlur (ovunque, anche Safari vecchi): la forma si disegna fuori dal canvas, entra solo l'ombra
    g.fillStyle = '#000'; g.fillRect(0, 0, cv.width, cv.height) // la mappa alfa legge il verde: fondo nero opaco, non trasparente
    g.shadowColor = '#fff'; g.shadowBlur = blur * k; g.shadowOffsetX = cv.width * 2; g.fillStyle = '#fff'
    g.translate(-cv.width * 2, 0); g.beginPath(); draw(g, toC, k); g.fill() // draw puo' anche riempire da se'
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.NoColorSpace; return t
  }
  // con giardini o cortili la base segue la forma del lotto (stanze ed esterni allargati), se no un rettangolo morbido
  const lot = plan.rooms.some(isGroundRoom)
  const baseTex = lot
    ? bake((g, toC, k) => { g.lineJoin = 'round'; g.lineWidth = 1.4 * k; g.strokeStyle = '#fff'; for (const P of [...plan.rooms.map(r => r.poly), ...plan.walls.map(w => w.outer)]) { g.beginPath(); P.forEach((p, i) => { const [x, z] = toC(p); i ? g.lineTo(x, z) : g.moveTo(x, z) }); g.closePath(); g.fill(); g.stroke() } }, 0.35 * PAD)
    : bake((g, toC, k) => { const r = 0.32 * Math.min(BW, BD) * k, x0 = 0.35 * PAD * k, z0 = 0.35 * PAD * k, w = (BW - 0.7 * PAD) * k, h = (BD - 0.7 * PAD) * k; if (g.roundRect) g.roundRect(x0, z0, w, h, r); else g.rect(x0, z0, w, h) }, 0.45 * PAD)
  const foot = [...plan.rooms.map(r => r.poly), ...plan.walls.map(w => w.outer)]
  const shadowTex = bake((g, toC) => { for (const P of foot) { g.beginPath(); P.forEach((p, i) => { const [x, z] = toC(p); i ? g.lineTo(x, z) : g.moveTo(x, z) }); g.fill() } }, 0.5)
  const baseGeo = new THREE.PlaneGeometry(BW, BD).rotateX(-Math.PI / 2)
  const BASE_DAY = new THREE.Color(garden ? 0x9fc27f : 0xd8c39c), BASE_NIGHT = new THREE.Color(garden ? 0x0f1a1c : 0x15172a)
  const baseMat = new THREE.MeshStandardMaterial({ color: BASE_DAY.clone(), roughness: 1, metalness: 0, alphaMap: baseTex, transparent: true, depthWrite: false })
  const base = new THREE.Mesh(baseGeo, baseMat); base.position.set(B.x0 - PAD + BW / 2, -0.275, B.z0 - PAD + BD / 2); base.receiveShadow = true; base.renderOrder = -0.5
  const contact = new THREE.Mesh(baseGeo, new THREE.MeshBasicMaterial({ color: 0x000000, alphaMap: shadowTex, transparent: true, depthWrite: false, opacity: 0.35 }))
  contact.position.copy(base.position); contact.position.y += 0.004; contact.renderOrder = -0.4
  scene.add(base, contact)
  // case con giardino o cortile: in camminata un prato tutto attorno fino all'orizzonte (dall'alto resta il plastico),
  // cosi' dagli esterni non si vede il terrazzo romano del cielo HDRI
  let field = null
  if (lot) {
    const fm = M.mat('lawn').clone(); fm.color.set(0x8f9a72); fm.roughness = 1
    field = new THREE.Mesh(worldUV(new THREE.CircleGeometry(45, 64).rotateX(-Math.PI / 2).translate(cx, 0, cz)), fm)
    field.position.set(0, -0.125, 0); field.receiveShadow = true; field.visible = false; scene.add(field)
  }

  const winLights = [] // provate le RectAreaLight alle finestre: artefatti sulle tende e costo alto, tolte

  // arredo e lampade
  o.onProgress(0.4, 'Arredo')
  const catalog = createCatalog(o.assetsBase, M, { lowEnd, style: o.style })
  // arredo: 'plan' = come disegnato sulla planimetria (le stanze senza mobili disegnati si arredano da sole),
  // 'auto' = arredo automatico, 'empty' = vuota (solo le luci). Ogni modo ha il suo gruppo e la sua griglia mobili.
  const hasDrawn = !!plan.furniture?.length
  const furnGrid = house.grid.furn
  furnGrid.fill(0); const fp = planFurniture(plan, house).furnish(); const savedFurn = furnGrid.slice()
  let fpPlan = null, savedPlan = null
  if (hasDrawn) { furnGrid.fill(0); fpPlan = planFurniture(plan, house).furnish({ drawn: plan.furniture }); savedPlan = furnGrid.slice() }
  furnGrid.fill(0); const bare = planFurniture(plan, house).lightsOnly()
  furnGrid.set(savedFurn)
  const furnGroup = new THREE.Group(), planGroup = new THREE.Group(), bareGroup = new THREE.Group(); furnGroup.name = 'arredo'
  scene.add(furnGroup, planGroup, bareGroup)
  await catalog.preload([...fp.items, ...(fpPlan?.items ?? [])].map(i => i.kind))
  const bulbGeo = new THREE.SphereGeometry(0.06, 16, 12)
  // arredo di un gruppo dagli elenchi (rifatto al cambio di stile: stessi posti, modelli e materiali dello stile)
  const place = async (list, group) => {
    const objs = await Promise.all(list.map(it => catalog.make(it.kind, it.opts)))
    list.forEach((it, i) => {
      const obj = objs[i]
      let y = it.y || 0
      if (it.kind === 'pendant') y = H - (obj.userData.size?.[2] ?? 0.95) // appeso al soffitto qualunque sia l'altezza del modello
      obj.position.set(it.x, y, it.z); obj.rotation.y = it.rot; obj.userData.kind = it.kind
      if (['pendant', 'ceilingLight'].includes(it.kind)) { house.hideInTop.push(obj); obj.traverse(m => { m.castShadow = false }) }
      group.add(obj)
      // lampadina dentro il paralume (si accende di notte)
      if (it.kind === 'pendant') { const b = new THREE.Mesh(bulbGeo, M.bulb); b.position.set(it.x, H - 0.716 * (obj.userData.size?.[2] ?? 0.95), it.z); b.userData.bulb = true; group.add(b); house.hideInTop.push(b) }
    })
  }
  const clearGroup = group => {
    const gone = new Set(group.children)
    house.hideInTop = house.hideInTop.filter(m => !gone.has(m))
    for (const c of group.children) if (c.userData.proc) c.traverse(m => { if (m.isMesh) m.geometry.dispose() })
    group.clear()
  }
  await place(fp.items, furnGroup)
  if (fpPlan) await place(fpPlan.items, planGroup)
  for (const it of bare.items) { const obj = await catalog.make(it.kind, it.opts); obj.position.set(it.x, it.y || 0, it.z); house.hideInTop.push(obj); bareGroup.add(obj) }
  // luci: tante "ancore" (lampade di ogni stanza) ma poche luci vere in un pool fisso, assegnate alle ancore piu'
  // vicine (in camminata) o alle principali di ogni stanza (dall'alto). Numero di luci costante: niente ricompilazioni.
  const mkAnchor = l => {
    const main = l.role === 'main', rr = house.rooms.get(l.room), win = house.windows.filter(w => w.room === l.room).reduce((a, w) => a + w.len, 0)
    return { ...l, main, base: main ? (l.dim ? 10 * l.dim : 10) : (l.dim ? 5 * l.dim : 5), fill: rr ? (2.2 + Math.min(win, 4) * 1.0) * Math.sqrt(rr.area / 10) : 2.5, area: rr?.area || 0 }
  }
  const anchorsF = fp.lights.map(mkAnchor), anchorsB = bare.lights.map(mkAnchor), anchorsP = fpPlan ? fpPlan.lights.map(mkAnchor) : anchorsF
  const POOL = lowEnd ? 5 : 9, SHADOWS = lowEnd ? 0 : 2
  const pool = Array.from({ length: POOL }, (_, i) => {
    const p = new THREE.PointLight(0xffc489, 0, 9, 2)
    if (i < SHADOWS) { p.userData.shadow = true; p.shadow.mapSize.set(512, 512); p.shadow.bias = -0.002; p.shadow.normalBias = 0.03; p.shadow.radius = 4; p.shadow.camera.near = 0.1 }
    scene.add(p); return p
  })
  const lightsF = pool
  let poolKey = ''
  function assignPool(force) {
    const list = state.mode === 'plan' ? anchorsP : state.mode === 'auto' ? anchorsF : anchorsB
    const cam = camera.position, cur = house.grid.roomAt(cam.x, cam.z)
    const key = `${state.view}|${state.mode}|${cur}|${Math.round(cam.x)}|${Math.round(cam.z)}`
    if (!force && key === poolKey) return
    poolKey = key
    const score = a => state.view === 'top' ? (a.main ? -a.area : 100 - a.area) : Math.hypot(a.x - cam.x, a.z - cam.z) + (a.room === cur ? 0 : 2.5) + (a.main ? 0 : 0.5)
    const chosen = [...list].sort((p, q) => score(p) - score(q)).slice(0, POOL)
    // le luci con ombra vanno alle principali piu' importanti
    chosen.sort((p, q) => (q.main - p.main) || (score(p) - score(q)))
    pool.forEach((l, i) => { l.userData.anchor = chosen[i] || null; if (chosen[i]) l.position.set(chosen[i].x, chosen[i].y, chosen[i].z) })
    applyLook()
  }
  // post-produzione: occlusione ambientale (GTAO) per togliere l'effetto piatto
  const size = new THREE.Vector2(container.clientWidth, container.clientHeight)
  const rt = new THREE.WebGLRenderTarget(size.x * renderer.getPixelRatio(), size.y * renderer.getPixelRatio(), { type: THREE.HalfFloatType, samples: lowEnd ? 0 : 4 })
  const composer = new EffectComposer(renderer, rt)
  composer.addPass(new RenderPass(scene, camera))
  let gtao = null
  if (!lowEnd) {
    gtao = new GTAOPass(scene, camera, size.x, size.y)
    gtao.updateGtaoMaterial({ radius: 0.45, distanceExponent: 1.5, thickness: 1.5, scale: 1.0, samples: 16 })
    gtao.updatePdMaterial({ lumaPhi: 10, depthPhi: 2, normalPhi: 3, radius: 6, rings: 2, samples: 16 })
    gtao.blendIntensity = 0.85
    // la base del plastico e' trasparente: fuori dal passaggio normali/profondita' dell'occlusione (se no bordi a gradini)
    const ov = gtao._overrideVisibility.bind(gtao)
    gtao._overrideVisibility = () => { ov(); for (const m of [base, contact]) if (m.visible) { m.visible = false; gtao._visibilityCache.push(m) } }
    composer.addPass(gtao)
  }
  composer.addPass(new OutputPass())

  // controlli: orbita (vista dall'alto) e camminata
  const orbit = new OrbitControls(camera, renderer.domElement)
  orbit.target.set(cx, 0.6, cz); orbit.enableDamping = true; orbit.dampingFactor = 0.08
  orbit.minDistance = 5; orbit.maxDistance = Math.max(60, R * 10); orbit.maxPolarAngle = 1.2; orbit.minPolarAngle = 0.05
  orbit.screenSpacePanning = false
  const walk = new WalkControls(camera, renderer.domElement, house.grid, { eye: 1.6, lowEnd })
  // scale: fin dove si sale o si scende. Se c'e' il piano collegato si cambia piano a meta' rampa (onStair), se no ci si
  // ferma sotto il soffitto (sale) o a un metro sotto il pavimento (scende); le scale esterne si salgono tutte
  const stairAt = (x, z) => house.stairs.find(L => x >= L.hole[0] - 0.05 && x <= L.hole[2] + 0.05 && z >= L.hole[1] - 0.05 && z <= L.hole[3] + 0.05)
  walk.canStand = (x, z, h) => {
    const L = stairAt(x, z); if (!L || L.open) return true
    if (L.dir === 'up') return h <= (L.linked && o.onStair ? H : H - 1.6 - 0.12)
    return h >= (L.linked && o.onStair ? -L.depth : -1.0)
  }
  let stairFired = false
  // posa libera vicino a un estremo della scala (davanti possono esserci mobili): il punto libero piu' vicino
  function stairPose(L, which) {
    const p = which === 'high' ? L.poseHigh : L.poseLow
    for (let r = 0; r <= 0.9; r += 0.1) for (let a = 0; a < 6.28; a += r ? 0.5 / r * 0.2 + 0.25 : 7) {
      const x = p.x + Math.cos(a) * r, z = p.z + Math.sin(a) * r
      if (walk.clearAround(x, z) && Math.abs(house.grid.heightAt(x, z) - house.grid.heightAt(p.x, p.z)) < 0.05 && !stairAt(x, z)) return { x, z, yaw: p.yaw }
    }
    return null
  }

  // etichette delle stanze nella vista dall'alto
  const labelLayer = document.createElement('div')
  labelLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden'
  container.appendChild(labelLayer)
  const labels = plan.rooms.map(r => {
    const el = document.createElement('div')
    el.className = 'v3d-label'; el.innerHTML = `<b>${esc(r.stair?.outdoor ? 'Scala esterna' : ROOM_LABEL[r.type] || r.type)}</b><span>${esc(String(r.area).replace('.', ','))} m²</span>`
    el.style.cssText = 'position:absolute;transform:translate(-50%,-50%);pointer-events:auto;cursor:pointer'
    el.onclick = () => api.enterRoom(r.id)
    labelLayer.appendChild(el)
    // ripostigli, corridoi e stanze sotto 4 m2: etichetta solo al passaggio o al tocco sulla stanza
    const small = ['ripostiglio', 'corridoio'].includes(r.type) || r.area < 4
    const [x0, z0, x1, z1] = r.rect || [r.center[0] - 1, r.center[1] - 1, r.center[0] + 1, r.center[1] + 1]
    const fl = r.stair?.outdoor && r.stair.flight, lc = fl ? [(fl[0] + fl[2]) / 2, (fl[1] + fl[3]) / 2] : r.center // scala esterna: sulla rampa disegnata
    return { el, id: r.id, small, area: r.area, p: new THREE.Vector3(lc[0], 0.2, lc[1]), c0: new THREE.Vector3(x0, 0.2, z0), c1: new THREE.Vector3(x1, 0.2, z1) }
  })
  let hoverRoom = 0
  renderer.domElement.addEventListener('pointermove', e => {
    if (state.view !== 'top') return
    const r = renderer.domElement.getBoundingClientRect()
    ndcH.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    rayH.setFromCamera(ndcH, camera)
    hoverRoom = rayH.intersectObjects(house.floors, false)[0]?.object.userData.roomId ?? 0
  })
  const rayH = new THREE.Raycaster(), ndcH = new THREE.Vector2(), tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3()
  // etichette senza sovrapposizioni: le stanze piu' grandi prima; se una tocca una gia' messa si prova sopra o sotto, se no
  // si nasconde. Stanza piccola sullo schermo (< 110 px): solo il nome, senza mq.
  const byImportance = [...labels].sort((a, b) => b.area - a.area)
  function layoutLabels() {
    const W = container.clientWidth, H = container.clientHeight, placed = []
    for (const l of byImportance) {
      tmpV.copy(l.p).project(camera)
      let x = (tmpV.x * 0.5 + 0.5) * W, y = (-tmpV.y * 0.5 + 0.5) * H
      tmpA.copy(l.c0).project(camera); tmpB.copy(l.c1).project(camera)
      const size = Math.min(Math.abs(tmpA.x - tmpB.x) * W / 2, Math.abs(tmpA.y - tmpB.y) * H / 2)
      const compact = size < 110
      if (l.compact !== compact) { l.compact = compact; l.el.querySelector('span').style.display = compact ? 'none' : '' }
      const show = !state.anim && (!l.small || hoverRoom === l.id)
      let ok = show
      if (show) {
        const w = l.el.offsetWidth || 80, h = l.el.offsetHeight || 34
        const hits = (yy) => placed.some(q => Math.abs(q.x - x) < (q.w + w) / 2 + 4 && Math.abs(q.y - yy) < (q.h + h) / 2 + 2)
        if (hits(y)) { const up = y - h - 4, dn = y + h + 4; if (!hits(up)) y = up; else if (!hits(dn)) y = dn; else ok = hoverRoom === l.id }
        if (ok) placed.push({ x, y, w, h })
      }
      l.el.style.left = `${x}px`; l.el.style.top = `${y}px`
      l.el.style.opacity = ok ? 1 : 0; l.el.style.pointerEvents = ok ? 'auto' : 'none'
    }
  }

  // stato e transizioni
  const state = { view: null, night: o.time === 'night' ? 1 : 0, nightTarget: o.time === 'night' ? 1 : 0, furnished: o.furnished, anim: null, studio: 1, style: o.style }
  DAYFILL.set(ST.light.day); WARM.set(ST.light.warm)
  function applyLook() {
    const n = state.night, top = state.view === 'top' ? 1 : 0
    const tStudio = state.studio
    scene.environment = n < 0.5 ? envDay : envNight
    scene.environmentIntensity = top ? lerp(0.75, 0.12, n) : lerp(0.32, 0.03, n)
    sun.intensity = lerp(top ? 3.2 : 4.2, 0, Math.min(1, n * 1.6))
    winLights.forEach(l => { l.intensity = lerp(top ? 0 : 3.2, 0, n) })
    const on = Math.max(0, (n - 0.25) / 0.75)
    const wantShadow = n > 0.3
    if (wantShadow !== state.pointShadows) { state.pointShadows = wantShadow; for (const l of pool) if (l.userData.shadow) l.castShadow = wantShadow }
    // di giorno le luci principali diventano un riempimento morbido a meta' stanza (finto rimbalzo della luce)
    for (const l of pool) {
      const a = l.userData.anchor
      if (!a) { l.intensity = 0; continue }
      const day = a.main && !top ? a.fill : 0
      l.intensity = lerp(day, a.base * ST.light.k, on)
      l.color.lerpColors(DAYFILL, WARM, on)
      l.distance = a.main ? 9 : 5
      if (a.main) l.position.y = lerp(1.35, a.y, on)
    }
    M.shade.emissiveIntensity = on * 1.2; M.bulb.emissiveIntensity = on * 4; M.glass.opacity = lerp(0.1, 0.35, n)
    skyU.mixN.value = n; skyU.studio.value = tStudio; skyU.bright.value = lerp(1.0, 0.3, n)
    baseMat.color.lerpColors(BASE_DAY, BASE_NIGHT, n); baseMat.emissive.copy(BASE_NIGHT).multiplyScalar(n); baseMat.opacity = tStudio; contact.material.opacity = tStudio * lerp(0.35, 0.55, n)
    base.visible = contact.visible = tStudio > 0.01
    if (field) field.visible = tStudio < 0.99
    renderer.toneMappingExposure = lerp(top ? 1.0 : 1.2, top ? 1.0 : 0.82, n)
    if (gtao) gtao.blendIntensity = lerp(0.85, 0.7, n)
  }
  // v: 'plan' | 'auto' | 'empty' (true/false come prima: arredata col modo migliore / vuota)
  function setFurnished(v) {
    const mode = v === true ? (hasDrawn ? 'plan' : 'auto') : v === false ? 'empty' : (v === 'plan' && !hasDrawn ? 'auto' : v)
    state.mode = mode; state.furnished = mode !== 'empty'
    furnGroup.visible = mode === 'auto'; planGroup.visible = mode === 'plan'; bareGroup.visible = mode === 'empty'
    house.grid.furn.set(mode === 'plan' ? savedPlan : mode === 'auto' ? savedFurn : new Uint8Array(savedFurn.length)); assignPool(true)
  }

  // STILE: materiali degli slot, pavimenti consigliati, muri di base, luci, mobili rifatti negli stessi posti. Dal vivo,
  // la casa non si ricostruisce; i modelli delle varianti si scaricano al primo uso
  let styleBusy = null
  async function setStyle(id) {
    if (!validStyle(id) || (id === state.style && !styleBusy)) return
    const run = (async () => {
      const prevMode = state.mode
      state.style = id // subito, per i pulsanti; materiali e mobili quando le varianti sono scaricate
      if (id === 'vuota') { setFurnished(false); o.onStyle?.(id); return }
      const next = styleOf(id)
      catalog.setStyle(id)
      await catalog.preload([...fp.items, ...(fpPlan?.items ?? [])].map(i => i.kind)) // varianti scaricate prima dello scambio
      if (state.style !== id) return // nel frattempo e' stato scelto un altro stile
      ST = next
      M.applyStyle(ST)
      for (const f of house.floors) { const r = f.userData.room; if (r && !r.floor && !isGroundRoom(r)) f.material = M.mat(floorKey(r, ST)) }
      house.subMesh.material = M.mat(floorKey({ type: 'soggiorno' }, ST))
      house.setWallBase(ST.wall)
      DAYFILL.set(ST.light.day); WARM.set(ST.light.warm)
      clearGroup(furnGroup); clearGroup(planGroup)
      await place(fp.items, furnGroup)
      if (fpPlan) await place(fpPlan.items, planGroup)
      if (prevMode === 'empty' || state.mode === 'empty') setFurnished(true); else setFurnished(prevMode)
      applyLook(); poolKey = ''
      o.onStyle?.(id)
    })()
    styleBusy = run
    try { await run } finally { if (styleBusy === run) styleBusy = null }
  }

  const tmpQ = new THREE.Quaternion()
  function animateCamera(toPos, toQuat, dur, onDone) {
    const fromPos = camera.position.clone(), fromQuat = camera.quaternion.clone(), t0 = performance.now()
    state.anim = now => {
      const t = Math.min(1, (now - t0) / dur), e = ease(t)
      camera.position.lerpVectors(fromPos, toPos, e)
      tmpQ.slerpQuaternions(fromQuat, toQuat, e); camera.quaternion.copy(tmpQ)
      house.hideInTop.forEach(m => { m.visible = camera.position.y < H + 0.4 })
      if (t >= 1) { state.anim = null; onDone?.() }
    }
  }
  const topPose = () => {
    // distanza minima perche' tutti gli angoli della casa (pavimento e cima dei muri) stiano nell'inquadratura con un
    // margine, col campo visivo vero del rapporto d'aspetto (telefono in verticale compreso): ricerca per bisezione
    const asp = Math.max(0.2, container.clientWidth / Math.max(1, container.clientHeight))
    const cam = new THREE.PerspectiveCamera(asp < 1 ? 72 : 50, asp, 0.05, 500)
    const dir = new THREE.Vector3(0.15, 0.82, 0.56).normalize(), target = new THREE.Vector3(cx, 0.4, cz)
    const pts = []
    for (const x of [B.x0, B.x1]) for (const z of [B.z0, B.z1]) for (const y of [0, H]) pts.push(new THREE.Vector3(x, y, z))
    const fits = d => {
      cam.position.set(cx + dir.x * d, dir.y * d, cz + dir.z * d); cam.lookAt(target); cam.updateMatrixWorld(); cam.updateProjectionMatrix()
      return pts.every(p => { const q = p.clone().project(cam); return Math.abs(q.x) <= 0.9 && Math.abs(q.y) <= 0.82 && q.z < 1 })
    }
    let lo = 4, hi = 400
    for (let k = 0; k < 30; k++) { const mid = (lo + hi) / 2; if (fits(mid)) hi = mid; else lo = mid }
    const pos = new THREE.Vector3(cx + dir.x * hi, dir.y * hi, cz + dir.z * hi)
    const m = new THREE.Matrix4().lookAt(pos, target, new THREE.Vector3(0, 1, 0))
    return { pos, quat: new THREE.Quaternion().setFromRotationMatrix(m) }
  }
  function roomPose(id) {
    const r = house.rooms.get(id); if (!r) return null
    const [x0, z0, x1, z1] = r.rect, rcx = (x0 + x1) / 2, rcz = (z0 + z1) / 2
    // ci si mette vicino alla porta della stanza, guardando verso il centro e oltre
    const door = house.doors.find(d => d.rooms.includes(id) && !d.entrance)
    let px = rcx, pz = rcz
    if (door) {
      const dx = door.center[0] - rcx, dz = door.center[1] - rcz, L = Math.hypot(dx, dz) || 1
      for (const k of [0.75, 0.6, 0.45, 0.3, 0]) {
        const qx = rcx + dx / L * Math.min(L - 0.5, L * k), qz = rcz + dz / L * Math.min(L - 0.5, L * k)
        if (house.grid.free(qx, qz) && walk.clearAround(qx, qz)) { px = qx; pz = qz; break }
      }
    }
    if (!(house.grid.free(px, pz) && walk.clearAround(px, pz))) {
      outer: for (let rr = 0.2; rr < 2; rr += 0.2) for (let a = 0; a < 6.28; a += 0.5) { const qx = rcx + Math.cos(a) * rr, qz = rcz + Math.sin(a) * rr; if (house.grid.free(qx, qz) && walk.clearAround(qx, qz)) { px = qx; pz = qz; break outer } }
    }
    const yaw = Math.atan2(rcx - px, -(rcz - pz))
    return { x: px, z: pz, yaw: (Math.abs(rcx - px) + Math.abs(rcz - pz) < 0.2) ? 0 : yaw }
  }
  function setView(v, roomId) {
    if (v === 'walk') {
      const id = roomId ?? (plan.rooms.find(r => r.type === 'soggiorno') || plan.rooms[0]).id
      const p = roomPose(id)
      orbit.enabled = false
      const target = walk.poseFor(p.x, p.z, p.yaw, -0.06)
      const startedTop = state.view !== 'walk'
      state.view = 'walk'; applyLook()
      animateCamera(target.pos, target.quat, startedTop ? 1600 : 900, () => { walk.setPose(p.x, p.z, p.yaw, -0.06); walk.enabled = true })
      walk.enabled = false
      fadeStudio(0)
    } else {
      walk.enabled = false
      const tp = topPose()
      state.view = 'top'; applyLook()
      animateCamera(tp.pos, tp.quat, 1500, () => { orbit.target.set(cx, 0.4, cz); orbit.enabled = true; orbit.update() })
      fadeStudio(1)
    }
    labelLayer.style.display = v === 'top' && o.labels ? 'block' : 'none'
  }
  function fadeStudio(to) { const from = state.studio, t0 = performance.now(); state.studioAnim = now => { const t = Math.min(1, (now - t0) / 1200); state.studio = lerp(from, to, ease(t)); if (t >= 1) state.studioAnim = null } }
  function setTime(t) { state.nightTarget = t === 'night' ? 1 : 0 }

  // clic su una stanza nella vista dall'alto: si entra camminando
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2()
  let down = null
  renderer.domElement.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY] })
  renderer.domElement.addEventListener('pointerup', e => {
    if (!down || Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6 || state.view !== 'top' || state.anim) return
    const r = renderer.domElement.getBoundingClientRect()
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1)
    ray.setFromCamera(ndc, camera)
    const hit = ray.intersectObjects(house.floors, false)[0]
    if (hit) api.enterRoom(hit.object.userData.roomId)
  })

  function resize() {
    const w = container.clientWidth, h = container.clientHeight
    camera.aspect = w / h; camera.fov = w < h ? 72 : (state.view === 'walk' ? 68 : 50); camera.updateProjectionMatrix()
    renderer.setSize(w, h); composer.setSize(w, h)
    skyU.vpH.value = h * renderer.getPixelRatio(); skyU.pr.value = renderer.getPixelRatio()
  }
  const ro = new ResizeObserver(resize); ro.observe(container)

  // FPS
  const fps = { frames: 0, t0: performance.now(), value: 0 }
  let last = performance.now(), raf = 0
  const tmpV = new THREE.Vector3()
  function frame(now) {
    raf = requestAnimationFrame(frame)
    const dt = Math.min(0.05, (now - last) / 1000); last = now
    if (Math.abs(state.night - state.nightTarget) > 1e-3) { state.night += Math.sign(state.nightTarget - state.night) * Math.min(Math.abs(state.nightTarget - state.night), dt / 1.6); applyLook() }
    if (state.studioAnim) { state.studioAnim(now); applyLook() }
    if (state.anim) state.anim(now)
    else if (state.view === 'top') orbit.update()
    else {
      walk.update(dt)
      // cambio di piano camminando sulla scala (una volta sola: il visore del piano nuovo prende il posto di questo)
      if (walk.enabled && o.onStair && !stairFired) {
        const L = stairAt(walk.pos.x, walk.pos.y), h = house.grid.heightAt(walk.pos.x, walk.pos.y)
        if (L?.linked && ((L.dir === 'up' && h >= 1.1) || (L.dir === 'down' && h <= -1.1))) { stairFired = true; o.onStair(L.dir) }
      }
    }
    if ((fps.frames & 7) === 0) assignPool()
    const fovT = (container.clientWidth < container.clientHeight) ? 72 : (state.view === 'walk' ? 68 : 50)
    if (Math.abs(camera.fov - fovT) > 0.05) { camera.fov += (fovT - camera.fov) * Math.min(1, dt * 3); camera.updateProjectionMatrix() }
    sky.position.copy(camera.position)
    if (state.view === 'top' && !state.anim) house.hideInTop.forEach(m => { m.visible = false })
    composer.render()
    if (labelLayer.style.display !== 'none') layoutLabels()
    fps.frames++
    if (now - fps.t0 > 1000) {
      fps.value = fps.frames * 1000 / (now - fps.t0); fps.frames = 0; fps.t0 = now; o.onFps?.(fps.value)
      // qualita' adattiva: se si scende sotto 40 fps si abbassa la risoluzione (mai sotto 1x)
      if (fps.value < 40 && !state.anim && renderer.getPixelRatio() > 1) {
        renderer.setPixelRatio(Math.max(1, renderer.getPixelRatio() - 0.25)); composer.setPixelRatio(renderer.getPixelRatio()); resize()
      }
    }
  }

  // posa iniziale
  const tp = topPose()
  camera.position.copy(tp.pos); camera.quaternion.copy(tp.quat)
  state.view = 'top'; house.hideInTop.forEach(m => { m.visible = false })
  setFurnished(o.furnished); applyLook()
  await M.ready()
  o.onProgress(1, 'Pronto')
  resize()
  raf = requestAnimationFrame(frame)
  labelLayer.style.display = o.labels ? 'block' : 'none'
  // arrivo da un altro piano per le scale: subito in camminata in cima (da sotto) o al piede (da sopra) della scala
  const arrive = o.start?.from && house.stairs.find(L => !L.open && (o.start.from === 'below' ? L.dir === 'down' : L.dir === 'up'))
  if (arrive) {
    const ok = stairPose(arrive, o.start.from === 'below' ? 'high' : 'low') || roomPose(arrive.room)
    orbit.enabled = false; state.view = 'walk'; state.studio = 0
    walk.setPose(ok.x, ok.z, ok.yaw, -0.05); walk.enabled = true; walk.update(0)
    labelLayer.style.display = 'none'; house.hideInTop.forEach(m => { m.visible = true }); applyLook()
  } else if (o.view === 'walk') setView('walk', o.room)

  const api = {
    setView, setTime, setFurnished, setStyle,
    enterRoom: id => setView('walk', id),
    get state() { return { view: state.view, night: state.nightTarget === 1, furnished: state.furnished, mode: state.mode, hasDrawn, style: state.style, fps: Math.round(fps.value) } },
    stairPose, plan, renderer, scene, camera, house, walk, debug: { gtao, winLights, sun, composer, M, lightsF, pool, applyLook, skyU, catalog, orbit, base, contact },
    stats: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, textures: renderer.info.memory.textures, geometries: renderer.info.memory.geometries }),
    // fotogramma della vista attuale (poster): si rende e si legge subito, senza tenere il buffer
    snapshot(type = 'image/jpeg', q = 0.86) { composer.render(); return renderer.domElement.toDataURL(type, q) },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); walk.dispose(); orbit.dispose(); composer.dispose?.(); renderer.dispose(); renderer.forceContextLoss(); container.innerHTML = '' },
  }
  return api
}
