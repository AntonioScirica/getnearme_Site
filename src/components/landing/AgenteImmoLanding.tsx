'use client';

import Link from 'next/link';
import AuthCta from '@/components/AuthCta';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Check, ChevronLeft, ChevronRight, MessageCircle, Clapperboard, FileText, Globe, ImagePlus, Images, Loader2, MapPin, Sparkles, Upload, Users, Wand2 } from 'lucide-react';

// Landing di Agente Immo per gli agenti: tre promesse (home staging AI, video, sito pronto) con lo stesso
// linguaggio della piattaforma: bianco, puntini, card 28/16, pillole, un solo tempo (600ms, ease-smooth).
// Le animazioni entrano quando la sezione arriva in vista (blur-in), niente scatti.

import { FAQ } from '@/lib/landingFaq';
import { PRICING, photosFor, videosFor } from '@/lib/pricing';
import dynamic from 'next/dynamic';

// i modelli veri del sito: codice pesante, si carica dopo il primo schermo
const TemplateShowcase = dynamic(() => import('./TemplateShowcase'), { ssr: false, loading: () => <div className="aspect-[4/3] rounded-[24px] bg-canvas" /> });

// guide SEO linkate dal fondo pagina (collegamenti interni verso le pagine che devono posizionarsi)
const GUIDE_LINKS = [['/it/agente-immobiliare', 'Agente immobiliare'], ['/it/come-diventare-agente-immobiliare', 'Come diventare agente immobiliare'], ['/it/provvigione-agente-immobiliare', 'Provvigione agente immobiliare'], ['/it/software-agenti-immobiliari', 'Software per agenti immobiliari'], ['/it/home-staging-virtuale', 'Home staging virtuale']];

const APP = '/it/dashboard';
const VIDEO = 'https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/out/bbb243664b.mp4';
const VIDEO2 = 'https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/out/d626678fc2.mp4';

// Compare quando entra in vista. Se la pagina e' nascosta l'observer non scatta: dopo 1,5 s si mostra comunque.
function Reveal({ children, className = '', delay = 0, as: Tag = 'div', anim = 'blur-in' }: { children: ReactNode; className?: string; delay?: number; as?: 'div' | 'section' | 'li'; anim?: 'blur-in' | 'in-left' | 'in-right' | 'rise' }) {
  const ref = useRef<HTMLElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { rootMargin: '0px 0px -10% 0px' });
    io.observe(el);
    const t = setTimeout(() => setOn(true), 1500);
    return () => { io.disconnect(); clearTimeout(t); };
  }, []);
  const T = Tag as 'div';
  return <T ref={ref as React.Ref<HTMLDivElement>} className={`${on ? anim : 'opacity-0'} ${className}`} style={{ animationDelay: `${delay}ms` }}>{children}</T>;
}

// Numero che sale da 0 quando entra in vista (e riparte se si torna su)
function CountUp({ to, prefix = '', suffix = '' }: { to: number; prefix?: string; suffix?: string }) {
  const [ref, on] = useInView('-10%');
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!on) return;
    const t0 = performance.now();
    let raf = 0;
    const tick = (t: number) => { const k = Math.min(1, (t - t0) / 1400); setV(Math.round(to * (1 - Math.pow(1 - k, 3)))); if (k < 1) raf = requestAnimationFrame(tick); };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on, to]);
  return <span ref={ref as unknown as React.Ref<HTMLSpanElement>} className="tabular-nums">{prefix}{thousands(v)}{suffix}</span>;
}

// Fascia a tutta larghezza: bianca (puntini della pagina), grigia o scura. Separa le sezioni e da' ritmo.
function Band({ id, tone = 'white', children, className = '', inner = 'max-w-6xl' }: { id?: string; tone?: 'white' | 'canvas' | 'dark'; children: ReactNode; className?: string; inner?: string }) {
  const bg = tone === 'dark' ? 'bg-ink text-white' : tone === 'canvas' ? 'bg-canvas' : '';
  return <section id={id} className={`${bg} ${className}`}><div className={`mx-auto ${inner} px-4 py-24 md:py-32`}>{children}</div></section>;
}

// Titolo di sezione: numero in blu + pillola, titolo, sottotitolo
function Eyebrow({ n, children }: { n?: string; children: ReactNode }) {
  return <Pill>{n && <span className="font-bold text-brand">{n}</span>}{children}</Pill>;
}

const Pill = ({ children, className = '' }: { children: ReactNode; className?: string }) =>
  <span className={`inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-medium text-muted ring-1 ring-black/5 ${className}`}>{children}</span>;

const Cta = ({ href = '#prova', children, ghost = false, className = '' }: { href?: string; children: ReactNode; ghost?: boolean; className?: string }) =>
  <a href={href} className={`group inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold ease-smooth transition-all active:scale-[.98] ${ghost ? 'bg-white text-ink ring-1 ring-black/10 hover:ring-ink' : 'bg-ink text-white hover:bg-black hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,.5)]'} ${className}`}>
    {children}{!ghost && <ArrowRight size={16} className="ease-smooth transition-transform group-hover:translate-x-0.5" />}
  </a>;

// Prima/dopo: si trascina col mouse, da fermo scorre da solo avanti e indietro
function BeforeAfter({ before, after, className = '', auto = true }: { before: string; after: string; className?: string; auto?: boolean }) {
  const [p, setP] = useState(50);
  const [drag, setDrag] = useState(false);
  const [idle, setIdle] = useState(true); // dopo il primo trascinamento lo scorrimento automatico si ferma
  useEffect(() => {
    if (!auto || !idle) return;
    let dir = 1;
    const first = setTimeout(() => setP(78), 400);
    const loop = setInterval(() => { dir = -dir; setP(dir > 0 ? 78 : 22); }, 2600);
    return () => { clearTimeout(first); clearInterval(loop); };
  }, [auto, idle]);
  const move = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!drag) return;
    const r = e.currentTarget.getBoundingClientRect();
    setP(Math.max(4, Math.min(96, ((e.clientX - r.left) / r.width) * 100)));
  };
  const t = drag ? 'none' : idle ? 'clip-path 2.2s cubic-bezier(.65,0,.35,1), left 2.2s cubic-bezier(.65,0,.35,1)' : 'clip-path var(--gnm-dur) var(--gnm-ease), left var(--gnm-dur) var(--gnm-ease)';
  return (
    <div className={`relative select-none overflow-hidden ${className}`} onPointerDown={e => { setIdle(false); setDrag(true); e.currentTarget.setPointerCapture(e.pointerId); move(e); }}
      onPointerMove={move} onPointerUp={() => setDrag(false)} onPointerCancel={() => setDrag(false)} style={{ cursor: 'ew-resize', touchAction: 'none' }}>
      <img src={after} alt="Dopo il home staging" className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <img src={before} alt="Prima" className="absolute inset-0 h-full w-full object-cover" draggable={false} style={{ clipPath: `inset(0 ${100 - p}% 0 0)`, transition: t }} />
      <span className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">Prima</span>
      <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink backdrop-blur"><Sparkles size={12} className="text-ai" /> Dopo</span>
      <span className="absolute inset-y-0 w-0.5 -translate-x-1/2 bg-white shadow-[0_0_10px_rgba(0,0,0,.45)]" style={{ left: `${p}%`, transition: t }}>
        <span className="absolute left-1/2 top-1/2 flex h-12 w-12 -translate-x-1/2 -translate-y-1/2 items-center justify-center gap-0.5 rounded-full bg-white text-brand shadow-lg"><ChevronLeft size={16} strokeWidth={2.5} /><ChevronRight size={16} strokeWidth={2.5} /></span>
      </span>
    </div>
  );
}

// Card che si inclina verso il mouse (stesse variabili delle tessere della home della piattaforma)
function Tilt({ children, className = '' }: { children: ReactNode; className?: string }) {
  const move = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height, st = e.currentTarget.style;
    st.setProperty('--ry', `${(x - 0.5) * 4}deg`); st.setProperty('--rx', `${(0.5 - y) * 3}deg`); st.setProperty('--sx', `${x * 100}%`); st.setProperty('--sy', `${y * 100}%`);
  };
  const leave = (e: React.MouseEvent<HTMLDivElement>) => ['--rx', '--ry'].forEach(k => e.currentTarget.style.removeProperty(k));
  return <div onMouseMove={move} onMouseLeave={leave} className={`tilt relative ${className}`}><span className="sheen pointer-events-none absolute inset-0 z-20 rounded-[inherit]" />{children}</div>;
}

function useInView(margin = '0px') {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const io = new IntersectionObserver(([e]) => setOn(e.isIntersecting), { rootMargin: margin });
    io.observe(el);
    const t = setTimeout(() => setOn(true), 1500);
    return () => { io.disconnect(); clearTimeout(t); };
  }, [margin]);
  return [ref, on] as const;
}


// Un solo pacchetto: il sito non costa nulla in piu' a noi e chi non lo vuole semplicemente non lo pubblica.
// Foto "illimitate" con uso ragionevole (vedi termini), video contati perche' costano davvero.

const thousands = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');

// crediti in grande, sotto cosa ci fai (come Higgsfield)
function Credits({ n }: { n: number }) {
  return (
    <div className="mt-6 rounded-[20px] bg-canvas p-5">
      <div className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight"><Sparkles size={16} className="text-ai" /> {thousands(n)} crediti al mese</div>
      <div className="mt-2 space-y-1 pl-6 text-[15px] text-muted">
        <div>= {photosFor(n)} foto arredate</div>
        <div>~ {videosFor(n)} video</div>
      </div>
    </div>
  );
}

// il sito: stesso blocco dei crediti (titolo grande), sotto cosa c'e' dentro in due colonne.
// Solo funzioni che esistono davvero nei siti degli agenti (niente traduzione finche' non c'e').
const SITE_PERKS: [typeof Globe, string][] = [[Sparkles, 'Ogni casa online in automatico'], [MessageCircle, 'Richieste su email, telefono e WhatsApp'], [FileText, 'Report PDF da scaricare per ogni casa'], [MapPin, 'Ti trovano su Google nella tua zona']];
function SiteIncluded() {
  return (
    <div className="mt-3 rounded-[20px] bg-canvas p-5">
      <div className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight"><Globe size={16} className="text-brand" /> Il tuo sito incluso</div>
      <div className="mt-1 pl-6 text-[15px] text-muted">agenteimmo.me/<span className="text-ink">tuonome</span>, già fatto con i nostri modelli</div>
      <ul className="mt-4 space-y-2.5 pl-6 text-[15px]">
        {SITE_PERKS.map(([Icon, l]) => <li key={l} className="flex items-center gap-2.5"><Icon size={15} className="shrink-0 text-brand" />{l}</li>)}
      </ul>
    </div>
  );
}

// Quanto costa oggi farlo senza di noi (stime indicative di mercato, come nella vecchia landing GetNearMe)
const WITHOUT: [typeof Globe, string, string, string][] = [
  [Wand2, 'Home staging', '~1.500 €', 'home stager, circa 4 giorni per casa'],
  [Clapperboard, 'Video della casa', '~250 €', 'videomaker, mezza giornata'],
  [Globe, 'Sito con i tuoi immobili', '~1.500 €', 'web agency, 2-4 settimane'],
  [Sparkles, 'Foto sistemate e più luminose', '~150 €', 'fotografo o fotoritocco, per casa'],
];
function Compare() {
  return (
    <Band inner="max-w-4xl">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Pill>Quanto ti costa oggi</Pill>
        <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">Da solo, per una casa, spenderesti <span className="text-rose-600"><CountUp to={3400} prefix="~" suffix=" €" /></span>.</h2>
        <p className="mt-5 text-lg leading-relaxed text-muted">Con Agente Immo è tutto incluso, per ogni casa che prendi, da {PRICING.starter} € al mese.</p>
      </Reveal>
      <Reveal delay={120} className="mt-10 overflow-hidden rounded-[28px] bg-white ring-1 ring-black/5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_-12px_rgba(0,0,0,.12)]">
        <div className="grid grid-cols-[1.4fr_1fr_auto] gap-4 bg-canvas px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted">
          <span>Cosa ti serve</span><span>Senza Agente Immo</span><span className="text-right">Con Agente Immo</span>
        </div>
        {WITHOUT.map(([Icon, what, cost, who]) => (
          <div key={what} className="grid grid-cols-[1.4fr_1fr_auto] items-center gap-4 border-t border-line px-6 py-4">
            <span className="flex items-center gap-3 font-semibold"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-canvas text-ink"><Icon size={16} /></span>{what}</span>
            <span><span className="block font-bold text-rose-600">{cost}</span><span className="block text-xs text-muted">{who}</span></span>
            <span className="flex items-center justify-end gap-1.5 text-sm font-semibold text-emerald-600"><Check size={15} /> Incluso</span>
          </div>
        ))}
        <div className="grid grid-cols-[1.4fr_1fr_auto] items-center gap-4 border-t border-line bg-canvas px-6 py-5">
          <span className="font-display text-lg font-extrabold">Totale</span>
          <span className="font-display text-xl font-extrabold text-rose-600 line-through decoration-rose-300">~3.400 €</span>
          <span className="text-right font-display text-xl font-extrabold text-emerald-600">da {PRICING.starter} €/mese</span>
        </div>
      </Reveal>
      <p className="mt-4 text-center text-xs text-muted">Costi indicativi di mercato per una singola casa; il sito è una spesa una tantum più la manutenzione.</p>
    </Band>
  );
}

// Due piani con lo stesso prodotto (stessa qualita', sito compreso): cambiano solo i crediti e come si paga.
// Prova gratis in pagina, senza account: una foto della tua casa arredata dall'AI (max 3 al giorno, limite nel server).
// Si vede il prima/dopo; per scaricarla serve l'account.
const DEMO_STYLES = [['modern', 'Moderno'], ['nordic', 'Nordico'], ['industrial', 'Elegante']] as const;
function TryIt() {
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [style, setStyle] = useState<(typeof DEMO_STYLES)[number][0]>('modern');
  const [text, setText] = useState(''); // richiesta scritta: se c'e', vince sullo stile
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(3);
  const [msg, setMsg] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const pick = (f?: File) => {
    if (!f || !f.type.startsWith('image/')) return;
    const img = new Image();
    img.onload = () => {
      // ridotta nel browser a 1600 px: upload veloce anche da telefono
      const k = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      setBefore(c.toDataURL('image/jpeg', 0.88)); setAfter(null); setMsg('');
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(f);
  };
  const run = async () => {
    if (!before || busy) return;
    setBusy(true); setMsg(''); setAfter(null);
    const r = await fetch('/api/landing/demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: before, style, prompt: text.trim() }) }).catch(() => null);
    const d = await r?.json().catch(() => null) as { image?: string; left?: number; error?: string } | null;
    setBusy(false);
    if (typeof d?.left === 'number') setLeft(d.left);
    if (d?.image) return setAfter(d.image);
    setMsg(d?.error === 'limit' ? 'Hai usato le 3 prove di oggi. Crea l\'account per continuare.' : d?.error === 'busy' ? 'Ci sono molte prove in corso, riprova tra qualche minuto.' : 'Non siamo riusciti ad arredare questa foto. Prova con un\'altra stanza.');
  };
  return (
    <>
        <div className="rounded-[32px] bg-white p-2 shadow-[0_0_0_1px_rgba(0,0,0,.05),0_0_80px_-10px_rgba(110,86,248,.45),0_40px_100px_-40px_rgba(0,0,0,.35)]">
          <div className="relative overflow-hidden rounded-[24px] bg-canvas">
            {after && before ? (
              <BeforeAfter before={before} after={after} auto={false} className="aspect-[4/3] md:aspect-[16/10]" />
            ) : before ? (
              <div className="relative aspect-[4/3] md:aspect-[16/10]">
                <img src={before} alt="La tua foto" className="absolute inset-0 h-full w-full object-cover" />
                {busy && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/55 backdrop-blur-[2px]">
                    <Loader2 size={28} className="animate-spin text-ai" />
                    <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold shadow">L&apos;AI sta arredando la stanza, circa un minuto</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}>
                <BeforeAfter before="/immo/home/demo-before.webp" after="/immo/home/demo-after.webp" className="aspect-[4/3] md:aspect-[16/9]" />
                <button type="button" onClick={() => input.current?.click()} className="absolute bottom-5 left-1/2 flex -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-full bg-ink px-7 py-4 text-base font-semibold text-white shadow-[0_0_0_6px_rgba(255,255,255,.35),0_20px_40px_-10px_rgba(0,0,0,.5)] ease-smooth transition-transform hover:scale-[1.04]">
                  <ImagePlus size={18} /> Carica la foto di una tua stanza
                </button>
              </div>
            )}
            <input ref={input} type="file" accept="image/*" className="hidden" onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
          <div className="p-3">
            <div className="flex items-center gap-2 rounded-[20px] bg-canvas p-2 pl-2 ring-1 ring-black/5 focus-within:bg-white focus-within:ring-2 focus-within:ring-ai">
              <button type="button" onClick={() => input.current?.click()} aria-label="Carica una foto" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-ink shadow-sm ring-1 ring-black/5 hover:bg-line/40"><ImagePlus size={18} /></button>
              <input value={text} onChange={e => setText(e.target.value.slice(0, 200))} onKeyDown={e => e.key === 'Enter' && run()} placeholder="Scrivi come la vuoi, es. soggiorno moderno con divano grigio"
                className="min-w-0 flex-1 bg-transparent px-2 text-[15px] outline-none placeholder:text-muted/70" />
              {after
                ? <a href={APP} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-ink px-5 text-sm font-semibold text-white">Scaricala <ArrowRight size={15} /></a>
                : <button type="button" disabled={busy || left <= 0} onClick={() => (before ? run() : input.current?.click())} className="inline-flex h-11 shrink-0 items-center gap-2 rounded-2xl bg-ink px-5 text-sm font-semibold text-white disabled:opacity-40"><Sparkles size={15} /> {before ? 'Arreda' : 'Carica foto'}</button>}
            </div>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="text-sm text-muted">Oppure scegli uno stile:</span>
              {DEMO_STYLES.map(([k, l]) => (
                <button key={k} type="button" onClick={() => { setStyle(k); setText(''); }} className={`h-9 rounded-full px-4 text-sm font-semibold ease-smooth transition-colors ${style === k && !text ? 'bg-ink text-white' : 'bg-canvas text-muted hover:text-ink'}`}>{l}</button>
              ))}
              <span className="ml-auto text-sm text-muted">{left > 0 ? `Ti restano ${left} prove gratis` : 'Prove finite per oggi'}</span>
            </div>
          </div>
        </div>
        {after && <p className="mt-3 text-center text-sm text-muted">Per scaricarla in alta qualità crea l&apos;account.{left > 0 && <> Oppure scegli un altro stile e <button type="button" onClick={run} className="font-medium text-ink underline underline-offset-4">rifai la prova</button>.</>}</p>}
        {msg && <p className="mt-3 text-center text-sm text-rose-600">{msg} {left <= 0 && <a href={APP} className="font-medium text-ink underline underline-offset-4">Crea l&apos;account</a>}</p>}
    </>
  );
}

function Pricing() {
  const [yearly, setYearly] = useState(true);
  const pro = yearly ? PRICING.yearly : PRICING.quarterly;
  const billed = yearly ? `${PRICING.yearly * 12} € fatturati ogni anno` : `${PRICING.quarterly * 3} € fatturati ogni 3 mesi`;
  return (
    <Band id="prezzi" tone="canvas">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Pill>Prezzi</Pill>
        <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">Meno di un caffè al giorno. Per tutte le case.</h2>
        <p className="mt-5 text-lg leading-relaxed text-muted">Sito, foto e video in entrambi i piani. Cambiano solo i crediti, cioè quante foto e video fai al mese.</p>
      </Reveal>
      <div className="mx-auto mt-12 grid max-w-4xl items-stretch gap-5 md:grid-cols-2">
        <Reveal delay={80} className="flex flex-col rounded-[32px] bg-white p-8 ring-1 ring-black/5">
          <div className="flex h-10 items-center text-sm font-semibold text-muted">Starter</div>
          <div className="mt-3 flex items-end gap-2"><span className="font-display text-6xl font-extrabold tracking-tight">{PRICING.starter} €</span><span className="pb-2 text-muted">/ mese</span></div>
          <div className="mt-1 text-sm text-muted">Mensile, disdici quando vuoi</div>
          <Credits n={PRICING.starterCredits} />
          <SiteIncluded />
          <div className="min-h-8 flex-1" />
          <Cta ghost href={`${APP}#/piano`} className="w-full justify-center">Scegli Starter</Cta>
        </Reveal>
        <Reveal delay={160} className="relative flex flex-col rounded-[32px] bg-white p-8 ring-2 ring-ink shadow-[0_40px_100px_-40px_rgba(0,0,0,.35)]">
          <span className="absolute -top-3 left-8 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">Consigliato</span>
          <div className="flex h-10 items-center justify-between gap-3">
            <div className="text-sm font-semibold text-muted">Pro</div>
            <div className="flex rounded-full bg-canvas p-1">
              {([[false, 'Trimestrale'], [true, 'Annuale']] as const).map(([y, l]) => (
                <button key={l} type="button" onClick={() => setYearly(y)} className={`h-8 rounded-full px-3 text-xs font-semibold ease-smooth transition-colors ${yearly === y ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-end gap-2"><span key={pro} className="blur-in font-display text-6xl font-extrabold tracking-tight">{pro} €</span><span className="pb-2 text-muted">/ mese</span></div>
          <div key={billed} className="blur-in mt-1 text-sm text-muted">{billed}</div>
          <Credits n={PRICING.credits} />
          <SiteIncluded />
          <div className="min-h-8 flex-1" />
          <Cta href={`${APP}#/piano`} className="w-full justify-center">Scegli Pro</Cta>
        </Reveal>
      </div>
      <p className="mt-6 text-center text-sm text-muted">Prima di scegliere, <a href="#prova" className="font-medium text-ink underline underline-offset-4">provalo gratis sulla tua foto</a>, senza registrarti. Prezzi finali, senza IVA aggiunta.</p>
    </Band>
  );
}

// Il filo della pagina: l'incarico lo vince chi presenta meglio la casa. Hero (promessa + prova), il perche' (scena
// dell'acquisizione, fascia scura), le tre cose che ti diamo (01 02 03, fasce alternate), il conto, i prezzi.
const CHECK = <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"><Check size={12} /></span>;
const H2 = 'mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl';

export default function AgenteImmoLanding() {
  const [siteRef, siteOn] = useInView('-15%');
  const [videoRef, videoOn] = useInView('-10%');
  const vid = useRef<HTMLVideoElement>(null);
  const vid2 = useRef<HTMLVideoElement>(null);
  // i video (1,5 MB) si scaricano solo quando la sezione arriva in vista: prima non rubano banda al primo schermo
  const [videoSeen, setVideoSeen] = useState(false);
  if (videoOn && !videoSeen) setVideoSeen(true); // aggiornamento in render: niente effetto a cascata
  useEffect(() => { [vid, vid2].forEach(v => { if (!v.current) return; if (videoOn) v.current.play().catch(() => {}); else v.current.pause(); }); }, [videoOn, videoSeen]);

  return (
    <div className="dots-bg min-h-screen font-body text-ink antialiased">
      {/* barra: pillola fissa, vetro */}
      <header className="sticky top-0 z-40 pt-4">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4">
          <nav className="glass flex h-14 w-full items-center gap-2 rounded-full border px-2 pl-4 shadow-[0_10px_40px_-15px_rgba(0,0,0,.2)]">
            <a href="#top" className="flex items-center gap-2"><img src="/immo/logo-mark.png" alt="" className="h-8 w-8" /><span className="font-display text-lg font-extrabold tracking-tight">Agente <span className="text-brand">Immo</span></span></a>
            <div className="mx-auto hidden items-center gap-1 md:flex">
              {[['#staging', 'Annunci'], ['#video', 'Social'], ['#sito', 'Il tuo sito'], ['#prezzi', 'Prezzi']].map(([h, l]) => <a key={h} href={h} className="rounded-full px-3.5 py-2 text-sm font-medium text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink">{l}</a>)}
            </div>
            <AuthCta locale="it" href={APP} dashLabel="Dashboard" className="hidden px-3 text-sm font-semibold text-ink sm:block">Accedi</AuthCta>
            <Cta className="!h-10 !px-5 text-sm">Prova gratis</Cta>
          </nav>
        </div>
      </header>

      {/* hero: la promessa in una frase, poi la prova sulla propria foto */}
      <section id="top" className="mx-auto max-w-6xl px-4 pb-24 pt-14 md:pt-20">
        <div className="mx-auto max-w-5xl text-center">
          <Reveal><h1><Pill><Sparkles size={13} className="text-ai" /> Il software per agenti immobiliari</Pill></h1></Reveal>
          <p className="mx-auto mt-6 w-fit font-display text-[clamp(24px,5.2vw,60px)] font-extrabold leading-[1.05] tracking-[-0.03em]">
            <span className="block sm:whitespace-nowrap">{'Vinci più incarichi.'.split(' ').map((w, i) => <span key={i} className="blur-in inline-block" style={{ animationDelay: `${i * 40}ms` }}>{w}&nbsp;</span>)}</span>
            <span className="block text-brand sm:whitespace-nowrap">{'Presenta meglio ogni casa.'.split(' ').map((w, i) => <span key={i} className="blur-in inline-block" style={{ animationDelay: `${360 + i * 40}ms` }}>{w}&nbsp;</span>)}</span>
          </p>
          <Reveal delay={600}><p className="mx-auto mt-6 max-w-2xl text-lg leading-relaxed text-muted">Tre agenzie in gara per lo stesso incarico: lo prende chi arriva con la casa già arredata, un video pronto e la sua pagina sul proprio sito. Con Agente Immo ce l&apos;hai in un minuto, per ogni immobile, senza fotografo, home stager e web agency da pagare.</p></Reveal>
          <Reveal delay={700} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Cta>Prova gratis sulla tua foto</Cta>
            <Cta ghost href="#prezzi">Vedi i prezzi</Cta>
          </Reveal>
        </div>

        {/* prova in pagina al posto dello slider: prima dell'upload scorre l'esempio, poi e' la foto dell'agente */}
        <div id="prova" className="mx-auto mt-14 max-w-4xl scroll-mt-24">
          <Reveal delay={800} anim="rise"><TryIt /></Reveal>
        </div>

        <Reveal delay={900} className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted">
          {['La prima foto ferma chi scorre', 'Il proprietario vede subito cosa farai per lui', 'Prova gratis, senza registrarti'].map(x => <span key={x} className="flex items-center gap-2"><Check size={14} className="text-brand" />{x}</span>)}
        </Reveal>
      </section>

      {/* 01 home staging */}
      <Band id="staging">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal anim="in-left">
            <Eyebrow n="01">Annunci che si notano</Eyebrow>
            <h2 className={H2}>Chi scorre non si ferma su una stanza vuota.</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">Vuota, una casa sembra più piccola e più fredda di com&apos;è. Arredata, chi guarda ci si immagina dentro e ti chiama per vederla. Carichi la foto, scegli lo stile, in un minuto è pronta.</p>
            <ul className="mt-6 space-y-3 text-[15px]">
              {['La prima foto ferma chi scorre', 'Il cliente capisce subito come vivrebbe quella casa', 'Nessun home staging vero da pagare o da organizzare'].map(x => <li key={x} className="flex items-start gap-3">{CHECK}{x}</li>)}
            </ul>
            <Cta className="mt-8">Prova gratis</Cta>
          </Reveal>
          <Reveal delay={150} anim="in-right">
            <div className="parallax">
              <Tilt className="rounded-[24px] bg-white p-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,.3)] ring-1 ring-black/5">
                <BeforeAfter before="https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/soggiorno_prima.jpg" after="https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/soggiorno.jpg" className="aspect-[4/3] rounded-2xl" />
              </Tilt>
              <p className="mt-3 text-center text-xs text-muted">Trascina per confrontare. Foto reale, arredata dall&apos;AI.</p>
            </div>
          </Reveal>
        </div>
      </Band>

      {/* 02 video */}
      <Band id="video" tone="canvas">
        <div ref={videoRef} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal className="md:order-2" anim="in-right">
            <Eyebrow n="02">Farti conoscere</Eyebrow>
            <h2 className={H2}>Ogni casa diventa un video per i tuoi social.</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">Nella tua zona i clienti chiamano l&apos;agente che vedono ogni settimana su Instagram e TikTok. Un videomaker costa e ci mette giorni: qui ogni nuovo incarico diventa un video, e tu resti presente senza fermarti a girare.</p>
            <ul className="mt-6 space-y-3 text-[15px]">
              {['Ti fai conoscere nella tua zona, non solo sul portale', 'Ogni incarico diventa un contenuto da pubblicare', 'Niente riprese, niente montaggio, niente videomaker'].map(x => <li key={x} className="flex items-start gap-3">{CHECK}{x}</li>)}
            </ul>
            <Cta className="mt-8">Prova gratis</Cta>
          </Reveal>
          <Reveal delay={150} className="md:order-1" anim="in-left">
            <div className="parallax relative">
              <Tilt className="overflow-hidden rounded-[24px] bg-white p-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,.3)] ring-1 ring-black/5">
                <video ref={vid} src={videoSeen ? VIDEO : undefined} poster="https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/soggiorno.jpg" muted loop playsInline preload="none" className="aspect-video w-full rounded-2xl bg-canvas object-cover" />
              </Tilt>
              <div className="absolute -bottom-8 -right-4 w-[46%] rotate-[4deg] overflow-hidden rounded-[20px] bg-white p-1.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,.4)] ring-1 ring-black/5 md:-right-10">
                <video ref={vid2} src={videoSeen ? VIDEO2 : undefined} poster="https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/cucina.jpg" muted loop playsInline preload="none" className="aspect-video w-full rounded-[14px] bg-canvas object-cover" />
              </div>
            </div>
          </Reveal>
        </div>
      </Band>

      {/* 03 sito */}
      <Band id="sito">
        <div ref={siteRef} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal anim="in-left">
            <Eyebrow n="03">Il tuo sito, già pronto</Eyebrow>
            <h2 className={H2}>Sul tuo sito non sei uno dei tanti agenti.</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">Sul portale l&apos;acquirente sceglie la casa, non l&apos;agente. Il sito te lo diamo noi, già fatto e finito: scegli uno dei nostri modelli, metti logo e colori, e ogni immobile che carichi ci finisce da solo. Niente web agency, niente da costruire.</p>
            <ul className="mt-6 space-y-3 text-[15px]">
              {['Pronto in un minuto: scegli il modello, il resto è già fatto', 'Ogni immobile che carichi è subito online, con foto e descrizione', 'I contatti arrivano a te, non a un portale', 'Ti fai trovare su Google nella tua zona'].map(x => <li key={x} className="flex items-start gap-3">{CHECK}{x}</li>)}
            </ul>
            <Cta href={APP} className="mt-8">Crea il tuo sito</Cta>
          </Reveal>
          <Reveal delay={150} anim="in-right"><div className="parallax"><Tilt className="rounded-[24px]"><TemplateShowcase active={siteOn} /></Tilt></div></Reveal>
        </div>
      </Band>

      {/* tutto il resto */}
      <Band tone="canvas">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Pill>E in più</Pill>
          <h2 className={H2}>Il lavoro noioso sparisce.</h2>
        </Reveal>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [FileText, 'Il cliente si ricorda di te', 'Dopo la visita riparte con un report della casa col tuo logo, da girare a chi deve decidere.'],
            [Sparkles, 'Annunci pronti in un attimo', 'Il testo si scrive da solo: tu lo rileggi e pubblichi.'],
            [MapPin, 'Risposte prima delle domande', 'Scuole, metro e negozi vicini sono già nell\'annuncio: meno telefonate a vuoto.'],
            [Images, 'Tutto in un posto', 'Foto, video e versioni di ogni immobile sempre a portata, anche dal telefono.'],
            [Upload, 'Parti da quello che hai', 'Gli immobili che hai già non li ricarichi a mano.'],
            [Users, 'Tutta l\'agenzia con la stessa immagine', 'Ogni agente con i suoi immobili, tutti presentati allo stesso livello.'],
          ].map(([I, t, d], i) => {
            const Icon = I as typeof Upload;
            return (
              <Reveal key={t as string} delay={i * 60} anim="rise" className="flex gap-4 rounded-[24px] bg-white p-5 ring-1 ring-black/5 ease-smooth transition-shadow hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,.2)]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-canvas text-ink"><Icon size={18} /></span>
                <div><div className="font-semibold">{t as string}</div><p className="mt-1 text-sm leading-relaxed text-muted">{d as string}</p></div>
              </Reveal>
            );
          })}
        </div>
      </Band>

      {/* il conto, poi i prezzi. Numeri in PRICING */}
      <Compare />

      <Pricing />

      {/* domande frequenti: testo visibile + FAQPage in JSON-LD (stesse risposte, vedi FAQ) */}
      <Band id="domande" inner="max-w-3xl">
        <Reveal className="text-center">
          <Pill>Domande frequenti</Pill>
          <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight md:text-4xl">Quello che ci chiedono gli agenti immobiliari</h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {FAQ.map(([q, a], i) => (
            <Reveal key={q} as="div" delay={i * 40} anim="rise">
              <details className="group rounded-[24px] bg-white p-5 ring-1 ring-black/5 open:shadow-[0_20px_40px_-20px_rgba(0,0,0,.2)]">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-semibold">{q}<ArrowRight size={16} className="shrink-0 text-muted ease-smooth transition-transform group-open:rotate-90" /></summary>
                <p className="mt-3 leading-relaxed text-muted">{a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </Band>

      {/* cta finale */}
      <section className="mx-auto max-w-6xl px-4 pb-24">
        <Reveal anim="rise" className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-16 text-center text-white md:py-24">
          <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: 'radial-gradient(600px circle at 20% 0%, rgba(83,126,236,.8), transparent 60%), radial-gradient(500px circle at 90% 100%, rgba(110,86,248,.7), transparent 60%)' }} />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">Il prossimo incarico, vincilo così.</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">Carica la foto di una tua casa e guarda il risultato. Gratis, senza registrarti.</p>
            <a href="#prova" className="mt-8 inline-flex h-13 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-ink ease-smooth transition-transform hover:scale-[1.03] active:scale-[.98]">Prova gratis <ArrowRight size={16} /></a>
          </div>
        </Reveal>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 pb-10 text-sm text-muted">
        <span className="flex items-center gap-2"><img src="/immo/logo-mark.png" alt="" className="h-6 w-6" /> © {new Date().getFullYear()} Agente Immo</span>
        <span className="flex flex-wrap gap-5">{GUIDE_LINKS.map(([href, l]) => <Link key={href} href={href} className="hover:text-ink">{l}</Link>)}<Link href="/it/privacy" className="hover:text-ink">Privacy</Link><Link href="/it/cookie" className="hover:text-ink">Cookie</Link><Link href="/it/termini" className="hover:text-ink">Termini</Link><a href="mailto:info@agenteimmo.me" className="hover:text-ink">Contatti</a></span>
      </footer>
    </div>
  );
}
