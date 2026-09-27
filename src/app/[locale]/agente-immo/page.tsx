import type { Metadata } from 'next';
import { platformFontVars } from '@/lib/platformFonts';
import AgenteImmoLanding from '@/components/landing/AgenteImmoLanding';

// Landing di Agente Immo (piattaforma web per agenti): home staging AI, video, sito pronto.
export const metadata: Metadata = {
  title: { absolute: 'Agente Immo, foto arredate, video e sito per agenti immobiliari' },
  description: 'Carichi le foto di un immobile: l\'AI lo arreda, ne fa un video e lo pubblica sul tuo sito, già pronto con il tuo nome. Prova gratis, senza carta.',
  alternates: { canonical: 'https://www.getnearme.it/it/agente-immo' },
  openGraph: { title: 'Agente Immo', description: 'Foto arredate, video e sito. Pronti in minuti.', images: ['/immo/home/staging-after.webp'] },
};

export default function Page() {
  return <div className={platformFontVars}><AgenteImmoLanding /></div>;
}
