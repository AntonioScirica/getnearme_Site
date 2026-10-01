'use client';

import LeafletMap from '@/components/ui/LeafletMap';
import { iconFor } from '@/lib/fieldIcons';
import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Check, Compass, FileDown, Play, ExternalLink, Facebook, Fence, Flame, Layers, LandPlot, Package, Shirt, ShieldCheck, Siren, Sun, Video, WashingMachine, Waves, Wifi, Wine, HouseWifi, Warehouse, GraduationCap, Hospital, Instagram, Loader2, Mail, MapPin, MessageCircle, Phone, Pill, School, Share2, ShoppingCart, Train, TrainFront, TramFront, Trees } from 'lucide-react';
import { authFetch } from '@/components/platform/api';
import { printHtml } from '@/lib/printHtml';
import { ESSENTIALS, GROUPS, type Field } from '@/lib/propertyFields';
import { zoneOnly, type SiteProperty } from '@/lib/siteTemplates';
import type { Poi } from '@/lib/zone';
import { contacts, H, SiteLink, useSite, useT } from './ui';

// Parti aggiunte sul modello dei siti di agenzia di zona (es. casalconero.com): barra contatti,
// WhatsApp fisso, modulo di contatto vero, dettagli e caratteristiche dell'immobile, mappa, servizi.

export function TopBar() {
  const { cfg } = useSite();
  if (!cfg.topBar || (!cfg.phone && !cfg.email)) return null;
  return (
    <div className="bg-[var(--c)] text-[13px] text-white">
      <div className="mx-auto flex h-10 max-w-[1240px] items-center gap-5 px-6 md:h-9 md:px-10">
        {/* telefono: link alti quanto la barra (40px) */}
        {cfg.phone && <a href={`tel:${cfg.phone.replace(/\s/g, '')}`} className="flex h-full items-center gap-1.5 hover:opacity-80"><Phone size={13} />{cfg.phone}</a>}
        {cfg.email && <a href={`mailto:${cfg.email}`} className="hidden items-center gap-1.5 hover:opacity-80 sm:flex"><Mail size={13} />{cfg.email}</a>}
        <span className="ml-auto flex items-center gap-3">
          {cfg.facebook && <a href={cfg.facebook} target="_blank" rel="noreferrer" aria-label="Facebook" className="flex h-10 w-8 items-center justify-center hover:opacity-80 md:h-auto md:w-auto"><Facebook size={14} /></a>}
          {cfg.instagram && <a href={cfg.instagram} target="_blank" rel="noreferrer" aria-label="Instagram" className="flex h-10 w-8 items-center justify-center hover:opacity-80 md:h-auto md:w-auto"><Instagram size={14} /></a>}
        </span>
      </div>
    </div>
  );
}

export function WhatsAppFloat() {
  const { cfg, preview } = useSite();
  const c = contacts(cfg);
  // nell'anteprima dell'editor lo disegna Preview, fisso nell'angolo della finestra (qui finirebbe in fondo alla pagina)
  // footer in vista: la bolla si toglie di mezzo, cosi' non copre i link in fondo
  const [atEnd, setAtEnd] = useState(false);
  const on = cfg.whatsappButton && !!c.wa && !preview;
  useEffect(() => {
    const f = on && document.querySelector('footer');
    if (!f) return;
    const io = new IntersectionObserver(([e]) => setAtEnd(e.isIntersecting));
    io.observe(f); return () => io.disconnect();
  }, [on]);
  if (!on) return null;
  return (
    <a href={preview ? undefined : c.wa} target="_blank" rel="noreferrer" aria-label="Scrivimi su WhatsApp" aria-hidden={atEnd || undefined} tabIndex={atEnd ? -1 : undefined}
      className={`${preview ? 'absolute' : 'fixed'} bottom-5 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-[0_10px_30px_-5px_rgba(37,211,102,.6)] transition-[transform,opacity] duration-500 hover:scale-110 ${atEnd ? 'pointer-events-none translate-y-4 opacity-0' : ''}`}>
      <MessageCircle size={26} fill="currentColor" className="text-white" />
    </a>
  );
}

// Modulo di contatto: la richiesta arriva per email all'agente (/api/site/lead)
export function ContactForm({ property, compact }: { property?: SiteProperty; compact?: boolean }) {
  const { preview, base } = useSite();
  const tx = useT();
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
      <div className="font-semibold">{tx('form.done')}</div><p className="text-sm text-[var(--muted)]">Ti rispondo al più presto.</p>
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
      <label className="flex min-h-10 cursor-pointer items-start gap-3 py-1 text-[13px] text-[var(--muted)] md:min-h-0 md:gap-2 md:py-0 md:text-xs"><input type="checkbox" name="privacy" required className="h-5 w-5 shrink-0 accent-[var(--c)] md:mt-0.5 md:h-auto md:w-auto" /> <span>Ho letto l’<SiteLink to={{ page: 'legal', doc: 'privacy' }} className="underline underline-offset-2 hover:text-[var(--fg)]">informativa privacy</SiteLink> e acconsento a essere ricontattato.</span></label>
      <button disabled={state === 'sending'} className="flex h-12 w-full items-center justify-center gap-2 rounded-[calc(var(--r)*0.6)] bg-[var(--c)] text-sm font-semibold text-[var(--on-c,#fff)] transition hover:brightness-110 disabled:opacity-60">
        {state === 'sending' && <Loader2 size={15} className="animate-spin" />} {tx('form.button')}
      </button>
      {state === 'err' && <p className="text-sm text-rose-600">Invio non riuscito, riprova o chiamami.</p>}
    </form>
  );
}

// Dettagli e caratteristiche dall'unico schema dei campi (lib/propertyFields)
const ALL: Field[] = [...ESSENTIALS, ...GROUPS.flatMap(g => g.fields)];
const SKIP = new Set(['indirizzo', 'mostra_indirizzo', 'trattativa_riservata', 'prezzo', 'contratto', 'tipologia', 'superficie', 'locali', 'camere', 'bagni', 'virtual_tour']);
// valori importati gia' con l'unita' ("€ 45/mese"): niente unita' ripetuta
const fmt = (f: Field, v: unknown): string => {
  if (typeof v === 'boolean') return v ? 'Sì' : 'No';
  if (typeof v === 'number') return `${v.toLocaleString('it-IT')}${f.unit ? ` ${f.unit}` : ''}`; // 2.232 €/mese
  const t = String(v).trim();
  if (/^s[iì]$/i.test(t)) return 'Sì';
  if (/^no$/i.test(t)) return 'No';
  // importato gia' con l'unita' ("€ 45/mese"): stesso formato dei numeri scritti a mano ("45 €/mese")
  const n = t.match(/^€?\s*([\d.,]+)\s*(€|\/mese|€\/mese)?/);
  if (n && f.unit && /€/.test(f.unit) && /€/.test(t)) return `${n[1]} ${f.unit}`;
  return /€|\/mese|m²|kWh/i.test(t) ? t : `${t}${f.unit ? ` ${f.unit}` : ''}`;
};

export function DetailsTable({ p }: { p: SiteProperty }) {
  const tx = useT();
  const d = p.details ?? {};
  // [chiave (per l'icona), etichetta, valore]
  type Row = [string, string, string];
  const rows: Row[] = [
    ...(p.riferimento ? [['riferimento', 'Codice', p.riferimento] as Row] : []),
    ...(p.tipologia ? [['tipologia', 'Tipologia', p.tipologia.split('|')[0]] as Row] : []), // senza tipologia niente riga col trattino
    ['contratto', 'Contratto', /affitt/i.test(p.contratto ?? '') ? 'Affitto' : 'Vendita'],
    // indirizzo esatto solo se l'agente ha scelto di mostrarlo, altrimenti zona e citta'
    ['indirizzo', 'Indirizzo', d.mostra_indirizzo ? p.addr : zoneOnly(p.addr) || '—'],
    ...(p.mq ? [['superficie', 'Superficie', `${p.mq} m²`] as Row] : []),
    ...(p.locali ? [['locali', 'Locali', String(p.locali)] as Row] : []),
    ...(p.camere ? [['camere', 'Camere', String(p.camere)] as Row] : []),
    ...(p.bagni ? [['bagni', 'Bagni', String(p.bagni)] as Row] : []),
    ...ALL.filter(f => !SKIP.has(f.key) && f.type !== 'multi' && d[f.key] !== undefined && d[f.key] !== '' && d[f.key] !== false).map(f => [f.key, f.label, fmt(f, d[f.key])] as Row),
  ];
  return (
    <div>
      <H className="text-3xl">{tx('property.details')}</H>
      <dl className="mt-5 grid overflow-hidden rounded-[var(--r)] ring-1 ring-[var(--line)] sm:grid-cols-2">
        {rows.map(([key, k, v]) => { const I = iconFor(key); return (
          <div key={k} className="flex items-center justify-between gap-4 border-b border-[var(--line)] px-4 py-3 text-sm sm:odd:border-r">
            <dt className="flex min-w-0 items-center gap-2.5 text-[var(--muted)]"><I size={16} className="shrink-0 text-[var(--c)]" />{k}</dt><dd className="text-right font-medium">{v}</dd>
          </div>
        ); })}
      </dl>
    </div>
  );
}

// Caratteristiche: una tessera per voce con la sua icona (esterni, dotazioni); l'esposizione in una sola tessera
const FEATURE_ICON: Record<string, typeof Check> = {
  Balcone: Fence, Terrazzo: Sun, 'Giardino privato': Trees, 'Giardino condominiale': Trees, Cortile: LandPlot, Piscina: Waves,
  Parquet: Layers, 'Porta blindata': ShieldCheck, "Impianto d'allarme": Siren, 'Fibra ottica': Wifi, Domotica: HouseWifi, Camino: Flame,
  Ripostiglio: Package, 'Cabina armadio': Shirt, Lavanderia: WashingMachine, Taverna: Wine, Soppalco: Warehouse, Videocitofono: Video,
};
export function FeatureList({ p }: { p: SiteProperty }) {
  const tx = useT();
  const d = p.details ?? {};
  const list = (k: string) => (Array.isArray(d[k]) ? (d[k] as string[]) : []);
  const esp = list('esposizione');
  const items: [string, typeof Check, string?][] = [
    ...[...list('esterni'), ...list('dotazioni')].map(x => [x, FEATURE_ICON[x] ?? Check] as [string, typeof Check]),
    ...(esp.length ? [[esp.join(', '), Compass, 'Esposizione'] as [string, typeof Check, string]] : []),
  ];
  if (!items.length) return null;
  return (
    <div>
      <H className="text-3xl">{tx('property.features')}</H>
      <ul className="mt-5 grid grid-cols-2 gap-2 xl:grid-cols-3">
        {items.map(([label, I, kicker]) => (
          <li key={label} className="flex items-center gap-3 rounded-[calc(var(--r)*0.6)] bg-[var(--soft)] px-4 py-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--c)]"><I size={16} /></span>
            <span className="min-w-0 text-sm">{kicker && <span className="block text-xs text-[var(--muted)]">{kicker}</span>}<span className="block font-medium leading-snug">{label}</span></span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// Tour virtuale o video: YouTube e Vimeo diventano il loro player, gli altri link (Matterport, Kuula...) si aprono
// nella pagina cosi' come sono. Solo http(s). Sotto resta il link per aprirlo a parte (alcuni siti non si lasciano incorporare).
export function tourEmbed(raw?: unknown): { src: string; href: string } | null {
  if (typeof raw !== 'string' || !raw.trim()) return null;
  let u: URL;
  try { u = new URL(/^https?:\/\//i.test(raw.trim()) ? raw.trim() : `https://${raw.trim()}`); } catch { return null; }
  if (!/^https?:$/.test(u.protocol) || !u.hostname.includes('.')) return null;
  const href = u.toString();
  const yt = u.hostname.includes('youtu.be') ? u.pathname.slice(1) : /youtube\.com$/.test(u.hostname.replace(/^www\.|^m\./, '')) ? (u.searchParams.get('v') || u.pathname.match(/\/(?:shorts|embed|live)\/([\w-]+)/)?.[1]) : null;
  if (yt) return { src: `https://www.youtube-nocookie.com/embed/${yt}`, href };
  const vm = /vimeo\.com$/.test(u.hostname.replace(/^www\./, '')) && u.pathname.match(/\/(\d+)/)?.[1];
  if (vm) return { src: `https://player.vimeo.com/video/${vm}`, href };
  return { src: href, href };
}
// Il tour si carica solo al clic: fino ad allora il visitatore non contatta YouTube, Matterport... (niente banner cookie)
export function TourBlock({ p }: { p: SiteProperty }) {
  const t = tourEmbed(p.details?.virtual_tour);
  const [on, setOn] = useState(false);
  if (!t) return null;
  const host = new URL(t.src).hostname.replace(/^www\./, '');
  return (
    <div>
      <H className="text-3xl">Tour virtuale</H>
      <div className="mt-5 aspect-video overflow-hidden rounded-[var(--r)] bg-[var(--soft)] ring-1 ring-[var(--line)]">
        {!on ? (
          <button type="button" onClick={() => setOn(true)} className="flex h-full w-full flex-col items-center justify-center gap-3 px-6 text-center">
            <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--c)] text-[var(--on-c,#fff)] shadow-lg transition-transform hover:scale-105"><Play size={22} className="translate-x-px" /></span>
            <span className="font-semibold">Mostra il tour</span>
            <span className="max-w-sm text-xs text-[var(--muted)]">Il tour è ospitato da {host}: caricandolo, quel sito riceve i tuoi dati di navigazione e può usare cookie.</span>
          </button>
        ) : <iframe src={t.src} title="Tour virtuale" allowFullScreen allow="fullscreen; xr-spatial-tracking; gyroscope; accelerometer; autoplay; encrypted-media; picture-in-picture"
          sandbox="allow-scripts allow-same-origin allow-popups allow-presentation allow-forms" className="h-full w-full border-0" />}
      </div>
      <a href={t.href} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--c)] hover:underline">Apri a schermo intero <ExternalLink size={13} /></a>
    </div>
  );
}

// Mappa della zona (Leaflet, gratis). Cerchio e non puntino: la posizione esatta resta riservata.
export function MapBlock({ addr, bare, hidden }: { addr: string; bare?: boolean; hidden?: boolean }) {
  const tx = useT();
  const [none, setNone] = useState(false);
  const missing = useCallback(() => setNone(true), []);
  if (none) return null;
  if (bare) return <LeafletMap addr={addr} circle onMissing={missing} className="h-[260px] rounded-[calc(var(--r)*0.8)] bg-[var(--soft)]" />;
  return (
    <div>
      <H className="text-3xl">{tx('property.map')}</H>
      <LeafletMap addr={addr} circle onMissing={missing} className="mt-5 h-[340px] rounded-[var(--r)] bg-[var(--soft)]" />
      {hidden && <p className="mt-2 text-xs text-[var(--muted)]">Zona indicativa, l’indirizzo esatto te lo do su richiesta.</p>}{/* solo per gli immobili con l'indirizzo nascosto, non per l'ufficio */}
    </div>
  );
}

// "Scarica il report": brochure PDF della casa (foto, descrizione, caratteristiche, zona, costi, contatti dell'agente).
// L'HTML lo compone il server; qui si stampa da un iframe nascosto (lib/printHtml, il browser offre "Salva come PDF").
export function ReportButton({ id, className = '' }: { id: string; className?: string }) {
  const { base, preview } = useSite();
  const [busy, setBusy] = useState(false);
  const run = async () => {
    if (preview || busy) return;
    setBusy(true);
    try {
      const slug = base.split('/').filter(Boolean).pop() ?? '';
      const html = await fetch(`/api/site/report?slug=${encodeURIComponent(slug)}&id=${encodeURIComponent(id)}`).then(r => (r.ok ? r.text() : ''));
      if (!html) return;
      await printHtml(html);
    } finally { setBusy(false); }
  };
  return (
    <button type="button" onClick={run} disabled={busy} className={`flex h-10 items-center gap-2 rounded-full px-4 text-sm font-medium ring-1 ring-[var(--line)] transition-colors hover:ring-[var(--fg)] disabled:opacity-60 print:hidden ${className}`}>
      {busy ? <Loader2 size={15} className="animate-spin" /> : <FileDown size={15} />}{busy ? 'Preparo il report…' : 'Scarica il report'}
    </button>
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
        <div key={i} className="rounded-[var(--r)] bg-[var(--surface)] p-5 ring-1 ring-[var(--line)] sm:p-7">
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-[color-mix(in_srgb,var(--c)_14%,transparent)] text-sm font-bold text-[var(--c)]">{numbered ? String(i + 1).padStart(2, '0') : <Check size={18} />}</span>
          <H as="h3" className="mt-5 text-2xl">{s.title}</H>
          <p className="mt-3 leading-relaxed text-[var(--muted)]">{s.text}</p>
        </div>
      ))}
    </div>
  );
}

// Le 10 cose piu' vicine all'immobile (OpenStreetMap), con il raggio a scelta. Sul sito vero le chiede per
// slug + id dell'immobile pubblicato; nell'anteprima dell'editor (immobili anche finti) passa per l'indirizzo.
const POI_ICON: Record<string, typeof Train> = { Metro: TrainFront, Stazione: Train, Tram: TramFront, Supermercato: ShoppingCart, Scuola: School, 'Università': GraduationCap, Parco: Trees, Ospedale: Hospital, Farmacia: Pill };
const RADII = [[500, '500 m'], [1000, '1 km'], [2000, '2 km'], [5000, '5 km']] as const;
const far = (m: number) => (m < 1000 ? `${Math.round(m / 10) * 10} m` : `${(m / 1000).toFixed(1).replace('.', ',')} km`);
export function NearbyList({ p }: { p: SiteProperty }) {
  const { base, preview } = useSite();
  const [radius, setRadius] = useState(1000);
  const [pois, setPois] = useState<Poi[] | null>(null);
  useEffect(() => {
    let stop = false;
    const slug = base.split('/').filter(Boolean).pop() ?? '';
    const req = preview
      ? authFetch(`/api/platform/zone?address=${encodeURIComponent(p.addr)}&radius=${radius}`)
      : fetch(`/api/site/zone?slug=${encodeURIComponent(slug)}&id=${encodeURIComponent(p.id)}&r=${radius}`);
    req.then(r => (r.ok ? r.json() : null)).catch(() => null)
      .then(d => { if (!stop) setPois(((d?.pois ?? []) as Poi[]).filter(x => x.distanza <= radius).sort((a, b) => a.distanza - b.distanza).slice(0, 10)); });
    return () => { stop = true; };
  }, [base, preview, p.addr, p.id, radius]);
  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <H className="text-3xl">Cosa c’è vicino</H>
        <div className="grid grid-cols-4 gap-1 rounded-[calc(var(--r)*0.6)] bg-[var(--soft)] p-1">
          {RADII.map(([r, l]) => (
            <button key={r} type="button" onClick={() => { setRadius(r); setPois(null); }}
              className={`h-8 rounded-[calc(var(--r)*0.45)] px-3 text-[13px] font-medium transition-colors ${radius === r ? 'bg-[var(--c)] text-white shadow-sm' : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)]'}`}>{l}</button>
          ))}
        </div>
      </div>
      {pois === null ? (
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">{Array.from({ length: 6 }, (_, i) => <li key={i} className="h-14 animate-pulse rounded-[calc(var(--r)*0.6)] bg-[var(--soft)]" />)}</ul>
      ) : pois.length ? (
        <ul className="mt-5 grid gap-2 sm:grid-cols-2">
          {pois.map(x => {
            const I = POI_ICON[x.categoria] ?? MapPin;
            return (
              <li key={`${x.categoria}-${x.nome}-${x.distanza}`}><a target="_blank" rel="noopener noreferrer"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(x.lat != null ? `${x.lat},${x.lon}` : `${x.nome}, ${p.addr}`)}`}
                className="flex items-center gap-3 rounded-[calc(var(--r)*0.6)] bg-[var(--soft)] px-4 py-3 text-sm ring-1 ring-transparent transition-shadow hover:ring-[var(--line)]">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[var(--surface)] text-[var(--c)]"><I size={16} /></span>
                <span className="min-w-0 flex-1"><span className="block truncate font-medium">{x.nome}</span><span className="block text-xs text-[var(--muted)]">{x.categoria}</span></span>
                <span className="shrink-0 text-right text-xs"><span className="block font-semibold">{far(x.distanza)}</span><span className="block text-[var(--muted)]">{Math.max(1, Math.round(x.distanza / 80))} min a piedi</span></span>
              </a></li>
            );
          })}
        </ul>
      ) : <p className="mt-5 rounded-[calc(var(--r)*0.6)] bg-[var(--soft)] px-4 py-6 text-center text-sm text-[var(--muted)]">Nessun servizio trovato entro {far(radius)}: prova un raggio più ampio.</p>}
    </div>
  );
}

// Indirizzo cliccabile: apre Google Maps. "Quanto dista da te?" chiede la posizione (solo al clic) e mostra la
// distanza in linea d'aria. Se l'agente non mostra l'indirizzo esatto qui arriva gia' solo zona e citta'.
// light: sopra una foto scura, il link prende il colore del testo intorno (bianco) invece del colore del sito
export function AddressLink({ addr, className = '', iconSize = 16, light = false }: { addr: string; className?: string; iconSize?: number; light?: boolean }) {
  const { preview } = useSite();
  const [dist, setDist] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const measure = async () => {
    if (!navigator.geolocation) { setDist('posizione non disponibile'); return; }
    setBusy(true);
    const here = await new Promise<GeolocationPosition | null>(ok => navigator.geolocation.getCurrentPosition(ok, () => ok(null), { timeout: 10000 }));
    const g = here && await fetch(`/api/site/geocode?q=${encodeURIComponent(addr)}`).then(x => (x.ok ? x.json() : null)).catch(() => null) as { lat: number; lon: number } | null;
    setBusy(false);
    if (!here) { setDist('posizione non concessa'); return; }
    if (!g) { setDist('indirizzo non trovato'); return; }
    const rad = Math.PI / 180, a = here.coords.latitude, b = here.coords.longitude, c = g.lat, d = g.lon;
    const h = Math.sin((c - a) * rad / 2) ** 2 + Math.cos(a * rad) * Math.cos(c * rad) * Math.sin((d - b) * rad / 2) ** 2;
    const km = 2 * 6371 * Math.asin(Math.sqrt(h));
    setDist(km < 1 ? `a ${Math.round(km * 1000 / 10) * 10} m da te` : `a ${km.toFixed(km < 10 ? 1 : 0).replace('.', ',')} km da te`);
  };
  return (
    <span className={`inline-flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      <a href={preview ? undefined : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(addr)}`} target="_blank" rel="noopener"
        className="inline-flex min-h-10 items-center gap-1.5 underline-offset-4 hover:underline md:min-h-0"><MapPin size={iconSize} className="shrink-0" />{addr}</a>
      {dist ? <span className="text-sm opacity-80">{dist}</span>
        : <button type="button" onClick={measure} disabled={busy} className={`inline-flex min-h-10 items-center gap-1 text-sm font-medium ${light ? 'underline underline-offset-4' : 'text-[var(--c)] hover:underline'} disabled:opacity-60 md:min-h-0`}>{busy && <Loader2 size={13} className="animate-spin" />}Quanto dista da te?</button>}
    </span>
  );
}
