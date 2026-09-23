'use client';

import { useState } from 'react';
import { ArrowLeft, ImagePlus, Loader2, Sparkles, X } from 'lucide-react';
import { authFetch } from './api';
import { createProject, type ProjectData } from '@/lib/projects';
import { downscaleDataUrl, uploadDataUrl } from '@/lib/imageUpload';

const TIPOLOGIE = ['Appartamento', 'Attico', 'Villa', 'Villetta a schiera', 'Loft', 'Rustico', 'Ufficio', 'Negozio'];
const CLASSI = ['A4', 'A3', 'A2', 'A1', 'B', 'C', 'D', 'E', 'F', 'G'];
const CARATTERISTICHE = ['Ascensore', 'Balcone', 'Terrazzo', 'Giardino', 'Box auto', 'Posto auto', 'Cantina', 'Aria condizionata', 'Arredato', 'Portineria'];

type Form = {
  tipologia: string; contratto: 'Vendita' | 'Affitto'; addr: string;
  prezzo: string; mq: string; locali: string; camere: string; bagni: string;
  piano: string; classe: string; caratteristiche: string[]; note: string;
};
type Photo = { name: string; dataUrl: string };
type AiResult = { titolo: string; descrizione: string; score: number; suggerimenti: string[] };

const num = (v: string) => (v ? Number(v.replace(/\D/g, '')) || 0 : 0);
const readFile = (f: File) => new Promise<string>((res, rej) => {
  const r = new FileReader(); r.onload = () => res(r.result as string); r.onerror = rej; r.readAsDataURL(f);
});

const input = 'w-full rounded-lg border border-line bg-white px-3 py-2.5 text-sm outline-none focus:border-brand';
const label = 'mb-1.5 block text-sm font-medium';

export default function NewPropertyWizard({ onCreated }: { onCreated: (p: ProjectData) => void }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [form, setForm] = useState<Form>({
    tipologia: 'Appartamento', contratto: 'Vendita', addr: '', prezzo: '', mq: '', locali: '', camere: '', bagni: '',
    piano: '', classe: '', caratteristiche: [], note: '',
  });
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [ai, setAi] = useState<AiResult | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const set = <K extends keyof Form>(k: K, v: Form[K]) => setForm(f => ({ ...f, [k]: v }));
  const toggle = (c: string) => set('caratteristiche', form.caratteristiche.includes(c) ? form.caratteristiche.filter(x => x !== c) : [...form.caratteristiche, c]);

  const addPhotos = async (files: FileList | null) => {
    if (!files) return;
    const added = await Promise.all([...files].filter(f => f.type.startsWith('image/')).map(async f => ({
      name: f.name, dataUrl: await downscaleDataUrl(await readFile(f), 1600, 0.82),
    })));
    setPhotos(p => [...p, ...added].slice(0, 30));
  };

  const property = () => ({
    tipologia: form.tipologia, contratto: form.contratto, indirizzo: form.addr,
    prezzo: num(form.prezzo), mq: num(form.mq), locali: num(form.locali), camere: num(form.camere), bagni: num(form.bagni),
    piano: form.piano, classe_energetica: form.classe, caratteristiche: form.caratteristiche, note_agente: form.note,
  });

  const generate = async () => {
    setStep(3); setBusy('Scrivo titolo e descrizione...'); setError(null);
    try {
      const res = await authFetch('/api/platform/describe', {
        method: 'POST',
        body: JSON.stringify({ property: property(), nFoto: photos.length }),
      });
      if (!res.ok) throw new Error();
      setAi(await res.json());
    } catch {
      setError('Generazione non riuscita. Riprova.');
    } finally { setBusy(null); }
  };

  const save = async () => {
    if (!ai) return;
    setError(null);
    try {
      const urls: string[] = [];
      for (const [i, p] of photos.entries()) {
        setBusy(`Carico foto ${i + 1} di ${photos.length}...`);
        const url = await uploadDataUrl(p.dataUrl, 'properties');
        if (url) urls.push(url);
      }
      setBusy('Salvo immobile...');
      const thumb = photos[0] ? await uploadDataUrl(await downscaleDataUrl(photos[0].dataUrl, 100, 0.8), 'covers') : '';
      const p = property();
      const project = await createProject({
        nome: ai.titolo, titolo: ai.titolo, descrizione: ai.descrizione, addr: form.addr, tipologia: form.tipologia,
        prezzo: p.prezzo, mq: p.mq, locali: p.locali || undefined, camere: p.camere, bagni: p.bagni,
        cover: urls[0] ?? '', thumb,
        import_data: { source: 'platform', photos: urls, contratto: form.contratto, piano: form.piano, classe: form.classe, caratteristiche: form.caratteristiche, note: form.note, score: ai.score, suggerimenti: ai.suggerimenti },
      });
      if (!project) throw new Error();
      onCreated(project);
    } catch {
      setError('Salvataggio non riuscito. Riprova.');
    } finally { setBusy(null); }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <a href="#/" className="inline-flex items-center gap-1 text-sm text-muted hover:text-ink"><ArrowLeft size={16} /> Home</a>
      <div className="mt-4 flex items-end justify-between gap-4">
        <h1 className="font-display text-3xl font-bold tracking-tight">Nuovo immobile</h1>
        <a href="#/importa" className="text-sm text-brand">Importa da CSV o Excel</a>
      </div>
      <div className="mt-4 flex gap-2">
        {['Dati', 'Foto', 'Annuncio'].map((s, i) => (
          <div key={s} className={`h-1.5 flex-1 rounded-full ${i < step ? 'bg-brand' : 'bg-line'}`} title={s} />
        ))}
      </div>

      {step === 1 && (
        <form className="mt-8 space-y-6" onSubmit={e => { e.preventDefault(); setStep(2); }}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div><label className={label}>Tipologia</label>
              <select className={input} value={form.tipologia} onChange={e => set('tipologia', e.target.value)}>{TIPOLOGIE.map(t => <option key={t}>{t}</option>)}</select></div>
            <div><label className={label}>Contratto</label>
              <div className="flex gap-2">{(['Vendita', 'Affitto'] as const).map(c => (
                <button type="button" key={c} onClick={() => set('contratto', c)}
                  className={`flex-1 rounded-lg border py-2.5 text-sm font-medium ${form.contratto === c ? 'border-brand bg-brand/10 text-brand' : 'border-line bg-white'}`}>{c}</button>
              ))}</div></div>
          </div>
          <div><label className={label}>Indirizzo</label>
            <input required className={input} value={form.addr} onChange={e => set('addr', e.target.value)} placeholder="Via Roma 12, Milano" /></div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div><label className={label}>Prezzo (€)</label><input required inputMode="numeric" className={input} value={form.prezzo} onChange={e => set('prezzo', e.target.value)} /></div>
            <div><label className={label}>Superficie (m²)</label><input required inputMode="numeric" className={input} value={form.mq} onChange={e => set('mq', e.target.value)} /></div>
            <div><label className={label}>Locali</label><input inputMode="numeric" className={input} value={form.locali} onChange={e => set('locali', e.target.value)} /></div>
            <div><label className={label}>Camere</label><input inputMode="numeric" className={input} value={form.camere} onChange={e => set('camere', e.target.value)} /></div>
            <div><label className={label}>Bagni</label><input inputMode="numeric" className={input} value={form.bagni} onChange={e => set('bagni', e.target.value)} /></div>
            <div><label className={label}>Piano</label><input className={input} value={form.piano} onChange={e => set('piano', e.target.value)} placeholder="3° con ascensore" /></div>
            <div><label className={label}>Classe energetica</label>
              <select className={input} value={form.classe} onChange={e => set('classe', e.target.value)}><option value="">n.d.</option>{CLASSI.map(c => <option key={c}>{c}</option>)}</select></div>
          </div>
          <div><label className={label}>Caratteristiche</label>
            <div className="flex flex-wrap gap-2">{CARATTERISTICHE.map(c => (
              <button type="button" key={c} onClick={() => toggle(c)}
                className={`rounded-full border px-3 py-1.5 text-sm ${form.caratteristiche.includes(c) ? 'border-brand bg-brand/10 text-brand' : 'border-line bg-white'}`}>{c}</button>
            ))}</div></div>
          <div><label className={label}>Punti di forza e note</label>
            <textarea rows={4} className={input} value={form.note} onChange={e => set('note', e.target.value)}
              placeholder="Es. ristrutturato nel 2022, doppia esposizione, vicino alla metro M2, zona tranquilla..." /></div>
          <div className="flex justify-end"><button className="rounded-lg bg-ink px-6 py-2.5 text-sm font-medium text-white">Avanti</button></div>
        </form>
      )}

      {step === 2 && (
        <div className="mt-8">
          <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-line bg-white py-12 text-muted hover:border-brand hover:text-brand">
            <ImagePlus size={28} />
            <span className="text-sm font-medium">Aggiungi foto (la prima sarà la copertina)</span>
            <input type="file" accept="image/*" multiple className="hidden" onChange={e => { addPhotos(e.target.files); e.target.value = ''; }} />
          </label>
          {photos.length > 0 && (
            <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-4">
              {photos.map((p, i) => (
                <div key={i} className="group relative aspect-[4/3] overflow-hidden rounded-xl bg-canvas">
                  <img src={p.dataUrl} alt="" className="h-full w-full object-cover" />
                  {i === 0 && <span className="absolute left-2 top-2 rounded-md bg-ink/80 px-2 py-0.5 text-xs text-white">Copertina</span>}
                  <button onClick={() => setPhotos(ps => ps.filter((_, j) => j !== i))} aria-label="Rimuovi foto"
                    className="absolute right-2 top-2 rounded-full bg-white/90 p-1 opacity-0 group-hover:opacity-100"><X size={14} /></button>
                </div>
              ))}
            </div>
          )}
          <div className="mt-8 flex justify-between">
            <button onClick={() => setStep(1)} className="text-sm text-muted hover:text-ink">Indietro</button>
            <button onClick={generate} className="flex items-center gap-2 rounded-lg bg-ai px-6 py-2.5 text-sm font-medium text-white">
              <Sparkles size={16} /> Genera annuncio
            </button>
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="mt-8">
          {busy && <div className="flex items-center gap-2 text-muted"><Loader2 size={18} className="animate-spin" /> {busy}</div>}
          {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
          {ai && (
            <div className={`space-y-5 ${busy ? 'pointer-events-none opacity-50' : ''}`}>
              <div className="flex items-center gap-4 rounded-2xl border border-line bg-white p-5">
                <div className="font-display text-4xl font-bold text-ai">{ai.score}</div>
                <div>
                  <div className="text-sm font-medium">Score annuncio /100</div>
                  <ul className="mt-1 list-disc pl-4 text-sm text-muted">{ai.suggerimenti.map(s => <li key={s}>{s}</li>)}</ul>
                </div>
              </div>
              <div><label className={label}>Titolo</label>
                <input className={input} value={ai.titolo} onChange={e => setAi({ ...ai, titolo: e.target.value })} /></div>
              <div><label className={label}>Descrizione</label>
                <textarea rows={12} className={input} value={ai.descrizione} onChange={e => setAi({ ...ai, descrizione: e.target.value })} /></div>
              <div className="flex justify-between">
                <button onClick={() => setStep(2)} className="text-sm text-muted hover:text-ink">Indietro</button>
                <div className="flex gap-3">
                  <button onClick={generate} className="rounded-lg border border-line bg-white px-4 py-2.5 text-sm font-medium">Rigenera</button>
                  <button onClick={save} className="rounded-lg bg-ink px-6 py-2.5 text-sm font-medium text-white">Salva immobile</button>
                </div>
              </div>
            </div>
          )}
          {!ai && !busy && <button onClick={generate} className="rounded-lg bg-ink px-6 py-2.5 text-sm font-medium text-white">Riprova</button>}
        </div>
      )}
    </div>
  );
}
