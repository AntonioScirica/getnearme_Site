'use client';

import { useEffect, useState } from 'react';

// Freccia "scorri" sotto l'hero (solo mobile): invita a scrollare e scompare al
// primo scroll. Nasce dall'analisi Clarity: su mobile lo scroll medio è ~6,7%,
// il primo schermo sembra auto-conclusivo → manca l'indizio che c'è altro sotto.
export default function ScrollCue() {
  const [hidden, setHidden] = useState(false);
  useEffect(() => {
    // capture:true intercetta lo scroll da qualsiasi contenitore (non solo window);
    // leggo da più sorgenti per coprire window/documentElement/body.
    const onScroll = () => {
      const y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      setHidden(y > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    return () => window.removeEventListener('scroll', onScroll, { capture: true } as EventListenerOptions);
  }, []);

  return (
    <div
      className="scroll-cue md:!hidden"
      aria-hidden="true"
      style={{
        position: 'fixed',
        bottom: 18,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 40,
        opacity: hidden ? 0 : 1,
        transition: 'opacity .3s ease',
        pointerEvents: 'none',
      }}
    >
      <span
        style={{
          width: 44,
          height: 44,
          borderRadius: 999,
          background: '#fff',
          border: '1px solid rgba(26,26,46,0.10)',
          boxShadow: '0 6px 18px rgba(16,24,40,0.16)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#3B83F6',
          animation: 'scroll-cue-bounce 1.6s ease-in-out infinite',
        }}
      >
        <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="m6 9 6 6 6-6" />
        </svg>
      </span>
      <style>{`@keyframes scroll-cue-bounce { 0%,100% { transform: translateY(0); } 50% { transform: translateY(6px); } }`}</style>
    </div>
  );
}
