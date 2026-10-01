'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Coins, Copy, Gift, Loader2, Sparkles, UserRound, X } from 'lucide-react';
import { authFetch, CARD_SHADOW } from './api';
import { isBuy, type Buy } from '@/lib/startCheckout';
import { Credits, SiteIncluded } from '@/components/PlanParts';
export { isBuy };
import { PRICING, PACKS, photosFor, videosFor, type PackId } from '@/lib/pricing';
import { tr, pageLang, pageLocale } from './i18n';

export type Credits = { plan: 'none' | 'starter' | 'plus' | 'pro'; balance: number; monthly: number; renews: string | null; until: string | null; unlimited?: boolean; lapsed?: boolean };
const en = pageLang() === 'en';
const fmt = (n: number) => String(n).replace(/\B(?=(\d{3})+(?!\d))/g, en ? ',' : '.');
const eur = (n: number) => (en ? `€${n}` : `${n} €`);
const date = (s: string | null) => (s ? new Date(s).toLocaleDateString(pageLocale(), { day: 'numeric', month: 'long' }) : '');

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
// Pillola in alto: crediti (porta alla pagina del piano) e, attaccata, l'icona del profilo (porta a Il mio profilo)
// c: crediti gia' letti da chi la mostra (stessa lettura dei pulsanti accanto: compaiono insieme, non prima)
export function CreditsPill({ c: given }: { c?: Credits | null } = {}) {
  const own = useCredits();
  const c = given !== undefined ? given : own;
  // mentre si caricano: un posto della stessa misura, cosi' arrivando non sposta gli altri pulsanti
  // posto vuoto e invisibile (niente bordo da solo): la pillola arriva intera, bordo e crediti insieme
  if (!c) return <span className="flex h-10 w-[136px]" aria-hidden />;
  const low = isLow(c);
  // telefono: area di tocco 40px, il cerchio resta da 32
  const profile = <a href="#/profilo" data-tour="profilo" aria-label={tr('Il mio profilo', 'My profile')} title={tr('Il mio profilo', 'My profile')} className="group flex h-10 w-10 items-center justify-center md:h-8 md:w-8"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-canvas text-ink ease-smooth transition-colors group-hover:bg-line"><UserRound size={16} /></span></a>;
  // senza piano: Scegli un piano in nero, il profilo accanto
  if (c.plan === 'none' && !c.unlimited && c.balance <= 0) return (
    <span className="blur-in flex items-center gap-2">
      <a href="#/piano" className="flex h-10 items-center rounded-full bg-ink px-4 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-black">{tr('Scegli un piano', 'Choose a plan')}</a>
      <span className="flex h-10 items-center rounded-full bg-white ring-1 ring-line md:px-1">{profile}</span>
    </span>
  );
  return (
    <span className={`blur-in flex h-10 items-center rounded-full bg-white ring-1 ease-smooth md:pr-1 transition-shadow hover:shadow-md ${low ? 'ring-amber-300' : 'ring-line'}`}>
      <a href="#/piano" title={c.unlimited ? undefined : tr(`${fmt(c.balance)} ${c.balance === 1 ? 'credito' : 'crediti'}`, `${fmt(c.balance)} ${c.balance === 1 ? 'credit' : 'credits'}`)} className={`flex h-full items-center gap-1.5 pl-4 pr-3 text-sm font-semibold ${low ? 'text-amber-700' : ''}`}>
        {/* numero e moneta, senza la parola "crediti" */}
        {c.unlimited ? <><Coins size={15} className="text-ai" /> {tr('Illimitati', 'Unlimited')}</> : <>{fmt(c.balance)} <Coins size={15} className={low ? 'text-amber-500' : 'text-ai'} /></>}{low && <span className="ml-1 text-xs font-medium">· {tr('Ricarica', 'Top up')}</span>}
      </a>
      <span className="mr-1 h-5 w-px bg-line" aria-hidden />
      {profile}
    </span>
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
export default function PlanView({ ok, buy, change }: { ok?: boolean; buy?: Buy; change?: boolean }) {
  const c = useCredits();
  const [yearly, setYearly] = useState(buy === 'pro_yearly');
  const [busy, setBusy] = useState<string>(buy ?? '');
  const [portalError, setPortalError] = useState<string | null>(null);
  const [changingRaw, setChanging] = useState(!!change);
  // "cambia piano" ha senso solo con un piano: chi non ce l'ha (anche arrivando da ?cambia=1) vede i tre piani normali
  const changing = changingRaw && !!c && c.plan !== 'none' && !c.unlimited;
  // Pro: fatturazione in corso (annuale o trimestrale) letta da Stripe, cosi' la card mostra quella che si ha
  const [proLookup, setProLookup] = useState<string | null>(null);
  useEffect(() => {
    if (c?.plan !== 'pro') return;
    authFetch('/api/platform/billing').then(r => r.json()).then((d: { lookup?: string | null }) => {
      if (!d.lookup) return;
      setProLookup(d.lookup);
      if (!buy) setYearly(d.lookup === 'ai_pro_yearly');
    }).catch(() => {});
  }, [c?.plan, buy]);
  const proMine = c?.plan === 'pro' && proLookup === (yearly ? 'ai_pro_yearly' : 'ai_pro_quarterly');
  // arrivando da un invito (?cambia=1): la pagina scorre fino ai piani, una volta sola quando le card ci sono
  const plansRef = useRef<HTMLHeadingElement>(null);
  const scrolled = useRef(false);
  // con un piano il codice promozionale arriva dopo e spinge giu' i piani: si scorre quando c'e' anche lui
  const [codeReady, setCodeReady] = useState(false);
  useEffect(() => {
    if (!change || scrolled.current || !c || !plansRef.current) return;
    if (c.plan !== 'none' || c.unlimited) { if (!codeReady) return; }
    scrolled.current = true;
    setTimeout(() => plansRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }), 150);
  }, [c, change, codeReady]); // con un piano attivo: card dei piani aperte per cambiarlo (?cambia=1: arrivando da un invito a passare di piano, gia' aperte)
  const go = async (p: Buy | PackId) => {
    setBusy(p); setPortalError(null);
    const d = await checkout(p);
    setBusy('');
    if (d?.error === 'payment_failed') setPortalError(tr('Pagamento non riuscito: il piano non è cambiato. Controlla la carta in Gestisci abbonamento.', 'Payment failed: your plan has not changed. Check your card in Manage subscription.'));
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
  // card in evidenza: il piano che si ha (cambio piano), altrimenti il Pro consigliato
  const mine = c && c.plan !== 'none' && !c.unlimited ? c.plan : null;
  const card = (p: 'starter' | 'plus' | 'pro') => `${(mine ?? 'pro') === p ? 'shadow-[0_40px_100px_-40px_rgba(0,0,0,.35)] ring-2 ring-ink' : CARD_SHADOW} relative flex flex-col rounded-[32px] bg-white p-8`;
  const billed = yearly ? tr(`${PRICING.yearly * 12} € fatturati ogni anno`, `€${PRICING.yearly * 12} billed yearly`) : tr(`${PRICING.quarterly * 3} € fatturati ogni 3 mesi`, `€${PRICING.quarterly * 3} billed every 3 months`);
  // stesse card dei prezzi della landing
  return (
    <div className="mx-auto max-w-6xl">
      <h1 className="font-display text-3xl font-bold tracking-tight">{tr('Il tuo piano', 'Your plan')}</h1>
      {/* crediti non ancora letti: la forma della pagina (card del piano e pacchetti), non una pagina vuota */}
      {!c && (
        <div aria-hidden className="animate-pulse">
          <div className="mt-6 h-[124px] rounded-[28px] bg-black/[0.05]" />
          <div className="mt-8 h-4 w-48 rounded-full bg-black/[0.07]" />
          <div className="mt-4 grid gap-4 sm:grid-cols-3">{[0, 1, 2].map(i => <div key={i} className="h-[92px] rounded-[24px] bg-black/[0.05]" />)}</div>
        </div>
      )}
      {ok && <p className="mt-3 flex items-center gap-2 rounded-full bg-green-50 px-4 py-2 text-sm font-medium text-green-700"><Check size={15} /> {tr('Pagamento ricevuto: i crediti arrivano in pochi secondi.', 'Payment received: your credits will arrive in a few seconds.')}</p>}
      {c?.unlimited && <p className="mt-4 text-sm text-muted">{tr('Account amministratore: crediti illimitati, niente da pagare.', 'Admin account: unlimited credits, nothing to pay.')}</p>}
      {c && c.plan !== 'none' && !c.unlimited && (
        <div className={`mt-6 flex flex-wrap items-center justify-between gap-4 rounded-[28px] bg-white p-6 ${CARD_SHADOW}`}>
          <div>
            {/* con un piano attivo non si rivedono le card: cambio piano, disdetta, pagamento e fatture nel portale Stripe */}
            <div className="text-sm text-muted">{tr('Piano', 'Plan')} {c.plan === 'pro' ? 'Pro' : c.plan === 'plus' ? 'Plus' : 'Starter'}</div>
            {portalError && <p className="text-sm text-rose-600">{portalError}</p>}
            <div className="font-display text-3xl font-extrabold tracking-tight">{fmt(c.balance)} {c.balance === 1 ? tr('credito', 'credit') : tr('crediti', 'credits')}</div>
            <div className="text-sm text-muted">{tr(`circa ${photosFor(c.balance)} foto o ${videosFor(c.balance)} video · si ricaricano a ${fmt(c.monthly)} il ${date(c.renews)}`, `about ${photosFor(c.balance)} photos or ${videosFor(c.balance)} videos · back to ${fmt(c.monthly)} on ${date(c.renews)}`)}</div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={() => setChanging(v => !v)} aria-expanded={changing}
            className={`flex h-11 items-center rounded-full px-6 text-sm font-semibold ring-1 ease-smooth transition-colors ${changing ? 'bg-canvas ring-ink' : 'bg-white ring-black/10 hover:ring-ink'}`}>{tr('Cambia piano', 'Change plan')}</button>
          <button type="button" disabled={busy === 'portal'} onClick={async () => { setBusy('portal'); const d = await authFetch('/api/platform/billing', { method: 'POST' }).then(r => r.json()).catch(() => null); if (d?.url) window.location.href = d.url; else { setBusy(''); setPortalError(tr('Portale non disponibile, riprova tra poco.', 'Portal not available, try again shortly.')); } }}
            className="flex h-11 items-center gap-2 rounded-full bg-ink px-6 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand disabled:opacity-60">{busy === 'portal' && <Loader2 size={14} className="animate-spin" />}{tr('Gestisci abbonamento', 'Manage subscription')}</button>
          </div>
        </div>
      )}
      {c && c.plan !== 'none' && !c.unlimited && (
        <>
          <h2 className="mt-8 font-semibold">{tr('Ti servono altri crediti?', 'Need more credits?')}</h2>
          <p className="mt-1 text-sm text-muted">{tr('I pacchetti si aggiungono al saldo e non scadono con il mese. Pagamento singolo.', 'Packs are added to your balance and don’t expire at the end of the month. One-off payment.')}</p>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {PACKS.map(p => (
              <div key={p.id} className={`flex items-center justify-between gap-4 rounded-[24px] bg-white p-5 ${CARD_SHADOW}`}>
                <div>
                  <div className="font-display text-2xl font-extrabold tracking-tight">{fmt(p.credits)} {tr('crediti', 'credits')}</div>
                  <div className="text-sm text-muted">{tr(`${photosFor(p.credits)} foto o ${videosFor(p.credits)} video`, `${photosFor(p.credits)} photos or ${videosFor(p.credits)} videos`)}</div>
                </div>
                <button type="button" disabled={!!busy} onClick={() => go(p.id)} className="flex h-11 shrink-0 items-center justify-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand disabled:opacity-60">{busy === p.id ? <Loader2 size={15} className="animate-spin" /> : null} {eur(p.eur)}</button>
              </div>
            ))}
          </div>
        </>
      )}
      {/* codice: chi ha un piano ne inserisce uno; l'affiliato (anche senza piano) al posto del campo vede il suo */}
      {c && <CodeBox canRedeem={c.plan !== 'none' || !!c.unlimited} onReady={() => setCodeReady(true)} />}
      {/* solo a crediti letti: prima (c null) comparivano e sparivano appena si scopriva il piano attivo */}
      {c && (c.plan === 'none' || c.unlimited || changing) && (<>
      <h2 ref={plansRef} className="mt-8 scroll-mt-28 font-semibold">{changing ? tr('Cambia piano', 'Change plan') : tr('Scegli il piano', 'Choose your plan')}</h2>
      <p className="mt-1 text-sm text-muted">{changing ? tr('Scegli il piano: su Stripe vedi quanto paghi oggi e confermi. Il nuovo piano parte subito e i crediti diventano quelli del nuovo piano.', 'Pick a plan: on Stripe you see what you pay today and confirm. The new plan starts right away with its credits.') : tr('Starter: foto e video. Plus: anche il tuo sito. Pro: più crediti, a trimestre o anno.', 'Starter: photos and videos. Plus: your website too. Pro: more credits, quarterly or yearly.')}</p>
      <div className="mt-5 grid items-stretch gap-5 md:grid-cols-3">
        <div className={card('starter')}>
          <div className="flex h-10 items-center text-sm font-semibold text-muted">Starter</div>
          <div className="mt-3 flex items-end gap-2"><span className="font-display text-6xl font-extrabold tracking-tight">{eur(PRICING.starter)}</span><span className="pb-2 text-muted">{tr('/ mese', '/ month')}</span></div>
          <div className="mt-1 text-sm text-muted">{tr('Mensile, disdici quando vuoi', 'Monthly, cancel anytime')}</div>
          <Credits n={PRICING.starterCredits} en={en} />
          <div className="min-h-8 flex-1" />
          <button type="button" disabled={!!busy || (changing && c?.plan === 'starter')} onClick={() => go('starter')} className="flex h-12 items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold ring-1 ring-black/10 hover:ring-ink disabled:opacity-60">{busy === 'starter' && <Loader2 size={15} className="animate-spin" />}{changing ? (c?.plan === 'starter' ? tr('Il tuo piano', 'Your plan') : tr('Passa a Starter', 'Switch to Starter')) : tr('Scegli Starter', 'Choose Starter')}</button>
        </div>
        <div className={card('plus')}>
          <div className="flex h-10 items-center text-sm font-semibold text-muted">Plus</div>
          <div className="mt-3 flex items-end gap-2"><span className="font-display text-6xl font-extrabold tracking-tight">{eur(PRICING.plus)}</span><span className="pb-2 text-muted">{tr('/ mese', '/ month')}</span></div>
          <div className="mt-1 text-sm text-muted">{tr('Mensile, disdici quando vuoi', 'Monthly, cancel anytime')}</div>
          <Credits n={PRICING.plusCredits} en={en} />
          <SiteIncluded slug={slug} en={en} />
          <div className="min-h-8 flex-1" />
          <button type="button" disabled={!!busy || (changing && c?.plan === 'plus')} onClick={() => go('plus')} className="flex h-12 items-center justify-center gap-2 rounded-full bg-white text-[15px] font-semibold ring-1 ring-black/10 hover:ring-ink disabled:opacity-60">{busy === 'plus' && <Loader2 size={15} className="animate-spin" />}{changing ? (c?.plan === 'plus' ? tr('Il tuo piano', 'Your plan') : tr('Passa a Plus', 'Switch to Plus')) : tr('Scegli Plus', 'Choose Plus')}</button>
        </div>
        <div className={card('pro')}>
          {!mine && <span className="absolute -top-3 left-8 rounded-full bg-ink px-3 py-1 text-xs font-semibold text-white">{tr('Consigliato', 'Recommended')}</span>}
          <div className="flex h-10 items-center justify-between gap-3">
            <div className="text-sm font-semibold text-muted">Pro</div>
            <div className="flex rounded-full bg-canvas p-1">
              {([[false, tr('Trimestrale', 'Quarterly')], [true, tr('Annuale', 'Yearly')]] as const).map(([y, l]) => (
                <button key={l} type="button" onClick={() => setYearly(y)} className={`h-8 rounded-full px-3 text-xs font-semibold ease-smooth transition-colors ${yearly === y ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>{l}</button>
              ))}
            </div>
          </div>
          <div className="mt-3 flex items-end gap-2"><span key={pro} className="blur-in font-display text-6xl font-extrabold tracking-tight">{eur(pro)}</span><span className="pb-2 text-muted">{tr('/ mese', '/ month')}</span></div>
          <div key={billed} className="blur-in mt-1 text-sm text-muted">{billed}</div>
          <Credits n={PRICING.credits} en={en} />
          <SiteIncluded slug={slug} en={en} />
          <div className="min-h-8 flex-1" />
          <button type="button" disabled={!!busy || (changing && proMine)} onClick={() => go(yearly ? 'pro_yearly' : 'pro_quarterly')} className="flex h-12 items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-white disabled:opacity-60">{busy.startsWith('pro') && <Loader2 size={15} className="animate-spin" />}{changing ? (proMine ? tr('Il tuo piano', 'Your plan') : c?.plan === 'pro' ? (yearly ? tr('Passa all\'annuale', 'Switch to yearly') : tr('Passa al trimestrale', 'Switch to quarterly')) : tr('Passa a Pro', 'Switch to Pro')) : tr('Scegli Pro', 'Choose Pro')}</button>
        </div>
      </div>
      <p className="mt-5 text-center text-xs text-muted">{tr('Pagamento sicuro con Stripe. Ti chiediamo ragione sociale, Partita IVA e codice SDI o PEC per la fattura elettronica.', 'Secure payment with Stripe. We ask for your company name and VAT details for the invoice.')}</p>
      </>)}
    </div>
  );
}

// Codice affiliato (lib/affiliates.ts): chi ha un piano lo inserisce e riceve crediti; l'affiliato vede il suo codice
// e quante persone l'hanno usato. Si possono usare piu' codici, ognuno una volta.
function CodeBox({ onReady, canRedeem }: { onReady?: () => void; canRedeem: boolean }) {
  const [info, setInfo] = useState<{ gives: number; mine: { code: string; uses: number; each: number; gives: number } | null } | null>(null);
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => { authFetch('/api/platform/code').then(r => (r.ok ? r.json() : null)).then(setInfo).catch(() => {}).finally(() => onReady?.()); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // la barra del codice c'e' sempre e subito (si possono usare piu' codici); la card dell'affiliato arriva quando si sa
  const send = async () => {
    if (!code.trim() || busy) return;
    setBusy(true); setMsg(null);
    const r = await authFetch('/api/platform/code', { method: 'POST', body: JSON.stringify({ code }) }).catch(() => null);
    const d = await r?.json().catch(() => null) as { ok?: boolean; credits?: number; error?: string } | null;
    setBusy(false);
    if (d?.ok) {
      setMsg({ ok: true, text: tr('Codice applicato: trovi i crediti nel saldo.', 'Code applied: the credits are in your balance.') });
      window.dispatchEvent(new Event('agenteimmo:credits'));
      return setCode('');
    }
    setMsg({ ok: false, text: d?.error === 'used' ? tr('Hai già usato questo codice.', 'You have already used this code.')
      : d?.error === 'own' ? tr('Non puoi usare il tuo codice.', 'You can’t use your own code.')
      : d?.error === 'full' ? tr('Questo codice ha finito gli utilizzi.', 'This code has no uses left.')
      : d?.error === 'plan' ? tr('Il codice vale con un piano attivo.', 'The code works with an active plan.')
      : d?.error === 'invalid' ? tr('Codice non valido. Controlla di averlo scritto giusto.', 'Invalid code. Check you typed it correctly.')
      : tr('Non siamo riusciti ad applicarlo, riprova tra poco.', 'We couldn’t apply it, try again shortly.') });
  };
  return (
    <div className="blur-in mt-8 flex flex-col gap-4">
      {info?.mine && (
        <div className={`blur-in rounded-[28px] bg-white p-6 ${CARD_SHADOW}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-semibold"><Gift size={20} className="text-brand" /> {tr('Il tuo codice affiliato', 'Your affiliate code')}</div>
              <p className="mt-1 text-sm text-muted">{tr(`Condividilo: chi lo inserisce riceve ${fmt(info.mine.gives)} crediti, tu ${fmt(info.mine.each)} per ogni persona.`, `Share it: whoever enters it gets ${fmt(info.mine.gives)} credits, you get ${fmt(info.mine.each)} per person.`)}</p>
              <div className="mt-3 flex flex-wrap gap-2 text-sm">
                <span className="rounded-full bg-canvas px-3 py-1.5"><strong>{info.mine.uses}</strong> {info.mine.uses === 1 ? tr('persona l’ha usato', 'person used it') : tr('persone l’hanno usato', 'people used it')}</span>
                <span className="rounded-full bg-canvas px-3 py-1.5"><strong>{fmt(info.mine.uses * info.mine.each)}</strong> {tr('crediti ricevuti', 'credits received')}</span>
              </div>
            </div>
            <button type="button" onClick={() => { void navigator.clipboard.writeText(info.mine!.code); setCopied(true); setTimeout(() => setCopied(false), 1500); }} aria-label={tr('Copia il codice', 'Copy the code')}
              className="flex h-12 items-center gap-3 rounded-full bg-canvas pl-5 pr-2 ring-1 ring-black/5 ease-smooth transition-colors hover:bg-white hover:ring-brand">
              <span className="font-display text-lg font-extrabold tracking-wide">{info.mine.code}</span>
              <span className={`flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold ease-smooth transition-colors ${copied ? 'bg-green-600 text-white' : 'bg-brand text-white'}`}>{copied ? <><Check size={13} /> {tr('Copiato', 'Copied')}</> : <><Copy size={13} /> {tr('Copia', 'Copy')}</>}</span>
            </button>
          </div>
        </div>
      )}
      {canRedeem && !info?.mine && (
        <div className={`rounded-[28px] bg-white p-6 ${CARD_SHADOW}`}>
          <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-semibold"><Gift size={20} className="text-brand" /> {tr('Codice promozionale', 'Promo code')}</div>
          <div className="flex w-full gap-2 sm:w-auto sm:min-w-[420px]">
            <input value={code} onChange={e => { setCode(e.target.value.slice(0, 40)); setMsg(null); }} onKeyDown={e => e.key === 'Enter' && void send()} placeholder={tr('Es. MARIO-IMMO', 'e.g. MARIO-IMMO')} autoCapitalize="characters" spellCheck={false}
              className="h-11 min-w-0 flex-1 rounded-full bg-canvas px-4 text-sm font-semibold uppercase tracking-wide outline-none ring-1 ring-black/5 placeholder:font-normal placeholder:normal-case placeholder:tracking-normal focus:bg-white focus:ring-2 focus:ring-brand" />
            <button type="button" disabled={busy || !code.trim()} onClick={() => void send()} className="flex h-11 shrink-0 items-center gap-2 rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-40">{busy && <Loader2 size={15} className="animate-spin" />}{tr('Applica', 'Apply')}</button>
          </div>
          </div>
          {msg && <p className={`blur-in mt-3 text-sm ${msg.ok ? 'text-green-700' : 'text-rose-600'}`}>{msg.text}</p>}
        </div>
      )}
    </div>
  );
}

// Crediti finiti: finestra con la scelta del piano (si apre su ogni risposta 402)
export function NoCreditsModal() {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState('');
  const c = useCredits();
  const hasPlan = !!c && c.plan !== 'none' && !c.unlimited;
  // con un piano: dritti alla pagina del piano (pacchetti e piani piu' grandi); senza: la finestra per sceglierne uno
  useEffect(() => {
    const on = () => { if (hasPlan) window.location.hash = '#/piano'; else setOpen(true); };
    window.addEventListener('agenteimmo:no-credits', on);
    return () => window.removeEventListener('agenteimmo:no-credits', on);
  }, [hasPlan]);
  if (!open) return null;
  // senza piano: foto arredata in alto, cosa si sblocca e un solo pulsante verso i piani
  if (!hasPlan) return (
    <div className="blur-in fixed inset-0 z-[260] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div onClick={e => e.stopPropagation()} className="relative w-full max-w-md rounded-[32px] bg-white p-2 shadow-2xl">
        <div className="relative overflow-hidden rounded-[24px]">
          <img src="/immo/home/demo-after.webp" alt="" className="aspect-[16/9] w-full object-cover" />
          <span className="absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1 text-xs font-semibold backdrop-blur"><Sparkles size={12} className="text-brand" /> {tr('Arredata con l’AI', 'Furnished with AI')}</span>
          <button type="button" onClick={() => setOpen(false)} aria-label={tr('Chiudi', 'Close')} className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-ink backdrop-blur hover:bg-white"><X size={16} /></button>
        </div>
        <div className="px-5 pb-5 pt-5">
          <h2 className="font-display text-2xl font-extrabold tracking-tight">{c?.lapsed ? tr('Riattiva il tuo piano', 'Reactivate your plan') : tr('Scegli un piano per iniziare', 'Choose a plan to get started')}</h2>
          <p className="mt-1.5 text-sm text-muted">{c?.lapsed ? tr('Il tuo piano è scaduto. Immobili, foto e sito ti aspettano: riattivi e ritrovi tutto.', 'Your plan has ended. Properties, photos and website are waiting: reactivate and everything is back.') : tr(`Da ${PRICING.starter} € al mese, disdici quando vuoi.`, `From €${PRICING.starter} a month, cancel anytime.`)}</p>
          <ul className="mt-5 space-y-2.5 text-[15px]">
            {[tr('Foto arredate e svuotate in pochi secondi', 'Photos furnished or emptied in seconds'), tr('Video per i social dalle tue foto', 'Social videos from your photos'), tr('Il tuo sito con i tuoi immobili (Plus e Pro)', 'Your website with your properties (Plus and Pro)')].map(t => (
              <li key={t} className="flex items-center gap-3"><span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand/10 text-brand"><Check size={12} strokeWidth={3} /></span>{t}</li>
            ))}
          </ul>
          <a href="#/piano?cambia=1" onClick={() => setOpen(false)} className="mt-6 flex h-12 w-full items-center justify-center rounded-full bg-brand text-[15px] font-semibold text-white ease-smooth transition-colors hover:bg-brand/90">{tr('Vedi i piani', 'See plans')}</a>
          <button type="button" onClick={() => setOpen(false)} className="mt-2 h-10 w-full rounded-full text-sm font-medium text-brand hover:text-brand/70">{tr('Più tardi', 'Later')}</button>
        </div>
      </div>
    </div>
  );
  return (
    <div className="blur-in fixed inset-0 z-[260] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm" onClick={() => setOpen(false)}>
      <div onClick={e => e.stopPropagation()} className="relative w-full max-w-md rounded-[32px] bg-white p-7 text-center shadow-2xl">
        <button type="button" onClick={() => setOpen(false)} aria-label={tr('Chiudi', 'Close')} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-canvas"><X size={16} /></button>
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-ai/10 text-ai"><Sparkles size={20} /></span>
        <h2 className="mt-4 font-display text-2xl font-extrabold tracking-tight">{hasPlan ? tr('Crediti finiti', 'Out of credits') : tr('Ti servono crediti', 'You need credits')}</h2>
        <p className="mt-2 text-sm text-muted">{hasPlan ? tr(`Si ricaricano il ${date(c!.renews)}. Se ti servono prima, un pacchetto si aggiunge subito al saldo e non scade.`, `They top up on ${date(c!.renews)}. Need them sooner? A pack is added to your balance right away and doesn’t expire.`) : tr(`Scegli un piano per arredare le foto, creare video e avere il tuo sito. Da ${PRICING.starter} € al mese.`, `Choose a plan to furnish photos, create videos and get your website. From €${PRICING.starter} a month.`)}</p>
        {hasPlan ? (
          <div className="mt-6 flex flex-col gap-2">
            {PACKS.map(p => <button key={p.id} type="button" disabled={!!busy} onClick={() => { setBusy(p.id); void checkout(p.id).then(() => setBusy('')); }} className="flex h-11 items-center justify-between rounded-full bg-ink px-5 text-sm font-semibold text-white disabled:opacity-60"><span>{fmt(p.credits)} {tr('crediti', 'credits')}</span><span>{busy === p.id ? <Loader2 size={15} className="animate-spin" /> : eur(p.eur)}</span></button>)}
          </div>
        ) : <a href="#/piano?cambia=1" onClick={() => setOpen(false)} className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-ink px-6 text-sm font-semibold text-white">{tr('Vedi i piani', 'See plans')}</a>}
      </div>
    </div>
  );
}

// La prova fatta sulla landing (foto arredata e video): dopo l'accesso si scarica da qui, poi l'onboarding.
// onDone = agente nuovo: il bottone "Conosci Immo e scarica" scarica e poi apre l'onboarding.
export const hasDemo = () => { try { const d = JSON.parse(localStorage.getItem('agenteimmo:demo') ?? 'null'); return !!(d?.photo || d?.video || d?.photoToken || d?.videoToken); } catch { return false; } };
export function DemoDownload({ onDone }: { onDone?: () => void }) {
  // letto una volta al montaggio (solo client: la piattaforma non si renderizza sul server)
  // la landing salva gettoni cifrati (foto e video puliti, senza filigrana): si scambiano con i file ora che si e' dentro
  const [demo, setDemo] = useState<{ photo?: string | null; video?: string | null; photoToken?: string | null; videoToken?: string | null } | null>(() => {
    try { const d = JSON.parse(localStorage.getItem('agenteimmo:demo') ?? 'null'); return d?.photo || d?.video || d?.photoToken || d?.videoToken ? d : null; } catch { return null; }
  });
  useEffect(() => {
    if (!demo || (!demo.photoToken && !demo.videoToken) || demo.photo || demo.video) return;
    authFetch('/api/platform/demo-claim', { method: 'POST', body: JSON.stringify({ photo: demo.photoToken, video: demo.videoToken }) })
      .then(r => (r.ok ? r.json() : null)).then((u: { photo?: string | null; video?: string | null } | null) => { if (u?.photo || u?.video) setDemo(d => d && { ...d, photo: u.photo, video: u.video }); })
      .catch(() => {});
  }, [demo]);
  const [busy, setBusy] = useState(false);
  if (!demo || (!demo.photo && !demo.video)) return null;
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
  const what = demo.photo && demo.video ? tr('foto e video', 'photo and video') : demo.video ? tr('il video', 'the video') : tr('la foto', 'the photo');
  return (
    <div className="blur-in fixed inset-0 z-[250] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm" onClick={busy ? undefined : close}>
      <div onClick={e => e.stopPropagation()} className="relative w-full max-w-lg rounded-[32px] bg-white p-7 text-center shadow-2xl">
        <button type="button" onClick={close} disabled={busy} aria-label={tr('Chiudi', 'Close')} className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-canvas"><X size={16} /></button>
        <h2 className="font-display text-2xl font-extrabold tracking-tight">{tr('La tua prova è pronta', 'Your trial is ready')}</h2>
        <p className="mt-2 text-sm text-muted">{tr('Ecco quello che hai creato sulla nostra pagina. Scaricalo e usalo per il tuo annuncio.', 'Here is what you created on our page. Download it and use it for your listing.')}</p>
        <div className={`mt-5 grid gap-2 ${demo.photo && demo.video ? 'grid-cols-2' : ''}`}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          {demo.photo && <img src={demo.photo} alt={tr('Foto arredata', 'Furnished photo')} className="aspect-[4/3] w-full rounded-[20px] object-cover" />}
          {demo.video && <video src={demo.video} autoPlay muted loop playsInline className="aspect-[4/3] w-full rounded-[20px] bg-canvas object-cover" />}
        </div>
        <button type="button" disabled={busy} onClick={go} className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-full bg-ink px-6 text-[15px] font-semibold text-white disabled:opacity-70">
          {busy && <Loader2 size={16} className="animate-spin" />}{onDone ? tr(`Conosci Immo e scarica ${what}`, `Meet Immo and download ${what}`) : tr(`Scarica ${what}`, `Download ${what}`)}
        </button>
        {!onDone && <p className="mt-5 text-sm text-muted">{tr('Per arredare le tue case, fare video e pubblicare il sito', 'To furnish your properties, make videos and publish your website,')} <a href="#/piano" onClick={close} className="font-medium underline underline-offset-4 text-brand">{tr('scegli un piano', 'choose a plan')}</a>.</p>}
      </div>
    </div>
  );
}
