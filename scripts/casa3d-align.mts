// @ts-nocheck
// Fedelta' all'originale sulle piante di prova (niente AI): errore medio (cm) delle facce dei muri dall'inchiostro
// dell'originale prima, dopo l'allineamento globale e dopo l'aggancio delle linee.
//   npx tsx scripts/casa3d-align.mts
import fs from 'fs'
const { alignToOriginal } = await import('../src/lib/casa3d/align.ts')
const dir = `${process.env.HOME}/Desktop/prove-planimetria/3d-v2/2`
for (const n of ['1', '3d', '4p1', '4p2', '5']) {
  const raw = JSON.parse(fs.readFileSync(`/tmp/casa3d-ts/rawfix-${n}.json`, 'utf8'))
  const t = Date.now()
  const { raw: out, metrics } = await alignToOriginal(raw, fs.readFileSync(`${dir}/in-${n}.png`))
  fs.writeFileSync(`/tmp/casa3d-ts/aligned-${n}.json`, JSON.stringify(out))
  console.log(n, `${Date.now() - t} ms`, JSON.stringify(metrics))
}
