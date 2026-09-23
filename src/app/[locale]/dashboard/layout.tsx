import { Figtree, Bricolage_Grotesque, Instrument_Sans } from 'next/font/google';
import type { ReactNode } from 'react';

// Figtree is the design's typeface. Scope it to the dashboard so the marketing
// site (Satoshi) is untouched.
const figtree = Figtree({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap' });
// Font della nuova piattaforma: solo variabili CSS, non preload (la vecchia UI non li usa).
const bricolage = Bricolage_Grotesque({ subsets: ['latin'], variable: '--font-bricolage', display: 'swap', preload: false });
const instrument = Instrument_Sans({ subsets: ['latin'], variable: '--font-instrument', display: 'swap', preload: false });

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${figtree.className} ${bricolage.variable} ${instrument.variable}`} style={{ height: '100vh', overflow: 'hidden', background: '#faf9f7' }}>
      {children}
    </div>
  );
}
