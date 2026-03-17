'use client';

import RevealSection from './RevealSection';

interface Testimonial {
  name: string;
  role: string;
  text: string;
  avatar: string;
  color: string;
}

interface TestimonialCardProps {
  testimonial: Testimonial;
  index?: number;
}

export default function TestimonialCard({ testimonial: t, index = 0 }: TestimonialCardProps) {
  return (
    <RevealSection delay={index * 120}>
      <div
        className="neo-border neo-shadow h-full"
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '28px 24px',
          width: '100%',
        }}
      >
        <div style={{ color: '#f59e0b', fontSize: 18, marginBottom: 12, letterSpacing: 2 }}>★★★★★</div>
        <p style={{ color: '#555', fontSize: 14, lineHeight: 1.75, margin: '0 0 20px' }}>
          &ldquo;{t.text}&rdquo;
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div
            style={{
              width: 46,
              height: 46,
              borderRadius: 12,
              background: t.color,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              fontWeight: 900,
              fontSize: 14,
              border: '2px solid #1a1a2e',
              boxShadow: '3px 3px 0 #1a1a2e',
            }}
          >
            {t.avatar}
          </div>
          <div>
            <div style={{ color: '#1a1a2e', fontWeight: 800, fontSize: 14 }}>{t.name}</div>
            <div style={{ color: '#aaa', fontSize: 12 }}>{t.role}</div>
          </div>
        </div>
      </div>
    </RevealSection>
  );
}
