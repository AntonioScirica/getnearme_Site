'use client';

import { useEffect, useLayoutEffect, useState } from 'react';
import { ArrowRight } from 'lucide-react';

// Tour dopo l'onboarding: velo scuro con una luce (riquadro illuminato) che passa sulle voci della piattaforma,
// una card breve per ognuna, poi si torna alla home. Intanto dietro il velo si apre la pagina di cui parla (go),
// cosi' la si vede. Si accende con localStorage 'agenteimmo:tour' = '1' (lo mette l'onboarding) o aprendo #/tour;
// si spegne a fine giro o con Salta.
// demo: Immobili mostra solo le case d'esempio. edit: chiede al Il mio sito di aprire l'editor del modello (evento 'agenteimmo:tour-edit'), per mostrare che si modifica
const STEPS: { target: string; go: string; title: string; text: string; edit?: boolean; demo?: boolean }[] = [
  { target: '/', go: '/', title: 'Home', text: 'Il tuo punto di partenza: metti in vetrina un immobile, arreda una stanza, crea un video.' },
  { target: '/immobili', go: '/immobili', demo: true, title: 'Immobili', text: 'Tutte le tue case in un posto, con foto, descrizione e report da mandare ai clienti.' },
  { target: '/portfolio', go: '/portfolio', title: 'Il mio sito', text: 'Scegli un template, modificalo e pubblica il tuo sito in 5 minuti.' },
  { target: 'site-gallery', go: '/portfolio', title: 'Scegli il modello', text: 'Dieci stili già pronti, già pieni dei tuoi immobili. Ne scegli uno.' },
  { target: 'site-editor', go: '/portfolio', edit: true, title: 'Modifica tutto', text: 'Testi, foto, colori, caratteri e logo: tocchi un punto del sito e lo cambi, vedi subito come viene.' },
  { target: 'site-link', go: '/portfolio', edit: true, title: 'Pubblica con il tuo link', text: 'Quando sei pronto lo accendi: il sito va online al tuo indirizzo, da mandare ai clienti.' },
  { target: '/galleria', go: '/galleria', demo: true, title: 'Galleria', text: 'Le foto arredate e i video che hai creato, pronti da scaricare e pubblicare.' },
  { target: 'crediti', go: '/', title: 'I tuoi crediti', text: 'Ogni foto e video usa dei crediti: qui vedi quanti te ne restano e scegli il piano.' },
  { target: 'nuovo', go: '/', title: 'Metti in vetrina', text: 'Hai preso un incarico? Parti da qui: carichi le foto e la casa è pronta per portale, social e sito.' },
  { target: 'profilo', go: '/', title: 'Il tuo profilo', text: 'Nome, indirizzo del sito e account. Buon lavoro!' },
];
export const TOUR_KEY = 'agenteimmo:tour';

export default function Tour({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0);
  const [box, setBox] = useState<DOMRect | null>(null);
  const step = STEPS[i];
  // apre la pagina del passo; la pagina carica per conto suo, quindi la voce si rimisura finche' il passo resta
  // (se non si vede, es. menu nascosto su telefono: solo la card al centro)
  useLayoutEffect(() => {
    if (location.hash !== `#${step.go}`) location.hash = `#${step.go}`;
    let seen = false;
    const measure = () => {
      if (step.edit) window.dispatchEvent(new Event('agenteimmo:tour-edit'));
      if (step.demo) window.dispatchEvent(new Event('agenteimmo:tour-demo'));
      const el = document.querySelector<HTMLElement>(`[data-tour="${step.target}"]`);
      // scorrimento immediato: la luce fa un solo movimento invece di inseguire lo scorrimento
      if (el && !seen) { seen = true; el.scrollIntoView({ block: el.offsetHeight > window.innerHeight * 0.6 ? 'start' : 'center', behavior: 'instant' }); }
      const r = el?.getBoundingClientRect();
      setBox(b => (r && r.width ? (b && b.top === r.top && b.left === r.left && b.width === r.width && b.height === r.height ? b : r) : null));
    };
    // a ogni fotogramma: la luce segue la pagina che si carica o si sposta senza scatti (setBox ignora i valori uguali)
    let raf = 0;
    const loop = () => { measure(); raf = requestAnimationFrame(loop); };
    loop();
    return () => cancelAnimationFrame(raf);
  }, [step]);
  const finish = () => { localStorage.removeItem(TOUR_KEY); if (location.hash !== '#/') location.hash = '#/'; onDone(); };
  const next = () => (i < STEPS.length - 1 ? setI(i + 1) : finish());
  useEffect(() => {
    const key = (e: KeyboardEvent) => { if (e.key === 'Escape') finish(); if (e.key === 'ArrowRight' || e.key === 'Enter') next(); };
    window.addEventListener('keydown', key);
    return () => window.removeEventListener('keydown', key);
  });
  const pad = 8;
  // luce tenuta dentro lo schermo (le sezioni grandi, come l'editor del sito, sono piu' alte della finestra)
  const light = box && (() => { const top = Math.max(8, box.top - pad), bottom = Math.min(window.innerHeight - 8, box.bottom + pad); return { top, left: box.left - pad, width: box.width + pad * 2, height: Math.max(0, bottom - top) }; })();
  // card sotto la luce se c'e' spazio, altrimenti sopra, altrimenti in basso sopra la luce; sempre dentro lo schermo
  const cardW = Math.min(340, window.innerWidth - 32);
  const below = !light || light.top + light.height + 220 < window.innerHeight;
  const above = light && light.top > 220;
  const cardStyle: React.CSSProperties = light
    ? { width: cardW, left: Math.max(16, Math.min(window.innerWidth - cardW - 16, light.left + light.width / 2 - cardW / 2)), ...(below ? { top: light.top + light.height + 14 } : above ? { bottom: window.innerHeight - light.top + 14 } : { bottom: 24 }) }
    : { width: cardW, left: '50%', top: '50%', transform: 'translate(-50%, -50%)' };
  const ease = 'all 600ms cubic-bezier(.22,1,.36,1)';
  return (
    <div className="fixed inset-0 z-[310]" role="dialog" aria-label="Tour della piattaforma">
      {/* la luce: un riquadro trasparente con un'ombra enorme che scurisce tutto il resto */}
      {light
        ? <div className="pointer-events-none absolute" style={{ ...light, borderRadius: Math.min(28, light.height / 2), boxShadow: '0 0 0 9999px rgba(15,17,25,.62), 0 0 0 3px rgba(255,255,255,.9), 0 0 40px 6px rgba(83,126,236,.55)', transition: ease }} />
        : <div className="absolute inset-0 bg-[rgba(15,17,25,.62)]" />}
      <div className="absolute inset-0" onClick={next} />
      {/* la card entra quando la luce e' quasi arrivata: prima la luce si sposta, poi compare il testo */}
      <div key={i} className="blur-in absolute rounded-[24px] bg-white p-5 shadow-2xl" style={{ ...cardStyle, transition: ease, animationDelay: i ? '.35s' : '0s' }}>
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
