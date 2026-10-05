// @ts-nocheck
// Giro completo sulle piante di prova: riconoscimento TS + sovrapposizione + controllo Claude (1 chiamata a pianta)
// + correzioni + pianta per il visore. Confronto con i risultati finali del prototipo Python.
//   npx tsx scripts/casa3d-check.mts [nomi...]
import fs from 'fs'
import { config } from 'dotenv'
config({ path: '.env.local' })
const { vectorizeImage } = await import('../src/lib/casa3d/vectorize.ts')
const { overlayJpeg } = await import('../src/lib/casa3d/overlay.ts')
const { claudeCheck } = await import('../src/lib/casa3d/check.ts')
const { applyFix, buildViewerPlan, planCounts } = await import('../src/lib/casa3d/build.ts')
const dir = `${process.env.HOME}/Desktop/prove-planimetria/3d-v2/2`, out = '/tmp/casa3d-ts'
const names = process.argv.slice(2).length ? process.argv.slice(2) : ['1', '3d', '4p1', '4p2', '5']
let usd = 0
for (const n of names) {
  const cad = fs.readFileSync(`${dir}/cad-${n}.png`)
  const v = await vectorizeImage(cad)
  const t1 = Date.now(); const ov = await overlayJpeg(v.plan, cad); const ovMs = Date.now() - t1
  fs.writeFileSync(`${out}/ov-${n}.jpg`, ov)
  const c = await claudeCheck(fs.readFileSync(`${dir}/in-${n}.png`), ov, v.plan)
  usd += c.usage.usd
  fs.writeFileSync(`${out}/fix-${n}.json`, JSON.stringify(c.fix, null, 1))
  const fixed = applyFix(v.plan, c.fix)
  const t2 = Date.now(); const vp = buildViewerPlan(fixed); const bMs = Date.now() - t2
  fs.writeFileSync(`${out}/rawfix-${n}.json`, JSON.stringify(fixed))
  fs.writeFileSync(`${out}/final-${n}.json`, JSON.stringify(vp))
  const py = JSON.parse(fs.readFileSync(`${dir}/final-${n}.json`, 'utf8'))
  console.log(JSON.stringify({ n, ms: { riconoscimento: v.ms, sovrapposizione: ovMs, claude: c.ms, costruzione: bMs }, usd: c.usage.usd, ts: planCounts(vp), py: planCounts(py), tipi: vp.rooms.map(r => r.type).join(' '), note: c.fix.notes }))
}
console.log('totale $', usd.toFixed(4))
