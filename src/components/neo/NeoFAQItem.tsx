'use client';

import { useState } from 'react';
import RevealSection from './RevealSection';

interface NeoFAQItemProps {
  question: string;
  answer: string;
  index?: number;
}

export default function NeoFAQItem({ question, answer, index = 0 }: NeoFAQItemProps) {
  const [open, setOpen] = useState(false);

  return (
    <RevealSection delay={index * 50}>
      <div
        onClick={() => setOpen(!open)}
        className="neo-border cursor-pointer"
        style={{
          background: open ? '#fffbeb' : '#fff',
          borderRadius: 14,
          padding: '18px 22px',
          boxShadow: open ? '0 6px 18px rgba(245,158,11,0.20)' : '0 2px 10px rgba(16,24,40,0.06)',
          transition: 'all 0.3s',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ color: '#1a1a2e', fontWeight: 800, fontSize: 15 }}>{question}</span>
          <span
            style={{
              width: 34,
              height: 34,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: open ? '#f59e0b' : '#fffbeb',
              borderRadius: 10,
              color: open ? '#fff' : '#f59e0b',
              border: '1px solid rgba(26,26,46,0.10)',
              fontSize: 20,
              fontWeight: 900,
              transition: 'all 0.3s',
              transform: open ? 'rotate(45deg)' : 'rotate(0)',
              flexShrink: 0,
              marginLeft: 12,
              boxShadow: '0 1px 6px rgba(16,24,40,0.06)',
            }}
          >
            +
          </span>
        </div>
        <div style={{ maxHeight: open ? 200 : 0, overflow: 'hidden', transition: 'max-height 0.4s ease' }}>
          <p style={{ color: '#444', fontSize: 14, lineHeight: 1.7, margin: '14px 0 0' }}>{answer}</p>
        </div>
      </div>
    </RevealSection>
  );
}
