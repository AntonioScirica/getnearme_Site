'use client';

import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { ArrowLeft, ChevronLeft, ChevronRight, Expand, Mail, MapPin, MessageCircle, Phone, Search, SlidersHorizontal, X } from 'lucide-react';
import type { SiteProperty } from '@/lib/siteTemplates';
import { AboutBlock, CtaBand, Featured, Footer, Header, Hero, Intro, isRent, PropertyCard, PropertyRow, Reviews, SectionHead, statsOf, tipiOf, Zones, type Filters } from './sections';
import { Btn, Container, contacts, Eyebrow, Facts, H, Photo, price, SiteLink, SiteRoot, typeOf, useSite, type Page, type SiteCtx } from './ui';

// Le 4 pagine del sito vetrina. Struttura comune, ma ogni template sceglie le sue varianti:
// filtri laterali o in alto, card o righe, galleria a mosaico, slider o a tutto schermo, profilo diviso, con copertina o centrato.

function HomePage() {
  return <><Header over /><Hero /><Intro /><Featured /><AboutBlock /><Reviews /><Zones /><CtaBand /><Footer /></>;
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
type F = Filters & { min?: number; camere?: number; bagni?: number; sort?: string };
const PER_PAGE = 9;
function useFilter(initial?: Filters) {
  const { properties } = useSite();
  const [f, setF] = useState<F>({ ...initial });
  const list = useMemo(() => {
    const q = f.q?.toLowerCase().trim();
    const r = properties.filter(p =>
      (!q || `${p.titolo} ${p.addr}`.toLowerCase().includes(q)) && (!f.tipo || p.tipologia?.startsWith(f.tipo)) &&
      (!f.contratto || (f.contratto === 'affitto') === isRent(p)) && (!f.max || (p.prezzo && p.prezzo <= f.max)) && (!f.min || p.prezzo >= f.min) &&
      (!f.camere || (p.camere ?? 0) >= f.camere) && (!f.bagni || (p.bagni ?? 0) >= f.bagni));
    if (f.sort === 'asc') r.sort((a, b) => (a.prezzo || 9e9) - (b.prezzo || 9e9));
    if (f.sort === 'desc') r.sort((a, b) => b.prezzo - a.prezzo);
    if (f.sort === 'mq') r.sort((a, b) => b.mq - a.mq);
    return r;
  }, [properties, f]);
  return { f, setF, set: (p: Partial<F>) => setF(x => ({ ...x, ...p })), list, tipi: tipiOf(properties) };
}

function ListingsPage({ initial }: { initial?: Filters }) {
  const { t } = useSite();
  const s = useFilter(initial);
  const { f, set, setF, list, tipi } = s;
  const [pageN, setPageN] = useState(0);
  const [open, setOpen] = useState(false);
  useEffect(() => { setPageN(0); }, [f]); // eslint-disable-line react-hooks/set-state-in-effect
  const pages = Math.ceil(list.length / PER_PAGE);
  const shown = list.slice(pageN * PER_PAGE, pageN * PER_PAGE + PER_PAGE);
  const field = 'h-11 w-full rounded-[calc(var(--r)*0.6)] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm outline-none focus:border-[var(--c)]';
  const chip = (on: boolean) => `h-10 flex-1 rounded-[calc(var(--r)*0.6)] border px-3 text-sm font-medium transition-colors ${on ? 'border-[var(--c)] bg-[var(--c)] text-white' : 'border-[var(--line)] bg-[var(--surface)] hover:border-[var(--fg)]'}`;
  const contratto = <div className="flex gap-2">{[['', 'Tutti'], ['vendita', 'Vendita'], ['affitto', 'Affitto']].map(([v, l]) => <button key={v} onClick={() => set({ contratto: v || undefined })} className={chip((f.contratto ?? '') === v)}>{l}</button>)}</div>;
  const zona = <div className="relative"><MapPin size={15} className="absolute left-3 top-3.5 text-[var(--muted)]" /><input value={f.q ?? ''} onChange={e => set({ q: e.target.value })} placeholder="Città, quartiere, via" className={`${field} pl-9`} /></div>;
  const tipo = <select value={f.tipo ?? ''} onChange={e => set({ tipo: e.target.value || undefined })} className={field}><option value="">Tutte le tipologie</option>{tipi.map(x => <option key={x}>{x}</option>)}</select>;
  const prezzo = <div className="flex gap-2"><input type="number" inputMode="numeric" placeholder="Min €" value={f.min ?? ''} onChange={e => set({ min: Number(e.target.value) || undefined })} className={field} /><input type="number" inputMode="numeric" placeholder="Max €" value={f.max ?? ''} onChange={e => set({ max: Number(e.target.value) || undefined })} className={field} /></div>;
  const counts = (k: 'camere' | 'bagni') => <div className="flex gap-2">{[0, 1, 2, 3, 4].map(n => <button key={n} onClick={() => set({ [k]: n || undefined })} className={chip((f[k] ?? 0) === n)}>{n ? `${n}+` : 'Tutti'}</button>)}</div>;
  const sort = (
    <select value={f.sort ?? ''} onChange={e => set({ sort: e.target.value || undefined })} className="h-11 rounded-[calc(var(--r)*0.6)] border border-[var(--line)] bg-[var(--surface)] px-3 text-sm outline-none">
      <option value="">Più recenti</option><option value="asc">Prezzo crescente</option><option value="desc">Prezzo decrescente</option><option value="mq">Più grandi</option>
    </select>
  );
  const sidebar = (
    <div className="space-y-6">
      {contratto}
      <label className="block"><span className="mb-1.5 block text-xs font-semibold">Zona</span>{zona}</label>
      <label className="block"><span className="mb-1.5 block text-xs font-semibold">Tipologia</span>{tipo}</label>
      <div><span className="mb-1.5 block text-xs font-semibold">Prezzo</span>{prezzo}</div>
      <div><span className="mb-1.5 block text-xs font-semibold">Camere</span>{counts('camere')}</div>
      <div><span className="mb-1.5 block text-xs font-semibold">Bagni</span>{counts('bagni')}</div>
      <button onClick={() => setF({})} className="text-sm font-semibold text-[var(--c)] hover:underline">Azzera filtri</button>
    </div>
  );
  const results = (
    <>
      {t.results === 'rows'
        ? <div className="border-t border-[var(--line)]">{shown.map(p => <PropertyRow key={p.id} p={p} />)}</div>
        : <div className={`grid gap-6 sm:grid-cols-2 ${t.listings === 'topbar' ? 'lg:grid-cols-3' : 'xl:grid-cols-3'}`}>{shown.map(p => <PropertyCard key={p.id} p={p} />)}</div>}
      {!list.length && <div className="rounded-[var(--r)] bg-[var(--soft)] px-6 py-16 text-center text-[var(--muted)]">Nessun immobile con questi filtri. <button onClick={() => setF({})} className="font-semibold text-[var(--c)]">Azzera</button></div>}
      {pages > 1 && (
        <div className="mt-12 flex items-center justify-center gap-2">
          <button disabled={!pageN} onClick={() => setPageN(n => n - 1)} className="flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-30"><ChevronLeft size={18} /></button>
          {Array.from({ length: pages }, (_, i) => <button key={i} onClick={() => setPageN(i)} className={`h-10 w-10 rounded-full text-sm font-semibold ${i === pageN ? 'bg-[var(--fg)] text-[var(--bg)]' : 'hover:bg-[var(--soft)]'}`}>{i + 1}</button>)}
          <button disabled={pageN >= pages - 1} onClick={() => setPageN(n => n + 1)} className="flex h-10 w-10 items-center justify-center rounded-full disabled:opacity-30"><ChevronRight size={18} /></button>
        </div>
      )}
    </>
  );
  const title = f.q ? `Immobili a ${f.q}` : 'Tutti gli immobili';
  const sub = `${list.length} ${list.length === 1 ? 'risultato' : 'risultati'}`;

  return (
    <>
      <Header />
      {t.listings === 'topbar' ? (
        <>
          <PageHead eyebrow="Immobili" title={title} sub={sub} />
          {/* filtri in una barra sopra i risultati */}
          <Container className={t.header === 'over' ? '-mt-8 relative z-10' : 'mt-4'}>
            <div className="flex flex-col gap-3 rounded-[var(--r)] bg-[var(--surface)] p-3 shadow-[0_20px_60px_-25px_rgba(0,0,0,.25)] ring-1 ring-[var(--line)] lg:flex-row lg:items-center">
              <div className="flex-[1.4]">{zona}</div><div className="flex-1">{tipo}</div>
              <div className="flex-1"><select value={f.max ?? ''} onChange={e => set({ max: Number(e.target.value) || undefined })} className={field}><option value="">Qualsiasi prezzo</option>{[150000, 250000, 400000, 600000, 1000000].map(v => <option key={v} value={v}>Fino a {price(v)}</option>)}</select></div>
              <div className="flex-1"><select value={f.camere ?? ''} onChange={e => set({ camere: Number(e.target.value) || undefined })} className={field}><option value="">Camere</option>{[1, 2, 3, 4].map(n => <option key={n} value={n}>{n}+ camere</option>)}</select></div>
              <button className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-[calc(var(--r)*0.6)] bg-[var(--c)] px-5 text-sm font-semibold text-white"><Search size={15} /> Cerca</button>
            </div>
            <div className="mt-6 flex items-center justify-between gap-3"><div className="w-72">{contratto}</div>{sort}</div>
          </Container>
          <Container className="py-10">{results}</Container>
        </>
      ) : (
        <>
          <PageHead eyebrow="Immobili" title={title} sub={sub} />
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
      <CtaBand />
      <Footer />
    </>
  );
}

// ---------- Scheda immobile ----------
function Lightbox({ photos, i, setI }: { photos: string[]; i: number | null; setI: (n: number | null) => void }) {
  useEffect(() => {
    if (i === null) return;
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') setI(null); if (e.key === 'ArrowRight') setI((i + 1) % photos.length); if (e.key === 'ArrowLeft') setI((i - 1 + photos.length) % photos.length); };
    window.addEventListener('keydown', k); return () => window.removeEventListener('keydown', k);
  }, [i, photos.length, setI]);
  if (i === null) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/92" onClick={() => setI(null)}>
      <img src={photos[i]} alt="" className="max-h-[86vh] max-w-[92vw] object-contain" onClick={e => e.stopPropagation()} />
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
  const [i, setI] = useState<number | null>(null);
  const [cur, setCur] = useState(0);
  const all = photos.length > 1 && <button onClick={() => setI(0)} className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-neutral-900 shadow-lg"><Expand size={14} /> {photos.length} foto</button>;
  let body: ReactNode;
  if (t.gallery === 'slider') body = (
    <div>
      <div className="relative aspect-[16/9] overflow-hidden rounded-[var(--r)]">
        <button onClick={() => setI(cur)} className="h-full w-full"><Photo src={photos[cur]} className="h-full" /></button>
        {photos.length > 1 && <>
          <button onClick={() => setCur((cur - 1 + photos.length) % photos.length)} className="absolute left-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow"><ChevronLeft size={18} /></button>
          <button onClick={() => setCur((cur + 1) % photos.length)} className="absolute right-4 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-neutral-900 shadow"><ChevronRight size={18} /></button>
        </>}
        {all}
      </div>
      <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
        {photos.map((src, k) => <button key={k} onClick={() => setCur(k)} className={`h-20 w-28 shrink-0 overflow-hidden rounded-[calc(var(--r)*0.6)] transition-opacity ${k === cur ? 'ring-2 ring-[var(--c)] ring-offset-2' : 'opacity-60 hover:opacity-100'}`}><Photo src={src} className="h-full" /></button>)}
      </div>
    </div>
  );
  else if (t.gallery === 'full') body = (
    <div className="relative h-[70vh] min-h-[480px] overflow-hidden">
      <button onClick={() => setI(0)} className="h-full w-full"><Photo src={photos[0]} className="h-full" /></button>
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
      {all}
    </div>
  );
  else body = (
    <div className="relative grid h-[480px] grid-cols-4 grid-rows-2 gap-2 overflow-hidden rounded-[var(--r)] md:h-[540px]">
      {photos.slice(0, 5).map((src, k) => (
        <button key={k} onClick={() => setI(k)} className={`group relative overflow-hidden ${k === 0 ? 'col-span-4 row-span-2 md:col-span-2' : 'hidden md:block'}`}><Photo src={src} zoom className="h-full" /></button>
      ))}
      {all}
    </div>
  );
  return <>{body}<Lightbox photos={photos} i={i} setI={setI} /></>;
}

function AgentCard({ subject }: { subject?: string }) {
  const { cfg, name } = useSite();
  const c = contacts(cfg, subject);
  return (
    <div id="contatti" className="rounded-[var(--r)] bg-[var(--surface)] p-6 shadow-[0_20px_50px_-25px_rgba(0,0,0,.25)] ring-1 ring-[var(--line)]">
      <div className="flex items-center gap-3.5">
        {cfg.aboutImage ? <Photo src={cfg.aboutImage} className="h-14 w-14 rounded-full" /> : <span className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--c)] text-lg font-bold text-white">{name.slice(0, 1)}</span>}
        <div className="min-w-0"><div className="truncate font-semibold">{name}</div><div className="text-sm text-[var(--muted)]">{cfg.agentRole}</div></div>
      </div>
      <div className="mt-5 grid gap-2">
        {c.wa && <Btn href={c.wa} external className="w-full"><MessageCircle size={16} /> Scrivimi su WhatsApp</Btn>}
        {c.tel && <Btn href={c.tel} variant={c.wa ? 'ghost' : 'solid'} className="w-full"><Phone size={16} /> {cfg.phone}</Btn>}
        {c.mail && <Btn href={c.mail} variant="ghost" className="w-full"><Mail size={16} /> Richiedi una visita</Btn>}
        {!c.wa && !c.tel && !c.mail && <p className="text-sm text-[var(--muted)]">Contatti in arrivo.</p>}
      </div>
      <SiteLink to={{ page: 'agente' }} className="mt-4 block text-center text-sm font-medium text-[var(--c)] hover:underline">{cfg.aboutTitle}</SiteLink>
    </div>
  );
}

function PropertyPage({ id }: { id: string }) {
  const { properties, cfg, t } = useSite();
  const p = properties.find(x => x.id === id) ?? properties[0];
  const [more, setMore] = useState(false);
  if (!p) return <><Header /><Container className="py-24 text-center text-[var(--muted)]">Immobile non trovato.</Container><Footer /></>;
  const similar = properties.filter(x => x.id !== p.id).slice(0, 3);
  const desc = p.descrizione ?? '';
  const heading = (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <span className="rounded-[calc(var(--r)*0.5)] bg-[var(--c)] px-2.5 py-1 text-[11px] font-semibold text-white">{isRent(p) ? 'In affitto' : 'In vendita'}</span>
        <span className="rounded-[calc(var(--r)*0.5)] bg-[var(--soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--fg)]">{typeOf(p)}</span>
      </div>
      <H as="h1" className="mt-4 text-4xl md:text-5xl">{p.titolo}</H>
      <div className="mt-3 flex items-center gap-1.5 opacity-75"><MapPin size={16} /> {p.addr}</div>
    </>
  );
  return (
    <>
      <Header />
      {t.gallery === 'full' ? (
        <div className="relative"><Gallery p={p} /><Container className="absolute inset-x-0 bottom-10 text-white">{heading}</Container></div>
      ) : (
        <Container className="pt-8">
          <SiteLink to={{ page: 'immobili' }} className="mb-5 inline-flex items-center gap-1.5 text-sm text-[var(--muted)] hover:text-[var(--fg)]"><ArrowLeft size={15} /> Tutti gli immobili</SiteLink>
          <Gallery p={p} />
        </Container>
      )}
      <Container className="grid gap-12 py-12 lg:grid-cols-[1fr_360px]">
        <div>
          {t.gallery !== 'full' && heading}
          {cfg.showPrices && <div className={`${t.gallery === 'full' ? '' : 'mt-6'} text-4xl font-bold tracking-tight`}>{price(p.prezzo)}{isRent(p) && p.prezzo ? <span className="text-lg font-medium text-[var(--muted)]"> /mese</span> : null}</div>}
          <Facts p={p} full className="mt-8" />
          {desc && (
            <div className="mt-12">
              <H className="text-3xl">Descrizione</H>
              <p className={`mt-4 whitespace-pre-line text-[17px] leading-relaxed text-[var(--muted)] ${more ? '' : 'line-clamp-6'}`}>{desc}</p>
              {desc.length > 400 && <button onClick={() => setMore(v => !v)} className="mt-2 text-sm font-semibold text-[var(--c)]">{more ? 'Mostra meno' : 'Leggi tutto'}</button>}
            </div>
          )}
          {!!p.zona?.length && (
            <div className="mt-12">
              <H className="text-3xl">Nella zona</H>
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">{p.zona.map(z => <li key={z} className="flex items-center gap-2.5 rounded-[calc(var(--r)*0.6)] bg-[var(--soft)] px-4 py-3 text-sm"><MapPin size={14} className="text-[var(--c)]" />{z}</li>)}</ul>
            </div>
          )}
        </div>
        <aside><div className="sticky top-24"><AgentCard subject={p.titolo} /></div></aside>
      </Container>
      {similar.length > 0 && (
        <section className="bg-[var(--soft)] py-20">
          <Container>
            <SectionHead title="Potrebbero interessarti" link={{ label: 'Vedi tutti', to: { page: 'immobili' } }} />
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{similar.map(x => <PropertyCard key={x.id} p={x} />)}</div>
          </Container>
        </section>
      )}
      <Footer />
    </>
  );
}

// ---------- Profilo agente: 3 impostazioni ----------
function AgentPage() {
  const { cfg, name, properties, t } = useSite();
  const stats = statsOf(cfg, properties);
  const c = contacts(cfg);
  const photo = (cls: string) => cfg.aboutImage ? <Photo src={cfg.aboutImage} className={cls} /> : <span className={`flex items-center justify-center bg-[var(--soft)] text-6xl font-bold text-[var(--muted)]/50 ${cls}`}>{name.slice(0, 1)}</span>;
  const buttons = (
    <div className="flex flex-wrap gap-3">
      {c.wa && <Btn href={c.wa} external><MessageCircle size={16} /> WhatsApp</Btn>}
      {c.tel && <Btn href={c.tel} variant="ghost"><Phone size={16} /> {cfg.phone}</Btn>}
      {c.mail && <Btn href={c.mail} variant="ghost"><Mail size={16} /> {cfg.email}</Btn>}
    </div>
  );
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
            <p className="mt-4 max-w-2xl whitespace-pre-line leading-relaxed text-[var(--muted)]">{cfg.aboutText}</p>
            <div className="mt-6 space-y-5">{areas}{buttons}</div>
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
      <p className="mx-auto mt-6 max-w-2xl whitespace-pre-line text-lg leading-relaxed text-[var(--muted)]">{cfg.aboutText}</p>
      <div className="mt-8 flex flex-col items-center gap-5 [&>div]:justify-center">{areas}{buttons}</div>
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
          <p className="mt-6 max-w-2xl whitespace-pre-line text-lg leading-relaxed text-[var(--muted)]">{cfg.aboutText}</p>
          <div className="mt-8 space-y-6">{areas}{buttons}</div>
          {statRow && <div className="mt-12 border-t border-[var(--line)] pt-10">{statRow}</div>}
        </div>
      </Container>
    </section>
  );
  return (
    <>
      <Header />
      {top}
      <Container className="py-20">
        <SectionHead eyebrow="I miei immobili" title="Cosa sto seguendo" link={{ label: 'Cerca tra tutti', to: { page: 'immobili' } }} />
        <div className="mt-8">{t.results === 'rows'
          ? <div className="border-t border-[var(--line)]">{properties.slice(0, 4).map(p => <PropertyRow key={p.id} p={p} />)}</div>
          : <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">{properties.slice(0, 6).map(p => <PropertyCard key={p.id} p={p} />)}</div>}</div>
      </Container>
      <Reviews />
      <CtaBand />
      <Footer />
    </>
  );
}

export function SitePage({ ctx, page }: { ctx: SiteCtx; page: Page }) {
  return (
    <SiteRoot ctx={ctx}>
      {page.page === 'home' ? <HomePage /> : page.page === 'immobili' ? <ListingsPage key={JSON.stringify(page.f ?? {})} initial={page.f} /> : page.page === 'immobile' ? <PropertyPage key={page.id} id={page.id} /> : <AgentPage />}
    </SiteRoot>
  );
}
