import { NextRequest, NextResponse } from 'next/server'
import sharp from 'sharp'
import { publicUrl } from '@/lib/r2'

// Foto nelle email servite da agenteimmo.me (non dal dominio di R2: immagini da un dominio diverso dal mittente
// piacciono meno ai filtri antispam). Solo le foto della prova gratis, ridotte a 1000 px per email leggere.
export async function GET(req: NextRequest) {
  const k = req.nextUrl.searchParams.get('k') ?? ''
  if (!/^landing-clean\/[\w-]+\.jpg$/.test(k)) return new NextResponse('not found', { status: 404 })
  const r = await fetch(publicUrl(k)).catch(() => null)
  if (!r?.ok) return new NextResponse('not found', { status: 404 })
  const out = await sharp(Buffer.from(await r.arrayBuffer())).resize({ width: 1000, withoutEnlargement: true }).jpeg({ quality: 80, progressive: true }).toBuffer()
  return new NextResponse(new Uint8Array(out), { headers: { 'content-type': 'image/jpeg', 'cache-control': 'public, max-age=31536000, immutable' } })
}
