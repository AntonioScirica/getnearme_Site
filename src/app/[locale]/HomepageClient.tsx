'use client';

import { useState, useEffect } from 'react';
import { Icon } from '@/lib/icons';
import CountdownTimer from '@/components/neo/CountdownTimer';
import SocialPopup from '@/components/neo/SocialPopup';
import NeoFAQItem from '@/components/neo/NeoFAQItem';
import TestimonialCard from '@/components/neo/TestimonialCard';
import PricingCard from '@/components/neo/PricingCard';
import ProgressBar from '@/components/neo/ProgressBar';
import RevealSection from '@/components/neo/RevealSection';
import FeatureShowcase from '@/components/neo/FeatureShowcase';
import { supabase } from '@/lib/supabase';
import LazyVideo from '@/components/LazyVideo';

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
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: hovered ? '0 12px 32px rgba(59,131,246,0.12)' : '0 6px 20px rgba(16,24,40,0.06)',
          borderColor: hovered ? '#bfdbfe' : undefined,
          transform: hovered ? 'translateY(-4px)' : 'translateY(0)',
          transition: 'all .3s cubic-bezier(0.4, 0, 0.2, 1)',
          cursor: 'default',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {videoSrc && (
          <div style={{ padding: 7 }}>
            <div
              style={{
                background: '#f8fafc',
                borderRadius: 11,
                overflow: 'hidden',
                border: '1px solid #e2e8f0',
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
                <LazyVideo
                  src={videoSrc}
                  className="w-full h-full"
                  style={{ objectFit: 'cover', display: 'block' }}
                />
              )}
            </div>
          </div>
        )}
        <div style={{ padding: '18px 22px 25px', flex: 1, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 11, marginBottom: 13 }}>
            <span
              style={{
                width: 36,
                height: 36,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: `${f.color}15`,
                borderRadius: 11,
                border: `1px solid ${f.color}25`,
                color: f.color,
              }}
            >
              <Icon name={f.icon} size={18} />
            </span>
          </div>
          <h3
            style={{
              fontSize: 16,
              fontWeight: 700,
              color: '#1a1a2e',
              margin: '0 0 7px',
              lineHeight: 1.3,
            }}
          >
            {f.title}
          </h3>
          <p style={{ color: '#333', fontSize: 13, lineHeight: 1.65, margin: 0 }}>{f.desc}</p>
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
          maxWidth: 270,
          height: '100%',
          background: s.bg,
          borderRadius: 14,
          padding: '29px 22px',
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            width: 40,
            height: 40,
            borderRadius: 11,
            background: s.color,
            color: '#fff',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 18,
            border: '1px solid rgba(26,26,46,0.10)',
            boxShadow: '0 2px 10px rgba(16,24,40,0.06)',
            marginBottom: 14,
          }}
        >
          {s.step}
        </div>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: '#1a1a2e', margin: '0 0 7px' }}>
          {s.title}
        </h3>
        <p style={{ color: '#444', fontSize: 13, fontWeight: 500, margin: 0, lineHeight: 1.6 }}>
          {s.desc.includes('Chrome Web Store') ? (
            <>
              {s.desc.split('Chrome Web Store')[0]}
              <a href="https://chromewebstore.google.com/detail/getnearme-%E2%80%94-valuta-il-qua/jbnceigldmpkpplanjlednlehloaeoia" target="_blank" rel="noopener noreferrer" style={{ color: '#6366f1', fontWeight: 600, textDecoration: 'none' }}>Chrome Web Store</a>
              {s.desc.split('Chrome Web Store')[1]}
            </>
          ) : s.desc}
        </p>
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
    plansByTier?: { individual: any[]; agency: any[] };
    tierToggle?: { individual: string; agency: string };
  };
}) {
  const [tier, setTier] = useState<'individual' | 'agency'>('individual');
  const tierLabels = data.tierToggle ?? { individual: 'Individuale', agency: 'Agenzia' };
  const activePlans = data.plansByTier ? data.plansByTier[tier] : data.plans;
  // Agenzia seat-based: slider utenti condiviso tra card mensile e annuale.
  // Quote proporzionali: 400 foto/utente, 2,4 video/utente (arrotondato).
  const [seats, setSeats] = useState(2);
  // ⟦...⟧ marca i numeri che cambiano con lo slider, per renderizzarli
  // in semibold (vedi renderSeatFeature) cosi' si nota subito che sono cambiati.
  const seatMark = (n: number) => (seats > 2 ? `⟦${n}⟧` : String(n));
  const seatTokens = (s: string) => s
    .replace('{users}', seatMark(seats))
    .replace('{photos}', seatMark(400 * seats))
    .replace('{videos}', seatMark(Math.round(2.4 * seats)));
  const renderSeatFeature = (f: string) =>
    f.split(/⟦(\d+)⟧/).map((part, i) => (i % 2 === 1 ? <strong key={i} style={{ fontWeight: 700 }}>{part}</strong> : part));
  const freeLabel =
    ({ it: 'Gratis', en: 'Free', es: 'Gratis', fr: 'Gratuit', ru: 'Бесплатно', uk: 'Безкоштовно' } as Record<string, string>)[locale] ?? 'Gratis';

  useEffect(() => {
    if (window.location.hash === '#pricing') {
      setTimeout(() => {
        document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    }
  }, []);

  // Piano attuale dell'utente loggato: marca quella card come "attuale" e manda
  // alla dashboard invece che al checkout. subscription_type == plan.id (stessi
  // valori: individual_monthly | individual_annual | agency_monthly | agency_annual).
  const [currentPlan, setCurrentPlan] = useState<string | null>(null);
  useEffect(() => {
    let active = true;
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!active || !session?.user) return;
      const { data } = await supabase
        .from('user_credits')
        .select('subscription_type')
        .eq('user_id', session.user.id)
        .single();
      // Free senza riga/NULL ⇒ 'free' (come fa metrics: subscription_type || 'free').
      if (active) setCurrentPlan(data?.subscription_type || 'free');
    });
    return () => { active = false; };
  }, []);

  return (
    <>
      <section
        id="pricing"
        className="scroll-mt-48"
        style={{ padding: '72px 0 72px', background: '#fff' }}
      >
        <div className="max-w-7xl mx-auto px-5 md:px-3">
          <div style={{ textAlign: 'center', marginBottom: 18 }}>
            <h2
              style={{
                fontSize: 'clamp(23px, 4.5vw, 34px)',
                fontWeight: 800,
                color: '#1a1a2e',
                lineHeight: 1.15,
                marginBottom: 11,
              }}
            >
              {locale === 'it' ? (
                // Copy IT: su mobile va a capo 3 righe (semplifica | le attivita' per |
                // concentrarti sulle vendite), su desktop 2 (dopo "attivita'"). I <br>
                // responsive spezzano nei punti giusti a seconda del breakpoint.
                <>
                  Velocizza e semplifica{' '}
                  <br className="md:hidden" />
                  le attività{' '}
                  <br className="hidden md:block" />
                  per{' '}
                  <br className="md:hidden" />
                  concentrarti sulle <span style={{ color: '#3B83F6' }}>vendite</span>.
                </>
              ) : (
                <>
                  {data.title1}
                  <br />
                  {data.title2}{' '}
                  <span style={{ color: '#3B83F6' }}>{data.titleHighlight}</span>
                  {data.titleHighlight ? '.' : ''}
                </>
              )}
            </h2>
            <p style={{ color: '#333', fontSize: 14, marginBottom: 22 }}>{data.subtitle}</p>
            <div
              className="neo-border neo-shadow-sm pricing-countdown-box"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 13,
                background: '#fff',
                borderRadius: 13,
                padding: '13px 22px',
              }}
            >
              <span style={{ color: '#555', fontSize: 13, fontWeight: 700 }}>
                🔔 {data.countdownLabel}
              </span>
              <CountdownTimer big />
            </div>
          </div>

          {data.plansByTier && (
            <div style={{ display: 'flex', justifyContent: 'center', marginTop: 25 }}>
              <div
                role="tablist"
                aria-label="Plan tier"
                style={{
                  display: 'inline-flex',
                  background: '#eff6ff',
                  border: '1px solid rgba(37,99,235,0.20)',
                  borderRadius: 999,
                  padding: 4,
                  gap: 4,
                }}
              >
                {(['individual', 'agency'] as const).map((t) => {
                  const active = tier === t;
                  return (
                    <button
                      key={t}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setTier(t)}
                      style={{
                        appearance: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        padding: '9px 22px',
                        borderRadius: 999,
                        fontSize: 14,
                        fontWeight: 700,
                        letterSpacing: 0.2,
                        background: active ? '#2563EB' : 'transparent',
                        color: active ? '#fff' : '#2563EB',
                        boxShadow: active ? '0 2px 10px rgba(37,99,235,0.30)' : 'none',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      {tierLabels[t]}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div
            className="grid grid-cols-1 md:grid-cols-3 items-stretch gap-14 md:gap-6 mt-10"
          >
            {(() => {
              const plans = activePlans as {
                id: string; name: string; users: string; oldPrice: number;
                price: number; savingsYear: number; badge: string | null;
                popular: boolean; features: string[]; extra: string | null;
                color: string; bg: string; cta: string; period?: string;
                priceNote?: string | null;
              }[];
              const maxFeatures = Math.max(...plans.map((p) => p.features.length));
              return plans.map((plan) => {
                const isSeatBased = plan.id === 'agency_monthly' || plan.id === 'agency_annual';
                const padded = [...plan.features].map(f => isSeatBased ? seatTokens(f) : f);
                while (padded.length < maxFeatures) padded.push('');
                // Seat-based: il prezzo grande e' il TOTALE (per-utente × N); il period perde
                // il suffisso "a utente" (primo token = "/mese", "/month", ... in tutti i locali).
                const price = isSeatBased ? plan.price * seats : plan.price;
                const oldPrice = isSeatBased && plan.oldPrice ? plan.oldPrice * seats : plan.oldPrice;
                const period = isSeatBased ? (plan.period ?? '/mese').split(' ')[0] : plan.period;
                const priceNote = isSeatBased ? null : plan.priceNote;
                const isCurrent = !!currentPlan && plan.id === currentPlan;
                // Loggato: il piano attuale è il riferimento, quindi niente "Più scelto".
                const popular = currentPlan ? false : plan.popular;
                const badge = currentPlan ? null : plan.badge;
                const isCustom = plan.id === 'agency_custom';
                return (
                  <PricingCard
                    key={plan.id}
                    plan={{ ...plan, price, oldPrice, period, popular, badge, features: padded, priceNote, savingsLabel: data.savingsLabel, freeLabel: isCustom ? plan.name : freeLabel }}
                    href={isCurrent ? `/${locale}/dashboard` : plan.price === 0 ? `/${locale}/checkout/agency` : `/${locale}/checkout/agency?plan=${plan.id}${isSeatBased ? `&seats=${seats}` : ''}`}
                    current={isCurrent}
                    seats={isSeatBased ? seats : undefined}
                    onSeatsChange={isSeatBased ? setSeats : undefined}
                    calLink={isCustom ? 'getnearme/30min' : undefined}
                  />
                );
              });
            })()}
          </div>

          {/* <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              gap: 28,
              flexWrap: 'wrap',
              marginTop: 32,
              color: '#333',
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
          </div> */}

          {/* <ProgressBar agenciesText={data.progressAgencies} spotsText={data.progressSpots} /> */}
        </div>
      </section>
      <style>{`
        @media (max-width: 768px) {
          .pricing-countdown-box {
            flex-direction: column !important;
            gap: 12px !important;
            padding: 14px 20px !important;
            width: 100% !important;
            display: flex !important;
            box-sizing: border-box !important;
          }
        }
      `}</style>
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

    case 'feature-showcase':
      return (
        <FeatureShowcase
          feature={props.featureData}
          index={props.index}
          videoSrc={props.videoSrc}
          reverse={props.reverse}
        />
      );


    case 'pricing-section':
      return <PricingSection data={props.pricingData} locale={props.locale} />;

    default:
      return null;
  }
}
