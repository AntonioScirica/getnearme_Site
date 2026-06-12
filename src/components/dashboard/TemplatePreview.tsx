'use client';

import React, { useEffect, useRef, useState } from 'react';
import { renderTemplate } from './templates/index.js';
import './templates/styles.css';

const shimmerKeyframes = `@keyframes tpl-shimmer{0%{background-position:-400px 0}100%{background-position:400px 0}}`;
let shimmerInjected = false;
function ensureShimmerCSS() {
  if (shimmerInjected) return;
  const st = document.createElement('style');
  st.textContent = shimmerKeyframes;
  document.head.appendChild(st);
  shimmerInjected = true;
}

function createBlurredImage(imageUrl: string, isVideo?: boolean): Promise<string> {
  return new Promise((resolve) => {
    if (isVideo) {
      const vid = document.createElement('video');
      if (!imageUrl.startsWith('blob:')) vid.crossOrigin = 'anonymous';
      vid.muted = true;
      vid.preload = 'auto';
      vid.onloadeddata = () => {
        vid.currentTime = 0.1;
      };
      vid.onseeked = () => {
        const scale = 0.15;
        const w = Math.max(Math.round(vid.videoWidth * scale), 1);
        const h = Math.max(Math.round(vid.videoHeight * scale), 1);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.filter = 'blur(8px)';
        ctx.drawImage(vid, 0, 0, w, h);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      vid.onerror = () => resolve(imageUrl);
      vid.src = imageUrl;
      return;
    }
    const img = new Image();
    if (!imageUrl.startsWith('blob:')) img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = 0.15;
      const w = Math.max(Math.round(img.naturalWidth * scale), 1);
      const h = Math.max(Math.round(img.naturalHeight * scale), 1);
      const canvas = document.createElement('canvas');
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.filter = 'blur(8px)';
      ctx.drawImage(img, 0, 0, w, h);
      resolve(canvas.toDataURL('image/jpeg', 0.5));
    };
    img.onerror = () => resolve(imageUrl);
    img.src = imageUrl;
  });
}

const blurCache = new Map<string, string>();

let fontsReadyPromise: Promise<void> | null = null;
function ensureTemplateFonts(): Promise<void> {
  if (fontsReadyPromise) return fontsReadyPromise;
  if (!document.getElementById('tpl-fonts')) {
    const link = document.createElement('link');
    link.id = 'tpl-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap';
    document.head.appendChild(link);
  }
  fontsReadyPromise = document.fonts?.ready ? document.fonts.ready.then(() => {}) : Promise.resolve();
  return fontsReadyPromise;
}

type TemplatePreviewProps = {
  templateId: string;
  data: Record<string, string | null | undefined>;
  photoUrl: string;
  width?: number;
  opts?: Record<string, unknown>;
};

export default function TemplatePreview({ templateId, data, photoUrl, width = 200, opts = {} }: TemplatePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [blurredUrl, setBlurredUrl] = useState<string | null>(blurCache.get(photoUrl) || null);
  const [fontsReady, setFontsReady] = useState(false);

  useEffect(() => {
    ensureTemplateFonts().then(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    if (blurCache.has(photoUrl)) {
      setBlurredUrl(blurCache.get(photoUrl)!);
      return;
    }
    createBlurredImage(photoUrl, opts.isVideo as boolean).then(b => {
      blurCache.set(photoUrl, b);
      setBlurredUrl(b);
    });
  }, [photoUrl]);

  useEffect(() => {
    if (!containerRef.current || !blurredUrl || !fontsReady) return;
    containerRef.current.innerHTML = '';
    try {
      const mergedOpts = { ...opts, blurredUrl };
      const el = renderTemplate(templateId, data, photoUrl, mergedOpts) as HTMLElement;
      const nativeW = (opts.size as { w?: number })?.w || 1080;
      const nativeHi = (opts.size as { h?: number })?.h || 1350;
      el.style.width = nativeW + 'px';
      el.style.height = nativeHi + 'px';
      (el.style as unknown as Record<string, string>).zoom = String(width / nativeW);
      containerRef.current.appendChild(el);

      // Next.js PostCSS strips backdrop-filter from imported CSS — re-apply via JS
      const blurMap: Record<string, string> = {
        'tpl-glass-panel': 'blur(16px)',
        'tpl-metric-card': 'blur(12px)',
        'tpl-metric-pill': 'blur(12px)',
      };
      for (const [cls, val] of Object.entries(blurMap)) {
        el.querySelectorAll('.' + cls).forEach((node) => {
          const h = node as HTMLElement;
          h.style.backdropFilter = val;
          h.style.setProperty('-webkit-backdrop-filter', val);
        });
      }

      const dimAlpha = (opts.dimAlpha as number) ?? 1;
      el.querySelectorAll('.tpl-overlay').forEach((node) => {
        (node as HTMLElement).style.opacity = String(dimAlpha);
      });
    } catch (err) {
      console.error('TemplatePreview render failed:', templateId, err);
      containerRef.current.innerHTML = '<div style="display:flex;align-items:center;justify-content:center;height:100%;color:#8c867d;font-size:11px;">Preview</div>';
    }
  }, [templateId, data, photoUrl, width, opts, blurredUrl, fontsReady]);

  const nativeW = (opts.size as { w?: number })?.w || 1080;
  const nativeH = (opts.size as { h?: number })?.h || 1350;
  const scale = width / nativeW;
  const displayH = nativeH * scale;
  const ready = blurredUrl && fontsReady;

  useEffect(() => { ensureShimmerCSS(); }, []);

  return (
    <div style={{ position: 'relative', width, height: displayH }}>
      {!ready && (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 8, overflow: 'hidden',
          background: 'linear-gradient(90deg, #f0ede7 25%, #e8e4dc 50%, #f0ede7 75%)',
          backgroundSize: '800px 100%',
          animation: 'tpl-shimmer 1.5s infinite linear',
        }}>
          <div style={{ padding: '10%', display: 'flex', flexDirection: 'column', gap: '6%' }}>
            <div style={{ width: '35%', height: 14, borderRadius: 4, background: 'rgba(0,0,0,.06)' }} />
            <div style={{ width: '70%', height: 18, borderRadius: 4, background: 'rgba(0,0,0,.06)' }} />
            <div style={{ width: '50%', height: 12, borderRadius: 4, background: 'rgba(0,0,0,.04)' }} />
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: '4%' }}>
              <div style={{ flex: 1, height: 28, borderRadius: 6, background: 'rgba(0,0,0,.05)' }} />
              <div style={{ flex: 1, height: 28, borderRadius: 6, background: 'rgba(0,0,0,.05)' }} />
              <div style={{ flex: 1, height: 28, borderRadius: 6, background: 'rgba(0,0,0,.05)' }} />
            </div>
            <div style={{ width: '90%', height: 14, borderRadius: 4, background: 'rgba(0,0,0,.04)' }} />
          </div>
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          width,
          borderRadius: 8,
          opacity: ready ? 1 : 0,
          transition: 'opacity .3s',
        }}
      />
    </div>
  );
}
