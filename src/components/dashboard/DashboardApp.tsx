'use client';
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
import { loadVideoJobs, upsertVideoJob, patchVideoJob, dismissVideoJob, removeVideoJob, fetchServerVideoJobs, mergeServerJobs, type VideoJob } from '@/lib/videoJobs';
import { pollRenderProgress } from '@/lib/aiVideo';
import MediaScreen from './MediaScreen';
import { HomeScreen } from './HomeScreen';
import { NewProjectModal } from './NewProjectModal';
import type { Project } from './types';
import { type ProjectData, fetchProjects, updateProject } from '@/lib/projects';
import { fetchUserBatches, fetchBatchPhotos, dismissBatch, type BatchInfo } from '@/lib/stagingBatches';
import { STAGING_STYLES } from '@/lib/staging';
import { cleanupOldMedia } from '@/lib/localMediaCache';
import { supabase } from '@/lib/supabase';

export type AppNotification = { id: string; title: string; body: string; type: string; is_read: boolean; created_at: string; };
const TemplatePreview = dynamic(() => import('./TemplatePreview'), { ssr: false });

type Toast = { id: number; msg: string; icon: string };

const DEMO_PROJECTS: Project[] = [
  { id: 'p1', nome: 'Attico Brera', addr: 'Via Fiori Chiari 12, Milano', prezzo: 1250000, mq: 145, locali: 4, nFoto: 12, nStaging: 6, nVideo: 2, nPost: 8, titolo: 'Attico con terrazza nel cuore di Brera', cover: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&h=500&fit=crop' },
  { id: 'p2', nome: 'Trilocale Isola', addr: 'Via Borsieri 28, Milano', prezzo: 545000, mq: 95, locali: 3, nFoto: 9, nStaging: 3, nVideo: 1, nPost: 5, titolo: 'Trilocale ristrutturato nel cuore di Isola', cover: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=500&fit=crop' },
  { id: 'p3', nome: 'Appartamento Trastevere', addr: 'Vicolo del Cedro 9, Roma', prezzo: 690000, mq: 110, locali: 3, nFoto: 10, nStaging: 2, nVideo: 1, nPost: 4, titolo: 'Charme romano con travi a vista', cover: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=800&h=500&fit=crop' },
  { id: 'p4', nome: 'Bilocale Crocetta', addr: 'Corso Re Umberto 44, Torino', prezzo: 295000, mq: 68, locali: 2, nFoto: 6, nStaging: 0, nVideo: 0, nPost: 2, titolo: 'Bilocale elegante in zona Crocetta', cover: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=800&h=500&fit=crop' },
];

const NAV_SECTIONS = [
  { label: 'Progetto', items: [{ icon: 'layout-dashboard', label: 'Home', route: 'home' }, { icon: 'sparkles', label: 'Homestaging AI', route: 'staging' }, { icon: 'film', label: 'Video AI', route: 'video' }, { icon: 'scissors', label: 'Montaggio', route: 'montaggio' }, { icon: 'megaphone', label: 'Post Social', route: 'studio' }, { icon: 'images', label: 'Galleria', route: 'media' }] },
  { label: 'Agenzia', items: [{ icon: 'palette', label: 'Brand', route: 'brand' }, { icon: 'credit-card', label: 'Piano', route: 'account' }] },
];

const TOUR_DEFS = [
  { sel: '[title="Brand"]', title: 'Brand', anim: 'brand', text: 'Parti da qui: carica logo, colori e nome agenzia. Appariranno automaticamente su foto, video e post.' },
  { sel: '[title="Homestaging AI"]', title: 'Homestaging AI', anim: 'staging', text: "Arreda, svuota o trasforma le foto dei tuoi immobili con l'AI. Singola o batch, stile o prompt libero." },
  { sel: '[title="Video AI"]', title: 'Video AI', anim: 'video', text: 'Trasforma foto e clip in video pronti per i social: prima/dopo, timelapse, avatar e altro.' },
  { sel: '[title="Montaggio"]', title: 'Montaggio', anim: 'montaggio', text: "Carica le clip della casa: l'AI le monta con cover, musica e watermark in un Reel pronto." },
  { sel: '[title="Post Social"]', title: 'Post Social', anim: 'social', text: 'Template per post e storie con i dati già compilati, e il calendario per programmare le pubblicazioni.' },
  { sel: '[title="Galleria"]', title: 'Galleria', anim: 'media', text: 'Tutto ciò che generi finisce qui. Puoi riusarlo in post e video senza pagare altri crediti.' },
  { sel: '[title="Lavori in corso"]', title: 'Lavori in corso', anim: 'jobs', text: 'Le generazioni girano in background: qui vedi i progressi senza mai bloccarti. Ti avvisiamo a fine lavoro.' },
  { sel: '@center', title: 'Tutto parte da qui', anim: 'project', text: "Inserisci foto e dettagli una sola volta: l'AI li userà in automatico per generare home staging, video reel e post social perfetti e già compilati." },
  { sel: '[data-tour="new-project"]', title: 'Inizia subito', anim: 'none', text: 'Clicca qui per iniziare a caricare foto e dettagli e sbloccare tutte le funzioni AI di GetNearMe.' },
];

// Mini-animazioni per ogni step del tour (CSS, leggere).
function TourAnim({ kind }: { kind: string }) {
  const wrap: React.CSSProperties = { height: 106, borderRadius: 12, background: 'linear-gradient(135deg,#eef4fe,#f6f4f0)', overflow: 'hidden', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 14 };
  if (kind === 'brand') return (
    <div style={wrap}>
      {['#3B83F6', '#5B6CF0', '#211f1c'].map((c, i) => (
        <div key={i} style={{ width: 26, height: 26, borderRadius: 8, background: c, animation: 'tour-pop .6s both', animationDelay: `${i * 0.18}s`, boxShadow: '0 2px 8px rgba(0,0,0,.12)' }} />
      ))}
      <div style={{ width: 30, height: 30, borderRadius: '50%', background: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tour-wiggle 5s ease-in-out infinite', boxShadow: '0 2px 8px rgba(0,0,0,.1)' }}><Icon name="palette" size={15} color="#1d5fd0" /></div>
    </div>
  );
  if (kind === 'staging') return (
    <div style={wrap}>
      {/* Prima/Dopo: la parte "dopo" (arredata) si rivela con la linea che scorre dx/sx */}
      <div style={{ position: 'relative', width: 160, height: 60, borderRadius: 8 }}>
        {/* Layer "prima" (sfondo) */}
        <div style={{ position: 'absolute', inset: 0, borderRadius: 8, background: '#dbeafe' }} />
        
        {/* Layer "dopo" che si rivela, senza overflow:hidden per non tagliare il cerchio */}
        <div style={{ position: 'absolute', top: 0, left: 0, bottom: 0, background: 'linear-gradient(135deg,#93C5FD,#3B83F6 70%,#5B6CF0)', borderRadius: '8px 0 0 8px', animation: 'tour-reveal 3s ease-in-out infinite', display: 'flex', alignItems: 'center', paddingLeft: 10 }}>
          <div style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: 2, background: '#fff', boxShadow: '0 0 6px rgba(0,0,0,.25)' }} />
          <div style={{ position: 'absolute', top: '50%', right: -9, transform: 'translateY(-50%)', width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 5px rgba(0,0,0,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#211f1c" strokeWidth="2.5"><path d="M8 6l-6 6 6 6M16 6l6 6-6 6" /></svg>
          </div>
        </div>
      </div>
    </div>
  );
  if (kind === 'video') return (
    <div style={{ ...wrap, gap: 12 }}>
      {/* Foto di partenza */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
        {[0, 1, 2].map(i => (
           <div key={i} style={{ width: 18, height: 18, borderRadius: 3, background: '#e4e1da', animation: 'tour-video-squares 4s both infinite', animationDelay: `${i * 0.15}s` }} />
        ))}
      </div>
      
      {/* Freccia */}
      <Icon name="arrow-right" size={14} color="#b3aca1" />
      
      {/* Video Verticale generato */}
      <div style={{ width: 48, height: 78, borderRadius: 6, background: 'linear-gradient(135deg, #3B83F6, #5B6CF0)', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 24px rgba(59,131,246,.25)' }}>
        <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'rgba(255,255,255,.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'aurora-pulse 2s infinite' }}>
          <Icon name="sparkles" size={14} color="#fff" />
        </div>
      </div>
    </div>
  );
  if (kind === 'montaggio') return (
    <div style={wrap}>
      {[0, 1, 2].map(i => (
        <div key={i} style={{ width: 30, height: 44, borderRadius: 6, background: ['#93C5FD', '#3B83F6', '#5B6CF0'][i], animation: 'tour-slide .7s both', animationDelay: `${i * 0.2}s` }} />
      ))}
      <Icon name="scissors" size={16} color="#57534c" />
      <div style={{ width: 34, height: 44, borderRadius: 6, background: 'linear-gradient(135deg,#3B83F6,#5B6CF0)', animation: 'tour-pop .6s both', animationDelay: '.75s' }} />
    </div>
  );
  if (kind === 'social') return (
    <div style={wrap}>
      <div style={{ width: 56, background: '#fff', borderRadius: 6, padding: 5, boxShadow: '0 8px 24px rgba(29,95,208,.12)', display: 'flex', flexDirection: 'column', gap: 4, position: 'relative' }}>
        
        {/* Header (Avatar + Name) */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'linear-gradient(135deg,#3B83F6,#5B6CF0)' }} />
          <div style={{ height: 3, width: 16, borderRadius: 2, background: '#e4e1da' }} />
        </div>
        
        {/* Post Image */}
        <div style={{ width: '100%', height: 38, borderRadius: 3, background: '#f4f2ee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Icon name="image" size={12} color="#b3aca1" />
        </div>
        
        {/* Like/Comment mini icons (simulated with circles) */}
        <div style={{ display: 'flex', gap: 2 }}>
          <div style={{ width: 5, height: 5, borderRadius: '50%', border: '1px solid #b3aca1' }} />
          <div style={{ width: 5, height: 5, borderRadius: '50%', border: '1px solid #b3aca1' }} />
        </div>

        {/* AI Caption Typing */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 1 }}>
          <div style={{ height: 2, width: '90%', borderRadius: 1, background: '#3B83F6', animation: 'tour-fill 2.5s ease-in-out infinite' }} />
          <div style={{ height: 2, width: '60%', borderRadius: 1, background: '#3B83F6', animation: 'tour-fill 2.5s .3s ease-in-out infinite' }} />
          <div style={{ height: 2, width: '40%', borderRadius: 1, background: '#3B83F6', animation: 'tour-fill 2.5s .6s ease-in-out infinite' }} />
        </div>
        
        {/* Scintilla AI che fluttua al lato della caption */}
        <div style={{ position: 'absolute', bottom: -5, right: -5, background: '#fff', borderRadius: '50%', padding: 3, boxShadow: '0 2px 8px rgba(0,0,0,.15)', animation: 'tour-bob 2s ease-in-out infinite' }}>
          <Icon name="sparkles" size={10} color="#3B83F6" />
        </div>
      </div>
    </div>
  );
  if (kind === 'media') return (
    <div style={{ ...wrap, padding: 12, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ width: 38, height: 38, borderRadius: 8, background: '#3B83F6', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tour-tile-loop 6s ease-in-out infinite' }}>
        <Icon name="image" size={16} color="#fff" />
      </div>
      <div style={{ width: 38, height: 38, borderRadius: 8, background: '#93C5FD', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tour-tile-loop 6s .6s ease-in-out infinite' }}>
        <Icon name="film" size={16} color="#fff" />
      </div>
      <div style={{ width: 38, height: 38, borderRadius: 8, background: 'linear-gradient(135deg,#3B83F6,#5B6CF0)', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tour-tile-loop 6s 1.2s ease-in-out infinite' }}>
        <Icon name="instagram" size={16} color="#fff" />
      </div>
    </div>
  );
  if (kind === 'jobs') return (
    <div style={wrap}>
      <div style={{ position: 'relative', width: 64, height: 64, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ position: 'absolute', width: 56, height: 56, borderRadius: '50%', border: '1.5px solid rgba(59,131,246,.3)', animation: 'pulse-ring 2.6s linear infinite' }} />
        <div style={{ width: 40, height: 40, background: 'radial-gradient(circle at 32% 28%, #AECBFF, #3B83F6 70%, #5B6CF0)', animation: 'organic-blob 10s linear infinite', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <img src="/templates/default-logo-vertical.svg" style={{ height: 16, filter: 'brightness(0) invert(1)' }} alt="GetNearMe" />
        </div>
      </div>
    </div>
  );
  // project (step centrale)
  return (
    <div style={wrap}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        {/* L'immobile di partenza */}
        <div style={{ width: 60, height: 60, borderRadius: 14, background: '#fff', boxShadow: '0 12px 32px rgba(29,95,208,.12)', border: '1px solid #f0ede7', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
          <Icon name="home" size={28} color="#1d5fd0" />
        </div>

        {/* Freccia */}
        <div style={{ color: '#b3aca1', animation: 'tour-slide 2s alternate infinite', padding: '0 4px' }}>
          <Icon name="arrow-right" size={20} />
        </div>
        
        {/* I contenuti generati */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tour-tile-loop 3s ease-in-out infinite' }}>
            <Icon name="image" size={18} color="#3B83F6" />
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tour-tile-loop 3s .3s ease-in-out infinite' }}>
            <Icon name="film" size={18} color="#3B83F6" />
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tour-tile-loop 3s .6s ease-in-out infinite' }}>
            <Icon name="instagram" size={18} color="#3B83F6" />
          </div>
          <div style={{ width: 40, height: 40, borderRadius: 10, background: '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'tour-tile-loop 3s .9s ease-in-out infinite' }}>
            <Icon name="type" size={18} color="#3B83F6" />
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

const STRIPE_PAYMENT_LINKS: Record<string, string> = {
  agency_monthly: 'https://buy.stripe.com/cNibJ14Kv3bl5f2aFOak00p',
  agency_quarterly: 'https://buy.stripe.com/bJeeVddh1bHR5f229iak00s',
  agency_annual: 'https://buy.stripe.com/eVq6oH90L27h8reg08ak00t',
};

const SUB_TYPE_TO_PLAN: Record<string, string> = {
  agency_monthly: 'monthly',
  agency_quarterly: 'quarterly',
  agency_annual: 'annual',
};

const PLAN_TO_SUB_TYPE: Record<string, string> = {
  monthly: 'agency_monthly',
  quarterly: 'agency_quarterly',
  annual: 'agency_annual',
};

// Voci dalla landing (uguali per tutti i piani). Differenza tra piani = prezzo.
// Quote uguali: 200 foto AI + 4 video AI/mese (margini ~81-91%).
const PLAN_FEATURES = [
  '250 foto AI homestaging/mese',
  '4 video AI/mese',
  'Template Post & Stories Social',
  'Editor Video Automatico',
  'Contenuti 100% Brandizzati',
  'Supporto prioritario',
];

const PLANS = [
  {
    id: 'monthly', name: 'Mensile', price: 100, period: '/mese', badge: null, popular: false,
    features: PLAN_FEATURES,
    color: '#211f1c', quotaFoto: 250, quotaVideo: 4, quotaPost: 999,
  },
  {
    id: 'quarterly', name: 'Trimestrale', price: 79, period: '/mese', badge: null, popular: false,
    features: PLAN_FEATURES,
    color: '#3B83F6', quotaFoto: 250, quotaVideo: 4, quotaPost: 999,
  },
  {
    id: 'annual', name: 'Annuale', price: 59, period: '/mese', badge: null, popular: false,
    features: PLAN_FEATURES,
    color: '#211f1c', quotaFoto: 250, quotaVideo: 4, quotaPost: 999,
  },
];

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
];

const ANIM_STYLES: { id: string; label: string }[] = [
  { id: 'slide-up', label: 'Scorrimento' }, { id: 'fade', label: 'Dissolvenza' },
  { id: 'scale', label: 'Espansione' }, { id: 'slide-right', label: 'Laterale' },
  { id: 'drop', label: 'Caduta' }, { id: 'zoom-out', label: 'Zoom' },
  { id: 'bounce', label: 'Rimbalzo' }, { id: 'diagonal', label: 'Diagonale' },
];

const ANIM_CSS = `
.aw{position:absolute;border-radius:2px;opacity:0;animation-duration:3.5s;animation-iteration-count:infinite;animation-fill-mode:both}
.aw-badge{width:18px;height:5px;top:10px;left:8px;background:#6875F5}
.aw-price{width:38px;height:8px;top:19px;left:8px;background:#fff}
.aw-title{width:50px;height:5px;top:32px;left:8px;background:rgba(255,255,255,.7)}
.aw-addr{width:28px;height:3px;top:41px;left:8px;background:rgba(255,255,255,.35)}
.aw-m1{width:16px;height:13px;top:52px;left:5px;background:rgba(255,255,255,.15);border-radius:3px}
.aw-m2{width:16px;height:13px;top:52px;left:25px;background:rgba(255,255,255,.15);border-radius:3px}
.aw-m3{width:16px;height:13px;top:52px;left:45px;background:rgba(255,255,255,.15);border-radius:3px}
.aw-desc{width:54px;height:4px;top:76px;left:8px;background:rgba(255,255,255,.45)}
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

function PostSocialScreen({ toast, routeKey, brand, project, batches, onProjectUpdate }: { toast: (msg: string, icon?: string) => void; routeKey: number; brand: BrandSettings; project?: Project; batches?: BatchInfo[]; onProjectUpdate?: (p: Partial<Project>) => void }) {
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
  const [caption, setCaption] = React.useState('');
  const [hashtags, setHashtags] = React.useState('');
  const [firstComment, setFirstComment] = React.useState('');
  const [coverPhoto, setCoverPhoto] = React.useState<string>(DEFAULT_PHOTO);
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
    wrapper.style.cssText = `position:fixed;top:0;left:0;width:${curFmt.w}px;height:${curFmt.h}px;opacity:0;pointer-events:none;overflow:visible;z-index:-1;`;
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
    setExporting('image');
    let cleanup: (() => void) | null = null;
    try {
      const mounted = await mountExportEl();
      cleanup = mounted.cleanup;
      const blob = await exportToPng(mounted.tplEl, { w: curFmt.w, h: curFmt.h }, { photoSrc: coverPhoto, fitCover });
      await downloadBlob(blob, 'social-post.png');
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
        };
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
            wrapper.style.cssText = `position:fixed;top:0;left:0;width:${f.w}px;height:${f.h}px;opacity:0;pointer-events:none;overflow:visible;z-index:-1;`;
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
          vWrap.style.cssText = `position:fixed;top:0;left:0;width:${curFmt.w}px;height:${curFmt.h}px;opacity:0;pointer-events:none;overflow:visible;z-index:-1;`;
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
        };
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
        };
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

  const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid #e4e1da', borderRadius: 8, padding: '10px 12px', fontSize: 13, fontFamily: 'inherit', outline: 'none', background: '#fff' };
  const labelStyle: React.CSSProperties = { display: 'block', fontSize: 12.5, fontWeight: 700, marginBottom: 5 };
  const smallLabelStyle: React.CSSProperties = { display: 'block', fontSize: 11.5, fontWeight: 700, marginBottom: 5 };

  // Preview: fit to viewport height, reactive on resize
  const [winH, setWinH] = React.useState(typeof window !== 'undefined' ? window.innerHeight : 800);
  const closeAllDropdowns = () => { setIconDropdown(null); setCurrencyDropdown(false); };
  React.useEffect(() => {
    const onResize = () => setWinH(window.innerHeight);
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
  const pvScale = Math.min(0.55, scaleByH);
  const pvW = curFmt.w * pvScale;
  const pvH = curFmt.h * pvScale;

  return (
    <div style={s('max-width:1240px;margin:0 auto;padding:16px 32px 64px')}>
      {/* header */}
      <div style={s('display:flex;align-items:center;gap:12px;margin-bottom:22px')}>
        {step > 1 && (
          <Box as="button" onClick={() => setStep(step === 3 ? 1 : step - 1)} style={s('border:1px solid #e4e1da;background:#fff;width:38px;height:38px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center')} hover={s('background:#f6f4f0')}>
            <Icon name="arrow-left" size={15} color="#57534c" />
          </Box>
        )}
        <div style={s('flex:1;min-width:0')}>
          <h1 style={s('margin:0 0 2px;font-size:22px;font-weight:800;letter-spacing:-.4px')}>{stepTitles[step]}</h1>
          <div style={s('font-size:13px;color:#8c867d')}>{stepSubs[step]} · passo {step === 1 ? 1 : step === 3 ? 2 : 3} di 3</div>
        </div>
      </div>

      <input ref={fileInputRef} type="file" accept="image/*,video/*" onChange={handlePhotoUpload} style={{ display: 'none' }} />

      {/* STEP 1: template selection */}
      {step === 1 && (
        <div style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: 22, alignItems: 'start' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, position: 'sticky', top: 24 }}>
            {PS_PLATFORMS.map(pl => (
              <Box key={pl.id} onClick={() => { setPlatform(pl.id); setFormatId(pl.formats[0].id); }} style={{
                padding: '10px 14px', borderRadius: 12, cursor: 'pointer', fontSize: 14,
                fontWeight: platform === pl.id ? 700 : 500,
                color: platform === pl.id ? '#211f1c' : '#8c867d',
                background: platform === pl.id ? '#f1efe9' : 'transparent',
              }} hover={{ background: '#f1efe9' }}>{pl.label}</Box>
            ))}
            <div style={{ height: 1, background: '#ece9e2', margin: '8px 0' }} />
            {formats.map(f => (
              <Box key={f.id} onClick={() => setFormatId(f.id)} style={{
                borderWidth: 1, borderStyle: 'solid', borderColor: formatId === f.id ? '#3B83F6' : '#e4e1da',
                background: formatId === f.id ? '#eef4fe' : '#fff',
                color: formatId === f.id ? '#1d5fd0' : '#57534c',
                fontSize: 11.5, fontWeight: 700, padding: '8px 10px', borderRadius: 8, cursor: 'pointer', minHeight: 38, whiteSpace: 'nowrap', display: 'flex', alignItems: 'center',
              }} hover={{ borderColor: '#3B83F6' }}>{f.label}</Box>
            ))}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* upload cover photo */}
            <div
              style={{
                display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px',
                background: '#fff', border: '1.5px dashed #d8d4cb', borderRadius: 12,
                transition: 'border-color .15s',
                maxWidth: 940, position: 'relative'
              }}
              onMouseEnter={e => (e.currentTarget.style.borderColor = '#3B83F6')}
              onMouseLeave={e => (e.currentTarget.style.borderColor = '#d8d4cb')}
            >
              <div onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', flex: 1, alignItems: 'center', gap: 12, cursor: 'pointer' }}>
                {coverPhoto !== DEFAULT_PHOTO ? (
                  <img src={coverPhoto} alt="" style={{ width: 48, height: 48, borderRadius: 8, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: '#f6f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="upload" size={20} color="#8c867d" />
                  </div>
                )}
                <div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#211f1c' }}>
                    {coverPhoto !== DEFAULT_PHOTO ? 'Cambia foto di sfondo' : 'Carica foto o video'}
                  </div>
                  <div style={{ fontSize: 11.5, color: '#8c867d' }}>JPG, PNG, WebP, MP4</div>
                </div>
              </div>
              {coverPhoto !== DEFAULT_PHOTO && (
                <div 
                  onClick={(e) => { e.stopPropagation(); setCoverPhoto(DEFAULT_PHOTO); }}
                  style={{ width: 32, height: 32, borderRadius: 8, background: '#f6f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', cursor: 'pointer' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#eeebe3')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#f6f4f0')}
                >
                  <Icon name="x" size={16} color="#8c867d" />
                </div>
              )}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 300px)', gap: 20, justifyContent: 'start' }}>
            {TEMPLATES.map(tc => {
              const cardW = 300;
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
                  borderRadius: 14, overflow: 'hidden', cursor: 'pointer',
                  transition: 'transform .15s, box-shadow .15s',
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
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 28, alignItems: 'start' }}>
          {(iconDropdown || currencyDropdown) && (
            <div onClick={closeAllDropdowns} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
          )}
          {/* preview */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, position: 'sticky', top: 16 }}>
            {/* preview with arrows on sides */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <Box as="button" onClick={() => { const i = TEMPLATES.findIndex(t => t.id === tplId); setTplId(TEMPLATES[(i - 1 + TEMPLATES.length) % TEMPLATES.length].id); }} style={s('border:1px solid #e4e1da;background:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none')} hover={s('background:#f6f4f0')}>
                <Icon name="arrow-left" size={14} color="#57534c" />
              </Box>
              <div ref={previewContainerRef} style={{ borderRadius: 12, overflow: 'hidden', boxShadow: '0 12px 36px rgba(33,31,28,.14)', position: 'relative' }}>
                {exporting && (
                  <div style={{
                    position: 'absolute', inset: 0, zIndex: 10, borderRadius: 12,
                    background: 'rgba(0,0,0,.45)', display: 'flex', flexDirection: 'column',
                    alignItems: 'center', justifyContent: 'center', gap: 14,
                  }}>
                    <div style={{
                      width: 36, height: 36, border: '3px solid rgba(255,255,255,.25)',
                      borderTopColor: '#fff', borderRadius: '50%',
                      animation: 'export-spin .8s linear infinite',
                    }} />
                    <span style={{ color: '#fff', fontSize: 13, fontWeight: 700 }}>
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
              <Box as="button" onClick={() => { const i = TEMPLATES.findIndex(t => t.id === tplId); setTplId(TEMPLATES[(i + 1) % TEMPLATES.length].id); }} style={s('border:1px solid #e4e1da;background:#fff;width:34px;height:34px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none')} hover={s('background:#f6f4f0')}>
                <Icon name="arrow-right" size={14} color="#57534c" />
              </Box>
            </div>
          </div>
          {/* sidebar */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* info mini card */}
            <div style={{ background: '#fff', border: '1px solid #f0ede7', borderRadius: 12, padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
              {/* platform row */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#8c867d', marginBottom: 6 }}>Piattaforma</div>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f6f4f0', borderRadius: 8, padding: 3 }}>
                  {PS_PLATFORMS.map(pl => (
                    <div key={pl.id} onClick={() => { setPlatform(pl.id); setFormatId(pl.formats[0].id); }} style={{
                      flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: platform === pl.id ? '#fff' : 'transparent',
                      color: platform === pl.id ? '#211f1c' : '#8c867d',
                      boxShadow: platform === pl.id ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                      transition: 'all .15s',
                    }}>{pl.label}</div>
                  ))}
                </div>
              </div>
              {/* format row */}
              <div>
                <div style={{ fontSize: 11, fontWeight: 600, color: '#8c867d', marginBottom: 6 }}>Formato</div>
                <div style={{ display: 'flex', alignItems: 'center', background: '#f6f4f0', borderRadius: 8, padding: 3 }}>
                  {formats.map(f => (
                    <div key={f.id} onClick={() => setFormatId(f.id)} style={{
                      flex: 1, textAlign: 'center', padding: '6px 0', borderRadius: 6, fontSize: 12, fontWeight: 600, cursor: 'pointer',
                      background: formatId === f.id ? '#fff' : 'transparent',
                      color: formatId === f.id ? '#1d5fd0' : '#8c867d',
                      boxShadow: formatId === f.id ? '0 1px 3px rgba(0,0,0,.08)' : 'none',
                      transition: 'all .15s',
                    }}>
                      {f.id.includes('post') ? 'Post' : f.id.includes('story') ? 'Story' : f.id.includes('reel') ? 'Reel' : f.label.split(' ').pop()}
                    </div>
                  ))}
                </div>
              </div>
              {/* template + size */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #f4f2ee', paddingTop: 12 }}>
                <span style={{ fontSize: 12.5, fontWeight: 700, color: '#211f1c' }}>{curTpl.label}</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#b8b3a9', background: '#f6f4f0', padding: '3px 8px', borderRadius: 4 }}>{curFmt.w} × {curFmt.h}</span>
              </div>
            </div>
            {/* photo upload */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <div
                onClick={() => fileInputRef.current?.click()}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                  background: '#fff', border: '1px solid #f0ede7', borderRadius: 12,
                  cursor: 'pointer', transition: 'border-color .15s',
                }}
                onMouseEnter={e => (e.currentTarget.style.borderColor = '#3B83F6')}
                onMouseLeave={e => (e.currentTarget.style.borderColor = '#f0ede7')}
              >
                {coverPhoto !== DEFAULT_PHOTO ? (
                  isVideo
                    ? <div style={{ width: 44, height: 44, borderRadius: 8, overflow: 'hidden', position: 'relative', flexShrink: 0 }}>
                        <img src={videoThumb || ''} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', background: '#1a1825' }} />
                        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <div style={{ width: 18, height: 18, borderRadius: '50%', background: 'rgba(255,255,255,.85)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <div style={{ width: 0, height: 0, borderLeft: '6px solid #211f1c', borderTop: '4px solid transparent', borderBottom: '4px solid transparent', marginLeft: 1 }} />
                          </div>
                        </div>
                      </div>
                    : <img src={coverPhoto} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f6f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Icon name="upload" size={18} color="#8c867d" />
                  </div>
                )}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: '#211f1c' }}>
                    {coverPhoto !== DEFAULT_PHOTO ? (isVideo ? 'Cambia video' : 'Cambia foto principale') : 'Carica foto o video'}
                  </div>
                  <div style={{ fontSize: 11, color: '#8c867d' }}>JPG, PNG, WebP, MP4</div>
                </div>
                <Icon name="image" size={16} color="#b8b3a9" />
              </div>
              {curTpl.multiPhoto && Array.from({ length: curTpl.multiPhoto - 1 }, (_, i) => (
                <div key={`extra-${i}`}>
                  <input ref={el => { extraFileRefs.current[i] = el; }} type="file" accept="image/*,video/*" onChange={e => handleExtraPhoto(i, e)} style={{ display: 'none' }} />
                  <div
                    onClick={() => extraFileRefs.current[i]?.click()}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px',
                      background: '#fff', border: '1px solid #f0ede7', borderRadius: 12,
                      cursor: 'pointer', transition: 'border-color .15s',
                    }}
                    onMouseEnter={e => (e.currentTarget.style.borderColor = '#3B83F6')}
                    onMouseLeave={e => (e.currentTarget.style.borderColor = '#f0ede7')}
                  >
                    {extraPhotos[i] ? (
                      <img src={extraPhotos[i]} alt="" style={{ width: 44, height: 44, borderRadius: 8, objectFit: 'cover' }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 8, background: '#f6f4f0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon name="upload" size={18} color="#8c867d" />
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#211f1c' }}>
                        {extraPhotos[i] ? `Cambia foto ${i + 2}` : `Carica foto ${i + 2}`}
                      </div>
                      <div style={{ fontSize: 11, color: '#8c867d' }}>JPG, PNG, WebP, MP4</div>
                    </div>
                    <Icon name="image" size={16} color="#b8b3a9" />
                  </div>
                </div>
              ))}
            </div>
            {/* fields card */}
            <div style={{ background: '#fff', border: '1px solid #f0ede7', borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8c867d', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Dati immobile</div>
              {hasField('title') && <div><label style={labelStyle}>Titolo</label><input value={fields.titolo} onChange={e => setField('titolo', e.target.value)} placeholder="Es. Appartamento" style={inputStyle} /></div>}
              {hasField('address') && <div><label style={labelStyle}>Indirizzo</label><input value={fields.indirizzo} onChange={e => setField('indirizzo', e.target.value)} placeholder="Es. Milano, Porta Nuova" style={inputStyle} /></div>}
              {hasField('price') && <div style={{ position: 'relative' }}>
                <label style={labelStyle}>Prezzo</label>
                <div style={{ position: 'relative' }}>
                  <input value={fields.prezzo} onChange={e => { const n = e.target.value.replace(/\D/g, ''); setField('prezzo', n ? Number(n).toLocaleString('it-IT') : ''); }} inputMode="numeric" placeholder="250.000" style={{ ...inputStyle, paddingRight: 34 }} />
                  <div
                    onClick={() => { setIconDropdown(null); setCurrencyDropdown(!currencyDropdown); }}
                    style={{
                      position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)',
                      width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      cursor: 'pointer', border: '1px solid #e4e1da', background: currencyDropdown ? '#f6f4f0' : 'transparent',
                      color: '#211f1c', transition: 'all .15s', fontSize: 13, fontWeight: 700,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B83F6'; e.currentTarget.style.background = '#f6f4f0'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = '#e4e1da'; e.currentTarget.style.background = currencyDropdown ? '#f6f4f0' : 'transparent'; }}
                  >
                    {currency}
                  </div>
                </div>
                {currencyDropdown && (
                  <div style={{
                    position: 'absolute', top: '100%', right: 0, zIndex: 50, marginTop: 4,
                    background: '#fff', border: '1px solid #e4e1da', borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,.10)', padding: 4, display: 'flex', gap: 2,
                  }}>
                    {['€', '$', '£', 'CHF'].map(c => (
                      <div key={c} onClick={() => { setCurrency(c); setCurrencyDropdown(false); }} style={{
                        width: 36, height: 32, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        cursor: 'pointer', fontSize: 14, fontWeight: 600,
                        border: currency === c ? '1.5px solid #3B83F6' : '1.5px solid transparent',
                        background: currency === c ? '#eef4fe' : 'transparent',
                        color: currency === c ? '#3B83F6' : '#6b7280', transition: 'all .15s',
                      }}
                        onMouseEnter={e => { if (currency !== c) { e.currentTarget.style.background = '#f6f4f0'; e.currentTarget.style.color = '#211f1c'; } }}
                        onMouseLeave={e => { if (currency !== c) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; } }}
                      >{c}</div>
                    ))}
                  </div>
                )}
              </div>}
              {hasField('metrics') && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 9 }}>
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
                        <input value={fields[m.stateKey]} onChange={e => setField(m.stateKey, e.target.value)} placeholder={m.placeholder} style={{ ...inputStyle, paddingRight: 34 }} />
                        <div
                          onClick={() => { setCurrencyDropdown(false); setIconDropdown(iconDropdown === m.field ? null : m.field); }}
                          style={{
                            position: 'absolute', right: 5, top: '50%', transform: 'translateY(-50%)',
                            width: 26, height: 26, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', border: '1px solid #e4e1da', background: iconDropdown === m.field ? '#f6f4f0' : 'transparent',
                            color: '#211f1c', transition: 'all .15s',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.borderColor = '#3B83F6'; e.currentTarget.style.background = '#f6f4f0'; }}
                          onMouseLeave={e => { e.currentTarget.style.borderColor = '#e4e1da'; e.currentTarget.style.background = iconDropdown === m.field ? '#f6f4f0' : 'transparent'; }}
                        >
                          <span style={{ width: 14, height: 14, display: 'flex' }} dangerouslySetInnerHTML={{ __html: (TPL_ICONS as Record<string, string>)[iconKey] || '' }} />
                        </div>
                      </div>
                      {iconDropdown === m.field && (
                        <div style={{
                          position: 'absolute', top: '100%', right: 0, zIndex: 50,
                          background: '#fff', border: '1px solid #e4e1da', borderRadius: 8,
                          boxShadow: '0 4px 12px rgba(0,0,0,.10)',
                          display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 4, padding: 6, marginTop: 4,
                        }}>
                          {PICKER_ICONS.map(pi => (
                            <div key={pi.key} onClick={() => { setFieldIcons(prev => ({ ...prev, [m.field]: pi.key })); setIconDropdown(null); }} style={{
                              width: 30, height: 30, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
                              cursor: 'pointer', border: fieldIcons[m.field] === pi.key ? '1.5px solid #3B83F6' : '1.5px solid transparent',
                              background: fieldIcons[m.field] === pi.key ? '#eef4fe' : 'transparent',
                              color: fieldIcons[m.field] === pi.key ? '#3B83F6' : '#6b7280',
                              transition: 'all .15s',
                            }}
                              onMouseEnter={e => { if (fieldIcons[m.field] !== pi.key) { e.currentTarget.style.background = '#f6f4f0'; e.currentTarget.style.color = '#211f1c'; } }}
                              onMouseLeave={e => { if (fieldIcons[m.field] !== pi.key) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#6b7280'; } }}
                            >
                              <span style={{ width: 16, height: 16, display: 'flex' }} dangerouslySetInnerHTML={{ __html: (TPL_ICONS as Record<string, string>)[pi.key] || '' }} />
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
            <div style={{ background: '#fff', border: '1px solid #f0ede7', borderRadius: 12, padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#8c867d', textTransform: 'uppercase' as const, letterSpacing: '0.05em' }}>Stile</div>
              {/* logo toggle */}
              <div style={s('display:flex;align-items:center;justify-content:space-between')}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Logo</span>
                <div onClick={() => setShowLogo(!showLogo)} style={{ width: 40, height: 24, borderRadius: 99, background: showLogo ? '#3B83F6' : '#d8d4cb', position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
                  <span style={{ position: 'absolute', top: 3, left: showLogo ? 19 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
                </div>
              </div>
              {/* logo variant picker — only when logos are loaded in Brand */}
              {showLogo && BRAND_LOGO_KEYS.some(k => allBrandLogos[k]) && (() => {
                const opts = [{ key: 'auto', label: 'Logo automatico', src: null as string | null }, ...BRAND_LOGO_KEYS.filter(k => allBrandLogos[k]).map(k => ({ key: k as string, label: LOGO_VARIANT_LABELS[k], src: allBrandLogos[k] }))];
                const cur = opts.find(o => o.key === selectedLogoKey) || opts[0];
                const thumbBg = (key: string) => key.startsWith('white') ? '#211f1c' : '#f6f4f0';
                return (
                  <>
                    <div style={{ position: 'relative' }}>
                      <Box as="button" onClick={() => setLogoMenuOpen(o => !o)} style={{
                        width: '100%', border: '1px solid #e4e1da', borderRadius: 10, padding: '8px 12px',
                        fontSize: 13, fontWeight: 600, background: '#fff', cursor: 'pointer', color: '#211f1c',
                        display: 'flex', alignItems: 'center', gap: 10, minHeight: 40,
                      }} hover={{ background: '#faf9f7' }}>
                        {cur.src && (
                          <span style={{ width: 28, height: 20, borderRadius: 4, background: thumbBg(cur.key), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', overflow: 'hidden' }}>
                            <img src={cur.src} alt="" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                          </span>
                        )}
                        <span style={{ flex: 1, textAlign: 'left', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{cur.label}</span>
                        <Icon name="chevron-down" size={15} color="#8c867d" />
                      </Box>
                      {logoMenuOpen && (
                        <>
                          <div onClick={() => setLogoMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 40 }} />
                          <div style={{
                            position: 'absolute', top: 'calc(100% + 4px)', left: 0, right: 0, zIndex: 50,
                            background: '#fff', border: '1px solid #e4e1da', borderRadius: 10,
                            boxShadow: '0 8px 24px rgba(33,31,28,.12)', padding: 4, maxHeight: 280, overflowY: 'auto',
                          }}>
                            {opts.map(o => (
                              <div key={o.key} onClick={() => { setSelectedLogoKey(o.key); setLogoMenuOpen(false); }} style={{
                                display: 'flex', alignItems: 'center', gap: 10, padding: '8px 10px', borderRadius: 7, cursor: 'pointer',
                                background: o.key === selectedLogoKey ? '#eef4fe' : 'transparent',
                              }}
                                onMouseEnter={e => { if (o.key !== selectedLogoKey) e.currentTarget.style.background = '#f6f4f0'; }}
                                onMouseLeave={e => { if (o.key !== selectedLogoKey) e.currentTarget.style.background = 'transparent'; }}
                              >
                                {o.src ? (
                                  <span style={{ width: 32, height: 22, borderRadius: 4, background: thumbBg(o.key), display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none', overflow: 'hidden' }}>
                                    <img src={o.src} alt="" style={{ maxWidth: '80%', maxHeight: '80%', objectFit: 'contain' }} />
                                  </span>
                                ) : (
                                  <span style={{ width: 32, height: 22, borderRadius: 4, background: '#f0ede7', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                                    <Icon name="sparkles" size={13} color="#8c867d" />
                                  </span>
                                )}
                                <span style={{ fontSize: 13, fontWeight: o.key === selectedLogoKey ? 700 : 500, color: '#211f1c' }}>{o.label}</span>
                              </div>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                    <div style={{ height: 1, background: '#f0ede7', margin: '4px 0' }} />
                  </>
                );
              })()}
              {/* fit cover toggle */}
              {supportsFitCover && (
              <>
              <div style={s('display:flex;align-items:center;justify-content:space-between')}>
                <span style={{ fontSize: 13, fontWeight: 600 }}>Foto full screen</span>
                <div onClick={() => setFitCover(!fitCover)} style={{ width: 40, height: 24, borderRadius: 99, background: fitCover ? '#3B83F6' : '#d8d4cb', position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
                  <span style={{ position: 'absolute', top: 3, left: fitCover ? 19 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
                </div>
              </div>
              <div style={{ height: 1, background: '#f0ede7', margin: '4px 0' }} />
              </>
              )}
              {/* badge toggle */}
              {hasField('badge') && <div>
                <div style={s('display:flex;align-items:center;justify-content:space-between')}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Badge</span>
                  <div onClick={() => setShowBadge(!showBadge)} style={{ width: 40, height: 24, borderRadius: 99, background: showBadge ? '#3B83F6' : '#d8d4cb', position: 'relative', cursor: 'pointer', transition: 'background .2s' }}>
                    <span style={{ position: 'absolute', top: 3, left: showBadge ? 19 : 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.2)', transition: 'left .2s' }} />
                  </div>
                </div>
                {showBadge && <input value={fields.badgeTxt} onChange={e => setField('badgeTxt', e.target.value)} placeholder="Es. Nuovo" style={{ ...inputStyle, marginTop: 8 }} />}
              </div>}
              <div style={{ height: 1, background: '#f0ede7', marginTop: 4, marginBottom: 4 }} />
              {/* oscuramento */}
              <div>
                <div style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:6px')}>
                  <span style={{ fontSize: 13, fontWeight: 600 }}>Oscuramento</span>
                  <span style={{ fontSize: 12, fontWeight: 800, color: '#8c867d' }}>{oscuramento}%</span>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <Box as="button" title={tip} onClick={() => { if (!disImg) handleExportImage(); }} style={{ border: '1px solid #e4e1da', background: '#fff', fontSize: 13, fontWeight: 700, padding: '12px 16px', borderRadius: 10, cursor: disImg ? 'default' : 'pointer', minHeight: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: disImg ? 0.4 : 1 }} hover={disImg ? {} : { background: '#f6f4f0' }}>
                <Icon name="download" size={15} color="#57534c" />{exporting === 'image' ? 'Esportazione...' : 'Scarica immagine'}
              </Box>
              <Box as="button" title={tip} onClick={() => { if (!dis) setShowAnimPicker(true); }} style={{ border: '1px solid #e4e1da', background: '#fff', fontSize: 13, fontWeight: 700, padding: '12px 16px', borderRadius: 10, cursor: dis ? 'default' : 'pointer', minHeight: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: dis ? 0.4 : 1 }} hover={dis ? {} : { background: '#f6f4f0' }}>
                <Icon name="film" size={15} color="#57534c" />Scarica video
              </Box>
              <Box as="button" title={tip} onClick={() => { if (!disImg) handleExportAll(); }} style={{ border: '1px dashed #d8d4cb', background: 'transparent', fontSize: 12, fontWeight: 600, padding: '10px 16px', borderRadius: 10, cursor: disImg ? 'default' : 'pointer', minHeight: 38, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, opacity: disImg ? 0.4 : 1, color: '#8c867d' }} hover={disImg ? {} : { background: '#f6f4f0', color: '#57534c' }}>
                <Icon name="layers" size={14} color="#8c867d" />{exporting === 'image' ? 'Esportazione...' : `Scarica tutti (${TEMPLATES.length})`}
              </Box>
            </div>
            ); })()}
          </div>
        </div>
      )}

      {/* Animation picker modal */}
      {(showAnimPicker || exporting === 'video') && (
        <div onClick={() => { if (exporting !== 'video') setShowAnimPicker(false); }} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', zIndex: 100, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: '#fff', borderRadius: 20, padding: '28px 28px 24px', width: 'min(520px, 92vw)', boxShadow: '0 24px 64px rgba(0,0,0,.22)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 16 }}>
              <div>
                <div style={{ fontSize: 18, fontWeight: 800, color: '#211f1c' }}>{exporting === 'video' ? 'Generazione video' : 'Stile animazione'}</div>
                <div style={{ fontSize: 13, color: '#8c867d', marginTop: 2 }}>{exporting === 'video' ? 'Attendi, stiamo creando il tuo video' : 'Scegli come appaiono gli elementi nel video'}</div>
              </div>
              <button onClick={() => { if (exporting === 'video') exportAbortRef.current?.abort(); else setShowAnimPicker(false); }} style={{ border: 'none', background: '#f6f4f0', borderRadius: 8, width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }} title={exporting === 'video' ? 'Annulla' : 'Chiudi'}>
                <Icon name="x" size={16} color="#57534c" />
              </button>
            </div>
            {exporting === 'video' ? (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '14px 0 26px' }}>
                {/* Loader blob come Video AI */}
                <div style={{ position: 'relative', width: 120, height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
                  <div style={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', border: '1.5px solid rgba(59,131,246,.20)', animation: 'pulse-ring 2.8s ease-out infinite' }} />
                  <div style={{ position: 'absolute', width: 110, height: 110, borderRadius: '50%', border: '1.5px solid rgba(59,131,246,.20)', animation: 'pulse-ring 2.8s ease-out infinite', animationDelay: '1.4s' }} />
                  <div style={{ position: 'absolute', width: 72, height: 72, background: 'radial-gradient(circle at 30% 26%, #AECBFF 0%, #3B83F6 46%, #5B6CF0 100%)', opacity: .95, boxShadow: '0 0 30px rgba(91,108,240,.45), 0 0 14px rgba(59,131,246,.55)', animation: 'organic-blob 8s ease-in-out infinite' }} />
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src="/dashboard/logo-mark-white.svg" alt="" style={{ position: 'relative', width: 56, height: 56, animation: 'aurora-pulse 4s ease-in-out infinite' }} />
                </div>
                <span style={{ fontSize: 32, fontWeight: 800, color: '#211f1c', lineHeight: 1 }}>{exportProgress}%</span>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#b3aca1', marginTop: 2, textTransform: 'uppercase', letterSpacing: '.06em' }}>Rendering</span>
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 10, marginBottom: 24 }}>
                {ANIM_STYLES.map(a => {
                  const sel = animStyle === a.id;
                  return (
                    <div key={a.id} onClick={() => setAnimStyle(a.id)} style={{
                      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, padding: '14px 6px 10px',
                      borderRadius: 12, cursor: 'pointer',
                      border: sel ? '2px solid #3B83F6' : '2px solid transparent',
                      background: sel ? '#eef4fe' : '#f6f4f0',
                      transition: 'all .15s',
                    }}
                      onMouseEnter={e => { if (!sel) e.currentTarget.style.background = '#ece9e2'; }}
                      onMouseLeave={e => { if (!sel) e.currentTarget.style.background = '#f6f4f0'; }}
                    >
                      <div className={`acp--${a.id}`} style={{ width: 68, height: 95, borderRadius: 8, background: 'linear-gradient(145deg, #2a2733, #1a1825)', position: 'relative', overflow: 'hidden', flexShrink: 0 }}>
                        <div className="aw aw-badge" />
                        <div className="aw aw-price" />
                        <div className="aw aw-title" />
                        <div className="aw aw-addr" />
                        <div className="aw aw-m1" />
                        <div className="aw aw-m2" />
                        <div className="aw aw-m3" />
                        <div className="aw aw-desc" />
                      </div>
                      <span style={{ fontSize: 11, fontWeight: 600, color: sel ? '#1d5fd0' : '#57534c' }}>{a.label}</span>
                    </div>
                  );
                })}
              </div>
            )}
            {exporting !== 'video' && (
              <Box as="button" onClick={() => handleExportVideo()} style={{ border: '2px solid transparent', background: '#3B83F6', color: '#fff', fontSize: 14, fontWeight: 700, padding: '13px 16px', borderRadius: 12, cursor: 'pointer', minHeight: 44, width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} hover={{ background: '#2b6fe0', color: '#fff' }}>
                <Icon name="download" size={16} color="currentColor" />Scarica video
              </Box>
            )}
          </div>
        </div>
      )}

      {/* STEP 4: publish */}
      {step === 4 && (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 24, alignItems: 'start', maxWidth: 980 }}>
          {/* preview thumb */}
          <div style={s('display:flex;flex-direction:column;align-items:center;gap:10px')}>
            <div style={{ width: 240, aspectRatio: '4/5', borderRadius: 16, overflow: 'hidden', boxShadow: '0 10px 28px rgba(33,31,28,.12)', display: 'flex', flexDirection: 'column', background: '#fff' }}>
              <div style={{ flex: 1, background: 'url(https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?w=400&h=500&fit=crop) center/cover' }} />
              <div style={{ flex: 'none', background: 'linear-gradient(0deg, rgba(20,18,15,.92), rgba(20,18,15,.78))', padding: '10px 12px' }}>
                <div style={{ fontSize: 11, fontWeight: 800, color: '#fff' }}>{fields.titolo || 'Appartamento'}</div>
              </div>
            </div>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#8c867d' }}>{curFmt.label}</span>
          </div>
          {/* publish form */}
          <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:12px;padding:22px;display:flex;flex-direction:column;gap:15px')}>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Piattaforme</div>
              <div style={s('display:flex;gap:8px')}>
                {(['instagram', 'facebook', 'tiktok'] as const).map(pp => (
                  <Box as="button" key={pp} onClick={() => setPubPlatforms(p => ({ ...p, [pp]: !p[pp] }))} style={{
                    border: `1px solid ${pubPlatforms[pp] ? '#3B83F6' : '#e4e1da'}`,
                    background: pubPlatforms[pp] ? '#eef4fe' : '#fff',
                    color: pubPlatforms[pp] ? '#1d5fd0' : '#57534c',
                    fontSize: 13, fontWeight: 700, padding: '9px 18px', borderRadius: 8, cursor: 'pointer', minHeight: 38,
                    textTransform: 'capitalize',
                  }} hover={{ borderColor: '#3B83F6' }}>{pp}</Box>
                ))}
              </div>
            </div>
            <div>
              <div style={{ fontSize: 12.5, fontWeight: 700, marginBottom: 8 }}>Quando</div>
              <div style={s('display:flex;gap:8px')}>
                {(['schedule', 'now'] as const).map(m => (
                  <Box as="button" key={m} onClick={() => setPubMode(m)} style={{
                    border: `1px solid ${pubMode === m ? '#3B83F6' : '#e4e1da'}`,
                    background: pubMode === m ? '#eef4fe' : '#fff',
                    color: pubMode === m ? '#1d5fd0' : '#57534c',
                    fontSize: 13, fontWeight: 700, padding: '9px 18px', borderRadius: 8, cursor: 'pointer', minHeight: 38,
                  }} hover={{ borderColor: '#3B83F6' }}>{m === 'schedule' ? 'Programma' : 'Pubblica ora'}</Box>
                ))}
              </div>
            </div>
            {pubMode === 'schedule' && (
              <div>
                <label style={labelStyle}>Data e ora</label>
                <input type="datetime-local" style={inputStyle} />
                <div style={{ fontSize: 11.5, color: '#8c867d', marginTop: 5 }}>Instagram consente di programmare fino a 75 giorni in anticipo.</div>
              </div>
            )}
            <div>
              <div style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:5px')}>
                <label style={{ fontSize: 12.5, fontWeight: 700 }}>Caption</label>
                <span style={{ fontSize: 11.5, fontWeight: 700, color: '#8c867d' }}>{caption.length}/2200</span>
              </div>
              <textarea value={caption} onChange={e => setCaption(e.target.value)} rows={3} maxLength={2200} placeholder="Descrizione del post..." style={{ ...inputStyle, lineHeight: 1.5 }} />
            </div>
            <div><label style={labelStyle}>Hashtags</label><input value={hashtags} onChange={e => setHashtags(e.target.value)} placeholder="#immobiliare #casainvendita" style={inputStyle} /></div>
            <div><label style={labelStyle}>Primo commento (opzionale)</label><input value={firstComment} onChange={e => setFirstComment(e.target.value)} placeholder="Commento automatico dopo la pubblicazione..." style={inputStyle} /></div>
            <Box as="button" onClick={() => { toast('Post programmato con successo', 'check'); setStep(1); }} style={s('border:none;background:#3B83F6;color:#fff;font-size:13.5px;font-weight:700;padding:12px 16px;border-radius:8px;cursor:pointer;min-height:38px;margin-top:4px')} hover={s('background:#2b6fe0')}>
              {pubMode === 'schedule' ? 'Programma' : 'Pubblica ora'}
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
      <div style={s('display:flex;align-items:baseline;justify-content:space-between;margin-bottom:6px')}>
        <span style={s('font-size:13px;font-weight:700;color:#211f1c')}>{label}</span>
        <span style={s('font-size:12.5px;font-weight:700;color:#8c867d')}>{used} / {total}</span>
      </div>
      <div style={{ height: 6, background: '#f0ede7', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: pct + '%', background: color, borderRadius: 3, transition: 'width .4s ease' }} />
      </div>
    </div>
  );
}

function AccountScreen({ credits, toast, go, userData }: { credits: number; toast: (msg: string, icon?: string) => void; go: (r: string) => void; userData: UserData | null }) {
  const activePlan = userData?.subscriptionType ? (SUB_TYPE_TO_PLAN[userData.subscriptionType] ?? 'quarterly') : 'quarterly';
  const currentPlan = PLANS.find(p => p.id === activePlan)!;
  const monthlyCost = 100;

  return (
    <div style={s('max-width:1160px;margin:0 auto;padding:32px 32px 64px')}>
      {/* header */}
      <div style={s('margin-bottom:24px')}>
        <h1 style={s('margin:0 0 4px;font-size:25px;font-weight:800;letter-spacing:-.5px')}>Piano</h1>
        <div style={s('color:#8c867d;font-size:14px')}>Gestisci il tuo abbonamento.</div>
      </div>

      {/* ── CURRENT PLAN SUMMARY ── */}
      <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:24px 28px;margin-bottom:20px')}>
        <div className="max-md:!flex-col max-md:!items-start" style={s('display:flex;align-items:center;gap:20px')}>
          <div style={s('flex:1;min-width:0')}>
            <div style={s('display:flex;align-items:center;gap:10px')}>
              <span style={s('font-size:18px;font-weight:800;letter-spacing:-.3px')}>Piano {currentPlan.name}</span>
              <span style={s('font-size:10.5px;font-weight:800;background:#3B83F6;color:#fff;padding:4px 12px;border-radius:8px;letter-spacing:.03em')}>ATTIVO</span>
            </div>
          </div>
          <Box as="button" onClick={() => window.open(STRIPE_BILLING_PORTAL, '_blank')} className="max-md:!w-full" style={s('border:1px solid #e4e1da;background:#fff;font-size:13px;font-weight:700;padding:10px 18px;border-radius:10px;cursor:pointer;min-height:44px;white-space:nowrap')} hover={s('background:#f6f4f0')}>Gestisci piano</Box>
        </div>
      </div>

      {/* ── PLAN CARDS ── */}
      <div style={s('margin-bottom:20px')}>
        <div style={s('font-size:16px;font-weight:800;margin-bottom:14px;letter-spacing:-.2px')}>Confronta i piani</div>
        <div className="max-md:!grid-cols-1" style={s('display:grid;grid-template-columns:repeat(3,1fr);gap:20px;align-items:stretch')}>
          {PLANS.map((plan) => {
            const active = plan.id === activePlan;
            const savings = plan.price < monthlyCost ? (monthlyCost - plan.price) * 12 : 0;
            return (
              <Box key={plan.id} style={{
                background: active ? '#3B83F6' : '#fff',
                border: active ? '2px solid #3B83F6' : '1.5px solid #ece9e2',
                borderRadius: 16,
                padding: '32px 28px 28px',
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
                    fontSize: 10.5, fontWeight: 800, padding: '5px 16px', borderRadius: 20,
                    whiteSpace: 'nowrap', letterSpacing: '.04em', textTransform: 'uppercase',
                    background: active ? '#fff' : '#211f1c', color: active ? '#3B83F6' : '#fff',
                    boxShadow: '0 2px 8px rgba(33,31,28,.12)',
                  }}>{plan.badge}</span>
                )}

                <div style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:6px')}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: active ? 'rgba(255,255,255,.85)' : '#8c867d', letterSpacing: '.02em', textTransform: 'uppercase' }}>{plan.name}</span>
                  {active && <span style={{ fontSize: 11, fontWeight: 800, background: 'rgba(255,255,255,.2)', color: '#fff', padding: '5px 14px', borderRadius: 20, letterSpacing: '.03em' }}>ATTIVO</span>}
                </div>

                <div style={s('display:flex;align-items:baseline;gap:6px')}>
                  <span style={{ fontSize: 48, fontWeight: 800, color: active ? '#fff' : '#211f1c', letterSpacing: -2, lineHeight: 1 }}>{plan.price}€</span>
                  <span style={{ fontSize: 16, fontWeight: 600, color: active ? 'rgba(255,255,255,.55)' : '#b3aca1' }}>{plan.period}</span>
                </div>
                {savings > 0 && (
                  <div style={{ fontSize: 12.5, fontWeight: 700, color: active ? 'rgba(255,255,255,.7)' : '#10b981', marginTop: 4 }}>Risparmi {savings}€/anno vs Mensile</div>
                )}

                <div style={{ height: 1, background: active ? 'rgba(255,255,255,.15)' : '#f0ede7', margin: '20px 0' }} />

                <div style={s('display:flex;flex-direction:column;gap:14px;flex:1')}>
                  {plan.features.map((f, i) => (
                    <div key={i} style={s('display:flex;align-items:center;gap:12px')}>
                      <span style={{
                        width: 22, height: 22, flex: 'none', borderRadius: '50%',
                        background: active ? 'rgba(255,255,255,.2)' : '#f0ede7',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <Icon name="check" size={12} color={active ? '#fff' : '#8c867d'} />
                      </span>
                      <span style={{ fontSize: 14.5, fontWeight: 500, color: active ? 'rgba(255,255,255,.92)' : '#57534c', lineHeight: 1.45 }}>{f}</span>
                    </div>
                  ))}
                </div>

                <Box as="button" onClick={() => {
                  if (active) toast('Sei già su questo piano', 'check');
                  else if (userData) redirectToStripePayment(plan.id, userData.id, userData.email);
                }} style={{
                  marginTop: 28,
                  border: 'none',
                  background: active ? '#fff' : '#211f1c',
                  color: active ? '#3B83F6' : '#fff',
                  fontSize: 15, fontWeight: 700, padding: '14px 20px', borderRadius: 12,
                  cursor: 'pointer', minHeight: 48, width: '100%',
                  transition: 'background .2s, transform .15s',
                  boxShadow: active ? '0 2px 8px rgba(0,0,0,.08)' : 'none',
                }} hover={{
                  background: active ? '#f0f6ff' : '#333028',
                  transform: 'scale(0.98)',
                }}>
                  {active ? 'Piano attuale' : 'Scegli questo piano'}
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
    { key: 'logo_white_v', label: 'Bianco', bg: '#211f1c' },
    { key: 'logo_black_v', label: 'Nero', bg: '#fff' },
    { key: 'logo_colored_v', label: 'Colore', bg: '#f6f4f0' },
  ]},
  { label: 'Logo + Nome', variants: [
    { key: 'logo_white_h', label: 'Bianco', bg: '#211f1c' },
    { key: 'logo_black_h', label: 'Nero', bg: '#fff' },
    { key: 'logo_colored_h', label: 'Colore', bg: '#f6f4f0' },
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
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err: any) {
      toast(err.message, 'x');
      setDeleteLoading(false);
      setDeleteModalOpen(false);
    }
  };

  return (
    <div style={s('max-width:1160px;margin:0 auto;padding:36px 32px 64px')}>
      <h1 style={s('margin:0 0 4px;font-size:27px;font-weight:800;letter-spacing:-.5px')}>Impostazioni</h1>
      <div style={s('color:#8c867d;font-size:14px;margin-bottom:28px')}>Gestisci il tuo account e le preferenze dell'app.</div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Info Box */}
        <div style={{ background: '#fff', border: '1px solid #f0ede7', borderRadius: 16, padding: 24 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Informazioni</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0ede7' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#211f1c' }}>Versione App</div>
            <div style={{ fontSize: 14, color: '#8c867d' }}>1.0.0</div>
          </div>
          <a href="https://www.getnearme.it/it/privacy" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', borderBottom: '1px solid #f0ede7', textDecoration: 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#211f1c' }}>Privacy Policy</div>
            <Icon name="external-link" size={14} color="#8c867d" />
          </a>
          <a href="https://www.getnearme.it/it/terms" target="_blank" rel="noreferrer" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 0', textDecoration: 'none' }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: '#211f1c' }}>Termini e Condizioni</div>
            <Icon name="external-link" size={14} color="#8c867d" />
          </a>
        </div>

        {/* Danger Zone */}
        <div style={{ background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 16, padding: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
          <div style={{ flex: '1 1 300px' }}>
            <h3 style={{ margin: '0 0 8px', fontSize: 15, fontWeight: 700, color: '#dc2626' }}>Zona Pericolosa</h3>
            <p style={{ margin: 0, fontSize: 13, color: '#b91c1c', maxWidth: 600 }}>
              L'eliminazione dell'account è irreversibile. Tutti i tuoi progetti, foto AI, video e brand verranno cancellati definitivamente dai nostri server.
            </p>
          </div>

          <div style={{ flex: 'none' }}>
            <Box as="button" onClick={() => { setDeleteModalOpen(true); setDeleteConfirmText(''); }} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 8, fontSize: 13.5, fontWeight: 700, background: '#dc2626', color: '#fff', border: 'none', cursor: 'pointer' } as React.CSSProperties} hover={{ background: '#b91c1c' }}>
              <Icon name="trash" size={16} color="#fff" />
              Elimina account
            </Box>
          </div>
        </div>
      </div>

      {deleteModalOpen && (
        <div onClick={() => setDeleteModalOpen(false)} style={s('position:fixed;inset:0;background:rgba(24,21,17,.5);z-index:9999;display:flex;align-items:center;justify-content:center;padding:24px')}>
          <div onClick={e => e.stopPropagation()} style={s('width:100%;max-width:440px;background:#fff;border-radius:20px;box-shadow:0 32px 64px rgba(20,18,15,.2);padding:32px')}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}>
              <div style={{ width: 56, height: 56, borderRadius: '50%', background: '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="alert-triangle" size={28} color="#dc2626" />
              </div>
            </div>
            <h3 style={{ margin: '0 0 12px', fontSize: 20, fontWeight: 800, textAlign: 'center', color: '#1a1a1a' }}>Sei assolutamente sicuro?</h3>
            <p style={{ margin: '0 0 24px', fontSize: 14, color: '#57534c', textAlign: 'center', lineHeight: 1.5 }}>
              Questa azione <strong>non può essere annullata</strong>. L'eliminazione dell'account comporterà la perdita di tutti i tuoi dati, crediti e progetti.
            </p>
            
            <div style={{ marginBottom: 24 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#211f1c', marginBottom: 8 }}>
                Scrivi <strong style={{ color: '#dc2626' }}>ELIMINA</strong> per confermare:
              </label>
              <input 
                type="text" 
                value={deleteConfirmText} 
                onChange={e => setDeleteConfirmText(e.target.value)} 
                placeholder="ELIMINA" 
                style={{ width: '100%', border: '1px solid #e4e1da', borderRadius: 10, padding: '12px 16px', fontSize: 14, outline: 'none' }}
              />
            </div>

            <div style={{ display: 'flex', gap: 12 }}>
              <Box as="button" onClick={() => setDeleteModalOpen(false)} style={{ flex: 1, padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#f4f2ee', color: '#57534c', border: 'none', cursor: 'pointer' } as React.CSSProperties} hover={{ background: '#e9e6df' }}>
                Annulla
              </Box>
              <Box as="button" disabled={deleteConfirmText !== 'ELIMINA' || deleteLoading} onClick={handleDelete} style={{ flex: 1, padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#dc2626', color: '#fff', border: 'none', cursor: deleteConfirmText !== 'ELIMINA' || deleteLoading ? 'not-allowed' : 'pointer', opacity: deleteConfirmText !== 'ELIMINA' || deleteLoading ? 0.5 : 1 } as React.CSSProperties} hover={deleteConfirmText === 'ELIMINA' && !deleteLoading ? { background: '#b91c1c' } : undefined}>
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
    <div style={s('max-width:800px;margin:0 auto;padding:36px 32px 64px')}>
      <h1 style={s('margin:0 0 4px;font-size:27px;font-weight:800;letter-spacing:-.5px')}>Assistenza</h1>
      <div style={s('color:#8c867d;font-size:14px;margin-bottom:32px')}>Come possiamo aiutarti? Inviaci una segnalazione o richiedi supporto tecnico.</div>

      <div style={{ background: '#fff', border: '1px solid #f0ede7', borderRadius: 16, padding: 24 }}>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#211f1c', marginBottom: 8 }}>Tipo di richiesta</label>
            <div style={{ position: 'relative' }}>
              <select 
                value={type} 
                onChange={e => setType(e.target.value)}
                style={{ width: '100%', appearance: 'none', border: '1px solid #e4e1da', borderRadius: 10, padding: '12px 16px', fontSize: 14, outline: 'none', background: '#fff', color: '#211f1c', cursor: 'pointer' }}
              >
                <option value="support">Assistenza generale</option>
                <option value="bug">Segnala un problema (Bug)</option>
                <option value="feature">Richiedi funzione / Suggerimento</option>
              </select>
              <Icon name="chevron-down" size={16} color="#8c867d" style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
            </div>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: '#211f1c', marginBottom: 8 }}>Messaggio</label>
            <textarea 
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder={type === 'feature' ? 'Raccontaci la tua idea: che funzionalità ti servirebbe e perché?' : type === 'bug' ? 'Descrivi il problema nel dettaglio. Cosa stavi facendo quando si è verificato?' : 'Scrivi qui la tua richiesta...'}
              style={{ width: '100%', border: '1px solid #e4e1da', borderRadius: 10, padding: '12px 16px', fontSize: 14, outline: 'none', minHeight: 140, resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
            <Box as="button" type="submit" disabled={loading} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 10, fontSize: 14, fontWeight: 700, background: '#1d5fd0', color: '#fff', border: 'none', cursor: loading ? 'default' : 'pointer', opacity: loading ? 0.7 : 1 } as React.CSSProperties} hover={!loading ? { background: '#1850b0' } : undefined}>
              {loading ? 'Invio in corso...' : 'Invia richiesta'}
            </Box>
          </div>

        </form>
      </div>
    </div>
  );
}

function BrandScreen({ toast, brand: brandProp, setBrand: setBrandParent, brandRole }: { toast: (msg: string, icon?: string) => void; brand: BrandSettings; setBrand: (b: BrandSettings) => void; brandRole: 'owner' | 'member' | null }) {
  const [brand, setBrand] = React.useState<BrandState>(brandProp as unknown as BrandState);
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
    if (file.size > 500 * 1024) { toast('File troppo grande (max 500 KB)', 'x'); return; }
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
    setBrand(b => ({ ...b, logos: { ...b.logos, [variant]: null } }));
    const ok = await removeBrandLogo(scope, variant);
    if (ok) {
      const fresh = await fetchBrand();
      setBrand(fresh.settings as unknown as BrandState);
      setBrandParent(fresh.settings);
    }
  };

  const inputStyle: React.CSSProperties = { width: '100%', border: '1px solid #e4e1da', borderRadius: 10, padding: '11px 14px', fontSize: 14, fontFamily: 'inherit', outline: 'none', background: '#fff', transition: 'border-color .2s' };

  return (
    <div className="max-md:!px-4 max-md:!py-6" style={s('max-width:820px;margin:0 auto;padding:32px 32px 64px')}>
      <div style={s('margin-bottom:24px')}>
        <h1 style={s('margin:0 0 4px;font-size:25px;font-weight:800;letter-spacing:-.5px')}>Brand</h1>
        <div style={s('color:#8c867d;font-size:14px')}>Personalizza loghi, colori e informazioni che appaiono nei tuoi report e contenuti.</div>
      </div>

      {/* ── LOGO SECTION ── */}
      <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:24px 28px;margin-bottom:20px')}>
        <div style={s('font-size:16px;font-weight:800;margin-bottom:4px;letter-spacing:-.2px')}>Loghi</div>
        <div style={s('color:#8c867d;font-size:13px;margin-bottom:18px')}>Carica le versioni del tuo logo per sfondi chiari e scuri.</div>
        <div style={s('display:flex;flex-direction:column;gap:28px')}>
          {LOGO_ROWS.map(row => (
            <div key={row.label}>
              <div style={s('font-size:12px;font-weight:700;color:#b3aca1;text-transform:uppercase;letter-spacing:.04em;margin-bottom:10px')}>{row.label}</div>
              <div className="max-md:!grid-cols-2 max-sm:!grid-cols-1" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
                {row.variants.map(v => {
                  const src = brand.logos[v.key];
                  return (
                    <div key={v.key} style={{ position: 'relative' }}>
                      <Box onClick={() => fileRefs.current[v.key]?.click()} style={{
                        width: '100%', aspectRatio: '2.4', borderRadius: 12,
                        background: v.bg, border: v.bg === '#fff' ? '1.5px solid #ece9e2' : 'none',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
                        overflow: 'hidden', transition: 'box-shadow .2s',
                      }} hover={{ boxShadow: '0 4px 16px rgba(33,31,28,.10)' }}>
                        {src ? (
                          <img 
                            src={src} 
                            alt={v.label} 
                            onLoad={() => setLoadedLogos(p => ({ ...p, [src]: true }))}
                            style={{ 
                              maxWidth: '70%', maxHeight: '70%', objectFit: 'contain',
                              opacity: loadedLogos[src] ? 1 : 0, transition: 'opacity 0.4s ease'
                            }} 
                          />
                        ) : (
                          <Icon name="image-plus" size={20} color={v.bg === '#211f1c' ? 'rgba(255,255,255,.35)' : '#b3aca1'} />
                        )}
                      </Box>
                      {src && (
                        <button onClick={() => removeLogo(v.key)} style={{
                          position: 'absolute', top: 6, right: 6, width: 24, height: 24, borderRadius: '50%',
                          background: 'rgba(33,31,28,.7)', border: 'none', cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}><Icon name="x" size={12} color="#fff" /></button>
                      )}
                      <input ref={el => { fileRefs.current[v.key] = el; }} type="file" accept="image/png,image/jpeg,image/svg+xml,image/webp" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) handleLogoUpload(v.key, f); e.target.value = ''; }} />
                      <div style={s('margin-top:6px;font-size:12px;font-weight:700;color:#57534c')}>{v.label}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
        <div style={{ height: 1, background: '#f4f2ee', margin: '20px 0' }} />
        <div className="max-md:!flex-col max-md:!items-start max-md:!gap-2" style={s('display:flex;align-items:center;gap:12px;justify-content:space-between')}>
          <span style={s('font-size:13px;font-weight:700;color:#57534c')}>Logo da usare nei contenuti</span>
          <select value={brand.logoOrientation} onChange={e => set('logoOrientation', e.target.value as 'vertical' | 'horizontal')} style={{ ...inputStyle, width: 'auto', padding: '8px 12px', cursor: 'pointer' }}>
            <option value="vertical">Solo icona</option>
            <option value="horizontal">Icona + Nome</option>
          </select>
        </div>
      </div>

      {/* ── PRIMARY COLOR ── */}
      <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:24px 28px;margin-bottom:20px')}>
        <div style={s('font-size:16px;font-weight:800;margin-bottom:4px;letter-spacing:-.2px')}>Colore della tua agenzia</div>
        <div style={s('color:#8c867d;font-size:13px;margin-bottom:16px')}>Questo colore viene applicato ai report, ai post e ai video che crei.</div>
        <div style={s('display:flex;align-items:center;gap:14px')}>
          <div style={{ width: 44, height: 44, borderRadius: 10, border: '1px solid #e4e1da', overflow: 'hidden', position: 'relative', cursor: 'pointer', padding: 4, background: '#fff' }}>
            <div style={{ width: '100%', height: '100%', background: brand.primaryColor, borderRadius: 6 }} />
            <input type="color" value={brand.primaryColor} onChange={e => set('primaryColor', e.target.value)} style={{ position: 'absolute', inset: 0, opacity: 0, cursor: 'pointer', width: '100%', height: '100%' }} />
          </div>
          <span style={s('font-size:13px;font-weight:600;color:#57534c')}>Clicca per cambiare colore</span>
        </div>
      </div>

      {/* ── COMPANY INFO ── */}
      <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:24px 28px;margin-bottom:20px')}>
        <div style={s('font-size:16px;font-weight:800;margin-bottom:4px;letter-spacing:-.2px')}>Informazioni agenzia</div>
        <div style={s('color:#8c867d;font-size:13px;margin-bottom:18px')}>Queste informazioni appaiono nei report e nei post che crei.</div>
        <div style={s('display:flex;flex-direction:column;gap:16px')}>
          <div>
            <label style={s('display:block;font-size:13px;font-weight:700;color:#57534c;margin-bottom:6px')}>Nome agenzia</label>
            <input value={brand.companyName} onChange={e => set('companyName', e.target.value)} maxLength={50} placeholder="La Tua Agenzia" style={inputStyle} />
          </div>
          <div>
            <label style={s('display:block;font-size:13px;font-weight:700;color:#57534c;margin-bottom:6px')}>Sito web <span style={s('color:#b3aca1;font-weight:500')}>(opzionale)</span></label>
            <input value={brand.companyWebsite} onChange={e => set('companyWebsite', e.target.value)} placeholder="https://www.tuaagenzia.it" type="url" style={inputStyle} />
          </div>
          <div>
            <label style={s('display:block;font-size:13px;font-weight:700;color:#57534c;margin-bottom:6px')}>Email contatto <span style={s('color:#b3aca1;font-weight:500')}>(opzionale)</span></label>
            <input value={brand.companyEmail} onChange={e => set('companyEmail', e.target.value)} placeholder="info@tuaagenzia.it" type="email" style={inputStyle} />
          </div>
        </div>
      </div>

      {/* ── REPORT FINAL PAGE ── nascosta (report non attivo) ──
      <div style={s('background:#fff;border:1px solid #f0ede7;border-radius:14px;padding:24px 28px;margin-bottom:20px')}>
        <div style={s('font-size:16px;font-weight:800;margin-bottom:4px;letter-spacing:-.2px')}>Pagina finale del report</div>
        <div style={s('color:#8c867d;font-size:13px;margin-bottom:18px')}>Personalizza il messaggio che i tuoi clienti vedono alla fine del report.</div>
        <div style={s('display:flex;flex-direction:column;gap:16px')}>
          <div>
            <label style={s('display:block;font-size:13px;font-weight:700;color:#57534c;margin-bottom:6px')}>Titolo finale</label>
            <input value={brand.reportFinalTitle} onChange={e => set('reportFinalTitle', e.target.value)} maxLength={100} placeholder="Grazie per aver scelto la nostra agenzia" style={inputStyle} />
          </div>
          <div>
            <label style={s('display:block;font-size:13px;font-weight:700;color:#57534c;margin-bottom:6px')}>Messaggio finale</label>
            <textarea value={brand.reportFinalDesc} onChange={e => set('reportFinalDesc', e.target.value)} maxLength={500} rows={4} placeholder="Inserisci un messaggio personalizzato per i tuoi clienti..." style={{ ...inputStyle, resize: 'vertical' }} />
          </div>
        </div>
      </div>
      */}

      <div style={s('display:flex;align-items:center;gap:8px;color:#b3aca1;font-size:12.5px;justify-content:flex-end')}>
        <Icon name="check" size={14} color="#b3aca1" />Le modifiche vengono salvate automaticamente
      </div>
    </div>
  );
}

const ROUTE_TITLES: Record<string, string> = {
  progetti: 'Progetti', progetto: 'Dettaglio immobile', staging: 'Homestaging AI', video: 'Video AI', montaggio: 'Montaggio',
  studio: 'Post Social', calendario: 'Calendario', media: 'Galleria', team: 'Team',
  brand: 'Brand', social: 'Account social', account: 'Piano', home: 'Home', impostazioni: 'Impostazioni', assistenza: 'Assistenza'
};

// Helper for dynamic project cover gradients when no image is provided
const getCoverStyle = (p: Project | null | undefined): React.CSSProperties => {
  if (!p) return { background: '#f3f1ec' };
  if (p.cover) return { background: `url("${p.cover}") center/cover`, backgroundColor: '#f3f1ec' };
  const hash = p.id.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
  const hue = hash % 360;
  return { background: `linear-gradient(135deg, hsl(${hue}, 80%, 65%), hsl(${(hue + 40) % 360}, 80%, 55%))` };
};

export default function DashboardApp({ userData }: { userData: UserData | null }) {
  const [route, setRoute] = useState('home');
  const [collapsed, setCollapsed] = useState(false);
  const [projOpen, setProjOpen] = useState(false);
  const [projQuery, setProjQuery] = useState('');
  const [activeProject, setActiveProject] = useState(() =>
    typeof window !== 'undefined' ? localStorage.getItem('gnm_active_project') ?? 'p1' : 'p1'
  );
  const credits = userData?.credits ?? 0;
  const [newProjOpen, setNewProjOpen] = useState(false);
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
        if (Date.now() - (job.createdAt || 0) > 1_800_000) {
          setVideoJobs(patchVideoJob(job.id, { stage: 'failed', error: 'Render interrotto (timeout)' }));
          continue;
        }
        const renderId = (job.ctx as { renderId?: string } | undefined)?.renderId;
        // Job temporaneo (pre-render, ctx vuoto): non si polla, avanza piano.
        if (!renderId) {
          setVideoJobs(patchVideoJob(job.id, { progress: Math.min(0.2, (job.progress || 0) + 0.02) }));
          continue;
        }
        try {
          const p = await pollRenderProgress(job.ctx);
          if (cancelled) return;
          if (p?.done && p.outputUrl) {
            setVideoJobs(patchVideoJob(job.id, { stage: 'done', progress: 1, outputUrl: p.outputUrl }));
          } else if (p?.error || (p?.done && (p as unknown as { fatalErrorEncountered?: string }).fatalErrorEncountered)) {
            setVideoJobs(patchVideoJob(job.id, { stage: 'failed', error: p.error || (p as unknown as { fatalErrorEncountered?: string }).fatalErrorEncountered }));
          } else {
            // Usa il progress reale dall'edge (Veo/Lambda); fallback a +0.04.
            const real = typeof (p as unknown as { overallProgress?: number }).overallProgress === 'number' ? (p as unknown as { overallProgress: number }).overallProgress : 0;
            setVideoJobs(patchVideoJob(job.id, { progress: Math.min(0.96, Math.max(job.progress || 0, real, (job.progress || 0) + 0.04)) }));
          }
        } catch { /* transiente, riprova al prossimo tick */ }
      }
      if (!cancelled) await syncServerVideoJobs();
    }, 20000);
    return () => { cancelled = true; clearInterval(timer); };
  }, [videoJobs, syncServerVideoJobs]);

  // Tutorial iniziale: appare UNA SOLA VOLTA (flag persistente). Ri-attivabile
  // da menu Profilo > Tutorial / cmdk. Init false per evitare mismatch SSR; un
  // effetto lo apre al primo accesso se non ancora visto.
  const [welcomeOpen, setWelcomeOpen] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && !localStorage.getItem('gnm_tutorial_seen')) setWelcomeOpen(true);
  }, []);
  const markTutorialSeen = useCallback(() => {
    try { localStorage.setItem('gnm_tutorial_seen', '1'); } catch { /* quota */ }
  }, []);
  const closeWelcome = useCallback(() => { setWelcomeOpen(false); markTutorialSeen(); }, [markTutorialSeen]);
  const [tourStep, setTourStep] = useState<number | null>(null);
  const [tourRect, setTourRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null);
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
  const brand = brandData?.settings ?? DEFAULT_BRAND_SETTINGS;
  const brandRole = brandData?.role ?? null;
  
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

  const toast = useCallback((msg: string, icon = 'check') => {
    const id = Date.now() + Math.random();
    setToasts((t) => {
      const next = [...t, { id, msg, icon }];
      return next.slice(-2);
    });
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }, []);

  const contentRef = React.useRef<HTMLDivElement>(null);
  const [routeKey, setRouteKey] = useState(0);
  const go = useCallback((r: string) => { setRoute(r); setRouteKey(k => k + 1); setProjOpen(false); setTrayOpen(false); setProfileOpen(false); contentRef.current?.scrollTo(0, 0); }, []);
  const closeMenus = useCallback(() => { setProjOpen(false); setTrayOpen(false); setProfileOpen(false); setNotifOpen(false); }, []);

  // ⌘K
  useEffect(() => {
    const kd = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) { e.preventDefault(); setCmdkOpen(true); setCmdQuery(''); }
      if (e.key === 'Escape') { setCmdkOpen(false); setTourStep(null); setProjOpen(false); setTrayOpen(false); setProfileOpen(false); }
    };
    window.addEventListener('keydown', kd);
    return () => window.removeEventListener('keydown', kd);
  }, []);

  // Tour measuring
  const tourMeasure = useCallback((i: number) => {
    // Trova il primo step renderizzato da i in poi (salta quelli non presenti),
    // così non resta mai bloccato invisibile.
    let idx = i;
    while (idx < TOUR_DEFS.length) {
      const sel = TOUR_DEFS[idx].sel;
      if (sel === '@center') { setTourStep(idx); setTourRect(null); return; } // step centrato (no ancora)
      const el = document.querySelector(sel);
      if (el) { const r = el.getBoundingClientRect(); setTourStep(idx); setTourRect({ x: r.x, y: r.y, w: r.width, h: r.height }); return; }
      idx++;
    }
    setTourStep(null); setTourRect(null); // nessuno trovato → chiudi
  }, []);
  const tourGo = useCallback((n: number) => {
    if (n >= TOUR_DEFS.length || n < 0) { setTourStep(null); return; }
    setTourStep(n);
    setTimeout(() => tourMeasure(n), 60);
  }, [tourMeasure]);
  const startTour = useCallback(() => {
    setWelcomeOpen(false); markTutorialSeen(); setCollapsed(false); setTourStep(0); setTourRect(null);
    setTimeout(() => tourMeasure(0), 350);
  }, [tourMeasure, markTutorialSeen]);

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
    ['Tutorial', 'play-circle', 'Guida', () => { setCmdkOpen(false); setWelcomeOpen(true); }],
  ];
  const cmdResults: { label: string; sub: string; icon: string; go: () => void }[] = [];
  cmdTools.filter((t) => !cmdq || t[0].toLowerCase().includes(cmdq)).forEach((t) => cmdResults.push({ label: t[0], sub: 'Strumento', icon: t[2], go: () => { setCmdkOpen(false); go(t[1]); } }));
  cmdActions.filter((a) => !cmdq || a[0].toLowerCase().includes(cmdq)).forEach((a) => cmdResults.push({ label: a[0], sub: a[2], icon: a[1], go: a[3] }));
  // Progetti: solo se cercati (niente lista di default).
  if (cmdq) projects.filter((p) => (p.nome + ' ' + p.addr).toLowerCase().includes(cmdq)).forEach((p) => cmdResults.push({ label: p.nome, sub: p.addr, icon: 'building-2', go: () => { setCmdkOpen(false); setActiveProject(p.id); go('home'); } }));

  const onRight = tourRect && tourRect.x > (typeof window !== 'undefined' ? window.innerWidth - 420 : 9999);
  const tipL = tourRect ? (onRight ? Math.max(16, tourRect.x + tourRect.w - 320) : tourRect.x + tourRect.w + 20) : 0;
  const tipT = tourRect ? (onRight ? tourRect.y + tourRect.h + 16 : Math.max(16, tourRect.y - 12)) : 0;
  const tdef = tourStep !== null ? TOUR_DEFS[tourStep] : TOUR_DEFS[0];

  return (
    <div style={{ fontFamily: 'inherit', color: '#211f1c', height: '100vh', overflow: 'hidden', background: '#faf9f7', fontSize: 14, lineHeight: 1.45 }}>

      {/* WELCOME MODAL */}
      {welcomeOpen && (
        <div style={s('position:fixed;inset:0;background:rgba(24,21,17,.6);backdrop-filter:blur(4px);z-index:95;display:flex;align-items:center;justify-content:center;padding:24px')}>
          <div style={{ background: 'linear-gradient(160deg, #eef4fe 0%, #f6f4f0 100%)', borderRadius: 24, boxShadow: '0 32px 80px rgba(0,0,0,.15), 0 2px 16px rgba(0,0,0,.05)', width: '100%', maxWidth: 440, overflow: 'hidden', position: 'relative', padding: '44px 40px 32px', textAlign: 'center' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <div style={{ width: 68, height: 68, background: '#fff', borderRadius: 20, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 22px', boxShadow: '0 8px 24px rgba(33,31,28,.1)' }}>
              <img src="/dashboard/logo-icon.svg" alt="GetNearMe" style={{ width: 40, height: 40 }} />
            </div>
            <h2 style={s('margin:0 0 10px;font-size:27px;font-weight:800;letter-spacing:-.6px;color:#1a1a1a')}>Benvenuto su GetNearMe</h2>
            <p style={s('margin:0 auto 28px;max-width:370px;color:#57534c;font-size:15px;line-height:1.5')}>Dai una marcia in più ai tuoi annunci: foto, video e post curati, pronti in pochi minuti. Ti facciamo vedere come.</p>
            <Box as="button" onClick={startTour} style={s('width:100%;border:none;background:#3B83F6;color:#fff;font-size:15px;font-weight:700;padding:14px 28px;border-radius:12px;cursor:pointer;display:flex;align-items:center;justify-content:center;gap:8px;min-height:48px;transition:all .2s')} hover={s('background:#2b6fe0;transform:translateY(-1px);box-shadow:0 8px 24px rgba(59,131,246,.28)')}>
              Fai un giro veloce (1 min) <Icon name="arrow-right" size={16} color="#fff" />
            </Box>
            <Box as="button" onClick={() => { closeWelcome(); toast('Puoi rifare il tour dal menu Profilo > Tutorial'); }} style={s('display:block;margin:16px auto 0;text-align:center;width:fit-content;border:none;background:transparent;color:#8c867d;font-size:14px;font-weight:600;padding:8px 12px;border-radius:8px;cursor:pointer;transition:color .2s')} hover={{ color: '#57534c' }}>
              Salta e inizia subito
            </Box>
          </div>
        </div>
      )}

      {/* TOUR COACHMARK */}
      {tourStep !== null && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 101, pointerEvents: 'none' }}>
          <div style={{ 
            position: 'absolute', 
            transition: 'all .5s cubic-bezier(0.16, 1, 0.3, 1)', 
            pointerEvents: 'none',
            ...(tdef.sel === '@center' || !tourRect
              ? { left: '50%', top: '50%', width: 0, height: 0, borderRadius: '50%', boxShadow: '0 0 0 9999px rgba(24,21,17,.55)' }
              : { 
                  left: tourRect.x - (tdef.sel === '[data-tour="new-project"]' ? 0 : 6), 
                  top: tourRect.y - (tdef.sel === '[data-tour="new-project"]' ? 0 : 6), 
                  width: tourRect.w + (tdef.sel === '[data-tour="new-project"]' ? 0 : 12), 
                  height: tourRect.h + (tdef.sel === '[data-tour="new-project"]' ? 0 : 12), 
                  borderRadius: tdef.sel === '[data-tour="new-project"]' ? 10 : 14, 
                  boxShadow: '0 0 0 9999px rgba(24,21,17,.55)' 
                })
          }} />

          {/* Il catcher a tutto schermo (usato per lo step @center) */}
          {(!tourRect || tdef.sel === '@center') && (
            <div style={{ position: 'absolute', inset: 0, pointerEvents: 'auto' }} onClick={() => setTourStep(null)} />
          )}

          {/* I 4 muri invisibili per gli step con tourRect, lasciano un buco fisico per far passare click/hover */}
          {tourRect && tdef.sel !== '@center' && (
            (() => {
              const pad = tdef.sel === '[data-tour="new-project"]' ? 0 : 6;
              return (
                <>
                  <div onClick={() => setTourStep(null)} style={{ position: 'absolute', top: 0, left: 0, right: 0, height: Math.max(0, tourRect.y - pad), pointerEvents: 'auto' }} />
                  <div onClick={() => setTourStep(null)} style={{ position: 'absolute', top: tourRect.y + tourRect.h + pad, left: 0, right: 0, bottom: 0, pointerEvents: 'auto' }} />
                  <div onClick={() => setTourStep(null)} style={{ position: 'absolute', top: Math.max(0, tourRect.y - pad), left: 0, width: Math.max(0, tourRect.x - pad), height: tourRect.h + pad*2, pointerEvents: 'auto' }} />
                  <div onClick={() => setTourStep(null)} style={{ position: 'absolute', top: Math.max(0, tourRect.y - pad), left: tourRect.x + tourRect.w + pad, right: 0, height: tourRect.h + pad*2, pointerEvents: 'auto' }} />
                </>
              );
            })()
          )}
          {tdef.sel !== '[data-tour="new-project"]' && (tdef.sel === '@center' || tourRect) && (
            <div key={tourStep} style={tdef.sel === '@center'
              ? { position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%,-50%)', width: 360, maxWidth: 'calc(100vw - 32px)', background: '#fff', borderRadius: 16, boxShadow: '0 24px 64px rgba(20,18,15,.32)', padding: '22px 24px', animation: 'tour-fade-in .5s cubic-bezier(0.16, 1, 0.3, 1) forwards', pointerEvents: 'auto' }
              : { position: 'absolute', left: tipL, top: tipT, width: 300, background: '#fff', borderRadius: 12, boxShadow: '0 16px 48px rgba(20,18,15,.3)', padding: '18px 20px 20px', animation: 'tour-fade-tip .4s cubic-bezier(0.16, 1, 0.3, 1) forwards', pointerEvents: 'auto' }}>
              <TourAnim kind={tdef.anim} />
              {tdef.sel !== '@center' && (
                <div style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:6px')}>
                  <span style={s('font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#1d5fd0')}>{(tourStep + 1) + ' di ' + (TOUR_DEFS.length - 2)}</span>
                  <span onClick={() => setTourStep(null)} style={s('font-size:12px;font-weight:600;color:#b3aca1;cursor:pointer;padding:4px')}>Salta il tour</span>
                </div>
              )}
              {tdef.sel === '@center' && (
                <div style={s('font-size:32px;text-align:center;margin-bottom:16px')}>🎉</div>
              )}
              <div style={s(`font-size:16px;font-weight:800;letter-spacing:-.2px;margin-bottom:4px;${tdef.sel === '@center' ? 'text-align:center;' : ''}`)}>{tdef.title}</div>
              <div style={s(`font-size:13px;color:#57534c;line-height:1.5;margin-bottom:24px;${tdef.sel === '@center' ? 'text-align:center;' : ''}`)}>{tdef.text}</div>
              <div style={s('display:flex;align-items:center;justify-content:space-between')}>
                {tourStep > 0 && tdef.sel !== '@center' && <Box as="button" onClick={() => tourGo(tourStep - 1)} style={s('border:1px solid #e4e1da;background:#fff;font-size:12.5px;font-weight:700;padding:9px 16px;border-radius:8px;cursor:pointer;min-height:38px')} hover={s('background:#f6f4f0')}>Indietro</Box>}
                {tdef.sel !== '@center'
                  ? <Box as="button" onClick={() => tourGo(tourStep + 1)} style={s('border:none;background:#3B83F6;color:#fff;font-size:12.5px;font-weight:700;padding:9px 18px;border-radius:8px;cursor:pointer;margin-left:auto;min-height:38px')} hover={s('background:#2b6fe0')}>Avanti</Box>
                  : <Box as="button" onClick={() => { setProjOpen(true); tourGo(tourStep + 1); }} style={s('border:none;background:#3B83F6;color:#fff;font-size:13.5px;font-weight:700;padding:12px 18px;border-radius:8px;cursor:pointer;width:100%;text-align:center;display:flex;align-items:center;justify-content:center;min-height:44px')} hover={s('background:#2b6fe0;transform:translateY(-1px);box-shadow:0 8px 20px rgba(59,131,246,.25)')}>Aggiungi immobile</Box>}
              </div>
            </div>
          )}
        </div>
      )}

      {/* APP SHELL */}
      <div data-app-shell style={{ display: 'flex', height: '100%', ['--gnm-content-left' as string]: collapsed ? '64px' : '252px' } as React.CSSProperties}>
        {/* SIDEBAR */}
        <div className={`max-md:!fixed max-md:!inset-y-0 max-md:!left-0 max-md:!z-[100] max-md:!w-64 max-md:!shadow-2xl ${mobileMenuOpen ? 'max-md:!flex' : 'max-md:!hidden'}`} style={{ width: collapsed ? 64 : 252, flex: 'none', background: '#fff', borderRight: '1px solid #f0ede7', display: 'flex', flexDirection: 'column', transition: 'width .25s ease', overflow: 'hidden' }}>
          <div style={s('height:64px;flex:none;display:flex;align-items:center;padding:0 20px;overflow:hidden;justify-content:space-between')}>
            <div style={{ width: collapsed ? 27 : 130, overflow: 'hidden', flex: 'none' }}><img src="/dashboard/logo.svg" alt="GetNearMe" style={{ height: 24, maxWidth: 'none' }} /></div>
            {mobileMenuOpen && (
              <Box as="button" onClick={() => setMobileMenuOpen(false)} className="md:!hidden" style={s('border:none;background:transparent;width:32px;height:32px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center')} hover={s('background:#f1efe9')}><Icon name="x" size={18} /></Box>
            )}
          </div>
          <div style={s('flex:1;overflow-y:auto;overflow-x:hidden;padding:6px 0 16px')}>
            {NAV_SECTIONS.map((sec, si) => (
              <div key={si} style={{ marginBottom: 4 }}>
                {sec.label && !collapsed && <div style={s('font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:#b3aca1;padding:14px 22px 6px;white-space:nowrap')}>{sec.label}</div>}
                {sec.items.map((it) => {
                  const a = route === it.route || (it.route === 'progetti' && route === 'progetto');
                  return (
                    <Box key={it.route} onClick={() => { go(it.route); setMobileMenuOpen(false); }} title={it.label} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 12px', margin: '1px 10px', borderRadius: 12, cursor: 'pointer', background: a ? '#f1efe9' : 'transparent', color: a ? '#211f1c' : '#57534c', fontWeight: a ? 700 : 500, fontSize: 14, whiteSpace: 'nowrap', minHeight: 38 }} hover={{ background: '#f6f4f0' }}>
                      <Icon name={it.icon} size={18} color={a ? '#211f1c' : '#57534c'} />
                      {!collapsed && <span>{it.label}</span>}
                    </Box>
                  );
                })}
              </div>
            ))}
          </div>
          <div 
            ref={profileRef} 
            onMouseEnter={() => setProfileOpen(true)}
            onMouseLeave={() => setProfileOpen(false)}
            style={{ flex: 'none', borderTop: '1px solid #f0ede7', padding: collapsed ? '12px 6px' : '12px 10px' }}
          >
            <Box onClick={(e) => { e.stopPropagation(); setProfileOpen(o => !o); setProjOpen(false); setTrayOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: collapsed ? '0' : '10px 12px', borderRadius: collapsed ? '50%' : 12, cursor: 'pointer', justifyContent: collapsed ? 'center' : 'flex-start', width: collapsed ? 42 : 'auto', height: collapsed ? 42 : 'auto', margin: collapsed ? '0 auto' : 0 }} hover={{ background: '#f1efe9' }}>
              <div style={s('width:34px;height:34px;border-radius:50%;background:#211f1c;color:#fff;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:700;flex:none')}>{(userData?.email ?? 'U')[0].toUpperCase()}</div>
              {!collapsed && <div style={{ minWidth: 0, flex: 1 }}><div style={s('font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{userData?.email?.split('@')[0] ?? 'Utente'}</div><div style={s('font-size:11px;color:#8c867d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{userData?.email ?? ''}</div></div>}
              {!collapsed && <Icon name="chevron-up" size={14} color="#8c867d" style={{ transition: 'transform .2s', transform: profileOpen ? 'none' : 'rotate(180deg)' }} />}
            </Box>
            {profileOpen && (() => {
              const rect = profileRef.current?.getBoundingClientRect();
              const left = rect ? rect.left + 10 : 10;
              const w = rect ? rect.width - 20 : 220;
              const bottom = rect ? window.innerHeight - rect.top - 12 : 80;
              return (
                <div style={{ position: 'fixed', bottom, left, width: w, zIndex: 9999, paddingBottom: 16 }}>
                  <div style={{ background: '#fff', borderRadius: 12, boxShadow: '0 16px 48px rgba(33,31,28,.16)', border: '1px solid #f0ede7', overflow: 'hidden' }}>
                    <div style={s('padding:4px')}>
                      {[
                        { icon: 'play-circle', label: 'Tutorial', action: () => { setProfileOpen(false); setWelcomeOpen(true); } },
                        { icon: 'message-square', label: 'Suggerimenti', action: () => { setProfileOpen(false); go('assistenza?type=feature'); } },
                        { icon: 'settings', label: 'Impostazioni', action: () => { setProfileOpen(false); go('impostazioni'); } },
                        { icon: 'life-buoy', label: 'Assistenza', action: () => { setProfileOpen(false); go('assistenza'); } },
                      ].map(item => (
                        <Box key={item.label} onClick={item.action} style={s('display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600')} hover={s('background:#f6f4f0')}>
                          <Icon name={item.icon} size={16} color="#57534c" />{item.label}
                        </Box>
                      ))}
                    </div>
                    <div style={s('border-top:1px solid #f0ede7;padding:4px')}>
                      <Box onClick={() => { setProfileOpen(false); window.location.href = '/api/auth/logout'; }} style={s('display:flex;align-items:center;gap:10px;padding:10px 12px;border-radius:10px;cursor:pointer;font-size:13px;font-weight:600;color:#dc2626')} hover={s('background:#fef2f2')}>
                        <Icon name="log-out" size={16} color="#dc2626" />Esci
                      </Box>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>

        {/* MOBILE MENU BACKDROP */}
        {mobileMenuOpen && (
          <div className="md:hidden" onClick={() => setMobileMenuOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 99 }} />
        )}

        {/* MAIN */}
        <div className="max-md:!w-full" style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          {/* HEADER */}
          <div className="max-md:!px-3 max-md:!gap-2" style={{ height: 64, flex: 'none', background: '#fff', borderBottom: '1px solid #f0ede7', display: 'flex', alignItems: 'center', gap: 14, padding: '0 20px', position: 'relative', zIndex: 30 }}>
            {/* Hamburger (Mobile) */}
            <Box as="button" onClick={() => setMobileMenuOpen(true)} className="md:!hidden" title="Apri menu" aria-label="Apri menu" style={s('border:none;background:transparent;width:38px;height:38px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:none')} hover={s('background:#f1efe9')}><Icon name="menu" size={20} /></Box>
            
            {/* Collapse (Desktop) */}
            <Box as="button" onClick={() => setCollapsed((c) => !c)} className="max-md:!hidden" title="Comprimi menu" aria-label="Comprimi menu" style={s('border:none;background:transparent;width:38px;height:38px;border-radius:8px;cursor:pointer;display:flex;align-items:center;justify-content:center')} hover={s('background:#f1efe9')}><Icon name="panel-left" size={18} /></Box>

            {/* project switcher */}
            <div style={{ position: 'relative' }}>
              <Box onClick={(e) => { e.stopPropagation(); setProjOpen((o) => !o); setTrayOpen(false); }} style={s('display:flex;align-items:center;gap:10px;padding:7px 14px 7px 8px;border:1px solid #e9e6df;border-radius:8px;cursor:pointer;background:#fff;min-height:38px;min-width:240px;justify-content:space-between')} hover={s('border-color:#d8d4cb;box-shadow:0 2px 8px rgba(33,31,28,.06)')}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0, flex: 1 }}>
                  {loadingProjects ? (
                    <div className="max-md:!hidden" style={{ minWidth: 0, flex: 1 }}><div style={s('font-size:13px;font-weight:700;color:#8c867d')}>Caricamento...</div></div>
                  ) : active ? (
                    <>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', ...getCoverStyle(active), flex: 'none' }} />
                      <div className="max-md:!hidden" style={{ minWidth: 0, flex: 1 }}><div style={s('font-size:11px;color:#8c867d;line-height:1.2')}>Progetto attivo</div><div style={s('font-size:13px;font-weight:700;white-space:nowrap;line-height:1.2;overflow:hidden;text-overflow:ellipsis')}>{active.nome}</div></div>
                    </>
                  ) : (
                    <>
                      <div style={{ width: 30, height: 30, borderRadius: '50%', backgroundColor: '#f3f1ec', flex: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Icon name="plus" size={14} color="#8c867d" /></div>
                      <div className="max-md:!hidden" style={{ minWidth: 0, flex: 1 }}><div style={s('font-size:13px;font-weight:700;white-space:nowrap;line-height:1.2')}>Crea il tuo primo immobile</div></div>
                    </>
                  )}
                </div>
                <Icon name="chevron-down" size={14} color="#8c867d" style={{ flex: 'none' }} />
              </Box>
              {projOpen && (
                <div className="max-md:!fixed max-md:!top-16 max-md:!left-2 max-md:!right-2 max-md:!w-auto" style={s('position:absolute;top:52px;left:0;width:100%;background:#fff;border-radius:12px;box-shadow:0 16px 48px rgba(33,31,28,.16);border:1px solid #f0ede7;overflow:hidden;z-index:99')}>
                  <div style={s('padding:12px 12px 8px')}><div style={s('display:flex;align-items:center;gap:8px;background:#faf9f7;border:1px solid #ece9e2;border-radius:10px;padding:8px 12px')}><Icon name="search" size={15} color="#8c867d" /><input value={projQuery} onChange={(e) => setProjQuery(e.target.value)} placeholder="Cerca immobile…" style={s('border:none;background:transparent;outline:none;font-size:13px;width:100%')} /></div></div>
                  <div style={s('max-height:260px;overflow:auto;padding:0 6px')}>
                    {projList.map((p) => (
                      <Box key={p.id} onClick={() => { setActiveProject(p.id); setProjOpen(false); }} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 10px', borderRadius: 12, cursor: 'pointer', background: p.id === activeProject ? '#f6faff' : 'transparent' }} hover={{ background: '#f6f4f0' }}>
                        <div style={{ width: 34, height: 34, borderRadius: 10, ...getCoverStyle(p), flex: 'none' }} />
                        <div style={{ minWidth: 0, flex: 1 }}><div style={s('font-size:13px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{p.nome}</div><div style={s('font-size:11px;color:#8c867d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis')}>{p.addr}</div></div>
                        {p.id === activeProject && <Icon name="check" size={14} color="#3B83F6" />}
                      </Box>
                    ))}
                  </div>
                  <div style={{ padding: '12px', borderTop: '1px solid #f0ede7' }}>
                    <Box data-tour="new-project" onClick={() => { setProjOpen(false); setNewProjOpen(true); setTourStep(null); }} style={s(`display:flex;align-items:center;gap:10px;padding:12px 16px;border-radius:10px;cursor:pointer;color:${projList.length === 0 ? '#fff' : '#1d5fd0'};background:${projList.length === 0 ? '#3B83F6' : 'transparent'};font-weight:700;font-size:13px`)} hover={s(`background:${projList.length === 0 ? '#2b6fe0' : '#f6faff'}`)}><Icon name="plus" size={16} color={projList.length === 0 ? '#fff' : '#1d5fd0'} />{projList.length === 0 ? 'Crea il tuo primo immobile' : 'Nuovo immobile'}</Box>
                  </div>
                </div>
              )}
            </div>

            <div style={{ flex: 1 }} />

            <Box as="button" onClick={() => { setCmdkOpen(true); setCmdQuery(''); }} title="Cerca · ⌘K" aria-label="Cerca" className="max-md:!px-3 max-md:!justify-center" style={s('border:1px solid #e9e6df;background:#fff;display:flex;align-items:center;gap:8px;padding:0 16px;height:40px;border-radius:10px;cursor:pointer;color:#8c867d;flex:1;max-width:480px')} hover={s('border-color:#d8d4cb;box-shadow:0 2px 8px rgba(33,31,28,.06)')}>
              <Icon name="search" size={15} color="#b3aca1" />
              <span className="max-md:!hidden" style={s('font-size:13px;font-weight:500;color:#b3aca1;flex:1;text-align:left')}>Cerca strumenti, immobili, media</span>
              <span className="max-md:!hidden" style={s('font-size:10.5px;font-weight:700;background:#f1efe9;color:#8c867d;padding:2px 7px;border-radius:6px')}>⌘K</span>
            </Box>

            {/* jobs tray + notifications */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <div style={{ position: 'relative' }}>
                <Box as="button" onClick={(e) => { e.stopPropagation(); setTrayOpen((o) => !o); setProjOpen(false); setNotifOpen(false); setProfileOpen(false); }} title="Lavori in corso" aria-label="Lavori in corso" style={s('border:none;background:transparent;width:38px;height:38px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative')} hover={s('background:#f1efe9')}>
                  <Icon name="inbox" size={18} />
                  {(batches.filter(b => b.status === 'processing' || b.status === 'pending').length > 0 || videoJobs.some(j => j.stage === 'render' && !j.dismissed)) && (
                    <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#3B83F6', border: '2px solid #fff' }} />
                  )}
                </Box>
                {trayOpen && (
                  <div style={s('position:absolute;top:46px;right:0;width:330px;background:#fff;border-radius:12px;box-shadow:0 16px 48px rgba(33,31,28,.16);border:1px solid #f0ede7;overflow:hidden;z-index:50')}>
                    <div style={s('display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid #f4f2ee')}><span style={s('font-size:13.5px;font-weight:800')}>Lavori in corso</span></div>
                    <div style={{ maxHeight: 320, overflow: 'auto' }}>
                      {(() => {
                        const dismissed = typeof window !== 'undefined' ? JSON.parse(localStorage.getItem('gnm_dismissed_batches') || '[]') : [];
                        const activeBatches = batches.filter(b => (b.status === 'processing' || b.status === 'pending') || ((b.status === 'completed' || b.status === 'partial') && !dismissed.includes(b.id)));
                        const activeVideos = videoJobs.filter(j => !j.dismissed && (j.stage === 'render' || j.stage === 'done' || j.stage === 'failed'));
                        if (activeBatches.length === 0 && activeVideos.length === 0) {
                          return <div style={s('padding:22px 16px;text-align:center;font-size:13px;color:#8c867d')}>Nessun lavoro in corso.<br />Le generazioni girano qui in background, senza bloccarti.</div>;
                        }
                        return (<>{activeBatches.map(b => {
                          const isDone = b.status === 'completed' || b.status === 'partial';
                          const styleObj = STAGING_STYLES.find(s => s.id === b.style);
                          const styleName = styleObj ? styleObj.label : b.style;
                          return (
                            <div key={b.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f4f2ee', display: 'flex', gap: 12, position: 'relative' }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: isDone ? '#e6f4ea' : '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                                {isDone ? <Icon name="check" size={16} color="#1e8e3e" /> : <div style={{ width: 14, height: 14, border: '2px solid #3B83F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, paddingRight: 22 }}>Batch Foto AI {styleName ? `· ${styleName}` : ''}</div>
                                <div style={{ fontSize: 12, color: '#8c867d', marginBottom: 6 }}>
                                  {isDone ? 'Completato' : `In elaborazione (${b.completedItems}/${b.totalItems})`}
                                </div>
                                {isDone && (
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => { dismissBatch(b.id); mutateBatches(); setTrayOpen(false); go('media'); }} style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700, borderRadius: 6, border: '1px solid #e4e1da', background: '#fff', cursor: 'pointer' }}>Vedi in Media</button>
                                  </div>
                                )}
                              </div>
                              {isDone && (
                                <button onClick={(e) => { e.stopPropagation(); dismissBatch(b.id); mutateBatches(); }} title="Rimuovi" style={{ position: 'absolute', top: 10, right: 12, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                  <Icon name="x" size={13} color="#b3aca1" />
                                </button>
                              )}
                            </div>
                          );
                        })}
                        {activeVideos.map(j => {
                          const isDone = j.stage === 'done';
                          const isFailed = j.stage === 'failed';
                          return (
                            <div key={j.id} style={{ padding: '12px 16px', borderBottom: '1px solid #f4f2ee', display: 'flex', gap: 12, position: 'relative' }}>
                              <div style={{ width: 32, height: 32, borderRadius: 8, background: isDone ? '#e6f4ea' : isFailed ? '#fef2f2' : '#eef4fe', display: 'flex', alignItems: 'center', justifyContent: 'center', flex: 'none' }}>
                                {isDone ? <Icon name="check" size={16} color="#1e8e3e" /> : isFailed ? <Icon name="x" size={16} color="#dc2626" /> : <div style={{ width: 14, height: 14, border: '2px solid #3B83F6', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }} />}
                              </div>
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, paddingRight: 22, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{j.template === 'montaggio' ? 'Montaggio' : 'Video AI'} · {j.title}</div>
                                <div style={{ fontSize: 12, color: '#8c867d', marginBottom: 6 }}>
                                  {isDone ? 'Completato' : isFailed ? (j.error || 'Non riuscito') : `In elaborazione (${Math.round(j.progress * 100)}%) · ${videoEta(j.template)}`}
                                </div>
                                {!isDone && !isFailed && (
                                  <div style={{ height: 4, borderRadius: 2, background: '#eef0f3', overflow: 'hidden', marginBottom: 6 }}>
                                    <div style={{ height: '100%', borderRadius: 2, background: '#3B83F6', width: `${Math.round(j.progress * 100)}%`, transition: 'width .4s' }} />
                                  </div>
                                )}
                                {isDone && (
                                  <div style={{ display: 'flex', gap: 8 }}>
                                    <button onClick={() => { setVideoJobs(dismissVideoJob(j.id)); setTrayOpen(false); go('media'); }} style={{ padding: '4px 8px', fontSize: 11, fontWeight: 700, borderRadius: 6, border: '1px solid #e4e1da', background: '#fff', cursor: 'pointer' }}>Vedi in Media</button>
                                  </div>
                                )}
                              </div>
                              <button onClick={(e) => { e.stopPropagation(); setVideoJobs(dismissVideoJob(j.id)); }} title={isDone || isFailed ? 'Rimuovi' : 'Annulla'} style={{ position: 'absolute', top: 10, right: 12, width: 22, height: 22, borderRadius: '50%', border: 'none', background: 'transparent', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <Icon name="x" size={13} color="#b3aca1" />
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
                <Box as="button" onClick={(e) => { e.stopPropagation(); setNotifOpen(o => !o); setProjOpen(false); setTrayOpen(false); setProfileOpen(false); }} title="Notifiche" aria-label="Notifiche" style={s('border:none;background:transparent;width:38px;height:38px;border-radius:50%;cursor:pointer;display:flex;align-items:center;justify-content:center;position:relative')} hover={s('background:#f1efe9')}>
                  <Icon name="bell" size={18} />
                  {notifications.filter(n => !n.is_read).length > 0 && (
                    <div style={{ position: 'absolute', top: 6, right: 6, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', border: '2px solid #fff' }} />
                  )}
                </Box>
                {notifOpen && (
                  <div style={s('position:absolute;top:46px;right:0;width:340px;background:#fff;border-radius:12px;box-shadow:0 16px 48px rgba(33,31,28,.16);border:1px solid #f0ede7;overflow:hidden;z-index:999')}>
                    <div style={s('display:flex;align-items:center;justify-content:space-between;padding:13px 16px;border-bottom:1px solid #f4f2ee')}>
                      <span style={s('font-size:13.5px;font-weight:800')}>Notifiche</span>
                      {notifications.filter(n => !n.is_read).length > 0 && (
                        <button 
                          onClick={async (e) => {
                            e.stopPropagation();
                            const unread = notifications.filter(n => !n.is_read).map(n => n.id);
                            if (!unread.length) return;
                            mutateNotifs(prev => prev?.map(n => ({ ...n, is_read: true })), false);
                            await supabase.from('notifications').update({ is_read: true }).in('id', unread);
                          }}
                          style={{ background: 'transparent', border: 'none', color: '#1d5fd0', fontSize: 12, fontWeight: 600, cursor: 'pointer' }}
                        >Segna tutte come lette</button>
                      )}
                    </div>
                    <div style={{ maxHeight: 380, overflowY: 'auto' }}>
                      {notifications.length === 0 ? (
                        <div style={{ padding: '32px 16px', textAlign: 'center', color: '#8c867d', fontSize: 13.5 }}>Nessuna notifica.</div>
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
                            style={{ padding: '16px', borderBottom: '1px solid #f4f2ee', cursor: 'pointer', background: n.is_read ? '#fff' : '#f0fdf4', display: 'flex', gap: 12 }}
                          >
                            <div style={{ flex: 'none', paddingTop: 2 }}>
                              {n.type === 'info' ? <Icon name="info" size={16} color="#3B83F6" /> : <Icon name="bell" size={16} color="#10b981" />}
                            </div>
                            <div>
                              <div style={{ fontSize: 13, fontWeight: 700, color: '#211f1c', marginBottom: 4 }}>{n.title}</div>
                              <div style={{ fontSize: 13, color: '#57534c', lineHeight: 1.4 }}>{n.body}</div>
                              <div style={{ fontSize: 11, color: '#8c867d', marginTop: 6 }}>
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
                <div className="max-md:!h-auto max-md:!min-h-[220px]" style={{ height: 260, background: '#f4f2ee', position: 'relative' }}>
                  <div className="max-md:!p-6 max-md:!pb-6 max-md:!items-center" style={{ maxWidth: 1160, margin: '0 auto', padding: '0 32px', height: '100%', display: 'flex', alignItems: 'flex-end', paddingBottom: 32 }}>
                    <div className="max-md:!flex-col max-md:!items-center max-md:!mt-12" style={{ display: 'flex', gap: 24, alignItems: 'center', width: '100%' }}>
                      <div style={{ width: 120, height: 120, borderRadius: 20, background: '#e9e6df' }} />
                      <div className="max-md:!items-center" style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12 }}>
                        <div style={{ width: 140, height: 16, background: '#e9e6df', borderRadius: 4 }} />
                        <div style={{ width: 280, height: 38, background: '#e9e6df', borderRadius: 6 }} />
                        <div style={{ width: 200, height: 16, background: '#e9e6df', borderRadius: 4 }} />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="max-md:!p-4" style={{ maxWidth: 1160, margin: '0 auto', padding: '48px 32px 32px' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 24 }}>
                    <div style={{ height: 140, background: '#f4f2ee', borderRadius: 16 }} />
                    <div style={{ height: 140, background: '#f4f2ee', borderRadius: 16 }} />
                    <div style={{ height: 140, background: '#f4f2ee', borderRadius: 16 }} />
                  </div>
                </div>
              </div>
            ) : route === 'home' ? (
              <HomeScreen
                active={active}
                batches={batches}
                videoJobs={videoJobs}
                setNewProjOpen={setNewProjOpen}
                onEditProject={() => setEditProjOpen(true)}
                go={go}
                getCoverStyle={getCoverStyle}
                onProjectUpdate={(upd) => {
                  setProjects(prev => prev.map(p => p.id === active?.id ? { ...p, ...upd } : p));
                  if (active) updateProject(active.id, upd);
                }}
              />
            ) : route === 'studio' ? (
              <PostSocialScreen toast={toast} routeKey={routeKey} brand={brand} project={active} batches={batches} onProjectUpdate={(upd) => setProjects(prev => prev.map(p => p.id === active.id ? { ...p, ...upd } : p))} />
            ) : route === 'staging' ? (
              <FotoAIScreen 
                toast={toast} 
                routeKey={routeKey} 
                project={active} 
                onBatchCreated={() => {
                  fetchUserBatches().then(setBatches);
                }}
                onGoPlan={() => go('account')}
              />
            ) : route === 'media' ? (
              <MediaScreen 
                toast={toast} 
                routeKey={routeKey} 
                project={active} 
                batches={batches} 
                loadingBatches={loadingBatches} 
              />
            ) : route === 'video' ? (
              <VideoAIScreen key="video" toast={toast} routeKey={routeKey} brand={brand} project={active} onVideoJob={registerVideoJob} activeRenders={videoJobs.filter(j => j.stage === 'render' && !j.dismissed).length} />
            ) : route === 'montaggio' ? (
              <VideoAIScreen key="montaggio" toast={toast} routeKey={routeKey} brand={brand} preselect="montaggio" project={active} onVideoJob={registerVideoJob} activeRenders={videoJobs.filter(j => j.stage === 'render' && !j.dismissed).length} />
            ) : route === 'account' ? (
              <AccountScreen credits={credits} toast={toast} go={go} userData={userData} />
            ) : route === 'brand' ? (
              <BrandScreen toast={toast} brand={brand} setBrand={setBrand} brandRole={brandRole} />
            ) : route === 'impostazioni' ? (
              <SettingsScreen toast={toast} />
            ) : route.startsWith('assistenza') ? (
              <AssistenzaScreen toast={toast} email={userData?.email ?? ''} defaultType={route.includes('type=feature') ? 'feature' : 'support'} />
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
              {cmdResults.length === 0 ? <div style={s('padding:28px;text-align:center;color:#8c867d;font-size:13.5px')}>Nessun risultato.</div> : cmdResults.slice(0, 12).map((r, i) => (
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
      <div style={s('position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:999999;display:flex;flex-direction:column;gap:10px;align-items:center')}>
        {toasts.map((t) => (
          <div key={t.id} style={s('display:flex;align-items:center;gap:10px;background:#3B83F6;color:#fff;padding:12px 18px;border-radius:10px;box-shadow:0 12px 32px rgba(59,131,246,.32);font-size:13.5px;font-weight:600;max-width:420px')}>
            <Icon name={t.icon} size={16} color="#fff" />{t.msg}
          </div>
        ))}
      </div>

      {/* NEW PROJECT MODAL */}
      {newProjOpen && (
        <NewProjectModal 
          toast={toast}
          onClose={() => setNewProjOpen(false)}
          onSuccess={(p) => {
            setProjects(prev => [p as unknown as Project, ...prev]);
            setActiveProject(p.id);
            setNewProjOpen(false);
            setRoute('home');
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
          }}
        />
      )}
    </div>
  );
}
