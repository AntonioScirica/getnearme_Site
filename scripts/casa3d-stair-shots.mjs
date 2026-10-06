// Foto delle SCALE di una casa 3D (visore in locale, Chrome senza finestra): per ogni scala una vista dall'alto
// (ortografica, attorno al buco/riquadro della scala) e una vista 3/4. Per confrontarle col ritaglio dell'originale.
//   node scripts/casa3d-stair-shots.mjs <plan.json> <cartella> <prefisso>
// Serve il sito in locale (npm run dev, porta 3001): la pianta si copia in public/zz-c3/ (cartella di prova, non versionata).
import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer-core'

const [, , planFile, outDir, prefix = 'casa'] = process.argv
const PORT = process.env.PORT || 3001
fs.mkdirSync('public/zz-c3', { recursive: true }); fs.mkdirSync(outDir, { recursive: true })
const name = `${prefix}-${Date.now().toString(36)}.json`
fs.copyFileSync(planFile, `public/zz-c3/${name}`)
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--use-angle=metal', '--enable-webgl', '--ignore-gpu-blocklist'] })
const pg = await b.newPage()
pg.on('console', m => { if (m.type() === 'error') console.log('console', m.text()) })
pg.on('pageerror', e => console.log('pageerror', e.message))
await pg.setViewport({ width: 1000, height: 800, deviceScaleFactor: 1 })
await pg.goto(`http://localhost:${PORT}/casa3d/v1/index.html?plan=/zz-c3/${name}&ui=0`, { waitUntil: 'networkidle2', timeout: 120000 })
await pg.waitForFunction(() => window.viewer && window.viewer.house, { timeout: 120000 })
await new Promise(r => setTimeout(r, 6000))
const stairs = await pg.evaluate(() => window.viewer.house.stairs.map(L => ({ room: L.room, hole: L.hole, dir: L.dir, open: !!L.open, top: L.top, bottom: L.bottom, parts: L.parts.map(p => p.kind), steps: L.parts.reduce((t, p) => t + (p.kind === 'flight' ? p.n : p.kind === 'wedge' ? 1 : 0), 0), r: L.r ?? L.parts.find(p => p.r)?.r })))
const save = (file, url) => fs.writeFileSync(path.join(outDir, file), Buffer.from(url.split(',')[1], 'base64'))
const info = []
for (const [i, S] of stairs.entries()) {
  const [x0, z0, x1, z1] = S.hole, cx = (x0 + x1) / 2, cz = (z0 + z1) / 2, size = Math.max(x1 - x0, z1 - z0, 1.2)
  // dall'alto: ortografica, 1,2 m attorno, 120 px per metro
  const top = await pg.evaluate(async (cx, cz, half) => {
    const THREE = await import('three')
    const v = window.viewer
    const cam = new THREE.OrthographicCamera(-half, half, half, -half, 0.1, 200)
    cam.position.set(cx, 60, cz); cam.up.set(0, 0, -1); cam.lookAt(cx, 0, cz)
    v.house.hideInTop.forEach(m => { m.visible = false })
    const old = new THREE.Vector2(); v.renderer.getSize(old)
    const px = Math.round(half * 2 * 120)
    v.renderer.setSize(px, px, false); v.renderer.render(v.scene, cam)
    const url = v.renderer.domElement.toDataURL('image/png')
    v.renderer.setSize(old.x, old.y, false)
    v.house.hideInTop.forEach(m => { m.visible = true })
    return url
  }, cx, cz, size / 2 + 1.2)
  save(`${prefix}-${i + 1}-alto.png`, top)
  // 3/4: dal lato opposto al centro della casa (fuori) per le esterne, ripida per le interne
  const num = v => (v === undefined || v === '' ? NaN : Number(v)), az = num((process.env.AZ ?? '').split(',')[i]), el = num((process.env.EL ?? '').split(',')[i])
  await pg.evaluate((cx, cz, size, open, azF, bottom, elF) => {
    const v = window.viewer, B = v.house.bounds, hx = (B.x0 + B.x1) / 2, hz = (B.z0 + B.z1) / 2
    const a = Number.isFinite(azF) ? azF * Math.PI / 180 : Math.atan2(cz - hz, cx - hx) + (open ? 0 : Math.PI) + 0.5
    const e = (Number.isFinite(elF) ? elF : open ? 32 : 58) * Math.PI / 180, D = open ? size * 1.6 + 2.6 : size * 1.15 + 2
    v.camera.position.set(cx + Math.cos(a) * Math.cos(e) * D, Math.sin(e) * D + Math.max(0, bottom), cz + Math.sin(a) * Math.cos(e) * D)
    v.debug.orbit.target.set(cx, Math.max(0.3, bottom), cz); v.debug.orbit.update()
  }, cx, cz, size, S.open, az, S.bottom, el)
  // scale interne: muri tagliati a CLIP metri (sezione come un plastico), se no i muri coprono i gradini
  const clip = S.open ? null : Number(process.env.CLIP || 1.5)
  await pg.evaluate(async clip => { const THREE = await import('three'); window.viewer.renderer.clippingPlanes = clip ? [new THREE.Plane(new THREE.Vector3(0, -1, 0), clip)] : [] }, clip)
  await new Promise(r => setTimeout(r, 2500))
  save(`${prefix}-${i + 1}-34.jpg`, await pg.evaluate(() => window.viewer.snapshot('image/jpeg', 0.92)))
  await pg.evaluate(() => { window.viewer.renderer.clippingPlanes = [] })
  info.push({ ...S, half: size / 2 + 1.2, cx, cz, clip })
}
fs.writeFileSync(path.join(outDir, `${prefix}-stairs.json`), JSON.stringify(info, null, 1))
await b.close()
fs.rmSync(`public/zz-c3/${name}`)
console.log(JSON.stringify(info))
