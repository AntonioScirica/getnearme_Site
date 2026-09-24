'use client';

import { useEffect, useRef, useState, type FormEvent } from 'react';
import { Check, Facebook, Instagram, Loader2, Mail, MessageCircle, Phone, Printer, Share2 } from 'lucide-react';
import { ESSENTIALS, GROUPS, type Field } from '@/lib/propertyFields';
import type { SiteProperty } from '@/lib/siteTemplates';
import { contacts, H, useSite } from './ui';

// Parti aggiunte sul modello dei siti di agenzia di zona (es. casalconero.com): barra contatti,
// WhatsApp fisso, modulo di contatto vero, dettagli e caratteristiche dell'immobile, mappa, servizi.

export function TopBar() {
  const { cfg } = useSite();
  if (!cfg.topBar || (!cfg.phone && !cfg.email)) return null;
  return (
    <div className="bg-[var(--c)] text-[13px] text-white">
      <div className="mx-auto flex h-9 max-w-[1240px] items-center gap-5 px-6 md:px-10">
        {cfg.phone && <a href={`tel:${cfg.phone.replace(/\s/g, '')}`} className="flex items-center gap-1.5 hover:opacity-80"><Phone size={13} />{cfg.phone}</a>}
        {cfg.email && <a href={`mailto:${cfg.email}`} className="hidden items-center gap-1.5 hover:opacity-80 sm:flex"><Mail size={13} />{cfg.email}</a>}
        <span className="ml-auto flex items-center gap-3">
          {cfg.facebook && <a href={cfg.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="hover:opacity-80"><Facebook size={14} /></a>}
          {cfg.instagram && <a href={cfg.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="hover:opacity-80"><Instagram size={14} /></a>}
        </span>
      </div>
    </div>
  );
}

export function WhatsAppFloat() {
  const { cfg, preview } = useSite();
  const c = contacts(cfg);
  if (!cfg.whatsappButton || !c.wa) return null;
  return (
    <a href={preview ? undefined : c.wa} target="_blank" rel="noreferrer" aria-label="Scrivimi su WhatsApp"
      className={`${preview ? 'absolute' : 'fixed'} bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_10px_30px_-5px_rgba(37,211,102,.6)] transition-transform duration-500 hover:scale-110`}>
      <MessageCircle size={26} fill="currentColor" className="text-white" />
    </a>
  );
}

// Modulo di contatto: la richiesta arriva per email all'agente (/api/site/lead)
export function ContactForm({ property, compact }: { property?: SiteProperty; compact?: boolean }) {
  const { preview, base } = useSite();
  const [state, setState] = useState<'idle' | 'sending' | 'ok' | 'err'>('idle');
  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (preview) { setState('ok'); return; }
    const fd = Object.fromEntries(new FormData(e.currentTarget));
    setState('sending');
    const slug = base.split('/').filter(Boolean).pop();
    const r = await fetch('/api/site/lead', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...fd, slug, propertyId: property?.id }) }).catch(() => null);
    setState(r?.ok ? 'ok' : 'err');
  };
  if (state === 'ok') return (
    <div className="flex flex-col items-center gap-3 rounded-[var(--r)] bg-[var(--soft)] px-6 py-10 text-center">
      <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--c)] text-white"><Check /></span>
      <div className="font-semibold">Richiesta inviata</div><p className="text-sm text-[var(--muted)]">Ti rispondo al più presto.</p>
    </div>
  );
  const field = 'h-11 w-full rounded-[calc(var(--r)*0.6)] border border-[var(--line)] bg-[var(--surface)] px-3.5 text-sm outline-none transition-colors focus:border-[var(--c)]';
  return (
    <form onSubmit={submit} className="space-y-3">
      <div className={compact ? 'space-y-3' : 'grid gap-3 sm:grid-cols-2'}>
        <input name="name" required maxLength={80} placeholder="Nome e cognome *" className={field} />
        <input name="phone" required maxLength={30} placeholder="Telefono *" className={field} />
      </div>
      <input name="email" type="email" required maxLength={120} placeholder="Email *" className={field} />
      <textarea name="message" rows={compact ? 3 : 5} maxLength={2000} defaultValue={property ? `Vorrei informazioni su "${property.titolo}"${property.riferimento ? ` (rif. ${property.riferimento})` : ''}.` : ''} placeholder="Il tuo messaggio" className={`${field} h-auto resize-none py-3`} />
      {/* campo trappola per i bot */}
      <input name="website" tabIndex={-1} autoComplete="off" className="hidden" aria-hidden />
      <label className="flex items-start gap-2 text-xs text-[var(--muted)]"><input type="checkbox" name="privacy" required className="mt-0.5 accent-[var(--c)]" /> Ho letto e accetto l’informativa privacy e acconsento a essere ricontattato.</label>
      <button disabled={state === 'sending'} className="flex h-12 w-full items-center justify-center gap-2 rounded-[calc(var(--r)*0.6)] bg-[var(--c)] text-sm font-semibold text-[var(--on-c,#fff)] transition hover:brightness-110 disabled:opacity-60">
        {state === 'sending' && <Loader2 size={15} className="animate-spin" />} Invia richiesta
      </button>
      {state === 'err' && <p className="text-sm text-rose-600">Invio non riuscito, riprova o chiamami.</p>}
    </form>
  );
}

// Dettagli e caratteristiche dall'unico schema dei campi (lib/propertyFields)
const ALL: Field[] = [...ESSENTIALS, ...GROUPS.flatMap(g => g.fields)];
const SKIP = new Set(['indirizzo', 'mostra_indirizzo', 'trattativa_riservata', 'prezzo', 'contratto', 'tipologia', 'superficie', 'locali', 'camere', 'bagni']);
const fmt = (f: Field, v: unknown) => (typeof v === 'boolean' ? (v ? 'Sì' : 'No') : `${v}${f.unit ? ` ${f.unit}` : ''}`);

export function DetailsTable({ p }: { p: SiteProperty }) {
  const d = p.details ?? {};
  const rows: [string, string][] = [
    ...(p.riferimento ? [['Codice', p.riferimento] as [string, string]] : []),
    ['Tipologia', p.tipologia?.split('|')[0] || '—'],
    ...(p.mq ? [['Superficie', `${p.mq} m²`] as [string, string]] : []),
    ...(p.locali ? [['Locali', String(p.locali)] as [string, string]] : []),
    ...(p.camere ? [['Camere', String(p.camere)] as [string, string]] : []),
    ...(p.bagni ? [['Bagni', String(p.bagni)] as [string, string]] : []),
    ...ALL.filter(f => !SKIP.has(f.key) && f.type !== 'multi' && d[f.key] !== undefined && d[f.key] !== '' && d[f.key] !== false).map(f => [f.label, fmt(f, d[f.key])] as [string, string]),
  ];
  return (
    <div>
      <H className="text-3xl">Dettagli</H>
      <dl className="mt-5 grid overflow-hidden rounded-[var(--r)] ring-1 ring-[var(--line)] sm:grid-cols-2">
        {rows.map(([k, v]) => <div key={k} className="flex justify-between gap-4 border-b border-[var(--line)] px-4 py-3 text-sm sm:odd:border-r"><dt className="text-[var(--muted)]">{k}</dt><dd className="text-right font-medium">{v}</dd></div>)}
      </dl>
    </div>
  );
}

export function FeatureList({ p }: { p: SiteProperty }) {
  const d = p.details ?? {};
  const items = ALL.filter(f => f.type === 'multi').flatMap(f => (Array.isArray(d[f.key]) ? (d[f.key] as string[]) : []));
  if (!items.length) return null;
  return (
    <div>
      <H className="text-3xl">Caratteristiche</H>
      <ul className="mt-5 grid gap-x-6 gap-y-3 sm:grid-cols-2 md:grid-cols-3">{items.map(x => <li key={x} className="flex items-center gap-2.5 text-sm"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--c)_15%,transparent)] text-[var(--c)]"><Check size={12} /></span>{x}</li>)}</ul>
    </div>
  );
}

// Mappa della zona (Leaflet, gratis). Cerchio e non puntino: la posizione esatta resta riservata.
export function MapBlock({ addr }: { addr: string }) {
  const el = useRef<HTMLDivElement>(null);
  const [none, setNone] = useState(false);
  useEffect(() => {
    let map: import('leaflet').Map | null = null, stop = false;
    (async () => {
      if (!document.getElementById('leaflet-css')) Object.assign(document.head.appendChild(document.createElement('link')), { id: 'leaflet-css', rel: 'stylesheet', href: 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css' });
      const r = await fetch(`https://nominatim.openstreetmap.org/search?format=json&limit=1&countrycodes=it&q=${encodeURIComponent(addr)}`).then(x => x.json()).catch(() => null) as { lat: string; lon: string }[] | null;
      if (stop || !el.current) return;
      if (!r?.[0]) { setNone(true); return; }
      const mod = await import('leaflet'); const L = (mod.default ?? mod) as typeof import('leaflet');
      const ll: [number, number] = [Number(r[0].lat), Number(r[0].lon)];
      map = L.map(el.current, { scrollWheelZoom: false, attributionControl: true }).setView(ll, 15);
      map.attributionControl.setPrefix(false);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 16, maxZoom: 18, attribution: '© Esri, OpenStreetMap' }).addTo(map);
      L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Reference/MapServer/tile/{z}/{y}/{x}', { maxNativeZoom: 16, maxZoom: 18 }).addTo(map);
      const c = getComputedStyle(el.current).getPropertyValue('--c') || '#333';
      L.circle(ll, { radius: 250, color: c, fillColor: c, fillOpacity: 0.18, weight: 2 }).addTo(map);
    })();
    return () => { stop = true; map?.remove(); };
  }, [addr]);
  if (none) return null;
  return (
    <div>
      <H className="text-3xl">Posizione</H>
      <div ref={el} className="relative z-0 mt-5 h-[340px] overflow-hidden rounded-[var(--r)] bg-[var(--soft)]" />
      <p className="mt-2 text-xs text-[var(--muted)]">Zona indicativa, l’indirizzo esatto te lo do su richiesta.</p>
    </div>
  );
}

export function ShareBar({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);
  const share = async () => {
    if (navigator.share) { await navigator.share({ title, url: location.href }).catch(() => {}); return; }
    await navigator.clipboard.writeText(location.href); setCopied(true); setTimeout(() => setCopied(false), 1500);
  };
  const btn = 'flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium ring-1 ring-[var(--line)] transition-colors hover:ring-[var(--fg)] print:hidden';
  return (
    <div className="flex gap-2">
      <button onClick={share} className={btn}>{copied ? <Check size={15} /> : <Share2 size={15} />}{copied ? 'Link copiato' : 'Condividi'}</button>
      <button onClick={() => print()} className={btn}><Printer size={15} /> Stampa</button>
    </div>
  );
}

// Testo lungo: le righe che iniziano con "## " diventano sottotitoli
export function RichText({ text, className = '' }: { text: string; className?: string }) {
  const blocks = text.split(/\n{2,}|\n(?=## )/).map(b => b.trim()).filter(Boolean);
  return (
    <div className={`space-y-5 ${className}`}>
      {blocks.map((b, i) => {
        const [first, ...more] = b.split('\n');
        const p = (t: string) => <p className="whitespace-pre-line text-[17px] leading-relaxed text-[var(--muted)]">{t}</p>;
        return b.startsWith('## ')
          ? <div key={i} className="space-y-3 pt-4"><H as="h3" className="text-2xl md:text-3xl">{first.slice(3)}</H>{more.length > 0 && p(more.join('\n'))}</div>
          : <div key={i}>{p(b)}</div>;
      })}
    </div>
  );
}

export function ServicesGrid({ numbered }: { numbered?: boolean }) {
  const { cfg } = useSite();
  if (!cfg.services.length) return null;
  return (
    <div className="grid gap-5 md:grid-cols-2">
      {cfg.services.map((s, i) => (
        <div key={i} className="rounded-[var(--r)] bg-[var(--surface)] p-7 ring-1 ring-[var(--line)]">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--c)_14%,transparent)] text-sm font-bold text-[var(--c)]">{numbered ? String(i + 1).padStart(2, '0') : <Check size={18} />}</span>
          <H as="h3" className="mt-5 text-2xl">{s.title}</H>
          <p className="mt-3 leading-relaxed text-[var(--muted)]">{s.text}</p>
        </div>
      ))}
    </div>
  );
}
