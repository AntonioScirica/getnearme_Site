'use client';

import { useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { sectionOf, type Section } from '@/lib/platformSessions';

// Tempo sulla piattaforma (api/platform/heartbeat -> platform_sessions, visto in /metrics).
// Conta solo con la scheda visibile e un'interazione negli ultimi 2 minuti; ogni 60 s manda i secondi accumulati,
// al cambio sezione e alla chiusura manda l'ultimo pezzo con sendBeacon. Sessione nuova dopo 30 minuti senza battiti.
const URL_ = '/api/platform/heartbeat';
const IDLE = 120_000;
const SEND_EVERY = 60_000;
const TICK = 5_000;
const GAP = 30 * 60_000;
const KEY = 'agenteimmo:sessione';

function sessionId(): string {
  const now = Date.now();
  try {
    const s = JSON.parse(sessionStorage.getItem(KEY) ?? 'null') as { id: string; at: number } | null;
    const id = s && now - s.at < GAP ? s.id : crypto.randomUUID();
    sessionStorage.setItem(KEY, JSON.stringify({ id, at: now }));
    return id;
  } catch { return crypto.randomUUID(); }
}

function device(): string {
  const ua = navigator.userAgent;
  const ipadOs = /Macintosh/.test(ua) && navigator.maxTouchPoints > 1;
  const kind = /iPad|Tablet/.test(ua) || ipadOs || (/Android/.test(ua) && !/Mobile/.test(ua)) ? 'tablet' : /Mobi|iPhone|Android/.test(ua) ? 'telefono' : 'computer';
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /SamsungBrowser/.test(ua) ? 'Samsung' : /CriOS|Chrome\//.test(ua) ? 'Chrome'
    : /FxiOS|Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'altro';
  const os = /iPhone|iPad/.test(ua) || ipadOs ? 'iOS' : /Android/.test(ua) ? 'Android' : /Mac OS X/.test(ua) ? 'Mac' : /Windows/.test(ua) ? 'Windows' : /Linux/.test(ua) ? 'Linux' : '';
  return [kind, `${browser}${os ? ` ${os}` : ''}`].join(' · ');
}

export function useHeartbeat() {
  const st = useRef({ section: 'home' as Section, pending: 0, lastTick: 0, lastInput: 0, lastSend: 0, token: '' });

  useEffect(() => {
    if (window.top !== window.self) return; // anteprime del sito in un iframe: le conta la pagina che le contiene
    const s = st.current;
    s.section = sectionOf(window.location.hash.slice(1) || '/');
    s.lastTick = s.lastInput = s.lastSend = Date.now();
    const dev = device();
    supabase.auth.getSession().then(({ data }) => { s.token = data.session?.access_token ?? ''; });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => { s.token = session?.access_token ?? ''; });

    // secondi attivi dall'ultimo conteggio (al massimo un giro, se il timer e' stato fermato dal browser)
    const count = () => {
      const now = Date.now();
      if (document.visibilityState === 'visible' && now - s.lastInput < IDLE) s.pending += Math.min(now - s.lastTick, 2 * TICK) / 1000;
      s.lastTick = now;
    };
    const send = (beacon: boolean) => {
      const seconds = Math.round(s.pending);
      if (seconds < 1 || !s.token) return;
      s.pending = 0;
      s.lastSend = Date.now();
      const body = { sid: sessionId(), section: s.section, seconds, device: dev };
      if (beacon && navigator.sendBeacon?.(URL_, new Blob([JSON.stringify({ ...body, token: s.token })], { type: 'application/json' }))) return;
      fetch(URL_, { method: 'POST', keepalive: true, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${s.token}` }, body: JSON.stringify(body) }).catch(() => {});
    };
    const input = () => { s.lastInput = Date.now(); };
    const tick = setInterval(() => { count(); if (Date.now() - s.lastSend >= SEND_EVERY) send(false); }, TICK);
    const vis = () => {
      if (document.visibilityState === 'hidden') { count(); send(true); }
      else { s.lastTick = Date.now(); s.lastInput = Date.now(); }
    };
    const hide = () => { count(); send(true); };
    const opts = { passive: true, capture: true } as const;
    const evs = ['pointerdown', 'pointermove', 'keydown', 'touchstart', 'wheel', 'scroll'] as const;
    for (const e of evs) window.addEventListener(e, input, opts);
    document.addEventListener('visibilitychange', vis);
    window.addEventListener('pagehide', hide);
    // cambio sezione: si chiude il pezzo della sezione vecchia
    const change = () => {
      const next = sectionOf(window.location.hash.slice(1) || '/');
      if (next === s.section) return;
      count(); send(true);
      s.section = next;
    };
    window.addEventListener('hashchange', change);
    return () => {
      clearInterval(tick);
      sub.subscription.unsubscribe();
      for (const e of evs) window.removeEventListener(e, input, opts);
      document.removeEventListener('visibilitychange', vis);
      window.removeEventListener('pagehide', hide);
      window.removeEventListener('hashchange', change);
    };
  }, []);
}
