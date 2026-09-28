'use client';

import { useEffect } from 'react';

// Guardia unica su tutti i campi di testo (input, textarea, testi modificabili) di landing, piattaforma e siti:
// se c'e' una parolaccia o una bestemmia (qualsiasi lingua, vedi lib/profanity) il campo diventa rosso, sotto
// compare l'avviso e invio / salvataggio vicini si bloccano. Le API che salvano rifanno lo stesso controllo.
// Il filtro (lista di 28 lingue) si carica solo al primo tasto premuto.
const SKIP = new Set(['password', 'file', 'hidden', 'number', 'range', 'color', 'date', 'checkbox', 'radio', 'email']);
type Field = HTMLInputElement | HTMLTextAreaElement | HTMLElement;
const fieldOf = (t: EventTarget | null): Field | null => {
  if (!(t instanceof HTMLElement)) return null;
  if (t instanceof HTMLInputElement) return SKIP.has(t.type) ? null : t;
  if (t instanceof HTMLTextAreaElement) return t;
  const ce = t.closest<HTMLElement>('[contenteditable=""], [contenteditable="true"]');
  return ce;
};
const textOf = (f: Field) => ('value' in f ? (f as HTMLInputElement).value : f.innerText) ?? '';
const flagged = () => [...document.querySelectorAll<HTMLElement>('[data-profanity]')];

// un'azione e' "vicina" al campo se stanno nello stesso modulo o nello stesso blocco, non solo nella stessa pagina
// (cosi' menu, Salta e navigazione restano liberi)
function near(field: HTMLElement, action: HTMLElement) {
  const form = field.closest('form');
  if (form) return form.contains(action);
  let c: HTMLElement | null = field.parentElement;
  while (c && !c.contains(action)) c = c.parentElement;
  return !!c && !c.matches('html, body, main') && !c.querySelector('nav');
}

export default function ProfanityGuard() {
  useEffect(() => {
    let check: ((s: string) => boolean) | null = null;
    const tip = document.createElement('div');
    tip.setAttribute('role', 'alert');
    tip.className = 'profanity-tip';
    const place = () => {
      const f = flagged().find(x => x === document.activeElement || x.contains(document.activeElement)) ?? flagged()[0];
      if (!f) { tip.remove(); return; }
      const r = f.getBoundingClientRect();
      tip.textContent = location.pathname.startsWith('/en') ? "This word can't be used here." : 'Questa parola non si può usare.';
      Object.assign(tip.style, { left: `${Math.max(8, r.left)}px`, top: `${Math.min(window.innerHeight - 40, r.bottom + 6)}px` });
      if (!tip.isConnected) document.body.appendChild(tip);
    };
    const mark = (f: Field) => {
      const bad = !!check && check(textOf(f));
      if (bad) f.setAttribute('data-profanity', ''); else f.removeAttribute('data-profanity');
      f.setAttribute('aria-invalid', bad ? 'true' : 'false');
      if ('setCustomValidity' in f) (f as HTMLInputElement).setCustomValidity(bad ? 'Parola non ammessa' : '');
      place();
    };
    let timer = 0;
    const onInput = (e: Event) => {
      const f = fieldOf(e.target);
      if (!f) return;
      clearTimeout(timer);
      timer = window.setTimeout(async () => {
        if (!check) check = (await import('@/lib/profanity')).hasProfanity;
        mark(f);
      }, 200);
    };
    const block = (e: Event, field: HTMLElement) => {
      e.preventDefault(); e.stopImmediatePropagation();
      field.focus(); field.classList.remove('profanity-shake'); void field.offsetWidth; field.classList.add('profanity-shake');
      place();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter') return;
      const f = fieldOf(e.target);
      if (f?.hasAttribute('data-profanity')) block(e, f);
    };
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest<HTMLElement>('button, [type="submit"], [role="button"]');
      if (!a) return;
      const f = flagged().find(x => x.isConnected && near(x, a));
      if (f) block(e, f);
    };
    const onSubmit = (e: Event) => {
      const f = flagged().find(x => (e.target as HTMLElement).contains(x));
      if (f) block(e, f);
    };
    document.addEventListener('input', onInput, true);
    document.addEventListener('keydown', onKey, true);
    document.addEventListener('click', onClick, true);
    document.addEventListener('submit', onSubmit, true);
    document.addEventListener('focusin', place, true);
    window.addEventListener('scroll', place, true);
    return () => {
      document.removeEventListener('input', onInput, true);
      document.removeEventListener('keydown', onKey, true);
      document.removeEventListener('click', onClick, true);
      document.removeEventListener('submit', onSubmit, true);
      document.removeEventListener('focusin', place, true);
      window.removeEventListener('scroll', place, true);
      tip.remove();
    };
  }, []);
  return null;
}
