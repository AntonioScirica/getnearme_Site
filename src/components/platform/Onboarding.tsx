'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowRight, Check, Globe, Loader2, X, Plus, Wand2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch, portfolioPrefix, CARD_SHADOW } from './api';
import { slugify, useSlugCheck, type Profile } from './ProfileForm';

// Onboarding: l'AI "costruisce" il sito dell'agente davanti ai suoi occhi.
// 0 logo al centro, poi sale e saluta > 1 solo il campo nome > 2 compare il finto sito col nome, lo slug si scrive da solo
// nella barra indirizzi e si puo' correggere > 3 la home vera con le sue card: un click ovunque salva ed entra.
type Step = 0 | 1 | 2 | 3;

const TITLES: Record<Step, [string, string]> = {
  0: ['Ciao, mi chiamo Immo.', 'Conosciamoci meglio.'],
  1: ['Come ti chiami?', 'Il nome che vedranno i tuoi clienti.'],
  2: ['Il tuo sito ha bisogno di un link.', 'Lo mandi ai clienti e ci trovano tutti i tuoi immobili.'],
  3: ['Il tuo sito è pronto da pubblicare.', 'Lo metti online tu, quando vuoi. Intanto ecco cosa puoi fare.'],
};

// sfondo a puntini + curva ease-in-out per tutto l'onboarding (sovrascrive --gnm-ease del sito qui dentro)
const DOTS_BG = { background: 'radial-gradient(rgba(0,0,0,0.09) 1.2px, transparent 1.2px) 0 0 / 18px 18px, #fff', '--gnm-ease': 'cubic-bezier(.65, 0, .35, 1)' } as React.CSSProperties;
// ultimo passo: le tre card della home, ferme (scheletro + testo, non sembrano bottoni)
const TOOLS = [
  { kicker: 'Hai già un annuncio online?', title: 'Miglioralo', img: '/immo/home/demo-1.webp', badge: null },
  { kicker: 'Hai preso un immobile nuovo?', title: 'Mettilo in vetrina', img: '/immo/home/fan-2.webp', badge: Plus },
  { kicker: 'Hai una stanza vuota?', title: 'Home staging', img: '/immo/home/staging-after.webp', badge: Wand2 },
];
const LISTINGS = [['/immo/home/demo-1.webp', '245.000'], ['/immo/home/demo-2.webp', '189.000'], ['/immo/home/demo-3.webp', '320.000']];

export default function Onboarding({ onDone }: { onDone: (p: Profile) => void }) {
  const [step, setStep] = useState<Step>(0);
  const [hello, setHello] = useState(false); // prima solo il logo al centro, poi sale e parla
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [slugTouched, setSlugTouched] = useState(false);
  // passo 2: lo slug si scrive lettera per lettera nella barra indirizzi, poi si puo' correggere
  const [bar, setBar] = useState(false);
  const [typed, setTyped] = useState(0);
  const done = bar && typed >= slug.length;
  useEffect(() => {
    if (!bar || typed >= slug.length) return;
    const t = setTimeout(() => setTyped(typed + 1), 70);
    return () => clearTimeout(t);
  }, [bar, typed, slug.length]);
  const [check, setResult] = useSlugCheck(slug, null);
  // Sequenza del cambio passo: 1) testo e contenuto vecchi sfumano (450 ms) 2) il box si adatta a larghezza e altezza
  // del contenuto nuovo, invisibile (700 ms) 3) il contenuto nuovo entra, card una alla volta, poi la CTA.
  const [shown, setShown] = useState<Step>(0);
  const [settled, setSettled] = useState(true);
  useEffect(() => {
    if (shown === step) return;
    const t = setTimeout(() => { setShown(step); setSettled(false); }, shown >= 2 ? 450 : 0);
    return () => clearTimeout(t);
  }, [step, shown]);
  useEffect(() => {
    if (settled) return;
    const t = setTimeout(() => setSettled(true), 700);
    return () => clearTimeout(t);
  }, [settled]);
  // altezza del box = altezza del contenuto, cosi' la transizione e' sull'altezza vera
  const boxRef = useRef<HTMLDivElement>(null);
  const [boxH, setBoxH] = useState<number>();
  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBoxH(el.offsetHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Saluto breve, poi il nome (precompilato da Google se c'e').
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const m = data.user?.user_metadata as Record<string, string> | undefined;
      const n = m?.full_name || m?.name;
      if (n) { setName(n); setSlug(slugify(n)); }
    });
    const a = setTimeout(() => setHello(true), 1600);
    const b = setTimeout(() => setStep(1), 4000);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, []);

  const onName = (v: string) => { setName(v); if (!slugTouched) setSlug(slugify(v)); };
  const nameOk = name.trim().length >= 2;
  const next = () => {
    if (step === 1 && nameOk) { if (!slug) setSlug(slugify(name)); setTyped(0); setBar(false); setStep(2); setTimeout(() => setBar(true), 900); }
    else if (step === 2 && done && check.state === 'ok') setStep(3);
  };

  const save = async () => {
    if (saving) return;
    setSaving(true); setError(null);
    const res = await authFetch('/api/platform/portfolio', { method: 'PUT', body: JSON.stringify({ name: name.trim(), slug }) });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) return onDone({ name: d.name, slug: d.slug });
    if (d.error === 'slug_taken') { setResult({ slug, state: 'taken', suggestion: d.suggestion }); setStep(2); }
    else setError('Salvataggio non riuscito, riprova.');
  };

  const [head, sub] = TITLES[shown];
  const words = head.split(' ');
  const ctaOff = !done || check.state !== 'ok';

  return (
    <div className="flex h-full flex-col items-center justify-center overflow-y-auto px-6 py-10 font-body text-ink" style={DOTS_BG}>
      {/* l'AI che parla: icona + titolo che si riscrive a ogni passo */}
      <img src="/immo/logo-mark.png" alt="" className="fade h-14 w-14" style={{ viewTransitionName: 'ob-logo' }} />
      {/* il titolo apre spazio sotto il logo: il logo sale mentre compaiono le parole */}
      <div className={`grid w-full transition-[grid-template-rows,opacity] duration-[900ms] ease-smooth ${hello ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className="min-h-0 overflow-hidden">
          {hello && (
            <h1 key={shown} className={`mt-6 transition-[opacity,filter] duration-[450ms] ease-smooth text-center font-display text-3xl font-bold leading-[1.2] tracking-tight md:text-4xl ${shown !== step ? 'opacity-0 blur-[6px]' : ''}`}>
              {words.map((w, i) => <span key={i} className={`ai-word ${w.startsWith('Immo') ? 'text-brand' : ''}`} style={{ animationDelay: `${i * 0.1}s` }}>{w}&nbsp;</span>)}
              <span className="blur-in block text-muted/70" style={{ animationDelay: `${Math.max(0.1, words.length * 0.1 - 0.3)}s` }}>{sub}</span>
            </h1>
          )}
        </div>
      </div>

      {/* passo 1: solo il nome, niente altro intorno */}
      <div inert={step !== 1} className={`grid w-full max-w-md transition-[grid-template-rows,opacity] duration-[900ms] ease-smooth ${step === 1 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className={`-mx-8 min-h-0 overflow-hidden px-8 transition-[padding] duration-[900ms] ease-smooth ${step === 1 ? 'pb-8' : 'pb-0'}`}>
          <div className={`mt-8 flex items-center rounded-full bg-white p-1.5 pl-6 ${CARD_SHADOW}`}>
            <input autoFocus={step === 1} value={name} onChange={e => onName(e.target.value)} onKeyDown={e => e.key === 'Enter' && next()} maxLength={80} placeholder="Mario Rossi"
              className="min-w-0 flex-1 bg-transparent font-display text-xl font-bold tracking-tight outline-none placeholder:text-muted/40" />
            <button type="button" disabled={!nameOk} onClick={next} className="btn-ink flex h-11 items-center gap-2 rounded-full px-5 text-sm font-semibold">Continua <ArrowRight size={15} /></button>
          </div>
        </div>
      </div>

      {/* passi 2 e 3: UN solo contenitore. Il contenuto vecchio sfuma, il box si adatta (altezza e larghezza), entra il nuovo */}
      <div inert={step < 2} className={`grid w-full transition-[grid-template-rows,opacity,max-width] duration-[900ms] ease-smooth ${shown === 3 ? 'max-w-3xl' : 'max-w-2xl'} ${step >= 2 ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
        <div className={`-mx-8 min-h-0 overflow-hidden px-8 transition-[padding] duration-[900ms] ease-smooth ${step >= 2 ? 'pb-8' : 'pb-0'}`}>
          <div className={`mt-8 overflow-hidden rounded-[28px] bg-white transition-[height] duration-[900ms] ease-smooth ${CARD_SHADOW}`} style={{ height: boxH }}>
            <div ref={boxRef} className={`p-2 transition-[opacity,filter] duration-[450ms] ease-smooth ${shown !== step || !settled ? 'opacity-0 blur-[6px]' : ''}`}>
              {shown === 3 ? (
            <div className="grid gap-2 sm:grid-cols-3">
              {TOOLS.map(({ kicker, title, img, badge: Badge }, i) => (
                <div key={title} className={`flex flex-col rounded-[20px] bg-canvas p-5 ${settled ? 'rise' : 'opacity-0'}`} style={{ viewTransitionName: `ob-card-${i}`, animationDelay: `${i * 0.12}s` }}>
                  <span className="text-xs text-muted">{kicker}</span>
                  <span className="mt-1 text-lg font-bold leading-tight tracking-tight">{title}</span>
                  <div className="relative mt-4">
                    <img src={img} alt="" className="aspect-[4/3] w-full rounded-xl object-cover" />
                    {Badge && <span className="absolute -bottom-2 -right-2 flex h-8 w-8 items-center justify-center rounded-full bg-ink text-white shadow-md"><Badge size={14} /></span>}
                  </div>
                  <span className="mt-4 block h-2 w-4/5 rounded-full bg-white" />
                  <span className="mt-1.5 block h-2 w-3/5 rounded-full bg-white" />
                </div>
              ))}
            </div>
              ) : (
                <>
            <div className="overflow-hidden rounded-[20px] ring-1 ring-black/5">
              {/* barra indirizzi: lo slug si scrive da solo, poi e' un campo */}
              <div>
                <div>
                  <div className="flex h-12 items-center gap-3 bg-canvas px-4">
                    <span className="flex gap-1.5">{['#ff5f57', '#febc2e', '#28c840'].map(c => <i key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />)}</span>
                    <div className={`flex h-8 flex-1 items-center rounded-full bg-white px-3 text-[13px] ring-1 transition-[box-shadow] ease-smooth ${bar ? 'ring-brand' : 'ring-black/5'}`}>
                      <Globe size={13} className="mr-2 shrink-0 text-brand" />
                      <span className="shrink-0 text-muted">{portfolioPrefix()}</span>
                                            {bar && !done && <span className="min-w-0 truncate font-medium">{slug.slice(0, typed)}<span className="animate-pulse">|</span></span>}
                      {done && <input autoFocus value={slug} onChange={e => { setSlugTouched(true); const v = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40); setSlug(v); setTyped(v.length); }}
                        onKeyDown={e => e.key === 'Enter' && next()} placeholder="mario-rossi" className="min-w-0 flex-1 bg-transparent font-medium outline-none" />}
                      {done && <span className="ml-2 shrink-0">
                        {check.state === 'checking' && <Loader2 size={14} className="animate-spin text-muted" />}
                        {check.state === 'ok' && <Check size={14} className="text-green-600" />}
                        {(check.state === 'taken' || check.state === 'invalid' || check.state === 'bad') && <X size={14} className="text-red-600" />}
                      </span>}
                    </div>
                  </div>
                </div>
              </div>
              {/* pagina: intestazione col nome + card immobili (scheletro, non bottoni) */}
              <div className="bg-white p-6">
                <div className="flex items-center justify-between gap-4">
                  <span className="truncate font-display text-2xl font-bold tracking-tight">{name.trim()}</span>
                  <nav className="hidden shrink-0 gap-4 text-sm text-muted sm:flex">{['Immobili', 'Servizi', 'Contatti'].map(l => <span key={l}>{l}</span>)}</nav>
                </div>
                <div className="mt-5 grid grid-cols-3 gap-3">
                  {LISTINGS.map(([src, price]) => (
                    <div key={src} className="overflow-hidden rounded-xl ring-1 ring-black/5">
                      <img src={src} alt="" className="aspect-[4/3] w-full object-cover" />
                      <div className="p-3">
                        <span className="block text-sm font-bold">€ {price}</span>
                        <span className="mt-2 block h-2 w-4/5 rounded-full bg-canvas" />
                        <span className="mt-1.5 block h-2 w-3/5 rounded-full bg-canvas" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* piede: aiuto + avanti */}
            <div className="flex min-h-12 items-center justify-between gap-3 px-4 pb-2 pt-3">
              <span className="text-sm text-red-600">
                {error}
                {done && check.state === 'taken' && <>Già in uso.{check.suggestion && <> Prova <button type="button" className="font-medium underline" onClick={() => { setSlugTouched(true); setSlug(check.suggestion!); }}>{check.suggestion}</button></>}</>}
                {done && check.state === 'invalid' && 'Da 3 a 40 caratteri: lettere minuscole, numeri e trattini.'}
                {done && check.state === 'bad' && 'Questo indirizzo contiene una parola che non possiamo usare.'}
              </span>
              <span className="flex items-center gap-2">
                {step === 2 && <button type="button" onClick={() => setStep(1)} className="h-10 rounded-full px-4 text-sm font-medium text-muted hover:bg-canvas">Indietro</button>}
                <button type="button" disabled={ctaOff} onClick={next} className="btn-ink flex h-10 items-center gap-2 rounded-full px-5 text-sm font-semibold">Continua <ArrowRight size={15} /></button>
              </span>
            </div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* CTA finale: lo spazio si apre col box, il bottone entra a scatto elastico (pop) dopo le card */}
      <div inert={step !== 3} className={`grid transition-[grid-template-rows] duration-[900ms] ease-smooth ${step === 3 ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'}`}>
        <div className="-mx-8 min-h-0 overflow-hidden px-8 pb-8">
          <div className="mt-6 flex flex-col items-center gap-2">
            <button type="button" disabled={saving} onClick={save} className={`btn-ink flex h-11 items-center gap-2 rounded-full px-6 text-sm font-semibold ${shown === 3 && settled ? 'pop' : 'scale-0 opacity-0'}`} style={{ animationDelay: '.45s' }}>
              {saving ? <Loader2 size={15} className="animate-spin" /> : null} Inizia <ArrowRight size={15} />
            </button>
            {error && <span className="text-sm text-red-600">{error}</span>}
          </div>
        </div>
      </div>
    </div>
  );
}
