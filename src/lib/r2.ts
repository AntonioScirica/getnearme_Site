import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'
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
