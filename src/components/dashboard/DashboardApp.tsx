'use client';

// Inject theme variables globally
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.innerHTML = `
    :root {
      --bg-card: #fff;
      --bg-body: #f4f2ee;
      --bg-hover: #f6f4f0;
      --text-main: #211f1c;
      --text-sec: #57534c;
      --text-muted: #8c867d;
      --border-main: #e4e1da;
      --border-light: #f0ede7;
      --border-dark: #d8d4cb;
    }
    html.dark {
      --bg-card: #1c1c1e;
      --bg-body: #0a0a0a;
      --bg-hover: #2c2c2e;
      --text-main: #f5f5f5;
      --text-sec: #a1a1aa;
      --text-muted: #71717a;
      --border-main: #3f3f46;
      --border-light: #27272a;
      --border-dark: #52525b;
      color-scheme: dark;
    }
  `;
  document.head.appendChild(style);
}

// GetNearMe SaaS dashboard — React port of the Claude Design prototype.
// Phase 1: app shell (sidebar, header, project switcher, jobs tray, ⌘K), Home,
// onboarding (welcome + coachmark tour), toasts. Other routes render a placeholder
// until ported. Demo data mirrors the prototype; real data wiring comes later.

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import useSWR from 'swr';
import { s, Box, Icon } from './ui';
import type { UserData } from '@/app/[locale]/dashboard/page';
import dynamic from 'next/dynamic';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore — modulo JS condiviso con l'estensione, senza tipi
import { TEMPLATES, renderTemplate } from './templates/index.js';
// @ts-ignore — JS module, no types
import { ICONS as TPL_ICONS } from './templates/icons.js';
// @ts-ignore — JS module, no types
import { exportToPng, exportStaticToVideo, downloadBlob } from './templates/exporter.js';
import { fetchBrand, updateBrand, uploadBrandLogo, removeBrandLogo, logoUrlToDataUrl, DEFAULT_BRAND_SETTINGS, type BrandSettings } from '@/lib/brand';
import FotoAIScreen from './FotoAIScreen';
import VideoAIScreen from './VideoAIScreen';
import { loadVideoJobs, upsertVideoJob, patchVideoJob, dismissVideoJob, removeVideoJob, fetchServerVideoJobs, mergeServerJobs, prepTimeoutMs, deadTimeoutMs, prepCeiling, type VideoJob } from '@/lib/videoJobs';
import { pollRenderProgress, fetchVideoQuota } from '@/lib/aiVideo';
import MediaScreen from './MediaScreen';
import ReportScreen from './ReportScreen';
import ZonaScreen from './ZonaScreen';
import TeamScreen from './TeamScreen';
import { autoJoinTeam } from '@/lib/team';
import { HomeScreen } from './HomeScreen';
import { NewProjectModal } from './NewProjectModal';
import { ImportProjectsModal } from './ImportProjectsModal';
import { exportProjectsCSV, exportProjectsXLSX, exportProjectsPDF } from '@/lib/projectsExport';
import type { Project } from './types';
import { type ProjectData, fetchProjects, updateProject, deleteProject } from '@/lib/projects';
import { fetchUserBatches, fetchBatchPhotos, dismissBatch, type BatchInfo } from '@/lib/stagingBatches';
import { STAGING_STYLES, getTokenFast, fetchStagingQuota, fetchPostQuota, consumePostQuota, trackExport } from '@/lib/staging';
import { cleanupOldMedia } from '@/lib/localMediaCache';
import { getGeoEnabled, setGeoEnabled } from '@/lib/prefs';
import { supabase } from '@/lib/supabase';

export type AppNotification = { id: string; title: string; body: string; type: string; is_read: boolean; created_at: string; };
const TemplatePreview = dynamic(() => import('./TemplatePreview'), { ssr: false });

type Toast = { id: number; msg: string; icon: string; link?: { href: string; label: string } };

const DEMO_PROJECTS: Project[] = [
  { id: 'p1', nome: 'Attico Brera', addr: 'Via Fiori Chiari 12, Milano', prezzo: 1250000, mq: 145, locali: 4, camere: 3, bagni: 2, nFoto: 12, nStaging: 6, nVideo: 2, nPost: 8, titolo: 'Attico con terrazza nel cuore di Brera', cover: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1600&h=1000&fit=crop&q=80' },
  { id: 'p2', nome: 'Trilocale Isola', addr: 'Via Borsieri 28, Milano', prezzo: 545000, mq: 95, locali: 3, nFoto: 9, nStaging: 3, nVideo: 1, nPost: 5, titolo: 'Trilocale ristrutturato nel cuore di Isola', cover: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1600&h=1000&fit=crop&q=80' },
  { id: 'p3', nome: 'Appartamento Trastevere', addr: 'Vicolo del Cedro 9, Roma', prezzo: 690000, mq: 110, locali: 3, nFoto: 10, nStaging: 2, nVideo: 1, nPost: 4, titolo: 'Charme romano con travi a vista', cover: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1600&h=1000&fit=crop&q=80' },
  { id: 'p4', nome: 'Bilocale Crocetta', addr: 'Corso Re Umberto 44, Torino', prezzo: 295000, mq: 68, locali: 2, nFoto: 6, nStaging: 0, nVideo: 0, nPost: 2, titolo: 'Bilocale elegante in zona Crocetta', cover: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1600&h=1000&fit=crop&q=80' },
];

const NAV_SECTIONS = [
  { label: 'Immobili', items: [{ icon: 'building-2', label: 'Tutti gli immobili', route: 'immobili' }] },
  { label: 'Analisi', items: [{ icon: 'file-text', label: 'Report', route: 'report' }, { icon: 'map-pin', label: 'Zona', route: 'quartiere' }] },
  { label: 'Immobile attivo', items: [{ icon: 'layout-dashboard', label: 'Scheda', route: 'home' }, { icon: 'sparkles', label: 'Homestaging AI', route: 'staging' }, { icon: 'film', label: 'Video AI', route: 'video' }, { icon: 'scissors', label: 'Montaggio', route: 'montaggio' }, { icon: 'megaphone', label: 'Post Social', route: 'studio' }, { icon: 'images', label: 'Galleria', route: 'media' }] },
  { label: 'Agenzia', items: [{ icon: 'palette', label: 'Brand', route: 'brand' }, { icon: 'users', label: 'Team', route: 'team' }, { icon: 'credit-card', label: 'Piano', route: 'account' }] },
];

const TOUR_LABEL_TO_ROUTE: Record<string, string> = {};
NAV_SECTIONS.forEach(sec => sec.items.forEach(it => { TOUR_LABEL_TO_ROUTE[it.label] = it.route; }));

function DemoTrayJobs({ onAllDone }: { onAllDone?: () => void }) {
  const [tick, setTick] = useState(0);
  const firedRef = useRef(false);
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 350);
    return () => clearInterval(id);
  }, []);

  const total = 5;
  const completed = Math.min(total, Math.floor(tick * 1.2));
  const done = completed >= total;
  const pct = (completed / total) * 100;
  const sub = done ? 'Completato' : `In elaborazione (${completed}/${total})`;

  useEffect(() => {
    if (done && !firedRef.current) { firedRef.current = true; onAllDone?.(); }
  }, [done, onAllDone]);

  return (
    <div style={{ padding: '12px 16px', display: 'flex', gap: 12, minHeight: 56 }}>
      <div style={{ width: 32, height: 32, borderRadius: 8, background: done ? '#e6f4ea' : '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', transition: 'background .3s' }}>
        {done
          ? <Icon name="check" size={16} color="#1e8e3e" />
          : <div style={{ width: 14, height: 14, border: '2px solid #3B83F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2 }}>Foto AI · Via Roma 12, Milano</div>
        <div style={{ fontSize: 12, color: done ? '#1e8e3e' : 'var(--text-muted)', transition: 'color .3s' }}>{sub}</div>
        <div style={{ marginTop: 6, height: 4, borderRadius: 2, background: '#f0ede7', overflow: 'hidden' }}>
          <div style={{ height: '100%', borderRadius: 2, background: done ? '#1e8e3e' : '#3B83F6', width: `${pct}%`, transition: 'width .5s ease' }} />
        </div>
      </div>
    </div>
  );
}

const TOUR_DEFS = [
  { sel: '[title="Brand"]', title: 'Brand', anim: 'brand', text: 'Parti da qui: carica logo, colori e nome agenzia. Appariranno automaticamente su foto, video e post.' },
  { sel: '[title="Homestaging AI"]', title: 'Homestaging AI', anim: 'staging', text: "Arreda, svuota o trasforma le foto dei tuoi immobili con l'AI. Singola o batch, stile o prompt libero." },
  { sel: '[title="Video AI"]', title: 'Video AI', anim: 'video', text: 'Trasforma foto e clip in video pronti per i social: prima/dopo, timelapse, avatar e altro.' },
  { sel: '[title="Montaggio"]', title: 'Montaggio', anim: 'montaggio', text: "Carica le clip della casa: l'AI le monta con cover, musica e watermark in un Reel pronto." },
  { sel: '[title="Post Social"]', title: 'Post Social', anim: 'social', text: 'Template per post e storie con i dati già compilati. Scegli lo stile, personalizza e scarica.' },
  { sel: '[title="Galleria"]', title: 'Galleria', anim: 'media', text: 'Tutto ciò che generi finisce qui. Puoi riusarlo in post e video quando vuoi.' },
  { sel: '[title="Lavori in corso"]', title: 'Lavori in corso', anim: 'jobs', text: 'Le generazioni girano in background: qui vedi i progressi senza mai bloccarti. Ti avvisiamo a fine lavoro.' },
  { sel: '@center', title: 'Tutto parte da qui', anim: 'project', text: "Inserisci foto e dettagli una sola volta: l'AI li userà in automatico per generare home staging, video reel e post social perfetti e già compilati." },
  { sel: '[data-tour-dropdown]', title: 'Inizia subito', anim: 'none', text: 'Clicca qui per iniziare a caricare foto e dettagli e sbloccare tutte le funzioni AI di GetNearMe.' },
];

// Mini-animazioni per ogni step del tour (CSS, leggere).
function TourAnim({ kind }: { kind: string }) {
  const wrap: React.CSSProperties = { height: 95, borderRadius: 11, background: 'linear-gradient(135deg,#eef4fe,var(--bg-hover))', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 9, marginBottom: 13 };
  if (kind === 'brand') return (
    <div style={wrap}>
      {['#3B83F6', '#5B6CF0', 'var(--text-main)'].map((c, i) => (
        <div key={i} style={{ width: 23, height: 23, borderRadius: 7, background: c, animation: 'tour-pop .6s both', animationDelay: `${i * 0.18}s`, boxShadow: '0 2px 8px rgba(0,0,0,.12)' }} />
      ))}
      <div style={{ width: 27, height: 27, borderRadius: '50%', background: 'var(--bg-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tour-wiggle 5s ease-in-out infinite', boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}><Icon name="palette" size={14} color="#1d5fd0" /></div>
    </div>
  );
  if (kind === 'staging') return (
    <div style={wrap}>
      {/* Prima/Dopo: la parte "dopo" (arredata) si rivela con la linea che scorre dx/sx */}
      <div style={{ position: 'relative', width: 144, height: 54, borderRadius: 7 }}>
        {/* Layer "prima" (sfondo) */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 7, background: '#dbeafe' }} />
        
        {/* Layer "dopo" che si rivela, senza overflow:hidden per non tagliare il cerchio */}
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, background: 'linear-gradient(135deg,#93C5FD,#3B83F6 70%,#5B6CF0)', borderRadius: '7px 0 0 7px', animation: 'tour-reveal 3s ease-in-out infinite', display: 'flex', alignItems: 'center', paddingLeft: 9 }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 2, background: 'var(--bg-card)', boxShadow: '0 0 6px rgba(0,0,0,.25)' }} />
          <div style={{ position: 'absolute', top: '50%', right: -9, transform: 'translateY(-50%)', width: 16, height: 16, borderRadius: '50%', background: 'var(--bg-card)', boxShadow: '0 1px 5px rgba(0,0,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="var(--text-main)" strokeWidth="2.5"><path d="M8 6l-6 6 6 6M16 6l6 6-6 6" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
  if (kind === 'video') return (
    <div style={{ ...wrap, gap: 11 }}>
      {/* Foto di partenza */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {[0, 1, 2].map(i => (
           <div key={i} style={{ width: 16, height: 16, borderRadius: 3, background: 'var(--border-main)', animation: 'tour-video-squares 4s both infinite', animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      
      {/* Freccia */}
      <Icon name="arrow-right" size={13} color="#b3aca1" />
      
      {/* Video Verticale generato */}
      <div style={{ width: 43, height: 70, borderRadius: 5, background: 'linear-gradient(135deg, #3B83F6, #5B6CF0)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(59,131,246,.25)' }}>
        <div style={{ width: 25, height: 25, borderRadius: '50%', background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'aurora-pulse 2s infinite' }}>
          <Icon name="sparkles" size={13} color="var(--bg-card)" />
        </div>
      </div>
    </div>
  );
  if (kind === 'montaggio') return (
    <div style={wrap}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 27, height: 40, borderRadius: 5, background: ['#93C5FD', '#3B83F6', '#5B6CF0'][i], animation: 'tour-slide .7s both', animationDelay: `${i * 0.2}s` }} />
      ))}
      <Icon name="scissors" size={14} color="var(--text-sec)" />
      <div style={{ width: 31, height: 40, borderRadius: 5, background: 'linear-gradient(135deg,#3B83F6,#5B6CF0)', animation: 'tour-pop .6s both', animationDelay: '.75s' }} />
    </div>
  );
  if (kind === 'social') return (
    <div style={wrap}>
      <div style={{ width: 50, background: 'var(--bg-card)', borderRadius: 5, padding: 4, boxShadow: '0 8px 24px rgba(29,95,208,.12)', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
        
        {/* Header (Avatar + Name) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 9, height: 9, borderRadius: '50%', background: 'linear-gradient(135deg,#3B83F6,#5B6CF0)' }} />
          <div style={{ height: 3, width: 14, borderRadius: 2, background: 'var(--border-main)' }} />
        </div>
        
        {/* Post Image */}
        <div style={{ width: '100%', height: 34, borderRadius: 3, background: 'var(--bg-body)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="image" size={11} color="#b3aca1" />
        </div>
        
        {/* Like/Comment mini icons (simulated with circles) */}
        <div style={{ display: 'flex', gap: 2 }}>
          <div style={{ width: 4, height: 4, borderRadius: '50%', border: '1px solid #b3aca1' }} />
          <div style={{ width: 4, height: 4, borderRadius: '50%', border: '1px solid #b3aca1' }} />
        </div>

        {/* AI Caption Typing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 1 }}>
          <div style={{ height: 2, width: '90%', borderRadius: 1, background: '#3B83F6', animation: 'tour-fill 2.5s ease-in-out infinite' }} />
          <div style={{ height: 2, width: '60%', borderRadius: 1, background: '#3B83F6', animation: 'tour-fill 2.5s .3s ease-in-out infinite' }} />
          <div style={{ height: 2, width: '40%', borderRadius: 1, background: '#3B83F6', animation: 'tour-fill 2.5s .6s ease-in-out infinite' }} />
        </div>
        
        {/* Scintilla AI che fluttua al lato della caption */}
        <div style={{ position: 'absolute', bottom: -5, right: -5, background: 'var(--bg-card)', borderRadius: '50%', padding: 3, boxShadow: '0 2px 8px rgba(0,0,0,.15)', animation: 'tour-bob 2s ease-in-out infinite' }}>
          <Icon name="sparkles" size={9} color="#3B83F6" />
        </div>
      </div>
    </div>
  );
  if (kind === 'media') return (
    <div style={{ ...wrap, padding: 11, display: 'flex', gap: 7, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 34, height: 34, borderRadius: 7, background: '#3B83F6', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tour-tile-loop 6s ease-in-out infinite' }}>
        <Icon name="image" size={14} color="var(--bg-card)" />
      </div>
      <div style={{ width: 34, height: 34, borderRadius: 7, background: '#93C5FD', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tour-tile-loop 6s .6s ease-in-out infinite' }}>
        <Icon name="film" size={14} color="var(--bg-card)" />
      </div>
      <div style={{ width: 34, height: 34, borderRadius: 7, background: 'linear-gradient(135deg,#3B83F6,#5B6CF0)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tour-tile-loop 6s 1.2s ease-in-out infinite' }}>
        <Icon name="instagram" size={14} color="var(--bg-card)" />
      </div>
    </div>
  );
  if (kind === 'jobs') return (
    <div style={wrap}>
      <div style={{ position: 'relative', width: 58, height: 58, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: 50, height: 50, borderRadius: '50%', border: '1.5px solid rgba(59,131,246,.3)', animation: 'pulse-ring 2.6s linear infinite' }} />
        <div style={{ width: 36, height: 36, background: 'radial-gradient(circle at 32% 28%, #AECBFF, #3B83F6 70%, #5B6CF0)', animation: 'organic-blob 10s linear infinite', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/templates/default-logo-vertical.svg" style={{ height: 14, filter: 'brightness(0) invert(1)' }} alt="GetNearMe" />
        </div>
      </div>
    </div>
  );
  // project (step centrale)
  return (
    <div style={wrap}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        {/* L'immobile di partenza */}
        <div style={{ width: 54, height: 54, borderRadius: 13, background: 'var(--bg-card)', boxShadow: '0 12px 32px rgba(29,95,208,.12)', border: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <Icon name="home" size={25} color="#1d5fd0" />
        </div>

        {/* Freccia */}
        <div style={{ color: '#b3aca1', animation: 'tour-slide 2s alternate infinite', padding: '0 4px' }}>
          <Icon name="arrow-right" size={18} />
        </div>
        
        {/* I contenuti generati */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 7 }}>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tour-tile-loop 3s ease-in-out infinite' }}>
            <Icon name="image" size={16} color="#3B83F6" />
          </div>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tour-tile-loop 3s .3s ease-in-out infinite' }}>
            <Icon name="film" size={16} color="#3B83F6" />
          </div>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tour-tile-loop 3s .6s ease-in-out infinite' }}>
            <Icon name="instagram" size={16} color="#3B83F6" />
          </div>
          <div style={{ width: 36, height: 36, borderRadius: 9, background: '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tour-tile-loop 3s .9s ease-in-out infinite' }}>
            <Icon name="type" size={16} color="#3B83F6" />
          </div>
        </div>
      </div>
    </div>
  );
}

// Tempo stimato per template (mostrato in "Lavori in corso").
const VIDEO_ETA: Record<string, string> = {
  montaggio: '~2-5 min', before_after: '~2-4 min', ai_staging: '~2-4 min', day_night: '~2-4 min',
  construction: '~3-6 min', walkthrough: '~3-6 min', sottotitoli: '~2-4 min', classic: '~10-15 min', split: '~10-15 min',
};
const videoEta = (template: string) => VIDEO_ETA[template] || '~3-6 min';

const fmt = (n: number) => '€ ' + Number(n || 0).toLocaleString('it-IT');
/* ───── PLANS DATA ───── */
const STRIPE_BILLING_PORTAL = 'https://billing.stripe.com/p/login/9B68wP7WH3blfTG15eak000';

// Link di pagamento Stripe per subscription_type.
// individual_* = link esistenti (€59/€590). agency_* = nuovi (€399 / €3588/anno):
// crearli con `scripts/create-agency-stripe.mjs` e sostituire i placeholder.
const STRIPE_PAYMENT_LINKS: Record<string, string> = {
  starter_monthly: 'https://buy.stripe.com/00w14n5Oz7rBcHu8xGak00K',
  individual_monthly: 'https://buy.stripe.com/fZucN5dh17rB5f2bJSak00G',
  individual_annual: 'https://buy.stripe.com/bJe4gzdh19zJgXK9BKak00H', // rimosso dalla UI, tenuto per sub grandfathered
  agency_monthly: 'https://buy.stripe.com/cNifZh7WH5jt6j65luak00I',
  agency_annual: 'https://buy.stripe.com/cNi9AT7WH27h9vidS0ak00J',
};

// subscription_type → id piano (card). Legacy agency generici → individuale.
const SUB_TYPE_TO_PLAN: Record<string, string> = {
  free: 'free',
  starter_monthly: 'starter',
  individual_monthly: 'ind_monthly',
  individual_annual: 'ind_annual',
  agency_monthly: 'agy_monthly',
  agency_annual: 'agy_annual',
  // Legacy/generici (pre-split): contano come Individuale mensile.
  agency: 'ind_monthly',
  agency_quarterly: 'ind_monthly',
  agency_pro: 'agy_monthly',
  agency_starter: 'ind_monthly',
};

const PLAN_TO_SUB_TYPE: Record<string, string> = {
  starter: 'starter_monthly',
  ind_monthly: 'individual_monthly',
  ind_annual: 'individual_annual',
  agy_monthly: 'agency_monthly',
  agy_annual: 'agency_annual',
};

// Tier Agenzia = subscription_type che inizia con 'agency' (gating Team/quote).
function isAgencyTier(subType?: string | null): boolean {
  return !!subType && subType.startsWith('agency');
}

type PlanTier = 'individual' | 'agency';

const INDIVIDUAL_FEATURES = [
  '300 foto AI homestaging/mese',
  '6 video AI/mese',
  'Post social illimitati',
  'Montaggio Illimitato',
  'Report Automatici',
  'Analisi della zona',
  'Import immobili',
  'Contenuti 100% Brandizzati',
  'Supporto prioritario',
];

// {users}/{photos}/{videos}: risolti a render con lo slider utenti (seat-based 2-10).
const AGENCY_FEATURES = [
  '{users} collaboratori inclusi (Team)',
  'Brand condiviso col team',
  '{photos} foto AI homestaging/mese',
  '{videos} video AI/mese',
  'Post social illimitati',
  'Montaggio Illimitato',
  'Report Automatici',
  'Analisi della zona illimitate',
  'Import immobili',
  'Supporto prioritario dedicato',
];

const AGENCY_CUSTOM_FEATURES = [
  'Più di 10 collaboratori',
  'Foto e video su misura',
  'Onboarding assistito',
  'Contratto e fatturazione dedicati',
  'Supporto prioritario dedicato',
];

const FREE_FEATURES = [
  '10 foto AI homestaging',
  '5 montaggi video',
  '5 post social',
  '5 Analisi di zona',
];

type Plan = {
  id: string; name: string; price: number; oldPrice: number; period: string;
  badge: string | null; popular: boolean; features: string[]; color: string;
  quotaFoto: number; quotaVideo: number; quotaPost: number; note?: string;
  hidden?: boolean; // fuori dalle card acquistabili, ma resta nel lookup per sub grandfathered
};

const FREE_PLAN: Plan = {
  id: 'free', name: 'Free', price: 0, oldPrice: 0, period: '', badge: null, popular: false,
  features: FREE_FEATURES, color: 'var(--text-muted)', quotaFoto: 10, quotaVideo: 0, quotaPost: 5,
};

const STARTER_FEATURES = [
  '100 foto AI homestaging/mese',
  '2 video AI/mese, tutti i template',
  '10 montaggi video/mese',
  '20 post social/mese',
  'Analisi della zona',
  'Import immobili',
];

const PLANS_BY_TIER: Record<PlanTier, Plan[]> = {
  individual: [
    FREE_PLAN,
    { id: 'starter', name: 'Starter', price: 14.99, oldPrice: 19.99, period: '/mese', badge: 'Più scelto', popular: true, features: STARTER_FEATURES, color: 'var(--text-main)', quotaFoto: 100, quotaVideo: 2, quotaPost: 20 },
    { id: 'ind_monthly', name: 'Mensile', price: 59, oldPrice: 150, period: '/mese', badge: null, popular: false, features: INDIVIDUAL_FEATURES, color: 'var(--text-main)', quotaFoto: 300, quotaVideo: 6, quotaPost: 999 },
    { id: 'ind_annual', name: 'Annuale', price: 590, oldPrice: 1800, period: '/anno', badge: null, popular: false, features: INDIVIDUAL_FEATURES, color: 'var(--text-main)', quotaFoto: 300, quotaVideo: 6, quotaPost: 999, hidden: true },
  ],
  agency: [
    // Prezzo mostrato PER UTENTE (slider 2-10). Totale reale fatturato: prezzo × utenti.
    { id: 'agy_monthly', name: 'Mensile', price: 80, oldPrice: 200, period: '/mese a utente', badge: null, popular: false, features: AGENCY_FEATURES, color: 'var(--text-main)', quotaFoto: 2000, quotaVideo: 12, quotaPost: 999, note: '5 utenti · €399/mese' },
    { id: 'agy_annual', name: 'Annuale', price: 60, oldPrice: 150, period: '/mese a utente', badge: 'Più scelto', popular: true, features: AGENCY_FEATURES, color: 'var(--text-main)', quotaFoto: 2000, quotaVideo: 12, quotaPost: 999, note: '5 utenti · €299/mese' },
    { id: 'agy_custom', name: 'Custom', price: 0, oldPrice: 0, period: '', badge: null, popular: false, features: AGENCY_CUSTOM_FEATURES, color: 'var(--text-main)', quotaFoto: 0, quotaVideo: 0, quotaPost: 0 },
  ],
};

// Tutti i piani (per lookup del piano attivo). Free una volta sola.
const ALL_PLANS: Plan[] = [...PLANS_BY_TIER.individual, ...PLANS_BY_TIER.agency.slice(1)];

// Brand GetNearMe imposto e BLOCCATO per gli account free: watermark + copertina
// finale dei video, e i loghi mostrati nella sezione Brand. URL assoluti (origin
// corrente) cosi' che il Lambda di render possa fetcharli per watermark/outro.
function gnmBrandLogos(): import('@/lib/brand').BrandLogos {
  const o = typeof window !== 'undefined' ? window.location.origin : 'https://www.getnearme.it';
  return {
    logo_white_h: `${o}/assets/svg/logo_scritta_white.svg`,
    logo_white_v: `${o}/dashboard/logo-icon-white.svg`,
    logo_black_h: `${o}/assets/svg/logo_scritta_black.svg`,
    logo_black_v: `${o}/dashboard/logo-icon-black.svg`,
    logo_colored_h: `${o}/assets/svg/logo_scritta_black.svg`,
    logo_colored_v: `${o}/dashboard/logo-icon.svg`,
  };
}

function redirectToStripePayment(planId: string, userId: string, email: string) {
  const subType = PLAN_TO_SUB_TYPE[planId];
  const baseUrl = subType ? STRIPE_PAYMENT_LINKS[subType] : null;
  if (!baseUrl) return;
  const url = new URL(baseUrl);
  url.searchParams.set('client_reference_id', userId);
  url.searchParams.set('prefilled_email', email);
  window.open(url.toString(), '_blank');
}


/* ───── POST SOCIAL SCREEN ───── */
// Registry vero dei template, identico all'estensione (vedi templates/index.js)

// Stessi formati e safe area di TEMPLATE_CATEGORIES dell'estensione (templates/index.js)
const PS_PLATFORMS = [
  { id: 'instagram', label: 'Instagram', formats: [
    { id: 'ig-post', label: 'Post 1080 × 1350', w: 1080, h: 1350, safe: { top: 60, bottom: 60, left: 60, right: 60 } },
    { id: 'ig-quadrato', label: 'Quadrato 1080 × 1080', w: 1080, h: 1080, safe: { top: 60, bottom: 60, left: 60, right: 60 } },
    { id: 'ig-story', label: 'Story 1080 × 1920', w: 1080, h: 1920, safe: { top: 100, bottom: 200, left: 0, right: 0 } },
    { id: 'ig-reel', label: 'Reel 1080 × 1920', w: 1080, h: 1920, safe: { top: 250, bottom: 340, left: 84, right: 84 } },
  ]},
  { id: 'facebook', label: 'Facebook', formats: [
    { id: 'fb-post', label: 'Post 1080 × 1350', w: 1080, h: 1350, safe: { top: 60, bottom: 60, left: 60, right: 60 } },
    { id: 'fb-quadrato', label: 'Quadrato 1080 × 1080', w: 1080, h: 1080, safe: { top: 60, bottom: 60, left: 60, right: 60 } },
    { id: 'fb-story', label: 'Story 1080 × 1920', w: 1080, h: 1920, safe: { top: 225, bottom: 275, left: 0, right: 0 } },
  ]},
  { id: 'tiktok', label: 'TikTok', formats: [
    { id: 'tt-video', label: 'Video 1080 × 1920', w: 1080, h: 1920, safe: { top: 108, bottom: 320, left: 120, right: 120 } },
  ]},
  { id: 'linkedin', label: 'LinkedIn', formats: [
    { id: 'li-post', label: 'Post 1080 × 1350', w: 1080, h: 1350 },
    { id: 'li-quadrato', label: 'Quadrato 1080 × 1080', w: 1080, h: 1080 },
  ]},
  { id: 'whatsapp', label: 'WhatsApp', formats: [
    // Stato: 9:16, overlay UI WhatsApp (barra nome/timestamp in alto, caption + barra "Rispondi" in basso).
    { id: 'wa-stato', label: 'Stato 1080 × 1920', w: 1080, h: 1920, safe: { top: 250, bottom: 250, left: 0, right: 0 } },
    // Immagine in chat: nessun overlay sulla foto, margine standard.
    { id: 'wa-immagine', label: 'Immagine 1080 × 1350', w: 1080, h: 1350, safe: { top: 60, bottom: 60, left: 60, right: 60 } },
    { id: 'wa-quadrato', label: 'Quadrato 1080 × 1080', w: 1080, h: 1080, safe: { top: 60, bottom: 60, left: 60, right: 60 } },
  ]},
];

const ANIM_STYLES: { id: string; label: string }[] = [
  { id: 'slide-up', label: 'Scorrimento' }, { id: 'fade', label: 'Dissolvenza' },
  { id: 'scale', label: 'Espansione' }, { id: 'slide-right', label: 'Laterale' },
  { id: 'drop', label: 'Caduta' }, { id: 'zoom-out', label: 'Zoom' },
  { id: 'bounce', label: 'Rimbalzo' }, { id: 'diagonal', label: 'Diagonale' },
];

const ANIM_CSS = `
.aw{position:absolute;border-radius:2px;opacity:0;animation-duration:3.5s;animation-iteration-count:infinite;animation-fill-mode:both}
.aw-badge{width: 16px;height: 4px;top: 9px;left: 7px;background:#6875F5}
.aw-price{width: 34px;height: 7px;top: 17px;left: 7px;background:var(--bg-card)}
.aw-title{width: 45px;height: 4px;top: 29px;left: 7px;background:rgba(255,255,255,.7)}
.aw-addr{width: 25px;height: 3px;top: 37px;left: 7px;background:rgba(255,255,255,.35)}
.aw-m1{width: 14px;height: 12px;top: 47px;left: 4px;background:rgba(255,255,255,.15);border-radius:3px}
.aw-m2{width: 14px;height: 12px;top: 47px;left: 22px;background:rgba(255,255,255,.15);border-radius:3px}
.aw-m3{width: 14px;height: 12px;top: 47px;left: 40px;background:rgba(255,255,255,.15);border-radius:3px}
.aw-desc{width: 49px;height: 4px;top: 68px;left: 7px;background:rgba(255,255,255,.45)}
.aw-badge{animation-delay:.3s}.aw-price{animation-delay:.5s}.aw-title{animation-delay:.7s}
.aw-addr{animation-delay:.9s}.aw-m1{animation-delay:1.1s}.aw-m2{animation-delay:1.25s}
.aw-m3{animation-delay:1.4s}.aw-desc{animation-delay:1.6s}
@keyframes aw-slide-up{0%,6%{opacity:0;transform:translateY(22px)}16%,65%{opacity:1;transform:translateY(0)}78%,100%{opacity:0}}
@keyframes aw-fade{0%,6%{opacity:0}20%,65%{opacity:1}78%,100%{opacity:0}}
@keyframes aw-scale{0%,6%{opacity:0;transform:scale(.3)}16%,65%{opacity:1;transform:scale(1)}78%,100%{opacity:0}}
@keyframes aw-slide-right{0%,6%{opacity:0;transform:translateX(-22px)}16%,65%{opacity:1;transform:translateX(0)}78%,100%{opacity:0}}
@keyframes aw-drop{0%,6%{opacity:0;transform:translateY(-22px)}13%{opacity:1;transform:translateY(5px)}16%,65%{opacity:1;transform:translateY(0)}78%,100%{opacity:0}}
@keyframes aw-zoom-out{0%,6%{opacity:0;transform:scale(2)}16%,65%{opacity:1;transform:scale(1)}78%,100%{opacity:0}}
@keyframes aw-bounce{0%,6%{opacity:0;transform:translateY(25px)}12%{opacity:1;transform:translateY(-8px)}15%{transform:translateY(3px)}18%,65%{opacity:1;transform:translateY(0)}78%,100%{opacity:0}}
@keyframes aw-diagonal{0%,6%{opacity:0;transform:translate(-16px,16px)}16%,65%{opacity:1;transform:translate(0,0)}78%,100%{opacity:0}}
.acp--slide-up .aw{animation-name:aw-slide-up}.acp--fade .aw{animation-name:aw-fade}
.acp--scale .aw{animation-name:aw-scale}.acp--slide-right .aw{animation-name:aw-slide-right}
.acp--drop .aw{animation-name:aw-drop}.acp--zoom-out .aw{animation-name:aw-zoom-out}
.acp--bounce .aw{animation-name:aw-bounce}.acp--diagonal .aw{animation-name:aw-diagonal}
@keyframes export-spin{to{transform:rotate(360deg)}}
`;

const PICKER_ICONS: { key: string; label: string }[] = [
  { key: 'bed', label: 'Camere' }, { key: 'bath', label: 'Bagni' }, { key: 'area', label: 'Superficie' },
  { key: 'rooms', label: 'Locali' }, { key: 'sofa', label: 'Soggiorno' }, { key: 'cookingPot', label: 'Cucina' },
  { key: 'elevator', label: 'Ascensore' }, { key: 'balcony', label: 'Balcone' }, { key: 'terrace', label: 'Terrazzo' },
  { key: 'garden', label: 'Giardino' }, { key: 'parking', label: 'Parcheggio' }, { key: 'floor', label: 'Piano' },
];

// Stessi dati campione del post wizard dell'estensione (SAMPLE_DATA in post-wizard-app.js)
const DEFAULT_PHOTO = '/templates/default-photo.png';

const SAMPLE_TPL_DATA = {
  price: '€ 250.000', address: 'Via Valerio Rossi, 53',
  surface: '180 m²', surfaceNum: '180', rooms: '4',
  bedrooms: '4', bathrooms: '3', type: 'Appartamento Premium',
  title: 'Appartamento Premium', contract: 'Nuovo',
  description: 'Splendido appartamento con finiture di pregio e ampi spazi luminosi.',
  ctaText: 'Contattaci ora', accentColor: '#2967EC',
};


// Carica i loghi GNM default come data URL, come fa il post wizard dell'estensione
let logosCache: { white: string | null; black: string | null; blue: string | null } | null = null;
async function loadDefaultLogos() {
  if (logosCache) return logosCache;
  const load = async (url: string): Promise<string | null> => {
    try {
      const resp = await fetch(url);
      if (!resp.ok) return null;
      const blob = await resp.blob();
      return await new Promise<string>(r => { const fr = new FileReader(); fr.onload = () => r(fr.result as string); fr.readAsDataURL(blob); });
    } catch { return null; }
  };
  const [white, black, blue] = await Promise.all([
    load('/templates/default-logo-vertical.svg'),
    load('/templates/default-logo-vertical-black.svg'),
    load('/templates/default-logo-vertical-blue.svg'),
  ]);
  logosCache = { white, black, blue };
  return logosCache;
}

const LOGO_VARIANT_LABELS: Record<string, string> = {
  white_v: 'Icona, Bianco', white_h: 'Icona + Nome, Bianco',
  black_v: 'Icona, Nero', black_h: 'Icona + Nome, Nero',
  colored_v: 'Icona, Colore', colored_h: 'Icona + Nome, Colore',
};

function PostSocialScreen({ toast, routeKey, brand, project, batches, onProjectUpdate, initialPhotoUrl, go, demoMode }: { toast: (msg: string, icon?: string) => void; routeKey: number; brand: BrandSettings; project?: Project; batches?: BatchInfo[]; onProjectUpdate?: (p: Partial<Project>) => void; initialPhotoUrl?: string | null; go?: (r: string) => void; demoMode?: boolean }) {
  const [step, setStep] = React.useState(1);
  React.useEffect(() => { setStep(1); }, [routeKey]);
  const [logos, setLogos] = React.useState<{ white: string | null; black: string | null; blue: string | null } | null>(logosCache);
  React.useEffect(() => { loadDefaultLogos().then(setLogos); }, []);
  // All 6 agency brand logo variants converted to data URLs (so html2canvas
  // export does not taint), keyed white_h/white_v/black_h/.../colored_v.
  const BRAND_LOGO_KEYS = ['white_h', 'white_v', 'black_h', 'black_v', 'colored_h', 'colored_v'] as const;
  const [allBrandLogos, setAllBrandLogos] = React.useState<Record<string, string | null>>({});
  React.useEffect(() => {
    Promise.all(BRAND_LOGO_KEYS.map(k => logoUrlToDataUrl(brand.logos[`logo_${k}` as keyof typeof brand.logos])))
      .then(arr => { const o: Record<string, string | null> = {}; BRAND_LOGO_KEYS.forEach((k, i) => { o[k] = arr[i]; }); setAllBrandLogos(o); });
  }, [brand]);
  const accentColor = brand.primaryColor || '#2967EC';
  // 'auto' lets the template auto-pick by background; otherwise force a variant.
  const [selectedLogoKey, setSelectedLogoKey] = React.useState('auto');
  const [logoMenuOpen, setLogoMenuOpen] = React.useState(false);
  // Reset selection to auto if the chosen variant is no longer available.
  React.useEffect(() => {
    if (selectedLogoKey !== 'auto' && !allBrandLogos[selectedLogoKey]) setSelectedLogoKey('auto');
  }, [allBrandLogos, selectedLogoKey]);
  const buildLogoOpts = (): Record<string, unknown> => {
    if (selectedLogoKey !== 'auto' && allBrandLogos[selectedLogoKey]) {
      const [color, ori] = selectedLogoKey.split('_');
      const src = allBrandLogos[selectedLogoKey];
      return {
        logoWhite: color === 'white' ? src : null,
        logoBlack: color === 'black' ? src : null,
        logoColored: color === 'colored' ? src : null,
        logoPosition: 'top-right',
        logoOrientation: ori === 'v' ? 'vertical' : 'horizontal',
      };
    }
    const suf = brand.logoOrientation === 'horizontal' ? 'h' : 'v';
    return {
      logoWhite: allBrandLogos[`white_${suf}`] || logos?.white || null,
      logoBlack: allBrandLogos[`black_${suf}`] || logos?.black || null,
      logoColored: allBrandLogos[`colored_${suf}`] || logos?.blue || null,
      logoPosition: 'top-right',
      logoOrientation: brand.logoOrientation || 'vertical',
    };
  };
  const [platform, setPlatform] = React.useState('instagram');
  const [formatId, setFormatId] = React.useState('ig-post');
  const [postFilterOpen, setPostFilterOpen] = React.useState(false);
  const [tplId, setTplId] = React.useState('gradient');
  const [bgLoaded, setBgLoaded] = React.useState(false);
  const [fields, setFields] = React.useState(() => ({
    titolo: project?.titolo ?? '', indirizzo: project?.addr ?? '',
    prezzo: project ? Number(project.prezzo).toLocaleString('it-IT') : '',
    superficie: project ? String(project.mq) : '', camere: project ? String(project.camere) : '',
    bagni: project ? String(project.bagni) : '', descrizione: '', btnTxt: 'Contattaci ora', badgeTxt: 'Nuovo',
  }));
  const [showBadge, setShowBadge] = React.useState(true);
  const [showLogo, setShowLogo] = React.useState(true);
  const [oscuramento, setOscuramento] = React.useState(100);
  const [animStyle, setAnimStyle] = React.useState('slide-up');
  const [pubPlatforms, setPubPlatforms] = React.useState({ instagram: true, facebook: false, tiktok: false });
  const [pubMode, setPubMode] = React.useState<'schedule' | 'now'>('schedule');
  const [pubDate, setPubDate] = React.useState('');
  const [publishing, setPublishing] = React.useState(false);
  const [caption, setCaption] = React.useState('');
  const [hashtags, setHashtags] = React.useState('');
  const [firstComment, setFirstComment] = React.useState('');
  const [coverPhoto, setCoverPhoto] = React.useState<string>(initialPhotoUrl || DEFAULT_PHOTO);
  const [isVideo, setIsVideo] = React.useState(false);
  const [videoThumb, setVideoThumb] = React.useState<string>('');
  const [fitCover, setFitCover] = React.useState(false);
  const [extraPhotos, setExtraPhotos] = React.useState<string[]>([]);
  
  const aiCheckedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!batches || !project?.id) return;
    if (aiCheckedRef.current === project.id) return; // already loaded for this project
    const latestBatch = batches.find(b => b.projectId === project.id && b.status === 'completed');
    if (latestBatch) {
      aiCheckedRef.current = project.id;
      fetchBatchPhotos(latestBatch.id).then(photos => {
         const valid = photos.filter(p => p.resultUrl);
         if (valid.length > 0) {
           setCoverPhoto(prev => prev === DEFAULT_PHOTO ? valid[valid.length - 1].resultUrl : prev);
         }
      });
    }
  }, [batches, project?.id]);
  const [fieldIcons, setFieldIcons] = React.useState<Record<string, string>>(() => {
    return project?.icons ? { bedrooms: project.icons.camere || 'bed', bathrooms: project.icons.bagni || 'bath', surface: project.icons.mq || 'area' } : { bedrooms: 'bed', bathrooms: 'bath', surface: 'area' };
  });
  const [iconDropdown, setIconDropdown] = React.useState<string | null>(null);
  const [currency, setCurrency] = React.useState(() => project?.icons?.prezzo === 'dollar' ? '$' : project?.icons?.prezzo === 'pound' ? '£' : '€');
  
  React.useEffect(() => {
    setFields({
      titolo: project?.titolo ?? '', indirizzo: project?.addr ?? '',
      prezzo: project && project.prezzo ? Number(project.prezzo).toLocaleString('it-IT') : '',
      superficie: project && project.mq ? String(project.mq) : '', camere: project && project.camere ? String(project.camere) : '',
      bagni: project && project.bagni ? String(project.bagni) : '', descrizione: project?.descrizione ?? '', btnTxt: 'Contattaci ora', badgeTxt: 'Nuovo',
    });
    setFieldIcons(project?.icons ? { bedrooms: project.icons.camere || 'bed', bathrooms: project.icons.bagni || 'bath', surface: project.icons.mq || 'area' } : { bedrooms: 'bed', bathrooms: 'bath', surface: 'area' });
    setCurrency(project?.icons?.prezzo === 'dollar' ? '$' : project?.icons?.prezzo === 'pound' ? '£' : '€');
  }, [project]);

  const [currencyDropdown, setCurrencyDropdown] = React.useState(false);
  const [showAnimPicker, setShowAnimPicker] = React.useState(false);
  const [exporting, setExporting] = React.useState<'image' | 'video' | null>(null);
  const [exportProgress, setExportProgress] = React.useState(0);
  // Quota post: 5 gratis, illimitati sui piani a pagamento. Gate su ogni export.
  const [postQuota, setPostQuota] = React.useState<{ unlimited: boolean; remaining: number } | null>(null);
  const [postsPaywallOpen, setPostsPaywallOpen] = React.useState(false);
  React.useEffect(() => { fetchPostQuota().then(setPostQuota); }, []);
  // Refetch al ritorno da una tab esterna (es. checkout pacchetti) -> pill aggiornata.
  React.useEffect(() => {
    const onFocus = () => { if (!document.hidden) fetchPostQuota().then(setPostQuota); };
    window.addEventListener('focus', onFocus);
    document.addEventListener('visibilitychange', onFocus);
    return () => { window.removeEventListener('focus', onFocus); document.removeEventListener('visibilitychange', onFocus); };
  }, []);
  // Ritorna true se si puo' procedere (consuma 1 credito), altrimenti apre il paywall.
  const gatePost = async (): Promise<boolean> => {
    if (postQuota && !postQuota.unlimited && postQuota.remaining <= 0) { setPostsPaywallOpen(true); return false; }
    const r = await consumePostQuota();
    if (!r || !r.allowed) { setPostsPaywallOpen(true); return false; }
    if (!r.unlimited && typeof r.remaining === 'number') setPostQuota({ unlimited: false, remaining: r.remaining });
    else if (r.unlimited) setPostQuota({ unlimited: true, remaining: 0 });
    return true;
  };
  const exportAbortRef = React.useRef<AbortController | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const extraFileRefs = React.useRef<(HTMLInputElement | null)[]>([]);
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCoverPhoto(url);
    const isVid = file.type.startsWith('video/');
    setIsVideo(isVid);
    setVideoThumb('');
    if (isVid) {
      const vid = document.createElement('video');
      vid.muted = true;
      vid.playsInline = true;
      vid.preload = 'auto';
      vid.onloadeddata = () => { vid.currentTime = 0.1; };
      vid.onseeked = () => {
        const c = document.createElement('canvas');
        c.width = vid.videoWidth || 320;
        c.height = vid.videoHeight || 240;
        c.getContext('2d')!.drawImage(vid, 0, 0, c.width, c.height);
        setVideoThumb(c.toDataURL('image/jpeg', 0.7));
      };
      vid.src = url;
    }
  };
  const handleExtraPhoto = (idx: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setExtraPhotos(prev => { const next = [...prev]; next[idx] = url; return next; });
    e.target.value = '';
  };
  const getPhotosArray = (tpl: typeof TEMPLATES[number]) => {
    if (!tpl.multiPhoto) return undefined;
    const count = tpl.multiPhoto - 1;
    return Array.from({ length: count }, (_, i) => extraPhotos[i] || '');
  };

  const previewContainerRef = React.useRef<HTMLDivElement>(null);

  // Builds a fresh full-size template element OUTSIDE React's DOM (React re-renders
  // during export would replace the preview element mid-capture and break html2canvas).
  // Mounted at normal coordinates inside an opacity:0 wrapper, same as the extension:
  // html2canvas starts rendering at the target element, ancestor opacity is ignored.
  const mountExportEl = async () => {
    const blurredUrl: string = await new Promise((resolve) => {
      const img = new Image();
      if (!coverPhoto.startsWith('blob:')) img.crossOrigin = 'anonymous';
      img.onload = () => {
        const sc = 0.15;
        const cw = Math.max(Math.round(img.naturalWidth * sc), 1);
        const ch = Math.max(Math.round(img.naturalHeight * sc), 1);
        const canvas = document.createElement('canvas');
        canvas.width = cw; canvas.height = ch;
        const ctx = canvas.getContext('2d')!;
        ctx.filter = 'blur(8px)';
        ctx.drawImage(img, 0, 0, cw, ch);
        resolve(canvas.toDataURL('image/jpeg', 0.5));
      };
      img.onerror = () => resolve(coverPhoto);
      img.src = coverPhoto;
    });

    const data = {
      ...SAMPLE_TPL_DATA, accentColor,
      title: fields.titolo || project?.nome || '-',
      type: fields.titolo || project?.nome || '-',
      address: fields.indirizzo || '-',
      price: fields.prezzo ? `${currency} ${fields.prezzo}` : '-',
      surface: fields.superficie ? fields.superficie + ' m²' : '0 m²',
      surfaceNum: fields.superficie || '0',
      bedrooms: fields.camere || '0',
      bathrooms: fields.bagni || '0',
      rooms: fields.camere || '0',
      description: fields.descrizione || '-',
      ctaText: fields.btnTxt || '-',
      contract: showBadge ? (fields.badgeTxt || 'Nuovo') : '',
      _icons: fieldIcons,
    };
    const opts: Record<string, unknown> = {
      size: curFmt,
      blurredUrl,
      isVideo,
      fitCover,
      ...(showLogo ? buildLogoOpts() : {}),
      ...(curTpl.multiPhoto ? { photos: getPhotosArray(curTpl) } : {}),
    };
    const tplEl = renderTemplate(tplId, data, coverPhoto, opts) as HTMLElement;
    tplEl.style.width = curFmt.w + 'px';
    tplEl.style.height = curFmt.h + 'px';

    const wrapper = document.createElement('div');
    wrapper.style.cssText = `position:fixed;top: 0;left: 0;width:${curFmt.w}px;height:${curFmt.h}px;opacity:0;pointer-events:none;overflow:visible;z-index:-1;`;
    wrapper.appendChild(tplEl);
    document.body.appendChild(wrapper);

    const blurMap: Record<string, string> = {
      'tpl-glass-panel': 'blur(16px)',
      'tpl-metric-card': 'blur(12px)',
      'tpl-metric-pill': 'blur(12px)',
    };
    for (const [cls, val] of Object.entries(blurMap)) {
      tplEl.querySelectorAll('.' + cls).forEach((node) => {
        const h = node as HTMLElement;
        h.style.backdropFilter = val;
        h.style.setProperty('-webkit-backdrop-filter', val);
        h.style.transform = 'translateZ(0)';
      });
    }

    const dimAlpha = oscuramento / 100;
    tplEl.querySelectorAll('.tpl-overlay').forEach((node) => {
      (node as HTMLElement).style.opacity = String(dimAlpha);
    });

    // Force-load every Poppins weight the templates use (incl. 300, used by
    // Magazine price) so foreignObject capture renders the correct weight
    // instead of falling back to 400.
    if (document.fonts?.load) {
      await Promise.all([300, 400, 500, 600, 700].map(w => document.fonts.load(`${w} 64px Poppins`).catch(() => {})));
    }
    if (document.fonts?.ready) await document.fonts.ready;
    await new Promise<void>(resolve => {
      const imgs = tplEl.querySelectorAll('img');
      let pending = 0;
      imgs.forEach(img => { if (!img.complete) { pending++; img.onload = img.onerror = () => { if (--pending === 0) resolve(); }; } });
      if (pending === 0) resolve();
    });
    await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));

    return { tplEl, cleanup: () => { try { wrapper.remove(); } catch {} } };
  };

  const handleExportImage = async () => {
    if (exporting) return;
    if (isVideo) { toast('Hai caricato un video: scarica il video, non l’immagine', 'download'); return; }
    if (!(await gatePost())) return;
    setExporting('image');
    let cleanup: (() => void) | null = null;
    try {
      const mounted = await mountExportEl();
      cleanup = mounted.cleanup;
      const blob = await exportToPng(mounted.tplEl, { w: curFmt.w, h: curFmt.h }, { photoSrc: coverPhoto, fitCover });
      await downloadBlob(blob, 'social-post.png');
      void trackExport({ export_type: 'post_png', width: curFmt.w, height: curFmt.h, format: `${curFmt.w}x${curFmt.h}`, template: tplId });
      toast('Immagine scaricata', 'download');
      
      cleanup?.();
      setExporting(null);
      
      if (project) {
        const updates = {
          titolo: fields.titolo,
          addr: fields.indirizzo,
          prezzo: Number(String(fields.prezzo || '').replace(/\D/g, '')) || 0,
          mq: Number(String(fields.superficie || '').replace(/\D/g, '')) || 0,
          camere: Number(String(fields.camere || '').replace(/\D/g, '')) || 0,
          bagni: Number(String(fields.bagni || '').replace(/\D/g, '')) || 0,
          descrizione: fields.descrizione,
          nPost: (project.nPost || 0) + 1,
        };
        // nPost non viene persistito dall'API progetti -> al refresh si perde.
        // Flag locale per progetto: la Home segna "Post Social pronti" in modo
        // affidabile appena scarichi un post (immagine o video).
        try { localStorage.setItem('gnm_post_done_' + project.id, '1'); } catch { /* quota */ }
        updateProject(project.id, updates).catch(e => console.error("updateProject failed", e));
        onProjectUpdate?.(updates);
      }
    } catch (err) {
      console.error('Export PNG failed:', err);
      toast('Errore durante il download', 'download');
      cleanup?.();
      setExporting(null);
    }
  };

  const handleExportAll = async () => {
    if (exporting) return;
    if (!(await gatePost())) return;
    setExporting('image');
    try {
      const blurredUrl: string = await new Promise((resolve) => {
        const img = new Image();
        if (!coverPhoto.startsWith('blob:')) img.crossOrigin = 'anonymous';
        img.onload = () => {
          const sc = 0.15;
          const cw = Math.max(Math.round(img.naturalWidth * sc), 1);
          const ch = Math.max(Math.round(img.naturalHeight * sc), 1);
          const canvas = document.createElement('canvas');
          canvas.width = cw; canvas.height = ch;
          const ctx = canvas.getContext('2d')!;
          ctx.filter = 'blur(8px)';
          ctx.drawImage(img, 0, 0, cw, ch);
          resolve(canvas.toDataURL('image/jpeg', 0.5));
        };
        img.onerror = () => resolve(coverPhoto);
        img.src = coverPhoto;
      });
      const data = {
        ...SAMPLE_TPL_DATA, accentColor,
        title: fields.titolo || project?.nome || '-',
        type: fields.titolo || project?.nome || '-',
        address: fields.indirizzo || '-',
        price: fields.prezzo ? `${currency} ${fields.prezzo}` : '-',
        surface: fields.superficie ? fields.superficie + ' m²' : '0 m²',
        surfaceNum: fields.superficie || '0',
        bedrooms: fields.camere || '0',
        bathrooms: fields.bagni || '0',
        rooms: fields.camere || '0',
        description: fields.descrizione || '-',
        ctaText: fields.btnTxt || '-',
        contract: showBadge ? (fields.badgeTxt || 'Nuovo') : '',
        _icons: fieldIcons,
      };
      const blurMap: Record<string, string> = {
        'tpl-glass-panel': 'blur(16px)', 'tpl-metric-card': 'blur(12px)', 'tpl-metric-pill': 'blur(12px)',
      };
      if (document.fonts?.load) {
        await Promise.all([300, 400, 500, 600, 700].map(w => document.fonts.load(`${w} 64px Poppins`).catch(() => {})));
      }
      if (document.fonts?.ready) await document.fonts.ready;
      const { default: JSZip } = await import('jszip');
      const zip = new JSZip();
      // All non-video formats across platforms (exclude reel/video)
      const allFormats = PS_PLATFORMS.flatMap(p =>
        p.formats
          .filter(f => !/video|reel/i.test(f.id))
          .map(f => ({ ...f, platform: p.id }))
      );
      let count = 0;
      let tplIdx = -1;
      for (const tpl of TEMPLATES) {
        tplIdx++;
        const tplFitCover = NO_COVER_TPL.includes(tpl.id) ? false : fitCover;
        for (const f of allFormats) {
          try {
            const opts: Record<string, unknown> = {
              size: f, blurredUrl, isVideo, fitCover: tplFitCover,
              ...(showLogo ? buildLogoOpts() : {}),
              ...(tpl.multiPhoto ? { photos: getPhotosArray(tpl) } : {}),
            };
            const tplEl = renderTemplate(tpl.id, data, coverPhoto, opts) as HTMLElement;
            tplEl.style.width = f.w + 'px';
            tplEl.style.height = f.h + 'px';
            const wrapper = document.createElement('div');
            wrapper.style.cssText = `position:fixed;top: 0;left: 0;width:${f.w}px;height:${f.h}px;opacity:0;pointer-events:none;overflow:visible;z-index:-1;`;
            wrapper.appendChild(tplEl);
            document.body.appendChild(wrapper);
            for (const [cls, val] of Object.entries(blurMap)) {
              tplEl.querySelectorAll('.' + cls).forEach((n) => {
                const h = n as HTMLElement; h.style.backdropFilter = val; h.style.setProperty('-webkit-backdrop-filter', val); h.style.transform = 'translateZ(0)';
              });
            }
            tplEl.querySelectorAll('.tpl-overlay').forEach((n) => { (n as HTMLElement).style.opacity = String(oscuramento / 100); });
            await new Promise<void>(resolve => {
              const imgs = tplEl.querySelectorAll('img');
              let pending = 0;
              imgs.forEach(img => { if (!img.complete) { pending++; img.onload = img.onerror = () => { if (--pending === 0) resolve(); }; } });
              if (pending === 0) resolve();
            });
            await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
            const blob = await exportToPng(tplEl, { w: f.w, h: f.h }, { photoSrc: coverPhoto, fitCover: tplFitCover });
            zip.file(`${tpl.id}/${f.id}-${f.w}x${f.h}.png`, blob);
            count++;
            wrapper.remove();
          } catch (err) {
            console.error(`Export ${tpl.id} ${f.id} failed:`, err);
          }
        }
        // One video per template, cycling through the animation styles.
        try {
          const animId = ANIM_STYLES[tplIdx % ANIM_STYLES.length].id;
          const vopts: Record<string, unknown> = {
            size: curFmt, blurredUrl, isVideo, fitCover: tplFitCover,
            ...(showLogo ? buildLogoOpts() : {}),
            ...(tpl.multiPhoto ? { photos: getPhotosArray(tpl) } : {}),
          };
          const vEl = renderTemplate(tpl.id, data, coverPhoto, vopts) as HTMLElement;
          vEl.style.width = curFmt.w + 'px';
          vEl.style.height = curFmt.h + 'px';
          const vWrap = document.createElement('div');
          vWrap.style.cssText = `position:fixed;top: 0;left: 0;width:${curFmt.w}px;height:${curFmt.h}px;opacity:0;pointer-events:none;overflow:visible;z-index:-1;`;
          vWrap.appendChild(vEl);
          document.body.appendChild(vWrap);
          for (const [cls, val] of Object.entries(blurMap)) {
            vEl.querySelectorAll('.' + cls).forEach((n) => {
              const h = n as HTMLElement; h.style.backdropFilter = val; h.style.setProperty('-webkit-backdrop-filter', val); h.style.transform = 'translateZ(0)';
            });
          }
          vEl.querySelectorAll('.tpl-overlay').forEach((n) => { (n as HTMLElement).style.opacity = String(oscuramento / 100); });
          await new Promise<void>(resolve => {
            const imgs = vEl.querySelectorAll('img');
            let pending = 0;
            imgs.forEach(img => { if (!img.complete) { pending++; img.onload = img.onerror = () => { if (--pending === 0) resolve(); }; } });
            if (pending === 0) resolve();
          });
          await new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)));
          const { blob: vblob, ext } = await exportStaticToVideo(vEl, { w: curFmt.w, h: curFmt.h }, {
            duration: 6, animStyle: animId, photoSrc: coverPhoto, fitCover: tplFitCover,
          });
          zip.file(`${tpl.id}/video-${animId}.${ext}`, vblob);
          count++;
          vWrap.remove();
        } catch (err) {
          console.error(`Export video ${tpl.id} failed:`, err);
        }
      }
      if (count === 0) {
        toast('Nessun template esportato', 'download');
        return;
      }
      const zipBlob = await zip.generateAsync({ type: 'blob', mimeType: 'application/zip' });
      const url = URL.createObjectURL(zipBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'templates.zip';
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 5000);
      toast(`${count} file esportati (immagini + video)`, 'download');
      setExporting(null);
      
      if (project) {
        const updates = {
          titolo: fields.titolo,
          addr: fields.indirizzo,
          prezzo: Number(String(fields.prezzo || '').replace(/\D/g, '')) || 0,
          mq: Number(String(fields.superficie || '').replace(/\D/g, '')) || 0,
          camere: Number(String(fields.camere || '').replace(/\D/g, '')) || 0,
          bagni: Number(String(fields.bagni || '').replace(/\D/g, '')) || 0,
          descrizione: fields.descrizione,
          nPost: (project.nPost || 0) + count,
        };
        try { localStorage.setItem('gnm_post_done_' + project.id, '1'); } catch { /* quota */ }
        updateProject(project.id, updates).catch(e => console.error("updateProject failed", e));
        onProjectUpdate?.(updates);
      }
    } catch (err) {
      console.error('Export ALL failed:', err);
      toast('Errore durante l\'esportazione', 'download');
      setExporting(null);
    }
  };

  const handleExportVideo = async () => {
    if (exporting) return;
    if (!(await gatePost())) return;
    setExporting('video');
    setExportProgress(0);
    const abort = new AbortController();
    exportAbortRef.current = abort;
    let cleanup: (() => void) | null = null;
    try {
      const mounted = await mountExportEl();
      cleanup = mounted.cleanup;
      const { blob, ext } = await exportStaticToVideo(mounted.tplEl, { w: curFmt.w, h: curFmt.h }, {
        duration: 15,
        animStyle,
        ...(isVideo ? { videoSrc: coverPhoto } : { photoSrc: coverPhoto }),
        fitCover,
        onProgress: (p: number) => setExportProgress(Math.round(p * 100)),
        signal: abort.signal,
        onOverlayCaptured: () => { cleanup?.(); cleanup = null; },
      });
      await downloadBlob(blob, 'social-post.' + ext);
      void trackExport({ export_type: 'post_video', width: curFmt.w, height: curFmt.h, format: `${curFmt.w}x${curFmt.h}`, template: tplId });
      toast('Video scaricato', 'download');
      // Chiudi il modal SUBITO dopo il download. Il salvataggio dati immobile e'
      // best-effort e NON deve bloccare la chiusura (se la rete stalla, prima il
      // modal restava appeso a 100% col video gia' scaricato).
      setShowAnimPicker(false);
      setExporting(null);
      if (project) {
        const updates = {
          titolo: fields.titolo,
          addr: fields.indirizzo,
          prezzo: Number(fields.prezzo.replace(/\D/g, '')) || 0,
          mq: Number(fields.superficie.replace(/\D/g, '')) || 0,
          camere: Number(fields.camere.replace(/\D/g, '')) || 0,
          bagni: Number(fields.bagni.replace(/\D/g, '')) || 0,
          descrizione: fields.descrizione,
          nPost: (project.nPost || 0) + 1,
        };
        try { localStorage.setItem('gnm_post_done_' + project.id, '1'); } catch { /* quota */ }
        updateProject(project.id, updates).then(() => onProjectUpdate?.(updates)).catch(() => {});
      }
    } catch (err: unknown) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        toast('Export annullato', 'download');
      } else {
        console.error('Export video failed:', err);
        toast('Errore durante il download', 'download');
      }
    } finally {
      cleanup?.();
      setExporting(null);
      setExportProgress(0);
      exportAbortRef.current = null;
    }
  };

  const plat = PS_PLATFORMS.find(p => p.id === platform)!;
  const formats = plat.formats;
  const curFmt = formats.find(f => f.id === formatId) ?? formats[0];
  const curTpl = TEMPLATES.find(t => t.id === tplId)!;
  const hasField = (f: string) => !curTpl.fields || curTpl.fields.includes(f);

  // Pubblica/Programma il post sui social: render -> upload media -> crea
  // scheduled_post (l'edge function publish-due-posts lo pubblica via cron).
  const publishFormat = (): 'feed' | 'story' | 'reel' | 'square' => {
    const id = curFmt.id || '';
    if (id.includes('story') || id.includes('stato')) return 'story';
    if (id.includes('reel') || id.includes('tt-video')) return 'reel';
    if (id.includes('quadrato')) return 'square';
    return isVideo ? 'reel' : 'feed';
  };
  const handlePublish = async () => {
    if (publishing) return;
    const platforms = (['instagram', 'facebook', 'tiktok'] as const).filter(p => pubPlatforms[p]);
    if (!platforms.length) { toast('Seleziona almeno una piattaforma', 'x'); return; }
    let scheduledAtIso: string;
    if (pubMode === 'schedule') {
      if (!pubDate) { toast('Scegli data e ora', 'x'); return; }
      const d = new Date(pubDate);
      if (isNaN(d.getTime()) || d.getTime() < Date.now() - 60_000) { toast('Scegli una data futura', 'x'); return; }
      scheduledAtIso = d.toISOString();
    } else {
      scheduledAtIso = new Date(Date.now() + 5_000).toISOString(); // "ora": il cron lo prende subito
    }
    if (!(await gatePost())) return;
    setPublishing(true);
    let cleanup: (() => void) | null = null;
    try {
      const FN = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/social-post-create`;
      const authH = { Authorization: `Bearer ${getTokenFast()}`, 'Content-Type': 'application/json' };
      const mounted = await mountExportEl();
      cleanup = mounted.cleanup;
      let blob: Blob; let mediaType: 'image' | 'video'; let mime: string;
      if (isVideo) {
        const r = await exportStaticToVideo(mounted.tplEl, { w: curFmt.w, h: curFmt.h }, { duration: 15, animStyle, videoSrc: coverPhoto, fitCover });
        blob = r.blob; mediaType = 'video'; mime = r.ext === 'webm' ? 'video/webm' : 'video/mp4';
      } else {
        blob = await exportToPng(mounted.tplEl, { w: curFmt.w, h: curFmt.h }, { photoSrc: coverPhoto, fitCover });
        mediaType = 'image'; mime = 'image/png';
      }
      cleanup?.(); cleanup = null;
      // 1) signed upload url
      const upRes = await fetch(FN, { method: 'POST', headers: authH, body: JSON.stringify({ mode: 'upload-url', media_type: mediaType, mime }) });
      const up = await upRes.json();
      if (!upRes.ok || !up.storagePath) throw new Error(up.error || 'upload-url failed');
      // 2) upload media
      const { error: upErr } = await supabase.storage.from('social-post-media').uploadToSignedUrl(up.storagePath, up.token, blob, { contentType: mime });
      if (upErr) throw new Error('upload failed: ' + upErr.message);
      // 3) create scheduled post
      const crRes = await fetch(FN, { method: 'POST', headers: authH, body: JSON.stringify({
        mode: 'create', storagePath: up.storagePath, media_type: mediaType, format: publishFormat(),
        platforms, caption, hashtags, first_comment: firstComment, scheduled_at: scheduledAtIso,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'Europe/Rome',
      }) });
      const cr = await crRes.json();
      if (!crRes.ok) {
        if (typeof cr.error === 'string' && cr.error.startsWith('Not connected')) { toast('Collega prima l\'account social', 'x'); return; }
        if (cr.error === 'ig_daily_limit') { toast(cr.message || 'Limite Instagram giornaliero raggiunto', 'x'); return; }
        throw new Error(cr.error || cr.message || 'create failed');
      }
      toast(pubMode === 'schedule' ? 'Post programmato' : 'Pubblicazione avviata', 'check');
      setStep(1);
    } catch (e) {
      console.error('publish error', e);
      toast('Errore durante la pubblicazione', 'x');
    } finally {
      cleanup?.();
      setPublishing(false);
    }
  };
  // fitCover (foto full screen) only meaningful for cover templates; non-cover
  // templates place the photo in a fixed shape (always object-fit: cover).
  const NO_COVER_TPL = ['arch', 'split', 'frame', 'spotlight', 'before-after', 'gallery', 'tips'];
  const supportsFitCover = !NO_COVER_TPL.includes(tplId);

  const setField = (k: string, v: string) => setFields(f => ({ ...f, [k]: v }));

  const stepTitles: Record<number, string> = { 1: 'Scegli un template', 3: 'Modifica post', 4: 'Pubblica' };
  const stepSubs: Record<number, string> = { 1: 'Seleziona lo stile del tuo post', 3: 'Personalizza e scarica il post', 4: 'Programma o pubblica subito il post' };

  const goStep = (n: number) => {
    setStep(n);
  };

  const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid var(--border-main)', borderRadius: 7, padding: '9px 11px', fontSize: 11.5, fontFamily: 'inherit', outline: 'none', background: 'var(--bg-card)' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 11, fontWeight: 700, marginBottom: 4.5 };
  const smallLabelStyle: React.CSSProperties = { display: 'block', fontSize: 10.5, fontWeight: 700, marginBottom: 4.5 };

  // Preview: fit to viewport height, reactive on resize
  const [winH, setWinH] = React.useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  const [winW, setWinW] = React.useState(typeof window !== 'undefined' ? window.innerWidth : 1280);
  const closeAllDropdowns = () => { setIconDropdown(null); setCurrencyDropdown(false); };

  // Keyboard navigation for templates
  React.useEffect(() => {
    if (step !== 3 || exporting) return;
    const handleKeyDown = (eb: KeyboardEvent) => {
      if (eb.key === 'ArrowLeft') {
        const i = TEMPLATES.findIndex(t => t.id === tplId);
        setTplId(TEMPLATES[(i - 1 + TEMPLATES.length) % TEMPLATES.length].id);
      } else if (eb.key === 'ArrowRight') {
        const i = TEMPLATES.findIndex(t => t.id === tplId);
        setTplId(TEMPLATES[(i + 1) % TEMPLATES.length].id);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [step, tplId, exporting]);
  React.useEffect(() => {
    const onResize = () => { setWinH(window.innerHeight); setWinW(window.innerWidth); };
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('resize', onResize); };
  }, []);
  React.useEffect(() => {
    if (document.getElementById('anim-prev-css')) return;
    const st = document.createElement('style');
    st.id = 'anim-prev-css';
    st.textContent = ANIM_CSS;
    document.head.appendChild(st);
  }, []);
  const maxPvH = winH - 180;
  const scaleByH = maxPvH / curFmt.h;
  const scaleByW = winW < 768 ? (winW - 32 - 92) / curFmt.w : Infinity;
  const pvScale = Math.min(0.55, scaleByH, scaleByW);
  const pvW = curFmt.w * pvScale;
  const pvH = curFmt.h * pvScale;

  return (
    <div className="max-md:!px-4 max-md:!pt-4 max-md:!pb-32" style={s('max-width:1240px;margin:0 auto;padding:29px 29px 58px')}>
      {/* header */}
      <div className="max-md:!gap-8" style={s('display:flex;align-items:center;gap:11px;margin-bottom:20px')}>
        {step > 1 && (
          <Box as="button" onClick={() => setStep(step === 3 ? 1 : step - 1)} style={s('border:1px solid var(--border-main);background:var(--bg-card);width:34px;height:34px;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center')} hover={s('background:var(--bg-hover)')}>
            <Icon name="arrow-left" size={14} color="var(--text-sec)" />
          </Box>
        )}
        <div style={s('flex:1;min-width:0')}>
          <h1 className="max-md:!text-xl" style={s('margin:0 0 4px;font-size:23px;font-weight:800;letter-spacing:-.5px')}>{stepTitles[step]}</h1>
          <div className="max-md:!text-xs" style={s('font-size:12px;color:var(--text-muted)')}>{stepSubs[step]} · passo {step === 1 ? 1 : step === 3 ? 2 : 3} di 3</div>
        </div>
        {!demoMode && postQuota && !postQuota.unlimited && (
          postQuota.remaining > 0 ? (
            <div style={s('display:inline-flex;align-items:center;justify-content:center;gap:7px;background:#fff;border:1px solid #f0ede7;border-radius:99px;padding:7px 14px;flex:none')}>
              <Icon name="megaphone" size={14} color="#3B83F6" />
              <span style={{ fontSize: 12, fontWeight: 700 }}>{postQuota.remaining} {postQuota.remaining === 1 ? 'post rimanente' : 'post rimanenti'}</span>
            </div>
          ) : (
            <Box as="button" onClick={() => go?.('account')} style={s('display:flex;align-items:center;gap:7px;background:#3B83F6;color:#fff;border:none;border-radius:9px;padding:8px 14px;font-size:12px;font-weight:700;cursor:pointer;flex:none') as React.CSSProperties} hover={s('background:#2b6fe0')}>
              <Icon name="crown" size={14} color="#fff" />Vedi i piani
            </Box>
          )
        )}
      </div>

      <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />

      {/* STEP 1: template selection */}
      {step === 1 && (
        <div className="max-md:!flex max-md:!flex-col max-md:!gap-4" style={{ display: 'grid', gridTemplateColumns: '180px 1fr', gap: 20, alignItems: 'start' }}>
          {/* Mobile: dropdown button for platform + format */}
          <div className="md:!hidden" style={{ position: 'relative', width: '100%' }}>
            <Box as="button" onClick={() => setPostFilterOpen(!postFilterOpen)} style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              padding: '9px 13px', borderRadius: 11, border: '1px solid var(--border-main)',
              background: 'var(--bg-card)', cursor: 'pointer', fontSize: 12, fontWeight: 700,
            } as React.CSSProperties} hover={{ background: 'var(--bg-hover)' }}>
              <span>{PS_PLATFORMS.find(p => p.id === platform)?.label} · {curFmt.label}</span>
              <Icon name="chevron-down" size={14} color="var(--text-muted)" />
            </Box>
            {postFilterOpen && (
              <>
                <div onClick={() => setPostFilterOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 11, boxShadow: '0 12px 32px rgba(0,0,0,.12)', padding: 7 }}>
                  {PS_PLATFORMS.map(pl => (
                    <Box key={pl.id} onClick={() => { setPlatform(pl.id); setFormatId(pl.formats[0].id); }} style={{
                      padding: '7px 11px', borderRadius: 7, cursor: 'pointer', fontSize: 12,
                      fontWeight: platform === pl.id ? 700 : 500,
                      color: platform === pl.id ? 'var(--text-main)' : 'var(--text-muted)',
                      background: platform === pl.id ? '#f1efe9' : 'transparent',
                    }} hover={{ background: '#f1efe9' }}>{pl.label}</Box>
                  ))}
                  <div style={{ height: 1, background: '#ece9e2', margin: '5px 0' }} />
                  {formats.map(f => (
                    <Box key={f.id} onClick={() => { setFormatId(f.id); setPostFilterOpen(false); }} style={{
                      borderWidth: 1, borderStyle: 'solid', borderColor: formatId === f.id ? '#3B83F6' : 'var(--border-main)',
                      background: formatId === f.id ? '#eef4fe' : 'var(--bg-card)',
                      color: formatId === f.id ? '#1d5fd0' : 'var(--text-sec)',
                      fontSize: 10.5, fontWeight: 700, padding: '7px 9px', borderRadius: 7, cursor: 'pointer', marginTop: 4,
                    }} hover={{ borderColor: '#3B83F6' }}>{f.label}</Box>
                  ))}
                </div>
              </>
            )}
          </div>
          {/* Desktop: sidebar */}
          <div className="max-md:!hidden" style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 22 }}>
            {PS_PLATFORMS.map(pl => (
              <Box key={pl.id} onClick={() => { setPlatform(pl.id); setFormatId(pl.formats[0].id); }} style={{
                padding: '9px 13px', borderRadius: 11, cursor: 'pointer', fontSize: 13,
                fontWeight: platform === pl.id ? 700 : 500,
                color: platform === pl.id ? 'var(--text-main)' : 'var(--text-muted)',
                background: platform === pl.id ? '#f1efe9' : 'transparent',
              }} hover={{ background: '#f1efe9' }}>{pl.label}</Box>
            ))}
            <div style={{ height: 1, background: '#ece9e2', margin: '7px 0' }} />
            {formats.map(f => (
              <Box key={f.id} onClick={() => setFormatId(f.id)} style={{
                borderWidth: 1, borderStyle: 'solid', borderColor: formatId === f.id ? '#3B83F6' : 'var(--border-main)',
                background: formatId === f.id ? '#eef4fe' : 'var(--bg-card)',
                color: formatId === f.id ? '#1d5fd0' : 'var(--text-sec)',
                fontSize: 10.5, fontWeight: 700, padding: '7px 9px', borderRadius: 7, cursor: 'pointer', minHeight: 34, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center',
              }} hover={{ borderColor: '#3B83F6' }}>{f.label}</Box>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
            {/* upload cover photo */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 11, padding: '11px 14px',
                background: 'var(--bg-card)', border: '1.5px dashed var(--border-dark)', borderRadius: 11,
                transition: 'border-color .15s',
                position: 'relative', width: '100%'
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#3B83F6')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-dark)')}
            >
              <div onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 11, cursor: 'pointer' }}>
                {coverPhoto !== DEFAULT_PHOTO ? (
                  <img src={coverPhoto} alt="" style={{ width: 43, height: 43, borderRadius: 7, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 43, height: 43, borderRadius: 7, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="upload" size={18} color="var(--text-muted)" />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)' }}>
                    {coverPhoto !== DEFAULT_PHOTO ? 'Cambia foto di sfondo' : 'Carica foto o video'}
                  </div>
                  <div style={{ fontSize: 10.5, color: 'var(--text-muted)' }}>JPG, PNG, WebP, MP4</div>
                </div>
              </div>
              {coverPhoto !== DEFAULT_PHOTO && (
                <div
                  onClick={(e) => { e.stopPropagation(); setCoverPhoto(DEFAULT_PHOTO); }}
                  style={{ width: 29, height: 29, borderRadius: 7, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#eeebe3')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg-hover)')}
                >
                  <Icon name="x" size={14} color="var(--text-muted)" />
                </div>
              )}
            </div>
            <div className="max-md:!grid-cols-1 max-md:![grid-template-columns:1fr]" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
            {TEMPLATES.map(tc => {
              const cardW = winW < 768 ? Math.min(winW - 32, 400) : (Math.min(winW, 1240) - 58 - 180 - 20 - 40) / 3;
              // Stesse opts del renderTemplateGrid dell'estensione: formato selezionato, loghi verticali default, foto primaria duplicata per multi-foto
              const tplOpts: Record<string, unknown> = {
                size: curFmt,
                isVideo,
                fitCover: NO_COVER_TPL.includes(tc.id) ? false : fitCover,
                ...buildLogoOpts(),
              };
              if (tc.multiPhoto) tplOpts.photos = getPhotosArray(tc);
              return (
                <div key={tc.id} onClick={() => { setTplId(tc.id); goStep(3); }} style={{
                  borderRadius: 13, overflow: 'hidden', cursor: 'pointer',
                  transition: 'transform .15s, box-shadow .15s',
                  transform: 'translateZ(0)',
                  boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.04)',
                }}>
                  <TemplatePreview
                    templateId={tc.id}
                    data={{
                      ...SAMPLE_TPL_DATA, accentColor,
                      title: fields.titolo || project?.nome || 'Titolo immobile',
                      type: fields.titolo || project?.nome || 'Tipologia',
                      address: fields.indirizzo || 'Indirizzo immobile',
                      price: fields.prezzo ? `${currency} ${fields.prezzo}` : '-',
                      surface: fields.superficie ? fields.superficie + ' m²' : '-',
                      surfaceNum: fields.superficie || '-',
                      bedrooms: fields.camere || '-',
                      bathrooms: fields.bagni || '-',
                      rooms: fields.camere || '-',
                      description: fields.descrizione || 'Aggiungi qui una breve descrizione accattivante per attrarre l\'attenzione dei potenziali acquirenti. Spiega i punti forti.',
                      ctaText: fields.btnTxt || 'Contattaci ora',
                      contract: showBadge ? (fields.badgeTxt || 'Nuovo') : '',
                      _icons: fieldIcons,
                    }}
                    photoUrl={coverPhoto}
                    width={cardW}
                    opts={tplOpts}
                  />
                </div>
              );
            })}
            </div>
          </div>
        </div>
      )}

      {/* STEP 3: edit post (skip step 2, dati vengono dal progetto attivo) */}
      {step === 3 && (
        <div className="max-md:!flex max-md:!flex-col max-md:!gap-6" style={{ display: 'grid', gridTemplateColumns: '1fr 324px', gap: 25, alignItems: 'start' }}>
          {(iconDropdown || currencyDropdown) && (
            <div onClick={closeAllDropdowns} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          )}
          {/* preview */}
          <div className="max-md:!static" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 9, position: 'sticky', top: 14 }}>
            {/* preview with arrows on sides */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
              <Box as="button" onClick={() => { const i = TEMPLATES.findIndex(t => t.id === tplId); setTplId(TEMPLATES[(i - 1 + TEMPLATES.length) % TEMPLATES.length].id); }} style={s('border:1px solid var(--border-main);background:var(--bg-card);width:31px;height:31px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none')} hover={s('background:var(--bg-hover)')}>
                <Icon name="arrow-left" size={13} color="var(--text-sec)" />
              </Box>
              <div ref={previewContainerRef} style={{ borderRadius: 11, overflow: 'hidden', boxShadow: '0 12px 36px rgba(33,31,28,.14)', position: 'relative' }}>
                {exporting && (
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 10, borderRadius: 11,
                    background: 'rgba(0,0,0,.45)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 13,
                  }}>
                    <div style={{
                      width: 32, height: 32, border: '3px solid rgba(255,255,255,.25)',
                      borderTopColor: 'var(--bg-card)', borderRadius: '50%',
                      animation: 'export-spin .8s linear infinite',
                    }} />
                    <span style={{ color: 'var(--bg-card)', fontSize: 12, fontWeight: 700 }}>
                      {exporting === 'image' ? 'Esportazione...' : `Esportazione video ${exportProgress}%`}
                    </span>
                  </div>
                )}
                <TemplatePreview
                  templateId={tplId}
                  data={{
                    ...SAMPLE_TPL_DATA, accentColor,
                    title: fields.titolo || project?.nome || '-',
                    type: fields.titolo || project?.nome || '-',
                    address: fields.indirizzo || '-',
                    price: fields.prezzo ? `${currency} ${fields.prezzo}` : '-',
                    surface: fields.superficie ? fields.superficie + ' m²' : '-',
                    surfaceNum: fields.superficie || '-',
                    bedrooms: fields.camere || '-',
                    bathrooms: fields.bagni || '-',
                    rooms: fields.camere || '-',
                    description: fields.descrizione || '-',
                    ctaText: fields.btnTxt || '-',
                    contract: showBadge ? (fields.badgeTxt || 'Nuovo') : '',
                    _icons: fieldIcons,
                  }}
                  photoUrl={coverPhoto}
                  width={pvW}
                  opts={{
                    size: curFmt,
                    dimAlpha: oscuramento / 100,
                    isVideo,
                    fitCover,
                    ...(showLogo ? buildLogoOpts() : {}),
                    ...(curTpl.multiPhoto ? { photos: getPhotosArray(curTpl) } : {}),
                  }}
                />
              </div>
              <Box as="button" onClick={() => { const i = TEMPLATES.findIndex(t => t.id === tplId); setTplId(TEMPLATES[(i + 1) % TEMPLATES.length].id); }} style={s('border:1px solid var(--border-main);background:var(--bg-card);width:31px;height:31px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none')} hover={s('background:var(--bg-hover)')}>
                <Icon name="arrow-right" size={13} color="var(--text-sec)" />
              </Box>
            </div>
          </div>
          {/* sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* info mini card */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 11, padding: '14px', display: 'flex', flexDirection: 'column', gap: 13 }}>
              {/* Mobile: dropdown for platform + format */}
              <div className="md:!hidden" style={{ position: 'relative' }}>
                <Box as="button" onClick={() => setPostFilterOpen(!postFilterOpen)} style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '9px 13px', borderRadius: 7, background: 'var(--bg-hover)', cursor: 'pointer', fontSize: 12, fontWeight: 700, border: 'none',
                } as React.CSSProperties} hover={{ background: '#eeebe3' }}>
                  <span>{PS_PLATFORMS.find(p => p.id === platform)?.label} · {curFmt.label}</span>
                  <Icon name="chevron-down" size={14} color="var(--text-muted)" />
                </Box>
                {postFilterOpen && (
                  <>
                    <div onClick={() => setPostFilterOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                    <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, marginTop: 4, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 11, boxShadow: '0 12px 32px rgba(0,0,0,.12)', padding: 7 }}>
                      {PS_PLATFORMS.map(pl => (
                        <Box key={pl.id} onClick={() => { setPlatform(pl.id); setFormatId(pl.formats[0].id); }} style={{
                          padding: '7px 11px', borderRadius: 7, cursor: 'pointer', fontSize: 12,
                          fontWeight: platform === pl.id ? 700 : 500,
                          color: platform === pl.id ? 'var(--text-main)' : 'var(--text-muted)',
                          background: platform === pl.id ? '#f1efe9' : 'transparent',
                        }} hover={{ background: '#f1efe9' }}>{pl.label}</Box>
                      ))}
                      <div style={{ height: 1, background: '#ece9e2', margin: '5px 0' }} />
                      {formats.map(f => (
                        <Box key={f.id} onClick={() => { setFormatId(f.id); setPostFilterOpen(false); }} style={{
                          borderWidth: 1, borderStyle: 'solid', borderColor: formatId === f.id ? '#3B83F6' : 'var(--border-main)',
                          background: formatId === f.id ? '#eef4fe' : 'var(--bg-card)',
                          color: formatId === f.id ? '#1d5fd0' : 'var(--text-sec)',
                          fontSize: 10.5, fontWeight: 700, padding: '7px 9px', borderRadius: 7, cursor: 'pointer', marginTop: 4,
                        }} hover={{ borderColor: '#3B83F6' }}>{f.label}</Box>
                      ))}
                    </div>
                  </>
                )}
              </div>
              {/* Desktop: platform tabs */}
              <div className="max-md:!hidden">
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Piattaforma</div>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-hover)', borderRadius: 7, padding: 3 }}>
                  {PS_PLATFORMS.map(pl => (
                    <div key={pl.id} onClick={() => { setPlatform(pl.id); setFormatId(pl.formats[0].id); }} style={{
                      flex: 1, textAlign: 'center', padding: '5px 0', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: platform === pl.id ? 'var(--bg-card)' : 'transparent',
                      color: platform === pl.id ? 'var(--text-main)' : 'var(--text-muted)',
                      boxShadow: platform === pl.id ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                      transition: 'all .15s',
                    }}>{pl.label}</div>
                  ))}
                </div>
              </div>
              {/* Desktop: format tabs */}
              <div className="max-md:!hidden">
                <div style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-muted)', marginBottom: 5 }}>Formato</div>
                <div style={{ display: 'flex', alignItems: 'center', background: 'var(--bg-hover)', borderRadius: 7, padding: 3 }}>
                  {formats.map(f => (
                    <div key={f.id} onClick={() => setFormatId(f.id)} style={{
                      flex: 1, textAlign: 'center', padding: '5px 0', borderRadius: 5, fontSize: 11, fontWeight: 600, cursor: 'pointer',
                      background: formatId === f.id ? 'var(--bg-card)' : 'transparent',
                      color: formatId === f.id ? '#1d5fd0' : 'var(--text-muted)',
                      boxShadow: formatId === f.id ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                      transition: 'all .15s',
                    }}>
                      {f.id.includes('post') ? 'Post' : f.id.includes('story') ? 'Story' : f.id.includes('reel') ? 'Reel' : f.label.split(' ').pop()}
                    </div>
                  ))}
                </div>
              </div>
              {/* template + size */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--bg-body)', paddingTop: 11 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-main)' }}>{curTpl.label}</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#b8b3a9', background: 'var(--bg-hover)', padding: '3px 7px', borderRadius: 4 }}>{curFmt.w} × {curFmt.h}</span>
              </div>
            </div>
            {/* photo upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 11, padding: '9px 13px',
                  background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 11,
                  cursor: 'pointer', transition: 'border-color .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#3B83F6')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
              >
                {coverPhoto !== DEFAULT_PHOTO ? (
                  isVideo
                    ? <div style={{ width: 40, height: 40, borderRadius: 7, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                        <img src={videoThumb || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#1a1825' }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(255,255,255,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 0, height: 0, borderLeft: '6px solid var(--text-main)', borderTop: '4px solid transparent', borderBottom: '4px solid transparent', marginLeft: 1 }} />
                          </div>
                        </div>
                      </div>
                    : <img src={coverPhoto} alt="" style={{ width: 40, height: 40, borderRadius: 7, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 40, height: 40, borderRadius: 7, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="upload" size={16} color="var(--text-muted)" />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-main)' }}>
                    {coverPhoto !== DEFAULT_PHOTO ? (isVideo ? 'Cambia video' : 'Cambia foto principale') : 'Carica foto o video'}
                  </div>
                  <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>JPG, PNG, WebP, MP4</div>
                </div>
                <Icon name="image" size={14} color="#b8b3a9" />
              </div>
              {curTpl.multiPhoto && Array.from({ length: curTpl.multiPhoto - 1 }, (_, i) => (
                <div key={`extra-${i}`}>
                  <input ref={el => { extraFileRefs.current[i] = el; }} type="file" accept="image/*,video/*" onChange={e => handleExtraPhoto(i, e)} style={{ display: 'none' }} />
                  <div
                    onClick={() => extraFileRefs.current[i]?.click()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 11, padding: '9px 13px',
                      background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 11,
                      cursor: 'pointer', transition: 'border-color .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#3B83F6')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = 'var(--border-light)')}
                  >
                    {extraPhotos[i] ? (
                      <img src={extraPhotos[i]} alt="" style={{ width: 40, height: 40, borderRadius: 7, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 40, height: 40, borderRadius: 7, background: 'var(--bg-hover)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="upload" size={16} color="var(--text-muted)" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-main)' }}>
                        {extraPhotos[i] ? `Cambia foto ${i + 2}` : `Carica foto ${i + 2}`}
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>JPG, PNG, WebP, MP4</div>
                    </div>
                    <Icon name="image" size={14} color="#b8b3a9" />
                  </div>
                </div>
              ))}
            </div>
            {/* fields card */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 11, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Dati immobile</div>
              {hasField('title') && <div><label style={labelStyle}>Titolo</label><input value={fields.titolo} onChange={e => setField('titolo', e.target.value)} placeholder="Es. Appartamento" style={inputStyle} /></div>}
              {hasField('address') && <div><label style={labelStyle}>Indirizzo</label><input value={fields.indirizzo} onChange={e => setField('indirizzo', e.target.value)} placeholder="Es. Milano, Porta Nuova" style={inputStyle} /></div>}
              {hasField('price') && <div style={{ position: 'relative' }}>
                <label style={labelStyle}>Prezzo</label>
                <div style={{ position: 'relative' }}>
                  <input value={fields.prezzo} onChange={e => { const n = e.target.value.replace(/\D/g, ''); setField('prezzo', n ? Number(n).toLocaleString('it-IT') : ''); }} inputMode="numeric" placeholder="250.000" style={{ ...inputStyle, paddingRight: 31 }} />
                  <div
                    onClick={() => { setIconDropdown(null); setCurrencyDropdown(!currencyDropdown); }}
                    style={{
                      position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                      width: 23, height: 23, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', border: '1px solid var(--border-main)', background: currencyDropdown ? 'var(--bg-hover)' : 'transparent',
                      color: 'var(--text-main)', transition: 'all .15s', fontSize: 12, fontWeight: 700,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B83F6'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-main)'; e.currentTarget.style.background = currencyDropdown ? 'var(--bg-hover)' : 'transparent'; }}
                  >
                    {currency}
                  </div>
                </div>
                {currencyDropdown && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4,
                    background: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 7,
                    boxShadow: '0 4px 12px rgba(0,0,0,.10)', padding: 4, display: 'flex', gap: 2,
                  }}>
                    {['€', '$', '£', 'CHF'].map(c => (
                      <div key={c} onClick={() => { setCurrency(c); setCurrencyDropdown(false); }} style={{
                        width: 32, height: 29, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: 13, fontWeight: 600,
                        border: currency === c ? '1.5px solid #3B83F6' : '1.5px solid transparent',
                        background: currency === c ? '#eef4fe' : 'transparent',
                        color: currency === c ? '#3B83F6' : '#6b7280', transition: 'all .15s',
                      }}
                        onMouseEnter={e => { if (currency !== c) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-main)'; } }}
                        onMouseLeave={e => { if (currency !== c) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; } }}
                      >{c}</div>
                    ))}
                  </div>
                )}
              </div>}
              {hasField('metrics') && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8 }}>
                {([
                  { field: 'surface', stateKey: 'superficie', label: 'Superficie', placeholder: '0' },
                  { field: 'bedrooms', stateKey: 'camere', label: 'Camere', placeholder: '0' },
                  { field: 'bathrooms', stateKey: 'bagni', label: 'Bagni', placeholder: '0' },
                ] as const).map(m => {
                  const iconKey = fieldIcons[m.field];
                  return (
                    <div key={m.field} style={{ position: 'relative' }}>
                      <label style={smallLabelStyle as React.CSSProperties}>{PICKER_ICONS.find(pi => pi.key === fieldIcons[m.field])?.label || m.label}</label>
                      <div style={{ position: 'relative' }}>
                        <input value={fields[m.stateKey]} onChange={e => setField(m.stateKey, e.target.value)} placeholder={m.placeholder} style={{ ...inputStyle, paddingRight: 31 }} />
                        <div
                          onClick={() => { setCurrencyDropdown(false); setIconDropdown(iconDropdown === m.field ? null : m.field); }}
                          style={{
                            position: 'absolute', right: 4, top: '50%', transform: 'translateY(-50%)',
                            width: 23, height: 23, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', border: '1px solid var(--border-main)', background: iconDropdown === m.field ? 'var(--bg-hover)' : 'transparent',
                            color: 'var(--text-main)', transition: 'all .15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B83F6'; e.currentTarget.style.background = 'var(--bg-hover)'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-main)'; e.currentTarget.style.background = iconDropdown === m.field ? 'var(--bg-hover)' : 'transparent'; }}
                        >
                          <div style={{ width: 13, height: 13 }} dangerouslySetInnerHTML={{ __html: ((TPL_ICONS as Record<string, string>)[iconKey] || '').replace(/<svg /, '<svg width="14" height="14" style="display:block" ') }} />
                        </div>
                      </div>
                      {iconDropdown === m.field && (
                        <div style={{
                          position: 'absolute', top: '100%', right: 0, zIndex: 50,
                          background: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 7,
                          boxShadow: '0 4px 12px rgba(0,0,0,.10)',
                          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, padding: 5, marginTop: 4,
                        }}>
                          {PICKER_ICONS.map(pi => (
                            <div key={pi.key} onClick={() => { setFieldIcons(prev => ({ ...prev, [m.field]: pi.key })); setIconDropdown(null); }} style={{
                              width: 27, height: 27, borderRadius: 5, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', border: fieldIcons[m.field] === pi.key ? '1.5px solid #3B83F6' : '1.5px solid transparent',
                              background: fieldIcons[m.field] === pi.key ? '#eef4fe' : 'transparent',
                              color: fieldIcons[m.field] === pi.key ? '#3B83F6' : '#6b7280',
                              transition: 'all .15s',
                            }}
                              onMouseEnter={e => { if (fieldIcons[m.field] !== pi.key) { e.currentTarget.style.background = 'var(--bg-hover)'; e.currentTarget.style.color = 'var(--text-main)'; } }}
                              onMouseLeave={e => { if (fieldIcons[m.field] !== pi.key) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; } }}
                            >
                              <span style={{ width: 14, height: 14, display: 'block' }} dangerouslySetInnerHTML={{ __html: ((TPL_ICONS as Record<string, string>)[pi.key] || '').replace('<svg ', '<svg width="16" height="16" ') }} />
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>}
              {hasField('description') && <div><label style={labelStyle}>Descrizione</label><textarea value={fields.descrizione} onChange={e => setField('descrizione', e.target.value)} rows={2} placeholder="Informazioni sull'immobile..." style={{ ...inputStyle, lineHeight: 1.5 }} /></div>}
            </div>
            {/* style card */}
            <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 11, padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 11 }}>
              <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Stile</div>
              {/* logo toggle */}
              <div style={s('display:flex;align-items:center;justify-content:space-between')}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Logo</span>
                <div onClick={() => setShowLogo(!showLogo)} style={{ width: 36, height: 22, borderRadius: 89, background: showLogo ? '#3B83F6' : 'var(--border-dark)', position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
                  <span style={{ position: 'absolute', top: 3, left: showLogo ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
                </div>
              </div>
              {/* logo variant picker — only when logos are loaded in Brand */}
              {showLogo && BRAND_LOGO_KEYS.some(k => allBrandLogos[k]) && (() => {
                const opts = [{ key: 'auto', label: 'Logo automatico', src: null as string | null }, ...BRAND_LOGO_KEYS.filter(k => allBrandLogos[k]).map(k => ({ key: k as string, label: LOGO_VARIANT_LABELS[k], src: allBrandLogos[k] }))];
                const cur = opts.find(o => o.key === selectedLogoKey) || opts[0];
                const thumbBg = (key: string) => key.startsWith('white') ? 'var(--text-main)' : 'var(--bg-hover)';
                return (
                  <>
                    <div style={{ position: 'relative' }}>
                      <Box as="button" onClick={() => setLogoMenuOpen(o => !o)} style={{
                        width: '100%', border: '1px solid var(--border-main)', borderRadius: 9, padding: '7px 11px',
                        fontSize: 12, fontWeight: 600, background: 'var(--bg-card)', cursor: 'pointer', color: 'var(--text-main)',
                        display: 'flex', alignItems: 'center', gap: 9, minHeight: 36,
                      }} hover={{ background: '#faf9f7' }}>
                        {cur.src && (
                          <span style={{ width: 25, height: 18, borderRadius: 4, background: thumbBg(cur.key), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', overflow: 'hidden' }}>
                            <img src={cur.src} alt="" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                          </span>
                        )}
                        <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cur.label}</span>
                        <Icon name="chevron-down" size={14} color="var(--text-muted)" />
                      </Box>
                      {logoMenuOpen && (
                        <>
                          <div onClick={() => setLogoMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                          <div style={{
                            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                            background: 'var(--bg-card)', border: '1px solid var(--border-main)', borderRadius: 9,
                            boxShadow: '0 8px 24px rgba(33,31,28,.12)', padding: 4, maxHeight: 252, overflowY: 'auto',
                          }}>
                            {opts.map(o => (
                              <div key={o.key} onClick={() => { setSelectedLogoKey(o.key); setLogoMenuOpen(false); }} style={{
                                display: 'flex', alignItems: 'center', gap: 9, padding: '7px 9px', borderRadius: 6, cursor: 'pointer',
                                background: o.key === selectedLogoKey ? '#eef4fe' : 'transparent',
                              }}
                                onMouseEnter={e => { if (o.key !== selectedLogoKey) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                                onMouseLeave={e => { if (o.key !== selectedLogoKey) e.currentTarget.style.background = 'transparent'; }}
                              >
                                {o.src ? (
                                  <span style={{ width: 29, height: 20, borderRadius: 4, background: thumbBg(o.key), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', overflow: 'hidden' }}>
                                    <img src={o.src} alt="" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                                  </span>
                                ) : (
                                  <span style={{ width: 29, height: 20, borderRadius: 4, background: 'var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                                    <Icon name="sparkles" size={12} color="var(--text-muted)" />
                                  </span>
                                )}
                                <span style={{ fontSize: 12, fontWeight: o.key === selectedLogoKey ? 700 : 500, color: 'var(--text-main)' }}>{o.label}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <div style={{ height: 1, background: 'var(--border-light)', margin: '4px 0' }} />
                  </>
                );
              })()}
              {/* fit cover toggle */}
              {supportsFitCover && (
              <>
              <div style={s('display:flex;align-items:center;justify-content:space-between')}>
                <span style={{ fontSize: 12, fontWeight: 600 }}>Foto full screen</span>
                <div onClick={() => setFitCover(!fitCover)} style={{ width: 36, height: 22, borderRadius: 89, background: fitCover ? '#3B83F6' : 'var(--border-dark)', position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
                  <span style={{ position: 'absolute', top: 3, left: fitCover ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
                </div>
              </div>
              <div style={{ height: 1, background: 'var(--border-light)', margin: '4px 0' }} />
              </>
              )}
              {/* badge toggle */}
              {hasField('badge') && <div>
                <div style={s('display:flex;align-items:center;justify-content:space-between')}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Badge</span>
                  <div onClick={() => setShowBadge(!showBadge)} style={{ width: 36, height: 22, borderRadius: 89, background: showBadge ? '#3B83F6' : 'var(--border-dark)', position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
                    <span style={{ position: 'absolute', top: 3, left: showBadge ? 19 : 3, width: 16, height: 16, borderRadius: '50%', background: 'var(--bg-card)', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
                  </div>
                </div>
                {showBadge && <input value={fields.badgeTxt} onChange={e => setField('badgeTxt', e.target.value)} placeholder="Es. Nuovo" style={{ ...inputStyle, marginTop: 7 }} />}
              </div>}
              <div style={{ height: 1, background: 'var(--border-light)', marginTop: 4, marginBottom: 4 }} />
              {/* oscuramento */}
              <div>
                <div style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:5px')}>
                  <span style={{ fontSize: 12, fontWeight: 600 }}>Oscuramento</span>
                  <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)' }}>{oscuramento}%</span>
                </div>
                <input type="range" min={0} max={100} value={oscuramento} onChange={e => setOscuramento(+e.target.value)} style={{ width: '100%', accentColor: '#3B83F6' }} />
              </div>
              {curTpl.hasBtn && <div><label style={labelStyle}>Testo pulsante</label><input value={fields.btnTxt} onChange={e => setField('btnTxt', e.target.value)} placeholder="Es. Contattaci ora" style={inputStyle} /></div>}
            </div>
            {/* actions */}
            {(() => {
              const noPhoto = coverPhoto === DEFAULT_PHOTO;
              const needExtra = curTpl.multiPhoto ? curTpl.multiPhoto - 1 : 0;
              const missingExtra = needExtra > 0 && extraPhotos.filter(Boolean).length < needExtra;
              const dis = !!exporting || noPhoto || missingExtra;
              // Image exports are blocked when a video cover is uploaded.
              const disImg = dis || isVideo;
              const tip = noPhoto ? 'Carica una foto per esportare' : missingExtra ? `Carica tutte le ${curTpl.multiPhoto} foto per esportare` : isVideo ? 'Hai caricato un video: scarica il video' : undefined;
              return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 9 }}>
              {!demoMode && postQuota && !postQuota.unlimited && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5, fontSize: 11, fontWeight: 700, color: postQuota.remaining > 0 ? 'var(--text-muted)' : '#dc2626' }}>
                  <Icon name="megaphone" size={12} color={postQuota.remaining > 0 ? 'var(--text-muted)' : '#dc2626'} />
                  {postQuota.remaining > 0 ? `${postQuota.remaining} post gratis rimasti` : 'Post gratis esauriti'}
                </div>
              )}
              <Box as="button" title={tip} onClick={() => { if (!disImg) handleExportImage(); }} style={{ border: '1px solid var(--border-main)', background: 'var(--bg-card)', fontSize: 12, fontWeight: 700, padding: '11px 14px', borderRadius: 9, cursor: disImg ? 'default' : 'pointer', minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: disImg ? 0.4 : 1 }} hover={disImg ? {} : { background: 'var(--bg-hover)' }}>
                <Icon name="download" size={14} color="var(--text-sec)" />{exporting === 'image' ? 'Esportazione...' : 'Scarica immagine'}
              </Box>
              <Box as="button" title={tip} onClick={() => { if (!dis) setShowAnimPicker(true); }} style={{ border: '1px solid var(--border-main)', background: 'var(--bg-card)', fontSize: 12, fontWeight: 700, padding: '11px 14px', borderRadius: 9, cursor: dis ? 'default' : 'pointer', minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: dis ? 0.4 : 1 }} hover={dis ? {} : { background: 'var(--bg-hover)' }}>
                <Icon name="film" size={14} color="var(--text-sec)" />Scarica video
              </Box>
              <Box as="button" title={tip} onClick={() => { if (!disImg) handleExportAll(); }} style={{ border: '1px dashed var(--border-dark)', background: 'transparent', fontSize: 11, fontWeight: 600, padding: '9px 14px', borderRadius: 9, cursor: disImg ? 'default' : 'pointer', minHeight: 34, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: disImg ? 0.4 : 1, color: 'var(--text-muted)' }} hover={disImg ? {} : { background: 'var(--bg-hover)', color: 'var(--text-sec)' }}>
                <Icon name="layers" size={13} color="var(--text-muted)" />{exporting === 'image' ? 'Esportazione...' : `Scarica tutti (${TEMPLATES.length})`}
              </Box>
            </div>
            ); })()}
          </div>
        </div>
      )}

      {/* Animation picker modal */}
      {(showAnimPicker || exporting === 'video') && (
        <div onClick={() => { if (exporting !== 'video') setShowAnimPicker(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', borderRadius: 18, padding: '25px 25px 22px', width: 'min(520px, 92vw)', boxShadow: '0 24px 64px rgba(0,0,0,.22)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 14 }}>
              <div>
                <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>{exporting === 'video' ? 'Generazione video' : 'Stile animazione'}</div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>{exporting === 'video' ? 'Attendi, stiamo creando il tuo video' : 'Scegli come appaiono gli elementi nel video'}</div>
              </div>
              <button onClick={() => { if (exporting === 'video') exportAbortRef.current?.abort(); else setShowAnimPicker(false); }} style={{ border: 'none', background: 'var(--bg-hover)', borderRadius: 7, width: 29, height: 29, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }} title={exporting === 'video' ? 'Annulla' : 'Chiudi'}>
                <Icon name="x" size={14} color="var(--text-sec)" />
              </button>
            </div>
            {exporting === 'video' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '13px 0 23px' }}>
                {/* Loader blob come Video AI */}
                <div style={{ position: 'relative', width: 108, height: 108, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 5 }}>
                  <div style={{ position: 'absolute', width: 99, height: 99, borderRadius: '50%', border: '1.5px solid rgba(59,131,246,.20)', animation: 'pulse-ring 2.8s ease-out infinite' }} />
                  <div style={{ position: 'absolute', width: 99, height: 99, borderRadius: '50%', border: '1.5px solid rgba(59,131,246,.20)', animation: 'pulse-ring 2.8s ease-out infinite', animationDelay: '1.4s' }} />
                  <div style={{ position: 'absolute', width: 65, height: 65, background: 'radial-gradient(circle at 30% 26%, #AECBFF 0%, #3B83F6 46%, #5B6CF0 100%)', opacity: .95, boxShadow: '0 0 30px rgba(91,108,240,.45), 0 0 14px rgba(59,131,246,.55)', animation: 'organic-blob 8s ease-in-out infinite' }} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/dashboard/logo-mark-white.svg" alt="" style={{ position: 'relative', width: 50, height: 50, animation: 'aurora-pulse 4s ease-in-out infinite' }} />
                </div>
                <span style={{ fontSize: 29, fontWeight: 800, color: 'var(--text-main)', lineHeight: 1 }}>{exportProgress}%</span>
                <span style={{ fontSize: 10, fontWeight: 600, color: '#b3aca1', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.06em' }}>Rendering</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 9, marginBottom: 22 }}>
                {ANIM_STYLES.map(a => {
                  const sel = animStyle === a.id;
                  return (
                    <div key={a.id} onClick={() => setAnimStyle(a.id)} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 7, padding: '13px 5px 9px',
                      borderRadius: 11, cursor: 'pointer',
                      border: sel ? '2px solid #3B83F6' : '2px solid transparent',
                      background: sel ? '#eef4fe' : 'var(--bg-hover)',
                      transition: 'all .15s',
                    }}
                      onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#ece9e2'; }}
                      onMouseLeave={e => { if (!sel) e.currentTarget.style.background = 'var(--bg-hover)'; }}
                    >
                      <div className={`acp--${a.id}`} style={{ width: 61, height: 86, borderRadius: 7, background: 'linear-gradient(145deg, #2a2733, #1a1825)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                        <div className="aw aw-badge" />
                        <div className="aw aw-price" />
                        <div className="aw aw-title" />
                        <div className="aw aw-addr" />
                        <div className="aw aw-m1" />
                        <div className="aw aw-m2" />
                        <div className="aw aw-m3" />
                        <div className="aw aw-desc" />
                      </div>
                      <span style={{ fontSize: 10, fontWeight: 600, color: sel ? '#1d5fd0' : 'var(--text-sec)' }}>{a.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {exporting !== 'video' && (
              <Box as="button" onClick={() => handleExportVideo()} style={{ border: '2px solid transparent', background: '#3B83F6', color: 'var(--bg-card)', fontSize: 13, fontWeight: 700, padding: '12px 14px', borderRadius: 11, cursor: 'pointer', minHeight: 40, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 }} hover={{ background: '#2b6fe0', color: 'var(--bg-card)' }}>
                <Icon name="download" size={14} color="currentColor" />Scarica video
              </Box>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: publish */}
      {step === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '288px 1fr', gap: 22, alignItems: 'start', maxWidth: 882 }}>
          {/* preview thumb */}
          <div style={s('display:flex;flex-direction:column;align-items:center;gap: 8px')}>
            <div style={{ width: 216, aspectRatio: '4/5', borderRadius: 14, overflow: 'hidden', boxShadow: '0 10px 28px rgba(33,31,28,.12)', display: 'flex', flexDirection: 'column', background: 'var(--bg-card)' }}>
              <div style={{ flex: 1, background: 'url(https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=500&fit=crop) center/cover' }} />
              <div style={{ flex: 'none', background: 'linear-gradient(0deg, rgba(20,18,15,.92), rgba(20,18,15,.78))', padding: '9px 11px' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--bg-card)' }}>{fields.titolo || 'Appartamento'}</div>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-muted)' }}>{curFmt.label}</span>
          </div>
          {/* publish form */}
          <div style={s('background:var(--bg-card);border:1px solid var(--border-light);border-radius:11px;padding: 18px;display:flex;flex-direction:column;gap: 13px')}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 7 }}>Piattaforme</div>
              <div style={s('display:flex;gap: 6px')}>
                {(['instagram', 'facebook', 'tiktok'] as const).map(pp => (
                  <Box as="button" key={pp} onClick={() => setPubPlatforms(p => ({ ...p, [pp]: !p[pp] }))} style={{
                    border: `1px solid ${pubPlatforms[pp] ? '#3B83F6' : 'var(--border-main)'}`,
                    background: pubPlatforms[pp] ? '#eef4fe' : 'var(--bg-card)',
                    color: pubPlatforms[pp] ? '#1d5fd0' : 'var(--text-sec)',
                    fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 7, cursor: 'pointer', minHeight: 34,
                    textTransform: 'capitalize',
                  }} hover={{ borderColor: '#3B83F6' }}>{pp}</Box>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, marginBottom: 7 }}>Quando</div>
              <div style={s('display:flex;gap: 6px')}>
                {(['schedule', 'now'] as const).map(m => (
                  <Box as="button" key={m} onClick={() => setPubMode(m)} style={{
                    border: `1px solid ${pubMode === m ? '#3B83F6' : 'var(--border-main)'}`,
                    background: pubMode === m ? '#eef4fe' : 'var(--bg-card)',
                    color: pubMode === m ? '#1d5fd0' : 'var(--text-sec)',
                    fontSize: 12, fontWeight: 700, padding: '8px 16px', borderRadius: 7, cursor: 'pointer', minHeight: 34,
                  }} hover={{ borderColor: '#3B83F6' }}>{m === 'schedule' ? 'Programma' : 'Pubblica ora'}</Box>
                ))}
              </div>
            </div>
            {pubMode === 'schedule' && (
              <div>
                <label style={labelStyle}>Data e ora</label>
                <input type="datetime-local" value={pubDate} onChange={e => setPubDate(e.target.value)} style={inputStyle} />
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>Instagram consente di programmare fino a 75 giorni in anticipo.</div>
              </div>
            )}
            <div>
              <div style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:4px')}>
                <label style={{ fontSize: 11, fontWeight: 700 }}>Caption</label>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)' }}>{caption.length}/2200</span>
              </div>
              <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={3} maxLength={2200} placeholder="Descrizione del post..." style={{ ...inputStyle, lineHeight: 1.5 }} />
            </div>
            <div><label style={labelStyle}>Hashtags</label><input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#immobiliare #casainvendita" style={inputStyle} /></div>
            <div><label style={labelStyle}>Primo commento (opzionale)</label><input value={firstComment} onChange={e => setFirstComment(e.target.value)} placeholder="Commento automatico dopo la pubblicazione..." style={inputStyle} /></div>
            <Box as="button" onClick={handlePublish} disabled={publishing} style={s('border:none;background:#3B83F6;color:var(--bg-card);font-size:12px;font-weight:700;padding: 10px 14px;border-radius:7px;cursor:' + (publishing ? 'default' : 'pointer') + ';min-height:38px;margin-top:4px;opacity:' + (publishing ? 0.6 : 1))} hover={publishing ? undefined : s('background:#2b6fe0')}>
              {publishing ? 'Pubblicazione…' : (pubMode === 'schedule' ? 'Programma' : 'Pubblica ora')}
            </Box>
          </div>
        </div>
      )}
      {postsPaywallOpen && (
        <div onClick={() => setPostsPaywallOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(24,21,17,.55)', backdropFilter: 'blur(4px)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 22 }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'var(--bg-card)', borderRadius: 18, maxWidth: 378, width: '100%', padding: '29px 25px', textAlign: 'center', boxShadow: '0 24px 64px rgba(0,0,0,.18)' }}>
            <div style={{ width: 50, height: 50, borderRadius: 14, background: '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 18px' }}>
              <Icon name="megaphone" size={23} color="#3B83F6" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, marginBottom: 5 }}>Hai esaurito i post gratis</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: 20 }}>Passa a un piano per creare post social illimitati per i tuoi annunci.</div>
            <Box as="button" onClick={() => { setPostsPaywallOpen(false); go?.('account'); }} style={s('display:block;width:100%;border:none;background:#3B83F6;color:var(--bg-card);font-size:13px;font-weight:700;padding: 11px 14px;border-radius:11px;cursor:pointer;min-height:41px')} hover={s('background:#2b6fe0')}>
              Vedi i piani
            </Box>
            <Box as="button" onClick={() => setPostsPaywallOpen(false)} style={s('display:block;margin: 8px auto 0;border:none;background:transparent;color:var(--text-muted);font-size:12px;font-weight:600;cursor:pointer')} hover={{ color: 'var(--text-sec)' }}>
              Chiudi
            </Box>
          </div>
        </div>
      )}
    </div>
  );
}

/* ───── ACCOUNT / PIANO SCREEN ───── */
function UsageBar({ label, used, total, color }: { label: string; used: number; total: number; color: string }) {
  const pct = Math.min((used / total) * 100, 100);
  return (
    <div style={s('flex:1;min-width:0')}>
      <div style={s('display:flex;align-items:baseline;justify-content:space-between;margin-bottom:5px')}>
        <span style={s('font-size:12px;font-weight:700;color:var(--text-main)')}>{label}</span>
        <span style={s('font-size:11px;font-weight:700;color:var(--text-muted)')}>{used} / {total}</span>
      </div>
      <div style={{ height: 5, background: 'var(--border-light)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 3, transition: 'width .4s ease' }} />
      </div>
    </div>
  );
}

function AccountScreen({ credits, toast, go, userData, tierHint }: { credits: number; toast: (msg: string, icon?: string) => void; go: (r: string) => void; userData: UserData | null; tierHint?: PlanTier | null }) {
  // Free e' un tier reale: 'free'/null -> piano Free. I paganti -> ind_/agy_.
  const activePlan = userData?.subscriptionType ? (SUB_TYPE_TO_PLAN[userData.subscriptionType] ?? 'free') : 'free';
  const currentPlan = ALL_PLANS.find(p => p.id === activePlan) ?? FREE_PLAN;
  const isFree = currentPlan.id === 'free';
  // Toggle Individuale/Agenzia: default sul tier del piano attivo, o hint da navigazione.
  const [tier, setTier] = useState<PlanTier>(tierHint ?? (isAgencyTier(userData?.subscriptionType) ? 'agency' : 'individual'));
  useEffect(() => { if (tierHint) setTier(tierHint); }, [tierHint]);
  const plans = PLANS_BY_TIER[tier].filter(p => !p.hidden);
  // Agenzia seat-based: slider utenti condiviso (2-10), quote 400 foto + 2,4 video/utente.
  const [seats, setSeats] = useState(2);
  // ⟦N⟧ marca i numeri sostituiti dallo slider, resi in semibold nel render
  // (renderSeatFeature) cosi' si nota subito che sono cambiati.
  const seatMark = (n: number) => (seats > 2 ? `⟦${n}⟧` : String(n));
  const seatTok = (f: string) => f
    .replace('{users}', seatMark(seats))
    .replace('{photos}', seatMark(400 * seats))
    .replace('{videos}', seatMark(Math.round(2.4 * seats)));
  const renderSeatFeature = (f: string) =>
    f.split(/⟦(\d+)⟧/).map((part, i) => (i % 2 === 1 ? <strong key={i} style={{ fontWeight: 700 }}>{part}</strong> : part));
  const seatCheckout = async (planId: string) => {
    try {
      // Fetch diretto con token da getSession (auto-refresh incluso).
      // Niente supabase.functions.invoke (deadlock storico, vedi aiVideo.ts) e
      // niente token raw da localStorage (se scaduto il refresh manuale fallisce).
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) throw new Error('no session');
      const resp = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/create-checkout-session`, {
        method: 'POST',
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string,
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          packageId: planId === 'agy_annual' ? 'agency-seat-annual' : 'agency-seat-monthly',
          seats,
          successUrl: 'https://www.getnearme.it/dashboard?checkout=success',
          cancelUrl: 'https://www.getnearme.it/dashboard',
        }),
      });
      const data = await resp.json().catch(() => null);
      if (!resp.ok || !data?.url) throw new Error(data?.error || `HTTP ${resp.status}`);
      window.open(data.url, '_blank');
    } catch (e) {
      console.error('seat checkout error:', e);
      toast('Errore nella creazione del pagamento, riprova', 'x');
    }
  };

  return (
    <div style={s('max-width:1044px;margin: 0 auto;padding: 26px 29px 58px')}>
      {/* header */}
      <div className="max-md:!flex-col max-md:!items-start" style={s('display:flex;align-items:center;justify-content:space-between;gap: 16px;margin-bottom:22px')}>
        <div>
          <h1 style={s('margin: 0 0 4px;font-size:22px;font-weight:800;letter-spacing:-.5px')}>Piano</h1>
          <div style={s('color:var(--text-muted);font-size:13px')}>Gestisci il tuo abbonamento.</div>
        </div>
        {!isFree && (
          <Box as="button" onClick={async () => {
            // Apre il Billing Portal Stripe DIRETTO (no re-login): crea una
            // portal session server-side col customer dell'utente. Fallback al
            // link generico se non c'e' customer/errore.
            try {
              const token = getTokenFast();
              const res = await fetch('/api/billing-portal', { method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ returnUrl: window.location.href }) });
              const d = await res.json();
              if (res.ok && d.url) { window.open(d.url, '_blank'); return; }
              if (d.error === 'no_customer') { toast('Nessun abbonamento attivo da gestire', 'x'); return; }
            } catch { /* fallback */ }
            window.open(STRIPE_BILLING_PORTAL, '_blank');
          }} className="max-md:!w-full" style={s('border:1px solid var(--border-main);background:var(--bg-card);font-size:12px;font-weight:700;padding: 8px 16px;border-radius:9px;cursor:pointer;min-height:40px;white-space:nowrap;flex:none')} hover={s('background:var(--bg-hover)')}>Gestisci piano</Box>
        )}
      </div>

      {/* ── PLAN CARDS ── */}
      <div style={s('margin-bottom:18px')}>
        <div style={s('display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap: 10px;margin-bottom:13px')}>
          <div style={s('font-size:14px;font-weight:800;letter-spacing:-.2px')}>Confronta i piani</div>
          {/* Toggle Individuale / Agenzia */}
          <div style={{ display: 'inline-flex', background: 'var(--bg-hover)', border: '1px solid var(--border-light)', borderRadius: 11, padding: 3 }}>
            {(['individual', 'agency'] as PlanTier[]).map((t) => {
              const on = tier === t;
              return (
                <button key={t} onClick={() => setTier(t)} style={{
                  border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700,
                  padding: '7px 16px', borderRadius: 8,
                  background: on ? 'var(--bg-card)' : 'transparent',
                  color: on ? '#3B83F6' : 'var(--text-muted)',
                  boxShadow: on ? '0 1px 3px rgba(0,0,0,.08)' : 'none', transition: 'all .15s',
                }}>{t === 'individual' ? 'Individuale' : 'Agenzia'}</button>
              );
            })}
          </div>
        </div>
        <div className="max-md:!grid-cols-1 max-md:!gap-8" style={s('display:grid;grid-template-columns:repeat(3,1fr);gap: 16px;align-items:stretch;margin-top:36px')}>
          {plans.map((plan) => {
            const active = plan.id === activePlan;
            const isSeat = plan.id === 'agy_monthly' || plan.id === 'agy_annual';
            const shownFeatures = isSeat ? plan.features.map(seatTok) : plan.features;
            // Seat-based: prezzo grande = totale (per-utente × N), niente nota; period
            // senza "a utente" (primo token = "/mese").
            const shownPrice = isSeat ? plan.price * seats : plan.price;
            const shownPeriod = isSeat ? plan.period.split(' ')[0] : plan.period;
            const shownNote = isSeat ? null : plan.note;
            return (
              <Box key={plan.id} style={{
                background: active ? '#3B83F6' : 'var(--bg-card)',
                border: active ? '2px solid #3B83F6' : '1.5px solid #ece9e2',
                borderRadius: 14,
                padding: '29px 25px 25px',
                cursor: 'pointer',
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform .25s cubic-bezier(.4,0,.2,1), box-shadow .25s cubic-bezier(.4,0,.2,1)',
                boxShadow: active ? '0 16px 48px rgba(59,131,246,.28), 0 4px 12px rgba(59,131,246,.12)' : '0 1px 3px rgba(33,31,28,.04)',
                transform: active ? 'scale(1.02)' : 'scale(1)',
              }} hover={{
                transform: active ? 'scale(1.02) translateY(-3px)' : 'translateY(-3px)',
                boxShadow: active ? '0 20px 56px rgba(59,131,246,.32), 0 6px 16px rgba(59,131,246,.14)' : '0 12px 36px rgba(33,31,28,.10)',
              }}>
                {plan.badge && (
                  <span style={{
                    position: 'absolute', top: -11, left: '50%', transform: 'translateX(-50%)',
                    fontSize: 9.5, fontWeight: 800, padding: '4px 14px', borderRadius: 18,
                    whiteSpace: 'nowrap', letterSpacing: '.04em', textTransform: 'uppercase',
                    background: active ? 'var(--bg-card)' : 'var(--text-main)', color: active ? '#3B83F6' : 'var(--bg-card)',
                    boxShadow: '0 2px 8px rgba(33,31,28,.12)',
                  }}>{plan.badge}</span>
                )}

                <div style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:5px')}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: active ? 'rgba(255,255,255,.85)' : 'var(--text-muted)', letterSpacing: '.02em', textTransform: 'uppercase' }}>{plan.name}</span>
                  {active && <span style={{ fontSize: 10, fontWeight: 800, background: 'rgba(255,255,255,.2)', color: 'var(--bg-card)', padding: '4px 13px', borderRadius: 18, letterSpacing: '.03em' }}>ATTIVO</span>}
                </div>

                {(() => {
                  return (
                    <>
                      <div style={s('display:flex;align-items:baseline;gap: 4px')}>
                        <span style={{ fontSize: 43, fontWeight: 800, color: active ? 'var(--bg-card)' : 'var(--text-main)', letterSpacing: -2, lineHeight: 1 }}>
                          {plan.id === 'agy_custom' ? 'Custom' : `${shownPrice}€`}
                        </span>
                        {plan.id !== 'agy_custom' && (
                          <span style={{ fontSize: 14, fontWeight: 600, color: active ? 'rgba(255,255,255,.55)' : '#b3aca1' }}>{shownPeriod}</span>
                        )}
                      </div>
                      {shownNote && (
                        <div style={{ fontSize: 13, fontWeight: 700, color: active ? 'rgba(255,255,255,.85)' : 'var(--text-muted)', marginTop: 5 }}>{shownNote}</div>
                      )}
                    </>
                  );
                })()}

                {isSeat && (
                  <div style={{ marginTop: 14, background: active ? 'rgba(255,255,255,.12)' : 'var(--bg-main, #f8fafc)', border: active ? '1px solid rgba(255,255,255,.18)' : '1px solid var(--border-light)', borderRadius: 13, padding: '13px 14px 11px' }}>
                    <div style={{ marginBottom: 4 }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: active ? 'rgba(255,255,255,.75)' : 'var(--text-muted)', letterSpacing: '.02em' }}>Collaboratori</span>
                    </div>
                    <div style={{ position: 'relative', paddingTop: 32 }}>
                      <div style={{
                        position: 'absolute',
                        top: 0,
                        left: `calc(${(seats - 2) / 8} * (100% - 22px) + 11px)`,
                        transform: 'translateX(-50%)',
                        background: active ? 'var(--bg-card)' : '#3B83F6',
                        color: active ? '#3B83F6' : '#fff',
                        fontSize: 12, fontWeight: 800, padding: '2px 9px', borderRadius: 7,
                        boxShadow: active ? '0 2px 8px rgba(0,0,0,.15)' : '0 2px 8px rgba(59,131,246,.35)',
                        pointerEvents: 'none', whiteSpace: 'nowrap',
                      }}>
                        {seats}
                        <span style={{
                          position: 'absolute', left: '50%', bottom: -4, transform: 'translateX(-50%) rotate(45deg)',
                          width: 7, height: 7, background: active ? 'var(--bg-card)' : '#3B83F6', borderRadius: 1,
                        }} />
                      </div>
                      <input
                        type="range" min={2} max={10} step={1} value={seats}
                        onChange={(e) => setSeats(Number(e.target.value))}
                        onClick={(e) => e.stopPropagation()}
                        aria-label="Numero collaboratori"
                        className="seat-slider"
                        style={{
                          width: '100%',
                          ['--ss-color' as string]: active ? '#fff' : '#3B83F6',
                          background: active
                            ? `linear-gradient(to right, #fff ${((seats - 2) / 8) * 100}%, rgba(255,255,255,.25) ${((seats - 2) / 8) * 100}%)`
                            : `linear-gradient(to right, #3B83F6 ${((seats - 2) / 8) * 100}%, #e5e7eb ${((seats - 2) / 8) * 100}%)`,
                        }}
                      />
                    </div>
                    <div style={s('display:flex;justify-content:space-between;font-size:10px;font-weight:600;margin-top:5px') as React.CSSProperties} >
                      <span style={{ color: active ? 'rgba(255,255,255,.6)' : '#b3aca1' }}>2</span>
                      <span style={{ color: active ? 'rgba(255,255,255,.6)' : '#b3aca1' }}>10</span>
                    </div>
                    <style>{`
                      .seat-slider {
                        -webkit-appearance: none;
                        appearance: none;
                        height: 5px;
                        border-radius: 999px;
                        outline: none;
                        cursor: pointer;
                        display: block;
                      }
                      .seat-slider::-webkit-slider-thumb {
                        -webkit-appearance: none;
                        appearance: none;
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: #fff;
                        border: 3px solid var(--ss-color, #3B83F6);
                        box-shadow: 0 2px 8px rgba(16,24,40,0.22);
                        cursor: pointer;
                        transition: transform .15s ease, box-shadow .15s ease;
                      }
                      .seat-slider::-webkit-slider-thumb:hover {
                        transform: scale(1.12);
                        box-shadow: 0 4px 14px rgba(16,24,40,0.28);
                      }
                      .seat-slider::-moz-range-thumb {
                        width: 20px;
                        height: 20px;
                        border-radius: 50%;
                        background: #fff;
                        border: 3px solid var(--ss-color, #3B83F6);
                        box-shadow: 0 2px 8px rgba(16,24,40,0.22);
                        cursor: pointer;
                        transition: transform .15s ease;
                      }
                      .seat-slider::-moz-range-thumb:hover { transform: scale(1.12); }
                      .seat-slider::-moz-range-track { background: transparent; }
                    `}</style>
                  </div>
                )}

                <div style={{ height: 1, background: active ? 'rgba(255,255,255,.15)' : 'var(--border-light)', margin: '18px 0' }} />

                <div style={s('display:flex;flex-direction:column;gap: 12px;flex:1')}>
                  {shownFeatures.map((f, i) => (
                    <div key={i} style={s('display:flex;align-items:center;gap: 10px')}>
                      <Icon name="check" size={14} color={active ? '#fff' : '#3B83F6'} style={{ flex: 'none' }} />

                      <span style={{ fontSize: 13, fontWeight: 500, color: active ? 'rgba(255,255,255,.92)' : 'var(--text-sec)', lineHeight: 1.45 }}>{renderSeatFeature(f)}</span>
                    </div>
                  ))}
                </div>

                <Box as="button" onClick={() => {
                  if (plan.id === 'agy_custom') { window.open('https://cal.com/getnearme/30min', '_blank'); return; }
                  if (active) { toast('Sei già su questo piano', 'check'); return; }
                  if (plan.id === 'free') { toast('Per tornare al Free disdici l’abbonamento da “Gestisci piano”'); return; }
                  if (isSeat) { seatCheckout(plan.id); return; }
                  if (userData) redirectToStripePayment(plan.id, userData.id, userData.email);
                }} style={{
                  marginTop: 25,
                  border: 'none',
                  background: active ? 'var(--bg-card)' : '#3B83F6',
                  color: active ? '#3B83F6' : '#fff',
                  fontSize: 14, fontWeight: 700, padding: '13px 18px', borderRadius: 11,
                  cursor: 'pointer', minHeight: 43, width: '100%',
                  transition: 'background .2s, transform .15s',
                  boxShadow: active ? '0 2px 8px rgba(0,0,0,.08)' : 'none',
                }} hover={{
                  background: active ? '#f0f6ff' : '#2b6fe0',
                  transform: 'scale(0.98)',
                }}>
                  {active ? 'Piano attuale' : plan.id === 'free' ? 'Piano base' : plan.id === 'agy_custom' ? 'Contattaci' : 'Scegli questo piano'}
                </Box>
              </Box>
            );
          })}
        </div>
      </div>


    </div>
  );
}

/* ───── BRAND AGENZIA SCREEN ───── */
const LOGO_ROWS = [
  { label: 'Icona', variants: [
    { key: 'logo_white_v', label: 'Bianco', bg: 'var(--text-main)' },
    { key: 'logo_black_v', label: 'Nero', bg: 'var(--bg-card)' },
    { key: 'logo_colored_v', label: 'Colore', bg: 'var(--bg-hover)' },
  ]},
  { label: 'Logo + Nome', variants: [
    { key: 'logo_white_h', label: 'Bianco', bg: 'var(--text-main)' },
    { key: 'logo_black_h', label: 'Nero', bg: 'var(--bg-card)' },
    { key: 'logo_colored_h', label: 'Colore', bg: 'var(--bg-hover)' },
  ]},
] as const;

type BrandState = {
  logos: Record<string, string | null>;
  logoOrientation: 'vertical' | 'horizontal';
  primaryColor: string;
  companyName: string;
  companyWebsite: string;
  companyEmail: string;
  reportFinalTitle: string;
  reportFinalDesc: string;
};

function SettingsScreen({ toast }: { toast: (msg: string, icon?: string) => void }) {
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [geoOn, setGeoOn] = useState(true);
  useEffect(() => { setGeoOn(getGeoEnabled()); }, []);
  const toggleGeo = () => {
    const next = !geoOn;
    setGeoOn(next);
    setGeoEnabled(next);
    toast(next ? 'Geolocalizzazione attivata' : 'Geolocalizzazione disattivata', next ? 'check' : 'x');
  };

  const handleDelete = async () => {
    if (deleteConfirmText !== 'ELIMINA') return;
    setDeleteLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const res = await fetch('/api/account/delete', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${session.access_token}` }
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Errore eliminazione account');
      }
      // Pulizia cache locale: i job video / progetti / flag sono in localStorage
      // NON scoped per utente. Senza pulirli, un nuovo account sullo stesso
      // browser si ritrova i contenuti del vecchio. Rimuoviamo tutte le chiavi gnm_.
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) {
          const k = localStorage.key(i);
          if (k && k.startsWith('gnm_')) localStorage.removeItem(k);
        }
      } catch { /* private mode */ }
      // Best-effort: svuota anche la cache media in IndexedDB.
      try { indexedDB.deleteDatabase('gnm_media_cache'); } catch { /* noop */ }
      // Flag: la dashboard, vedendo la sessione sparire, NON deve rimbalzare al
      // login del checkout. Dopo delete si va dritti alla home della landing.
      try { sessionStorage.setItem('gnm_post_delete', '1'); } catch { /* private mode */ }
      await supabase.auth.signOut();
      const loc = window.location.pathname.split('/')[1] || 'it';
      window.location.replace(`/${loc}`);
    } catch (err: any) {
      toast(err.message, 'x');
      setDeleteLoading(false);
      setDeleteModalOpen(false);
    }
  };

  return (
    <div style={s('max-width:1044px;margin: 0 auto;padding: 26px 29px 58px')}>
      <h1 style={s('margin: 0 0 4px;font-size:24px;font-weight:800;letter-spacing:-.5px')}>Impostazioni</h1>
      <div style={s('color:var(--text-muted);font-size:13px;margin-bottom:25px')}>Gestisci il tuo account e le preferenze dell'app.</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
        {/* Info Box */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 22 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Informazioni</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border-light)' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>Versione App</div>
            <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>1.0.0</div>
          </div>
          <a href="https://www.getnearme.it/it/privacy" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', borderBottom: '1px solid var(--border-light)', textDecoration: 'none' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>Privacy Policy</div>
            <Icon name="external-link" size={13} color="var(--text-muted)" />
          </a>
          <a href="https://www.getnearme.it/it/terms" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 0', textDecoration: 'none' }}>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>Termini e Condizioni</div>
            <Icon name="external-link" size={13} color="var(--text-muted)" />
          </a>
        </div>

        {/* Preferenze */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 22 }}>
          <h3 style={{ margin: '0 0 14px', fontSize: 14, fontWeight: 700 }}>Preferenze</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>Geolocalizzazione</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2, lineHeight: 1.5 }}>Nell&apos;Analisi di zona precompila l&apos;indirizzo con la tua posizione attuale.</div>
            </div>
            <div onClick={toggleGeo} style={{ width: 40, height: 23, borderRadius: 89, background: geoOn ? '#3B83F6' : '#d8d4cb', position: 'relative', flexShrink: 0, cursor: 'pointer', transition: 'background .2s' }}>
              <div style={{ position: 'absolute', top: 3, left: geoOn ? 21 : 3, width: 18, height: 18, borderRadius: 89, background: '#fff', transition: 'left .2s', boxShadow: '0 1px 3px rgba(0,0,0,.2)' }} />
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 14, padding: 22, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 14 }}>
          <div style={{ flex: '1 1 300px' }}>
            <h3 style={{ margin: '0 0 7px', fontSize: 14, fontWeight: 700, color: '#dc2626' }}>Zona Pericolosa</h3>
            <p style={{ margin: 0, fontSize: 12, color: '#b91c1c', maxWidth: 540 }}>
              L'eliminazione dell'account è irreversibile. Tutti i tuoi immobili, foto AI, video e brand verranno cancellati definitivamente dai nostri server.
            </p>
          </div>

          <div style={{ flex: 'none' }}>
            <Box as="button" onClick={() => { setDeleteModalOpen(true); setDeleteConfirmText(''); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 14px', borderRadius: 7, fontSize: 12, fontWeight: 700, background: '#dc2626', color: 'var(--bg-card)', border: 'none', cursor: 'pointer' } as React.CSSProperties} hover={{ background: '#b91c1c' }}>
              <Icon name="trash" size={14} color="var(--bg-card)" />
              Elimina account
            </Box>
          </div>
        </div>
      </div>

      {deleteModalOpen && (
        <div onClick={() => setDeleteModalOpen(false)} style={s('position:fixed;inset:0;background:rgba(24,21,17,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding: 20px')}>
          <div onClick={e => e.stopPropagation()} style={s('width:100%;max-width:396px;background:var(--bg-card);border-radius:18px;box-shadow:0 32px 64px rgba(20,18,15,.2);padding: 26px')}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 18 }}>
              <div style={{ width: 50, height: 50, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="alert-triangle" size={25} color="#dc2626" />
              </div>
            </div>
            <h3 style={{ margin: '0 0 5px', fontSize: 18, fontWeight: 800, textAlign: 'center', color: '#1a1a1a' }}>Sei sicuro?</h3>
            <p style={{ margin: '0 auto 24px', maxWidth: 270, fontSize: 13, color: 'var(--text-sec)', textAlign: 'center', lineHeight: 1.5 }}>
Azione <strong>irreversibile</strong>: perderai dati, contenuti e immobili, e l&apos;abbonamento verrà annullato.
            </p>
            
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 7 }}>
                Scrivi <strong style={{ color: '#dc2626' }}>ELIMINA</strong> per confermare:
              </label>
              <input 
                type="text" 
                value={deleteConfirmText} 
                onChange={e => setDeleteConfirmText(e.target.value)} 
                placeholder="ELIMINA" 
                style={{ width: '100%', border: '1px solid var(--border-main)', borderRadius: 9, padding: '11px 14px', fontSize: 13, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 11 }}>
              <Box as="button" onClick={() => setDeleteModalOpen(false)} style={{ flex: 1, padding: '11px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: 'var(--bg-body)', color: 'var(--text-sec)', border: 'none', cursor: 'pointer' } as React.CSSProperties} hover={{ background: '#e9e6df' }}>
                Annulla
              </Box>
              <Box as="button" disabled={deleteConfirmText !== 'ELIMINA' || deleteLoading} onClick={handleDelete} style={{ flex: 1, padding: '11px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#dc2626', color: 'var(--bg-card)', border: 'none', cursor: deleteConfirmText !== 'ELIMINA' || deleteLoading ? 'not-allowed' : 'pointer', opacity: deleteConfirmText !== 'ELIMINA' || deleteLoading ? 0.5 : 1 } as React.CSSProperties} hover={deleteConfirmText === 'ELIMINA' && !deleteLoading ? { background: '#b91c1c' } : undefined}>
                {deleteLoading ? 'Eliminazione...' : 'Conferma ed elimina'}
              </Box>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function AssistenzaScreen({ toast, email, defaultType = 'support' }: { toast: (msg: string, icon?: string) => void; email: string; defaultType?: string }) {
  const [type, setType] = useState(defaultType);
  useEffect(() => { setType(defaultType); }, [defaultType]);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim().length < 10) {
      toast('Il messaggio deve contenere almeno 10 caratteri.', 'x');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/support-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type, message })
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || 'Errore invio richiesta');
      }
      toast('Richiesta inviata con successo!', 'check');
      setMessage('');
    } catch (err: any) {
      toast(err.message, 'x');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s('max-width:720px;margin: 0 auto;padding: 26px 29px 58px')}>
      <h1 style={s('margin: 0 0 4px;font-size:24px;font-weight:800;letter-spacing:-.5px')}>Assistenza</h1>
      <div style={s('color:var(--text-muted);font-size:13px;margin-bottom:29px')}>Come possiamo aiutarti? Inviaci una segnalazione o richiedi supporto tecnico.</div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border-light)', borderRadius: 14, padding: 22 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          
          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 7 }}>Tipo di richiesta</label>
            <div style={{ position: 'relative' }}>
              <select 
                value={type} 
                onChange={e => setType(e.target.value)}
                style={{ width: '100%', appearance: 'none', border: '1px solid var(--border-main)', borderRadius: 9, padding: '11px 14px', fontSize: 13, outline: 'none', background: 'var(--bg-card)', color: 'var(--text-main)', cursor: 'pointer' }}
              >
                <option value="support">Assistenza generale</option>
                <option value="bug">Segnala un problema (Bug)</option>
                <option value="feature">Richiedi funzione / Suggerimento</option>
              </select>
              <Icon name="chevron-down" size={14} color="var(--text-muted)" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 7 }}>Messaggio</label>
            <textarea 
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={type === 'feature' ? 'Raccontaci la tua idea: che funzionalità ti servirebbe e perché?' : type === 'bug' ? 'Descrivi il problema nel dettaglio. Cosa stavi facendo quando si è verificato?' : 'Scrivi qui la tua richiesta...'}
              style={{ width: '100%', border: '1px solid var(--border-main)', borderRadius: 9, padding: '11px 14px', fontSize: 13, outline: 'none', minHeight: 126, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 7 }}>
            <Box as="button" type="submit" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 7, padding: '11px 22px', borderRadius: 9, fontSize: 13, fontWeight: 700, background: '#1d5fd0', color: 'var(--bg-card)', border: 'none', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 } as React.CSSProperties} hover={!loading ? { background: '#1850b0' } : undefined}>
              {loading ? 'Invio in corso...' : 'Invia richiesta'}
            </Box>
          </div>

        </form>
      </div>
    </div>
  );
}

function BrandScreen({ toast, brand: brandProp, setBrand: setBrandParent, brandRole, demoMode, locked, go, demoPaused }: { toast: (msg: string, icon?: string, link?: { href: string; label: string }) => void; brand: BrandSettings; setBrand: (b: BrandSettings) => void; brandRole: 'owner' | 'member' | null; demoMode?: boolean; locked?: boolean; go?: (r: string) => void; demoPaused?: boolean }) {
  const [brand, setBrand] = React.useState<BrandState>(() => {
    const base = brandProp as unknown as BrandState;
    if (!demoMode) return base;
    return { ...base, logos: { logo_white_v: '/dashboard/logo-icon-white.svg', logo_black_v: '/dashboard/logo-icon-black.svg', logo_colored_v: '/dashboard/logo-icon.svg', logo_white_h: '/assets/svg/logo_scritta_white_circle.svg', logo_black_h: '/assets/svg/logo_scritta_black_circle.svg', logo_colored_h: '/dashboard/logo.svg' }, primaryColor: '#3B83F6', companyName: 'GetNearMe', companyWebsite: 'https://getnearme.com', companyEmail: 'info@getnearme.com' };
  });
  const [demoStep, setDemoStep] = React.useState(0);
  React.useEffect(() => {
    if (!demoMode) return;
    setBrand(prev => ({ ...prev, logos: { logo_white_v: '/dashboard/logo-icon-white.svg', logo_black_v: '/dashboard/logo-icon-black.svg', logo_colored_v: '/dashboard/logo-icon.svg', logo_white_h: '/assets/svg/logo_scritta_white_circle.svg', logo_black_h: '/assets/svg/logo_scritta_black_circle.svg', logo_colored_h: '/dashboard/logo.svg' }, primaryColor: '#3B83F6', companyName: 'GetNearMe', companyWebsite: 'https://getnearme.com', companyEmail: 'info@getnearme.com' }));
    setDemoStep(0);
    if (demoPaused) return;
    const timers = [1,2,3,4,5].map((step, i) => setTimeout(() => setDemoStep(step), 300 + i * 350));
    return () => timers.forEach(clearTimeout);
  }, [demoMode, demoPaused]);
  const fileRefs = React.useRef<Record<string, HTMLInputElement | null>>({});
  const [loadedLogos, setLoadedLogos] = React.useState<Record<string, boolean>>({});
  const scope: 'team' | 'user' = brandRole === 'owner' ? 'team' : 'user';

  // Keep track of what we last saved to avoid echoing back identical data
  // or triggering saves on initial mount if nothing changed.
  const lastSavedRef = React.useRef(JSON.stringify({
    logoOrientation: brandProp.logoOrientation,
    primaryColor: brandProp.primaryColor,
    companyName: brandProp.companyName,
    companyWebsite: brandProp.companyWebsite,
    companyEmail: brandProp.companyEmail,
    reportFinalTitle: brandProp.reportFinalTitle,
    reportFinalDesc: brandProp.reportFinalDesc,
  }));

  // Auto-save text fields (debounced) — no save button.
  const saveTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  React.useEffect(() => {
    if (demoMode) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);

    const currentStr = JSON.stringify({
      logoOrientation: brand.logoOrientation,
      primaryColor: brand.primaryColor,
      companyName: brand.companyName,
      companyWebsite: brand.companyWebsite,
      companyEmail: brand.companyEmail,
      reportFinalTitle: brand.reportFinalTitle,
      reportFinalDesc: brand.reportFinalDesc,
    });

    if (currentStr === lastSavedRef.current) return;

    saveTimer.current = setTimeout(() => {
      lastSavedRef.current = currentStr;
      updateBrand(scope, {
        logoOrientation: brand.logoOrientation,
        primaryColor: brand.primaryColor,
        companyName: brand.companyName,
        companyWebsite: brand.companyWebsite,
        companyEmail: brand.companyEmail,
        reportFinalTitle: brand.reportFinalTitle,
        reportFinalDesc: brand.reportFinalDesc,
      }).then(ok => { 
        if (ok) {
          setBrandParent(brand as unknown as BrandSettings); 
          toast('Modifiche salvate', 'check');
        }
      });
    }, 600);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [brand.logoOrientation, brand.primaryColor, brand.companyName, brand.companyWebsite, brand.companyEmail, brand.reportFinalTitle, brand.reportFinalDesc]);

  const set = <K extends keyof BrandState>(k: K, v: BrandState[K]) => setBrand(b => ({ ...b, [k]: v }));

  const handleLogoUpload = async (variant: string, file: File) => {
    if (locked) { toast('Brand GetNearMe incluso nel piano Free. Passa a un piano per usare il tuo logo.', 'x'); return; }
    if (file.size > 500 * 1024) { toast('File troppo grande (max 500 KB). Comprimila qui:', 'x', { href: 'https://www.iloveimg.com/compress-image', label: 'clicca qui' }); return; }
    if (!['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'].includes(file.type)) { toast('Formato non supportato', 'x'); return; }
    // Optimistic local preview
    const reader = new FileReader();
    reader.onload = () => setBrand(b => ({ ...b, logos: { ...b.logos, [variant]: reader.result as string } }));
    reader.readAsDataURL(file);
    
    toast('Caricamento in corso...', 'refresh');
    const ok = await uploadBrandLogo(scope, variant, file);
    if (ok) {
      const fresh = await fetchBrand();
      setBrand(fresh.settings as unknown as BrandState);
      setBrandParent(fresh.settings);
      toast('Logo caricato', 'check');
    } else {
      toast('Errore caricamento logo', 'x');
    }
  };

  const removeLogo = async (variant: string) => {
    if (locked) { toast('Brand GetNearMe incluso nel piano Free. Passa a un piano per personalizzarlo.', 'x'); return; }
    setBrand(b => ({ ...b, logos: { ...b.logos, [variant]: null } }));
    const ok = await removeBrandLogo(scope, variant);
    if (ok) {
      const fresh = await fetchBrand();
      setBrand(fresh.settings as unknown as BrandState);
      setBrandParent(fresh.settings);
    }
  };

  const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid var(--border-main)', borderRadius: 9, padding: '10px 13px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: 'var(--bg-card)', transition: 'border-color .2s' };

  const df = (step: number): React.CSSProperties => demoMode ? { opacity: demoStep >= step ? 1 : 0, transform: demoStep >= step ? 'translateY(0)' : 'translateY(8px)', transition: 'opacity .5s ease, transform .5s ease' } : {};

  return (
    <div className="max-md:!px-4 max-md:!py-6" style={s('max-width:738px;margin: 0 auto;padding: 26px 29px 58px')}>
      <div style={s('margin-bottom:22px')}>
        <h1 style={s('margin: 0 0 4px;font-size:22px;font-weight:800;letter-spacing:-.5px')}>Brand</h1>
        <div style={s('color:var(--text-muted);font-size:13px')}>Personalizza loghi, colori e informazioni che appaiono nei tuoi report e contenuti.</div>
      </div>

      {locked && !demoMode && (
        <div onClick={() => go?.('account')} style={{ display: 'flex', alignItems: 'center', gap: 9, background: '#eef4fe', border: '1px solid #cfe0fb', borderRadius: 11, padding: '11px 14px', marginBottom: 18, cursor: go ? 'pointer' : 'default' }}>
          <Icon name="lock" size={14} color="#1d5fd0" />
          <div style={{ fontSize: 12, color: '#1d5fd0', fontWeight: 600 }}>Sul piano Free i contenuti usano il brand GetNearMe. <span style={{ textDecoration: 'underline', fontWeight: 800 }}>Passa a un piano</span> per caricare il tuo logo e personalizzare tutto.</div>
        </div>
      )}

      {/* ── LOGO SECTION ── */}
      <div style={s('background:var(--bg-card);border:1px solid var(--border-light);border-radius:13px;padding: 20px 25px;margin-bottom:18px')}>
        <div style={s('font-size:14px;font-weight:800;margin-bottom:4px;letter-spacing:-.2px')}>Loghi</div>
        <div style={s('color:var(--text-muted);font-size:12px;margin-bottom:16px')}>Carica le versioni del tuo logo per sfondi chiari e scuri.</div>
        <div style={s('display:flex;flex-direction:column;gap: 22px')}>
          {LOGO_ROWS.map(row => (
            <div key={row.label}>
              <div style={s('font-size:11px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin-bottom:9px')}>{row.label}</div>
              <div className="max-md:!grid-cols-2 max-sm:!grid-cols-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 13 }}>
                {row.variants.map(v => {
                  const src = brand.logos[v.key];
                  return (
                    <div key={v.key} style={{ position: 'relative' }}>
                      <Box onClick={() => fileRefs.current[v.key]?.click()} style={{
                        width: '100%', aspectRatio: '2.4', borderRadius: 11,
                        background: v.bg, border: v.bg === 'var(--bg-card)' ? '1.5px solid #ece9e2' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        overflow: 'hidden', transition: 'box-shadow .2s',
                      }} hover={{ boxShadow: '0 4px 16px rgba(33,31,28,.10)' }}>
                        {src ? (
                          <img
                            src={src}
                            alt={v.label}
                            onLoad={() => setLoadedLogos(p => ({ ...p, [src]: true }))}
                            style={{
                              maxWidth: demoMode ? (v.key.endsWith('_h') ? '65%' : '50%') : '70%', maxHeight: demoMode ? (v.key.endsWith('_h') ? '65%' : '50%') : '70%', objectFit: 'contain',
                              opacity: (demoMode ? demoStep >= 1 && loadedLogos[src] : loadedLogos[src]) ? 1 : 0,
                              transform: demoMode ? (demoStep >= 1 ? 'scale(1)' : 'scale(.92)') : undefined,
                              transition: 'opacity .5s ease, transform .5s ease'
                            }}
                          />
                        ) : (
                          <Icon name="image-plus" size={18} color={v.bg === 'var(--text-main)' ? 'rgba(255,255,255,.35)' : '#b3aca1'} />
                        )}
                      </Box>
                      {src && (
                        <button onClick={() => removeLogo(v.key)} style={{
                          position: 'absolute', top: 5, right: 5, width: 22, height: 22, borderRadius: '50%',
                          background: 'rgba(33,31,28,.7)', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><Icon name="x" size={11} color="var(--bg-card)" /></button>
                      )}
                      <input ref={el => { fileRefs.current[v.key] = el; }} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(v.key, f); e.target.value = ''; }} />
                      <div style={s('margin-top:5px;font-size:11px;font-weight:700;color:var(--text-sec)')}>{v.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: 'var(--bg-body)', margin: '18px 0' }} />
        <div className="max-md:!flex-col max-md:!items-start max-md:!gap-2" style={s('display:flex;align-items:center;gap: 10px;justify-content:space-between')}>
          <span style={s('font-size:12px;font-weight:700;color:var(--text-sec)')}>Logo da usare nei contenuti</span>
          <select value={brand.logoOrientation} onChange={e => set('logoOrientation', e.target.value as 'vertical' | 'horizontal')} style={{ ...inputStyle, width: 'auto', padding: '7px 11px', cursor: 'pointer' }}>
            <option value="vertical">Solo icona</option>
            <option value="horizontal">Icona + Nome</option>
          </select>
        </div>
      </div>

      {/* ── PRIMARY COLOR ── */}
      <div style={s('background:var(--bg-card);border:1px solid var(--border-light);border-radius:13px;padding: 20px 25px;margin-bottom:18px')}>
        <div style={s('font-size:14px;font-weight:800;margin-bottom:4px;letter-spacing:-.2px')}>Colore della tua agenzia</div>
        <div style={s('color:var(--text-muted);font-size:12px;margin-bottom:14px')}>Questo colore viene applicato ai report, ai post e ai video che crei.</div>
        <div style={s('display:flex;align-items:center;gap: 12px')}>
          <div style={{ width: 40, height: 40, borderRadius: 9, border: '1px solid var(--border-main)', overflow: 'hidden', position: 'relative', cursor: 'pointer', padding: 4, background: 'var(--bg-card)' }}>
            <div style={{ width: '100%', height: '100%', background: brand.primaryColor, borderRadius: 5, ...df(2) }} />
            <input type="color" value={brand.primaryColor} onChange={e => set('primaryColor', e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
          </div>
          <span style={s('font-size:12px;font-weight:600;color:var(--text-sec)')}>Clicca per cambiare colore</span>
        </div>
      </div>

      {/* ── COMPANY INFO ── */}
      <div style={s('background:var(--bg-card);border:1px solid var(--border-light);border-radius:13px;padding: 20px 25px;margin-bottom:18px')}>
        <div style={s('font-size:14px;font-weight:800;margin-bottom:4px;letter-spacing:-.2px')}>Informazioni agenzia</div>
        <div style={s('color:var(--text-muted);font-size:12px;margin-bottom:16px')}>Queste informazioni appaiono nei report e nei post che crei.</div>
        <div style={s('display:flex;flex-direction:column;gap: 13px')}>
          <div>
            <label style={s('display:block;font-size:12px;font-weight:700;color:var(--text-sec);margin-bottom:5px')}>Nome agenzia</label>
            <input value={brand.companyName} onChange={e => set('companyName', e.target.value)} maxLength={50} placeholder="La Tua Agenzia" style={{ ...inputStyle, ...df(3) }} />
          </div>
          <div>
            <label style={s('display:block;font-size:12px;font-weight:700;color:var(--text-sec);margin-bottom:5px')}>Sito web <span style={s('color:#b3aca1;font-weight:500')}>(opzionale)</span></label>
            <input value={brand.companyWebsite} onChange={e => set('companyWebsite', e.target.value)} placeholder="https://www.tuaagenzia.it" type="url" style={{ ...inputStyle, ...df(4) }} />
          </div>
          <div>
            <label style={s('display:block;font-size:12px;font-weight:700;color:var(--text-sec);margin-bottom:5px')}>Email contatto <span style={s('color:#b3aca1;font-weight:500')}>(opzionale)</span></label>
            <input value={brand.companyEmail} onChange={e => set('companyEmail', e.target.value)} placeholder="info@tuaagenzia.it" type="email" style={{ ...inputStyle, ...df(5) }} />
          </div>
        </div>
      </div>

      {/* ── REPORT FINAL PAGE ── nascosta (report non attivo) ──
      <div style={s('background:var(--bg-card);border:1px solid var(--border-light);border-radius:13px;padding: 20px 25px;margin-bottom:18px')}>
        <div style={s('font-size:14px;font-weight:800;margin-bottom:4px;letter-spacing:-.2px')}>Pagina finale del report</div>
        <div style={s('color:var(--text-muted);font-size:12px;margin-bottom:16px')}>Personalizza il messaggio che i tuoi clienti vedono alla fine del report.</div>
        <div style={s('display:flex;flex-direction:column;gap: 13px')}>
          <div>
            <label style={s('display:block;font-size:12px;font-weight:700;color:var(--text-sec);margin-bottom:5px')}>Titolo finale</label>
            <input value={brand.reportFinalTitle} onChange={e => set('reportFinalTitle', e.target.value)} maxLength={100} placeholder="Grazie per aver scelto la nostra agenzia" style={inputStyle} />
          </div>
          <div>
            <label style={s('display:block;font-size:12px;font-weight:700;color:var(--text-sec);margin-bottom:5px')}>Messaggio finale</label>
            <textarea value={brand.reportFinalDesc} onChange={e => set('reportFinalDesc', e.target.value)} maxLength={500} rows={4} placeholder="Inserisci un messaggio personalizzato per i tuoi clienti..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>
      </div>
      */}

      <div style={s('display:flex;align-items:center;gap: 6px;color:#b3aca1;font-size:11px;justify-content:flex-end')}>
        <Icon name="check" size={13} color="#b3aca1" />Le modifiche vengono salvate automaticamente
      </div>
    </div>
  );
}

const ROUTE_TITLES: Record<string, string> = {
  progetti: 'Immobili', immobili: 'Immobili', progetto: 'Dettaglio immobile', staging: 'Homestaging AI', video: 'Video AI', montaggio: 'Montaggio',
  studio: 'Post Social', calendario: 'Calendario', media: 'Galleria', team: 'Team',
  brand: 'Brand', social: 'Account social', account: 'Piano', home: 'Scheda', impostazioni: 'Impostazioni', assistenza: 'Assistenza',
  report: 'Report', quartiere: 'Analisi Quartiere', compare: 'Confronta immobili'
};

// Helper for dynamic project cover gradients when no image is provided
// Sempre gli STESSI key longhand in tutti i rami (mai il shorthand `background`):
// se cambiano tra render con set di proprieta' diversi React avvisa di mix
// shorthand/longhand. I gradient sono backgroundImage validi.
const getCoverStyle = (p: Project | null | undefined, small = false): React.CSSProperties => {
  if (!p) return { backgroundImage: 'none', backgroundColor: '#f3f1ec', backgroundSize: 'cover', backgroundPosition: 'center' };
  // small (avatar/lista) usa la thumb ~100px; la card usa la cover ~500px.
  const src = small ? (p.thumb || p.cover) : (p.cover || p.thumb);
  if (src) return { backgroundImage: `url("${src}")`, backgroundColor: '#f3f1ec', backgroundSize: 'cover', backgroundPosition: 'center' };
  const hash = p.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const hue = hash % 360;
  return { backgroundImage: `linear-gradient(135deg, hsl(${hue}, 80%, 65%), hsl(${(hue + 40) % 360}, 80%, 55%))`, backgroundColor: '#f3f1ec', backgroundSize: 'cover', backgroundPosition: 'center' };
};


export default function DashboardApp({ userData }: { userData: UserData | null }) {
  const [route, setRoute] = useState('home');
  const [collapsed, setCollapsed] = useState(false);
  const [projOpen, setProjOpen] = useState(false);
  const projHoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Hover-to-open is a desktop-only nicety; on mobile the panel sits below the
  // trigger (absolute) so the cursor gap fires mouseleave and the menu flickers.
  const [hoverNav, setHoverNav] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const hov = window.matchMedia('(min-width: 768px) and (hover: hover)');
    const narrow = window.matchMedia('(max-width: 767px)');
    const on = () => { setHoverNav(hov.matches); setIsMobile(narrow.matches); };
    on(); hov.addEventListener('change', on); narrow.addEventListener('change', on);
    return () => { hov.removeEventListener('change', on); narrow.removeEventListener('change', on); };
  }, []);
  const [projQuery, setProjQuery] = useState('');
  // Conferma eliminazione immobile (azione distruttiva -> mai one-click).
  const [confirmDelProj, setConfirmDelProj] = useState<{ id: string; nome: string } | null>(null);
  const [delProjLoading, setDelProjLoading] = useState(false);
  const [activeProject, setActiveProject] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('gnm_active_project') ?? 'p1' : 'p1'
  );
  const credits = userData?.credits ?? 0;
  const [newProjOpen, setNewProjOpen] = useState(false);
  const [immMenuId, setImmMenuId] = useState<string | null>(null);
  const [importOpen, setImportOpen] = useState(false);
  const [immActionsOpen, setImmActionsOpen] = useState(false);
  const [immQuery, setImmQuery] = useState('');
  const [immExpanded, setImmExpanded] = useState<Set<string>>(new Set());
  const [immSelectMode, setImmSelectMode] = useState(false);
  const [immSelected, setImmSelected] = useState<Set<string>>(new Set());
  const [immDeleting, setImmDeleting] = useState(false);
  const [editProjOpen, setEditProjOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Caching with SWR for Projects
  const { data: realProjects = [], isLoading: loadingProjects, mutate: mutateProjects } = useSWR('projects', fetchProjects, {
    onSuccess: (data) => {
      if (data.length > 0) {
        const savedId = localStorage.getItem('gnm_active_project');
        if (savedId && data.find(p => p.id === savedId)) {
          setActiveProject(savedId);
        } else if (!savedId) {
          setActiveProject(data[0].id);
        }
      }
    }
  });
  
  const projects = realProjects as unknown as Project[];
  const setProjects = useCallback((updater: React.SetStateAction<Project[]>) => {
    mutateProjects(prev => {
      const prevArray = (prev as unknown as Project[]) || [];
      return typeof updater === 'function' ? (updater as any)(prevArray) : updater;
    }, false);
  }, [mutateProjects]);

  // Smart Polling with SWR for Batches
  const { data: batches = [], isLoading: loadingBatches, mutate: mutateBatches } = useSWR('batches', fetchUserBatches, {
    refreshInterval: (data) => {
      if (!data) return 0;
      const hasActive = data.some(x => x.status === 'processing' || x.status === 'pending');
      return hasActive ? 5000 : 0; // Poll only if there are active batches
    },
    revalidateOnFocus: true, // Auto update when user comes back to the tab
  });

  const setBatches = useCallback((updater: React.SetStateAction<BatchInfo[]>) => {
    mutateBatches(prev => {
      const prevArray = prev || [];
      return typeof updater === 'function' ? (updater as any)(prevArray) : updater;
    }, false);
  }, [mutateBatches]);

  // Badge galleria +N per le foto batch: scatta SOLO quando il batch passa da
  // attivo (processing/pending) a completato, non al submit. Conta una volta sola.
  const batchPrevStatusRef = useRef<Map<string, string>>(new Map());
  const batchCountedRef = useRef<Set<string>>(new Set());
  useEffect(() => {
    for (const b of batches) {
      const prev = batchPrevStatusRef.current.get(b.id);
      const isDone = b.status === 'completed' || b.status === 'partial';
      const wasActive = prev === 'processing' || prev === 'pending';
      if (isDone && wasActive && !batchCountedRef.current.has(b.id)) {
        batchCountedRef.current.add(b.id);
        const n = b.completedItems || b.totalItems || 1;
        if (routeRef.current !== 'media') setGalleryUnseen(x => x + n);
      }
      batchPrevStatusRef.current.set(b.id, b.status);
    }
  }, [batches]);

  // ── Video jobs (montaggio/avatar): tray "Lavori in corso" + Media ──
  // Source of truth = tabella ai_video_jobs (finalizzata dal cron, sopravvive a
  // browser chiuso/altro device). localStorage = cache ottimistica. Si fondono.
  const [videoJobs, setVideoJobs] = useState<VideoJob[]>([]);
  useEffect(() => { setVideoJobs(loadVideoJobs()); }, []);
  const registerVideoJob = useCallback((job: Omit<VideoJob, 'createdAt' | 'dismissed'> & { replaceId?: string }) => {
    const { replaceId, ...j } = job;
    if (replaceId && replaceId !== j.id) removeVideoJob(replaceId); // sostituisce il job temporaneo
    setVideoJobs(upsertVideoJob({ ...j, createdAt: Date.now() }));
  }, []);

  // Sync col server: al mount, al ritorno sul tab, e ogni 20s mentre ci sono
  // render in corso. Fonde lo stato server (vince su done/failed) nel locale.
  const syncServerVideoJobs = useCallback(async () => {
    const server = await fetchServerVideoJobs();
    if (server.length) setVideoJobs(mergeServerJobs(server));
  }, []);
  useEffect(() => { void syncServerVideoJobs(); }, [syncServerVideoJobs]);
  useEffect(() => {
    const onVis = () => { if (document.visibilityState === 'visible') void syncServerVideoJobs(); };
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, [syncServerVideoJobs]);

  // Polling a livello app: feedback rapido in sessione (il cron e' la rete di
  // sicurezza server-side). Per ogni job in render interroga il progresso ogni
  // ~20s; in piu' rilegge dal server per allinearsi a chi finalizza per primo.
  useEffect(() => {
    const active = videoJobs.filter(j => j.stage === 'render');
    if (!active.length) return;
    let cancelled = false;
    const timer = setInterval(async () => {
      for (const job of videoJobs.filter(j => j.stage === 'render')) {
        // Rete di sicurezza: un render bloccato da oltre 30 min e' morto (anche i
        // construction/Veo finiscono ben prima). Lo si chiude come fallito cosi'
        // non resta a occupare uno slot e impedire nuovi render all'infinito.
        if (Date.now() - (job.createdAt || 0) > deadTimeoutMs(job.template)) {
          setVideoJobs(patchVideoJob(job.id, { stage: 'failed', error: 'Render interrotto (timeout)' }));
          continue;
        }
        const renderId = (job.ctx as { renderId?: string } | undefined)?.renderId;
        // Job temporaneo (pre-render, ctx vuoto): non si polla, avanza piano.
        if (!renderId) {
          // Un render sano ottiene un renderId in pochi secondi. Se dopo 3 min
          // un job 'prep' non ce l'ha ancora, l'avvio è fallito (es. backend non
          // raggiungibile): lo chiudiamo come fallito così non resta uno
          // skeleton infinito in galleria e un contatore fantasma.
          if (Date.now() - (job.createdAt || 0) > prepTimeoutMs(job.template)) {
            setVideoJobs(patchVideoJob(job.id, { stage: 'failed', error: 'Avvio non riuscito' }));
            continue;
          }
          // Avanzamento "finto" ma sempre in movimento: si avvicina al soffitto del
          // prep con un incremento minimo garantito -> non sembra mai fermo.
          const ceil = prepCeiling(job.template);
          const cur = job.progress || 0;
          setVideoJobs(patchVideoJob(job.id, { progress: Math.min(ceil, cur + Math.max(0.006, (ceil - cur) * 0.1)) }));
          continue;
        }
        try {
          const p = await pollRenderProgress(job.ctx);
          if (cancelled) return;
          if (p?.done && p.outputUrl) {
            setVideoJobs(patchVideoJob(job.id, { stage: 'done', progress: 1, outputUrl: p.outputUrl }));
            if (routeRef.current !== 'media') setGalleryUnseen(n => n + 1); // video pronto -> badge galleria
          } else if (p?.error || (p?.done && (p as unknown as { fatalErrorEncountered?: string }).fatalErrorEncountered)) {
            setVideoJobs(patchVideoJob(job.id, { stage: 'failed', error: p.error || (p as unknown as { fatalErrorEncountered?: string }).fatalErrorEncountered }));
          } else {
            // Usa il progress reale dall'edge (Veo/Lambda); fallback a +0.04.
            const real = typeof (p as unknown as { overallProgress?: number }).overallProgress === 'number' ? (p as unknown as { overallProgress: number }).overallProgress : 0;
            // I template a stato (construction/video_cuts) avanzano restituendo
            // un nuovo videoCutsJobs/constructionJobs: va RISALVATO nel ctx, altrimenti
            // il prossimo poll rimanda lo stato vecchio e il render non avanza mai
            // (resta bloccato al 96%) se la cron non gira.
            const pj = p as unknown as { videoCutsJobs?: unknown; constructionJobs?: unknown };
            const patch: Partial<VideoJob> = { progress: Math.min(0.96, Math.max(job.progress || 0, real, (job.progress || 0) + 0.04)) };
            if (pj.videoCutsJobs || pj.constructionJobs) {
              patch.ctx = {
                ...job.ctx,
                ...(pj.videoCutsJobs ? { videoCutsJobs: pj.videoCutsJobs } : {}),
                ...(pj.constructionJobs ? { constructionJobs: pj.constructionJobs } : {}),
              };
            }
            setVideoJobs(patchVideoJob(job.id, patch));
          }
        } catch (e) { console.warn('[video-poll] tick fallito (riprovo):', (e as Error)?.message); /* transiente */ }
      }
      if (!cancelled) await syncServerVideoJobs();
    }, 20000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [videoJobs, syncServerVideoJobs]);

  // Tutorial iniziale: appare UNA SOLA VOLTA (flag persistente). Ri-attivabile
  // da menu Profilo > Tutorial / cmdk. Init false per evitare mismatch SSR; un
  // effetto lo apre al primo accesso se non ancora visto.
  // Flag PER-UTENTE: un account nuovo deve vedere l'onboarding anche se nello
  // stesso browser un altro account l'aveva gia' chiuso (il vecchio flag globale
  // 'gnm_tutorial_seen' lo impediva, per questo non partiva).
  const tutorialKey = userData?.id ? `gnm_tutorial_seen_${userData.id}` : null;
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  useEffect(() => {
    if (typeof window === 'undefined' || !tutorialKey) return;
    // Server flag is the source of truth: localStorage gets wiped on logout (gnm_*
    // cleanup) / new device, which used to replay onboarding for existing accounts.
    if (userData?.onboardingCompleted) { try { localStorage.setItem(tutorialKey, '1'); } catch { /* quota */ } return; }
    if (!localStorage.getItem(tutorialKey)) { setWelcomeOpen(true); setRoute('brand'); }
  }, [tutorialKey, userData?.onboardingCompleted]);
  const markTutorialSeen = useCallback(() => {
    try { if (tutorialKey) localStorage.setItem(tutorialKey, '1'); } catch { /* quota */ }
    // Persist server-side so re-login / another device never replays onboarding.
    if (userData?.id) supabase.from('user_credits').update({ onboarding_completed: true }).eq('user_id', userData.id).then(() => {}, () => {});
  }, [tutorialKey, userData?.id]);
  const tourReplayRef = useRef(false);

  // Quota free trial (foto + video) per spiegarla in onboarding / empty state.
  // Numeri NON hardcoded: letti dalla quota reale. Solo per utenti free.
  const [freeTrial, setFreeTrial] = useState<{ photos: number; videos: number } | null>(null);
  useEffect(() => {
    // 'free'/null = non pagante -> mostra la quota di prova. Solo i piani a
    // pagamento (agency_*) la nascondono. ('free' e' un tier reale, non l'assenza.)
    const isPaidPlan = !!userData?.subscriptionType && userData.subscriptionType !== 'free';
    if (isPaidPlan) { setFreeTrial(null); return; }
    let cancelled = false;
    (async () => {
      const [sq, vq] = await Promise.all([fetchStagingQuota(), fetchVideoQuota()]);
      if (cancelled) return;
      setFreeTrial({ photos: sq?.remaining ?? 0, videos: vq?.remaining ?? 0 });
    })();
    return () => { cancelled = true; };
  }, [userData?.subscriptionType]);
  const closeWelcome = useCallback(() => { setWelcomeOpen(false); markTutorialSeen(); }, [markTutorialSeen]);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [tourRect, setTourRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [tourRect2, setTourRect2] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [demoJobsDone, setDemoJobsDone] = useState(false);
  const [tourCtaRect, setTourCtaRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
  const [hlFading, setHlFading] = useState(false);
  const hlFadeTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [trayOpen, setTrayOpen] = useState(false);
  const prevTrayOpen = useRef(trayOpen);
  
  useEffect(() => {
    if (prevTrayOpen.current && !trayOpen) {
      let changed = false;
      batches.forEach(b => {
        if (b.status === 'completed') {
          dismissBatch(b.id);
          changed = true;
        }
      });
      if (changed) setBatches([...batches]);
    }
    prevTrayOpen.current = trayOpen;
  }, [trayOpen, batches, setBatches]);
  useEffect(() => {
    if (tourStep !== null && TOUR_DEFS[tourStep]?.sel === '[data-tour-dropdown]' && !projOpen) {
      setProjOpen(true);
    }
  }, [tourStep, projOpen]);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const { data: notifications = [], mutate: mutateNotifs } = useSWR('notifications', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return [];
    const { data } = await supabase.from('notifications').select('*').order('created_at', { ascending: false }).limit(20);
    return (data || []) as AppNotification[];
  }, { refreshInterval: 15000 });
  const profileRef = React.useRef<HTMLDivElement>(null);
  const notifRef = React.useRef<HTMLDivElement>(null);
  const [cmdkOpen, setCmdkOpen] = useState(false);
  const [cmdQuery, setCmdQuery] = useState('');
  const [toasts, setToasts] = useState<Toast[]>([]);
  const { data: brandData, mutate: mutateBrand } = useSWR('brand', fetchBrand);
  const rawBrand = brandData?.settings ?? DEFAULT_BRAND_SETTINGS;
  const brandRole = brandData?.role ?? null;
  // Accesso Agenzia: piano agency diretto OPPURE membro di un team agenzia.
  const inAgencyTeam = !!brandData?.isTeamMember;
  const hasAgency = isAgencyTier(userData?.subscriptionType) || inAgencyTeam;
  // Free: brand GetNearMe forzato (loghi non rimovibili, usati in watermark/outro).
  // I membri di un team agenzia NON sono free per il brand.
  const isFreePlan = (!userData?.subscriptionType || userData.subscriptionType === 'free') && !inAgencyTeam;
  const brandLocked = isFreePlan;
  const brand = useMemo(() => brandLocked ? { ...rawBrand, logos: gnmBrandLogos() } : rawBrand, [brandLocked, rawBrand]);
  
  const setBrand = useCallback((updater: React.SetStateAction<BrandSettings>) => {
    mutateBrand(prev => {
      if (!prev) return prev;
      const nextBrand = typeof updater === 'function' ? (updater as any)(prev.settings) : updater;
      return { ...prev, settings: nextBrand };
    }, false);
  }, [mutateBrand]);

  const active = useMemo(() => projects.find((p) => p.id === activeProject) ?? projects[0], [projects, activeProject]);

  useEffect(() => { localStorage.setItem('gnm_active_project', activeProject); }, [activeProject]);
  useEffect(() => { setRouteKey(k => k + 1); }, [activeProject]);
  useEffect(() => { cleanupOldMedia().catch(console.error); }, []);

  useEffect(() => {
    if (!document.getElementById('poppins-font')) {
      const link = document.createElement('link');
      link.id = 'poppins-font';
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  const toast = useCallback((msg: string, icon = 'check', link?: { href: string; label: string }) => {
    const id = Date.now() + Math.random();
    setToasts((t) => {
      const next = [...t, { id, msg, icon, link }];
      return next.slice(-2);
    });
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), link ? 8000 : 4000);
  }, []);

  // Auto-join: se l'utente ha un invito team pending per la sua email, lo accetta
  // al primo caricamento (una volta per sessione utente). Il toast "aggiunto al
  // team" NON esce subito: aspetta la fine dell'onboarding (welcome + tour).
  const autoJoinedRef = useRef(false);
  const [pendingTeamToast, setPendingTeamToast] = useState<string | null>(null);
  useEffect(() => {
    if (autoJoinedRef.current || !userData?.id) return;
    autoJoinedRef.current = true;
    autoJoinTeam().then((res) => {
      if (res.data?.success && res.data.team_name) setPendingTeamToast(res.data.team_name);
    }).catch(() => {});
  }, [userData?.id]);
  // Mostra il toast solo a onboarding concluso (welcome chiuso e nessuno step tour).
  useEffect(() => {
    if (pendingTeamToast && !welcomeOpen && tourStep === null) {
      toast(`Sei stato aggiunto al team "${pendingTeamToast}"`, 'check');
      setPendingTeamToast(null);
    }
  }, [pendingTeamToast, welcomeOpen, tourStep, toast]);

  const contentRef = React.useRef<HTMLDivElement>(null);
  const [routeKey, setRouteKey] = useState(0);
  const [studioPhoto, setStudioPhoto] = useState<string | null>(null);
  // Badge "+N" sulla voce Galleria: contenuti creati non ancora visti.
  const [galleryUnseen, setGalleryUnseen] = useState(0);
  const routeRef = useRef(route);
  useEffect(() => { routeRef.current = route; }, [route]);
  const [accountTierHint, setAccountTierHint] = useState<PlanTier | null>(null);
  const go = useCallback((r: string, params?: { photoUrl?: string; tier?: PlanTier }) => {
    setRoute(r);
    setRouteKey(k => k + 1);
    if (r === 'media') setGalleryUnseen(0);
    if ((r === 'studio' || r === 'video') && params?.photoUrl) setStudioPhoto(params.photoUrl);
    else if (r !== 'studio' && r !== 'video') setStudioPhoto(null);
    if (r === 'account' && params?.tier) setAccountTierHint(params.tier);
    else if (r !== 'account') setAccountTierHint(null);
    setProjOpen(false); setTrayOpen(false); setProfileOpen(false); contentRef.current?.scrollTo(0, 0);
  }, []);
  const closeMenus = useCallback(() => { if (tourStep !== null && TOUR_DEFS[tourStep]?.sel === '[data-tour-dropdown]') return; setProjOpen(false); setTrayOpen(false); setProfileOpen(false); setNotifOpen(false); }, [tourStep]);

  // ⌘K
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); setCmdkOpen(true); setCmdQuery(''); }
      if (e.key === 'Escape') { setCmdkOpen(false); if (tourStep === null || TOUR_DEFS[tourStep]?.sel !== '[data-tour-dropdown]') setProjOpen(false); setTrayOpen(false); setProfileOpen(false); }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, []);

  // Tour measuring
  const scheduleFadeIn = useCallback(() => {
    hlFadeTimer.current = setTimeout(() => setHlFading(false), 60);
  }, []);
  const tourMeasure = useCallback((i: number, skipStep?: boolean) => {
    let idx = i;
    while (idx < TOUR_DEFS.length) {
      const sel = TOUR_DEFS[idx].sel;
      if (sel === '@center') { setTourStep(idx); scheduleFadeIn(); return; }
      // Mobile: ogni step è una card centrata, niente spotlight su elementi
      // della sidebar off-canvas. Salta la misurazione DOM.
      if (isMobile) { if (!skipStep) setTourStep(idx); setTourRect(null); setTourRect2(null); setTourCtaRect(null); scheduleFadeIn(); return; }
      const el = document.querySelector(sel);
      if (el) {
        const r = el.getBoundingClientRect();
        const rect = { x: r.x, y: r.y, w: r.width, h: r.height };
        if (sel === '[title="Lavori in corso"]') {
          const btn = el.querySelector('button');
          const tray = el.querySelector('[data-tour-tray]');
          if (btn && tray) {
            const br = btn.getBoundingClientRect();
            const tr = tray.getBoundingClientRect();
            if (!skipStep) setTourStep(idx);
            setTourRect({ x: br.x, y: br.y, w: br.width, h: br.height });
            setTourRect2({ x: tr.x, y: tr.y, w: tr.width, h: tr.height });
            scheduleFadeIn();
            return;
          }
        }
        if (sel === '[data-tour-dropdown]') {
          const cta = el.querySelector('[data-tour="new-project"]');
          if (cta) { const cr = cta.getBoundingClientRect(); setTourCtaRect({ x: cr.x, y: cr.y, w: cr.width, h: cr.height }); }
          else setTourCtaRect(null);
          // Tight rect: trigger bar (children[0]) top → popup card (children[1]) bottom.
          const trig = el.children[0]?.getBoundingClientRect();
          const popup = el.children[1]?.getBoundingClientRect();
          const left = Math.min(trig?.left ?? r.left, popup?.left ?? r.left);
          const right = Math.max(trig?.right ?? r.right, popup?.right ?? r.right);
          const top = trig?.top ?? r.top;
          const bottom = popup?.bottom ?? r.bottom;
          const combined = { x: left, y: top, w: right - left, h: bottom - top };
          if (!skipStep) setTourStep(idx);
          setTourRect(combined); setTourRect2(null); scheduleFadeIn(); return;
        } else { setTourCtaRect(null); }
        if (!skipStep) setTourStep(idx);
        setTourRect(rect); setTourRect2(null); scheduleFadeIn(); return;
      }
      idx++;
    }
    setTourStep(null); setTourRect(null); setTourRect2(null);
  }, [scheduleFadeIn, isMobile]);
  const tourGo = useCallback((n: number) => {
    if (n >= TOUR_DEFS.length || n < 0) { setTourStep(null); setTrayOpen(false); setTourRect2(null); setDemoJobsDone(false); return; }
    const def = TOUR_DEFS[n];
    const m = def.sel.match(/\[title="(.+?)"\]/);
    if (m && TOUR_LABEL_TO_ROUTE[m[1]]) go(TOUR_LABEL_TO_ROUTE[m[1]]);
    else if (def.sel.includes('tour-dropdown')) go('immobili');
    const isTray = def.sel === '[title="Lavori in corso"]';
    const isCenter = def.sel === '@center';
    const isNewProj = def.sel.includes('tour-dropdown');
    // Lo step dropdown finale NON deve fare fade: il buco sopra il dropdown deve
    // comparire gia' pronto (overlay scuro pieno + cutout istantaneo).
    const needsFade = n === 0 || isCenter;
    if (needsFade) {
      setHlFading(true);
      if (hlFadeTimer.current) clearTimeout(hlFadeTimer.current);
    }
    if (isNewProj) {
      setHlFading(true);
      if (hlFadeTimer.current) clearTimeout(hlFadeTimer.current);
      setTourRect(null); setTourRect2(null);
    }
    else { if (!isCenter) setDemoJobsDone(false); setTourRect2(null); }
    setTrayOpen(isTray);
    if (isMobile) {
      // Mobile: card centrata per ogni step, niente spotlight/measure.
      if (isNewProj) setProjOpen(false);
      setTourRect(null); setTourRect2(null); setTourCtaRect(null);
      setTourStep(n); scheduleFadeIn();
    } else if (isNewProj) {
      setProjOpen(true);
      setTourStep(n);
      setTimeout(() => tourMeasure(n), 120);
      setTimeout(() => tourMeasure(n), 300);
    } else if (needsFade) {
      setTourStep(n);
      setTimeout(() => tourMeasure(n), 60);
    } else {
      setTimeout(() => tourMeasure(n, true), isTray ? 250 : 60);
      setTimeout(() => setTourStep(n), 400);
    }
  }, [tourMeasure, go, isMobile, scheduleFadeIn]);
  const startTour = useCallback(() => {
    setWelcomeOpen(false); markTutorialSeen(); setCollapsed(false); setTourStep(0); setTourRect(null); setTourRect2(null); setDemoJobsDone(false); setTrayOpen(false);
    setHlFading(true); if (hlFadeTimer.current) clearTimeout(hlFadeTimer.current);
    go('brand');
    setTimeout(() => tourMeasure(0), 350);
  }, [tourMeasure, markTutorialSeen, go]);

  // ---- derived: checklist ----

  const projList = projects.filter((p) => !projQuery || (p.nome + ' ' + p.addr).toLowerCase().includes(projQuery.toLowerCase()));

  // ⌘K results
  const cmdq = cmdQuery.toLowerCase();
  // Solo feature disponibili (= sidebar). Le voci nascoste per ora (Team,
  // Calendario, Account social) NON vanno mostrate nemmeno qui.
  const cmdTools = [
    ['Foto AI', 'staging', 'sparkles'], ['Video AI', 'video', 'film'], ['Montaggio', 'montaggio', 'scissors'],
    ['Post Social', 'studio', 'megaphone'], ['Galleria', 'media', 'images'],
    ['Brand Agenzia', 'brand', 'palette'], ['Piano e crediti', 'account', 'credit-card'],
  ] as const;
  // Voci disponibili dal menu profilo (non in sidebar).
  const cmdActions: [string, string, string, () => void][] = [
    ['Impostazioni', 'settings', 'Account', () => { setCmdkOpen(false); go('impostazioni'); }],
    ['Assistenza', 'life-buoy', 'Supporto', () => { setCmdkOpen(false); go('assistenza'); }],
    ['Tutorial', 'play-circle', 'Guida', () => { setCmdkOpen(false); tourReplayRef.current = true; setWelcomeOpen(true); }],
  ];
  const cmdResults: { label: string; sub: string; icon: string; go: () => void }[] = [];
  cmdTools.filter((t) => !cmdq || t[0].toLowerCase().includes(cmdq)).forEach((t) => cmdResults.push({ label: t[0], sub: 'Strumento', icon: t[2], go: () => { setCmdkOpen(false); go(t[1]); } }));
  cmdActions.filter((a) => !cmdq || a[0].toLowerCase().includes(cmdq)).forEach((a) => cmdResults.push({ label: a[0], sub: a[2], icon: a[1], go: a[3] }));
  // Progetti: solo se cercati (niente lista di default).
  if (cmdq) projects.filter((p) => (p.nome + ' ' + p.addr).toLowerCase().includes(cmdq)).forEach((p) => cmdResults.push({ label: p.nome, sub: p.addr, icon: 'building-2', go: () => { setCmdkOpen(false); setActiveProject(p.id); go('home'); } }));

  const tipRef = tourRect2 || tourRect;
  const TIP_W = 270; // deve combaciare con la width del tooltip (vedi card style sotto)
  const wW = typeof window !== 'undefined' ? window.innerWidth : 9999;
  const onRight = tipRef && tipRef.x > wW - 420;
  // Quando il tooltip va sotto l'elemento evidenziato (onRight), centralo
  // orizzontalmente sulla parte interessata invece di allinearlo a destra,
  // clampato ai bordi viewport.
  const tipL = tipRef
    ? (onRight
        ? Math.max(16, Math.min(wW - TIP_W - 16, tipRef.x + tipRef.w / 2 - TIP_W / 2))
        : tipRef.x + tipRef.w + 20)
    : 0;
  const tipT = tipRef ? (onRight ? tipRef.y + tipRef.h + 16 : Math.max(16, tipRef.y - 12)) : 0;
  const tdef = tourStep !== null ? TOUR_DEFS[tourStep] : TOUR_DEFS[0];
  // Mobile: card centrata per ogni step (la sidebar è off-canvas, niente spotlight).
  const cardCentered = isMobile || tdef.sel === '@center';

  return (
    <div style={{ fontFamily: 'inherit', color: 'var(--text-main)', height: '100vh', overflow: 'hidden', background: '#faf9f7', fontSize: 13, lineHeight: 1.45 }}>

      {/* WELCOME MODAL */}
      {welcomeOpen && (
        <div style={s('position:fixed;inset:0;background:rgba(24,21,17,.6);backdrop-filter:blur(4px);z-index:95;display:flex;align-items:center;justify-content:center;padding: 20px')}>
          <div style={{ background: 'linear-gradient(160deg, #eef4fe 0%, var(--bg-hover) 100%)', borderRadius: 22, boxShadow: '0 32px 80px rgba(0,0,0,.15), 0 2px 16px rgba(0,0,0,.05)', width: '100%', maxWidth: 396, overflow: 'hidden', position: 'relative', padding: '40px 36px 29px', textAlign: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div style={{ width: 61, height: 61, background: 'var(--bg-card)', borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px', boxShadow: '0 8px 24px rgba(33,31,28,.1)' }}>
              <img src="/dashboard/logo-icon.svg" alt="GetNearMe" style={{ width: 36, height: 36 }} />
            </div>
            <h2 style={s('margin: 0 0 4px;font-size:24px;font-weight:800;letter-spacing:-.6px;color:#1a1a1a')}>Benvenuto su GetNearMe</h2>
            <p style={s('margin: 0 auto 18px;max-width:333px;color:var(--text-sec);font-size:14px;line-height:1.5')}>Foto, video e post curati per i tuoi annunci, pronti in pochi minuti. Ti facciamo vedere come.</p>
            <Box as="button" onClick={startTour} style={s('width:100%;border:none;background:#3B83F6;color:var(--bg-card);font-size:14px;font-weight:700;padding: 12px 25px;border-radius:11px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap: 6px;min-height:43px;transition:all .2s')} hover={s('background:#2b6fe0;transform:translateY(-1px);box-shadow:0 8px 24px rgba(59,131,246,.28)')}>
              Fai un giro veloce
            </Box>
            <Box as="button" onClick={() => { closeWelcome(); setCollapsed(false); tourGo(TOUR_DEFS.length - 2); }} style={s('display:block;margin: 13px auto 0;text-align:center;width:fit-content;border:none;background:transparent;color:var(--text-muted);font-size:13px;font-weight:600;padding: 6px 11px;border-radius:7px;cursor:pointer;transition:color .2s')} hover={{ color: 'var(--text-sec)' }}>
              Salta e inizia subito
            </Box>
          </div>
        </div>
      )}

      {/* TOUR COACHMARK */}
      {tourStep !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 101, pointerEvents: 'none', animation: 'tour-fade-only .5s ease forwards' }}>
          {(() => {
            const isNP = tdef.sel === '[data-tour-dropdown]';
            const pad = 6;
            const rad = 14;
            const cx = tourRect ? tourRect.x - pad : 0;
            const cy = tourRect ? tourRect.y - pad : 0;
            const cw = tourRect ? tourRect.w + pad * 2 : 0;
            const ch = tourRect ? tourRect.h + pad * 2 : 0;
            const hasCutout = !isMobile && tourRect && tdef.sel !== '@center';
            const hasDual = !isMobile && tourRect && tourRect2;
            const cutoutOpacity = hlFading ? 0 : 1;
            const interp = 'x .8s cubic-bezier(.16,1,.3,1), y .8s cubic-bezier(.16,1,.3,1), width .8s cubic-bezier(.16,1,.3,1), height .8s cubic-bezier(.16,1,.3,1)';
            return (
              <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none' }}>
                <defs>
                  <mask id="tour-mask">
                    <rect width="100%" height="100%" fill="white" />
                    {hasDual ? (
                      <>
                        <rect style={{ opacity: cutoutOpacity, transition: `opacity .6s ease, ${interp}` }} x={tourRect.x - 6} y={tourRect.y - 6} width={tourRect.w + 12} height={tourRect2.y + tourRect2.h + 6 - (tourRect.y - 6)} rx={14} fill="black" />
                        <rect style={{ opacity: cutoutOpacity, transition: `opacity .6s ease, ${interp}` }} x={tourRect2.x - 6} y={tourRect2.y - 6} width={tourRect2.w + 12} height={tourRect2.h + 12} rx={14} fill="black" />
                      </>
                    ) : hasCutout ? (
                      <rect style={{ opacity: cutoutOpacity, transition: `opacity .6s ease, ${interp}` }} x={cx} y={cy} width={cw} height={ch} rx={rad} fill="black" />
                    ) : null}
                  </mask>
                </defs>
                <rect width="100%" height="100%" fill="rgba(24,21,17,.55)" mask="url(#tour-mask)" />
              </svg>
            );
          })()}

          {/* Il catcher a tutto schermo — blocca click fuori senza chiudere il tour */}
          {(isMobile || !tourRect || tdef.sel === '@center' || tourRect2) && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }} />
          )}

          {/* I 4 muri invisibili per gli step con tourRect (singolo), lasciano un buco fisico per far passare click/hover */}
          {!isMobile && tourRect && !tourRect2 && tdef.sel !== '@center' && (
            (() => {
              const pad = 6;
              return (
                <>
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: Math.max(0, tourRect.y - pad), pointerEvents: 'auto' }} />
                  <div style={{ position: 'absolute', top: tourRect.y + tourRect.h + pad, left: 0, right: 0, bottom: 0, pointerEvents: 'auto' }} />
                  <div style={{ position: 'absolute', top: Math.max(0, tourRect.y - pad), left: 0, width: Math.max(0, tourRect.x - pad), height: tourRect.h + pad*2, pointerEvents: 'auto' }} />
                  <div style={{ position: 'absolute', top: Math.max(0, tourRect.y - pad), left: tourRect.x + tourRect.w + pad, right: 0, height: tourRect.h + pad*2, pointerEvents: 'auto' }} />
                </>
              );
            })()
          )}
          {tdef.sel !== '[data-tour="new-project"]' && (isMobile || tdef.sel !== '[data-tour-dropdown]') && (cardCentered || tourRect) && (
            <div key={cardCentered ? 'center' : 'tip'} style={cardCentered
              ? { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 324, maxWidth: 'calc(100vw - 32px)', background: 'var(--bg-card)', borderRadius: 14, boxShadow: '0 24px 64px rgba(20,18,15,.32)', padding: '20px 22px', animation: 'tour-fade-in .5s cubic-bezier(0.16, 1, 0.3, 1) forwards', pointerEvents: 'auto' }
              : { position: 'absolute', left: tipL, top: tipT, width: 270, background: 'var(--bg-card)', borderRadius: 11, boxShadow: '0 16px 48px rgba(20,18,15,.3)', padding: '16px 18px 18px', pointerEvents: 'auto', transition: 'left .8s cubic-bezier(0.16, 1, 0.3, 1), top .8s cubic-bezier(0.16, 1, 0.3, 1), opacity .3s ease' }}>
              <TourAnim key={tourStep} kind={tdef.anim} />
              {tdef.sel !== '@center' && tdef.sel !== '[data-tour-dropdown]' && (
                <div style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:5px')}>
                  <span style={s('font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#1d5fd0')}>{(tourStep + 1) + ' di ' + (TOUR_DEFS.length - 2)}</span>
                  <span onClick={() => { go('immobili'); tourGo(TOUR_DEFS.length - 2); }} style={s('font-size:11px;font-weight:600;color:#b3aca1;cursor:pointer;padding: 4px')}>Salta il tour</span>
                </div>
              )}
              {tdef.sel === '@center' && (
                <div style={s('font-size:29px;text-align:center;margin-bottom:14px')}>🎉</div>
              )}
              <div style={s(`font-size:16px;font-weight:800;letter-spacing:-.2px;margin-bottom:4px;${tdef.sel === '@center' ? 'text-align:center;' : ''}`)}>{tdef.title}</div>
              <div style={s(`font-size:13px;color:var(--text-sec);line-height:1.5;margin-bottom:16px;${tdef.sel === '@center' ? 'text-align:center;' : ''}`)}>{tdef.text}</div>
              <div style={{ height: 1, background: 'var(--border-light)', margin: '0 0 14px' }} />
              <div style={s('display:flex;align-items:center;justify-content:space-between')}>
                {tourStep > 0 && tdef.sel !== '@center' && <Box as="button" onClick={() => tourGo(tourStep - 1)} style={s('border:1px solid var(--border-main);background:var(--bg-card);font-size:11px;font-weight:700;padding: 7px 14px;border-radius:7px;cursor:pointer;min-height:34px')} hover={s('background:var(--bg-hover)')}>Indietro</Box>}
                {tdef.sel === '@center'
                  ? (tourReplayRef.current
                    ? <Box as="button" onClick={() => { tourReplayRef.current = false; setTourStep(null); setTourRect(null); setTourRect2(null); setProjOpen(false); go('home'); }} style={s('border:none;background:#3B83F6;color:var(--bg-card);font-size:12px;font-weight:700;padding: 10px 16px;border-radius:7px;cursor:pointer;width:100%;text-align:center;display:flex;align-items:center;justify-content:center;min-height:40px')} hover={s('background:#2b6fe0;transform:translateY(-1px);box-shadow:0 8px 20px rgba(59,131,246,.25)')}>Ho capito</Box>
                    : <Box as="button" onClick={() => tourGo(tourStep + 1)} style={s('border:none;background:#3B83F6;color:var(--bg-card);font-size:12px;font-weight:700;padding: 10px 16px;border-radius:7px;cursor:pointer;width:100%;text-align:center;display:flex;align-items:center;justify-content:center;min-height:40px')} hover={s('background:#2b6fe0;transform:translateY(-1px);box-shadow:0 8px 20px rgba(59,131,246,.25)')}>Avanti</Box>)
                  : tdef.sel === '[data-tour-dropdown]'
                  ? <Box as="button" onClick={() => { const replay = tourReplayRef.current; tourReplayRef.current = false; setTourStep(null); setTourRect(null); setTourRect2(null); setProjOpen(false); if (replay) { go('home'); } else if (inAgencyTeam) { go('immobili'); } else { setNewProjOpen(true); } }} style={s('border:none;background:#3B83F6;color:var(--bg-card);font-size:12px;font-weight:700;padding: 10px 16px;border-radius:7px;cursor:pointer;width:100%;text-align:center;display:flex;align-items:center;justify-content:center;min-height:40px')} hover={s('background:#2b6fe0;transform:translateY(-1px);box-shadow:0 8px 20px rgba(59,131,246,.25)')}>{tourReplayRef.current ? 'Ho capito' : (inAgencyTeam ? 'Vedi gli immobili' : 'Aggiungi immobile')}</Box>
                  : <Box as="button" onClick={() => tourGo(tourStep + 1)} style={s('border:none;background:#3B83F6;color:var(--bg-card);font-size:11px;font-weight:700;padding: 7px 16px;border-radius:7px;cursor:pointer;margin-left:auto;min-height:34px')} hover={s('background:#2b6fe0')}>Avanti</Box>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* APP SHELL */}
      <div data-app-shell style={{ display: 'flex', height: '100%', ['--gnm-content-left' as string]: collapsed ? '58px' : '227px' } as React.CSSProperties}>
        {/* SIDEBAR */}
        <div className={`max-md:!fixed max-md:!inset-y-0 max-md:!left-0 max-md:!z-[100] max-md:!w-64 max-md:!shadow-2xl max-md:!flex ${mobileMenuOpen ? 'max-md:!translate-x-0' : 'max-md:!-translate-x-full'}`} style={{ width: collapsed ? 58 : 227, flex: 'none', background: 'var(--bg-card)', borderRight: '1px solid var(--border-light)', display: 'flex', flexDirection: 'column', transition: 'width .25s ease, transform .3s cubic-bezier(.4,0,.2,1)', overflow: 'hidden' }}>
          <div style={s('height:58px;flex:none;display:flex;align-items:center;padding:0 18px;overflow:hidden;justify-content:space-between')}>
            <div style={{ width: collapsed ? 24 : 117, overflow: 'hidden', flex: 'none' }}><img src="/dashboard/logo.svg" alt="GetNearMe" style={{ height: 22, maxWidth: 'none' }} /></div>
            {mobileMenuOpen && (
              <Box as="button" onClick={() => setMobileMenuOpen(false)} className="md:!hidden" style={s('border:none;background:transparent;width:29px;height:29px;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center')} hover={s('background:#f1efe9')}><Icon name="x" size={16} /></Box>
            )}
          </div>
          <div style={s('flex:1;overflow-y:auto;overflow-x:hidden;padding:5px 0 14px')}>
            {NAV_SECTIONS.map((sec, si) => {
              const items = sec.items.filter(it => it.route !== 'team' || hasAgency || isFreePlan);
              if (!items.length) return null;
              return (
              <div key={si} style={{ marginBottom: 4 }}>
                {sec.label && !collapsed && <div title={sec.label === 'Immobile attivo' ? (active?.addr || active?.nome || '') : undefined} style={s('font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#b3aca1;padding:13px 20px 5px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:100%')}>{sec.label === 'Immobile attivo' ? (active?.addr || active?.nome || 'Immobile attivo') : sec.label}</div>}
                {items.map((it) => {
                  const a = route === it.route || (it.route === 'progetti' && route === 'progetto');
                  const tourActive = tourStep !== null && TOUR_DEFS[tourStep]?.sel === `[title="${it.label}"]`;
                  const highlighted = a || tourActive;
                  // Senza immobili: Report e tutta la sezione "Immobile attivo" disattivate.
                  const needsProject = sec.label === 'Immobile attivo' || it.route === 'report';
                  const disabled = tourStep === null && needsProject && projects.length === 0;
                  return (
                    <Box key={it.route} onClick={tourStep !== null ? undefined : (disabled ? () => toast('Crea prima un immobile', 'x') : () => { go(it.route); setMobileMenuOpen(false); })} title={disabled ? 'Crea prima un immobile' : it.label} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: '9px 11px', margin: '1px 9px', borderRadius: 11, cursor: tourStep !== null ? 'default' : (disabled ? 'not-allowed' : 'pointer'), background: highlighted ? '#f1efe9' : 'transparent', color: disabled ? 'var(--text-muted)' : (highlighted ? 'var(--text-main)' : 'var(--text-sec)'), fontWeight: highlighted ? 700 : 500, fontSize: 13, whiteSpace: 'nowrap', minHeight: 34, opacity: disabled ? 0.45 : 1 }} hover={tourStep !== null || disabled ? {} : { background: 'var(--bg-hover)' }}>
                      <Icon name={it.icon} size={16} color={disabled ? 'var(--text-muted)' : (highlighted ? 'var(--text-main)' : 'var(--text-sec)')} />
                      {!collapsed && <span>{it.label}</span>}
                      {it.route === 'media' && galleryUnseen > 0 && (
                        <span style={{ marginLeft: 'auto', flexShrink: 0, background: '#3B83F6', color: '#fff', fontSize: 10, fontWeight: 700, lineHeight: 1, width: 18, height: 18, padding: 0, borderRadius: 5, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                          +{galleryUnseen}
                        </span>
                      )}
                    </Box>
                  );
                })}
              </div>
              );
            })}
          </div>
          <div
            ref={profileRef}
            onMouseEnter={() => { if (hoverNav) setProfileOpen(true); }}
            onMouseLeave={() => { if (hoverNav) setProfileOpen(false); }}
            style={{ flex: 'none', borderTop: '1px solid var(--border-light)', padding: collapsed ? '11px 5px' : '11px 9px' }}
          >
            <Box onClick={(e) => { e.stopPropagation(); setProfileOpen(o => !o); setProjOpen(false); setTrayOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 11, padding: collapsed ? '0' : '9px 11px', borderRadius: collapsed ? '50%' : 11, cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start', width: collapsed ? 38 : 'auto', height: collapsed ? 38 : 'auto', margin: collapsed ? '0 auto' : 0 }} hover={{ background: '#f1efe9' }}>
              {userData?.avatarUrl
                // eslint-disable-next-line @next/next/no-img-element
                ? <img src={userData.avatarUrl} alt="" referrerPolicy="no-referrer" style={{ width: 31, height: 31, borderRadius: '50%', objectFit: 'cover', flex: 'none' }} />
                : <div style={s('width:31px;height:31px;border-radius:50%;background:var(--text-main);color:var(--bg-card);display:flex;align-items:center;justify-content:center;font-size:12px;font-weight:700;flex:none')}>{(userData?.email ?? 'U')[0].toUpperCase()}</div>}
              {!collapsed && <div style={{ minWidth: 0, flex: 1 }}><div style={s('font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{userData?.email?.split('@')[0] ?? 'Utente'}</div><div style={s('font-size:10px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{userData?.email ?? ''}</div></div>}
              {!collapsed && <Icon name="chevron-up" size={13} color="var(--text-muted)" style={{ transition: 'transform .2s', transform: profileOpen ? 'none' : 'rotate(180deg)' }} />}
            </Box>
            {profileOpen && (() => {
              const rect = profileRef.current?.getBoundingClientRect();
              const left = rect ? rect.left + 10 : 10;
              const w = rect ? rect.width - 20 : 220;
              const bottom = rect ? window.innerHeight - rect.top - 12 : 80;
              return (
                <div style={{ position: 'fixed', bottom, left, width: w, zIndex: 9999, paddingBottom: 14 }}>
                  <div style={{ background: 'var(--bg-card)', borderRadius: 11, boxShadow: '0 16px 48px rgba(33,31,28,.16)', border: '1px solid var(--border-light)', overflow: 'hidden' }}>
                    <div style={s('padding:4px')}>
                      {[
                        { icon: 'play-circle', label: 'Tutorial', action: () => { setProfileOpen(false); setMobileMenuOpen(false); tourReplayRef.current = true; setWelcomeOpen(true); } },
                        { icon: 'message-square', label: 'Suggerimenti', action: () => { setProfileOpen(false); setMobileMenuOpen(false); go('assistenza?type=feature'); } },
                        { icon: 'settings', label: 'Impostazioni', action: () => { setProfileOpen(false); setMobileMenuOpen(false); go('impostazioni'); } },
                        { icon: 'life-buoy', label: 'Assistenza', action: () => { setProfileOpen(false); setMobileMenuOpen(false); go('assistenza'); } },
                      ].map(item => (
                        <Box key={item.label} onClick={item.action} style={s('display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:9px;cursor:pointer;font-size:12px;font-weight:600')} hover={s('background:var(--bg-hover)')}>
                          <Icon name={item.icon} size={14} color="var(--text-sec)" />{item.label}
                        </Box>
                      ))}
                    </div>
                    <div style={s('border-top:1px solid var(--border-light);padding:4px')}>
                      <Box onClick={async () => {
                        setProfileOpen(false);
                        try { await supabase.auth.signOut(); } catch { /* noop */ }
                        // Dopo il logout si torna alla landing (homepage del locale).
                        const loc = window.location.pathname.split('/').filter(Boolean)[0] || 'it';
                        window.location.href = `/${loc}`;
                      }} style={s('display:flex;align-items:center;gap:9px;padding:9px 11px;border-radius:9px;cursor:pointer;font-size:12px;font-weight:600;color:#dc2626')} hover={s('background:#fef2f2')}>
                        <Icon name="log-out" size={14} color="#dc2626" />Esci
                      </Box>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* MOBILE MENU BACKDROP */}
        <div className="md:hidden" onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99, opacity: mobileMenuOpen ? 1 : 0, pointerEvents: mobileMenuOpen ? 'auto' : 'none', transition: 'opacity .3s ease-in-out' }} />

        {/* MAIN */}
        <div className="max-md:!w-full" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* HEADER */}
          <div className="max-md:!px-3 max-md:!gap-2 max-md:!flex-wrap max-md:!h-auto max-md:!py-2.5" style={{ height: 58, flex: 'none', background: 'var(--bg-card)', borderBottom: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', gap: 13, padding: '0 18px', position: 'relative', zIndex: tourStep !== null && tdef.sel === '[data-tour-dropdown]' ? 'auto' as any : 30 }}>
            {/* Hamburger (Mobile) */}
            <Box as="button" onClick={() => setMobileMenuOpen(true)} className="md:!hidden" title="Apri menu" aria-label="Apri menu" style={s('border:none;background:transparent;width:34px;height:34px;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none')} hover={s('background:#f1efe9')}><Icon name="menu" size={18} /></Box>

            {/* Collapse (Desktop) */}
            <Box as="button" onClick={() => setCollapsed((c) => !c)} className="max-md:!hidden" title="Comprimi menu" aria-label="Comprimi menu" style={s('border:none;background:transparent;width:34px;height:34px;border-radius:7px;cursor:pointer;display:flex;align-items:center;justify-content:center')} hover={s('background:#f1efe9')}><Icon name="panel-left" size={16} /></Box>

            {/* project switcher */}
            <div data-tour-dropdown className="max-md:!order-10 max-md:!w-full max-md:!basis-full" onMouseEnter={() => { if (hoverNav && tourStep === null) { if (projHoverTimer.current) clearTimeout(projHoverTimer.current); setProjOpen(true); setTrayOpen(false); } }} onMouseLeave={() => { if (hoverNav && tourStep === null) { if (projHoverTimer.current) clearTimeout(projHoverTimer.current); projHoverTimer.current = setTimeout(() => setProjOpen(false), 180); } }} style={{ position: 'relative', ...(!isMobile && tourStep !== null && tdef.sel === '[data-tour-dropdown]' ? { zIndex: 102, pointerEvents: 'none' as const } : {}) }}>
              <Box className="max-md:!w-full max-md:!min-w-0" onClick={(e) => { e.stopPropagation(); if (tourStep !== null && TOUR_DEFS[tourStep]?.sel === '[data-tour-dropdown]') return; setProjOpen((o) => !o); setTrayOpen(false); }} style={s(`display:flex;align-items:center;gap:9px;padding:6px 13px 6px 7px;border:1px solid #e9e6df;border-radius:7px;cursor:pointer;background:var(--bg-card);min-height:34px;min-width:216px;justify-content:space-between`)} hover={s('border-color:var(--border-dark);box-shadow:0 2px 8px rgba(33,31,28,.06)')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 9, minWidth: 0, flex: 1 }}>
                  {loadingProjects ? (
                    <div style={{ minWidth: 0, flex: 1 }}><div style={s('font-size:12px;font-weight:700;color:var(--text-muted)')}>Caricamento...</div></div>
                  ) : active ? (
                    <>
                      <div style={{ width: 27, height: 27, borderRadius: '50%', ...getCoverStyle(active, true), flex: 'none' }} />
                      <div style={{ minWidth: 0, flex: 1 }}><div style={s('font-size:10px;color:var(--text-muted);line-height:1.2')}>Immobile attivo</div><div style={s('font-size:12px;font-weight:700;white-space:nowrap;line-height:1.2;overflow:hidden;text-overflow:ellipsis')}>{active.nome}</div></div>
                    </>
                  ) : (
                    <>
                      {tourStep === null && <div style={{ width: 27, height: 27, borderRadius: '50%', backgroundColor: '#f3f1ec', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={13} color="var(--text-muted)" /></div>}
                      <div style={{ minWidth: 0, flex: 1 }}><div style={s(`font-size:12px;font-weight:700;white-space:nowrap;line-height:1.2${tourStep !== null ? ';color:var(--text-muted)' : ''}`)}>{tourStep !== null ? 'I tuoi immobili' : 'Crea il tuo primo immobile'}</div></div>
                    </>
                  )}
                </div>
                <Icon name="chevron-down" size={13} color="var(--text-muted)" style={{ flex: 'none' }} />
              </Box>
              {projOpen && (
                <div style={s(`position:absolute;top:47px;left:0;width:100%;background:var(--bg-card);border-radius:11px;box-shadow:0 16px 48px rgba(33,31,28,.16);border:1px solid var(--border-light);z-index:99;overflow:hidden;box-shadow:0 16px 48px rgba(33,31,28,.16)`)}>
                  {tourStep === null && <div style={s('padding:11px 11px 7px')}><div style={s('display:flex;align-items:center;gap:7px;background:#faf9f7;border:1px solid #ece9e2;border-radius:9px;padding:0 13px;min-height:40px')}><Icon name="search" size={14} color="var(--text-muted)" /><input value={projQuery} onChange={(e) => setProjQuery(e.target.value)} placeholder="Cerca immobile…" style={s('border:none;background:transparent;outline:none;font-size:12px;width:100%')} /></div></div>}
                  <div style={{ padding: tourStep !== null ? '11px' : '0 11px 11px', borderBottom: '1px solid var(--border-light)' }}>
                    <Box data-tour="new-project" onClick={() => {
                      const inTourDropdown = tourStep !== null && TOUR_DEFS[tourStep]?.sel === '[data-tour-dropdown]';
                      if (inTourDropdown && tourReplayRef.current) {
                        // Replay del tutorial: l'ultima CTA chiude e basta, niente nuovo progetto.
                        tourReplayRef.current = false;
                        setProjOpen(false); setTourStep(null); setTourRect(null); setTourRect2(null); setTourCtaRect(null); go('home');
                        return;
                      }
                      // Team member in onboarding: niente creazione, vai agli immobili del team.
                      if (inTourDropdown && inAgencyTeam) {
                        setProjOpen(false); setTourStep(null); setTourRect(null); setTourRect2(null); setTourCtaRect(null); go('immobili');
                        return;
                      }
                      setProjOpen(false); setNewProjOpen(true); setTourStep(null); setTourRect(null); setTourRect2(null); setTourCtaRect(null);
                    }} style={s(`display:flex;align-items:center;justify-content:center;gap:7px;padding:11px 14px;border-radius:9px;cursor:pointer;color:var(--bg-card);background:#3B83F6;font-weight:700;font-size:12px;min-height:40px;${tourStep !== null && tdef.sel === '[data-tour-dropdown]' ? 'box-shadow:0 0 0 3px rgba(255,255,255,.7),0 0 20px rgba(255,255,255,.4);animation:tour-cta-glow 2s ease-in-out infinite;pointer-events:auto;' : ''}`)} hover={s('background:#2b6fe0')}>{tourStep !== null && tdef.sel === '[data-tour-dropdown]' && tourReplayRef.current && <Icon name="check" size={14} color="var(--bg-card)" />}{tourStep !== null && tdef.sel === '[data-tour-dropdown]' && tourReplayRef.current ? 'Ho capito' : (tourStep !== null && tdef.sel === '[data-tour-dropdown]' && inAgencyTeam ? 'Vedi gli immobili' : (projList.length === 0 ? 'Crea il tuo primo immobile' : 'Nuovo immobile'))}</Box>
                  </div>
                  {projList.length > 0 && (
                    <div style={s('max-height:234px;overflow:auto;padding:7px 5px')}>
                      {projList.map((p) => (
                        <Box key={p.id} onClick={() => { setActiveProject(p.id); setProjOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 9, padding: '8px 9px', borderRadius: 11, cursor: 'pointer', background: p.id === activeProject ? '#f6faff' : 'transparent', border: p.id === activeProject ? '1px solid #3B83F6' : '1px solid transparent' }} hover={{ background: 'var(--bg-hover)' }}>
                          <div style={{ width: 31, height: 31, borderRadius: 9, ...getCoverStyle(p, true), flex: 'none' }} />
                          <div style={{ minWidth: 0, flex: 1 }}><div style={s('font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{p.nome}</div><div style={s('font-size:10px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{p.addr}</div></div>
                          {p.id === activeProject && <Icon name="check" size={13} color="#3B83F6" />}
                        </Box>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div style={{ flex: 1 }} />

            {/* jobs tray + notifications */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <div style={{ position: 'relative' }} title="Lavori in corso">
                <Box as="button" onClick={(e) => { e.stopPropagation(); setTrayOpen((o) => !o); setProjOpen(false); setNotifOpen(false); setProfileOpen(false); }} aria-label="Lavori in corso" style={s('border:none;background:transparent;width:34px;height:34px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative')} hover={s('background:#f1efe9')}>
                  <Icon name="inbox" size={16} />
                  {(() => {
                    // Badge con conteggio job attivi (distinto dal pallino notifiche).
                    const activeCount = batches.filter(b => b.status === 'processing' || b.status === 'pending').length + videoJobs.filter(j => j.stage === 'render' && !j.dismissed).length;
                    const showTourDot = tourStep !== null && tourStep >= 6;
                    if (!activeCount && !showTourDot) return null;
                    if (activeCount > 0) return (
                      <div style={{ position: 'absolute', top: 2, right: 2, minWidth: 14, height: 14, padding: '0 3px', boxSizing: 'border-box', borderRadius: 99, background: '#3B83F6', border: '2px solid var(--bg-card)', color: '#fff', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', lineHeight: 1 }}>{activeCount}</div>
                    );
                    return <div style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%', background: '#3B83F6', border: '2px solid var(--bg-card)' }} />;
                  })()}
                </Box>
                {trayOpen && (
                  <div data-tour-tray style={s('position:absolute;top:41px;right:0;width:297px;background:var(--bg-card);border-radius:11px;box-shadow:0 16px 48px rgba(33,31,28,.16);border:1px solid var(--border-light);overflow:hidden;z-index:50')}>
                    <div style={s('display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--bg-body)')}><span style={s('font-size:12px;font-weight:800')}>Lavori in corso</span></div>
                    <div style={{ maxHeight: 288, overflow: 'auto', ...(tourStep !== null ? { minHeight: 72 } : {}) }}>
                      {(() => {
                        if (tourStep !== null) {
                          return <DemoTrayJobs onAllDone={() => setDemoJobsDone(true)} />;
                        }
                        const dismissed = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('gnm_dismissed_batches') || '[]') : [];
                        const activeBatches = batches.filter(b => (b.status === 'processing' || b.status === 'pending') || ((b.status === 'completed' || b.status === 'partial') && !dismissed.includes(b.id)));
                        const activeVideos = videoJobs.filter(j => !j.dismissed && (j.stage === 'render' || j.stage === 'done' || j.stage === 'failed'));
                        if (activeBatches.length === 0 && activeVideos.length === 0) {
                          return <div style={s('padding:20px 14px;text-align:center;font-size:12px;color:var(--text-muted)')}>Nessun lavoro in corso.<br />Le generazioni girano qui in background, senza bloccarti.</div>;
                        }
                        return (<>{activeBatches.map(b => {
                          const isDone = b.status === 'completed' || b.status === 'partial';
                          const styleObj = STAGING_STYLES.find(s => s.id === b.style);
                          const styleName = styleObj ? styleObj.label : b.style;
                          return (
                            <div key={b.id} style={{ padding: '11px 14px', borderBottom: '1px solid var(--bg-body)', display: 'flex', gap: 11, position: 'relative' }}>
                              <div style={{ width: 29, height: 29, borderRadius: 7, background: isDone ? '#e6f4ea' : '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                                {isDone ? <Icon name="check" size={14} color="#1e8e3e" /> : <div style={{ width: 13, height: 13, border: '2px solid #3B83F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, paddingRight: 20 }}>Batch Foto AI {styleName ? `· ${styleName}` : ''}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>
                                  {isDone ? 'Completato' : `In elaborazione (${b.completedItems}/${b.totalItems})`}
                                </div>
                                {isDone && (
                                  <div style={{ display: 'flex', gap: 7 }}>
                                    <button onClick={() => { dismissBatch(b.id); mutateBatches(); setTrayOpen(false); go('media'); }} style={{ padding: '4px 7px', fontSize: 10, fontWeight: 700, borderRadius: 5, border: '1px solid var(--border-main)', background: 'var(--bg-card)', cursor: 'pointer' }}>Vedi in Media</button>
                                  </div>
                                )}
                              </div>
                              {isDone && (
                                <button onClick={(e) => { e.stopPropagation(); dismissBatch(b.id); mutateBatches(); }} title="Rimuovi" style={{ position: 'absolute', top: 9, right: 11, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Icon name="x" size={12} color="#b3aca1" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                        {activeVideos.map(j => {
                          const isDone = j.stage === 'done';
                          const isFailed = j.stage === 'failed';
                          return (
                            <div key={j.id} style={{ padding: '11px 14px', borderBottom: '1px solid var(--bg-body)', display: 'flex', gap: 11, position: 'relative' }}>
                              <div style={{ width: 29, height: 29, borderRadius: 7, background: isDone ? '#e6f4ea' : isFailed ? '#fef2f2' : '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                                {isDone ? <Icon name="check" size={14} color="#1e8e3e" /> : isFailed ? <Icon name="x" size={14} color="#dc2626" /> : <div style={{ width: 13, height: 13, border: '2px solid #3B83F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 12, fontWeight: 700, marginBottom: 2, paddingRight: 20, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.template === 'montaggio' ? 'Montaggio' : 'Video AI'} · {j.title}</div>
                                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 5 }}>
                                  {isDone ? 'Completato' : isFailed ? (j.error || 'Non riuscito') : `In elaborazione (${Math.round(j.progress * 100)}%) · ${videoEta(j.template)}`}
                                </div>
                                {!isDone && !isFailed && (
                                  <div style={{ height: 4, borderRadius: 2, background: '#eef0f3', overflow: 'hidden', marginBottom: 5 }}>
                                    <div style={{ height: '100%', borderRadius: 2, background: '#3B83F6', width: `${Math.round(j.progress * 100)}%`, transition: 'width .4s' }} />
                                  </div>
                                )}
                                {isDone && (
                                  <div style={{ display: 'flex', gap: 7 }}>
                                    <button onClick={() => { setVideoJobs(dismissVideoJob(j.id)); setTrayOpen(false); go('media'); }} style={{ padding: '4px 7px', fontSize: 10, fontWeight: 700, borderRadius: 5, border: '1px solid var(--border-main)', background: 'var(--bg-card)', cursor: 'pointer' }}>Vedi in Media</button>
                                  </div>
                                )}
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setVideoJobs(dismissVideoJob(j.id)); }} title={isDone || isFailed ? 'Rimuovi' : 'Annulla'} style={{ position: 'absolute', top: 9, right: 11, width: 20, height: 20, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon name="x" size={12} color="#b3aca1" />
                              </button>
                            </div>
                          );
                        })}</>);
                      })()}
                    </div>
                  </div>
                )}
              </div>
              <div ref={notifRef} style={{ position: 'relative' }}>
                <Box as="button" onClick={(e) => { e.stopPropagation(); setNotifOpen(o => !o); setProjOpen(false); setTrayOpen(false); setProfileOpen(false); }} title="Notifiche" aria-label="Notifiche" style={s('border:none;background:transparent;width:34px;height:34px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative')} hover={s('background:#f1efe9')}>
                  <Icon name="bell" size={16} />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <div style={{ position: 'absolute', top: 5, right: 5, width: 7, height: 7, borderRadius: '50%', background: '#ef4444', border: '2px solid var(--bg-card)' }} />
                  )}
                </Box>
                {notifOpen && (
                  <div style={s('position:absolute;top:41px;right:0;width:306px;background:var(--bg-card);border-radius:11px;box-shadow:0 16px 48px rgba(33,31,28,.16);border:1px solid var(--border-light);overflow:hidden;z-index:999')}>
                    <div style={s('display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid var(--bg-body)')}>
                      <span style={s('font-size:12px;font-weight:800')}>Notifiche</span>
                      {notifications.filter(n => !n.is_read).length > 0 && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation();
                            const unread = notifications.filter(n => !n.is_read).map(n => n.id);
                            if (!unread.length) return;
                            mutateNotifs(prev => prev?.map(n => ({ ...n, is_read: true })), false);
                            await supabase.from('notifications').update({ is_read: true }).in('id', unread);
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#1d5fd0', fontSize: 11, fontWeight: 600, cursor: 'pointer' }}
                        >Segna tutte come lette</button>
                      )}
                    </div>
                    <div style={{ maxHeight: 342, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '29px 14px', textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>Nessuna notifica.</div>
                      ) : (
                        notifications.map(n => (
                          <div
                            key={n.id}
                            onClick={async (e) => {
                              e.stopPropagation();
                              if (!n.is_read) {
                                mutateNotifs(prev => prev?.map(x => x.id === n.id ? { ...x, is_read: true } : x), false);
                                await supabase.from('notifications').update({ is_read: true }).eq('id', n.id);
                              }
                            }}
                            style={{ padding: '14px', borderBottom: '1px solid var(--bg-body)', cursor: 'pointer', background: n.is_read ? 'var(--bg-card)' : '#f0fdf4', display: 'flex', gap: 11 }}
                          >
                            <div style={{ flex: 'none', paddingTop: 2 }}>
                              {n.type === 'info' ? <Icon name="info" size={14} color="#3B83F6" /> : <Icon name="bell" size={14} color="#10b981" />}
                            </div>
                            <div>
                              <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-main)', marginBottom: 4 }}>{n.title}</div>
                              <div style={{ fontSize: 12, color: 'var(--text-sec)', lineHeight: 1.4 }}>{n.body}</div>
                              <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 5 }}>
                                {new Date(n.created_at).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* CONTENT */}
          <div ref={contentRef} style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden' }} onClick={closeMenus}>
            {loadingProjects ? (
              <div className="animate-pulse">
                <div className="max-md:!h-auto max-md:!min-h-[220px]" style={{ height: 234, background: 'var(--bg-body)', position: 'relative' }}>
                  <div className="max-md:!p-6 max-md:!pb-6 max-md:!items-center" style={{ maxWidth: 1044, margin: '0 auto', padding: '0 29px', height: '100%', display: 'flex', alignItems: 'flex-end', paddingBottom: 29 }}>
                    <div className="max-md:!flex-col max-md:!items-center max-md:!mt-12" style={{ display: 'flex', gap: 22, alignItems: 'center', width: '100%' }}>
                      <div style={{ width: 108, height: 108, borderRadius: 18, background: '#e9e6df' }} />
                      <div className="max-md:!items-center" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 11 }}>
                        <div style={{ width: 126, height: 14, background: '#e9e6df', borderRadius: 4 }} />
                        <div style={{ width: 252, height: 34, background: '#e9e6df', borderRadius: 5 }} />
                        <div style={{ width: 180, height: 14, background: '#e9e6df', borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="max-md:!p-4" style={{ maxWidth: 1044, margin: '0 auto', padding: '43px 29px 29px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(270px, 1fr))', gap: 22 }}>
                    <div style={{ height: 126, background: 'var(--bg-body)', borderRadius: 14 }} />
                    <div style={{ height: 126, background: 'var(--bg-body)', borderRadius: 14 }} />
                    <div style={{ height: 126, background: 'var(--bg-body)', borderRadius: 14 }} />
                  </div>
                </div>
              </div>
            ) : route === 'home' ? (
              <HomeScreen
                active={active}
                batches={batches}
                videoJobs={videoJobs}
                toast={toast}
                freeTrial={freeTrial}
                setNewProjOpen={setNewProjOpen}
                onEditProject={() => setEditProjOpen(true)}
                go={go}
                getCoverStyle={getCoverStyle}
                onProjectUpdate={(upd) => {
                  setProjects(prev => prev.map(p => p.id === active?.id ? { ...p, ...upd } : p));
                  if (active) updateProject(active.id, upd);
                }}
              />
            ) : route === 'immobili' ? (
              (() => {
                const q = immQuery.trim().toLowerCase();
                const list = q ? projects.filter(p => (p.nome || '').toLowerCase().includes(q) || (p.addr || '').toLowerCase().includes(q)) : projects;
                // Raggruppa per giorno di creazione (come Galleria).
                const dayMap = new Map<string, Project[]>();
                for (const p of list) {
                  const key = p.createdAt ? p.createdAt.slice(0, 10) : 'nd';
                  (dayMap.get(key) ?? dayMap.set(key, []).get(key)!).push(p);
                }
                const days = [...dayMap.entries()]
                  .sort((a, b) => (a[0] === 'nd' ? 1 : b[0] === 'nd' ? -1 : b[0].localeCompare(a[0])))
                  .map(([key, items]) => ({
                    key,
                    label: items[0].createdAt ? new Date(items[0].createdAt).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Senza data',
                    items,
                  }));
                return (
                  <div className="max-md:!px-4 max-md:!py-6" style={{ maxWidth: 1044, margin: '0 auto', padding: '29px 29px 58px' }}>
                    <div className="max-md:!flex-col max-md:!items-start max-md:!gap-4" style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:36px')}>
                      <div>
                        <h1 style={s('margin: 0 0 4px;font-size:22px;font-weight:800;letter-spacing:-.5px')}>Immobili</h1>
                        <div style={s('color:#8c867d;font-size:13px')}>{projects.length} immobili · ogni immobile raccoglie foto, staging, video e post</div>
                      </div>
                      {immSelectMode ? (
                        <div style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
                          <Box as="button" onClick={() => { const all = projects.length > 0 && immSelected.size === projects.length; setImmSelected(all ? new Set() : new Set(projects.map(p => p.id))); }} style={s('box-sizing:border-box;border:1px solid #e4e1da;background:var(--bg-card);color:var(--text-main);font-size:12px;font-weight:700;padding: 0 16px;height: 36px;border-radius:9px;cursor:pointer;display:flex;align-items:center;gap: 6px;white-space:nowrap')} hover={s('background:#f6f4f0')}>
                            {projects.length > 0 && immSelected.size === projects.length ? 'Deseleziona tutti' : 'Seleziona tutti'}
                          </Box>
                          <Box as="button" onClick={async () => { if (!immSelected.size || immDeleting) return; setImmDeleting(true); const ids = [...immSelected]; let ok = 0; for (const id of ids) { if (await deleteProject(id)) ok++; } if (immSelected.has(activeProject)) { const rem = projects.filter(p => !immSelected.has(p.id)); setActiveProject(rem[0]?.id || ''); } setProjects(prev => prev.filter(p => !immSelected.has(p.id))); setImmDeleting(false); setImmSelectMode(false); setImmSelected(new Set()); toast(`${ok} ${ok === 1 ? 'immobile eliminato' : 'immobili eliminati'}`, 'check'); }} style={s('box-sizing:border-box;border:none;background:' + (immSelected.size && !immDeleting ? '#dc2626' : '#f3d4d4') + ';color:#fff;font-size:13.5px;font-weight:700;padding: 0 18px;height: 40px;border-radius:10px;cursor:' + (immSelected.size && !immDeleting ? 'pointer' : 'default') + ';display:flex;align-items:center;gap: 7px;white-space:nowrap')} hover={immSelected.size && !immDeleting ? s('background:#b91c1c') : undefined}>
                            {immDeleting ? (<><span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}><Icon name="loader-circle" size={14} color="#fff" /></span>Eliminazione...</>) : (<><Icon name="trash-2" size={14} color="#fff" />Elimina{immSelected.size ? ` (${immSelected.size})` : ''}</>)}
                          </Box>
                          <Box as="button" onClick={() => { setImmSelectMode(false); setImmSelected(new Set()); }} style={s('box-sizing:border-box;border:1px solid #e4e1da;background:var(--bg-card);color:var(--text-main);font-size:12px;font-weight:700;padding: 0 16px;height: 36px;border-radius:9px;cursor:pointer;display:flex;align-items:center;white-space:nowrap')} hover={s('background:#f6f4f0')}>
                            Annulla
                          </Box>
                        </div>
                      ) : (
                      <div className="max-md:!w-full max-md:!flex-col max-md:!gap-3 max-md:!items-stretch" style={{ display: 'flex', gap: 9, alignItems: 'center', flexWrap: 'wrap' }}>
                        {/* Ricerca immobili (mobile) */}
                        <div className="md:!hidden" style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', boxSizing: 'border-box', background: '#faf9f7', border: '1px solid #ece9e2', borderRadius: 9, padding: '0 13px', minHeight: 40 }}>
                          <Icon name="search" size={14} color="#8c867d" />
                          <input value={immQuery} onChange={(e) => setImmQuery(e.target.value)} placeholder="Cerca immobile…" style={s('border:none;background:transparent;outline:none;font-size:13px;width:100%;color:var(--text-main)')} />
                        </div>
                        <div className="max-md:!flex max-md:!w-full max-md:!gap-3" style={{ display: 'contents' }}>
                        <div className="max-md:!flex-1" style={{ position: 'relative' }}>
                          <Box as="button" className="max-md:!w-full max-md:!justify-center" onClick={() => setImmActionsOpen(o => !o)} style={s('box-sizing:border-box;border:1px solid #e4e1da;background:var(--bg-card);color:var(--text-main);font-size:12px;font-weight:700;line-height:20px;padding: 9px 16px;border-radius:9px;cursor:pointer;display:flex;align-items:center;gap: 6px;white-space:nowrap')} hover={s('background:#f6f4f0')}>
                            Azioni <Icon name="chevron-down" size={14} color="#57534c" />
                          </Box>
                          {immActionsOpen && (
                            <div onClick={(e) => e.stopPropagation()} className="max-md:!left-1/2 max-md:!right-auto max-md:!-translate-x-1/2" style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, zIndex: 40, background: '#fff', border: '1px solid #f0ede7', borderRadius: 9, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 4, minWidth: 162 }}>
                              {!isFreePlan && (
                              <Box as="button" onClick={() => { setImmActionsOpen(false); setImportOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 11px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#211f1c', textAlign: 'left' } as React.CSSProperties} hover={{ background: 'var(--bg-hover)' }}>
                                <Icon name="upload" size={14} color="#57534c" />Importa immobili
                              </Box>
                              )}
                              <Box as="button" onClick={() => { setImmActionsOpen(false); if (!projects.length) { toast('Nessun immobile', 'x'); return; } setImmSelectMode(true); setImmSelected(new Set()); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 11px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#211f1c', textAlign: 'left' } as React.CSSProperties} hover={{ background: 'var(--bg-hover)' }}>
                                <Icon name="check" size={14} color="#57534c" />Seleziona immobili
                              </Box>
                              <div style={{ height: 1, background: '#f0ede7', margin: '4px 7px' }} />
                              {([
                                { fmt: 'csv', label: 'Esporta CSV', fn: exportProjectsCSV },
                                { fmt: 'xlsx', label: 'Esporta Excel', fn: exportProjectsXLSX },
                                { fmt: 'pdf', label: 'Esporta PDF', fn: exportProjectsPDF },
                              ] as const).map((opt) => (
                                <Box key={opt.fmt} as="button" onClick={() => { setImmActionsOpen(false); if (!projects.length) { toast('Nessun immobile da esportare', 'x'); return; } opt.fn(projects as unknown as ProjectData[]); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 11px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#211f1c', textAlign: 'left' } as React.CSSProperties} hover={{ background: 'var(--bg-hover)' }}>
                                  <Icon name="download" size={14} color="#57534c" />{opt.label}
                                </Box>
                              ))}
                            </div>
                          )}
                        </div>
                        <Box as="button" className="max-md:!flex-1" onClick={() => setNewProjOpen(true)} style={s('box-sizing:border-box;border:1px solid #3B83F6;background:#3B83F6;color:var(--bg-card);font-size:12px;font-weight:700;line-height:20px;padding: 9px 16px;border-radius:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;white-space:nowrap')} hover={s('background:#2b6fe0;border-color:#2b6fe0')}>
                          Nuovo immobile
                        </Box>
                        </div>
                      </div>
                      )}
                    </div>
                    {list.length === 0 ? (
                      <div style={s('display:flex;flex-direction:column;align-items:center;justify-content:center;padding: 58px 29px;text-align:center')}>
                        <div style={s('width: 52px;height: 52px;border-radius:14px;background:#f4f2ee;display:flex;align-items:center;justify-content:center;margin-bottom:16px')}>
                          <Icon name="building-2" size={25} color="#b3aca1" />
                        </div>
                        <h2 style={s('margin: 0 0 7px;font-size:18px;font-weight:800;letter-spacing:-.3px')}>Nessun immobile ancora</h2>
                        <p style={s('margin: 0 0 22px;font-size:13px;color:#8c867d;max-width:342px;line-height:1.6')}>Crea il tuo primo immobile o importa la tua lista per iniziare a generare foto AI, video e post.</p>
                        <div style={{ display: 'flex', gap: 9, flexWrap: 'wrap', justifyContent: 'center' }}>
                          <Box as="button" onClick={() => setNewProjOpen(true)} style={s('border:1px solid #3B83F6;background:#3B83F6;color:#fff;font-size:13px;font-weight:700;padding: 10px 20px;border-radius:11px;cursor:pointer;display:flex;align-items:center;justify-content:center')} hover={s('background:#2b6fe0;border-color:#2b6fe0')}>
                            Nuovo immobile
                          </Box>
                          {!isFreePlan && (
                          <Box as="button" onClick={() => setImportOpen(true)} style={s('border:1px solid #e4e1da;background:var(--bg-card);color:var(--text-main);font-size:13px;font-weight:700;padding: 10px 20px;border-radius:11px;cursor:pointer;display:flex;align-items:center;gap: 6px')} hover={s('background:#f6f4f0')}>
                            <Icon name="upload" size={14} color="#57534c" />Importa
                          </Box>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 29 }}>
                        {days.map(day => (
                          <div key={day.key}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14, borderBottom: '1px solid #f0ede7', paddingBottom: 11 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
                                <div style={{ width: 29, height: 29, borderRadius: 7, background: '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Icon name="calendar" size={14} color="#3B83F6" />
                                </div>
                                <div>
                                  <div style={{ fontSize: 14, fontWeight: 700, color: '#211f1c', textTransform: 'capitalize' }}>{day.label}</div>
                                  <div style={{ fontSize: 11, color: '#8c867d' }}>{day.items.length} {day.items.length === 1 ? 'immobile' : 'immobili'}</div>
                                </div>
                              </div>
                            </div>
                            <div className="max-md:!grid-cols-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(216px, 1fr))', gap: 14 }}>
                        {(isMobile && !immExpanded.has(day.key) ? day.items.slice(0, 5) : day.items).map(p => (
                          <Box key={p.id} onClick={() => { if (immSelectMode) { setImmSelected(prev => { const n = new Set(prev); if (n.has(p.id)) n.delete(p.id); else n.add(p.id); return n; }); return; } if (immMenuId === p.id) { setImmMenuId(null); return; } setActiveProject(p.id); go('home'); }} style={{ position: 'relative', background: 'var(--bg-card)', border: immSelectMode && immSelected.has(p.id) ? '2px solid #3B83F6' : '1px solid #ece9e2', borderRadius: 14, overflow: 'hidden', cursor: 'pointer', display: 'flex', flexDirection: 'column', transition: 'transform .18s ease, box-shadow .18s ease', willChange: 'transform' }} hover={s('box-shadow:0 8px 24px rgba(33,31,28,.08);transform:translateY(-2px)')}>
                            {immSelectMode && (
                              <div style={{ position: 'absolute', top: 11, left: 11, width: 23, height: 23, borderRadius: '50%', background: immSelected.has(p.id) ? '#3B83F6' : 'rgba(255,255,255,0.92)', border: immSelected.has(p.id) ? 'none' : '1px solid #d8d4cb', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6 }}>
                                {immSelected.has(p.id) && <Icon name="check" size={14} color="#fff" />}
                              </div>
                            )}
                            {!immSelectMode && (
                            <button onClick={(e) => { e.stopPropagation(); setImmMenuId(id => id === p.id ? null : p.id); }} title="Azioni" style={{ position: 'absolute', top: 11, right: 11, width: 31, height: 31, borderRadius: '50%', background: 'rgba(20,30,55,0.45)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 6 }}>
                              <Icon name="more-vertical" size={14} color="#fff" />
                            </button>
                            )}
                            {!immSelectMode && immMenuId === p.id && (
                              <div onClick={(e) => e.stopPropagation()} style={{ position: 'absolute', top: 47, right: 11, zIndex: 7, background: '#fff', border: '1px solid #f0ede7', borderRadius: 9, boxShadow: '0 8px 24px rgba(0,0,0,0.12)', padding: 4, minWidth: 153 }}>
                                <Box as="button" onClick={() => { setImmMenuId(null); setActiveProject(p.id); setEditProjOpen(true); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 11px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#211f1c', textAlign: 'left' } as React.CSSProperties} hover={{ background: 'var(--bg-hover)' }}>
                                  <Icon name="pencil" size={14} color="#57534c" />Modifica
                                </Box>
                                <Box as="button" onClick={() => { setImmMenuId(null); setConfirmDelProj({ id: p.id, nome: p.nome }); }} style={{ display: 'flex', alignItems: 'center', gap: 9, width: '100%', padding: '9px 11px', borderRadius: 7, border: 'none', background: 'transparent', cursor: 'pointer', fontSize: 12, fontWeight: 600, color: '#dc2626', textAlign: 'left' } as React.CSSProperties} hover={{ background: '#fef2f2' }}>
                                  <Icon name="trash-2" size={14} color="#dc2626" />Elimina
                                </Box>
                              </div>
                            )}
                            <div style={{ height: 171, ...getCoverStyle(p) }} />
                            <div style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 4 }}>
                              <div style={s('font-size:14px;font-weight:800;color:var(--text-main);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{p.nome}</div>
                              <div style={s('font-size:12px;color:var(--text-muted);white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{p.addr}</div>
                              <div style={s('font-size:12px;color:var(--text-main);margin-top:7px')}>
                                {p.prezzo ? <strong>€ {p.prezzo.toLocaleString('it-IT')}</strong> : null}
                                {p.mq ? <span style={s('color:var(--text-muted)')}>{p.prezzo ? '  ·  ' : ''}{p.mq} m²</span> : null}
                                {p.locali ? <span style={s('color:var(--text-muted)')}>  ·  {p.locali} locali</span> : null}
                              </div>
                              {(() => {
                                // Conteggi reali da batches/videoJobs (gia' fetchati a livello app) invece
                                // dei campi p.nFoto/nStaging/nVideo, quasi sempre 0 perche' l'API progetti
                                // non li calcola mai lato server.
                                const projPhotos = batches.filter(b => b.projectId === p.id && b.status !== 'failed').reduce((sum, b) => sum + (b.completedItems || 0), 0);
                                const projVideos = videoJobs.filter(v => v.projectId === p.id && v.stage === 'done').length;
                                return (
                                  <div style={s('font-size:11px;color:var(--text-muted);margin-top:11px;padding-top:11px;border-top:1px solid #f0ede7')}>
                                    {projPhotos} foto · {projPhotos} staging · {projVideos} video · {(p.nPost || 0)} post
                                  </div>
                                );
                              })()}
                            </div>
                          </Box>
                        ))}
                            </div>
                            {isMobile && day.items.length > 5 && !immExpanded.has(day.key) && (
                              <Box as="button" onClick={() => setImmExpanded(prev => new Set(prev).add(day.key))} style={s('width:100%;margin-top:11px;border:1px solid #e4e1da;background:var(--bg-card);color:var(--text-main);font-size:12px;font-weight:700;padding: 10px;border-radius:9px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap: 4px')} hover={s('background:#f6f4f0')}>
                                Vedi altri {day.items.length - 5} <Icon name="chevron-down" size={14} color="#57534c" />
                              </Box>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()
            ) : route === 'studio' ? (
              <PostSocialScreen toast={toast} routeKey={routeKey} brand={brand} project={active || DEMO_PROJECTS[0]} batches={batches} onProjectUpdate={active ? (upd) => setProjects(prev => prev.map(p => p.id === active.id ? { ...p, ...upd } : p)) : undefined} initialPhotoUrl={studioPhoto} go={go} demoMode={tourStep !== null} />
            ) : route === 'staging' ? (
              <FotoAIScreen
                toast={toast}
                routeKey={routeKey}
                project={active || DEMO_PROJECTS[0]}
                onBatchCreated={() => {
                  fetchUserBatches().then(setBatches);
                }}
                onGoPlan={() => go('account')}
                onGoPost={() => go('studio')}
                onGoVideo={(url) => go('video', { photoUrl: url })}
                onCreated={(count = 1) => setGalleryUnseen(n => n + count)}
                demoMode={tourStep !== null}
                lockBrand={isFreePlan}
              />
            ) : route === 'media' ? (
              <MediaScreen
                toast={toast}
                routeKey={routeKey}
                project={active || DEMO_PROJECTS[0]}
                batches={batches}
                loadingBatches={loadingBatches}
                activeVideoJobs={videoJobs.filter(j => j.stage === 'render' && !j.dismissed).map(j => ({ id: j.id, title: j.title, createdAt: j.createdAt, projectId: j.projectId }))}
                demoMode={tourStep !== null}
                demoJobsDone={demoJobsDone}
                demoShowSkeleton={tourStep === 6}
                go={go}
                lockBrand={isFreePlan}
              />
            ) : route === 'video' ? (
              <VideoAIScreen key="video" toast={toast} routeKey={routeKey} brand={brand} project={active || DEMO_PROJECTS[0]} onVideoJob={registerVideoJob} activeRenders={videoJobs.filter(j => j.stage === 'render' && !j.dismissed).length} pendingVideoRenders={videoJobs.filter(j => j.stage === 'render' && !j.dismissed && j.template !== 'montaggio').length} initialPhotoUrl={studioPhoto} preselect={studioPhoto ? 'walkthrough' : undefined} demoMode={tourStep !== null} go={go} lockBrand={isFreePlan} subscriptionType={userData?.subscriptionType} />
            ) : route === 'montaggio' ? (
              <VideoAIScreen key="montaggio" toast={toast} routeKey={routeKey} brand={brand} preselect="montaggio" project={active || DEMO_PROJECTS[0]} onVideoJob={registerVideoJob} activeRenders={videoJobs.filter(j => j.stage === 'render' && !j.dismissed).length} pendingVideoRenders={0} demoMode={tourStep !== null} go={go} lockBrand={isFreePlan} subscriptionType={userData?.subscriptionType} />
            ) : route === 'quartiere' ? (
              <ZonaScreen key="quartiere" project={active || DEMO_PROJECTS[0]} projects={projects.length ? projects : DEMO_PROJECTS} brand={brand} toast={toast} locked={isFreePlan} go={go} />
            ) : route === 'report' || route === 'compare' ? (
              <ReportScreen project={active || DEMO_PROJECTS[0]} projects={projects.length ? projects : DEMO_PROJECTS} brand={brand} toast={toast} locked={isFreePlan} go={go} />
            ) : route === 'account' ? (
              <AccountScreen credits={credits} toast={toast} go={go} userData={userData} tierHint={accountTierHint} />
            ) : route === 'team' ? (
              <TeamScreen toast={toast} go={go} isAgency={hasAgency} userData={userData} />
            ) : route === 'brand' ? (
              (!active && tourStep === null && !welcomeOpen) ? (
                <div style={s('display:flex;flex-direction:column;align-items:center;justify-content:center;padding: 65px 29px;text-align:center;max-width:1044px;margin: 0 auto')}>
                  <div style={s('width: 52px;height: 52px;border-radius:14px;background:#f4f2ee;display:flex;align-items:center;justify-content:center;margin-bottom:16px')}>
                    <Icon name="palette" size={25} color="#b3aca1" />
                  </div>
                  <h2 style={s('margin: 0 0 7px;font-size:18px;font-weight:800;letter-spacing:-.3px')}>Crea prima un immobile</h2>
                  <p style={s('margin: 0 0 22px;font-size:13px;color:#8c867d;max-width:342px;line-height:1.6')}>Aggiungi un immobile per vedere il tuo brand applicato ai materiali (post, video, report).</p>
                  <Box as="button" onClick={() => setNewProjOpen(true)} style={s('border:1px solid #3B83F6;background:#3B83F6;color:#fff;font-size:13px;font-weight:700;padding: 10px 20px;border-radius:11px;cursor:pointer')} hover={s('background:#2b6fe0;border-color:#2b6fe0')}>Nuovo immobile</Box>
                </div>
              ) : (
                <BrandScreen toast={toast} brand={brand} setBrand={setBrand} brandRole={brandRole} demoMode={tourStep !== null || welcomeOpen} demoPaused={welcomeOpen} locked={brandLocked} go={go} />
              )
            ) : route === 'impostazioni' ? (
              <SettingsScreen toast={toast} />
            ) : route.startsWith('assistenza') ? (
              <AssistenzaScreen toast={toast} email={userData?.email ?? ''} defaultType={route.includes('type=feature') ? 'feature' : 'support'} />
            ) : (
              <div style={s('max-width:1044px;margin: 0 auto;padding: 26px 29px 58px')}>
                <h1 style={s('margin: 0 0 4px;font-size:24px;font-weight:800;letter-spacing:-.5px')}>{ROUTE_TITLES[route] ?? route}</h1>
                <div style={s('color:var(--text-muted);font-size:13px;margin-bottom:25px')}>Schermata in arrivo nelle prossime fasi del porting.</div>
                <div style={s('background:var(--bg-card);border:1.5px dashed var(--border-dark);border-radius:11px;padding: 42px;text-align:center;max-width:504px')}>
                  <div style={s('width: 42px;height: 42px;border-radius:14px;background:#eef4fe;display:flex;align-items:center;justify-content:center;margin: 0 auto 13px')}><Icon name="sparkles" size={22} color="#3B83F6" /></div>
                  <div style={s('font-size:14px;font-weight:800;margin-bottom:5px')}>«{ROUTE_TITLES[route] ?? route}» in costruzione</div>
                  <div style={s('color:var(--text-muted);font-size:12px;max-width:342px;margin: 0 auto')}>Lo shell, la navigazione e la Home sono pronti. Questa sezione viene portata nella fase successiva.</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ⌘K MODAL */}
      {cmdkOpen && (
        <div onClick={() => setCmdkOpen(false)} style={s('position:fixed;inset:0;background:rgba(24,21,17,.4);z-index:90;display:flex;align-items:flex-start;justify-content:center;padding-top:14vh')}>
          <div onClick={(e) => e.stopPropagation()} style={s('width:100%;max-width:504px;background:var(--bg-card);border-radius:13px;box-shadow:0 24px 64px rgba(20,18,15,.3);overflow:hidden')}>
            <div style={s('display:flex;align-items:center;gap: 8px;padding: 13px 16px;border-bottom:1px solid var(--bg-body)')}><Icon name="search" size={16} color="var(--text-muted)" /><input autoFocus value={cmdQuery} onChange={(e) => setCmdQuery(e.target.value)} placeholder="Cerca strumenti, immobili, media…" style={s('border:none;outline:none;font-size:14px;width:100%;background:transparent')} /><span style={s('font-size:10px;font-weight:700;background:#f1efe9;color:var(--text-muted);padding: 3px 7px;border-radius:5px')}>esc</span></div>
            <div style={s('max-height:306px;overflow:auto;padding: 6px')}>
              {cmdResults.length === 0 ? <div style={s('padding: 22px;text-align:center;color:var(--text-muted);font-size:12px')}>Nessun risultato.</div> : cmdResults.slice(0, 12).map((r, i) => (
                <Box key={i} onClick={r.go} style={s('display:flex;align-items:center;gap: 10px;padding: 9px 11px;border-radius:9px;cursor:pointer')} hover={s('background:var(--bg-hover)')}>
                  <span style={s('width: 26px;height: 26px;border-radius:8px;background:var(--bg-body);display:flex;align-items:center;justify-content:center;flex:none')}><Icon name={r.icon} size={14} color="var(--text-sec)" /></span>
                  <div style={{ minWidth: 0 }}><div style={s('font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{r.label}</div><div style={s('font-size:10px;color:var(--text-muted)')}>{r.sub}</div></div>
                </Box>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TOASTS */}
      <div style={s('position:fixed;bottom: 20px;left:50%;transform:translateX(-50%);z-index:999999;display:flex;flex-direction:column;gap: 8px;align-items:center')}>
        {toasts.map((t) => (
          <div key={t.id} style={s('display:flex;align-items:center;gap: 8px;background:#3B83F6;color:var(--bg-card);padding: 10px 16px;border-radius:9px;box-shadow:0 12px 32px rgba(59,131,246,.32);font-size:12px;font-weight:600;max-width:378px')}>
            <Icon name={t.icon} size={14} color="var(--bg-card)" /><span>{t.msg}{t.link && <><br /><a href={t.link.href} target="_blank" rel="noopener noreferrer" style={{ color: 'var(--bg-card)', textDecoration: 'underline', fontWeight: 700, whiteSpace: 'nowrap' }}>{t.link.label}</a></>}</span>
          </div>
        ))}
      </div>

      {/* IMPORT IMMOBILI MODAL */}
      {importOpen && (
        <ImportProjectsModal
          onClose={() => setImportOpen(false)}
          onDone={(res) => {
            mutateProjects();
            go('immobili');
            toast(`Import: ${res.created} creati, ${res.updated} aggiornati${res.skipped ? `, ${res.skipped} saltati` : ''}`, 'check');
          }}
        />
      )}

      {/* CONFERMA ELIMINA IMMOBILE */}
      {confirmDelProj && (
        <div onClick={() => !delProjLoading && setConfirmDelProj(null)} style={{ position: 'fixed', inset: 0, zIndex: 1000, background: 'rgba(20,18,16,0.55)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14 }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#fff', borderRadius: 14, width: '100%', maxWidth: 360, padding: '23px 22px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
            <div style={{ width: 43, height: 43, borderRadius: 13, background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 13 }}>
              <Icon name="trash-2" size={20} color="#dc2626" />
            </div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#211f1c', marginBottom: 5 }}>Eliminare l&apos;immobile?</div>
            <div style={{ fontSize: 13, color: '#57534c', lineHeight: 1.5, marginBottom: 20 }}>Stai per eliminare <b>{confirmDelProj.nome || 'questo immobile'}</b>. Questa azione non si può annullare.</div>
            <div style={{ display: 'flex', gap: 9 }}>
              <Box as="button" onClick={() => !delProjLoading && setConfirmDelProj(null)} style={{ flex: 1, border: '1px solid #e4e1da', background: '#fff', color: '#57534c', fontSize: 13, fontWeight: 700, padding: '11px 0', borderRadius: 9, cursor: 'pointer' } as React.CSSProperties} hover={s('background:#f6f4f0')}>Annulla</Box>
              <Box as="button" onClick={async () => {
                if (delProjLoading) return;
                setDelProjLoading(true);
                const id = confirmDelProj.id;
                const ok = await deleteProject(id);
                setDelProjLoading(false);
                if (!ok) { toast('Errore eliminazione', 'x'); return; }
                if (activeProject === id) { const rem = projects.filter(x => x.id !== id); setActiveProject(rem[0]?.id || ''); }
                setProjects(prev => prev.filter(x => x.id !== id));
                setConfirmDelProj(null);
                toast('Immobile eliminato', 'check');
              }} style={{ flex: 1, border: 'none', background: delProjLoading ? '#f3d4d4' : '#dc2626', color: '#fff', fontSize: 13, fontWeight: 700, padding: '11px 0', borderRadius: 9, cursor: delProjLoading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7 } as React.CSSProperties} hover={delProjLoading ? {} : s('background:#b91c1c')}>
                {delProjLoading ? (<><span style={{ display: 'inline-flex', animation: 'spin 1s linear infinite' }}><Icon name="loader-circle" size={14} color="#fff" /></span>Elimino...</>) : 'Elimina'}
              </Box>
            </div>
          </div>
        </div>
      )}

      {/* NEW PROJECT MODAL */}
      {newProjOpen && (
        <NewProjectModal
          toast={toast}
          mandatory={projects.length === 0}
          onImport={isFreePlan ? undefined : () => { setNewProjOpen(false); setImportOpen(true); }}
          onClose={() => setNewProjOpen(false)}
          onSuccess={(p) => {
            const isFirst = projects.length === 0;
            setProjects(prev => [p as unknown as Project, ...prev]);
            setActiveProject(p.id);
            setNewProjOpen(false);
            // Primo immobile (l'unico): vai dritto alla sua scheda, non alla lista.
            go(isFirst ? 'home' : 'immobili');
          }}
        />
      )}

      {/* EDIT PROJECT MODAL */}
      {editProjOpen && active && (
        <NewProjectModal 
          toast={toast}
          editProject={active as unknown as ProjectData}
          onClose={() => setEditProjOpen(false)}
          onSuccess={(p) => {
            setProjects(prev => prev.map(old => old.id === p.id ? { ...old, ...p } as unknown as Project : old));
            setEditProjOpen(false);
          }}
          onDelete={(id) => {
            setProjects(prev => prev.filter(old => old.id !== id));
            setEditProjOpen(false);
            const remaining = projects.filter(old => old.id !== id);
            if (remaining.length > 0) setActiveProject(remaining[0].id);
            else setActiveProject('');
            go('immobili'); // dopo eliminazione -> lista "tutti gli immobili"
          }}
        />
      )}

    </div>
  );
}
