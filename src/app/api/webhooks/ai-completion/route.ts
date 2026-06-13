import { NextRequest, NextResponse } from 'next/server'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
)

const s3Client = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function POST(req: NextRequest) {
  // Potenziale check per un webhook secret token (es. API_KEY interna) per sicurezza
  const authHeader = req.headers.get('authorization')
  // Se vuoi proteggere l'endpoint per permettere chiamate solo dai tuoi servizi backend:
  // if (authHeader !== `Bearer ${process.env.INTERNAL_WEBHOOK_SECRET}`) {
  //   return NextResponse.json({ error: 'unauthorized' }, { status: 401 })
  // }

  let body
  try {
    body = await req.json()
  } catch (e) {
    return NextResponse.json({ error: 'bad_request' }, { status: 400 })
  }

  const { imageUrl, projectId, userId, type } = body

  if (!imageUrl || !userId || !type) {
    return NextResponse.json({ error: 'missing_fields' }, { status: 400 })
  }

  try {
    // 1. Scarica l'immagine generata dal provider AI (es. URL temporaneo di Replicate)
    const imageRes = await fetch(imageUrl)
    if (!imageRes.ok) throw new Error('Failed to fetch image from provider')
    
    const arrayBuffer = await imageRes.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    const contentType = imageRes.headers.get('content-type') || 'image/jpeg'
    
    // Determina l'estensione dal content type
    let ext = 'jpg'
    if (contentType.includes('png')) ext = 'png'
    if (contentType.includes('webp')) ext = 'webp'
    if (contentType.includes('mp4')) ext = 'mp4'

    // 2. Crea un nome file univoco e carica su Cloudflare R2
    const fileName = `media/${projectId || 'unassigned'}/${userId}/${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${ext}`

    await s3Client.send(new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      Body: buffer,
      ContentType: contentType,
    }))

    const r2PublicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`

    // 3. Registra l'URL definitivo (R2) nel database Supabase (tabella media)
    const { data: media, error } = await admin
      .from('media')
      .insert({
        user_id: userId,
        project_id: projectId || null,
        url: r2PublicUrl,
        type: type // 'staging', 'video', 'original'
      })
      .select('*')
      .single()

    if (error) {
      console.error('Error saving to media table:', error)
      return NextResponse.json({ error: 'db_insert_failed', details: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, media })
  } catch (error) {
    console.error('Webhook processing error:', error)
    return NextResponse.json({ error: 'processing_failed', details: (error as Error).message }, { status: 500 })
  }
}
