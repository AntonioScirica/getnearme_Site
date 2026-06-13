import { getTokenFast } from './staging'

export type BatchInfo = {
  id: string
  style: string | null
  customPrompt: string | null
  status: string // 'pending' | 'processing' | 'completed' | 'failed'
  totalItems: number
  completedItems: number
  failedItems: number
  projectId: string | null
  createdAt: string
  updatedAt: string
  type?: string
}

export type BatchPhoto = {
  index: number
  resultUrl: string
  sourceUrl: string | null
  status?: string
  error?: string | null
}

export async function fetchUserBatches(): Promise<BatchInfo[]> {
  const token = getTokenFast()
  try {
    const res = await fetch('/api/staging-batches', {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.batches ?? []
  } catch (err) {
    console.error('fetchUserBatches error:', err)
    return []
  }
}

export async function fetchBatchPhotos(batchId: string): Promise<BatchPhoto[]> {
  const token = getTokenFast()
  try {
    const res = await fetch(`/api/staging-batches/${batchId}/photos`, {
      headers: { 'Authorization': `Bearer ${token}` },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.photos ?? []
  } catch (err) {
    console.error('fetchBatchPhotos error:', err)
    return []
  }
}

export async function deleteBatchPhoto(batchId: string, index: number): Promise<boolean> {
  const token = getTokenFast()
  try {
    const res = await fetch(`/api/staging-batches/${batchId}/photos`, {
      method: 'DELETE',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ index }),
    })
    return res.ok
  } catch (err) {
    console.error('deleteBatchPhoto error:', err)
    return false
  }
}

export function dismissBatch(batchId: string): void {
  if (typeof window === 'undefined') return
  const key = 'gnm_dismissed_batches'
  const dismissed = JSON.parse(localStorage.getItem(key) || '[]')
  if (!dismissed.includes(batchId)) {
    dismissed.push(batchId)
    localStorage.setItem(key, JSON.stringify(dismissed))
  }
}

export function getDismissedBatches(): string[] {
  if (typeof window === 'undefined') return []
  return JSON.parse(localStorage.getItem('gnm_dismissed_batches') || '[]')
}

export async function saveSingleGenerationToBatch(opts: {
  projectId: string | null;
  style: string | null;
  customPrompt: string | null;
  sourceUrl: string;
  resultUrl: string;
}): Promise<string | null> {
  const token = getTokenFast()
  try {
    const res = await fetch('/api/staging-batches/single', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(opts),
    })
    const json = await res.json().catch(() => null)
    return json?.batchId ?? null
  } catch (err) {
    console.error('saveSingleGenerationToBatch error:', err)
    return null
  }
}
