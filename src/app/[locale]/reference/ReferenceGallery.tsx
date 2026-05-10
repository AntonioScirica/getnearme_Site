'use client';

import { useState, useCallback } from 'react';
import { Icon } from '@/lib/icons';
import { X, Play } from 'lucide-react';

interface MediaItem {
  type: 'image' | 'video';
  src: string;
  aspect?: 'vertical' | 'horizontal';
}

interface GalleryProps {
  variant: 'gallery' | 'icon';
  media?: MediaItem[];
  color?: string;
  iconName?: string;
}

function Lightbox({ item, onClose }: { item: MediaItem; onClose: () => void }) {
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
          background: 'rgba(255,255,255,0.15)',
          border: 'none',
          borderRadius: '50%',
          width: 44,
          height: 44,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          zIndex: 10,
        }}
      >
        <X size={24} />
      </button>
      <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: '90vw', maxHeight: '90vh', cursor: 'default' }}>
        {item.type === 'video' ? (
          <video
            autoPlay
            controls
            playsInline
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8 }}
          >
            <source src={item.src} type="video/mp4" />
          </video>
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={item.src}
            alt=""
            style={{ maxWidth: '90vw', maxHeight: '90vh', borderRadius: 8, objectFit: 'contain' }}
          />
        )}
      </div>
    </div>
  );
}

export default function ReferenceGallery({ variant, media = [], color = '#6366f1', iconName }: GalleryProps) {
  const [lightboxItem, setLightboxItem] = useState<MediaItem | null>(null);

  const closeLightbox = useCallback(() => setLightboxItem(null), []);

  if (variant === 'icon') {
    return <Icon name={iconName || 'sparkles'} size={22} />;
  }

  return (
    <>
      <div className="ref-gallery" style={{ columns: '2 280px', gap: 16 }}>
        {media.map((item, i) => (
          <div
            key={i}
            onClick={() => setLightboxItem(item)}
            className="ref-gallery-item"
            style={{
              breakInside: 'avoid',
              marginBottom: 16,
              borderRadius: 14,
              overflow: 'hidden',
              border: '3px solid #1a1a2e',
              boxShadow: '4px 4px 0px #1a1a2e',
              cursor: 'zoom-in',
              position: 'relative',
              background: '#000',
            }}
          >
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
                    top: 10,
                    right: 10,
                    background: 'rgba(0,0,0,0.6)',
                    borderRadius: '50%',
                    width: 32,
                    height: 32,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Play size={16} color="#fff" fill="#fff" />
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
        ))}
      </div>

      {lightboxItem && <Lightbox item={lightboxItem} onClose={closeLightbox} />}

      <style>{`
        @media (max-width: 768px) {
          .ref-gallery {
            columns: 2 !important;
            gap: 10px !important;
          }
          .ref-gallery-item {
            margin-bottom: 10px !important;
            border-width: 2px !important;
            box-shadow: 3px 3px 0px #1a1a2e !important;
          }
        }
      `}</style>
    </>
  );
}
