'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { authFetch } from './api';

export type Profile = { name: string | null; slug: string | null };

export const slugify = (s: string) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase()
  .replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 40).replace(/-+$/, '');

type Check = { slug: string; state: 'ok' | 'taken' | 'invalid'; suggestion?: string | null };

// Nome agente -> indirizzo portfolio (slug), con verifica disponibilita' mentre scrive.
export default function ProfileForm({ initial, submitLabel, onSaved }: { initial: Profile; submitLabel: string; onSaved: (p: Profile) => void }) {
  const [name, setName] = useState(initial.name ?? '');
  const [slug, setSlug] = useState(initial.slug ?? '');
  const [slugTouched, setSlugTouched] = useState(!!initial.slug);
  const [result, setResult] = useState<Check | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const reqId = useRef(0);

  // Precompila col nome del provider (Google) al primo accesso.
  useEffect(() => {
    if (initial.name) return;
    supabase.auth.getUser().then(({ data }) => {
      const m = data.user?.user_metadata as Record<string, string> | undefined;
      const n = m?.full_name || m?.name;
      if (n) { setName(n); setSlug(slugify(n)); }
    });
  }, [initial.name]);

  useEffect(() => {
    if (!slug || slug === initial.slug) return;
    const id = ++reqId.current;
    const t = setTimeout(async () => {
      const d = await authFetch(`/api/platform/portfolio?check=${encodeURIComponent(slug)}`).then(r => r.json()).catch(() => null);
      if (id !== reqId.current || !d) return;
      setResult({ slug, state: d.invalid ? 'invalid' : d.available ? 'ok' : 'taken', suggestion: d.suggestion });
    }, 350);
    return () => clearTimeout(t);
  }, [slug, initial.slug]);

  // Stato del controllo derivato: risultato valido solo se riferito allo slug attuale.
  const check: { state: 'idle' | 'checking' | Check['state']; suggestion?: string | null } =
    !slug ? { state: 'idle' } : slug === initial.slug ? { state: 'ok' } : result?.slug === slug ? result : { state: 'checking' };

  const onName = (v: string) => { setName(v); if (!slugTouched) setSlug(slugify(v)); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true); setError(null);
    const res = await authFetch('/api/platform/portfolio', { method: 'PUT', body: JSON.stringify({ name, slug }) });
    const d = await res.json().catch(() => ({}));
    setSaving(false);
    if (res.ok) return onSaved({ name: d.name, slug: d.slug });
    if (d.error === 'slug_taken') setResult({ slug, state: 'taken', suggestion: d.suggestion });
    else setError(d.error === 'invalid_name' ? 'Inserisci un nome di almeno 2 caratteri.' : 'Salvataggio non riuscito, riprova.');
  };

  const canSave = name.trim().length >= 2 && check.state === 'ok' && (name !== initial.name || slug !== initial.slug);

  return (
    <form onSubmit={save} className="space-y-5">
      <div>
        <label className="mb-1.5 block text-sm font-medium">Nome e cognome (o nome agenzia)</label>
        <input value={name} onChange={e => onName(e.target.value)} maxLength={80} placeholder="Mario Rossi" autoFocus={!initial.name}
          className="w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand" />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">Indirizzo del tuo portfolio</label>
        <div className="flex items-center rounded-lg border border-line bg-white text-sm focus-within:border-brand">
          <span className="pl-3 text-muted">getnearme.it/it/a/</span>
          <input value={slug} onChange={e => { setSlugTouched(true); setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '').slice(0, 40)); }}
            placeholder="mario-rossi" className="min-w-0 flex-1 bg-transparent py-2.5 outline-none" />
          <span className="pr-3">
            {check.state === 'checking' && <Loader2 size={16} className="animate-spin text-muted" />}
            {check.state === 'ok' && <Check size={16} className="text-green-600" />}
            {(check.state === 'taken' || check.state === 'invalid') && <X size={16} className="text-red-600" />}
          </span>
        </div>
        {check.state === 'taken' && (
          <p className="mt-2 text-sm text-red-600">
            Già in uso.{check.suggestion && <> Prova <button type="button" className="font-medium underline" onClick={() => { setSlugTouched(true); setSlug(check.suggestion!); }}>{check.suggestion}</button></>}
          </p>
        )}
        {check.state === 'invalid' && <p className="mt-2 text-sm text-red-600">Da 3 a 40 caratteri: lettere minuscole, numeri e trattini.</p>}
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={!canSave || saving} className="w-full rounded-lg bg-ink py-2.5 text-sm font-medium text-white disabled:opacity-40">
        {saving ? 'Salvo...' : submitLabel}
      </button>
    </form>
  );
}
