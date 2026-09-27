'use client';

import { useEffect, useRef, useState } from 'react';
import { Globe } from 'lucide-react';
import { SiteThumb } from '@/components/site/pages';
import { defaultSite, TEMPLATES, withPlaceholders, type SiteProperty } from '@/lib/siteTemplates';
import { FAKE_PROPERTIES } from '@/lib/fakeProperties';

// Landing, sezione "Il tuo sito": i modelli veri della piattaforma (stesse pagine del sito pubblico) dentro una
// finestra browser, uno dopo l'altro. Case di esempio con le nostre foto (non quelle dei portali).
const COVERS = ['demo-1', 'demo-2', 'demo-3', 'demo-4', 'fan-1', 'fan-2', 'fan-3', 'staging-after', 'demo-after', 'card'].map(n => `/immo/home/${n}.webp`);
const PROPS: SiteProperty[] = FAKE_PROPERTIES.map((p, i) => ({ id: p.id, titolo: p.titolo, addr: p.addr, prezzo: p.prezzo, mq: p.mq, camere: p.camere, bagni: p.bagni, tipologia: p.tipologia, cover: COVERS[i % COVERS.length], photos: [COVERS[i % COVERS.length]] }));
const BASE = defaultSite('Studio Rossi');

// Mazzo di finestre: davanti il modello attivo, dietro i prossimi (piu' in alto, piu' piccoli). Ogni 3,5 s quella
// davanti scende e sparisce, le altre avanzano di un posto. Si disegnano solo le 5 vicine (i modelli sono pesanti).
const N = TEMPLATES.length;
const DEPTH = 3; // finestre visibili dietro quella davanti

function Window({ id, k, front }: { id: (typeof TEMPLATES)[number]['id']; k: number; front: boolean }) {
  const t = TEMPLATES.find(x => x.id === id)!;
  const cfg = withPlaceholders({ ...BASE, template: t.id, primary: t.primary, font: t.font });
  return (
    <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,.35)] ring-1 ring-black/5">
      <Bar name={front ? t.name : ''} />
      <div className="pointer-events-none relative aspect-[4/3] select-none overflow-hidden" aria-hidden>
        <div style={{ width: 1280, transform: `scale(${k})`, transformOrigin: 'top left' }}>
          <SiteThumb ctx={{ cfg, name: 'Studio Rossi', logo: null, properties: PROPS, base: '', preview: true }} />
        </div>
      </div>
    </div>
  );
}

function Bar({ name }: { name: string }) {
  return (
    <div className="flex h-12 items-center gap-2 border-b border-line bg-canvas px-4">
      <span className="flex gap-1.5">{['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />)}</span>
      <span className="mx-auto flex h-7 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-medium text-muted ring-1 ring-black/5"><Globe size={11} className="text-brand" /> agenteimmo.me/<span className="text-ink">tuonome</span></span>
      <span key={name} className={`rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-muted ring-1 ring-black/5 ${name ? 'blur-in' : 'opacity-0'}`}>Modello: {name || '-'}</span>
    </div>
  );
}

export default function TemplateShowcase({ active }: { active: boolean }) {
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
  // posizione -1 = quella appena uscita (scende e sparisce), 0 = davanti, 1..DEPTH dietro (DEPTH = entra, invisibile)
  const cards = [-1, 0, 1, 2, DEPTH].map(p => ({ p, n: i + p, id: TEMPLATES[(((i + p) % N) + N) % N].id }));
  return (
    <div className="relative pt-20">
      {/* dà l'altezza al mazzo */}
      <div ref={sizer} className="invisible"><Bar name="" /><div className="aspect-[4/3]" /></div>
      {cards.map(({ p, n, id }) => {
        const style = p < 0
          ? { transform: 'translateY(48px) scale(1.02)', opacity: 0, zIndex: 20 }
          : { transform: `translateY(${-p * 34}px) scale(${1 - p * 0.07})`, opacity: p >= DEPTH ? 0 : 1 - p * 0.15, zIndex: 10 - p };
        return (
          <div key={n} className="absolute inset-x-0 bottom-0 origin-top" style={{ ...style, transition: 'transform 1s cubic-bezier(.65,0,.35,1), opacity 1s cubic-bezier(.65,0,.35,1)' }}>
            <Window id={id} k={k} front={p === 0} />
          </div>
        );
      })}
    </div>
  );
}
