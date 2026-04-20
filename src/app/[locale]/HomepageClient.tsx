'use client';

import { useState } from 'react';
import { Icon } from '@/lib/icons';
import CountdownTimer from '@/components/neo/CountdownTimer';
import SocialPopup from '@/components/neo/SocialPopup';
import NeoFAQItem from '@/components/neo/NeoFAQItem';
import TestimonialCard from '@/components/neo/TestimonialCard';
import PricingCard from '@/components/neo/PricingCard';
import ProgressBar from '@/components/neo/ProgressBar';
import RevealSection from '@/components/neo/RevealSection';

interface HomepageClientProps {
  variant: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
}

function FeatureCardClient({
  f,
  index,
  videoSrc,
}: {
  f: { num: string; title: string; desc: string; icon: string; color: string };
  index: number;
  videoSrc?: string;
}) {
  const [hovered, setHovered] = useState(false);

  return (
    <RevealSection delay={index * 70} className="h-full">
      <div
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="neo-border"
        style={{
          background: '#fff',
          borderRadius: 16,
          overflow: 'hidden',
          boxShadow: hovered ? '8px 8px 0px #1a1a2e' : '6px 6px 0px #1a1a2e',
          transform: hovered ? 'translate(-2px,-4px)' : 'translate(0,0)',
          transition: 'all 0.35s cubic-bezier(0.34,1.56,0.64,1)',
          cursor: 'default',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {videoSrc && (
          <div style={{ padding: 8 }}>
            <div
              style={{
                background: '#f8fafc',
                borderRadius: 12,
                overflow: 'hidden',
                border: '2px solid #e2e8f0',
                aspectRatio: '16 / 10',
              }}
            >
              {/\.(png|jpe?g|webp|gif)$/i.test(videoSrc) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={videoSrc}
                  alt={f.title}
                  className="w-full h-full"
                  style={{ objectFit: 'cover', display: 'block' }}
                />
              ) : (
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full"
                  style={{ objectFit: 'cover', display: 'block' }}
                >
                  <source src={videoSrc} type="video/mp4" />
                </video>
              )}
            </div>
          </div>
        )}
        <div style={{ padding: '20px 24px 28px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
            <span
              style={{
                width: 50,
                height: 50,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${f.color}15`,
                borderRadius: 14,
                border: `2px solid ${f.color}40`,
                color: f.color,
              }}
            >
              <Icon name={f.icon} size={24} />
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
          <h3
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: '#1a1a2e',
              margin: '0 0 8px',
              lineHeight: 1.3,
            }}
          >
            {f.title}
          </h3>
          <p style={{ color: '#888', fontSize: 14, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
        </div>
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
          maxWidth: 300,
          background: s.bg,
          borderRadius: 16,
          padding: '32px 24px',
        }}
      >
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
        <h3 style={{ fontSize: 18, fontWeight: 800, color: '#1a1a2e', margin: '0 0 8px' }}>
          {s.title}
        </h3>
        <p style={{ color: '#999', fontSize: 14, margin: 0, lineHeight: 1.6 }}>{s.desc}</p>
      </div>
    </RevealSection>
  );
}

function PricingSection({
  data,
  locale,
}: {
  locale: string;
  data: {
    title1: string;
    title2: string;
    titleHighlight: string;
    subtitle: string;
    countdownLabel: string;
    trustBadges: string[];
    savingsLabel: string;
    progressAgencies: string;
    progressSpots: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    plans: any[];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    modal: any;
  };
}) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);

  const selectPlan = (id: string) => {
    setSelectedPlan(id);
    setShowModal(true);
  };

  const selectedPlanData = data.plans.find(
    (p: { id: string }) => p.id === selectedPlan
  );

  return (
    <>
      <section
        id="pricing"
        className="scroll-mt-32"
        style={{ padding: '80px 0 50px', background: '#eef2ff' }}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-3">
          <div style={{ textAlign: 'center', marginBottom: 20 }}>
            <h2
              style={{
                fontSize: 'clamp(28px, 5vw, 44px)',
                fontWeight: 900,
                color: '#1a1a2e',
                lineHeight: 1.15,
                marginBottom: 12,
              }}
            >
              {data.title1}
              <br />
              {data.title2}{' '}
              {/* <span
                style={{
                  background: '#fef3c7',
                  padding: '2px 12px',
                  borderRadius: 8,
                  border: '2px solid #fcd34d',
                  boxShadow: '3px 3px 0 #fcd34d',
                }}
              > */}
              {data.titleHighlight}
              {/* </span> */}
              .
            </h2>
            <p style={{ color: '#888', fontSize: 16, marginBottom: 24 }}>{data.subtitle}</p>
            <div
              className="neo-border neo-shadow-sm"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 14,
                background: '#fff',
                borderRadius: 14,
                padding: '14px 24px',
              }}
            >
              <span style={{ color: '#555', fontSize: 14, fontWeight: 700 }}>
                ⏰ {data.countdownLabel}
              </span>
              <CountdownTimer big />
            </div>
          </div>

          <div
            className="grid grid-cols-1 md:grid-cols-3 items-end gap-6 mt-10"
          >
            {data.plans.map(
              (plan: {
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
              }) => (
                <PricingCard
                  key={plan.id}
                  plan={{ ...plan, savingsLabel: data.savingsLabel }}
                  onSelect={selectPlan}
                />
              )
            )}
          </div>

          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 28,
              flexWrap: 'wrap',
              marginTop: 32,
              color: '#888',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            {data.trustBadges.map((badge: string, i: number) => {
              const iconMap: Record<string, string> = { '🔒': 'lock', '💳': 'credit-card', '📈': 'trending-up' };
              const firstChar = [...badge][0] || '';
              const iconName = iconMap[firstChar];
              const text = iconName ? badge.slice(firstChar.length).trim() : badge;
              return (
                <span key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                  {iconName && <Icon name={iconName} size={16} color="#1a1a2e" />}
                  {text}
                </span>
              );
            })}
          </div>

          <ProgressBar agenciesText={data.progressAgencies} spotsText={data.progressSpots} />
        </div>
      </section>

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
            <div style={{ fontSize: 44, marginBottom: 16 }}>{data.modal.emoji}</div>
            <h3 style={{ fontSize: 24, fontWeight: 900, margin: '0 0 10px', color: '#1a1a2e' }}>
              {data.modal.title}
              <br />
              {data.modal.planLabel} {selectedPlanData?.name}
            </h3>
            <p style={{ color: '#888', fontSize: 14, lineHeight: 1.6, margin: '0 0 28px' }}>
              {data.modal.desc}
              <br />
              <strong style={{ color: '#1a1a2e' }}>{data.modal.descBold}</strong> {data.modal.descEnd}
            </p>
            <a
              href={`/${locale}/checkout/agency?plan=${selectedPlan}`}
              className="neo-btn"
              style={{
                display: 'inline-block',
                background: '#f59e0b',
                color: '#1a1a2e',
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
              {data.modal.cta}
            </a>
            <div style={{ color: '#bbb', fontSize: 12, marginTop: 16 }}>{data.modal.footer}</div>
          </div>
        </div>
      )}
    </>
  );
}

export default function HomepageClient(props: HomepageClientProps) {
  const { variant } = props;

  switch (variant) {
    case 'countdown-inline':
      return <CountdownTimer />;

    case 'social-popup':
      return <SocialPopup messages={props.popupMessages} />;

    case 'feature-card':
      return (
        <FeatureCardClient
          f={props.featureData}
          index={props.index}
          videoSrc={props.videoSrc}
        />
      );

    case 'testimonial':
      return <TestimonialCard testimonial={props.testimonialData} index={props.index} />;

    case 'faq-item':
      return (
        <NeoFAQItem
          question={props.faqData.q}
          answer={props.faqData.a}
          index={props.index}
        />
      );

    case 'step-card':
      return <StepCard s={props.stepData} index={props.index} />;

    case 'pricing-section':
      return <PricingSection data={props.pricingData} locale={props.locale} />;

    default:
      return null;
  }
}
