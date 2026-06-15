'use client';

import React, { useState, useRef, useCallback, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { s, Box, Icon } from './ui';
import { createProject, updateProject, deleteProject, ProjectData } from '@/lib/projects';
import { supabase } from '@/lib/supabase';
import { ICONS as TPL_ICONS } from './templates/icons.js';
import Cropper from 'react-easy-crop';

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

async function getCroppedImg(imageSrc: string, pixelCrop: { x: number, y: number, width: number, height: number }): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  // Limit dimensions to max 800px to avoid API payload limits and speed up upload
  const MAX_DIM = 800;
  let finalW = pixelCrop.width;
  let finalH = pixelCrop.height;
  if (finalW > MAX_DIM || finalH > MAX_DIM) {
    const ratio = Math.min(MAX_DIM / finalW, MAX_DIM / finalH);
    finalW = Math.round(finalW * ratio);
    finalH = Math.round(finalH * ratio);
  }

  canvas.width = finalW;
  canvas.height = finalH;
  ctx.drawImage(image, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, finalW, finalH);

  return new Promise((resolve) => {
    canvas.toBlob((file) => {
      if (file) {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onloadend = () => resolve(reader.result as string);
      } else {
        resolve('');
      }
    }, 'image/jpeg', 0.7) // 0.7 quality for even smaller payload
  })
}

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

const PICKER_ICONS: { key: string; label: string }[] = [
  { key: 'euro', label: 'Euro' }, { key: 'dollar', label: 'Dollaro' }, { key: 'pound', label: 'Sterlina' },
  { key: 'bed', label: 'Camere' }, { key: 'bath', label: 'Bagni' }, { key: 'area', label: 'Superficie' },
  { key: 'rooms', label: 'Locali' }, { key: 'sofa', label: 'Soggiorno' }, { key: 'cookingPot', label: 'Cucina' },
  { key: 'elevator', label: 'Ascensore' }, { key: 'balcony', label: 'Balcone' }, { key: 'terrace', label: 'Terrazzo' },
  { key: 'garden', label: 'Giardino' }, { key: 'parking', label: 'Parcheggio' }, { key: 'floor', label: 'Piano' },
];

const CURRENCY_KEYS = ['euro', 'dollar', 'pound'];

const getLabelForIcon = (key: string, defaultLabel: string) => {
  const found = PICKER_ICONS.find(p => p.key === key);
  return found && !CURRENCY_KEYS.includes(key) ? found.label : defaultLabel;
};

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
function saveIcons(icons: Record<string, string>) {
  try { localStorage.setItem(ICONS_STORAGE_KEY, JSON.stringify(icons)); } catch { /* quota */ }
}

const formatNumber = (val: string) => {
  const num = val.replace(/\D/g, '');
  return num ? Number(num).toLocaleString('it-IT') : '';
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
  const [prezzo, setPrezzo] = useState(editProject?.prezzo ? editProject.prezzo.toString() : '');
  const [mq, setMq] = useState(editProject?.mq ? editProject.mq.toString() : '');
  const [camere, setCamere] = useState(editProject?.camere ? editProject.camere.toString() : '');
  const [bagni, setBagni] = useState(editProject?.bagni ? editProject.bagni.toString() : '');
  
  const [fieldIcons, setFieldIcons] = useState<Record<string, string>>(editProject?.icons || loadSavedIcons());
  const [iconDropdown, setIconDropdown] = useState<string | null>(null);
  // Posizione del trigger per renderizzare il picker in un portal (fixed),
  // cosi' non viene tagliato dall'overflow del body del modal.
  const [pickerRect, setPickerRect] = useState<DOMRect | null>(null);
  const togglePicker = (field: string, el: HTMLElement) => {
    if (iconDropdown === field) { setIconDropdown(null); return; }
    setPickerRect(el.getBoundingClientRect());
    setIconDropdown(field);
  };

  // Primo immobile obbligatorio: blocca la chiusura via Esc.
  useEffect(() => {
    if (!mandatory) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); } };
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [mandatory]);

  // Drag state (for future image upload integration, currently just visual)
  const [dragOver, setDragOver] = useState(false);
  
  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

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
      let finalCover = cover;
      let finalThumb = editProject?.thumb || '';
      if (cover && croppedAreaPixels && !skip && !cover.startsWith('http')) {
        try {
          finalCover = await getCroppedImg(cover, croppedAreaPixels);
        } catch (e) {
          console.error('Failed to crop image', e);
        }
      }

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
        titolo: editProject?.titolo || '',
        cover: finalCover, // Empty means use gradient
        thumb: finalThumb, // ~100px per avatar/lista
        icons: fieldIcons,
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
  const inputWithIconStyle = s('width:100%;padding:11px 14px 11px 44px;border:1px solid #e4e1da;border-radius:10px;font-size:13.5px;outline:none;font-family:inherit;background:#fff;transition:border-color .2s, box-shadow .2s');
  const labelStyle = s('display:block;font-size:12px;font-weight:700;color:#b3aca1;margin-bottom:8px;text-transform:uppercase;letter-spacing:.04em');

  const renderIconPicker = (field: string, allowedKeys?: string[]) => {
    if (iconDropdown !== field || !pickerRect) return null;
    const iconsToShow = allowedKeys ? PICKER_ICONS.filter(p => allowedKeys.includes(p.key)) : PICKER_ICONS.filter(p => !CURRENCY_KEYS.includes(p.key));
    // Portal su body + fixed: il picker apre verso l'alto sopra l'icona e non
    // viene tagliato dall'overflow del modal.
    return createPortal(
      <div style={{ position: 'fixed', bottom: (typeof window !== 'undefined' ? window.innerHeight : 0) - pickerRect.top + 8, left: pickerRect.left, zIndex: 99999, background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #e4e1da', padding: 8, display: 'grid', gridTemplateColumns: 'repeat(5, 36px)', gap: 4 }}>
        {iconsToShow.map(pi => (
          <div 
            key={pi.key} 
            onClick={(e) => { 
              e.stopPropagation(); 
              setFieldIcons(prev => {
                const newIcons = { ...prev };
                const oldIcon = newIcons[field];
                const fieldWithSameIcon = Object.keys(newIcons).find(k => k !== field && newIcons[k] === pi.key);
                if (fieldWithSameIcon && !CURRENCY_KEYS.includes(pi.key)) {
                  newIcons[fieldWithSameIcon] = oldIcon;
                }
                newIcons[field] = pi.key;
                saveIcons(newIcons); // salva config per il prossimo immobile
                return newIcons;
              });
              setIconDropdown(null);
            }} 
            style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 8, cursor: 'pointer', border: fieldIcons[field] === pi.key ? '1.5px solid #3B83F6' : '1.5px solid transparent', background: fieldIcons[field] === pi.key ? '#eef4fe' : 'transparent', color: fieldIcons[field] === pi.key ? '#3B83F6' : '#6b7280' }}
            onMouseEnter={e => { if (fieldIcons[field] !== pi.key) { e.currentTarget.style.background = '#f6f4f0'; e.currentTarget.style.color = '#211f1c'; } }}
            onMouseLeave={e => { if (fieldIcons[field] !== pi.key) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; } }}
            title={pi.label}
          >
            <span style={{ width: 16, height: 16, display: 'flex' }} dangerouslySetInnerHTML={{ __html: (TPL_ICONS as Record<string, string>)[pi.key] || '' }} />
          </div>
        ))}
      </div>,
      document.body
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Backdrop */}
      <div
        onClick={() => { if (!mandatory) onClose(); }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(24, 21, 17, 0.4)', backdropFilter: 'blur(4px)', animation: 'foto-reveal .3s ease' }}
      />
      
      {/* Modal Content */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: '#fff', borderRadius: 24, boxShadow: '0 24px 64px rgba(20, 18, 15, 0.2)', overflow: 'hidden', animation: 'orb-float 0.4s ease-out', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        {/* Header */}
        <div className="max-md:!p-4" style={{ padding: '24px 32px 20px', borderBottom: '1px solid #f0ede7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' }}>{editProject ? 'Modifica Immobile' : 'Nuovo Immobile'}</h2>
            <div style={{ fontSize: 13, color: '#8c867d', marginTop: 4 }}>
              {isNew ? `Passo ${step} di 2 — ${step === 1 ? 'nome, indirizzo e copertina' : 'dati immobile (opzionali)'}` : 'Inserisci le informazioni per il tuo immobile'}
            </div>
          </div>
          {!mandatory && (
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8 }} className="hover:bg-gray-100">
              <Icon name="x" size={20} color="#8c867d" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="max-md:!p-4" style={{ padding: '20px 32px 32px', overflowY: 'auto', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              {(editProject || step === 1) && (<>
              <div>
                <label style={labelStyle}>Nome del progetto *</label>
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
                <label style={labelStyle}>Indirizzo</label>
                <input 
                  placeholder="es. Via Fiori Chiari 12, Milano" 
                  value={addr} 
                  onChange={e => setAddr(e.target.value)}
                  style={inputStyle}
                  onFocus={e => e.target.style.borderColor = '#3B83F6'}
                  onBlur={e => e.target.style.borderColor = '#e4e1da'}
                />
              </div>

              {!editProject && (
                <div>
                  <label style={labelStyle}>Foto di copertina (opzionale)</label>
                  {cover ? (
                  <div style={{ position: 'relative', width: '100%', height: 240, borderRadius: 16, overflow: 'hidden', background: '#111', touchAction: 'none' }}>
                    <div style={{ position: 'absolute', inset: -20, background: `url("${cover}") center/cover`, filter: 'blur(10px) brightness(0.5)' }} />
                    <Cropper
                      image={cover}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      objectFit="horizontal-cover"
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      style={{ containerStyle: { width: '100%', height: '100%', background: 'transparent' } }}
                    />
                    <label
                      style={{ position: 'absolute', bottom: 10, left: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, zIndex: 20, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}
                    >
                      <Icon name="image-plus" size={14} color="#fff" />
                      Cambia foto
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleCoverFile(e.target.files?.[0])} />
                    </label>
                    <div
                      style={{ position: 'absolute', bottom: 10, right: 10, background: 'rgba(0,0,0,0.5)', color: '#fff', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 700, zIndex: 20, cursor: 'pointer' }}
                      onClick={(e) => { e.preventDefault(); setCover(''); }}
                    >
                      Rimuovi
                    </div>
                  </div>
                ) : (
                  <label 
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => {
                      e.preventDefault();
                      setDragOver(false);
                      handleCoverFile(e.dataTransfer.files?.[0]);
                    }}
                    style={{
                      display: 'block',
                      border: `2px dashed ${dragOver ? '#3B83F6' : '#d8d4cb'}`,
                      borderRadius: 16,
                      padding: '32px 20px',
                      textAlign: 'center',
                      background: dragOver ? '#eff6ff' : '#fcfcfb',
                      cursor: 'pointer',
                      transition: 'all .2s',
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    <input 
                      type="file" 
                      accept="image/*" 
                      style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} 
                      onChange={e => handleCoverFile(e.target.files?.[0])}
                    />
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: '#fff', border: '1px solid #f0ede7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                      <Icon name="image-plus" size={20} color={dragOver ? '#3B83F6' : '#8c867d'} />
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: dragOver ? '#3B83F6' : '#57534c' }}>Trascina o clicca qui</div>
                    <div style={{ fontSize: 12.5, color: '#8c867d', marginTop: 4 }}>Se lasci vuoto, creeremo uno sfondo colorato per te.</div>
                  </label>
                )}
              </div>
              )}
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

              <div style={{ background: '#f6f4f0', padding: 16, borderRadius: 12, fontSize: 13, color: '#57534c', lineHeight: 1.5 }}>
Clicca sulle icone per scegliere quali info mostrare.
              </div>
              
              <div className="max-md:!grid-cols-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Prezzo ({fieldIcons.prezzo === 'dollar' ? '$' : fieldIcons.prezzo === 'pound' ? '£' : '€'})</label>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <div onClick={(e) => togglePicker('prezzo', e.currentTarget)} style={{ position: 'absolute', left: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#57534c', cursor: 'pointer', borderRadius: 8, background: '#f6f4f0', border: '1px solid #e4e1da' }} onMouseEnter={e => e.currentTarget.style.background = '#efece6'} onMouseLeave={e => e.currentTarget.style.background = '#f6f4f0'}>
                        <span style={{ width: 15, height: 15, display: 'flex' }} dangerouslySetInnerHTML={{ __html: (TPL_ICONS as any)[fieldIcons.prezzo] || '' }} />
                      </div>
                      <input 
                        type="text" 
                        value={prezzo}
                        onChange={e => setPrezzo(formatNumber(e.target.value))}
                        placeholder="es. 350.000"
                        style={inputWithIconStyle}
                        onFocus={e => e.currentTarget.style.borderColor = '#d8d4cb'}
                        onBlur={e => e.currentTarget.style.borderColor = '#e4e1da'}
                      />
                    </div>
                    {renderIconPicker('prezzo', CURRENCY_KEYS)}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>{getLabelForIcon(fieldIcons.mq, 'Metratura (m²)')}</label>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <div onClick={(e) => togglePicker('mq', e.currentTarget)} style={{ position: 'absolute', left: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#57534c', cursor: 'pointer', borderRadius: 8, background: '#f6f4f0', border: '1px solid #e4e1da' }} onMouseEnter={e => e.currentTarget.style.background = '#efece6'} onMouseLeave={e => e.currentTarget.style.background = '#f6f4f0'}>
                        <span style={{ width: 15, height: 15, display: 'flex' }} dangerouslySetInnerHTML={{ __html: (TPL_ICONS as any)[fieldIcons.mq] || '' }} />
                      </div>
                      <input 
                        type="text" 
                        value={mq}
                        onChange={e => setMq(formatNumber(e.target.value))}
                        placeholder="es. 95"
                        style={inputWithIconStyle}
                        onFocus={e => e.currentTarget.style.borderColor = '#d8d4cb'}
                        onBlur={e => e.currentTarget.style.borderColor = '#e4e1da'}
                      />
                    </div>
                    {renderIconPicker('mq')}
                  </div>
                </div>
              </div>

              <div className="max-md:!grid-cols-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>{getLabelForIcon(fieldIcons.camere, 'Camere da letto')}</label>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <div onClick={(e) => togglePicker('camere', e.currentTarget)} style={{ position: 'absolute', left: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#57534c', cursor: 'pointer', borderRadius: 8, background: '#f6f4f0', border: '1px solid #e4e1da' }} onMouseEnter={e => e.currentTarget.style.background = '#efece6'} onMouseLeave={e => e.currentTarget.style.background = '#f6f4f0'}>
                        <span style={{ width: 15, height: 15, display: 'flex' }} dangerouslySetInnerHTML={{ __html: (TPL_ICONS as any)[fieldIcons.camere] || '' }} />
                      </div>
                      <input 
                        type="text" 
                        value={camere}
                        onChange={e => setCamere(formatNumber(e.target.value))}
                        placeholder="es. 2"
                        style={inputWithIconStyle}
                        onFocus={e => e.currentTarget.style.borderColor = '#d8d4cb'}
                        onBlur={e => e.currentTarget.style.borderColor = '#e4e1da'}
                      />
                    </div>
                    {renderIconPicker('camere')}
                  </div>
                </div>

                <div>
                  <label style={labelStyle}>{getLabelForIcon(fieldIcons.bagni, 'Bagni')}</label>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <div onClick={(e) => togglePicker('bagni', e.currentTarget)} style={{ position: 'absolute', left: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#57534c', cursor: 'pointer', borderRadius: 8, background: '#f6f4f0', border: '1px solid #e4e1da' }} onMouseEnter={e => e.currentTarget.style.background = '#efece6'} onMouseLeave={e => e.currentTarget.style.background = '#f6f4f0'}>
                        <span style={{ width: 15, height: 15, display: 'flex' }} dangerouslySetInnerHTML={{ __html: (TPL_ICONS as any)[fieldIcons.bagni] || '' }} />
                      </div>
                      <input 
                        type="text" 
                        value={bagni}
                        onChange={e => setBagni(formatNumber(e.target.value))}
                        placeholder="es. 1"
                        style={inputWithIconStyle}
                        onFocus={e => e.currentTarget.style.borderColor = '#d8d4cb'}
                        onBlur={e => e.currentTarget.style.borderColor = '#e4e1da'}
                      />
                    </div>
                    {renderIconPicker('bagni')}
                  </div>
                </div>
              </div>
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
