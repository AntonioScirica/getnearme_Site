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
          boxShadow: open ? '5px 5px 0 #f59e0b' : '4px 4px 0px #1a1a2e',
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
              border: '2px solid #1a1a2e',
              fontSize: 20,
              fontWeight: 900,
              transition: 'all 0.3s',
              transform: open ? 'rotate(45deg)' : 'rotate(0)',
              flexShrink: 0,
              marginLeft: 12,
              boxShadow: '2px 2px 0 #1a1a2e',
            }}
          >
            +
          </span>
        </div>
        <div style={{ maxHeight: open ? 200 : 0, overflow: 'hidden', transition: 'max-height 0.4s ease' }}>
          <p style={{ color: '#777', fontSize: 14, lineHeight: 1.7, margin: '14px 0 0' }}>{answer}</p>
        </div>
      </div>
    </RevealSection>
  );
}
