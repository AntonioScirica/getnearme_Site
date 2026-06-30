'use client';

import { useRef, useEffect, useState } from 'react';

interface VideoStyle {
  label: string;
  src: string;
  type: 'video' | 'image' | 'link';
}

const VIDEO_STYLES: VideoStyle[] = [
  {
    label: 'Timelaps AI',
    src: '/staging/timelaps_ai.mp4',
    type: 'video',
  },
  {
    label: 'Prima/Dopo',
    src: '/staging/prima_dopo.mp4',
    type: 'video',
  },
  {
    label: 'Vedi tutti',
    src: '',
    type: 'link',
  },
];

export { VIDEO_STYLES };

interface VideoShowcaseProps {
  activeStyle?: number;
  autoLoop?: boolean;
  onVideoEnd?: () => void;
}

export default function VideoShowcase({ activeStyle = 0, autoLoop = true, onVideoEnd }: VideoShowcaseProps) {
  const current = VIDEO_STYLES[activeStyle];
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  // Lazy: il video scarica/parte solo quando la sezione entra nel viewport.
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const io = new IntersectionObserver(
      (entries) => { for (const e of entries) { if (e.isIntersecting) setVisible(true); else videoRef.current?.pause(); } },
      { rootMargin: '300px 0px' },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    const v = videoRef.current;
    if (v && visible && current.type === 'video') {
      v.load();
      v.play().catch(() => {});
    }
  }, [activeStyle, current.type, visible]);

  return (
    <div ref={wrapRef} style={{ width: '100%', aspectRatio: '16 / 10', position: 'relative' }}>
      {current.type === 'video' ? (
        <video
          ref={videoRef}
          loop={autoLoop}
          muted
          playsInline
          preload="none"
          key={current.src}
          onEnded={!autoLoop ? onVideoEnd : undefined}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        >
          {visible && <source src={current.src} type="video/mp4" />}
        </video>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={current.src}
          alt="Video AI templates"
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        />
      )}
    </div>
  );
}
