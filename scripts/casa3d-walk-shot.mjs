// Foto del visore Casa 3D ad altezza d'occhio (camminata) da punti dati: per controllare archi, porte, scale.
//   POSES='[["nome",x,z,yawGradi],...]' node scripts/casa3d-walk-shot.mjs <plan.json> <cartella> <prefisso>
// yaw: 0 = verso -z (nord sulla pianta), 90 = verso +x. Serve il sito in locale (porta 3001).
import fs from 'fs'
import path from 'path'
import puppeteer from 'puppeteer-core'

const [, , planFile, outDir, prefix = 'casa'] = process.argv
fs.mkdirSync('public/zz-c3', { recursive: true }); fs.mkdirSync(outDir, { recursive: true })
const name = `${prefix}-${Date.now().toString(36)}.json`
fs.copyFileSync(planFile, `public/zz-c3/${name}`)
const b = await puppeteer.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: 'new', args: ['--use-angle=metal', '--enable-webgl', '--ignore-gpu-blocklist'] })
const pg = await b.newPage()
pg.on('pageerror', e => console.log('pageerror', e.message))
pg.on('console', m => { if (m.type() === 'error') console.log('console', m.text()) })
await pg.setViewport({ width: 1200, height: 800, deviceScaleFactor: 1 })
await pg.goto(`http://localhost:${process.env.PORT || 3001}/casa3d/v1/index.html?plan=/zz-c3/${name}&ui=0`, { waitUntil: 'networkidle2', timeout: 120000 })
await pg.waitForFunction(() => window.viewer && window.viewer.house, { timeout: 120000 })
await new Promise(r => setTimeout(r, 6000))
// in camminata come l'utente (vista 'walk'), poi al punto dato
await pg.evaluate(() => window.viewer.setView('walk'))
await new Promise(r => setTimeout(r, 2500))
for (const [label, x, z, yawDeg] of JSON.parse(process.env.POSES || '[]')) {
  await pg.evaluate((x, z, yaw) => { const v = window.viewer; v.walk.setPose(x, z, yaw, -0.04); v.walk.enabled = true }, x, z, yawDeg * Math.PI / 180)
  await new Promise(r => setTimeout(r, 3000))
  fs.writeFileSync(path.join(outDir, `${prefix}-${label}.jpg`), Buffer.from((await pg.evaluate(() => window.viewer.snapshot('image/jpeg', 0.92))).split(',')[1], 'base64'))
}
await b.close()
fs.rmSync(`public/zz-c3/${name}`)
console.log('ok')
