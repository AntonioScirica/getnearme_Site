'use client';

import Script from 'next/script';
import { usePathname } from 'next/navigation';

// Widget di feedback Writhink (commenti con screenshot) sulle pagine di Agente Immo.
// Non sui siti degli agenti (agenteimmo.me/<slug>, riscritti su /<lingua>/a/<slug>): sono i siti dei clienti.
export default function FeedbackWidget() {
  const path = usePathname() ?? '';
  if (/^\/[a-z]{2}\/a\//.test(path)) return null;
  return <Script src="https://writhink.com/widget/w.js?key=wk_live_b351860fe63028fd10f68bcd7af94e9c18cb3abcbfef8cc3" strategy="lazyOnload" />;
}
