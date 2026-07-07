'use client';

import React, { useState, useCallback, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import Cropper, { type Area } from 'react-easy-crop';
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


// Ritaglia l'area selezionata (px) dall'immagine e restituisce un data URL.
async function getCroppedDataUrl(src: string, area: Area, maxOut = 1000): Promise<string> {
  const image = await createImage(src);
  const canvas = document.createElement('canvas');
  const scale = Math.min(1, maxOut / Math.max(area.width, area.height));
  canvas.width = Math.round(area.width * scale);
  canvas.height = Math.round(area.height * scale);
  const ctx = canvas.getContext('2d');
  if (!ctx) return src;
  ctx.drawImage(image, area.x, area.y, area.width, area.height, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', 0.85);
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

// Icone selezionabili per i 4 campi "info principali" (prezzo/mq/camere/bagni).
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

// Campi extra preimpostati selezionabili dal dropdown "Aggiungi dato".
const PRESET_EXTRA_FIELDS: { label: string; placeholder: string }[] = [
  { label: 'Piano', placeholder: 'es. 3' },
  { label: 'Totale piani edificio', placeholder: 'es. 5' },
  { label: 'Ascensore', placeholder: 'es. Sì' },
  { label: 'Classe energetica', placeholder: 'es. A' },
  { label: 'Riscaldamento', placeholder: 'es. Autonomo' },
  { label: 'Aria condizionata', placeholder: 'es. Sì' },
  { label: 'Arredato', placeholder: 'es. Sì' },
  { label: 'Balcone', placeholder: 'es. 1' },
  { label: 'Terrazzo', placeholder: 'es. Sì' },
  { label: 'Giardino', placeholder: 'es. Privato' },
  { label: 'Cantina', placeholder: 'es. Sì' },
  { label: 'Box / Garage', placeholder: 'es. 1' },
  { label: 'Posto auto', placeholder: 'es. Sì' },
  { label: 'Esposizione', placeholder: 'es. Sud' },
  { label: 'Anno di costruzione', placeholder: 'es. 1998' },
  { label: 'Stato immobile', placeholder: 'es. Ristrutturato' },
  { label: 'Spese condominiali', placeholder: 'es. 80 €/mese' },
  { label: 'Tipo di contratto', placeholder: 'es. Vendita' },
];

// Icona coerente in base al nome del campo importato.
const iconForKey = (k: string): string => {
  const n = normKey(k);
  if (/bagn|bath/.test(n)) return 'bath';
  if (/camer|letto|bed/.test(n)) return 'bed';
  if (/spes|condominial|costimensil|costigestion/.test(n)) return 'coins';
  if (/anno|costruz|year/.test(n)) return 'calendar';
  if (/totalepian|edific|palazz|fabbric/.test(n)) return 'building';
  if (/local|vani|room/.test(n)) return 'rooms';
  if (/mq|metr|superf|area/.test(n)) return 'area';
  if (/prezz|price|euro|costo/.test(n)) return 'euro';
  if (/classe|energetic|epoca|ape/.test(n)) return 'zap';
  if (/contratt|vendita|affitto|locazion/.test(n)) return 'fileSign';
  if (/stato|ristruttur|condizioniimmob|nuovo|abitabil/.test(n)) return 'wrench';
  if (/esposiz|orient/.test(n)) return 'compass';
  if (/piano|piani|floor/.test(n)) return 'floor';
  if (/ascens|elevator/.test(n)) return 'elevator';
  if (/balcon/.test(n)) return 'balcony';
  if (/terrazz|terrace/.test(n)) return 'umbrella';
  if (/giardin|garden/.test(n)) return 'garden';
  if (/cantin|cellar/.test(n)) return 'cellar';
  if (/box|garage|posto|parking|auto/.test(n)) return 'parking';
  if (/riscald|heating|termo/.test(n)) return 'heating';
  if (/condizion|clima|aria/.test(n)) return 'airConditioning';
  if (/cucin|cooking/.test(n)) return 'cookingPot';
  if (/soggiorn|salotto|sofa|arred/.test(n)) return 'sofa';
  if (/zona|quartier|indiriz|via|citt|comun/.test(n)) return 'mapPin';
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
  const [deleting, setDeleting] = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  // Nuovo immobile = 2 step; modifica = step unico (tutti i campi).
  const [step, setStep] = useState<Step>(1);
  const isNew = !editProject;

  // Basic info
  const [nome, setNome] = useState(editProject?.nome || '');
  const [addr, setAddr] = useState(editProject?.addr || '');
  const [cover, setCover] = useState(editProject?.cover || ''); // Foto di copertina
  // Riposizionamento copertina (stesso box, drag, niente zoom/bottoni).
  const [cropSrc, setCropSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [cropArea, setCropArea] = useState<Area | null>(null);

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
  
  // Icone "info principali" (prezzo/mq/camere/bagni): personalizzabili via picker.
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
  const [dragOver, setDragOver] = useState(false);
  // Campi extra (etichetta + valore), scelti da dropdown o personalizzati.
  const [customFields, setCustomFields] = useState<{ key: string; value: string; custom?: boolean }[]>([]);
  const [addMenuOpen, setAddMenuOpen] = useState(false);
  const addMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!addMenuOpen) return;
    const onDoc = (e: MouseEvent) => { if (addMenuRef.current && !addMenuRef.current.contains(e.target as Node)) setAddMenuOpen(false); };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, [addMenuOpen]);
  // Dopo aver aggiunto un campo: focus + scroll sull'input appena creato.
  const rowInputRefs = useRef<Map<number, HTMLInputElement | null>>(new Map());
  const pendingFocusRef = useRef<number | null>(null);
  useEffect(() => {
    const i = pendingFocusRef.current;
    if (i == null) return;
    pendingFocusRef.current = null;
    const el = rowInputRefs.current.get(i);
    if (el) { el.focus(); el.scrollIntoView({ behavior: 'smooth', block: 'center' }); }
  }, [customFields.length]);
  // Preset ancora disponibili: esclude quelli gia' presenti (campi import o aggiunti).
  const usedExtraKeys = new Set<string>([
    ...Object.keys(extraData).map(normKey),
    ...customFields.map(f => normKey(f.key)),
  ]);
  const availablePresets = PRESET_EXTRA_FIELDS.filter(p => !usedExtraKeys.has(normKey(p.label)));

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
      let src = raw;
      try {
        // Immagine sorgente per il cropper (buona qualita', payload contenuto).
        src = await downscaleDataUrl(raw, 1400, 0.85);
      } catch { /* usa raw */ }
      setCrop({ x: 0, y: 0 });
      setCropArea(null);
      setCover('');
      setCropSrc(src);
    };
    reader.readAsDataURL(file);
  }, []);




  // Campi tecnici ora obbligatori (servono per descrizioni e Post Social).
  const techFilled = isNew
    ? !!(prezzo.trim() && mq.trim() && camere.trim() && bagni.trim())
    : !!(prezzo.trim() && mq.trim());

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
      // Se c'e' un ritaglio in corso, applicalo ora (il box mostra l'area scelta).
      let finalCover = cover;
      if (cropSrc) {
        try { finalCover = cropArea ? await getCroppedDataUrl(cropSrc, cropArea, 1000) : cropSrc; }
        catch { finalCover = cropSrc; }
      }
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
        ...(() => {
          const customObj = Object.fromEntries(
            customFields.filter(f => f.key.trim()).map(f => [f.key.trim(), f.value.trim()])
          );
          if (editProject) {
            return { import_data: { ...(editProject.import_data as Record<string, unknown> || {}), ...extraData, ...customObj } };
          }
          return Object.keys(customObj).length ? { import_data: customObj } : {};
        })(),
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
    setDeleting(true);
    const ok = await deleteProject(editProject.id);

    if (ok) {
      toast('Immobile eliminato', 'check');
      if (onDelete) onDelete(editProject.id); // chiude il modal + naviga
    } else {
      setDeleting(false);
      toast('Errore durante l\'eliminazione', 'x');
    }
  };

  const inputStyle = s('width:100%;padding:10px 13px;border:1px solid #e4e1da;border-radius:9px;font-size:12px;outline:none;font-family:inherit;background:#fff;transition:border-color .2s, box-shadow .2s');
  const inputWithIconStyle = s('width:100%;padding:10px 13px 10px 47px;border:1px solid #e4e1da;border-radius:9px;font-size:12px;outline:none;font-family:inherit;background:#fff;transition:border-color .2s, box-shadow .2s');
  const labelStyle = s('display:block;font-size:11px;font-weight:700;color:#b3aca1;margin-bottom:7px;text-transform:uppercase;letter-spacing:.04em');

  // Campo uniforme: label + input con icona e divider verticale.
  const iconField = (key: string, label: string, iconKey: string, value: string, onChange: (v: string) => void, placeholder = '') => (
    <div key={key}>
      <label style={{ ...labelStyle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={label}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', paddingLeft: 13, gap: 9, color: '#57534c', pointerEvents: 'none' }}>
          <span style={{ width: 15, height: 15, display: 'flex' }} dangerouslySetInnerHTML={{ __html: (TPL_ICONS as Record<string, string>)[iconKey] || (TPL_ICONS as Record<string, string>).tag || '' }} />
          <div style={{ width: 1, height: 18, background: '#e4e1da' }} />
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

  // Come iconField, ma l'icona e' cliccabile e apre un picker per cambiarla
  // (solo i 4 campi "info principali": prezzo/mq/camere/bagni).
  const iconFieldPickable = (key: string, label: string, value: string, onChange: (v: string) => void, placeholder = '', allowedKeys?: string[]) => (
    <div key={key}>
      <label style={{ ...labelStyle, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={label}>{label}</label>
      <div style={{ position: 'relative', display: 'flex', flexDirection: 'column' }}>
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          <div
            onClick={e => togglePicker(key, e.currentTarget)}
            style={{ position: 'absolute', left: 0, top: 0, bottom: 0, display: 'flex', alignItems: 'center', paddingLeft: 13, gap: 9, color: '#57534c', cursor: 'pointer' }}
          >
            <span style={{ width: 15, height: 15, display: 'flex' }} dangerouslySetInnerHTML={{ __html: (TPL_ICONS as Record<string, string>)[fieldIcons[key]] || (TPL_ICONS as Record<string, string>).tag || '' }} />
            <div style={{ width: 1, height: 18, background: '#e4e1da' }} />
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
        {renderIconPicker(key, allowedKeys)}
      </div>
    </div>
  );

  const renderIconPicker = (field: string, allowedKeys?: string[]) => {
    if (iconDropdown !== field || !pickerRect) return null;
    const iconsToShow = allowedKeys ? PICKER_ICONS.filter(p => allowedKeys.includes(p.key)) : PICKER_ICONS.filter(p => !CURRENCY_KEYS.includes(p.key));
    // Portal su body + fixed: il picker apre sopra l'icona e non viene
    // tagliato dall'overflow del body scrollabile del modal.
    return createPortal(
      <>
        <div onClick={() => setIconDropdown(null)} style={{ position: 'fixed', inset: 0, zIndex: 99998 }} />
        <div style={{ position: 'fixed', bottom: (typeof window !== 'undefined' ? window.innerHeight : 0) - pickerRect.top + 7, left: pickerRect.left, zIndex: 99999, background: '#fff', borderRadius: 11, boxShadow: '0 8px 32px rgba(0,0,0,0.12)', border: '1px solid #e4e1da', padding: 7, display: 'grid', gridTemplateColumns: 'repeat(5, 32px)', gap: 4 }}>
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
              style={{ width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 7, cursor: 'pointer', border: fieldIcons[field] === pi.key ? '1.5px solid #3B83F6' : '1.5px solid transparent', background: fieldIcons[field] === pi.key ? '#eef4fe' : 'transparent', color: fieldIcons[field] === pi.key ? '#3B83F6' : '#6b7280' }}
              onMouseEnter={e => { if (fieldIcons[field] !== pi.key) { e.currentTarget.style.background = '#f6f4f0'; e.currentTarget.style.color = '#211f1c'; } }}
              onMouseLeave={e => { if (fieldIcons[field] !== pi.key) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; } }}
              title={pi.label}
            >
              <span style={{ width: 14, height: 14, display: 'flex' }} dangerouslySetInnerHTML={{ __html: (TPL_ICONS as Record<string, string>)[pi.key] || '' }} />
            </div>
          ))}
        </div>
      </>,
      document.body
    );
  };

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22 }}>
      {/* Backdrop */}
      <div
        onClick={() => { if (!mandatory) onClose(); }}
        style={{ position: 'absolute', inset: 0, background: 'rgba(24, 21, 17, 0.4)', backdropFilter: 'blur(4px)', animation: 'foto-reveal .3s ease' }}
      />

      {/* Modal Content */}
      <div style={{ position: 'relative', width: '100%', maxWidth: editProject ? 648 : 432, background: '#fff', borderRadius: 22, boxShadow: '0 24px 64px rgba(20, 18, 15, 0.2)', overflow: 'hidden', animation: 'orb-float 0.4s ease-out', display: 'flex', flexDirection: 'column', maxHeight: '90vh', transition: 'max-width .25s ease' }}>

        {/* Header */}
        <div className="max-md:!p-4" style={{ padding: '22px 29px 18px', borderBottom: '1px solid #f0ede7', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, letterSpacing: '-0.3px' }}>{editProject ? 'Modifica Immobile' : 'Nuovo Immobile'}</h2>
            <div style={{ fontSize: 12, color: '#8c867d', marginTop: 4 }}>
              {isNew ? `Passo ${step} di 2` : 'Inserisci le informazioni per il tuo immobile'}
            </div>
          </div>
          {mandatory ? (
            <button onClick={onClose} style={{ background: 'transparent', border: '1px solid #e4e1da', cursor: 'pointer', padding: '7px 13px', borderRadius: 9, fontSize: 12, fontWeight: 700, color: '#57534c' }} className="hover:bg-gray-100">
              Crea dopo
            </button>
          ) : (
            <button onClick={onClose} style={{ background: 'transparent', border: 'none', cursor: 'pointer', padding: 4, borderRadius: 7 }} className="hover:bg-gray-100">
              <Icon name="x" size={18} color="#8c867d" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="max-md:!p-4" style={{ padding: '18px 29px 29px', overflowY: 'auto', position: 'relative', zIndex: 10 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {(editProject || step === 1) && (<>
              <div>
                <label style={labelStyle}>Nome immobile <span style={{ color: '#dc2626' }}>*</span></label>
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
                <label style={labelStyle}>Indirizzo <span style={{ color: '#dc2626' }}>*</span></label>
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
                {cropSrc ? (
                  <div style={{ position: 'relative', width: '100%', height: 162, borderRadius: 14, overflow: 'hidden', border: '1px solid #e4e1da', background: '#211f1c' }}>
                    <Cropper
                      image={cropSrc}
                      crop={crop}
                      zoom={1}
                      aspect={1}
                      objectFit="cover"
                      showGrid={false}
                      onCropChange={setCrop}
                      onCropComplete={(_: Area, px: Area) => setCropArea(px)}
                    />
                    <label style={{ position: 'absolute', bottom: 9, left: 9, zIndex: 5, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Icon name="image-plus" size={13} color="#fff" />Cambia foto
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleCoverFile(e.target.files?.[0])} />
                    </label>
                    <div onClick={() => { setCropSrc(null); setCover(''); }} style={{ position: 'absolute', bottom: 9, right: 9, zIndex: 5, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Rimuovi</div>
                  </div>
                ) : cover ? (
                  <div style={{ position: 'relative', width: '100%', height: 162, borderRadius: 14, overflow: 'hidden', border: '1px solid #e4e1da', backgroundImage: `url("${cover}")`, backgroundSize: 'cover', backgroundPosition: 'center' }}>
                    <label style={{ position: 'absolute', bottom: 9, left: 9, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <Icon name="image-plus" size={13} color="#fff" />Cambia foto
                      <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => handleCoverFile(e.target.files?.[0])} />
                    </label>
                    <div onClick={() => setCover('')} style={{ position: 'absolute', bottom: 9, right: 9, background: 'rgba(0,0,0,0.55)', color: '#fff', padding: '5px 11px', borderRadius: 7, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Rimuovi</div>
                  </div>
                ) : (
                  <label
                    onDragOver={e => { e.preventDefault(); setDragOver(true); }}
                    onDragLeave={() => setDragOver(false)}
                    onDrop={e => { e.preventDefault(); setDragOver(false); handleCoverFile(e.dataTransfer.files?.[0]); }}
                    style={{ display: 'block', border: `2px dashed ${dragOver ? '#3B83F6' : '#d8d4cb'}`, borderRadius: 14, padding: '29px 18px', textAlign: 'center', background: dragOver ? '#eff6ff' : '#fcfcfb', cursor: 'pointer', transition: 'all .2s', position: 'relative', overflow: 'hidden' }}
                  >
                    <input type="file" accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} onChange={e => handleCoverFile(e.target.files?.[0])} />
                    <div style={{ width: 40, height: 40, borderRadius: 11, background: '#fff', border: '1px solid #f0ede7', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 11px', boxShadow: '0 4px 12px rgba(0,0,0,0.04)' }}>
                      <Icon name="image-plus" size={18} color={dragOver ? '#3B83F6' : '#8c867d'} />
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: dragOver ? '#3B83F6' : '#57534c' }}>Trascina o clicca qui</div>
                    <div style={{ fontSize: 11.5, color: '#8c867d', marginTop: 4 }}>Se lasci vuoto, creeremo uno sfondo colorato per te.</div>
                  </label>
                )}
              </div>
              </>)}

              {(editProject || step === 2) && (<>
              {!isNew && <hr style={{ border: 'none', borderTop: '1px solid #f0ede7', margin: '7px 0' }} />}

              <div className="max-md:!grid-cols-2" style={{ display: 'grid', gridTemplateColumns: editProject ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)', gap: 14 }}>
                {iconFieldPickable('prezzo', `Prezzo (${fieldIcons.prezzo === 'dollar' ? '$' : fieldIcons.prezzo === 'pound' ? '£' : '€'})`, prezzo, v => setPrezzo(formatNumber(v)), 'es. 350.000', CURRENCY_KEYS)}
                {iconFieldPickable('mq', getLabelForIcon(fieldIcons.mq, 'Metratura (m²)'), mq, v => setMq(formatNumber(v)), 'es. 95')}
                {iconFieldPickable('camere', getLabelForIcon(fieldIcons.camere, 'Camere'), camere, v => setCamere(formatNumber(v)), 'es. 2')}
                {iconFieldPickable('bagni', getLabelForIcon(fieldIcons.bagni, 'Bagni'), bagni, v => setBagni(formatNumber(v)), 'es. 1')}
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
                <textarea value={descrizione} onChange={e => setDescrizione(e.target.value)} rows={4} placeholder="Descrizione immobile" style={{ ...inputStyle, resize: 'vertical', minHeight: 83 } as React.CSSProperties} />
                <div style={{ fontSize: 10.5, color: '#b3aca1', marginTop: 7 }}>Tutti i campi sono modificabili e disponibili per i report.</div>
              </div>
              )}

              {/* Dati aggiuntivi: scegli il dato dal dropdown, poi inserisci il valore */}
              {editProject && (
              <div>
                <label style={labelStyle}>Dati aggiuntivi</label>
                {customFields.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 9, marginBottom: 11 }}>
                    {customFields.map((f, i) => {
                      const ph = PRESET_EXTRA_FIELDS.find(p => p.label === f.key)?.placeholder || 'Valore';
                      return (
                        <div key={i} style={{ display: 'flex', gap: 7, alignItems: 'center' }}>
                          {f.custom ? (
                            <input
                              ref={el => { if (f.custom) rowInputRefs.current.set(i, el); }}
                              value={f.key}
                              onChange={e => setCustomFields(prev => prev.map((x, j) => j === i ? { ...x, key: e.target.value } : x))}
                              placeholder="Nome dato"
                              style={{ ...inputStyle, flex: '0 0 40%' } as React.CSSProperties}
                              onFocus={e => e.currentTarget.style.borderColor = '#3B83F6'}
                              onBlur={e => e.currentTarget.style.borderColor = '#e4e1da'}
                            />
                          ) : (
                            <div style={{ flex: '0 0 40%', display: 'flex', alignItems: 'center', gap: 7, padding: '10px 13px', border: '1px solid #e4e1da', borderRadius: 9, background: '#faf9f7', fontSize: 12, fontWeight: 700, color: '#57534c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              <span style={{ width: 14, height: 14, display: 'flex', flex: 'none' }} dangerouslySetInnerHTML={{ __html: (TPL_ICONS as Record<string, string>)[iconForKey(f.key)] || (TPL_ICONS as Record<string, string>).tag || '' }} />
                              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis' }}>{f.key}</span>
                            </div>
                          )}
                          <input
                            ref={el => { if (!f.custom) rowInputRefs.current.set(i, el); }}
                            value={f.value}
                            onChange={e => setCustomFields(prev => prev.map((x, j) => j === i ? { ...x, value: e.target.value } : x))}
                            placeholder={ph}
                            style={{ ...inputStyle, flex: 1 } as React.CSSProperties}
                            onFocus={e => e.currentTarget.style.borderColor = '#3B83F6'}
                            onBlur={e => e.currentTarget.style.borderColor = '#e4e1da'}
                          />
                          <button
                            type="button"
                            onClick={() => setCustomFields(prev => prev.filter((_, j) => j !== i))}
                            aria-label="Rimuovi campo"
                            style={{ flex: 'none', width: 34, height: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #e4e1da', borderRadius: 9, background: '#fff', cursor: 'pointer', color: '#8c867d' }}
                          >
                            <Icon name="x" size={14} color="#8c867d" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
                <div ref={addMenuRef} style={{ position: 'relative' }}>
                  <Box
                    as="button"
                    type="button"
                    onClick={() => setAddMenuOpen(o => !o)}
                    style={{ ...inputStyle, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer', color: '#57534c', fontWeight: 700, textAlign: 'left' } as React.CSSProperties}
                    hover={s('border-color:var(--border-dark)')}
                  >
                    + Aggiungi un dato…
                    <span style={{ display: 'flex', transition: 'transform .15s', transform: addMenuOpen ? 'rotate(180deg)' : 'none' }}><Icon name="chevron-down" size={14} color="#8c867d" /></span>
                  </Box>
                  {addMenuOpen && (
                    <div style={{ position: 'absolute', bottom: 'calc(100% + 4px)', left: 0, right: 0, background: '#fff', border: '1px solid #e4e1da', borderRadius: 9, boxShadow: '0 -12px 32px rgba(33,31,28,.14)', zIndex: 20, overflow: 'hidden', maxHeight: 252, overflowY: 'auto' }}>
                      {availablePresets.length > 0 && (
                        <Box as="button" type="button" onClick={() => { pendingFocusRef.current = customFields.length; setCustomFields(prev => [...prev, ...availablePresets.map(p => ({ key: p.label, value: '' }))]); setAddMenuOpen(false); }} style={s('display:flex;align-items:center;gap:7px;width:100%;padding:10px 13px;border:none;background:#eef4fe;cursor:pointer;font-size:12px;font-weight:700;color:#1d5fd0;text-align:left;border-bottom:1px solid #f0ede7') as React.CSSProperties} hover={s('background:#e0ecfd')}>
                          <Icon name="plus" size={14} color="#1d5fd0" />Aggiungi tutti ({availablePresets.length})
                        </Box>
                      )}
                      {availablePresets.map(p => (
                        <Box key={p.label} as="button" type="button" onClick={() => { pendingFocusRef.current = customFields.length; setCustomFields(prev => [...prev, { key: p.label, value: '' }]); setAddMenuOpen(false); }} style={s('display:flex;align-items:center;gap:7px;width:100%;padding:9px 13px;border:none;background:transparent;cursor:pointer;font-size:12px;font-weight:600;color:#211f1c;text-align:left') as React.CSSProperties} hover={s('background:#faf9f7')}>
                          <span style={{ width: 14, height: 14, display: 'flex', flex: 'none', color: '#57534c' }} dangerouslySetInnerHTML={{ __html: (TPL_ICONS as Record<string, string>)[iconForKey(p.label)] || (TPL_ICONS as Record<string, string>).tag || '' }} />
                          {p.label}
                        </Box>
                      ))}
                      <Box as="button" type="button" onClick={() => { pendingFocusRef.current = customFields.length; setCustomFields(prev => [...prev, { key: '', value: '', custom: true }]); setAddMenuOpen(false); }} style={s('display:flex;align-items:center;gap:7px;width:100%;padding:9px 13px;border:none;border-top:1px solid #f0ede7;background:transparent;cursor:pointer;font-size:12px;font-weight:600;color:#57534c;text-align:left') as React.CSSProperties} hover={s('background:#faf9f7')}>
                        <Icon name="plus" size={14} color="#8c867d" />Altro (personalizzato)…
                      </Box>
                    </div>
                  )}
                </div>
              </div>
              )}
              </>)}
          </div>
        </div>

        {/* Footer */}
        <div className="max-md:!p-4 max-md:!flex-col max-md:!gap-4" style={{ padding: '18px 29px', borderTop: '1px solid #f0ede7', background: '#faf9f7', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', position: 'relative', zIndex: 5 }}>
              <div style={{ display: 'flex', gap: 11, marginTop: 0, width: '100%', justifyContent: 'flex-end' }}>
                {editProject ? (
                  <>
                    <Box as="button" onClick={() => setConfirmDel(true)} disabled={loading || deleting} style={s('border:1.5px solid #dc2626;background:#fff;color:#dc2626;font-size:13px;font-weight:700;padding:11px 18px;border-radius:11px;cursor:' + (loading || deleting ? 'default' : 'pointer') + ';flex:1;transition:all 0.2s;display:flex;align-items:center;justify-content:center;gap:7px;opacity:' + (loading || deleting ? 0.7 : 1))} hover={loading || deleting ? undefined : s('background:#dc2626;color:#fff')}>
                      {deleting && <span style={{ width: 14, height: 14, border: '2px solid #dc2626', borderTopColor: 'transparent', borderRadius: '50%', display: 'inline-block', animation: 'export-spin .8s linear infinite' }} />}
                      {deleting ? 'Eliminazione...' : 'Elimina Immobile'}
                    </Box>
                    <Box as="button" onClick={() => handleFinish(false)} disabled={loading || deleting || !techFilled} style={s('border:none;background:#3B83F6;color:#fff;font-size:13px;font-weight:700;padding:11px 18px;border-radius:11px;cursor:' + (loading || deleting || !techFilled ? 'default' : 'pointer') + ';flex:1;box-shadow:0 4px 12px rgba(59,131,246,0.25);opacity:' + (loading || deleting || !techFilled ? 0.45 : 1))} hover={loading || deleting || !techFilled ? undefined : s('background:#2563EB;box-shadow:0 6px 16px rgba(59,131,246,0.3)')}>
                      {loading ? 'Salvataggio...' : 'Salva modifiche'}
                    </Box>
                  </>
                ) : step === 1 ? (
                  <>
                    <Box as="button" onClick={() => { if (nome.trim() && addr.trim()) setStep(2); }} style={s('border:none;background:#3B83F6;color:#fff;font-size:13px;font-weight:700;padding:11px 18px;border-radius:11px;cursor:' + (nome.trim() && addr.trim() ? 'pointer' : 'default') + ';flex:1;box-shadow:0 4px 12px rgba(59,131,246,0.25);opacity:' + (nome.trim() && addr.trim() ? 1 : 0.45))} hover={nome.trim() && addr.trim() ? s('background:#2563EB') : undefined}>
                      Avanti
                    </Box>
                  </>
                ) : (
                  <>
                    <Box as="button" onClick={() => setStep(1)} style={s('border:1px solid #e4e1da;background:#fff;color:#57534c;font-size:13px;font-weight:700;padding:11px 18px;border-radius:11px;cursor:pointer;flex:1')} hover={s('background:#f6f4f0;border-color:#d8d4cb')}>
                      Indietro
                    </Box>
                    {onImport && (
                      <Box as="button" onClick={() => onImport()} style={s('border:1px solid #e4e1da;background:#fff;color:#211f1c;font-size:13px;font-weight:700;padding:11px 18px;border-radius:11px;cursor:pointer;flex:1;display:flex;align-items:center;justify-content:center;gap:7px')} hover={s('background:#f6f4f0;border-color:#d8d4cb')}>
                        <Icon name="upload" size={14} color="#57534c" />Importa da file
                      </Box>
                    )}
                    <Box as="button" onClick={() => handleFinish(false)} disabled={loading || !techFilled} style={s('border:none;background:#3B83F6;color:#fff;font-size:13px;font-weight:700;padding:11px 18px;border-radius:11px;cursor:' + (loading || !techFilled ? 'default' : 'pointer') + ';flex:1;box-shadow:0 4px 12px rgba(59,131,246,0.25);opacity:' + (loading || !techFilled ? 0.45 : 1))} hover={loading || !techFilled ? undefined : s('background:#2563EB;box-shadow:0 6px 16px rgba(59,131,246,0.3)')}>
                      {loading ? 'Creazione...' : 'Crea Immobile'}
                    </Box>
                  </>
                )}
              </div>
        </div>

      </div>

      {/* Confirm delete dialog */}
      {confirmDel && (
        <div onClick={() => setConfirmDel(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(24,21,17,.5)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22 }}>
          <div onClick={e => e.stopPropagation()} style={{ width: '100%', maxWidth: 378, background: 'var(--bg-card, #fff)', borderRadius: 16, boxShadow: '0 32px 64px rgba(20,18,15,.2)', padding: 25, textAlign: 'center' }}>
            <div style={{ width: 47, height: 47, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 14px' }}>
              <Icon name="alert-triangle" size={22} color="#dc2626" />
            </div>
            <h3 style={{ margin: '0 0 5px', fontSize: 15, fontWeight: 800 }}>Eliminare questo immobile?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 12, color: '#8c867d', lineHeight: 1.5 }}>Tutti i dati associati verranno rimossi. L&apos;azione è irreversibile.</p>
            <div style={{ display: 'flex', gap: 9 }}>
              <Box as="button" onClick={() => setConfirmDel(false)} style={s('flex:1;border:1px solid #d8d4cb;background:#fff;color:#8c867d;font-size:13px;font-weight:700;padding:10px 0;border-radius:9px;cursor:pointer')} hover={s('background:#faf9f7')}>Annulla</Box>
              <Box as="button" onClick={() => { setConfirmDel(false); handleDelete(); }} style={{ flex: 1, border: 'none', background: '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, padding: '10px 0', borderRadius: 9, cursor: 'pointer' }} hover={{ background: '#b91c1c' }}>Elimina</Box>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
