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
      <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center">
        <div className="w-8 h-8 border-[3px] border-gray-200 border-t-[#2563EB] rounded-full animate-spin" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center px-4">
        <div className="w-full max-w-[560px] bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">
          <img
            src="https://ecrnpyksnfyykqwnutwa.supabase.co/storage/v1/object/public/email-assets/stripe_header.png"
            alt="GetNearMe"
            className="w-full h-auto"
          />
          <div className="px-8 py-10 text-center">
            <div className="w-14 h-14 mx-auto mb-4 flex items-center justify-center bg-red-50 rounded-2xl">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><line x1="15" y1="9" x2="9" y2="15" /><line x1="9" y1="9" x2="15" y2="15" />
              </svg>
            </div>
            <h1 className="text-lg font-bold text-[#1F2937] mb-2">{error}</h1>
            <p className="text-sm text-[#6b7280]">Il link potrebbe essere scaduto o non valido.</p>
          </div>
          <div className="px-8 py-5 bg-[#f9fafb] border-t border-[#e5e7eb] text-center text-xs text-[#6b7280] leading-relaxed">
            GetNearMe<br />
            <a href="https://www.getnearme.it/legal/privacy" className="text-[#6b7280] underline">Privacy</a>
            {' · '}
            <a href="https://www.getnearme.it/legal/terms" className="text-[#6b7280] underline">Termini</a>
            {' · info@getnearme.it'}
          </div>
        </div>
      </div>
    )
  }

  if (!data) return null

  const styleLabel = STYLE_LABELS[data.style] || data.style

  return (
    <div className="min-h-screen bg-[#f4f5f7] py-8 px-4">
      <div className="w-full max-w-[560px] mx-auto bg-white border border-[#e5e7eb] rounded-xl overflow-hidden">

        {/* Header image */}
        <img
          src="https://ecrnpyksnfyykqwnutwa.supabase.co/storage/v1/object/public/email-assets/stripe_header.png"
          alt="GetNearMe"
          className="w-full h-auto block"
        />

        {/* Intro text */}
        <div className="px-8 pt-4 pb-4 text-[15px] leading-relaxed text-[#1F2937]" style={{ fontFamily: '-apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
          <p className="mb-4">Ciao,</p>
          <p className="mb-4">le tue <strong>{data.completed}</strong> foto AI con stile <strong>{styleLabel}</strong> sono pronte.</p>
          <p className="mb-4">Puoi scaricarle subito e iniziare a usarle per i tuoi annunci, contenuti social o presentazioni immobiliari.</p>
        </div>

        {/* Info card with details + download button */}
        <div className="px-8 pb-4">
          <div className="border border-[#e5e7eb] rounded-xl overflow-hidden">
            <div className="px-[18px] py-4 text-[13px] text-[#374151] border-b border-[#e5e7eb]">
              <div className="flex justify-between items-center">
                <span className="text-[#6b7280]">Foto elaborate</span>
                <span className="text-[#1F2937]">{data.completed} di {data.total}</span>
              </div>
              <div className="flex justify-between items-center mt-[10px]">
                <span className="text-[#6b7280]">Stile</span>
                <span className="text-[#1F2937]">{styleLabel}</span>
              </div>
              <div className="flex justify-between items-center mt-[10px]">
                <span className="text-[#6b7280]">Formato</span>
                <span className="text-[#1F2937]">PNG</span>
              </div>
            </div>
            <div className="px-[18px] py-4">
              <button
                onClick={downloadAll}
                disabled={zipping}
                className="w-full py-3 bg-[#2563EB] text-white text-sm font-semibold rounded-lg hover:bg-[#1d4ed8] transition disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {zipping ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Creazione ZIP...
                  </>
                ) : (
                  <>Scarica tutte le foto (ZIP)</>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Photo grid */}
        <div className="px-8 pb-4">
          <div className="grid grid-cols-2 gap-3">
            {data.photos.map((photo) => (
              <div key={photo.index} className="group relative rounded-lg overflow-hidden border border-[#e5e7eb]">
                <img
                  src={photo.url}
                  alt={`Foto ${photo.index + 1}`}
                  className="w-full aspect-[4/3] object-cover block"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
                  <a
                    href={photo.url}
                    download={`foto_${photo.index + 1}.png`}
                    className="px-4 py-2 bg-white rounded-lg text-xs font-semibold text-[#1F2937] shadow-lg hover:bg-gray-50 transition"
                  >
                    Scarica
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tips */}
        <div className="px-8 pt-[18px] pb-2 text-sm leading-relaxed text-[#374151]" style={{ fontFamily: '-apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
          <p className="mb-2 font-semibold text-[#1F2937]">Consigli utili:</p>
          <ul className="mb-4 pl-5 text-[#4b5563] list-disc">
            <li className="mb-1">Scarica le foto da computer per ottenere la massima qualità.</li>
            <li className="mb-1">Perfette per annunci immobiliari, social media e presentazioni.</li>
          </ul>
        </div>

        {/* Failed notice */}
        {data.failed > 0 && (
          <div className="px-8 pb-4">
            <div className="px-[18px] py-[14px] bg-red-50 border border-red-200 rounded-[10px] text-[13px] leading-relaxed text-red-800">
              {data.failed} foto non riuscite. I crediti corrispondenti sono stati rimborsati automaticamente.
            </div>
          </div>
        )}

        {/* Amber warning */}
        <div className="px-8 py-2 pb-4">
          <div className="px-[18px] py-[14px] bg-[#fffbeb] border border-[#fde68a] rounded-[10px] text-[13px] leading-relaxed text-[#92400e]" style={{ fontFamily: '-apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
            I link di download resteranno attivi per <strong>7 giorni</strong>. Dopo la scadenza i file non saranno più disponibili.
          </div>
        </div>

        {/* Sign-off */}
        <div className="px-8 py-2 pb-6 text-sm text-[#4b5563]" style={{ fontFamily: '-apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
          Buon lavoro,
          <p className="mt-2 text-sm font-semibold text-[#111827]">Il team di GetNearMe</p>
        </div>

        {/* Footer */}
        <div className="px-8 py-[18px] pb-6 bg-[#f9fafb] border-t border-[#e5e7eb] text-center text-xs leading-relaxed text-[#6b7280]" style={{ fontFamily: '-apple-system, Segoe UI, Roboto, Arial, sans-serif' }}>
          GetNearMe<br />
          Hai ricevuto questa email perché hai richiesto delle foto AI dall&apos;estensione.<br />
          <a href="https://www.getnearme.it/legal/privacy" className="text-[#6b7280] underline">Privacy</a>
          {' · '}
          <a href="https://www.getnearme.it/legal/terms" className="text-[#6b7280] underline">Termini</a>
          {' · info@getnearme.it'}
        </div>

      </div>
    </div>
  )
}

export default function DownloadPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#f4f5f7] flex items-center justify-center">
          <div className="w-8 h-8 border-[3px] border-gray-200 border-t-[#2563EB] rounded-full animate-spin" />
        </div>
      }
    >
      <DownloadContent />
    </Suspense>
  )
}
