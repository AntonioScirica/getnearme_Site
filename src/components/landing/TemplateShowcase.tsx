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

export default function TemplateShowcase({ active }: { active: boolean }) {
  const [i, setI] = useState(0);
  const box = useRef<HTMLDivElement>(null);
  const [k, setK] = useState(0.4);
  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setI(v => (v + 1) % TEMPLATES.length), 3500);
    return () => clearInterval(id);
  }, [active]);
  useEffect(() => {
    const ro = new ResizeObserver(() => box.current && setK(box.current.clientWidth / 1280));
    if (box.current) ro.observe(box.current);
    return () => ro.disconnect();
  }, []);
  const t = TEMPLATES[i];
  const cfg = withPlaceholders({ ...BASE, template: t.id, primary: t.primary, font: t.font });
  return (
    <div className="overflow-hidden rounded-[24px] bg-white shadow-[0_30px_80px_-30px_rgba(0,0,0,.35)] ring-1 ring-black/5">
      <div className="flex items-center gap-2 border-b border-line bg-canvas px-4 py-2.5">
        <span className="flex gap-1.5">{['#ff5f57', '#febc2e', '#28c840'].map(c => <span key={c} className="h-2.5 w-2.5 rounded-full" style={{ background: c }} />)}</span>
        <span className="mx-auto flex h-7 items-center gap-1.5 rounded-full bg-white px-3 text-[11px] font-medium text-muted ring-1 ring-black/5"><Globe size={11} className="text-brand" /> agenteimmo.me/<span className="text-ink">tuonome</span></span>
        <span key={t.id} className="blur-in rounded-full bg-white px-2 py-0.5 text-[10px] font-semibold text-muted ring-1 ring-black/5">Modello: {t.name}</span>
      </div>
      <div ref={box} className="pointer-events-none relative aspect-[4/3] select-none overflow-hidden" aria-hidden>
        <div key={t.id} className="blur-in" style={{ width: 1280, transform: `scale(${k})`, transformOrigin: 'top left' }}>
          <SiteThumb ctx={{ cfg, name: 'Studio Rossi', logo: null, properties: PROPS, base: '', preview: true }} />
        </div>
      </div>
    </div>
  );
}
