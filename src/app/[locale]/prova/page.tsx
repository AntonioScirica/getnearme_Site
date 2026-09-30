import type { Metadata } from 'next';
import { platformFontVars } from '@/lib/platformFonts';
import { TrialPage } from '@/components/landing/AgenteImmoLanding';

export const metadata: Metadata = { title: 'Prova gratis', robots: { index: false, follow: false } };

export default async function Prova({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  return <div className={platformFontVars}><TrialPage lang={locale === 'en' ? 'en' : 'it'} /></div>;
}
