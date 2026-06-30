// Report HTML builder — porta 1:1 il design del PDF dell'estensione
// (sidepanel/panel.js generateComparisonHTML). Italiano only, nessuna dipendenza
// da chrome.* / window.* / DOM: funzione pura, richiamabile server o client.

export type ReportProperty = {
  title: string;
  address?: string;
  price?: number;
  surface?: number;
  rooms?: number | string;
  bedrooms?: number | string;
  bathrooms?: number | string;
  floor?: number | string;
  elevator?: string;
  type?: string;
  stato?: string;
  energyClass?: string;
  condominium?: number | string;
  pricePerSqm?: number;
  totalCosts?: number;
  yearBuilt?: string;
  heating?: string;
  parking?: string;
  furnished?: string;
  balcony?: string;
  terrace?: string;
  garden?: string;
  cellar?: string;
  ac?: string;
  contract?: string;
};

export type ReportBrand = {
  primaryColor?: string;
  companyName?: string;
  companyWebsite?: string;
  companyEmail?: string;
  logo?: string;
  allLogos?: { url: string; label: string }[];
  reportFinalTitle?: string;
  reportFinalDesc?: string;
};

export type ReportColumnKey =
  | 'address' | 'price' | 'eurmq' | 'surface' | 'rooms' | 'bedrooms'
  | 'bathrooms' | 'floor' | 'elevator' | 'type' | 'condition' | 'energy'
  | 'monthly' | 'total'
  | 'yearBuilt' | 'heating' | 'parking' | 'furnished' | 'balcony'
  | 'terrace' | 'garden' | 'cellar' | 'ac' | 'contract';

export type ProsConsEdits = Record<string, { pros: string[]; cons: string[] }>;

export type ReportOptions = {
  sections: {
    cover: boolean;
    table: boolean;
    prosCons: boolean;
    costs: boolean;
    poi: boolean;
    legal: boolean;
    thanks: boolean;
  };
  columns?: Partial<Record<ReportColumnKey, boolean>>;
  edits?: Record<string, string>;
  prosConsEdits?: ProsConsEdits;
  editable?: boolean;
};

type ProsCons = { title: string; pros: string[]; cons: string[]; notes: string[] };
type DetailedCosts = {
  listingPrice: number;
  agencyCost: number;
  agencyPercentage: number;
  notaryCost: number;
  taxesCost: number;
  taxesPercentage: number;
  otherCosts: number;
  totalEstimated: number;
};

// ─── Helpers (port verbatim da panel.js) ────────────────────────────────────

const hexToRgba = (hex: string, alpha: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const formatPrice = (num?: number): string => {
  if (!num || num === 0) return 'N/A';
  return num.toLocaleString('it-IT') + ' €';
};

const roundToHundreds = (value: number): number => Math.round(value / 100) * 100;

function getEnergyColor(energyClass?: string): string {
  const colors: Record<string, string> = {
    A4: '#00845a', A3: '#00845a', A2: '#00845a', A1: '#00845a', A: '#00845a',
    B: '#4da64d',
    C: '#c8d96f',
    D: '#ffed00',
    E: '#f5b800',
    F: '#eb6909',
    G: '#d7191c',
  };
  const key = energyClass ? energyClass.toUpperCase() : 'N/A';
  return colors[key] || '#9ca3af';
}

function calculateDetailedCosts(price?: number, surfaceNum = 0): DetailedCosts {
  if (!price || price <= 0) {
    return {
      listingPrice: 0, agencyCost: 0, agencyPercentage: 0, notaryCost: 0,
      taxesCost: 0, taxesPercentage: 0, otherCosts: 0, totalEstimated: 0,
    };
  }

  const agencyPercentage = 3.66;
  const agencyCost = roundToHundreds(price * (agencyPercentage / 100));

  let notaryCost: number;
  if (price < 150000) notaryCost = 1900;
  else if (price < 300000) notaryCost = 2400;
  else notaryCost = 3000;

  let taxesCost: number;
  let taxesPercentage: number;
  if (surfaceNum > 0) {
    if (surfaceNum < 85) taxesCost = 1500;
    else if (surfaceNum <= 110) taxesCost = 2000;
    else taxesCost = 3000;
    taxesPercentage = Math.round((taxesCost / price) * 100 * 100) / 100;
  } else {
    taxesPercentage = 2;
    taxesCost = roundToHundreds(price * (taxesPercentage / 100));
  }

  const appraisalCost = 400;
  const insuranceCost = 300;
  const otherCosts = appraisalCost + insuranceCost;

  const totalEstimated = price + agencyCost + notaryCost + taxesCost + otherCosts;

  return {
    listingPrice: price, agencyCost, agencyPercentage, notaryCost,
    taxesCost, taxesPercentage, otherCosts, totalEstimated,
  };
}

// calcolo totalCosts (precompute equivalente a calculateTotalCosts)
export function calculateTotalCosts(price?: number, surfaceNum = 0): number {
  if (!price || price <= 0) return 0;
  const agencyCost = roundToHundreds(price * 0.0366);
  let notaryCost: number;
  if (price < 150000) notaryCost = 1900;
  else if (price < 300000) notaryCost = 2400;
  else notaryCost = 3000;
  let taxesCost: number;
  if (surfaceNum > 0) {
    if (surfaceNum < 85) taxesCost = 1500;
    else if (surfaceNum <= 110) taxesCost = 2000;
    else taxesCost = 3000;
  } else {
    taxesCost = roundToHundreds(price * 0.02);
  }
  const appraisalCost = 400;
  const insuranceCost = 300;
  return price + agencyCost + notaryCost + taxesCost + appraisalCost + insuranceCost;
}

// Stringhe pro/contro (Italiano, da i18n.js) con interpolazione {diff}
const T = {
  prosPrice: (diff: number) => `Prezzo ~${diff}% sotto la mediana del confronto`,
  prosPricePerSqm: (diff: number) => `€/m² ~${diff}% sotto la mediana`,
  prosSurface: (diff: number) => `Superficie ~${diff}% sopra la mediana`,
  prosEnergyClass: () => 'Classe energetica tra le più efficienti del confronto',
  prosCondo: (diff: number) => `Spese mensili ~${diff}% sotto la mediana`,
  consPrice: (diff: number) => `Prezzo ~${diff}% sopra la mediana del confronto`,
  consPricePerSqm: (diff: number) => `€/m² ~${diff}% sopra la mediana`,
  consSurface: (diff: number) => `Superficie ~${diff}% sotto la mediana`,
  consEnergyClass: () => 'Classe energetica tra le meno efficienti del confronto',
  consCondo: (diff: number) => `Spese mensili ~${diff}% sopra la mediana`,
  consHighFloorNoElevator: () => 'Piano alto senza ascensore',
  prosElevator: () => 'Ascensore presente',
  prosConditionNew: () => 'Stato: nuovo',
  prosConditionRenovated: () => 'Stato: ristrutturato',
  consConditionToRenovate: () => 'Stato: da ristrutturare',
  prosRooms: (diff: number) => `Più locali rispetto alla mediana (~${diff}%)`,
  consRooms: (diff: number) => `Meno locali rispetto alla mediana (~${diff}%)`,
  prosTotalCosts: (diff: number) => `Costi totali stimati inferiori alla mediana (~${diff}%)`,
  consTotalCosts: (diff: number) => `Costi totali stimati superiori alla mediana (~${diff}%)`,
};

export function generateProsCons(properties: ReportProperty[]): ProsCons[] {
  const MAX_PROS = 8;
  const MAX_CONS = 8;

  const median = (arr: number[]): number => {
    if (arr.length === 0) return 0;
    const sorted = [...arr].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 !== 0 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };

  const getNumericValues = (arr: ReportProperty[], key: keyof ReportProperty): number[] =>
    arr.map((p) => {
      const val = p[key];
      if (typeof val === 'number') return val;
      if (typeof val === 'string') {
        const num = parseFloat(val.replace(/[^\d.,]/g, '').replace(',', '.'));
        return isNaN(num) ? null : num;
      }
      return null;
    }).filter((v): v is number => v !== null && v > 0);

  const priceValues = getNumericValues(properties, 'price');
  const pricePerSqmValues = getNumericValues(properties, 'pricePerSqm');
  const surfaceValues = getNumericValues(properties, 'surface');
  const condoValues = properties.map((p) => {
    const match = String(p.condominium || '').match(/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }).filter((v): v is number => v !== null && v > 0);

  const roomsValues = getNumericValues(properties, 'rooms');
  const totalCostsValues = getNumericValues(properties, 'totalCosts');

  const medPrice = median(priceValues);
  const medPricePerSqm = median(pricePerSqmValues);
  const medSurface = median(surfaceValues);
  const medCondo = median(condoValues);
  const medRooms = median(roomsValues);
  const medTotalCosts = median(totalCostsValues);

  const energyOrder = ['A4', 'A3', 'A2', 'A1', 'A', 'B', 'C', 'D', 'E', 'F', 'G'];
  const getEnergyIndex = (ec?: string): number => {
    if (!ec || ec === '--' || ec === 'N/A') return -1;
    const idx = energyOrder.indexOf(ec.toUpperCase());
    return idx >= 0 ? idx : -1;
  };
  const validEnergyIndices = properties.map((p) => getEnergyIndex(p.energyClass)).filter((i) => i >= 0);
  const sortedEnergy = [...new Set(validEnergyIndices)].sort((a, b) => a - b);
  const best2Classes = sortedEnergy.slice(0, 2);
  const worst2Classes = sortedEnergy.slice(-2);

  const pctDiff = (value: number, med: number): number => (med > 0 ? Math.round(((value - med) / med) * 100) : 0);

  return properties.map((property) => {
    const candidates: { pros: { text: string; weight: number }[]; cons: { text: string; weight: number }[] } = { pros: [], cons: [] };
    const notes: string[] = [];

    const price = property.price || 0;
    const pricePerSqm = property.pricePerSqm || 0;
    const surface = property.surface || 0;
    const condoMatch = String(property.condominium || '').match(/(\d+)/);
    const condo = condoMatch ? parseInt(condoMatch[1]) : 0;
    const hasCondo = condoMatch !== null;
    const energyIndex = getEnergyIndex(property.energyClass);

    if (medPrice > 0 && price > 0) {
      const diff = pctDiff(price, medPrice);
      if (diff < -20) candidates.pros.push({ text: T.prosPrice(Math.abs(diff)), weight: Math.abs(diff) });
      else if (diff > 20) candidates.cons.push({ text: T.consPrice(Math.abs(diff)), weight: Math.abs(diff) });
    }

    if (medPricePerSqm > 0 && pricePerSqm > 0) {
      const diff = pctDiff(pricePerSqm, medPricePerSqm);
      if (diff < -15) candidates.pros.push({ text: T.prosPricePerSqm(Math.abs(diff)), weight: Math.abs(diff) });
      else if (diff > 15) candidates.cons.push({ text: T.consPricePerSqm(Math.abs(diff)), weight: Math.abs(diff) });
    }

    if (medSurface > 0 && surface > 0) {
      const diff = pctDiff(surface, medSurface);
      if (diff > 15) candidates.pros.push({ text: T.prosSurface(Math.abs(diff)), weight: Math.abs(diff) });
      else if (diff < -15) candidates.cons.push({ text: T.consSurface(Math.abs(diff)), weight: Math.abs(diff) });
    }

    if (hasCondo && condo > 0) {
      if (medCondo > 0) {
        const diff = pctDiff(condo, medCondo);
        if (diff < -25) candidates.pros.push({ text: T.prosCondo(Math.abs(diff)), weight: Math.abs(diff) });
        else if (diff > 25) candidates.cons.push({ text: T.consCondo(Math.abs(diff)), weight: Math.abs(diff) });
      }
    }

    if (energyIndex >= 0 && sortedEnergy.length >= 2) {
      if (best2Classes.includes(energyIndex)) candidates.pros.push({ text: T.prosEnergyClass(), weight: 10 });
      else if (worst2Classes.includes(energyIndex)) candidates.cons.push({ text: T.consEnergyClass(), weight: 10 });
    }

    const floorRaw = String(property.floor || '').trim().toUpperCase();
    const elevRaw = String(property.elevator || '').trim().toLowerCase();
    const floorNum = parseInt(floorRaw);
    const floorValid = !isNaN(floorNum);
    const hasElevator = elevRaw.includes('sì') || elevRaw === 'si' || elevRaw === 'yes';
    const noElevator = elevRaw.includes('no') || elevRaw === '0';

    if (floorValid && floorNum >= 3) {
      if (noElevator) candidates.cons.push({ text: T.consHighFloorNoElevator(), weight: 50 });
      else if (hasElevator) candidates.pros.push({ text: T.prosElevator(), weight: 1 });
    }

    const statoRaw = String(property.stato || '').trim().toLowerCase();
    const isNA = !statoRaw || statoRaw === 'n/a' || statoRaw === '--';
    if (!isNA) {
      if (statoRaw.includes('nuovo') || statoRaw.includes('nuova costruzione')) candidates.pros.push({ text: T.prosConditionNew(), weight: 5 });
      else if (statoRaw.includes('ristrutturato') || statoRaw.includes('ottimo')) candidates.pros.push({ text: T.prosConditionRenovated(), weight: 5 });
      else if (statoRaw.includes('da ristrutturare')) candidates.cons.push({ text: T.consConditionToRenovate(), weight: 40 });
    }

    const roomsNum = parseInt(String(property.rooms));
    if (!isNaN(roomsNum) && roomsNum > 0 && medRooms > 0) {
      const diff = pctDiff(roomsNum, medRooms);
      if (diff > 15) candidates.pros.push({ text: T.prosRooms(Math.abs(diff)), weight: 3 });
      else if (diff < -15) candidates.cons.push({ text: T.consRooms(Math.abs(diff)), weight: 3 });
    }

    const totalCosts = property.totalCosts || 0;
    if (totalCosts > 0 && medTotalCosts > 0) {
      const diff = pctDiff(totalCosts, medTotalCosts);
      if (diff < -20) candidates.pros.push({ text: T.prosTotalCosts(Math.abs(diff)), weight: Math.abs(diff) });
      else if (diff > 20) candidates.cons.push({ text: T.consTotalCosts(Math.abs(diff)), weight: Math.abs(diff) });
    }

    const pros = candidates.pros.sort((a, b) => b.weight - a.weight).slice(0, MAX_PROS).map((c) => c.text);
    const cons = candidates.cons.sort((a, b) => b.weight - a.weight).slice(0, MAX_CONS).map((c) => c.text);

    return { title: property.title, pros, cons, notes };
  });
}

// ─── SVG icons (per legend + thead) ──────────────────────────────────────────

const SVG = {
  address: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-map-pinned"><path d="M18 8c0 3.613-3.869 7.429-5.393 8.795a1 1 0 0 1-1.214 0C9.87 15.429 6 11.613 6 8a6 6 0 0 1 12 0"/><circle cx="12" cy="8" r="2"/><path d="M8.714 14h-3.71a1 1 0 0 0-.948.683l-2.004 6A1 1 0 0 0 3 22h18a1 1 0 0 0 .948-1.316l-2-6a1 1 0 0 0-.949-.684h-3.712"/></svg>',
  price: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-euro"><path d="M4 10h12"/><path d="M4 14h9"/><path d="M19 6a7.7 7.7 0 0 0-5.2-2A7.9 7.9 0 0 0 6 12a7.9 7.9 0 0 0 7.8 8 7.7 7.7 0 0 0 5.2-2"/></svg>',
  surface: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-scan"><path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/></svg>',
  bedrooms: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bed-double"><path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/></svg>',
  bathrooms: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-bath"><path d="M9 6 6.5 3.5a1.5 1.5 0 0 0-1-.5C4.683 3 4 3.683 4 4.5V17a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><line x1="10" x2="8" y1="5" y2="7"/><line x1="2" x2="22" y1="12" y2="12"/><line x1="7" x2="7" y1="19" y2="21"/><line x1="17" x2="17" y1="19" y2="21"/></svg>',
  floor: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-layers-2"><path d="m16.02 12 5.48 3.13a1 1 0 0 1 0 1.74L13 21.74a2 2 0 0 1-2 0l-8.5-4.87a1 1 0 0 1 0-1.74L7.98 12"/><path d="M13 13.74a2 2 0 0 1-2 0L2.5 8.87a1 1 0 0 1 0-1.74L11 2.26a2 2 0 0 1 2 0l8.5 4.87a1 1 0 0 1 0 1.74Z"/></svg>',
  elevator: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-arrow-up-down"><path d="m21 16-4 4-4-4"/><path d="M17 20V4"/><path d="m3 8 4-4 4 4"/><path d="M7 4v16"/></svg>',
  type: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-building-2"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v6a2 2 0 0 0 2 2h2"/><path d="M18 9h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2h-2"/><path d="M10 6h4"/><path d="M10 10h4"/><path d="M10 14h4"/><path d="M10 18h4"/></svg>',
  condition: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-wrench"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/></svg>',
  energy: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-zap"><path d="M4 14a1 1 0 0 1-.78-1.63l9.9-10.2a.5.5 0 0 1 .86.46l-1.92 6.02A1 1 0 0 0 13 10h7a1 1 0 0 1 .78 1.63l-9.9 10.2a.5.5 0 0 1-.86-.46l1.92-6.02A1 1 0 0 0 11 14z"/></svg>',
  yearBuilt: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>',
  heating: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 12c2-2.96 0-7-1-8 0 3.038-1.773 4.741-3 6-1.226 1.26-2 3.24-2 5a6 6 0 1 0 12 0c0-1.532-1.056-3.94-2-5-1.786 3-2.791 3-4 2z"/></svg>',
  parking: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2"/><path d="M9 17V7h4a3 3 0 0 1 0 6H9"/></svg>',
  furnished: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v3"/><path d="M2 11v5a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a2 2 0 0 0-4 0v2H6v-2a2 2 0 0 0-4 0z"/><path d="M4 18v2"/><path d="M20 18v2"/></svg>',
  balcony: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 15V3h16v12"/><path d="M2 15h20"/><path d="M4 15v6"/><path d="M20 15v6"/><path d="M12 15v6"/><path d="M8 15v6"/><path d="M16 15v6"/></svg>',
  terrace: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v9"/><path d="m4.6 13.4 2.8-2.8"/><path d="M20 4h.01"/><path d="m16.6 13.4-2.8-2.8"/><path d="M3 17h18"/><path d="M3 21h18"/></svg>',
  garden: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 10a6 6 0 0 0 6-6H6a6 6 0 0 0 6 6z"/><path d="M12 10v8"/><path d="M2 22h20"/><path d="M7 14a4 4 0 0 0 5 0"/><path d="M12 14a4 4 0 0 0 5 0"/></svg>',
  cellar: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><rect x="9" y="13" width="6" height="8" rx="1"/></svg>',
  ac: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v10"/><path d="m4.93 10.93 1.41 1.41"/><path d="M2 18h2"/><path d="M20 18h2"/><path d="m19.07 10.93-1.41 1.41"/><path d="M22 22H2"/><path d="m8 6 4-4 4 4"/><path d="M16 18a4 4 0 0 0-8 0"/></svg>',
  contract: '<svg xmlns="http://www.w3.org/2000/svg" width="WW" height="WW" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/><path d="M14 2v4a2 2 0 0 0 2 2h4"/></svg>',
};

const ico = (key: keyof typeof SVG, w: number): string => SVG[key].replace(/WW/g, String(w));

// ─── Main builder ────────────────────────────────────────────────────────────

export function buildReportHtml(args: {
  properties: ReportProperty[];
  brand: ReportBrand;
  options: ReportOptions;
  poiDataMap?: Record<number, unknown>;
}): string {
  const { properties, brand, options } = args;
  const poiDataMap = args.poiDataMap || {};

  const today = new Date().toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' });
  const numProperties = properties.length;

  const appartamentoImageUrl = '/report/appartamento.png';

  const brandColor = brand.primaryColor || '#3b83f6';
  const brandName = brand.companyName || 'GetNearMe';
  const brandWebsite = brand.companyWebsite || 'https://getnearme.it';
  const brandEmail = brand.companyEmail || 'info@getnearme.com';
  const reportLogo = brand.logo;
  const hasCustomLogo = !!reportLogo;
  const isWhiteLabel = hasCustomLogo || !!brand.companyName;

  // coverLogoHtml built after EDIT is defined (below)

  const thanksBadgeContent = brandName;
  const customFinalTitle = brand.reportFinalTitle || '';
  const customFinalDesc = brand.reportFinalDesc || '';

  const thanksWebsiteLink = brandWebsite ? `<a href="${brandWebsite.startsWith('http') ? brandWebsite : 'https://' + brandWebsite}">${brandWebsite.replace(/^https?:\/\//, '')}</a>` : '';
  const thanksEmailLink = brandEmail ? `<a href="mailto:${brandEmail}">${brandEmail}</a>` : '';

  // sezioni
  const sec = options.sections;

  // colonne (default tutte true)
  const cols = options.columns || {};
  const colOn = (k: ReportColumnKey): boolean => cols[k] !== false;

  // ─── Editing inline ─────────────────────────────────────────────────────────
  // ed(key, testo) restituisce il testo (eventualmente sovrascritto da edits[key]).
  // In preview-editabile lo avvolge in uno span data-edit per il contenteditable.
  const edits = options.edits || {};
  const EDIT = !!options.editable;
  const ed = (key: string, text: string): string => {
    const v = edits[key] ?? text;
    return EDIT ? `<span class="gnm-ed" data-edit="${key}">${v}</span>` : v;
  };

  const allLogos = brand.allLogos || [];
  const hasLogoPicker = EDIT && hasCustomLogo && allLogos.length > 1;

  const logoPickerHtml = (() => {
    if (!hasLogoPicker) return '';
    const groups: { label: string; isWhite: boolean; items: { url: string }[] }[] = [
      { label: 'Colore', isWhite: false, items: [] },
      { label: 'Nero', isWhite: false, items: [] },
      { label: 'Bianco', isWhite: true, items: [] },
    ];
    for (const l of allLogos) {
      if (l.label.includes('Colore')) groups[0].items.push({ url: l.url });
      else if (l.label.includes('Nero')) groups[1].items.push({ url: l.url });
      else if (l.label.includes('Bianco')) groups[2].items.push({ url: l.url });
    }
    return groups.filter(g => g.items.length > 0).map(g =>
      `<div class="gnm-logo-group">` +
      `<div class="gnm-logo-group-label">${g.label}</div>` +
      `<div class="gnm-logo-group-row">` +
      g.items.map(it =>
        `<div class="gnm-logo-opt${it.url === reportLogo ? ' active' : ''}${g.isWhite ? ' dark-bg' : ''}" data-logo="${it.url}">` +
        `<img src="${it.url}" style="max-height:28px;max-width:72px;object-fit:contain;"></div>`
      ).join('') +
      `</div></div>`
    ).join('');
  })();

  const coverLogoHtml = hasCustomLogo
    ? (hasLogoPicker
      ? `<span class="gnm-logo-wrap">` +
        `<span class="gnm-logo-pencil"></span>` +
        `<img src="${reportLogo}" alt="${brandName}" style="max-height: 40px; max-width: 200px; object-fit: contain;">` +
        `<div class="gnm-logo-picker">${logoPickerHtml}</div>` +
        `</span>`
      : `<img src="${reportLogo}" alt="${brandName}" style="max-height: 40px; max-width: 200px; object-fit: contain;">`)
    : `<span class="gnm-go-brand" style="cursor:pointer">${brandName}</span>`;

  const prices = properties.map((p) => p.price || 0).filter((p) => p > 0);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 0;
  const isSingleProperty = numProperties === 1;
  const priceLabel = isSingleProperty ? 'Prezzo' : 'Fascia di prezzo';
  const priceValue = isSingleProperty
    ? (prices[0] ? `${prices[0].toLocaleString('it-IT')} €` : 'N/A')
    : (minPrice > 0 && maxPrice > 0 ? `${minPrice.toLocaleString('it-IT')} € - ${maxPrice.toLocaleString('it-IT')} €` : 'N/A');

  const prosConsRaw = generateProsCons(properties);
  const pcEdits = options.prosConsEdits || {};
  const prosConsData = prosConsRaw.map((item) => {
    const e = pcEdits[item.title];
    if (!e) return item;
    return { ...item, pros: e.pros, cons: e.cons };
  });

  const costsDetailData = properties.map((p) => {
    const costs = calculateDetailedCosts(p.price, p.surface);
    return { title: p.title, ...costs };
  });

  // ─── Colonne tabella (gating) ───────────────────────────────────────────────
  // Mappa header → cella, in ordine. naCell helper.
  const naCell = (v: unknown): string => (v === 'N/A' || v === '--' || !v) ? '<span class="na">N/A</span>' : String(v);

  type ColDef = { key: ReportColumnKey; th: string; cell: (p: PreparedProp) => string };
  const colDefs: ColDef[] = [
    { key: 'address', th: `<th>${ico('address', 12)}</th>`, cell: (p) => `<td class="prop-name"><span class="prop-name-title">${p.title}</span>${p.address ? `<span class="prop-name-addr">${p.address}</span>` : ''}</td>` },
    { key: 'price', th: `<th>${ico('price', 12)}</th>`, cell: (p) => `<td class="price">${formatPrice(p.price)}</td>` },
    { key: 'eurmq', th: '<th>€/m²</th>', cell: (p) => `<td>${(p.pricePerSqm || 0) > 0 ? (p.pricePerSqm as number).toLocaleString('it-IT') + ' €' : '<span class="na">N/A</span>'}</td>` },
    { key: 'surface', th: `<th>${ico('surface', 12)}</th>`, cell: (p) => `<td>${(p.surface || 0) > 0 ? p.surface + ' m²' : '<span class="na">N/A</span>'}</td>` },
    { key: 'rooms', th: '<th>Locali</th>', cell: (p) => `<td style="text-align: center;">${naCell(p.rooms)}</td>` },
    { key: 'bedrooms', th: `<th>${ico('bedrooms', 12)}</th>`, cell: (p) => `<td style="text-align: center;">${naCell(p.bedrooms)}</td>` },
    { key: 'bathrooms', th: `<th>${ico('bathrooms', 12)}</th>`, cell: (p) => `<td style="text-align: center;">${naCell(p.bathrooms)}</td>` },
    { key: 'floor', th: `<th>${ico('floor', 12)}</th>`, cell: (p) => `<td style="text-align: center;">${naCell(p.floorDisplay)}</td>` },
    { key: 'elevator', th: `<th>${ico('elevator', 12)}</th>`, cell: (p) => `<td style="text-align: center;">${naCell(p.elevatorDisplay)}</td>` },
    { key: 'type', th: `<th>${ico('type', 12)}</th>`, cell: (p) => `<td>${naCell(p.typeDisplay)}</td>` },
    { key: 'condition', th: `<th>${ico('condition', 12)}</th>`, cell: (p) => `<td>${naCell(p.stato)}</td>` },
    { key: 'energy', th: `<th>${ico('energy', 12)}</th>`, cell: (p) => `<td class="energy-cell"><span class="energy-badge">${p.energyDisplay}</span></td>` },
    { key: 'monthly', th: '<th>€/mese</th>', cell: (p) => `<td>${naCell(p.condominium)}</td>` },
    { key: 'total', th: '<th>Totale *</th>', cell: (p) => `<td class="total-cost">~ ${formatPrice(p.totalCosts)}</td>` },
    { key: 'yearBuilt', th: `<th>${ico('yearBuilt', 12)}</th>`, cell: (p) => `<td style="text-align:center;">${naCell(p.yearBuilt)}</td>` },
    { key: 'heating', th: `<th>${ico('heating', 12)}</th>`, cell: (p) => `<td>${naCell(p.heating)}</td>` },
    { key: 'parking', th: `<th>${ico('parking', 12)}</th>`, cell: (p) => `<td style="text-align:center;">${naCell(p.parking)}</td>` },
    { key: 'furnished', th: `<th>${ico('furnished', 12)}</th>`, cell: (p) => `<td style="text-align:center;">${naCell(p.furnished)}</td>` },
    { key: 'balcony', th: `<th>${ico('balcony', 12)}</th>`, cell: (p) => `<td style="text-align:center;">${naCell(p.balcony)}</td>` },
    { key: 'terrace', th: `<th>${ico('terrace', 12)}</th>`, cell: (p) => `<td style="text-align:center;">${naCell(p.terrace)}</td>` },
    { key: 'garden', th: `<th>${ico('garden', 12)}</th>`, cell: (p) => `<td style="text-align:center;">${naCell(p.garden)}</td>` },
    { key: 'cellar', th: `<th>${ico('cellar', 12)}</th>`, cell: (p) => `<td style="text-align:center;">${naCell(p.cellar)}</td>` },
    { key: 'ac', th: `<th>${ico('ac', 12)}</th>`, cell: (p) => `<td style="text-align:center;">${naCell(p.ac)}</td>` },
    { key: 'contract', th: `<th>${ico('contract', 12)}</th>`, cell: (p) => `<td>${naCell(p.contract)}</td>` },
  ];
  const activeCols = colDefs.filter((c) => colOn(c.key));

  // ─── Prepara righe (formattazione tipologia/piano/ascensore) ────────────────
  type PreparedProp = ReportProperty & {
    floorDisplay: string;
    elevatorDisplay: string;
    typeDisplay: string;
    energyDisplay: string;
  };

  const prepared: PreparedProp[] = properties.map((p) => {
    // energyColor calcolato come nell'estensione (parità di logica; non reso nel markup)
    void getEnergyColor(p.energyClass);
    const energyDisplay = p.energyClass && p.energyClass !== 'N/A' && p.energyClass !== '--' ? p.energyClass.toUpperCase() : 'N/A';

    const typeAbbrevMap = [
      { match: 'appartamento', abbr: 'App.' },
      { match: 'quadrilocale', abbr: 'Quadri' },
      { match: 'pentalocale', abbr: 'Penta' },
      { match: 'monolocale', abbr: 'Mono' },
      { match: 'trilocale', abbr: 'Trilo' },
      { match: 'bifamiliare', abbr: 'Bifam.' },
      { match: 'penthouse', abbr: 'Attico' },
      { match: 'villetta', abbr: 'Villetta' },
      { match: 'villa', abbr: 'Villa' },
      { match: 'attico', abbr: 'Attico' },
      { match: 'loft', abbr: 'Loft' },
      { match: 'bilocale', abbr: 'Bilocale' },
      { match: 'rustico', abbr: 'Rustico' },
      { match: 'casale', abbr: 'Casale' },
      { match: 'mansarda', abbr: 'Mansarda' },
      { match: 'palazzo', abbr: 'Palazzo' },
      { match: 'cascina', abbr: 'Cascina' },
      { match: 'cottage', abbr: 'Cottage' },
      { match: 'casa', abbr: 'Casa' },
    ];

    let typeDisplay = 'N/A';
    if (p.type && p.type !== 'N/A' && p.type !== '--') {
      const rawLower = p.type.toLowerCase();
      const found = typeAbbrevMap.find((t) => rawLower.includes(t.match));
      if (found) {
        typeDisplay = found.abbr;
      } else {
        const cleaned = p.type.split('|').map((str) => str.trim())
          .filter((str) => !/proprietà|ownership/i.test(str))
          .join(' ').trim();
        typeDisplay = cleaned || 'N/A';
      }
    }

    let floorDisplay = 'N/A';
    if (p.floor && p.floor !== 'N/A' && p.floor !== '--') {
      const floorStr = String(p.floor).toLowerCase();
      if (floorStr.includes('piano terra') || floorStr.includes('terra') || floorStr.includes('ground')) {
        floorDisplay = 'T';
      } else {
        const floorMatch = floorStr.match(/\d+/);
        floorDisplay = floorMatch ? floorMatch[0] : 'N/A';
      }
    }

    let elevatorDisplay = 'N/A';
    if (p.elevator && p.elevator !== 'N/A' && p.elevator !== '--') {
      const elLower = String(p.elevator).toLowerCase();
      if (elLower.includes('sì') || elLower === 'si' || elLower === 'yes' || elLower === '1') {
        elevatorDisplay = 'Sì';
      } else if (elLower.includes('no') || elLower === '0') {
        elevatorDisplay = 'No';
      } else {
        elevatorDisplay = p.elevator;
      }
    }

    return { ...p, floorDisplay, elevatorDisplay, typeDisplay, energyDisplay };
  });

  const tableHead = activeCols.map((c) => c.th).join('\n          ');
  const tableRows = prepared.map((p) => `
        <tr>
          ${activeCols.map((c) => c.cell(p)).join('\n          ')}
        </tr>
      `).join('');

  // ─── Legend items (gating per colonna corrispondente) ───────────────────────
  const legendItems: { key: ReportColumnKey; html: string }[] = [
    { key: 'address', html: `<div class="legend-item">${ico('address', 16)}<span>Indirizzo</span></div>` },
    { key: 'price', html: `<div class="legend-item">${ico('price', 16)}<span>Prezzo</span></div>` },
    { key: 'surface', html: `<div class="legend-item">${ico('surface', 16)}<span>Superficie</span></div>` },
    { key: 'bedrooms', html: `<div class="legend-item">${ico('bedrooms', 16)}<span>Camere da letto</span></div>` },
    { key: 'bathrooms', html: `<div class="legend-item">${ico('bathrooms', 16)}<span>Bagni</span></div>` },
    { key: 'floor', html: `<div class="legend-item">${ico('floor', 16)}<span>Piano</span></div>` },
    { key: 'elevator', html: `<div class="legend-item">${ico('elevator', 16)}<span>Ascensore</span></div>` },
    { key: 'type', html: `<div class="legend-item">${ico('type', 16)}<span>Tipologia</span></div>` },
    { key: 'condition', html: `<div class="legend-item">${ico('condition', 16)}<span>Stato</span></div>` },
    { key: 'energy', html: `<div class="legend-item">${ico('energy', 16)}<span>Classe energetica</span></div>` },
    { key: 'monthly', html: `<div class="legend-item legend-note"><span>€/mese = condominio</span></div>` },
    { key: 'yearBuilt', html: `<div class="legend-item">${ico('yearBuilt', 16)}<span>Anno costruzione</span></div>` },
    { key: 'heating', html: `<div class="legend-item">${ico('heating', 16)}<span>Riscaldamento</span></div>` },
    { key: 'parking', html: `<div class="legend-item">${ico('parking', 16)}<span>Parcheggio</span></div>` },
    { key: 'furnished', html: `<div class="legend-item">${ico('furnished', 16)}<span>Arredato</span></div>` },
    { key: 'balcony', html: `<div class="legend-item">${ico('balcony', 16)}<span>Balcone</span></div>` },
    { key: 'terrace', html: `<div class="legend-item">${ico('terrace', 16)}<span>Terrazzo</span></div>` },
    { key: 'garden', html: `<div class="legend-item">${ico('garden', 16)}<span>Giardino</span></div>` },
    { key: 'cellar', html: `<div class="legend-item">${ico('cellar', 16)}<span>Cantina</span></div>` },
    { key: 'ac', html: `<div class="legend-item">${ico('ac', 16)}<span>Climatizzazione</span></div>` },
    { key: 'contract', html: `<div class="legend-item">${ico('contract', 16)}<span>Contratto</span></div>` },
  ];
  const visibleLegend = legendItems.filter((it) => colOn(it.key));
  const LEGEND_ROW = 8;
  const legendHtml = visibleLegend.map((it, i) =>
    it.html + ((i + 1) % LEGEND_ROW === 0 && i < visibleLegend.length - 1 ? '\n      <div class="legend-break"></div>' : '')
  ).join('\n      ');

  // ─── Cover cards (per data sempre; numero immobili se multi) ─────────────────
  const coverPriceCard = `
            <div class="cover-card">
              <div class="cover-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>
                </svg>
              </div>
              <div class="cover-card-content">
                <span class="cover-card-label">${priceLabel}</span>
                <span class="cover-card-value">${priceValue}</span>
              </div>
            </div>`;

  // ─── Pro/Contro pages ───────────────────────────────────────────────────────
  const prosConsPages = (() => {
    if (!sec.prosCons) return '';
    const CARDS_PER_PAGE = 4;
    const pages: ProsCons[][] = [];
    for (let i = 0; i < prosConsData.length; i += CARDS_PER_PAGE) {
      pages.push(prosConsData.slice(i, i + CARDS_PER_PAGE));
    }
    return pages.map((pageItems, pageIdx) => `
  <div class="proscons-page">
    <div class="proscons-frame">
      <div class="proscons-header">
        <h1 class="proscons-title">Pro e Contro</h1>
        <p class="proscons-subtitle">Calcolati in base al confronto tra gli immobili selezionati.</p>
      </div>

      <div class="proscons-grid">
        ${pageItems.map((item) => `
          <div class="proscons-card">
            <div class="proscons-card-header">
              <h3 class="proscons-card-title">${item.title}</h3>
            </div>
            <div class="proscons-content">
              <div class="proscons-column">
                <h4 class="proscons-column-title pros">
                  Punti di forza
                </h4>
                ${item.pros.length > 0 ? `
                  <ul class="proscons-list">
                    ${item.pros.map((pro, pi) => `
                      <li class="gnm-pc-item" data-pc-title="${item.title}" data-pc-type="pros" data-pc-idx="${pi}">
                        <span class="gnm-pc-text gnm-ed" data-edit="pc:${item.title}:pros:${pi}">${pro}</span>
                        ${EDIT ? `<span class="gnm-pc-del" data-pc-del="1" title="Rimuovi">&times;</span>` : ''}
                      </li>
                    `).join('')}
                  </ul>
                ` : '<p class="proscons-empty">Nessuno scostamento significativo rispetto alla mediana del confronto</p>'}
                ${EDIT && item.pros.length < 4 ? `<button class="gnm-pc-add" data-pc-title="${item.title}" data-pc-type="pros">+ Aggiungi</button>` : ''}
              </div>

              <div class="proscons-divider"></div>

              <div class="proscons-column">
                <h4 class="proscons-column-title cons">
                  Aspetti da considerare
                </h4>
                ${item.cons.length > 0 ? `
                  <ul class="proscons-list">
                    ${item.cons.map((con, ci) => `
                      <li class="gnm-pc-item" data-pc-title="${item.title}" data-pc-type="cons" data-pc-idx="${ci}">
                        <span class="gnm-pc-text gnm-ed" data-edit="pc:${item.title}:cons:${ci}">${con}</span>
                        ${EDIT ? `<span class="gnm-pc-del" data-pc-del="1" title="Rimuovi">&times;</span>` : ''}
                      </li>
                    `).join('')}
                  </ul>
                ` : '<p class="proscons-empty">Nessuno scostamento significativo rispetto alla mediana del confronto</p>'}
                ${EDIT && item.cons.length < 4 ? `<button class="gnm-pc-add" data-pc-title="${item.title}" data-pc-type="cons">+ Aggiungi</button>` : ''}
              </div>
            </div>
            ${item.notes && item.notes.length > 0 ? `
              <div class="proscons-notes">
                ${item.notes.map((n) => `<span class="proscons-note">${n}</span>`).join(' · ')}
              </div>
            ` : ''}
          </div>
        `).join('')}
      </div>

      ${pageIdx === pages.length - 1 ? `
      <div class="proscons-footer">
        <p class="proscons-disclaimer">
          I punti di forza e di attenzione sono generati automaticamente sulla base di un confronto numerico tra gli immobili selezionati. Le indicazioni hanno carattere puramente informativo e non costituiscono valutazioni, consigli o raccomandazioni di alcun tipo. Immobili vicini alla mediana potrebbero non presentare elementi di rilievo.
        </p>
      </div>
      ` : ''}
    </div>
  </div>
    `).join('');
  })();

  // ─── Dettaglio Costi ────────────────────────────────────────────────────────
  const costsDetailPages = (() => {
    if (!sec.costs || !colOn('total')) return '';
    const validProperties = costsDetailData.filter((item) => {
      const prop = properties.find((p) => p.title === item.title);
      if (!prop) return false;
      if (!item.listingPrice || item.listingPrice <= 0) return false;
      const typeStr = String(prop.type || '').toLowerCase();
      if (typeStr.includes('asta') || typeStr.includes('vendita all\'asta')) return false;
      if (typeStr.includes('nuda proprietà') || typeStr.includes('nuda proprieta')) return false;
      return true;
    });

    if (validProperties.length < 2) return '';

    const COSTS_PER_PAGE = 4;
    const costPages: typeof validProperties[] = [];
    for (let i = 0; i < validProperties.length; i += COSTS_PER_PAGE) {
      costPages.push(validProperties.slice(i, i + COSTS_PER_PAGE));
    }

    return costPages.map((pageItems, pageIdx) => `
  <div class="costs-detail-page">
    <div class="costs-detail-frame">
      <div class="costs-detail-header">
        <h1 class="costs-detail-title">Dettaglio Costi</h1>
        <p class="costs-detail-subtitle">Stima indicativa dei principali costi da sostenere oltre al prezzo di acquisto</p>
      </div>

      <div class="costs-detail-grid">
        ${pageItems.map((item) => `
          <div class="costs-detail-card">
            <div class="costs-detail-card-header">
              <h3 class="costs-detail-card-title">${item.title}</h3>
            </div>
            <ul class="costs-detail-list">
              <li>
                <span class="costs-detail-label">Prezzo di partenza (annuncio)</span>
                <span class="costs-detail-value">${ed(`costs.${item.title}.price`, formatPrice(item.listingPrice))}</span>
              </li>
              <li>
                <span class="costs-detail-label">Agenzia (stima ${item.agencyPercentage}%)</span>
                <span class="costs-detail-value">${ed(`costs.${item.title}.agency`, '~ ' + formatPrice(item.agencyCost))}</span>
              </li>
              <li>
                <span class="costs-detail-label">Notaio (stima)</span>
                <span class="costs-detail-value">${ed(`costs.${item.title}.notary`, '~ ' + formatPrice(item.notaryCost))}</span>
              </li>
              <li>
                <span class="costs-detail-label">Imposte (stima ${item.taxesPercentage}%)</span>
                <span class="costs-detail-value">${ed(`costs.${item.title}.taxes`, '~ ' + formatPrice(item.taxesCost))}</span>
              </li>
              <li>
                <span class="costs-detail-label">Altri costi fissi</span>
                <span class="costs-detail-value">${ed(`costs.${item.title}.other`, '~ ' + formatPrice(item.otherCosts))}</span>
              </li>
              <li>
                <span class="costs-detail-total">Totale stimato</span>
                <span class="costs-detail-total">${ed(`costs.${item.title}.total`, '~ ' + formatPrice(item.totalEstimated))}</span>
              </li>
            </ul>
          </div>
        `).join('')}
      </div>

      ${pageIdx === costPages.length - 1 ? `
      <div class="costs-detail-footer">
        <div style="background: #F3F4F6; border-radius: 8px; padding: 12px 16px; margin-bottom: 12px;">
          <p style="font-size: 10px; font-weight: 600; color: #374151; margin: 0 0 4px;">ATTENZIONE: STIME STATISTICHE</p>
          <p style="font-size: 9px; color: #6B7280; line-height: 1.4; margin: 0;">I costi accessori (provvigioni agenzia, onorari notarili, imposte) sono calcolati su parametri medi nazionali e hanno finalità esclusivamente previsionali. Non costituiscono un preventivo vincolante. Verificare sempre i costi reali con i professionisti.</p>
        </div>
        <p class="costs-detail-disclaimer">
          Le stime sono indicative e basate su valori medi di mercato. I costi reali possono variare in base al caso specifico.
        </p>
      </div>
      ` : ''}
    </div>
  </div>
        `).join('');
  })();

  // ─── POI pages ──────────────────────────────────────────────────────────────
  const poiPagesHtml = (() => {
    if (!sec.poi) return '';
    const poiCategoryOrder = ['transport', 'supermarkets', 'pharmacies', 'healthcare', 'schools', 'parks', 'restaurants', 'dogAreas', 'nightlife'] as const;
    const poiCategoryLabels: Record<string, { it: string }> = {
      transport: { it: 'Trasporti Pubblici' },
      supermarkets: { it: 'Supermercati' },
      pharmacies: { it: 'Farmacie' },
      healthcare: { it: 'Strutture Sanitarie' },
      schools: { it: 'Scuole' },
      parks: { it: 'Parchi e Giardini' },
      restaurants: { it: 'Ristoranti e Bar' },
      dogAreas: { it: 'Aree Cani' },
      nightlife: { it: 'Vita Notturna' },
    };
    const poiCategoryStyles: Record<string, { bg: string; color: string }> = {
      transport: { bg: '#EEF2FF', color: '#6366F1' },
      supermarkets: { bg: '#FFFBEB', color: '#F59E0B' },
      pharmacies: { bg: '#ECFDF5', color: '#10B981' },
      healthcare: { bg: '#FEF2F2', color: '#EF4444' },
      schools: { bg: '#F5F3FF', color: '#8B5CF6' },
      parks: { bg: '#F0FDF4', color: '#22C55E' },
      restaurants: { bg: '#FFF7ED', color: '#F97316' },
      dogAreas: { bg: '#FAF5FF', color: '#A855F7' },
      nightlife: { bg: '#FDF2F8', color: '#EC4899' },
    };
    const poiSvgPaths: Record<string, string> = {
      transport: '<path d="M8 3.1V7a4 4 0 0 0 8 0V3.1"/><path d="m9 15-1-1"/><path d="m15 15 1-1"/><path d="M9 19c-2.8 0-5-2.2-5-5v-4a8 8 0 0 1 16 0v4c0 2.8-2.2 5-5 5Z"/><path d="m8 19-2 3"/><path d="m16 19 2 3"/>',
      supermarkets: '<path d="M16 10a4 4 0 0 1-8 0"/><path d="M3.103 6.034h17.794"/><path d="M3.4 5.467a2 2 0 0 0-.4 1.2V20a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6.667a2 2 0 0 0-.4-1.2l-2-2.667A2 2 0 0 0 17 2H7a2 2 0 0 0-1.6.8z"/>',
      pharmacies: '<path d="M5 12h14"/><path d="M12 5v14"/>',
      healthcare: '<path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/>',
      schools: '<path d="M14 21v-3a2 2 0 0 0-4 0v3"/><path d="M18 5v16"/><path d="m4 6 7.106-3.79a2 2 0 0 1 1.788 0L20 6"/><path d="m6 11-3.52 2.147a1 1 0 0 0-.48.854V19a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-5a1 1 0 0 0-.48-.853L18 11"/><path d="M6 5v16"/><circle cx="12" cy="9" r="2"/>',
      parks: '<path d="m17 14 3 3.3a1 1 0 0 1-.7 1.7H4.7a1 1 0 0 1-.7-1.7L7 14h-.3a1 1 0 0 1-.7-1.7L9 9h-.2A1 1 0 0 1 8 7.3L12 3l4 4.3a1 1 0 0 1-.8 1.7H15l3 3.3a1 1 0 0 1-.7 1.7H17Z"/><path d="M12 22v-3"/>',
      restaurants: '<path d="M10 2v2"/><path d="M14 2v2"/><path d="M16 8a1 1 0 0 1 1 1v8a4 4 0 0 1-4 4H7a4 4 0 0 1-4-4V9a1 1 0 0 1 1-1h14a4 4 0 1 1 0 8h-1"/><path d="M6 2v2"/>',
      dogAreas: '<path d="M11.25 16.25h1.5L12 17z"/><path d="M16 14v.5"/><path d="M4.42 11.247A13.152 13.152 0 0 0 4 14.556C4 18.728 7.582 21 12 21s8-2.272 8-6.444a11.702 11.702 0 0 0-.493-3.309"/><path d="M8 14v.5"/><path d="M8.5 8.5c-.384 1.05-1.083 2.028-2.344 2.5-1.931.722-3.576-.297-3.656-1-.113-.994 1.177-6.53 4-7 1.923-.321 3.651.845 3.651 2.235A7.497 7.497 0 0 1 14 5.277c0-1.39 1.844-2.598 3.767-2.277 2.823.47 4.113 6.006 4 7-.08.703-1.725 1.722-3.656 1-1.261-.472-1.855-1.45-2.239-2.5"/>',
      nightlife: '<path d="M9 18V5l12-2v13"/><circle cx="6" cy="18" r="3"/><circle cx="18" cy="16" r="3"/>',
    };
    const poiIcon = (cat: string): string => {
      const st = poiCategoryStyles[cat];
      return `<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="${st.color}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${poiSvgPaths[cat]}</svg>`;
    };
    const mapPinSvg = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="flex-shrink:0"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>';

    type Poi = { name?: string; distance: number };
    type PoiData = Record<string, Poi[]> | null;
    const map = poiDataMap as Record<number, PoiData>;
    const hasAnyPoi = Object.values(map).some((d) => d !== null && d !== undefined);
    if (!hasAnyPoi) return '';

    const formatDist = (m: number): string => (m < 1000 ? m + ' m' : (m / 1000).toFixed(1) + ' km');
    const escName = (n?: string): string => (n || '-').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

    if (isSingleProperty) {
      const poiData = map[0];
      if (!poiData) return '';
      const col1 = ['transport', 'supermarkets', 'pharmacies'];
      const col2 = ['healthcare', 'schools', 'parks'];
      const col3 = ['restaurants', 'dogAreas', 'nightlife'];
      const renderCards = (cats: string[]): string => cats.map((catKey) => {
        const st = poiCategoryStyles[catKey];
        const label = poiCategoryLabels[catKey]?.it || catKey;
        const pois = poiData[catKey];
        if (!Array.isArray(pois) || pois.length === 0) return '';
        const shown = pois.slice(0, 6);
        const rest = pois.length - 6;
        return '<div class="poi-single-card">' +
          '<div class="poi-single-card-head">' +
            '<div class="poi-cat-icon" style="background:' + st.bg + ';color:' + st.color + '">' + poiIcon(catKey) + '</div>' +
            '<span class="poi-single-card-label">' + label + '</span>' +
            '<span class="poi-single-card-count">' + pois.length + '</span>' +
          '</div>' +
          shown.map((p) => '<div class="poi-single-row"><span class="poi-single-name">' + escName(p.name) + '</span><span class="poi-single-dist">' + formatDist(p.distance) + '</span></div>').join('') +
          (rest > 0 ? '<div class="poi-single-more">+' + rest + ' altri</div>' : '') +
        '</div>';
      }).join('');

      const addr = properties[0]?.address || properties[0]?.title || '';
      return '<div class="poi-page">' +
        '<div class="poi-header"><div>' +
          '<h1 class="poi-title">Punti di Interesse</h1>' +
          '<p class="poi-subtitle">Servizi e strutture entro 1 km' + (addr ? ' — ' + addr : '') + '</p>' +
        '</div>' +
        '<div class="poi-radius-badge">' + mapPinSvg + ' Raggio 1 km</div></div>' +
        '<div class="poi-single-wrap">' +
          '<div class="poi-single-col">' + renderCards(col1) + '</div>' +
          '<div class="poi-single-col">' + renderCards(col2) + '</div>' +
          '<div class="poi-single-col">' + renderCards(col3) + '</div>' +
        '</div>' +
        '<div class="poi-footer"><p class="poi-disclaimer">Dati OpenStreetMap (Overpass API). Distanze calcolate in linea d\'aria dal punto dell\'immobile.</p></div>' +
      '</div>';
    }

    const COLS_PER_PAGE = 6;
    const poiPages: { prop: ReportProperty; idx: number }[][] = [];
    for (let i = 0; i < properties.length; i += COLS_PER_PAGE) {
      poiPages.push(properties.slice(i, i + COLS_PER_PAGE).map((p, j) => ({ prop: p, idx: i + j })));
    }

    return poiPages.map((pageProps) => {
      const allData = pageProps.map(({ idx }) => map[idx]);
      const thCells = pageProps.map(({ prop }) => '<th style="background:' + brandColor + '"><span class="th-name">' + (prop.title || '') + '</span><span class="th-addr">' + (prop.address || '') + '</span></th>').join('');
      const tbodyRows = poiCategoryOrder.map((catKey) => {
        const st = poiCategoryStyles[catKey];
        const label = poiCategoryLabels[catKey]?.it || catKey;
        const counts = allData.map((d) => (d && Array.isArray(d[catKey])) ? d[catKey].length : 0);
        const maxCount = Math.max(...counts);
        return '<tr><td><div class="poi-cat-cell"><div class="poi-cat-icon" style="background:' + st.bg + ';color:' + st.color + '">' + poiIcon(catKey) + '</div><span class="poi-cat-label">' + label + '</span></div></td>' +
          allData.map((d) => {
            const pois = d && Array.isArray(d[catKey]) ? d[catKey] : [];
            const cnt = pois.length;
            if (cnt === 0) return '<td><span class="poi-cell-zero">—</span></td>';
            const nearest = pois[0];
            const isBest = cnt === maxCount && pageProps.length > 1;
            return '<td><div class="poi-cell' + (isBest ? ' poi-cell-best' : '') + '"><span class="poi-cell-count">' + cnt + '</span><span class="poi-cell-nearest-dist">' + formatDist(nearest.distance) + '</span><span class="poi-cell-name">' + escName(nearest.name) + '</span></div></td>';
          }).join('') +
        '</tr>';
      }).join('');

      return '<div class="poi-page">' +
        '<div class="poi-header"><div>' +
          '<h1 class="poi-title">Punti di Interesse</h1>' +
          '<p class="poi-subtitle">Numero di servizi e strutture entro 1 km da ogni immobile</p>' +
        '</div>' +
        '<div class="poi-radius-badge">' + mapPinSvg + ' Raggio 1 km</div></div>' +
        '<table class="poi-table"><thead><tr>' +
          '<th style="background:' + brandColor + '">Categoria</th>' +
          thCells +
        '</tr></thead><tbody>' + tbodyRows + '</tbody></table>' +
        '<div class="poi-footer"><p class="poi-disclaimer">Dati OpenStreetMap (Overpass API). Distanze in linea d\'aria. Sotto ogni conteggio: distanza e nome del servizio più vicino. Il valore più alto per categoria è evidenziato in blu.</p></div>' +
      '</div>';
    }).join('');
  })();

  // ─── Markup completo ─────────────────────────────────────────────────────────
  return `
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="UTF-8">
  <title>Comparazione Immobili - GetNearMe</title>
  <style>
    @page {
      size: A4 landscape;
      margin: 0;
    }

    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
      color-adjust: exact !important;
    }

    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
      color: #1a1a1a;
      background: #FFFFFF;
      margin: 0;
      padding: 0;
      font-size: 11px;
      line-height: 1.4;
    }

    .cover-page {
      width: 100vw;
      height: 100vh;
      background: #F5F5F5;
      padding: 16px;
      box-sizing: border-box;
      page-break-after: always;
      page-break-inside: avoid;
      display: flex;
      align-items: stretch;
      justify-content: stretch;
      position: relative;
      z-index: 9999;
    }

    .cover-frame {
      flex: 1;
      border: 1px solid #D9D9D9;
      border-radius: 12px;
      background: transparent;
      position: relative;
      padding: 34px;
      display: flex;
      flex-direction: column;
    }

    .cover-header {
      display: flex;
      justify-content: flex-end;
      align-items: flex-start;
    }

    .cover-logo {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 600;
      font-size: 14px;
      color: ${brandColor};
    }

    .cover-logo a {
      color: ${brandColor};
      text-decoration: none;
    }

    .cover-logo a:hover {
      text-decoration: underline;
    }

    .cover-powered a {
      color: #000;
      text-decoration: none;
    }

    .cover-powered a:hover {
      text-decoration: underline;
    }

    .cover-powered strong a {
      color: #000;
      font-weight: 500;
    }

    .cover-badge {
      display: inline-block;
      padding: 6px 16px;
      border: 1px solid ${brandColor};
      border-radius: 11px;
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 500;
      font-size: 11px;
      color: ${brandColor};
      margin-bottom: 6px;
      width: fit-content;
    }

    .cover-main {
      display: flex;
      flex: 1;
      gap: 40px;
      margin-top: 12px;
      align-items: center;
    }

    .cover-left {
      flex: 0 0 auto;
      max-width: 450px;
      display: flex;
      flex-direction: column;
    }

    .cover-title {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 600;
      font-size: 32px;
      color: #000;
      margin-bottom: 2px;
      margin-top: 0;
    }

    .cover-subtitle {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 400;
      font-size: 16px;
      color: #000;
      line-height: 24px;
      max-width: 420px;
      margin-bottom: 12px;
    }

    .cover-cards {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .cover-card {
      display: flex;
      align-items: center;
      gap: 14px;
      background: white;
      border: 1px solid #f1f1f1;
      border-radius: 10px;
      padding: 12px;
      width: 340px;
    }

    .cover-card-icon {
      width: 40px;
      height: 40px;
      background: ${hexToRgba(brandColor, 0.1)};
      border: 0.5px solid ${hexToRgba(brandColor, 0.5)};
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .cover-card-icon svg {
      width: 18px;
      height: 18px;
      color: ${brandColor};
      stroke: ${brandColor};
    }

    .cover-card-content {
      display: flex;
      flex-direction: column;
    }

    .cover-card-label {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 400;
      font-size: 11px;
      color: rgba(0, 0, 0, 0.6);
      line-height: 14px;
      margin-bottom: 4px;
    }

    .cover-card-value {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 600;
      font-size: 18px;
      color: #000;
      line-height: 22px;
    }

    .cover-right {
      flex: 1;
      display: flex;
      align-items: flex-start;
      justify-content: center;
      padding-top: 10px;
    }

    .cover-image {
      width: 100%;
      max-width: 780px;
      height: auto;
      object-fit: contain;
      mix-blend-mode: multiply;
    }

    .cover-footer {
      position: absolute;
      bottom: 16px;
      left: 34px;
      right: 34px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .cover-tagline {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 400;
      font-size: 9px;
      color: rgba(0, 0, 0, 0.5);
      line-height: 14px;
    }

    .cover-footer-arrow {
      color: rgba(0, 0, 0, 0.4);
      flex-shrink: 0;
    }
    .cover-footer-arrow svg {
      width: 24px;
      height: 24px;
    }

    .cover-disclaimer {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 400;
      font-size: 9px;
      color: rgba(0, 0, 0, 0.5);
      line-height: 14px;
      text-align: right;
    }


    .cover-validity-notice {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 9px;
      color: rgba(0, 0, 0, 0.45);
      line-height: 1.4;
      margin-top: 12px;
      max-width: 500px;
    }

    .content-page {
      background: #FFFFFF;
      padding: 24px;
      position: relative;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }

    .page-header {
      margin-bottom: 18px;
    }

    .page-title {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 600;
      font-size: 24px;
      color: #000;
      margin: 0 0 4px 0;
    }

    .page-subtitle {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 400;
      font-size: 14px;
      color: #000;
      margin: 0;
    }

    .table-divider {
      border: none;
      border-top: 1px solid #F3F3F3;
      margin: 0;
    }

    .table-legend {
      display: flex;
      flex-wrap: wrap;
      gap: 0;
      align-items: center;
      justify-content: center;
      padding: 18px 0;
    }
    .table-legend .legend-break {
      flex-basis: 100%; height: 0;
      border-top: 1px solid #F3F3F3;
      margin: 18px 0;
    }

    .table-divider-bottom {
      border: none;
      border-top: 1px solid #F3F3F3;
      margin: 0 0 18px 0;
    }

    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 12px;
      color: #000;
      padding: 0 20px;
    }

    .legend-item svg {
      width: 16px;
      height: 16px;
      flex-shrink: 0;
    }

    .header {
      display: none;
    }

    h1 {
      font-size: 32px;
      font-weight: 600;
      color: #111827;
      margin-bottom: 8px;
    }

    .subtitle {
      font-size: 15px;
      color: #6b7280;
      margin-bottom: 4px;
    }

    .date {
      font-size: 13px;
      color: #9ca3af;
    }

    .table-container {
      margin: 0;
      background: white;
      border-radius: 0;
      border: none;
      overflow: visible;
    }

    table {
      width: 100%;
      border-collapse: separate;
      border-spacing: 0;
      font-size: 10px;
      font-family: 'Inter', -apple-system, sans-serif;
      border: 1px solid #F3F3F3;
      border-radius: 8px;
      overflow: hidden;
    }

    thead {
      background: ${brandColor};
      color: white;
    }

    thead tr {
      height: 36px;
    }

    th {
      padding: 8px 12px;
      text-align: center;
      font-weight: 500;
      font-size: 10px;
      vertical-align: middle;
      border-right: 1px solid rgba(255, 255, 255, 0.3);
      position: relative;
    }

    th:first-child {
      border-top-left-radius: 8px;
    }

    th:last-child {
      border-right: none;
      border-top-right-radius: 8px;
    }

    th svg {
      width: 12px;
      height: 12px;
      display: inline-block;
      vertical-align: middle;
      margin-bottom: 2px;
    }

    td {
      padding: 12px;
      vertical-align: middle;
      border-bottom: 1px solid #F3F3F3;
      border-right: 1px solid #F3F3F3;
      text-align: center;
      font-size: 10px;
    }

    td:first-child {
      text-align: left;
    }

    td:last-child {
      border-right: none;
    }

    tbody tr:last-child td:first-child {
      border-bottom-left-radius: 8px;
    }

    tbody tr:last-child td:last-child {
      border-bottom-right-radius: 8px;
    }

    tbody tr:last-child td {
      border-bottom: 1px solid #F3F3F3;
    }

    tbody tr {
      background: white;
    }

    tbody tr:nth-child(even) {
      background: ${hexToRgba(brandColor, 0.05)};
    }

    thead th:first-child {
      border-left: none;
    }

    thead th:last-child {
      border-right: none;
    }

    tbody td:first-child {
      border-left: none;
    }

    tbody td:last-child {
      border-right: none;
    }

    .prop-name {
      font-weight: 600;
      color: #111827;
      max-width: 160px;
    }

    .prop-name-title {
      display: block;
      font-weight: 600;
      color: #111827;
    }

    .prop-name-addr {
      display: block;
      font-weight: 400;
      font-size: 9px;
      color: #9ca3af;
      margin-top: 2px;
    }

    .price {
      color: ${brandColor};
      font-weight: 600;
    }

    .total-cost {
      font-weight: 600;
    }

    .na {
      opacity: 0.5;
    }

    .energy-cell {
      text-align: center;
    }

    .energy-badge {
      display: inline-block;
      color: #000;
      font-weight: 400;
      font-size: 12px;
      text-align: center;
    }

    .table-footer {
      margin-top: auto;
      padding-top: 32px;
      display: flex;
      gap: 0;
    }

    .footer-section {
      flex: 1;
      padding-right: 20px;
    }

    .footer-section:first-child {
      border-right: 1px solid #F3F3F3;
      padding-right: 20px;
      margin-right: 20px;
    }

    .footer-section h4 {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 600;
      font-size: 9px;
      color: #000;
      margin-bottom: 12px;
      text-transform: none;
      letter-spacing: normal;
    }

    .footer-section p {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 400;
      font-size: 9px;
      color: rgba(0, 0, 0, 0.5);
      line-height: 17px;
      margin-bottom: 8px;
    }

    .footer-section ul {
      list-style: disc;
      margin-left: 12px;
      margin-bottom: 8px;
    }

    .footer-section li {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 400;
      font-size: 9px;
      color: rgba(0, 0, 0, 0.5);
      line-height: 17px;
      margin-bottom: 0;
    }

    body {
      user-select: none;
      -webkit-user-select: none;
    }
    img {
      pointer-events: none;
      -webkit-user-drag: none;
    }

    .proscons-page {
      width: 100%;
      min-height: 100vh;
      background: #F5F5F5;
      padding: 16px;
      box-sizing: border-box;
      page-break-after: always;
      page-break-inside: avoid;
    }

    .proscons-frame {
      background: #F5F5F5;
      border: 1px solid #D9D9D9;
      border-radius: 12px;
      padding: 24px 32px 32px 32px;
      box-sizing: border-box;
      min-height: calc(100vh - 32px);
      display: flex;
      flex-direction: column;
    }

    .proscons-header {
      margin-bottom: 24px;
    }

    .proscons-title {
      font-size: 28px;
      font-weight: 600;
      color: #000;
      margin: 0 0 8px 0;
    }

    .proscons-subtitle {
      font-size: 14px;
      font-weight: 400;
      color: rgba(0, 0, 0, 0.6);
      margin: 0;
    }

    .proscons-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;
      flex: 1;
    }

    .proscons-card {
      background: #FFFFFF;
      border-radius: 12px;
      padding: 14px 20px 20px 20px;
      display: flex;
      flex-direction: column;
    }

    .proscons-card-header {
      border-bottom: 1px solid #F3F3F3;
      padding-top: 0;
      padding-bottom: 12px;
      margin-bottom: 20px;
    }

    .proscons-card-title {
      font-size: 14px;
      font-weight: 600;
      color: #000;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .proscons-content {
      display: flex;
      gap: 20px;
      flex: 1;
    }

    .proscons-column {
      flex: 1;
      display: flex;
      flex-direction: column;
    }

    .proscons-column-title {
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 0 0 6px 0;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .proscons-column-title.pros {
      color: #059669;
    }

    .proscons-column-title.cons {
      color: #dc2626;
    }

    .proscons-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .proscons-list li {
      font-size: 11px;
      line-height: 16px;
      color: #333;
      padding: 10px 0;
      border-bottom: 1px solid #F7F7F7;
    }

    .proscons-list li:last-child {
      border-bottom: none;
    }

    .proscons-list .bullet {
      flex-shrink: 0;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      margin-top: 6px;
    }

    .proscons-list .bullet.pro {
      background-color: #059669;
    }

    .proscons-list .bullet.con {
      background-color: #dc2626;
    }

    .proscons-empty {
      font-size: 11px;
      color: rgba(0, 0, 0, 0.4);
      font-style: italic;
      margin: 0;
      padding-top: 16px;
      padding-bottom: 0;
      padding-left: 0;
      padding-right: 0;
    }

    .proscons-notes {
      padding: 6px 12px 0;
      font-size: 9px;
      color: rgba(0, 0, 0, 0.45);
      font-style: italic;
    }

    .proscons-divider {
      width: 1px;
      background: #F3F3F3;
      margin: 0 10px;
    }

    .proscons-footer {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #E5E5E5;
    }

    .proscons-disclaimer {
      font-size: 9px;
      line-height: 14px;
      color: rgba(0, 0, 0, 0.5);
      margin: 0;
    }

    .costs-detail-page {
      width: 100%;
      min-height: 100vh;
      background: #F5F5F5;
      padding: 16px;
      box-sizing: border-box;
      page-break-after: always;
      page-break-inside: avoid;
    }

    .costs-detail-frame {
      background: #F5F5F5;
      border: 1px solid #D9D9D9;
      border-radius: 12px;
      padding: 20px 24px 24px 24px;
      box-sizing: border-box;
      min-height: calc(100vh - 32px);
      display: flex;
      flex-direction: column;
    }

    .costs-detail-header {
      margin-bottom: 32px;
    }

    .costs-detail-title {
      font-size: 24px;
      font-weight: 600;
      color: #000;
      margin: 0 0 4px 0;
    }

    .costs-detail-subtitle {
      font-size: 12px;
      font-weight: 400;
      color: rgba(0, 0, 0, 0.6);
      margin: 0;
    }

    .costs-detail-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 8px;
      align-items: start;
    }

    .costs-detail-card {
      background: #FFFFFF;
      border-radius: 10px;
      padding: 12px 16px 12px 16px;
      display: flex;
      flex-direction: column;
    }

    .costs-detail-card-header {
      border-bottom: 1px solid #F3F3F3;
      padding-top: 0;
      padding-bottom: 8px;
      margin-bottom: 12px;
    }

    .costs-detail-card-title {
      font-size: 12px;
      font-weight: 600;
      color: #000;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .costs-detail-list {
      list-style: none;
      padding: 0;
      margin: 0;
    }

    .costs-detail-list li {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 0;
      border-bottom: 1px solid #F7F7F7;
      font-size: 10px;
      line-height: 14px;
    }

    .costs-detail-list li:last-child {
      border-bottom: none;
      border-top: 1px solid #F3F3F3;
      margin-top: 0;
      padding-top: 6px;
      padding-bottom: 0;
      font-weight: 600;
    }

    .costs-detail-label {
      color: rgba(0, 0, 0, 0.6);
    }

    .costs-detail-value {
      color: #000;
      font-weight: 500;
    }
    .costs-detail-value .gnm-ed { margin-right: 16px; }
    .costs-detail-total .gnm-ed { margin-right: 16px; }

    .costs-detail-total {
      color: #000;
      font-weight: 600;
      font-size: 10px;
    }

    .costs-detail-footer {
      margin-top: auto;
      padding-top: 12px;
      border-top: 1px solid #E5E5E5;
    }

    .costs-detail-disclaimer {
      font-size: 9px;
      line-height: 14px;
      color: rgba(0, 0, 0, 0.5);
      margin: 0;
    }

    .legal-page {
      width: 100%;
      min-height: 100vh;
      background: #F5F5F5;
      padding: 24px;
      box-sizing: border-box;
      page-break-after: always;
      page-break-inside: avoid;
    }

    .legal-header {
      margin-bottom: 24px;
    }

    .legal-title {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 600;
      font-size: 24px;
      color: #000;
      margin: 0 0 4px 0;
    }

    .legal-content {
      display: flex;
      flex-direction: column;
      gap: 24px;
    }

    .legal-section {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .legal-section h4 {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 600;
      font-size: 12px;
      color: #000;
      margin: 0 0 6px 0;
      text-transform: none;
      letter-spacing: normal;
    }

    .legal-section p {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 400;
      font-size: 11px;
      color: rgba(0, 0, 0, 0.5);
      line-height: 18px;
      margin: 0 0 8px 0;
    }

    .legal-section ul {
      list-style: disc;
      margin-left: 12px;
      margin-bottom: 8px;
        padding: 0;
    }

    .legal-section li {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 400;
      font-size: 11px;
      color: rgba(0, 0, 0, 0.5);
      line-height: 18px;
      margin-bottom: 0;
    }

    .thanks-page {
      width: 100%;
      min-height: 100vh;
      background: #F5F5F5;
      padding: 12px;
      box-sizing: border-box;
      page-break-inside: avoid;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
    }

    .thanks-frame {
      background: #FFFFFF;
      border: 1px solid #F1F1F1;
      border-radius: 8px;
      padding: 60px 80px;
      box-sizing: border-box;
      width: 100%;
      height: 100%;
      min-height: calc(100vh - 24px);
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
    }

    .thanks-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .thanks-badge {
      display: inline-block;
      padding: 6px 20px;
      border: 1px solid ${brandColor};
      border-radius: 14px;
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 500;
      font-size: 12px;
      color: ${brandColor};
      margin-bottom: 16px;
    }

    .thanks-title {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 600;
      font-size: 24px;
      color: #000;
      margin: 0 0 8px 0;
    }

    .thanks-text {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 400;
      font-size: 14px;
      color: #000;
      line-height: 24px;
      margin: 0 0 16px 0;
      max-width: 600px;
    }

    .thanks-text:last-of-type {
      margin-bottom: 0;
    }

    .thanks-links {
      margin-top: auto;
      margin-bottom: 32px;
      display: flex;
      gap: 24px;
      align-items: center;
    }

    .thanks-links a {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 400;
      font-size: 12px;
      color: rgba(0, 0, 0, 0.5);
      text-decoration: none;
      line-height: 18px;
    }

    .thanks-links a:hover {
      text-decoration: underline;
    }

    .powered-by-footer {
      position: absolute;
      bottom: 40px;
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 10px;
      color: rgba(0, 0, 0, 0.4);
    }

    .powered-by-footer a {
      color: rgba(0, 0, 0, 0.5);
      text-decoration: none;
    }

    .powered-by-footer a:hover {
      text-decoration: underline;
    }

    .poi-page {
      width: 100%;
      min-height: 100vh;
      padding: 32px 40px;
      background: #fff;
      page-break-after: always;
      position: relative;
      box-sizing: border-box;
    }

    .poi-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .poi-title {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 700;
      font-size: 20px;
      color: #111827;
      margin: 0 0 4px 0;
    }

    .poi-subtitle {
      font-family: 'Inter', -apple-system, sans-serif;
      font-weight: 400;
      font-size: 11px;
      color: #6B7280;
      margin: 0;
    }

    .poi-radius-badge {
      display: flex;
      align-items: center;
      gap: 4px;
      background: rgba(59, 131, 246, 0.06);
      border: 1px solid rgba(59, 131, 246, 0.15);
      border-radius: 20px;
      padding: 4px 12px;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 10px;
      font-weight: 500;
      color: #3B83F6;
      white-space: nowrap;
    }

    .poi-table {
      width: 100%;
      border-collapse: collapse;
      font-family: 'Inter', -apple-system, sans-serif;
    }

    .poi-table thead th {
      padding: 10px 12px;
      font-size: 11px;
      font-weight: 600;
      color: #fff;
      text-align: center;
      vertical-align: middle;
    }

    .poi-table thead th:first-child {
      border-radius: 8px 0 0 0;
      text-align: left;
    }

    .poi-table thead th:last-child {
      border-radius: 0 8px 0 0;
    }

    .poi-table .th-name {
      display: block;
      font-weight: 600;
      font-size: 11px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .poi-table .th-addr {
      display: block;
      font-weight: 400;
      font-size: 9px;
      opacity: 0.8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .poi-table tbody td {
      padding: 8px 12px;
      border-bottom: 1px solid #F3F4F6;
      text-align: center;
      vertical-align: middle;
    }

    .poi-table tbody td:first-child {
      text-align: left;
    }

    .poi-table tbody tr:last-child td {
      border-bottom: none;
    }

    .poi-cat-cell {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .poi-cat-icon {
      width: 28px;
      height: 28px;
      border-radius: 6px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .poi-cat-icon svg {
      width: 14px;
      height: 14px;
    }

    .poi-cat-label {
      font-size: 11px;
      font-weight: 500;
      color: #374151;
    }

    .poi-cell {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1px;
    }

    .poi-cell-count {
      font-size: 16px;
      font-weight: 700;
      color: #374151;
    }

    .poi-cell-best .poi-cell-count {
      color: #3B83F6;
    }

    .poi-cell-nearest-dist {
      font-size: 9px;
      color: #6B7280;
    }

    .poi-cell-name {
      font-size: 8px;
      color: #9CA3AF;
      max-width: 120px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .poi-cell-zero {
      color: #D1D5DB;
      font-size: 12px;
    }

    .poi-footer {
      margin-top: 12px;
    }

    .poi-disclaimer {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 8px;
      color: #9CA3AF;
      margin: 0;
    }

    .poi-single-wrap {
      display: flex;
      gap: 16px;
      flex: 1;
    }

    .poi-single-col {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    .poi-single-card {
      border: 1px solid #E5E7EB;
      border-radius: 10px;
      padding: 14px 16px;
    }

    .poi-single-card-head {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-bottom: 10px;
    }

    .poi-single-card-label {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 11px;
      font-weight: 600;
      color: #374151;
    }

    .poi-single-card-count {
      margin-left: auto;
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 10px;
      font-weight: 700;
      color: #3B83F6;
      background: rgba(59, 131, 246, 0.08);
      border-radius: 10px;
      padding: 2px 8px;
    }

    .poi-single-row {
      display: flex;
      justify-content: space-between;
      padding: 3px 0;
    }

    .poi-single-name {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 9px;
      color: #4B5563;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      flex: 1;
      min-width: 0;
    }

    .poi-single-dist {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 9px;
      font-weight: 500;
      color: #9CA3AF;
      flex-shrink: 0;
      margin-left: 12px;
    }

    .poi-single-more {
      font-family: 'Inter', -apple-system, sans-serif;
      font-size: 8px;
      color: #9CA3AF;
      font-style: italic;
      margin-top: 4px;
    }

    ${EDIT ? `
    /* Editing inline */
    .gnm-ed { position: relative; display: block; width: fit-content; max-width: 100%; cursor: text; border-radius: 4px; transition: background .15s, box-shadow .15s; }
    .gnm-ed:hover { background: ${hexToRgba(brandColor, 0.08)}; box-shadow: 0 0 0 2px ${hexToRgba(brandColor, 0.25)}; }
    .gnm-ed:hover::after { background-color: ${hexToRgba(brandColor, 0.85)}; transform: scale(1.1); transition: transform .15s, background-color .15s; }
    .gnm-ed::after {
      content: '';
      position: absolute; top: -10px; right: -10px;
      width: 22px; height: 22px; border-radius: 99px;
      background-color: ${brandColor};
      background-repeat: no-repeat; background-position: center; background-size: 13px 13px;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'/></svg>");
      box-shadow: 0 1px 4px rgba(0,0,0,.3);
      pointer-events: none;
    }
    .gnm-ed[contenteditable="true"] { outline: none; background: #fff; box-shadow: 0 0 0 2px ${brandColor}; }
    .gnm-ed[contenteditable="true"]::after { display: none; }

    /* Pro/con item editing */
    .gnm-pc-item { display: flex; align-items: center; gap: 6px; }
    .gnm-pc-item .gnm-pc-text { flex: 1; min-width: 0; }
    .gnm-pc-del { display: none; cursor: pointer; color: #ccc; font-size: 18px; line-height: 1; padding: 0 4px; border-radius: 4px; flex-shrink: 0; }
    .gnm-pc-del:hover { color: #ef4444; background: rgba(239,68,68,.08); }
    .gnm-pc-item:hover .gnm-pc-del { display: inline-flex; }
    .gnm-pc-add { display: block; margin-top: 8px; background: none; border: 1.5px dashed ${brandColor}; border-radius: 6px; padding: 8px 12px; font-size: 11px; color: ${brandColor}; cursor: pointer; width: 100%; text-align: center; }
    .gnm-pc-add:hover { background: ${hexToRgba(brandColor, 0.06)}; }
    .gnm-logo-wrap {
      display: inline-flex; align-items: center; gap: 8px;
      cursor: pointer; position: relative;
    }
    .gnm-logo-pencil {
      width: 22px; height: 22px; border-radius: 99px; flex-shrink: 0;
      background-color: ${brandColor};
      background-repeat: no-repeat; background-position: center; background-size: 13px 13px;
      background-image: url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='white' stroke-width='2.2' stroke-linecap='round' stroke-linejoin='round'><path d='M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4Z'/></svg>");
      box-shadow: 0 1px 4px rgba(0,0,0,.2);
    }
    .gnm-logo-picker {
      display: none; position: absolute; top: calc(100% + 8px); z-index: 200;
      right: calc(100% - 30px);
      background: #fff; border-radius: 12px; box-shadow: 0 4px 24px rgba(0,0,0,.12);
      padding: 12px; min-width: 200px;
    }
    .gnm-logo-picker.open { display: block; }
    .gnm-logo-group { margin-bottom: 10px; }
    .gnm-logo-group:last-child { margin-bottom: 0; }
    .gnm-logo-group-label {
      font-family: 'Inter', -apple-system, sans-serif; font-size: 10px; font-weight: 600;
      color: #999; text-transform: uppercase; letter-spacing: .04em; margin-bottom: 6px;
    }
    .gnm-logo-group-row { display: flex; gap: 6px; }
    .gnm-logo-opt {
      display: flex; align-items: center; justify-content: center;
      padding: 8px 12px; border-radius: 8px; cursor: pointer;
      border: 2.5px solid transparent; background: #f5f5f5;
    }
    .gnm-logo-opt:hover { background: #eee; }
    .gnm-logo-opt.active { border-color: ${brandColor}; background: #fff; box-shadow: 0 0 0 1px ${hexToRgba(brandColor, 0.2)}; }
    .gnm-logo-opt.dark-bg { background: #1a1a1a; }
    .gnm-logo-opt.dark-bg:hover { background: #2a2a2a; }
    .gnm-logo-opt.dark-bg.active { background: #222; border-color: ${brandColor}; }
    @media print {
      .gnm-ed:hover { background: none; box-shadow: none; } .gnm-ed::after { display: none !important; }
      .gnm-pc-del { display: none !important; }
      .gnm-pc-add { display: none !important; }
      .gnm-logo-pencil { display: none !important; }
      .gnm-logo-picker { display: none !important; }
    }
    ` : ''}

  </style>

</head>
<body>
  ${sec.cover ? `
  <div class="cover-page">
    <div class="cover-frame">
      <div class="cover-header">
        <span class="cover-logo">${coverLogoHtml}</span>
  </div>

      <div class="cover-main">
        <div class="cover-left">
          <span class="cover-badge">${ed('cover.badge', 'Report')}</span>
          <h1 class="cover-title">${ed('cover.title', 'Confronto immobiliare')}</h1>
          <p class="cover-subtitle">${ed('cover.subtitle', 'Report di analisi comparativa basato su dati oggettivi, costi stimati e caratteristiche principali degli immobili selezionati.')}</p>

          <div class="cover-cards">
            ${coverPriceCard}

            <div class="cover-card">
              <div class="cover-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M8 2v4"/><path d="M16 2v4"/><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M3 10h18"/>
                </svg>
              </div>
              <div class="cover-card-content">
                <span class="cover-card-label">Data report</span>
                <span class="cover-card-value">${today}</span>
              </div>
            </div>
            ${!isSingleProperty ? `
            <div class="cover-card">
              <div class="cover-card-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <rect width="16" height="20" x="4" y="2" rx="2" ry="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>
                </svg>
              </div>
              <div class="cover-card-content">
                <span class="cover-card-label">Numero di immobili analizzati</span>
                <span class="cover-card-value">${numProperties}</span>
              </div>
            </div>
            ` : ''}
          </div>
        </div>

        <div class="cover-right">
          <img class="cover-image" src="${appartamentoImageUrl}" alt="Building" />
        </div>
      </div>

      <div class="cover-footer">
        <span class="cover-tagline">Strumento di supporto decisionale per l'analisi immobiliare</span>
        <span class="cover-footer-arrow">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="m6 9 6 6 6-6"/>
          </svg>
        </span>
        <span class="cover-disclaimer">I valori riportati sono stime indicative basate<br>sui dati disponibili al momento dell'analisi.</span>
      </div>
    </div>
  </div>
  ` : ''}

  ${sec.table ? `
  <div class="content-page">
    <div class="page-header">
      <h2 class="page-title">Tabella comparativa</h2>
      <p class="page-subtitle">Confronto delle caratteristiche</p>
    </div>

    <div class="table-divider"></div>

    <div class="table-legend">
      ${legendHtml}
    </div>

    <div class="table-divider-bottom"></div>

  <div class="table-container">
    <table>
      <thead>
        <tr>
          ${tableHead}
        </tr>
      </thead>
      <tbody>
        ${tableRows}
      </tbody>
    </table>
  </div>

    <div class="table-footer">
      ${colOn('total') ? `<div class="footer-section">
        <h4>Totale stimato *</h4>
        <p>Il totale stimato rappresenta una proiezione indicativa del costo complessivo associato all'acquisto dell'immobile. Include, ove disponibili o stimabili, i principali costi accessori comunemente sostenuti, come ad esempio:</p>
        <ul>
          <li>provvigione dell'agenzia immobiliare</li>
          <li>costi notarili e/o legali</li>
          <li>imposte e oneri fiscali</li>
          <li>perizia bancaria</li>
          <li>assicurazioni obbligatorie o comunemente richieste</li>
    </ul>
        <p>Le stime si basano su valori medi di mercato e non tengono conto di situazioni specifiche, agevolazioni fiscali, accordi privati o condizioni particolari.</p>
    </div>` : ''}

      <div class="footer-section">
        <h4>Avvertenze e note informative</h4>
        <p>La classe energetica non è stata verificata tramite attestazioni ufficiali (APE) e può differire da quella effettiva. Le spese mensili indicate (ad esempio spese condominiali) sono valori dichiarati o stimati e possono variare in base alla gestione dell'immobile, al regolamento condominiale e all'utilizzo effettivo.</p>
      </div>
    </div>
  </div>
  ` : ''}

  ${prosConsPages}

  ${costsDetailPages}

  ${poiPagesHtml}

  ${sec.legal ? `
  <div class="legal-page">
    <div class="legal-header">
      <h1 class="legal-title">Note informative e limitazioni</h1>
    </div>

    <div class="legal-content">
      ${colOn('total') ? `<div class="legal-section">
        <h4>Totale stimato</h4>
        <p>Il Totale stimato rappresenta una stima indicativa del costo complessivo associato all'acquisto dell'immobile. Include, ove disponibili o stimabili, i principali costi accessori comunemente sostenuti in una compravendita immobiliare, quali:</p>
        <ul>
          <li>provvigione dell'agenzia immobiliare</li>
          <li>costi notarili e/o legali</li>
          <li>imposte e oneri fiscali</li>
          <li>perizia bancaria</li>
          <li>assicurazioni obbligatorie o comunemente richieste</li>
        </ul>
        <p>Le stime si basano su valori medi di mercato e hanno finalità esclusivamente informative. Il Totale stimato non costituisce un preventivo né un'offerta vincolante.</p>
      </div>` : ''}

      <div class="legal-section">
        <h4>Affidabilità dei dati</h4>
        <p style="font-style: italic; color: #6B7280;">I dati contenuti in questo report rappresentano un'istantanea della sessione di navigazione del ${today}. GetNearMe non garantisce l'aggiornamento in tempo reale di prezzi o disponibilità successivi alla generazione di questa schermata.</p>
        <p>Le informazioni contenute nel presente report derivano da dati pubblicamente disponibili, informazioni presenti negli annunci immobiliari analizzati e da elaborazioni automatiche basate su parametri medi.</p>
        <p>In particolare:</p>
        <ul>
          <li>la classe energetica indicata non è stata verificata tramite attestazioni ufficiali (APE) e potrebbe differire da quella effettiva;</li>
          <li>le spese mensili riportate (ad esempio spese condominiali) sono valori dichiarati o stimati e possono variare nel tempo;</li>
          <li>eventuali costi legati al mutuo (interessi, spese bancarie, imposte o condizioni contrattuali) non sono inclusi, salvo diversa indicazione;</li>
          <li>eventuali inesattezze o omissioni presenti negli annunci di origine possono riflettersi nei dati riportati.</li>
        </ul>
      </div>

      <div class="legal-section">
        <h4>Finalità del report</h4>
        <p>Il presente documento ha finalità informativa e comparativa e non sostituisce verifiche tecniche, legali, fiscali o finanziarie effettuate da professionisti abilitati. GetNearMe non garantisce l'accuratezza, completezza o aggiornamento dei dati e non assume responsabilità per decisioni prese sulla base delle informazioni contenute nel report.</p>
      </div>
    </div>
  </div>
  ` : ''}

  ${sec.thanks ? `
  <div class="thanks-page">
    <div class="thanks-frame">
      <div class="thanks-content">
        <div class="thanks-badge">${thanksBadgeContent}</div>

        <h1 class="thanks-title">${ed('thanks.title', customFinalTitle || 'Grazie per aver utilizzato questo report')}</h1>

        ${customFinalDesc ? `<p class="thanks-text">${ed('thanks.desc', customFinalDesc)}</p>` : `
        <p class="thanks-text">${ed('thanks.p1', 'Grazie per aver utilizzato GetNearMe come supporto nella valutazione degli immobili analizzati. Questo report è stato generato per aiutarti a confrontare più opzioni in modo chiaro e consapevole, mettendo a disposizione dati, stime indicative e analisi comparative.')}</p>

        <p class="thanks-text">${ed('thanks.p2', 'Ci auguriamo che le informazioni contenute siano state utili nel tuo percorso decisionale.')}</p>

        <p class="thanks-text">${ed('thanks.p3', 'Ricorda che ogni scelta immobiliare è unica e che questo documento ha finalità informative. Per valutazioni definitive, è sempre consigliabile confrontarsi con professionisti qualificati.')}</p>
        `}
      </div>

      <div class="thanks-links">
        ${thanksWebsiteLink}
        ${thanksEmailLink}
      </div>
      ${isWhiteLabel ? `<div class="powered-by-footer">Powered by <a href="https://getnearme.it">GetNearMe</a></div>` : ''}
    </div>
  </div>
  ` : ''}
  ${EDIT ? `<script>
  (function(){
    var nodes = document.querySelectorAll('.gnm-ed');
    nodes.forEach(function(el){
      el.addEventListener('click', function(e){
        if (e.target.hasAttribute('data-pc-del')) return;
        if (el.getAttribute('contenteditable') === 'true') return;
        el.setAttribute('contenteditable', 'true');
        el.focus();
        var r = document.createRange(); r.selectNodeContents(el);
        var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(r);
      });
      el.addEventListener('keydown', function(e){
        if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); el.blur(); }
        if (e.key === 'Escape') { el.blur(); }
      });
      el.addEventListener('blur', function(){
        el.removeAttribute('contenteditable');
        var key = el.getAttribute('data-edit');
        var text = el.innerText.replace(/\\u00a0/g,' ').trim();
        if (key.startsWith('pc:')) {
          parent.postMessage({ type: 'gnm-pc-edit', key: key, text: text }, '*');
        } else {
          parent.postMessage({ type: 'gnm-edit', key: key, text: text }, '*');
        }
      });
    });
    document.querySelectorAll('.gnm-pc-del').forEach(function(btn){
      btn.addEventListener('click', function(e){
        e.stopPropagation();
        var li = btn.closest('.gnm-pc-item');
        if (!li) return;
        parent.postMessage({ type: 'gnm-pc-del', title: li.dataset.pcTitle, pcType: li.dataset.pcType, idx: parseInt(li.dataset.pcIdx) }, '*');
      });
    });
    document.querySelectorAll('.gnm-pc-add').forEach(function(btn){
      btn.addEventListener('click', function(){
        parent.postMessage({ type: 'gnm-pc-add', title: btn.dataset.pcTitle, pcType: btn.dataset.pcType }, '*');
      });
    });
    var logoWrap = document.querySelector('.gnm-logo-wrap');
    if (logoWrap) {
      var picker = logoWrap.querySelector('.gnm-logo-picker');
      logoWrap.addEventListener('click', function(e) {
        var opt = e.target.closest && e.target.closest('.gnm-logo-opt');
        if (opt) {
          parent.postMessage({ type: 'gnm-logo-change', logo: opt.dataset.logo }, '*');
          picker.classList.remove('open');
          return;
        }
        if (!picker.contains(e.target)) picker.classList.toggle('open');
      });
      document.addEventListener('click', function(e) {
        if (!logoWrap.contains(e.target)) picker.classList.remove('open');
      });
    }
  })();
  </script>` : ''}
  <script>
  (function(){
    // Nav sempre attiva: i link non devono navigare DENTRO l'iframe (niente trappola).
    document.addEventListener('click', function(e){
      var brand = e.target.closest && e.target.closest('.gnm-go-brand');
      if (brand) { e.preventDefault(); parent.postMessage({ type: 'gnm-nav-brand' }, '*'); return; }
      var a = e.target.closest && e.target.closest('a[href]');
      if (a) {
        var href = a.getAttribute('href') || '';
        if (href.indexOf('http') === 0) { e.preventDefault(); window.open(href, '_blank', 'noopener'); }
      }
    });
  })();
  </script>
</body>
</html>
    `;
}
