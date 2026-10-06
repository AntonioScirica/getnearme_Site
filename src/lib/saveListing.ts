import { createClient } from '@supabase/supabase-js'
import { sceneFromName } from '@/lib/planUrl'
import { isPublicHttpsUrl } from '@/lib/safeUrl'
import { rehostImage } from '@/lib/r2'

// Un annuncio letto da un portale diventa un immobile della vetrina: TUTTE le foto copiate su R2 (non dipendiamo
// dal CDN del portale) e tutti i dati letti. Usato da "Salva nei miei immobili" (Migliora annuncio) e da
// "Importa da link" (api/projects/import-link).
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
const MAX_PHOTOS = 40
const PARALLEL = 6

export const toNum = (v: unknown) => {
  if (typeof v === 'number') return Number.isFinite(v) ? Math.round(v) : 0 // numeri della scheda AI (niente "95.5" -> 955)
  const m = String(v ?? '').match(/\d[\d.]*/)
  return m ? Number(m[0].replace(/\./g, '')) || 0 : 0
}
export const str = (v: unknown, max = 200) => (typeof v === 'string' ? v.slice(0, max) : '')

export type ListingToSave = {
  titolo: string; descrizione?: string; score?: number; suggerimenti?: string[]
  details?: Record<string, unknown> // scheda completa (campi di propertyFields)
  listing: { url?: string; title?: string; address?: string; propertyInfo?: Record<string, unknown>; photos?: string[] }
  source?: 'portal' | 'link' | 'csv-link'
  riferimento?: string // codice dell'agenzia (dal file)
}

// Contatti dell'agenzia che ha pubblicato l'annuncio (telefoni, email, siti, sede): non vanno sul sito di chi importa.
// Via le righe che li contengono; il resto della descrizione resta com'e'.
const CONTACT_LINE = /([\w.+-]+@[\w-]+\.[\w.]+)|(\bwww\.|https?:\/\/)|\b(tel|cell|telefono|cellulare|whatsapp|sede|ufficio|e-?mail|contattaci|chiama)\b\.?\s*[:.\d]/i
// numero di telefono: almeno 9 cifre di seguito (anche con spazi, punti, barre); date e prezzi ne hanno meno
const PHONE = (l: string) => (l.match(/\+?\d[\d\s./-]{7,}\d/g) ?? []).some(x => x.replace(/\D/g, '').length >= 9)
// riga breve con solo il nome dell'agenzia (es. "GASTONE DI PAOLA IMMOBILIARE")
const AGENCY = (l: string) => l.trim().length < 50 && /\b(immobiliare|agenzia|real estate)\b/i.test(l)
export const stripContacts = (t: string) => t.split('\n').filter(l => !CONTACT_LINE.test(l) && !PHONE(l) && !AGENCY(l)).join('\n').replace(/\n{3,}/g, '\n\n').trim()

export async function saveListingProject(userId: string, b: ListingToSave): Promise<{ id: string; photos: number; skipped: number }> {
  const l = b.listing
  const titolo = str(b.titolo, 200)
  const info = l.propertyInfo && typeof l.propertyInfo === 'object' ? l.propertyInfo : {}
  const details = b.details && typeof b.details === 'object' && !Array.isArray(b.details) ? b.details : {}
  const d = details as Record<string, unknown>

  // Foto: copia su R2 a 1600px, a gruppi di PARALLEL, mantenendo l'ordine.
  const sources = (Array.isArray(l.photos) ? l.photos : []).filter(isPublicHttpsUrl).slice(0, MAX_PHOTOS) // foto di qualsiasi sito di annunci, solo https pubblico
  const stamp = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const photos: string[] = [], named: Record<string, object> = {} // foto riconosciute dal nome (planimetrie, esterni, giardino): niente AI dopo
  for (let i = 0; i < sources.length; i += PARALLEL) {
    const batch = await Promise.all(sources.slice(i, i + PARALLEL).map((u, j) => rehostImage(u, `properties/${userId}/${stamp}-${i + j}.jpg`, 1600, 82)))
    batch.forEach((u, j) => { if (u) { photos.push(u); const h = sceneFromName(sources[i + j]); if (h) named[u] = { ...h, v: 2, da: 'nome' } } })
  }
  const thumb = sources[0] ? await rehostImage(sources[0], `covers/${userId}/${stamp}-thumb.jpg`, 100, 80) : null

  const { data: project, error } = await admin.from('projects').insert({
    user_id: userId,
    nome: titolo,
    titolo,
    descrizione: stripContacts(str(b.descrizione, 10000)),
    // scheda estratta dall'AI prima, dati dei selettori dell'estensione come ripiego
    addr: str(d.indirizzo, 300) || str(l.address, 300),
    tipologia: str(d.tipologia, 100) || str(info.type, 100),
    prezzo: toNum(d.prezzo) || toNum(info.price),
    mq: toNum(d.superficie) || toNum(info.surface),
    locali: toNum(d.locali) || toNum(info.rooms) || null,
    camere: toNum(d.camere) || toNum(info.bedrooms),
    bagni: toNum(d.bagni) || toNum(info.bathrooms),
    ...(b.riferimento ? { riferimento: str(b.riferimento, 100) } : {}),
    cover: photos[0] ?? '',
    thumb: thumb ?? '',
    import_data: {
      source: b.source ?? 'portal',
      url: str(l.url, 500),
      photos,
      ...(Object.keys(named).length ? { rooms: named } : {}),
      score: typeof b.score === 'number' ? b.score : null,
      suggerimenti: Array.isArray(b.suggerimenti) ? b.suggerimenti.slice(0, 20).map(s => str(s, 1000)) : [],
      piano: str(info.floor, 50),
      classe: str(info.energyClass, 20),
      caratteristiche: Array.isArray(info.features) ? info.features.slice(0, 50) : [],
      originale: { titolo: str(l.title, 300), descrizione: str(info.description, 10000) },
      details, // scheda completa (stessi campi di Crea da zero): la legge la pagina della casa
      info, // tutto quello che ha letto l'estensione (spese, riscaldamento, anno, esposizione, box...)
    },
  }).select('id').single()
  if (error || !project) throw new Error(`save-listing: ${error?.message ?? 'insert'}`)
  return { id: project.id as string, photos: photos.length, skipped: sources.length - photos.length }
}
