'use client';

import { useEffect } from 'react';

// Conta la visita alla scheda dell'immobile: una volta al giorno per browser e immobile (/api/site/view).
// Sta solo nelle pagine pubbliche del sito (scheda ed embed), mai nell'anteprima della piattaforma.
export default function ViewBeacon({ slug, id }: { slug: string; id: string }) {
  useEffect(() => {
    const key = `agenteimmo:view:${id}`, today = new Date().toISOString().slice(0, 10);
    try { if (localStorage.getItem(key) === today) return; localStorage.setItem(key, today); } catch { /* niente storage: si conta lo stesso */ }
    void fetch('/api/site/view', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, id }), keepalive: true }).catch(() => {});
  }, [slug, id]);
  return null;
}
