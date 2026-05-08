'use client';

import { useState } from 'react';
import { Icon } from '@/lib/icons';
import RevealSection from './RevealSection';

interface FeatureShowcaseProps {
  feature: { num: string; title: string; desc: string; icon: string; color: string };
  videoSrc?: string;
  index: number;
  reverse: boolean;
}

export default function FeatureShowcase({ feature: f, videoSrc, index, reverse }: FeatureShowcaseProps) {
  const [hovered, setHovered] = useState(false);
  const bg = index % 2 === 0 ? '#fafaf8' : '#f3f4f6';

  const sectionIds = ['ai-photos', 'ai-video', 'social-posts', 'reports', 'zone-analysis', 'price-calculator'];
  const sectionId = sectionIds[index] || `feature-${index}`;

  return (
    <div id={sectionId} style={{ background: bg }} className="scroll-mt-20">
      <RevealSection delay={80}>
        <div
          style={{
            maxWidth: 1100,
            margin: '0 auto',
            padding: '64px 24px',
            display: 'flex',
            flexDirection: reverse ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: 48,
          }}
          className="feature-showcase-row"
        >
          {/* Media */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              onMouseEnter={() => setHovered(true)}
              onMouseLeave={() => setHovered(false)}
              style={{
                background: '#fff',
                borderRadius: 16,
                overflow: 'hidden',
                border: '3px solid #1a1a2e',
                boxShadow: hovered ? '8px 8px 0px #1a1a2e' : '6px 6px 0px #1a1a2e',
                transform: hovered ? 'translate(-2px,-4px)' : 'translate(0,0)',
                transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
              }}
            >
              {videoSrc && (
                <div style={{ aspectRatio: '16 / 10' }}>
                  {/\.(png|jpe?g|webp|gif)$/i.test(videoSrc) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={videoSrc}
                      alt={f.title}
                      className="w-full h-full"
                      style={{ objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <video
                      autoPlay
                      loop
                      muted
                      playsInline
                      className="w-full h-full"
                      style={{ objectFit: 'cover', display: 'block' }}
                    >
                      <source src={videoSrc} type="video/mp4" />
                    </video>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span
                style={{
                  width: 56,
                  height: 56,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${f.color}15`,
                  borderRadius: 16,
                  border: `2px solid ${f.color}40`,
                  color: f.color,
                }}
              >
                <Icon name={f.icon} size={28} />
              </span>
              <span
                style={{
                  fontFamily: 'monospace',
                  color: f.color,
                  fontSize: 14,
                  fontWeight: 800,
                  background: `${f.color}12`,
                  padding: '4px 10px',
                  borderRadius: 8,
                }}
              >
                {f.num}
              </span>
            </div>

            <h3
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: '#1a1a2e',
                margin: '0 0 12px',
                lineHeight: 1.2,
              }}
            >
              {f.title}
            </h3>

            <div
              style={{
                width: 48,
                height: 4,
                borderRadius: 2,
                background: f.color,
                marginBottom: 16,
              }}
            />

            <p
              style={{
                color: '#52525b',
                fontSize: 16,
                lineHeight: 1.7,
                margin: 0,
              }}
            >
              {f.desc}
            </p>
          </div>
        </div>
      </RevealSection>

      <style>{`
        @media (max-width: 768px) {
          .feature-showcase-row {
            flex-direction: column !important;
            gap: 32px !important;
            padding: 48px 20px !important;
          }
        }
      `}</style>
    </div>
  );
}
