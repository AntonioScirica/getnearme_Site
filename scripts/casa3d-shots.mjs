// Foto del visore Casa 3D da una pianta (plan.json) con Chrome senza finestra: vista dall'alto, 3 angolazioni e una
// vista ORTOGRAFICA dall'alto in metri (per sovrapporla all'originale con toImage, vedi scripts/casa3d-fidelity.py).
//   node scripts/casa3d-shots.mjs <plan.json> <cartella> <prefisso>
// Serve il sito in locale (npm run dev, porta 3001): la pianta si copia in public/zz-c3/ (cartella di prova, non versionata).
import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer-core'

const [, , planFile, outDir, prefix = 'casa'] = process.argv
const PORT = process.env.PORT || 3001, PX = 60 // pixel per metro della vista ortografica
fs.mkdirSync('public/zz-c3', { recursive: true }); fs.mkdirSync(outDir, { recursive: true })
const name = `${prefix}-${Date.now().toString(36)}.json`
fs.copyFileSync(planFile, `public/zz-c3/${name}`)
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--use-angle=metal', '--enable-webgl', '--ignore-gpu-blocklist'] })
const pg = await b.newPage()
pg.on('console', m => { if (m.type() === 'error') console.log('console', m.text()) })
await pg.setViewport({ width: 1400, height: 900, deviceScaleFactor: 1 })
await pg.goto(`http://localhost:${PORT}${process.env.VIEWER || '/casa3d/v1/index.html'}?plan=/zz-c3/${name}&ui=0`, { waitUntil: 'networkidle2', timeout: 120000 })
await pg.waitForFunction(() => window.viewer && window.viewer.house, { timeout: 120000 })
await new Promise(r => setTimeout(r, 7000))
const save = async (file, dataUrl) => fs.writeFileSync(path.join(outDir, file), Buffer.from(dataUrl.split(',')[1], 'base64'))
await save(`${prefix}-alto.jpg`, await pg.evaluate(() => window.viewer.snapshot('image/jpeg', 0.9)))
// 3 angolazioni attorno alla casa (stessa distanza, 35 gradi sopra l'orizzonte)
const views = [['nordovest', 225], ['sudest', 45], ['sudovest', 135]]
for (const [label, az] of views) {
  await pg.evaluate(az => {
    const v = window.viewer, B = v.house.bounds, cx = (B.x0 + B.x1) / 2, cz = (B.z0 + B.z1) / 2, D = Math.max(B.x1 - B.x0, B.z1 - B.z0) * 1.15 + 4
    const a = az * Math.PI / 180, el = 35 * Math.PI / 180
    v.camera.position.set(cx + Math.cos(a) * Math.cos(el) * D, Math.sin(el) * D, cz + Math.sin(a) * Math.cos(el) * D)
    v.debug.orbit.target.set(cx, 0.8, cz); v.debug.orbit.update()
  }, az)
  await new Promise(r => setTimeout(r, 2500))
  await save(`${prefix}-${label}.jpg`, await pg.evaluate(() => window.viewer.snapshot('image/jpeg', 0.9)))
}
// primi piani (CLOSE='[["scala",x,z,distanza,azimut,elevazione],...]' in metri e gradi)
for (const [label, x, z, D, az, el] of JSON.parse(process.env.CLOSE || '[]')) {
  await pg.evaluate((x, z, D, az, el) => {
    const v = window.viewer, a = az * Math.PI / 180, e = el * Math.PI / 180
    v.camera.position.set(x + Math.cos(a) * Math.cos(e) * D, Math.sin(e) * D, z + Math.sin(a) * Math.cos(e) * D)
    v.debug.orbit.target.set(x, 0.5, z); v.debug.orbit.update()
  }, x, z, D, az, el)
  await new Promise(r => setTimeout(r, 2500))
  await save(`${prefix}-${label}.jpg`, await pg.evaluate(() => window.viewer.snapshot('image/jpeg', 0.9)))
}
// ortografica dall'alto: x a destra, z in basso, PX pixel per metro, dal punto (x0, z0) dei confini della casa
const meta = await pg.evaluate(async PX => {
  const THREE = await import('three')
  const v = window.viewer, B = v.house.bounds, pad = 1
  const x0 = B.x0 - pad, z0 = B.z0 - pad, x1 = B.x1 + pad, z1 = B.z1 + pad, W = Math.round((x1 - x0) * PX), H = Math.round((z1 - z0) * PX)
  const cam = new THREE.OrthographicCamera(-(x1 - x0) / 2, (x1 - x0) / 2, (z1 - z0) / 2, -(z1 - z0) / 2, 0.1, 200)
  cam.position.set((x0 + x1) / 2, 60, (z0 + z1) / 2); cam.up.set(0, 0, -1); cam.lookAt((x0 + x1) / 2, 0, (z0 + z1) / 2)
  v.house.hideInTop.forEach(m => { m.visible = false })
  const old = new THREE.Vector2(); v.renderer.getSize(old)
  const bg = v.scene.background; v.scene.background = new THREE.Color(0xffffff)
  v.renderer.setSize(W, H, false); v.renderer.render(v.scene, cam)
  const url = v.renderer.domElement.toDataURL('image/png')
  v.renderer.setSize(old.x, old.y, false); v.scene.background = bg
  return { url, x0, z0, W, H, PX }
}, PX)
await save(`${prefix}-orto.png`, meta.url)
fs.writeFileSync(path.join(outDir, `${prefix}-orto.json`), JSON.stringify({ x0: meta.x0, z0: meta.z0, W: meta.W, H: meta.H, PX: meta.PX }))
await b.close()
fs.rmSync(`public/zz-c3/${name}`)
console.log('ok', outDir, prefix)
