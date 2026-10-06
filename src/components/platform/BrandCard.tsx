'use client';

import { useEffect, useRef, useState } from 'react';
import { Check, ImagePlus, Loader2, Trash2 } from 'lucide-react';
import { authFetch, CARD_SHADOW } from './api';
import { uploadDataUrl } from '@/lib/imageUpload';
import { tr } from './i18n';

// "Il tuo marchio" nel profilo (05/10/2026): logo, colore, nome agenzia e telefono. Sono gli stessi campi dell'editor
// del sito (user_metadata.vetrina_site, api/platform/site PATCH { brand }): cambiandoli qui cambiano anche nel sito, e
// i video (Annuncio, Venduto) li usano per la chiusura. Il server li copia anche in user_brand (report).
const PALETTE = ['#537eec', '#1d1d1f', '#1d5b3c', '#2a2b7c', '#0f766e', '#b8923a', '#d92d20', '#7c3aed'];
type Brand = { logo: string; primary: string; agencyName: string; phone: string };

// logo in PNG (trasparenza salvata, anche da SVG), lato lungo 800
function toPng(f: File): Promise<string> {
  return new Promise((ok, ko) => {
    const url = URL.createObjectURL(f), img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const w0 = img.naturalWidth || 800, h0 = img.naturalHeight || 300, k = Math.min(1, 800 / Math.max(w0, h0));
      const c = document.createElement('canvas');
      c.width = Math.round(w0 * k); c.height = Math.round(h0 * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height);
      ok(c.toDataURL('image/png'));
    };
    img.onerror = () => { URL.revokeObjectURL(url); ko(new Error('img')); };
    img.src = url;
  });
}

// inChat: nel passo dati dei video (Annuncio, Venduto) compare solo se manca logo, agenzia o telefono; si completa li' e
// si salva nel profilo come da qui
export default function BrandCard({ inChat = false }: { inChat?: boolean }) {
  const [b, setB] = useState<Brand | null>(null);
  const [need, setNeed] = useState(true);
  const [saved, setSaved] = useState<Brand | null>(null);
  const [busy, setBusy] = useState<'logo' | 'save' | null>(null);
  const [ok, setOk] = useState(false);
  const [err, setErr] = useState('');
  const file = useRef<HTMLInputElement>(null);
  useEffect(() => {
    authFetch('/api/platform/site').then(r => (r.ok ? r.json() : null)).then((d: { logo: string | null; config: Brand } | null) => {
      if (!d) return;
      // logo del sito, o quello del profilo che il sito usa quando non ne ha uno suo
      const v = { logo: d.config.logo || d.logo || '', primary: d.config.primary, agencyName: d.config.agencyName, phone: d.config.phone };
      setB(v); setSaved(v); setNeed(!v.logo || !v.agencyName || !v.phone);
    }).catch(() => {});
  }, []);
  if (!b) return inChat ? null : <div className={`mt-4 h-40 animate-pulse rounded-[28px] bg-white ${CARD_SHADOW}`} />;
  if (inChat && !need) return null;
  const set = (p: Partial<Brand>) => { setB({ ...b, ...p }); setOk(false); setErr(''); };
  const dirty = JSON.stringify(b) !== JSON.stringify(saved);
  const save = async (next = b) => {
    setBusy('save'); setErr('');
    const r = await authFetch('/api/platform/site', { method: 'PATCH', body: JSON.stringify({ brand: next }) }).catch(() => null);
    setBusy(null);
    if (!r?.ok) { setErr(tr('Non sono riuscito a salvare, riprova.', 'I couldn\'t save, please try again.')); return; }
    setSaved(next); setOk(true);
  };
  const upload = async (f: File) => {
    setBusy('logo');
    const url = await toPng(f).then(d => uploadDataUrl(d, 'vetrina')).catch(() => '');
    setBusy(null);
    if (!url) { setErr(tr('Il logo non si è caricato, riprova.', 'The logo didn\'t upload, please try again.')); return; }
    const next = { ...b, logo: url };
    setB(next); void save(next); // il logo si salva subito
  };
  const hex = /^#[0-9a-f]{6}$/i.test(b.primary);
  const field = `h-11 w-full rounded-2xl ${inChat ? 'bg-white' : 'bg-canvas'} px-4 text-[15px] outline-none ring-1 ring-inset ring-transparent placeholder:text-muted/60 focus:bg-white focus:ring-brand/50`;
  return (
    <div className={inChat ? 'blur-in mt-4 rounded-3xl bg-canvas p-5' : `mt-4 rounded-[28px] bg-white p-6 ${CARD_SHADOW}`}>
      <h2 className="font-semibold">{inChat ? tr('Completa la fine del video', 'Complete the end of the video') : tr('Il tuo marchio', 'Your brand')}</h2>
      <p className="mt-1 text-sm text-muted">{inChat ? tr('Logo, agenzia e telefono compaiono a fine video. Si salvano nel tuo profilo e valgono anche per il sito.', 'Logo, agency and phone appear at the end of the video. They are saved to your profile and apply to your website too.') : tr('Logo, colore e contatti che usiamo nei video e nel tuo sito', 'Logo, colour and contacts we use in videos and on your website')}</p>

      <div className="mt-5 flex flex-wrap items-center gap-4">
        <div className={`flex h-24 w-40 items-center justify-center overflow-hidden rounded-[20px] ${inChat ? 'bg-white' : 'bg-canvas'} p-3 ring-1 ring-inset ring-black/5`} style={{ backgroundImage: 'linear-gradient(45deg,#eee 25%,transparent 25%,transparent 75%,#eee 75%),linear-gradient(45deg,#eee 25%,transparent 25%,transparent 75%,#eee 75%)', backgroundSize: '16px 16px', backgroundPosition: '0 0,8px 8px' }}>
          {busy === 'logo' ? <Loader2 size={18} className="animate-spin text-muted" /> : b.logo ? <img src={b.logo} alt={tr('Logo', 'Logo')} className="max-h-full max-w-full object-contain" /> : <span className="text-center text-xs text-muted">{tr('Nessun logo', 'No logo')}</span>}
        </div>
        <div className="flex flex-col gap-2">
          <div className="flex flex-wrap gap-2">
            <button type="button" onClick={() => file.current?.click()} disabled={!!busy} className="flex h-9 items-center gap-1.5 rounded-full bg-ink px-4 text-[13px] font-semibold text-white ease-smooth transition-colors hover:bg-brand disabled:opacity-40"><ImagePlus size={14} /> {b.logo ? tr('Sostituisci', 'Replace') : tr('Carica il logo', 'Upload logo')}</button>
            {b.logo && <button type="button" onClick={() => { const next = { ...b, logo: '' }; setB(next); void save(next); }} disabled={!!busy} className="flex h-9 items-center gap-1.5 rounded-full px-3 text-[13px] font-medium text-muted hover:bg-canvas hover:text-ink"><Trash2 size={14} /> {tr('Rimuovi', 'Remove')}</button>}
          </div>
          <span className="text-xs text-muted">{tr('PNG, JPG, SVG o WebP. Meglio con lo sfondo trasparente.', 'PNG, JPG, SVG or WebP. Best with a transparent background.')}</span>
        </div>
        <input ref={file} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" className="hidden" onChange={e => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void upload(f); }} />
      </div>

      <div className="mt-6">
        <span className="block pb-2 text-xs font-medium text-muted">{tr('Colore del marchio', 'Brand colour')}</span>
        <div className="flex flex-wrap items-center gap-2">
          {PALETTE.map(c => (
            <button key={c} type="button" aria-label={c} aria-pressed={b.primary.toLowerCase() === c} onClick={() => set({ primary: c })} className="flex h-9 w-9 items-center justify-center rounded-full ring-offset-2 ease-smooth transition-transform hover:scale-110" style={{ background: c, boxShadow: b.primary.toLowerCase() === c ? `0 0 0 2px #fff, 0 0 0 4px ${c}` : undefined }}>
              {b.primary.toLowerCase() === c && <Check size={15} className="text-white" />}
            </button>
          ))}
          <label className="relative flex h-9 w-9 cursor-pointer items-center justify-center overflow-hidden rounded-full ring-1 ring-inset ring-black/10" title={tr('Colore personalizzato', 'Custom colour')} style={{ background: 'conic-gradient(red,yellow,lime,cyan,blue,magenta,red)' }}>
            <input type="color" value={hex ? b.primary : '#537eec'} onChange={e => set({ primary: e.target.value })} className="absolute inset-0 cursor-pointer opacity-0" />
          </label>
        </div>
        {/* codice del colore sotto le tinte, campo intero col pallino del colore scelto */}
        <label className={`relative mt-3 flex h-12 items-center rounded-2xl ${inChat ? 'bg-white' : 'bg-canvas'} pl-3 pr-4 ring-1 ring-inset ease-smooth transition-shadow focus-within:bg-white sm:max-w-xs ${hex ? 'ring-transparent focus-within:ring-ink/15' : 'ring-rose-400'}`}>
          <span className="h-7 w-7 shrink-0 rounded-full ring-1 ring-inset ring-black/10" style={{ background: hex ? b.primary : 'transparent' }} aria-hidden />
          <span className="ml-3 text-sm text-muted">{tr('Codice', 'Code')}</span>
          <input value={b.primary} maxLength={7} onChange={e => set({ primary: e.target.value.startsWith('#') ? e.target.value : `#${e.target.value}` })} aria-label={tr('Codice del colore', 'Colour code')}
            className={`ml-auto w-24 bg-transparent text-right font-mono text-sm uppercase outline-none ${hex ? '' : 'text-rose-500'}`} />
        </label>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <label className="block"><span className="block pb-1.5 text-xs font-medium text-muted">{tr('Nome dell’agenzia', 'Agency name')}</span><input value={b.agencyName} maxLength={60} onChange={e => set({ agencyName: e.target.value })} placeholder={tr('es. Rossi Immobiliare', 'e.g. Rossi Real Estate')} className={field} /></label>
        <label className="block"><span className="block pb-1.5 text-xs font-medium text-muted">{tr('Telefono', 'Phone')}</span><input value={b.phone} maxLength={20} inputMode="tel" onChange={e => set({ phone: e.target.value.replace(/[^\d+ ]/g, '') })} placeholder="+39 333 123 4567" className={field} /></label>
      </div>

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <button type="button" disabled={!dirty || !hex || !!busy} onClick={() => void save()} className="flex h-10 items-center gap-2 rounded-full bg-ink px-5 text-[13px] font-semibold text-white ease-smooth transition-colors hover:bg-brand disabled:opacity-40">{busy === 'save' && <Loader2 size={14} className="animate-spin" />}{tr('Salva', 'Save')}</button>
        {ok && !dirty && <span className="blur-in flex items-center gap-1 text-sm text-emerald-600"><Check size={14} /> {inChat ? tr('Salvato nel profilo, lo vedi a fine video', 'Saved to your profile, you\'ll see it at the end of the video') : tr('Salvato, vale anche per il sito', 'Saved, it applies to your website too')}</span>}
        {err && <span className="text-sm text-rose-600">{err}</span>}
      </div>
    </div>
  );
}
