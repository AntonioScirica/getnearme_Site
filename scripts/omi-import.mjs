#!/usr/bin/env node
// Importa la fornitura OMI dell'Agenzia delle Entrate per la valutazione casa (/it/quanto-vale-la-mia-casa).
//
// Cosa scaricare (una volta a semestre, circa marzo e settembre):
//   https://www.agenziaentrate.gov.it/portale/schede/fabbricatiterreni/omi/forniture-dati-omi -> accesso con SPID/CIE
//   -> "Forniture dati OMI" -> "Perimetri delle zone OMI" -> ambito "Intero territorio nazionale" -> ultimo semestre.
//   Dopo qualche minuto compare nell'elenco delle forniture il file QIP<n>_<codicefiscale>.zip (40-130 MB):
//   contiene QI_<n>_1_<AAAAS>_ZONE.csv, QI_<n>_1_<AAAAS>_VALORI.csv e un KML per comune.
//   (Va bene anche la fornitura "Quotazioni immobiliari" QI<n>_....zip, ma senza perimetri: stima a livello comune.)
//   Lo ZIP contiene il codice fiscale nel nome: non va pubblicato ne' messo nel repo.
//
// Uso:
//   node scripts/omi-import.mjs ~/Downloads/QIP1234567_XXXXXXXXXXXXXXXX.zip            -> scrive data/omi/ (locale)
//   node scripts/omi-import.mjs ~/Downloads/QIP1234567_XXXXXXXXXXXXXXXX.zip --upload   -> e carica su R2 in omi/
//
// Uscita (stessa struttura in data/omi/ e su R2 sotto omi/):
//   latest.json                 { semestre: "20252" }  (scritto per ultimo: il sito passa al semestre nuovo solo a import finito)
//   <AAAAS>/valori.json         per comune (codice catastale): nome, provincia, zone con min/max €/m² per tipologia residenziale
//   <AAAAS>/zone/<codcom>.json  poligoni delle zone del comune (WGS84, 5 decimali)
// Fonte: Agenzia delle Entrate - OMI, licenza CC BY 4.0.
import { readFile, writeFile, mkdir, readdir, stat } from 'fs/promises'
import path from 'path'
import JSZip from 'jszip'
import { config } from 'dotenv'

config({ path: '.env.local' })
const [input, ...flags] = process.argv.slice(2)
if (!input) { console.error('Uso: node scripts/omi-import.mjs <QIP...zip | cartella> [--upload]'); process.exit(1) }
const OUT = path.join(process.cwd(), 'data', 'omi')
const TIPS = new Set(['20', '19', '21', '1', '22']) // civili, signorili, economiche, ville e villini, tipiche dei luoghi

// --- lettura dei file: ZIP (anche ZIP/KMZ dentro lo ZIP) o cartella gia' estratta
const files = [] // { name, buf }
async function addZip(buf) {
  const zip = await JSZip.loadAsync(buf)
  for (const e of Object.values(zip.files)) {
    if (e.dir) continue
    const b = await e.async('nodebuffer')
    if (/\.(zip|kmz)$/i.test(e.name)) await addZip(b)
    else files.push({ name: path.basename(e.name), buf: b })
  }
}
async function addDir(dir) {
  for (const n of await readdir(dir)) {
    const p = path.join(dir, n)
    if ((await stat(p)).isDirectory()) await addDir(p)
    else if (/\.(zip|kmz)$/i.test(n)) await addZip(await readFile(p))
    else files.push({ name: n, buf: await readFile(p) })
  }
}
if ((await stat(input)).isDirectory()) await addDir(input); else await addZip(await readFile(input))

// UTF-8 se valido, altrimenti Latin-1 (alcune forniture dichiarano UTF-8 ma non lo sono)
const decode = buf => { try { return new TextDecoder('utf-8', { fatal: true }).decode(buf) } catch { return new TextDecoder('latin1').decode(buf) } }

// CSV OMI: riga di titolo prima dell'intestazione, separatore ';' (o ',' nelle copie convertite), virgola decimale, ';' finale
function parseCsv(text) {
  const lines = text.split(/\r?\n/)
  const h = lines.findIndex(l => l.startsWith('Area_territoriale'))
  if (h < 0) throw new Error('intestazione Area_territoriale non trovata')
  const sep = lines[h].includes(';') ? ';' : ','
  const split = l => { const out = []; let cur = '', q = false; for (const ch of l) { if (ch === '"') q = !q; else if (ch === sep && !q) { out.push(cur); cur = '' } else cur += ch } out.push(cur); return out.map(x => x.trim()) }
  const cols = split(lines[h]).filter(Boolean)
  return lines.slice(h + 1).filter(l => l.trim()).map(l => { const v = split(l); return Object.fromEntries(cols.map((c, i) => [c, v[i] ?? ''])) })
}
const num = s => Number(String(s).replace(/\./g, '').replace(',', '.'))

const valoriF = files.find(f => /_VALORI(_utf8)?\.csv$/i.test(f.name))
const zoneF = files.find(f => /_ZONE(_utf8)?\.csv$/i.test(f.name))
if (!valoriF || !zoneF) { console.error('Nella fornitura mancano i file *_VALORI.csv e *_ZONE.csv'); process.exit(1) }
const sem = valoriF.name.match(/_(\d{5})_VALORI/i)?.[1]
if (!sem) { console.error('Semestre (AAAAS) non trovato nel nome', valoriF.name); process.exit(1) }

// --- zone: descrizione e fascia
const comuni = {}
for (const r of parseCsv(decode(zoneF.buf))) {
  const cod = r.Comune_amm
  if (!cod) continue
  const c = (comuni[cod] ??= { n: r.Comune_descrizione, p: r.Prov, z: {} })
  c.z[r.Zona] = { d: r.Zona_Descr.replace(/^'+|'+$/g, '').trim(), f: r.Fascia, q: {} }
}
// --- valori: compravendita min/max per tipologia residenziale, stato NORMALE (se manca, lo stato prevalente)
let nVal = 0
for (const r of parseCsv(decode(valoriF.buf))) {
  if (!TIPS.has(r.Cod_Tip)) continue
  const z = comuni[r.Comune_amm]?.z[r.Zona]
  const min = num(r.Compr_min), max = num(r.Compr_max)
  if (!z || !(min > 0) || !(max >= min)) continue
  const normal = r.Stato === 'NORMALE'
  if (z.q[r.Cod_Tip] && !normal) continue
  if (normal || r.Stato_prev === 'P' || !z.q[r.Cod_Tip]) { z.q[r.Cod_Tip] = [min, max, r.Sup_NL_compr === 'N' ? 'N' : 'L']; nVal++ }
}
for (const c of Object.values(comuni)) for (const [k, z] of Object.entries(c.z)) if (!Object.keys(z.q).length) delete c.z[k]

// --- perimetri: un KML per comune, Placemark con CODCOM e CODZONA (LINKZONA e' vuoto: si unisce su comune + zona)
const zoneGeo = {} // codcom -> [{ z, b, r }]
const r5 = x => Math.round(x * 1e5) / 1e5
for (const f of files.filter(f => /\.kml$/i.test(f.name))) {
  const kml = decode(f.buf)
  for (const pm of kml.split('<Placemark').slice(1)) {
    const data = k => pm.match(new RegExp(`<Data name="${k}">[\\s\\S]*?<value>([^<]*)</value>`))?.[1]?.trim()
    const cod = data('CODCOM'), zona = data('CODZONA')
    if (!cod || !zona) continue
    const rings = [...pm.matchAll(/<coordinates>([\s\S]*?)<\/coordinates>/g)].map(m => m[1].trim().split(/\s+/).flatMap(t => { const [x, y] = t.split(',').map(Number); return [r5(x), r5(y)] })).filter(r => r.length >= 6 && r.every(Number.isFinite))
    if (!rings.length) continue
    const b = [Infinity, Infinity, -Infinity, -Infinity] // niente Math.min(...array): stack pieno sui poligoni grandi
    for (const r of rings) for (let i = 0; i < r.length; i += 2) { b[0] = Math.min(b[0], r[i]); b[1] = Math.min(b[1], r[i + 1]); b[2] = Math.max(b[2], r[i]); b[3] = Math.max(b[3], r[i + 1]) }
    const list = (zoneGeo[cod] ??= [])
    const same = list.find(x => x.z === zona)
    if (same) { same.r.push(...rings); same.b = [Math.min(same.b[0], b[0]), Math.min(same.b[1], b[1]), Math.max(same.b[2], b[2]), Math.max(same.b[3], b[3])] }
    else list.push({ z: zona, b, r: rings })
  }
}

// --- scrittura
const out = [[`${sem}/valori.json`, JSON.stringify({ semestre: sem, comuni })]]
for (const [cod, list] of Object.entries(zoneGeo)) out.push([`${sem}/zone/${cod}.json`, JSON.stringify(list)])
out.push(['latest.json', JSON.stringify({ semestre: sem })])
await mkdir(path.join(OUT, sem, 'zone'), { recursive: true })
for (const [rel, body] of out) await writeFile(path.join(OUT, rel), body)
console.log(`Semestre ${sem}: ${Object.keys(comuni).length} comuni, ${nVal} quotazioni residenziali, perimetri per ${Object.keys(zoneGeo).length} comuni -> ${OUT}`)

if (flags.includes('--upload')) {
  const { S3Client, PutObjectCommand } = await import('@aws-sdk/client-s3')
  const s3 = new S3Client({ region: 'auto', endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`, credentials: { accessKeyId: process.env.R2_ACCESS_KEY_ID, secretAccessKey: process.env.R2_SECRET_ACCESS_KEY } })
  const put = ([rel, body]) => s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: `omi/${rel}`, Body: body, ContentType: 'application/json', CacheControl: rel === 'latest.json' ? 'public, max-age=3600' : 'public, max-age=604800' }))
  const queue = out.slice(0, -1) // latest.json per ultimo
  let done = 0
  await Promise.all(Array.from({ length: 16 }, async () => { for (let it; (it = queue.shift());) { await put(it); if (++done % 500 === 0) console.log(`  caricati ${done}/${out.length}`) } }))
  await put(out[out.length - 1])
  console.log(`Caricati ${out.length} file su R2 in omi/ (${process.env.R2_PUBLIC_URL}/omi/latest.json)`)
}
