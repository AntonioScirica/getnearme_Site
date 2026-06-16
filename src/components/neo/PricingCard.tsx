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
}

export default function PricingCard({ plan, href }: PricingCardProps) {
  const [hovered, setHovered] = useState(false);

  const hasDiscount = plan.price > 0 && !!plan.oldPrice && plan.oldPrice > plan.price;
  const discountPct = hasDiscount ? Math.round((1 - plan.price / plan.oldPrice) * 100) : 0;
  const saved = hasDiscount ? plan.oldPrice - plan.price : 0;
  const periodLabel = plan.period ?? '/mese';

  return (
    <RevealSection>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: plan.popular ? plan.bg : '#fff',
          border: plan.popular ? `1.5px solid ${plan.color}` : '1px solid rgba(26,26,46,0.10)',
          borderRadius: 20,
          padding: '40px 28px 32px',
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
        {plan.badge && (
          <div
            style={{
              position: 'absolute',
              top: -15,
              left: '50%',
              transform: 'translateX(-50%)',
              background: plan.color,
              color: '#fff',
              padding: '6px 20px',
              borderRadius: 20,
              fontSize: 12,
              fontWeight: 800,
              textTransform: 'uppercase',
              letterSpacing: 1.2,
              whiteSpace: 'nowrap',
              border: '1px solid rgba(26,26,46,0.10)',
              boxShadow: '0 2px 10px rgba(16,24,40,0.06)',
            }}
          >
            {plan.badge}
          </div>
        )}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: 26, fontWeight: 800, color: '#1a1a2e', margin: '0 0 4px' }}>{plan.name}</h3>
          <div style={{ color: '#6b7280', fontSize: 14, fontWeight: 500 }}>{plan.users}</div>
          <div style={{ marginTop: 22, marginBottom: 8 }}>
            {/* Discount row — visible or invisible placeholder */}
            <div className="pricing-discount-row" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 4, visibility: hasDiscount ? 'visible' : 'hidden' }}>
              <span style={{ color: '#6b7280', fontSize: 18, fontWeight: 700, textDecoration: 'line-through' }}>
                {hasDiscount ? `${plan.oldPrice}€` : '0€'}
              </span>
              <span style={{ background: '#3B83F6', color: '#fff', fontSize: 12, fontWeight: 700, padding: '3px 9px', borderRadius: 999, border: '1px solid rgba(26,26,46,0.10)' }}>
                {hasDiscount ? `-${discountPct}%` : '-0%'}
              </span>
            </div>
            <span style={{ fontSize: 54, fontWeight: 800, color: plan.color, letterSpacing: -1 }}>
              {plan.price === 0 ? (plan.freeLabel ?? 'Gratis') : `${plan.price}€`}
            </span>
            {plan.price > 0 && <span style={{ color: '#6b7280', fontSize: 14, marginLeft: 4 }}>{periodLabel}</span>}
            {/* Savings row — visible or invisible placeholder */}
            <div className="pricing-savings-row" style={{ marginTop: 6, color: '#009874', fontSize: 13, fontWeight: 800, visibility: hasDiscount && !plan.priceNote ? 'visible' : 'hidden' }}>
              {hasDiscount && !plan.priceNote ? `${plan.savingsLabel} ${saved}€${periodLabel}` : ' '}
            </div>
            {plan.priceNote && (
              <div style={{ marginTop: 6, color: '#1a1a2e', fontSize: 14, fontWeight: 700 }}>
                {plan.priceNote}
              </div>
            )}
          </div>
        </div>
        <div style={{ margin: '22px 0', borderTop: '1px dashed #e2e8f0' }} />
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 24px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end' }}>
          {plan.features.map((f, i) => (
            <li
              key={i}
              className={f ? '' : 'pricing-spacer'}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: 12,
                color: '#444',
                fontSize: 14,
                lineHeight: 1.55,
                fontStyle: 'normal',
                ...(f ? {} : { visibility: 'hidden' as const }),
              }}
            >
              <span
                style={{
                  background: plan.color,
                  color: '#fff',
                  width: 22,
                  height: 22,
                  borderRadius: 7,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  marginTop: 1,
                  border: '1px solid rgba(26,26,46,0.10)',
                }}
              >
                <Check size={12} strokeWidth={3} />
              </span>
              {f || ' '}
            </li>
          ))}
        </ul>
        {plan.extra && (
          <div style={{ color: '#6b7280', fontSize: 12, marginBottom: 18, paddingLeft: 32 }}>{plan.extra}</div>
        )}
        <a
          href={href}
          className="neo-btn neo-cta-blue"
          style={{
            display: 'block',
            width: '100%',
            padding: '16px 0',
            background: plan.color,
            color: '#fff',
            border: 'none',
            borderRadius: 12,
            fontSize: 17,
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
          {plan.cta}
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
