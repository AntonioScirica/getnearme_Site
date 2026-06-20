import React from 'react';
import Image from 'next/image';
import { Box, Icon } from './ui';
import { ProjectData } from '@/lib/projects';
import { fetchUserBatches, fetchBatchPhotos } from '@/lib/stagingBatches';

type RecentPhoto = { url: string; ts: number; isVideo?: boolean };

// Helpers
const s = (str: string) => str.split(';').reduce((acc: any, rule) => {
  if (!rule.trim()) return acc;
  const [k, v] = rule.split(':');
  if (k && v) {
    const camelK = k.trim().replace(/-([a-z])/g, g => g[1].toUpperCase());
    acc[camelK] = v.trim();
  }
  return acc;
}, {} as React.CSSProperties);

const fmt = (n?: number) => {
  if (n == null || isNaN(n)) return '-';
  return n.toLocaleString('it-IT');
};

import { ICONS as TPL_ICONS } from './templates/icons.js';

const getIconLabel = (key: string | undefined, def: string) => {
  if (!key) return def;
  const map: Record<string, string> = {
    euro: 'Prezzo (€)', dollar: 'Prezzo ($)', pound: 'Prezzo (£)',
    'maximize-2': 'Metratura', area: 'Superficie',
    bed: 'Camere', bath: 'Bagni',
    rooms: 'Locali', sofa: 'Soggiorno', cookingPot: 'Cucina',
    elevator: 'Ascensore', balcony: 'Balcone', terrace: 'Terrazzo',
    garden: 'Giardino', parking: 'Parcheggio', floor: 'Piano'
  };
  return map[key] || def;
};

const typeTag = (t: string) =>
  t === 'staging' ? { label: 'Staging', tBg: '#fdf3e4', tCol: '#9a6312' }
    : t === 'video' ? { label: 'Video', tBg: '#eef4fe', tCol: '#1d5fd0' }
      : t === 'post' ? { label: 'Post', tBg: '#e8f6ef', tCol: '#177a52' }
        : { label: 'Foto', tBg: '#f1efe9', tCol: '#57534c' };

export function HomeScreen({
  active,
  batches,
  videoJobs,
  toast,
  freeTrial,
  setNewProjOpen,
  onEditProject,
  go,
  getCoverStyle,
  onProjectUpdate,
}: {
  active: ProjectData | null;
  batches?: any[];
  videoJobs?: any[];
  toast?: (msg: string, icon?: string) => void;
  freeTrial?: { photos: number; videos: number } | null;
  setNewProjOpen: (b: boolean) => void;
  onEditProject?: () => void;
  go: (route: string) => void;
  getCoverStyle: (p: ProjectData) => any;
  onProjectUpdate?: (upd: Partial<ProjectData>) => void;
}) {

  // File upload handler for cover images
  const handleCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !onProjectUpdate) return;
    
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const MAX_SIZE = 800;
        if (width > height && width > MAX_SIZE) {
          height *= MAX_SIZE / width;
          width = MAX_SIZE;
        } else if (height > MAX_SIZE) {
          width *= MAX_SIZE / height;
          height = MAX_SIZE;
        }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.75);
        onProjectUpdate({ cover: dataUrl });
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    // reset input
    e.target.value = '';
  };

  // Carica le foto recenti generate per questo immobile dai batch (max 12 = 3 righe).
  const [recent, setRecent] = React.useState<RecentPhoto[]>([]);
  const [hasMoreRecent, setHasMoreRecent] = React.useState(false);
  const [loadingRecent, setLoadingRecent] = React.useState(true);
  const [lightbox, setLightbox] = React.useState<{ url: string; isVideo?: boolean } | null>(null);
  React.useEffect(() => {
    let cancelled = false;
    setLoadingRecent(true);
    (async () => {
      try {
        const batches = await fetchUserBatches();
        const valid = batches.filter(b =>
          b.completedItems > 0 && b.status !== 'failed' &&
          (!active?.id || !b.projectId || b.projectId === active.id)
        );
        const all: RecentPhoto[] = [];
        await Promise.all(valid.map(async b => {
          const photos = await fetchBatchPhotos(b.id);
          for (const p of photos) {
            if (p.resultUrl && p.status !== 'failed') all.push({ url: p.resultUrl, ts: new Date(b.createdAt).getTime() });
          }
        }));
        // Video AI finiti (tabella + cache locale).
        try {
          const { finishedVideos, fetchServerVideoJobs, mergeServerJobs } = await import('@/lib/videoJobs');
          const server = await fetchServerVideoJobs();
          if (server.length) mergeServerJobs(server);
          for (const v of finishedVideos(active?.id)) {
            if (v.outputUrl) all.push({ url: v.outputUrl, ts: v.createdAt, isVideo: true });
          }
        } catch { /* ignore */ }
        if (!cancelled) {
          const sorted = all.sort((a, b) => b.ts - a.ts);
          setHasMoreRecent(sorted.length > 12);
          setRecent(sorted.slice(0, 12));
        }
      } catch { /* ignore */ }
      finally { if (!cancelled) setLoadingRecent(false); }
    })();
    return () => { cancelled = true; };
  }, [active?.id]);

  // Festeggia quando il kit e' completo (transizione a 100%), una sola volta.
  const prevPctRef = React.useRef<number | null>(null);

  // Calculate completion
  const localHasPhotos = batches?.some(b => b.projectId === active?.id && b.status !== 'failed' && b.completedItems > 0) || false;
  const localHasVideo = videoJobs?.some(v => v.projectId === active?.id && v.stage === 'done') || false;

  const hasPhotos = localHasPhotos || (active?.nFoto || 0) + (active?.nStaging || 0) > 0;
  const hasVideo = localHasVideo || (active?.nVideo || 0) > 0;
  const postCount = active?.nPost || 0;
  // nPost non e' persistito dall'API -> al refresh tornerebbe 0. Affianchiamo un
  // flag locale per progetto (settato all'export del post) cosi' "Post Social
  // pronti" resta spuntato in modo affidabile.
  const postDoneLocal = typeof window !== 'undefined' && !!active?.id && (() => { try { return localStorage.getItem('gnm_post_done_' + active.id) === '1'; } catch { return false; } })();
  const hasSocial = postCount >= 1 || postDoneLocal;
  const completedCount = [hasPhotos, hasVideo, hasSocial].filter(Boolean).length;
  const completionPct = Math.round((completedCount / 3) * 100);

  React.useEffect(() => {
    if (prevPctRef.current !== null && completionPct === 100 && prevPctRef.current < 100) {
      toast?.('Kit completo! Hai tutti i materiali per questo immobile', 'check');
    }
    prevPctRef.current = completionPct;
  }, [completionPct, toast]);

  // Guard: senza immobile attivo (utente nuovo o dopo aver cancellato tutto)
  // mostriamo uno stato vuoto invece di crashare su active.nome.
  if (!active) {
    return (
      <div style={s('max-width:1160px;margin:0 auto;padding:36px 32px 64px')}>
        <div style={s('display:flex;flex-direction:column;align-items:center;justify-content:center;padding:80px 32px;text-align:center')}>
          <img src="/dashboard/logo-icon.svg" alt="GetNearMe" style={{ width: 56, height: 56, marginBottom: 24 }} />
          <h1 style={s('margin:0 0 8px;font-size:24px;font-weight:800;letter-spacing:-.3px')}>Benvenuto in GetNearMe</h1>
          <p style={s('margin:0 0 32px;font-size:15px;color:#8c867d;max-width:420px;line-height:1.6')}>Crea il tuo primo immobile per iniziare a generare foto AI, video e post social per i tuoi annunci</p>
          <Box onClick={() => setNewProjOpen(true)} style={s('display:inline-flex;align-items:center;gap:10px;background:#3B83F6;color:#fff;padding:14px 28px;border-radius:12px;font-size:15px;font-weight:700;cursor:pointer;transition:transform .2s,box-shadow .2s')} hover={{ transform: 'translateY(-2px)', boxShadow: '0 8px 24px rgba(59,131,246,.3)' }}>
            Crea il tuo primo immobile
          </Box>
          <div className="max-md:!mt-8 max-md:!grid-cols-1" style={s('margin-top:48px;display:grid;grid-template-columns:repeat(3,1fr);gap:20px;max-width:640px;width:100%')}>
            {[
              { icon: 'sparkles', title: 'Homestaging AI', desc: 'Arreda e trasforma le foto con un click' },
              { icon: 'film', title: 'Video AI', desc: 'Crea video professionali automaticamente' },
              { icon: 'megaphone', title: 'Post Social', desc: 'Template pronti per Instagram e social' },
            ].map(f => (
              <div key={f.title} style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:24px 20px;text-align:center')}>
                <div style={s('width:44px;height:44px;border-radius:12px;background:#f4f2ee;display:flex;align-items:center;justify-content:center;margin:0 auto 12px')}><Icon name={f.icon} size={20} color="#57534c" /></div>
                <div style={s('font-size:14px;font-weight:700;margin-bottom:4px')}>{f.title}</div>
                <div style={s('font-size:12.5px;color:#8c867d;line-height:1.5')}>{f.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* ── CINEMATIC HEADER ── */}
      <div className="max-md:!h-auto max-md:!min-h-[220px]" style={{ position: 'relative', height: 260, background: '#111', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', inset: 0, opacity: 0.6, ...getCoverStyle(active), filter: 'blur(10px) brightness(0.6)', transform: 'scale(1.1)' }} />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, #111, transparent)' }} />
        <div className="max-md:!p-6 max-md:!pb-6 max-md:!items-center" style={s('max-width:1160px;margin:0 auto;padding:0 32px;height:100%;display:flex;align-items:flex-end;position:relative;z-index:2;padding-bottom:32px')}>
          <div className="max-md:!flex-col max-md:!items-center max-md:!text-center max-md:!mt-12" style={{ display: 'flex', gap: 24, alignItems: 'center', width: '100%' }}>
            
            <label 
              style={{ cursor: 'pointer', position: 'relative', display: 'block', borderRadius: 20 }}
              onMouseEnter={e => {
                const img = e.currentTarget.querySelector('.cover-img') as HTMLElement;
                const overlay = e.currentTarget.querySelector('.cover-overlay') as HTMLElement;
                if(img) img.style.filter = 'brightness(0.7)';
                if(overlay) overlay.style.opacity = '1';
              }}
              onMouseLeave={e => {
                const img = e.currentTarget.querySelector('.cover-img') as HTMLElement;
                const overlay = e.currentTarget.querySelector('.cover-overlay') as HTMLElement;
                if(img) img.style.filter = 'none';
                if(overlay) overlay.style.opacity = '0';
              }}
            >
              <input type="file" accept="image/*" style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', zIndex: 10 }} onChange={handleCoverUpload} />
              <div className="cover-img" style={{ width: 120, height: 120, borderRadius: 20, ...getCoverStyle(active), boxShadow: '0 4px 12px rgba(0,0,0,.15)', transition: 'filter .2s' }} />
              <div className="cover-overlay" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0, transition: 'opacity .2s', pointerEvents: 'none' }}>
                <Icon name="camera" size={28} color="#fff" />
              </div>
            </label>

            <div className="max-md:!items-center max-md:!text-center" style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 0 }}>
              <div className="max-md:!justify-center" style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <h1 className="max-md:!text-2xl" style={s('margin:0;font-size:36px;font-weight:800;letter-spacing:-.5px;color:#fff;text-shadow:0 2px 8px rgba(0,0,0,.5);line-height:1.1')}>{active.nome}</h1>
              </div>
              <div className="max-md:!justify-center" style={s('color:rgba(255,255,255,.9);font-size:15px;display:flex;align-items:center;gap:6px;margin-top:2px')}><Icon name="map-pin" size={15} color="rgba(255,255,255,.7)" />{active.addr || 'Indirizzo non specificato'}</div>
              {onEditProject && (
                <div className="max-md:!text-center" style={{ marginTop: 6 }}>
                  <button onClick={onEditProject} title="Modifica immobile" style={{ background: 'transparent', border: 'none', padding: 0, cursor: 'pointer', color: 'rgba(255,255,255,0.8)', fontSize: 13, fontWeight: 500, textDecoration: 'underline', textUnderlineOffset: 4, transition: 'color 0.2s' }} onMouseEnter={e => e.currentTarget.style.color = '#fff'} onMouseLeave={e => e.currentTarget.style.color = 'rgba(255,255,255,0.8)'}>
                    Modifica
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>
      </div>

      <div className="max-md:!p-4" style={s('max-width:1160px;margin:0 auto;padding:48px 32px 32px')}>
        <div className="max-md:!grid-cols-1" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24 }}>
          {/* ── LEFT: BENTO BOX ACTIONS ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Quick Summary Row */}
            <div className="max-md:!grid-cols-2" style={s('display:grid;grid-template-columns:repeat(4,1fr);gap:12px')}>
              {[
                { 
                  label: active.icons?.prezzo === 'dollar' ? 'Prezzo ($)' : active.icons?.prezzo === 'pound' ? 'Prezzo (£)' : 'Prezzo (€)', 
                  value: fmt(active.prezzo), 
                  iconKey: active.icons?.prezzo || 'euro' 
                },
                { 
                  label: getIconLabel(active.icons?.mq, 'Metratura'), 
                  value: (active.mq ? active.mq + (['maximize-2', 'area'].includes(active.icons?.mq || '') ? ' m²' : '') : '-'), 
                  iconKey: active.icons?.mq || 'area' 
                },
                { 
                  label: getIconLabel(active.icons?.camere, 'Camere'), 
                  value: active.camere || '-', 
                  iconKey: active.icons?.camere || 'bed' 
                },
                { 
                  label: getIconLabel(active.icons?.bagni, 'Bagni'), 
                  value: active.bagni || '-', 
                  iconKey: active.icons?.bagni || 'bath' 
                },
              ].map(st => (
                <div key={st.label} style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:16px')}>
                  <div style={s('display:flex;align-items:center;gap:6px;margin-bottom:6px')}>
                    <span style={{ width: 14, height: 14, display: 'flex', color: '#b3aca1' }} dangerouslySetInnerHTML={{ __html: (TPL_ICONS as any)[st.iconKey] || '' }} />
                    <span style={s('font-size:11.5px;font-weight:700;color:#8c867d;text-transform:uppercase;letter-spacing:.04em')}>{st.label}</span>
                  </div>
                  <div style={s('font-size:17px;font-weight:800;letter-spacing:-.3px;color:#211f1c')}>{st.value}</div>
                </div>
              ))}
            </div>

            {/* AI Action Grid (Bento) */}
            <div className="max-md:!grid-cols-1 max-md:!grid-rows-[auto]" style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gridTemplateRows: 'repeat(2, 160px)', gap: 16 }}>
              
              {/* PRIMARY: Foto AI */}
              <Box onClick={() => go('staging')} style={{ gridColumn: 'span 1', gridRow: 'span 2', background: 'linear-gradient(135deg, #3B83F6, #1d4ed8)', borderRadius: 20, padding: 32, cursor: 'pointer', position: 'relative', overflow: 'hidden', color: '#fff', border: '1px solid rgba(255,255,255,.1)', transition: 'transform .2s, box-shadow .2s' }} hover={{ transform: 'translateY(-4px)', boxShadow: '0 16px 40px rgba(37,99,235,.25)' }}>
                {/* Blob animati: gradiente fluido che deriva e ruota */}
                <div style={{ position: 'absolute', top: -40, right: -40, width: 220, height: 220, background: 'linear-gradient(135deg, #60A5FA, #93C5FD)', borderRadius: '50%', filter: 'blur(40px)', opacity: 0.35, animation: 'blob-float 14s ease-in-out infinite' }} />
                <div style={{ position: 'absolute', bottom: -60, left: -50, width: 200, height: 200, background: 'linear-gradient(135deg, #93C5FD, #6366f1)', borderRadius: '50%', filter: 'blur(48px)', opacity: 0.3, animation: 'blob-float-2 18s ease-in-out infinite' }} />
                
                <div className="max-md:!w-11 max-md:!h-11 max-md:[&>svg]:!w-5 max-md:[&>svg]:!h-5" style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,.2)', backdropFilter: 'blur(10px)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 'auto', border: '1px solid rgba(255,255,255,.2)' }}>
                  <Icon name="sparkles" size={28} color="#fff" />
                </div>
                <div className="max-md:!mt-10" style={{ marginTop: 120 }}>
                  <h3 style={s('font-size:24px;font-weight:800;letter-spacing:-.5px;margin:0 0 6px')}>Homestaging AI</h3>
                  <p style={s('font-size:14.5px;color:rgba(255,255,255,.8);margin:0;line-height:1.4')}>Arreda stanze vuote o cambia stile ai tuoi ambienti con l'Intelligenza Artificiale.</p>
                </div>
              </Box>

              {/* SECONDARY: Video AI */}
              <Box onClick={() => go('video')} style={{ background: '#fff', border: '1px solid #f0ede7', borderRadius: 20, padding: 24, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'transform .3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow .3s cubic-bezier(0.4, 0, 0.2, 1)' }} hover={{ transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(59,131,246,0.12)', borderColor: '#bfdbfe' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .3s' }}>
                    <Icon name="film" size={20} color="#3B83F6" />
                  </div>
                </div>
                <div>
                  <h3 style={s('font-size:18px;font-weight:800;letter-spacing:-.3px;margin:0 0 4px;color:#211f1c')}>Crea Video AI</h3>
                  <p style={s('font-size:13px;color:#8c867d;margin:0')}>Presentatori virtuali per i tuoi reel.</p>
                </div>
              </Box>

              {/* SECONDARY: Post Social */}
              <Box onClick={() => go('studio')} style={{ background: '#fff', border: '1px solid #f0ede7', borderRadius: 20, padding: 24, cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', transition: 'transform .3s cubic-bezier(0.4, 0, 0.2, 1), box-shadow .3s cubic-bezier(0.4, 0, 0.2, 1)' }} hover={{ transform: 'translateY(-4px)', boxShadow: '0 12px 32px rgba(59,131,246,0.12)', borderColor: '#bfdbfe' }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'transform .3s' }}>
                  <Icon name="image-plus" size={20} color="#3B83F6" />
                </div>
                <div>
                  <h3 style={s('font-size:18px;font-weight:800;letter-spacing:-.3px;margin:0 0 4px;color:#211f1c')}>Post Social</h3>
                  <p style={s('font-size:13px;color:#8c867d;margin:0')}>Carousel e grafiche pronte per Instagram.</p>
                </div>
              </Box>

            </div>
          </div>

          {/* ── RIGHT: HEALTH & STATS ── */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            
            {/* Marketing Score */}
            <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:20px;padding:28px')}>
              <h3 style={s('margin:0 0 20px;font-size:16px;font-weight:800;letter-spacing:-.3px;color:#211f1c')}>Progresso Marketing</h3>
              
              <div style={{ display: 'flex', alignItems: 'center', gap: 20, marginBottom: 24 }}>
                <div style={{ position: 'relative', width: 72, height: 72 }}>
                  <svg width="72" height="72" viewBox="0 0 36 36">
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#f4f2ee" strokeWidth="3" />
                    <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={completionPct === 100 ? '#10B981' : '#3B83F6'} strokeWidth="3" strokeDasharray={`${completionPct}, 100`} strokeLinecap={completionPct === 0 ? 'butt' : 'round'} style={{ transition: 'stroke-dasharray 1s ease-out, stroke 1s ease-out', opacity: completionPct === 0 ? 0 : 1 }} />
                  </svg>
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, fontWeight: 800, color: '#211f1c' }}>
                    {completionPct}%
                  </div>
                </div>
                <div>
                  <div style={s('font-size:15px;font-weight:700;color:#211f1c;margin-bottom:4px')}>
                    {completionPct === 100 ? 'Kit Completo!' : completionPct === 0 ? 'Tutto da creare' : 'Quasi pronto'}
                  </div>
                  <div style={s('font-size:13px;color:#8c867d;line-height:1.4')}>
                    {completionPct === 100 ? 'Hai generato tutti i materiali per questo immobile.' : 'Usa gli strumenti AI per completare il set di contenuti del tuo immobile.'}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {[
                  { id: 'foto', label: 'Foto generate', done: hasPhotos, ic: 'sparkles' },
                  { id: 'video', label: 'Video creati', done: hasVideo, ic: 'film' },
                  { id: 'social', label: 'Post Social pronti', done: hasSocial, ic: 'megaphone' },
                ].map(item => (
                  <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', background: item.done ? '#f0fdf4' : '#f9f8f6', borderRadius: 10, border: `1px solid ${item.done ? '#bbf7d0' : '#f0ede7'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <Icon name={item.ic} size={16} color={item.done ? '#16a34a' : '#b3aca1'} />
                      <span style={{ fontSize: 13.5, fontWeight: 600, color: item.done ? '#166534' : '#57534c' }}>{item.label}</span>
                    </div>
                    {item.done ? (
                      <div style={{ width: 18, height: 18, borderRadius: '50%', background: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                        <Icon name="check" size={11} color="#fff" />
                      </div>
                    ) : (
                      <div style={{ width: 16, height: 16, borderRadius: '50%', border: '2px solid #d8d4cb' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Other tools link */}
            <Box onClick={() => go('montaggio')} style={{ background: '#fff', border: '1px dashed #d8d4cb', borderRadius: 16, padding: '16px 20px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 14, transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)' }} hover={{ transform: 'translateY(-3px)', background: '#f8fafc', borderColor: '#3B83F6', boxShadow: '0 8px 24px rgba(59,131,246,0.1)' }}>
              <div style={{ width: 36, height: 36, borderRadius: 10, background: '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="scissors" size={16} color="#3B83F6" />
              </div>
              <div>
                <div style={s('font-size:13.5px;font-weight:700;color:#211f1c;margin-bottom:2px')}>Strumento Montaggio</div>
                <div style={s('font-size:12px;color:#8c867d')}>Mixa le tue riprese reali.</div>
              </div>
            </Box>

          </div>
        </div>

        {/* ── RECENT CONTENTS (EMPTY STATE) ── */}
        <div style={{ marginTop: 40, borderTop: '1px solid #f0ede7', paddingTop: 32 }}>
          <div style={s('display:flex;align-items:baseline;justify-content:space-between;margin-bottom:20px')}>
            <h2 style={s('margin:0;font-size:20px;font-weight:800;letter-spacing:-.3px;color:#211f1c')}>Contenuti recenti</h2>
            <span onClick={() => go('media')} style={s('font-size:14px;font-weight:700;color:#1d5fd0;cursor:pointer')}>Vedi tutto</span>
          </div>
          {loadingRecent ? (
            <div className="max-md:!grid-cols-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
              {[1, 2, 3, 4].map(i => (
                <div key={i} style={{ aspectRatio: '4/3', borderRadius: 12, background: '#f4f2ee', animation: 'pulse 1.5s infinite ease-in-out' }} />
              ))}
            </div>
          ) : recent.length > 0 ? (
            <>
              <div className="max-md:!grid-cols-2" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
                {recent.map((p, i) => (
                  <div key={i} onClick={() => setLightbox({ url: p.url, isVideo: p.isVideo })} style={{ position: 'relative', aspectRatio: '4/3', borderRadius: 12, overflow: 'hidden', cursor: 'pointer', border: '1px solid #f0ede7', background: p.isVideo ? '#000' : '#f4f2ee', animation: 'media-reveal .7s cubic-bezier(.22,1,.36,1) both', animationDelay: `${i * 70}ms` }}>
                    {p.isVideo ? (
                      // eslint-disable-next-line jsx-a11y/media-has-caption
                      <video src={`${p.url}#t=0.5`} muted playsInline preload="metadata" style={{ width: '100%', height: '100%', objectFit: 'cover', pointerEvents: 'none' }} />
                    ) : (
                      <Image src={p.url} alt="" fill sizes="(max-width: 768px) 50vw, 25vw" style={{ objectFit: 'cover' }} onError={(e) => { (e.target as HTMLElement).style.display = 'none'; }} />
                    )}
                    {p.isVideo ? (
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <div style={{ background: 'rgba(20,30,55,0.55)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', borderRadius: '50%', width: 46, height: 46, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="play-circle" size={24} color="#fff" />
                        </div>
                      </div>
                    ) : (
                      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.25)', opacity: 0, transition: 'opacity .2s', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                        onMouseEnter={e => e.currentTarget.style.opacity = '1'}
                        onMouseLeave={e => e.currentTarget.style.opacity = '0'}
                      >
                        <div style={{ background: '#fff', borderRadius: '50%', width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Icon name="maximize-2" size={19} color="#211f1c" />
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
              {hasMoreRecent && (
                <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
                  <Box onClick={() => go('media')} style={s('display:inline-flex;align-items:center;gap:8px;background:#fff;border:1px solid #e4e1da;color:#211f1c;padding:10px 20px;border-radius:10px;font-size:14px;font-weight:700;cursor:pointer')} hover={{ background: '#f6f4f0' }}>
                    Vedi altro
                    <Icon name="arrow-right" size={15} color="#211f1c" />
                  </Box>
                </div>
              )}
            </>
          ) : (
            <div style={{ background: '#fcfcfb', border: '1px dashed #e4e1da', borderRadius: 16, padding: '48px 24px', textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ width: 48, height: 48, borderRadius: '50%', background: '#f6f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
                <Icon name="image" size={24} color="#8c867d" />
              </div>
              <div style={{ fontSize: 16, fontWeight: 700, color: '#211f1c', marginBottom: 4 }}>Nessun contenuto generato</div>
              <div style={{ fontSize: 14, color: '#8c867d', maxWidth: 360, lineHeight: 1.5 }}>
                Non hai ancora creato render o video AI per questo immobile. Usa gli strumenti qui sopra per iniziare.
              </div>
            </div>
          )}
        </div>

      </div>

      {lightbox && (
        <div onClick={() => setLightbox(null)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.94)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 40 }}>
          {lightbox.isVideo ? (
            // controlsList nofullscreen: resta contenuto nel modal, niente super-fullscreen
            <video onClick={e => e.stopPropagation()} src={lightbox.url} controls autoPlay playsInline controlsList="nofullscreen" disablePictureInPicture style={{ maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 12, background: '#000' }} />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={lightbox.url} alt="" style={{ maxWidth: '90vw', maxHeight: '88vh', objectFit: 'contain', borderRadius: 12 }} />
          )}
          <button onClick={() => setLightbox(null)} style={{ position: 'fixed', top: 24, right: 28, background: 'rgba(255,255,255,0.12)', border: 'none', borderRadius: '50%', width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <Icon name="x" size={20} color="#fff" />
          </button>
        </div>
      )}
    </div>
  );
}
