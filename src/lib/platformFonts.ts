import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google';

// Font della nuova piattaforma e del portfolio pubblico (variabili CSS usate da
// --font-display / --font-body in globals.css).
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap', preload: false });
const instrument = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument', display: 'swap', preload: false });

export const platformFontVars = `${bricolage.variable} ${instrument.variable}`;
