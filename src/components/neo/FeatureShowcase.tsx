'use client';

import { useState, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { Icon } from '@/lib/icons';
import RevealSection from './RevealSection';
import BeforeAfterSlider, { STAGING_STYLES } from '@/components/BeforeAfterSlider';
import VideoShowcase, { VIDEO_STYLES } from '@/components/VideoShowcase';
import SocialShowcase from '@/components/SocialShowcase';

interface FeatureShowcaseProps {
  feature: { num: string; title: string; desc: string; icon: string; color: string };
  videoSrc?: string;
  index: number;
  reverse: boolean;
}

const DEFAULT_SOCIAL_PHOTO = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=750&fit=crop';

export default function FeatureShowcase({ feature: f, videoSrc, index, reverse }: FeatureShowcaseProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'it';
  const [stagingStyle, setStagingStyle] = useState(0);
  const [videoStyle, setVideoStyle] = useState(0);
  const [videoFading, setVideoFading] = useState(false);
  const videoUserClicked = useRef(false);
  const [socialPhoto, setSocialPhoto] = useState(DEFAULT_SOCIAL_PHOTO);

  const handleVideoEnd = useCallback(() => {
    if (videoUserClicked.current) return;
    setVideoFading(true);
    setTimeout(() => {
      setVideoStyle(prev => (prev === 0 ? 1 : 0));
      setVideoFading(false);
    }, 400);
  }, []);

  const handleVideoStyleClick = useCallback((i: number) => {
    videoUserClicked.current = true;
    setVideoFading(true);
    setTimeout(() => {
      setVideoStyle(i);
      setVideoFading(false);
    }, 300);
  }, []);
  const bg = index % 2 === 0 ? '#fff' : '#f3f4f6';

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
          {/* Style buttons — mobile only, between text and media */}
          {(index === 0 || index === 1) && (
            <div className="feature-buttons-mobile" style={{ display: 'none', gap: 6, width: '100%', order: 2 }}>
              {(index === 0 ? STAGING_STYLES : VIDEO_STYLES).map((s, i) => {
                const active = index === 0 ? stagingStyle === i : videoStyle === i;
                const setStyle = index === 0 ? setStagingStyle : handleVideoStyleClick;
                const darkColor = index === 0 ? '#4338ca' : '#047857';
                const btnStyle = {
                  flex: 1,
                  padding: '9px 8px',
                  fontSize: 13,
                  fontWeight: 600,
                  borderRadius: 8,
                  border: `1px solid ${active ? darkColor + '55' : '#e5e7eb'}`,
                  background: active ? `${f.color}15` : '#fff',
                  color: active ? darkColor : '#666',
                  textAlign: 'center' as const,
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  textDecoration: 'none',
                };
                if ('type' in s && s.type === 'link') {
                  return (
                    <Link key={s.label} href={`/${locale}/reference`} style={btnStyle}>
                      {s.label}
                    </Link>
                  );
                }
                return (
                  <button key={s.label} onClick={() => setStyle(i)} style={btnStyle}>
                    {s.label}
                  </button>
                );
              })}
            </div>
          )}

          {/* Media */}
          <div className="feature-media" style={{ flex: 1, minWidth: 0, position: 'relative' }}>
            {index === 1 && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src="/staging/time.png"
                alt="Foto originale"
                className="timelaps-thumb hidden-mobile"
                style={{
                  position: 'absolute',
                  top: -20,
                  left: -100,
                  width: 90,
                  height: 'auto',
                  zIndex: 10,
                  pointerEvents: 'none',
                  opacity: videoStyle === 0 ? 1 : 0,
                  transition: 'opacity 0.4s ease',
                }}
              />
            )}
            <div
              style={{
                background: '#fff',
                borderRadius: 16,
                overflow: 'hidden',
                border: '1px solid rgba(26,26,46,0.10)',
                boxShadow: '0 6px 20px rgba(16,24,40,0.06)',
              }}
            >
              {index === 0 ? (
                <BeforeAfterSlider color={f.color} activeStyle={stagingStyle} />
              ) : index === 1 ? (
                <div style={{ opacity: videoFading ? 0 : 1, transition: 'opacity 0.4s ease' }}>
                  <VideoShowcase
                    activeStyle={videoStyle}
                    autoLoop={videoUserClicked.current}
                    onVideoEnd={handleVideoEnd}
                  />
                </div>
              ) : index === 2 ? (
                <SocialShowcase photo={socialPhoto} />
              ) : videoSrc ? (
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
              ) : null}
            </div>
          </div>

          {/* Text */}
          <div className="feature-text" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
              <span
                style={{
                  width: 44,
                  height: 44,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${f.color}15`,
                  borderRadius: 12,
                  border: `2px solid ${f.color}40`,
                  color: f.color,
                }}
              >
                <Icon name={f.icon} size={20} />
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
              {index === 5 ? (
                <>Prezzo medio<br className="md:hidden" /> di zona al m²</>
              ) : f.title}
            </h3>

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
            {index === 2 && (
              <div className="feature-upload-desktop" style={{ marginTop: 16 }}>
                <Link
                  href={`/${locale}#pricing`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px',
                    background: '#fff', color: f.color, fontSize: 14, fontWeight: 700,
                    borderRadius: 10, border: `1px solid ${f.color}55`,
                    textDecoration: 'none', transition: 'all 0.2s ease',
                  }}
                >
                  Prova con la tua foto
                </Link>
              </div>
            )}
            {(index === 0 || index === 1) && (
              <div className="feature-buttons-desktop" style={{ display: 'flex', gap: 6, marginTop: 16, flexWrap: 'wrap' }}>
                {(index === 0 ? STAGING_STYLES : VIDEO_STYLES).map((s, i) => {
                  const active = index === 0 ? stagingStyle === i : videoStyle === i;
                  const setStyle = index === 0 ? setStagingStyle : handleVideoStyleClick;
                  const darkColor = index === 0 ? '#4338ca' : '#047857';
                  const btnStyle = {
                    padding: '7px 18px',
                    fontSize: 13,
                    fontWeight: 600,
                    borderRadius: 8,
                    border: `1px solid ${active ? darkColor + '55' : '#e5e7eb'}`,
                    background: active ? `${f.color}15` : '#fff',
                    color: active ? darkColor : '#666',
                    minWidth: 80,
                    textAlign: 'center' as const,
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    textDecoration: 'none',
                  };
                  if ('type' in s && s.type === 'link') {
                    return (
                      <Link key={s.label} href={`/${locale}/reference`} style={btnStyle}>
                        {s.label}
                      </Link>
                    );
                  }
                  return (
                    <button key={s.label} onClick={() => setStyle(i)} style={btnStyle}>
                      {s.label}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* CTA mobile — below media */}
          {index === 2 && (
            <div className="feature-upload-mobile" style={{ display: 'none', width: '100%' }}>
              <Link
                href={`/${locale}#pricing`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  padding: '12px 20px', width: '100%',
                  background: '#fff', color: f.color, fontSize: 14, fontWeight: 700,
                  borderRadius: 10, border: `1px solid ${f.color}55`,
                  textDecoration: 'none', transition: 'all 0.2s ease',
                }}
              >
                Prova con la tua foto
              </Link>
            </div>
          )}
        </div>
      </RevealSection>

      <style>{`
        @media (max-width: 768px) {
          .feature-showcase-row {
            flex-direction: column !important;
            gap: 24px !important;
            padding: 48px 20px !important;
          }
          .feature-text {
            order: 1 !important;
            text-align: center !important;
            align-items: center !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .feature-media {
            order: 2 !important;
          }
          .feature-buttons-mobile {
            display: flex !important;
            order: 3 !important;
          }
          .feature-buttons-desktop {
            display: none !important;
          }
          .feature-upload-desktop {
            display: none !important;
          }
          .feature-upload-mobile {
            display: block !important;
            order: 4 !important;
          }
          .hidden-mobile {
            display: none !important;
          }
        }
        @keyframes uploadWiggle {
          0%, 80% { transform: rotate(0deg); }
          84% { transform: rotate(-12deg); }
          88% { transform: rotate(10deg); }
          92% { transform: rotate(-8deg); }
          96% { transform: rotate(6deg); }
          100% { transform: rotate(0deg); }
        }
        .upload-wiggle {
          animation: uploadWiggle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
