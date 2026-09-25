import { flushSync } from 'react-dom'

// Trasformazione tra due stati: il browser anima gli elementi con lo stesso view-transition-name
// (posizione e dimensione), il resto in dissolvenza. Dove non c'e' supporto cambia e basta.
// Durata e curva in globals.css (::view-transition-*), uguali alle altre animazioni.
export function morph(update: () => void) {
  type VT = { ready: Promise<void>; finished: Promise<void>; updateCallbackDone: Promise<void> }
  const d = document as Document & { startViewTransition?: (cb: () => void) => VT }
  if (!d.startViewTransition || window.matchMedia('(prefers-reduced-motion: reduce)').matches) { update(); return }
  const t = d.startViewTransition(() => flushSync(update))
  // se la transizione viene interrotta (dialogo, pagina nascosta) lo stato cambia lo stesso: niente errore in console
  t.ready.catch(() => {}); t.finished.catch(() => {}); t.updateCallbackDone.catch(() => {})
}
