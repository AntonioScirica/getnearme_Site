'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

// Tour dopo l'onboarding: velo scuro con una luce (riquadro illuminato) che passa sulle voci della piattaforma,
// una card breve per ognuna, poi si torna alla home. Si accende con localStorage 'agenteimmo:tour' = '1'
// (lo mette l'onboarding) o aprendo #/tour; si spegne a fine giro o con Salta.
const STEPS: { target: string; title: string; text: string }[] = [
  { target: '/', title: 'Home', text: 'Il tuo punto di partenza: metti in vetrina un immobile, arreda una stanza, crea un video.' },
  { target: '/immobili', title: 'Immobili', text: 'Tutte le tue case in un posto, con foto, descrizione e report da mandare ai clienti.' },
  { target: '/portfolio', title: 'Il mio sito', text: 'Scegli il modello, mettici logo e colori e accendilo quando sei pronto. Gli immobili ci finiscono da soli.' },
  { target: '/galleria', title: 'Galleria', text: 'Le foto arredate e i video che hai creato, pronti da scaricare e pubblicare.' },
  { target: 'crediti', title: 'I tuoi crediti', text: 'Ogni foto e video usa dei crediti: qui vedi quanti te ne restano e scegli il piano.' },
  { target: 'nuovo', title: 'Metti in vetrina', text: 'Hai preso un incarico? Parti da qui: carichi le foto e la casa è pronta per portale, social e sito.' },
  { target: 'profilo', title: 'Il tuo profilo', text: 'Nome, indirizzo del sito e account. Buon lavoro!' },
];
export const TOUR_KEY = 'agenteimmo:tour';

export default function Tour({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const [box, setBox] = useState<DOMRect | null>(null);
  const step = STEPS[i];
  // posizione della voce illuminata (se non si vede, es. menu nascosto su telefono: solo la card al centro)
  useLayoutEffect(() => {
    const measure = () => {
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      const r = el?.getBoundingClientRect();
      setBox(r && r.width ? r : null);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, [step.target]);
  const finish = () => { localStorage.removeItem(TOUR_KEY); if (location.hash !== '#/') location.hash = '#/'; onDone(); };
  const next = () => (i < STEPS.length - 1 ? setI(i + 1) : finish());
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') finish(); if (e.key === 'ArrowRight' || e.key === 'Enter') next(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  const pad = 8;
  const light = box && { top: box.top - pad, left: box.left - pad, width: box.width + pad * 2, height: box.height + pad * 2 };
  // card sotto la luce se c'e' spazio, altrimenti sopra; sempre dentro lo schermo
  const cardW = Math.min(340, window.innerWidth - 32);
  const below = !light || light.top + light.height + 220 < window.innerHeight;
  const cardStyle: React.CSSProperties = light
    ? { width: cardW, left: Math.max(16, Math.min(window.innerWidth - cardW - 16, light.left + light.width / 2 - cardW / 2)), ...(below ? { top: light.top + light.height + 14 } : { bottom: window.innerHeight - light.top + 14 }) }
    : { width: cardW, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
  const ease = 'all 600ms cubic-bezier(.65,0,.35,1)';
  return (
    <div className="fixed inset-0 z-[270]" role="dialog" aria-label="Tour della piattaforma">
      {/* la luce: un riquadro trasparente con un'ombra enorme che scurisce tutto il resto */}
      {light
        ? <div className="pointer-events-none absolute rounded-full" style={{ ...light, boxShadow: '0 0 0 9999px rgba(15,17,25,.62), 0 0 0 3px rgba(255,255,255,.9), 0 0 40px 6px rgba(83,126,236,.55)', transition: ease }} />
        : <div className="absolute inset-0 bg-[rgba(15,17,25,.62)]" />}
      <div className="absolute inset-0" onClick={next} />
      <div key={i} className="blur-in absolute rounded-[24px] bg-white p-5 shadow-2xl" style={{ ...cardStyle, transition: ease }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-muted">{i + 1} di {STEPS.length}</span>
          <button type="button" onClick={finish} className="text-xs font-medium text-muted hover:text-ink">Salta</button>
        </div>
        <div className="mt-2 font-display text-lg font-bold tracking-tight">{step.title}</div>
        <p className="mt-1 text-sm leading-relaxed text-muted">{step.text}</p>
        <div className="mt-4 flex items-center justify-between">
          <span className="flex gap-1">{STEPS.map((_, k) => <span key={k} className={`h-1.5 rounded-full ease-smooth transition-all ${k === i ? 'w-5 bg-ink' : 'w-1.5 bg-line'}`} />)}</span>
          <button type="button" onClick={next} className="inline-flex h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-white">{i < STEPS.length - 1 ? 'Avanti' : 'Inizia'} <ArrowRight size={15} /></button>
        </div>
      </div>
    </div>
  );
}
