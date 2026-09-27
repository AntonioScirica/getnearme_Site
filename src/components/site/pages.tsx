'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Expand, Mail, MapPin, MessageCircle, Phone, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react';
import InlineSlider from '@/components/InlineSlider';
import { zoneSlug, type SiteProperty } from '@/lib/siteTemplates';

import { LegalPage } from './legal';
import { AddressLink, ContactForm, DetailsTable, FeatureList, MapBlock, NearbyList, RichText, ServicesGrid, ReportButton, ShareBar, TourBlock, WhatsAppFloat } from './extras';
import { AboutBlock, CtaBand, Featured, Footer, Header, Hero, Intro, isRent, PropertyCard, PropertyRow, Reviews, SearchForm, SectionHead, statsOf, tipiOf, Zones, type Filters } from './sections';
import { Btn, Container, contacts, Eyebrow, Facts, FavButton, H, Photo, price, Sec, SiteLink, SiteRoot, typeOf, useFavs, useSite, useT, zoneOf, type Page, type SiteCtx, Select } from './ui';

// Le 4 pagine del sito vetrina. Struttura comune, ma ogni template sceglie le sue varianti:
// filtri laterali o in alto, card o righe, galleria a mosaico, slider o a tutto schermo, profilo diviso, con copertina o centrato.

function HomePage() {
  return <><Sec id="header"><Header over /></Sec><Sec id="home.hero"><Hero /></Sec><Sec id="home.intro"><Intro /></Sec><Sec id="home.featured"><Featured /></Sec><Sec id="home.about"><AboutBlock /></Sec><Sec id="home.reviews"><Reviews /></Sec><Sec id="home.zones"><Zones /></Sec><Sec id="cta"><CtaBand /></Sec><Sec id="footer"><Footer /></Sec></>;
}

// Testata delle pagine interne, diversa per template
function PageHead({ eyebrow, title, sub, children }: { eyebrow: string; title: string; sub?: string; children?: ReactNode }) {
  const { t, properties } = useSite();
  if (t.header === 'over') return (
    <section className="relative flex h-[340px] items-end overflow-hidden text-white">
      <Photo src={properties[0]?.cover} className="absolute inset-0 h-full" /><div className="absolute inset-0 bg-black/55" />
      <Container className="relative pb-12"><div className="text-[11px] font-semibold uppercase tracking-[0.35em] text-white/70">{eyebrow}</div><H as="h1" className="mt-3 text-5xl md:text-6xl">{title}</H>{sub && <p className="mt-2 text-white/75">{sub}</p>}{children}</Container>
    </section>
  );
  if (t.header === 'pill' || t.header === 'minimal') return (
    <Container className="pb-6 pt-14 text-center"><Eyebrow>{eyebrow}</Eyebrow><H as="h1" className="mx-auto mt-3 max-w-3xl text-5xl md:text-6xl">{title}</H>{sub && <p className="mt-3 text-[var(--muted)]">{sub}</p>}{children}</Container>
  );
  return (
    <section className={t.header === 'centered' ? 'bg-[var(--soft)] text-center' : 'border-b border-[var(--line)] bg-[var(--soft)]'}>
      <Container className="py-14"><Eyebrow>{eyebrow}</Eyebrow><H as="h1" className="mt-3 text-4xl md:text-5xl">{title}</H>{sub && <p className="mt-2 text-[var(--muted)]">{sub}</p>}{children}</Container>
    </section>
  );
}

// ---------- Immobili ----------
type F = Filters & { min?: number; sort?: string };
const PER_PAGE = 9;
function useFilter(initial?: Filters) {
  const { properties } = useSite();
  const favs = useFavs();
  const favIds = favs.ids;
  const [f, setF] = useState<F>({ ...initial });
  const list = useMemo(() => {
    const q = f.q?.toLowerCase().trim();
    const r = properties.filter(p =>
      (!q || `${p.titolo} ${p.addr}`.toLowerCase().includes(q)) && (!f.tipo || p.tipologia?.startsWith(f.tipo)) && (!f.rif || (p.riferimento ?? '').toLowerCase().includes(f.rif.toLowerCase())) &&
      (!f.contratto || (f.contratto === 'affitto') === isRent(p)) && (!f.max || (p.prezzo && p.prezzo <= f.max)) && (!f.min || p.prezzo >= f.min) &&
      (!f.camere || (p.camere ?? 0) >= f.camere) && (!f.bagni || (p.bagni ?? 0) >= f.bagni) && (!f.fav || favIds.includes(p.id)));
    if (f.sort === 'asc') r.sort((a, b) => (a.prezzo || 9e9) - (b.prezzo || 9e9));
    if (f.sort === 'desc') r.sort((a, b) => b.prezzo - a.prezzo);
    if (f.sort === 'mq') r.sort((a, b) => b.mq - a.mq);
    return r;
  }, [properties, f, favIds]);
  return { f, setF, set: (p: Partial<F>) => setF(x => ({ ...x, ...p })), list, tipi: tipiOf(properties), favCount: favIds.length };
}

function ListingsPage({ initial }: { initial?: Filters }) {
  const { t } = useSite();
  const tx = useT();
  const s = useFilter(initial);
  const { f, set, setF, list, tipi, favCount } = s;
  const [pageN, setPageN] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => { setPageN(0); }, [f]); // eslint-disable-line react-hooks/set-state-in-effect
  const pages = Math.ceil(list.length / PER_PAGE);
  const shown = list.slice(pageN * PER_PAGE, pageN * PER_PAGE + PER_PAGE);
  const field = 'h-11 w-full rounded-[calc(var(--r)*0.6)] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--c)]';
  // controlli segmentati: una pista chiara con le voci dentro, la scelta e' una pillola piena; stanno sempre nella larghezza
  const seg = 'grid gap-1 rounded-[calc(var(--r)*0.6)] bg-[var(--soft)] p-1';
  const segBtn = (on: boolean) => `h-9 min-w-0 truncate rounded-[calc(var(--r)*0.45)] px-1 text-[13px] font-medium transition-colors ${on ? 'bg-[var(--c)] text-white shadow-sm' : 'text-[var(--muted)] hover:bg-[var(--surface)] hover:text-[var(--fg)]'}`;
  const contratto = (
    <div className="flex gap-2">
      <div className={`${seg} flex-1 grid-cols-3`}>
        {[['', 'Tutti'], ['vendita', 'Vendita'], ['affitto', 'Affitto']].map(([v, l]) => <button key={v} onClick={() => set({ contratto: v || undefined })} className={segBtn((f.contratto ?? '') === v)}>{l}</button>)}
      </div>
      {favCount > 0 && <button onClick={() => set({ fav: !f.fav })} className={`flex h-11 shrink-0 items-center gap-1.5 rounded-[calc(var(--r)*0.6)] border px-3 text-sm font-medium transition-colors ${f.fav ? 'border-[var(--c)] bg-[var(--c)] text-white' : 'border-[var(--line)] bg-[var(--surface)]'}`}>♥ {favCount}</button>}
    </div>
  );
  const zona = <div className="relative"><MapPin size={15} className="absolute left-3 top-3.5 text-[var(--muted)]" /><input value={f.q ?? ''} onChange={e => set({ q: e.target.value })} placeholder="Città, quartiere, via" className={`${field} pl-9`} /></div>;
  const tipo = <Select value={f.tipo ?? ''} onChange={e => set({ tipo: e.target.value || undefined })} className={field}><option value="">Tutte le tipologie</option>{tipi.map(x => <option key={x}>{x}</option>)}</Select>;
  const prezzo = (
    <div className="flex items-center gap-2">
      <input type="number" inputMode="numeric" placeholder="Da €" value={f.min ?? ''} onChange={e => set({ min: Number(e.target.value) || undefined })} className={`${field} min-w-0`} />
      <span className="text-[var(--muted)]">–</span>
      <input type="number" inputMode="numeric" placeholder="A €" value={f.max ?? ''} onChange={e => set({ max: Number(e.target.value) || undefined })} className={`${field} min-w-0`} />
    </div>
  );
  const counts = (k: 'camere' | 'bagni') => <div className={`${seg} grid-cols-5`}>{[0, 1, 2, 3, 4].map(n => <button key={n} onClick={() => set({ [k]: n || undefined })} className={segBtn((f[k] ?? 0) === n)}>{n ? `${n}+` : 'Tutti'}</button>)}</div>;
  const lab = 'mb-2 block text-[11px] font-semibold uppercase tracking-[0.14em] text-[var(--muted)]';
  const sort = (
    <Select value={f.sort ?? ''} onChange={e => set({ sort: e.target.value || undefined })} className="h-11 rounded-[calc(var(--r)*0.6)] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm outline-none">
      <option value="">Più recenti</option><option value="asc">Prezzo crescente</option><option value="desc">Prezzo decrescente</option><option value="mq">Più grandi</option>
    </Select>
  );
  const sidebar = (
    <div className="space-y-5">
      {contratto}
      <label className="block"><span className={lab}>Zona</span>{zona}</label>
      <label className="block"><span className={lab}>Tipologia</span>{tipo}</label>
      <div><span className={lab}>Prezzo</span>{prezzo}</div>
      <div><span className={lab}>Camere</span>{counts('camere')}</div>
      <div><span className={lab}>Bagni</span>{counts('bagni')}</div>
      <button onClick={() => setF({})} className="h-10 w-full rounded-[calc(var(--r)*0.6)] border border-[var(--line)] text-sm font-medium text-[var(--muted)] transition-colors hover:border-[var(--fg)] hover:text-[var(--fg)]">Azzera filtri</button>
    </div>
  );
  const results = (
    <>
      {t.results === 'rows'
        ? <div className="border-t border-[var(--line)]">{shown.map(p => <PropertyRow key={p.id} p={p} />)}</div>
        : <div className={`grid gap-6 sm:grid-cols-2 ${t.listings === 'topbar' ? 'lg:grid-cols-3' : 'xl:grid-cols-3'}`}>{shown.map(p => <PropertyCard key={p.id} p={p} />)}</div>}
      {!list.length && <div className="rounded-[var(--r)] bg-[var(--soft)] px-6 py-16 text-center text-[var(--muted)]">{tx('listings.empty')} <button onClick={() => setF({})} className="font-semibold text-[var(--c)]">Azzera</button></div>}
      {pages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          <button disabled={!pageN} onClick={() => setPageN(n => n - 1)} className="flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-30"><ChevronLeft size={18} /></button>
          {Array.from({ length: pages }, (_, i) => <button key={i} onClick={() => setPageN(i)} className={`h-10 w-10 rounded-full text-sm font-semibold ${i === pageN ? 'bg-[var(--fg)] text-[var(--bg)]' : 'hover:bg-[var(--soft)]'}`}>{i + 1}</button>)}
          <button disabled={pageN >= pages - 1} onClick={() => setPageN(n => n + 1)} className="flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>
      )}
    </>
  );
  const title = f.q ? `Immobili a ${f.q}` : tx('listings.title');
  const sub = `${list.length} ${list.length === 1 ? 'risultato' : 'risultati'}`;

  return (
    <>
      <Sec id="header"><Header /></Sec>
      {t.listings === 'topbar' ? (
        <>
          <Sec id="listings.head"><PageHead eyebrow={tx('listings.eyebrow')} title={title} sub={sub} /></Sec>
          {/* filtri in una barra sopra i risultati */}
          <Container className={t.header === 'over' ? '-mt-8 relative z-10' : 'mt-4'}>
            <div className="flex flex-col gap-3 rounded-[var(--r)] bg-[var(--surface)] p-3 shadow-[0_20px_60px_-25px_rgba(0,0,0,.25)] ring-1 ring-[var(--line)] lg:flex-row lg:items-center">
              <div className="flex-[1.4]">{zona}</div><div className="flex-1">{tipo}</div>
              <div className="flex-1"><Select value={f.max ?? ''} onChange={e => set({ max: Number(e.target.value) || undefined })} className={field}><option value="">Qualsiasi prezzo</option>{[150000, 250000, 400000, 600000, 1000000].map(v => <option key={v} value={v}>Fino a {price(v)}</option>)}</Select></div>
              <div className="flex-1"><Select value={f.camere ?? ''} onChange={e => set({ camere: Number(e.target.value) || undefined })} className={field}><option value="">Camere</option>{[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}+ camere</option>)}</Select></div>
              <button className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-[calc(var(--r)*0.6)] bg-[var(--c)] px-5 text-sm font-semibold text-white"><Search size={15} /> Cerca</button>
            </div>
            <div className="mt-6 flex items-center justify-between gap-3"><div className="w-72">{contratto}</div>{sort}</div>
          </Container>
          <Container className="py-10">{results}</Container>
        </>
      ) : (
        <>
          <Sec id="listings.head"><PageHead eyebrow={tx('listings.eyebrow')} title={title} sub={sub} /></Sec>
          <Container className="grid gap-10 py-12 lg:grid-cols-[280px_1fr]">
            <aside className="hidden lg:block"><div className="sticky top-6 rounded-[var(--r)] bg-[var(--surface)] p-5 ring-1 ring-[var(--line)]">{sidebar}</div></aside>
            <div>
              <div className="mb-6 flex items-center justify-between gap-3">
                <button onClick={() => setOpen(true)} className="flex h-10 items-center gap-2 rounded-[calc(var(--r)*0.6)] border border-[var(--line)] px-4 text-sm font-medium lg:hidden"><SlidersHorizontal size={15} /> Filtri</button>
                <span className="hidden text-sm text-[var(--muted)] lg:block">{sub}</span>{sort}
              </div>
              {results}
            </div>
          </Container>
          {open && (
            <div className="fixed inset-0 z-50 flex justify-end bg-black/40 lg:hidden" onClick={() => setOpen(false)}>
              <div className="h-full w-[88%] max-w-sm overflow-y-auto bg-[var(--bg)] p-6" onClick={e => e.stopPropagation()}>
                <div className="mb-6 flex items-center justify-between"><span className="text-lg font-semibold">Filtri</span><button onClick={() => setOpen(false)}><X /></button></div>
                {sidebar}<Btn onClick={() => setOpen(false)} className="mt-8 w-full">Mostra {list.length} risultati</Btn>
              </div>
            </div>
          )}
        </>
      )}
      <Sec id="cta"><CtaBand /></Sec>
      <Sec id="footer"><Footer /></Sec>
    </>
  );
}

// ---------- Scheda immobile ----------
// prima/dopo: le foto AI hanno l'originale in p.prima; a tutto schermo si confrontano con il cursore
function Lightbox({ photos, prima, i, setI }: { photos: string[]; prima?: Record<string, string>; i: number | null; setI: (n: number | null) => void }) {
  useEffect(() => {
    if (i === null) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setI(null); if (e.key === 'ArrowRight') setI((i + 1) % photos.length); if (e.key === 'ArrowLeft') setI((i - 1 + photos.length) % photos.length); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [i, photos.length, setI]);
  if (i === null) return null;
  const before = prima?.[photos[i]];
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92" onClick={() => setI(null)}>
      {before ? (
        <div className="relative aspect-[3/2] max-h-[86vh] w-[min(92vw,calc(86vh*1.5))] overflow-hidden rounded-[var(--rc)]" onClick={e => e.stopPropagation()}>
          <InlineSlider before={before} after={photos[i]} isVertical={false} showImages interactive />
          <span className="pointer-events-none absolute bottom-3 left-3 z-20 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white">Prima</span>
          <span className="pointer-events-none absolute bottom-3 right-3 z-20 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white">Dopo</span>
        </div>
      ) : <img src={photos[i]} alt="" className="max-h-[86vh] max-w-[92vw] object-contain" onClick={e => e.stopPropagation()} />}
      <button className="absolute right-5 top-5 text-white" onClick={() => setI(null)} aria-label="Chiudi"><X size={28} /></button>
      <button className="absolute left-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white" onClick={e => { e.stopPropagation(); setI((i - 1 + photos.length) % photos.length); }}><ChevronLeft /></button>
      <button className="absolute right-4 top-1/2 flex h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white" onClick={e => { e.stopPropagation(); setI((i + 1) % photos.length); }}><ChevronRight /></button>
      <span className="absolute bottom-5 text-sm text-white/70">{i + 1} / {photos.length}</span>
    </div>
  );
}

function Gallery({ p }: { p: SiteProperty }) {
  const { t } = useSite();
  const photos = p.photos?.length ? p.photos : p.cover ? [p.cover] : [];
  // etichetta sulle foto AI che hanno l'originale: aprendole si vede il prima/dopo
  const tag = (src: string) => p.prima?.[src] ? <span className="pointer-events-none absolute left-3 top-3 z-10 flex items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-neutral-900 shadow"><Sparkles size={11} /> Prima / Dopo</span> : null;
  const [i, setI] = useState<number | null>(null);
  const [cur, setCur] = useState(0);
  const alt = (k: number) => `${p.titolo}, foto ${k + 1}`; // testo alternativo per Google Immagini e lettori di schermo
  const all = photos.length > 1 && <button onClick={() => setI(0)} className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-lg"><Expand size={14} /> {photos.length} foto</button>;
  let body: ReactNode;
  if (t.gallery === 'slider') body = (
    <div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--r)]">
        <button onClick={() => setI(cur)} className="h-full w-full"><Photo src={photos[cur]} alt={alt(cur)} fit className="h-full" /></button>{tag(photos[cur])}
        {photos.length > 1 && <>
          <button onClick={() => setCur((cur - 1 + photos.length) % photos.length)} className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow"><ChevronLeft size={18} /></button>
          <button onClick={() => setCur((cur + 1) % photos.length)} className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow"><ChevronRight size={18} /></button>
        </>}
        {all}
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {photos.map((src, k) => <button key={k} onClick={() => setCur(k)} className={`h-20 w-28 shrink-0 overflow-hidden rounded-[calc(var(--r)*0.6)] transition-opacity ${k === cur ? 'ring-2 ring-[var(--c)] ring-offset-2' : 'opacity-60 hover:opacity-100'}`}><Photo src={src} alt={alt(k)} className="h-full" /></button>)}
      </div>
    </div>
  );
  else if (t.gallery === 'full') body = (
    <div className="relative h-[70vh] min-h-[480px] overflow-hidden">
      <button onClick={() => setI(0)} className="h-full w-full"><Photo src={photos[0]} alt={alt(0)} fit className="h-full" /></button>{tag(photos[0])}
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      {all}
    </div>
  );
  else body = (
    <div className="relative grid h-[480px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-[var(--r)] md:h-[540px]">
      {photos.slice(0, 5).map((src, k) => (
        <button key={k} onClick={() => setI(k)} className={`group relative overflow-hidden ${k === 0 ? 'col-span-4 row-span-2 md:col-span-2' : 'hidden md:block'}`}><Photo src={src} alt={alt(k)} zoom fit className="h-full" />{tag(src)}</button>
      ))}
      {all}
    </div>
  );
  return <>{body}<Lightbox photos={photos} prima={p.prima} i={i} setI={setI} /></>;
}

function AgentCard({ subject, property }: { subject?: string; property?: SiteProperty }) {
  const { cfg, name } = useSite();
  const tx = useT();
  const c = contacts(cfg, subject);
  return (
    <div id="contatti" className="rounded-[var(--r)] bg-[var(--surface)] p-4 sm:p-6 shadow-[0_20px_50px_-25px_rgba(0,0,0,.25)] ring-1 ring-[var(--line)]">
      <div className="flex items-center gap-3.5">
        {cfg.aboutImage ? <Photo src={cfg.aboutImage} alt={name} className="h-14 w-14 rounded-full" /> : <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--c)] text-lg font-bold text-white">{name.slice(0, 1)}</span>}
        <div className="min-w-0"><div className="truncate font-semibold">{name}</div><div className="text-sm text-[var(--muted)]">{cfg.agentRole}</div></div>
      </div>
      <div className="mt-5 grid gap-2">
        {c.wa && <Btn href={c.wa} external className="w-full"><MessageCircle size={16} /> Scrivimi su WhatsApp</Btn>}
        {c.tel && <Btn href={c.tel} variant={c.wa ? 'ghost' : 'solid'} className="w-full"><Phone size={16} /> {cfg.phone}</Btn>}
        {c.mail && <Btn href={c.mail} variant="ghost" className="w-full"><Mail size={16} /> Richiedi una visita</Btn>}
        {!c.wa && !c.tel && !c.mail && <p className="text-sm text-[var(--muted)]">Contatti in arrivo.</p>}
      </div>
      {property && <div className="mt-6 border-t border-[var(--line)] pt-6"><div className="mb-3 text-sm font-semibold">{tx('property.form')}</div><ContactForm property={property} compact /></div>}
      <SiteLink to={{ page: 'agente' }} className="mt-4 block text-center text-sm font-medium text-[var(--c)] hover:underline">{cfg.aboutTitle}</SiteLink>
    </div>
  );
}

function PropertyPage({ id }: { id: string }) {
  const { properties, cfg, t } = useSite();
  const tx = useT();
  const p = properties.find(x => x.id === id) ?? properties[0];
  const [more, setMore] = useState(false);
  if (!p) return <><Sec id="header"><Header /></Sec><Container className="py-24 text-center text-[var(--muted)]">Immobile non trovato.</Container><Footer /></>;
  const similar = properties.filter(x => x.id !== p.id).slice(0, 3);
  const desc = p.descrizione ?? '';
  const crumbs = (
    <nav className="mb-5 flex flex-wrap items-center gap-1.5 text-sm opacity-75" aria-label="Percorso">
      <SiteLink to={{ page: 'home' }} className="hover:underline">Home</SiteLink><span>/</span>
      <SiteLink to={{ page: 'immobili' }} className="hover:underline">Immobili</SiteLink><span>/</span>
      <SiteLink to={{ page: 'immobili', f: { tipo: typeOf(p), contratto: isRent(p) ? 'affitto' : 'vendita' } }} className="hover:underline">{typeOf(p)} in {isRent(p) ? 'affitto' : 'vendita'}</SiteLink>
    </nav>
  );
  const heading = (
    <>
      {t.gallery === 'full' && crumbs}
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-[calc(var(--r)*0.5)] bg-[var(--c)] px-2.5 py-1 text-[11px] font-semibold text-white">{isRent(p) ? 'In affitto' : 'In vendita'}</span>
        <span className="rounded-[calc(var(--r)*0.5)] bg-[var(--soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--fg)]">{typeOf(p)}</span>
      </div>
      <H as="h1" className="mt-4 text-4xl md:text-5xl">{p.titolo}</H>
      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 opacity-75"><AddressLink addr={(p.details as { mostra_indirizzo?: boolean } | undefined)?.mostra_indirizzo ? p.addr : zoneOf(p.addr) || p.addr} />{p.riferimento && <span className="text-sm">Rif. {p.riferimento}</span>}</div>
    </>
  );
  return (
    <>
      <Sec id="header"><Header /></Sec>
      {t.gallery === 'full' ? (
        <div className="relative"><Gallery p={p} /><Container className="absolute inset-x-0 bottom-10 text-white">{heading}</Container></div>
      ) : (
        <Container className="pt-8">
          <div className="text-[var(--muted)]">{crumbs}</div>
          <Gallery p={p} />
        </Container>
      )}
      <Container className="grid gap-12 py-12 lg:grid-cols-[1fr_360px]">
        <div>
          {t.gallery !== 'full' && heading}
          {cfg.showPrices && <div className={`${t.gallery === 'full' ? '' : 'mt-6'} text-4xl font-bold tracking-tight`}>{price(p.prezzo)}{isRent(p) && p.prezzo ? <span className="text-lg font-medium text-[var(--muted)]"> /mese</span> : null}</div>}
          <Facts p={p} full className="mt-8" />
          <div className="mt-6 flex flex-wrap items-center gap-2"><ShareBar title={p.titolo} /><ReportButton id={p.id} /><FavButton id={p.id} className="!h-10 !w-10 ring-1 ring-[var(--line)] !shadow-none" /></div>
          {desc && (
            <Sec id="property.desc"><div className="mt-12">
              <H className="text-3xl">{tx('property.desc')}</H>
              <p className={`mt-4 whitespace-pre-line text-[17px] leading-relaxed text-[var(--muted)] ${more ? '' : 'line-clamp-6'}`}>{desc}</p>
              {desc.length > 400 && <button onClick={() => setMore(v => !v)} className="mt-2 text-sm font-semibold text-[var(--c)]">{more ? 'Mostra meno' : 'Leggi tutto'}</button>}
            </div></Sec>
          )}
          <Sec id="property.details"><div className="mt-12"><DetailsTable p={p} /></div></Sec>
          <Sec id="property.features"><div className="mt-12 empty:hidden"><FeatureList p={p} /></div></Sec>
          <div className="mt-12 empty:hidden"><TourBlock p={p} /></div>
          {(!!p.zona?.length || !!p.addr) && (
            <Sec id="property.zone"><div className="mt-12">
              {!!p.zona?.length && <>
                <H className="text-3xl">{tx('property.zone')}</H>
                <ul className="mb-12 mt-5 grid gap-2 sm:grid-cols-2">{p.zona.map(z => <li key={z} className="flex items-center gap-2.5 rounded-[calc(var(--r)*0.6)] bg-[var(--soft)] px-4 py-3 text-sm"><MapPin size={14} className="text-[var(--c)]" />{z}</li>)}</ul>
              </>}
              {/* le 10 cose piu' vicine, con il raggio a scelta */}
              {p.addr && (p.details as { distanze_auto?: boolean } | undefined)?.distanze_auto !== false && <NearbyList p={p} />}
            </div></Sec>
          )}
          {p.addr && <Sec id="property.map"><div className="mt-12"><MapBlock addr={p.addr} /></div></Sec>}
        </div>
        <aside><div className="sticky top-24"><Sec id="property.agent"><AgentCard subject={p.titolo} property={p} /></Sec></div></aside>
      </Container>
      {similar.length > 0 && (
        <Sec id="property.similar"><section className="bg-[var(--soft)] py-20">
          <Container>
            <SectionHead title={tx('property.similar')} link={{ label: 'Vedi tutti', to: { page: 'immobili' } }} />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{similar.map(x => <PropertyCard key={x.id} p={x} />)}</div>
          </Container>
        </section></Sec>
      )}
      <Sec id="footer"><Footer /></Sec>
    </>
  );
}

// ---------- Profilo agente: 3 impostazioni ----------
function AgentPage() {
  const { cfg, name, properties, t } = useSite();
  const tx = useT();
  const stats = statsOf(cfg, properties);
  const c = contacts(cfg);
  // il primo paragrafo va in alto, il resto (con eventuali "## Sottotitoli") sotto come storia
  const [intro, ...rest] = cfg.aboutText.split(/\n{2,}/);
  // senza foto: iniziale su fondo tenue, su telefono bassa (niente mezzo schermo vuoto)
  const photo = (cls: string) => cfg.aboutImage ? <Photo src={cfg.aboutImage} alt={name} className={cls} /> : <span className={`flex items-center justify-center bg-[var(--soft)] text-6xl font-bold text-[var(--muted)]/50 ${cls.replace('aspect-[4/5]', 'aspect-[16/9] md:aspect-[4/5]')}`}>{name.slice(0, 1)}</span>;
  const buttons = (
    <div className="flex flex-wrap gap-3">
      {c.wa && <Btn href={c.wa} external><MessageCircle size={16} /> WhatsApp</Btn>}
      {c.tel && <Btn href={c.tel} variant="ghost"><Phone size={16} /> {cfg.phone}</Btn>}
      {c.mail && <Btn href={c.mail} variant="ghost"><Mail size={16} /> {cfg.email}</Btn>}
    </div>
  );
  const hl = cfg.highlights.length > 0 && <ul className="grid gap-2 sm:grid-cols-2">{cfg.highlights.map(h => <li key={h} className="flex items-center gap-2 text-sm font-medium"><span className="h-1.5 w-1.5 rounded-full bg-[var(--c)]" />{h}</li>)}</ul>;
  const areas = cfg.areas && <div className="flex flex-wrap gap-2">{cfg.areas.split(',').map(a => a.trim()).filter(Boolean).map(a => <span key={a} className="rounded-full bg-[var(--surface)] px-3.5 py-1.5 text-sm ring-1 ring-[var(--line)]">{a}</span>)}</div>;
  const statRow = cfg.showStats && stats.length > 0 && <div className="grid grid-cols-2 gap-6 md:grid-cols-4">{stats.map(s => <div key={s.l}><div className="text-4xl font-bold tracking-tight text-[var(--c)]">{s.v}</div><div className="mt-1 text-sm text-[var(--muted)]">{s.l}</div></div>)}</div>;

  let top: ReactNode;
  if (t.agent === 'cover') top = (
    <section>
      <div className="relative h-72 overflow-hidden"><Photo src={cfg.heroImage || properties[0]?.cover} className="h-full" /><div className="absolute inset-0 bg-[var(--ink)]/40" /></div>
      <Container className="relative -mt-24">
        <div className="rounded-[calc(var(--r)*1.3)] bg-[var(--surface)] p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,.35)] ring-1 ring-[var(--line)] md:flex md:gap-10 md:p-10">
          {photo('h-40 w-40 shrink-0 rounded-full ring-4 ring-[var(--surface)] -mt-24 md:-mt-28')}
          <div className="mt-6 md:mt-0">
            <Eyebrow>{cfg.agentRole}{cfg.city ? ` · ${cfg.city}` : ''}</Eyebrow>
            <H as="h1" className="mt-3 text-4xl md:text-5xl">{name}</H>
            <p className="mt-4 max-w-2xl leading-relaxed text-[var(--muted)]">{intro}</p>
            <div className="mt-6 space-y-5">{hl}{areas}{buttons}</div>
          </div>
        </div>
        {statRow && <div className="mt-12">{statRow}</div>}
      </Container>
    </section>
  );
  else if (t.agent === 'centered') top = (
    <Container className="py-20 text-center">
      {photo('mx-auto h-44 w-44 rounded-full')}
      <Eyebrow className="mt-8">{cfg.agentRole}{cfg.city ? ` · ${cfg.city}` : ''}</Eyebrow>
      <H as="h1" className="mx-auto mt-4 max-w-3xl text-5xl md:text-7xl">{name}</H>
      <p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">{intro}</p>
      <div className="mt-8 flex flex-col items-center gap-5 [&>div]:justify-center">{hl}{areas}{buttons}</div>
      {statRow && <div className="mx-auto mt-16 max-w-4xl border-y border-[var(--line)] py-10 text-left">{statRow}</div>}
    </Container>
  );
  else top = (
    <section className={t.header === 'over' ? 'bg-[var(--ink)] text-white [--c:#fff] [--on-c:#111] [--fg:#fff] [--muted:rgba(255,255,255,.65)] [--surface:rgba(255,255,255,.08)] [--line:rgba(255,255,255,.18)] [--soft:rgba(255,255,255,.08)]' : 'bg-[var(--soft)]'}>
      <Container className="grid items-center gap-12 py-20 lg:grid-cols-[420px_1fr]">
        {photo('aspect-[4/5] rounded-[calc(var(--r)*1.3)]')}
        <div>
          <Eyebrow>{cfg.agentRole}{cfg.city ? ` · ${cfg.city}` : ''}</Eyebrow>
          <H as="h1" className="mt-4 text-5xl md:text-6xl">{name}</H>
          <p className="mt-6 max-w-2xl text-lg leading-relaxed text-[var(--muted)]">{intro}</p>
          <div className="mt-8 space-y-6">{hl}{areas}{buttons}</div>
          {statRow && <div className="mt-12 border-t border-[var(--line)] pt-10">{statRow}</div>}
        </div>
      </Container>
    </section>
  );
  return (
    <>
      <Sec id="header"><Header /></Sec>
      <Sec id="agent.top">{top}
      {rest.length > 0 && <Container className="max-w-3xl pt-20"><RichText text={rest.join('\n\n')} /></Container>}</Sec>
      <Sec id="agent.listings"><Container className="py-20">
        <SectionHead eyebrow={tx('agent.listingsEyebrow')} title={tx('agent.listingsTitle')} link={{ label: 'Cerca tra tutti', to: { page: 'immobili' } }} />
        <div className="mt-8">{t.results === 'rows'
          ? <div className="border-t border-[var(--line)]">{properties.slice(0, 4).map(p => <PropertyRow key={p.id} p={p} />)}</div>
          : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{properties.slice(0, 6).map(p => <PropertyCard key={p.id} p={p} />)}</div>}</div>
      </Container></Sec>
      <Sec id="home.reviews"><Reviews /></Sec>
      <Sec id="cta"><CtaBand /></Sec>
      <Sec id="footer"><Footer /></Sec>
    </>
  );
}

// ---------- Servizi: card, elenco o passi ----------
function ServicesPage() {
  const { cfg, t } = useSite();
  const tx = useT();
  let body: ReactNode;
  if (t.services === 'list') body = (
    <div className="divide-y divide-[var(--line)] border-y border-[var(--line)]">
      {cfg.services.map((x, i) => (
        <div key={i} className="grid gap-4 py-10 md:grid-cols-[120px_1fr_1.4fr] md:items-baseline">
          <span className="font-display text-5xl font-bold text-[var(--c)]">{String(i + 1).padStart(2, '0')}</span>
          <H as="h3" className="text-3xl">{x.title}</H>
          <p className="text-[17px] leading-relaxed text-[var(--muted)]">{x.text}</p>
        </div>
      ))}
    </div>
  );
  else if (t.services === 'steps') body = (
    <ol className="relative space-y-10 border-l-2 border-[var(--line)] pl-10">
      {cfg.services.map((x, i) => (
        <li key={i} className="relative">
          <span className="absolute -left-[3.35rem] flex h-10 w-10 items-center justify-center rounded-full bg-[var(--c)] text-sm font-bold text-[var(--on-c,#fff)] ring-8 ring-[var(--bg)]">{i + 1}</span>
          <H as="h3" className="text-3xl">{x.title}</H>
          <p className="mt-3 max-w-2xl text-[17px] leading-relaxed text-[var(--muted)]">{x.text}</p>
        </li>
      ))}
    </ol>
  );
  else body = <ServicesGrid numbered />;
  return (
    <>
      <Sec id="header"><Header /></Sec>
      <Sec id="services.head"><PageHead eyebrow={tx('services.eyebrow')} title={tx('services.title')} sub={tx('services.sub')} /></Sec>
      <Sec id="services.list"><Container className={`py-16 ${t.services === 'steps' ? 'max-w-4xl' : ''}`}>{body}</Container></Sec>
      {/* il metodo, in evidenza */}
      {cfg.method && (
        <Sec id="services.method"><section className="bg-[var(--ink)] py-20 text-white">
          <Container className="grid gap-8 md:grid-cols-[1fr_1.6fr] md:items-center">
            <div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/60">{tx('services.methodLabel')}</div>
            <H className="text-2xl leading-snug md:text-4xl">{cfg.method}</H>
          </Container>
        </section></Sec>
      )}
      <Sec id="services.form"><Container className="py-20">
        <div className="-mx-4 grid items-center gap-8 bg-[var(--soft)] p-4 sm:mx-0 sm:gap-10 sm:rounded-[calc(var(--r)*1.2)] sm:p-8 md:grid-cols-2 md:p-12">
          <div><H className="text-3xl md:text-4xl">{tx('services.formTitle')}</H><p className="mt-3 text-[var(--muted)]">{tx('services.formText')}</p>
            {cfg.highlights.length > 0 && <ul className="mt-6 space-y-2">{cfg.highlights.map(h => <li key={h} className="flex items-center gap-2 text-sm font-medium"><span className="h-1.5 w-1.5 rounded-full bg-[var(--c)]" />{h}</li>)}</ul>}</div>
          <div className="rounded-[var(--r)] bg-[var(--surface)] p-4 sm:p-6"><ContactForm compact /></div>
        </div>
      </Container></Sec>
      <Sec id="footer"><Footer /></Sec>
    </>
  );
}

// ---------- Contatti: diviso, card sopra la mappa o fascia ----------
function ContactPage() {
  const { cfg, name, t } = useSite();
  const tx = useT();
  const c = contacts(cfg);
  const info = (
    <div className="space-y-4">
      <div className="text-lg font-semibold">{name}</div>
      {cfg.address && <div className="opacity-80"><AddressLink addr={cfg.address} iconSize={17} /></div>}
      {c.tel && <a href={c.tel} className="flex items-center gap-3"><Phone size={17} className="text-[var(--c)]" />{cfg.phone}</a>}
      {c.mail && <a href={c.mail} className="flex items-center gap-3"><Mail size={17} className="text-[var(--c)]" />{cfg.email}</a>}
      {c.wa && <Btn href={c.wa} external className="mt-4"><MessageCircle size={16} /> Scrivimi su WhatsApp</Btn>}
    </div>
  );
  const form = <Sec id="contact.form"><div className="rounded-[var(--r)] bg-[var(--surface)] p-4 text-[var(--fg)] shadow-[0_30px_80px_-40px_rgba(0,0,0,.35)] ring-1 ring-[var(--line)] sm:p-6 md:p-8"><H className="mb-6 text-2xl">{tx('contact.formTitle')}</H><ContactForm /></div></Sec>;
  let body: ReactNode;
  if (t.contact === 'card') body = (
    <section className="relative">
      {cfg.address ? <div className="[&_h2]:hidden [&_p]:hidden [&>div>div]:!mt-0 [&>div>div]:!h-[340px] md:[&>div>div]:!h-[520px] [&>div>div]:!rounded-none"><MapBlock addr={cfg.address} /></div> : <div className="h-72 bg-[var(--soft)]" />}
      <Container className={`relative z-10 grid gap-8 md:grid-cols-[1fr_1.2fr] ${cfg.address ? '-mt-16 md:-mt-64' : '-mt-16 md:-mt-40'} pb-20`}>
        <div className="self-end rounded-[var(--r)] bg-[var(--surface)] p-5 sm:p-8 shadow-[0_30px_80px_-40px_rgba(0,0,0,.35)] ring-1 ring-[var(--line)]">{info}</div>
        {form}
      </Container>
    </section>
  );
  else if (t.contact === 'band') body = (
    <>
      <section className="bg-[var(--ink)] py-16 text-white [--muted:rgba(255,255,255,.65)]">
        <Container className="grid gap-10 md:grid-cols-3">
          {[['Chiamami', cfg.phone, c.tel], ['Scrivimi', cfg.email, c.mail], ['Passa in ufficio', cfg.address, '']].filter(x => x[1]).map(([l, v, h]) => (
            <div key={l}><div className="text-[11px] font-semibold uppercase tracking-[0.3em] text-white/50">{l}</div>{h ? <a href={h} className="mt-3 block text-2xl font-semibold">{v}</a> : <div className="mt-3 text-2xl font-semibold">{v}</div>}</div>
          ))}
        </Container>
      </section>
      <Container className="grid gap-12 py-16 lg:grid-cols-[1.3fr_1fr]">{form}{cfg.address && <MapBlock addr={cfg.address} />}</Container>
    </>
  );
  else body = (
    <Container className="grid gap-12 py-16 lg:grid-cols-[1fr_1.3fr]">
      <div>{info}{cfg.address && <div className="pt-10"><MapBlock addr={cfg.address} /></div>}</div>
      {form}
    </Container>
  );
  return <><Sec id="header"><Header /></Sec><Sec id="contact.head"><PageHead eyebrow={tx('contact.eyebrow')} title={tx('contact.title')} sub={tx('contact.sub')} /></Sec><Sec id="contact.info">{body}</Sec><Sec id="footer"><Footer /></Sec></>;
}

// ---------- Pagina di una zona ("Casa a Sirolo"): testo sulla localita' + annunci della zona ----------
function ZonePage({ slug }: { slug: string }) {
  const { cfg, properties, t } = useSite();
  const tx = useT();
  const z = cfg.zones.find(x => zoneSlug(x.name) === slug) ?? cfg.zones[0];
  if (!z) return <><Sec id="header"><Header /></Sec><Container className="py-24 text-center text-[var(--muted)]">Pagina non trovata.</Container><Footer /></>;
  const here = properties.filter(p => p.addr?.toLowerCase().includes(z.name.toLowerCase()));
  const list = here.length ? here : properties;
  const grid = (ps: SiteProperty[]) => t.results === 'rows'
    ? <div className="border-t border-[var(--line)]">{ps.map(p => <PropertyRow key={p.id} p={p} />)}</div>
    : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{ps.map(p => <PropertyCard key={p.id} p={p} />)}</div>;
  const head = <PageHead eyebrow={tx('zone.eyebrow')} title={`Casa a ${z.name}`} sub={here.length ? `${here.length} ${here.length === 1 ? 'immobile disponibile' : 'immobili disponibili'}` : 'Al momento nessun immobile qui: ecco gli altri disponibili'} />;
  if (t.zone === 'wide') return (
    <>
      <Sec id="header"><Header /></Sec><Sec id="zone.page">{head}</Sec>
      <Container className="max-w-3xl py-16"><RichText text={z.text} /></Container>
      <section className="bg-[var(--soft)] py-16">
        <Container>
          <SectionHead title={here.length ? `Immobili a ${z.name}` : 'Immobili disponibili'} link={{ label: 'Cerca tra tutti', to: { page: 'immobili', f: { q: z.name } } }} />
          <div className="mt-8">{grid(list.slice(0, 6))}</div>
        </Container>
      </section>
      <Sec id="cta"><CtaBand /></Sec><Sec id="footer"><Footer /></Sec>
    </>
  );
  return (
    <>
      <Sec id="header"><Header /></Sec><Sec id="zone.page">{head}</Sec>
      <Container className="grid gap-12 py-16 lg:grid-cols-[1fr_340px]">
        <RichText text={z.text} />
        <aside className="space-y-8">
          <div className="rounded-[var(--r)] bg-[var(--soft)] p-4 sm:p-5"><div className="mb-4 text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">Ricerca avanzata</div><SearchForm layout="stack" /></div>
          <div className="space-y-4"><div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[var(--muted)]">{here.length ? `Ultimi a ${z.name}` : 'Immobili disponibili'}</div>{list.slice(0, 3).map(p => <PropertyCard key={p.id} p={p} />)}</div>
        </aside>
      </Container>
      {here.length > 3 && <Container className="pb-16"><SectionHead title={`Tutti gli immobili a ${z.name}`} /><div className="mt-8">{grid(here.slice(3))}</div></Container>}
      <Sec id="cta"><CtaBand /></Sec><Sec id="footer"><Footer /></Sec>
    </>
  );
}

// Anteprima leggera per la galleria dei modelli: solo barra, apertura e prima sezione
export function SiteThumb({ ctx }: { ctx: SiteCtx }) {
  // tutta la home: nella galleria dei modelli la miniatura ci scorre sopra al passaggio del mouse
  return <SiteRoot ctx={ctx}><HomePage /></SiteRoot>;
}

export function SitePage({ ctx, page }: { ctx: SiteCtx; page: Page }) {
  return (
    <SiteRoot ctx={ctx}>
      <div className="relative">
        {page.page === 'home' ? <HomePage /> : page.page === 'immobili' ? <ListingsPage key={JSON.stringify(page.f ?? {})} initial={page.f} /> : page.page === 'immobile' ? <PropertyPage key={page.id} id={page.id} />
          : page.page === 'servizi' ? <ServicesPage /> : page.page === 'contatti' ? <ContactPage /> : page.page === 'zona' ? <ZonePage slug={page.slug} /> : page.page === 'legal' ? <><Sec id="header"><Header /></Sec><LegalPage doc={page.doc} /><Sec id="footer"><Footer /></Sec></> : <AgentPage />}
        <WhatsAppFloat />
      </div>
    </SiteRoot>
  );
}
