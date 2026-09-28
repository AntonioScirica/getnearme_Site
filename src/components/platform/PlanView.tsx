'use client';

import { useEffect, useState } from 'react';
import { Check, Coins, Loader2, Sparkles, X } from 'lucide-react';
import { authFetch, CARD_SHADOW } from './api';
import { isBuy, type Buy } from '@/lib/startCheckout';
import { Credits, SiteIncluded, SiteNotIncluded } from '@/components/PlanParts';
export { isBuy };
import { PRICING, PACKS, photosFor, videosFor, type PackId } from '@/lib/pricing';

export type Credits = { plan: 'none' | 'starter' | 'plus' | 'pro'; balance: number; monthly: number; renews: string | null; until: string | null; unlimited?: boolean };
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
// pochi crediti: sotto il 15% del mese o sotto il costo di un video (con un piano attivo)
export const isLow = (c: Credits) => !c.unlimited && c.plan !== 'none' && (c.balance < Math.max(75, Math.round(c.monthly * 0.15)));
export function CreditsPill() {
  const c = useCredits();
  if (!c) return null;
  const low = isLow(c);
  return (
    <a href="#/piano" className={`flex h-10 items-center gap-1.5 rounded-full bg-white px-4 text-sm font-semibold ring-1 ease-smooth transition-shadow hover:shadow-md ${low ? 'ring-amber-300 text-amber-700' : 'ring-line'}`}>
      <Coins size={14} className={low ? 'text-amber-500' : 'text-ai'} /> {c.unlimited ? 'Crediti illimitati' : c.plan === 'none' ? 'Scegli un piano' : `${fmt(c.balance)} crediti`}{low && <span className="ml-1 text-xs font-medium">· Ricarica</span>}
    </a>
  );
}

async function checkout(plan: Buy | PackId) {
  const isPack = PACKS.some(p => p.id === plan);
  const d = await authFetch('/api/platform/checkout', { method: 'POST', body: JSON.stringify(isPack ? { pack: plan } : { plan }) }).then(r => r.json()).catch(() => null);
  if (d?.url) window.location.href = d.url;
  return d as { url?: string; error?: string } | null;
}

// Pagina del piano: saldo, scelta del piano, pagamento con Stripe (dati di fatturazione raccolti da Stripe)
// buy = piano scelto sulla landing (anche prima del login): si va dritti a Stripe
export default function PlanView({ ok, buy }: { ok?: boolean; buy?: Buy }) {
  const c = useCredits();
  const [yearly, setYearly] = useState(buy !== 'pro_quarterly');
  const [busy, setBusy] = useState<string>(buy ?? '');
  const [portalError, setPortalError] = useState<string | null>(null);
  const [changing, setChanging] = useState(false); // con un piano attivo: card dei piani aperte per cambiarlo
  const go = async (p: Buy | PackId) => {
    setBusy(p); setPortalError(null);
    const d = await checkout(p);
    setBusy('');
    if (d?.error === 'payment_failed') setPortalError('Pagamento non riuscito: il piano non è cambiato. Controlla la carta in Gestisci abbonamento.');
    else if (d?.url?.includes('ok=1')) setChanging(false);
  };
  useEffect(() => {
    if (!buy) return;
    history.replaceState(null, '', '#/piano'); // tornando indietro da Stripe non riparte da solo
    void checkout(buy).then(() => setBusy('')); // busy parte gia' su buy
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const [slug, setSlug] = useState<string | null>(null);
  useEffect(() => { authFetch('/api/platform/site').then(r => r.json()).then(d => setSlug(d.slug ?? null)).catch(() => {}); }, []);
  const pro = yearly ? PRICING.yearly : PRICING.quarterly;
  const billed = yearly ? `${PRICING.yearly * 12} € fatturati ogni anno` : `${PRICING.quarterly * 3} € fatturati ogni 3 mesi`;
  // stesse card dei prezzi della landing
  return (
    <div className="mx-auto max-w-4xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">Il tuo piano</h1>
      {ok && <p className="mt-3 flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700"><Check size={15} /> Pagamento ricevuto: i crediti arrivano in pochi secondi.</p>}
      {c?.unlimited && <p className="mt-4 text-sm text-muted">Account amministratore: crediti illimitati, niente da pagare.</p>}
      {c && c.plan !== 'none' && !c.unlimited && (
        <div className={`mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-white p-6 ${CARD_SHADOW}`}>
          <div>
            {/* con un piano attivo non si rivedono le card: cambio piano, disdetta, pagamento e fatture nel portale Stripe */}
            <div className="text-sm text-muted">Piano {c.plan === 'pro' ? 'Pro' : c.plan === 'plus' ? 'Plus' : 'Starter'}</div>
            {portalError && <p className="text-sm text-rose-600">{portalError}</p>}
            <div className="font-display text-3xl font-extrabold tracking-tight">{fmt(c.balance)} crediti</div>
            <div className="text-sm text-muted">circa {photosFor(c.balance)} foto o {videosFor(c.balance)} video · si ricaricano a {fmt(c.monthly)} il {date(c.renews)}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setChanging(v => !v)} aria-expanded={changing}
            className={`flex h-11 items-center rounded-full px-6 text-sm font-semibold ring-1 ease-smooth transition-colors ${changing ? 'bg-canvas ring-ink' : 'bg-white ring-black/10 hover:ring-ink'}`}>Cambia piano</button>
          <button type="button" disabled={busy === 'portal'} onClick={async () => { setBusy('portal'); const d = await authFetch('/api/platform/billing', { method: 'POST' }).then(r => r.json()).catch(() => null); if (d?.url) window.location.href = d.url; else { setBusy(''); setPortalError('Portale non disponibile, riprova tra poco.'); } }}
            className="flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand disabled:opacity-60">{busy === 'portal' && <Loader2 size={14} className="animate-spin" />}Gestisci abbonamento</button>
          </div>
        </div>
      )}
      {c && c.plan !== 'none' && !c.unlimited && (
        <>
          <h2 className="mt-8 font-semibold">Ti servono altri crediti?</h2>
          <p className="mt-1 text-sm text-muted">I pacchetti si aggiungono al saldo e non scadono con il mese. Pagamento singolo.</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {PACKS.map(p => (
              <div key={p.id} className={`flex items-center justify-between gap-4 rounded-[24px] bg-white p-5 ${CARD_SHADOW}`}>
                <div>
                  <div className="font-display text-2xl font-extrabold tracking-tight">{fmt(p.credits)} crediti</div>
                  <div className="text-sm text-muted">{photosFor(p.credits)} foto o {videosFor(p.credits)} video</div>
                </div>
                <button type="button" disabled={!!busy} onClick={() => go(p.id)} className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-60">{busy === p.id ? <Loader2 size={15} className="animate-spin" /> : null} {p.eur} €</button>
              </div>
            ))}
          </div>
        </>
      )}
      {/* solo a crediti letti: prima (c null) comparivano e sparivano appena si scopriva il piano attivo */}
      {c && (c.plan === 'none' || c.unlimited || changing) && (<>
      <h2 className="mt-8 font-semibold">{changing ? 'Cambia piano' : 'Scegli il piano'}</h2>
      <p className="mt-1 text-sm text-muted">{changing ? 'Il nuovo piano parte subito: paghi ora la differenza per il periodo in corso e i crediti diventano quelli del nuovo piano.' : 'Starter: foto e video. Plus: anche il tuo sito. Pro: più crediti, a trimestre o anno.'}</p>
      <div className="mt-5 grid items-stretch gap-5 md:grid-cols-3">
        <div className={`flex flex-col rounded-[32px] bg-white p-8 ${CARD_SHADOW}`}>
          <div className="flex h-10 items-center text-sm font-semibold text-muted">Starter</div>
          <div className="mt-3 flex items-end gap-2"><span className="font-display text-6xl font-extrabold tracking-tight">{PRICING.starter} €</span><span className="pb-2 text-muted">/ mese</span></div>
          <div className="mt-1 text-sm text-muted">Mensile, disdici quando vuoi</div>
          <Credits n={PRICING.starterCredits} />
          <SiteNotIncluded />
          <div className="min-h-8 flex-1" />
          <button type="button" disabled={!!busy || (changing && c?.plan === 'starter')} onClick={() => go('starter')} className="flex h-12 items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold ring-1 ring-black/10 hover:ring-ink disabled:opacity-60">{busy === 'starter' && <Loader2 size={15} className="animate-spin" />}{changing ? (c?.plan === 'starter' ? 'Il tuo piano' : 'Passa a Starter') : 'Scegli Starter'}</button>
        </div>
        <div className={`flex flex-col rounded-[32px] bg-white p-8 ${CARD_SHADOW}`}>
          <div className="flex h-10 items-center text-sm font-semibold text-muted">Plus</div>
          <div className="mt-3 flex items-end gap-2"><span className="font-display text-6xl font-extrabold tracking-tight">{PRICING.plus} €</span><span className="pb-2 text-muted">/ mese</span></div>
          <div className="mt-1 text-sm text-muted">Mensile, disdici quando vuoi</div>
          <Credits n={PRICING.plusCredits} />
          <SiteIncluded slug={slug} />
          <div className="min-h-8 flex-1" />
          <button type="button" disabled={!!busy || (changing && c?.plan === 'plus')} onClick={() => go('plus')} className="flex h-12 items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold ring-1 ring-black/10 hover:ring-ink disabled:opacity-60">{busy === 'plus' && <Loader2 size={15} className="animate-spin" />}{changing ? (c?.plan === 'plus' ? 'Il tuo piano' : 'Passa a Plus') : 'Scegli Plus'}</button>
        </div>
        <div className="relative flex flex-col rounded-[32px] bg-white p-8 shadow-[0_40px_100px_-40px_rgba(0,0,0,.35)] ring-2 ring-ink">
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
          <SiteIncluded slug={slug} />
          <div className="min-h-8 flex-1" />
          <button type="button" disabled={!!busy} onClick={() => go(yearly ? 'pro_yearly' : 'pro_quarterly')} className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-white disabled:opacity-60">{busy.startsWith('pro') && <Loader2 size={15} className="animate-spin" />}{changing ? (c?.plan === 'pro' ? 'Cambia fatturazione' : 'Passa a Pro') : 'Scegli Pro'}</button>
        </div>
      </div>
      <p className="mt-5 text-center text-xs text-muted">Pagamento sicuro con Stripe. Ti chiediamo ragione sociale, Partita IVA e codice SDI o PEC per la fattura elettronica. Prezzi finali, senza IVA (regime forfettario).</p>
      </>)}
    </div>
  );
}

// Crediti finiti: finestra con la scelta del piano (si apre su ogni risposta 402)
export function NoCreditsModal() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const c = useCredits();
  const hasPlan = !!c && c.plan !== 'none' && !c.unlimited;
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
        <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight">{hasPlan ? 'Crediti finiti' : 'Ti servono crediti'}</h2>
        <p className="mt-2 text-sm text-muted">{hasPlan ? `Si ricaricano il ${date(c!.renews)}. Se ti servono prima, un pacchetto si aggiunge subito al saldo e non scade.` : `Scegli un piano per arredare le foto, creare video e avere il tuo sito. Da ${PRICING.starter} € al mese.`}</p>
        {hasPlan ? (
          <div className="mt-6 flex flex-col gap-2">
            {PACKS.map(p => <button key={p.id} type="button" disabled={!!busy} onClick={() => { setBusy(p.id); void checkout(p.id).then(() => setBusy('')); }} className="flex h-11 items-center justify-between rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-60"><span>{fmt(p.credits)} crediti</span><span>{busy === p.id ? <Loader2 size={15} className="animate-spin" /> : `${p.eur} €`}</span></button>)}
          </div>
        ) : <a href="#/piano" onClick={() => setOpen(false)} className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-white">Vedi i piani</a>}
      </div>
    </div>
  );
}

// La prova fatta sulla landing (foto arredata e video): dopo l'accesso si scarica da qui, poi l'onboarding.
// onDone = agente nuovo: il bottone "Conosci Immo e scarica" scarica e poi apre l'onboarding.
export const hasDemo = () => { try { const d = JSON.parse(localStorage.getItem('agenteimmo:demo') ?? 'null'); return !!(d?.photo || d?.video); } catch { return false; } };
export function DemoDownload({ onDone }: { onDone?: () => void }) {
  // letto una volta al montaggio (solo client: la piattaforma non si renderizza sul server)
  const [demo, setDemo] = useState<{ photo?: string | null; video?: string | null } | null>(() => {
    try { const d = JSON.parse(localStorage.getItem('agenteimmo:demo') ?? 'null'); return d?.photo || d?.video ? d : null; } catch { return null; }
  });
  const [busy, setBusy] = useState(false);
  if (!demo) return null;
  const close = () => { localStorage.removeItem('agenteimmo:demo'); setDemo(null); onDone?.(); };
  const save = async (url: string, name: string) => {
    try {
      const blob = await (await fetch(url)).blob();
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = name; a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } catch { window.open(url, '_blank'); } // ponytail: se il download diretto non va, si apre il file
  };
  // scarica tutto; il caricamento dura almeno 1 s (si vede che succede qualcosa), poi si chiude / si va all'onboarding
  const go = async () => {
    setBusy(true);
    await Promise.all([
      (async () => { if (demo.photo) await save(demo.photo, 'agenteimmo-foto.jpg'); if (demo.video) await save(demo.video, 'agenteimmo-video.mp4'); })(),
      new Promise(r => setTimeout(r, 1000)),
    ]);
    close();
  };
  const what = demo.photo && demo.video ? 'foto e video' : demo.video ? 'il video' : 'la foto';
  return (
    <div className="blur-in fixed inset-0 z-[250] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm" onClick={busy ? undefined : close}>
      <div onClick={e => e.stopPropagation()} className="relative w-full max-w-lg rounded-[32px] bg-white p-7 text-center shadow-2xl">
        <button type="button" onClick={close} disabled={busy} aria-label="Chiudi" className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-canvas"><X size={16} /></button>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">La tua prova è pronta</h2>
        <p className="mt-2 text-sm text-muted">Ecco quello che hai creato sulla nostra pagina. Scaricalo e usalo per il tuo annuncio.</p>
        <div className={`mt-5 grid gap-2 ${demo.photo && demo.video ? 'grid-cols-2' : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {demo.photo && <img src={demo.photo} alt="Foto arredata" className="aspect-[4/3] w-full rounded-[20px] object-cover" />}
          {demo.video && <video src={demo.video} autoPlay muted loop playsInline className="aspect-[4/3] w-full rounded-[20px] bg-canvas object-cover" />}
        </div>
        <button type="button" disabled={busy} onClick={go} className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-white disabled:opacity-70">
          {busy && <Loader2 size={16} className="animate-spin" />}{onDone ? `Conosci Immo e scarica ${what}` : `Scarica ${what}`}
        </button>
        {!onDone && <p className="mt-5 text-sm text-muted">Per arredare le tue case, fare video e pubblicare il sito <a href="#/piano" onClick={close} className="font-medium text-ink underline underline-offset-4">scegli un piano</a>.</p>}
      </div>
    </div>
  );
}
