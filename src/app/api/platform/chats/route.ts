import { NextRequest, NextResponse } from 'next/server'
import { createHash } from 'crypto'
import { authUser } from '@/lib/platformAuth'
import { deleteKeys, publicUrl, uploadFile } from '@/lib/r2'

export const runtime = 'nodejs'

// Storico delle chat di home staging: ogni chat e' un file JSON su R2 dentro una cartella dell'account non indovinabile
// (hash dell'id + segreto), piu' un indice con titolo, anteprima e data. Niente tabelle nuove.
// Le chat piu' vecchie di 30 giorni si cancellano quando si apre lo storico. Foto e video restano comunque in Galleria.
// ponytail: indice riscritto a ogni salvataggio (ultima scrittura vince); basta per un agente alla volta per account.
const DAYS = 30
const MAX = 50
type Entry = { id: string; title: string; thumb: string | null; at: number }
const dirOf = (uid: string) => `chats/${createHash('sha256').update(`${uid}|${process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(-12)}`).digest('hex').slice(0, 32)}`
const okId = (x: unknown): x is string => typeof x === 'string' && /^[a-z0-9-]{8,40}$/.test(x)
const readJson = async <T,>(key: string): Promise<T | null> => fetch(`${publicUrl(key)}?t=${Date.now()}`, { cache: 'no-store' }).then(r => (r.ok ? r.json() : null)).catch(() => null)
const writeIndex = (dir: string, list: Entry[]) => uploadFile(Buffer.from(JSON.stringify(list)), `${dir}/index.json`, 'application/json')

export async function GET(req: NextRequest) {
  const u = await authUser(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const dir = dirOf(u.id)
  const id = req.nextUrl.searchParams.get('id')
  if (id) {
    if (!okId(id)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
    const chat = await readJson(`${dir}/${id}.json`)
    return chat ? NextResponse.json(chat) : NextResponse.json({ error: 'not_found' }, { status: 404 })
  }
  const list = (await readJson<Entry[]>(`${dir}/index.json`)) ?? []
  const limit = Date.now() - DAYS * 86_400_000
  const old = list.filter(e => e.at < limit)
  const keep = list.filter(e => e.at >= limit)
  if (old.length) { await deleteKeys(old.map(e => `${dir}/${e.id}.json`)).catch(() => {}); await writeIndex(dir, keep).catch(() => {}) }
  return NextResponse.json({ chats: keep })
}

export async function PUT(req: NextRequest) {
  const u = await authUser(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const raw = await req.text()
  if (raw.length > 4_000_000) return NextResponse.json({ error: 'too_large' }, { status: 413 })
  let b: { id?: unknown; title?: unknown; thumb?: unknown; data?: unknown }
  try { b = JSON.parse(raw) } catch { return NextResponse.json({ error: 'bad_request' }, { status: 400 }) }
  if (!okId(b.id) || !b.data || typeof b.data !== 'object') return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const dir = dirOf(u.id)
  await uploadFile(Buffer.from(JSON.stringify(b.data)), `${dir}/${b.id}.json`, 'application/json')
  const entry: Entry = { id: b.id, title: typeof b.title === 'string' ? b.title.slice(0, 80) : 'Chat', thumb: typeof b.thumb === 'string' && /^https:\/\//.test(b.thumb) ? b.thumb.slice(0, 1000) : null, at: Date.now() }
  const list = ((await readJson<Entry[]>(`${dir}/index.json`)) ?? []).filter(e => e.id !== entry.id)
  const next = [entry, ...list]
  const drop = next.slice(MAX)
  await writeIndex(dir, next.slice(0, MAX))
  if (drop.length) await deleteKeys(drop.map(e => `${dir}/${e.id}.json`)).catch(() => {})
  return NextResponse.json({ ok: true })
}

export async function DELETE(req: NextRequest) {
  const u = await authUser(req)
  if (!u) return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  const id = req.nextUrl.searchParams.get('id')
  if (!okId(id)) return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  const dir = dirOf(u.id)
  const list = ((await readJson<Entry[]>(`${dir}/index.json`)) ?? []).filter(e => e.id !== id)
  await writeIndex(dir, list)
  await deleteKeys([`${dir}/${id}.json`]).catch(() => {})
  return NextResponse.json({ ok: true })
}
