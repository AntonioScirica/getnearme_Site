// @ts-nocheck
// Ricostruzione di una casa 3D con la lettura nuova (Gemini sull'originale) riusando ritaglio e ridisegno salvati su R2:
// niente GPT, niente Claude, 1 chiamata Gemini per pianta (la lettura si salva in OUT/<nome>/read.json e si riusa).
//   npx tsx scripts/casa3d-rebuild.mts <nome> [--publish]
// Senza --publish scrive solo in OUT (prima/dopo, piante per il visore). Con --publish carica raw e pianta nuove su R2,
// copia la pianta precedente accanto con .bak e aggiorna details.casa3d dell'immobile (stile e poster restano).
import fs from 'fs'
import { config } from 'dotenv'
config({ path: '.env.local', quiet: true })
const { recognizeFloor } = await import('../src/lib/casa3d/pipeline.ts')
const { readPlan } = await import('../src/lib/casa3d/read.ts')
const { buildViewerPlan } = await import('../src/lib/casa3d/build.ts')
const { uploadFile } = await import('../src/lib/r2.ts')
const { createClient } = await import('@supabase/supabase-js')

const U = 'fbae9321-4168-4f14-852e-3f296fe638fe'
const B = `${process.env.R2_PUBLIC_URL}/casa3d/${U}`
const HOUSES = {
  castelfranco: { project: '344ebbf2-9a5d-4e82-8807-41c99cafd8e5', key: 'c3d-muvugzdoivkede', orig: 'f0-orig-muwgedch.jpg', cad: 'f0-cad-muwgedch.png' },
  mulino: { project: 'aa86c2a9-e9bb-4246-8a20-6da9d366d8f9', key: 'c3d-v4-mulino-muvr5teo', orig: 'f0-orig-muvr67cc.jpg', cad: 'f0-cad-muvr67cc.png' },
}
const name = process.argv[2], publish = process.argv.includes('--publish')
const H = HOUSES[name]
if (!H) throw new Error('casa sconosciuta: ' + Object.keys(HOUSES).join(', '))
const OUT = `${process.env.OUT || `${process.env.HOME}/Desktop/casa3d/14`}/${name}`
fs.mkdirSync(OUT, { recursive: true })
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data: proj } = await admin.from('projects').select('id, mq, import_data').eq('id', H.project).single()
const casa = proj.import_data.details.casa3d
const get = async (u: string) => Buffer.from(await (await fetch(u)).arrayBuffer())
const image = await get(`${B}/${H.key}/${H.orig}`), cad = await get(`${B}/${H.key}/${H.cad}`)
const prevRaw = await (await fetch(casa.floors[0].raw)).json()
fs.writeFileSync(`${OUT}/raw-prima.json`, JSON.stringify(prevRaw))
fs.writeFileSync(`${OUT}/plan-prima.json`, JSON.stringify(await (await fetch(casa.floors[0].plan)).json()))
fs.writeFileSync(`${OUT}/originale.jpg`, image)

// lettura: una volta sola (poi dalla cache)
let readCache = fs.existsSync(`${OUT}/read.json`) ? JSON.parse(fs.readFileSync(`${OUT}/read.json`, 'utf8')) : null
if (!readCache) {
  readCache = await readPlan(image, U)
  if (!readCache) throw new Error('lettura fallita')
  fs.writeFileSync(`${OUT}/read.json`, JSON.stringify(readCache, null, 1))
  console.log('lettura', readCache.ms, 'ms', readCache.usd, '$')
} else console.log('lettura dalla cache')

const r = await recognizeFloor({ userId: U, image, cad, areaM2: proj.mq, check: false, readCache })
const raw = { ...r.raw, ...(prevRaw.materials ? { materials: prevRaw.materials } : {}) } // materiali gia' letti dalle foto
const lawn = Object.values(proj.import_data.rooms ?? {}).some(x => x?.scene === 'giardino')
const plan = buildViewerPlan(raw, casa.floors[0].name, { lawn })
fs.writeFileSync(`${OUT}/raw-dopo.json`, JSON.stringify(raw))
fs.writeFileSync(`${OUT}/plan-dopo.json`, JSON.stringify(plan))
fs.writeFileSync(`${OUT}/overlay-ridisegno.jpg`, r.overlay)
console.log(JSON.stringify({ ms: r.ms, read: raw.read, checks: raw.checks, doubts: raw.doubts, scale: raw.source.scale_note }, null, 1))
console.log('stanze', raw.rooms.map(x => `${x.id}:${x.type}${x.label ? `(${x.label})` : ''} ${x.area}${x.stair ? ' ' + JSON.stringify(x.stair) : ''}`).join('\n'))

if (publish) {
  const base = `casa3d/${U}/${H.key}`, v = Date.now().toString(36)
  // copia della pianta precedente accanto, con .bak
  const old = casa.floors[0]
  await uploadFile(Buffer.from(JSON.stringify(prevRaw)), `${base}/${old.raw.split('/').pop()}.bak`, 'application/json')
  await uploadFile(Buffer.from(fs.readFileSync(`${OUT}/plan-prima.json`)), `${base}/${old.plan.split('/').pop()}.bak`, 'application/json')
  const [rawUrl, planUrl] = await Promise.all([
    uploadFile(Buffer.from(JSON.stringify(raw)), `${base}/f0-raw-${v}.json`, 'application/json'),
    uploadFile(Buffer.from(JSON.stringify(plan)), `${base}/f0-plan-${v}.json`, 'application/json'),
    uploadFile(Buffer.from(JSON.stringify(readCache.read)), `${base}/f0-read-${v}.json`, 'application/json'),
  ])
  const floors = [{ ...old, raw: rawUrl, plan: planUrl }]
  const manifest = await uploadFile(Buffer.from(JSON.stringify({ floors: floors.map(f => ({ name: f.name, plan: f.plan, image: f.image })), ...(casa.style ? { style: casa.style } : {}) })), `${base}/casa-${v}.json`, 'application/json')
  const next = { ...casa, floors, manifest, updated: new Date().toISOString() }
  const d = proj.import_data
  const { error } = await admin.from('projects').update({ import_data: { ...d, details: { ...d.details, casa3d: next } }, updated_at: new Date().toISOString() }).eq('id', H.project)
  if (error) throw error
  fs.writeFileSync(`${OUT}/casa3d-prima.json`, JSON.stringify(casa, null, 1))
  fs.writeFileSync(`${OUT}/casa3d-dopo.json`, JSON.stringify(next, null, 1))
  console.log('pubblicata', manifest)
}
