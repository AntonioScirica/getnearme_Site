#!/usr/bin/env node
// Riassunto OMI per le pagine "Prezzo case <città> al metro quadro" (/it/prezzi-case/<slug>).
// Legge i file preparati da scripts/omi-import.mjs (data/omi/latest.json -> <sem>/valori.json + <sem>/zone/<cod>.json)
// e scrive src/data/omiCitta.json: solo le città qui sotto, solo numeri derivati (zone, min/max €/m², medie, vicine).
// Da rilanciare dopo ogni nuovo import OMI (ogni semestre): node scripts/omi-citta.mjs
// Fonte: Agenzia delle Entrate - OMI, licenza CC BY 4.0.
import { readFile, writeFile } from 'fs/promises'
import path from 'path'

const DIR = process.env.OMI_DIR || path.join(process.cwd(), 'data', 'omi')
const OUT = path.join(process.cwd(), 'src', 'data', 'omiCitta.json')

// [slug, nome, codice catastale, sigla provincia, regione]: capoluoghi di regione + capoluoghi di provincia più popolosi
// (ordine per popolazione, circa). Nei file OMI Monza, Forlì e Pesaro hanno ancora le vecchie sigle (MI, FO, PS):
// per questo si usa il codice catastale.
const CITIES = [
  ['roma', 'Roma', 'H501', 'RM', 'Lazio'],
  ['milano', 'Milano', 'F205', 'MI', 'Lombardia'],
  ['napoli', 'Napoli', 'F839', 'NA', 'Campania'],
  ['torino', 'Torino', 'L219', 'TO', 'Piemonte'],
  ['palermo', 'Palermo', 'G273', 'PA', 'Sicilia'],
  ['genova', 'Genova', 'D969', 'GE', 'Liguria'],
  ['bologna', 'Bologna', 'A944', 'BO', 'Emilia-Romagna'],
  ['firenze', 'Firenze', 'D612', 'FI', 'Toscana'],
  ['bari', 'Bari', 'A662', 'BA', 'Puglia'],
  ['catania', 'Catania', 'C351', 'CT', 'Sicilia'],
  ['verona', 'Verona', 'L781', 'VR', 'Veneto'],
  ['venezia', 'Venezia', 'L736', 'VE', 'Veneto'],
  ['messina', 'Messina', 'F158', 'ME', 'Sicilia'],
  ['padova', 'Padova', 'G224', 'PD', 'Veneto'],
  ['trieste', 'Trieste', 'L424', 'TS', 'Friuli-Venezia Giulia'],
  ['parma', 'Parma', 'G337', 'PR', 'Emilia-Romagna'],
  ['brescia', 'Brescia', 'B157', 'BS', 'Lombardia'],
  ['prato', 'Prato', 'G999', 'PO', 'Toscana'],
  ['taranto', 'Taranto', 'L049', 'TA', 'Puglia'],
  ['modena', 'Modena', 'F257', 'MO', 'Emilia-Romagna'],
  ['reggio-calabria', 'Reggio Calabria', 'H224', 'RC', 'Calabria'],
  ['reggio-emilia', 'Reggio Emilia', 'H223', 'RE', 'Emilia-Romagna'],
  ['perugia', 'Perugia', 'G478', 'PG', 'Umbria'],
  ['ravenna', 'Ravenna', 'H199', 'RA', 'Emilia-Romagna'],
  ['livorno', 'Livorno', 'E625', 'LI', 'Toscana'],
  ['cagliari', 'Cagliari', 'B354', 'CA', 'Sardegna'],
  ['foggia', 'Foggia', 'D643', 'FG', 'Puglia'],
  ['rimini', 'Rimini', 'H294', 'RN', 'Emilia-Romagna'],
  ['salerno', 'Salerno', 'H703', 'SA', 'Campania'],
  ['ferrara', 'Ferrara', 'D548', 'FE', 'Emilia-Romagna'],
  ['sassari', 'Sassari', 'I452', 'SS', 'Sardegna'],
  ['latina', 'Latina', 'E472', 'LT', 'Lazio'],
  ['monza', 'Monza', 'F704', 'MB', 'Lombardia'],
  ['siracusa', 'Siracusa', 'I754', 'SR', 'Sicilia'],
  ['pescara', 'Pescara', 'G482', 'PE', 'Abruzzo'],
  ['bergamo', 'Bergamo', 'A794', 'BG', 'Lombardia'],
  ['forli', 'Forlì', 'D704', 'FC', 'Emilia-Romagna'],
  ['trento', 'Trento', 'L378', 'TN', 'Trentino-Alto Adige'],
  ['vicenza', 'Vicenza', 'L840', 'VI', 'Veneto'],
  ['terni', 'Terni', 'L117', 'TR', 'Umbria'],
  ['bolzano', 'Bolzano', 'A952', 'BZ', 'Trentino-Alto Adige'],
  ['novara', 'Novara', 'F952', 'NO', 'Piemonte'],
  ['piacenza', 'Piacenza', 'G535', 'PC', 'Emilia-Romagna'],
  ['ancona', 'Ancona', 'A271', 'AN', 'Marche'],
  ['udine', 'Udine', 'L483', 'UD', 'Friuli-Venezia Giulia'],
  ['arezzo', 'Arezzo', 'A390', 'AR', 'Toscana'],
  ['lecce', 'Lecce', 'E506', 'LE', 'Puglia'],
  ['pesaro', 'Pesaro', 'G479', 'PU', 'Marche'],
  ['la-spezia', 'La Spezia', 'E463', 'SP', 'Liguria'],
  ['alessandria', 'Alessandria', 'A182', 'AL', 'Piemonte'],
  ['pisa', 'Pisa', 'G702', 'PI', 'Toscana'],
  ['pistoia', 'Pistoia', 'G713', 'PT', 'Toscana'],
  ['lucca', 'Lucca', 'E715', 'LU', 'Toscana'],
  ['catanzaro', 'Catanzaro', 'C352', 'CZ', 'Calabria'],
  ['treviso', 'Treviso', 'L407', 'TV', 'Veneto'],
  ['como', 'Como', 'C933', 'CO', 'Lombardia'],
  ['brindisi', 'Brindisi', 'B180', 'BR', 'Puglia'],
  ['varese', 'Varese', 'L682', 'VA', 'Lombardia'],
  ['l-aquila', "L'Aquila", 'A345', 'AQ', 'Abruzzo'],
  ['potenza', 'Potenza', 'G942', 'PZ', 'Basilicata'],
  ['campobasso', 'Campobasso', 'B519', 'CB', 'Molise'],
  ['aosta', 'Aosta', 'A326', 'AO', "Valle d'Aosta"],
]

// descrizioni OMI in maiuscolo con ` al posto dell'apostrofo -> "Centro storico, Duomo, San Babila"
const SMALL = new Set(['di', 'del', 'della', 'delle', 'dei', 'degli', 'dello', 'da', 'dal', 'dalla', 'e', 'ed', 'a', 'al', 'alla', 'alle', 'ai', 'in', 'con', 'su', 'per', 'tra', 'fra', 'il', 'lo', 'la', 'le', 'i', 'gli', 'sul', 'sulla', 'nel', 'nella', 'o', 'fino', 'verso'])
const ROMAN = /^(i{1,3}|iv|v|vi{0,3}|ix|x{1,3})$/i
function pretty(s) {
  s = s.replace(/`/g, "'").replace(/\bC\.\s*STORICO\b/gi, 'CENTRO STORICO').replace(/\s*:\s*/g, ': ').replace(/\s*\(\s*/g, ' (').replace(/\s*\)\s*/g, ') ').replace(/\s*-\s*/g, ' - ').replace(/\s*,\s*/g, ', ').replace(/,(\s*,)+/g, ',').replace(/\s+/g, ' ').replace(/\s+\)/g, ')').trim().replace(/^[,\s-]+|[,\s-]+$/g, '')
  let first = true
  return s.toLowerCase().replace(/[a-zàèéìòù0-9.']+/g, w => {
    const out = (!first && SMALL.has(w)) ? w : ROMAN.test(w) && w.length > 1 ? w.toUpperCase() : w.replace(/(^|['.])([a-zàèéìòù])/g, (_, a, b) => a + b.toUpperCase()).replace(/^(D|L|Dell|Sull|All|Nell)'/, (m, a) => first ? m : a.toLowerCase() + "'")
    first = false
    return out
  }).replace(/ - /g, ', ').replace(/(, )+/g, ', ')
}

const r100 = n => Math.round(n / 10) * 10
const latest = JSON.parse(await readFile(path.join(DIR, 'latest.json'), 'utf8'))
const sem = latest.semestre
const valori = JSON.parse(await readFile(path.join(DIR, sem, 'valori.json'), 'utf8'))
const semestre = `${sem.slice(4)}° semestre ${sem.slice(0, 4)}`

const out = []
for (const [slug, nome, cod, prov, regione] of CITIES) {
  const com = valori.comuni[cod]
  if (!com) throw new Error(`OMI: comune ${cod} (${nome}) non trovato`)
  // centro della città: media dei centri dei riquadri delle zone centrali (fascia B), o di tutte se non ci sono
  let lat = 0, lon = 0
  try {
    const zf = JSON.parse(await readFile(path.join(DIR, sem, 'zone', `${cod}.json`), 'utf8'))
    const fas = Object.fromEntries(Object.entries(com.z).map(([k, z]) => [k, z.f]))
    const pick = zf.some(z => fas[z.z] === 'B') ? zf.filter(z => fas[z.z] === 'B') : zf
    lat = pick.reduce((s, z) => s + (z.b[1] + z.b[3]) / 2, 0) / pick.length
    lon = pick.reduce((s, z) => s + (z.b[0] + z.b[2]) / 2, 0) / pick.length
  } catch { /* senza poligoni niente città vicine per distanza */ }

  const zone = Object.entries(com.z).map(([c, z]) => ({
    c, d: pretty(z.d), f: z.f,
    civ: z.q['20'] ? [z.q['20'][0], z.q['20'][1]] : null,
    sig: z.q['19'] ? [z.q['19'][0], z.q['19'][1]] : null,
    eco: z.q['21'] ? [z.q['21'][0], z.q['21'][1]] : null,
    vil: z.q['1'] ? [z.q['1'][0], z.q['1'][1]] : null,
    netta: Object.values(z.q).some(q => q[2] === 'N') || undefined,
  })).filter(z => z.civ || z.sig || z.eco || z.vil)
    .sort((a, b) => 'BCDER'.indexOf(a.f) - 'BCDER'.indexOf(b.f) || a.c.localeCompare(b.c, 'it', { numeric: true }))

  const civ = zone.filter(z => z.civ)
  const mid = z => (z.civ[0] + z.civ[1]) / 2
  const avg = (xs, f) => xs.length ? xs.reduce((s, x) => s + f(x), 0) / xs.length : 0
  const byFascia = f => civ.filter(z => z.f === f)
  const sorted = [...civ].sort((a, b) => mid(a) - mid(b))
  out.push({
    slug, nome, prov, regione, cod, lat: +lat.toFixed(4), lon: +lon.toFixed(4),
    zone,
    s: {
      n: zone.length, nCiv: civ.length, nSig: zone.filter(z => z.sig).length,
      min: Math.min(...civ.map(z => z.civ[0])), max: Math.max(...civ.map(z => z.civ[1])),
      avgMin: r100(avg(civ, z => z.civ[0])), avgMax: r100(avg(civ, z => z.civ[1])),
      centro: byFascia('B').length ? r100(avg(byFascia('B'), mid)) : null,
      semicentro: byFascia('C').length ? r100(avg(byFascia('C'), mid)) : null,
      periferia: [...byFascia('D'), ...byFascia('E')].length ? r100(avg([...byFascia('D'), ...byFascia('E')], mid)) : null,
      cheap: sorted.slice(0, 3).map(z => z.c),
      dear: sorted.slice(-3).reverse().map(z => z.c),
    },
  })
}

// città vicine: le 4 più vicine in linea d'aria (tra quelle in elenco)
const km = (a, b) => { const R = 6371, t = Math.PI / 180, dLat = (b.lat - a.lat) * t, dLon = (b.lon - a.lon) * t; const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * t) * Math.cos(b.lat * t) * Math.sin(dLon / 2) ** 2; return 2 * R * Math.asin(Math.sqrt(h)) }
for (const c of out) c.vicine = out.filter(o => o !== c && o.lat).map(o => [o.slug, km(c, o)]).sort((a, b) => a[1] - b[1]).slice(0, 4).map(([s]) => s)
// posizione per prezzo medio (1 = la più cara)
const rank = [...out].sort((a, b) => (b.s.avgMin + b.s.avgMax) - (a.s.avgMin + a.s.avgMax))
for (const c of out) c.s.rank = rank.indexOf(c) + 1

await writeFile(OUT, JSON.stringify({ semestre, sem, fonte: 'Agenzia delle Entrate, OMI', licenza: 'CC BY 4.0', citta: out }))
console.log(`${out.length} città, ${semestre} -> ${path.relative(process.cwd(), OUT)} (${(JSON.stringify(out).length / 1024).toFixed(0)} KB)`)
