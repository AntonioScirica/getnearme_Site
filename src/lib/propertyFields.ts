// Schema unico dei dati di un immobile (tutto cio' che chiedono immobiliare.it / idealista).
// Da qui nascono il form "Crea da zero", l'indicatore di completezza e la pagina della casa.
// I valori vivono in projects.import_data.details (colonne base: prezzo, mq, locali, camere, bagni).

export type FieldType = 'chips' | 'multi' | 'number' | 'stepper' | 'toggle' | 'text' | 'select';

export type Field = {
  key: string;
  label: string;
  type: FieldType;
  options?: string[];
  unit?: string;
  placeholder?: string;
  hint?: string;
  weight?: number;                       // peso nell'indicatore di completezza (0 = non conta)
  when?: (d: Details) => boolean;        // campo visibile solo se... (es. solo affitto)
};

export type Group = { id: string; title: string; hint: string; fields: Field[] };

export type Details = Record<string, string | number | boolean | string[] | undefined>;

const isRent = (d: Details) => d.contratto === 'Affitto';

// --- Essenziali (step 1): pochi, obbligatori o quasi -------------------------------------
export const ESSENTIALS: Field[] = [
  { key: 'contratto', label: 'Contratto', type: 'chips', options: ['Vendita', 'Affitto'], weight: 5 },
  { key: 'tipologia', label: 'Tipologia', type: 'chips', weight: 5, options: ['Appartamento', 'Attico', 'Mansarda', 'Loft', 'Villa', 'Villetta a schiera', 'Casa indipendente', 'Terratetto', 'Rustico / Casale'] },
  { key: 'indirizzo', label: 'Indirizzo', type: 'text', placeholder: 'Via Roma 12, Milano', weight: 5 },
  { key: 'mostra_indirizzo', label: 'Mostra l\'indirizzo esatto nell\'annuncio', type: 'toggle', hint: 'Se spento mostriamo solo zona e città.' },
  { key: 'prezzo', label: 'Prezzo', type: 'number', unit: '€', weight: 5 },
  { key: 'trattativa_riservata', label: 'Trattativa riservata', type: 'toggle' },
  { key: 'superficie', label: 'Superficie commerciale', type: 'number', unit: 'm²', weight: 5 },
  { key: 'locali', label: 'Locali', type: 'stepper', weight: 3 },
  { key: 'camere', label: 'Camere da letto', type: 'stepper', weight: 3 },
  { key: 'bagni', label: 'Bagni', type: 'stepper', weight: 3 },
  { key: 'piano', label: 'Piano', type: 'select', weight: 3, options: ['Seminterrato', 'Piano terra', 'Rialzato', '1°', '2°', '3°', '4°', '5°', '6° o superiore', 'Ultimo piano', 'Su più livelli'] },
];

// --- Dettagli (step 3): tutti opzionali, a gruppi, quasi solo tap -------------------------
export const GROUPS: Group[] = [
  {
    id: 'edificio', title: 'Stato ed edificio', hint: 'Lo stato è tra i primi filtri usati da chi cerca.',
    fields: [
      { key: 'stato', label: 'Stato', type: 'chips', weight: 4, options: ['Nuovo / In costruzione', 'Ottimo / Ristrutturato', 'Buono / Abitabile', 'Da ristrutturare'] },
      { key: 'anno', label: 'Anno di costruzione', type: 'number', placeholder: '1975', weight: 2 },
      { key: 'piani_edificio', label: 'Piani dell\'edificio', type: 'stepper', weight: 1 },
      { key: 'ascensore', label: 'Ascensore', type: 'toggle', weight: 2 },
      { key: 'proprieta', label: 'Tipo di proprietà', type: 'chips', options: ['Intera proprietà', 'Nuda proprietà', 'Parziale proprietà'], weight: 1 },
    ],
  },
  {
    id: 'energia', title: 'Energia e impianti', hint: 'La classe energetica è obbligatoria per legge negli annunci.',
    fields: [
      { key: 'classe_energetica', label: 'Classe energetica', type: 'chips', weight: 5, options: ['A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G', 'In attesa'] },
      { key: 'ipe', label: 'Indice prestazione energetica (IPE)', type: 'number', unit: 'kWh/m²a', weight: 1 },
      { key: 'riscaldamento', label: 'Riscaldamento', type: 'chips', options: ['Autonomo', 'Centralizzato', 'Assente'], weight: 3 },
      { key: 'alimentazione', label: 'Alimentazione', type: 'chips', options: ['Metano', 'Pompa di calore', 'Teleriscaldamento', 'Gasolio', 'GPL', 'Elettrico'], weight: 1, when: d => d.riscaldamento !== 'Assente' },
      { key: 'emissione', label: 'Terminali', type: 'chips', options: ['Radiatori', 'A pavimento', 'Fan coil'], weight: 1, when: d => d.riscaldamento !== 'Assente' },
      { key: 'climatizzazione', label: 'Aria condizionata', type: 'chips', options: ['Autonoma', 'Centralizzata', 'Predisposizione', 'Assente'], weight: 2 },
      { key: 'infissi', label: 'Infissi', type: 'chips', options: ['Doppio vetro', 'Triplo vetro', 'Vetro singolo'], weight: 1 },
      { key: 'materiale_infissi', label: 'Materiale infissi', type: 'chips', options: ['Legno', 'PVC', 'Alluminio', 'Legno / Alluminio'], weight: 1 },
    ],
  },
  {
    id: 'interni', title: 'Interni', hint: 'Qui nascono i dettagli che fanno la differenza nella descrizione.',
    fields: [
      { key: 'cucina', label: 'Cucina', type: 'chips', options: ['Abitabile', 'A vista', 'Angolo cottura', 'Cucinotto'], weight: 2 },
      { key: 'arredato', label: 'Arredamento', type: 'chips', options: ['Arredato', 'Parzialmente arredato', 'Non arredato'], weight: 2 },
      { key: 'esposizione', label: 'Esposizione', type: 'multi', options: ['Nord', 'Sud', 'Est', 'Ovest'], weight: 2 },
      { key: 'dotazioni', label: 'Dotazioni', type: 'multi', weight: 2, options: ['Parquet', 'Porta blindata', 'Impianto d\'allarme', 'Fibra ottica', 'Domotica', 'Camino', 'Ripostiglio', 'Cabina armadio', 'Lavanderia', 'Taverna', 'Soppalco', 'Videocitofono'] },
    ],
  },
  {
    id: 'esterni', title: 'Esterni e pertinenze', hint: 'Balconi, box e cantine sono tra le ricerche più usate.',
    fields: [
      { key: 'esterni', label: 'Spazi esterni', type: 'multi', options: ['Balcone', 'Terrazzo', 'Giardino privato', 'Giardino condominiale', 'Cortile', 'Piscina'], weight: 3 },
      { key: 'superficie_esterna', label: 'Superficie esterna', type: 'number', unit: 'm²', weight: 1, when: d => Array.isArray(d.esterni) && d.esterni.length > 0 },
      { key: 'posto_auto', label: 'Box o posto auto', type: 'chips', options: ['Nessuno', 'Box singolo', 'Box doppio', 'Posto auto coperto', 'Posto auto scoperto'], weight: 3 },
      { key: 'cantina', label: 'Cantina', type: 'toggle', weight: 1 },
    ],
  },
  {
    id: 'condominio', title: 'Condominio e costi', hint: 'Le spese sono la domanda numero uno al telefono.',
    fields: [
      { key: 'spese_condominiali', label: 'Spese condominiali', type: 'number', unit: '€/mese', weight: 4 },
      { key: 'portineria', label: 'Portineria', type: 'chips', options: ['Intera giornata', 'Mezza giornata', 'Assente'], weight: 1 },
      { key: 'accesso_disabili', label: 'Accesso disabili', type: 'toggle', weight: 1 },
    ],
  },
  {
    id: 'disponibilita', title: 'Disponibilità', hint: 'Chi cerca vuole sapere quando può entrare.',
    fields: [
      { key: 'disponibilita', label: 'Disponibilità', type: 'chips', options: ['Libero subito', 'Libero al rogito', 'Occupato', 'Da concordare'], weight: 2 },
      { key: 'contratto_affitto', label: 'Tipo di contratto', type: 'chips', options: ['4+4', '3+2 concordato', 'Transitorio', 'Per studenti'], weight: 3, when: isRent },
      { key: 'cauzione', label: 'Cauzione', type: 'stepper', unit: 'mensilità', weight: 2, when: isRent },
      { key: 'spese_incluse', label: 'Spese condominiali incluse nel canone', type: 'toggle', weight: 1, when: isRent },
    ],
  },
  {
    id: 'extra', title: 'Riferimenti e media', hint: 'Facoltativi, utili per ritrovare l\'annuncio.',
    fields: [
      { key: 'riferimento', label: 'Codice di riferimento', type: 'text', placeholder: 'es. RIF-1024' },
      { key: 'virtual_tour', label: 'Link virtual tour o video', type: 'text', placeholder: 'https://...', weight: 1 },
    ],
  },
];

export const ALL_FIELDS: Field[] = [...ESSENTIALS, ...GROUPS.flatMap(g => g.fields)];

const filled = (v: Details[string]) =>
  v !== undefined && v !== null && v !== '' && v !== false && !(Array.isArray(v) && v.length === 0);

export const visible = (f: Field, d: Details) => !f.when || f.when(d);

// Completezza 0-100 + i campi mancanti che pesano di piu' (per suggerire cosa aggiungere).
export function completeness(d: Details, photos: number): { score: number; missing: Field[] } {
  const fields = ALL_FIELDS.filter(f => (f.weight ?? 0) > 0 && visible(f, d));
  const photoWeight = 8;
  const total = fields.reduce((s, f) => s + (f.weight ?? 0), 0) + photoWeight;
  const got = fields.reduce((s, f) => s + (filled(d[f.key]) ? f.weight ?? 0 : 0), 0) + Math.min(photos, 12) / 12 * photoWeight;
  const missing = fields.filter(f => !filled(d[f.key])).sort((a, b) => (b.weight ?? 0) - (a.weight ?? 0));
  return { score: Math.round((got / total) * 100), missing };
}

// Valore leggibile per la pagina della casa.
export function formatValue(f: Field, v: Details[string]): string | null {
  if (!filled(v)) return null;
  if (f.type === 'toggle') return 'Sì';
  if (Array.isArray(v)) return v.join(', ');
  if (typeof v === 'number') return `${v.toLocaleString('it-IT')}${f.unit ? ` ${f.unit}` : ''}`;
  return f.unit && /^\d/.test(String(v)) ? `${v} ${f.unit}` : String(v);
}

// Coppie etichetta/valore di un gruppo, solo campi compilati e visibili.
export function groupFacts(g: Group, d: Details): { label: string; value: string }[] {
  return g.fields
    .filter(f => visible(f, d) && f.key !== 'riferimento')
    .map(f => ({ label: f.label, value: formatValue(f, d[f.key]) }))
    .filter((x): x is { label: string; value: string } => !!x.value);
}

// Gli immobili salvati prima di questo schema hanno campi sparsi in import_data: li normalizzo.
export function detailsFrom(importData: Record<string, unknown> | null | undefined): Details {
  const i = (importData ?? {}) as Record<string, unknown>;
  const legacy = (i.info ?? {}) as Record<string, unknown>;
  const d: Details = { ...((i.details as Details) ?? {}) };
  const set = (k: string, v: unknown) => { if (d[k] === undefined && v !== undefined && v !== null && v !== '') d[k] = v as Details[string]; };
  set('contratto', i.contratto);
  set('piano', i.piano);
  set('classe_energetica', i.classe);
  set('spese_condominiali', legacy.condominium);
  set('riscaldamento', legacy.riscaldamento);
  set('anno', legacy.yearBuilt);
  set('esposizione', legacy.esposizione);
  set('stato', legacy.stato);
  set('posto_auto', legacy.parking);
  if (d.dotazioni === undefined && Array.isArray(i.caratteristiche)) d.dotazioni = i.caratteristiche as string[];
  return d;
}

// Colori ufficiali APE, dalla A4 (verde) alla G (rosso).
// scritta leggibile sopra un colore: scura sui colori chiari (giallo, verde chiaro), bianca sugli scuri
export const inkOn = (hex: string) => { const n = parseInt(hex.replace('#', ''), 16); return ((n >> 16) * 299 + ((n >> 8) & 255) * 587 + (n & 255) * 114) / 1000 > 150 ? '#1a1a1a' : '#fff'; };
export const ENERGY_COLORS: Record<string, string> = {
  A4: '#00843d', A3: '#1a9a44', A2: '#4db848', A1: '#8dc63f', B: '#c8d400', C: '#fff200',
  D: '#fdb913', E: '#f47920', F: '#ed1c24', G: '#b31b1b',
};
