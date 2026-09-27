'use client';

import Link from 'next/link';
import AuthCta from '@/components/AuthCta';
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { ArrowDown, ArrowRight, Check, Hammer, Lock, Moon, ChevronLeft, ChevronRight, MessageCircle, Clapperboard, FileText, Globe, ImagePlus, Images, Loader2, MapPin, Pencil, Search, Sparkles, Upload, Users, Wand2 } from 'lucide-react';

// Landing di Agente Immo per gli agenti: tre promesse (home staging AI, video, sito pronto) con lo stesso
// linguaggio della piattaforma: bianco, puntini, card 28/16, pillole, un solo tempo (600ms, ease-smooth).
// Le animazioni entrano quando la sezione arriva in vista (blur-in), niente scatti.

import { FAQ } from '@/lib/landingFaq';
import { PRICING, photosFor, videosFor } from '@/lib/pricing';
import { startCheckout, type Buy } from '@/lib/startCheckout';
import dynamic from 'next/dynamic';

// i modelli veri del sito: codice pesante, si carica dopo il primo schermo
const TemplateShowcase = dynamic(() => import('./TemplateShowcase'), { ssr: false, loading: () => <div className="aspect-[4/3] rounded-[24px] bg-canvas" /> });

// guide SEO linkate dal fondo pagina (collegamenti interni verso le pagine che devono posizionarsi)
// ponytail: le guide per chi inizia (come diventare, provvigione) restano online ma non si linkano da qui: la landing parla ad agenti gia' in attivita'
const GUIDE_LINKS = [['/it/acquisire-incarichi-immobiliari', 'Come acquisire più incarichi'], ['/it/intelligenza-artificiale-agenti-immobiliari', 'AI per agenti immobiliari'], ['/it/video-immobiliari-social', 'Video immobiliari per i social'], ['/it/home-staging-virtuale', 'Home staging virtuale'], ['/it/software-agenti-immobiliari', 'Software per agenti immobiliari']];

const APP = '/it/dashboard'; // ponytail: la piattaforma per ora e' solo in italiano, anche dalla landing inglese

// Lingua della landing (it su /it, en su /en): L('testo italiano', "English text") accanto nel codice.
export type LandingLang = 'it' | 'en';
const Lang = createContext<LandingLang>('it');
const useL = () => { const en = useContext(Lang) === 'en'; return (it: string, eng: string) => (en ? eng : it); };
const useEn = () => useContext(Lang) === 'en';
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
  const sep = useEn() ? ',' : '.';
  return <span ref={ref as unknown as React.Ref<HTMLSpanElement>} className="tabular-nums">{prefix}{thousands(v, sep)}{suffix}</span>;
}

// Fascia a tutta larghezza: bianca (puntini della pagina), grigia o scura. Separa le sezioni e da' ritmo.
function Band({ id, tone = 'white', children, className = '', inner = 'max-w-6xl' }: { id?: string; tone?: 'white' | 'canvas' | 'dark'; children: ReactNode; className?: string; inner?: string }) {
  const bg = tone === 'dark' ? 'bg-ink text-white' : tone === 'canvas' ? 'bg-canvas' : '';
  return <section id={id} className={`${bg} ${className}`}><div className={`mx-auto ${inner} px-4 py-16 md:py-32`}>{children}</div></section>;
}

// Titolo di sezione: numero in blu + pillola, titolo, sottotitolo
function Eyebrow({ n, children }: { n?: string; children: ReactNode }) {
  return <Pill>{n && <span className="font-bold text-brand">{n}</span>}{children}</Pill>;
}

const Pill = ({ children, className = '' }: { children: ReactNode; className?: string }) =>
  <span className={`inline-flex h-8 items-center gap-1.5 rounded-full bg-white px-3.5 text-[13px] font-medium text-muted ring-1 ring-black/5 ${className}`}>{children}</span>;

const Cta = ({ href = '#prova', children, ghost = false, className = '', onClick }: { href?: string; children: ReactNode; ghost?: boolean; className?: string; onClick?: (e: React.MouseEvent<HTMLAnchorElement>) => void }) =>
  <a href={href} onClick={onClick} className={`group inline-flex h-12 items-center gap-2 rounded-full px-6 text-[15px] font-semibold ease-smooth transition-all active:scale-[.98] ${ghost ? 'bg-white text-ink ring-1 ring-black/10 hover:ring-ink' : 'bg-ink text-white hover:bg-black hover:shadow-[0_16px_40px_-16px_rgba(0,0,0,.5)]'} ${className}`}>
    {children}{!ghost && <ArrowRight size={16} className="ease-smooth transition-transform group-hover:translate-x-0.5" />}
  </a>;

// Prima/dopo: si trascina col mouse, da fermo scorre da solo avanti e indietro
function BeforeAfter({ before, after, className = '', auto = true }: { before: string; after: string; className?: string; auto?: boolean }) {
  const L = useL();
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
      <img src={after} alt={L('Dopo il home staging', "After virtual staging")} className="absolute inset-0 h-full w-full object-cover" draggable={false} />
      <img src={before} alt={L('Prima', "Before")} className="absolute inset-0 h-full w-full object-cover" draggable={false} style={{ clipPath: `inset(0 ${100 - p}% 0 0)`, transition: t }} />
      <span className="absolute left-4 top-4 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur">{L('Prima', "Before")}</span>
      <span className="absolute right-4 top-4 flex items-center gap-1 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink backdrop-blur"><Sparkles size={12} className="text-ai" /> {L('Dopo', "After")}</span>
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

const thousands = (n: number, sep = '.') => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, sep);

// crediti in grande, sotto cosa ci fai (come Higgsfield)
function Credits({ n }: { n: number }) {
  const L = useL(), en = useEn();
  return (
    <div className="mt-6 rounded-[20px] bg-canvas p-5">
      <div className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight"><Sparkles size={16} className="text-ai" /> {thousands(n, en ? ',' : '.')} {L('crediti al mese', "credits a month")}</div>
      <div className="mt-2 space-y-1 pl-6 text-[15px] text-muted">
        <div>= {photosFor(n)} {L('foto arredate', "staged photos")}</div>
        <div>~ {videosFor(n)} {L('video', "videos")}</div>
      </div>
    </div>
  );
}

// il sito: stesso blocco dei crediti (titolo grande), sotto cosa c'e' dentro in due colonne.
// Solo funzioni che esistono davvero nei siti degli agenti (niente traduzione finche' non c'e').
const SITE_PERKS: [typeof Globe, string, string][] = [[Search, 'SEO: ti trovano su Google nella tua zona', 'SEO: found on Google in your area'], [Pencil, 'Modifichi tutto: colori, testi, foto, sezioni', 'Edit everything: colors, text, photos, sections'], [MessageCircle, 'Le richieste arrivano a te, non al portale', 'Inquiries come to you, not to a portal'], [Sparkles, 'Ogni casa che carichi va online da sola', 'Every listing you upload goes live on its own']];
function SiteIncluded() {
  const L = useL();
  return (
    <div className="mt-3 rounded-[20px] bg-canvas p-5">
      <div className="flex items-center gap-2 font-display text-xl font-extrabold tracking-tight"><Globe size={16} className="text-brand" /> {L('Il tuo sito incluso', "Your website included")}</div>
      <div className="mt-1 pl-6 text-[15px] text-muted">agenteimmo.me/<span className="text-ink">{L('tuonome', "yourname")}</span>, {L('già fatto con i nostri modelli', "ready-made with our templates")}</div>
      <ul className="mt-4 space-y-2.5 pl-6 text-[15px]">
        {SITE_PERKS.map(([Icon, l, e]) => <li key={l} className="flex items-center gap-2.5"><Icon size={15} className="shrink-0 text-brand" />{L(l, e)}</li>)}
      </ul>
    </div>
  );
}

// Quanto costa oggi farlo senza di noi (stime indicative di mercato, come nella vecchia landing GetNearMe)
const WITHOUT: [typeof Globe, string, string, string, string, string, string][] = [
  [Wand2, 'Home staging', '~1.500 €', 'home stager, circa 4 giorni per casa', 'Home staging', '~€1,500', 'home stager, about 4 days per home'],
  [Clapperboard, 'Video della casa', '~250 €', 'videomaker, mezza giornata', 'Property video', '~€250', 'videographer, half a day'],
  [Globe, 'Sito con i tuoi immobili', '~1.500 €', 'web agency, 2-4 settimane', 'Website with your listings', '~€1,500', 'web agency, 2-4 weeks'],
  [Sparkles, 'Foto sistemate e più luminose', '~150 €', 'fotografo o fotoritocco, per casa', 'Brighter, retouched photos', '~€150', 'photographer or retouching, per home'],
];
function Compare() {
  const L = useL(), en = useEn();
  return (
    <Band inner="max-w-4xl">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Pill>{L('Quanto ti costa oggi', "What it costs you today")}</Pill>
        <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">{L('Da solo, per una casa, spenderesti', "On your own, one home would cost you")} <span className="text-rose-600">{en ? <CountUp to={3400} prefix="~€" /> : <CountUp to={3400} prefix="~" suffix=" €" />}</span>.</h2>
        <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{L(`Con Agente Immo è tutto incluso, per ogni casa che prendi, da ${PRICING.starter} € al mese.`, `With Agente Immo it's all included, for every home you list, from €${PRICING.starter} a month.`)}</p>
      </Reveal>
      <Reveal delay={120} className="mt-10 overflow-hidden rounded-[28px] bg-white ring-1 ring-black/5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_8px_24px_-12px_rgba(0,0,0,.12)]">
        <div className="hidden grid-cols-[1.4fr_1fr_auto] gap-4 bg-canvas px-6 py-3 text-xs font-semibold uppercase tracking-wide text-muted md:grid">
          <span>{L('Cosa ti serve', "What you need")}</span><span>{L('Senza Agente Immo', "Without Agente Immo")}</span><span className="text-right">{L('Con Agente Immo', "With Agente Immo")}</span>
        </div>
        {WITHOUT.map(([Icon, ...t]) => { const [what, cost, who] = en ? t.slice(3) : t; return (
          <div key={what} className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-2 border-t border-line px-5 py-4 first-of-type:border-t-0 md:grid-cols-[1.4fr_1fr_auto] md:px-6 md:first-of-type:border-t">
            <span className="col-span-2 flex items-center gap-3 font-semibold md:col-span-1"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-canvas text-ink"><Icon size={16} /></span>{what}</span>
            <span><span className="block font-bold text-rose-600">{cost}</span><span className="block text-xs text-muted">{who}</span></span>
            <span className="flex items-center justify-end gap-1.5 text-sm font-semibold text-emerald-600"><Check size={15} /> {L('Incluso', "Included")}</span>
          </div>
        ); })}
        <div className="grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 border-t border-line bg-canvas px-5 py-5 md:grid-cols-[1.4fr_1fr_auto] md:px-6">
          <span className="col-span-2 font-display text-lg font-extrabold md:col-span-1">{L('Totale', "Total")}</span>
          <span className="font-display text-xl font-extrabold text-rose-600 line-through decoration-rose-300">{L('~3.400 €', "~€3,400")}</span>
          <span className="text-right font-display text-xl font-extrabold text-emerald-600">{L(`da ${PRICING.starter} €/mese`, `from €${PRICING.starter}/mo`)}</span>
        </div>
      </Reveal>
      <p className="mt-4 text-center text-xs text-muted">{L('Costi indicativi di mercato per una singola casa; il sito è una spesa una tantum più la manutenzione.', "Indicative market prices for a single home; the website is a one-off cost plus maintenance.")}</p>
    </Band>
  );
}

// Due piani con lo stesso prodotto (stessa qualita', sito compreso): cambiano solo i crediti e come si paga.
// Prova gratis in pagina, senza account: una foto arredata dall'AI e poi il suo video (1 + 1 al giorno per IP, limite nel server).
// Si vede il prima/dopo; per scaricarla serve l'account.
// template del video nella prova: i primi due gratis, gli altri solo con un piano
const VIDEO_TEMPLATES = [['popup', 'Popup', 'Pop-up', Sparkles], ['gravity', 'Dall\'alto', 'From above', ArrowDown], ['particles', 'Particelle', 'Particles', Wand2], ['stopmotion', 'Stop-motion', 'Stop-motion', Clapperboard], ['cantiere', 'Cantiere', 'Construction', Hammer], ['daynight', 'Giorno e notte', 'Day to night', Moon]] as const;
const DEMO_STYLES = [['modern', 'Moderno', 'Modern'], ['nordic', 'Nordico', 'Nordic'], ['empty', 'Svuota', 'Empty it']] as const;
// ?simula=1: prova senza AI e senza costi (il server la accetta solo dagli IP senza limiti e in sviluppo).
// In sviluppo e' sempre attiva; ?vero=1 per la prova vera.
const simulate = () => { const q = new URLSearchParams(location.search); return q.has('simula') || (process.env.NODE_ENV === 'development' && !q.has('vero')); };

function TryIt() {
  const L = useL();
  const [before, setBefore] = useState<string | null>(null);
  const [after, setAfter] = useState<string | null>(null);
  const [style, setStyle] = useState<(typeof DEMO_STYLES)[number][0]>('modern');
  const [text, setText] = useState(''); // richiesta scritta: se c'e', vince sullo stile
  const [busy, setBusy] = useState(false);
  const [left, setLeft] = useState(1);
  const [msg, setMsg] = useState('');
  // secondo passo: la foto arredata diventa un video (1 al giorno, vedi /api/landing/demo-video)
  const [video, setVideo] = useState<string | null>(null);
  const [photoUrl, setPhotoUrl] = useState<string | null>(null); // foto intera su R2, da scaricare dopo la registrazione
  const [vBusy, setVBusy] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const pick = (f?: File) => {
    if (!f || !f.type.startsWith('image/')) return;
    const img = new Image();
    img.onload = () => {
      // ridotta nel browser a 1600 px: upload veloce anche da telefono
      const k = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement('canvas'); c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      setBefore(c.toDataURL('image/jpeg', 0.88)); setAfter(null); setVideo(null); setMsg('');
      URL.revokeObjectURL(img.src);
    };
    img.src = URL.createObjectURL(f);
  };
  const run = async () => {
    if (!before || busy) return;
    setBusy(true); setMsg(''); setAfter(null); setVideo(null);
    const r = await fetch('/api/landing/demo', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: before, style, prompt: text.trim(), mock: simulate() }) }).catch(() => null);
    const d = await r?.json().catch(() => null) as { image?: string; url?: string; left?: number; error?: string } | null;
    setBusy(false);
    if (typeof d?.left === 'number') setLeft(d.left);
    if (d?.image) { setPhotoUrl(d.url ?? null); setEmptied(style === 'empty' && !text.trim()); return setAfter(d.image); }
    setMsg(d?.error === 'limit' ? L('Hai già fatto la prova di oggi. Crea l\'account per continuare.', "You've used today's free try. Create an account to continue.") : d?.error === 'busy' ? L('Ci sono molte prove in corso, riprova tra qualche minuto.', "Lots of tries running right now, try again in a few minutes.") : L('Non siamo riusciti ad arredare questa foto. Prova con un\'altra stanza.', "We couldn't stage this photo. Try another room."));
  };
  // Scarica: la prova resta nel browser, si entra (login o registrazione) e dopo l'onboarding la piattaforma la fa scaricare
  const keep = (withVideo: boolean) => {
    try { localStorage.setItem('agenteimmo:demo', JSON.stringify({ photo: photoUrl, video: withVideo ? video : null })); } catch { /* spazio pieno: si entra comunque */ }
    window.location.href = APP;
  };
  const [picking, setPicking] = useState(false); // scelta del template del video
  const [emptied, setEmptied] = useState(false); // stanza svuotata: il video dei mobili non ha senso, si scarica e basta
  const toVideo = async (anim: 'popup' | 'gravity') => {
    if (!after || vBusy) return;
    setPicking(false); setVBusy(true); setMsg('');
    const fail = (e?: string) => { setVBusy(false); setMsg(e === 'limit' ? L('Hai già fatto il video di prova oggi. Crea l\'account per farne altri.', "You've made today's free video. Create an account to make more.") : e === 'busy' ? L('Ci sono molti video in corso, riprova tra qualche minuto.', "Lots of videos running right now, try again in a few minutes.") : L('Non siamo riusciti a fare il video di questa foto. Riprova con un\'altra stanza.', "We couldn't make a video of this photo. Try another room.")); };
    const r = await fetch('/api/landing/demo-video', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ image: after, anim, mock: simulate() }) }).catch(() => null);
    const d = await r?.json().catch(() => null) as { job?: string; error?: string } | null;
    if (!d?.job) return fail(d?.error);
    // Veo lavora 1-2 minuti: si controlla ogni 5 s, per massimo 5 minuti
    for (let i = 0; i < 60; i++) {
      await new Promise(res => setTimeout(res, 5000));
      const g = await fetch(`/api/landing/demo-video?job=${encodeURIComponent(d.job)}`).then(x => x.json()).catch(() => null) as { url?: string; status?: string; error?: string } | null;
      if (g?.url) { setVBusy(false); return setVideo(g.url); }
      if (g?.error) return fail(g.error);
    }
    fail();
  };
  return (
    <>
        <div className="rounded-[28px] bg-white p-1.5 shadow-[0_0_0_1px_rgba(0,0,0,.05),0_0_80px_-10px_rgba(110,86,248,.45),0_40px_100px_-40px_rgba(0,0,0,.35)] sm:rounded-[32px] sm:p-2">
          <div className="relative overflow-hidden rounded-[22px] bg-canvas sm:rounded-[24px]">
            {video ? (
              <video src={video} autoPlay muted loop playsInline className="aspect-[4/3] w-full bg-canvas object-cover md:aspect-[16/10]" />
            ) : after && before ? (
              <div className="relative">
                <BeforeAfter before={before} after={after} auto={false} className="aspect-[4/3] md:aspect-[16/10]" />
                {vBusy && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/55 backdrop-blur-[2px]">
                    <Loader2 size={28} className="animate-spin text-ai" />
                    <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold shadow">{L('Stiamo facendo il video, 1-2 minuti', "Making your video, 1-2 minutes")}</span>
                  </div>
                )}
              </div>
            ) : before ? (
              <div className="relative aspect-[4/3] md:aspect-[16/10]">
                <img src={before} alt={L('La tua foto', "Your photo")} className="absolute inset-0 h-full w-full object-cover" />
                {busy && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-white/55 backdrop-blur-[2px]">
                    <Loader2 size={28} className="animate-spin text-ai" />
                    <span className="rounded-full bg-white px-4 py-1.5 text-sm font-semibold shadow">{L('L\'AI sta arredando la stanza, circa un minuto', "AI is staging the room, about a minute")}</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="relative" onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); pick(e.dataTransfer.files[0]); }}>
                <BeforeAfter before="/immo/home/demo-before.webp" after="/immo/home/demo-after.webp" className="aspect-[4/3] md:aspect-[16/9]" />
                <button type="button" onClick={() => input.current?.click()} className="absolute bottom-4 left-1/2 hidden -translate-x-1/2 items-center gap-2.5 whitespace-nowrap rounded-full bg-ink px-5 py-3 text-sm font-semibold sm:flex sm:bottom-5 sm:px-7 sm:py-4 sm:text-base text-white shadow-[0_0_0_6px_rgba(255,255,255,.35),0_20px_40px_-10px_rgba(0,0,0,.5)] ease-smooth transition-transform hover:scale-[1.04]">
                  <ImagePlus size={18} /> {L('Carica la foto di una tua stanza', "Upload a photo of a room")}
                </button>
              </div>
            )}
            <input ref={input} type="file" accept="image/*" className="hidden" onChange={e => { pick(e.target.files?.[0]); e.target.value = ''; }} />
          </div>
          <div className="px-1.5 pb-2 pt-3 sm:p-3">
            <div className="flex flex-wrap items-center gap-2 rounded-[20px] bg-canvas p-2 pl-2 ring-1 ring-black/5 focus-within:bg-white focus-within:ring-2 focus-within:ring-ai sm:flex-nowrap">
              <button type="button" onClick={() => input.current?.click()} aria-label={L('Carica una foto', "Upload a photo")} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-ink shadow-sm ring-1 ring-black/5 hover:bg-line/40"><ImagePlus size={18} /></button>
              <input value={text} onChange={e => setText(e.target.value.slice(0, 200))} onKeyDown={e => e.key === 'Enter' && run()} placeholder={L('Scrivi come la vuoi, es. soggiorno moderno con divano grigio', "Describe it, e.g. modern living room with a grey sofa")}
                className="min-w-0 flex-1 bg-transparent px-2 text-[15px] outline-none placeholder:text-muted/70" />
              {after
                ? video || emptied
                  ? <button type="button" onClick={() => keep(!!video)} className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-sm font-semibold text-white sm:w-auto">{L('Scarica tutto', "Download all")} <ArrowRight size={15} /></button>
                  : <button type="button" disabled={vBusy} onClick={() => setPicking(p => !p)} className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-ai px-5 text-sm font-semibold text-white disabled:opacity-50 sm:w-auto"><Clapperboard size={15} /> {L('Trasforma in video', "Turn into video")}</button>
                : <button type="button" disabled={busy || left <= 0} onClick={() => (before ? run() : input.current?.click())} className="inline-flex h-11 w-full shrink-0 items-center justify-center gap-2 rounded-2xl bg-ink px-5 text-sm font-semibold text-white disabled:opacity-40 sm:w-auto"><Sparkles size={15} /> {before ? L('Arreda', "Stage it") : L('Carica foto', "Upload photo")}</button>}
            </div>
            {/* template del video: Popup e Dall'alto nella prova, gli altri si vedono ma portano ai prezzi */}
            {picking && after && !video && (
              <div className="blur-in mt-3 rounded-[20px] bg-canvas p-3">
                <div className="px-1 pb-2 text-sm font-semibold">{L('Scegli l\'animazione del video', "Pick the video animation")}</div>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {VIDEO_TEMPLATES.map(([k, it, eng, Icon]) => {
                    const free = k === 'popup' || k === 'gravity';
                    const cls = 'flex h-12 items-center gap-2 rounded-2xl px-3 text-left text-sm font-semibold ease-smooth transition-colors';
                    return free
                      ? <button key={k} type="button" onClick={() => toVideo(k)} className={`${cls} bg-white ring-1 ring-black/5 hover:ring-ai`}><Icon size={16} className="shrink-0 text-ai" />{L(it, eng)}</button>
                      : <a key={k} href="#prezzi" className={`${cls} text-muted ring-1 ring-black/5 hover:text-ink`}><Lock size={14} className="shrink-0" />{L(it, eng)}<span className="ml-auto text-[11px] font-medium">{L('Con un piano', "With a plan")}</span></a>;
                  })}
                </div>
              </div>
            )}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-2 sm:mt-3 sm:justify-start">
              <span className="hidden text-sm text-muted sm:inline">{L('Oppure scegli uno stile:', "Or pick a style:")}</span>
              {DEMO_STYLES.map(([k, l, e]) => (
                <button key={k} type="button" onClick={() => { setStyle(k); setText(''); }} className={`h-9 rounded-full px-4 text-sm font-semibold ease-smooth transition-colors ${style === k && !text ? 'bg-ink text-white' : 'bg-canvas text-muted hover:text-ink'}`}>{L(l, e)}</button>
              ))}
              {/* ci sono altri stili (nella piattaforma): la pillola non fa nulla */}
              <span aria-hidden className="flex h-9 w-9 items-center justify-center gap-0.5 rounded-full bg-canvas">{[0, 1, 2].map(i => <span key={i} className="h-[3px] w-[3px] rounded-full bg-muted" />)}</span>
              <span className="mt-1 w-full text-center text-sm text-muted sm:ml-auto sm:mt-0 sm:w-auto sm:text-left">{video || emptied ? L('Prova finita per oggi', "Free try done for today") : after ? L('Ti resta 1 video gratis', "1 free video left") : L('Prova gratis: 1 foto e 1 video', "Free: 1 photo and 1 video")}</span>
            </div>
          </div>
        </div>
        {after && <p className="mt-3 text-center text-sm text-muted">{video ? L('Foto e video pronti per l\'annuncio e i social. Per scaricarli entra o crea l\'account, è gratis.', "Photo and video ready for your listing and socials. Sign in or create a free account to download them.") : emptied ? L('Stanza svuotata. Per scaricarla entra o crea l\'account, è gratis.', "Room emptied. Sign in or create a free account to download it.") : <>{L('Ora trasformala in un video per i social, gratis. Oppure', "Now turn it into a video for social media, free. Or")} <button type="button" onClick={() => keep(false)} className="font-medium text-ink underline underline-offset-4">{L('scarica solo la foto', "download just the photo")}</button>.</>}{left > 0 && <> {L('Oppure scegli un altro stile e', "Or pick another style and")} <button type="button" onClick={run} className="font-medium text-ink underline underline-offset-4">{L('rifai la prova', "try again")}</button>.</>}</p>}
        {msg && <p className="mt-3 text-center text-sm text-rose-600">{msg} {left <= 0 && <a href={APP} className="font-medium text-ink underline underline-offset-4">{L('Crea l\'account', "Create an account")}</a>}</p>}
    </>
  );
}

function Pricing() {
  const L = useL(), en = useEn();
  // Piano scelto: con l'accesso gia' fatto dritti a Stripe; altrimenti accesso e poi Stripe (?buy=). Annullando si torna qui.
  const buyHref = (b: Buy) => `/it/checkout/agency?buy=${b}`;
  const buyClick = (b: Buy) => async (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (!(await startCheckout(b, { back: en ? 'en' : 'it' }))) window.location.href = buyHref(b);
  };
  const [yearly, setYearly] = useState(true);
  const pro = yearly ? PRICING.yearly : PRICING.quarterly;
  const billed = en ? (yearly ? `€${PRICING.yearly * 12} billed yearly` : `€${PRICING.quarterly * 3} billed every 3 months`) : yearly ? `${PRICING.yearly * 12} € fatturati ogni anno` : `${PRICING.quarterly * 3} € fatturati ogni 3 mesi`;
  return (
    <Band id="prezzi" tone="canvas">
      <Reveal className="mx-auto max-w-2xl text-center">
        <Pill>{L('Prezzi', "Pricing")}</Pill>
        <h2 className="mt-5 font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-5xl">{L('Meno di un caffè al giorno. Per tutte le case.', "Less than a coffee a day. For every home.")}</h2>
        <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{L('Sito, foto e video in entrambi i piani. Cambiano solo i crediti.', "Website, photos and videos in both plans. Only the credits change.")}</p>
      </Reveal>
      <div className="mx-auto mt-12 grid max-w-4xl items-stretch gap-5 md:grid-cols-2">
        <Reveal delay={80} className="flex flex-col rounded-[32px] bg-white p-8 ring-1 ring-black/5">
          <div className="flex h-10 items-center text-sm font-semibold text-muted">Starter</div>
          <div className="mt-3 flex items-end gap-2"><span className="font-display text-6xl font-extrabold tracking-tight">{en ? `€${PRICING.starter}` : `${PRICING.starter} €`}</span><span className="pb-2 text-muted">{L('/ mese', "/ month")}</span></div>
          <div className="mt-1 text-sm text-muted">{L('Mensile, disdici quando vuoi', "Monthly, cancel anytime")}</div>
          <Credits n={PRICING.starterCredits} />
          <SiteIncluded />
          <div className="min-h-8 flex-1" />
          <Cta ghost href={buyHref('starter')} onClick={buyClick('starter')} className="w-full justify-center">{L('Scegli Starter', "Choose Starter")}</Cta>
        </Reveal>
        <Reveal delay={160} className="relative flex flex-col rounded-[32px] bg-white p-8 ring-2 ring-ink shadow-[0_40px_100px_-40px_rgba(0,0,0,.35)]">
          <span className="absolute -top-3 left-8 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">{L('Consigliato', "Recommended")}</span>
          <div className="flex h-10 items-center justify-between gap-3">
            <div className="text-sm font-semibold text-muted">Pro</div>
            <div className="flex rounded-full bg-canvas p-1">
              {([[false, L('Trimestrale', "Quarterly")], [true, L('Annuale', "Yearly")]] as const).map(([y, l]) => (
                <button key={l} type="button" onClick={() => setYearly(y)} className={`h-8 rounded-full px-3 text-xs font-semibold ease-smooth transition-colors ${yearly === y ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-end gap-2"><span key={pro} className="blur-in font-display text-6xl font-extrabold tracking-tight">{en ? `€${pro}` : `${pro} €`}</span><span className="pb-2 text-muted">{L('/ mese', "/ month")}</span></div>
          <div key={billed} className="blur-in mt-1 text-sm text-muted">{billed}</div>
          <Credits n={PRICING.credits} />
          <SiteIncluded />
          <div className="min-h-8 flex-1" />
          <Cta href={buyHref(yearly ? 'pro_yearly' : 'pro_quarterly')} onClick={buyClick(yearly ? 'pro_yearly' : 'pro_quarterly')} className="w-full justify-center">{L('Scegli Pro', "Choose Pro")}</Cta>
        </Reveal>
      </div>
      <p className="mt-6 text-center text-sm text-muted">{L('Prima di scegliere,', "Before choosing,")} <a href="#prova" className="font-medium text-ink underline underline-offset-4">{L('provalo gratis sulla tua foto', "try it free on your photo")}</a>{L(', senza registrarti. Prezzi finali, senza IVA aggiunta.', ", no sign-up needed. Final prices, no VAT added.")}</p>
    </Band>
  );
}

// Il filo della pagina: l'incarico lo vince chi presenta meglio la casa. Hero (promessa + prova), il perche' (scena
// dell'acquisizione, fascia scura), le tre cose che ti diamo (01 02 03, fasce alternate), il conto, i prezzi.
const CHECK = <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"><Check size={12} /></span>;
const H2 = 'mt-5 font-display text-[32px] font-extrabold leading-[1.05] tracking-tight md:text-5xl';

export default function AgenteImmoLanding({ lang = 'it', faq }: { lang?: LandingLang; faq: [string, string][] }) {
  return <Lang.Provider value={lang}><Landing faq={faq} /></Lang.Provider>;
}

function Landing({ faq }: { faq: [string, string][] }) {
  const L = useL(), en = useEn();
  const [siteRef, siteOn] = useInView('-15%');
  const [videoRef, videoOn] = useInView('-10%');
  const vid = useRef<HTMLVideoElement>(null);
  const vid2 = useRef<HTMLVideoElement>(null);
  // i video (1,5 MB) si scaricano solo quando la sezione arriva in vista: prima non rubano banda al primo schermo
  const [videoSeen, setVideoSeen] = useState(false);
  if (videoOn && !videoSeen) setVideoSeen(true); // aggiornamento in render: niente effetto a cascata
  useEffect(() => { [vid, vid2].forEach(v => { if (!v.current) return; if (videoOn) v.current.play().catch(() => {}); else v.current.pause(); }); }, [videoOn, videoSeen]);

  return (
    <div className="dots-bg min-h-screen overflow-x-clip font-body text-ink antialiased">
      {/* barra: pillola fissa, vetro */}
      <header className="sticky top-0 z-40 pt-4">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4">
          <nav className="glass flex h-14 w-full items-center gap-2 rounded-full border px-2 pl-4 shadow-[0_10px_40px_-15px_rgba(0,0,0,.2)]">
            <a href="#top" className="flex items-center gap-2"><img src="/immo/logo-mark.png" alt="" className="h-8 w-8" /><span className="whitespace-nowrap font-display text-lg font-extrabold tracking-tight">Agente <span className="text-brand">Immo</span></span></a>
            <div className="mx-auto hidden items-center gap-1 md:flex">
              {[['#staging', L('Annunci', "Listings")], ['#video', 'Social'], ['#sito', L('Il tuo sito', "Your website")], ['#prezzi', L('Prezzi', "Pricing")]].map(([h, l]) => <a key={h} href={h} className="rounded-full px-3.5 py-2 text-sm font-medium text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink">{l}</a>)}
            </div>
            <AuthCta locale="it" href={APP} dashLabel="Dashboard" className="hidden px-3 text-sm font-semibold text-ink sm:block">{L('Accedi', "Sign in")}</AuthCta>
            <Cta className="ml-auto !h-10 shrink-0 whitespace-nowrap !px-4 text-sm sm:!px-5 md:ml-0">{L('Prova gratis', "Try it free")}</Cta>
          </nav>
        </div>
      </header>

      {/* hero: la promessa in una frase, poi la prova sulla propria foto */}
      <section id="top" className="mx-auto max-w-6xl px-4 pb-16 pt-10 md:pb-24 md:pt-20">
        <div className="mx-auto max-w-5xl text-center">
          <Reveal><h1><Pill><Sparkles size={13} className="text-ai" /> {L('Il software per agenti immobiliari', "The software for real estate agents")}</Pill></h1></Reveal>
          <p className="mx-auto mt-6 w-fit font-display text-[clamp(30px,5.2vw,60px)] font-extrabold leading-[1.05] tracking-[-0.03em]">
            <span className="block sm:whitespace-nowrap">{L('Vinci più incarichi.', "Win more listings.").split(' ').map((w, i) => <span key={i} className="blur-in inline-block" style={{ animationDelay: `${i * 40}ms` }}>{w}&nbsp;</span>)}</span>
            <span className="block text-balance text-brand sm:whitespace-nowrap">{L('Presenta meglio ogni casa.', "Present every home better.").split(' ').map((w, i) => <span key={i} className="blur-in inline-block" style={{ animationDelay: `${360 + i * 40}ms` }}>{w}&nbsp;</span>)}</span>
          </p>
          <Reveal delay={600}><p className="mx-auto mt-6 max-w-2xl text-base leading-relaxed text-muted md:text-lg">{L('L\'incarico va a chi arriva con la casa già arredata, un video pronto e il suo sito. Con Agente Immo ce l\'hai in un minuto, senza fotografo né web agency.', "The listing goes to the agent who shows up with the home staged, a video ready and their own website. With Agente Immo you get it in a minute, no photographer or web agency.")}</p></Reveal>
          <Reveal delay={700} className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Cta>{L('Prova gratis sulla tua foto', "Try it free on your photo")}</Cta>
            <span className="hidden sm:block"><Cta ghost href="#prezzi">{L('Vedi i prezzi', "See pricing")}</Cta></span>
          </Reveal>
        </div>

        {/* prova in pagina al posto dello slider: prima dell'upload scorre l'esempio, poi e' la foto dell'agente */}
        <div id="prova" className="mx-auto mt-10 max-w-4xl scroll-mt-24 md:mt-14">
          <Reveal delay={800} anim="rise"><TryIt /></Reveal>
        </div>

        <Reveal delay={900} className="mx-auto mt-10 flex max-w-3xl flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted">
          {[L('La prima foto ferma chi scorre', "The first photo stops the scroll"), L('Il proprietario vede subito cosa farai per lui', "Owners see right away what you'll do for them"), L('1 foto e 1 video gratis, senza registrarti', "1 photo and 1 video free, no sign-up")].map(x => <span key={x} className="flex items-center gap-2"><Check size={14} className="text-brand" />{x}</span>)}
        </Reveal>
      </section>

      {/* 01 home staging */}
      <Band id="staging">
        <div className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal anim="in-left">
            <Eyebrow n="01">{L('Annunci che si notano', "Listings that stand out")}</Eyebrow>
            <h2 className={H2}>{L('Chi scorre non si ferma su una stanza vuota.', "Nobody stops scrolling for an empty room.")}</h2>
            <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{L('Vuota, una casa sembra piccola e fredda. Arredata, chi guarda ci si immagina dentro e ti chiama.', "Empty, a home looks small and cold. Staged, buyers picture themselves there and call you.")}</p>
            <ul className="mt-6 space-y-3 text-[15px]">
              {[L('La prima foto ferma chi scorre', "The first photo stops the scroll"), L('Il cliente capisce subito come vivrebbe quella casa', "Buyers instantly see how they'd live there"), L('Nessun home staging vero da pagare o da organizzare', "No physical staging to pay for or organize")].map(x => <li key={x} className="flex items-start gap-3">{CHECK}{x}</li>)}
            </ul>
            <span className="hidden md:block"><Cta className="mt-8">{L('Prova gratis', "Try it free")}</Cta></span>
          </Reveal>
          <Reveal delay={150} anim="in-right">
            <div className="parallax">
              <Tilt className="rounded-[24px] bg-white p-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,.3)] ring-1 ring-black/5">
                <BeforeAfter before="https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/soggiorno_prima.jpg" after="https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/soggiorno.jpg" className="aspect-[4/3] rounded-2xl" />
              </Tilt>
              <p className="mt-3 text-center text-xs text-muted">{L('Trascina per confrontare. Foto reale, arredata dall\'AI.', "Drag to compare. Real photo, staged by AI.")}</p>
            </div>
          </Reveal>
          {/* su telefono i bottoni vanno sotto le immagini */}
          <div className="flex justify-center pt-6 md:hidden"><Cta>{L('Prova gratis', "Try it free")}</Cta></div>
        </div>
      </Band>

      {/* 02 video */}
      <Band id="video" tone="canvas">
        <div ref={videoRef} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal className="md:order-2" anim="in-right">
            <Eyebrow n="02">{L('Farti conoscere', "Get known")}</Eyebrow>
            <h2 className={H2}>{L('Ogni casa diventa un video per i tuoi social.', "Every home becomes a video for your socials.")}</h2>
            <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{L('Nella tua zona i clienti chiamano l\'agente che vedono ogni settimana sui social. Qui ogni incarico diventa un video, senza videomaker.', "Locally, clients call the agent they see every week on social media. Here every listing becomes a video, no videographer.")}</p>
            <ul className="mt-6 space-y-3 text-[15px]">
              {[L('Ti fai conoscere nella tua zona, non solo sul portale', "Get known in your area, not just on the portal"), L('Ogni incarico diventa un contenuto da pubblicare', "Every listing becomes something to post"), L('Niente riprese, niente montaggio, niente videomaker', "No filming, no editing, no videographer")].map(x => <li key={x} className="flex items-start gap-3">{CHECK}{x}</li>)}
            </ul>
            <span className="hidden md:block"><Cta className="mt-8">{L('Crea video', "Create a video")}</Cta></span>
          </Reveal>
          <Reveal delay={150} className="md:order-1" anim="in-left">
            <div className="parallax relative w-[90%]">
              <Tilt className="overflow-hidden rounded-[24px] bg-white p-2 shadow-[0_30px_80px_-30px_rgba(0,0,0,.3)] ring-1 ring-black/5">
                <video ref={vid} src={videoSeen ? VIDEO : undefined} poster="https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/soggiorno.jpg" muted loop playsInline preload="none" className="aspect-video w-full rounded-2xl bg-canvas object-cover" />
              </Tilt>
              {/* verticale, come un reel: stesso video tagliato al centro */}
              <div className="absolute -bottom-10 -right-[8%] w-[32%] rotate-[4deg] overflow-hidden rounded-[24px] bg-white p-1.5 shadow-[0_24px_60px_-24px_rgba(0,0,0,.4)] ring-1 ring-black/5">
                <video ref={vid2} src={videoSeen ? VIDEO2 : undefined} poster="https://pub-a668674eaa484e8e8f2f10c264392bfc.r2.dev/spike-video/cucina.jpg" muted loop playsInline preload="none" className="aspect-[9/16] w-full rounded-[18px] bg-canvas object-cover" />
              </div>
            </div>
          </Reveal>
          <div className="mt-14 flex justify-center md:hidden"><Cta>{L('Crea video', "Create a video")}</Cta></div>
        </div>
      </Band>

      {/* 03 sito */}
      <Band id="sito">
        <div ref={siteRef} className="grid items-center gap-10 md:grid-cols-2 md:gap-16">
          <Reveal anim="in-left">
            <Eyebrow n="03">{L('Il sito te lo facciamo noi', "We build your website")}</Eyebrow>
            <h2 className={H2}>{L('Il tuo sito lo facciamo noi, tu scegli lo stile.', "We build your website, you just pick the style.")}</h2>
            <p className="mt-5 text-base leading-relaxed text-muted md:text-lg">{L('Appena ti iscrivi hai il tuo sito, con il tuo nome. Scegli il modello, metti logo e colori: gli immobili ci finiscono da soli.', "Sign up and your website is ready, with your name. Pick a template, add your logo and colors: your listings land there on their own.")}</p>
            <ul className="mt-6 space-y-3 text-[15px]">
              {[L('Incluso nell\'abbonamento, niente web agency da pagare', "Included in your plan, no web agency to pay"), L('Ogni immobile che carichi è subito online', "Every property you upload is live right away"), L('Le richieste arrivano a te, non a un portale', "Inquiries come to you, not to a portal")].map(x => <li key={x} className="flex items-start gap-3">{CHECK}{x}</li>)}
            </ul>
            {/* su telefono il bottone va sotto i modelli */}
            <span className="hidden md:block"><Cta href={APP} className="mt-8">{L('Crea il tuo sito', "Create your website")}</Cta></span>
          </Reveal>
          <Reveal delay={150} anim="in-right" className="mt-6 md:mt-0"><div className="parallax"><Tilt className="rounded-[24px]"><TemplateShowcase active={siteOn} en={en} /></Tilt></div></Reveal>
          <div className="flex justify-center pt-6 md:hidden"><Cta href={APP}>{L('Crea il tuo sito', "Create your website")}</Cta></div>
        </div>
      </Band>

      {/* tutto il resto */}
      <Band tone="canvas">
        <Reveal className="mx-auto max-w-2xl text-center">
          <Pill>{L('E in più', "And more")}</Pill>
          <h2 className={H2}>{L('Il lavoro noioso sparisce.', "The boring work disappears.")}</h2>
        </Reveal>
        <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {[
            [FileText, L('Il cliente si ricorda di te', "Clients remember you"), L('Dopo la visita riparte con un report della casa col tuo logo, da girare a chi deve decidere.', "After the viewing they leave with a report of the home with your logo, to share with whoever decides.")],
            [Sparkles, L('Annunci pronti in un attimo', "Listings ready in no time"), L('Il testo si scrive da solo: tu lo rileggi e pubblichi.', "The copy writes itself: you review it and publish.")],
            [MapPin, L('Risposte prima delle domande', "Answers before questions"), L('Scuole, metro e negozi vicini sono già nell\'annuncio: meno telefonate a vuoto.', "Nearby schools, transit and shops are already in the listing: fewer pointless calls.")],
            [Images, L('Tutto in un posto', "Everything in one place"), L('Foto, video e versioni di ogni immobile sempre a portata, anche dal telefono.', "Photos, videos and versions of every property always at hand, even on your phone.")],
            [Upload, L('Parti da quello che hai', "Start from what you have"), L('Gli immobili che hai già non li ricarichi a mano.', "No re-uploading the properties you already have.")],
            [Users, L('Tutta l\'agenzia con la stessa immagine', "The whole agency, one look"), L('Ogni agente con i suoi immobili, tutti presentati allo stesso livello.', "Each agent with their own listings, all presented to the same standard.")],
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
          <Pill>{L('Domande frequenti', "FAQ")}</Pill>
          <h2 className="mt-5 font-display text-3xl font-extrabold tracking-tight md:text-4xl">{L('Quello che ci chiedono gli agenti immobiliari', "What real estate agents ask us")}</h2>
        </Reveal>
        <div className="mt-10 space-y-3">
          {faq.map(([q, a], i) => (
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
            <h2 className="mx-auto max-w-2xl font-display text-4xl font-extrabold leading-[1.05] tracking-tight md:text-6xl">{L('Il prossimo incarico, vincilo così.', "Win your next listing like this.")}</h2>
            <p className="mx-auto mt-5 max-w-xl text-lg text-white/70">{L('Carica una foto e guarda il risultato. Gratis, senza registrarti.', "Upload a photo and see the result. Free, no sign-up.")}</p>
            <a href="#prova" className="mt-8 inline-flex h-13 items-center gap-2 rounded-full bg-white px-7 text-[15px] font-semibold text-ink ease-smooth transition-transform hover:scale-[1.03] active:scale-[.98]">{L('Prova gratis', "Try it free")} <ArrowRight size={16} /></a>
          </div>
        </Reveal>
      </section>

      {/* lingua: pillola fissa in basso a destra, la lingua attiva nel cerchio bianco */}
      <nav aria-label="Lingua" className="fixed bottom-4 right-4 z-40 flex h-11 items-center rounded-full bg-canvas/90 p-1 text-sm font-semibold shadow-[0_10px_30px_-10px_rgba(0,0,0,.25)] ring-1 ring-black/5 backdrop-blur">
        {(['it', 'en'] as const).map(l => {
          const on = (en ? 'en' : 'it') === l;
          return <a key={l} href={`/${l}`} hrefLang={l} aria-current={on ? 'true' : undefined} className={`flex h-9 w-9 items-center justify-center rounded-full uppercase ease-smooth transition-colors ${on ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{l}</a>;
        })}
      </nav>

      {/* footer: marchio a sinistra, tre colonne di link (prodotto, guide SEO, legale), riga finale */}
      <footer className="border-t border-line bg-canvas">
        <div className={`mx-auto grid max-w-6xl gap-10 px-4 py-16 text-center md:text-left ${en ? 'md:grid-cols-[1.4fr_1fr_1fr]' : 'md:grid-cols-[1.4fr_1fr_1.2fr_1fr]'}`}>
          <div>
            <a href="#top" className="flex items-center justify-center gap-2 md:justify-start"><img src="/immo/logo-mark.png" alt="" className="h-8 w-8" /><span className="font-display text-lg font-extrabold tracking-tight">Agente <span className="text-brand">Immo</span></span></a>
            <p className="mx-auto mt-4 max-w-xs text-sm md:mx-0 leading-relaxed text-muted">{L('Foto arredate, video e il tuo sito per ogni immobile. Il software per agenti immobiliari.', "Staged photos, videos and your website for every property. The software for real estate agents.")}</p>
            <Cta className="mt-6 !h-10 !px-5 text-sm">{L('Prova gratis', "Try it free")}</Cta>
          </div>
          {([
            [L('Prodotto', "Product"), [['#staging', 'Home staging'], ['#video', L('Video per i social', "Social videos")], ['#sito', L('Il tuo sito', "Your website")], ['#prezzi', L('Prezzi', "Pricing")], ['#domande', L('Domande frequenti', "FAQ")]]],
            // le guide sono articoli in italiano: nella versione inglese la colonna non c'e'
            ...(en ? [] : [['Guide', GUIDE_LINKS]]),
            ['Agente Immo', [['/it/privacy', 'Privacy'], ['/it/cookie', 'Cookie'], ['/it/termini', L('Termini', "Terms")], ['mailto:info@agenteimmo.me', L('Contatti', "Contact")], ['#cookie', L('Preferenze cookie', "Cookie settings")]]],
          ] as [string, string[][]][]).map(([h, links]) => (
            <nav key={h} aria-label={h}>
              <div className="text-sm font-semibold">{h}</div>
              <ul className="mt-4 space-y-2.5 text-sm text-muted">
                {links.map(([href, l]) => <li key={href}>{href === '#cookie' ? <button type="button" onClick={() => window.dispatchEvent(new Event('agenteimmo:cookie-prefs'))} className="ease-smooth transition-colors hover:text-ink">{l}</button> : href.startsWith('/') ? <Link href={href} className="ease-smooth transition-colors hover:text-ink">{l}</Link> : <a href={href} className="ease-smooth transition-colors hover:text-ink">{l}</a>}</li>)}
              </ul>
            </nav>
          ))}
        </div>
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 border-t border-line px-4 py-6 text-xs text-muted md:flex-row">
          <span>© {new Date().getFullYear()} Agente Immo</span>
          <span className="flex items-center gap-4">
            <span className="flex gap-2">{(['it', 'en'] as const).map(l => <a key={l} href={`/${l}`} hrefLang={l} className={`${(en ? 'en' : 'it') === l ? 'font-semibold text-ink' : 'hover:text-ink'}`}>{l === 'it' ? 'Italiano' : 'English'}</a>)}</span>
            <a href="mailto:info@agenteimmo.me" className="hover:text-ink">info@agenteimmo.me</a>
          </span>
        </div>
      </footer>
    </div>
  );
}
