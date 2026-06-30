'use client';

const DEFAULT_PHOTO = 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=750&fit=crop';
const AC = '#2967EC';
const F = "'Poppins', sans-serif";

// Real data from preview.html
const D = {
  badge: 'NUOVO',
  price: '€ 1.850.000',
  title: 'Appartamento',
  address: 'Milano, Porta Nuova',
  desc: 'Informazioni organizzate per aiutarti a confrontare immobili e contesto in modo strutturato.',
  metrics: ['3', '2', '110 m²'],
  metricsInline: '3 camere | 2 bagni | 110 m²',
};

// Animation helper: returns inline style for looping entrance animation (8s cycle)
const aFI = (d: number): React.CSSProperties => ({ opacity: 0, animation: `tplFI 8s ease-in-out ${d}s infinite` });
const aSU = (d: number): React.CSSProperties => ({ opacity: 0, animation: `tplSU 8s ease-in-out ${d}s infinite` });

/* ── Shared ── */

// Badge variants matching real CSS: .tpl-badge { padding:14px 24px, radius:8, fontSize:24, fontWeight:700, uppercase }
// Scaled from 1080→160 ≈ 0.148x
function Badge({ variant = 'white', style }: { variant?: 'white' | 'blue' | 'outline'; style?: React.CSSProperties }) {
  const base: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
    padding: '2.5px 5px', borderRadius: 1.5, fontSize: 5, fontWeight: 700,
    textTransform: 'uppercase' as const, letterSpacing: 0.2, whiteSpace: 'nowrap' as const,
    fontFamily: F, lineHeight: 1,
  };
  const variants: Record<string, React.CSSProperties> = {
    white: { background: '#fff', color: AC },
    blue: { background: AC, color: '#fff' },
    outline: { background: 'transparent', color: '#fff', border: '0.5px solid #fff' },
  };
  return <div style={{ ...base, ...variants[variant], ...style }}>{D.badge}</div>;
}

// Real SVG icons from GetNearMe/sidepanel/templates/icons.js
function IconBed({ size = 6, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8"/><path d="M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4"/><path d="M12 4v6"/><path d="M2 18h20"/>
    </svg>
  );
}
function IconBath({ size = 6, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 5 L 7.621 3.621A2.121 2.121 0 0 0 4 5v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5"/><path d="M2 12h20"/><path d="M10 4 L 8 6"/><path d="M7 19v2"/><path d="M17 19v2"/>
    </svg>
  );
}
function IconArea({ size = 6, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 3h6v6"/><path d="M9 21H3v-6"/><path d="M21 3l-7 7"/><path d="M3 21l7-7"/>
    </svg>
  );
}
function IconPin({ size = 4, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/>
    </svg>
  );
}

const METRIC_ICONS = [IconBed, IconBath, IconArea];

function Img({ src }: { src: string }) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover' }} />;
}

function Address({ color = 'rgba(255,255,255,0.8)' }: { color?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 2, fontFamily: F }}>
      <IconPin size={4} color={color} />
      <span style={{ fontSize: 4, color, fontWeight: 500 }}>{D.address}</span>
    </div>
  );
}

// Glass metric cards: value on top, icon below, no labels (matching real templates)
function GlassMetrics({ iconColor = '#fff', valueColor = '#fff', border = '0.5px solid rgba(255,255,255,0.35)', bg = 'rgba(255,255,255,0.12)' }: { iconColor?: string; valueColor?: string; border?: string; bg?: string }) {
  return (
    <div style={{ display: 'flex', gap: 2, width: '100%' }}>
      {D.metrics.map((v, i) => {
        const Icon = METRIC_ICONS[i];
        return (
          <div key={i} style={{
            flex: 1, background: bg, border,
            backdropFilter: 'blur(8px)', borderRadius: 3, padding: '4% 0', display: 'flex',
            flexDirection: 'column', alignItems: 'center', gap: 3, color: valueColor, fontFamily: F,
            minHeight: 22,
          }}>
            <span style={{ fontSize: 6, fontWeight: 400 }}>{v}</span>
            <Icon size={5} color={iconColor} />
          </div>
        );
      })}
    </div>
  );
}

/* ── Gradient: glass panels over photo, dark gradient — ANIMATED ── */
function TplGradient({ photo, bd = 0 }: { photo: string; bd?: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', fontFamily: F, overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'tplKB 10s ease-in-out infinite alternate' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.8) 100%)', ...aFI(bd + 0.2) }} />
      <div style={{ position: 'absolute', inset: 0, padding: '4.5%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 2 }}>
        <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '0.5px solid rgba(255,255,255,0.25)', borderRadius: 4, padding: '5%', position: 'relative', ...aSU(bd + 0.5) }}>
          <Badge variant="white" style={{ position: 'absolute', top: '12%', left: '5%' }} />
          <div style={{ marginTop: 20, fontSize: 9, fontWeight: 600, color: '#fff', lineHeight: 1.2 }}>{D.title}</div>
          <div style={{ marginTop: 2 }}><Address /></div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 4 }}>{D.price}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
          <div style={aSU(bd + 1.0)}><GlassMetrics /></div>
          <div style={{ background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(12px)', border: '0.5px solid rgba(255,255,255,0.25)', borderRadius: 4, padding: '4%', ...aSU(bd + 1.2) }}>
            <div style={{ fontSize: 4, color: '#fff', lineHeight: 1.4 }}>{D.desc}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Blue: radial gradient from top-right, content bottom-left — ANIMATED ── */
function TplBlue({ photo, bd = 0 }: { photo: string; bd?: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', fontFamily: F, overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'tplKB 10s ease-in-out infinite alternate' }} />
      <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(ellipse at 86% 9%, rgba(41,103,236,0) 0%, rgba(41,103,236,0.8) 50%, rgba(41,103,236,0.8) 100%)`, ...aFI(bd + 0.2) }} />
      <Badge variant="blue" style={{ position: 'absolute', top: '5%', right: '5%', zIndex: 3, ...aFI(bd + 0.4) }} />
      <div style={{ position: 'absolute', inset: 0, padding: '5%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', zIndex: 2 }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', ...aSU(bd + 0.6) }}>{D.price}</div>
        <div style={{ marginTop: 2, ...aSU(bd + 0.8) }}><Address /></div>
        <div style={{ marginTop: 5, ...aSU(bd + 1.0) }}><GlassMetrics /></div>
        <div style={{ fontSize: 7.5, fontWeight: 600, color: '#fff', marginTop: 5, lineHeight: 1.3, ...aSU(bd + 1.2) }}>{D.title}</div>
        <div style={{ fontSize: 4, color: '#fff', lineHeight: 1.4, marginTop: 2, ...aFI(bd + 1.4) }}>{D.desc}</div>
        <div style={{ marginTop: 4, background: '#fff', color: AC, borderRadius: 3, padding: '2.5px 8px', display: 'inline-flex', alignItems: 'center', gap: 2, alignSelf: 'flex-start', ...aSU(bd + 1.6) }}>
          <span style={{ fontSize: 5, fontWeight: 600 }}>Contattaci ora</span>
          <svg width={4} height={4} viewBox="0 0 24 24" fill="none" stroke={AC} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </div>
      </div>
    </div>
  );
}

/* ── Diagonal: accent triangle clip-path, bottom gradient — ANIMATED ── */
function TplDiagonal({ photo, bd = 0 }: { photo: string; bd?: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', fontFamily: F, overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'tplKB 10s ease-in-out infinite alternate' }} />
      {/* Accent triangle */}
      <div style={{ position: 'absolute', inset: 0, background: AC, clipPath: 'polygon(0 0, 100% 0, 100% 25%, 0 55%)', zIndex: 1, ...aFI(bd + 0.1) }} />
      {/* Bottom gradient */}
      <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to bottom, transparent, rgba(0,0,0,0.9))', zIndex: 1, ...aFI(bd + 0.2) }} />
      <div style={{ position: 'absolute', inset: 0, padding: '5%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 2 }}>
        <div>
          <div style={aSU(bd + 0.3)}><Badge variant="white" style={{ marginBottom: 4 }} /></div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', ...aSU(bd + 0.5) }}>{D.price}</div>
          <div style={{ fontSize: 7.5, fontWeight: 600, color: '#fff', marginTop: 3, lineHeight: 1.2, maxWidth: '60%', ...aSU(bd + 0.7) }}>{D.title}</div>
          <div style={{ marginTop: 2, ...aSU(bd + 0.9) }}><Address /></div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <div style={aSU(bd + 1.1)}><GlassMetrics /></div>
          <div style={{ fontSize: 4, color: '#fff', lineHeight: 1.4, ...aFI(bd + 1.3) }}>{D.desc}</div>
        </div>
      </div>
    </div>
  );
}

/* ── Centered: dark overlay 60%, everything centered — ANIMATED ── */
function TplCentered({ photo, bd = 0 }: { photo: string; bd?: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', fontFamily: F, overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'tplKB 10s ease-in-out infinite alternate' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', ...aFI(bd + 0.1) }} />
      <div style={{ position: 'absolute', inset: 0, padding: '5%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', textAlign: 'center', zIndex: 2 }}>
        <div style={aFI(bd + 0.3)}><Badge variant="white" /></div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', ...aSU(bd + 0.5) }}>{D.price}</div>
          <div style={{ fontSize: 7, fontWeight: 600, color: '#fff', marginTop: 2, ...aSU(bd + 0.7) }}>{D.title}</div>
          <div style={{ marginTop: 5, ...aSU(bd + 0.9) }}><GlassMetrics /></div>
          <div style={{ fontSize: 4, color: '#fff', lineHeight: 1.4, marginTop: 4, ...aFI(bd + 1.1) }}>{D.desc}</div>
        </div>
        <div style={aSU(bd + 1.3)}><Address /></div>
      </div>
    </div>
  );
}

/* ── Card: top bar price+badge, white bottom panel rounded — ANIMATED ── */
function TplCard({ photo, bd = 0 }: { photo: string; bd?: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', fontFamily: F, overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'tplKB 10s ease-in-out infinite alternate' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 53%, rgba(0,0,0,0.8) 100%)', ...aFI(bd + 0.1) }} />
      {/* Top bar: price left + badge right */}
      <div style={{ position: 'absolute', top: '5%', left: '5%', right: '5%', display: 'flex', justifyContent: 'space-between', zIndex: 3, ...aSU(bd + 0.3) }}>
        <div style={{ background: '#fff', borderRadius: 3, padding: '2.5px 6px', display: 'flex', alignItems: 'center' }}>
          <span style={{ fontSize: 8, fontWeight: 600, color: '#000' }}>{D.price}</span>
        </div>
        <Badge variant="blue" style={{ borderRadius: 3, padding: '2.5px 8px', fontSize: 6 }} />
      </div>
      {/* White bottom panel */}
      <div style={{ position: 'absolute', bottom: '5%', left: '5%', right: '5%', background: '#fff', borderRadius: 3, padding: '5% 8%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 2, ...aSU(bd + 0.6) }}>
        <div style={{ fontSize: 7, fontWeight: 600, color: '#000' }}>{D.title}</div>
        <div style={{ marginTop: 3 }}><Address color="#6b7280" /></div>
        <div style={{ display: 'flex', gap: 3, marginTop: 7, width: '100%' }}>
          {D.metrics.map((v, i) => {
            const Icon = METRIC_ICONS[i];
            return (
              <div key={i} style={{ flex: 1, border: '0.5px solid #ccc', borderRadius: 3, padding: '4% 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                <span style={{ fontSize: 6, fontWeight: 400, color: '#000' }}>{v}</span>
                <Icon size={5} color="#000" />
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 4, color: '#6e6e6e', marginTop: 7, lineHeight: 1.4 }}>{D.desc}</div>
      </div>
    </div>
  );
}

/* ── Elegant: dark gradient overlay, badge outline, content bottom — ANIMATED ── */
function TplElegant({ photo, bd = 0 }: { photo: string; bd?: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', fontFamily: F, overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'tplKB 10s ease-in-out infinite alternate' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 53%, rgba(0,0,0,0.8) 100%)', ...aFI(bd + 0.2) }} />
      <div style={{ position: 'absolute', inset: 0, padding: '5%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', zIndex: 2 }}>
        {/* Badge outline at top — inline left */}
        <Badge variant="outline" style={{ fontWeight: 400, alignSelf: 'flex-start', ...aFI(bd + 0.4) }} />
        {/* Bottom content */}
        <div>
          <div style={{ fontSize: 7, fontWeight: 400, color: '#fff', lineHeight: 1.3, ...aSU(bd + 0.6) }}>{D.title}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#fff', marginTop: 4, ...aSU(bd + 0.8) }}>{D.price}</div>
          <div style={{ width: '100%', height: 0.5, background: 'rgba(255,255,255,0.3)', margin: '6px 0', ...aFI(bd + 1.0) }} />
          <div style={{ fontSize: 5, color: '#fff', fontWeight: 400, ...aSU(bd + 1.2) }}>{D.metricsInline}</div>
        </div>
      </div>
    </div>
  );
}

/* ── TopBar: white panel centered, badge overlapping top edge — ANIMATED ── */
function TplTopbar({ photo, bd = 0 }: { photo: string; bd?: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', fontFamily: F, overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'tplKB 10s ease-in-out infinite alternate' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 53%, rgba(0,0,0,0.8) 100%)', ...aFI(bd + 0.1) }} />
      {/* White panel */}
      <div style={{
        position: 'absolute', top: '14.4%', bottom: '14.4%', left: '7%', right: '7%',
        background: '#fff', borderRadius: 4, display: 'flex', flexDirection: 'column',
        alignItems: 'center', padding: '10% 6% 7%', textAlign: 'center', zIndex: 2,
        overflow: 'hidden', boxSizing: 'border-box', ...aSU(bd + 0.4),
      }}>
        <div style={{ fontSize: 15, fontWeight: 600, color: '#000', marginTop: 5 }}>{D.price}</div>
        <div style={{ fontSize: 7, fontWeight: 600, color: '#000', marginTop: 3 }}>{D.title}</div>
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
          <div style={{ display: 'flex', gap: 2, width: '100%' }}>
            {D.metrics.map((v, i) => {
              const Icon = METRIC_ICONS[i];
              return (
                <div key={i} style={{ flex: 1, border: '0.5px solid #ccc', borderRadius: 3, padding: '3% 0', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <span style={{ fontSize: 6, fontWeight: 400, color: '#000' }}>{v}</span>
                  <Icon size={5} color="#000" />
                </div>
              );
            })}
          </div>
          <div style={{ fontSize: 4, color: '#6e6e6e', marginTop: 5, lineHeight: 1.4 }}>{D.desc}</div>
        </div>
        <Address color="#000" />
      </div>
      {/* Badge overlapping top edge of panel */}
      <Badge variant="blue" style={{ position: 'absolute', top: 'calc(14.4% - 4%)', left: '50%', transform: 'translateX(-50%)', zIndex: 3, borderRadius: 3, padding: '2.5px 10px', fontSize: 6, ...aFI(bd + 0.2) }} />
    </div>
  );
}

/* ── Clean: glass top bar (address+badge), metric pills + title bottom — ANIMATED ── */
function TplClean({ photo, bd = 0 }: { photo: string; bd?: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', fontFamily: F, overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'tplKB 10s ease-in-out infinite alternate' }} />
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 53%, rgba(0,0,0,0.8) 100%)', ...aFI(bd + 0.1) }} />
      {/* Glass top bar */}
      <div style={{
        position: 'absolute', top: '4.7%', left: '5.9%', right: '5.9%',
        height: 14,
        background: 'rgba(255,255,255,0.2)', borderRadius: 3, border: '0.5px solid #fff',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '0 2px 0 3.5px', boxSizing: 'border-box', zIndex: 2, ...aSU(bd + 0.3),
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, overflow: 'hidden', flex: 1, minWidth: 0 }}>
          <IconPin size={3.5} color="#fff" />
          <span style={{ fontSize: 4, color: '#fff', fontWeight: 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{D.address}</span>
        </div>
        <Badge variant="white" style={{ marginLeft: 2, flexShrink: 0, borderRadius: 2, padding: '1.5px 4px', fontSize: 4.5 }} />
      </div>
      {/* Bottom: metric pills + title */}
      <div style={{ position: 'absolute', bottom: '5%', left: '5.9%', right: '5.9%', zIndex: 2 }}>
        <div style={{ display: 'flex', gap: 3, ...aSU(bd + 0.6) }}>
          {D.metrics.map((v, i) => {
            const Icon = METRIC_ICONS[i];
            return (
              <div key={i} style={{
                height: 12.5,
                background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(10px)',
                borderRadius: 3, border: '0.5px solid rgba(255,255,255,0.3)',
                padding: '0 4px', display: 'flex', alignItems: 'center', gap: 2,
              }}>
                <Icon size={4.5} color="#fff" />
                <span style={{ fontSize: 5.5, color: '#fff', fontWeight: 400, whiteSpace: 'nowrap' }}>{v}</span>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 9, fontWeight: 600, color: '#fff', marginTop: 4, lineHeight: 1.2, ...aSU(bd + 0.9) }}>{D.title}</div>
      </div>
    </div>
  );
}

/* ── Fade: horizontal accent gradient left→transparent, content left — ANIMATED ── */
function TplFade({ photo, bd = 0 }: { photo: string; bd?: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', fontFamily: F, overflow: 'hidden' }}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={photo} alt="" loading="lazy" decoding="async" style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', objectFit: 'cover', animation: 'tplKB 10s ease-in-out infinite alternate' }} />
      <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(90deg, ${AC} 0%, ${AC}CC 35%, transparent 70%)`, ...aFI(bd + 0.1) }} />
      {/* Badge top-left */}
      <Badge variant="white" style={{ position: 'absolute', top: '5%', left: '5%', zIndex: 3, ...aFI(bd + 0.3) }} />
      {/* Content bottom-left */}
      <div style={{ position: 'absolute', bottom: '5%', left: '5%', maxWidth: '50%', zIndex: 2 }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: '#fff', ...aSU(bd + 0.5) }}>{D.price}</div>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#fff', marginTop: 2, lineHeight: 1.2, ...aSU(bd + 0.7) }}>{D.title}</div>
        <div style={{ marginTop: 2, ...aSU(bd + 0.9) }}><Address /></div>
        <div style={{ fontSize: 4, color: 'rgba(255,255,255,0.85)', marginTop: 3, lineHeight: 1.3, ...aFI(bd + 1.1) }}>{D.desc}</div>
        <div style={{ marginTop: 4, border: '0.5px solid rgba(255,255,255,0.7)', borderRadius: 10, padding: '3px 6px', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%', boxSizing: 'border-box', ...aSU(bd + 1.3) }}>
          <span style={{ fontSize: 4, color: '#fff', letterSpacing: 0.5, textAlign: 'center', whiteSpace: 'nowrap' }}>{D.metricsInline}</span>
        </div>
      </div>
    </div>
  );
}

/* ── Arch: white top, accent band bottom, arch-shaped photo — ANIMATED ── */
function TplArch({ photo, bd = 0 }: { photo: string; bd?: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', fontFamily: F, background: '#fff', overflow: 'hidden', border: '1px solid #d1d5db', borderRadius: 8, boxSizing: 'border-box' }}>
      {/* Accent band bottom 50% */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '40%', background: AC, ...aFI(bd + 0.1) }} />
      {/* Top text section centered */}
      <div style={{ position: 'absolute', top: '5%', left: '5%', right: '5%', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', zIndex: 2 }}>
        <div style={aFI(bd + 0.2)}><Badge variant="blue" /></div>
        <div style={{ fontSize: 9, fontWeight: 700, color: '#1C1C1C', marginTop: 3, lineHeight: 1.15, ...aSU(bd + 0.4) }}>{D.title}</div>
        <div style={{ fontSize: 8, fontWeight: 700, color: AC, marginTop: 3, ...aSU(bd + 0.6) }}>{D.price}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 3, marginTop: 4, ...aSU(bd + 0.8) }}>
          {D.metrics.map((v, i) => {
            const Icon = METRIC_ICONS[i];
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                {i > 0 && <div style={{ width: 0.5, height: 6, background: '#ccc' }} />}
                <Icon size={4} color="#444" />
                <span style={{ fontSize: 5, color: '#444', fontWeight: 500 }}>{v}</span>
              </div>
            );
          })}
        </div>
        <div style={{ fontSize: 4, color: '#666', marginTop: 3, lineHeight: 1.35, ...aFI(bd + 1.0) }}>{D.desc}</div>
        <div style={aSU(bd + 1.2)}><Address color="#999" /></div>
      </div>
      {/* Arch photo — flush to bottom edge */}
      <div style={{
        position: 'absolute', bottom: -1, left: '50%', transform: 'translateX(-50%)',
        width: '74%', height: '45%', borderRadius: '999px 999px 0 0', overflow: 'hidden', zIndex: 1,
      }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transformOrigin: 'center bottom', animation: 'tplKB 10s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: '60%', background: 'linear-gradient(to top, rgba(0,0,0,0.6), transparent)', pointerEvents: 'none' }} />
      </div>
    </div>
  );
}

/* ── Split: 50/50 left accent panel + right photo — ANIMATED ── */
function TplSplit({ photo, bd = 0 }: { photo: string; bd?: number }) {
  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', display: 'flex', fontFamily: F, overflow: 'hidden' }}>
      {/* Left accent panel */}
      <div style={{ width: '50%', background: AC, padding: '5%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', overflow: 'hidden' }}>
        <div>
          <div style={aFI(bd + 0.3)}><Badge variant="blue" style={{ background: 'rgba(255,255,255,0.2)', marginBottom: 3 }} /></div>
          <div style={{ fontSize: 10, fontWeight: 700, color: '#fff', marginTop: 2, ...aSU(bd + 0.5) }}>{D.price}</div>
        </div>
        <div>
          <div style={{ fontSize: 7, fontWeight: 600, color: '#fff', lineHeight: 1.3, ...aSU(bd + 0.7) }}>{D.title}</div>
          <div style={{ marginTop: 2, ...aSU(bd + 0.9) }}><Address /></div>
          <div style={{ width: '100%', height: 0.5, background: 'rgba(255,255,255,0.2)', margin: '3px 0', ...aFI(bd + 1.0) }} />
          <div style={{ fontSize: 4, color: 'rgba(255,255,255,0.7)', lineHeight: 1.4, ...aFI(bd + 1.1) }}>{D.desc}</div>
        </div>
        <div style={{ display: 'flex', gap: 1.5, ...aSU(bd + 1.3) }}>
          {D.metrics.map((v, i) => {
            const Icon = METRIC_ICONS[i];
            return (
              <div key={i} style={{ background: 'rgba(255,255,255,0.12)', border: '0.5px solid rgba(255,255,255,0.2)', borderRadius: 2, padding: '2.5% 3%', display: 'flex', alignItems: 'center', gap: 2 }}>
                <Icon size={4} color="#fff" />
                <span style={{ fontSize: 5, color: '#fff', fontWeight: 400 }}>{v}</span>
              </div>
            );
          })}
        </div>
      </div>
      {/* Right photo + accent line */}
      <div style={{ width: '50%', position: 'relative', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photo} alt="" loading="lazy" decoding="async" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', animation: 'tplKB 10s ease-in-out infinite alternate' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, width: 1, height: '100%', background: AC }} />
      </div>
    </div>
  );
}

const PHOTOS = [
  'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&h=750&fit=crop',   // villa moderna
  'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=600&h=750&fit=crop',   // soggiorno luminoso
  'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=600&h=750&fit=crop',   // casa piscina
  'https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=600&h=750&fit=crop',   // cucina moderna
  'https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=600&h=750&fit=crop',      // living room
  'https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=600&h=750&fit=crop',   // villa lusso
  'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=600&h=750&fit=crop',   // esterno casa
  'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=600&h=750&fit=crop',   // casa moderna
  'https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=600&h=750&fit=crop',   // facciata
  'https://images.unsplash.com/photo-1605276374104-dee2a0ed3cd6?w=600&h=750&fit=crop',   // terrazzo
  'https://images.unsplash.com/photo-1600573472550-8090b5e0745e?w=600&h=750&fit=crop',   // giardino
];

const ALL_TEMPLATES: { name: string; Component: React.FC<{ photo: string; bd?: number }>; bd: number; photo: string }[] = [
  { name: 'Gradient', Component: TplGradient, bd: 0, photo: PHOTOS[0] },
  { name: 'Blue', Component: TplBlue, bd: 0.8, photo: PHOTOS[1] },
  { name: 'Diagonal', Component: TplDiagonal, bd: 1.6, photo: PHOTOS[2] },
  { name: 'Centered', Component: TplCentered, bd: 2.4, photo: PHOTOS[3] },
  { name: 'Card', Component: TplCard, bd: 3.2, photo: PHOTOS[4] },
  { name: 'Elegant', Component: TplElegant, bd: 4.0, photo: PHOTOS[5] },
  { name: 'TopBar', Component: TplTopbar, bd: 4.8, photo: PHOTOS[6] },
  { name: 'Clean', Component: TplClean, bd: 5.6, photo: PHOTOS[7] },
  { name: 'Fade', Component: TplFade, bd: 6.4, photo: PHOTOS[8] },
  { name: 'Arch', Component: TplArch, bd: 7.2, photo: PHOTOS[9] },
  { name: 'Split', Component: TplSplit, bd: 8.0, photo: PHOTOS[10] },
];

function TemplateCard({ Component, photo, bd }: { Component: React.FC<{ photo: string; bd?: number }>; photo: string; bd?: number }) {
  return (
    <div style={{ width: '100%', aspectRatio: '1 / 1.25', borderRadius: 8, overflow: 'hidden', flexShrink: 0, boxShadow: '0 2px 8px rgba(0,0,0,0.15)' }}>
      <div style={{ width: '100%', height: '100%', position: 'relative' }}>
        <Component photo={photo} bd={bd} />
      </div>
    </div>
  );
}

export default function SocialShowcase({ photo = DEFAULT_PHOTO }: { photo?: string }) {
  const col1 = ALL_TEMPLATES.filter((_, i) => i % 3 === 0);
  const col2 = ALL_TEMPLATES.filter((_, i) => i % 3 === 1);
  const col3 = ALL_TEMPLATES.filter((_, i) => i % 3 === 2);
  const colA = ALL_TEMPLATES.filter((_, i) => i % 2 === 0);
  const colB = ALL_TEMPLATES.filter((_, i) => i % 2 === 1);

  return (
    <div className="social-showcase-wrap" style={{ width: '100%', aspectRatio: '16 / 10', position: 'relative', overflow: 'hidden' }}>
      {/* Desktop: 3 columns */}
      <div className="social-cols-desktop" style={{ display: 'flex', gap: 10, height: '100%', justifyContent: 'center', padding: '0 16px' }}>
        {[col1, col2, col3].map((col, ci) => (
          <div key={ci} style={{ overflow: 'hidden', height: '100%', position: 'relative', flex: '1 1 0', maxWidth: 160, minWidth: 0 }}>
            <div className={ci % 2 === 0 ? 'social-marquee-up' : 'social-marquee-down'} style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[...col, ...col].map((t, i) => (
                <TemplateCard key={`${t.name}-${i}`} Component={t.Component} photo={photo !== DEFAULT_PHOTO ? photo : t.photo} bd={t.bd} />
              ))}
            </div>
          </div>
        ))}
      </div>
      {/* Mobile: 2 columns */}
      <div className="social-cols-mobile" style={{ display: 'none', gap: 8, height: '100%', justifyContent: 'center', padding: '0 12px' }}>
        {[colA, colB].map((col, ci) => (
          <div key={ci} style={{ overflow: 'hidden', height: '100%', position: 'relative', flex: '1 1 0', minWidth: 0 }}>
            <div className={ci % 2 === 0 ? 'social-marquee-up' : 'social-marquee-down'} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[...col, ...col].map((t, i) => (
                <TemplateCard key={`${t.name}-${i}`} Component={t.Component} photo={photo !== DEFAULT_PHOTO ? photo : t.photo} bd={t.bd} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Fade overlays */}
      <div className="social-fade-top" style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 40, background: 'linear-gradient(to bottom, #ffffff, transparent)', zIndex: 2, pointerEvents: 'none' }} />
      <div className="social-fade-bottom" style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 50, background: 'linear-gradient(to top, #ffffff, transparent)', zIndex: 2, pointerEvents: 'none' }} />

      <style>{`
        @keyframes marquee-up { 0% { transform: translateY(0); } 100% { transform: translateY(-50%); } }
        @keyframes marquee-down { 0% { transform: translateY(-50%); } 100% { transform: translateY(0); } }
        .social-marquee-up { animation: marquee-up 30s linear infinite; }
        .social-marquee-down { animation: marquee-down 30s linear infinite; }

        @media (max-width: 768px) {
          .social-showcase-wrap { aspect-ratio: 16 / 10 !important; }
          .social-cols-desktop { display: none !important; }
          .social-cols-mobile { display: flex !important; }
          .social-fade-top { height: 20px !important; }
          .social-fade-bottom { height: 25px !important; }
        }

        @keyframes tplKB { 0% { transform: scale(1); } 100% { transform: scale(1.08); } }
        @keyframes tplSU {
          0% { opacity: 0; transform: translateY(12px); }
          8% { opacity: 1; transform: translateY(0); }
          72% { opacity: 1; transform: translateY(0); }
          84% { opacity: 0; transform: translateY(-5px); }
          100% { opacity: 0; }
        }
        @keyframes tplFI {
          0% { opacity: 0; }
          8% { opacity: 1; }
          72% { opacity: 1; }
          84% { opacity: 0; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
