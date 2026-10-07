'use client';

// Social collegati e pubblicazione diretta (06/10/2026). Collegare e scollegare: edge function della vecchia dashboard
// GetNearMe (social-oauth-start, social-accounts-list, social-disconnect), che hanno le chiavi Meta e TikTok.
// Pubblicare: api/platform/social-posts (coda scheduled_posts, la pubblica publish-due-posts ogni minuto).
import { useCallback, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { authFetch } from './api';
import { tr } from './i18n';

export type SocialNet = 'facebook' | 'instagram' | 'tiktok';
export const SOCIAL_NETS: SocialNet[] = ['facebook', 'instagram', 'tiktok'];
export type SocialAccount = { platform: SocialNet; name: string | null; avatar_url: string | null; token_status: 'valid' | 'expiring_soon' | 'expired' };
export type SocialPost = {
  id: string; net: SocialNet; status: 'scheduled' | 'publishing' | 'published' | 'partial' | 'failed';
  scheduledAt: string; publishedAt: string | null; mediaType: 'image' | 'video'; format: string; carousel: boolean; count: number;
  link: string | null; error: string | null; retrying: boolean;
};
export type SocialCaps = { carousel: boolean; fbStory: boolean; tiktokPhoto: boolean };
export const NET_LABEL: Record<SocialNet, string> = { facebook: 'Facebook', instagram: 'Instagram', tiktok: 'TikTok' };

const FN = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;
async function fn(name: string, init: RequestInit = {}) {
  const { data: { session } } = await supabase.auth.getSession();
  const r = await fetch(`${FN}/${name}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, Authorization: `Bearer ${session?.access_token}`, ...init.headers },
  });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(j.error || `http_${r.status}`);
  return j;
}

// Chi vede la pubblicazione social (07/10/2026): finche' Meta e TikTok non approvano l'app, solo le email nella variabile
// SOCIAL_PUBLISH_EMAILS del server (lib/socialAccess). Lo dice api/platform/social-posts?access=1 (200 si', 404 no).
// Una volta per utente collegato; se la rete va male si riprova alla prossima apertura.
let access: { uid: string; p: Promise<boolean> } | null = null;
export async function socialAccess() {
  const { data: { session } } = await supabase.auth.getSession();
  const uid = session?.user?.id;
  if (!uid) return false;
  if (!access || access.uid !== uid) {
    const p = authFetch('/api/platform/social-posts?access=1').then(r => r.ok).catch(() => { if (access?.p === p) access = null; return false; });
    access = { uid, p };
  }
  return access.p;
}
export function useSocialPublish() {
  const [on, setOn] = useState(false);
  useEffect(() => { let alive = true; void socialAccess().then(v => { if (alive) setOn(v); }); return () => { alive = false; }; }, []);
  return on;
}

// collegato davvero: Facebook pubblica col token della Pagina (non scade), Instagram e TikTok col token dell'utente
export const usable = (a?: SocialAccount | null) => !!a && (a.platform === 'facebook' || a.token_status !== 'expired');

// Avviso tra schede: la pagina /social-connected (dove torna Meta o TikTok) scrive questa chiave, la piattaforma ricarica.
export const SOCIAL_SIGNAL = 'agenteimmo:social-connected';
const BUS = 'agenteimmo-social';

// gli account collegati, condivisi tra Profilo e popup; si ricaricano quando si torna sulla pagina o arriva l'avviso
let cache: { at: number; p: Promise<SocialAccount[]> } | null = null;
export function loadAccounts(fresh = false) {
  if (!cache || fresh || Date.now() - cache.at > 60_000) {
    const p = fn('social-accounts-list', { method: 'GET' }).then(j => (j.accounts ?? []) as SocialAccount[]);
    p.catch(() => { if (cache?.p === p) cache = null; });
    cache = { at: Date.now(), p };
  }
  return cache.p;
}
// enabled false (pubblicazione social non abilitata per l'utente): niente richieste, nessun account
export function useSocialAccounts(enabled = true) {
  const [accounts, setAccounts] = useState<SocialAccount[] | null>(null);
  const [failed, setFailed] = useState(false);
  const reload = useCallback((fresh = true) => loadAccounts(fresh).then(a => { setAccounts(a); setFailed(false); }).catch(() => setFailed(true)), []);
  useEffect(() => {
    if (!enabled) return;
    void reload(false);
    const onVis = () => { if (!document.hidden) void reload(); };
    const onStore = (e: StorageEvent) => { if (e.key === SOCIAL_SIGNAL) void reload(); };
    let bc: BroadcastChannel | null = null;
    try { bc = new BroadcastChannel(BUS); bc.onmessage = () => void reload(); } catch { /* vecchi browser */ }
    const onMsg = (e: MessageEvent) => { if (e.origin === location.origin && e.data === SOCIAL_SIGNAL) void reload(); };
    document.addEventListener('visibilitychange', onVis); window.addEventListener('focus', onVis);
    window.addEventListener('storage', onStore); window.addEventListener('message', onMsg);
    return () => { document.removeEventListener('visibilitychange', onVis); window.removeEventListener('focus', onVis); window.removeEventListener('storage', onStore); window.removeEventListener('message', onMsg); bc?.close(); };
  }, [reload, enabled]);
  const byNet = (n: SocialNet) => accounts?.find(a => a.platform === n) ?? null;
  return { accounts, failed, reload, byNet };
}
// chiamata dalla pagina /social-connected: avvisa la piattaforma aperta in un'altra scheda (o la finestra che l'ha aperta)
export function signalConnected() {
  try { localStorage.setItem(SOCIAL_SIGNAL, String(Date.now())); } catch { /* niente storage */ }
  try { const bc = new BroadcastChannel(BUS); bc.postMessage('done'); bc.close(); } catch { /* vecchi browser */ }
  try { window.opener?.postMessage(SOCIAL_SIGNAL, location.origin); } catch { /* aperta da altro sito */ }
}

// Collega: Facebook e Instagram sono lo stesso accesso Meta (la Pagina e l'Instagram aziendale collegato a lei).
// Si apre una finestra (aperta subito, nel tocco, cosi' il browser non la blocca): il popup "Condividi sui social" resta
// com'e', con le scelte fatte. Se il browser la blocca: dal Profilo si va nella stessa scheda (sameTab), dal popup errore
// 'blocked' (si perderebbero le scelte) e si chiede di consentire le finestre.
export async function connect(net: SocialNet, sameTab = true) {
  const w = window.open('', 'agenteimmo-social', 'width=600,height=760');
  if ((!w || w.closed) && !sameTab) throw new Error('blocked');
  try {
    const { authUrl } = await fn('social-oauth-start', { method: 'POST', body: JSON.stringify({ platform: net }) });
    if (!authUrl) throw new Error('no_url');
    if (w && !w.closed) w.location.href = authUrl;
    else window.location.href = authUrl;
  } catch (e) { w?.close(); throw e; }
}
export const disconnect = (net: SocialNet) => fn('social-disconnect', { method: 'POST', body: JSON.stringify({ platform: net }) }).then(() => { cache = null; });

// ---- post ----
export async function socialCaps(): Promise<SocialCaps> {
  const r = await authFetch('/api/platform/social-posts?caps=1').catch(() => null);
  const j = r?.ok ? await r.json().catch(() => null) : null;
  return j?.caps ?? { carousel: false, fbStory: false, tiktokPhoto: false };
}
export async function listPosts(q: { project?: string; ids?: string[] }) {
  const sp = new URLSearchParams();
  if (q.project) sp.set('project', q.project);
  if (q.ids?.length) sp.set('ids', q.ids.join(','));
  const r = await authFetch(`/api/platform/social-posts?${sp}`);
  if (!r.ok) throw new Error('list');
  return ((await r.json()).posts ?? []) as SocialPost[];
}
export async function cancelPost(id: string) {
  const r = await authFetch(`/api/platform/social-posts?id=${id}`, { method: 'DELETE' });
  return r.ok;
}
// carica i file (cartella privata dell'utente) e mette il post in coda: at null = adesso
export async function createPost(o: { net: SocialNet; files: File[]; mediaType: 'image' | 'video'; format: 'feed' | 'square' | 'story' | 'reel'; caption: string; at: Date | null; project: string }) {
  const up = await authFetch('/api/platform/social-posts', { method: 'POST', body: JSON.stringify({ mode: 'upload', mimes: o.files.map(f => f.type || 'image/png') }) });
  const uj = await up.json().catch(() => ({}));
  if (!up.ok) throw new PublishError(uj.error || 'upload');
  const paths: string[] = [];
  for (const [i, u] of (uj.uploads as { path: string; token: string }[]).entries()) {
    const { error } = await supabase.storage.from('social-post-media').uploadToSignedUrl(u.path, u.token, o.files[i], { contentType: o.files[i].type || 'image/png' });
    if (error) throw new PublishError('upload');
    paths.push(u.path);
  }
  const r = await authFetch('/api/platform/social-posts', { method: 'POST', body: JSON.stringify({
    mode: 'create', net: o.net, mediaType: o.mediaType, mime: o.files[0]?.type, format: o.format, paths, caption: o.caption, project: o.project,
    at: o.at ? o.at.toISOString() : null, timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome',
  }) });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new PublishError(j.error || 'create');
  return j.post as SocialPost;
}
export class PublishError extends Error {}

// collegamento scaduto o permessi tolti: serve ricollegare, riprovare non basta
export const needsReconnect = (code: string) => code === 'expired' || code === 'not_connected' || /"code":\s*(190|10|200)\b|oauthexception|session has expired|token.*(expired|invalid)|token_expired|access_token_invalid|permission/i.test(code);

// L'errore detto semplice, con cosa fare. Gli errori di Meta arrivano come testo con il JSON dentro (codice e messaggio).
export function friendlyError(code: string, net: SocialNet) {
  const N = NET_LABEL[net];
  const reconnect = tr(`Il collegamento con ${N} è scaduto. Vai nel Profilo, in "I tuoi social", e collega di nuovo ${N}.`, `The ${N} connection expired. Go to Profile, "Your social accounts", and connect ${N} again.`);
  if (code === 'not_connected') return tr(`${N} non è collegato. Collegalo dal Profilo, in "I tuoi social".`, `${N} is not connected. Connect it from Profile, "Your social accounts".`);
  if (code === 'expired') return reconnect;
  if (code === 'ig_daily_limit') return tr('Oggi hai già pubblicato 25 post su Instagram, il massimo che Instagram permette. Programmalo per domani.', 'You already posted 25 times on Instagram today, the most Instagram allows. Schedule it for tomorrow.');
  if (code === 'ig_webm') return tr('Instagram non accetta questo tipo di video. Usa Chrome aggiornato o pubblica le foto.', 'Instagram does not accept this video type. Use an updated Chrome or post the photos.');
  if (code === 'not_supported_yet') return tr('Questo tipo di post non si può ancora pubblicare da qui. Usa "Pubblica su" oppure scegli una foto sola.', 'This kind of post cannot be published from here yet. Use "Post on" or choose one photo.');
  if (code === 'date_past') return tr('L\'ora scelta è già passata. Scegli un\'ora più avanti.', 'That time has passed. Choose a later time.');
  if (code === 'date_far') return tr('Puoi programmare al massimo 6 mesi avanti.', 'You can schedule up to 6 months ahead.');
  if (code === 'caption_too_long') return tr('Il testo è troppo lungo. Accorcialo un po\' e riprova.', 'The text is too long. Shorten it and try again.');
  if (code === 'upload') return tr('Non sono riuscito a caricare il post. Controlla la connessione e riprova.', 'I could not upload the post. Check your connection and try again.');
  const s = code.toLowerCase();
  if (/"code":\s*190|oauthexception|session has expired|token.*(expired|invalid)|token_expired|access_token_invalid/.test(s)) return reconnect;
  if (/"code":\s*(10|200|3)\b|permission|not authorized|scope/.test(s)) return tr(`${N} non ci dà il permesso di pubblicare. Collega di nuovo ${N} dal Profilo e accetta tutti i permessi richiesti.`, `${N} does not let us post. Connect ${N} again from Profile and accept all the permissions.`);
  if (/aspect ratio|36003|2207009/.test(s)) return tr(`${N} non accetta questa misura di foto. Prova un altro tipo di post.`, `${N} does not accept this photo size. Try another post type.`);
  if (/video|2207026|duration|codec/.test(s)) return tr(`${N} non ha accettato il video. Prova a pubblicare le foto.`, `${N} did not accept the video. Try posting the photos.`);
  if (/spam|limit|368|9007|rate/.test(s)) return tr(`${N} ha bloccato il post per qualche minuto. Riprova più tardi.`, `${N} blocked the post for a few minutes. Try again later.`);
  return tr(`${N} non ha accettato il post. Riprova tra qualche minuto; se succede ancora, salva il post e pubblicalo dall'app di ${N}.`, `${N} did not accept the post. Try again in a few minutes; if it happens again, save the post and publish it from the ${N} app.`);
}
