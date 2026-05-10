'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Icon } from '@/lib/icons';
import { X, Play } from 'lucide-react';

interface MediaItem {
  type: 'image' | 'video';
  src: string;
  aspect?: 'vertical' | 'horizontal';
  title?: string;
  desc?: string;
}

interface SocialItem {
  src: string;
  title: string;
  desc: string;
}

function getSlug(src: string) {
  return src.split('/').pop()?.replace(/\.[^.]+$/, '') || '';
}

interface GalleryProps {
  variant: 'gallery' | 'icon' | 'social';
  media?: MediaItem[];
  posts?: SocialItem[];
  reels?: SocialItem[];
  color?: string;
  iconName?: string;
}

function Lightbox({ item, onClose }: { item: MediaItem; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    window.history.pushState({ lightbox: true }, '');
    const onPop = () => onClose();
    window.addEventListener('popstate', onPop);
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
      window.removeEventListener('popstate', onPop);
    };
  }, [onClose]);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(0,0,0,0.9)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
        cursor: 'zoom-out',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'rgba(255,255,255,0.3)',
          border: 'none',
          borderRadius: '50%',
          width: 48,
          height: 48,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          zIndex: 10,
        }}
      >
        <X size={26} />
      </button>
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '85vw', maxHeight: '85vh', cursor: 'default' }}>
        {item.type === 'video' ? (
          <video
            autoPlay
            muted
            controls
            playsInline
            style={{ maxWidth: '85vw', maxHeight: '85vh', borderRadius: 8 }}
          >
            <source src={item.src} type="video/mp4" />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.src}
            alt=""
            style={{ maxWidth: '85vw', maxHeight: '85vh', borderRadius: 8, objectFit: 'contain' }}
          />
        )}
      </div>
    </div>
  );
}

export default function ReferenceGallery({ variant, media = [], posts = [], reels = [], color = '#6366f1', iconName }: GalleryProps) {
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);
  const refsMap = useRef<Record<string, HTMLDivElement | null>>({});

  const closeLightbox = useCallback(() => setLightboxItem(null), []);

  const allItems: MediaItem[] = variant === 'social'
    ? [
        ...posts.map(p => ({ type: 'image' as const, src: p.src, title: p.title, desc: p.desc })),
        ...reels.map(r => ({ type: 'video' as const, src: r.src, title: r.title, desc: r.desc })),
      ]
    : media;

  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const match = allItems.find(m => getSlug(m.src) === hash);
    if (match) {
      const el = refsMap.current[hash];
      if (el) {
        setTimeout(() => {
          el.scrollIntoView({ behavior: 'smooth', block: 'center' });
          setLightboxItem(match);
        }, 300);
      }
    }
  }, [allItems]);

  if (variant === 'icon') {
    return <Icon name={iconName || 'sparkles'} size={22} />;
  }

  if (variant === 'social') {
    const pairs = posts.map((p, i) => ({ post: p, reel: reels[i] }));
    return (
      <>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {pairs.map((pair, i) => {
            const postSlug = getSlug(pair.post.src);
            const reelSlug = pair.reel ? getSlug(pair.reel.src) : '';
            return (
              <div key={i} className="ref-social-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, alignItems: 'start' }}>
                <div
                  id={postSlug}
                  ref={(el) => { refsMap.current[postSlug] = el; }}
                  onClick={() => setLightboxItem({ type: 'image', src: pair.post.src, title: pair.post.title, desc: pair.post.desc })}
                  style={{
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1.5px solid #e2e8f0',
                    cursor: 'zoom-in',
                    background: '#fff',
                  }}
                >
                  <div style={{ background: '#000' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={pair.post.src} alt="" style={{ width: '100%', display: 'block' }} />
                  </div>
                  <div style={{ padding: '10px 12px 12px' }}>
                    <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', margin: '0 0 2px', lineHeight: 1.3 }}>{pair.post.title}</h4>
                    <p style={{ fontSize: 12, color: '#666', margin: 0, lineHeight: 1.4 }}>{pair.post.desc}</p>
                  </div>
                </div>

                {pair.reel && (
                  <div
                    id={reelSlug}
                    ref={(el) => { refsMap.current[reelSlug] = el; }}
                    onClick={() => setLightboxItem({ type: 'video', src: pair.reel.src, title: pair.reel.title, desc: pair.reel.desc })}
                    style={{
                      borderRadius: 12,
                      overflow: 'hidden',
                      border: '1.5px solid #e2e8f0',
                      cursor: 'zoom-in',
                      background: '#fff',
                    }}
                  >
                    <div style={{ position: 'relative', background: '#000' }}>
                      <video muted playsInline loop autoPlay style={{ width: '100%', display: 'block' }}>
                        <source src={pair.reel.src} type="video/mp4" />
                      </video>
                      <div
                        style={{
                          position: 'absolute',
                          top: 8,
                          right: 8,
                          background: 'rgba(0,0,0,0.5)',
                          borderRadius: '50%',
                          width: 26,
                          height: 26,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Play size={12} color="#fff" fill="#fff" />
                      </div>
                    </div>
                    <div style={{ padding: '10px 12px 12px' }}>
                      <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', margin: '0 0 2px', lineHeight: 1.3 }}>{pair.reel.title}</h4>
                      <p style={{ fontSize: 12, color: '#666', margin: 0, lineHeight: 1.4 }}>{pair.reel.desc}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {lightboxItem && <Lightbox item={lightboxItem} onClose={closeLightbox} />}

        <style>{`
          @media (max-width: 768px) {
            .ref-social-row {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </>
    );
  }

  return (
    <>
      <div className="ref-gallery" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, alignItems: 'start' }}>
        {media.map((item, i) => {
          const slug = getSlug(item.src);
          return (
            <div
              key={i}
              id={slug}
              ref={(el) => { refsMap.current[slug] = el; }}
              onClick={() => setLightboxItem(item)}
              className="ref-gallery-item"
              style={{
                borderRadius: 12,
                overflow: 'hidden',
                border: '1.5px solid #e2e8f0',
                cursor: 'zoom-in',
                background: '#fff',
              }}
            >
              <div style={{ position: 'relative', background: '#000' }}>
                {item.type === 'video' ? (
                  <>
                    <video
                      muted
                      playsInline
                      loop
                      autoPlay
                      style={{ width: '100%', display: 'block' }}
                    >
                      <source src={item.src} type="video/mp4" />
                    </video>
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        background: 'rgba(0,0,0,0.5)',
                        borderRadius: '50%',
                        width: 26,
                        height: 26,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Play size={12} color="#fff" fill="#fff" />
                    </div>
                  </>
                ) : (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.src}
                    alt=""
                    style={{ width: '100%', display: 'block' }}
                  />
                )}
              </div>
              {item.title && (
                <div style={{ padding: '10px 12px 12px' }}>
                  <h4 style={{ fontSize: 14, fontWeight: 700, color: '#1a1a2e', margin: '0 0 2px', lineHeight: 1.3 }}>
                    {item.title}
                  </h4>
                  {item.desc && (
                    <p style={{ fontSize: 12, color: '#666', margin: 0, lineHeight: 1.4 }}>
                      {item.desc}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {lightboxItem && <Lightbox item={lightboxItem} onClose={closeLightbox} />}

      <style>{`
        @media (max-width: 768px) {
          .ref-gallery {
            grid-template-columns: 1fr !important;
            gap: 10px !important;
          }
        }
      `}</style>
    </>
  );
}
