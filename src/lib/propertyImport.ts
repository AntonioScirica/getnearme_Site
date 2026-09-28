// Logica import immobili da CSV/Excel, condivisa tra vecchia dashboard
// (ImportProjectsModal) e nuova piattaforma (platform/ImportView).
// Backend: /api/projects/map-columns (AI) + /api/projects/import.

import * as XLSX from 'xlsx';
import { ALL_FIELDS, type Field } from './propertyFields';

// Contratto API concordato col backend.
export type ImportRow = {
  riferimento?: string;
  nome: string;
  addr?: string;
  prezzo?: number;
  mq?: number;
  locali?: number;
  camere?: number;
  bagni?: number;
  descrizione?: string;
  titolo?: string;
  tipologia?: string;
  photoUrl?: string;
  photoUrls?: string[]; // piu' URL nella cella foto: il server usa la prima raggiungibile
  url?: string; // link dell'annuncio sul portale: l'import lo legge (ZenRows) e prende dati e foto da li'
  _raw?: Record<string, unknown>; // riga originale completa (salvata per report futuri)
  details?: Record<string, unknown>; // campi della scheda (classe energetica, piano, riscaldamento...) gia' normalizzati
};

export type ImportResult = { created: number; updated: number; skipped: number; errors: string[] };

// Campi target -> etichetta UI + sinonimi header (IT/EN, case-insensitive).
export type TargetKey = keyof ImportRow;
// Sinonimi in ORDINE DI PRIORITA' (il primo che matcha vince). Coprono i formati
// reali: Agenzia generico, GestIm, Getrix (header con underscore, typo "meti", ecc.)
export const TARGET_FIELDS: { key: TargetKey; label: string; required?: boolean; synonyms: string[] }[] = [
  { key: 'riferimento', label: 'Riferimento', synonyms: ['rif_interno', 'codice_agenzia', 'codice_getrix', 'id_gestim', 'id_annuncio', 'cod_procedura', 'riferimento', 'codice annuncio', 'codice', 'rif', 'ref', 'id'] },
  { key: 'nome', label: 'Nome', required: true, synonyms: ['nome', 'denominazione', 'name', 'titolo breve', 'immobile'] },
  { key: 'addr', label: 'Indirizzo', synonyms: ['indirizzo', 'via', 'dove si trova', 'ubicazione', 'localita', 'località', 'comune', 'città', 'citta', 'address'] },
  { key: 'prezzo', label: 'Prezzo', synonyms: ['prezzo_attuale', 'prezzo_euro', 'prezzo richiesto', 'prezzo_richiesto', 'prezzo_base', 'prezzo', 'soldi', 'price', 'importo'] },
  { key: 'mq', label: 'Superficie (mq)', synonyms: ['superficie_mq', 'meti_quadri', 'metri_quadri', 'metri quadri', 'superficie commerciale', 'superficie', 'mq', 'quadri', 'sqm', 'size'] },
  { key: 'locali', label: 'Locali', synonyms: ['numero_vani', 'numero vani', 'locali', 'vani', 'rooms'] },
  { key: 'camere', label: 'Camere', synonyms: ['numero_camere', 'camere da letto', 'camere', 'bedrooms'] },
  { key: 'bagni', label: 'Bagni', synonyms: ['numero_bagni', 'numero bagni', 'bagni', 'bathrooms', 'wc'] },
  { key: 'descrizione', label: 'Descrizione', synonyms: ['descrizione_it', 'descrizione per i clienti', 'descrizione', 'testo_annuncio', 'testo annuncio', 'description'] },
  { key: 'titolo', label: 'Titolo', synonyms: ['titolo', 'title', 'headline'] },
  { key: 'tipologia', label: 'Tipologia', synonyms: ['tipo_immobile', 'tipologia', 'tipo immobile', 'cosa è', 'cosa e', 'tipo', 'category', 'typology'] },
  { key: 'photoUrl', label: 'Foto / URL', synonyms: ['url foto', 'foto url', 'foto', 'immagine', 'photo', 'image', 'cover', 'foto1', 'immagine1'] },
  { key: 'url', label: 'Link annuncio', synonyms: ['link annuncio', 'url annuncio', 'link immobiliare', 'url immobiliare', 'link idealista', 'link portale', 'url portale', 'annuncio', 'link', 'url', 'listing url'] },
];

// Campi della scheda oltre a quelli base: nella mappatura hanno chiave "d:<campo>".
const BASE_COVERED = new Set(['tipologia', 'indirizzo', 'prezzo', 'superficie', 'locali', 'camere', 'bagni', 'riferimento', 'mostra_indirizzo', 'trattativa_riservata'])
export const DETAIL_FIELDS: Field[] = ALL_FIELDS.filter(f => !BASE_COVERED.has(f.key))
// sinonimi tipici dei gestionali (oltre all'etichetta del campo)
const DETAIL_SYNONYMS: Record<string, string[]> = {
  contratto: ['contratto', 'tipo contratto', 'vendita/affitto', 'causale'],
  classe_energetica: ['classe energetica', 'classe_energetica', 'ape', 'classe'],
  ipe: ['ipe', 'epgl', 'indice prestazione'],
  piano: ['piano'],
  anno: ['anno costruzione', 'anno_costruzione', 'anno'],
  stato: ['stato immobile', 'condizioni', 'stato'],
  spese_condominiali: ['spese condominiali', 'spese_condominiali', 'condominio'],
  riscaldamento: ['riscaldamento', 'tipo riscaldamento'],
  climatizzazione: ['aria condizionata', 'climatizzazione', 'condizionatore'],
  ascensore: ['ascensore'],
  posto_auto: ['posto auto', 'box', 'garage', 'posto_auto'],
  cantina: ['cantina'],
  arredato: ['arredato', 'arredamento'],
  esposizione: ['esposizione'],
  piani_edificio: ['piani edificio', 'piani_edificio', 'totale piani'],
  superficie_esterna: ['superficie esterna', 'giardino mq', 'terrazzo mq'],
  virtual_tour: ['virtual tour', 'tour virtuale', 'matterport'],
}

const fold = (v: unknown) => String(v ?? '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim()
const YES = /^(si|s|yes|y|true|1|x|presente|incluso|incluse)$/
const NO = /^(no|n|false|0|assente|non presente)$/
// Valore della cella -> valore del campo della scheda (null = non riconosciuto: si lascia vuoto)
export function normalizeDetail(f: Field, raw: unknown): unknown {
  const t = fold(raw)
  if (!t) return null
  if (f.type === 'toggle') return YES.test(t) ? true : NO.test(t) ? false : null
  if (f.type === 'number' || f.type === 'stepper') { const n = parseNumeric(raw); return n === undefined ? null : n }
  if (f.type === 'text') return String(raw).trim()
  const opts = f.options ?? []
  const match = (x: string) => {
    const y = fold(x).replace(/^classe\s+/, '')
    return opts.find(o => fold(o) === y) ?? opts.find(o => fold(o).startsWith(y) || y.startsWith(fold(o))) ?? opts.find(o => y.length >= 3 && fold(o).includes(y)) ?? null
  }
  if (f.type === 'multi') { const v = t.split(/[,;|/]+/).map(x => match(x.trim())).filter(Boolean); return v.length ? [...new Set(v)] : null }
  return match(t)
}

const NUMERIC_FIELDS: TargetKey[] = ['prezzo', 'mq', 'locali', 'camere', 'bagni'];

// "€ 350.000" -> 350000 ; "95 m²" -> 95
function parseNumeric(raw: unknown): number | undefined {
  if (raw === null || raw === undefined || raw === '') return undefined;
  if (typeof raw === 'number') return Number.isFinite(raw) ? raw : undefined;
  const digits = String(raw).replace(/[^\d]/g, '');
  if (!digits) return undefined;
  const n = Number(digits);
  return Number.isFinite(n) ? n : undefined;
}

function cleanString(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  return String(raw).trim();
}

// Auto-map iniziale per nome header (case-insensitive su sinonimi).
export function autoMapColumns(cols: string[]): Record<string, string> {
  const norm = (v: string) => v.trim().toLowerCase();
  const tokens = (v: string) => norm(v).split(/[^a-z0-9²]+/).filter(Boolean);
  // Match header<->sinonimo: esatto, o parola intera, o substring per sinonimi
  // lunghi (>=4) cosi "Prezzo richiesto"/"Superficie commerciale mq"/"Camere da
  // letto" vengono riconosciuti senza che "id" matchi dentro "indirizzo".
  const matchSyn = (col: string, syn: string) => {
    const n = norm(col);
    return n === syn || tokens(col).includes(syn) || (syn.length >= 4 && n.includes(syn));
  };
  const map: Record<string, string> = {};
  const used = new Set<string>();
  for (const field of TARGET_FIELDS) {
    let found = '';
    // Sinonimi in ordine di priorita': il primo che trova una colonna vince.
    for (const syn of field.synonyms) {
      const col = cols.find((c) => !used.has(c) && matchSyn(c, syn));
      if (col) { found = col; break; }
    }
    map[field.key] = found;
    if (found) used.add(found);
  }
  // campi della scheda: sinonimi + etichetta del campo, solo colonne non gia' usate
  for (const f of DETAIL_FIELDS) {
    const syns = [...(DETAIL_SYNONYMS[f.key] ?? []), fold(f.label)]
    const col = syns.map(syn => cols.find(c => !used.has(c) && matchSyn(c, syn))).find(Boolean) ?? ''
    map[`d:${f.key}`] = col
    if (col) used.add(col)
  }
  // I file agenzia raramente hanno una colonna "Nome": fallback su titolo,
  // indirizzo o riferimento (puo' condividere la colonna con quei campi).
  if (!map['nome']) map['nome'] = map['titolo'] || map['addr'] || map['riferimento'] || cols[0] || '';
  return map;
}

// Costruisce le ImportRow valide e conta quelle scartate (senza nome).
export function buildImportRows(rawRows: Record<string, unknown>[], mapping: Record<string, string>): { rows: ImportRow[]; skippedClient: number } {
  const nameCol = mapping['nome'];
  if (!nameCol) return { rows: [], skippedClient: 0 };
  const rows: ImportRow[] = [];
  let skippedClient = 0;
  for (const r of rawRows) {
    const nome = cleanString(r[nameCol]);
    if (!nome) { skippedClient++; continue; }
    const row: ImportRow = { nome, _raw: r };
    for (const field of TARGET_FIELDS) {
      if (field.key === 'nome') continue;
      const col = mapping[field.key];
      if (!col) continue;
      const val = r[col];
      if (field.key === 'photoUrl') {
        // tutte le foto: la cella mappata (anche con piu' URL separati da , ; | spazio) e ogni altra colonna
        // foto/immagine (foto1, foto2...). Il server usa la prima raggiungibile come copertina e le salva tutte.
        const photoCols = [col, ...Object.keys(r).filter(k => k !== col && /foto|immagin|photo|image|img/i.test(k))];
        const urls = photoCols.flatMap(k => String(r[k] ?? '').match(/https?:\/\/[^\s,;|"']+/g) ?? []);
        if (urls.length) row.photoUrls = [...new Set(urls)];
      } else if (NUMERIC_FIELDS.includes(field.key)) {
        const num = parseNumeric(val);
        if (num !== undefined) (row as Record<string, unknown>)[field.key] = num;
      } else if (field.key === 'url') {
        const u = String(val ?? '').match(/https?:\/\/[^\s,;|"']+/)?.[0];
        if (u) row.url = u;
      } else {
        const str = cleanString(val);
        if (str) (row as Record<string, unknown>)[field.key] = str;
      }
    }
    const details: Record<string, unknown> = {};
    for (const f of DETAIL_FIELDS) {
      const col = mapping[`d:${f.key}`];
      if (!col) continue;
      const v = normalizeDetail(f, r[col]);
      if (v !== null && v !== undefined) details[f.key] = v;
    }
    if (Object.keys(details).length) row.details = details;
    rows.push(row);
  }
  return { rows, skippedClient };
}

// Legge la prima scheda di un .xlsx/.xls/.csv. CSV italiano usa ';': lo leggo come
// testo e lascio che SheetJS rilevi il delimitatore.
export async function readSheet(file: File): Promise<Record<string, unknown>[]> {
  const buf = await file.arrayBuffer();
  const wb = /\.csv$/i.test(file.name)
    ? XLSX.read(new TextDecoder('utf-8').decode(new Uint8Array(buf)), { type: 'string' })
    : XLSX.read(buf, { type: 'array' });
  const sheet = wb.Sheets[wb.SheetNames[0]];
  return sheet ? XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' }) : [];
}

// Affina la mappatura con l'AI (solo header + 1 riga). null se fallisce: resta l'euristica.
export async function aiMapColumns(cols: string[], sample: Record<string, unknown>, token?: string): Promise<Record<string, string> | null> {
  try {
    const res = await fetch('/api/projects/map-columns', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify({ headers: cols, sample }),
    });
    if (!res.ok) return null;
    return ((await res.json()) as { mapping: Record<string, string> }).mapping;
  } catch {
    return null;
  }
}
