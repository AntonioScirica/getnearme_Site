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
      vid.playsInline = true;
      const extractFrame = () => {
        const vw = vid.videoWidth || 1080;
        const vh = vid.videoHeight || 1350;
        const scale = 0.15;
        const w = Math.max(Math.round(vw * scale), 1);
        const h = Math.max(Math.round(vh * scale), 1);
        const canvas = document.createElement('canvas');
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext('2d')!;
        ctx.filter = 'blur(8px)';
        try { ctx.drawImage(vid, 0, 0, w, h); } catch { /* tainted */ }
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      vid.onseeked = extractFrame;
      vid.onloadeddata = () => {
        if (vid.duration > 0.1) vid.currentTime = 0.1;
        else extractFrame();
      };
      vid.onerror = () => resolve('');
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
const blurCacheVideo = new Map<string, string>();

let fontsReadyPromise: Promise<void> | null = null;
function ensureTemplateFonts(): Promise<void> {
  if (fontsReadyPromise) return fontsReadyPromise;
  if (!document.getElementById('tpl-fonts')) {
    const link = document.createElement('link');
    link.id = 'tpl-fonts';
    link.rel = 'stylesheet';
    link.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(link);
  }
  fontsReadyPromise = document.fonts?.ready ? document.fonts.ready.then(() => {}) : Promise.resolve();
  return fontsReadyPromise;
}

type TemplatePreviewProps = {
  templateId: string;
  data: Record<string, unknown>;
  photoUrl: string;
  width?: number;
  opts?: Record<string, unknown>;
};

export default function TemplatePreview({ templateId, data, photoUrl, width = 200, opts = {} }: TemplatePreviewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const isVideo = !!opts.isVideo;
  const cache = isVideo ? blurCacheVideo : blurCache;
  const [blurredUrl, setBlurredUrl] = useState<string | null>(cache.get(photoUrl) || null);
  const [fontsReady, setFontsReady] = useState(false);
  // Minimum skeleton time so fast loads don't flash.
  const [minTimePassed, setMinTimePassed] = useState(false);

  useEffect(() => {
    ensureTemplateFonts().then(() => setFontsReady(true));
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMinTimePassed(true), 500);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    const c = isVideo ? blurCacheVideo : blurCache;
    if (c.has(photoUrl)) {
      setBlurredUrl(c.get(photoUrl)!);
      return;
    }
    setBlurredUrl(null);
    createBlurredImage(photoUrl, isVideo).then(b => {
      c.set(photoUrl, b);
      setBlurredUrl(b);
    });
  }, [photoUrl, isVideo]);

  useEffect(() => {
    if (!containerRef.current || blurredUrl === null || !fontsReady) return;
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
          h.style.transform = 'translateZ(0)';
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
  const ready = blurredUrl !== null && fontsReady && minTimePassed;

  useEffect(() => { ensureShimmerCSS(); }, []);

  return (
    <div style={{ position: 'relative', width, height: displayH }}>
      {!ready && (() => {
        // Scale skeleton metrics to the preview width so spacing reads well at
        // any size (grid card ~300px and large preview alike).
        const u = width / 300; // unit scale
        const bar = (h: number, c = 0.07) => ({ height: Math.round(h * u), borderRadius: Math.round(6 * u), background: `rgba(0,0,0,${c})` });
        return (
        <div style={{
          position: 'absolute', inset: 0, borderRadius: 8, overflow: 'hidden',
          background: 'transparent',
          backgroundImage: 'linear-gradient(90deg, #efece6 25%, #e6e2da 50%, #efece6 75%)',
          backgroundSize: '800px 100%',
          animation: 'tpl-shimmer 1.4s infinite linear',
        }}>
          <div style={{ position: 'absolute', inset: 0, padding: `${Math.round(34 * u)}px ${Math.round(30 * u)}px`, display: 'flex', flexDirection: 'column' }}>
            {/* badge */}
            <div style={{ width: Math.round(70 * u), ...bar(20, 0.06), borderRadius: Math.round(99 * u) }} />
            {/* title block */}
            <div style={{ height: Math.round(26 * u) }} />
            <div style={{ width: '82%', ...bar(22) }} />
            <div style={{ height: Math.round(12 * u) }} />
            <div style={{ width: '55%', ...bar(28, 0.09) }} />
            <div style={{ height: Math.round(14 * u) }} />
            <div style={{ width: '45%', ...bar(13, 0.05) }} />
            <div style={{ flex: 1 }} />
            {/* metric cards */}
            <div style={{ display: 'flex', gap: Math.round(12 * u) }}>
              <div style={{ flex: 1, ...bar(64, 0.06) }} />
              <div style={{ flex: 1, ...bar(64, 0.06) }} />
              <div style={{ flex: 1, ...bar(64, 0.06) }} />
            </div>
            <div style={{ height: Math.round(18 * u) }} />
            {/* description */}
            <div style={{ width: '92%', ...bar(12, 0.045) }} />
            <div style={{ height: Math.round(8 * u) }} />
            <div style={{ width: '78%', ...bar(12, 0.045) }} />
          </div>
        </div>
        );
      })()}
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
