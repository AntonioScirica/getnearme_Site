'use client';

import { useEffect, useState } from 'react';
import { Check, Globe, Loader2, Sparkles, X } from 'lucide-react';
import { authFetch, CARD_SHADOW } from './api';
import { isBuy, type Buy } from '@/lib/startCheckout';
export { isBuy };
import { PRICING, photosFor, videosFor } from '@/lib/pricing';

export type Credits = { plan: 'none' | 'starter' | 'pro'; balance: number; monthly: number; renews: string | null; until: string | null; unlimited?: boolean };
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, '.');
const date = (s: string | null) => (s ? new Date(s).toLocaleDateString('it-IT', { day: 'numeric', month: 'long' }) : '');

export function useCredits(): Credits | null {
  const [c, setC] = useState<Credits | null>(null);
  useEffect(() => {
    const load = () => authFetch('/api/platform/credits').then(r => (r.ok ? r.json() : null)).then(d => d && setC(d)).catch(() => {});
    load();
    window.addEventListener('agenteimmo:credits', load);
    return () => window.removeEventListener('agenteimmo:credits', load);
  }, []);
  return c;
}

// Pillola in alto: crediti rimasti, porta alla pagina del piano
export function CreditsPill() {
  const c = useCredits();
  if (!c) return null;
  return (
    <a href="#/piano" className="flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold ring-1 ring-line ease-smooth transition-shadow hover:shadow-md">
      <Sparkles size={14} className="text-ai" /> {c.unlimited ? 'Crediti illimitati' : c.plan === 'none' ? 'Scegli un piano' : `${fmt(c.balance)} crediti`}
    </a>
  );
}

async function checkout(plan: 'starter' | 'pro_yearly' | 'pro_quarterly') {
  const d = await authFetch('/api/platform/checkout', { method: 'POST', body: JSON.stringify({ plan }) }).then(r => r.json()).catch(() => null);
  if (d?.url) window.location.href = d.url;
}

// Pagina del piano: saldo, scelta del piano, pagamento con Stripe (dati di fatturazione raccolti da Stripe)
// buy = piano scelto sulla landing (anche prima del login): si va dritti a Stripe
export default function PlanView({ ok, buy }: { ok?: boolean; buy?: Buy }) {
  const c = useCredits();
  const [yearly, setYearly] = useState(buy !== 'pro_quarterly');
  const [busy, setBusy] = useState<string>(buy ?? '');
  const go = async (p: Buy) => { setBusy(p); await checkout(p); setBusy(''); };
  useEffect(() => {
    if (!buy) return;
    history.replaceState(null, '', '#/piano'); // tornando indietro da Stripe non riparte da solo
    void go(buy);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const card = (name: string, price: number, sub: string, credits: number, cta: React.ReactNode, strong = false) => (
    <div className={`flex flex-col rounded-[28px] bg-white p-7 ${strong ? 'ring-2 ring-ink' : CARD_SHADOW}`}>
      <div className="text-sm font-semibold text-muted">{name}</div>
      <div className="mt-2 flex items-end gap-2"><span className="font-display text-5xl font-extrabold tracking-tight">{price} €</span><span className="pb-1.5 text-muted">/ mese</span></div>
      <div className="mt-1 text-sm text-muted">{sub}</div>
      <div className="mt-5 rounded-[20px] bg-canvas p-4 text-[15px]">
        <div className="flex items-center gap-2 font-semibold"><Sparkles size={15} className="text-ai" /> {fmt(credits)} crediti al mese</div>
        <div className="mt-1 pl-6 text-muted">= {photosFor(credits)} foto arredate · ~ {videosFor(credits)} video</div>
        <div className="mt-2 flex items-center gap-2 font-semibold"><Globe size={15} className="text-brand" /> Il tuo sito incluso</div>
      </div>
      <div className="min-h-6 flex-1" />
      {cta}
    </div>
  );
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Il tuo piano</h1>
      {ok && <p className="mt-3 flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700"><Check size={15} /> Pagamento ricevuto: i crediti arrivano in pochi secondi.</p>}
      {c?.unlimited && <p className="mt-4 text-sm text-muted">Account amministratore: crediti illimitati, niente da pagare.</p>}
      {c && c.plan !== 'none' && !c.unlimited && (
        <div className={`mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-white p-6 ${CARD_SHADOW}`}>
          <div>
            <div className="text-sm text-muted">Piano {c.plan === 'pro' ? 'Pro' : 'Starter'}</div>
            <div className="font-display text-3xl font-extrabold tracking-tight">{fmt(c.balance)} crediti</div>
            <div className="text-sm text-muted">circa {photosFor(c.balance)} foto · si ricaricano a {fmt(c.monthly)} il {date(c.renews)}</div>
          </div>
        </div>
      )}
      <div className="mt-8 flex items-center justify-between gap-3">
        <h2 className="font-semibold">{c?.plan === 'none' || !c ? 'Scegli il piano' : 'Cambia piano'}</h2>
        <div className="flex rounded-full bg-canvas p-1">
          {([[false, 'Trimestrale'], [true, 'Annuale']] as const).map(([y, l]) => (
            <button key={l} type="button" onClick={() => setYearly(y)} className={`h-8 rounded-full px-3 text-xs font-semibold ${yearly === y ? 'bg-ink text-white' : 'text-muted'}`}>{l}</button>
          ))}
        </div>
      </div>
      <div className="mt-4 grid items-stretch gap-4 md:grid-cols-2">
        {card('Starter', PRICING.starter, 'Mensile, disdici quando vuoi', PRICING.starterCredits,
          <button type="button" disabled={!!busy} onClick={() => go('starter')} className="flex h-11 items-center justify-center gap-2 rounded-full bg-white text-sm font-semibold ring-1 ring-black/10 hover:ring-ink">{busy === 'starter' && <Loader2 size={15} className="animate-spin" />} Scegli Starter</button>)}
        {card('Pro', yearly ? PRICING.yearly : PRICING.quarterly, yearly ? `${PRICING.yearly * 12} € fatturati ogni anno` : `${PRICING.quarterly * 3} € fatturati ogni 3 mesi`, PRICING.credits,
          <button type="button" disabled={!!busy} onClick={() => go(yearly ? 'pro_yearly' : 'pro_quarterly')} className="flex h-11 items-center justify-center gap-2 rounded-full bg-ink text-sm font-semibold text-white">{busy.startsWith('pro') && <Loader2 size={15} className="animate-spin" />} Scegli Pro</button>, true)}
      </div>
      <p className="mt-4 text-center text-xs text-muted">Pagamento sicuro con Stripe. Ti chiediamo ragione sociale, Partita IVA e codice SDI o PEC per la fattura elettronica. Prezzi finali, senza IVA (regime forfettario).</p>
    </div>
  );
}

// Crediti finiti: finestra con la scelta del piano (si apre su ogni risposta 402)
export function NoCreditsModal() {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const on = () => setOpen(true);
    window.addEventListener('agenteimmo:no-credits', on);
    return () => window.removeEventListener('agenteimmo:no-credits', on);
  }, []);
  if (!open) return null;
  return (
    <div className="blur-in fixed inset-0 z-[260] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div onClick={e => e.stopPropagation()} className="relative w-full max-w-md rounded-[32px] bg-white p-7 text-center shadow-2xl">
        <button type="button" onClick={() => setOpen(false)} aria-label="Chiudi" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-canvas"><X size={16} /></button>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ai/10 text-ai"><Sparkles size={20} /></span>
        <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight">Ti servono crediti</h2>
        <p className="mt-2 text-sm text-muted">Scegli un piano per arredare le foto, creare video e avere il tuo sito. Da {PRICING.starter} € al mese.</p>
        <a href="#/piano" onClick={() => setOpen(false)} className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-white">Vedi i piani</a>
      </div>
    </div>
  );
}

// La prova fatta sulla landing (foto arredata e video): dopo registrazione e onboarding si scarica da qui.
// Resta nel browser (localStorage) finche' l'agente non chiude la finestra.
export function DemoDownload() {
  // letto una volta al montaggio (solo client: la piattaforma non si renderizza sul server)
  const [demo, setDemo] = useState<{ photo?: string | null; video?: string | null } | null>(() => {
    try { const d = JSON.parse(localStorage.getItem('agenteimmo:demo') ?? 'null'); return d?.photo || d?.video ? d : null; } catch { return null; }
  });
  const [busy, setBusy] = useState<string | null>(null);
  if (!demo) return null;
  const close = () => { localStorage.removeItem('agenteimmo:demo'); setDemo(null); };
  const save = async (url: string, name: string) => {
    setBusy(name);
    try {
      const blob = await (await fetch(url)).blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch { window.open(url, '_blank'); } // ponytail: se il download diretto non va, si apre il file
    setBusy(null);
  };
  return (
    <div className="blur-in fixed inset-0 z-[250] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm" onClick={close}>
      <div onClick={e => e.stopPropagation()} className="relative w-full max-w-lg rounded-[32px] bg-white p-7 text-center shadow-2xl">
        <button type="button" onClick={close} aria-label="Chiudi" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-canvas"><X size={16} /></button>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">La tua prova è pronta</h2>
        <p className="mt-2 text-sm text-muted">Ecco quello che hai creato sulla nostra pagina. Scaricalo e usalo per il tuo annuncio.</p>
        <div className={`mt-5 grid gap-2 ${demo.photo && demo.video ? 'grid-cols-2' : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {demo.photo && <img src={demo.photo} alt="Foto arredata" className="aspect-[4/3] w-full rounded-[20px] object-cover" />}
          {demo.video && <video src={demo.video} autoPlay muted loop playsInline className="aspect-[4/3] w-full rounded-[20px] bg-canvas object-cover" />}
        </div>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {demo.photo && <button type="button" disabled={!!busy} onClick={() => save(demo.photo!, 'agenteimmo-foto.jpg')} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-50">{busy === 'agenteimmo-foto.jpg' && <Loader2 size={15} className="animate-spin" />}Scarica la foto</button>}
          {demo.video && <button type="button" disabled={!!busy} onClick={() => save(demo.video!, 'agenteimmo-video.mp4')} className="inline-flex h-11 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-50">{busy === 'agenteimmo-video.mp4' && <Loader2 size={15} className="animate-spin" />}Scarica il video</button>}
        </div>
        <p className="mt-5 text-sm text-muted">Per arredare le tue case, fare video e pubblicare il sito <a href="#/piano" onClick={close} className="font-medium text-ink underline underline-offset-4">scegli un piano</a>.</p>
      </div>
    </div>
  );
}
