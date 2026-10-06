'use client';

// Scheda immobile, "Condividi sui social" (05/10/2026, a passi dal 06/10): 1 i social (anche piu' d'uno insieme) e il
// formato di ognuno, 2 le foto (una, o piu' per il carosello), 3 la grafica (la stessa per tutti, adattata a ogni formato),
// 4 i testi di tutti i social in colonna (entro i limiti di ognuno, lib/socialRules) e, se si vuole, il video dell'annuncio
// (api/platform/video-reel, gli stessi stili della chat), poi Scarica tutto o Condividi (il social che si guarda). Anteprima a sinistra in un riquadro
// fisso, il post ci sta dentro in ogni formato. Le grafiche sono quelle dei post della vecchia dashboard GetNearMe
// (components/dashboard/templates: renderTemplate + exporter) con i dati veri dell'immobile, il logo e il colore
// dell'agenzia (gli stessi di BrandCard, api/platform/site); il testo lo scrive l'AI per ogni social (api/platform/social-caption).
// Le grafiche restano in Poppins: sono il marchio dell'agente, non il nostro.
import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, Check, ChevronLeft, ChevronRight, Coins, Copy, Crop, Download, Facebook, Film, Instagram, Linkedin, Loader2, MessageCircle, Maximize2, Minimize2, Music2, Play, Plus, RotateCcw, Share2, Sparkles, TriangleAlert, X, ZoomIn, ZoomOut } from 'lucide-react';
import { renderTemplate, TEMPLATES as POST_TEMPLATES } from '@/components/dashboard/templates/index.js';
import { exportToPng } from '@/components/dashboard/templates/exporter.js';
import '@/components/dashboard/templates/styles.css';
import { isClosed, statusOf, STATUS_LABELS, zoneOnly } from '@/lib/siteTemplates';
import type { ProjectData } from '@/lib/projects';
import { CREDIT_COST } from '@/lib/pricing';
import { countChars, countTags, ruleOf } from '@/lib/socialRules';
import { MAX_REEL_PHOTOS, reelStyleLabel, StylePick, type ReelStyle, type ReelTpl } from './ReelSteps';
import { authFetch, portfolioUrl } from './api';
import { pageLang, tr } from './i18n';

type Safe = { top: number; bottom: number; left: number; right: number };
type Size = { w: number; h: number; safe: Safe };
type Fmt = { id: string; label: string; ratio: string; w: number; h: number; safe: Safe; multi?: boolean; pdf?: boolean };
type NetId = 'instagram' | 'facebook' | 'whatsapp' | 'tiktok' | 'linkedin';
const M60: Safe = { top: 60, bottom: 60, left: 60, right: 60 };
const f45 = (id: string, label: string, x: Partial<Fmt> = {}): Fmt => ({ id, label, ratio: '4:5', w: 1080, h: 1350, safe: M60, ...x });
const f11 = (id: string, label: string, x: Partial<Fmt> = {}): Fmt => ({ id, label, ratio: '1:1', w: 1080, h: 1080, safe: M60, ...x });
const f916 = (id: string, label: string, top: number, bottom: number, x: Partial<Fmt> = {}): Fmt => ({ id, label, ratio: '9:16', w: 1080, h: 1920, safe: { top, bottom, left: 0, right: 0 }, ...x });
// formati e misure di ogni social; nei 9:16 la safe area lascia libere le scritte del social (nome in alto, risposta in basso)
const NETS: { id: NetId; label: string; fmts: Fmt[] }[] = [
  { id: 'instagram', label: 'Instagram', fmts: [f45('post', 'Post'), f916('story', 'Storia o Reel', 200, 300), f45('carousel', 'Carosello', { multi: true })] },
  { id: 'facebook', label: 'Facebook', fmts: [f45('post', 'Post'), f916('story', 'Storia', 225, 275), f11('carousel', 'Carosello', { multi: true })] },
  { id: 'whatsapp', label: 'WhatsApp', fmts: [f916('status', 'Stato', 250, 250)] },
  { id: 'tiktok', label: 'TikTok', fmts: [f916('photo', 'Foto', 200, 340), f916('carousel', 'Carosello', 200, 340, { multi: true })] },
  { id: 'linkedin', label: 'LinkedIn', fmts: [f11('post', 'Post'), f45('doc', 'Carosello', { multi: true, pdf: true })] },
];
const MAX_PHOTOS = 9; // + la slide dei contatti = 10, il massimo dei caroselli
// grafiche senza foto a tutto schermo (la foto sta in una cornice): niente "riempi"
const NO_COVER = ['arch', 'split', 'frame', 'spotlight', 'before-after', 'gallery', 'tips'];
// grafiche che in un formato non reggono (testo o foto tagliati): si nascondono invece di deformarle
// (provate il 06/10/2026 con titoli lunghi: Fascia e Fascia Alt nel quadrato coprono il titolo, nel 9:16 restano mezze vuote)
const NO_FIT: Record<string, string[]> = { '1:1': ['topbar', 'topbar-alt'], '9:16': ['topbar', 'topbar-alt'] };
// tono delle grafiche, per i filtri del passo Grafica: chiare, scure, col colore dell'agenzia
type Tone = 'all' | 'sold' | 'light' | 'dark' | 'brand';
const TONE: Record<string, Exclude<Tone, 'all'>> = {
  'sold-stamp': 'sold', 'sold-elegant': 'sold', 'sold-classic': 'sold',
  arch: 'light', card: 'light', topbar: 'light',
  gradient: 'dark', centered: 'dark', elegant: 'dark', 'topbar-alt': 'dark', magazine: 'dark', clean: 'dark',
  blue: 'brand', diagonal: 'brand', fade: 'brand', spotlight: 'brand', split: 'brand', gallery: 'brand',
};
// famiglie di grafiche simili: se la scelta non regge il formato di un social, si usa la piu' vicina della stessa famiglia
const SIMILAR = [['sold-stamp', 'sold-classic', 'sold-elegant'], ['topbar-alt', 'centered', 'gradient', 'elegant', 'magazine', 'clean'], ['topbar', 'card', 'arch'], ['blue', 'diagonal', 'fade', 'spotlight', 'split', 'gallery', 'before-after']];
const STAGED_TEXT = 'Immagine arredata virtualmente';

type Brand = { logo: string | null; primary: string; agencyName: string; phone: string; site: string };
type Photo = { src: string; full: string; small: string; staged: boolean; original?: string; w: number; h: number; plan: boolean }; // plan: planimetria (fuori dal video)
// inquadratura di una foto (per immobile e foto): a tutto schermo o intera (se manca, decide il formato), zoom e punto (0..1)
type Frame = { fit?: 'cover' | 'contain'; z: number; x: number; y: number };
const FRAME0: Frame = { z: 1, x: 0.5, y: 0.5 };
// la foto nel riquadro come CSS object-fit + object-position + scale (lo stesso conto fa l'esportazione, exporter imgFit)
function applyFrame(img: HTMLElement, cover: boolean, f: Frame) {
  img.style.objectFit = cover ? 'cover' : 'contain';
  img.style.objectPosition = img.style.transformOrigin = `${f.x * 100}% ${f.y * 100}%`;
  img.style.transform = f.z !== 1 ? `scale(${f.z})` : '';
}

// testo dell'immobile pulito: entita' HTML (&nbsp; &amp; ...) decodificate, tag tolti, spazi normali
function cleanText(s?: string | null) {
  let t = String(s ?? '');
  for (let k = 0; k < 2 && /&[#a-z0-9]+;|<[a-z/]/i.test(t); k++) t = new DOMParser().parseFromString(t, 'text/html').documentElement.textContent ?? t;
  return t.replace(/\u00a0/g, ' ').replace(/\s+[\u2013\u2014]\s+/g, ', ').replace(/[\u2013\u2014]/g, '-').replace(/[ \t]+/g, ' ').replace(/\s*\n\s*/g, '\n').trim();
}
// ---------- caricamento ----------
let fontsP: Promise<void> | null = null;
function loadFonts() {
  if (fontsP) return fontsP;
  if (!document.getElementById('tpl-fonts')) {
    const l = document.createElement('link');
    l.id = 'tpl-fonts'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital@1&family=Poppins:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(l);
  }
  fontsP = new Promise<void>(r => setTimeout(r, 50))
    .then(() => Promise.all([...[300, 400, 500, 600, 700].map(w => document.fonts.load(`${w} 64px Poppins`).catch(() => null)), document.fonts.load('italic 400 64px "Playfair Display"').catch(() => null)]))
    .then(() => document.fonts.ready).then(() => undefined);
  return fontsP;
}

// foto in un blob locale: l'esportazione (canvas) non si "sporca" con foto di altri siti. R2 risponde con CORS,
// le foto dei portali passano dalle miniature del nostro server (960 px).
const blobCache = new Map<string, Promise<{ full: string; small: string; w: number; h: number; plan: boolean } | null>>();
function localPhoto(src: string) {
  if (!blobCache.has(src)) blobCache.set(src, (async () => {
    const get = async (u: string) => { const r = await fetch(u, { mode: 'cors', cache: 'no-store' }); /* no-store: la copia in cache delle <img> non ha l'intestazione CORS */ if (!r.ok || !(r.headers.get('content-type') ?? '').startsWith('image/')) throw new Error('img'); return r.blob(); };
    let blob: Blob | null = null;
    if (src.startsWith('data:') || src.startsWith('blob:')) blob = await (await fetch(src)).blob();
    else blob = await get(src).catch(() => get(`/api/thumb?w=960&u=${encodeURIComponent(src)}`)).catch(() => null);
    if (!blob) return null;
    const full = URL.createObjectURL(blob);
    let w = 0, h = 0, plan = false;
    // copia piccola per le miniature delle grafiche (17 anteprime dal vivo)
    const small = await createImageBitmap(blob).then(bm => {
      w = bm.width; h = bm.height;
      // planimetria: quasi tutta bianca e senza colore (24x24 punti bastano)
      const t = document.createElement('canvas'); t.width = t.height = 24;
      const tx = t.getContext('2d', { willReadFrequently: true })!; tx.drawImage(bm, 0, 0, 24, 24);
      const px = tx.getImageData(0, 0, 24, 24).data;
      let white = 0, sat = 0;
      for (let i = 0; i < px.length; i += 4) { const mx = Math.max(px[i], px[i + 1], px[i + 2]), mn = Math.min(px[i], px[i + 1], px[i + 2]); if (mn > 222) white++; sat += mx ? (mx - mn) / mx : 0; }
      plan = white / 576 > 0.55 && sat / 576 < 0.12;
      const k = Math.min(1, 540 / bm.width), c = document.createElement('canvas');
      c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k);
      c.getContext('2d')!.drawImage(bm, 0, 0, c.width, c.height);
      return new Promise<string>(ok => c.toBlob(b => ok(b ? URL.createObjectURL(b) : full), 'image/jpeg', 0.82));
    }).catch(() => full);
    return { full, small, w, h, plan };
  })());
  return blobCache.get(src)!;
}
// fondo sfocato (le grafiche "contieni" mostrano la foto intera su questo)
const blurCache = new Map<string, Promise<string>>();
function blurred(url: string) {
  if (!blurCache.has(url)) blurCache.set(url, new Promise(ok => {
    const img = new Image();
    img.onload = () => {
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.naturalWidth * 0.15)); c.height = Math.max(1, Math.round(img.naturalHeight * 0.15));
      const x = c.getContext('2d')!; x.filter = 'blur(8px)'; x.drawImage(img, 0, 0, c.width, c.height);
      ok(c.toDataURL('image/jpeg', 0.5));
    };
    img.onerror = () => ok(url);
    img.src = url;
  }));
  return blurCache.get(url)!;
}
async function toDataUrl(src: string | null) {
  if (!src) return null;
  if (src.startsWith('data:')) return src;
  const b = await fetch(src, { mode: 'cors', cache: 'no-store' }).then(r => (r.ok ? r.blob() : null)).catch(() => null);
  return b ? new Promise<string>(ok => { const fr = new FileReader(); fr.onload = () => ok(String(fr.result)); fr.readAsDataURL(b); }) : null;
}


// ---------- le slide ----------
type Tpl = { kind: 'tpl'; tpl: string; data: Record<string, unknown>; photo: string; size: Size; blur: string; logo: string | null; logoH: boolean; staged: boolean; photos?: string[]; fit: boolean; frame: Frame | null };
type Plain = { kind: 'plain'; photo: string; size: Size; blur: string; logo: string | null; accent: string; badge: string; staged: boolean; n: number; total: number; fit: boolean; frame: Frame };
type Contact = { kind: 'contact'; size: Size; logo: string | null; accent: string; brand: Brand; lines: string[]; n: number; total: number };
type Slide = Tpl | Plain | Contact;
const fitOf = (b: Slide) => (b.kind === 'contact' ? false : b.fit); // a tutto schermo (cover) o intera sul fondo sfocato (contain)
const frameOf = (b: Slide) => (b.kind === 'contact' ? null : b.frame);
// a tutto schermo se l'agente non ha scelto: si' nei post, no nel 9:16 (foto intera sul fondo sfocato); le grafiche con la foto in cornice mai
const autoFit = (tpl: string | null, h: number, f?: Frame) => (tpl && NO_COVER.includes(tpl) ? false : f?.fit ? f.fit === 'cover' : tpl ? h <= 1350 : true);
const css = (el: HTMLElement, s: Partial<CSSStyleDeclaration>) => { Object.assign(el.style, s); return el; };
const box = (tag = 'div') => document.createElement(tag);
const FONT = 'Poppins, sans-serif';
const inset = (s: Size) => ({ t: Math.max(60, s.safe.top), b: Math.max(60, s.safe.bottom), l: Math.max(60, s.safe.left), r: Math.max(60, s.safe.right) });
function stagedPill(el: HTMLElement, s: Size) {
  const row = css(box(), { position: 'absolute', left: '0', right: '0', bottom: (s.h > 1350 ? s.safe.bottom - 72 : 14) + 'px', display: 'flex', justifyContent: 'center', zIndex: '30', pointerEvents: 'none' });
  row.className = 'tpl-label';
  const pill = css(box('span'), { fontFamily: FONT, fontSize: '24px', fontWeight: '500', lineHeight: '24px', color: '#fff', background: 'rgba(0,0,0,.5)', padding: '10px 22px', borderRadius: '999px', whiteSpace: 'nowrap' });
  pill.textContent = STAGED_TEXT;
  row.appendChild(pill); el.appendChild(row);
}
function numberPill(el: HTMLElement, b: Plain | Contact, dark: boolean) {
  const p = css(box(), { position: 'absolute', right: inset(b.size).r + 'px', bottom: (b.size.h > 1350 ? b.size.safe.bottom : 60) + 'px', zIndex: '31', fontFamily: FONT, fontSize: '26px', fontWeight: '600', lineHeight: '26px', color: '#fff', background: dark ? 'rgba(0,0,0,.45)' : 'rgba(255,255,255,.18)', padding: '10px 20px', borderRadius: '999px' });
  p.className = 'tpl-label';
  p.textContent = `${b.n}/${b.total}`;
  el.appendChild(p);
}
function buildSlide(b: Slide): HTMLElement {
  if (b.kind === 'tpl') {
    const opts: Record<string, unknown> = {
      size: b.size, blurredUrl: b.blur, fitCover: fitOf(b), photos: b.photos,
      ...(b.logo ? { logoWhite: b.logo, logoBlack: b.logo, logoColored: b.logo, logoPosition: 'top-right', logoOrientation: b.logoH ? 'horizontal' : 'vertical' } : {}),
    };
    const el = renderTemplate(b.tpl, b.data, b.photo, opts as never) as HTMLElement; // opzioni in JSDoc incomplete (fitCover, loghi)
    el.style.width = b.size.w + 'px'; el.style.height = b.size.h + 'px';
    // il CSS importato perde backdrop-filter: si rimette a mano (come in TemplatePreview)
    for (const [cls, v] of [['tpl-glass-panel', 'blur(16px)'], ['tpl-metric-card', 'blur(12px)'], ['tpl-metric-pill', 'blur(12px)']]) {
      el.querySelectorAll<HTMLElement>('.' + cls).forEach(n => { n.style.backdropFilter = v; n.style.setProperty('-webkit-backdrop-filter', v); n.style.transform = 'translateZ(0)'; });
    }
    const fg = el.querySelector<HTMLElement>('.tpl-cover-fg');
    if (fg && b.frame) applyFrame(fg, b.fit, b.frame);
    if (b.tpl === 'before-after') el.querySelectorAll<HTMLElement>('.tpl-label').forEach(n => { n.textContent = n.textContent === 'BEFORE' ? 'PRIMA' : 'DOPO'; });
    if (b.staged) stagedPill(el, b.size);
    return el;
  }
  const el = css(box(), { width: b.size.w + 'px', height: b.size.h + 'px', position: 'relative', overflow: 'hidden', fontFamily: FONT });
  el.className = 'tpl';
  const ins = inset(b.size);
  if (b.kind === 'plain') {
    // slide del carosello: la foto a tutto riquadro con badge, logo e numero (variante pulita della grafica)
    const cover = box(); cover.className = 'tpl-cover';
    const bg = box('img') as HTMLImageElement; bg.className = 'tpl-cover-bg'; bg.src = b.blur; bg.alt = '';
    const fg = box('img') as HTMLImageElement; fg.className = 'tpl-cover-fg'; fg.src = b.photo; fg.alt = ''; applyFrame(fg, b.fit, b.frame);
    cover.append(bg, fg); el.appendChild(cover);
    el.appendChild(css(box(), { position: 'absolute', left: '0', right: '0', top: '0', height: '260px', background: 'linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,0))', zIndex: '1' }));
    const badge = css(box(), { position: 'absolute', top: ins.t + 'px', left: ins.l + 'px', zIndex: '5', background: b.accent, color: '#fff', fontSize: '28px', fontWeight: '600', lineHeight: '28px', padding: '12px 24px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '1px' });
    badge.className = 'tpl-badge'; badge.textContent = b.badge;
    el.appendChild(badge);
    if (b.logo) {
      const lg = css(box('img') as HTMLImageElement, { position: 'absolute', top: (ins.t - 6) + 'px', right: ins.r + 'px', height: '64px', maxWidth: '260px', objectFit: 'contain', zIndex: '5' }) as HTMLImageElement;
      lg.className = 'tpl-logo-overlay'; lg.src = b.logo; lg.alt = '';
      el.appendChild(lg);
    }
    numberPill(el, b, true);
    if (b.staged) stagedPill(el, b.size);
    return el;
  }
  // ultima slide: contatti dell'agenzia e dati chiave, sul colore dell'agenzia
  el.style.background = b.accent;
  const col = css(box(), { position: 'absolute', top: ins.t + 'px', bottom: ins.b + 'px', left: '96px', right: '96px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '40px', color: '#fff' });
  if (b.logo) {
    const card = css(box(), { alignSelf: 'flex-start', background: '#fff', borderRadius: '24px', padding: '24px 32px' });
    const lg = css(box('img') as HTMLImageElement, { display: 'block', height: '88px', maxWidth: '420px', objectFit: 'contain' }) as HTMLImageElement;
    lg.className = 'tpl-logo-overlay'; lg.src = b.logo; lg.alt = '';
    card.appendChild(lg); col.appendChild(card);
  }
  const h = css(box(), { fontSize: b.size.h > 1100 ? '112px' : '96px', fontWeight: '700', lineHeight: '1' }); h.className = 'tpl-title';
  h.textContent = b.brand.phone ? 'Chiamami' : 'Contattami';
  col.appendChild(h);
  if (b.brand.phone) { const p = css(box(), { fontSize: '68px', fontWeight: '600', lineHeight: '1.1' }); p.className = 'tpl-price'; p.textContent = b.brand.phone; col.appendChild(p); }
  for (const t of [b.brand.agencyName, b.brand.site].filter(Boolean)) { const a = css(box(), { fontSize: '36px', fontWeight: '500', lineHeight: '1.2', opacity: '.85', overflowWrap: 'anywhere' }); a.className = 'tpl-address'; a.textContent = t; col.appendChild(a); }
  if (b.lines.length) {
    const facts = css(box(), { display: 'flex', flexDirection: 'column', gap: '14px', background: 'rgba(255,255,255,.14)', borderRadius: '24px', padding: '32px 36px', fontSize: '36px', fontWeight: '500', lineHeight: '1.25' });
    facts.className = 'tpl-desc';
    for (const l of b.lines) { const r = box(); r.textContent = l; facts.appendChild(r); }
    col.appendChild(facts);
  }
  el.appendChild(col);
  numberPill(el, b, false);
  return el;
}

function PostView({ build, width }: { build: Slide | null; width: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const c = ref.current;
    if (!c || !build) return;
    let el: HTMLElement;
    try { el = buildSlide(build); } catch (e) { console.error('post render', build.kind, e); return; }
    (el.style as unknown as Record<string, string>).zoom = String(width / build.size.w);
    c.replaceChildren(el);
  }, [build, width]);
  const ok = !!build;
  const h = Math.round(width * (build?.size.h ?? 1350) / (build?.size.w ?? 1080));
  return (
    <div className="relative overflow-hidden rounded-[inherit]" style={{ width, height: h }}>
      {!ok && <div className="absolute inset-0 animate-pulse bg-black/[.06]" />}
      <div ref={ref} className={`pointer-events-none transition-opacity duration-[600ms] ${ok ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
}

// anteprima grande: il riquadro del post cambia misura con un'animazione (600ms) e la grafica nuova, disegnata una volta
// sola, appare in dissolvenza sopra la vecchia che sfuma (cambio di formato, grafica, social o slide)
function MorphPost({ build, boxW, boxH, fw, fh }: { build: Slide | null; boxW: number; boxH: number; fw: number; fh: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const fit = (w: number, h: number) => { const k = Math.min((boxW - 24) / w, (boxH - 24) / h); return { k, w: Math.round(w * k), h: Math.round(h * k) }; };
  const pulse = useRef<HTMLDivElement>(null);
  // prima comparsa: solo la dissolvenza in entrata; l'animazione della misura vale per i cambi successivi
  const [morph, setMorph] = useState(false);
  useEffect(() => {
    const holder = ref.current;
    if (!holder || !build) return;
    let el: HTMLElement;
    try { el = buildSlide(build); } catch (e) { console.error('post render', build.kind, e); return; }
    const f = fit(build.size.w, build.size.h);
    (el.style as unknown as Record<string, string>).zoom = String(f.k);
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const layer = document.createElement('div');
    layer.style.cssText = `position:absolute;left:50%;top:50%;width:${f.w}px;height:${f.h}px;transform:translate(-50%,-50%);pointer-events:none;opacity:${reduce ? 1 : 0};transition:opacity 600ms var(--gnm-ease, ease)`;
    layer.appendChild(el);
    const olds = Array.from(holder.children) as HTMLElement[];
    holder.appendChild(layer);
    if (pulse.current) { pulse.current.style.transition = 'opacity 600ms'; pulse.current.style.opacity = '0'; }
    if (!morph) setTimeout(() => setMorph(true), 650);
    if (reduce) olds.forEach(o => o.remove());
    else {
      requestAnimationFrame(() => requestAnimationFrame(() => { layer.style.opacity = '1'; olds.forEach(o => { o.style.opacity = '0'; }); }));
      setTimeout(() => olds.forEach(o => o.remove()), 700);
    }
  }, [build, boxW, boxH]); // eslint-disable-line react-hooks/exhaustive-deps
  const d = build ? fit(build.size.w, build.size.h) : fit(fw, fh);
  return (
    <div className={`relative overflow-hidden rounded-2xl shadow-md ring-1 ring-black/5 ease-smooth motion-reduce:transition-none ${morph ? 'transition-[width,height]' : ''}`} style={{ width: d.w, height: d.h }}>
      <div ref={pulse} className="absolute inset-0 animate-pulse bg-black/[.06]" />
      <div ref={ref} className="absolute inset-0" />
    </div>
  );
}

// icone dei social (lucide; WhatsApp e TikTok non ci sono: fumetto e nota musicale)
const NET_ICON = { instagram: Instagram, facebook: Facebook, whatsapp: MessageCircle, tiktok: Music2, linkedin: Linkedin } as const;
function NetIcon({ id, size = 20 }: { id: NetId; size?: number }) {
  const I = NET_ICON[id];
  return <I size={size} aria-hidden />;
}

// ---------- card nella fascia Promuovi ----------
export default function SocialCard({ project, photos }: { project: ProjectData; photos: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl bg-canvas p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand ring-1 ring-black/5"><Share2 size={18} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{tr('Condividi sui social', 'Share on social media')}</span>
          <span className="block text-xs text-muted">{tr('Post, storie e caroselli con foto, dati e il tuo logo', 'Posts, stories and carousels with photos, details and your logo')}</span>
        </span>
      </div>
      <button type="button" onClick={() => setOpen(true)} disabled={!photos.length} className="mt-3 flex h-10 w-full items-center justify-center gap-1.5 rounded-full bg-white text-sm font-semibold shadow-sm ring-1 ring-black/5 ease-smooth transition-colors hover:bg-ink hover:text-white disabled:opacity-60">
        <Sparkles size={14} /> {photos.length ? tr('Crea il post', 'Create the post') : tr('Aggiungi prima le foto', 'Add photos first')}
      </button>
      {open && <SocialShare project={project} photos={photos} onClose={() => setOpen(false)} />}
    </section>
  );
}


// ---------- finestra ----------
// piu' social insieme: per ognuno il suo formato; foto e grafica sono le stesse, adattate a ogni formato; il testo e' per social
const CHOICE_KEY = 'agenteimmo:social-choice';
type Saved = { nets: NetId[]; fmts: Partial<Record<NetId, string>>; step: number; tpl: string };
const netOf = (id: NetId) => NETS.find(n => n.id === id)!;
function savedChoice(): Saved {
  try {
    const c = JSON.parse(localStorage.getItem(CHOICE_KEY) ?? 'null') as (Partial<Saved> & { net?: NetId; fmt?: string }) | null;
    const nets = (c?.nets ?? (c?.net ? [c.net] : [])).filter(id => NETS.some(n => n.id === id));
    if (nets.length) {
      const fmts: Partial<Record<NetId, string>> = { ...(c?.fmts ?? {}), ...(c?.net && c.fmt ? { [c.net]: c.fmt } : {}) };
      for (const n of NETS) if (fmts[n.id] && !n.fmts.some(f => f.id === fmts[n.id])) delete fmts[n.id];
      return { nets, fmts, step: Math.max(0, Math.min(4, Number(c?.step) || 0)), tpl: typeof c?.tpl === 'string' && POST_TEMPLATES.some(t => t.id === c.tpl) ? c.tpl : 'gradient' };
    }
  } catch { /* niente storage */ }
  return { nets: ['instagram'], fmts: {}, step: 0, tpl: 'gradient' };
}
const store = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* niente storage */ } };
const STEPS: [string, string][] = [['Social', 'Network'], ['Foto', 'Photos'], ['Grafica', 'Design'], ['Testo', 'Text'], ['Video', 'Video']]; // il video e' facoltativo
const slug = (s: string) => s.toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '');

// larghezza di un elemento (la griglia delle grafiche)
function useWidth<T extends HTMLElement>() {
  const [w, setW] = useState(0);
  const ro = useRef<ResizeObserver | null>(null);
  const ref = useCallback((el: T | null) => {
    ro.current?.disconnect(); ro.current = null;
    if (!el) return;
    ro.current = new ResizeObserver(() => setW(el.clientWidth));
    ro.current.observe(el); setW(el.clientWidth);
  }, []);
  return [ref, w] as const;
}

// riquadro del formato (la forma del 4:5, 9:16, 1:1) accanto al nome
function RatioGlyph({ w, h, on }: { w: number; h: number; on: boolean }) {
  const k = 16 / Math.max(w, h);
  return (
    <span className="flex h-5 w-5 shrink-0 items-center justify-center">
      <span className={`block rounded-[3px] border-2 ease-smooth transition-colors ${on ? 'border-brand' : 'border-ink/35'}`} style={{ width: Math.round(w * k), height: Math.round(h * k) }} />
    </span>
  );
}

function SocialShare({ project, photos: srcs, onClose }: { project: ProjectData; photos: string[]; onClose: () => void }) {
  const d = (project.import_data ?? {}) as { details?: Record<string, unknown>; prima?: Record<string, string>; rooms?: Record<string, { scene?: string }> };
  const det = d.details ?? {};
  const prima = d.prima ?? {};
  // Venduto o affittato: dalla scheda (details.stato_annuncio) o dall'interruttore del popup (per immobile, sul dispositivo).
  // Acceso: grafiche e video Venduto/Affittato, testo che racconta il lavoro fatto. Giorni: facoltativi, proposti dalla data del cambio di stato
  const status0 = statusOf({ details: det });
  const soldKey = `agenteimmo:social-sold:${project.id}`;
  const [soldSaved] = useState(() => { try { return JSON.parse(localStorage.getItem(soldKey) ?? 'null') as { on?: boolean; kind?: string; days?: string } | null; } catch { return null; } });
  const [soldOn, setSoldOn] = useState(() => (typeof soldSaved?.on === 'boolean' ? soldSaved.on : isClosed(status0)));
  const [soldKind, setSoldKind] = useState<'venduto' | 'affittato'>(() => (soldSaved?.kind === 'affittato' || soldSaved?.kind === 'venduto' ? soldSaved.kind
    : status0 === 'affittato' || (status0 !== 'venduto' && (det.contratto === 'Affitto' || /affitt/i.test(`${project.titolo ?? ''} ${project.tipologia ?? ''}`))) ? 'affittato' : 'venduto'));
  const [soldDays, setSoldDays] = useState(() => {
    if (typeof soldSaved?.days === 'string') return soldSaved.days;
    const a = Date.parse(String(det.stato_annuncio_data ?? '')), b = Date.parse(project.createdAt ?? '');
    const n = isClosed(status0) && a && b ? Math.round((a - b) / 86_400_000) : 0;
    return n >= 1 && n <= 730 ? String(n) : '';
  });
  useEffect(() => { store(soldKey, { on: soldOn, kind: soldKind, days: soldDays }); }, [soldOn, soldKind, soldDays, soldKey]);
  const [brand, setBrand] = useState<Brand | null>(null);
  const [logo, setLogo] = useState<{ url: string | null; h: boolean } | null>(null);
  const [fonts, setFonts] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [scanned, setScanned] = useState(0); // foto gia' guardate, nell'ordine (anche quelle che non si aprono)
  const [first] = useState(savedChoice);
  const selKey = `agenteimmo:social-photos:${project.id}`;
  const [sel, setSel] = useState<string[]>(() => { // foto scelte (src), nell'ordine; la prima e' la copertina
    try { const s = JSON.parse(localStorage.getItem(selKey) ?? '[]') as unknown; return Array.isArray(s) ? s.filter(x => typeof x === 'string' && srcs.includes(x)) : []; } catch { return []; }
  });
  // inquadratura di ogni foto, per immobile (resta sul dispositivo)
  const frKey = `agenteimmo:social-frames:${project.id}`;
  const [frames, setFrames] = useState<Record<string, Frame>>(() => { try { const f = JSON.parse(localStorage.getItem(frKey) ?? '{}') as unknown; return f && typeof f === 'object' ? f as Record<string, Frame> : {}; } catch { return {}; } });
  useEffect(() => { store(frKey, frames); }, [frames, frKey]);
  const frameFor = (src: string): Frame => frames[src] ?? FRAME0;
  const [nets, setNets] = useState<NetId[]>(first.nets);
  const [fmtIds, setFmtIds] = useState(first.fmts);
  const [active, setActive] = useState<NetId>(first.nets[0]);
  // si parte sempre dal passo 1, con le scelte dell'ultima volta gia' impostate
  const [stepIx, setStepIx] = useState(0);
  const [reached, setReached] = useState(() => (sel.length ? first.step : 0));
  const fmtOf = (n: NetId) => { const N = netOf(n); return N.fmts.find(f => f.id === fmtIds[n]) ?? N.fmts[0]; };
  const net = netOf(active);
  const fmt = fmtOf(active);
  
  useEffect(() => { store(selKey, sel); }, [sel, selKey]);
  const toggleNet = (id: NetId) => {
    if (nets.includes(id)) {
      if (nets.length === 1) return; // almeno un social
      const rest = nets.filter(x => x !== id);
      setNets(rest);
      if (active === id) { setActive(rest[0]); setSlideIx(0); }
    } else { setNets(NETS.map(n => n.id).filter(x => x === id || nets.includes(x))); setActive(id); setSlideIx(0); }
  };
  const pickFmt = (n: NetId, f: string) => { setFmtIds(o => ({ ...o, [n]: f })); setActive(n); setSlideIx(0); };
  const show = (n: NetId) => { setActive(n); setSlideIx(0); setView('post'); };
  const goStep = (i: number) => { setStepIx(i); setView(i === 4 ? 'video' : 'post'); setReached(r => Math.max(r, i)); bodyRef.current?.scrollTo({ top: 0 }); stepRef.current?.scrollTo({ top: 0 }); };
  const [tpl, setTpl] = useState(() => (soldOn && !first.tpl.startsWith('sold-') ? 'sold-stamp' : first.tpl));
  // interruttore Venduto: le grafiche Venduto davanti (e la prima scelta), il video Venduto; spento, si torna all'annuncio
  const setSold = (on: boolean) => {
    setSoldOn(on);
    setTpl(t => (on ? (t.startsWith('sold-') ? t : 'sold-stamp') : t.startsWith('sold-') ? 'gradient' : t));
    setTone('all');
    setVid(v => (v.status === 'idle' || v.status === 'error' ? { ...v, tpl: on ? 'venduto' : 'reel', status: 'idle' } : v));
  };
  useEffect(() => { store(CHOICE_KEY, { nets, fmts: fmtIds, step: reached, tpl }); }, [nets, fmtIds, reached, tpl]);
  const [tone, setTone] = useState<Tone>('all');
  const [blurs, setBlurs] = useState<Record<string, string>>({});
  const [label, setLabel] = useState(true); // scritta "arredata virtualmente" sulle foto AI
  const [busy, setBusy] = useState<'all' | 'share' | null>(null);
  const [note, setNote] = useState('');
  // testi per social e per tipo di post (annuncio, venduto, affittato): chiave tk(n)
  const [texts, setTexts] = useState<Record<string, string>>({});
  const [textBusy, setTextBusy] = useState<Record<string, boolean>>({});
  const [textErr, setTextErr] = useState<Record<string, string | undefined>>({});
  const [copied, setCopied] = useState<NetId | null>(null);
  const [done, setDone] = useState<NetId[]>([]); // social gia' condivisi (spunta sulla scheda)
  const [slideIx, setSlideIx] = useState(0);
  const [view, setView] = useState<'post' | 'video'>('post'); // anteprima: il post del social o il video
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight })); // subito la misura vera: niente salto all'apertura
  const bodyRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  const [gridRef, gridW] = useWidth<HTMLDivElement>();

  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    on(); window.addEventListener('resize', on);
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    const o = document.body.style.overflow; document.body.style.overflow = 'hidden';
    return () => { window.removeEventListener('resize', on); window.removeEventListener('keydown', k); document.body.style.overflow = o; };
  }, [onClose]);
  useEffect(() => { void loadFonts().then(() => setFonts(true)); }, []);
  // marchio dell'agenzia: logo (in data URL, l'esportazione non si sporca), colore, nome, telefono, sito
  useEffect(() => {
    authFetch('/api/platform/site').then(r => (r.ok ? r.json() : null)).then(async (s: { logo: string | null; name?: string; slug?: string | null; published?: boolean; config: { logo?: string; primary?: string; agencyName?: string; phone?: string } } | null) => {
      const b: Brand = { logo: s?.config?.logo || s?.logo || null, primary: s?.config?.primary || '#1d1d1f', agencyName: cleanText(s?.config?.agencyName || s?.name || ''), phone: s?.config?.phone || '', site: s?.slug && s.published ? portfolioUrl(s.slug).replace(/^https?:\/\//, '') : '' };
      setBrand(b);
      const url = await toDataUrl(b.logo);
      const h = url ? await new Promise<boolean>(ok => { const i = new Image(); i.onload = () => ok(i.naturalWidth / Math.max(1, i.naturalHeight) > 1.4); i.onerror = () => ok(true); i.src = url; }) : true;
      setLogo({ url, h });
    }).catch(() => { setBrand({ logo: null, primary: '#1d1d1f', agencyName: '', phone: '', site: '' }); setLogo({ url: null, h: true }); });
  }, []);
  // foto dell'immobile in locale, in ordine (la copertina prima); le foto AI con l'originale accanto (Prima e Dopo)
  useEffect(() => {
    let live = true;
    void (async () => {
      const out: Photo[] = [];
      for (const [i, src] of srcs.slice(0, 24).entries()) {
        const l = await localPhoto(src);
        const orig = l && prima[src] ? await localPhoto(prima[src]) : null;
        if (l) out.push({ src, full: l.full, small: l.small, staged: !!prima[src], original: orig?.full, w: l.w, h: l.h, plan: l.plan || d.rooms?.[src]?.scene === 'planimetria' });
        if (!live) return;
        if (l) setPhotos([...out]);
        setScanned(i + 1);
      }
    })();
    return () => { live = false; };
  }, [srcs.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  // foto per formato: una per i formati singoli (la prima scelta, o la copertina); il carosello parte dalle prime 5
  const chosen = sel.map(s => photos.find(p => p.src === s)).filter((p): p is Photo => !!p);
  const photosFor = (f: Fmt): Photo[] => (f.multi ? chosen.slice(0, MAX_PHOTOS) : chosen.length ? chosen.slice(0, 1) : photos.slice(0, 1));
  const anyMulti = nets.some(n => fmtOf(n).multi);
  const slidesPhotos = photosFor(fmt);
  const photo = slidesPhotos[0] as Photo | undefined;
  const gridSel = anyMulti ? chosen.slice(0, MAX_PHOTOS) : photosFor(fmt); // numeri e spunte nella griglia delle foto
  // le foto che servono all'anteprima sono arrivate (le scelte, e almeno 3 per le grafiche con piu' foto): prima uno scheletro,
  // poi UN solo disegno (niente post che cambia a ogni foto che arriva)
  const upto = Math.min(srcs.length, 24);
  const seen = (src: string) => { const i = srcs.indexOf(src); return i < 0 || i >= upto || i < scanned; };
  const photosSettled = scanned >= upto || (scanned >= Math.min(anyMulti ? 5 : 3, upto) && (anyMulti ? sel : sel.slice(0, 1)).every(seen));
  useEffect(() => {
    if (!photosSettled) return;
    if (anyMulti && sel.length <= 1 && photos.length > 1) setSel(s => [...new Set([...s, ...photos.map(p => p.src)])].slice(0, Math.min(5, MAX_PHOTOS)));
  }, [anyMulti, photos.length, photosSettled]); // eslint-disable-line react-hooks/exhaustive-deps
  // solo formati singoli: la foto toccata diventa la prima (la scelta del carosello resta, in ordine)
  const tap = (src: string) => {
    if (!anyMulti) { setSel(s => [src, ...s.filter(x => x !== src)]); return; }
    setSel(s => (s.includes(src) ? s.filter(x => x !== src) : s.length >= MAX_PHOTOS ? s : [...s, src]));
  };
  const move = (i: number, by: number) => setSel(s => { const a = s.filter(x => photos.some(p => p.src === x)).slice(0, MAX_PHOTOS); const j = i + by; if (j < 0 || j >= a.length) return s; [a[i], a[j]] = [a[j], a[i]]; return a; });
  const needBlur = [...new Set(nets.flatMap(n => photosFor(fmtOf(n))))];
  useEffect(() => {
    for (const p of [photo?.small, ...needBlur.map(x => x.full)]) if (p && !blurs[p]) void blurred(p).then(b => setBlurs(o => ({ ...o, [p]: b })));
  }, [photo, needBlur.map(p => p.src).join('|'), blurs]); // eslint-disable-line react-hooks/exhaustive-deps

  // dati della grafica dall'immobile (testi puliti: niente &nbsp;, entita' e trattini lunghi)
  const titolo = cleanText(project.titolo), descr = cleanText(project.descrizione), indirizzo = cleanText(project.addr);
  const tipologia = cleanText(project.tipologia);
  const rent = det.contratto === 'Affitto' || /affitt/i.test(`${titolo} ${tipologia}`);
  // stato per grafiche e testi: l'interruttore vince sulla scheda (spento su un immobile chiuso = si parla della casa e basta)
  const status = soldOn ? soldKind : isClosed(status0) ? 'disponibile' : status0;
  const hidePrice = soldOn && !det.mostra_prezzo_venduto;
  const soldRent = soldKind === 'affittato';
  const nDays = Number(soldDays) || 0;
  // zona del Venduto: dall'indirizzo; se manca, dal titolo quando inizia con un nome di luogo ("Castelfranco di Sotto, Casa...")
  const head = titolo.split(/,|\s\|\s/)[0].trim();
  const soldPlace = zoneOnly(indirizzo) || (titolo.includes(',') && head.length <= 32 && head.split(/\s+/).every(w => /^[A-ZÀ-Ý]/.test(w) || /^(di|del|della|dei|delle|in|al|sul|a|e|d'\S+)$/i.test(w)) ? head : '');
  const soldDaysText = nDays ? (nDays === 1 ? tr('in 1 giorno', 'in 1 day') : tr(`in ${nDays} giorni`, `in ${nDays} days`)) : '';
  const addr = det.mostra_indirizzo ? indirizzo : zoneOnly(indirizzo);
  const it = pageLang() === 'it';
  const price = project.prezzo && !hidePrice ? `€ ${project.prezzo.toLocaleString('it-IT')}${rent ? (it ? ' al mese' : ' / month') : ''}` : '';
  const contract = status !== 'disponibile' ? tr(...STATUS_LABELS[status]) : rent ? tr('In affitto', 'For rent') : tr('In vendita', 'For sale');
  const accent = brand?.primary || '#1d1d1f';
  const data: Record<string, unknown> = {
    title: titolo || tipologia || cleanText(project.nome), type: tipologia, price, address: addr,
    surface: project.mq ? `${project.mq} m²` : '', surfaceNum: project.mq ? String(project.mq) : '',
    bedrooms: String(project.camere || project.locali || ''), rooms: String(project.locali || ''), bathrooms: String(project.bagni || ''),
    description: descr.replace(/\s+/g, ' ').slice(0, 260), contract,
    ctaText: brand?.phone ? `${tr('Chiama', 'Call')} ${brand.phone}` : tr('Contattaci ora', 'Contact us'),
    energyClass: cleanText(String(det.classe_energetica ?? '')), accentColor: accent,
    _icons: { bedrooms: project.camere ? 'bed' : 'rooms', bathrooms: 'bath', surface: 'area' },
    // grafiche Venduto / Affittato (renderers/sold.js)
    soldLabel: soldRent ? tr('Affittato', 'Rented') : tr('Venduto', 'Sold'), soldDays: soldDaysText, soldPlace,
    soldCta: soldRent ? tr('Hai una casa da affittare?', 'Have a home to rent out?') : tr('Hai una casa da vendere?', 'Have a home to sell?'),
    soldPhone: brand?.phone ? `${tr('Chiamami', 'Call me')} ${brand.phone}` : '', agencyName: brand?.agencyName ?? '',
  };
  // grafiche per formato. tips: consigli, non un annuncio; frame: nell'esportazione la foto sparisce (doppia passata del vetro)
  const othersFor = (f: Fmt) => (f.multi ? photosFor(f).slice(1) : photos.filter(p => p !== photosFor(f)[0]));
  const fits = (id: string, f: Fmt) => id !== 'tips' && id !== 'frame' && !(NO_FIT[f.ratio] ?? []).includes(id) && (soldOn || !id.startsWith('sold-'))
    && (id !== 'gallery' || othersFor(f).length >= 2) && (id !== 'before-after' || !!photosFor(f)[0]?.original);
  // acceso Venduto: prima le sue grafiche, poi quelle dell'annuncio
  const tplsFor = (f: Fmt) => POST_TEMPLATES.filter(t => fits(t.id, f)).sort((a, b) => Number(b.id.startsWith('sold-')) - Number(a.id.startsWith('sold-')));
  // la grafica scelta, o la piu' simile se in quel formato non regge
  const tplFor = (n: NetId) => {
    const f = fmtOf(n);
    if (fits(tpl, f)) return tpl;
    return (SIMILAR.find(g => g.includes(tpl)) ?? []).find(id => fits(id, f)) ?? tplsFor(f)[0]?.id ?? 'gradient';
  };
  const tplLabel = (id: string) => POST_TEMPLATES.find(t => t.id === id)?.label ?? id;
  const swaps = nets.filter(n => tplFor(n) !== tpl).map(n => ({ n, f: fmtOf(n), to: tplFor(n) }));
  const all = tplsFor(fmt);
  const list = all.filter(t => tone === 'all' || TONE[t.id] === tone);
  const cur = tplFor(active);
  const ready = fonts && !!logo && !!brand && photosSettled && !(anyMulti && sel.length <= 1 && photos.length > 1); // carosello: prima la scelta automatica delle foto
  // copertina: la grafica (Prima e Dopo: la prima foto e' l'originale, la seconda quella arredata)
  const cover = (id: string, small: boolean, f: Fmt): Tpl | null => {
    const ph = photosFor(f)[0];
    if (!ready || !ph) return null;
    const blur = blurs[small ? ph.small : ph.full];
    if (!blur) return null;
    const main = id === 'before-after' && ph.original ? ph.original : small ? ph.small : ph.full;
    const extra = id === 'before-after' ? [small ? ph.small : ph.full] : id === 'gallery' ? othersFor(f).slice(0, 2).map(p => (small ? p.small : p.full)) : undefined;
    const fr = NO_COVER.includes(id) ? null : frameFor(ph.src);
    return { kind: 'tpl', tpl: id, data, photo: main, size: { w: f.w, h: f.h, safe: f.safe }, blur, logo: logo!.url, logoH: logo!.h, staged: ph.staged && label, photos: extra, fit: autoFit(id, f.h, fr ?? undefined), frame: fr };
  };
  // carosello: copertina, poi le altre foto pulite, in fondo i contatti
  const facts = [price, [project.mq ? `${project.mq} m²` : '', project.locali ? `${project.locali} ${tr('locali', 'rooms')}` : '', project.bagni ? `${project.bagni} ${project.bagni === 1 ? tr('bagno', 'bathroom') : tr('bagni', 'bathrooms')}` : ''].filter(Boolean).join(', '), addr].filter(Boolean);
  const slidesFor = (n: NetId): (Slide | null)[] => {
    const f = fmtOf(n), size: Size = { w: f.w, h: f.h, safe: f.safe }, ps = photosFor(f);
    const firstSlide = cover(tplFor(n), false, f);
    if (!f.multi) return [firstSlide];
    if (!ps.length) return [];
    const total = ps.length + 1;
    const rest: (Slide | null)[] = ps.slice(1).map((p, i) => (blurs[p.full] && ready ? { kind: 'plain', photo: p.full, size, blur: blurs[p.full], logo: logo!.url, accent, badge: contract, staged: p.staged && label, n: i + 2, total, fit: autoFit(null, f.h, frameFor(p.src)), frame: frameFor(p.src) } : null));
    const last: Slide | null = ready ? { kind: 'contact', size, logo: logo!.url, accent, brand: brand!, lines: facts, n: total, total } : null;
    return [firstSlide, ...rest, last];
  };
  const keyFor = (n: NetId) => { const f = fmtOf(n), ps = photosFor(f); return JSON.stringify([n, f.id, tplFor(n), ps.map(p => p.src), label, ready, accent, ps.map(p => !!blurs[p.full]), ps.map(p => frames[p.src] ?? null), status, soldDaysText, brand?.phone]); };
  const key = keyFor(active);
  const keySmall = JSON.stringify([fmt.w, fmt.h, photo?.small, label, ready, accent, !!blurs[photo?.small ?? ''], othersFor(fmt).length, all.length, frames[photo?.src ?? ''] ?? null, status, soldDaysText, brand?.phone]);
  const [big, setBig] = useState<(Slide | null)[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, Tpl | null>>({});
  // oggetti stabili: si ridisegna solo quando cambia davvero qualcosa
  useEffect(() => { setBig(slidesFor(active)); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setThumbs(Object.fromEntries(all.map(t => [t.id, cover(t.id, true, fmt)]))); }, [keySmall]); // eslint-disable-line react-hooks/exhaustive-deps
  const nSlides = fmt.multi ? slidesPhotos.length + (slidesPhotos.length ? 1 : 0) : 1;
  const six = Math.min(slideIx, Math.max(0, nSlides - 1));

  // testo del post, diverso per ogni social: uno per immobile e social (resta sul dispositivo), nei limiti del social
  // venduto e affittato hanno il loro testo (il lavoro fatto e l'invito a chi vende), l'annuncio resta com'era
  const tk = (n: NetId) => (soldOn ? `${n}:${soldKind}` : n);
  const tKey = (k: string) => `agenteimmo:social-text:${project.id}:${k}`;
  const putTextK = (k: string, t: string) => { setTexts(o => ({ ...o, [k]: t })); try { localStorage.setItem(tKey(k), t); } catch { /* niente storage */ } };
  const putText = (n: NetId, t: string) => putTextK(tk(n), t);
  const writeText = async (n: NetId, fresh = false) => {
    const k = tk(n);
    if (!fresh) { const s = localStorage.getItem(tKey(k)); if (s) { setTexts(o => ({ ...o, [k]: s })); return; } }
    setTextBusy(o => ({ ...o, [k]: true })); setTextErr(o => ({ ...o, [k]: undefined }));
    const fields = {
      titolo, tipologia, zona: zoneOnly(indirizzo), contratto: rent ? 'Affitto' : 'Vendita',
      prezzo: hidePrice ? undefined : project.prezzo || undefined, mq: project.mq || undefined, locali: project.locali || undefined, camere: project.camere || undefined, bagni: project.bagni || undefined,
      piano: det.piano ? cleanText(String(det.piano)) : undefined, classe_energetica: det.classe_energetica ? cleanText(String(det.classe_energetica)) : undefined, stato: status !== 'disponibile' ? STATUS_LABELS[status][0] : undefined,
      descrizione: descr.slice(0, 2500), telefono: brand?.phone || undefined, agenzia: brand?.agencyName || undefined,
      arredata: srcs.some(s => !!prima[s]),
      ...(soldOn ? { giorni: nDays || undefined } : {}),
    };
    const r = await authFetch('/api/platform/social-caption', { method: 'POST', body: JSON.stringify({ fields, social: n, video: n === 'tiktok' && withVideo }) }).catch(() => null);
    const j = r?.ok ? await r.json().catch(() => null) : null;
    setTextBusy(o => ({ ...o, [k]: false }));
    if (j?.testo) putTextK(k, j.testo);
    else setTextErr(o => ({ ...o, [k]: r?.status === 429 ? tr('Hai scritto molti testi oggi, riprova domani.', 'You wrote many texts today, try again tomorrow.') : tr('Non sono riuscito a scrivere il testo.', 'I could not write the text.') }));
  };
  // si scrivono quando servono: dalla grafica in poi (cosi' al passo Testo sono pronti), una volta per social
  useEffect(() => {
    if (!brand || stepIx < 2) return;
    for (const n of nets) if (texts[tk(n)] === undefined && !textBusy[tk(n)] && !textErr[tk(n)]) void writeText(n);
  }, [brand, nets.join(','), stepIx >= 2, soldOn, soldKind]); // eslint-disable-line react-hooks/exhaustive-deps
  const text = texts[tk(active)] ?? '';
  const copy = async (n: NetId) => { try { await navigator.clipboard.writeText(texts[tk(n)] ?? ''); setCopied(n); setTimeout(() => setCopied(c => (c === n ? null : c)), 2400); } catch { /* niente appunti */ } };

  // ---- video dell'annuncio (api/platform/video-reel, come nella chat): stesse foto (max 8) e dati, 9:16 ----
  // Vivace ed Elegante su AWS Lambda (si segue il lavoro), Semplice e Classico con FFmpeg in una richiesta. Crediti a video pronto.
  type Vid = { tpl: ReelTpl; style: ReelStyle; status: 'idle' | 'working' | 'queued' | 'done' | 'error'; url?: string; job?: string; progress?: number; at?: number; err?: string };
  const vKey = `agenteimmo:social-video:${project.id}`;
  const [vid, setVid] = useState<Vid>(() => {
    try { const v = JSON.parse(localStorage.getItem(vKey) ?? 'null') as Vid | null; if (v?.url || v?.job) return { ...v, tpl: v.tpl === 'venduto' ? 'venduto' : 'reel', status: v.url ? 'done' : 'working', at: v.at ?? Date.now() }; } catch { /* niente storage */ }
    return { tpl: soldOn ? 'venduto' : 'reel', style: 'vivace', status: 'idle' };
  });
  const withVideo = vid.status !== 'idle' && vid.status !== 'error';
  const vWorking = vid.status === 'working' || vid.status === 'queued';
  useEffect(() => { store(vKey, vid.url || vid.job ? { tpl: vid.tpl, style: vid.style, url: vid.url, job: vid.job, at: vid.at } : null); }, [vid.url, vid.job, vid.style, vid.tpl]); // eslint-disable-line react-hooks/exhaustive-deps
  const live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);
  const [, setTick] = useState(0);
  useEffect(() => { if (!vWorking) return; const t = setInterval(() => setTick(x => x + 1), 1000); return () => clearInterval(t); }, [vWorking]);
  const city = indirizzo.split(',').map(x => x.replace(/\d{5}/g, '').trim()).filter(Boolean).pop() ?? '';
  // foto del video annuncio (da 3 a 8, per immobile): si parte da quelle scelte al passo Foto e si aggiungono le migliori
  // altre dell'immobile fino a 5 (prima la copertina, poi le arredate, poi le altre; mai le planimetrie). Il Venduto ne usa una.
  const vSelKey = `agenteimmo:social-vphotos:${project.id}`;
  const [vSel, setVSel] = useState<string[] | null>(() => { try { const v = JSON.parse(localStorage.getItem(vSelKey) ?? 'null') as unknown; return Array.isArray(v) ? v.filter(x => typeof x === 'string' && srcs.includes(x)) : null; } catch { return null; } });
  const [vOne, setVOne] = useState<string | null>(null); // foto del Venduto (se manca, la prima scelta)
  useEffect(() => { if (vSel) store(vSelKey, vSel); }, [vSel, vSelKey]);
  const vCandidates = photos.filter(p => !p.plan).sort((a, b) => (a === photos[0] ? 0 : a.staged ? 1 : 2) - (b === photos[0] ? 0 : b.staged ? 1 : 2));
  const vSuggest = () => { const base = chosen.filter(p => !p.plan).slice(0, MAX_REEL_PHOTOS); return [...base, ...vCandidates.filter(p => !base.includes(p))].slice(0, Math.max(base.length, 5)).map(p => p.src); };
  useEffect(() => { if (stepIx === 4 && photosSettled && !vSel?.length) setVSel(vSuggest()); }, [stepIx, photosSettled]); // eslint-disable-line react-hooks/exhaustive-deps
  const vList = (vSel ?? []).map(s => photos.find(p => p.src === s)).filter((p): p is Photo => !!p).slice(0, MAX_REEL_PHOTOS);
  const vSoldPhoto = photos.find(p => p.src === vOne) ?? chosen.find(p => !p.plan) ?? vCandidates[0];
  const vTpl: ReelTpl = vid.status === 'idle' || vid.status === 'error' ? (soldOn && vid.tpl === 'venduto' ? 'venduto' : 'reel') : vid.tpl;
  const vPhotos = vTpl === 'venduto' ? (vSoldPhoto ? [vSoldPhoto] : []) : vList;
  const vMin = vTpl === 'venduto' ? 1 : 3;
  const vCost = vTpl === 'venduto' ? CREDIT_COST.video_venduto : CREDIT_COST.video_reel;
  const vAdd = (src: string) => setVSel(v => (v ?? []).includes(src) || (v ?? []).length >= MAX_REEL_PHOTOS ? v : [...(v ?? []), src]);
  const vDel = (src: string) => setVSel(v => (v ?? []).filter(x => x !== src));
  const vMove = (i: number, by: number) => setVSel(v => { const a = [...(v ?? [])]; const j = i + by; if (j < 0 || j >= a.length) return v; [a[i], a[j]] = [a[j], a[i]]; return a; });
  type VReply = { url?: string; error?: string; status?: string; job?: string; progress?: number };
  const wait = (ms: number) => new Promise(r => setTimeout(r, ms));
  const vDone = (d: VReply) => {
    if (!live.current) return;
    if (!d.url) {
      setVid(v => ({ ...v, status: 'error', job: undefined, err: d.error === 'no_credits' ? tr(`Per il video servono ${vCost} crediti. Ricarica per continuare.`, `The video needs ${vCost} credits. Top up to continue.`) : d.error === 'photo_unreadable' ? tr('Una delle foto non si apre, cambia le foto e riprova.', 'One of the photos won\'t open, change the photos and try again.') : tr('Video non riuscito, nessun credito scalato. Riprova.', 'Video failed, no credits used. Please try again.') }));
      return;
    }
    setVid(v => ({ ...v, status: 'done', url: d.url, job: undefined, progress: undefined }));
    window.dispatchEvent(new Event('agenteimmo:media')); window.dispatchEvent(new Event('agenteimmo:credits'));
  };
  const pollVideo = async (job: string) => {
    for (let k = 0; k < 100; k++) {
      await wait(3000);
      if (!live.current) return 'stop' as const;
      const res = await authFetch(`/api/platform/video-reel?job=${encodeURIComponent(job)}`).catch(() => null);
      if (!res) continue;
      const d = await res.json().catch(() => ({})) as VReply;
      if (d.status === 'working') { if (typeof d.progress === 'number') setVid(v => ({ ...v, progress: d.progress })); continue; }
      if (d.status === 'queued') { setVid(v => ({ ...v, status: 'queued', job: undefined })); await wait(15_000); return 'queued' as const; }
      vDone(d); return 'end' as const;
    }
    vDone({}); return 'end' as const;
  };
  const makeVideo = async () => {
    if (vWorking || vPhotos.length < vMin) return;
    setVid(v => ({ tpl: vTpl, style: v.style, status: 'working', at: Date.now() })); setView('video');
    const body = JSON.stringify(vTpl === 'venduto' ? {
      template: 'venduto', style: vid.style, enhance: true, contract: soldRent ? 'affitto' : 'vendita', place: soldPlace.slice(0, 60), days: nDays ? String(nDays) : '',
      photos: vPhotos.map(p => ({ src: p.src, staged: p.staged })), projectId: project.id,
    } : {
      template: 'reel', style: vid.style, enhance: true, contract: rent ? 'affitto' : 'vendita',
      title: (titolo || tipologia || cleanText(project.nome)).split(' | ')[0].slice(0, 80), place: city.slice(0, 60),
      price: !hidePrice && project.prezzo ? String(project.prezzo) : '', mq: project.mq ? String(project.mq) : '', rooms: project.locali ? String(project.locali) : '',
      photos: vPhotos.map(p => ({ src: p.src, staged: p.staged })), projectId: project.id,
    });
    // coda: se il server dei video e' pieno si riprova ogni 15 s, fino a 10 minuti
    for (let k = 0; k < 40 && live.current; k++) {
      const res = await authFetch('/api/platform/video-reel', { method: 'POST', headers: { 'x-no-modal': '1' }, body }).catch(() => null);
      const d = res ? await res.json().catch(() => ({})) as VReply : {};
      if (d.status === 'queued') { setVid(v => ({ ...v, status: 'queued' })); await wait(15_000); continue; }
      if (d.status === 'working' && d.job) { setVid(v => ({ ...v, status: 'working', job: d.job })); if (await pollVideo(d.job) === 'queued') continue; return; }
      vDone(d); return;
    }
    vDone({});
  };
  // popup riaperto con un video che stava lavorando: si riprende a seguirlo
  useEffect(() => { if (vid.job && vid.status === 'working') void pollVideo(vid.job); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const vFile = async () => {
    const r = await fetch(vid.url!, { mode: 'cors', cache: 'no-store' });
    if (!r.ok) throw new Error('video');
    return new File([await r.blob()], `${title}-video-${vid.style}.mp4`, { type: 'video/mp4' });
  };
  const lambdaStyle = vid.style === 'vivace' || vid.style === 'elegante';
  const vSec = lambdaStyle ? 50 + 6 * vPhotos.length : 8 + 3 * vPhotos.length;
  const vSample = `/staging/reel-styles/${vTpl === 'venduto' ? (soldRent ? 'affittato' : 'venduto') : 'annuncio'}-${vid.style}`; // clip d'esempio dello stile
  const vEta = vSec < 55 ? tr(`di solito circa ${Math.round(vSec / 10) * 10} secondi`, `usually about ${Math.round(vSec / 10) * 10} seconds`) : vSec < 80 ? tr('di solito circa un minuto', 'usually about a minute') : tr('di solito 1-2 minuti', 'usually 1-2 minutes');
  const vElapsed = vid.at ? Math.max(0, Math.round((Date.now() - vid.at) / 1000)) : 0;

  // esportazione: ogni slide a grandezza vera, fuori dalla vista, poi PNG (o video)
  const mount = async <T,>(b: Slide, fn: (el: HTMLElement) => Promise<T>) => {
    const el = buildSlide(b);
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:fixed;top:0;left:0;width:${b.size.w}px;height:${b.size.h}px;opacity:0;pointer-events:none;z-index:-1;`;
    wrap.appendChild(el); document.body.appendChild(wrap);
    try {
      await document.fonts.ready;
      await Promise.all(Array.from(el.querySelectorAll('img')).map(i => (i.complete ? null : new Promise(ok => { i.onload = i.onerror = ok; }))));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      return await fn(el);
    } finally { wrap.remove(); }
  };
  const photoOf = (b: Slide) => (b.kind === 'contact' ? undefined : b.photo);
  const png = (b: Slide) => mount(b, el => exportToPng(el, b.size, { photoSrc: photoOf(b), fitCover: fitOf(b), frame: frameOf(b) } as never) as Promise<Blob>);
  const title = slug(titolo || project.nome || 'immobile').slice(0, 40).replace(/-$/, '');
  const nameOf = (n: NetId) => `${n}-${slug(fmtOf(n).label)}`; // instagram-post, whatsapp-stato, linkedin-carosello
  const save = (blob: Blob, file: string) => { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = file; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); };
  // LinkedIn: il carosello e' un documento PDF, una slide per pagina (JPEG, file leggero)
  const toPdf = async (files: File[], f: Fmt, name: string) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ orientation: 'portrait', unit: 'px', format: [f.w, f.h], hotfixes: ['px_scaling'], compress: true });
    for (const [i, file] of files.entries()) {
      const bm = await createImageBitmap(file);
      const c = document.createElement('canvas'); c.width = bm.width; c.height = bm.height;
      c.getContext('2d')!.drawImage(bm, 0, 0);
      if (i) doc.addPage([f.w, f.h], 'portrait');
      doc.addImage(c.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, f.w, f.h);
    }
    return new File([doc.output('blob')], `${name}.pdf`, { type: 'application/pdf' });
  };
  // i file di un social (una immagine, le slide del carosello o il PDF), preparati una volta sola: Condividi parte subito
  const filesRef = useRef<Record<string, Promise<File[]>>>({});
  const getFiles = (n: NetId) => {
    const k = keyFor(n);
    if (!filesRef.current[k]) {
      const f = fmtOf(n), list = slidesFor(n), name = `${title}-${nameOf(n)}`;
      const p = (async () => {
        if (!list.length || list.some(s => !s)) throw new Error('not_ready');
        const out: File[] = [];
        for (const [i, s] of list.entries()) {
          const blob = await png(s!);
          out.push(new File([blob], list.length > 1 ? `${name}-${String(i + 1).padStart(2, '0')}.png` : `${name}.png`, { type: 'image/png' }));
        }
        return f.pdf ? [await toPdf(out, f, name)] : out;
      })();
      p.catch(() => { if (filesRef.current[k] === p) delete filesRef.current[k]; });
      filesRef.current[k] = p;
    }
    return filesRef.current[k];
  };
  const allReady = big.length > 0 && big.every(Boolean);
  // al passo Testo si prepara in sottofondo il social che si sta guardando
  useEffect(() => {
    if (stepIx < 3 || !allReady || busy) return;
    const t = setTimeout(() => { void getFiles(active).catch(() => null); }, 500);
    return () => clearTimeout(t);
  }, [stepIx, allReady, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const shareVideo = view === 'video' && vid.status === 'done' && !!vid.url; // Condividi: il video se e' quello che si guarda
  const share = async () => {
    if (busy) return;
    if (shareVideo) {
      // il video: si condivide il file (telefono) o si scarica (computer)
      setBusy('share'); setNote('');
      try {
        const f = await vFile();
        if (navigator.canShare?.({ files: [f] })) { try { await navigator.share({ files: [f] }); } catch (e) { if ((e as Error).name !== 'AbortError') throw e; } }
        else { save(f, f.name); setNote(tr('Video scaricato.', 'Video downloaded.')); }
      } catch (e) { console.error('social video share', e); setNote(tr('Non sono riuscito a prendere il video, riprova.', 'I could not get the video, please try again.')); }
      setBusy(null); return;
    }
    const n = active;
    // il testo si copia subito, prima di ogni attesa (gli appunti vogliono il tocco)
    if (text) void navigator.clipboard?.writeText(text).catch(() => null);
    setBusy('share'); setNote(nSlides > 1 ? tr(`Preparo ${nSlides} immagini`, `Making ${nSlides} images`) : '');
    try {
      const files = await getFiles(n);
      if (navigator.canShare?.({ files })) {
        try { await navigator.share({ files }); setDone(o => [...new Set([...o, n])]); setNote(text ? tr(`Il testo per ${net.label} è copiato, incollalo nel post.`, `The ${net.label} text is copied, paste it in the post.`) : ''); }
        catch (e) { if ((e as Error).name !== 'AbortError') throw e; setNote(''); }
      } else {
        // computer: niente condivisione di file, si scarica e il testo resta copiato
        if (files.length === 1) save(files[0], files[0].name);
        else await zipSave(files.map(f => ({ path: f.name, f })), `${title}-${nameOf(n)}.zip`);
        setDone(o => [...new Set([...o, n])]);
        setNote(tr(`Scaricato per ${net.label}${text ? ', e il testo è copiato' : ''}. Caricalo da ${net.label}.`, `Downloaded for ${net.label}${text ? ', and the text is copied' : ''}. Upload it from ${net.label}.`));
      }
    } catch (e) {
      console.error('social share', e);
      setNote(tr('Non sono riuscito a creare il file, riprova.', 'I could not create the file, please try again.'));
    }
    setBusy(null);
  };
  const zipSave = async (items: { path: string; f: File }[], name: string) => {
    const { default: JSZip } = await import('jszip');
    const zip = new JSZip();
    for (const it of items) zip.file(it.path, it.f);
    save(await zip.generateAsync({ type: 'blob' }), name);
  };
  // Scarica tutto: un file per social (instagram-post.png, whatsapp-stato.png), il carosello in una cartella, LinkedIn in PDF
  const downloadAll = async () => {
    if (busy) return;
    setBusy('all'); setNote('');
    const t0 = performance.now();
    try {
      const items: { path: string; f: File }[] = [];
      for (const [i, n] of nets.entries()) {
        if (nets.length > 1) setNote(tr(`Preparo ${netOf(n).label}, ${i + 1} di ${nets.length}`, `Making ${netOf(n).label}, ${i + 1} of ${nets.length}`));
        const files = await getFiles(n), nm = nameOf(n);
        if (files.length === 1) items.push({ path: `${nm}.${files[0].name.split('.').pop()}`, f: files[0] });
        else files.forEach((f, j) => items.push({ path: `${nm}/${String(j + 1).padStart(2, '0')}.png`, f }));
      }
      let vMissed = false;
      if (vid.url) {
        setNote(tr('Aggiungo il video', 'Adding the video'));
        const f = await vFile().catch(() => null);
        if (f) items.push({ path: `video-${vid.style}.mp4`, f }); else vMissed = true;
      }
      console.info('[social] scarica tutto', nets.join(','), items.length, `${Math.round(items.reduce((a, x) => a + x.f.size, 0) / 1024)} KB`, `${Math.round(performance.now() - t0)} ms`);
      if (items.length === 1) { save(items[0].f, `${title}-${items[0].path}`); setNote(fmt.pdf ? tr('Documento PDF scaricato, caricalo su LinkedIn come documento.', 'PDF document downloaded, upload it to LinkedIn as a document.') : tr('Immagine scaricata.', 'Image downloaded.')); }
      else {
        await zipSave(items, `${title}-social.zip`);
        const what = [...nets.map(n => nameOf(n)), ...(vid.url && !vMissed ? [tr('video', 'video')] : [])].join(', ');
        setNote(tr(`Scaricato un file .zip: ${what}.`, `Downloaded a .zip file: ${what}.`) + (vMissed ? ' ' + tr('Il video non è entrato, scaricalo a parte.', 'The video is missing, download it separately.') : ''));
      }
    } catch (e) {
      console.error('social export', e);
      setNote(tr('Non sono riuscito a creare i file, riprova.', 'I could not create the files, please try again.'));
    }
    setBusy(null);
  };
  // misure: il riquadro dell'anteprima ha sempre la stessa grandezza, il post ci sta dentro (contain) in ogni formato
  const wide = vp.w >= 1024;
  const modalH = Math.min(vp.h * 0.94, 880);
  const boxW = wide ? 400 : Math.min(vp.w - 32, 420);
  const boxH = wide ? Math.max(320, Math.min(560, modalH - 330)) : Math.min(Math.round(vp.h * 0.36), 320);
  const cellW = gridW ? Math.floor((gridW - ((vp.w < 640 ? 2 : 3) - 1) * 12) / (vp.w < 640 ? 2 : 3)) : 0;
  const btn = 'flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 text-sm font-semibold ease-smooth transition-colors disabled:opacity-50';
  const chip = (on: boolean) => `ease-smooth transition-[background-color,box-shadow,color] ring-1 ${on ? 'bg-brand/10 text-ink ring-brand' : 'bg-white text-ink ring-black/10 hover:ring-black/25'}`;
  const canNext = stepIx !== 1 || (!anyMulti || chosen.length > 0);
  const shown = big[six] ?? null;
  const toneOf = (t: Tone) => all.filter(x => t === 'all' || TONE[x.id] === t).length;
  const dlAll = nets.length > 1 || vid.url ? tr('Scarica tutto', 'Download all') : fmt.pdf ? tr('Scarica PDF', 'Download PDF') : fmt.multi ? tr('Scarica tutte', 'Download all') : tr('Scarica', 'Download');

  const tabs = (
    <div className="flex h-10 max-w-full items-center gap-1 overflow-x-auto rounded-full bg-canvas p-1" role="tablist" aria-label={tr('Social scelti', 'Chosen networks')}>
      {nets.map(n => (
        <button key={n} type="button" role="tab" aria-selected={view === 'post' && n === active} onClick={() => show(n)} className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ease-smooth transition-[background-color,color,box-shadow] ${view === 'post' && n === active ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
          <NetIcon id={n} size={15} />
          <span className={nets.length + (withVideo ? 1 : 0) > 3 && (n !== active || view !== 'post') ? 'hidden sm:inline' : ''}>{netOf(n).label}</span>
          {done.includes(n) && <Check size={13} className="text-brand" strokeWidth={3} />}
        </button>
      ))}
      {(withVideo || stepIx === 4) && (
        <button type="button" role="tab" aria-selected={view === 'video'} onClick={() => setView('video')} className={`flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ease-smooth transition-[background-color,color,box-shadow] ${view === 'video' ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
          {vWorking ? <Loader2 size={15} className="animate-spin" /> : <Film size={15} />} {tr('Video', 'Video')}
        </button>
      )}
    </div>
  );

  // video nell'anteprima: 9:16 dentro il riquadro; mentre si crea, il fotogramma dello stile con l'avanzamento
  const vk = Math.min((boxW - 24) / 1080, (boxH - 24) / 1920), vw = Math.round(1080 * vk), vh = Math.round(1920 * vk);
  const showVid = view === 'video' && (withVideo || stepIx === 4);
  const videoPreview = (
    <div className="relative overflow-hidden rounded-2xl bg-black shadow-md ring-1 ring-black/5" style={{ width: vw, height: vh }}>
      {vid.status === 'done' && vid.url
        ? <video key={vid.url} src={vid.url} controls autoPlay muted loop playsInline className="h-full w-full object-cover" />
        : !vWorking
          // nessun video ancora: la clip d'esempio dello stile scelto
          ? <video key={vSample} src={`${vSample}.mp4`} poster={`${vSample}.webp`} autoPlay muted loop playsInline className="h-full w-full object-cover" />
          : (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={`${vSample}.webp`} alt="" className="absolute inset-0 h-full w-full object-cover opacity-40 blur-[2px]" />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-4 text-center text-white">
              {(
                <>
                  <Loader2 size={22} className="animate-spin" />
                  <span className="text-sm font-semibold">{vid.status === 'queued' ? tr('In coda', 'Queued') : tr('Creo il video', 'Making the video')}</span>
                  <span className="text-[11px] tabular-nums text-white/80">{vid.status === 'queued' ? tr('Parte appena si libera un posto', 'Starts as soon as a slot is free') : `${vElapsed} s, ${vEta}`}</span>
                  {typeof vid.progress === 'number' && <span className="mt-1 block h-1.5 w-24 overflow-hidden rounded-full bg-white/25"><span className="block h-full rounded-full bg-white ease-smooth transition-[width]" style={{ width: `${Math.max(4, vid.progress)}%` }} /></span>}
                </>
              )}
            </div>
          </>
        )}
    </div>
  );

  // ---- inquadratura della foto che si guarda (passi Foto e Grafica): a tutto schermo o intera, zoom, trascinando ----
  // mentre si trascina o si muove lo zoom si cambia solo la foto gia' disegnata; il post si ridisegna una volta, a gesto finito
  const curPhoto: Photo | undefined = fmt.multi ? slidesPhotos[six] : slidesPhotos[0];
  const curFrame = shown ? frameOf(shown) : null;
  const framable = !!curPhoto && !!curFrame && (stepIx === 1 || stepIx === 2) && !showVid;
  const previewRef = useRef<HTMLDivElement>(null);
  const live2 = useRef<{ src: string; f: Frame; t?: number } | null>(null);
  const liveFg = () => { const l = previewRef.current?.querySelectorAll<HTMLElement>('.tpl-cover-fg'); return l?.[l.length - 1]; };
  const commitFrame = () => { const l = live2.current; if (!l) return; clearTimeout(l.t); live2.current = null; setFrames(o => ({ ...o, [l.src]: l.f })); };
  const frameLive = (src: string, f: Frame, cover: boolean) => {
    const el = liveFg(); if (el) applyFrame(el, cover, f);
    clearTimeout(live2.current?.t);
    live2.current = { src, f, t: window.setTimeout(commitFrame, 400) };
  };
  const setFrame = (src: string, p: Partial<Frame>) => setFrames(o => ({ ...o, [src]: { ...(o[src] ?? FRAME0), ...p } }));
  const curFit = shown && shown.kind !== 'contact' ? shown.fit : true;
  const drag = useRef<{ x: number; y: number; f: Frame; id: number } | null>(null);
  const onDown = (e: React.PointerEvent) => {
    if (!framable || !curFrame) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drag.current = { x: e.clientX, y: e.clientY, f: live2.current?.f ?? curFrame, id: e.pointerId };
  };
  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId || !curPhoto || !shown) return;
    // stesso conto di object-position + scale: spostare il punto x di dx sposta la foto di x * (riquadro - foto)
    const W = shown.size.w, H = shown.size.h, k = Math.min((boxW - 24) / W, (boxH - 24) / H);
    const iw = curPhoto.w || W, ih = curPhoto.h || H, sc = (curFit ? Math.max(W / iw, H / ih) : Math.min(W / iw, H / ih)) * d.f.z;
    const ox = W - iw * sc, oy = H - ih * sc, cl = (v: number) => Math.min(1, Math.max(0, v));
    const f = { ...d.f, x: Math.abs(ox) > 1 ? cl(d.f.x + (e.clientX - d.x) / k / ox) : d.f.x, y: Math.abs(oy) > 1 ? cl(d.f.y + (e.clientY - d.y) / k / oy) : d.f.y };
    frameLive(curPhoto.src, f, curFit);
  };
  const onUp = () => { if (drag.current) { drag.current = null; commitFrame(); } };

  const fr = curFrame ?? FRAME0;
  const changed = !!curPhoto && !!frames[curPhoto.src] && JSON.stringify(frames[curPhoto.src]) !== JSON.stringify(FRAME0);
  // inquadratura: barra compatta dentro l'anteprima (solo nel passo Foto), come negli editor delle app social
  const frameBar = framable && stepIx === 1 ? (() => {
    const z = live2.current?.src === curPhoto!.src ? live2.current.f.z : fr.z;
    const setZ = (v: number) => setFrame(curPhoto!.src, { z: Math.min(3, Math.max(1, Math.round(v * 100) / 100)) });
    const seg = (on: boolean, fit: 'cover' | 'contain', Icon: typeof Crop, label: string) => (
      <button type="button" role="radio" aria-checked={on} onClick={() => setFrame(curPhoto!.src, { fit })} title={label}
        className={`flex h-8 items-center gap-1 whitespace-nowrap rounded-full px-2.5 text-xs font-semibold ease-smooth transition-colors ${on ? 'bg-ink text-white' : 'text-ink/70 hover:text-ink'}`}><Icon size={13} /> {label}</button>
    );
    return (
      <div className="blur-in flex flex-nowrap items-center gap-0.5 rounded-full bg-white p-1 shadow-sm ring-1 ring-black/10">
        <div role="radiogroup" aria-label={tr('Come mostrare la foto', 'How to show the photo')} className="flex">
          {seg(curFit, 'cover', Maximize2, tr('Riempi', 'Fill'))}
          {seg(!curFit, 'contain', Minimize2, tr('Intera', 'Whole'))}
        </div>
        <span className="mx-1 h-5 w-px bg-black/10" aria-hidden />
        <button type="button" onClick={() => setZ(z - 0.1)} disabled={z <= 1} aria-label={tr('Meno zoom', 'Zoom out')} className="flex h-8 w-8 items-center justify-center rounded-full text-ink/70 hover:text-ink disabled:opacity-30"><ZoomOut size={15} /></button>
        <input type="range" min={1} max={3} step={0.01} defaultValue={fr.z} key={`${curPhoto!.src}-${fr.z}`} aria-label={tr('Zoom', 'Zoom')}
          onChange={e => frameLive(curPhoto!.src, { ...(live2.current?.src === curPhoto!.src ? live2.current.f : fr), z: Number(e.target.value) }, curFit)}
          onPointerUp={commitFrame} onKeyUp={commitFrame} className="h-8 w-16 accent-[#537eec] sm:w-20" />
        <button type="button" onClick={() => setZ(z + 0.1)} disabled={z >= 3} aria-label={tr('Più zoom', 'Zoom in')} className="flex h-8 w-8 items-center justify-center rounded-full text-ink/70 hover:text-ink disabled:opacity-30"><ZoomIn size={15} /></button>
        {changed && <button type="button" onClick={() => setFrames(o => { const c = { ...o }; delete c[curPhoto!.src]; return c; })} aria-label={tr('Ripristina', 'Reset')} title={tr('Ripristina', 'Reset')} className="flex h-8 w-8 items-center justify-center rounded-full text-ink/70 hover:text-ink"><RotateCcw size={14} /></button>}
      </div>
    );
  })() : null;

  const preview = (
    <div className="flex flex-col items-center gap-3">
      {tabs}
      <div ref={previewRef} className="relative flex items-center justify-center rounded-[24px] bg-canvas" style={{ width: boxW, height: boxH }}>
        {showVid ? videoPreview : fmt.multi && !slidesPhotos.length
          ? <span className="px-6 text-center text-sm text-muted">{tr('Scegli almeno una foto', 'Choose at least one photo')}</span>
          : <MorphPost build={shown} boxW={boxW} boxH={boxH} fw={fmt.w} fh={fmt.h} />}
        {framable && <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} aria-hidden className="absolute inset-3 cursor-grab touch-none active:cursor-grabbing" />}
        {!showVid && nSlides > 1 && (
          <>
            <button type="button" onClick={() => setSlideIx(Math.max(0, six - 1))} disabled={!six} aria-label={tr('Slide precedente', 'Previous slide')} className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-md ease-smooth transition-opacity disabled:opacity-0"><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => setSlideIx(Math.min(nSlides - 1, six + 1))} disabled={six >= nSlides - 1} aria-label={tr('Slide successiva', 'Next slide')} className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-md ease-smooth transition-opacity disabled:opacity-0"><ChevronRight size={18} /></button>
          </>
        )}
      </div>
      <div className="flex min-h-8 items-center gap-1.5">
        {showVid ? <span className="text-xs text-muted">{withVideo ? tr('Video', 'Video') : tr('Esempio dello stile', 'Style sample')} {reelStyleLabel(vid.style)}, 9:16, 1080×1920</span> : nSlides > 1 ? (
          <>
            {Array.from({ length: nSlides }, (_, i) => (
              <button key={i} type="button" onClick={() => setSlideIx(i)} aria-label={`${tr('Slide', 'Slide')} ${i + 1}`} className="flex h-8 items-center px-0.5">
                <span className={`block h-2 rounded-full ease-smooth transition-[width,background-color] ${i === six ? 'w-6 bg-ink' : 'w-2 bg-ink/20'}`} />
              </button>
            ))}
            <span className="ml-2 w-12 text-xs tabular-nums text-muted">{six + 1} / {nSlides}</span>
          </>
        ) : frameBar ?? <span className="text-xs text-muted">{net.label}, {fmt.label} {fmt.ratio}, {fmt.w}×{fmt.h}</span>}
      </div>
      {!showVid && nSlides > 1 && frameBar}
    </div>
  );

  const stepSocial = (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold">{tr('Dove lo pubblichi?', 'Where will you post it?')}</h3>
        <p className="mt-0.5 text-xs text-muted">{tr('Puoi sceglierne più di uno, preparo tutto insieme.', 'You can pick more than one, I prepare them all together.')}</p>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {NETS.map(n => {
            const on = nets.includes(n.id);
            return (
              <button key={n.id} type="button" onClick={() => toggleNet(n.id)} aria-pressed={on} className={`relative flex h-[72px] flex-col items-center justify-center gap-1.5 rounded-2xl ${chip(on)}`}>
                <span className={`absolute right-1.5 top-1.5 flex h-[18px] w-[18px] items-center justify-center rounded-full ease-smooth transition-colors ${on ? 'bg-brand text-white' : 'ring-1 ring-inset ring-black/15'}`}>{on && <Check size={11} strokeWidth={3} />}</span>
                <span className={on ? 'text-brand' : 'text-ink/70'}><NetIcon id={n.id} size={22} /></span>
                <span className="text-[11px] font-semibold sm:text-xs">{n.label}</span>
              </button>
            );
          })}
        </div>
      </section>
      <section>
        <h3 className="text-sm font-semibold">{nets.length > 1 ? tr('Formato per ogni social', 'Format for each network') : tr('Formato', 'Format')}</h3>
        {nets.map(id => {
          const N = netOf(id), cf = fmtOf(id);
          return (
            <div key={id} className="mt-3 first:mt-1 [&+&]:mt-7">
              {/* divisore col nome del social a inizio linea, poi la linea fino a destra */}
              <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-muted">
                <span>{N.label}</span>
                <span className="h-px flex-1 bg-black/10" aria-hidden />
              </div>
              <div role="radiogroup" aria-label={N.label} className="grid gap-2 sm:grid-cols-2">
                {N.fmts.map(f => {
                  const on = cf.id === f.id;
                  return (
                    <button key={f.id} type="button" role="radio" aria-checked={on} onClick={() => pickFmt(id, f.id)} className={`flex h-12 items-center gap-3 rounded-2xl px-4 text-left ${chip(on)}`}>
                      <RatioGlyph w={f.w} h={f.h} on={on} />
                      <span className="min-w-0 flex-1 truncate text-sm font-semibold">{f.label}</span>
                      <span className="shrink-0 text-xs tabular-nums text-muted">{f.ratio}, {f.w}×{f.h}{f.pdf ? ', PDF' : ''}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
        {anyMulti && <p className="mt-4 text-xs text-muted">{nets.some(n => fmtOf(n).pdf)
          ? tr(`Carosello: fino a ${MAX_PHOTOS} foto più una slide con i tuoi contatti. Su LinkedIn diventa un documento PDF, una slide per pagina.`, `Carousel: up to ${MAX_PHOTOS} photos plus a slide with your contacts. On LinkedIn it becomes a PDF document, one slide per page.`)
          : tr(`Carosello: fino a ${MAX_PHOTOS} foto più una slide con i tuoi contatti.`, `Carousel: up to ${MAX_PHOTOS} photos plus a slide with your contacts.`)}</p>}
      </section>
    </div>
  );

  const stepFoto = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h3 className="text-sm font-semibold">{anyMulti ? tr('Scegli le foto', 'Choose the photos') : tr('Scegli la foto', 'Choose the photo')}</h3>
          <p className="mt-0.5 text-xs text-muted">{anyMulti
            ? tr(`Il numero è l’ordine delle slide, la 1 è la copertina${nets.length > 1 ? ' e la foto dei post singoli' : ''}. Fino a ${MAX_PHOTOS}, ne hai scelte ${chosen.length}.`, `The number is the slide order, 1 is the cover${nets.length > 1 ? ' and the photo of single posts' : ''}. Up to ${MAX_PHOTOS}, you chose ${chosen.length}.`)
            : tr('Una foto, la stessa per ogni social scelto.', 'One photo, the same for every chosen network.')}</p>
        </div>
        {anyMulti && (
          <div className="flex gap-1">
            <button type="button" onClick={() => setSel(photos.slice(0, MAX_PHOTOS).map(p => p.src))} className="h-9 rounded-full px-3 text-xs font-semibold text-brand ease-smooth transition-colors hover:bg-brand/10">{tr('Seleziona tutte', 'Select all')}</button>
            {framable && slidesPhotos.length > 1 && <button type="button" onClick={() => setFrames(o => ({ ...o, ...Object.fromEntries(slidesPhotos.map(p => [p.src, { ...fr }])) }))} title={tr('Stessa inquadratura su tutte le foto', 'Same framing on every photo')} className="h-9 rounded-full px-3 text-xs font-semibold text-brand ease-smooth transition-colors hover:bg-brand/10">{tr('Inquadratura a tutte', 'Framing to all')}</button>}
            <button type="button" onClick={() => setSel([])} disabled={!sel.length} className="h-9 rounded-full px-3 text-xs font-semibold text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink disabled:opacity-40">{tr('Togli tutte', 'Clear all')}</button>
          </div>
        )}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map(p => {
          const i = gridSel.indexOf(p);
          return (
            <button key={p.src} type="button" onClick={() => tap(p.src)} aria-pressed={i >= 0} className={`relative aspect-[4/3] overflow-hidden rounded-2xl ring-2 ring-offset-2 ease-smooth transition-shadow ${i >= 0 ? 'ring-brand' : 'ring-transparent hover:ring-black/15'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.small} alt="" className="h-full w-full object-cover" />
              {p.staged && <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ink">{tr('Arredata AI', 'AI staged')}</span>}
              <span className={`absolute right-2 top-2 flex h-7 min-w-7 items-center justify-center rounded-full px-1.5 text-xs font-bold ease-smooth transition-colors ${i >= 0 ? 'bg-brand text-white' : 'bg-black/25 ring-2 ring-inset ring-white/90'}`}>{i >= 0 ? (anyMulti ? i + 1 : <Check size={14} />) : ''}</span>
            </button>
          );
        })}
        {photos.length < Math.min(srcs.length, 24) && <span className="aspect-[4/3] animate-pulse rounded-2xl bg-canvas" />}
      </div>
      {anyMulti && gridSel.length > 1 && (
        <div>
          <span className="text-xs font-medium text-muted">{tr('Ordine delle slide, sposta con le frecce', 'Slide order, move with the arrows')}</span>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {gridSel.map((p, i) => (
              <span key={p.src} className="flex items-center gap-0.5 rounded-full bg-canvas p-1">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.small} alt="" className="h-8 w-8 rounded-full object-cover" />
                <span className="w-5 text-center text-xs font-bold tabular-nums">{i + 1}</span>
                <button type="button" onClick={() => move(i, -1)} disabled={!i} aria-label={tr('Prima', 'Earlier')} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-white hover:text-ink disabled:opacity-30"><ArrowLeft size={14} /></button>
                <button type="button" onClick={() => move(i, 1)} disabled={i === gridSel.length - 1} aria-label={tr('Dopo', 'Later')} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-white hover:text-ink disabled:opacity-30"><ArrowRight size={14} /></button>
              </span>
            ))}
          </div>
        </div>
      )}
      {(anyMulti ? gridSel : photos).some(p => p.staged) && (
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={label} onChange={e => setLabel(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand,#537eec)]" />
          {tr(`Scritta “${STAGED_TEXT}” sulle foto arredate con l’AI`, `Label “${STAGED_TEXT}” on AI staged photos`)}
        </label>
      )}
      {!canNext && <p className="text-sm text-muted">{tr('Scegli almeno una foto per andare avanti.', 'Choose at least one photo to continue.')}</p>}
    </div>
  );

  // interruttore "È venduto / affittato" (passi Grafica e Video): acceso, Venduto o Affittato e i giorni (facoltativi)
  const soldBox = (
    <div className="rounded-[24px] bg-canvas p-3">
      <label className="flex cursor-pointer items-center gap-3">
        <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-white ring-1 ring-black/5 ease-smooth transition-colors ${soldOn ? 'text-brand' : 'text-ink/50'}`}><BadgeCheck size={18} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{tr('È venduto / affittato', 'It is sold / rented')}</span>
          <span className="block text-xs text-muted">{isClosed(status0) ? tr(`Nella scheda risulta ${STATUS_LABELS[status0][0].toLowerCase()}.`, `The listing says ${STATUS_LABELS[status0][1].toLowerCase()}.`) : tr('Grafiche e video col timbro, per far vedere il lavoro fatto.', 'Designs and videos with the stamp, to show your work.')}</span>
        </span>
        <input type="checkbox" checked={soldOn} onChange={e => setSold(e.target.checked)} className="peer sr-only" />
        <span className="relative h-6 w-10 shrink-0 rounded-full bg-black/15 ease-smooth transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:ease-smooth after:transition-transform peer-checked:bg-brand peer-checked:after:translate-x-4 peer-focus-visible:ring-2 peer-focus-visible:ring-brand/50" />
      </label>
      {soldOn && (
        <div className="blur-in mt-3 flex flex-wrap items-center gap-x-3 gap-y-2 border-t border-black/5 pt-3">
          <div role="radiogroup" aria-label={tr('Venduto o affittato', 'Sold or rented')} className="inline-flex rounded-full bg-white p-1 ring-1 ring-black/5">
            {([['venduto', tr('Venduto', 'Sold')], ['affittato', tr('Affittato', 'Rented')]] as const).map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={soldKind === v} onClick={() => setSoldKind(v)} className={`h-8 rounded-full px-4 text-xs font-semibold ease-smooth transition-colors ${soldKind === v ? 'bg-ink text-white' : 'text-ink/70 hover:text-ink'}`}>{l}</button>
            ))}
          </div>
          <label className="flex min-w-0 items-center gap-2 text-xs font-medium text-muted">
            {soldRent ? tr('Affittato in', 'Rented in') : tr('Venduto in', 'Sold in')}
            <input value={soldDays} onChange={e => setSoldDays(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="23" aria-label={tr('Giorni', 'Days')} className="h-9 w-16 rounded-full bg-white px-3 text-center text-sm text-ink outline-none ring-1 ring-black/10 focus:ring-brand" />
            {tr('giorni (facoltativo)', 'days (optional)')}
          </label>
        </div>
      )}
    </div>
  );

  const TONES: [Tone, string][] = [['all', tr('Tutte', 'All')], ['sold', soldRent ? tr('Affittato', 'Rented') : tr('Venduto', 'Sold')], ['light', tr('Chiare', 'Light')], ['dark', tr('Scure', 'Dark')], ['brand', tr('Col tuo colore', 'Your colour')]];
  const stepGrafica = (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{tr('Scegli la grafica', 'Choose the design')}</h3>
        <p className="mt-0.5 text-xs text-muted">{nets.length > 1
          ? tr(`Una grafica per tutti i social, adattata a ogni formato. Qui vedi ${net.label} ${fmt.ratio}, cambia social sopra l’anteprima.`, `One design for every network, adapted to each format. Here you see ${net.label} ${fmt.ratio}, switch network above the preview.`)
          : fmt.multi
            ? tr('Vale per la copertina; le altre slide restano pulite con logo e numero, l’ultima ha i tuoi contatti.', 'It applies to the cover; the other slides stay clean with logo and number, the last has your contacts.')
            : tr(`Le grafiche adatte al formato ${fmt.ratio}, con il tuo logo e il tuo colore.`, `Designs that fit the ${fmt.ratio} format, with your logo and colour.`)}</p>
      </div>
      {swaps.length > 0 && (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
          {swaps.map(s => (
            <span key={s.n} className="block">{tr(`${tplLabel(tpl)} non regge ${netOf(s.n).label} ${s.f.ratio}: lì uso ${tplLabel(s.to)}, la più simile.`, `${tplLabel(tpl)} does not fit ${netOf(s.n).label} ${s.f.ratio}: there I use ${tplLabel(s.to)}, the closest one.`)}</span>
          ))}
        </div>
      )}
      {soldBox}
      {toneOf('light') + toneOf('dark') + toneOf('brand') > 0 && (
        <div className="flex flex-wrap gap-2">
          {TONES.filter(([t]) => t === 'all' || toneOf(t) > 0).map(([t, l]) => (
            <button key={t} type="button" onClick={() => setTone(t)} aria-pressed={tone === t} className={`h-9 rounded-full px-4 text-xs font-semibold ${chip(tone === t)}`}>{l}</button>
          ))}
        </div>
      )}
      <div ref={gridRef} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cellW > 0 && list.map(t => (
          <button key={t.id} type="button" onClick={() => setTpl(t.id)} aria-pressed={cur === t.id} className="group flex flex-col items-center gap-2 text-left">
            <span className={`block overflow-hidden rounded-2xl ring-2 ring-offset-2 ease-smooth transition-shadow ${cur === t.id ? 'ring-brand' : 'ring-transparent group-hover:ring-black/15'}`}><PostView build={thumbs[t.id] ?? null} width={cellW - 4} /></span>
            <span className={`flex items-center gap-1 text-xs font-semibold ${cur === t.id ? 'text-ink' : 'text-muted'}`}>{cur === t.id && <Check size={13} className="text-brand" />}{t.label}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // testi di tutti i social scelti, uno sotto l'altro: ognuno con il contatore del suo limite e Copia testo
  const num = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.'); // 2.200 (toLocaleString it-IT scrive 2200)
  const textCard = (n: NetId) => {
    const N = netOf(n), k = tk(n), t = texts[k] ?? '', rule = ruleOf(n, n === 'tiktok' && withVideo), len = countChars(t), tags = countTags(t);
    const ref = rule.ideal ?? rule.max;
    const tone = len > rule.max ? 'text-red-600' : len > ref * (rule.ideal ? 1 : 0.9) ? 'text-amber-600' : 'text-muted';
    const tagTone = tags > rule.tags[1] ? 'text-red-600' : 'text-muted';
    const hint = [
      rule.visible ? tr(`Le prime ${rule.visible} battute si vedono prima di “altro”.`, `The first ${rule.visible} characters show before “more”.`) : '',
      rule.ideal ? tr(`Meglio breve, oltre ${num(rule.ideal)} battute il testo si chiude.`, `Keep it short, past ${num(rule.ideal)} characters the text collapses.`) : '',
      n === 'tiktok' ? (withVideo ? tr('Col video il limite è 2.200.', 'With the video the limit is 2,200.') : tr('Per le foto il limite è 4.000, per i video 2.200.', 'Photos allow 4,000, videos 2,200.')) : '',
    ].filter(Boolean).join(' ');
    const on = nets.length > 1 && view === 'post' && n === active;
    return (
      <section key={n} onFocusCapture={() => { if (n !== active || view !== 'post') show(n); }} className={`rounded-[32px] p-4 ring-1 ease-smooth transition-shadow ${on ? 'ring-brand/50' : 'ring-black/10'}`}>
        <button type="button" onClick={() => show(n)} className="flex min-h-8 items-center gap-2 text-left">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas text-ink"><NetIcon id={n} size={16} /></span>
          <span className="text-sm font-semibold">{N.label}</span>
          <span className="text-xs text-muted">{fmtOf(n).label}</span>
          {done.includes(n) && <Check size={14} className="text-brand" strokeWidth={3} />}
        </button>
        <div className="relative mt-3">
          <textarea value={t} onChange={e => putText(n, e.target.value)} rows={nets.length > 1 ? (wide ? 8 : 7) : wide ? 12 : 9} aria-label={tr(`Testo per ${N.label}`, `Text for ${N.label}`)}
            aria-describedby={`count-${n}`}
            className="block w-full resize-y rounded-2xl bg-canvas px-4 py-3 text-sm leading-relaxed outline-none ring-1 ring-transparent ease-smooth transition-[background-color,box-shadow] focus:bg-white focus:ring-brand" />
          {(textBusy[k] || (textErr[k] && !t)) && (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-2xl bg-canvas px-4 text-center text-sm text-muted">
              {textBusy[k] ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> {tr(`Scrivo il testo per ${N.label}`, `Writing the text for ${N.label}`)}</span> : (
                <>
                  <span>{textErr[k]}</span>
                  <button type="button" onClick={() => void writeText(n, true)} className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-ink shadow-sm ring-1 ring-black/5 hover:bg-line"><RotateCcw size={15} /> {tr('Riprova', 'Try again')}</button>
                </>
              )}
            </span>
          )}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1">
          <span id={`count-${n}`} className="flex flex-wrap items-center gap-x-3 text-xs font-semibold tabular-nums">
            <span className={`ease-smooth transition-colors ${tone}`}>{num(len)} / {num(ref)}{rule.ideal ? ` ${tr('consigliati', 'suggested')}` : ''}</span>
            {rule.tags[1] > 0
              ? <span className={`ease-smooth transition-colors ${tagTone}`}>{tags} / {rule.tags[1]} hashtag</span>
              : tags > 0 && <span className="text-red-600">{tr(`Niente hashtag su ${N.label}`, `No hashtags on ${N.label}`)}</span>}
          </span>
          <button type="button" onClick={() => void copy(n)} disabled={!t || !!textBusy[k]} className="ml-auto flex h-10 items-center gap-2 rounded-full bg-canvas px-4 text-sm font-semibold ease-smooth transition-colors hover:bg-line disabled:opacity-50">{copied === n ? <Check size={15} /> : <Copy size={15} />} <span className="w-[84px] text-left">{copied === n ? tr('Copiato', 'Copied') : tr('Copia testo', 'Copy text')}</span></button>
        </div>
        {(hint || len > rule.max) && <p className="mt-1 text-xs text-muted">{len > rule.max ? <span className="font-medium text-red-600">{tr(`Troppo lungo per ${N.label}, togli ${num(len - rule.max)} battute. `, `Too long for ${N.label}, remove ${num(len - rule.max)} characters. `)}</span> : null}{hint}</p>}
      </section>
    );
  };

  // passo 5, facoltativo: il video dell'annuncio (o del Venduto) con gli stessi stili della chat; si puo' finire anche senza
  const pickable = vid.status === 'idle' || vid.status === 'error';
  const vOthers = vCandidates.filter(p => !vList.includes(p));
  const tileBtn = 'flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm hover:bg-white disabled:opacity-0';
  // foto del video: striscia compatta (numero = ordine, la 1 apre il video), sotto le altre da aggiungere
  const vPhotoPick = vTpl === 'venduto' ? (
    <section>
      <label className="mb-4 flex flex-wrap items-center gap-2 text-sm font-medium">
        {soldRent ? tr('Affittato in', 'Rented in') : tr('Venduto in', 'Sold in')}
        <input value={soldDays} onChange={e => setSoldDays(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" placeholder="23" aria-label={tr('Giorni', 'Days')} className="h-10 w-20 rounded-full bg-canvas px-3 text-center text-sm outline-none ring-1 ring-transparent focus:bg-white focus:ring-brand" />
        <span>{tr('giorni', 'days')} <span className="text-xs font-normal text-muted">{tr('(facoltativo)', '(optional)')}</span></span>
      </label>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h4 className="text-sm font-semibold">{tr('Foto del video', 'Video photo')}</h4>
        <span className="text-xs text-muted">{tr('Una foto, quella col timbro', 'One photo, the one with the stamp')}</span>
      </div>
      <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:thin]">
        {vCandidates.map(p => {
          const on = p === vSoldPhoto;
          return (
            <button key={p.src} type="button" onClick={() => setVOne(p.src)} aria-pressed={on} className={`relative h-[96px] w-[72px] shrink-0 overflow-hidden rounded-2xl ease-smooth transition-shadow ${on ? 'ring-[3px] ring-brand' : 'ring-1 ring-black/10 hover:ring-black/25'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.small} alt="" className="h-full w-full object-cover" />
              {on && <span className="absolute right-1 top-1 flex h-6 w-6 items-center justify-center rounded-full bg-brand text-white"><Check size={13} strokeWidth={3} /></span>}
            </button>
          );
        })}
      </div>
    </section>
  ) : (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-x-3">
        <h4 className="text-sm font-semibold">{tr('Foto del video', 'Video photos')}</h4>
        <span className="text-xs tabular-nums text-muted">{tr(`${vList.length} di ${MAX_REEL_PHOTOS}, la 1 apre il video`, `${vList.length} of ${MAX_REEL_PHOTOS}, number 1 opens the video`)}</span>
      </div>
      <div className="-mx-1 mt-2 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:thin]">
        {vList.map((p, i) => (
          <div key={p.src} className="relative h-[112px] w-[84px] shrink-0 overflow-hidden rounded-2xl bg-canvas ring-1 ring-black/5">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={p.small} alt="" className="h-full w-full object-cover" />
            <span className={`absolute left-1 top-1 flex h-6 min-w-6 items-center justify-center rounded-full px-1.5 text-xs font-bold shadow-sm ${i === 0 ? 'bg-brand text-white' : 'bg-white/95 text-ink'}`}>{i + 1}</span>
            <button type="button" onClick={() => vDel(p.src)} aria-label={tr('Togli', 'Remove')} className={`${tileBtn} absolute right-1 top-1`}><X size={13} /></button>
            <div className="absolute inset-x-1 bottom-1 flex justify-between">
              <button type="button" onClick={() => vMove(i, -1)} disabled={!i} aria-label={tr('Sposta prima', 'Move earlier')} className={tileBtn}><ChevronLeft size={14} /></button>
              <button type="button" onClick={() => vMove(i, 1)} disabled={i === vList.length - 1} aria-label={tr('Sposta dopo', 'Move later')} className={tileBtn}><ChevronRight size={14} /></button>
            </div>
          </div>
        ))}
        {!vList.length && <span className="flex h-[112px] items-center px-2 text-xs text-muted">{photosSettled ? tr('Nessuna foto, aggiungile qui sotto.', 'No photos, add them below.') : <Loader2 size={16} className="animate-spin" />}</span>}
      </div>
      {vOthers.length > 0 && vList.length < MAX_REEL_PHOTOS && (
        <div className="mt-2">
          <span className="text-xs font-medium text-muted">{tr('Tocca per aggiungere', 'Tap to add')}</span>
          <div className="-mx-1 mt-1 flex gap-2 overflow-x-auto px-1 py-1 [scrollbar-width:thin]">
            {vOthers.map(p => (
              <button key={p.src} type="button" onClick={() => vAdd(p.src)} aria-label={tr('Aggiungi al video', 'Add to the video')} className="relative h-16 w-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-black/10 ease-smooth transition-shadow hover:ring-brand">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={p.small} alt="" className="h-full w-full object-cover" />
                <span className="absolute right-0.5 top-0.5 flex h-5 w-5 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm"><Plus size={12} /></span>
              </button>
            ))}
          </div>
        </div>
      )}
      {vList.length < 3 && photosSettled && (
        <p className="mt-2 flex items-start gap-2 rounded-2xl bg-amber-50 px-3 py-2.5 text-xs leading-relaxed text-amber-900 ring-1 ring-amber-200">
          <TriangleAlert size={15} className="mt-px shrink-0" />
          {vCandidates.length < 3
            ? tr(`Il video annuncio vuole almeno 3 foto e l’immobile ne ha ${vCandidates.length}. Aggiungi foto alla scheda o scegli Video Venduto o Affittato, che ne usa una.`, `The listing video needs at least 3 photos and the property has ${vCandidates.length}. Add photos to the listing or choose the Sold or Rented video, which uses one.`)
            : tr(`Il video annuncio vuole almeno 3 foto: aggiungine ${3 - vList.length}, o scegli Video Venduto o Affittato, che ne usa una.`, `The listing video needs at least 3 photos: add ${3 - vList.length} more, or choose the Sold or Rented video, which uses one.`)}
        </p>
      )}
    </section>
  );
  const soldWord = soldRent ? tr('Affittato', 'Rented') : tr('Venduto', 'Sold');
  // scelta del video: annuncio, Venduto o Affittato. Venduto/Affittato accendono anche il Venduto di grafiche e testi
  // (soldOn); tornare all'annuncio cambia solo il video
  const vKind: 'reel' | 'venduto' | 'affittato' = vTpl === 'venduto' ? soldKind : 'reel';
  const pickKind = (k: 'reel' | 'venduto' | 'affittato') => {
    if (k !== 'reel') { if (!soldOn) setSold(true); setSoldKind(k); }
    setVid(o => ({ ...o, tpl: k === 'reel' ? 'reel' : 'venduto', status: o.status === 'error' ? 'idle' : o.status })); setView('video');
  };
  const KINDS = [['reel', tr('Video annuncio', 'Listing video')], ['venduto', tr('Video Venduto', 'Sold video')], ['affittato', tr('Video Affittato', 'Rented video')]] as const;
  const stepVideo = (
    <div className="space-y-5">
      {pickable && (
        <div role="radiogroup" aria-label={tr('Che video', 'Which video')} className="relative grid grid-cols-3 gap-1 rounded-full bg-canvas p-1">
          {/* un solo evidenziato che scivola sotto la scelta (600 ms) */}
          <span aria-hidden className="absolute bottom-1 left-1 top-1 rounded-full bg-white shadow-sm ease-smooth transition-transform duration-[600ms] motion-reduce:transition-none" style={{ width: 'calc((100% - 16px) / 3)', transform: `translateX(calc(${KINDS.findIndex(k => k[0] === vKind)} * (100% + 4px)))` }} />
          {KINDS.map(([v, l]) => (
            <button key={v} type="button" role="radio" aria-checked={vKind === v} onClick={() => pickKind(v)} className={`relative h-9 min-w-0 truncate rounded-full px-2 text-xs font-semibold ease-smooth transition-colors duration-[600ms] sm:text-sm ${vKind === v ? 'text-ink' : 'text-muted hover:text-ink'}`}>{l}</button>
          ))}
        </div>
      )}
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0 flex-1 basis-60">
          <h3 className="text-sm font-semibold">{tr('Vuoi anche il video?', 'Do you want the video too?')}</h3>
          <p className="mt-0.5 text-xs text-muted">{vTpl === 'venduto'
            ? tr(`Facoltativo. Il timbro ${soldWord} sulla foto, la zona${nDays ? ' e i giorni' : ''} e i tuoi contatti, in 9:16 per Storia, Reel, TikTok e WhatsApp.`, `Optional. The ${soldWord} stamp on the photo, the area${nDays ? ', the days' : ''} and your contacts, in 9:16 for Story, Reel, TikTok and WhatsApp.`)
            : tr('Facoltativo. Con le foto e i dati dell’immobile, in 9:16 per Storia, Reel, TikTok e WhatsApp. Lo trovi poi in Scarica tutto.', 'Optional. With the photos and the property details, in 9:16 for Story, Reel, TikTok and WhatsApp. It goes in Download all too.')}</p>
        </div>
        {pickable && <button type="button" onClick={() => void downloadAll()} disabled={!ready || !!busy} className="h-9 shrink-0 rounded-full px-3 text-xs font-semibold text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink disabled:opacity-50">{tr('Salta, scarica senza video', 'Skip, download without video')}</button>}
      </div>
      {pickable && (
        <>
          {vPhotoPick}
          <section>
            <h4 className="mb-2 text-sm font-semibold">{tr('Stile', 'Style')}</h4>
            <StylePick tpl={vTpl} rent={soldRent} value={vid.style} onChange={st => { setVid(v => ({ ...v, style: st })); setView('video'); }} />
          </section>
          <div className="flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-x-4">
            <button type="button" onClick={() => void makeVideo()} disabled={vPhotos.length < vMin} className="flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-ink px-6 py-2 text-center text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand disabled:opacity-50 sm:w-auto"><Play size={16} className="shrink-0" /> {vTpl === 'venduto' ? tr(`Crea il video ${soldWord} ${reelStyleLabel(vid.style)}`, `Make the ${reelStyleLabel(vid.style)} ${soldWord} video`) : tr(`Crea il video ${reelStyleLabel(vid.style)}`, `Make the ${reelStyleLabel(vid.style)} video`)}</button>
            <span className="flex items-start justify-center gap-1.5 text-center text-xs text-muted sm:justify-start sm:text-left"><Coins size={14} className="mt-px shrink-0" /> {tr(`${vCost} crediti, scalati solo a video pronto`, `${vCost} credits, charged only when the video is ready`)}</span>
          </div>
          {vid.status === 'error' && <p className="text-sm font-medium text-red-600">{vid.err}</p>}
        </>
      )}
      {vWorking && (
        <div className="flex items-center gap-3 rounded-[32px] bg-canvas p-4">
          <Loader2 size={18} className="shrink-0 animate-spin text-brand" />
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">{vid.status === 'queued' ? tr('In coda, parte appena si libera un posto', 'Queued, starts as soon as a slot is free') : tr(`Creo il video ${reelStyleLabel(vid.style)}`, `Making the ${reelStyleLabel(vid.style)} video`)}</span>
            <span className="block text-xs tabular-nums text-muted">{vElapsed} s, {vEta}. {tr('Intanto puoi scaricare o condividere i post.', 'Meanwhile you can download or share the posts.')}</span>
            {typeof vid.progress === 'number' && <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-black/10"><span className="block h-full rounded-full bg-brand ease-smooth transition-[width]" style={{ width: `${Math.max(4, vid.progress)}%` }} /></span>}
          </span>
        </div>
      )}
      {vid.status === 'done' && vid.url && (
        <div className="rounded-[32px] bg-canvas p-4">
          <span className="flex items-center gap-1.5 text-sm font-semibold"><Check size={16} className="text-brand" strokeWidth={3} /> {tr(`Video ${reelStyleLabel(vid.style)} pronto, è anche in Scarica tutto`, `${reelStyleLabel(vid.style)} video ready, it is in Download all too`)}</span>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button type="button" onClick={() => setView('video')} className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold shadow-sm ring-1 ring-black/5 ease-smooth transition-colors hover:bg-line"><Play size={15} /> {tr('Guarda', 'Watch')}</button>
            <button type="button" onClick={() => void vFile().then(f => save(f, f.name)).catch(() => setNote(tr('Non sono riuscito a scaricare il video, riprova.', 'I could not download the video, please try again.')))} className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold shadow-sm ring-1 ring-black/5 ease-smooth transition-colors hover:bg-line"><Download size={15} /> {tr('Scarica solo il video', 'Download the video only')}</button>
            <button type="button" onClick={() => { setVid(v => ({ tpl: v.tpl, style: v.style, status: 'idle' })); setView('video'); }} className="flex h-10 items-center rounded-full px-3 text-sm font-semibold text-muted ease-smooth transition-colors hover:bg-white hover:text-ink">{tr('Un altro stile', 'Another style')}</button>
          </div>
        </div>
      )}
      <p className="min-h-5 text-sm text-muted" aria-live="polite">{note}</p>
    </div>
  );

  const stepTesto = (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-semibold">{nets.length > 1 ? tr('I testi per ogni social', 'The texts for each network') : tr(`Il testo per ${net.label}`, `The text for ${net.label}`)}</h3>
        <p className="mt-0.5 text-xs text-muted">{tr('Scritti nei limiti di ogni social, puoi cambiarli. Condividi copia il testo del social che guardi.', 'Written within each network’s limits, you can change them. Share copies the text of the network you are viewing.')}</p>
      </div>
      {nets.map(textCard)}
      {/* il video e' il passo dopo, facoltativo: Scarica tutto e Condividi funzionano gia' da qui */}
      <button type="button" onClick={() => goStep(4)} className="flex w-full items-center gap-3 rounded-[32px] bg-canvas p-4 text-left ease-smooth transition-colors hover:bg-line">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-brand ring-1 ring-black/5">{vWorking ? <Loader2 size={18} className="animate-spin" /> : <Film size={18} />}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{vid.status === 'done' ? tr('Video pronto', 'Video ready') : vWorking ? tr('Creo il video', 'Making the video') : tr('Vuoi anche il video?', 'Do you want the video too?')}</span>
          <span className="block text-xs text-muted">{vid.status === 'done' ? tr('È anche in Scarica tutto.', 'It is in Download all too.') : tr(`Facoltativo, ${vCost} crediti. Puoi anche finire qui con Scarica tutto.`, `Optional, ${vCost} credits. You can also finish here with Download all.`)}</span>
        </span>
        <ArrowRight size={18} className="shrink-0 text-muted" />
      </button>
      <p className="min-h-5 text-sm text-muted" aria-live="polite">{note}</p>
    </div>
  );

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 sm:p-4" onClick={onClose}>
      <div className="flex h-full w-full max-w-[1160px] flex-col overflow-hidden bg-white shadow-2xl sm:rounded-[32px]" style={wide ? { height: modalH } : undefined} onClick={e => e.stopPropagation()}>
        {/* testata e passi */}
        <div className="shrink-0 px-4 pt-4 sm:px-6 sm:pt-5">
          <div className="flex items-center justify-between gap-4">
            <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">{tr('Condividi sui social', 'Share on social media')}</h2>
            <button type="button" onClick={onClose} aria-label={tr('Chiudi', 'Close')} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-ink/70 hover:text-ink"><X size={16} /></button>
          </div>
          <nav className="mt-3 grid grid-cols-5 gap-0.5 rounded-full bg-canvas p-1 sm:gap-1" aria-label={tr('Passi', 'Steps')}>
            {STEPS.map(([i1, e1], i) => {
              const on = i === stepIx, ok = i !== stepIx && i <= reached;
              return (
                <button key={i1} type="button" onClick={() => goStep(i)} aria-current={on ? 'step' : undefined} className={`flex h-10 min-w-0 items-center justify-center gap-1 rounded-full text-[11px] font-semibold ease-smooth transition-[background-color,color,box-shadow] sm:gap-1.5 sm:text-sm ${on ? 'bg-white text-ink shadow-sm' : ok ? 'text-ink hover:bg-white/60' : 'text-muted hover:bg-white/60'}`}>
                  <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ease-smooth transition-colors ${on ? 'bg-brand text-white' : ok ? 'bg-ink text-white' : 'bg-black/10 text-muted'}`}>{ok ? <Check size={11} strokeWidth={3} /> : i + 1}</span>
                  <span className="truncate">{tr(i1, e1)}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* corpo: anteprima (sempre della stessa grandezza) e passo */}
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto lg:flex lg:overflow-hidden">
          <div className="flex shrink-0 justify-center px-4 pb-1 pt-4 [contain:paint] [transform:translateZ(0)] lg:w-[464px] lg:items-start lg:overflow-y-auto lg:px-8 lg:py-6">{preview}</div>
          <div ref={stepRef} className="min-w-0 flex-1 px-4 pb-6 pt-3 sm:px-6 lg:overflow-y-auto lg:py-6 lg:pl-2 lg:pr-8">
            <div key={stepIx} className="blur-in">{[stepSocial, stepFoto, stepGrafica, stepTesto, stepVideo][stepIx]}</div>
          </div>
        </div>

        {/* piede: Indietro e Avanti; all'ultimo passo Condividi (il social o il video che si guarda) e Scarica tutto, il principale */}
        <div className="flex shrink-0 items-center gap-2 border-t border-line px-4 py-3 sm:px-6" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <button type="button" onClick={() => goStep(Math.max(0, stepIx - 1))} disabled={!stepIx} aria-label={tr('Indietro', 'Back')} className={`${btn} px-4 text-ink hover:bg-canvas disabled:invisible`}><ArrowLeft size={16} /> <span className="hidden sm:inline">{tr('Indietro', 'Back')}</span></button>
          <div className={stepIx < 3 ? 'flex-1' : 'hidden flex-1 sm:block'} />
          {stepIx < 3 ? (
            <button type="button" onClick={() => goStep(stepIx + 1)} disabled={!canNext} className={`${btn} min-w-[140px] bg-ink text-white hover:bg-brand`}>{tr('Avanti', 'Next')} <ArrowRight size={16} /></button>
          ) : (
            <>
              <button type="button" onClick={() => void share()} disabled={(shareVideo ? false : !allReady) || !!busy} className={`${btn} flex-1 bg-canvas px-4 text-ink hover:bg-line sm:flex-none sm:px-6`}>{busy === 'share' ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />} {shareVideo ? tr('Condividi video', 'Share video') : <span>{tr('Condividi', 'Share')}<span className="hidden sm:inline"> {tr('su', 'on')} {net.label}</span></span>}</button>
              <button type="button" onClick={() => void downloadAll()} disabled={!ready || !!busy} className={`${btn} flex-1 bg-ink px-4 text-white hover:bg-brand sm:min-w-[180px] sm:flex-none sm:px-6`}>{busy === 'all' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} {dlAll}</button>
            </>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
