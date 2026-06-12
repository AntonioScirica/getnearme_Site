import { Figtree } from 'next/font/google';
import type { ReactNode } from 'react';

// Figtree is the design's typeface. Scope it to the dashboard so the marketing
// site (Satoshi) is untouched.
const figtree = Figtree({ subsets: ['latin'], weight: ['400', '500', '600', '700', '800'], display: 'swap' });

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={figtree.className} style={{ height: '100vh', overflow: 'hidden', background: '#faf9f7' }}>
      {children}
    </div>
  );
}
