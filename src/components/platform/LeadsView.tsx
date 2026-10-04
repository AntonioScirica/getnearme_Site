'use client';

import { useEffect, useMemo, useState } from 'react';
import { Building2, Inbox, Loader2, Mail, MessageCircle, Phone } from 'lucide-react';
import Dropdown from '@/components/ui/Dropdown';
import { authFetch, CARD_SHADOW } from './api';
import { tr, pageLocale } from './i18n';

// Richieste dal modulo di contatto del sito (api/platform/leads): le piu' recenti in alto, con le azioni rapide
// (WhatsApp, chiamata, email) e lo stato che l'agente aggiorna man mano.
export type LeadStatus = 'nuova' | 'richiamata' | 'visita' | 'chiusa';
export type Lead = { id: string; name: string; email: string; phone: string; message: string; status: LeadStatus; created_at: string; property: { id: string; title: string; cover: string | null } | null };

const STATUS: { value: LeadStatus; label: string; dot: string }[] = [
  { value: 'nuova', label: tr('Nuova', 'New'), dot: 'bg-brand' },
  { value: 'richiamata', label: tr('Richiamata', 'Called back'), dot: 'bg-amber-500' },
  { value: 'visita', label: tr('Visita fissata', 'Viewing booked'), dot: 'bg-emerald-500' },
  { value: 'chiusa', label: tr('Chiusa', 'Closed'), dot: 'bg-muted' },
];
type Filter = 'tutte' | 'aperte' | 'chiuse';
const FILTERS: { id: Filter; label: string; test: (s: LeadStatus) => boolean }[] = [
  { id: 'tutte', label: tr('Tutte', 'All'), test: () => true },
  { id: 'aperte', label: tr('Da gestire', 'To handle'), test: s => s === 'nuova' || s === 'richiamata' },
  { id: 'chiuse', label: tr('Chiuse', 'Closed'), test: s => s === 'chiusa' },
];

// richieste nuove (pallino sul menu): si rilegge all'avvio e quando la pagina Richieste cambia uno stato
export function useNewLeads(): number {
  const [n, setN] = useState(0);
  useEffect(() => {
    const load = () => authFetch('/api/platform/leads').then(r => (r.ok ? r.json() : null))
      .then((d: { leads?: Lead[] } | null) => { if (d) setN((d.leads ?? []).filter(l => l.status === 'nuova').length); }).catch(() => {});
    void load();
    window.addEventListener('agenteimmo:leads', load);
    return () => window.removeEventListener('agenteimmo:leads', load);
  }, []);
  return n;
}

// numero di telefono per wa.me: solo cifre, +39 se manca il prefisso internazionale
export const waNumber = (phone: string) => {
  const p = phone.trim().replace(/[^\d+]/g, '');
  if (p.startsWith('+')) return p.slice(1);
  if (p.startsWith('00')) return p.slice(2);
  return p.startsWith('39') && p.length > 10 ? p : `39${p}`;
};

function ago(iso: string) {
  const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60_000));
  if (min < 1) return tr('Adesso', 'Just now');
  if (min < 60) return tr(`${min} min fa`, `${min} min ago`);
  const h = Math.round(min / 60);
  if (h < 24) return tr(`${h} ${h === 1 ? 'ora' : 'ore'} fa`, `${h} ${h === 1 ? 'hour' : 'hours'} ago`);
  const d = Math.round(h / 24);
  if (d === 1) return tr('Ieri', 'Yesterday');
  if (d < 7) return tr(`${d} giorni fa`, `${d} days ago`);
  return new Date(iso).toLocaleDateString(pageLocale(), { day: 'numeric', month: 'long', ...(d > 300 ? { year: 'numeric' } : {}) });
}

export default function LeadsView() {
  const [data, setData] = useState<{ leads: Lead[]; sitePlan: boolean } | null>(null);
  const [err, setErr] = useState(false);
  const [filter, setFilter] = useState<Filter>('tutte');
  const [saving, setSaving] = useState<string | null>(null);
  useEffect(() => {
    authFetch('/api/platform/leads').then(r => (r.ok ? r.json() : Promise.reject())).then(setData).catch(() => setErr(true));
  }, []);
  const leads = useMemo(() => data?.leads ?? [], [data]);
  const shown = useMemo(() => leads.filter(l => FILTERS.find(f => f.id === filter)!.test(l.status)), [leads, filter]);
  const open = leads.filter(l => l.status === 'nuova' || l.status === 'richiamata').length;

  const setStatus = async (l: Lead, status: LeadStatus) => {
    if (status === l.status) return;
    setSaving(l.id);
    setData(d => d && { ...d, leads: d.leads.map(x => (x.id === l.id ? { ...x, status } : x)) }); // si vede subito, poi si salva
    const r = await authFetch('/api/platform/leads', { method: 'PATCH', body: JSON.stringify({ id: l.id, status }) }).catch(() => null);
    setSaving(null);
    if (!r?.ok) {
      setData(d => d && { ...d, leads: d.leads.map(x => (x.id === l.id ? { ...x, status: l.status } : x)) });
      alert(tr('Non sono riuscito a salvare lo stato, riprova.', 'Could not save the status, please try again.'));
      return;
    }
    window.dispatchEvent(new Event('agenteimmo:leads'));
  };

  return (
    <div className="mx-auto max-w-3xl">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="blur-in font-display text-4xl font-bold leading-[1.2] tracking-tight">
            {tr('Richieste', 'Enquiries')}{data && leads.length > 0 && <span className="ml-3 align-middle text-2xl font-semibold text-muted/60">{leads.length}</span>}
          </h1>
          <p className="blur-in mt-1 text-muted" style={{ animationDelay: '.05s' }}>{data && open > 0 ? tr(`${open} da gestire`, `${open} to handle`) : tr('Chi ti scrive dal tuo sito.', 'People who contact you from your website.')}</p>
        </div>
        {data && leads.length > 0 && (
          <div className="blur-in flex max-w-full overflow-x-auto rounded-full bg-white p-1 ring-1 ring-black/10 [scrollbar-width:none] max-sm:w-full" style={{ animationDelay: '.08s' }}>
            {FILTERS.map(f => (
              <button key={f.id} type="button" onClick={() => setFilter(f.id)} className={`flex-1 shrink-0 whitespace-nowrap rounded-full px-3.5 py-2 text-[13px] font-medium ease-smooth transition-colors md:flex-none md:py-1.5 ${filter === f.id ? 'bg-ink text-white' : 'text-muted hover:text-ink'}`}>{f.label}</button>
            ))}
          </div>
        )}
      </div>

      {err ? <p className="mt-12 text-center text-sm text-muted">{tr('Non riesco a caricare le richieste, riprova tra poco.', 'Could not load your enquiries, please try again shortly.')}</p>
        : !data ? <div className="mt-16 flex justify-center"><Loader2 size={22} className="animate-spin text-muted" /></div>
        : !leads.length ? <Empty sitePlan={data.sitePlan} />
        : !shown.length ? <p className="mt-12 text-center text-sm text-muted">{filter === 'chiuse' ? tr('Nessuna richiesta chiusa.', 'No closed enquiries.') : tr('Niente da gestire: hai risposto a tutti.', 'Nothing to handle: you have replied to everyone.')}</p>
        : <ul className="mt-8 flex flex-col gap-4">{shown.map((l, i) => <LeadCard key={l.id} l={l} i={i} saving={saving === l.id} onStatus={s => void setStatus(l, s)} />)}</ul>}
    </div>
  );
}

function LeadCard({ l, i, saving, onStatus }: { l: Lead; i: number; saving: boolean; onStatus: (s: LeadStatus) => void }) {
  const st = STATUS.find(s => s.value === l.status) ?? STATUS[0];
  const first = l.name.split(' ')[0];
  const wa = `https://wa.me/${waNumber(l.phone)}?text=${encodeURIComponent(tr(`Ciao ${first}, ti scrivo per la richiesta che mi hai mandato dal mio sito`, `Hi ${first}, I'm writing about the enquiry you sent from my website`) + (l.property ? tr(` per "${l.property.title}".`, ` about "${l.property.title}".`) : '.'))}`;
  const act = 'flex h-10 items-center justify-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-semibold ease-smooth transition-colors max-sm:flex-1';
  return (
    <li className={`blur-in rounded-[28px] bg-white p-5 sm:p-6 ${CARD_SHADOW}`} style={{ animationDelay: `${Math.min(i, 8) * 0.04}s` }}>
      <div className="flex items-start gap-3">
        <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full font-display text-base font-bold ${l.status === 'nuova' ? 'bg-brand text-white' : 'bg-canvas text-ink'}`}>{(l.name.trim()[0] ?? '?').toUpperCase()}</span>
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold">{l.name}</div>
          <div className="text-[13px] text-muted">{ago(l.created_at)}</div>
        </div>
        <Dropdown value={l.status} align="end" options={STATUS.map(s => ({ value: s.value, label: s.label }))} onChange={onStatus} className="h-9 shrink-0 gap-1.5 bg-canvas pl-3.5 pr-3 text-sm font-medium hover:bg-line/60 hover:!text-ink">
          {saving ? <Loader2 size={12} className="animate-spin text-muted" /> : <span className={`h-2 w-2 rounded-full ${st.dot}`} aria-hidden />}
          <span className="whitespace-nowrap">{st.label}</span>
        </Dropdown>
      </div>
      {l.property && (
        <a href={`#/immobile/${l.property.id}`} className="mt-4 flex items-center gap-3 rounded-2xl bg-canvas p-2 pr-4 ease-smooth transition-colors hover:bg-line/60">
          {l.property.cover ? <img src={l.property.cover} alt="" className="h-10 w-14 shrink-0 rounded-xl object-cover" /> : <span className="flex h-10 w-14 shrink-0 items-center justify-center rounded-xl bg-white text-muted"><Building2 size={16} /></span>}
          <span className="min-w-0 flex-1"><span className="block text-[11px] font-semibold uppercase tracking-wider text-muted">{tr('Immobile', 'Property')}</span><span className="block truncate text-sm font-medium">{l.property.title || tr('Senza titolo', 'Untitled')}</span></span>
        </a>
      )}
      {l.message && <p className="mt-4 whitespace-pre-line break-words text-[15px] leading-relaxed">{l.message}</p>}
      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted">
        <span className="flex min-w-0 items-center gap-1.5"><Phone size={14} className="shrink-0" /><span className="truncate">{l.phone}</span></span>
        <span className="flex min-w-0 items-center gap-1.5"><Mail size={14} className="shrink-0" /><span className="truncate">{l.email}</span></span>
      </div>
      <div className="mt-5 flex flex-wrap gap-2">
        <a href={wa} target="_blank" rel="noopener noreferrer" className={`${act} bg-[#25d366] text-white hover:brightness-95`}><MessageCircle size={15} /> WhatsApp</a>
        <a href={`tel:${l.phone.replace(/[^\d+]/g, '')}`} className={`${act} bg-canvas text-ink hover:bg-line/60`}><Phone size={15} /> {tr('Chiama', 'Call')}</a>
        <a href={`mailto:${l.email}`} className={`${act} bg-canvas text-ink hover:bg-line/60`}><Mail size={15} /> Email</a>
      </div>
    </li>
  );
}

function Empty({ sitePlan }: { sitePlan: boolean }) {
  return (
    <div className={`blur-in mt-8 flex flex-col items-center rounded-[28px] bg-white px-6 py-12 text-center ${CARD_SHADOW}`}>
      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand/10 text-brand"><Inbox size={24} /></span>
      <h2 className="mt-5 font-display text-2xl font-extrabold tracking-tight">{tr('Ancora nessuna richiesta', 'No enquiries yet')}</h2>
      <p className="mt-2 max-w-md text-[15px] text-muted">{tr('Quando un cliente compila il modulo di contatto del tuo sito, la sua richiesta arriva qui (e per email), con nome, telefono e la casa che gli interessa.', 'When a client fills in the contact form on your website, the enquiry lands here (and by email), with name, phone and the property they are interested in.')}</p>
      {sitePlan
        ? <a href="#/portfolio" className="mt-6 inline-flex h-11 items-center rounded-full bg-canvas px-5 text-sm font-semibold ease-smooth transition-colors hover:bg-line/60">{tr('Vai al tuo sito', 'Go to your website')}</a>
        : <>
          <p className="mt-2 max-w-md text-[15px] text-muted">{tr('Il sito è incluso nei piani Plus e Pro.', 'The website is included in the Plus and Pro plans.')}</p>
          <a href="#/piano?cambia=1" className="mt-6 inline-flex h-11 items-center rounded-full bg-brand px-6 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand/90">{tr('Passa a Plus o Pro', 'Upgrade to Plus or Pro')}</a>
        </>}
    </div>
  );
}
