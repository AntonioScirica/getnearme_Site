'use client';

import { useState, useRef, useCallback, useEffect, type ReactNode } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Icon } from '@/lib/icons';
import RevealSection from './RevealSection';
import { ALL_TEMPLATES } from '@/components/SocialShowcase';
import LazyVideo from '@/components/LazyVideo';

interface FeatureShowcaseProps {
  feature: { num: string; title: string; desc: string; icon: string; color: string };
  videoSrc?: string;
  index: number;
  reverse: boolean;
}

// examples/opt-desktop: foto reali da /Desktop/FotoTestGetNearMe + /staging/videos
// (giorno/notte — crop 4:3 da foto verticali 1536x2752), cover-crop a 900x675 q90.
// "Moderno" usa /staging/1.webp+2.webp (la stanza con la poltrona Eames, la
// stessa foto di default del vecchio BeforeAfterSlider pre-slider) — mai
// prima_moderno.jpg/dopo_moderno.jpg nel Desktop, che sono in realta' una
// facciata, non una stanza.
// Planimetria/render: prima_plan.png (Desktop) + dopo_plan.png (Desktop/FotoTestGetNearMe).
const OPT_DESKTOP_BASE = 'https://ecrnpyksnfyykqwnutwa.supabase.co/storage/v1/object/public/content/examples/opt-desktop';
const HOME_STAGING_MINI_EXAMPLES = [
  { before: `${OPT_DESKTOP_BASE}/emp_b.webp`, after: `${OPT_DESKTOP_BASE}/emp_a.webp`, label: 'Svuota una stanza' },
  { before: `${OPT_DESKTOP_BASE}/mod_b.webp`, after: `${OPT_DESKTOP_BASE}/mod_a.webp`, label: 'Rendi la stanza moderna' },
  { before: `${OPT_DESKTOP_BASE}/ren_b.webp`, after: `${OPT_DESKTOP_BASE}/ren_a.webp`, label: 'Rinnova la facciata' },
  { before: `${OPT_DESKTOP_BASE}/dn_b.webp`, after: `${OPT_DESKTOP_BASE}/dn_a.webp`, label: 'Dal giorno alla notte' },
  { before: `${OPT_DESKTOP_BASE}/col_b.webp`, after: `${OPT_DESKTOP_BASE}/col_a.webp`, label: 'Cambia colore al palazzo' },
  { before: `${OPT_DESKTOP_BASE}/plan_b2.webp`, after: `${OPT_DESKTOP_BASE}/plan_a2.webp`, label: 'Da planimetria a render' },
];

// Stessi 6 esempi prima nella sezione "Esempi reali" (ora rimossa da
// page.tsx), spostati qui nello slider così da avere una riga di esempi
// anche nella sezione Video AI, come per Home staging AI.
const VIDEO_MINI_EXAMPLES = [
  { src: '/reference/prima-dopo.mp4', poster: '/reference/prima-dopo-poster.jpg', label: 'Prima vs Dopo' },
  { src: '/reference/construction.mp4', poster: '/reference/construction-poster.jpg', label: 'Timelapse AI' },
  { src: '/reference/giorno-notte.mp4', poster: '/reference/giorno-notte-poster.jpg', label: 'Giorno e notte' },
  { src: '/reference/primo-piano.mp4', poster: '/reference/primo-piano-poster.jpg', label: 'Avatar in primo piano' },
  { src: '/reference/split.mp4', poster: '/reference/split-poster.jpg', label: 'Schermo diviso' },
  { src: '/reference/social-reel.mp4', poster: '/reference/social-reel-poster.jpg', label: 'Reel per i social' },
];

// Divider prima/dopo draggabile per ogni card della mini-slider (versione
// leggera di BeforeAfterSlider: niente crossfade/hint, solo drag pointer).
// Shimmer placeholder finche' entrambe le immagini non finiscono di caricare
// (stesso pattern della griglia Esempi dashboard: niente flash di layout vuoto).
function MiniDragCompare({ before, after, label, eager }: { before: string; after: string; label: string; eager?: boolean }) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState(50);
  const [beforeLoaded, setBeforeLoaded] = useState(false);
  const [afterLoaded, setAfterLoaded] = useState(false);
  const ready = beforeLoaded && afterLoaded;
  const updatePos = useCallback((clientX: number) => {
    const el = ref.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = Math.max(0, Math.min(100, ((clientX - rect.left) / rect.width) * 100));
    setPos(pct);
  }, []);
  return (
    <div
      ref={ref}
      className="mini-drag-compare"
      onPointerDown={(e) => { updatePos(e.clientX); (e.target as HTMLElement).setPointerCapture(e.pointerId); }}
      onPointerMove={(e) => { if (e.buttons !== 1) return; updatePos(e.clientX); }}
      style={{
        position: 'relative', aspectRatio: '16 / 9', cursor: 'ew-resize', touchAction: 'none', userSelect: 'none',
        ...(ready
          ? { background: '#f4f2ee' }
          : { background: 'linear-gradient(90deg,#efece7,#f7f5f1,#efece7)', backgroundSize: '200% 100%', animation: 'featureMiniShimmer 1.4s linear infinite' }),
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={after}
        alt={`${label} dopo`}
        loading={eager ? 'eager' : 'lazy'}
        fetchPriority={eager ? 'high' : 'auto'}
        draggable={false}
        ref={(el) => { if (el?.complete) setAfterLoaded(true); }}
        onLoad={() => setAfterLoaded(true)}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: ready ? 1 : 0, transition: 'opacity .25s' }}
      />
      <div style={{ position: 'absolute', inset: 0, clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={before}
          alt={`${label} prima`}
          loading={eager ? 'eager' : 'lazy'}
          fetchPriority={eager ? 'high' : 'auto'}
          draggable={false}
          ref={(el) => { if (el?.complete) setBeforeLoaded(true); }}
          onLoad={() => setBeforeLoaded(true)}
          style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', opacity: ready ? 1 : 0, transition: 'opacity .25s' }}
        />
      </div>
      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${pos}%`, width: 2, marginLeft: -1, background: '#fff', boxShadow: '0 0 4px rgba(0,0,0,.45)', opacity: ready ? 1 : 0 }} />
      <div style={{ position: 'absolute', top: '50%', left: `${pos}%`, transform: 'translate(-50%, -50%)', width: 28, height: 28, borderRadius: '50%', background: '#fff', boxShadow: '0 2px 10px rgba(0,0,0,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none', opacity: ready ? 1 : 0 }}>
        <ChevronLeft size={11} color="#3B83F6" strokeWidth={2.5} />
        <ChevronRight size={11} color="#3B83F6" strokeWidth={2.5} />
      </div>
    </div>
  );
}

// Riga di card in slider orizzontale, condivisa tra Home staging (foto
// prima/dopo) e Video AI (reel). Gestisce bleed a destra fino al bordo
// reale del viewport (misurato via JS, non calc(50vw) — il wrapper non e'
// centrato ma ancorato a fianco del testo), frecce con scroll preciso al
// bordo-card (non uno step fisso in px, altrimenti vicino ai bordi resta
// sempre un resto da scrollare), e fade sinistro quando non si e' all'inizio.
function MiniExampleSlider<T extends { label: string }>({
  bg,
  items,
  cardWidth,
  renderCard,
  showLabel = true,
  ctaHref,
  ctaLabel,
  ctaAspectRatio,
  variant,
}: {
  bg: string;
  items: T[];
  cardWidth: number;
  renderCard: (item: T, i: number) => ReactNode;
  showLabel?: boolean;
  // Card finale "c'e' altro" — link ai piani, stessa dimensione delle altre.
  // Sfondo: blob sfocati generici, non una foto delle card sopra (altrimenti
  // sembra un duplicato di un esempio invece che un rimando ad "altro").
  ctaHref?: string;
  ctaLabel?: string;
  ctaAspectRatio?: string;
  // Modificatore per larghezza card su mobile (es. 'video' → 2 colonne visibili).
  variant?: string;
}) {
  const sliderRef = useRef<HTMLDivElement>(null);
  const bleedRef = useRef<HTMLDivElement>(null);
  const [bleedWidth, setBleedWidth] = useState<number | null>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  const slideBy = (dir: 1 | -1) => {
    const el = sliderRef.current;
    if (!el) return;
    const cards = Array.from(el.children) as HTMLElement[];
    const current = el.scrollLeft;
    const targets = cards.map((c) => c.offsetLeft);
    const TOLERANCE = 20;
    let currentIndex = 0;
    targets.forEach((t, i) => { if (t <= current + TOLERANCE) currentIndex = i; });
    let next: number;
    if (dir === 1) {
      const nextIndex = currentIndex + 1;
      next = nextIndex < targets.length ? targets[nextIndex] : el.scrollWidth;
    } else {
      const prevIndex = currentIndex - 1;
      next = prevIndex <= 0 ? 0 : targets[prevIndex];
    }
    el.scrollTo({ left: next, behavior: 'smooth' });
  };

  const updateEdges = useCallback(() => {
    const el = sliderRef.current;
    if (!el) return;
    setAtStart(el.scrollLeft <= 4);
    setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = sliderRef.current;
    if (!el) return;
    updateEdges();
    el.addEventListener('scroll', updateEdges, { passive: true });
    const ro = new ResizeObserver(updateEdges);
    ro.observe(el);
    window.addEventListener('resize', updateEdges);
    return () => {
      el.removeEventListener('scroll', updateEdges);
      window.removeEventListener('resize', updateEdges);
      ro.disconnect();
    };
  }, [updateEdges]);

  useEffect(() => {
    const el = bleedRef.current;
    if (!el) return;
    const measure = () => {
      // Sotto i 768px le colonne si impilano (flex-direction:column): niente
      // sfondamento a destra, il wrapper deve restare semplicemente 100% largo
      // quanto la colonna. Misurare comunque qui crea un loop: bleedWidth
      // sbagliato -> feature-media (senza width propria) cresce per contenerlo
      // -> nuova misura ancora piu' sbagliata.
      if (window.innerWidth < 769) {
        setBleedWidth(null);
        return;
      }
      const left = el.getBoundingClientRect().left;
      setBleedWidth(window.innerWidth - left);
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(el);
    window.addEventListener('resize', measure);
    return () => {
      window.removeEventListener('resize', measure);
      ro.disconnect();
    };
  }, []);

  return (
    <div className={`feature-mini-root${variant ? ` mini-${variant}` : ''}`} style={{ marginLeft: 14, position: 'relative' }}>
      <div
        ref={bleedRef}
        className="feature-mini-slider-outer"
        style={{ position: 'relative', width: bleedWidth ? `${bleedWidth}px` : '100%' }}
      >
        <div
          className="feature-mini-fade-left"
          style={{ opacity: atStart ? 0 : 1, background: `linear-gradient(to right, ${bg}, transparent)` }}
        />
        <div
          ref={sliderRef}
          className="feature-mini-slider"
          style={{ display: 'flex', flexWrap: 'nowrap', gap: 14, overflowX: 'auto', scrollbarWidth: 'none', paddingTop: 8, paddingBottom: 20, paddingLeft: 8, paddingRight: 8 }}
        >
          {items.map((item, i) => (
            <div key={item.label} className="feature-mini-card" style={{ flex: `0 0 ${cardWidth}px`, borderRadius: 14, overflow: 'hidden', border: '1px solid rgba(26,26,46,0.10)', background: '#fff', boxShadow: '0 6px 20px rgba(16,24,40,0.06)' }}>
              {renderCard(item, i)}
              {showLabel && (
                <div style={{ padding: '9px 11px 11px' }}>
                  <h4 style={{ fontSize: 13, fontWeight: 700, color: '#1a1a2e', margin: 0, lineHeight: 1.3 }}>{item.label}</h4>
                </div>
              )}
            </div>
          ))}
          {ctaHref && (
            <a
              href={ctaHref}
              className="feature-mini-cta"
              style={{
                flex: `0 0 ${cardWidth}px`,
                position: 'relative',
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid rgba(26,26,46,0.10)',
                textDecoration: 'none',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                textAlign: 'center',
                padding: '0 20px',
                aspectRatio: ctaAspectRatio ?? '4 / 3',
                boxShadow: '0 6px 20px rgba(16,24,40,0.06)',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  inset: -20,
                  filter: 'blur(22px)',
                  background: 'radial-gradient(circle at 30% 30%, #3B83F6, transparent 60%), radial-gradient(circle at 70% 70%, #F59E0B, transparent 60%), radial-gradient(circle at 70% 20%, #10B981, transparent 55%)',
                }}
              />
              <div style={{ position: 'absolute', inset: 0, background: 'rgba(26,26,46,0.42)' }} />
              <span style={{ position: 'relative', width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)' }}>
                <ChevronRight size={20} color="#fff" strokeWidth={2.5} />
              </span>
              <span style={{ position: 'relative', fontSize: 13, fontWeight: 700, color: '#fff', lineHeight: 1.35, textShadow: '0 1px 4px rgba(0,0,0,0.3)' }}>{ctaLabel ?? '...e molto altro'}</span>
            </a>
          )}
        </div>
      </div>
      <div className="feature-mini-arrows" style={{ position: 'absolute', top: '100%', left: 0, right: 0, display: 'flex', justifyContent: 'flex-end', gap: 10, marginTop: 14 }}>
        <button
          aria-label="Precedente"
          onClick={() => slideBy(-1)}
          className="feature-mini-arrow"
          style={{ opacity: atStart ? 0.35 : 1, pointerEvents: atStart ? 'none' : 'auto' }}
        >
          <ChevronLeft size={20} strokeWidth={2.5} />
        </button>
        <button
          aria-label="Successivo"
          onClick={() => slideBy(1)}
          className="feature-mini-arrow"
          style={{ opacity: atEnd ? 0.35 : 1, pointerEvents: atEnd ? 'none' : 'auto' }}
        >
          <ChevronRight size={20} strokeWidth={2.5} />
        </button>
      </div>
    </div>
  );
}

export default function FeatureShowcase({ feature: f, videoSrc, index, reverse }: FeatureShowcaseProps) {
  const params = useParams();
  const locale = (params?.locale as string) || 'it';
  const bg = index % 2 === 0 ? '#fff' : '#f3f4f6';

  const sectionIds = ['ai-photos', 'ai-video', 'social-posts', 'reports', 'zone-analysis', 'price-calculator'];
  const sectionId = sectionIds[index] || `feature-${index}`;

  return (
    <div id={sectionId} style={{ background: bg }} className="scroll-mt-20">
      <RevealSection delay={80}>
        <div
          style={{
            paddingTop: 58,
            paddingBottom: index === 0 || index === 1 || index === 2 ? 106 : 58,
            display: 'flex',
            // Home staging (0) e Social posts (2) invertiti: testo a sinistra, media a destra,
            // come Video AI (che invece ha gia' reverse=true di suo per essere indice dispari).
            flexDirection: (index === 0 || index === 2 ? !reverse : reverse) ? 'row-reverse' : 'row',
            alignItems: 'center',
            gap: index === 0 || index === 1 || index === 2 ? 28 : 43,
          }}
          className="feature-showcase-row max-w-7xl mx-auto px-5 md:px-3"
        >
          {/* Media */}
          <div className="feature-media" style={{ flex: index === 0 || index === 1 || index === 2 ? 1.7 : 1, minWidth: 0, position: 'relative' }}>
            {index === 0 && (
              <MiniExampleSlider
                bg={bg}
                items={HOME_STAGING_MINI_EXAMPLES}
                cardWidth={336}
                ctaHref="#pricing"
                ctaAspectRatio="16 / 9"
                renderCard={(ex, i) => (
                  <MiniDragCompare before={ex.before} after={ex.after} label={ex.label} eager={i === 0} />
                )}
              />
            )}
            {index === 1 && (
              <MiniExampleSlider
                bg={bg}
                items={VIDEO_MINI_EXAMPLES}
                cardWidth={220}
                variant="video"
                ctaHref="#pricing"
                ctaAspectRatio="9 / 16"
                renderCard={(ex, i) => (
                  <div style={{ aspectRatio: '9 / 16', background: '#f4f2ee' }}>
                    <LazyVideo
                      src={ex.src}
                      poster={ex.poster}
                      style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                    />
                  </div>
                )}
              />
            )}
            {index === 2 && (
              <MiniExampleSlider
                bg={bg}
                items={ALL_TEMPLATES.map((t) => ({ ...t, label: t.name }))}
                cardWidth={300}
                showLabel={false}
                variant="posts"
                ctaHref="#pricing"
                ctaAspectRatio="1 / 1.25"
                renderCard={(t) => (
                  // I template (TplGradient/TplBlue/...) usano font-size in px assoluti
                  // calibrati per i 160px di colonna del marquee originale (vedi commento
                  // "Scaled from 1080->160" in SocialShowcase.tsx) — non sono responsive.
                  // Allargando la card, il box cresce ma i testi restano fissi: qui li
                  // scaliamo con "zoom" (non transform:scale) — stessa tecnica esatta di
                  // TemplatePreview.tsx nel dashboard. transform:scale() rompe il
                  // backdrop-filter (blur dei pannelli glass) sotto un antenato con
                  // transform, perche' cambia il contesto di compositing; zoom invece
                  // rifà il reflow del box alla dimensione scalata, senza quel problema.
                  // Niente animazione: il loop CSS del template (tplFI/tplSU) finisce
                  // a opacity:0 e in una card statica sembra "sparire" — qui il testo
                  // resta sempre rivelato e leggibile.
                  <div style={{ position: 'relative', aspectRatio: '1 / 1.25', overflow: 'hidden' }}>
                    <div className="feature-post-static" style={{ width: 160, height: 200, zoom: 300 / 160 }}>
                      <t.Component photo={t.photo} bd={t.bd} />
                    </div>
                  </div>
                )}
              />
            )}
            {index !== 0 && index !== 1 && index !== 2 && (
            <div
              style={{
                background: '#fff',
                borderRadius: 14,
                overflow: 'hidden',
                border: '1px solid rgba(26,26,46,0.10)',
                boxShadow: '0 6px 20px rgba(16,24,40,0.06)',
              }}
            >
              {videoSrc ? (
                <div style={{ aspectRatio: '16 / 10' }}>
                  {/\.(png|jpe?g|webp|gif)$/i.test(videoSrc) ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={videoSrc}
                      alt={f.title}
                      className="w-full h-full"
                      style={{ objectFit: 'cover', display: 'block' }}
                    />
                  ) : (
                    <LazyVideo
                      src={videoSrc}
                      className="w-full h-full"
                      style={{ objectFit: 'cover', display: 'block' }}
                    />
                  )}
                </div>
              ) : null}
            </div>
            )}
          </div>

          {/* Text */}
          <div className="feature-text" style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 18 }}>
              <span
                style={{
                  width: 40,
                  height: 40,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: `${f.color}15`,
                  borderRadius: 11,
                  border: `2px solid ${f.color}40`,
                  color: f.color,
                }}
              >
                <Icon name={f.icon} size={20} />
              </span>
            </div>

            <h3
              style={{
                fontSize: 25,
                fontWeight: 900,
                color: '#1a1a2e',
                margin: '0 0 11px',
                lineHeight: 1.2,
              }}
            >
              {index === 5 ? (
                <>Prezzo medio<br className="md:hidden" /> di zona al m²</>
              ) : f.title}
            </h3>

            <p
              style={{
                color: '#52525b',
                fontSize: 14.5,
                lineHeight: 1.7,
                margin: 0,
                maxWidth: 380,
              }}
            >
              {f.desc}
            </p>
            {index === 2 && (
              <div className="feature-upload-desktop" style={{ marginTop: 14 }}>
                <Link
                  href={`/${locale}#pricing`}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 7, padding: '9px 18px',
                    background: '#fff', color: f.color, fontSize: 13, fontWeight: 700,
                    borderRadius: 9, border: `1px solid ${f.color}55`,
                    textDecoration: 'none', transition: 'all 0.2s ease',
                  }}
                >
                  Prova con la tua foto
                </Link>
              </div>
            )}
          </div>

          {/* CTA mobile — below media */}
          {index === 2 && (
            <div className="feature-upload-mobile" style={{ display: 'none', width: '100%' }}>
              <Link
                href={`/${locale}#pricing`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7,
                  padding: '11px 18px', width: '100%',
                  background: '#fff', color: f.color, fontSize: 13, fontWeight: 700,
                  borderRadius: 9, border: `1px solid ${f.color}55`,
                  textDecoration: 'none', transition: 'all 0.2s ease',
                }}
              >
                Prova con la tua foto
              </Link>
            </div>
          )}
        </div>
      </RevealSection>

      <style>{`
        .feature-mini-slider::-webkit-scrollbar { display: none; }
        .feature-mini-fade-left {
          position: absolute;
          top: 0;
          bottom: 0;
          left: 0;
          width: 40px;
          pointer-events: none;
          z-index: 1;
          transition: opacity 0.2s ease;
        }
        /* Desktop: card home staging un po' piu' alte (3:2 invece di 16:9). */
        @media (min-width: 769px) {
          .mini-drag-compare { aspect-ratio: 3 / 2 !important; }
        }
        .feature-mini-arrow {
          width: 34px;
          height: 34px;
          border-radius: 50%;
          border: 1px solid rgba(26,26,46,0.12);
          background: #fff;
          color: #1a1a2e;
          cursor: pointer;
          box-shadow: 0 4px 14px rgba(16,24,40,0.14);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: opacity 0.2s ease, transform .15s ease, box-shadow .15s ease;
        }
        .feature-mini-arrow:hover {
          transform: scale(1.08);
          box-shadow: 0 6px 18px rgba(16,24,40,0.2);
        }
        @media (max-width: 768px) {
          .feature-showcase-row {
            flex-direction: column !important;
            gap: 24px !important;
            padding: 48px 20px !important;
          }
          .feature-text {
            order: 1 !important;
            text-align: center !important;
            align-items: center !important;
            display: flex !important;
            flex-direction: column !important;
          }
          .feature-media {
            order: 2 !important;
            width: 100% !important;
          }
          .feature-upload-desktop {
            display: none !important;
          }
          .feature-upload-mobile {
            display: block !important;
            order: 4 !important;
          }
          .feature-mini-arrows {
            justify-content: center !important;
          }
          /* Niente margine solo-sinistra su mobile (rompeva la simmetria).
             Card piu' strette del viewport cosi' la card successiva sbircia
             a destra (gutter sinistro 28 = 20 riga + 8 track). margin-bottom
             riserva lo spazio delle frecce (assolute, top:100%) + fiato sotto. */
          .feature-mini-root {
            margin-left: 0 !important;
            margin-bottom: 60px !important;
          }
          /* Sfonda il padding destro della riga (20px): la card che sbircia
             arriva fino al bordo schermo invece di lasciare un margine vuoto
             che sembra un taglio. width (non margin) perche' lo style inline
             mette width:100% e il box resterebbe fermo al bordo del padding. */
          .feature-mini-slider-outer {
            width: calc(100% + 20px) !important;
          }
          .feature-mini-card,
          .feature-mini-cta {
            flex: 0 0 calc(100vw - 72px) !important;
            max-width: calc(100vw - 72px) !important;
          }
          /* Video (9:16, strette): 2 colonne visibili su mobile invece di una. */
          .mini-video .feature-mini-card,
          .mini-video .feature-mini-cta {
            flex: 0 0 calc(50vw - 14px) !important;
            max-width: calc(50vw - 14px) !important;
          }
          /* Post: il template dentro e' scalato con zoom fisso a 300px (vedi
             renderCard). La card deve restare 300 su mobile o il template
             sfora e viene tagliato dall'overflow. */
          .mini-posts .feature-mini-card,
          .mini-posts .feature-mini-cta {
            flex: 0 0 300px !important;
            max-width: 300px !important;
          }
        }
        .feature-post-static * {
          animation: none !important;
          opacity: 1 !important;
        }
        /* @keyframes tplKB vive nel blocco di stile di SocialShowcase.tsx, montato
           solo quando gira il marquee. Qui renderizziamo i template (t.Component)
           senza il wrapper SocialShowcase, quindi va ridefinito o l'animazione
           sopra punta a un keyframe inesistente e non fa nulla. */
        @keyframes tplKB {
          0% { transform: scale(1); }
          100% { transform: scale(1.08); }
        }
        @keyframes featureMiniShimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes uploadWiggle {
          0%, 80% { transform: rotate(0deg); }
          84% { transform: rotate(-12deg); }
          88% { transform: rotate(10deg); }
          92% { transform: rotate(-8deg); }
          96% { transform: rotate(6deg); }
          100% { transform: rotate(0deg); }
        }
        .upload-wiggle {
          animation: uploadWiggle 3s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}
