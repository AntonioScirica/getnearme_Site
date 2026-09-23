import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { rehostImage } from '@/lib/r2'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)


const getUserId = async (req: NextRequest): Promise<string | null> => {
  const authHeader = req.headers.get('authorization')
  if (!authHeader) return null
  const token = authHeader.replace('Bearer ', '')
  const { data } = await admin.auth.getUser(token)
  return data.user?.id ?? null
}

type ImportRow = {
  riferimento?: string
  nome: string
  addr?: string
  prezzo?: number
  mq?: number
  locali?: number
  camere?: number
  bagni?: number
  descrizione?: string
  titolo?: string
  tipologia?: string
  photoUrl?: string        // singola foto (retrocompat)
  photoUrls?: string[]     // piu' candidati: si usa la prima raggiungibile
  _raw?: Record<string, unknown> // riga originale completa del file (per report futuri)
}

// Cover ottimizzata (~500px) su R2: stessa logica di prima, ora in lib/r2.
const rehostPhoto = (photoUrl: string, userId: string) =>
  rehostImage(photoUrl, `covers/import-${userId}-${Date.now()}-${Math.random().toString(36).substring(2, 9)}.jpg`, 500, 78)

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(req: NextRequest) {
  const userId = await getUserId(req)
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })

  let body
  try {
    body = await req.json()
  } catch (e) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const rows = body?.rows
  if (!Array.isArray(rows)) {
    return NextResponse.json({ error: 'rows_must_be_array' }, { status: 400 })
  }
  if (rows.length > 2000) {
    return NextResponse.json({ error: 'too_many_rows' }, { status: 400 })
  }

  let created = 0
  let updated = 0
  let skipped = 0
  const errors: string[] = []

  for (const row of rows as ImportRow[]) {
    const nome = typeof row?.nome === 'string' ? row.nome.trim() : ''
    if (!nome) {
      skipped++
      errors.push('riga senza nome')
      continue
    }

    const riferimento = typeof row.riferimento === 'string' ? row.riferimento.trim() : ''

    // Re-host: prova i candidati in ordine, tiene la PRIMA raggiungibile.
    // Se nessuna e' valida -> cover null (immobile salvato senza foto).
    let cover: string | null = null
    const photoCandidates: string[] = []
    if (Array.isArray(row.photoUrls)) photoCandidates.push(...row.photoUrls.filter((u): u is string => typeof u === 'string'))
    if (typeof row.photoUrl === 'string') photoCandidates.push(row.photoUrl)
    for (const cand of photoCandidates) {
      const url = cand.trim()
      if (!url) continue
      cover = await rehostPhoto(url, userId)
      if (cover) break // prima immagine scaricata con successo
    }

    const raw: Record<string, unknown> | null = row._raw && typeof row._raw === 'object' ? row._raw : null

    // Solo i campi REALMENTE presenti in questa riga: in update non sovrascrivono
    // con vuoti i dati gia' salvati da import precedenti (camere c'era prima, il
    // file nuovo non ce l'ha -> resta com'era).
    const present: Record<string, unknown> = { nome }
    if (typeof row.addr === 'string' && row.addr.trim()) present.addr = row.addr.trim()
    if (typeof row.prezzo === 'number') present.prezzo = row.prezzo
    if (typeof row.mq === 'number') present.mq = row.mq
    if (typeof row.camere === 'number') present.camere = row.camere
    if (typeof row.bagni === 'number') present.bagni = row.bagni
    if (typeof row.locali === 'number') present.locali = row.locali
    if (typeof row.descrizione === 'string' && row.descrizione.trim()) present.descrizione = row.descrizione.trim()
    if (typeof row.titolo === 'string' && row.titolo.trim()) present.titolo = row.titolo.trim()
    if (typeof row.tipologia === 'string' && row.tipologia.trim()) present.tipologia = row.tipologia.trim()
    if (riferimento) present.riferimento = riferimento
    if (cover) present.cover = cover

    // Dedup by (user_id, riferimento) when riferimento is set.
    if (riferimento) {
      const { data: existing, error: findErr } = await admin
        .from('projects')
        .select('id, import_data')
        .eq('user_id', userId)
        .eq('riferimento', riferimento)
        .maybeSingle()

      if (findErr) {
        console.error('Import lookup error:', findErr)
        skipped++
        errors.push(`riferimento ${riferimento}: ${findErr.message}`)
        continue
      }

      if (existing) {
        // Merge: accumula le colonne grezze (vecchie + nuove), le mancanti restano.
        const prevRaw = (existing.import_data && typeof existing.import_data === 'object') ? existing.import_data as Record<string, unknown> : {}
        const mergedRaw = raw ? { ...prevRaw, ...raw } : (existing.import_data ?? null)
        const { error: updErr } = await admin
          .from('projects')
          .update({ ...present, import_data: mergedRaw, updated_at: new Date().toISOString() })
          .eq('id', existing.id)
          .eq('user_id', userId)

        if (updErr) {
          console.error('Import update error:', updErr)
          skipped++
          errors.push(`riferimento ${riferimento}: ${updErr.message}`)
          continue
        }
        updated++
        continue
      }
    }

    // INSERT: default per i campi base + valori presenti + riga grezza completa.
    const insertObj: Record<string, unknown> = {
      user_id: userId,
      addr: '', prezzo: 0, mq: 0, camere: 0, bagni: 0, descrizione: '', titolo: '', tipologia: '', locali: null, riferimento, cover: '',
      ...present,
      import_data: raw,
    }
    const { error: insErr } = await admin
      .from('projects')
      .insert(insertObj)

    if (insErr) {
      console.error('Import insert error:', insErr)
      skipped++
      errors.push(`${nome}: ${insErr.message}`)
      continue
    }
    created++
  }

  return NextResponse.json({ created, updated, skipped, errors })
}
