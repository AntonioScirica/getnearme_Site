import localFont from 'next/font/local';
import { platformFontVars } from '@/lib/platformFonts';
import type { ReactNode } from 'react';
import InstallPrompt from '@/components/platform/InstallPrompt';

// Figtree is the design's typeface. Scope it to the dashboard so the marketing
// site (Satoshi) is untouched.
const figtree = localFont({ src: '../../../fonts/Figtree-normal.woff2', weight: '300 900', display: 'swap' }); // file nel repo: niente Google Fonts alla build

export default function DashboardLayout({ children }: { children: ReactNode }) {
  return (
    <div className={`${figtree.className} ${platformFontVars}`} style={{ height: '100vh', overflow: 'hidden', background: '#faf9f7' }}>
      {children}
      <InstallPrompt />
    </div>
  );
}
