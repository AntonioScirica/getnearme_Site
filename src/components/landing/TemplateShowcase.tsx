'use client';

import { memo, useEffect, useRef, useState } from 'react';
import { Globe } from 'lucide-react';
import { SiteThumb } from '@/components/site/pages';
import { defaultSite, TEMPLATES, withPlaceholders, type SiteProperty } from '@/lib/siteTemplates';
import { FAKE_PROPERTIES } from '@/lib/fakeProperties';

// Landing, sezione "Il tuo sito": i modelli veri della piattaforma (stesse pagine del sito pubblico) dentro una
// finestra browser, uno dopo l'altro. Case di esempio con le nostre foto (non quelle dei portali).
const COVERS = ['demo-1', 'demo-2', 'demo-3', 'demo-4', 'fan-1', 'fan-2', 'fan-3', 'staging-after', 'demo-after', 'card'].map(n => `/immo/home/${n}.webp`);
const PROPS: SiteProperty[] = FAKE_PROPERTIES.map((p, i) => ({ id: p.id, titolo: p.titolo, addr: p.addr, prezzo: p.prezzo, mq: p.mq, camere: p.camere, bagni: p.bagni, tipologia: p.tipologia, cover: COVERS[i % COVERS.length], photos: [COVERS[i % COVERS.length]] }));
const BASE = defaultSite('Studio Rossi');
// un agente diverso per modello: nome nel sito e nell'indirizzo
const AGENTS = ['Giulia Ferri', 'Marco Conti', 'Sara Galli', 'Luca Moretti', 'Elena Riva', 'Davide Serra', 'Chiara Longo', 'Paolo Greco', 'Marta Villa', 'Andrea Fabbri'];
const slug = (n: string) => n.toLowerCase().replace(/[^a-z]/g, '');

// Mazzo di finestre: davanti il modello attivo, dietro i prossimi (scalati in alto a destra, piu' piccoli). Ogni 3,5 s quella
// davanti esce a sinistra e sparisce, le altre avanzano di un posto. Le 10 finestre si montano una volta sola
// (chiave fissa, memo): montarne una nuova a ogni giro bloccava la pagina ~1 s e il movimento andava a scatti.
const N = TEMPLATES.length;
const DEPTH = 3; // finestre visibili dietro quella davanti

// solo il sito e' pesante: memo su modello e scala, cosi' spostare le finestre non lo ridisegna
const Site = memo(function Site({ id, k }: { id: (typeof TEMPLATES)[number]['id']; k: number }) {
  const t = TEMPLATES.find(x => x.id === id)!;
  const name = AGENTS[TEMPLATES.indexOf(t) % AGENTS.length];
  const cfg = withPlaceholders({ ...BASE, template: t.id, primary: t.primary, font: t.font });
  return (
    <div className="pointer-events-none relative aspect-[4/3] select-none overflow-hidden" aria-hidden>
      <div style={{ width: 1280, transform: `scale(${k})`, transformOrigin: 'top left' }}>
        <SiteThumb ctx={{ cfg, name, logo: null, properties: PROPS, base: '', preview: true }} />
      </div>
    </div>
  );
});

function Window({ id, k, front, label }: { id: (typeof TEMPLATES)[number]['id']; k: number; front: boolean; label: string }) {
  return (
    <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,.35)] ring-1 ring-black/5">
      <Bar name={front ? TEMPLATES.find(x => x.id === id)!.name : ''} agent={AGENTS[TEMPLATES.findIndex(x => x.id === id) % AGENTS.length]} label={label} />
      <Site id={id} k={k} />
    </div>
  );
}

function Bar({ name, agent = AGENTS[0], label = 'Modello' }: { name: string; agent?: string; label?: string }) {
  return (
    <div className="flex h-12 items-center gap-2 border-b border-line bg-canvas px-4">
      <span className="flex gap-1.5">{['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />)}</span>
      <span className="mx-auto flex h-7 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-medium text-muted ring-1 ring-black/5"><Globe size={11} className="text-brand" /><span>agenteimmo.me/<span className="text-ink">{slug(agent)}</span></span></span>
      <span key={name} className={`rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-muted ring-1 ring-black/5 ${name ? 'blur-in' : 'opacity-0'}`}>{label}: {name || '-'}</span>
    </div>
  );
}

export default function TemplateShowcase({ active, en = false }: { active: boolean; en?: boolean }) {
  const [i, setI] = useState(0);
  const sizer = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.4);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setI(v => v + 1), 3500);
    return () => clearInterval(id);
  }, [active]);
  useEffect(() => {
    const ro = new ResizeObserver(() => sizer.current && setK(sizer.current.clientWidth / 1280));
    if (sizer.current) ro.observe(sizer.current);
    return () => ro.disconnect();
  }, []);
  // posizione -1 = quella appena uscita (a sinistra, invisibile), 0 = davanti, 1..DEPTH-1 dietro, DEPTH e oltre = in fondo, invisibile
  const cards = TEMPLATES.map((t, idx) => { const rel = (((idx - i) % N) + N) % N; return { id: t.id, p: rel === N - 1 ? -1 : Math.min(rel, DEPTH) }; });
  return (
    <div className="relative pr-[72px] pt-16">
      {/* dà l'altezza al mazzo */}
      <div ref={sizer} className="invisible"><Bar name="" /><div className="aspect-[4/3]" /></div>
      {cards.map(({ p, id }) => {
        const style = p < 0
          ? { transform: 'translate(-64px, 24px) scale(1.02)', opacity: 0, zIndex: 20 }
          : { transform: `translate(${p * 36}px, ${-p * 32}px) scale(${1 - p * 0.05})`, opacity: p >= DEPTH ? 0 : 1 - p * 0.15, zIndex: 10 - p };
        return (
          <div key={id} className="absolute bottom-0 left-0 right-[72px] origin-top-right" style={{ ...style, transition: 'transform 1s cubic-bezier(.65,0,.35,1), opacity 1s cubic-bezier(.65,0,.35,1)' }}>
            <Window id={id} k={k} front={p === 0} label={en ? 'Template' : 'Modello'} />
          </div>
        );
      })}
    </div>
  );
}
