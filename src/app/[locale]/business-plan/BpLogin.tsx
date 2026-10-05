'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Lock } from 'lucide-react'

export default function BpLogin() {
  const router = useRouter()
  const [pw, setPw] = useState('')
  const [err, setErr] = useState(false)
  const [busy, setBusy] = useState(false)
  const send = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr(false)
    const r = await fetch('/api/bp-login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ password: pw }) })
    setBusy(false)
    if (r.ok) router.refresh(); else setErr(true)
  }
  return (
    <form onSubmit={send} className="mx-auto mt-[12vh] max-w-sm rounded-[32px] bg-white p-8 shadow-[0_8px_32px_rgba(0,0,0,.06)]">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-canvas"><Lock size={18} /></div>
      <h1 className="mt-4 font-display text-2xl font-bold tracking-tight">Business plan</h1>
      <p className="mt-1 text-sm text-muted">Pagina riservata, inserisci la password.</p>
      <input type="password" value={pw} onChange={e => setPw(e.target.value)} autoFocus autoComplete="current-password" aria-label="Password"
        className="mt-5 h-12 w-full rounded-full bg-canvas px-5 text-sm outline-none ring-1 ring-inset ring-black/5 focus:ring-[#537eec]" />
      {err && <p className="mt-2 text-sm text-red-600">Password sbagliata.</p>}
      <button type="submit" disabled={busy || !pw} className="mt-4 h-12 w-full rounded-full bg-ink text-sm font-semibold text-white ease-smooth transition-opacity hover:opacity-90 disabled:opacity-40">{busy ? 'Un attimo...' : 'Entra'}</button>
    </form>
  )
}
