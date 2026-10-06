import type { Metadata } from 'next'
import { immoMeta } from '@/lib/ogMeta'
import { cookies } from 'next/headers'
import BusinessPlanView from '@/components/platform/BusinessPlanView'
import { BP_COOKIE, bpToken } from '@/lib/bpAuth'
import BpLogin from './BpLogin'

// Business plan dinamico fuori dalla piattaforma, per soci e partner: password, niente indice, niente sitemap.
export const metadata: Metadata = { title: 'Business plan', description: 'Business plan riservato di Agente Immo.', ...immoMeta({ title: 'Business plan, Agente Immo', description: 'Business plan riservato di Agente Immo.', url: 'https://agenteimmo.me/it/business-plan', card: { title: 'Business plan', subtitle: 'Documento riservato per soci e partner.' } }), robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } } }
export const dynamic = 'force-dynamic'

export default async function Page() {
  const token = bpToken()
  const ok = !!token && (await cookies()).get(BP_COOKIE)?.value === token
  return (
    <main className="min-h-dvh bg-canvas px-4 py-8 text-ink sm:px-8">
      <div className="mx-auto max-w-[1280px]">{ok ? <BusinessPlanView userKey="bp-public" noActuals /> : <BpLogin />}</div>
    </main>
  )
}
