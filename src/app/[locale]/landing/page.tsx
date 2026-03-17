'use client';

import { useState, useRef } from 'react';
import CountdownTimer from '@/components/neo/CountdownTimer';
import SocialPopup from '@/components/neo/SocialPopup';
import NeoFAQItem from '@/components/neo/NeoFAQItem';
import TestimonialCard from '@/components/neo/TestimonialCard';
import PricingCard from '@/components/neo/PricingCard';
import ProgressBar from '@/components/neo/ProgressBar';
import RevealSection from '@/components/neo/RevealSection';

/* We need to import translations client-side */
import { translations } from '@/lib/translations';
import { type Locale } from '@/lib/i18n';
import { useParams } from 'next/navigation';

function FeatureCard({
  f,
  index,
}: {
  f: { num: string; title: string; desc: string; icon: string; color: string };
  index: number;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <RevealSection delay={index * 70}>
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="neo-border"
        style={{
          background: '#fff',
          borderRadius: 16,
          padding: '28px 24px',
          boxShadow: hovered ? '8px 8px 0px #1a1a2e' : '6px 6px 0px #1a1a2e',
          transform: hovered ? 'translate(-2px,-4px)' : 'translate(0,0)',
          transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          cursor: 'default',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
          <span
            style={{
              fontSize: 24,
              width: 50,
              height: 50,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              background: `${f.color}15`,
              borderRadius: 14,
              border: `2px solid ${f.color}40`,
            }}
          >
            {f.icon}
          </span>
          <span
            style={{
              fontFamily: 'monospace',
              color: f.color,
              fontSize: 13,
              fontWeight: 800,
              background: `${f.color}12`,
              padding: '2px 8px',
              borderRadius: 6,
            }}
          >
            {f.num}
          </span>
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px', lineHeight: 1.3 }}>
          {f.title}
        </h3>
        <p style={{ color: '#888', fontSize: 14, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
      </div>
    </RevealSection>
  );
}

function StepCard({
  s,
  index,
}: {
  s: { step: string; title: string; desc: string; color: string; bg: string; emoji: string };
  index: number;
}) {
  return (
    <RevealSection delay={index * 150}>
      <div
        className="neo-border neo-shadow"
        style={{
          textAlign: 'center',
          flex: '1 1 220px',
          maxWidth: 300,
          background: s.bg,
          borderRadius: 16,
          padding: '32px 24px',
        }}
      >
        <div style={{ fontSize: 36, marginBottom: 12 }}>{s.emoji}</div>
        <div
          style={{
            display: 'inline-flex',
            width: 44,
            height: 44,
            borderRadius: 12,
            background: s.color,
            color: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 900,
            fontSize: 20,
            border: '2px solid #1a1a2e',
            boxShadow: '3px 3px 0 #1a1a2e',
            marginBottom: 16,
          }}
        >
          {s.step}
        </div>
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' }}>{s.title}</h3>
        <p style={{ color: '#999', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
      </div>
    </RevealSection>
  );
}

export default function LandingPage() {
  const params = useParams();
  const locale = (params?.locale as string) || 'it';
  const t = translations[locale as Locale] || translations.it;
  const l = t.landing;

  const pricingRef = useRef<HTMLElement>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const scrollToPricing = () => pricingRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const selectPlan = (id: string) => {
    setSelectedPlan(id);
    setShowModal(true);
  };

  const selectedPlanData = l.pricing.plans.find((p: { id: string }) => p.id === selectedPlan);
  const W = { maxWidth: 1160, margin: '0 auto', padding: '0 24px' };

  return (
    <div style={{ background: '#fafaf8', color: '#1a1a2e', minHeight: '100vh', overflowX: 'hidden' }}>
      {/* Top Bar */}
      <div
        style={{
          background: '#1a1a2e',
          color: '#fff',
          padding: '11px 16px',
          textAlign: 'center',
          fontSize: 13,
          fontWeight: 600,
          position: 'sticky',
          top: 0,
          zIndex: 1000,
          borderBottom: '3px solid #f59e0b',
        }}
      >
        <span>
          🔥 {l.topBar.promo} <span style={{ color: '#f59e0b' }}>{l.topBar.discount}</span>
        </span>
        <span style={{ margin: '0 8px' }}>— {l.topBar.expiresIn}</span>
        <CountdownTimer />
        <span style={{ marginLeft: 8, color: '#34d399' }}>— {l.topBar.freeTrialShort}</span>
      </div>

      {/* Hero */}
      <section style={{ padding: '80px 0 70px', background: '#fafaf8', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: 20, right: -80, width: 240, height: 240, background: '#fef3c7', borderRadius: '50%', opacity: 0.5, border: '3px solid #fcd34d' }} />
        <div style={{ position: 'absolute', top: 180, right: 100, width: 90, height: 90, background: '#dbeafe', borderRadius: 18, opacity: 0.5, border: '3px solid #93c5fd', transform: 'rotate(12deg)' }} />
        <div style={{ position: 'absolute', bottom: 20, left: -50, width: 160, height: 160, background: '#fce7f3', borderRadius: 24, opacity: 0.4, border: '3px solid #f9a8d4', transform: 'rotate(-8deg)' }} />
        <div style={W}>
          <div
            style={{
              display: 'inline-block',
              background: '#fffbeb',
              border: '2px solid #f59e0b',
              borderRadius: 20,
              padding: '7px 18px',
              fontSize: 13,
              fontWeight: 700,
              color: '#b45309',
              marginBottom: 28,
              boxShadow: '3px 3px 0 #f59e0b40',
            }}
          >
            ⚡ {l.hero.badge}
          </div>
          <h1
            style={{
              fontSize: 'clamp(40px, 7vw, 72px)',
              fontWeight: 900,
              lineHeight: 1.05,
              margin: '0 0 22px',
              maxWidth: 780,
              letterSpacing: '-2px',
            }}
          >
            {l.hero.title1}
            <br />
            <span
              style={{
                color: '#f59e0b',
                textDecoration: 'underline',
                textDecorationStyle: 'wavy',
                textUnderlineOffset: 8,
                textDecorationThickness: 3,
                textDecorationColor: '#f59e0b',
              }}
            >
              {l.hero.title2}
            </span>
          </h1>
          <p style={{ color: '#888', fontSize: 18, lineHeight: 1.7, maxWidth: 560, margin: '0 0 36px' }}>
            {l.hero.desc}
          </p>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
            <button
              className="neo-btn"
              onClick={scrollToPricing}
              style={{
                background: '#f59e0b',
                color: '#fff',
                border: '3px solid #1a1a2e',
                padding: '16px 36px',
                borderRadius: 14,
                fontWeight: 900,
                fontSize: 16,
                cursor: 'pointer',
                boxShadow: '6px 6px 0px #1a1a2e',
                transition: 'all 0.15s',
                letterSpacing: 0.5,
              }}
            >
              {l.hero.ctaPrimary}
            </button>
            <button
              className="neo-btn"
              style={{
                background: '#fff',
                color: '#1a1a2e',
                border: '3px solid #1a1a2e',
                padding: '16px 28px',
                borderRadius: 14,
                fontWeight: 700,
                fontSize: 15,
                cursor: 'pointer',
                boxShadow: '6px 6px 0px #1a1a2e',
                transition: 'all 0.15s',
              }}
            >
              {l.hero.ctaSecondary}
            </button>
          </div>
          <div
            className="neo-border neo-shadow-sm"
            style={{
              display: 'flex',
              gap: 20,
              flexWrap: 'wrap',
              marginTop: 48,
              padding: '16px 24px',
              background: '#fff',
              borderRadius: 14,
              maxWidth: 720,
            }}
          >
            {l.hero.stats.map((stat: string, i: number) => (
              <span key={i} style={{ color: '#666', fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                {i > 0 && <span style={{ color: '#ddd', marginRight: 10 }}>|</span>}
                {stat}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* Problem / Solution */}
      <section style={{ padding: '70px 0', background: '#fff' }}>
        <div style={W}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
            <div style={{ background: '#fef2f2', border: '3px solid #fca5a5', borderRadius: 16, padding: '32px 28px', boxShadow: '5px 5px 0 #fca5a540' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{l.problem.emoji}</div>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 900, color: '#dc2626', margin: '0 0 12px', lineHeight: 1.2 }}>{l.problem.title}</h2>
              <p style={{ color: '#888', fontSize: 15, lineHeight: 1.7 }}>{l.problem.desc}</p>
            </div>
            <div style={{ background: '#ecfdf5', border: '3px solid #6ee7b7', borderRadius: 16, padding: '32px 28px', boxShadow: '5px 5px 0 #6ee7b740' }}>
              <div style={{ fontSize: 36, marginBottom: 12 }}>{l.solution.emoji}</div>
              <h2 style={{ fontSize: 'clamp(22px, 3.5vw, 28px)', fontWeight: 900, color: '#059669', margin: '0 0 12px', lineHeight: 1.2 }}>{l.solution.title}</h2>
              <p style={{ color: '#888', fontSize: 15, lineHeight: 1.7 }}>{l.solution.desc}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section style={{ padding: '70px 0', background: '#f3f4f6' }}>
        <div style={W}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: '#1a1a2e', lineHeight: 1.15, marginBottom: 12 }}>
              {l.features.title}{' '}
              <span style={{ color: '#f59e0b', textDecoration: 'underline', textDecorationStyle: 'wavy', textUnderlineOffset: 6, textDecorationThickness: 3 }}>
                {l.features.titleHighlight}
              </span>
              .
            </h2>
            <p style={{ color: '#999', fontSize: 16 }}>{l.features.subtitle}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(330px, 1fr))', gap: 20 }}>
            {l.features.items.map((f: { num: string; title: string; desc: string; icon: string; color: string }, i: number) => (
              <FeatureCard key={f.num} f={f} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section style={{ padding: '70px 0', background: '#fffbeb' }}>
        <div style={W}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: '#1a1a2e', lineHeight: 1.15, marginBottom: 12 }}>
              {l.testimonials.title}
            </h2>
            <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap', marginTop: 12 }}>
              {[
                { label: l.testimonials.npsLabel, value: l.testimonials.npsValue, color: '#10b981' },
                { label: l.testimonials.retentionLabel, value: l.testimonials.retentionValue, color: '#6366f1' },
              ].map((s, i) => (
                <span
                  key={i}
                  className="neo-border"
                  style={{ background: '#fff', borderRadius: 10, padding: '6px 16px', fontSize: 13, fontWeight: 700, color: '#888', boxShadow: '3px 3px 0 #1a1a2e' }}
                >
                  {s.label}: <strong style={{ color: s.color }}>{s.value}</strong>
                </span>
              ))}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', justifyContent: 'center' }}>
            {l.testimonials.items.map((testimonial: { name: string; role: string; text: string; avatar: string; color: string }, i: number) => (
              <TestimonialCard key={i} testimonial={testimonial} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section ref={pricingRef} style={{ padding: '80px 0 50px', background: '#eef2ff' }}>
        <div style={W}>
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: '#1a1a2e', lineHeight: 1.15, marginBottom: 12 }}>
              {l.pricing.title1}
              <br />
              {l.pricing.title2}{' '}
              <span style={{ background: '#fef3c7', padding: '2px 12px', borderRadius: 8, border: '2px solid #fcd34d', boxShadow: '3px 3px 0 #fcd34d' }}>
                {l.pricing.titleHighlight}
              </span>
              .
            </h2>
            <p style={{ color: '#888', fontSize: 16, marginBottom: 24 }}>{l.pricing.subtitle}</p>
            <div className="neo-border neo-shadow-sm" style={{ display: 'inline-flex', alignItems: 'center', gap: 14, background: '#fff', borderRadius: 14, padding: '14px 24px' }}>
              <span style={{ color: '#555', fontSize: 14, fontWeight: 700 }}>⏰ {l.pricing.countdownLabel}</span>
              <CountdownTimer big />
            </div>
          </div>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap', alignItems: 'stretch', marginTop: 40 }}>
            {l.pricing.plans.map((plan: { id: string; name: string; users: string; oldPrice: number; price: number; savingsYear: number; badge: string | null; popular: boolean; features: string[]; extra: string | null; color: string; bg: string; cta: string }) => (
              <PricingCard key={plan.id} plan={{ ...plan, savingsLabel: l.pricing.savingsLabel }} onSelect={selectPlan} />
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 28, flexWrap: 'wrap', marginTop: 32, color: '#888', fontSize: 13, fontWeight: 700 }}>
            {l.pricing.trustBadges.map((badge: string, i: number) => (
              <span key={i}>{badge}</span>
            ))}
          </div>
          <ProgressBar agenciesText={l.pricing.progressAgencies} spotsText={l.pricing.progressSpots} />
        </div>
      </section>

      {/* How It Works */}
      <section style={{ padding: '70px 0', background: '#fff' }}>
        <div style={W}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: '#1a1a2e', lineHeight: 1.15, marginBottom: 12 }}>
              {l.howItWorks.title}{' '}
              <span style={{ background: '#1a1a2e', color: '#f59e0b', padding: '2px 14px', borderRadius: 10 }}>{l.howItWorks.titleHighlight}</span>.
            </h2>
            <p style={{ color: '#999', fontSize: 16 }}>{l.howItWorks.subtitle}</p>
          </div>
          <div style={{ display: 'flex', gap: 24, justifyContent: 'center', flexWrap: 'wrap' }}>
            {l.howItWorks.steps.map((s: { step: string; title: string; desc: string; color: string; bg: string; emoji: string }, i: number) => (
              <StepCard key={i} s={s} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section style={{ padding: '70px 0', background: '#f9fafb' }}>
        <div style={{ ...W, maxWidth: 720 }}>
          <div style={{ textAlign: 'center', marginBottom: 40 }}>
            <h2 style={{ fontSize: 'clamp(28px, 5vw, 44px)', fontWeight: 900, color: '#1a1a2e', lineHeight: 1.15, marginBottom: 12 }}>
              {l.faq.title}{' '}
              <span style={{ background: '#f59e0b', color: '#fff', padding: '2px 16px', borderRadius: 10, border: '2px solid #1a1a2e', boxShadow: '3px 3px 0 #1a1a2e' }}>
                {l.faq.titleHighlight}
              </span>
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {l.faq.items.map((item: { q: string; a: string }, i: number) => (
              <NeoFAQItem key={i} question={item.q} answer={item.a} index={i} />
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section style={{ padding: '80px 0', background: '#1a1a2e', position: 'relative', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: -60, right: -60, width: 220, height: 220, background: '#f59e0b', borderRadius: '50%', opacity: 0.08 }} />
        <div style={{ position: 'absolute', bottom: -40, left: -40, width: 180, height: 180, background: '#6366f1', borderRadius: 30, opacity: 0.08, transform: 'rotate(15deg)' }} />
        <div style={{ ...W, textAlign: 'center', position: 'relative' }}>
          <h2 style={{ fontSize: 'clamp(30px, 5vw, 52px)', fontWeight: 900, lineHeight: 1.1, margin: '0 0 16px', color: '#fff' }}>
            {l.finalCta.title1}
            <br />
            <span style={{ color: '#f59e0b' }}>{l.finalCta.title2}</span>
          </h2>
          <p style={{ color: '#aaa', fontSize: 17, marginBottom: 36 }}>{l.finalCta.desc}</p>
          <button
            className="neo-btn"
            onClick={scrollToPricing}
            style={{
              background: '#f59e0b',
              color: '#fff',
              border: '3px solid #fff',
              padding: '18px 48px',
              borderRadius: 14,
              fontWeight: 900,
              fontSize: 18,
              cursor: 'pointer',
              boxShadow: '6px 6px 0 rgba(255,255,255,0.2)',
              transition: 'all 0.15s',
              letterSpacing: 0.5,
            }}
          >
            {l.finalCta.button}
          </button>
          <div style={{ color: '#888', fontSize: 13, marginTop: 20 }}>{l.finalCta.footer}</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="neo-border" style={{ borderLeft: 'none', borderRight: 'none', borderBottom: 'none', padding: '40px 0 32px', background: '#fafaf8' }}>
        <div style={{ ...W, textAlign: 'center' }}>
          <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 6, color: '#1a1a2e' }}>GetNearMe</div>
          <div style={{ color: '#bbb', fontSize: 13, marginBottom: 24 }}>{t.footer.desc}</div>
          <div style={{ color: '#ddd', fontSize: 12 }}>© 2026 GetNearMe. {t.footer.rights}</div>
        </div>
      </footer>

      <SocialPopup messages={l.popups} />

      {/* Modal */}
      {showModal && (
        <div
          onClick={() => setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(6px)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="neo-border"
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '44px 36px',
              maxWidth: 440,
              width: '100%',
              textAlign: 'center',
              boxShadow: '8px 8px 0 #1a1a2e',
            }}
          >
            <div style={{ fontSize: 44, marginBottom: 16 }}>{l.modal.emoji}</div>
            <h3 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 10px', color: '#1a1a2e' }}>
              {l.modal.title}
              <br />
              {l.modal.planLabel} {selectedPlanData?.name}
            </h3>
            <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6, margin: '0 0 28px' }}>
              {l.modal.desc}
              <br />
              <strong style={{ color: '#1a1a2e' }}>{l.modal.descBold}</strong> {l.modal.descEnd}
            </p>
            <a
              href={`https://chromewebstore.google.com/detail/getnearme-%E2%80%93-valuta-il-qua/jbnceigldmpkpplanjlednlehloaeoia?plan=${selectedPlan}`}
              target="_blank"
              rel="noopener noreferrer"
              className="neo-btn"
              style={{
                display: 'inline-block',
                background: '#f59e0b',
                color: '#fff',
                padding: '16px 36px',
                borderRadius: 14,
                fontWeight: 900,
                fontSize: 16,
                textDecoration: 'none',
                border: '3px solid #1a1a2e',
                boxShadow: '6px 6px 0px #1a1a2e',
                transition: 'all 0.15s',
              }}
            >
              {l.modal.cta}
            </a>
            <div style={{ color: '#bbb', fontSize: 12, marginTop: 16 }}>{l.modal.footer}</div>
          </div>
        </div>
      )}
    </div>
  );
}
