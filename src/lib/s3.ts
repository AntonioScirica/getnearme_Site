import { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

const ACCOUNT_ID = process.env.R2_ACCOUNT_ID!;
const ACCESS_KEY = process.env.R2_ACCESS_KEY_ID!;
const SECRET_KEY = process.env.R2_SECRET_ACCESS_KEY!;
const BUCKET_NAME = process.env.R2_BUCKET_NAME!;

export const s3 = new S3Client({
  region: 'auto',
  endpoint: `https://${ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: ACCESS_KEY,
    secretAccessKey: SECRET_KEY,
  },
});

/**
 * Uploads a buffer to R2 and returns the key.
 */
export async function uploadToR2(buffer: Buffer, key: string, contentType: string = 'image/jpeg'): Promise<string> {
  const command = new PutObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
    Body: buffer,
    ContentType: contentType,
  });

  await s3.send(command);
  return key;
}

/**
 * Uploads from a remote URL to R2 directly.
 */
/**
 * Elimina un oggetto da R2. Non lancia: logga e prosegue (best-effort).
 */
export async function deleteFromR2(key: string): Promise<void> {
  try {
    await s3.send(new DeleteObjectCommand({ Bucket: BUCKET_NAME, Key: key }));
  } catch (e) {
    console.error('deleteFromR2 failed for', key, (e as Error)?.message);
  }
}

export async function uploadUrlToR2(url: string, key: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch image from URL: ${response.statusText}`);
  }
  const arrayBuffer = await response.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const contentType = response.headers.get('content-type') || 'image/jpeg';
  
  return uploadToR2(buffer, key, contentType);
}

/**
 * Gets a signed URL for reading an object from R2.
 */
export async function getR2SignedUrl(key: string, expiresIn: number = 604800): Promise<string> {
  // Se l'utente ha configurato R2_PUBLIC_URL nel .env, usiamo quello invece del link firmato
  // I link pubblici di R2 sono preferibili perché beneficiano del CDN gratuito.
  if (process.env.R2_PUBLIC_URL) {
    return `${process.env.R2_PUBLIC_URL}/${key}`;
  }

  const command = new GetObjectCommand({
    Bucket: BUCKET_NAME,
    Key: key,
  });

  return getSignedUrl(s3, command, { expiresIn });
}
