import type { Metadata } from 'next'
import { immoMeta } from '@/lib/ogMeta'
import PropostaSocio from './PropostaSocio'

// Proposta di partnership per il socio e volto del brand: pagina riservata, niente indice, niente sitemap.
const DESCRIPTION = 'Proposta riservata di partnership con Agente Immo, il software per agenti immobiliari.'
export const metadata: Metadata = {
  title: { absolute: 'Proposta di partnership | Agente Immo' },
  description: DESCRIPTION,
  ...immoMeta({ title: 'Proposta di partnership, Agente Immo', description: DESCRIPTION, url: 'https://agenteimmo.me/it/proposta-socio', card: { title: 'Proposta di partnership', subtitle: 'Riservata. Il piano per far crescere Agente Immo, insieme.' } }),
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

export default function Page() {
  return <PropostaSocio />
}
