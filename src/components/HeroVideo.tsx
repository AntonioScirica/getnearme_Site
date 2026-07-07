'use client';

import { useEffect, useState } from 'react';

// Hero above-the-fold: mostra SUBITO il poster (WebP ~50KB) come LCP istantaneo,
// e monta il <video> solo dopo il load/idle → i byte del video non competono
// col primo paint. L'utente vede la prima frame immediatamente, poi parte il loop.
// Prima di montare il <video> visibile, lo precarichiamo "a bordo campo" (elemento
// video staccato dal DOM) e aspettiamo 'loadeddata' (primo frame decodificato):
// cosi' lo swap poster->video non mostra mai un frame nero o uno stutter iniziale,
// parte gia' pronto a riprodurre.
// Finche' anche il poster non ha finito di decodificare, sotto c'e' uno skeleton
// shimmer (invece del box scuro vuoto) cosi' non sembra "che ci mette troppo".
const HERO_STYLE: React.CSSProperties = { position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block' };

export default function HeroVideo({ poster, src, ariaLabel }: { poster: string; src: string; ariaLabel: string }) {
  const [show, setShow] = useState(false);
  const [posterLoaded, setPosterLoaded] = useState(false);
  useEffect(() => {
    const idle = (cb: () => void) => (window.requestIdleCallback || ((f: () => void) => setTimeout(f, 200)))(cb);
    const preloadThenShow = () => {
      const v = document.createElement('video');
      v.muted = true;
      v.playsInline = true;
      v.preload = 'auto';
      v.addEventListener('loadeddata', () => setShow(true), { once: true });
      v.src = src;
      v.load();
    };
    if (document.readyState === 'complete') idle(preloadThenShow);
    else window.addEventListener('load', () => idle(preloadThenShow), { once: true });
  }, [src]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {!posterLoaded && <div className="hero-skeleton" aria-hidden="true" />}
      {show ? (
        <video autoPlay muted loop playsInline poster={poster} aria-label={ariaLabel} style={HERO_STYLE}>
          <source src={src} type="video/mp4" />
        </video>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={poster}
          alt={ariaLabel}
          fetchPriority="high"
          onLoad={() => setPosterLoaded(true)}
          ref={(el) => { if (el?.complete) setPosterLoaded(true); }}
          style={HERO_STYLE}
        />
      )}
      <style>{`
        .hero-skeleton {
          position: absolute;
          inset: 0;
          background: linear-gradient(100deg, #232744 30%, #2f3454 50%, #232744 70%);
          background-size: 200% 100%;
          animation: heroSkeleton 1.3s ease-in-out infinite;
        }
        @keyframes heroSkeleton {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
