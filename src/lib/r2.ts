import { S3Client, PutObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3'
import sharp from 'sharp'

// Copia un'immagine remota su R2, ridimensionata (lato lungo maxDim) e in JPEG.
// null se download/resize/upload falliscono: il chiamante decide se proseguire.
const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
})

export async function rehostImage(url: string, key: string, maxDim: number, quality = 80): Promise<string | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
    if (!res.ok) return null
    const original = Buffer.from(await res.arrayBuffer())
    if (!original.length) return null
    const body = await sharp(original).rotate()
      .resize({ width: maxDim, height: maxDim, fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality }).toBuffer()
    await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key, Body: body, ContentType: 'image/jpeg' }))
    return `${process.env.R2_PUBLIC_URL}/${key}`
  } catch (e) {
    console.error('rehostImage error:', e)
    return null
  }
}

export async function uploadJpeg(body: Buffer, key: string): Promise<string> {
  await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key, Body: body, ContentType: 'image/jpeg' }))
  return `${process.env.R2_PUBLIC_URL}/${key}`
}

// Chiavi sotto un prefisso (con data di caricamento), fino a `max`.
export async function listKeys(prefix: string, max = 2000): Promise<{ key: string; at: number }[]> {
  const out: { key: string; at: number }[] = []
  let token: string | undefined
  do {
    const r = await s3.send(new ListObjectsV2Command({ Bucket: process.env.R2_BUCKET_NAME, Prefix: prefix, ContinuationToken: token }))
    for (const o of r.Contents ?? []) if (o.Key) out.push({ key: o.Key, at: o.LastModified?.getTime() ?? 0 })
    token = r.IsTruncated ? r.NextContinuationToken : undefined
  } while (token && out.length < max)
  return out
}

export const publicUrl = (key: string) => `${process.env.R2_PUBLIC_URL}/${key}`

// File vuoto: l'informazione sta nel nome (vedi photo-edit, dati della Galleria)
export async function uploadMarker(key: string) {
  await s3.send(new PutObjectCommand({ Bucket: process.env.R2_BUCKET_NAME, Key: key, Body: '' }))
}
