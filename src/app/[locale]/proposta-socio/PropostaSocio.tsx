'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import { Clapperboard, Handshake, Link2, MessageSquare, Video } from 'lucide-react'

// Proposta di partnership (socio e volto del brand): revenue share + quote, con simulatore del valore a 5 anni.

type Scenario = 'prudente' | 'base' | 'ottimistico'
const SC: Record<Scenario, { his: number[]; tot: number[] }> = {
  prudente: { his: [40, 100, 160, 220, 280], tot: [120, 300, 500, 700, 900] },
  base: { his: [80, 200, 350, 500, 650], tot: [250, 600, 1100, 1600, 2200] },
  ottimistico: { his: [150, 400, 700, 1000, 1300], tot: [500, 1300, 2500, 4000, 5500] },
}
const TABS: [Scenario, string][] = [['prudente', 'Prudente'], ['base', 'Base'], ['ottimistico', 'Ottimistico']]
// soglie di clienti attivi tuoi -> punti di quota a premio; tetto complessivo; sconto di minoranza
const MS: [number, number][] = [[50, 1], [150, 2], [300, 2], [600, 3]]
const CAP = 10
const DISC = 0.25
const DEFAULTS = { arpu: 46, churn: 3, mult: 1, his: 1, tot: 1 }
type Inputs = typeof DEFAULTS

const k = (v: number) => (v >= 1e6 ? (v / 1e6).toLocaleString('it-IT', { maximumFractionDigits: 2 }) + ' M€' : Math.round(v / 1e3).toLocaleString('it-IT') + ' k€')
const bandMult = (arr: number) => (arr < 250e3 ? 2.5 : arr < 1e6 ? 3 : arr < 3e6 ? 4 : 5)

type Row = { y: number; his: number; tot: number; arr: number; mu: number; val: number; eq: number; eqv: number; feeY: number; feeCum: number; total: number }

// Coorti mensili di clienti tuoi con churn; revenue share 10% dell'incasso netto (prezzo -3% di commissioni);
// quote = 2% base (cliff 6 mesi, matura in 24) + premi a soglia; valutazione = ARR al netto della revenue share x multiplo.
function model(name: Scenario, p: Inputs): Row[] {
  const arpu = p.arpu * 0.97, ch = p.churn / 100, s = SC[name]
  const cohorts: { n: number; age: number }[] = []
  const reached = new Set<number>()
  let feeCum = 0, aHis = 0
  const rows: Row[] = []
  for (let y = 0; y < 5; y++) {
    const tgt = s.his[y] * p.his, kk = Math.pow(1 - ch, 12)
    const n = Math.max(0, ((tgt - aHis * kk) * ch) / (1 - kk))
    let feeY = 0, feeM = 0
    for (let m = 0; m < 12; m++) {
      cohorts.forEach(c => { c.n *= 1 - ch; c.age++ })
      cohorts.push({ n, age: 1 })
      feeM = cohorts.reduce((t, c) => t + c.n * arpu * 0.1, 0)
      feeY += feeM
    }
    aHis = cohorts.reduce((t, c) => t + c.n, 0)
    feeCum += feeY
    MS.forEach((m, i) => { if (aHis >= m[0]) reached.add(i) })
    const month = (y + 1) * 12, base = month < 6 ? 0 : 2 * Math.min(1, month / 24)
    const eq = Math.min(CAP, base + [...reached].reduce((t, i) => t + MS[i][1], 0))
    const tot = Math.max(s.tot[y] * p.tot, aHis)
    const arr = tot * arpu * 12, mu = bandMult(arr) * p.mult, val = Math.max(0, arr - feeM * 12) * mu, eqv = (val * eq) / 100
    rows.push({ y: y + 1, his: aHis, tot, arr, mu, val, eq, eqv, feeY, feeCum, total: feeCum + eqv })
  }
  return rows
}

// colori del grafico dai token del sito (ink e grigio)
const INK = '#222222', SOFT = '#a3a3a3'
function roundTop(g: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0) return
  r = Math.min(r, h)
  g.beginPath(); g.moveTo(x, y + h); g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r); g.lineTo(x + w, y + h); g.closePath(); g.fill()
}
function draw(cv: HTMLCanvasElement, r: Row[]) {
  const dpr = window.devicePixelRatio || 1, W = cv.clientWidth, H = 300
  cv.width = W * dpr; cv.height = H * dpr
  const g = cv.getContext('2d')
  if (!g) return
  g.scale(dpr, dpr)
  const font = getComputedStyle(cv).fontFamily || 'system-ui'
  const pl = 60, pb = 30, pt = 24, w = W - pl - 10, h = H - pt - pb
  const max = Math.max(...r.map(x => x.total)) * 1.12 || 1
  g.font = `12px ${font}`; g.fillStyle = '#8a8a8a'; g.strokeStyle = '#eee'
  for (let i = 0; i <= 4; i++) {
    const v = (max * i) / 4, yy = pt + h - (v / max) * h
    g.beginPath(); g.moveTo(pl, yy); g.lineTo(pl + w, yy); g.stroke(); g.textAlign = 'right'; g.fillText(k(v), pl - 8, yy + 4)
  }
  const bw = (w / r.length) * 0.55
  r.forEach((x, i) => {
    const cx = pl + (w / r.length) * (i + 0.5), x0 = cx - bw / 2
    const hf = (x.feeCum / max) * h, he = (x.eqv / max) * h
    g.fillStyle = INK; roundTop(g, x0, pt + h - hf, bw, hf, 0)
    g.fillStyle = SOFT; roundTop(g, x0, pt + h - hf - he, bw, he, 6)
    g.fillStyle = INK; g.textAlign = 'center'; g.font = `600 12px ${font}`; g.fillText(k(x.total), cx, pt + h - hf - he - 7)
    g.font = `12px ${font}`; g.fillStyle = '#8a8a8a'; g.fillText('Anno ' + x.y, cx, H - 10)
  })
}

// ---- pezzi di interfaccia ----
const card = 'rounded-[20px] border border-line bg-white p-6'
const dark = 'rounded-[20px] border border-ink bg-ink p-6 text-white'
const pill = 'text-xs font-semibold uppercase tracking-[1px] text-muted'
const big = 'my-2.5 font-display text-[40px] font-extrabold leading-none tracking-tight'
const btn = 'inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition'
const btnDark = `${btn} bg-ink text-white hover:opacity-85`
const btnLight = `${btn} border border-line bg-white text-ink hover:border-ink`

function Clean({ items, onDark }: { items: React.ReactNode[]; onDark?: boolean }) {
  return (
    <ul className="mt-3">
      {items.map((it, i) => (
        <li key={i} className={`relative py-2 pl-6 text-[15px] ${i ? `border-t ${onDark ? 'border-white/15' : 'border-line'}` : ''}`}>
          <span className={`absolute left-1 top-[15px] h-[7px] w-[7px] rounded-full ${onDark ? 'bg-white' : 'bg-ink'}`} />
          {it}
        </li>
      ))}
    </ul>
  )
}
function Section({ id, n, title, sub, children }: { id: string; n: string; title: string; sub?: React.ReactNode; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-16 border-t border-line py-[70px]">
      <div className="mx-auto max-w-[1080px] px-6">
        <div className="mb-2.5 text-xs font-semibold uppercase tracking-[1.2px] text-muted">{n}</div>
        <h2 className="mb-2.5 font-display text-[clamp(28px,4vw,38px)] font-bold leading-[1.1] tracking-tight">{title}</h2>
        {sub && <p className="mb-8 max-w-[680px] text-base text-muted">{sub}</p>}
        {children}
      </div>
    </section>
  )
}

export default function PropostaSocio() {
  const [cur, setCur] = useState<Scenario>('base')
  const [p, setP] = useState<Inputs>(DEFAULTS)
  const rows = useMemo(() => model(cur, p), [cur, p])
  const heroVal = useMemo(() => model('base', p)[4].total, [p]) // l'eroe mostra sempre lo scenario base
  const L = rows[4], y3 = rows[2]
  const chart = useRef<HTMLCanvasElement>(null)

  // grafico: ridisegna quando cambiano i numeri o la larghezza del riquadro
  useEffect(() => {
    const cv = chart.current
    if (!cv) return
    draw(cv, rows)
    const ro = new ResizeObserver(() => draw(cv, rows))
    ro.observe(cv)
    return () => ro.disconnect()
  }, [rows])

  const set = (key: keyof Inputs) => (e: React.ChangeEvent<HTMLInputElement>) => setP(o => ({ ...o, [key]: +e.target.value }))
  const sliders: { key: keyof Inputs; label: string; min: number; max: number; step: number; fmt: (v: number) => string }[] = [
    { key: 'arpu', label: 'Prezzo medio cliente', min: 19, max: 69, step: 1, fmt: v => `${v} €/mese` },
    { key: 'churn', label: 'Disdette mensili (churn)', min: 1, max: 8, step: 0.5, fmt: v => `${v.toLocaleString('it-IT')}%` },
    { key: 'mult', label: 'Multiplo di valutazione', min: 0.6, max: 1.6, step: 0.1, fmt: v => `×${v.toFixed(1)}` },
    { key: 'his', label: 'Clienti portati da te', min: 0.5, max: 2, step: 0.1, fmt: v => `×${v.toFixed(1)}` },
    { key: 'tot', label: 'Clienti totali della società', min: 0.5, max: 2, step: 0.1, fmt: v => `×${v.toFixed(1)}` },
  ]

  return (
    <main
      className="min-h-dvh text-ink antialiased"
      style={{ backgroundColor: '#fafafa', backgroundImage: 'radial-gradient(#e2e2e2 1px, transparent 1px)', backgroundSize: '22px 22px' }}
    >
      <nav className="sticky top-0 z-10 border-b border-line bg-[#fafafa]/85 backdrop-blur-md">
        <div className="mx-auto flex h-[60px] max-w-[1080px] items-center justify-between px-6">
          <div className="font-display font-extrabold tracking-tight">agenteimmo.me</div>
          <div className="hidden gap-5 text-sm text-muted md:flex">
            {[['progetto', 'Progetto'], ['ruolo', 'Ruolo'], ['offerta', 'Offerta'], ['valore', 'Valore'], ['tutele', 'Tutele']].map(([id, l]) => (
              <a key={id} href={`#${id}`} className="hover:text-ink">{l}</a>
            ))}
          </div>
        </div>
      </nav>

      <header className="py-[90px] pb-[70px]">
        <div className="mx-auto max-w-[1080px] px-6">
          <span className="mb-5 inline-block rounded-full bg-ink px-3 py-1 text-xs text-white">Proposta riservata · ottobre 2026</span>
          <h1 className="mb-4 font-display text-[clamp(38px,6vw,64px)] font-bold leading-[1.03] tracking-[-1.8px]">Diventa socio e volto<br />di agenteimmo.me</h1>
          <p className="mb-7 max-w-[640px] text-[19px] text-muted">Una proposta di partnership che premia il valore che porti al brand e i clienti che porti in azienda: revenue share mensile e quote della società.</p>
          <div className="mt-12 grid gap-3.5 sm:grid-cols-2 md:grid-cols-3">
            <div className={dark}><div className={`${pill} text-white/60`}>Revenue share</div><div className={big}>10%</div><div className="text-white/60">su quanto incassiamo dai clienti che porti</div></div>
            <div className={card}><div className={pill}>Quote</div><div className={big}>fino al 10%</div><div className="text-muted">2% per il ruolo + fino a 8% a obiettivi</div></div>
            <div className={card}><div className={pill}>Valore a 5 anni · scenario base</div><div className={big}>~{k(heroVal)}</div><div className="text-muted">revenue share incassata + valore quote</div></div>
          </div>
        </div>
      </header>

      <Section id="progetto" n="01 · Il progetto" title="Foto arredate, video e sito per agenti immobiliari"
        sub={<>agenteimmo.me trasforma le foto degli immobili in foto arredate e video &quot;prima e dopo&quot; con l&apos;intelligenza artificiale, e dà a ogni agente un sito personale già pronto, trovabile su Google nella sua zona. È un modello in abbonamento: ogni cliente genera ricavi ricorrenti ogni mese.</>}>
        <div className="grid gap-4 md:grid-cols-3">
          <div className={card}><div className={pill}>Starter</div><div className="font-display text-[44px] font-extrabold tracking-tight">19 € <small className="text-[15px] font-medium tracking-normal text-muted">/ mese</small></div><Clean items={['600 crediti al mese', '~200 foto arredate o 6 video']} /></div>
          <div className={card}><div className={pill}>Plus</div><div className="font-display text-[44px] font-extrabold tracking-tight">49 € <small className="text-[15px] font-medium tracking-normal text-muted">/ mese</small></div><Clean items={['1.500 crediti al mese', 'Sito personale incluso']} /></div>
          <div className={dark}><div className={`${pill} text-white/60`}>Pro · consigliato</div><div className="font-display text-[44px] font-extrabold tracking-tight">69 € <small className="text-[15px] font-medium tracking-normal text-white/60">/ mese</small></div><Clean onDark items={['2.500 crediti al mese', 'Sito + fatturazione trimestrale o annuale']} /></div>
        </div>
        <div className={`${card} mt-6 rounded-[24px]`}>
          <div className="mb-2.5 text-xs font-semibold uppercase tracking-[1.2px]">Le dimensioni del mercato (Italia)</div>
          <p className="mb-5 max-w-[680px] text-muted">Con circa <b>55.000 agenti abilitati</b> (codice ATECO 68.31) e un ricavo stimato di 552 €/anno per cliente, le dimensioni dell&apos;opportunità sono scalabili:</p>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="rounded-[20px] bg-[#fafafa] p-6"><div className={pill}>TAM · Mercato totale</div><div className={big}>~30 M€</div><div className="text-muted">100% degli agenti italiani.</div></div>
            <div className="rounded-[20px] bg-[#fafafa] p-6"><div className={pill}>SAM · Mercato aggredibile</div><div className={big}>~15 M€</div><div className="text-muted">Agenti &quot;digitalizzati&quot; in target (~50%).</div></div>
            <div className={dark}><div className={`${pill} text-white/60`}>SOM · Obiettivo a 5 anni</div><div className={big}>~3 M€</div><div className="text-white/60">Il nostro target: 10% del mercato (5.500).</div></div>
          </div>
        </div>
      </Section>

      <Section id="ruolo" n="02 · Il tuo ruolo" title="Il volto e la voce del progetto" sub="La crescita di un prodotto come questo dipende da visibilità e fiducia. È qui che entri tu.">
        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          {([[Clapperboard, 'Frontman', 'Sei la faccia di agenteimmo.me su social, contenuti ed eventi.'], [Video, 'Contenuti', 'Video, demo, reel e testimonianze del prodotto in azione.'], [Handshake, 'Network', 'Presentazioni ad agenzie, network e franchising immobiliari.'], [MessageSquare, 'Feedback', 'Ci riporti cosa chiedono gli agenti per migliorare il prodotto.']] as const).map(([Icon, t, d]) => (
            <div key={t} className={card}>
              <span className="mb-3 flex h-11 w-11 items-center justify-center rounded-2xl bg-canvas"><Icon size={20} /></span>
              <b>{t}</b><p className="mt-1 text-muted">{d}</p>
            </div>
          ))}
        </div>
        <div className={`${card} mt-4`}>
          <div className={pill}>Impegni minimi indicativi · da concordare insieme</div>
          <div className="mt-3.5 grid gap-4 sm:grid-cols-2 md:grid-cols-4">
            {[['4', 'video al mese per i canali di agenteimmo.me'], ['2', 'post o storie a settimana sui tuoi canali'], ['1', 'evento, webinar o incontro con agenzie al mese']].map(([v, d]) => (
              <div key={d}><div className="my-1.5 font-display text-[26px] font-extrabold">{v}</div><span className="text-muted">{d}</span></div>
            ))}
            <div><div className="my-1.5 flex h-[39px] items-center"><Link2 size={24} /></div><span className="text-muted">link personale tracciato in tutte le attività</span></div>
          </div>
        </div>
      </Section>

      <Section id="offerta" n="03 · Cosa ti offriamo" title="Tre componenti, un unico obiettivo" sub="Denaro subito grazie alla revenue share, e patrimonio nel tempo grazie alle quote.">
        <div className="grid gap-4 md:grid-cols-3">
          <div className={dark}>
            <div className={`${pill} text-white/60`}>A · Revenue share</div><div className={big}>10%</div>
            <p className="text-white/60">dell&apos;incasso netto di ogni cliente che porti.</p>
            <Clean onDark items={[<><b>10%</b> per tutto il tempo in cui il cliente resta abbonato</>, 'Pagamento mensile con resoconto']} />
          </div>
          <div className={card}>
            <div className={pill}>B · Quota per il ruolo</div><div className={big}>2%</div>
            <p className="text-muted">di quote, per il lavoro da frontman.</p>
            <Clean items={[<>Maturano in <b>24 mesi</b></>, <>Nessuna quota prima dei <b>6 mesi</b> (cliff)</>, 'Legate agli impegni minimi']} />
          </div>
          <div className={card}>
            <div className={pill}>C · Quote a premio</div><div className={big}>fino a +8%</div>
            <p className="text-muted">al raggiungimento di obiettivi di clienti attivi.</p>
            <Clean items={[<>Contano solo gli abbonati <b>paganti</b></>, 'Una volta raggiunte, restano tue', <>Tetto complessivo: <b>10%</b></>]} />
          </div>
        </div>
        <div className={`${card} mt-4`}>
          <div className={pill}>Percorso delle quote · clienti attivi portati da te</div>
          <div className="mt-2.5 grid sm:grid-cols-2 md:grid-cols-4">
            {[['50', '3%', '+1%', 30], ['150', '5%', '+2%', 50], ['300', '7%', '+2%', 70], ['600', '10%', '+3%', 100]].map(([n, v, a, w], i) => (
              <div key={n} className={`px-[18px] py-5 ${i ? 'max-sm:border-t sm:border-l' : ''} border-line`}>
                <div className="text-[13px] text-muted">{n} clienti</div>
                <div className="font-display text-[32px] font-extrabold tracking-tight">{v}</div>
                <div className="text-muted">{a} a premio</div>
                <div className="mt-3.5 h-2 overflow-hidden rounded-full bg-line"><i className="block h-full bg-ink" style={{ width: `${w}%` }} /></div>
              </div>
            ))}
          </div>
          <p className="mt-3 text-[13px] text-muted">Le percentuali totali includono il 2% della quota base, una volta maturata.</p>
        </div>
      </Section>

      <Section id="valore" n="04 · Quanto vale" title="Il valore della proposta nel tempo"
        sub="La revenue share è denaro incassato ogni mese. Le quote sono patrimonio: valgono quanto vale la società e diventano denaro con una cessione, l'ingresso di investitori o la distribuzione di utili.">
        <div className="mb-5 inline-flex gap-1 rounded-full border border-line bg-white p-1" role="tablist">
          {TABS.map(([s, l]) => (
            <button key={s} type="button" role="tab" aria-selected={cur === s} onClick={() => setCur(s)}
              className={`rounded-full px-4 py-2 text-sm font-semibold transition-colors ${cur === s ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
          ))}
        </div>

        <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
          <div className={dark}><div className={`${pill} text-white/60`}>Valore totale a 5 anni</div><div className={big}>{k(L.total)}</div><div className="text-white/60">revenue share + quote</div></div>
          <div className={card}><div className={pill}>Revenue share incassata</div><div className={big}>{k(L.feeCum)}</div><div className="text-muted">a 3 anni: {k(y3.feeCum)}</div></div>
          <div className={card}><div className={pill}>Valore quote ({L.eq.toLocaleString('it-IT')}%)</div><div className={big}>{k(L.eqv)}</div><div className="text-muted">realizzabile: {k(L.eqv * (1 - DISC))}</div></div>
          <div className={card}><div className={pill}>Valutazione società</div><div className={big}>{k(L.val)}</div><div className="text-muted">ARR {k(L.arr)} · {L.mu.toFixed(1)}x</div></div>
        </div>

        <div className="mt-4 grid gap-4 lg:grid-cols-[2fr_1fr]">
          <div className={card}>
            <div className="mb-2.5 flex flex-wrap items-center justify-between gap-2">
              <b>Valore cumulato per anno</b>
              <div className="flex flex-wrap gap-4 text-[13px] text-muted">
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-[3px]" style={{ background: INK }} />Revenue share incassata</span>
                <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-[3px]" style={{ background: SOFT }} />Valore quote</span>
              </div>
            </div>
            <canvas ref={chart} className="block h-[300px] w-full" aria-label="Grafico del valore cumulato per anno" role="img" />
          </div>
          <div className={card}>
            <b>Modifica le ipotesi</b>
            <p className="mb-4 mt-1 text-[13px] text-muted">I numeri si aggiornano in tempo reale.</p>
            {sliders.map(s => (
              <label key={s.key} className="mb-3.5 block">
                <span className="mb-1 flex justify-between text-[13px] text-muted">{s.label} <b className="text-ink">{s.fmt(p[s.key])}</b></span>
                <input type="range" min={s.min} max={s.max} step={s.step} value={p[s.key]} onChange={set(s.key)} className="w-full accent-ink" />
              </label>
            ))}
            <button type="button" onClick={() => setP(DEFAULTS)} className={`${btnLight} px-3.5 py-1.5 text-[13px]`}>Ripristina</button>
          </div>
        </div>

        <div className={`${card} mt-4 overflow-x-auto`}>
          <b>Anno per anno</b>
          <table className="mt-2.5 w-full border-collapse text-sm">
            <thead>
              <tr>{['Anno', 'Clienti tuoi / totali', 'ARR società', 'Multiplo', 'Valutazione', 'Tue quote', 'Valore quote', 'Rev. share anno', 'Rev. share cumulata', 'Valore totale'].map((h, i) => (
                <th key={h} className={`whitespace-nowrap border-b border-line px-2.5 py-3 text-[11.5px] font-semibold uppercase tracking-[.7px] text-muted ${i ? 'text-right' : 'text-left'}`}>{h}</th>
              ))}</tr>
            </thead>
            <tbody>
              {rows.map(x => (
                <tr key={x.y} className={x.y === 5 ? 'font-bold' : ''}>
                  {[String(x.y), `${Math.round(x.his).toLocaleString('it-IT')} / ${Math.round(x.tot).toLocaleString('it-IT')}`, k(x.arr), `${x.mu.toFixed(1)}x`, k(x.val), `${x.eq.toLocaleString('it-IT')}%`, k(x.eqv), k(x.feeY), k(x.feeCum)].map((v, i) => (
                    <td key={i} className={`whitespace-nowrap border-b border-line px-2.5 py-3 ${i ? 'text-right' : 'text-left'}`}>{v}</td>
                  ))}
                  <td className="whitespace-nowrap border-b border-line px-2.5 py-3 text-right font-bold">{k(x.total)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div className={card}>
            <div className={pill}>Come valutiamo la società</div>
            <Clean items={[
              <><b>Multiplo dei ricavi annui da abbonamenti (ARR).</b> Sul mercato, i SaaS sotto 1 M€ di ARR si vendono a circa 1,5–3,5 volte; tra 1 e 5 M€, in crescita, a circa 3–6 volte.</>,
              <><b>Multipli prudenziali:</b> 2,5x sotto 250 k€ · 3x fino a 1 M€ · 4x fino a 3 M€ · 5x oltre.</>,
              <><b>Al netto della revenue share:</b> è un costo permanente, quindi un acquirente la sottrae. Lo stesso valore non viene contato due volte.</>,
            ]} />
          </div>
          <div className={card}>
            <div className={pill}>Da sapere</div>
            <Clean items={[
              <><b>Valore realizzabile:</b> una quota di minoranza in una SRL si vende di solito con uno sconto del 20–30%, perché non è liquida e non dà il controllo.</>,
              <><b>Diluizione:</b> l&apos;ingresso di investitori può ridurre la percentuale, ma di norma avviene a valutazioni più alte.</>,
              <>Le proiezioni sono <b>stime indicative</b>, non garanzie di risultato.</>,
            ]} />
          </div>
        </div>
      </Section>

      <Section id="tutele" n="05 · Regole e tutele" title="Chiare per entrambi" sub="Regole semplici, scritte prima, per evitare dubbi dopo.">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            ['Tracciamento', 'Un cliente è tuo se si registra con il tuo link o codice, o se lo segnali per iscritto prima della registrazione.'],
            ['Cliente attivo', 'Abbonato con almeno un pagamento andato a buon fine e abbonamento non disdetto alla data di verifica.'],
            ['Verifica trimestrale', 'Sui dati di fatturazione (Stripe), condivisi con te.'],
            ['Good / bad leaver', 'Se esci senza colpa tieni le quote maturate. In caso di gravi inadempienze o concorrenza, la società può riacquistarle a valore nominale.'],
            ['Cessione della società', "La revenue share si chiude con 12 mensilità dell'ultima fee. Le tue quote si vendono insieme a quelle degli altri soci, alle stesse condizioni."],
            ['Esclusiva e immagine', "Niente promozione di prodotti concorrenti durante l'accordo. Uso della tua immagine nei contenuti del brand."],
          ].map(([t, d]) => <div key={t} className={card}><b>{t}</b><p className="mt-1 text-muted">{d}</p></div>)}
        </div>
      </Section>

      <section id="passi" className="border-t border-line py-[70px]">
        <div className="mx-auto grid max-w-[1080px] items-start gap-4 px-6 md:grid-cols-2">
          <div>
            <div className="mb-2.5 text-xs font-semibold uppercase tracking-[1.2px] text-muted">06 · Struttura e prossimi passi</div>
            <h2 className="mb-2.5 font-display text-[clamp(28px,4vw,38px)] font-bold leading-[1.1] tracking-tight">Come lo formalizziamo</h2>
            <p className="mb-8 max-w-[680px] text-muted">La società è in fase di costituzione. L&apos;ingresso sarà formalizzato con il nostro commercialista o notaio tramite un patto parasociale, uno strumento per assegnare le quote nel tempo (aumento di capitale a tranche, opzione o work for equity) e un contratto separato per la revenue share.</p>
          </div>
          <ol>
            {['Incontro per discutere la proposta e raccogliere le tue osservazioni', 'Allineamento su impegni minimi e obiettivi', 'Redazione dei documenti con il professionista', 'Firma e costituzione della società con il tuo ingresso', 'Lancio: piano contenuti e attivazione del tuo link personale'].map((s, i) => (
              <li key={s} className="flex items-center gap-[18px] border-t border-line py-3.5">
                <span className="flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full border border-ink text-sm font-bold">{i + 1}</span>
                <span>{s}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <footer className="border-t border-line py-[60px]">
        <div className="mx-auto max-w-[1080px] px-6">
          <div className="flex flex-wrap items-center justify-between gap-6 rounded-[28px] bg-ink p-8 text-white sm:p-12">
            <div>
              <h2 className="mb-2.5 font-display text-[clamp(28px,4vw,38px)] font-bold leading-[1.1] tracking-tight">Costruiamolo insieme.</h2>
              <p className="m-0 text-white/70">Parliamone.</p>
            </div>
          </div>
          <p className="mt-6 text-[13px] text-muted">Proposta non vincolante. I termini definitivi saranno formalizzati in un patto parasociale. © agenteimmo.me</p>
        </div>
      </footer>
    </main>
  )
}
