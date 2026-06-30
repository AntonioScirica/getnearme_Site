'use client';

import { useEffect, useState } from 'react';

// Hero above-the-fold: mostra SUBITO il poster (WebP ~50KB) come LCP istantaneo,
// e monta il <video> solo dopo il load/idle → i 333KB del video non competono
// col primo paint. L'utente vede la prima frame immediatamente, poi parte il loop.
const HERO_STYLE: React.CSSProperties = { width: '100%', height: '100%', objectFit: 'cover', display: 'block' };

export default function HeroVideo({ poster, src, ariaLabel }: { poster: string; src: string; ariaLabel: string }) {
  const [show, setShow] = useState(false);
  useEffect(() => {
    const idle = (cb: () => void) => (window.requestIdleCallback || ((f: () => void) => setTimeout(f, 200)))(cb);
    if (document.readyState === 'complete') idle(() => setShow(true));
    else window.addEventListener('load', () => idle(() => setShow(true)), { once: true });
  }, []);

  if (!show) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={poster} alt={ariaLabel} fetchPriority="high" style={HERO_STYLE} />;
  }
  return (
    <video autoPlay muted loop playsInline poster={poster} aria-label={ariaLabel} style={HERO_STYLE}>
      <source src={src} type="video/mp4" />
    </video>
  );
}
