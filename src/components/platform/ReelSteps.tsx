'use client';

import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { Check, ChevronLeft, ChevronRight, Coins, ImagePlus, Images, Loader2, Monitor, Plus, SunMedium, X } from 'lucide-react';
import { fetchMedia, type MediaItem } from './MediaView';
import { tr } from './i18n';
import { authFetch } from './api';

// Video dell'annuncio e Video Venduto o Affittato nella chat (05/10/2026): passi dentro il messaggio del video.
// Foto (solo annuncio) -> dati -> video (crediti solo a video pronto). Niente AI.
// Pensati per agenti poco digitali: poche scelte visibili, i dati in piu' sotto "Altri dati", sempre il costo vicino al pulsante.
export type ReelTpl = 'reel' | 'venduto';
export type ReelPhoto = { src: string; staged: boolean; key?: string }; // key: indirizzo di partenza (data: della chat), per riconoscerla dopo il caricamento
export type ReelState = {
  tpl: ReelTpl; photos: ReelPhoto[]; title: string; place: string; price: string; mq: string; rooms: string; days: string;
  contract: 'vendita' | 'affitto'; style: 'vivace' | 'elegante'; enhance: boolean; more?: boolean;
  uploading?: number;
  redo?: string | null; redosLeft?: number; editing?: boolean; // dopo il video: correggere i testi e' gratis
};
export const MAX_REEL_PHOTOS = 8;

const field = 'h-11 w-full min-w-0 rounded-2xl bg-canvas px-4 text-[15px] outline-none ring-1 ring-inset ring-transparent placeholder:text-muted/60 focus:bg-white focus:ring-brand/50';
function Seg<T extends string>({ value, options, onChange }: { value: T; options: [T, string][]; onChange: (v: T) => void }) {
  return (
    <div role="radiogroup" className="inline-flex rounded-full bg-canvas p-1">
      {options.map(([v, l]) => (
        <button key={v} type="button" role="radio" aria-checked={value === v} onClick={() => onChange(v)}
          className={`h-9 rounded-full px-4 pb-px text-[13px] font-semibold leading-none ease-smooth transition-colors ${value === v ? 'bg-ink text-white shadow-sm' : 'text-ink/70 hover:text-ink'}`}>{l}</button>
      ))}
    </div>
  );
}
// Numeri con i punti delle migliaia mentre si scrive (3400000 -> 3.400.000). Nello stato solo cifre; incollando
// "3.400.000 €" o "3400000,00" restano le cifre prima della virgola. Il cursore resta dopo la stessa cifra.
const dots = (d: string) => d.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const digitsOf = (t: string) => t.split(',')[0].replace(/\D/g, '').replace(/^0+(?=\d)/, '').slice(0, 10);
function NumField({ value, onChange, placeholder, suffix }: { value: string; onChange: (digits: string) => void; placeholder?: string; suffix?: string }) {
  const el = useRef<HTMLInputElement>(null);
  const caret = useRef<number | null>(null); // cifre prima del cursore, da rimettere dopo la riformattazione
  const shown = dots(digitsOf(value));
  useLayoutEffect(() => {
    const n = caret.current, i = el.current;
    if (n === null || !i || document.activeElement !== i) return;
    caret.current = null;
    let pos = 0, seen = 0;
    while (pos < shown.length && seen < n) { if (/\d/.test(shown[pos])) seen++; pos++; }
    i.setSelectionRange(pos, pos);
  });
  return (
    <div className="relative">
      <input ref={el} type="text" inputMode="numeric" autoComplete="off" value={shown} placeholder={placeholder}
        onChange={e => { const t = e.target.value, at = e.target.selectionStart ?? t.length; caret.current = digitsOf(t.slice(0, at)).length; onChange(digitsOf(t)); }}
        className={`${field} ${suffix ? 'pr-20' : ''}`} />
      {suffix && <span className="pointer-events-none absolute inset-y-0 right-4 flex items-center text-[15px] text-muted">{suffix}</span>}
    </div>
  );
}
function Label({ children }: { children: React.ReactNode }) { return <span className="block px-1 pb-1.5 text-xs font-medium text-muted">{children}</span>; }

// Passo foto (solo Video dell'annuncio): la prima apre il video; aggiungere, togliere, spostare su e giu'
// stessa foto anche con indirizzi diversi (data: della chat poi messa online): key = indirizzo di partenza
const same = (a: ReelPhoto, b: ReelPhoto) => a.src === b.src || (a.key ?? a.src) === (b.key ?? b.src) || a.src === b.key || a.key === b.src;
const DRAG_MS = 220; // trascinamento: le altre miniature si spostano in fretta (600 ms sembrava lento sotto il dito)

export function ReelPhotos({ r, suggestions, onChange, onAdd, onPick, onNext }: { r: ReelState; suggestions: ReelPhoto[]; onChange: (p: Partial<ReelState>) => void; onAdd: (files: File[]) => void; onPick: (p: ReelPhoto) => void; onNext: () => void }) {
  const input = useRef<HTMLInputElement>(null);
  const [choose, setChoose] = useState(false); // la card "Aggiungi" diventa due pulsanti: dispositivo o galleria
  const [gallery, setGallery] = useState(false);
  const reorder = (from: number, to: number) => { if (from === to) return; const p = [...r.photos]; const [x] = p.splice(from, 1); p.splice(to, 0, x); onChange({ photos: p }); };
  const full = r.photos.length + (r.uploading ?? 0) >= MAX_REEL_PHOTOS;
  const more = suggestions.filter(s => !r.photos.some(p => same(p, s)));
  // Trascinamento con il mouse o con il dito (pointer events: l'API drag di HTML5 sul telefono non va).
  // Parte dopo 6 px di movimento, cosi' tocchi, X e frecce restano normali; le altre miniature fanno posto.
  const tiles = useRef<(HTMLDivElement | null)[]>([]);
  type Drag = { from: number; to: number; dx: number; dy: number; rects: DOMRect[]; drop?: boolean };
  const [drag, setDragState] = useState<Drag | null>(null);
  const cur = useRef<Drag | null>(null); // stato vero del trascinamento (gli eventi arrivano piu' in fretta dei render)
  const setDrag = (d: Drag | null) => { cur.current = d; setDragState(d); };
  const press = useRef<{ k: number; x: number; y: number; id: number } | null>(null);
  const [still, setStill] = useState(false); // subito dopo il rilascio: niente transizioni (le miniature sono gia' al loro posto)
  const start = (k: number, dx: number, dy: number) => ({ from: k, to: k, dx, dy, rects: tiles.current.slice(0, r.photos.length).map(t => t!.getBoundingClientRect()) });
  // col dito la striscia scorre: il trascinamento parte solo tenendo premuto (300 ms) senza muoversi
  const hold = useRef<ReturnType<typeof setTimeout> | null>(null);
  const row = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = row.current;
    if (!el) return;
    const tm = (e: TouchEvent) => { if (cur.current) e.preventDefault(); }; // durante il trascinamento la striscia non scorre
    el.addEventListener('touchmove', tm, { passive: false });
    return () => el.removeEventListener('touchmove', tm);
  }, []);
  const down = (k: number) => (e: React.PointerEvent<HTMLDivElement>) => {
    if ((e.target as HTMLElement).closest('button') || r.photos.length < 2 || cur.current) return;
    press.current = { k, x: e.clientX, y: e.clientY, id: e.pointerId };
    if (e.pointerType === 'touch') {
      const el = e.currentTarget, id = e.pointerId;
      hold.current = setTimeout(() => { hold.current = null; if (press.current?.id !== id) return; try { el.setPointerCapture(id); } catch { /* gia' rilasciato */ } navigator.vibrate?.(15); setDrag(start(k, 0, 0)); }, 300);
    }
  };
  const target = (d: Drag, dx: number, dy: number) => {
    const c = d.rects[d.from], cx = c.left + c.width / 2 + dx, cy = c.top + c.height / 2 + dy;
    let to = d.from, best = Infinity;
    d.rects.forEach((q, n) => { const dist = Math.hypot(q.left + q.width / 2 - cx, q.top + q.height / 2 - cy); if (dist < best) { best = dist; to = n; } });
    return to;
  };
  const moveP = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = press.current;
    if (!p || p.id !== e.pointerId) return;
    const dx = e.clientX - p.x, dy = e.clientY - p.y;
    let d = cur.current;
    if (!d) {
      if (Math.hypot(dx, dy) < 6) return;
      if (e.pointerType === 'touch') { if (hold.current) { clearTimeout(hold.current); hold.current = null; } press.current = null; return; } // si muove subito: sta scorrendo
      e.currentTarget.setPointerCapture(e.pointerId);
      d = start(p.k, dx, dy);
    }
    if (d.drop) return;
    setDrag({ ...d, dx, dy, to: target(d, dx, dy) });
  };
  const up = (e: React.PointerEvent<HTMLDivElement>) => {
    const p = press.current, d = cur.current;
    if (hold.current) { clearTimeout(hold.current); hold.current = null; }
    if (!p || p.id !== e.pointerId) return;
    press.current = null;
    if (!d || d.drop) return;
    // la miniatura scivola nel suo posto nuovo, poi l'ordine si salva
    const a = d.rects[d.from], b = d.rects[d.to];
    setDrag({ ...d, drop: true, dx: b.left - a.left, dy: b.top - a.top });
    setTimeout(() => { setStill(true); reorder(d.from, d.to); setDrag(null); requestAnimationFrame(() => requestAnimationFrame(() => setStill(false))); }, DRAG_MS);
  };
  // dove sta ogni miniatura durante il trascinamento
  const shift = (k: number) => {
    if (!drag) return undefined;
    if (k === drag.from) return { transform: `translate(${drag.dx}px, ${drag.dy}px) scale(${drag.drop ? 1 : 1.04})`, transition: drag.drop ? `transform ${DRAG_MS}ms cubic-bezier(.2,.8,.2,1), box-shadow ${DRAG_MS}ms` : 'none', zIndex: 20, boxShadow: drag.drop ? undefined : '0 18px 40px -12px rgba(0,0,0,.35)' };
    const n = k > drag.from && k <= drag.to ? k - 1 : k < drag.from && k >= drag.to ? k + 1 : k;
    const a = drag.rects[k], b = drag.rects[n];
    return { transform: `translate(${b.left - a.left}px, ${b.top - a.top}px)`, transition: `transform ${DRAG_MS}ms cubic-bezier(.2,.8,.2,1)` };
  };
  return (
    <div className="px-1">
      {/* striscia orizzontale che scorre: le foto non vanno mai a capo */}
      <div ref={row} className="-mx-1 flex gap-2.5 overflow-x-auto px-1 py-2 [scrollbar-width:thin]">
        {r.photos.map((p, k) => (
          <div key={p.key ?? p.src} ref={el => { tiles.current[k] = el; }} onPointerDown={down(k)} onPointerMove={moveP} onPointerUp={up} onPointerCancel={up}
            style={{ ...shift(k), ...(drag?.from === k ? { touchAction: 'none' } : {}), ...(still ? { transition: 'none' } : {}) }}
            className={`relative aspect-[3/4] w-[132px] shrink-0 select-none sm:w-[168px] overflow-hidden rounded-[20px] bg-canvas shadow-sm ring-1 ring-black/5 ${r.photos.length > 1 ? (drag?.from === k ? 'cursor-grabbing' : 'cursor-grab') : ''} ${drag ? '' : 'rise'}`}>
            <img src={p.src} alt="" draggable={false} className="pointer-events-none h-full w-full object-cover" />
            {/* la prima apre il video: striscia "Apertura" in alto, le altre il loro numero */}
            {k === 0 ? <span className="absolute inset-x-0 top-0 flex h-6 items-center justify-center bg-brand text-[11px] font-semibold text-white">{tr('Apertura', 'Opening')}</span>
              : <span className="absolute left-1.5 top-1.5 flex h-6 min-w-6 items-center justify-center rounded-full bg-white/95 px-1.5 text-xs font-bold text-ink shadow-sm">{k + 1}</span>}
            {p.staged && <span className="absolute inset-x-0 bottom-0 flex h-5 items-center justify-center bg-ink/75 text-[10px] font-semibold text-white">{tr('Arredata', 'Staged')}</span>}
            {r.photos.length > 1 && <button type="button" aria-label={tr('Togli', 'Remove')} onClick={() => onChange({ photos: r.photos.filter((_, n) => n !== k) })}
              className={`absolute right-1.5 flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm hover:bg-white ${k === 0 ? 'top-7' : 'top-1.5'}`}><X size={14} /></button>}
            {/* frecce una accanto all'altra (sul telefono le miniature sono strette), sopra la striscia "Arredata" */}
            <div className={`absolute right-1.5 flex gap-1 ${p.staged ? 'bottom-6' : 'bottom-1.5'}`}>
              {k > 0 && <button type="button" aria-label={tr('Sposta prima', 'Move earlier')} onClick={() => reorder(k, k - 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm hover:bg-white"><ChevronLeft size={15} /></button>}
              {k < r.photos.length - 1 && <button type="button" aria-label={tr('Sposta dopo', 'Move later')} onClick={() => reorder(k, k + 1)} className="flex h-7 w-7 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm hover:bg-white"><ChevronRight size={15} /></button>}
            </div>
          </div>
        ))}
        {Array.from({ length: r.uploading ?? 0 }, (_, k) => <div key={`u${k}`} className="flex aspect-[3/4] w-[132px] shrink-0 items-center sm:w-[168px] justify-center rounded-[20px] bg-canvas"><Loader2 size={18} className="animate-spin text-muted" /></div>)}
        {!full && (choose
          ? <div className="blur-in flex aspect-[3/4] w-[132px] shrink-0 flex-col sm:w-[168px] gap-2 rounded-[20px] border-2 border-dashed border-brand/50 p-2">
              <button type="button" onClick={() => { setChoose(false); input.current?.click(); }} className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[14px] bg-canvas px-1 text-center text-[12px] font-semibold leading-tight text-ink ease-smooth transition-colors hover:bg-brand hover:text-white"><Monitor size={16} />{tr('Dal dispositivo', 'From device')}</button>
              <button type="button" onClick={() => { setChoose(false); setGallery(true); }} className="flex flex-1 flex-col items-center justify-center gap-1 rounded-[14px] bg-canvas px-1 text-center text-[12px] font-semibold leading-tight text-ink ease-smooth transition-colors hover:bg-brand hover:text-white"><Images size={16} />{tr('Dalla galleria', 'From gallery')}</button>
            </div>
          : <button type="button" onClick={() => setChoose(true)} className="flex aspect-[3/4] w-[132px] shrink-0 flex-col items-center justify-center gap-2 rounded-[20px] border-2 sm:w-[168px] border-dashed border-line px-2 text-center text-[13px] font-semibold text-ink/80 ease-smooth transition-colors hover:border-brand/60 hover:text-brand">
              <ImagePlus size={22} />{tr('Aggiungi altre foto della casa', 'Add more photos of the home')}
            </button>
        )}
      </div>
      <input ref={input} type="file" accept="image/*" multiple className="hidden" onChange={e => { const f = Array.from(e.target.files ?? []); e.target.value = ''; if (f.length) onAdd(f); }} />
      {gallery && <GalleryPicker max={MAX_REEL_PHOTOS - r.photos.length - (r.uploading ?? 0)} exclude={r.photos.flatMap(p => [p.src, p.key ?? p.src])} onClose={() => setGallery(false)}
        onAdd={list => { setGallery(false); onChange({ photos: [...r.photos, ...list].slice(0, MAX_REEL_PHOTOS) }); }} />}
      {more.length > 0 && !full && (
        <div className="pt-4">
          <Label>{tr('Tocca per aggiungere', 'Tap to add')}</Label>
          <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
            {more.map(s => (
              <button key={s.key ?? s.src} type="button" onClick={() => onPick(s)} className="relative h-24 w-[72px] shrink-0 overflow-hidden rounded-2xl bg-canvas ring-1 ring-black/5 ease-smooth transition-transform hover:scale-[1.03]">
                <img src={s.src} alt="" className="h-full w-full object-cover" />
                <span className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-white/95 text-ink shadow-sm"><Plus size={12} /></span>
                {s.staged && <span className="absolute bottom-1 left-1 rounded-full bg-ink/80 px-1.5 py-px text-[9px] font-semibold text-white">{tr('Arredata', 'Staged')}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 pt-4">
        <button type="button" disabled={!!r.uploading} onClick={onNext} className="flex h-11 shrink-0 items-center gap-1.5 rounded-full bg-ink px-6 text-[13px] font-semibold text-white ease-smooth transition-colors hover:bg-brand disabled:opacity-40">{tr('Avanti', 'Next')}</button>
        <span className="min-w-0 text-xs text-muted">{tr(`${r.photos.length} di ${MAX_REEL_PHOTOS} foto, meglio almeno 3`, `${r.photos.length} of ${MAX_REEL_PHOTOS} photos, best with at least 3`)}</span>
      </div>
    </div>
  );
}

// Passo dati: Vendita/Affitto, titolo, zona, prezzo; mq e locali sotto "Altri dati". Venduto: zona e giorni, foto cambiabile
export function ReelData({ r, cost, onChange, onCreate, onSwapPhoto }: { r: ReelState; cost: number; onChange: (p: Partial<ReelState>) => void; onCreate: () => void; onSwapPhoto: (f: File) => void }) {
  const input = useRef<HTMLInputElement>(null);
  const set = (p: Partial<ReelState>) => onChange(p);
  // logo dal profilo (stessa fonte del sito): se manca si dice dove aggiungerlo; si riguarda a ogni apertura del passo
  const [noLogo, setNoLogo] = useState(false);
  useEffect(() => { authFetch('/api/platform/site').then(r => (r.ok ? r.json() : null)).then((d: { logo?: string | null; config?: { logo?: string } } | null) => setNoLogo(!!d && !d.config?.logo && !d.logo)).catch(() => {}); }, []);
  const rent = r.contract === 'affitto', sold = r.tpl === 'venduto';
  return (
    <div className="px-1">
      <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
        <div className="grid min-w-0 gap-4">
          <div className="flex flex-wrap items-center gap-3">
            <Seg value={r.contract} onChange={v => set({ contract: v })} options={sold ? [['vendita', tr('Venduto', 'Sold')], ['affitto', tr('Affittato', 'Rented')]] : [['vendita', tr('Vendita', 'For sale')], ['affitto', tr('Affitto', 'For rent')]]} />
          </div>
          {!sold && <label className="block"><Label>{tr('Titolo', 'Title')}</Label><input value={r.title} maxLength={80} onChange={e => set({ title: e.target.value })} placeholder={tr('es. Trilocale con terrazzo', 'e.g. Two-bedroom flat with terrace')} className={field} /></label>}
          <label className="block"><Label>{tr('Quartiere e città', 'Area and city')}</Label><input value={r.place} maxLength={60} onChange={e => set({ place: e.target.value })} placeholder={tr('es. Vomero, Napoli', 'e.g. Vomero, Naples')} className={field} /></label>
          {!sold && <label className="block"><Label>{rent ? tr('Canone al mese', 'Monthly rent') : tr('Prezzo', 'Price')}</Label><NumField value={r.price} onChange={v => set({ price: v })} placeholder={rent ? tr('es. 850', 'e.g. 850') : tr('es. 320.000', 'e.g. 320.000')} suffix={rent ? tr('€ al mese', '€ a month') : '€'} /></label>}
          {sold && <label className="block"><Label>{rent ? tr('Affittato in quanti giorni? (facoltativo)', 'Rented in how many days? (optional)') : tr('Venduto in quanti giorni? (facoltativo)', 'Sold in how many days? (optional)')}</Label><input value={r.days} maxLength={4} inputMode="numeric" onChange={e => set({ days: e.target.value.replace(/[^\d]/g, '') })} placeholder={tr('es. 23', 'e.g. 23')} className={field} /></label>}
          {!sold && (r.more
            ? <div className="grid grid-cols-2 gap-3">
                <label className="block"><Label>{tr('Metri quadri', 'Square metres')}</Label><NumField value={r.mq} onChange={v => set({ mq: v.slice(0, 5) })} placeholder="85" suffix="m²" /></label>
                <label className="block"><Label>{tr('Locali', 'Rooms')}</Label><input value={r.rooms} maxLength={2} inputMode="numeric" onChange={e => set({ rooms: e.target.value.replace(/\D/g, '') })} placeholder="3" className={field} /></label>
              </div>
            : <button type="button" onClick={() => onChange({ more: true })} className="flex w-fit items-center gap-1 px-1 text-[13px] font-semibold text-brand"><Plus size={14} />{tr('Altri dati', 'More details')}</button>)}
        </div>
        {sold && (
          <div className="flex flex-col items-center gap-2 sm:w-40">
            <img src={r.photos[0]?.src} alt="" className="aspect-[3/4] w-32 rounded-[20px] object-cover shadow-sm ring-1 ring-black/5 sm:w-full" />
            <button type="button" onClick={() => input.current?.click()} className="h-9 rounded-full bg-white px-4 text-[13px] font-semibold text-ink shadow-sm ring-1 ring-inset ring-black/10 hover:bg-canvas">{tr('Usa un’altra foto', 'Use another photo')}</button>
            <input ref={input} type="file" accept="image/*" className="hidden" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) onSwapPhoto(f); }} />
          </div>
        )}
      </div>
      <div className="mt-5 grid gap-3 rounded-3xl bg-canvas p-3 sm:flex sm:items-center sm:justify-between">
        <div className="flex items-center gap-3"><span className="pl-1 text-xs font-medium text-muted">{tr('Stile', 'Style')}</span><Seg value={r.style} onChange={v => set({ style: v })} options={[['vivace', tr('Vivace', 'Lively')], ['elegante', tr('Elegante', 'Elegant')]]} /></div>
        <label className="flex cursor-pointer items-center gap-2.5 px-1 text-[13px] font-medium">
          <SunMedium size={16} className="text-muted" />{tr('Migliora la luce', 'Improve the light')}
          <input type="checkbox" checked={r.enhance} onChange={e => set({ enhance: e.target.checked })} className="peer sr-only" />
          <span className="relative h-6 w-10 rounded-full bg-black/15 ease-smooth transition-colors after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow-sm after:ease-smooth after:transition-transform peer-checked:bg-brand peer-checked:after:translate-x-4" />
        </label>
      </div>
      {noLogo && <p className="blur-in mt-4 rounded-2xl bg-brand/5 px-4 py-3 text-[13px] text-ink/80">{tr('Il tuo logo non c’è ancora, ', 'Your logo is not there yet, ')}<a href="#/profilo" className="font-semibold text-brand underline-offset-2 hover:underline">{tr('aggiungilo nel profilo', 'add it in your profile')}</a>{tr(' per vederlo a fine video.', ' to see it at the end of the video.')}</p>}
      <div className="flex flex-col items-start gap-2 pt-5">
        <button type="button" disabled={!!r.uploading} onClick={onCreate} className="flex h-12 items-center gap-2 rounded-full bg-ink px-7 text-[14px] font-semibold text-white ease-smooth transition-colors hover:bg-brand disabled:opacity-40">
          {r.editing ? tr('Rifai il video, gratis', 'Redo the video, free') : <>{tr(`Crea il video, ${cost} crediti`, `Create the video, ${cost} credits`)}<Coins size={14} className="opacity-80" /></>}
        </button>
        {r.editing && <span className="px-1 text-xs text-muted">{tr(`Correzioni gratis rimaste: ${r.redosLeft ?? 0}`, `Free fixes left: ${r.redosLeft ?? 0}`)}</span>}
      </div>
    </div>
  );
}

// Foto dalla Galleria della piattaforma (stessa fonte di MediaView): solo foto, risultati AI = "Arredata".
// Selezione multipla con spunta, al massimo le foto che mancano per arrivare a 8.
function GalleryPicker({ max, exclude, onAdd, onClose }: { max: number; exclude: string[]; onAdd: (p: ReelPhoto[]) => void; onClose: () => void }) {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [sel, setSel] = useState<string[]>([]);
  useEffect(() => { void fetchMedia().then(list => setItems(list.filter(x => !x.video && !x.pending && x.dopo && !exclude.includes(x.dopo)))); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const toggle = (src: string) => setSel(v => (v.includes(src) ? v.filter(x => x !== src) : v.length < max ? [...v, src] : v));
  return createPortal(
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="flex max-h-full w-full max-w-3xl flex-col overflow-hidden rounded-[32px] bg-white p-6 shadow-2xl" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl font-bold tracking-tight">{tr('Dalla galleria', 'From the gallery')}</h2>
            <p className="mt-1 text-sm text-muted">{tr(`Tocca le foto da aggiungere, al massimo ${max}.`, `Tap the photos to add, up to ${max}.`)}</p>
          </div>
          <button type="button" onClick={onClose} aria-label={tr('Chiudi', 'Close')} className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-canvas text-ink/70 hover:text-ink"><X size={16} /></button>
        </div>
        <div className="mt-4 min-h-[240px] overflow-y-auto rounded-[24px] bg-canvas p-2">
          {!items ? <div className="flex h-56 items-center justify-center"><Loader2 size={20} className="animate-spin text-muted" /></div>
            : !items.length ? <p className="flex h-56 items-center justify-center px-6 text-center text-sm text-muted">{tr('In galleria non ci sono ancora foto.', 'There are no photos in the gallery yet.')}</p>
            : <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {items.map(it => {
                  const on = sel.includes(it.dopo), n = sel.indexOf(it.dopo) + 1;
                  return (
                    <button key={it.id} type="button" aria-pressed={on} onClick={() => toggle(it.dopo)} className={`relative aspect-square overflow-hidden rounded-[18px] bg-white ${on ? 'outline outline-[3px] -outline-offset-[3px] outline-brand' : 'ring-1 ring-inset ring-black/5'}`}>
                      <img src={it.dopo} alt="" loading="lazy" className="h-full w-full object-cover" />
                      <span className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full text-[11px] font-bold shadow-sm ${on ? 'bg-brand text-white' : 'bg-white/90 text-transparent'}`}>{on ? n : <Check size={12} />}</span>
                      <span className="absolute bottom-2 left-2 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-semibold text-white">{tr('Arredata', 'Staged')}</span>
                    </button>
                  );
                })}
              </div>}
        </div>
        <div className="flex items-center justify-end gap-3 pt-4">
          <button type="button" onClick={onClose} className="h-11 rounded-full px-5 text-[13px] font-semibold text-ink/70 hover:bg-canvas">{tr('Annulla', 'Cancel')}</button>
          <button type="button" disabled={!sel.length} onClick={() => onAdd(sel.map(src => ({ src, staged: true })))} className="h-11 rounded-full bg-ink px-6 text-[13px] font-semibold text-white ease-smooth transition-colors hover:bg-brand disabled:opacity-40">
            {sel.length === 1 ? tr('Aggiungi 1 foto', 'Add 1 photo') : tr(`Aggiungi ${sel.length || ''} foto`.replace('  ', ' '), `Add ${sel.length || ''} photos`.replace('  ', ' '))}
          </button>
        </div>
      </div>
    </div>, document.body);
}
