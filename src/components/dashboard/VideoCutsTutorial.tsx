'use client';

// Onboarding "Taglia & Anima" (video_cuts). Stesso stile del tour dell'app:
// card chiara, area animata con gradiente blu, header "N di M", titolo + testo,
// divider, footer Indietro/Avanti. Le animazioni SVG sono fedeli ai gesti reali
// (guarda+pausa, premi Trasforma, sposta la fine, scegli lo stile, crea).
// Si apre da sola al primo accesso (flag localStorage) e si riapre dal pulsante
// "Tutorial" negli step.

import React from 'react';
import { createPortal } from 'react-dom';
import { s, Box, Icon } from './ui';

const ACCENT = '#3B83F6';

// Keyframes condivise (prefisso vct-). Tutte le scene usano viewBox 320x156.
const CSS = `
@keyframes vct-scrub { 0%{transform:translateX(0)} 38%{transform:translateX(188px)} 100%{transform:translateX(188px)} }
@keyframes vct-fadeLate { 0%,30%{opacity:0} 42%,100%{opacity:1} }
@keyframes vct-fadeEarly { 0%,30%{opacity:1} 42%,100%{opacity:0} }
@keyframes vct-tap { 0%,20%{opacity:0;transform:scale(.4)} 34%{opacity:.6;transform:scale(1)} 52%,100%{opacity:0;transform:scale(1.7)} }
@keyframes vct-press { 0%,24%{transform:scale(1)} 36%{transform:scale(.94)} 50%,100%{transform:scale(1)} }
@keyframes vct-pop { 0%,24%{transform:scale(0);opacity:0} 46%{transform:scale(1.1);opacity:1} 62%,100%{transform:scale(1);opacity:1} }
@keyframes vct-grow { 0%,6%{transform:scaleX(1)} 44%{transform:scaleX(2.775)} 82%,100%{transform:scaleX(2.775)} }
@keyframes vct-slide { 0%,6%{transform:translateX(0)} 44%{transform:translateX(71px)} 82%,100%{transform:translateX(71px)} }
@keyframes vct-finger { 0%,6%{transform:translate(0,0)} 22%{transform:translate(0,-3px)} 44%{transform:translate(71px,0)} 82%,100%{transform:translate(71px,0)} }
@keyframes vct-selPop { 0%,20%{opacity:0;transform:scale(.4)} 40%{opacity:1;transform:scale(1.1)} 56%,100%{opacity:1;transform:scale(1)} }
@keyframes vct-cursorTap { 0%,30%{transform:translate(0,0)} 44%{transform:translate(0,3px)} 58%,100%{transform:translate(0,0)} }
@keyframes vct-spark { 0%,46%{opacity:0;transform:scale(.2)} 60%{opacity:1;transform:scale(1)} 100%{opacity:0;transform:scale(1.6)} }
@keyframes vct-rise { 0%,50%{opacity:0;transform:translateY(14px)} 70%,100%{opacity:1;transform:translateY(0)} }
@keyframes vct-in { 0%{opacity:0;transform:translateY(8px)} 100%{opacity:1;transform:translateY(0)} }
.vct-anim *{transform-box:fill-box}
`;

// ── Scene SVG (una per passaggio), viewBox 320x156, contenuto centrato ────────

function SceneWatch() {
  // Zoom sulla TIMELINE (telefono solo accennato dalla cornice): la filmstrip
  // grande, il playhead che scorre e si ferma, e il tocco di PAUSA sul comando.
  const cells = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <svg className="vct-anim" viewBox="0 0 320 156" width="100%" height="100%" role="img" aria-label="Guarda il video e mettilo in pausa">
      {/* cornice telefono accennata (zoom) — toni blu, non nero */}
      <rect x="34" y="18" width="252" height="120" rx="16" fill="#1e3a6b" />
      <rect x="40" y="24" width="240" height="108" rx="11" fill="#14294a" />
      {/* filmstrip grande (timeline zoomata) */}
      {cells.map(i => (
        <rect key={i} x={50 + i * 27} y="34" width="27" height="52" fill={i % 2 ? '#cfcabf' : '#bdb7a9'} />
      ))}
      <rect x="50" y="34" width="216" height="52" rx="4" fill="none" stroke="#3a4256" strokeWidth="1" />
      {/* playhead che scorre e si ferma */}
      <g style={{ animation: 'vct-scrub 4s ease-in-out infinite' }}>
        <rect x="50" y="30" width="3" height="60" rx="1.5" fill={ACCENT} stroke="#fff" strokeWidth="1" />
      </g>
      {/* comando play -> pausa in basso */}
      <g style={{ animation: 'vct-fadeEarly 4s ease-in-out infinite', transformOrigin: 'center' }}>
        <circle cx="64" cy="113" r="12" fill="#27457a" />
        <polygon points="60,107 70,113 60,119" fill="#fff" />
      </g>
      <g style={{ animation: 'vct-fadeLate 4s ease-in-out infinite', transformOrigin: 'center' }}>
        <circle cx="64" cy="113" r="12" fill="#27457a" />
        <rect x="59.5" y="107" width="3.5" height="12" rx="1.2" fill="#fff" />
        <rect x="65" y="107" width="3.5" height="12" rx="1.2" fill="#fff" />
      </g>
      <rect x="84" y="111" width="186" height="4" rx="2" fill="#27457a" />
      {/* tocco di pausa sul comando */}
      <circle cx="64" cy="113" r="13" fill="none" stroke={ACCENT} strokeWidth="2.5" style={{ animation: 'vct-tap 4s ease-in-out infinite', transformOrigin: 'center' }} />
    </svg>
  );
}

function SceneTransform() {
  // Si preme il pulsante blu e compare il blocco taglio sulla timeline.
  const cells = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <svg className="vct-anim" viewBox="0 0 320 156" width="100%" height="100%" role="img" aria-label="Premi Trasforma questo momento">
      {/* filmstrip centrata: x 40..280 */}
      {cells.map(i => (
        <rect key={i} x={40 + i * 30} y="30" width="29" height="44" fill={i % 2 ? '#cfcabf' : '#bdb7a9'} />
      ))}
      <rect x="40" y="30" width="240" height="44" rx="6" fill="none" stroke="#d8d4cb" strokeWidth="1.5" />
      {/* blocco taglio che compare (sopra una cella centrale) */}
      <g style={{ animation: 'vct-pop 3.6s ease-in-out infinite', transformOrigin: 'center' }}>
        <rect x="146" y="28" width="34" height="48" rx="4" fill="rgba(59,131,246,.28)" stroke={ACCENT} strokeWidth="2.5" />
      </g>
      {/* pulsante piccolo, staccato dalla filmstrip, icona+testo centrati */}
      <g style={{ animation: 'vct-press 3.6s ease-in-out infinite', transformOrigin: 'center' }}>
        <rect x="104" y="106" width="112" height="32" rx="11" fill={ACCENT} />
        <path d="M126 117 l1.4 3.6 3.6 1.4 -3.6 1.4 -1.4 3.6 -1.4 -3.6 -3.6 -1.4 3.6 -1.4 z" fill="#fff" />
        <text x="138" y="126.5" fill="#fff" fontSize="13" fontWeight="700" fontFamily="system-ui" textAnchor="start">Trasforma</text>
      </g>
      <circle cx="160" cy="122" r="18" fill="none" stroke={ACCENT} strokeWidth="2.5" style={{ animation: 'vct-tap 3.6s ease-in-out infinite', transformOrigin: 'center' }} />
    </svg>
  );
}

function SceneEnd() {
  // Si trascina la maniglia di FINE finché inizia la scena dopo. Maniglia e bordo
  // destro del range restano allineati per tutta l'animazione.
  const cells = [0, 1, 2, 3, 4, 5, 6, 7];
  return (
    <svg className="vct-anim" viewBox="0 0 320 156" width="100%" height="100%" role="img" aria-label="Sposta la fine del taglio">
      {/* filmstrip x 40..280; le ultime celle = scena dopo */}
      {cells.map(i => (
        <rect key={i} x={40 + i * 30} y="34" width="29" height="52" fill={i >= 5 ? '#9fc3f2' : (i % 2 ? '#cfcabf' : '#bdb7a9')} />
      ))}
      <rect x="40" y="34" width="240" height="52" rx="6" fill="none" stroke="#d8d4cb" strokeWidth="1.5" />
      {/* etichetta scena dopo, centrata sotto le celle blu */}
      <text x="220" y="104" fill="#1d5fd0" fontSize="11" fontWeight="700" fontFamily="system-ui" textAnchor="middle">scena dopo</text>
      {/* range che cresce da sinistra: x 80, larghezza 40, bordo dx 120 -> 160 */}
      <rect x="80" y="32" width="40" height="56" rx="3" fill="rgba(59,131,246,.26)" stroke={ACCENT} strokeWidth="2.5"
        style={{ animation: 'vct-grow 3.6s ease-in-out infinite', transformOrigin: 'left center' }} />
      {/* maniglia fine: centro a 120 -> 160 (segue il bordo dx) */}
      <g style={{ animation: 'vct-slide 3.6s ease-in-out infinite' }}>
        <rect x="114" y="30" width="12" height="60" rx="4" fill={ACCENT} />
        <rect x="118.5" y="46" width="3" height="28" rx="1.5" fill="#fff" />
      </g>
      {/* dito che trascina, sotto la maniglia */}
      <g style={{ animation: 'vct-finger 3.6s ease-in-out infinite' }}>
        <circle cx="120" cy="116" r="11" fill="#fff" stroke={ACCENT} strokeWidth="2.5" />
        <path d="M120 110 v12 M114 116 h12" stroke={ACCENT} strokeWidth="2.2" strokeLinecap="round" />
      </g>
    </svg>
  );
}

function SceneStyle() {
  // Si sceglie lo stile d'arredo: tap su una tessera, bordo blu + spunta.
  const xs = [51, 129, 207];
  return (
    <svg className="vct-anim" viewBox="0 0 320 156" width="100%" height="100%" role="img" aria-label="Scegli lo stile">
      {xs.map((x, i) => (
        <g key={i}>
          <rect x={x} y="34" width="62" height="68" rx="12" fill="#f3f1ec" stroke="#e4e1da" strokeWidth="1.5" />
          <rect x={x + 15} y="50" width="32" height="24" rx="3" fill="#cdd6e6" />
          <rect x={x + 14} y="82" width="34" height="6" rx="3" fill="#d6d1c7" />
        </g>
      ))}
      {/* selezione sulla tessera centrale (x 129, w 62) */}
      <g style={{ animation: 'vct-selPop 3.4s ease-in-out infinite', transformOrigin: 'center' }}>
        <rect x="128" y="32" width="66" height="72" rx="13" fill="rgba(59,131,246,.10)" stroke={ACCENT} strokeWidth="2.5" />
        <circle cx="192" cy="34" r="11" fill={ACCENT} stroke="#fff" strokeWidth="2.5" />
        <path d="M187 34 l3.4 3.4 6 -6.6" fill="none" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
      </g>
    </svg>
  );
}

function SceneCreate() {
  // Solo la CTA "Crea il video": centrata e grande, niente scintille o video.
  return (
    <svg className="vct-anim" viewBox="0 0 320 156" width="100%" height="100%" role="img" aria-label="Crea il video">
      <g style={{ animation: 'vct-press 3.6s ease-in-out infinite', transformOrigin: 'center' }}>
        <rect x="80" y="56" width="160" height="44" rx="14" fill={ACCENT} />
        <path d="M112 72 l2 4 4 2 -4 2 -2 4 -2 -4 -4 -2 4 -2 z" fill="#fff" />
        <text x="126" y="83" fill="#fff" fontSize="15" fontWeight="700" fontFamily="system-ui" textAnchor="start">Crea il video</text>
      </g>
      <circle cx="160" cy="78" r="26" fill="none" stroke={ACCENT} strokeWidth="2.5" style={{ animation: 'vct-tap 3.6s ease-in-out infinite', transformOrigin: 'center' }} />
    </svg>
  );
}

type Slide = { title: string; body: React.ReactNode; scene: React.ReactNode };

const SLIDES: Slide[] = [
  { title: 'Guarda il video e metti in pausa', body: <>Avvia il tuo video. Appena arrivi all&apos;<b>inizio della parte da togliere</b>, mettilo in <b>pausa</b>.</>, scene: <SceneWatch /> },
  { title: 'Premi "Trasforma questo momento"', body: <>Con un tocco crei un <b>taglio</b> in quel punto: l&apos;AI sostituirà quella parte con un&apos;animazione d&apos;arredo.</>, scene: <SceneTransform /> },
  { title: 'Sposta la fine del taglio', body: <>Trascina la <b>maniglia di fine</b> in avanti, fino a quando vedi <b>iniziare la scena dopo</b>: è lì che finisce la parte da togliere.</>, scene: <SceneEnd /> },
  { title: 'Scegli lo stile d’arredo', body: <>Per ogni taglio scegli con un tap lo <b>stile</b>. La tua <b>voce continua a sentirsi</b> sotto l&apos;animazione.</>, scene: <SceneStyle /> },
  { title: 'Crea il video', body: <>Quando hai segnato tutti i momenti, premi <b>Crea il video</b>. Ogni taglio usa <b>1 credito</b> e il video è pronto in pochi minuti.</>, scene: <SceneCreate /> },
];

export function VideoCutsTutorial({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [idx, setIdx] = React.useState(0);
  React.useEffect(() => { if (open) setIdx(0); }, [open]);
  if (!open || typeof document === 'undefined') return null;
  const last = idx === SLIDES.length - 1;
  const slide = SLIDES[idx];

  // Portal su body: evita che un antenato con transform sposti il popup fuori
  // centro (position:fixed userebbe quell'antenato come riferimento).
  return createPortal(
    <div onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 10000, background: 'rgba(24,21,17,.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div onClick={e => e.stopPropagation()} className="max-md:!max-w-full" style={{ width: '100%', maxWidth: 380, background: 'var(--bg-card)', borderRadius: 16, boxShadow: '0 24px 64px rgba(20,18,15,.32)', padding: '22px 24px', animation: 'vct-in .3s cubic-bezier(0.16,1,0.3,1) forwards' }}>
        {/* area animata, stile tour */}
        <div style={{ height: 150, borderRadius: 12, background: 'linear-gradient(135deg,#eef4fe,var(--bg-hover))', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 14 }}>
          {slide.scene}
        </div>
        {/* header: N di M + Salta */}
        <div style={s('display:flex;align-items:center;justify-content:space-between;margin-bottom:6px')}>
          <span style={s('font-size:11px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#1d5fd0')}>{(idx + 1) + ' di ' + SLIDES.length}</span>
          <span onClick={onClose} style={s('font-size:12px;font-weight:600;color:#b3aca1;cursor:pointer;padding:4px')}>Salta</span>
        </div>
        {/* titolo + testo */}
        <div style={s('font-size:16px;font-weight:800;letter-spacing:-.2px;margin-bottom:4px')}>{slide.title}</div>
        <div style={s('font-size:13px;color:var(--text-sec);line-height:1.5;margin-bottom:16px')}>{slide.body}</div>
        <div style={{ height: 1, background: 'var(--border-light)', margin: '0 0 16px' }} />
        {/* footer */}
        <div style={s('display:flex;align-items:center;justify-content:space-between')}>
          {idx > 0
            ? <Box as="button" onClick={() => setIdx(i => Math.max(0, i - 1))} style={s('border:1px solid var(--border-main);background:var(--bg-card);font-size:12.5px;font-weight:700;padding:9px 16px;border-radius:8px;cursor:pointer;min-height:38px') as React.CSSProperties} hover={s('background:var(--bg-hover)')}>Indietro</Box>
            : <span />}
          <Box as="button" onClick={() => { if (last) onClose(); else setIdx(i => i + 1); }} style={s(`border:none;background:${ACCENT};color:var(--bg-card);font-size:12.5px;font-weight:700;padding:9px 18px;border-radius:8px;cursor:pointer;margin-left:auto;min-height:38px;display:flex;align-items:center;gap:6px`) as React.CSSProperties} hover={s('background:#2b6fe0')}>
            {last ? 'Ho capito' : 'Avanti'}
          </Box>
        </div>
      </div>
    </div>,
    document.body,
  );
}

// Pulsantino "Tutorial" da mettere negli step (riapre l'onboarding).
export function TutorialButton({ onClick }: { onClick: () => void }) {
  return (
    <Box as="button" onClick={onClick} style={s('flex:none;display:inline-flex;align-items:center;gap:7px;border:1px solid #cfe0fb;background:#eef4fe;color:#1d5fd0;font-size:13px;font-weight:700;padding:9px 14px;border-radius:10px;cursor:pointer') as React.CSSProperties} hover={s('background:#e2eefe')}>
      <Icon name="circle-help" size={15} color="#1d5fd0" />Tutorial
    </Box>
  );
}
