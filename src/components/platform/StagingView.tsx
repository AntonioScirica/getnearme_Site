'use client';

import { useState } from 'react';
import { ImagePlus, Loader2, RefreshCw, Wand2 } from 'lucide-react';
import { fileToResizedDataUrl, SCENE_STYLE_LABELS, STAGING_STYLES } from '@/lib/staging';
import { ANGLES, type SceneType } from '@/lib/stagingPrompts';
import { AiPhotoStage, Elapsed, useAiPhoto, useKeepPhotoGpu } from './AiPhoto';
import { CARD_SHADOW } from './api';

// Home staging nella piattaforma: stessi stili, viste e planimetria di Foto AI (prompt in
// lib/stagingPrompts), generati con Qwen-Image. Una foto alla volta, prima/dopo con lo slider.

type Scene = SceneType | 'planimetria';
const SCENES: { id: Scene; label: string }[] = [
  { id: 'interno', label: 'Interno' },
  { id: 'esterno', label: 'Facciata' },
  { id: 'giardino', label: 'Giardino' },
  { id: 'planimetria', label: 'Planimetria' },
];

// La GPU resta accesa solo mentre c'e' una foto caricata in pagina.
function KeepGpu() { useKeepPhotoGpu(); return null; }

export default function StagingView() {
  const [photo, setPhoto] = useState<string | null>(null);
  const [scene, setScene] = useState<Scene>('interno');
  const [style, setStyle] = useState<string | null>('modern');
  const [angle, setAngle] = useState<string | null>(null);
  const [custom, setCustom] = useState('');
  const [drag, setDrag] = useState(false);
  const ai = useAiPhoto();

  const load = async (file?: File) => {
    if (!file || !file.type.startsWith('image/')) return;
    setPhoto(await fileToResizedDataUrl(file, 1500));
    ai.reset();
  };

  const styles = scene === 'planimetria' ? STAGING_STYLES.filter(s => !['daynight', 'empty'].includes(s.id)) : STAGING_STYLES;
  const label = (id: string, fallback: string) => (scene === 'esterno' || scene === 'giardino' ? SCENE_STYLE_LABELS[scene][id] : null) ?? fallback;
  const canRun = !!photo && !ai.busy && !!(custom.trim() || style || angle);

  const run = () => {
    if (!canRun || !photo) return;
    const text = custom.trim();
    ai.run({
      imageBase64: photo,
      scene: scene === 'planimetria' ? 'interno' : scene,
      planimetria: scene === 'planimetria',
      // testo libero vince sugli stili; la vista vince sullo stile
      ...(text ? { prompt: text } : angle ? { angle } : { style: style ?? 'modern' }),
    });
  };

  const chip = (on: boolean) => `rounded-full px-3.5 py-2 text-sm font-medium ease-smooth transition-colors ${on ? 'bg-ink text-white' : 'bg-canvas text-ink/80 ring-1 ring-inset ring-black/10 hover:bg-white'}`;

  return (
    <div className="mx-auto max-w-4xl pb-16 pt-6">
      <h1 className="text-center font-display text-4xl font-bold tracking-tight md:text-5xl">
        <span className="blur-in inline-block">Home staging</span>
        <span className="blur-in block text-muted/70" style={{ animationDelay: '.1s' }}>Arreda, svuota o cambia la luce di una foto.</span>
      </h1>

      <div className={`rise mt-10 rounded-[28px] bg-white p-5 ${CARD_SHADOW}`} style={{ animationDelay: '.15s' }}>
        {photo && <KeepGpu />}
        {!photo ? (
          <label onDragOver={e => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)} onDrop={e => { e.preventDefault(); setDrag(false); load(e.dataTransfer.files?.[0]); }}
            className={`flex aspect-[3/2] max-h-[60vh] w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed ease-smooth transition-colors ${drag ? 'border-brand bg-brand/5' : 'border-line bg-canvas hover:border-ink/20'}`}>
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white shadow-sm ring-1 ring-black/5"><ImagePlus size={24} /></span>
            <span className="text-base font-semibold">Trascina qui una foto o clicca per sceglierla</span>
            <span className="text-sm text-muted">Stanza, facciata, giardino o planimetria. JPG, PNG o WEBP.</span>
            <input type="file" accept="image/*" className="hidden" onChange={e => { load(e.target.files?.[0]); e.target.value = ''; }} />
          </label>
        ) : (
          <div className="relative">
            <AiPhotoStage src={photo} busy={ai.busy} out={ai.out} reveal={ai.reveal} msg={ai.msg} fileName={`home-staging-${angle ?? style ?? 'modifica'}.jpg`} />
            {!ai.busy && !ai.out && (
              <label className="blur-in absolute left-3 top-3 z-[12] flex h-9 cursor-pointer items-center gap-1.5 rounded-full bg-white/85 px-3.5 text-xs font-semibold shadow-sm ring-1 ring-black/5 backdrop-blur-md hover:bg-white">
                <RefreshCw size={13} /> Cambia foto
                <input type="file" accept="image/*" className="hidden" onChange={e => { load(e.target.files?.[0]); e.target.value = ''; }} />
              </label>
            )}
          </div>
        )}

        <div className="mt-5 space-y-5 px-1">
          {/* Tipo di foto: cambia i prompt dietro gli stessi stili */}
          <div className="inline-flex rounded-full bg-canvas p-1 ring-1 ring-inset ring-black/5">
            {SCENES.map(s => (
              <button key={s.id} onClick={() => { setScene(s.id); setAngle(null); if (s.id === 'planimetria' && (style === 'daynight' || style === 'empty')) setStyle('modern'); }}
                className={`rounded-full px-4 py-1.5 text-sm font-medium ease-smooth transition-colors ${scene === s.id ? 'bg-white text-ink shadow-sm' : 'text-muted hover:text-ink'}`}>{s.label}</button>
            ))}
          </div>

          <div>
            <div className="mb-2 text-xs font-semibold text-muted">Stile</div>
            <div className="flex flex-wrap gap-2">
              {styles.map(s => (
                <button key={s.id} title={s.desc} onClick={() => { setStyle(s.id); setAngle(null); setCustom(''); }} className={chip(!custom.trim() && !angle && style === s.id)}>{label(s.id, s.label)}</button>
              ))}
            </div>
          </div>

          {scene === 'interno' && (
            <div>
              <div className="mb-2 text-xs font-semibold text-muted">Altre viste della stessa stanza</div>
              <div className="flex flex-wrap gap-2">
                {ANGLES.map(a => (
                  <button key={a.id} onClick={() => { setAngle(a.id); setCustom(''); }} className={chip(!custom.trim() && angle === a.id)}>{a.label}</button>
                ))}
              </div>
            </div>
          )}

          {/* Testo libero stile home: vince su stile e vista */}
          <div className="flex items-center gap-2 rounded-[22px] bg-canvas p-2 pl-4 ease-smooth transition-colors focus-within:bg-white focus-within:ring-1 focus-within:ring-ink/15">
            <textarea rows={2} value={custom} onChange={e => setCustom(e.target.value)} placeholder="Oppure descrivi tu la modifica, es. aggiungi un tavolo da pranzo in legno"
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); run(); } }}
              className="min-w-0 flex-1 resize-none bg-transparent py-2 text-sm leading-relaxed outline-none placeholder:text-muted/60" />
            <button onClick={run} disabled={!canRun}
              className="flex h-9 shrink-0 items-center gap-1.5 rounded-full bg-brand px-4 text-[13px] font-semibold text-white ease-smooth transition-[background-color,opacity,transform] hover:bg-brand/90 active:scale-[0.97] disabled:opacity-40">
              {ai.busy ? <Loader2 size={14} className="animate-spin" /> : <Wand2 size={14} />} {ai.busy ? <>Genero <Elapsed className="text-white/80" /></> : ai.out ? 'Rigenera' : 'Genera'}
            </button>
          </div>
          {!photo && <p className="text-xs text-muted">Carica prima una foto.</p>}
          {ai.err && <p className="text-sm text-rose-600">{ai.err}</p>}
        </div>
      </div>
    </div>
  );
}
