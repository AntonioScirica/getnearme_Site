import localFont from 'next/font/local';

// File dei caratteri nel repo (src/fonts, latin): con next/font/google la build su Vercel falliva quando Google Fonts
// non rispondeva (30/09 e 01/10/2026).

// Font della nuova piattaforma e del portfolio pubblico: Plus Jakarta Sans (geometrico, deciso,
// feeling "Airbnb"). Stessa famiglia per titoli e testo; le variabili CSS mantengono i nomi
// storici (--font-bricolage per i titoli, --font-instrument per il testo) usati in globals.css.
const display = localFont({ src: '../fonts/PlusJakartaSans-normal.woff2', weight: '200 800', variable: '--font-bricolage', display: 'swap', preload: false });
const body = localFont({ src: '../fonts/PlusJakartaSans-normal.woff2', weight: '200 800', variable: '--font-instrument', display: 'swap', preload: false });

// Corsivo serif per le parole d'accento ("Trilocale *luminoso*").
const serif = localFont({ src: [{ path: '../fonts/InstrumentSerif-normal.woff2', weight: '400', style: 'normal' }, { path: '../fonts/InstrumentSerif-italic.woff2', weight: '400', style: 'italic' }], variable: '--font-serif-accent', display: 'swap', preload: false });

export const platformFontVars = `${display.variable} ${body.variable} ${serif.variable}`;
