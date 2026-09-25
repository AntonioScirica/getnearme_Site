'use client';

import LeafletMap from '@/components/ui/LeafletMap';
import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import {
  ArrowLeft, ArrowRight, Ban, Building, Building2, CalendarClock, Car, Check, ChefHat, Crown, DoorOpen, Fence, FileSignature,
  Flame, Flower2, GripVertical, Hammer, Home, ImagePlus, KeyRound, LayoutTemplate, Loader2, Minus, Plus, Snowflake, Sofa, Sparkles,
  Star, Sun as SunIcon, Tag, Tent, ThumbsUp, TreePine, UserRound, Utensils, Warehouse, Waves, X, ParkingCircle, CircleCheck, Copy, Download,
} from 'lucide-react';
import { createProject, type ProjectData } from '@/lib/projects';
import { downscaleDataUrl, uploadDataUrl } from '@/lib/imageUpload';
import ProgressiveBlur from '@/components/ProgressiveBlur';
import FitImage from '@/components/ui/FitImage';
import { ALL_FIELDS, completeness, ENERGY_COLORS, inkOn, formatValue, visible, type Details, type Field } from '@/lib/propertyFields';
import { authFetch, CARD_SHADOW, portfolioUrl, setPublic } from './api';
import { CopyIcon } from './ImproveView';
import CountUp from './CountUp';

// "Mettilo sul tuo sito": hai appena preso un immobile, AgenteImmo lo mette sul tuo sito (che si
// costruisce da solo, casa dopo casa) e ti prepara tutto per il portale.
// Una scheda per volta: prima i dati facili (quasi tutto a tap), in fondo le foto con le
// modifiche AI (arreda, svuota, luce, prima/dopo), poi la pagina "Pronto per il portale".
// Bozza (dati e note, non foto) salvata in automatico.

// url = foto gia' su R2 (risultato AI); original = com'era prima della modifica AI (per ripristinarla)
type Photo = { id: string; dataUrl: string; url?: string; original?: string; ai?: boolean };
const srcOf = (p: Photo) => p.url ?? p.dataUrl;
type AiResult = { titolo: string; descrizione: string; score: number; suggerimenti: string[] };
type Icon = ComponentType<{ size?: number; className?: string }>;

const DRAFT_KEY = 'gnm_new_property_draft';
const F = Object.fromEntries(ALL_FIELDS.map(f => [f.key, f])) as Record<string, Field>;
const readFile = (f: File) => new Promise<string>((res, rej) => { const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f); });
const uid = () => Math.random().toString(36).slice(2, 10);
const euro = (n: number) => `€ ${n.toLocaleString('it-IT')}`;

// Icone per le opzioni che meritano una card (le altre restano chip).
const ICONS: Record<string, Record<string, Icon>> = {
  contratto: { Vendita: Tag, Affitto: KeyRound },
  tipologia: { Appartamento: Building2, Attico: Crown, Mansarda: Tent, Loft: Warehouse, Villa: Home, 'Villetta a schiera': Fence, 'Casa indipendente': Home, Terratetto: Building, 'Rustico / Casale': TreePine },
  stato: { 'Nuovo / In costruzione': Sparkles, 'Ottimo / Ristrutturato': ThumbsUp, 'Buono / Abitabile': CircleCheck, 'Da ristrutturare': Hammer },
  riscaldamento: { Autonomo: Flame, Centralizzato: Building2, Assente: Ban },
  climatizzazione: { Autonoma: Snowflake, Centralizzata: Building2, Predisposizione: CircleCheck, Assente: Ban },
  cucina: { Abitabile: ChefHat, 'A vista': Utensils, 'Angolo cottura': Utensils, Cucinotto: ChefHat },
  arredato: { Arredato: Sofa, 'Parzialmente arredato': Sofa, 'Non arredato': Ban },
  esterni: { Balcone: DoorOpen, Terrazzo: SunIcon, 'Giardino privato': Flower2, 'Giardino condominiale': TreePine, Cortile: Fence, Piscina: Waves },
  posto_auto: { Nessuno: Ban, 'Box singolo': Warehouse, 'Box doppio': Warehouse, 'Posto auto coperto': ParkingCircle, 'Posto auto scoperto': Car },
  disponibilita: { 'Libero subito': KeyRound, 'Libero al rogito': FileSignature, Occupato: UserRound, 'Da concordare': CalendarClock },
};

// Le schede: un tema ciascuna. `keys` = campi coinvolti (per completezza e "salta").
type Step = { id: string; title: string; sub: string; keys: string[]; optional?: boolean };
const STEPS: Step[] = [
  { id: 'tipo', title: 'Cosa stai proponendo?', sub: 'Contratto e tipologia.', keys: ['contratto', 'tipologia'] },
  { id: 'dove', title: 'Dove si trova?', sub: 'Via e città. Puoi nascondere il numero civico nell\'annuncio.', keys: ['indirizzo', 'mostra_indirizzo'] },
  { id: 'numeri', title: 'I numeri', sub: 'Prezzo, superficie e ambienti.', keys: ['prezzo', 'trattativa_riservata', 'superficie', 'locali', 'camere', 'bagni'] },
  { id: 'edificio', title: 'Piano e stato', sub: 'Come si presenta la casa.', keys: ['piano', 'piani_edificio', 'ascensore', 'stato', 'anno'], optional: true },
  { id: 'energia', title: 'Energia e impianti', sub: 'La classe energetica è obbligatoria negli annunci.', keys: ['classe_energetica', 'ipe', 'riscaldamento', 'alimentazione', 'climatizzazione', 'infissi'], optional: true },
  { id: 'interni', title: 'Gli interni', sub: 'I dettagli che rendono viva la descrizione.', keys: ['cucina', 'arredato', 'esposizione', 'dotazioni'], optional: true },
  { id: 'esterni', title: 'Spazi esterni e auto', sub: 'Tra le ricerche più usate dai compratori.', keys: ['esterni', 'superficie_esterna', 'posto_auto', 'cantina'], optional: true },
  { id: 'costi', title: 'Costi e disponibilità', sub: 'Le prime domande che fanno al telefono.', keys: ['spese_condominiali', 'portineria', 'disponibilita', 'contratto_affitto', 'cauzione', 'spese_incluse', 'proprieta'], optional: true },
  { id: 'note', title: 'Note e punti di forza', sub: 'Scrivi come parleresti a un cliente: l\'AI le usa per l\'annuncio.', keys: ['riferimento', 'virtual_tour'], optional: true },
  { id: 'foto', title: 'Le foto', sub: 'Carica le foto e riordinale trascinandole: la prima è la copertina. Potrai migliorarle con l\'AI dopo, quando vuoi.', keys: [] },
];

const filled = (v: Details[string]) => v !== undefined && v !== '' && v !== false && !(Array.isArray(v) && !v.length);

export default function NewPropertyWizard({ onCreated }: { onCreated: (p: ProjectData) => void }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [d, setD] = useState<Details>({ mostra_indirizzo: true });
  const [note, setNote] = useState('');
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [plan, setPlan] = useState<string | null>(null);
  const [ai, setAi] = useState<AiResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const restored = useRef(false);
  const [zoneBusy, setZoneBusy] = useState(false);
  const [savedAt, setSavedAt] = useState(0); // "Bozza salvata" per un attimo dopo ogni modifica
  const [publish, setPublish] = useState(true); // pubblica anche sul sito dell'agente
  const [slug, setSlug] = useState<string | null>(null);
  const done = step >= STEPS.length;
  useEffect(() => { authFetch('/api/platform/portfolio').then(r => r.json()).then(x => setSlug(x.slug ?? null)).catch(() => {}); }, []);

  // Servizi nella zona (OpenStreetMap) appena l'indirizzo e' abbastanza lungo: chip nella
  // scheda "Dove", righe in d.zona per l'AI e per la pagina della casa.
  const addr = typeof d.indirizzo === 'string' ? d.indirizzo : '';
  useEffect(() => {
    if (addr.length < 9) return;
    const t = setTimeout(async () => {
      setZoneBusy(true);
      try {
        const r = await authFetch(`/api/platform/zone?address=${encodeURIComponent(addr)}`);
        const z = r.ok ? await r.json() : null;
        const lines: string[] = (z?.pois ?? []).map((p: { categoria: string; nome: string; distanza: number }) => `${p.categoria}${p.nome !== p.categoria ? ` ${p.nome}` : ''} a ${p.distanza >= 1000 ? `${(p.distanza / 1000).toFixed(1)} km` : `${p.distanza} m`}`);
        setD(prev => (prev.indirizzo === addr ? { ...prev, zona: lines } : prev));
      } catch { /* zona facoltativa */ } finally { setZoneBusy(false); }
    }, 900);
    return () => clearTimeout(t);
  }, [addr]);

  useEffect(() => {
    try { const raw = localStorage.getItem(DRAFT_KEY); if (raw) { const x = JSON.parse(raw); setD(x.d ?? { mostra_indirizzo: true }); setNote(x.note ?? ''); } } catch { /* bozza corrotta */ }
    restored.current = true;
  }, []);
  useEffect(() => {
    if (!restored.current) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ d, note })); } catch { /* quota */ }
    const t = setTimeout(() => setSavedAt(Date.now()), 0);
    return () => clearTimeout(t);
  }, [d, note]);
  const [savedShown, setSavedShown] = useState(false);
  useEffect(() => {
    if (!savedAt) return;
    const a = setTimeout(() => setSavedShown(true), 0); const b = setTimeout(() => setSavedShown(false), 1500);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [savedAt]);

  const set = (k: string, v: Details[string]) => setD(prev => ({ ...prev, [k]: v }));
  const comp = useMemo(() => completeness(d, photos.length), [d, photos.length]);
  const cur = STEPS[step];
  const canNext = !cur || cur.optional || cur.keys.every(k => k === 'mostra_indirizzo' || k === 'trattativa_riservata' || (k === 'prezzo' ? filled(d.prezzo) || !!d.trattativa_riservata : ['locali', 'camere', 'bagni'].includes(k) || filled(d[k])));
  const go = (n: number) => { setDir(n > step ? 1 : -1); setStep(n); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }); };

  // Tastiera: Invio avanti, Esc indietro (non nei campi di testo lungo e non con un pannello aperto)
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (document.querySelector('[role=dialog]') || t.tagName === 'TEXTAREA') return;
      if (e.key === 'Enter' && !done && canNext) { e.preventDefault(); if (step < STEPS.length - 1) go(step + 1); else generate(); }
      if (e.key === 'Escape' && step > 0 && t.tagName !== 'INPUT') go(step - 1);
    };
    document.addEventListener('keydown', k);
    return () => document.removeEventListener('keydown', k);
  });

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const added = await Promise.all([...files].filter(f => f.type.startsWith('image/')).map(async f => ({ id: uid(), dataUrl: await downscaleDataUrl(await readFile(f), 1600, 0.82) })));
    setPhotos(p => [...p, ...added].slice(0, 40));
  };

  const generate = async () => {
    setDir(1); setStep(STEPS.length); setBusy('Scrivo titolo e descrizione...'); setError(null);
    try {
      const res = await authFetch('/api/platform/describe', { method: 'POST', body: JSON.stringify({ property: { ...d, note_agente: note, numero_foto: photos.length, planimetria: !!plan }, nFoto: photos.length }) });
      if (!res.ok) throw new Error();
      setAi(await res.json());
    } catch { setError('Generazione non riuscita. Riprova.'); } finally { setBusy(null); }
  };

  const save = async () => {
    if (!ai) return;
    setError(null);
    try {
      const urls: string[] = [];
      for (const [i, p] of photos.entries()) { setBusy(`Carico foto ${i + 1} di ${photos.length}...`); const u = p.url ?? await uploadDataUrl(p.dataUrl, 'properties'); if (u) urls.push(u); }
      setBusy('Salvo immobile...');
      const planUrl = plan ? await uploadDataUrl(plan, 'properties') : '';
      const thumb = photos[0] ? (photos[0].url ?? await uploadDataUrl(await downscaleDataUrl(photos[0].dataUrl, 100, 0.8), 'covers')) : '';
      const project = await createProject({
        nome: ai.titolo, titolo: ai.titolo, descrizione: ai.descrizione, addr: String(d.indirizzo ?? ''), tipologia: String(d.tipologia ?? ''),
        prezzo: Number(d.prezzo) || 0, mq: Number(d.superficie) || 0, locali: Number(d.locali) || undefined, camere: Number(d.camere) || 0, bagni: Number(d.bagni) || 0,
        cover: urls[0] ?? '', thumb,
        import_data: { source: 'platform', details: { ...d, planimetria: planUrl || undefined }, note, photos: urls, score: ai.score, suggerimenti: ai.suggerimenti },
      });
      if (!project) throw new Error();
      if (publish) await setPublic(project.id, true);
      localStorage.removeItem(DRAFT_KEY);
      onCreated(project);
    } catch { setError('Salvataggio non riuscito. Riprova.'); } finally { setBusy(null); }
  };

  // Riassunto vivo in testa: la scheda che prende forma.
  const summary = [d.tipologia, d.locali ? `${d.locali} locali` : null, d.superficie ? `${d.superficie} m²` : null, d.indirizzo ? String(d.indirizzo).split(',').slice(-1)[0].trim() : null, d.trattativa_riservata ? 'Trattativa riservata' : d.prezzo ? euro(Number(d.prezzo)) + (d.contratto === 'Affitto' ? '/mese' : '') : null].filter(Boolean).join(' · ');

  return (
    <div className="mx-auto max-w-3xl">
      {/* Testa: copertina + riassunto + progresso */}
      <div className="flex items-center gap-4">
        <a href="#/" className="text-muted hover:text-ink" aria-label="Home"><ArrowLeft size={18} /></a>
        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-canvas ring-1 ring-line">
          {photos[0] ? <img key={srcOf(photos[0])} src={srcOf(photos[0])} alt="" className="blur-in h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted"><ImagePlus size={16} /></div>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-lg font-semibold">{summary || 'Nuovo immobile nella tua vetrina'}</div>
          <div className="text-xs text-muted">{done ? 'Pronto' : `Scheda ${step + 1} di ${STEPS.length}`} · completezza <CountUp value={comp.score} duration={400} />%
            <span className={`ml-2 inline-flex items-center gap-1 text-emerald-600 ease-smooth transition-opacity ${savedShown ? 'opacity-100' : 'opacity-0'}`}><Check size={11} strokeWidth={3} /> Bozza salvata</span></div>
        </div>
        <a href="#/importa" className="hidden shrink-0 text-xs text-brand sm:block">Importa da CSV</a>
      </div>
      <div className="mt-4 flex gap-1">
        {STEPS.map((s, i) => <button key={s.id} onClick={() => i <= step && go(i)} aria-label={s.title} title={s.title} className={`h-1.5 flex-1 rounded-full ease-smooth transition-colors ${i < step || done ? 'bg-brand' : i === step ? 'bg-ink' : 'bg-line'}`} />)}
      </div>

      {/* Scheda corrente */}
      {!done && (
        <section key={cur.id} className="mt-8" style={{ animation: `${dir === 1 ? 'gnm-in-right' : 'gnm-in-left'} var(--gnm-dur) var(--gnm-ease) both` }}>
          <h1 className="font-display text-3xl font-bold tracking-tight">{cur.title}</h1>
          <p className="mt-1 text-muted">{cur.sub}</p>
          <div className="mt-7 space-y-8">
            {cur.id === 'foto' && <PhotoGrid photos={photos} setPhotos={setPhotos} onAdd={addPhotos} extra={
              // planimetria subito sotto "Aggiungi foto": stesso riquadro tratteggiato, piu' basso
              plan ? (
                // riga compatta: card 24 con padding 8, miniatura 16 (concentrica), azioni a pillola
                <div className={`mt-3 flex items-center gap-3 rounded-3xl bg-white p-2 pr-3 ${CARD_SHADOW}`}>
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-2xl bg-canvas"><img src={plan} alt="" className="h-full w-full object-contain" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-semibold"><LayoutTemplate size={14} className="text-muted" /> Planimetria</div>
                    <div className="text-xs text-muted">Pronta, andrà nell&apos;annuncio dopo le foto</div>
                  </div>
                  <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-canvas px-4 text-[13px] font-medium ease-smooth transition-colors hover:bg-line/60"><ImagePlus size={14} /> Cambia
                    <input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) setPlan(await downscaleDataUrl(await readFile(f), 2000, 0.85)); e.target.value = ''; }} />
                  </label>
                  <button onClick={() => setPlan(null)} aria-label="Togli la planimetria" className="flex h-9 w-9 items-center justify-center rounded-full text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink"><X size={16} /></button>
                </div>
              ) : (
                <label className="mt-3 flex cursor-pointer items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-line bg-white py-4 text-muted ease-smooth transition hover:border-brand hover:text-brand">
                  <LayoutTemplate size={18} /><span className="text-sm font-medium">Aggiungi planimetria</span><span className="text-xs">facoltativa, aumenta i contatti</span>
                  <input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) setPlan(await downscaleDataUrl(await readFile(f), 2000, 0.85)); e.target.value = ''; }} />
                </label>
              )} />}
            {cur.id === 'tipo' && <>
              <Cards f={F.contratto} v={d.contratto} set={v => set('contratto', v)} big />
              {d.contratto && <Cards f={F.tipologia} v={d.tipologia} set={v => set('tipologia', v)} />}
            </>}
            {cur.id === 'dove' && <>
              <TextField f={F.indirizzo} v={d.indirizzo} set={v => set('indirizzo', v)} autoFocus big />
              {typeof d.indirizzo === 'string' && d.indirizzo.length > 8 && (
                <LeafletMap addr={d.indirizzo} className="h-56 rounded-2xl bg-canvas ring-1 ring-line" />
              )}
              {addr.length >= 9 && (
                <div className="card p-4">
                  <div className="flex items-center gap-2 text-sm font-medium">Nella zona {zoneBusy && <Loader2 size={14} className="animate-spin text-muted" />}</div>
                  <p className="mt-0.5 text-xs text-muted">Servizi verificati su OpenStreetMap. Tocca quelli da mettere in evidenza nell&apos;annuncio (massimo 5): l&apos;AI parte da quelli.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {(Array.isArray(d.zona) ? d.zona : []).map(l => {
                      const ev = Array.isArray(d.zona_evidenza) ? d.zona_evidenza : [];
                      const on = ev.includes(l);
                      return (
                        <button type="button" key={l} aria-pressed={on} onClick={() => set('zona_evidenza', on ? ev.filter(x => x !== l) : ev.length < 5 ? [...ev, l] : ev)}
                          className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs ease-smooth transition-all active:scale-95 ${on ? 'btn-primary font-medium' : 'bg-canvas hover:bg-line/60'}`}>
                          <Star size={11} className={on ? 'fill-current' : 'text-muted'} /> {l}
                        </button>
                      );
                    })}
                    {!zoneBusy && !(Array.isArray(d.zona) && d.zona.length) && <span className="text-xs text-muted">Nessun servizio trovato nel raggio di 1 km.</span>}
                  </div>
                </div>
              )}
              <Toggle f={F.mostra_indirizzo} v={d.mostra_indirizzo} set={v => set('mostra_indirizzo', v)} />
            </>}
            {cur.id === 'numeri' && <>
              <div className="card p-5">
                <NumberField f={F.prezzo} v={d.prezzo} set={v => set('prezzo', v)} big disabled={!!d.trattativa_riservata} suffix={d.contratto === 'Affitto' ? '€/mese' : '€'} />
                <div className="mt-4"><Toggle f={F.trattativa_riservata} v={d.trattativa_riservata} set={v => set('trattativa_riservata', v)} /></div>
              </div>
              <NumberField f={F.superficie} v={d.superficie} set={v => set('superficie', v)} big suffix="m²" />
              <div className="grid grid-cols-3 gap-3">
                {['locali', 'camere', 'bagni'].map(k => <Counter key={k} f={F[k]} v={d[k]} set={v => set(k, v)} />)}
              </div>
            </>}
            {cur.id === 'edificio' && <>
              <Chips f={F.piano} v={d.piano} set={v => set('piano', v)} />
              <div className="grid gap-3 sm:grid-cols-2"><Counter f={F.piani_edificio} v={d.piani_edificio} set={v => set('piani_edificio', v)} /><div className="card p-4"><Toggle f={F.ascensore} v={d.ascensore} set={v => set('ascensore', v)} /></div></div>
              <Cards f={F.stato} v={d.stato} set={v => set('stato', v)} />
              <NumberField f={F.anno} v={d.anno} set={v => set('anno', v)} placeholder="1975" raw />
            </>}
            {cur.id === 'energia' && <>
              <EnergyScale v={d.classe_energetica} set={v => set('classe_energetica', v)} />
              <Cards f={F.riscaldamento} v={d.riscaldamento} set={v => set('riscaldamento', v)} />
              {d.riscaldamento && d.riscaldamento !== 'Assente' && <Chips f={F.alimentazione} v={d.alimentazione} set={v => set('alimentazione', v)} />}
              <Cards f={F.climatizzazione} v={d.climatizzazione} set={v => set('climatizzazione', v)} />
              <Chips f={F.infissi} v={d.infissi} set={v => set('infissi', v)} />
            </>}
            {cur.id === 'interni' && <>
              <Cards f={F.cucina} v={d.cucina} set={v => set('cucina', v)} />
              <Cards f={F.arredato} v={d.arredato} set={v => set('arredato', v)} />
              <Compass v={d.esposizione} set={v => set('esposizione', v)} />
              <Chips f={F.dotazioni} v={d.dotazioni} set={v => set('dotazioni', v)} multi />
            </>}
            {cur.id === 'esterni' && <>
              <Cards f={F.esterni} v={d.esterni} set={v => set('esterni', v)} multi />
              {Array.isArray(d.esterni) && d.esterni.length > 0 && <NumberField f={F.superficie_esterna} v={d.superficie_esterna} set={v => set('superficie_esterna', v)} suffix="m²" />}
              <Cards f={F.posto_auto} v={d.posto_auto} set={v => set('posto_auto', v)} />
              <div className="card p-4"><Toggle f={F.cantina} v={d.cantina} set={v => set('cantina', v)} /></div>
            </>}
            {cur.id === 'costi' && <>
              <NumberField f={F.spese_condominiali} v={d.spese_condominiali} set={v => set('spese_condominiali', v)} suffix="€/mese" />
              <Chips f={F.portineria} v={d.portineria} set={v => set('portineria', v)} />
              <Cards f={F.disponibilita} v={d.disponibilita} set={v => set('disponibilita', v)} />
              {d.contratto === 'Affitto' && <div className="space-y-6 card p-5">
                <Chips f={F.contratto_affitto} v={d.contratto_affitto} set={v => set('contratto_affitto', v)} />
                <Counter f={F.cauzione} v={d.cauzione} set={v => set('cauzione', v)} inline />
                <Toggle f={F.spese_incluse} v={d.spese_incluse} set={v => set('spese_incluse', v)} />
              </div>}
              <Chips f={F.proprieta} v={d.proprieta} set={v => set('proprieta', v)} />
            </>}
            {cur.id === 'note' && <>
              <textarea rows={6} value={note} onChange={e => setNote(e.target.value)} autoFocus placeholder="Es. vicino alla M2, zona silenziosa, vista sul parco, ristrutturato nel 2022, ideale per una famiglia..."
                className="w-full rounded-2xl bg-white p-5 text-[16px] leading-relaxed outline-none ring-1 ring-line focus:ring-2 focus:ring-brand" />
              <div className="grid gap-4 sm:grid-cols-2"><TextField f={F.riferimento} v={d.riferimento} set={v => set('riferimento', v)} /><TextField f={F.virtual_tour} v={d.virtual_tour} set={v => set('virtual_tour', v)} /></div>
            </>}
          </div>

          {/* Navigazione: fissa in basso con la sfumatura progressiva, sempre a portata (anche "Prepara l'annuncio") */}
          <div className="sticky bottom-0 z-20 mt-10 flex items-center justify-between gap-3 pb-6 pt-10">
            <div className="pointer-events-none absolute inset-x-[-24px] inset-y-0 -z-10"><ProgressiveBlur side="bottom" fade={24} /></div>
            <button onClick={() => step > 0 && go(step - 1)} disabled={step === 0} className="text-sm text-muted hover:text-ink disabled:opacity-0">Indietro <span className="hidden text-xs text-muted/60 sm:inline">Esc</span></button>
            <div className="flex items-center gap-3">
              {cur.optional && step < STEPS.length - 1 && <button onClick={() => go(step + 1)} className="text-sm text-muted hover:text-ink">Salta</button>}
              {step < STEPS.length - 1
                ? <button onClick={() => go(step + 1)} disabled={!canNext} className="flex items-center gap-2 btn-ink rounded-full px-6 py-3 text-sm font-semibold">Avanti <ArrowRight size={16} /><span className="ml-1 hidden text-xs font-normal text-white/50 sm:inline">Invio</span></button>
                : <button onClick={generate} className="flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand/90 active:scale-[0.98]"><Sparkles size={16} /> Prepara l&apos;annuncio</button>}
            </div>
          </div>
        </section>
      )}

      {/* Pronto per il portale: tutto da copiare e incollare, foto pronte, pubblicazione sul sito */}
      {done && (
        <section className="mt-8" style={{ animation: 'gnm-in-right var(--gnm-dur) var(--gnm-ease) both' }}>
          <h1 className="font-display text-3xl font-bold tracking-tight">Pronto per la tua vetrina e per il portale</h1>
          <p className="mt-1 text-muted">Copia e incolla su immobiliare.it, idealista o dove pubblichi. E lo hai anche sul tuo sito.</p>
          {busy && <div className="mt-6 flex items-center gap-2 text-muted"><Loader2 size={18} className="animate-spin" /> {busy}</div>}
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {ai && (
            <div className={`mt-8 space-y-6 ${busy ? 'pointer-events-none opacity-50' : ''}`}>
              {/* Completezza e cosa manca */}
              <div className="rise flex flex-wrap items-center gap-5 card p-5" style={{ animationDelay: '.05s' }}>
                <div className="font-display text-4xl font-bold tracking-tight"><CountUp value={comp.score} />%</div>
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-semibold">Completezza dell&apos;annuncio</div>
                  {comp.missing.length ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {comp.missing.slice(0, 6).map(f => {
                        const at = STEPS.findIndex(st => st.keys.includes(f.key));
                        return <button key={f.key} onClick={() => at >= 0 && go(at)} className="rounded-full bg-canvas px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-black/10 hover:bg-white">+ {f.label}</button>;
                      })}
                    </div>
                  ) : <div className="mt-1 text-sm text-muted">Tutti i dati principali ci sono.</div>}
                </div>
              </div>

              {/* Titolo e descrizione */}
              <div className="rise card p-5" style={{ animationDelay: '.12s' }}>
                <div className="text-xs font-semibold text-muted">Titolo <span className={`ml-1 font-normal ${ai.titolo.length > 60 ? 'text-rose-600' : ''}`}>{ai.titolo.length}/60</span></div>
                <div className="relative mt-1.5">
                  <input value={ai.titolo} onChange={e => setAi({ ...ai, titolo: e.target.value })} className="w-full rounded-2xl bg-canvas px-4 py-3 pr-12 font-medium outline-none ease-smooth transition-colors focus:bg-white focus:ring-1 focus:ring-ink/15" />
                  <CopyIcon text={ai.titolo} center />
                </div>
                <div className="mt-5 text-xs font-semibold text-muted">Descrizione</div>
                <div className="relative mt-1.5">
                  <textarea rows={14} value={ai.descrizione} onChange={e => setAi({ ...ai, descrizione: e.target.value })} className="w-full rounded-2xl bg-canvas px-4 py-3 pr-12 text-[15px] leading-relaxed outline-none ease-smooth transition-colors focus:bg-white focus:ring-1 focus:ring-ink/15" />
                  <CopyIcon text={ai.descrizione} />
                </div>
              </div>

              {/* Campi del portale nell'ordine della scheda, ognuno da copiare */}
              <PortalFields d={d} />

              {/* Foto nell'ordine giusto, gia' migliorate */}
              {photos.length > 0 && <ReadyPhotos photos={photos} title={ai.titolo} onEdit={() => go(STEPS.findIndex(st => st.id === 'foto'))} />}

              {/* Sito dell'agente */}
              <div className="rise card p-5" style={{ animationDelay: '.3s' }}>
                <button type="button" role="switch" aria-checked={publish} onClick={() => setPublish(v => !v)} className="flex w-full items-center justify-between gap-4 text-left">
                  <span><span className="text-sm font-semibold">Pubblica nella tua vetrina AgenteImmo</span>
                    <span className="block text-xs text-muted">{slug ? `Comparirà su ${portfolioUrl(slug).replace(/^https?:\/\//, '')}` : 'Comparirà nella tua pagina con tutte le tue case.'}</span></span>
                  <span className={`relative h-7 w-12 shrink-0 rounded-full ease-smooth transition-colors ${publish ? 'bg-brand' : 'bg-line'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow ease-smooth transition-all ${publish ? 'left-6' : 'left-1'}`} /></span>
                </button>
              </div>

              {!!ai.suggerimenti.length && <div className="card p-5"><div className="text-sm font-semibold">Per migliorare ancora</div><ul className="mt-2 space-y-1.5 text-sm text-muted">{ai.suggerimenti.map(x => <li key={x} className="flex gap-2"><span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-brand" />{x}</li>)}</ul></div>}

              <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
                <button onClick={() => go(STEPS.length - 1)} className="text-sm text-muted hover:text-ink">Modifica i dati</button>
                <div className="flex gap-2">
                  <button onClick={generate} className="btn-ghost rounded-full px-5 py-3 text-sm font-medium">Riscrivi</button>
                  <button onClick={save} className="flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand/90"><Check size={16} strokeWidth={3} /> Salva immobile</button>
                </div>
              </div>
            </div>
          )}
          {!ai && !busy && <button onClick={generate} className="mt-6 btn-ink rounded-full px-6 py-3 text-sm font-semibold">Riprova</button>}
        </section>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ controlli

type SetV = (v: Details[string]) => void;
const sel = (on: boolean) => on ? 'sel-glow' : 'ring-1 ring-line bg-white hover:ring-ink/30';

function Label({ f }: { f: Field }) { return <div className="mb-3 text-sm font-medium">{f.label}</div>; }

// Grandi card con icona (singola o multipla).
function Cards({ f, v, set, big, multi }: { f: Field; v: Details[string]; set: SetV; big?: boolean; multi?: boolean }) {
  const icons = ICONS[f.key] ?? {};
  const arr = Array.isArray(v) ? v : [];
  const on = (o: string) => multi ? arr.includes(o) : v === o;
  const pick = (o: string) => multi ? set(arr.includes(o) ? arr.filter(x => x !== o) : [...arr, o]) : set(v === o ? undefined : o);
  return (
    <div>
      <Label f={f} />
      <div className={`grid gap-3 ${big ? 'grid-cols-2' : 'grid-cols-2 sm:grid-cols-3'}`}>
        {f.options!.map(o => { const I = icons[o]; return (
          <button type="button" key={o} onClick={() => pick(o)} aria-pressed={on(o)}
            className={`relative flex flex-col items-start gap-3 rounded-2xl p-4 text-left ease-smooth transition-all active:scale-[0.98] ${big ? 'min-h-28' : ''} ${sel(on(o))}`}>
            {I && <I size={big ? 26 : 20} className={on(o) ? 'text-brand' : 'text-muted'} />}
            <span className={`text-sm ${on(o) ? 'font-semibold text-ink' : 'font-medium'}`}>{o}</span>
            {on(o) && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white"><Check size={12} /></span>}
          </button>
        ); })}
      </div>
    </div>
  );
}

function Chips({ f, v, set, multi }: { f: Field; v: Details[string]; set: SetV; multi?: boolean }) {
  const arr = Array.isArray(v) ? v : [];
  const on = (o: string) => multi ? arr.includes(o) : v === o;
  return (
    <div>
      <Label f={f} />
      <div className="flex flex-wrap gap-2">
        {f.options!.map(o => <button type="button" key={o} aria-pressed={on(o)} onClick={() => multi ? set(arr.includes(o) ? arr.filter(x => x !== o) : [...arr, o]) : set(v === o ? undefined : o)}
          className={`rounded-full px-4 py-2 text-sm ease-smooth transition-all active:scale-95 ${on(o) ? 'btn-primary font-medium' : 'bg-white ring-1 ring-line hover:ring-ink/30'}`}>{o}</button>)}
      </div>
    </div>
  );
}

function Toggle({ f, v, set }: { f: Field; v: Details[string]; set: SetV }) {
  return (
    <button type="button" role="switch" aria-checked={!!v} onClick={() => set(!v || undefined)} className="flex w-full items-center justify-between gap-4 text-left">
      <span><span className="text-sm font-medium">{f.label}</span>{f.hint && <span className="block text-xs text-muted">{f.hint}</span>}</span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${v ? 'bg-brand' : 'bg-line'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${v ? 'left-6' : 'left-1'}`} /></span>
    </button>
  );
}

function Counter({ f, v, set, inline }: { f: Field; v: Details[string]; set: SetV; inline?: boolean }) {
  const n = Number(v) || 0;
  return (
    <div className={inline ? 'flex items-center justify-between' : 'card p-4 text-center'}>
      <div className={`text-sm font-medium ${inline ? '' : 'text-muted'}`}>{f.label}{f.unit && <span className="text-muted"> ({f.unit})</span>}</div>
      <div className={`flex items-center justify-center gap-3 ${inline ? '' : 'mt-3'}`}>
        <button type="button" aria-label="Meno" onClick={() => set(n > 1 ? n - 1 : undefined)} disabled={!n} className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas ease-smooth transition active:scale-90 disabled:opacity-30"><Minus size={16} /></button>
        <span className="w-8 font-display text-2xl font-bold">{n || '–'}</span>
        <button type="button" aria-label="Più" onClick={() => set(n + 1)} className="flex h-10 w-10 items-center justify-center btn-primary rounded-full ease-smooth transition active:scale-90"><Plus size={16} /></button>
      </div>
    </div>
  );
}

function NumberField({ f, v, set, big, suffix, disabled, placeholder, raw }: { f: Field; v: Details[string]; set: SetV; big?: boolean; suffix?: string; disabled?: boolean; placeholder?: string; raw?: boolean }) {
  const shown = v === undefined ? '' : raw ? String(v) : Number(v).toLocaleString('it-IT');
  return (
    <div>
      <Label f={f} />
      <div className={`flex items-center rounded-2xl bg-white ring-1 ring-line focus-within:ring-2 focus-within:ring-brand ${disabled ? 'opacity-40' : ''}`}>
        <input inputMode="numeric" disabled={disabled} value={shown} placeholder={placeholder ?? f.placeholder ?? '0'}
          onChange={e => { const n = Number(e.target.value.replace(/\D/g, '')); set(n ? n : undefined); }}
          className={`min-w-0 flex-1 bg-transparent px-5 outline-none ${big ? 'py-4 font-display text-3xl font-bold' : 'py-3 text-base'}`} />
        {(suffix ?? f.unit) && <span className={`pr-5 text-muted ${big ? 'text-xl' : 'text-sm'}`}>{suffix ?? f.unit}</span>}
      </div>
    </div>
  );
}

function TextField({ f, v, set, autoFocus, big }: { f: Field; v: Details[string]; set: SetV; autoFocus?: boolean; big?: boolean }) {
  return (
    <div>
      <Label f={f} />
      <input autoFocus={autoFocus} value={typeof v === 'string' ? v : ''} placeholder={f.placeholder} onChange={e => set(e.target.value || undefined)}
        className={`w-full rounded-2xl bg-white px-5 outline-none ring-1 ring-line focus:ring-2 focus:ring-brand ${big ? 'py-4 text-xl' : 'py-3 text-base'}`} />
    </div>
  );
}

// Classe energetica: la scala colorata dell'APE, si tocca la lettera.
function EnergyScale({ v, set }: { v: Details[string]; set: SetV }) {
  const colors = ENERGY_COLORS;
  return (
    <div>
      <Label f={F.classe_energetica} />
      <div className="flex flex-wrap items-end gap-1.5">
        {Object.entries(colors).map(([k, c]) => (
          <button type="button" key={k} onClick={() => set(v === k ? undefined : k)} aria-pressed={v === k}
            // colori pieni con la scritta in contrasto (bianco sul giallo non si leggeva); scelta piu' alta con il bordo
            className={`flex w-12 items-center justify-center rounded-lg text-sm font-bold ease-smooth transition-all active:scale-95 ${v === k ? 'h-14 ring-2 ring-ink ring-offset-2' : 'h-10 hover:brightness-95'}`} style={{ background: c, color: inkOn(c) }}>{k}</button>
        ))}
        <button type="button" onClick={() => set(v === 'In attesa' ? undefined : 'In attesa')} className={`h-10 rounded-lg px-3 text-sm ${v === 'In attesa' ? 'bg-ink text-white' : 'bg-white ring-1 ring-line'}`}>In attesa</button>
      </div>
    </div>
  );
}

// Esposizione: una bussola, si toccano i punti cardinali.
function Compass({ v, set }: { v: Details[string]; set: SetV }) {
  const arr = Array.isArray(v) ? v : [];
  const t = (o: string) => set(arr.includes(o) ? arr.filter(x => x !== o) : [...arr, o]);
  const btn = (o: string, cls: string) => (
    <button type="button" key={o} onClick={() => t(o)} aria-pressed={arr.includes(o)} className={`absolute flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold ease-smooth transition-all active:scale-90 ${cls} ${arr.includes(o) ? 'bg-brand text-white' : 'bg-white ring-1 ring-line'}`}>{o[0]}</button>
  );
  return (
    <div>
      <Label f={F.esposizione} />
      <div className="flex items-center gap-6">
        <div className="relative h-40 w-40 shrink-0 rounded-full bg-canvas ring-1 ring-line">
          {btn('Nord', 'left-1/2 top-2 -translate-x-1/2')}{btn('Sud', 'bottom-2 left-1/2 -translate-x-1/2')}{btn('Est', 'right-2 top-1/2 -translate-y-1/2')}{btn('Ovest', 'left-2 top-1/2 -translate-y-1/2')}
          <SunIcon size={18} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500" />
        </div>
        <p className="text-sm text-muted">{arr.length ? `Esposizione ${arr.join(', ').toLowerCase()}` : 'Tocca i lati verso cui affacciano le finestre principali.'}</p>
      </div>
    </div>
  );
}

// Foto: solo caricamento e ordine (trascina su desktop, frecce e "Copertina" a tap su mobile). Niente AI qui:
// si creano l'immobile e le foto senza cambiare schermata, i miglioramenti si fanno dopo (chat, Galleria).
function PhotoGrid({ photos, setPhotos, onAdd, extra }: { photos: Photo[]; setPhotos: (fn: (p: Photo[]) => Photo[]) => void; onAdd: (f: FileList | null) => void; extra?: React.ReactNode }) {
  const [drag, setDrag] = useState<number | null>(null);
  const [over, setOver] = useState<number | null>(null);
  const move = (from: number, to: number) => setPhotos(p => { if (to < 0 || to >= p.length || from === to) return p; const n = [...p]; const [x] = n.splice(from, 1); n.splice(to, 0, x); return n; });

  return (
    <div>
      <label onDragOver={e => e.preventDefault()} onDrop={e => { if (e.dataTransfer.files.length) { e.preventDefault(); onAdd(e.dataTransfer.files); } }}
        className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-3xl border-2 border-dashed border-line bg-white text-muted ease-smooth transition hover:border-brand hover:text-brand ${photos.length ? 'py-6' : 'py-16'}`}>
        <ImagePlus size={photos.length ? 22 : 34} />
        <span className="text-sm font-medium">{photos.length ? 'Aggiungi altre foto' : 'Trascina qui le foto o clicca per sceglierle'}</span>
        {!photos.length && <span className="text-xs">Consigliate almeno 10: tutte le stanze, esterni e vista</span>}
        <input type="file" accept="image/*" multiple className="hidden" onChange={e => { onAdd(e.target.files); e.target.value = ''; }} />
      </label>
      {extra}


      {photos.length > 0 && (
        <ul className="mt-4 grid grid-flow-dense grid-cols-2 gap-3 sm:grid-cols-3">
          {/* griglia a righe uguali: la copertina occupa 2x2 (su desktop) e combacia con le due foto accanto */}
          {photos.map((p, i) => (
            <li key={p.id} draggable onDragStart={() => setDrag(i)} onDragEnd={() => { setDrag(null); setOver(null); }} onDragOver={e => { e.preventDefault(); setOver(i); }}
              onDrop={e => { e.preventDefault(); if (drag !== null) move(drag, i); setDrag(null); setOver(null); }}
              className={`group relative overflow-hidden rounded-2xl bg-canvas ring-2 ease-smooth transition ${i === 0 ? 'col-span-2 aspect-[16/9] sm:row-span-2 sm:aspect-auto sm:min-h-[280px]' : 'aspect-[4/3]'} ${over === i && drag !== i ? 'ring-brand' : 'ring-transparent'} ${drag === i ? 'opacity-40' : ''} cursor-grab`}>
              {/* immagine assoluta: non allunga la riga della griglia; verticali intere con lo sfondo sfocato */}
              <div key={srcOf(p)} className="blur-in pointer-events-none absolute inset-0"><FitImage src={srcOf(p)} /></div>
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-ink/75 px-2.5 py-1 text-xs text-white">{i === 0 ? <><Star size={11} /> Copertina</> : <><GripVertical size={11} /> {i + 1}</>}</span>
              <button onClick={() => setPhotos(ps => ps.filter(x => x.id !== p.id))} aria-label="Rimuovi foto" className="absolute right-2 top-2 rounded-full bg-white/90 p-1 opacity-0 ease-smooth transition group-hover:opacity-100 max-md:opacity-100"><X size={14} /></button>
              <div className="absolute inset-x-2 bottom-2 flex justify-between opacity-0 ease-smooth transition group-hover:opacity-100 max-md:opacity-100">
                <button onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="Sposta prima" className="rounded-full bg-white/90 p-1.5 disabled:opacity-0"><ArrowLeft size={14} /></button>
                {i > 0 && <button onClick={() => move(i, 0)} className="rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium">Copertina</button>}
                <button onClick={() => move(i, i + 1)} disabled={i === photos.length - 1} aria-label="Sposta dopo" className="rounded-full bg-white/90 p-1.5 disabled:opacity-0"><ArrowRight size={14} /></button>
              </div>
            </li>
          ))}
        </ul>
      )}

    </div>
  );
}

// Tutti i campi compilati, nell'ordine della scheda del portale, ognuno da copiare.
function PortalFields({ d }: { d: Details }) {
  const rows = ALL_FIELDS.filter(f => !['mostra_indirizzo', 'trattativa_riservata'].includes(f.key) && visible(f, d))
    .map(f => ({ key: f.key, label: f.label, value: formatValue(f, d[f.key]) }))
    .filter((x): x is { key: string; label: string; value: string } => !!x.value);
  const [copied, setCopied] = useState<string | null>(null);
  const copy = (k: string, t: string) => { navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(null), 1500); };
  if (!rows.length) return null;
  return (
    <div className="rise card p-5" style={{ animationDelay: '.18s' }}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">Campi del portale</div>
        <button onClick={() => copy('*', rows.map(r => `${r.label}: ${r.value}`).join('\n'))} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-muted hover:bg-canvas hover:text-ink">
          {copied === '*' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />} Copia tutti</button>
      </div>
      <dl className="mt-3 divide-y divide-line">
        {rows.map(r => (
          <div key={r.key} className="group flex items-center justify-between gap-4 py-2 text-sm">
            <dt className="text-muted">{r.label}</dt>
            <dd className="flex items-center gap-2 text-right font-medium">{r.value}
              <button onClick={() => copy(r.key, r.value)} aria-label={`Copia ${r.label}`} className="rounded-full p-1 text-muted opacity-0 ease-smooth transition group-hover:opacity-100 hover:bg-canvas hover:text-ink max-md:opacity-100">
                {copied === r.key ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}</button>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// Foto pronte da caricare, nell'ordine scelto: scarica tutto in un unico file .zip.
function ReadyPhotos({ photos, title, onEdit }: { photos: Photo[]; title: string; onEdit: () => void }) {
  const [zipping, setZipping] = useState(false);
  const download = async () => {
    setZipping(true);
    try {
      const JSZip = (await import('jszip')).default;
      const zip = new JSZip();
      await Promise.all(photos.map(async (p, i) => zip.file(`${String(i + 1).padStart(2, '0')}${i === 0 ? '-copertina' : ''}.jpg`, await (await fetch(srcOf(p))).blob())));
      const blob = await zip.generateAsync({ type: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = `${(title || 'foto-annuncio').replace(/[^a-z0-9]+/gi, '-').toLowerCase()}.zip`;
      a.click();
      setTimeout(() => URL.revokeObjectURL(a.href), 5000);
    } finally { setZipping(false); }
  };
  return (
    <div className="rise card p-5" style={{ animationDelay: '.24s' }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><div className="text-sm font-semibold">Foto, nell&apos;ordine giusto</div><div className="text-xs text-muted">{photos.length} foto{photos.some(p => p.ai) ? `, ${photos.filter(p => p.ai).length} migliorate con l'AI` : ''}. Caricale sul portale in quest&apos;ordine.</div></div>
        <div className="flex gap-2">
          <button onClick={onEdit} className="btn-ghost rounded-full px-4 py-2 text-sm font-medium">Modifica foto</button>
          <button onClick={download} disabled={zipping} className="flex items-center gap-1.5 btn-ink rounded-full px-4 py-2 text-sm font-semibold">{zipping ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />} Scarica tutte</button>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-4 gap-2 sm:grid-cols-6">
        {photos.map((p, i) => (
          <div key={p.id} className="relative aspect-[4/3] overflow-hidden rounded-xl bg-canvas">
            <img src={srcOf(p)} alt="" className="h-full w-full object-cover" />
            <span className="absolute left-1 top-1 rounded-full bg-ink/75 px-1.5 text-[10px] font-semibold text-white">{i + 1}</span>
            {p.ai && <span className="absolute right-1 top-1 rounded-full bg-brand px-1.5 text-[10px] font-semibold text-white">AI</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
