'use client';

import { useEffect, useState } from 'react';
import { Check, Copy, ExternalLink, Loader2 } from 'lucide-react';
import type { ProjectData } from '@/lib/projects';
import { authFetch, formatPrice, portfolioUrl, setPublic } from './api';
import ProfileForm, { type Profile } from './ProfileForm';

export default function PortfolioView({ projects, onChange }: { projects: ProjectData[] | null; onChange: () => void }) {
  const [profile, setProfile] = useState<Profile | undefined>(undefined);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    authFetch('/api/platform/portfolio').then(r => r.json()).then(d => setProfile({ name: d.name, slug: d.slug }));
  }, []);

  const toggle = async (p: ProjectData) => { if (await setPublic(p.id, !p.is_public)) onChange(); };

  if (!profile) return <Loader2 className="animate-spin text-muted" />;
  const url = profile.slug ? portfolioUrl(profile.slug) : null;

  return (
    <>
      <h1 className="font-display text-3xl font-bold tracking-tight">Portfolio</h1>
      <p className="mt-1 text-muted">La tua vetrina pubblica: condividi il link, chi lo apre vede gli immobili che pubblichi.</p>

      <section className="mt-8 rounded-2xl border border-line bg-white p-6">
        <ProfileForm key={profile.slug ?? ''} initial={profile} submitLabel="Salva" onSaved={setProfile} />
        {url && (
          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
            <a href={url} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-medium text-brand"><ExternalLink size={14} /> Apri portfolio</a>
            <button onClick={() => { navigator.clipboard.writeText(url); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="flex items-center gap-1 text-muted hover:text-ink">{copied ? <Check size={14} /> : <Copy size={14} />} {copied ? 'Copiato' : 'Copia link'}</button>
          </div>
        )}
      </section>

      <h2 className="mt-10 font-display text-xl font-semibold">Immobili nel portfolio</h2>
      {!projects ? <Loader2 className="mt-4 animate-spin text-muted" /> : !projects.length ? (
        <p className="mt-4 text-sm text-muted">Nessun immobile. <a href="#/nuovo" className="text-brand">Creane uno</a>.</p>
      ) : (
        <ul className="mt-4 divide-y divide-line overflow-hidden rounded-2xl border border-line bg-white">
          {projects.map(p => (
            <li key={p.id} className="flex items-center gap-4 p-3">
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-lg bg-canvas">{p.cover && <img src={p.thumb || p.cover} alt="" className="h-full w-full object-cover" />}</div>
              <a href={`#/immobile/${p.id}`} className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium">{p.titolo || p.nome}</div>
                <div className="text-xs text-muted">{formatPrice(p.prezzo)} · {p.addr}</div>
              </a>
              <PublicSwitch on={!!p.is_public} onClick={() => toggle(p)} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export function PublicSwitch({ on, onClick }: { on: boolean; onClick: () => void }) {
  return (
    <button role="switch" aria-checked={on} onClick={onClick} className="flex shrink-0 items-center gap-2 text-sm">
      <span className={on ? 'text-brand' : 'text-muted'}>{on ? 'Pubblico' : 'Privato'}</span>
      <span className={`relative h-6 w-10 rounded-full transition-colors ${on ? 'bg-brand' : 'bg-line'}`}>
        <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}
