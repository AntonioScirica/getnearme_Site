'use client';

// Scheda immobile, "Condividi sui social" (05/10/2026; rifatto "facilissimo" il 06/10/2026 per agenti 55-70 anni): sei passi,
// 1 Cosa pubblichi (casa in vendita/affitto o venduta/affittata, chiesto una volta: vale per grafiche, testi e video),
// 2 Dove (uno o piu' social, per ognuno il tipo di post in un segmentato gia' su "Una foto"), 3 Foto (per social, toccate nell'ordine,
// "Sistema la foto" sotto l'anteprima), 4 Grafica (per social, adattata a ogni formato). Foto e grafica scelte su un social valgono
// per tutti quelli non ancora toccati a mano; Avanti manuale, il bottone dice cosa manca. 5 Testo (gia' scritto per ogni
// social, lib/socialRules), 6 Video facoltativo: post animato gratis
// (la grafica che si muove, nel browser) o solo le foto, poi Pubblica su ... o Salva. Il video a crediti (api/platform/video-reel)
// e' uscito dal popup il 06/10/2026: resta nella chat.
// Niente misure ne' parole tecniche a schermo. Anteprima a sinistra in un riquadro fisso, il post ci sta dentro in ogni formato.
// Le grafiche sono quelle dei post della vecchia dashboard GetNearMe
// (components/dashboard/templates: renderTemplate + exporter) con i dati veri dell'immobile, il logo e il colore
// dell'agenzia (gli stessi di BrandCard, api/platform/site); il testo lo scrive l'AI per ogni social (api/platform/social-caption).
// Le grafiche restano in Poppins: sono il marchio dell'agente, non il nostro.
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowLeft, ArrowRight, BadgeCheck, Check, ChevronLeft, ChevronRight, Clapperboard, Copy, Crop, Download, Facebook, GalleryHorizontalEnd, House, Image as ImageIcon, Instagram, Linkedin, Loader2, MessageCircle, Maximize2, Minimize2, Music2, RectangleVertical, RotateCcw, Share2, Smartphone, Sparkles, Square, X, ZoomIn, ZoomOut } from 'lucide-react';
import { renderTemplate, TEMPLATES as POST_TEMPLATES } from '@/components/dashboard/templates/index.js';
import { ANIMATION_STYLES, exportStaticToVideo, exportToPng } from '@/components/dashboard/templates/exporter.js';
import '@/components/dashboard/templates/styles.css';
import { isClosed, statusOf, STATUS_LABELS, zoneOnly } from '@/lib/siteTemplates';
import type { ProjectData } from '@/lib/projects';
import { countChars, ruleOf } from '@/lib/socialRules';
import { authFetch, portfolioUrl } from './api';
import { pageLang, tr } from './i18n';

type Safe = { top: number; bottom: number; left: number; right: number };
type Size = { w: number; h: number; safe: Safe };
// kind: come lo vede l'agente, senza misure: una foto, piu' foto da sfogliare, verticale (storie e stati)
type Fmt = { id: string; label: string; kind: 'one' | 'many' | 'tall'; ratio: string; w: number; h: number; safe: Safe; multi?: boolean; pdf?: boolean };
type NetId = 'instagram' | 'facebook' | 'whatsapp' | 'tiktok' | 'linkedin';
const M60: Safe = { top: 60, bottom: 60, left: 60, right: 60 };
const kindOf = (x: Partial<Fmt>, tall: boolean): Fmt['kind'] => (x.multi ? 'many' : tall ? 'tall' : 'one');
const f45 = (id: string, label: string, x: Partial<Fmt> = {}): Fmt => ({ id, label, kind: kindOf(x, false), ratio: '4:5', w: 1080, h: 1350, safe: M60, ...x });
const f11 = (id: string, label: string, x: Partial<Fmt> = {}): Fmt => ({ id, label, kind: kindOf(x, false), ratio: '1:1', w: 1080, h: 1080, safe: M60, ...x });
const f916 = (id: string, label: string, top: number, bottom: number, x: Partial<Fmt> = {}): Fmt => ({ id, label, kind: kindOf(x, true), ratio: '9:16', w: 1080, h: 1920, safe: { top, bottom, left: 0, right: 0 }, ...x });
// formati e misure di ogni social; nei 9:16 la safe area lascia libere le scritte del social (nome in alto, risposta in basso).
// Il primo di ogni social e' "Una foto", gia' scelto; gli altri tipi si scelgono dal segmentato del passo Dove, sempre in vista.
// Ordine (06/10/2026, panel agenti 55-70): prima i social che usano di piu'; nei tipi "Più foto" sempre per ultimo a destra
const NETS: { id: NetId; label: string; fmts: Fmt[] }[] = [
  { id: 'facebook', label: 'Facebook', fmts: [f45('post', 'Post'), f11('square', 'Quadrata'), f916('story', 'Storia', 225, 275), f11('carousel', 'Carosello', { multi: true })] },
  // WhatsApp (06/10/2026): solo lo Stato verticale, niente scelta del tipo al passo Dove
  { id: 'whatsapp', label: 'WhatsApp', fmts: [f916('status', 'Stato', 250, 250)] },
  { id: 'instagram', label: 'Instagram', fmts: [f45('post', 'Post'), f11('square', 'Quadrata'), f916('story', 'Storia o Reel', 200, 300), f45('carousel', 'Carosello', { multi: true })] },
  // TikTok e' tutto verticale: la sua "una foto" e' gia' 9:16
  { id: 'tiktok', label: 'TikTok', fmts: [f916('photo', 'Foto', 200, 340, { kind: 'one' }), f916('carousel', 'Carosello', 200, 340, { multi: true })] },
  { id: 'linkedin', label: 'LinkedIn', fmts: [f11('post', 'Post'), f45('doc', 'Carosello', { multi: true, pdf: true })] },
];
const MAX_PHOTOS = 9; // + la slide dei contatti = 10, il massimo dei caroselli
// grafiche senza foto a tutto schermo (la foto sta in una cornice): niente "riempi"
const NO_COVER = ['arch', 'split', 'frame', 'spotlight', 'before-after', 'gallery', 'tips'];
// grafiche che in un formato non reggono (testo o foto tagliati): si nascondono invece di deformarle
// (provate il 06/10/2026 con titoli lunghi: Fascia e Fascia Alt nel quadrato coprono il titolo, nel 9:16 restano mezze vuote)
const NO_FIT: Record<string, string[]> = { '1:1': ['topbar', 'topbar-alt'], '9:16': ['topbar', 'topbar-alt'] };
// nomi delle grafiche Venduto/Affittato detti come si vedono (06/10/2026)
const TPL_NAME: Record<string, [string, string]> = { 'sold-stamp': ['Timbro rosso', 'Red stamp'], 'sold-elegant': ['Scritta elegante', 'Elegant script'], 'sold-classic': ['Scritta semplice', 'Simple lettering'] };
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
// ---------- post animato (passo Video, gratis, tutto nel browser) ----------
// La grafica diventa un video: exporter.exportStaticToVideo (lo stesso della vecchia dashboard GetNearMe, 15 s, MP4 o WebM).
// L'anteprima e' la grafica VERA con le scritte che entrano in CSS, con gli stessi movimenti, ordine e ritmo dell'esportazione
// (exporter: si parte a 0,4 s, una ogni 0,18 s, 0,5 s ciascuna); un pannello di vetro entra insieme alle sue scritte.
// translate/scale e non transform: le rotazioni delle grafiche (timbro Venduto) restano.
const ANIM_SEC = 15;
const ANIM_EN: Record<string, string> = { 'slide-up': 'Slide up', fade: 'Fade', scale: 'Grow', 'slide-right': 'Side', drop: 'Drop', 'zoom-out': 'Zoom', bounce: 'Bounce', diagonal: 'Diagonal' };
const AP_CSS = `
.ap-run .ap-el{animation-duration:4.2s;animation-iteration-count:infinite;animation-fill-mode:both;animation-timing-function:cubic-bezier(.22,1,.36,1)}
@keyframes ap-slide-up{0%,4%{opacity:0;translate:0 30px}16%,70%{opacity:1;translate:0 0}82%,100%{opacity:0;translate:0 0}}
@keyframes ap-fade{0%,4%{opacity:0}16%,70%{opacity:1}82%,100%{opacity:0}}
@keyframes ap-scale{0%,4%{opacity:0;scale:.8}16%,70%{opacity:1;scale:1}82%,100%{opacity:0;scale:1}}
@keyframes ap-slide-right{0%,4%{opacity:0;translate:-40px 0}16%,70%{opacity:1;translate:0 0}82%,100%{opacity:0;translate:0 0}}
@keyframes ap-drop{0%,4%{opacity:0;translate:0 -50px}11%{opacity:1;translate:0 0}13.5%{translate:0 5px}16%,70%{opacity:1;translate:0 0}82%,100%{opacity:0;translate:0 0}}
@keyframes ap-zoom-out{0%,4%{opacity:0;scale:1.4}16%,70%{opacity:1;scale:1}82%,100%{opacity:0;scale:1}}
@keyframes ap-bounce{0%,4%{opacity:0;translate:0 60px}10%{opacity:1;translate:0 0}13%{translate:0 9px}15%{translate:0 -3px}16%,70%{opacity:1;translate:0 0}82%,100%{opacity:0;translate:0 0}}
@keyframes ap-diagonal{0%,4%{opacity:0;translate:-30px 30px}16%,70%{opacity:1;translate:0 0}82%,100%{opacity:0;translate:0 0}}
${ANIMATION_STYLES.map((a: { id: string }) => `.ap--${a.id} .ap-el{animation-name:ap-${a.id}}`).join('\n')}
@media (prefers-reduced-motion: reduce){.ap-run .ap-el{animation:none}}`;
function animCss() {
  if (document.getElementById('ap-css')) return;
  const st = document.createElement('style'); st.id = 'ap-css'; st.textContent = AP_CSS; document.head.appendChild(st);
}
// scritte della grafica nell'ordine dell'exporter (addRect), ognuna dentro il suo pannello di vetro se c'e'
function markAnim(el: HTMLElement) {
  const q = (s: string) => Array.from(el.querySelectorAll<HTMLElement>(s));
  const list = [...q('.tpl-photo'), ...q('.tpl-label'), ...q('.tpl-bar'), ...q('.tpl-badge').filter(b => !b.closest('.tpl-bar')),
    ...['.tpl-price', '.tpl-title', '.tpl-address', '.tpl-metrics-inline'].flatMap(s => q(s).slice(0, 1)), ...q('.tpl-metric-card, .tpl-metric-pill'),
    ...['.tpl-desc', '.tpl-btn', '.tpl-logo-overlay'].flatMap(s => q(s).slice(0, 1))];
  const seen = new Set<HTMLElement>();
  let i = 0;
  for (const x of list) {
    const t = (x.parentElement?.closest<HTMLElement>('.tpl-glass-panel') ?? x);
    if (!el.contains(t) || seen.has(t) || [...seen].some(o => o.contains(t))) continue;
    seen.add(t); t.classList.add('ap-el'); t.style.animationDelay = `${(0.4 + i++ * 0.18).toFixed(2)}s`;
  }
}
// MediaRecorder sul canvas: manca su alcuni Safari per iPhone, li' la scelta non compare
function canAnimate() {
  try {
    return typeof MediaRecorder === 'function' && typeof HTMLCanvasElement.prototype.captureStream === 'function'
      && ['video/mp4', 'video/webm'].some(t => MediaRecorder.isTypeSupported(t));
  } catch { return false; }
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
    markAnim(el);
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
    if (b.badge || b.logo) el.appendChild(css(box(), { position: 'absolute', left: '0', right: '0', top: '0', height: '260px', background: 'linear-gradient(rgba(0,0,0,.35), rgba(0,0,0,0))', zIndex: '1' }));
    if (b.badge) { // senza badge (e numero): la foto prima di scegliere la grafica
      const badge = css(box(), { position: 'absolute', top: ins.t + 'px', left: ins.l + 'px', zIndex: '5', background: b.accent, color: '#fff', fontSize: '28px', fontWeight: '600', lineHeight: '28px', padding: '12px 24px', borderRadius: '8px', textTransform: 'uppercase', letterSpacing: '1px' });
      badge.className = 'tpl-badge'; badge.textContent = b.badge;
      el.appendChild(badge);
    }
    if (b.logo) {
      const lg = css(box('img') as HTMLImageElement, { position: 'absolute', top: (ins.t - 6) + 'px', right: ins.r + 'px', height: '64px', maxWidth: '260px', objectFit: 'contain', zIndex: '5' }) as HTMLImageElement;
      lg.className = 'tpl-logo-overlay'; lg.src = b.logo; lg.alt = '';
      el.appendChild(lg);
    }
    if (b.total > 1) numberPill(el, b, true);
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
      {!ok && <div className="absolute inset-0 animate-pulse bg-black/[.11]" />}
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
      <div ref={pulse} className="absolute inset-0 animate-pulse bg-black/[.11]" />
      <div ref={ref} className="absolute inset-0" />
    </div>
  );
}

// riga di linguette con l'indicatore bianco che scorre sotto quella attiva (misurata dopo il disegno)
function TabRow({ ids, on, deps, children }: { ids: string[]; on: string; deps: string; children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  // l'indicatore si sposta sul DOM (niente stato): la prima volta senza animazione, poi scorre e si allarga
  useLayoutEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-tab="${on}"]`), b = bar.current;
    if (!el || !b) return;
    const first = b.style.opacity !== '1';
    if (first) b.style.transition = 'none';
    b.style.width = `${el.offsetWidth}px`; b.style.transform = `translateX(${el.offsetLeft}px)`; b.style.opacity = '1';
    if (first) requestAnimationFrame(() => { b.style.transition = ''; });
  }, [on, ids.join(','), deps]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div ref={ref} className="relative flex max-w-full flex-nowrap items-center gap-0.5 self-center rounded-full bg-canvas p-1" role="tablist">
      <span ref={bar} aria-hidden className="absolute bottom-1 left-0 top-1 rounded-full bg-white opacity-0 shadow-sm ease-smooth transition-[transform,width] motion-reduce:transition-none" />
      {children}
    </div>
  );
}

// bottone che cambia larghezza col testo (600ms): misura il contenuto e anima la larghezza
function GrowButton({ children, className, ...rest }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const inner = useRef<HTMLSpanElement>(null);
  const [w, setW] = useState<number | null>(null);
  useLayoutEffect(() => { const el = inner.current; if (el && el.offsetWidth !== w) setW(el.offsetWidth); });
  return (
    <button {...rest} className={`${className ?? ''} max-w-full overflow-hidden transition-[width,background-color,color] motion-reduce:transition-none`} style={w ? { width: w + 48 } : undefined}>
      <span ref={inner} className="flex items-center gap-2 whitespace-nowrap">{children}</span>
    </button>
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
          <span className="block truncate text-xs text-muted">{tr('Foto pronte per i social, col tuo logo', 'Photos ready for social media, with your logo')}</span>
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
// Ogni apertura riparte da zero (06/10/2026, richiesta utente): passo 1, Facebook "Alta", foto e grafica di partenza, nessuna
// scelta al passo Video. Sul dispositivo resta solo la cache dei testi scritti dall'AI (agenteimmo:social-text:*), per non
// riscriverli; le chiavi delle scelte di prima si cancellano all'apertura.
const OLD_KEYS = ['agenteimmo:social-choice', 'agenteimmo:social-sold:', 'agenteimmo:social-photos:', 'agenteimmo:social-frames:', 'agenteimmo:social-video:', 'agenteimmo:social-vphotos:', 'agenteimmo:social-anim'];
function dropOldKeys() {
  try {
    const ks: string[] = [];
    for (let i = 0; i < localStorage.length; i++) { const k = localStorage.key(i); if (k && OLD_KEYS.some(o => k === o || (o.endsWith(':') && k.startsWith(o)))) ks.push(k); }
    ks.forEach(k => localStorage.removeItem(k));
  } catch { /* niente storage */ }
}
const netOf = (id: NetId) => NETS.find(n => n.id === id) ?? NETS[0]; // mai undefined (id sconosciuto: il primo social)
// 06/10/2026 (panel agenti 55-70): Cosa pubblichi (annuncio o venduto, una volta sola), Dove, Foto, Grafica, Testo, Video (facoltativo)
const STEPS: [string, string][] = [['Cosa', 'What'], ['Dove', 'Where'], ['Foto', 'Photos'], ['Grafica', 'Design'], ['Testo', 'Text'], ['Video', 'Video']];
const S = { cosa: 0, dove: 1, foto: 2, grafica: 3, testo: 4, video: 5 } as const;
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

// tipo di post detto semplice, con la sua icona (niente misure)
// l'icona mostra la forma (06/10/2026): Alta, Quadrata, Verticale, Più foto
const fmtIcon = (f: Fmt) => (f.multi ? GalleryHorizontalEnd : f.ratio === '1:1' ? Square : f.ratio === '9:16' ? Smartphone : RectangleVertical);
const kindShort = (k: Fmt['kind']) => (k === 'one' ? tr('Una foto', 'One photo') : k === 'many' ? tr('Più foto', 'More photos') : tr('Verticale', 'Vertical'));
// spiegazione breve, solo sotto la scelta fatta
const kindHint = (k: Fmt['kind']) => (k === 'many' ? tr('Da sfogliare col dito', 'To swipe through') : k === 'tall' ? tr('Per Storie e Stati', 'For Stories and Status') : '');
// due foto singole nello stesso social (4:5 e 1:1): si chiamano per forma, "Alta" e "Quadrata"
const fmtShort = (fs: Fmt[], f: Fmt) => (f.kind === 'one' && fs.filter(x => x.kind === 'one').length > 1 ? (f.ratio === '1:1' ? tr('Quadrata', 'Square') : tr('Alta', 'Tall')) : kindShort(f.kind));
const fmtHint = (fs: Fmt[], f: Fmt) => (f.kind === 'one' && fs.filter(x => x.kind === 'one').length > 1 ? (f.ratio === '1:1' ? tr('Per la bacheca', 'For the feed') : tr('Per la bacheca, prende più spazio', 'For the feed, takes more room')) : kindHint(f.kind));

function SocialShare({ project, photos: srcs, onClose }: { project: ProjectData; photos: string[]; onClose: () => void }) {
  const d = (project.import_data ?? {}) as { details?: Record<string, unknown>; prima?: Record<string, string>; rooms?: Record<string, { scene?: string }> };
  const det = d.details ?? {};
  const prima = d.prima ?? {};
  // Venduto o affittato: chiesto al passo "Cosa pubblichi?", niente di gia' scelto (06/10/2026: ogni passo vuole una scelta,
  // tranne il Video); se la scheda e' venduta o affittata "Casa venduta o affittata" ha l'etichetta Consigliato.
  // Acceso: grafiche Venduto/Affittato, testo che racconta il lavoro fatto. Giorni: facoltativi, proposti dalla data del cambio di stato
  const status0 = statusOf({ details: det });
  useState(dropOldKeys); // una volta, all'apertura
  const [soldPick, setSoldPick] = useState<boolean | null>(null);
  const soldOn = soldPick === true;
  const [soldKind, setSoldKind] = useState<'venduto' | 'affittato'>(() => (status0 === 'affittato' || (status0 !== 'venduto' && (det.contratto === 'Affitto' || /affitt/i.test(`${project.titolo ?? ''} ${project.tipologia ?? ''}`))) ? 'affittato' : 'venduto'));
  const [soldDays, setSoldDays] = useState(() => {
    const a = Date.parse(String(det.stato_annuncio_data ?? '')), b = Date.parse(project.createdAt ?? '');
    const n = isClosed(status0) && a && b ? Math.round((a - b) / 86_400_000) : 0;
    return n >= 1 && n <= 730 ? String(n) : '';
  });
  const [brand, setBrand] = useState<Brand | null>(null);
  const [logo, setLogo] = useState<{ url: string | null; h: boolean } | null>(null);
  const [fonts, setFonts] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [scanned, setScanned] = useState(0); // foto gia' guardate, nell'ordine (anche quelle che non si aprono)
  // foto scelte (src) per social, nell'ordine; la prima e' la copertina (06/10/2026: una foto diversa per ogni social).
  // shared: la scelta comune, vale per i social non ancora toccati a mano; own: i social cambiati stando su di loro.
  // Ogni tocco cambia il social in anteprima (diventa suo) e anche la scelta comune, quindi tutti quelli non ancora toccati.
  const [shared, setShared] = useState<string[]>([]);
  const [own, setOwn] = useState<Partial<Record<NetId, string[]>>>({});
  // inquadratura di ogni foto (solo per questa apertura)
  const [frames, setFrames] = useState<Record<string, Frame>>({});
  const frameFor = (src: string): Frame => frames[src] ?? FRAME0;
  const [nets, setNets] = useState<NetId[]>([]); // nessun social gia' scelto
  const [fmtIds, setFmtIds] = useState<Partial<Record<NetId, string>>>({});
  const [active, setActive] = useState<NetId>('facebook');
  const [stepIx, setStepIx] = useState(0);
  const [reached, setReached] = useState(0);
  const fmtOf = (n: NetId) => { const N = netOf(n); return N.fmts.find(f => f.id === fmtIds[n]) ?? N.fmts[0]; };
  const net = netOf(active);
  const fmt = fmtOf(active);
  
  const toggleNet = (id: NetId) => {
    if (nets.includes(id)) {
      const rest = nets.filter(x => x !== id);
      setNets(rest);
      if (active === id && rest.length) { setActive(rest[0]); setSlideIx(0); }
    } else { setNets(NETS.map(n => n.id).filter(x => x === id || nets.includes(x))); setActive(id); setSlideIx(0); }
  };
  const pickFmt = (n: NetId, f: string) => { setFmtIds(o => ({ ...o, [n]: f })); setActive(n); setSlideIx(0); };
  const show = (n: NetId) => { setActive(n); setSlideIx(0); };
  const goStep = (i: number) => { setStepIx(i); setFixOpen(false); setReached(r => Math.max(r, i)); bodyRef.current?.scrollTo({ top: 0 }); stepRef.current?.scrollTo({ top: 0 }); };
  // passo Cosa (scelta singola): scelto, si va avanti da soli dopo un attimo. Foto e Grafica no: si sceglie per ogni social
  const autoNext = () => { const from = stepIx; setTimeout(() => goStep(from + 1), 450); };
  // grafica per social, come le foto (06/10/2026): nessuna finche' non la tocca. tplShared vale per i social non ancora
  // toccati a mano, tplOwn per quelli cambiati stando su di loro; ogni tocco cambia il social in anteprima e la scelta comune
  const [tplShared, setTplShared] = useState<string | null>(null);
  const [tplOwn, setTplOwn] = useState<Partial<Record<NetId, string>>>({});
  const tplOf = (n: NetId) => tplOwn[n] ?? tplShared;
  const tplChosen = (n: NetId) => tplOf(n) !== null;
  // "Casa venduta o affittata": le grafiche Venduto davanti; cambiando, una grafica dell'altro tipo va scelta di nuovo
  const setSold = (on: boolean) => {
    setSoldPick(on);
    const keep = (t: string | null | undefined) => !!t && t.startsWith('sold-') === on;
    setTplShared(t => (keep(t) ? t : null));
    setTplOwn(o => Object.fromEntries(Object.entries(o).filter(([, t]) => keep(t))));
  };
  const [fixOpen, setFixOpen] = useState(false); // "Sistema la foto": Riempi/Intera, zoom, trascinare
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
  const [vp, setVp] = useState(() => ({ w: window.innerWidth, h: window.innerHeight })); // subito la misura vera: niente salto all'apertura
  const bodyRef = useRef<HTMLDivElement>(null);
  const stepRef = useRef<HTMLDivElement>(null);
  const [gridRef, gridW] = useWidth<HTMLDivElement>();
  const [animGridRef, animGridW] = useWidth<HTMLDivElement>();

  useEffect(() => {
    const on = () => setVp({ w: window.innerWidth, h: window.innerHeight });
    on(); window.addEventListener('resize', on);
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    const o = document.body.style.overflow; document.body.style.overflow = 'hidden';
    // il bottone Feedback (Writhink) copre i bottoni del popup sul telefono: nascosto finche' il popup e' aperto (globals.css)
    document.body.classList.add('gnm-hide-feedback');
    return () => { window.removeEventListener('resize', on); window.removeEventListener('keydown', k); document.body.style.overflow = o; document.body.classList.remove('gnm-hide-feedback'); };
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
  // foto di un social: la sua scelta o quella comune; a una foto la prima, con "Più foto" fino a 9 (nessuna foto gia' scelta)
  const srcsOf = (n: NetId) => { const l = own[n] ?? shared; return fmtOf(n).multi ? l.slice(0, MAX_PHOTOS) : l.slice(0, 1); };
  const photosFor = (n: NetId): Photo[] => srcsOf(n).map(s => photos.find(p => p.src === s)).filter((p): p is Photo => !!p);
  const anyMulti = nets.some(n => fmtOf(n).multi);
  const slidesPhotos = photosFor(active);
  const photo = slidesPhotos[0] as Photo | undefined;
  // la griglia segue il social in anteprima: con "Più foto" numeri e ordine, con una foto sola una spunta sola
  const gridMulti = !!fmt.multi;
  const gridSel = slidesPhotos; // numeri e spunte nella griglia delle foto
  // ogni social scelto ha le sue foto: almeno 1, con "Più foto" almeno 2
  const photoOk = (n: NetId) => photosFor(n).length >= (fmtOf(n).multi ? 2 : 1);
  // le foto che servono all'anteprima sono arrivate (le scelte, e almeno 3 per le grafiche con piu' foto): prima uno scheletro,
  // poi UN solo disegno (niente post che cambia a ogni foto che arriva)
  const upto = Math.min(srcs.length, 24);
  const seen = (src: string) => { const i = srcs.indexOf(src); return i < 0 || i >= upto || i < scanned; };
  const photosSettled = scanned >= upto || (scanned >= Math.min(anyMulti ? 5 : 3, upto) && nets.flatMap(srcsOf).every(seen));
  // tocco su una foto: cambia il social in anteprima (da qui e' suo) e la scelta comune, cioe' tutti i social non ancora toccati.
  // Da una foto sola la scelta comune cambia solo la copertina (gia' nel carosello: va prima; se no prende il posto della prima),
  // le altre foto del carosello restano; da "Più foto" la scelta comune diventa la lista intera (a una foto vale la prima)
  const tap = (src: string) => {
    const curL = srcsOf(active);
    const next = !gridMulti ? [src] : curL.includes(src) ? curL.filter(x => x !== src) : curL.length >= MAX_PHOTOS ? curL : [...curL, src];
    setOwn(o => ({ ...o, [active]: next }));
    setShared(s => (gridMulti ? next : s.includes(src) ? [src, ...s.filter(x => x !== src)] : [src, ...s.slice(1)]));
  };
  const restart = () => { setOwn(o => ({ ...o, [active]: [] })); setShared([]); };
  const needBlur = [...new Set(nets.flatMap(photosFor))];
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
  // (le foto sono quelle del social: ognuno puo' avere le sue)
  const othersFor = (n: NetId) => (fmtOf(n).multi ? photosFor(n).slice(1) : photos.filter(p => p !== photosFor(n)[0]));
  const fits = (id: string, n: NetId) => id !== 'tips' && id !== 'frame' && !(NO_FIT[fmtOf(n).ratio] ?? []).includes(id) && (soldOn || !id.startsWith('sold-'))
    && (id !== 'gallery' || othersFor(n).length >= 2) && (id !== 'before-after' || !!photosFor(n)[0]?.original);
  // acceso Venduto: prima le sue grafiche, poi quelle dell'annuncio
  const tplsFor = (n: NetId) => POST_TEMPLATES.filter(t => fits(t.id, n)).sort((a, b) => Number(b.id.startsWith('sold-')) - Number(a.id.startsWith('sold-')));
  // la grafica scelta per quel social, o la piu' simile se nel suo formato (o con le sue foto) non regge
  const tplFor = (n: NetId) => {
    const tplId = tplOf(n) ?? (soldOn ? 'sold-stamp' : 'gradient'); // di riserva per i conti interni
    if (fits(tplId, n)) return tplId;
    return (SIMILAR.find(g => g.includes(tplId)) ?? []).find(id => fits(id, n)) ?? tplsFor(n)[0]?.id ?? 'gradient';
  };
  const tplLabel = (id: string) => (TPL_NAME[id] ? tr(...TPL_NAME[id]) : POST_TEMPLATES.find(t => t.id === id)?.label ?? id);
  const swaps = nets.filter(n => tplChosen(n) && tplFor(n) !== tplOf(n)).map(n => ({ n, from: tplOf(n)!, to: tplFor(n) }));
  const all = tplsFor(active);
  const cur = tplChosen(active) ? tplFor(active) : null;
  const ready = fonts && !!logo && !!brand && photosSettled;
  // copertina: la grafica (Prima e Dopo: la prima foto e' l'originale, la seconda quella arredata)
  const cover = (id: string, small: boolean, n: NetId): Tpl | null => {
    const f = fmtOf(n), ph = photosFor(n)[0];
    if (!ready || !ph) return null;
    const blur = blurs[small ? ph.small : ph.full];
    if (!blur) return null;
    const main = id === 'before-after' && ph.original ? ph.original : small ? ph.small : ph.full;
    const extra = id === 'before-after' ? [small ? ph.small : ph.full] : id === 'gallery' ? othersFor(n).slice(0, 2).map(p => (small ? p.small : p.full)) : undefined;
    const fr = NO_COVER.includes(id) ? null : frameFor(ph.src);
    return { kind: 'tpl', tpl: id, data, photo: main, size: { w: f.w, h: f.h, safe: f.safe }, blur, logo: logo!.url, logoH: logo!.h, staged: ph.staged && label, photos: extra, fit: autoFit(id, f.h, fr ?? undefined), frame: fr };
  };
  // carosello: copertina, poi le altre foto pulite, in fondo i contatti
  const facts = [price, [project.mq ? `${project.mq} m²` : '', project.locali ? `${project.locali} ${tr('locali', 'rooms')}` : '', project.bagni ? `${project.bagni} ${project.bagni === 1 ? tr('bagno', 'bathroom') : tr('bagni', 'bathrooms')}` : ''].filter(Boolean).join(', '), addr].filter(Boolean);
  const slidesFor = (n: NetId): (Slide | null)[] => {
    const f = fmtOf(n), size: Size = { w: f.w, h: f.h, safe: f.safe }, ps = photosFor(n);
    // prima della grafica: le foto scelte e basta (senza scritte, logo e numero), "Sistema la foto" funziona gia'
    if (!tplChosen(n)) return ps.map((p, i) => (blurs[p.full] && ready ? { kind: 'plain', photo: p.full, size, blur: blurs[p.full], logo: null, accent, badge: '', staged: p.staged && label, n: i + 1, total: 1, fit: autoFit(null, f.h, frameFor(p.src)), frame: frameFor(p.src) } : null));
    const firstSlide = cover(tplFor(n), false, n);
    if (!f.multi) return [firstSlide];
    if (!ps.length) return [];
    const total = ps.length + 1;
    const rest: (Slide | null)[] = ps.slice(1).map((p, i) => (blurs[p.full] && ready ? { kind: 'plain', photo: p.full, size, blur: blurs[p.full], logo: logo!.url, accent, badge: contract, staged: p.staged && label, n: i + 2, total, fit: autoFit(null, f.h, frameFor(p.src)), frame: frameFor(p.src) } : null));
    const last: Slide | null = ready ? { kind: 'contact', size, logo: logo!.url, accent, brand: brand!, lines: facts, n: total, total } : null;
    return [firstSlide, ...rest, last];
  };
  const keyFor = (n: NetId) => { const f = fmtOf(n), ps = photosFor(n); return JSON.stringify([n, f.id, tplChosen(n) ? tplFor(n) : '-', ps.map(p => p.src), label, ready, accent, ps.map(p => !!blurs[p.full]), ps.map(p => frames[p.src] ?? null), status, soldDaysText, brand?.phone]); };
  const key = keyFor(active);
  const keySmall = JSON.stringify([fmt.w, fmt.h, photo?.small, label, ready, accent, !!blurs[photo?.small ?? ''], othersFor(active).slice(0, 2).map(p => p.src), all.length, frames[photo?.src ?? ''] ?? null, status, soldDaysText, brand?.phone]);
  const [big, setBig] = useState<(Slide | null)[]>([]);
  const [thumbs, setThumbs] = useState<Record<string, Tpl | null>>({});
  // oggetti stabili: si ridisegna solo quando cambia davvero qualcosa
  useEffect(() => { setBig(slidesFor(active)); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setThumbs(Object.fromEntries(all.map(t => [t.id, cover(t.id, true, active)]))); }, [keySmall]); // eslint-disable-line react-hooks/exhaustive-deps
  const nSlides = fmt.multi ? slidesPhotos.length + (slidesPhotos.length && tplChosen(active) ? 1 : 0) : 1;
  const six = Math.min(slideIx, Math.max(0, nSlides - 1));

  // testo del post, diverso per ogni social: uno per immobile e social (resta sul dispositivo), nei limiti del social
  // venduto e affittato hanno il loro testo (il lavoro fatto e l'invito a chi vende), l'annuncio resta com'era
  const tk = (n: NetId) => (soldOn ? `${n}:${soldKind}` : n);
  const tKey = (k: string) => `agenteimmo:social-text:${project.id}:${k}`;
  // in cache solo il testo dell'AI; le modifiche a mano valgono per questa apertura
  const putTextK = (k: string, t: string) => { setTexts(o => ({ ...o, [k]: t })); try { localStorage.setItem(tKey(k), t); } catch { /* niente storage */ } };
  const putText = (n: NetId, t: string) => setTexts(o => ({ ...o, [tk(n)]: t }));
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
    const r = await authFetch('/api/platform/social-caption', { method: 'POST', body: JSON.stringify({ fields, social: n }) }).catch(() => null);
    const j = r?.ok ? await r.json().catch(() => null) : null;
    setTextBusy(o => ({ ...o, [k]: false }));
    if (j?.testo) putTextK(k, j.testo);
    else setTextErr(o => ({ ...o, [k]: r?.status === 429 ? tr('Hai scritto molti testi oggi, riprova domani.', 'You wrote many texts today, try again tomorrow.') : tr('Non sono riuscito a scrivere il testo.', 'I could not write the text.') }));
  };
  // si scrivono quando servono: dalla grafica in poi (cosi' al passo Testo sono pronti), una volta per social
  useEffect(() => {
    if (!brand || stepIx < S.grafica) return;
    for (const n of nets) if (texts[tk(n)] === undefined && !textBusy[tk(n)] && !textErr[tk(n)]) void writeText(n);
  }, [brand, nets.join(','), stepIx >= S.grafica, soldOn, soldKind]); // eslint-disable-line react-hooks/exhaustive-deps
  const text = texts[tk(active)] ?? '';
  const copy = async (n: NetId) => { try { await navigator.clipboard.writeText(texts[tk(n)] ?? ''); setCopied(n); setTimeout(() => setCopied(c => (c === n ? null : c)), 2400); } catch { /* niente appunti */ } };

  const live = useRef(true);
  useEffect(() => { live.current = true; return () => { live.current = false; }; }, []);

  // ---- post animato: gratis, nel browser (exporter.exportStaticToVideo), uno per social, sulla grafica di quel social ----
  const [animOk] = useState(canAnimate);
  const [wantAnim, setWantAnim] = useState(false);
  const [saidNo, setSaidNo] = useState(false); // "No, salva le foto"

  const [animStyle, setAnimStyle] = useState('slide-up');
  type Anim = { key: string; file: File; url: string };
  const [anims, setAnims] = useState<Partial<Record<NetId, Anim>>>({});
  const [animRun, setAnimRun] = useState<{ n: NetId; i: number; of: number; p: number } | null>(null);
  const animAbort = useRef<AbortController | null>(null);
  useEffect(() => { animCss(); return () => animAbort.current?.abort(); }, []);
  // valido finche' grafica, foto, formato e stile restano quelli
  const animKey = (n: NetId) => `${keyFor(n)}|${animStyle}`;
  const animOf = (n: NetId) => { const a = anims[n]; return a && a.key === animKey(n) ? a : null; };

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
  // crea il post animato per i social che non l'hanno ancora (prima quello in anteprima), uno dopo l'altro: 15 s ciascuno
  const makeAnim = async () => {
    if (animRun || busy) return;
    const todo = [active, ...nets.filter(n => n !== active)].filter(n => !animOf(n));
    const ac = new AbortController(); animAbort.current = ac;
    setNote('');
    try {
      for (const [i, n] of todo.entries()) {
        const s = slidesFor(n)[0];
        if (!s || s.kind !== 'tpl') throw new Error('not_ready');
        const k = animKey(n);
        let last = -1;
        setAnimRun({ n, i, of: todo.length, p: 0 });
        const r = await mount(s, el => exportStaticToVideo(el, s.size, {
          duration: ANIM_SEC, animStyle, photoSrc: s.photo, fitCover: s.fit, frame: s.frame, signal: ac.signal,
          // l'avanzamento ridisegna il popup: solo ogni 2%, la registrazione resta fluida
          onProgress: (p: number) => { const q = Math.floor(p * 50); if (q !== last) { last = q; setAnimRun(o => (o && o.n === n ? { ...o, p } : o)); } },
        } as never) as Promise<{ blob: Blob; ext: string }>);
        if (!live.current || ac.signal.aborted) return;
        const file = new File([r.blob], `${title}-${nameOf(n)}-animato.${r.ext}`, { type: r.blob.type || `video/${r.ext}` });
        setAnims(o => { const old = o[n]; if (old) URL.revokeObjectURL(old.url); return { ...o, [n]: { key: k, file, url: URL.createObjectURL(file) } }; });
        console.info('[social] post animato', n, animStyle, r.ext, `${Math.round(file.size / 1024)} KB`);
      }
    } catch (e) {
      if ((e as Error).name !== 'AbortError') { console.error('social anim', e); setNote(tr('Non sono riuscito a creare il post animato, riprova.', 'I could not make the animated post, please try again.')); }
    }
    if (live.current) setAnimRun(null);
  };
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
    if (stepIx < S.testo || !allReady || busy) return;
    const t = setTimeout(() => { void getFiles(active).catch(() => null); }, 500);
    return () => clearTimeout(t);
  }, [stepIx, allReady, key]); // eslint-disable-line react-hooks/exhaustive-deps
  const share = async () => {
    if (busy) return;
    const n = active;
    // il testo si copia subito, prima di ogni attesa (gli appunti vogliono il tocco)
    if (text) void navigator.clipboard?.writeText(text).catch(() => null);
    setBusy('share'); setNote(nSlides > 1 ? tr(`Preparo ${nSlides} foto`, `Making ${nSlides} photos`) : '');
    try {
      const a = wantAnim ? animOf(n) : null; // post animato: si pubblica il video
      const files = a ? [a.file] : await getFiles(n);
      if (navigator.canShare?.({ files })) {
        try { await navigator.share({ files }); setDone(o => [...new Set([...o, n])]); setNote(text ? tr(`Il testo per ${net.label} è copiato, incollalo nel post.`, `The ${net.label} text is copied, paste it in the post.`) : ''); }
        catch (e) { if ((e as Error).name !== 'AbortError') throw e; setNote(''); }
      } else {
        // computer: niente condivisione di file, si scarica e il testo resta copiato
        if (files.length === 1) save(files[0], files[0].name);
        else await zipSave(files.map(f => ({ path: f.name, f })), `${title}-${nameOf(n)}.zip`);
        setDone(o => [...new Set([...o, n])]);
        const what = a ? tr('il video', 'the video') : tr('la foto', 'the photo');
        setNote(text ? tr(`Salvato e testo copiato. Ora apri ${net.label}, carica ${what} e incolla il testo.`, `Saved and text copied. Now open ${net.label}, upload ${what} and paste the text.`) : tr(`Salvato. Ora apri ${net.label} e carica ${what}.`, `Saved. Now open ${net.label} and upload ${what}.`));
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
        const a = wantAnim ? animOf(n) : null;
        if (a) items.push({ path: `${nm}-animato.${a.file.name.split('.').pop()}`, f: a.file });
      }
      console.info('[social] scarica tutto', nets.join(','), items.length, `${Math.round(items.reduce((a, x) => a + x.f.size, 0) / 1024)} KB`, `${Math.round(performance.now() - t0)} ms`);
      if (items.length === 1) { save(items[0].f, `${title}-${items[0].path}`); setNote(fmt.pdf ? tr('Salvato. Su LinkedIn caricalo come documento.', 'Saved. On LinkedIn upload it as a document.') : tr('Salvato.', 'Saved.')); }
      else {
        await zipSave(items, `${title}-social.zip`);
        const what = [...nets.map(n => netOf(n).label), ...(wantAnim && nets.some(n => animOf(n)) ? [tr('il post animato', 'the animated post')] : [])].join(', ');
        setNote(tr(`Salvato tutto in un file .zip: ${what}.`, `Everything saved in a .zip file: ${what}.`));
      }
    } catch (e) {
      console.error('social export', e);
      setNote(tr('Non sono riuscito a creare i file, riprova.', 'I could not create the files, please try again.'));
    }
    setBusy(null);
  };
  // misure: il riquadro dell'anteprima ha sempre la stessa grandezza, il post ci sta dentro (contain) in ogni formato
  const wide = vp.w >= 1024;
  const phoneUi = vp.w < 640; // telefono: testata "Passo 2 di 6", bottoni finali uno sotto l'altro
  const modalH = Math.min(vp.h * 0.94, 880);
  const boxW = wide ? 400 : Math.min(vp.w - 32, 420);
  const boxH = wide ? Math.max(320, Math.min(560, modalH - 330)) : Math.min(Math.round(vp.h * 0.36), 320);
  const cellW = gridW ? Math.floor((gridW - ((vp.w < 640 ? 2 : 3) - 1) * 12) / (vp.w < 640 ? 2 : 3)) : 0;
  const btn = 'flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 text-sm font-semibold outline-none ease-smooth transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 disabled:opacity-50';
  // una sola evidenziazione per scelta: l'anello col colore del marchio
  const chip = (on: boolean) => `bg-white text-ink outline-none ease-smooth transition-[box-shadow] focus-visible:ring-2 focus-visible:ring-brand/50 ${on ? 'shadow-sm ring-2 ring-brand' : 'ring-1 ring-black/10 hover:ring-black/25'}`;
  // ogni passo vuole una scelta (tranne Video): Avanti spento, sotto cosa manca; dalle linguette non si salta oltre il primo passo da fare
  const photoTodo = nets.find(n => !photoOk(n)); // il primo social senza le sue foto
  const tplTodo = nets.find(n => !tplChosen(n)); // il primo social senza grafica (quella comune vale)
  const stepOk = [soldPick !== null, nets.length > 0, !photoTodo, !tplTodo, true, true];
  const firstTodo = stepOk.indexOf(false);
  const canGo = (i: number) => firstTodo < 0 || i <= firstTodo;
  const canNext = stepOk[stepIx];
  const missing = [tr('Scegli cosa pubblichi', 'Choose what you post'), tr('Scegli almeno un social', 'Choose at least one network'),
    !photoTodo ? '' : !fmtOf(photoTodo).multi ? tr(`Scegli la foto per ${netOf(photoTodo).label}`, `Choose the photo for ${netOf(photoTodo).label}`)
      : photosFor(photoTodo).length ? tr(`Per ${netOf(photoTodo).label} scegli almeno 2 foto`, `For ${netOf(photoTodo).label} choose at least 2 photos`) : tr(`Scegli le foto per ${netOf(photoTodo).label}`, `Choose the photos for ${netOf(photoTodo).label}`),
    tplTodo ? tr(`Scegli la grafica per ${netOf(tplTodo).label}`, `Choose the design for ${netOf(tplTodo).label}`) : '', '', ''][stepIx];
  // testo del bottone Avanti finche' manca qualcosa (passi Foto e Grafica): quante foto mancano e per chi, prima il social in anteprima.
  // Telefono: una riga corta ("Ancora 1 foto, Instagram")
  const order = [active, ...nets.filter(n => n !== active)].filter(n => nets.includes(n));
  const lacks = order.map(n => ({ n, k: (fmtOf(n).multi ? 2 : 1) - photosFor(n).length })).filter(x => x.k > 0);
  const fotoK = (k: number) => (k === 1 ? tr('1 foto', '1 photo') : tr(`${k} foto`, `${k} photos`));
  const ctaTodo = stepIx === S.foto && lacks.length ? (phoneUi
    ? tr(`Ancora ${fotoK(lacks[0].k)}, ${netOf(lacks[0].n).label}${lacks.length > 1 ? ' e altri' : ''}`, `${fotoK(lacks[0].k)} more, ${netOf(lacks[0].n).label}${lacks.length > 1 ? ' and others' : ''}`)
    : tr(`Ancora ${fotoK(lacks[0].k)} per ${netOf(lacks[0].n).label}${lacks[1] ? `${lacks.length > 2 ? ',' : ' e'} ${lacks[1].k} per ${netOf(lacks[1].n).label}` : ''}${lacks.length > 2 ? ' e altri' : ''}`,
      `${fotoK(lacks[0].k)} more for ${netOf(lacks[0].n).label}${lacks[1] ? `${lacks.length > 2 ? ',' : ' and'} ${lacks[1].k} for ${netOf(lacks[1].n).label}` : ''}${lacks.length > 2 ? ' and others' : ''}`))
    : stepIx === S.grafica && tplTodo ? (() => { const n = order.find(x => !tplChosen(x)) ?? tplTodo; return phoneUi ? tr(`Grafica per ${netOf(n).label}`, `Design for ${netOf(n).label}`) : tr(`Scegli la grafica per ${netOf(n).label}`, `Choose the design for ${netOf(n).label}`); })()
    : '';
  const shown = big[six] ?? null;
  // telefono o computer, per dire "Salva sul telefono" solo dove e' vero
  const onPhone = vp.w < 1024 || (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches);
  // "Pubblica su" solo su telefono e tablet (condivisione del sistema coi file); al computer si salva e si carica a mano
  const canPublish = typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches && typeof navigator.share === 'function';
  const many = nets.length > 1 || (wantAnim && nets.some(n => animOf(n)));
  const saveLabel = many ? (onPhone ? tr('Salva tutto sul telefono', 'Save all to phone') : tr('Salva tutto sul computer', 'Save all to computer')) : onPhone ? tr('Salva sul telefono', 'Save to phone') : tr('Salva sul computer', 'Save to computer');

  // linguette dei social sopra l'anteprima: SEMPRE una riga. Se i nomi non entrano, le non attive solo icona (nome in title e
  // aria-label); l'indicatore bianco scorre e si allarga sotto quella attiva (600ms)
  const tabIds: string[] = nets;
  const tabName = (id: string) => netOf(id as NetId).label;
  const onTab = active;
  // stima della larghezza coi nomi (14px semibold ~8px a lettera, + icona, spazi e margini)
  const fullW = tabIds.reduce((a, id) => a + 16 + 6 + 24 + tabName(id).length * 8.2 + 4, 8);
  const compact = fullW > boxW;
  const tabs = tabIds.length > 1 ? (
    <TabRow ids={tabIds} on={onTab} deps={`${compact}|${boxW}`}>
      {tabIds.map(id => {
        const on = id === onTab, label = tabName(id), showName = !compact || on;
        // passi Foto e Grafica: pallino pieno se quel social ha la sua scelta (anche ereditata), vuoto se manca
        const mark = stepIx === S.foto ? (photoOk(id as NetId) ? 'ok' : 'todo') : stepIx === S.grafica ? (tplChosen(id as NetId) ? 'ok' : 'todo') : null;
        const what = stepIx === S.foto ? tr('foto', 'photo') : tr('grafica', 'design');
        const aria = !mark ? label : mark === 'ok' ? tr(`${label}, ${what} scelta`, `${label}, ${what} chosen`) : tr(`${label}, manca la ${what}`, `${label}, ${what} missing`);
        return (
          <button key={id} data-tab={id} type="button" role="tab" aria-selected={on} aria-label={aria} title={aria} onClick={() => show(id as NetId)}
            className={`relative z-[1] flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3 text-sm font-semibold outline-none ease-smooth transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 ${on ? 'text-ink' : 'text-muted hover:text-ink'}`}>
            <NetIcon id={id as NetId} size={16} />
            {showName && <span key={`${id}-${compact}`} className={compact ? 'blur-in' : ''}>{label}</span>}
            {mark && <span aria-hidden className={`absolute right-1.5 top-1.5 h-2 w-2 rounded-full ease-smooth transition-colors ${mark === 'ok' ? 'bg-brand' : 'border-[1.5px] border-ink/35'}`} />}
            {(done.includes(id as NetId) || (wantAnim && stepIx === S.video && !!animOf(id as NetId))) && <Check size={14} className="text-brand" strokeWidth={3} />}
          </button>
        );
      })}
    </TabRow>
  ) : null;

  // ---- inquadratura della foto che si guarda (passo Foto, dietro "Sistema la foto"): a tutto schermo o intera, zoom, trascinando ----
  // mentre si trascina o si muove lo zoom si cambia solo la foto gia' disegnata; il post si ridisegna una volta, a gesto finito
  const curPhoto: Photo | undefined = fmt.multi ? slidesPhotos[six] : slidesPhotos[0];
  const curFrame = shown ? frameOf(shown) : null;
  const canFix = !!curPhoto && !!curFrame && stepIx === S.foto;
  const framable = fixOpen && canFix;
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
  // "Sistema la foto": il bottone si allarga nel riquadro dei comandi (Riempi/Intera, zoom, a tutte), poi i comandi appaiono
  const fixer = canFix ? (
    <div className={`overflow-hidden bg-white shadow-sm ring-1 ring-black/10 ease-smooth transition-[border-radius] ${fixOpen ? 'w-full max-w-[400px] rounded-[24px] p-2' : 'rounded-full p-0'}`}>
      {!fixOpen ? (
        <button type="button" onClick={() => setFixOpen(true)} className="flex h-10 items-center gap-2 rounded-full px-4 text-sm font-semibold text-ink hover:bg-canvas"><Crop size={16} /> {tr('Sistema la foto', 'Adjust the photo')}</button>
      ) : (() => {
        const z = live2.current?.src === curPhoto!.src ? live2.current.f.z : fr.z;
        const setZ = (v: number) => setFrame(curPhoto!.src, { z: Math.min(3, Math.max(1, Math.round(v * 100) / 100)) });
        const seg = (on: boolean, fit: 'cover' | 'contain', Icon: typeof Crop, label: string) => (
          <button type="button" role="radio" aria-checked={on} onClick={() => setFrame(curPhoto!.src, { fit })}
            className={`flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full px-3 text-sm font-semibold ease-smooth transition-colors ${on ? 'bg-ink text-white' : 'text-ink/70 hover:text-ink'}`}><Icon size={15} /> {label}</button>
        );
        return (
          <div className="blur-in space-y-1">
            <div className="flex flex-wrap items-center justify-between gap-1">
              <div role="radiogroup" aria-label={tr('Come mostrare la foto', 'How to show the photo')} className="flex rounded-full bg-canvas p-1">
                {seg(curFit, 'cover', Maximize2, tr('Riempi', 'Fill'))}
                {seg(!curFit, 'contain', Minimize2, tr('Intera', 'Whole'))}
              </div>
              <button type="button" onClick={() => { commitFrame(); setFixOpen(false); }} className="flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-brand hover:bg-brand/10"><Check size={16} /> {tr('Fatto', 'Done')}</button>
            </div>
            <div className="flex items-center gap-1">
              <button type="button" onClick={() => setZ(z - 0.1)} disabled={z <= 1} aria-label={tr('Meno zoom', 'Zoom out')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink/70 hover:text-ink disabled:opacity-30"><ZoomOut size={16} /></button>
              <input type="range" min={1} max={3} step={0.01} defaultValue={fr.z} key={`${curPhoto!.src}-${fr.z}`} aria-label={tr('Zoom', 'Zoom')}
                onChange={e => frameLive(curPhoto!.src, { ...(live2.current?.src === curPhoto!.src ? live2.current.f : fr), z: Number(e.target.value) }, curFit)}
                onPointerUp={commitFrame} onKeyUp={commitFrame} className="h-10 min-w-0 flex-1 accent-[#537eec]" />
              <button type="button" onClick={() => setZ(z + 0.1)} disabled={z >= 3} aria-label={tr('Più zoom', 'Zoom in')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink/70 hover:text-ink disabled:opacity-30"><ZoomIn size={16} /></button>
              {changed && <button type="button" onClick={() => setFrames(o => { const c = { ...o }; delete c[curPhoto!.src]; return c; })} aria-label={tr('Ripristina', 'Reset')} title={tr('Ripristina', 'Reset')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-ink/70 hover:text-ink"><RotateCcw size={15} /></button>}
            </div>
            <p className="px-2 pb-1 text-xs text-muted">{tr('Trascina la foto per spostarla.', 'Drag the photo to move it.')}</p>
            {slidesPhotos.length > 1 && <button type="button" onClick={() => setFrames(o => ({ ...o, ...Object.fromEntries(slidesPhotos.map(p => [p.src, { ...fr }])) }))} className="h-10 w-full rounded-full text-sm font-semibold text-brand hover:bg-brand/10">{tr('Fai lo stesso su tutte le foto', 'Do the same on every photo')}</button>}
          </div>
        );
      })()}
    </div>
  ) : null;

  // post animato nell'anteprima: la grafica con le scritte che entrano (CSS), poi il video vero appena creato
  const animOn = wantAnim && stepIx === S.video;
  const animMine = animOn ? animOf(active) : null;
  const ak = Math.min((boxW - 24) / fmt.w, (boxH - 24) / fmt.h);
  const caption = animOn ? (animMine ? tr(`Il tuo post animato per ${net.label}`, `Your animated post for ${net.label}`) : tr(`Così si muove su ${net.label}`, `This is how it moves on ${net.label}`))
    : !nets.length ? '' : `${net.label}, ${fmtShort(net.fmts, fmt).toLowerCase()}`;
  const preview = (
    <div className="flex flex-col items-center gap-3">
      {tabs}
      <div ref={previewRef} className={`relative flex items-center justify-center rounded-[24px] bg-canvas ${animOn && !animRun ? `ap-run ap--${animStyle}` : ''}`} style={{ width: boxW, height: boxH }}>
        {animMine && !animRun ? (
          <div className="blur-in overflow-hidden rounded-2xl bg-black shadow-md ring-1 ring-black/5" style={{ width: Math.round(fmt.w * ak), height: Math.round(fmt.h * ak) }}>
            <video key={animMine.url} src={animMine.url} controls autoPlay muted loop playsInline className="h-full w-full object-cover" />
          </div>
        ) : !slidesPhotos.length || !nets.length
          ? (
            // scheletro del post nella forma del formato scelto (alta, quadrata, verticale) finche' non c'e' la foto
            <span className="relative block overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-black/5 ease-smooth transition-[width,height]"
              style={{ width: Math.round(fmt.w * Math.min((boxW - 24) / fmt.w, (boxH - 24) / fmt.h)), height: Math.round(fmt.h * Math.min((boxW - 24) / fmt.w, (boxH - 24) / fmt.h)) }}>
              <span className="absolute inset-0 animate-pulse bg-black/[.11]" />
              <span className="absolute left-[8%] top-[7%] h-[5%] w-[26%] animate-pulse rounded-full bg-white/80" />
              <span className="absolute inset-x-[8%] bottom-[8%] flex flex-col gap-[6%]" style={{ height: '30%' }}>
                <span className="h-[18%] w-4/5 animate-pulse rounded-full bg-white/80" />
                <span className="h-[18%] w-3/5 animate-pulse rounded-full bg-white/80" />
                <span className="h-[26%] w-2/5 animate-pulse rounded-full bg-white" />
              </span>
              <span className="absolute inset-0 flex items-center justify-center">
                <span key={stepIx < S.foto ? 'a' : 'b'} className="blur-in rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-muted shadow-sm">
                  {stepIx < S.foto || !nets.length ? tr('Qui vedrai il tuo post', 'Your post will show here') : tr('Scegli una foto', 'Choose a photo')}
                </span>
              </span>
            </span>
          )
          : <MorphPost build={shown} boxW={boxW} boxH={boxH} fw={fmt.w} fh={fmt.h} />}
        {framable && <div onPointerDown={onDown} onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp} aria-hidden className="absolute inset-3 cursor-grab touch-none active:cursor-grabbing" />}
        {!(animMine && !animRun) && slidesPhotos.length > 0 && nSlides > 1 && (
          <>
            <button type="button" onClick={() => setSlideIx(Math.max(0, six - 1))} disabled={!six} aria-label={tr('Foto prima', 'Previous photo')} className="absolute left-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-md ease-smooth transition-opacity disabled:opacity-0"><ChevronLeft size={18} /></button>
            <button type="button" onClick={() => setSlideIx(Math.min(nSlides - 1, six + 1))} disabled={six >= nSlides - 1} aria-label={tr('Foto dopo', 'Next photo')} className="absolute right-2 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/95 text-ink shadow-md ease-smooth transition-opacity disabled:opacity-0"><ChevronRight size={18} /></button>
          </>
        )}
      </div>
      <div className="flex min-h-8 flex-wrap items-center justify-center gap-1.5">
        {!(animMine && !animRun) && slidesPhotos.length > 0 && nSlides > 1 ? (
          <>
            {Array.from({ length: nSlides }, (_, i) => (
              <button key={i} type="button" onClick={() => setSlideIx(i)} aria-label={`${tr('Foto', 'Photo')} ${i + 1}`} className="flex h-8 items-center px-0.5">
                <span className={`block h-2 rounded-full ease-smooth transition-[width,background-color] ${i === six ? 'w-6 bg-ink' : 'w-2 bg-ink/20'}`} />
              </button>
            ))}
            <span className="ml-2 w-12 text-sm tabular-nums text-muted">{six + 1} / {nSlides}</span>
          </>
        ) : caption ? <span className="text-sm text-muted">{caption}</span> : null}
      </div>
      {fixer}
    </div>
  );

  // scelta grande (passi Cosa e Video): icona, titolo, una riga sotto; una sola evidenziata
  // due colonne uguali, contenuto centrato: icona sopra, titolo, una riga sotto
  // badge: piccola etichetta in alto (Consigliato), non e' una scelta fatta
  const bigChoice = (on: boolean, Icon: typeof Crop, title: string, sub: string, onClick: () => void, badge?: string) => (
    <button type="button" role="radio" aria-checked={on} onClick={onClick} className={`relative flex h-full min-h-[168px] w-full flex-col items-center justify-center gap-2 rounded-[24px] p-4 text-center ${chip(on)}`}>
      {badge && <span className="absolute right-3 top-3 rounded-full bg-brand/10 px-2.5 py-1 text-xs font-semibold text-brand">{badge}</span>}
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-[16px] ease-smooth transition-colors ${on ? 'bg-brand text-white' : 'bg-canvas text-ink/70'}`}><Icon size={24} /></span>
      <span className="block text-base font-semibold leading-snug">{title}</span>
      <span className="block text-sm leading-snug text-muted">{sub}</span>
    </button>
  );

  // passo 1: cosa pubblichi, chiesto una volta (vale per grafiche, testi e video)
  const stepCosa = (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold">{tr('Cosa pubblichi?', 'What are you posting?')}</h3>
      <div role="radiogroup" aria-label={tr('Cosa pubblichi', 'What you post')} className="grid grid-cols-2 gap-3">
        {bigChoice(soldPick === false, House, tr('Casa in vendita o in affitto', 'Home for sale or rent'), tr('Per trovare chi la compra o la affitta', 'To find a buyer or a tenant'), () => { setSold(false); autoNext(); })}
        {bigChoice(soldOn, BadgeCheck, tr('Casa venduta o affittata', 'Home sold or rented'), tr('Per far vedere il lavoro fatto', 'To show your work'), () => setSold(true), isClosed(status0) ? tr('Consigliato', 'Suggested') : undefined)}
      </div>
      {soldOn && (
        <div className="blur-in space-y-4 rounded-[24px] bg-canvas p-4">
          {/* a tutta larghezza (06/10/2026): segmentato in due meta' uguali con l'indicatore che scorre, campo alto 56 col suffisso dentro */}
          <div role="radiogroup" aria-label={tr('Venduta o affittata', 'Sold or rented')} className="relative grid h-14 grid-cols-2 rounded-full bg-white p-1 ring-1 ring-black/5">
            <span aria-hidden className="absolute bottom-1 left-1 top-1 w-[calc(50%-4px)] rounded-full bg-ink ease-smooth transition-transform motion-reduce:transition-none" style={{ transform: `translateX(${soldKind === 'affittato' ? 100 : 0}%)` }} />
            {([['venduto', tr('Venduta', 'Sold')], ['affittato', tr('Affittata', 'Rented')]] as const).map(([v, l]) => (
              <button key={v} type="button" role="radio" aria-checked={soldKind === v} onClick={() => setSoldKind(v)} className={`relative h-full rounded-full text-base font-semibold outline-none ease-smooth transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 ${soldKind === v ? 'text-white' : 'text-ink/70 hover:text-ink'}`}>{l}</button>
            ))}
          </div>
          <label className="block">
            <span className="block text-sm font-semibold">{tr('In quanti giorni?', 'In how many days?')} <span className="font-normal text-muted">{tr('(se vuoi)', '(optional)')}</span></span>
            <span className="relative mt-2 block">
              <input value={soldDays} onChange={e => setSoldDays(e.target.value.replace(/\D/g, '').slice(0, 4))} inputMode="numeric" pattern="[0-9]*" aria-label={tr('Giorni', 'Days')} className="h-14 w-full rounded-full bg-white pl-5 pr-20 text-base text-ink outline-none ring-1 ring-black/10 ease-smooth transition-shadow focus:ring-2 focus:ring-brand" />
              <span aria-hidden className="pointer-events-none absolute right-5 top-1/2 -translate-y-1/2 text-base text-muted">{tr('giorni', 'days')}</span>
            </span>
          </label>
        </div>
      )}
    </div>
  );

  // passo 2: dove. Nessun social gia' scelto; per ogni social scelto il tipo di post sempre in vista, gia' su "Una foto"
  const stepDove = (
    <div className="space-y-6">
      <section>
        <h3 className="font-display text-lg font-semibold">{tr('Dove lo pubblichi?', 'Where will you post it?')}</h3>
        <p className="mt-0.5 text-sm text-muted">{tr('Puoi sceglierne più di uno, preparo tutto insieme.', 'You can pick more than one, I prepare them all together.')}</p>
        <div className="mt-3 grid grid-cols-5 gap-2">
          {NETS.map(n => {
            const on = nets.includes(n.id);
            return (
              <button key={n.id} type="button" onClick={() => toggleNet(n.id)} aria-pressed={on} className={`relative flex h-[80px] min-w-0 flex-col items-center justify-center gap-1.5 rounded-2xl ${chip(on)}`}>
                <span className={on ? 'text-brand' : 'text-ink/70'}><NetIcon id={n.id} size={24} /></span>
                <span className="max-w-full truncate px-0.5 text-[11px] font-semibold sm:text-sm">{n.label}</span>
              </button>
            );
          })}
        </div>
      </section>
      {nets.length > 0 && <section className="blur-in">
        <h3 className="font-display text-lg font-semibold">{tr('Che post preparo?', 'Which post do I make?')}</h3>
        <div className="mt-1 divide-y divide-line">
          {nets.map(id => {
            const N = netOf(id), cf = fmtOf(id), ix = Math.max(0, N.fmts.indexOf(cf)), n = N.fmts.length;
            return (
              <div key={id} className={`flex gap-2 py-3 sm:gap-4 ${n === 1 ? 'items-center justify-between' : 'flex-col sm:flex-row sm:items-start sm:justify-between'}`}>
                <span className="flex h-12 min-w-0 items-center gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas text-ink"><NetIcon id={id} size={18} /></span>
                  <span className="truncate text-base font-semibold">{N.label}</span>
                </span>
                {n === 1 ? (
                  // un solo formato: niente scelta, solo un'etichetta discreta
                  <span className="flex h-12 shrink-0 items-center gap-1.5 px-3 text-sm text-muted"><Smartphone size={16} className="shrink-0" aria-hidden /> {kindShort(cf.kind)}</span>
                ) : <div className="flex flex-col gap-1 sm:items-end">
                  {/* segmentato come nel resto della piattaforma: fondo canvas, la scelta in bianco con ombra che scorre (600ms) */}
                  <div role="radiogroup" aria-label={tr(`Tipo di post per ${N.label}`, `Post type for ${N.label}`)} className="relative grid w-full rounded-[24px] bg-canvas p-1 sm:w-auto sm:rounded-full" style={{ gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))` }}>
                    <span aria-hidden className="absolute bottom-1 left-1 top-1 rounded-[20px] bg-white shadow-sm ease-smooth transition-transform motion-reduce:transition-none sm:rounded-full" style={{ width: `calc((100% - 8px) / ${n})`, transform: `translateX(${ix * 100}%)` }} />
                    {N.fmts.map(f => {
                      const on = cf.id === f.id, I = fmtIcon(f);
                      return (
                        <button key={f.id} type="button" role="radio" aria-checked={on} onClick={() => pickFmt(id, f.id)} title={fmtShort(N.fmts, f)}
                          className={`relative flex h-14 min-w-0 flex-col items-center justify-center gap-0.5 whitespace-nowrap rounded-full px-1 text-[13px] font-semibold outline-none ease-smooth transition-colors focus-visible:ring-2 focus-visible:ring-brand/50 sm:h-10 sm:min-w-[112px] sm:flex-row sm:gap-1.5 sm:px-3 sm:text-sm ${on ? 'text-ink' : 'text-muted hover:text-ink'}`}>
                          <I size={16} className="shrink-0" /> <span className="truncate">{fmtShort(N.fmts, f)}</span>
                        </button>
                      );
                    })}
                  </div>
                  <span key={cf.id} className="blur-in min-h-5 px-3 text-sm text-muted">{fmtHint(N.fmts, cf)}</span>
                </div>}
              </div>
            );
          })}
        </div>
      </section>}
    </div>
  );

  // passo 3: le foto. Si toccano nell'ordine voluto, il numero e' l'ordine; "Sistema la foto" sta sotto l'anteprima
  const stagedShown = gridSel.some(p => p.staged);
  const stepFoto = (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-semibold">{gridMulti ? tr('Scegli le foto', 'Choose the photos') : tr('Scegli la foto', 'Choose the photo')}</h3>
          {/* per chi stai scegliendo: il social in anteprima (si cambia dalle linguette sopra l'anteprima) */}
          {nets.length > 0 && <p key={active} className="blur-in mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink"><NetIcon id={active} size={16} /> {tr(`Foto per ${net.label}`, `Photos for ${net.label}`)}</p>}
          <p className="mt-0.5 text-sm text-muted">{gridMulti
            ? tr(`Tocca le foto nell’ordine che vuoi, il numero è l’ordine. Fino a ${MAX_PHOTOS} foto.`, `Tap the photos in the order you want, the number is the order. Up to ${MAX_PHOTOS} photos.`)
            : tr('Tocca la foto che vuoi pubblicare.', 'Tap the photo you want to post.')}</p>
          {nets.length > 1 && <p className="mt-0.5 text-sm text-muted">{tr('Tocca un altro social sopra l’anteprima per cambiare la sua foto.', 'Tap another network above the preview to change its photo.')}</p>}
        </div>
        {gridMulti && gridSel.length > 0 && <button type="button" onClick={restart} className="h-10 rounded-full px-3 text-sm font-semibold text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink">{tr('Ricomincia', 'Start over')}</button>}
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {photos.map(p => {
          const i = gridSel.indexOf(p);
          return (
            <button key={p.src} type="button" onClick={() => tap(p.src)} aria-pressed={i >= 0} className={`relative aspect-[4/3] overflow-hidden rounded-2xl ring-offset-2 ease-smooth transition-shadow ${i >= 0 ? 'ring-[3px] ring-brand' : 'ring-1 ring-black/10 hover:ring-black/25'}`}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={p.small} alt="" className="h-full w-full object-cover" />
              {p.staged && <span className="absolute bottom-2 left-2 rounded-full bg-white/90 px-2 py-0.5 text-[11px] font-semibold text-ink">{tr('Arredata al computer', 'Virtually staged')}</span>}
              {i >= 0 && <span className="pop absolute right-2 top-2 flex h-8 min-w-8 items-center justify-center rounded-full bg-brand px-2 text-sm font-bold text-white">{gridMulti ? i + 1 : <Check size={16} strokeWidth={3} />}</span>}
            </button>
          );
        })}
        {photos.length < Math.min(srcs.length, 24) && <span className="aspect-[4/3] animate-pulse rounded-2xl bg-canvas" />}
      </div>
      {stagedShown && (
        <label className="flex cursor-pointer items-start gap-3 rounded-[24px] bg-canvas p-4">
          <input type="checkbox" checked={label} onChange={e => setLabel(e.target.checked)} className="mt-0.5 h-5 w-5 shrink-0 accent-[var(--color-brand,#537eec)]" />
          <span>
            <span className="block text-sm font-semibold">{tr('Scrivi sulla foto che è arredata al computer', 'Write on the photo that it is virtually staged')}</span>
            <span className="block text-sm text-muted">{tr('Così chi guarda sa che i mobili sono stati aggiunti al computer.', 'So viewers know the furniture was added on the computer.')}</span>
          </span>
        </label>
      )}
    </div>
  );

  // passo 4: la grafica. Toccandone una sul telefono l'anteprima grande torna in vista
  // si sceglie per il social in anteprima (da qui e' sua) e per tutti quelli non ancora toccati; niente avanti da soli
  const pickTpl = (id: string) => { setTplOwn(o => ({ ...o, [active]: id })); setTplShared(id); if (!wide) bodyRef.current?.scrollTo({ top: 0, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' }); };
  const stepGrafica = (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-semibold">{tr('Scegli la grafica', 'Choose the design')}</h3>
        {nets.length > 0 && <p key={active} className="blur-in mt-1 flex items-center gap-1.5 text-sm font-semibold text-ink"><NetIcon id={active} size={16} /> {tr(`Grafica per ${net.label}`, `Design for ${net.label}`)}</p>}
        <p className="mt-0.5 text-sm text-muted">{tr('Con il tuo logo e il tuo colore.', 'With your logo and colour.')}</p>
        {nets.length > 1 && <p className="mt-0.5 text-sm text-muted">{tr('Tocca un altro social sopra l’anteprima per cambiare la sua grafica.', 'Tap another network above the preview to change its design.')}</p>}
      </div>
      {swaps.length > 0 && (
        <div className="rounded-2xl bg-amber-50 px-4 py-3 text-sm leading-relaxed text-amber-900 ring-1 ring-amber-200">
          {swaps.map(s => (
            <span key={s.n} className="block">{tr(`Su ${netOf(s.n).label} ${tplLabel(s.from)} non ci sta bene, lì uso ${tplLabel(s.to)}, la più simile.`, `On ${netOf(s.n).label} ${tplLabel(s.from)} does not fit well, there I use ${tplLabel(s.to)}, the closest one.`)}</span>
          ))}
        </div>
      )}
      <div ref={gridRef} className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {cellW > 0 && all.map(t => (
          <button key={t.id} type="button" onClick={() => pickTpl(t.id)} aria-pressed={cur === t.id} className="group flex flex-col items-center gap-2 text-left">
            <span className={`block overflow-hidden rounded-2xl ring-offset-2 ease-smooth transition-shadow ${cur === t.id ? 'ring-[3px] ring-brand' : 'ring-1 ring-black/10 group-hover:ring-black/25'}`}><PostView build={thumbs[t.id] ?? null} width={cellW - 4} /></span>
            <span className={`text-sm ${cur === t.id ? 'font-semibold text-ink' : 'font-medium text-muted'}`}>{tplLabel(t.id)}</span>
          </button>
        ))}
      </div>
    </div>
  );

  // passo 5: il testo, gia' scritto per ogni social. Avviso solo se supera il limite del social
  const textCard = (n: NetId) => {
    const N = netOf(n), k = tk(n), t = texts[k] ?? '', rule = ruleOf(n, n === 'tiktok' && wantAnim);
    const long = countChars(t) > rule.max;
    const on = nets.length > 1 && n === active;
    return (
      <section key={n} onFocusCapture={() => { if (n !== active) show(n); }} className={`rounded-[24px] p-4 ease-smooth transition-shadow ${on ? 'ring-2 ring-brand' : 'ring-1 ring-black/10'}`}>
        {nets.length > 1 && (
          <button type="button" onClick={() => show(n)} className="mb-3 flex min-h-8 items-center gap-2 text-left">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-canvas text-ink"><NetIcon id={n} size={16} /></span>
            <span className="text-sm font-semibold">{N.label}</span>
            {done.includes(n) && <Check size={14} className="text-brand" strokeWidth={3} />}
          </button>
        )}
        <div className="relative">
          <textarea value={t} onChange={e => putText(n, e.target.value)} rows={nets.length > 1 ? (wide ? 8 : 7) : wide ? 12 : 9} aria-label={tr(`Testo per ${N.label}`, `Text for ${N.label}`)}
            className="block w-full resize-y rounded-[16px] bg-canvas px-4 py-3 text-base leading-relaxed outline-none ring-1 ring-transparent ease-smooth transition-[background-color,box-shadow] focus:bg-white focus:ring-brand" />
          {(textBusy[k] || (textErr[k] && !t)) && (
            <span className="absolute inset-0 flex flex-col items-center justify-center gap-2 rounded-[16px] bg-canvas px-4 text-center text-sm text-muted">
              {textBusy[k] ? <span className="flex items-center gap-2"><Loader2 size={16} className="animate-spin" /> {tr('Scrivo il testo', 'Writing the text')}</span> : (
                <>
                  <span>{textErr[k]}</span>
                  <button type="button" onClick={() => void writeText(n, true)} className="flex h-10 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold text-ink shadow-sm ring-1 ring-black/5 hover:bg-line"><RotateCcw size={15} /> {tr('Riprova', 'Try again')}</button>
                </>
              )}
            </span>
          )}
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
          {long && <span className="text-sm font-semibold text-red-600">{tr(`Testo troppo lungo per ${N.label}`, `Text too long for ${N.label}`)}</span>}
          <button type="button" onClick={() => void copy(n)} disabled={!t || !!textBusy[k]} className="ml-auto flex h-11 items-center gap-2 rounded-full bg-canvas px-5 text-sm font-semibold ease-smooth transition-colors hover:bg-line disabled:opacity-50">{copied === n ? <Check size={16} /> : <Copy size={16} />} <span className="w-[88px] text-left">{copied === n ? tr('Copiato', 'Copied') : tr('Copia testo', 'Copy text')}</span></button>
        </div>
      </section>
    );
  };
  const stepTesto = (
    <div className="space-y-4">
      <div>
        <h3 className="font-display text-lg font-semibold">{nets.length > 1 ? tr('I testi dei post', 'The post texts') : tr(`Il testo per ${net.label}`, `The text for ${net.label}`)}</h3>
        <p className="mt-0.5 text-sm text-muted">{tr('Abbiamo scritto il testo per te. Puoi cambiarlo.', 'We wrote the text for you. You can change it.')}</p>
      </div>
      {nets.map(textCard)}
      <p className="min-h-5 text-sm text-muted" aria-live="polite">{note}</p>
    </div>
  );

  // passo 6, facoltativo: post animato (gratis) o solo le foto; gli stili d'animazione solo dopo la scelta
  const sayAnim = () => { setWantAnim(true); setSaidNo(false); };
  // post animato: gli 8 movimenti, ognuno sulla grafica scelta in piccolo; uno solo evidenziato
  const animTileW = animGridW ? Math.floor((animGridW - 3 * 12) / 4) : 0;
  const animThumb = cur ? thumbs[cur] ?? null : null;
  const animDone = nets.filter(n => animOf(n));
  const stepAnim = (
    <div className="blur-in space-y-5">
      <section>
        <h4 className="text-base font-semibold">{tr('Scegli come entrano le scritte', 'Choose how the text comes in')}</h4>
        <p className="text-sm text-muted">{tr(`Il post dura ${ANIM_SEC} secondi.`, `The post lasts ${ANIM_SEC} seconds.`)}</p>
        <div ref={animGridRef} role="radiogroup" aria-label={tr('Animazione', 'Animation')} className="mt-3 grid grid-cols-4 gap-3">
          {animTileW > 0 && ANIMATION_STYLES.map((a: { id: string; label: string }) => {
            const on = animStyle === a.id, name = pageLang() === 'it' ? a.label : ANIM_EN[a.id] ?? a.label;
            return (
              <button key={a.id} type="button" role="radio" aria-checked={on} aria-label={name} onClick={() => setAnimStyle(a.id)} disabled={!!animRun} className="group flex min-w-0 flex-col items-center gap-2 disabled:opacity-60">
                <span aria-hidden className={`${animRun ? '' : 'ap-run'} ap--${a.id} block overflow-hidden rounded-2xl ring-offset-2 ease-smooth transition-shadow ${on ? 'ring-[3px] ring-brand' : 'ring-1 ring-black/10 group-hover:ring-black/25'}`}><PostView build={animThumb} width={animTileW - 4} /></span>
                <span className={`max-w-full truncate text-sm ${on ? 'font-semibold text-ink' : 'font-medium text-muted'}`}>{name}</span>
              </button>
            );
          })}
        </div>
      </section>
      {animRun && (
        <div className="flex items-center gap-3 rounded-[24px] bg-canvas p-4">
          <Loader2 size={20} className="shrink-0 animate-spin text-brand" />
          <span className="min-w-0 flex-1">
            <span className="block text-base font-semibold">{animRun.of > 1 ? tr(`Creo il post animato per ${netOf(animRun.n).label}, ${animRun.i + 1} di ${animRun.of}`, `Making the animated post for ${netOf(animRun.n).label}, ${animRun.i + 1} of ${animRun.of}`) : tr('Creo il post animato', 'Making the animated post')}</span>
            <span className="block text-sm text-muted">{tr('Tieni aperta questa pagina, ci vuole poco.', 'Keep this page open, it takes a moment.')}</span>
            <span className="mt-2 block h-1.5 w-full overflow-hidden rounded-full bg-black/10"><span className="block h-full rounded-full bg-brand ease-smooth transition-[width]" style={{ width: `${Math.max(4, Math.round(animRun.p * 100))}%` }} /></span>
          </span>
        </div>
      )}
      {!animRun && animDone.length > 0 && (
        <div className="rounded-[24px] bg-canvas p-4">
          <span className="flex items-center gap-2 text-base font-semibold"><Check size={18} className="shrink-0 text-brand" strokeWidth={3} /> {animDone.length === nets.length
            ? tr('Il post animato è pronto, lo salvi insieme alle foto.', 'The animated post is ready, you save it with the photos.')
            : tr(`Pronto per ${animDone.map(n => netOf(n).label).join(', ')}.`, `Ready for ${animDone.map(n => netOf(n).label).join(', ')}.`)}</span>
          {animOf(active) && <button type="button" onClick={() => { const a = animOf(active)!; save(a.file, a.file.name); }} className="mt-3 flex h-11 items-center gap-2 rounded-full bg-white px-4 text-sm font-semibold shadow-sm ring-1 ring-black/5 ease-smooth transition-colors hover:bg-line"><Download size={15} /> {tr('Salva solo il post animato', 'Save the animated post only')}</button>}
        </div>
      )}
    </div>
  );
  // "No": niente video, si scaricano subito le foto (come il bottone Salva)
  const sayNo = () => { setWantAnim(false); setSaidNo(true); if (ready && !busy && !animRun) void downloadAll(); };
  const stepVideo = (
    <div className="space-y-5">
      <h3 className="font-display text-lg font-semibold">{tr('Vuoi anche un video?', 'Do you want a video too?')}</h3>
      <div role="radiogroup" aria-label={tr('Video', 'Video')} className="grid grid-cols-2 gap-3">
        {animOk && bigChoice(wantAnim, Clapperboard, tr('Post animato', 'Animated post'), tr('Gratis, la tua grafica si muove', 'Free, your design moves'), sayAnim)}
        {bigChoice(!wantAnim && saidNo, ImageIcon, tr('No, salva le foto', 'No, save the photos'), tr('Le scarichi subito', 'Download them now'), sayNo)}
      </div>
      {wantAnim && stepAnim}
      <p className="min-h-5 text-sm text-muted" aria-live="polite">{note}</p>
    </div>
  );

  // piede dell'ultimo passo: un solo bottone scuro. "Crea il post animato" finche' (voluto) manca per qualche social, poi "Salva tutto"
  const last = stepIx === S.video;
  const animFirst = last && wantAnim && (!!animRun || nets.some(n => !animOf(n)));
  const shareLabel = tr(`Pubblica su ${net.label}`, `Post on ${net.label}`);

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 sm:p-4" onClick={onClose}>
      <div className="flex h-full w-full max-w-[1160px] flex-col overflow-hidden bg-white shadow-2xl sm:rounded-[32px]" style={wide ? { height: modalH } : undefined} onClick={e => e.stopPropagation()}>
        {/* testata e passi; sul telefono solo "Passo 2 di 6, Dove" */}
        <div className="shrink-0 px-4 pt-4 sm:px-6 sm:pt-5">
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <h2 className="font-display text-lg font-bold tracking-tight sm:text-xl">{tr('Condividi sui social', 'Share on social media')}</h2>
              {phoneUi && <p className="text-sm font-semibold text-muted">{tr(`Passo ${stepIx + 1} di ${STEPS.length}, ${STEPS[stepIx][0]}`, `Step ${stepIx + 1} of ${STEPS.length}, ${STEPS[stepIx][1]}`)}</p>}
            </div>
            <button type="button" onClick={onClose} aria-label={tr('Chiudi', 'Close')} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-canvas text-ink/70 hover:text-ink"><X size={18} /></button>
          </div>
          {phoneUi ? (
            <div className="mt-3 flex gap-1" aria-hidden>
              {STEPS.map((_, i) => <span key={i} className={`h-1.5 flex-1 rounded-full ease-smooth transition-colors ${i <= stepIx ? 'bg-brand' : 'bg-black/10'}`} />)}
            </div>
          ) : (
            <nav className="mt-3 grid grid-cols-6 gap-1 rounded-full bg-canvas p-1" aria-label={tr('Passi', 'Steps')}>
              {STEPS.map(([i1, e1], i) => {
                const on = i === stepIx, ok = i !== stepIx && i <= reached && stepOk[i] && (firstTodo < 0 || i < firstTodo);
                return (
                  <button key={i1} type="button" onClick={() => goStep(i)} disabled={!on && !canGo(i)} aria-current={on ? 'step' : undefined} className={`flex h-10 min-w-0 items-center justify-center gap-1.5 rounded-full text-sm font-semibold ease-smooth transition-[background-color,color,box-shadow,opacity] disabled:cursor-not-allowed disabled:opacity-50 ${on ? 'bg-white text-ink shadow-sm' : ok ? 'text-ink hover:bg-white/60' : 'text-muted enabled:hover:bg-white/60'}`}>
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold ease-smooth transition-colors ${on ? 'bg-brand text-white' : ok ? 'bg-ink text-white' : 'bg-black/10 text-muted'}`}>{ok ? <Check size={11} strokeWidth={3} /> : i + 1}</span>
                    <span className="truncate">{tr(i1, e1)}</span>
                  </button>
                );
              })}
            </nav>
          )}
        </div>

        {/* corpo: anteprima (sempre della stessa grandezza) e passo */}
        <div ref={bodyRef} className="min-h-0 flex-1 overflow-y-auto lg:flex lg:overflow-hidden">
          <div className="flex shrink-0 justify-center px-4 pb-1 pt-4 [contain:paint] [transform:translateZ(0)] lg:w-[464px] lg:items-start lg:overflow-y-auto lg:px-8 lg:py-6">{preview}</div>
          <div ref={stepRef} className="min-w-0 flex-1 px-4 pb-6 pt-3 sm:px-6 lg:overflow-y-auto lg:py-6 lg:pl-2 lg:pr-8">
            <div key={stepIx} className="blur-in">{[stepCosa, stepDove, stepFoto, stepGrafica, stepTesto, stepVideo][stepIx]}</div>
          </div>
        </div>

        {/* piede: Indietro e Avanti fino al passo Video; li' Pubblica (il social che si guarda) e Salva, o Crea il post animato */}
        <div className="flex shrink-0 items-end gap-2 border-t border-line px-4 py-3 sm:items-center sm:px-6" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <button type="button" onClick={() => goStep(Math.max(0, stepIx - 1))} disabled={!stepIx} aria-label={tr('Indietro', 'Back')} className={`${btn} shrink-0 px-4 text-ink hover:bg-canvas disabled:invisible`}><ArrowLeft size={18} /> <span className="hidden sm:inline">{tr('Indietro', 'Back')}</span></button>
          {!last ? (
            <div className="flex min-w-0 flex-1 flex-col items-end gap-1">
              {/* finche' manca qualcosa il bottone dice cosa (spento ma leggibile), poi torna "Avanti" e la larghezza segue il testo */}
              <GrowButton type="button" onClick={() => goStep(stepIx + 1)} disabled={!canNext} aria-describedby={canNext ? undefined : 'social-missing'}
                className={`${btn} min-w-[160px] text-base ${!canNext && ctaTodo ? 'bg-canvas text-ink/70 ring-1 ring-black/10 disabled:opacity-100' : 'bg-ink text-white enabled:hover:bg-brand disabled:opacity-40'}`}>
                {!canNext && ctaTodo ? <span key={ctaTodo} className="blur-in">{ctaTodo}</span> : <>{tr('Avanti', 'Next')} <ArrowRight size={18} /></>}
              </GrowButton>
              {!canNext && <span id="social-missing" className="sr-only">{missing}</span>}
            </div>
          ) : (
            <div className="flex min-w-0 flex-1 flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              {canPublish && <button type="button" onClick={() => void share()} disabled={!allReady || !!busy || !!animRun} className={`${btn} min-w-0 bg-canvas px-5 text-ink hover:bg-line`}>{busy === 'share' ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />} <span className="truncate">{shareLabel}</span></button>}
              {animFirst ? (
                <button type="button" onClick={() => void makeAnim()} disabled={!ready || !allReady || !!animRun || !!busy} className={`${btn} min-w-0 bg-ink px-5 text-white hover:bg-brand`}>{animRun ? <Loader2 size={16} className="animate-spin" /> : <Clapperboard size={16} />} <span className="truncate tabular-nums">{animRun ? tr(`Creo il post animato ${Math.round(animRun.p * 100)}%`, `Making the animated post ${Math.round(animRun.p * 100)}%`) : tr('Crea il post animato', 'Make the animated post')}</span></button>
              ) : (
                <button type="button" onClick={() => void downloadAll()} disabled={!ready || !!busy} className={`${btn} min-w-0 bg-ink px-5 text-white hover:bg-brand`}>{busy === 'all' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} <span className="truncate">{saveLabel}</span></button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
