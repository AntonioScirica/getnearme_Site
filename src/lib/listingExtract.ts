import { geminiFreeJson } from '@/lib/geminiFree'
import { EMPTY_FIELDS, type Fields } from '@/lib/listingRules'

// Dalla pagina di un annuncio (letta dall'estensione o dal server, vedi pageFetch) ai campi del verdetto.
// 1. Gemini a quota gratuita legge testo e dati incorporati della pagina (qualsiasi sito, costo 0);
// 2. ripiego senza AI: campi gia' letti dall'estensione sui portali noti + espressioni regolari sul testo.
export type Raw = { text?: string; json?: string; meta?: Record<string, string>; images?: string[] }
export type ListingIn = { url?: string; title?: string; address?: string; propertyInfo?: Record<string, unknown>; photos?: string[]; raw?: Raw }

const KEYS = Object.keys(EMPTY_FIELDS).filter(k => k !== 'foto' && k !== 'planimetria') as (keyof Fields)[]
const SYSTEM = `Estrai i dati di un annuncio immobiliare dalla pagina web ricevuta (testo visibile, dati JSON incorporati, meta tag).
Rispondi SOLO con un oggetto JSON con queste chiavi, valori stringa brevi come scritti nell'annuncio, "" se il dato non c'e' (non inventare mai):
${KEYS.join(', ')}, planimetria (true se l'annuncio ha la planimetria, altrimenti false).
- titolo: il titolo scritto dall'agente; descrizione: la descrizione completa dell'agente, parola per parola (non riassumere).
- prezzo, mq, locali, camere, bagni: solo il numero. spese_condominiali: importo mensile. zona: quartiere o via e citta'. contratto: vendita o affitto.`

const s = (v: unknown) => (typeof v === 'string' || typeof v === 'number' ? String(v).trim() : '')
const num = (v: string) => v.match(/\d[\d.]*(?:,\d+)?/)?.[0].replace(/\.(?=\d{3})/g, '') ?? ''

// immobiliare.it: l'annuncio intero sta nei dati di Next (__NEXT_DATA__ -> detailData.realEstate). Lettura precisa,
// senza AI: il portale principale non deve dipendere da Gemini. null se la pagina non e' di immobiliare.
type Imm = { caption?: string; description?: string; surface?: string; rooms?: string; bedRoomsNumber?: string; bathrooms?: string
  floor?: { value?: string }; energy?: { class?: { name?: string }; heatingType?: string }; costs?: { condominiumExpenses?: string }
  buildingYear?: number; condition?: string; garage?: string; features?: string[]; elevator?: boolean; availability?: string
  multimedia?: { photos?: { urls?: { large?: string; xxl?: string } }[]; floorplans?: unknown[] }; location?: { address?: string; macrozone?: string; city?: string } }
// Si legge dall'HTML intero appena scaricato (il JSON e' ~230.000 caratteri: nel formato grezzo verrebbe tagliato).
export function immobiliare(html: string): { fields: Partial<Fields>; photos: string[] } | null {
  const m = html.match(/<script[^>]*id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i)
  if (!m || !m[1].includes('"realEstate"')) return null
  let data: { props?: { pageProps?: { detailData?: { realEstate?: { contract?: string; price?: { value?: number }; properties?: Imm[] } } } } }
  try { data = JSON.parse(m[1]) } catch { return null }
  const re = data.props?.pageProps?.detailData?.realEstate, p = re?.properties?.[0]
  if (!re || !p) return null
  const feats = (p.features ?? []).map(f => f.toLowerCase())
  return {
    photos: (p.multimedia?.photos ?? []).map(x => x.urls?.large || x.urls?.xxl || '').filter(Boolean),
    fields: {
      titolo: s(p.caption), descrizione: s(p.description), prezzo: re.price?.value ? String(re.price.value) : '',
      mq: num(s(p.surface)), locali: s(p.rooms), camere: s(p.bedRoomsNumber), bagni: s(p.bathrooms), piano: s(p.floor?.value),
      classe_energetica: s(p.energy?.class?.name), riscaldamento: s(p.energy?.heatingType), spese_condominiali: s(p.costs?.condominiumExpenses),
      anno_costruzione: p.buildingYear ? String(p.buildingYear) : '', stato: s(p.condition), box_posto_auto: s(p.garage),
      esposizione: feats.find(f => f.startsWith('esposizione'))?.replace('esposizione', '').trim() ?? '',
      ascensore: p.elevator ? 'si' : '', balcone_terrazzo: feats.filter(f => /balcon|terrazz/.test(f)).join(', '),
      arredato: feats.includes('arredato') ? 'si' : '', disponibilita: s(p.availability),
      zona: [p.location?.address, p.location?.macrozone, p.location?.city].filter(Boolean).join(', '),
      contratto: re.contract === 'rent' ? 'affitto' : re.contract === 'sale' ? 'vendita' : '',
      planimetria: (p.multimedia?.floorplans?.length ?? 0) > 0,
    },
  }
}

// ripiego: campi dell'estensione (content script dei portali noti) + regex sul testo della pagina
function fallback(l: ListingIn): Fields {
  const pi = (l.propertyInfo ?? {}) as Record<string, unknown>
  const text = l.raw?.text ?? ''
  const rx = (re: RegExp) => text.match(re)?.[1]?.trim() ?? ''
  return {
    ...EMPTY_FIELDS,
    titolo: s(pi.title) || s(l.title) || s(l.raw?.meta?.['og:title']),
    descrizione: s(pi.description) || s(l.raw?.meta?.['og:description']) || s(l.raw?.meta?.description),
    prezzo: num(s(pi.price)) || num(rx(/€\s*([\d.,]+)/)),
    mq: num(s(pi.surface)) || rx(/(\d{2,4})\s*(?:m²|m2|mq)\b/i),
    locali: num(s(pi.rooms)) || rx(/(\d+)\s*locali/i),
    camere: num(s(pi.bedrooms)) || rx(/(\d+)\s*camer[ae]/i),
    bagni: num(s(pi.bathrooms)) || rx(/(\d+)\s*bagn[io]/i),
    piano: s(pi.floor) || rx(/\bpiano\s*[:\s]\s*([^\n,]{1,20})/i),
    classe_energetica: s(pi.energyClass) || rx(/classe energetica\s*[:\s]\s*([A-G][1-4+]?)\b/i),
    riscaldamento: s(pi.riscaldamento) || rx(/riscaldamento\s*[:\s]\s*([^\n]{3,40})/i),
    spese_condominiali: s(pi.condominium) || rx(/spese condominiali\s*[:\s]\s*€?\s*([\d.,]+)/i),
    anno_costruzione: s(pi.yearBuilt) || rx(/anno di costruzione\s*[:\s]\s*(\d{4})/i),
    stato: s(pi.stato) || s(pi.condition) || rx(/\bstato\s*[:\s]\s*([^\n]{3,30})/i),
    box_posto_auto: s(pi.parking) || rx(/\b(box|posto auto[^\n]{0,20})/i),
    esposizione: s(pi.esposizione) || rx(/esposizione\s*[:\s]\s*([^\n]{3,30})/i),
    ascensore: s(pi.elevator), balcone_terrazzo: s(pi.balcone) || s(pi.terrace), arredato: s(pi.furnished),
    disponibilita: s(pi.disponibilita), zona: s(l.address), contratto: s(pi.contract) || s(pi.tipoContratto),
    planimetria: /planimetri/i.test(text),
  }
}

export async function extractFields(l: ListingIn, userId: string): Promise<Fields> {
  // campi gia' letti con precisione dal server (pageFetch: immobiliare), arrivati in propertyInfo
  if (l.propertyInfo?._fonte === 'immobiliare') return { ...EMPTY_FIELDS, ...(l.propertyInfo as Partial<Fields>), foto: (l.photos ?? []).length }
  const base = fallback(l)
  const foto = (l.photos ?? []).length
  if (!l.raw?.text && !l.raw?.json) return { ...base, foto }
  const page = [
    `URL: ${l.url ?? ''}`, `Titolo pagina: ${l.title ?? ''}`,
    `Meta: ${JSON.stringify(l.raw.meta ?? {}).slice(0, 3000)}`,
    `Dati gia' letti: ${JSON.stringify(l.propertyInfo ?? {}).slice(0, 4000)}`,
    `Testo della pagina:\n${(l.raw.text ?? '').slice(0, 20000)}`,
    `Dati JSON incorporati:\n${(l.raw.json ?? '').slice(0, 20000)}`,
  ].join('\n\n')
  const ai = await geminiFreeJson<Partial<Record<keyof Fields, unknown>>>({ system: SYSTEM, text: page, userId, kind: 'extract' })
  if (!ai) return { ...base, foto }
  // l'AI riempie, il ripiego copre i buchi (mai un campo perso rispetto a prima)
  const out = { ...base, foto, planimetria: ai.planimetria === true || base.planimetria }
  for (const k of KEYS) (out as Record<string, unknown>)[k] = s(ai[k]) || base[k]
  return out
}
