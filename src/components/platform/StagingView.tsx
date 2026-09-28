'use client';

import { useEffect, useState } from 'react';
import { Download, Loader2, Plus, Wand2, X } from 'lucide-react';
import { downloadImage, fileToResizedDataUrl, SCENE_STYLE_LABELS, STAGING_STYLES } from '@/lib/staging';
import { ANGLES, type SceneType } from '@/lib/stagingPrompts';
import { AiPhotoStage, Elapsed, useAiPhoto, type EditRequest } from './AiPhoto';
import StagingChat from './StagingChat';
import { CARD_SHADOW } from './api';

// Home staging nella piattaforma (GPT Image, prompt in lib/stagingPrompts e lib/nanoBanana). Una foto alla volta: chat
// (StagingChat). Piu' foto caricate insieme: batch, ogni foto con la sua impostazione, "Genera tutte"
// le lancia insieme.

type Scene = SceneType | 'planimetria';
type Item = { id: string; src: string; scene: Scene; style: string | null; angle: string | null; custom: string };

const SCENES: { id: Scene; label: string }[] = [
  { id: 'interno', label: 'Interno' },
  { id: 'esterno', label: 'Facciata' },
  { id: 'giardino', label: 'Giardino' },
  { id: 'planimetria', label: 'Planimetria' },
];
const stylesFor = (scene: Scene) => (scene === 'planimetria' ? STAGING_STYLES.filter(s => !['daynight', 'empty'].includes(s.id)) : STAGING_STYLES);
const styleLabel = (scene: Scene, id: string, fallback: string) => (scene === 'esterno' || scene === 'giardino' ? SCENE_STYLE_LABELS[scene][id] : null) ?? fallback;

// Richiesta per /api/platform/photo-edit: testo libero > vista > stile.
function reqFor(it: Item): EditRequest {
  const text = it.custom.trim();
  return {
    imageBase64: it.src,
    scene: it.scene === 'planimetria' ? 'interno' : it.scene,
    planimetria: it.scene === 'planimetria',
    ...(text ? { prompt: text } : it.angle ? { angle: it.angle } : { style: it.style ?? 'modern' }),
  };
}
const fileName = (it: Item, i = 0) => `home-staging-${i ? `${i}-` : ''}${it.angle ?? it.style ?? 'modifica'}.jpg`;
const newItem = (src: string): Item => ({ id: Math.random().toString(36).slice(2), src, scene: 'interno', style: 'modern', angle: null, custom: '' });

// La GPU resta accesa solo mentre ci sono foto caricate in pagina.

const primary = 'flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-[13px] font-semibold text-white ease-smooth transition-[background-color,opacity,transform] hover:bg-brand/90 active:scale-[0.97] disabled:opacity-40';
const secondary = 'flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-white px-4 text-[13px] font-semibold ring-1 ring-black/10 ease-smooth transition-colors hover:bg-canvas disabled:opacity-40';

export default function StagingView({ initial }: { initial?: { photo?: string; project?: string } } = {}) {
  const [items, setItems] = useState<Item[]>([]);
  const [runAll, setRunAll] = useState(0);
  const [done, setDone] = useState<Record<string, string>>({});

  const add = async (files?: FileList | File[] | null) => {
    const imgs = Array.from(files ?? []).filter(f => f.type.startsWith('image/')).slice(0, 30);
    const srcs = await Promise.all(imgs.map(f => fileToResizedDataUrl(f, 1500)));
    setItems(prev => [...prev, ...srcs.map(newItem)]);
  };
  const update = (id: string, patch: Partial<Item>) => setItems(prev => prev.map(it => (it.id === id ? { ...it, ...patch } : it)));
  const remove = (id: string) => setItems(prev => prev.filter(it => it.id !== id));
  const allStyle = (style: string) => setItems(prev => prev.map(it => ({ ...it, style: stylesFor(it.scene).some(s => s.id === style) ? style : it.style, angle: null, custom: '' })));
  const ready = items.filter(it => done[it.id]).length;

  const picker = (multiple: boolean) => <input type="file" accept="image/*" multiple={multiple} className="hidden" onChange={e => { add(e.target.files); e.target.value = ''; }} />;

  // Una foto alla volta: chat. Piu' foto caricate insieme: griglia batch.
  if (items.length < 2) return <StagingChat onMany={add} initial={initial} />;

  return (
    <div className="mx-auto max-w-5xl pb-16 pt-6">
      <h1 className="text-center font-display text-4xl font-bold leading-[1.2] tracking-tight md:text-5xl md:leading-[1.2]">
        <span className="blur-in inline-block">Home staging</span>
        <span className="blur-in block text-muted/70" style={{ animationDelay: '.1s' }}>Scegli cosa fare su ogni foto, poi generale tutte insieme.</span>
      </h1>
      {items.length > 1 && (
        <>
          {/* Barra del batch: stesso stile per tutte, aggiungi, genera tutte, scarica tutte */}
          <div className={`rise sticky top-24 z-20 mt-10 flex flex-wrap items-center gap-2 rounded-[22px] bg-white/90 p-2 pl-4 backdrop-blur-md ${CARD_SHADOW}`}>
            <span className="text-sm font-semibold">{items.length} foto</span>
            <span className="text-sm text-muted">{ready ? `· ${ready} pronte` : ''}</span>
            <select defaultValue="" onChange={e => { if (e.target.value) allStyle(e.target.value); e.target.value = ''; }}
              className="ml-2 h-9 rounded-full bg-canvas px-3 text-[13px] font-medium outline-none ring-1 ring-inset ring-black/10">
              <option value="">Stesso stile per tutte…</option>
              {STAGING_STYLES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
            </select>
            <div className="ml-auto flex items-center gap-2">
              <label className={`${secondary} cursor-pointer`}><Plus size={14} /> Aggiungi {picker(true)}</label>
              {ready > 0 && (
                <button className={secondary} onClick={() => items.forEach((it, i) => done[it.id] && setTimeout(() => downloadImage(done[it.id], fileName(it, i + 1)), i * 400))}>
                  <Download size={14} /> Scarica pronte
                </button>
              )}
              <button className={primary} onClick={() => setRunAll(n => n + 1)}><Wand2 size={14} /> Genera tutte</button>
            </div>
          </div>
          <div className="mt-6 grid gap-5 md:grid-cols-2">
            {items.map((it, i) => (
              <BatchCard key={it.id} item={it} index={i} runAll={runAll} onChange={p => update(it.id, p)} onRemove={() => remove(it.id)}
                onDone={url => setDone(d => ({ ...d, [it.id]: url }))} />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// Una foto del batch: impostazione propria (scena + stile/vista/testo), parte con "Genera tutte" o da sola.
function BatchCard({ item, index, runAll, onChange, onRemove, onDone }: { item: Item; index: number; runAll: number; onChange: (p: Partial<Item>) => void; onRemove: () => void; onDone: (url: string) => void }) {
  const ai = useAiPhoto();
  const { scene, style, angle, custom } = item;
  const mode = custom.trim() ? 'custom' : angle ? `angle:${angle}` : `style:${style ?? 'modern'}`;
  const [freeText, setFreeText] = useState(!!custom);

  // "Genera tutte": ogni card parte al cambio del contatore (salta quelle gia' in corso)
  useEffect(() => {
    if (runAll > 0) ai.run(reqFor(item));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [runAll]);
  useEffect(() => { if (ai.out) onDone(ai.out); }, [ai.out]); // eslint-disable-line react-hooks/exhaustive-deps

  const choose = (v: string) => {
    if (v === 'custom') { setFreeText(true); return; }
    setFreeText(false);
    const [k, id] = v.split(':');
    onChange(k === 'angle' ? { angle: id, custom: '' } : { style: id, angle: null, custom: '' });
  };
  const select = 'h-9 min-w-0 rounded-full bg-canvas px-3 text-[13px] font-medium outline-none ring-1 ring-inset ring-black/10';

  return (
    <div className={`rise rounded-[24px] bg-white p-3 ${CARD_SHADOW}`} style={{ animationDelay: `${index * 0.05}s` }}>
      <div className="relative">
        <AiPhotoStage src={item.src} busy={ai.busy} out={ai.out} reveal={ai.reveal} msg={ai.msg} fileName={fileName(item, index + 1)} className="aspect-[4/3]" />
        {!ai.busy && (
          <button onClick={onRemove} aria-label="Togli foto" className="absolute left-3 top-3 z-[12] flex h-8 w-8 items-center justify-center rounded-full bg-white/85 text-muted shadow-sm ring-1 ring-black/5 backdrop-blur-md hover:text-ink"><X size={15} /></button>
        )}
      </div>
      <div className="mt-3 flex flex-wrap items-center gap-2 px-1">
        <select value={scene} onChange={e => onChange({ scene: e.target.value as Scene, angle: null })} className={select}>
          {SCENES.map(s => <option key={s.id} value={s.id}>{s.label}</option>)}
        </select>
        <select value={freeText ? 'custom' : mode} onChange={e => choose(e.target.value)} className={`${select} flex-1`}>
          <optgroup label="Stile">
            {stylesFor(scene).map(s => <option key={s.id} value={`style:${s.id}`}>{styleLabel(scene, s.id, s.label)}</option>)}
          </optgroup>
          {scene === 'interno' && <optgroup label="Altre viste">{ANGLES.map(a => <option key={a.id} value={`angle:${a.id}`}>{a.label}</option>)}</optgroup>}
          <option value="custom">Testo libero…</option>
        </select>
        <button onClick={() => ai.run(reqFor(item))} disabled={ai.busy || (freeText && !custom.trim())} className={primary}>
          {ai.busy ? <><Loader2 size={14} className="animate-spin" /> <Elapsed className="text-white/80" /></> : <><Wand2 size={14} /> {ai.out ? 'Rigenera' : 'Genera'}</>}
        </button>
      </div>
      {freeText && (
        <textarea rows={2} value={custom} onChange={e => onChange({ custom: e.target.value })} placeholder="Descrivi la modifica per questa foto"
          className="mt-2 w-full resize-none rounded-2xl bg-canvas px-4 py-2.5 text-sm outline-none focus:bg-white focus:ring-1 focus:ring-ink/15" />
      )}
      {ai.err && <p className="mt-2 px-1 text-sm text-rose-600">{ai.err}</p>}
    </div>
  );
}
