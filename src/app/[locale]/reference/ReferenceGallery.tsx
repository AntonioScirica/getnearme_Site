'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { Icon } from '@/lib/icons';
import { X, Play, ChevronLeft, ChevronRight } from 'lucide-react';
import LazyVideo from '@/components/LazyVideo';

interface MediaItem {
  type: 'image' | 'video';
  src: string;
  aspect?: 'vertical' | 'horizontal';
  title?: string;
  desc?: string;
  // Frame statico mostrato mentre il video non e' ancora caricato (preload
  // none): senza, e' un rettangolo nero finche' l'IntersectionObserver non
  // scatta — su rete lenta/browser in-app puo' durare abbastanza da leggersi
  // come "non caricato" (visto in Clarity).
  poster?: string;
}

interface SocialItem {
  src: string;
  title: string;
  desc: string;
  poster?: string;
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
  // 'slider': carosello orizzontale con frecce anche su desktop (homepage).
  // Default 'grid' (pagina /reference, 3 colonne).
  layout?: 'grid' | 'slider';
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
        padding: 18,
        cursor: 'zoom-out',
      }}
    >
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: 14,
          right: 14,
          background: 'rgba(255,255,255,0.3)',
          border: 'none',
          borderRadius: '50%',
          width: 43,
          height: 43,
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
            style={{ maxWidth: '85vw', maxHeight: '85vh', borderRadius: 7 }}
          >
            <source src={item.src} type="video/mp4" />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.src}
            alt=""
            style={{ maxWidth: '85vw', maxHeight: '85vh', borderRadius: 7, objectFit: 'contain' }}
          />
        )}
      </div>
    </div>
  );
}

export default function ReferenceGallery({ variant, media = [], posts = [], reels = [], color = '#6366f1', iconName, layout = 'grid' }: GalleryProps) {
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);
  const refsMap = useRef<Record<string, HTMLDivElement | null>>({});
  const sliderRef = useRef<HTMLDivElement | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);
  const slideBy = (dir: 1 | -1) => {
    const el = sliderRef.current;
    if (el) el.scrollBy({ left: dir * el.clientWidth * 0.9, behavior: 'smooth' });
  };
  const updateEdges = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);
  useEffect(() => {
    if (layout !== 'slider') return;
    updateEdges();
    const el = sliderRef.current;
    if (!el) return;
    el.addEventListener('scroll', updateEdges, { passive: true });
    window.addEventListener('resize', updateEdges);
    return () => {
      el.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
    };
  }, [layout, updateEdges, media.length]);

  const hashHandled = useRef(false);

  const closeLightbox = useCallback(() => {
    setLightboxItem(null);
    if (window.location.hash) history.replaceState(null, '', window.location.pathname);
  }, []);

  const allItems: MediaItem[] = variant === 'social'
    ? [
        ...posts.map(p => ({ type: 'image' as const, src: p.src, title: p.title, desc: p.desc })),
        ...reels.map(r => ({ type: 'video' as const, src: r.src, title: r.title, desc: r.desc })),
      ]
    : media;

  useEffect(() => {
    if (hashHandled.current) return;
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const match = allItems.find(m => getSlug(m.src) === hash);
    if (match) {
      hashHandled.current = true;
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
        <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
          {pairs.map((pair, i) => {
            const postSlug = getSlug(pair.post.src);
            const reelSlug = pair.reel ? getSlug(pair.reel.src) : '';
            return (
              <div key={i} className="ref-social-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 11, alignItems: 'start' }}>
                <div
                  id={postSlug}
                  ref={(el) => { refsMap.current[postSlug] = el; }}
                  onClick={() => setLightboxItem({ type: 'image', src: pair.post.src, title: pair.post.title, desc: pair.post.desc })}
                  style={{
                    borderRadius: 11,
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
                  <div style={{ padding: '9px 11px 11px' }}>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', margin: '0 0 2px', lineHeight: 1.3 }}>{pair.post.title}</h4>
                    <p style={{ fontSize: 11, color: '#666', margin: 0, lineHeight: 1.4 }}>{pair.post.desc}</p>
                  </div>
                </div>

                {pair.reel && (
                  <div
                    id={reelSlug}
                    ref={(el) => { refsMap.current[reelSlug] = el; }}
                    onClick={() => setLightboxItem({ type: 'video', src: pair.reel.src, title: pair.reel.title, desc: pair.reel.desc })}
                    style={{
                      borderRadius: 11,
                      overflow: 'hidden',
                      border: '1.5px solid #e2e8f0',
                      cursor: 'zoom-in',
                      background: '#fff',
                    }}
                  >
                    <div style={{ position: 'relative', background: '#000' }}>
                      <LazyVideo src={pair.reel.src} poster={pair.reel.poster} style={{ width: '100%', display: 'block' }} />
                      <div
                        style={{
                          position: 'absolute',
                          top: 7,
                          right: 7,
                          background: 'rgba(0,0,0,0.5)',
                          borderRadius: '50%',
                          width: 23,
                          height: 23,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Play size={12} color="#fff" fill="#fff" />
                      </div>
                    </div>
                    <div style={{ padding: '9px 11px 11px' }}>
                      <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', margin: '0 0 2px', lineHeight: 1.3 }}>{pair.reel.title}</h4>
                      <p style={{ fontSize: 11, color: '#666', margin: 0, lineHeight: 1.4 }}>{pair.reel.desc}</p>
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
      <div className={layout === 'slider' ? 'ref-slider-wrap' : undefined} style={{ position: 'relative' }}>
      {layout === 'slider' && (
        <>
          <button
            aria-label="Precedente"
            onClick={() => slideBy(-1)}
            className="ref-slider-arrow"
            style={{ left: 18, opacity: atStart ? 0 : 1, pointerEvents: atStart ? 'none' : 'auto' }}
          >
            <ChevronLeft size={22} strokeWidth={2.5} />
          </button>
          <button
            aria-label="Successivo"
            onClick={() => slideBy(1)}
            className="ref-slider-arrow"
            style={{ right: 18, opacity: atEnd ? 0 : 1, pointerEvents: atEnd ? 'none' : 'auto' }}
          >
            <ChevronRight size={22} strokeWidth={2.5} />
          </button>
        </>
      )}
      <div ref={sliderRef} className={layout === 'slider' ? 'ref-gallery ref-gallery-slider' : 'ref-gallery'} style={layout === 'slider' ? { display: 'flex', gap: 11, overflowX: 'auto', scrollSnapType: 'x proximity', scrollbarWidth: 'none' } : { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 11 }}>
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
                borderRadius: 11,
                overflow: 'hidden',
                border: '1.5px solid #e2e8f0',
                cursor: 'zoom-in',
                background: '#fff',
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div style={{ position: 'relative', background: '#000' }}>
                {item.type === 'video' ? (
                  <>
                    <LazyVideo src={item.src} poster={item.poster} style={{ width: '100%', display: 'block' }} />
                    <div
                      style={{
                        position: 'absolute',
                        top: 7,
                        right: 7,
                        background: 'rgba(0,0,0,0.5)',
                        borderRadius: '50%',
                        width: 23,
                        height: 23,
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
                <div style={{ padding: '9px 11px 11px', flex: 1 }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', margin: '0 0 2px', lineHeight: 1.3 }}>
                    {item.title}
                  </h4>
                  {item.desc && (
                    <p style={{ fontSize: 11, color: '#666', margin: 0, lineHeight: 1.4 }}>
                      {item.desc}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      </div>

      {lightboxItem && <Lightbox item={lightboxItem} onClose={closeLightbox} />}

      <style>{`
        /* Full-bleed SOLO desktop: sotto i 768px il blocco mobile piu' in
           basso gestisce gia' il proprio bleed (margin -20px su .ref-gallery);
           applicarlo anche qui li farebbe sommare (doppio sfondamento, card
           attaccate ai bordi). */
        @media (min-width: 769px) {
          .ref-slider-wrap {
            width: 100vw;
            margin-left: calc(50% - 50vw);
            margin-right: calc(50% - 50vw);
          }
          .ref-gallery-slider {
            padding-left: max(20px, calc(50vw - 488px));
            padding-right: max(20px, calc(50vw - 488px));
            scroll-padding-left: max(20px, calc(50vw - 488px));
          }
        }
        .ref-gallery-slider::-webkit-scrollbar { display: none; }
        .ref-gallery-slider > .ref-gallery-item {
          /* Larghezza fissa, non un terzo esatto del contenitore: l'ultima card
             visibile resta tagliata a meta', segnale visivo che c'e' altro oltre
             lo schermo (invece di 3 card perfettamente contenute). */
          flex: 0 0 300px;
          scroll-snap-align: start;
        }
        .ref-slider-arrow {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          z-index: 2;
          width: 40px;
          height: 40px;
          border-radius: 50%;
          border: 1px solid rgba(26,26,46,0.12);
          background: #fff;
          color: #1a1a2e;
          font-size: 24px;
          line-height: 1;
          font-weight: 700;
          transition: opacity 0.2s ease;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(16,24,40,0.14);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform .15s ease, box-shadow .15s ease;
        }
        .ref-slider-arrow:hover {
          transform: translateY(-50%) scale(1.08);
          box-shadow: 0 6px 18px rgba(16,24,40,0.2);
        }
        @media (max-width: 768px) {
          .ref-slider-arrow { display: none; }
          /* Mobile: slider orizzontale (swipe) invece di card impilate */
          .ref-gallery {
            display: flex !important;
            grid-template-columns: none !important;
            overflow-x: auto;
            scroll-snap-type: x mandatory;
            -webkit-overflow-scrolling: touch;
            gap: 12px !important;
            padding: 0 20px 10px;
            margin: 0 -20px;
            scrollbar-width: none;
          }
          .ref-gallery::-webkit-scrollbar { display: none; }
          .ref-gallery > .ref-gallery-item {
            flex: 0 0 82%;
            scroll-snap-align: center;
          }
        }
      `}</style>
    </>
  );
}
