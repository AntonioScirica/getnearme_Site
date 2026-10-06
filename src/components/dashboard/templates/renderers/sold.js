// Templates: Venduto / Affittato (06/10/2026), le grafiche del lavoro fatto, coerenti con i video "venduto" della rotta
// video-reel: Timbro (stile Vivace, timbro rosso storto), Elegante (corsivo sobrio con cornice sottile), Classico
// (scritta spaziata tra due righe). Dati: soldLabel, soldDays ("in 23 giorni"), soldPlace, soldCta, soldPhone, agencyName.
// La foto riempie il riquadro (createCover); il contenuto resta dentro la safe area del formato (opts.size.safe).
import { createCover } from '../components.js';
import { createIcon } from '../icons.js';

const FONT = 'Poppins, sans-serif';
const SERIF = "'Playfair Display', Georgia, serif";
const RED = '#d93025';

const css = (el, s) => { Object.assign(el.style, s); return el; };
const div = (s = {}, cls = '') => { const d = css(document.createElement('div'), s); if (cls) d.className = cls; return d; };
const insets = (opts) => {
  const s = opts?.size?.safe || {};
  return { t: Math.max(60, s.top || 0), b: Math.max(60, s.bottom || 0), l: Math.max(64, s.left || 0), r: Math.max(64, s.right || 0), h: opts?.size?.h || 1350 };
};
function frame(photoUrl, overlay) {
  const el = div({ position: 'relative', overflow: 'hidden', fontFamily: FONT }, 'tpl');
  el.appendChild(createCover(photoUrl));
  el.appendChild(div({ position: 'absolute', inset: '0', background: overlay, zIndex: '1' }, 'tpl-overlay'));
  return el;
}
// colonna del contenuto, centrata, dentro la safe area
function column(el, ins, s = {}) {
  const col = div({ position: 'absolute', zIndex: '2', top: ins.t + 'px', bottom: ins.b + 'px', left: ins.l + 'px', right: ins.r + 'px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center', color: '#fff', ...s });
  el.appendChild(col);
  return col;
}
function text(t, s, cls = 'tpl-title') { const d = div({ maxWidth: '100%', minWidth: '0', overflowWrap: 'anywhere', ...s }, cls); d.textContent = t; return d; }
// in fondo: "Hai una casa da vendere?" e il telefono (o solo l'invito)
function cta(data, light) {
  if (!data.soldCta) return div({ height: '1px' });
  const box = div({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '18px', maxWidth: '100%' });
  box.appendChild(text(data.soldCta, { fontSize: '40px', fontWeight: light ? '400' : '600', lineHeight: '50px', color: '#fff', textShadow: '0 2px 18px rgba(0,0,0,.45)' }, 'tpl-desc'));
  if (data.soldPhone) {
    box.appendChild(text(data.soldPhone, light
      ? { fontSize: '34px', fontWeight: '500', lineHeight: '34px', letterSpacing: '4px', color: '#fff', whiteSpace: 'nowrap' }
      : { fontSize: '36px', fontWeight: '600', lineHeight: '36px', color: '#1d1d1f', background: '#fff', padding: '20px 40px', borderRadius: '999px', whiteSpace: 'nowrap' }, 'tpl-price'));
  }
  return box;
}

/** Timbro (Vivace): timbro rosso storto con il nome dell'agenzia, zona con la puntina, "in N giorni" in una pillola */
export function renderSoldStamp(data, photoUrl, opts = {}) {
  const ins = insets(opts);
  const el = frame(photoUrl, 'linear-gradient(180deg, rgba(0,0,0,.25) 0%, rgba(0,0,0,.15) 40%, rgba(0,0,0,.65) 100%)');
  el.classList.add('tpl-sold-stamp');
  const col = column(el, ins);
  col.appendChild(div({ height: '64px' })); // spazio del logo
  const mid = div({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '48px', maxWidth: '100%' });
  const label = (data.soldLabel || 'Venduto').toUpperCase();
  const stamp = div({ transform: 'rotate(-8deg)', background: 'rgba(255,255,255,.94)', border: `8px solid ${RED}`, borderRadius: '28px', padding: '10px', boxShadow: '0 24px 60px -20px rgba(0,0,0,.5)' });
  const inner = div({ border: `3px solid ${RED}`, borderRadius: '18px', padding: '22px 52px 28px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' });
  if (data.agencyName) inner.appendChild(text(data.agencyName.toUpperCase().slice(0, 32), { fontSize: '26px', fontWeight: '600', letterSpacing: '6px', lineHeight: '30px', color: RED, whiteSpace: 'nowrap', maxWidth: '760px', overflow: 'hidden', textOverflow: 'ellipsis' }, 'tpl-address'));
  inner.appendChild(text(label, { fontSize: label.length > 8 ? '108px' : label.length > 7 ? '120px' : '150px', fontWeight: '700', lineHeight: '1', letterSpacing: '4px', color: RED, whiteSpace: 'nowrap' }));
  stamp.appendChild(inner);
  mid.appendChild(stamp);
  const info = div({ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '24px', maxWidth: '100%' });
  if (data.soldPlace) {
    const row = div({ display: 'flex', alignItems: 'center', gap: '12px', maxWidth: '100%' });
    const ic = createIcon('mapPin', 44); ic.style.flexShrink = '0'; row.appendChild(ic);
    row.appendChild(text(data.soldPlace, { fontSize: '46px', fontWeight: '600', lineHeight: '56px', textShadow: '0 2px 16px rgba(0,0,0,.4)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }, 'tpl-address'));
    info.appendChild(row);
  }
  if (data.soldDays) info.appendChild(text(data.soldDays, { fontSize: '36px', fontWeight: '600', lineHeight: '36px', color: RED, background: '#fff', padding: '16px 34px', borderRadius: '999px', whiteSpace: 'nowrap', alignSelf: 'center' }, 'tpl-badge'));
  if (info.children.length) mid.appendChild(info);
  col.appendChild(mid);
  col.appendChild(cta(data, false));
  return el;
}

/** Elegante: velo scuro, cornice sottile, "Venduto" in corsivo, zona e giorni in maiuscoletto spaziato */
export function renderSoldElegant(data, photoUrl, opts = {}) {
  const ins = insets(opts);
  const el = frame(photoUrl, 'linear-gradient(180deg, rgba(0,0,0,.6) 0%, rgba(0,0,0,.45) 50%, rgba(0,0,0,.72) 100%)');
  el.classList.add('tpl-sold-elegant');
  // cornice sottile a 36 px dal bordo della safe area
  el.appendChild(div({ position: 'absolute', zIndex: '2', top: (ins.t - 24) + 'px', bottom: (ins.b - 24) + 'px', left: '36px', right: '36px', border: '2px solid rgba(255,255,255,.55)', pointerEvents: 'none' }));
  const col = column(el, { ...ins, t: ins.t + 32, b: ins.b + 40, l: ins.l + 24, r: ins.r + 24 });
  col.appendChild(data.agencyName && !opts.logoWhite
    ? text(data.agencyName.toUpperCase().slice(0, 32), { fontSize: '24px', fontWeight: '500', letterSpacing: '8px', lineHeight: '30px', opacity: '.9', whiteSpace: 'nowrap' }, 'tpl-address')
    : div({ height: '64px' }));
  const mid = div({ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '100%' });
  mid.appendChild(text(data.soldLabel || 'Venduto', { fontFamily: SERIF, fontStyle: 'italic', fontWeight: '400', fontSize: (data.soldLabel || '').length > 7 ? '168px' : '196px', lineHeight: '1.05', whiteSpace: 'nowrap' }));
  mid.appendChild(div({ width: '140px', height: '2px', background: 'rgba(255,255,255,.8)', margin: '40px 0 36px' }));
  if (data.soldPlace) mid.appendChild(text(data.soldPlace.toUpperCase(), { fontSize: '36px', fontWeight: '400', letterSpacing: '8px', lineHeight: '46px' }, 'tpl-address'));
  if (data.soldDays) mid.appendChild(text(data.soldDays.toUpperCase(), { fontSize: '30px', fontWeight: '500', letterSpacing: '8px', lineHeight: '36px', marginTop: '18px', textShadow: '0 2px 14px rgba(0,0,0,.45)' }, 'tpl-desc'));
  col.appendChild(mid);
  col.appendChild(cta(data, true));
  return el;
}

/** Classico: "VENDUTO" spaziato tra due righe sottili, zona e giorni sotto, sobrio */
export function renderSoldClassic(data, photoUrl, opts = {}) {
  const ins = insets(opts);
  const el = frame(photoUrl, 'linear-gradient(180deg, rgba(0,0,0,.2) 0%, rgba(0,0,0,.45) 45%, rgba(0,0,0,.7) 100%)');
  el.classList.add('tpl-sold-classic');
  const col = column(el, ins);
  col.appendChild(div({ height: '64px' }));
  const mid = div({ display: 'flex', flexDirection: 'column', alignItems: 'center', maxWidth: '100%' });
  const line = () => div({ width: '180px', height: '3px', background: '#fff' });
  const label = (data.soldLabel || 'Venduto').toUpperCase();
  mid.appendChild(line());
  mid.appendChild(text(label, { fontSize: label.length > 7 ? '104px' : '128px', fontWeight: '600', letterSpacing: label.length > 7 ? '10px' : '16px', lineHeight: '1', margin: '36px 0', whiteSpace: 'nowrap' }));
  mid.appendChild(line());
  if (data.soldPlace) mid.appendChild(text(data.soldPlace, { fontSize: '44px', fontWeight: '500', lineHeight: '54px', marginTop: '44px' }, 'tpl-address'));
  if (data.soldDays) mid.appendChild(text(data.soldDays, { fontSize: '36px', fontWeight: '500', lineHeight: '44px', marginTop: '12px' }, 'tpl-desc'));
  col.appendChild(mid);
  col.appendChild(cta(data, false));
  return el;
}
