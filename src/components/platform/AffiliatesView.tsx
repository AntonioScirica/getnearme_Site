'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, Plus, Trash2 } from 'lucide-react';
import { authFetch, CARD_SHADOW } from './api';
import { tr } from './i18n';

// Pagina admin Affiliati (#/affiliati): quanti crediti si danno, codici con il loro affiliato, utilizzi.
// Si modifica tutto in pagina e si salva con un bottone (api/platform/affiliates).
type Code = { owner: string; max?: number; active?: boolean };
type Store = { redeem: number; affiliate: number; codes: Record<string, Code> };
type Stats = Record<string, { uses: number; given: number }>;

const field = 'h-10 w-full rounded-full bg-canvas px-4 text-sm outline-none ring-1 ring-black/5 focus:bg-white focus:ring-2 focus:ring-brand';

export default function AffiliatesView() {
  const [store, setStore] = useState<Store | null>(null);
  const [saved, setSaved] = useState<Store | null>(null);
  const [stats, setStats] = useState<Stats>({});
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState('');
  const [add, setAdd] = useState({ code: '', owner: '', max: '' });
  useEffect(() => {
    authFetch('/api/platform/affiliates').then(r => r.json()).then(d => { if (d.store) { setStore(d.store); setSaved(d.store); setStats(d.stats ?? {}); } }).catch(() => {});
  }, []);
  if (!store) return <div className="animate-pulse"><div className="h-9 w-48 rounded-full bg-black/[0.06]" /><div className="mt-6 h-40 rounded-[28px] bg-black/[0.05]" /></div>;

  const dirty = JSON.stringify(store) !== JSON.stringify(saved);
  const setCode = (c: string, p: Partial<Code>) => setStore(s => s && { ...s, codes: { ...s.codes, [c]: { ...s.codes[c], ...p } } });
  const addCode = () => {
    const code = add.code.trim().toUpperCase();
    if (!/^[A-Z0-9][A-Z0-9-]{2,39}$/.test(code)) return setMsg(tr('Codice: da 3 a 40 caratteri, lettere, numeri e trattini.', 'Code: 3 to 40 characters, letters, numbers and dashes.'));
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(add.owner.trim())) return setMsg(tr('Email dell’affiliato non valida.', 'Invalid affiliate email.'));
    if (store.codes[code]) return setMsg(tr('Questo codice esiste già.', 'This code already exists.'));
    setStore({ ...store, codes: { [code]: { owner: add.owner.trim().toLowerCase(), ...(Number(add.max) > 0 ? { max: Number(add.max) } : {}) }, ...store.codes } });
    setAdd({ code: '', owner: '', max: '' }); setMsg('');
  };
  const save = async () => {
    setBusy(true); setMsg('');
    const r = await authFetch('/api/platform/affiliates', { method: 'PUT', body: JSON.stringify({ store }) }).catch(() => null);
    const d = await r?.json().catch(() => null);
    setBusy(false);
    if (d?.store) { setStore(d.store); setSaved(d.store); setMsg(tr('Salvato.', 'Saved.')); } else setMsg(tr('Salvataggio non riuscito, controlla i codici.', 'Saving failed, check the codes.'));
  };
  const codes = Object.entries(store.codes);

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-6">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">{tr('Affiliati', 'Affiliates')}</h1>
          <p className="pt-1 text-sm text-muted">{tr('Chi ha un piano inserisce il codice nella pagina Il tuo piano: riceve crediti lui e riceve crediti l’affiliato.', 'Subscribers enter the code on the plan page: they get credits and so does the affiliate.')}</p>
        </div>
        <button type="button" onClick={save} disabled={!dirty || busy} className="flex h-10 items-center gap-2 rounded-full bg-brand px-5 text-sm font-semibold text-white ease-smooth transition-opacity disabled:opacity-40">{busy ? <Loader2 size={15} className="animate-spin" /> : <Check size={15} />}{tr('Salva', 'Save')}</button>
      </div>
      {msg && <p className="blur-in mt-4 text-sm text-muted">{msg}</p>}

      <div className={`mt-6 grid gap-4 rounded-[28px] bg-white p-6 sm:grid-cols-2 ${CARD_SHADOW}`}>
        <label className="text-sm text-muted">{tr('Crediti a chi inserisce il codice', 'Credits for whoever enters the code')}<input type="number" min={0} value={store.redeem} onChange={e => setStore({ ...store, redeem: Math.max(0, Math.round(Number(e.target.value) || 0)) })} className={`${field} mt-1.5 font-semibold text-ink`} /></label>
        <label className="text-sm text-muted">{tr('Crediti all’affiliato per ogni persona', 'Credits for the affiliate per person')}<input type="number" min={0} value={store.affiliate} onChange={e => setStore({ ...store, affiliate: Math.max(0, Math.round(Number(e.target.value) || 0)) })} className={`${field} mt-1.5 font-semibold text-ink`} /></label>
      </div>

      <div className={`mt-4 rounded-[28px] bg-white p-6 ${CARD_SHADOW}`}>
        <div className="font-semibold">{tr('Nuovo codice', 'New code')}</div>
        <div className="mt-3 grid gap-2 sm:grid-cols-[1fr_1.4fr_120px_auto]">
          <input value={add.code} onChange={e => setAdd({ ...add, code: e.target.value.toUpperCase() })} placeholder="MARIO-IMMO" className={`${field} font-semibold uppercase`} />
          <input value={add.owner} onChange={e => setAdd({ ...add, owner: e.target.value })} placeholder={tr('Email dell’affiliato su Agente Immo', 'Affiliate email on Agente Immo')} className={field} />
          <input type="number" min={0} value={add.max} onChange={e => setAdd({ ...add, max: e.target.value })} placeholder={tr('Max persone', 'Max people')} className={field} />
          <button type="button" onClick={addCode} className="flex h-10 items-center justify-center gap-1.5 rounded-full bg-ink px-4 text-sm font-semibold text-white"><Plus size={15} /> {tr('Aggiungi', 'Add')}</button>
        </div>
      </div>

      <div className={`mt-4 rounded-[28px] bg-white p-2 ${CARD_SHADOW}`}>
        {!codes.length && <p className="px-4 py-6 text-center text-sm text-muted">{tr('Ancora nessun codice.', 'No codes yet.')}</p>}
        {codes.map(([c, v]) => {
          const st = stats[c] ?? { uses: 0, given: 0 };
          return (
            <div key={c} className="grid items-center gap-3 rounded-[20px] px-4 py-3 hover:bg-canvas sm:grid-cols-[1fr_1.4fr_auto_auto]">
              <div className="min-w-0">
                <div className={`font-display text-lg font-bold tracking-tight ${v.active === false ? 'text-muted line-through' : ''}`}>{c}</div>
                <div className="text-xs text-muted">{tr(`${st.uses} ${st.uses === 1 ? 'persona' : 'persone'}${v.max ? ` su ${v.max}` : ''} · ${st.given} crediti dati`, `${st.uses} ${st.uses === 1 ? 'person' : 'people'}${v.max ? ` of ${v.max}` : ''} · ${st.given} credits given`)}</div>
              </div>
              <input value={v.owner} onChange={e => setCode(c, { owner: e.target.value })} className={field} />
              <button type="button" onClick={() => setCode(c, { active: v.active === false })} className={`h-9 rounded-full px-4 text-sm font-medium ${v.active === false ? 'text-brand hover:bg-brand/10' : 'text-muted hover:bg-canvas'}`}>{v.active === false ? tr('Riattiva', 'Enable') : tr('Sospendi', 'Pause')}</button>
              <button type="button" aria-label={tr('Elimina', 'Delete')} onClick={() => { if (confirm(tr(`Eliminare il codice ${c}?`, `Delete code ${c}?`))) setStore(s => { if (!s) return s; const { [c]: _, ...rest } = s.codes; void _; return { ...s, codes: rest }; }); }} className="flex h-9 w-9 items-center justify-center rounded-full text-rose-600 hover:bg-rose-50"><Trash2 size={15} /></button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
