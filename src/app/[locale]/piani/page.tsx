import type { Metadata } from 'next'
import PlansRedirect from './PlansRedirect'

// Link "Vedi i piani" delle email (08/10/2026): chi e' loggato va ai piani dentro la piattaforma, gli altri alla
// sezione prezzi del sito. L'email non sa chi e' loggato, lo decide la pagina all'apertura.
export const metadata: Metadata = { title: 'Piani', robots: { index: false, follow: false } }

export default async function Page({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params
  return <PlansRedirect locale={locale === 'en' ? 'en' : 'it'} />
}
