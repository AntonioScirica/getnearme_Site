// Business plan dinamico di Agente Immo (pagina admin #/business-plan). Funzioni pure, niente React.
// Porting fedele del modello mensile su 36 mesi di projections.py (Desktop/agenteimmo-business-plan):
// con gli input dei tre scenari (PRESETS) i totali coincidono con projections.json (verifica: scripts/bp-check.mjs).
// Tutti i numeri sono STIME. Mese t = 0 e' il mese di partenza (nel piano originale novembre 2026).

export const MONTHS = 36;
export const MESI_IT = ['gen', 'feb', 'mar', 'apr', 'mag', 'giu', 'lug', 'ago', 'set', 'ott', 'nov', 'dic'];
export const MARKET_AGENTS = 49026; // agenti abilitati in Italia (Euromq, marzo 2025)

export type ScenarioKey = 'prudente' | 'base' | 'ambizioso';
export type AdsStep = { from: number; budget: number }; // budget mensile dal mese t = from in poi

export type BPInputs = {
  startYear: number; startMonth: number; // 0 = gennaio
  startCustomers: number;
  // marketing a pagamento
  adsOn: boolean; ads: AdsStep[]; cac: number;
  // crescita organica
  organicStart: number; organicEnd: number;
  referral: number; // quota dei clienti attivi che porta un nuovo cliente al mese
  partnerOn: boolean; partnerFrom: number; partnerStart: number; partnerEnd: number;
  dealsOn: boolean; dealsFrom: number; dealsEvery: number; dealsSeats: number;
  // retention
  churn: number;
  // prezzi e mix
  priceStarter: number; pricePlus: number; priceProAnnual: number; priceProQuarterly: number; // €/mese equivalenti
  proAnnualShare: number;
  mixStarter: number; mixPlus: number; mixPro: number; // normalizzati sulla somma
  creditsStarter: number; creditsPlus: number; creditsPro: number;
  packBuyers: number; packPrice: number; packCredits: number;
  // costi
  aiCostPerCredit: number; creditUsage: number;
  aiPerCustomerOverride: number | null; // costo AI per cliente al mese misurato (null = calcolato dai crediti)
  trialConversion: number; trialCost: number;
  stripePct: number; stripeFix: number;
  infra: [number, number, number]; // €/mese negli anni 1, 2, 3
  srlSetup: number; srlSetupMonth: number; srlMonthly: number; srlFrom: number;
  events: number; eventsFrom: number;
  founderPay: number; founderThresholds: [number, number];
  taxesOn: boolean; ires: number; irap: number;
};

export type MonthRow = {
  t: number; mese: string; nuovi: number; persi: number; clienti: number;
  nuovi_organico: number; nuovi_affiliati: number; nuovi_socio: number; nuovi_reti: number; nuovi_ads: number; marketing: number;
  ricavi: number; abbonamenti: number; pacchetti: number; mrr: number;
  ai: number; prove: number; stripe: number;
  fissi_infra: number; fissi_srl: number; fissi_eventi: number; fissi: number;
  costi: number; risultato: number; cumulato: number;
  compenso: number; dopo_compenso: number; cumulato_dopo_compenso: number;
};

export type YearRow = {
  anno: number; periodo: string; clienti_fine: number; nuovi: number; persi: number;
  nuovi_organico: number; nuovi_affiliati: number; nuovi_socio: number; nuovi_reti: number; nuovi_ads: number;
  marketing: number; abbonamenti: number; pacchetti: number; ricavi: number;
  ai: number; prove: number; stripe: number;
  fissi_infra: number; fissi_srl: number; fissi_eventi: number; fissi: number; costi: number;
  risultato: number; margine_pct: number; compenso: number; dopo_compenso: number;
  imposte: number; netto: number;
  cassa_fine: number; cassa_fine_dopo_compenso: number; ricavi_ultimo_mese: number;
};

export type Milestones = {
  pareggio_mensile: number | null; pareggio_cumulato: number | null;
  margine_2000: number | null; margine_4000: number | null;
  compenso_1: number | null; compenso_2: number | null;
  cassa_minima: number; cassa_minima_mese: number; quota_mercato_fine: number;
};

export type Unit = { arpu: number; arpu_tot: number; margine_lordo: number; ltv: number; cac: number; ltv_cac: number; payback_mesi: number; vita_media_mesi: number; ai_cliente: number; stripe_cliente: number };

export type BPResult = { mesi: MonthRow[]; anni: YearRow[]; traguardi: Milestones; unit: Unit };

// ------------------------------------------------------------------ scenari (come projections.py)
const COMMON: Omit<BPInputs, 'adsOn' | 'ads' | 'cac' | 'organicStart' | 'organicEnd' | 'referral' | 'partnerOn' | 'partnerFrom' | 'partnerStart' | 'partnerEnd' | 'dealsOn' | 'dealsFrom' | 'dealsEvery' | 'dealsSeats' | 'churn' | 'events'> = {
  startYear: 2026, startMonth: 10, startCustomers: 0,
  priceStarter: 19, pricePlus: 49, priceProAnnual: 59, priceProQuarterly: 69, proAnnualShare: 0.6,
  mixStarter: 0.52, mixPlus: 0.30, mixPro: 0.18,
  creditsStarter: 600, creditsPlus: 1500, creditsPro: 2500,
  packBuyers: 0.08, packPrice: 24, packCredits: 600,
  aiCostPerCredit: 12.5 / 1500, creditUsage: 0.5, aiPerCustomerOverride: null,
  trialConversion: 0.10, trialCost: 0.80,
  stripePct: 0.022, stripeFix: 0.25,
  infra: [200, 400, 800],
  srlSetup: 2000, srlSetupMonth: 3, srlMonthly: 200, srlFrom: 4,
  eventsFrom: 2,
  founderPay: 2000, founderThresholds: [2500, 5000],
  taxesOn: false, ires: 0.24, irap: 0.039,
};

// periodi pubblicitari del piano: gen-giu 2027 (t 2-7), lug-dic 2027 (t 8-13), 2028 (t 14-25), 2029 (t 26-35)
const adsSteps = (a: number, b: number, c: number, d: number): AdsStep[] => [{ from: 2, budget: a }, { from: 8, budget: b }, { from: 14, budget: c }, { from: 26, budget: d }];

export const PRESETS: Record<ScenarioKey, BPInputs> = {
  prudente: {
    ...COMMON, adsOn: true, ads: adsSteps(300, 600, 1000, 1500), cac: 150,
    organicStart: 3, organicEnd: 14, referral: 0.010,
    partnerOn: false, partnerFrom: 0, partnerStart: 0, partnerEnd: 0,
    dealsOn: false, dealsFrom: 9, dealsEvery: 3, dealsSeats: 20,
    churn: 0.060, events: 0,
  },
  base: {
    ...COMMON, adsOn: true, ads: adsSteps(500, 1000, 1500, 2500), cac: 100,
    organicStart: 4, organicEnd: 22, referral: 0.015,
    partnerOn: true, partnerFrom: 2, partnerStart: 4, partnerEnd: 10,
    dealsOn: false, dealsFrom: 9, dealsEvery: 3, dealsSeats: 20,
    churn: 0.045, events: 100,
  },
  ambizioso: {
    ...COMMON, adsOn: true, ads: adsSteps(500, 1000, 2000, 3000), cac: 70,
    organicStart: 5, organicEnd: 30, referral: 0.020,
    partnerOn: true, partnerFrom: 2, partnerStart: 6, partnerEnd: 15,
    dealsOn: true, dealsFrom: 9, dealsEvery: 3, dealsSeats: 20,
    churn: 0.035, events: 250,
  },
};

export const SCENARIO_NAMES: Record<ScenarioKey, string> = { prudente: 'Prudente', base: 'Base', ambizioso: 'Ambizioso' };

export const clonePreset = (k: ScenarioKey): BPInputs => JSON.parse(JSON.stringify(PRESETS[k]));

// ------------------------------------------------------------------ etichette dei mesi
export function monthLabel(i: Pick<BPInputs, 'startYear' | 'startMonth'>, t: number, short = false): string {
  const m = (i.startMonth + t) % 12;
  const y = i.startYear + Math.floor((i.startMonth + t) / 12);
  return `${MESI_IT[m]} ${short ? String(y).slice(2) : y}`;
}

// ------------------------------------------------------------------ grandezze per cliente
const lerp = (a: number, b: number, t: number, n: number) => a + (b - a) * (t / Math.max(1, n - 1));

function mix(i: BPInputs) {
  const s = i.mixStarter + i.mixPlus + i.mixPro || 1;
  return { starter: i.mixStarter / s, plus: i.mixPlus / s, pro: i.mixPro / s };
}

export function arpu(i: BPInputs): number {
  const m = mix(i);
  const pro = i.proAnnualShare * i.priceProAnnual + (1 - i.proAnnualShare) * i.priceProQuarterly;
  return m.starter * i.priceStarter + m.plus * i.pricePlus + m.pro * pro;
}

// commissioni Stripe per cliente al mese: Starter e Plus pagano ogni mese, Pro una volta l'anno o a trimestre
export function stripePerCustomerMonth(i: BPInputs): number {
  const m = mix(i);
  const fee = (amount: number) => i.stripePct * amount + i.stripeFix;
  const proA = i.proAnnualShare * fee(i.priceProAnnual * 12) / 12;
  const proQ = (1 - i.proAnnualShare) * fee(i.priceProQuarterly * 3) / 3;
  return m.starter * fee(i.priceStarter) + m.plus * fee(i.pricePlus) + m.pro * (proA + proQ);
}

export function aiCreditsPerCustomerMonth(i: BPInputs): number {
  const m = mix(i);
  return (m.starter * i.creditsStarter + m.plus * i.creditsPlus + m.pro * i.creditsPro) * i.creditUsage * i.aiCostPerCredit;
}

export const aiPerCustomerMonth = (i: BPInputs) => i.aiPerCustomerOverride ?? aiCreditsPerCustomerMonth(i);

export function adsBudget(i: BPInputs, t: number): number {
  if (!i.adsOn) return 0;
  let b = 0;
  for (const s of [...i.ads].sort((a, z) => a.from - z.from)) if (t >= s.from) b = s.budget;
  return b;
}

// primo mese da cui la condizione vale per tutti i mesi seguenti (come stays() in Python)
function stays<T>(rows: T[], cond: (r: T) => boolean): number | null {
  let idx: number | null = null;
  for (let k = rows.length - 1; k >= 0; k--) {
    if (cond(rows[k])) idx = k; else break;
  }
  return idx;
}

// ------------------------------------------------------------------ modello
export function run(i: BPInputs): BPResult {
  const rows: MonthRow[] = [];
  let cust = Math.max(0, i.startCustomers);
  let cum = 0;
  const a = arpu(i);
  const st = stripePerCustomerMonth(i);
  const ai = aiPerCustomerMonth(i);
  const cpc = i.aiCostPerCredit;
  const packStripe = i.stripePct * i.packPrice + i.stripeFix;
  for (let t = 0; t < MONTHS; t++) {
    const year = Math.floor(t / 12);
    const organic = lerp(i.organicStart, i.organicEnd, t, MONTHS);
    const referral = i.referral * cust;
    let partner = 0;
    if (i.partnerOn && i.partnerStart && t >= i.partnerFrom) partner = lerp(i.partnerStart, i.partnerEnd, t - i.partnerFrom, MONTHS - i.partnerFrom);
    let deals = 0;
    if (i.dealsOn && i.dealsEvery > 0 && t >= i.dealsFrom && (t - i.dealsFrom) % i.dealsEvery === 0) deals = i.dealsSeats;
    const ads = adsBudget(i, t);
    const fromAds = i.cac > 0 ? ads / i.cac : 0;
    const nuovi = organic + referral + partner + deals + fromAds;
    const churned = cust * i.churn;
    cust = cust - churned + nuovi;

    const subs = cust * a;
    const packs = cust * i.packBuyers * i.packPrice;
    const revenue = subs + packs;
    const stripe = cust * st + cust * i.packBuyers * packStripe;
    const trials = i.trialConversion > 0 ? (nuovi / i.trialConversion) * i.trialCost : 0;
    const aiCost = cust * ai + cust * i.packBuyers * i.packCredits * cpc + trials;
    const fInfra = i.infra[Math.min(2, year)];
    const fSrl = (t >= i.srlFrom ? i.srlMonthly : 0) + (t === i.srlSetupMonth ? i.srlSetup : 0);
    const fEvents = t >= i.eventsFrom ? i.events : 0;
    const fixed = fInfra + fSrl + fEvents;
    const costs = aiCost + stripe + fixed + ads;
    const result = revenue - costs;
    cum += result;
    rows.push({
      t, mese: monthLabel(i, t), nuovi, persi: churned, clienti: cust,
      nuovi_organico: organic, nuovi_affiliati: referral, nuovi_socio: partner, nuovi_reti: deals, nuovi_ads: fromAds, marketing: ads,
      ricavi: revenue, abbonamenti: subs, pacchetti: packs, mrr: subs,
      ai: aiCost, prove: trials, stripe,
      fissi_infra: fInfra, fissi_srl: fSrl, fissi_eventi: fEvents, fissi: fixed,
      costi: costs, risultato: result, cumulato: cum,
      compenso: 0, dopo_compenso: 0, cumulato_dopo_compenso: 0,
    });
  }

  // compenso illustrativo dei fondatori: parte quando il margine resta stabilmente sopra la soglia
  const starts = i.founderThresholds.map(th => stays(rows, x => x.risultato >= th));
  let cum2 = 0;
  for (const r of rows) {
    const pay = starts.reduce<number>((s, s0) => s + (s0 !== null && r.t >= s0 ? i.founderPay : 0), 0);
    r.compenso = pay;
    r.dopo_compenso = r.risultato - pay;
    cum2 += r.dopo_compenso;
    r.cumulato_dopo_compenso = cum2;
  }

  const anni: YearRow[] = [];
  for (let y = 0; y < 3; y++) {
    const r = rows.slice(y * 12, (y + 1) * 12);
    const sm = (k: keyof MonthRow) => r.reduce((s, x) => s + (x[k] as number), 0);
    const ricavi = sm('ricavi');
    const dopo = sm('dopo_compenso');
    // stima grezza imposte SRL: IRES + IRAP sull'utile positivo dopo i compensi (da rifare col commercialista)
    const imposte = i.taxesOn && dopo > 0 ? dopo * (i.ires + i.irap) : 0;
    anni.push({
      anno: y + 1, periodo: `${r[0].mese} - ${r[r.length - 1].mese}`,
      clienti_fine: r[r.length - 1].clienti, nuovi: sm('nuovi'), persi: sm('persi'),
      nuovi_organico: sm('nuovi_organico'), nuovi_affiliati: sm('nuovi_affiliati'), nuovi_socio: sm('nuovi_socio'), nuovi_reti: sm('nuovi_reti'), nuovi_ads: sm('nuovi_ads'),
      marketing: sm('marketing'), abbonamenti: sm('abbonamenti'), pacchetti: sm('pacchetti'), ricavi,
      ai: sm('ai'), prove: sm('prove'), stripe: sm('stripe'),
      fissi_infra: sm('fissi_infra'), fissi_srl: sm('fissi_srl'), fissi_eventi: sm('fissi_eventi'), fissi: sm('fissi'), costi: sm('costi'),
      risultato: sm('risultato'), margine_pct: ricavi ? sm('risultato') / ricavi : 0,
      compenso: sm('compenso'), dopo_compenso: dopo, imposte, netto: dopo - imposte,
      cassa_fine: r[r.length - 1].cumulato, cassa_fine_dopo_compenso: r[r.length - 1].cumulato_dopo_compenso,
      ricavi_ultimo_mese: r[r.length - 1].ricavi,
    });
  }

  let minIdx = 0;
  rows.forEach((x, k) => { if (x.cumulato < rows[minIdx].cumulato) minIdx = k; });
  const traguardi: Milestones = {
    pareggio_mensile: stays(rows, x => x.risultato > 0),
    pareggio_cumulato: stays(rows, x => x.cumulato > 0),
    margine_2000: stays(rows, x => x.risultato >= 2000),
    margine_4000: stays(rows, x => x.risultato >= 4000),
    compenso_1: starts[0], compenso_2: starts[1],
    cassa_minima: rows[minIdx].cumulato, cassa_minima_mese: minIdx,
    quota_mercato_fine: rows[rows.length - 1].clienti / MARKET_AGENTS,
  };

  // LTV e payback per cliente (ricavo medio con i pacchetti, margine lordo dopo AI e Stripe)
  const arpuTot = a + i.packBuyers * i.packPrice;
  const varC = ai + i.packBuyers * i.packCredits * cpc + st + i.packBuyers * packStripe;
  const gm = arpuTot ? (arpuTot - varC) / arpuTot : 0;
  const ltv = i.churn > 0 ? arpuTot * gm / i.churn : Infinity;
  const unit: Unit = {
    arpu: a, arpu_tot: arpuTot, margine_lordo: gm, ltv, cac: i.cac,
    ltv_cac: i.cac > 0 ? ltv / i.cac : Infinity, payback_mesi: arpuTot * gm > 0 ? i.cac / (arpuTot * gm) : Infinity,
    vita_media_mesi: i.churn > 0 ? 1 / i.churn : Infinity, ai_cliente: ai, stripe_cliente: st,
  };
  return { mesi: rows, anni, traguardi, unit };
}
