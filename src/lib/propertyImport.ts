// Logica import immobili da CSV/Excel, condivisa tra vecchia dashboard
// (ImportProjectsModal) e nuova piattaforma (platform/ImportView).
// Backend: /api/projects/map-columns (AI) + /api/projects/import.

import * as XLSX from 'xlsx';

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
  _raw?: Record<string, unknown>; // riga originale completa (salvata per report futuri)
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
];

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
        // La cella foto puo' contenere piu' URL (separati da , ; | spazio): li
        // estraggo tutti; il server prova in ordine e tiene il primo raggiungibile.
        const urls = String(val ?? '').match(/https?:\/\/[^\s,;|]+/g);
        if (urls && urls.length) row.photoUrls = urls;
      } else if (NUMERIC_FIELDS.includes(field.key)) {
        const num = parseNumeric(val);
        if (num !== undefined) (row as Record<string, unknown>)[field.key] = num;
      } else {
        const str = cleanString(val);
        if (str) (row as Record<string, unknown>)[field.key] = str;
      }
    }
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
