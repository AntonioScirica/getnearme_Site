'use client';

import { useEffect, useState } from 'react';
import { authFetch } from './api';

export type Views = { d30: number; total: number };

// Visite alle schede sul sito (api/platform/views): per gli immobili dati, null finche' non arrivano.
export function useViews(ids: string[]): Record<string, Views> | null {
  const [views, setViews] = useState<Record<string, Views> | null>(null);
  const key = [...ids].sort().join(',');
  useEffect(() => {
    if (!key) return;
    let on = true;
    authFetch(`/api/platform/views?ids=${key}`).then(r => (r.ok ? r.json() : { views: {} }))
      .then((d: { views?: Record<string, Views> }) => { if (on) setViews(d.views ?? {}); }).catch(() => {});
    return () => { on = false; };
  }, [key]);
  return views;
}
