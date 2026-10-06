// @ts-nocheck
// Prova degli ARCHI di una casa 3D: riusa la pianta salvata (raw) e l'originale, legge le foto dell'immobile dal DB
// (solo lettura) e fa UNA chiamata Gemini (src/lib/casa3d/arches.ts). Scrive la pianta per il visore, niente R2/DB.
//   npx tsx scripts/casa3d-arches.mts <raw.json> <originale> <projectId> <uscita-plan.json> [nome]
import fs from 'fs'
import { config } from 'dotenv'
config({ path: '.env.local', quiet: true })
const { readArches, archPhotos, candidates } = await import('../src/lib/casa3d/arches.ts')
const { buildViewerPlan } = await import('../src/lib/casa3d/build.ts')
const { createClient } = await import('@supabase/supabase-js')
const [, , rawF, origF, project, outF, name = 'Piano terra'] = process.argv
const raw = JSON.parse(fs.readFileSync(rawF, 'utf8'))
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY)
const { data: proj } = await admin.from('projects').select('import_data').eq('id', project).single()
const pd = proj.import_data
const photos = archPhotos(pd.photos ?? [], pd.rooms ?? {})
console.log('foto', photos.length, photos.map(u => pd.rooms?.[u]?.room).join(','))
fs.writeFileSync(outF.replace(/\.json$/, '.photos.json'), JSON.stringify(photos))
// ARCHI=P9,P18: risposta gia' avuta (niente chiamata), etichette dei passaggi
const labels = process.env.ARCHI?.split(',')
const answer = labels ? { arches_seen: true, openings: candidates(raw).map((c, k) => (labels.includes(c.o.label) ? k + 1 : 0)).filter(Boolean), conf: 1 } : undefined
const out = await readArches(raw, fs.readFileSync(origF), photos, 'fbae9321-4168-4f14-852e-3f296fe638fe', answer)
console.log('archi', JSON.stringify(out.arches), out.openings.filter(o => o.shape === 'arch').map(o => `${o.label} ${o.width}`).join(', '))
fs.writeFileSync(outF.replace(/\.json$/, '.raw.json'), JSON.stringify(out))
fs.writeFileSync(outF, JSON.stringify(buildViewerPlan(out, name, { lawn: !!process.env.LAWN })))
