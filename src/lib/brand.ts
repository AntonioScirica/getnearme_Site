// Per-user agency brand (white-label): logos, primary color, company info.
// Backed by the `user_brand` table + `user-brand` storage bucket, accessed
// directly via RLS (single-user, no team).

import { supabase } from './supabase';

export type BrandLogos = {
  logo_white_h: string | null;
  logo_white_v: string | null;
  logo_black_h: string | null;
  logo_black_v: string | null;
  logo_colored_h: string | null;
  logo_colored_v: string | null;
};

export type BrandSettings = {
  logos: BrandLogos;
  logoOrientation: 'vertical' | 'horizontal';
  primaryColor: string;
  companyName: string;
  companyWebsite: string;
  companyEmail: string;
  reportFinalTitle: string;
  reportFinalDesc: string;
};

export type BrandFetchResult = {
  isTeamMember: boolean; // kept for API compatibility; always false here
  role: 'owner' | 'member' | null;
  settings: BrandSettings;
};

export const DEFAULT_BRAND_SETTINGS: BrandSettings = {
  logos: {
    logo_white_h: null, logo_white_v: null,
    logo_black_h: null, logo_black_v: null,
    logo_colored_h: null, logo_colored_v: null,
  },
  logoOrientation: 'vertical',
  primaryColor: '#3B82F6',
  companyName: '', companyWebsite: '', companyEmail: '',
  reportFinalTitle: '', reportFinalDesc: '',
};

const BUCKET = 'user-brand';
const READ_TTL = 3600 * 24; // 24h signed URLs

const LOGO_KEYS = [
  'logo_white_h', 'logo_white_v',
  'logo_black_h', 'logo_black_v',
  'logo_colored_h', 'logo_colored_v',
] as const;
type LogoKey = typeof LOGO_KEYS[number];

async function getUid(): Promise<string | null> {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  } catch {
    return null;
  }
}

// ─── Local fallback (used while auth is bypassed / no Supabase session) ───────
const LS_KEY = 'gnm_brand';

function readLocal(): BrandSettings {
  if (typeof window === 'undefined') return DEFAULT_BRAND_SETTINGS;
  try {
    const raw = window.localStorage.getItem(LS_KEY);
    if (!raw) return DEFAULT_BRAND_SETTINGS;
    return { ...DEFAULT_BRAND_SETTINGS, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_BRAND_SETTINGS;
  }
}

function writeLocal(s: BrandSettings) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(LS_KEY, JSON.stringify(s)); } catch { /* quota */ }
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve) => {
    const fr = new FileReader();
    fr.onload = () => resolve(fr.result as string);
    fr.onerror = () => resolve('');
    fr.readAsDataURL(file);
  });
}

// Sign a storage path → temporary read URL.
async function signPath(path: string | null): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith('http') || path.startsWith('data:')) return path;
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, READ_TTL);
  return error ? null : data.signedUrl;
}

function rowToSettings(row: Record<string, unknown> | null, signed: Record<LogoKey, string | null>): BrandSettings {
  const logos = {} as BrandLogos;
  for (const k of LOGO_KEYS) logos[k] = signed[k];
  return {
    logos,
    logoOrientation: (row?.logo_orientation as 'vertical' | 'horizontal') || 'vertical',
    primaryColor: (row?.primary_color as string) || '#3B82F6',
    companyName: (row?.company_name as string) || '',
    companyWebsite: (row?.company_website as string) || '',
    companyEmail: (row?.company_email as string) || '',
    reportFinalTitle: (row?.report_final_title as string) || '',
    reportFinalDesc: (row?.report_final_desc as string) || '',
  };
}

export async function fetchBrand(): Promise<BrandFetchResult> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return { isTeamMember: false, role: 'owner', settings: readLocal() };

    const res = await fetch('/api/brand', {
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      cache: 'no-store'
    });

    if (!res.ok) {
      return { isTeamMember: false, role: 'owner', settings: readLocal() };
    }

    const { row, signed } = await res.json();
    return { isTeamMember: false, role: 'owner', settings: rowToSettings(row, signed) };
  } catch {
    return { isTeamMember: false, role: 'owner', settings: readLocal() };
  }
}

type Scope = 'team' | 'user'; // kept for signature compat; ignored

const FIELD_TO_DB: Record<string, string> = {
  logoOrientation: 'logo_orientation',
  primaryColor: 'primary_color',
  companyName: 'company_name',
  companyWebsite: 'company_website',
  companyEmail: 'company_email',
  reportFinalTitle: 'report_final_title',
  reportFinalDesc: 'report_final_desc',
};

async function upsertBrand(patch: Record<string, unknown>): Promise<boolean> {
  const uid = await getUid();
  if (!uid) { console.error('[brand] not authenticated'); return false; }
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;
  
  try {
    const res = await fetch('/api/brand', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ patch })
    });
    
    if (!res.ok) {
      const err = await res.json();
      console.error('[brand] upsert failed:', err.error);
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[brand] upsert exception:', err.message);
    return false;
  }
}

export async function updateBrand(_scope: Scope, updates: Partial<Record<keyof typeof FIELD_TO_DB, string>>): Promise<boolean> {
  const uid = await getUid();
  if (!uid) {
    // Local fallback: map client field names onto BrandSettings keys.
    const cur = readLocal();
    writeLocal({ ...cur, ...(updates as Partial<BrandSettings>) });
    return true;
  }
  const patch: Record<string, string> = {};
  for (const [k, v] of Object.entries(updates)) {
    const dbKey = FIELD_TO_DB[k];
    if (dbKey && v !== undefined) patch[dbKey] = v as string;
  }
  if (Object.keys(patch).length === 0) return true;
  return upsertBrand(patch);
}

// Upload a logo file to storage, then persist its path on the user_brand row.
export async function uploadBrandLogo(_scope: Scope, logoKey: string, file: File): Promise<boolean> {
  const uid = await getUid();
  if (!uid) {
    const dataUrl = await fileToDataUrl(file);
    if (!dataUrl) return false;
    const cur = readLocal();
    writeLocal({ ...cur, logos: { ...cur.logos, [logoKey]: dataUrl } });
    return true;
  }
  
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return false;

  try {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('logoKey', logoKey);

    const res = await fetch('/api/brand/logo', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`
      },
      body: formData
    });

    if (!res.ok) {
      console.error('[brand] logo upload failed via API');
      return false;
    }
    return true;
  } catch (err: any) {
    console.error('[brand] logo upload exception:', err.message);
    return false;
  }
}

export async function removeBrandLogo(_scope: Scope, logoKey: string): Promise<boolean> {
  const uid = await getUid();
  if (!uid) {
    const cur = readLocal();
    writeLocal({ ...cur, logos: { ...cur.logos, [logoKey]: null } });
    return true;
  }
  return upsertBrand({ [logoKey]: null });
}

// Convert a (possibly cross-origin) logo URL to a self-contained data URL so
// html2canvas export does not taint the canvas. Returns null on failure.
export async function logoUrlToDataUrl(url: string | null): Promise<string | null> {
  if (!url) return null;
  if (url.startsWith('data:')) return url;
  try {
    const resp = await fetch(url);
    if (!resp.ok) return null;
    const blob = await resp.blob();
    return await new Promise<string>((resolve) => {
      const fr = new FileReader();
      fr.onload = () => resolve(fr.result as string);
      fr.onerror = () => resolve('');
      fr.readAsDataURL(blob);
    });
  } catch {
    return null;
  }
}
