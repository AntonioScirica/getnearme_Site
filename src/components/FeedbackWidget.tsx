'use client';

import Script from 'next/script';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

// Widget di feedback Writhink (commenti con screenshot) sulle pagine di Agente Immo.
// Si nasconde sotto i popup che coprirebbe (classe gnm-hide-feedback sul body, globals.css).
// Non sui siti degli agenti (agenteimmo.me/<slug>, riscritti su /<lingua>/a/<slug>): sono i siti dei clienti.
export default function FeedbackWidget() {
  const path = usePathname() ?? '';
  // solo da computer (>= 1024 px): su telefono e tablet il bottone copre la barra in basso e i bottoni
  const [wide, setWide] = useState(false);
  useEffect(() => { setWide(window.matchMedia('(min-width: 1024px)').matches); }, []);
  if (!wide || /^\/[a-z]{2}\/(a\/|proposta-socio|business-plan)/.test(path)) return null; // niente widget sui siti degli agenti e sulle pagine riservate
  return <Script src="https://writhink.com/widget/w.js?key=wk_live_b351860fe63028fd10f68bcd7af94e9c18cb3abcbfef8cc3" strategy="lazyOnload" />;
}
