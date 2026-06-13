'use client';

import React, { useState, useRef, useCallback } from 'react';
import { s, Box, Icon } from './ui';
import { createProject, updateProject, deleteProject, ProjectData } from '@/lib/projects';
import { ICONS as TPL_ICONS } from './templates/icons.js';
import Cropper from 'react-easy-crop';

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image()
    image.addEventListener('load', () => resolve(image))
    image.addEventListener('error', (error) => reject(error))
    image.setAttribute('crossOrigin', 'anonymous')
    image.src = url
  })

async function getCroppedImg(imageSrc: string, pixelCrop: { x: number, y: number, width: number, height: number }): Promise<string> {
  const image = await createImage(imageSrc)
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''

  canvas.width = image.width
  canvas.height = image.height
  ctx.drawImage(image, 0, 0)

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
  toast
}: { 
  onClose: () => void; 
  onSuccess: (p: ProjectData) => void;
  onDelete?: (id: string) => void;
  editProject?: ProjectData | null;
  toast: (msg: string, icon?: string) => void;
}) {
  const [loading, setLoading] = useState(false);
  
  // Basic info
  const [nome, setNome] = useState(editProject?.nome || '');
  const [addr, setAddr] = useState(editProject?.addr || '');
  const [cover, setCover] = useState(editProject?.cover || ''); // Foto di copertina
  
  // Tech info (Step 2)
  const [prezzo, setPrezzo] = useState(editProject?.prezzo ? editProject.prezzo.toString() : '');
  const [mq, setMq] = useState(editProject?.mq ? editProject.mq.toString() : '');
  const [camere, setCamere] = useState(editProject?.camere ? editProject.camere.toString() : '');
  const [bagni, setBagni] = useState(editProject?.bagni ? editProject.bagni.toString() : '');
  
  const [fieldIcons, setFieldIcons] = useState<Record<string, string>>(editProject?.icons || {
    prezzo: 'euro', mq: 'area', camere: 'bed', bagni: 'bath'
  });
  const [iconDropdown, setIconDropdown] = useState<string | null>(null);

  // Drag state (for future image upload integration, currently just visual)
  const [dragOver, setDragOver] = useState(false);
  
  // Crop state
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);
  


  const handleFinish = async (skip: boolean = false) => {
    if (!nome.trim()) return;
    
    setLoading(true);
    
    let finalCover = cover;
    if (cover && croppedAreaPixels && !skip && !cover.startsWith('http')) {
      try {
        finalCover = await getCroppedImg(cover, croppedAreaPixels);
      } catch (e) {
        console.error('Failed to crop image', e);
      }
    }

    if (finalCover && finalCover.startsWith('data:image/')) {
      try {
        const res = await fetch(finalCover);
        const blob = await res.blob();
        const file = new File([blob], 'cover.jpg', { type: blob.type });
        const formData = new FormData();
        formData.append('file', file);
        formData.append('folder', 'covers');
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        
        if (uploadRes.ok) {
          const { url } = await uploadRes.json();
          finalCover = url;
        } else {
          console.error('Upload failed:', await uploadRes.text());
        }
      } catch (err) {
        console.error('Failed to upload cover', err);
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
      icons: fieldIcons,
    };

    let p: ProjectData | null;
    if (editProject) {
      p = await updateProject(editProject.id, payload);
    } else {
      p = await createProject(payload);
    }
    
    setLoading(false);
    
    if (p) {
      toast(editProject ? 'Immobile aggiornato con successo!' : 'Immobile creato con successo!', 'check');
      onSuccess(p);
    } else {
      toast('Errore durante l\'operazione', 'x');
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
    if (iconDropdown !== field) return null;
    const iconsToShow = allowedKeys ? PICKER_ICONS.filter(p => allowedKeys.includes(p.key)) : PICKER_ICONS.filter(p => !CURRENCY_KEYS.includes(p.key));
    const openUpwards = true; // Always open upwards to prevent clipping with footer
    return (
      <div style={{ position: 'absolute', ...(openUpwards ? { bottom: 'calc(100% + 8px)' } : { top: 'calc(100% + 8px)' }), left: 0, zIndex: 99999, background: '#fff', borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #e4e1da', padding: 8, display: 'grid', gridTemplateColumns: 'repeat(5, 36px)', gap: 4 }}>
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
      </div>
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      {/* Backdrop */}
      <div 
        onClick={onClose}
        style={{ position: 'absolute', inset: 0, background: 'rgba(24, 21, 17, 0.4)', backdropFilter: 'blur(4px)', animation: 'foto-reveal .3s ease' }} 
      />
      
      {/* Modal Content */}
      <div style={{ position: 'relative', width: '100%', maxWidth: 480, background: '#fff', borderRadius: 24, boxShadow: '0 24px 64px rgba(20, 18, 15, 0.2)', overflow: 'hidden', animation: 'orb-float 0.4s ease-out', display: 'flex', flexDirection: 'column', maxHeight: '90vh' }}>
        
        {/* Header */}
        <div className="max-md:!p-4" style={{ padding: '24px 32px 20px', borderBottom: '1px solid #f0ede7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 20, fontWeight: 800, letterSpacing: '-0.3px' }}>{editProject ? 'Modifica Immobile' : 'Nuovo Immobile'}</h2>
            <div style={{ fontSize: 13, color: '#8c867d', marginTop: 4 }}>
              Inserisci le informazioni per il tuo immobile
            </div>
          </div>
          <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 8 }} className="hover:bg-gray-100">
            <Icon name="x" size={20} color="#8c867d" />
          </button>
        </div>

        {/* Body */}
        <div className="max-md:!p-4" style={{ padding: '32px', overflowY: 'auto', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
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
                <label style={labelStyle}>Indirizzo (opzionale)</label>
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
                      aspect={16/9}
                      objectFit="horizontal-cover"
                      onCropChange={setCrop}
                      onCropComplete={onCropComplete}
                      onZoomChange={setZoom}
                      style={{ containerStyle: { width: '100%', height: '100%', background: 'transparent' } }}
                    />
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
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = () => setCover(reader.result as string);
                        reader.readAsDataURL(file);
                      }
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
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = () => setCover(reader.result as string);
                          reader.readAsDataURL(file);
                        }
                      }} 
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

              <hr style={{ border: 'none', borderTop: '1px solid #f0ede7', margin: '8px 0' }} />

              <div style={{ background: '#f6f4f0', padding: 16, borderRadius: 12, fontSize: 13, color: '#57534c', lineHeight: 1.5 }}>
                Questi dati non sono obbligatori, ma ci aiutano a generare in automatico le descrizioni e i Post Social perfetti per te.
              </div>
              
              <div className="max-md:!grid-cols-1" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={labelStyle}>Prezzo ({fieldIcons.prezzo === 'dollar' ? '$' : fieldIcons.prezzo === 'pound' ? '£' : '€'})</label>
                  <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <div onClick={() => setIconDropdown(iconDropdown === 'prezzo' ? null : 'prezzo')} style={{ position: 'absolute', left: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#57534c', cursor: 'pointer', borderRadius: 8, background: '#f6f4f0', border: '1px solid #e4e1da' }} onMouseEnter={e => e.currentTarget.style.background = '#efece6'} onMouseLeave={e => e.currentTarget.style.background = '#f6f4f0'}>
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
                      <div onClick={() => setIconDropdown(iconDropdown === 'mq' ? null : 'mq')} style={{ position: 'absolute', left: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#57534c', cursor: 'pointer', borderRadius: 8, background: '#f6f4f0', border: '1px solid #e4e1da' }} onMouseEnter={e => e.currentTarget.style.background = '#efece6'} onMouseLeave={e => e.currentTarget.style.background = '#f6f4f0'}>
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
                      <div onClick={() => setIconDropdown(iconDropdown === 'camere' ? null : 'camere')} style={{ position: 'absolute', left: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#57534c', cursor: 'pointer', borderRadius: 8, background: '#f6f4f0', border: '1px solid #e4e1da' }} onMouseEnter={e => e.currentTarget.style.background = '#efece6'} onMouseLeave={e => e.currentTarget.style.background = '#f6f4f0'}>
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
                      <div onClick={() => setIconDropdown(iconDropdown === 'bagni' ? null : 'bagni')} style={{ position: 'absolute', left: 8, width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#57534c', cursor: 'pointer', borderRadius: 8, background: '#f6f4f0', border: '1px solid #e4e1da' }} onMouseEnter={e => e.currentTarget.style.background = '#efece6'} onMouseLeave={e => e.currentTarget.style.background = '#f6f4f0'}>
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
          </div>
        </div>

        {/* Footer */}
        <div className="max-md:!p-4 max-md:!flex-col max-md:!gap-4" style={{ padding: '20px 32px', borderTop: '1px solid #f0ede7', background: '#faf9f7', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', zIndex: 5 }}>
              <div style={{ display: 'flex', gap: 12, marginTop: 0, width: '100%', justifyContent: 'flex-end' }}>
                {!editProject && (
                  <Box as="button" onClick={() => handleFinish(true)} style={s('border:1px solid #e4e1da;background:#fff;color:#57534c;font-size:14px;font-weight:700;padding:12px 20px;border-radius:12px;cursor:pointer;flex:1')} hover={s('background:#f6f4f0;border-color:#d8d4cb')}>
                    Salta per ora
                  </Box>
                )}
                {editProject && (
                  <Box as="button" onClick={handleDelete} disabled={loading} style={s('border:1.5px solid #dc2626;background:#fff;color:#dc2626;font-size:14px;font-weight:700;padding:12px 20px;border-radius:12px;cursor:pointer;flex:1;transition:all 0.2s')} hover={s('background:#dc2626;color:#fff')}>
                    Elimina Immobile
                  </Box>
                )}
                <Box as="button" onClick={() => handleFinish(false)} disabled={loading} style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:12px 20px;border-radius:12px;cursor:pointer;flex:1;box-shadow:0 4px 12px rgba(59,131,246,0.25);opacity:' + (loading ? 0.7 : 1))} hover={s('background:#2563EB;box-shadow:0 6px 16px rgba(59,131,246,0.3)')}>
                  {loading ? (editProject ? 'Salvataggio...' : 'Creazione...') : (editProject ? 'Salva modifiche' : 'Crea Immobile')}
                </Box>
              </div>
        </div>

      </div>
    </div>
  );
}
