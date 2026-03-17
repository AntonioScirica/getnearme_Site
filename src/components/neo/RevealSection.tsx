'use client';

import { useEffect, useRef, useState, ReactNode } from 'react';

interface RevealSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
  threshold?: number;
}

export default function RevealSection({ children, className = '', delay = 0, threshold = 0.15 }: RevealSectionProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

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
      { threshold }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(30px)',
        transition: `all 0.5s cubic-bezier(0.34,1.56,0.64,1) ${delay}ms`,
      }}
    >
      {children}
    </div>
  );
}
