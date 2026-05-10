'use client';

import { useRef, useEffect } from 'react';

interface VideoStyle {
  label: string;
  src: string;
  type: 'video' | 'image';
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
    src: '/assets/png/gif/ai_video_templates.png',
    type: 'image',
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

  useEffect(() => {
    const v = videoRef.current;
    if (v && current.type === 'video') {
      v.load();
      v.play().catch(() => {});
    }
  }, [activeStyle, current.type]);

  return (
    <div style={{ width: '100%', aspectRatio: '16 / 10', position: 'relative' }}>
      {current.type === 'video' ? (
        <video
          ref={videoRef}
          autoPlay
          loop={autoLoop}
          muted
          playsInline
          key={current.src}
          onEnded={!autoLoop ? onVideoEnd : undefined}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
        >
          <source src={current.src} type="video/mp4" />
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
