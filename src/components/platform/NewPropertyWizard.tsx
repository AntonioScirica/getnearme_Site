'use client';

import LeafletMap from '@/components/ui/LeafletMap';
import { useEffect, useMemo, useRef, useState, type ComponentType } from 'react';
import {
  ArrowLeft, ArrowRight, Ban, Building, Building2, CalendarClock, Car, Check, ChefHat, Crown, DoorOpen, Fence, FileSignature,
  Flame, Flower2, GripVertical, Hammer, Home, ImagePlus, KeyRound, LayoutTemplate, Loader2, Minus, Plus, Snowflake, Sofa, Sparkles,
  Star, Sun as SunIcon, Tag, Tent, ThumbsUp, TreePine, UserRound, Utensils, Warehouse, Waves, X, ParkingCircle, CircleCheck, Copy,
} from 'lucide-react';
import { createProject, type ProjectData } from '@/lib/projects';
import { downscaleDataUrl, uploadDataUrl } from '@/lib/imageUpload';
import ProgressiveBlur from '@/components/ProgressiveBlur';
import { createPortal } from 'react-dom';
import FitImage from '@/components/ui/FitImage';
import { ALL_FIELDS, completeness, ENERGY_COLORS, inkOn, formatValue, visible, type Details, type Field } from '@/lib/propertyFields';
import { zoneOnly } from '@/lib/siteTemplates';
import { authFetch, CARD_SHADOW, portfolioUrl, setPublic } from './api';
import { CopyIcon } from './ImproveView';
import CountUp from './CountUp';
import { useCredits } from './PlanView';
import { pageLocale, tr, trf } from './i18n';

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
const euro = (n: number) => `€ ${n.toLocaleString(pageLocale())}`;

// Icone per le opzioni che meritano una card (le altre restano chip).
const ICONS: Record<string, Record<string, Icon>> = {
  contratto: { Vendita: Tag, Affitto: KeyRound },
  tipologia: { Monolocale: Building2, Bilocale: Building2, Trilocale: Building2, Quadrilocale: Building2, Villetta: Home, Appartamento: Building2, Attico: Crown, Mansarda: Tent, Loft: Warehouse, Villa: Home, 'Villetta a schiera': Fence, 'Casa indipendente': Home, Terratetto: Building, 'Rustico / Casale': TreePine },
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
  { id: 'tipo', title: tr('Cosa stai proponendo?', 'What are you offering?'), sub: tr('Contratto e tipologia.', 'Contract and property type.'), keys: ['contratto', 'tipologia'] },
  { id: 'dove', title: tr('Dove si trova?', 'Where is it?'), sub: tr('Via e città. Puoi nascondere il numero civico nell\'annuncio.', 'Street and city. You can hide the house number in the listing.'), keys: ['indirizzo', 'mostra_indirizzo'] },
  { id: 'numeri', title: tr('I numeri', 'The numbers'), sub: tr('Prezzo, superficie e ambienti.', 'Price, floor area and rooms.'), keys: ['prezzo', 'trattativa_riservata', 'superficie', 'locali', 'camere', 'bagni'] },
  { id: 'edificio', title: tr('Piano e stato', 'Floor and condition'), sub: tr('Come si presenta la casa.', 'What shape the property is in.'), keys: ['piano', 'piani_edificio', 'ascensore', 'stato', 'anno'], optional: true },
  { id: 'energia', title: tr('Energia e impianti', 'Energy and systems'), sub: tr('La classe energetica è obbligatoria negli annunci.', 'The energy class is required in listings.'), keys: ['classe_energetica', 'ipe', 'riscaldamento', 'alimentazione', 'emissione', 'climatizzazione', 'infissi', 'materiale_infissi'], optional: true },
  { id: 'interni', title: tr('Gli interni', 'The interior'), sub: tr('I dettagli che rendono viva la descrizione.', 'The details that bring the description to life.'), keys: ['cucina', 'arredato', 'esposizione', 'dotazioni'], optional: true },
  { id: 'esterni', title: tr('Spazi esterni e auto', 'Outdoor space and parking'), sub: tr('Tra le ricerche più usate dai compratori.', 'Among the searches buyers use most.'), keys: ['esterni', 'superficie_esterna', 'posto_auto', 'cantina'], optional: true },
  { id: 'costi', title: tr('Costi e disponibilità', 'Costs and availability'), sub: tr('Le prime domande che fanno al telefono.', 'The first questions people ask on the phone.'), keys: ['spese_condominiali', 'portineria', 'accesso_disabili', 'disponibilita', 'contratto_affitto', 'cauzione', 'spese_incluse', 'proprieta'], optional: true },
  { id: 'note', title: tr('Codice e tour virtuale', 'Reference and virtual tour'), sub: tr('Il codice di riferimento è quello del tuo gestionale: serve a ritrovare l\'immobile e ad aggiornarlo quando reimporti il file.', 'The reference code is the one from your CRM: it helps find the property and update it when you re-import the file.'), keys: ['riferimento', 'virtual_tour'], optional: true },
  { id: 'foto', title: tr('Le foto', 'The photos'), sub: tr('Carica le foto e mettile in ordine: la prima è la copertina. Potrai migliorarle con l\'AI dopo, quando vuoi.', 'Upload the photos and put them in order: the first one is the cover. You can enhance them with AI later, whenever you like.'), keys: [] },
];

const filled = (v: Details[string]) => v !== undefined && v !== '' && v !== false && !(Array.isArray(v) && !v.length);

export default function NewPropertyWizard({ onCreated }: { onCreated: (p: ProjectData) => void }) {
  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<1 | -1>(1);
  const [d, setD] = useState<Details>({ mostra_indirizzo: false });
  const [note, setNote] = useState('');
  const [zoneOpen, setZoneOpen] = useState(false); // servizi della zona: compatti finche' non si apre
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [plan, setPlan] = useState<string | null>(null);
  const [ai, setAi] = useState<AiResult | null>(null);
  const [manual, setManual] = useState(false); // senza crediti: titolo e descrizione li scrive l'agente, l'immobile si salva lo stesso
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const restored = useRef(false);
  const [zoneBusy, setZoneBusy] = useState(false);
  const [savedAt, setSavedAt] = useState(0); // "Bozza salvata" per un attimo dopo ogni modifica
  const [publishOn, setPublish] = useState(true); // pubblica anche sul sito dell'agente
  // solo con un piano col sito (Plus, Pro): con Starter o senza piano niente interruttore acceso per finta
  const cr = useCredits();
  const siteOk = !!cr && (!!cr.unlimited || cr.plan === 'plus' || cr.plan === 'pro');
  const publish = publishOn && siteOk;
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

  // bozza di un immobile lasciato a meta': non si riprende da sola (sembrava di modificare un immobile esistente),
  // si chiede se continuarla o iniziare da capo. Finche' non si sceglie la bozza resta salvata com'e'.
  const [pending, setPending] = useState<{ d?: Details; note?: string; step?: number } | null>(null);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(DRAFT_KEY);
      const x = raw ? JSON.parse(raw) as { d?: Details; note?: string; step?: number } : null;
      if (x && (Object.keys(x.d ?? {}).some(k => k !== 'mostra_indirizzo') || x.note)) { setPending(x); return; } // eslint-disable-line react-hooks/set-state-in-effect
    } catch { /* bozza corrotta */ }
    restored.current = true;
  }, []);
  const resume = (yes: boolean) => {
    if (yes && pending) { setD(pending.d ?? { mostra_indirizzo: false }); setNote(pending.note ?? ''); if (pending.step) setStep(pending.step); } // si riparte dalla scheda dove si era rimasti
    else localStorage.removeItem(DRAFT_KEY);
    setPending(null); restored.current = true;
  };
  useEffect(() => {
    if (!restored.current) return;
    try { localStorage.setItem(DRAFT_KEY, JSON.stringify({ d, note, step: Math.min(step, STEPS.length - 1) })); } catch { /* quota */ }
    const t = setTimeout(() => setSavedAt(Date.now()), 0);
    return () => clearTimeout(t);
  }, [d, note, step]);
  const [savedShown, setSavedShown] = useState(false);
  useEffect(() => {
    if (!savedAt) return;
    const a = setTimeout(() => setSavedShown(true), 0); const b = setTimeout(() => setSavedShown(false), 1500);
    return () => { clearTimeout(a); clearTimeout(b); };
  }, [savedAt]);

  // Bilocale, Trilocale...: i locali si compilano da soli (se non li ha gia' scritti)
  const ROOMS_OF: Record<string, number> = { Monolocale: 1, Bilocale: 2, Trilocale: 3, Quadrilocale: 4 };
  const set = (k: string, v: Details[string]) => setD(prev => ({ ...prev, [k]: v, ...(k === 'tipologia' && ROOMS_OF[String(v)] && !prev.locali ? { locali: ROOMS_OF[String(v)] } : {}) }));
  const comp = useMemo(() => completeness(d, photos.length), [d, photos.length]);
  const cur = STEPS[step];
  // valori impossibili (prezzo 3 €, 3 m²): non si va avanti finche' non si correggono
  const tooLow = (k: string) => !!F[k]?.min && filled(d[k]) && Number(d[k]) < F[k].min!;
  const canNext = !cur || cur.keys.every(k => !tooLow(k)) && (cur.optional || cur.keys.every(k => k === 'mostra_indirizzo' || k === 'trattativa_riservata' || (k === 'prezzo' ? filled(d.prezzo) || !!d.trattativa_riservata : ['locali', 'camere', 'bagni'].includes(k) || filled(d[k]))));
  // tornando dal riepilogo a un passo, si rientra all'annuncio con un clic (senza rifare i passi ne' rigenerare)
  const [back, setBack] = useState(false);
  const go = (n: number) => { setDir(n > step ? 1 : -1); setStep(n); document.querySelector('main')?.scrollTo({ top: 0, behavior: 'smooth' }); };

  // Tastiera: Invio avanti, Esc indietro (non nei campi di testo lungo e non con un pannello aperto)
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (document.querySelector('[role=dialog]') || t.tagName === 'TEXTAREA') return;
      if (e.key === 'Enter' && !done && canNext) { e.preventDefault(); if (back && ai) { setBack(false); go(STEPS.length); } else if (step < STEPS.length - 1) go(step + 1); else generate(); }
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

  const generate = async (auto?: boolean) => {
    const distanze = auto ?? d.distanze_auto !== false;
    setDir(1); setStep(STEPS.length); setBusy(tr('Scrivo titolo e descrizione...', 'Writing title and description...')); setError(null);
    try {
      // distanze automatiche: se la ricerca dei servizi non e' ancora arrivata, la si fa ora
      let zona = Array.isArray(d.zona) ? d.zona : [];
      if (distanze && !zona.length && addr.length >= 9) {
        setBusy(tr('Cerco i servizi vicini...', 'Looking for nearby services...'));
        const z = await authFetch(`/api/platform/zone?address=${encodeURIComponent(addr)}`).then(r => (r.ok ? r.json() : null)).catch(() => null);
        zona = (z?.pois ?? []).map((p: { categoria: string; nome: string; distanza: number }) => `${p.categoria}${p.nome !== p.categoria ? ` ${p.nome}` : ''} a ${p.distanza >= 1000 ? `${(p.distanza / 1000).toFixed(1)} km` : `${p.distanza} m`}`);
        if (zona.length) setD(prev => ({ ...prev, zona }));
        setBusy(tr('Scrivo titolo e descrizione...', 'Writing title and description...'));
      }
      // tutti i dati compilati, con etichetta e valore leggibili (es. "Classe energetica: G", "Spese condominiali: 120 €/mese")
      // indirizzo nascosto: all'AI (e nella bozza) solo zona e citta', mai il civico
      const hide = (f: Field, v: string) => (f.key === 'indirizzo' && !d.mostra_indirizzo ? zoneOnly(v) : v);
      const dati = ALL_FIELDS.filter(f => visible(f, d)).map(f => { const v = formatValue(f, d[f.key]); return v ? `${f.label}: ${hide(f, v)}` : null; }).filter(Boolean);
      const res = await authFetch('/api/platform/describe', { method: 'POST', headers: { 'x-no-modal': '1' }, body: JSON.stringify({ property: { dati, ...d, ...(d.indirizzo && !d.mostra_indirizzo ? { indirizzo: zoneOnly(String(d.indirizzo)) } : {}), zona, distanze_auto: distanze, note_agente: note, numero_foto: photos.length, planimetria: !!plan }, nFoto: photos.length }) });
      if (res.status === 402) {
        // niente crediti per l'AI: bozza di titolo e descrizione dai dati, l'agente la rifinisce e salva
        const city = d.indirizzo ? String(d.indirizzo).split(',').slice(-1)[0].trim() : '';
        const titolo = [d.tipologia, d.locali ? `${d.locali} ${tr('locali', 'rooms')}` : '', city].filter(Boolean).join(', ').slice(0, 60);
        setManual(true);
        setAi({ titolo, descrizione: [note, ...dati].filter(Boolean).join('\n'), score: 0, suggerimenti: [] });
        return;
      }
      if (!res.ok) throw new Error();
      setManual(false);
      setAi(await res.json());
    } catch { setError(tr('Generazione non riuscita. Riprova.', 'Generation failed. Please try again.')); } finally { setBusy(null); }
  };

  const [saving, setSaving] = useState<{ n: number; total: number; label: string } | null>(null);
  const save = async () => {
    if (!ai) return;
    setError(null);
    // avanzamento reale: una tacca per foto caricata, poi planimetria/copertina e salvataggio
    const total = photos.length + 2;
    setSaving({ n: 0, total, label: tr('Preparo il salvataggio', 'Preparing to save') });
    try {
      const urls: string[] = [];
      for (const [i, p] of photos.entries()) { setSaving({ n: i, total, label: tr(`Carico la foto ${i + 1} di ${photos.length}`, `Uploading photo ${i + 1} of ${photos.length}`) }); const u = p.url ?? await uploadDataUrl(p.dataUrl, 'properties'); if (u) urls.push(u); }
      setSaving({ n: photos.length, total, label: plan ? tr('Carico la planimetria', 'Uploading the floor plan') : tr('Preparo la copertina', 'Preparing the cover') });
      const planUrl = plan ? await uploadDataUrl(plan, 'properties') : '';
      const thumb = photos[0] ? (photos[0].url ?? await uploadDataUrl(await downscaleDataUrl(photos[0].dataUrl, 100, 0.8), 'covers')) : '';
      setSaving({ n: photos.length + 1, total, label: publish ? tr('Salvo e pubblico sul tuo sito', 'Saving and publishing to your site') : tr('Salvo l’immobile', 'Saving the property') });
      const project = await createProject({
        nome: ai.titolo, titolo: ai.titolo, descrizione: ai.descrizione, addr: String(d.indirizzo ?? ''), tipologia: String(d.tipologia ?? ''),
        prezzo: Number(d.prezzo) || 0, mq: Number(d.superficie) || 0, locali: Number(d.locali) || undefined, camere: Number(d.camere) || 0, bagni: Number(d.bagni) || 0, riferimento: d.riferimento ? String(d.riferimento) : undefined,
        cover: urls[0] ?? '', thumb,
        import_data: { source: 'platform', details: { ...d, planimetria: planUrl || undefined }, note, photos: urls, score: ai.score, suggerimenti: ai.suggerimenti },
      });
      if (!project) throw new Error();
      if (publish) await setPublic(project.id, true);
      localStorage.removeItem(DRAFT_KEY);
      setSaving({ n: total, total, label: tr('Fatto', 'Done') });
      onCreated(project);
    } catch { setError(tr('Salvataggio non riuscito. Riprova.', 'Save failed. Please try again.')); } finally { setBusy(null); setSaving(null); }
  };

  // Riassunto vivo in testa: la scheda che prende forma.
  const summary = [d.tipologia, d.locali ? `${d.locali} ${tr('locali', 'rooms')}` : null, d.superficie ? `${d.superficie} m²` : null, d.indirizzo ? String(d.indirizzo).split(',').slice(-1)[0].trim() : null, d.trattativa_riservata ? tr('Trattativa riservata', 'Price on request') : d.prezzo ? euro(Number(d.prezzo)) + (d.contratto === 'Affitto' ? tr('/mese', '/month') : '') : null].filter(Boolean).join(' · ');

  if (pending) return (
    <div className="mx-auto mt-10 max-w-md rounded-[28px] bg-white p-6 text-center shadow-sm ring-1 ring-black/5">
      <h2 className="font-display text-xl font-bold">{tr('Hai un immobile lasciato a metà', 'You have an unfinished property')}</h2>
      <p className="mt-2 text-sm text-muted">{[pending.d?.tipologia, pending.d?.indirizzo].filter(Boolean).map(String).join(', ') || tr('Bozza senza indirizzo', 'Draft without address')}</p>
      <div className="mt-5 flex flex-col gap-2 sm:flex-row sm:justify-center">
        <button type="button" onClick={() => resume(true)} className="h-11 rounded-full bg-ink px-5 text-sm font-semibold text-white">{tr('Continua la bozza', 'Continue the draft')}</button>
        <button type="button" onClick={() => resume(false)} className="h-11 rounded-full px-5 text-sm font-semibold text-brand ring-1 ring-black/10 hover:bg-canvas">{tr('Inizia un immobile nuovo', 'Start a new property')}</button>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-3xl">
      {/* Salvataggio: finestra con l'avanzamento reale (foto caricate) */}
      {saving && createPortal(
        <div className="blur-in fixed inset-0 z-[260] flex items-center justify-center bg-black/40 p-6 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-[32px] bg-white p-6 shadow-2xl">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-2xl bg-canvas">{photos[0] && <img src={srcOf(photos[0])} alt="" className="h-full w-full object-cover" />}</div>
              <div className="min-w-0"><div className="truncate font-semibold">{ai?.titolo || tr('Il tuo immobile', 'Your property')}</div><div className="text-sm text-muted">{saving.label}</div></div>
            </div>
            <div className="mt-5 h-2 overflow-hidden rounded-full bg-canvas">
              <div className="h-full rounded-full bg-brand ease-smooth transition-[width]" style={{ width: `${Math.round((saving.n / saving.total) * 100)}%` }} />
            </div>
            <div className="mt-2 text-right text-xs font-medium text-muted">{Math.round((saving.n / saving.total) * 100)}%</div>
          </div>
        </div>,
        document.body,
      )}
      {/* Testa: copertina + riassunto + progresso, solo durante le schede: all'ultimo passo (AI che scrive e annuncio pronto)
          non serve, si torna ai dati dai bottoni di "Mancano ancora" */}
      {!done && <>
      <div className="flex items-center gap-4">
        {/* freccia = passo precedente (dal primo passo torna alla home) */}
        <button type="button" onClick={() => { if (done && ai) setBack(true); if (step > 0) go(Math.min(step, STEPS.length) - 1); else location.hash = '#/'; }} className="flex h-9 w-9 items-center justify-center rounded-full text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink" aria-label={step > 0 ? tr('Passo precedente', 'Previous step') : 'Home'}><ArrowLeft size={18} /></button>
        <div className="h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-canvas ring-1 ring-line">
          {photos[0] ? <img key={srcOf(photos[0])} src={srcOf(photos[0])} alt="" className="blur-in h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-muted"><ImagePlus size={16} /></div>}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate font-display text-lg font-semibold">{summary || tr('Nuovo immobile nella tua vetrina', 'New property in your showcase')}</div>
          <div className="text-xs text-muted">{done ? tr('Pronto', 'Ready') : tr(`Scheda ${step + 1} di ${STEPS.length}`, `Step ${step + 1} of ${STEPS.length}`)} · {tr('completezza', 'completeness')} <CountUp value={comp.score} duration={400} />%
            <span className={`ml-2 inline-flex items-center gap-1 text-emerald-600 ease-smooth transition-opacity ${savedShown ? 'opacity-100' : 'opacity-0'}`}><Check size={11} strokeWidth={3} /> {tr('Bozza salvata', 'Draft saved')}</span></div>
        </div>
        <a href="#/importa" className="hidden shrink-0 text-xs text-brand sm:block">{tr('Importa da link o CSV', 'Import from link or CSV')}</a>
      </div>
      {/* telefono: ogni segmento ha un'area di tocco alta 40px attorno alla barretta */}
      <div className="mt-1 flex gap-1 sm:mt-4">
        {STEPS.map((s, i) => <button key={s.id} onClick={() => i <= step && go(i)} aria-label={s.title} title={s.title} className="flex h-10 flex-1 items-center sm:h-1.5"><span className={`block h-1.5 w-full rounded-full ease-smooth transition-colors ${i < step || done ? 'bg-brand' : i === step ? 'bg-ink' : 'bg-line'}`} /></button>)}
      </div>
      </>}

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
                  <div className="relative h-14 w-20 shrink-0 overflow-hidden rounded-2xl bg-canvas"><img src={plan} alt="" className="h-full w-full object-cover" /></div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5 text-sm font-semibold"><LayoutTemplate size={14} className="text-muted" /> {tr('Planimetria', 'Floor plan')}</div>
                    <div className="text-xs text-muted">{tr('Pronta, andrà nell\'annuncio dopo le foto', 'Ready, it will go in the listing after the photos')}</div>
                  </div>
                  <label className="flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-canvas px-4 text-[13px] font-medium ease-smooth transition-colors hover:bg-line/60"><ImagePlus size={14} /> {tr('Cambia', 'Change')}
                    <input type="file" accept="image/*" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) setPlan(await downscaleDataUrl(await readFile(f), 2000, 0.85)); e.target.value = ''; }} />
                  </label>
                  <button onClick={() => setPlan(null)} aria-label={tr('Togli la planimetria', 'Remove the floor plan')} className="flex h-9 w-9 items-center justify-center rounded-full text-muted ease-smooth transition-colors hover:bg-canvas hover:text-ink"><X size={16} /></button>
                </div>
              ) : (
                <label className="mt-3 flex cursor-pointer flex-wrap items-center justify-center gap-x-2 gap-y-1 rounded-3xl border-2 border-dashed border-line bg-white px-4 py-4 text-center text-muted ease-smooth transition hover:border-brand hover:text-brand">
                  <LayoutTemplate size={18} /><span className="text-sm font-medium">{tr('Aggiungi planimetria', 'Add floor plan')}</span><span className="basis-full text-xs sm:basis-auto">{tr('facoltativa, aumenta i contatti', 'optional, brings more leads')}</span>
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
                  <div className="flex items-center gap-2 text-sm font-medium">{tr('Nella zona', 'In the area')} {zoneBusy && <Loader2 size={14} className="animate-spin text-muted" />}</div>
                  <p className="mt-0.5 text-xs text-muted">{tr('Servizi verificati su OpenStreetMap. Tocca quelli da mettere in evidenza nell\'annuncio (massimo 5): l\'AI parte da quelli.', 'Services verified on OpenStreetMap. Tap the ones to highlight in the listing (up to 5): the AI starts from those.')}</p>
                  {/* chiusa: due righe di servizi e una sfumatura; un clic mostra tutto */}
                  <div className={`relative mt-3 overflow-hidden ease-smooth transition-[max-height] duration-[600ms] ${zoneOpen ? 'max-h-[1200px]' : 'max-h-[76px]'}`}>
                  <div className="flex flex-wrap gap-2">
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
                    {!zoneBusy && !(Array.isArray(d.zona) && d.zona.length) && <span className="text-xs text-muted">{tr('Nessun servizio trovato nel raggio di 1 km.', 'No services found within 1 km.')}</span>}
                  </div>
                  {!zoneOpen && Array.isArray(d.zona) && d.zona.length > 6 && (
                    <button type="button" onClick={() => setZoneOpen(true)} className="absolute inset-x-0 bottom-0 flex h-12 items-end justify-center bg-gradient-to-t from-white via-white/90 to-transparent text-xs font-semibold text-brand">
                      {tr(`Vedi tutti i ${d.zona.length} servizi`, `See all ${d.zona.length} places`)}
                    </button>
                  )}
                  </div>
                </div>
              )}
              <Toggle f={F.mostra_indirizzo} v={d.mostra_indirizzo} set={v => set('mostra_indirizzo', v)} />
            </>}
            {cur.id === 'numeri' && <>
              <div className="card p-5">
                <NumberField f={F.prezzo} v={d.prezzo} set={v => set('prezzo', v)} big disabled={!!d.trattativa_riservata} suffix={d.contratto === 'Affitto' ? tr('€/mese', '€/month') : '€'} />
                <div className="mt-4"><Toggle f={F.trattativa_riservata} v={d.trattativa_riservata} set={v => set('trattativa_riservata', v)} /></div>
              </div>
              <NumberField f={F.superficie} v={d.superficie} set={v => set('superficie', v)} big suffix="m²" />
              <div className="grid gap-3 sm:grid-cols-3">{/* telefono: un contatore per riga */}
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
              <NumberField f={F.ipe} v={d.ipe} set={v => set('ipe', v)} suffix="kWh/m²a" />
              <Cards f={F.riscaldamento} v={d.riscaldamento} set={v => set('riscaldamento', v)} />
              {d.riscaldamento && d.riscaldamento !== 'Assente' && <Chips f={F.alimentazione} v={d.alimentazione} set={v => set('alimentazione', v)} />}
              {d.riscaldamento && d.riscaldamento !== 'Assente' && <Chips f={F.emissione} v={d.emissione} set={v => set('emissione', v)} />}
              <Cards f={F.climatizzazione} v={d.climatizzazione} set={v => set('climatizzazione', v)} />
              <Chips f={F.infissi} v={d.infissi} set={v => set('infissi', v)} />
              <Chips f={F.materiale_infissi} v={d.materiale_infissi} set={v => set('materiale_infissi', v)} />
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
              <NumberField f={F.spese_condominiali} v={d.spese_condominiali} set={v => set('spese_condominiali', v)} suffix={tr('€/mese', '€/month')} />
              <Chips f={F.portineria} v={d.portineria} set={v => set('portineria', v)} />
              <div className="card p-4"><Toggle f={F.accesso_disabili} v={d.accesso_disabili} set={v => set('accesso_disabili', v)} /></div>
              <Cards f={F.disponibilita} v={d.disponibilita} set={v => set('disponibilita', v)} />
              {d.contratto === 'Affitto' && <div className="space-y-6 card p-5">
                <Chips f={F.contratto_affitto} v={d.contratto_affitto} set={v => set('contratto_affitto', v)} />
                <Counter f={F.cauzione} v={d.cauzione} set={v => set('cauzione', v)} inline />
                <Toggle f={F.spese_incluse} v={d.spese_incluse} set={v => set('spese_incluse', v)} />
              </div>}
              <Chips f={F.proprieta} v={d.proprieta} set={v => set('proprieta', v)} />
            </>}
            {cur.id === 'note' && <>
              <div className="grid gap-4 sm:grid-cols-2"><TextField f={{ ...F.riferimento, label: tr('Codice di riferimento (opzionale)', 'Reference code (optional)') }} v={d.riferimento} set={v => set('riferimento', v)} /><TextField f={F.virtual_tour} v={d.virtual_tour} set={v => set('virtual_tour', v)} /></div>
            </>}
          </div>

          {/* Navigazione: sempre in fondo allo schermo (anche con poco contenuto), con la sfumatura progressiva.
              In un portal: un antenato con animazione (transform) ancorerebbe il fixed alla pagina */}
          <div className="h-28" aria-hidden />
          {createPortal(
          <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 pb-6 pt-12">
            <div className="absolute inset-0"><ProgressiveBlur side="bottom" fade={24} /></div>
            <div className="pointer-events-auto relative mx-auto flex max-w-3xl items-center justify-between gap-3 px-6">
            <span />
            <div className="flex items-center gap-3">
              {cur.optional && step < STEPS.length - 1 && <button onClick={() => go(step + 1)} className="text-sm text-brand hover:text-brand/70">{tr('Salta', 'Skip')}</button>}
              {back && ai && <button onClick={() => { setBack(false); go(STEPS.length); }} className="flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand/90">{tr('Torna all\'annuncio', 'Back to the listing')} <ArrowRight size={16} /></button>}
              {back && ai ? null : step < STEPS.length - 1
                ? <button onClick={() => go(step + 1)} disabled={!canNext} className="flex items-center gap-2 btn-ink rounded-full px-6 py-3 text-sm font-semibold">{tr('Avanti', 'Next')} <ArrowRight size={16} /><span className="ml-1 hidden text-xs font-normal text-white/50 sm:inline">{tr('Invio', 'Enter')}</span></button>
                : <button onClick={() => generate()} className="flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand/90 active:scale-[0.98]">{tr('Continua creazione', 'Continue')} <ArrowRight size={16} /></button>}
            </div>
            </div>
          </div>,
          document.body,
          )}
        </section>
      )}

      {/* Pronto per il portale: tutto da copiare e incollare, foto pronte, pubblicazione sul sito */}
      {done && (
        <section className={ai ? 'mt-8' : 'flex min-h-[70vh] flex-col items-center justify-center text-center'} style={{ animation: 'gnm-in-right var(--gnm-dur) var(--gnm-ease) both' }}>
          <h1 className="font-display text-3xl font-bold tracking-tight">{cr && !siteOk ? tr('Quasi pronto', 'Almost ready') : tr('Quasi pronto per il tuo sito', 'Almost ready for your site')}</h1>
          {busy && <div className="mt-6 flex items-center gap-2 text-muted"><Loader2 size={18} className="animate-spin" /> {busy}</div>}
          {!ai && !busy && error && <button onClick={() => generate()} className="mt-5 rounded-full bg-ink px-5 py-2.5 text-sm font-semibold text-white">{tr('Riprova', 'Try again')}</button>}
          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
          {ai && (
            <div className={`mt-8 space-y-6 ${busy ? 'pointer-events-none opacity-50' : ''}`}>
              {/* Completezza e cosa manca */}
              <div className="rise flex flex-wrap items-center gap-5 card p-5" style={{ animationDelay: '.05s' }}>
                <div className="font-display text-4xl font-bold tracking-tight"><CountUp value={comp.score} />%</div>
                <div className="min-w-0 flex-1">
                  {/* anche le foto contano: servono almeno 12 per il punteggio pieno */}
                  <div className="text-sm font-semibold">{comp.missing.length || photos.length < 12 ? tr('Mancano ancora', 'Still missing') : tr('Completezza dell’annuncio', 'Listing completeness')}</div>
                  {comp.missing.length || photos.length < 12 ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {photos.length < 12 && <button onClick={() => { setBack(true); go(STEPS.findIndex(st => st.id === 'foto')); }} className="rounded-full bg-canvas px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-black/10 hover:bg-white">{12 - photos.length === 1 ? tr('Un’altra foto', 'One more photo') : tr(`Altre ${12 - photos.length} foto`, `${12 - photos.length} more photos`)}</button>}
                      {comp.missing.slice(0, 6).map(f => {
                        const at = STEPS.findIndex(st => st.keys.includes(f.key));
                        return <button key={f.key} onClick={() => { if (at >= 0) { setBack(true); go(at); } }} className="rounded-full bg-canvas px-3 py-1.5 text-xs font-medium ring-1 ring-inset ring-black/10 hover:bg-white">{trf(f.label)}</button>;
                      })}
                    </div>
                  ) : <div className="mt-1 text-sm text-muted">{tr('Tutti i dati principali ci sono.', 'All the key details are there.')}</div>}
                </div>
              </div>

              {/* Titolo e descrizione */}
              <div className="rise card p-5" style={{ animationDelay: '.12s' }}>
                {manual && <p className="mb-4 rounded-2xl bg-canvas px-4 py-3 text-sm text-muted">{tr('Titolo e descrizione scritti dall’AI sono nei piani. Intanto ti abbiamo preparato una bozza con i tuoi dati: sistemala e salva l’immobile.', 'AI titles and descriptions come with a plan. Meanwhile here is a draft from your details: edit it and save the property.')} <a href="#/piano?cambia=1" className="font-medium text-brand">{tr('Vedi i piani', 'See plans')}</a></p>}
                <div className="text-xs font-semibold text-muted">{tr('Titolo', 'Title')} <span className={`ml-1 font-normal ${ai.titolo.length > 60 ? 'text-rose-600' : ''}`}>{ai.titolo.length}/60</span></div>
                <div className="relative mt-1.5">
                  <input value={ai.titolo} onChange={e => setAi({ ...ai, titolo: e.target.value })} className="w-full rounded-2xl bg-canvas px-4 py-3 pr-12 font-medium outline-none ease-smooth transition-colors focus:bg-white focus:ring-1 focus:ring-ink/15" />
                  <CopyIcon text={ai.titolo} center />
                </div>
                <div className="mt-5 text-xs font-semibold text-muted">{tr('Descrizione', 'Description')}</div>
                <div className="relative mt-1.5">
                  <textarea rows={14} value={ai.descrizione} onChange={e => setAi({ ...ai, descrizione: e.target.value })} className="w-full rounded-2xl bg-canvas px-4 py-3 pr-12 text-[15px] leading-relaxed outline-none ease-smooth transition-colors focus:bg-white focus:ring-1 focus:ring-ink/15" />
                  <CopyIcon text={ai.descrizione} />
                </div>
              </div>

              {/* Campi del portale nell'ordine della scheda, ognuno da copiare */}
              <PortalFields d={d} />

              {/* Foto nell'ordine giusto, gia' migliorate */}
              {photos.length > 0 && <ReadyPhotos photos={photos} title={ai.titolo} />}

              {/* Sito dell'agente */}
              {cr && !siteOk ? (
                <div className="rise card p-5 text-sm" style={{ animationDelay: '.3s' }}>
                  <span className="font-semibold">{tr('La casa resta salvata qui, la vedi solo tu', 'The property stays saved here, only you can see it')}</span>
                  <span className="block text-muted">{tr('Il tuo sito con le case è nei piani Plus e Pro.', 'Your website with your properties comes with Plus and Pro.')} <a href="#/piano?cambia=1" className="font-medium text-brand">{tr('Vedi i piani', 'See plans')}</a></span>
                </div>
              ) : (
              <div className="rise card p-5" style={{ animationDelay: '.3s' }}>
                <button type="button" role="switch" aria-checked={publish} onClick={() => setPublish(v => !v)} className="flex w-full items-center justify-between gap-4 text-left">
                  <span><span className="text-sm font-semibold">{tr('Pubblica nella tua vetrina Agente Immo', 'Publish in your Agente Immo showcase')}</span>
                    <span className="block text-xs text-muted">{slug ? tr(`Comparirà su ${portfolioUrl(slug).replace(/^https?:\/\//, '')}`, `It will appear on ${portfolioUrl(slug).replace(/^https?:\/\//, '')}`) : tr('Comparirà nella tua pagina con tutte le tue case.', 'It will appear on your page with all your properties.')}</span></span>
                  <span className={`relative h-7 w-12 shrink-0 rounded-full ease-smooth transition-colors ${publish ? 'bg-brand' : 'bg-line'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow ease-smooth transition-all ${publish ? 'left-6' : 'left-1'}`} /></span>
                </button>
              </div>
              )}

              {/* Cose vicine: attivo di base. Distanze dai servizi nella descrizione e "Cosa c'e' vicino" sulla scheda del sito.
                  Cambiandolo, titolo e descrizione si riscrivono */}
              <div className="rise card p-5" style={{ animationDelay: '.35s' }}>
                <button type="button" role="switch" aria-checked={d.distanze_auto !== false} disabled={!!busy}
                  onClick={() => { const on = d.distanze_auto === false; setD(prev => ({ ...prev, distanze_auto: on })); generate(on); }}
                  className="flex w-full items-center justify-between gap-4 text-left">
                  <span><span className="text-sm font-semibold">{tr('Aggiungo io cosa c\'è vicino', 'Add what is nearby for me')}</span>
                    <span className="block text-xs text-muted">{tr('Distanze da metro, scuole, supermercati e parchi nella descrizione, e l\'elenco dei servizi vicini sulla scheda del tuo sito.', 'Distances to metro, schools, supermarkets and parks in the description, and a list of nearby services on your site\'s property page.')}</span></span>
                  <span className={`relative h-7 w-12 shrink-0 rounded-full ease-smooth transition-colors ${d.distanze_auto !== false ? 'bg-brand' : 'bg-line'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow ease-smooth transition-all ${d.distanze_auto !== false ? 'left-6' : 'left-1'}`} /></span>
                </button>
              </div>


              <div className="flex flex-wrap items-center justify-between gap-3 pb-6">
                <button onClick={() => go(STEPS.length - 1)} className="min-h-10 text-sm text-muted hover:text-ink md:min-h-0">{tr('Modifica i dati', 'Edit details')}</button>
                <div className="flex gap-2">
                  <button onClick={save} className="flex items-center gap-2 rounded-full bg-brand px-6 py-3 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand/90"><Check size={16} strokeWidth={3} /> {tr('Salva immobile', 'Save property')}</button>
                </div>
              </div>
            </div>
          )}
          {!ai && !busy && <button onClick={() => generate()} className="mt-6 btn-ink rounded-full px-6 py-3 text-sm font-semibold">{tr('Riprova', 'Retry')}</button>}
        </section>
      )}
    </div>
  );
}

// ------------------------------------------------------------------ controlli

type SetV = (v: Details[string]) => void;
const sel = (on: boolean) => on ? 'sel-glow' : 'ring-1 ring-line bg-white hover:ring-ink/30';

function Label({ f }: { f: Field }) { return <div className="mb-3 text-sm font-medium">{trf(f.label)}</div>; }

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
            <span className={`text-sm ${on(o) ? 'font-semibold text-ink' : 'font-medium'}`}>{trf(o)}</span>
            {on(o) && <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-brand text-white"><Check size={12} /></span>}
          </button>
        ); })}
      </div>
    </div>
  );
}

export function Chips({ f, v, set, multi }: { f: Field; v: Details[string]; set: SetV; multi?: boolean }) {
  const arr = Array.isArray(v) ? v : [];
  const on = (o: string) => multi ? arr.includes(o) : v === o;
  return (
    <div>
      <Label f={f} />
      <div className="flex flex-wrap gap-2">
        {f.options!.map(o => <button type="button" key={o} aria-pressed={on(o)} onClick={() => multi ? set(arr.includes(o) ? arr.filter(x => x !== o) : [...arr, o]) : set(v === o ? undefined : o)}
          className={`rounded-full px-4 py-2 text-sm ease-smooth transition-all active:scale-95 ${on(o) ? 'btn-primary font-medium' : 'bg-white ring-1 ring-line hover:ring-ink/30'}`}>{trf(o)}</button>)}
      </div>
    </div>
  );
}

export function Toggle({ f, v, set }: { f: Field; v: Details[string]; set: SetV }) {
  return (
    <button type="button" role="switch" aria-checked={!!v} onClick={() => set(!v || undefined)} className="flex w-full items-center justify-between gap-4 text-left">
      <span><span className="text-sm font-medium">{trf(f.label)}</span>{f.hint && <span className="block text-xs text-muted">{trf(f.hint)}</span>}</span>
      <span className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${v ? 'bg-brand' : 'bg-line'}`}><span className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition-all ${v ? 'left-6' : 'left-1'}`} /></span>
    </button>
  );
}

export function Counter({ f, v, set, inline }: { f: Field; v: Details[string]; set: SetV; inline?: boolean }) {
  const n = Number(v) || 0;
  return (
    // telefono: etichetta a sinistra e - valore + a destra; da sm la card centrata come prima
    <div className={inline ? 'flex items-center justify-between' : 'card flex items-center justify-between gap-3 p-4 sm:block sm:text-center'}>
      <div className={`text-sm font-medium ${inline ? '' : 'text-muted'}`}>{trf(f.label)}{f.unit && <span className="text-muted"> ({trf(f.unit)})</span>}</div>
      <div className={`flex shrink-0 items-center justify-center gap-3 ${inline ? '' : 'sm:mt-3'}`}>
        <button type="button" aria-label={tr('Meno', 'Less')} onClick={() => set(n > 1 ? n - 1 : undefined)} disabled={!n} className="flex h-10 w-10 items-center justify-center rounded-full bg-canvas ease-smooth transition active:scale-90 disabled:opacity-30"><Minus size={16} /></button>
        <span className="w-8 text-center font-display text-2xl font-bold">{n || '–'}</span>
        <button type="button" aria-label={tr('Più', 'More')} onClick={() => set(n + 1)} className="flex h-10 w-10 items-center justify-center btn-primary rounded-full ease-smooth transition active:scale-90"><Plus size={16} /></button>
      </div>
    </div>
  );
}

export function NumberField({ f, v, set, big, suffix, disabled, placeholder, raw }: { f: Field; v: Details[string]; set: SetV; big?: boolean; suffix?: string; disabled?: boolean; placeholder?: string; raw?: boolean }) {
  // IPE e simili hanno i decimali (142,5): prima la virgola spariva e diventava 1425
  const dec = f.key === 'ipe';
  const [typed, setTyped] = useState<string | null>(null); // "142," mentre si scrive, prima che diventi numero
  const shown = typed ?? (v === undefined ? '' : raw ? String(v) : dec ? String(v).replace('.', ',') : Number(v).toLocaleString(pageLocale()));
  return (
    <div>
      <Label f={f} />
      <div className={`flex items-center rounded-2xl bg-white ring-1 ring-line focus-within:ring-2 focus-within:ring-brand ${disabled ? 'opacity-40' : ''}`}>
        <input disabled={disabled} value={shown} placeholder={placeholder ?? (f.placeholder ? trf(f.placeholder) : '0')}
          onChange={e => {
            if (dec) { const t = e.target.value.replace(/[^\d,.]/g, '').replace('.', ','); setTyped(t); const n = Number(t.replace(',', '.')); set(n ? n : undefined); return; }
            const n = Number(e.target.value.replace(/\D/g, '')); set(n ? n : undefined);
          }} onBlur={() => setTyped(null)}
          inputMode={dec ? 'decimal' : 'numeric'} className={`min-w-0 flex-1 bg-transparent px-5 outline-none ${big ? 'py-4 font-display text-3xl font-bold' : 'py-3 text-base'}`} />
        {(suffix ?? f.unit) && <span className={`pr-5 text-muted ${big ? 'text-xl' : 'text-sm'}`}>{suffix ?? trf(f.unit)}</span>}
      </div>
      {f.min && v !== undefined && Number(v) > 0 && Number(v) < f.min && <p className="mt-1.5 text-sm text-rose-600">{tr(`Sembra troppo basso: controlla (almeno ${f.min} ${suffix ?? trf(f.unit)}).`, `Looks too low: please check (at least ${f.min} ${suffix ?? trf(f.unit)}).`)}</p>}
    </div>
  );
}

export function TextField({ f, v, set, autoFocus, big }: { f: Field; v: Details[string]; set: SetV; autoFocus?: boolean; big?: boolean }) {
  return (
    <div>
      <Label f={f} />
      <input autoFocus={autoFocus} value={typeof v === 'string' ? v : ''} placeholder={trf(f.placeholder)} onChange={e => set(e.target.value || undefined)}
        className={`w-full rounded-2xl bg-white px-5 outline-none ring-1 ring-line focus:ring-2 focus:ring-brand ${big ? 'py-4 text-xl' : 'py-3 text-base'}`} />
    </div>
  );
}

// Classe energetica: la scala colorata dell'APE, si tocca la lettera.
export function EnergyScale({ v, set }: { v: Details[string]; set: SetV }) {
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
        <button type="button" onClick={() => set(v === 'In attesa' ? undefined : 'In attesa')} className={`h-10 rounded-lg px-3 text-sm ${v === 'In attesa' ? 'bg-ink text-white' : 'bg-white ring-1 ring-line'}`}>{tr('In attesa', 'Pending')}</button>
      </div>
    </div>
  );
}

// Esposizione: una bussola, si toccano i punti cardinali.
const DIR_EN: Record<string, string> = { Nord: 'North', Sud: 'South', Est: 'East', Ovest: 'West' };
function Compass({ v, set }: { v: Details[string]; set: SetV }) {
  const arr = Array.isArray(v) ? v : [];
  const t = (o: string) => set(arr.includes(o) ? arr.filter(x => x !== o) : [...arr, o]);
  const btn = (o: string, cls: string) => (
    <button type="button" key={o} onClick={() => t(o)} aria-pressed={arr.includes(o)} className={`absolute flex h-12 w-12 items-center justify-center rounded-full text-sm font-semibold ease-smooth transition-all active:scale-90 ${cls} ${arr.includes(o) ? 'bg-brand text-white' : 'bg-white ring-1 ring-line'}`}>{tr(o[0], DIR_EN[o][0])}</button>
  );
  return (
    <div>
      <Label f={F.esposizione} />
      <div className="flex items-center gap-6">
        <div className="relative h-40 w-40 shrink-0 rounded-full bg-canvas ring-1 ring-line">
          {btn('Nord', 'left-1/2 top-2 -translate-x-1/2')}{btn('Sud', 'bottom-2 left-1/2 -translate-x-1/2')}{btn('Est', 'right-2 top-1/2 -translate-y-1/2')}{btn('Ovest', 'left-2 top-1/2 -translate-y-1/2')}
          <SunIcon size={18} className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-amber-500" />
        </div>
        <p className="text-sm text-muted">{arr.length ? tr(`Esposizione ${arr.join(', ').toLowerCase()}`, `Facing ${arr.map(o => DIR_EN[o] ?? o).join(', ').toLowerCase()}`) : tr('Tocca i lati verso cui affacciano le finestre principali.', 'Tap the sides the main windows face.')}</p>
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
        <span className="text-sm font-medium">{photos.length ? tr('Aggiungi altre foto', 'Add more photos') : <><span className="[@media(hover:none)]:hidden">{tr('Trascina qui le foto o clicca per sceglierle', 'Drag the photos here or click to choose them')}</span><span className="hidden [@media(hover:none)]:inline">{tr('Tocca per scegliere le foto', 'Tap to choose the photos')}</span></>}</span>
        {!photos.length && <span className="text-xs">{tr('Consigliate almeno 10: tutte le stanze, esterni e vista', 'At least 10 recommended: every room, the outside and the view')}</span>}
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
              <span className="absolute left-2 top-2 flex items-center gap-1 rounded-full bg-ink/75 px-2.5 py-1 text-xs text-white">{i === 0 ? <><Star size={11} /> {tr('Copertina', 'Cover')}</> : <><GripVertical size={11} /> {i + 1}</>}</span>
              <button onClick={() => setPhotos(ps => ps.filter(x => x.id !== p.id))} aria-label={tr('Rimuovi foto', 'Remove photo')} className="absolute right-2 top-2 flex items-center justify-center rounded-full bg-white/90 p-1 opacity-0 max-md:h-9 max-md:w-9 ease-smooth transition group-hover:opacity-100 max-md:opacity-100"><X size={14} /></button>
              <div className="absolute inset-x-2 bottom-2 flex justify-between opacity-0 ease-smooth transition group-hover:opacity-100 max-md:opacity-100">
                <button onClick={() => move(i, i - 1)} disabled={i === 0} aria-label={tr('Sposta prima', 'Move earlier')} className="flex items-center justify-center rounded-full bg-white/90 p-1.5 disabled:opacity-0 max-md:h-9 max-md:w-9"><ArrowLeft size={14} /></button>
                {/* telefono: solo la stella, 36x36 (la scritta non ci stava tra le frecce) */}
                {i > 0 && <button onClick={() => move(i, 0)} aria-label={tr('Copertina', 'Cover')} className="flex items-center justify-center rounded-full bg-white/90 px-2.5 py-1 text-xs font-medium max-md:h-9 max-md:w-9 max-md:p-0"><Star size={14} className="md:hidden" /><span className="max-md:hidden">{tr('Copertina', 'Cover')}</span></button>}
                <button onClick={() => move(i, i + 1)} disabled={i === photos.length - 1} aria-label={tr('Sposta dopo', 'Move later')} className="flex items-center justify-center rounded-full bg-white/90 p-1.5 disabled:opacity-0 max-md:h-9 max-md:w-9"><ArrowRight size={14} /></button>
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
    .map(f => ({ key: f.key, label: trf(f.label), value: formatValue(f, d[f.key]) }))
    .filter((x): x is { key: string; label: string; value: string } => !!x.value);
  const [copied, setCopied] = useState<string | null>(null);
  const [edges, setEdges] = useState({ top: false, bottom: rows.length > 7 });
  const fadeMask = `linear-gradient(to bottom, ${edges.top ? 'transparent' : '#000'}, #000 24px, #000 calc(100% - 40px), ${edges.bottom ? 'transparent' : '#000'})`;
  const copy = (k: string, t: string) => { navigator.clipboard.writeText(t); setCopied(k); setTimeout(() => setCopied(null), 1500); };
  if (!rows.length) return null;
  return (
    <div className="rise card p-5" style={{ animationDelay: '.18s' }}>
      <div className="flex items-center justify-between">
        <div className="text-sm font-semibold">{tr('Campi del portale', 'Portal fields')}</div>
        <button onClick={() => copy('*', rows.map(r => `${r.label}: ${r.value}`).join('\n'))} className="flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium text-muted hover:bg-canvas hover:text-ink max-md:h-10">
          {copied === '*' ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />} {tr('Copia tutti', 'Copy all')}</button>
      </div>
      {/* sfumata solo dove la lista continua: in alto se hai scorso, in basso finche' non sei in fondo */}
      <dl onScroll={e => { const el = e.currentTarget; setEdges({ top: el.scrollTop > 2, bottom: el.scrollTop + el.clientHeight < el.scrollHeight - 2 }); }}
        className="mt-3 max-h-72 divide-y divide-line overflow-y-auto pr-1 [scrollbar-width:thin]"
        style={{ maskImage: fadeMask, WebkitMaskImage: fadeMask }}>
        {rows.map(r => (
          <div key={r.key} className="group flex items-center justify-between gap-4 py-2 text-sm">
            <dt className="text-muted">{r.label}</dt>
            <dd className="flex items-center gap-2 text-right font-medium">{r.value}
              <button onClick={() => copy(r.key, r.value)} aria-label={`${tr('Copia', 'Copy')} ${r.label}`} className="flex items-center justify-center rounded-full p-1 text-muted opacity-0 max-md:-my-2 max-md:h-10 max-md:w-10 ease-smooth transition group-hover:opacity-100 hover:bg-canvas hover:text-ink max-md:opacity-100">
                {copied === r.key ? <Check size={13} className="text-emerald-500" /> : <Copy size={13} />}</button>
            </dd>
          </div>
        ))}
      </dl>
    </div>
  );
}

// Foto pronte, nell'ordine scelto.
function ReadyPhotos({ photos }: { photos: Photo[]; title?: string }) {
  return (
    <div className="rise card p-5" style={{ animationDelay: '.24s' }}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div><div className="text-sm font-semibold">{tr('Foto, nell\'ordine giusto', 'Photos, in the right order')}</div><div className="text-xs text-muted">{photos.length} {tr('foto', 'photos')}{photos.some(p => p.ai) ? `, ${photos.filter(p => p.ai).length} ${tr('migliorate con l\'AI', 'enhanced with AI')}` : ''}. {tr('Caricale sul portale in quest\'ordine.', 'Upload them to the portal in this order.')}</div></div>
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
