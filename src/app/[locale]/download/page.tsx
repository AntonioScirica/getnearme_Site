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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center bg-red-100 rounded-2xl">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">{error}</h1>
          <p className="text-sm text-gray-500">Il link potrebbe essere scaduto o non valido.</p>
        </div>
      </div>
    )
  }

  if (!data) return null

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-3xl mx-auto px-4 py-12">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center bg-blue-600 rounded-2xl">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Le tue foto AI sono pronte</h1>
          <p className="mt-2 text-sm text-gray-500">
            {data.completed} foto · Stile {STYLE_LABELS[data.style] || data.style}
          </p>
        </div>

        {/* Download All */}
        <div className="mb-6 text-center">
          <button
            onClick={downloadAll}
            disabled={zipping}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition disabled:opacity-60"
          >
            {zipping ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Creazione ZIP...
              </>
            ) : (
              <>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                Scarica tutte ({data.photos.length} foto)
              </>
            )}
          </button>
        </div>

        {/* Photo Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {data.photos.map((photo) => (
            <div key={photo.index} className="group relative bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100">
              <img
                src={photo.url}
                alt={`Foto ${photo.index + 1}`}
                className="w-full aspect-[4/3] object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition flex items-center justify-center opacity-0 group-hover:opacity-100">
                <a
                  href={photo.url}
                  download={`foto_${photo.index + 1}.png`}
                  className="px-4 py-2 bg-white rounded-lg text-sm font-semibold text-gray-900 shadow-lg"
                >
                  Scarica
                </a>
              </div>
              <div className="px-3 py-2">
                <span className="text-xs text-gray-500">Foto {photo.index + 1}</span>
              </div>
            </div>
          ))}
        </div>

        {/* Failed notice */}
        {data.failed > 0 && (
          <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
            {data.failed} foto non riuscite. I crediti corrispondenti sono stati rimborsati.
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 text-center text-xs text-gray-400">
          <p>I link di download scadono dopo 7 giorni.</p>
          <p className="mt-1">
            <a href="https://www.getnearme.it" className="hover:text-gray-600">GetNearMe</a>
            {' · '}
            <a href="https://www.getnearme.it/legal/privacy" className="hover:text-gray-600">Privacy</a>
            {' · '}
            <a href="https://www.getnearme.it/legal/terms" className="hover:text-gray-600">Termini</a>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function DownloadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="w-8 h-8 border-3 border-gray-200 border-t-blue-600 rounded-full animate-spin" />
        </div>
      }
    >
      <DownloadContent />
    </Suspense>
  )
}
