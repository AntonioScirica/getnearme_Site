'use client';

import { useState, useEffect, useRef } from 'react';
import { Flame } from 'lucide-react';

interface ProgressBarProps {
  agenciesText: string;
  spotsText: string;
}

export default function ProgressBar({ agenciesText, spotsText }: ProgressBarProps) {
  const [width, setWidth] = useState(0);
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  useEffect(() => {
    if (visible) setTimeout(() => setWidth(78), 300);
  }, [visible]);

  return (
    <div ref={ref} style={{ marginTop: 36, textAlign: 'center' }}>
      <div style={{ color: '#888', fontSize: 13, marginBottom: 10, display: 'inline-flex', alignItems: 'center', gap: 6, width: '100%', justifyContent: 'center' }}>
        <Flame size={16} color="#dc2626" strokeWidth={2.5} />
        <strong style={{ color: '#1a1a2e' }}>{agenciesText}</strong> —{' '}
        <strong style={{ color: '#dc2626' }}>{spotsText}</strong>
      </div>
      <div
        className="neo-border"
        style={{
          background: '#f1f5f9',
          borderRadius: 10,
          height: 14,
          maxWidth: 500,
          margin: '0 auto',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${width}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #f59e0b, #dc2626)',
            borderRadius: 10,
            transition: 'width 1.5s cubic-bezier(0.34,1.56,0.64,1)',
          }}
        />
      </div>
    </div>
  );
}
