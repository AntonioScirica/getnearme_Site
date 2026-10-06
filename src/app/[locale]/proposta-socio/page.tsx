import type { Metadata } from 'next'
import PropostaSocio from './PropostaSocio'

// Proposta di partnership per il socio e volto del brand: pagina riservata, niente indice, niente sitemap.
export const metadata: Metadata = {
  title: 'Proposta di partnership · agenteimmo.me',
  robots: { index: false, follow: false, nocache: true, googleBot: { index: false, follow: false } },
}

export default function Page() {
  return <PropostaSocio />
}
