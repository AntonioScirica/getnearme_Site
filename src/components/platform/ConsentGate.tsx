'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

// Termini e Privacy obbligatori prima di usare la piattaforma: chi entra con Google (o per altre vie) senza averli
// accettati li trova qui sopra a tutto e non puo' andare avanti. Stesso dato del checkout (user_metadata.terms_accepted_at).
export default function ConsentGate() {
  const [need, setNeed] = useState(false);
  const [terms, setTerms] = useState(false);
  const [mkt, setMkt] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { supabase.auth.getUser().then(({ data }) => { if (data.user && !data.user.user_metadata?.terms_accepted_at) setNeed(true); }).catch(() => {}); }, []);
  if (!need) return null;
  const box = (on: boolean) => `flex h-5 w-5 shrink-0 items-center justify-center rounded-md ring-1 ease-smooth transition-colors ${on ? 'bg-ink text-white ring-ink' : 'bg-white ring-black/15'}`;
  const tick = <Check size={13} strokeWidth={3} />;
  const save = async () => {
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ data: { terms_accepted_at: new Date().toISOString(), marketing_consent: mkt } });
    setBusy(false);
    if (!error) setNeed(false);
  };
  return (
    <div className="fixed inset-0 z-[400] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-[32px] bg-white p-7 shadow-2xl">
        <h2 className="font-display text-2xl font-extrabold tracking-tight">Prima di iniziare</h2>
        <p className="mt-2 text-sm text-muted">Per usare Agente Immo accetta i Termini di Servizio e la Privacy Policy.</p>
        <div className="mt-5 space-y-3">
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} className="sr-only" />
            <span className={box(terms)}>{terms && tick}</span>
            <span className="text-sm leading-snug text-muted">Accetto i <a href="/it/termini" target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline underline-offset-4">Termini di Servizio</a> e la <a href="/it/privacy" target="_blank" rel="noopener noreferrer" className="font-medium text-ink underline underline-offset-4">Privacy Policy</a> *</span>
          </label>
          <label className="flex cursor-pointer items-center gap-3">
            <input type="checkbox" checked={mkt} onChange={e => setMkt(e.target.checked)} className="sr-only" />
            <span className={box(mkt)}>{mkt && tick}</span>
            <span className="text-sm leading-snug text-muted">Accetto di ricevere email su novità e promozioni</span>
          </label>
        </div>
        <button type="button" disabled={!terms || busy} onClick={save} className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-ink text-[15px] font-semibold text-white disabled:opacity-40">{busy && <Loader2 size={16} className="animate-spin" />}Continua</button>
      </div>
    </div>
  );
}
