// Verifica del business plan dinamico: il modello TS (src/lib/businessPlan.ts) con gli input dei tre scenari
// deve dare gli stessi numeri di projections.py (projections.json). Uso:
//   node --experimental-strip-types scripts/bp-check.mjs [percorso/projections.json]
import { readFileSync } from 'node:fs';
import { homedir } from 'node:os';
import { PRESETS, run, MESI_IT } from '../src/lib/businessPlan.ts';

const path = process.argv[2] ?? `${homedir()}/Desktop/agenteimmo-business-plan/projections.json`;
const ref = JSON.parse(readFileSync(path, 'utf8'));
const lab = (t) => (t === null ? 'oltre ottobre 2029' : `${MESI_IT[(10 + t) % 12]} ${2026 + Math.floor((10 + t) / 12)}`);
const YEAR_KEYS = ['clienti_fine', 'nuovi', 'abbonamenti', 'pacchetti', 'ricavi', 'ai', 'prove', 'stripe', 'fissi', 'marketing', 'costi', 'risultato', 'compenso', 'dopo_compenso', 'cassa_fine', 'cassa_fine_dopo_compenso'];
const UNIT_KEYS = ['arpu_tot', 'margine_lordo', 'ltv', 'ltv_cac', 'payback_mesi'];
let fails = 0, checks = 0;
const close = (a, b) => Math.abs(a - b) <= 1e-6 * Math.max(1, Math.abs(b));
const check = (what, got, want) => { checks++; if (!(typeof want === 'number' ? close(got, want) : got === want)) { fails++; console.log(`  DIVERSO ${what}: ts=${got} py=${want}`); } };

for (const key of ['prudente', 'base', 'ambizioso']) {
  const r = run(PRESETS[key]);
  const py = ref.scenari[key];
  for (let y = 0; y < 3; y++) for (const k of YEAR_KEYS) check(`${key} anno ${y + 1} ${k}`, r.anni[y][k], py.anni[y][k]);
  for (let t = 0; t < 36; t++) for (const k of ['clienti', 'ricavi', 'costi', 'cumulato', 'compenso']) check(`${key} mese ${t} ${k}`, r.mesi[t][k], py.mesi[t][k]);
  const tg = r.traguardi, pt = py.traguardi;
  for (const k of ['pareggio_mensile', 'pareggio_cumulato', 'margine_2000', 'margine_4000', 'compenso_1', 'compenso_2']) check(`${key} ${k}`, lab(tg[k]), pt[k]);
  check(`${key} cassa_minima`, tg.cassa_minima, pt.cassa_minima);
  for (const k of UNIT_KEYS) check(`${key} unit ${k}`, r.unit[k], py.unit[k]);
  const a = r.anni.map(y => `A${y.anno} clienti ${y.clienti_fine.toFixed(0)} ricavi ${y.ricavi.toFixed(0)} EBITDA ${y.risultato.toFixed(0)}`).join(' | ');
  console.log(`${key.padEnd(10)} ${a}`);
}
console.log(fails ? `\n${fails} differenze su ${checks} controlli` : `\nOK: ${checks} controlli, TS uguale a Python`);
process.exit(fails ? 1 : 0);
