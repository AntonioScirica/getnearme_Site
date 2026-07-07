'use client';

import { useState } from 'react';
import RevealSection from './RevealSection';

interface Testimonial {
  name: string;
  role: string;
  text: string;
  avatar: string;
  color: string;
  photo?: string;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  index?: number;
}

export default function TestimonialCard({ testimonial: t, index = 0 }: TestimonialCardProps) {
  const [imgError, setImgError] = useState(false);
  const showPhoto = !!t.photo && !imgError;
  return (
    <RevealSection delay={index * 120}>
      <div
        className="neo-border neo-shadow h-full"
        style={{
          background: '#fff',
          borderRadius: 14,
          padding: '25px 22px',
          width: '100%',
        }}
      >
        <div style={{ color: '#3B83F6', fontSize: 16, marginBottom: 11, letterSpacing: 2 }}>★★★★★</div>
        <p style={{ color: '#555', fontSize: 13, lineHeight: 1.75, margin: '0 0 18px' }}>
          &ldquo;{t.text}&rdquo;
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
          {showPhoto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={t.photo}
              alt={t.name}
              width={41}
              height={41}
              onError={() => setImgError(true)}
              style={{
                width: 41,
                height: 41,
                borderRadius: 11,
                objectFit: 'cover',
                border: '1px solid rgba(26,26,46,0.10)',
                boxShadow: '0 2px 10px rgba(16,24,40,0.06)',
                display: 'block',
                flexShrink: 0,
              }}
            />
          ) : (
            <div
              style={{
                width: 41,
                height: 41,
                borderRadius: 11,
                background: t.color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontWeight: 900,
                fontSize: 13,
                border: '1px solid rgba(26,26,46,0.10)',
                boxShadow: '0 2px 10px rgba(16,24,40,0.06)',
                flexShrink: 0,
              }}
            >
              {t.avatar}
            </div>
          )}
          <div>
            <div style={{ color: '#1a1a2e', fontWeight: 800, fontSize: 13 }}>{t.name}</div>
            <div style={{ color: '#6b7280', fontSize: 11 }}>{t.role}</div>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
