'use client';

import { useState, ReactNode } from 'react';
import RevealSection from './RevealSection';

interface NeoCardProps {
  children: ReactNode;
  className?: string;
  index?: number;
}

export default function NeoCard({ children, className = '', index = 0 }: NeoCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <RevealSection delay={index * 70}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className={`neo-border bg-white ${className}`}
        style={{
          borderRadius: 16,
          padding: '28px 24px',
          boxShadow: hovered ? '0 12px 28px rgba(16,24,40,0.10)' : '0 6px 20px rgba(16,24,40,0.06)',
          transform: hovered ? 'translate(-2px,-4px)' : 'translate(0,0)',
          transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          cursor: 'default',
        }}
      >
        {children}
      </div>
    </RevealSection>
  );
}
