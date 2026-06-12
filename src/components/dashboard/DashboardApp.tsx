'use client';
// GetNearMe SaaS dashboard — React port of the Claude Design prototype.
// Phase 1: app shell (sidebar, header, project switcher, jobs tray, ⌘K), Home,
// onboarding (welcome + coachmark tour), toasts. Other routes render a placeholder
// until ported. Demo data mirrors the prototype; real data wiring comes later.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { s, Box, Icon } from './ui';

type Project = {
  id: string; nome: string; addr: string; prezzo: number; mq: number; locali: number;
  nFoto: number; nStaging: number; nVideo: number; nPost: number; titolo: string; cover: string;
};
type Toast = { id: number; msg: string; icon: string };

const DEMO_PROJECTS: Project[] = [
  { id: 'p1', nome: 'Attico Brera', addr: 'Via Fiori Chiari 12, Milano', prezzo: 1250000, mq: 145, locali: 4, nFoto: 12, nStaging: 6, nVideo: 2, nPost: 8, titolo: 'Attico con terrazza nel cuore di Brera', cover: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop' },
  { id: 'p2', nome: 'Trilocale Isola', addr: 'Via Borsieri 28, Milano', prezzo: 545000, mq: 95, locali: 3, nFoto: 9, nStaging: 3, nVideo: 1, nPost: 5, titolo: 'Trilocale ristrutturato nel cuore di Isola', cover: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop' },
  { id: 'p3', nome: 'Appartamento Trastevere', addr: 'Vicolo del Cedro 9, Roma', prezzo: 690000, mq: 110, locali: 3, nFoto: 10, nStaging: 2, nVideo: 1, nPost: 4, titolo: 'Charme romano con travi a vista', cover: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop' },
  { id: 'p4', nome: 'Bilocale Crocetta', addr: 'Corso Re Umberto 44, Torino', prezzo: 295000, mq: 68, locali: 2, nFoto: 6, nStaging: 0, nVideo: 0, nPost: 2, titolo: 'Bilocale elegante in zona Crocetta', cover: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=500&fit=crop' },
];

const NAV_SECTIONS = [
  { label: '', items: [{ icon: 'layout-dashboard', label: 'Home', route: 'home' }] },
  { label: 'Lavoro', items: [{ icon: 'building-2', label: 'Progetti', route: 'progetti' }, { icon: 'sparkles', label: 'Foto AI', route: 'staging' }, { icon: 'film', label: 'Video AI', route: 'video' }] },
  { label: 'Social', items: [{ icon: 'image-plus', label: 'Post Social', route: 'studio' }, { icon: 'calendar', label: 'Calendario', route: 'calendario' }] },
  { label: 'Libreria', items: [{ icon: 'image', label: 'Media', route: 'media' }] },
  { label: 'Agenzia', items: [{ icon: 'users', label: 'Team', route: 'team' }, { icon: 'palette', label: 'Brand & White-label', route: 'brand' }, { icon: 'at-sign', label: 'Account social', route: 'social' }] },
  { label: 'Account', items: [{ icon: 'credit-card', label: 'Piano & Crediti', route: 'account' }] },
];

const TOUR_DEFS = [
  { sel: '[title="Foto AI"]', title: 'Foto AI', text: "Arreda, svuota o trasforma le foto dei tuoi immobili con l'AI. Singola o batch, stile o prompt libero." },
  { sel: '[title="Post Social"]', title: 'Post Social', text: 'Template per post e storie con i dati già compilati, e il calendario per programmare le pubblicazioni.' },
  { sel: '[title="Progetti"]', title: 'Progetti', text: 'Un progetto = un immobile. Non serve crearlo prima: nasce da solo al primo contenuto che generi.' },
  { sel: '[title="Media"]', title: 'Media', text: 'Tutto ciò che generi finisce qui. Puoi riusarlo in post e video senza pagare altri crediti.' },
  { sel: '[title="Lavori in corso"]', title: 'Lavori in corso', text: 'Le generazioni girano in background: qui vedi i progressi senza mai bloccarti. Ti avvisiamo a fine lavoro.' },
  { sel: '[title="Piano e crediti"]', title: 'Crediti', text: 'Il costo è sempre dichiarato prima di generare. Qui controlli saldo e ricariche.' },
];

const fmt = (n: number) => '€ ' + Number(n || 0).toLocaleString('it-IT');
const typeTag = (t: string) =>
  t === 'staging' ? { label: 'Staging', tBg: '#fdf3e4', tCol: '#9a6312' }
    : t === 'video' ? { label: 'Video', tBg: '#eef4fe', tCol: '#1d5fd0' }
      : t === 'post' ? { label: 'Post', tBg: '#e8f6ef', tCol: '#177a52' }
        : { label: 'Foto', tBg: '#f1efe9', tCol: '#57534c' };

const RECENT = [
  { type: 'staging', label: 'Soggiorno · Moderno', meta: 'Attico Brera · 2 ore fa', img: 'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=500&h=320&fit=crop' },
  { type: 'video', label: 'Prima vs Dopo · 0:24', meta: 'Attico Brera · ieri', img: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=500&h=320&fit=crop' },
  { type: 'post', label: 'Post 4:5 · Classico', meta: 'Trilocale Isola · ieri', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=320&fit=crop' },
  { type: 'staging', label: 'Camera · Nordico', meta: 'Trastevere · 2 giorni fa', img: 'https://images.unsplash.com/photo-1617325247661-675ab4b64ae2?w=500&h=320&fit=crop' },
  { type: 'post', label: 'Story 9:16 · Open House', meta: 'Bilocale Crocetta · 3 giorni fa', img: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=500&h=320&fit=crop' },
  { type: 'video', label: 'Tour da immagini · 0:31', meta: 'Trilocale Isola · 4 giorni fa', img: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=500&h=320&fit=crop' },
];

const ROUTE_TITLES: Record<string, string> = {
  progetti: 'Progetti', progetto: 'Dettaglio immobile', staging: 'Foto AI', video: 'Video AI',
  studio: 'Post Social', calendario: 'Calendario', media: 'Libreria Media', team: 'Team',
  brand: 'Brand & White-label', social: 'Account social', account: 'Piano & Crediti',
};

export default function DashboardApp() {
  const [route, setRoute] = useState('home');
  const [collapsed, setCollapsed] = useState(false);
  const [projOpen, setProjOpen] = useState(false);
  const [projQuery, setProjQuery] = useState('');
  const [activeProject, setActiveProject] = useState('p1');
  const [credits] = useState(140);
  const [projects] = useState<Project[]>(DEMO_PROJECTS);
  const [welcomeOpen, setWelcomeOpen] = useState(true);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [tourRect, setTourRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [trayOpen, setTrayOpen] = useState(false);
  const [clDismissed, setClDismissed] = useState(false);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);

  const active = useMemo(() => projects.find((p) => p.id === activeProject) ?? projects[0], [projects, activeProject]);

  const toast = useCallback((msg: string, icon = 'check') => {
    const id = Date.now() + Math.random();
    setToasts((t) => [...t, { id, msg, icon }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const go = useCallback((r: string) => { setRoute(r); setProjOpen(false); setTrayOpen(false); }, []);
  const closeMenus = useCallback(() => { setProjOpen(false); setTrayOpen(false); }, []);

  // ⌘K
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); setCmdkOpen(true); setCmdQuery(''); }
      if (e.key === 'Escape') { setCmdkOpen(false); setTourStep(null); setProjOpen(false); setTrayOpen(false); }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, []);

  // Tour measuring
  const tourMeasure = useCallback((i: number) => {
    const d = TOUR_DEFS[i]; if (!d) return;
    const el = document.querySelector(d.sel);
    if (el) { const r = el.getBoundingClientRect(); setTourRect({ x: r.x, y: r.y, w: r.width, h: r.height }); }
  }, []);
  const tourGo = useCallback((n: number) => {
    if (n >= TOUR_DEFS.length || n < 0) { setTourStep(null); return; }
    setTourStep(n);
    setTimeout(() => tourMeasure(n), 60);
  }, [tourMeasure]);
  const startTour = useCallback(() => {
    setWelcomeOpen(false); setCollapsed(false); setTourStep(0); setTourRect(null);
    setTimeout(() => tourMeasure(0), 350);
  }, [tourMeasure]);

  // ---- derived: checklist ----
  const clDefs = [
    { label: 'Brand configurato', done: false, route: 'brand' },
    { label: 'Instagram collegato', done: false, route: 'social' },
    { label: 'Primo immobile creato', done: true, route: 'progetti' },
    { label: 'Prima generazione AI', done: false, route: 'staging' },
  ];
  const clDone = clDefs.filter((c) => c.done).length;
  const showChecklist = !clDismissed && clDone < 4;

  const homeSub = `${projects.length} immobili attivi · 5 contenuti programmati · ${credits} crediti disponibili`;

  const projList = projects.filter((p) => !projQuery || (p.nome + ' ' + p.addr).toLowerCase().includes(projQuery.toLowerCase()));

  // ⌘K results
  const cmdq = cmdQuery.toLowerCase();
  const cmdTools = [
    ['Foto AI', 'staging', 'sparkles'], ['Video AI', 'video', 'film'], ['Post Social', 'studio', 'image-plus'],
    ['Calendario', 'calendario', 'calendar'], ['Media', 'media', 'image'], ['Team', 'team', 'users'],
    ['Brand & White-label', 'brand', 'palette'], ['Piano & Crediti', 'account', 'credit-card'],
  ] as const;
  const cmdResults: { label: string; sub: string; icon: string; go: () => void }[] = [];
  cmdTools.filter((t) => !cmdq || t[0].toLowerCase().includes(cmdq)).forEach((t) => cmdResults.push({ label: t[0], sub: 'Strumento', icon: t[2], go: () => { setCmdkOpen(false); go(t[1]); } }));
  projects.filter((p) => !cmdq || (p.nome + ' ' + p.addr).toLowerCase().includes(cmdq)).forEach((p) => cmdResults.push({ label: p.nome, sub: p.addr, icon: 'building-2', go: () => { setCmdkOpen(false); setActiveProject(p.id); go('progetti'); } }));

  const onRight = tourRect && tourRect.x > (typeof window !== 'undefined' ? window.innerWidth - 420 : 9999);
  const tipL = tourRect ? (onRight ? Math.max(16, tourRect.x + tourRect.w - 320) : tourRect.x + tourRect.w + 20) : 0;
  const tipT = tourRect ? (onRight ? tourRect.y + tourRect.h + 16 : Math.max(16, tourRect.y - 12)) : 0;
  const tdef = tourStep !== null ? TOUR_DEFS[tourStep] : TOUR_DEFS[0];

  return (
    <div style={{ fontFamily: 'inherit', color: '#211f1c', height: '100vh', overflow: 'hidden', background: '#faf9f7', fontSize: 14, lineHeight: 1.45 }}>

      {/* WELCOME MODAL */}
      {welcomeOpen && (
        <div style={s('position:fixed;inset:0;background:rgba(24,21,17,.5);z-index:95;display:flex;align-items:center;justify-content:center;padding:24px')}>
          <div style={s('background:#fff;border-radius:14px;box-shadow:0 24px 64px rgba(20,18,15,.3);width:100%;max-width:460px;padding:38px 40px;text-align:center')}>
            <img src="/dashboard/logo.svg" alt="GetNearMe" style={{ height: 26, marginBottom: 20 }} />
            <h2 style={s('margin:0 0 8px;font-size:23px;font-weight:800;letter-spacing:-.4px')}>Benvenuto su GetNearMe</h2>
            <p style={s('margin:0 auto 26px;max-width:360px;color:#57534c;font-size:14.5px')}>Trasforma le foto dei tuoi immobili in staging, video e post pronti da pubblicare. Ti facciamo fare un giro veloce?</p>
            <div style={s('display:flex;gap:12px;justify-content:center')}>
              <Box as="button" onClick={() => { setWelcomeOpen(false); toast('Puoi rifare il tour dal pulsante ? in alto'); }} style={s('border:1px solid #e4e1da;background:#fff;color:#211f1c;font-size:14px;font-weight:700;padding:12px 24px;border-radius:8px;cursor:pointer;min-height:38px')} hover={s('background:#f6f4f0')}>Salta</Box>
              <Box as="button" onClick={startTour} style={s('border:none;background:#3B83F6;color:#fff;font-size:14px;font-weight:700;padding:12px 28px;border-radius:8px;cursor:pointer;display:flex;align-items:center;gap:8px;min-height:38px')} hover={s('background:#2b6fe0')}>Fai il giro<Icon name="arrow-right" size={15} color="#fff" /></Box>
            </div>
            <div style={s('margin-top:18px;font-size:12px;color:#b3aca1')}>Dura meno di un minuto · sempre rigiocabile dal pulsante ?</div>
          </div>
        </div>
      )}

      {/* TOUR COACHMARK */}
      {tourStep !== null && tourRect && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 96 }}>
          <div onClick={() => setTourStep(null)} style={{ position: 'absolute', left: tourRect.x - 6, top: tourRect.y - 6, width: tourRect.w + 12, height: tourRect.h + 12, borderRadius: 14, boxShadow: '0 0 0 9999px rgba(24,21,17,.55)', transition: 'all .3s ease', pointerEvents: 'none' }} />
          <div style={{ position: 'absolute', left: tipL, top: tipT, width: 300, background: '#fff', borderRadius: 12, boxShadow: '0 16px 48px rgba(20,18,15,.3)', padding: '20px 22px', transition: 'all .3s ease' }}>
            <div style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:6px')}>
              <span style={s('font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#1d5fd0')}>{(tourStep + 1) + ' di ' + TOUR_DEFS.length}</span>
              <span onClick={() => setTourStep(null)} style={s('font-size:12px;font-weight:600;color:#b3aca1;cursor:pointer;padding:4px')}>Salta il tour</span>
            </div>
            <div style={s('font-size:16px;font-weight:800;letter-spacing:-.2px;margin-bottom:4px')}>{tdef.title}</div>
            <div style={s('font-size:13px;color:#57534c;line-height:1.5;margin-bottom:16px')}>{tdef.text}</div>
            <div style={s('display:flex;align-items:center;justify-content:space-between')}>
              {tourStep > 0 && <Box as="button" onClick={() => tourGo(tourStep - 1)} style={s('border:1px solid #e4e1da;background:#fff;font-size:12.5px;font-weight:700;padding:9px 16px;border-radius:8px;cursor:pointer;min-height:38px')} hover={s('background:#f6f4f0')}>Indietro</Box>}
              {tourStep < TOUR_DEFS.length - 1
                ? <Box as="button" onClick={() => tourGo(tourStep + 1)} style={s('border:none;background:#3B83F6;color:#fff;font-size:12.5px;font-weight:700;padding:9px 18px;border-radius:8px;cursor:pointer;margin-left:auto;min-height:38px')} hover={s('background:#2b6fe0')}>Avanti</Box>
                : <Box as="button" onClick={() => { setTourStep(null); go('staging'); }} style={s('border:none;background:#3B83F6;color:#fff;font-size:12.5px;font-weight:700;padding:9px 18px;border-radius:8px;cursor:pointer;margin-left:auto;display:flex;align-items:center;gap:7px;min-height:38px')} hover={s('background:#2b6fe0')}><Icon name="sparkles" size={13} color="#fff" />Inizia da una foto</Box>}
            </div>
          </div>
        </div>
      )}

      {/* APP SHELL */}
      <div style={{ display: 'flex', height: '100%' }}>
        {/* SIDEBAR */}
        <div style={{ width: collapsed ? 76 : 252, flex: 'none', background: '#fff', borderRight: '1px solid #f0ede7', display: 'flex', flexDirection: 'column', transition: 'width .25s ease', overflow: 'hidden' }}>
          <div style={s('height:64px;flex:none;display:flex;align-items:center;padding:0 20px;overflow:hidden')}>
            <div style={{ width: collapsed ? 27 : 130, overflow: 'hidden', flex: 'none' }}><img src="/dashboard/logo.svg" alt="GetNearMe" style={{ height: 24, maxWidth: 'none' }} /></div>
          </div>
          <div style={s('flex:1;overflow-y:auto;overflow-x:hidden;padding:6px 0 16px')}>
            {NAV_SECTIONS.map((sec, si) => (
              <div key={si} style={{ marginBottom: 4 }}>
                {sec.label && !collapsed && <div style={s('font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#b3aca1;padding:14px 22px 6px;white-space:nowrap')}>{sec.label}</div>}
                {sec.items.map((it) => {
                  const a = route === it.route || (it.route === 'progetti' && route === 'progetto');
                  return (
                    <Box key={it.route} onClick={() => go(it.route)} title={it.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', margin: '1px 10px', borderRadius: 12, cursor: 'pointer', background: a ? '#f1efe9' : 'transparent', color: a ? '#211f1c' : '#57534c', fontWeight: a ? 700 : 500, fontSize: 14, whiteSpace: 'nowrap', minHeight: 38 }} hover={{ background: '#f6f4f0' }}>
                      <Icon name={it.icon} size={18} color={a ? '#211f1c' : '#57534c'} />
                      {!collapsed && <span>{it.label}</span>}
                    </Box>
                  );
                })}
              </div>
            ))}
          </div>
          <div style={s('flex:none;border-top:1px solid #f0ede7;padding:12px 10px')}>
            <Box onClick={() => go('account')} title="Crediti" style={s('display:flex;align-items:center;gap:12px;padding:10px 12px;border-radius:12px;cursor:pointer;background:#faf9f7')} hover={s('background:#f1efe9')}>
              <Icon name="coins" size={18} color="#3B83F6" />
              {!collapsed && <div style={{ minWidth: 0 }}><div style={s('font-size:13px;font-weight:800')}>{credits} crediti</div><div style={s('font-size:11px;color:#8c867d;white-space:nowrap')}>Piano Professional</div></div>}
            </Box>
          </div>
        </div>

        {/* MAIN */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* HEADER */}
          <div style={{ height: 64, flex: 'none', background: '#fff', borderBottom: '1px solid #f0ede7', display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px', position: 'relative', zIndex: 30 }}>
            <Box as="button" onClick={() => setCollapsed((c) => !c)} title="Comprimi menu" aria-label="Comprimi menu" style={s('border:none;background:transparent;width:38px;height:38px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center')} hover={s('background:#f1efe9')}><Icon name="panel-left" size={18} /></Box>

            {/* project switcher */}
            <div style={{ position: 'relative' }}>
              <Box onClick={(e) => { e.stopPropagation(); setProjOpen((o) => !o); setTrayOpen(false); }} style={s('display:flex;align-items:center;gap:10px;padding:7px 14px 7px 8px;border:1px solid #e9e6df;border-radius:8px;cursor:pointer;background:#fff;min-height:38px')} hover={s('border-color:#d8d4cb;box-shadow:0 2px 8px rgba(33,31,28,.06)')}>
                <div style={{ width: 30, height: 30, borderRadius: '50%', background: `url(${active.cover}) center/cover`, backgroundColor: '#f3f1ec', flex: 'none' }} />
                <div style={{ minWidth: 0 }}><div style={s('font-size:11px;color:#8c867d;line-height:1.2')}>Progetto attivo</div><div style={s('font-size:13px;font-weight:700;white-space:nowrap;line-height:1.2')}>{active.nome}</div></div>
                <Icon name="chevron-down" size={14} color="#8c867d" />
              </Box>
              {projOpen && (
                <div style={s('position:absolute;top:52px;left:0;width:320px;background:#fff;border-radius:12px;box-shadow:0 16px 48px rgba(33,31,28,.16);border:1px solid #f0ede7;overflow:hidden')}>
                  <div style={s('padding:12px 12px 8px')}><div style={s('display:flex;align-items:center;gap:8px;background:#faf9f7;border:1px solid #ece9e2;border-radius:10px;padding:8px 12px')}><Icon name="search" size={15} color="#8c867d" /><input value={projQuery} onChange={(e) => setProjQuery(e.target.value)} placeholder="Cerca immobile…" style={s('border:none;background:transparent;outline:none;font-size:13px;width:100%')} /></div></div>
                  <div style={s('max-height:260px;overflow:auto;padding:0 6px')}>
                    {projList.map((p) => (
                      <Box key={p.id} onClick={() => { setActiveProject(p.id); setProjOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 12, cursor: 'pointer', background: p.id === activeProject ? '#f6faff' : 'transparent' }} hover={{ background: '#f6f4f0' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, background: `url(${p.cover}) center/cover`, backgroundColor: '#f3f1ec', flex: 'none' }} />
                        <div style={{ minWidth: 0, flex: 1 }}><div style={s('font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{p.nome}</div><div style={s('font-size:11px;color:#8c867d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{p.addr}</div></div>
                        {p.id === activeProject && <Icon name="check" size={14} color="#3B83F6" />}
                      </Box>
                    ))}
                  </div>
                  <Box onClick={() => { setProjOpen(false); toast('Nuovo immobile (in arrivo)'); }} style={s('display:flex;align-items:center;gap:10px;padding:12px 16px;border-top:1px solid #f0ede7;cursor:pointer;color:#1d5fd0;font-weight:700;font-size:13px')} hover={s('background:#f6faff')}><Icon name="plus" size={16} color="#1d5fd0" />Nuovo immobile</Box>
                </div>
              )}
            </div>

            <div style={{ flex: 1 }} />

            <Box as="button" onClick={() => { setCmdkOpen(true); setCmdQuery(''); }} title="Cerca · ⌘K" aria-label="Cerca" style={s('border:1px solid #e9e6df;background:#fff;display:flex;align-items:center;gap:8px;padding:0 14px;height:40px;border-radius:8px;cursor:pointer;color:#8c867d')} hover={s('border-color:#d8d4cb')}>
              <Icon name="search" size={15} color="#8c867d" /><span style={s('font-size:13px;font-weight:600')}>Cerca</span><span style={s('font-size:10.5px;font-weight:700;background:#f1efe9;color:#8c867d;padding:2px 7px;border-radius:6px')}>⌘K</span>
            </Box>

            {/* jobs tray */}
            <div style={{ position: 'relative' }}>
              <Box as="button" onClick={(e) => { e.stopPropagation(); setTrayOpen((o) => !o); setProjOpen(false); }} title="Lavori in corso" aria-label="Lavori in corso" style={s('border:none;background:transparent;width:42px;height:42px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative')} hover={s('background:#f1efe9')}>
                <Icon name="layers" size={18} />
              </Box>
              {trayOpen && (
                <div style={s('position:absolute;top:50px;right:0;width:330px;background:#fff;border-radius:12px;box-shadow:0 16px 48px rgba(33,31,28,.16);border:1px solid #f0ede7;overflow:hidden;z-index:50')}>
                  <div style={s('display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid #f4f2ee')}><span style={s('font-size:13.5px;font-weight:800')}>Lavori in corso</span></div>
                  <div style={s('padding:22px 16px;text-align:center;font-size:13px;color:#8c867d')}>Nessun lavoro in corso.<br />Le generazioni girano qui in background, senza bloccarti.</div>
                </div>
              )}
            </div>

            <Box onClick={() => go('account')} title="Piano e crediti" style={s('display:flex;align-items:center;gap:8px;padding:9px 16px;border-radius:8px;background:#eef4fe;cursor:pointer;min-height:38px')} hover={s('background:#e3edfd')}>
              <Icon name="coins" size={15} color="#1d5fd0" /><span style={s('font-size:13px;font-weight:800;color:#1d5fd0;white-space:nowrap')}>{credits} crediti</span>
            </Box>
            <Box as="button" onClick={() => toast('Nessuna nuova notifica', 'bell')} title="Notifiche" aria-label="Notifiche" style={s('border:none;background:transparent;width:42px;height:42px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative')} hover={s('background:#f1efe9')}><Icon name="bell" size={18} /></Box>
            <Box as="button" onClick={() => setWelcomeOpen(true)} title="Aiuto e tour" aria-label="Aiuto e tour" style={s('border:none;background:transparent;width:42px;height:42px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center')} hover={s('background:#f1efe9')}><Icon name="circle-help" size={18} /></Box>
            <div title="Marco Rossi" style={s('width:38px;height:38px;border-radius:50%;background:#211f1c;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;cursor:pointer')}>MR</div>
          </div>

          {/* CONTENT */}
          <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }} onClick={closeMenus}>
            {route === 'home' ? (
              <div style={s('max-width:1160px;margin:0 auto;padding:36px 32px 64px')}>
                <div style={s('display:flex;align-items:flex-end;justify-content:space-between;gap:20px;margin-bottom:24px')}>
                  <div><h1 style={s('margin:0 0 4px;font-size:27px;font-weight:800;letter-spacing:-.5px')}>Buonasera, Marco</h1><div style={s('color:#8c867d;font-size:14px')}>{homeSub}</div></div>
                </div>

                {showChecklist && (
                  <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:12px;padding:20px 24px;margin-bottom:24px;box-shadow:0 1px 2px rgba(33,31,28,.03)')}>
                    <div style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:12px')}>
                      <div style={s('display:flex;align-items:center;gap:10px')}><span style={s('font-size:15px;font-weight:800')}>Completa il setup</span><span style={s('font-size:12px;font-weight:700;color:#57534c;background:#f1efe9;padding:3px 10px;border-radius:6px;white-space:nowrap')}>{clDone} di 4</span></div>
                      <Box as="button" onClick={() => setClDismissed(true)} title="Nascondi checklist" aria-label="Nascondi checklist" style={s('border:none;background:transparent;width:32px;height:32px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center')} hover={s('background:#f1efe9')}><Icon name="x" size={14} color="#8c867d" /></Box>
                    </div>
                    <div style={s('height:4px;background:#f1efe9;border-radius:99px;overflow:hidden;margin-bottom:14px')}><div style={{ height: '100%', width: (clDone / 4 * 100) + '%', background: '#211f1c', borderRadius: 99, transition: 'width .4s' }} /></div>
                    <div style={s('display:grid;grid-template-columns:repeat(4,1fr);gap:10px')}>
                      {clDefs.map((cl) => (
                        <Box key={cl.label} onClick={() => go(cl.route)} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '11px 12px', borderRadius: 12, border: '1px solid ' + (cl.done ? '#e4e1da' : '#ece9e2'), background: cl.done ? '#faf9f7' : '#fff', cursor: 'pointer', minHeight: 38 }} hover={{ borderColor: '#d8d4cb' }}>
                          <span style={{ width: 18, height: 18, flex: 'none', borderRadius: '50%', background: cl.done ? '#211f1c' : '#ece9e2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="check" size={10} color={cl.done ? '#fff' : '#b3aca1'} /></span>
                          <span style={{ fontSize: 12.5, fontWeight: 600, color: cl.done ? '#211f1c' : '#8c867d' }}>{cl.label}</span>
                        </Box>
                      ))}
                    </div>
                  </div>
                )}

                {/* hero AI */}
                <div style={s('display:grid;grid-template-columns:1fr 1fr;gap:20px;margin-bottom:20px')}>
                  <Box onClick={() => go('staging')} style={s('background:#211f1c;border-radius:14px;padding:28px;cursor:pointer;position:relative;overflow:hidden;transition:transform .2s, box-shadow .2s')} hover={s('transform:translateY(-2px);box-shadow:0 12px 32px rgba(33,31,28,.18)')}>
                    <div style={s('display:flex;align-items:center;gap:10px;margin-bottom:16px')}><div style={s('width:42px;height:42px;border-radius:10px;background:rgba(255,255,255,.1);display:flex;align-items:center;justify-content:center')}><Icon name="sparkles" size={20} color="#fff" /></div><span style={s('font-size:10.5px;font-weight:800;color:rgba(255,255,255,.65);letter-spacing:.05em;text-transform:uppercase')}>Agency</span></div>
                    <div style={s('font-size:19px;font-weight:800;letter-spacing:-.3px;margin-bottom:4px;color:#fff')}>Foto AI</div>
                    <div style={s('color:rgba(255,255,255,.7);font-size:14px;max-width:320px;margin-bottom:20px')}>Arreda, svuota o trasforma le foto dei tuoi immobili con l&apos;AI.</div>
                    <div style={s('display:flex;align-items:center;justify-content:space-between')}><span style={s('font-size:12.5px;font-weight:700;color:rgba(255,255,255,.6);background:rgba(255,255,255,.08);padding:6px 12px;border-radius:6px')}>87 / 100 foto</span><span style={s('display:flex;align-items:center;gap:7px;background:#3B83F6;color:#fff;font-size:13px;font-weight:700;padding:10px 20px;border-radius:8px;min-height:38px')}>Apri lo studio<Icon name="arrow-right" size={14} color="#fff" /></span></div>
                  </Box>
                  <Box onClick={() => go('video')} style={s('background:#fff;border:1px solid #e9e6df;border-radius:14px;padding:28px;cursor:pointer;position:relative;overflow:hidden;transition:transform .2s, box-shadow .2s')} hover={s('transform:translateY(-2px);box-shadow:0 12px 32px rgba(33,31,28,.10)')}>
                    <div style={s('width:42px;height:42px;border-radius:10px;background:#f4f2ee;display:flex;align-items:center;justify-content:center;margin-bottom:16px')}><Icon name="film" size={20} color="#57534c" /></div>
                    <div style={s('font-size:19px;font-weight:800;letter-spacing:-.3px;margin-bottom:4px')}>Video AI</div>
                    <div style={s('color:#57534c;font-size:14px;max-width:320px;margin-bottom:20px')}>9 template pronti: avatar, tour dalle foto, prima/dopo, timelapse e altro.</div>
                    <div style={s('display:flex;align-items:center;justify-content:space-between')}><span style={s('font-size:12.5px;font-weight:700;color:#8c867d;background:#f4f2ee;padding:6px 12px;border-radius:6px')}>da 1 video quota</span><span style={s('display:flex;align-items:center;gap:7px;background:#211f1c;color:#fff;font-size:13px;font-weight:700;padding:10px 20px;border-radius:8px;min-height:38px')}>Apri lo studio<Icon name="arrow-right" size={14} color="#fff" /></span></div>
                  </Box>
                </div>

                {/* quick actions */}
                <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-bottom:36px')}>
                  {[['image-plus', 'Crea un post', 'studio'], ['calendar', 'Programma una pubblicazione', 'calendario'], ['image', 'Apri la libreria media', 'media']].map(([ic, lbl, r]) => (
                    <Box key={r} onClick={() => go(r)} style={s('display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #ece9e2;border-radius:10px;padding:14px 18px;cursor:pointer;min-height:52px')} hover={s('border-color:#d8d4cb;background:#faf9f7')}><Icon name={ic} size={17} color="#8c867d" /><span style={s('font-size:13.5px;font-weight:700')}>{lbl}</span></Box>
                  ))}
                </div>

                {/* recent */}
                <div style={s('display:flex;align-items:baseline;justify-content:space-between;margin-bottom:14px')}>
                  <h2 style={s('margin:0;font-size:18px;font-weight:800;letter-spacing:-.3px')}>Contenuti recenti</h2>
                  <span onClick={() => go('media')} style={s('font-size:13px;font-weight:700;color:#1d5fd0;cursor:pointer')}>Vedi tutto in Media</span>
                </div>
                <div style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:16px')}>
                  {RECENT.map((r, i) => {
                    const t = typeTag(r.type);
                    return (
                      <Box key={i} style={s('background:#fff;border:1px solid #f0ede7;border-radius:12px;overflow:hidden;transition:box-shadow .2s')} hover={s('box-shadow:0 8px 24px rgba(33,31,28,.08)')}>
                        <div style={{ aspectRatio: '16/10', background: `url(${r.img}) center/cover`, backgroundColor: '#f3f1ec', position: 'relative' }}>
                          <span style={{ position: 'absolute', top: 10, left: 10, fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 8, background: t.tBg, color: t.tCol }}>{t.label}</span>
                        </div>
                        <div style={s('padding:12px 14px;display:flex;align-items:center;gap:10px')}>
                          <div style={{ minWidth: 0, flex: 1 }}><div style={s('font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{r.label}</div><div style={s('font-size:12px;color:#8c867d')}>{r.meta}</div></div>
                          <Box as="button" onClick={(e) => { e.stopPropagation(); toast('Download avviato'); }} title="Scarica" aria-label="Scarica" style={s('border:1px solid #ece9e2;background:#fff;width:34px;height:34px;border-radius:10px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none')} hover={s('background:#f6f4f0')}><Icon name="download" size={14} /></Box>
                        </div>
                      </Box>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div style={s('max-width:1160px;margin:0 auto;padding:36px 32px 64px')}>
                <h1 style={s('margin:0 0 4px;font-size:27px;font-weight:800;letter-spacing:-.5px')}>{ROUTE_TITLES[route] ?? route}</h1>
                <div style={s('color:#8c867d;font-size:14px;margin-bottom:28px')}>Schermata in arrivo nelle prossime fasi del porting.</div>
                <div style={s('background:#fff;border:1.5px dashed #d8d4cb;border-radius:12px;padding:52px;text-align:center;max-width:560px')}>
                  <div style={s('width:52px;height:52px;border-radius:16px;background:#eef4fe;display:flex;align-items:center;justify-content:center;margin:0 auto 14px')}><Icon name="sparkles" size={24} color="#3B83F6" /></div>
                  <div style={s('font-size:15px;font-weight:800;margin-bottom:6px')}>«{ROUTE_TITLES[route] ?? route}» in costruzione</div>
                  <div style={s('color:#8c867d;font-size:13.5px;max-width:380px;margin:0 auto')}>Lo shell, la navigazione e la Home sono pronti. Questa sezione viene portata nella fase successiva.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ⌘K MODAL */}
      {cmdkOpen && (
        <div onClick={() => setCmdkOpen(false)} style={s('position:fixed;inset:0;background:rgba(24,21,17,.4);z-index:90;display:flex;align-items:flex-start;justify-content:center;padding-top:14vh')}>
          <div onClick={(e) => e.stopPropagation()} style={s('width:100%;max-width:560px;background:#fff;border-radius:14px;box-shadow:0 24px 64px rgba(20,18,15,.3);overflow:hidden')}>
            <div style={s('display:flex;align-items:center;gap:10px;padding:16px 18px;border-bottom:1px solid #f4f2ee')}><Icon name="search" size={18} color="#8c867d" /><input autoFocus value={cmdQuery} onChange={(e) => setCmdQuery(e.target.value)} placeholder="Cerca strumenti, immobili, media…" style={s('border:none;outline:none;font-size:15px;width:100%;background:transparent')} /><span style={s('font-size:11px;font-weight:700;background:#f1efe9;color:#8c867d;padding:3px 8px;border-radius:6px')}>esc</span></div>
            <div style={s('max-height:340px;overflow:auto;padding:8px')}>
              {cmdResults.length === 0 ? <div style={s('padding:28px;text-align:center;color:#8c867d;font-size:13.5px')}>Nessun risultato.</div> : cmdResults.slice(0, 8).map((r, i) => (
                <Box key={i} onClick={r.go} style={s('display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:10px;cursor:pointer')} hover={s('background:#f6f4f0')}>
                  <span style={s('width:32px;height:32px;border-radius:9px;background:#f4f2ee;display:flex;align-items:center;justify-content:center;flex:none')}><Icon name={r.icon} size={15} color="#57534c" /></span>
                  <div style={{ minWidth: 0 }}><div style={s('font-size:13.5px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{r.label}</div><div style={s('font-size:11.5px;color:#8c867d')}>{r.sub}</div></div>
                </Box>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      <div style={s('position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:120;display:flex;flex-direction:column;gap:10px;align-items:center')}>
        {toasts.map((t) => (
          <div key={t.id} style={s('display:flex;align-items:center;gap:10px;background:#211f1c;color:#fff;padding:12px 18px;border-radius:10px;box-shadow:0 12px 32px rgba(20,18,15,.28);font-size:13.5px;font-weight:600;max-width:420px')}>
            <Icon name={t.icon} size={16} color="#fff" />{t.msg}
          </div>
        ))}
      </div>
    </div>
  );
}
