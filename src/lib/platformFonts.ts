import { Plus_Jakarta_Sans } from 'next/font/google';

// Font della nuova piattaforma e del portfolio pubblico: Plus Jakarta Sans (geometrico, deciso,
// feeling "Airbnb"). Stessa famiglia per titoli e testo; le variabili CSS mantengono i nomi
// storici (--font-bricolage per i titoli, --font-instrument per il testo) usati in globals.css.
const display = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['500', '600', '700', '800'], variable: '--font-bricolage', display: 'swap', preload: false });
const body = Plus_Jakarta_Sans({ subsets: ['latin'], weight: ['400', '500', '600'], variable: '--font-instrument', display: 'swap', preload: false });

export const platformFontVars = `${display.variable} ${body.variable}`;
