// @ts-nocheck
// Confronto del riconoscimento TS con i risultati del prototipo Python sulle 5 planimetrie di prova (niente AI).
//   npx tsx scripts/casa3d-validate.ts [cartella] [nomi...]
import fs from 'fs'
import { vectorizeImage } from '../src/lib/casa3d/vectorize.ts'

const dir = process.argv[2] || `${process.env.HOME}/Desktop/prove-planimetria/3d-v2/2`
const names = process.argv.slice(3).length ? process.argv.slice(3) : ['1', '3d', '4p1', '4p2', '5']
const out = process.env.OUT || '/tmp/casa3d-ts'
fs.mkdirSync(out, { recursive: true })
for (const n of names) {
  const r = await vectorizeImage(fs.readFileSync(`${dir}/cad-${n}.png`))
  fs.writeFileSync(`${out}/raw-${n}.json`, JSON.stringify(r.plan))
  let py: Record<string, unknown> = {}
  try {
    const p = JSON.parse(fs.readFileSync(`${dir}/plan-${n}.json`, 'utf8'))
    const c = (t: string) => p.openings.filter((o: { type: string }) => o.type === t).length
    py = { muri: p.walls.length, door: c('door'), entrance: c('entrance'), varco: c('varco'), window: c('window'), stanze: p.rooms.length, mq: Math.round(p.rooms.reduce((a: number, r: { area: number }) => a + r.area, 0) * 10) / 10, m_per_px: Math.round(p.source.m_per_px * 1e5) / 1e5 }
  } catch {}
  console.log(n, `${r.ms} ms`, '\n  TS', JSON.stringify(r.stats), '\n  PY', JSON.stringify(py))
}
// sovrapposizioni per il controllo a occhio
if (process.env.OVERLAY) {
  const { overlayJpeg } = await import('../src/lib/casa3d/overlay.ts')
  for (const n of names) {
    const plan = JSON.parse(fs.readFileSync(`${out}/raw-${n}.json`, 'utf8'))
    fs.writeFileSync(`${out}/ov-${n}.jpg`, await overlayJpeg(plan, fs.readFileSync(`${dir}/cad-${n}.png`)))
  }
}
