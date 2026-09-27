// Chiamata al worker Qwen-Image su RunPod (endpoint AI_IMAGE_ENDPOINT_ID): usata da photo-edit e dai video.
import { isPublicHttpsUrl } from '@/lib/safeUrl'

// Solo foto dei CDN dei portali o del nostro R2 (o https pubblici): il worker non scarica URL arbitrari.
const ALLOWED = /^https:\/\/(?:pwm\.im-cdn\.it|img\d*\.idealista\.(?:it|com|pt)|images?-?\d*\.casa\.it)\//
export const allowedUrl = (u: string) => ALLOWED.test(u) || (!!process.env.R2_PUBLIC_URL && u.startsWith(`${process.env.R2_PUBLIC_URL}/`)) || isPublicHttpsUrl(u)

const RUNPOD = 'https://api.runpod.ai/v2'

export type RunpodJob = { id?: string; status?: string; output?: { image_base64?: string; error?: string; seconds?: number }; error?: string }

export async function runJob(input: Record<string, unknown>): Promise<RunpodJob> {
  const id = process.env.AI_IMAGE_ENDPOINT_ID
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${process.env.RUNPOD_API_KEY}` }
  // runsync attende fino a ~90 s; se il lavoro non e' finito (avvio a freddo) si prosegue con /status.
  let job: RunpodJob = await fetch(`${RUNPOD}/${id}/runsync`, { method: 'POST', headers, body: JSON.stringify({ input }), signal: AbortSignal.timeout(120_000) }).then(r => r.json())
  const deadline = Date.now() + 240_000
  while (job.id && (job.status === 'IN_QUEUE' || job.status === 'IN_PROGRESS') && Date.now() < deadline) {
    await new Promise(r => setTimeout(r, 3000))
    job = await fetch(`${RUNPOD}/${id}/status/${job.id}`, { headers, signal: AbortSignal.timeout(20_000) }).then(r => r.json())
  }
  return job
}

