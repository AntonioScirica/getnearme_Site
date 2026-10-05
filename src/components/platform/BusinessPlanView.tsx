'use client';

import type { ReactNode } from 'react';
import { Fragment, useEffect, useMemo, useRef, useState } from 'react';
import { BarChart3, ChevronDown, Database, Info, Loader2, Plus, Printer, RotateCcw, Save, Trash2, X } from 'lucide-react';
import { authFetch, CARD_SHADOW } from './api';
import { tr } from './i18n';
import {
  MONTHS, MESI_IT, PRESETS, SCENARIO_NAMES, clonePreset, monthLabel, run, aiCreditsPerCustomerMonth,
  type BPInputs, type BPResult, type ScenarioKey, type YearRow,
} from '@/lib/businessPlan';

// Business plan dinamico (solo admin, #/business-plan): si cambiano le ipotesi e numeri, tabelle e grafici
// si aggiornano subito. Il modello e' src/lib/businessPlan.ts (porting di projections.py). Tutto e' una STIMA.

type Scen = ScenarioKey | 'custom';
type Saved = { name: string; inputs: BPInputs; at: string };
type Actuals = {
  customers: number; byPlan: { starter: number; plus: number; pro: number }; mrr: number; mrrSource: 'stripe' | 'listino';
  ai30: { totalEur: number; payingEur: number; trialsEur: number; perCustomerEur: number | null };
  trials30: number; trialCostEur: number | null; usdEur: number; fetchedAt: string;
};

const COLORS: Record<ScenarioKey, string> = { prudente: '#9fb3e6', base: '#537eec', ambizioso: '#1f3f99' };
const BRAND = '#537eec';
const INK = '#1d1d1f';
const KEYS: ScenarioKey[] = ['prudente', 'base', 'ambizioso'];

// ------------------------------------------------------------------ formattazione
// useGrouping 'always': in italiano Intl non separa le migliaia sotto 10.000 (2085 invece di 2.085)
const nf = (d = 0) => new Intl.NumberFormat('it-IT', { maximumFractionDigits: d, minimumFractionDigits: d, useGrouping: 'always' } as Intl.NumberFormatOptions);
const int = (v: number) => nf().format(Math.round(v));
const eur = (v: number) => `${nf().format(Math.round(v))} €`;
const eur10 = (v: number) => `${nf().format(Math.round(v / 10) * 10)} €`;
const eur2 = (v: number) => `${nf(2).format(v)} €`;
const pct = (v: number, d = 0) => `${nf(d).format(v * 100)}%`;
const eurK = (v: number) => (Math.abs(v) >= 1000 ? `${nf(Math.abs(v) >= 10000 ? 0 : 1).format(v / 1000)}k €` : `${nf().format(v)} €`);
const fin = (v: number, f: (n: number) => string) => (Number.isFinite(v) ? f(v) : '∞');

// ------------------------------------------------------------------ persistenza
const storeKey = (u: string) => `agenteimmo:bp:${u}`;
const savedKey = (u: string) => `agenteimmo:bp-saved:${u}`;
function readJSON<T>(k: string, fallback: T): T {
  try { const s = localStorage.getItem(k); return s ? { ...fallback, ...JSON.parse(s) } : fallback; } catch { return fallback; }
}
function readList<T>(k: string): T[] {
  try { const s = localStorage.getItem(k); const v = s ? JSON.parse(s) : []; return Array.isArray(v) ? v : []; } catch { return []; }
}
// input salvati da versioni precedenti: si completano coi valori del preset base
const complete = (i: Partial<BPInputs>): BPInputs => ({ ...clonePreset('base'), ...i });

// noActuals: pagina con password del sito (/it/business-plan), niente dati reali dal database
export default function BusinessPlanView({ userKey, noActuals = false }: { userKey: string; noActuals?: boolean }) {
  const [state, setState] = useState(() => {
    const s = readJSON<{ scenario: Scen; inputs: BPInputs; compare: boolean }>(storeKey(userKey), { scenario: 'base', inputs: clonePreset('base'), compare: false });
    return { ...s, inputs: complete(s.inputs) };
  });
  const [saved, setSaved] = useState<Saved[]>(() => readList<Saved>(savedKey(userKey)));
  const { scenario, inputs, compare } = state;

  useEffect(() => { try { localStorage.setItem(storeKey(userKey), JSON.stringify(state)); } catch { /* storage pieno */ } }, [state, userKey]);
  useEffect(() => { try { localStorage.setItem(savedKey(userKey), JSON.stringify(saved)); } catch { /* storage pieno */ } }, [saved, userKey]);

  const set = <K extends keyof BPInputs>(k: K, v: BPInputs[K]) => setState(s => ({ ...s, scenario: 'custom', inputs: { ...s.inputs, [k]: v } }));
  const pickPreset = (k: ScenarioKey) => setState(s => ({ ...s, scenario: k, inputs: { ...clonePreset(k), startYear: s.inputs.startYear, startMonth: s.inputs.startMonth } }));
  const setStart = (startYear: number, startMonth: number) => setState(s => ({ ...s, inputs: { ...s.inputs, startYear, startMonth } }));
  const reset = () => setState(s => ({ ...s, scenario: s.scenario === 'custom' ? 'base' : s.scenario, inputs: clonePreset(s.scenario === 'custom' ? 'base' : s.scenario) }));

  const res = useMemo(() => run(inputs), [inputs]);
  const presetRes = useMemo(() => (compare ? Object.fromEntries(KEYS.map(k => [k, run({ ...PRESETS[k], startYear: inputs.startYear, startMonth: inputs.startMonth })])) as Record<ScenarioKey, BPResult> : null), [compare, inputs.startYear, inputs.startMonth]);

  // dati reali (sola lettura)
  const [actuals, setActuals] = useState<Actuals | null>(null);
  const [actErr, setActErr] = useState<string | null>(null);
  useEffect(() => {
    if (noActuals) return;
    let alive = true;
    authFetch('/api/platform/bp-actuals', { cache: 'no-store' })
      .then(async r => { if (!r.ok) throw new Error(r.status === 403 ? tr('Solo per admin.', 'Admins only.') : `${tr('Errore', 'Error')} ${r.status}`); return r.json(); })
      .then(d => { if (alive) setActuals(d); })
      .catch(e => { if (alive) setActErr((e as Error).message); });
    return () => { alive = false; };
  }, [noActuals]);
  const useActuals = () => {
    if (!actuals) return;
    setState(s => ({ ...s, scenario: 'custom', inputs: { ...s.inputs, startCustomers: actuals.customers, aiPerCustomerOverride: actuals.ai30.perCustomerEur != null && actuals.customers > 0 ? Math.round(actuals.ai30.perCustomerEur * 100) / 100 : s.inputs.aiPerCustomerOverride } }));
  };

  const lab = (t: number | null) => (t === null ? tr('oltre i 36 mesi', 'beyond 36 months') : monthLabel(inputs, t));
  const labels = useMemo(() => Array.from({ length: MONTHS }, (_, t) => monthLabel(inputs, t, true)), [inputs]);
  const scenName = scenario === 'custom' ? tr('Personalizzato', 'Custom') : SCENARIO_NAMES[scenario];

  return (
    <div className="bp-print">
      <style>{PRINT_CSS}</style>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{tr('Business plan', 'Business plan')}</h1>
          <p className="mt-1 text-sm text-muted">{tr(`Stime su 36 mesi, da ${monthLabel(inputs, 0)} a ${monthLabel(inputs, MONTHS - 1)}. Cambia le ipotesi e tutto si aggiorna.`, `36-month estimates, ${monthLabel(inputs, 0)} to ${monthLabel(inputs, MONTHS - 1)}. Change the assumptions and everything updates.`)}</p>
        </div>
        <div className="bp-noprint flex items-center gap-2">
          <button type="button" onClick={reset} className="flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium text-muted ring-1 ring-line ease-smooth transition-colors hover:bg-white hover:text-ink"><RotateCcw size={15} /> {tr('Reimposta', 'Reset')}</button>
          <button type="button" onClick={() => window.print()} className="flex h-10 items-center gap-2 rounded-full bg-ink px-4 text-sm font-medium text-white ease-smooth transition-opacity hover:opacity-90"><Printer size={15} /> {tr('Esporta', 'Export')}</button>
        </div>
      </div>

      {/* scenario, mese di partenza, scenari salvati */}
      <div className={`bp-noprint mt-6 flex flex-wrap items-center gap-3 rounded-[28px] bg-white p-3 ${CARD_SHADOW}`}>
        <div className="grid w-full grid-cols-2 rounded-[22px] bg-canvas p-1 sm:flex sm:w-auto sm:rounded-full" role="radiogroup" aria-label={tr('Scenario', 'Scenario')}>
          {([...KEYS, 'custom'] as Scen[]).map(k => (
            <button key={k} type="button" role="radio" aria-checked={scenario === k} onClick={() => k !== 'custom' && pickPreset(k)} disabled={k === 'custom' && scenario !== 'custom'}
              className={`h-9 rounded-full px-4 text-sm font-medium ease-smooth transition-colors ${scenario === k ? 'bg-white text-ink shadow-sm ring-1 ring-black/5' : 'text-muted hover:text-ink disabled:hover:text-muted'}`}>
              {k === 'custom' ? tr('Personalizzato', 'Custom') : SCENARIO_NAMES[k]}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-sm text-muted">
          {tr('Si parte da', 'Starts')}
          <select value={inputs.startMonth} onChange={e => setStart(inputs.startYear, Number(e.target.value))} className="h-9 rounded-full bg-canvas px-3 text-sm font-medium text-ink outline-none ring-1 ring-inset ring-black/5">
            {MESI_IT.map((m, k) => <option key={m} value={k}>{m}</option>)}
          </select>
          <select value={inputs.startYear} onChange={e => setStart(Number(e.target.value), inputs.startMonth)} className="h-9 rounded-full bg-canvas px-3 text-sm font-medium text-ink outline-none ring-1 ring-inset ring-black/5">
            {[2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </label>
        <span className="rounded-full bg-canvas px-3 py-2 text-sm text-muted">{tr('Orizzonte 36 mesi', '36-month horizon')}</span>
        <SaveScenario inputs={inputs} saved={saved} setSaved={setSaved} onLoad={i => setState(s => ({ ...s, scenario: 'custom', inputs: complete(i) }))} />
      </div>

      <div className="bp-grid mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
        {/* ipotesi: a sinistra e ferme su desktop, a fisarmonica sopra i risultati su mobile */}
        <aside className="bp-noprint space-y-3 lg:sticky lg:top-4 lg:max-h-[calc(100dvh-8rem)] lg:overflow-y-auto lg:pb-4 lg:pr-1 lg:[scrollbar-width:thin]">
          {!noActuals && <ActualsBox actuals={actuals} error={actErr} onUse={useActuals} inputs={inputs} />}
          <Inputs inputs={inputs} set={set} />
        </aside>

        <div className="min-w-0 space-y-6">
          <PrintSummary inputs={inputs} scenName={scenName} res={res} />
          <Kpis res={res} inputs={inputs} lab={lab} />
          <ChartCard title={tr('Clienti paganti nel tempo', 'Paying customers over time')} action={<CompareToggle on={compare} set={v => setState(s => ({ ...s, compare: v }))} />}>
            <LineChart labels={labels} fmt={int} series={[
              ...(presetRes ? KEYS.map(k => ({ key: k, label: SCENARIO_NAMES[k], values: presetRes[k].mesi.map(m => m.clienti), color: COLORS[k], dash: true, width: 1.6 })) : []),
              { key: 'cur', label: compare ? tr('Scenario scelto', 'Selected scenario') : scenName, values: res.mesi.map(m => m.clienti), color: BRAND, width: 2.6 },
            ]} />
          </ChartCard>
          <ChartCard title={tr('Ricavi e costi ogni mese', 'Monthly revenue and costs')}>
            <LineChart labels={labels} fmt={eurK} fillBetween series={[
              { key: 'ricavi', label: tr('Ricavi', 'Revenue'), values: res.mesi.map(m => m.ricavi), color: BRAND, width: 2.6 },
              { key: 'costi', label: tr('Costi totali', 'Total costs'), values: res.mesi.map(m => m.costi), color: INK, dash: true, width: 1.8 },
            ]} />
          </ChartCard>
          <ChartCard title={tr('Cassa cumulata', 'Cumulative cash')} sub={tr('Margine operativo sommato mese per mese, senza investimenti esterni.', 'Operating margin summed month by month, no outside funding.')} action={<CompareToggle on={compare} set={v => setState(s => ({ ...s, compare: v }))} />}>
            <LineChart labels={labels} fmt={eurK} series={[
              ...(presetRes ? KEYS.map(k => ({ key: k, label: SCENARIO_NAMES[k], values: presetRes[k].mesi.map(m => m.cumulato), color: COLORS[k], dash: true, width: 1.6 })) : []),
              { key: 'dopo', label: tr('Dopo i compensi', 'After founder pay'), values: res.mesi.map(m => m.cumulato_dopo_compenso), color: '#8e9099', dash: true, width: 1.8 },
              { key: 'cur', label: tr('Prima dei compensi', 'Before founder pay'), values: res.mesi.map(m => m.cumulato), color: BRAND, width: 2.6 },
            ]} />
          </ChartCard>
          <RevenueMix res={res} inputs={inputs} />
          <PnL res={res} inputs={inputs} />
          <Channels anni={res.anni} />
          <MonthlyTable res={res} />
          <p className="text-xs leading-relaxed text-muted">{tr('Tutti i numeri sono stime basate sulle ipotesi a sinistra, non risultati. Il margine operativo (EBITDA) comprende la pubblicità ed esclude compensi dei fondatori e imposte. I ricavi del Pro sono distribuiti per mese anche quando l\'incasso è annuale o trimestrale.', 'All figures are estimates based on the assumptions on the left, not results. Operating margin (EBITDA) includes advertising and excludes founder pay and taxes. Pro revenue is spread by month even when billed yearly or quarterly.')}</p>
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------ stampa A4: solo il piano, niente controlli
const PRINT_CSS = `
@media print {
  @page { size: A4; margin: 12mm; }
  html, body { background: #fff !important; }
  body * { visibility: hidden; }
  .bp-print, .bp-print * { visibility: visible; }
  .bp-print { position: absolute; left: 0; top: 0; width: 100%; font-size: 11px; }
  .bp-noprint { display: none !important; }
  .bp-printonly { display: block !important; }
  .bp-card { box-shadow: none !important; border: 1px solid #e3e5ec; break-inside: avoid; }
  .bp-print .bp-grid { display: block !important; }
  .bp-print .bp-grid > * + * { margin-top: 12px; }
  html, body, body > *, main, main * { overflow: visible !important; }
  main { height: auto !important; }
}`;

// ------------------------------------------------------------------ controlli
function Section({ title, sub, children, defaultOpen = false }: { title: string; sub?: string; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`rounded-[24px] bg-white ${CARD_SHADOW}`}>
      <button type="button" aria-expanded={open} onClick={() => setOpen(o => !o)} className="flex w-full items-center justify-between gap-3 px-5 py-4 text-left">
        <span><span className="block font-semibold">{title}</span>{sub && <span className="block text-xs text-muted">{sub}</span>}</span>
        <ChevronDown size={18} className={`shrink-0 text-muted ease-smooth transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`grid ease-smooth transition-[grid-template-rows] ${open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="min-h-0 overflow-hidden" inert={!open}><div className="space-y-4 px-5 pb-5">{children}</div></div>
      </div>
    </div>
  );
}

function Help({ text }: { text: string }) {
  return (
    <span className="group relative inline-flex align-middle">
      <button type="button" aria-label={text} className="flex h-5 w-5 items-center justify-center rounded-full text-muted hover:text-ink focus-series:text-ink"><Info size={13} /></button>
      <span role="tooltip" className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 w-56 -translate-x-1/2 rounded-2xl bg-ink px-3 py-2 text-xs font-normal leading-snug text-white opacity-0 shadow-lg ease-smooth transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">{text}</span>
    </span>
  );
}

type NumProps = { label: string; help?: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number; unit?: string; scale?: number; slider?: boolean };
function Num({ label, help, value, onChange, min, max, step, unit, scale = 1, slider = true }: NumProps) {
  const shown = Math.round(value * scale * 1e6) / 1e6;
  const [draft, setDraft] = useState<string | null>(null);
  const commit = (s: string) => { const n = Number(s.replace(',', '.')); if (s.trim() !== '' && Number.isFinite(n)) onChange(Math.max(min, n) / scale); };
  return (
    <div>
      <div className="flex items-center justify-between gap-2">
        <span className="flex min-w-0 items-center gap-0.5 text-sm">{label}{help && <Help text={help} />}</span>
        <span className="flex shrink-0 items-center gap-1 rounded-full bg-canvas px-2.5 ring-1 ring-inset ring-black/5 focus-within:ring-brand">
          <input inputMode="decimal" aria-label={label} value={draft ?? String(shown).replace('.', ',')} onFocus={() => setDraft(String(shown).replace('.', ','))}
            onChange={e => { setDraft(e.target.value); commit(e.target.value); }} onBlur={() => setDraft(null)}
            className="h-8 w-16 bg-transparent text-right text-sm font-medium tabular-nums outline-none" />
          {unit && <span className="text-xs text-muted">{unit}</span>}
        </span>
      </div>
      {slider && <input type="range" min={min} max={max} step={step} value={Math.min(max, Math.max(min, shown))} aria-label={label} onChange={e => onChange(Number(e.target.value) / scale)} className="mt-1.5 w-full accent-[#537eec]" />}
    </div>
  );
}

function Toggle({ label, help, on, set }: { label: string; help?: string; on: boolean; set: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="flex items-center gap-0.5 text-sm font-medium">{label}{help && <Help text={help} />}</span>
      <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => set(!on)} className={`relative h-6 w-10 shrink-0 rounded-full ease-smooth transition-colors ${on ? 'bg-brand' : 'bg-line'}`}>
        <span className={`absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-sm ease-smooth transition-transform ${on ? 'translate-x-4' : ''}`} />
      </button>
    </div>
  );
}

function MonthPick({ label, help, value, onChange, inputs }: { label: string; help?: string; value: number; onChange: (v: number) => void; inputs: BPInputs }) {
  return (
    <label className="flex items-center justify-between gap-2 text-sm">
      <span className="flex items-center gap-0.5">{label}{help && <Help text={help} />}</span>
      <select value={value} onChange={e => onChange(Number(e.target.value))} className="h-8 rounded-full bg-canvas px-3 text-sm font-medium outline-none ring-1 ring-inset ring-black/5">
        {Array.from({ length: MONTHS }, (_, t) => <option key={t} value={t}>{monthLabel(inputs, t)}</option>)}
      </select>
    </label>
  );
}

const Group = ({ children }: { children: ReactNode }) => <div className="space-y-4 rounded-[18px] bg-canvas/70 p-3 ring-1 ring-inset ring-black/5">{children}</div>;

function Inputs({ inputs: i, set }: { inputs: BPInputs; set: <K extends keyof BPInputs>(k: K, v: BPInputs[K]) => void }) {
  const mixSum = i.mixStarter + i.mixPlus + i.mixPro;
  const steps = [...i.ads].sort((a, b) => a.from - b.from);
  const setStep = (k: number, p: Partial<{ from: number; budget: number }>) => set('ads', steps.map((s, j) => (j === k ? { ...s, ...p } : s)));
  return (
    <>
      <Section title={tr('Marketing a pagamento', 'Paid marketing')} sub={tr('Pubblicità su Meta e Google', 'Meta and Google ads')} defaultOpen>
        <Toggle label={tr('Pubblicità attiva', 'Ads on')} on={i.adsOn} set={v => set('adsOn', v)} help={tr('Spenta: nessuna spesa e nessun cliente dalla pubblicità.', 'Off: no ad spend and no customers from ads.')} />
        <div className={i.adsOn ? '' : 'pointer-events-none opacity-40'}>
          <Num label={tr('Costo per cliente (CAC)', 'Cost per customer (CAC)')} help={tr('Quanto spendi in pubblicità, in media, per avere un cliente pagante. Budget diviso CAC = nuovi clienti al mese.', 'Average ad spend to win one paying customer. Budget divided by CAC = new customers per month.')} value={i.cac} onChange={v => set('cac', Math.max(1, v))} min={10} max={400} step={5} unit="€" />
          <p className="mt-4 text-sm font-medium">{tr('Budget mensile per periodo', 'Monthly budget by period')}</p>
          <div className="mt-2 space-y-2">
            {steps.map((s, k) => (
              <div key={k} className="flex items-center gap-2 text-sm">
                <span className="text-muted">{tr('dal', 'from')}</span>
                <select value={s.from} onChange={e => setStep(k, { from: Number(e.target.value) })} aria-label={tr('Mese di inizio', 'Start month')} className="h-8 min-w-0 flex-1 rounded-full bg-canvas px-2 text-sm font-medium outline-none ring-1 ring-inset ring-black/5">
                  {Array.from({ length: MONTHS }, (_, t) => <option key={t} value={t}>{monthLabel(i, t)}</option>)}
                </select>
                <span className="flex items-center gap-1 rounded-full bg-canvas px-2.5 ring-1 ring-inset ring-black/5">
                  <input inputMode="numeric" aria-label={tr('Budget mensile', 'Monthly budget')} value={s.budget} onChange={e => { const n = Number(e.target.value); if (Number.isFinite(n)) setStep(k, { budget: Math.max(0, n) }); }} className="h-8 w-14 bg-transparent text-right font-medium tabular-nums outline-none" />
                  <span className="text-xs text-muted">€</span>
                </span>
                <button type="button" aria-label={tr('Togli periodo', 'Remove period')} onClick={() => set('ads', steps.filter((_, j) => j !== k))} className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted hover:bg-canvas hover:text-ink"><X size={14} /></button>
              </div>
            ))}
            <button type="button" onClick={() => set('ads', [...steps, { from: Math.min(MONTHS - 1, (steps.at(-1)?.from ?? 0) + 6), budget: steps.at(-1)?.budget ?? 500 }])} className="flex h-8 items-center gap-1.5 rounded-full px-3 text-sm font-medium text-brand hover:bg-canvas"><Plus size={14} /> {tr('Aggiungi periodo', 'Add period')}</button>
          </div>
        </div>
      </Section>

      <Section title={tr('Crescita organica', 'Organic growth')} sub={tr('SEO, social, prova gratis, passaparola, socio', 'SEO, social, free trial, referrals, partner')}>
        <Num label={tr('Nuovi clienti al mese, all\'inizio', 'New customers per month, at start')} help={tr('Clienti da SEO, social e prova gratis nel primo mese. Crescono in linea retta fino al valore del mese 36.', 'Customers from SEO, social and free trial in month 1. They grow linearly to the month 36 value.')} value={i.organicStart} onChange={v => set('organicStart', v)} min={0} max={50} step={1} />
        <Num label={tr('Nuovi clienti al mese, al mese 36', 'New customers per month, month 36')} value={i.organicEnd} onChange={v => set('organicEnd', v)} min={0} max={150} step={1} />
        <Num label={tr('Passaparola (affiliati)', 'Referrals (affiliates)')} help={tr('Ogni mese questa quota dei clienti attivi porta un nuovo cliente col proprio codice.', 'Each month this share of active customers brings one new customer with their code.')} value={i.referral} onChange={v => set('referral', v)} min={0} max={5} step={0.1} scale={100} unit="%" />
        <Group>
          <Toggle label={tr('Rete del socio', 'Partner network')} on={i.partnerOn} set={v => set('partnerOn', v)} help={tr('Colleghi e agenzie portati dal socio, con una crescita lineare tra i due valori.', 'Colleagues and agencies brought by the partner, growing linearly between the two values.')} />
          {i.partnerOn && <>
            <MonthPick label={tr('Da', 'From')} value={i.partnerFrom} onChange={v => set('partnerFrom', v)} inputs={i} />
            <Num label={tr('Clienti al mese all\'inizio', 'Customers per month at start')} value={i.partnerStart} onChange={v => set('partnerStart', v)} min={0} max={40} step={1} />
            <Num label={tr('Clienti al mese al mese 36', 'Customers per month at month 36')} value={i.partnerEnd} onChange={v => set('partnerEnd', v)} min={0} max={80} step={1} />
          </>}
        </Group>
        <Group>
          <Toggle label={tr('Accordi con reti e franchising', 'Network and franchise deals')} on={i.dealsOn} set={v => set('dealsOn', v)} help={tr('Ogni accordo porta un gruppo di agenti in un mese solo.', 'Each deal brings a group of agents in a single month.')} />
          {i.dealsOn && <>
            <MonthPick label={tr('Primo accordo', 'First deal')} value={i.dealsFrom} onChange={v => set('dealsFrom', v)} inputs={i} />
            <Num label={tr('Un accordo ogni', 'One deal every')} value={i.dealsEvery} onChange={v => set('dealsEvery', Math.max(1, Math.round(v)))} min={1} max={12} step={1} unit={tr('mesi', 'months')} />
            <Num label={tr('Agenti per accordo', 'Agents per deal')} value={i.dealsSeats} onChange={v => set('dealsSeats', v)} min={0} max={100} step={5} />
          </>}
        </Group>
        <Num label={tr('Clienti già paganti al via', 'Paying customers at start')} help={tr('Il piano originale parte da zero per prudenza. Con i dati reali puoi partire dai clienti di oggi.', 'The original plan starts from zero. With real data you can start from today\'s customers.')} value={i.startCustomers} onChange={v => set('startCustomers', Math.round(v))} min={0} max={500} step={1} />
      </Section>

      <Section title={tr('Abbandoni', 'Churn')} sub={tr('Clienti che disdicono ogni mese', 'Customers cancelling each month')}>
        <Num label={tr('Abbandono mensile', 'Monthly churn')} help={tr('Quota dei clienti attivi che disdice ogni mese. 4,5% vuol dire che un cliente resta in media circa 22 mesi.', 'Share of active customers cancelling each month. 4.5% means a customer stays about 22 months on average.')} value={i.churn} onChange={v => set('churn', v)} min={0.5} max={15} step={0.1} scale={100} unit="%" />
      </Section>

      <Section title={tr('Prezzi e mix dei piani', 'Prices and plan mix')} sub={tr('Abbonamenti e pacchetti di crediti', 'Subscriptions and credit packs')}>
        <Num label="Starter" value={i.priceStarter} onChange={v => set('priceStarter', v)} min={0} max={99} step={1} unit={tr('€/mese', '€/mo')} />
        <Num label="Plus" value={i.pricePlus} onChange={v => set('pricePlus', v)} min={0} max={149} step={1} unit={tr('€/mese', '€/mo')} />
        <Num label={tr('Pro annuale', 'Pro yearly')} help={tr('Prezzo al mese del Pro pagato una volta l\'anno.', 'Monthly price of Pro billed yearly.')} value={i.priceProAnnual} onChange={v => set('priceProAnnual', v)} min={0} max={199} step={1} unit={tr('€/mese', '€/mo')} />
        <Num label={tr('Pro trimestrale', 'Pro quarterly')} value={i.priceProQuarterly} onChange={v => set('priceProQuarterly', v)} min={0} max={199} step={1} unit={tr('€/mese', '€/mo')} />
        <Num label={tr('Pro con pagamento annuale', 'Pro billed yearly')} value={i.proAnnualShare} onChange={v => set('proAnnualShare', v)} min={0} max={100} step={5} scale={100} unit="%" />
        <Group>
          <p className="flex items-center gap-0.5 text-sm font-medium">{tr('Mix dei clienti', 'Customer mix')}<Help text={tr('Quota dei clienti su ogni piano. Se la somma non fa 100% viene riportata a 100% in proporzione.', 'Share of customers on each plan. If it does not sum to 100% it is rescaled.')} /></p>
          <Num label="Starter" value={i.mixStarter} onChange={v => set('mixStarter', v)} min={0} max={100} step={1} scale={100} unit="%" />
          <Num label="Plus" value={i.mixPlus} onChange={v => set('mixPlus', v)} min={0} max={100} step={1} scale={100} unit="%" />
          <Num label="Pro" value={i.mixPro} onChange={v => set('mixPro', v)} min={0} max={100} step={1} scale={100} unit="%" />
          <p className={`text-xs ${Math.abs(mixSum - 1) > 0.005 ? 'text-amber-700' : 'text-muted'}`}>{tr('Somma', 'Sum')} {pct(mixSum)}{Math.abs(mixSum - 1) > 0.005 ? tr(', riportata a 100%', ', rescaled to 100%') : ''}</p>
        </Group>
        <Group>
          <p className="text-sm font-medium">{tr('Pacchetti di crediti', 'Credit packs')}</p>
          <Num label={tr('Clienti che ne comprano uno al mese', 'Customers buying one per month')} value={i.packBuyers} onChange={v => set('packBuyers', v)} min={0} max={40} step={1} scale={100} unit="%" />
          <Num label={tr('Prezzo medio', 'Average price')} value={i.packPrice} onChange={v => set('packPrice', v)} min={0} max={99} step={1} unit="€" />
          <Num label={tr('Crediti per pacchetto', 'Credits per pack')} value={i.packCredits} onChange={v => set('packCredits', v)} min={0} max={3000} step={100} />
        </Group>
      </Section>

      <Section title={tr('Costi', 'Costs')} sub={tr('AI, pagamenti, fissi, socio, fondatori, imposte', 'AI, payments, fixed, partner, founders, taxes')}>
        <Group>
          <p className="text-sm font-medium">{tr('Costi AI', 'AI costs')}</p>
          <Num label={tr('Costo per credito', 'Cost per credit')} help={tr('Costo medio dei fornitori AI per un credito usato. 0,0083 € = caso peggiore del Plus, 12,5 € per 1.500 crediti.', 'Average AI provider cost per credit used. €0.0083 = worst Plus case, €12.50 per 1,500 credits.')} value={i.aiCostPerCredit} onChange={v => set('aiCostPerCredit', v)} min={0.001} max={0.03} step={0.0005} unit="€" slider />
          <Num label={tr('Crediti del piano usati', 'Plan credits used')} help={tr('Quota media dei crediti inclusi che i clienti usano davvero.', 'Average share of included credits that customers actually use.')} value={i.creditUsage} onChange={v => set('creditUsage', v)} min={0} max={100} step={5} scale={100} unit="%" />
          <Toggle label={tr('Usa un costo per cliente misurato', 'Use a measured cost per customer')} on={i.aiPerCustomerOverride !== null} set={v => set('aiPerCustomerOverride', v ? Math.round(aiCreditsPerCustomerMonth(i) * 100) / 100 : null)} help={tr('Al posto del calcolo dai crediti, un costo AI fisso per cliente al mese (per esempio quello dei dati reali).', 'Instead of the credit-based estimate, a fixed AI cost per customer per month (e.g. from real data).')} />
          {i.aiPerCustomerOverride !== null
            ? <Num label={tr('Costo AI per cliente', 'AI cost per customer')} value={i.aiPerCustomerOverride} onChange={v => set('aiPerCustomerOverride', v)} min={0} max={30} step={0.1} unit={tr('€/mese', '€/mo')} />
            : <p className="text-xs text-muted">{tr('Calcolato:', 'Computed:')} {eur2(aiCreditsPerCustomerMonth(i))} {tr('per cliente al mese', 'per customer per month')}</p>}
          <Num label={tr('Prove gratis per un cliente', 'Free trials per customer')} help={tr('1 su 10 vuol dire 10 prove gratis per ogni nuovo cliente pagante. Ogni prova costa AI.', '1 in 10 means 10 free trials per new paying customer. Each trial costs AI.')} value={i.trialConversion > 0 ? 1 / i.trialConversion : 0} onChange={v => set('trialConversion', v > 0 ? 1 / v : 0)} min={1} max={40} step={1} />
          <Num label={tr('Costo AI di una prova', 'AI cost of a trial')} value={i.trialCost} onChange={v => set('trialCost', v)} min={0} max={5} step={0.05} unit="€" />
        </Group>
        <Group>
          <p className="text-sm font-medium">{tr('Commissioni Stripe', 'Stripe fees')}</p>
          <Num label={tr('Percentuale', 'Percent')} value={i.stripePct} onChange={v => set('stripePct', v)} min={0} max={5} step={0.1} scale={100} unit="%" />
          <Num label={tr('Fisso per pagamento', 'Fixed per payment')} value={i.stripeFix} onChange={v => set('stripeFix', v)} min={0} max={1} step={0.05} unit="€" />
        </Group>
        <Group>
          <p className="flex items-center gap-0.5 text-sm font-medium">{tr('Infrastruttura e servizi', 'Infrastructure and services')}<Help text={tr('Supabase, Vercel, Cloudflare R2, Resend, domini e strumenti, al mese.', 'Supabase, Vercel, Cloudflare R2, Resend, domains and tools, per month.')} /></p>
          {([0, 1, 2] as const).map(y => <Num key={y} label={tr(`Anno ${y + 1}`, `Year ${y + 1}`)} value={i.infra[y]} onChange={v => { const n = [...i.infra] as BPInputs['infra']; n[y] = v; set('infra', n); }} min={0} max={5000} step={50} unit={tr('€/mese', '€/mo')} />)}
        </Group>
        <Group>
          <p className="flex items-center gap-0.5 text-sm font-medium">{tr('SRL e commercialista', 'Company and accountant')}<Help text={tr('Stima da verificare col commercialista.', 'Estimate to check with the accountant.')} /></p>
          <Num label={tr('Costituzione, una tantum', 'Setup, one-off')} value={i.srlSetup} onChange={v => set('srlSetup', v)} min={0} max={6000} step={100} unit="€" />
          <MonthPick label={tr('Mese della costituzione', 'Setup month')} value={i.srlSetupMonth} onChange={v => set('srlSetupMonth', v)} inputs={i} />
          <Num label={tr('Commercialista e adempimenti', 'Accountant and filings')} value={i.srlMonthly} onChange={v => set('srlMonthly', v)} min={0} max={1000} step={10} unit={tr('€/mese', '€/mo')} />
          <MonthPick label={tr('Da', 'From')} value={i.srlFrom} onChange={v => set('srlFrom', v)} inputs={i} />
        </Group>
        <Group>
          <Num label={tr('Eventi e materiali col socio', 'Events and materials with partner')} value={i.events} onChange={v => set('events', v)} min={0} max={2000} step={50} unit={tr('€/mese', '€/mo')} />
          <MonthPick label={tr('Da', 'From')} value={i.eventsFrom} onChange={v => set('eventsFrom', v)} inputs={i} />
        </Group>
        <Group>
          <p className="flex items-center gap-0.5 text-sm font-medium">{tr('Compenso dei fondatori', 'Founder pay')}<Help text={tr('Illustrativo: ogni fondatore inizia a prendere il compenso quando il margine mensile resta stabilmente sopra la sua soglia.', 'Illustrative: each founder starts being paid once monthly margin stays above their threshold for good.')} /></p>
          <Num label={tr('Per fondatore, lordo', 'Per founder, gross')} value={i.founderPay} onChange={v => set('founderPay', v)} min={0} max={8000} step={100} unit={tr('€/mese', '€/mo')} />
          <Num label={tr('Soglia primo fondatore', 'First founder threshold')} value={i.founderThresholds[0]} onChange={v => set('founderThresholds', [v, i.founderThresholds[1]])} min={0} max={20000} step={500} unit={tr('€/mese', '€/mo')} />
          <Num label={tr('Soglia secondo fondatore', 'Second founder threshold')} value={i.founderThresholds[1]} onChange={v => set('founderThresholds', [i.founderThresholds[0], v])} min={0} max={30000} step={500} unit={tr('€/mese', '€/mo')} />
        </Group>
        <Group>
          <Toggle label={tr('Stima imposte SRL', 'Estimate company taxes')} on={i.taxesOn} set={v => set('taxesOn', v)} help={tr('Stima grezza: IRES e IRAP sull\'utile annuo positivo dopo i compensi. Le imposte vere si calcolano col commercialista.', 'Rough estimate: IRES and IRAP on positive yearly profit after founder pay. Real taxes are computed with the accountant.')} />
          {i.taxesOn && <>
            <Num label="IRES" value={i.ires} onChange={v => set('ires', v)} min={0} max={40} step={0.5} scale={100} unit="%" />
            <Num label="IRAP" value={i.irap} onChange={v => set('irap', v)} min={0} max={10} step={0.1} scale={100} unit="%" />
          </>}
        </Group>
      </Section>
    </>
  );
}

// ------------------------------------------------------------------ dati reali
function ActualsBox({ actuals: a, error, onUse, inputs }: { actuals: Actuals | null; error: string | null; onUse: () => void; inputs: BPInputs }) {
  const applied = !!a && inputs.startCustomers === a.customers && (a.ai30.perCustomerEur == null || a.customers === 0 || inputs.aiPerCustomerOverride === Math.round(a.ai30.perCustomerEur * 100) / 100);
  return (
    <div className={`rounded-[24px] bg-white p-5 ${CARD_SHADOW}`}>
      <p className="flex items-center gap-2 font-semibold"><Database size={16} className="text-muted" /> {tr('Dati reali', 'Real data')}</p>
      {!a ? (error ? <p className="mt-2 text-sm text-red-600">{error}</p> : <Loader2 size={16} className="mt-3 animate-spin text-muted" />) : (
        <>
          <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
            <dt className="text-muted">{tr('Clienti paganti', 'Paying customers')}</dt><dd className="text-right font-semibold tabular-nums">{a.customers}</dd>
            <dt className="text-muted">Starter / Plus / Pro</dt><dd className="text-right tabular-nums">{a.byPlan.starter} / {a.byPlan.plus} / {a.byPlan.pro}</dd>
            <dt className="text-muted">MRR</dt><dd className="text-right font-semibold tabular-nums">{eur(a.mrr)}</dd>
            <dt className="text-muted">{tr('Costo AI, 30 giorni', 'AI cost, 30 days')}</dt><dd className="text-right tabular-nums">{eur(a.ai30.totalEur)}</dd>
            <dt className="text-muted">{tr('per cliente pagante', 'per paying customer')}</dt><dd className="text-right tabular-nums">{a.ai30.perCustomerEur != null ? eur2(a.ai30.perCustomerEur) : 'n.d.'}</dd>
            <dt className="text-muted">{tr('Prove gratis, 30 giorni', 'Free trials, 30 days')}</dt><dd className="text-right tabular-nums">{a.trials30}{a.trialCostEur != null ? ` · ${eur2(a.trialCostEur)}` : ''}</dd>
          </dl>
          <p className="mt-3 text-xs leading-snug text-muted">{tr(`MRR ${a.mrrSource === 'stripe' ? 'dagli abbonamenti Stripe attivi' : 'stimato dai prezzi di listino'}. Costi AI in dollari convertiti a ${nf(2).format(a.usdEur)} € per dollaro. Esclusi admin e account di prova.`, `MRR ${a.mrrSource === 'stripe' ? 'from active Stripe subscriptions' : 'estimated from list prices'}. AI costs in dollars converted at €${nf(2).format(a.usdEur)} per dollar. Admins and test accounts excluded.`)}</p>
          <button type="button" onClick={onUse} disabled={applied} className="mt-4 flex h-10 w-full items-center justify-center rounded-full bg-ink px-4 text-sm font-medium text-white ease-smooth transition-opacity hover:opacity-90 disabled:opacity-40">
            {applied ? tr('Dati reali in uso', 'Using real data') : tr('Usa i dati reali come punto di partenza', 'Use real data as the starting point')}
          </button>
        </>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ scenari salvati
function SaveScenario({ inputs, saved, setSaved, onLoad }: { inputs: BPInputs; saved: Saved[]; setSaved: (f: (s: Saved[]) => Saved[]) => void; onLoad: (i: BPInputs) => void }) {
  const [naming, setNaming] = useState(false);
  const [name, setName] = useState('');
  const save = () => {
    const n = name.trim();
    if (!n) return;
    setSaved(s => [...s.filter(x => x.name !== n), { name: n, inputs, at: new Date().toISOString() }]);
    setName(''); setNaming(false);
  };
  return (
    <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
      {saved.map(s => (
        <span key={s.name} className="flex h-9 items-center rounded-full bg-canvas pl-3 text-sm ring-1 ring-inset ring-black/5">
          <button type="button" onClick={() => onLoad(s.inputs)} className="max-w-36 truncate font-medium hover:text-brand" title={tr('Carica', 'Load')}>{s.name}</button>
          <button type="button" aria-label={tr(`Elimina ${s.name}`, `Delete ${s.name}`)} onClick={() => setSaved(x => x.filter(y => y.name !== s.name))} className="flex h-9 w-8 items-center justify-center text-muted hover:text-ink"><Trash2 size={13} /></button>
        </span>
      ))}
      {naming ? (
        <form onSubmit={e => { e.preventDefault(); save(); }} className="flex items-center gap-1 rounded-full bg-canvas p-1 ring-1 ring-inset ring-black/5">
          <input autoFocus value={name} onChange={e => setName(e.target.value)} placeholder={tr('Nome dello scenario', 'Scenario name')} maxLength={40} className="h-7 w-40 bg-transparent px-2 text-sm outline-none" />
          <button type="submit" className="h-7 rounded-full bg-ink px-3 text-xs font-medium text-white">{tr('Salva', 'Save')}</button>
          <button type="button" aria-label={tr('Annulla', 'Cancel')} onClick={() => setNaming(false)} className="flex h-7 w-7 items-center justify-center text-muted"><X size={14} /></button>
        </form>
      ) : (
        <button type="button" onClick={() => setNaming(true)} className="flex h-9 items-center gap-2 rounded-full px-4 text-sm font-medium ring-1 ring-line ease-smooth transition-colors hover:bg-canvas"><Save size={15} /> {tr('Salva scenario', 'Save scenario')}</button>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ risultati
function Kpi({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: ReactNode; tone?: 'bad' | 'good' }) {
  return (
    <div className={`bp-card flex min-w-0 flex-col rounded-[24px] bg-white p-4 ${CARD_SHADOW}`}>
      <span className="text-xs leading-snug text-muted">{label}</span>
      <span className={`mt-1.5 font-display text-xl font-semibold tabular-nums tracking-tight sm:text-2xl ${tone === 'bad' ? 'text-red-600' : tone === 'good' ? 'text-emerald-700' : ''}`}>{value}</span>
      {sub && <span className="mt-1 text-xs leading-snug text-muted">{sub}</span>}
    </div>
  );
}

function Kpis({ res, inputs, lab }: { res: BPResult; inputs: BPInputs; lab: (t: number | null) => string }) {
  const [a1, a2, a3] = res.anni;
  const last = res.mesi[MONTHS - 1];
  const u = res.unit;
  const tg = res.traguardi;
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4 print:grid-cols-4">
      <Kpi label={tr('Clienti paganti a fine anno 1 / 2 / 3', 'Paying customers end of year 1 / 2 / 3')} value={`${int(a3.clienti_fine)}`} sub={`${int(a1.clienti_fine)} · ${int(a2.clienti_fine)} · ${int(a3.clienti_fine)}`} />
      <Kpi label={tr(`MRR a ${monthLabel(inputs, MONTHS - 1)}`, `MRR at ${monthLabel(inputs, MONTHS - 1)}`)} value={eur(last.mrr)} sub={tr(`${eur(last.ricavi)} al mese coi pacchetti`, `${eur(last.ricavi)} per month with packs`)} />
      <Kpi label={tr('Ricavi anno 1 / 2 / 3', 'Revenue year 1 / 2 / 3')} value={eurK(a3.ricavi)} sub={`${eurK(a1.ricavi)} · ${eurK(a2.ricavi)} · ${eurK(a3.ricavi)}`} />
      <Kpi label={tr('EBITDA anno 3', 'EBITDA year 3')} value={eurK(a3.risultato)} tone={a3.risultato < 0 ? 'bad' : undefined} sub={tr(`${pct(a3.margine_pct)} dei ricavi, prima delle imposte`, `${pct(a3.margine_pct)} of revenue, before taxes`)} />
      <Kpi label={tr('I ricavi coprono i costi ogni mese da', 'Revenue covers costs every month from')} value={lab(tg.pareggio_mensile)} sub={tr(`cassa positiva da ${lab(tg.pareggio_cumulato)}`, `cash positive from ${lab(tg.pareggio_cumulato)}`)} />
      <Kpi label={tr('Punto più basso della cassa', 'Lowest cash point')} value={eur(Math.min(0, tg.cassa_minima))} tone={tg.cassa_minima < 0 ? 'bad' : 'good'} sub={tg.cassa_minima < 0 ? tr(`a ${monthLabel(inputs, tg.cassa_minima_mese)}, da anticipare`, `at ${monthLabel(inputs, tg.cassa_minima_mese)}, to be fronted`) : tr('la cassa non va mai sotto zero', 'cash never goes below zero')} />
      <Kpi label={tr('Valore di un cliente (LTV) / CAC', 'Customer value (LTV) / CAC')} value={`${fin(u.ltv_cac, v => nf(1).format(v))}×`} tone={u.ltv_cac < 3 ? 'bad' : undefined} sub={tr(`LTV ${fin(u.ltv, eur)} · CAC ${eur(u.cac)} · rientro in ${fin(u.payback_mesi, v => nf(1).format(v))} mesi`, `LTV ${fin(u.ltv, eur)} · CAC ${eur(u.cac)} · payback ${fin(u.payback_mesi, v => nf(1).format(v))} months`)} />
      <Kpi label={tr('Primo compenso a un fondatore', 'First founder pay')} value={lab(tg.compenso_1)} sub={tr(`secondo fondatore: ${lab(tg.compenso_2)}`, `second founder: ${lab(tg.compenso_2)}`)} />
    </div>
  );
}

function ChartCard({ title, sub, action, children }: { title: string; sub?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className={`bp-card rounded-[28px] bg-white p-5 sm:p-6 ${CARD_SHADOW}`}>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div><h2 className="font-display text-lg font-semibold">{title}</h2>{sub && <p className="text-xs text-muted">{sub}</p>}</div>
        {action && <div className="bp-noprint">{action}</div>}
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function CompareToggle({ on, set }: { on: boolean; set: (v: boolean) => void }) {
  return (
    <button type="button" aria-pressed={on} onClick={() => set(!on)} className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-medium ease-smooth transition-colors ${on ? 'bg-ink text-white' : 'text-muted ring-1 ring-line hover:text-ink'}`}>
      <BarChart3 size={13} /> {tr('Confronta scenari', 'Compare scenarios')}
    </button>
  );
}

// ------------------------------------------------------------------ grafico a linee (SVG, scala 1 unità = 1 px)
type Series = { key: string; label: string; values: number[]; color: string; dash?: boolean; width?: number };

function niceStep(v: number) {
  const e = 10 ** Math.floor(Math.log10(Math.max(v, 1e-9)));
  for (const m of [1, 2, 2.5, 5, 10]) if (v <= m * e) return m * e;
  return 10 * e;
}

function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [w, setW] = useState(640);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, w] as const;
}

function LineChart({ series, labels, fmt, fillBetween }: { series: Series[]; labels: string[]; fmt: (v: number) => string; fillBetween?: boolean }) {
  const [ref, W] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const H = W < 480 ? 220 : 260;
  const pl = W < 480 ? 46 : 58, pr = 12, pt = 10, pb = 26;
  const iw = W - pl - pr, ih = H - pt - pb;
  const all = series.flatMap(s => s.values);
  let lo = Math.min(0, ...all);
  const hiRaw = Math.max(1, ...all);
  if (lo < 0 && -lo < 0.04 * hiRaw) lo = 0;
  const step = niceStep((hiRaw - lo) / 4);
  const ylo = step * Math.floor(lo / step), yhi = step * Math.ceil(hiRaw / step);
  const X = (t: number) => pl + iw * t / (labels.length - 1);
  const Y = (v: number) => pt + ih - ih * (v - ylo) / (yhi - ylo || 1);
  const ticks: number[] = [];
  for (let v = ylo; v <= yhi + 1e-6; v += step) ticks.push(v);
  const pts = (vals: number[]) => vals.map((v, t) => `${X(t).toFixed(1)},${Y(v).toFixed(1)}`).join(' ');
  const xEvery = W < 480 ? 12 : 6;
  const onMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const t = Math.round(((e.clientX - r.left) - pl) / iw * (labels.length - 1));
    setHover(Math.max(0, Math.min(labels.length - 1, t)));
  };
  return (
    <div ref={ref} className="relative">
      <div className="mb-2 flex flex-wrap gap-x-4 gap-y-1">
        {[...series].reverse().map(s => (
          <span key={s.key} className="flex items-center gap-1.5 text-xs text-muted">
            <svg width="18" height="8" aria-hidden><line x1="0" x2="18" y1="4" y2="4" stroke={s.color} strokeWidth={s.width ?? 2} strokeDasharray={s.dash ? '4 3' : undefined} /></svg>{s.label}
          </span>
        ))}
      </div>
      <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="block h-auto max-w-full touch-pan-y select-none" onPointerMove={onMove} onPointerLeave={() => setHover(null)} role="img" aria-label={series.map(s => s.label).join(', ')}>
        {ticks.map(v => (
          <g key={v}>
            <line x1={pl} x2={W - pr} y1={Y(v)} y2={Y(v)} stroke={Math.abs(v) < 1e-9 ? '#b9bdc8' : '#eceef3'} />
            <text x={pl - 8} y={Y(v) + 4} textAnchor="end" fontSize="11" fill="#6a6a6a" className="tabular-nums">{fmt(v)}</text>
          </g>
        ))}
        {labels.map((l, t) => t % xEvery === 0 || t === labels.length - 1 ? <text key={t} x={X(t)} y={H - 8} textAnchor={t === labels.length - 1 ? 'end' : t === 0 ? 'start' : 'middle'} fontSize="11" fill="#6a6a6a">{l}</text> : null)}
        {fillBetween && series.length >= 2 && (
          <polygon points={`${pts(series[0].values)} ${series[1].values.map((v, t) => `${X(t).toFixed(1)},${Y(v).toFixed(1)}`).reverse().join(' ')}`} fill="#537eec" opacity="0.08" />
        )}
        {series.map(s => <polyline key={s.key} points={pts(s.values)} fill="none" stroke={s.color} strokeWidth={s.width ?? 2} strokeDasharray={s.dash ? '5 4' : undefined} strokeLinejoin="round" strokeLinecap="round" />)}
        {hover !== null && (
          <g>
            <line x1={X(hover)} x2={X(hover)} y1={pt} y2={pt + ih} stroke="#b9bdc8" strokeDasharray="2 3" />
            {series.map(s => <circle key={s.key} cx={X(hover)} cy={Y(s.values[hover])} r="3.5" fill="#fff" stroke={s.color} strokeWidth="2" />)}
          </g>
        )}
      </svg>
      {hover !== null && (
        <div className="pointer-events-none absolute top-8 z-10 rounded-2xl bg-white px-3 py-2 text-xs shadow-lg ring-1 ring-black/5" style={{ left: Math.min(W - 170, Math.max(0, X(hover) + 10)) }}>
          <p className="font-semibold">{labels[hover]}</p>
          {[...series].reverse().map(s => <p key={s.key} className="flex items-center justify-between gap-3 tabular-nums"><span className="flex items-center gap-1.5 text-muted"><span className="h-2 w-2 rounded-full" style={{ background: s.color }} />{s.label}</span><span className="font-medium">{fmt(s.values[hover])}</span></p>)}
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ mix dei ricavi per anno
function RevenueMix({ res, inputs: i }: { res: BPResult; inputs: BPInputs }) {
  const s = i.mixStarter + i.mixPlus + i.mixPro || 1;
  const pro = i.proAnnualShare * i.priceProAnnual + (1 - i.proAnnualShare) * i.priceProQuarterly;
  const parts = [i.mixStarter / s * i.priceStarter, i.mixPlus / s * i.pricePlus, i.mixPro / s * pro];
  const tot = parts.reduce((a, b) => a + b, 0) || 1;
  const SEG = [
    { label: 'Starter', color: '#c9d6f8' }, { label: 'Plus', color: '#8fa9f2' }, { label: 'Pro', color: '#537eec' }, { label: tr('Pacchetti', 'Packs'), color: '#1f3f99' },
  ];
  const max = Math.max(1, ...res.anni.map(y => y.ricavi));
  return (
    <ChartCard title={tr('Da dove arrivano i ricavi', 'Where revenue comes from')} sub={tr('Ricavi di ogni anno divisi per piano e pacchetti di crediti.', 'Yearly revenue split by plan and credit packs.')}>
      <div className="mb-3 flex flex-wrap gap-x-4 gap-y-1">{SEG.map(x => <span key={x.label} className="flex items-center gap-1.5 text-xs text-muted"><span className="h-2.5 w-2.5 rounded-[3px]" style={{ background: x.color }} />{x.label}</span>)}</div>
      <div className="space-y-3">
        {res.anni.map(y => {
          const vals = [...parts.map(p => y.abbonamenti * p / tot), y.pacchetti];
          return (
            <div key={y.anno} className="flex items-center gap-3">
              <span className="w-14 shrink-0 text-sm font-medium">{tr('Anno', 'Year')} {y.anno}</span>
              <div className="flex h-7 min-w-0 flex-1 overflow-hidden rounded-full bg-canvas">
                <div className="flex h-full ease-smooth transition-[width]" style={{ width: `${(y.ricavi / max) * 100}%` }}>
                  {vals.map((v, k) => <div key={k} title={`${SEG[k].label}: ${eur(v)}`} className="h-full" style={{ width: `${(v / (y.ricavi || 1)) * 100}%`, background: SEG[k].color }} />)}
                </div>
              </div>
              <span className="w-20 shrink-0 text-right text-sm font-semibold tabular-nums">{eurK(y.ricavi)}</span>
            </div>
          );
        })}
      </div>
      <p className="mt-3 text-xs text-muted">{tr('Ricavo medio per cliente', 'Average revenue per customer')}: {eur2(res.unit.arpu)} {tr('di abbonamento', 'subscription')}, {eur2(res.unit.arpu_tot)} {tr('coi pacchetti, al mese', 'with packs, per month')}.</p>
    </ChartCard>
  );
}

// ------------------------------------------------------------------ conto economico annuale (stesse righe del PDF)
function PnL({ res, inputs }: { res: BPResult; inputs: BPInputs }) {
  type Row = { label: string; get: (y: YearRow) => number; fmt?: (v: number) => string; neg?: boolean; strong?: boolean; sep?: boolean };
  const rows: Row[] = [
    { label: tr('Clienti paganti a fine anno', 'Paying customers at year end'), get: y => y.clienti_fine, fmt: int },
    { label: tr('Ricavi abbonamenti', 'Subscription revenue'), get: y => y.abbonamenti, sep: true },
    { label: tr('Ricavi pacchetti di crediti', 'Credit pack revenue'), get: y => y.pacchetti },
    { label: tr('Totale ricavi', 'Total revenue'), get: y => y.ricavi, strong: true },
    { label: tr('Costi AI (variabili, incluse le prove gratis)', 'AI costs (variable, incl. free trials)'), get: y => y.ai, neg: true, sep: true },
    { label: tr('Commissioni di pagamento (Stripe)', 'Payment fees (Stripe)'), get: y => y.stripe, neg: true },
    { label: tr('Costi fissi: infrastruttura e servizi', 'Fixed: infrastructure and services'), get: y => y.fissi_infra, neg: true },
    { label: tr('Costi fissi: SRL e commercialista (stima)', 'Fixed: company and accountant (estimate)'), get: y => y.fissi_srl, neg: true },
    { label: tr('Costi fissi: eventi e materiali con il socio', 'Fixed: events and materials with partner'), get: y => y.fissi_eventi, neg: true },
    { label: tr('Marketing: pubblicità su Meta e Google', 'Marketing: Meta and Google ads'), get: y => y.marketing, neg: true },
    { label: tr('Totale costi', 'Total costs'), get: y => y.costi, neg: true, strong: true },
    { label: tr('Margine operativo (EBITDA)', 'Operating margin (EBITDA)'), get: y => y.risultato, strong: true, sep: true },
    { label: tr('EBITDA in % dei ricavi', 'EBITDA as % of revenue'), get: y => y.margine_pct, fmt: v => pct(v) },
    { label: tr('Compenso fondatori (illustrativo)', 'Founder pay (illustrative)'), get: y => y.compenso, neg: true, sep: true },
    { label: tr('Margine dopo il compenso, prima delle imposte', 'Margin after founder pay, before taxes'), get: y => y.dopo_compenso, strong: true },
    ...(inputs.taxesOn ? [
      { label: tr(`Imposte SRL stimate (IRES ${pct(inputs.ires, 1)} + IRAP ${pct(inputs.irap, 1)})`, `Estimated company taxes (IRES ${pct(inputs.ires, 1)} + IRAP ${pct(inputs.irap, 1)})`), get: (y: YearRow) => y.imposte, neg: true },
      { label: tr('Utile dopo le imposte (stima)', 'Profit after taxes (estimate)'), get: (y: YearRow) => y.netto, strong: true },
    ] : []),
    { label: tr('Cassa cumulata a fine anno, dopo i compensi', 'Cumulative cash at year end, after founder pay'), get: y => y.cassa_fine_dopo_compenso, sep: true },
  ];
  return (
    <section className={`bp-card rounded-[28px] bg-white p-5 sm:p-6 ${CARD_SHADOW}`}>
      <h2 className="font-display text-lg font-semibold">{tr('Conto economico previsionale', 'Projected income statement')}</h2>
      <p className="text-xs text-muted">{tr('Stime, euro arrotondati alla decina.', 'Estimates, euros rounded to the nearest ten.')}</p>
      <div className="-mx-5 mt-3 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
        <table className="w-full min-w-[520px] text-sm tabular-nums">
          <thead><tr className="text-xs text-muted"><th className="py-2 text-left font-medium" />{res.anni.map(y => <th key={y.anno} className="py-2 text-right font-medium"><span className="block text-ink">{tr('Anno', 'Year')} {y.anno}</span><span className="font-normal">{y.periodo}</span></th>)}</tr></thead>
          <tbody>
            {rows.map(r => (
              <tr key={r.label} className={`${r.sep ? 'border-t border-line' : ''} ${r.strong ? 'font-semibold' : ''}`}>
                <td className="py-1.5 pr-4 text-left">{r.label}</td>
                {res.anni.map(y => { const v = r.get(y); const neg = r.neg && v !== 0; return <td key={y.anno} className={`whitespace-nowrap py-1.5 text-right ${!r.neg && !r.fmt && v < 0 ? 'text-red-600' : ''}`}>{r.fmt ? r.fmt(v) : eur10(neg ? -v : v)}</td>; })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {inputs.taxesOn && <p className="mt-3 text-xs text-muted">{tr('Imposte: stima grezza sull\'utile annuo positivo dopo i compensi, senza perdite riportate né deduzioni. Da rifare col commercialista.', 'Taxes: rough estimate on positive yearly profit after founder pay, no carried losses or deductions. To be redone with the accountant.')}</p>}
    </section>
  );
}

function Channels({ anni }: { anni: YearRow[] }) {
  const rows: [string, (y: YearRow) => number][] = [
    [tr('SEO, social e prova gratis', 'SEO, social and free trial'), y => y.nuovi_organico],
    [tr('Passaparola (affiliati)', 'Referrals (affiliates)'), y => y.nuovi_affiliati],
    [tr('Rete del socio', 'Partner network'), y => y.nuovi_socio],
    [tr('Reti e franchising', 'Networks and franchises'), y => y.nuovi_reti],
    [tr('Pubblicità', 'Ads'), y => y.nuovi_ads],
  ];
  return (
    <section className={`bp-card rounded-[28px] bg-white p-5 sm:p-6 ${CARD_SHADOW}`}>
      <h2 className="font-display text-lg font-semibold">{tr('Nuovi clienti per canale', 'New customers by channel')}</h2>
      <div className="-mx-5 mt-3 overflow-x-auto px-5 sm:-mx-6 sm:px-6">
        <table className="w-full min-w-[420px] text-sm tabular-nums">
          <thead><tr className="text-xs text-muted"><th />{anni.map(y => <th key={y.anno} className="py-2 text-right font-medium text-ink">{tr('Anno', 'Year')} {y.anno}</th>)}</tr></thead>
          <tbody>
            {rows.map(([l, g]) => <tr key={l}><td className="py-1.5 pr-4">{l}</td>{anni.map(y => <td key={y.anno} className="py-1.5 text-right">{int(g(y))}</td>)}</tr>)}
            <tr className="border-t border-line font-semibold"><td className="py-1.5">{tr('Totale nuovi', 'Total new')}</td>{anni.map(y => <td key={y.anno} className="py-1.5 text-right">{int(y.nuovi)}</td>)}</tr>
            <tr><td className="py-1.5 text-muted">{tr('Persi (abbandoni)', 'Lost (churn)')}</td>{anni.map(y => <td key={y.anno} className="py-1.5 text-right text-muted">-{int(y.persi)}</td>)}</tr>
          </tbody>
        </table>
      </div>
    </section>
  );
}

function MonthlyTable({ res }: { res: BPResult }) {
  // in stampa la tabella mensile c'e' sempre: si apre prima di stampare
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener('beforeprint', on);
    return () => window.removeEventListener('beforeprint', on);
  }, []);
  const cols: [string, (m: BPResult['mesi'][number]) => string][] = [
    [tr('Clienti', 'Customers'), m => int(m.clienti)], [tr('Nuovi', 'New'), m => int(m.nuovi)], [tr('Persi', 'Lost'), m => int(m.persi)],
    [tr('Ricavi', 'Revenue'), m => eur(m.ricavi)], ['AI', m => eur(m.ai)], ['Stripe', m => eur(m.stripe)], [tr('Fissi', 'Fixed'), m => eur(m.fissi)],
    [tr('Pubblicità', 'Ads'), m => eur(m.marketing)], [tr('Risultato', 'Result'), m => eur(m.risultato)], [tr('Cassa', 'Cash'), m => eur(m.cumulato)], [tr('Compenso', 'Founder pay'), m => eur(m.compenso)],
  ];
  return (
    <details open={open} onToggle={e => setOpen(e.currentTarget.open)} className={`bp-card group rounded-[28px] bg-white ${CARD_SHADOW}`}>
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 p-5 sm:p-6 [&::-webkit-details-marker]:hidden">
        <span><span className="block font-display text-lg font-semibold">{tr('Mese per mese', 'Month by month')}</span><span className="block text-xs text-muted">{tr('Tutti i 36 mesi del modello', 'All 36 months of the model')}</span></span>
        <ChevronDown size={18} className="bp-noprint text-muted ease-smooth transition-transform group-open:rotate-180" />
      </summary>
      <div className="bp-month overflow-x-auto px-5 pb-5 sm:px-6 sm:pb-6">
        <table className="w-full min-w-[820px] text-xs tabular-nums">
          <thead><tr className="text-muted"><th className="py-1.5 text-left font-medium">{tr('Mese', 'Month')}</th>{cols.map(([l]) => <th key={l} className="py-1.5 text-right font-medium">{l}</th>)}</tr></thead>
          <tbody>
            {res.mesi.map(m => (
              <tr key={m.t} className={`border-t border-line ${m.t % 12 === 0 && m.t ? 'border-ink/30' : ''}`}>
                <td className="whitespace-nowrap py-1.5 pr-3 font-medium">{m.mese}</td>
                {cols.map(([l, g]) => <td key={l} className={`whitespace-nowrap py-1.5 pl-3 text-right ${(l === tr('Risultato', 'Result') && m.risultato < 0) || (l === tr('Cassa', 'Cash') && m.cumulato < 0) ? 'text-red-600' : ''}`}>{g(m)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  );
}

// ------------------------------------------------------------------ riepilogo delle ipotesi, solo in stampa
function PrintSummary({ inputs: i, scenName, res }: { inputs: BPInputs; scenName: string; res: BPResult }) {
  const ads = [...i.ads].sort((a, b) => a.from - b.from).map(s => `${eur(s.budget)} ${tr('da', 'from')} ${monthLabel(i, s.from)}`).join(', ');
  const items: [string, string][] = [
    [tr('Scenario', 'Scenario'), scenName],
    [tr('Periodo', 'Period'), `${monthLabel(i, 0)} - ${monthLabel(i, MONTHS - 1)}`],
    [tr('Pubblicità', 'Ads'), i.adsOn ? `${ads}; CAC ${eur(i.cac)}` : tr('spenta', 'off')],
    [tr('Nuovi clienti organici al mese', 'Organic new customers per month'), `${tr('da', 'from')} ${nf(1).format(i.organicStart)} ${tr('a', 'to')} ${nf(1).format(i.organicEnd)}`],
    [tr('Passaparola', 'Referrals'), `${pct(i.referral, 1)} ${tr('dei clienti attivi', 'of active customers')}`],
    [tr('Rete del socio', 'Partner network'), i.partnerOn ? `${tr('da', 'from')} ${nf(1).format(i.partnerStart)} ${tr('a', 'to')} ${nf(1).format(i.partnerEnd)} ${tr('al mese, da', 'per month, from')} ${monthLabel(i, i.partnerFrom)}` : tr('nessuna', 'none')],
    [tr('Reti e franchising', 'Networks'), i.dealsOn ? `${i.dealsSeats} ${tr('agenti ogni', 'agents every')} ${i.dealsEvery} ${tr('mesi da', 'months from')} ${monthLabel(i, i.dealsFrom)}` : tr('nessuno', 'none')],
    [tr('Abbandono mensile', 'Monthly churn'), pct(i.churn, 1)],
    [tr('Prezzi', 'Prices'), `Starter ${eur(i.priceStarter)}, Plus ${eur(i.pricePlus)}, Pro ${eur(i.priceProAnnual)}/${eur(i.priceProQuarterly)} (${pct(i.proAnnualShare)} ${tr('annuale', 'yearly')})`],
    [tr('Mix', 'Mix'), `Starter ${pct(i.mixStarter)}, Plus ${pct(i.mixPlus)}, Pro ${pct(i.mixPro)}`],
    [tr('Pacchetti', 'Packs'), `${pct(i.packBuyers)} ${tr('dei clienti al mese', 'of customers per month')}, ${eur(i.packPrice)}`],
    [tr('Costo AI per cliente', 'AI cost per customer'), `${eur2(res.unit.ai_cliente)} ${tr('al mese', 'per month')}${i.aiPerCustomerOverride !== null ? tr(' (misurato)', ' (measured)') : ''}`],
    [tr('Clienti al via', 'Starting customers'), int(i.startCustomers)],
  ];
  return (
    <section className="bp-printonly bp-card hidden rounded-[20px] p-4">
      <h2 className="font-semibold">{tr('Ipotesi usate (stime)', 'Assumptions used (estimates)')}</h2>
      <dl className="mt-2 grid grid-cols-[auto_1fr] gap-x-4 gap-y-0.5">
        {items.map(([k, v]) => <Fragment key={k}><dt className="text-muted">{k}</dt><dd>{v}</dd></Fragment>)}
      </dl>
    </section>
  );
}
