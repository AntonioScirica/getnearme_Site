// Visore 3D della casa: modulo indipendente, embeddabile. Riceve plan.json + opzioni, carica gli asset da assetsBase.
//   const v = await createViewer(el, { plan, assetsBase, view: 'top'|'walk', time: 'day'|'night', furnished: true })
//   v.setView('walk'), v.setTime('night'), v.setFurnished(false), v.enterRoom(id), v.dispose()
import * as THREE from 'three'
import { OrbitControls } from 'three/addons/controls/OrbitControls.js'
import { HDRLoader } from 'three/addons/loaders/HDRLoader.js'
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js'
import { GTAOPass } from 'three/addons/postprocessing/GTAOPass.js'
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js'
import { createMaterials } from './materials.js'
import { buildHouse } from './house.js'
import { createCatalog } from './furniture.js'
import { planFurniture } from './furnish.js'
import { WalkControls } from './walk.js'

export const ROOM_LABEL = { soggiorno: 'Soggiorno', cucina: 'Cucina', camera: 'Camera', cameretta: 'Cameretta', studio: 'Studio', bagno: 'Bagno', ingresso: 'Ingresso', corridoio: 'Corridoio', ripostiglio: 'Ripostiglio', balcone: 'Balcone', terrazzo: 'Terrazzo', scala: 'Scala', lavanderia: 'Lavanderia', stanza: 'Stanza' }
const esc = s => String(s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c])
const DAYFILL = new THREE.Color(0xfff6ec), WARM = new THREE.Color(0xffd3a3)
const ease = t => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
const lerp = (a, b, t) => a + (b - a) * t

export async function createViewer(container, opts = {}) {
  const o = { view: 'top', time: 'day', furnished: true, quality: 'auto', labels: true, onProgress: () => {}, ...opts }
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
  const house = buildHouse(plan, M)
  scene.add(house.group)

  // cielo: sfera con le due foto HDRI (giorno/notte) mescolate, piu' il fondo neutro della vista dall'alto
  const texL = new THREE.TextureLoader()
  const bgDay = texL.load(`${o.assetsBase}/hdri/castel_st_angelo_roof_bg.webp`), bgNight = texL.load(`${o.assetsBase}/hdri/rooftop_night_bg.webp`)
  for (const t of [bgDay, bgNight]) t.colorSpace = THREE.SRGBColorSpace
  const skyU = { day: { value: bgDay }, night: { value: bgNight }, mixN: { value: 0 }, studio: { value: 0 }, bright: { value: 1 }, rotY: { value: 0.9 } }
  const sky = new THREE.Mesh(new THREE.SphereGeometry(70, 48, 24), new THREE.ShaderMaterial({
    uniforms: skyU, side: THREE.BackSide, depthWrite: false, toneMapped: false,
    vertexShader: 'varying vec3 vDir; void main(){ vDir = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform sampler2D day; uniform sampler2D night; uniform float mixN; uniform float studio; uniform float bright; uniform float rotY; varying vec3 vDir;
      void main(){ vec3 d = normalize(vDir); float u = fract(atan(d.z, d.x) / 6.2831853 + 0.5 + rotY); float v = asin(clamp(d.y,-1.,1.)) / 3.1415926 + 0.5;
        vec3 c = mix(texture2D(day, vec2(u, v)).rgb, texture2D(night, vec2(u, v)).rgb * 0.75, mixN) * bright;
        vec3 s = mix(vec3(0.93,0.92,0.90), vec3(0.80,0.79,0.77), clamp(0.5 - d.y, 0., 1.));
        s = mix(s, vec3(0.10,0.11,0.14), mixN);
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

  const winLights = [] // provate le RectAreaLight alle finestre: artefatti sulle tende e costo alto, tolte

  // arredo e lampade
  o.onProgress(0.4, 'Arredo')
  const catalog = createCatalog(o.assetsBase, M, { lowEnd })
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
  const place = async (list, group) => {
    for (const it of list) {
      const obj = await catalog.make(it.kind, it.opts)
      obj.position.set(it.x, it.y || 0, it.z); obj.rotation.y = it.rot; obj.userData.kind = it.kind
      if (['pendant', 'ceilingLight'].includes(it.kind)) { house.hideInTop.push(obj); obj.traverse(m => { m.castShadow = false }) }
      group.add(obj)
    }
    // lampadine dentro i paralumi dei pendenti (si accendono di notte)
    for (const it of list.filter(i => i.kind === 'pendant')) {
      const b = new THREE.Mesh(new THREE.SphereGeometry(0.06, 16, 12), M.bulb); b.position.set(it.x, H - 0.95 + 0.27, it.z); group.add(b); house.hideInTop.push(b)
    }
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
    composer.addPass(gtao)
  }
  composer.addPass(new OutputPass())

  // controlli: orbita (vista dall'alto) e camminata
  const orbit = new OrbitControls(camera, renderer.domElement)
  orbit.target.set(cx, 0.6, cz); orbit.enableDamping = true; orbit.dampingFactor = 0.08
  orbit.minDistance = 5; orbit.maxDistance = Math.max(60, R * 10); orbit.maxPolarAngle = 1.2; orbit.minPolarAngle = 0.05
  orbit.screenSpacePanning = false
  const walk = new WalkControls(camera, renderer.domElement, house.grid, { eye: 1.6, lowEnd })

  // etichette delle stanze nella vista dall'alto
  const labelLayer = document.createElement('div')
  labelLayer.style.cssText = 'position:absolute;inset:0;pointer-events:none;overflow:hidden'
  container.appendChild(labelLayer)
  const labels = plan.rooms.map(r => {
    const el = document.createElement('div')
    el.className = 'v3d-label'; el.innerHTML = `<b>${esc(ROOM_LABEL[r.type] || r.type)}</b><span>${esc(String(r.area).replace('.', ','))} m²</span>`
    el.style.cssText = 'position:absolute;transform:translate(-50%,-50%);pointer-events:auto;cursor:pointer'
    el.onclick = () => api.enterRoom(r.id)
    labelLayer.appendChild(el)
    // ripostigli, corridoi e stanze sotto 4 m2: etichetta solo al passaggio o al tocco sulla stanza
    const small = ['ripostiglio', 'corridoio'].includes(r.type) || r.area < 4
    const [x0, z0, x1, z1] = r.rect || [r.center[0] - 1, r.center[1] - 1, r.center[0] + 1, r.center[1] + 1]
    return { el, id: r.id, small, area: r.area, p: new THREE.Vector3(r.center[0], 0.2, r.center[1]), c0: new THREE.Vector3(x0, 0.2, z0), c1: new THREE.Vector3(x1, 0.2, z1) }
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
  const state = { view: null, night: o.time === 'night' ? 1 : 0, nightTarget: o.time === 'night' ? 1 : 0, furnished: o.furnished, anim: null, studio: 1 }
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
      l.intensity = lerp(day, a.base, on)
      l.color.lerpColors(DAYFILL, WARM, on)
      l.distance = a.main ? 9 : 5
      if (a.main) l.position.y = lerp(1.35, a.y, on)
    }
    M.shade.emissiveIntensity = on * 1.2; M.bulb.emissiveIntensity = on * 4; M.glass.opacity = lerp(0.1, 0.35, n)
    skyU.mixN.value = n; skyU.studio.value = tStudio; skyU.bright.value = lerp(1.0, 0.3, n)
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
    else walk.update(dt)
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
  if (o.view === 'walk') setView('walk', o.room)

  const api = {
    setView, setTime, setFurnished,
    enterRoom: id => setView('walk', id),
    get state() { return { view: state.view, night: state.nightTarget === 1, furnished: state.furnished, mode: state.mode, hasDrawn, fps: Math.round(fps.value) } },
    renderer, scene, camera, house, walk, debug: { gtao, winLights, sun, composer, M, lightsF, pool, applyLook, skyU, catalog, orbit },
    stats: () => ({ calls: renderer.info.render.calls, triangles: renderer.info.render.triangles, textures: renderer.info.memory.textures, geometries: renderer.info.memory.geometries }),
    // fotogramma della vista attuale (poster): si rende e si legge subito, senza tenere il buffer
    snapshot(type = 'image/jpeg', q = 0.86) { composer.render(); return renderer.domElement.toDataURL(type, q) },
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); walk.dispose(); orbit.dispose(); composer.dispose?.(); renderer.dispose(); renderer.forceContextLoss(); container.innerHTML = '' },
  }
  return api
}
