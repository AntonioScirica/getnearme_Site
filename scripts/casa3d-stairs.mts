// @ts-nocheck
// Prova delle SOLE scale di una casa 3D, senza AI: riusa la pianta salvata (raw), la lettura Gemini salvata (read.json)
// e l'originale; rifa' la lettura dei gradini sul disegno (src/lib/casa3d/stairs.ts) e la pianta per il visore.
//   npx tsx scripts/casa3d-stairs.mts <raw.json> <read.json> <originale> <uscita-plan.json> [nome]
// Scrive anche <uscita>.debug.png: i pezzi trovati disegnati sull'originale (rampe blu, ventagli arancio, pianerottoli verdi).
import fs from 'fs'
import sharp from 'sharp'
const { readStairs } = await import('../src/lib/casa3d/stairs.ts')
const { buildViewerPlan, inPoly } = await import('../src/lib/casa3d/build.ts')

const [, , rawF, readF, origF, outF, name = 'Piano terra'] = process.argv
const raw = JSON.parse(fs.readFileSync(rawF, 'utf8'))
const rd = JSON.parse(fs.readFileSync(readF, 'utf8')), read = rd.read ?? rd
const img = fs.readFileSync(origF)
// riquadri delle scale lette (0-1000 -> metri, come semantic.ts), al vano scala che li copre di piu'
const S = raw.source, [a, b, c, d, e, f] = S.toImage, det = a * d - b * c
const toM = (gx, gy) => { const px = gx / 1000 * S.imgW, py = gy / 1000 * S.imgH; return [(d * (px - e) - c * (py - f)) / det, (-b * (px - e) + a * (py - f)) / det] }
for (const r of raw.rooms) if (r.stair) for (const k of ['seen', 'path', 'flight', 'treads', 'landing', 'up', 'tread', 'guess', 'box']) delete r.stair[k]
for (const s of read.stairs ?? []) {
  if ((s.conf ?? 1) < 0.5) continue
  const P = s.poly.map(q => toM(q[0], q[1])), xs = P.map(q => q[0]), zs = P.map(q => q[1])
  const box = [Math.min(...xs), Math.min(...zs), Math.max(...xs), Math.max(...zs)].map(v => Math.round(v * 1000) / 1000)
  let best = null, bs = 0
  // come semantic.ts: il vano scala gia' segnato dalla lettura (verso, stanze collegate), se no quello che lo copre di piu'
  for (const r of raw.rooms.filter(r => r.type === 'scala')) {
    let n = 0, k = 0
    for (let z = box[1]; z <= box[3]; z += 0.1) for (let x = box[0]; x <= box[2]; x += 0.1) { k++; if (inPoly(x, z, r.poly)) n++ }
    if (r.stair?.goes || r.stair?.from) n += 1e6
    if (n > bs) { bs = n; best = r }
  }
  if (best) best.stair = { ...(best.stair ?? {}), box }
}
raw.read = raw.read ?? { model: 'cache' }
const out = await readStairs(raw, img, { drop: true })
for (const r of out.rooms.filter(r => r.stair || r.type === 'scala' || raw.rooms.find(q => q.id === r.id)?.type === 'scala')) console.log(r.id, r.type, r.area, JSON.stringify(r.stair))
const plan = buildViewerPlan(out, name, { lawn: !!process.env.LAWN })
fs.writeFileSync(outF, JSON.stringify(plan))
fs.writeFileSync(outF.replace(/\.json$/, '.raw.json'), JSON.stringify(out))
// debug: pezzi sull'originale
const meta = await sharp(img).metadata(), sx = meta.width / S.imgW, sy = meta.height / S.imgH
const P = (x, z) => [(a * x + c * z + e) * sx, (b * x + d * z + f) * sy]
let svg = ''
const rect = (bx, col) => { const [x0, y0] = P(bx[0], bx[1]), [x1, y1] = P(bx[2], bx[3]); svg += `<rect x="${Math.min(x0, x1)}" y="${Math.min(y0, y1)}" width="${Math.abs(x1 - x0)}" height="${Math.abs(y1 - y0)}" fill="${col}" fill-opacity="0.25" stroke="${col}" stroke-width="2"/>` }
for (const r of out.rooms) {
  const st = r.stair; if (!st) continue
  if (st.box) rect(st.box, '#888')
  for (const p of st.path ?? []) {
    if (p.k === 'run') {
      rect(p.box, '#1565c0')
      const L = p.axis === 'x' ? p.box[2] - p.box[0] : p.box[3] - p.box[1]
      for (let k = 0; k <= p.n; k++) { const t = (p.axis === 'x' ? p.box[0] : p.box[1]) + L * k / p.n; const [x0, y0] = P(...(p.axis === 'x' ? [t, p.box[1]] : [p.box[0], t])), [x1, y1] = P(...(p.axis === 'x' ? [t, p.box[3]] : [p.box[2], t])); svg += `<line x1="${x0}" y1="${y0}" x2="${x1}" y2="${y1}" stroke="#1565c0" stroke-width="2"/>` }
      const s = p.dir > 0 ? 0 : 1, m = p.axis === 'x' ? [p.box[s ? 2 : 0], (p.box[1] + p.box[3]) / 2] : [(p.box[0] + p.box[2]) / 2, p.box[s ? 3 : 1]]
      const [cx, cy] = P(m[0], m[1]); svg += `<circle cx="${cx}" cy="${cy}" r="5" fill="#d00"/>`
    } else if (p.k === 'fan') {
      for (const w of p.wedges) svg += `<polygon points="${w.map(q => P(q[0], q[1]).join(',')).join(' ')}" fill="#ef6c00" fill-opacity="0.25" stroke="#ef6c00" stroke-width="2"/>`
      const c0 = p.wedges[0].map(q => P(q[0], q[1])), cx = c0.reduce((t, q) => t + q[0], 0) / c0.length, cy = c0.reduce((t, q) => t + q[1], 0) / c0.length
      svg += `<circle cx="${cx}" cy="${cy}" r="5" fill="#d00"/>`
    } else rect(p.box, '#2e7d32')
  }
}
const W = meta.width, H = meta.height
await sharp(img).composite([{ input: Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">${svg}</svg>`) }]).png().toFile(outF.replace(/\.json$/, '.debug.png'))
console.log('ok', outF)
