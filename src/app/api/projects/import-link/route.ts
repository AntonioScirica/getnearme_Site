import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { fetchListingPage } from '@/lib/pageFetch'
import { extractFields } from '@/lib/listingExtract'
import { saveListingProject, str } from '@/lib/saveListing'
import { isPublicHttpsUrl } from '@/lib/safeUrl'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
export const runtime = 'nodejs'
export const maxDuration = 300
const DAILY = Number(process.env.IMPORT_LINK_DAILY_LIMIT) || 100 // annunci letti al giorno per agente (ZenRows ~0,025 $ a pagina)

// "Importa da link": un annuncio alla volta (immobiliare, idealista, casa, qualsiasi sito). Il server legge la pagina
// con ZenRows (lib/pageFetch), estrae i campi (portali con precisione, altrove Gemini a quota gratuita), copia tutte
// le foto su R2 e crea l'immobile in vetrina (lib/saveListing). Il client chiama questa route per ogni link, in fila.
// Body: { url, riferimento?, nome? } (riferimento e nome arrivano dal file CSV, se c'e'). Un link gia' importato non
// si rilegge: torna l'immobile esistente (existing: true).
export async function POST(req: NextRequest) {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const { data } = await admin.auth.getUser(token)
  const userId = data.user?.id
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  let b: { url?: unknown; riferimento?: unknown; nome?: unknown }
  try { b = await req.json() } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  const url = typeof b.url === 'string' ? b.url.trim().slice(0, 500) : ''
  if (!isPublicHttpsUrl(url)) return NextResponse.json({ error: 'invalid_url' }, { status: 400 })
  const riferimento = str(b.riferimento, 100).trim()
  const nome = str(b.nome, 200).trim()

  // gia' in vetrina (stesso link): niente seconda lettura a pagamento
  const { data: dup } = await admin.from('projects').select('id, nome').eq('user_id', userId).eq('import_data->>url', url).limit(1).maybeSingle()
  if (dup) return NextResponse.json({ id: dup.id, nome: dup.nome, existing: true })
  // tetto giornaliero
  const since = new Date(Date.now() - 86_400_000).toISOString()
  const { count } = await admin.from('projects').select('id', { count: 'exact', head: true }).eq('user_id', userId).in('import_data->>source', ['link', 'csv-link']).gte('created_at', since)
  if ((count ?? 0) >= DAILY) return NextResponse.json({ error: 'daily_limit' }, { status: 429 })

  const page = await fetchListingPage(url)
  if (!page.ok) return NextResponse.json({ error: page.error }, { status: page.error === 'invalid_url' ? 400 : 422 })
  const listing = { url, title: page.title, address: '', propertyInfo: page.fields ?? {}, photos: page.photos, raw: page.raw }
  const f = await extractFields(listing, userId)
  // scheda (campi di propertyFields) dai campi dell'annuncio
  const details: Record<string, unknown> = {}
  const put = (k: string, v: unknown) => { if (typeof v === 'string' ? v.trim() : v) details[k] = typeof v === 'string' ? v.trim() : v }
  put('indirizzo', f.zona); put('prezzo', f.prezzo); put('superficie', f.mq); put('locali', f.locali); put('camere', f.camere); put('bagni', f.bagni)
  put('piano', f.piano); put('classe_energetica', f.classe_energetica); put('riscaldamento', f.riscaldamento); put('spese_condominiali', f.spese_condominiali)
  put('anno', f.anno_costruzione); put('stato', f.stato); put('posto_auto', f.box_posto_auto); put('esposizione', f.esposizione); put('ascensore', f.ascensore)
  put('esterni', f.balcone_terrazzo); put('arredato', f.arredato); put('disponibilita', f.disponibilita); put('contratto', f.contratto)
  if (riferimento) put('riferimento', riferimento)
  const titolo = nome || f.titolo || page.title || url.replace(/^https?:\/\//, '').slice(0, 80)
  try {
    const r = await saveListingProject(userId, { titolo, descrizione: f.descrizione, details, listing: { url, title: page.title, address: '', propertyInfo: page.fields ?? {}, photos: page.photos }, source: riferimento || nome ? 'csv-link' : 'link', riferimento: riferimento || undefined })
    return NextResponse.json({ ...r, nome: titolo, existing: false })
  } catch (e) {
    console.error('import-link', e)
    return NextResponse.json({ error: 'internal_server_error' }, { status: 500 })
  }
}
