'use client';

import { useState } from 'react';
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
}

interface PricingCardProps {
  plan: PricingPlan;
  onSelect: (id: string) => void;
}

export default function PricingCard({ plan, onSelect }: PricingCardProps) {
  const [hovered, setHovered] = useState(false);

  return (
    <RevealSection>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        style={{
          background: plan.popular ? plan.bg : '#fff',
          border: plan.popular ? `3px solid ${plan.color}` : '3px solid #1a1a2e',
          borderRadius: 20,
          padding: '40px 28px 32px',
          position: 'relative',
          maxWidth: 370,
          width: '100%',
          boxShadow: hovered
            ? plan.popular
              ? `8px 8px 0 ${plan.color}`
              : '8px 8px 0px #1a1a2e'
            : plan.popular
              ? `6px 6px 0 ${plan.color}`
              : '6px 6px 0px #1a1a2e',
          transform: hovered ? 'translate(-2px,-2px)' : 'translate(0,0)',
          transition: 'all 0.45s cubic-bezier(0.34,1.56,0.64,1)',
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
              border: '2px solid #1a1a2e',
              boxShadow: '3px 3px 0 #1a1a2e',
            }}
          >
            {plan.badge}
          </div>
        )}
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: 26, fontWeight: 900, color: '#1a1a2e', margin: '0 0 4px' }}>{plan.name}</h3>
          <div style={{ color: '#999', fontSize: 14, fontWeight: 500 }}>{plan.users}</div>
          <div style={{ marginTop: 22, marginBottom: 8 }}>
            <span style={{ color: '#bbb', textDecoration: 'line-through', fontSize: 18, marginRight: 8 }}>
              {plan.oldPrice}€
            </span>
            <span style={{ fontSize: 54, fontWeight: 900, color: plan.color, letterSpacing: -2 }}>
              {plan.price}€
            </span>
            <span style={{ color: '#999', fontSize: 14 }}>/mese</span>
          </div>
          <div
            style={{
              display: 'inline-block',
              background: plan.bg,
              color: plan.color,
              padding: '5px 14px',
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 800,
              border: `2px solid ${plan.color}44`,
            }}
          >
            {plan.savingsLabel} {plan.savingsYear}€/anno
          </div>
        </div>
        <div style={{ margin: '22px 0', borderTop: '2px dashed #e2e8f0' }} />
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 10px' }}>
          {plan.features.map((f, i) => (
            <li
              key={i}
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 10,
                marginBottom: 12,
                color: i === 0 && plan.id !== 'starter' ? '#aaa' : '#444',
                fontSize: 14,
                lineHeight: 1.55,
                fontStyle: i === 0 && plan.id !== 'starter' ? 'italic' : 'normal',
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
                  fontSize: 12,
                  flexShrink: 0,
                  marginTop: 1,
                  fontWeight: 900,
                  border: '2px solid #1a1a2e',
                }}
              >
                ✓
              </span>
              {f}
            </li>
          ))}
        </ul>
        {plan.extra && (
          <div style={{ color: '#bbb', fontSize: 12, marginBottom: 18, paddingLeft: 32 }}>{plan.extra}</div>
        )}
        <button
          onClick={() => onSelect(plan.id)}
          className="neo-btn"
          style={{
            width: '100%',
            padding: '16px 0',
            background: plan.color,
            color: '#fff',
            border: '3px solid #1a1a2e',
            borderRadius: 12,
            fontSize: 16,
            fontWeight: 800,
            cursor: 'pointer',
            transition: 'all 0.15s',
            boxShadow: '4px 4px 0px #1a1a2e',
            letterSpacing: 0.5,
          }}
        >
          {plan.cta}
        </button>
      </div>
    </RevealSection>
  );
}
