import type { Metadata } from 'next';
import { locales } from '@/lib/i18n';
import { platformFontVars } from '@/lib/platformFonts';
import AgenteImmoLanding from '@/components/landing/AgenteImmoLanding';

// Home di agenteimmo.me: landing di Agente Immo (solo in italiano, stessa pagina per ogni lingua).
// ponytail: la vecchia landing GetNearMe (estensione) e' nella storia git, prima del commit che l'ha sostituita.
export const metadata: Metadata = {
  title: { absolute: 'Agente Immo, più incarichi e case vendute prima' },
  description: 'Più incarichi e case vendute prima: ogni immobile si presenta al meglio, con foto arredate, video e il tuo sito, senza fotografo né web agency da pagare. Prova gratis, senza carta.',
  alternates: { canonical: 'https://agenteimmo.me/it' },
  openGraph: { title: 'Agente Immo', description: 'Più incarichi, case vendute prima. Senza spendere di più.', images: ['/immo/home/staging-after.webp'] },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function Home() {
  return <div className={platformFontVars}><AgenteImmoLanding /></div>;
}
