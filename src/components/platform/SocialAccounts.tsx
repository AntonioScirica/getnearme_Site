'use client';

// Profilo, "I tuoi social" (06/10/2026): Facebook, Instagram e TikTok collegati per pubblicare dal popup "Condividi sui
// social" senza passare dal telefono. Collegare apre l'accesso di Meta o TikTok in una finestra; con piu' Pagine Facebook
// la scelta la fa la pagina /social-connected (PagePicker), poi qui si ricarica da solo (socialApi.useSocialAccounts).
// Sotto, i post programmati e pubblicati di tutti gli immobili (SocialPostsList), con Annulla sui programmati.
import { useCallback, useEffect, useState } from 'react';
import { AlertCircle, CalendarClock, Check, CheckCircle2, Clock, ExternalLink, Facebook, Instagram, Loader2, Music2, Plug, X } from 'lucide-react';
import { CARD_SHADOW } from './api';
import { pageLocale, tr } from './i18n';
import { cancelPost, connect, disconnect, friendlyError, listPosts, NET_LABEL, SOCIAL_NETS, usable, useSocialAccounts, type SocialNet, type SocialPost } from './socialApi';

export const SOCIAL_ICON = { facebook: Facebook, instagram: Instagram, tiktok: Music2 } as const;

const HINT: Record<SocialNet, [string, string]> = {
  facebook: ['Pubblica sulla Pagina Facebook della tua agenzia', 'Posts on your agency Facebook Page'],
  instagram: ['Serve un profilo Instagram aziendale, collegato alla tua Pagina Facebook', 'Needs an Instagram business profile linked to your Facebook Page'],
  tiktok: ['I post arrivano nell’app TikTok, li confermi tu', 'Posts arrive in the TikTok app, you confirm them'],
};

export default function SocialAccountsCard() {
  const { accounts, failed, reload, byNet } = useSocialAccounts();
  const [busy, setBusy] = useState<SocialNet | null>(null);
  const [ask, setAsk] = useState<SocialNet | null>(null); // "Scollego?" in linea
  const [err, setErr] = useState('');
  const doConnect = async (n: SocialNet) => {
    setErr(''); setBusy(n);
    try { await connect(n); } catch { setErr(tr('Non riesco ad aprire il collegamento. Riprova tra poco.', 'I cannot open the connection. Try again shortly.')); }
    setBusy(null);
  };
  const doDisconnect = async (n: SocialNet) => {
    setErr(''); setBusy(n); setAsk(null);
    try { await disconnect(n); await reload(); } catch { setErr(tr('Non sono riuscito a scollegare, riprova.', 'I could not disconnect, try again.')); }
    setBusy(null);
  };
  return (
    <div className={`mt-4 rounded-[28px] bg-white p-6 ${CARD_SHADOW}`}>
      <h2 className="font-semibold">{tr('I tuoi social', 'Your social accounts')}</h2>
      <p className="mt-1 text-sm text-muted">{tr('Collegali una volta e pubblichi i post delle tue case da qui, senza passare dal telefono.', 'Connect them once and post your homes from here, without your phone.')}</p>
      <ul className="mt-4 divide-y divide-line">
        {SOCIAL_NETS.map(n => {
          const a = byNet(n), I = SOCIAL_ICON[n], ok = usable(a), expired = !!a && !ok;
          return (
            <li key={n} className="flex flex-wrap items-center gap-3 py-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-canvas text-ink"><I size={20} aria-hidden /></span>
              <span className="min-w-0 flex-1">
                <span className="block text-base font-semibold">{NET_LABEL[n]}</span>
                {accounts === null && !failed ? <span className="block h-4 w-28 animate-pulse rounded-full bg-canvas" />
                  : ok ? <span className="flex items-center gap-1 truncate text-sm text-ink"><Check size={14} className="shrink-0 text-brand" strokeWidth={3} /> <span className="truncate">{a!.name || tr('Collegato', 'Connected')}</span></span>
                  : expired ? <span className="flex items-center gap-1 text-sm text-amber-700"><AlertCircle size={14} className="shrink-0" /> {tr('Collegamento scaduto', 'Connection expired')}</span>
                  : <span className="block text-sm text-muted">{tr(...HINT[n])}</span>}
              </span>
              {ok && ask === n ? (
                <span className="blur-in flex items-center gap-1">
                  <span className="mr-1 text-sm font-medium">{tr('Scollego?', 'Disconnect?')}</span>
                  <button type="button" onClick={() => void doDisconnect(n)} className="h-10 rounded-full bg-ink px-4 text-sm font-semibold text-white hover:bg-red-600">{tr('Sì', 'Yes')}</button>
                  <button type="button" onClick={() => setAsk(null)} className="h-10 rounded-full px-4 text-sm font-semibold text-muted hover:bg-canvas hover:text-ink">{tr('No', 'No')}</button>
                </span>
              ) : ok ? (
                <button type="button" onClick={() => setAsk(n)} disabled={!!busy} className="flex h-10 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-muted ring-1 ring-line ease-smooth transition-colors hover:bg-canvas hover:text-ink disabled:opacity-50">
                  {busy === n ? <Loader2 size={15} className="animate-spin" /> : null} {tr('Scollega', 'Disconnect')}
                </button>
              ) : (
                <button type="button" onClick={() => void doConnect(n)} disabled={!!busy || (accounts === null && !failed)} className="flex h-10 items-center gap-1.5 rounded-full bg-ink px-5 text-sm font-semibold text-white ease-smooth transition-colors hover:bg-brand disabled:opacity-50">
                  {busy === n ? <Loader2 size={15} className="animate-spin" /> : <Plug size={15} />} {expired ? tr('Collega di nuovo', 'Reconnect') : tr('Collega', 'Connect')}
                </button>
              )}
            </li>
          );
        })}
      </ul>
      {(byNet('facebook') || byNet('instagram')) && <p className="mt-1 text-sm text-muted">{tr('Facebook e Instagram si collegano insieme: scegli la Pagina, e l’Instagram aziendale collegato a lei arriva da solo.', 'Facebook and Instagram connect together: choose the Page, and its linked Instagram business profile comes along.')}</p>}
      {failed && <p className="mt-2 text-sm text-red-600">{tr('Non riesco a vedere i tuoi social adesso. Ricarica la pagina tra poco.', 'I cannot load your social accounts now. Reload the page shortly.')}</p>}
      {err && <p className="mt-2 text-sm text-red-600">{err}</p>}
      <SocialPostsList title={tr('Post programmati e pubblicati', 'Scheduled and published posts')} />
    </div>
  );
}

const when = (iso: string) => new Date(iso).toLocaleString(pageLocale(), { weekday: 'short', day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

// Elenco dei post (di un immobile o di tutti): stato, quando, link al post pubblicato, Annulla sui programmati.
// Si aggiorna da solo finche' qualcuno e' in pubblicazione; refreshKey lo ricarica (dopo un nuovo post dal popup).
export function SocialPostsList({ project, title, refreshKey = 0, compact = false }: { project?: string; title: string; refreshKey?: number; compact?: boolean }) {
  const [posts, setPosts] = useState<SocialPost[] | null>(null);
  const [ask, setAsk] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const load = useCallback(() => listPosts({ project }).then(setPosts).catch(() => setPosts(p => p ?? [])), [project]);
  useEffect(() => { void load(); }, [load, refreshKey]);
  useEffect(() => {
    const moving = posts?.some(p => p.status === 'publishing' || (p.status === 'scheduled' && Date.parse(p.scheduledAt) < Date.now() + 60_000));
    if (!moving) return;
    const t = setTimeout(() => void load(), 8000);
    return () => clearTimeout(t);
  }, [posts, load]);
  if (!posts?.length) return null;
  const cancel = async (id: string) => { setBusy(id); setAsk(null); await cancelPost(id); await load(); setBusy(null); };
  const shown = posts.slice(0, compact ? 5 : 12);
  return (
    <div className={compact ? 'mt-3' : 'mt-5 border-t border-line pt-4'}>
      <h3 className="text-sm font-semibold">{title}</h3>
      <ul className="mt-2 space-y-2">
        {shown.map(p => {
          const I = SOCIAL_ICON[p.net];
          const state = p.status === 'published' ? { icon: <CheckCircle2 size={14} className="text-emerald-600" />, text: tr('Pubblicato', 'Published'), at: p.publishedAt ?? p.scheduledAt }
            : p.status === 'scheduled' ? { icon: <CalendarClock size={14} className="text-brand" />, text: tr('Programmato', 'Scheduled'), at: p.scheduledAt }
            : p.status === 'publishing' ? { icon: <Loader2 size={14} className="animate-spin text-brand" />, text: tr('Sto pubblicando', 'Publishing'), at: null }
            : p.retrying ? { icon: <Clock size={14} className="text-amber-600" />, text: tr('Riprovo tra poco', 'Retrying soon'), at: null }
            : { icon: <AlertCircle size={14} className="text-red-600" />, text: tr('Non pubblicato', 'Not published'), at: null };
          const what = p.mediaType === 'video' ? tr('Video', 'Video') : p.carousel ? tr(`${p.count} foto`, `${p.count} photos`) : p.format === 'story' ? tr('Storia', 'Story') : tr('Foto', 'Photo');
          return (
            <li key={p.id} className={`rounded-[20px] ${compact ? 'bg-white ring-1 ring-black/5' : 'bg-canvas'} px-3 py-2.5`}>
              <div className="flex items-center gap-2.5">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-ink ring-1 ring-black/5"><I size={15} aria-hidden /></span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-center gap-1.5 text-sm font-semibold">{state.icon} {state.text}</span>
                  <span className="block truncate text-xs text-muted">{NET_LABEL[p.net]}, {what}{state.at ? `, ${when(state.at)}` : ''}</span>
                </span>
                {p.status === 'published' && p.link && <a href={p.link} target="_blank" rel="noopener" className="flex h-9 shrink-0 items-center gap-1 rounded-full px-3 text-sm font-semibold text-brand hover:bg-brand/10">{tr('Vedi', 'View')} <ExternalLink size={13} /></a>}
                {(p.status === 'scheduled' || (p.status === 'failed' && p.retrying)) && (ask === p.id ? (
                  <span className="blur-in flex shrink-0 items-center gap-1">
                    <button type="button" onClick={() => void cancel(p.id)} className="h-9 rounded-full bg-ink px-3 text-sm font-semibold text-white hover:bg-red-600">{tr('Annulla il post', 'Cancel post')}</button>
                    <button type="button" onClick={() => setAsk(null)} aria-label={tr('Lascia', 'Keep')} className="flex h-9 w-9 items-center justify-center rounded-full text-muted hover:bg-white hover:text-ink"><X size={15} /></button>
                  </span>
                ) : (
                  <button type="button" onClick={() => setAsk(p.id)} disabled={busy === p.id} className="h-9 shrink-0 rounded-full px-3 text-sm font-semibold text-muted hover:bg-white hover:text-ink disabled:opacity-50">{busy === p.id ? <Loader2 size={14} className="animate-spin" /> : tr('Annulla', 'Cancel')}</button>
                ))}
              </div>
              {p.status === 'failed' && !p.retrying && p.error && <p className="mt-1.5 pl-[42px] text-xs leading-relaxed text-red-700">{friendlyError(p.error, p.net)}</p>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
