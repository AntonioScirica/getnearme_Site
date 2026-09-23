import { supabase } from './supabase';

// Estratti da NewProjectModal: condivisi tra vecchia dashboard e nuova piattaforma.
export const createImage = (url: string): Promise<HTMLImageElement> =>
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
export async function downscaleDataUrl(dataUrl: string, maxDim = 1280, quality = 0.8): Promise<string> {
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
export async function uploadDataUrl(dataUrl: string, folder: string): Promise<string> {
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
