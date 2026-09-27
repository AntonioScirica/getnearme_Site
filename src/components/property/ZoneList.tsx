'use client';

import { useState } from 'react';
import { ChevronDown, Compass, Star } from 'lucide-react';

const EXTENSION_URL = 'https://chromewebstore.google.com/detail/jbnceigldmpkpplanjlednlehloaeoia';

// "Nella zona": i posti scelti dall'agente in evidenza, tutti gli altri sotto "Mostra tutti",
// e l'invito a scaricare l'estensione per l'analisi completa del quartiere.
export default function ZoneList({ all, featured, withCta }: { all: string[]; featured: string[]; withCta?: boolean }) {
  const [open, setOpen] = useState(false);
  const rest = all.filter(l => !featured.includes(l));
  return (
    <div>
      {featured.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {featured.map(l => (
            <div key={l} className="flex items-center gap-3 card p-3.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center icon-badge rounded-full"><Star size={15} className="fill-current" /></span>
              <span className="text-sm font-medium">{l}</span>
            </div>
          ))}
        </div>
      )}
      {rest.length > 0 && (
        <>
          <button onClick={() => setOpen(v => !v)} className="mt-3 flex items-center gap-1.5 text-sm font-medium text-brand">
            {open ? 'Mostra meno' : `Mostra tutti i servizi vicini (${all.length})`} <ChevronDown size={16} className={`transition-transform ${open ? 'rotate-180' : ''}`} />
          </button>
          {open && (
            <div className="mt-3 flex flex-wrap gap-2">
              {rest.map(l => <span key={l} className="rounded-full bg-white px-3.5 py-1.5 text-sm ring-1 ring-line">{l}</span>)}
            </div>
          )}
        </>
      )}
      <p className="mt-2 text-xs text-muted">Distanze in linea d&apos;aria, fonte OpenStreetMap.</p>
      {withCta && (
        <a href={EXTENSION_URL} target="_blank" rel="noreferrer" className="mt-4 flex items-center gap-3 rounded-2xl btn-ink p-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white/10"><Compass size={20} /></span>
          <span className="min-w-0 flex-1">
            <span className="block text-sm font-semibold">Vuoi l&apos;analisi completa del quartiere?</span>
            <span className="block text-xs text-white/70">Prezzi di zona, servizi, tempi di percorrenza e punteggio della casa con l&apos;estensione gratuita Agente Immo.</span>
          </span>
        </a>
      )}
    </div>
  );
}
