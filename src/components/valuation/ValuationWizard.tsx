'use client';

import { useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, ChevronLeft, Loader2, Mail, MapPin } from 'lucide-react';
import { track } from '@/lib/analytics';
import type { ValuationInput } from '@/lib/valuation';

// Valutazione casa per i proprietari: una domanda alla volta, testi grandi, pulsanti grandi (pensata anche per chi
// usa poco il telefono). Il risultato non si mostra qui: arriva per email (lead per Agente Immo).
// Passi: indirizzo -> tipo e metri -> locali, bagni, piano -> stato ed extra -> email e consensi.

type Data = Omit<ValuationInput, 'address'>;
const START: Data = { tipo: 'appartamento', mq: 0, locali: 3, bagni: 1, piano: 'intermedio', ascensore: true, stato: 'buono', finitura: 'civile', extra: [], energia: 'non_so' };
const STEPS = ['Indirizzo', 'La casa', 'Com\'è fatta', 'Stato', 'Email'];

const TIPI: [Data['tipo'], string, string][] = [
  ['appartamento', 'Appartamento', 'In un palazzo o condominio'],
  ['attico', 'Attico', 'All\'ultimo piano, con terrazzo'],
  ['villa', 'Villa o villino', 'Casa indipendente con giardino'],
  ['schiera', 'Villetta a schiera', 'Casa su più piani affiancata ad altre'],
];
const PIANI: [Data['piano'], string][] = [['terra', 'Piano terra'], ['rialzato', 'Rialzato'], ['primo', 'Primo piano'], ['intermedio', 'Piano intermedio'], ['ultimo', 'Ultimo piano']];
const STATI: [Data['stato'], string, string][] = [
  ['da_ristrutturare', 'Da ristrutturare', 'Impianti o bagni da rifare'],
  ['buono', 'In buono stato', 'Abitabile così com\'è'],
  ['ristrutturato', 'Ristrutturata da poco', 'Lavori fatti negli ultimi 10 anni'],
  ['nuovo', 'Nuova costruzione', 'Mai abitata o quasi'],
];
const FINITURE: [Data['finitura'], string][] = [['economica', 'Popolare'], ['civile', 'Normale'], ['signorile', 'Signorile, di pregio']];
const EXTRA: [Data['extra'][number], string][] = [['box', 'Box auto'], ['posto_auto', 'Posto auto'], ['balcone', 'Balcone'], ['terrazzo', 'Terrazzo'], ['giardino', 'Giardino privato'], ['cantina', 'Cantina']];
const ENERGIA: [Data['energia'], string][] = [['ab', 'A o B'], ['cd', 'C o D'], ['efg', 'E, F o G'], ['non_so', 'Non lo so']];

const EMAIL_RE = /^[^\s@<>]+@[^\s@<>]+\.[a-z]{2,}$/i;

// pulsante grande a scelta singola (radio) o multipla (checkbox)
function Choice({ on, onClick, title, sub, multi = false }: { on: boolean; onClick: () => void; title: string; sub?: string; multi?: boolean }) {
  return (
    <button type="button" role={multi ? 'checkbox' : 'radio'} aria-checked={on} onClick={onClick}
      className={`flex min-h-14 w-full items-center gap-3 rounded-[20px] px-4 py-3 text-left ease-smooth transition-all active:scale-[.985] ${on ? 'bg-brand/10 ring-2 ring-brand' : 'bg-white ring-1 ring-black/10 hover:ring-black/25'}`}>
      <span className={`flex h-6 w-6 shrink-0 items-center justify-center ${multi ? 'rounded-lg' : 'rounded-full'} ${on ? 'bg-brand text-white' : 'ring-2 ring-black/15'}`}>{on && <Check size={15} strokeWidth={3} />}</span>
      <span className="min-w-0">
        <span className="block text-[17px] font-semibold leading-snug text-ink">{title}</span>
        {sub && <span className="block text-sm text-muted">{sub}</span>}
      </span>
    </button>
  );
}

// riga di numeri grandi (locali, bagni)
function Counter({ label, value, set, options }: { label: string; value: number; set: (n: number) => void; options: [number, string][] }) {
  return (
    <fieldset>
      <legend className="text-[17px] font-semibold">{label}</legend>
      <div className="mt-3 flex gap-2">
        {options.map(([n, l]) => (
          <button key={n} type="button" role="radio" aria-checked={value === n} onClick={() => set(n)}
            className={`h-14 flex-1 rounded-[16px] text-lg font-bold ease-smooth transition-all active:scale-[.97] ${value === n ? 'bg-brand text-white' : 'bg-white text-ink ring-1 ring-black/10 hover:ring-black/25'}`}>{l}</button>
        ))}
      </div>
    </fieldset>
  );
}

function Question({ title, hint, children }: { title: string; hint?: string; children: ReactNode }) {
  return (
    <div>
      <h2 className="font-display text-[26px] font-extrabold leading-tight tracking-tight sm:text-3xl">{title}</h2>
      {hint && <p className="mt-2 text-[15px] leading-relaxed text-muted">{hint}</p>}
      <div className="mt-6 space-y-3">{children}</div>
    </div>
  );
}

export default function ValuationWizard() {
  const [step, setStep] = useState(0);
  const [address, setAddress] = useState('');
  const [found, setFound] = useState<{ luogo: string; comune: string } | null>(null);
  const [d, setD] = useState<Data>(START);
  const [mq, setMq] = useState('');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [privacy, setPrivacy] = useState(false);
  const [agents, setAgents] = useState(false);
  const [marketing, setMarketing] = useState(false);
  const [trap, setTrap] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');
  const [sent, setSent] = useState('');
  const top = useRef<HTMLDivElement>(null);

  const set = <K extends keyof Data>(k: K, v: Data[K]) => setD(p => ({ ...p, [k]: v }));
  const toggle = (x: Data['extra'][number]) => setD(p => ({ ...p, extra: p.extra.includes(x) ? p.extra.filter(e => e !== x) : [...p.extra, x] }));
  const house = d.tipo === 'villa' || d.tipo === 'schiera';
  const go = (n: number) => { setErr(''); setStep(n); top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); };

  // passo 1: controllo subito che l'indirizzo esista (meglio saperlo ora che dopo aver risposto a tutto)
  async function checkAddress() {
    if (address.trim().length < 6) { setErr('Scrivi via, numero civico e città, ad esempio: Via Roma 10, Milano.'); return; }
    setBusy(true); setErr('');
    try {
      const r = await fetch(`/api/valutazione?address=${encodeURIComponent(address.trim())}`);
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.comune) { setFound({ luogo: String(j.luogo).replace(/, Italia$/, ""), comune: j.comune }); go(1); }
      else if (r.status === 404) setErr('Non troviamo questo indirizzo. Controlla la via e aggiungi la città, ad esempio: Via Roma 10, Milano.');
      else if (r.status === 429) setErr('Troppe richieste in poco tempo. Riprova tra qualche minuto.');
      else setErr('Il servizio delle mappe non risponde in questo momento. Riprova tra un minuto.');
    } catch { setErr('Connessione assente. Controlla internet e riprova.'); }
    setBusy(false);
  }

  function checkSize() {
    const n = Math.round(Number(mq.replace(',', '.')));
    if (!n || n < 15 || n > 2000) { setErr('Scrivi i metri quadri della casa, un numero tra 15 e 2000.'); return; }
    set('mq', n); go(2);
  }

  async function submit() {
    if (!EMAIL_RE.test(email.trim())) { setErr('Controlla l\'indirizzo email: ci serve per mandarti la valutazione.'); return; }
    if (!privacy) { setErr('Per ricevere la valutazione devi accettare l\'informativa sulla privacy.'); return; }
    setBusy(true); setErr('');
    try {
      const r = await fetch('/api/valutazione', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...d, address: address.trim(), email: email.trim(), name: name.trim(), phone: phone.trim(), privacy, consent_agents: agents, consent_marketing: marketing, website: trap }),
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok) { track('Lead', { content_name: 'valutazione' }); setSent(email.trim()); top.current?.scrollIntoView({ behavior: 'smooth', block: 'start' }); }
      else setErr(({
        disposable: 'Usa un indirizzo email vero: le email temporanee non ricevono la valutazione.',
        invalid: 'Controlla i dati inseriti e riprova.',
        not_found: 'Non troviamo più l\'indirizzo della casa. Torna al primo passo e controllalo.',
        too_many: 'Hai già chiesto diverse valutazioni. Riprova tra qualche minuto.',
      } as Record<string, string>)[j.error] ?? 'Qualcosa non ha funzionato. Riprova tra un minuto.');
    } catch { setErr('Connessione assente. Controlla internet e riprova.'); }
    setBusy(false);
  }

  const field = 'mt-2 h-14 w-full rounded-[16px] bg-white px-4 text-[17px] text-ink outline-none ring-1 ring-black/15 placeholder:text-black/35 focus:ring-2 focus:ring-brand';
  const next = 'inline-flex h-14 w-full items-center justify-center gap-2 rounded-full bg-ink px-7 text-[17px] font-semibold text-white ease-smooth transition-all hover:bg-black active:scale-[.98] disabled:opacity-60 sm:w-auto';

  if (sent) return (
    <div ref={top} className="scroll-mt-6 rounded-[32px] bg-white p-6 text-center shadow-[0_1px_2px_rgba(0,0,0,.04),0_24px_60px_-24px_rgba(0,0,0,.25)] ring-1 ring-black/5 sm:p-10" role="status">
      <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-brand/10 text-brand"><Mail size={30} /></span>
      <h2 className="mt-5 font-display text-[26px] font-extrabold leading-tight tracking-tight sm:text-3xl">Ti abbiamo mandato la valutazione</h2>
      <p className="mt-3 text-[17px] leading-relaxed text-muted">L&apos;abbiamo inviata a <strong className="break-words text-ink">{sent}</strong>. Arriva di solito entro un minuto: se non la vedi, guarda anche nella cartella Spam o Promozioni.</p>
      {agents && <p className="mt-4 rounded-[20px] bg-canvas p-4 text-[15px] leading-relaxed text-ink">Ci hai chiesto di essere ricontattato: un agente immobiliare della tua zona potrà scriverti o chiamarti per una valutazione più precisa, senza impegno.</p>}
      <button type="button" onClick={() => { setSent(''); setStep(0); setD(START); setMq(''); setAddress(''); setFound(null); setPrivacy(false); setAgents(false); setMarketing(false); }} className="mt-7 text-[15px] font-semibold text-brand underline underline-offset-4">Valuta un&apos;altra casa</button>
    </div>
  );

  return (
    <div ref={top} className="scroll-mt-6 rounded-[32px] bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_24px_60px_-24px_rgba(0,0,0,.25)] ring-1 ring-black/5 sm:p-8">
      {/* avanzamento: passo X di 5 e barra */}
      <div className="flex items-center justify-between text-sm font-semibold text-muted">
        {step > 0 ? <button type="button" onClick={() => go(step - 1)} className="-ml-1 inline-flex h-10 items-center gap-1 rounded-full pr-3 text-ink hover:text-brand"><ChevronLeft size={20} /> Indietro</button> : <span>Valutazione gratuita</span>}
        <span>Passo {step + 1} di {STEPS.length}</span>
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-canvas" aria-hidden><div className="h-full rounded-full bg-brand transition-[width] duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} /></div>

      <div className="mt-7">
        {step === 0 && (
          <form onSubmit={e => { e.preventDefault(); checkAddress(); }}>
            <Question title="Dove si trova la casa?" hint="Scrivi via, numero civico e città. Ci serve per trovare i prezzi della tua zona.">
              <label className="block text-[15px] font-semibold">Indirizzo
                <input value={address} onChange={e => setAddress(e.target.value)} autoComplete="street-address" placeholder="Es. Via Roma 10, Milano" className={field} maxLength={200} />
              </label>
            </Question>
            <button type="submit" disabled={busy} className={`${next} mt-6`}>{busy ? <><Loader2 size={20} className="animate-spin" /> Cerco l&apos;indirizzo</> : <>Continua <ArrowRight size={20} /></>}</button>
          </form>
        )}

        {step === 1 && (
          <form onSubmit={e => { e.preventDefault(); checkSize(); }}>
            {found && <p className="mb-6 flex items-start gap-2 rounded-[16px] bg-canvas px-4 py-3 text-[15px]"><MapPin size={18} className="mt-0.5 shrink-0 text-brand" /><span><span className="font-semibold">Trovato:</span> {found.luogo}</span></p>}
            <Question title="Che tipo di casa è?">
              {TIPI.map(([v, t, s]) => <Choice key={v} on={d.tipo === v} onClick={() => set('tipo', v)} title={t} sub={s} />)}
            </Question>
            <label className="mt-7 block text-[17px] font-semibold">Quanti metri quadri?
              <span className="block text-sm font-normal text-muted">Quelli dell&apos;atto o della planimetria, muri compresi. Se non li sai, vanno bene circa.</span>
              <span className="relative block">
                <input value={mq} onChange={e => setMq(e.target.value.replace(/[^\d,.]/g, ''))} inputMode="numeric" placeholder="Es. 85" className={`${field} pr-14`} maxLength={5} />
                <span className="pointer-events-none absolute right-4 top-1/2 mt-1 -translate-y-1/2 text-[17px] text-muted">m²</span>
              </span>
            </label>
            <button type="submit" className={`${next} mt-6`}>Continua <ArrowRight size={20} /></button>
          </form>
        )}

        {step === 2 && (
          <div>
            <Question title="Com'è fatta?">
              <div className="space-y-6">
                <Counter label="Quante stanze (locali)?" value={d.locali} set={n => set('locali', n)} options={[[1, '1'], [2, '2'], [3, '3'], [4, '4'], [5, '5+']]} />
                <Counter label="Quanti bagni?" value={d.bagni} set={n => set('bagni', n)} options={[[1, '1'], [2, '2'], [3, '3+']]} />
                {!house && (
                  <>
                    <fieldset>
                      <legend className="text-[17px] font-semibold">A che piano?</legend>
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {PIANI.map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={d.piano === v} onClick={() => set('piano', v)} className={`h-14 rounded-[16px] text-[16px] font-semibold ease-smooth transition-all active:scale-[.97] ${d.piano === v ? 'bg-brand text-white' : 'bg-white ring-1 ring-black/10 hover:ring-black/25'}`}>{l}</button>)}
                      </div>
                    </fieldset>
                    <Counter label="C'è l'ascensore?" value={d.ascensore ? 1 : 0} set={n => set('ascensore', n === 1)} options={[[1, 'Sì'], [0, 'No']]} />
                  </>
                )}
              </div>
            </Question>
            <p className="mt-4 text-sm text-muted">Le stanze sono camere, soggiorno e studio: cucina e bagni non si contano.</p>
            <button type="button" onClick={() => go(3)} className={`${next} mt-6`}>Continua <ArrowRight size={20} /></button>
          </div>
        )}

        {step === 3 && (
          <div>
            <Question title="In che stato è?">
              {STATI.map(([v, t, s]) => <Choice key={v} on={d.stato === v} onClick={() => set('stato', v)} title={t} sub={s} />)}
            </Question>
            <fieldset className="mt-8">
              <legend className="text-[17px] font-semibold">Cosa c&apos;è in più? <span className="font-normal text-muted">Tocca tutto quello che c&apos;è</span></legend>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {EXTRA.map(([v, l]) => <Choice key={v} multi on={d.extra.includes(v)} onClick={() => toggle(v)} title={l} />)}
              </div>
            </fieldset>
            <fieldset className="mt-8">
              <legend className="text-[17px] font-semibold">Com&apos;è il palazzo o la zona della casa?</legend>
              <div className="mt-3 grid gap-2 sm:grid-cols-3">
                {FINITURE.map(([v, l]) => <Choice key={v} on={d.finitura === v} onClick={() => set('finitura', v)} title={l} />)}
              </div>
            </fieldset>
            <fieldset className="mt-8">
              <legend className="text-[17px] font-semibold">Classe energetica <span className="font-normal text-muted">(la trovi sull&apos;APE)</span></legend>
              <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {ENERGIA.map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={d.energia === v} onClick={() => set('energia', v)} className={`h-14 rounded-[16px] text-[16px] font-semibold ease-smooth transition-all active:scale-[.97] ${d.energia === v ? 'bg-brand text-white' : 'bg-white ring-1 ring-black/10 hover:ring-black/25'}`}>{l}</button>)}
              </div>
            </fieldset>
            <button type="button" onClick={() => go(4)} className={`${next} mt-8`}>Continua <ArrowRight size={20} /></button>
          </div>
        )}

        {step === 4 && (
          <form onSubmit={e => { e.preventDefault(); submit(); }} noValidate>
            <Question title="A che email ti mandiamo la valutazione?" hint="Ti arriva in un minuto, con il valore minimo, il valore massimo e come l'abbiamo calcolato. Gratis.">
              <label className="block text-[15px] font-semibold">Email
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" inputMode="email" placeholder="nome@esempio.it" className={field} maxLength={120} />
              </label>
              <label className="block text-[15px] font-semibold">Nome <span className="font-normal text-muted">(facoltativo)</span>
                <input value={name} onChange={e => setName(e.target.value)} autoComplete="given-name" className={field} maxLength={80} />
              </label>
              <label className="block text-[15px] font-semibold">Telefono <span className="font-normal text-muted">(facoltativo)</span>
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" inputMode="tel" className={field} maxLength={30} />
              </label>
              {/* campo trappola per i bot: invisibile alle persone */}
              <input value={trap} onChange={e => setTrap(e.target.value)} name="website" tabIndex={-1} autoComplete="off" aria-hidden className="absolute -left-[9999px] h-0 w-0 opacity-0" />
            </Question>
            <div className="mt-6 space-y-3 text-[15px] leading-relaxed">
              <label className="flex items-start gap-3"><input type="checkbox" checked={privacy} onChange={e => setPrivacy(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 accent-brand" />
                <span>Ho letto l&apos;<Link href="/it/privacy" target="_blank" className="font-semibold text-brand underline underline-offset-2">informativa sulla privacy</Link> e voglio ricevere la valutazione per email. <span className="text-muted">(obbligatorio)</span></span></label>
              <label className="flex items-start gap-3"><input type="checkbox" checked={agents} onChange={e => setAgents(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 accent-brand" />
                <span>Voglio essere ricontattato da un agente immobiliare della mia zona: i miei dati possono essere condivisi con gli agenti partner di Agente Immo della zona. <span className="text-muted">(facoltativo)</span></span></label>
              <label className="flex items-start gap-3"><input type="checkbox" checked={marketing} onChange={e => setMarketing(e.target.checked)} className="mt-0.5 h-6 w-6 shrink-0 accent-brand" />
                <span>Voglio ricevere ogni tanto novità e consigli sulla casa da Agente Immo. <span className="text-muted">(facoltativo)</span></span></label>
            </div>
            <button type="submit" disabled={busy} className={`${next} mt-7`}>{busy ? <><Loader2 size={20} className="animate-spin" /> Calcolo la valutazione</> : <>Mandami la valutazione <ArrowRight size={20} /></>}</button>
          </form>
        )}

        {err && <p role="alert" className="mt-4 rounded-[16px] bg-red-50 px-4 py-3 text-[15px] font-medium text-red-700">{err}</p>}
      </div>
    </div>
  );
}
