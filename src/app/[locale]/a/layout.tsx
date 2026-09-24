import type { ReactNode } from 'react';
import { platformFontVars } from '@/lib/platformFonts';

export default function PortfolioLayout({ children }: { children: ReactNode }) {
  return <div className={`${platformFontVars} dots-bg min-h-screen font-body text-ink`}>{children}</div>;
}
