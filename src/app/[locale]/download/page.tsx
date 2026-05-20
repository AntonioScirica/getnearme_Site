'use client'

import { useSearchParams } from 'next/navigation'
import { Suspense, useCallback, useEffect, useState } from 'react'

interface Photo {
  index: number
  url: string
}

interface BatchData {
  style: string
  total: number
  completed: number
  failed: number
  status: string
  createdAt: string
  photos: Photo[]
}

const STYLE_LABELS: Record<string, string> = {
  modern: 'Moderno',
  nordic: 'Nordico',
  industrial: 'Luxury',
  boho: 'Boho',
  daynight: 'Giorno/Notte',
  empty: 'Svuota stanza',
}

function DownloadContent() {
  const params = useSearchParams()
  const batchId = params.get('batch')
  const token = params.get('token')

  const [data, setData] = useState<BatchData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [zipping, setZipping] = useState(false)

  useEffect(() => {
    if (!batchId || !token) {
      setError('Link non valido.')
      setLoading(false)
      return
    }

    fetch(`/api/batch-download?batch=${batchId}&token=${token}`)
      .then(async (res) => {
        if (!res.ok) {
          setError(res.status === 404 ? 'Download non trovato o scaduto.' : 'Errore nel caricamento.')
          return
        }
        setData(await res.json())
      })
      .catch(() => setError('Errore di connessione.'))
      .finally(() => setLoading(false))
  }, [batchId, token])

  const downloadAll = useCallback(async () => {
    if (!data || data.photos.length === 0) return
    setZipping(true)

    try {
      const { default: JSZip } = await import('jszip')
      const zip = new JSZip()

      await Promise.all(
        data.photos.map(async (photo) => {
          const res = await fetch(photo.url)
          const blob = await res.blob()
          zip.file(`foto_${photo.index + 1}.png`, blob)
        }),
      )

      const content = await zip.generateAsync({ type: 'blob' })
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = 'staging_photos.zip'
      a.click()
      URL.revokeObjectURL(url)
    } catch {
      alert('Errore nella creazione del file ZIP.')
    } finally {
      setZipping(false)
    }
  }, [data])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#1e40af] flex items-center justify-center">
        <div className="w-10 h-10 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#1e40af] flex items-center justify-center px-4">
        <div className="w-full max-w-[420px] bg-white rounded-2xl p-10 text-center shadow-2xl shadow-black/20">
          <div className="w-14 h-14 mx-auto mb-5 flex items-center justify-center bg-red-50 rounded-[14px]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-lg font-bold text-[#1F2937] mb-1">{error}</h1>
          <p className="text-sm text-[#6B7280]">Il link potrebbe essere scaduto o non valido.</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  const styleLabel = STYLE_LABELS[data.style] || data.style

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#1e40af] flex flex-col items-center justify-center px-4">

      {/* Main card */}
      <div className="w-full max-w-[420px] bg-white rounded-2xl p-8 text-center shadow-2xl shadow-black/20">

        {/* Blue icon */}
        <div className="w-14 h-14 mx-auto mb-5 flex items-center justify-center bg-[#2563eb] rounded-[14px] text-white">
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <rect width="18" height="18" x="3" y="3" rx="2" /><circle cx="12" cy="12" r="3" /><path d="m16 2-4 4-4-4" />
          </svg>
        </div>

        {/* Title */}
        <h1 className="text-[22px] font-bold text-[#2563eb] mb-1">Foto pronte!</h1>
        <p className="text-sm text-[#6B7280] leading-relaxed max-w-[280px] mx-auto">
          Le tue <strong className="text-[#1F2937]">{data.completed} foto</strong> con stile <strong className="text-[#1F2937]">{styleLabel}</strong> sono pronte per il download.
        </p>

        {/* Photo count badge */}
        <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-[rgba(37,99,235,0.1)] rounded-[10px]">
          <span className="text-[15px] font-bold text-[#2563eb]">{data.completed} di {data.total} foto</span>
        </div>

        {/* Expiry */}
        <p className="mt-4 text-xs text-[#6B7280]">
          Il link per il download sarà valido per <strong className="text-[#2563eb]">24 ore</strong>.
        </p>
      </div>

      {/* Download all button */}
      <button
        onClick={downloadAll}
        disabled={zipping}
        className="mt-4 w-full max-w-[420px] flex items-center justify-center gap-2 py-3 bg-white text-[#2563EB] font-semibold text-sm rounded-xl shadow-lg shadow-black/10 hover:bg-gray-50 transition disabled:opacity-60"
      >
        {zipping ? (
          <>
            <div className="w-4 h-4 border-2 border-[#2563EB]/30 border-t-[#2563EB] rounded-full animate-spin" />
            Creazione ZIP...
          </>
        ) : (
          <>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Scarica tutte le foto (ZIP)
          </>
        )}
      </button>

      {/* Failed notice */}
      {data.failed > 0 && (
        <div className="mt-4 w-full max-w-[420px] px-4 py-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl text-sm text-white/90 text-center">
          {data.failed} foto non riuscite. Crediti rimborsati.
        </div>
      )}


    </div>
  )
}

export default function DownloadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-[#2563EB] via-[#1D4ED8] to-[#1e40af] flex items-center justify-center">
          <div className="w-10 h-10 border-[3px] border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      }
    >
      <DownloadContent />
    </Suspense>
  )
}
