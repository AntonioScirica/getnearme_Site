'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import RevealSection from './RevealSection';

interface PricingPlan {
  id: string;
  name: string;
  users: string;
  oldPrice: number;
  price: number;
  savingsYear: number;
  badge: string | null;
  popular: boolean;
  features: string[];
  extra: string | null;
  color: string;
  bg: string;
  cta: string;
  savingsLabel: string;
  freeLabel?: string;
  period?: string;
  priceNote?: string | null;
}

interface PricingCardProps {
  plan: PricingPlan;
  href: string;
  current?: boolean;
  // Piani agency seat-based: slider utenti (2-10) condiviso tra le card del tier.
  seats?: number;
  onSeatsChange?: (n: number) => void;
  // Piano Custom: CTA apre il popup di prenotazione Cal.com invece di andare al checkout.
  calLink?: string;
}

export default function PricingCard({ plan, href, current = false, seats, onSeatsChange, calLink }: PricingCardProps) {
  const [hovered, setHovered] = useState(false);

  const hasDiscount = plan.price > 0 && !!plan.oldPrice && plan.oldPrice > plan.price;
  const discountPct = hasDiscount ? Math.round((1 - plan.price / plan.oldPrice) * 100) : 0;
  const saved = hasDiscount ? Math.round(plan.oldPrice - plan.price) : 0;
  const periodLabel = plan.period ?? '/mese';
  // Tutti i numeri e le parole "illimitato/a/i/e" nelle feature in bold, non
  // solo i numeri che cambiano con lo slider Agenzia (⟦N⟧, vedi seatTokens in
  // HomepageClient) — stesso stile, applicato in modo uniforme a ogni piano.
  const renderFeatureText = (f: string) =>
    f.replace(/⟦(\d+)⟧/g, '$1').split(/(\d+|[Ii]llimitat[oaie])/).map((part, i) => (i % 2 === 1 ? <strong key={i} style={{ fontWeight: 700 }}>{part}</strong> : part));

  return (
    <RevealSection>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: current ? plan.bg : plan.popular ? plan.bg : '#fff',
          border: current ? `2px solid ${plan.color}` : plan.popular ? `1.5px solid ${plan.color}` : '1px solid rgba(26,26,46,0.10)',
          borderRadius: 18,
          padding: '36px 25px 29px',
          position: 'relative',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column' as const,
          boxShadow: hovered
            ? plan.popular
              ? `0 16px 40px ${plan.color}25`
              : '0 12px 32px rgba(59,131,246,0.12)'
            : plan.popular
              ? `0 8px 22px ${plan.color}26`
              : '0 6px 20px rgba(16,24,40,0.06)',
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        {(current || plan.badge) && (
          <div
            style={{
              position: 'absolute',
              top: -14,
              left: '50%',
              transform: 'translateX(-50%)',
              background: plan.color,
              color: '#fff',
              padding: '5px 18px',
              borderRadius: 18,
              fontSize: 11,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              whiteSpace: 'nowrap',
              border: '1px solid rgba(26,26,46,0.10)',
              boxShadow: '0 2px 10px rgba(16,24,40,0.06)',
            }}
          >
            {current ? 'Piano attuale' : plan.badge}
          </div>
        )}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: 23, fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>{plan.name}</h3>
          <div style={{ color: '#6b7280', fontSize: 13, fontWeight: 500 }}>{plan.users}</div>
          <div style={{ marginTop: 20, marginBottom: 7 }}>
            {/* Discount row — visible or invisible placeholder */}
            <div className="pricing-discount-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginBottom: 4, visibility: hasDiscount ? 'visible' : 'hidden' }}>
              <span style={{ color: '#6b7280', fontSize: 16, fontWeight: 700, textDecoration: 'line-through' }}>
                {hasDiscount ? `${plan.oldPrice}€` : '0€'}
              </span>
              <span style={{ background: '#3B83F6', color: '#fff', fontSize: 11, fontWeight: 700, padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(26,26,46,0.10)' }}>
                {hasDiscount ? `-${discountPct}%` : '-0%'}
              </span>
            </div>
            <span style={{ fontSize: 49, fontWeight: 800, color: plan.color, letterSpacing: -1 }}>
              {plan.price === 0 ? (plan.freeLabel ?? 'Gratis') : `${plan.price}€`}
            </span>
            {plan.price > 0 && <span style={{ color: '#6b7280', fontSize: 13, marginLeft: 4 }}>{periodLabel}</span>}
            {/* Savings row — visible or invisible placeholder */}
            <div className="pricing-savings-row" style={{ marginTop: 5, color: '#009874', fontSize: 12, fontWeight: 800, visibility: hasDiscount && !plan.priceNote ? 'visible' : 'hidden' }}>
              {hasDiscount && !plan.priceNote ? `${plan.savingsLabel} ${saved}€${periodLabel}` : ' '}
            </div>
            {plan.priceNote && (
              <div style={{ marginTop: 5, color: '#1a1a2e', fontSize: 13, fontWeight: 700 }}>
                {plan.priceNote}
              </div>
            )}
          </div>
        </div>
        {typeof seats === 'number' && onSeatsChange && (
          <div style={{ marginTop: 16, background: '#f8fafc', border: '1px solid rgba(26,26,46,0.08)', borderRadius: 13, padding: '13px 14px 11px' }}>
            <div style={{ marginBottom: 4 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#6b7280', letterSpacing: 0.2 }}>Collaboratori</span>
            </div>
            <div style={{ position: 'relative', paddingTop: 32 }}>
              <div style={{
                position: 'absolute',
                top: 0,
                left: `calc(${(seats - 2) / 8} * (100% - 22px) + 11px)`,
                transform: 'translateX(-50%)',
                background: plan.color,
                color: '#fff',
                fontSize: 12,
                fontWeight: 800,
                padding: '2px 9px',
                borderRadius: 7,
                boxShadow: `0 2px 8px ${plan.color}40`,
                pointerEvents: 'none',
                whiteSpace: 'nowrap',
              }}>
                {seats}
                <span style={{
                  position: 'absolute', left: '50%', bottom: -4, transform: 'translateX(-50%) rotate(45deg)',
                  width: 7, height: 7, background: plan.color, borderRadius: 1,
                }} />
              </div>
              <input
                type="range"
                min={2}
                max={10}
                step={1}
                value={seats}
                onChange={(e) => onSeatsChange(Number(e.target.value))}
                aria-label="Numero collaboratori"
                className="seat-slider"
                style={{
                  width: '100%',
                  ['--ss-color' as string]: plan.color,
                  background: `linear-gradient(to right, ${plan.color} ${((seats - 2) / 8) * 100}%, #e5e7eb ${((seats - 2) / 8) * 100}%)`,
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, fontWeight: 600, color: '#9ca3af', marginTop: 5 }}>
              <span>2</span>
              <span>10</span>
            </div>
            <style>{`
              .seat-slider {
                -webkit-appearance: none;
                appearance: none;
                height: 6px;
                border-radius: 999px;
                outline: none;
                cursor: pointer;
                display: block;
              }
              .seat-slider::-webkit-slider-thumb {
                -webkit-appearance: none;
                appearance: none;
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: #fff;
                border: 3px solid var(--ss-color, #2563EB);
                box-shadow: 0 2px 8px rgba(16,24,40,0.22);
                cursor: pointer;
                transition: transform .15s ease, box-shadow .15s ease;
              }
              .seat-slider::-webkit-slider-thumb:hover {
                transform: scale(1.12);
                box-shadow: 0 4px 14px rgba(16,24,40,0.28);
              }
              .seat-slider::-moz-range-thumb {
                width: 22px;
                height: 22px;
                border-radius: 50%;
                background: #fff;
                border: 3px solid var(--ss-color, #2563EB);
                box-shadow: 0 2px 8px rgba(16,24,40,0.22);
                cursor: pointer;
                transition: transform .15s ease;
              }
              .seat-slider::-moz-range-thumb:hover { transform: scale(1.12); }
              .seat-slider::-moz-range-track { background: transparent; }
            `}</style>
          </div>
        )}
        <div style={{ margin: '20px 0', borderTop: '1px dashed #e2e8f0' }} />
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 22px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: calLink ? 'flex-start' : 'flex-end' }}>
          {plan.features.map((f, i) => (
            <li
              key={i}
              className={f ? '' : 'pricing-spacer'}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 9,
                marginBottom: 11,
                color: '#444',
                fontSize: 13,
                lineHeight: 1.55,
                fontStyle: 'normal',
                ...(f ? {} : { visibility: 'hidden' as const }),
              }}
            >
              <Check size={16} strokeWidth={3} color={plan.color} style={{ flexShrink: 0, marginTop: 1 }} />
              <span>{f ? renderFeatureText(f) : ' '}</span>
            </li>
          ))}
        </ul>
        {plan.extra && (
          <div style={{ color: '#6b7280', fontSize: 11, marginBottom: 16, paddingLeft: 29 }}>{plan.extra}</div>
        )}
        <a
          href={calLink ? undefined : href}
          {...(calLink ? { 'data-cal-link': calLink, 'data-cal-config': '{"layout":"month_view"}' } : {})}
          className="neo-btn neo-cta-blue"
          style={{
            display: 'block',
            width: '100%',
            padding: '14px 0',
            background: plan.color,
            color: '#fff',
            border: 'none',
            borderRadius: 11,
            fontSize: 15,
            fontWeight: 700,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 10px rgba(16,24,40,0.10)',
            letterSpacing: 0.5,
            textAlign: 'center',
            textDecoration: 'none',
            boxSizing: 'border-box',
          }}
        >
          {current ? 'Vai alla dashboard' : plan.cta}
        </a>
        <style>{`
          @media (max-width: 768px) {
            .pricing-spacer { display: none !important; }
            .pricing-discount-row[style*="hidden"] { display: none !important; }
            .pricing-savings-row[style*="hidden"] { display: none !important; }
          }
        `}</style>
      </div>
    </RevealSection>
  );
}
