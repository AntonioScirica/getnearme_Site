'use client';

import { useEffect, useRef, useState } from 'react';

// Video below-the-fold: NON scarica al load. La <source> viene montata solo
// quando la sezione entra nel viewport (IntersectionObserver) → primo paint
// rapido su mobile. Nasce dall'analisi Clarity: home caricava ~9MB di video al
// load, utenti mobile (browser in-app FB) uscivano in ~1s su schermo vuoto.
export default function LazyVideo({
  src,
  poster,
  className,
  style,
}: {
  src: string;
  poster?: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const [load, setLoad] = useState(false);

  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) setLoad(true);
          else v.pause();
        }
      },
      { rootMargin: '300px 0px' },
    );
    io.observe(v);
    return () => io.disconnect();
  }, []);

  // Quando la <source> compare (in vista), forza load + play.
  useEffect(() => {
    const v = ref.current;
    if (load && v) {
      v.load();
      v.play().catch(() => {});
    }
  }, [load]);

  return (
    <video ref={ref} loop muted playsInline preload="none" poster={poster} className={className} style={style}>
      {load && <source src={src} type="video/mp4" />}
    </video>
  );
}
