'use client';

import { useRef, useState, useCallback, useEffect } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface Style {
  label: string;
  before: string;
  after: string;
}

const STYLES: Style[] = [
  {
    label: 'Moderno',
    before: '/staging/1.webp',
    after: '/staging/2.webp',
  },
  {
    label: 'Vuoto',
    before: '/staging/3.jpg',
    after: '/staging/4.jpg',
  },
  {
    label: 'Custom',
    before: '/staging/5.jpg',
    after: '/staging/6.jpg',
  },
];

export { STYLES as STAGING_STYLES };

export default function BeforeAfterSlider({ color = '#6366f1', activeStyle = 0 }: { color?: string; activeStyle?: number }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const [dragging, setDragging] = useState(false);
  const [loaded, setLoaded] = useState<Record<string, boolean>>({});
  const [hinted, setHinted] = useState(false);
  const [animating, setAnimating] = useState(false);
  const interacted = useRef(false);
  const [fading, setFading] = useState(false);
  const [displayedStyle, setDisplayedStyle] = useState(activeStyle);
  const prevStyle = useRef(activeStyle);

  const current = STYLES[displayedStyle];

  const updatePos = useCallback((clientX: number) => {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = clientX - rect.left;
    const pct = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setPos(pct);
  }, []);

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    interacted.current = true;
    setAnimating(false);
    setDragging(true);
    updatePos(e.clientX);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [updatePos]);

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging) return;
    updatePos(e.clientX);
  }, [dragging, updatePos]);

  const onPointerUp = useCallback(() => {
    setDragging(false);
  }, []);

  // Crossfade on style change
  useEffect(() => {
    if (activeStyle === prevStyle.current) return;
    prevStyle.current = activeStyle;
    setFading(true);
    const t1 = setTimeout(() => {
      setDisplayedStyle(activeStyle);
      setAnimating(true);
      setPos(activeStyle === 1 ? 30 : activeStyle === 2 ? 60 : 50);
      setFading(false);
    }, 300);
    const t2 = setTimeout(() => setAnimating(false), 900);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [activeStyle]);

  // Hint animation: smooth wiggle slider once when it enters viewport
  useEffect(() => {
    const el = containerRef.current;
    if (!el || hinted) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !interacted.current && !hinted) {
          setHinted(true);
          setAnimating(true);
          // Animate: 50 → 30 → 70 → 50 with CSS transition
          const steps = [30, 70, 50];
          let i = 0;
          const run = () => {
            if (i >= steps.length || interacted.current) {
              setAnimating(false);
              return;
            }
            setPos(steps[i]);
            i++;
            setTimeout(run, 600);
          };
          setTimeout(run, 500);
          io.disconnect();
        }
      },
      { threshold: 0.5 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [hinted]);

  const handleImageLoad = (src: string) => {
    setLoaded(prev => ({ ...prev, [src]: true }));
  };

  return (
    <div style={{ width: '100%', opacity: fading ? 0 : 1, transition: 'opacity 0.3s ease' }}>
      {/* Slider container */}
      <div
        ref={containerRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        style={{
          position: 'relative',
          width: '100%',
          aspectRatio: '16 / 10',
          borderRadius: 12,
          overflow: 'hidden',
          cursor: 'ew-resize',
          userSelect: 'none',
          touchAction: 'none',
          background: '#f0f0f0',
        }}
      >
        {/* After (full background) */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={current.after}
          alt="Dopo"
          onLoad={() => handleImageLoad(current.after)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
          }}
        />

        {/* Before (clipped) */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            clipPath: `inset(0 ${100 - pos}% 0 0)`,
            transition: animating ? 'clip-path 0.6s ease-in-out' : 'none',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={current.before}
            alt="Prima"
            onLoad={() => handleImageLoad(current.before)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              display: 'block',
            }}
          />
        </div>

        {/* Divider line */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            bottom: 0,
            left: `${pos}%`,
            width: 3,
            background: '#fff',
            transform: 'translateX(-50%)',
            boxShadow: '0 0 8px rgba(0,0,0,0.3)',
            zIndex: 2,
            transition: animating ? 'left 0.6s ease-in-out' : 'none',
          }}
        />

        {/* Handle */}
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: `${pos}%`,
            transform: 'translate(-50%, -50%)',
            width: 44,
            height: 44,
            borderRadius: '50%',
            background: '#fff',
            boxShadow: '0 2px 12px rgba(0,0,0,0.25)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 2,
            zIndex: 3,
            transition: animating ? 'left 0.6s ease-in-out' : 'none',
          }}
        >
          <ChevronLeft size={16} color="#3B83F6" strokeWidth={2.5} />
          <ChevronRight size={16} color="#3B83F6" strokeWidth={2.5} />
        </div>

        {/* Labels */}
        <span
          style={{
            position: 'absolute',
            bottom: 12,
            left: 12,
            background: '#fff',
            color: '#1a1a2e',
            fontSize: 11,
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 6,
            zIndex: 1,
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}
        >
          Prima
        </span>
        <span
          style={{
            position: 'absolute',
            bottom: 12,
            right: 12,
            background: '#fff',
            color: '#1a1a2e',
            fontSize: 11,
            fontWeight: 600,
            padding: '3px 10px',
            borderRadius: 6,
            zIndex: 1,
            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
          }}
        >
          Dopo
        </span>
      </div>

      {/* Custom prompt tooltip */}
      <div style={{ display: 'grid', gridTemplateRows: activeStyle === 2 ? '1fr' : '0fr', transition: 'grid-template-rows 0.3s ease' }}>
        <div style={{ overflow: 'hidden' }}>
          <div
            style={{
              marginTop: 12,
              padding: '12px 20px',
              margin: '4px 4px 4px',
              background: '#1a1a2e',
              color: '#fff',
              borderRadius: 10,
              fontSize: 13,
              lineHeight: 1.5,
              display: 'flex',
              alignItems: 'flex-start',
              gap: 8,
              opacity: activeStyle === 2 ? 1 : 0,
              transition: 'opacity 0.3s ease',
            }}
          >
            <span style={{ fontWeight: 700, flexShrink: 0 }}>Prompt:</span>
            <span style={{ opacity: 0.85 }}>Cambia il quadro con la mappa dell&#39;italia, rendi il divano rosso e sposta la pianta vicino al divano</span>
          </div>
        </div>
      </div>
    </div>
  );
}
