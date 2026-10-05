'use client';

// Scheda immobile, "Condividi sui social" (05/10/2026): le grafiche dei post della vecchia dashboard GetNearMe
// (components/dashboard/templates: renderTemplate + exporter) con i dati veri dell'immobile, il logo e il colore
// dell'agenzia (gli stessi di BrandCard, api/platform/site) e il testo del post scritto dall'AI (api/platform/social-caption).
// Le grafiche restano in Poppins: sono il marchio dell'agente, non il nostro.
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, Copy, Download, Film, Loader2, RotateCcw, Share2, Sparkles, X } from 'lucide-react';
import { renderTemplate, TEMPLATES as POST_TEMPLATES } from '@/components/dashboard/templates/index.js';
import { exportStaticToVideo, exportToPng } from '@/components/dashboard/templates/exporter.js';
import '@/components/dashboard/templates/styles.css';
import { closedPriceHidden, statusOf, STATUS_LABELS, zoneOnly } from '@/lib/siteTemplates';
import type { ProjectData } from '@/lib/projects';
import { authFetch } from './api';
import { pageLang, tr } from './i18n';

type Size = { w: number; h: number; safe: { top: number; bottom: number; left: number; right: number } };
const SIZES: Record<'post' | 'story', Size> = {
  post: { w: 1080, h: 1350, safe: { top: 60, bottom: 60, left: 60, right: 60 } },
  story: { w: 1080, h: 1920, safe: { top: 200, bottom: 260, left: 0, right: 0 } }, // nome e risposta delle storie
};
// grafiche senza foto a tutto schermo (la foto sta in una cornice): niente "riempi"
const NO_COVER = ['arch', 'split', 'frame', 'spotlight', 'before-after', 'gallery', 'tips'];
const STAGED_TEXT = 'Immagine arredata virtualmente';

type Brand = { logo: string | null; primary: string; agencyName: string; phone: string };
type Photo = { src: string; full: string; small: string; staged: boolean; original?: string };

// ---------- caricamento ----------
let fontsP: Promise<void> | null = null;
function loadFonts() {
  if (fontsP) return fontsP;
  if (!document.getElementById('tpl-fonts')) {
    const l = document.createElement('link');
    l.id = 'tpl-fonts'; l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Poppins:wght@300;400;500;600;700&display=swap';
    document.head.appendChild(l);
  }
  fontsP = new Promise<void>(r => setTimeout(r, 50))
    .then(() => Promise.all([300, 400, 500, 600, 700].map(w => document.fonts.load(`${w} 64px Poppins`).catch(() => null))))
    .then(() => document.fonts.ready).then(() => undefined);
  return fontsP;
}

// foto in un blob locale: l'esportazione (canvas) non si "sporca" con foto di altri siti. R2 risponde con CORS,
// le foto dei portali passano dalle miniature del nostro server (960 px).
const blobCache = new Map<string, Promise<{ full: string; small: string } | null>>();
function localPhoto(src: string) {
  if (!blobCache.has(src)) blobCache.set(src, (async () => {
    const get = async (u: string) => { const r = await fetch(u, { mode: 'cors', cache: 'no-store' }); /* no-store: la copia in cache delle <img> non ha l'intestazione CORS */ if (!r.ok || !(r.headers.get('content-type') ?? '').startsWith('image/')) throw new Error('img'); return r.blob(); };
    let blob: Blob | null = null;
    if (src.startsWith('data:') || src.startsWith('blob:')) blob = await (await fetch(src)).blob();
    else blob = await get(src).catch(() => get(`/api/thumb?w=960&u=${encodeURIComponent(src)}`)).catch(() => null);
    if (!blob) return null;
    const full = URL.createObjectURL(blob);
    // copia piccola per le miniature delle grafiche (17 anteprime dal vivo)
    const small = await createImageBitmap(blob).then(bm => {
      const k = Math.min(1, 540 / bm.width), c = document.createElement('canvas');
      c.width = Math.round(bm.width * k); c.height = Math.round(bm.height * k);
      c.getContext('2d')!.drawImage(bm, 0, 0, c.width, c.height);
      return new Promise<string>(ok => c.toBlob(b => ok(b ? URL.createObjectURL(b) : full), 'image/jpeg', 0.82));
    }).catch(() => full);
    return { full, small };
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

// ---------- la grafica ----------
type Build = { tpl: string; data: Record<string, unknown>; photo: string; size: Size; blur: string; logo: string | null; logoH: boolean; staged: boolean; photos?: string[] };
function buildPost(b: Build) {
  const fit = !NO_COVER.includes(b.tpl) && b.size.h === 1350; // post: foto a tutto riquadro; storia: foto intera sul fondo sfocato
  const opts: Record<string, unknown> = {
    size: b.size, blurredUrl: b.blur, fitCover: fit, photos: b.photos,
    ...(b.logo ? { logoWhite: b.logo, logoBlack: b.logo, logoColored: b.logo, logoPosition: 'top-right', logoOrientation: b.logoH ? 'horizontal' : 'vertical' } : {}),
  };
  const el = renderTemplate(b.tpl, b.data, b.photo, opts as never) as HTMLElement; // opzioni in JSDoc incomplete (fitCover, loghi)
  el.style.width = b.size.w + 'px'; el.style.height = b.size.h + 'px';
  // il CSS importato perde backdrop-filter: si rimette a mano (come in TemplatePreview)
  for (const [cls, v] of [['tpl-glass-panel', 'blur(16px)'], ['tpl-metric-card', 'blur(12px)'], ['tpl-metric-pill', 'blur(12px)']]) {
    el.querySelectorAll<HTMLElement>('.' + cls).forEach(n => { n.style.backdropFilter = v; n.style.setProperty('-webkit-backdrop-filter', v); n.style.transform = 'translateZ(0)'; });
  }
  if (b.tpl === 'before-after') el.querySelectorAll<HTMLElement>('.tpl-label').forEach(n => { n.textContent = n.textContent === 'BEFORE' ? 'PRIMA' : 'DOPO'; });
  if (b.staged) {
    const row = document.createElement('div');
    row.className = 'tpl-label';
    Object.assign(row.style, { position: 'absolute', left: '0', right: '0', bottom: (b.size.h > 1350 ? b.size.safe.bottom - 72 : 14) + 'px', display: 'flex', justifyContent: 'center', zIndex: '30', pointerEvents: 'none' });
    const pill = document.createElement('span');
    pill.textContent = STAGED_TEXT;
    Object.assign(pill.style, { fontFamily: 'Poppins, sans-serif', fontSize: '24px', fontWeight: '500', lineHeight: '24px', color: '#fff', background: 'rgba(0,0,0,.5)', padding: '10px 22px', borderRadius: '999px', whiteSpace: 'nowrap' });
    row.appendChild(pill); el.appendChild(row);
  }
  return el;
}

function PostView({ build, width }: { build: Build | null; width: number }) {
  const box = useRef<HTMLDivElement>(null);
  const ok = !!build;
  useEffect(() => {
    const c = box.current;
    if (!c || !build) return;
    let el: HTMLElement;
    try { el = buildPost(build); } catch (e) { console.error('post render', build.tpl, e); return; }
    (el.style as unknown as Record<string, string>).zoom = String(width / build.size.w);
    c.replaceChildren(el);
  }, [build, width]);
  const h = Math.round(width * (build?.size.h ?? 1350) / (build?.size.w ?? 1080));
  return (
    <div className="relative overflow-hidden rounded-[inherit]" style={{ width, height: h }}>
      {!ok && <div className="absolute inset-0 animate-pulse bg-black/[.06]" />}
      <div ref={box} className={`pointer-events-none transition-opacity duration-[600ms] ${ok ? 'opacity-100' : 'opacity-0'}`} />
    </div>
  );
}

// ---------- card nella colonna ----------
export default function SocialCard({ project, photos }: { project: ProjectData; photos: string[] }) {
  const [open, setOpen] = useState(false);
  return (
    <section className="rounded-2xl bg-canvas p-3">
      <div className="flex items-center gap-3">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white text-brand ring-1 ring-black/5"><Share2 size={18} /></span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold">{tr('Condividi sui social', 'Share on social media')}</span>
          <span className="block text-xs text-muted">{tr('Post e storia con foto, dati e il tuo logo', 'Post and story with photos, details and your logo')}</span>
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
function SocialShare({ project, photos: srcs, onClose }: { project: ProjectData; photos: string[]; onClose: () => void }) {
  const d = (project.import_data ?? {}) as { details?: Record<string, unknown>; prima?: Record<string, string> };
  const det = d.details ?? {};
  const prima = d.prima ?? {};
  const [brand, setBrand] = useState<Brand | null>(null);
  const [logo, setLogo] = useState<{ url: string | null; h: boolean } | null>(null);
  const [fonts, setFonts] = useState(false);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [pi, setPi] = useState(0);
  const [tpl, setTpl] = useState('gradient');
  const [fmt, setFmt] = useState<'post' | 'story'>('post');
  const [blurs, setBlurs] = useState<Record<string, string>>({});
  const [label, setLabel] = useState(true); // scritta "arredata virtualmente" sulle foto AI
  const [busy, setBusy] = useState<'png' | 'share' | 'video' | null>(null);
  const [note, setNote] = useState('');
  const [text, setText] = useState('');
  const [textBusy, setTextBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const [vw, setVw] = useState(1200);
  const canShare = typeof navigator !== 'undefined' && 'canShare' in navigator && (() => { try { return navigator.canShare({ files: [new File([''], 'a.png', { type: 'image/png' })] }); } catch { return false; } })();

  useEffect(() => {
    const on = () => setVw(window.innerWidth);
    on(); window.addEventListener('resize', on);
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => { window.removeEventListener('resize', on); window.removeEventListener('keydown', k); };
  }, [onClose]);
  useEffect(() => { void loadFonts().then(() => setFonts(true)); }, []);
  // marchio dell'agenzia: logo (in data URL, l'esportazione non si sporca), colore, nome, telefono
  useEffect(() => {
    authFetch('/api/platform/site').then(r => (r.ok ? r.json() : null)).then(async (s: { logo: string | null; name?: string; config: { logo?: string; primary?: string; agencyName?: string; phone?: string } } | null) => {
      const b: Brand = { logo: s?.config?.logo || s?.logo || null, primary: s?.config?.primary || '#1d1d1f', agencyName: s?.config?.agencyName || s?.name || '', phone: s?.config?.phone || '' };
      setBrand(b);
      const url = await toDataUrl(b.logo);
      const h = url ? await new Promise<boolean>(ok => { const i = new Image(); i.onload = () => ok(i.naturalWidth / Math.max(1, i.naturalHeight) > 1.4); i.onerror = () => ok(true); i.src = url; }) : true;
      setLogo({ url, h });
    }).catch(() => { setBrand({ logo: null, primary: '#1d1d1f', agencyName: '', phone: '' }); setLogo({ url: null, h: true }); });
  }, []);
  // foto dell'immobile in locale, in ordine (la copertina prima); le foto AI con l'originale accanto (Prima e Dopo)
  useEffect(() => {
    let live = true;
    void (async () => {
      const out: Photo[] = [];
      for (const src of srcs.slice(0, 24)) {
        const l = await localPhoto(src);
        if (!l) continue;
        const orig = prima[src] ? await localPhoto(prima[src]) : null;
        out.push({ src, full: l.full, small: l.small, staged: !!prima[src], original: orig?.full });
        if (live) setPhotos([...out]);
      }
    })();
    return () => { live = false; };
  }, [srcs.join('|')]); // eslint-disable-line react-hooks/exhaustive-deps
  const photo = photos[Math.min(pi, photos.length - 1)];
  useEffect(() => {
    for (const p of [photo?.full, photo?.small]) if (p && !blurs[p]) void blurred(p).then(b => setBlurs(o => ({ ...o, [p]: b })));
  }, [photo, blurs]);

  // dati della grafica dall'immobile
  const rent = det.contratto === 'Affitto' || /affitt/i.test(`${project.titolo ?? ''} ${project.tipologia ?? ''}`);
  const status = statusOf({ details: det });
  const hidePrice = closedPriceHidden({ details: det });
  const addr = det.mostra_indirizzo ? project.addr ?? '' : zoneOnly(project.addr ?? '');
  const it = pageLang() === 'it';
  const data: Record<string, unknown> = {
    title: project.titolo || project.tipologia || project.nome || '',
    type: project.tipologia || '',
    price: project.prezzo && !hidePrice ? `€ ${project.prezzo.toLocaleString('it-IT')}${rent ? (it ? ' al mese' : ' / month') : ''}` : '',
    address: addr,
    surface: project.mq ? `${project.mq} m²` : '', surfaceNum: project.mq ? String(project.mq) : '',
    bedrooms: String(project.camere || project.locali || ''), rooms: String(project.locali || ''), bathrooms: String(project.bagni || ''),
    description: (project.descrizione ?? '').replace(/\s+/g, ' ').slice(0, 260),
    contract: status !== 'disponibile' ? tr(...STATUS_LABELS[status]) : rent ? tr('In affitto', 'For rent') : tr('In vendita', 'For sale'),
    ctaText: brand?.phone ? `${tr('Chiama', 'Call')} ${brand.phone}` : tr('Contattaci ora', 'Contact us'),
    energyClass: String(det.classe_energetica ?? ''),
    accentColor: brand?.primary || '#1d1d1f',
    _icons: { bedrooms: project.camere ? 'bed' : 'rooms', bathrooms: 'bath', surface: 'area' },
  };
  // tips: consigli, non un annuncio; frame: nell'esportazione la foto sparisce (doppia passata del vetro dell'exporter)
  const list = POST_TEMPLATES.filter(t => t.id !== 'tips' && t.id !== 'frame' && (t.id !== 'gallery' || photos.length >= 3) && (t.id !== 'before-after' || !!photo?.original));
  const cur = list.some(t => t.id === tpl) ? tpl : 'gradient';
  const extra = (id: string, small: boolean): string[] | undefined => {
    if (id === 'before-after') return [small ? photo!.small : photo!.full];
    if (id === 'gallery') return photos.filter(p => p !== photo).slice(0, 2).map(p => (small ? p.small : p.full));
    return undefined;
  };
  // Prima e Dopo: la prima foto e' l'originale, la seconda quella arredata
  const mk = (id: string, small: boolean, size: Size): Build | null => {
    if (!photo || !fonts || !logo || !brand) return null;
    const main = id === 'before-after' && photo.original ? photo.original : small ? photo.small : photo.full;
    const blur = blurs[small ? photo.small : photo.full];
    if (!blur) return null;
    return { tpl: id, data, photo: main, size, blur, logo: logo.url, logoH: logo.h, staged: photo.staged && label, photos: extra(id, small) };
  };
  const key = JSON.stringify([cur, fmt, photo?.full, label, fonts, !!logo, brand?.primary, !!blurs[photo?.full ?? '']]);
  const keySmall = JSON.stringify([fmt, photo?.small, label, fonts, !!logo, brand?.primary, !!blurs[photo?.small ?? ''], photos.length]);
  const [big, setBig] = useState<Build | null>(null);
  const [thumbs, setThumbs] = useState<Record<string, Build | null>>({});
  // oggetti stabili: si ridisegna solo quando cambia davvero qualcosa
  useEffect(() => { setBig(mk(cur, false, SIZES[fmt])); }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { setThumbs(Object.fromEntries(list.map(t => [t.id, mk(t.id, true, SIZES[fmt])]))); }, [keySmall]); // eslint-disable-line react-hooks/exhaustive-deps

  // testo del post: una volta per immobile (resta sul dispositivo), Rifai per un altro
  const tKey = `agenteimmo:social-text:${project.id}`;
  const writeText = async (force = false) => {
    if (!force) { const s = localStorage.getItem(tKey); if (s) { setText(s); return; } }
    setTextBusy(true);
    const fields = {
      titolo: project.titolo, tipologia: project.tipologia, zona: zoneOnly(project.addr ?? ''), contratto: rent ? 'Affitto' : 'Vendita',
      prezzo: hidePrice ? undefined : project.prezzo || undefined, mq: project.mq || undefined, locali: project.locali || undefined, camere: project.camere || undefined, bagni: project.bagni || undefined,
      piano: det.piano, classe_energetica: det.classe_energetica, stato: status !== 'disponibile' ? STATUS_LABELS[status][0] : undefined,
      descrizione: (project.descrizione ?? '').slice(0, 2500), telefono: brand?.phone || undefined, agenzia: brand?.agencyName || undefined,
      arredata: srcs.some(s => !!prima[s]),
    };
    const r = await authFetch('/api/platform/social-caption', { method: 'POST', body: JSON.stringify({ fields }) }).catch(() => null);
    const j = r?.ok ? await r.json().catch(() => null) : null;
    setTextBusy(false);
    if (j?.testo) { setText(j.testo); try { localStorage.setItem(tKey, j.testo); } catch { /* niente storage */ } }
    else setText(r?.status === 429 ? tr('Hai scritto molti testi oggi, riprova domani.', 'You wrote many texts today, try again tomorrow.') : tr('Non sono riuscito a scrivere il testo, tocca Rifai.', 'I could not write the text, tap Redo.'));
  };
  useEffect(() => { if (brand) void writeText(); }, [brand]); // eslint-disable-line react-hooks/exhaustive-deps
  const copy = async () => { try { await navigator.clipboard.writeText(text); setCopied(true); setTimeout(() => setCopied(false), 2400); } catch { /* niente appunti */ } };

  // esportazione: la grafica a grandezza vera, fuori dalla vista, poi PNG (o video)
  const render = async (kind: 'png' | 'video') => {
    const b = mk(cur, false, SIZES[fmt]);
    if (!b) throw new Error('not_ready');
    const el = buildPost(b);
    const wrap = document.createElement('div');
    wrap.style.cssText = `position:fixed;top:0;left:0;width:${b.size.w}px;height:${b.size.h}px;opacity:0;pointer-events:none;z-index:-1;`;
    wrap.appendChild(el); document.body.appendChild(wrap);
    try {
      await document.fonts.ready;
      await Promise.all(Array.from(el.querySelectorAll('img')).map(i => (i.complete ? null : new Promise(ok => { i.onload = i.onerror = ok; }))));
      await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
      const fit = !NO_COVER.includes(cur) && fmt === 'post';
      if (kind === 'png') return { blob: await exportToPng(el, b.size, { photoSrc: b.photo, fitCover: fit }) as Blob, ext: 'png' };
      return await exportStaticToVideo(el, b.size, { duration: 6, animStyle: 'slide-up', photoSrc: b.photo, fitCover: fit }) as { blob: Blob; ext: string };
    } finally { wrap.remove(); }
  };
  const name = (ext: string) => `${(project.titolo || project.nome || 'immobile').toLowerCase().normalize('NFD').replace(/[^\w]+/g, '-').replace(/^-|-$/g, '').slice(0, 40)}-${fmt === 'post' ? 'post' : 'storia'}.${ext}`;
  const save = (blob: Blob, file: string) => { const u = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = u; a.download = file; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 2000); };
  const run = async (what: 'png' | 'share' | 'video') => {
    if (busy) return;
    setBusy(what); setNote('');
    const t0 = performance.now();
    try {
      const { blob, ext } = await render(what === 'video' ? 'video' : 'png');
      console.info('[social] export', what, cur, fmt, `${Math.round(blob.size / 1024)} KB`, `${Math.round(performance.now() - t0)} ms`);
      const file = name(ext);
      if (what === 'share') {
        if (text) await navigator.clipboard?.writeText(text).catch(() => null);
        const f = new File([blob], file, { type: blob.type });
        try { await navigator.share({ files: [f] }); setNote(text ? tr('Il testo è copiato: incollalo nel post.', 'The text is copied: paste it in the post.') : ''); }
        catch (e) { if ((e as Error).name !== 'AbortError') { save(blob, file); setNote(tr('Immagine scaricata.', 'Image downloaded.')); } }
      } else { save(blob, file); setNote(what === 'video' ? tr('Video scaricato.', 'Video downloaded.') : tr('Immagine scaricata.', 'Image downloaded.')); }
    } catch (e) {
      console.error('social export', e);
      setNote(tr('Non sono riuscito a creare il file, riprova.', 'I could not create the file, please try again.'));
    }
    setBusy(null);
  };

  // misure: anteprima grande a sinistra, a destra grafiche, foto e testo; sotto i 1024 px una colonna sola
  const wide = vw >= 1024;
  const bigW = fmt === 'post' ? Math.min(wide ? 420 : vw - 64, 420) : Math.min(wide ? 330 : vw - 64, 300);
  const thumbW = wide ? 112 : Math.floor((vw - 80) / 3) - 8;
  const btn = 'flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold ease-smooth transition-colors disabled:opacity-50';

  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-0 backdrop-blur-sm sm:p-4" onClick={onClose}>
      <div className="flex h-full max-h-full w-full max-w-6xl flex-col overflow-hidden bg-white shadow-2xl sm:h-auto sm:max-h-[94vh] sm:rounded-[32px]" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 px-6 pb-3 pt-6">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight">{tr('Condividi sui social', 'Share on social media')}</h2>
            <p className="mt-1 text-sm text-muted">{tr('Scegli la grafica e la foto, poi scarica o condividi.', 'Choose the design and the photo, then download or share.')}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={tr('Chiudi', 'Close')} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-ink/70 hover:text-ink"><X size={16} /></button>
        </div>
        <div className="flex min-h-0 flex-1 flex-col gap-6 overflow-y-auto px-6 pb-6 lg:flex-row">
          {/* anteprima grande e azioni */}
          <div className="flex shrink-0 flex-col items-center gap-4 lg:sticky lg:top-0 lg:self-start">
            <div role="radiogroup" className="flex rounded-full bg-canvas p-1 text-sm">
              {(['post', 'story'] as const).map(f => (
                <button key={f} type="button" role="radio" aria-checked={fmt === f} onClick={() => setFmt(f)} className={`rounded-full px-4 py-1.5 font-semibold transition-colors duration-[600ms] ${fmt === f ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>
                  {f === 'post' ? tr('Post 4:5', 'Post 4:5') : tr('Storia 9:16', 'Story 9:16')}
                </button>
              ))}
            </div>
            <div className="overflow-hidden rounded-[24px] shadow-lg ring-1 ring-black/5">
              <PostView build={big} width={bigW} />
            </div>
            <div className="grid w-full grid-cols-[1fr_auto] gap-2 whitespace-nowrap" style={{ maxWidth: Math.max(bigW, 320) }}>
              {canShare && <button type="button" onClick={() => void run('share')} disabled={!big || !!busy} className={`${btn} col-span-2 bg-ink text-white hover:bg-brand`}>{busy === 'share' ? <Loader2 size={16} className="animate-spin" /> : <Share2 size={16} />} {tr('Condividi', 'Share')}</button>}
              <button type="button" onClick={() => void run('png')} disabled={!big || !!busy} className={`${btn} ${canShare ? 'bg-canvas text-ink hover:bg-line/60' : 'bg-ink text-white hover:bg-brand'}`}>{busy === 'png' ? <Loader2 size={16} className="animate-spin" /> : <Download size={16} />} {tr('Scarica immagine', 'Download image')}</button>
              <button type="button" onClick={() => void run('video')} disabled={!big || !!busy} title={tr('Video di 6 secondi con le scritte che entrano', '6 second video with animated text')} className={`${btn} bg-canvas text-ink hover:bg-line/60`}>{busy === 'video' ? <Loader2 size={16} className="animate-spin" /> : <Film size={16} />} {busy === 'video' ? tr('Preparo il video', 'Making the video') : tr('Video', 'Video')}</button>
            </div>
            {note && <p className="blur-in text-center text-sm text-muted">{note}</p>}
          </div>

          <div className="min-w-0 flex-1 space-y-6">
            <section>
              <h3 className="text-sm font-semibold">{tr('Scegli la grafica', 'Choose the design')}</h3>
              <div className="mt-2 flex flex-wrap gap-2">
                {list.map(t => (
                  <button key={t.id} type="button" onClick={() => setTpl(t.id)} title={t.label} className={`flex flex-col items-center gap-1 rounded-2xl p-1 ring-2 transition-shadow duration-[600ms] ${cur === t.id ? 'ring-brand' : 'ring-transparent hover:ring-black/15'}`}>
                    <span className="overflow-hidden rounded-xl"><PostView build={thumbs[t.id] ?? null} width={thumbW} /></span>
                    <span className="text-[11px] font-medium text-muted">{t.label}</span>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <h3 className="text-sm font-semibold">{tr('Scegli la foto', 'Choose the photo')}</h3>
              <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
                {photos.map((p, i) => (
                  <button key={p.src} type="button" onClick={() => setPi(i)} className={`relative h-20 w-28 shrink-0 overflow-hidden rounded-2xl ring-2 transition-shadow duration-[600ms] ${i === pi ? 'ring-brand' : 'ring-transparent hover:ring-black/15'}`}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.small} alt="" className="h-full w-full object-cover" />
                    {p.staged && <span className="absolute bottom-1.5 left-1.5 rounded-full bg-white/90 px-2 py-0.5 text-[10px] font-semibold text-ink">{tr('Arredata AI', 'AI staged')}</span>}
                  </button>
                ))}
                {photos.length < Math.min(srcs.length, 24) && <span className="flex h-20 w-28 shrink-0 animate-pulse rounded-2xl bg-canvas" />}
              </div>
              {photo?.staged && (
                <label className="mt-3 flex cursor-pointer items-center gap-2 text-sm">
                  <input type="checkbox" checked={label} onChange={e => setLabel(e.target.checked)} className="h-4 w-4 accent-[var(--color-brand,#537eec)]" />
                  {tr('Scritta “Immagine arredata virtualmente” sulla foto', 'Label “Immagine arredata virtualmente” on the photo')}
                </label>
              )}
            </section>

            <section>
              <h3 className="text-sm font-semibold">{tr('Il testo è pronto, copialo e incollalo nel post', 'The text is ready, copy it and paste it in the post')}</h3>
              <div className="relative mt-2">
                <textarea value={text} onChange={e => { setText(e.target.value); try { localStorage.setItem(tKey, e.target.value); } catch { /* niente storage */ } }} rows={9} maxLength={2200}
                  className="w-full resize-none rounded-2xl bg-canvas px-4 py-3 text-sm leading-relaxed outline-none ring-1 ring-transparent ease-smooth transition-[background-color,box-shadow] focus:bg-white focus:ring-brand" />
                {textBusy && <span className="absolute inset-0 flex items-center justify-center gap-2 rounded-2xl bg-canvas text-sm text-muted"><Loader2 size={16} className="animate-spin" /> {tr('Scrivo il testo', 'Writing the text')}</span>}
              </div>
              <div className="mt-2 flex gap-2">
                <button type="button" onClick={() => void copy()} disabled={!text || textBusy} className={`${btn} bg-ink text-white hover:bg-brand`}>{copied ? <Check size={16} /> : <Copy size={16} />} {copied ? tr('Copiato', 'Copied') : tr('Copia testo', 'Copy text')}</button>
                <button type="button" onClick={() => void writeText(true)} disabled={textBusy} className={`${btn} text-muted hover:bg-canvas hover:text-ink`}><RotateCcw size={15} /> {tr('Rifai', 'Redo')}</button>
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}
