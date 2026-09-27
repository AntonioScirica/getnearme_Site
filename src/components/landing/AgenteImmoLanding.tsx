'use client';

import Link from 'next/link';
import AuthCta from '@/components/AuthCta';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowRight, Check, Clapperboard, FileText, Globe, Images, MapPin, Sparkles, Upload, Users, Wand2 } from 'lucide-react';

// Landing di Agente Immo per gli agenti: tre promesse (home staging AI, video, sito pronto) con lo stesso
// linguaggio della piattaforma: bianco, puntini, card 28/16, pillole, un solo tempo (600ms, ease-smooth).
// Le animazioni entrano quando la sezione arriva in vista (blur-in), niente scatti.

const APP = '/it/dashboard';
const VIDEO = 'https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/out/bbb243664b.mp4';
const VIDEO2 = 'https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/out/d626678fc2.mp4';

// Compare quando entra in vista. Se la pagina e' nascosta l'observer non scatta: dopo 1,5 s si mostra comunque.
function Reveal({ children, className = '', delay = 0, as: Tag = 'div' }: { children: ReactNode; className?: string; delay?: number; as?: 'div' | 'section' | 'li' }) {
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
  return <T ref={ref as React.Ref<HTMLDivElement>} className={`${on ? 'blur-in' : 'opacity-0'} ${className}`} style={{ animationDelay: `${delay}ms` }}>{children}</T>;
}

const Pill = ({ children, className = '' }: { children: ReactNode; className?: string }) =>
  <span className={`inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-medium text-muted ring-1 ring-black/5 ${className}`}>{children}</span>;

const Cta = ({ href = APP, children, ghost = false, className = '' }: { href?: string; children: ReactNode; ghost?: boolean; className?: string }) =>
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
        <span className="absolute left-1/2 top-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white text-sm font-bold text-ink shadow-lg">‹›</span>
      </span>
    </div>
  );
}

// Finestra del browser con dentro un mini sito che cambia modello da solo (colori, font, layout)
const THEMES = [
  { name: 'Classico', c: '#1d5b3c', bg: '#fbfaf7', fg: '#1c1c1c', r: 12, serif: true },
  { name: 'Moderno', c: '#537eec', bg: '#ffffff', fg: '#111111', r: 20, serif: false },
  { name: 'Editoriale', c: '#b4690e', bg: '#f6f1ea', fg: '#231f1a', r: 4, serif: true },
  { name: 'Notte', c: '#8ab4ff', bg: '#151821', fg: '#ffffff', r: 16, serif: false },
];
function MiniSite({ active }: { active: boolean }) {
  const [i, setI] = useState(0);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setI(v => (v + 1) % THEMES.length), 2800);
    return () => clearInterval(id);
  }, [active]);
  const t = THEMES[i];
  const dark = t.bg === '#151821';
  const soft = dark ? 'rgba(255,255,255,.08)' : 'rgba(0,0,0,.05)';
  const tr = 'all var(--gnm-dur) var(--gnm-ease)';
  const photos = ['/immo/home/demo-4.webp', '/immo/home/demo-3.webp', '/immo/home/demo-2.webp'];
  return (
    <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,.35)] ring-1 ring-black/5">
      <div className="flex items-center gap-2 border-b border-line bg-canvas px-4 py-2.5">
        <span className="flex gap-1.5">{['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />)}</span>
        <span className="mx-auto flex h-7 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-medium text-muted ring-1 ring-black/5"><Globe size={11} className="text-brand" /> agenteimmo.me/<span className="text-ink">tuonome</span></span>
        <span className="rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-muted ring-1 ring-black/5" style={{ transition: tr }}>Modello: {t.name}</span>
      </div>
      <div className="relative aspect-[4/3] overflow-hidden p-5" style={{ background: t.bg, color: t.fg, transition: tr, fontFamily: t.serif ? 'var(--font-serif-accent), Georgia, serif' : 'var(--font-bricolage), system-ui, sans-serif' }}>
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-2 text-[13px] font-bold"><span className="h-6 w-6 rounded-lg" style={{ background: t.c, borderRadius: Math.max(4, t.r / 2), transition: tr }} /> Studio Rossi</span>
          <span className="flex gap-3 text-[10px] opacity-70">{['Home', 'Immobili', 'Servizi', 'Contatti'].map(x => <span key={x}>{x}</span>)}</span>
          <span className="h-6 rounded-full px-2.5 text-[10px] font-semibold leading-6 text-white" style={{ background: t.c, borderRadius: t.r, transition: tr }}>Contattami</span>
        </div>
        <div className="mt-5 grid grid-cols-[1.1fr_1fr] items-center gap-4">
          <div>
            <div className="text-[9px] font-bold uppercase tracking-[.2em]" style={{ color: t.c, transition: tr }}>Immobili selezionati</div>
            <div className={`mt-1.5 text-[22px] leading-[1.05] ${t.serif ? 'font-normal italic' : 'font-extrabold tracking-tight'}`}>Trova la casa giusta per te</div>
            <div className="mt-2 h-1.5 w-3/4 rounded" style={{ background: soft }} /><div className="mt-1 h-1.5 w-1/2 rounded" style={{ background: soft }} />
            <div className="mt-3 flex h-7 items-center gap-2 rounded-full px-2 text-[9px]" style={{ background: dark ? 'rgba(255,255,255,.1)' : '#fff', borderRadius: t.r, boxShadow: dark ? 'none' : '0 4px 14px rgba(0,0,0,.08)', transition: tr }}>
              <MapPin size={9} style={{ color: t.c }} /><span className="opacity-60">Città, quartiere</span><span className="ml-auto h-5 rounded-full px-2 leading-5 text-white" style={{ background: t.c, borderRadius: t.r, transition: tr }}>Cerca</span>
            </div>
          </div>
          <img src="/immo/home/demo-1.webp" alt="" className="aspect-[4/3] w-full object-cover" style={{ borderRadius: t.r, transition: tr }} />
        </div>
        <div className="mt-4 grid grid-cols-3 gap-2.5">
          {photos.map((src, k) => (
            <div key={src} className="overflow-hidden" style={{ background: dark ? 'rgba(255,255,255,.06)' : '#fff', borderRadius: t.r, boxShadow: dark ? 'none' : '0 6px 18px -8px rgba(0,0,0,.18)', transition: tr }}>
              <img src={src} alt="" className="aspect-[4/3] w-full object-cover" />
              <div className="p-2"><div className="text-[10px] font-bold" style={{ color: t.c, transition: tr }}>{['€ 320.000', '€ 1.450/mese', '€ 495.000'][k]}</div><div className="mt-1 h-1.5 w-4/5 rounded" style={{ background: soft }} /></div>
            </div>
          ))}
        </div>
      </div>
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

const STYLES = ['Moderno', 'Nordico', 'Contemporaneo', 'Naturale', 'Svuota la stanza', 'Giorno → notte'];

export default function AgenteImmoLanding() {
  const [siteRef, siteOn] = useInView('-15%');
  const [videoRef, videoOn] = useInView('-10%');
  const [styleI, setStyleI] = useState(0);
  useEffect(() => { const id = setInterval(() => setStyleI(v => (v + 1) % STYLES.length), 2200); return () => clearInterval(id); }, []);
  const vid = useRef<HTMLVideoElement>(null);
  const vid2 = useRef<HTMLVideoElement>(null);
  useEffect(() => { [vid, vid2].forEach(v => { if (!v.current) return; if (videoOn) v.current.play().catch(() => {}); else v.current.pause(); }); }, [videoOn]);

  return (
    <div className="dots-bg min-h-screen font-body text-ink antialiased">
      {/* barra: pillola fissa, vetro */}
      <header className="sticky top-0 z-40 pt-4">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4">
          <nav className="glass flex h-14 w-full items-center gap-2 rounded-full border px-2 pl-4 shadow-[0_10px_40px_-15px_rgba(0,0,0,.2)]">
            <a href="#top" className="flex items-center gap-2"><img src="/immo/logo-mark.png" alt="" className="h-8 w-8" /><span className="font-display text-lg font-extrabold tracking-tight">Agente <span className="text-brand">Immo</span></span></a>
            <div className="mx-auto hidden items-center gap-1 md:flex">
              {[['#staging', 'Home staging'], ['#video', 'Video'], ['#sito', 'Il tuo sito'], ['#come', 'Come funziona']].map(([h, l]) => <a key={h} href={h} className="rounded-full px-3.5 py-2 text-sm font-medium text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink">{l}</a>)}
            </div>
            <AuthCta locale="it" href={APP} dashLabel="Dashboard" className="hidden px-3 text-sm font-semibold text-ink sm:block">Accedi</AuthCta>
            <Cta className="!h-10 !px-5 text-sm">Inizia gratis</Cta>
          </nav>
        </div>
      </header>

      {/* hero */}
      <section id="top" className="mx-auto max-w-6xl px-4 pb-16 pt-14 md:pt-20">
        <div className="mx-auto max-w-3xl text-center">
          <Reveal><Pill><Sparkles size={13} className="text-ai" /> Per agenti immobiliari, in Italia</Pill></Reveal>
          <h1 className="mt-6 font-display text-[44px] font-extrabold leading-[1.02] tracking-[-0.03em] md:text-[76px]">
            {'Foto arredate, video e sito.'.split(' ').map((w, i) => <span key={i} className="blur-in inline-block" style={{ animationDelay: `${80 + i * 60}ms` }}>{w}&nbsp;</span>)}
            <span className="block text-muted/60">{'Pronti in minuti.'.split(' ').map((w, i) => <span key={i} className="blur-in inline-block" style={{ animationDelay: `${420 + i * 60}ms` }}>{w}&nbsp;</span>)}</span>
          </h1>
          <Reveal delay={600}><p className="mx-auto mt-6 max-w-xl text-lg leading-relaxed text-muted">Carichi le foto di un immobile. L&apos;AI lo arreda, ne fa un video e lo pubblica sul tuo sito, già pronto con il tuo nome. Tu pensi a vendere.</p></Reveal>
          <Reveal delay={700} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Cta>Inizia gratis, senza carta</Cta>
            <Cta ghost href="#staging">Guarda come funziona</Cta>
          </Reveal>
        </div>

        {/* visual: la chat di staging, prima/dopo che scorre da solo */}
        <Reveal delay={800} className="mx-auto mt-14 max-w-4xl">
          <Tilt className="rounded-[32px] bg-white p-2 shadow-[0_40px_100px_-40px_rgba(0,0,0,.35)] ring-1 ring-black/5">
            <div className="rounded-[24px] bg-canvas p-3 md:p-4">
              <div className="mb-3 flex items-center justify-between px-1">
                <span className="flex items-center gap-2 text-sm font-semibold"><span className="flex h-7 w-7 items-center justify-center rounded-full bg-ai text-white"><Wand2 size={13} /></span> Home staging AI</span>
                <span className="flex h-8 items-center rounded-full bg-white px-3 text-xs font-medium text-muted ring-1 ring-black/5">Soggiorno · vuoto</span>
              </div>
              <BeforeAfter before="/immo/home/staging-before.webp" after="/immo/home/staging-after.webp" className="aspect-[3/2] rounded-2xl md:aspect-[16/9]" />
              <div className="mt-3 flex items-center gap-2 rounded-full bg-white p-1.5 pl-4 ring-1 ring-black/5">
                <span className="text-sm text-muted">Arreda in stile</span>
                <span key={styleI} className="blur-in rounded-full bg-canvas px-3 py-1 text-sm font-semibold">{STYLES[styleI]}</span>
                <span className="ml-auto flex h-9 w-9 items-center justify-center rounded-full bg-ink text-white"><ArrowRight size={15} /></span>
              </div>
            </div>
          </Tilt>
        </Reveal>

        <Reveal delay={900} className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted">
          {['Foto arredata in circa 20 secondi', 'Video da una foto in 2 minuti', 'Sito online al primo immobile', 'Nessuna carta per provare'].map(x => <span key={x} className="flex items-center gap-2"><Check size={14} className="text-brand" />{x}</span>)}
        </Reveal>
      </section>

      {/* 1. home staging */}
      <section id="staging" className="mx-auto max-w-6xl px-4 py-20">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <Pill><Wand2 size={13} className="text-ai" /> Home staging AI</Pill>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">Una stanza vuota vende male. Arredala in un clic.</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">Scegli lo stile o scrivi cosa vuoi, in italiano. L&apos;AI aggiunge i mobili giusti per quella stanza e lascia tutto il resto com&apos;è: muri, finestre, pavimento, prospettiva. Foto da annuncio, non da rivista.</p>
            <ul className="mt-6 space-y-3 text-[15px]">
              {['Riconosce la stanza da sola: cucina, camera, bagno, balcone', 'Svuota, arreda, rinnova o cambia solo un dettaglio con il lazo', 'Prima e dopo salvati nell\'immobile, pronti per il sito'].map(x => <li key={x} className="flex items-start gap-3"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"><Check size={12} /></span>{x}</li>)}
            </ul>
            <Cta className="mt-8">Prova sulla tua foto</Cta>
          </Reveal>
          <Reveal delay={150}>
            <Tilt className="rounded-[24px] bg-white p-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,.3)] ring-1 ring-black/5">
              <BeforeAfter before="https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/soggiorno_prima.jpg" after="https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/soggiorno.jpg" className="aspect-[4/3] rounded-2xl" />
            </Tilt>
            <p className="mt-3 text-center text-xs text-muted">Trascina per confrontare. Foto reale, arredata dall&apos;AI.</p>
          </Reveal>
        </div>
      </section>

      {/* 2. video */}
      <section id="video" className="mx-auto max-w-6xl px-4 py-20">
        <div ref={videoRef} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal className="md:order-2">
            <Pill><Clapperboard size={13} className="text-brand" /> Video AI</Pill>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">Da una foto, un video che si muove davvero.</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">La camera entra nella stanza, la stanza resta quella. Reel per Instagram e TikTok, video per il portale, prima e dopo animati: dalle foto che hai già, senza riprese.</p>
            <ul className="mt-6 space-y-3 text-[15px]">
              {['Clip in alta definizione, verticali o orizzontali', 'Reel da più stanze montato con musica e testi', 'Giorno che diventa notte, cantiere che diventa casa'].map(x => <li key={x} className="flex items-start gap-3"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"><Check size={12} /></span>{x}</li>)}
            </ul>
            <Cta className="mt-8">Crea il primo video</Cta>
          </Reveal>
          <Reveal delay={150} className="md:order-1">
            <div className="relative">
              <Tilt className="overflow-hidden rounded-[24px] bg-white p-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,.3)] ring-1 ring-black/5">
                <video ref={vid} src={VIDEO} poster="https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/soggiorno.jpg" autoPlay muted loop playsInline preload="auto" className="aspect-video w-full rounded-2xl bg-canvas object-cover" />
              </Tilt>
              <div className="absolute -bottom-8 -right-4 w-[46%] rotate-[4deg] overflow-hidden rounded-[20px] bg-white p-1.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,.4)] ring-1 ring-black/5 md:-right-10">
                <video ref={vid2} src={VIDEO2} poster="https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/cucina.jpg" autoPlay muted loop playsInline preload="auto" className="aspect-video w-full rounded-[14px] bg-canvas object-cover" />
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 3. sito */}
      <section id="sito" className="mx-auto max-w-6xl px-4 py-20">
        <div ref={siteRef} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal>
            <Pill><Globe size={13} className="text-brand" /> Il tuo sito, pronto</Pill>
            <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">Il sito della tua agenzia c&apos;è già. Devi solo scegliere il modello.</h2>
            <p className="mt-5 text-lg leading-relaxed text-muted">Ogni immobile che carichi finisce sul tuo sito con foto, descrizione, mappa e cosa c&apos;è vicino. Modelli pronti, i tuoi colori e il tuo logo, modulo contatti, privacy e cookie a norma. Anche sul tuo dominio.</p>
            <ul className="mt-6 space-y-3 text-[15px]">
              {['Pagine immobili con prima e dopo, tour virtuale, report PDF da scaricare', 'Pagine di zona per farti trovare su Google', 'Cambi modello quando vuoi, senza rifare niente'].map(x => <li key={x} className="flex items-start gap-3"><span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"><Check size={12} /></span>{x}</li>)}
            </ul>
            <Cta className="mt-8">Metti online il primo immobile</Cta>
          </Reveal>
          <Reveal delay={150}><Tilt className="rounded-[24px]"><MiniSite active={siteOn} /></Tilt></Reveal>
        </div>
      </section>

      {/* come funziona */}
      <section id="come" className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Pill>Come funziona</Pill>
          <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">Tre passi, un immobile pronto.</h2>
        </Reveal>
        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {[
            [Upload, 'Carica', 'Le foto, un link dell\'annuncio o il CSV del gestionale. La scheda si compila da sola, descrizione compresa.'],
            [Wand2, 'Migliora', 'Arreda le stanze vuote, crea i video, correggi i dettagli parlando con l\'AI in italiano.'],
            [Globe, 'Pubblica', 'Un clic e l\'immobile è sul tuo sito, con report PDF, mappa e servizi vicini. Condividi il link.'],
          ].map(([I, t, d], i) => {
            const Icon = I as typeof Upload;
            return (
              <Reveal key={t as string} as="li" delay={i * 120} className="group relative overflow-hidden rounded-[28px] bg-white p-7 ring-1 ring-black/5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_-12px_rgba(0,0,0,.12)] ease-smooth transition-shadow hover:shadow-[0_30px_50px_-20px_rgba(0,0,0,.25)]">
                <span className="absolute right-6 top-5 font-display text-6xl font-extrabold text-canvas ease-smooth transition-colors group-hover:text-brand/15">{i + 1}</span>
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-ink text-white"><Icon size={20} /></span>
                <h3 className="mt-6 font-display text-2xl font-bold tracking-tight">{t as string}</h3>
                <p className="mt-2 leading-relaxed text-muted">{d as string}</p>
              </Reveal>
            );
          })}
        </ol>
      </section>

      {/* tutto il resto */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-3xl font-extrabold tracking-tight md:text-4xl">E tutto quello che serve intorno.</h2>
        </Reveal>
        <div className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [FileText, 'Report PDF per ogni immobile', 'Brochure con foto, caratteristiche, costi reali e servizi vicini, col tuo logo.'],
            [Sparkles, 'Descrizioni che si scrivono da sole', 'Testo dell\'annuncio completo e naturale, con la zona già dentro.'],
            [MapPin, 'Cosa c\'è vicino, in automatico', 'Metro, scuole, supermercati e parchi con la distanza a piedi.'],
            [Images, 'Galleria di tutte le modifiche', 'Ogni foto con la sua storia: originale, versioni, passaggi.'],
            [Upload, 'Import dal gestionale', 'CSV o link: campi riconosciuti e normalizzati, foto in alta qualità.'],
            [Users, 'Tutta l\'agenzia', 'Più agenti sullo stesso account, ognuno con i suoi immobili.'],
          ].map(([I, t, d], i) => {
            const Icon = I as typeof Upload;
            return (
              <Reveal key={t as string} delay={i * 60} className="flex gap-4 rounded-[24px] bg-white p-5 ring-1 ring-black/5 ease-smooth transition-shadow hover:shadow-[0_20px_40px_-20px_rgba(0,0,0,.2)]">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-canvas text-ink"><Icon size={18} /></span>
                <div><div className="font-semibold">{t as string}</div><p className="mt-1 text-sm leading-relaxed text-muted">{d as string}</p></div>
              </Reveal>
            );
          })}
        </div>
      </section>

      {/* cta finale */}
      <section className="mx-auto max-w-6xl px-4 py-20">
        <Reveal className="relative overflow-hidden rounded-[32px] bg-ink px-6 py-16 text-center text-white md:py-24">
          <div className="pointer-events-none absolute inset-0 opacity-30" style={{ background: 'radial-gradient(600px circle at 20% 0%, rgba(83,126,236,.8), transparent 60%), radial-gradient(500px circle at 90% 100%, rgba(110,86,248,.7), transparent 60%)' }} />
          <div className="relative">
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">Il prossimo immobile, fallo così.</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">Provi gratis, senza carta. Se non ti serve, non paghi niente.</p>
            <a href={APP} className="mt-8 inline-flex h-13 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-ink ease-smooth transition-transform hover:scale-[1.03] active:scale-[.98]">Inizia gratis <ArrowRight size={16} /></a>
          </div>
        </Reveal>
      </section>

      <footer className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-4 px-4 pb-10 text-sm text-muted">
        <span className="flex items-center gap-2"><img src="/immo/logo-mark.png" alt="" className="h-6 w-6" /> © {new Date().getFullYear()} Agente Immo</span>
        <span className="flex gap-5"><Link href="/it/privacy" className="hover:text-ink">Privacy</Link><Link href="/it/cookie" className="hover:text-ink">Cookie</Link><Link href="/it/termini" className="hover:text-ink">Termini</Link><a href="mailto:info@getnearme.it" className="hover:text-ink">Contatti</a></span>
      </footer>
    </div>
  );
}
