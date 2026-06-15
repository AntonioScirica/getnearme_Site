'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { s, Box, Icon } from './ui';
import { createProject, updateProject, deleteProject, ProjectData } from '@/lib/projects';
import { supabase } from '@/lib/supabase';
import { ICONS as TPL_ICONS } from './templates/icons.js';

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    // Timeout 12s: un'immagine che non emette ne' load ne' error non deve
    // lasciare appesa la creazione immobile (spinner infinito).
    const tid = setTimeout(() => reject(new Error('image load timeout')), 12_000)
    image.addEventListener('load', () => { clearTimeout(tid); resolve(image) })
    image.addEventListener('error', (error) => { clearTimeout(tid); reject(error) })
    // crossOrigin solo per URL remoti (evita taint del canvas). Sui data URL
    // non serve e in alcuni browser puo' interferire col decode.
    if (!url.startsWith('data:')) image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })


// Ridimensiona QUALSIASI cover data URL prima dell'upload. Il crop gia' limita a
// 800px, ma i path "salta crop" / cover passata possono lasciare l'originale a
// piena risoluzione (anche diversi MB) -> /api/upload sfora il limite body di
// 4.5MB di Vercel (413) -> fallback al data URL grande -> anche POST /api/projects
// sfora -> creazione immobile fallisce. Questo garantisce un payload sempre piccolo.
async function downscaleDataUrl(dataUrl: string, maxDim = 1280, quality = 0.8): Promise<string> {
  try {
    const image = await createImage(dataUrl);
    let w = image.width, h = image.height;
    if (w > maxDim || h > maxDim) {
      const r = Math.min(maxDim / w, maxDim / h);
      w = Math.round(w * r); h = Math.round(h * r);
    }
    const canvas = document.createElement('canvas');
    canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.drawImage(image, 0, 0, w, h);
    return await new Promise<string>((resolve) => {
      canvas.toBlob((b) => {
        if (!b) return resolve(dataUrl);
        const reader = new FileReader();
        reader.readAsDataURL(b);
        reader.onloadend = () => resolve(reader.result as string);
      }, 'image/jpeg', quality);
    });
  } catch {
    return dataUrl;
  }
}

// Carica un data URL su R2 via /api/upload. Ritorna l'URL o '' se fallisce.
async function uploadDataUrl(dataUrl: string, folder: string): Promise<string> {
  try {
    const blob = await (await fetch(dataUrl)).blob();
    const file = new File([blob], 'img.jpg', { type: blob.type || 'image/jpeg' });
    const fd = new FormData();
    fd.append('file', file);
    fd.append('folder', folder);
    const { data: { session } } = await supabase.auth.getSession();
    const headers: Record<string, string> = {};
    if (session) headers['Authorization'] = `Bearer ${session.access_token}`;
    const ac = new AbortController();
    const tid = setTimeout(() => ac.abort(), 20_000);
    let res: Response;
    try {
      res = await fetch('/api/upload', { method: 'POST', headers, body: fd, signal: ac.signal });
    } finally {
      clearTimeout(tid);
    }
    if (res.ok) return (await res.json()).url as string;
    console.error('Upload failed:', await res.text());
    return '';
  } catch (err) {
    console.error('uploadDataUrl error', err);
    return '';
  }
}


const DEFAULT_ICONS: Record<string, string> = { prezzo: 'euro', mq: 'area', camere: 'bed', bagni: 'bath' };
const ICONS_STORAGE_KEY = 'gnm_field_icons';

// Config icone "info principali" salvata per il prossimo immobile.
function loadSavedIcons(): Record<string, string> {
  if (typeof window === 'undefined') return { ...DEFAULT_ICONS };
  try {
    const raw = localStorage.getItem(ICONS_STORAGE_KEY);
    if (raw) return { ...DEFAULT_ICONS, ...JSON.parse(raw) };
  } catch { /* ignore */ }
  return { ...DEFAULT_ICONS };
}

const formatNumber = (val: string) => {
  const num = val.replace(/\D/g, '');
  return num ? Number(num).toLocaleString('it-IT') : '';
};

// Chiavi import gia' coperte da un campo dedicato -> non duplicarle in "Altri dati".
const DUP_KEYS = new Set([
  'prezzo', 'price', 'prezzorichiesta',
  'mq', 'metratura', 'metriquadri', 'metriquadrati', 'superficie', 'superficiecommerciale', 'area', 'mq2',
  'camere', 'cameredaletto', 'bedrooms', 'stanze',
  'bagni', 'bathrooms', 'servizi',
  'riferimento', 'rif', 'codice', 'codiceannuncio', 'annuncio', 'ref',
  'tipologia', 'tipo', 'tipoimmobile', 'categoria',
  'locali', 'vani', 'numerolocali', 'rooms',
  'descrizione', 'description', 'descr',
  'nome', 'name', 'titolo', 'title', 'titoloannuncio',
  'indirizzo', 'addr', 'address', 'via',
  'cover', 'foto', 'photo', 'photos', 'image', 'immagine', 'url', 'urlfoto', 'link', 'id', 'idannuncio',
  // Campi tecnici non rilevanti da mostrare.
  'idgestim', 'gestim', 'statoannuncio', 'stato',
  'codiceagenzia', 'codicegetrix', 'getrix', 'testoannuncio',
]);
// Radici: se la chiave normalizzata le contiene -> e' un duplicato (gestisce prefissi/suffissi
// tipo Prezzo_Euro, Superficie_MQ, Rif_Interno, Descrizione_IT, N_Bagni...).
const DUP_ROOTS = ['prezzo', 'price', 'superfic', 'metratur', 'metriquadr', 'quadr', 'bagn', 'camer', 'vani', 'descriz', 'descript', 'testoannunc', 'tipolog', 'indiriz', 'address', 'riferiment', 'rifinterno', 'titolo', 'codiceagenz', 'agenzia', 'getrix'];
const normKey = (k: string) => k.toLowerCase().replace(/[^a-z0-9]/g, '');
const isDupKey = (k: string) => {
  const n = normKey(k);
  if (DUP_KEYS.has(n)) return true;
  return DUP_ROOTS.some(r => n.includes(r));
};

// Icona coerente in base al nome del campo importato.
const iconForKey = (k: string): string => {
  const n = normKey(k);
  if (/bagn|bath/.test(n)) return 'bath';
  if (/camer|letto|bed/.test(n)) return 'bed';
  if (/local|vani|room/.test(n)) return 'rooms';
  if (/mq|metr|superf|area/.test(n)) return 'area';
  if (/prezz|price|euro|costo/.test(n)) return 'euro';
  if (/classe|energetic/.test(n)) return 'heating';
  if (/contratt|vendita|affitto/.test(n)) return 'tag';
  if (/piano|piani|floor/.test(n)) return 'floor';
  if (/ascens|elevator/.test(n)) return 'elevator';
  if (/balcon/.test(n)) return 'balcony';
  if (/terrazz|terrace/.test(n)) return 'terrace';
  if (/giardin|garden/.test(n)) return 'garden';
  if (/cantin|cellar/.test(n)) return 'cellar';
  if (/box|garage|posto|parking|auto/.test(n)) return 'parking';
  if (/riscald|heating/.test(n)) return 'heating';
  if (/condizion|clima|aria/.test(n)) return 'airConditioning';
  if (/cucin|cooking/.test(n)) return 'cookingPot';
  if (/soggiorn|salotto|sofa/.test(n)) return 'sofa';
  if (/zona|quartier|indiriz|via|citt|comun|local/.test(n)) return 'mapPin';
  if (/tipo|categor/.test(n)) return 'storage';
  return 'tag';
};

type Step = 1 | 2;

export function NewProjectModal({
  onClose,
  onSuccess,
  onDelete,
  editProject,
  toast,
  mandatory = false,
  onImport,
}: {
  onClose: () => void;
  onSuccess: (p: ProjectData) => void;
  onDelete?: (id: string) => void;
  editProject?: ProjectData | null;
  toast: (msg: string, icon?: string) => void;
  mandatory?: boolean; // primo immobile: non chiudibile (no X / backdrop / Esc)
  onImport?: () => void; // apre l'import lista (solo creazione)
}) {
  const [loading, setLoading] = useState(false);
  // Nuovo immobile = 2 step; modifica = step unico (tutti i campi).
  const [step, setStep] = useState<Step>(1);
  const isNew = !editProject;

  // Basic info
  const [nome, setNome] = useState(editProject?.nome || '');
  const [addr, setAddr] = useState(editProject?.addr || '');
  const [cover, setCover] = useState(editProject?.cover || ''); // Foto di copertina
  
  // Tech info (Step 2)
  const [prezzo, setPrezzo] = useState(editProject?.prezzo ? formatNumber(editProject.prezzo.toString()) : '');
  const [mq, setMq] = useState(editProject?.mq ? editProject.mq.toString() : '');
  const [camere, setCamere] = useState(editProject?.camere ? editProject.camere.toString() : '');
  const [bagni, setBagni] = useState(editProject?.bagni ? editProject.bagni.toString() : '');
  const [riferimento] = useState(editProject?.riferimento || '');
  const [tipologia, setTipologia] = useState(editProject?.tipologia || '');
  const [locali, setLocali] = useState(editProject?.locali ? String(editProject.locali) : '');
  const [descrizione, setDescrizione] = useState(editProject?.descrizione || '');
  const [extraData, setExtraData] = useState<Record<string, string>>(() => {
    const src = editProject?.import_data;
    if (!src || typeof src !== 'object') return {};
    const out: Record<string, string> = {};
    for (const [k, v] of Object.entries(src as Record<string, unknown>)) {
      if (v !== '' && v != null) out[k] = String(v);
    }
    return out;
  });
  const extraImportEntries: [string, unknown][] = editProject?.import_data && typeof editProject.import_data === 'object'
    ? Object.entries(editProject.import_data as Record<string, unknown>).filter(([, v]) => v !== '' && v != null)
    : [];
  
  // Icone "info principali" fisse (default): non piu' personalizzabili.
  const [fieldIcons] = useState<Record<string, string>>(editProject?.icons || loadSavedIcons());
  const [dragOver, setDragOver] = useState(false);

  // Primo immobile obbligatorio: blocca la chiusura via Esc.
  useEffect(() => {
    if (!mandatory) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [mandatory]);

  // Ridimensiona la copertina SUBITO alla selezione (non a fine creazione):
  // la foto del telefono puo' essere 5-10MB -> decodificarla/processarla al
  // momento del "Crea" rende tutto lentissimo. Qui la portiamo a max 1400px.
  const handleCoverFile = useCallback((file?: File | null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const raw = reader.result as string;
      try {
        // Preview buono nel cropper (step 1). La compressione "vera" a pochi px
        // avviene al salvataggio (handleFinish), non alla selezione.
        setCover(await downscaleDataUrl(raw, 1400, 0.85));
      } catch {
        setCover(raw);
      }
    };
    reader.readAsDataURL(file);
  }, []);




  // Campi tecnici ora obbligatori (servono per descrizioni e Post Social).
  const techFilled = !!(prezzo.trim() && mq.trim() && camere.trim() && bagni.trim());

  const handleFinish = async (skip: boolean = false) => {
    if (!nome.trim()) return;
    if (!addr.trim()) {
      toast('Inserisci l\'indirizzo dell\'immobile', 'x');
      return;
    }
    if (!skip && !techFilled) {
      toast('Compila prezzo, superficie, camere e bagni', 'x');
      return;
    }

    setLoading(true);

    // try/finally: qualunque cosa accada, lo spinner si ferma. I timeout sotto
    // evitano fetch appese (R2/API) -> niente piu' "loading infinito".
    try {
      const finalThumb0 = editProject?.thumb || '';
      let finalCover = cover;
      let finalThumb = finalThumb0;
      if (finalCover && finalCover.startsWith('data:image/')) {
        // Due versioni: cover orizzontale ~500px (card) + thumb ~100px (avatar/lista, come la foto profilo).
        const cover500 = await downscaleDataUrl(finalCover, 500, 0.82);
        const thumb100 = await downscaleDataUrl(finalCover, 100, 0.8);
        const coverUrl = await uploadDataUrl(cover500, 'covers');
        const thumbUrl = await uploadDataUrl(thumb100, 'covers');
        finalCover = coverUrl || cover500;
        finalThumb = thumbUrl || '';
        // Safety: se l'upload e' fallito non inviare un data URL grande a /api/projects
        // (sforerebbe il body limit). Meglio creare senza copertina che far fallire.
        if (finalCover.startsWith('data:') && finalCover.length > 1_500_000) {
          finalCover = '';
          finalThumb = '';
          toast('Copertina non caricata, immobile creato senza foto. Riprova piu\' tardi.', 'x');
        }
      }

      const payload = {
        nome: nome.trim(),
        addr: addr.trim(),
        prezzo: skip ? (editProject?.prezzo || 0) : Number(prezzo.replace(/\D/g, '')) || 0,
        mq: skip ? (editProject?.mq || 0) : Number(mq.replace(/\D/g, '')) || 0,
        camere: skip ? (editProject?.camere || 0) : Number(camere.replace(/\D/g, '')) || 0,
        bagni: skip ? (editProject?.bagni || 0) : Number(bagni.replace(/\D/g, '')) || 0,
        locali: locali.trim() ? (Number(locali.replace(/\D/g, '')) || undefined) : undefined,
        titolo: nome.trim(),
        descrizione: descrizione.trim(),
        riferimento: riferimento.trim(),
        tipologia: tipologia.trim(),
        cover: finalCover, // Empty means use gradient
        thumb: finalThumb, // ~100px per avatar/lista
        icons: fieldIcons,
        ...(editProject ? { import_data: { ...(editProject.import_data as Record<string, unknown> || {}), ...extraData } } : {}),
      };

      const p: ProjectData | null = editProject
        ? await updateProject(editProject.id, payload)
        : await createProject(payload);

      if (p) {
        toast(editProject ? 'Immobile aggiornato con successo!' : 'Immobile creato con successo!', 'check');
        onSuccess(p);
      } else {
        toast('Errore durante l\'operazione', 'x');
      }
    } catch (err) {
      console.error('handleFinish error', err);
      toast('Errore durante l\'operazione', 'x');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!editProject) return;
    if (!confirm('Sei sicuro di voler eliminare questo immobile? L\'operazione non è reversibile.')) return;
    
    setLoading(true);
    const ok = await deleteProject(editProject.id);
    setLoading(false);
    
    if (ok) {
      toast('Immobile eliminato', 'check');
      if (onDelete) onDelete(editProject.id);
    } else {
      toast('Errore durante l\'eliminazione', 'x');
    }
  };

  const inputStyle = s('width:100%;padding:11px 14px;border:1px solid #e4e1da;border-radius:10px;font-size:13.5px;outline:none;font-family:inherit;background:#fff;transition:border-color .2s, box-shadow .2s');
  const inputWithIconStyle = s('width:100%;padding:11px 14px 11px 52px;border:1px solid #e4e1da;border-radius:10px;font-size:13.5px;outline:none;font-family:inherit;background:#fff;transition:border-color .2s, box-shadow .2s');
  const labelStyle = s('display:block;font-size:12px;font-weight:700;color:#b3aca1;margin-bottom:8px;text-transform:uppercase;letter-spacing:.04em');

  // Campo uniforme: label + input con icona e divider verticale.
  const iconField = (key: string, label: string, iconKey: string, value: string, onChange: (v: string) => void, placeholder = '') => (
    <div key={key}>
      <label style={{ ...labelStyle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={label}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', paddingLeft: 14, gap: 10, color: '#57534c', pointerEvents: 'none' }}>
          <span style={{ width: 17, height: 17, display: 'flex' }} dangerouslySetInnerHTML={{ __html: (TPL_ICONS as Record<string, string>)[iconKey] || (TPL_ICONS as Record<string, string>).tag || '' }} />
          <div style={{ width: 1, height: 20, background: '#e4e1da' }} />
        </div>
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={placeholder}
          style={inputWithIconStyle}
          onFocus={e => e.currentTarget.style.borderColor = '#3B83F6'}
          onBlur={e => e.currentTarget.style.borderColor = '#e4e1da'}
        />
      </div>
    </div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Backdrop */}
      <div
        onClick={() => { if (!mandatory) onClose(); }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(24, 21, 17, 0.4)', backdropFilter: 'blur(4px)', animation: 'foto-reveal .3s ease' }}
      />
      
      {/* Modal Content */}
      <div style={{ position: 'relative', width: '100%', maxWidth: (editProject || step === 2) ? 720 : 480, background: '#fff', borderRadius: 24, boxShadow: '0 24px 64px rgba(20, 18, 15, 0.2)', overflow: 'hidden', animation: 'orb-float 0.4s ease-out', display: 'flex', flexDirection: 'column', maxHeight: '90vh', transition: 'max-width .25s ease' }}>
        
        {/* Header */}
        <div className="max-md:!p-4" style={{ padding: '24px 32px 20px', borderBottom: '1px solid #f0ede7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' }}>{editProject ? 'Modifica Immobile' : 'Nuovo Immobile'}</h2>
            <div style={{ fontSize: 13, color: '#8c867d', marginTop: 4 }}>
              {isNew ? `Passo ${step} di 2` : 'Inserisci le informazioni per il tuo immobile'}
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8 }} className="hover:bg-gray-100">
            <Icon name="x" size={20} color="#8c867d" />
          </button>
        </div>

        {/* Body */}
        <div className="max-md:!p-4" style={{ padding: '20px 32px 32px', overflowY: 'auto', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {(editProject || step === 1) && (<>
              <div>
                <label style={labelStyle}>Nome immobile *</label>
                <input 
                  autoFocus
                  placeholder="es. Attico Brera" 
                  value={nome} 
                  onChange={e => setNome(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#3B83F6'}
                  onBlur={e => e.target.style.borderColor = '#e4e1da'}
                />
              </div>
              
              <div>
                <label style={labelStyle}>Indirizzo *</label>
                <input 
                  placeholder="es. Via Fiori Chiari 12, Milano" 
                  value={addr} 
                  onChange={e => setAddr(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#3B83F6'}
                  onBlur={e => e.target.style.borderColor = '#e4e1da'}
                />
              </div>

              <div>
                <label style={labelStyle}>Foto di copertina (opzionale)</label>
                {cover ? (
                  <div style={{ position: 'relative', width: '100%', height: 180, borderRadius: 16, overflow: 'hidden', border: '1px solid #e4e1da', backgroundImage: `url("${cover}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <label style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Icon name="image-plus" size={14} color="#fff" />Cambia foto
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleCoverFile(e.target.files?.[0])} />
                    </label>
                    <div onClick={() => setCover('')} style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Rimuovi</div>
                  </div>
                ) : (
                  <label
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleCoverFile(e.dataTransfer.files?.[0]); }}
                    style={{ display: 'block', border: `2px dashed ${dragOver ? '#3B83F6' : '#d8d4cb'}`, borderRadius: 16, padding: '32px 20px', textAlign: 'center', background: dragOver ? '#eff6ff' : '#fcfcfb', cursor: 'pointer', transition: 'all .2s', position: 'relative', overflow: 'hidden' }}
                  >
                    <input type="file" accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} onChange={e => handleCoverFile(e.target.files?.[0])} />
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', border: '1px solid #f0ede7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                      <Icon name="image-plus" size={20} color={dragOver ? '#3B83F6' : '#8c867d'} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: dragOver ? '#3B83F6' : '#57534c' }}>Trascina o clicca qui</div>
                    <div style={{ fontSize: 12.5, color: '#8c867d', marginTop: 4 }}>Se lasci vuoto, creeremo uno sfondo colorato per te.</div>
                  </label>
                )}
              </div>
              {!editProject && onImport && (
                <div style={{ marginTop: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '0 0 20px' }}>
                    <div style={{ flex: 1, height: 1, background: '#e9e6df' }} />
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#b3aca1', textTransform: 'uppercase', letterSpacing: '.04em' }}>Oppure</span>
                    <div style={{ flex: 1, height: 1, background: '#e9e6df' }} />
                  </div>
                  <Box as="button" onClick={() => onImport()} style={s('width:100%;box-sizing:border-box;border:1px solid #e4e1da;background:#fff;color:#211f1c;font-size:14px;font-weight:700;padding:13px 20px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px')} hover={s('background:#f6f4f0;border-color:#d8d4cb')}>
                    <Icon name="upload" size={16} color="#57534c" />Importa immobili da file
                  </Box>
                </div>
              )}
              </>)}

              {(editProject || step === 2) && (<>
              {!isNew && <hr style={{ border: 'none', borderTop: '1px solid #f0ede7', margin: '8px 0' }} />}

              <div className="max-md:!grid-cols-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
                {iconField('prezzo', `Prezzo (${fieldIcons.prezzo === 'dollar' ? '$' : fieldIcons.prezzo === 'pound' ? '£' : '€'})`, fieldIcons.prezzo, prezzo, v => setPrezzo(formatNumber(v)), 'es. 350.000')}
                {iconField('mq', 'Metratura (m²)', 'area', mq, v => setMq(formatNumber(v)), 'es. 95')}
                {iconField('camere', 'Camere', 'bed', camere, v => setCamere(formatNumber(v)), 'es. 2')}
                {iconField('bagni', 'Bagni', 'bath', bagni, v => setBagni(formatNumber(v)), 'es. 1')}
                {editProject && iconField('tipologia', 'Tipologia', 'storage', tipologia, setTipologia, 'es. Appartamento')}
                {editProject && iconField('locali', 'Locali', 'rooms', locali, v => setLocali(v.replace(/\D/g, '')), 'es. 3')}
                {editProject && (() => {
                  const seen = new Set<string>();
                  return extraImportEntries
                    .filter(([k]) => !isDupKey(k) && !seen.has(normKey(k)) && !!seen.add(normKey(k)))
                    .map(([k]) => iconField(k, k.replace(/_/g, ' '), iconForKey(k), extraData[k] ?? '', v => setExtraData(prev => ({ ...prev, [k]: v }))));
                })()}
              </div>

              {editProject && (
                <div>
                  <label style={labelStyle}>Descrizione</label>
                  <textarea value={descrizione} onChange={e => setDescrizione(e.target.value)} rows={4} placeholder="Descrizione immobile" style={{ ...inputStyle, resize: 'vertical', minHeight: 92 } as React.CSSProperties} />
                  <div style={{ fontSize: 11.5, color: '#b3aca1', marginTop: 8 }}>Tutti i campi sono modificabili e disponibili per i report.</div>
                </div>
              )}
              </>)}
          </div>
        </div>

        {/* Footer */}
        <div className="max-md:!p-4 max-md:!flex-col max-md:!gap-4" style={{ padding: '20px 32px', borderTop: '1px solid #f0ede7', background: '#faf9f7', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', zIndex: 5 }}>
              <div style={{ display: 'flex', gap: 12, marginTop: 0, width: '100%', justifyContent: 'flex-end' }}>
                {editProject ? (
                  <>
                    <Box as="button" onClick={handleDelete} disabled={loading} style={s('border:1.5px solid #dc2626;background:#fff;color:#dc2626;font-size:14px;font-weight:700;padding:12px 20px;border-radius:12px;cursor:pointer;flex:1;transition:all 0.2s')} hover={s('background:#dc2626;color:#fff')}>
                      Elimina Immobile
                    </Box>
                    <Box as="button" onClick={() => handleFinish(false)} disabled={loading || !techFilled} style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:12px 20px;border-radius:12px;cursor:' + (loading || !techFilled ? 'default' : 'pointer') + ';flex:1;box-shadow:0 4px 12px rgba(59,131,246,0.25);opacity:' + (loading || !techFilled ? 0.45 : 1))} hover={loading || !techFilled ? undefined : s('background:#2563EB;box-shadow:0 6px 16px rgba(59,131,246,0.3)')}>
                      {loading ? 'Salvataggio...' : 'Salva modifiche'}
                    </Box>
                  </>
                ) : step === 1 ? (
                  <>
                    <Box as="button" onClick={() => { if (nome.trim() && addr.trim()) setStep(2); }} style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:12px 20px;border-radius:12px;cursor:' + (nome.trim() && addr.trim() ? 'pointer' : 'default') + ';flex:1;box-shadow:0 4px 12px rgba(59,131,246,0.25);opacity:' + (nome.trim() && addr.trim() ? 1 : 0.45))} hover={nome.trim() && addr.trim() ? s('background:#2563EB') : undefined}>
                      Avanti
                    </Box>
                  </>
                ) : (
                  <>
                    <Box as="button" onClick={() => setStep(1)} style={s('border:1px solid #e4e1da;background:#fff;color:#57534c;font-size:14px;font-weight:700;padding:12px 20px;border-radius:12px;cursor:pointer;flex:1')} hover={s('background:#f6f4f0;border-color:#d8d4cb')}>
                      Indietro
                    </Box>
                    <Box as="button" onClick={() => handleFinish(false)} disabled={loading || !techFilled} style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:12px 20px;border-radius:12px;cursor:' + (loading || !techFilled ? 'default' : 'pointer') + ';flex:1;box-shadow:0 4px 12px rgba(59,131,246,0.25);opacity:' + (loading || !techFilled ? 0.45 : 1))} hover={loading || !techFilled ? undefined : s('background:#2563EB;box-shadow:0 6px 16px rgba(59,131,246,0.3)')}>
                      {loading ? 'Creazione...' : 'Crea Immobile'}
                    </Box>
                  </>
                )}
              </div>
        </div>

      </div>
    </div>
  );
}
