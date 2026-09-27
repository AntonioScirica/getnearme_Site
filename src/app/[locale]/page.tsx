import type { Metadata } from 'next';
import { locales } from '@/lib/i18n';
import { platformFontVars } from '@/lib/platformFonts';
import AgenteImmoLanding from '@/components/landing/AgenteImmoLanding';

// Home di agenteimmo.me: landing di Agente Immo (solo in italiano, stessa pagina per ogni lingua).
// ponytail: la vecchia landing GetNearMe (estensione) e' nella storia git, prima del commit che l'ha sostituita.
export const metadata: Metadata = {
  title: { absolute: 'Agente Immo, foto arredate, video e sito per agenti immobiliari' },
  description: 'Carichi le foto di un immobile: l\'AI lo arreda, ne fa un video e lo pubblica sul tuo sito, già pronto con il tuo nome. Prova gratis, senza carta.',
  alternates: { canonical: 'https://agenteimmo.me/it' },
  openGraph: { title: 'Agente Immo', description: 'Foto arredate, video e sito. Pronti in minuti.', images: ['/immo/home/staging-after.webp'] },
};

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default function Home() {
  return <div className={platformFontVars}><AgenteImmoLanding /></div>;
}
