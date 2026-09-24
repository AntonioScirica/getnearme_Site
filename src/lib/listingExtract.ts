// Lettura "universale" di un annuncio: l'estensione manda la pagina grezza (testo visibile,
// dati strutturati incorporati, meta, immagini) e Qwen compila la scheda completa con i campi
// di propertyFields. Niente selettori per portale: se un portale cambia HTML non si rompe nulla.
import { ALL_FIELDS, type Details, type Field } from './propertyFields';

export type RawPage = { text?: string; json?: string; meta?: Record<string, string>; images?: string[] };

// ponytail: budget fisso per stare nel contesto di Qwen (16k token): testo prima, poi JSON.
// Se servono pagine piu' lunghe: alzare MAX_MODEL_LEN dell'endpoint e questi limiti.
const TEXT_MAX = 20000;
const JSON_MAX = 16000;

const clean = (s: string) => s.replace(/[ \t]+/g, ' ').replace(/\n\s*\n\s*\n+/g, '\n\n').trim();
// JSON incorporato: via URL, base64 e stringhe lunghissime che non contengono dati della casa.
const slimJson = (s: string) => s
  .replace(/"data:[^"]{50,}"/g, '""')
  .replace(/"https?:\/\/[^"]{80,}"/g, '"URL"')
  .replace(/\s+/g, ' ');

export function rawForAi(raw: RawPage): string {
  const meta = raw.meta ? Object.entries(raw.meta).map(([k, v]) => `${k}: ${v}`).join('\n') : '';
  return [
    meta && `META:\n${meta}`,
    `TESTO DELLA PAGINA:\n${clean(raw.text ?? '').slice(0, TEXT_MAX)}`,
    raw.json && `DATI STRUTTURATI INCORPORATI (JSON, possono contenere campi che nella pagina si vedono solo cliccando):\n${slimJson(raw.json).slice(0, JSON_MAX)}`,
  ].filter(Boolean).join('\n\n');
}

const nullable = (t: object) => ({ anyOf: [t, { type: 'null' }] });
const fieldSchema = (f: Field) => {
  if (f.type === 'multi') return { type: 'array', items: f.options ? { type: 'string', enum: f.options } : { type: 'string' } };
  if (f.type === 'number' || f.type === 'stepper') return nullable({ type: 'number' });
  if (f.type === 'toggle') return nullable({ type: 'boolean' });
  if (f.options) return nullable({ type: 'string', enum: f.options });
  return nullable({ type: 'string' });
};

export const EXTRACT_SCHEMA = {
  type: 'object',
  properties: {
    titolo: { type: 'string' },
    descrizione: { type: 'string' },
    ...Object.fromEntries(ALL_FIELDS.filter(f => f.key !== 'mostra_indirizzo').map(f => [f.key, fieldSchema(f)])),
    altri_dati: { type: 'array', items: { type: 'string' } },
  },
  required: ['titolo', 'descrizione', ...ALL_FIELDS.filter(f => f.key !== 'mostra_indirizzo').map(f => f.key), 'altri_dati'],
  additionalProperties: false,
};

const fieldHelp = ALL_FIELDS.filter(f => f.key !== 'mostra_indirizzo')
  .map(f => `- ${f.key}: ${f.label}${f.unit ? ` (${f.unit})` : ''}${f.options ? `, uno di: ${f.options.join(' | ')}` : ''}`).join('\n');

export const EXTRACT_SYSTEM = `Estrai i dati di un annuncio immobiliare italiano dalla pagina di un portale (testo visibile + dati strutturati incorporati). Il portale può essere qualsiasi: non contare su nomi di campi precisi, riconosci il significato.
Regole:
- Riporta SOLO dati presenti nella pagina; se un dato non c'è: null (liste: []). Mai inventare o dedurre da foto.
- Ignora annunci simili, suggeriti, pubblicità, dati dell'agenzia, menu e footer: solo l'immobile principale.
- I dati strutturati spesso contengono campi che nella pagina si vedono solo cliccando (caratteristiche complete, costi, classe energetica): usali.
- Scegli le opzioni della lista più vicine al significato (es. "termoautonomo" -> Autonomo, "cucina a vista" -> A vista). Numeri senza unità (prezzo in euro, superfici in m², spese al mese).
- titolo: il titolo dell'annuncio così com'è. descrizione: il testo completo della descrizione, invariato.
- altri_dati: altri fatti utili sull'immobile che non hanno un campo (es. "doppi servizi", "vista mare"), brevi.
Campi:
${fieldHelp}`;

// Scheda estratta -> Details (via null e liste vuote), piu' titolo e descrizione.
export function toDetails(x: Record<string, unknown>): { titolo: string; descrizione: string; details: Details; altri: string[] } {
  const details: Details = {};
  for (const f of ALL_FIELDS) {
    const v = x[f.key];
    if (v === null || v === undefined || v === '' || (Array.isArray(v) && !v.length)) continue;
    details[f.key] = v as Details[string];
  }
  return { titolo: String(x.titolo ?? ''), descrizione: String(x.descrizione ?? ''), details, altri: Array.isArray(x.altri_dati) ? x.altri_dati.map(String) : [] };
}
